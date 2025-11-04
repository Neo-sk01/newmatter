# Design Document

## Overview

This design document outlines the integration of Langfuse observability and prompt management into the SalesMatter Next.js application. The integration will provide comprehensive tracing of AI operations, token usage tracking, performance monitoring, and centralized prompt management. The solution leverages Langfuse TypeScript SDK v4, which is built on OpenTelemetry, and integrates seamlessly with the existing Vercel AI SDK implementation.

### Key Design Goals

1. **Minimal Code Changes**: Integrate Langfuse with minimal disruption to existing code
2. **Comprehensive Observability**: Capture all AI SDK calls with detailed telemetry
3. **Centralized Prompt Management**: Move prompts from code to Langfuse for version control
4. **Production Ready**: Handle serverless environments and ensure reliable trace delivery
5. **Developer Experience**: Provide clear utilities and patterns for consistent usage

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           instrumentation.ts (Root Level)              │ │
│  │  - NodeTracerProvider                                  │ │
│  │  - LangfuseSpanProcessor                              │ │
│  │  - Span Filtering (exclude Next.js infra)            │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              API Route Handlers                        │ │
│  │  - Wrapped with observe()                             │ │
│  │  - Update trace metadata (userId, sessionId)          │ │
│  │  - Fetch prompts from Langfuse                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Vercel AI SDK Calls                          │ │
│  │  - generateText / generateObject                       │ │
│  │  - experimental_telemetry enabled                      │ │
│  │  - Link to Langfuse prompts                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Prompt Management Utility                      │ │
│  │  - LangfuseClient instance                            │ │
│  │  - Fetch prompts by name/label                        │ │
│  │  - Compile prompts with variables                     │ │
│  │  - Cache with TTL                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Langfuse Cloud │
                  │  - Traces       │
                  │  - Prompts      │
                  │  - Analytics    │
                  └─────────────────┘
```

### Component Interaction Flow

1. **Application Startup**: `instrumentation.ts` initializes OpenTelemetry with LangfuseSpanProcessor
2. **Request Received**: API route handler wrapped with `observe()` creates root span
3. **Prompt Fetching**: Handler fetches prompt from Langfuse using prompt management utility
4. **AI SDK Call**: Vercel AI SDK call with telemetry enabled creates generation span
5. **Trace Completion**: Handler updates trace metadata and flushes in serverless environment
6. **Data Export**: LangfuseSpanProcessor exports spans to Langfuse Cloud

## Components and Interfaces

### 1. Instrumentation Setup (`instrumentation.ts`)

**Location**: Project root

**Purpose**: Initialize OpenTelemetry with Langfuse integration

**Key Components**:
- `NodeTracerProvider`: OpenTelemetry tracer provider
- `LangfuseSpanProcessor`: Exports spans to Langfuse
- `shouldExportSpan`: Filter function to exclude Next.js infrastructure spans

**Interface**:
```typescript
// Export for use in API routes
export const langfuseSpanProcessor: LangfuseSpanProcessor;

// Automatic registration on module load
export function register(): void;
```

**Implementation Details**:
- Filter out spans with `instrumentationScope.name === "next.js"`
- Register tracer provider globally
- Export `langfuseSpanProcessor` for manual flushing in serverless environments

### 2. Prompt Management Utility (`src/lib/langfuse/prompts.ts`)

**Purpose**: Centralized utility for fetching and managing prompts

**Key Components**:
- `LangfuseClient` instance
- Prompt fetching functions
- Caching layer
- TypeScript types

**Interface**:
```typescript
import { LangfuseClient } from "@langfuse/client";
import type { PromptClient } from "@langfuse/client";

// Singleton client instance
export const langfuseClient: LangfuseClient;

// Fetch prompt by name (defaults to "production" label)
export async function getPrompt(
  name: string,
  options?: { label?: string; version?: number; cacheTtlSeconds?: number }
): Promise<PromptClient>;

// Fetch and compile prompt in one call
export async function getCompiledPrompt(
  name: string,
  variables: Record<string, any>,
  options?: { label?: string; version?: number }
): Promise<string | Array<{ role: string; content: string }>>;

// Type definitions
export type TextPrompt = PromptClient & { type: "text" };
export type ChatPrompt = PromptClient & { type: "chat" };
```

**Implementation Details**:
- Use environment variables for credentials
- Default cache TTL of 60 seconds
- Graceful error handling with descriptive messages
- Support for both text and chat prompts

### 3. API Route Wrapper Pattern

**Purpose**: Consistent pattern for wrapping API routes with observability

**Pattern**:
```typescript
import { observe, updateActiveTrace, updateActiveObservation } from "@langfuse/tracing";
import { after } from "next/server";
import { langfuseSpanProcessor } from "@/instrumentation";

const handler = async (req: Request) => {
  // Extract request data
  const body = await req.json();
  
  // Update trace with metadata
  updateActiveTrace({
    name: "route-name",
    userId: body.userId,
    sessionId: body.sessionId,
    tags: ["tag1", "tag2"],
    input: body,
  });
  
  // Update observation with input
  updateActiveObservation({
    input: body,
  });
  
  // Fetch prompt if needed
  const prompt = await getPrompt("prompt-name");
  
  // Make AI SDK call
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: prompt.compile(body),
    experimental_telemetry: {
      isEnabled: true,
      metadata: {
        langfusePrompt: prompt.toJSON(),
      },
    },
  });
  
  // Update observation with output
  updateActiveObservation({
    output: result.text,
  });
  
  // Flush in serverless environment
  after(async () => await langfuseSpanProcessor.forceFlush());
  
  return new Response(result.text);
};

export const POST = observe(handler, {
  name: "route-name",
});
```

### 4. Environment Configuration

**Location**: `.env` and `env.example`

**Required Variables**:
```bash
# Langfuse Configuration
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
LANGFUSE_TRACING_ENVIRONMENT=development

# Existing AI Configuration
AI_EMAIL_MODEL=openai:gpt-4o-mini
```

**Configuration Strategy**:
- Use same credentials for tracing and prompt management
- Environment-specific labels (development, staging, production)
- Fallback to defaults when optional variables are missing

### 5. Prompt Structure in Langfuse

**Naming Convention**: `{feature}-{purpose}`

Examples:
- `email-generation-system`: System prompt for email generation
- `email-generation-user`: User prompt template for email generation
- `lead-research-query`: Prompt for lead research queries
- `csv-parsing-instructions`: Instructions for CSV parsing

**Prompt Template Format**:
```
Text Prompt:
"Generate an email for {{recipientName}} about {{topic}}. Use a {{tone}} tone."

Chat Prompt:
[
  {
    "role": "system",
    "content": "You are a {{role}} assistant."
  },
  {
    "role": "user",
    "content": "{{userQuery}}"
  }
]
```

**Config Structure**:
```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxOutputTokens": 700,
  "description": "Prompt for generating personalized emails"
}
```

**Label Strategy**:
- `production`: Current production version
- `staging`: Version being tested
- `latest`: Most recent version (auto-maintained)
- `experiment-{name}`: Experimental versions for A/B testing

## Data Models

### Trace Structure

```typescript
interface LangfuseTrace {
  id: string;
  name: string;
  userId?: string;
  sessionId?: string;
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
  tags?: string[];
  environment: string;
  observations: LangfuseObservation[];
}
```

### Observation Structure

```typescript
interface LangfuseObservation {
  id: string;
  traceId: string;
  type: "span" | "event" | "generation";
  name: string;
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  level?: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR";
  statusMessage?: string;
  parentObservationId?: string;
  
  // Generation-specific fields
  model?: string;
  modelParameters?: Record<string, any>;
  usage?: {
    input: number;
    output: number;
    total: number;
  };
  promptName?: string;
  promptVersion?: number;
}
```

### Prompt Structure

```typescript
interface LangfusePrompt {
  name: string;
  version: number;
  type: "text" | "chat";
  prompt: string | ChatMessage[];
  config?: Record<string, any>;
  labels: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
```

## Error Handling

### Tracing Errors

**Strategy**: Non-blocking error handling to prevent application failures

**Implementation**:
```typescript
// In instrumentation.ts
const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
  // Errors are logged but don't throw
});

// In API routes
try {
  updateActiveTrace({ ... });
} catch (error) {
  console.warn("Failed to update trace:", error);
  // Continue execution
}
```

**Error Scenarios**:
1. **Missing Credentials**: Log warning, disable tracing
2. **Network Errors**: Retry with exponential backoff, queue spans
3. **Invalid Span Data**: Log error, skip span
4. **Flush Timeout**: Log warning, continue (spans queued for next flush)

### Prompt Management Errors

**Strategy**: Fail gracefully with fallback prompts

**Implementation**:
```typescript
export async function getPrompt(name: string, options?: GetPromptOptions) {
  try {
    return await langfuseClient.prompt.get(name, options);
  } catch (error) {
    console.error(`Failed to fetch prompt "${name}":`, error);
    
    // Check for fallback prompt in config
    const fallback = FALLBACK_PROMPTS[name];
    if (fallback) {
      console.warn(`Using fallback prompt for "${name}"`);
      return createFallbackPrompt(fallback);
    }
    
    throw new Error(`Prompt "${name}" not found and no fallback available`);
  }
}
```

**Error Scenarios**:
1. **Prompt Not Found**: Use fallback or throw descriptive error
2. **Network Timeout**: Retry once, then use fallback
3. **Invalid Prompt Format**: Log error, use fallback
4. **Missing Variables**: Throw error with list of missing variables

### Fallback Prompts

**Location**: `src/lib/langfuse/fallbacks.ts`

**Structure**:
```typescript
export const FALLBACK_PROMPTS: Record<string, FallbackPrompt> = {
  "email-generation-system": {
    type: "text",
    prompt: "You are a professional email writer...",
    config: {
      model: "gpt-4o-mini",
      temperature: 0.7,
    },
  },
  // ... other fallbacks
};
```

## Testing Strategy

### Unit Tests

**Scope**: Individual utility functions

**Test Cases**:
1. Prompt fetching with different labels
2. Prompt compilation with variables
3. Error handling for missing prompts
4. Cache behavior with TTL
5. Fallback prompt usage

**Tools**: Vitest

**Example**:
```typescript
describe("getPrompt", () => {
  it("should fetch prompt by name", async () => {
    const prompt = await getPrompt("test-prompt");
    expect(prompt.name).toBe("test-prompt");
  });
  
  it("should use fallback when prompt not found", async () => {
    const prompt = await getPrompt("missing-prompt");
    expect(prompt).toBeDefined();
    expect(prompt.isFallback).toBe(true);
  });
});
```

### Integration Tests

**Scope**: End-to-end API route testing

**Test Cases**:
1. Trace creation for API routes
2. Prompt fetching and compilation in routes
3. AI SDK telemetry integration
4. Metadata propagation
5. Serverless flush behavior

**Tools**: Vitest with API route testing

**Example**:
```typescript
describe("POST /api/generate-email", () => {
  it("should create trace with prompt link", async () => {
    const response = await POST(mockRequest);
    
    // Verify response
    expect(response.status).toBe(200);
    
    // Verify trace was created (mock Langfuse client)
    expect(mockLangfuse.traces).toHaveLength(1);
    expect(mockLangfuse.traces[0].name).toBe("generate-email");
  });
});
```

### Manual Testing

**Scope**: Verify traces in Langfuse UI

**Test Cases**:
1. Traces appear in Langfuse dashboard
2. Prompt links are visible
3. Token usage is tracked
4. Metadata is correctly set
5. Environment filtering works

**Checklist**:
- [ ] Create test account in Langfuse Cloud
- [ ] Configure test environment variables
- [ ] Make test API calls
- [ ] Verify traces in UI
- [ ] Check prompt links
- [ ] Verify token counts
- [ ] Test environment filtering

## Migration Strategy

### Phase 1: Setup Infrastructure

1. Install Langfuse packages
2. Create `instrumentation.ts`
3. Add environment variables
4. Create prompt management utility
5. Verify basic tracing works

### Phase 2: Migrate One Route

1. Choose simple route (e.g., `/api/generate-email`)
2. Wrap handler with `observe()`
3. Add trace metadata
4. Enable AI SDK telemetry
5. Test and verify in Langfuse UI

### Phase 3: Create Prompts in Langfuse

1. Identify hardcoded prompts in code
2. Create prompts in Langfuse UI
3. Test prompt fetching
4. Verify prompt compilation

### Phase 4: Migrate Remaining Routes

1. Apply pattern to all AI-powered routes:
   - `/api/lead-research`
   - `/api/parse-csv-ai`
   - `/api/map-csv`
2. Replace hardcoded prompts with Langfuse prompts
3. Test each route individually

### Phase 5: Production Rollout

1. Deploy to staging environment
2. Monitor traces and errors
3. Verify prompt management works
4. Deploy to production with monitoring
5. Document patterns for team

## Performance Considerations

### Tracing Overhead

**Impact**: Minimal (<5ms per request)

**Optimizations**:
- Async span export (non-blocking)
- Batching of spans
- Efficient serialization

### Prompt Fetching

**Impact**: ~50-100ms per fetch (first time)

**Optimizations**:
- Default 60-second cache TTL
- Configurable cache duration
- Fallback prompts for offline scenarios

**Cache Strategy**:
```typescript
// Cache key: `${name}:${label || version}`
// Cache TTL: 60 seconds (configurable)
// Cache invalidation: Automatic on TTL expiry
```

### Serverless Considerations

**Challenge**: Function may terminate before spans are exported

**Solution**: Manual flush with `after()`
```typescript
after(async () => await langfuseSpanProcessor.forceFlush());
```

**Timeout**: 5 seconds for flush operation

## Security Considerations

### Credential Management

1. **Environment Variables**: Store credentials in `.env` (not committed)
2. **Vercel Secrets**: Use Vercel environment variables for production
3. **Rotation**: Support credential rotation without code changes
4. **Validation**: Validate credentials on startup

### Data Privacy

1. **PII Masking**: Implement masking function for sensitive data
2. **Selective Logging**: Don't log sensitive fields (passwords, tokens)
3. **Metadata Filtering**: Review metadata before sending to Langfuse

**Masking Implementation**:
```typescript
const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
  mask: ({ data }) => {
    // Mask email addresses
    let masked = data.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "***EMAIL***");
    
    // Mask phone numbers
    masked = masked.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "***PHONE***");
    
    return masked;
  },
});
```

### Access Control

1. **Langfuse Project**: Separate projects for dev/staging/prod
2. **API Keys**: Different keys per environment
3. **Team Access**: Use Langfuse RBAC for team members

## Monitoring and Observability

### Health Checks

**Metrics to Monitor**:
1. Trace export success rate
2. Prompt fetch success rate
3. Average trace latency
4. Cache hit rate
5. Error rate by type

**Implementation**:
```typescript
// Add custom metrics to trace metadata
updateActiveTrace({
  metadata: {
    promptCacheHit: true,
    promptFetchLatency: 45,
    traceExportSuccess: true,
  },
});
```

### Alerting

**Alert Conditions**:
1. Trace export failure rate > 5%
2. Prompt fetch failure rate > 10%
3. Average latency > 2 seconds
4. Error rate > 1%

**Integration**: Use Langfuse webhooks or custom monitoring

### Debugging

**Tools**:
1. Langfuse UI for trace inspection
2. Console logs for local debugging
3. Debug mode for verbose logging

**Debug Mode**:
```typescript
// Enable debug logging
const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
  debug: process.env.LANGFUSE_DEBUG === "true",
});
```

## Documentation

### Developer Guide

**Location**: `docs/langfuse-integration.md`

**Contents**:
1. Overview of Langfuse integration
2. How to add tracing to new routes
3. How to create and use prompts
4. Troubleshooting common issues
5. Best practices

### API Documentation

**Location**: JSDoc comments in code

**Example**:
```typescript
/**
 * Fetches a prompt from Langfuse by name.
 * 
 * @param name - The unique name of the prompt
 * @param options - Optional configuration
 * @param options.label - The label to fetch (defaults to "production")
 * @param options.version - Specific version number to fetch
 * @param options.cacheTtlSeconds - Cache duration in seconds (defaults to 60)
 * @returns Promise resolving to the prompt object
 * @throws Error if prompt not found and no fallback available
 * 
 * @example
 * const prompt = await getPrompt("email-generation");
 * const compiled = prompt.compile({ name: "John", topic: "AI" });
 */
```

### Prompt Documentation

**Location**: Langfuse UI (prompt descriptions)

**Format**:
- **Name**: Descriptive name following convention
- **Description**: Purpose and usage of the prompt
- **Variables**: List of required variables with descriptions
- **Config**: Explanation of config parameters
- **Examples**: Sample variable values and outputs

## Future Enhancements

### Phase 2 Features

1. **Evaluation Scores**: Add custom scoring for prompt quality
2. **A/B Testing**: Implement systematic A/B testing of prompts
3. **Datasets**: Create datasets for prompt testing
4. **Experiments**: Run experiments to compare prompt versions
5. **Custom Dashboards**: Build dashboards for key metrics

### Advanced Prompt Management

1. **Prompt Templates**: Create reusable prompt components
2. **Prompt Composition**: Combine multiple prompts
3. **Dynamic Prompts**: Generate prompts based on context
4. **Prompt Optimization**: Automated prompt improvement suggestions

### Integration Enhancements

1. **LangChain Integration**: If LangChain is adopted
2. **Custom Instrumentations**: Add custom spans for business logic
3. **Distributed Tracing**: Link traces across services
4. **Real-time Monitoring**: Live trace streaming
