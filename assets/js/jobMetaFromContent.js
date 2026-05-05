/**
 * Job posts: optional metadata list in Lexical body, e.g.
 *   - Category: Engineering
 *   - Employment Type: Full-time
 *   - Location: Remote
 *   - Salary Range: 90k-180k
 * or:
 *   - Type: Remote
 *   - Duration: Full-time
 *   - Salary: 90k-180k
 *
 * Single job page: copy into sidebar (.sc-job-info-card), remove list from body.
 * Jobs grid (.sc-job-card): show employment + location + salary in meta row (not category).
 */

const META_LABELS = new Set([
    'category',
    'employment type',
    'type',
    'duration',
    'location',
    'salary range',
    'salary'
]);

function normLabel(s) {
    return (s || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function scoreMetadataUl(ul) {
    let n = 0;
    ul.querySelectorAll(':scope > li').forEach((li) => {
        const t = (li.textContent || '').trim();
        const m = t.match(/^([^:]+):\s*(.+)$/);
        if (!m) return;
        const k = normLabel(m[1]);
        if (META_LABELS.has(k)) n += 1;
    });
    return n;
}

/** Last <ul> in document order that looks like the metadata block (≥2 recognised lines). */
function findMetadataUlInContent(root) {
    const uls = [...root.querySelectorAll('ul')];
    for (let i = uls.length - 1; i >= 0; i -= 1) {
        if (scoreMetadataUl(uls[i]) >= 2) return uls[i];
    }
    return null;
}

function looksLikeWorkplaceType(value) {
    const s = normLabel(value);
    return ['remote', 'hybrid', 'on-site', 'onsite', 'on site', 'in-office', 'in office'].some(
        (x) => s === x || s.startsWith(`${x} `)
    );
}

function parseMetadataUl(ul) {
    const raw = {};
    ul.querySelectorAll(':scope > li').forEach((li) => {
        const t = (li.textContent || '').trim();
        const m = t.match(/^([^:]+):\s*(.+)$/);
        if (!m) return;
        const k = normLabel(m[1]);
        const v = m[2].trim();
        if (!v || !META_LABELS.has(k)) return;
        raw[k] = v;
    });

    const category = raw.category || '';
    let employment = raw['employment type'] || raw.duration || '';
    let location = raw.location || '';
    if (raw.type) {
        if (looksLikeWorkplaceType(raw.type)) {
            location = location || raw.type;
        } else {
            employment = employment || raw.type;
        }
    }
    const salary = raw['salary range'] || raw.salary || '';

    return { category, employment, location, salary };
}

function holderFromTemplate(tpl) {
    if (!tpl || !tpl.content) return null;
    const holder = document.createElement('div');
    holder.appendChild(tpl.content.cloneNode(true));
    return holder;
}

function removeMetadataBlock(ul) {
    const prev = ul.previousElementSibling;
    if (prev && prev.tagName === 'HR') prev.remove();
    ul.remove();
}

function setDdFromMeta(root, attr, text) {
    if (!text) return;
    const dd = root.querySelector(`[data-job-body-meta="${attr}"]`);
    if (!dd) return;
    dd.textContent = text;
}

function setJobCardMetaRow(spanWrap, text) {
    if (!spanWrap || !text) return;
    const svg = spanWrap.querySelector('svg');
    const svgClone = svg ? svg.cloneNode(true) : null;
    spanWrap.textContent = '';
    if (svgClone) spanWrap.appendChild(svgClone);
    spanWrap.appendChild(document.createTextNode(text));
}

export function relocateJobPostMetaFromContent() {
    const root = document.querySelector('.sc-job-post-page');
    if (!root) return;

    const body = root.querySelector('.sc-job-post-body.gh-content');
    if (!body) return;

    const ul = findMetadataUlInContent(body);
    if (!ul) return;

    const meta = parseMetadataUl(ul);
    if (!meta.employment && !meta.location && !meta.salary && !meta.category) return;

    if (meta.category) {
        const dd = root.querySelector('[data-job-category-dd]');
        if (dd) dd.textContent = meta.category;
    }
    setDdFromMeta(root, 'employment', meta.employment);
    setDdFromMeta(root, 'location', meta.location);
    setDdFromMeta(root, 'salary', meta.salary);

    removeMetadataBlock(ul);
}

export function hydrateJobListingCardsFromContent() {
    document.querySelectorAll('.sc-job-card').forEach((card) => {
        const tpl = card.querySelector('template.sc-job-html-source');
        if (!tpl) return;

        const holder = holderFromTemplate(tpl);
        if (!holder) return;

        const ul = findMetadataUlInContent(holder);
        if (!ul) return;

        const meta = parseMetadataUl(ul);
        if (!meta.employment && !meta.location && !meta.salary) return;

        const locWrap = card.querySelector('[data-job-meta="location"]');
        const empWrap = card.querySelector('[data-job-meta="employment"]');
        const salWrap = card.querySelector('[data-job-meta="salary"]');

        if (meta.location) setJobCardMetaRow(locWrap, meta.location);
        if (meta.employment) setJobCardMetaRow(empWrap, meta.employment);
        if (meta.salary) setJobCardMetaRow(salWrap, meta.salary);
    });
}

export function initJobMetaFromPostBody() {
    relocateJobPostMetaFromContent();
    hydrateJobListingCardsFromContent();
}
