# Ghost local export (zip) · what was excluded · how to run

## Why the original archive was ~1 GB

A full Ghost install stores **two heavy things**:

1. **`versions/<ghost-version>/node_modules`** — the Ghost app’s dependencies (often **hundreds of MB per version**).
2. **Old Ghost versions** — e.g. `versions/6.21.0` kept from upgrades, even when `current` points at **6.32.0**.

The theme **`spazio-pitch-multi/node_modules`** (build tooling) adds more.

The **slim export** (`ghost-local-spazio-export.zip`, ~**180 MB** on this machine) **excludes**:

- every path containing **`node_modules`**
- the inactive release **`versions/6.21.0`** (only **6.32.0** is needed for this install)

Your colleague must **reinstall dependencies** after unzipping (steps below).

---

## After unzipping the Ghost bundle

Assume the folder is `ghost-local` next to where they work.

### 1. Fix absolute paths in `config.development.json`

The shipped file may contain paths from the original machine (e.g. `/Users/.../ghost-local/...`). Replace them with the **new** absolute path to `ghost-local`, at least:

- `database.connection.filename`
- `paths.contentPath`
- `url` / `admin.url` if they use a tunnel or different host

### 2. Ensure the `current` symlink

From inside `ghost-local`:

```bash
rm -f current && ln -s versions/6.32.0 current
```

(Adjust `6.32.0` if `.ghost-cli` shows a different `active-version`.)

### 3. Install Ghost core dependencies

Ghost **6.32.0** in this install uses **pnpm** (see `versions/6.32.0/pnpm-lock.yaml`).

```bash
cd ghost-local/versions/6.32.0
corepack enable
pnpm install
```

Requires **Node** compatible with this Ghost build (this install recorded **22.x** in `.ghost-cli`). If `pnpm` is missing, `corepack enable` usually provides it.

### 4. Install theme build dependencies (only if they edit/build the theme)

```bash
cd ghost-local/content/themes/spazio-pitch-multi
npm install
npm run build
```

### 5. Start Ghost

From **`ghost-local`** (parent of `current`):

```bash
ghost start
```

Or in development:

```bash
ghost run
```

Site default: **http://localhost:2368** · Admin: **http://localhost:2368/ghost**

They need **[Ghost CLI](https://ghost.org/docs/install/local/)** installed globally (`npm install -g ghost-cli@latest`) if `ghost` is not on `PATH`.

---

## Recreating the slim zip (maintainer command)

Run from the **parent** folder of `ghost-local` (e.g. `Downloads`):

```bash
zip -rq ghost-local-spazio-export.zip ghost-local \
  -x 'ghost-local/versions/6.21.0/*' \
  -x '*.DS_Store' \
  -x 'ghost-local/.ghostpid' \
  -x '*node_modules*'
```

If a **new old version** appears under `versions/` after upgrades, add another `-x 'ghost-local/versions/<version>/*'` line so only the **active** version stays.

---

## Flow: colleague clones only the theme from GitHub

That gives **templates/CSS/JS**, not a runnable Ghost CMS by itself.

1. Install Ghost locally (recommended):  
   https://ghost.org/docs/install/local/
2. Clone the theme repo and copy or symlink it into **`content/themes/spazio-pitch-multi`**, **or** use rsync from the theme repo root into that folder (same layout as Git).
3. In the theme directory: **`npm install`** then **`npm run build`** when changing assets.
4. In Ghost admin: **Design → Themes** activate **Spazio pitch multi** (or the theme folder name Ghost shows).
5. **Restart Ghost** after large theme updates if something looks cached (`ghost restart` from the Ghost install folder).

Combine with **this doc** when sharing the **database + images + uploads** via the slim zip (`content/` is inside the bundle).

---

## Deploy the theme to Ghost Cave (labs) for verification

We cannot push to your hosted Ghost from this repo; someone with **staff access** to the site must upload the theme in Admin.

**Admin URL:** https://spaziocrypto-com.labs.ghostcave.org/ghost/

### 1. Produce the upload ZIP (maintainer)

From the theme repository root:

```bash
npm run zip
```

This runs a production build and writes **`spazio-pitch-multi.zip`** in the project root (same layout Ghost expects: `assets/`, `partials/`, `*.hbs`, `package.json`, etc.).

### 2. Upload in Ghost Admin (client / staff)

1. Sign in at the `/ghost/` URL above.
2. Go to **Settings → Design** (or **Design** in the sidebar, depending on Ghost version).
3. Open **Change theme** / **Install theme**.
4. **Upload** `spazio-pitch-multi.zip`.
5. **Activate** the theme after upload completes.
6. Open the **live site** (not only Admin) and smoke-test: home, a post, custom pages (jobs, directory, advertising, etc.), light/dark if applicable, and **Code injection** if the site relies on it.

### 3. If upload fails

- Confirm Ghost version is **≥ 5** (theme `package.json` has `"ghost": ">=5.0.0"`). The Spazio labs site runs **Ghost 6.35.0**, which is fully within that range.
- Ghost enforces **at most 20** entries under `package.json` → `config.custom`, and **each** custom setting must appear at least once in a `.hbs` file. This theme keeps exactly **20** configurable settings; directory, events, press-release, breaking-news, and market feed filters are **hard-coded** in the matching partials (change there if your tag strategy differs).
- Zip must be the **theme root** contents, not a folder wrapping the theme (the generated `spazio-pitch-multi.zip` matches Ghost’s expected structure).
- Run **`npx gscan .`** locally and fix any **errors** before re-zipping (warnings are often acceptable).

### 4. Optional: Git deploy

If Ghost Cave provides **GitHub / Git integration** for themes, follow their docs to point the environment at this repository’s default branch; still run **`npm run zip`** (or CI **`npm run build`**) so `assets/built/` is committed or produced before deploy, per their workflow.

---

## Labs QA: client 404s, CoinGecko, header/footer (checklist)

Most “broken” reports on a fresh Ghost install are **missing content or CMS settings**, not only the theme zip.

### A. Pages that must exist (or links 404)

Theme CTAs and blocks link to these **paths** (trailing slash optional in Ghost):

| URL path | Ghost Admin action |
|----------|--------------------|
| `/directory/` | **Pages → New page** → slug **`directory`** → template **Directory** (`page-directory.hbs`) |
| `/jobs/` | New page → slug **`jobs`** → template **Jobs** (`page-jobs.hbs`) |
| `/events/` | New page → slug **`events`** → template **Events** (`page-events.hbs`) |
| `/contact/` | New page → slug **`contact`** (or use your contact template if you ship one) |
| `/advertising/` or `/advertise/` | Match whatever you put in **Settings → Navigation** |
| `/post-a-job`, `/list-your-company` | Create pages with those **exact slugs** or change header/take-action links in the theme |

**Take Action** (`partials/take-action.hbs`) uses `{{@site.url}}/directory/`, `/jobs/`, `/events/`, `/contact/` — if those pages are missing, you get 404s.

### B. Tags used in the theme

`partials/header-main-nav.hbs` links to **`/tag/news/`**, **`/tag/markets/`**, **`/tag/product/`**, **`/tag/ai/`**. Create tags with those slugs (or edit the partial to match your taxonomy). The **Jobs** feed uses **`@custom.jobs_source_tag`** (default slug `jobs`): only posts with that tag appear on the jobs listing.

### C. CoinGecko + market widget

- **Home dashboard** (`assets/js/marketDashboard.js`) calls **`https://api.coingecko.com/api/v3`** from the browser. If nothing loads, check **browser devtools → Network** for blocked or 429 responses.
- **Termly** (or other consent scripts) in `default.hbs` may block third-party scripts until accepted; whitelist **`api.coingecko.com`** and **`widgets.coingecko.com`** as **essential** in Termly (or test with consent accepted).
- The marquee in `partials/extended-header.hbs` loads **`widgets.coingecko.com`** — same consent/CSP rules apply.

### D. Language switch

`partials/langswitch.hbs` points locale links at **production** `spaziocrypto.com` subdomains. On **labs**, that still navigates away from the staging host (by design for multi-site locales). If the menu did not open or felt “dead”, an older theme build used a **global `button` rule** in `languagePopUp.css` that broke other controls — fixed by scoping that CSS.

### E. Ghost Navigation vs custom nav

Primary desktop nav in this theme is **hard-coded** in `partials/header-main-nav.hbs`, not `{{navigation}}`. To match Figma, keep that file aligned with the product map; use **Settings → Navigation** for secondary/footer links Ghost expects.

### F. After each theme upload

**Design → Active theme** → hard-refresh the live site (or append `?v=` cache buster). Re-test **home**, one **post**, one **tag** archive, and each **custom page** from the table above.
