/**
 * Heuristic header mapping for CSV imports when AI parsing is unavailable
 */

type CanonicalField = 
  | "firstName"
  | "lastName"
  | "fullName"
  | "company"
  | "email"
  | "phone"
  | "title"
  | "department"
  | "website"
  | "linkedin"
  | "twitter"
  | "location"
  | "industry"
  | "companySize"
  | "revenue"
  | "notes"
  | "source"
  | "tags"
  | "customField"
  | "ignore";

const FIELD_ALIASES: Record<string, CanonicalField> = {
  // First Name
  firstname: "firstName",
  fname: "firstName",
  givenname: "firstName",
  first: "firstName",
  
  // Last Name
  lastname: "lastName",
  lname: "lastName",
  surname: "lastName",
  last: "lastName",
  familyname: "lastName",
  
  // Full Name
  name: "fullName",
  fullname: "fullName",
  contactname: "fullName",
  
  // Company
  company: "company",
  companyname: "company",
  organisation: "company",
  organization: "company",
  employer: "company",
  business: "company",
  firm: "company",
  
  // Email
  email: "email",
  emailaddress: "email",
  emailid: "email",
  mail: "email",
  
  // Phone
  phone: "phone",
  phonenumber: "phone",
  telephone: "phone",
  mobile: "phone",
  mobilenumber: "phone",
  tel: "phone",
  
  // Title
  title: "title",
  jobtitle: "title",
  position: "title",
  role: "title",
  designation: "title",
  
  // Department
  department: "department",
  dept: "department",
  departmentname: "department",
  division: "department",
  team: "department",
  
  // Website
  website: "website",
  websiteurl: "website",
  webpage: "website",
  url: "website",
  site: "website",
  
  // LinkedIn
  linkedin: "linkedin",
  linkedinurl: "linkedin",
  linkedinprofile: "linkedin",
  linkedinhandle: "linkedin",
  li: "linkedin",
  
  // Twitter
  twitter: "twitter",
  twitterhandle: "twitter",
  twitterurl: "twitter",
  twitterprofile: "twitter",
  
  // Location
  location: "location",
  city: "location",
  state: "location",
  province: "location",
  region: "location",
  country: "location",
  address: "location",
  geography: "location",
  
  // Industry
  industry: "industry",
  industryvertical: "industry",
  vertical: "industry",
  sector: "industry",
  
  // Company Size
  companysize: "companySize",
  employees: "companySize",
  headcount: "companySize",
  size: "companySize",
  employeecount: "companySize",
  
  // Revenue
  revenue: "revenue",
  revenueusd: "revenue",
  annualrevenue: "revenue",
  sales: "revenue",
  
  // Notes
  notes: "notes",
  note: "notes",
  comment: "notes",
  comments: "notes",
  remark: "notes",
  remarks: "notes",
  description: "notes",
  
  // Source
  source: "source",
  leadsource: "source",
  sourceoflead: "source",
  campaign: "source",
  origin: "source",
  
  // Tags
  tags: "tags",
  tag: "tags",
  taglist: "tags",
  labels: "tags",
  label: "tags",
  categories: "tags",
  
  // Ignore
  id: "ignore",
  leadid: "ignore",
  recordid: "ignore",
  uid: "ignore",
  uuid: "ignore",
  timestamp: "ignore",
  createdat: "ignore",
  updatedat: "ignore",
  modifiedat: "ignore",
  deleted: "ignore",
  status: "ignore",
};

function normalizeHeaderKey(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Attempts to guess the canonical field mapping for CSV headers
 * Returns a Record mapping original column names to canonical field names
 */
export function guessHeaderMapping(
  columns: string[],
  rows?: Record<string, unknown>[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const column of columns) {
    const normalized = normalizeHeaderKey(column);
    
    // Try direct match first
    if (FIELD_ALIASES[normalized]) {
      mapping[column] = FIELD_ALIASES[normalized];
      continue;
    }
    
    // Check if it contains a known keyword
    let matched = false;
    for (const [alias, canonical] of Object.entries(FIELD_ALIASES)) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        mapping[column] = canonical;
        matched = true;
        break;
      }
    }
    
    // If still not matched, check data samples to make better guesses
    if (!matched && rows && rows.length > 0) {
      const sampleValues = rows.slice(0, 5).map(row => row[column]);
      
      // Check if it looks like an email
      if (sampleValues.some(val => 
        typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      )) {
        mapping[column] = "email";
        continue;
      }
      
      // Check if it looks like a URL
      if (sampleValues.some(val => 
        typeof val === 'string' && /^https?:\/\//i.test(val)
      )) {
        if (normalized.includes('linkedin') || normalized.includes('li')) {
          mapping[column] = "linkedin";
        } else {
          mapping[column] = "website";
        }
        continue;
      }
      
      // Check if it looks like a phone number
      if (sampleValues.some(val => 
        typeof val === 'string' && /^[\d\s\-\+\(\)]{10,}$/.test(val)
      )) {
        mapping[column] = "phone";
        continue;
      }
    }
    
    // Default to customField for unknown columns
    if (!mapping[column]) {
      mapping[column] = "customField";
    }
  }
  
  return mapping;
}

