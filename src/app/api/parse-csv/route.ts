import { NextRequest } from "next/server";
import { z } from "zod";
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
// Enhanced lead schema with more validation
const LeadSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1).optional().default(""),
  lastName: z.string().min(1).optional().default(""),
  fullName: z.string().optional(),
  company: z.string().min(1).optional().default(""),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  twitter: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  revenue: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  customFields: z.record(z.string(), z.any()).optional().default({}),
});

// Comprehensive field mapping options
const canonicalFieldValues = [
  "firstName",
  "lastName",
  "fullName",
  "company",
  "email",
  "phone",
  "title",
  "department",
  "website",
  "linkedin",
  "twitter",
  "location",
  "industry",
  "companySize",
  "revenue",
  "notes",
  "source",
  "tags",
  "customField",
  "ignore",
] as const;

const CanonicalField = z.enum(canonicalFieldValues);
type CanonicalFieldValue = z.infer<typeof CanonicalField>;

const normalizeAliasKey = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const canonicalFieldAliasMap: Record<string, CanonicalFieldValue> = {
  firstname: "firstName",
  fname: "firstName",
  givenname: "firstName",
  lastname: "lastName",
  lname: "lastName",
  surname: "lastName",
  name: "fullName",
  fullname: "fullName",
  companyname: "company",
  organisation: "company",
  organization: "company",
  employer: "company",
  business: "company",
  emailaddress: "email",
  emailid: "email",
  mail: "email",
  phonenumber: "phone",
  telephone: "phone",
  mobilenumber: "phone",
  jobtitle: "title",
  position: "title",
  role: "title",
  departmentname: "department",
  division: "department",
  team: "department",
  websiteurl: "website",
  webpage: "website",
  url: "website",
  linkedinurl: "linkedin",
  linkedinprofile: "linkedin",
  linkedinhandle: "linkedin",
  twitterhandle: "twitter",
  twitterurl: "twitter",
  twitterprofile: "twitter",
  city: "location",
  state: "location",
  province: "location",
  region: "location",
  country: "location",
  zipcode: "location",
  postalcode: "location",
  address: "location",
  geography: "location",
  industryvertical: "industry",
  vertical: "industry",
  sector: "industry",
  employees: "companySize",
  headcount: "companySize",
  size: "companySize",
  revenueusd: "revenue",
  annualrevenue: "revenue",
  sales: "revenue",
  comment: "notes",
  comments: "notes",
  remark: "notes",
  leadsource: "source",
  sourceoflead: "source",
  campaign: "source",
  tag: "tags",
  taglist: "tags",
  labels: "tags",
  custom: "customField",
  customfield: "customField",
  customfields: "customField",
  skip: "ignore",
  ignorefield: "ignore",
};

const CanonicalFieldSchema = z
  .string()
  .transform<CanonicalFieldValue>((value, ctx) => {
    const trimmed = value.trim();
    if (!trimmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mapping value cannot be empty",
      });
      return z.NEVER;
    }

    const directMatch = canonicalFieldValues.find(
      (field) => field.toLowerCase() === trimmed.toLowerCase()
    );

    if (directMatch) {
      return directMatch;
    }

    const aliasMatch = canonicalFieldAliasMap[normalizeAliasKey(trimmed)];
    if (aliasMatch) {
      return aliasMatch;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.invalid_enum_value,
      options: canonicalFieldValues,
      received: trimmed,
      message: `Unsupported field mapping: ${trimmed}`,
    });
    return z.NEVER;
  });

// Enhanced response schema with more metadata
const ParseResponseSchema = z.object({
  success: z.boolean(),
  totalRows: z.number(),
  validRows: z.number(),
  skippedRows: z.number(),
  headerMapping: z.record(z.string(), CanonicalField),
  dataQuality: z.object({
    emailValidation: z.object({
      valid: z.number(),
      invalid: z.number(),
      missing: z.number(),
    }),
    completeness: z.object({
      hasName: z.number(),
      hasCompany: z.number(),
      hasContact: z.number(), // email or phone
    }),
    duplicates: z.number(),
  }),
  leads: z.array(LeadSchema),
  errors: z.array(z.object({
    row: z.number(),
    field: z.string(),
    value: z.any(),
    error: z.string(),
  })),
  suggestions: z.array(z.string()),
  customFields: z.array(z.string()),
  processingTime: z.number(),
});

const RequestSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.any())),
  options: z.object({
    skipEmptyRows: z.boolean().default(true),
    validateEmails: z.boolean().default(true),
    detectDuplicates: z.boolean().default(true),
    maxRows: z.number().default(10000),
    customFieldPrefix: z.string().default("custom_"),
  }).optional().default(() => ({
    skipEmptyRows: true,
    validateEmails: true,
    detectDuplicates: true,
    maxRows: 10000,
    customFieldPrefix: "custom_",
  })),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid request payload",
        details: parsed.error.issues,
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { columns, rows, options } = parsed.data;
    
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not configured, using fallback mapping");
      // Return a response that indicates fallback should be used
      return new Response(JSON.stringify({
        success: false,
        error: "AI service not configured",
        fallbackRequired: true,
      }), { 
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Limit sample size for AI analysis
    const sampleRows = rows.slice(0, Math.min(50, rows.length));
    
    // Step 1: Use AI to intelligently map columns
    const mappingPrompt = `Analyze this CSV data and create an intelligent mapping of columns to lead fields.

Available target fields: ${CanonicalField.options.join(", ")}

CSV Columns: ${JSON.stringify(columns)}
Sample Data (first few rows): ${JSON.stringify(sampleRows.slice(0, 5))}

Instructions:
1. Map each column to the most appropriate target field
2. Use "customField" for columns that don't fit standard fields
3. Use "ignore" for irrelevant columns (like IDs, timestamps, etc.)
4. Consider variations in naming (e.g., "First Name", "fname", "first_name" all map to "firstName")
5. Look at actual data values to make better decisions
6. Identify potential data quality issues

Return a JSON object with:
- headerMapping: object mapping each column to a target field
- confidence: number 0-1 indicating mapping confidence
- suggestions: array of strings with improvement suggestions
- customFields: array of column names that should be custom fields`;

    let mappingResult;
    try {
      mappingResult = await generateObject({
        model: openai("gpt-4o-mini"),
        prompt: mappingPrompt,
        schema: z.object({
          headerMapping: z.record(z.string(), CanonicalFieldSchema),
          confidence: z.number().min(0).max(1),
          suggestions: z.array(z.string()),
          customFields: z.array(z.string()),
        }),
        temperature: 0.1,
      });
    } catch (aiError) {
      console.error("AI mapping failed:", aiError);
      // Return a response that indicates fallback should be used
      return new Response(JSON.stringify({
        success: false,
        error: "AI mapping failed",
        fallbackRequired: true,
        details: aiError instanceof Error ? aiError.message : "Unknown error",
      }), { 
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Step 2: Process all rows with the AI-generated mapping
    const processedLeads: any[] = [];
    const errors: any[] = [];
    const seenEmails = new Set<string>();
    let duplicates = 0;
    let emailStats = { valid: 0, invalid: 0, missing: 0 };
    let completenessStats = { hasName: 0, hasCompany: 0, hasContact: 0 };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const lead: any = {
          id: `lead_${Date.now()}_${i}`,
          customFields: {},
          tags: [],
        };

        // Apply mapping
        for (const [originalColumn, targetField] of Object.entries(mappingResult.object.headerMapping)) {
          const value = row[originalColumn];
          
          if (!value || value === "" || targetField === "ignore") continue;
          
          if (targetField === "customField") {
            lead.customFields[originalColumn] = value;
          } else if (targetField === "tags" && typeof value === "string") {
            lead.tags = value.split(",").map((tag: string) => tag.trim()).filter(Boolean);
          } else {
            lead[targetField] = typeof value === "string" ? value.trim() : value;
          }
        }

        // Handle full name splitting
        if (lead.fullName && !lead.firstName && !lead.lastName) {
          const nameParts = lead.fullName.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            lead.firstName = nameParts[0];
            lead.lastName = nameParts.slice(1).join(" ");
          } else if (nameParts.length === 1) {
            lead.firstName = nameParts[0];
          }
        }

        // Email validation
        if (lead.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(lead.email)) {
            lead.email = lead.email.toLowerCase();
            emailStats.valid++;
            
            // Duplicate detection
            if (options.detectDuplicates && seenEmails.has(lead.email)) {
              duplicates++;
              continue; // Skip duplicate
            }
            seenEmails.add(lead.email);
          } else {
            emailStats.invalid++;
            errors.push({
              row: i + 1,
              field: "email",
              value: lead.email,
              error: "Invalid email format"
            });
            lead.email = ""; // Clear invalid email
          }
        } else {
          emailStats.missing++;
        }

        // Completeness tracking
        if (lead.firstName || lead.lastName || lead.fullName) completenessStats.hasName++;
        if (lead.company) completenessStats.hasCompany++;
        if (lead.email || lead.phone) completenessStats.hasContact++;

        // URL validation and normalization
        if (lead.website && !lead.website.startsWith("http")) {
          lead.website = `https://${lead.website}`;
        }
        if (lead.linkedin && !lead.linkedin.startsWith("http")) {
          lead.linkedin = `https://linkedin.com/in/${lead.linkedin}`;
        }

        // Skip empty rows if option is set
        if (options.skipEmptyRows) {
          const hasData = Object.values(lead).some(value => 
            value && value !== "" && 
            (typeof value !== "object" || Object.keys(value).length > 0)
          );
          if (!hasData) continue;
        }

        // Validate against schema
        const validatedLead = LeadSchema.safeParse(lead);
        if (validatedLead.success) {
          processedLeads.push(validatedLead.data);
        } else {
          errors.push({
            row: i + 1,
            field: "validation",
            value: lead,
            error: validatedLead.error.message
          });
        }

      } catch (error) {
        errors.push({
          row: i + 1,
          field: "processing",
          value: row,
          error: error instanceof Error ? error.message : "Unknown processing error"
        });
      }
    }

    // Step 3: Generate additional insights using AI
    const insightsPrompt = `Analyze this processed lead data and provide insights:

Total Rows: ${rows.length}
Valid Leads: ${processedLeads.length}
Errors: ${errors.length}
Email Stats: ${JSON.stringify(emailStats)}
Completeness: ${JSON.stringify(completenessStats)}

Sample processed leads: ${JSON.stringify(processedLeads.slice(0, 3))}

Provide suggestions for:
1. Data quality improvements
2. Missing information patterns
3. Potential enrichment opportunities
4. Best practices for this dataset`;

    let insightsText = "";
    try {
      const insights = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: insightsPrompt,
        temperature: 0.3,
        maxRetries: 2,
      });
      insightsText = insights.text;
    } catch (insightsError) {
      console.warn("Failed to generate insights:", insightsError);
      insightsText = "Analysis complete. Consider reviewing data quality metrics above.";
    }

    const processingTime = Date.now() - startTime;

    const response: z.infer<typeof ParseResponseSchema> = {
      success: true,
      totalRows: rows.length,
      validRows: processedLeads.length,
      skippedRows: rows.length - processedLeads.length,
      headerMapping: mappingResult.object.headerMapping,
      dataQuality: {
        emailValidation: emailStats,
        completeness: completenessStats,
        duplicates,
      },
      leads: processedLeads,
      errors: errors.slice(0, 100), // Limit errors to prevent huge responses
      suggestions: [
        ...mappingResult.object.suggestions,
        ...insightsText.split('\n').filter((line: string) => line.trim().startsWith('-')).map((line: string) => line.trim().substring(1).trim()),
      ],
      customFields: mappingResult.object.customFields,
      processingTime,
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("/api/parse-csv error:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to parse CSV",
      details: error instanceof Error ? error.message : "Unknown error",
      processingTime: Date.now() - startTime,
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
