"""
Builds every FrameMind AI Studio logo file from the 4K icon renders in .assets-raw/ (not committed).

  python scripts/brand-assets.py

The icon is shared with 360VUE (one icon for both companies; the wordmarks differ). It was upscaled to 4096 px and cut
out with Higgsfield:
  .assets-raw/icon-4k-dark.png                 the icon on its dark background, 4096 × 4096
  .assets-raw/icon-4k-transparent-clean.png    the same, cut out (transparent), 4096 × 4096

The wordmark is set in Montserrat here, not generated, so the letters are always exact:
  "Frame" white (or ink on light) + "Mind" in the gold gradient, "AI STUDIO" between two rules,
  "DESIGN • SOFTWARE • AI SOLUTIONS" with gold dots.

Outputs to public/brand/kit/ (the 4K kit in HQ → Brand Kit), public/brand/ (the files HQ and the website use),
the favicons and app icons, and the social share image.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / ".assets-raw"
PUB = ROOT / "public"
OUT = PUB / "brand"
KIT = OUT / "kit"
KIT.mkdir(parents=True, exist_ok=True)
FONT = str(RAW / "fonts" / "Montserrat.ttf")

INK = (13, 13, 13)          # FrameMind ink (#0D0D0D)
PAPER = (245, 244, 240)     # FrameMind paper (#F5F4F0)
WHITE = (250, 250, 252)
DARK_TEXT = (17, 17, 20)
# gold of "Mind", sampled from the reference logo
GOLD_ON_DARK = [(0.0, (255, 232, 150)), (0.5, (247, 196, 72)), (1.0, (234, 152, 28))]
GOLD_ON_LIGHT = [(0.0, (226, 164, 52)), (0.5, (206, 132, 24)), (1.0, (166, 96, 18))]
# "AI STUDIO"
LAVENDER_ON_DARK = [(0.0, (214, 207, 250)), (1.0, (160, 146, 232))]
VIOLET_ON_LIGHT = [(0.0, (124, 98, 226)), (1.0, (90, 62, 196))]
DOT = (249, 196, 34)


def font(size, weight="Bold"):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_name(weight)
    return f


def gradient(w, h, stops):
    """Vertical gradient image (RGB), stops as (t, colour)."""
    g = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0) if t1 > t0 else 0
                g.putpixel((0, y), tuple(round(a + (b - a) * k) for a, b in zip(c0, c1)))
                break
    return g.resize((w, h))


def text_width(f, s, tracking=0):
    return sum(f.getlength(ch) for ch in s) + tracking * (len(s) - 1)


def draw_text(img, xy, s, f, fill, tracking=0, grad_top=None, grad_h=None):
    """Draws text letter by letter (exact tracking). fill: a colour, or a list of gradient stops."""
    x, y = xy
    mask = Image.new("L", img.size, 0)
    md = ImageDraw.Draw(mask)
    for ch in s:
        md.text((x, y), ch, font=f, fill=255)
        x += f.getlength(ch) + tracking
    if isinstance(fill, list):
        asc = f.getmetrics()[0]
        top = int(grad_top if grad_top is not None else y)
        h = int(grad_h or asc)
        layer = Image.new("RGB", img.size, fill[-1][1])
        layer.paste(gradient(img.width, h, fill), (0, top))
        layer.paste(Image.new("RGB", (img.width, max(1, top)), fill[0][1]), (0, 0))
        img.paste(layer, (0, 0), mask)
    else:
        img.paste(Image.new("RGBA", img.size, tuple(fill) + (255,)), (0, 0), mask)
    return x


def icon(kind="color"):
    im = Image.open(RAW / "icon-4k-transparent-clean.png").convert("RGBA")
    im = im.crop(im.getbbox())
    if kind == "mono":
        # one tone: the icon's own light and shade in grey, for one-colour print
        a = im.split()[-1]
        g = ImageOps.autocontrast(im.convert("L"), cutoff=1)
        mono = Image.merge("RGBA", (g, g, g, a))
        return mono
    return im


def square_icon(im, side):
    """The icon centred in a square, keeping its proportions."""
    w, h = im.size
    s = side / max(w, h)
    r = im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.alpha_composite(r, ((side - r.width) // 2, (side - r.height) // 2))
    return sq


def wordmark(img, cx, top, size, frame_fill, mind_stops):
    """'Frame' + 'Mind' centred on cx. Returns (bottom y, width)."""
    f = font(size, "Bold")
    tr = -size * 0.01
    wf = text_width(f, "Frame", tr)
    wm = text_width(f, "Mind", tr)
    total = wf + tr + wm
    x = cx - total / 2
    asc, _ = f.getmetrics()
    draw_text(img, (x, top), "Frame", f, frame_fill, tr)
    # the gold spans just the letters' height
    cap_top = top + asc * 0.22
    draw_text(img, (x + wf + tr, top), "Mind", f, mind_stops, tr, grad_top=cap_top, grad_h=int(asc * 0.8))
    return top + asc, total


def studio_line(img, cx, top, size, fill, rule_fill, span):
    """— AI STUDIO — : the words centred, a thin rule each side, out to `span` wide."""
    f = font(size, "Medium")
    tr = size * 0.55
    w = text_width(f, "AI STUDIO", tr)
    asc, _ = f.getmetrics()
    draw_text(img, (cx - w / 2, top), "AI STUDIO", f, fill, tr, grad_top=top + asc * 0.25, grad_h=int(asc * 0.75))
    d = ImageDraw.Draw(img)
    mid = top + asc * 0.62
    gap = size * 0.9
    lw = max(2, int(size * 0.06))
    rule_len = max(0, (span - w) / 2 - gap)
    if rule_len > size:
        d.line((cx - w / 2 - gap - rule_len, mid, cx - w / 2 - gap, mid), fill=rule_fill + (255,), width=lw)
        d.line((cx + w / 2 + gap, mid, cx + w / 2 + gap + rule_len, mid), fill=rule_fill + (255,), width=lw)
    return top + asc


def tagline(img, cx, top, size, fill, dot=DOT):
    """DESIGN • SOFTWARE • AI SOLUTIONS, with gold dots."""
    f = font(size, "Medium")
    tr = size * 0.42
    words = ["DESIGN", "SOFTWARE", "AI SOLUTIONS"]
    gap = size * 2.2
    widths = [text_width(f, w, tr) for w in words]
    total = sum(widths) + gap * 2 * (len(words) - 1)
    x = cx - total / 2
    asc, _ = f.getmetrics()
    d = ImageDraw.Draw(img)
    for i, w in enumerate(words):
        draw_text(img, (x, top), w, f, fill, tr)
        x += widths[i]
        if i < len(words) - 1:
            r = size * 0.16
            dx = x + gap
            dy = top + asc * 0.62
            d.ellipse((dx - r, dy - r, dx + r, dy + r), fill=dot + (255,))
            x += gap * 2
    return top + asc


def lockup(bg, tone, name, w=3840, h=3840, kind="color"):
    """The stacked logo: icon, FrameMind, AI STUDIO, tagline. tone: 'dark' (light letters) or 'light' or 'mono'."""
    img = Image.new("RGBA", (w, h), bg + (255,) if bg else (0, 0, 0, 0))
    em = icon("mono" if kind == "mono" else "color")
    es = int(h * 0.44)
    em = square_icon(em, es)
    top = int(h * 0.1)
    if bg == INK:
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse((w / 2 - es * 0.62, top - es * 0.08, w / 2 + es * 0.62, top + es * 1.08), fill=(240, 150, 60, 34))
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(es * 0.2)))
    img.alpha_composite(em, (w // 2 - es // 2, top))
    if tone == "dark":
        frame, mind, studio, rule, tag = WHITE, GOLD_ON_DARK, LAVENDER_ON_DARK, (225, 224, 232), (226, 225, 232)
    elif tone == "light":
        frame, mind, studio, rule, tag = DARK_TEXT, GOLD_ON_LIGHT, VIOLET_ON_LIGHT, (60, 60, 66), (52, 52, 58)
    else:  # mono
        frame, mind, studio, rule, tag = (38, 38, 38), [(0, (38, 38, 38)), (1, (38, 38, 38))], [(0, (70, 70, 70)), (1, (70, 70, 70))], (90, 90, 90), (70, 70, 70)
    y, word_w = wordmark(img, w / 2, top + es + h * 0.03, int(h * 0.128), frame, mind)
    y = studio_line(img, w / 2, y + h * 0.034, int(h * 0.043), studio, rule, word_w)
    tagline(img, w / 2, y + h * 0.05, int(h * 0.022), tag, DOT if tone != "mono" else (90, 90, 90))
    if bg is None:
        img = img.crop(pad_box(img, int(h * 0.04)))
    img.save(KIT / f"{name}.png", optimize=True)
    return img


def pad_box(img, p):
    l, t, r, b = img.getbbox()
    return (max(0, l - p), max(0, t - p), min(img.width, r + p), min(img.height, b + p))


def horizontal(bg, tone, name, w=4800, h=1280):
    """Icon left, FrameMind / AI STUDIO / tagline right."""
    img = Image.new("RGBA", (w, h), bg + (255,) if bg else (0, 0, 0, 0))
    es = int(h * 0.78)
    em = square_icon(icon(), es)
    left = int(h * 0.12)
    img.alpha_composite(em, (left, (h - es) // 2))
    if tone == "dark":
        frame, mind, studio, rule, tag = WHITE, GOLD_ON_DARK, LAVENDER_ON_DARK, (225, 224, 232), (226, 225, 232)
    else:
        frame, mind, studio, rule, tag = DARK_TEXT, GOLD_ON_LIGHT, VIOLET_ON_LIGHT, (60, 60, 66), (52, 52, 58)
    size = int(h * 0.3)
    f = font(size, "Bold")
    word_w = text_width(f, "Frame", -size * 0.01) + text_width(f, "Mind", -size * 0.01) - size * 0.01
    tx = left + es + h * 0.1
    cx = tx + word_w / 2
    top = h * 0.17
    y, _ = wordmark(img, cx, top, size, frame, mind)
    y = studio_line(img, cx, y + h * 0.05, int(h * 0.085), studio, rule, word_w)
    tagline(img, cx, y + h * 0.075, int(h * 0.043), tag)
    if bg:
        img = img.crop((0, 0, int(tx + word_w + h * 0.14), h))
    else:
        img = img.crop(pad_box(img, int(h * 0.05)))
    img.save(KIT / f"{name}.png", optimize=True)
    return img


def fit_width(img, width):
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


if __name__ == "__main__":
    # ── the universal icon (shared with 360VUE), 4K ──
    em = icon()
    square_icon(em, 4096).save(KIT / "framemind-icon-4k.png", optimize=True)
    square_icon(icon("mono"), 4096).save(KIT / "framemind-icon-mono-4k.png", optimize=True)
    on_ink = Image.new("RGBA", (4096, 4096), INK + (255,))
    on_ink.alpha_composite(square_icon(em, 3500), (298, 298))
    on_ink.convert("RGB").save(KIT / "framemind-icon-on-ink-4k.png", optimize=True)

    # ── logos, 4K ──
    lockup(INK, "dark", "framemind-logo-dark-4k")
    lockup(PAPER, "light", "framemind-logo-light-4k")
    lockup((236, 234, 230), "mono", "framemind-logo-mono-4k", kind="mono")
    dark_t = lockup(None, "dark", "framemind-logo-on-dark-transparent-4k")
    light_t = lockup(None, "light", "framemind-logo-on-light-transparent-4k")
    horizontal(INK, "dark", "framemind-horizontal-dark-4k")
    hz_dark = horizontal(None, "dark", "framemind-horizontal-on-dark-transparent-4k")
    horizontal(None, "light", "framemind-horizontal-on-light-transparent-4k")

    # ── the files HQ and the website use (same names, so every screen and print picks them up) ──
    mark = square_icon(em, 512)
    mark.save(OUT / "fm-mark-light.png", optimize=True)
    mark.save(OUT / "fm-mark-dark.png", optimize=True)
    fit_width(light_t, 1200).save(OUT / "fm-logo-light.png", optimize=True)
    fit_width(dark_t, 1200).save(OUT / "fm-logo-dark.png", optimize=True)
    for s, n in [(192, OUT / "icon-192.png"), (512, OUT / "icon-512.png"), (180, PUB / "apple-touch-icon.png")]:
        tile = Image.new("RGBA", (s, s), INK + (255,))
        es = int(s * 0.84)
        tile.alpha_composite(square_icon(em, es), ((s - es) // 2, (s - es) // 2))
        tile.save(n, optimize=True)
    square_icon(em, 64).save(PUB / "favicon.png", optimize=True)
    square_icon(em, 256).save(ROOT / "src" / "app" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    square_icon(em, 512).save(ROOT / "src" / "app" / "icon.png", optimize=True)
    Image.open(PUB / "apple-touch-icon.png").save(ROOT / "src" / "app" / "apple-icon.png")

    # the website's square logo (quote PDFs) and the social share image
    sq = Image.open(KIT / "framemind-logo-dark-4k.png").convert("RGB").resize((1600, 1600), Image.LANCZOS)
    sq.save(PUB / "site" / "framemind-logo.jpg", quality=92)
    og = Image.new("RGBA", (1200, 630), INK + (255,))
    hz = fit_width(hz_dark, 1040)
    og.alpha_composite(hz, ((1200 - hz.width) // 2, (630 - hz.height) // 2))
    og.convert("RGB").save(PUB / "og-image.png", optimize=True)
    # small previews for HQ → Brand Kit (the 4K files are for download)
    prev = KIT / "preview"
    prev.mkdir(exist_ok=True)
    for f in sorted(KIT.glob("*.png")):
        im = Image.open(f)
        im.thumbnail((900, 900), Image.LANCZOS)
        im.save(prev / (f.stem + ".webp"), quality=86)
    print("done")
