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

  const header = document.getElementById('header');
  const top = document.getElementById('scroll-top');
  const onScroll = () => {
    header.classList.toggle('scrolled', scrollY > 60);
    top.classList.toggle('show', scrollY > 100);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const nav = document.getElementById('navbar');
  const toggle = document.getElementById('mobile-toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.innerHTML = `<i class="bi ${open ? 'bi-x' : 'bi-list'}"></i>`;
  });

  // Triangle draws itself (~1.1s), then splits into its three sides, then the overlay fades.
  const hidePreloader = () => {
    const pre = document.getElementById('preloader');
    if (!pre) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return pre.classList.add('done');
    setTimeout(() => pre.classList.add('split'), 1150);
    setTimeout(() => pre.classList.add('done'), 1650);
  };
  document.readyState === 'complete' ? hidePreloader() : addEventListener('load', hidePreloader);

  window.AOS?.init({ duration: 900, easing: 'ease-in-out', once: true });
  return site;
}

// Call after injecting dynamic content so scroll animations re-measure positions.
export const refreshAnimations = () => window.AOS?.refreshHard();
