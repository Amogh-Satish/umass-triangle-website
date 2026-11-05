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

s = open(PAGE).read()
wired, missing = [], []

for name in re.findall(r'<span class="member-name">([^<]+)</span>', s):
    src = have.get(slug(name))
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
