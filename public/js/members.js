import { initLayout, refreshAnimations, tilt } from './common.js?v=20261001a';

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

// Member photos open in the same lightbox the home gallery uses. data-gallery
// groups them, so the arrows step from member to member.
window.GLightbox?.({ selector: '.member-photo', touchNavigation: true, loop: true, zoomable: true });

// Term picker. One option today; adding a term is one <li> in members.html.
const termBtn  = document.getElementById('term-button');
const termMenu = document.getElementById('term-menu');

if (termBtn && termMenu) {
  const options = [...termMenu.querySelectorAll('[role="option"]')];

  const setOpen = (open) => {
    termBtn.setAttribute('aria-expanded', String(open));
    termMenu.hidden = !open;
    if (open) (options.find((o) => o.getAttribute('aria-selected') === 'true') || options[0])?.focus();
  };

  const choose = (opt) => {
    options.forEach((o) => o.setAttribute('aria-selected', String(o === opt)));
    document.getElementById('term-current').textContent = opt.dataset.term;
    setOpen(false);
    termBtn.focus();
  };

  termBtn.addEventListener('click', () => setOpen(termMenu.hidden));

  options.forEach((opt) => {
    opt.addEventListener('click', () => choose(opt));
    opt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(opt); }
    });
  });

  // Escape closes, and so does a click anywhere outside the control.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !termMenu.hidden) { setOpen(false); termBtn.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!termMenu.hidden && !e.target.closest('.term-select')) setOpen(false);
  });
}
refreshAnimations();
