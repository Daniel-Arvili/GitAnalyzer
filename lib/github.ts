const GITHUB_API = "https://api.github.com";
export const MAX_REPOSITORIES = 35;

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  readme: string | null;
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "RepoScope",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
    cache: "no-store",
  });

  if (response.status === 404) throw new Error("GITHUB_USER_NOT_FOUND");
  if (response.status === 403) throw new Error("GITHUB_RATE_LIMIT");
  if (!response.ok) throw new Error("GITHUB_REQUEST_FAILED");
  return response.json() as Promise<T>;
}

export async function fetchGitHubProfile(username: string) {
  const user = await githubFetch<GitHubUser>(`/users/${encodeURIComponent(username)}`);
  const repositories: Omit<GitHubRepository, "readme">[] = [];

  for (let page = 1; ; page += 1) {
    const batch = await githubFetch<Omit<GitHubRepository, "readme">[]>(
      `/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated&type=public`,
    );
    repositories.push(...batch);
    if (batch.length < 100) break;
  }

  const repositoriesToAnalyze = repositories.slice(0, MAX_REPOSITORIES);
  const withReadmes = await mapWithConcurrency(repositoriesToAnalyze, 8, async (repository) => ({
    ...repository,
    readme: await fetchReadme(repository.full_name),
  }));

  return { user, repositories: withReadmes, totalRepositories: repositories.length };
}

async function fetchReadme(fullName: string): Promise<string | null> {
  const response = await fetch(`${GITHUB_API}/repos/${fullName}/readme`, {
    headers: { ...githubHeaders(), Accept: "application/vnd.github.raw+json" },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (response.status === 403) throw new Error("GITHUB_RATE_LIMIT");
  if (!response.ok) return null;
  return (await response.text()).slice(0, 12_000);
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
