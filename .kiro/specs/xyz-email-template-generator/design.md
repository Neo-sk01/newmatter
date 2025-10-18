# Design Document

## Overview

This design upgrades the existing email generation agent (`/api/generate-email`) to use the XYZ formula methodology as the default master prompt. The XYZ formula is a proven sales prospecting framework that structures emails into six messaging components. The design maintains backward compatibility with the existing API while enhancing email quality through a comprehensive system prompt that includes the XYZ formula structure, component vocabulary, Burn Media Group's specific metrics, and example emails.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  (Lead Enrichment UI, Email Generation UI, Campaign Tools)  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ POST /api/generate-email
                         │ { prompt, system?, model?, researchSummary? }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Email Generation API Route                      │
│                 (route.ts - Enhanced)                        │
├─────────────────────────────────────────────────────────────┤
│  1. Validate request body                                    │
│  2. Load XYZ Formula Master Prompt (if system not provided)  │
│  3. Resolve AI model (OpenAI/Anthropic)                      │
│  4. Compile prompt with research summary                     │
│  5. Generate email using AI SDK                              │
│  6. Return generated email text                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              XYZ Formula Master Prompt                       │
│           (lib/prompts/xyz-formula.ts)                       │
├─────────────────────────────────────────────────────────────┤
│  • XYZ Formula Structure & Components                        │
│  • Component Vocabulary (Verbs & Nouns)                      │
│  • Burn Media Group Context                                  │
│  • Example Emails                                            │
│  • Tone & Style Guidelines                                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  Client  │────▶│  API Route   │────▶│ XYZ Prompt  │────▶│ AI Model │
│          │     │              │     │  Loader     │     │          │
└──────────┘     └──────────────┘     └─────────────┘     └──────────┘
     │                  │                     │                  │
     │                  │                     │                  │
     │                  ▼                     ▼                  │
     │           ┌──────────────┐     ┌─────────────┐          │
     │           │ Compile      │     │ Master      │          │
     │           │ Prompt +     │◀────│ Prompt      │          │
     │           │ Research     │     │ Template    │          │
     │           └──────────────┘     └─────────────┘          │
     │                  │                                        │
     │                  └────────────────────────────────────────┘
     │                                                           │
     │◀──────────────────────────────────────────────────────────┘
     │                    Generated Email
     │
```

## Components and Interfaces

### 1. XYZ Formula Master Prompt Module

**Location:** `src/lib/prompts/xyz-formula.ts`

**Purpose:** Centralized storage and management of the XYZ formula master prompt template.

**Interface:**

```typescript
export interface XYZFormulaPromptConfig {
  version: string;
  lastUpdated: string;
  template: string;
}

export function getXYZFormulaMasterPrompt(): string;
export function getPromptVersion(): string;
```

**Implementation Details:**

The master prompt will be structured as a comprehensive system instruction that includes:

1. **XYZ Formula Structure**
   - Six messaging components with definitions
   - Component order and flow guidelines
   - Natural transition techniques

2. **Component Vocabulary**
   - Minimization Verbs: save, reduce, eliminate, cut down on, minimize, decrease, etc.
   - Maximization Verbs: strengthen, boost, increase, expand, enhance, grow, etc.
   - Desired Nouns: profits, sales, revenue, productivity, market share, etc.
   - Undesired Nouns: costs, downtime, turnover, waste, inefficiency, etc.

3. **Burn Media Group Context**
   - Network metrics (300k monthly impressions, 200k uniques, 28k Facebook, 51k Twitter, 25k newsletter subscribers)
   - Audience demographics (age 25-55, professionals/executives, high income, tech-savvy)
   - Advertising options (display, content partnerships, sponsored posts, native content)
   - Performance metrics (CTR > 0.7%, engagement rates)

4. **Example Emails**
   - At least 3 complete examples demonstrating XYZ formula
   - Examples from different industries and use cases
   - Annotated to show component structure

5. **Tone & Style Guidelines**
   - Natural, conversational tone
   - Avoid templated or robotic language
   - Quantify results when possible
   - Low-pressure call to action
   - Personalize based on research insights

### 2. Enhanced Email Generation API Route

**Location:** `src/app/api/generate-email/route.ts`

**Changes:**

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { getXYZFormulaMasterPrompt } from "@/lib/prompts/xyz-formula";

// Existing resolveModel function remains unchanged

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const system = body?.system as string | undefined;
    const modelIdentifier = body?.model ?? body?.modelIdentifier;
    const researchSummary = typeof body?.researchSummary === "string" ? body.researchSummary.trim() : "";

    if (!prompt || typeof prompt !== "string") {
      return new Response("Invalid prompt", { status: 400 });
    }

    let model;
    try {
      model = resolveModel(modelIdentifier);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid model configuration.";
      return new Response(message, { status: 400 });
    }

    // NEW: Use XYZ Formula master prompt if system prompt not provided
    const systemPrompt = system ?? getXYZFormulaMasterPrompt();

    const compiledPrompt = researchSummary
      ? `${prompt.trim()}\n\nApproved research summary (max 100 words):\n${researchSummary}\n\nPersonalize the outreach by referencing at least one insight from the summary. Do not repeat the summary verbatim.`
      : prompt;

    const result = await generateText({
      model,
      system: systemPrompt, // CHANGED: Use systemPrompt variable
      prompt: compiledPrompt,
      maxOutputTokens: 700,
      temperature: 0.7,
    });

    const textResponse = result.text?.trim() ?? "";

    return new Response(textResponse, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Prompt-Version": getPromptVersion(), // NEW: Track prompt version
      },
    });
  } catch (e) {
    return new Response("Failed to generate", { status: 500 });
  }
}
```

**Key Changes:**
- Import `getXYZFormulaMasterPrompt` function
- Use XYZ formula prompt as default when `system` is not provided
- Add `X-Prompt-Version` header to track which prompt version was used
- Maintain backward compatibility (custom system prompts still work)

### 3. Prompt Configuration Storage

**Option A: TypeScript Module (Recommended for MVP)**

Store the master prompt as a TypeScript constant in `src/lib/prompts/xyz-formula.ts`. This approach is simple, type-safe, and requires no database changes.

**Pros:**
- Simple implementation
- Type-safe
- Version controlled in Git
- No database dependencies

**Cons:**
- Requires code deployment to update
- Not editable through UI

**Option B: Database Storage (Future Enhancement)**

Store the master prompt in Supabase with versioning support. This allows runtime updates without deployment.

**Schema:**
```sql
CREATE TABLE email_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Pros:**
- Runtime updates without deployment
- Version history tracking
- Potential for A/B testing
- UI-based editing

**Cons:**
- More complex implementation
- Database dependency
- Requires migration

**Decision:** Start with Option A (TypeScript module) for MVP, plan Option B for future enhancement.

## Data Models

### XYZ Formula Master Prompt Structure

```typescript
interface XYZFormulaPrompt {
  // Metadata
  version: string;
  lastUpdated: string;
  
  // Core prompt template
  template: string;
  
  // Component definitions
  components: {
    connection: ComponentDefinition;
    specialty: ComponentDefinition;
    problemDesire: ComponentDefinition;
    value: ComponentDefinition;
    endResult: ComponentDefinition;
    transition: ComponentDefinition;
  };
  
  // Vocabulary
  vocabulary: {
    minimizationVerbs: string[];
    maximizationVerbs: string[];
    desiredNouns: string[];
    undesiredNouns: string[];
    actionVerbs: string[];
    endingPhrases: string[];
  };
  
  // Company context
  companyContext: {
    name: string;
    metrics: Record<string, string | number>;
    audienceDemographics: string[];
    advertisingOptions: string[];
    performanceMetrics: Record<string, string | number>;
  };
  
  // Examples
  examples: EmailExample[];
}

interface ComponentDefinition {
  name: string;
  description: string;
  guidelines: string[];
  examplePhrases: string[];
}

interface EmailExample {
  title: string;
  subject: string;
  body: string;
  annotations: Record<string, string>; // Component name -> explanation
}
```

### API Request/Response Models

**Request:**
```typescript
interface GenerateEmailRequest {
  prompt: string;                    // User's generation instructions
  system?: string;                   // Optional custom system prompt (overrides XYZ)
  model?: string;                    // Optional model identifier
  modelIdentifier?: string;          // Alias for model
  researchSummary?: string;          // Optional research insights
}
```

**Response:**
```typescript
// Success: Plain text email
// Headers:
//   Content-Type: text/plain; charset=utf-8
//   Cache-Control: no-store
//   X-Prompt-Version: 1.0.0

// Error: Plain text error message with appropriate status code
```

## Error Handling

### Error Scenarios

1. **Invalid Request Body**
   - Missing or invalid `prompt` field
   - Response: 400 Bad Request with message "Invalid prompt"

2. **Invalid Model Configuration**
   - Malformed model identifier
   - Unsupported provider
   - Response: 400 Bad Request with descriptive error message

3. **Prompt Loading Failure**
   - XYZ formula prompt file not found
   - Fallback: Use minimal default prompt
   - Log error for monitoring

4. **AI Generation Failure**
   - API timeout
   - Rate limiting
   - Model errors
   - Response: 500 Internal Server Error with message "Failed to generate"
   - Log full error details for debugging

### Error Handling Strategy

```typescript
// Graceful fallback for prompt loading
function getXYZFormulaMasterPrompt(): string {
  try {
    return XYZ_FORMULA_PROMPT_TEMPLATE;
  } catch (error) {
    console.error("Failed to load XYZ formula prompt:", error);
    // Fallback to minimal prompt
    return "You are a professional sales email writer. Generate a personalized, conversational email based on the provided information.";
  }
}

// Detailed error logging for AI generation
try {
  const result = await generateText({ ... });
} catch (error) {
  console.error("Email generation failed:", {
    error: error instanceof Error ? error.message : "Unknown error",
    model: modelIdentifier,
    promptLength: compiledPrompt.length,
    hasResearchSummary: !!researchSummary,
  });
  return new Response("Failed to generate", { status: 500 });
}
```

## Testing Strategy

### Unit Tests

**Test File:** `src/lib/prompts/xyz-formula.test.ts`

1. **Prompt Loading Tests**
   - Verify `getXYZFormulaMasterPrompt()` returns non-empty string
   - Verify prompt contains all required sections (components, vocabulary, examples)
   - Verify prompt version is valid semver format

2. **Prompt Content Tests**
   - Verify all six XYZ components are defined
   - Verify vocabulary lists contain expected verbs/nouns
   - Verify Burn Media context is included
   - Verify at least 3 example emails are present

**Test File:** `src/app/api/generate-email/route.test.ts`

1. **API Route Tests**
   - Verify XYZ prompt is used when system prompt not provided
   - Verify custom system prompt overrides XYZ prompt
   - Verify research summary is compiled correctly
   - Verify X-Prompt-Version header is set
   - Verify error handling for invalid requests

### Integration Tests

**Test File:** `tests/integration/email-generation.test.ts`

1. **End-to-End Generation Tests**
   - Generate email with XYZ formula prompt (no custom system)
   - Generate email with research summary
   - Generate email with custom system prompt (verify override)
   - Verify generated emails follow XYZ structure

2. **Model Provider Tests**
   - Test with OpenAI models
   - Test with Anthropic models
   - Verify model resolution works correctly

### Manual Testing Checklist

1. **Email Quality Tests**
   - [ ] Generated emails follow XYZ formula structure
   - [ ] Emails sound natural and conversational
   - [ ] Research insights are incorporated naturally
   - [ ] Burn Media metrics are referenced appropriately
   - [ ] Quantifiable results are included when relevant
   - [ ] Call to action is clear and low-pressure

2. **Backward Compatibility Tests**
   - [ ] Existing API clients continue to work
   - [ ] Custom system prompts still override default
   - [ ] Research summary integration still works
   - [ ] Model selection still works

3. **Performance Tests**
   - [ ] Prompt loading doesn't add significant latency
   - [ ] Generation time remains acceptable (<5 seconds)
   - [ ] No memory leaks from prompt caching

## Implementation Notes

### XYZ Formula Master Prompt Content

The master prompt will be approximately 2000-2500 tokens and include:

**Section 1: Role & Objective**
```
You are an expert sales email writer specializing in B2B prospecting using the XYZ formula methodology. Your goal is to generate natural, conversational emails that follow the proven XYZ structure while sounding authentic and personalized.
```

**Section 2: XYZ Formula Structure**
```
Every email must follow this six-component structure:

1. CONNECTION: Use research, social engineering, LinkedIn insights, or referrals to show this isn't a mass email
2. SPECIALTY: Describe the type of person/organization where you have the best success
3. PROBLEM/DESIRE: Mention the problem you solve or the desired goal they likely have
4. VALUE: Describe what you help them gain or avoid using appropriate verbs and nouns
5. END RESULT: Discuss the outcome with quantifiable results when possible
6. TRANSITION: End with a low-pressure call to action using action verbs and soft ending phrases
```

**Section 3: Component Vocabulary**
```
Use these verbs and nouns appropriately:

Minimization Verbs (for pain avoidance): save, reduce, eliminate, cut down on, minimize, decrease, get rid of, lessen, cut, lower, soften, slash, shrink, slice, trim, combine, modify

Maximization Verbs (for desired gains): strengthen, intensify, reinforce, boost, increase, expand, add, grow, maximize, enhance, create, build, ease

Desired Nouns: profits, sales, dollars, revenues, income, cash flow, savings, time, productivity, morale, motivation, output, attitude, market share, image, victories

Undesired Nouns: costs, downtime, turnover, waste, inefficiency, delays, errors, complaints, churn, friction
```

**Section 4: Burn Media Group Context**
```
When generating emails for Burn Media Group, reference these specific metrics and value propositions:

Network Reach:
- 300k monthly impressions
- 200k monthly uniques
- 28k Facebook likes, 51k Twitter followers
- 25k newsletter subscribers
- 22 articles per week, 300+ contributors

Audience Demographics:
- Age 25-55 (professionals, executives, managers)
- High income, tertiary education
- Industries: Advertising, Media, IT & Communications
- Tech-savvy, knowledge-hungry, aspirational

Advertising Options:
- Display banners (728×90, 300×250, 300×600, 970×250)
- Content partnerships (800-word articles, SEO optimized)
- Sponsored posts (homepage features, social distribution)
- Native content series (editorial team produced)

Performance:
- Average CTR > 0.7%
- High engagement rates
- Ultra-high-net-worth audience
```

**Section 5: Tone & Style Guidelines**
```
- Write in a natural, conversational tone
- Avoid overly formal or stiff language
- Flow naturally between components without obvious transitions
- Customize phrasing based on prospect's industry and situation
- Quantify results whenever possible (e.g., "10%-50% gains", "80% decrease")
- Use phrases like "This results in..." or "What this means is..." for outcomes
- End with soft, inviting language rather than pushy demands
- Reference specific research insights naturally in the Connection and Value components
```

**Section 6: Example Emails**
```
[Include 3 complete example emails with annotations showing each XYZ component]
```

### Prompt Version Management

Use semantic versioning for the master prompt:
- **Major version** (1.x.x): Significant structural changes to XYZ formula
- **Minor version** (x.1.x): New sections, vocabulary additions, example updates
- **Patch version** (x.x.1): Minor wording tweaks, typo fixes

Initial version: `1.0.0`

### Performance Considerations

1. **Prompt Caching**
   - Load prompt once at module initialization
   - Cache in memory for subsequent requests
   - No need to reload on every API call

2. **Token Usage**
   - Master prompt: ~2000-2500 tokens
   - User prompt: ~200-500 tokens
   - Research summary: ~100-150 tokens
   - Total input: ~2500-3000 tokens
   - Output: ~500-700 tokens (configured max)
   - Total per request: ~3000-3700 tokens

3. **Response Time**
   - Prompt loading: <1ms (cached)
   - AI generation: 2-5 seconds (depends on model)
   - Total: 2-5 seconds (no significant change from current)

### Migration Strategy

1. **Phase 1: Implementation**
   - Create `src/lib/prompts/xyz-formula.ts` with master prompt
   - Update `src/app/api/generate-email/route.ts` to use new prompt
   - Add unit tests for prompt loading

2. **Phase 2: Testing**
   - Manual testing with various lead scenarios
   - Compare email quality before/after
   - Verify backward compatibility

3. **Phase 3: Deployment**
   - Deploy to staging environment
   - Run integration tests
   - Monitor error rates and generation quality
   - Deploy to production

4. **Phase 4: Monitoring**
   - Track X-Prompt-Version header usage
   - Monitor email generation success rates
   - Collect feedback on email quality
   - Iterate on prompt based on results

### Future Enhancements

1. **Prompt Management UI**
   - Admin interface to edit master prompt
   - Version history and rollback
   - A/B testing different prompt versions

2. **Component-Based Generation**
   - Allow users to specify individual XYZ components
   - Generate emails from structured component inputs
   - Provide component suggestions based on lead data

3. **Industry-Specific Prompts**
   - Customize vocabulary and examples by industry
   - Load industry-specific context dynamically
   - Support multiple company contexts (not just Burn Media)

4. **Analytics & Optimization**
   - Track which prompt versions perform best
   - Measure email open rates, reply rates by prompt version
   - Use feedback to refine prompt over time
