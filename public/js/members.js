import { initLayout, refreshAnimations, api, esc, tilt } from './common.js';

const site = await initLayout('members');
document.getElementById('eboard-term').textContent = site.eboardTerm;

const [eboard, members] = await Promise.all([api('/api/eboard'), api('/api/members')]);

document.getElementById('eboard').innerHTML = eboard.map((m) => `
  <div class="swiper-slide">
    <div class="eboard-card">
      <img src="${esc(m.photo || '/placeholder/400/400.svg?label=Headshot')}" alt="${esc(m.name)}" loading="lazy">
      <h3>${esc(m.name)}</h3>
      <h4>${esc(m.position)}</h4>
    </div>
  </div>`).join('');

new window.Swiper('#eboard-swiper', {
  effect: 'coverflow',
  coverflowEffect: { rotate: 0, stretch: 0, depth: 140, modifier: 1, slideShadows: false },
  centeredSlides: true,
  grabCursor: true,
  loop: eboard.length > 3,
  speed: 700,
  autoplay: { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
  keyboard: { enabled: true },
  slidesPerView: 1.2,
  spaceBetween: 24,
  pagination: { el: '.swiper-pagination', clickable: true },
  breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
});
tilt(document.querySelectorAll('.eboard-card'));

const item = (m) => `<li>${esc(m.name)}${m.class_year ? ` <small>${esc(m.class_year)}</small>` : ''}${m.role ? `<br><small>${esc(m.role)}</small>` : ''}</li>`;
const chairs = members.filter((m) => m.role);
const actives = members.filter((m) => !m.role);
document.getElementById('member-list').dataset.aos = 'fade-up';
document.getElementById('member-list').innerHTML = `
  ${chairs.length ? `<h2>Chairholders</h2><ul>${chairs.map(item).join('')}</ul>` : ''}
  ${actives.length ? `<h2>Active Members</h2><ul>${actives.map(item).join('')}</ul>` : ''}`;
refreshAnimations();
