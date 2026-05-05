/**
 * Company / product directory profile pages: strip "#" from internal tag pills,
 * shuffle sidebar news pool, resolve Visit website from authors or feature image caption.
 */

const URL_RE = /^https?:\/\//i;

function normalizeWebsiteUrl(raw) {
    const value = (raw || '').trim();
    if (!value) return '';
    if (URL_RE.test(value)) return value;
    if (value.startsWith('//')) return `https:${value}`;
    if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value)) return `https://${value}`;
    return '';
}

function shuffleNewsList(ul) {
    const items = Array.from(ul.children);
    if (items.length <= 2) return;
    for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    ul.replaceChildren(...items.slice(0, 2));
}

function wireOfficialWebsiteCta(root) {
    const staticCta = root.querySelector('.sc-company-cta:not(.sc-company-cta--autofill)');
    const autofill = root.querySelector('.sc-company-cta--autofill');
    const poolTpl = root.querySelector('template.sc-official-url-pool');

    if (staticCta) {
        const href = normalizeWebsiteUrl(staticCta.getAttribute('href'));
        if (href) {
            staticCta.href = href;
            autofill?.remove();
            poolTpl?.remove();
            return;
        }
        staticCta.remove();
    }

    if (!autofill || !poolTpl?.content) {
        autofill?.remove();
        poolTpl?.remove();
        return;
    }

    const spans = poolTpl.content.querySelectorAll('span');
    const urls = [...spans]
        .map((s) => normalizeWebsiteUrl(s.textContent))
        .filter(Boolean);
    poolTpl.remove();

    if (!urls.length) {
        autofill.href = window.location.href;
        autofill.removeAttribute('hidden');
        return;
    }

    autofill.href = urls[0];
    autofill.removeAttribute('hidden');
}

function toTitleToken(token) {
    if (!token) return '';
    if (token.length <= 4) return token.toUpperCase();
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function formatFromSlug(slug, asTicker = false) {
    const clean = (slug || '').replace(/^hash-/i, '').trim();
    if (!clean) return '';
    const parts = clean.split('-').filter(Boolean);
    if (!parts.length) return '';
    if (asTicker) return parts.join('-').toUpperCase();
    return parts.map(toTitleToken).join(' ');
}

function wireProductInfoFromSlugs(root) {
    const productInfo = root.querySelector('.sc-product-info-card');
    if (!productInfo) return;

    const source = productInfo.querySelectorAll('[data-product-info-source]');
    const slugs = [...source]
        .map((el) => (el.getAttribute('data-slug') || '').trim())
        .filter((slug) => slug.startsWith('hash-') && !/^hash-(product|products)$/i.test(slug));

    const parentCompany = productInfo.querySelector('[data-product-info-parent-company]');
    const ticker = productInfo.querySelector('[data-product-info-ticker]');
    const supportedCryptos = productInfo.querySelector('[data-product-info-supported-cryptos]');

    if (parentCompany && slugs[0]) parentCompany.textContent = formatFromSlug(slugs[0]);
    if (ticker && slugs[1]) ticker.textContent = formatFromSlug(slugs[1], true);
    if (supportedCryptos && slugs.length > 2) {
        supportedCryptos.textContent = slugs.slice(2).map((s) => formatFromSlug(s)).join(', ');
    }
}

const PRODUCT_BODY_META_KEYS = new Set([
    'product',
    'parent company',
    'ticker',
    'supported cryptos',
    'supported crypto'
]);

function normProductMetaLabel(s) {
    return (s || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function scoreProductBodyMetaUl(ul) {
    let n = 0;
    ul.querySelectorAll(':scope > li').forEach((li) => {
        const t = (li.textContent || '').trim();
        const m = t.match(/^([^:]+):\s*(.+)$/);
        if (!m) return;
        const k = normProductMetaLabel(m[1]);
        if (PRODUCT_BODY_META_KEYS.has(k)) n += 1;
    });
    return n;
}

/** Last <ul> in product bio that looks like Product / Parent Company / … metadata. */
function findProductBodyMetaUl(bio) {
    const uls = [...bio.querySelectorAll('ul')];
    for (let i = uls.length - 1; i >= 0; i -= 1) {
        if (scoreProductBodyMetaUl(uls[i]) >= 2) return uls[i];
    }
    return null;
}

function parseProductBodyMetaUl(ul) {
    const out = { product: '', parentCompany: '', ticker: '', supportedCryptos: '' };
    ul.querySelectorAll(':scope > li').forEach((li) => {
        const t = (li.textContent || '').trim();
        const m = t.match(/^([^:]+):\s*(.+)$/);
        if (!m) return;
        const k = normProductMetaLabel(m[1]);
        const v = m[2].trim();
        if (!v) return;
        if (k === 'product') out.product = v;
        else if (k === 'parent company') out.parentCompany = v;
        else if (k === 'ticker') out.ticker = v;
        else if (k === 'supported cryptos' || k === 'supported crypto') out.supportedCryptos = v;
    });
    return out;
}

/** Lexical/HTML list at end of post → sidebar Product info; list removed from body. */
function wireProductInfoFromPostBody(root) {
    if (!root.classList.contains('sc-product-page')) return;

    const bio = root.querySelector('.sc-people-bio.gh-content');
    const card = root.querySelector('.sc-product-info-card');
    if (!bio || !card) return;

    const ul = findProductBodyMetaUl(bio);
    if (!ul) return;

    const meta = parseProductBodyMetaUl(ul);
    if (!meta.product && !meta.parentCompany && !meta.ticker && !meta.supportedCryptos) return;

    const ddProduct = card.querySelector('[data-product-info-display-name]');
    const ddParent = card.querySelector('[data-product-info-parent-company]');
    const ddTicker = card.querySelector('[data-product-info-ticker]');
    const ddCrypto = card.querySelector('[data-product-info-supported-cryptos]');

    if (meta.product && ddProduct) ddProduct.textContent = meta.product;
    if (meta.parentCompany && ddParent) ddParent.textContent = meta.parentCompany;
    if (meta.ticker && ddTicker) ddTicker.textContent = meta.ticker;
    if (meta.supportedCryptos && ddCrypto) ddCrypto.textContent = meta.supportedCryptos;

    const prev = ul.previousElementSibling;
    if (prev && prev.tagName === 'HR') prev.remove();
    ul.remove();
}

export function initCompanyPostPage() {
    document.querySelectorAll('.sc-company-page, .sc-product-page').forEach((root) => {
        root.querySelectorAll('.sc-company-internal-tag').forEach((el) => {
            const t = (el.textContent || '').trim();
            if (t.startsWith('#')) el.textContent = t.slice(1).trim();
        });

        const newsList = root.querySelector('[data-sc-news-shuffle]');
        if (newsList) shuffleNewsList(newsList);

        wireOfficialWebsiteCta(root);
        wireProductInfoFromSlugs(root);
        wireProductInfoFromPostBody(root);
    });
}
