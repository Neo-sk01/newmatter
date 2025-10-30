# Design Document

## Overview

This design integrates Everlytic's transactional email API into SalesMatter to enable real email delivery. The integration replaces simulated email sending with actual delivery through Everlytic's REST API, supporting single and batch email sending, engagement tracking, personalization, and campaign grouping. The design builds upon existing API routes (`/api/send-email` and `/api/test-email`) and extends them to support advanced features like batch sending, personalization, and frontend integration.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SalesMatter Frontend                      │
│         (Email Generation UI, Campaign Management)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ POST /api/send-email
                         │ { subject, body, recipients, campaign?, ... }
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Email Sending API Route                         │
│                 (route.ts - Enhanced)                        │
├─────────────────────────────────────────────────────────────┤
│  1. Validate request body                                    │
│  2. Load Everlytic credentials from environment              │
│  3. Convert plain text to HTML                               │
│  4. Apply personalization fields                             │
│  5. Construct Everlytic API payload                          │
│  6. Send via Everlytic transactional API                     │
│  7. Return transaction IDs and status                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ POST with Basic Auth
                         │ Authorization: Basic base64(username:apikey)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Everlytic Transactional API                     │
│     https://api.everlytic.net/transactional/email/v1/mail   │
├─────────────────────────────────────────────────────────────┤
│  • Validates sender domain                                   │
│  • Delivers emails to recipients                             │
│  • Tracks opens and link clicks                              │
│  • Groups emails by campaign                                 │
│  • Returns transaction IDs                                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  Send Email  │────▶│ Everlytic    │────▶│  Recipient   │
│   (User)     │     │  API Route   │     │  API         │     │  Inbox       │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
     │                      │                     │                     │
     │ 1. Request send      │                     │                     │
     │─────────────────────▶│                     │                     │
     │                      │ 2. Validate         │                     │
     │                      │    & prepare        │                     │
     │                      │                     │                     │
     │                      │ 3. POST with auth   │                     │
     │                      │─────────────────────▶│                     │
     │                      │                     │ 4. Deliver email    │
     │                      │                     │─────────────────────▶│
     │                      │                     │                     │
     │                      │ 5. Transaction IDs  │                     │
     │                      │◀─────────────────────│                     │
     │ 6. Success response  │                     │                     │
     │◀─────────────────────│                     │                     │
     │                      │                     │                     │
```

## Components and Interfaces

### 1. Email Sending API Route

**Location:** `src/app/api/send-email/route.ts`

**Purpose:** Handle email sending requests from the frontend and deliver emails via Everlytic.

**Interface:**

```typescript
// Request body
interface SendEmailRequest {
  subject: string;
  body: string;
  recipientEmail?: string;        // Single recipient (legacy)
  recipientName?: string;         // Single recipient name (legacy)
  recipients?: EmailRecipient[];  // Multiple recipients (new)
  fromEmail?: string;
  fromName?: string;
  replyEmail?: string;
  replyName?: string;
  campaignName?: string;
  groupName?: string;
  trackOpens?: boolean;
  trackLinks?: boolean;
  personalizationFields?: Record<string, any>;
}

interface EmailRecipient {
  email: string;
  name: string;
  personalization?: Record<string, string>;
}

// Response body
interface SendEmailResponse {
  success: boolean;
  transactions?: Array<{ id: string; email: string }>;
  recipient?: string;  // Legacy single recipient
  subject?: string;
  error?: string;
  details?: any;
}
```

**Implementation Details:**

1. **Request Validation**
   - Validate required fields: `subject`, `body`, and at least one recipient
   - Validate email format for all recipients
   - Return 400 Bad Request for invalid input

2. **Credential Loading**
   - Load `EVERLYTIC_API_URL`, `EVERLYTIC_USERNAME`, `EVERLYTIC_API_KEY` from environment
   - Return 500 Internal Server Error if credentials are missing
   - Create Basic Auth header: `base64(username:apikey)`

3. **HTML Conversion**
   - Convert plain text body to HTML by wrapping paragraphs in `<p>` tags
   - Create full HTML document with proper DOCTYPE, meta tags, and styling
   - Preserve line breaks and basic formatting
   - Keep plain text version for email clients that don't support HTML

4. **Personalization**
   - Support common fields: `{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{role}}`
   - Apply unique personalization per recipient using Everlytic's `unique_fields`
   - Apply common personalization using Everlytic's `common_fields`
   - Use fallback values for missing personalization data

5. **Everlytic Payload Construction**
   - Build payload according to Everlytic API specification
   - Include HTML and text body
   - Set headers: subject, from, to, reply_to
   - Set options: group_name, track_opens, track_links
   - Support single and multiple recipients

6. **API Request**
   - POST to `https://api.everlytic.net/transactional/email/v1/mail`
   - Include `Authorization: Basic {base64}` header
   - Include `Content-Type: application/json` header
   - Handle network errors and timeouts

7. **Response Handling**
   - Parse Everlytic response (JSON with transaction IDs)
   - Return transaction IDs for successful sends
   - Return descriptive errors for failures (400, 401, 412)
   - Log all requests and responses for debugging

**Enhanced Implementation:**

```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SendEmailRequest;
    
    // Extract and validate fields
    const {
      subject,
      body: emailBody,
      recipientEmail,
      recipientName,
      recipients,
      fromEmail = 'nompilo@mambaonline.com',
      fromName = 'Nompilo Gwala - Burn Media Group',
      replyEmail = 'nompilo@mambaonline.com',
      replyName,
      campaignName,
      groupName,
      trackOpens = true,
      trackLinks = true,
      personalizationFields,
    } = body;

    // Validate required fields
    if (!subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, body' },
        { status: 400 }
      );
    }

    // Build recipient list (support both single and multiple)
    const recipientList: EmailRecipient[] = recipients || [];
    if (recipientEmail) {
      recipientList.push({
        email: recipientEmail,
        name: recipientName || recipientEmail,
      });
    }

    if (recipientList.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      );
    }

    // Load credentials
    const everlyticUsername = process.env.EVERLYTIC_USERNAME || 'administrator';
    const everlyticApiKey = process.env.EVERLYTIC_API_KEY;

    if (!everlyticApiKey) {
      return NextResponse.json(
        { error: 'Everlytic API key not configured' },
        { status: 500 }
      );
    }

    // Create auth header
    const auth = Buffer.from(`${everlyticUsername}:${everlyticApiKey}`).toString('base64');

    // Convert to HTML
    const htmlBody = convertToHtml(emailBody, subject);
    
    // Apply personalization
    const { html, text, uniqueFields } = applyPersonalization(
      htmlBody,
      emailBody,
      recipientList,
      personalizationFields
    );

    // Build payload
    const payload = {
      body: {
        html,
        text,
        ...(uniqueFields && { personalisation_fields: { unique_fields: uniqueFields } }),
      },
      headers: {
        subject,
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: recipientList.map(r => ({
          email: r.email,
          name: r.name,
        })),
        reply_to: {
          email: replyEmail,
          name: replyName || fromName,
        },
      },
      options: {
        group_name: groupName || campaignName || 'SalesMatter Outreach',
        track_opens: trackOpens,
        track_links: trackLinks,
      },
    };

    // Send via Everlytic
    const response = await fetch('https://api.everlytic.net/transactional/email/v1/mail', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: `Failed to send email: ${response.statusText}`, 
          details: responseText,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const responseData = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      transactions: responseData.transactions?.map((t: any, i: number) => ({
        id: t.id,
        email: recipientList[i]?.email,
      })),
      subject,
      response: responseData,
    });

  } catch (error) {
    console.error('Error sending email via Everlytic:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### 2. Email Test API Route

**Location:** `src/app/api/test-email/route.ts`

**Purpose:** Validate Everlytic configuration and test email delivery.

**Interface:**

```typescript
// Request body (optional)
interface TestEmailRequest {
  recipientEmail?: string;
  recipientName?: string;
}

// Response body
interface TestEmailResponse {
  success: boolean;
  message: string;
  details: {
    recipient: string;
    subject: string;
    timestamp: string;
    apiEndpoint: string;
  };
  response?: any;
  error?: string;
}
```

**Implementation Details:**

The test endpoint is already well-implemented. Key features:
- Sends a test email with diagnostic information
- Validates API credentials
- Returns detailed error messages
- Includes GET endpoint with usage instructions

### 3. HTML Conversion Utility

**Location:** `src/lib/email/html-converter.ts` (new file)

**Purpose:** Convert plain text email body to HTML format.

**Interface:**

```typescript
export function convertToHtml(text: string, subject: string): string;
export function stripHtml(html: string): string;
```

**Implementation:**

```typescript
export function convertToHtml(text: string, subject: string): string {
  const htmlBody = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${htmlBody}
</body>
</html>
  `.trim();
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 4. Personalization Utility

**Location:** `src/lib/email/personalization.ts` (new file)

**Purpose:** Apply personalization fields to email content.

**Interface:**

```typescript
export interface PersonalizationResult {
  html: string;
  text: string;
  uniqueFields?: Array<Record<string, Record<string, string>>>;
}

export function applyPersonalization(
  html: string,
  text: string,
  recipients: EmailRecipient[],
  commonFields?: Record<string, any>
): PersonalizationResult;
```

**Implementation:**

```typescript
export function applyPersonalization(
  html: string,
  text: string,
  recipients: EmailRecipient[],
  commonFields?: Record<string, any>
): PersonalizationResult {
  // If no personalization needed, return as-is
  if (!hasPersonalizationTags(html) && !hasPersonalizationTags(text)) {
    return { html, text };
  }

  // Build unique fields for Everlytic
  const uniqueFields = recipients
    .filter(r => r.personalization)
    .map(r => ({
      [r.email]: r.personalization!,
    }));

  // Apply common fields to HTML and text
  let personalizedHtml = html;
  let personalizedText = text;

  if (commonFields) {
    Object.entries(commonFields).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      personalizedHtml = personalizedHtml.replace(regex, String(value));
      personalizedText = personalizedText.replace(regex, String(value));
    });
  }

  return {
    html: personalizedHtml,
    text: personalizedText,
    uniqueFields: uniqueFields.length > 0 ? uniqueFields : undefined,
  };
}

function hasPersonalizationTags(content: string): boolean {
  return /{{[^}]+}}/.test(content);
}
```

### 5. Everlytic Client Utility

**Location:** `src/lib/email/everlytic-client.ts` (new file)

**Purpose:** Centralized Everlytic API client with configuration and error handling.

**Interface:**

```typescript
export interface EverlyticConfig {
  apiUrl: string;
  username: string;
  apiKey: string;
}

export interface EverlyticResponse {
  transactions: Array<{ id: string }>;
}

export interface EverlyticError {
  code: number;
  message: string;
  error: {
    errors: Array<{
      domain: string;
      reason: string;
      message: string;
      locationType: string;
      location: string;
    }>;
  };
}

export class EverlyticClient {
  constructor(config: EverlyticConfig);
  async sendTransactionalEmail(payload: any): Promise<EverlyticResponse>;
  getAuthHeader(): string;
}
```

**Implementation:**

```typescript
export class EverlyticClient {
  private config: EverlyticConfig;

  constructor(config: EverlyticConfig) {
    this.config = config;
  }

  getAuthHeader(): string {
    const credentials = `${this.config.username}:${this.config.apiKey}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  async sendTransactionalEmail(payload: any): Promise<EverlyticResponse> {
    const url = `${this.config.apiUrl}/transactional/email/v1/mail`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData: EverlyticError;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        throw new Error(`Everlytic API error: ${response.statusText}`);
      }

      throw new EverlyticApiError(errorData);
    }

    return JSON.parse(responseText);
  }
}

export class EverlyticApiError extends Error {
  public code: number;
  public details: EverlyticError;

  constructor(error: EverlyticError) {
    super(error.message);
    this.name = 'EverlyticApiError';
    this.code = error.code;
    this.details = error;
  }
}

export function createEverlyticClient(): EverlyticClient {
  const apiUrl = process.env.EVERLYTIC_API_URL || 'https://api.everlytic.net';
  const username = process.env.EVERLYTIC_USERNAME || 'administrator';
  const apiKey = process.env.EVERLYTIC_API_KEY;

  if (!apiKey) {
    throw new Error('EVERLYTIC_API_KEY environment variable is required');
  }

  return new EverlyticClient({ apiUrl, username, apiKey });
}
```

## Data Models

### Email Request Model

```typescript
interface SendEmailRequest {
  // Required fields
  subject: string;
  body: string;

  // Recipient options (at least one required)
  recipientEmail?: string;        // Single recipient (legacy)
  recipientName?: string;         // Single recipient name
  recipients?: EmailRecipient[];  // Multiple recipients

  // Sender options
  fromEmail?: string;             // Default: nompilo@mambaonline.com
  fromName?: string;              // Default: Nompilo Gwala - Burn Media Group
  replyEmail?: string;            // Default: same as fromEmail
  replyName?: string;             // Default: same as fromName

  // Campaign options
  campaignName?: string;          // Campaign identifier
  groupName?: string;             // Everlytic group name (overrides campaignName)

  // Tracking options
  trackOpens?: boolean;           // Default: true
  trackLinks?: boolean;           // Default: true

  // Personalization
  personalizationFields?: Record<string, any>;  // Common fields for all recipients
}

interface EmailRecipient {
  email: string;
  name: string;
  personalization?: Record<string, string>;  // Unique fields per recipient
}
```

### Everlytic API Payload Model

```typescript
interface EverlyticPayload {
  body: {
    html: string;
    text: string;
    personalisation_fields?: {
      common_fields?: Record<string, string>;
      unique_fields?: Array<Record<string, Record<string, string>>>;
    };
  };
  headers: {
    subject: string;
    from: {
      email: string;
      name: string;
    };
    to: Array<{
      email: string;
      name: string;
    }>;
    reply_to: {
      email: string;
      name: string;
    };
  };
  options: {
    group_name: string;
    track_opens: boolean;
    track_links: boolean;
  };
}
```

### Response Models

```typescript
interface SendEmailResponse {
  success: boolean;
  transactions?: Array<{
    id: string;
    email: string;
  }>;
  subject?: string;
  response?: any;
  error?: string;
  details?: any;
  status?: number;
}

interface EverlyticSuccessResponse {
  transactions: Array<{
    id: string;
  }>;
}

interface EverlyticErrorResponse {
  code: number;
  message: string;
  error: {
    errors: Array<{
      domain: string;
      reason: string;
      message: string;
      locationType: string;
      location: string;
    }>;
  };
}
```

## Error Handling

### Error Scenarios

1. **Missing Required Fields**
   - Missing `subject` or `body`
   - No recipients provided
   - Response: 400 Bad Request with descriptive message

2. **Invalid Email Format**
   - Malformed email addresses
   - Response: 400 Bad Request with validation error

3. **Missing API Credentials**
   - `EVERLYTIC_API_KEY` not configured
   - Response: 500 Internal Server Error

4. **Unverified Sender Domain**
   - Everlytic returns 400 with "Unverified Domain" message
   - Response: 400 Bad Request with domain verification instructions

5. **Invalid Authentication**
   - Incorrect API key or username
   - Everlytic returns 401 Unauthorized
   - Response: 401 Unauthorized with credential check instructions

6. **Invalid Request Format**
   - Malformed payload
   - Everlytic returns 412 Precondition Failed
   - Response: 412 Precondition Failed with field-specific errors

7. **Network Errors**
   - Timeout or connection failure
   - Response: 500 Internal Server Error with retry suggestion

### Error Handling Strategy

```typescript
try {
  // Validate request
  if (!subject || !body) {
    return NextResponse.json(
      { error: 'Missing required fields: subject, body' },
      { status: 400 }
    );
  }

  // Send email
  const response = await everlyticClient.sendTransactionalEmail(payload);
  
  return NextResponse.json({
    success: true,
    transactions: response.transactions,
  });

} catch (error) {
  if (error instanceof EverlyticApiError) {
    // Handle Everlytic-specific errors
    const status = error.code;
    const message = error.details.message;
    
    return NextResponse.json(
      {
        error: message,
        details: error.details,
        status,
      },
      { status }
    );
  }

  // Handle generic errors
  console.error('Email sending error:', error);
  return NextResponse.json(
    {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    },
    { status: 500 }
  );
}
```

## Testing Strategy

### Unit Tests

**Test File:** `src/lib/email/html-converter.test.ts`

1. **HTML Conversion Tests**
   - Verify plain text converts to HTML with `<p>` tags
   - Verify HTML escaping for special characters
   - Verify full HTML document structure
   - Verify empty lines are filtered

**Test File:** `src/lib/email/personalization.test.ts`

1. **Personalization Tests**
   - Verify common fields are replaced in HTML and text
   - Verify unique fields are structured correctly for Everlytic
   - Verify missing personalization data doesn't break rendering
   - Verify personalization tags are detected correctly

**Test File:** `src/lib/email/everlytic-client.test.ts`

1. **Client Tests**
   - Verify auth header is generated correctly
   - Verify payload construction
   - Verify error parsing
   - Verify configuration loading

### Integration Tests

**Test File:** `tests/integration/email-sending.test.ts`

1. **Single Email Tests**
   - Send email to single recipient
   - Verify transaction ID is returned
   - Verify email is delivered

2. **Batch Email Tests**
   - Send email to multiple recipients
   - Verify all transaction IDs are returned
   - Verify personalization per recipient

3. **Error Handling Tests**
   - Test with invalid credentials
   - Test with unverified domain
   - Test with malformed payload
   - Verify appropriate error responses

### Manual Testing Checklist

1. **Configuration Tests**
   - [ ] Environment variables are loaded correctly
   - [ ] Missing API key returns appropriate error
   - [ ] Test endpoint validates configuration

2. **Single Email Tests**
   - [ ] Send email to single recipient
   - [ ] Email is delivered to inbox
   - [ ] HTML formatting is correct
   - [ ] Plain text version is included

3. **Batch Email Tests**
   - [ ] Send email to multiple recipients
   - [ ] All recipients receive email
   - [ ] Personalization is applied correctly per recipient

4. **Tracking Tests**
   - [ ] Open tracking works in Everlytic dashboard
   - [ ] Link tracking works in Everlytic dashboard
   - [ ] Emails are grouped by campaign

5. **Error Handling Tests**
   - [ ] Invalid email format returns 400
   - [ ] Missing credentials returns 500
   - [ ] Unverified domain returns descriptive error

## Implementation Notes

### Environment Variables

Required in `.env.local`:

```bash
EVERLYTIC_API_URL=https://api.everlytic.net
EVERLYTIC_USERNAME=administrator
EVERLYTIC_API_KEY=hqBBItQVBTcfr1JFJB36rewqubwEUQlV_2
```

### Sender Domain Verification

Before sending emails, the sender domain must be verified with Everlytic:

1. Log in to Everlytic dashboard
2. Navigate to Settings → Domains
3. Add domain (e.g., `mambaonline.com`)
4. Complete DNS verification (SPF, DKIM records)
5. Wait for verification to complete

### Default Sender Configuration

Default sender: `nompilo@mambaonline.com` (Nompilo Gwala - Burn Media Group)

This can be overridden per request by providing `fromEmail` and `fromName` in the request body.

### Campaign Grouping

Emails are grouped in Everlytic by the `group_name` field. This allows viewing engagement reports organized by campaign.

Priority order:
1. `groupName` (if provided)
2. `campaignName` (if provided)
3. Default: "SalesMatter Outreach"

### Personalization Tags

Supported tags:
- `{{firstName}}` - Recipient's first name
- `{{lastName}}` - Recipient's last name
- `{{company}}` - Recipient's company name
- `{{role}}` - Recipient's job title
- Custom tags can be added via `personalizationFields`

### Rate Limiting

Everlytic may have rate limits. Consider implementing:
- Request queuing for large batches
- Retry logic with exponential backoff
- Rate limit monitoring and alerts

### Performance Considerations

1. **Batch Sending**
   - Everlytic supports multiple recipients in a single request
   - More efficient than individual requests
   - Recommended for campaigns with 10+ recipients

2. **HTML Conversion**
   - Conversion is lightweight (string operations)
   - No significant performance impact
   - Can be cached if same body is sent multiple times

3. **Response Time**
   - Everlytic API typically responds in 1-3 seconds
   - Network latency may add 100-500ms
   - Total request time: 1-4 seconds

### Security Considerations

1. **API Key Protection**
   - Never expose API key in client-side code
   - Store in environment variables only
   - Rotate keys periodically

2. **Email Validation**
   - Validate email format before sending
   - Prevent email injection attacks
   - Sanitize all user input

3. **Rate Limiting**
   - Implement rate limiting on API routes
   - Prevent abuse and spam
   - Monitor for unusual activity

### Future Enhancements

1. **Email Templates**
   - Store templates in Supabase
   - Reference template IDs in Everlytic
   - Support template variables

2. **Scheduling**
   - Queue emails for future delivery
   - Support time zone-based scheduling
   - Implement retry logic for failures

3. **Analytics Integration**
   - Sync Everlytic engagement data to Supabase
   - Display open/click rates in SalesMatter UI
   - Track campaign performance over time

4. **Attachment Support**
   - Support file attachments
   - Track attachment opens
   - Validate file types and sizes

5. **Unsubscribe Management**
   - Implement unsubscribe links
   - Sync unsubscribe list with Supabase
   - Respect unsubscribe preferences

6. **A/B Testing**
   - Support multiple email variants
   - Track performance by variant
   - Automatic winner selection
