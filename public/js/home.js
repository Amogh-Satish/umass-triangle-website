import { initLayout, refreshAnimations, api, esc, countUp, typeText, tilt } from './common.js';

const site = await initLayout('home');
const introPlaying = !document.documentElement.classList.contains('intro-done');

// Hero: text + parallax background
const bg = document.getElementById('hero-bg');
bg.style.backgroundImage = `linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.6)), url("${site.heroImage}")`;
document.getElementById('hero-chapter').textContent = site.chapterName;
document.getElementById('hero-university').textContent = site.university;
typeText(document.getElementById('hero-tagline'), site.tagline, {
  delay: introPlaying ? 1700 : 500,
  caret: document.querySelector('#hero .caret'),
});

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const hero = document.getElementById('hero');
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

// Stats band (hidden when there are none)
const statsEl = document.getElementById('stats');
const stats = (site.stats || []).filter((s) => s.label);
if (stats.length) {
  statsEl.innerHTML = stats.map((s, i) => `
    <div class="stat" data-aos="fade-up" data-aos-delay="${i * 100}">
      <div class="num"></div><div class="lbl">${esc(s.label)}</div><div class="bar"></div>
    </div>`).join('');
  statsEl.querySelectorAll('.num').forEach((el, i) => countUp(el, stats[i].value));
  tilt(statsEl.querySelectorAll('.stat'), 6);
} else {
  statsEl.remove();
}

// Gallery with staggered reveal
const photos = await api('/api/gallery');
document.getElementById('gallery-grid').innerHTML = photos.map((p, i) => `
  <a class="gallery-item glightbox" href="${esc(p.src)}" data-title="${esc(p.caption)}" data-type="image"
     data-aos="fade-up" data-aos-delay="${(i % 4) * 90}">
    <img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy">
    <div class="overlay"><i class="bi bi-arrows-angle-expand"></i><span>${esc(p.caption)}</span></div>
  </a>`).join('');

window.GLightbox?.({ selector: '.glightbox', touchNavigation: true, loop: true, zoomable: true });
refreshAnimations();
