# Task 6 Completion Checklist

Use this checklist to track your progress through Task 6.

## Pre-requisites

- [ ] Langfuse Cloud account created at https://cloud.langfuse.com
- [ ] Environment variables configured in `.env`:
  - [ ] `LANGFUSE_SECRET_KEY` set
  - [ ] `LANGFUSE_PUBLIC_KEY` set
  - [ ] `LANGFUSE_BASE_URL` set
  - [ ] `LANGFUSE_TRACING_ENVIRONMENT` set

## Task 6.1: Create email-generation-system Prompt

- [ ] Logged into Langfuse Cloud
- [ ] Navigated to Prompts section
- [ ] Clicked "New Prompt"
- [ ] Set name to `email-generation-system`
- [ ] Selected "Text" type
- [ ] Added system prompt content
- [ ] Added config JSON with model parameters
- [ ] Assigned "production" label
- [ ] Saved the prompt
- [ ] Verified prompt appears in prompts list

**Prompt Details to Verify:**
- [ ] Name: `email-generation-system` (exact match)
- [ ] Type: Text
- [ ] Label: `production`
- [ ] Config includes: `model`, `temperature`, `maxOutputTokens`

## Task 6.2: Create email-generation-user Prompt

- [ ] Clicked "New Prompt" again
- [ ] Set name to `email-generation-user`
- [ ] Selected "Text" type
- [ ] Added user prompt template
- [ ] Defined variable `{{body}}`
- [ ] Defined variable `{{subject}}`
- [ ] Defined variable `{{name}}`
- [ ] Defined variable `{{date}}`
- [ ] Added config JSON with model parameters
- [ ] Assigned "production" label
- [ ] Saved the prompt
- [ ] Verified prompt appears in prompts list

**Prompt Details to Verify:**
- [ ] Name: `email-generation-user` (exact match)
- [ ] Type: Text
- [ ] Label: `production`
- [ ] Variables: `{{body}}`, `{{subject}}`, `{{name}}`, `{{date}}`
- [ ] Config includes: `model`, `temperature`, `maxOutputTokens`

## Task 6.3: Test Prompt Fetching

- [ ] Installed tsx: `npm install -D tsx` ✅ (Already done)
- [ ] Run test script: `npm run test:prompts`
- [ ] Test 1 passed: Fetched email-generation-system
- [ ] Test 2 passed: Fetched email-generation-user
- [ ] Test 3 passed: Compiled prompt with variables
- [ ] Test 4 passed: Variables replaced correctly
- [ ] Test 5 passed: Production label verified
- [ ] Test 6 passed: Config structure verified
- [ ] All tests passed successfully

## Final Verification

- [ ] Both prompts visible in Langfuse dashboard
- [ ] Both prompts have version 1
- [ ] Both prompts have "production" label
- [ ] Test script runs without errors
- [ ] Compiled output contains actual values (not `{{variables}}`)

## Mark Tasks Complete

Once all checkboxes above are checked:

- [ ] Mark task 6.1 as complete in `.kiro/specs/langfuse-integration/tasks.md`
- [ ] Mark task 6.2 as complete in `.kiro/specs/langfuse-integration/tasks.md`
- [ ] Mark task 6.3 as complete in `.kiro/specs/langfuse-integration/tasks.md` ✅ (Already done)
- [ ] Mark task 6 as complete in `.kiro/specs/langfuse-integration/tasks.md`

## Ready for Next Task?

Once Task 6 is complete, you're ready to proceed to:

**Task 7: Integrate prompts into generate-email route**

This will involve:
- Fetching prompts in the API route
- Compiling prompts with request data
- Linking prompts to AI generations
- Using prompt config for model parameters

---

## Quick Commands Reference

```bash
# Test prompts
npm run test:prompts

# View full guide
cat docs/langfuse-prompt-setup-guide.md

# View manual steps
cat docs/TASK-6-MANUAL-STEPS.md
```

## Troubleshooting

If tests fail, check:
1. Prompt names match exactly (case-sensitive)
2. Prompts are in the correct Langfuse project
3. Environment variables are correct
4. Internet connection is working
5. Langfuse Cloud is accessible

See `docs/langfuse-prompt-setup-guide.md` for detailed troubleshooting.
