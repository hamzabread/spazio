/**
 * Press releases listing: chip filter, search, sort (newest / oldest).
 */
export function initPressReleasesListing() {
    const root = document.querySelector('.sc-press-releases-page .sc-pr-listing');
    const list = document.getElementById('sc-prl-list');
    if (!root || !list) return;

    const searchInput = document.getElementById('sc-pr-listing-search');
    const sortBtn = document.getElementById('sc-pr-listing-sort');
    const chips = [...root.querySelectorAll('[data-pr-chip]')];

    const getSlugs = (card) => (card.getAttribute('data-pr-slugs') || '').trim().split(/\s+/).filter(Boolean);

    [...list.querySelectorAll('.sc-prl-card')].forEach((card) => {
        const n = getSlugs(card).length;
        const el = card.querySelector('[data-pr-tag-count]');
        if (el) el.textContent = String(n);
        card.querySelectorAll('.sc-prl-footer .sc-prl-chip, .sc-prl-cat-opt').forEach((el) => {
            const t = el.textContent || '';
            if (t.startsWith('#')) el.textContent = t.slice(1);
        });
    });

    let activeChip = 'all';
    let searchQuery = '';
    let sortDesc = true;

    const applyFilters = () => {
        const q = searchQuery.trim().toLowerCase();
        [...list.querySelectorAll('.sc-prl-card')].forEach((card) => {
            const slugs = getSlugs(card);
            const chipOk = activeChip === 'all' || slugs.includes(activeChip);
            const title = card.querySelector('.sc-prl-title')?.textContent || '';
            const lede = card.querySelector('.sc-prl-lede')?.textContent || '';
            const snippet = card.querySelector('.sc-prl-snippet')?.textContent || '';
            const blob = `${title} ${lede} ${snippet}`.toLowerCase();
            const searchOk = !q || blob.includes(q);
            card.hidden = !(chipOk && searchOk);
        });
    };

    const applySort = () => {
        const all = [...list.querySelectorAll('.sc-prl-card')];
        const visible = all.filter((c) => !c.hidden);
        const hidden = all.filter((c) => c.hidden);
        visible.sort((a, b) => {
            const ta = parseInt(a.getAttribute('data-pr-sort') || '0', 10) || 0;
            const tb = parseInt(b.getAttribute('data-pr-sort') || '0', 10) || 0;
            return sortDesc ? tb - ta : ta - tb;
        });
        [...visible, ...hidden].forEach((c) => list.appendChild(c));
    };

    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            activeChip = chip.getAttribute('data-pr-chip') || 'all';
            chips.forEach((c) => {
                c.classList.toggle('is-active', c === chip);
                c.setAttribute('aria-selected', c === chip ? 'true' : 'false');
            });
            applyFilters();
            applySort();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value || '';
            applyFilters();
            applySort();
        });
    }

    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortDesc = !sortDesc;
            applySort();
        });
    }

    applyFilters();
    applySort();
}
