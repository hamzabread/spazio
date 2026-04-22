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

function formatPctCompact(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    const sign = value > 0 ? '+' : '';
    const abs = Math.abs(value);
    const decimals = abs >= 1 ? 0 : 2;
    return `${sign}${value.toFixed(decimals)}%`;
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
            changeEl.classList.remove('sc-md-change-up', 'sc-md-change-down', 'sc-md-table-change-up', 'sc-md-table-change-down');
            changeEl.classList.add((typeof change === 'number' && change >= 0) ? 'sc-md-table-change-up' : 'sc-md-table-change-down');
        }
    });
}

function updateMarketCap(globalData) {
    const capEl = document.querySelector('[data-md-total-mcap]');
    const capChangeEl = document.querySelector('[data-md-mcap-change]');
    const capChangeWrapEl = document.querySelector('.sc-md-cap-change');
    const capMiniChartAreaEl = document.querySelector('[data-md-mini-chart-area]');
    const sentimentMetaEl = document.querySelector('[data-md-sentiment-meta] a');

    if (!capEl || !capChangeEl || !globalData || !globalData.data) return;

    const usdCap = globalData.data.total_market_cap ? globalData.data.total_market_cap.usd : null;
    const dailyChange = globalData.data.market_cap_change_percentage_24h_usd;
    const btcDominance = globalData.data.market_cap_percentage ? globalData.data.market_cap_percentage.btc : null;

    capEl.textContent = formatCurrency(usdCap);
    capChangeEl.textContent = formatPct(dailyChange);
    capChangeEl.classList.remove('sc-md-change-up', 'sc-md-change-down', 'sc-md-cap-change-up', 'sc-md-cap-change-down');
    const isUp = typeof dailyChange === 'number' && dailyChange >= 0;
    capChangeEl.classList.add(isUp ? 'sc-md-cap-change-up' : 'sc-md-cap-change-down');

    if (capChangeWrapEl) {
        capChangeWrapEl.classList.toggle('is-up', isUp);
        capChangeWrapEl.classList.toggle('is-down', !isUp);
    }

    if (capMiniChartAreaEl) {
        capMiniChartAreaEl.setAttribute('fill', isUp ? 'url(#mdMiniChartGradientUp)' : 'url(#mdMiniChartGradientDown)');
    }

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

function buildAreaPath(points, width, height) {
    if (!Array.isArray(points) || points.length < 2) return '';

    const values = points
        .map((point) => (Array.isArray(point) ? point[1] : null))
        .filter((value) => typeof value === 'number' && Number.isFinite(value));

    if (values.length < 2) return '';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const topPadding = 8;
    const drawableHeight = height - topPadding;

    const chartPoints = values.map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = ((max - value) / range) * drawableHeight + topPadding;
        return { x, y };
    });

    const linePath = chartPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(' ');

    const areaPath = `M0 ${height} ${linePath.replace('M', 'L')} L${width} ${height} Z`;
    return { areaPath, linePath };
}

function renderBitcoinGraph(container, points, isUpTrend) {
    if (!container) return;

    const width = 295;
    const height = 76;
    const paths = buildAreaPath(points, width, height);
    if (!paths || !paths.areaPath || !paths.linePath) return;

    const gradientId = `btcGraphGradient-${Date.now()}`;
    const stopColor = isUpTrend ? '#6FD6A7' : '#90CAF9';
    const strokeColor = isUpTrend ? '#63D7A3' : '#64B5F6';

    container.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="295" height="76" viewBox="0 0 295 76" fill="none">
            <path d="${paths.areaPath}" fill="url(#${gradientId})" />
            <path d="${paths.linePath}" stroke="${strokeColor}" stroke-width="2" fill="none" />
            <defs>
                <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="7600" gradientUnits="userSpaceOnUse">
                    <stop stop-color="${stopColor}" stop-opacity="0.4" />
                    <stop offset="1" stop-color="${stopColor}" stop-opacity="0" />
                </linearGradient>
            </defs>
        </svg>
    `;
}

function updateArticleBitcoinCard(marketCoins, bitcoinChartData) {
    const card = document.querySelector('[data-btc-market-card]');
    if (!card) return;

    const bitcoin = (marketCoins || []).find((coin) => coin.id === 'bitcoin');
    if (!bitcoin) return;

    const nameEl = card.querySelector('[data-btc-name]');
    const symbolEl = card.querySelector('[data-btc-symbol]');
    const priceEl = card.querySelector('[data-btc-price]');
    const changeEl = card.querySelector('[data-btc-change]');
    const iconEl = card.querySelector('[data-btc-icon]');
    const graphEl = card.querySelector('[data-btc-graph]');
    const marketLink = card.querySelector('.sc-blogs-market-link');

    if (nameEl) nameEl.textContent = bitcoin.name;
    if (symbolEl) symbolEl.textContent = `${bitcoin.symbol.toUpperCase()} (24H)`;
    if (priceEl) priceEl.textContent = formatPrice(bitcoin.current_price);
    if (iconEl && bitcoin.image) iconEl.src = bitcoin.image;

    const change = bitcoin.price_change_percentage_24h;
    const isUpTrend = typeof change === 'number' && change >= 0;

    if (changeEl) {
        changeEl.textContent = formatPctCompact(change);
        changeEl.classList.remove('sc-blogs-market-change-up', 'sc-blogs-market-change-down');
        changeEl.classList.add(isUpTrend ? 'sc-blogs-market-change-up' : 'sc-blogs-market-change-down');
    }

    if (marketLink) {
        marketLink.href = 'https://www.coingecko.com/en/coins/bitcoin';
    }

    const chartPoints = bitcoinChartData && Array.isArray(bitcoinChartData.prices)
        ? bitcoinChartData.prices
        : null;
    renderBitcoinGraph(graphEl, chartPoints, isUpTrend);
}

export async function initMarketDashboard() {
    const dashboard = document.querySelector('[data-market-dashboard="coingecko"]');
    if (!dashboard || typeof window.fetch !== 'function') return;

    const gainersRows = Array.from(document.querySelectorAll('[data-md-gainers-row]'));
    const trendingRows = Array.from(document.querySelectorAll('[data-md-trending-row]'));

    try {
        const hasBitcoinCard = Boolean(document.querySelector('[data-btc-market-card]'));

        const [globalData, marketCoins, trendingData, bitcoinChartData] = await Promise.all([
            fetchJson(`${COINGECKO_BASE}/global`),
            fetchJson(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`),
            fetchJson(`${COINGECKO_BASE}/search/trending`),
            hasBitcoinCard ? fetchJson(`${COINGECKO_BASE}/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=hourly`) : Promise.resolve(null)
        ]);

        updateMarketCap(globalData);
        updateContentGridMarketRows(marketCoins);
        updateArticleBitcoinCard(marketCoins, bitcoinChartData);

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
