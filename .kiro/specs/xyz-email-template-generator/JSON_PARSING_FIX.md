# JSON Parsing Fix for SalesMatter Prompt

## Issue
The SalesMatter master system prompt returns JSON with the key `email` for the email body:
```json
{
  "subject": "string",
  "email": "string"
}
```

But the frontend was only looking for the key `body`:
```json
{
  "subject": "string",
  "body": "string"
}
```

This caused the email body to display as raw JSON in the preview section instead of being parsed correctly.

## Root Cause
**Mismatch between prompt output schema and frontend parsing logic**

- **SalesMatter Prompt Output**: Uses `email` key for the email body content
- **Frontend Parser**: Was only checking for `body` key
- **Result**: `parsed.body` was undefined, so the fallback logic kicked in and displayed the raw JSON

## Solution

### 1. Updated Frontend JSON Parsing
**File**: `src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx`

**Before**:
```typescript
const parsed = JSON.parse(jsonMatch[0]);
nextSubject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
nextBody = typeof parsed.body === "string" ? parsed.body.trim() : "";
```

**After**:
```typescript
const parsed = JSON.parse(jsonMatch[0]);
nextSubject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
// SalesMatter prompt uses "email" key, fallback to "body" for backward compatibility
nextBody = typeof parsed.email === "string" ? parsed.email.trim() : 
           typeof parsed.body === "string" ? parsed.body.trim() : "";
```

**Benefits**:
- ✅ Supports new SalesMatter prompt format (`email` key)
- ✅ Maintains backward compatibility with old format (`body` key)
- ✅ Graceful fallback if neither key exists

### 2. Cleaned Up User Prompt
**File**: `src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx`

**Before**:
```typescript
const prompt = `Recipient details:
...
Generate a refreshed cold outreach email that feels human and authentic. Respond with valid JSON in the shape {"subject": "...", "body": "..."}.`;
```

**After**:
```typescript
const prompt = `Recipient details:
...
Generate a refreshed cold outreach email that feels human and authentic.`;
```

**Rationale**:
- The system prompt (SalesMatter) already specifies the JSON output format
- Duplicate JSON instructions could cause confusion
- Cleaner separation of concerns: system prompt handles format, user prompt provides context

## How It Works Now

### Email Generation Flow

1. **User clicks "Generate"** for a lead

2. **Frontend builds prompt** with lead details:
   ```
   Recipient details:
   - Name: John Doe
   - Company: Acme Corp
   ...
   Generate a refreshed cold outreach email that feels human and authentic.
   ```

3. **API receives request** with:
   - `prompt`: User-facing prompt with lead details
   - `researchSummary`: Optional research insights
   - `lead`: Lead object
   - **NO `system` parameter** (uses SalesMatter prompt by default)

4. **API uses SalesMatter prompt** which instructs:
   ```
   OUTPUT
   Strict JSON only.
   Keys: subject, email.
   No markdown, no backticks, no commentary.
   ```

5. **AI generates JSON**:
   ```json
   {
     "subject": "A quick thought on Acme's role in...",
     "email": "Hi John,\n\nI read your recent..."
   }
   ```

6. **Frontend parses response**:
   - Extracts JSON from response text
   - Looks for `parsed.email` first (SalesMatter format)
   - Falls back to `parsed.body` if needed (old format)
   - Displays subject and body in preview

7. **User sees properly formatted email** in the preview section

## Testing Checklist

### Manual Testing
- [x] Generate email for a lead
- [x] Verify email body displays as formatted text (not JSON)
- [x] Verify subject line is extracted correctly
- [x] Verify newlines are preserved in email body
- [x] Verify no raw JSON appears in preview

### Edge Cases
- [ ] Test with lead that has research summary
- [ ] Test with lead that has no research summary
- [ ] Test with various lead data completeness
- [ ] Test with special characters in lead data
- [ ] Test with very long company names

### Backward Compatibility
- [ ] If old prompt format is used (returns `body`), verify it still works
- [ ] Verify fallback logic handles missing keys gracefully
- [ ] Verify error handling for malformed JSON

## Potential Issues & Solutions

### Issue: AI returns malformed JSON
**Solution**: Frontend has fallback logic that:
1. Tries to extract JSON with regex
2. Falls back to parsing subject/body separately
3. Falls back to displaying raw text if all else fails

### Issue: AI returns JSON with extra keys
**Solution**: Frontend only extracts `subject` and `email`/`body`, ignores other keys

### Issue: AI returns markdown or backticks
**Solution**: 
- SalesMatter prompt explicitly forbids markdown and backticks
- Frontend regex extracts JSON even if wrapped in backticks

### Issue: Newlines not preserved
**Solution**: 
- AI returns `\n` in JSON string
- Frontend `.trim()` preserves internal newlines
- Display component should respect newlines (use `white-space: pre-wrap`)

## Files Modified

1. **`src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx`**
   - Updated JSON parsing to check for `email` key first
   - Added backward compatibility for `body` key
   - Removed duplicate JSON format instruction from user prompt

## Files NOT Modified

- `src/app/api/generate-email/route.ts` - No changes needed
- `src/lib/prompts/xyz-formula.ts` - Prompt format is correct as-is

## Success Criteria

✅ Email body displays as formatted text, not JSON  
✅ Subject line is extracted correctly  
✅ Newlines are preserved in email body  
✅ No raw JSON visible in preview section  
✅ Backward compatible with old prompt format  
✅ Graceful error handling for malformed responses  

## Future Enhancements

### Potential Improvements
1. **Type-safe parsing**: Create TypeScript interfaces for prompt responses
2. **Validation**: Add Zod schema validation for AI responses
3. **Error recovery**: Better UX for parsing failures
4. **Format detection**: Auto-detect response format and parse accordingly

### Monitoring
- Track JSON parsing success rate
- Monitor fallback usage frequency
- Log malformed responses for analysis
- Collect user feedback on email quality

## Rollback Plan

If issues arise:
1. Revert changes to `src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx`
2. Previous parsing logic will work with old prompt format
3. No API changes needed
4. Changes are isolated to frontend parsing logic

## Related Documentation

- `SALESMATTER_PROMPT_UPDATE.md` - Details on the new prompt format
- `SIMPLIFIED_IMPLEMENTATION.md` - Overview of prompt management removal
- `IMPLEMENTATION_NOTES.md` - Original XYZ formula implementation notes
