import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

type LeadPayload = {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  title?: string | null;
  email?: string | null;
  website?: string | null;
};

const SUMMARY_WORD_LIMIT = 100;

const clampSummary = (value: string, limit = SUMMARY_WORD_LIMIT) => {
  if (!value) return "";
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return value.trim();
  return words.slice(0, limit).join(" ");
};

const buildLeadContext = (lead: LeadPayload) => {
  const lines: string[] = [];
  if (lead.firstName || lead.lastName) {
    lines.push(`Name: ${[lead.firstName, lead.lastName].filter(Boolean).join(' ')}`);
  }
  if (lead.title) lines.push(`Title: ${lead.title}`);
  if (lead.company) lines.push(`Company: ${lead.company}`);
  if (lead.website) lines.push(`Website: ${lead.website}`);
  if (lead.email) lines.push(`Email: ${lead.email}`);
  return lines.join("\n");
};

const resolveOpenAIModelId = (identifier: unknown) => {
  const fallback = "gpt-4o";
  if (typeof identifier !== "string") return fallback;
  const trimmed = identifier.trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(":");
  return parts.length > 1 ? parts.slice(1).join(":") || fallback : trimmed;
};

const normalizeSources = (sources: Array<Record<string, unknown>> | undefined) => {
  if (!Array.isArray(sources)) return [];
  return sources
    .map((source) => {
      const url = typeof source.url === "string" ? source.url : undefined;
      const title = typeof source.title === "string" && source.title.trim() ? source.title.trim() : undefined;
      const snippet = typeof source.snippet === "string" ? source.snippet : "";
      if (!url) return null;
      return {
        title: title ?? "Referenced source",
        link: url,
        snippet,
      };
    })
    .filter((item): item is { title: string; link: string; snippet: string } => Boolean(item));
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<{ lead: LeadPayload; query: string }>;
    const lead = body.lead ?? null;
    const customQuery = typeof body.query === "string" ? body.query.trim() : "";

    if (!lead) {
      return NextResponse.json({ error: "Missing lead payload." }, { status: 400 });
    }

    const modelId = resolveOpenAIModelId(process.env.AI_RESEARCH_MODEL);
    let model;
    try {
      model = openai(modelId);
    } catch (error) {
      console.warn('Falling back to default research model', error);
      model = openai('gpt-4o');
    }

    const query = (customQuery || [lead.firstName, lead.lastName, lead.company, lead.title, lead.email]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join(" "))
      .trim();

    const leadContext = buildLeadContext(lead);

    const prompt = `You are assisting with sales outreach research. Use the web search tool to gather up-to-date, factual insights about the lead below. Prioritise recent news, product launches, strategic moves, metrics, leadership changes, and partnerships. Avoid generic statements or outdated information. Compile a concise summary (maximum ${SUMMARY_WORD_LIMIT} words) that will feed cold outreach personalisation. Mention concrete facts and attribute them to credible sources when possible. Return only the summary text.\n\nLead details:\n${leadContext || 'No additional lead context provided.'}`;

    let result;
    try {
      result = await generateText({
        model,
        prompt,
        temperature: 0.4,
        maxOutputTokens: 500,
        tools: [
          openai.tools.webSearchPreview({
            searchContextSize: 'high',
            userLocation: {
              type: 'approximate',
              country: 'ZA',
              region: 'South Africa',
            },
          }),
        ],
        toolChoice: { type: 'tool', toolName: 'web_search_preview' },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Web search is unavailable for this model.';
      console.error('Lead research generation failed', error);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const summary = clampSummary(result.text ?? "");
    const sources = normalizeSources(result.sources as Array<Record<string, unknown>> | undefined);

    return NextResponse.json({
      query,
      results: sources,
      summary,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Lead research handler failed", error);
    const message = error instanceof Error ? error.message : 'Failed to perform lead research.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
