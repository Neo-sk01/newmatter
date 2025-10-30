# Requirements Document

## Introduction

This feature integrates Everlytic's transactional email API into the SalesMatter platform to enable actual email delivery. Currently, the platform simulates email sending with UI mockups. This integration will replace the simulation with real email delivery through Everlytic's API, allowing users to send personalized sales emails to leads with tracking capabilities for opens, link clicks, and file attachments.

## Glossary

- **Everlytic**: A transactional email service provider that delivers emails via API
- **Transactional Email**: Once-off emails sent to one or more recipients through an API
- **Email Sending Agent**: The API endpoint at `/api/send-email` that handles email delivery
- **Email Test Agent**: The API endpoint at `/api/test-email` that validates email configuration before sending
- **Engagement Tracking**: Monitoring when contacts open emails, click links, or open attachments
- **Lead**: A sales prospect stored in the system with contact information
- **Campaign**: A collection of emails sent to multiple leads as part of a sales outreach effort
- **HTML Body**: The formatted email content with styling and structure
- **Text Body**: Plain text version of the email content for email clients that don't support HTML
- **Personalization Fields**: Custom tags that replace placeholders with recipient-specific data

## Requirements

### Requirement 1

**User Story:** As a sales professional, I want to send generated emails to leads through Everlytic, so that my outreach emails are actually delivered to prospects.

#### Acceptance Criteria

1. THE Email Sending Agent SHALL send emails via Everlytic's transactional email API endpoint
2. WHEN a user requests to send an email, THE Email Sending Agent SHALL construct a valid Everlytic API request with HTML body, headers, and recipient information
3. THE Email Sending Agent SHALL authenticate with Everlytic using the configured API credentials
4. THE Email Sending Agent SHALL return the Everlytic transaction ID upon successful email delivery
5. IF the Everlytic API returns an error, THEN THE Email Sending Agent SHALL return a descriptive error message to the user

### Requirement 2

**User Story:** As a sales professional, I want emails to include both HTML and plain text versions, so that recipients can view emails regardless of their email client capabilities.

#### Acceptance Criteria

1. THE Email Sending Agent SHALL include an HTML body in the Everlytic API request
2. THE Email Sending Agent SHALL generate a plain text version of the email content
3. THE Email Sending Agent SHALL strip HTML tags from the email body to create the text version
4. THE Email Sending Agent SHALL preserve line breaks and basic formatting in the text version
5. THE Email Sending Agent SHALL send both HTML and text versions in the same API request

### Requirement 3

**User Story:** As a sales professional, I want to track when leads open my emails and click links, so that I can measure engagement and follow up appropriately.

#### Acceptance Criteria

1. THE Email Sending Agent SHALL enable open tracking in the Everlytic API request
2. THE Email Sending Agent SHALL enable link tracking in the Everlytic API request
3. WHEN tracking is enabled, THE Email Sending Agent SHALL set `track_opens` to true
4. WHEN tracking is enabled, THE Email Sending Agent SHALL set `track_links` to true
5. THE Email Sending Agent SHALL allow tracking settings to be configured per email or globally

### Requirement 4

**User Story:** As a sales professional, I want emails to come from a verified sender address, so that my emails don't end up in spam folders.

#### Acceptance Criteria

1. THE Email Sending Agent SHALL use a configured sender email address in the `from` field
2. THE Email Sending Agent SHALL use a configured sender name in the `from` field
3. THE Email Sending Agent SHALL validate that the sender domain is verified with Everlytic before sending
4. IF the sender domain is not verified, THEN THE Email Sending Agent SHALL return an error message
5. THE Email Sending Agent SHALL allow the sender address to be configured via environment variables

### Requirement 5

**User Story:** As a sales professional, I want to personalize emails with recipient-specific information, so that each lead receives a customized message.

#### Acceptance Criteria

1. THE Email Sending Agent SHALL support personalization fields in email templates
2. THE Email Sending Agent SHALL replace placeholders like `{{firstName}}` with actual lead data
3. THE Email Sending Agent SHALL map lead properties to Everlytic's `unique_fields` structure
4. THE Email Sending Agent SHALL handle missing personalization data gracefully by using fallback values
5. THE Email Sending Agent SHALL support common personalization fields including firstName, lastName, company, and role

### Requirement 6

**User Story:** As a developer, I want to test email configuration without sending real emails, so that I can verify the integration is working correctly.

#### Acceptance Criteria

1. THE Email Test Agent SHALL validate Everlytic API credentials without sending emails
2. THE Email Test Agent SHALL send a test email to a specified address
3. THE Email Test Agent SHALL return success or failure status with descriptive messages
4. THE Email Test Agent SHALL verify that the sender domain is verified with Everlytic
5. THE Email Test Agent SHALL provide detailed error information when configuration is invalid

### Requirement 7

**User Story:** As a sales professional, I want to send emails to multiple leads in a campaign, so that I can execute batch outreach efficiently.

#### Acceptance Criteria

1. THE Email Sending Agent SHALL support sending to multiple recipients in a single API request
2. THE Email Sending Agent SHALL construct the `to` array with all recipient email addresses and names
3. THE Email Sending Agent SHALL apply unique personalization fields for each recipient
4. THE Email Sending Agent SHALL return transaction IDs for all sent emails
5. THE Email Sending Agent SHALL handle partial failures by reporting which emails succeeded and which failed

### Requirement 8

**User Story:** As a sales professional, I want emails to be grouped by campaign, so that I can view engagement reports organized by my outreach efforts.

#### Acceptance Criteria

1. THE Email Sending Agent SHALL include a `group_name` in the Everlytic API request
2. THE Email Sending Agent SHALL use the campaign name or ID as the group name
3. WHEN no campaign is specified, THE Email Sending Agent SHALL use a default group name
4. THE Email Sending Agent SHALL allow viewing engagement reports grouped by campaign in Everlytic's interface
5. THE Email Sending Agent SHALL pass the group name from the API request body to Everlytic

### Requirement 9

**User Story:** As a developer, I want Everlytic API credentials stored securely, so that sensitive authentication information is not exposed in code.

#### Acceptance Criteria

1. THE Email Sending Agent SHALL load Everlytic credentials from environment variables
2. THE Email Sending Agent SHALL require `EVERLYTIC_API_URL`, `EVERLYTIC_USERNAME`, and `EVERLYTIC_API_KEY` to be configured
3. THE Email Sending Agent SHALL not log or expose API credentials in error messages
4. THE Email Sending Agent SHALL return a configuration error if required credentials are missing
5. THE Email Sending Agent SHALL use Basic Authentication with username and API key for Everlytic requests

### Requirement 10

**User Story:** As a sales professional, I want to set a reply-to address for my emails, so that responses from leads come to my preferred inbox.

#### Acceptance Criteria

1. THE Email Sending Agent SHALL support a `reply_to` field in the email request
2. THE Email Sending Agent SHALL include the reply-to email address in the Everlytic API request
3. THE Email Sending Agent SHALL include the reply-to name in the Everlytic API request
4. WHEN no reply-to is specified, THE Email Sending Agent SHALL use the sender address as the reply-to
5. THE Email Sending Agent SHALL validate that the reply-to email format is correct
