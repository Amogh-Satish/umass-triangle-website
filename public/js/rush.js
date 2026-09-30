import { initLayout, refreshAnimations, esc, api } from './common.js';

const site = await initLayout('rush');
const r = site.rush || {};

document.getElementById('rush-heading').textContent = r.heading || 'Rush Triangle';
document.getElementById('rush-blurb').textContent = r.blurb || '';
document.getElementById('rush-links').innerHTML = (r.links || [])
  .filter((l) => l.label)
  .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
  .join('<span style="color:var(--muted)">|</span>');

const banner = document.getElementById('rush-banner');
if (site.rushBanner) banner.src = site.rushBanner; else banner.remove();
refreshAnimations();

if (r.formEnabled !== false) {
  document.getElementById('rush-form-section').hidden = false;
  const form = document.getElementById('rush-form');
  const msg = document.getElementById('form-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name.trim() || !form.elements.email.checkValidity()) {
      msg.className = 'form-msg err';
      msg.textContent = 'Please enter your name and a valid email.';
      return;
    }
    const btn = form.querySelector('button');
    btn.disabled = true;
    try {
      await api('/api/rush', { method: 'POST', body: JSON.stringify(data) });
      form.reset();
      msg.className = 'form-msg ok';
      msg.textContent = "Thanks! We'll reach out soon.";
    } catch (err) {
      msg.className = 'form-msg err';
      msg.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });
}
