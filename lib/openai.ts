import type { GitHubRepository } from "@/lib/github";
import type { ProjectLevel, RepositoryAssessment } from "@/lib/types";

interface RawAssessment {
  id: number;
  level: ProjectLevel;
  assessment: string;
}

const BATCH_SIZE = 6;

export async function assessRepositories(repositories: GitHubRepository[]): Promise<RepositoryAssessment[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_KEY_MISSING");

  const batches: GitHubRepository[][] = [];
  for (let index = 0; index < repositories.length; index += BATCH_SIZE) {
    batches.push(repositories.slice(index, index + BATCH_SIZE));
  }

  const assessedBatches = await mapWithConcurrency(batches, 3, (batch) => assessBatch(batch, apiKey));
  const assessments = new Map(assessedBatches.flat().map((item) => [item.id, item]));

  return repositories.map((repository) => {
    const result = assessments.get(repository.id);
    return {
      id: repository.id,
      name: repository.name,
      url: repository.html_url,
      description: repository.description,
      language: repository.language,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      level: result?.level ?? "Basic",
      assessment: result?.assessment ?? "This repository could not be assessed from the available README content.",
    };
  });
}

async function assessBatch(repositories: GitHubRepository[], apiKey: string): Promise<RawAssessment[]> {
  const projects = repositories.map((repository) => ({
    id: repository.id,
    name: repository.name,
    description: repository.description,
    primaryLanguage: repository.language,
    isFork: repository.fork,
    isArchived: repository.archived,
    readme: repository.readme ?? "[No README available]",
  }));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions:
        "You are a fair senior software engineer reviewing public portfolio repositories. Assess only what the repository metadata and README support. Use Basic for small learning or simple CRUD projects, Intermediate for well-structured multi-feature applications, Advanced for substantial architecture or technical depth, and Expert only for exceptional production-grade or deeply technical work. Keep each assessment to 2 concise sentences: first explain complexity and technical scope, then evaluate README clarity and what experience it reflects. Do not flatter and do not penalize a project merely for having few stars.",
      input: JSON.stringify(projects),
      text: {
        format: {
          type: "json_schema",
          name: "repository_assessments",
          strict: true,
          schema: {
            type: "object",
            properties: {
              assessments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    level: { type: "string", enum: ["Basic", "Intermediate", "Advanced", "Expert"] },
                    assessment: { type: "string" },
                  },
                  required: ["id", "level", "assessment"],
                  additionalProperties: false,
                },
              },
            },
            required: ["assessments"],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("OpenAI request failed:", response.status, details);
    throw new Error(response.status === 401 ? "OPENAI_KEY_INVALID" : "OPENAI_REQUEST_FAILED");
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("OPENAI_RESPONSE_INVALID");
  const parsed = JSON.parse(outputText) as { assessments: RawAssessment[] };
  return parsed.assessments;
}

function extractOutputText(payload: { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> }) {
  for (const output of payload.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return null;
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
