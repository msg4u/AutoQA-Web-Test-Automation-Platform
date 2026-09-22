# AutoQA — Web Test Automation Platform

A web-based platform for **generating, reviewing, scheduling, and running automated end-to-end tests** against a target website — with AI-assisted script creation and a visual report after every run.

> 🚧 **Status: Early development.** This repository currently contains the application scaffold (frontend, backend, and Gemini API wiring). Core platform features — script recorder, execution engine, scheduler, and reporting — are being built out. See [Roadmap](#roadmap) below.

---

## Overview

AutoQA lets a QA engineer, developer, or product owner:

1. **Create** a test script for a target site — by hand, or with AI assistance that turns a plain-English description ("check the homepage loads and each link navigates correctly") into a runnable script.
2. **Review & store** the script in a central, versioned library before it's approved to run.
3. **Schedule** it — on demand, on a recurring cadence, or triggered by a webhook (e.g., after a deploy).
4. **Get a report** after every run — pass/fail per step, screenshots, console/network errors, and a trend view over time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS 4 |
| Backend server | Express (TypeScript, via `tsx` in dev / bundled with `esbuild` for prod) |
| AI assistance | Google Gemini API (`@google/genai`) |
| Icons / motion | `lucide-react`, `motion` |
| Script format | YAML-based test DSL (`yaml`) |
| Package manager | Bun |

This project was scaffolded from the [Google AI Studio repository template](https://github.com/google-gemini/aistudio-repository-template).

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 18+ with npm/yarn as a fallback)
- A [Gemini API key](https://aistudio.google.com/apikey) for AI-assisted script generation

### Setup

```bash
# Clone the repo
git clone https://github.com/msg4u/AutoQA-Web-Test-Automation-Platform.git
cd AutoQA-Web-Test-Automation-Platform

# Install dependencies
bun install

# Configure environment variables
cp .env.example .env
```

Edit `.env` and set:

```
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:5173"
```

### Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start the app in development mode (`tsx server.ts`) |
| `bun run build` | Build the frontend (Vite) and bundle the server for production |
| `bun run start` | Run the production server (`dist/server.cjs`) |
| `bun run preview` | Preview the production Vite build locally |
| `bun run lint` | Type-check the project (`tsc --noEmit`) |
| `bun run clean` | Remove build output |

---

## Project Structure

```
.
├── src/                # Frontend application source
├── server.ts           # Express server / API entry point
├── index.html           # Vite entry HTML
├── metadata.json        # AI Studio app metadata
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── .env.example          # Required environment variables
```

*(This structure will expand as script storage, the execution engine, and scheduling modules are added — see the roadmap.)*

---

## Core Concepts

| Concept | Description |
|---|---|
| **Target Site** | A website registered in the platform to be tested (URL, environment, optional auth) |
| **Test Script** | A versioned, human-readable set of steps (navigate, click, assert, screenshot, etc.) run against a target site |
| **Run** | A single execution of a script, producing step-by-step results and artifacts |
| **Report** | The output of a run — status, screenshots, errors, timing, and visual diffs |
| **Schedule** | A cron-based or event-triggered plan for automatically running a script |

---

## Roadmap

- [x] Project scaffold (React + Vite + Express + Gemini integration)
- [ ] Script editor (manual + YAML DSL)
- [ ] AI-assisted script generation from natural-language descriptions
- [ ] Script library with versioning and review/approval workflow
- [ ] Headless-browser execution engine (Playwright)
- [ ] Cron-based and webhook-triggered scheduling
- [ ] Run reports: step results, screenshots, console/network logs
- [ ] Visual regression diffing against a baseline
- [ ] Notifications (email / Slack) on run completion
- [ ] Historical trend view and flaky-test detection

---

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a pull request

---

## License

*(Add your chosen license — e.g., MIT — and include a `LICENSE` file in the repo root.)*
