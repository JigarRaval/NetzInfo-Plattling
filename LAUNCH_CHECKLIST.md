# Production Launch Checklist

This checklist ensures nothing is forgotten before launching Stadtwerke Plattling to production.

## Pre-Launch Checklist

### Configuration

- [ ] Fill in all environment variables in `server/.env`
  - [ ] `PORT` - Server port (default: 4000)
  - [ ] `PUBLIC_BASE_URL` - Production domain with HTTPS
  - [ ] `MONGODB_URI` - MongoDB connection string (if using MongoDB)
  - [ ] `DATA_FILE` - Custom database file path (if using JSON file)
  - [ ] `HEIMATINFO_ORG_ID` - Heimat-Info organization ID
  - [ ] `HEIMATINFO_API_KEY` - Heimat-Info API key
  - [ ] `HEIMATINFO_STATUS` - "Published" for production, "Draft" for testing
  - [ ] `HEIMATINFO_BASE_URL` - Heimat-Info API endpoint
  - [ ] `WORKERS` - Worker accounts with 6+ digit PINs
  - [ ] `AUTH_TEAM` - Team name displayed in app
  - [ ] `AUTH_MAX_ATTEMPTS` - Max login attempts (default: 5)
  - [ ] `AUTH_LOCK_MINUTES` - Lockout duration (default: 10)
  - [ ] `GEOCODING_URL` - Optional custom geocoding URL
  - [ ] `GEOCODING_AGENT` - User agent for geocoding requests
  - [ ] `AUTO_UPDATE_MINUTES` - Auto-update interval (default: 30)
  - [ ] `ALLOWED_ORIGINS` - CORS allowed origins

- [ ] Verify `.env` file is NOT committed to git
- [ ] Set `NODE_ENV=production` for production deployment
- [ ] Remove or disable demo data (use `npm run reset:production`)

### Worker Accounts

- [ ] Create worker accounts with unique IDs
- [ ] Assign 6+ digit PINs to each worker
- [ ] Avoid trivial PINs (111111, 123456, etc.)
- [ ] Test login with each worker account
- [ ] Verify PIN validation works
- [ ] Verify lockout mechanism works after failed attempts
- [ ] Document PIN reset process for workers

### Database

- [ ] If using MongoDB:
  - [ ] Set up MongoDB instance
  - [ ] Configure connection string in `.env`
  - [ ] Test connection
  - [ ] Set up backups
  - [ ] Configure indexes if needed

- [ ] If using JSON file:
  - [ ] Verify database file location
  - [ ] Set up file backups
  - [ ] Ensure file permissions are correct
  - [ ] Test file write access

### Heimat-Info Integration

- [ ] Obtain Heimat-Info credentials from organizers
- [ ] Test connection via Connect screen
- [ ] Verify organization ID is correct
- [ ] Verify API key is valid
- [ ] Set status to "Draft" for initial testing
- [ ] Set status to "Published" for production
- [ ] Test post creation with sample incident
- [ ] Verify post appears on Heimat-Info platform
- [ ] Check HTML content validation (only h3 and p tags)

### SSL/HTTPS

- [ ] Obtain SSL certificate for production domain
- [ ] Configure HTTPS on server or load balancer
- [ ] Set `PUBLIC_BASE_URL` with https://
- [ ] Test app loads correctly with HTTPS
- [ ] Verify push notifications work with HTTPS
- [ ] Configure HSTS header (server does this automatically)

### DNS & Hosting

- [ ] Configure DNS records for production domain
- [ ] Set up hosting environment
- [ ] Configure reverse proxy if needed (nginx, Apache)
- [ ] Set up load balancer if needed
- [ ] Configure firewall rules
- [ ] Ensure port 4000 is accessible
- [ ] Test connectivity from external network

### Legal Pages

- [ ] Fill in Impressum with actual legal information
  - [ ] Company name and address
  - [ ] Contact information
  - [ ] Legal representative
  - [ ] Commercial register number
  - [ ] VAT ID
  - [ ] Responsible for content

- [ ] Fill in Datenschutz with actual privacy policy
  - [ ] Data collection practices
  - [ ] Data processing purposes
  - [ ] Data retention periods
  - [ ] User rights
  - [ ] Contact for privacy questions
  - [ ] Legal review if needed

- [ ] Fill in Barrierefreiheit with actual accessibility info
  - [ ] Compliance statement
  - [ ] Known limitations
  - [ ] Date of creation
  - [ ] Date of review
  - [ ] Contact for accessibility feedback

- [ ] Review all legal content with legal expert
- [ ] Ensure compliance with GDPR (DSGVO)
- [ ] Ensure compliance with BITV 2.0

### Monitoring & Logging

- [ ] Set up application monitoring
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up log aggregation
- [ ] Configure alerting for critical errors
- [ ] Monitor database performance
- [ ] Monitor API response times
- [ ] Set up uptime monitoring

### Backups

- [ ] Configure database backups
  - [ ] Daily automated backups
  - [ ] Backup retention policy
  - [ ] Backup location (offsite recommended)
  - [ ] Test backup restoration

- [ ] Configure file backups (if using JSON file)
- [ ] Document backup procedure
- [ ] Document restoration procedure

## Testing Checklist

### Functional Testing

- [ ] Login works with worker credentials
- [ ] PIN validation works (6+ digits, no trivial patterns)
- [ ] Lockout mechanism works after failed attempts
- [ ] Report incident flow works end-to-end
- [ ] Draft creation works
- [ ] Draft editing works
- [ ] Message composition works in all 4 languages
- [ ] Quality checks run correctly
- [ ] Approval flow works
- [ ] Publication to all channels works
- [ ] Incident resolution works
- [ ] All-clear publication works
- [ ] Profile editing works
- [ ] Logout works

### Channel Testing

- [ ] Status page displays incidents correctly
- [ ] RSS feed is accessible at `/feed.xml`
- [ ] RSS feed uses HTTPS URLs
- [ ] RSS feed validates as XML
- [ ] Widget loads in iframe
- [ ] Widget auto-updates
- [ ] Push notifications work (requires HTTPS)
- [ ] Heimat-Info publishes successfully
- [ ] Heimat-Info post appears on platform
- [ ] All channels return correct status

### UI/UX Testing

- [ ] App loads correctly on desktop browsers
- [ ] App loads correctly on mobile browsers
- [ ] Responsive design works on all screen sizes
- [ ] Touch interactions work on mobile
- [ ] Language switcher works (DE, EN, FR, ES)
- [ ] Theme switcher works (light/dark)
- [ ] Navigation works correctly
- [ ] Forms are accessible with keyboard
- [ ] Screen reader announces elements correctly
- [ ] Empty states show helpful messages
- [ ] Loading states show indicators
- [ ] Error states show actionable feedback

### Accessibility Testing

- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test with keyboard only (no mouse)
- [ ] Test color contrast ratios
- [ ] Test text scaling (200% zoom)
- [ ] Test with browser zoom
- [ ] Verify all images have alt text
- [ ] Verify all forms have labels
- [ ] Verify focus indicators are visible
- [ ] Test skip links if implemented
- [ ] Test with accessibility tools (WAVE, axe)

### Performance Testing

- [ ] Load time under 3 seconds on 3G
- [ ] Load time under 1 second on 4G
- [ ] Lighthouse score > 90
- [ ] No blocking resources
- [ ] Images optimized
- [ ] JavaScript minified
- [ ] CSS minified
- [ ] Gzip/brotli compression enabled
- [ ] CDN configured (if applicable)

### Security Testing

- [ ] Verify security headers are present
  - [ ] Content-Security-Policy
  - [ ] X-Content-Type-Options
  - [ ] X-Frame-Options (or CSP frame-ancestors)
  - [ ] X-XSS-Protection
  - [ ] Strict-Transport-Security (HTTPS only)
  - [ ] Referrer-Policy
  - [ ] Permissions-Policy

- [ ] Test for XSS vulnerabilities
- [ ] Test for SQL injection (if using database)
- [ ] Test for CSRF protection
- [ ] Verify rate limiting works
- [ ] Verify input validation works
- [ ] Test with common attack vectors
- [ ] Run security scan (e.g., OWASP ZAP)

### Integration Testing

- [ ] Test Heimat-Info API with real credentials
- [ ] Test geocoding service
- [ ] Test auto-update scheduler
- [ ] Test push notification service
- [ ] Test RSS feed generation
- [ ] Test widget rendering

### Cross-Browser Testing

- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on Edge (latest)
- [ ] Test on mobile Safari (iOS)
- [ ] Test on mobile Chrome (Android)

## Post-Launch Checklist

### Monitoring

- [ ] Verify application is running
- [ ] Verify database connection is healthy
- [ ] Verify all channels are working
- [ ] Check error logs for issues
- [ ] Monitor response times
- [ ] Monitor user activity
- [ ] Monitor resource usage (CPU, memory, disk)

### Verification

- [ ] Access public page as anonymous user
- [ ] Access admin features as worker
- [ ] Create test incident
- [ ] Publish test incident
- [ ] Verify all channels received publication
- [ ] Resolve test incident
- [ ] Verify all-clear publication
- [ ] Check Heimat-Info platform for test post
- [ ] Remove test data if needed

### Documentation

- [ ] Update documentation with production URLs
- [ ] Document worker credentials (secure storage)
- [ ] Document backup procedures
- [ ] Document incident response procedures
- [ ] Document escalation procedures
- [ ] Share launch checklist with team
- [ ] Train workers on using the system
- [ ] Create user guide for workers

### Communication

- [ ] Notify stakeholders of launch
- [ ] Announce availability to users
- [ ] Provide user documentation
- [ ] Share contact information for support
- [ ] Communicate maintenance windows
- [ ] Set up support channel

### Ongoing Maintenance

- [ ] Schedule regular database backups
- [ ] Schedule regular dependency updates
- [ ] Schedule regular security scans
- [ ] Monitor for security vulnerabilities
- [ ] Review logs regularly
- [ ] Review performance metrics
- [ ] Plan for capacity scaling
- [ ] Document lessons learned

## Rollback Plan

If critical issues are discovered after launch:

- [ ] Identify the issue
- [ ] Determine rollback strategy
- [ ] Have previous version ready to deploy
- [ ] Test rollback procedure
- [ ] Document rollback steps
- [ ] Communicate rollback to stakeholders
- [ ] Execute rollback if necessary
- [ ] Verify system is stable after rollback

## Sign-Off

- [ ] Technical lead approval
- [ ] Project manager approval
- [ ] Legal review approval
- [ ] Security review approval
- [ ] Stakeholder approval
- [ ] Launch date confirmed
- [ ] Launch window confirmed

## Notes

Add any additional notes or observations here:

- ________________________________________________________________________
- ________________________________________________________________________
- ________________________________________________________________________
