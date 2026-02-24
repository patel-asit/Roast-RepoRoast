/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/github.ts
// Client-side GitHub API calls (uses user's IP, no auth needed for public repos)

import { grabFileTreeAndImportantFileContents, type FileContent } from "./filetree";
import { githubFetch, type GitHubFetchError } from "./github-fetch";

export type { GitHubFetchError };

export interface RepoSummary {
  name: string;
  owner: string;
  description: string | null;
  languages: string[];
  stars: number;
  forks: number;
  open_issues: number;
  contributor_count: number;
  created_at: string;
  current_date: string;
  last_pushed_at: string;
  license_name: string | null;
  readme: string | null;
  recent_commit_messages: string[];
  is_archived: boolean;
  file_tree: string[];
  file_contents: FileContent[];
}

// extracts the owner and repo name from various GitHub URL formats
export function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const cleaned = input.trim().replace(/\.git$/, "");
  const match = cleaned.match(/github\.com\/([^\/]+)\/([^\/\s?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}


export interface RoastResult {
  roast: string;
  verdict: string;
}

export async function fetchRoast(
  repoSummary: RepoSummary,
  profanity: boolean
): Promise<RoastResult | GitHubFetchError> {
  const serverUrl = process.env.NEXT_PUBLIC_REPO_ROAST_SERVER_URL ?? "http://localhost:5000";
  try {
    const res = await fetch(`${serverUrl}/roast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_summary: repoSummary, profanity }),
    });
    if (!res.ok) throw new Error(`Roast server error: ${res.status}`);
    return res.json() as Promise<RoastResult>;
  } catch (err: any) {
    return { error: true, status: 500, message: err?.message ?? "Failed to fetch roast." };
  }
}

// Main function to fetch all repo data
export async function fetchRepoSummary(
  githubUrl: string
): Promise<RepoSummary | GitHubFetchError> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    return { error: true, status: 400, message: "Invalid GitHub URL." };
  }

  if (parsed.repo.toLowerCase() === "reporoast") {
    return {
      error: true,
      status: 400,
      message: "RepoRoast is too perfect to roast. Please choose another repo",
    };
  }

  if (parsed.owner.toLowerCase() === "hkhan701") {
    return {
      error: true,
      status: 400,
      message: "Did you really think I'd let you roast my personal repos? Try someone else's code, coward",
    };
  }

  const { owner, repo } = parsed;
  const base = `/repos/${owner}/${repo}`;

  try {
    const [repoData, languageData, contributors, commits, readmeData] =
      await Promise.allSettled([
        githubFetch<any>(base),
        githubFetch<Record<string, number>>(`${base}/languages`),
        githubFetch<any[]>(`${base}/contributors?per_page=10&anon=true`),
        githubFetch<any[]>(`${base}/commits?per_page=10`),
        githubFetch<any>(`${base}/readme`),
      ]);

    if (repoData.status === "rejected") throw repoData.reason;

    const r = repoData.value;

    // Decode README, strip images and HTML, keep plain text
    let readme: string | null = null;
    if (readmeData.status === "fulfilled") {
      try {
        const decoded = atob(readmeData.value.content.replace(/\n/g, ""));
        readme = decoded
          .replace(/!\[.*?\]\(.*?\)/g, "")         // remove markdown images
          .replace(/<img[^>]*>/gi, "")              // remove HTML images
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // flatten links to text
          .trim();
      } catch {
        readme = null;
      }
    }

    const filetree = await grabFileTreeAndImportantFileContents(owner, repo, r.default_branch);

    return {
      name: r.name,
      owner: r.owner?.login ?? owner,
      description: r.description ?? null,
      languages:
        languageData.status === "fulfilled"
          ? Object.keys(languageData.value)
          : [],
      stars: r.stargazers_count ?? 0,
      forks: r.forks_count ?? 0,
      open_issues: r.open_issues_count ?? 0,
      contributor_count:
        contributors.status === "fulfilled" ? contributors.value.length : 0,
      created_at: r.created_at,
      current_date: new Date().toISOString(),
      last_pushed_at: r.pushed_at,
      license_name: r.license?.name ?? null,
      readme,
      recent_commit_messages:
        commits.status === "fulfilled"
          ? commits.value.map((c: any) => c.commit?.message?.split("\n")[0] ?? "").filter(Boolean)
          : [],
      is_archived: r.archived ?? false,
      file_tree: filetree.raw_tree,
      file_contents: filetree.files,
    };
  } catch (err: any) {
    if (err?.error) return err as GitHubFetchError;
    return {
      error: true,
      status: 500,
      message: err?.message ?? "Unknown error fetching repo data.",
    };
  }
}