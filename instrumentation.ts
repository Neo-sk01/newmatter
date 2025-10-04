import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

let sdk: NodeSDK | undefined;

export async function register() {
  if (sdk) {
    return;
  }

  sdk = new NodeSDK({
    spanProcessors: [new LangfuseSpanProcessor()],
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable instrumentations that might be noisy
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  try {
    sdk.start();
    console.log("✅ Langfuse OpenTelemetry instrumentation started");
  } catch (error) {
    console.error("❌ Error starting OpenTelemetry instrumentation:", error);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  try {
    await sdk?.shutdown();
    console.log("✅ OpenTelemetry SDK shut down successfully");
  } catch (error) {
    console.error("❌ Error shutting down OpenTelemetry SDK:", error);
  } finally {
    process.exit(0);
  }
});


