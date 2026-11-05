#!/usr/bin/env python3
"""
Face-aware square cropper for member headshots.

    python3 tools/crop_headshots.py <inputDir> [outputDir]

Finds the largest face in each photo and crops a square around it with the eyes
about 38% down -- standard headshot framing -- then writes a 520px JPEG named
after the file. Re-encoding also drops EXIF, which matters: phone photos carry
GPS coordinates.

Name each input file after the member ("Harsith Thokala.jpg", "harsith_thokala.heic");
the name is slugified, so spaces, case and underscores don't matter.

Needs the venv and model set up by tools/setup-headshots.sh.
Photos with no detected face still get written, from a top-biased centre crop,
and are listed at the end so they can be checked.
"""
import os, re, sys, glob
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get("YUNET_MODEL", os.path.join(HERE, "yunet.onnx"))
OUT_SIZE = 520
EXTS = (".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".tif", ".tiff", ".JPG", ".JPEG", ".PNG", ".HEIC")

def slug(name):
    base = os.path.splitext(os.path.basename(name))[0]
    s = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")
    return s or "member"

def read(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is not None:
        return img
    # HEIC and friends: let sips transcode to a temp PNG first
    tmp = "/tmp/_hs_tmp.png"
    if os.system(f'sips -s format png "{path}" --out {tmp} >/dev/null 2>&1') == 0:
        return cv2.imread(tmp, cv2.IMREAD_COLOR)
    return None

def largest_face(img):
    h, w = img.shape[:2]
    # YuNet wants a sane input size; downscale big photos so detection is quick
    scale = 1024 / max(h, w) if max(h, w) > 1024 else 1.0
    small = cv2.resize(img, (int(w * scale), int(h * scale))) if scale != 1.0 else img
    sh, sw = small.shape[:2]
    det = cv2.FaceDetectorYN.create(MODEL, "", (sw, sh), score_threshold=0.6)
    det.setInputSize((sw, sh))
    _, faces = det.detect(small)
    if faces is None or len(faces) == 0:
        return None
    f = max(faces, key=lambda f: f[2] * f[3])        # x, y, w, h, landmarks...
    return [v / scale for v in f[:4]]

def crop(path, outdir):
    img = read(path)
    if img is None:
        return "fail", None
    H, W = img.shape[:2]
    face = largest_face(img)

    if face:
        fx, fy, fw, fh = face
        # ~3.1x the face height frames head and shoulders without the whole torso
        side = min(min(W, H), fh * 3.1)
        cx = fx + fw / 2
        eye_y = fy + fh * 0.42                        # eyes sit above face centre
        x0, y0 = cx - side / 2, eye_y - side * 0.38   # eyes land 38% down
        status = "ok"
    else:
        side = min(W, H)
        x0, y0 = (W - side) / 2, min(H * 0.06, max(0, H - side))
        status = "noface"

    x0 = int(max(0, min(x0, W - side)))
    y0 = int(max(0, min(y0, H - side)))
    side = int(side)
    out = cv2.resize(img[y0:y0 + side, x0:x0 + side], (OUT_SIZE, OUT_SIZE), interpolation=cv2.INTER_AREA)
    dest = os.path.join(outdir, slug(path) + ".jpg")
    cv2.imwrite(dest, out, [cv2.IMWRITE_JPEG_QUALITY, 88])
    return status, dest

def main():
    if len(sys.argv) < 2:
        sys.exit("usage: crop_headshots.py <inputDir> [outputDir]")
    indir = sys.argv[1]
    outdir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "public", "img", "eboard")
    outdir = os.path.abspath(outdir)
    os.makedirs(outdir, exist_ok=True)

    files = sorted(f for f in glob.glob(os.path.join(indir, "*")) if f.endswith(EXTS))
    if not files:
        sys.exit(f"no images in {indir}")

    ok, noface, failed = [], [], []
    for f in files:
        status, dest = crop(f, outdir)
        {"ok": ok, "noface": noface, "fail": failed}[status].append(os.path.basename(dest or f))
        print(f"  {status:7} {os.path.basename(f)}  ->  {os.path.basename(dest) if dest else '-'}")

    print(f"\n{len(ok)} face-cropped, {len(noface)} no face, {len(failed)} failed")
    if noface:
        print("check framing by hand: " + ", ".join(noface))
    if failed:
        print("could not read: " + ", ".join(failed))

if __name__ == "__main__":
    main()
