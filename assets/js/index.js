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
import { initPressReleasesListing } from './pressReleasesListing';
import { initEventsListing } from './eventsListing';
import { initPostPressReleasePage } from './postPressReleasePage';
import { initPostJobPage } from './postJobPage';
import { initPeoplePostPage } from './peoplePostPage';
import { initCompanyPostPage } from './companyPostPage';
import { initProductPostPage } from './productPostPage';
import { initCryptoPricesPage } from './cryptoPricesPage';

// import { createPopUp } from './languagePopUp';

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
initPressReleasesListing();
initEventsListing();
initPostPressReleasePage();
initPostJobPage();
initPeoplePostPage();
initCompanyPostPage();
initProductPostPage();
initCryptoPricesPage();
normalizeLocaleLabels();
accentAboutHeroLastWord();
accentLastWord('.sc-about-operate-head h2', 'sc-about-operate-last-word');
accentLastWord('.sc-about-revenue-head h2', 'sc-about-revenue-last-word');
accentLastWord('.sc-about-team-head h3', 'sc-about-team-last-word');
initMoreNewsLoadMore();
initJobsLoadMore();

// GhostFlow MH
moveWidget();

window.addEventListener('load', changeTwitterCardTheme);
window.addEventListener('load', scrollTopAlign);


// document.addEventListener('DOMContentLoaded', createPopUp);
