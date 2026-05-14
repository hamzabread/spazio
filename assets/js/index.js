// JavaScript files are compiled and minified during the build process to the assets/built folder. See available scripts in the package.json file.

// Import CSS
import '../css/index.css';

// Import JS
import { toggleDarkMode } from './darkMode';
import { initSliders } from './initSliders';
import { loadMore } from './loadMore';
import { hideHeader, changeHeaderTransparency, showSubNav } from './header';
import { scrollTop, scrollTopAlign } from './scrollTop';
import { toggleAccordion } from './toggleAccordion';
import { vibrator } from './vibrator';


// GhostFlow  MH
import { insertWidget, moveWidget } from './widget';

import { copyToClipboard } from './copyToClipBoard';
import { togglePlan } from './membershipToggle';
import { calcHeight } from './membershipCard';
import { initMobileMenu } from './mobileMenu';
import { changeTwitterCardTheme } from './twitterTheme';
import { footerExternalLinks } from './footerExternalLinks';
import { initMarketDashboard } from './marketDashboard';
import { normalizeEventMeta } from './eventMeta';
import { initAdvertisingToc } from './advertisingToc';
import { initAdvertisingCountriesFromPage } from './advertisingCountries';
import { initPressReleasesListing } from './pressReleasesListing';
import { initEventsListing } from './eventsListing';
import { initPostPressReleasePage } from './postPressReleasePage';
import { initPostJobPage } from './postJobPage';
import { initJobMetaFromPostBody } from './jobMetaFromContent';
import { initPeoplePostPage } from './peoplePostPage';
import { initCompanyPostPage } from './companyPostPage';
import { initProductPostPage } from './productPostPage';
import { initCryptoPricesPage } from './cryptoPricesPage';
import { initAboutPage } from './aboutPage';

import { createPopUp } from './languagePopUp';

function detectSocialPlatformKey(label) {
	const t = (label || '').toLowerCase().replace(/[^a-z]/g, '');
	if (!t) return '';
	if (t.includes('youtube')) return 'youtube';
	if (t.includes('linkdin') || t.includes('linkedin')) return 'linkedin';
	if (t.includes('facebook')) return 'facebook';
	if (t.includes('instagram')) return 'instagram';
	if (t.includes('telegram')) return 'telegram';
	if (t.includes('reddit')) return 'reddit';
	if (t.includes('tiktok')) return 'tiktok';
	if (t === 'x' || t.includes('twitter') || t.includes('xcom')) return 'x';
	return '';
}

function hydrateSocialChannels() {
	const tpl = document.querySelector('template.sc-social-source');
	const section = document.querySelector('.sc-social-channels');
	if (!tpl || !tpl.content || !section) return;

	const holder = document.createElement('div');
	holder.appendChild(tpl.content.cloneNode(true));

	const titleEl = section.querySelector('.sc-social-title');
	const subtitleEl = section.querySelector('.sc-social-subtitle');
	const grid = section.querySelector('.sc-social-grid');
	if (!grid) return;

	const sourceH2 = holder.querySelector('h2');
	if (sourceH2 && titleEl) titleEl.textContent = sourceH2.textContent.trim();

	const sourceP = holder.querySelector('p');
	if (sourceP && subtitleEl) subtitleEl.textContent = sourceP.textContent.trim();

	// Build a map of platform -> existing static logo HTML so we reuse the theme's SVGs/images.
	const logoByPlatform = {};
	[...grid.querySelectorAll('.sc-social-card')].forEach((card) => {
		const logo = card.querySelector('.sc-social-logo');
		if (!logo) return;
		const platformClass = [...logo.classList].find((c) => c.startsWith('sc-social-logo--'));
		if (!platformClass) return;
		const key = platformClass.replace('sc-social-logo--', '');
		logoByPlatform[key] = logo.outerHTML;
	});

	const productCards = [...holder.querySelectorAll('.kg-card.kg-product-card, .kg-product-card')];
	if (!productCards.length) return;

	const cards = productCards
		.map((card) => {
			const desc = (card.querySelector('.kg-product-card-description')?.textContent || '').trim();
			const btn = card.querySelector('.kg-product-card-button');
			const btnText = (btn?.textContent || '').trim();
			const btnHref = btn?.getAttribute('href') || '#';
			const key = detectSocialPlatformKey(btnText);
			return { desc, btnText, btnHref, key };
		})
		.filter((c) => c.desc || c.btnText);

	if (!cards.length) return;

	const escapeHtml = (s) =>
		(s || '').replace(/[&<>"']/g, (ch) =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
		);

	grid.innerHTML = cards
		.map((c) => {
			const logoHtml =
				logoByPlatform[c.key] ||
				`<div class="sc-social-logo sc-social-logo--${c.key || 'generic'}" aria-hidden="true"></div>`;
			return `<article class="sc-social-card">${logoHtml}<p class="sc-social-copy">${escapeHtml(c.desc)}</p><a class="sc-social-btn" href="${escapeHtml(c.btnHref)}" target="_blank" rel="noopener">${escapeHtml(c.btnText.toUpperCase())}</a></article>`;
		})
		.join('');
}

function hydrateGenericFaq() {
	const FAQ_ICON_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
	const FAQ_ICON_CLOSED = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 8V16M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

	const escapeHtml = (s) =>
		(s || '').replace(/[&<>"']/g, (ch) =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
		);

	document.querySelectorAll('section.sc-faq-section').forEach((section) => {
		// The about page has its own bespoke hydration via initAboutPage; skip there.
		if (section.closest('.sc-about-page-dynamic')) return;

		const tpl = section.querySelector('template.sc-faq-source');
		const list = section.querySelector('[data-faq-list]');
		if (!tpl || !tpl.content || !list) return;

		const holder = document.createElement('div');
		holder.appendChild(tpl.content.cloneNode(true));

		const pairs = [];

		// Pattern A: Ghost toggle cards
		holder.querySelectorAll('.kg-toggle-card, details.kg-toggle-card').forEach((card) => {
			const q = (card.querySelector('.kg-toggle-heading-text, summary, h3, h4')?.textContent || '').trim();
			const aEl = card.querySelector('.kg-toggle-content, .kg-toggle-card-content');
			const a = aEl ? aEl.innerHTML.trim() : '';
			if (q && a) pairs.push({ q, a });
		});

		// Pattern B: heading (h2/h3/h4) followed by paragraph(s) until next heading
		if (!pairs.length) {
			const headings = [...holder.querySelectorAll('h2, h3, h4')];
			headings.forEach((h) => {
				const q = (h.textContent || '').trim();
				if (!q) return;
				const buf = [];
				let next = h.nextElementSibling;
				while (next) {
					if (/^H[1-6]$/.test(next.tagName)) break;
					if (['P', 'UL', 'OL'].includes(next.tagName)) {
						buf.push(next.outerHTML.trim());
					}
					next = next.nextElementSibling;
				}
				if (buf.length) pairs.push({ q, a: buf.join('') });
			});
		}

		if (!pairs.length) return;

		list.innerHTML = pairs
			.map((pair, idx) => {
				const isOpen = idx === 0;
				return (
					'<article class="sc-about-faq-item' +
					(isOpen ? ' is-open' : '') +
					'" data-faq-item>' +
					'<button class="sc-about-faq-trigger" type="button" aria-expanded="' +
					(isOpen ? 'true' : 'false') +
					'">' +
					'<span class="sc-about-faq-question">' +
					escapeHtml(pair.q) +
					'</span>' +
					'<span class="sc-about-faq-icon sc-about-faq-icon-closed" aria-hidden="true">' +
					FAQ_ICON_CLOSED +
					'</span>' +
					'<span class="sc-about-faq-icon sc-about-faq-icon-open" aria-hidden="true">' +
					FAQ_ICON_OPEN +
					'</span>' +
					'</button>' +
					'<div class="sc-about-faq-answer-wrap" data-faq-answer-wrap>' +
					'<div class="sc-about-faq-answer">' +
					pair.a +
					'</div>' +
					'</div>' +
					'</article>'
				);
			})
			.join('');

		// Notify the existing accordion script to re-sync heights.
		list.dispatchEvent(new Event('sc-faq-rebuilt'));
	});
}

function initCryptoJobsChipFilter() {
	document.querySelectorAll('.sc-jobs').forEach((section) => {
		const chips = [...section.querySelectorAll('.sc-jobs-chip[data-job-chip]')];
		const cards = [...section.querySelectorAll('[data-job-slugs]')];
		if (!chips.length || !cards.length) return;

		const apply = (filter) => {
			cards.forEach((card) => {
				if (filter === 'all') {
					card.style.display = '';
					return;
				}
				const slugs = (card.getAttribute('data-job-slugs') || '').toLowerCase();
				card.style.display = slugs.indexOf(filter.toLowerCase()) > -1 ? '' : 'none';
			});
		};

		chips.forEach((chip) => {
			chip.addEventListener('click', () => {
				chips.forEach((c) => {
					c.classList.remove('is-active');
					c.setAttribute('aria-selected', 'false');
				});
				chip.classList.add('is-active');
				chip.setAttribute('aria-selected', 'true');
				apply(chip.getAttribute('data-job-chip') || 'all');
			});
		});
	});
}

function filterAuthorTagsFromMoreNews() {
	document.querySelectorAll('.sc-mn-card').forEach((card) => {
		const author = (card.querySelector('.sc-mn-card-author')?.textContent || '').trim().toLowerCase();
		if (!author) return;
		card.querySelectorAll('.sc-mn-card-tag').forEach((tag) => {
			const text = (tag.textContent || '').trim().toLowerCase();
			if (text && text === author) tag.remove();
		});
	});

	// Also collect all author names site-wide and filter them out of any tag chip on more-news cards.
	const authorNames = new Set();
	document.querySelectorAll('.sc-mn-card-author').forEach((el) => {
		const name = (el.textContent || '').trim().toLowerCase();
		if (name) authorNames.add(name);
	});
	if (!authorNames.size) return;
	document.querySelectorAll('.sc-mn-card .sc-mn-card-tag').forEach((tag) => {
		const text = (tag.textContent || '').trim().toLowerCase();
		if (text && authorNames.has(text)) tag.remove();
	});
}

/* ====================================================================
   Global Search — corpus + header autocomplete + /search/ results page
   ==================================================================== */

function readSearchCorpus() {
	const root = document.getElementById('sc-search-corpus');
	if (!root) return [];
	return [...root.querySelectorAll('template.sc-search-doc')].map((tpl) => {
		const title = (tpl.getAttribute('data-title') || '').trim();
		const url = tpl.getAttribute('data-url') || '';
		const type = tpl.getAttribute('data-type') || 'post';
		const tags = (tpl.getAttribute('data-tags') || '').toLowerCase().split(/\s+/).filter(Boolean);
		const primary = (tpl.getAttribute('data-primary') || '').toLowerCase();
		const published = parseInt(tpl.getAttribute('data-published') || '0', 10) || 0;
		const excerpt = (tpl.content && tpl.content.textContent ? tpl.content.textContent : '').trim();
		return { type, title, url, tags, primary, excerpt, published };
	});
}

function categorizeSearchDoc(doc) {
	const tagSet = new Set(doc.tags);
	if (tagSet.has('jobs') || tagSet.has('job') || tagSet.has('hash-jobs') || tagSet.has('hash-job')) return 'jobs';
	if (tagSet.has('events') || tagSet.has('event') || tagSet.has('hash-events') || tagSet.has('hash-event')) return 'events';
	if (tagSet.has('people') || tagSet.has('company') || tagSet.has('companies') || tagSet.has('product') || tagSet.has('products')) return 'directory';
	return 'articles';
}

function scoreSearchMatch(doc, query) {
	if (!query) return 0;
	const q = query.toLowerCase();
	const title = doc.title.toLowerCase();
	const excerpt = doc.excerpt.toLowerCase();
	let score = 0;
	if (title === q) score += 200;
	if (title.startsWith(q)) score += 100;
	if (title.includes(q)) score += 60;
	if (doc.tags.some((t) => t === q)) score += 40;
	if (doc.tags.some((t) => t.includes(q))) score += 15;
	if (excerpt.includes(q)) score += 10;
	return score;
}

function searchCorpus(corpus, query, limit) {
	const q = (query || '').trim();
	if (!q) return [];
	return corpus
		.map((doc) => ({ doc, score: scoreSearchMatch(doc, q) }))
		.filter((r) => r.score > 0)
		.sort((a, b) => b.score - a.score || b.doc.published - a.doc.published)
		.slice(0, limit || 50)
		.map((r) => r.doc);
}

function initHeaderSearch() {
	const forms = document.querySelectorAll('[data-sc-header-search]');
	if (!forms.length) return;
	const corpus = readSearchCorpus();

	forms.forEach((form) => {
		const input = form.querySelector('[data-sc-search-input]');
		const resultsEl = form.querySelector('[data-sc-search-results]');
		if (!input || !resultsEl) return;

		const close = () => {
			resultsEl.hidden = true;
			resultsEl.innerHTML = '';
		};
		const render = (matches) => {
			if (!matches.length) {
				resultsEl.innerHTML = '<li class="sc-header-search-empty">No matches</li>';
				resultsEl.hidden = false;
				return;
			}
			resultsEl.innerHTML = matches
				.map((doc) => {
					const cat = categorizeSearchDoc(doc);
					return `<li class="sc-header-search-item" role="option">
						<a class="sc-header-search-link" href="${doc.url}">
							<span class="sc-header-search-cat">${cat}</span>
							<span class="sc-header-search-title">${doc.title.replace(/</g, '&lt;')}</span>
						</a>
					</li>`;
				})
				.join('');
			resultsEl.hidden = false;
		};

		let timer;
		input.addEventListener('input', () => {
			clearTimeout(timer);
			const q = input.value.trim();
			if (q.length < 2) { close(); return; }
			timer = setTimeout(() => render(searchCorpus(corpus, q, 6)), 80);
		});

		input.addEventListener('focus', () => {
			const q = input.value.trim();
			if (q.length >= 2) render(searchCorpus(corpus, q, 6));
		});

		document.addEventListener('click', (e) => {
			if (!form.contains(e.target)) close();
		});

		input.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') { close(); input.blur(); }
		});
	});
}

function initSearchResultsPage() {
	const page = document.querySelector('.sc-search-page');
	if (!page) return;

	const params = new URLSearchParams(window.location.search);
	const initialQ = (params.get('q') || '').trim();

	const input = page.querySelector('[data-sc-results-input]');
	const summaryEl = page.querySelector('[data-sc-results-summary]');
	const zeroEl = page.querySelector('[data-sc-results-zero]');
	const zeroQEl = page.querySelector('[data-sc-results-zero-q]');
	const sortEl = page.querySelector('[data-sc-results-sort]');
	const tabs = [...page.querySelectorAll('.sc-search-tab')];
	const panels = [...page.querySelectorAll('.sc-search-panel')];
	const lists = {
		articles: page.querySelector('[data-sc-list="articles"]'),
		directory: page.querySelector('[data-sc-list="directory"]'),
		jobs: page.querySelector('[data-sc-list="jobs"]'),
		events: page.querySelector('[data-sc-list="events"]')
	};
	const empties = {
		articles: page.querySelector('[data-sc-empty="articles"]'),
		directory: page.querySelector('[data-sc-empty="directory"]'),
		jobs: page.querySelector('[data-sc-empty="jobs"]'),
		events: page.querySelector('[data-sc-empty="events"]')
	};
	const counts = {
		articles: page.querySelector('[data-sc-tab-count="articles"]'),
		directory: page.querySelector('[data-sc-tab-count="directory"]'),
		jobs: page.querySelector('[data-sc-tab-count="jobs"]'),
		events: page.querySelector('[data-sc-tab-count="events"]')
	};

	if (input && initialQ) input.value = initialQ;

	const corpus = readSearchCorpus();

	const renderItem = (doc) => {
		const safeTitle = doc.title.replace(/</g, '&lt;');
		const safeExcerpt = (doc.excerpt || '').replace(/</g, '&lt;');
		const cat = categorizeSearchDoc(doc);
		return `<li class="sc-search-result">
			<a class="sc-search-result-link" href="${doc.url}">
				<span class="sc-search-result-cat">${cat}</span>
				<h3 class="sc-search-result-title">${safeTitle}</h3>
				${safeExcerpt ? `<p class="sc-search-result-excerpt">${safeExcerpt}</p>` : ''}
			</a>
		</li>`;
	};

	const apply = () => {
		const q = (input?.value || '').trim();
		const buckets = { articles: [], directory: [], jobs: [], events: [] };

		if (q) {
			const matches = searchCorpus(corpus, q, 200);
			matches.forEach((doc) => {
				const cat = categorizeSearchDoc(doc);
				buckets[cat].push(doc);
			});
		} else {
			// No query → show recent items across each category so the page never looks empty.
			const recent = [...corpus].sort((a, b) => b.published - a.published);
			recent.forEach((doc) => {
				const cat = categorizeSearchDoc(doc);
				if (buckets[cat].length < 12) buckets[cat].push(doc);
			});
		}

		if (sortEl && sortEl.value === 'newest') {
			Object.keys(buckets).forEach((k) => buckets[k].sort((a, b) => b.published - a.published));
		}

		Object.keys(buckets).forEach((k) => {
			if (counts[k]) counts[k].textContent = String(buckets[k].length);
			if (lists[k]) lists[k].innerHTML = buckets[k].map(renderItem).join('');
			if (empties[k]) empties[k].hidden = buckets[k].length !== 0;
		});

		const total = buckets.articles.length + buckets.directory.length + buckets.jobs.length + buckets.events.length;
		if (summaryEl) {
			if (!q) summaryEl.textContent = 'Showing recent content. Start typing to search.';
			else summaryEl.textContent = total + ' result' + (total === 1 ? '' : 's') + ' for "' + q + '"';
		}
		if (zeroEl) {
			zeroEl.hidden = !(q && total === 0);
			if (zeroQEl) zeroQEl.textContent = q;
		}
	};

	tabs.forEach((tab) => {
		tab.addEventListener('click', () => {
			const target = tab.getAttribute('data-search-tab');
			tabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
			panels.forEach((p) => p.classList.remove('is-active'));
			tab.classList.add('is-active');
			tab.setAttribute('aria-selected', 'true');
			const panel = page.querySelector(`[data-search-panel="${target}"]`);
			if (panel) panel.classList.add('is-active');
		});
	});

	if (input) {
		input.addEventListener('input', () => {
			clearTimeout(input._t);
			input._t = setTimeout(apply, 100);
		});
		// Auto-focus so visitors can start typing immediately.
		try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
	}
	if (sortEl) sortEl.addEventListener('change', apply);

	apply();
}

function hydrateAdvertisingHero() {
	const h1 = document.querySelector('.sc-adv-hero [data-sc-adv-hero-h1]');
	const tpl = document.querySelector('template.sc-adv-source');
	if (!h1 || !tpl || !tpl.content) return;

	const holder = document.createElement('div');
	holder.appendChild(tpl.content.cloneNode(true));

	const heading = holder.querySelector('h1, h2, h3');
	if (heading) {
		const headingText = (heading.textContent || '').trim();
		if (headingText) h1.textContent = headingText;
	}
}

function hydrateBestExchangesWidget() {
	const widget = document.querySelector('.sc-mn-widget--exchanges');
	if (!widget) return;
	const tpl = widget.querySelector('template.sc-mn-exchanges-source');
	if (!tpl || !tpl.content) return;
	const list = widget.querySelector('.sc-mn-exchanges');
	if (!list) return;

	const holder = document.createElement('div');
	holder.appendChild(tpl.content.cloneNode(true));

	const ctaCards = [...holder.querySelectorAll('.kg-cta-card')];
	const productCards = [...holder.querySelectorAll('.kg-product-card')];

	const fromProduct = productCards.map((card) => {
		const title = (card.querySelector('.kg-product-card-title')?.textContent || '').trim();
		const img = card.querySelector('.kg-product-card-image, img');
		const imgSrc = img?.getAttribute('src') || '';
		const imgAlt = img?.getAttribute('alt') || title;
		const btn = card.querySelector('.kg-product-card-button');
		const btnHref = btn?.getAttribute('href') || '#';
		return { title, imgSrc, imgAlt, btnHref };
	});

	const fromCta = ctaCards.map((card) => {
		const title = (card.querySelector('.kg-cta-text')?.textContent || '').trim();
		const img = card.querySelector('.kg-cta-image-container img, img');
		const imgSrc = img?.getAttribute('src') || '';
		const imgAlt = img?.getAttribute('alt') || title;
		const btn = card.querySelector('a.kg-cta-button');
		const imgLink = card.querySelector('.kg-cta-image-container a');
		const btnHref = btn?.getAttribute('href') || imgLink?.getAttribute('href') || '#';
		return { title, imgSrc, imgAlt, btnHref };
	});

	const cards = [...fromProduct, ...fromCta].filter((c) => c.title);

	if (!cards.length) return;

	const escapeHtml = (s) =>
		(s || '').replace(/[&<>"']/g, (ch) =>
			({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
		);

	const arrowSvg =
		'<svg class="sc-mn-exchange-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F9992A" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

	list.innerHTML = cards
		.map((c) => {
			const slug = c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
			const iconHtml = c.imgSrc
				? `<img src="${escapeHtml(c.imgSrc)}" alt="${escapeHtml(c.imgAlt)}" loading="lazy" />`
				: '';
			return `<a class="sc-mn-exchange-item" href="${escapeHtml(c.btnHref)}" target="_blank" rel="noopener">
				<div class="sc-mn-exchange-icon sc-mn-exchange-icon--${slug}">${iconHtml}</div>
				<span class="sc-mn-exchange-name">${escapeHtml(c.title)}</span>
				${arrowSvg}
			</a>`;
		})
		.join('');
}

function normalizeLocaleLabels() {
	const localeMap = {
		en: 'English',
		it: 'Italiano',
		es: 'Espanol',
		fr: 'Francais',
		de: 'Deutsch',
		ko: 'Korean',
		ru: 'Russian',
		zh: 'Chinese',
		ja: 'Japanese'
	};

	const localeNodes = Array.from(document.querySelectorAll('[data-locale-label]'));
	if (!localeNodes.length) return;

	localeNodes.forEach((node) => {
		const rawCode = (node.getAttribute('data-locale-code') || node.textContent || '').trim();
		if (!rawCode) return;

		const normalizedCode = rawCode.toLowerCase().split(/[-_]/)[0];
		node.textContent = localeMap[normalizedCode] || rawCode;
	});
}

function accentAboutHeroLastWord() {
	const titles = Array.from(document.querySelectorAll('.sc-about-hero-copy h1'));
	if (!titles.length) return;

	titles.forEach((title) => {
		if (title.querySelector('.sc-about-hero-last-word')) return;

		const existingSpans = title.querySelectorAll('span');
		if (existingSpans.length) {
			existingSpans[existingSpans.length - 1].classList.add('sc-about-hero-last-word');
			return;
		}

		const rawText = (title.textContent || '').trim().replace(/\s+/g, ' ');
		if (!rawText) return;

		const splitAt = rawText.lastIndexOf(' ');
		if (splitAt <= 0) return;

		const leadText = rawText.slice(0, splitAt);
		const lastWord = rawText.slice(splitAt + 1);

		title.textContent = '';
		title.append(document.createTextNode(`${leadText} `));

		const accentSpan = document.createElement('span');
		accentSpan.className = 'sc-about-hero-last-word';
		accentSpan.textContent = lastWord;
		title.append(accentSpan);
	});
}

function accentLastWord(selector, className) {
	const elements = Array.from(document.querySelectorAll(selector));
	if (!elements.length) return;

	elements.forEach((el) => {
		if (el.querySelector(`.${className}`)) return;

		const existingSpans = el.querySelectorAll('span');
		if (existingSpans.length) {
			existingSpans[existingSpans.length - 1].classList.add(className);
			return;
		}

		const rawText = (el.textContent || '').trim().replace(/\s+/g, ' ');
		if (!rawText) return;

		const splitAt = rawText.lastIndexOf(' ');
		if (splitAt <= 0) return;

		const leadText = rawText.slice(0, splitAt);
		const lastWord = rawText.slice(splitAt + 1);

		el.textContent = '';
		el.append(document.createTextNode(`${leadText} `));

		const accentSpan = document.createElement('span');
		accentSpan.className = className;
		accentSpan.textContent = lastWord;
		el.append(accentSpan);
	});
}

function accentLastHalf(selector, className) {
	const elements = Array.from(document.querySelectorAll(selector));
	if (!elements.length) return;

	elements.forEach((el) => {
		if (el.querySelector(`.${className}`)) return;

		const rawText = (el.textContent || '').trim().replace(/\s+/g, ' ');
		if (!rawText) return;

		const words = rawText.split(' ');
		if (words.length < 2) return;

		const accentCount = Math.max(1, Math.ceil(words.length / 2));
		const splitIdx = words.length - accentCount;
		const leadText = words.slice(0, splitIdx).join(' ');
		const accentText = words.slice(splitIdx).join(' ');

		el.textContent = '';
		el.append(document.createTextNode(`${leadText} `));

		const accentSpan = document.createElement('span');
		accentSpan.className = className;
		accentSpan.textContent = accentText;
		el.append(accentSpan);
	});
}

function initImprintTitleSync() {
	const titleEl = document.querySelector('.sc-imprint-page .sc-imprint-title');
	const cms = document.querySelector('.sc-imprint-page .sc-imprint-cms-content');
	if (!titleEl || !cms) return;

	const firstHeading = cms.querySelector('h1, h2, h3');
	if (!firstHeading) return;

	const headingText = (firstHeading.textContent || '').trim();
	if (!headingText) return;

	titleEl.textContent = headingText;
	firstHeading.remove();
}

function initAdvertisingDynamicContent() {
	const article = document.querySelector('.custom-advertising-template .sc-advertising-article');
	const cms = document.querySelector('.custom-advertising-template .sc-advertising-cms.gh-post-content');
	if (!article || !cms) return;

	const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim();
	const headingsMatch = (a, b) => {
		const na = normalize(a);
		const nb = normalize(b);
		if (!na || !nb) return false;
		return na === nb || `${na}s` === nb || `${nb}s` === na;
	};

	const dynamicH2s = Array.from(cms.querySelectorAll('h2'));

	const staticSections = Array.from(article.querySelectorAll('.sc-advertising-section, .sc-advertising-packages-shell'));

	staticSections.forEach((section) => {
		const heading = section.querySelector('.sc-advertising-h2, .sc-advertising-h1');
		if (!heading) return;

		const dynH2 = dynamicH2s.find((h) => headingsMatch(h.textContent, heading.textContent));
		if (!dynH2) return;

		let next = dynH2.nextElementSibling;
		while (next && !['P', 'H2', 'H3', 'UL', 'OL'].includes(next.tagName)) {
			next = next.nextElementSibling;
		}
		if (!next || next.tagName !== 'P') return;

		const dynamicText = (next.textContent || '').trim();
		if (!dynamicText) return;

		const descSlot = section.querySelector('.sc-advertising-muted, .sc-advertising-lede, .sc-advertising-price-desc');
		if (descSlot) descSlot.textContent = dynamicText;
	});

	cms.style.display = 'none';
}

function initImprintOwnerSync() {
	const card = document.querySelector('.sc-imprint-page .sc-imprint-owner-card');
	const cms = document.querySelector('.sc-imprint-page .sc-imprint-cms-content');
	if (!card || !cms) return;

	const nameEl = card.querySelector('.sc-imprint-owner-copy h3');
	const descEl = card.querySelector('.sc-imprint-owner-copy p');
	const emailLink = card.querySelector('.sc-imprint-owner-meta li:nth-child(1) a');
	const addressEl = card.querySelector('.sc-imprint-owner-meta li:nth-child(2) span, .sc-imprint-owner-meta li:nth-child(2) a');

	const targetP = Array.from(cms.querySelectorAll('p')).find((p) => {
		const text = p.textContent || '';
		return /e-?mail\s*[:：]/i.test(text) || /address\s*[:：]/i.test(text) || /indirizzo\s*[:：]/i.test(text);
	});
	if (!targetP) return;

	const lines = targetP.innerHTML.split(/<br\s*\/?>/i);
	const remainingLines = [];
	let nameAssigned = false;
	let descAssigned = false;

	lines.forEach((lineHtml) => {
		const tmp = document.createElement('div');
		tmp.innerHTML = lineHtml;
		const lineText = (tmp.textContent || '').trim();
		if (!lineText) return;

		const emailMatch = lineText.match(/^e-?mail\s*[:：]\s*(.+)$/i);
		const addressMatch = lineText.match(/^(?:address|indirizzo)\s*[:：]\s*(.+)$/i);

		if (emailMatch && emailLink) {
			const value = emailMatch[1].trim();
			emailLink.textContent = value;
			if (value.includes('@')) emailLink.href = `mailto:${value}`;
			return;
		}
		if (addressMatch && addressEl) {
			addressEl.textContent = addressMatch[1].trim();
			return;
		}
		if (!nameAssigned && nameEl) {
			nameEl.textContent = lineText;
			nameAssigned = true;
			return;
		}
		if (!descAssigned && descEl) {
			descEl.textContent = lineText;
			descAssigned = true;
			return;
		}
		remainingLines.push(lineHtml.trim());
	});

	if (remainingLines.length) {
		targetP.innerHTML = remainingLines.join('<br>');
	} else {
		targetP.remove();
	}
}

function initMoreNewsLoadMore() {
	const cardsPerPage = 3;
	const mobileMq = window.matchMedia('(max-width: 767px)');
	const sections = Array.from(document.querySelectorAll('.sc-mn-main'));
	if (!sections.length) return;

	const syncState = () => {
		sections.forEach((section) => {
			const grid = section.querySelector('.sc-mn-grid');
			const button = section.querySelector('.sc-mn-load-more');
			if (!grid || !button) return;

			const cards = grid.querySelectorAll('.sc-mn-card');
			const hasMoreThanInitial = cards.length > cardsPerPage;

			if (!mobileMq.matches || !hasMoreThanInitial) {
				grid.classList.remove('sc-mn-grid--collapsed', 'sc-mn-grid--expanded');
				button.classList.add('is-hidden');
				return;
			}

			if (!grid.classList.contains('sc-mn-grid--expanded')) {
				grid.classList.add('sc-mn-grid--collapsed');
				button.classList.remove('is-hidden');
			}
		});
	};

	sections.forEach((section) => {
		const grid = section.querySelector('.sc-mn-grid');
		const button = section.querySelector('.sc-mn-load-more');
		if (!grid || !button || button.dataset.scBound === 'true') return;

		button.dataset.scBound = 'true';
		button.addEventListener('click', () => {
			grid.classList.remove('sc-mn-grid--collapsed');
			grid.classList.add('sc-mn-grid--expanded');
			button.classList.add('is-hidden');
		});
	});

	syncState();
	window.addEventListener('resize', syncState);
}

function initJobsLoadMore() {
	const cardsPerPage = 3;
	const mobileMq = window.matchMedia('(max-width: 767px)');
	const sections = Array.from(document.querySelectorAll('.sc-jobs-inner'));
	if (!sections.length) return;

	const syncState = () => {
		sections.forEach((section) => {
			const grid = section.querySelector('.sc-jobs-grid');
			const button = section.querySelector('.sc-jobs-load-more-btn');
			if (!grid || !button) return;

			const cards = grid.querySelectorAll('.sc-job-card');
			const hasMoreThanInitial = cards.length > cardsPerPage;

			if (!mobileMq.matches || !hasMoreThanInitial) {
				grid.classList.remove('sc-jobs-grid--collapsed', 'sc-jobs-grid--expanded');
				button.classList.add('is-hidden');
				return;
			}

			if (!grid.classList.contains('sc-jobs-grid--expanded')) {
				grid.classList.add('sc-jobs-grid--collapsed');
				button.classList.remove('is-hidden');
			}
		});
	};

	sections.forEach((section) => {
		const grid = section.querySelector('.sc-jobs-grid');
		const button = section.querySelector('.sc-jobs-load-more-btn');
		if (!grid || !button || button.dataset.scBound === 'true') return;

		button.dataset.scBound = 'true';
		button.addEventListener('click', () => {
			grid.classList.remove('sc-jobs-grid--collapsed');
			grid.classList.add('sc-jobs-grid--expanded');
			button.classList.add('is-hidden');
		});
	});

	syncState();
	window.addEventListener('resize', syncState);
}

showSubNav();
//createPopUp();

insertWidget();

toggleDarkMode(changeTwitterCardTheme);
initSliders();
loadMore();
hideHeader();
changeHeaderTransparency();
scrollTop();
copyToClipboard();
togglePlan();
calcHeight();
initMobileMenu();
toggleAccordion();
footerExternalLinks();
vibrator();
initMarketDashboard();
normalizeEventMeta();
initAdvertisingToc();
initAdvertisingCountriesFromPage();
initPressReleasesListing();
initEventsListing();
initPostPressReleasePage();
initPostJobPage();
initJobMetaFromPostBody();
initPeoplePostPage();
initCompanyPostPage();
initProductPostPage();
initCryptoPricesPage();
normalizeLocaleLabels();
accentAboutHeroLastWord();
accentLastWord('.sc-about-operate-head h2', 'sc-about-operate-last-word');
accentLastWord('.sc-about-revenue-head h2', 'sc-about-revenue-last-word');
accentLastWord('.sc-about-team-head h3', 'sc-about-team-last-word');
initImprintTitleSync();
initImprintOwnerSync();
initAdvertisingDynamicContent();
hydrateSocialChannels();
hydrateBestExchangesWidget();
hydrateAdvertisingHero();
hydrateGenericFaq();
initCryptoJobsChipFilter();
filterAuthorTagsFromMoreNews();
initHeaderSearch();
initSearchResultsPage();
accentLastHalf('.sc-contact-hero-inner h1', 'sc-contact-hero-last-word');
accentLastHalf('.sc-imprint-title', 'sc-imprint-title-accent');
initAboutPage();
initMoreNewsLoadMore();
initJobsLoadMore();

// GhostFlow MH
moveWidget();

window.addEventListener('load', changeTwitterCardTheme);
window.addEventListener('load', scrollTopAlign);


// document.addEventListener('DOMContentLoaded', createPopUp);
