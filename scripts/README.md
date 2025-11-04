# Scripts Directory

This directory contains utility scripts for testing and managing the SalesMatter application.

## Available Scripts

### test-langfuse-prompts.ts

Tests Langfuse prompt fetching and compilation functionality.

**Purpose:**
- Verify prompts are created correctly in Langfuse UI
- Test prompt fetching by name and label
- Test prompt compilation with variables
- Validate prompt configuration structure

**Prerequisites:**
1. Prompts must be created in Langfuse UI first (see `docs/langfuse-prompt-setup-guide.md`)
2. Environment variables must be configured in `.env`:
   - `LANGFUSE_SECRET_KEY`
   - `LANGFUSE_PUBLIC_KEY`
   - `LANGFUSE_BASE_URL`

**Usage:**
```bash
# Using npm script
npm run test:prompts

# Or directly with tsx
npx tsx scripts/test-langfuse-prompts.ts
```

**Expected Output:**
```
🧪 Testing Langfuse Prompt Fetching

📝 Test 1: Fetching email-generation-system prompt...
✅ Successfully fetched system prompt
   - Name: email-generation-system
   - Version: 1
   - Type: text
   - Labels: production
   - Config: { model: 'gpt-4o-mini', temperature: 0.7, ... }

📝 Test 2: Fetching email-generation-user prompt...
✅ Successfully fetched user prompt
   ...

📝 Test 3: Compiling user prompt with sample variables...
✅ Successfully compiled prompt
   ...

═══════════════════════════════════════════════════════
✅ All tests passed successfully!
═══════════════════════════════════════════════════════
```

**Troubleshooting:**
- If prompts are not found, verify they exist in Langfuse UI
- Check that prompt names match exactly (case-sensitive)
- Verify environment variables are set correctly
- Ensure you're using the correct Langfuse project

## Adding New Scripts

When adding new scripts to this directory:
1. Use TypeScript for type safety
2. Add clear documentation at the top of the file
3. Update this README with usage instructions
4. Consider adding an npm script in `package.json` for convenience
