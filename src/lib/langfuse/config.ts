/**
 * Langfuse configuration and constants
 */

export const LANGFUSE_CONFIG = {
  // Feature flags
  ENABLE_TRACING: process.env.LANGFUSE_ENABLE_TRACING !== "false",
  ENABLE_PROMPT_MANAGEMENT: process.env.LANGFUSE_ENABLE_PROMPTS !== "false",
  
  // Prompt names for version control
  PROMPTS: {
    EMAIL_GENERATION: "email-generation-system",
    LEAD_RESEARCH: "lead-research-system",
    CSV_MAPPING: "csv-column-mapping",
  },
  
  // Trace metadata tags
  TAGS: {
    EMAIL_GENERATION: "email-generation",
    LEAD_RESEARCH: "lead-research",
    PRODUCTION: "production",
    DEVELOPMENT: "development",
  },
} as const;

/**
 * Get the current environment tag for traces
 */
export function getEnvironmentTag(): string {
  return process.env.NODE_ENV === "production" 
    ? LANGFUSE_CONFIG.TAGS.PRODUCTION 
    : LANGFUSE_CONFIG.TAGS.DEVELOPMENT;
}


