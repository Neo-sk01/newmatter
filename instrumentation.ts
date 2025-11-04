import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import type { ReadableSpan } from "@opentelemetry/sdk-trace-base";

/**
 * Filter function to exclude Next.js infrastructure spans from being exported to Langfuse.
 * This prevents noise from internal Next.js operations and focuses on application-level traces.
 * 
 * @param params - Object containing the OpenTelemetry span
 * @returns true if the span should be exported, false otherwise
 */
function shouldExportSpan(params: { otelSpan: ReadableSpan }): boolean {
  // Exclude Next.js internal spans to reduce noise
  const instrumentationScope = params.otelSpan.instrumentationScope;
  if (instrumentationScope?.name === "next.js") {
    return false;
  }
  
  return true;
}

/**
 * Initialize LangfuseSpanProcessor with environment configuration and span filtering.
 * This processor exports OpenTelemetry spans to Langfuse for observability.
 */
export const langfuseSpanProcessor = new LangfuseSpanProcessor({
  shouldExportSpan,
});

/**
 * Register function called by Next.js instrumentation hook.
 * Initializes OpenTelemetry with Langfuse integration.
 * This runs before the application starts, ensuring all traces are captured.
 */
export function register() {
  // Check if Langfuse credentials are configured
  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) {
    console.warn(
      "Langfuse credentials not found. Tracing is disabled. " +
      "Set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY environment variables to enable tracing."
    );
    return;
  }

  try {
    // Create and configure the NodeTracerProvider
    const provider = new NodeTracerProvider();
    
    // Add the Langfuse span processor
    // Type assertion needed due to OpenTelemetry version compatibility
    provider.addSpanProcessor(langfuseSpanProcessor as any);
    
    // Register the provider globally
    provider.register();
    
    console.log("Langfuse OpenTelemetry instrumentation initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Langfuse instrumentation:", error);
    // Don't throw - allow application to continue without tracing
  }
}
