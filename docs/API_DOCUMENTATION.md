# API Documentation - StreamerX

## What is This Document?

This document explains how the **backend** (server-side) of StreamerX works. The backend handles things like:
- Checking if a user is logged in
- Saving data to the database
- Running scheduled tasks
- Connecting to external services (like Twitch or Kick)

**Do you need to read this?**
- 🟢 **Developers** who want to modify or extend StreamerX - YES
- 🟡 **Site Administrators** - Maybe, for troubleshooting
- 🔴 **Regular Users** - No, this is technical documentation

---

## Table of Contents

1. [Understanding the Basics](#understanding-the-basics)
2. [How Authentication Works](#how-authentication-works)
3. [Available API Endpoints](#available-api-endpoints)
   - [Admin Code Management](#1-admin-code-management)
   - [Stream Status Detection](#2-stream-status-detection)
   - [User Management](#3-user-management)
   - [Event Notifications](#4-event-notifications)
   - [Kick OAuth Integration](#5-kick-oauth-integration)
4. [Error Messages Explained](#error-messages-explained)
5. [Testing the API](#testing-the-api)
6. [Troubleshooting](#troubleshooting)

---

## Understanding the Basics

### What is an API?

Think of an API like a waiter in a restaurant:
- **You** (the website) tell the waiter what you want
- **The waiter** (API) goes to the kitchen (database/server)
- **The kitchen** prepares your order
- **The waiter** brings back your food (data)

In StreamerX, when you click "Login" or "Enter Giveaway," the website sends a request to the API, and the API sends back a response.

### What is an Endpoint?

An **endpoint** is a specific URL that does a specific thing. For example:
- `/admin-code` - Handles admin access codes
- `/check-stream-status` - Checks if a streamer is live

### What is a Request?

A **request** is a message you send to an endpoint. It usually includes:
- **Method**: What you want to do (GET = read, POST = create/update)
- **Headers**: Extra information (like who you are)
- **Body**: The actual data you're sending

### What is a Response?

A **response** is what the server sends back. It includes:
- **Status Code**: A number indicating success or failure (200 = OK, 400 = Error)
- **Data**: The information you asked for (usually in JSON format)

---

## How Authentication Works

Many API endpoints require you to be logged in. Here's how it works:

### Step 1: User Logs In

When a user enters their email and password, they get a **token** (a long string of random characters). Think of it like a wristband at a concert - it proves you're allowed to be there.

### Step 2: Token is Sent with Requests

Every time the website needs something from the API, it sends this token along. It's like showing your wristband to the security guard.

### Step 3: Server Verifies Token

The server checks if the token is valid and not expired. If it is, the request goes through. If not, you get an error.

### In Code (For Developers)

```javascript
// This happens automatically in StreamerX
// You don't need to write this yourself

// Getting the token
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token;

// Sending a request with the token
const response = await fetch('/api/some-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Available API Endpoints

### 1. Admin Code Management

**What it does:** Handles the special access codes that admins use to access the admin panel.

**Why it exists:** Adds an extra layer of security. Even if someone gets admin role, they still need to know the access code.

#### Checking if You Have a Code

**When to use:** When an admin first opens the admin panel, to see if they need to set a code.

**How to call it:**
```javascript
const result = await supabase.functions.invoke('admin-code', {
  body: { action: 'check' }
});

// Result looks like:
// { hasCode: true }  - Admin has set a code
// { hasCode: false } - Admin needs to set a code
```

#### Setting a New Code

**When to use:** When an admin sets their code for the first time, or wants to change it.

**Requirements:**
- ✅ Must be logged in as admin
- ✅ Code must be at least 6 characters

**How to call it:**
```javascript
const result = await supabase.functions.invoke('admin-code', {
  body: { 
    action: 'set', 
    code: 'my-secret-code-123'  // At least 6 characters
  }
});

// Result: { success: true }
```

**Security note:** The code is encrypted before saving. Nobody can see it, not even in the database.

#### Verifying a Code

**When to use:** When an admin enters their code to access the admin panel.

**How to call it:**
```javascript
const result = await supabase.functions.invoke('admin-code', {
  body: { 
    action: 'verify', 
    code: 'my-secret-code-123'
  }
});

// Result:
// { verified: true } - Correct code, let them in!
// { verified: false } - Wrong code, deny access
```

#### Common Errors

| Error Message | What It Means | How to Fix |
|---------------|---------------|------------|
| "No authorization header" | You're not logged in | Log in first |
| "Unauthorized" | Your login expired | Log in again |
| "Code must be at least 6 characters" | Code is too short | Use a longer code |
| "No access code found" | Admin hasn't set a code yet | Set a code first |

---

### 2. Stream Status Detection

**What it does:** Automatically checks if your Twitch or Kick channel is currently live streaming.

**Why it exists:** So your website can show a "LIVE NOW" banner or redirect users to your stream when you go live.

#### How It Works (Automatic)

1. A scheduled task runs every few minutes
2. It checks your configured streaming platform
3. If you're live, it updates the website
4. Visitors see a "Live Now" indicator!

#### Checking Manually

**When to use:** Usually you don't need to - it runs automatically. But you can trigger it manually for testing.

**How to call it:**
```javascript
const result = await supabase.functions.invoke('check-stream-status');

// Result when live:
// { is_live: true, platform: "twitch", checked_at: "2024-01-15T10:30:00Z" }

// Result when offline:
// { is_live: false, platform: "twitch", checked_at: "2024-01-15T10:30:00Z" }

// Result when auto-detect is disabled:
// { message: "Auto-detection is disabled", is_live: false }
```

#### Configuring Stream Detection

In the Admin Panel → Settings → Stream Settings:

| Setting | What to Enter |
|---------|---------------|
| **Platform** | "twitch" or "kick" |
| **Twitch Channel** | Your Twitch username (e.g., "xqc") |
| **Kick Channel** | Your Kick username (e.g., "trainwreckstv") |
| **Auto-detect Enabled** | Turn on/off automatic checking |

---

### 3. User Management

**What it does:** Allows admins to create, update, and delete user accounts.

**Why it exists:** For managing your community - creating accounts for team members, removing problematic users, etc.

**Who can use it:** Only users with the **admin** role.

#### Creating a New User

**When to use:** When you want to add a team member or manually create an account.

**How to call it:**
```javascript
const result = await supabase.functions.invoke('create-user', {
  body: {
    email: 'newteammember@example.com',
    password: 'SecurePassword123!',
    username: 'teammember',
    display_name: 'Team Member'
  }
});

// Result: { success: true, user: { id: "...", email: "..." } }
```

**Requirements:**
- ✅ Must be logged in as admin
- ✅ Email must be valid
- ✅ Password must be provided

#### Updating a User's Email

**When to use:** If a user needs to change their email and can't do it themselves.

**How to call it:**
```javascript
const result = await supabase.functions.invoke('create-user', {
  body: {
    action: 'update_email',
    user_id: 'the-users-id',
    new_email: 'newemail@example.com'
  }
});

// Result: { success: true, user: { id: "...", email: "newemail@example.com" } }
```

#### Deleting a User

**When to use:** When you need to completely remove a user and all their data.

**⚠️ Warning:** This cannot be undone! All user data is permanently deleted.

**How to call it:**
```javascript
const result = await supabase.functions.invoke('create-user', {
  body: {
    action: 'delete',
    user_id: 'the-users-id'
  }
});

// Result: { success: true }
```

**What gets deleted:**
- User account
- Profile information
- Giveaway entries
- Poll votes
- Comments and likes
- Achievements
- Notifications
- And all other user-related data

#### Common Errors

| Error Message | What It Means | How to Fix |
|---------------|---------------|------------|
| "Only admins can manage users" | You're not an admin | Ask an admin to do this |
| "user_id is required" | You forgot to specify which user | Add the user_id to your request |
| "Cannot delete yourself" | You're trying to delete your own account | Use the profile page instead, or ask another admin |
| "Email and password are required" | Missing info when creating user | Provide both email and password |

---

### 4. Event Notifications

**What it does:** Automatically sends notifications to users who subscribed to an event when it's about to start.

**Why it exists:** So your community doesn't miss important events! Users click "Remind Me" on an event, and they get notified when it starts.

#### How It Works (Automatic)

1. A scheduled task runs every minute
2. It finds events starting in the next 5 minutes
3. It sends notifications to all subscribed users
4. The subscription is removed (one-time notification)

**The notification says:**
> 🎬 **[Event Name] is starting soon!**
> The event "[Event Name]" on [Platform] starts at [Time]. Don't miss it!

#### Manual Trigger (For Testing)

You can trigger this manually to test:

```javascript
const result = await supabase.functions.invoke('event-notifications');

// Result:
// { message: "Event notifications processed", events_processed: 2, notifications_sent: 15 }

// Or if no events:
// { message: "No events starting soon", processed: 0 }
```

---

### 5. Kick OAuth Integration

**What it does:** Allows users to connect their Kick.com account to their StreamerX profile.

**Why it exists:** Users can link their Kick account to show their Kick username on their profile, and potentially for future features like subscriber verification.

#### How the Connection Process Works

**Step 1: User clicks "Connect Kick"**

Your code requests an authorization URL:

```javascript
// This gets the URL to redirect the user to
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/kick-oauth?action=authorize&frontend_url=${window.location.origin}`
);
const { authorize_url } = await response.json();

// Now redirect the user to Kick's login page
window.location.href = authorize_url;
```

**Step 2: User logs into Kick**

The user sees Kick's login page and approves the connection.

**Step 3: Kick redirects back**

Kick sends the user back to your website with their username.

The URL will look like:
```
https://yoursite.com/profile?kick_username=theirusername&kick_success=true
```

**Step 4: Save the username**

Your code reads the URL parameters and saves the username to the user's profile.

#### Alternative: Direct Link

If you already know the Kick username (maybe they typed it in), you can link directly:

```javascript
const result = await supabase.functions.invoke('kick-oauth', {
  body: {
    action: 'link',
    kick_username: 'theirusername',
    user_id: currentUser.id
  }
});

// Result: { success: true, kick_username: "theirusername" }
```

#### Setting Up Kick OAuth (Admin Setup Required)

To enable Kick login, you need to create an app on Kick's developer portal:

1. Go to Kick's developer settings (when available)
2. Create a new OAuth application
3. Set the redirect URL to: `https://YOUR-SUPABASE-PROJECT.supabase.co/functions/v1/kick-oauth?action=callback`
4. Copy the Client ID and Client Secret
5. Add them as secrets in your Supabase project:
   - `KICK_CLIENT_ID`
   - `KICK_CLIENT_SECRET`

#### Common Errors

| Error Message | What It Means | How to Fix |
|---------------|---------------|------------|
| "token_exchange_failed" | Couldn't get token from Kick | Try again, or check Kick credentials |
| "user_fetch_failed" | Got token but couldn't get user info | Kick API might be down |
| "no_username" | Kick didn't return a username | User might not have a username set |
| "no_code" | Authorization was cancelled | User closed the Kick login window |

---

## Error Messages Explained

### HTTP Status Codes

Every response has a number code. Here's what they mean:

| Code | What It Means | Example |
|------|---------------|---------|
| **200** | ✅ Success! Everything worked. | Request completed successfully |
| **302** | ↪️ Redirect. Go to a different URL. | OAuth flow redirecting to Kick |
| **400** | ❌ Bad Request. You sent something wrong. | Missing required field |
| **401** | 🔒 Unauthorized. Not logged in. | Token expired or missing |
| **403** | 🚫 Forbidden. Logged in but not allowed. | Non-admin trying to delete user |
| **404** | 🔍 Not Found. Resource doesn't exist. | User ID doesn't exist |
| **500** | 💥 Server Error. Something broke. | Database connection failed |

### Error Response Format

When something goes wrong, you'll get a response like this:

```json
{
  "error": "Human-readable error message"
}
```

---

## Testing the API

### Using the Browser Console

You can test API calls right from your browser:

1. Open your website in the browser
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Paste this code and press Enter:

```javascript
// Check if stream is live
const { data, error } = await window.supabase.functions.invoke('check-stream-status');
console.log(data);
```

### Using cURL (Command Line)

If you prefer terminal commands:

```bash
# Check stream status (no auth required)
curl -X POST "https://YOUR-PROJECT.supabase.co/functions/v1/check-stream-status" \
  -H "Content-Type: application/json"

# With authentication (get token from browser first)
curl -X POST "https://YOUR-PROJECT.supabase.co/functions/v1/admin-code" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR-TOKEN-HERE" \
  -d '{"action": "check"}'
```

### Using Postman or Insomnia

These are free apps for testing APIs with a nice interface:

1. Download [Postman](https://www.postman.com/downloads/) or [Insomnia](https://insomnia.rest/download)
2. Create a new request
3. Set the URL (e.g., `https://YOUR-PROJECT.supabase.co/functions/v1/check-stream-status`)
4. Set the method (GET or POST)
5. Add headers if needed
6. Click Send!

---

## Troubleshooting

### "Unauthorized" or "No authorization header"

**Meaning:** You need to be logged in, or your login expired.

**Fix:**
1. Make sure you're logged in to the website
2. Try logging out and back in
3. Check that your code is including the authorization header

### "Only admins can manage users"

**Meaning:** The logged-in user doesn't have admin role.

**Fix:**
1. Verify the user has `admin` role in the `user_roles` table
2. Log out and back in to refresh permissions

### Function not responding

**Meaning:** The edge function might be having issues.

**Fix:**
1. Check if your Supabase project is running (check dashboard)
2. Look at the function logs in Supabase Dashboard → Edge Functions → Logs
3. Make sure all required environment variables are set

### CORS Errors

**Meaning:** The request is being blocked by browser security.

**Fix:** All StreamerX endpoints are configured to allow cross-origin requests. If you're seeing CORS errors:
1. Make sure you're using the correct URL
2. Check that your environment variables are correct
3. Try accessing from the actual domain instead of localhost

### "Function invocation failed"

**Meaning:** Something went wrong inside the function.

**Fix:**
1. Check the function logs in Supabase Dashboard
2. Make sure you're sending the correct data format
3. Verify all required secrets are configured

---

## Quick Reference

### All Endpoints Summary

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/admin-code` | POST | Yes (Admin) | Manage admin access codes |
| `/check-stream-status` | POST | No | Check if streamer is live |
| `/create-user` | POST | Yes (Admin) | Create/update/delete users |
| `/event-notifications` | POST | No | Send event reminders |
| `/kick-oauth` | GET/POST | Varies | Kick account linking |

### Required Environment Variables

| Variable | Where to Get It | Used By |
|----------|-----------------|---------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API | All functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | All functions |
| `KICK_CLIENT_ID` | Kick Developer Portal | kick-oauth |
| `KICK_CLIENT_SECRET` | Kick Developer Portal | kick-oauth |

---

## Need More Help?

- 📖 **README** - General project setup: [README.md](../README.md)
- 📚 **Project Docs** - Technical architecture: [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
- 🐛 **Found a bug?** - Open an issue on GitHub
- 💬 **Questions?** - Start a discussion on GitHub

---

*Last updated: December 2024*
