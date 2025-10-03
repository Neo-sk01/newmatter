# Environment Setup for AI-Powered CSV Parsing

## Required Environment Variables

To enable AI-powered CSV parsing with GPT-4o-mini, you need to configure your OpenAI API key.

### Step 1: Create `.env.local` file

Create a file named `.env.local` in the root of your project:

```bash
touch .env.local
```

### Step 2: Add your OpenAI API Key

Open `.env.local` and add the following:

```env
# Required for AI email generation and CSV parsing
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Optional: override GPT model for research summaries (defaults to gpt-4o)
AI_RESEARCH_MODEL=

# Supabase configuration (optional for local prototyping)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_ACCESS_TOKEN=
```

### Step 3: Get an OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env.local` file

### Step 4: Restart the Development Server

After adding the API key, restart your Next.js development server:

```bash
npm run dev
```

## Fallback Behavior

If the OpenAI API key is not configured or the AI service is unavailable:

- The system will automatically fall back to heuristic header mapping
- CSV parsing will still work, but without AI-powered intelligence
- You'll see a console warning: "Enhanced AI parsing unavailable, using fallback parser"

## What AI Parsing Provides

When properly configured, the AI-powered CSV parser offers:

✅ **Intelligent Column Mapping** - Automatically maps any CSV column to the correct lead field
✅ **Data Quality Analysis** - Validates emails, detects duplicates, checks completeness  
✅ **Smart Suggestions** - AI-generated recommendations for improving data quality
✅ **Custom Field Detection** - Automatically identifies and preserves custom fields
✅ **Natural Language Understanding** - Handles variations like "First Name", "fname", "first_name"
✅ **Confidence Scoring** - Provides confidence levels for mappings

## Troubleshooting

### CSV imports not showing leads?

1. Check browser console for errors
2. Verify `.env.local` exists and has valid OPENAI_API_KEY
3. Restart the dev server after adding environment variables
4. Check that the CSV file has proper headers and data

### "API error: 503" message?

This means the OpenAI API key is not configured. Add it to `.env.local` and restart.

### Fallback parser works but want AI features?

Configure the OPENAI_API_KEY as described above to enable full AI capabilities.

