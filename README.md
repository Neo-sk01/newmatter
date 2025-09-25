# SalesMatter — AI-Driven Sales Automation UI

SalesMatter is a Next.js application that streamlines outbound sales: import leads, enrich data, generate personalized emails with AI, review and approve at scale, and simulate batch sending with basic analytics.

Built with the App Router, Tailwind CSS, shadcn‑style components (Radix primitives), and the Vercel AI SDK for streaming completions.

## Features

- Import: Upload CSVs or connect to a CRM (UI only).
- Import: Upload CSVs (drag & drop). We parse on the client and call an LLM mapping API to normalize columns to a standard lead schema.
- Enrich: Run GPT-4o web research per lead, capture LinkedIn URLs, and approve 100-word insight summaries before move to generation.
- Generate: Use tokenized templates and GPT‑4o‑mini via the Vercel AI SDK to generate personalized drafts.
- Review: Inline edit, approve/reject per lead; preview live AI streaming output.
- Send: Simulated batch sending with progress, scheduling, and limits.
- Analytics: Example KPIs and a small chart powered by Recharts.
- Theming: Light/dark mode with `next-themes`.

## Tech Stack

- Framework: Next.js 15 (App Router) + React 19
- UI: Tailwind CSS 4, shadcn‑style components (Radix UI), lucide-react icons
- Charts: Recharts
- AI: Vercel AI SDK (`ai`) with provider-resolved models (defaults to `openai:gpt-4o-mini`)

## Quick Start

Prerequisites:

- Node.js 18.18+ (Node 20+ recommended)
- npm, pnpm, yarn, or bun

1) Install dependencies

```bash
npm install
# or
pnpm install
# or
yarn
```

2) Configure environment

Create a `.env.local` file in the project root with your OpenAI API key. Optionally override the model used for the Enrich tab's research summaries:

```bash
OPENAI_API_KEY=sk-...
# Optional: override GPT model for research summaries (defaults to gpt-4o)
AI_RESEARCH_MODEL=gpt-4o
```

3) Run the dev server

```bash
npm run dev
```

Visit http://localhost:3000

## How It Works

- Flow: Import → Enrich → Generate → Review → Send → Analytics
- The main UI lives in `src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx` and is rendered on `src/app/page.tsx` and `src/app/salesmatter/page.tsx`.
- AI generation streams from the API route `src/app/api/generate-email/route.ts`, using the Vercel AI SDK. It reads `OPENAI_API_KEY` from your environment and optionally honors `AI_EMAIL_MODEL` (format `provider:model`, e.g. `openai:gpt-4o-mini`).
- CSV → JSON mapping uses `src/app/api/map-csv/route.ts`. The client parses the CSV (Papaparse) and sends header names with a small sample of rows. The endpoint asks the model to map arbitrary headers to the canonical fields: `firstName`, `lastName`, `company`, `email`, `title`, `website`, `linkedin`. The client applies this mapping to the entire CSV locally. If the model is unavailable, a heuristic fallback mapping is used.
- CRM connections, enrichment providers, and SMTP sending are demo UIs. Sending and metrics are simulated for prototyping purposes.

## Project Structure

Key files and directories:

- `src/app/page.tsx` — Home route wiring the SalesMatter UI
- `src/app/salesmatter/page.tsx` — Alternate route to the same UI
- `src/app/layout.tsx` — App layout, fonts, and theme provider
- `src/app/api/generate-email/route.ts` — AI streaming endpoint
- `src/app/api/lead-research/route.ts` — OpenAI web-search + summarization proxy for the Enrich tab
- `src/app/api/map-csv/route.ts` — LLM-assisted CSV header mapping
- `src/components/ui/*` — Reusable shadcn‑style UI components
- `src/components/theme-provider.tsx` — Theme handling (light/dark)
- `src/lib/utils.ts` — Utility helpers

## Scripts

- `dev`: Start the Next.js dev server
- `build`: Build for production
- `start`: Run the production build
- `lint`: Run ESLint

## Deployment

The app is ready for deployment on Vercel or any Node hosting that supports Next.js. Ensure `OPENAI_API_KEY` is set in your deployment environment.

## Notes & Limitations

- The enrichment, CRM connections, SMTP settings, and send flow are illustrative and not integrated with external services.
- The analytics panel displays example KPIs and charts for demonstration.
- AI generation requires a valid `OPENAI_API_KEY`. Usage may incur costs from your model provider.

## Acknowledgements

- Next.js, Tailwind CSS, Radix UI, shadcn/ui inspiration
- Vercel AI SDK (`ai`) and `@ai-sdk/openai`
- lucide-react, Recharts
