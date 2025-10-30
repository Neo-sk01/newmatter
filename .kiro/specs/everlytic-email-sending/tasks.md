# Implementation Plan

- [x] 1. Create Email Utility Modules
  - Create `src/lib/email/html-converter.ts` with `convertToHtml()` and `stripHtml()` functions
  - Implement HTML escaping for special characters to prevent XSS
  - Create full HTML document structure with proper DOCTYPE, meta tags, and inline CSS styling
  - Implement plain text extraction from HTML for text-only email clients
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Create Personalization Utility Module
  - Create `src/lib/email/personalization.ts` with `applyPersonalization()` function
  - Implement detection of personalization tags like `{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{role}}`
  - Build Everlytic `unique_fields` structure for per-recipient personalization
  - Build Everlytic `common_fields` structure for shared personalization
  - Handle missing personalization data gracefully with fallback values
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Create Everlytic Client Module
  - Create `src/lib/email/everlytic-client.ts` with `EverlyticClient` class
  - Implement `getAuthHeader()` method to generate Basic Auth header from username and API key
  - Implement `sendTransactionalEmail()` method to POST to Everlytic API
  - Create `EverlyticApiError` class for structured error handling
  - Implement `createEverlyticClient()` factory function that loads credentials from environment variables
  - Add proper TypeScript interfaces for Everlytic request/response models
  - _Requirements: 1.1, 1.3, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Enhance Send Email API Route for Batch Sending
  - Update `src/app/api/send-email/route.ts` to support `recipients` array in addition to single `recipientEmail`
  - Add support for `campaignName` and `groupName` fields in request body
  - Add support for `trackOpens` and `trackLinks` boolean fields with defaults
  - Add support for `personalizationFields` object for common personalization
  - Add support for per-recipient personalization via `recipients[].personalization`
  - Refactor to use the new utility modules (html-converter, personalization, everlytic-client)
  - Update response to return array of transaction IDs mapped to recipient emails
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5. Add Reply-To Support
  - Add `replyEmail` and `replyName` fields to `SendEmailRequest` interface
  - Include `reply_to` object in Everlytic payload with email and name
  - Default to sender address if reply-to is not specified
  - Validate reply-to email format before sending
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 6. Improve Error Handling
  - Add validation for email format using regex or email validation library
  - Return 400 Bad Request for invalid email addresses with specific field errors
  - Handle Everlytic 400 errors (unverified domain) with domain verification instructions
  - Handle Everlytic 401 errors (invalid credentials) with credential check instructions
  - Handle Everlytic 412 errors (invalid fields) with field-specific error messages
  - Add detailed logging for all errors without exposing API credentials
  - _Requirements: 1.5, 4.3, 4.4, 9.3_

- [ q] 7. Update Test Email API Route
  - Refactor `src/app/api/test-email/route.ts` to use new utility modules
  - Add validation that sender domain is verified before sending test email
  - Enhance error messages with troubleshooting steps
  - Add configuration check endpoint that validates credentials without sending
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Add Environment Variable Configuration
  - Update `.env.local` with Everlytic credentials (EVERLYTIC_API_URL, EVERLYTIC_USERNAME, EVERLYTIC_API_KEY)
  - Add validation in API routes to check for required environment variables
  - Return 500 Internal Server Error with configuration instructions if variables are missing
  - Document environment variables in README or .env.example file
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 9. Add Unit Tests for Utility Modules
  - Create `src/lib/email/html-converter.test.ts` with tests for HTML conversion and escaping
  - Create `src/lib/email/personalization.test.ts` with tests for personalization tag replacement
  - Create `src/lib/email/everlytic-client.test.ts` with tests for auth header generation and error handling
  - Verify all edge cases are covered (empty strings, special characters, missing data)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4_

- [ ] 10. Add Integration Tests for API Routes
  - Create `tests/integration/email-sending.test.ts` for end-to-end email sending tests
  - Test single email sending with valid data
  - Test batch email sending with multiple recipients
  - Test personalization with unique fields per recipient
  - Test error scenarios (invalid credentials, unverified domain, malformed payload)
  - Verify transaction IDs are returned correctly
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11. Integrate with Frontend Email Generation UI
  - Locate the email sending logic in `src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx`
  - Replace simulated email sending with actual API call to `/api/send-email`
  - Pass generated email subject and body to the API
  - Pass recipient information (email, name) from lead data
  - Pass campaign name for grouping in Everlytic
  - Display transaction IDs and success/error messages to user
  - Handle loading states and error states in UI
  - _Requirements: 1.1, 1.2, 1.4, 8.1, 8.2, 8.3_

- [ ] 12. Add Batch Campaign Sending Support
  - Identify the campaign management UI in the frontend
  - Add "Send Campaign" button that sends emails to all leads in a campaign
  - Construct `recipients` array from campaign lead list
  - Apply personalization fields from lead data (firstName, lastName, company, role)
  - Show progress indicator during batch sending
  - Display results summary (successful sends, failed sends, transaction IDs)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 13. Manual Testing and Validation
  - Test single email sending to verify delivery and formatting
  - Test batch email sending with 5-10 recipients
  - Verify personalization tags are replaced correctly
  - Verify HTML and plain text versions are both included
  - Check Everlytic dashboard for open tracking and link tracking
  - Verify emails are grouped by campaign name
  - Test error scenarios (invalid email, missing credentials, unverified domain)
  - Verify sender and reply-to addresses are correct
  - Test with different email clients (Gmail, Outlook, Apple Mail)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 10.1, 10.2, 10.3_

- [ ] 14. Add Documentation
  - Document the `/api/send-email` endpoint with request/response examples
  - Document the `/api/test-email` endpoint with usage instructions
  - Document environment variable configuration
  - Document sender domain verification process
  - Document personalization tag syntax and supported fields
  - Add troubleshooting guide for common errors
  - _Requirements: 4.3, 4.4, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2_
