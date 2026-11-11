"""Fabrique les images en pixel art des branches et des troncs du grand arbre.

Usage :  python tools/bake_branches.py

Lance le jeu sans fenêtre avec `?bake` : BrancheKit assemble chaque branche et
chaque tronc avec l'art d'origine, puis pixelise l'image finale avec pixel-fixer
(tools/pixel-fixer/pixelclean-core.js, injecté ici ; réglages dans BrancheKit :
BRANCHE_PIXEL, BRANCHE_PALETTE). Chaque image est enregistrée dans
assets/decors/branches_pixel/ et la liste dans src/data/branches_pixel.js.
À relancer dès qu'une branche ou un tronc change dans une zone.
"""
import base64
import json
import os
import shutil
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import playtest  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

ROOT = playtest.ROOT
OUT = os.path.join(ROOT, 'assets', 'decors', 'branches_pixel')
LIST = os.path.join(ROOT, 'src', 'data', 'branches_pixel.js')
PORT = 8840
SKIP = {'BootScene', 'EditorScene', 'PlaytestScene', 'CampfireMenuScene', 'DialogueScene', 'InventoryScene',
        'MapScene', 'PauseScene', 'ShopScene', 'OptionsScene', 'ControlsScene', 'CreditsScene', 'EndScreenScene',
        'PrologueScene', 'TitleScene'}

COLLECT = """() => {
  const t = window.__game.textures, out = { branches: {}, images: {} };
  for (const [key, meta] of BRANCHE_META) out.branches[key] = meta;
  for (const key of t.getTextureKeys()) {
    if (!key.startsWith('autotile-branche-') && !key.startsWith('tronc-')) continue;
    out.images[key] = t.get(key).getSourceImage().toDataURL('image/png');
  }
  return out;
}"""


def main():
    httpd = playtest.serve(PORT)
    errors = []
    branches, files = {}, {}
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        page = browser.new_page(viewport={'width': 960, 'height': 540})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{PORT}/index.html?bake')
        page.add_script_tag(path=os.path.join(ROOT, 'tools', 'pixel-fixer', 'pixelclean-core.js'))
        page.wait_for_function(
            "window.__game && window.__game.scene.getScenes(true).some(s => s.scene.key !== 'BootScene')",
            timeout=180000)
        time.sleep(0.5)
        if not page.evaluate("typeof PixelClean !== 'undefined' && !!PixelClean.process"):
            raise SystemExit('pixel-fixer introuvable dans la page')
        for key in page.evaluate("window.__game.scene.scenes.map(s => s.scene.key)"):
            if key in SKIP:
                continue
            page.evaluate(
                "(k) => { const g = window.__game; for (const s of g.scene.getScenes(true)) g.scene.stop(s.scene.key);"
                " g.scene.start(k, {}); }", key)
            page.wait_for_function(
                "(k) => { const s = window.__game.scene.getScene(k); return !!(s && s.player); }",
                arg=key, timeout=120000)
            got = page.evaluate(COLLECT)
            new = 0
            for k, url in got['images'].items():
                if k in files:
                    continue
                with open(os.path.join(OUT, k + '.png'), 'wb') as f:
                    f.write(base64.b64decode(url.split(',', 1)[1]))
                files[k] = f'assets/decors/branches_pixel/{k}.png'
                new += 1
            branches.update(got['branches'])
            if new:
                print(f'{key} : {new} image(s)')
        browser.close()
    httpd.shutdown()
    with open(LIST, 'w', encoding='utf-8', newline='\n') as f:
        f.write('// GÉNÉRÉ par tools/bake_branches.py -- ne pas modifier à la main.\n')
        f.write('// Branches et troncs du grand arbre en pixel art (images toutes faites, cf. BrancheKit).\n')
        f.write('const BRANCHES_PIXEL = ' + json.dumps({'branches': branches, 'files': files}, indent=1, sort_keys=True) + ';\n')
    print(f'{len(files)} image(s) -> {os.path.relpath(OUT, ROOT)}')
    if errors:
        print('ERREURS JS :', *errors, sep='\n  ')
        sys.exit(1)


if __name__ == '__main__':
    main()
