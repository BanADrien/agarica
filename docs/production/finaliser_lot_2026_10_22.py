"""Synchronise le suivi de ce lot sans modifier ses images sources."""
import json
import os
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import import_codex_assets as importer

env = dict(os.environ, PYTHONIOENCODING='utf-8')
prompt_path = HERE / 'generation_2026-10-22.json'
generation = json.loads(prompt_path.read_text(encoding='utf-8'))
enemy_ids = {'loup_sanguinaire', 'araignee', 'mousse_creature', 'crapaud_corrompu', 'singe_corrompu'}
prompts = [e for e in generation['prompts'] if e['path'].startswith(('assets/_codex_src/', 'assets/vfx/')) or '_planche.png' in e['path'] or Path(e['path']).stem in enemy_ids]
sources = {e['path'] for e in prompts}
missing = [p for p in sources if not (ROOT / p).is_file()]
if missing:
    raise SystemExit('Sources absentes : ' + ', '.join(missing))
generation['prompts'] = prompts
generation['nombre_sources'] = len(sources)
generation['references'] = {
    'loup_sanguinaire': 'assets/sprites/loup_frames/loup_row0_0.png',
    'crapaud_corrompu': 'assets/sprites/crapaud_frames/crapaud_row0_0.png',
    'singe_corrompu': 'assets/_codex_ref/singe_reference.png',
    'form_icone_singe': 'assets/_codex_ref/singe_reference.png',
}
for aid in ['agarica', 'xara', 'amanite', 'pere_chef', 'geralt', 'morgat', 'kainati', 'ghilt']:
    ref = {'agarica': 'agarica_extra', 'xara': 'xara_extra'}.get(aid, aid)
    generation['references']['portrait_' + aid] = 'assets/sprites/' + ref + '.png'
generation['corrections'] = [
    'Singe corrompu : fourrure brune et peau beige de la référence, au lieu du violet du guide.',
    'Fonds : corrections des bords, format proche du ratio final 2079x756 pour limiter le recadrage ; dernière passe supplémentaire pour le ciel de la forêt flottante.',
    'Ennemis : plusieurs passes de correction des tailles et espacements, mesures finales dans controles/<id>.json ; réserves conservées.',
    'Décors : seconde passe d’alignement des bases ; conformité stricte des cases encore insuffisante, sources entières conservées.',
    'Purification et impact pierre : réduction des effets pour supprimer les avertissements de bord de cellule.',
    'Carte : fond damier retiré avec image_gen, conservation de l’alpha.',
]
prompt_path.write_text(json.dumps(generation, ensure_ascii=False, indent=2), encoding='utf-8')

anims, items, tiles = importer.load_manifest()
ids = [aid for aid, e in anims.items() if any(s['file'] in sources for s in e['sheets'])]
ids += [aid for aid, e in items.items() if e['src'].get('file', e['src'].get('planche')) in sources]
ids += [aid for aid, e in tiles.items() if any(p in sources for p in e['src'].values())]
run = subprocess.run([sys.executable, 'tools/import_codex_assets.py', '--force', '--only', *ids], cwd=ROOT, env=env, capture_output=True, text=True, encoding='utf-8')
log_name = 'imports/lot_2026-10-22_validation.log'
(HERE / log_name).write_text(run.stdout + run.stderr, encoding='utf-8')
if run.returncode or 'AVERTISSEMENT:' in run.stdout:
    print(run.stdout + run.stderr)
    raise SystemExit(run.returncode or 1)

state_path = HERE / 'suivi_codex.json'
state = json.loads(state_path.read_text(encoding='utf-8'))
for aid in ids:
    state[aid] = {'status': 'fait', 'note': 'Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche.', 'log': log_name}
for aid in ['agarica', 'xara', 'amanite', 'pere_chef', 'geralt', 'morgat', 'kainati', 'ghilt']:
    state['portrait_' + aid]['note'] = 'Portrait généré avec référence ' + generation['references']['portrait_' + aid] + ' ; visage et palette comparés visuellement ; sortie 512x512.'
for aid in ['fond_bosquet', 'fond_foret_sombre', 'fond_grand_arbre', 'fond_foret_flottante', 'fond_foret_corrompue', 'fond_monde_spirituel', 'fond_trou_sombre', 'fond_arene_ghilt']:
    state[aid]['note'] = 'Bords corrigés ; source et sortie importée collées chacune à elle-même. Contrôle visuel des montages et mesures dans controles/lot_2026-10-22/. Sortie 2079x756.'
for aid in tiles:
    if aid in ids:
        state[aid]['note'] = 'Trois sources, disposition sol 4x4 + plateformes 1x3 + spéciaux 1x3 vérifiée visuellement ; 21 sorties importées sans avertissement.'
reserves = {
    'loup_sanguinaire': '12 frames, bandes >=120 px et écarts >=76 px. Encore trop bas : 135-162 px selon pose au lieu de ~220 ; correction de hauteur à terminer.',
    'araignee': '12 frames, bandes >=100 px et écarts >=67 px. Hauteur 170-197 px en repos/marche, 230 px en cabrage : échelle de l’attaque à harmoniser avec ~170 px.',
    'mousse_creature': '13 frames, bandes >=145 px et écarts >=50 px. Hauteur <=173 px, mais largeur maximale 293 px hors padding au lieu de ~220 ; réduire les extensions.',
    'crapaud_corrompu': 'Disposition 4/1/4 conservée ; 5 attaques +4 repos sur canvas 1434x237. Corps ~200 px, bandes >=84 px. Écart de 8 px entre deux poses de la première rangée au lieu de >=40 : à reprendre.',
}
for aid, note in reserves.items():
    state[aid].update(status='à refaire', note=note)
state['singe_corrompu']['note'] = '13 frames, singe brun de référence avec mousse toxique et yeux malades. Bandes >=124 px, écarts >=68 px ; hauteur 157-202 px selon pose ; contrôle visuel sans coupe ni frame vide.'
for section in ['grand_arbre', 'grand_arbre_tronc', 'foret_sombre', 'foret_flottante', 'foret_corrompue', 'hutte_morgat']:
    aid = 'grand_arbre_tronc` (planche décor)' if section == 'grand_arbre_tronc' else 'décor ' + section
    state[aid] = {'status': 'à refaire', 'note': 'Planche entière enregistrée au chemin demandé, aucune découpe. Deux passes de génération ; bases visuellement rapprochées mais bas des cases régulières pas strictement respecté et certaines silhouettes débordent de leur bande. Repositionnement encore nécessaire.', 'log': 'controles/lot_2026-10-22/audit.json'}
state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')

subprocess.run([sys.executable, 'docs/production/suivi_codex.py'], cwd=ROOT, env=env, check=True)
report_path = HERE / 'RAPPORT_CODEX.md'
report = report_path.read_text(encoding='utf-8')
bilan = '''## Lot du 22 octobre 2026

Les **58 images sources demandées sont présentes**. Génération avec `image_gen` intégré ; prompts du guide et références dans [generation_2026-10-22.json](generation_2026-10-22.json), reçus des générations dans [generation_2026-10-22_recus.json](generation_2026-10-22_recus.json). Toutes les sources sont copiées dans le projet.

Les huit portraits ont chacun reçu la référence du personnage. Pour Agarica et Xara, absence de `agarica.png` et `xara.png` : utilisation de `agarica_extra.png` et `xara_extra.png`. Le singe corrompu et son icône utilisent bien le singe brun demandé.

Les huit fonds ont été collés chacun à eux-mêmes, avant et après import, puis corrigés. [Montage des raccords finaux](controles/lot_2026-10-22/fonds_contact.jpg). Les trois tilesets ont chacun leurs trois sources et leurs 21 fichiers finaux. Les six planches de décor restent **entières**, dans `assets/decors/déco item/<section>/<section>_planche.png`.

**Production encore à reprendre :** hauteur du loup, échelle de l’attaque de l’araignée, largeur de la créature de mousse, espacement de deux poses du crapaud, et alignement strict au bas des cases des six décors. Ces fichiers existent et s’importent, mais ne sont pas déclarés conformes. Aucun avertissement d’import ne remplace ces contrôles graphiques.

[Validation de tous les assets de ce lot](imports/lot_2026-10-22_validation.log) ; [mesures et montages](controles/lot_2026-10-22/audit.json) ; [décors](controles/lot_2026-10-22/decors_contact.jpg) ; [portraits et icônes](controles/lot_2026-10-22/interface_contact.jpg) ; [effets](controles/lot_2026-10-22/vfx_contact.jpg) ; [tuiles](controles/lot_2026-10-22/tuiles_contact.jpg).

'''
report_path.write_text(report.replace('# Rapport de production Codex\n\n', '# Rapport de production Codex\n\n' + bilan, 1), encoding='utf-8')
print('Sources du lot :', len(sources), '; entrées du manifeste :', len(ids), '; réserves conservées : 4 ennemis et 6 décors.')
