# UMass Triangle website

Chapter website for Triangle Fraternity at UMass Amherst. Owner: Amogh Satish ('29). Not a developer — explain steps plainly.

- Run: `npm run dev` → site at http://localhost:3000, admin at /admin (password: `ADMIN_PASSWORD` in `.env`, never print it).
- `npm run dev` also runs `scripts/autopush.js`, which commits and pushes every change to the private repo
  github.com/Amogh-Satish/umass-triangle-website ~15s after the last edit. No manual git needed.
- Stack: Express 5 + built-in `node:sqlite`, plain HTML/CSS/JS in `public/`, no build step. Tests: `npm test`.
- Site settings (names, colors, links, stats, rush date, footer) live in `config/site.json`.
  Gallery / e-board / members / address letter / rush sign-ups live in `data/site.db` (gitignored, local only).
- Placeholders are written as `[like this]`; admin → Checklist lists what's left. See PERSONALIZE.md.
- Intro animation (triangle draws, then splits three ways) is home page only, once per browser session:
  markup in `public/index.html`, styles in the preloader section of `public/css/style.css`, timing in `public/js/common.js`.
- Design is modeled on the Michigan chapter's site layout, but don't copy their photos, names or text.
