# Task 6: Manual Steps Required

## Overview

Task 6 from the Langfuse integration spec requires creating prompts in the Langfuse UI. This is a **manual task** that cannot be automated through code. This document provides a quick reference for completing the manual steps.

## What Has Been Completed (Automated)

✅ **Task 6.3** - Test script created
- Created `scripts/test-langfuse-prompts.ts` for testing prompt fetching
- Added npm script `test:prompts` for easy execution
- Created comprehensive documentation in `docs/langfuse-prompt-setup-guide.md`

## What You Need to Do (Manual)

### ⚠️ Task 6.1: Create email-generation-system Prompt

**Action Required:** Log into Langfuse Cloud and create the prompt manually

**Quick Steps:**
1. Go to https://cloud.langfuse.com
2. Navigate to Prompts → New Prompt
3. Name: `email-generation-system`
4. Type: Text
5. Content: System prompt for email generation (see guide)
6. Config: `{"model": "gpt-4o-mini", "temperature": 0.7, "maxOutputTokens": 700}`
7. Label: `production`

**Detailed Instructions:** See `docs/langfuse-prompt-setup-guide.md` → Task 6.1

---

### ⚠️ Task 6.2: Create email-generation-user Prompt

**Action Required:** Log into Langfuse Cloud and create the prompt manually

**Quick Steps:**
1. Go to https://cloud.langfuse.com
2. Navigate to Prompts → New Prompt
3. Name: `email-generation-user`
4. Type: Text
5. Content: User prompt template with variables (see guide)
6. Variables: `{{body}}`, `{{subject}}`, `{{name}}`, `{{date}}`
7. Config: `{"model": "gpt-4o-mini", "temperature": 0.7, "maxOutputTokens": 700}`
8. Label: `production`

**Detailed Instructions:** See `docs/langfuse-prompt-setup-guide.md` → Task 6.2

---

## After Creating Prompts

Once you've created both prompts in the Langfuse UI, verify they work:

```bash
# Run the test script
npm run test:prompts
```

Expected result: All tests should pass ✅

## Files Created for This Task

1. **`scripts/test-langfuse-prompts.ts`** - Test script for prompt fetching
2. **`docs/langfuse-prompt-setup-guide.md`** - Comprehensive setup guide
3. **`scripts/README.md`** - Documentation for scripts directory
4. **`docs/TASK-6-MANUAL-STEPS.md`** - This file (quick reference)

## Next Steps

After completing the manual steps and verifying with the test script:

1. Mark tasks 6.1 and 6.2 as complete in `tasks.md`
2. Proceed to **Task 7**: Integrate prompts into generate-email route
3. The integration will use the prompts you created via the `getPrompt()` utility

## Need Help?

- **Full Guide:** `docs/langfuse-prompt-setup-guide.md`
- **Langfuse Docs:** https://langfuse.com/docs/prompts
- **Test Script:** `scripts/test-langfuse-prompts.ts`
