import { initLayout, refreshAnimations, tilt } from './common.js';

initLayout();

const slides = document.querySelectorAll('#eboard .swiper-slide').length;
new window.Swiper('#eboard-swiper', {
  effect: 'coverflow',
  coverflowEffect: { rotate: 0, stretch: 0, depth: 140, modifier: 1, slideShadows: false },
  centeredSlides: true,
  grabCursor: true,
  loop: slides > 3,
  speed: 700,
  autoplay: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
  keyboard: { enabled: true },
  slidesPerView: 1.2,
  spaceBetween: 24,
  pagination: { el: '.swiper-pagination', clickable: true },
  navigation: { prevEl: '.swiper-button-prev', nextEl: '.swiper-button-next' },
  breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
});
tilt(document.querySelectorAll('.eboard-card'));
refreshAnimations();
