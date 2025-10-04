# Langfuse Quick Start Guide

Get up and running with Langfuse observability in 5 minutes.

## Step 1: Get Your API Keys

1. Visit [https://cloud.langfuse.com](https://cloud.langfuse.com) (or [US region](https://us.cloud.langfuse.com))
2. Sign up for a free account
3. Create a new project
4. Copy your **Public Key** and **Secret Key** from the project settings

## Step 2: Configure Environment Variables

Add to your `.env.local` file:

```bash
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key-here
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key-here
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

## Step 3: Start Your Application

```bash
pnpm dev
```

That's it! The instrumentation is already configured and will automatically track all AI operations.

## Step 4: Generate Some Data

1. Open your application at [http://localhost:3000](http://localhost:3000)
2. Generate some emails or run lead research
3. Open your Langfuse dashboard
4. Navigate to **Traces** to see your data

## What You'll See in Langfuse

### Email Generation Traces

Each email generation creates a trace with:
- **Input**: Lead details, prompt, research summary
- **Output**: Generated email content
- **Metrics**: Token usage, latency, cost
- **Metadata**: Model used, lead company, output length

### Lead Research Traces

Each research request creates a trace with:
- **Input**: Lead information, search query
- **Output**: Research summary and sources
- **Metrics**: Token usage, latency, number of sources
- **Metadata**: Model, lead details, summary length

## Advanced Features

### 1. Prompt Management

Create prompts in Langfuse UI with these exact names:
- `email-generation-system` - System prompt for email generation
- `lead-research-system` - System prompt for lead research

Your app will automatically use the latest version from Langfuse.

### 2. Evaluation & Scoring

Score email quality using the API:

```bash
curl -X POST http://localhost:3000/api/evaluate-email \
  -H "Content-Type: application/json" \
  -d '{
    "traceId": "your-trace-id-from-langfuse",
    "scores": {
      "quality": 0.85,
      "personalization": 0.90,
      "professionalTone": 0.88
    },
    "comment": "Excellent personalized email"
  }'
```

### 3. Filtering & Analytics

In Langfuse dashboard, filter by:
- **Tags**: `email-generation`, `lead-research`, `production`, `development`
- **Metadata**: Company name, model type
- **Time range**: Last hour, day, week, month

### 4. Cost Analysis

View cost breakdowns by:
- Feature (email vs research)
- Model (GPT-4 vs GPT-4-mini)
- Time period
- Individual leads

## Troubleshooting

### "No traces appearing"

1. Check your API keys are correct
2. Verify `LANGFUSE_BASE_URL` matches your region (EU or US)
3. Check browser console and server logs for errors
4. Make sure you've restarted your dev server after adding env vars

### "Prompts not loading"

1. Create prompts in Langfuse UI (not just save as draft)
2. Publish the prompts
3. Use exact names: `email-generation-system` and `lead-research-system`
4. Check console for error messages

### "High latency"

- Langfuse tracing is asynchronous and adds ~5-10ms overhead
- If experiencing issues, disable in development: `LANGFUSE_ENABLE_TRACING=false`
- Consider self-hosting Langfuse for lower latency

## Need More Help?

- 📖 [Full Setup Guide](./LANGFUSE_SETUP.md)
- 🌐 [Langfuse Docs](https://langfuse.com/docs)
- 💬 [Langfuse Discord](https://discord.gg/langfuse)
- 🐛 [Report Issues](https://github.com/langfuse/langfuse/issues)

## Key Files

- `instrumentation.ts` - OpenTelemetry initialization
- `src/lib/langfuse/` - Langfuse utilities and helpers
- `src/app/api/generate-email/route.ts` - Instrumented email API
- `src/app/api/lead-research/route.ts` - Instrumented research API
- `src/app/api/evaluate-email/route.ts` - Scoring API

Happy tracing! 🎉


