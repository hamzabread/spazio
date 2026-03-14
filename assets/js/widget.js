

const insertWidget = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const widgetRoot = document.querySelector('#sidebar-custom-widget');

  if (widgetRoot) {
    const textInput = widgetRoot.textContent;
    widgetRoot.style.visibility = 'visible';
    widgetRoot.innerHTML = textInput;
  }
};
  


const moveWidget = () => {
  const widget = document.querySelector('#sidebar-custom-widget');
  if (!widget) return;

  let lastScrollTop = 0;
  let currentScrollTop = 0;

  const widgetScrollHandler = () => {
    currentScrollTop = window.scrollY;
    requestAnimationFrame(updateWidgetPosition);
  };

  const updateWidgetPosition = () => {
    const windowWidth = window.innerWidth;
    if (windowWidth > 1100) {
      if (currentScrollTop > 200) {
        if (currentScrollTop > lastScrollTop) {
          widget.classList.add('moved');
        } else {
          widget.classList.remove('moved');
        }
      }
      lastScrollTop = currentScrollTop;
    }
  };

  window.addEventListener('scroll', widgetScrollHandler);
};


export { insertWidget, moveWidget };