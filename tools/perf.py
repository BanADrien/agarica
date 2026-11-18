"""Banc de performance de Legend of Agarica, sur le VRAI processeur graphique du PC.

    python tools/perf.py mesure                        6 zones, immobile puis en marchant
    python tools/perf.py mesure --zones fs1,lumiere --etats immobile
    python tools/perf.py mesure --racine C:/copie      mesure une autre version du code (src/ et index.html de ce dossier)
    python tools/perf.py mesure --query sansculling    ajoute des options à l'adresse du jeu
    python tools/perf.py comparer avant.json apres.json     tableau avant / après

Edge sans fenêtre, sans limite d'images ni synchronisation écran. Deux passes par état :
  - débit : images/s moyennes, file d'attente de la carte graphique comprise ;
  - détail : lecture d'un pixel après chaque image pour attendre la carte graphique, donc le coût réel d'une image
    (mise à jour + envoi du dessin + carte graphique) et son 95e centile. Sans cette attente, les images partent par
    rafales : seul le débit moyen a un sens, ni la médiane ni les centiles.

Ne touche à aucun fichier du projet. Serveur statique en lecture seule sur son propre port.
"""
import argparse
import functools
import http.server
import json
import os
import sys
import threading
import time
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# États d'histoire repris du robot (tools/robot/chemin.py) : aucune cinématique d'entrée ne bloque la mesure
_BASE = {'talismanOurs': True, 'aideFaite': True, 'idoleVolee': True, 'amaniteCouverte': True, 'banished': True, 'xaraMet': True,
         'unlockedSkills': ['ours'], 'skillSlots': ['ours', None, None], 'inventory': ['talisman_ours']}
_RAC = dict(_BASE, hasWolfForm=True, equippedForms=['wolf', None, None], planteVue=True)
_ARENE = dict(_RAC, hasMonkeyForm=True, airForm='monkey', equippedForms=['wolf', 'monkey', None], totemSingeActif=True, kainatiIntroSeen=True)
_FF1 = dict(_ARENE, kainatiDefeated=True, mondeSpirituelFini=True, geraltMet=True)
_FC1 = dict(_FF1, amaniteMet=True, hasEagleForm=True, fleurPrelevee=True, clairiereArrivee=True, morgatVue=True, crashDone=True, fc1Reveil=True)

ZONES = {
    'fs1': dict(nom='Forêt sombre 1', scene='ForetSombre1Scene', flags=_BASE),
    'lumiere': dict(nom='Forêt de lumière', scene='ForetLumiereScene', flags=_BASE),
    'racines': dict(nom='Racines du grand arbre', scene='GrandArbreRacinesScene', flags=_RAC),
    'ff1': dict(nom='Forêt flottante 1', scene='ForetFlottante1Scene', flags=_FF1),
    'fc1': dict(nom='Forêt corrompue', scene='ForetCorrompue1Scene', flags=_FC1, data={'enterId': 'from_crash'}),
    'arene': dict(nom='Arène de Kainati (zoom 1)', scene='GrandArbreAreneScene', flags=_ARENE, data={'enterId': 'from_racines'}),
}

ARGS_NAVIGATEUR = ['--headless=new', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync',
                   '--disable-frame-rate-limit', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
                   '--disable-backgrounding-occluded-windows']

# Mesure dans la page. marche : Agarica va et vient (touches simulées, 1,5 s dans chaque sens)
MESURE = r"""
async ([duree, avecFinish, marche]) => {
  const g = window.__game, r = g.renderer, gl = r.gl;
  const s = g.scene.getScenes(true).find((x) => x.physics && x.player) || g.scene.getScenes(true).find((x) => x.physics);
  const w = s.physics.world;
  let maj = 0, rendu = 0, gpu = 0, n = 0, pas = 0, phys = 0, dessins = 0, sommets = 0, debutImage = 0;
  const couts = [], unPixel = new Uint8Array(4);
  const oU = g.scene.update, oR = g.scene.render, oA = gl.drawArrays, oE = gl.drawElements;
  gl.drawArrays = function (m, f, c) { dessins++; sommets += c; return oA.call(gl, m, f, c); };
  gl.drawElements = function (m, c, t, o) { dessins++; sommets += c; return oE.call(gl, m, c, t, o); };
  // La physique est branchée sur l'événement update de la scène : on remplace l'écouteur à sa place
  const liste = [].concat(s.sys.events._events.update || []), ec = liste.find((e) => e.context === w);
  const oW = ec && ec.fn;
  if (ec) ec.fn = function (a, b) { const t = performance.now(); oW.call(w, a, b); phys += performance.now() - t; pas += w.stepsLastFrame; };
  g.scene.update = function (a, b) { const t = performance.now(); debutImage = t; oU.call(g.scene, a, b); maj += performance.now() - t; n++; };
  // Début du rendu juste avant scene.render ; fin après postRender (dernier lot envoyé), d'où l'événement POST_RENDER
  let debutRendu = 0;
  g.scene.render = function (a) { debutRendu = performance.now(); oR.call(g.scene, a); };
  const finRendu = () => {
    const t1 = performance.now(); rendu += t1 - debutRendu;
    // gl.finish() n'attend rien dans Chrome (c'est un simple flush) : lire un pixel oblige à attendre la carte graphique
    if (avecFinish) { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, unPixel); const t2 = performance.now(); gpu += t2 - t1; couts.push(t2 - debutImage); }
  };
  g.events.on('postrender', finRendu);
  const touche = (type, code, kc) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, keyCode: kc, which: kc, bubbles: true }));
  const D = ['ArrowRight', 39], G = ['ArrowLeft', 37];
  let sens = D, bascule = 0;
  if (marche) touche('keydown', ...sens);
  // Les images déjà envoyées sont terminées avant de démarrer le chronomètre, et celles de la mesure avant de l'arrêter :
  // sans limite d'images, le navigateur en garde des secondes en file d'attente
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, unPixel);
  n = 0; maj = 0; rendu = 0; gpu = 0; pas = 0; phys = 0; dessins = 0; sommets = 0; couts.length = 0;
  const d = []; let last = performance.now(); const t0 = last;
  const xs = [s.player ? s.player.x : 0];
  await new Promise((fin) => {
    const f = () => {
      const now = performance.now(); d.push(now - last); last = now;
      if (marche && now - t0 > (bascule + 1) * 1500) {
        bascule++; touche('keyup', ...sens); sens = sens === D ? G : D; touche('keydown', ...sens);
        if (s.player) xs.push(s.player.x);
      }
      if (now - t0 < duree) requestAnimationFrame(f); else fin();
    };
    requestAnimationFrame(f);
  });
  if (marche) touche('keyup', ...sens);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, unPixel);
  const ecoule = performance.now() - t0;
  g.events.off('postrender', finRendu);
  g.scene.update = oU; g.scene.render = oR; gl.drawArrays = oA; gl.drawElements = oE; if (ec) ec.fn = oW;
  const k = n || 1, q = (x) => +(x / k).toFixed(2);
  const t = [...couts].sort((a, b) => a - b), centile = (c) => (t.length ? +t[Math.floor(t.length * c)].toFixed(1) : 0);
  return { ips: +(n * 1000 / ecoule).toFixed(1), ms95: centile(0.95), ms99: centile(0.99),
    maj: q(maj), physique: q(phys), pas: q(pas), rendu: q(rendu), gpu: q(gpu), cout: q(maj + rendu + gpu), dessins: Math.round(dessins / k),
    sommets: Math.round(sommets / k), images: n, scene: s.scene.key, canvas: g.canvas.width + 'x' + g.canvas.height, objets: s.children.list.length,
    deplacement: xs.length > 1 ? Math.round(Math.max(...xs) - Math.min(...xs)) : 0 };
}
"""

DEMARRER = r"""
([cle, flags, data]) => {
  const g = window.__game;
  for (const [k, v] of Object.entries(flags)) g.registry.set(k, v);
  for (const s of g.scene.getScenes(true)) if (s.scene.key !== cle) g.scene.stop(s.scene.key);
  g.scene.start(cle, data || undefined);
}
"""


class ServeurFichiers(http.server.SimpleHTTPRequestHandler):
    """Sert `racine` d'abord, puis le projet : une version de comparaison n'a besoin que de src/ et index.html."""
    racines = [ROOT]

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def translate_path(self, path):
        rel = urllib.parse.unquote(urllib.parse.urlsplit(path).path).lstrip('/')
        for r in self.racines:
            p = os.path.join(r, *rel.split('/'))
            if os.path.exists(p):
                return p
        return os.path.join(self.racines[-1], *rel.split('/'))


class Serveur(http.server.ThreadingHTTPServer):
    request_queue_size = 512
    daemon_threads = True


def servir(port, racine=None):
    gestion = type('Gestion', (ServeurFichiers,), {'racines': ([racine] if racine else []) + [ROOT]})
    httpd = Serveur(('127.0.0.1', port), functools.partial(gestion, directory=ROOT))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def lancer_navigateur(p):
    return p.chromium.launch(channel='msedge', headless=True, args=ARGS_NAVIGATEUR)


def ouvrir_zone(navigateur, port, zone, query='', attente=8.0):
    """Ouvre le jeu, démarre la zone et attend que les cartes de lumière soient arrivées."""
    z = ZONES[zone]
    ctx = navigateur.new_context(viewport={'width': 1366, 'height': 768})
    page = ctx.new_page()
    erreurs = []
    page.on('pageerror', lambda e: erreurs.append(str(e)[:200]))
    q = 'muet&physfps=165' + (('&' + query) if query else '')
    page.goto(f'http://127.0.0.1:{port}/index.html?{q}', timeout=120000)
    page.wait_for_function("window.__game && window.__game.scene.getScenes(true).some((s) => s.scene.key !== 'BootScene')", timeout=240000)
    page.evaluate(DEMARRER, [z['scene'], z.get('flags', {}), z.get('data')])
    page.wait_for_function("(c) => { const s = window.__game.scene.getScene(c); return s && s.sys.isActive() && s.player && s.children.list.length > 50; }",
                           arg=z['scene'], timeout=180000)
    time.sleep(attente)
    return ctx, page, erreurs


def carte_graphique(page):
    return page.evaluate("(() => { const gl = window.__game.renderer.gl, e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })()")


def mesurer_etat(page, etat, duree):
    marche = etat == 'marche'
    debit = page.evaluate(MESURE, [duree * 1000, False, marche])
    detail = page.evaluate(MESURE, [duree * 1000, True, marche])
    return {'ips': debit['ips'], 'ms95': detail['ms95'], 'ms99': detail['ms99'], 'cout': detail['cout'], 'maj': detail['maj'], 'physique': detail['physique'],
            'pas': detail['pas'], 'rendu': detail['rendu'], 'gpu': detail['gpu'], 'dessins': detail['dessins'], 'sommets': detail['sommets'],
            'objets': detail['objets'], 'canvas': detail['canvas'], 'deplacement': detail['deplacement']}


def ligne_tableau(zone, etat, m):
    return (f"{ZONES[zone]['nom'][:26]:26} {etat:9} {m['ips']:6.1f} i/s  coût {m['cout']:5.1f} ms (maj {m['maj']:4.1f} envoi {m['rendu']:4.1f} gpu {m['gpu']:5.1f})"
            f"  p95 {m['ms95']:5.1f}  {m['dessins']:4d} dessins  {m['canvas']}")


def cmd_mesure(a):
    from playwright.sync_api import sync_playwright
    httpd = servir(a.port, a.racine)
    res = {'carte': None, 'query': a.query, 'mesures': {}}
    zones = a.zones.split(',')
    with sync_playwright() as p:
        nav = lancer_navigateur(p)
        for zone in zones:
            ctx, page, erreurs = ouvrir_zone(nav, a.port, zone, a.query)
            res['carte'] = res['carte'] or carte_graphique(page)
            for etat in a.etats.split(','):
                m = mesurer_etat(page, etat, a.duree)
                res['mesures'][f'{zone}/{etat}'] = m
                print(ligne_tableau(zone, etat, m), flush=True)
            if erreurs:
                print('  ERREURS JS :', erreurs[:3], flush=True)
                res.setdefault('erreurs', {})[zone] = erreurs[:5]
            ctx.close()
        nav.close()
    httpd.shutdown()
    print('Carte graphique :', res['carte'])
    if a.json:
        with open(a.json, 'w', encoding='utf-8') as f:
            json.dump(res, f, ensure_ascii=False, indent=1)


def cmd_comparer(a):
    av, ap = [json.load(open(x, encoding='utf-8'))['mesures'] for x in (a.avant, a.apres)]
    print('| Zone | État | i/s avant | i/s après | coût avant (ms) | coût après (ms) | p95 avant (ms) | p95 après (ms) | dessins avant | dessins après |')
    print('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|')
    for cle in av:
        if cle not in ap:
            continue
        zone, etat = cle.split('/')
        x, y = av[cle], ap[cle]
        print(f"| {ZONES[zone]['nom']} | {etat} | {x['ips']:.0f} | **{y['ips']:.0f}** | {x['cout']:.1f} | {y['cout']:.1f} | {x['ms95']:.1f} | {y['ms95']:.1f} | {x['dessins']} | {y['dessins']} |")


def main():
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, 'reconfigure'):
            st.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    m = sub.add_parser('mesure')
    m.add_argument('--port', type=int, default=9781)
    m.add_argument('--zones', default=','.join(ZONES))
    m.add_argument('--etats', default='immobile,marche')
    m.add_argument('--duree', type=float, default=6.0, help='secondes par passe')
    m.add_argument('--racine', default=None, help='dossier de la version à mesurer (src/, index.html)')
    m.add_argument('--query', default='', help="options ajoutées à l'adresse, ex. sanslumiere")
    m.add_argument('--json', default=None)
    m.set_defaults(f=cmd_mesure)
    c = sub.add_parser('comparer')
    c.add_argument('avant')
    c.add_argument('apres')
    c.set_defaults(f=cmd_comparer)
    a = ap.parse_args()
    a.f(a)


if __name__ == '__main__':
    main()
