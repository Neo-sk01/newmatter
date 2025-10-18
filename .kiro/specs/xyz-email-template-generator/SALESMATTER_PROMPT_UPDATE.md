# SalesMatter Master System Prompt Implementation

## Overview
The XYZ Formula prompt has been updated to use the new SalesMatter master system prompt for Burn Media Group. This prompt is now the single, constant system prompt used for all email generation in the application.

## Changes Made

### File Updated
- **`src/lib/prompts/xyz-formula.ts`**
  - Replaced the entire XYZ_FORMULA_PROMPT_TEMPLATE with the new SalesMatter prompt
  - Updated version from 1.0.0 to 2.0.0
  - Updated last modified date to 2025-01-19

### Key Differences from Previous Prompt

#### 1. Structure & Format
**Before**: Markdown-style with headers, bullet points, and detailed sections
**After**: Clean, structured text with clear section labels (ROLE, STYLE RULES, BURN MEDIA FACTS, etc.)

#### 2. Writing Style Emphasis
**New additions**:
- Explicit instruction to allow "tiny hesitations and mild digressions"
- Permission for "a little redundancy" to sound human
- Instruction to "introduce mild ambiguity or a small contradiction if natural"
- Stronger emphasis on avoiding em dashes, using connecting words instead

#### 3. Simplified Structure
**Before**: Six detailed components with extensive vocabulary lists
**After**: Streamlined Carl Davis XYZ structure with practical guidance

#### 4. Metrics Presentation
**Before**: Organized by category (Network Reach, Audience Demographics, etc.)
**After**: Flat list of facts that can be woven naturally into emails

#### 5. Output Format
**Before**: General JSON guidance
**After**: Strict JSON schema with explicit example showing escaped newlines

#### 6. Example Quality
**Before**: Three detailed examples with component breakdowns
**After**: One comprehensive example (Huawei/Nomsa) showing the exact output format

## New Prompt Structure

### ROLE
Defines the writer's identity and approach

### STYLE RULES
8 specific rules for natural, human writing:
1. Vary sentence length
2. Allow hesitations and digressions
3. Redundancy is okay
4. Mild ambiguity is natural
5. No em dashes - use connecting words
6. Neutral English, no slang
7. Natural paragraphing
8. Avoid hype, sound competent

### BURN MEDIA FACTS
Flat list of all available metrics and positioning:
- Network publications
- Publishing cadence (22/week, ~90/month)
- Audience size (200k uniques, 300k impressions)
- Newsletter (25k subscribers)
- Social reach (51k Twitter, 1.3k LinkedIn)
- Team size (300+ contributors, 6 journalists)
- Advertising options
- Pricing examples
- Performance benchmarks
- Brand positioning

### STRUCTURE
Carl Davis XYZ adapted:
1. Connection
2. Specialty
3. Possible Problem or Desire
4. Possible Value
5. End Result
6. Action + Soft Close

### TONE GUARDRAILS
- 120-180 words
- Conversational metrics
- No stat dumps
- Don't invent data
- No bullets in final email

### OUTPUT
- Strict JSON only
- Keys: subject, email
- No markdown, backticks, or commentary

### WRITING LOGIC
Step-by-step instructions for composing the email:
1. Open with Connection
2. Establish Burn Media with 1-2 metrics
3. Name problem/desire
4. Blend options naturally
5. Add supporting metrics
6. Offer performance guardrail
7. Close with soft CTA

### EXAMPLE OUTPUT
Complete JSON example with the Huawei/Nomsa email showing:
- Natural, conversational tone
- Metrics woven throughout
- Proper JSON escaping
- Human imperfections (hesitations, natural flow)

## Benefits of the New Prompt

### 1. More Human Output
- Explicit permission for imperfections
- Encourages natural hesitations
- Allows mild contradictions and ambiguity
- Results in emails that feel personally written

### 2. Clearer Instructions
- Structured sections are easier to parse
- Flat fact list is simpler to reference
- Writing logic provides step-by-step guidance
- Single comprehensive example shows the target

### 3. Better JSON Compliance
- Explicit schema definition
- Example shows proper escaping
- Clear "no markdown" instruction
- Strict output format enforcement

### 4. Consistent Tone
- Style rules are more specific
- Tone guardrails prevent over-selling
- Natural language emphasis throughout
- Competent and curious, not pushy

### 5. Flexible Metrics Usage
- Facts presented as available options
- Guidance to blend naturally
- Permission to omit when appropriate
- No requirement to use all metrics

## Testing Recommendations

### Manual Testing
1. **Generate emails for various industries**
   - Tech/SaaS
   - FMCG/Retail
   - Financial services
   - Automotive
   - Property/Real estate

2. **Verify tone characteristics**
   - Natural sentence variation
   - Presence of connecting words (therefore, perhaps, maybe, because)
   - No em dashes
   - Conversational flow
   - Mild hesitations where appropriate

3. **Check metrics integration**
   - Metrics woven naturally (not dumped)
   - 1-2 metrics in opening
   - Additional metrics in value section
   - Performance guides mentioned as typical, not guaranteed

4. **Validate JSON output**
   - Strict JSON format
   - Proper escaping of newlines
   - No markdown or backticks
   - Only "subject" and "email" keys

5. **Assess email length**
   - Target 120-180 words
   - Concise but complete
   - No unnecessary fluff

### Comparison Testing
Generate emails with the same lead data and compare:
- **Old prompt**: More structured, potentially more formal
- **New prompt**: More natural, human imperfections, conversational

### A/B Testing Recommendations
If possible, test both prompts in production:
- Track response rates
- Measure reply quality
- Monitor conversion to meetings
- Gather qualitative feedback

## Migration Notes

### No Breaking Changes
- Function signature unchanged: `getXYZFormulaMasterPrompt(): string`
- Return type unchanged: `string`
- Version tracking maintained
- Fallback prompt still available

### Backward Compatibility
- API continues to work identically
- Frontend requires no changes
- Existing integrations unaffected

### Version Tracking
- Version bumped to 2.0.0 (major change in prompt content)
- Last updated date: 2025-01-19
- `getPromptVersion()` returns "2.0.0"

## Future Enhancements

### Potential Additions
1. **Industry-specific variants**: Create specialized prompts for different verticals
2. **Tone adjustments**: Add parameters for formal vs. casual tone
3. **Length variants**: Short (100 words), default (150), long (200+)
4. **CTA variants**: Different closing styles (chat, share info, explore, brainstorm)

### Monitoring
- Track email generation success rates
- Monitor JSON parsing errors
- Collect user feedback on email quality
- Analyze response rates from recipients

## Documentation

### For Developers
- Prompt is defined in `src/lib/prompts/xyz-formula.ts`
- Accessed via `getXYZFormulaMasterPrompt()`
- Used automatically by `/api/generate-email` when no system prompt provided
- Version available via `getPromptVersion()`

### For Content Team
- Prompt emphasizes natural, human writing
- Metrics should be woven conversationally
- Tone is competent and curious, not pushy
- Examples show the target style

### For Sales Team
- Emails will sound more personally written
- Natural hesitations and imperfections are intentional
- Metrics are presented conversationally
- CTAs are soft and consultative

## Success Criteria

The new prompt is successful if:
1. ✅ Emails sound more human and less templated
2. ✅ JSON output is consistently valid
3. ✅ Metrics are integrated naturally
4. ✅ Tone is conversational and competent
5. ✅ Length stays within 120-180 words
6. ✅ No em dashes appear in output
7. ✅ Connecting words are used appropriately
8. ✅ Response rates improve or maintain

## Rollback Plan

If issues arise:
1. Revert `src/lib/prompts/xyz-formula.ts` to previous version
2. Version will automatically roll back to 1.0.0
3. No other changes needed
4. Previous prompt is preserved in git history

## Contact

For questions or issues:
- Check `src/lib/prompts/xyz-formula.ts` for current implementation
- Review this document for context
- Test with `/api/generate-email` endpoint
- Monitor version with `getPromptVersion()`
