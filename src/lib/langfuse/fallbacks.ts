/**
 * Fallback prompts for when Langfuse is unavailable
 */

import type { FallbackPrompt } from "./types";
import type { TextPromptClient, ChatPromptClient } from "@langfuse/client";

/**
 * Fallback prompts configuration
 */
export const FALLBACK_PROMPTS: Record<string, FallbackPrompt> = {
  "email-generation-system": {
    type: "text",
    prompt: `You are a professional email writer assistant. Your task is to generate clear, concise, and professional emails based on the provided context. Follow these guidelines:

1. Use appropriate tone and formality based on the context
2. Keep emails concise and to the point
3. Use proper email structure (greeting, body, closing)
4. Maintain professional language
5. Ensure clarity and readability`,
    config: {
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxOutputTokens: 700,
    },
  },
  "email-generation-user": {
    type: "text",
    prompt: `Generate a professional email with the following details:

Subject: {{subject}}
Recipient: {{name}}
Body/Context: {{body}}
Date: {{date}}

Please create a well-structured email that addresses the context provided.`,
    config: {
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxOutputTokens: 700,
    },
  },
};

/**
 * Creates a fallback PromptClient-like object from a FallbackPrompt
 * 
 * @param name - The prompt name
 * @param fallback - The fallback prompt configuration
 * @returns A PromptClient-compatible object
 */
export function createFallbackPrompt(
  name: string,
  fallback: FallbackPrompt
): TextPromptClient | ChatPromptClient {
  const promptText = typeof fallback.prompt === "string" 
    ? fallback.prompt 
    : JSON.stringify(fallback.prompt);

  return {
    name,
    version: 0,
    type: fallback.type,
    prompt: promptText,
    config: fallback.config || {},
    labels: ["fallback"],
    tags: ["fallback"],
    
    compile: (variables?: Record<string, any>) => {
      let compiled = promptText;
      
      if (variables) {
        // Replace {{variable}} with actual values
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
          compiled = compiled.replace(regex, String(value));
        });
      }
      
      // For chat prompts, parse back to array
      if (fallback.type === "chat") {
        try {
          return JSON.parse(compiled);
        } catch {
          return compiled;
        }
      }
      
      return compiled;
    },
    
    toJSON: () => JSON.stringify({
      name,
      version: 0,
      type: fallback.type,
      prompt: promptText,
      config: fallback.config || {},
      labels: ["fallback"],
    }),
  } as any;
}
