import { NextRequest } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

// Canonical lead schema used by the app
const LeadSchema = z.object({
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  company: z.string().optional().default(""),
  email: z.string().optional().default(""),
  title: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
});

const ResponseSchema = z.object({
  // Map from original CSV header name to a canonical field or "ignore".
  headerMapping: z.record(
    z.string(),
    z.union([
      z.literal("firstName"),
      z.literal("lastName"),
      z.literal("company"),
      z.literal("email"),
      z.literal("title"),
      z.literal("website"),
      z.literal("linkedin"),
      z.literal("ignore"),
    ])
  ),
  // Optional rule for splitting a full name column into first/last
  rules: z
    .object({
      splitFullName: z
        .object({
          column: z.string(),
          firstNameFirst: z.boolean().default(true),
        })
        .optional(),
    })
    .optional()
    .default({}),
  // Example mapped leads for the provided sample rows (helps client verify mapping)
  sampleLeads: z.array(LeadSchema).default([]),
  notes: z.string().optional().default(""),
});

const RequestSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.any())), // sample rows only
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response("Invalid payload", { status: 400 });
    }
    const { columns, rows } = parsed.data;

    // Guardrails: cap sample size to keep prompt compact
    const sampleRows = rows.slice(0, 25);

    const system = `You are a data-mapping assistant.
Map arbitrary CSV columns to a canonical lead schema and produce a clear mapping and sample normalization.

Canonical fields: firstName, lastName, company, email, title, website, linkedin.
Required minimal fields per lead: email OR linkedin (email preferred). If neither exists for a row, you may omit it from sampleLeads.

Guidelines:
- Only choose from the canonical fields above, or "ignore" when a column is irrelevant.
- If there is a single full name column, set headerMapping to "ignore" for it and add rules.splitFullName with that column name.
- Derive firstName/lastName from a full name if needed (first token as first name; last token as last name; keep middle tokens with last if ambiguous). Do not fabricate data.
- Normalize emails to lowercase. Normalize website/linkedin URLs to absolute https URLs when possible.
- Do not invent values that are not present or clearly derivable from the row.
`;

    const prompt = `Columns (original headers):\n${JSON.stringify(columns, null, 2)}\n\n` +
      `Sample rows (values as strings):\n${JSON.stringify(sampleRows, null, 2)}\n\n` +
      `Return a JSON object with:\n- headerMapping: map original column => one of [firstName,lastName,company,email,title,website,linkedin,ignore]\n- rules.splitFullName if applicable\n- sampleLeads: 3-10 normalized examples derived strictly from provided sample rows\n- notes: brief rationale if relevant.`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      system,
      prompt,
      schema: ResponseSchema,
      temperature: 0,
      maxOutputTokens: 800,
    });

    return Response.json(object);
  } catch (err) {
    console.error("/api/map-csv error", err);
    return new Response("Failed to map CSV", { status: 500 });
  }
}
