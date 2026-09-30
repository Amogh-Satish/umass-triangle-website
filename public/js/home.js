import { initLayout, refreshAnimations, api, esc } from './common.js';

const site = await initLayout('home');

const hero = document.getElementById('hero');
hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.6)), url("${site.heroImage}")`;
document.getElementById('hero-chapter').textContent = site.chapterName;
document.getElementById('hero-university').textContent = site.university;
document.getElementById('hero-tagline').textContent = site.tagline;

const photos = await api('/api/gallery');
document.getElementById('gallery-grid').innerHTML = photos.map((p) => `
  <a class="gallery-item glightbox" href="${esc(p.src)}" data-title="${esc(p.caption)}" data-type="image">
    <img src="${esc(p.src)}" alt="${esc(p.caption)}" loading="lazy">
    <div class="overlay"><i class="bi bi-arrows-angle-expand"></i><span>${esc(p.caption)}</span></div>
  </a>`).join('');

window.GLightbox?.({ selector: '.glightbox' });
refreshAnimations();
