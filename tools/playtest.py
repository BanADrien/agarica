"""Harnais de test headless (Edge via Playwright Python) pour Legend of Agarica.

Usage :
    python tools/playtest.py --port 8801 --scene Zone1Scene --wait 3 \
        --flags hasWolfForm=true --js "window.__game.scene.getScenes(true).map(s=>s.scene.key)" \
        --keys "ArrowRight:1500,Space:100" --shot out.png

- Sert la racine du projet sur --port (serveur statique en lecture seule, pas
  le dev_server.py qui sait réécrire les fichiers de zone).
- Ouvre index.html, attend que BootScene ait fini, puis (optionnel) pose des
  flags dans le registre Phaser et démarre --scene directement (avec
  --scene-data en JSON).
- --keys : séquence "Touche:durée_ms" (keydown, attente, keyup), séparées par
  des virgules ; "wait:500" pour juste attendre.
- --js : expression(s) évaluée(s) dans la page (répétable), résultat affiché.
- Affiche TOUTES les erreurs JS (pageerror + console.error) : le code de sortie
  vaut 1 s'il y en a, pour servir de test de non-régression rapide.

Chaque agent/développeur doit utiliser son propre --port pour ne pas entrer
en conflit avec un autre test en parallèle.
"""
import argparse
import functools
import http.server
import json
import os
import sys
import threading
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def serve(port):
    handler = functools.partial(QuietHandler, directory=ROOT)
    httpd = http.server.ThreadingHTTPServer(('127.0.0.1', port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def parse_value(raw):
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8801)
    ap.add_argument('--query', default='', help="ex: 'editor' -> index.html?editor")
    ap.add_argument('--scene', default=None)
    ap.add_argument('--scene-data', default='{}')
    ap.add_argument('--flags', action='append', default=[], help='cle=valeurJSON (registre Phaser)')
    ap.add_argument('--wait', type=float, default=2.0, help='secondes apres demarrage de la scene')
    ap.add_argument('--keys', default='')
    ap.add_argument('--js', action='append', default=[])
    ap.add_argument('--shot', default=None, help='chemin du screenshot final')
    ap.add_argument('--headed', action='store_true')
    args = ap.parse_args()

    httpd = serve(args.port)
    errors = []
    logs = []
    url = f'http://127.0.0.1:{args.port}/index.html' + (f'?{args.query}' if args.query else '')
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=not args.headed)
        page = browser.new_page(viewport={'width': 960, 'height': 540})
        page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))

        def on_console(msg):
            if msg.type == 'error':
                text = msg.text
                # Les 404 d'assets pas encore generes (Codex) ne sont pas des bugs.
                if 'Failed to load resource' in text or 'Failed to process file' in text:
                    logs.append(f'[asset manquant] {text}')
                else:
                    errors.append(f'console.error: {text}')
            elif msg.type in ('warning', 'log'):
                logs.append(f'[{msg.type}] {msg.text}')
        page.on('console', on_console)

        page.goto(url)
        page.wait_for_function(
            "window.__game && window.__game.scene && window.__game.scene.getScenes(true).length > 0",
            timeout=120000)
        # Laisse BootScene finir son preload.
        page.wait_for_function(
            "(() => { const b = window.__game.scene.getScene('BootScene'); return b && b.sys.settings.status >= Phaser.Scenes.RUNNING && !b.load.isLoading(); })() || window.__game.scene.getScenes(true).some(s => s.scene.key !== 'BootScene')",
            timeout=180000)
        time.sleep(0.5)

        flags = {}
        for f in args.flags:
            k, _, v = f.partition('=')
            flags[k] = parse_value(v)
        if flags:
            page.evaluate("(flags) => { for (const [k, v] of Object.entries(flags)) window.__game.registry.set(k, v); }", flags)

        if args.scene:
            page.evaluate(
                """([key, data]) => {
                    const g = window.__game;
                    for (const s of g.scene.getScenes(true)) { if (s.scene.key !== key) g.scene.stop(s.scene.key); }
                    g.scene.start(key, data);
                }""",
                [args.scene, json.loads(args.scene_data)])
        time.sleep(args.wait)

        for step in [s for s in args.keys.split(',') if s.strip()]:
            key, _, dur = step.strip().partition(':')
            dur = int(dur or 100)
            if key == 'wait':
                time.sleep(dur / 1000)
                continue
            page.keyboard.down(key)
            time.sleep(dur / 1000)
            page.keyboard.up(key)

        for expr in args.js:
            try:
                res = page.evaluate(expr)
                print(f'JS> {expr}\n  = {json.dumps(res, ensure_ascii=False, default=str)[:4000]}')
            except Exception as e:  # noqa: BLE001
                errors.append(f'js-eval error: {e}')

        if args.shot:
            page.screenshot(path=args.shot)
            print(f'screenshot: {args.shot}')
        browser.close()
    httpd.shutdown()

    for line in logs[-40:]:
        print(line)
    if errors:
        print(f'\n{len(errors)} ERREUR(S) JS :')
        for e in errors:
            print('  ' + e)
        sys.exit(1)
    print('\nOK : aucune erreur JS')


if __name__ == '__main__':
    main()
