import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const system = body?.system as string | undefined;

    if (!prompt || typeof prompt !== "string") {
      return new Response("Invalid prompt", { status: 400 });
    }

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system,
      prompt,
      maxOutputTokens: 700,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("/api/generate-email error", error);
    return new Response("Failed to generate", { status: 500 });
  }
}
