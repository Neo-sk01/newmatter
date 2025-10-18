# Requirements Document

## Introduction

This feature upgrades the existing email generation agent (`/api/generate-email`) to use the XYZ formula methodology as the default master prompt. The XYZ formula is a proven sales prospecting framework that structures emails into six messaging components: Connection, Specialty, Problem/Desire, Value, End Result, and Transition. The upgrade will replace the current system prompt with the XYZ formula master prompt while maintaining backward compatibility with the existing API interface.

## Glossary

- **XYZ Formula**: A structured sales prospecting methodology that breaks email composition into six messaging components
- **Master Prompt**: The system-level instruction that guides the AI model on how to generate emails following the XYZ formula
- **Email Generation Agent**: The existing API endpoint at `/api/generate-email` that generates personalized emails using AI
- **Messaging Components**: The six structured sections of the XYZ formula (Connection, Specialty, Problem/Desire, Value, End Result, Transition)
- **Component Vocabulary**: Pre-defined verbs and nouns categorized as Minimization Verbs, Maximization Verbs, Desired Nouns, and Undesired Nouns
- **Lead Context**: Information about the prospect (name, company, role, research insights) passed to the generation agent
- **Company Context**: Burn Media Group's specific metrics, audience demographics, advertising options, and value propositions embedded in the master prompt

## Requirements

### Requirement 1

**User Story:** As a developer, I want the email generation agent to use the XYZ formula master prompt by default, so that all generated emails follow the proven prospecting structure.

#### Acceptance Criteria

1. THE Email Generation Agent SHALL use the XYZ formula master prompt as the default system instruction
2. WHEN the system prompt is not provided in the API request, THE Email Generation Agent SHALL apply the XYZ formula master prompt
3. THE Email Generation Agent SHALL structure generated emails with the six XYZ messaging components in order
4. THE Email Generation Agent SHALL maintain the existing API interface without breaking changes
5. WHERE a custom system prompt is provided in the API request, THE Email Generation Agent SHALL allow it to override the default XYZ formula prompt

### Requirement 2

**User Story:** As a developer, I want the XYZ formula master prompt to instruct the AI on natural, conversational tone, so that generated emails don't sound templated or robotic.

#### Acceptance Criteria

1. THE Email Generation Agent SHALL instruct the AI to write in a natural, conversational tone
2. THE Email Generation Agent SHALL instruct the AI to avoid overly formal or stiff language
3. THE Email Generation Agent SHALL instruct the AI to flow naturally between messaging components without obvious transitions
4. THE Email Generation Agent SHALL instruct the AI to customize phrasing based on the prospect's industry and situation
5. THE Email Generation Agent SHALL instruct the AI to use the Component Vocabulary (Minimization/Maximization Verbs, Desired/Undesired Nouns) appropriately

### Requirement 3

**User Story:** As a developer, I want the master prompt to guide the AI on incorporating research insights, so that emails reference specific prospect information naturally.

#### Acceptance Criteria

1. WHEN research summaries are provided, THE Email Generation Agent SHALL instruct the AI to weave insights into the Connection component
2. THE Email Generation Agent SHALL instruct the AI to reference at least one specific insight from the research summary
3. THE Email Generation Agent SHALL instruct the AI to avoid repeating the research summary verbatim
4. THE Email Generation Agent SHALL instruct the AI to connect research insights to the Value and End Result components
5. THE Email Generation Agent SHALL instruct the AI to personalize the Specialty component based on the prospect's role or industry

### Requirement 4

**User Story:** As a developer, I want the master prompt to enforce quantifiable results in the End Result component, so that emails include specific metrics and outcomes.

#### Acceptance Criteria

1. THE Email Generation Agent SHALL instruct the AI to include quantifiable results when describing outcomes
2. THE Email Generation Agent SHALL provide example quantifications in the master prompt (10%-50% gains, 80% decrease, double conversions)
3. WHEN specific metrics are provided in the user prompt, THE Email Generation Agent SHALL instruct the AI to incorporate them naturally
4. THE Email Generation Agent SHALL instruct the AI to use phrases like "This results in..." or "What this means is..." to introduce outcomes
5. THE Email Generation Agent SHALL instruct the AI to make quantifications realistic and credible

### Requirement 5

**User Story:** As a developer, I want the master prompt to guide the AI on effective Transition components, so that emails end with clear, low-pressure calls to action.

#### Acceptance Criteria

1. THE Email Generation Agent SHALL instruct the AI to use Action Verbs in the Transition component (discuss, ask, review, find out)
2. THE Email Generation Agent SHALL instruct the AI to use soft Ending Phrases that invite dialogue rather than demand commitment
3. THE Email Generation Agent SHALL provide example Ending Phrases in the master prompt ("to see if this could be of value", "to determine if we might have a reason to speak further")
4. THE Email Generation Agent SHALL instruct the AI to avoid pushy or aggressive closing language
5. THE Email Generation Agent SHALL instruct the AI to make the call to action specific and actionable

### Requirement 6

**User Story:** As a developer, I want the master prompt stored as a reusable configuration, so that it can be easily updated and maintained without code changes.

#### Acceptance Criteria

1. THE Email Generation Agent SHALL store the XYZ formula master prompt in a configuration file or database
2. THE Email Generation Agent SHALL load the master prompt from the configuration at runtime
3. WHERE the master prompt configuration is updated, THE Email Generation Agent SHALL use the new version without requiring code deployment
4. THE Email Generation Agent SHALL provide a fallback master prompt if the configuration is unavailable
5. THE Email Generation Agent SHALL log which version of the master prompt is being used for each generation request

### Requirement 7

**User Story:** As a developer, I want the master prompt to include the complete XYZ formula structure and vocabulary, so that the AI has all necessary context to generate effective emails.

#### Acceptance Criteria

1. THE Email Generation Agent SHALL include the six messaging component definitions in the master prompt
2. THE Email Generation Agent SHALL include the complete Component Vocabulary (Minimization Verbs, Maximization Verbs, Desired Nouns, Undesired Nouns) in the master prompt
3. THE Email Generation Agent SHALL include example Connection phrases in the master prompt
4. THE Email Generation Agent SHALL include example Action Verbs and Ending Phrases in the master prompt
5. THE Email Generation Agent SHALL include at least three complete example emails demonstrating the XYZ formula in the master prompt

### Requirement 8

**User Story:** As a sales professional at Burn Media Group, I want the master prompt to include our company's specific metrics and value propositions, so that generated emails accurately reference our network reach, audience demographics, and advertising options.

#### Acceptance Criteria

1. THE Email Generation Agent SHALL include Burn Media Group's network metrics in the master prompt (300k monthly impressions, 200k monthly uniques, 28k Facebook likes, 51k Twitter followers, 25k newsletter subscribers)
2. THE Email Generation Agent SHALL include audience demographic information in the master prompt (age groups, occupations, income levels, industries, engagement patterns)
3. THE Email Generation Agent SHALL include advertising options and formats in the master prompt (display banners, content partnerships, sponsored posts, native content series)
4. THE Email Generation Agent SHALL include campaign performance metrics in the master prompt (average CTR > 0.7%, engagement rates)
5. WHEN generating emails, THE Email Generation Agent SHALL instruct the AI to reference specific Burn Media metrics that align with the prospect's likely interests or needs
