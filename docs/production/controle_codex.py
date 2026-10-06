"""Mesures en lecture seule et planche-contact des frames importées."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
import import_codex_assets as m
sys.stdout.reconfigure(encoding='utf-8')
anims, _, _ = m.load_manifest()
out = ROOT / 'docs/production/controles'
out.mkdir(exist_ok=True)
for aid in sys.argv[1:]:
    e = anims[aid]
    stats = []
    for source in e['sheets']:
        p = ROOT / source['file']
        if not p.exists():
            continue
        a = m.load_rgba(p)
        rows = m.blob_rows(a, len(source['rows']), aid)
        item = {'source': source['file'], 'size': [a.shape[1], a.shape[0]],
            'row_gaps': [rows[i+1][0]-rows[i][1]-1 for i in range(len(rows)-1)], 'frames': []}
        for ri, (y0,y1) in enumerate(rows):
            labels,n = m.ndimage.label(a[y0:y1+1,:,3]>m.ALPHA_T, np.ones((3,3),int))
            comps=[]
            for k,sl in enumerate(m.ndimage.find_objects(labels),1):
                if sl is None:
                    continue
                area=int(np.count_nonzero(labels[sl]==k))
                if area>=m.MIN_AREA:
                    comps.append((area,sl[1].start,sl[1].stop,sl[0].stop-sl[0].start))
            if not comps:
                continue
            largest=max(c[0] for c in comps)
            anchors=sorted([c for c in comps if c[0]>=largest*.15],key=lambda c:c[1])
            item['frames'].append({'row':ri,'count':len(anchors),'heights':[c[3] for c in anchors],
                'horizontal_gaps':[anchors[i+1][1]-anchors[i][2] for i in range(len(anchors)-1)]})
        stats.append(item)
    files=sorted((ROOT/e['dir']).glob(e['prefix']+'_row*.png'),key=lambda p:tuple(map(int,p.stem.rsplit('_row',1)[1].split('_'))))
    if files:
        nr=1+max(int(p.stem.rsplit('_row',1)[1].split('_')[0]) for p in files)
        sheet=Image.new('RGB',(1100,nr*230),(46,49,58)); d=ImageDraw.Draw(sheet)
        for p in files:
            row,col=map(int,p.stem.rsplit('_row',1)[1].split('_'))
            im=Image.open(p).convert('RGBA'); im.thumbnail((210,205))
            sheet.paste(im,(col*220+(220-im.width)//2,row*230+20),im)
            d.text((col*220+4,row*230+3),p.stem,fill='white')
        sheet.save(out/(aid+'.jpg'))
    (out/(aid+'.json')).write_text(json.dumps(stats,indent=2),encoding='utf-8')
    print(aid,json.dumps(stats))
