/**
 * Product profile: animate price chart stroke, update change % on an interval.
 * Chart scales via SVG preserveAspectRatio="none" + CSS height on the wrapper.
 */

function animateChartPath(svg) {
    const path = svg.querySelector('.sc-product-chart-path');
    if (!path || typeof path.getTotalLength !== 'function') return;

    try {
        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        path.getBoundingClientRect();
        requestAnimationFrame(() => {
            path.style.transition = 'stroke-dashoffset 1.15s cubic-bezier(0.4, 0, 0.2, 1)';
            path.style.strokeDashoffset = '0';
        });
    } catch {
        /* ignore */
    }
}

function randomChangePct() {
    const v = (Math.random() * 20 - 5).toFixed(2);
    const sign = Number(v) >= 0 ? '+' : '';
    return `${sign}${v}%`;
}

function wireChangeTicker(root) {
    const el = root.querySelector('[data-sc-chart-change]');
    if (!el) return;
    const tick = () => {
        el.textContent = randomChangePct();
        el.classList.toggle('sc-product-chart-change--neg', el.textContent.startsWith('-'));
    };
    tick();
    window.setInterval(tick, 14000);
}

export function initProductPostPage() {
    const root = document.querySelector('.sc-product-page');
    if (!root) return;

    const svg = root.querySelector('[data-sc-product-chart]');
    if (svg) animateChartPath(svg);

    wireChangeTicker(root);
}
