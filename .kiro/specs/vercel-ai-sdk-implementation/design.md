# Design Document

## Overview

This design outlines the implementation of AI-powered features using the Vercel AI SDK across the SalesMatter platform. The system will leverage three primary API endpoints to provide intelligent CSV column mapping, lead data enrichment with web search, and personalized email generation. The design builds upon existing implementations while enhancing them with better error handling, model configuration flexibility, and performance optimizations.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Client UI     │
│  (React/Next)   │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         v                  v                  v                  v
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  /api/map-csv  │  │/api/enrich-lead│  │/api/generate-  │  │/api/parse-csv  │
│                │  │                │  │     email      │  │      -ai       │
└────────┬───────┘  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘
         │                   │                   │                   │
         v                   v                   v                   v
┌────────────────────────────────────────────────────────────────────────────┐
│                         Vercel AI SDK Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │generateObject│  │ generateText │  │  streamText  │  │generateObject│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
         │                   │                   │                   │
         v                   v                   v                   v
┌────────────────────────────────────────────────────────────────────────────┐
│                         Model Provider Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   OpenAI     │  │   OpenAI     │  │   OpenAI     │  │  Anthropic   │  │
│  │ gpt-4o-mini  │  │  gpt-4o-mini │  │  gpt-4o-mini │  │   (optional) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **CSV Import Flow**
   - User uploads CSV → Client parses file → Sends headers + sample rows to `/api/map-csv`
   - API uses `generateObject` with Zod schema → Returns structured mapping
   - Client applies mapping to all rows → Displays preview table

2. **Lead Enrichment Flow**
   - User selects lead → Client sends lead data to `/api/enrich-lead`
   - API uses `generateText` with web search tool → Streams research summary
   - Client displays streaming response → User reviews and approves
   - Approved summary stored with lead record

3. **Email Generation Flow**
   - User initiates generation → Client sends template + lead data to `/api/generate-email`
   - API uses `streamText` with enrichment context → Streams personalized email
   - Client displays real-time preview → User edits and approves

## Components and Interfaces

### 1. CSV Column Mapping API (`/api/map-csv`)

**Purpose**: Intelligently map arbitrary CSV columns to canonical lead schema using AI.

**Current Implementation Status**: ✅ Implemented with advanced features

**Key Features**:
- Uses `generateObject` for structured output
- Supports multiple mapping formats (forward, reverse, pairs)
- Handles full name splitting
- Includes JSON repair for malformed responses
- Returns sample normalized leads for verification

**Request Interface**:
```typescript
interface MapCSVRequest {
  columns: string[];           // CSV column headers
  rows: Record<string, any>[]; // Sample rows (max 25)
}
```

**Response Interface**:
```typescript
interface MapCSVResponse {
  headerMapping: Record<string, CanonicalField>;
  rules?: {
    splitFullName?: {
      column: string;
      firstNameFirst: boolean;
    };
  };
  sampleLeads: Lead[];
  notes?: string;
}

type CanonicalField = 
  | "firstName" 
  | "lastName" 
  | "company" 
  | "email" 
  | "title" 
  | "website" 
  | "linkedin" 
  | "ignore";
```

**AI Configuration**:
- Model: `gpt-4o-mini` (fast, cost-effective)
- Temperature: `0` (deterministic mapping)
- Max Tokens: `800`
- Schema: Zod-based validation

**Enhancements Needed**:
- Add model configuration via environment variables
- Implement better fallback for API failures
- Add token usage logging
- Improve error messages for users

### 2. Lead Enrichment API (`/api/enrich-lead`)

**Purpose**: Generate AI-powered research summaries about leads using web search.

**Current Implementation Status**: ✅ Implemented with web search tool

**Key Features**:
- Uses `generateText` with OpenAI web search preview tool
- Searches for recent news, company updates, and professional insights
- Returns structured response with sources
- Clamps summary to 100 words maximum
- Configurable search context and location

**Request Interface**:
```typescript
interface EnrichLeadRequest {
  lead: {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    title?: string | null;
    email?: string | null;
    website?: string | null;
  };
  query?: string; // Optional custom search query
}
```

**Response Interface**:
```typescript
interface EnrichLeadResponse {
  query: string;
  results: Array<{
    title: string;
    link: string;
    snippet: string;
  }>;
  summary: string;
  fetchedAt: string;
}
```

**AI Configuration**:
- Model: `gpt-4o-mini` (required for web search tool)
- Max Tokens: `500`
- Tool: `webSearchPreview` with high context
- Search Location: South Africa (configurable)

**Enhancements Needed**:
- Add streaming support for real-time feedback
- Implement caching to avoid duplicate searches
- Add retry logic for failed searches
- Support multiple model providers (currently OpenAI only)
- Add token usage tracking

### 3. Email Generation API (`/api/generate-email`)

**Purpose**: Generate personalized email drafts using templates and lead data.

**Current Implementation Status**: ✅ Implemented with streaming

**Key Features**:
- Uses `streamText` for real-time generation
- Supports custom system prompts
- Configurable temperature and token limits
- Returns streaming text response

**Request Interface**:
```typescript
interface GenerateEmailRequest {
  prompt: string;  // Template with lead data
  system?: string; // Optional system instructions
}
```

**Response**: Text stream (Server-Sent Events)

**AI Configuration**:
- Model: `gpt-4o-mini`
- Temperature: `0.7`
- Max Tokens: `700`

**Enhancements Needed**:
- Add enrichment data integration
- Support model configuration via environment
- Add prompt templates for different email types
- Implement token usage logging
- Add error recovery and retry logic

### 4. AI-Powered CSV Parser (`/api/parse-csv-ai`)

**Purpose**: Parse entire CSV files using AI for intelligent data extraction.

**Current Implementation Status**: ✅ Implemented with full parsing

**Key Features**:
- Uses `generateObject` to parse all rows at once
- Handles up to 1000 rows per request
- Automatic name splitting and data normalization
- Email validation and URL normalization
- Quality metrics and warnings

**Request Interface**:
```typescript
interface ParseCSVRequest {
  rows: Record<string, any>[];
  columns: string[];
}
```

**Response Interface**:
```typescript
interface ParseCSVResponse {
  success: boolean;
  leads: Lead[];
  totalRows: number;
  validLeads: number;
  skippedRows: number;
  processingTime: number;
  qualityMetrics: {
    hasValidEmail: number;
    hasName: number;
    hasCompany: number;
    hasTitle: number;
  };
  warnings: string[];
  error?: string;
  fallbackRequired?: boolean;
}
```

**AI Configuration**:
- Model: `gpt-4o-2024-08-06` (latest for best parsing)
- Temperature: `0.1` (consistent parsing)
- Max Tokens: `16000` (large datasets)

**Enhancements Needed**:
- Add chunking for files > 1000 rows
- Implement progress tracking for large files
- Add model configuration support
- Improve error handling and fallback logic

## Data Models

### Lead Schema

```typescript
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title?: string;
  website?: string;
  linkedin?: string;
  phone?: string;
  location?: string;
  industry?: string;
  status: "new" | "enriched" | "generated" | "approved" | "sent" | "rejected";
  enrichmentData?: {
    summary: string;
    sources: Array<{
      title: string;
      link: string;
      snippet: string;
    }>;
    fetchedAt: string;
  };
  generatedEmail?: {
    subject: string;
    body: string;
    generatedAt: string;
  };
  customFields?: Record<string, any>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Model Configuration

```typescript
interface ModelConfig {
  provider: "openai" | "anthropic";
  model: string;
}

// Parse from environment variables
// Format: "provider:model" (e.g., "openai:gpt-4o-mini")
function parseModelConfig(envVar: string | undefined, defaultValue: string): ModelConfig {
  const value = envVar || defaultValue;
  const [provider, model] = value.split(":");
  
  if (!provider || !model) {
    throw new Error(`Invalid model format: ${value}. Use "provider:model"`);
  }
  
  if (provider !== "openai" && provider !== "anthropic") {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  
  return { provider, model };
}
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
ANTHROPIC_API_KEY=sk-ant-...

# Model Configuration (optional, with defaults)
AI_EMAIL_MODEL=openai:gpt-4o-mini
AI_RESEARCH_MODEL=openai:gpt-4o-mini
AI_MAPPING_MODEL=openai:gpt-4o-mini
AI_PARSING_MODEL=openai:gpt-4o-2024-08-06
```

## Error Handling

### Error Types and Responses

1. **Invalid Request (400)**
   - Missing required fields
   - Invalid data format
   - Malformed JSON

2. **Authentication Error (401)**
   - Missing API key
   - Invalid API key

3. **Service Unavailable (503)**
   - AI service down
   - Rate limit exceeded
   - Model not available

4. **Internal Error (500)**
   - Unexpected AI response
   - JSON parsing failure
   - Database error

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;           // User-friendly message
  code?: string;           // Error code for client handling
  details?: string;        // Technical details (dev mode only)
  fallbackRequired?: boolean; // Indicates client should use fallback
  retryable?: boolean;     // Indicates if retry might succeed
}
```

### Fallback Strategies

1. **CSV Mapping Fallback**
   - Use heuristic pattern matching
   - Match common column names (e.g., "email", "e-mail", "Email Address")
   - Provide manual mapping UI as last resort

2. **Enrichment Fallback**
   - Display error message
   - Allow user to manually enter research notes
   - Skip enrichment and proceed with generation

3. **Generation Fallback**
   - Use template without AI enhancement
   - Simple variable substitution
   - Allow manual editing

### Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
```

## Testing Strategy

### Unit Tests

1. **Model Configuration Parsing**
   - Test valid formats
   - Test invalid formats
   - Test default values
   - Test missing environment variables

2. **Data Validation**
   - Test Zod schemas
   - Test email validation
   - Test URL normalization
   - Test name splitting logic

3. **Error Handling**
   - Test error response formatting
   - Test fallback triggers
   - Test retry logic

### Integration Tests

1. **CSV Mapping Flow**
   - Upload CSV with various formats
   - Verify mapping accuracy
   - Test name splitting
   - Test fallback behavior

2. **Enrichment Flow**
   - Request enrichment for test leads
   - Verify summary quality
   - Test source extraction
   - Test error handling

3. **Generation Flow**
   - Generate emails with templates
   - Verify personalization
   - Test streaming behavior
   - Test enrichment integration

### End-to-End Tests

1. **Complete Import-to-Send Flow**
   - Upload CSV
   - Map columns
   - Enrich leads
   - Generate emails
   - Review and approve
   - Verify data persistence

2. **Error Recovery Scenarios**
   - API failures
   - Invalid data
   - Network issues
   - Rate limiting

### Performance Tests

1. **Load Testing**
   - Large CSV files (1000+ rows)
   - Concurrent requests
   - Token usage optimization
   - Response time benchmarks

2. **Token Usage Monitoring**
   - Track tokens per operation
   - Calculate costs
   - Identify optimization opportunities

## Implementation Phases

### Phase 1: Model Configuration Enhancement
- Add environment variable parsing
- Support multiple providers (OpenAI, Anthropic)
- Implement model selection logic
- Add configuration validation

### Phase 2: Error Handling Improvements
- Standardize error responses
- Implement retry logic
- Add fallback mechanisms
- Improve error messages

### Phase 3: Performance Optimization
- Add token usage logging
- Implement caching for enrichment
- Optimize prompt engineering
- Add request timeouts

### Phase 4: Feature Enhancements
- Add streaming to enrichment API
- Integrate enrichment data in email generation
- Implement chunking for large CSV files
- Add progress tracking

### Phase 5: Testing and Documentation
- Write comprehensive tests
- Add API documentation
- Create usage examples
- Document best practices

## Security Considerations

1. **API Key Management**
   - Store keys in environment variables only
   - Never expose keys in client code
   - Rotate keys regularly
   - Use separate keys for dev/prod

2. **Data Privacy**
   - Don't log sensitive lead data
   - Sanitize error messages
   - Implement rate limiting
   - Add request validation

3. **Input Validation**
   - Validate all request payloads
   - Sanitize user inputs
   - Limit file sizes
   - Prevent injection attacks

4. **Rate Limiting**
   - Implement per-user limits
   - Add global rate limits
   - Queue requests during high load
   - Return 429 status when exceeded

## Monitoring and Observability

### Metrics to Track

1. **Usage Metrics**
   - API requests per endpoint
   - Token usage per operation
   - Cost per request
   - Success/failure rates

2. **Performance Metrics**
   - Response times
   - Token generation speed
   - Queue lengths
   - Error rates

3. **Quality Metrics**
   - Mapping accuracy
   - Enrichment relevance
   - Email personalization score
   - User approval rates

### Logging Strategy

```typescript
interface AIOperationLog {
  timestamp: string;
  endpoint: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  duration: number;
  success: boolean;
  error?: string;
}
```

## Future Enhancements

1. **Advanced Features**
   - Multi-language support
   - Custom model fine-tuning
   - A/B testing for prompts
   - Batch processing optimization

2. **User Experience**
   - Real-time collaboration
   - Template marketplace
   - AI suggestions for improvements
   - Automated quality scoring

3. **Integration**
   - CRM connectors
   - Email service providers
   - Analytics platforms
   - Webhook support

4. **Enterprise Features**
   - Team workspaces
   - Role-based access control
   - Audit logging
   - Custom model deployment
