# Requirements Document

## Introduction

This document outlines the requirements for integrating Langfuse observability and tracing into the SalesMatter Next.js application. Langfuse is an open-source LLM engineering platform that provides observability, analytics, and prompt management for AI applications. The integration will enable comprehensive monitoring of AI SDK calls, token usage tracking, performance analysis, and debugging capabilities across the application's AI-powered features.

## Glossary

- **Langfuse**: An open-source LLM engineering platform for observability, analytics, and prompt management
- **Application**: The SalesMatter Next.js application that uses Vercel AI SDK for AI-powered features
- **Trace**: A complete execution flow captured by Langfuse, representing a single user request or operation
- **Observation**: Individual operations within a trace (spans, events, generations)
- **Generation**: A specific type of observation representing an LLM API call
- **OpenTelemetry (OTEL)**: An open-source observability framework used by Langfuse TypeScript SDK v4
- **LangfuseSpanProcessor**: The component that exports OpenTelemetry spans to Langfuse
- **Vercel AI SDK**: The AI framework currently used in the Application for generating text and objects
- **Environment**: A context label (e.g., production, staging, development) for organizing traces

## Requirements

### Requirement 1

**User Story:** As a developer, I want to install and configure Langfuse SDK packages, so that the Application can send telemetry data to Langfuse

#### Acceptance Criteria

1. WHEN the developer installs dependencies, THE Application SHALL include the @langfuse/tracing package version 4.x or higher
2. WHEN the developer installs dependencies, THE Application SHALL include the @langfuse/otel package version 4.x or higher
3. WHEN the developer installs dependencies, THE Application SHALL include the @opentelemetry/sdk-trace-node package
4. WHEN the developer installs dependencies, THE Application SHALL include the @opentelemetry/api package
5. WHERE the Application uses OpenAI SDK directly, THE Application SHALL include the @langfuse/openai package

### Requirement 2

**User Story:** As a developer, I want to configure Langfuse credentials via environment variables, so that the Application can authenticate with the Langfuse service

#### Acceptance Criteria

1. WHEN environment variables are configured, THE Application SHALL read LANGFUSE_SECRET_KEY from environment
2. WHEN environment variables are configured, THE Application SHALL read LANGFUSE_PUBLIC_KEY from environment
3. WHEN environment variables are configured, THE Application SHALL read LANGFUSE_BASE_URL from environment
4. WHERE LANGFUSE_BASE_URL is not provided, THE Application SHALL default to https://cloud.langfuse.com
5. WHEN environment variables are missing, THE Application SHALL log a warning message indicating Langfuse tracing is disabled

### Requirement 3

**User Story:** As a developer, I want to initialize OpenTelemetry with Langfuse integration, so that traces are automatically exported to Langfuse

#### Acceptance Criteria

1. WHEN the Application starts, THE Application SHALL create an instrumentation.ts file in the project root
2. WHEN the Application initializes, THE Application SHALL register a NodeTracerProvider with LangfuseSpanProcessor
3. WHEN the Application initializes, THE Application SHALL configure a span filter to exclude Next.js infrastructure spans
4. WHEN the Application initializes, THE Application SHALL register the tracer provider globally
5. WHEN Next.js loads, THE Application SHALL execute the instrumentation setup before application code runs

### Requirement 4

**User Story:** As a developer, I want to enable telemetry in Vercel AI SDK calls, so that LLM generations are traced in Langfuse

#### Acceptance Criteria

1. WHEN an AI SDK function is called, THE Application SHALL pass experimental_telemetry with isEnabled set to true
2. WHEN an AI SDK function is called, THE Application SHALL create a generation observation in Langfuse
3. WHEN an AI SDK function completes, THE Application SHALL record input tokens, output tokens, and total tokens
4. WHEN an AI SDK function completes, THE Application SHALL record the model name used
5. WHEN an AI SDK function fails, THE Application SHALL record the error in the observation with level ERROR

### Requirement 5

**User Story:** As a developer, I want to wrap API route handlers with observability, so that each request creates a named trace in Langfuse

#### Acceptance Criteria

1. WHEN an API route handler is defined, THE Application SHALL wrap the handler function with the observe decorator
2. WHEN a request is received, THE Application SHALL create a root observation with a descriptive name
3. WHEN the handler processes a request, THE Application SHALL update the active observation with input data
4. WHEN the handler completes, THE Application SHALL update the active observation with output data
5. WHERE the response is streamed, THE Application SHALL set endOnExit to false and manually end the span after streaming completes

### Requirement 6

**User Story:** As a developer, I want to add metadata to traces, so that I can filter and analyze traces by user, session, and other attributes

#### Acceptance Criteria

1. WHEN a trace is created, THE Application SHALL allow setting userId via updateActiveTrace
2. WHEN a trace is created, THE Application SHALL allow setting sessionId via updateActiveTrace
3. WHEN a trace is created, THE Application SHALL allow setting tags via updateActiveTrace
4. WHEN a trace is created, THE Application SHALL allow setting custom metadata via updateActiveTrace
5. WHEN metadata is updated multiple times, THE Application SHALL merge metadata at the top-level key

### Requirement 7

**User Story:** As a developer, I want to flush traces in serverless environments, so that traces are sent before the function terminates

#### Acceptance Criteria

1. WHEN an API route completes in a serverless environment, THE Application SHALL call forceFlush on the LangfuseSpanProcessor
2. WHERE Next.js after function is available, THE Application SHALL schedule the flush using after
3. WHEN forceFlush is called, THE Application SHALL await the flush operation to complete
4. WHEN forceFlush fails, THE Application SHALL log the error without blocking the response
5. WHEN the Application runs locally, THE Application SHALL still call forceFlush for consistency

### Requirement 8

**User Story:** As a developer, I want to configure environment labels, so that I can separate traces from development, staging, and production

#### Acceptance Criteria

1. WHEN environment configuration is set, THE Application SHALL read LANGFUSE_TRACING_ENVIRONMENT from environment variables
2. WHERE LANGFUSE_TRACING_ENVIRONMENT is not set, THE Application SHALL use "development" as the default environment
3. WHEN a trace is created, THE Application SHALL tag the trace with the configured environment
4. WHEN viewing traces in Langfuse UI, THE Application SHALL allow filtering by environment
5. WHEN the environment name is invalid, THE Application SHALL log a warning and use the default environment

### Requirement 9

**User Story:** As a developer, I want to update existing API routes with Langfuse tracing, so that all AI-powered endpoints are observable

#### Acceptance Criteria

1. WHEN the generate-email route is called, THE Application SHALL create a trace named "generate-email"
2. WHEN the lead-research route is called, THE Application SHALL create a trace named "lead-research"
3. WHEN the parse-csv-ai route is called, THE Application SHALL create a trace named "parse-csv-ai"
4. WHEN any AI route is called, THE Application SHALL record the request body as input
5. WHEN any AI route completes, THE Application SHALL record the response as output

### Requirement 10

**User Story:** As a developer, I want to add example environment variables to documentation, so that other developers can configure Langfuse easily

#### Acceptance Criteria

1. WHEN the env.example file is updated, THE Application SHALL include LANGFUSE_SECRET_KEY with a placeholder value
2. WHEN the env.example file is updated, THE Application SHALL include LANGFUSE_PUBLIC_KEY with a placeholder value
3. WHEN the env.example file is updated, THE Application SHALL include LANGFUSE_BASE_URL with the default cloud URL
4. WHEN the env.example file is updated, THE Application SHALL include LANGFUSE_TRACING_ENVIRONMENT with "development" as default
5. WHEN the env.example file is updated, THE Application SHALL include comments explaining how to obtain Langfuse credentials

### Requirement 11

**User Story:** As a developer, I want to install the Langfuse client package, so that I can use prompt management features

#### Acceptance Criteria

1. WHEN the developer installs dependencies, THE Application SHALL include the @langfuse/client package version 4.x or higher
2. WHEN the Application initializes, THE Application SHALL create a LangfuseClient instance for prompt management
3. WHEN the LangfuseClient is initialized, THE Application SHALL read credentials from environment variables
4. WHEN the LangfuseClient is initialized, THE Application SHALL use the same credentials as the tracing setup
5. WHERE credentials are missing, THE Application SHALL log a warning that prompt management is unavailable

### Requirement 12

**User Story:** As a developer, I want to create prompts in Langfuse UI, so that I can manage prompt templates centrally

#### Acceptance Criteria

1. WHEN a developer creates a prompt in Langfuse UI, THE Application SHALL allow setting a unique prompt name
2. WHEN a developer creates a prompt in Langfuse UI, THE Application SHALL allow choosing between text and chat prompt types
3. WHEN a developer creates a prompt in Langfuse UI, THE Application SHALL allow defining variables using double curly braces syntax
4. WHEN a developer creates a prompt in Langfuse UI, THE Application SHALL allow adding configuration parameters in the config field
5. WHEN a developer creates a prompt in Langfuse UI, THE Application SHALL allow assigning labels for version management

### Requirement 13

**User Story:** As a developer, I want to fetch prompts from Langfuse in my code, so that I can use centrally managed prompt templates

#### Acceptance Criteria

1. WHEN fetching a prompt, THE Application SHALL call langfuse.prompt.get with the prompt name
2. WHEN fetching a prompt without specifying a label, THE Application SHALL retrieve the version labeled "production"
3. WHEN fetching a prompt with a specific label, THE Application SHALL retrieve the version with that label
4. WHEN fetching a prompt with a specific version number, THE Application SHALL retrieve that exact version
5. WHEN a prompt does not exist, THE Application SHALL throw an error with a descriptive message

### Requirement 14

**User Story:** As a developer, I want to compile prompts with variables, so that I can inject dynamic values into prompt templates

#### Acceptance Criteria

1. WHEN compiling a text prompt, THE Application SHALL call prompt.compile with an object containing variable values
2. WHEN compiling a text prompt, THE Application SHALL replace all variables in double curly braces with provided values
3. WHEN compiling a chat prompt, THE Application SHALL return an array of message objects with variables replaced
4. WHEN a required variable is missing, THE Application SHALL throw an error indicating which variable is missing
5. WHEN extra variables are provided, THE Application SHALL ignore them without error

### Requirement 15

**User Story:** As a developer, I want to link prompts to generations, so that I can track which prompt version was used for each LLM call

#### Acceptance Criteria

1. WHEN making an AI SDK call with a prompt, THE Application SHALL pass the prompt object in experimental_telemetry metadata
2. WHEN passing a prompt in metadata, THE Application SHALL use the key langfusePrompt
3. WHEN passing a prompt in metadata, THE Application SHALL call prompt.toJSON to serialize the prompt
4. WHEN a generation is created with a linked prompt, THE Application SHALL display the prompt link in Langfuse UI
5. WHEN viewing metrics by prompt version, THE Application SHALL aggregate data for all generations using that prompt version

### Requirement 16

**User Story:** As a developer, I want to access prompt configuration, so that I can use model parameters stored with the prompt

#### Acceptance Criteria

1. WHEN a prompt is fetched, THE Application SHALL expose a config property on the prompt object
2. WHEN accessing prompt config, THE Application SHALL return the JSON object stored in the config field
3. WHERE config contains model parameters, THE Application SHALL allow using those parameters in AI SDK calls
4. WHERE config contains custom metadata, THE Application SHALL allow accessing that metadata in application code
5. WHERE config is not set, THE Application SHALL return an empty object

### Requirement 17

**User Story:** As a developer, I want to create a prompt management utility, so that prompt fetching is centralized and reusable

#### Acceptance Criteria

1. WHEN the utility is created, THE Application SHALL export a function to fetch prompts by name
2. WHEN the utility is created, THE Application SHALL export a function to fetch prompts by name and label
3. WHEN the utility is created, THE Application SHALL handle errors gracefully with fallback prompts
4. WHEN the utility is created, THE Application SHALL cache prompts with a configurable TTL
5. WHEN the utility is created, THE Application SHALL provide TypeScript types for prompt objects

### Requirement 18

**User Story:** As a developer, I want to migrate existing hardcoded prompts to Langfuse, so that all prompts are managed centrally

#### Acceptance Criteria

1. WHEN migrating prompts, THE Application SHALL identify all hardcoded prompt strings in API routes
2. WHEN migrating prompts, THE Application SHALL create corresponding prompts in Langfuse UI with appropriate names
3. WHEN migrating prompts, THE Application SHALL replace hardcoded strings with prompt.get calls
4. WHEN migrating prompts, THE Application SHALL identify variables in prompts and use double curly brace syntax
5. WHEN migrating prompts, THE Application SHALL test that migrated prompts produce equivalent outputs

### Requirement 19

**User Story:** As a developer, I want to version prompts, so that I can experiment with different prompt variations without breaking production

#### Acceptance Criteria

1. WHEN creating a new prompt version, THE Application SHALL automatically increment the version number
2. WHEN creating a new prompt version, THE Application SHALL preserve all previous versions
3. WHEN assigning labels to versions, THE Application SHALL allow moving the "production" label to different versions
4. WHEN assigning labels to versions, THE Application SHALL allow creating custom labels for A/B testing
5. WHEN rolling back a prompt, THE Application SHALL allow reassigning the "production" label to a previous version

### Requirement 20

**User Story:** As a developer, I want to use prompt config for model parameters, so that model settings are managed alongside prompts

#### Acceptance Criteria

1. WHEN storing model parameters in config, THE Application SHALL include model name, temperature, and max_tokens
2. WHEN fetching a prompt with config, THE Application SHALL extract model parameters from prompt.config
3. WHEN making an AI SDK call, THE Application SHALL use model parameters from prompt config
4. WHERE prompt config is missing parameters, THE Application SHALL use default values
5. WHERE prompt config contains invalid parameters, THE Application SHALL log a warning and use defaults
