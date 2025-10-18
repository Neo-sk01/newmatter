---
inclusion: always
---

# Project Structure

## Directory Organization

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (sign-in/sign-up)
│   ├── [companyId]/              # Company-scoped routes
│   ├── api/                      # API routes
│   │   ├── generate-email/       # AI email generation endpoint
│   │   ├── lead-research/        # AI research endpoint
│   │   ├── map-csv/              # CSV column mapping endpoint
│   │   ├── campaigns/            # Campaign CRUD
│   │   ├── leadlists/            # Lead list management
│   │   ├── sequences/            # Email sequences
│   │   └── ...                   # Other API endpoints
│   ├── dashboard/                # Dashboard pages
│   ├── onboarding/               # Onboarding flow
│   └── layout.tsx                # Root layout with theme provider
├── components/
│   ├── ui/                       # shadcn-style reusable components
│   ├── auth/                     # Auth-related components
│   ├── dashboard/                # Dashboard-specific components
│   └── EnhancedCSVImporter.tsx   # CSV import component
├── lib/
│   ├── supabase/                 # Supabase client/server utilities
│   ├── auth/                     # Auth utilities (permissions)
│   ├── company/                  # Company branding utilities
│   ├── context/                  # React context providers
│   ├── types/                    # TypeScript type definitions
│   └── utils.ts                  # Utility functions (cn, etc.)
├── hooks/                        # Custom React hooks
└── utils/                        # Utility modules

supabase/
└── migrations/                   # Database migration files

data/
├── campaigns/                    # Campaign data storage
└── prompts/                      # Prompt templates storage
```

## Key Conventions

### Routing
- App Router with file-based routing
- Route groups use `(groupName)` for organization without URL segments
- Dynamic routes use `[param]` syntax
- Company-scoped routes under `[companyId]/`

### Components
- UI components in `src/components/ui/` follow shadcn patterns
- Use Radix UI primitives with cva for variants
- Component props extend native HTML element props
- Use `cn()` utility from `@/lib/utils` for className merging

### API Routes
- All API routes in `src/app/api/`
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Use `NextRequest` and `NextResponse` types
- Public API routes must be declared in middleware matcher

### Authentication
- Clerk middleware in `middleware.ts` protects routes
- Protected routes: `/dashboard/*`, `/company/*`, `/api/protected/*`
- Public API routes: `/api/generate-email`, `/api/lead-research`, `/api/map-csv`
- Company-specific auth redirects to `/{companyId}/sign-in`

### Database
- Supabase client for browser: `createClient()` from `@/lib/supabase/client`
- Supabase server for SSR: use `@/lib/supabase/server`
- Migrations in `supabase/migrations/` with numbered prefixes

### AI Integration
- Model resolution via `provider:model` format
- Streaming responses use Vercel AI SDK
- Environment-based model configuration
- Error handling returns appropriate HTTP status codes

### Styling
- Tailwind CSS with utility-first approach
- Dark mode support via `next-themes`
- Component variants via class-variance-authority
- Consistent spacing and sizing patterns from shadcn

### Type Safety
- Strict TypeScript mode enabled
- Type definitions in `src/lib/types/`
- Zod schemas for runtime validation
- Proper typing for API responses and component props
