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

// import { createPopUp } from './languagePopUp';

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

// GhostFlow MH
moveWidget();

window.addEventListener('load', changeTwitterCardTheme);
window.addEventListener('load', scrollTopAlign);


// document.addEventListener('DOMContentLoaded', createPopUp);
