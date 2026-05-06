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

    const rCard = cms.querySelector('[data-sc-about-slot="riccardo-card"]');
    if (rCard) out.riccardoCardSlot = rCard.innerHTML.trim();

    const rBio = cms.querySelector('[data-sc-about-slot="riccardo-bio"]');
    if (rBio) out.riccardoBioSlot = rBio.innerHTML.trim();

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
    if (!togglePairs.length) return faqFlow;

    const useToggles =
        !faqFlow.pairs.length || togglePairs.length >= faqFlow.pairs.length;
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

    let parsed = parseFromHeadings(holder);
    if (cms) mergeParsed(parsed, parseFromSlots(cms));

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
