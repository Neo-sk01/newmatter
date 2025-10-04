# Langfuse Observability Setup

This project uses [Langfuse](https://langfuse.com) for comprehensive AI observability, including tracing, cost tracking, prompt management, and evaluation.

## Features Implemented

### 1. **Trace Logging & Observability**
- ✅ Full request traces for email generation and lead research
- ✅ Nested span tracking with OpenTelemetry
- ✅ Input/output logging for all AI calls
- ✅ Error tracking with detailed context

### 2. **Cost & Latency Tracking**
- ✅ Token usage tracking (prompt, completion, total)
- ✅ Request latency measurements
- ✅ Model generation time tracking
- ✅ Cost attribution per request

### 3. **Prompt Management**
- ✅ Version-controlled prompts in Langfuse UI
- ✅ Automatic fallback to local prompts
- ✅ Support for prompt templates with variables
- ✅ Collaborative prompt editing

### 4. **Metadata & Tags**
- ✅ Environment tags (production/development)
- ✅ Feature tags (email-generation, lead-research)
- ✅ Lead attribution (company, name, ID)
- ✅ Model and provider tracking

## Quick Start

### 1. Get Langfuse API Keys

1. Sign up at [https://cloud.langfuse.com](https://cloud.langfuse.com) (EU) or [https://us.cloud.langfuse.com](https://us.cloud.langfuse.com) (US)
2. Create a new project
3. Copy your `Public Key` and `Secret Key`

### 2. Configure Environment Variables

Add to your `.env.local` file:

```bash
# Langfuse Configuration
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # EU region
# LANGFUSE_BASE_URL=https://us.cloud.langfuse.com  # US region

# Optional feature flags
LANGFUSE_ENABLE_TRACING=true
LANGFUSE_ENABLE_PROMPTS=true
```

### 3. Deploy Instrumentation

The instrumentation is already configured in `instrumentation.ts` and will automatically initialize when your Next.js app starts.

### 4. View Traces

1. Run your application: `pnpm dev`
2. Generate some emails or run lead research
3. Visit your Langfuse dashboard
4. Navigate to the "Traces" tab to see your data

## Instrumented APIs

### Email Generation API (`/api/generate-email`)

**Trace Name:** `email-generation`

**Captured Data:**
- Input prompt and system prompt
- Research summary (if provided)
- Lead details (company, name, ID)
- Model configuration (provider, model name)
- Token usage (prompt tokens, completion tokens)
- Latency (total request time, generation time)
- Generated email content

**Tags:**
- `email-generation`
- `production` or `development`

**Metadata:**
- Provider (openai, anthropic)
- Model identifier
- Lead company
- Output length
- Finish reason

### Lead Research API (`/api/lead-research`)

**Trace Name:** `lead-research`

**Captured Data:**
- Lead information (company, name, title)
- Search query
- AI-generated research summary
- Web search sources
- Token usage
- Latency metrics

**Tags:**
- `lead-research`
- `production` or `development`

**Metadata:**
- Model (e.g., gpt-4o)
- Lead details
- Number of sources found
- Summary length

## Prompt Management

Langfuse supports centralized prompt management with version control. You can:

1. **Create prompts in Langfuse UI:**
   - Email Generation: `email-generation-system`
   - Lead Research: `lead-research-system`

2. **Use template variables:**
   ```
   {{SUMMARY_WORD_LIMIT}} - Word limit for research summaries
   {{leadContext}} - Formatted lead context
   ```

3. **Version control:**
   - Each change creates a new version
   - Roll back to previous versions anytime
   - A/B test different prompts

4. **Automatic fallback:**
   - If Langfuse is unavailable, uses local default prompts
   - No service disruption

## Advanced Usage

### Filtering Traces

In the Langfuse dashboard, you can filter by:
- **Tags:** `email-generation`, `lead-research`, `production`, `development`
- **User ID:** Lead ID or email
- **Metadata:** Company name, model type, etc.

### Cost Analysis

View cost breakdowns by:
- Feature (email generation vs research)
- Model (GPT-4 vs GPT-4-mini)
- Time period
- User/lead

### Performance Monitoring

Track:
- Average latency per API
- P95/P99 latency
- Token usage trends
- Error rates

### Evaluation

Set up evaluations in Langfuse to:
- Rate output quality (manual or automated)
- Track prompt version performance
- Compare different models
- Monitor production health metrics

## Architecture

```
Application Request
       ↓
instrumentation.ts (OpenTelemetry SDK)
       ↓
API Route (/api/generate-email or /api/lead-research)
       ↓
startActiveObservation() wraps the request
       ↓
- Logs input, metadata, tags
- Fetches prompt from Langfuse (optional)
- Calls AI model (OpenAI/Anthropic)
- Logs output, usage, latency
       ↓
LangfuseSpanProcessor
       ↓
Langfuse Cloud (traces stored)
```

## Configuration Reference

### Files

- **`instrumentation.ts`** - OpenTelemetry setup with LangfuseSpanProcessor
- **`src/lib/langfuse/client.ts`** - Langfuse client singleton
- **`src/lib/langfuse/config.ts`** - Configuration and constants
- **`src/app/api/generate-email/route.ts`** - Email generation with tracing
- **`src/app/api/lead-research/route.ts`** - Lead research with tracing

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LANGFUSE_SECRET_KEY` | Yes | - | Your Langfuse secret key |
| `LANGFUSE_PUBLIC_KEY` | Yes | - | Your Langfuse public key |
| `LANGFUSE_BASE_URL` | No | `https://cloud.langfuse.com` | Langfuse API endpoint |
| `LANGFUSE_ENABLE_TRACING` | No | `true` | Enable/disable tracing |
| `LANGFUSE_ENABLE_PROMPTS` | No | `true` | Enable/disable prompt management |

## Troubleshooting

### Traces not appearing in Langfuse

1. Check your API keys are correct
2. Verify `LANGFUSE_BASE_URL` matches your region
3. Check network connectivity
4. Look for errors in console logs

### High latency

The Langfuse SDK batches and sends traces asynchronously, adding minimal overhead (~5-10ms). If you experience issues:

1. Check your network connection
2. Consider self-hosting Langfuse
3. Disable tracing in development: `LANGFUSE_ENABLE_TRACING=false`

### Prompts not loading from Langfuse

1. Create prompts in Langfuse UI with exact names:
   - `email-generation-system`
   - `lead-research-system`
2. Make sure prompts are published
3. Check console for warnings
4. Verify API keys have read permissions

## Resources

- [Langfuse Documentation](https://langfuse.com/docs)
- [TypeScript SDK v4](https://langfuse.com/docs/sdk/typescript)
- [OpenTelemetry Integration](https://langfuse.com/docs/integrations/opentelemetry)
- [Prompt Management Guide](https://langfuse.com/docs/prompts)
- [Evaluation Guide](https://langfuse.com/docs/scores/overview)

## Next Steps

1. **Set up evaluations:** Create scoring configs to rate email quality
2. **Add custom metrics:** Track business KPIs alongside AI metrics
3. **Set up alerts:** Get notified of errors or performance degradation
4. **Optimize costs:** Identify expensive operations and optimize
5. **A/B test prompts:** Compare different prompt versions in production


