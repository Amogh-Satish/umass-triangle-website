# Personalization checklist

Everything below is a placeholder right now. Most of it can be done from **/admin** without touching code. The admin **Checklist** tab tracks what's left.

## Site Settings (admin → Site Settings, or `config/site.json`)
- [ ] **Site title**: shown in the header next to the logo
- [ ] **Chapter name**: e.g. "Alpha Beta Chapter" (big highlighted hero text)
- [ ] **University**: already set to "University of Massachusetts Amherst"; change if needed
- [ ] **Logo**: upload the chapter crest (PNG/SVG, transparent background). It's also used as the browser-tab icon.
- [ ] **Hero image**: big home-page background (house, composite, or drone shot; landscape, ~1920px wide)
- [ ] **Rush banner**: wide image at the bottom of the Rush page
- [ ] **Theme colors**: `accent` is UMass maroon `#881c1c` by default; change if you like
- [ ] **Social links**: Instagram, Facebook, LinkedIn, chapter email (blank or `[bracketed]` values are hidden)
- [ ] **E-Board term**: e.g. "Fall 2026"
- [ ] **Rush**: blurb, season, and links (group chat, external form, etc.)
- [ ] **Footer credits**

## Content (admin tabs)
- [ ] **Gallery**: replace the 12 placeholder photos (use "Bulk upload photos", then add captions)
- [ ] **E-Board**: names, positions, headshots (square photos look best)
- [ ] **Members**: chairholders (with a role) and active members (blank role)
- [ ] **Presidential Address**: the letter and signature

## Optional code-level changes
- [ ] Loading animation colors and timing: `public/css/style.css` (the "preloader" section)
- [ ] Nav items / page names: `NAV` in `public/js/common.js`
- [ ] Rush form fields: `public/rush.html` and the `/api/rush` handler in `server/index.js`
- [ ] Meta description for search engines: the `<meta name="description">` tag in each `public/*.html`
