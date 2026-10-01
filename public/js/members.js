import { initLayout, refreshAnimations, tilt } from './common.js?v=20260930a';

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
  // Swiper's a11y module rewrites the buttons' aria-label on init, so the wording
  // has to be given here rather than in the HTML.
  a11y: { prevSlideMessage: 'Previous member', nextSlideMessage: 'Next member' },
  breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
});
tilt(document.querySelectorAll('.eboard-card'));
refreshAnimations();
