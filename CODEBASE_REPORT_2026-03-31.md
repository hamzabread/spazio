# Spazio Codebase Report

Date: 2026-03-31
Repository: spazio-pitch-multi

## 1. Project Overview

Spazio is a custom Ghost CMS theme for a multilingual crypto media platform.

Core stack:
- Ghost theme templates (Handlebars)
- Modular CSS in assets/css
- JavaScript modules in assets/js
- Rollup build pipeline for production assets

Supported language variants:
- EN, IT, ES, FR, DE, JA, KO, RU, ZH

## 2. Key Codebase Structure

Main templates:
- default.hbs
- index.hbs
- page.hbs
- post.hbs
- tag.hbs
- author.hbs
- custom-*.hbs templates

Reusable components:
- partials/header.hbs
- partials/footer.hbs
- partials/featured-feed.hbs
- partials/market-dashboard.hbs
- partials/subscribe-newsletter.hbs
- partials/faq-section.hbs

Frontend assets:
- assets/css/* for page and component styling
- assets/js/* for behavior modules
- assets/built/* compiled production output

## 3. Existing Integrations Found

Configured or partially configured integrations:
- Ghost Content API usage in tag rendering logic
- Cloudflare Worker webhook for multilingual post URL mapping
- Formspree endpoint on contact form
- OneSignal SDK for browser push notifications
- n8n webhook integration in custom-post-records.hbs
- Glossary tooltip loader with localStorage caching

## 4. Backend and API Requirements To Be Fully Functional

### 4.1 Crypto market data backend
Required:
- CoinGecko API (or equivalent market provider)
- Endpoints for price, market cap, top movers, and chart data
- 5-minute caching strategy to reduce rate limit pressure

Use cases:
- market-dashboard values (currently static)
- blogs page market card values
- upcoming crypto prices page

### 4.2 Multilingual routing backend
Required:
- Stable Cloudflare Worker or API service for per-post language mapping
- Reliability monitoring and fallback behavior if mapping API fails

Use cases:
- language switch links
- hreflang canonical alternates per post

### 4.3 Form handling backend
Required:
- Contact form submission pipeline (already pointed to Formspree)
- Advertising inquiry processing endpoint or CRM webhook
- Optional auto-response email workflow

Use cases:
- contact page form
- advertising page lead capture

### 4.4 Newsletter and members backend
Required:
- Ghost Members flow finalization or external email provider API
- newsletter subscribe endpoint and tagging logic
- double opt-in and anti-spam validation

Use cases:
- newsletter section CTAs
- member signup and onboarding pages

### 4.5 Records data backend
Required:
- n8n workflow connected to a real datastore
- secured token management (remove placeholder token)
- typed response contract for record cards

Use cases:
- custom-post-records page data rendering

### 4.6 Glossary source endpoint
Required:
- reliable glossary source page/endpoint for tooltip extraction
- define and maintain GLOSSARY_URL consistently
- graceful fallback when glossary source is unavailable

Use cases:
- in-article glossary term tooltips

## 5. Security and Production Readiness

Actions required before production:
- move all API tokens and secrets to environment-managed storage
- remove hardcoded placeholder auth tokens
- add rate limiting and timeout handling for external fetches
- add error boundaries/fallback UI for API outages
- validate CORS policy for webhook/API endpoints

## 6. QA and Operations Checklist

Recommended final checks:
- responsive QA on 375, 768, 1280, and 1440 breakpoints
- dark mode consistency across templates and components
- Lighthouse performance verification for core pages
- verify all forms deliver to the expected inbox/workflow
- verify multilingual links for all 9 locales

## 7. Conclusion

The current codebase has a strong frontend structure and key integration stubs in place.
To make the site fully functional, the highest priority is completing market-data APIs,
newsletter/members workflows, records API wiring, and resilient multilingual routing.
