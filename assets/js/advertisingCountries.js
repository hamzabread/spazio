/**
 * Advertising page: fill "Top Countries by Traffic" from Ghost page body.
 *
 * 1) Preferred: add an HTML block in the page with:
 *    <script type="application/json" id="sc-advertising-countries-data">[{"country":"Italy","pct":22.6,"sessions":120000},...]</script>
 *
 * 2) Fallback: heading whose text includes "Top Countries" (case-insensitive),
 *    then the next <ul> with <li> lines like "22.6% Italy" or "22.6% Italy 🇮🇹".
 */

function formatSessions(value) {
    if (value === null || value === undefined || value === '') return '—';
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function stripTrailingEmojiLabel(name) {
    return (name || '')
        .replace(/[\uFE0F\u200D]/g, '')
        .replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '')
        .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseLiLine(text) {
    const t = (text || '').trim();
    const m = t.match(/^(\d+(?:\.\d+)?)\s*%\s*(.+)$/);
    if (!m) return null;
    const pct = parseFloat(m[1]);
    const country = stripTrailingEmojiLabel(m[2]);
    if (!country || Number.isNaN(pct)) return null;
    return { country, pct, sessions: null };
}

function parseCountriesFromCms(cmsRoot) {
    const headings = cmsRoot.querySelectorAll('h1, h2, h3, h4, h5, h6, p, strong');
    for (const h of headings) {
        const label = (h.textContent || '').toLowerCase();
        if (!label.includes('top countries')) continue;

        let n = h.nextElementSibling;
        while (n && n.tagName !== 'UL') {
            n = n.nextElementSibling;
        }
        if (!n || n.tagName !== 'UL') continue;

        const rows = [...n.querySelectorAll(':scope > li')]
            .map((li) => parseLiLine(li.textContent || ''))
            .filter(Boolean);

        if (rows.length) {
            return { rows, hide: [h, n] };
        }
    }
    return { rows: [], hide: [] };
}

function parseCountriesFromJson() {
    const el = document.getElementById('sc-advertising-countries-data');
    if (!el || !el.textContent) return [];
    try {
        const data = JSON.parse(el.textContent.trim());
        if (!Array.isArray(data)) return [];
        return data
            .map((row) => ({
                country: row.country != null ? String(row.country).trim() : '',
                pct: Number(row.pct),
                sessions: row.sessions
            }))
            .filter((r) => r.country && !Number.isNaN(r.pct));
    } catch {
        return [];
    }
}

function buildRow(rank, country, sessionsText, pct) {
    const pctClamped = Math.min(100, Math.max(0, pct));
    const tr = document.createElement('tr');

    const td1 = document.createElement('td');
    const rankSpan = document.createElement('span');
    rankSpan.className = 'sc-advertising-rank';
    rankSpan.textContent = String(rank);
    const nameSpan = document.createElement('span');
    nameSpan.className = 'sc-advertising-country-name';
    nameSpan.textContent = country;
    td1.append(rankSpan, document.createTextNode(' '), nameSpan);

    const td2 = document.createElement('td');
    td2.className = 'sc-advertising-sessions';
    td2.textContent = sessionsText;

    const td3 = document.createElement('td');
    td3.className = 'sc-advertising-pct-cell';
    const track = document.createElement('div');
    track.className = 'sc-advertising-countries-bar-track';
    track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'sc-advertising-countries-bar-fill';
    fill.style.width = `${pctClamped}%`;
    track.appendChild(fill);
    const pctSpan = document.createElement('span');
    pctSpan.className = 'sc-advertising-pct-value';
    pctSpan.textContent = `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
    td3.append(track, pctSpan);

    tr.append(td1, td2, td3);
    return tr;
}

export function initAdvertisingCountriesFromPage() {
    const tbody = document.getElementById('sc-advertising-countries-tbody');
    if (!tbody) return;

    const fromJson = parseCountriesFromJson();
    let rows = fromJson;
    let hideNodes = [];

    if (!rows.length) {
        const cms = document.querySelector('.sc-advertising-cms');
        if (cms) {
            const parsed = parseCountriesFromCms(cms);
            rows = parsed.rows;
            hideNodes = parsed.hide;
        }
    }

    if (!rows.length) return;

    const maxPct = Math.max(...rows.map((r) => r.pct), 0.0001);

    tbody.replaceChildren();
    rows.slice(0, 15).forEach((r, i) => {
        tbody.appendChild(
            buildRow(i + 1, r.country, formatSessions(r.sessions), r.pct)
        );
    });

    hideNodes.forEach((node) => {
        if (node) node.setAttribute('hidden', '');
    });
}
