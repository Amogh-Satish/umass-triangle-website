import { api, esc } from './common.js';

const $ = (id) => document.getElementById(id);
const panel = $('panel');

function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const { url } = await api('/api/upload', { method: 'POST', body: fd });
  return url;
}

// Opens a file picker and resolves with the uploaded URL (or null if cancelled).
function pickAndUpload() {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' });
    input.onchange = async () => {
      if (!input.files[0]) return resolve(null);
      try { toast('Uploading…'); resolve(await uploadFile(input.files[0])); toast('Uploaded'); }
      catch (e) { toast(e.message); resolve(null); }
    };
    input.click();
  });
}

// ---------------- tabs ----------------
const TABS = {
  checklist: { label: 'Checklist', render: renderChecklist },
  settings: { label: 'Site Settings', render: renderSettings },
  gallery: { label: 'Gallery', render: () => renderList('gallery') },
  eboard: { label: 'E-Board', render: () => renderList('eboard') },
  members: { label: 'Members', render: () => renderList('members') },
  address: { label: 'Presidential Address', render: renderAddress },
  rush: { label: 'Rush Sign-ups', render: renderRush },
};

function showTab(id) {
  if (!TABS[id]) id = 'checklist';
  if (location.hash.slice(1) !== id) history.replaceState(null, '', `#${id}`);
  $('tabs').querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
  panel.innerHTML = '<p style="color:var(--muted)">Loading…</p>';
  TABS[id].render().catch((e) => { panel.innerHTML = `<p class="form-msg err">${esc(e.message)}</p>`; });
}

// ---------------- checklist ----------------
async function renderChecklist() {
  const items = await api('/api/placeholders');
  panel.innerHTML = `
    <h2>Personalization checklist</h2>
    <p class="help">Everything still showing a <code>[placeholder]</code> or placeholder image. It shrinks as you fill things in.</p>
    ${items.length
      ? `<p><strong>${items.length}</strong> left</p><ul class="checklist" style="list-style:none;padding:0">${items.map((i) => `<li>${esc(i.where)}<br><code>${esc(i.value)}</code></li>`).join('')}</ul>`
      : '<p class="form-msg ok">All placeholders filled in. 🎉</p>'}`;
}

// ---------------- site settings (generic form from config/site.json) ----------------
const IMAGE_KEY = /logo|image|banner|photo/i;
const LABELS = {
  siteTitle: 'Site title (header)', chapterName: 'Chapter name (hero, highlighted)', university: 'University',
  tagline: 'Tagline (hero pill)', heroImage: 'Hero background image', rushBanner: 'Rush page banner',
  eboardTerm: 'E-Board term (e.g. Fall 2026)', formEnabled: 'Show built-in interest form', credits: 'Footer credits',
};
const nice = (k) => LABELS[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

function fieldHtml(key, value, path) {
  const id = `f_${path.replace(/\W/g, '_')}`;
  if (typeof value === 'boolean') {
    return `<div class="field"><label style="display:flex;gap:8px;align-items:center;color:#fff"><input type="checkbox" id="${id}" data-path="${path}" data-kind="bool" ${value ? 'checked' : ''} style="width:auto"> ${esc(nice(key))}</label></div>`;
  }
  if (typeof value === 'string') {
    const long = value.length > 90;
    const input = long
      ? `<textarea id="${id}" data-path="${path}" rows="3">${esc(value)}</textarea>`
      : `<input id="${id}" data-path="${path}" value="${esc(value)}" ${/color|accent|background|surface/i.test(key) ? 'type="text" placeholder="#rrggbb"' : ''}>`;
    const up = IMAGE_KEY.test(key) ? `<button type="button" class="btn" data-upload="${id}"><i class="bi bi-upload"></i> Upload</button>` : '';
    const swatch = /^#[0-9a-f]{3,8}$/i.test(value) ? `<input type="color" value="${esc(value)}" data-swatch="${id}" style="width:48px;padding:2px">` : '';
    return `<div class="field"><label for="${id}">${esc(nice(key))}</label><div class="with-upload">${input}${swatch}${up}</div></div>`;
  }
  if (Array.isArray(value)) {
    return `<fieldset><legend>${esc(nice(key))}</legend>
      <div data-array="${path}">${value.map((v, i) => arrayItemHtml(v, `${path}.${i}`)).join('')}</div>
      <button type="button" class="btn" data-add="${path}"><i class="bi bi-plus"></i> Add</button></fieldset>`;
  }
  if (value && typeof value === 'object') {
    return `<fieldset><legend>${esc(nice(key))}</legend>${Object.entries(value).map(([k, v]) => fieldHtml(k, v, `${path}.${k}`)).join('')}</fieldset>`;
  }
  return '';
}

function arrayItemHtml(v, path) {
  return `<div class="row-item" style="grid-template-columns:1fr 1fr auto" data-item>
    ${Object.entries(v).map(([k, x]) => `<div><label>${esc(nice(k))}</label><input data-path="${path}.${k}" value="${esc(x)}"></div>`).join('')}
    <button type="button" class="btn danger" data-remove>Remove</button></div>`;
}

function setPath(obj, path, val) {
  const keys = path.split('.');
  let o = obj;
  keys.slice(0, -1).forEach((k, i) => { o[k] ??= /^\d+$/.test(keys[i + 1]) ? [] : {}; o = o[k]; });
  o[keys.at(-1)] = val;
}

async function renderSettings() {
  const site = await api('/api/site');
  const comment = site._comment;
  panel.innerHTML = `
    <h2>Site settings</h2>
    <p class="help">Saved to <code>config/site.json</code> (committed to git). Leave a field blank to hide it.</p>
    <form id="settings-form">
      ${Object.entries(site).filter(([k]) => !k.startsWith('_')).map(([k, v]) => fieldHtml(k, v, k)).join('')}
      <div class="actions"><button class="btn primary" type="submit">Save settings</button></div>
    </form>`;
  const form = $('settings-form');

  form.addEventListener('click', async (e) => {
    const up = e.target.closest('[data-upload]');
    if (up) { const url = await pickAndUpload(); if (url) $(up.dataset.upload).value = url; }
    const rm = e.target.closest('[data-remove]');
    if (rm) rm.closest('[data-item]').remove();
    const add = e.target.closest('[data-add]');
    if (add) {
      const wrap = form.querySelector(`[data-array="${add.dataset.add}"]`);
      wrap.insertAdjacentHTML('beforeend', arrayItemHtml({ label: '', url: '' }, `${add.dataset.add}.${Date.now()}`));
    }
  });
  form.addEventListener('input', (e) => {
    if (e.target.dataset.swatch) $(e.target.dataset.swatch).value = e.target.value;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = comment ? { _comment: comment } : {};
    // Walk fields in DOM order so key order in site.json is preserved.
    // Array rows are renumbered by position so removed/added rows collapse cleanly.
    form.querySelectorAll('[data-array]').forEach((wrap) => {
      wrap.querySelectorAll('[data-item]').forEach((item, i) => { item.dataset.index = i; });
    });
    form.querySelectorAll('[data-path], [data-array]').forEach((el) => {
      if (el.dataset.array) {
        const cur = el.dataset.array.split('.').reduce((o, k) => o?.[k], out);
        if (!cur) setPath(out, el.dataset.array, []);
        return;
      }
      const wrap = el.closest('[data-array]');
      if (wrap) {
        const key = el.dataset.path.split('.').at(-1);
        return setPath(out, `${wrap.dataset.array}.${el.closest('[data-item]').dataset.index}.${key}`, el.value);
      }
      setPath(out, el.dataset.path, el.dataset.kind === 'bool' ? el.checked : el.value);
    });
    await api('/api/site', { method: 'PUT', body: JSON.stringify(out) });
    toast('Settings saved');
  });
}

// ---------------- list editors (gallery / eboard / members) ----------------
const LIST_DEFS = {
  gallery: {
    title: 'Home page gallery', help: 'Photos on the home page grid. Lower "order" shows first.',
    fields: [{ k: 'src', label: 'Image', image: true }, { k: 'caption', label: 'Caption' }, { k: 'sort', label: 'Order', num: true }],
    cols: '72px 1fr 1fr 80px auto',
  },
  eboard: {
    title: 'Executive board', help: 'Carousel on the Members page.',
    fields: [{ k: 'photo', label: 'Headshot', image: true }, { k: 'name', label: 'Name' }, { k: 'position', label: 'Position' }, { k: 'sort', label: 'Order', num: true }],
    cols: '72px 1fr 1fr 1fr 80px auto',
  },
  members: {
    title: 'Chairholders & members', help: 'Anyone with a role shows under "Chairholders"; blank role shows under "Active Members".',
    fields: [{ k: 'name', label: 'Name' }, { k: 'role', label: 'Role / chair' }, { k: 'class_year', label: 'Class' }, { k: 'sort', label: 'Order', num: true }],
    cols: '1fr 1fr 100px 80px auto',
  },
};

async function renderList(table) {
  const def = LIST_DEFS[table];
  const rows = await api(`/api/${table}`);
  const rowHtml = (r) => `
    <div class="row-item" style="grid-template-columns:${def.cols}" data-id="${r.id}">
      ${def.fields.map((f) => f.image
        ? `<div><img class="thumb" src="${esc(r[f.k])}" alt="" data-thumb="${f.k}"><button class="btn" style="margin-top:4px;padding:4px 8px;font-size:.8rem" data-img="${f.k}">Change</button><input type="hidden" data-k="${f.k}" value="${esc(r[f.k])}"></div>`
        : `<div><label>${f.label}</label><input data-k="${f.k}" value="${esc(r[f.k])}" ${f.num ? 'type="number"' : ''}></div>`).join('')}
      <div style="display:flex;gap:6px"><button class="btn primary" data-save>Save</button><button class="btn danger" data-del>Delete</button></div>
    </div>`;

  panel.innerHTML = `
    <h2>${def.title}</h2><p class="help">${def.help}</p>
    <div class="actions" style="margin:0 0 8px">
      <button class="btn primary" id="add-row"><i class="bi bi-plus"></i> Add</button>
      ${def.fields.some((f) => f.image) ? '<button class="btn" id="bulk"><i class="bi bi-images"></i> Bulk upload photos</button>' : ''}
    </div>
    <div id="rows">${rows.map(rowHtml).join('')}</div>`;

  const collect = (el) => Object.fromEntries([...el.querySelectorAll('[data-k]')].map((i) => [i.dataset.k, i.type === 'number' ? Number(i.value) : i.value]));

  $('rows').addEventListener('click', async (e) => {
    const row = e.target.closest('[data-id]');
    if (!row) return;
    if (e.target.closest('[data-save]')) {
      await api(`/api/${table}/${row.dataset.id}`, { method: 'PUT', body: JSON.stringify(collect(row)) });
      toast('Saved');
    } else if (e.target.closest('[data-del]')) {
      if (!confirm('Delete this item?')) return;
      await api(`/api/${table}/${row.dataset.id}`, { method: 'DELETE' });
      row.remove();
      toast('Deleted');
    } else if (e.target.closest('[data-img]')) {
      const k = e.target.closest('[data-img]').dataset.img;
      const url = await pickAndUpload();
      if (!url) return;
      row.querySelector(`[data-k="${k}"]`).value = url;
      row.querySelector(`[data-thumb="${k}"]`).src = url;
      await api(`/api/${table}/${row.dataset.id}`, { method: 'PUT', body: JSON.stringify({ [k]: url }) });
    }
  });

  $('add-row').onclick = async () => {
    const blank = Object.fromEntries(def.fields.map((f) => [f.k, f.num ? rows.length + 1 : f.image ? '/placeholder/400/400.svg?label=New' : '']));
    if (table !== 'gallery') blank.name ||= 'New';
    const r = await api(`/api/${table}`, { method: 'POST', body: JSON.stringify(blank) });
    $('rows').insertAdjacentHTML('beforeend', rowHtml(r));
  };

  const bulk = $('bulk');
  if (bulk) bulk.onclick = () => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*', multiple: true });
    input.onchange = async () => {
      const imgKey = def.fields.find((f) => f.image).k;
      let n = rows.length;
      for (const file of input.files) {
        try {
          const url = await uploadFile(file);
          const body = { [imgKey]: url, sort: ++n, ...(table === 'gallery' ? { caption: '' } : { name: file.name.replace(/\.[^.]+$/, ''), position: '' }) };
          const r = await api(`/api/${table}`, { method: 'POST', body: JSON.stringify(body) });
          $('rows').insertAdjacentHTML('beforeend', rowHtml(r));
        } catch (e) { toast(`${file.name}: ${e.message}`); }
      }
      toast('Upload finished');
    };
    input.click();
  };
}

// ---------------- presidential address ----------------
async function renderAddress() {
  const p = await api('/api/pages/address');
  panel.innerHTML = `
    <h2>Presidential address</h2><p class="help">Plain text. Blank lines start new paragraphs.</p>
    <form id="addr">
      <div class="field"><label>Title</label><input name="title" value="${esc(p.title)}"></div>
      <div class="field"><label>Letter</label><textarea name="body" rows="18">${esc(p.body)}</textarea></div>
      <div class="field"><label>Signature</label><input name="signature" value="${esc(p.signature)}"></div>
      <button class="btn primary">Save</button>
    </form>`;
  $('addr').onsubmit = async (e) => {
    e.preventDefault();
    await api('/api/pages/address', { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    toast('Saved');
  };
}

// ---------------- rush sign-ups ----------------
async function renderRush() {
  const rows = await api('/api/rush');
  panel.innerHTML = `
    <h2>Rush sign-ups</h2><p class="help">${rows.length} submission${rows.length === 1 ? '' : 's'} from the Rush page form. Stored only in the local database (never committed to git).</p>
    <div class="actions" style="margin:0 0 12px"><a class="btn" href="/api/rush.csv"><i class="bi bi-download"></i> Export CSV</a></div>
    <div class="table-scroll"><table>
      <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Major</th><th>Year</th><th>Message</th><th></th></tr></thead>
      <tbody>${rows.map((r) => `<tr data-id="${r.id}"><td>${esc(r.created_at.slice(0, 16))}</td><td>${esc(r.name)}</td><td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td><td>${esc(r.phone)}</td><td>${esc(r.major)}</td><td>${esc(r.year)}</td><td>${esc(r.message)}</td><td><button class="btn danger" data-del>Delete</button></td></tr>`).join('')}</tbody>
    </table></div>`;
  panel.querySelector('tbody').onclick = async (e) => {
    const tr = e.target.closest('tr');
    if (!e.target.closest('[data-del]') || !confirm('Delete this sign-up?')) return;
    await api(`/api/rush/${tr.dataset.id}`, { method: 'DELETE' });
    tr.remove();
  };
}

// ---------------- boot ----------------
async function boot() {
  const { admin } = await api('/api/me');
  $('login-view').hidden = admin;
  $('app-view').hidden = !admin;
  if (!admin) return;
  $('tabs').innerHTML = Object.entries(TABS).map(([id, t]) => `<button data-tab="${id}">${t.label}</button>`).join('');
  $('tabs').onclick = (e) => e.target.dataset.tab && showTab(e.target.dataset.tab);
  showTab(location.hash.slice(1));
}
addEventListener('hashchange', () => !$('app-view').hidden && showTab(location.hash.slice(1)));

$('login-form').onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api('/api/login', { method: 'POST', body: JSON.stringify({ password: $('pw').value }) });
    boot();
  } catch (err) { $('login-msg').textContent = err.message; }
};
$('logout').onclick = async () => { await api('/api/logout', { method: 'POST' }); boot(); };

boot();
