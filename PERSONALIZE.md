# Personalization checklist

The site is static: everything below is edited **directly in the HTML** in `public/`.
There is no admin panel and no database behind the live site — see the README for why.

Find everything still outstanding at any time:

```bash
grep -rn '\[' public/*.html | grep -v '<!--'
```

## Identity — all five pages

The header and footer are repeated in `index.html`, `members.html`, `rush.html`,
`address.html` and `404.html`. Change one, change all five.

- [ ] **Chapter email + Instagram** — uncomment the `header-social` block and fill in
      the real links
- [ ] **Footer credits** — replace `[Designed by Name '27; Maintained by Name '28]`

## Home (`public/index.html`)

- [ ] **Hero background** — swap `img/placeholder/hero.svg` for a real landscape photo
      (~1920px wide: house, composite, or a drone shot)
- [ ] **Stats** — `[XX]` active brothers, `[YYYY]` founded, `[XX]` service hours.
      They count up on scroll; non-numeric values just display as-is.
- [ ] **Gallery** — replace the 12 placeholder entries with real photos and captions.
      Drop files in `public/img/`. Captions are also the `alt` text, so write them for
      a person who can't see the photo.

## Members (`public/members.html`)

- [ ] **E-board term** — `[Semester Year]`
- [ ] **E-board** — 8 `[Name]` entries plus square headshots
- [ ] **Chairholders and active members** — names and class years

## Rush (`public/rush.html`)

- [ ] **Rush pitch** — replace the bracketed blurb
- [ ] **Interest form URL** — the `[Rush interest form]` link is currently `#`
- [ ] **Email + Instagram** links in the same row
- [ ] **Rush banner** image
- [ ] **Countdown** — set `data-date` on `#countdown`, e.g. `data-date="2026-09-08T19:00"`

## Presidential address (`public/address.html`)

- [ ] The letter body and the signature

## Brand and metadata

- [ ] **Coat of Arms** — request production artwork from `communications@triangle.org`
      if you want the crest on the site (the Delta T is already vectorized)
- [ ] **Base URL** — the canonical/Open Graph/sitemap URLs assume
      `https://amogh-satish.github.io/umass-triangle-website`. On a custom domain run
      `tools/set-base-url.sh https://your-domain.org`
- [ ] **Google Search Console** — verify the site and submit `sitemap.xml` after the
      first deploy
- [ ] **Backlinks** — get listed on the UMass Greek life directory and `triangle.org`

## Before it goes public

- [ ] No `[placeholder]` text left anywhere
- [ ] Every photo is one the chapter has the right to publish, and everyone pictured is
      fine with it being on a public, indexed page
- [ ] Names and headshots of members: confirm each brother consents to being listed
- [ ] Exec board has signed off on the copy
