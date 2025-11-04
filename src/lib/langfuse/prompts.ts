/**
 * Langfuse prompt management utility
 * 
 * This module provides centralized prompt fetching and management
 * with caching and fallback support.
 */

import { LangfuseClient } from "@langfuse/client";
import type { TextPromptClient, ChatPromptClient } from "@langfuse/client";
import type { GetPromptOptions } from "./types";
import { FALLBACK_PROMPTS, createFallbackPrompt } from "./fallbacks";

/**
 * Singleton Langfuse client instance
 */
let langfuseClient: LangfuseClient | null = null;

/**
 * Initialize and get the Langfuse client
 */
function getLangfuseClient(): LangfuseClient {
  if (langfuseClient) {
    return langfuseClient;
  }

  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com";

  if (!secretKey || !publicKey) {
    console.warn(
      "Langfuse credentials not found. Prompt management will use fallbacks only. " +
      "Set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY environment variables."
    );
    throw new Error("Langfuse credentials not configured");
  }

  langfuseClient = new LangfuseClient({
    secretKey,
    publicKey,
    baseUrl,
  });

  return langfuseClient;
}

/**
 * Simple in-memory cache for prompts
 */
interface CacheEntry {
  prompt: TextPromptClient | ChatPromptClient;
  expiresAt: number;
}

const promptCache = new Map<string, CacheEntry>();

/**
 * Fetches a prompt from Langfuse by name.
 * 
 * @param name - The unique name of the prompt
 * @param options - Optional configuration
 * @param options.label - The label to fetch (defaults to "production")
 * @param options.version - Specific version number to fetch
 * @param options.cacheTtlSeconds - Cache duration in seconds (defaults to 60)
 * @returns Promise resolving to the prompt object
 * @throws Error if prompt not found and no fallback available
 * 
 * @example
 * ```typescript
 * const prompt = await getPrompt("email-generation-system");
 * const compiled = prompt.compile({ name: "John", topic: "AI" });
 * ```
 * 
 * @example
 * ```typescript
 * // Fetch specific version
 * const prompt = await getPrompt("email-generation-system", { version: 2 });
 * ```
 * 
 * @example
 * ```typescript
 * // Fetch with custom label
 * const prompt = await getPrompt("email-generation-system", { label: "staging" });
 * ```
 */
export async function getPrompt(
  name: string,
  options?: GetPromptOptions
): Promise<TextPromptClient | ChatPromptClient> {
  const label = options?.label || "production";
  const version = options?.version;
  const cacheTtlSeconds = options?.cacheTtlSeconds || 60;

  // Create cache key
  const cacheKey = `${name}:${version !== undefined ? version : label}`;

  // Check cache
  const cached = promptCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.prompt;
  }

  try {
    const client = getLangfuseClient();
    
    // Fetch prompt from Langfuse
    const fetchOptions: { label?: string; version?: number } = {};
    if (version !== undefined) {
      fetchOptions.version = version;
    } else {
      fetchOptions.label = label;
    }

    const prompt = await client.prompt.get(name, fetchOptions);

    // Cache the prompt
    promptCache.set(cacheKey, {
      prompt,
      expiresAt: Date.now() + cacheTtlSeconds * 1000,
    });

    return prompt;
  } catch (error) {
    console.error(`Failed to fetch prompt "${name}":`, error);

    // Check for fallback prompt
    const fallback = FALLBACK_PROMPTS[name];
    if (fallback) {
      console.warn(`Using fallback prompt for "${name}"`);
      return createFallbackPrompt(name, fallback);
    }

    throw new Error(
      `Prompt "${name}" not found and no fallback available. ` +
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetches and compiles a prompt in one call.
 * 
 * @param name - The unique name of the prompt
 * @param variables - Variables to inject into the prompt template
 * @param options - Optional configuration (label, version)
 * @returns Promise resolving to compiled prompt string or chat messages
 * @throws Error if prompt not found or required variables are missing
 * 
 * @example
 * ```typescript
 * const compiled = await getCompiledPrompt("email-generation-user", {
 *   name: "John Doe",
 *   subject: "Meeting Follow-up",
 *   body: "Thank you for the meeting",
 *   date: "2024-01-15"
 * });
 * ```
 */
export async function getCompiledPrompt(
  name: string,
  variables: Record<string, any>,
  options?: Omit<GetPromptOptions, "cacheTtlSeconds">
): Promise<string | Array<{ role: string; content: string }>> {
  try {
    const prompt = await getPrompt(name, options);
    const compiled = prompt.compile(variables);
    
    return compiled;
  } catch (error) {
    if (error instanceof Error && error.message.includes("missing")) {
      throw new Error(
        `Failed to compile prompt "${name}": ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Export the client getter for advanced use cases
 */
export { getLangfuseClient as langfuseClient };
