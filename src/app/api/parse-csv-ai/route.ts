import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Strict Lead Schema for validation
const LeadSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  company: z.string().min(1, "Company required"),
  title: z.string().default(""),
  website: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(["new", "enriched", "generated"]).default("new"),
  customFields: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

// Response schema
const ParseResponseSchema = z.object({
  leads: z.array(LeadSchema),
  totalRows: z.number(),
  validLeads: z.number(),
  skippedRows: z.number(),
  processingTime: z.number(),
  qualityMetrics: z.object({
    hasValidEmail: z.number(),
    hasName: z.number(),
    hasCompany: z.number(),
    hasTitle: z.number(),
  }),
  warnings: z.array(z.string()),
});

type Lead = z.infer<typeof LeadSchema>;
type ParseResponse = z.infer<typeof ParseResponseSchema>;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await req.json();
    const { rows, columns } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No data rows provided",
      }, { status: 400 });
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No column headers provided",
      }, { status: 400 });
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return NextResponse.json({
        success: false,
        error: "AI service not configured",
        fallbackRequired: true,
      }, { status: 503 });
    }

    console.log(`Processing ${rows.length} rows with ${columns.length} columns`);
    
    // Process all rows (with reasonable limit to avoid token issues)
    const maxRowsToProcess = Math.min(rows.length, 1000);
    const rowsToProcess = rows.slice(0, maxRowsToProcess);
    
    if (rows.length > maxRowsToProcess) {
      console.warn(`⚠️ CSV has ${rows.length} rows. Processing first ${maxRowsToProcess} to stay within token limits.`);
    }

    // Build complete dataset for AI
    const csvData = rowsToProcess.map((row: Record<string, unknown>) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col: string) => {
        obj[col] = row[col];
      });
      return obj;
    });

    const prompt = `You are a CSV data parser for a sales automation system. Parse ALL ${csvData.length} rows of this CSV data into a structured list of sales leads.

CSV Columns: ${columns.join(", ")}

FULL DATA (ALL ${csvData.length} ROWS):
${JSON.stringify(csvData, null, 2)}

CRITICAL REQUIREMENTS:
1. Parse EVERY SINGLE ROW - return exactly ${csvData.length} lead objects
2. Extract firstName, lastName, email, company, and title for each lead
3. If you find a "Full Name" or "Name" column, split it into firstName and lastName
4. Ensure email is valid format (user@domain.com) - skip rows with invalid emails
5. Clean and normalize all text fields (trim whitespace)
6. Set status to "new" for all leads
7. Extract any additional fields (phone, location, website, linkedin) if present
8. Only skip rows with missing email OR if both firstName and lastName are completely empty
9. For website/linkedin URLs, ensure they start with https://

IMPORTANT: Return a lead object for EACH row in the data. Do not skip valid rows.`;

    console.log(`Calling Vercel AI SDK to parse ALL ${csvData.length} leads...`);

    // Use Vercel AI SDK to parse the entire dataset
    const result = await generateObject({
      model: openai("gpt-4o-2024-08-06"), // Use the latest model
      prompt: prompt,
      schema: z.object({
        leads: z.array(z.object({
          firstName: z.string(),
          lastName: z.string(),
          email: z.string(),
          company: z.string(),
          title: z.string(),
          website: z.string().optional(),
          linkedin: z.string().optional(),
          phone: z.string().optional(),
          location: z.string().optional(),
          industry: z.string().optional(),
        })),
      }),
      temperature: 0.1, // Low temperature for consistent parsing
      maxTokens: 16000, // Increased token limit to handle large datasets
    });

    console.log(`✅ AI returned ${result.object.leads.length} leads from ${csvData.length} input rows`);
    
    if (result.object.leads.length < csvData.length) {
      console.warn(`⚠️ AI returned fewer leads than input rows. Some rows may have been skipped.`);
    }

    // Validate and enrich the parsed leads
    const validatedLeads: Lead[] = [];
    const warnings: string[] = [];
    
    result.object.leads.forEach((lead, index) => {
      try {
        // Generate unique ID
        const leadWithId = {
          ...lead,
          id: `lead_${Date.now()}_${index}`,
          status: "new" as const,
          customFields: {},
          tags: [],
        };

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lead.email)) {
          warnings.push(`Row ${index + 1}: Invalid email format: ${lead.email}`);
          return; // Skip this lead
        }

        // Ensure required fields
        if (!lead.firstName?.trim() || !lead.lastName?.trim()) {
          warnings.push(`Row ${index + 1}: Missing name`);
          return; // Skip this lead
        }

        if (!lead.company?.trim()) {
          warnings.push(`Row ${index + 1}: Missing company`);
          return; // Skip this lead
        }

        // Normalize URLs
        if (lead.website && !lead.website.startsWith("http")) {
          leadWithId.website = `https://${lead.website}`;
        }
        if (lead.linkedin && !lead.linkedin.startsWith("http")) {
          leadWithId.linkedin = `https://linkedin.com/in/${lead.linkedin}`;
        }

        // Clean text fields
        leadWithId.firstName = lead.firstName.trim();
        leadWithId.lastName = lead.lastName.trim();
        leadWithId.company = lead.company.trim();
        leadWithId.title = lead.title?.trim() || "";
        leadWithId.email = lead.email.toLowerCase().trim();

        // Validate against schema
        const validated = LeadSchema.parse(leadWithId);
        validatedLeads.push(validated);
      } catch (error) {
        warnings.push(`Row ${index + 1}: Validation error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });

    // Calculate quality metrics
    const qualityMetrics = {
      hasValidEmail: validatedLeads.filter(l => l.email).length,
      hasName: validatedLeads.filter(l => l.firstName && l.lastName).length,
      hasCompany: validatedLeads.filter(l => l.company).length,
      hasTitle: validatedLeads.filter(l => l.title).length,
    };

    const processingTime = Date.now() - startTime;

    const response: ParseResponse = {
      leads: validatedLeads,
      totalRows: rows.length,
      validLeads: validatedLeads.length,
      skippedRows: rows.length - validatedLeads.length,
      processingTime,
      qualityMetrics,
      warnings: warnings.slice(0, 10), // Limit warnings
    };

    console.log(`✅ Successfully processed ${validatedLeads.length}/${rows.length} leads in ${processingTime}ms`);
    
    if (validatedLeads.length < rowsToProcess.length) {
      console.log(`ℹ️ Skipped ${rowsToProcess.length - validatedLeads.length} rows due to validation issues`);
      console.log(`ℹ️ Check warnings for details on skipped rows`);
    }

    return NextResponse.json({
      success: true,
      ...response,
    });

  } catch (error) {
    console.error("CSV AI parsing error:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse CSV",
      fallbackRequired: true,
    }, { status: 500 });
  }
}

// GET method returns API info
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/parse-csv-ai",
    description: "AI-powered CSV parser using Vercel AI SDK",
    method: "POST",
    requiredFields: {
      rows: "Array of row objects",
      columns: "Array of column names",
    },
    features: [
      "Intelligent field mapping using GPT-4",
      "Automatic name splitting",
      "Email validation",
      "URL normalization",
      "Data quality metrics",
    ],
  });
}

