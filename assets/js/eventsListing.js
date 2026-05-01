/**
 * Events listing page: search, category / location / date filters, sort by publish date.
 */
function slugLabel(slug) {
    if (!slug) return '';
    return slug
        .replace(/^hash-/i, '')
        .split(/[-_]/g)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function getCatSlugs(card) {
    return (card.getAttribute('data-ev-cat-slugs') || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}

function fillSelect(select, values, labelFn) {
    if (!select) return;
    const allLabel = select.options[0]?.textContent?.trim() || select.getAttribute('aria-label') || 'All';
    select.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = allLabel;
    allOpt.selected = true;
    select.appendChild(allOpt);
    const sorted = [...values].filter(Boolean).sort((a, b) => a.localeCompare(b));
    sorted.forEach((val) => {
        const o = document.createElement('option');
        o.value = val;
        o.textContent = labelFn(val);
        select.appendChild(o);
    });
}

export function initEventsListing() {
    const root = document.querySelector('.sc-events-page .sc-ev-listing');
    const list = document.getElementById('sc-evl-list');
    if (!root || !list) return;

    const searchInput = document.getElementById('sc-ev-listing-search');
    const catSel = document.getElementById('sc-ev-filter-cat');
    const locSel = document.getElementById('sc-ev-filter-loc');
    const dateSel = document.getElementById('sc-ev-filter-date');

    const cards = [...list.querySelectorAll('.sc-evl-card')];

    const catSet = new Set();
    const locMap = new Map();
    const dateMap = new Map();

    cards.forEach((card) => {
        getCatSlugs(card).forEach((s) => catSet.add(s));
        const ls = (card.getAttribute('data-ev-loc-slug') || '').trim();
        const ln = (card.getAttribute('data-ev-loc-name') || '').trim();
        if (ls) locMap.set(ls, ln || slugLabel(ls));
        const ds = (card.getAttribute('data-ev-date-slug') || '').trim();
        const dn = (card.getAttribute('data-ev-date-name') || '').trim();
        if (ds) dateMap.set(ds, dn || slugLabel(ds));
    });

    fillSelect(catSel, catSet, (v) => slugLabel(v));
    fillSelect(
        locSel,
        [...locMap.keys()],
        (v) => locMap.get(v) || slugLabel(v)
    );
    fillSelect(
        dateSel,
        [...dateMap.keys()],
        (v) => dateMap.get(v) || slugLabel(v)
    );

    let searchQuery = '';
    const applyFilters = () => {
        const q = searchQuery.trim().toLowerCase();
        const cat = catSel?.value || 'all';
        const loc = locSel?.value || 'all';
        const dt = dateSel?.value || 'all';

        cards.forEach((card) => {
            const title = card.querySelector('.sc-evl-title')?.textContent || '';
            const excerpt = card.querySelector('.sc-evl-excerpt')?.textContent || '';
            const snippet = card.querySelector('.sc-evl-snippet')?.textContent || '';
            const blob = `${title} ${excerpt} ${snippet}`.toLowerCase();
            const searchOk = !q || blob.includes(q);

            const slugs = getCatSlugs(card);
            const catOk = cat === 'all' || slugs.includes(cat);

            const locSlug = (card.getAttribute('data-ev-loc-slug') || '').trim();
            const locOk = loc === 'all' || locSlug === loc;

            const dateSlug = (card.getAttribute('data-ev-date-slug') || '').trim();
            const dateOk = dt === 'all' || dateSlug === dt;

            card.hidden = !(searchOk && catOk && locOk && dateOk);
        });
    };

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value || '';
            applyFilters();
        });
    }

    [catSel, locSel, dateSel].forEach((sel) => {
        if (!sel) return;
        sel.addEventListener('change', () => {
            applyFilters();
        });
    });

    applyFilters();
}
