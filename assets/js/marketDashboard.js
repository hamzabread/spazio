const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

function formatCurrency(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatPrice(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    if (value >= 1) {
        return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

function formatPct(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

async function fetchJson(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`CoinGecko request failed: ${response.status}`);
    }

    return response.json();
}

function updateTableRows(rows, coins) {
    rows.forEach((row, index) => {
        const coin = coins[index];
        if (!coin) return;

        const pair = row.querySelector('.sc-md-pair');
        const pairIcon = pair ? pair.querySelector('img') : null;
        const pairName = pair ? pair.querySelector('.sc-md-pair-name') : null;
        const pairSymbol = pair ? pair.querySelector('.sc-md-pair-symbol') : null;
        const priceEl = row.children[1];
        const changeEl = row.children[2];

        if (pairIcon && coin.image) {
            pairIcon.src = coin.image;
            pairIcon.alt = coin.name;
        }

        if (pairName) {
            pairName.textContent = coin.name;
        }

        if (pairSymbol) {
            pairSymbol.textContent = coin.symbol.toUpperCase();
        }

        if (priceEl) {
            priceEl.textContent = formatPrice(coin.current_price);
        }

        if (changeEl) {
            const change = coin.price_change_percentage_24h;
            changeEl.textContent = formatPct(change);
            changeEl.classList.remove('sc-md-change-up', 'sc-md-change-down');
            changeEl.classList.add((typeof change === 'number' && change >= 0) ? 'sc-md-change-up' : 'sc-md-change-down');
        }
    });
}

function updateMarketCap(globalData) {
    const capEl = document.querySelector('[data-md-total-mcap]');
    const capChangeEl = document.querySelector('[data-md-mcap-change]');
    const sentimentMetaEl = document.querySelector('[data-md-sentiment-meta] a');

    if (!capEl || !capChangeEl || !globalData || !globalData.data) return;

    const usdCap = globalData.data.total_market_cap ? globalData.data.total_market_cap.usd : null;
    const dailyChange = globalData.data.market_cap_change_percentage_24h_usd;
    const btcDominance = globalData.data.market_cap_percentage ? globalData.data.market_cap_percentage.btc : null;

    capEl.textContent = formatCurrency(usdCap);
    capChangeEl.textContent = formatPct(dailyChange);
    capChangeEl.classList.remove('sc-md-change-up', 'sc-md-change-down');
    capChangeEl.classList.add((typeof dailyChange === 'number' && dailyChange >= 0) ? 'sc-md-change-up' : 'sc-md-change-down');

    if (sentimentMetaEl && typeof btcDominance === 'number') {
        sentimentMetaEl.textContent = `BTC dominance: ${btcDominance.toFixed(2)}%`;
        sentimentMetaEl.href = 'https://www.coingecko.com/';
        sentimentMetaEl.target = '_blank';
        sentimentMetaEl.rel = 'noopener';
    }
}

function getTopGainers(coins, limit) {
    return [...coins]
        .filter((coin) => typeof coin.price_change_percentage_24h === 'number')
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, limit);
}

function updateContentGridMarketRows(coins) {
    const rows = Array.from(document.querySelectorAll('[data-market-row]'));
    if (!rows.length) return;

    const coinById = new Map((coins || []).map((coin) => [coin.id, coin]));

    rows.forEach((row) => {
        const coinId = row.getAttribute('data-market-row');
        const coin = coinById.get(coinId);
        if (!coin) return;

        const iconEl = row.querySelector('[data-market-icon]');
        const nameEl = row.querySelector('[data-market-name]');
        const symbolEl = row.querySelector('[data-market-symbol]');
        const priceEl = row.querySelector('[data-market-price]');
        const changeEl = row.querySelector('[data-market-change]');

        if (iconEl && coin.image) {
            iconEl.src = coin.image;
            iconEl.alt = coin.name;
        }

        if (nameEl) nameEl.textContent = coin.name;
        if (symbolEl) symbolEl.textContent = coin.symbol.toUpperCase();
        if (priceEl) priceEl.textContent = formatPrice(coin.current_price);

        if (changeEl) {
            const change = coin.price_change_percentage_24h;
            changeEl.textContent = formatPct(change);
            changeEl.classList.remove('sc-md-change-up', 'sc-md-change-down');
            changeEl.classList.add((typeof change === 'number' && change >= 0) ? 'sc-md-change-up' : 'sc-md-change-down');
        }

        if (coinId) {
            row.href = `https://www.coingecko.com/en/coins/${coinId}`;
        }
    });
}

export async function initMarketDashboard() {
    const dashboard = document.querySelector('[data-market-dashboard="coingecko"]');
    if (!dashboard || typeof window.fetch !== 'function') return;

    const gainersRows = Array.from(document.querySelectorAll('[data-md-gainers-row]'));
    const trendingRows = Array.from(document.querySelectorAll('[data-md-trending-row]'));

    try {
        const [globalData, marketCoins, trendingData] = await Promise.all([
            fetchJson(`${COINGECKO_BASE}/global`),
            fetchJson(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`),
            fetchJson(`${COINGECKO_BASE}/search/trending`)
        ]);

        updateMarketCap(globalData);
        updateContentGridMarketRows(marketCoins);

        const topGainers = getTopGainers(marketCoins, gainersRows.length || 3);
        updateTableRows(gainersRows, topGainers);

        const trendingIds = (trendingData.coins || [])
            .map((entry) => entry && entry.item && entry.item.id)
            .filter(Boolean)
            .slice(0, trendingRows.length || 3);

        if (trendingIds.length) {
            const trendingCoins = await fetchJson(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(trendingIds.join(','))}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`);
            updateTableRows(trendingRows, trendingCoins);
        }
    } catch (error) {
        // Keep server-rendered Ghost fallback content if API fails or rate-limits.
        // eslint-disable-next-line no-console
        console.warn('CoinGecko market dashboard fallback:', error);
    }
}
