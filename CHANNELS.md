# Channel Configuration Guide

This document explains how to configure and troubleshoot the publication channels in Stadtwerke Plattling.

## Overview

Stadtwerke Plattling publishes outage notices to 5 channels in parallel:

1. **Status Page** - Internal dashboard for workers
2. **RSS 2.0 Feed** - Public XML feed for aggregators
3. **City Widget** - Embeddable HTML iframe for municipal website
4. **App Push** - Web push notifications to subscribed devices
5. **Heimat-Info REST API** - External platform integration

## Channel Configuration

### 1. Status Page

**Configuration:** Built-in, no external setup required.

**Purpose:** Internal dashboard showing all active and resolved incidents.

**Location:** `/` (home screen after login)

**Testing:**
- Login with worker credentials
- Navigate to Home screen
- Verify running incidents are displayed
- Verify resolved incidents are in history

**Troubleshooting:**
- If incidents don't appear: Check database connection
- If data is stale: Refresh the page or check server logs

---

### 2. RSS 2.0 Feed

**Configuration:** Requires `PUBLIC_BASE_URL` environment variable.

**Purpose:** Public XML feed for RSS readers and news aggregators.

**Location:** `/feed.xml`

**Environment Variables:**
```bash
PUBLIC_BASE_URL=https://your-domain.com
```

**Testing:**
```bash
curl https://your-domain.com/feed.xml
```

**Expected Output:**
- Valid RSS 2.0 XML structure
- Atom:link with correct URL
- Published incidents with full details
- Proper timestamps in ISO 8601 format

**Troubleshooting:**
- If URLs are http instead of https: Set `PUBLIC_BASE_URL` with https
- If feed is empty: Ensure incidents have been published (drafts not included)
- If XML is invalid: Check server logs for errors

---

### 3. City Widget

**Configuration:** No external setup required.

**Purpose:** Embeddable HTML iframe for municipal website.

**Location:** `/widget`

**Usage:**
```html
<iframe src="https://your-domain.com/widget" width="100%" height="400"></iframe>
```

**Features:**
- Responsive design
- Auto-updates every 5 minutes
- Shows only published incidents
- Branded with Stadtwerke Plattling logo

**Testing:**
- Open `/widget` in browser
- Verify layout is correct
- Verify incidents are displayed
- Test iframe embedding on external site

**Troubleshooting:**
- If widget doesn't load: Check CORS settings
- If styling is broken: Verify CSS is loading
- If incidents missing: Ensure they are published, not drafts

---

### 4. App Push Notifications

**Configuration:** VAPID keys are auto-generated on first run.

**Purpose:** Send push notifications to subscribed devices.

**Prerequisites:**
- HTTPS required (except localhost)
- Service worker must be registered
- User must grant notification permission

**VAPID Keys:**
- Generated automatically on server startup
- Stored in database
- Do not need to be manually configured

**Testing:**
1. Open app in browser (HTTPS or localhost)
2. Click bell icon in header
3. Grant notification permission
4. Create and publish an incident
5. Verify notification appears

**Troubleshooting:**
- If bell icon disabled: Check if HTTPS is enabled
- If permission denied: Clear browser notification settings
- If notifications not received: Check browser console for errors
- If service worker fails: Verify service worker is registered

---

### 5. Heimat-Info REST API

**Configuration:** Requires credentials from challenge organizers.

**Purpose:** Publish to external Heimat-Info platform.

**Environment Variables:**
```bash
HEIMATINFO_BASE_URL=https://heimatinfo-api-platform-dev.azurewebsites.net
HEIMATINFO_ORG_ID=your-organization-id
HEIMATINFO_API_KEY=your-api-key
HEIMATINFO_STATUS=Published  # or "Draft" for testing
```

**API Endpoint:**
```
POST /External/organizations/{organizationId}/posts
```

**Payload:**
```json
{
  "title": "Incident Title",
  "htmlContent": "<h3>Incident content</h3><p>Details...</p>",
  "status": "Published",
  "externalId": "incident-id"
}
```

**Testing:**
1. Open Connect screen in app
2. Enter organization ID and API key
3. Click "Test connection"
4. Verify connection successful
5. Create and publish an incident
6. Check Heimat-Info platform for post

**Troubleshooting:**
- If connection fails: Verify credentials are correct
- If post not visible: Check status is "Published" not "Draft"
- If HTML rejected: Ensure only `<h3>` and `<p>` tags are used
- If unauthorized: Verify API key is valid and not expired

**Important Notes:**
- Only `<h3>` and `<p>` HTML tags are allowed
- Scripts and iframes are rejected by the API
- Status defaults to "Published" in production
- Use "Draft" for testing to avoid public visibility

---

## Channel Health Monitoring

All channels return standardized status after publication:

```json
{
  "channel": "rss",
  "ok": true,
  "message": "Feed updated successfully",
  "details": "125 characters written"
}
```

**Check channel status in:**
- Approve screen (after publication)
- Send screen (channel results)
- Server logs

---

## Common Issues

### Issue: Channel fails to publish

**Possible causes:**
1. Invalid credentials (Heimat-Info)
2. Network connectivity issues
3. API endpoint down
4. Invalid configuration

**Solutions:**
1. Verify credentials in `.env` file
2. Check network connectivity
3. Test API endpoint manually
4. Review server logs for specific error

---

### Issue: Webhook receives no data

**Possible causes:**
1. `WEBHOOK_URL` not set
2. Webhook endpoint not accessible
3. Server not restarted after configuration change

**Solutions:**
1. Set `WEBHOOK_URL` in `.env`
2. Verify webhook endpoint is publicly accessible
3. Restart server to load new configuration

---

### Issue: RSS feed shows old domain

**Possible causes:**
1. `PUBLIC_BASE_URL` not set
2. Server not restarted after configuration change

**Solutions:**
1. Set `PUBLIC_BASE_URL` with https domain
2. Restart server to load new configuration

---

### Issue: Push notifications not working

**Possible causes:**
1. Not using HTTPS
2. Browser notification permission denied
3. Service worker not registered

**Solutions:**
1. Use HTTPS (or localhost for testing)
2. Grant notification permission in browser settings
3. Check browser console for service worker errors

---

## Security Considerations

1. **Never commit credentials to git** - `.env` file is in `.gitignore`
2. **Use HTTPS in production** - Required for push notifications
3. **Rotate API keys regularly** - Especially for Heimat-Info

---

## Performance

- All channels publish in parallel for speed
- Each channel has individual timeout (default: 30 seconds)
- Failed channels don't block other channels
- Total publication time: typically 2-5 seconds

---

## Logging

Channel publication is logged to server console:

```
[stadtwerke] Publishing to 5 channels...
[stadtwerke] rss: ok (125 chars)
[stadtwerke] widget: ok
[stadtwerke] push: 3 subscribers notified
[stadtwerke] heimatinfo: ok (post created)
```

---

## Testing Checklist

Before going to production:

- [ ] RSS feed accessible at `/feed.xml`
- [ ] RSS feed uses HTTPS URLs
- [ ] Widget loads correctly in iframe
- [ ] Push notifications work with HTTPS
- [ ] Heimat-Info connection test successful
- [ ] Webhook (if configured) receives data
- [ ] All channels return `ok: true` in status
- [ ] Server logs show no channel errors

---

## Additional Resources

- **API Documentation:** See `server/routes/api.js`
- **Channel Implementation:** See `server/channels/`
- **Configuration:** See `server/config.js`
- **Environment Variables:** See `server/.env.example`
