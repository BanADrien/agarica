"""Ajoute les lettres A / B / C (et un titre) à une planche de propositions de design, sur un fond
uni, pour l'envoyer à l'utilisateur. La planche source n'est pas modifiée.

    python tools/planche_abc.py <planche.png> "Titre" [--out fichier.png] [--variantes 3]

Sortie : `<planche>_abc.png` à côté de la source (ou --out). Voir le skill `codex-images`.
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFont


def font(size):
    for name in ('arialbd.ttf', 'arial.ttf', 'DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('planche')
    ap.add_argument('titre')
    ap.add_argument('--out', default='')
    ap.add_argument('--variantes', type=int, default=3)
    a = ap.parse_args()
    src = Image.open(a.planche).convert('RGBA')
    box = src.getbbox() or (0, 0, src.width, src.height)
    # On rogne en hauteur seulement : les cases gardent leur largeur, donc l'ordre A / B / C.
    src = src.crop((0, max(0, box[1] - 20), src.width, min(src.height, box[3] + 20)))
    head, foot = 70, 60
    out = Image.new('RGB', (src.width, src.height + head + foot), (62, 84, 108))
    out.paste(src, (0, head), src)
    d = ImageDraw.Draw(out)
    d.text((24, 16), a.titre, font=font(34), fill=(255, 255, 255))
    cell = src.width / a.variantes
    for i in range(a.variantes):
        letter = 'ABCDEF'[i]
        f = font(40)
        w = d.textlength(letter, font=f)
        d.text((cell * (i + 0.5) - w / 2, head + src.height + 6), letter, font=f, fill=(255, 226, 150))
    path = a.out or os.path.splitext(a.planche)[0] + '_abc.png'
    out.save(path)
    print(path)


if __name__ == '__main__':
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, 'reconfigure'):
            st.reconfigure(encoding='utf-8', errors='replace')
    main()
