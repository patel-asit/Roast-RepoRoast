 export interface GitHubFetchError {
  error: true;
  status: number;
  message: string;
}

export async function ghFetch<T>(path: string): Promise<T> {
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
          ? "GitHub API rate limit hit. Try again in a minute."
          : `GitHub API error: ${res.status}`,
    };
    throw err;
  }

  return res.json();
}
