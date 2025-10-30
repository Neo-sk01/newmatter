# Everlytic Email Sending Integration

## Overview
Integrated Everlytic API to enable actual email sending functionality in SalesMatter. The system now sends real emails through Everlytic's platform instead of simulating the send process.

## Implementation

### 1. Environment Configuration
**File**: `.env.local`

Added Everlytic credentials:
```bash
# Everlytic Email Service Configuration
EVERLYTIC_API_URL=https://memeburn.everlytic.net
EVERLYTIC_USERNAME=administrator
EVERLYTIC_API_KEY=hqBBItQVBTcfr1JFJB36rewqubwEUQlV_2
```

### 2. API Route
**File**: `src/app/api/send-email/route.ts`

Created new API endpoint that:
- Accepts email details (subject, body, recipient)
- Converts plain text email to HTML format
- Creates message in Everlytic via `/api/2.0/messages`
- Triggers send via `/api/2.0/email_actions/send/:id`
- Returns success/failure status

**Endpoint**: `POST /api/send-email`

**Request Body**:
```typescript
{
  subject: string;
  body: string;
  recipientEmail: string;
  recipientName: string;
  fromEmail?: string;        // Default: nompilo@mambaonline.com
  fromName?: string;          // Default: Nompilo Gwala - Burn Media Group
  replyEmail?: string;        // Default: nompilo@mambaonline.com
  listId?: number;            // Default: 4
}
```

**Response**:
```typescript
{
  success: true,
  messageId: number,
  status: string,
  recipient: string,
  subject: string
}
```

### 3. Frontend Integration
**File**: `src/app/sales_matter_ai_sales_automation_ui_shadcn_react.tsx`

**Before**: Simulated sending with timer
```typescript
timer = setInterval(() => {
  sent = Math.min(total, sent + Math.max(1, Math.floor(batchSize / 4)));
  setProgress(Math.round((sent / total) * 100));
  // ...
}, 800);
```

**After**: Real email sending via API
```typescript
for (const lead of approvedLeads) {
  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: email.subject,
      body: email.body,
      recipientEmail: lead.email,
      recipientName: `${lead.firstName} ${lead.lastName}`,
      // ...
    }),
  });
  
  if (response.ok) {
    // Mark lead as sent
    updateLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: "sent" } : l))
    );
  }
}
```

## How It Works

### Email Sending Flow

1. **User clicks "Start Sending"**
   - Frontend filters leads with status "approved"
   - Initiates sequential sending process

2. **For each approved lead**:
   - Retrieves generated email from state
   - Calls `/api/send-email` with email details
   - Waits for response

3. **API processes request**:
   - Validates required fields
   - Converts plain text body to HTML
   - Creates message in Everlytic
   - Triggers send action
   - Returns result

4. **Frontend updates UI**:
   - Marks lead as "sent" on success
   - Updates progress bar
   - Logs errors for failed sends
   - Continues to next lead

5. **Completion**:
   - All approved leads processed
   - Progress shows 100%
   - Sending state reset

### Email Format Conversion

Plain text email body is converted to HTML:

**Input** (plain text):
```
Hi John,

I read your recent post about AI. It resonated with me.

I am with Burn Media Group...

Best,
Nompilo
```

**Output** (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Subject Line</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6;">
  <p>Hi John,</p>
  <p>I read your recent post about AI. It resonated with me.</p>
  <p>I am with Burn Media Group...</p>
  <p>Best,</p>
  <p>Nompilo</p>
</body>
</html>
```

### Rate Limiting

Delay between sends is calculated based on batch size:
```typescript
const delayMs = Math.max(100, Math.floor(1000 / (batchSize / 10)));
await new Promise((resolve) => setTimeout(resolve, delayMs));
```

**Examples**:
- Batch size 20: ~500ms delay
- Batch size 50: ~200ms delay
- Batch size 100: ~100ms delay

This ensures:
- Everlytic API isn't overwhelmed
- Sender reputation is protected
- Rate limits are respected

## Everlytic API Details

### Authentication
Uses HTTP Basic Authentication:
```
Authorization: Basic base64(username:apiKey)
```

### Create Message Endpoint
**URL**: `POST https://memeburn.everlytic.net/api/2.0/messages`

**Payload**:
```json
{
  "type": "email",
  "subject": "Email subject",
  "from_email": "nompilo@mambaonline.com",
  "from_name": "Nompilo Gwala - Burn Media Group",
  "reply_email": "nompilo@mambaonline.com",
  "html_original": "<html>...</html>",
  "text_original": "Plain text version",
  "list_ids": "4",
  "track_links": "yes",
  "track_reads": "yes",
  "inline_css": "yes",
  "insert_unsubscribe_link": "yes"
}
```

**Response**:
```json
{
  "item": {
    "id": 34,
    "hash": "UkNKbjGke1IJ4e3N",
    "status": "prepare"
  }
}
```

### Send Message Endpoint
**URL**: `POST https://memeburn.everlytic.net/api/2.0/email_actions/send/:id`

**Payload**: `{}` (empty object)

**Response**:
```json
{
  "item": {
    "id": 34,
    "status": "sent",
    "total_to_be_queued": 1
  }
}
```

## Configuration

### Default Values

**From Email**: `nompilo@mambaonline.com`  
**From Name**: `Nompilo Gwala - Burn Media Group`  
**Reply Email**: `nompilo@mambaonline.com`  
**List ID**: `4` (from Everlytic example)

These can be overridden in the API request if needed.

### Email Tracking

Enabled by default:
- **Link tracking**: `yes`
- **Read tracking**: `yes`
- **Inline CSS**: `yes`
- **Unsubscribe link**: `yes`

## Error Handling

### API Route Errors

1. **Missing credentials**:
   ```json
   { "error": "Everlytic credentials not configured" }
   ```
   Status: 500

2. **Missing required fields**:
   ```json
   { "error": "Missing required fields: subject, body, recipientEmail" }
   ```
   Status: 400

3. **Everlytic API failure**:
   ```json
   { 
     "error": "Failed to create message: Bad Request",
     "details": "..."
   }
   ```
   Status: 4xx/5xx

### Frontend Error Handling

- Logs errors to console
- Continues to next lead
- Doesn't stop entire batch on single failure
- Updates progress regardless of success/failure

## Testing

### Manual Testing Checklist

- [ ] **Environment Setup**
  - [ ] Verify `.env.local` has all Everlytic credentials
  - [ ] Confirm API URL is correct
  - [ ] Test credentials with Everlytic API directly

- [ ] **Email Generation**
  - [ ] Generate emails for test leads
  - [ ] Approve emails for sending
  - [ ] Verify email content looks correct

- [ ] **Sending Process**
  - [ ] Click "Start Sending"
  - [ ] Verify progress bar updates
  - [ ] Check console for API responses
  - [ ] Confirm leads marked as "sent"

- [ ] **Email Delivery**
  - [ ] Check recipient inbox
  - [ ] Verify email formatting
  - [ ] Test links and tracking
  - [ ] Confirm unsubscribe link present

- [ ] **Error Scenarios**
  - [ ] Test with invalid email address
  - [ ] Test with missing credentials
  - [ ] Test with network failure
  - [ ] Verify error logging

### Test Leads

Use test email addresses for initial testing:
```typescript
{
  firstName: "Test",
  lastName: "User",
  email: "your-test-email@example.com",
  company: "Test Company"
}
```

### Everlytic Dashboard

Monitor sends in Everlytic:
1. Log in to https://memeburn.everlytic.net
2. Navigate to Messages
3. Check recent sends
4. View delivery status
5. Review analytics

## Security Considerations

### API Key Protection
- ✅ Stored in `.env.local` (not committed to git)
- ✅ Only accessible server-side
- ✅ Never exposed to client

### Email Validation
- ✅ Basic email format validation
- ✅ Required field validation
- ✅ Sanitization of HTML content

### Rate Limiting
- ✅ Configurable batch size
- ✅ Delay between sends
- ✅ Stop functionality

### Authentication
- ✅ HTTP Basic Auth with Everlytic
- ✅ Credentials in environment variables
- ✅ Base64 encoding for auth header

## Monitoring

### Metrics to Track

1. **Send Success Rate**
   - Total emails sent
   - Successful sends
   - Failed sends
   - Failure reasons

2. **Performance**
   - Average send time per email
   - Total batch send time
   - API response times

3. **Delivery Metrics** (from Everlytic)
   - Delivery rate
   - Open rate
   - Click rate
   - Bounce rate
   - Unsubscribe rate

### Logging

Current logging:
```typescript
console.log('Creating Everlytic message:', { subject, recipientEmail });
console.log('Everlytic message created:', messageId);
console.log('Sending Everlytic message:', messageId);
console.log('Everlytic message sent successfully:', messageId);
console.error('Everlytic create message failed:', errorText);
console.error('Everlytic send message failed:', errorText);
```

## Troubleshooting

### Common Issues

**Issue**: "Everlytic credentials not configured"  
**Solution**: Check `.env.local` has all three variables set

**Issue**: "Failed to create message: 401 Unauthorized"  
**Solution**: Verify username and API key are correct

**Issue**: "Failed to send message: 404 Not Found"  
**Solution**: Check message was created successfully, verify message ID

**Issue**: Emails not arriving  
**Solution**: 
- Check Everlytic dashboard for send status
- Verify recipient email is valid
- Check spam folder
- Review Everlytic logs

**Issue**: Slow sending  
**Solution**: Increase batch size in UI (default: 20)

## Future Enhancements

### Potential Improvements

1. **Batch API Calls**
   - Send multiple emails in one API call
   - Reduce API overhead
   - Faster overall sending

2. **Retry Logic**
   - Automatic retry on failure
   - Exponential backoff
   - Max retry attempts

3. **Email Templates**
   - Store templates in Everlytic
   - Reference template ID instead of HTML
   - Easier template management

4. **Advanced Tracking**
   - Custom analytics tags
   - UTM parameters
   - Campaign grouping

5. **Scheduling**
   - Schedule sends for specific time
   - Timezone support
   - Recurring campaigns

6. **List Management**
   - Create lists dynamically
   - Segment recipients
   - Manage subscriptions

7. **Webhook Integration**
   - Receive delivery notifications
   - Track opens/clicks in real-time
   - Update lead status automatically

## Related Documentation

- Everlytic API Docs: https://developers.everlytic.com/
- `SALESMATTER_PROMPT_UPDATE.md` - Email generation prompt
- `JSON_PARSING_FIX.md` - Email parsing logic
- `EM_DASH_REMOVAL.md` - Email formatting rules

## Support

For Everlytic API issues:
- Documentation: https://developers.everlytic.com/
- Support: Check Everlytic dashboard for support options
- API Status: Monitor Everlytic service status

For SalesMatter issues:
- Check console logs for errors
- Review API route logs
- Test with Postman/curl directly
- Verify environment variables
