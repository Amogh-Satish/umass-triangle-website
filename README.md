# UMass Triangle — chapter website

Public website for Triangle Fraternity at the University of Massachusetts Amherst:
a dark photo-gallery home page, an executive board carousel and member list, a rush
page, and an about page.

**The live site is static.** Plain HTML, CSS and JavaScript in `public/`, deployed to
GitHub Pages. No build step, no server, no database, nothing to pay for.

## Editing the site

Content lives in the HTML itself — not in a database and not in JavaScript. To change
something, open the page and edit it:

| What | Where |
|---|---|
| Hero text, stats, photo gallery | `public/index.html` |
| E-board, chairholders, members | `public/members.html` |
| Rush pitch, links, rush date | `public/rush.html` |
| History and purpose | `public/about.html` |
| Colors, fonts, layout | `public/css/style.css` |
| Header and footer | the top and bottom of **each** page |

The header and footer are repeated in every page on purpose: it is what keeps the site
buildless and crawlable. If you change one, change all five.

### Adding a photo

Drop the file in `public/img/`, then copy one block in `public/index.html`:

```html
<a class="gallery-item glightbox" href="img/YOUR-PHOTO.jpg" data-title="Caption"
   data-type="image" data-aos="fade-up" data-aos-delay="0">
  <img src="img/YOUR-PHOTO.jpg" alt="Caption" width="800" height="600" loading="lazy">
  <div class="overlay"><i class="bi bi-arrows-angle-expand"></i><span>Caption</span></div>
</a>
```

Keep `width`/`height` roughly right so the page doesn't jump while images load, and
write a real `alt` — it is read by screen readers and by Google.

### Rush countdown

Set `data-date` on `#countdown` in `public/rush.html` (e.g. `data-date="2026-09-08T19:00"`).
Blank or past dates keep it hidden.

### Cache busting

CSS and JS are referenced with a `?v=` stamp (e.g. `css/style.css?v=20261001h`),
including the `./common.js` import inside each page module. **Bump every one of
them together after changing anything in `css/` or `js/`.** Without it browsers
keep serving the old file, which shows up as markup that updated while its
behaviour did not -- a button that renders but does nothing.

```bash
grep -rn 'v=20261001h' public | wc -l    # find them all before bumping
```

## Preview locally

```bash
cd public && python3 -m http.server 8080    # http://localhost:8080
```

Use a server rather than opening the files directly — ES modules do not load over `file://`.

## Deploying

Pushing to `main` publishes automatically via `.github/workflows/pages.yml`.
Enable it once: **Settings → Pages → Source: GitHub Actions**.

All internal links and asset paths are **relative**, so the site works both at a
project subpath (`user.github.io/repo/`) and at a domain root. Only `canonical`,
Open Graph, JSON-LD, `robots.txt` and `sitemap.xml` carry absolute URLs.

### Custom domain

1. Register the domain (e.g. `umasstriangle.org`).
2. Point apex `A` records at `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
   `185.199.111.153`, and `www` `CNAME` at `<user>.github.io`.
3. Add the bare domain to `public/CNAME`.
4. Update the absolute URLs: `tools/set-base-url.sh https://umasstriangle.org`
5. **Settings → Pages → Enforce HTTPS.**

## Being findable

Each page has its own `<title>`, description, canonical and Open Graph tags; the home
page carries `Organization` structured data; `sitemap.xml` and `robots.txt` are in
`public/`. After the first deploy, submit the sitemap to
[Google Search Console](https://search.google.com/search-console).

The thing that actually moves rankings for a new site is **inbound links**. Ask to be
listed on the UMass Greek life directory and on `triangle.org`'s chapter page, and put
the URL in the chapter Instagram bio.

## The Express server (not used by the live site)

`server/`, `public/admin.html` and `config/site.json` are the original full-stack
version: an Express + SQLite API with an admin dashboard. They are **kept in the repo
but are not part of the deployed site** — GitHub Pages serves static files only, so
there is no API for the admin panel to talk to, and the deploy workflow strips it out.

Editing `config/site.json` or using the admin dashboard will **not** change the live
site. Edit the HTML instead.

`npm start` still runs the old server if you want it. If the chapter later wants a real
admin panel back, the clean path is to have it write the HTML (or a data file the pages
read at build time) and host somewhere with a persistent disk.

## Brand

- **Mark:** the Delta T, `public/img/brand/delta-t.svg`, rebuilt as vector from
  [nationals' official asset](https://www.triangle.org/wp-content/uploads/2021/08/DeltaT@2x.png).
  `delta-t-mono.svg` inherits `currentColor` for inline use.
- **Red:** `#D2343E`, sampled from that asset. Nationals' brand page also lists Old Rose
  `#990033` for digital; on this dark theme `#990033` only reaches 2:1 contrast, so the
  brighter red is used and `--accent-link` (`#E4606A`) carries inline links at 5.2:1.
- Per nationals, the mark should travel with "TRIANGLE FRATERNITY" spelled out.
- Production artwork, including the Coat of Arms, comes from `communications@triangle.org`.

## Still to fill in

Search the repo for `[` to find every placeholder. The main ones:

- Real photos (currently generated placeholders in `public/img/placeholder/`)
- E-board and member names
- Chapter email and Instagram handle — in the header of all five pages, and in
  `rush.html`
- The rush interest form URL in `rush.html`
- Stats, founding year, and the president's letter
