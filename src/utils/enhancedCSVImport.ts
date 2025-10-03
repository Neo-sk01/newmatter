import Papa from 'papaparse';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  title: string;
  website?: string;
  linkedin?: string;
  phone?: string;
  location?: string;
  industry?: string;
  status: 'new' | 'enriched' | 'generated';
  customFields?: Record<string, unknown>;
  tags?: string[];
}

export interface ImportResult {
  success: boolean;
  leads: Lead[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
  errors: Array<{
    row: number;
    field: string;
    value: unknown;
    error: string;
  }>;
  dataQuality: {
    emailValidation: {
      valid: number;
      invalid: number;
      missing: number;
    };
    completeness: {
      hasName: number;
      hasCompany: number;
      hasContact: number;
    };
    duplicates: number;
  };
  suggestions: string[];
  processingTime: number;
}

export async function enhancedCSVImport(file: File): Promise<ImportResult> {
  if (!file?.name?.toLowerCase().endsWith('.csv')) {
    throw new Error('Please upload a file with a .csv extension.');
  }

  try {
    // 1) Parse CSV on the client
    const parsed = await new Promise<Papa.ParseResult<Record<string, unknown>>>((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => String(h || "").trim(),
        complete: (res: Papa.ParseResult<Record<string, unknown>>) => resolve(res),
        error: (err: unknown) => reject(err),
      });
    });

    const rows = (parsed.data || []).filter((r) => r && Object.keys(r).length > 0);
    const columns = (parsed.meta.fields || []).filter(Boolean) as string[];

    if (!rows.length || !columns.length) {
      throw new Error('The CSV file appears empty or is missing a header row.');
    }

    // 2) Use the enhanced parsing API
    const response = await fetch("/api/parse-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        columns,
        rows,
        options: {
          skipEmptyRows: true,
          validateEmails: true,
          detectDuplicates: true,
          maxRows: 10000,
        }
      }),
    });

    if (!response.ok) {
      // Fallback to original API if enhanced one fails
      console.warn('Enhanced CSV parsing failed, falling back to original API');
      return await fallbackCSVImport(columns, rows);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to parse CSV with enhanced API');
    }

    // Convert to Lead format
    const leads: Lead[] = result.leads.map((lead: Record<string, unknown>, index: number) => ({
      id: `${Date.now()}-${index}`,
      firstName: (lead.firstName as string) || "",
      lastName: (lead.lastName as string) || "",
      company: (lead.company as string) || "",
      email: ((lead.email as string) || "").toLowerCase(),
      title: (lead.title as string) || "",
      website: (lead.website as string) || undefined,
      linkedin: (lead.linkedin as string) || undefined,
      phone: (lead.phone as string) || undefined,
      location: (lead.location as string) || undefined,
      industry: (lead.industry as string) || undefined,
      status: "new" as const,
      customFields: (lead.customFields as Record<string, unknown>) || {},
      tags: (lead.tags as string[]) || [],
    }));

    return {
      success: true,
      leads,
      totalRows: result.totalRows,
      validRows: result.validRows,
      skippedRows: result.skippedRows,
      errors: result.errors,
      dataQuality: result.dataQuality,
      suggestions: result.suggestions,
      processingTime: result.processingTime,
    };

  } catch (error) {
    console.error('Enhanced CSV import failed:', error);
    throw error;
  }
}

// Fallback function using the original API
async function fallbackCSVImport(columns: string[], rows: Record<string, unknown>[]): Promise<ImportResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch("/api/map-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns, rows: rows.slice(0, 25) }),
    });

    let headerMapping: Record<string, string> | null = null;
    let rules: { splitFullName?: { column: string; firstNameFirst?: boolean } } | undefined = undefined;

    if (response.ok) {
      const data = await response.json();
      headerMapping = data?.headerMapping ?? null;
      rules = data?.rules;
    }

    if (!headerMapping) {
      console.warn("Using heuristic header mapping");
      headerMapping = guessHeaderMapping(columns);
    }

    // Apply mapping to all rows
    const leads: Lead[] = [];
    const errors: Array<{ row: number; field: string; value: unknown; error: string }> = [];
    const emailStats = { valid: 0, invalid: 0, missing: 0 };
    const completenessStats = { hasName: 0, hasCompany: 0, hasContact: 0 };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const normalized = applyMapping(row, headerMapping, rules);
      
      const hasAny = Boolean(
        normalized.email ||
        normalized.linkedin ||
        normalized.company ||
        normalized.firstName ||
        normalized.lastName
      );
      
      if (!hasAny) continue;

      const lead: Lead = {
        id: `${Date.now()}-${i}`,
        firstName: normalized.firstName || "",
        lastName: normalized.lastName || "",
        company: normalized.company || "",
        email: (normalized.email || "").toLowerCase(),
        title: normalized.title || "",
        website: normalized.website || undefined,
        linkedin: normalized.linkedin || undefined,
        status: "new" as const,
      };

      // Email validation
      if (lead.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(lead.email)) {
          emailStats.valid++;
        } else {
          emailStats.invalid++;
          errors.push({
            row: i + 1,
            field: "email",
            value: lead.email,
            error: "Invalid email format"
          });
          lead.email = "";
        }
      } else {
        emailStats.missing++;
      }

      // Completeness tracking
      if (lead.firstName || lead.lastName) completenessStats.hasName++;
      if (lead.company) completenessStats.hasCompany++;
      if (lead.email) completenessStats.hasContact++;

      leads.push(lead);
    }

    return {
      success: true,
      leads,
      totalRows: rows.length,
      validRows: leads.length,
      skippedRows: rows.length - leads.length,
      errors,
      dataQuality: {
        emailValidation: emailStats,
        completeness: completenessStats,
        duplicates: 0,
      },
      suggestions: ["Consider using the enhanced CSV parser for better results"],
      processingTime: Date.now() - startTime,
    };

  } catch (error) {
    throw new Error(`Fallback CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions (simplified versions of what's in the main app)
function guessHeaderMapping(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const col of columns) {
    const lower = col.toLowerCase();
    
    if (lower.includes('first') && lower.includes('name')) {
      mapping[col] = 'firstName';
    } else if (lower.includes('last') && lower.includes('name')) {
      mapping[col] = 'lastName';
    } else if (lower.includes('email')) {
      mapping[col] = 'email';
    } else if (lower.includes('company')) {
      mapping[col] = 'company';
    } else if (lower.includes('title') || lower.includes('position')) {
      mapping[col] = 'title';
    } else if (lower.includes('website')) {
      mapping[col] = 'website';
    } else if (lower.includes('linkedin')) {
      mapping[col] = 'linkedin';
    } else {
      mapping[col] = 'ignore';
    }
  }
  
  return mapping;
}

function applyMapping(
  row: Record<string, unknown>,
  mapping: Record<string, string>,
  rules?: { splitFullName?: { column: string; firstNameFirst?: boolean } }
): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [originalCol, targetField] of Object.entries(mapping)) {
    if (targetField === 'ignore') continue;
    
    const value = row[originalCol];
    if (value && typeof value === 'string') {
      result[targetField] = value.trim();
    }
  }
  
  // Handle full name splitting
  if (rules?.splitFullName) {
    const fullName = row[rules.splitFullName.column];
    if (fullName && typeof fullName === 'string') {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        result.firstName = parts[0];
        result.lastName = parts.slice(1).join(' ');
      } else if (parts.length === 1) {
        result.firstName = parts[0];
      }
    }
  }
  
  return result;
}
