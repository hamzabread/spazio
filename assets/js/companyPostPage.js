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
    });
}
