# Personalization checklist

The site is static: everything below is edited **directly in the HTML** in `public/`.
There is no admin panel and no database behind the live site — see the README for why.

Find everything still outstanding at any time:

```bash
grep -rn '\[' public/*.html | grep -v '<!--'
```

## Identity — all five pages

The header and footer are repeated in `index.html`, `members.html`, `rush.html`,
`about.html` and `404.html`. Change one, change all five.

- [x] **Instagram** — wired: `instagram.com/triangleumassamherst`
- [ ] **Chapter email** — the one thing still outstanding. Replace
      `CHAPTER-EMAIL@umass.edu` in `rush.html` and in the header of all five pages,
      then uncomment the envelope in `header-social`. The subject line is already
      pre-filled as "Rush interest form - NEW MEMBER".
- [x] **Footer credits** — Nihaal Thakran '29 and Amogh Satish '29

## Home (`public/index.html`)

- [ ] **Hero background** — swap `img/placeholder/hero.svg` for a real landscape photo
      (~1920px wide: house, composite, or a drone shot)
- [x] **Stats** — 25 active brothers, founded 2025, 15 service hours / semester
- [ ] **Gallery** — replace the 12 placeholder entries with real photos and captions.
      Drop files in `public/img/`. Captions are also the `alt` text, so write them for
      a person who can't see the photo.

## Members (`public/members.html`)

- [x] **E-board term** — Fall 2026
- [x] **E-board roles** — 13, using the chapter's "Director of" convention:
      President, Vice President, Secretary, Director of Finance, Recruitment,
      Philanthropy, Risk Management, Innovations, Outreach, External Affairs,
      Education, Social Media, DEI
- [ ] **E-board names + headshots** — named so far: Harsith Thokala (President),
      Amogh Satish (Finance), Aarav Singh (Vice President), Nihaal Thakran and
      Anurag Dasgupta (Recruitment).
      Nihaal has a headshot; the other 10 cards are still `[Name]` on a placeholder
      headshot. Square photos look best. Drop them in `public/img/eboard/`.
- [x] **Active members** — all 26 named, with graduating years.
- [ ] **Member bios** — only Nihaal's is written. Each card opens a bio modal.
      Per member, in `members.html`:
      - photo: square image in `public/img/members/`, set as the `<img src>`
      - `.md-major` — e.g. "Computer Science"
      - `.md-bio` — a sentence or two in their own voice
      - LinkedIn / Instagram: add `<a class="md-linkedin">` or
        `<a class="md-instagram">` **only** for members who have one. Leave them
        out entirely otherwise — the modal hides the row when neither exists.
        The link's own text becomes the chip label, so a handle works as well as
        the network name (see Nihaal's `nihaal.56`).

Nihaal Thakran's entry is filled in as the worked example to copy.
- [ ] **Terms** — the picker holds only Fall 2026. Add one `<li>` in the
      `term-menu` list per term; `aria-selected="true"` marks the active one.

## Rush (`public/rush.html`)

- [ ] **Rush banner** image
- [ ] **Countdown** — set `data-date` on `#countdown`, e.g. `data-date="2026-09-08T19:00"`

## About (`public/about.html`)

- [x] History points and purpose statement — from nationals

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
