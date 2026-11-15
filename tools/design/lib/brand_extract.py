"""Helper for tools/design/extract-brand-assets.mjs (spec 003 research R1). Never redraws artwork.

Usage: python -I brand_extract.py <page2.png> <page3.png> <pdfimages-dir> <out-dir> <dpi>

1. Finds the bounds of each logo version on the rendered guide pages and prints them as PDF points
   (JSON on stdout). The caller only uses them to set an SVG viewBox; artwork paths are never touched.
2. Recombines each of the 5 mascot images with its own transparency mask and scales it in proportion.
"""
import json
import sys

from PIL import Image

p2, p3, imgdir, out, dpi = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5])
PT = 72.0 / dpi  # pixels → PDF points


def near(c, ref, tol=28):
    return all(abs(int(a) - int(b)) <= tol for a, b in zip(c[:3], ref))


def bbox_not(img, box, bg, skip_top=0):
    """Bounding box of pixels inside `box` that differ from `bg`, ignoring the top `skip_top` px."""
    x0, y0, x1, y1 = box
    px = img.load()
    minx, miny, maxx, maxy = x1, y1, x0, y0
    for y in range(y0 + skip_top, y1):
        for x in range(x0, x1, 2):
            if not near(px[x, y], bg):
                minx, maxx = min(minx, x), max(maxx, x)
                miny, maxy = min(miny, y), max(maxy, y)
    return minx, miny, maxx, maxy


def find_rect(img, colour, region):
    """Bounding box of a solid-colour panel inside region."""
    return bbox_inv(img, region, colour)


def bbox_inv(img, box, colour):
    x0, y0, x1, y1 = box
    px = img.load()
    minx, miny, maxx, maxy = x1, y1, x0, y0
    for y in range(y0, y1, 2):
        for x in range(x0, x1, 2):
            if near(px[x, y], colour, 10):
                minx, maxx = min(minx, x), max(maxx, x)
                miny, maxy = min(miny, y), max(maxy, y)
    return minx, miny, maxx, maxy


def pad(b, p, limit):
    x0, y0, x1, y1 = b
    return max(limit[0], x0 - p), max(limit[1], y0 - p), min(limit[2], x1 + p), min(limit[3], y1 + p)


def to_pt(b):
    x0, y0, x1, y1 = b
    return [round(x0 * PT, 2), round(y0 * PT, 2), round((x1 - x0) * PT, 2), round((y1 - y0) * PT, 2)]


WHITE, YELLOW, BROWN = (255, 255, 255), (251, 206, 22), (62, 35, 18)
result = {}

# --- page 2: logo on white (white panel inside a yellow border; "LOGO" label at top-left)
im2 = Image.open(p2).convert("RGB")
W2, H2 = im2.size
panel = find_rect(im2, WHITE, (0, 0, W2, H2))
skip = int((panel[3] - panel[1]) * 0.12)  # skip the page label row
art = bbox_not(im2, panel, WHITE, skip_top=skip)
margin = int((art[3] - art[1]) * 0.08)
result["logo-on-white"] = to_pt(pad(art, margin, panel))

# --- page 3: logo on yellow (left) and logo on Mane Brown (right box)
im3 = Image.open(p3).convert("RGB")
W3, H3 = im3.size
brown = find_rect(im3, BROWN, (W3 // 2, 0, W3, H3))
result["logo-on-brown"] = to_pt(brown)
left = (0, 0, brown[0] - 4, H3)
art_y = bbox_not(im3, left, YELLOW, skip_top=int(H3 * 0.12))
margin = int((art_y[3] - art_y[1]) * 0.08)
result["logo-on-yellow"] = to_pt(pad(art_y, margin, left))

# --- app icon: the cub + K coin only (rows above the first blank gap before the wordmark)
px = im3.load()
x0, y0, x1, y1 = art_y
rows = [any(not near(px[x, y], YELLOW) for x in range(x0, x1, 2)) for y in range(y0, y1)]
gap = next((i for i in range(int(len(rows) * 0.4), len(rows)) if not rows[i]), len(rows))
cub = bbox_not(im3, (x0, y0, x1, y0 + gap), YELLOW)
m = int((cub[3] - cub[1]) * 0.06)
side = max(cub[2] - cub[0], cub[3] - cub[1]) + 2 * m
cx = (cub[0] + cub[2]) // 2
bottom = cub[3] + 2  # square ends just below the cub, above the wordmark gap
result["app-icon"] = to_pt((cx - side // 2, bottom - side, cx + side // 2, bottom))

# --- mascots: recombine each image with its mask, scale in proportion to 640 px tall
names = ["wave", "celebrate", "headphones", "fist", "thumbs-up"]
for i, name in enumerate(names):
    img = Image.open(f"{imgdir}/m-{2 * i:03d}.png").convert("RGB")
    mask = Image.open(f"{imgdir}/m-{2 * i + 1:03d}.png").convert("L")
    if mask.size != img.size:
        mask = mask.resize(img.size, Image.LANCZOS)
    img.putalpha(mask)
    alpha_box = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    img = img.crop(alpha_box)  # trims fully transparent margin only
    h = 640
    w = round(img.width * h / img.height)
    img = img.resize((w, h), Image.LANCZOS)
    img.save(f"{out}/kudi-{name}.webp", quality=88, method=6)          # used by the prototype (640 px)
    fallback = img.resize((round(w / 2), 320), Image.LANCZOS)            # PNG fallback, 320 px, palette-quantised
    fallback.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(f"{out}/kudi-{name}.png", optimize=True)
    result[f"kudi-{name}"] = [w, h]

print(json.dumps(result))
