# SalesMatter — AI-Driven Sales Automation UI

SalesMatter is a Next.js application that streamlines outbound sales: import leads, enrich data, generate personalized emails with AI, review and approve at scale, and simulate batch sending with basic analytics.

Built with the App Router, Tailwind CSS, shadcn‑style components (Radix primitives), and the Vercel AI SDK for streaming completions.

## Features

- Import: Upload CSVs or connect to a CRM (UI only).
- Enrich: Toggle data sources (LinkedIn, company site, news, tech stack) to augment leads (demo behavior).
- Generate: Use tokenized templates and GPT‑4o‑mini via the Vercel AI SDK to generate personalized drafts.
- Review: Inline edit, approve/reject per lead; preview live AI streaming output.
- Send: Simulated batch sending with progress, scheduling, and limits.
- Analytics: Example KPIs and a small chart powered by Recharts.
- Theming: Light/dark mode with `next-themes`.

## Tech Stack

- Framework: Next.js 15 (App Router) + React 19
- UI: Tailwind CSS 4, shadcn‑style components (Radix UI), lucide-react icons
- Charts: Recharts
- AI: Vercel AI SDK (`ai`) with `@ai-sdk/openai` (model: `gpt-4o-mini`)

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

Create a `.env.local` file in the project root with your OpenAI API key:

```bash
OPENAI_API_KEY=sk-...
```

3) Run the dev server

```bash
npm run dev
```

Visit http://localhost:3000

## How It Works

- Flow: Import → Enrich → Generate → Review → Send → Analytics
- The main UI lives in `src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx` and is rendered on `src/app/page.tsx` and `src/app/salesmatter/page.tsx`.
- AI generation streams from the API route `src/app/api/generate-email/route.ts`, using the Vercel AI SDK. It reads `OPENAI_API_KEY` from your environment.
- CRM connections, enrichment providers, and SMTP sending are demo UIs. Sending and metrics are simulated for prototyping purposes.

## Project Structure

Key files and directories:

- `src/app/page.tsx` — Home route wiring the SalesMatter UI
- `src/app/salesmatter/page.tsx` — Alternate route to the same UI
- `src/app/layout.tsx` — App layout, fonts, and theme provider
- `src/app/api/generate-email/route.ts` — AI streaming endpoint
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

