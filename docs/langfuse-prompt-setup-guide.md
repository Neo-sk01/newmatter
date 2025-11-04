# Langfuse Prompt Setup Guide

This guide walks you through creating the required prompts in the Langfuse UI for the SalesMatter application.

## Prerequisites

1. Langfuse Cloud account at https://cloud.langfuse.com
2. Environment variables configured in `.env`:
   - `LANGFUSE_SECRET_KEY`
   - `LANGFUSE_PUBLIC_KEY`
   - `LANGFUSE_BASE_URL`

## Task 6.1: Create email-generation-system Prompt

### Step 1: Log into Langfuse Cloud
1. Navigate to https://cloud.langfuse.com
2. Log in with your credentials
3. Select your project (or create a new one if needed)

### Step 2: Create New Prompt
1. Click on **"Prompts"** in the left sidebar
2. Click **"+ New Prompt"** button
3. Fill in the prompt details:

**Prompt Name:** `email-generation-system`

**Prompt Type:** Select **"Text"**

**Prompt Content:**
```
You are a professional email writing assistant. Your task is to help generate well-structured, professional emails based on the user's requirements.

Guidelines:
- Maintain a professional and appropriate tone
- Ensure proper email structure (greeting, body, closing)
- Be concise and clear
- Adapt the style based on the context provided
- Use proper grammar and punctuation
```

**Config (JSON):**
```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxOutputTokens": 700,
  "description": "System prompt for email generation"
}
```

**Labels:** Add label `production`

### Step 3: Save and Verify
1. Click **"Create"** or **"Save"**
2. Verify the prompt appears in your prompts list
3. Note the version number (should be 1)

---

## Task 6.2: Create email-generation-user Prompt

### Step 1: Create New Prompt
1. In the Prompts section, click **"+ New Prompt"** again
2. Fill in the prompt details:

**Prompt Name:** `email-generation-user`

**Prompt Type:** Select **"Text"**

**Prompt Content:**
```
Generate a professional email with the following details:

Subject: {{subject}}
Recipient Name: {{name}}
Date: {{date}}

Email Body Context:
{{body}}

Please create a complete email that includes:
1. An appropriate greeting using the recipient's name
2. A well-structured body that incorporates the context provided
3. A professional closing
4. Maintain a professional and courteous tone throughout
```

**Variables to Define:**
- `{{body}}` - The main content/context for the email
- `{{subject}}` - The email subject line
- `{{name}}` - The recipient's name
- `{{date}}` - The date for the email

**Config (JSON):**
```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxOutputTokens": 700,
  "description": "User prompt template for email generation with variables"
}
```

**Labels:** Add label `production`

### Step 2: Save and Verify
1. Click **"Create"** or **"Save"**
2. Verify the prompt appears in your prompts list
3. Note the version number (should be 1)

---

## Task 6.3: Test Prompt Fetching

After creating both prompts in the Langfuse UI, you can test that they're working correctly.

### Step 1: Install tsx (if not already installed)
```bash
npm install -D tsx
```

### Step 2: Run the Test Script
```bash
npx tsx scripts/test-langfuse-prompts.ts
```

### Expected Output
The test script will:
1. ✅ Fetch the `email-generation-system` prompt
2. ✅ Fetch the `email-generation-user` prompt
3. ✅ Compile the user prompt with sample variables
4. ✅ Verify that variables are replaced correctly
5. ✅ Verify the "production" label is assigned
6. ✅ Verify the config structure is correct

### Troubleshooting

**Error: "Prompt not found"**
- Verify the prompt names match exactly (case-sensitive)
- Check that prompts are created in the correct Langfuse project
- Verify your `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are correct

**Error: "Missing credentials"**
- Check that all environment variables are set in `.env`
- Verify the `.env` file is in the project root
- Restart your terminal/IDE after updating `.env`

**Error: "Network error"**
- Check your internet connection
- Verify `LANGFUSE_BASE_URL` is set correctly
- Check if Langfuse Cloud is accessible

**Variables not replaced**
- Verify variable syntax uses double curly braces: `{{variable}}`
- Check that variable names match exactly
- Ensure no extra spaces in variable names

---

## Verification Checklist

Before proceeding to the next task, verify:

- [ ] Both prompts are created in Langfuse UI
- [ ] Both prompts have the "production" label
- [ ] Both prompts have config with model parameters
- [ ] The user prompt has all 4 variables defined
- [ ] Test script runs successfully without errors
- [ ] Compiled output contains replaced variable values
- [ ] You can see both prompts in the Langfuse dashboard

---

## Next Steps

Once all prompts are created and tested:
1. Mark tasks 6.1, 6.2, and 6.3 as complete
2. Proceed to Task 7: Integrate prompts into generate-email route
3. The prompts will be fetched dynamically in the API routes

## Additional Resources

- [Langfuse Prompt Management Documentation](https://langfuse.com/docs/prompts)
- [Langfuse Variables Documentation](https://langfuse.com/docs/prompts/variables)
- [Langfuse Labels Documentation](https://langfuse.com/docs/prompts/labels)
