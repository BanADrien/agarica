"""Vérification du jeu en UNE commande, avec une sortie courte.

    python tools/verif.py                    toutes les scènes + éditeur + règle des diagonales
    python tools/verif.py --scenes A,B       seulement ces scènes (noms de src/main.js)
    python tools/verif.py --rapide           règle des diagonales seule (un seul lancement)
    python tools/verif.py --robot fs1 fs2    en plus, le robot joue ces segments du chemin principal
    python tools/verif.py --robot tout       … ou tout le chemin (long : plusieurs minutes)

Un seul navigateur sans fenêtre à la fois (le PC de l'utilisateur sature au-delà) :
tout s'enchaîne, rien en parallèle. La sortie ne liste que ce qui ÉCHOUE, puis une ligne
de bilan ; le détail complet va dans le journal indiqué. Code de sortie 1 si un point échoue.

Segments du robot : titre bosquet fs1 fs2 racines arene ff1 ff2 clairiere hutte fc1
ghilt1 trou ghilt2 retour.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PLAYTEST = os.path.join(ROOT, 'tools', 'playtest.py')

# Règle de l'utilisateur (2026-11-09) : jamais deux cases de sol qui ne se touchent que par un
# coin. Exception connue et acceptée : deux îles de la forêt flottante 2.
DIAG_OK = {('FORET_FLOTTANTE_2_DATA', 'bas(50,3)-haut(49,2)')}
DIAG_JS = r"""
(() => {
  const out = {};
  for (const name of %s) {
    let d; try { d = eval(name); } catch (e) { continue; }
    const cells = (typeof zoneGroundCells === 'function' ? zoneGroundCells(d) : d.groundCells) || [];
    const set = new Set(cells.map((c) => c[0] + ',' + c[1]));
    const diag = [];
    for (const k of set) {
      const [x, y] = k.split(',').map(Number);
      for (const dx of [1, -1]) {
        const ux = x + dx, uy = y - 1;
        if (!set.has(ux + ',' + uy)) continue;
        if (set.has(ux + ',' + y) || set.has(x + ',' + uy)) continue;
        diag.push('bas(' + x + ',' + y + ')-haut(' + ux + ',' + uy + ')');
      }
    }
    if (diag.length) out[name] = diag;
  }
  return out;
})()
"""


def scene_list():
    src = open(os.path.join(ROOT, 'src', 'main.js'), encoding='utf-8').read()
    block = src[src.index('scene: ['):]
    block = block[:block.index(']')]
    return [s for s in re.findall(r'[A-Z][A-Za-z0-9]+Scene', block) if s != 'BootScene']


def data_names():
    names = []
    d = os.path.join(ROOT, 'src', 'data')
    for f in sorted(os.listdir(d)):
        if not f.endswith('_data.js') or 'backup' in f:
            continue
        m = re.search(r'^const ([A-Z0-9_]+_DATA) = ', open(os.path.join(d, f), encoding='utf-8').read(), re.M)
        if m:
            names.append(m.group(1))
    return names


def playtest(port, args, timeout=400):
    r = subprocess.run([sys.executable, PLAYTEST, '--port', str(port)] + args, capture_output=True, text=True,
                       encoding='utf-8', errors='replace', cwd=ROOT, timeout=timeout)
    return r.returncode, r.stdout + r.stderr


def main():
    # Console Windows (cp1252) : jamais d'erreur d'encodage à l'affichage.
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, 'reconfigure'):
            st.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--port', type=int, default=9700)
    ap.add_argument('--scenes', default='')
    ap.add_argument('--rapide', action='store_true')
    ap.add_argument('--robot', nargs='*', default=None)
    a = ap.parse_args()
    log_path = os.path.join(tempfile.gettempdir(), 'agarica_verif.log')
    log = open(log_path, 'w', encoding='utf-8')
    fails = []
    t0 = time.time()

    # 1. Scènes (code de sortie 1 du harnais = erreur JS).
    scenes = [] if a.rapide else ([s for s in a.scenes.split(',') if s] or scene_list())
    for sc in scenes:
        code, out = playtest(a.port, ['--scene', sc, '--wait', '2'])
        log.write(f'== {sc} : {code}\n{out}\n')
        if code:
            errs = [l for l in out.splitlines() if 'error' in l.lower() and 'manquant' not in l][:2]
            fails.append(f'scène {sc} : ' + (' | '.join(errs) or 'erreur'))
    n_scenes = len(scenes)
    if not a.rapide and not a.scenes:
        code, out = playtest(a.port, ['--query', 'editor', '--wait', '2'])
        log.write(f'== éditeur : {code}\n{out}\n')
        n_scenes += 1
        if code:
            fails.append('éditeur : erreur JS')

    # 2. Règle des diagonales, sur toutes les zones.
    code, out = playtest(a.port, ['--scene', 'ForetSombre1Scene', '--wait', '1', '--js', DIAG_JS % json.dumps(data_names())])
    log.write(f'== diagonales : {code}\n{out}\n')
    m = re.search(r'^  = (\{.*\})\s*$', out, re.M)
    n_diag = 0
    if not m:
        fails.append('diagonales : le contrôle n\'a pas pu tourner')
    else:
        for zone, lst in json.loads(m.group(1)).items():
            for d in lst:
                if (zone, d) not in DIAG_OK:
                    n_diag += 1
                    fails.append(f'diagonale vide dans {zone} : {d}')

    # 3. Robot du chemin principal (facultatif).
    robot = ''
    if a.robot is not None:
        segs = a.robot or ['fs1', 'fs2']
        env = dict(os.environ, PORT=str(a.port + 1))
        r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'robot', 'chemin.py')] + segs, capture_output=True,
                           text=True, encoding='utf-8', errors='replace', env=env, timeout=3600)
        log.write('== robot\n' + r.stdout + r.stderr + '\n')
        m = re.search(r"^BILAN (\{.*\})", r.stdout, re.M)
        if not m:
            fails.append('robot : pas de bilan (voir le journal)')
        else:
            res = eval(m.group(1), {'True': True, 'False': False})  # dict Python écrit par chemin.py
            bad = [k for k, v in res.items() if not v]
            robot = f', robot {len(res) - len(bad)}/{len(res)}'
            fails += [f'robot : segment {k} échoué' for k in bad]
    log.close()

    for f in fails:
        print('ÉCHEC', f)
    ok_scenes = n_scenes - sum(1 for f in fails if f.startswith(('scène', 'éditeur')))
    print(f"{'OK' if not fails else 'À CORRIGER'} : scènes {ok_scenes}/{n_scenes}, diagonales vides {n_diag}{robot}"
          f" ({round(time.time() - t0)} s) ; journal : {log_path}")
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
