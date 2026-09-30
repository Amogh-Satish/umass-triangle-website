// Runs the web server (auto-restarts on code changes) and the auto-push watcher together.
import { spawn } from 'node:child_process';

try { process.loadEnvFile('.env'); } catch {}

const procs = [spawn(process.execPath, ['--watch-path=server', '--watch-path=config', 'server/index.js'], { stdio: 'inherit' })];
if (process.env.AUTOPUSH !== 'false') procs.push(spawn(process.execPath, ['scripts/autopush.js'], { stdio: 'inherit' }));

const stop = () => { procs.forEach((p) => p.kill()); process.exit(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => code && stop()));
