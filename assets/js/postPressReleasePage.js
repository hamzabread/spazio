/**
 * Press release single post: strip leading # from tag labels in the UI.
 */
export function initPostPressReleasePage() {
    const root = document.querySelector('.sc-pr-post-page');
    if (!root) return;

    root.querySelectorAll('.sc-pr-post-tag, .sc-pr-related-cat-opt, .sc-pr-post-cat-opt').forEach((el) => {
        const t = el.textContent || '';
        if (t.startsWith('#')) el.textContent = t.slice(1);
    });
}
