import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.DB_PATH || path.resolve('data/site.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    src TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS eboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    photo TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    class_year TEXT NOT NULL DEFAULT '',
    sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS pages (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    signature TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS rush_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    major TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed placeholder content on first run only.
const empty = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n === 0;

if (empty('gallery')) {
  const ins = db.prepare('INSERT INTO gallery (src, caption, sort) VALUES (?, ?, ?)');
  for (let i = 1; i <= 12; i++) {
    ins.run(`/placeholder/800/600.svg?label=Gallery%20photo%20${i}`, `[Photo ${i} caption]`, i);
  }
}

if (empty('eboard')) {
  const ins = db.prepare('INSERT INTO eboard (name, position, photo, sort) VALUES (?, ?, ?, ?)');
  [
    'Chapter President',
    'Executive Vice President',
    'VP Financial Operations',
    'VP Internal Operations',
    'VP External Affairs',
    'VP Member Development',
    'VP Brotherhood',
    'VP Public Relations',
  ].forEach((pos, i) => ins.run('[Name]', pos, `/placeholder/400/400.svg?label=Headshot`, i));
}

if (empty('members')) {
  const ins = db.prepare('INSERT INTO members (name, role, class_year, sort) VALUES (?, ?, ?, ?)');
  ['Rush Chair', 'Social Chair', 'Philanthropy Chair', 'Scholarship Chair', 'House Manager'].forEach((role, i) =>
    ins.run('[Name]', role, "['YY]", i),
  );
  for (let i = 1; i <= 6; i++) ins.run(`[Member ${i}]`, '', "['YY]", 100 + i);
}

if (empty('pages')) {
  db.prepare('INSERT INTO pages (slug, title, body, signature) VALUES (?, ?, ?, ?)').run(
    'address',
    'Presidential Address',
    [
      'Hey there,',
      '[Opening: who you are and why you joined Triangle.]',
      '[Academics: how the chapter supports members in engineering, architecture, and the sciences.]',
      '[Service & philanthropy: the chapter’s signature events and community involvement.]',
      '[Professional development: alumni network, resume nights, career support.]',
      '[Brotherhood: what the chapter means to you.]',
      '[Closing.]',
    ].join('\n\n'),
    '- [President Name]',
  );
}
