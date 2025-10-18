# Implementation Plan

- [x] 1. Create XYZ Formula Master Prompt Module
  - Create `src/lib/prompts/xyz-formula.ts` file with TypeScript module structure
  - Define the complete XYZ formula master prompt as a string constant including all six components, vocabulary lists, Burn Media Group context, example emails, and tone guidelines
  - Implement `getXYZFormulaMasterPrompt()` function that returns the cached prompt string
  - Implement `getPromptVersion()` function that returns the current version (1.0.0)
  - Add error handling with fallback to minimal default prompt if loading fails
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 2. Update Email Generation API Route
  - Import `getXYZFormulaMasterPrompt` and `getPromptVersion` functions in `src/app/api/generate-email/route.ts`
  - Modify the POST handler to use XYZ formula prompt as default when `system` parameter is not provided
  - Update the `generateText` call to use the `systemPrompt` variable instead of directly using `system`
  - Add `X-Prompt-Version` header to the response to track which prompt version was used
  - Preserve backward compatibility by allowing custom system prompts to override the default
  - _Requirements: 1.1, 1.4, 1.5, 6.1, 6.2, 6.5_

- [x] 3. Implement Prompt Content Structure
  - Write Section 1 of master prompt: Role & Objective (define the AI's role as expert sales email writer)
  - Write Section 2 of master prompt: XYZ Formula Structure (define all six components with clear descriptions)
  - Write Section 3 of master prompt: Component Vocabulary (include all minimization verbs, maximization verbs, desired nouns, undesired nouns, action verbs, ending phrases)
  - Write Section 4 of master prompt: Burn Media Group Context (include network metrics, audience demographics, advertising options, performance metrics)
  - Write Section 5 of master prompt: Tone & Style Guidelines (natural conversational tone, quantification, research integration)
  - Write Section 6 of master prompt: Example Emails (include 3 complete annotated examples demonstrating XYZ formula)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4. Update Frontend to Use XYZ Formula by Default
  - Locate the email generation call in `src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx` (around line 3455)
  - Remove the `system` parameter from the API request body to allow the API to use the XYZ formula prompt by default
  - Update `DEFAULT_PROMPT_CONTENT` constant (line 214) to reference the XYZ formula or remove it if no longer needed
  - Update the `DEFAULT_PROMPTS` array to reflect the new default behavior
  - Verify that the prompt editor UI still allows users to override with custom prompts when needed
  - Test that emails are now generated using the XYZ formula structure instead of the old MambaOnline prompt
  - _Requirements: 1.1, 1.4, 6.1, 6.2_

- [ ]* 5. Add Unit Tests for Prompt Module
  - Create test file `src/lib/prompts/xyz-formula.test.ts`
  - Write test to verify `getXYZFormulaMasterPrompt()` returns non-empty string
  - Write test to verify prompt contains all required sections (components, vocabulary, Burn Media context, examples)
  - Write test to verify `getPromptVersion()` returns valid semver format
  - Write test to verify vocabulary lists contain expected verbs and nouns
  - Write test to verify at least 3 example emails are present in the prompt
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4_

- [ ]* 6. Add Integration Tests for API Route
  - Create or update test file for API route testing
  - Write test to verify XYZ prompt is used when system prompt is not provided
  - Write test to verify custom system prompt overrides XYZ prompt
  - Write test to verify research summary is compiled correctly with XYZ prompt
  - Write test to verify X-Prompt-Version header is set in response
  - Write test to verify error handling for invalid requests still works
  - _Requirements: 1.1, 1.4, 1.5, 6.5_

- [ ] 7. Manual Testing and Quality Validation
  - Test email generation with various lead scenarios (different industries, roles, company sizes)
  - Verify generated emails follow XYZ formula structure (all six components present and in order)
  - Verify emails sound natural and conversational (not templated or robotic)
  - Verify research insights are incorporated naturally when provided
  - Verify Burn Media metrics are referenced appropriately in generated emails
  - Verify quantifiable results are included when relevant
  - Verify call to action is clear and low-pressure
  - Test backward compatibility with existing API clients
  - Test custom system prompts still override the default XYZ prompt
  - Verify generation time remains acceptable (<5 seconds)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 8.5_

- [ ]* 8. Add Documentation
  - Update API documentation to describe the XYZ formula default behavior
  - Document how to override the default prompt with custom system prompts
  - Document the X-Prompt-Version header and its purpose
  - Add examples of generated emails using the XYZ formula
  - Document the prompt version management strategy
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
