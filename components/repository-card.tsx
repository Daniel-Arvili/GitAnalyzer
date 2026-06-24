import { ForkIcon, RepositoryIcon, StarIcon } from "@/components/icons";
import type { RepositoryAssessment } from "@/lib/types";

export function RepositoryCard({ repository }: { repository: RepositoryAssessment }) {
  const levelClass = `level-${repository.level.toLowerCase()}`;

  return (
    <article className="repo-card">
      <div className="repo-topline">
        <div className="repo-title-row">
          <RepositoryIcon />
          <h3>
            <a href={repository.url} target="_blank" rel="noreferrer">
              {repository.name}
            </a>
          </h3>
        </div>
        <span className={`level-badge ${levelClass}`}>{repository.level}</span>
      </div>
      <p className="assessment">{repository.assessment}</p>
      <div className="repo-meta">
        {repository.language && <span><i className="language-dot" />{repository.language}</span>}
        <span><StarIcon />{repository.stars}</span>
        <span><ForkIcon />{repository.forks}</span>
      </div>
    </article>
  );
}
