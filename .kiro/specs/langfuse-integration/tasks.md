# Implementation Plan

- [x] 1. Install and configure Langfuse packages
  - Install @langfuse/tracing, @langfuse/otel, @langfuse/client, @opentelemetry/sdk-trace-node, and @opentelemetry/api packages
  - Update package.json with correct versions
  - Verify installation with npm install
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 11.1_

- [x] 2. Set up environment configuration
  - [x] 2.1 Update env.example with Langfuse variables
    - Add LANGFUSE_SECRET_KEY with placeholder
    - Add LANGFUSE_PUBLIC_KEY with placeholder
    - Add LANGFUSE_BASE_URL with default cloud URL
    - Add LANGFUSE_TRACING_ENVIRONMENT with "development" default
    - Add comments explaining how to obtain credentials
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 2.2 Create .env file for local development
    - Copy env.example to .env
    - Add actual Langfuse credentials (not committed to git)
    - Verify .env is in .gitignore
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Create OpenTelemetry instrumentation setup
  - [x] 3.1 Create instrumentation.ts file in project root
    - Import NodeTracerProvider from @opentelemetry/sdk-trace-node
    - Import LangfuseSpanProcessor from @langfuse/otel
    - Create shouldExportSpan filter function to exclude Next.js spans
    - Initialize LangfuseSpanProcessor with filter
    - Create and register NodeTracerProvider
    - Export langfuseSpanProcessor for use in routes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Add unit tests for instrumentation setup
    - Test that NodeTracerProvider is created correctly
    - Test that span filter excludes Next.js spans
    - Test that LangfuseSpanProcessor is initialized
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Create prompt management utility
  - [x] 4.1 Create src/lib/langfuse directory structure
    - Create src/lib/langfuse/prompts.ts file
    - Create src/lib/langfuse/fallbacks.ts file
    - Create src/lib/langfuse/types.ts file
    - _Requirements: 11.2, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 4.2 Implement LangfuseClient singleton
    - Import LangfuseClient from @langfuse/client
    - Create singleton instance with environment variables
    - Add error handling for missing credentials
    - Export client instance
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [x] 4.3 Implement getPrompt function
    - Create function signature with name and options parameters
    - Call langfuseClient.prompt.get with parameters
    - Implement error handling with fallback logic
    - Add caching with configurable TTL
    - Return PromptClient object
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 17.4_

  - [x] 4.4 Implement getCompiledPrompt function
    - Create function to fetch and compile in one call
    - Call getPrompt internally
    - Call prompt.compile with variables
    - Handle missing variables with descriptive errors
    - Return compiled string or chat messages
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 4.5 Create TypeScript types
    - Define TextPrompt and ChatPrompt types
    - Define GetPromptOptions interface
    - Define FallbackPrompt interface
    - Export all types
    - _Requirements: 17.5_

  - [x] 4.6 Implement fallback prompts
    - Create FALLBACK_PROMPTS constant in fallbacks.ts
    - Add fallback for email-generation-system
    - Add fallback for email-generation-user
    - Add createFallbackPrompt helper function
    - _Requirements: 13.5, 18.1, 18.2_

  - [ ]* 4.7 Add unit tests for prompt management
    - Test getPrompt with different labels
    - Test getPrompt with version numbers
    - Test getCompiledPrompt with variables
    - Test error handling for missing prompts
    - Test fallback prompt usage
    - Test cache behavior
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4_

- [x] 5. Update generate-email API route with tracing
  - [x] 5.1 Add Langfuse imports to route
    - Import observe, updateActiveTrace, updateActiveObservation from @langfuse/tracing
    - Import after from next/server
    - Import langfuseSpanProcessor from instrumentation
    - Import getPrompt from prompt utility
    - _Requirements: 5.1, 5.2, 9.1_

  - [x] 5.2 Wrap handler with observe decorator
    - Extract existing handler logic into separate function
    - Wrap handler with observe()
    - Set name to "generate-email"
    - Export as POST
    - _Requirements: 5.1, 5.2, 9.1_

  - [x] 5.3 Add trace metadata updates
    - Call updateActiveTrace with name, input, tags
    - Call updateActiveObservation with input
    - Extract userId and sessionId from request if available
    - _Requirements: 5.3, 6.1, 6.2, 6.3, 6.4, 9.4_

  - [x] 5.4 Enable AI SDK telemetry
    - Add experimental_telemetry to generateText call
    - Set isEnabled to true
    - Add metadata object for future prompt linking
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.5 Add output tracking and flush
    - Call updateActiveObservation with output after AI call
    - Add after() call with langfuseSpanProcessor.forceFlush()
    - Handle flush errors gracefully
    - _Requirements: 5.4, 7.1, 7.2, 7.3, 7.4, 7.5, 9.5_

  - [ ]* 5.6 Add integration tests for generate-email route
    - Test that trace is created
    - Test that metadata is set correctly
    - Test that telemetry is enabled
    - Test that flush is called
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Create prompts in Langfuse UI
  - [ ] 6.1 Create email-generation-system prompt
    - Log into Langfuse Cloud
    - Create new text prompt named "email-generation-system"
    - Add system prompt content
    - Set config with model parameters
    - Assign "production" label
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 18.2_

  - [ ] 6.2 Create email-generation-user prompt
    - Create new text prompt named "email-generation-user"
    - Add user prompt template with variables
    - Define variables: {{body}}, {{subject}}, {{name}}, {{date}}
    - Set config with model parameters
    - Assign "production" label
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 18.2, 18.4_

  - [x] 6.3 Test prompt fetching
    - Write test script to fetch prompts
    - Verify prompts are returned correctly
    - Test compilation with sample variables
    - Verify compiled output matches expectations
    - _Requirements: 13.1, 13.2, 14.1, 14.2, 18.5_

- [ ] 7. Integrate prompts into generate-email route
  - [ ] 7.1 Fetch system prompt
    - Call getPrompt("email-generation-system") in handler
    - Extract config from prompt
    - Use config for model parameters if available
    - _Requirements: 13.1, 13.2, 16.1, 16.2, 16.3, 20.2, 20.3_

  - [ ] 7.2 Fetch and compile user prompt
    - Call getPrompt("email-generation-user") in handler
    - Compile prompt with request variables
    - Handle missing variables with error
    - _Requirements: 13.1, 13.2, 14.1, 14.2, 14.3, 14.4_

  - [ ] 7.3 Link prompts to generation
    - Add langfusePrompt to experimental_telemetry metadata
    - Call prompt.toJSON() for serialization
    - Verify link appears in Langfuse UI
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ] 7.4 Use prompt config for model parameters
    - Extract model, temperature, maxOutputTokens from prompt.config
    - Use config values in generateText call
    - Fallback to defaults if config missing
    - _Requirements: 16.2, 16.3, 16.4, 20.1, 20.2, 20.3, 20.4_

  - [ ]* 7.5 Test end-to-end with prompts
    - Make test API call
    - Verify trace in Langfuse UI
    - Verify prompt link is visible
    - Verify token usage is tracked
    - Verify output matches expectations
    - _Requirements: 15.4, 15.5, 18.5_

- [ ] 8. Update lead-research API route
  - [ ] 8.1 Add Langfuse tracing to lead-research route
    - Import Langfuse tracing functions
    - Wrap handler with observe()
    - Add trace metadata updates
    - Enable AI SDK telemetry
    - Add flush call
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.2_

  - [ ] 8.2 Create lead-research prompt in Langfuse
    - Create prompt in Langfuse UI
    - Define variables for lead research
    - Set appropriate config
    - Assign "production" label
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 18.2_

  - [ ] 8.3 Integrate prompt into route
    - Fetch prompt using getPrompt
    - Compile with request variables
    - Link to generation
    - Use config for model parameters
    - _Requirements: 13.1, 13.2, 14.1, 14.2, 15.1, 15.2, 15.3, 20.2, 20.3_

  - [ ]* 8.4 Test lead-research route
    - Make test API call
    - Verify trace in Langfuse UI
    - Verify prompt link
    - _Requirements: 9.2, 9.4, 9.5_

- [ ] 9. Update parse-csv-ai API route
  - [ ] 9.1 Add Langfuse tracing to parse-csv-ai route
    - Import Langfuse tracing functions
    - Wrap handler with observe()
    - Add trace metadata updates
    - Enable AI SDK telemetry
    - Add flush call
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.3_

  - [ ] 9.2 Create csv-parsing prompt in Langfuse
    - Create prompt in Langfuse UI
    - Define variables for CSV parsing
    - Set appropriate config
    - Assign "production" label
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 18.2_

  - [ ] 9.3 Integrate prompt into route
    - Fetch prompt using getPrompt
    - Compile with request variables
    - Link to generation
    - Use config for model parameters
    - _Requirements: 13.1, 13.2, 14.1, 14.2, 15.1, 15.2, 15.3, 20.2, 20.3_

  - [ ]* 9.4 Test parse-csv-ai route
    - Make test API call
    - Verify trace in Langfuse UI
    - Verify prompt link
    - _Requirements: 9.3, 9.4, 9.5_

- [ ] 10. Add environment configuration support
  - [ ] 10.1 Configure environment labels
    - Set LANGFUSE_TRACING_ENVIRONMENT in .env
    - Verify environment appears in traces
    - Test filtering by environment in Langfuse UI
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 10.2 Document environment setup
    - Add comments to env.example
    - Document environment strategy in README
    - Explain how to use different environments
    - _Requirements: 8.1, 8.2, 8.5_

- [ ] 11. Create documentation
  - [ ] 11.1 Create developer guide
    - Create docs/langfuse-integration.md
    - Document how to add tracing to new routes
    - Document how to create and use prompts
    - Add troubleshooting section
    - Add best practices
    - _Requirements: All requirements_

  - [ ] 11.2 Add JSDoc comments
    - Add JSDoc to getPrompt function
    - Add JSDoc to getCompiledPrompt function
    - Add JSDoc to other exported functions
    - Include examples in JSDoc
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ] 11.3 Document prompt naming conventions
    - Document naming convention in guide
    - Provide examples of good prompt names
    - Explain label strategy
    - Document config structure
    - _Requirements: 12.1, 12.5, 19.3, 19.4_

- [ ] 12. Implement error handling and monitoring
  - [ ] 12.1 Add error handling to instrumentation
    - Add try-catch around tracer registration
    - Log warnings for missing credentials
    - Handle initialization errors gracefully
    - _Requirements: 2.5, 11.5_

  - [ ] 12.2 Add error handling to prompt fetching
    - Implement fallback logic in getPrompt
    - Add descriptive error messages
    - Log errors without throwing
    - _Requirements: 13.5, 14.4_

  - [ ] 12.3 Add monitoring metadata
    - Add custom metrics to trace metadata
    - Track prompt cache hit rate
    - Track prompt fetch latency
    - Track trace export success
    - _Requirements: 6.5_

  - [ ]* 12.4 Add error handling tests
    - Test missing credentials scenario
    - Test prompt not found scenario
    - Test network error scenario
    - Test fallback prompt usage
    - _Requirements: 2.5, 11.5, 13.5_

- [ ] 13. Implement prompt versioning support
  - [ ] 13.1 Document versioning strategy
    - Explain how to create new versions
    - Document label management
    - Explain rollback process
    - Document A/B testing approach
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ] 13.2 Add version fetching examples
    - Add example of fetching specific version
    - Add example of fetching by label
    - Add example of A/B testing
    - _Requirements: 13.3, 13.4, 19.4_

- [ ] 14. Final testing and validation
  - [ ]* 14.1 Run all unit tests
    - Execute npm test
    - Verify all tests pass
    - Fix any failing tests
    - _Requirements: All requirements_

  - [ ]* 14.2 Run integration tests
    - Test all API routes
    - Verify traces in Langfuse UI
    - Verify prompt links
    - Verify token tracking
    - _Requirements: All requirements_

  - [ ] 14.3 Manual testing checklist
    - Test generate-email route
    - Test lead-research route
    - Test parse-csv-ai route
    - Verify environment filtering
    - Test prompt versioning
    - Test error scenarios
    - _Requirements: All requirements_

  - [ ] 14.4 Performance testing
    - Measure tracing overhead
    - Measure prompt fetch latency
    - Verify cache effectiveness
    - Test serverless flush behavior
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 15. Deployment preparation
  - [ ] 15.1 Configure Vercel environment variables
    - Add LANGFUSE_SECRET_KEY to Vercel
    - Add LANGFUSE_PUBLIC_KEY to Vercel
    - Add LANGFUSE_BASE_URL to Vercel
    - Add LANGFUSE_TRACING_ENVIRONMENT to Vercel
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.1_

  - [ ] 15.2 Create production prompts
    - Create all prompts in production Langfuse project
    - Assign "production" labels
    - Verify prompts are accessible
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 15.3 Deploy to staging
    - Deploy to staging environment
    - Test all routes in staging
    - Monitor traces in Langfuse
    - Verify no errors
    - _Requirements: All requirements_

  - [ ] 15.4 Deploy to production
    - Deploy to production environment
    - Monitor traces in Langfuse
    - Set up alerts for errors
    - Document rollback procedure
    - _Requirements: All requirements_
