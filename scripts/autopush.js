// Watches the project and auto-commits + pushes changes to GitHub.
// Batches edits: waits until nothing has changed for DEBOUNCE_MS, then commits once.
import { watch } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DEBOUNCE_MS = Number(process.env.AUTOPUSH_DEBOUNCE_MS) || 15_000;
const IGNORE = /(^|\/)(\.git|node_modules|data|public\/uploads)(\/|$)|\.DS_Store$|\.db(-\w+)?$/;

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function hasRemote() {
  try { return git('remote').split('\n').includes('origin'); } catch { return false; }
}

let timer = null;
let busy = false;

function sync() {
  if (busy) return schedule();
  busy = true;
  try {
    if (!git('status', '--porcelain')) return;
    git('add', '-A');
    const files = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
    if (!files.length) return;
    const summary = files.length <= 3 ? files.join(', ') : `${files.slice(0, 3).join(', ')} +${files.length - 3} more`;
    git('commit', '-m', `Auto-update: ${summary}`);
    console.log(`[autopush] committed ${files.length} file(s)`);
    if (hasRemote()) {
      git('push', '-u', 'origin', 'HEAD');
      console.log('[autopush] pushed to GitHub');
    } else {
      console.log('[autopush] no "origin" remote yet — run scripts/setup-github.sh to connect GitHub');
    }
  } catch (e) {
    console.error('[autopush] failed:', (e.stderr || e.message).toString().trim());
  } finally {
    busy = false;
  }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(sync, DEBOUNCE_MS);
}

try { git('rev-parse', '--git-dir'); } catch {
  console.error('[autopush] not a git repository. Run: git init');
  process.exit(1);
}

watch(ROOT, { recursive: true }, (_event, file) => {
  if (file && !IGNORE.test(file.split(path.sep).join('/'))) schedule();
});
console.log(`[autopush] watching for changes (commits ${DEBOUNCE_MS / 1000}s after the last edit)`);
sync();
