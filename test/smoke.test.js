import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tri-'));
process.env.DB_PATH = path.join(tmp, 'test.db');
process.env.ADMIN_PASSWORD = 'test-password';

let server, base;
before(async () => {
  const { default: app } = await import('../server/index.js');
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(() => { server.close(); fs.rmSync(tmp, { recursive: true, force: true }); });

test('public pages render', async () => {
  for (const p of ['/', '/members', '/rush', '/address', '/admin']) {
    const r = await fetch(base + p);
    assert.equal(r.status, 200, p);
  }
});

test('content API returns seeded placeholders', async () => {
  const site = await (await fetch(base + '/api/site')).json();
  assert.ok(site.siteTitle);
  const gallery = await (await fetch(base + '/api/gallery')).json();
  assert.ok(gallery.length > 0);
});

test('admin routes require login', async () => {
  const r = await fetch(base + '/api/rush');
  assert.equal(r.status, 401);
});

test('rush form validates and stores', async () => {
  const bad = await fetch(base + '/api/rush', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'A' }) });
  assert.equal(bad.status, 400);
  const ok = await fetch(base + '/api/rush', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', email: 't@example.com' }) });
  assert.equal(ok.status, 201);

  const login = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'test-password' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const list = await (await fetch(base + '/api/rush', { headers: { cookie } })).json();
  assert.equal(list.length, 1);
});
