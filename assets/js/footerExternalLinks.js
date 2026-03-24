const footerExternalLinks = () => {
  const footerLinks = document.querySelectorAll('.gh-footer-main a');
  footerLinks.forEach(link => {
    if (link.hostname !== window.location.hostname) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });
};

const cleanupRefParams = () => {
  const domain = location.host.replace('www.', '');
  const links = document.querySelectorAll('.gh-post-content a, .sitelinks-link a, .gh-sidebar-crypto-platforms a');
  
  if (!document.body.classList.contains('tag-hash-glossary')) {
    links.forEach((link) => {
      let href = link.href;
      
      // Remove ref tracking params
      if (href.includes('?ref=www.spaziocrypto.com')) {
        href = href.replace('?ref=www.spaziocrypto.com', '');
      }
      if (href.includes('&ref=www.spaziocrypto.com')) {
        href = href.replace('&ref=www.spaziocrypto.com', '');
      }
      
      // Open external links in new tab
      if(!href.includes('www.spaziocrypto.com')){
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noreferrer noopener');
      }
      
      link.href = href;
    });
  }
};

export { footerExternalLinks, cleanupRefParams };
