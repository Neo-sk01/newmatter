import { NextRequest, NextResponse } from 'next/server';
import { convertToHtml } from '@/lib/email/html-converter';
import { applyPersonalization, buildEverlyticPersonalizationFields, type EmailRecipient } from '@/lib/email/personalization';
import { createEverlyticClient, EverlyticApiError } from '@/lib/email/everlytic-client';

/**
 * Everlytic Transactional Email Sending API Route
 * 
 * This endpoint sends emails using Everlytic's Transactional Email API.
 * Supports both single and batch email sending with personalization.
 * Uses the /transactional/email/v1/mail endpoint for direct email delivery.
 */

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Comprehensive email validation regex
 * Based on RFC 5322 simplified pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Check length constraints
  if (email.length > 254) {
    return false;
  }
  
  // Check format
  if (!EMAIL_REGEX.test(email)) {
    return false;
  }
  
  // Check local part length (before @)
  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) {
    return false;
  }
  
  // Check domain has at least one dot
  if (!domain || !domain.includes('.')) {
    return false;
  }
  
  return true;
}

/**
 * Validate multiple email addresses and return detailed errors
 * @param emails - Array of email addresses to validate
 * @returns Object with validation results
 */
function validateEmails(emails: Array<{ email: string; name?: string }>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (const recipient of emails) {
    if (!isValidEmail(recipient.email)) {
      errors.push(`Invalid email format: "${recipient.email}"${recipient.name ? ` (${recipient.name})` : ''}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

interface SendEmailRequest {
  subject: string;
  body: string;
  // Single recipient (legacy support)
  recipientEmail?: string;
  recipientName?: string;
  // Multiple recipients (new batch support)
  recipients?: EmailRecipient[];
  // Sender configuration
  fromEmail?: string;
  fromName?: string;
  replyEmail?: string;
  replyName?: string;
  // Campaign configuration
  campaignName?: string;
  groupName?: string;
  // Tracking configuration
  trackOpens?: boolean;
  trackLinks?: boolean;
  // Personalization
  personalizationFields?: Record<string, any>;
}

export interface SendEmailResponse {
  success: boolean;
  transactions?: Array<{ id: string; email: string }>;
  recipient?: string;  // Legacy single recipient
  subject?: string;
  error?: string;
  details?: any;
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[${requestId}] Processing email send request`);
    
    const body = await req.json() as SendEmailRequest;
    
    const {
      subject,
      body: emailBody,
      recipientEmail,
      recipientName,
      recipients,
      fromEmail = 'nompilo@memeburn.com',
      fromName = 'Nompilo Gwala - Burn Media Group',
      replyEmail,
      replyName,
      campaignName,
      groupName,
      trackOpens = true,
      trackLinks = true,
      personalizationFields,
    } = body;

    // ========================================================================
    // Validation Phase
    // ========================================================================

    // Validate required fields
    if (!subject || !emailBody) {
      console.error(`[${requestId}] Missing required fields`);
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: {
            subject: !subject ? 'Subject is required' : undefined,
            body: !emailBody ? 'Email body is required' : undefined,
          },
        },
        { status: 400 }
      );
    }

    // Build recipient list (support both single and multiple recipients)
    const recipientList: EmailRecipient[] = recipients ? [...recipients] : [];
    
    // Add legacy single recipient if provided
    if (recipientEmail) {
      recipientList.push({
        email: recipientEmail,
        name: recipientName || recipientEmail,
      });
    }

    // Validate at least one recipient
    if (recipientList.length === 0) {
      console.error(`[${requestId}] No recipients provided`);
      return NextResponse.json(
        { 
          error: 'At least one recipient is required',
          details: 'Provide either recipientEmail or recipients array',
        },
        { status: 400 }
      );
    }

    // Validate all recipient email addresses
    const recipientValidation = validateEmails(recipientList);
    if (!recipientValidation.valid) {
      console.error(`[${requestId}] Invalid recipient emails:`, recipientValidation.errors);
      return NextResponse.json(
        { 
          error: 'Invalid email addresses',
          details: {
            invalidEmails: recipientValidation.errors,
          },
        },
        { status: 400 }
      );
    }

    // Validate sender email
    if (!isValidEmail(fromEmail)) {
      console.error(`[${requestId}] Invalid sender email: ${fromEmail}`);
      return NextResponse.json(
        { 
          error: 'Invalid sender email address',
          details: {
            fromEmail: `"${fromEmail}" is not a valid email format`,
          },
        },
        { status: 400 }
      );
    }

    // Determine and validate reply-to address
    const replyToEmail = replyEmail || fromEmail;
    const replyToName = replyName || fromName;

    if (!isValidEmail(replyToEmail)) {
      console.error(`[${requestId}] Invalid reply-to email: ${replyToEmail}`);
      return NextResponse.json(
        { 
          error: 'Invalid reply-to email address',
          details: {
            replyEmail: `"${replyToEmail}" is not a valid email format`,
          },
        },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Validation passed:`, {
      recipientCount: recipientList.length,
      fromEmail,
      replyToEmail,
    });

    // ========================================================================
    // Configuration Phase
    // ========================================================================

    // Create Everlytic client
    let everlyticClient;
    try {
      everlyticClient = createEverlyticClient();
      console.log(`[${requestId}] Everlytic client created successfully`);
    } catch (error) {
      console.error(`[${requestId}] Everlytic configuration error:`, error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { 
          error: 'Email service configuration error',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: 'Please ensure EVERLYTIC_API_KEY is set in environment variables',
        },
        { status: 500 }
      );
    }

    // ========================================================================
    // Content Preparation Phase
    // ========================================================================

    // Convert plain text to HTML
    const htmlBody = convertToHtml(emailBody, subject);

    // Apply personalization
    const personalizationResult = applyPersonalization(
      htmlBody,
      emailBody,
      recipientList,
      personalizationFields
    );

    // Build Everlytic personalization fields structure
    const personalizationFieldsPayload = buildEverlyticPersonalizationFields(
      personalizationResult.commonFields,
      personalizationResult.uniqueFields
    );

    // Build the transactional email payload
    const payload = {
      body: {
        html: personalizationResult.html,
        text: personalizationResult.text,
        ...personalizationFieldsPayload,
      },
      headers: {
        subject: subject,
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: recipientList.map(r => ({
          email: r.email,
          name: r.name,
        })),
        reply_to: {
          email: replyToEmail,
          name: replyToName,
        },
      },
      options: {
        group_name: groupName || campaignName || 'SalesMatter Outreach',
        track_opens: trackOpens,
        track_links: trackLinks,
      },
    };

    console.log(`[${requestId}] Email payload prepared:`, {
      subject,
      recipientCount: recipientList.length,
      groupName: payload.options.group_name,
      hasPersonalization: !!personalizationFieldsPayload.personalisation_fields,
    });

    // ========================================================================
    // Sending Phase
    // ========================================================================

    try {
      const response = await everlyticClient.sendTransactionalEmail(payload);

      console.log(`[${requestId}] ✅ Email sent successfully`);

      // Map transaction IDs to recipient emails
      const transactions = response.transactions.map((transaction, index) => ({
        id: transaction.id,
        email: recipientList[index]?.email || 'unknown',
      }));

      return NextResponse.json({
        success: true,
        transactions,
        subject,
        // Include legacy fields for backward compatibility
        recipient: recipientList[0]?.email,
      });

    } catch (error) {
      if (error instanceof EverlyticApiError) {
        console.error(`[${requestId}] Everlytic API error:`, error.getLogDetails());
        
        return NextResponse.json(
          {
            success: false,
            error: error.getUserMessage(),
            code: error.code,
            details: error.getLogDetails(),
          },
          { status: error.code }
        );
      }

      // Network or other errors
      console.error(`[${requestId}] Unexpected error during send:`, error);
      throw error; // Re-throw to be caught by outer catch block
    }

  } catch (error) {
    console.error(`[${requestId}] Fatal error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'An unexpected error occurred while processing your request. Please try again.',
      },
      { status: 500 }
    );
  }
}
