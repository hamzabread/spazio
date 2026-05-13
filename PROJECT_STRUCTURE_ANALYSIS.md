# Spazio-Pitch-Multi Ghost Theme - Complete Project Structure Analysis

## 1. OVERALL ARCHITECTURE & FILE ORGANIZATION

### Project Overview
- **Theme Name**: spazio-pitch-multi
- **Description**: Customized Pitch theme for spaziocrypto.com
- **Ghost Version**: >=5.0.0
- **License**: MIT
- **Build System**: Rollup with PostCSS and Babel
- **Package Manager**: npm

### Directory Structure

```
spazio-pitch-multi/
├── assets/                     # Theme assets (CSS, JS, images)
│   ├── built/                 # Output directory (compiled CSS/JS)
│   │   ├── index.css          # Compiled CSS (minified)
│   │   ├── index.css.map      # CSS source map
│   │   ├── index.js           # Compiled JS (minified)
│   │   └── index.js.map       # JS source map
│   ├── css/                   # Source CSS files (43 files)
│   ├── js/                    # Source JavaScript files (20 files)
│   ├── font/                  # Custom font files
│   └── imagesAndIcons/        # Static assets (images, SVGs)
│
├── partials/                  # Reusable template components
│   ├── icons/                 # Icon partial templates (36 SVG icons)
│   ├── flags/                 # Language flag assets
│   ├── ads/                   # Ad-related partials
│   └── [43 other partials]    # Feature components
│
├── locales/                   # Internationalization (i18n)
│   ├── de.json               # German
│   ├── en.json               # English
│   ├── es.json               # Spanish
│   ├── fr.json               # French
│   ├── it.json               # Italian
│   ├── ja.json               # Japanese
│   ├── ko.json               # Korean
│   ├── ru.json               # Russian
│   └── zh.json               # Chinese
│
├── [Root-level Templates]     # Main Ghost templates
│   ├── default.hbs           # Base layout template
│   ├── index.hbs             # Homepage
│   ├── post.hbs              # Single blog post template
│   ├── page.hbs              # Single page template
│   ├── author.hbs            # Author archive page
│   ├── tag.hbs               # Tag archive page
│   ├── error-404.hbs         # 404 error page
│   ├── page-blogs.hbs        # Featured blogs page
│   ├── page-careers.hbs      # Careers/jobs page
│   ├── page-about-us.hbs     # About page
│   ├── page-contact-us.hbs   # Contact page
│   ├── contact.hbs           # Contact template
│   ├── advertise.hbs         # Advertising page
│   ├── custom-*.hbs          # Custom templates (15 variants)
│   └── default-*.hbs         # Default page variants
│
├── scripts/                   # Utility scripts
│   └── generate_report_pdf.py # PDF generation script
│
├── rollup.config.js          # Build configuration
├── package.json              # Dependencies and scripts
└── [Documentation Files]     # Markdown docs and PDFs
```

---

## 2. CSS/STYLING FILES & ORGANIZATION

### Source CSS Files (43 total)

#### Core/Global Styles:
- **normalize.css** - Browser reset/normalization
- **global.css** - Global styles and base styles
- **vars.css** - CSS custom properties (variables) for theming
- **animations.css** - Keyframe animations
- **errors.css** - Error state styles
- **media.css** - Media query utilities
- **multi-language.css** - Language-specific styles
- **index.css** - Entry point (imports all CSS)

#### Component-Specific CSS:
- **header.css** - Navigation header styling
- **footer.css** - Footer section styling
- **buttons.css** - Button component styles
- **breadcrumbs.css** - Breadcrumb navigation
- **hero-section.css** - Hero banner
- **modal.css** - Modal dialog styling
- **sidebar.css** - Sidebar widgets
- **post-card.css** - Blog post card styling
- **extended-header.css** - Extended header variant

#### Page-Specific CSS:
- **homePage.css** - Homepage layout
- **blogsPage.css** - Blogs page layout (CONTAINS FEATURED CONTENT CSS)
- **postPage.css** - Single post page
- **posts-layout.css** - Posts grid layout
- **aboutUsPage.css** - About page
- **careersPage.css** - Careers/jobs page (CONTAINS JOB-RELATED CSS)
- **error404Page.css** - 404 page
- **authorPage.css** - Author archive page
- **imprintPage.css** - Legal imprint page
- **archivePage.css** - Archive page layout
- **archiveCard.css** - Archive card component
- **categoryFeed.css** - Category feed layout

#### Feature-Specific CSS:
- **featured-posts.css** - Featured posts styling
- **featured-feed.css** - Featured feed layout
- **memberCard.css** - Membership cards
- **membership.css** - Membership page layout
- **formPages.css** - Form styling
- **advertising.css** - Advertising blocks
- **banners.css** - Banner sections
- **heroSection.css** - Hero sections (CONTAINS JOB APPLY CSS)
- **languagePopUp.css** - Language selector popup
- **scam.css** - Scam alert styling
- **tagSection.css** - Tag section styling
- **videoFeed.css** - Video feed layout
- **pressRelease.css** - Press release styling
- **pressReleaseFeed.css** - Press release feed
- **categoryFeed.css** - Category feed
- **scrollToTopBtn.css** - Scroll-to-top button

#### Utility CSS:
- **market-dashboard.css** - Market dashboard styling

---

## 3. CSS RULES LOCATION - SPECIFIC COMPONENTS

### `.sc-job-apply` - Job Apply Button
**Location**: [assets/css/heroSection.css](assets/css/heroSection.css#L2598)

**CSS Class Usages**:
```css
/* Main definition (line 2598) */
.sc-job-apply {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 14px;
    border: 1px solid transparent;
    background: rgba(241, 143, 32, 0.10);
    color: #F18F20;
    font-family: "Helvetica Now Display";
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
}

/* Hover state (line 2617) */
.sc-job-apply:hover {
    border: 1px solid rgba(241, 143, 32, 0.50);
    background: #F9992A;
    color: #121212;
}

/* Mobile breakpoint (line 2709) */
@media (max-width: 767px) {
    .sc-job-apply {
        position: static;
        align-self: flex-start;
        margin-top: 10px;
    }
}
```

**Template Usage**: [partials/job-card.hbs](partials/job-card.hbs#L46)

---

### `.sc-blogs-featured-content` - Featured Blog Content Container
**Location**: [assets/css/blogsPage.css](assets/css/blogsPage.css#L37)

**CSS Class Definition**:
```css
.sc-blogs-featured-content {
    position: absolute;
    right: 50px;
    bottom: 100px;
    z-index: 2;
    max-width: 678px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(16, 16, 16, 0.90);
    backdrop-filter: blur(2px);
    padding: 26px 30px;
    text-decoration: none;
    display: block;
    color: inherit;
}

/* Responsive (line 1080) */
@media (max-width: 1100px) {
    .sc-blogs-featured-content {
        max-width: 100%;
        padding: 20px;
        right: 0;
        left: 0;
        bottom: 0;
    }
}
```

**Template Usage**: 
- [page-blogs.hbs](page-blogs.hbs#L14)
- [post.hbs](post.hbs#L15)

---

### `.sc-blogs-featured-meta` - Blog Metadata (Author, Date, Reading Time)
**Location**: [assets/css/blogsPage.css](assets/css/blogsPage.css#L99)

**CSS Class Definition**:
```css
.sc-blogs-featured-meta {
    margin-top: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #9FB0C2;
    font-feature-settings: 'dlig' on, 'salt' on;
    font-family: "Helvetica Now Display";
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 110%;
}
```

**Template Usage**:
- [page-blogs.hbs](page-blogs.hbs#L29)
- [post.hbs](post.hbs#L30)

---

### `.sc-blogs-featured-tag` - Blog Tag Badge
**Location**: [assets/css/blogsPage.css](assets/css/blogsPage.css#L61)

**CSS Class Definition**:
```css
.sc-blogs-featured-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 12px;
    border-radius: 22px;
    background: rgba(241, 143, 32, 0.10);
    color: #F18F20;
    font-feature-settings: 'dlig' on, 'salt' on;
    font-family: "Helvetica Now Display";
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 110%;
}
```

**Related Classes**:
- `.sc-blogs-featured-tags` - Container for tags (line 53)
- Parent: `.sc-blogs-featured-content` (line 37)

**Template Usage**:
- [page-blogs.hbs](page-blogs.hbs#L18)
- [post.hbs](post.hbs#L19)

---

## 4. DARK MODE & LIGHT MODE IMPLEMENTATION

### Dark Mode System Architecture

#### CSS Variables Approach:
The project uses CSS custom properties (CSS variables) in [assets/css/vars.css](assets/css/vars.css) with a `:root` selector for light mode and `:root[data-color-scheme="dark"]` for dark mode.

**Light Mode Variables** (Default - line 1):
```css
:root {
    --color-background-main: #F8F9FA;
    --color-surface-101010: #FFF;
    --color-border-strong-adaptive: #F2F4F5;
    --color-ebeff2-adaptive: #022538;
    --color-bg-alt: #F9F9F9;
    --color-main: #1D1D1F;
    /* ... 50+ more variables */
}
```

**Dark Mode Variables** (line ~160):
```css
:root[data-color-scheme="dark"] {
    --color-background-main: #000;
    --color-surface-101010: #101010;
    --color-border-strong-adaptive: #1B1B1B;
    --color-ebeff2-adaptive: var(--color-ebeff2-adaptive);
    --color-bg-alt: #050505;
    --color-main: #EDEDED;
    /* ... corresponding dark mode values */
}
```

#### JavaScript Dark Mode Toggle:
**File**: [assets/js/darkMode.js](assets/js/darkMode.js)

**Functionality**:
```javascript
const toggleDarkMode = (changeTweetsTheme) => {
    const switchTheme = () => {
        const rootElem = document.querySelector("html[data-color-scheme]");
        const gecko = document.getElementById("gecko");
        const priceChartElements = document.querySelectorAll(".gecko-price-chart");
        
        let dataTheme = rootElem.getAttribute("data-color-scheme");
        let newTheme = dataTheme === "light" ? "dark" : "light";
        
        // Update HTML attribute
        rootElem.setAttribute("data-color-scheme", newTheme);
        
        // Persist to localStorage
        localStorage.setItem("color-scheme", newTheme);
        
        // Update external widgets (Gecko charts, Twitter embeds)
        if (gecko) {
            gecko.setAttribute("dark-mode", newTheme === "dark" ? "true" : "false");
        }
        
        if (priceChartElements.length) {
            priceChartElements.forEach((chart) => {
                chart.setAttribute("dark-mode", newTheme === "dark" ? "true" : "false");
            });
        }
        
        changeTweetsTheme();
    };

    const toggleBtns = document.querySelectorAll(".gh-dark-mode-toggle-btn");
    toggleBtns.forEach((btn) => {
        btn.addEventListener("click", switchTheme);
    });
};
```

#### Dark Mode CSS Usage:
Dark mode selectors are applied throughout CSS files:
```css
:root[data-color-scheme="dark"] .sc-blogs-featured-card {
    background: var(--color-bg-alt);
    border-color: var(--color-header-border);
}

:root[data-color-scheme="dark"] .sc-job-apply {
    /* dark mode specific styles */
}
```

#### Storage & Persistence:
- Uses `localStorage` to persist user's theme preference
- Key: `color-scheme`
- Values: `"light"` or `"dark"`

---

## 5. JAVASCRIPT FILES & NAVIGATION/LINKS

### JavaScript Files (20 total in assets/js/)

#### Build Entry Point:
- **index.js** - Main entry point (imported by Rollup)

#### Navigation & Menu:
- **header.js** - Header navigation logic
- **mobileMenu.js** - Mobile hamburger menu handler
- **languageLinks.js** - Language switcher functionality
- **languagePopUp.js** - Language selection popup

#### Theme/Visual:
- **darkMode.js** - Dark/light mode toggle (covered above)
- **twitterTheme.js** - Twitter embed theme adaptation
- **scrollTop.js** - Scroll-to-top button functionality
- **scrollToTopBtn.js** - Alternative scroll button handler

#### Interactive Features:
- **toggleAccordion.js** - Accordion expand/collapse
- **loadMore.js** - "Load more" button for infinite scroll
- **initSliders.js** - Slider/carousel initialization
- **widget.js** - Widget initialization
- **membershipToggle.js** - Membership plan toggle

#### Data & Utilities:
- **copyToClipBoard.js** - Clipboard copy functionality
- **eventMeta.js** - Event metadata extraction
- **footerExternalLinks.js** - External link handling in footer
- **footerFontColor.js** - Footer text color management
- **glossaryTooltip.js** - Glossary tooltip triggering
- **marketDashboard.js** - Market data dashboard
- **membershipCard.js** - Membership card interactions
- **vibrator.js** - Haptic feedback for mobile

### Navigation/Link System:
- Custom nav links in footer with external link icons
- Language-aware navigation via `languageLinks.js`
- Mobile menu using hamburger icon (`mobileMenu.js`)
- Header navigation from Ghost theme defaults

**Related Files**:
- [partials/header.hbs](partials/header.hbs) - Header component
- [partials/navigation.hbs](partials/navigation.hbs) - Navigation menu
- [partials/mobile-menu.hbs](partials/mobile-menu.hbs) - Mobile menu
- [partials/footer.hbs](partials/footer.hbs) - Footer with links
- [partials/langswitch.hbs](partials/langswitch.hbs) - Language switcher

---

## 6. TEMPLATE FILES - JOBS, BLOGS, AND FEATURED CONTENT

### Blog-Related Templates

#### Featured Blogs Page:
**[page-blogs.hbs](page-blogs.hbs)**
- Displays featured blog post in hero section
- Uses `sc-blogs-featured-*` CSS classes
- Includes tag filtering (limit 4 tags per post)
- Shows featured blog meta (date, reading time)
- Fallback featured post display when no featured posts exist

**Key Query**:
```handlebars
{{#get "posts" limit="1" include="tags,authors" 
       filter="featured:true" order="published_at desc"}}
```

#### Single Post/Blog Template:
**[post.hbs](post.hbs)**
- Displays individual blog post content
- Featured hero section (same as page-blogs.hbs)
- Three-column layout:
  - Left: Author details, share buttons, reactions preview
  - Center: Main blog content
  - Right: Featured posts sidebar
- Related articles section (same primary tag)
- Sidebar: Related posts widget

**Styling**: Uses `.sc-blogs-featured-*` classes for hero section

---

### Jobs/Careers Templates

#### Careers Page:
**[page-careers.hbs](page-careers.hbs)**
- Hero section with "Build the Future of Web3 Journalism With Us"
- Open job positions section
- Uses hardcoded job card components
- Individual job cards with metadata:
  - Location (Remote/Hybrid/On-site)
  - Employment type (Full-time/Part-time/etc.)
  - Salary range
  - Posted date

#### Job Card Partial:
**[partials/job-card.hbs](partials/job-card.hbs)**
- Reusable job card component
- Displays: Logo, title, description, metadata, tags, apply button
- CSS Classes: `.sc-job-*` (title, desc, meta, salary, tags, tag, apply)
- Features:
  - Dynamic job type detection (Full-time, Part-time, Contract, etc.)
  - Salary range from tags (#salary-90k-120k, etc.)
  - Location info (Remote, Hybrid, On-site)
  - Job category tags (Crypto, Web3, DeFi)
  - "Apply Now" button (`.sc-job-apply`) linking to job post

**Applied in**: Various templates via `{{> "job-card"}}`

---

### Featured Content Architecture

#### Featured Blogs Hierarchy:
```
.sc-blogs-featured-card (container)
├── .sc-blogs-featured-media (background image)
├── .sc-blogs-featured-noimage (fallback gradient)
└── .sc-blogs-featured-content (overlay content)
    ├── .sc-blogs-featured-tags
    │   └── .sc-blogs-featured-tag (repeating)
    ├── h2 (title)
    ├── p (excerpt)
    └── .sc-blogs-featured-meta
        ├── time (date)
        ├── reading_time
        └── author (in post.hbs)
```

#### Featured Content Grid:
**[partials/content-grid.hbs](partials/content-grid.hbs)** - Likely contains featured article layout with:
- Left sidebar: Market card, sponsored content
- Center: Featured article
- Right sidebar: Featured posts list

---

## 7. DYNAMIC ARTICLES PAGE/TEMPLATE

### No Dedicated "Articles" Page
The project doesn't appear to have a dedicated `/articles/` page. Instead:

#### Posts Discovery Methods:

1. **Homepage** ([index.hbs](index.hbs))
   - Breaking news section
   - Featured articles section
   - Latest posts feed

2. **Blog Browse Page** ([page-blogs.hbs](page-blogs.hbs))
   - Featured blog hero
   - Blog grid layout
   - Filtered/tagged posts

3. **Tag Archive** ([tag.hbs](tag.hbs))
   - Dynamic: `/tag/{tag-slug}/`
   - Lists all posts with specific tag

4. **Author Archive** ([author.hbs](author.hbs))
   - Dynamic: `/author/{author-slug}/`
   - Lists all posts by author

5. **Search** (via Ghost's built-in search)
   - Likely integrated in header

#### Post Listing Patterns:
Most post listings use Ghost helpers:
```handlebars
{{#get "posts" limit="10" include="tags,authors" order="published_at desc"}}
    {{#foreach posts}}
        {{> "post-card"}}
    {{/foreach}}
{{/get}}
```

**Available Post Card Partials**:
- [partials/post-card.hbs](partials/post-card.hbs) - Standard post card
- [partials/post-card-timeline.hbs](partials/post-card-timeline.hbs) - Timeline variant
- [partials/featured-posts.hbs](partials/featured-posts.hbs) - Featured posts widget

---

## 8. BUILD & DEPLOYMENT PROCESS

### Build Configuration
**[rollup.config.js](rollup.config.js)**

**Build Steps**:
1. Input: `assets/js/index.js`
2. Plugins:
   - CommonJS → ES6 module conversion
   - Node resolution for dependencies
   - Babel transpilation (latest JS features)
   - PostCSS processing:
     - CSS imports aggregation
     - Modern CSS preset (future CSS support)
     - CSS minification for production
3. Output: `assets/built/` directory
   - `index.js` (minified, with sourcemap)
   - `index.css` (minified, with sourcemap)

### npm Scripts
From [package.json](package.json):

```json
{
  "dev": "rollup -c --environment BUILD:development -w",
  "build": "rollup -c --environment BUILD:production",
  "zip": "npm run build && bestzip spazio-pitch-multi.zip ...",
  "test": "npx gscan .",
  "pretest": "npm run build"
}
```

**Commands**:
- `npm run dev` - Development mode with file watcher
- `npm run build` - Production build (minified, optimized)
- `npm run test` - Ghost theme scanner validation
- `npm run zip` - Package theme into distributable zip

---

## 9. KEY CUSTOMIZATIONS & FEATURES

### Theme Customizations:
1. **Multi-language Support** - 10 locales (de, en, es, fr, it, ja, ko, ru, zh)
2. **Crypto-Specific Features**:
   - Market dashboard
   - Crypto jobs board
   - Ticker/price feeds
   - Press releases
   - Scam alerts
3. **Dark Mode** - Full light/dark theme support
4. **Custom Pages**:
   - Careers
   - Blog directory
   - About Us
   - Advertising
   - Contact
   - Imprint (legal)
5. **Membership System** - Membership card toggles and sign-up
6. **Advanced Navigation** - Multi-level menus, mobile optimization
7. **Rich Media Support**:
   - Video feeds
   - Image galleries
   - Testimonials/Trustpilot integration

---

## 10. FILE DEPENDENCY MAP

### CSS Dependencies (via @import in index.css):
```
assets/css/index.css
├── normalize.css
├── vars.css (❌ includes light + dark mode variables)
├── global.css
├── header.css
├── footer.css
├── [page-specific CSS files]
└── ... (43 total CSS files)
```

### JavaScript Dependencies (via Rollup bundling):
```
assets/js/index.js
├── darkMode.js
├── header.js
├── mobileMenu.js
└── ... (20 total JS files, bundled into single index.js)
```

### Template Dependencies:
```
default.hbs (base layout)
├── default-contact.hbs
├── index.hbs (homepage)
├── post.hbs (single post/blog)
├── page.hbs (generic page)
├── page-blogs.hbs (blog browse)
├── page-careers.hbs (jobs page)
├── author.hbs (author archive)
├── tag.hbs (tag archive)
└── partials/
    ├── header.hbs
    ├── footer.hbs
    ├── job-card.hbs
    ├── post-card.hbs
    ├── featured-posts.hbs
    └── ... (43+ partials)
```

---

## SUMMARY

This Ghost theme is a sophisticated, multi-feature cryptocurrency media platform with:

✅ **Professional architecture** with modular CSS and JavaScript
✅ **Complete dark/light mode** support via CSS variables
✅ **Specialized components** for jobs, blogs, and featured content
✅ **International support** with 10 language localizations
✅ **Responsive design** with mobile-first breakpoints
✅ **Build pipeline** using modern tools (Rollup, PostCSS, Babel)
✅ **Rich feature set** including market dashboards, press releases, and scam alerts

**Key Navigation Files**: header.js, darkMode.js, mobileMenu.js, languageLinks.js
**Key Styling Files**: vars.css (themes), blogsPage.css (featured content), heroSection.css (jobs)
**Key Templates**: page-blogs.hbs (blog page), post.hbs (blog post), page-careers.hbs (jobs page)
