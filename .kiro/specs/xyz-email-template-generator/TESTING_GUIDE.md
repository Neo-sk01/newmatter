# Everlytic Integration Testing Guide

## Quick Test Route

A dedicated test endpoint has been created to easily verify the Everlytic integration without using the full UI.

### Endpoint
```
POST /api/test-email
```

## Usage

### 1. View Test Instructions (GET)

```bash
curl http://localhost:3000/api/test-email
```

This returns configuration status and usage examples.

### 2. Send Test Email (POST)

#### Basic Test (uses defaults)
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Custom Recipient
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "your-email@example.com",
    "recipientName": "Your Name"
  }'
```

#### Using JavaScript/Fetch
```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientEmail: 'your-email@example.com',
    recipientName: 'Your Name'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Test result:', data);
  if (data.success) {
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', data.details.messageId);
    console.log('Check inbox:', data.details.recipient);
  } else {
    console.error('❌ Test failed:', data.error);
  }
});
```

#### Using Postman
1. Create new POST request
2. URL: `http://localhost:3000/api/test-email`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "recipientEmail": "your-email@example.com",
  "recipientName": "Your Name"
}
```
5. Click Send

## Request Parameters

All parameters are optional and have defaults:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `recipientEmail` | string | `test@example.com` | Email address to send test to |
| `recipientName` | string | `Test User` | Name of recipient |

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Test email sent successfully via Everlytic",
  "details": {
    "messageId": 34,
    "recipient": "your-email@example.com",
    "subject": "Test Email from SalesMatter - Everlytic Integration",
    "status": "sent",
    "timestamp": "2025-01-19T10:30:00.000Z",
    "everlyticUrl": "https://memeburn.everlytic.net"
  },
  "instructions": "Check the recipient inbox to verify delivery...",
  "dashboardUrl": "https://memeburn.everlytic.net/messages"
}
```

### Error Response
```json
{
  "error": "Failed to create message in Everlytic",
  "status": 401,
  "statusText": "Unauthorized",
  "details": "Invalid credentials",
  "credentials": {
    "url": "https://memeburn.everlytic.net",
    "username": "administrator",
    "apiKeyLength": 36
  }
}
```

## Test Email Content

The test email includes:
- **Subject**: "Test Email from SalesMatter - Everlytic Integration"
- **From**: SalesMatter Test System (nompilo@mambaonline.com)
- **Content**: 
  - Confirmation message
  - Test details (timestamp, recipient, integration info)
  - Styled HTML format
  - Plain text version

## Verification Steps

### 1. Check Console Logs
The test route logs detailed information:
```
=== Everlytic Test Email ===
URL: https://memeburn.everlytic.net
Username: administrator
Recipient: your-email@example.com
Creating message...
Payload: {...}
Create response status: 200
Create response body: {...}
✅ Message created successfully: 34
Sending message...
Send response status: 200
Send response body: {...}
✅ Email sent successfully!
=== Test Complete ===
```

### 2. Check Recipient Inbox
- Look for email from "SalesMatter Test System"
- Subject: "Test Email from SalesMatter - Everlytic Integration"
- Verify HTML formatting
- Check all content is present

### 3. Check Everlytic Dashboard
1. Go to https://memeburn.everlytic.net
2. Log in with your credentials
3. Navigate to Messages
4. Find the test message by ID or subject
5. Check send status and analytics

## Troubleshooting

### Error: "Everlytic credentials not configured"

**Problem**: Environment variables missing

**Solution**: Check `.env.local` has:
```bash
EVERLYTIC_API_URL=https://memeburn.everlytic.net
EVERLYTIC_USERNAME=administrator
EVERLYTIC_API_KEY=hqBBItQVBTcfr1JFJB36rewqubwEUQlV_2
```

**Verify**:
```bash
curl http://localhost:3000/api/test-email
```
Check the `configuration` object in response.

### Error: "Failed to create message: 401 Unauthorized"

**Problem**: Invalid credentials

**Solution**:
1. Verify username is correct
2. Verify API key is correct
3. Check API key hasn't expired
4. Test credentials directly with Everlytic API

**Test credentials**:
```bash
curl -X GET https://memeburn.everlytic.net/api/2.0/messages \
  -H "Authorization: Basic $(echo -n 'administrator:YOUR_API_KEY' | base64)"
```

### Error: "Failed to send message: 404 Not Found"

**Problem**: Message ID not found

**Possible causes**:
- Message creation failed silently
- Message was deleted
- Wrong API endpoint

**Solution**: Check console logs for message creation step

### Email Not Arriving

**Possible causes**:
1. Email in spam folder
2. Invalid recipient email
3. Everlytic delivery issue
4. Email server blocking

**Steps**:
1. Check spam/junk folder
2. Verify email address is correct
3. Check Everlytic dashboard for delivery status
4. Review Everlytic logs for bounces

### Slow Response

**Normal**: First request may take 2-5 seconds
- Creating message in Everlytic
- Triggering send action
- Network latency

**If consistently slow** (>10 seconds):
- Check network connection
- Verify Everlytic API status
- Check server logs for errors

## Testing Checklist

Use this checklist to verify the integration:

- [ ] **Configuration**
  - [ ] Environment variables set
  - [ ] GET request shows all configured
  - [ ] No "NOT CONFIGURED" in response

- [ ] **Basic Test**
  - [ ] POST with empty body succeeds
  - [ ] Returns success: true
  - [ ] Returns message ID
  - [ ] Console shows detailed logs

- [ ] **Custom Recipient**
  - [ ] POST with custom email succeeds
  - [ ] Email arrives at specified address
  - [ ] Recipient name appears in email

- [ ] **Email Content**
  - [ ] Subject line correct
  - [ ] HTML formatting works
  - [ ] All content present
  - [ ] Unsubscribe link included

- [ ] **Everlytic Dashboard**
  - [ ] Message appears in dashboard
  - [ ] Status shows "sent"
  - [ ] Analytics tracking works
  - [ ] No errors in logs

- [ ] **Error Handling**
  - [ ] Invalid email returns error
  - [ ] Missing credentials returns error
  - [ ] Network failure handled gracefully

## Advanced Testing

### Test Multiple Recipients

Send to multiple addresses to verify consistency:
```bash
for email in test1@example.com test2@example.com test3@example.com; do
  curl -X POST http://localhost:3000/api/test-email \
    -H "Content-Type: application/json" \
    -d "{\"recipientEmail\": \"$email\"}"
  sleep 2
done
```

### Test Rate Limiting

Send multiple emails quickly to test rate limits:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/test-email \
    -H "Content-Type: application/json" \
    -d '{"recipientEmail": "test@example.com"}' &
done
wait
```

### Test Error Scenarios

**Invalid credentials**:
```bash
# Temporarily change API key in .env.local to invalid value
# Then run test
curl -X POST http://localhost:3000/api/test-email
```

**Invalid email**:
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail": "invalid-email"}'
```

## Integration with Main App

Once testing is successful:

1. **Verify credentials work**: ✅
2. **Verify email delivery**: ✅
3. **Test with real lead data**: Use UI to generate and send
4. **Monitor Everlytic dashboard**: Check all sends
5. **Review analytics**: Track opens, clicks, bounces

## Next Steps

After successful testing:

1. **Update sender details** if needed (in `/api/send-email/route.ts`)
2. **Configure list IDs** for different campaigns
3. **Set up webhooks** for delivery notifications (optional)
4. **Monitor send limits** in Everlytic
5. **Review analytics** regularly

## Support

### Everlytic Support
- Dashboard: https://memeburn.everlytic.net
- API Docs: https://developers.everlytic.com/
- Check service status

### SalesMatter Support
- Check console logs: `npm run dev`
- Review API route: `src/app/api/test-email/route.ts`
- Test with curl/Postman first
- Verify environment variables

## Quick Reference

### Test Command
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail": "your-email@example.com"}'
```

### Check Configuration
```bash
curl http://localhost:3000/api/test-email
```

### View Logs
```bash
# Terminal running npm run dev
# Look for "=== Everlytic Test Email ===" section
```

### Everlytic Dashboard
```
https://memeburn.everlytic.net/messages
```
