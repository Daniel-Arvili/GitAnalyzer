# RepoScope

RepoScope is an AI-powered GitHub portfolio reviewer. Enter a GitHub username or profile URL to receive a concise assessment of every public repository based on its README, technical scope, documentation quality, and the experience it reflects.

![RepoScope homepage](./public/screen%20image.png)

## Features

- Accepts a GitHub username or full profile URL
- Fetches up to the 35 most recently updated public repositories
- Reads each repository's README file
- Uses OpenAI to classify projects as Basic, Intermediate, Advanced, or Expert
- Produces a short, readable assessment for every project
- Displays repository language, stars, and forks
- Includes responsive loading and error states

## How it works

1. The browser sends the submitted profile to the Next.js `/api/analyze` route.
2. The server fetches the profile, public repositories, and README files from GitHub.
3. Repositories are sent to OpenAI in small batches for structured assessment.
4. The completed assessments are returned and displayed as project cards.

API keys remain on the server and are never included in the browser bundle.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- GitHub REST API
- OpenAI Responses API

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini

# Optional, but recommended to avoid GitHub's unauthenticated rate limit.
GITHUB_TOKEN=your_github_personal_access_token
```

Never commit `.env.local` or share your API keys.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project structure

```text
app/
├── api/analyze/route.ts     # GitHub and OpenAI analysis endpoint
├── globals.css              # Global styling
├── layout.tsx               # Root layout and metadata
└── page.tsx                 # Main page
components/
├── github-analyzer.tsx      # Form, request, and results state
├── icons.tsx                # Interface icons
└── repository-card.tsx      # Individual assessment card
lib/
├── github.ts                # GitHub API integration
├── openai.ts                # OpenAI assessment logic
└── types.ts                 # Shared TypeScript types
```

## Available scripts

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run start    # Start the production server
npm run lint     # Run ESLint
```

## Privacy and API usage

RepoScope only reads public GitHub profiles, repositories, and README files. README content is sent to OpenAI to generate assessments. A GitHub token is optional and is used only to increase the GitHub API rate limit.

## License

This project is intended for educational and portfolio use.
