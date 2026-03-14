const initSwiper = ({ size, hasPagination, speed }) => {
  new Swiper(`.gh-${size}-slider`, {
    direction: 'horizontal',
    loop: true,
    slidesPerView: 1,
    speed: speed,
    parallax: true,
    autoplay: {
      delay: 4000,
    },
    pagination: hasPagination && {
      el: `.gh-${size}-slider-pagination`,
      clickable: true,
      bulletClass: `gh-${size}-slider-pagination-bullet`,
      bulletActiveClass: 'active',
      renderBullet: function (_, className) {
        return '<div class="' + className + '">' + '<span></span>' + '</div>';
      }
    },
    navigation: {
      nextEl: `.gh-${size}-slider-button-next`,
      prevEl: `.gh-${size}-slider-button-prev`
    }
  });
};

const initSliders = () => {
  if (document.querySelector('.gh-medium-slider')) {
    initSwiper({ size: 'medium', hasPagination: true, speed: 1000 });
  }

  if (document.querySelector('.gh-large-slider')) {
    initSwiper({ size: 'large', hasPagination: true, speed: 1100 });
  }

  if (document.querySelector('.gh-small-slider')) {
    initSwiper({ size: 'small', hasPagination: true, speed: 1000 });
  }

  if (document.querySelector('.gh-mini-slider')) {
    initSwiper({ size: 'mini', hasPagination: false, speed: 800 });
  }
};

export { initSliders };
