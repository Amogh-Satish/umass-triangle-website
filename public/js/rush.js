import { initLayout, refreshAnimations } from './common.js?v=20261006e';

initLayout();

// Countdown to rush. Set data-date on #countdown in rush.html (any format Date can
// parse, e.g. "2026-09-08T19:00"). Blank or past dates leave it hidden.
const cd = document.getElementById('countdown');
const start = cd?.dataset.date ? new Date(cd.dataset.date) : null;

if (start && !isNaN(start) && start > Date.now()) {
  const season = cd.dataset.season || '';
  cd.hidden = false;
  const units = [['days', 86400], ['hrs', 3600], ['min', 60], ['sec', 1]];
  cd.innerHTML = `<div class="countdown-title">Rush ${season} starts in</div>` +
    units.map(([u]) => `<div class="unit"><b data-u="${u}">0</b><span>${u}</span></div>`).join('');
  const tick = () => {
    let left = Math.max(0, Math.floor((start - Date.now()) / 1000));
    if (!left) { cd.innerHTML = '<div class="countdown-title">Rush is happening now!</div>'; return clearInterval(timer); }
    for (const [u, secs] of units) {
      cd.querySelector(`[data-u="${u}"]`).textContent = String(Math.floor(left / secs)).padStart(2, '0');
      left %= secs;
    }
  };
  const timer = setInterval(tick, 1000);
  tick();
}

refreshAnimations();
