/**
 * Sticky TOC: highlight link for the section most in view (Media Kit page).
 */
export function initAdvertisingToc() {
    const root = document.querySelector('.sc-advertising-page');
    if (!root) return;

    const nav = root.querySelector('.sc-advertising-toc-nav');
    if (!nav) return;

    const links = [...nav.querySelectorAll('a[href^="#"]')];
    if (!links.length) return;

    const idToLink = new Map();
    links.forEach((link) => {
        const id = link.getAttribute('href').slice(1);
        if (id) idToLink.set(id, link);
    });

    const sections = [...idToLink.keys()]
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length) return;

    const setActive = (activeId) => {
        links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${activeId}`));
    };

    const io = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
            if (visible[0]?.target?.id) setActive(visible[0].target.id);
        },
        { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((sec) => io.observe(sec));

    const hash = window.location.hash.replace('#', '');
    if (hash && idToLink.has(hash)) setActive(hash);
}
