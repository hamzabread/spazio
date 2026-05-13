# Ghost Local + spazio-pitch-multi

## How They Interact
- `ghost-local` is your Ghost app/runtime (admin + API + frontend rendering).
- `spazio-pitch-multi` is the active Ghost theme (templates, CSS, JS).
- Ghost stores content in DB and renders templates (`.hbs`) from the theme.
- Theme JS/CSS then enhances the rendered page in-browser.

## Local Workflow
1. Edit theme files in `spazio-pitch-multi`.
2. Build assets with `npm run build` (Rollup outputs `assets/built/*`).
3. Sync with `npm run sync:ghost`:
   - rsync copies this repo to `../ghost-local/content/themes/spazio-pitch-multi/`
   - Ghost restarts so changes are live on localhost.
4. Package with `npm run zip` for upload (`spazio-pitch-multi.zip`).

## How /about Is Dynamic

## Core files
- Template: `page-about.hbs`
- Hydration logic: `assets/js/aboutPage.js`
- Styles: `assets/css/aboutUsPage.css`

## Mechanism
1. `page-about.hbs` renders fallback UI + hidden lexical templates:
   - `<template class="sc-about-lexical-source">{{{content}}}</template>`
   - extra fragments from `#get "pages"` as `<template class="sc-about-source-fragment">`.
2. `initAboutPage()` clones those templates into an off-DOM holder.
3. Parser extracts structured content (mission, revenue, FAQ, Riccardo).
4. Matching nodes in visible UI are replaced (`data-*` hooks) if parsed content exists.

Result: content edited in Ghost pages can update `/about` without hand-editing hardcoded template copy.

## Dynamic Sections on /about
- Mission text
- Revenue intro + cards (including heading/list variants)
- FAQ intro + Q/A (supports Ghost toggle cards)
- Riccardo area:
  - staff card (`.container-staff`) -> name/role/photo/socials
  - bio paragraph
  - expertise list
  - gallery images
  - articles/bookmark cards

## Why It Reflects from /ghost/pages
- Ghost admin edits are published as page HTML.
- That HTML is injected into hidden template sources in `page-about.hbs`.
- `aboutPage.js` re-maps this HTML to designed sections.
- So editor updates propagate to the live About layout after publish and cache refresh.

## Project Overview

## Architecture
- Handlebars templates: routing + server-rendered markup.
- Partial components: reusable blocks under `partials/`.
- CSS modules under `assets/css/`.
- JS modules under `assets/js/`.
- Built bundles under `assets/built/`.
- Locales under `locales/`.

## Feature style
- Hybrid static + CMS-driven rendering:
  - static fallback for safety
  - JS hydration for dynamic CMS content in design-heavy sections

## Practical checklist
1. Edit content in Ghost Admin.
2. If theme code changed: `npm run build`.
3. Sync local Ghost: `npm run sync:ghost`.
4. Hard refresh page.
5. Zip for deployment: `npm run zip`.

## Summary
`ghost-local` is the content/runtime layer; `spazio-pitch-multi` is the presentation + hydration layer.  
`/about` is dynamic because theme JS parses Ghost-rendered page HTML and injects it into custom UI components.
