# XYZ Formula Frontend Implementation Notes

## Changes Made

### 1. API Call Update (Line ~3461)
**Before:**
```typescript
system: activePrompt?.content ?? DEFAULT_PROMPT_CONTENT,
```

**After:**
```typescript
// Only send system prompt if user has selected a custom prompt with content
// Empty or undefined means use the API's default XYZ formula
system: activePrompt?.content?.trim() || undefined,
```

**Impact:** 
- When no custom prompt is selected or prompt content is empty, `system` will be `undefined`
- The API will then use the XYZ formula master prompt as the default
- Users can still override by selecting a custom prompt with actual content from the library
- The `.trim()` ensures whitespace-only prompts are treated as empty

### 2. DEFAULT_PROMPT_CONTENT Comment Update (Line ~213)
Added clarifying comment:
```typescript
// Default prompt library - XYZ Formula is now the default in the API
// This legacy prompt is kept for reference and can be used as a custom override
```

**Impact:**
- Makes it clear that the XYZ formula is now the system default
- The old MambaOnline prompt is preserved for backward compatibility

### 3. DEFAULT_PROMPTS Array Update (Line ~298)
**Before:**
```typescript
const DEFAULT_PROMPTS: PromptConfig[] = [
  {
    id: "few-shot-nompilo",
    name: "Few-Shot | Nompilo Outreach",
    content: DEFAULT_PROMPT_CONTENT,
  },
];
```

**After:**
```typescript
const DEFAULT_PROMPTS: PromptConfig[] = [
  {
    id: "xyz-formula-default",
    name: "XYZ Formula (Default)",
    content: "", // Empty content means use the API's default XYZ formula prompt
  },
  {
    id: "few-shot-nompilo",
    name: "Few-Shot | Nompilo Outreach (Legacy)",
    content: DEFAULT_PROMPT_CONTENT,
  },
];
```

**Impact:**
- Users now see "XYZ Formula (Default)" as the first option in the prompt library
- Empty content signals to use the API's built-in XYZ formula
- Legacy MambaOnline prompt is still available as a custom override option

## Behavior Verification

### Default Behavior (XYZ Formula)
1. User selects "XYZ Formula (Default)" prompt (or it's selected by default)
2. `activePrompt.content` is empty string `""`
3. `activePrompt?.content?.trim() || undefined` evaluates to `undefined`
4. API call sends `system: undefined`
5. API uses XYZ formula master prompt from `src/lib/prompts/xyz-formula.ts`

### Custom Prompt Override
1. User selects "Few-Shot | Nompilo Outreach (Legacy)" or creates a custom prompt
2. `activePrompt.content` contains the custom prompt text
3. API call sends `system: "<custom prompt text>"`
4. API uses the custom prompt instead of XYZ formula

### Backward Compatibility
- Existing users with custom prompts will continue to work
- The legacy MambaOnline prompt is preserved and accessible
- No breaking changes to the API interface

## Testing Recommendations

### Manual Testing Checklist
- [ ] Generate email with "XYZ Formula (Default)" selected
  - Verify email follows XYZ structure (Connection, Specialty, Problem/Desire, Value, End Result, Transition)
  - Verify email references Burn Media Group metrics
  - Verify natural, conversational tone
  
- [ ] Generate email with "Few-Shot | Nompilo Outreach (Legacy)" selected
  - Verify email uses the old MambaOnline style
  - Verify custom prompt is respected
  
- [ ] Create a new custom prompt and generate email
  - Verify custom prompt overrides the default
  - Verify prompt editor UI works correctly
  
- [ ] Verify research summary integration still works
  - Add research summary to a lead
  - Generate email and verify insights are incorporated

## Requirements Satisfied

✅ **Requirement 1.1**: Email generation agent uses XYZ formula by default  
✅ **Requirement 1.4**: Custom system prompts can override the default  
✅ **Requirement 6.1**: XYZ formula stored as reusable configuration (in API)  
✅ **Requirement 6.2**: Prompt loaded from configuration at runtime (in API)

## Next Steps

1. Test email generation with various lead scenarios
2. Verify XYZ formula structure in generated emails
3. Compare email quality before/after the change
4. Gather user feedback on the new default behavior
