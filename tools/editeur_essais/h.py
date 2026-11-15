"""Harnais de travail (un seul navigateur sans fenetre a la fois)."""
import contextlib, functools, http.server, json, os, sys, threading, time
from playwright.sync_api import sync_playwright
ROOT = r'C:\Users\adrie\Documents\projet\agarica'
S = os.path.dirname(os.path.abspath(__file__))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
class Roomy(http.server.ThreadingHTTPServer):
    request_queue_size = 512

@contextlib.contextmanager
def session(port=9781, query='', w=960, h=540, server=True, wait_boot=True):
    httpd = None
    if server:
        httpd = Roomy(('127.0.0.1', port), functools.partial(Quiet, directory=ROOT))
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
    errors, logs = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(channel='msedge', headless=True)
        page = b.new_page(viewport={'width': w, 'height': h})
        page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
        def on_console(msg):
            if msg.type == 'error':
                t = msg.text
                (logs if ('Failed to load resource' in t or 'Failed to process file' in t) else errors).append(t)
            elif msg.type in ('warning',): logs.append(msg.text)
        page.on('console', on_console)
        page.goto(f'http://127.0.0.1:{port}/index.html' + (('?' + query) if query else ''))
        if wait_boot:
            page.wait_for_function("window.__game && window.__game.scene && window.__game.scene.getScenes(true).length > 0", timeout=120000)
            page.wait_for_function("window.__game.scene.getScenes(true).some(s => s.scene.key !== 'BootScene')", timeout=180000)
            time.sleep(0.5)
        try:
            yield page, errors, logs
        finally:
            b.close()
            if httpd: httpd.shutdown()

import shutil, subprocess, glob

@contextlib.contextmanager
def serveur_essai(port=9782, nom='donnees_essai', neuf=True):
    """Lance tools/dev_server.py sur une COPIE des fichiers de zone (jamais src/data)."""
    d = os.path.join(S, nom)
    if neuf and os.path.isdir(d): shutil.rmtree(d)
    os.makedirs(d, exist_ok=True)
    if neuf:
        for f in glob.glob(os.path.join(ROOT, 'src', 'data', '*_data.js')):
            shutil.copy2(f, d)
    journal = open(os.path.join(S, 'serveur_essai.log'), 'w', encoding='utf-8')
    p = subprocess.Popen([sys.executable, os.path.join(ROOT, 'tools', 'dev_server.py'), str(port), '--donnees', d],
                         stdout=journal, stderr=subprocess.STDOUT, cwd=ROOT)
    time.sleep(1.2)
    try:
        yield d
    finally:
        p.terminate()
        try: p.wait(5)
        except Exception: p.kill()


def attendre_editeur(page, errors, delai=90):
    """Attend que la scène de l'éditeur soit prête ; en cas d'attente trop longue, montre les erreurs JS."""
    t0 = time.time()
    while time.time() - t0 < delai:
        try:
            if page.evaluate("typeof Editeur !== 'undefined' && !!(Editeur.etat.scene && Editeur.etat.scene.pret)"):
                time.sleep(1.0)
                return True
        except Exception as e:
            print('evaluate:', e)
        if errors:
            time.sleep(1.5)
            break
        time.sleep(0.4)
    print('ÉDITEUR PAS PRÊT. erreurs JS :')
    for e in errors[:12]: print('   ', e[:600])
    try:
        print('   scenes actives :', page.evaluate("window.__game ? window.__game.scene.getScenes(true).map(s => s.scene.key) : 'pas de jeu'"))
    except Exception as e:
        print('   ', e)
    return False
