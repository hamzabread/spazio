# Spazio Milestone 3 - API Requirements & Integration Guide

**Date**: April 2026  
**Project**: Spazio (spaziocrypto.com)  
**Scope**: For pages already designed in Figma (Homepage, Article, Blog, About Us, Advertising, Careers, Imprint)  
**Status**: API requirements for live launch checklist

---

## Overview

This document outlines all API integrations required to complete Milestone 3 for the **7 designed pages**. Pages not yet designed in Figma (Directory, Crypto Jobs, Events, Press Releases, Crypto Prices page, Tag pages) are excluded from this scope.

---

## Integration Status Summary

| API | Status | Page Usage | Priority |
|-----|--------|-----------|----------|
| Ghost Content API | ✅ Ready | All pages | Critical |
| Ghost Members API (Paywall) | 🔄 Needs activation | Article page | High |
| Newsletter Subscription | 🔄 Needs wiring | Homepage, footer | High |
| Contact Forms (Formspree) | ✅ Configured | Advertising, Careers | Medium |
| Multilingual Routing (Cloudflare) | ✅ Configured | All pages | Medium |
| OneSignal (Push Notifications) | ✅ Configured | Global | Low |
| Trustpilot (Social Proof) | ❓ Optional | Homepage | Low |

---

## 1. Ghost Content API (Read-Only)

**Status**: ✅ **Already Implemented**

### Purpose
Fetch all published content (articles, pages, tags, members, comments) for the frontend.

### Configuration
- **URL**: `http://localhost:2368/ghost/api/v3/content/`
- **Authentication**: API Key (read-only)
- **Rate Limit**: Unlimited locally, 5000 req/day on Ghost Pro

### Usage by Page

#### Homepage
```javascript
// Fetch featured posts (for hero section)
GET /ghost/api/v3/content/posts/?key=YOUR_API_KEY&filter=featured:true&limit=5

// Fetch latest posts (for feed)
GET /ghost/api/v3/content/posts/?key=YOUR_API_KEY&limit=10&order=published_at%20desc
```

#### Article Page
```javascript
// Fetch single article by slug
GET /ghost/api/v3/content/posts/slug/{slug}/?key=YOUR_API_KEY&include=authors,tags

// Fetch related articles (by tag)
GET /ghost/api/v3/content/posts/?key=YOUR_API_KEY&filter=tag:{tag-slug}&limit=3
```

#### Blog Listing Page
```javascript
// Fetch all posts with pagination
GET /ghost/api/v3/content/posts/?key=YOUR_API_KEY&limit=12&page=1&include=tags
```

#### About Us / Imprint
```javascript
// Fetch static pages by slug
GET /ghost/api/v3/content/pages/slug/about/?key=YOUR_API_KEY

GET /ghost/api/v3/content/pages/slug/imprint/?key=YOUR_API_KEY
```

#### Advertising/Media Kit
```javascript
// Fetch media kit page
GET /ghost/api/v3/content/pages/slug/media-kit/?key=YOUR_API_KEY
```

#### Careers
```javascript
// Option 1: Static page
GET /ghost/api/v3/content/pages/slug/careers/?key=YOUR_API_KEY

// Option 2: Posts tagged as jobs
GET /ghost/api/v3/content/posts/?key=YOUR_API_KEY&filter=tag:jobs
```

### Implementation Checklist
- [ ] Verify API key in Ghost admin (Settings → Integrations → Content API)
- [ ] Test all endpoints locally
- [ ] Implement caching (5-10 min TTL) to reduce calls
- [ ] Handle errors gracefully (fallback UI)
- [ ] Ensure featured images load correctly
- [ ] Test with 9 language variants

---

## 2. Ghost Members API (Paywall)

**Status**: 🔄 **Needs Activation**

### Purpose
Implement free vs. paid article paywall based on membership status.

### Configuration
- **URL**: `http://localhost:2368/ghost/api/v3/members/`
- **Authentication**: Member session token (stored in browser)
- **Requires**: Ghost Members feature enabled

### Article Page Integration

#### Check if user is member
```javascript
// Detect current member status
GET /ghost/api/v3/members/me/?key=YOUR_API_KEY

// With token in headers
Headers: { Authorization: `Ghost ${memberToken}` }
```

#### Render paywall content
```javascript
// If member.status === 'paid':
// Show full article content

// If member.status === 'free' || null:
// Show excerpt only + paywall CTA
// Display: "Subscribe to read full article" button
```

#### Template Logic (Handlebars)
```handlebars
{{#post}}
  {{#if access}}
    <!-- Full article for members -->
    {{html}}
  {{else}}
    <!-- Free excerpt for non-members -->
    {{excerpt}}
    
    <div class="paywall-cta">
      <p>{{t "subscribe_to_read_full"}}</p>
      {{subscribe_button}}
    </div>
  {{/if}}
{{/post}}
```

### Email Access
```javascript
// When user clicks "Subscribe" button
POST /ghost/api/v3/members/
{
  "members": [{
    "email": "user@example.com",
    "name": "User Name",
    "labels": ["newsletter"]
  }]
}
```

### Implementation Checklist
- [ ] Enable Members feature in Ghost settings
- [ ] Configure subscription tiers (free/paid plan)
- [ ] Implement Handlebars access checks in article template
- [ ] Style paywall CTA section
- [ ] Test paywall on article page (free & paid versions)
- [ ] Verify subscription email flow works
- [ ] Dark mode styling for paywall

---

## 3. Newsletter Subscription Integration

**Status**: 🔄 **Needs Wiring**

### Purpose
Allow users to subscribe to newsletter from homepage, articles, footer.

### Options

#### Option A: Ghost Members (Built-in)
**Simplest** - subscribe directly to Ghost Members list

```javascript
// Frontend form submission
POST /ghost/api/v3/members/
{
  "members": [{
    "email": "subscriber@example.com",
    "name": "Subscriber Name",
    "subscribed": true
  }]
}
```

**Pros**: No external service needed, integrated with paywall  
**Cons**: Limited email features

#### Option B: Mailchimp
**More features** - email campaigns, automation, segmentation

```javascript
// Frontend form submits to backend
POST https://api.mailchimp.com/marketing/v3.0/lists/{list-id}/members/
{
  "email_address": "subscriber@example.com",
  "status": "pending",
  "merge_fields": {
    "FNAME": "First",
    "LNAME": "Last"
  }
}
```

**Requires**: Mailchimp API key + list ID  
**Pros**: Advanced email features, automation  
**Cons**: External dependency

#### Option C: Substack
**Best for writing-heavy** - use Substack for newsletters, Ghost for articles

```javascript
// Redirect to Substack subscribe form
<iframe src="https://spazio.substack.com/embed" ...></iframe>
```

**Pros**: Dedicated newsletter platform  
**Cons**: Separate from Ghost content

### Implementation (Recommended: Ghost Members)

#### HTML Form
```html
<form id="newsletter-form" class="newsletter-subscribe">
  <input type="email" name="email" placeholder="Your email..." required>
  <input type="text" name="name" placeholder="Your name" optional>
  <button type="submit">Subscribe</button>
</form>
```

#### JavaScript Handler
```javascript
document.getElementById('newsletter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = e.target.email.value;
  const name = e.target.name.value;
  
  try {
    const response = await fetch('/ghost/api/v3/members/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        members: [{
          email: email,
          name: name,
          subscribed: true
        }]
      })
    });
    
    if (response.ok) {
      showSuccess('Check your email to confirm subscription');
    } else {
      showError('Subscription failed. Try again.');
    }
  } catch (error) {
    showError('Error: ' + error.message);
  }
});
```

### Form Locations
- [ ] **Homepage**: Subscribe widget in hero section
- [ ] **Homepage**: Call-to-action section
- [ ] **Article page**: Newsletter signup below article
- [ ] **Footer**: Newsletter subscription widget (across all pages)
- [ ] **Blog listing**: Newsletter section between post grid

### Implementation Checklist
- [ ] Choose subscription method (Ghost Members recommended)
- [ ] Create subscribe form in HTML
- [ ] Implement JavaScript submission handler
- [ ] Add success/error message UI
- [ ] Style form across all pages
- [ ] Test email confirmation flow
- [ ] Dark mode styling
- [ ] Mobile responsive testing

---

## 4. Contact Forms (Formspree)

**Status**: ✅ **Already Configured**

### Configuration
- **Service**: Formspree
- **Endpoint**: `https://formspree.io/f/xwkdojlk`
- **Setup**: Already in `page-contact-us.hbs`

### Usage

#### Advertising/Media Kit Page
```html
<form action="https://formspree.io/f/xwkdojlk" method="POST">
  <input type="email" name="email" required>
  <input type="text" name="subject" placeholder="Inquiry type">
  <textarea name="message" placeholder="Your message..." required></textarea>
  <button type="submit">Send Inquiry</button>
</form>
```

#### Careers Page
```html
<form action="https://formspree.io/f/xwkdojlk" method="POST">
  <input type="text" name="name" placeholder="Your name" required>
  <input type="email" name="email" required>
  <input type="file" name="resume" accept=".pdf,.doc,.docx">
  <textarea name="message" placeholder="Cover letter..." required></textarea>
  <button type="submit">Submit Application</button>
</form>
```

### Implementation Checklist
- [ ] Verify Formspree endpoint in both pages
- [ ] Test form submission
- [ ] Verify email delivery
- [ ] Style form to match theme
- [ ] Add success/error messages
- [ ] Implement spam protection (honeypot)
- [ ] Dark mode styling

---

## 5. Multilingual Routing (Cloudflare Worker)

**Status**: ✅ **Already Configured**

### Configuration
- **Service**: Cloudflare Worker
- **URL**: `https://spazio-multilang.ghostflow.workers.dev/`
- **Purpose**: Route requests to correct language version
- **Languages**: 9 supported (en, de, es, fr, it, ja, ko, ru, zh)

### How It Works

```
User visits: https://spaziocrypto.com/article-slug
     ↓
Cloudflare Worker checks:
  - Accept-Language header
  - User's previous language choice
  - URL language prefix
     ↓
Routes to: https://spaziocrypto.com/{lang}/article-slug
     ↓
Frontend renders in selected language
```

### Implementation Checklist
- [ ] Verify Cloudflare Worker is deployed
- [ ] Test language switching on all pages
- [ ] Verify language persistence (localStorage)
- [ ] Test Accept-Language header detection
- [ ] Verify translated content loads correctly
- [ ] Test language switcher component (header/footer)

---

## 6. OneSignal (Push Notifications)

**Status**: ✅ **Already Configured**

### Configuration
- **Service**: OneSignal
- **App IDs Configured**: 9 language variants (en, de, es, fr, it, ja, ko, ru, zh)
- **Setup**: Configured in Ghost Admin (Settings → Integrations → OneSignal)

### Usage

#### Subscribe User to Notifications
```javascript
// On page load, if user opts in
OneSignal.push(function() {
  OneSignal.addEventListener('subscriptionChange', function(isSubscribed) {
    console.log("User subscribed: " + isSubscribed);
  });
});

// Request notification permission
OneSignal.push(() => {
  OneSignal.requestPushPermission().then(() => {
    console.log('Push permission granted');
  });
});
```

#### Send Notification (from Ghost admin)
```
When publishing new article:
1. Ghost publishes post
2. OneSignal webhook triggered
3. Push notification sent to all subscribers
4. Notification links to new article
```

### Implementation Checklist
- [ ] Verify OneSignal is loaded on all pages
- [ ] Test push notification permission prompt
- [ ] Test notification delivery (publish test article)
- [ ] Verify notification click tracking
- [ ] Test notification delivery per language
- [ ] Verify dark mode support

---

## 7. Trustpilot Integration (Optional)

**Status**: ❓ **Optional for Milestone 3**

### Configuration
- **Service**: Trustpilot
- **Use Case**: Display customer reviews/ratings on homepage
- **URL**: `https://www.trustpilot.com/review/spaziocrypto.com`

### Implementation (if included)

#### Trust Section Widget
```html
<div class="trust-section">
  <!-- Option A: Trust badge (embedded) -->
  <iframe src="https://widget.trustpilot.com/..." />
  
  <!-- Option B: Star rating display -->
  <div class="star-rating">
    <span class="stars">★★★★★</span>
    <span class="rating">4.8 out of 5</span>
  </div>
</div>
```

#### JavaScript Loading
```javascript
// Load Trustpilot script if not already present
if (!window.Trustpilot) {
  const script = document.createElement('script');
  script.src = 'https://cdn.trustpilot.net/TrustboxAPI.js';
  document.body.appendChild(script);
}
```

### Implementation Checklist
- [ ] Decide if Trustpilot is needed for Milestone 3
- [ ] Embed trust widget/badge
- [ ] Style to match homepage design
- [ ] Test loading and rendering
- [ ] Dark mode compatibility
- [ ] Mobile responsive styling

---

## 8. Required Configurations by Page

### Homepage
- [ ] Ghost Content API (featured posts, latest posts)
- [ ] Newsletter subscription form
- [ ] Trust section (if included)
- [ ] Language switcher
- [ ] Push notification opt-in (optional)

### Article Page
- [ ] Ghost Content API (single post + related articles)
- [ ] Ghost Members API (paywall logic)
- [ ] Newsletter subscription form
- [ ] Social share buttons (native JavaScript)
- [ ] Comments section (Ghost native)

### Blog Listing Page
- [ ] Ghost Content API (post list with pagination)
- [ ] Newsletter subscription widget
- [ ] Tag filters (Ghost native)
- [ ] Language switching

### About Us Page
- [ ] Ghost Content API (page content)

### Advertising/Media Kit
- [ ] Ghost Content API (page content)
- [ ] Formspree contact form
- [ ] Language switching

### Careers Page
- [ ] Ghost Content API (page content + job listings)
- [ ] Formspree application form
- [ ] Language switching

### Imprint Page
- [ ] Ghost Content API (page content)

---

## Testing Checklist

### API Connectivity
- [ ] Test all Ghost Content API endpoints
- [ ] Test Ghost Members API authentication
- [ ] Test Newsletter subscription submission
- [ ] Test Formspree form submission
- [ ] Test language routing (Cloudflare Worker)
- [ ] Test OneSignal configurations

### Performance
- [ ] API responses < 500ms
- [ ] Implement caching (5 min TTL for posts)
- [ ] Lazy load external scripts (Trustpilot, OneSignal)
- [ ] Monitor API call frequency (avoid rate limits)

### User Experience
- [ ] Form validation (email format, required fields)
- [ ] Error handling (show user-friendly messages)
- [ ] Loading states (show spinners while fetching)
- [ ] Success feedback (confirmation messages)
- [ ] Mobile testing (all forms responsive)

### Security
- [ ] No API keys exposed in frontend code
- [ ] Form CSRF protection
- [ ] Input validation and sanitization
- [ ] HTTPS only (no HTTP calls)
- [ ] Rate limiting on forms

### Internationalization
- [ ] Newsletter/contact forms work in all 9 languages
- [ ] Error/success messages translated
- [ ] Language switcher functional on all pages
- [ ] Date/number formatting per locale

### Dark Mode
- [ ] All forms styled correctly in dark mode
- [ ] Input fields readable in both modes
- [ ] Buttons contrast sufficient
- [ ] Links visible in both modes

---

## Implementation Priority

### Phase 1 (Critical - Required for Launch)
1. Ghost Content API testing + caching
2. Newsletter subscription wiring (all pages)
3. Ghost Members API paywall testing
4. Formspree form testing

### Phase 2 (High - Before Staging)
1. Language switching verification
2. Form styling + dark mode
3. Error/success message implementation
4. Mobile responsive testing

### Phase 3 (Medium - Polish)
1. Performance optimization
2. Push notification testing
3. Trustpilot (if included)
4. Analytics integration

---

## Backend Service Endpoints

All these APIs are called from the frontend (Handlebars templates or JavaScript). No additional backend service required for these integrations.

### Local Testing
```bash
# Ghost Backend
http://localhost:2368

# API Endpoints
http://localhost:2368/ghost/api/v3/content/
http://localhost:2368/ghost/api/v3/members/

# External Services (via proxy or direct)
https://api.mailchimp.com/
https://api.trustpilot.com/
https://formspree.io/
https://cdn.onesignal.com/
```

### Staging/Production
```bash
# Ghost Backend
https://spaziocrypto.com

# API Endpoints
https://spaziocrypto.com/ghost/api/v3/content/
https://spaziocrypto.com/ghost/api/v3/members/

# Cloudflare Worker
https://spazio-multilang.ghostflow.workers.dev/
```

---

## Environment Variables

Create `.env` or configure in Ghost settings:

```
# Ghost
GHOST_URL=http://localhost:2368
GHOST_CONTENT_API_KEY=your_content_api_key
GHOST_ADMIN_API_KEY=your_admin_api_key

# Newsletter (if using Mailchimp)
MAILCHIMP_API_KEY=your_mailchimp_key
MAILCHIMP_LIST_ID=your_list_id

# Forms
FORMSPREE_EMAIL=contact@spaziocrypto.com

# Notifications
ONESIGNAL_APP_ID_EN=your_en_app_id
# ... (for each language)

# Tracking (optional)
GTAG_ID=your_gtag_id
```

---

## Common Issues & Fixes

### Issue: Newsletter form not submitting
```
1. Check API endpoint is correct
2. Verify Content-Type header is 'application/json'
3. Check browser console for CORS errors
4. Verify email field is required and valid format
```

### Issue: Paywall not showing for non-members
```
1. Verify Ghost Members feature is enabled
2. Check post has 'access' property set in Ghost
3. Verify Handlebars {{access}} tag is in template
4. Check member token is being passed correctly
```

### Issue: Formspree submissions not working
```
1. Verify endpoint URL is correct
2. Check form method is POST
3. Verify form has name attributes on inputs
4. Check SPAM filtering isn't blocking emails
5. Verify email field is included
```

### Issue: Language switching not working
```
1. Verify Cloudflare Worker is deployed
2. Check localStorage is enabled
3. Verify language codes match (en, de, es, etc)
4. Check URL includes language prefix
```

---

## API Call Quota Estimates

| API | Calls/Month | Limit | Status |
|-----|------------|-------|--------|
| Ghost Content API | ~5,000-10,000 | Unlimited | ✅ OK |
| Ghost Members API | ~100-500 | Unlimited | ✅ OK |
| Formspree | ~50-100 | 50/month (free) | ⚠️ May need upgrade |
| Trustpilot | ~1,000 | Unlimited | ✅ OK |
| OneSignal | ~100 | 30,000/month (free) | ✅ OK |
| Mailchimp | ~500-1,000 | 500/month (free) | ⚠️ May need upgrade |

**Note**: For Formspree & Mailchimp, consider upgrading free plans as site grows.

---

## Delivery Checklist

Before releasing to production, verify:

- [ ] All Ghost Content API calls tested and working
- [ ] Newsletter subscription functional on all pages
- [ ] Article paywall tested (free + paid versions)
- [ ] Contact forms submissions working
- [ ] Language switching functional
- [ ] OneSignal push notifications tested
- [ ] All forms styled + responsive
- [ ] Dark mode tested on all forms
- [ ] Error messages user-friendly
- [ ] No API keys in frontend code
- [ ] HTTPS enforced
- [ ] Performance meets Core Web Vitals
- [ ] Mobile testing complete (375px - 1440px)
- [ ] Staging server tested end-to-end
- [ ] Client approval on all pages

---

**Last Updated**: April 1, 2026  
**Frontend Lead**: Hamza  
**Questions?**: Contact frontend team
