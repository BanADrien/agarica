"""Liste les images du jeu qui ne sont pas encore en pixel art, par dossier.

Usage :  python tools/pixel_restant.py [--all]
Compare assets/ au registre src/data/pixel_fixed.js. Ignore les originaux gardés,
les planches sources Codex et les images déjà fabriquées en pixel art par
d'autres outils (branches, îles, portail, feu de camp).
"""
import collections
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = ('assets/_pixelfix_originals', 'assets/_codex_src', 'assets/_codex_ref', 'assets/decors/branches_pixel',
        'assets/decors/fonds/iles_', 'assets/decors/elements/portail_frames', 'assets/items/feu_de_camp_frames')


def remaining():
    reg = set(re.findall(r'"(assets/[^"]+)"', open(os.path.join(ROOT, 'src', 'data', 'pixel_fixed.js'), encoding='utf-8').read()))
    todo = collections.defaultdict(list)
    for d, _, files in os.walk(os.path.join(ROOT, 'assets')):
        rel = os.path.relpath(d, ROOT).replace(os.sep, '/')
        if rel.startswith(SKIP):
            continue
        for f in sorted(files):
            if f.lower().endswith(('.png', '.jpg', '.webp')) and f'{rel}/{f}' not in reg:
                todo[rel].append(f)
    return todo


if __name__ == '__main__':
    todo = remaining()
    full = '--all' in sys.argv
    for d in sorted(todo):
        print(len(todo[d]), d, '' if full else todo[d][:3])
        if full:
            for f in todo[d]:
                print('   ', f)
    print(sum(len(v) for v in todo.values()), 'image(s) restantes')
