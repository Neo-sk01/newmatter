import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response("Invalid prompt", { status: 400 });
    }

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxOutputTokens: 500,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch {
    return new Response("Failed to generate", { status: 500 });
  }
}
