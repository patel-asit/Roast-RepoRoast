/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/analyze-tree.ts

import { ghFetch } from "./gh-fetch";

// ------------------------------------------------------------------ //
// Config
// ------------------------------------------------------------------ //

const MAX_FILES_TO_RETURN = 10;
const MAX_FILE_CONTENT_CHARS = 3000; // per file, ~750 tokens
const MAX_TREE_ENTRIES_TO_MISTRAL = 300; // cap before sending to LLM

// Directories and patterns to strip from the tree before anything else.
// Covers node_modules, build artifacts, lock files, media, etc.
const NOISE_DIR_PREFIXES = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  ".next/",
  "out/",
  "__pycache__/",
  ".pytest_cache/",
  "venv/",
  ".venv/",
  "env/",
  ".env/",
  "vendor/",       // PHP / Go
  "target/",       // Rust / Java Maven
  ".gradle/",
  "Pods/",         // iOS CocoaPods
  "DerivedData/",
  ".dart_tool/",
  "coverage/",
  ".nyc_output/",
  "storybook-static/",
  ".turbo/",
  ".cache/",
  "tmp/",
  "temp/",
];

const NOISE_FILE_EXTENSIONS = new Set([
  // Lock files
  "lock", "sum",
  // Media
  "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "avif",
  "mp4", "mp3", "wav", "ogg", "mov", "avi",
  "ttf", "woff", "woff2", "eot", "otf",
  // Compiled / binary
  "pyc", "pyo", "class", "jar", "war", "dll", "so", "dylib", "exe",
  "min.js", "min.css",
  // Data dumps
  "csv", "sql", "db", "sqlite", "sqlite3",
  // Docs that aren't READMEs
  "pdf", "docx", "xlsx", "pptx",
]);

const NOISE_EXACT_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "Gemfile.lock",
  "Cargo.lock",
  "poetry.lock",
  "composer.lock",
  "go.sum",
  ".DS_Store",
  "Thumbs.db",
]);

// ------------------------------------------------------------------ //
// Types
// ------------------------------------------------------------------ //

interface TreeEntry {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

interface MistralFileSelection {
  files: string[];
}

export interface FileContent {
  path: string;
  content: string;
  truncated: boolean;
}

export interface FileTreeResult {
  files: FileContent[];
  raw_tree: string[];
}

// ------------------------------------------------------------------ //
// Helpers
// ------------------------------------------------------------------ //

function isNoisyPath(path: string): boolean {
  // Check if any segment of the path matches a noise directory
  if (NOISE_DIR_PREFIXES.some((prefix) => {
    const dir = prefix.replace(/\/$/, ""); // e.g. "node_modules"
    return path.startsWith(prefix) || path.includes(`/${dir}/`);
  })) return true;

  const filename = path.split("/").pop() ?? "";

  if (NOISE_EXACT_FILES.has(filename)) return true;

  const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : "";
  if (ext && NOISE_FILE_EXTENSIONS.has(ext)) return true;

  // Skip very deep paths (likely generated/nested dependencies)
  if (path.split("/").length > 8) return true;

  return false;
}

async function ghRawFetch(
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
    );
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

async function fetchFileTree(
  owner: string,
  repo: string,
  branch: string
): Promise<TreeEntry[]> {
  const data = await ghFetch<any>(
    `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );

  // data.truncated will be true for massive repos (>100k entries) — handle gracefully
  const entries: TreeEntry[] = (data.tree ?? []).filter(
    (e: any) => e.type === "blob"
  );

  return entries;
}

async function pickImportantFiles(
  filteredPaths: string[]
): Promise<MistralFileSelection> {
  const mistralKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
  if (!mistralKey) throw new Error("NEXT_PUBLIC_MISTRAL_API_KEY not set");

  const prompt = `You are analyzing a GitHub repository file tree to identify the most important files for understanding what the project does and how it is structured.

File tree (already filtered, noise removed):
${filteredPaths.slice(0, MAX_TREE_ENTRIES_TO_MISTRAL).join("\n")}

Your job: Pick up to ${MAX_FILES_TO_RETURN} files that would give the best insight into:
- What the project does (entry points, main modules, core logic)
- How it is configured (config files, environment setup)
- Its quality and structure (tests, CI, linting)

Rules:
- Prefer entry points (main.py, index.ts, app.tsx, server.js, main.rs, etc.)
- Include key config files (Dockerfile, .github/workflows, tsconfig.json, pyproject.toml, etc.)
- Include at least one test file if present
- Skip files that are clearly generated, vendored, or boilerplate
- Account for all language ecosystems (JS/TS, Python, Rust, Go, Ruby, Java, etc.)

Respond ONLY with valid JSON in this exact shape:
{
  "files": ["path/to/file1", "path/to/file2"]
}`;

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mistralKey}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      temperature: 0,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Mistral API error: ${res.status}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";

  // Strip markdown fences if model wraps in ```json
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as MistralFileSelection;
}

// ------------------------------------------------------------------ //
// Main Export
// ------------------------------------------------------------------ //

export async function grabFileTreeAndImportantFileContents(
  owner: string,
  repo: string,
  branch: string = "main",
): Promise<FileTreeResult> {
  
  // 1. Fetch full recursive tree from GitHub
  let allEntries: TreeEntry[];
  try {
    allEntries = await fetchFileTree(owner, repo, branch);
  } catch {
    // Try 'master' as fallback if 'main' fails
    allEntries = await fetchFileTree(owner, repo, "master");
  }

  // 2. Filter out noise
  const cleanPaths = allEntries
    .map((e) => e.path)
    .filter((p) => !isNoisyPath(p));

  if (cleanPaths.length === 0) {
    throw new Error("No meaningful files found in repo.");
  }

  // 3. Ask Mistral to pick the important files
  const selection = await pickImportantFiles(cleanPaths);
  const chosenPaths = selection.files.slice(0, MAX_FILES_TO_RETURN);

  // 4. Fetch actual file contents from GitHub raw in parallel
  const contentResults = await Promise.allSettled(
    chosenPaths.map((path) => ghRawFetch(owner, repo, path, branch))
  );

  const fileContents: FileContent[] = chosenPaths
    .map((path, i) => {
      const result = contentResults[i];
      const raw = result.status === "fulfilled" ? result.value : null;
      if (!raw) return null;

      const truncated = raw.length > MAX_FILE_CONTENT_CHARS;
      return {
        path,
        content: truncated ? raw.slice(0, MAX_FILE_CONTENT_CHARS) + "\n... [truncated]" : raw,
        truncated,
      };
    })
    .filter((f): f is FileContent => f !== null);

  // Build a compact representation of the raw tree for the main LLM.
  // Unfiltered so it can spot committed node_modules, .env files, secrets, etc
  // Capped at 500 to avoid blowing context.
  const rawTreeSnapshot = allEntries
    .map((e) => e.path)
    .slice(0, 500);

  return {
    files: fileContents,
    raw_tree: rawTreeSnapshot,
  };
}