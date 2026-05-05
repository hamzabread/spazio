const EVENT_META_STOP = /(?:📅|🗓|📆|📍|🗺|🎟️|🎟|🎫|🌐|👥|[\r\n])/u;

/**
 * Trim a segment so one bad line cannot fill the card with the whole article.
 */
function clipEventMetaSegment(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let s = raw.replace(/\s+/g, ' ').trim();
    const cutAt = s.search(EVENT_META_STOP);
    if (cutAt > 0) s = s.slice(0, cutAt).trim();
    if (s.length > 200) s = `${s.slice(0, 197)}…`;
    return s.trim();
}

function afterMarkerOnLine(line, markers) {
    let best = '';
    for (const em of markers) {
        const i = line.indexOf(em);
        if (i === -1) continue;
        const rest = line.slice(i + em.length).trim();
        const clipped = clipEventMetaSegment(rest);
        if (clipped.length > best.length) best = clipped;
    }
    return best.trim();
}

function regexCapture(plain, re) {
    const m = plain.match(re);
    if (!m || !m[1]) return '';
    return clipEventMetaSegment(m[1]);
}

/**
 * Post body may put 📅 / 📍 / 🎟 / 🌐 / 👥 at the top or bottom; Koenig can flatten to few lines.
 * @returns {{ found: boolean, datetime: string, location: string, detail: string }}
 */
function parseEventFooterLines(plain) {
    let datetime = '';
    let location = '';
    let tickets = '';
    let attendees = '';
    let website = '';

    if (!plain || typeof plain !== 'string') {
        return { found: false, datetime, location, detail: '' };
    }

    const lines = plain
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    for (const line of lines) {
        if (/📅|🗓|📆/.test(line)) {
            const v = afterMarkerOnLine(line, ['📅', '🗓', '📆']);
            if (v) datetime = v;
        }
        if (/📍|🗺/.test(line)) {
            const v = afterMarkerOnLine(line, ['📍', '🗺']);
            if (v) location = v;
        }
        if (/🎟|🎫/.test(line)) {
            const v = afterMarkerOnLine(line, ['🎟️', '🎟', '🎫']);
            if (v) tickets = v;
        }
        if (/👥|👤/.test(line)) {
            const v = afterMarkerOnLine(line, ['👥', '👤']);
            if (v) attendees = v;
        }
        if (/🌐/.test(line)) {
            const v = afterMarkerOnLine(line, ['🌐']);
            if (v) website = v;
        }
    }

    if (!datetime) {
        datetime = regexCapture(plain, /(?:📅|🗓|📆)\s*([^\n📍🎟🌐👥]{1,240})/u);
    }
    if (!location) {
        location = regexCapture(plain, /(?:📍|🗺)\s*([^\n📅🎟🌐👥]{1,240})/u);
    }
    if (!tickets) {
        tickets = regexCapture(plain, /(?:🎟️|🎟|🎫)\s*([^\n📅📍🌐👥]{1,240})/u);
    }
    if (!attendees) {
        attendees = regexCapture(plain, /(?:👥|👤)\s*([^\n📅📍🎟🌐]{1,240})/u);
    }
    if (!website) {
        website = regexCapture(plain, /🌐\s*([^\n📅📍🎟👥]{1,240})/u);
    }

    const detail = clipEventMetaSegment(tickets || attendees || website);
    const found = Boolean(datetime || location || detail);
    return { found, datetime, location, detail };
}

function plainTextFromPostHtmlTemplate(templateEl) {
    if (!templateEl || !templateEl.content) return '';
    const holder = document.createElement('div');
    holder.appendChild(templateEl.content.cloneNode(true));
    return (holder.textContent || '').trim();
}

function getEventMetaRowTextNodes(card) {
    const rows = card.querySelectorAll('.sc-event-meta-row, .sc-evl-meta-row');
    return [...rows]
        .map((row) => row.querySelector(':scope > span:last-of-type') || row.querySelector('span'))
        .filter(Boolean);
}

/**
 * Home upcoming events + events listing: fill date / venue / ticket rows from post HTML when present.
 */
export function hydrateEventCardsFromPostHtml() {
    const cards = document.querySelectorAll('.sc-events .sc-event-card, .sc-events-page .sc-evl-card');
    if (!cards.length) return;

    cards.forEach((card) => {
        const tpl = card.querySelector('template.sc-event-html-source');
        if (!tpl) return;

        const plain = plainTextFromPostHtmlTemplate(tpl);
        const { found, datetime, location, detail } = parseEventFooterLines(plain);
        if (!found) return;

        const spans = getEventMetaRowTextNodes(card);
        if (spans.length < 3) return;

        if (datetime) spans[0].textContent = datetime;
        if (location) spans[1].textContent = location;
        if (detail) spans[2].textContent = detail;

        card.querySelectorAll('.sc-event-meta-row').forEach((row) => {
            const span = row.querySelector(':scope > span:last-of-type') || row.querySelector('span');
            const t = (span && span.textContent ? span.textContent.trim() : '') || '';
            row.classList.toggle('sc-event-meta-row--empty', !t);
        });
    });
}

export const normalizeEventMeta = () => {
    const metaItems = document.querySelectorAll(
        '.sc-events .sc-event-meta-row span, .sc-events-page .sc-evl-meta-row span'
    );
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

    hydrateEventCardsFromPostHtml();
};
