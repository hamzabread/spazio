const GLOSSARY_CACHE_KEY = 'glossary_data_v1';
const GLOSSARY_CACHE_TIME_KEY = 'glossary_data_time_v1';
const GLOSSARY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function fetchGlossaryTermsFromNetwork() {
    return fetch(GLOSSARY_URL)
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const items = doc.querySelectorAll('.kg-toggle-card');
            const glossary = {};
            items.forEach(item => {
                const term = item.querySelector('.kg-toggle-heading-text')?.textContent?.trim();
                const def = item.querySelector('.kg-toggle-content')?.textContent?.trim();
                if (term && def) {
                    glossary[term] = def;
                }
            });
            // Save to localStorage
            try {
                localStorage.setItem(GLOSSARY_CACHE_KEY, JSON.stringify(glossary));
                localStorage.setItem(GLOSSARY_CACHE_TIME_KEY, Date.now().toString());
            } catch (e) {}
            return glossary;
        });
}

function fetchGlossaryTerms() {
    // Try to get from localStorage first
    try {
        const cached = localStorage.getItem(GLOSSARY_CACHE_KEY);
        const cachedTime = parseInt(localStorage.getItem(GLOSSARY_CACHE_TIME_KEY), 10);
        if (cached && cachedTime && (Date.now() - cachedTime < GLOSSARY_CACHE_TTL)) {
            // Use cached data
            return Promise.resolve(JSON.parse(cached));
        } else {
            // Fetch from network and update cache
            return fetchGlossaryTermsFromNetwork();
        }
    } catch (e) {
        // Fallback to network
        return fetchGlossaryTermsFromNetwork();
    }
}

// Optionally, update cache in background if stale
function updateGlossaryCacheInBackground() {
    try {
        const cachedTime = parseInt(localStorage.getItem(GLOSSARY_CACHE_TIME_KEY), 10);
        if (!cachedTime || (Date.now() - cachedTime > GLOSSARY_CACHE_TTL)) {
            fetchGlossaryTermsFromNetwork();
        }
    } catch (e) {}
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wrapGlossaryTermsInContent(glossary, contentEl) {
    // Only wrap whole words, case-insensitive, unless the term contains non-word characters
    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length); // longest first
    if (!terms.length) return;
    terms.forEach(term => {
        // If the term contains non-word characters, don't use \b
        const hasSpecial = /[^\w]/.test(term);
        const regex = hasSpecial
            ? new RegExp(escapeRegExp(term), 'gi')
            : new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
        // For each term, walk the DOM for fresh text nodes (skip those inside .glossary-term or inside h2)
        const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, {
            acceptNode: function(node) {
                if (
                    node.nodeType === Node.TEXT_NODE &&
                    !node.parentNode.closest('.glossary-term') &&
                    !node.parentNode.closest('h2') &&
                    !node.parentNode.closest('h3') &&
                    node.textContent.match(regex)
                ) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            }
        });
        const nodes = [];
        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }
        nodes.forEach(node => {
            // Split the text node and wrap matches
            const frag = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            regex.lastIndex = 0;
            const text = node.textContent;
            while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                }
                const span = document.createElement('span');
                span.className = 'glossary-term';
                span.dataset.term = term;
                span.textContent = match[0];
                frag.appendChild(span);
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < text.length) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex)));
            }
            node.parentNode.replaceChild(frag, node);
        });
    });
}

function createTooltip() {
    let tooltip = document.getElementById('glossary-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'glossary-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '9999';
        tooltip.style.maxWidth = '320px';
        tooltip.style.background = 'var(--glossary-tooltip-bg-color)';
        tooltip.style.color = 'var(--glossary-tooltip-text-color)';
        tooltip.style.padding = '10px 14px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        tooltip.style.fontSize = '1rem';
        tooltip.style.display = 'none';
        tooltip.style.pointerEvents = 'none';
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

function showTooltip(target, text, event) {
    const tooltip = createTooltip();
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    
    // Get target element position
    const rect = target.getBoundingClientRect();
    
    // Get tooltip dimensions (after making it visible)
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;
    
    // Calculate initial position (below the target)
    let left = rect.left + scrollX;
    let top = rect.bottom + scrollY + 8;
    
    // Adjust horizontal position if tooltip goes off-screen
    if (left + tooltipWidth > viewportWidth + scrollX) {
        // Position to the left of cursor if it would go off right edge
        left = viewportWidth + scrollX - tooltipWidth - 16;
    }
    if (left < scrollX + 16) {
        // Ensure minimum margin from left edge
        left = scrollX + 16;
    }
    
    // Adjust vertical position if tooltip goes off-screen
    if (top + tooltipHeight > viewportHeight + scrollY) {
        // Position above the target if it would go off bottom edge
        top = rect.top + scrollY - tooltipHeight - 8;
    }
    if (top < scrollY + 16) {
        // Ensure minimum margin from top edge
        top = scrollY + 16;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function hideTooltip() {
    const tooltip = createTooltip();
    tooltip.style.display = 'none';
}

const handleGlossary = () => {
    document.addEventListener('DOMContentLoaded', function () {
        const contentEl = document.querySelector('.gh-post-content');
        if (!contentEl) return;
        fetchGlossaryTerms().then(glossary => {
            wrapGlossaryTermsInContent(glossary, contentEl);
            // Tooltip events
            contentEl.addEventListener('mouseover', function (e) {
                const t = e.target;
                if (t.classList.contains('glossary-term')) {
                    const term = t.dataset.term;
                    if (glossary[term]) {
                        showTooltip(t, glossary[term], e);
                    }
                }
            });
            contentEl.addEventListener('mousemove', function (e) {
                const tooltip = document.getElementById('glossary-tooltip');
                if (tooltip && tooltip.style.display === 'block') {
                    // Don't move tooltip on mousemove to avoid flickering
                    // The tooltip position is calculated once on mouseover
                }
            });
            contentEl.addEventListener('mouseout', function (e) {
                const t = e.target;
                if (t.classList.contains('glossary-term')) {
                    hideTooltip();
                }
            });
        });
        // Always try to update cache in background if stale
        updateGlossaryCacheInBackground();
    });
};

handleGlossary();

export { handleGlossary };

