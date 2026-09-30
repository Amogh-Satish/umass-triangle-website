import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import multer from 'multer';

try { process.loadEnvFile('.env'); } catch { /* no .env: use defaults */ }

const { db } = await import('./db.js');

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const CONFIG_PATH = path.resolve('config/site.json');
const UPLOAD_DIR = path.resolve('public/uploads');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// ---------- auth (single admin password, in-memory sessions) ----------
const sessions = new Map(); // token -> expiry ms
const SESSION_MS = 1000 * 60 * 60 * 12;
const loginAttempts = new Map(); // ip -> { count, until }

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const hit = raw.split(';').map((s) => s.trim()).find((s) => s.startsWith(name + '='));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
}

function isAdmin(req) {
  const token = getCookie(req, 'admin');
  const exp = token && sessions.get(token);
  if (!exp) return false;
  if (exp < Date.now()) { sessions.delete(token); return false; }
  return true;
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: 'Not signed in' });
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

app.post('/api/login', (req, res) => {
  const ip = req.ip;
  const rec = loginAttempts.get(ip) || { count: 0, until: 0 };
  if (rec.until > Date.now()) return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'change-me') {
    return res.status(500).json({ error: 'Set ADMIN_PASSWORD in .env first.' });
  }
  if (!safeEqual(String(req.body?.password || ''), ADMIN_PASSWORD)) {
    rec.count += 1;
    if (rec.count >= 5) { rec.count = 0; rec.until = Date.now() + 60_000; }
    loginAttempts.set(ip, rec);
    return res.status(401).json({ error: 'Wrong password' });
  }
  loginAttempts.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_MS);
  res.setHeader('Set-Cookie', `admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`);
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  const token = getCookie(req, 'admin');
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', 'admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => res.json({ admin: isAdmin(req) }));

// ---------- site settings (config/site.json, committed to git) ----------
const readConfig = () => JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

app.get('/api/site', (req, res) => res.json(readConfig()));

app.put('/api/site', requireAdmin, (req, res) => {
  const next = req.body;
  if (!next || typeof next !== 'object' || Array.isArray(next)) return res.status(400).json({ error: 'Invalid settings' });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2) + '\n');
  res.json(next);
});

// Lists every value still containing a [placeholder], for the admin checklist.
app.get('/api/placeholders', requireAdmin, (req, res) => {
  const out = [];
  const walk = (v, p) => {
    if (typeof v === 'string' && /\[[^\]]+\]/.test(v)) out.push({ where: `Site settings → ${p}`, value: v });
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!k.startsWith('_')) walk(x, p ? `${p}.${k}` : k);
  };
  walk(readConfig(), '');
  const scan = (table, cols, label) => {
    for (const row of db.prepare(`SELECT * FROM ${table}`).all()) {
      for (const c of cols) {
        if (/\[[^\]]+\]|\/placeholder\//.test(String(row[c]))) out.push({ where: `${label} #${row.id ?? row.slug} → ${c}`, value: String(row[c]).slice(0, 80) });
      }
    }
  };
  scan('gallery', ['src', 'caption'], 'Gallery');
  scan('eboard', ['name', 'photo'], 'E-Board');
  scan('members', ['name', 'class_year'], 'Members');
  scan('pages', ['body', 'signature'], 'Page');
  res.json(out);
});

// ---------- generic CRUD for list content ----------
const TABLES = {
  gallery: ['src', 'caption', 'sort'],
  eboard: ['name', 'position', 'photo', 'sort'],
  members: ['name', 'role', 'class_year', 'sort'],
};

for (const [table, fields] of Object.entries(TABLES)) {
  app.get(`/api/${table}`, (req, res) => {
    res.json(db.prepare(`SELECT * FROM ${table} ORDER BY sort, id`).all());
  });

  app.post(`/api/${table}`, requireAdmin, (req, res) => {
    const vals = fields.map((f) => req.body?.[f] ?? (f === 'sort' ? 0 : ''));
    const r = db.prepare(`INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`).run(...vals);
    res.status(201).json(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(r.lastInsertRowid));
  });

  app.put(`/api/${table}/:id`, requireAdmin, (req, res) => {
    const set = fields.filter((f) => req.body?.[f] !== undefined);
    if (!set.length) return res.status(400).json({ error: 'Nothing to update' });
    db.prepare(`UPDATE ${table} SET ${set.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`).run(...set.map((f) => req.body[f]), req.params.id);
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    row ? res.json(row) : res.status(404).json({ error: 'Not found' });
  });

  app.delete(`/api/${table}/:id`, requireAdmin, (req, res) => {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.json({ ok: true });
  });
}

// ---------- pages (presidential address, etc.) ----------
app.get('/api/pages/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
  row ? res.json(row) : res.status(404).json({ error: 'Not found' });
});

app.put('/api/pages/:slug', requireAdmin, (req, res) => {
  const { title = '', body = '', signature = '' } = req.body || {};
  db.prepare(`INSERT INTO pages (slug, title, body, signature) VALUES (?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET title = excluded.title, body = excluded.body, signature = excluded.signature`)
    .run(req.params.slug, title, body, signature);
  res.json(db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug));
});

// ---------- rush interest form ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
app.post('/api/rush', (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot field, bots fill it
  const clip = (v, n) => String(v ?? '').trim().slice(0, n);
  const row = {
    name: clip(b.name, 120), email: clip(b.email, 200), phone: clip(b.phone, 40),
    major: clip(b.major, 120), year: clip(b.year, 40), message: clip(b.message, 2000),
  };
  if (!row.name || !EMAIL_RE.test(row.email)) return res.status(400).json({ error: 'Name and a valid email are required.' });
  db.prepare('INSERT INTO rush_signups (name, email, phone, major, year, message) VALUES (?, ?, ?, ?, ?, ?)')
    .run(row.name, row.email, row.phone, row.major, row.year, row.message);
  res.status(201).json({ ok: true });
});

app.get('/api/rush', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM rush_signups ORDER BY created_at DESC').all());
});

app.get('/api/rush.csv', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM rush_signups ORDER BY created_at DESC').all();
  const cols = ['created_at', 'name', 'email', 'phone', 'major', 'year', 'message'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  res.type('text/csv').attachment('rush-signups.csv')
    .send([cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n'));
});

app.delete('/api/rush/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM rush_signups WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- image uploads ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)),
});

app.post('/api/upload', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload a JPG, PNG, WebP, GIF or AVIF image (max 15 MB).' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

// ---------- placeholder images: /placeholder/800/600.svg?label=Text ----------
app.get('/placeholder/:w/:h.svg', (req, res) => {
  const w = Math.min(Math.max(parseInt(req.params.w, 10) || 800, 10), 4000);
  const h = Math.min(Math.max(parseInt(req.params.h, 10) || 600, 10), 4000);
  const label = String(req.query.label || `${w}×${h}`).slice(0, 80)
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fs1 = Math.round(Math.min(w, h) / 12);
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400').send(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect width="100%" height="100%" fill="#2a2b2f"/>
      <path d="M${w / 2} ${h / 2 - fs1 * 2.2} l${fs1 * 1.4} ${fs1 * 2.4} h-${fs1 * 2.8} z" fill="none" stroke="#55575d" stroke-width="${Math.max(2, fs1 / 8)}"/>
      <text x="50%" y="${h / 2 + fs1 * 1.4}" fill="#8b8d93" font-family="Inter,Arial,sans-serif" font-size="${fs1 * 0.6}" text-anchor="middle">${label}</text>
    </svg>`,
  );
});

// ---------- static site ----------
app.use(express.static(path.resolve('public'), { extensions: ['html'] }));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((req, res) => res.status(404).sendFile(path.resolve('public/404.html')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

export default app;

if (process.argv[1] === new URL(import.meta.url).pathname) {
  app.listen(PORT, (err) => {
    if (err) {
      console.error(err.code === 'EADDRINUSE'
        ? `\nPort ${PORT} is already in use: the site is probably already running in another window.\nClose that window (or press Control+C in it), then try again.\n`
        : err);
      process.exit(1);
    }
    console.log(`Site running at http://localhost:${PORT}  (admin: /admin)`);
  });
}
