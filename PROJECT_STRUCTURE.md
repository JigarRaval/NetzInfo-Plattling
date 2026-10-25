# Stadtwerke Plattling - Project File Structure

## Root Directory
```
Stadtwerke/
├── .gitignore
├── netlify.toml (Netlify deployment configuration)
├── package.json (root package.json with scripts)
├── README.md (project overview)
├── DEVELOPER.md (developer documentation)
├── PRODUCTION_READINESS_SUMMARY.md (production status)
├── CHANNELS.md (channel configuration guide)
├── LAUNCH_CHECKLIST.md (launch checklist)
├── TRANSLATION_REVIEW.md (translation status)
└── PROJECT_STRUCTURE.md (this file)
```

## Client Directory (Frontend - React)
```
client/
├── dist/ (production build output)
│   ├── assets/
│   │   ├── index-CH-I4vv9.js
│   │   ├── index-ClV_PHzC.css
│   │   ├── leaflet-CIGW-MKW.css
│   │   └── leaflet-src-C73IhYjt.js
│   ├── icon.svg
│   ├── index.html
│   ├── manifest.webmanifest
│   └── sw.js (service worker)
├── public/ (static assets)
│   ├── icon.svg
│   ├── images/
│   │   └── plattling-logo.png
│   ├── manifest.webmanifest
│   └── sw.js (service worker)
├── src/
│   ├── App.jsx (main React application)
│   ├── main.jsx (React entry point)
│   ├── styles.css (global styles)
│   ├── i18n/ (internationalization)
│   │   ├── index.jsx
│   │   ├── manual.js
│   │   └── strings.js (main translation file)
│   ├── lib/ (utility libraries)
│   │   ├── api.js (API client)
│   │   ├── clock.js (time utilities)
│   │   └── format.js (formatting utilities)
│   ├── screens/ (page components)
│   │   ├── Approve.jsx (incident approval)
│   │   ├── Barrierefreiheit.jsx (accessibility statement)
│   │   ├── Connect.jsx (Heimat-Info connection)
│   │   ├── Dashboard.jsx (main dashboard)
│   │   ├── Datenschutz.jsx (privacy policy)
│   │   ├── Home.jsx (home page)
│   │   ├── Impressum.jsx (legal notice)
│   │   ├── IncidentDetail.jsx (incident details)
│   │   ├── Login.jsx (login screen)
│   │   ├── LoginEnhanced.jsx (enhanced login)
│   │   ├── Manual.jsx (manual page)
│   │   ├── Profile.jsx (user profile)
│   │   ├── Public.jsx (public status page)
│   │   ├── Report.jsx (incident reporting)
│   │   └── Send.jsx (message sending)
│   └── ui/ (UI components)
│       ├── DistrictMap.jsx (district map component)
│       ├── Footer.jsx (footer component)
│       ├── Icons.jsx (icon library)
│       ├── LocationPicker.jsx (location picker)
│       ├── Logo.jsx (logo component)
│       ├── MiniMap.jsx (mini map)
│       └── kit.jsx (UI kit components)
├── index.html (HTML template)
├── package.json (client dependencies)
├── package-lock.json
└── vite.config.js (Vite configuration)
```

## Server Directory (Backend - Express/Node)
```
server/
├── .env (environment configuration - not in git)
├── .env.example (environment template)
├── config.js (configuration loader)
├── index.js (Express application entry point)
├── package.json (server dependencies)
├── package-lock.json
├── channels/ (publication channels)
│   ├── heimatinfo.js (Heimat-Info integration)
│   └── registry.js (channel registry - 5 channels)
├── core/ (business logic)
│   ├── compose.js (message composition)
│   ├── faq.js (FAQ handling)
│   ├── incidents.js (incident management)
│   ├── quality.js (quality checks)
│   ├── scheduler.js (automatic updates)
│   └── severity.js (severity rules)
├── data/ (data files)
│   ├── catalog.js (master data catalog)
│   └── db.json (JSON database file)
├── lib/ (server libraries)
│   ├── auth.js (authentication & sessions)
│   ├── geocode.js (reverse geocoding)
│   ├── mongodb.js (MongoDB connection & schemas)
│   ├── push.js (push notifications)
│   ├── store-json.js (JSON file storage)
│   ├── store-mongo.js (MongoDB storage)
│   ├── store.js (storage abstraction layer)
│   └── time.js (time utilities)
├── routes/ (API routes)
│   └── api.js (Express router with all endpoints)
├── scripts/ (utility scripts)
│   ├── add-users.js (add users to MongoDB)
│   ├── reset-production.js (reset for production)
│   └── sync-workers.js (sync workers to MongoDB)
└── seed/ (database seeding)
    └── demo.js (demo data seeder)
```

## Scripts Directory (Root)
```
scripts/
├── check-i18n.mjs (translation completeness checker)
└── heimat-posts.mjs (Heimat-Info post management)
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS
- **Maps**: Leaflet
- **PWA**: Service Worker
- **Package Manager**: npm

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express
- **Databases**: 
  - MongoDB (primary, with Mongoose ODM)
  - JSON file (fallback)
- **Authentication**: Custom session-based with PIN
- **Package Manager**: npm

### Publication Channels
1. Public Status Page
2. RSS Feed
3. Widget (iframe embed)
4. Push Notifications
5. Heimat-Info (external platform)

### Languages Supported
- German (de)
- English (en)
- French (fr)
- Spanish (es)

## Key Configuration Files

### Environment Variables (server/.env)
- `PORT` - Server port (default: 4000)
- `MONGODB_URI` - MongoDB connection string
- `DATA_FILE` - JSON database file path
- `WORKERS` - Worker accounts (format: id:Name:pin;id:Name:pin)
- `HEIMATINFO_ORG_ID` - Heimat-Info organization ID
- `HEIMATINFO_API_KEY` - Heimat-Info API key
- `HEIMATINFO_STATUS` - Post status (Draft/Published)
- `AUTH_TEAM` - Team name
- `AUTH_MAX_ATTEMPTS` - Max login attempts
- `AUTH_LOCK_MINUTES` - Lockout duration
- `ALLOWED_ORIGINS` - CORS allowed origins
- `GEOCODING_URL` - Geocoding service URL
- `AUTO_UPDATE_MINUTES` - Auto-update interval
- `WEBHOOK_URL` - Optional webhook endpoint

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Login with worker ID and PIN
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify` - Verify session
- `GET /api/auth/state` - Get auth state and worker list

#### User Profile
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/last-login` - Update last login time

#### Admin User Management
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:workerId` - Update user
- `DELETE /api/admin/users/:workerId` - Delete user
- `POST /api/admin/users/:workerId/reset-pin` - Reset user PIN

#### Catalog
- `GET /api/catalog` - Get catalog (services, districts, presets)
- `POST /api/catalog/districts` - Add district
- `DELETE /api/catalog/districts/:id` - Remove district
- `POST /api/catalog/services` - Add service
- `DELETE /api/catalog/services/:id` - Remove service
- `POST /api/catalog/presets` - Add preset
- `DELETE /api/catalog/presets/:id` - Remove preset

#### Incidents
- `GET /api/incidents` - List incidents
- `POST /api/incidents` - Create incident
- `DELETE /api/incidents/:id` - Delete incident
- `POST /api/incidents/:id/close` - Close incident

#### Drafts
- `GET /api/drafts` - List drafts
- `POST /api/drafts` - Create draft
- `PUT /api/drafts/:id` - Edit draft
- `DELETE /api/drafts/:id` - Delete draft
- `POST /api/drafts/:id/regenerate` - Regenerate draft
- `POST /api/drafts/:id/publish` - Publish draft

#### Publications
- `GET /api/publications` - List publications

#### Public Endpoints (No Auth)
- `GET /api/public/status` - Public status page data
- `GET /feed.xml` - RSS feed
- `GET /widget` - Widget iframe

#### Push Notifications
- `GET /api/push/key` - Get VAPID public key
- `POST /api/push/subscribe` - Subscribe to push

#### Health
- `GET /api/health` - Health check

#### Geocoding
- `GET /api/geocode/reverse` - Reverse geocoding
