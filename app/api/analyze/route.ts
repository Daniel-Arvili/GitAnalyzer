import { fetchGitHubProfile } from "@/lib/github";
import { assessRepositories } from "@/lib/openai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { profile?: unknown };
    const username = parseGitHubUsername(body.profile);
    if (!username) {
      return Response.json({ error: "Enter a valid GitHub username or profile URL." }, { status: 400 });
    }

    const { user, repositories } = await fetchGitHubProfile(username);
    if (repositories.length === 0) {
      return Response.json({ error: "This profile has no public repositories to analyze." }, { status: 404 });
    }

    const assessments = await assessRepositories(repositories);
    return Response.json({
      user: {
        username: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        profileUrl: user.html_url,
      },
      repositories: assessments,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const knownErrors: Record<string, { status: number; message: string }> = {
      GITHUB_USER_NOT_FOUND: { status: 404, message: "We couldn’t find that GitHub profile." },
      GITHUB_RATE_LIMIT: { status: 429, message: "GitHub’s request limit was reached. Add a GITHUB_TOKEN or try again later." },
      OPENAI_KEY_MISSING: { status: 500, message: "Add your OPENAI_API_KEY to .env.local, then restart the development server." },
      OPENAI_KEY_INVALID: { status: 401, message: "The OpenAI API key is invalid. Check OPENAI_API_KEY in .env.local." },
      OPENAI_REQUEST_FAILED: { status: 502, message: "OpenAI couldn’t complete the assessment. Please try again." },
      OPENAI_RESPONSE_INVALID: { status: 502, message: "OpenAI returned an unexpected response. Please try again." },
    };
    const response = knownErrors[message] ?? { status: 500, message: "Something went wrong while analyzing this profile." };
    console.error("Analysis failed:", error);
    return Response.json({ error: response.message }, { status: response.status });
  }
}

function parseGitHubUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\/$/, "");
  let username = trimmed;

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) return null;
      username = url.pathname.split("/").filter(Boolean)[0] ?? "";
    }
  } catch {
    return null;
  }

  return /^(?!-)[a-zA-Z0-9-]{1,39}(?<!-)$/.test(username) ? username : null;
}
