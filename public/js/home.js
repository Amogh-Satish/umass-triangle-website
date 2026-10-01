import { initLayout, refreshAnimations, countUp, typeText, tilt } from './common.js?v=20261001e';

const introPlaying = initLayout();

// Hero: retype the tagline that is already in the HTML, then parallax the background.
typeText(document.getElementById('hero-tagline'), {
  delay: introPlaying ? 1900 : 500,
  caret: document.querySelector('#hero .caret'),
});

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const hero = document.getElementById('hero');
  const bg = document.getElementById('hero-bg');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (scrollY < hero.offsetHeight) bg.style.transform = `translate3d(0, ${scrollY * 0.35}px, 0)`;
      ticking = false;
    });
  }, { passive: true });
}

const stats = document.querySelectorAll('#stats .stat');
stats.forEach((s) => countUp(s.querySelector('.num')));
tilt(stats, 6);

window.GLightbox?.({ selector: '.glightbox', touchNavigation: true, loop: true, zoomable: true });
refreshAnimations();
