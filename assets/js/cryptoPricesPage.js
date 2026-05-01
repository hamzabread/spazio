/**
 * /crypto-prices — live market data from CoinGecko public API (images + sparklines).
 * Falls back to embedded mock rows if the request fails (network/CORS/rate limit).
 *
 * @see https://docs.coingecko.com/reference/coins-markets
 */
const GECKO_API = 'https://api.coingecko.com/api/v3';

/** CoinGecko `category` query values (omit key when null). */
const TAB_CATEGORY = {
    all: null,
    highlights: null,
    categories: null,
    rwa: 'real-world-assets-rwa',
    nfts: 'non-fungible-tokens-nft',
    unlocks: null,
    alpha: null,
    memes: 'meme-token',
    privacy: 'privacy-coins',
    mining: null
};

/** CoinGecko `/coins/markets` only allows these `order` values (see API docs). */
const SORT_SEQUENCE = [
    { id: 'rank', apiOrder: 'market_cap_desc', aria: 'Sort by market cap' },
    { id: 'volume', apiOrder: 'volume_desc', aria: 'Sort by 24H volume' },
    { id: 'rank_asc', apiOrder: 'market_cap_asc', aria: 'Sort by market cap, ascending' },
    { id: 'vol_asc', apiOrder: 'volume_asc', aria: 'Sort by volume, ascending' },
    { id: 'id', apiOrder: 'id_asc', aria: 'Sort by id (A–Z)' }
];

const FALLBACK_ROWS = [
    { market_cap_rank: 1, name: 'Bitcoin', symbol: 'btc', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', current_price: 115303.57, price_change_percentage_1h_in_currency: -0.15, price_change_percentage_24h_in_currency: -0.44, price_change_percentage_7d_in_currency: -3.51, total_volume: 22982963825, market_cap: 2298296382520, sparkline_in_7d: { price: [1, 1.02, 0.98, 0.97, 0.99, 0.96, 0.97] } },
    { market_cap_rank: 2, name: 'Ethereum', symbol: 'eth', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', current_price: 4271.19, price_change_percentage_1h_in_currency: -0.11, price_change_percentage_24h_in_currency: -0.79, price_change_percentage_7d_in_currency: 0.9, total_volume: 5033355020, market_cap: 523004051979, sparkline_in_7d: { price: [1, 1.01, 1.02, 1.01, 1.03, 1.04, 1.05] } }
];

async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function safeHttpsUrl(url) {
    try {
        const u = new URL(String(url));
        return u.protocol === 'https:' ? u.href : '';
    } catch {
        return '';
    }
}

function formatMoney(value, decimals = 2) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    const n = Number(value);
    const d = n < 1 && n > 0 ? Math.min(6, Math.max(2, (String(n).split('.')[1] || '').length)) : decimals;
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

function formatUsdCompact(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatTokenQtyCompact(qty) {
    if (qty == null || !Number.isFinite(qty) || qty <= 0) return '—';
    if (qty >= 1e9) return `${(qty / 1e9).toFixed(2)}B`;
    if (qty >= 1e6) return `${(qty / 1e6).toFixed(2)}M`;
    if (qty >= 1e3) return `${(qty / 1e3).toFixed(2)}K`;
    return `${qty.toFixed(2)}`;
}

function pct(n) {
    if (n == null || Number.isNaN(Number(n))) return 0;
    return Number(n);
}

const SVG_CHANGE_UP = `<span class="sc-crypto-prices-change-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10.0151 7.98499L6.26512 4.23499C6.23029 4.20013 6.18893 4.17247 6.14341 4.15359C6.09789 4.13472 6.04909 4.12501 5.99981 4.12501C5.95053 4.12501 5.90173 4.13472 5.8562 4.15359C5.81068 4.17247 5.76932 4.20013 5.73449 4.23499L1.98449 7.98499C1.93199 8.03744 1.89623 8.10428 1.88173 8.17706C1.86724 8.24985 1.87467 8.32529 1.90307 8.39385C1.93148 8.46241 1.97959 8.521 2.04131 8.5622C2.10304 8.6034 2.1756 8.62536 2.24981 8.62531H9.74981C9.82402 8.62536 9.89658 8.6034 9.9583 8.5622C10.02 8.521 10.0681 8.46241 10.0965 8.39385C10.1249 8.32529 10.1324 8.24985 10.1179 8.17706C10.1034 8.10428 10.0676 8.03744 10.0151 7.98499Z" fill="#16C784"/></svg></span>`;

const SVG_CHANGE_DOWN = `<span class="sc-crypto-prices-change-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10.0151 4.76531L6.26512 8.51531C6.23029 8.55018 6.18893 8.57784 6.14341 8.59671C6.09789 8.61558 6.04909 8.62529 5.99981 8.62529C5.95053 8.62529 5.90173 8.61558 5.8562 8.59671C5.81068 8.57784 5.76932 8.55018 5.73449 8.51531L1.98449 4.76531C1.93199 4.71287 1.89623 4.64602 1.88173 4.57324C1.86724 4.50046 1.87467 4.42501 1.90307 4.35645C1.93148 4.28789 1.97959 4.22931 2.04131 4.1881C2.10304 4.1469 2.1756 4.12494 2.24981 4.125H9.74981C9.82402 4.12494 9.89658 4.1469 9.9583 4.1881C10.02 4.22931 10.0681 4.28789 10.0965 4.35645C10.1249 4.42501 10.1324 4.50046 10.1179 4.57324C10.1034 4.64602 10.0676 4.71287 10.0151 4.76531Z" fill="#EA3943"/></svg></span>`;

function changeCell(value) {
    const n = pct(value);
    const dirClass = n >= 0 ? 'up' : 'down';
    const icon = n >= 0 ? SVG_CHANGE_UP : SVG_CHANGE_DOWN;
    return `<span class="sc-crypto-prices-change ${dirClass}">${icon}<span class="sc-crypto-prices-change-value">${Math.abs(n).toFixed(2)}%</span></span>`;
}

function sparklineFromSeries(prices) {
    if (!prices || prices.length < 2) {
        return '<span class="sc-crypto-prices-mini-graph sc-crypto-prices-mini-graph--empty" aria-hidden="true"></span>';
    }
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const isUp = last >= first;
    const stroke = isUp ? '#25C18A' : '#EB4D5C';
    const fill = isUp ? 'rgba(37,193,138,0.22)' : 'rgba(235,77,92,0.22)';
    const w = 70;
    const h = 18;
    const padX = 1;
    const padY = 2;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const pts = prices.map((p, i) => {
        const x = padX + (i / (prices.length - 1)) * innerW;
        const t = max === min ? 0.5 : (p - min) / (max - min);
        const y = padY + (1 - t) * innerH;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    const lineD = `M${pts.join(' L')}`;
    const areaD = `${lineD} L${padX + innerW},${h - padY} L${padX},${h - padY} Z`;
    return `
        <svg class="sc-crypto-prices-mini-graph" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="${areaD}" fill="${fill}"></path>
            <path d="${lineD}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
    `;
}

function buildMarketsUrl(page, perPage, order, category) {
    const p = new URLSearchParams({
        vs_currency: 'usd',
        order,
        per_page: String(perPage),
        page: String(page),
        sparkline: 'true',
        price_change_percentage: '1h,24h,7d'
    });
    if (category) p.set('category', category);
    return `${GECKO_API}/coins/markets?${p.toString()}`;
}

function normalizeCoin(c) {
    const volUsd = c.total_volume;
    const price = c.current_price;
    const approxCoinVol = price ? volUsd / price : null;
    return {
        rank: c.market_cap_rank ?? '—',
        name: c.name,
        symbol: (c.symbol || '').toUpperCase(),
        image: safeHttpsUrl(c.image) || 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
        price,
        h1: c.price_change_percentage_1h_in_currency ?? c.price_change_percentage_1h,
        h24: c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h,
        h7: c.price_change_percentage_7d_in_currency ?? c.price_change_percentage_7d,
        volumeUsd: volUsd,
        volumeCoinLabel: formatTokenQtyCompact(approxCoinVol),
        marketCap: c.market_cap,
        sparkline: c.sparkline_in_7d?.price || []
    };
}

function renderRow(row) {
    const sym = escapeHtml(row.symbol || '');
    const name = escapeHtml(row.name);
    const img = escapeHtml(row.image);
    const rank = escapeHtml(row.rank);
    return `
        <tr>
            <td>${rank}</td>
            <td>
                <div class="sc-crypto-prices-name-cell">
                    <img class="sc-crypto-prices-coin-img" src="${img}" alt="" width="24" height="24" loading="lazy" decoding="async" referrerpolicy="no-referrer">
                    <div class="sc-crypto-prices-coin-meta"><strong>${name}</strong><span>${sym}</span></div>
                </div>
            </td>
            <td class="sc-crypto-prices-td-num">${formatMoney(row.price, row.price < 1 ? 4 : 2)}</td>
            <td class="sc-crypto-prices-td-pct">${changeCell(row.h1)}</td>
            <td class="sc-crypto-prices-td-pct">${changeCell(row.h24)}</td>
            <td class="sc-crypto-prices-td-pct">${changeCell(row.h7)}</td>
            <td class="sc-crypto-prices-td-num sc-crypto-prices-td-vol">${formatUsdCompact(row.volumeUsd)}<small>${row.volumeCoinLabel}</small></td>
            <td class="sc-crypto-prices-td-num">${formatUsdCompact(row.marketCap)}</td>
            <td class="sc-crypto-prices-td-graph">${sparklineFromSeries(row.sparkline)}</td>
        </tr>
    `;
}

function buildPagerButtons(currentPage, totalPages) {
    const pages = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i += 1) pages.push(i);
        return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i += 1) {
        pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
}

export function initCryptoPricesPage() {
    const root = document.querySelector('.sc-crypto-prices-page');
    if (!root) return;

    const tbody = root.querySelector('[data-cp-tbody]');
    const tabs = Array.from(root.querySelectorAll('[data-cp-tab]'));
    const searchInput = root.querySelector('[data-cp-search]');
    const sortBtn = root.querySelector('[data-cp-sort-btn]');
    const pageSizeSelect = root.querySelector('[data-cp-page-size]');
    const summary = root.querySelector('[data-cp-summary]');
    const pagerNumbers = root.querySelector('[data-cp-page-numbers]');
    const prevBtn = root.querySelector('[data-cp-prev]');
    const nextBtn = root.querySelector('[data-cp-next]');

    if (!tbody || !pageSizeSelect || !summary || !pagerNumbers || !prevBtn || !nextBtn) return;

    let activeCategory = 'all';
    let searchQuery = '';
    let sortIndex = 0;
    let currentPage = 1;
    let pageSize = Number(pageSizeSelect.value) || 100;
    let totalCoins = 9509;
    let useFallback = false;
    let searchDebounce = null;

    const getSortMeta = () => SORT_SEQUENCE[sortIndex % SORT_SEQUENCE.length];

    const syncSortAria = () => {
        if (!sortBtn) return;
        sortBtn.setAttribute('aria-label', getSortMeta().aria);
    };

    async function loadGlobalTotal() {
        try {
            const data = await fetchJson(`${GECKO_API}/global`);
            const n = data?.data?.active_cryptocurrencies;
            if (typeof n === 'number' && n > 0) totalCoins = n;
        } catch {
            /* keep previous / default */
        }
    }

    async function loadMarkets() {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:#6A7282;">Loading…</td></tr>`;

        if (useFallback) {
            const rows = FALLBACK_ROWS.map(normalizeCoin);
            tbody.innerHTML = rows.map(renderRow).join('');
            summary.textContent = `Showing 1 - ${rows.length} (offline sample)`;
            pagerNumbers.innerHTML = '';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        if (searchQuery.trim().length >= 2) {
            try {
                const q = encodeURIComponent(searchQuery.trim());
                const searchData = await fetchJson(`${GECKO_API}/search?query=${q}`);
                const coins = searchData?.coins || [];
                const ids = coins.slice(0, 80).map((c) => c.id).filter(Boolean).join(',');
                if (!ids) {
                    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:#6A7282;">No matches</td></tr>`;
                    summary.textContent = 'Showing 0 - 0';
                    pagerNumbers.innerHTML = '';
                    prevBtn.disabled = true;
                    nextBtn.disabled = true;
                    return;
                }
                const list = await fetchJson(
                    `${GECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d&per_page=250&page=1`
                );
                const rows = (Array.isArray(list) ? list : []).map(normalizeCoin);
                tbody.innerHTML = rows.length ? rows.map(renderRow).join('') : `<tr><td colspan="9" style="text-align:center;padding:24px;color:#6A7282;">No matches</td></tr>`;
                summary.textContent = `Showing 1 - ${rows.length} (search)`;
                pagerNumbers.innerHTML = '';
                prevBtn.disabled = true;
                nextBtn.disabled = true;
            } catch {
                useFallback = true;
                await loadMarkets();
            }
            return;
        }

        let category = TAB_CATEGORY[activeCategory] || null;
        const { apiOrder } = getSortMeta();
        let url = buildMarketsUrl(currentPage, pageSize, apiOrder, category);

        try {
            let list;
            try {
                list = await fetchJson(url);
            } catch (firstErr) {
                if (category && firstErr.status === 400) {
                    url = buildMarketsUrl(currentPage, pageSize, apiOrder, null);
                    list = await fetchJson(url);
                } else {
                    throw firstErr;
                }
            }
            const rows = (Array.isArray(list) ? list : []).map(normalizeCoin);
            tbody.innerHTML = rows.length ? rows.map(renderRow).join('') : `<tr><td colspan="9" style="text-align:center;padding:24px;color:#6A7282;">No data</td></tr>`;

            const totalPages = Math.max(1, Math.ceil(totalCoins / pageSize));
            const from = rows.length ? (currentPage - 1) * pageSize + 1 : 0;
            const to = rows.length ? (currentPage - 1) * pageSize + rows.length : 0;
            summary.textContent = `Showing ${from} - ${to} out of ${totalCoins.toLocaleString('en-US')}`;

            const pagerTokens = buildPagerButtons(currentPage, totalPages);
            pagerNumbers.innerHTML = pagerTokens.map((token) => {
                if (token === '...') return '<span class="sc-crypto-prices-page-ellipsis">...</span>';
                const activeClass = token === currentPage ? 'is-active' : '';
                return `<button type="button" class="sc-crypto-prices-page-btn sc-crypto-prices-page-num ${activeClass}" data-cp-page="${token}">${token}</button>`;
            }).join('');

            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= totalPages;
        } catch (e) {
            useFallback = true;
            loadGlobalTotal();
            await loadMarkets();
        }
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            activeCategory = tab.getAttribute('data-category') || 'all';
            tabs.forEach((item) => {
                item.classList.toggle('is-active', item === tab);
                item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
            });
            currentPage = 1;
            loadMarkets();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value || '';
            currentPage = 1;
            if (searchDebounce) clearTimeout(searchDebounce);
            searchDebounce = window.setTimeout(() => loadMarkets(), 400);
        });
    }

    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortIndex += 1;
            syncSortAria();
            currentPage = 1;
            loadMarkets();
        });
        syncSortAria();
    }

    pageSizeSelect.addEventListener('change', () => {
        pageSize = Number(pageSizeSelect.value) || 100;
        currentPage = 1;
        loadMarkets();
    });

    prevBtn.addEventListener('click', () => {
        currentPage = Math.max(1, currentPage - 1);
        loadMarkets();
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(totalCoins / pageSize));
        currentPage = Math.min(totalPages, currentPage + 1);
        loadMarkets();
    });

    pagerNumbers.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const page = Number(target.getAttribute('data-cp-page'));
        if (!page) return;
        currentPage = page;
        loadMarkets();
    });

    (async () => {
        await loadGlobalTotal();
        await loadMarkets();
    })();
}
