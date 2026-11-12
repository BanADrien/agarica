"""Capture d'écran d'un endroit précis d'une zone, en UNE commande.

    python tools/capture.py ForetSombre1Scene --x 3400 --y 200 --out avant.png
    python tools/capture.py foret_sombre_1 --x 3400 --y 200 --flags hasMonkeyForm=true xaraMet=true
    python tools/capture.py ZoneOursScene --x 900 --y 380 --keys "ArrowRight:1500" --zoom 400,200,300,200

- Zone : nom de scène (`ForetSombre1Scene`) ou id de zone (`foret_sombre_1`).
- `--x --y` : où poser Agarica (coordonnées monde, y = ses pieds) ; sans eux, le départ normal.
- `--flags a=b c=d` : état d'histoire (xaraMet=true est mis d'office).
- `--keys` : touches jouées après la pose (syntaxe de tools/playtest.py : `ArrowRight:1500,wait:300,Space:100`).
- `--js` : expression évaluée avant la capture ; son résultat est affiché.
- `--attente` : secondes laissées au jeu après la pose (défaut 0.8).
- `--zoom x,y,l,h` : en plus, un gros plan de ce rectangle de l'écran (960x540), agrandi 3 fois.
- Sortie : une ligne, le chemin de l'image (et du gros plan). Les captures vont par défaut dans
  le dossier temporaire du système, pas dans le projet.

Un seul navigateur sans fenêtre à la fois : ne pas lancer deux captures en parallèle.
"""
import argparse
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


def scene_name(zone):
    if zone.endswith('Scene'):
        return zone
    return ''.join(p.capitalize() for p in zone.split('_')) + 'Scene'


def main():
    # Console Windows (cp1252) : jamais d'erreur d'encodage à l'affichage.
    for st in (sys.stdout, sys.stderr):
        if hasattr(st, 'reconfigure'):
            st.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('zone')
    ap.add_argument('--x', type=float)
    ap.add_argument('--y', type=float)
    ap.add_argument('--flags', nargs='*', default=[])
    ap.add_argument('--keys', default='')
    ap.add_argument('--js', default='')
    ap.add_argument('--attente', type=float, default=0.8)
    ap.add_argument('--zoom', default='')
    ap.add_argument('--out', default='')
    ap.add_argument('--port', type=int, default=9720)
    a = ap.parse_args()
    scene = scene_name(a.zone)
    out = os.path.abspath(a.out) if a.out else os.path.join(tempfile.gettempdir(), f'agarica_{scene}.png')
    cmd = [sys.executable, os.path.join(ROOT, 'tools', 'playtest.py'), '--port', str(a.port), '--scene', scene, '--wait', '2']
    flags = list(a.flags)
    if not any(f.startswith('xaraMet=') for f in flags):
        flags.append('xaraMet=true')
    for f in flags:
        cmd += ['--flags', f]
    wait_ms = int(a.attente * 1000)
    if a.x is not None and a.y is not None:
        # Pose, puis laisse la caméra et la physique se stabiliser.
        cmd += ['--pre-js', f"(async () => {{ const s = window.__game.scene.getScene('{scene}'); s.player.setPosition({a.x}, {a.y}); "
                        f"s.player.body.reset({a.x}, {a.y}); await new Promise((r) => setTimeout(r, {wait_ms})); return 'pose-ok'; }})()"]
    if a.keys:
        cmd += ['--keys', a.keys]
    if a.js:
        cmd += ['--js', a.js]
    cmd += ['--shot', out]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace', cwd=ROOT, timeout=300)
    txt = r.stdout + r.stderr
    # Ordre du harnais : pose (--pre-js), touches (--keys), puis --js et la capture.
    for m in re.finditer(r'^  = (.*)$', txt, re.M):
        if m.group(1) != '"pose-ok"':
            print('js =', m.group(1)[:600])
    errs = [l for l in txt.splitlines() if 'error' in l.lower() and 'manquant' not in l]
    if r.returncode or errs:
        print('ERREUR JS :', ' | '.join(errs[:3]) or 'code ' + str(r.returncode))
    line = out
    if a.zoom and os.path.exists(out):
        from PIL import Image
        x, y, w, h = [int(v) for v in a.zoom.split(',')]
        zoom = out[:-4] + '_zoom.png'
        Image.open(out).crop((x, y, x + w, y + h)).resize((w * 3, h * 3), Image.NEAREST).save(zoom)
        line += ' ; gros plan : ' + zoom
    print(line)
    sys.exit(1 if r.returncode else 0)


if __name__ == '__main__':
    main()
