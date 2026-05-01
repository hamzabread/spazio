const STORAGE_KEY = 'sc_saved_job_ids';

/** Slugs used for job type / location / salary — not department “category” labels. */
const JOB_STRUCTURAL_SLUGS = new Set([
    'jobs',
    'careers',
    'job',
    'hiring',
    'remote',
    'hybrid',
    'onsite',
    'on-site',
    'full-time',
    'part-time',
    'contract',
    'internship',
    'freelance',
    'salary-40k-60k',
    'salary-60k-90k',
    'salary-90k-120k',
    'salary-90k-180k',
    'salary-120k-plus',
    'salary-negotiable',
    'verified',
    'people',
]);

function normalizeTagSlug(slug) {
    if (!slug) return '';
    return slug.replace(/^hash-/i, '');
}

function isStructuralJobSlug(slug) {
    const s = (slug || '').toLowerCase();
    if (JOB_STRUCTURAL_SLUGS.has(s)) return true;
    const norm = normalizeTagSlug(s);
    return JOB_STRUCTURAL_SLUGS.has(norm);
}

/**
 * Category row: show first non-structural tag (e.g. #engineering, #marketing), not `jobs` primary.
 */
function initJobCategoryDd(root) {
    const dd = root.querySelector('[data-job-category-dd]');
    if (!dd) return;

    const templates = dd.querySelectorAll('template.sc-job-category-tag');
    if (!templates.length) {
        dd.textContent = '—';
        return;
    }

    for (const tpl of templates) {
        const slug = tpl.getAttribute('data-slug') || '';
        if (isStructuralJobSlug(slug)) continue;
        const name = tpl.content?.textContent?.trim() || '';
        if (!name) continue;
        dd.textContent = name;
        return;
    }

    dd.textContent = '—';
}

function readSavedIds() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeSavedIds(ids) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
        /* ignore */
    }
}

/**
 * Job listing single: optional # prefix strip on tag pills; Save Job uses localStorage.
 */
export function initPostJobPage() {
    const root = document.querySelector('.sc-job-post-page');
    if (!root) return;

    initJobCategoryDd(root);

    root.querySelectorAll('.sc-job-post-tag--pill').forEach((el) => {
        const t = el.textContent || '';
        if (t.startsWith('#')) el.textContent = t.slice(1);
    });

    const shareBtn = root.querySelector('[data-job-share]');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const url = window.location.href;
            const title =
                root.querySelector('.sc-job-post-title')?.textContent?.trim() || document.title;
            try {
                if (navigator.share) {
                    await navigator.share({ title, url });
                } else if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(url);
                }
            } catch (e) {
                if (e && e.name !== 'AbortError') {
                    /* ignore */
                }
            }
        });
    }

    const saveBtn = root.querySelector('[data-job-save]');
    const id = saveBtn?.getAttribute('data-job-id');
    if (saveBtn && id) {
        const saved = readSavedIds();
        if (saved.includes(id)) {
            saveBtn.classList.add('is-saved');
            saveBtn.setAttribute('aria-pressed', 'true');
        }

        saveBtn.addEventListener('click', () => {
            const ids = readSavedIds();
            const idx = ids.indexOf(id);
            if (idx === -1) {
                ids.push(id);
                saveBtn.classList.add('is-saved');
                saveBtn.setAttribute('aria-pressed', 'true');
            } else {
                ids.splice(idx, 1);
                saveBtn.classList.remove('is-saved');
                saveBtn.setAttribute('aria-pressed', 'false');
            }
            writeSavedIds(ids);
        });
    }
}
