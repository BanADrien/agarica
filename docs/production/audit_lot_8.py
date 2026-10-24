from pathlib import Path
import sys,json,hashlib
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/production/controles/lot_8'
sys.path.insert(0,str(ROOT/'tools'))
import import_codex_assets as imp
sys.stdout.reconfigure(encoding='utf-8')
anims,items,_=imp.load_manifest()
jobs=json.loads((OUT/'prompts.json').read_text(encoding='utf-8'))
state=json.loads((OUT/'suivi.json').read_text(encoding='utf-8'))
result={'sources':{},'animations':{},'protection':{},'problems':[]}
for job in jobs:
    n=job['n'];p=ROOT/job['source']
    if not p.exists():result['problems'].append(f'{n}: source absente');continue
    im=Image.open(p).convert('RGBA');a=np.array(im)
    expected=(1024,1536) if n==24 else (1536,1024)
    assert im.size==expected,(n,im.size)
    if n in [3,13]:assert a[:,:,3].min()==255
    else:assert a[:,:,3].min()==0
    result['sources'][str(n)]={'size':list(im.size),'alpha_range':[int(a[:,:,3].min()),int(a[:,:,3].max())]}
    for iid in job['ids']:
        entry=items.get(iid)
        if entry:
            out=ROOT/entry['path'];assert out.exists(),iid
            assert Image.open(out).getbbox(),iid
        else:
            e=anims[iid];files=list(imp.anim_expected_files(iid,e).values());count=0
            for group in files:
                for f in group:assert f.exists(),f;count+=1
            result['animations'][iid]={'frames':count}
    if n in [19,20,21]:
        e=anims[job['ids'][0]]
        for group in imp.anim_expected_files(job['ids'][0],e).values():
            for f in group:
                ar=np.array(Image.open(f).convert('RGBA'))
                labels,num=ndimage.label(ar[:,:,3]>0,np.ones((3,3)))
                if num!=1:result['problems'].append(str(f.relative_to(ROOT))+f': {num} composantes alpha')
    for iid,r in state.get(str(n),{}).get('raccords',{}).items():
        if r['edge_rgba_max_difference']>3:result['problems'].append(iid+': raccord import a reprendre')
old=json.loads((OUT/'etat_avant.json').read_text(encoding='utf-8'))
changes=[]
for name,digest in old.items():
    p=ROOT/name
    if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:changes.append(name)
protected=[n for n in changes if n.replace('\\','/').startswith('assets/') and ('agarica' in n.lower() or 'geralt' in n.lower())]
result['protection']={'existing_agarica_geralt_changed':protected,'src_changes_observed':[n for n in changes if n.replace('\\','/').startswith('src/')],'existing_asset_changes_observed':[n for n in changes if n.replace('\\','/').startswith('assets/')]}
if protected:result['problems'].append('Images existantes Agarica/Geralt modifiees pendant la session : examiner les modifications concurrentes')
(OUT/'audit_final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
