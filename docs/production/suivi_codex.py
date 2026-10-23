"""Import, journal et suivi de production. Ne modifie pas les images."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / 'tools'))
import import_codex_assets as importer

parser = argparse.ArgumentParser()
parser.add_argument('--asset')
parser.add_argument('--force', action='store_true')
parser.add_argument('--status', choices=['fait', 'à refaire', 'non fait'])
parser.add_argument('--note', default='')
args = parser.parse_args()
state_path = HERE / 'suivi_codex.json'
state = json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else {}
for aid in ['pere_chef', 'amanite', 'geralt', 'morgat']:
    state.setdefault(aid, {'status': 'fait', 'note': 'Déclaré terminé par l’utilisateur le 6 octobre ; conservé sans modification.'})
state.setdefault('agarica_extra', {'status': 'à refaire', 'note': 'p1/p2 conservées ; p3/p4 non faites.'})
state.setdefault('xara_extra', {'status': 'à refaire', 'note': 'Bande entre rangées mesurée à 45 px ; minimum demandé 60 px.'})
state.setdefault('kainati', {'status': 'à refaire', 'note': 'p1/p2 présentes ; lancer : 3 silhouettes au lieu de 4 dans p1. p3/p4 manquantes.'})
if args.asset:
    entry = state.setdefault(args.asset, {})
    if args.status:
        entry['status'] = args.status
    if args.note:
        entry['note'] = args.note
cmd = [sys.executable, 'tools/import_codex_assets.py']
if args.force:
    if not args.asset:
        parser.error('--force exige --asset')
    cmd += ['--only', args.asset, '--force']
env = dict(os.environ, PYTHONIOENCODING='utf-8')
run = subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, text=True, encoding='utf-8')
log = run.stdout + run.stderr
logs = HERE / 'imports'
logs.mkdir(exist_ok=True)
name = (args.asset or 'final') + ('_force' if args.force else '') + '.log'
(logs / name).write_text(log, encoding='utf-8')
(HERE / 'import_codex_latest.log').write_text(log, encoding='utf-8')
if args.asset:
    state[args.asset]['log'] = 'imports/' + name
state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
guide = (ROOT / 'CODEX_SPRITES_A_GENERER.md').read_text(encoding='utf-8')
anims, items, tilesets = importer.load_manifest()
lines = ['# Rapport de production Codex', '',
    'Ordre : singe/transformation ; Agarica p3/p4 ; boss ; Xara ; habitants/animaux ; ennemis ; objets ; interface ; VFX ; fonds ; tuiles ; décors.', '',
    'Prompts anglais intégraux du guide mis à jour, génération avec image_gen intégré et références locales. Aucune modification manuelle de src/ ou du manifeste. asset_present.js est écrit uniquement par l’importeur demandé.', '',
    '« À refaire » inclut une production partielle ou une validation encore incomplète. Les décors seront livrés sans découpe.', '',
    '| Asset | Statut | Détail | Dernier journal |', '|---|---|---|---|']
for line in guide.split('## Checklist', 1)[1].splitlines():
    if not line.startswith('| `'):
        continue
    cells = line.split('|')
    aid = cells[1].strip().strip('`')
    entry = state.get(aid, {})
    sources = re.findall(r'`([^`]+\.png)`', cells[2])
    present = [p for p in sources if (ROOT / p).exists()]
    status = entry.get('status', 'à refaire' if present else 'non fait')
    note = entry.get('note', 'Source présente ; validation à terminer.' if present else 'Pas encore généré.')
    journal = entry.get('log')
    link = f'[journal]({journal})' if journal else '[dernier import](import_codex_latest.log)'
    lines.append(f'| `{aid}` | {status} | {note} | {link} |')
lines += ['', '## Dernière exécution', '', 'Commande : `' + ' '.join(cmd[1:]) + '`', '', '```text', log.rstrip(), '```', '']
(HERE / 'RAPPORT_CODEX.md').write_text('\n'.join(lines), encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
print(log)
raise SystemExit(run.returncode)
