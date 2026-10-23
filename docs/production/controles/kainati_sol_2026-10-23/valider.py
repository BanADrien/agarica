from pathlib import Path
import json
import hashlib
import sys
from PIL import Image
import numpy as np
from scipy import ndimage

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
sys.stdout.reconfigure(encoding='utf-8')
measure=json.loads((HERE/'normalisation.json').read_text())
report={}
for name,nr in [('kainati_sol',2),('kainati_sol_p2',2),('kainati_sol_p3',1)]:
    a=np.array(Image.open(ROOT/'assets/sprites'/(name+'.png')).convert('RGBA'))
    assert a.shape==(1024,1536,4)
    counts=[[int(ndimage.label(a[r*1024//nr:(r+1)*1024//nr,c*384:(c+1)*384,3]>0,np.ones((3,3)))[1]) for c in range(4)] for r in range(nr)]
    assert all(k==1 for row in counts for k in row),counts
    rows=[[b['box'] for b in measure[name]['placements'] if b['row']==r] for r in range(nr)]
    gaps=[row[c+1][0]-row[c][2] for row in rows for c in range(3)]
    assert min(gaps)>=40
    vertical=[min(b[1] for b in rows[r+1])-max(b[3] for b in rows[r]) for r in range(nr-1)]
    assert all(g>=60 for g in vertical)
    report[name]={'components':counts,'horizontal_gaps':gaps,'vertical_gaps':vertical}
for name,h in [('vfx_onde_choc',90),('vfx_vague_mousse',70)]:
    a=np.array(Image.open(ROOT/'assets/vfx'/(name+'.png')).convert('RGBA'))
    assert a.shape==(1024,1536,4)
    boxes=[Image.fromarray(a[:,c*384:(c+1)*384]).getbbox() for c in range(4)]
    assert all(b and b[0]>0 and b[2]<384 and b[3]==1020 and b[2]-b[0]<=300 and b[3]-b[1]<=h for b in boxes)
    report[name]={'boxes_in_cells':boxes,'baseline':1020}
ref=Image.open(ROOT/'assets/sprites/kainati_frames/kainati_row0_0.png').convert('RGBA');bb=ref.getbbox()
report['reference']={'canvas':list(ref.size),'visible_size':[bb[2]-bb[0],bb[3]-bb[1]]}
before=json.loads((HERE/'src_avant.json').read_text())
report['src_changes_observed']=[k for k,v in before.items() if hashlib.sha256((ROOT/k).read_bytes()).hexdigest()!=v]
report['note']='Only asset_present.js was written by the importer. Other observed changes are concurrent external edits; not modified or restored by this workflow.'
(HERE/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
