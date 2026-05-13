# Spazio Backend Setup & Development Guide

Date: April 2026
For: Backend Developer
Project: Spazio (spaziocrypto.com)

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Initial Setup](#initial-setup)
3. [Backend Architecture](#backend-architecture)
4. [Running the Backend](#running-the-backend)
5. [API Integration Points](#api-integration-points)
6. [Development Workflow](#development-workflow)
7. [Database & Content](#database--content)
8. [Custom Hooks & Extensions](#custom-hooks--extensions)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Software Dependencies

- Node.js: v22.22.1 (required - use nvm to manage versions)
- npm: v10.x or higher
- SQLite3: v3.x (included with most systems)
- Ghost-CLI: Latest stable
- Git: For version control

### Hardware

- RAM: Minimum 2GB (4GB recommended)
- Disk: 5GB free space
- macOS, Linux, or Windows (WSL2)

### Development Tools

- Code editor: VS Code, WebStorm, or similar
- Terminal/CLI: bash, zsh, or equivalent
- REST client: Postman or similar (for API testing)

---

## Initial Setup

### Step 1: Download Ghost Backend

Request the `ghost-local.zip` file from your frontend lead (Hamza).

```bash
# Extract the archive
unzip ghost-local.zip
cd ghost-local
```

### Step 2: Install Node Version Manager (nvm)

Ghost v6 requires Node 22.

```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Verify installation
nvm --version

# Install Node 22
nvm install 22.22.1
nvm use 22.22.1
node --version  # Should be v22.22.1
```

### Step 3: Install Ghost-CLI

```bash
npm install -g ghost-cli

# Verify
ghost --version
```

### Step 4: Configure Ghost Paths

Edit `config.development.json` to match your system:

```bash
# On macOS/Linux
nano config.development.json
```

Update paths if needed:

```json
{
  "paths": {
    "contentPath": "/path/to/your/ghost-local/content"
  },
  "database": {
    "client": "sqlite3",
    "connection": {
      "filename": "/path/to/your/ghost-local/content/data/ghost.db"
    }
  }
}
```

### Step 5: Install Dependencies

```bash
cd ghost-local/versions/6.21.0
npm install
cd ../..
```

---

## Backend Architecture

### Directory Structure

```
ghost-local/
├── current                    # Symlink to active version
├── versions/
│   └── 6.21.0/              # Ghost core application
│       ├── core/            # Ghost internals
│       ├── index.js         # Entry point
│       └── node_modules/    # Dependencies
├── content/                 # All user data
│   ├── data/
│   │   └── ghost.db        # SQLite database (posts, tags, members)
│   ├── themes/
│   │   └── spazio-pitch-multi/  # Frontend theme
│   ├── images/             # Uploaded images
│   ├── files/              # Uploaded documents
│   ├── settings/           # Ghost configuration
│   └── logs/               # Application logs
├── config.development.json  # Ghost configuration
└── .ghostpid               # Process ID file
```

### Request Flow

```
Browser Request
    ↓
Ghost Server (Node.js)
    ↓
Theme Router (Handlebars templates)
    ↓
Content API / Admin API
    ↓
SQLite Database
    ↓
Response (HTML/JSON)
```

---

## Running the Backend

### Start Ghost

```bash
cd ghost-local
nvm use 22.22.1

# Start the server
ghost start

# Or run interactively (helpful for debugging)
ghost run

# Check status
ghost status
```

### Access Ghost

- **Admin Panel**: http://localhost:2368/admin
- **Frontend**: http://localhost:2368
- **API URL**: http://localhost:2368/ghost/api/v3/admin/

### Stop Ghost

```bash
cd ghost-local
ghost stop
ghost restart
```

---

## API Integration Points

### 1. Content API (Public)

Used by theme to fetch posts, tags, members (read-only).

**Endpoint**: `/ghost/api/v3/content/`

**Authentication**: API Key only

**Key Endpoints**:

```javascript
// Get all posts
GET /ghost/api/v3/content/posts/?key=YOUR_API_KEY

// Get specific post
GET /ghost/api/v3/content/posts/{id}/?key=YOUR_API_KEY

// Get all tags
GET /ghost/api/v3/content/tags/?key=YOUR_API_KEY

// Get members (requires member token)
GET /ghost/api/v3/content/members/?key=YOUR_API_KEY
```

**Example cURL**:

```bash
curl "http://localhost:2368/ghost/api/v3/content/posts/?key=YOUR_API_KEY"
```

### 2. Admin API (Private)

Used for creating/editing posts, members, webhooks (requires authentication).

**Endpoint**: `/ghost/api/v3/admin/`

**Authentication**: JWT token

**Key Endpoints**:

```javascript
// Create post
POST /ghost/api/v3/admin/posts/

// Update post
PUT /ghost/api/v3/admin/posts/{id}/

// Create member
POST /ghost/api/v3/admin/members/

// Delete post
DELETE /ghost/api/v3/admin/posts/{id}/
```

### 3. Webhooks

Trigger actions when Ghost events occur (post published, member signup, etc.).

**Setup**:

```bash
# In Ghost Admin: Settings → Webhooks
# Add webhook URL: https://your-backend/webhook/ghost/post-published
```

**Webhook Events**:
- `post.published`
- `post.unpublished`
- `post.deleted`
- `member.added`
- `member.deleted`
- `member.edited`

### 4. External APIs Already Configured

#### Formspree (Contact Form)
- **Endpoint**: https://formspree.io/f/xwkdojlk
- **Method**: POST contact form submissions
- **Frontend**: `page-contact-us.hbs`

#### n8n Webhook (Records/Users)
- **Endpoint**: https://n8n.ghostflow.net/webhook/2e340949-9ddd-4782-8a1e-6c1a54be6c16
- **Purpose**: Fetch user records by ID
- **Frontend**: `custom-post-records.hbs`

#### Cloudflare Worker (Multilingual Routing)
- **Endpoint**: https://spazio-multilang.ghostflow.workers.dev
- **Purpose**: Map posts to translated URLs
- **Frontend**: `assets/js/languageLinks.js`

#### OneSignal (Push Notifications)
- **IDs Configured**: 9 language variants
- **Setup**: Settings → Integrations → OneSignal

---

## Development Workflow

### 1. Local Development

```bash
# Terminal 1: Start Ghost
cd ghost-local
nvm use 22.22.1
ghost run

# Terminal 2: Make code changes
cd ghost-local/versions/6.21.0/core/web/
# (Edit custom code, hooks, middleware)
```

### 2. Custom Code Location

Add custom routes/middleware here:

```
ghost-local/versions/6.21.0/core/web/
├── routes/
├── middleware/
├── services/
└── api/
```

### 3. Create Custom API Route

Create file: `custom-api.js`

```javascript
const express = require('express');
const router = express.Router();

// Custom endpoint: GET /api/custom/market-data
router.get('/market-data', (req, res) => {
  // Fetch from CoinGecko or database
  res.json({ prices: [...] });
});

module.exports = router;
```

Register in Ghost core:

```javascript
// In versions/6.21.0/core/server/services/routing/index.js
const customApi = require('./custom-api');
app.use('/api/custom', customApi);
```

### 4. Testing API Locally

```bash
# Using curl
curl http://localhost:2368/api/custom/market-data

# Using Postman
GET http://localhost:2368/api/custom/market-data
```

---

## Database & Content

### SQLite Database

Location: `ghost-local/content/data/ghost.db`

### Database Schema

Main tables:

- `posts` - Blog articles
- `tags` - Topic categories
- `post_tags` - Post-tag relationships
- `members` - Subscriber accounts
- `members_subscribe_events` - Newsletter signups
- `users` - Admin users

### Query Database

```bash
# Install sqlite3 CLI
brew install sqlite3

# Query database
sqlite3 ghost-local/content/data/ghost.db

# Common queries
SELECT * FROM posts LIMIT 10;
SELECT * FROM members;
SELECT * FROM tags;
```

### Backup Database

```bash
# Before making changes
cp ghost-local/content/data/ghost.db ghost.db.backup

# Restore if needed
cp ghost.db.backup ghost-local/content/data/ghost.db
ghost restart
```

---

## Custom Hooks & Extensions

### Ghost Hooks System

Ghost provides lifecycle hooks for custom logic.

### Register Custom Hook

```javascript
// In custom module
const ghostEvents = require('@tryghost/social-email/lib/events');

ghostEvents.on('post.published', async (post) => {
  console.log('New post published:', post.title);
  
  // Custom logic here
  // - Notify external services
  // - Update database
  // - Trigger webhooks
});
```

### Available Hooks

- `post.published` - When post goes live
- `post.deleted` - When post is removed
- `member.added` - New subscriber
- `member.deleted` - Subscriber removed
- `email.sent` - Newsletter sent
- `email.failed` - Newsletter error

---

## API Integration Tasks

### Task 1: Implement CoinGecko API

**Goal**: Fetch live crypto prices for market dashboard.

**File**: Create `services/crypto-service.js`

```javascript
const axios = require('axios');

async function getCryptoPrices() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'bitcoin,ethereum',
          vs_currencies: 'usd',
          include_24hr_change: true
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('CoinGecko error:', error);
    throw error;
  }
}

module.exports = { getCryptoPrices };
```

**Expose via API**:

```javascript
router.get('/prices', async (req, res) => {
  const prices = await getCryptoPrices();
  res.json(prices);
});
```

**Cache Strategy**: Store in Redis or memory with 5-min TTL.

### Task 2: Wire Newsletter Subscription

**Goal**: Save email signups to Ghost members.

**File**: Create `services/newsletter-service.js`

```javascript
const ghostApi = require('@tryghost/api');

async function subscribeEmail(email, name = 'Subscriber') {
  try {
    const member = await ghostApi.members.create({
      email: email,
      name: name,
      subscribed: true,
      labels: ['newsletter']
    });
    
    return member;
  } catch (error) {
    console.error('Subscription error:', error);
    throw error;
  }
}

module.exports = { subscribeEmail };
```

### Task 3: Setup n8n Workflow

**Goal**: Fetch user records from external database.

**n8n Workflow Steps**:

1. Webhook receives `GET /webhook/records?id=123`
2. Query database for record ID 123
3. Transform data to JSON
4. Return to frontend

**n8n Config** (Already set up at: https://n8n.ghostflow.net)

---

## Deployment

### To Production Server

```bash
# 1. Build/test locally
ghost stop
ghost run  # Test mode

# 2. Upload to server
rsync -avz ghost-local/ user@server:/var/www/ghost-local/

# 3. On server
cd /var/www/ghost-local
nvm use 22.22.1
ghost start

# 4. Verify
curl https://yourdomain.com
```

### Using Docker (Recommended)

Create `Dockerfile`:

```dockerfile
FROM node:22.22.1

WORKDIR /ghost

COPY ghost-local/ /ghost/

RUN npm install

EXPOSE 2368

CMD ["ghost", "run"]
```

Build and run:

```bash
docker build -t spazio-ghost .
docker run -p 2368:2368 spazio-ghost
```

### CI/CD Pipeline

For GitHub Actions, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Ghost

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '22.22.1'
      - run: npm install
      - run: npm test
      - run: rsync -avz ./ user@server:/var/www/ghost-local/
```

---

## Environment Variables

Create `.env` file in `ghost-local/`:

```
# Database
GHOST_DB_PATH=/path/to/ghost-local/content/data/ghost.db

# APIs
COINGECKO_API_KEY=your_key_here
MAILCHIMP_API_KEY=your_key_here
N8N_WEBHOOK_URL=https://n8n.ghostflow.net/webhook/...

# Email
MAIL_FROM=noreply@spaziocrypto.com
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_key

# Ghost
GHOST_URL=http://localhost:2368
GHOST_ADMIN_URL=http://localhost:2368/admin
```

Load in code:

```javascript
require('dotenv').config();
const coingeckoKey = process.env.COINGECKO_API_KEY;
```

---

## Troubleshooting

### Ghost Won't Start

```bash
# Check Node version
node --version  # Should be v22.22.1

# Switch to correct version
nvm use 22.22.1

# Check process
lsof -i :2368  # See if port 2368 is in use

# Kill existing process
kill -9 <PID>

# Start fresh
ghost restart
```

### Database Locked

```bash
# Stop Ghost
ghost stop

# Remove lock file
rm ghost-local/.ghostpid

# Start again
ghost start
```

### API Returns 401 Unauthorized

- Verify API key in `config.development.json`
- Check JWT token expiration
- Regenerate API key in Ghost Admin

### Theme Not Updating

```bash
# Clear cache
rm -rf ghost-local/content/themes/spazio-pitch-multi/.cache

# Restart
ghost restart
```

### Memory Leak

```bash
# Monitor memory usage
node --max-old-space-size=2048 ...

# Or restart daily via cron
0 3 * * * cd /path/to/ghost-local && ghost restart
```

---

## Quick Reference Commands

```bash
# Navigation
cd ghost-local
nvm use 22.22.1

# Start/stop
ghost start
ghost stop
ghost restart
ghost run          # Interactive mode

# Status
ghost status
ghost log          # View logs

# Database
sqlite3 content/data/ghost.db

# API Testing
curl http://localhost:2368/api/...

# Deployment
rsync -a ./ /destination/
ghost update       # Update Ghost version
```

---

## Support & Resources

- **Ghost Docs**: https://ghost.org/docs/
- **Ghost API**: https://ghost.org/docs/api/
- **Issue**: Slack/Email the frontend lead (Hamza)
- **Logs**: `ghost-local/content/logs/`

---

## Next Steps

1. Extract `ghost-local.zip`
2. Run setup steps 1-4 above
3. Start Ghost: `ghost start`
4. Access admin: http://localhost:2368/admin
5. Create test post to verify
6. Begin implementing APIs (CoinGecko, newsletter, etc.)
7. Push changes to GitHub
8. Deploy to staging server

---

**Last Updated**: April 1, 2026
**Frontend Contact**: Hamza (Frontend Lead)
