---
inclusion: always
---

# Tech Stack

## Framework & Runtime
- Next.js 15 (App Router) with React 19
- TypeScript 5 (strict mode enabled)
- Node.js 18.18+ (Node 20+ recommended)

## UI & Styling
- Tailwind CSS 4 with PostCSS
- shadcn/ui component patterns (Radix UI primitives)
- lucide-react for icons
- next-themes for light/dark mode
- class-variance-authority (cva) for component variants
- Recharts for data visualization

## AI & Data Processing
- Vercel AI SDK (`ai` package) with streaming support
- @ai-sdk/openai and @ai-sdk/anthropic providers
- Model format: `provider:model` (e.g., `openai:gpt-4o-mini`)
- PapaParse for CSV parsing
- Zod for schema validation

## Authentication & Database
- Clerk for authentication and user management
- Supabase for database (PostgreSQL) with SSR support
- Multi-tenant architecture with company-based workspaces

## Email & External Services
- SendGrid client (configured but not actively used in demo)

## Common Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000
pnpm install         # Install dependencies (pnpm preferred)

# Production
npm run build        # Build for production
npm start            # Run production build

# Code Quality
npm run lint         # Run ESLint
```

## Environment Variables

Required in `.env.local`:
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key

Optional:
- `AI_EMAIL_MODEL` - Override email generation model (default: `openai:gpt-4o-mini`)
- `AI_RESEARCH_MODEL` - Override research model (default: `gpt-4o`)

## Build Configuration

- Custom webpack config in `next.config.ts` for MiniCssExtractPlugin
- Path alias: `@/*` maps to `./src/*`
- Target: ES2017
- Module resolution: bundler
