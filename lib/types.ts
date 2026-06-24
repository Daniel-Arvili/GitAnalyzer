export type ProjectLevel = "Basic" | "Intermediate" | "Advanced" | "Expert";

export interface RepositoryAssessment {
  id: number;
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  level: ProjectLevel;
  assessment: string;
}

export interface AnalysisResult {
  user: {
    username: string;
    name: string | null;
    avatarUrl: string;
    profileUrl: string;
  };
  repositories: RepositoryAssessment[];
  totalRepositories: number;
}
