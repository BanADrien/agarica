"""Prépare le dossier à mettre en ligne sur Netlify (ou tout hébergeur statique).

Usage :
    python tools/build_netlify.py            -> crée dist/ (et dist.zip avec --zip)

Ne copie que ce que le jeu charge : index.html, src/ et assets/ SANS les sources
Codex (assets/_codex_src, assets/_codex_ref : planches d'origine, jamais lues par
le jeu). Le reste du dépôt (docs, outils, prototype, histoire, archives .zip)
n'a rien à faire en ligne.

Ajoute aussi :
- `_headers` (Netlify) : images et scripts mis en cache, index.html toujours
  revalidé, pour qu'une nouvelle version se voie sans vider le cache ;
- `netlify.toml` minimal (dossier publié = racine de dist, pas de build).

Contrôle la casse des chemins : Netlify tourne sous Linux, sensible à la casse,
alors que Windows ne l'est pas. Un `assets/Foo.png` demandé `assets/foo.png`
marche en local et casse en ligne. Le script liste les chemins écrits en dur
dans src/ et asset_present.js qui ne correspondent pas EXACTEMENT au disque.
"""
import argparse
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
# _pixelfix_originals : originaux IA mis de côté par tools/pixelfix.js.
SKIP_ASSET_DIRS = {'_codex_src', '_codex_ref', '_pixelfix_originals'}

HEADERS = """/*.html
  Cache-Control: public, max-age=0, must-revalidate
/
  Cache-Control: public, max-age=0, must-revalidate
/src/*
  Cache-Control: public, max-age=0, must-revalidate
/assets/*
  Cache-Control: public, max-age=86400
"""

TOML = """# Site statique : pas de commande de build, on publie dist/ tel quel.
[build]
  publish = "."
"""


def exact_case_exists(rel):
    """Vrai si `rel` (séparateurs /) existe avec EXACTEMENT cette casse."""
    cur = ROOT
    for part in rel.split('/'):
        if not part:
            continue
        try:
            entries = os.listdir(cur)
        except OSError:
            return False
        if part not in entries:
            return False
        cur = os.path.join(cur, part)
    return True


def check_case():
    """Chemins 'assets/...' littéraux du code et de asset_present.js."""
    pat = re.compile(r"""['"`](assets/[^'"`$]+?\.(?:png|jpg|jpeg|webp|json|mp3|ogg|wav))['"`]""")
    bad = []
    for base, _dirs, files in os.walk(os.path.join(ROOT, 'src')):
        for f in files:
            if not f.endswith('.js'):
                continue
            path = os.path.join(base, f)
            with open(path, encoding='utf-8', errors='replace') as fh:
                for m in pat.finditer(fh.read()):
                    rel = m.group(1)
                    if os.path.exists(os.path.join(ROOT, rel)) and not exact_case_exists(rel):
                        bad.append((os.path.relpath(path, ROOT), rel))
    return bad


def ignore_assets(directory, names):
    if os.path.basename(directory) == 'assets':
        return [n for n in names if n in SKIP_ASSET_DIRS]
    return []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--zip', action='store_true', help='crée aussi dist.zip')
    args = ap.parse_args()

    bad = check_case()
    if bad:
        print('Chemins à la mauvaise casse (casseraient en ligne) :')
        for src, rel in bad:
            print(f'  {src} : {rel}')
    else:
        print('Casse des chemins : OK')

    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    shutil.copy2(os.path.join(ROOT, 'index.html'), DIST)
    shutil.copytree(os.path.join(ROOT, 'src'), os.path.join(DIST, 'src'),
                    ignore=shutil.ignore_patterns('_backup', '__pycache__'))
    shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(DIST, 'assets'), ignore=ignore_assets)
    with open(os.path.join(DIST, '_headers'), 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(HEADERS)
    with open(os.path.join(DIST, 'netlify.toml'), 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(TOML)

    total = count = 0
    for base, _dirs, files in os.walk(DIST):
        for f in files:
            total += os.path.getsize(os.path.join(base, f))
            count += 1
    print(f'dist/ : {count} fichiers, {total / 1e6:.0f} Mo')

    if args.zip:
        out = shutil.make_archive(os.path.join(ROOT, 'dist'), 'zip', DIST)
        print(f'archive : {out} ({os.path.getsize(out) / 1e6:.0f} Mo)')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
