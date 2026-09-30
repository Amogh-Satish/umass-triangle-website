// Shared layout: header, footer, theme, preloader, scroll-top.
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function api(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json', ...opts.headers } : opts.headers,
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

// Treat "[...]" placeholder URLs as unset so we don't render broken links.
const realUrl = (u) => (u && !/^\[.*\]$/.test(u) ? u : '');

const NAV = [
  { id: 'home', href: '/', label: 'Home' },
  { id: 'members', href: '/members', label: 'Members' },
  { id: 'rush', href: '/rush', label: 'Rush' },
  { id: 'address', href: '/address', label: 'Presidential Address' },
];

export async function initLayout(active) {
  const site = await api('/api/site');

  const root = document.documentElement.style;
  if (site.theme?.accent) root.setProperty('--accent', site.theme.accent);
  if (site.theme?.background) root.setProperty('--bg', site.theme.background);
  if (site.theme?.surface) root.setProperty('--surface', site.theme.surface);

  document.title = active === 'home' ? site.siteTitle : `${NAV.find((n) => n.id === active)?.label ?? ''} · ${site.siteTitle}`;
  const icon = document.querySelector('link[rel=icon]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }));
  icon.href = site.logo;

  const s = site.social || {};
  const socials = [
    ['instagram', 'bi-instagram', realUrl(s.instagram)],
    ['facebook', 'bi-facebook', realUrl(s.facebook)],
    ['linkedin', 'bi-linkedin', realUrl(s.linkedin)],
    ['email', 'bi-envelope', realUrl(s.email) && `mailto:${s.email}`],
  ].filter(([, , url]) => url);

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="site-header" id="header">
      <a href="/" class="logo"><img src="${esc(site.logo)}" alt=""><h1>${esc(site.siteTitle)}</h1></a>
      <nav class="navbar" id="navbar">
        <ul class="navbar-links">
          ${NAV.map((n) => `<li><a href="${n.href}" class="${n.id === active ? 'active' : ''}">${n.label}</a></li>`).join('')}
        </ul>
      </nav>
      <div class="header-social">
        ${socials.map(([name, ic, url]) => `<a href="${esc(url)}" aria-label="${name}" target="_blank" rel="noopener"><i class="bi ${ic}"></i></a>`).join('')}
      </div>
      <button class="mobile-toggle" id="mobile-toggle" aria-label="Menu"><i class="bi bi-list"></i></button>
    </header>`);

  document.body.insertAdjacentHTML('beforeend', `
    <footer class="site-footer">
      <div>&copy; ${new Date().getFullYear()} <strong>${esc(site.siteTitle)}</strong>. All Rights Reserved</div>
      <div>${esc(site.footer?.credits || '')}</div>
    </footer>
    <a href="#" class="scroll-top" id="scroll-top" aria-label="Back to top"><i class="bi bi-arrow-up-short"></i></a>`);

  document.body.insertAdjacentHTML('afterbegin', '<div class="scroll-progress" id="scroll-progress"></div>');
  const header = document.getElementById('header');
  const top = document.getElementById('scroll-top');
  const progress = document.getElementById('scroll-progress');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 60);
    // hide the header while scrolling down, bring it back on any scroll up
    header.classList.toggle('hidden', y > 300 && y > lastY && !document.getElementById('navbar').classList.contains('open'));
    top.classList.toggle('show', y > 100);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const nav = document.getElementById('navbar');
  const toggle = document.getElementById('mobile-toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.innerHTML = `<i class="bi ${open ? 'bi-x' : 'bi-list'}"></i>`;
  });

  // Intro (home page only, once per browser session): the triangle draws (~1.1s),
  // lights up, then splits into its three sides and reveals the page.
  // The inline <head> script on index.html adds .no-intro/.intro-done on repeat visits.
  const html = document.documentElement;
  const pre = document.getElementById('preloader');
  const skipIntro = html.classList.contains('no-intro') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (skipIntro || !pre) {
    pre?.remove();
    html.classList.add('intro-done');
  } else {
    try { sessionStorage.setItem('introSeen', '1'); } catch {}
    const play = () => {
      setTimeout(() => pre.classList.add('lit'), 1100);
      setTimeout(() => { pre.classList.add('split'); html.classList.add('intro-done'); }, 1450);
      setTimeout(() => pre.remove(), 2600);
    };
    document.readyState === 'complete' ? play() : addEventListener('load', play);
  }

  window.AOS?.init({ duration: 900, easing: 'ease-in-out', once: true });
  return site;
}

// Call after injecting dynamic content so scroll animations re-measure positions.
export const refreshAnimations = () => window.AOS?.refreshHard();

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Subtle 3D tilt that follows the pointer, plus a glare highlight. Mouse/pen only.
export function tilt(els, max = 8) {
  if (reduceMotion()) return;
  for (const el of els) {
    el.dataset.tilt = '';
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(800px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateY(-4px)`;
      el.style.setProperty('--gx', `${x * 100}%`);
      el.style.setProperty('--gy', `${y * 100}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  }
}

// Counts a number up from 0 when it scrolls into view. Non-numeric values (e.g. "[XX]") show as-is.
export function countUp(el, text, duration = 1600) {
  const m = String(text).match(/^(\D*)([\d,]*\.?\d+)(.*)$/);
  if (!m || reduceMotion()) { el.textContent = text; return; }
  const [, pre, numStr, post] = m;
  const target = parseFloat(numStr.replace(/,/g, ''));
  const decimals = (numStr.split('.')[1] || '').length;
  const useCommas = numStr.includes(',');
  // Years like 1907 shouldn't get a thousands separator or count from 0.
  const from = /^(1[89]|20)\d\d$/.test(numStr) ? target - 40 : 0;
  const fmt = (v) => {
    const s = v.toFixed(decimals);
    return pre + (useCommas ? Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals }) : s) + post;
  };
  el.textContent = fmt(from);
  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    obs.disconnect();
    el.closest('.stat')?.classList.add('seen');
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      el.textContent = fmt(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.4 }).observe(el);
}

// Types text into an element one character at a time.
export function typeText(el, text, { delay = 0, speed = 38, caret } = {}) {
  if (reduceMotion()) { el.textContent = text; caret?.classList.add('gone'); return; }
  el.textContent = '';
  let i = 0;
  setTimeout(function tick() {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, speed);
    else setTimeout(() => caret?.classList.add('gone'), 1800);
  }, delay);
}
