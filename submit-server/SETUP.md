# Press Release Submit Server

Backend endpoint that receives press-release submissions from the frontend form (`/submit-your-press-release/`) and creates a **draft post** in Ghost via the Admin API. Once published from Ghost Admin, the post automatically appears on `/press-releases/` and any other page that filters by the `press-release` tag.

## One-time setup

### 1. Get a Ghost Admin API key

1. Open Ghost admin: <http://localhost:2368/ghost>
2. Go to **Settings → Advanced → Integrations**
3. Click **+ Add custom integration** → name it `Press Release Submissions` → **Create**
4. Copy the **Admin API Key** (long string with `:` in the middle)

### 2. Configure the server

From `D:\officework\spazio\submit-server\`:

```powershell
Copy-Item .env.example .env
notepad .env
```

Paste the key into `GHOST_ADMIN_API_KEY=` and save.

### 3. Install dependencies

```powershell
cd D:\officework\spazio\submit-server
npm install
```

### 4. Start the server

```powershell
npm start
```

You should see:

```
[submit-server] listening on http://localhost:3001
[submit-server] posts will be created in: http://localhost:2368 as "draft" tagged "press-release"
```

Leave this terminal running. (Ghost on port 2368 + submit-server on port 3001 = both running.)

## How it works

```
Browser form (localhost:2368)
  └─ POST JSON ─→ submit-server (localhost:3001)
                    └─ Ghost Admin API ─→ creates DRAFT post (tagged & ordered correctly)
                                              ↓
                                  Admin reviews → clicks Publish in Ghost Admin
                                              ↓
                              Appears on listing page + detail page
```

### Endpoints

| Path | Form page | Tag added | Listing page | Detail uses |
| --- | --- | --- | --- | --- |
| `POST /submit-press-release` | `/submit-your-press-release/` | `press-release` + categories | `/press-releases/` | post content |
| `POST /submit-event` | `/submit-your-event/` | `event` + category + 3 internal tags | `/events/` | post + sidebar (date/location/attendees from internal tags 1/2/3, in order) |

### How `/submit-event` maps form fields to a Ghost post

| Form field | Where it lands in Ghost |
| --- | --- |
| Event Name | post title |
| Event Type | public tag (e.g. "Conference") |
| Category | public tag (e.g. "Bitcoin") |
| Start/End Date + Time | formatted date string → **internal tag #1** → shown in Date sidebar field |
| City / Country | **internal tag #2** → shown in Location sidebar field |
| Expected Attendees | **internal tag #3** → shown in Attendees sidebar field |
| Venue / Platform | rendered in post body |
| Event URL / Tickets | rendered as CTA link at bottom of post body |
| Description | post body + auto-generated excerpt |

Order matters: the detail template (`partials/post-event.hbs`) uses `{{#foreach tags visibility="internal" limit="1"}}` / `from="2" to="2"` / `from="3" to="3"` — so the submit-server is careful to push internal tags in date → location → attendees order.

## Configuration reference (.env)

| Variable | Default | Meaning |
| --- | --- | --- |
| `GHOST_URL` | `http://localhost:2368` | Where Ghost is running |
| `GHOST_ADMIN_API_KEY` | *(required)* | Admin API key from custom integration |
| `PORT` | `3001` | Port this submit-server listens on |
| `PRESS_RELEASE_TAG` | `press-release` | Tag applied to every submission (matches the filter on `/press-releases/`) |
| `ALLOWED_ORIGIN` | `http://localhost:2368` | CORS origin allowed to POST (set to your prod domain when deploying) |
| `PUBLISH_STATUS` | `draft` | `draft` = admin must approve, `published` = goes live immediately |

To auto-publish without manual review, change `PUBLISH_STATUS=published` in `.env`. **Not recommended** without CAPTCHA/rate-limiting.

## Testing the flow

1. Start Ghost: `cd D:\officework\spazio\ghost-local; $env:NODE_ENV="development"; node current/index.js`
2. Start submit-server (separate terminal): `cd D:\officework\spazio\submit-server; npm start`
3. Open <http://localhost:2368/submit-your-press-release/>
4. Fill form → tick last two consent boxes → click **Submit Press Release →**
5. Success banner appears.
6. Open Ghost admin → **Posts → Drafts** → you should see the new submission.
7. Click **Publish**.
8. Visit `/press-releases/` — your post is listed there.

## Common issues

- **CORS error in browser console** → `ALLOWED_ORIGIN` in `.env` doesn't match the page origin. Restart submit-server after editing `.env`.
- **"GHOST_ADMIN_API_KEY missing"** → forgot to copy the key into `.env`, or copied the *Content API key* by mistake (use the **Admin** API key — has a colon).
- **Post not appearing on `/press-releases/`** → make sure it's **published** (not still draft) in Ghost admin, and that the tag matches `PRESS_RELEASE_TAG` value.

## Where the form code lives

- Frontend form: [submit-your-press-release.hbs](../submit-your-press-release.hbs) (root copy)
- Active theme copy (what Ghost actually serves): `ghost-local/content/themes/spazio-pitch-multi/submit-your-press-release.hbs`

Both must stay in sync; copy from root to active theme whenever you edit. (Or set up a watcher if you change this often.)
