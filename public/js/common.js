// Shared behavior for the static site.
//
// Content lives in the HTML, not in JavaScript. This file only enhances what is
// already on the page: the header, the intro, scroll effects and the small
// animations. Every page is fully readable with JavaScript disabled.

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initLayout() {
  const header = document.getElementById('header');
  const top = document.getElementById('scroll-top');
  const progress = document.getElementById('scroll-progress');
  const nav = document.getElementById('navbar');

  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 60);
    // hide the header while scrolling down, bring it back on any scroll up
    header.classList.toggle('hidden', y > 300 && y > lastY && !nav.classList.contains('open'));
    top.classList.toggle('show', y > 100);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = document.getElementById('mobile-toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.innerHTML = `<i class="bi ${open ? 'bi-x' : 'bi-list'}"></i>`;
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Intro: the triangle draws (~1.1s), lights up, then splits into its three sides
  // and reveals the page. It runs on every load of a page that has the preloader
  // markup, which is the home page. Skipped only for prefers-reduced-motion.
  const html = document.documentElement;
  const pre = document.getElementById('preloader');
  const playIntro = Boolean(pre) && !reduceMotion();
  if (!playIntro) {
    pre?.remove();
    html.classList.add('intro-done');
  } else {
    const play = () => {
      setTimeout(() => pre.classList.add('lit'), 1100);
      setTimeout(() => { pre.classList.add('split'); html.classList.add('intro-done'); }, 1450);
      setTimeout(() => pre.remove(), 2600);
    };
    document.readyState === 'complete' ? play() : addEventListener('load', play);
  }

  window.AOS?.init({ duration: 900, easing: 'ease-in-out', once: true });

  // Lets callers time their own entrance animations against the intro.
  return playIntro;
}

// Call after injecting dynamic content so scroll animations re-measure positions.
export const refreshAnimations = () => window.AOS?.refreshHard();

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

// Counts a number up when the tile scrolls into view, and again every time it
// comes back -- scroll away and back and it replays, rather than firing once per
// page load. The final value is already in the HTML; this only animates toward
// it. Non-numeric values (e.g. "[XX]") stay as-is.
export function countUp(el, duration = 1600) {
  const text = el.textContent.trim();
  const m = text.match(/^(\D*)([\d,]*\.?\d+)(.*)$/);
  const stat = el.closest('.stat');

  // The underline bar draws off .seen, so it is toggled even when there is no
  // number to animate -- otherwise a placeholder tile, or any tile under
  // prefers-reduced-motion, renders without its rule.
  if (!m || reduceMotion()) {
    new IntersectionObserver(([entry]) => {
      stat?.classList.toggle('seen', entry.isIntersecting);
    }, { threshold: 0.4 }).observe(el);
    return;
  }

  const [, pre, numStr, post] = m;
  const target = parseFloat(numStr.replace(/,/g, ''));
  const decimals = (numStr.split('.')[1] || '').length;
  const useCommas = numStr.includes(',');
  // Years like 2025 shouldn't get a thousands separator or count from 0.
  const from = /^(1[89]|20)\d\d$/.test(numStr) ? target - 40 : 0;
  const fmt = (v) => {
    const s = v.toFixed(decimals);
    return pre + (useCommas ? Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals }) : s) + post;
  };

  let raf = 0;
  const run = () => {
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      el.textContent = fmt(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  el.textContent = fmt(from);
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      stat?.classList.add('seen');
      run();
    } else {
      // Rewind so the next pass starts from the beginning instead of snapping.
      cancelAnimationFrame(raf);
      stat?.classList.remove('seen');
      el.textContent = fmt(from);
    }
  }, { threshold: 0.4 }).observe(el);
}

// Retypes text that is already in the element, one character at a time.
export function typeText(el, { delay = 0, speed = 38, caret } = {}) {
  const text = el.textContent.trim();
  if (reduceMotion() || !text) { caret?.classList.add('gone'); return; }
  el.textContent = '';
  let i = 0;
  setTimeout(function tick() {
    el.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(tick, speed);
    else setTimeout(() => caret?.classList.add('gone'), 1800);
  }, delay);
}
