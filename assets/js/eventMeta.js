export const normalizeEventMeta = () => {
    const metaItems = document.querySelectorAll('.sc-events .sc-event-meta-row span');
    const aiTags = document.querySelectorAll('.sc-ai-slide-tag');
    const prMetaRows = document.querySelectorAll('.sc-pr-item-meta');
    const breakingNewsCategories = document.querySelectorAll('.sc-bn-category');
    const moreNewsTags = document.querySelectorAll('.sc-mn-card-tag');

    metaItems.forEach((item) => {
        const value = item.textContent ? item.textContent.trim() : '';

        if (value.startsWith('#')) {
            item.textContent = value.slice(1).trim();
        }
    });

    aiTags.forEach((item) => {
        const value = item.textContent ? item.textContent.trim() : '';

        if (value.startsWith('#')) {
            item.textContent = value.slice(1).trim();
        }
    });

    prMetaRows.forEach((row) => {
        const flagItems = row.querySelectorAll('.sc-pr-internal-flag');
        const fallbackItems = row.querySelectorAll('.sc-pr-meta-fallback');
        let hasFlags = false;

        flagItems.forEach((item) => {
            const value = item.textContent ? item.textContent.trim() : '';

            if (!value) {
                return;
            }

            hasFlags = true;

            if (value.startsWith('#')) {
                item.textContent = value.slice(1).trim();
            }
        });

        if (hasFlags) {
            fallbackItems.forEach((item) => {
                item.style.display = 'none';
            });
            return;
        }

        const flagsContainer = row.querySelector('.sc-pr-meta-flags');
        if (flagsContainer) {
            flagsContainer.style.display = 'none';
        }
    });

    breakingNewsCategories.forEach((category) => {
        const tagCandidates = category.querySelectorAll('.sc-bn-tag-candidate');
        const excludedSlugs = new Set(['breaking-news', 'hash-breaking-news', 'news', 'trending']);
        let internalValue = '';
        let publicValue = '';

        tagCandidates.forEach((candidate) => {
            const slug = candidate.getAttribute('data-slug') || '';
            const rawName = candidate.textContent ? candidate.textContent.trim() : '';

            if (!rawName) {
                return;
            }

            if (!internalValue && slug.startsWith('hash-')) {
                internalValue = rawName.startsWith('#') ? rawName.slice(1).trim() : rawName;
                return;
            }

            if (!publicValue && !excludedSlugs.has(slug)) {
                publicValue = rawName;
            }
        });

        if (internalValue) {
            category.textContent = internalValue;
            return;
        }

        if (publicValue) {
            category.textContent = publicValue;
            return;
        }

        category.style.display = 'none';
    });

    moreNewsTags.forEach((tag) => {
        const value = tag.textContent ? tag.textContent.trim() : '';

        if (value.startsWith('#')) {
            tag.textContent = value.slice(1).trim();
        }
    });

    const moreNewsTopCards = document.querySelectorAll('.sc-mn-main .sc-mn-grid .sc-mn-card:nth-child(-n+4)');

    moreNewsTopCards.forEach((card) => {
        const tags = card.querySelectorAll('.sc-mn-card-tag');

        tags.forEach((tag) => {
            const value = (tag.textContent || '').trim().toLowerCase();
            if (value === 'more news') {
                tag.remove();
            }
        });

        const tagsContainer = card.querySelector('.sc-mn-card-tags');
        if (tagsContainer && tagsContainer.children.length === 0) {
            tagsContainer.remove();
        }
    });
};
