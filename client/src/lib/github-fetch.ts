// The githubFetch function is a simple wrapper around the Fetch API to call GitHub's REST API. 
// It handles errors and returns JSON data.

export interface GitHubFetchError {
  error: true;
  status: number;
  message: string;
}

export async function githubFetch<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!res.ok) {
    const err: GitHubFetchError = {
      error: true,
      status: res.status,
      message:
        res.status === 404
          ? "Repository not found or is private."
          : res.status === 403
          ? "GitHub API rate limit hit. Try again in a minute or two."
          : `GitHub API error: ${res.status}`,
    };
    throw err;
  }

  return res.json();
}
