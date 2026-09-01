# -*- coding: utf-8 -*-
"""Convierte las fotos de Rocky a WebP de alta calidad, corrigiendo rotación EXIF."""
import sys
from pathlib import Path
from PIL import Image, ImageOps

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

SRC = Path(r"C:\Users\Milagros\Documents\Claude\rocky-hernando\assets\photos\source")
DST = Path(r"C:\Users\Milagros\Documents\Claude\rocky-hernando\assets\img")
DST.mkdir(parents=True, exist_ok=True)

# source -> (output, max_dim, quality)
M = {
    "lanin_2.jpg":                 ("hero-rocky.webp",          2400, 88),
    "montañismo_Denali.png":       ("rocky-denali.webp",        1700, 88),
    "machu_picchu_2.JPG":          ("rocky-salkantay.webp",     1700, 88),
    "lanin_3.jpg":                 ("rocky-lanin.webp",         1700, 88),
    "fisico2.jpg":                 ("rocky-fisico2.webp",       1600, 88),
    "fisico1.JPG":                 ("rocky-fisico.webp",        1600, 88),
    "fisico3.jpg":                 ("rocky-fisico3.webp",       1600, 88),
    "fisico4.jpg":                 ("rocky-fisico4.webp",       1600, 88),
    "lanin.jpg":                   ("rocky-lanin-ascenso.webp", 1700, 88),
    "machu_picchu.JPG":            ("rocky-machu.webp",         1600, 88),
    "machu_picchu_3.JPG":          ("rocky-machu3.webp",        1600, 88),
    "entrevista_RadioRivadavia.jpg":("rocky-rivadavia.webp",    1600, 88),
    "podcast_NoticiasDeSalud.png": ("rocky-podcast.webp",       1600, 88),
    "alumnos_1.jpg": ("alumno-1.webp", 1400, 86),
    "alumnos_2.JPG": ("alumno-2.webp", 1400, 86),
    "alumnos_3.JPG": ("alumno-3.webp", 1400, 86),
    "alumnos_4.JPG": ("alumno-4.webp", 1400, 86),
    "alumnos_5.jpg": ("alumno-5.webp", 1400, 86),
    "alumnos_6.JPG": ("alumno-6.webp", 1400, 86),
    "alumnos_7.JPG": ("alumno-7.webp", 1400, 86),
}

total = 0
for src_name, (out, maxd, q) in M.items():
    p = SRC / src_name
    if not p.exists():
        print("MISSING", src_name)
        continue
    im = Image.open(p)
    im = ImageOps.exif_transpose(im)   # aplica la rotación real de la foto
    im = im.convert("RGB")
    w, h = im.size
    if max(w, h) > maxd:
        if w >= h:
            nw, nh = maxd, round(h * maxd / w)
        else:
            nh, nw = maxd, round(w * maxd / h)
        im = im.resize((nw, nh), Image.LANCZOS)
    im.save(DST / out, "WEBP", quality=q, method=6)
    kb = round((DST / out).stat().st_size / 1024)
    total += kb
    print(f"{src_name} -> {out}  {im.size[0]}x{im.size[1]}  {kb}KB")

print(f"--- total {total}KB ---")
