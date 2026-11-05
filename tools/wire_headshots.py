#!/usr/bin/env python3
"""
Point members.html at whatever headshots exist in public/img/eboard/.

Matches each image to a member by slugified name, and updates both places a
person's photo appears: their row in Active Members and, if they hold one, their
e-board card. Members with no matching file keep the placeholder.
"""
import os, re, glob

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PAGE = os.path.join(ROOT, "public", "members.html")
PHOTOS = os.path.join(ROOT, "public", "img", "eboard")

slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

have = {os.path.splitext(os.path.basename(p))[0]: "img/eboard/" + os.path.basename(p)
        for p in glob.glob(os.path.join(PHOTOS, "*.jpg"))}

def find(name):
    """Exact slug first, then any filename that contains the member's name.

    Lets real-world filenames work as-is -- "Harsith Thokala Headshot.jpg",
    "IMG_2831 aarav singh.heic" -- instead of requiring the name and nothing
    else. Ambiguous hits are reported rather than guessed at."""
    key = slug(name)
    if key in have:
        return have[key], None
    hits = [v for k, v in have.items() if key in k]
    if len(hits) == 1:
        return hits[0], None
    if len(hits) > 1:
        return None, f"{name}: {len(hits)} photos match, skipped"
    return None, None

s = open(PAGE).read()
wired, missing = [], []

ambiguous = []
for name in re.findall(r'<span class="member-name">([^<]+)</span>', s):
    src, warn = find(name)
    if warn:
        ambiguous.append(warn)
    if not src:
        missing.append(name)
        continue

    # member row
    s = re.sub(
        r'(<span class="member-photo"><img src=")[^"]+("[^>]*></span>\s*<span class="member-name">'
        + re.escape(name) + r'</span>)',
        lambda m: m.group(1) + src + m.group(2), s)
    # e-board card, if this person holds a role
    s = re.sub(
        r'<img src="[^"]+" alt="' + re.escape(name) + r', ([^"]+)" width="\d+" height="\d+"',
        lambda m: f'<img src="{src}" alt="{name}, {m.group(1)}" width="520" height="520"', s)
    wired.append(name)

open(PAGE, "w").write(s)
print(f"{len(wired)} wired: " + (", ".join(wired) if wired else "-"))
print(f"{len(missing)} still on the placeholder" + (": " + ", ".join(missing) if missing else ""))
for a in ambiguous:
    print("  ambiguous — " + a)

unused = sorted(set(have) - {slug(n) for n in re.findall(r'<span class="member-name">([^<]+)</span>', s)}
                - {os.path.splitext(os.path.basename(v))[0] for v in [find(n)[0] for n in
                   re.findall(r'<span class="member-name">([^<]+)</span>', s)] if v})
if unused:
    print("photos matching nobody (check the filename): " + ", ".join(unused))
