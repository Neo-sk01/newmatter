import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { getXYZFormulaMasterPrompt, getPromptVersion } from "@/lib/prompts/xyz-formula";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const system = body?.system as string | undefined;
    const modelIdentifier = body?.model ?? body?.modelIdentifier;
    const researchSummary = typeof body?.researchSummary === "string" ? body.researchSummary.trim() : "";

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

    // Use XYZ Formula master prompt if system prompt not provided
    const systemPrompt = system ?? getXYZFormulaMasterPrompt();

    const compiledPrompt = researchSummary
      ? `${prompt.trim()}\n\nApproved research summary (max 100 words):\n${researchSummary}\n\nPersonalize the outreach by referencing at least one insight from the summary. Do not repeat the summary verbatim.`
      : prompt;

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: compiledPrompt,
      maxOutputTokens: 700,
      temperature: 0.7,
    });

    const textResponse = result.text?.trim() ?? "";

    return new Response(textResponse, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Prompt-Version": getPromptVersion(),
      },
    });
  } catch (e) {
    return new Response("Failed to generate", { status: 500 });
  }
}
