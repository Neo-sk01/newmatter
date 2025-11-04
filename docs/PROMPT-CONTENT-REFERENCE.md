# Langfuse Prompt Content Reference

Quick copy-paste reference for creating prompts in Langfuse UI.

---

## Prompt 1: email-generation-system

### Basic Info
- **Name:** `email-generation-system`
- **Type:** Text
- **Label:** `production`

### Prompt Content
```
You are a professional email writing assistant. Your task is to help generate well-structured, professional emails based on the user's requirements.

Guidelines:
- Maintain a professional and appropriate tone
- Ensure proper email structure (greeting, body, closing)
- Be concise and clear
- Adapt the style based on the context provided
- Use proper grammar and punctuation
```

### Config (JSON)
```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxOutputTokens": 700,
  "description": "System prompt for email generation"
}
```

---

## Prompt 2: email-generation-user

### Basic Info
- **Name:** `email-generation-user`
- **Type:** Text
- **Label:** `production`

### Prompt Content
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

### Variables
- `{{body}}` - The main content/context for the email
- `{{subject}}` - The email subject line
- `{{name}}` - The recipient's name
- `{{date}}` - The date for the email

### Config (JSON)
```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxOutputTokens": 700,
  "description": "User prompt template for email generation with variables"
}
```

---

## Quick Creation Steps

### For each prompt:

1. **Navigate:** Langfuse Cloud → Prompts → New Prompt
2. **Name:** Copy from "Name" field above
3. **Type:** Select "Text"
4. **Prompt:** Copy entire content from "Prompt Content" section
5. **Config:** Copy JSON from "Config" section
6. **Labels:** Add `production`
7. **Save:** Click Create/Save button

### After creating both:

```bash
npm run test:prompts
```

All tests should pass ✅

---

## Notes

- **Case Sensitive:** Prompt names must match exactly
- **Variables:** Use double curly braces `{{variable}}`
- **Labels:** The "production" label is required for default fetching
- **Config:** Must be valid JSON
- **Version:** First version will be 1 (auto-assigned)

---

## Verification

After creating, verify in Langfuse UI:
- Both prompts appear in prompts list
- Both have "production" label
- Both show version 1
- Config is properly formatted

Then run test script to confirm:
```bash
npm run test:prompts
```
