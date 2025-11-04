# Implementation Plan

- [ ] 1. Create model configuration utilities
  - Create `src/lib/ai-config.ts` with model configuration parsing functions
  - Implement `parseModelConfig` function to parse "provider:model" format from environment variables
  - Add `getModelInstance` function to return appropriate SDK model instance (openai or anthropic)
  - Add validation for supported providers and error handling for invalid formats
  - Export TypeScript interfaces for ModelConfig type
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Enhance CSV mapping API with model configuration
  - Update `src/app/api/map-csv/route.ts` to use model configuration utilities
  - Replace hardcoded `openai("gpt-4o-mini")` with configurable model from AI_MAPPING_MODEL environment variable
  - Add fallback to default model if environment variable is not set
  - Add error handling for invalid model configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Add token usage logging to CSV mapping API
  - Update `src/app/api/map-csv/route.ts` to log token usage after each AI operation
  - Extract usage metadata from generateObject response
  - Log prompt tokens, completion tokens, total tokens, and estimated cost
  - Create reusable logging utility function in `src/lib/ai-logging.ts`
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. Implement heuristic fallback for CSV mapping
  - Create `src/lib/csv-mapping-fallback.ts` with heuristic column mapping logic
  - Implement pattern matching for common column names (email, name, company, etc.)
  - Add fuzzy matching for similar column names
  - Update `src/app/api/map-csv/route.ts` to use fallback when AI fails
  - Return fallback indicator in response for client awareness
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Enhance lead enrichment API with streaming support
  - Update `src/app/api/enrich-lead/route.ts` to use streamText instead of generateText
  - Implement streaming response using toTextStreamResponse()
  - Update client-side code to handle streaming enrichment responses
  - Maintain backward compatibility with existing response format
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6. Add model configuration to enrichment API
  - Update `src/app/api/enrich-lead/route.ts` to use AI_RESEARCH_MODEL environment variable
  - Add support for both OpenAI and Anthropic models
  - Handle web search tool compatibility (currently OpenAI only)
  - Add graceful degradation when web search is unavailable
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7. Implement enrichment caching mechanism
  - Create `src/lib/enrichment-cache.ts` with in-memory caching logic
  - Cache enrichment results by lead identifier (email or linkedin)
  - Add cache expiration (24 hours default)
  - Update `src/app/api/enrich-lead/route.ts` to check cache before calling AI
  - Add cache statistics logging
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 8. Add token usage logging to enrichment API
  - Update `src/app/api/enrich-lead/route.ts` to log token usage
  - Use shared logging utility from task 3
  - Log search query, model used, and token counts
  - Calculate and log estimated cost per enrichment
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Enhance email generation API with enrichment integration
  - Update `src/app/api/generate-email/route.ts` to accept enrichment data in request
  - Modify prompt construction to include research summary when available
  - Add instructions to reference specific insights from enrichment
  - Maintain existing streaming behavior
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10. Add model configuration to email generation API
  - Update `src/app/api/generate-email/route.ts` to use AI_EMAIL_MODEL environment variable
  - Support both OpenAI and Anthropic models
  - Add validation for model availability
  - Implement fallback to default model
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. Add token usage logging to email generation API
  - Update `src/app/api/generate-email/route.ts` to log token usage
  - Use shared logging utility
  - Log template used, lead data, and enrichment status
  - Track generation success rate
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 12. Implement retry logic utility
  - Create `src/lib/retry.ts` with exponential backoff retry logic
  - Implement `retryWithBackoff` function with configurable max retries and base delay
  - Add error classification to determine if retry is appropriate
  - Export TypeScript interfaces for retry configuration
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 13. Add retry logic to all AI API endpoints
  - Update `src/app/api/map-csv/route.ts` to use retry utility
  - Update `src/app/api/enrich-lead/route.ts` to use retry utility
  - Update `src/app/api/generate-email/route.ts` to use retry utility
  - Configure appropriate retry parameters for each endpoint
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 14. Standardize error responses across AI endpoints
  - Create `src/lib/ai-errors.ts` with error response formatting utilities
  - Define ErrorResponse interface with consistent structure
  - Implement error classification (retryable, fallback required, etc.)
  - Update all AI endpoints to use standardized error responses
  - Add user-friendly error messages
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 15. Add request validation middleware
  - Create `src/lib/validation.ts` with request validation utilities
  - Implement Zod schemas for all AI endpoint requests
  - Add validation middleware to check request payloads
  - Return 400 errors with clear validation messages
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 16. Implement request timeout handling
  - Add timeout configuration to all AI SDK calls
  - Set 30-second timeout for all AI operations
  - Handle timeout errors gracefully
  - Return appropriate error responses when timeouts occur
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 17. Enhance CSV parser API with model configuration
  - Update `src/app/api/parse-csv-ai/route.ts` to use AI_PARSING_MODEL environment variable
  - Support configurable models while maintaining performance
  - Add validation for model capabilities (token limits)
  - Implement fallback for unsupported models
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 18. Add chunking support for large CSV files
  - Update `src/app/api/parse-csv-ai/route.ts` to process files in chunks
  - Implement chunk size calculation based on token limits
  - Process chunks sequentially with progress tracking
  - Combine results from all chunks
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 19. Add token usage logging to CSV parser API
  - Update `src/app/api/parse-csv-ai/route.ts` to log token usage per chunk
  - Aggregate token usage across all chunks
  - Log total cost for parsing operation
  - Add performance metrics (rows per second)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 20. Create AI operations monitoring dashboard data endpoint
  - Create `src/app/api/ai-metrics/route.ts` for retrieving AI usage statistics
  - Aggregate token usage across all endpoints
  - Calculate total costs by model and operation type
  - Return metrics for display in admin dashboard
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 21. Write unit tests for model configuration utilities
  - Create `src/lib/__tests__/ai-config.test.ts` with comprehensive test coverage
  - Test parseModelConfig with valid and invalid formats
  - Test getModelInstance for both OpenAI and Anthropic
  - Test error handling for unsupported providers
  - Test default value fallbacks
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 22. Write unit tests for retry logic
  - Create `src/lib/__tests__/retry.test.ts` with retry behavior tests
  - Test successful retry after failures
  - Test max retries exceeded scenario
  - Test exponential backoff timing
  - Mock async functions for testing
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 23. Write unit tests for error handling utilities
  - Create `src/lib/__tests__/ai-errors.test.ts` with error formatting tests
  - Test error response structure
  - Test error classification logic
  - Test user-friendly message generation
  - Test fallback indicators
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 24. Write integration tests for CSV mapping flow
  - Create `src/app/api/map-csv/__tests__/route.test.ts` with API tests
  - Test successful mapping with various CSV formats
  - Test name splitting functionality
  - Test fallback behavior when AI fails
  - Test error responses for invalid requests
  - Mock AI SDK calls for consistent testing
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 25. Write integration tests for enrichment flow
  - Create `src/app/api/enrich-lead/__tests__/route.test.ts` with API tests
  - Test successful enrichment with web search
  - Test streaming response handling
  - Test cache hit and miss scenarios
  - Test error handling and retry logic
  - Mock web search tool responses
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 26. Write integration tests for email generation flow
  - Create `src/app/api/generate-email/__tests__/route.test.ts` with API tests
  - Test email generation with and without enrichment data
  - Test streaming response
  - Test personalization quality
  - Test error handling
  - Mock AI SDK streamText calls
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 27. Create API documentation
  - Create `docs/api/vercel-ai-sdk.md` with comprehensive API documentation
  - Document all AI endpoints with request/response examples
  - Document environment variable configuration
  - Add troubleshooting guide for common issues
  - Include code examples for client integration
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 28. Add usage examples and best practices guide
  - Create `docs/guides/ai-features.md` with usage examples
  - Document prompt engineering best practices
  - Add examples for each AI feature
  - Include cost optimization tips
  - Document model selection guidelines
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
