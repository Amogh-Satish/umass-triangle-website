import { initLayout, refreshAnimations, tilt } from './common.js?v=20261001h';

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

// Member bio modal. Built on <dialog> so focus trapping, Escape and the backdrop
// come from the platform rather than hand-rolled JS.
const modal = document.getElementById('member-modal');

if (modal && typeof modal.showModal === 'function') {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let lastFocused = null;

  const open = (card) => {
    const li = card.closest('.member');
    const detail = li.querySelector('.member-detail');
    const photo = card.querySelector('.member-photo img');
    const name = card.querySelector('.member-name').textContent;
    const year = card.querySelector('small').textContent;
    const major = detail.querySelector('.md-major')?.textContent.trim() || '';

    document.getElementById('mm-photo').src = photo.getAttribute('src');
    // alt stays empty on purpose: the name is the adjacent heading and the dialog
    // is already labelled by it, so alt text here would announce it twice.
    document.getElementById('mm-photo').alt = '';
    document.getElementById('mm-name').textContent = name;
    // "'29" -> "Class of 2029". A placeholder like "['YY]" has no digits to expand,
    // so it's left as written rather than becoming "Class of 20YY".
    const yr = year.replace(/[\[\]']/g, '').trim();
    const classOf = /^\d{2}$/.test(yr) ? `Class of 20${yr}` : `Class of ${yr}`;
    // Only join with a separator when both halves exist, so a missing major
    // doesn't leave a stray bullet.
    document.getElementById('mm-meta').textContent = [major, classOf].filter(Boolean).join(' · ');
    document.getElementById('mm-bio').textContent = detail.querySelector('.md-bio')?.textContent.trim() || '';

    const links = document.getElementById('mm-links');
    links.innerHTML = '';
    for (const [cls, icon, label] of [['.md-linkedin', 'bi-linkedin', 'LinkedIn'],
                                      ['.md-instagram', 'bi-instagram', 'Instagram']]) {
      const src = detail.querySelector(cls);
      if (!src || !src.getAttribute('href')) continue;
      const a = document.createElement('a');
      a.className = 'mm-link';
      a.href = src.getAttribute('href');
      a.target = '_blank';
      a.rel = 'noopener';
      // The source <a>'s text is the chip label when it has one, so a member can
      // show a handle instead of the network name. Falls back to the default.
      const text = src.textContent.trim() || label;
      a.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i><span></span>`;
      a.querySelector('span').textContent = text;
      a.setAttribute('aria-label', `${label}: ${text}`);
      links.appendChild(a);
    }
    links.hidden = !links.children.length;

    lastFocused = card;
    modal.showModal();
    // next frame, so the transition has a start state to animate from
    requestAnimationFrame(() => modal.classList.add('is-open'));
  };

  const close = () => {
    modal.classList.remove('is-open');
    if (reduceMotion.matches) { modal.close(); return; }
    // wait out the transition so the card doesn't vanish mid-animation
    let done = false;
    const finish = () => { if (!done) { done = true; modal.close(); } };
    modal.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 320);   // fallback if transitionend never fires
  };

  document.querySelectorAll('.member-card').forEach((card) =>
    card.addEventListener('click', () => open(card)));

  document.getElementById('mm-close').addEventListener('click', close);
  // click outside the card body
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  // Esc fires dialog's own cancel; intercept so it animates out too
  modal.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  modal.addEventListener('close', () => { lastFocused?.focus(); lastFocused = null; });
}

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
