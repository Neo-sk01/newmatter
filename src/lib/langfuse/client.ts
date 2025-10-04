import { Langfuse } from "@langfuse/client";

let langfuseClient: Langfuse | null = null;

/**
 * Get or create a singleton Langfuse client instance
 */
export function getLangfuseClient(): Langfuse {
  if (!langfuseClient) {
    langfuseClient = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
      release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.APP_VERSION,
      requestTimeout: 10000,
    });
  }
  return langfuseClient;
}

/**
 * Flush pending traces to Langfuse
 * Call this before serverless functions complete
 */
export async function flushLangfuse(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.flushAsync();
  }
}

/**
 * Shutdown the Langfuse client gracefully
 */
export async function shutdownLangfuse(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.shutdownAsync();
    langfuseClient = null;
  }
}


