import { NextRequest } from "next/server";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { jsonrepair } from "jsonrepair";

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

// Allowed canonical targets for header mapping
const CanonicalField = z.enum([
  "firstName",
  "lastName",
  "company",
  "email",
  "title",
  "website",
  "linkedin",
  "ignore",
]);

// Primary expected shape: original column name -> canonical field
const HeaderMappingForward = z.record(z.string(), CanonicalField);

// Common LLM alternative: canonical field -> original column name(s)
const HeaderMappingReverse = z.record(
  CanonicalField,
  z.union([z.string(), z.array(z.string())])
);

// Another alternative some models produce: list of pairs
const HeaderMappingPairs = z.array(
  z.object({ column: z.string(), mapTo: CanonicalField })
);

const ResponseSchema = z.object({
  // Map from original CSV header name to a canonical field or "ignore".
  headerMapping: z.union([
    HeaderMappingForward,
    HeaderMappingReverse,
    HeaderMappingPairs,
  ]),
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

    const runGeneration = async () => {
      try {
        const { object } = await generateObject({
          model: openai("gpt-4o-mini"),
          system,
          prompt,
          schema: ResponseSchema,
          temperature: 0,
          maxOutputTokens: 800,
        });
        return object;
      } catch (error) {
        const maybeText =
          typeof error === "object" && error !== null && "text" in error
            ? (error as { text?: unknown }).text
            : undefined;
        if (typeof maybeText !== "string") throw error;

        try {
          const repaired = jsonrepair(maybeText);
          const repairedJson = JSON.parse(repaired);
          return ResponseSchema.parse(repairedJson);
        } catch (repairError) {
          console.warn("Failed to repair JSON from LLM", repairError);
          throw error;
        }
      }
    };

    const object = await runGeneration();

    // Normalize headerMapping to: original header -> canonical string
    const normalize = (
      mapping: unknown,
      cols: string[]
    ): Record<string, z.infer<typeof CanonicalField>> => {
      const out: Record<string, z.infer<typeof CanonicalField>> = {};
      const setIfCol = (col: string, target: z.infer<typeof CanonicalField>) => {
        if (!col) return;
        // Only keep mappings for known columns
        if (cols.includes(col)) out[col] = target;
      };

      // Forward shape
      if (HeaderMappingForward.safeParse(mapping).success) {
        const m = mapping as z.infer<typeof HeaderMappingForward>;
        for (const [col, target] of Object.entries(m)) setIfCol(col, target);
        return out;
      }
      // Reverse shape
      if (HeaderMappingReverse.safeParse(mapping).success) {
        const m = mapping as z.infer<typeof HeaderMappingReverse>;
        for (const [target, colsOrList] of Object.entries(m)) {
          const list = Array.isArray(colsOrList) ? colsOrList : [colsOrList as string];
          for (const col of list) setIfCol(col, target as z.infer<typeof CanonicalField>);
        }
        return out;
      }
      // Pairs shape
      if (HeaderMappingPairs.safeParse(mapping).success) {
        const m = mapping as z.infer<typeof HeaderMappingPairs>;
        for (const { column, mapTo } of m) setIfCol(column, mapTo);
        return out;
      }
      // Fallback: empty mapping
      return out;
    };

    const normalized = {
      ...object,
      headerMapping: normalize(object.headerMapping, columns),
    };

    return Response.json(normalized);
  } catch (err) {
    console.error("/api/map-csv error", err);
    return new Response("Failed to map CSV", { status: 500 });
  }
}
