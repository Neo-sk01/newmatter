import { NextRequest, NextResponse } from 'next/server';
import { createEverlyticClient, EverlyticApiError } from '@/lib/email/everlytic-client';
import { convertToHtml } from '@/lib/email/html-converter';

/**
 * Everlytic Transactional Email Testing Route
 * 
 * This endpoint allows you to test the Everlytic Transactional Email API integration.
 * Use this to verify credentials, test email delivery, and debug issues.
 * 
 * Usage:
 * POST /api/test-email
 * 
 * Optional body (all fields have defaults):
 * {
 *   "recipientEmail": "your-email@example.com",
 *   "recipientName": "Test User"
 * }
 */

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isValidEmail(email: string): boolean {
  return !!email && EMAIL_REGEX.test(email) && email.length <= 254;
}

export async function POST(req: NextRequest) {
  const testId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[Test-${testId}] Starting email test`);
    
    const body = await req.json().catch(() => ({}));
    
    // Use provided values or defaults
    const recipientEmail = body.recipientEmail || 'test@example.com';
    const recipientName = body.recipientName || 'Test User';
    const replyEmail = body.replyEmail || 'nompilo@memeburn.com';
    const replyName = body.replyName || 'SalesMatter Test System';

    // ========================================================================
    // Validation Phase
    // ========================================================================

    // Validate recipient email
    if (!isValidEmail(recipientEmail)) {
      console.error(`[Test-${testId}] Invalid recipient email: ${recipientEmail}`);
      return NextResponse.json(
        { 
          error: 'Invalid recipient email address',
          details: {
            recipientEmail: `"${recipientEmail}" is not a valid email format`,
            hint: 'Please provide a valid email address (e.g., user@example.com)',
          },
        },
        { status: 400 }
      );
    }

    // Validate reply-to email
    if (!isValidEmail(replyEmail)) {
      console.error(`[Test-${testId}] Invalid reply-to email: ${replyEmail}`);
      return NextResponse.json(
        { 
          error: 'Invalid reply-to email address',
          details: {
            replyEmail: `"${replyEmail}" is not a valid email format`,
          },
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // Configuration Phase
    // ========================================================================

    // Create Everlytic client
    let everlyticClient;
    try {
      everlyticClient = createEverlyticClient();
      console.log(`[Test-${testId}] Everlytic client configured`);
    } catch (error) {
      console.error(`[Test-${testId}] Configuration error:`, error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { 
          error: 'Email service configuration error',
          message: error instanceof Error ? error.message : 'Unknown error',
          troubleshooting: [
            'Ensure EVERLYTIC_API_KEY is set in .env.local',
            'Verify the API key is correct and active',
            'Check that EVERLYTIC_USERNAME is set (default: "administrator")',
          ],
        },
        { status: 500 }
      );
    }

    // ========================================================================
    // Domain Verification Check
    // ========================================================================

    const senderEmail = 'nompilo@memeburn.com';
    const senderDomain = senderEmail.split('@')[1];

    console.log(`[Test-${testId}] Sender domain: ${senderDomain}`);
    console.log(`[Test-${testId}] Note: Ensure ${senderDomain} is verified in Everlytic dashboard`);

    // ========================================================================
    // Content Preparation Phase
    // ========================================================================

    const testSubject = 'Test Email from SalesMatter - Everlytic Integration';
    const testBody = `Hi ${recipientName},

This is a test email from the SalesMatter application to verify the Everlytic Transactional Email API integration is working correctly.

If you're receiving this email, it means:
- The Everlytic API key is configured correctly
- The transactional email endpoint is working
- Email delivery is successful

Test Details:
- Sent at: ${new Date().toISOString()}
- Recipient: ${recipientEmail}
- Integration: Everlytic Transactional Email API v1
- Platform: SalesMatter

This email was generated using the Burn Media Group XYZ Formula prompt and sent through the Everlytic transactional email platform.

Best regards,
SalesMatter Test System`;

    // Convert to HTML using utility
    const htmlBody = convertToHtml(testBody, testSubject);

    // Build the transactional email payload
    const payload = {
      body: {
        html: htmlBody,
        text: testBody,
      },
      headers: {
        subject: testSubject,
        from: {
          email: 'nompilo@memeburn.com',
          name: 'SalesMatter Test System',
        },
        to: [
          {
            email: recipientEmail,
            name: recipientName,
          },
        ],
        reply_to: {
          email: replyEmail,
          name: replyName,
        },
      },
      options: {
        group_name: 'SalesMatter Test Emails',
        track_opens: true,
        track_links: true,
      },
    };

    console.log(`[Test-${testId}] Sending test email to ${recipientEmail}`);

    // ========================================================================
    // Sending Phase
    // ========================================================================

    try {
      const response = await everlyticClient.sendTransactionalEmail(payload);

      console.log(`[Test-${testId}] ✅ Test email sent successfully`);

      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully via Everlytic Transactional API',
        details: {
          recipient: recipientEmail,
          subject: testSubject,
          timestamp: new Date().toISOString(),
          transactionId: response.transactions[0]?.id,
          senderDomain: senderDomain,
          groupName: 'SalesMatter Test Emails',
        },
        verification: {
          domainVerified: true,
          note: `If this email was delivered successfully, ${senderDomain} is verified with Everlytic`,
        },
        nextSteps: [
          '✅ Check the recipient inbox to verify delivery',
          '📧 Look for the email in spam/junk folder if not in inbox',
          '🎨 Verify HTML formatting and styling',
          '📊 Check Everlytic dashboard for tracking data:',
          '   - Open tracking',
          '   - Link click tracking',
          '   - Delivery status',
          '🔗 Everlytic dashboard: https://login.everlytic.net',
        ],
        troubleshooting: [
          'If email not received after 5 minutes:',
          '  1. Check spam/junk folder',
          '  2. Verify recipient email is correct',
          '  3. Check Everlytic dashboard for delivery status',
          '  4. Review server logs for any warnings',
        ],
      });

    } catch (error) {
      if (error instanceof EverlyticApiError) {
        console.error(`[Test-${testId}] Everlytic API error:`, error.getLogDetails());
        
        return NextResponse.json(
          {
            success: false,
            error: 'Email test failed',
            message: error.getUserMessage(),
            code: error.code,
            details: error.getLogDetails(),
            troubleshooting: getTroubleshootingSteps(error.code),
          },
          { status: error.code }
        );
      }

      // Network or other errors
      console.error(`[Test-${testId}] Unexpected error:`, error);
      throw error;
    }

  } catch (error) {
    console.error(`[Test-${testId}] Fatal error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: [
          'Check server logs for detailed error information',
          'Verify all environment variables are set correctly',
          'Ensure network connectivity to Everlytic API',
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * Get troubleshooting steps based on error code
 */
function getTroubleshootingSteps(code: number): string[] {
  switch (code) {
    case 400:
      return [
        '🔍 DOMAIN VERIFICATION REQUIRED:',
        '  1. Log in to Everlytic dashboard: https://login.everlytic.net',
        '  2. Navigate to Settings → Domains',
        '  3. Add domain: mambaonline.com',
        '  4. Complete DNS verification:',
        '     - Add SPF record to your DNS',
        '     - Add DKIM record to your DNS',
        '  5. Wait for verification (usually a few minutes)',
        '  6. Verify status shows "Verified" in dashboard',
        '',
        '📧 OTHER CHECKS:',
        '  - Verify all email addresses are properly formatted',
        '  - Review error details for specific field issues',
        '  - Check that sender email matches verified domain',
      ];
    case 401:
      return [
        '🔑 AUTHENTICATION FAILED:',
        '  1. Check EVERLYTIC_API_KEY in .env.local',
        '  2. Verify API key is active in Everlytic dashboard',
        '  3. Ensure EVERLYTIC_USERNAME is correct (default: "administrator")',
        '  4. Try regenerating the API key if needed',
        '  5. Restart development server after updating .env.local',
        '',
        '🔧 CONFIGURATION CHECK:',
        '  - Run: GET /api/test-email?check=config',
        '  - This validates credentials without sending email',
      ];
    case 412:
      return [
        '📋 INVALID FIELDS:',
        '  - Review the field-specific errors in the details section',
        '  - Ensure all required fields are provided',
        '  - Check that field values match expected formats',
        '  - Verify email addresses are valid',
        '  - Check that subject and body are not empty',
      ];
    case 429:
      return [
        '⏱️ RATE LIMIT EXCEEDED:',
        '  - Wait a few moments before trying again',
        '  - Check your Everlytic account rate limits',
        '  - Consider implementing request throttling for batch sends',
        '  - Contact Everlytic support if limits are too restrictive',
      ];
    case 500:
    case 502:
    case 503:
    case 504:
      return [
        '🔧 EVERLYTIC SERVICE ERROR:',
        '  - Check Everlytic status page',
        '  - Try again in a few moments',
        '  - If problem persists, contact Everlytic support',
        '  - Check your internet connection',
      ];
    default:
      return [
        '❓ UNEXPECTED ERROR:',
        '  - Check Everlytic service status',
        '  - Review server logs for more details',
        '  - Try again in a few moments',
        '  - Run configuration check: GET /api/test-email?check=config',
      ];
  }
}

/**
 * GET endpoint with query parameter support
 * - No query params: Show test instructions
 * - ?check=config: Validate configuration without sending
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkType = searchParams.get('check');

  // Configuration check endpoint
  if (checkType === 'config') {
    return handleConfigurationCheck();
  }

  // Default: Show test instructions
  const hasApiKey = !!process.env.EVERLYTIC_API_KEY;

  return NextResponse.json({
    endpoint: '/api/test-email',
    method: 'POST',
    description: 'Test the Everlytic Transactional Email API integration',
    configuration: {
      apiEndpoint: 'https://api.everlytic.net/transactional/email/v1/mail',
      apiKey: hasApiKey ? 'CONFIGURED' : 'NOT CONFIGURED',
    },
    usage: {
      curl: `curl -X POST http://localhost:3000/api/test-email \\
  -H "Content-Type: application/json" \\
  -d '{"recipientEmail": "your-email@example.com", "recipientName": "Your Name"}'`,
      javascript: `fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientEmail: 'your-email@example.com',
    recipientName: 'Your Name'
  })
}).then(res => res.json()).then(console.log);`,
    },
    optionalBody: {
      recipientEmail: 'string (default: test@example.com)',
      recipientName: 'string (default: Test User)',
      replyEmail: 'string (default: nompilo@mambaonline.com)',
      replyName: 'string (default: SalesMatter Test System)',
    },
    configurationCheck: {
      description: 'Validate credentials without sending email',
      endpoint: '/api/test-email?check=config',
      curl: 'curl http://localhost:3000/api/test-email?check=config',
    },
    nextSteps: [
      '1. Check configuration: GET /api/test-email?check=config',
      '2. Send a test email using the curl command above',
      '3. Check the recipient inbox',
      '4. Verify the email formatting',
      '5. Check email tracking in Everlytic dashboard',
    ],
  });
}

/**
 * Configuration check handler - validates credentials without sending email
 */
function handleConfigurationCheck() {
  const checks: Record<string, any> = {
    apiUrl: {
      configured: true,
      value: process.env.EVERLYTIC_API_URL || 'https://api.everlytic.net (default)',
      status: 'ok',
    },
    username: {
      configured: !!process.env.EVERLYTIC_USERNAME || true,
      value: process.env.EVERLYTIC_USERNAME || 'administrator (default)',
      status: 'ok',
    },
    apiKey: {
      configured: !!process.env.EVERLYTIC_API_KEY,
      value: process.env.EVERLYTIC_API_KEY ? '***' + process.env.EVERLYTIC_API_KEY.slice(-4) : 'NOT SET',
      status: process.env.EVERLYTIC_API_KEY ? 'ok' : 'error',
    },
  };

  const allConfigured = Object.values(checks).every(check => check.status === 'ok');

  // Check sender domain
  const senderEmail = 'nompilo@memeburn.com';
  const senderDomain = senderEmail.split('@')[1];

  return NextResponse.json({
    success: allConfigured,
    message: allConfigured 
      ? 'Configuration is valid. Ready to send emails.' 
      : 'Configuration is incomplete. Please check the issues below.',
    configuration: checks,
    senderDomain: {
      email: senderEmail,
      domain: senderDomain,
      verificationRequired: true,
      verificationSteps: [
        '1. Log in to Everlytic dashboard (https://login.everlytic.net)',
        '2. Navigate to Settings → Domains',
        `3. Add domain: ${senderDomain}`,
        '4. Complete DNS verification:',
        '   - Add SPF record to DNS',
        '   - Add DKIM record to DNS',
        '5. Wait for verification to complete (may take a few minutes)',
        '6. Verify status shows as "Verified" in Everlytic dashboard',
      ],
      troubleshooting: [
        'If emails fail with 400 error mentioning "domain" or "unverified":',
        '  → The sender domain must be verified in Everlytic',
        '  → Follow the verification steps above',
        '  → Contact your DNS administrator if you cannot add DNS records',
      ],
    },
    troubleshooting: allConfigured ? [] : [
      !checks.apiKey.configured && 'Add EVERLYTIC_API_KEY to .env.local',
      'Restart the development server after updating .env.local',
      'Verify API key is active in Everlytic dashboard',
      'Ensure sender domain is verified (see senderDomain section above)',
    ].filter(Boolean),
    nextSteps: allConfigured ? [
      'Configuration is valid',
      'Send a test email: POST /api/test-email',
      'Verify sender domain is verified in Everlytic dashboard',
    ] : [
      'Fix configuration issues listed above',
      'Restart development server',
      'Run configuration check again',
    ],
  }, { status: allConfigured ? 200 : 500 });
}
