# UMass Triangle — chapter website

Full-stack site for the Triangle Fraternity chapter at UMass: a dark photo-gallery home page, an executive board carousel and member list, a rush page with a built-in interest form, a presidential address, and an admin dashboard for editing all of it.

**Stack:** Node.js (22.13+), Express, SQLite (built into Node), plain HTML/CSS/JS. No build step.

## Run it locally

```bash
npm install
npm run dev        # site + auto-push watcher
# or: npm start    # just the site
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin (password is `ADMIN_PASSWORD` in `.env`)

## Personalizing

See **[PERSONALIZE.md](PERSONALIZE.md)**. Short version: sign in to `/admin`. The **Checklist** tab lists every placeholder that still needs replacing.

## Where things live

| What | Where | In git? |
|---|---|---|
| Site settings (names, colors, links, images) | `config/site.json` | yes |
| Gallery, e-board, members, address letter | `data/site.db` (SQLite) | no |
| Rush sign-ups (personal info) | `data/site.db` | **no, never** |
| Uploaded photos | `public/uploads/` | no |
| Pages / styles / scripts | `public/` | yes |
| API server | `server/` | yes |

Back up `data/` and `public/uploads/` before moving machines or hosting. They are kept out of git on purpose.

## Automation

- **Auto-push:** `npm run dev` runs `scripts/autopush.js`. It commits every change 15s after your last edit and pushes to GitHub. Turn it off with `AUTOPUSH=false` in `.env`.
- **Connect GitHub (one time):** `gh auth login`, then `scripts/setup-github.sh` creates a **private** repo and pushes.
- **CI:** every push runs the test suite on GitHub Actions (`.github/workflows/ci.yml`).
- **Tests:** `npm test`

## API

Public: `GET /api/site`, `/api/gallery`, `/api/eboard`, `/api/members`, `/api/pages/:slug`, `POST /api/rush`.
Admin (cookie session): `PUT /api/site`, `POST|PUT|DELETE /api/{gallery,eboard,members}[/:id]`, `PUT /api/pages/:slug`, `GET /api/rush`, `GET /api/rush.csv`, `POST /api/upload`, `GET /api/placeholders`.

## Before going public

- Set a strong `ADMIN_PASSWORD` and serve over HTTPS.
- Replace every placeholder (the admin Checklist should say 0 left).
- Pick a host with a persistent disk (Render, Railway, Fly.io, or a VPS), since the database and uploads are files on disk.
