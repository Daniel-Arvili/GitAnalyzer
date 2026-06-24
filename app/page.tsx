import { GithubAnalyzer } from "@/components/github-analyzer";
import { GithubIcon, SparkIcon } from "@/components/icons";

export default function Home() {
  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#" aria-label="RepoScope home">
          <span className="brand-mark">
            <SparkIcon />
          </span>
          <span>RepoScope</span>
        </a>
        <span className="powered-by">
          <GithubIcon />
          Powered by GitHub &amp; OpenAI
        </span>
      </nav>

      <section className="hero">
        <div className="eyebrow">
          <SparkIcon />
          AI-powered portfolio review
        </div>
        <h1>
          See the story behind
          <br />
          <span>every repository.</span>
        </h1>
        <p className="hero-copy">
          Enter a GitHub profile and get a thoughtful assessment of every
          public project—complexity, documentation quality, and the experience
          it reflects.
        </p>

        <GithubAnalyzer />
      </section>

      <footer>
        RepoScope only reads public repositories and their README files.
      </footer>
    </main>
  );
}
