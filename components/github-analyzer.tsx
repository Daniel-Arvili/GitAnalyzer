"use client";

import { FormEvent, useState } from "react";
import { GithubIcon, SparkIcon } from "@/components/icons";
import { RepositoryCard } from "@/components/repository-card";
import type { AnalysisResult } from "@/lib/types";

export function GithubAnalyzer() {
  const [profile, setProfile] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = profile.trim();
    if (!value) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: value }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "We could not analyze this profile.");
      }

      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="analyzer">
      <form className="search-form" onSubmit={handleSubmit}>
        <label className="input-wrap">
          <GithubIcon />
          <input
            value={profile}
            onChange={(event) => setProfile(event.target.value)}
            placeholder="GitHub username or profile URL"
            aria-label="GitHub username or profile URL"
            autoComplete="off"
            disabled={isLoading}
          />
        </label>
        <button className="analyze-button" type="submit" disabled={isLoading || !profile.trim()}>
          <SparkIcon />
          {isLoading ? "Analyzing…" : "Analyze profile"}
        </button>
      </form>
      {isLoading && (
        <div className="status-card" role="status">
          <span className="spinner" />
          <div>
            <strong>Reading repositories and README files</strong>
            <p>The AI is building a concise assessment for each project. This can take a moment.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-card" role="alert">
          <strong>Analysis couldn&apos;t be completed</strong>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <section className="results" aria-live="polite">
          <div className="results-heading">
            <div className="profile">
              {/* GitHub avatar URLs are only known after the analysis request. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.user.avatarUrl} alt="" />
              <div>
                <h2>{result.user.name || result.user.username}</h2>
                <p>@{result.user.username}</p>
              </div>
            </div>
            <p className="results-count">{result.repositories.length} public {result.repositories.length === 1 ? "repository" : "repositories"}</p>
          </div>
          <div className="repo-list">
            {result.repositories.map((repository) => (
              <RepositoryCard key={repository.id} repository={repository} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
