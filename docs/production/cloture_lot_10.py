"""Audit final du lot 10, rapport et dernier import complet."""
from pathlib import Path
import sys,json,hashlib,subprocess,os
import numpy as np
from PIL import Image
import lot_10 as lot
sys.stdout.reconfigure(encoding='utf-8')
state=json.loads((lot.OUT/'suivi.json').read_text(encoding='utf-8'));assert len(state)==3
old=json.loads((lot.OUT/'etat_avant.json').read_text(encoding='utf-8'))
anims,_,_=lot.imp.load_manifest();allowed=set();audit={'images':{},'problems':[]}
for iid in lot.IDS:
    source=lot.ROOT/'assets/sprites'/f'{iid}.png';allowed.add(str(source.relative_to(lot.ROOT)).replace('\\','/'))
    archive=lot.OUT/'avant'/source.name
    key=next(k for k in old if k.replace('\\','/')==str(source.relative_to(lot.ROOT)).replace('\\','/'))
    assert hashlib.sha256(archive.read_bytes()).hexdigest()==old[key]
    im=Image.open(source).convert('RGBA');assert im.size==(1536,1024)
    assert im.getchannel('A').getextrema()[0]==0
    d=state[iid];rows=3 if iid=='forme_papillon' else 1
    for pos in d['positions']:
        k=pos['cell'];r,c=divmod(k,4);x,y,x2,y2=pos['bbox']
        assert x-c*384>=20 and (c+1)*384-x2>=20
        assert y-r*1024/rows>=30 and (r+1)*1024/rows-y2>=30
        assert abs((x+x2)/2-(c+.5)*384)<=.5
        assert abs((y+y2)/2-(r+.5)*1024/rows)<=.5
    groups=lot.imp.anim_expected_files(iid,anims[iid]);files=[f for group in groups.values() for f in group]
    assert len(files)==d['frames']
    assert len(list((lot.ROOT/anims[iid]['dir']).glob('*.png')))==d['frames']
    for f in files:allowed.add(str(f.relative_to(lot.ROOT)).replace('\\','/'))
    audit['images'][iid]={'frames':len(files),'rows':{k:len(v) for k,v in groups.items()},'visible_sizes':[p['visible_size'] for p in d['positions']],'archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest()}
assert np.array_equal(np.array(Image.open(lot.OUT/'poses/forme_papillon_08.png')),np.array(Image.open(lot.OUT/'poses/transfo_papillon_03.png')))
audit['final_transform_identical_to_glide_1']=True
changes=[]
for name,digest in old.items():
    f=lot.ROOT/name
    if not f.exists() or hashlib.sha256(f.read_bytes()).hexdigest()!=digest:changes.append(name.replace('\\','/'))
audit['changed_assets']=[n for n in changes if n.startswith('assets/')]
audit['unexpected_asset_changes']=[n for n in audit['changed_assets'] if n not in allowed]
audit['src_changes_observed']=[n for n in changes if n.startswith('src/')]
audit['manifest_unchanged']='src/data/asset_manifest.js' not in changes
assert not audit['unexpected_asset_changes'],audit['unexpected_asset_changes']
assert audit['manifest_unchanged']
(lot.OUT/'audit_final.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'images':3,'frames':20,'manifest_unchanged':audit['manifest_unchanged'],'src_changes_observed':audit['src_changes_observed'],'problems':audit['problems']},ensure_ascii=False))
env=os.environ.copy();env['PYTHONIOENCODING']='utf-8'
r=subprocess.run([sys.executable,'tools/import_codex_assets.py'],cwd=lot.ROOT,env=env,capture_output=True,text=True,encoding='utf-8')
log=r.stdout+r.stderr;dest=lot.ROOT/'docs/production/imports/final_lot_10_2026-10-26.log';dest.parent.mkdir(exist_ok=True,parents=True);dest.write_text(log,encoding='utf-8')
tail=log[log.rfind('================ RAPPORT ================'):]
report=lot.ROOT/'docs/production/RAPPORT_CODEX.md'
notes='\n### Contrôles finaux du lot n°10\n\n20 frames découpées : `flap` 4, `dash` 4, `glide` 4 ; `transform` 4 ; `cast` 4. Vérification des marges, du centrage, de la transparence et de la connexité : aucun élément vide ou coupé. Les trois archives sont identiques aux sources avant remplacement (SHA-256). Seuls les trois PNG et leurs 20 frames ont changé parmi les assets existants. Le manifeste reste intact ; aucune édition manuelle de `src/`. Audit : `controles/lot_10/audit_final.json`.\n\n'
notes+='La largeur de la pose `glide` 1 est de 220 px source (hauteur 153 px, antennes et queues incluses). Les amplitudes des ailes varient avec les poses ; les dimensions de chaque frame sont mesurées dans le tableau et le suivi. La transformation finale est pixel-identique à cette pose. Comparaison visuelle : couleurs et design communs, papillon insecte sans tête humaine dans les formes achevées ; visage humain seulement dans les deux premiers stades de transformation. Incantation à lumière tenue par les pattes. Aucun test de compétence en jeu effectué dans cette livraison ; contrôles des feuilles et des frames importées.\n\n'
if audit['src_changes_observed']:notes+='Des modifications parallèles de `src/` sont observées dans le snapshot ; elles sont recensées dans l audit et ont été préservées.\n\n'
notes+='Import complet final : `python tools/import_codex_assets.py`. [Journal complet](imports/final_lot_10_2026-10-26.log).\n\n```text\n'+tail.rstrip()+'\n```\n'
with report.open('a',encoding='utf-8') as f:f.write(notes)
print(tail)
assert r.returncode==0 and 'AVERTISSEMENT' not in log and 'avertissement(s)' not in log
