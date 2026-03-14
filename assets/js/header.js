const hideHeader = () => {
  const header = document.querySelector('#gh-header');
  let lastScrollTop = 0;

  const headerScrollHandler = () => {
    const scrollTop = window.scrollY;
    if (scrollTop > 200) {
      if (scrollTop > lastScrollTop) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
    }
    lastScrollTop = scrollTop;
  };

  window.addEventListener('scroll', headerScrollHandler);
};

const showSubNav = () => {
  const subNavIcon = document.querySelector('.gh-subnav-icon');
  const subNavItems = document.querySelectorAll('.gh-subnav-item');

  if (subNavItems.length) {
    subNavIcon.classList.add('show');
  }
};

const changeHeaderTransparency = () => {
  const noHoversScreenWidthInPx = 900;
  const transparentHeader = document.querySelector('.gh-header.transparent');

  if (transparentHeader) {
    const transparentHeaderScrollHandler = () => {
      const scrollTop = window.scrollY;

      if (scrollTop > 20) {
        transparentHeader.classList.remove('transparent');
      } else {
        // Checking if mouse is hovering header
        if (!transparentHeader.classList.contains('mouseon')) {
          transparentHeader.classList.add('transparent');
        }
      }
    };

    const removeTransparency = () => {
      transparentHeader.classList.remove('transparent');
      transparentHeader.classList.add('mouseon');
    };

    const addTransparency = () => {
      const scrollTop = window.scrollY;

      if (scrollTop <= 200) {
        transparentHeader.classList.add('transparent');
      }

      transparentHeader.classList.remove('mouseon');
    };

    const addMouseListeners = () => {
      transparentHeader.addEventListener('mouseenter', removeTransparency);
      transparentHeader.addEventListener('mouseleave', addTransparency);
    }

    const removeMouseListeners = () => {
      transparentHeader.removeEventListener('mouseenter', removeTransparency);
      transparentHeader.removeEventListener('mouseleave', addTransparency);
    }

    const transparencyMouseListenersHandler = () => {
      if (window.innerWidth <= noHoversScreenWidthInPx) {
        removeMouseListeners();
      } else {
        addMouseListeners();
      }
    };

    // transparencyMouseListenersHandler();

    window.addEventListener('resize', transparencyMouseListenersHandler);
    window.addEventListener('scroll', transparentHeaderScrollHandler);
  }
};

export { hideHeader, showSubNav, changeHeaderTransparency };
