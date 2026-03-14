const toggleAccordion = () => {
  const toggleCards = document.querySelectorAll('.gh-post-content .kg-toggle-card');
  if(toggleCards && toggleCards.length > 0) {
    // Use MutationObserver to watch for changes in data-kg-toggle-state
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-kg-toggle-state') {
          const changedCard = mutation.target;
          const newState = changedCard.getAttribute('data-kg-toggle-state');
          
          // If a toggle was opened, close all other toggles
          if (newState === 'open') {
            toggleCards.forEach((otherCard) => {
              if (otherCard !== changedCard && otherCard.getAttribute('data-kg-toggle-state') === 'open') {
                otherCard.setAttribute('data-kg-toggle-state', 'close');
              }
            });
          }
        }
      });
    });

    // Start observing each toggle card for attribute changes
    toggleCards.forEach((card) => {
      observer.observe(card, { attributes: true, attributeFilter: ['data-kg-toggle-state'] });
    });
  }
};

export { toggleAccordion };
