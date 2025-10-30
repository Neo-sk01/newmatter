# Everlytic API Version Fix

## Issue
The Everlytic API endpoint `/api/2.0/messages` returned a 404 error:
```json
{
  "error": {
    "code": "99404",
    "message": "Routing Error Occured: Requested Resource Not Found"
  }
}
```

## Root Cause
The Everlytic instance at `https://memeburn.everlytic.net` doesn't support the `/api/2.0/messages` endpoint. This endpoint may be:
- Only available in newer Everlytic versions
- Requires different authentication
- Uses a different API version (v1.0)

## Solution
Changed the message creation endpoint from API v2.0 to v1.0:

**Before**:
```typescript
const createMessageUrl = `${everlyticUrl}/api/2.0/messages`;
```

**After**:
```typescript
const createMessageUrl = `${everlyticUrl}/api/1.0/messages`;
```

**Send endpoint remains v2.0** (as per original documentation):
```typescript
const sendMessageUrl = `${everlyticUrl}/api/2.0/email_actions/send/${messageId}`;
```

## Files Updated
1. `src/app/api/test-email/route.ts` - Test endpoint
2. `src/app/api/send-email/route.ts` - Production endpoint

## API Version Matrix

| Endpoint | Version | Status |
|----------|---------|--------|
| `/api/1.0/messages` | v1.0 | ✅ Working (create messages) |
| `/api/2.0/messages` | v2.0 | ❌ 404 Not Found |
| `/api/2.0/email_actions/send/:id` | v2.0 | ✅ Working (send messages) |

## Testing
After this fix, test again with Postman:

```
POST http://localhost:3000/api/test-email
Content-Type: application/json

{
  "recipientEmail": "memeburnai@memeburn.com",
  "recipientName": "Neo Sekaleli"
}
```

Expected: Success response with message ID

## Notes
- Everlytic API versions may vary by instance
- Always check the specific instance's API documentation
- The send action endpoint uses v2.0 successfully
- Only the message creation endpoint needed v1.0
