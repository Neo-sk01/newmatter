# Follow-up Sequence Feature

## Overview

The follow-up sequence feature allows you to automatically send follow-up emails to leads who haven't responded to your initial outreach. This feature includes:

- **Multi-step sequences**: Create sequences with multiple follow-up steps
- **Timestamp tracking**: See exactly when emails were sent and when follow-ups are due
- **Response detection**: Automatically pause/complete sequences when leads respond
- **Flexible scheduling**: Set custom delays (days and hours) between follow-ups
- **Visual timeline**: View the complete email history for each lead

## Database Schema

The feature uses these main tables:

1. **follow_up_sequences** - Sequence templates
2. **sequence_steps** - Individual steps in a sequence
3. **lead_sequences** - Tracks which leads are in which sequences
4. **sent_emails** - Records all sent emails with timestamps
5. **email_responses** - Tracks responses from leads

## Setup

### 1. Run Database Migration

```bash
# Make sure you're connected to your Supabase project
# Run the migration
psql -h your-db-host -U your-user -d your-db -f supabase/migrations/003_follow_up_sequences.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### 2. Configure Environment Variables

Add to your `.env.local`:

```bash
# Optional: Secure your cron endpoint
CRON_SECRET=your-secure-random-string
```

### 3. Set Up Automatic Follow-up Triggering

The system needs to periodically check for due follow-ups and send them. You have several options:

#### Option A: Vercel Cron Jobs (Recommended for Vercel deployments)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/sequences/trigger-follow-ups",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour. Adjust the schedule as needed:
- `0 * * * *` - Every hour
- `*/30 * * * *` - Every 30 minutes
- `0 9-17 * * 1-5` - Every hour from 9 AM to 5 PM, Monday to Friday

#### Option B: GitHub Actions (Works anywhere)

Create `.github/workflows/trigger-follow-ups.yml`:

```yaml
name: Trigger Follow-up Emails

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allow manual triggering

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Follow-ups
        run: |
          curl -X POST https://your-app.vercel.app/api/sequences/trigger-follow-ups \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to your GitHub repository secrets.

#### Option C: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Zapier](https://zapier.com) (Schedule by Zapier)

Configure them to POST to:
```
https://your-app.vercel.app/api/sequences/trigger-follow-ups
```

With header:
```
Authorization: Bearer your-cron-secret
```

## Usage

### Creating a Follow-up Sequence

1. Navigate to the **Follow-up Sequences** tab
2. Click **Create Sequence**
3. Enter sequence details:
   - Name (e.g., "Cold Outreach Sequence")
   - Description
4. Add steps:
   - Set delay (days and hours)
   - Write subject template
   - Write body template
   - Use variables: `{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{email}}`, `{{title}}`

Example sequence:
```
Step 1: (3 days after initial email)
Subject: Following up on my previous email
Body: Hi {{firstName}}, I wanted to follow up...

Step 2: (5 days after step 1)
Subject: Last attempt to connect
Body: Hi {{firstName}}, I understand you're busy...

Step 3: (7 days after step 2)
Subject: Breaking up is hard to do
Body: Hi {{firstName}}, I'll assume this isn't a priority...
```

### Starting a Sequence for a Lead

**Option 1: Via API**
```javascript
const response = await fetch('/api/lead-sequences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leadId: 'lead-uuid',
    sequenceId: 'sequence-uuid'
  })
});
```

**Option 2: Automatically after sending initial email**

When you send an email, record it with a sequence:
```javascript
const response = await fetch('/api/sent-emails', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leadId: 'lead-uuid',
    sequenceId: 'sequence-uuid',
    stepId: 'first-step-uuid',
    leadSequenceId: 'lead-sequence-uuid',
    subject: 'Your email subject',
    body: 'Your email body',
    isFollowUp: false,
    followUpNumber: null,
    nextFollowUpDueAt: '2025-10-18T10:00:00Z' // When first follow-up should be sent
  })
});
```

### Monitoring Sequences

#### View Active Sequences
Navigate to **Follow-up Sequences** > **Active Leads** tab to see:
- All leads currently in sequences
- Current step in sequence
- Next follow-up due date
- Sequence status

#### View Timeline
Switch to the **Timeline View** tab to see:
- Complete email history for each lead
- Timestamps for sent emails
- Response status
- Next follow-up schedules

### Managing Responses

When a lead responds, record it:
```javascript
const response = await fetch('/api/email-responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sentEmailId: 'sent-email-uuid',
    leadId: 'lead-uuid',
    responseBody: 'Optional response text',
    sentiment: 'positive', // positive, neutral, negative, or unsubscribe
    autoDetected: false
  })
});
```

The system will automatically:
- Mark the email as "replied"
- Update the sequence status based on sentiment:
  - `positive` → sequence completed
  - `negative` or `neutral` → sequence paused
  - `unsubscribe` → sequence cancelled

## API Endpoints

### Sequences
- `GET /api/sequences?companyId=xxx` - Get all sequences
- `POST /api/sequences` - Create sequence
- `PATCH /api/sequences` - Update sequence
- `DELETE /api/sequences?sequenceId=xxx` - Delete sequence

### Sequence Steps
- `GET /api/sequences/[id]/steps` - Get steps for a sequence
- `POST /api/sequences/[id]/steps` - Add step to sequence
- `PATCH /api/sequences/[id]/steps` - Update step
- `DELETE /api/sequences/[id]/steps?stepId=xxx` - Delete step

### Lead Sequences
- `GET /api/lead-sequences?leadId=xxx` - Get sequences for a lead
- `POST /api/lead-sequences` - Start sequence for lead
- `PATCH /api/lead-sequences` - Update sequence status

### Sent Emails
- `GET /api/sent-emails?leadId=xxx` - Get sent emails
- `POST /api/sent-emails` - Record sent email
- `PATCH /api/sent-emails` - Update email status

### Email Responses
- `GET /api/email-responses?leadId=xxx` - Get responses
- `POST /api/email-responses` - Record response

### Trigger Follow-ups
- `POST /api/sequences/trigger-follow-ups` - Trigger due follow-ups (for cron)
- `GET /api/sequences/trigger-follow-ups` - Check due follow-ups (debugging)

## Integration with Email Sending

The current implementation records emails in the database but doesn't actually send them. To integrate with an email service:

1. Update `/api/sequences/trigger-follow-ups/route.ts`
2. Add your email service integration:

```typescript
// Example with SendGrid
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// In the trigger logic, after recording the email:
await sgMail.send({
  to: lead.email,
  from: 'your-email@company.com',
  subject: subject,
  text: body,
  html: body.replace(/\n/g, '<br>')
});
```

Supported services:
- SendGrid
- AWS SES
- Mailgun
- Postmark
- Resend

## Testing

### Test the trigger endpoint

Check what's due:
```bash
curl https://your-app.vercel.app/api/sequences/trigger-follow-ups
```

Manually trigger follow-ups:
```bash
curl -X POST https://your-app.vercel.app/api/sequences/trigger-follow-ups \
  -H "Authorization: Bearer your-cron-secret"
```

### Create test data

1. Create a sequence via the UI
2. Create a test lead
3. Record an initial sent email with `next_follow_up_due_at` set to now:
```sql
INSERT INTO sent_emails (lead_id, sequence_id, subject, body, next_follow_up_due_at)
VALUES (
  'your-lead-uuid',
  'your-sequence-uuid',
  'Test email',
  'Test body',
  NOW()
);
```
4. Call the trigger endpoint
5. Check the database for the new follow-up email

## Troubleshooting

### Follow-ups not triggering

1. Check cron job is running:
   - Vercel: Check deployment logs
   - GitHub Actions: Check Actions tab
   - External: Check service logs

2. Verify database data:
```sql
-- Check emails due for follow-up
SELECT * FROM sent_emails 
WHERE next_follow_up_due_at IS NOT NULL 
  AND next_follow_up_due_at <= NOW()
  AND status IN ('sent', 'delivered', 'opened', 'clicked');
```

3. Test the trigger endpoint manually

### Sequences not advancing

Check lead sequence status:
```sql
SELECT * FROM lead_sequences WHERE status = 'active';
```

Ensure sequences have steps:
```sql
SELECT * FROM sequence_steps WHERE sequence_id = 'your-sequence-uuid';
```

### Variables not replacing

Variables are case-sensitive: `{{firstName}}` not `{{firstname}}`

Supported variables:
- `{{firstName}}`
- `{{lastName}}`
- `{{company}}`
- `{{email}}`
- `{{title}}`
- `{{website}}`
- `{{linkedin}}`

## Best Practices

1. **Start simple**: Begin with a 2-3 step sequence
2. **Test thoroughly**: Use test leads before production
3. **Monitor metrics**: Track open rates and response rates
4. **Respect unsubscribes**: Always stop sequences for unsubscribes
5. **Timing matters**: Space follow-ups appropriately (3-7 days)
6. **Personalize**: Use variables and research to personalize
7. **Provide value**: Each follow-up should add value, not just remind

## Future Enhancements

Potential additions:
- [ ] A/B testing for sequences
- [ ] Analytics dashboard
- [ ] Email open/click tracking
- [ ] Smart send times (based on recipient timezone)
- [ ] Conditional branching (different paths based on behavior)
- [ ] Template library
- [ ] Bulk sequence assignment
- [ ] Integration with CRM systems

