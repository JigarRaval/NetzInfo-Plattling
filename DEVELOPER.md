# Developer Documentation

## Local Development Setup

### Prerequisites
- Node.js 20 or higher
- npm or yarn

### Installation

```bash
# Install dependencies for both server and client
npm run setup
```

### Running the Application

#### Single Process (Simple)
```bash
npm start
# Serves API + app on http://localhost:4000
```

#### Development with Hot Reload (Two Terminals)

**Terminal 1 - API:**
```bash
npm run dev:api
# API on :4000
```

**Terminal 2 - Web:**
```bash
npm run dev:web
# UI on :5173, proxies /api to :4000
```

### Local Network Access

The app is configured to be accessible from devices on the same Wi-Fi network or through a tunnel.

#### Access from Local Network
1. Find your local IP address (e.g., 192.168.1.100)
2. Access the app from your phone at: `http://YOUR_IP:4000`
3. Note: Microphone and location features require HTTPS for production use

#### Using a Tunnel (for testing HTTPS features)
```bash
# Using localtunnel (example - replace with your preferred tunnel service)
npx localtunnel --port 4000
```

This provides a public HTTPS URL that can be used to test microphone and location features.

### Database

The application uses a JSON file database (`server/data/db.json`) by default. This requires no database installation and works offline.

To use a custom database file:
```bash
# Set DATA_FILE environment variable
DATA_FILE=/path/to/custom/db.json node server/index.js
```

### Environment Variables

Copy `server/.env.example` to `server/.env` and configure:

```bash
cp server/.env.example server/.env
```

Key environment variables:
- `PORT`: Server port (default: 4000)
- `PUBLIC_BASE_URL`: Public base URL for RSS feed (HTTPS only in production)
- `WORKERS`: Worker accounts with personal PINs
- `HEIMATINFO_ORG_ID`: Heimat-Info organization ID
- `HEIMATINFO_API_KEY`: Heimat-Info API key

### Testing

Run the quality guard:
```bash
npm run check
```

This checks:
1. Translation completeness (227 keys × 4 languages)
2. Keys used in the interface
3. Hardcoded text detection
4. CSS class validation

### Building for Production

```bash
npm run build
```

This builds the React frontend to `client/dist/`.

### Demo Data

To seed demo data for development:
```bash
# The demo data is automatically seeded when the server starts
# without any existing data. To reset to demo state:
node server/seed/demo.js
```

To clear all data (production state):
```bash
# Manually delete or clear server/data/db.json
# Or run the reset script (see below)
```

### Reset to Empty Production State

```bash
# Clear all incidents, drafts, publications, and outbox
# Replace with empty arrays
echo '{"incidents":[],"drafts":[],"publications":[],"outbox":[]}' > server/data/db.json
```

### Heimat-Info Integration

1. Get credentials from the challenge organizers
2. Open the Connect screen in the app
3. Paste in the organization ID and API key
4. Press "Test connection"
5. Set status to "Draft" for testing, "Published" for production

For more details, see `CHANNELS.md`.

## Project Structure

```
Stadtwerke/
├── client/                 # React frontend
│   ├── src/
│   │   ├── i18n/          # Internationalization
│   │   ├── lib/           # Utilities (API, format, clock)
│   │   ├── screens/       # UI screens
│   │   ├── ui/            # UI components
│   │   └── styles.css     # Design system
│   └── package.json
├── server/                # Express backend
│   ├── channels/          # Publication channels
│   ├── core/              # Business logic
│   ├── data/              # Master data
│   ├── lib/               # Server utilities
│   ├── routes/            # API routes
│   ├── seed/              # Demo data
│   ├── config.js          # Configuration
│   └── index.js           # Server entry point
└── package.json           # Root package.json
```

## Architecture

The application follows a clean separation of concerns:

- **Frontend**: React SPA that talks to the backend via `/api/*` endpoints
- **Backend**: Express API that handles auth, incidents, drafts, and publishing
- **Database**: JSON file store (can be swapped for MongoDB/PostgreSQL)
- **Channels**: Parallel fan-out to multiple publication channels

## Security Notes

- PINs are stored in plaintext in `server/.env` (will be migrated to hashed storage in production)
- Sessions are stored in memory (restarts clear all sessions)
- No secrets should be committed to version control
- Use environment variables for all sensitive configuration

## Troubleshooting

### Microphone/Location Not Working
- These features require HTTPS in production
- For local development, use `localhost` or a tunnel service
- Check browser console for permission errors

### Heimat-Info Not Publishing
- Verify credentials are correct
- Check that status is set to "Published" (not "Draft")
- Check the Connect screen for error messages
- Review server logs for API errors

### RSS Feed Shows Old Domain
- Set `PUBLIC_BASE_URL` environment variable
- Restart the server after changing environment variables
- Check that the URL uses HTTPS

## Contributing

1. Keep the code style consistent
2. Run `npm run check` before committing
3. Test in all four languages (DE, EN, FR, ES)
4. Ensure accessibility (WCAG 2.2 AA target)
