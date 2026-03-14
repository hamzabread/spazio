const footerExternalLinks = () => {
  const footerLinks = document.querySelectorAll('.gh-footer-main a');
  footerLinks.forEach(link => {
    if (link.hostname !== window.location.hostname) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });
};

export { footerExternalLinks };
