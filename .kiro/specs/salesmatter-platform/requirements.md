# Requirements Document

## Introduction

SalesMatter is an AI-driven sales automation platform that streamlines outbound sales workflows. THE System SHALL enable sales teams to import leads, enrich contact data with AI-powered research, generate personalized email outreach at scale, review and approve content, and track campaign performance through analytics dashboards.

## Glossary

- **System**: The SalesMatter web application
- **User**: A sales professional or team member using the platform
- **Lead**: A potential customer contact with associated data (name, email, company, etc.)
- **Campaign**: A collection of leads with associated email templates and sending configuration
- **Enrichment**: The process of augmenting lead data with AI-powered research and insights
- **Generation**: The process of creating personalized email content using AI and templates
- **CSV_Parser**: The client-side component that parses uploaded CSV files
- **AI_Mapper**: The API endpoint that maps arbitrary CSV columns to canonical lead schema
- **Email_Generator**: The API endpoint that generates personalized email content
- **Research_Engine**: The API endpoint that performs web research and summarization for leads
- **Lead_Schema**: The canonical data structure (firstName, lastName, company, email, title, website, linkedin)

## Requirements

### Requirement 1: CSV Lead Import

**User Story:** As a User, I want to upload CSV files containing lead data, so that I can quickly import contacts into the system without manual data entry.

#### Acceptance Criteria

1. WHEN the User drags a CSV file onto the import area, THE System SHALL parse the file using the CSV_Parser
2. WHEN the CSV_Parser completes parsing, THE System SHALL send column headers and sample rows to the AI_Mapper
3. WHEN the AI_Mapper returns a mapping, THE System SHALL transform all CSV rows to the Lead_Schema format
4. IF the AI_Mapper is unavailable, THEN THE System SHALL apply a heuristic fallback mapping based on common column name patterns
5. WHEN mapping is complete, THE System SHALL display a preview table showing the normalized lead data with firstName, lastName, company, email, title, website, and linkedin fields

### Requirement 2: Intelligent Column Mapping

**User Story:** As a User, I want the system to automatically map my CSV columns to the correct fields, so that I don't have to manually configure field mappings for each import.

#### Acceptance Criteria

1. WHEN the AI_Mapper receives CSV headers and sample data, THE System SHALL generate a mapping from original column names to canonical Lead_Schema fields
2. WHEN a CSV contains a full name column, THE System SHALL split it into firstName and lastName components
3. WHEN email addresses are mapped, THE System SHALL normalize them to lowercase format
4. WHEN website or linkedin URLs are mapped, THE System SHALL normalize them to absolute HTTPS URLs
5. THE System SHALL map columns to one of: firstName, lastName, company, email, title, website, linkedin, or ignore

### Requirement 3: Lead Data Enrichment

**User Story:** As a User, I want to enrich my leads with AI-powered research, so that I can personalize my outreach with relevant insights about each prospect.

#### Acceptance Criteria

1. WHEN the User selects a lead for enrichment, THE System SHALL send the lead data to the Research_Engine
2. WHEN the Research_Engine completes research, THE System SHALL return a summary limited to 100 words maximum
3. WHEN research includes LinkedIn profile discovery, THE System SHALL capture and store the LinkedIn URL
4. THE User SHALL review and approve the research summary before it is saved to the lead record
5. WHEN the User approves a summary, THE System SHALL store it with the lead for use in email generation

### Requirement 4: AI Email Generation

**User Story:** As a User, I want to generate personalized email drafts using AI and templates, so that I can create customized outreach at scale without writing each email manually.

#### Acceptance Criteria

1. WHEN the User initiates email generation for a lead, THE System SHALL send the template prompt and lead data to the Email_Generator
2. WHERE a lead has an approved research summary, THE System SHALL include the summary in the generation prompt
3. WHEN the Email_Generator receives enriched lead data, THE System SHALL reference at least one insight from the research summary in the generated email
4. THE System SHALL generate email content with a maximum of 700 output tokens
5. WHEN generation completes, THE System SHALL display the draft email for User review

### Requirement 5: Email Review and Approval

**User Story:** As a User, I want to review and edit generated emails before sending, so that I can ensure quality and make final adjustments to the messaging.

#### Acceptance Criteria

1. WHEN a draft email is displayed, THE User SHALL edit the content inline using a text editor
2. THE User SHALL approve or reject each email draft individually
3. WHEN the User approves an email, THE System SHALL mark the lead as ready for sending
4. WHEN the User rejects an email, THE System SHALL mark the lead as rejected and exclude it from the send queue
5. THE System SHALL display a live preview of the email content during editing

### Requirement 6: Template Management

**User Story:** As a User, I want to create and manage email templates with variables, so that I can maintain consistent messaging while personalizing content for each lead.

#### Acceptance Criteria

1. THE User SHALL create email templates with tokenized variables for lead fields
2. THE System SHALL support template variables for firstName, lastName, company, title, website, and linkedin
3. WHEN generating emails, THE System SHALL replace template tokens with actual lead data
4. THE User SHALL save multiple templates for different campaign types
5. THE User SHALL select a template when initiating email generation for a campaign

### Requirement 7: Campaign Organization

**User Story:** As a User, I want to organize my leads into campaigns, so that I can manage multiple outreach initiatives separately with different templates and settings.

#### Acceptance Criteria

1. THE User SHALL create named campaigns to group related leads
2. WHEN creating a campaign, THE User SHALL assign an email template to the campaign
3. THE User SHALL move leads between campaigns using drag-and-drop or bulk actions
4. THE System SHALL display campaign-level statistics including total leads, approved emails, and sent count
5. THE User SHALL archive or delete campaigns when they are complete

### Requirement 8: Batch Email Sending

**User Story:** As a User, I want to send approved emails in batches with scheduling and rate limiting, so that I can control the pace of my outreach and avoid triggering spam filters.

#### Acceptance Criteria

1. WHEN the User initiates batch sending, THE System SHALL send only approved emails from the selected campaign
2. THE User SHALL configure a daily sending limit to control outreach volume
3. THE User SHALL schedule batch sends for a specific date and time
4. WHILE batch sending is in progress, THE System SHALL display a progress indicator showing percentage complete
5. THE User SHALL pause or stop batch sending at any time during execution

### Requirement 9: Analytics Dashboard

**User Story:** As a User, I want to view analytics about my campaigns and email performance, so that I can measure the effectiveness of my outreach efforts.

#### Acceptance Criteria

1. THE System SHALL display total leads imported across all campaigns
2. THE System SHALL display total emails generated and approved
3. THE System SHALL display total emails sent with simulated delivery status
4. THE System SHALL render a time-series chart showing email activity over the past 30 days
5. THE System SHALL calculate and display response rate, open rate, and click rate metrics

### Requirement 10: Theme and Appearance

**User Story:** As a User, I want to switch between light and dark themes, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE System SHALL provide a theme toggle control in the application header
2. WHEN the User clicks the theme toggle, THE System SHALL switch between light and dark color schemes
3. THE System SHALL persist the User's theme preference across browser sessions
4. THE System SHALL apply the theme consistently to all UI components including cards, tables, and dialogs
5. THE System SHALL prevent hydration mismatches between server-rendered and client-rendered theme states

### Requirement 11: User Authentication

**User Story:** As a User, I want to sign in securely to access my campaigns and data, so that my lead information and outreach activities remain private.

#### Acceptance Criteria

1. THE System SHALL provide sign-in and sign-up pages for User authentication
2. WHEN a User signs in successfully, THE System SHALL create an authenticated session
3. THE System SHALL restrict access to campaign data and lead information to authenticated Users only
4. WHEN a User signs out, THE System SHALL terminate the session and redirect to the sign-in page
5. THE System SHALL integrate with Clerk authentication service for identity management

### Requirement 12: Multi-Company Support

**User Story:** As a User, I want to work with multiple company workspaces, so that I can manage separate client accounts or business units within the same application.

#### Acceptance Criteria

1. THE System SHALL allow Users to create and switch between multiple company workspaces
2. WHEN the User selects a company workspace, THE System SHALL display only campaigns and leads associated with that company
3. THE System SHALL provide a workspace switcher component in the application sidebar
4. THE User SHALL invite team members to specific company workspaces
5. THE System SHALL isolate data between different company workspaces to prevent cross-contamination

### Requirement 13: Database Setup and Migration

**User Story:** As a User, I want the system to automatically set up required database tables, so that I can start using the application without manual database configuration.

#### Acceptance Criteria

1. THE System SHALL provide a database setup page for initial configuration
2. WHEN the User initiates database setup, THE System SHALL execute migration scripts to create required tables
3. THE System SHALL create tables for companies, users, campaigns, leads, and analytics data
4. IF database setup fails, THEN THE System SHALL display an error message with troubleshooting guidance
5. WHEN setup completes successfully, THE System SHALL redirect the User to the onboarding flow

### Requirement 14: API Model Configuration

**User Story:** As a User, I want to configure which AI models are used for different tasks, so that I can optimize for cost, speed, or quality based on my needs.

#### Acceptance Criteria

1. THE System SHALL support OpenAI and Anthropic model providers
2. THE User SHALL configure the email generation model using the AI_EMAIL_MODEL environment variable
3. THE User SHALL configure the research model using the AI_RESEARCH_MODEL environment variable
4. THE System SHALL use the format "provider:model" for model identifiers (e.g., "openai:gpt-4o-mini")
5. IF an invalid model identifier is provided, THEN THE System SHALL return an error message with the correct format

### Requirement 15: Lead List Management

**User Story:** As a User, I want to filter and search my leads, so that I can quickly find specific contacts or segments within large datasets.

#### Acceptance Criteria

1. THE User SHALL search leads by name, email, company, or title using a search input
2. THE User SHALL filter leads by status (new, enriched, generated, approved, sent, rejected)
3. THE System SHALL display filtered results in real-time as the User types
4. THE User SHALL select multiple leads using checkboxes for bulk actions
5. THE User SHALL export filtered lead lists to CSV format

### Requirement 16: Error Handling and Validation

**User Story:** As a User, I want clear error messages when something goes wrong, so that I can understand what happened and how to fix it.

#### Acceptance Criteria

1. WHEN a CSV file fails to parse, THE System SHALL display an error message indicating the file format issue
2. WHEN an API request fails, THE System SHALL display a user-friendly error message without exposing technical details
3. WHEN required lead fields are missing, THE System SHALL highlight the missing data and prevent progression to the next step
4. WHEN AI generation fails, THE System SHALL offer a retry option and log the error for debugging
5. THE System SHALL validate email addresses using standard email format rules before allowing import

### Requirement 17: Performance and Scalability

**User Story:** As a User, I want the system to handle large CSV imports efficiently, so that I can work with thousands of leads without performance degradation.

#### Acceptance Criteria

1. THE System SHALL parse CSV files with up to 10,000 rows within 5 seconds on the client
2. WHEN sending sample data to the AI_Mapper, THE System SHALL limit the sample to 25 rows maximum
3. THE System SHALL implement pagination for lead tables displaying more than 100 rows
4. THE System SHALL use lazy loading for lead enrichment to avoid overwhelming the Research_Engine
5. THE System SHALL display loading indicators during long-running operations exceeding 2 seconds

### Requirement 18: Data Privacy and Security

**User Story:** As a User, I want my lead data to be stored securely, so that I can trust the platform with sensitive customer information.

#### Acceptance Criteria

1. THE System SHALL store all lead data in a Supabase database with row-level security policies
2. THE System SHALL encrypt API keys and credentials in environment variables
3. THE System SHALL not log or expose lead email addresses or personal information in client-side console output
4. THE System SHALL implement HTTPS for all API communications
5. THE System SHALL comply with data retention policies by allowing Users to delete campaigns and associated lead data
