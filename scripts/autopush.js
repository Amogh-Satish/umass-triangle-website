// Watches the project and auto-commits + pushes changes to GitHub.
// Batches edits: waits until nothing has changed for DEBOUNCE_MS, then commits once.
import { watch } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DEBOUNCE_MS = Number(process.env.AUTOPUSH_DEBOUNCE_MS) || 15_000;
// Auto-commits only ever go to this branch. Collaborators work on their own branches
// and merge into main via pull requests on GitHub.
const BRANCH = process.env.AUTOPUSH_BRANCH || 'main';
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
    const current = git('rev-parse', '--abbrev-ref', 'HEAD');
    if (current !== BRANCH) {
      console.log(`[autopush] on branch "${current}", not "${BRANCH}", so skipping auto-commit (run: git switch ${BRANCH})`);
      return;
    }
    if (git('status', '--porcelain')) {
      git('add', '-A');
      const files = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
      if (files.length) {
        const summary = files.length <= 3 ? files.join(', ') : `${files.slice(0, 3).join(', ')} +${files.length - 3} more`;
        git('commit', '-m', `Auto-update: ${summary}`);
        console.log(`[autopush] committed ${files.length} file(s)`);
      }
    }
    if (!hasRemote()) {
      console.log('[autopush] no "origin" remote yet. Run scripts/setup-github.sh to connect GitHub');
      return;
    }
    // Nothing to push? (also retries commits left behind by an earlier failed push)
    let ahead = 1;
    try { ahead = Number(git('rev-list', '--count', `origin/${BRANCH}..HEAD`)); } catch {}
    if (!ahead) return;
    // Pick up anything merged into main on GitHub (e.g. a collaborator's PR) before pushing.
    try {
      git('pull', '--rebase', '--autostash', 'origin', BRANCH);
    } catch (e) {
      try { git('rebase', '--abort'); } catch {}
      console.error(`[autopush] couldn't merge the latest ${BRANCH} from GitHub (conflicting edits). Your commit is saved locally; ask Claude to resolve it.`);
      return;
    }
    git('push', 'origin', `HEAD:${BRANCH}`);
    console.log(`[autopush] pushed to GitHub (${BRANCH})`);
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
console.log(`[autopush] watching for changes; commits to "${BRANCH}" ${DEBOUNCE_MS / 1000}s after the last edit`);
sync();
setInterval(sync, 5 * 60_000); // periodic retry for anything that failed to push
