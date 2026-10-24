"""Dernier audit, rapport et import complet apres redessins poison."""
import sys,json,subprocess,os,shutil
import retouches_poison as p
sys.stdout.reconfigure(encoding='utf-8')
env=os.environ.copy();env['PYTHONIOENCODING']='utf-8'
audit=json.loads((p.OUT/'audit_final.json').read_text(encoding='utf-8'));state=json.loads((p.OUT/'suivi.json').read_text(encoding='utf-8'))
assert len(state)==14 and not audit['problems']
# Keep the existing gallery's current previews in sync; original sources are
# archived under the dedicated before/after folder.
for n in p.JOBS:
    shutil.copy2(p.OUT/f'{n:02d}_apres.jpg',p.lot.OUT/f'{n:02d}_final.jpg')
subprocess.run([sys.executable,'docs/production/galerie_lot_8.py'],cwd=p.ROOT,check=True,capture_output=True)
report=p.ROOT/'docs/production/RAPPORT_CODEX.md'
notes='\n### Contrôles finaux des retouches poison\n\n14 sources redessinées : 28 images fixes et 4 animations totalisant 30 frames. Les 3 raccords tuilables ont une différence RGBA nulle après import. Les cellules hors poison sont pixel-identiques aux sauvegardes. Les dimensions de toile et les nombres de frames sont conservés. Les dessins sont issus d imagegen ; les scripts assurent uniquement découpe, placement, dimensions et raccords. Le haut d une touffe et les gouttières du souffle ont été repositionnés pour éviter une coupe des dessins. La vague est normalisée à 300 x 70 px par frame.\n\n'
notes+='Sauvegardes : `controles/retouches_poison_2026-10-23/avant/`. Audit : [audit_final.json](controles/retouches_poison_2026-10-23/audit_final.json). Aucun changement des images existantes Agarica/Geralt ni des assets hors du périmètre. Aucun code du jeu ni manifeste édité par ce travail. Des modifications parallèles de `src/` sont recensées dans l audit ; elles ont été préservées.\n'
with report.open('a',encoding='utf-8') as f:f.write(notes)
r=subprocess.run([sys.executable,'tools/import_codex_assets.py'],cwd=p.ROOT,env=env,capture_output=True,text=True,encoding='utf-8')
log=r.stdout+r.stderr;dest=p.ROOT/'docs/production/imports/final_retouches_poison_2026-10-23.log';dest.write_text(log,encoding='utf-8')
tail=log[log.rfind('================ RAPPORT ================'):]
with report.open('a',encoding='utf-8') as f:f.write('\nImport complet : `python tools/import_codex_assets.py`. [Journal complet](imports/final_retouches_poison_2026-10-23.log).\n\n```text\n'+tail.rstrip()+'\n```\n')
print(tail)
assert r.returncode==0 and 'AVERTISSEMENT' not in log and 'avertissement(s)' not in log
