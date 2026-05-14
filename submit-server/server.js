import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import GhostAdminAPI from '@tryghost/admin-api';

const {
  GHOST_URL = 'http://localhost:2368',
  GHOST_ADMIN_API_KEY,
  PORT = 3001,
  PRESS_RELEASE_TAG = 'press-release',
  EVENT_TAG = 'event',
  JOB_TAG = 'jobs',
  COMPANY_TAG = 'company',
  ALLOWED_ORIGIN = 'http://localhost:2368',
  PUBLISH_STATUS = 'draft',
} = process.env;

if (!GHOST_ADMIN_API_KEY || GHOST_ADMIN_API_KEY === 'PASTE_KEY_HERE') {
  console.error('[submit-server] GHOST_ADMIN_API_KEY missing. Copy .env.example to .env and paste your Ghost Admin API key (Admin → Integrations → Add custom integration).');
  process.exit(1);
}

const api = new GhostAdminAPI({
  url: GHOST_URL,
  key: GHOST_ADMIN_API_KEY,
  version: 'v5.0',
});

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '_');
      cb(null, Date.now() + '-' + safe);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
  },
});

app.post('/submit-event', upload.single('coverImage'), async (req, res) => {
  let uploadedTempPath = req.file?.path;
  try {
    const {
      eventName,
      eventType,
      category,
      startDate,
      endDate,
      time,
      venue,
      cityCountry,
      description,
      eventUrl,
      attendees,
    } = req.body || {};

    if (!eventName?.trim() || !category?.trim() || !startDate?.trim()
        || !venue?.trim() || !cityCountry?.trim() || !description?.trim()
        || !eventUrl?.trim()) {
      return res.status(400).json({ ok: false, error: 'Please fill all required fields.' });
    }

    const dateLabel = formatDateRange(startDate.trim(), endDate?.trim(), time?.trim());
    const location = cityCountry.trim();
    const attendeesLabel = attendees?.trim() || 'Open';
    const tags = [
      { name: EVENT_TAG },                      // public — listing filter
      { name: category.trim() },                // public — category chip
    ];
    if (eventType?.trim()) tags.push({ name: eventType.trim() }); // public — event type
    tags.push({ name: '#' + dateLabel });        // internal — date (1st internal)
    tags.push({ name: '#' + location });          // internal — location (2nd)
    tags.push({ name: '#' + attendeesLabel });    // internal — attendees (3rd)

    const html = `<p><strong>${escapeHtml(description.trim())}</strong></p>\n`
      + `<h3>Event Details</h3>\n`
      + `<ul>\n`
      + `  <li><strong>Venue / Platform:</strong> ${escapeHtml(venue.trim())}</li>\n`
      + `  <li><strong>Location:</strong> ${escapeHtml(location)}</li>\n`
      + `  <li><strong>Date:</strong> ${escapeHtml(dateLabel)}</li>\n`
      + `  <li><strong>Expected Attendees:</strong> ${escapeHtml(attendeesLabel)}</li>\n`
      + `</ul>\n`
      + `<p><a href="${escapeAttr(eventUrl.trim())}" target="_blank" rel="noopener">Get Tickets / Event URL →</a></p>`;

    let featureImageUrl = null;
    if (uploadedTempPath) {
      try {
        const uploadResp = await api.images.upload({ file: uploadedTempPath });
        featureImageUrl = uploadResp.url || uploadResp;
      } catch (uploadErr) {
        console.error('[submit-server] image upload failed:', uploadErr);
        // Continue without image rather than failing the whole submission
        featureImageUrl = null;
      }
    }

    const postPayload = {
      title: eventName.trim(),
      custom_excerpt: truncate(description.trim(), 290),
      html,
      tags,
      status: PUBLISH_STATUS,
    };
    if (featureImageUrl) postPayload.feature_image = featureImageUrl;

    const post = await api.posts.add(postPayload, { source: 'html' });

    res.json({ ok: true, id: post.id, url: post.url, status: post.status, feature_image: featureImageUrl });
  } catch (err) {
    console.error('[submit-server] /submit-event error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Unknown error' });
  } finally {
    if (uploadedTempPath) {
      fs.unlink(uploadedTempPath).catch(() => {});
    }
  }
});

app.post('/submit-job', upload.single('companyLogo'), async (req, res) => {
  let uploadedTempPath = req.file?.path;
  try {
    const {
      jobTitle,
      company,
      jobType,           // "Full-time" / "Part-time" / "Contract" / "Internship" / "Freelance"
      location,          // "Remote" / "Hybrid" / "On-site"
      salaryRange,       // "$40K - $60K" / "$60K - $90K" / "$90K - $120K" / "$90K - $180K" / "$120K+" / "Negotiable"
      category,
      description,
      keywords,          // comma-separated string OR JSON-stringified array
      applyLink,
    } = req.body || {};

    if (!jobTitle?.trim() || !company?.trim() || !jobType?.trim()
        || !category?.trim() || !description?.trim() || !applyLink?.trim()) {
      return res.status(400).json({ ok: false, error: 'Please fill all required fields.' });
    }

    // Map dropdown labels → Ghost tag conventions used by post-job.hbs
    const jobTypeTag = {
      'Full-time': '#full-time',
      'Part-time': '#part-time',
      'Contract': '#contract',
      'Internship': '#internship',
      'Freelance': '#freelance',
    }[jobType.trim()] || '#full-time';

    const locationTag = {
      'Remote': '#remote',
      'Hybrid': '#hybrid',
      'On-site': '#onsite',
      'Onsite': '#onsite',
    }[location?.trim()] || '#remote';

    const salaryTag = {
      '$40K - $60K': '#salary-40k-60k',
      '$60K - $90K': '#salary-60k-90k',
      '$90K - $120K': '#salary-90k-120k',
      '$90K - $180K': '#salary-90k-180k',
      '$120K+': '#salary-120k-plus',
      'Negotiable': '#salary-negotiable',
    }[salaryRange?.trim()] || '#salary-negotiable';

    // Parse keywords (may arrive as JSON array string from FormData)
    let keywordList = [];
    if (keywords) {
      try {
        const parsed = JSON.parse(keywords);
        if (Array.isArray(parsed)) keywordList = parsed;
      } catch {
        keywordList = String(keywords).split(',');
      }
    }
    const cleanKeywords = [...new Set(keywordList.map((k) => String(k).trim()).filter(Boolean))];

    const tags = [
      { name: JOB_TAG },                  // public — listing filter (e.g. "jobs")
      { name: category.trim() },          // public — category chip
      ...cleanKeywords.map((k) => ({ name: k })), // public — keyword chips
      { name: jobTypeTag },               // internal — employment type
      { name: locationTag },              // internal — location
      { name: salaryTag },                // internal — salary range
    ];

    const applyIsEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyLink.trim());
    const applyHref = applyIsEmail
      ? `mailto:${applyLink.trim()}`
      : applyLink.trim();

    const html = `<p><strong>${escapeHtml(company.trim())}</strong> is hiring a <strong>${escapeHtml(jobTitle.trim())}</strong>.</p>\n`
      + `<h3>About the Role</h3>\n`
      + paragraphify(description.trim())
      + `\n<h3>How to Apply</h3>\n`
      + `<p><a href="${escapeAttr(applyHref)}" target="_blank" rel="noopener">Apply now →</a></p>`;

    let featureImageUrl = null;
    if (uploadedTempPath) {
      try {
        const uploadResp = await api.images.upload({ file: uploadedTempPath });
        featureImageUrl = uploadResp.url || uploadResp;
      } catch (uploadErr) {
        console.error('[submit-server] /submit-job image upload failed:', uploadErr);
        featureImageUrl = null;
      }
    }

    const postPayload = {
      title: jobTitle.trim(),
      custom_excerpt: truncate(description.trim(), 290),
      html,
      tags,
      status: PUBLISH_STATUS,
    };
    if (featureImageUrl) postPayload.feature_image = featureImageUrl;

    const post = await api.posts.add(postPayload, { source: 'html' });

    res.json({ ok: true, id: post.id, url: post.url, status: post.status, feature_image: featureImageUrl });
  } catch (err) {
    console.error('[submit-server] /submit-job error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Unknown error' });
  } finally {
    if (uploadedTempPath) fs.unlink(uploadedTempPath).catch(() => {});
  }
});

app.post('/submit-company', upload.single('logo'), async (req, res) => {
  let uploadedTempPath = req.file?.path;
  try {
    const {
      companyName,
      website,
      category,
      foundedYear,
      shortDescription,
      twitter,
      linkedin,
      contactEmail,
      region,        // optional, free text like "Europe", "USA"
      keywords,      // JSON array or comma-separated
    } = req.body || {};

    if (!companyName?.trim() || !website?.trim() || !category?.trim()
        || !shortDescription?.trim() || !contactEmail?.trim()) {
      return res.status(400).json({ ok: false, error: 'Please fill all required fields.' });
    }

    let keywordList = [];
    if (keywords) {
      try {
        const parsed = JSON.parse(keywords);
        if (Array.isArray(parsed)) keywordList = parsed;
      } catch {
        keywordList = String(keywords).split(',');
      }
    }
    const cleanKeywords = [...new Set(keywordList.map((k) => String(k).trim()).filter(Boolean))];

    const tags = [
      { name: COMPANY_TAG },                              // public — directory listing filter (tag:company)
      { name: category.trim() },                          // public — category chip filter
      ...cleanKeywords.map((k) => ({ name: k })),         // public — keyword chips
    ];
    if (foundedYear?.trim()) tags.push({ name: '#Est. ' + foundedYear.trim() }); // internal — founded year pill
    if (region?.trim())      tags.push({ name: '#' + region.trim() });            // internal — region pill (e.g. "Europe")

    const twTrim = twitter?.trim().replace(/^@/, '');
    const liTrim = linkedin?.trim();

    const html = `<p>${paragraphify(shortDescription.trim())}</p>\n`
      + `<h3>Connect</h3>\n`
      + `<ul>\n`
      + `  <li><strong>Website:</strong> <a href="${escapeAttr(website.trim())}" target="_blank" rel="noopener">${escapeHtml(website.trim())}</a></li>\n`
      + (twTrim ? `  <li><strong>X / Twitter:</strong> <a href="https://x.com/${encodeURIComponent(twTrim)}" target="_blank" rel="noopener">@${escapeHtml(twTrim)}</a></li>\n` : '')
      + (liTrim ? `  <li><strong>LinkedIn:</strong> <a href="${escapeAttr(liTrim.startsWith('http') ? liTrim : 'https://www.linkedin.com/' + liTrim)}" target="_blank" rel="noopener">${escapeHtml(liTrim)}</a></li>\n` : '')
      + `  <li><strong>Contact:</strong> <a href="mailto:${escapeAttr(contactEmail.trim())}">${escapeHtml(contactEmail.trim())}</a></li>\n`
      + `</ul>`;

    let featureImageUrl = null;
    if (uploadedTempPath) {
      try {
        const uploadResp = await api.images.upload({ file: uploadedTempPath });
        featureImageUrl = uploadResp.url || uploadResp;
      } catch (uploadErr) {
        console.error('[submit-server] /submit-company logo upload failed:', uploadErr);
      }
    }

    const postPayload = {
      title: companyName.trim(),
      custom_excerpt: truncate(shortDescription.trim(), 290),
      // feature_image_caption acts as a fallback "official website URL pool" — the
      // post-company.hbs template's autofill CTA reads from this field when the
      // post has no author website. See partials/directory-interactions.hbs.
      feature_image_caption: website.trim(),
      html,
      tags,
      status: PUBLISH_STATUS,
    };
    if (featureImageUrl) postPayload.feature_image = featureImageUrl;

    const post = await api.posts.add(postPayload, { source: 'html' });

    res.json({ ok: true, id: post.id, url: post.url, status: post.status, feature_image: featureImageUrl });
  } catch (err) {
    console.error('[submit-server] /submit-company error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Unknown error' });
  } finally {
    if (uploadedTempPath) fs.unlink(uploadedTempPath).catch(() => {});
  }
});

function formatDateRange(start, end, time) {
  const parse = (s) => {
    const d = new Date(s);
    return isNaN(d) ? null : d;
  };
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const s = parse(start);
  const e = end ? parse(end) : null;
  let label = '';
  if (!s) {
    label = start;
  } else if (!e || +s === +e) {
    label = fmt(s);
  } else if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    label = `${s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${e.getDate()}, ${e.getFullYear()}`;
  } else {
    label = `${fmt(s)} – ${fmt(e)}`;
  }
  if (time) label += ` · ${time} UTC`;
  return label;
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

app.post('/submit-press-release', async (req, res) => {
  try {
    const {
      headline,
      summary,
      body,
      category,
      categories,
      contactEmail,
      consentAuthorized,
      consentTerms,
    } = req.body || {};

    if (!headline?.trim() || !summary?.trim() || !body?.trim()) {
      return res.status(400).json({ ok: false, error: 'Headline, summary, and body are required.' });
    }
    if (!consentAuthorized || !consentTerms) {
      return res.status(400).json({ ok: false, error: 'Please confirm authorization and accept the editorial terms.' });
    }

    const categoryList = Array.isArray(categories)
      ? categories
      : (category?.trim() ? [category.trim()] : []);
    const cleanCategories = [...new Set(categoryList.map((c) => String(c).trim()).filter(Boolean))];

    const tags = [{ name: PRESS_RELEASE_TAG }, ...cleanCategories.map((c) => ({ name: c }))];

    const html = `<p><strong>${escapeHtml(summary.trim())}</strong></p>\n${paragraphify(body.trim())}${
      contactEmail?.trim() ? `\n<p><em>Press contact: ${escapeHtml(contactEmail.trim())}</em></p>` : ''
    }`;

    const post = await api.posts.add(
      {
        title: headline.trim(),
        custom_excerpt: truncate(summary.trim(), 290),
        html,
        tags,
        status: PUBLISH_STATUS,
      },
      { source: 'html' }
    );

    res.json({ ok: true, id: post.id, url: post.url, status: post.status });
  } catch (err) {
    console.error('[submit-server] error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Unknown error' });
  }
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paragraphify(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function truncate(s, n) {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…';
}

app.listen(PORT, () => {
  console.log(`[submit-server] listening on http://localhost:${PORT}`);
  console.log(`[submit-server] posts will be created in: ${GHOST_URL} as "${PUBLISH_STATUS}" tagged "${PRESS_RELEASE_TAG}"`);
});
