/**
 * About page (page-about.hbs): CMS body from Ghost `{{{content}}}` in
 * `<template class="sc-about-lexical-source">`, plus optional
 * `<template class="sc-about-source-fragment">` from `#get "pages"`:
 * `hash-about-append` (extras), `hash-about-faq` (FAQ-only page HTML merged last).
 *
 * Parsing supports Lexical/card wrappers via document-order blocks (no sibling-only traversal).
 *
 * Editors can optionally use `.sc-about-cms` slots with `[data-sc-about-slot="…"]`; non-empty slots override heading parse.
 */

function normHeading(t) {
    return (t || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function escapeHtmlPlain(s) {
    const div = document.createElement('div');
    div.textContent = s ?? '';
    return div.innerHTML;
}

/** Depth-first ordered block nodes (handles kg-card wrappers; skips `.sc-about-cms`). */
function collectFlowBlocks(root) {
    const out = [];

    function walk(el) {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
        if (el.classList?.contains('sc-about-cms')) return;

        const tag = el.tagName;
        const BLOCKS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL'];
        if (BLOCKS.includes(tag)) {
            out.push(el);
            if (tag === 'UL' || tag === 'OL') return;
        }
        for (const child of el.children) walk(child);
    }

    [...root.children].forEach(walk);
    return out;
}

function isRevenueSectionHeading(raw) {
    const t = normHeading(raw);
    return (
        t.includes('how do we earn') ||
        t.includes('earn money') ||
        (t.includes('revenue') && t.includes('model')) ||
        /\bearning(s)? model\b/.test(t)
    );
}

function isMissionSectionHeading(raw) {
    const t = normHeading(raw);
    return t.includes('our mission');
}

function isFaqSectionHeading(raw) {
    const t = normHeading(raw);
    if (t === 'faq' || /^faq[\s(,]/.test(t)) return true;
    if (/\bfaq\b/.test(t) && (t.includes('question') || t.includes('asking'))) return true;
    if (t.includes('frequently asked')) return true;
    return false;
}

function parseRevenueLi(li) {
    const strong = li.querySelector('strong');
    let title = '';
    let bodyHtml = '';

    if (strong) {
        title = (strong.textContent || '').replace(/:\s*$/, '').trim();
        const clone = li.cloneNode(true);
        clone.querySelectorAll('strong').forEach((s) => s.remove());
        bodyHtml = clone.innerHTML.trim();
        return { title, bodyHtml };
    }

    const text = (li.textContent || '').trim();
    const m = text.match(/^[-•*]?\s*(.+?):\s*(.+)$/s);
    if (m) {
        title = m[1].trim();
        bodyHtml = escapeHtmlPlain(m[2].trim());
    }
    return { title, bodyHtml };
}

/** Text nodes that appear before the first `<strong>` in tree order (Lexical wraps bullets in spans). */
function textBeforeFirstStrong(root) {
    let found = false;
    let buf = '';

    function walk(n) {
        if (found) return;
        if (n.nodeType === Node.TEXT_NODE) buf += n.textContent || '';
        else if (n.nodeType === Node.ELEMENT_NODE) {
            if (n.matches('strong')) {
                found = true;
                return;
            }
            [...n.childNodes].forEach(walk);
        }
    }

    walk(root);
    return buf;
}

/**
 * Ghost Lexical often exports revenue lines as <p>- <strong>Title:</strong> body</p>
 * instead of <ul>/<li>; detect those so intros don't swallow the entire section.
 */
function isRevenueItemParagraph(p) {
    if (!p || p.tagName !== 'P') return false;

    const strong = p.querySelector('strong');
    if (!strong || !strong.textContent.trim()) return false;

    const trimBefore = textBeforeFirstStrong(p).replace(/\u00a0/g, ' ').trim();
    if (trimBefore.length && !/^(\d+\.\s+)?([-•*﹘‐]|\u2013|\u2014)?(\s*)$/.test(trimBefore)) return false;

    const titRaw = (strong.textContent || '').trim();
    const titKey = titRaw.replace(/[:：]\s*$/, '').trim();

    const skipLead = /^(note|warning|tip|important|disclaimer)\b/i;
    if (skipLead.test(titKey)) return false;

    const full = ((p.textContent || '') ?? '').replace(/\s+/g, ' ').trim();
    const restApprox = Math.max(0, full.length - titKey.length);
    return restApprox >= 18;
}

function parseRevenueParagraph(p) {
    const strong = p.querySelector('strong');
    if (!strong) return null;

    const title = (strong.textContent || '').replace(/:\s*$/, '').trim();
    const clone = p.cloneNode(true);
    clone.querySelectorAll('strong').forEach((s) => s.remove());
    let bodyHtml = clone.innerHTML
        .trim()
        .replace(/^(\s|&nbsp;|[-•*﹘‐]|\u2013|\u2014)+/i, '')
        .trim();
    const body = bodyHtml.replace(/<[^>]+>/g, '').trim();

    if (!title && !body) return null;
    return { title, bodyHtml, body };
}

/** One <p> may contain multiple lines joined by <br>. */
function extractRevenueRowsFromParagraph(p) {
    if (!isRevenueItemParagraph(p)) return [];

    const html = p.innerHTML;
    if (!/<br\s*\/?>/i.test(html)) {
        const row = parseRevenueParagraph(p);
        return row?.title ? [row] : [];
    }

    const parts = html
        .split(/<br\s*\/?>/i)
        .map((s) => s.trim())
        .filter(Boolean);
    const wrap = document.createElement('div');
    const rows = [];

    parts.forEach((frag) => {
        wrap.innerHTML = `<p>${frag}</p>`;
        const sub = wrap.querySelector('p');
        if (!sub || !isRevenueItemParagraph(sub)) return;
        const row = parseRevenueParagraph(sub);
        if (row?.title) rows.push(row);
    });

    if (rows.length) return rows;
    const single = parseRevenueParagraph(p);
    return single?.title ? [single] : [];
}

function parseFromSlots(cms) {
    const out = {
        missionHtml: '',
        revenueIntroHtml: '',
        revenueItems: [],
        faqIntroHtml: '',
        faqPairs: [],
        riccardoCardSlot: '',
        riccardoBioSlot: ''
    };

    const m = cms.querySelector('[data-sc-about-slot="mission"]');
    if (m) out.missionHtml = m.innerHTML.trim();

    const ri = cms.querySelector('[data-sc-about-slot="revenue-intro"]');
    if (ri) out.revenueIntroHtml = ri.innerHTML.trim();

    const rc = cms.querySelector('[data-sc-about-slot="revenue-cards"]');
    if (rc) {
        rc.querySelectorAll(':scope > li').forEach((li) => {
            const { title, bodyHtml } = parseRevenueLi(li);
            const body = bodyHtml.replace(/<[^>]+>/g, '').trim(); // compat
            if (title || body) out.revenueItems.push({ title, bodyHtml, body });
        });
    }

    const fi = cms.querySelector('[data-sc-about-slot="faq-intro"]');
    if (fi) out.faqIntroHtml = fi.innerHTML.trim();

    const fq = cms.querySelector('[data-sc-about-slot="faq"]');
    if (fq) {
        fq.querySelectorAll('[data-sc-faq-pair]').forEach((pair) => {
            const qEl = pair.querySelector('[data-sc-faq-q], h3, h4, strong');
            const aEl = pair.querySelector('[data-sc-faq-a], .sc-about-cms-faq-a, p');
            const q = (qEl?.textContent || '').trim();
            const a = (aEl?.innerHTML || '').trim();
            if (q && a) out.faqPairs.push({ q, aHtml: a });
        });
    }

    console.log('[sc-about FAQ] parseFromSlots', {
        faqIntroHtml: typeof out.faqIntroHtml,
        faqIntroLength: out.faqIntroHtml?.length ?? 0,
        faqIntroPreview: (out.faqIntroHtml || '').slice(0, 160),
        faqPairsCount: out.faqPairs.length,
        faqPairs: out.faqPairs.map((p, i) => ({
            index: i,
            qType: typeof p.q,
            q: p.q,
            aHtmlType: typeof p.aHtml,
            aHtmlLength: (p.aHtml || '').length,
            aHtmlPreview: (p.aHtml || '').slice(0, 220)
        }))
    });

    const rCard = cms.querySelector('[data-sc-about-slot="riccardo-card"]');
    if (rCard) out.riccardoCardSlot = rCard.innerHTML.trim();

    console.log(out.riccardoCardSlot);

    const rBio = cms.querySelector('[data-sc-about-slot="riccardo-bio"]');
    if (rBio) out.riccardoBioSlot = rBio.innerHTML.trim();

    console.log(out.riccardoBioSlot);

    return out;
}

function parseMissionFromFlow(flow) {
    const idx = flow.findIndex(
        (el) => /^h[1-6]$/i.test(el.tagName) && isMissionSectionHeading(el.textContent || '')
    );
    if (idx === -1) return '';

    let sectionEnd = flow.length;
    for (let j = idx + 1; j < flow.length; j += 1) {
        if (/^h[12]$/i.test(flow[j].tagName)) {
            sectionEnd = j;
            break;
        }
    }

    const parts = [];
    for (let j = idx + 1; j < sectionEnd; j += 1) {
        if (flow[j].tagName === 'P') parts.push(flow[j].innerHTML.trim());
    }
    return parts.filter(Boolean).join('');
}

function parseRevenueFromFlow(flow) {
    const out = { introHtml: '', items: [] };
    const idx = flow.findIndex(
        (el) => /^h[1-6]$/i.test(el.tagName) && isRevenueSectionHeading(el.textContent || '')
    );
    if (idx === -1) return out;

    let sectionEnd = flow.length;
    for (let j = idx + 1; j < flow.length; j += 1) {
        const el = flow[j];
        if (/^h[12]$/i.test(el.tagName)) {
            const t = normHeading(el.textContent || '');
            if (!isRevenueSectionHeading(el.textContent || '') && t) {
                sectionEnd = j;
                break;
            }
        }
    }

    let i = idx + 1;
    const introParts = [];

    while (i < sectionEnd) {
        const el = flow[i];
        if (/^UL|OL$/i.test(el.tagName)) break;
        if (/^p$/i.test(el.tagName) && isRevenueItemParagraph(el)) break;

        if (/^p$/i.test(el.tagName)) {
            introParts.push(el.innerHTML.trim());
            i += 1;
            continue;
        }
        break;
    }
    out.introHtml = introParts.filter(Boolean).join('');

    if (/^UL|OL$/i.test(flow[i]?.tagName)) {
        flow[i].querySelectorAll(':scope > li').forEach((li) => {
            const { title, bodyHtml } = parseRevenueLi(li);
            const body = bodyHtml.replace(/<[^>]+>/g, '').trim();
            if (title || body) out.items.push({ title, bodyHtml, body });
        });
        i += 1;
    }

    if (!out.items.length) {
        while (i < sectionEnd && /^p$/i.test(flow[i].tagName) && isRevenueItemParagraph(flow[i])) {
            const batch = extractRevenueRowsFromParagraph(flow[i]);
            batch.forEach((row) => {
                if (!row.title) return;
                out.items.push(row);
            });
            i += 1;
        }
    }

    return out;
}

function parseFaqFromFlow(flow) {
    const out = { introHtml: '', pairs: [] };
    const idx = flow.findIndex(
        (el) => /^h[1-6]$/i.test(el.tagName) && isFaqSectionHeading(el.textContent || '')
    );
    if (idx === -1) return out;

    let sectionEnd = flow.length;
    for (let j = idx + 1; j < flow.length; j += 1) {
        const el = flow[j];
        if (/^h[12]$/i.test(el.tagName)) {
            sectionEnd = j;
            break;
        }
    }

    let i = idx + 1;
    while (i < sectionEnd && /^p$/i.test(flow[i].tagName)) {
        out.introHtml += flow[i].innerHTML.trim();
        i += 1;
    }

    while (i < sectionEnd) {
        const el = flow[i];
        const tag = el.tagName;

        if (/^h[12]$/i.test(tag)) break;

        if (/^h[3456]$/i.test(tag)) {
            const q = (el.textContent || '').replace(/\s+/g, ' ').trim();

            let aParts = '';
            let j = i + 1;
            while (j < sectionEnd) {
                const nx = flow[j];
                const nxTag = nx.tagName;
                if (/^h[3456]$/i.test(nxTag)) break;
                if (/^h[12]$/i.test(nxTag)) break;
                if (/^p$/i.test(nxTag)) {
                    aParts += nx.outerHTML.trim();
                    j += 1;
                    continue;
                }
                if (/^UL|OL$/i.test(nxTag)) {
                    aParts += nx.outerHTML.trim();
                    j += 1;
                    continue;
                }
                j += 1;
            }

            if (q && aParts.trim()) out.pairs.push({ q, aHtml: aParts.trim() });
            i = j;
            continue;
        }

        i += 1;
    }

    console.log('[sc-about FAQ] parseFaqFromFlow', {
        introHtml: typeof out.introHtml,
        introLength: out.introHtml?.length ?? 0,
        introPreview: (out.introHtml || '').slice(0, 160),
        pairsCount: out.pairs.length,
        pairs: out.pairs.map((p, i) => ({
            index: i,
            qType: typeof p.q,
            q: p.q,
            aHtmlType: typeof p.aHtml,
            aHtmlLength: (p.aHtml || '').length,
            aHtmlPreview: (p.aHtml || '').slice(0, 220)
        }))
    });

    return out;
}

function findFaqHeadingElement(holder) {
    const headings = holder.querySelectorAll?.('h1, h2, h3, h4, h5, h6') || [];
    for (const h of headings) {
        if (isFaqSectionHeading(h.textContent || '')) return h;
    }
    return null;
}

/** First major h1/h2 after FAQ (new section boundary for scoping toggle cards). */
function getNextBlockingHeading(holder, faqHeadingEl) {
    const headings = [...(holder.querySelectorAll?.('h1, h2') || [])];
    for (const h of headings) {
        const pos = faqHeadingEl.compareDocumentPosition(h);
        if (!(pos & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        if (isFaqSectionHeading(h.textContent || '')) continue;
        return h;
    }
    return null;
}

/** Outermost nodes only — inner wrappers also match `[class*="kg-toggle"]`. */
function outermostElements(nodes) {
    const arr = [...nodes];
    return arr.filter((el) =>
        arr.every((other) => other === el || !other.contains(el))
    );
}

function gatherToggleRoots(holder) {
    const seen = new Set();
    const out = [];

    [
        ':scope .kg-card.kg-toggle-card',
        ':scope .kg-toggle-card',
        ':scope details.kg-toggle-card',
        ':scope [class*="kg-toggle-card"]'
    ].forEach((sel) => {
        try {
            holder.querySelectorAll(sel).forEach((el) => {
                if (seen.has(el)) return;
                seen.add(el);
                out.push(el);
            });
        } catch {
            /* noop */
        }
    });

    return outermostElements(out);
}

function extractPairFromToggleRoot(card) {
    if (!card) return null;

    if (card.matches?.('details') || /^details$/i.test(card.tagName)) {
        const sum = card.querySelector(':scope > summary');
        const q = (sum?.textContent || '').replace(/\s+/g, ' ').trim();
        const inner = card.cloneNode(true);
        inner.querySelector(':scope > summary')?.remove();
        const aHtml = inner.innerHTML.trim();
        if (q && aHtml) return { q, aHtml };
        return null;
    }

    const qEl =
        card.querySelector('.kg-toggle-heading-text') ||
        card.querySelector('.kg-toggle-heading') ||
        card.querySelector(':scope summary');

    const contentEl =
        card.querySelector('.kg-toggle-content') ||
        card.querySelector('[class*="kg-toggle-content"]') ||
        card.querySelector('[data-kg-toggle-content]');

    const q = (qEl?.textContent || '').replace(/\s+/g, ' ').trim();
    let aHtml = (contentEl?.innerHTML || '').trim();

    if (!aHtml && q) {
        const clone = card.cloneNode(true);
        clone
            .querySelector('.kg-toggle-heading-text, .kg-toggle-heading, summary')
            ?.remove();
        clone.querySelector('.kg-toggle-card-icon')?.closest('div')?.remove();
        aHtml = clone.innerHTML.trim();
    }

    if (q && aHtml) return { q, aHtml };
    return null;
}

/**
 * Ghost FAQ blocks are usually Lexical Toggle cards; they are DIVs (.kg-toggle-card),
 * never seen by collectFlowBlocks. Extract Q/A for the standalone FAQ accordion.
 */
function parseFaqTogglePairs(holder, { fallbackUnscoped = true } = {}) {
    if (!holder?.querySelectorAll) return [];

    let cards = gatherToggleRoots(holder);
    const faqH = findFaqHeadingElement(holder);
    const blocking = faqH ? getNextBlockingHeading(holder, faqH) : null;

    function filterScoped(list) {
        return list.filter((card) => {
            if (
                faqH &&
                !(faqH.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)
            )
                return false;
            if (
                blocking &&
                !(card.compareDocumentPosition(blocking) & Node.DOCUMENT_POSITION_FOLLOWING)
            )
                return false;
            return true;
        });
    }

    function toPairs(list) {
        const pairs = [];
        list.forEach((card) => {
            const pair = extractPairFromToggleRoot(card);
            if (pair) pairs.push(pair);
        });
        return pairs;
    }

    let scoped = toPairs(filterScoped(cards));

    if (!scoped.length && fallbackUnscoped && cards.length) {
        scoped = toPairs(cards);
    }

    return scoped;
}

function holderHasToggleMarkup(holder) {
    if (!holder?.querySelector) return false;
    return !!holder.querySelector(
        '.kg-card.kg-toggle-card, .kg-toggle-card, details.kg-toggle-card, [class*="kg-toggle-card"]'
    );
}

function holderHasRiccardoMarkup(holder) {
    if (!holder?.querySelector) return false;
    return !!(
        holder.querySelector('.container-staff') ||
        holder.querySelector('[data-sc-about-riccardo-bio-html]') ||
        holder.querySelector('[data-sc-about-riccardo-articles-html]')
    );
}

function paragraphsBeforeBoundary(holder, boundaryEl) {
    if (!boundaryEl) return [];
    return [...holder.querySelectorAll('p')]
        .filter(
            (p) =>
                !boundaryEl.contains(p) &&
                boundaryEl.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_PRECEDING
        )
        .sort((a, b) => {
            const pos = a.compareDocumentPosition(b);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
        });
}

function firstParagraphAfterBoundary(holder, boundaryEl) {
    if (!boundaryEl) return null;
    const all = [...holder.querySelectorAll('p')].filter((p) => !boundaryEl.contains(p));
    const ordered = all.sort((a, b) => {
        const pos = a.compareDocumentPosition(b);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return 0;
    });

    return (
        ordered.find(
            (p) =>
                (boundaryEl.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING) &&
                p.textContent.replace(/\s+/g, ' ').trim().length > 24
        ) || null
    );
}

function parseStaffCard(staffRoot) {
    const img = staffRoot.querySelector('.imgBx img, .card .imgBx img, .card img');
    const mainImageSrc = img?.getAttribute('src')?.trim() || '';
    const mainImageAlt = img?.getAttribute('alt')?.trim() || '';

    const h3 = staffRoot.querySelector('.contentBx h3, .content .contentBx h3, .content h3');
    let chip = '';
    let name = '';
    if (h3) {
        const c = h3.cloneNode(true);
        const span = c.querySelector('span');
        if (span) {
            chip = span.textContent.replace(/\s+/g, ' ').trim();
            span.remove();
        }
        name = c.innerHTML
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const sci = staffRoot.querySelector('ul.sci, .sci');
    const socialsHtml = sci ? sci.innerHTML.trim() : '';

    return { chip, name, mainImageSrc, mainImageAlt, socialsHtml };
}

function findExpertiseListItems(holder, afterEl) {
    for (const h of holder.querySelectorAll('h2, h3, h4')) {
        const t = normHeading(h.textContent || '');
        if (!t.includes('expertise') && !t.includes('areas of')) continue;
        if (!(afterEl.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;

        let n = h.nextElementSibling;
        while (n) {
            if (n.matches('ul, ol')) {
                return [...n.querySelectorAll(':scope > li')]
                    .map((li) => li.innerHTML.trim())
                    .filter(Boolean);
            }
            const innerList = n.querySelector?.(':scope > ul, :scope > ol');
            if (innerList) {
                return [...innerList.querySelectorAll(':scope > li')]
                    .map((li) => li.innerHTML.trim())
                    .filter(Boolean);
            }
            n = n.nextElementSibling;
        }
    }
    return [];
}

function findGalleryImages(holder, staffRoot, max) {
    return [...holder.querySelectorAll('img')]
        .filter((img) => {
            if (staffRoot.contains(img)) return false;
            if (img.closest('.kg-bookmark-card')) return false;
            return staffRoot.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING;
        })
        .slice(0, max)
        .map((img) => ({
            src: img.getAttribute('src')?.trim() || '',
            alt: img.getAttribute('alt')?.trim() || ''
        }))
        .filter((g) => g.src);
}

function findArticlesHtml(holder, staffRoot) {
    const slot = holder.querySelector(
        '[data-sc-about-riccardo-articles-html], [data-sc-about-press-html]'
    );
    if (slot?.innerHTML.trim()) return slot.innerHTML.trim();

    const bookmarks = [...holder.querySelectorAll('.kg-bookmark-card, a.kg-bookmark-card')].filter(
        (b) => staffRoot.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
    );
    if (!bookmarks.length) return '';
    return bookmarks.map((b) => b.outerHTML).join('');
}

function parseRiccardoCms(holder) {
    if (!holder?.querySelector) return null;

    const bioSlot = holder.querySelector('[data-sc-about-riccardo-bio-html]');
    const staff = holder.querySelector('.container-staff');
    if (!staff) {
        if (bioSlot?.innerHTML.trim()) {
            return { bioHtml: bioSlot.innerHTML.trim(), chip: '', name: '', socialsHtml: '' };
        }
        return null;
    }

    const card = parseStaffCard(staff);
    let bioHtml = '';
    if (bioSlot?.innerHTML.trim()) {
        bioHtml = bioSlot.innerHTML.trim();
    } else {
        const firstAfter = firstParagraphAfterBoundary(holder, staff);
        if (firstAfter) {
            bioHtml = firstAfter.outerHTML;
        } else {
            const before = paragraphsBeforeBoundary(holder, staff);
            bioHtml = before.length ? before[before.length - 1].outerHTML : '';
        }
    }

    const expertiseItems = findExpertiseListItems(holder, staff);
    const gallery = findGalleryImages(holder, staff, 5);
    const articlesHtml = findArticlesHtml(holder, staff);

    return {
        ...card,
        bioHtml,
        expertiseItems,
        gallery,
        articlesHtml
    };
}

function hasRiccardoSignal(r) {
    if (!r) return false;
    return !!(
        r.mainImageSrc ||
        r.name ||
        r.chip ||
        r.bioHtml ||
        r.socialsHtml ||
        (r.expertiseItems && r.expertiseItems.length) ||
        (r.gallery && r.gallery.length) ||
        r.articlesHtml
    );
}

function hydrateRiccardo(root, r) {
    if (!r || !hasRiccardoSignal(r)) return;

    const chipEl = root.querySelector('[data-sc-about-riccardo-chip]');
    if (chipEl && r.chip) chipEl.textContent = r.chip;

    const titleEl = root.querySelector('[data-sc-about-riccardo-title]');
    if (titleEl && r.name) titleEl.textContent = r.name;

    const bioEl = root.querySelector('[data-sc-about-riccardo-bio]');
    if (bioEl && r.bioHtml) {
        const wrap = document.createElement('div');
        wrap.innerHTML = r.bioHtml;
        const firstP = wrap.querySelector('p');
        bioEl.innerHTML = firstP ? firstP.outerHTML : r.bioHtml;
    }

    const mainImg = root.querySelector('[data-sc-about-riccardo-main]');
    if (mainImg && r.mainImageSrc) {
        mainImg.src = r.mainImageSrc;
        if (r.mainImageAlt) mainImg.alt = r.mainImageAlt;
    }

    const socials = root.querySelector('[data-sc-about-riccardo-socials]');
    if (socials && r.socialsHtml) {
        socials.innerHTML = `<ul class="sci sc-about-riccardo-sci">${r.socialsHtml}</ul>`;
    }

    const list = root.querySelector('[data-sc-about-riccardo-expertise]');
    if (list && r.expertiseItems?.length) {
        list.innerHTML = r.expertiseItems
            .map(
                (html) =>
                    `<li><span class="sc-about-riccardo-check" aria-hidden="true"><i class="fa fa-check"></i></span><span class="sc-about-riccardo-list-text">${html}</span></li>`
            )
            .join('');
    }

    const gal = root.querySelector('[data-sc-about-riccardo-gallery]');
    if (gal && r.gallery?.length) {
        const imgs = [...gal.querySelectorAll('img')];
        r.gallery.forEach((g, i) => {
            if (!imgs[i]) return;
            imgs[i].src = g.src;
            if (g.alt) imgs[i].alt = g.alt;
        });
    }

    const artGrid = root.querySelector('[data-sc-about-riccardo-articles-grid]');
    if (artGrid && r.articlesHtml) {
        artGrid.innerHTML = r.articlesHtml;
        artGrid.classList.add('sc-about-riccardo-articles-grid--cms');
    }
}

/** Run hydration when any About CMS signal exists OR toggle cards appear in lexical HTML. */
function hasHydrationSignal(parsed, holder) {
    return (
        hasCmsSignal(parsed) ||
        holderHasToggleMarkup(holder) ||
        holderHasRiccardoMarkup(holder) ||
        !!holder.querySelector('.sc-about-cms')
    );
}

/** Prefer toggle cards when headings did not capture pairs (FAQ intro may still parse). */
function mergeFaqPairsFromToggleCards(holder, faqFlow) {
    const togglePairs = parseFaqTogglePairs(holder);
    const useToggles =
        togglePairs.length &&
        (!faqFlow.pairs.length || togglePairs.length >= faqFlow.pairs.length);

    console.log('[sc-about FAQ] mergeFaqPairsFromToggleCards', {
        flowPairsCount: faqFlow.pairs.length,
        togglePairsCount: togglePairs.length,
        useToggles: !!useToggles,
        togglePairs: togglePairs.map((p, i) => ({
            index: i,
            qType: typeof p.q,
            q: p.q,
            aHtmlType: typeof p.aHtml,
            aHtmlLength: (p.aHtml || '').length,
            aHtmlPreview: (p.aHtml || '').slice(0, 220)
        }))
    });

    if (!togglePairs.length) return faqFlow;

    if (useToggles) {
        return { introHtml: faqFlow.introHtml, pairs: togglePairs };
    }
    return faqFlow;
}

function parseFromHeadings(holder) {
    const flow = collectFlowBlocks(holder);
    const rev = parseRevenueFromFlow(flow);

    let faq = mergeFaqPairsFromToggleCards(holder, parseFaqFromFlow(flow));

    return {
        missionHtml: parseMissionFromFlow(flow),
        revenueIntroHtml: rev.introHtml,
        revenueItems: rev.items.map(({ title, bodyHtml, body }) => ({
            title,
            bodyHtml,
            body: body ?? ''
        })),
        faqIntroHtml: faq.introHtml,
        faqPairs: faq.pairs,
        riccardo: parseRiccardoCms(holder)
    };
}

function mergeParsed(base, slots) {
    if (!slots) return base;
    if (slots.missionHtml) base.missionHtml = slots.missionHtml;
    if (slots.revenueIntroHtml) base.revenueIntroHtml = slots.revenueIntroHtml;
    if (slots.revenueItems?.length) base.revenueItems = slots.revenueItems;
    if (slots.faqIntroHtml) base.faqIntroHtml = slots.faqIntroHtml;
    if (slots.faqPairs?.length) base.faqPairs = slots.faqPairs;
    if (slots.riccardoCardSlot) {
        const wrap = document.createElement('div');
        wrap.innerHTML = slots.riccardoCardSlot;
        const fromSlot = parseRiccardoCms(wrap);
        if (fromSlot) base.riccardo = { ...(base.riccardo || {}), ...fromSlot };
    }
    if (slots.riccardoBioSlot) {
        base.riccardo = base.riccardo || {};
        base.riccardo.bioHtml = slots.riccardoBioSlot;
    }
    return base;
}

/** Avoid duplicate svg gradient ids after cloneNode(true). */
function uniquifySvgIds(rootEl) {
    rootEl.querySelectorAll?.('svg')?.forEach?.((svg) => {
        const idMap = new Map();
        svg.querySelectorAll('[id]').forEach((node) => {
            const oldId = node.id;
            const newId = `${oldId}-sc-${Math.random().toString(36).slice(2, 9)}`;
            idMap.set(oldId, newId);
            node.id = newId;
        });
        if (!idMap.size) return;

        svg.querySelectorAll('*').forEach((el) => {
            [...el.attributes].forEach((attr) => {
                let value = attr.value;
                let changed = false;
                idMap.forEach((neu, old) => {
                    const reUrl = new RegExp(`url\\(#${old}\\)`, 'gi');
                    if (reUrl.test(value)) {
                        value = value.replace(reUrl, `url(#${neu})`);
                        changed = true;
                    }
                });
                if (changed) attr.value = value;
            });
        });
    });
}

function setCardBody(el, row) {
    if (!el) return;
    const raw = (row.bodyHtml || '').trim();
    if (raw && /<[a-z][\s\S]*>/i.test(raw)) {
        el.innerHTML = raw;
        return;
    }
    const plain = (row.body || raw.replace(/<[^>]+>/g, '').trim() || '').trim();
    el.textContent = plain;
}

function renderRevenueGrid(gridEl, revenueItems) {
    if (!gridEl || !revenueItems.length) return;
    const templates = [...gridEl.querySelectorAll('.sc-about-revenue-item')];
    if (!templates.length) return;

    while (gridEl.firstChild) gridEl.firstChild.remove();

    revenueItems.forEach((row, idx) => {
        const tmpl = templates[idx % templates.length];
        const art = tmpl.cloneNode(true);
        uniquifySvgIds(art);

        const h3 = art.querySelector('h3');
        const p = art.querySelector('p');
        if (h3 && row.title) h3.textContent = row.title;
        setCardBody(p, row);

        gridEl.appendChild(art);
    });
}

function faqIconSvgPlus() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8V16M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#EBEFF2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function faqIconSvgMinus() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#EBEFF2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function buildFaqArticle(q, aHtml, isOpen) {
    const art = document.createElement('article');
    art.className = `sc-about-faq-item${isOpen ? ' is-open' : ''}`;
    art.setAttribute('data-faq-item', '');
    art.innerHTML = `
<button class="sc-about-faq-trigger" type="button" aria-expanded="${isOpen ? 'true' : 'false'}">
  <span class="sc-about-faq-question"></span>
  <span class="sc-about-faq-icon sc-about-faq-icon-closed" aria-hidden="true">${faqIconSvgPlus()}</span>
  <span class="sc-about-faq-icon sc-about-faq-icon-open" aria-hidden="true">${faqIconSvgMinus()}</span>
</button>
<div class="sc-about-faq-answer-wrap" data-faq-answer-wrap>
  <div class="sc-about-faq-answer"></div>
</div>`;
    art.querySelector('.sc-about-faq-question').textContent = q;
    const ans = art.querySelector('.sc-about-faq-answer');
    ans.innerHTML = aHtml;
    return art;
}

export function wireAboutFaqAccordion(listRoot) {
    const faqItems = listRoot.querySelectorAll('[data-faq-item]');
    if (!faqItems.length) return;

    function setOpenState(item, isOpen) {
        const trigger = item.querySelector('.sc-about-faq-trigger');
        const panel = item.querySelector('[data-faq-answer-wrap]');
        if (!trigger || !panel) return;
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        item.classList.toggle('is-open', isOpen);
        if (isOpen) {
            panel.style.maxHeight = `${panel.scrollHeight}px`;
        } else {
            panel.style.maxHeight = '0px';
        }
    }

    faqItems.forEach((item) => {
        const trigger = item.querySelector('.sc-about-faq-trigger');
        const panel = item.querySelector('[data-faq-answer-wrap]');
        if (!trigger || !panel) return;
        if (item.classList.contains('is-open')) {
            panel.style.maxHeight = `${panel.scrollHeight}px`;
        } else {
            panel.style.maxHeight = '0px';
        }
        trigger.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');
            faqItems.forEach((other) => {
                if (other !== item) setOpenState(other, false);
            });
            setOpenState(item, !isOpen);
        });
    });

    window.addEventListener('resize', () => {
        faqItems.forEach((item) => {
            if (item.classList.contains('is-open')) {
                const panel = item.querySelector('[data-faq-answer-wrap]');
                if (panel) panel.style.maxHeight = `${panel.scrollHeight}px`;
            }
        });
    });
}

function hasCmsSignal(parsed) {
    return !!(
        parsed.missionHtml ||
        parsed.revenueIntroHtml ||
        parsed.revenueItems?.length ||
        parsed.faqIntroHtml ||
        parsed.faqPairs?.length ||
        hasRiccardoSignal(parsed.riccardo)
    );
}

/* Inline social icon SVGs (matched to partials/icons/*.hbs) */
const TEAM_SOCIAL_SVG = {
    twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none"><rect width="30" height="30" rx="15" fill="#262626"/><path d="M22.3516 11.7578C22.3516 11.9219 22.3516 12.0859 22.3516 12.2266C22.3516 17.0781 18.6484 22.6797 11.8984 22.6797C9.8125 22.6797 7.89062 22.0703 6.25 21.0391C6.53125 21.0625 6.83594 21.0859 7.11719 21.0859C8.82812 21.0859 10.4219 20.5 11.6875 19.5156C10.0703 19.4922 8.71094 18.4141 8.26562 16.9609C8.5 17.0078 8.71094 17.0313 8.96875 17.0313C9.29687 17.0313 9.625 16.9844 9.92969 16.8906C8.24219 16.5625 6.97656 15.0859 6.97656 13.3047C6.97656 13.2813 6.97656 13.2813 6.97656 13.2578C7.46875 13.5391 8.03125 13.7031 8.64062 13.7266C7.65625 13.0703 7 11.9453 7 10.6563C7 9.97656 7.1875 9.34375 7.49219 8.80469C9.29687 11.0313 12.0156 12.4844 15.0625 12.6484C14.9922 12.3906 14.9687 12.0859 14.9687 11.8047C14.9687 9.76563 16.6094 8.125 18.6484 8.125C19.7031 8.125 20.6641 8.57031 21.3203 9.27344C22.1641 9.10938 22.9375 8.80469 23.6641 8.38281C23.3828 9.25 22.7969 9.95313 22.0469 10.4219C22.7969 10.3281 23.5 10.1406 24.1562 9.83594C23.6875 10.5859 23.0781 11.2422 22.3516 11.7578Z" fill="white"/></svg>',
    facebook: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none"><rect width="30" height="30" rx="15" fill="#262626"/><path d="M16.0016 24.9999V15.8769H19.0638L19.5223 12.3216H16.0016V10.0516C16.0016 9.02223 16.2875 8.32068 17.7637 8.32068L19.6464 8.31981V5.13994C19.3206 5.09677 18.2031 5 16.903 5C14.1885 5 12.3302 6.65682 12.3302 9.69964V12.3217H9.26001V15.877H12.3301V25L16.0016 24.9999Z" fill="white"/></svg>',
    linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none"><rect width="30" height="30" rx="15" fill="#262626"/><path d="M22 9.5h-14c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1Zm-9.5 9h-2v-6h2v6Zm-1-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1Zm9 7h-2v-3.5c0-.55-.45-1-1-1s-1 .45-1 1V18.5h-2v-6h2v.5c.6-.4 1.3-.5 2-.5 1.7 0 3 1.3 3 3v3.5Z" fill="#fff"/></svg>',
    instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none"><rect width="30" height="30" rx="15" fill="#262626"/><path d="M11.876 15C11.876 13.2742 13.2747 11.8747 15.0005 11.8747C16.7263 11.8747 18.1257 13.2742 18.1257 15C18.1257 16.7258 16.7263 18.1252 15.0005 18.1252C13.2747 18.1252 11.876 16.7258 11.876 15ZM10.1865 15C10.1865 17.6587 12.3417 19.8139 15.0005 19.8139C17.6592 19.8139 19.8144 17.6587 19.8144 15C19.8144 12.3412 17.6592 10.186 15.0005 10.186C12.3417 10.186 10.1865 12.3412 10.1865 15ZM18.88 9.99517C18.8799 10.2177 18.9458 10.4352 19.0694 10.6203C19.1929 10.8053 19.3685 10.9496 19.5741 11.0348C19.7796 11.12 20.0058 11.1424 20.224 11.0991C20.4423 11.0558 20.6428 10.9487 20.8002 10.7914C20.9576 10.6342 21.0648 10.4338 21.1083 10.2155C21.1518 9.99733 21.1296 9.77112 21.0445 9.56552C20.9595 9.35992 20.8154 9.18416 20.6304 9.06047C20.4454 8.93678 20.228 8.87071 20.0055 8.87063H20.005C19.7068 8.87076 19.4208 8.98927 19.2098 9.20012C18.9989 9.41098 18.8803 9.69693 18.88 9.99517ZM11.213 22.631C10.299 22.5894 9.80216 22.4371 9.47201 22.3085C9.03431 22.1381 8.72201 21.9352 8.39366 21.6073C8.06531 21.2794 7.86206 20.9674 7.69241 20.5297C7.56371 20.1997 7.41146 19.7027 7.36991 18.7887C7.32446 17.8005 7.31539 17.5036 7.31539 15.0001C7.31539 12.4965 7.32521 12.2005 7.36991 11.2114C7.41154 10.2974 7.56491 9.80145 7.69241 9.47047C7.86281 9.03277 8.06576 8.72047 8.39366 8.39213C8.72156 8.06378 9.03356 7.86053 9.47201 7.69088C9.80201 7.56218 10.299 7.40992 11.213 7.36837C12.2012 7.32292 12.498 7.31385 15.0005 7.31385C17.5029 7.31385 17.8001 7.32367 18.7891 7.36837C19.7031 7.41 20.1991 7.56337 20.5301 7.69088C20.9678 7.86053 21.2801 8.06422 21.6084 8.39213C21.9368 8.72003 22.1393 9.03277 22.3097 9.47047C22.4384 9.80047 22.5906 10.2974 22.6322 11.2114C22.6776 12.2005 22.6867 12.4965 22.6867 15.0001C22.6867 17.5036 22.6776 17.7997 22.6322 18.7887C22.5906 19.7027 22.4376 20.1995 22.3097 20.5297C22.1393 20.9674 21.9363 21.2797 21.6084 21.6073C21.2805 21.9349 20.9678 22.1381 20.5301 22.3085C20.2001 22.4372 19.7031 22.5895 18.7891 22.631C17.8009 22.6765 17.5041 22.6855 15.0005 22.6855C12.4969 22.6855 12.2009 22.6765 11.213 22.631ZM11.1354 5.68177C10.1373 5.72722 9.45536 5.88547 8.85979 6.11722C8.24299 6.35655 7.72084 6.67762 7.19906 7.19857C6.67729 7.71952 6.35704 8.2425 6.11771 8.8593C5.88596 9.45525 5.72771 10.1368 5.68226 11.1349C5.63606 12.1345 5.62549 12.4541 5.62549 15C5.62549 17.5459 5.63606 17.8655 5.68226 18.8651C5.72771 19.8632 5.88596 20.5448 6.11771 21.1407C6.35704 21.7571 6.67736 22.2807 7.19906 22.8014C7.72076 23.3221 8.24299 23.6428 8.85979 23.8828C9.45649 24.1145 10.1373 24.2728 11.1354 24.3182C12.1355 24.3637 12.4545 24.375 15.0005 24.375C17.5464 24.375 17.866 24.3644 18.8656 24.3182C19.8637 24.2728 20.5452 24.1145 21.1412 23.8828C21.7576 23.6428 22.2801 23.3224 22.8019 22.8014C23.3237 22.2805 23.6433 21.7571 23.8833 21.1407C24.115 20.5448 24.274 19.8631 24.3187 18.8651C24.3642 17.8648 24.3747 17.5459 24.3747 15C24.3747 12.4541 24.3642 12.1345 24.3187 11.1349C24.2733 10.1368 24.115 9.45487 23.8833 8.8593C23.6433 8.24287 23.3229 7.72035 22.8019 7.19857C22.281 6.6768 21.7576 6.35655 21.1419 6.11722C20.5452 5.88547 19.8636 5.72648 18.8664 5.68177C17.8668 5.63633 17.5472 5.625 15.0012 5.625C12.4553 5.625 12.1355 5.63558 11.1354 5.68177Z" fill="white"/></svg>',
    telegram: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none"><rect width="30" height="30" rx="15" fill="#262626"/><path d="M6.7421 14.6693C11.1042 12.7289 14.0129 11.4497 15.4683 10.8316C19.6237 9.06688 20.4872 8.76033 21.05 8.7501C21.1738 8.74798 21.4505 8.7793 21.6298 8.92783C21.7812 9.05324 21.8228 9.22266 21.8428 9.34157C21.8627 9.46047 21.8875 9.73135 21.8678 9.943C21.6426 12.3588 20.6682 18.2212 20.1725 20.9269C19.9628 22.0717 19.5498 22.4556 19.1499 22.4932C18.281 22.5748 17.6212 21.9069 16.7795 21.3436C15.4626 20.4622 14.7186 19.9135 13.4403 19.0534C11.9629 18.0594 12.9206 17.513 13.7626 16.6202C13.9829 16.3865 17.8115 12.831 17.8856 12.5084C17.8948 12.4681 17.9034 12.3177 17.8159 12.2383C17.7284 12.1589 17.5993 12.1861 17.5061 12.2077C17.374 12.2383 15.2702 13.6581 11.1946 16.467C10.5974 16.8857 10.0565 17.0897 9.57188 17.079C9.03762 17.0672 8.00991 16.7706 7.24592 16.517C6.30885 16.206 5.56408 16.0416 5.62894 15.5134C5.66272 15.2383 6.03377 14.9569 6.7421 14.6693Z" fill="white"/></svg>',
    reddit: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none"><rect width="30" height="30" rx="15" fill="#262626"/><circle cx="15" cy="15" r="9" fill="#FF4500"/><circle cx="15" cy="15" r="6" fill="#fff"/></svg>'
};

function detectSocialPlatform(href) {
    const h = (href || '').toLowerCase();
    if (h.includes('twitter.com') || h.includes('x.com')) return 'twitter';
    if (h.includes('facebook.com')) return 'facebook';
    if (h.includes('linkedin.com')) return 'linkedin';
    if (h.includes('instagram.com')) return 'instagram';
    if (h.includes('t.me') || h.includes('telegram')) return 'telegram';
    if (h.includes('reddit.com')) return 'reddit';
    return null;
}

function buildTeamSocials(staffRoot) {
    const links = [...staffRoot.querySelectorAll('ul.sci a, .sci a')];
    const html = links
        .map((a) => {
            const href = a.getAttribute('href') || '';
            if (!href || href === '#') return '';
            const platform = detectSocialPlatform(href);
            const svg = platform ? TEAM_SOCIAL_SVG[platform] : '';
            if (!svg) return '';
            const label = platform ? platform[0].toUpperCase() + platform.slice(1) : 'Link';
            return `<a href="${href}" target="_blank" rel="noopener" aria-label="${label}">${svg}</a>`;
        })
        .filter(Boolean)
        .join('');
    return html;
}

function teamBioBetween(holder, currentStaff, nextStaff) {
    const candidates = [...holder.querySelectorAll('p, blockquote')].filter((node) => {
        const afterCurrent =
            currentStaff.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING;
        if (!afterCurrent) return false;
        if (nextStaff) {
            const beforeNext =
                nextStaff.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING;
            if (!beforeNext) return false;
        }
        const text = (node.textContent || '').trim();
        return text.length > 8;
    });

    const fullText = candidates
        .map((n) => (n.textContent || '').trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ');

    if (!fullText) return '';
    const words = fullText.split(' ');
    if (words.length <= 28) return fullText;
    return words.slice(0, 28).join(' ') + '…';
}

function hydrateAboutTeamGrid(holder) {
    const grid = document.querySelector('.sc-about-page-dynamic .sc-about-team-grid');
    if (!grid || !holder) return;

    const staffNodes = [...holder.querySelectorAll('.container-staff')];
    if (!staffNodes.length) return;

    const cards = staffNodes
        .map((staff, idx) => {
            const card = parseStaffCard(staff);
            const nextStaff = staffNodes[idx + 1] || null;
            const bio = teamBioBetween(holder, staff, nextStaff);
            const socialsHtml = buildTeamSocials(staff);
            return { ...card, bio, socialsHtml };
        })
        .filter((c) => c.name || c.mainImageSrc)
        .filter((c) => !/riccardo/i.test(c.name || ''));

    if (!cards.length) return;

    grid.innerHTML = cards
        .map((c) => {
            const imgHtml = c.mainImageSrc
                ? `<img src="${c.mainImageSrc}" alt="${c.mainImageAlt || c.name}" loading="lazy" />`
                : `<span class="sc-about-team-avatar-placeholder">${c.name}</span>`;
            const role = c.chip
                ? `<span class="sc-about-team-role">${c.chip}</span>`
                : '';
            const bio = c.bio ? `<p>${c.bio}</p>` : '';
            const socials = c.socialsHtml
                ? `<div class="sc-about-team-socials">${c.socialsHtml}</div>`
                : '';
            return `<article class="sc-about-team-card"><span>${imgHtml}</span><h4>${c.name}</h4>${role}${bio}${socials}</article>`;
        })
        .join('');
}

/** Append fragments from `#get "pages"` templates after main lexical source */
function gatherLexicalHolders(mainTpl) {
    const holder = document.createElement('div');
    if (mainTpl?.content) {
        holder.appendChild(mainTpl.content.cloneNode(true));
    }
    document.querySelectorAll('template.sc-about-source-fragment').forEach((t) => {
        if (!t.content) return;
        holder.appendChild(t.content.cloneNode(true));
    });
    return holder;
}

export function initAboutPage() {
    const root = document.querySelector('.sc-about-page-dynamic');
    const tpl = document.querySelector('template.sc-about-lexical-source');
    if (!root || !tpl || !tpl.content) return;

    const holder = gatherLexicalHolders(tpl);
    const cms = holder.querySelector('.sc-about-cms');

    hydrateAboutTeamGrid(holder);

    let parsed = parseFromHeadings(holder);
    if (cms) mergeParsed(parsed, parseFromSlots(cms));

    console.log('[sc-about FAQ] final (after heading + slot merge)', {
        faqIntroHtml: typeof parsed.faqIntroHtml,
        faqIntroLength: (parsed.faqIntroHtml || '').length,
        faqIntroPreview: (parsed.faqIntroHtml || '').slice(0, 160),
        faqPairsCount: parsed.faqPairs?.length ?? 0,
        faqPairs: (parsed.faqPairs || []).map((p, i) => ({
            index: i,
            qType: typeof p.q,
            q: p.q,
            aHtmlType: typeof p.aHtml,
            aHtmlLength: (p.aHtml || '').length,
            aHtmlPreview: (p.aHtml || '').slice(0, 220)
        }))
    });

    if (!hasHydrationSignal(parsed, holder)) return;

    const missionP = root.querySelector('[data-sc-about-mission-text]');
    if (parsed.missionHtml && missionP) missionP.innerHTML = parsed.missionHtml;

    const revIntro = root.querySelector('[data-sc-about-revenue-intro]');
    if (parsed.revenueIntroHtml && revIntro) revIntro.innerHTML = parsed.revenueIntroHtml;

    const gridEl = root.querySelector('.sc-about-revenue-grid');
    if (parsed.revenueItems?.length && gridEl) renderRevenueGrid(gridEl, parsed.revenueItems);

    const faqIntro = root.querySelector('[data-sc-about-faq-intro]');
    if (parsed.faqIntroHtml && faqIntro) faqIntro.innerHTML = parsed.faqIntroHtml;

    const faqList = root.querySelector('[data-faq-list]');
    if (parsed.faqPairs?.length && faqList) {
        faqList.textContent = '';
        parsed.faqPairs.forEach((pair, idx) => {
            faqList.appendChild(buildFaqArticle(pair.q, pair.aHtml, idx === 0));
        });
        wireAboutFaqAccordion(faqList);
    }

    hydrateRiccardo(root, parsed.riccardo);
}
