/**
 * Everlytic API Client
 * 
 * Provides a centralized client for interacting with Everlytic's transactional email API.
 * Handles authentication, request construction, and error handling.
 */

// ============================================================================
// Configuration Interfaces
// ============================================================================

export interface EverlyticConfig {
  apiUrl: string;
  username: string;
  apiKey: string;
}

// ============================================================================
// Request/Response Models
// ============================================================================

export interface EverlyticEmailPayload {
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
    reply_to?: {
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

export interface EverlyticResponse {
  transactions: Array<{ id: string }>;
}

export interface EverlyticErrorDetail {
  domain: string;
  reason: string;
  message: string;
  locationType: string;
  location: string;
}

export interface EverlyticErrorResponse {
  code: number;
  message: string;
  error: {
    errors: EverlyticErrorDetail[];
  };
}

// ============================================================================
// Error Classes
// ============================================================================

export class EverlyticApiError extends Error {
  public code: number;
  public details: EverlyticErrorResponse;

  constructor(error: EverlyticErrorResponse) {
    super(error.message);
    this.name = 'EverlyticApiError';
    this.code = error.code;
    this.details = error;
  }

  /**
   * Get a user-friendly error message based on the error code
   */
  getUserMessage(): string {
    switch (this.code) {
      case 400:
        // Check for unverified domain error
        if (this.message.toLowerCase().includes('domain') || 
            this.message.toLowerCase().includes('verify') ||
            this.message.toLowerCase().includes('unverified')) {
          return 'Sender domain is not verified with Everlytic. Please verify your domain:\n' +
                 '1. Log in to Everlytic dashboard\n' +
                 '2. Navigate to Settings → Domains\n' +
                 '3. Add your domain and complete DNS verification (SPF, DKIM records)\n' +
                 '4. Wait for verification to complete';
        }
        
        // Check for invalid email format
        if (this.message.toLowerCase().includes('email') || 
            this.message.toLowerCase().includes('address')) {
          const fieldErrors = this.details.error?.errors
            ?.map(e => `${e.location}: ${e.message}`)
            .join('; ');
          return `Invalid email address format. ${fieldErrors || this.message}`;
        }
        
        // Generic 400 error
        const errors = this.details.error?.errors
          ?.map(e => `${e.location}: ${e.message}`)
          .join('; ');
        return `Bad request: ${errors || this.message}`;
      
      case 401:
        return 'Authentication failed. Please check your Everlytic API credentials:\n' +
               '1. Verify EVERLYTIC_API_KEY is set in .env.local\n' +
               '2. Verify EVERLYTIC_USERNAME is correct (default: "administrator")\n' +
               '3. Check that your API key is active in Everlytic dashboard\n' +
               '4. Ensure API key has not expired';
      
      case 412:
        const fieldErrors = this.details.error?.errors
          ?.map(e => {
            const location = e.location || 'unknown field';
            const message = e.message || 'invalid value';
            return `• ${location}: ${message}`;
          })
          .join('\n');
        return `Invalid fields in request:\n${fieldErrors || this.message}\n\n` +
               'Please check that all required fields are provided and properly formatted.';
      
      case 429:
        return 'Rate limit exceeded. Please wait a moment before sending more emails.';
      
      case 500:
      case 502:
      case 503:
      case 504:
        return `Everlytic service error (${this.code}). Please try again in a few moments. ` +
               'If the problem persists, check Everlytic status page.';
      
      default:
        return `Everlytic API error (${this.code}): ${this.message}`;
    }
  }
  
  /**
   * Get detailed error information for logging (without sensitive data)
   */
  getLogDetails(): Record<string, any> {
    return {
      code: this.code,
      message: this.message,
      errors: this.details.error?.errors?.map(e => ({
        domain: e.domain,
        reason: e.reason,
        location: e.location,
        locationType: e.locationType,
        message: e.message,
      })),
    };
  }
}

// ============================================================================
// Everlytic Client
// ============================================================================

export class EverlyticClient {
  private config: EverlyticConfig;

  constructor(config: EverlyticConfig) {
    this.config = config;
  }

  /**
   * Generate Basic Authentication header
   * @returns Base64-encoded Basic Auth header value
   */
  getAuthHeader(): string {
    const credentials = `${this.config.username}:${this.config.apiKey}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Send an email via Everlytic API 2.0 (two-step process)
   * @param payload - Email payload conforming to Everlytic API specification
   * @returns Response containing transaction IDs
   * @throws EverlyticApiError if the API returns an error
   */
  async sendTransactionalEmail(payload: EverlyticEmailPayload): Promise<EverlyticResponse> {
    // Step 1: Create the message
    const messageId = await this.createMessage(payload);
    
    // Step 2: Send the message
    await this.sendMessage(messageId);
    
    return {
      transactions: [{ id: messageId.toString() }],
    };
  }

  /**
   * Create a message in Everlytic (Step 1)
   */
  private async createMessage(payload: EverlyticEmailPayload): Promise<number> {
    const url = `${this.config.apiUrl}/api/2.0/messages`;
    
    // Convert payload to Everlytic API 2.0 format
    const api2Payload = {
      type: 'email',
      subject: payload.headers.subject,
      from_email: payload.headers.from.email,
      from_name: payload.headers.from.name,
      reply_email: payload.headers.reply_to?.email || payload.headers.from.email,
      html_original: payload.body.html,
      text_original: payload.body.text,
      list_ids: '4', // Default list ID
      track_links: payload.options.track_links ? 'yes' : 'no',
      track_reads: payload.options.track_opens ? 'yes' : 'no',
      inline_css: 'yes',
      insert_unsubscribe_link: 'yes',
    };
    
    console.log('[Everlytic] Creating message:', {
      url,
      subject: payload.headers.subject,
      from: payload.headers.from.email,
      recipients: payload.headers.to.map(r => r.email),
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(api2Payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData: EverlyticErrorResponse;
        
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = {
            code: response.status,
            message: response.statusText || 'Unknown error',
            error: {
              errors: [{
                domain: 'everlytic',
                reason: 'unknown',
                message: responseText || response.statusText,
                locationType: 'response',
                location: 'body',
              }],
            },
          };
        }

        console.error('[Everlytic] Create message error:', {
          code: errorData.code,
          message: errorData.message,
        });

        throw new EverlyticApiError(errorData);
      }

      const result = JSON.parse(responseText);
      const messageId = result.item?.id;
      
      if (!messageId) {
        throw new Error('No message ID returned from Everlytic');
      }
      
      console.log('[Everlytic] Message created:', { messageId });
      return messageId;
    } catch (error) {
      if (error instanceof EverlyticApiError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new Error(`Failed to create message: ${error.message}`);
      }

      throw new Error('Unknown error occurred while creating message');
    }
  }

  /**
   * Send a created message (Step 2)
   */
  private async sendMessage(messageId: number): Promise<void> {
    const url = `${this.config.apiUrl}/api/2.0/email_actions/send/${messageId}`;
    
    console.log('[Everlytic] Sending message:', { messageId, url });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData: EverlyticErrorResponse;
        
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = {
            code: response.status,
            message: response.statusText || 'Unknown error',
            error: {
              errors: [{
                domain: 'everlytic',
                reason: 'unknown',
                message: responseText || response.statusText,
                locationType: 'response',
                location: 'body',
              }],
            },
          };
        }

        console.error('[Everlytic] Send message error:', {
          code: errorData.code,
          message: errorData.message,
        });

        throw new EverlyticApiError(errorData);
      }

      console.log('[Everlytic] Message sent successfully:', { messageId });
    } catch (error) {
      if (error instanceof EverlyticApiError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }

      throw new Error('Unknown error occurred while sending message');
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create an Everlytic client using environment variables
 * @returns Configured EverlyticClient instance
 * @throws Error if required environment variables are missing
 */
export function createEverlyticClient(): EverlyticClient {
  const apiUrl = process.env.EVERLYTIC_API_URL || 'https://api.everlytic.net';
  const username = process.env.EVERLYTIC_USERNAME || 'administrator';
  const apiKey = process.env.EVERLYTIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'EVERLYTIC_API_KEY environment variable is required. ' +
      'Please add it to your .env.local file.'
    );
  }

  return new EverlyticClient({ apiUrl, username, apiKey });
}
