"""Placement des dessins generes, controles et imports du lot papillon."""
from pathlib import Path
import sys,json,os,subprocess,hashlib
import numpy as np
from scipy import ndimage
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/production/controles/lot_10'
IDS=['forme_papillon','transfo_papillon','forme_papillon_extra']
sys.path.insert(0,str(ROOT/'tools'));import import_codex_assets as imp
sys.stdout.reconfigure(encoding='utf-8')
def core(im):
    a=np.array(im.convert('RGBA')); mask=a[:,:,3]>=128
    labels,_=ndimage.label(mask,np.ones((3,3)));sizes=np.bincount(labels.ravel());sizes[0]=0
    label=sizes.argmax();keep=ndimage.binary_dilation(labels==label,iterations=2)&(a[:,:,3]>2)
    a[~keep]=0;y,x=np.where(keep)
    if not len(x):raise ValueError('Empty frame')
    return Image.fromarray(a[y.min():y.max()+1,x.min():x.max()+1])
def frames(raw,count):
    a=np.array(raw.convert('RGBA'));ll,_=ndimage.label(a[:,:,3]>=128,np.ones((3,3)))
    sizes=np.bincount(ll.ravel());sizes[0]=0;sl=ndimage.find_objects(ll)
    chosen=sorted(range(1,len(sizes)),key=lambda k:sizes[k],reverse=True)[:count]
    assert len(chosen)==count
    chosen.sort(key=lambda k:(sl[k-1][0].start+sl[k-1][0].stop)/2)
    result=[]
    for r in range(count//4):
        row=sorted(chosen[r*4:r*4+4],key=lambda k:sl[k-1][1].start)
        for k in row:
            sy,sx=sl[k-1];part=a[max(0,sy.start-3):min(a.shape[0],sy.stop+3),max(0,sx.start-3):min(a.shape[1],sx.stop+3)]
            result.append(core(Image.fromarray(part)))
    return result
def resize(im,scale):return core(im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.NEAREST))
def run(n,path):
    iid=IDS[n-1];raw=Image.open(path).convert('RGBA');raw.save(OUT/f'{iid}_generation.png')
    count=12 if n==1 else 4;ff=frames(raw,count)
    if n==1:
        scale=min(220/max(ff[8].size),270/max(f.height for f in ff),280/max(f.width for f in ff))
        ff=[resize(f,scale) for f in ff]
    elif n==2:
        ff=[resize(f,min((250 if k==0 else 235 if k==1 else 220)/max(f.size),280/f.width)) for k,f in enumerate(ff)]
        ff[3]=Image.open(OUT/'poses/forme_papillon_08.png').convert('RGBA')
    else:
        raised=Image.open(OUT/'poses/forme_papillon_00.png')
        scale=min(raised.height/ff[0].height,270/max(f.height for f in ff),300/max(f.width for f in ff))
        ff=[resize(f,scale) for f in ff]
    sheet=Image.new('RGBA',(1536,1024));positions=[];rows=3 if n==1 else 1
    poses=OUT/'poses';poses.mkdir(exist_ok=True)
    for k,f in enumerate(ff):
        row,col=divmod(k,4);x=round((col+.5)*384-f.width/2);y=round((row+.5)*1024/rows-f.height/2)
        sheet.paste(f,(x,y));positions.append({'cell':k,'bbox':[x,y,x+f.width,y+f.height],'visible_size':list(f.size)})
        f.save(poses/f'{iid}_{k:02d}.png')
    source=ROOT/'assets/sprites'/f'{iid}.png';sheet.save(source)
    preview=Image.new('RGB',sheet.size,(47,43,58));preview.paste(sheet,mask=sheet.getchannel('A'));preview.thumbnail((1152,768));preview.save(OUT/f'{iid}_apres.jpg',quality=96)
    before=Image.open(OUT/'avant'/f'{iid}.png').convert('RGBA');bg=Image.new('RGB',before.size,(47,43,58));bg.paste(before,mask=before.getchannel('A'));bg.thumbnail((1152,768));bg.save(OUT/f'{iid}_avant.jpg',quality=96)
    env=os.environ.copy();env['PYTHONIOENCODING']='utf-8'
    r=subprocess.run([sys.executable,'tools/import_codex_assets.py','--only',iid,'--force'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',env=env)
    log=r.stdout+r.stderr;(OUT/f'{iid}_import.log').write_text(log,encoding='utf-8');print(log)
    assert r.returncode==0 and 'AVERTISSEMENT' not in log and 'avertissement(s)' not in log
    anims,_,_=imp.load_manifest();groups=imp.anim_expected_files(iid,anims[iid]);files=[f for g in groups.values() for f in g]
    assert len(files)==count
    for f in files:
        im=Image.open(f).convert('RGBA');labels,num=ndimage.label(np.array(im)[:,:,3]>0,np.ones((3,3)))
        assert im.getbbox() and num==1,(f,num)
    statepath=OUT/'suivi.json';state=json.loads(statepath.read_text(encoding='utf-8')) if statepath.exists() else {}
    state[iid]={'source':str(source.relative_to(ROOT)),'frames':count,'positions':positions,'status':'importe sans avertissement'}
    statepath.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8');docs(state)
def docs(state):
    report=ROOT/'docs/production/RAPPORT_CODEX.md';text=report.read_text(encoding='utf-8')
    section='<!-- LOT10 -->\n## Lot n°10 — Papillon lunaire — 2026-10-26\n\nTrois feuilles remplacées via imagegen, anciennes sources archivées dans `controles/lot_10/avant/`. Le papillon est un insecte violet nuit à nervures vert lunaire et spirales roses, sans visage humain. Contrôles : [galerie avant / après](controles/lot_10/index.html), `controles/lot_10/suivi.json`, générations et imports unitaires.\n\n| Image | État | Frames | Envergure / dimensions visibles en px source |\n|---|---|---|---|\n'
    html=['<!doctype html><meta charset="utf-8"><title>Lot 10 — Papillon lunaire</title><style>body{background:#201c2c;color:#eee;font:16px system-ui;margin:30px}a{color:#8fe3b8}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}img{width:100%}</style><h1>Lot 10 — Papillon lunaire</h1>']
    for iid in IDS:
        d=state.get(iid)
        if d:
            dims=', '.join(f'{p["visible_size"][0]}×{p["visible_size"][1]}' for p in d['positions'])
            section+=f'| `{iid}.png` | {d["status"]} | {d["frames"]} | {dims} |\n'
            html.append(f'<h2>{iid}</h2><div class="pair"><div>Avant<img src="{iid}_avant.jpg"></div><div>Après<img src="{iid}_apres.jpg"></div></div><a href="{iid}_import.log">Import</a>')
        else:section+=f'| `{iid}.png` | En attente | — | — |\n'
    section+='\nMesures : largeur × hauteur de la silhouette alpha visible ; en profil, les ailes se chevauchent et la largeur varie avec le battement. Les antennes et longues queues sont incluses. La pose finale de transformation est une copie pixel-identique de `glide` frame 1. Les trois toiles font 1536 × 1024, poses centrées, une composante connexe par frame. Finition mécanique uniquement : nettoyage des pixels détachés, mise à l échelle, centrage ; aucun dessin généré par code.\n<!-- /LOT10 -->'
    if '<!-- LOT10 -->' in text:text=text[:text.index('<!-- LOT10 -->')]+section+text[text.index('<!-- /LOT10 -->')+len('<!-- /LOT10 -->'):]
    else:text+='\n\n'+section+'\n'
    report.write_text(text,encoding='utf-8');(OUT/'index.html').write_text(''.join(html),encoding='utf-8')
if __name__=='__main__':run(int(sys.argv[1]),sys.argv[2])
