/**
 * Type definitions for Langfuse prompt management
 */

import type { TextPromptClient, ChatPromptClient } from "@langfuse/client";

/**
 * Options for fetching prompts from Langfuse
 */
export interface GetPromptOptions {
  /** The label to fetch (defaults to "production") */
  label?: string;
  /** Specific version number to fetch */
  version?: number;
  /** Cache duration in seconds (defaults to 60) */
  cacheTtlSeconds?: number;
}

/**
 * Text prompt type
 */
export type TextPrompt = TextPromptClient;

/**
 * Chat prompt type with message array
 */
export type ChatPrompt = ChatPromptClient;

/**
 * Fallback prompt configuration
 */
export interface FallbackPrompt {
  type: "text" | "chat";
  prompt: string | Array<{ role: string; content: string }>;
  config?: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    [key: string]: any;
  };
}
