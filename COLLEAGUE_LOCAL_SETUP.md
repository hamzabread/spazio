# Running Spazio (Ghost theme + local Ghost) after cloning

**Repo:** https://github.com/hamzabread/spazio  
This repository is the **Ghost theme** (custom Pitch-based theme). The **Ghost site** runs separately via Ghost CLI.

---

## Prerequisites

- **Node.js** (LTS, e.g. 18 or 20) and **npm**
- **Ghost CLI** globally: `npm install -g ghost-cli`
- A **local Ghost install folder** (e.g. `ghost-local`), placed **next to** the theme folder:

```
parent-folder/
  spazio-pitch-multi/     <- clone of https://github.com/hamzabread/spazio (theme)
  ghost-local/            <- Ghost instance (from colleague handoff zip or your own `ghost install`)
```

The bundled `npm run sync:ghost` script expects this layout: theme at `../ghost-local` relative to the repo root.

---

## 1) Clone the theme

```bash
git clone https://github.com/hamzabread/spazio.git spazio-pitch-multi
cd spazio-pitch-multi
npm install
npm run build
```

- `npm run build` compiles CSS/JS into `assets/built/` (required for correct styling and `/about` hydration).

---

## 2) Unpack Ghost (local instance)

Unzip the provided **ghost-local** archive into a folder named `ghost-local`, **sibling** to `spazio-pitch-multi` (see structure above).

The handoff zip **excludes `node_modules`** (large, machine-specific). After unzipping, if **`ghost start` fails**, restore dependencies from that folder:

```bash
cd ghost-local
ghost update
```

If problems persist, use a fresh Ghost CLI install and **copy only `content/`** from the handoff zip into it (keeps posts, theme uploads, images), or run `ghost install local` and re-import content as needed.

If you are setting up Ghost from scratch instead of the zip:

```bash
cd ..
mkdir ghost-local && cd ghost-local
ghost install local
```

Follow Ghost CLI prompts. Default site URL is often `http://localhost:2368`.

---

## 3) Install the theme into Ghost

**Option A — sync script (recommended for development)**

From inside `spazio-pitch-multi`:

```bash
npm run sync:ghost
```

This copies the theme to `../ghost-local/content/themes/spazio-pitch-multi/` and runs `ghost restart` in `../ghost-local`.

**Option B — upload zip in Ghost Admin**

1. Run `npm run zip` in `spazio-pitch-multi` → creates `spazio-pitch-multi.zip`
2. Ghost Admin → **Settings → Design → Change theme → Upload theme**

---

## 4) Activate the theme

Ghost Admin → **Settings → Design** → select **spazio-pitch-multi** (or the name shown) → **Activate**.

---

## 5) Run Ghost & open the site

```bash
cd ../ghost-local
ghost start
```

Open **http://localhost:2368** (or your configured URL). Admin: **http://localhost:2368/ghost/**

---

## 6) Development workflow

- Edit theme files in `spazio-pitch-multi`
- Run `npm run build` after JS/CSS changes
- Run `npm run sync:ghost` to push to local Ghost and restart
- Optional: `npm run dev` for watch mode (Rollup)

**Theme validation:** `npm test` (runs gscan)

---

## 7) About page CMS behavior (short)

The `/about` route uses `page-about.hbs` and client-side hydration in `assets/js/aboutPage.js`. Content edited in Ghost (pages, toggles, HTML blocks) is injected via hidden `<template>` sources; refresh the browser after publishing.

---

## Troubleshooting

- **`sync:ghost` fails (path not found):** Ensure `ghost-local` sits next to `spazio-pitch-multi` and the folder name matches.
- **Styles or JS missing:** Run `npm run build` in the theme, then sync or re-upload zip.
- **Site won't start:** In `ghost-local`, run `ghost doctor`, then `ghost start`.
- **Wrong theme active:** Ghost Admin → Design → activate the spazio theme.

---

## Repo scripts (reference)

From `package.json`:

- `npm run build` — production build of assets  
- `npm run dev` — dev watch  
- `npm run sync:ghost` — rsync theme to `../ghost-local/.../spazio-pitch-multi` + `ghost restart`  
- `npm run zip` — build + create theme zip for upload  

---

*Last updated: May 2026*
