# API Documentation

## Overview

This document provides comprehensive documentation for all backend API endpoints (Edge Functions) available in the SlotSquad platform. All endpoints are served via Lovable Cloud and follow REST conventions.

**Base URL:** `https://mdckorxfleckrwjmcigw.supabase.co/functions/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin Code Management](#admin-code-management)
3. [Stream Status Detection](#stream-status-detection)
4. [User Management](#user-management)
5. [Event Notifications](#event-notifications)
6. [Kick OAuth Integration](#kick-oauth-integration)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

Most endpoints require authentication via JWT token. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

Tokens are automatically provided when users authenticate through the Supabase Auth system. Use the Supabase client to obtain tokens:

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## Admin Code Management

Manages secure 2FA-style access codes for admin panel entry.

### Endpoint

```
POST /admin-code
```

### Authentication

Required - JWT token with admin role

### Actions

#### Check if Code Exists

Checks if the authenticated user has an access code configured.

**Request:**
```json
{
  "action": "check"
}
```

**Response:**
```json
{
  "hasCode": true
}
```

#### Set Access Code

Creates or updates the user's admin access code. Codes are securely hashed with SHA-256 and salted.

**Request:**
```json
{
  "action": "set",
  "code": "your-secure-code"
}
```

**Validation:**
- Code must be at least 6 characters

**Response:**
```json
{
  "success": true
}
```

#### Verify Access Code

Verifies a provided code against the stored hash.

**Request:**
```json
{
  "action": "verify",
  "code": "your-secure-code"
}
```

**Response:**
```json
{
  "verified": true
}
```

### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 401 | No authorization header | Missing JWT token |
| 401 | Unauthorized | Invalid JWT token |
| 400 | Code must be at least 6 characters | Code too short |
| 400 | Invalid action | Unknown action parameter |
| 404 | No access code found | Code not set for user |

### Example Usage

```typescript
import { supabase } from "@/integrations/supabase/client";

// Check if code exists
const { data } = await supabase.functions.invoke('admin-code', {
  body: { action: 'check' }
});
console.log(data.hasCode); // true or false

// Set a new code
await supabase.functions.invoke('admin-code', {
  body: { action: 'set', code: 'my-secure-code-123' }
});

// Verify code
const { data: verifyResult } = await supabase.functions.invoke('admin-code', {
  body: { action: 'verify', code: 'my-secure-code-123' }
});
console.log(verifyResult.verified); // true or false
```

---

## Stream Status Detection

Automatically checks if configured Twitch or Kick channels are currently live streaming.

### Endpoint

```
POST /check-stream-status
```

### Authentication

Not required - Uses service role internally

### Description

This function:
1. Reads stream configuration from `site_settings`
2. Checks the configured platform (Twitch or Kick) for live status
3. Updates `site_settings` with current live status

### Request

No body required - function reads configuration from database.

```http
POST /check-stream-status
Content-Type: application/json
```

### Response

```json
{
  "is_live": true,
  "platform": "twitch",
  "checked_at": "2024-01-15T10:30:00.000Z"
}
```

### Response When Disabled

```json
{
  "message": "Auto-detection is disabled",
  "is_live": false
}
```

### Configuration

Set these values in `site_settings` table:

| Key | Type | Description |
|-----|------|-------------|
| `auto_detect_enabled` | boolean | Enable/disable auto-detection |
| `stream_platform` | string | "twitch" or "kick" |
| `twitch_channel` | string | Twitch channel username |
| `kick_channel` | string | Kick channel username |

### Database Updates

The function automatically updates these `site_settings` keys:
- `is_live` - Current live status
- `live_platform` - Which platform is live
- `last_check` - Timestamp of last check

### Cron Schedule

This function is designed to be called via scheduled cron job (every 1-5 minutes) for real-time stream detection.

### Example Usage

```typescript
// Manual trigger
const { data } = await supabase.functions.invoke('check-stream-status');
console.log(`Stream is ${data.is_live ? 'LIVE' : 'offline'} on ${data.platform}`);
```

---

## User Management

Admin-only endpoints for creating, updating, and deleting user accounts.

### Endpoint

```
POST /create-user
```

### Authentication

Required - JWT token with **admin** role only

### Actions

#### Create User

Creates a new user account with email confirmation.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "username": "newuser",
  "display_name": "New User"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "newuser@example.com"
  }
}
```

#### Update User Email

Changes a user's email address.

**Request:**
```json
{
  "action": "update_email",
  "user_id": "target-user-uuid",
  "new_email": "newemail@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "newemail@example.com"
  }
}
```

#### Delete User

Permanently deletes a user and all associated data.

**Request:**
```json
{
  "action": "delete",
  "user_id": "target-user-uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

**Cascade Deletions:**
The following data is automatically removed:
- User roles
- Profile
- Notification preferences
- Giveaway entries
- Poll votes
- GTW guesses
- User notifications
- User achievements
- Article likes
- Comment likes
- Video likes
- News comments

### Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Missing authorization header | No JWT provided |
| 401 | Invalid token | JWT verification failed |
| 403 | Only admins can manage users | Insufficient permissions |
| 400 | user_id is required | Missing required field |
| 400 | Cannot delete yourself | Self-deletion prevention |
| 400 | Email and password are required | Missing create fields |

### Example Usage

```typescript
// Create new user
const { data } = await supabase.functions.invoke('create-user', {
  body: {
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    username: 'newuser',
    display_name: 'New User'
  }
});

// Delete user
await supabase.functions.invoke('create-user', {
  body: {
    action: 'delete',
    user_id: 'user-uuid-to-delete'
  }
});
```

---

## Event Notifications

Sends notifications to users subscribed to upcoming events.

### Endpoint

```
POST /event-notifications
```

### Authentication

Not required - Uses service role internally (designed for cron jobs)

### Description

This function:
1. Finds events starting within the next 5 minutes
2. Sends in-app notifications to all subscribed users
3. Removes subscriptions after notification (one-time alert)

### Request

No body required.

```http
POST /event-notifications
Content-Type: application/json
```

### Response

```json
{
  "message": "Event notifications processed",
  "events_processed": 2,
  "notifications_sent": 15
}
```

### Response When No Events

```json
{
  "message": "No events starting soon",
  "processed": 0
}
```

### Notification Format

Users receive notifications with:
- **Title:** `🎬 {Event Title} is starting soon!`
- **Message:** `The event "{title}" on {platform} starts at {time}. Don't miss it!`
- **Type:** `event`
- **Link:** `/events`

### Cron Schedule

Recommended: Run every 1 minute to ensure timely notifications.

```sql
-- Example cron setup (via pg_cron)
SELECT cron.schedule('event-notifications', '* * * * *', 'SELECT net.http_post(...)');
```

---

## Kick OAuth Integration

Handles OAuth 2.0 authentication flow with Kick.com for profile linking.

### Endpoint

```
GET/POST /kick-oauth
```

### Authentication

Varies by action (see below)

### Actions

#### Generate Authorization URL

Initiates the OAuth flow by generating a Kick authorization URL.

**Endpoint:** `GET /kick-oauth?action=authorize`

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `action` | Yes | Must be "authorize" |
| `frontend_url` | No | Callback destination (default: localhost:8080) |
| `callback_base` | No | HTTPS base URL for OAuth callback |

**Response:**
```json
{
  "authorize_url": "https://id.kick.com/oauth/authorize?...",
  "state": "base64-encoded-state",
  "callback_url": "https://your-domain/functions/v1/kick-oauth?action=callback"
}
```

**Usage:**
Redirect the user to `authorize_url` to begin OAuth flow.

#### OAuth Callback

Handles the OAuth callback from Kick. **Not called directly by frontend.**

**Endpoint:** `GET /kick-oauth?action=callback`

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `code` | Authorization code from Kick |
| `state` | State parameter for CSRF protection |
| `error` | Error message if authorization failed |

**Behavior:**
1. Exchanges code for access token
2. Fetches Kick user profile
3. Redirects to frontend with username or error

**Success Redirect:**
```
{frontend_url}/profile?kick_username={username}&kick_success=true
```

**Error Redirect:**
```
{frontend_url}/profile?kick_error={error_code}
```

#### Link Kick Account

Directly links a Kick username to a user's profile.

**Endpoint:** `POST /kick-oauth?action=link`

**Authentication:** Required

**Request:**
```json
{
  "kick_username": "kickuser123",
  "user_id": "supabase-user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "kick_username": "kickuser123"
}
```

### Environment Variables Required

| Variable | Description |
|----------|-------------|
| `KICK_CLIENT_ID` | Kick OAuth application client ID |
| `KICK_CLIENT_SECRET` | Kick OAuth application client secret |

### Error Responses

| Error Code | Description |
|------------|-------------|
| `token_exchange_failed` | Failed to exchange code for token |
| `user_fetch_failed` | Failed to fetch Kick user info |
| `no_username` | Kick API didn't return username |
| `no_code` | No authorization code received |

### Example Usage

```typescript
// Step 1: Get authorization URL
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/kick-oauth?action=authorize&frontend_url=${window.location.origin}`
);
const { authorize_url } = await response.json();

// Step 2: Redirect user
window.location.href = authorize_url;

// Step 3: Handle callback (automatic redirect back to /profile)
// The kick_username will be in URL params

// Alternative: Direct link (if username obtained elsewhere)
await supabase.functions.invoke('kick-oauth?action=link', {
  body: {
    kick_username: 'myKickUsername',
    user_id: session.user.id
  }
});
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 302 | Redirect (OAuth flows) |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

### Error Handling Best Practices

```typescript
try {
  const { data, error } = await supabase.functions.invoke('endpoint-name', {
    body: { ... }
  });
  
  if (error) {
    console.error('Function error:', error.message);
    // Handle error appropriately
    return;
  }
  
  // Process successful response
  console.log(data);
} catch (e) {
  console.error('Network error:', e);
}
```

---

## Rate Limiting

Currently, no explicit rate limiting is enforced on edge functions. However:

- Supabase applies default rate limits at the infrastructure level
- Abuse detection may temporarily block excessive requests
- Consider implementing client-side debouncing for user-triggered actions

### Recommended Client-Side Patterns

```typescript
// Debounce rapid requests
import { debounce } from 'lodash';

const checkStreamStatus = debounce(async () => {
  await supabase.functions.invoke('check-stream-status');
}, 5000);

// Prevent duplicate submissions
let isSubmitting = false;
async function submitAction() {
  if (isSubmitting) return;
  isSubmitting = true;
  try {
    await supabase.functions.invoke('endpoint');
  } finally {
    isSubmitting = false;
  }
}
```

---

## CORS Configuration

All endpoints include CORS headers for cross-origin requests:

```javascript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}
```

All endpoints handle `OPTIONS` preflight requests automatically.

---

## SDK Reference

### Using the Supabase Client

The recommended way to call edge functions:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Simple POST request
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' }
});

// With custom headers
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' },
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Direct HTTP Calls

If not using the Supabase client:

```typescript
const response = await fetch(
  'https://mdckorxfleckrwjmcigw.supabase.co/functions/v1/function-name',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ key: 'value' })
  }
);

const data = await response.json();
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2024-12-20 | 1.0.0 | Initial API documentation |

---

## Support

For API issues or questions:
1. Check the console logs in browser developer tools
2. Review edge function logs in the backend dashboard
3. Ensure all required environment variables are configured
4. Verify JWT tokens are valid and not expired
