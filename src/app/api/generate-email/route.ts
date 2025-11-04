import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { observe, updateActiveTrace, updateActiveObservation } from "@langfuse/tracing";
import { after } from "next/server";
import { langfuseSpanProcessor } from "@/lib/langfuse/span-processor";
import { getPrompt } from "@/lib/langfuse/prompts";

function resolveModel(identifier: unknown) {
  const fallbackIdentifier = process.env.AI_EMAIL_MODEL ?? "openai:gpt-4o-mini";
  const value = typeof identifier === "string" && identifier.trim().length > 0 ? identifier.trim() : fallbackIdentifier;
  const [provider, ...rest] = value.split(":");
  const modelName = rest.join(":").trim();

  if (!provider || !modelName) {
    throw new Error("Invalid model identifier. Use '<provider>:<model>' format, e.g. 'openai:gpt-4o-mini'.");
  }

  switch (provider) {
    case "openai":
      return openai(modelName);
    case "anthropic":
      return anthropic(modelName);
    default:
      throw new Error(`Unsupported model provider '${provider}'.`);
  }
}

const handler = async (req: Request) => {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const system = body?.system as string | undefined;
    const modelIdentifier = body?.model ?? body?.modelIdentifier;
    const researchSummary = typeof body?.researchSummary === "string" ? body.researchSummary.trim() : "";

    // Update trace with metadata
    updateActiveTrace({
      name: "generate-email",
      userId: body?.userId,
      sessionId: body?.sessionId,
      tags: ["email-generation", "ai-sdk"],
      input: {
        prompt,
        system,
        modelIdentifier,
        hasResearchSummary: !!researchSummary,
      },
    });

    // Update observation with input
    updateActiveObservation({
      input: {
        prompt,
        system,
        modelIdentifier,
        hasResearchSummary: !!researchSummary,
      },
    });

    if (!prompt || typeof prompt !== "string") {
      return new Response("Invalid prompt", { status: 400 });
    }

    let model;
    try {
      model = resolveModel(modelIdentifier);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid model configuration.";
      return new Response(message, { status: 400 });
    }

    const compiledPrompt = researchSummary
      ? `${prompt.trim()}\n\nApproved research summary (max 100 words):\n${researchSummary}\n\nPersonalize the outreach by referencing at least one insight from the summary. Do not repeat the summary verbatim.`
      : prompt;

    const result = await generateText({
      model,
      system,
      prompt: compiledPrompt,
      maxOutputTokens: 700,
      temperature: 0.7,
      experimental_telemetry: {
        isEnabled: true,
        metadata: {
          // Future: Add langfusePrompt here when prompts are migrated
        },
      },
    });

    const textResponse = result.text?.trim() ?? "";

    // Update observation with output
    updateActiveObservation({
      output: {
        text: textResponse,
        usage: result.usage,
      },
    });

    // Flush traces in serverless environment
    after(async () => {
      try {
        await langfuseSpanProcessor.forceFlush();
      } catch (error) {
        console.warn("Failed to flush Langfuse spans:", error);
      }
    });

    return new Response(textResponse, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response("Failed to generate", { status: 500 });
  }
};

export const POST = observe(handler, {
  name: "generate-email",
});
