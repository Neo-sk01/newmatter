# Task 6: Action Required - Manual Steps

## 🚨 Important: Manual UI Tasks Required

Tasks 6.1 and 6.2 require **manual actions** in the Langfuse Cloud UI that cannot be automated. This document guides you through completing these tasks.

---

## Step 1: Set Up Langfuse Account & Credentials

### 1.1 Create Langfuse Account (if you haven't already)

1. Go to https://cloud.langfuse.com
2. Sign up for a free account
3. Create a new project (or use an existing one)

### 1.2 Get Your API Credentials

1. In Langfuse Cloud, navigate to **Settings** → **API Keys**
2. Copy your credentials:
   - **Secret Key** (starts with `sk-lf-`)
   - **Public Key** (starts with `pk-lf-`)

### 1.3 Update Your .env File

Replace the placeholder values in your `.env` file:

```bash
# Replace these placeholder values with your actual credentials
LANGFUSE_SECRET_KEY=sk-lf-your-actual-secret-key-here
LANGFUSE_PUBLIC_KEY=pk-lf-your-actual-public-key-here
LANGFUSE_BASE_URL=https://cloud.langfuse.com
LANGFUSE_TRACING_ENVIRONMENT=development
```

⚠️ **Important**: Never commit your actual credentials to git!

---

## Step 2: Create Prompts in Langfuse UI

### Task 6.1: Create `email-generation-system` Prompt

1. **Navigate to Prompts**
   - In Langfuse Cloud, click **"Prompts"** in the left sidebar
   - Click **"+ New Prompt"** button

2. **Configure the Prompt**
   - **Name**: `email-generation-system` (exact match, case-sensitive)
   - **Type**: Select **"Text"**
   
3. **Add Prompt Content**
   ```
   You are a professional email writing assistant. Your task is to help generate well-structured, professional emails based on the user's requirements.

   Guidelines:
   - Maintain a professional and appropriate tone
   - Ensure proper email structure (greeting, body, closing)
   - Be concise and clear
   - Adapt the style based on the context provided
   - Use proper grammar and punctuation
   ```

4. **Add Config (JSON)**
   ```json
   {
     "model": "gpt-4o-mini",
     "temperature": 0.7,
     "maxOutputTokens": 700,
     "description": "System prompt for email generation"
   }
   ```

5. **Add Label**
   - Add label: `production`

6. **Save**
   - Click **"Create"** or **"Save"**
   - Verify the prompt appears in your prompts list

---

### Task 6.2: Create `email-generation-user` Prompt

1. **Navigate to Prompts**
   - Click **"+ New Prompt"** again

2. **Configure the Prompt**
   - **Name**: `email-generation-user` (exact match, case-sensitive)
   - **Type**: Select **"Text"**
   
3. **Add Prompt Content with Variables**
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

   **Note**: The variables `{{body}}`, `{{subject}}`, `{{name}}`, and `{{date}}` will be replaced with actual values when the prompt is compiled.

4. **Add Config (JSON)**
   ```json
   {
     "model": "gpt-4o-mini",
     "temperature": 0.7,
     "maxOutputTokens": 700,
     "description": "User prompt template for email generation with variables"
   }
   ```

5. **Add Label**
   - Add label: `production`

6. **Save**
   - Click **"Create"** or **"Save"**
   - Verify the prompt appears in your prompts list

---

## Step 3: Verify Your Setup

After creating both prompts, run the test script to verify everything works:

```bash
npm run test:prompts
```

### Expected Output

```
🧪 Testing Langfuse Prompt Fetching

📝 Test 1: Fetching email-generation-system prompt...
✅ Successfully fetched system prompt
   - Name: email-generation-system
   - Version: 1
   - Type: text
   - Labels: production
   - Config: { model: 'gpt-4o-mini', temperature: 0.7, maxOutputTokens: 700 }

📝 Test 2: Fetching email-generation-user prompt...
✅ Successfully fetched user prompt
   - Name: email-generation-user
   - Version: 1
   - Type: text
   - Labels: production
   - Config: { model: 'gpt-4o-mini', temperature: 0.7, maxOutputTokens: 700 }

📝 Test 3: Compiling user prompt with sample variables...
✅ Successfully compiled prompt

📝 Test 4: Verifying compiled output contains variables...
   ✅ Variable {{body}} was replaced correctly
   ✅ Variable {{subject}} was replaced correctly
   ✅ Variable {{name}} was replaced correctly
   ✅ Variable {{date}} was replaced correctly

📝 Test 5: Fetching prompt with "production" label...
✅ Successfully fetched prompt with production label
   - Has "production" label: true

📝 Test 6: Verifying prompt config structure...
   - Has model parameter: ✅
   - Has temperature parameter: ✅

═══════════════════════════════════════════════════════
✅ All tests passed successfully!
═══════════════════════════════════════════════════════
```

---

## Troubleshooting

### ❌ Error: "Prompt not found"

**Possible causes:**
- Prompt names don't match exactly (they're case-sensitive)
- Prompts created in wrong Langfuse project
- Credentials are incorrect

**Solutions:**
1. Verify prompt names are exactly: `email-generation-system` and `email-generation-user`
2. Check you're in the correct Langfuse project
3. Verify your API keys in `.env` are correct

---

### ❌ Error: "Missing credentials" or "Unauthorized"

**Possible causes:**
- `.env` file still has placeholder values
- API keys are incorrect
- `.env` file not in project root

**Solutions:**
1. Update `.env` with actual credentials from Langfuse Cloud
2. Verify keys start with `sk-lf-` and `pk-lf-`
3. Restart your terminal/IDE after updating `.env`

---

### ❌ Error: "Network error" or "Connection refused"

**Possible causes:**
- No internet connection
- Langfuse Cloud is down
- Firewall blocking connection

**Solutions:**
1. Check your internet connection
2. Verify https://cloud.langfuse.com is accessible
3. Check firewall settings

---

### ❌ Variables not replaced in compiled output

**Possible causes:**
- Variable syntax incorrect in prompt
- Variable names don't match

**Solutions:**
1. Verify variables use double curly braces: `{{variable}}`
2. Check variable names match exactly (case-sensitive)
3. Ensure no extra spaces: `{{name}}` not `{{ name }}`

---

## Completion Checklist

Before marking tasks as complete, verify:

- [ ] Langfuse account created
- [ ] API credentials obtained and added to `.env`
- [ ] Prompt `email-generation-system` created with:
  - [ ] Correct name (exact match)
  - [ ] Type: Text
  - [ ] System prompt content
  - [ ] Config with model parameters
  - [ ] Label: `production`
- [ ] Prompt `email-generation-user` created with:
  - [ ] Correct name (exact match)
  - [ ] Type: Text
  - [ ] User prompt template
  - [ ] Variables: `{{body}}`, `{{subject}}`, `{{name}}`, `{{date}}`
  - [ ] Config with model parameters
  - [ ] Label: `production`
- [ ] Test script runs successfully: `npm run test:prompts`
- [ ] All 6 tests pass ✅

---

## Next Steps

Once all tests pass:

1. ✅ Mark task 6.1 as complete
2. ✅ Mark task 6.2 as complete
3. ✅ Mark task 6 as complete
4. 🚀 Proceed to **Task 7**: Integrate prompts into generate-email route

---

## Additional Resources

- **Full Setup Guide**: `docs/langfuse-prompt-setup-guide.md`
- **Quick Checklist**: `docs/TASK-6-CHECKLIST.md`
- **Langfuse Documentation**: https://langfuse.com/docs/prompts
- **Langfuse Variables Guide**: https://langfuse.com/docs/prompts/variables

---

## Questions?

If you encounter issues not covered here:
1. Check the full guide: `docs/langfuse-prompt-setup-guide.md`
2. Review Langfuse documentation: https://langfuse.com/docs
3. Verify your `.env` configuration
4. Check the test script output for specific error messages
