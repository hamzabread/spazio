# Spazio Theme Milestone 3 Report

Date: 2026-03-24

Project repository: https://github.com/hamzabread/spazio

## 1. Project Information

Spazio is a custom Ghost theme for a multi-language crypto media site.

Current technical context:
- Ghost version: 6.21.0
- Required Node version: 22.x
- Theme stack: Handlebars templates, modular CSS, JavaScript assets, Rollup build
- Languages in scope: EN, IT, ES, FR, DE, JA, KO, RU, ZH

Project goal for Milestone 3:
- Match Figma designs and complete all required pages
- Finalize frontend/backend integration points
- Pass staging QA for responsiveness, dark mode, performance, and content workflows

## 2. File Structure Overview

Main theme structure:

- Root templates
  - default.hbs
  - index.hbs
  - post.hbs
  - page.hbs
  - tag.hbs
  - author.hbs
  - custom-*.hbs page templates

- assets/
  - css/ (section-based styles)
  - js/ (front-end behaviors and helpers)
  - built/ (compiled assets)
  - imagesAndIcons/

- partials/
  - reusable components (header, footer, sidebar, feeds, widgets)

- locales/
  - translation files for all language instances

- Build/config files
  - package.json
  - rollup.config.js

## 3. How To Run The Project

From the theme repository:

1. Install dependencies

   npm install

2. Build theme assets

   npm run build

3. Deploy the theme folder into local Ghost themes directory

   rsync -a --delete ./ ~/Downloads/ghost-local/content/themes/spazio-pitch-multi/

4. Restart Ghost using Node 22

   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
   nvm use 22.22.1
   cd ~/Downloads/ghost-local && ghost restart

## 4. What Has Been Done

Completed implementation in current cycle:

- Responsive layout improvements
  - Homepage sections adjusted for major breakpoints
  - Footer layout grouped and reflowed correctly

- About page refinement
  - Hero spacing and card behavior updated
  - Breadcrumb typography and spacing aligned
  - Social icons replaced with custom SVGs

- Build and runtime stabilization
  - Theme build pipeline validated
  - Ghost startup issue diagnosed and resolved by enforcing Node 22

- Documentation baseline
  - Internal project reporting process established

## 5. What Is Left (Milestone 3 Scope)

The items below are based on the Milestone 3 brief and focus on backend/frontend integration readiness.

### 5.1 Pages Designed In Figma But Still Needing Full Implementation

- Homepage
- Article page (free + paid/paywall)
- Blog listing page
- About Us
- Advertising / Media Kit
- Careers
- Imprint

Required outcome:
- Pixel-accurate implementation in Ghost templates
- Verified behavior in responsive and dark mode

### 5.2 Pages Still To Design In Figma And Then Implement

- Directory listing pages: Exchanges, Wallets, Analytics tools
- Directory entry page: single company/tool profile
- Crypto Jobs listing page
- Events listing page
- Press Release listing page
- Press Release single page
- Ghost Tag page with tag header, description, and grid
- Crypto Prices page (CoinGecko data)

## 6. Backend/Frontend Integration Work Left

### 6.1 CoinGecko Integration

Two tracks are required:

1) Sidebar widget (already present in theme code)
- Widget exists in sidebar.hbs
- Needs activation, Swiper styling, dark mode verification, staging verification
- No API key integration required for this widget

2) Crypto Prices page (new implementation)
- Implement a single centralized CoinGecko fetch strategy
- Cache response for 5 minutes
- Do not trigger uncontrolled fetches across instances
- Render coin name, symbol, logo, price, 24h percent, market cap
- Match Figma layout

Rate-limit planning:
- CoinGecko demo plan: 10,000 calls/month
- 5-minute refresh target: about 8,640 calls/month
- This is within free-tier limits if implemented correctly

Suggested implementation detail:
- Use localStorage cache with timestamp
- Re-fetch only after cache expiry
- Optionally move to Cloudflare Worker for centralized cache in production

### 6.2 Ghost-Native Directory Architecture

No custom backend is required for directory content.

Use Ghost-native model:
- Each listing entry is a Ghost post
- Categorize using internal tags:
  - #exchanges
  - #wallets
  - #analytics
  - #companies
  - #jobs
  - #events
- Listing pages are tag templates
- Entry pages are post templates
- Admin manages content directly in Ghost editor

Optional enhancement:
- Blue and gold verified marks via tags and conditional template rendering

### 6.3 Paywall And Members Integration

Article page must fully support:
- Free article rendering for non-members
- Paid/paywalled rendering for members
- Correct UI states and subscription prompts

Integration touchpoints:
- Ghost Members logic
- Frontend conditionals in article templates

### 6.4 Forms And External Handlers

Advertising and Careers flows need:
- Stable front-end forms
- Verified submission handling endpoint
- Staging-to-production parity

## 7. Code Injection Cleanup Left

Required cleanup tasks:

- Remove duplicate Font Awesome 4.7.0 from header injection
- Remove external links script from footer injection and move logic into theme JavaScript
- Remove duplicate isITHome script from header injection
- Move these CSS rules from injection into assets/css/footer.css:
  - .gh-social-icons { gap: 5px }
  - .gh-footer-copyright { justify-content: center }
  - .sitelinks-item ul { margin-top: 13px }
  - .gh-footer-main .sitelinks-item strong/span { text-transform: uppercase }
- Keep only approved injection items:
  - YouTube video widget (IT only)
  - Termly consent link
  - popupDisplayTimeout variable
  - enable_tag_filter variable
- Fix default.hbs bug:
  - appIDs.en should be signalIDs.en

## 8. Performance, Responsive, And Dark Mode Left

### 8.1 Performance Requirements

- Remove duplicate article rendering in DOM
- Apply loading='lazy' to non-LCP images
- Add explicit width and height on all images to reduce CLS
- Ensure third-party scripts do not block render (defer/async)
- Avoid loading logo multiple times; use CSS mode switching
- Ensure Font Awesome loads once

### 8.2 Responsive Requirements

Must pass QA at:
- 375px (mobile)
- 768px (tablet)
- 1280px (laptop)
- 1440px (desktop)

### 8.3 Dark Mode Requirements

Complete dark mode variable overrides in vars.css for:
- Header
- Homepage
- Article page
- Sidebar
- Footer
- Directory pages
- Tag pages

## 9. Milestone 3 QA And Payment Gate

Milestone release condition is a full staging QA pass confirming:

- All Figma pages implemented pixel-accurately
- All new pages designed and implemented
- CoinGecko widget active and prices page caching correctly
- Responsive behavior passes all breakpoints
- Dark mode complete
- Performance targets met
- Code injection cleaned
- Theme has no sensitive tokens

## 10. Recommended Next Sprint Order

1. Finish integration-critical work:
   - Paywall states
   - CoinGecko prices page with cache
   - Forms submission reliability

2. Complete template work for remaining pages:
   - Designed pages first
   - Then not-yet-designed pages once Figma is ready

3. Complete quality gates:
   - Performance fixes
   - Responsive pass
   - Dark mode pass
   - Final staging QA

Report owner: Theme implementation team
