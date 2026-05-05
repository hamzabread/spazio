/**
 * About page (page-about.hbs): optional CMS body from Ghost `{{{content}}}` in
 * `<template class="sc-about-lexical-source">`. Either:
 * - A hidden `.sc-about-cms` block with `[data-sc-about-slot="…"]`, or
 * - Natural headings: "Our Mission", "How Do We Earn Money" / "Revenue Model", "FAQ".
 */

function normHeading(t) {
    return (t || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function nextMatchingSibling(el, selector, stopAt) {
    let n = el.nextElementSibling;
    while (n) {
        if (n.matches(stopAt)) break;
        if (n.matches(selector)) return n;
        n = n.nextElementSibling;
    }
    return null;
}

function parseRevenueLi(li) {
    const strong = li.querySelector('strong');
    let title = '';
    let body = '';
    if (strong) {
        title = (strong.textContent || '').replace(/:\s*$/, '').trim();
        const clone = li.cloneNode(true);
        clone.querySelectorAll('strong').forEach((s) => s.remove());
        body = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    } else {
        const text = (li.textContent || '').trim();
        const m = text.match(/^[-•*]?\s*(.+?):\s*(.+)$/s);
        if (m) {
            title = m[1].trim();
            body = m[2].trim();
        }
    }
    return { title, body };
}

function parseFromSlots(cms) {
    const out = {
        missionHtml: '',
        revenueIntroHtml: '',
        revenueItems: [],
        faqIntroHtml: '',
        faqPairs: []
    };

    const m = cms.querySelector('[data-sc-about-slot="mission"]');
    if (m) out.missionHtml = m.innerHTML.trim();

    const ri = cms.querySelector('[data-sc-about-slot="revenue-intro"]');
    if (ri) out.revenueIntroHtml = ri.innerHTML.trim();

    const rc = cms.querySelector('[data-sc-about-slot="revenue-cards"]');
    if (rc) {
        rc.querySelectorAll('li').forEach((li) => {
            const { title, body } = parseRevenueLi(li);
            if (title || body) out.revenueItems.push({ title, body });
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

    return out;
}

function parseFromHeadings(holder) {
    const out = {
        missionHtml: '',
        revenueIntroHtml: '',
        revenueItems: [],
        faqIntroHtml: '',
        faqPairs: []
    };

    const headings = [...holder.querySelectorAll('h2, h3, h4')];

    for (const h of headings) {
        const t = normHeading(h.textContent);
        if (t.includes('our mission')) {
            const p = nextMatchingSibling(h, 'p', 'h1,h2,h3');
            if (p) out.missionHtml = p.innerHTML.trim();
        }
        if (
            t.includes('how do we earn') ||
            t.includes('earn money') ||
            (t.includes('revenue') && t.includes('model'))
        ) {
            let n = h.nextElementSibling;
            while (n && !n.matches('h1,h2,h3')) {
                if (n.matches('p') && !out.revenueIntroHtml) {
                    out.revenueIntroHtml = n.innerHTML.trim();
                }
                if (n.matches('ul')) {
                    n.querySelectorAll(':scope > li').forEach((li) => {
                        const { title, body } = parseRevenueLi(li);
                        if (title || body) out.revenueItems.push({ title, body });
                    });
                    break;
                }
                n = n.nextElementSibling;
            }
        }
        if (t.includes('frequently asked') || t === 'faq' || /^faq\s/.test(t)) {
            let n = h.nextElementSibling;
            if (n?.matches('p')) {
                const after = n.nextElementSibling;
                if (after?.matches('h3,h4')) {
                    out.faqIntroHtml = n.innerHTML.trim();
                    n = after;
                }
            }
            while (n && !n.matches('h1,h2')) {
                if (n.matches('h3,h4')) {
                    const q = (n.textContent || '').trim();
                    const p = nextMatchingSibling(n, 'p', 'h1,h2,h3,h4');
                    if (q && p) out.faqPairs.push({ q, aHtml: p.innerHTML.trim() });
                    n = p ? p.nextElementSibling : n.nextElementSibling;
                    continue;
                }
                n = n.nextElementSibling;
            }
        }
    }

    return out;
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
  <p class="sc-about-faq-answer"></p>
</div>`;
    art.querySelector('.sc-about-faq-question').textContent = q;
    const ans = art.querySelector('.sc-about-faq-answer');
    ans.innerHTML = aHtml;
    return art;
}

function wireAboutFaqAccordion(listRoot) {
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
        parsed.revenueItems.length ||
        parsed.faqIntroHtml ||
        parsed.faqPairs.length
    );
}

export function initAboutPage() {
    const root = document.querySelector('.sc-about-page-dynamic');
    const tpl = document.querySelector('template.sc-about-lexical-source');
    if (!root || !tpl || !tpl.content) return;

    const holder = document.createElement('div');
    holder.appendChild(tpl.content.cloneNode(true));

    const cms = holder.querySelector('.sc-about-cms');
    let parsed = cms ? parseFromSlots(cms) : parseFromHeadings(holder);
    if (!hasCmsSignal(parsed)) {
        const retry = parseFromHeadings(holder);
        if (hasCmsSignal(retry)) parsed = retry;
    }
    if (!hasCmsSignal(parsed)) return;

    const missionP = root.querySelector('[data-sc-about-mission-text]');
    if (parsed.missionHtml && missionP) missionP.innerHTML = parsed.missionHtml;

    const revIntro = root.querySelector('[data-sc-about-revenue-intro]');
    if (parsed.revenueIntroHtml && revIntro) revIntro.innerHTML = parsed.revenueIntroHtml;

    const items = root.querySelectorAll('.sc-about-revenue-grid .sc-about-revenue-item');
    if (parsed.revenueItems.length && items.length) {
        parsed.revenueItems.slice(0, items.length).forEach((row, i) => {
            const h3 = items[i].querySelector('h3');
            const p = items[i].querySelector('p');
            if (h3 && row.title) h3.textContent = row.title;
            if (p && row.body) p.textContent = row.body;
        });
    }

    const faqIntro = root.querySelector('[data-sc-about-faq-intro]');
    if (parsed.faqIntroHtml && faqIntro) faqIntro.innerHTML = parsed.faqIntroHtml;

    const faqList = root.querySelector('[data-faq-list]');
    if (parsed.faqPairs.length && faqList) {
        faqList.textContent = '';
        parsed.faqPairs.forEach((pair, idx) => {
            faqList.appendChild(buildFaqArticle(pair.q, pair.aHtml, idx === 0));
        });
        wireAboutFaqAccordion(faqList);
    }
}
