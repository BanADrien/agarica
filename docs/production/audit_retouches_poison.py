"""Verification ciblee des redessins poison et des cellules preservees."""
import json,hashlib
import numpy as np
from PIL import Image
import retouches_poison as p
from pathlib import Path
state=json.loads((p.OUT/'suivi.json').read_text(encoding='utf-8'))
old=json.loads((p.OUT/'etat_avant.json').read_text(encoding='utf-8'))
anims,items,_=p.imp.load_manifest();allowed=set();result={'sources':{},'frames':{},'raccords':{},'problems':[]}
for key,data in state.items():
    n=int(key);allowed.add(data['source'].replace('\\','/'))
    im=Image.open(p.ROOT/data['source']).convert('RGBA');a=np.array(im)
    expected=Image.open(p.OUT/'avant'/data['source']).size
    assert im.size==expected and a[:,:,3].min()==0,(n,im.size)
    preserved=True
    if n<30 and p.JOBS[n] is not None:
        before=np.array(Image.open(p.OUT/'avant'/data['source']).convert('RGBA'))
        cols,rows=(1,len(p.lot.STRIPS[n][0])) if n in p.lot.STRIPS else p.lot.GRIDS[n][:2]
        for k in range(cols*rows):
            if k in p.JOBS[n]:continue
            r,c=divmod(k,cols);sl=(slice(r*1024//rows,(r+1)*1024//rows),slice(c*1536//cols,(c+1)*1536//cols))
            preserved &= np.array_equal(a[sl],before[sl])
    assert preserved,n
    result['sources'][key]={'path':data['source'],'size':list(im.size),'unselected_cells_identical':bool(preserved)}
    for iid in data['ids']:
        if iid in items:files=[p.ROOT/items[iid]['path']]
        else:
            groups=p.imp.anim_expected_files(iid,anims[iid]);files=[f for g in groups.values() for f in g]
            result['frames'][iid]=len(files)
        for f in files:
            assert f.exists() and Image.open(f).getbbox(),f
            allowed.add(str(f.relative_to(p.ROOT)).replace('\\','/'))
    for name,seam in data['raccords'].items():
        assert seam['edge_rgba_max_difference']==0,name
        result['raccords'][name]=seam
changes=[]
for name,digest in old.items():
    f=p.ROOT/name
    if not f.exists() or hashlib.sha256(f.read_bytes()).hexdigest()!=digest:changes.append(name.replace('\\','/'))
result['changed_assets']=[name for name in changes if name.startswith('assets/')]
result['unexpected_asset_changes']=[name for name in result['changed_assets'] if name not in allowed]
result['src_changes_observed']=[name for name in changes if name.startswith('src/')]
result['existing_agarica_geralt_changed']=[name for name in result['changed_assets'] if 'agarica' in name.lower() or 'geralt' in name.lower()]
assert not result['unexpected_asset_changes'],result['unexpected_asset_changes']
assert not result['existing_agarica_geralt_changed']
assert 'src/data/asset_manifest.js' not in result['src_changes_observed']
(p.OUT/'audit_final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'sources':len(state),'images':sum(len(d['ids']) for d in state.values()),'frames':result['frames'],'changed_assets':len(result['changed_assets']),'src_changes_observed':result['src_changes_observed'],'problems':result['problems']},ensure_ascii=False))
