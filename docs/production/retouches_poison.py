"""Redessins poison : preparation, preservation des cellules hors sujet, import."""
from pathlib import Path
import sys,json,shutil,subprocess,os,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'docs/production'));import lot_8 as lot
sys.path.insert(0,str(ROOT/'tools'));import import_codex_assets as imp
sys.stdout.reconfigure(encoding='utf-8')
OUT=ROOT/'docs/production/controles/retouches_poison_2026-10-23';OUT.mkdir(parents=True,exist_ok=True)
JOBS={2:None,9:[1],11:[0,2],12:list(range(11)),14:[0,1,8,11],15:[8,10],17:None,22:[3,4,5]}
EXTRA={31:('vfx_souffle_toxique',3,2,[(130,110),(300,210),(420,270)]+[(420,270)]*3),
       32:('vfx_flaque_mousse',4,2,[(250,120),(280,110),(300,95),(300,90)]+[(300,130)]*4),
       33:('vfx_vague_mousse',4,1,[(300,70)]*4)}
STATIC={34:('mousse_amas',['mousse_amas_intact','mousse_amas_fissure']),
        35:('mousse_mur',['mousse_mur']),36:('porte_mousse',['porte_mousse'])}
def job(n):
    if n<30:
        j=lot.ITEMS[n-1].copy();selected=JOBS[n]
        j['ids']=[iid for k,iid in enumerate(j['ids']) if selected is None or k in selected]
        return j
    if n in STATIC:return {'source':f'assets/_codex_src/{STATIC[n][0]}.png','ids':STATIC[n][1]}
    return {'source':f'assets/vfx/{EXTRA[n][0]}.png','ids':[EXTRA[n][0]]}
def setup():
    baseline={}
    for n in [*JOBS,*EXTRA,*STATIC]:
        j=job(n);p=ROOT/j['source'];d=OUT/'avant'/j['source'];d.parent.mkdir(parents=True,exist_ok=True)
        if not d.exists():shutil.copy2(p,d)
    for p in (ROOT/'assets').rglob('*.png'):baseline[str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest()
    for p in (ROOT/'src').rglob('*'):
        if p.is_file():baseline[str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest()
    p=OUT/'etat_avant.json'
    if not p.exists():p.write_text(json.dumps(baseline,indent=2),encoding='utf-8')
def finish(n,rawpath):
    j=job(n);old=Image.open(OUT/'avant'/j['source']).convert('RGBA')
    raw=Image.open(rawpath).convert('RGBA');raw.save(OUT/f'{n:02d}_generation.png')
    if n<30:
        if n==12:
            # The tall tuft's bead extends 20px above the model's last-row
            # boundary. Repack its complete generated silhouette, without drawing.
            ar=np.array(raw);hh,ww=ar.shape[:2]
            box=(ww//4,int(hh*.63),ww//2,hh)
            piece=lot.crop(np.array(raw.crop(box)))
            ar[int(hh*.63):,ww//4:ww//2]=0;repacked=Image.fromarray(ar)
            piece=lot.fit(piece,ww//4-40,hh//3-40)
            repacked.paste(piece,(ww//4+(ww//4-piece.width)//2,hh-piece.height-20))
            rawpath=OUT/'12_repositionnement.png';repacked.save(rawpath)
        previous=lot.OUT;lot.OUT=OUT
        data=lot.prepare(n,rawpath);lot.OUT=previous
        im=Image.open(ROOT/j['source']).convert('RGBA')
        selected=JOBS[n]
        if selected is not None:
            cols,rows=(1,len(lot.STRIPS[n][0])) if n in lot.STRIPS else lot.GRIDS[n][:2]
            restored=old.copy()
            for k in selected:
                r,c=divmod(k,cols);box=(c*1536//cols,r*1024//rows,(c+1)*1536//cols,(r+1)*1024//rows)
                restored.paste(im.crop(box),box[:2])
            im=restored
    elif n in STATIC:
        im=Image.new('RGBA',old.size)
        if n==34:
            for k in range(2):
                piece=lot.crop(np.array(raw.crop((k*raw.width//2,0,(k+1)*raw.width//2,raw.height))))
                piece=lot.fit(piece,688,650)
                im.paste(piece,(round((k+.5)*768-piece.width/2),850-piece.height))
        else:
            piece=lot.fit(lot.crop(np.array(raw)),old.width-60,old.height-60)
            im.paste(piece,((old.width-piece.width)//2,old.height-30-piece.height))
    else:
        iid,cols,rows,targets=EXTRA[n];im=Image.new('RGBA',(1536,1024))
        for k,(tw,th) in enumerate(targets):
            r,c=divmod(k,cols);box=(c*raw.width//cols,r*raw.height//rows,(c+1)*raw.width//cols,(r+1)*raw.height//rows)
            if n==31:
                # Unequal visual widths in the generated start row; crop in
                # the actual empty gutters, then place into the manifest grid.
                edges=[0,350,900,1536] if r==0 else [0,520,1020,1536]
                box=(edges[c]*raw.width//1536,(0 if r==0 else 540)*raw.height//1024,edges[c+1]*raw.width//1536,(540 if r==0 else 1024)*raw.height//1024)
            piece=lot.crop(np.array(raw.crop(box)))
            piece=piece.resize((tw,th),Image.Resampling.NEAREST) if n==33 else lot.fit(piece,tw,th)
            x=round((c+.5)*1536/cols-piece.width/2)
            # Shared baseline; wave is intentionally at the bottom of its full-height cells.
            y=(1000 if n==33 else r*512+450)-piece.height
            im.paste(piece,(x,y))
    im.save(ROOT/j['source'])
    preview=Image.new('RGB',im.size,(55,58,66));preview.paste(im,mask=im.getchannel('A'));preview.thumbnail((1152,768));preview.save(OUT/f'{n:02d}_apres.jpg',quality=95)
    before=Image.new('RGB',old.size,(55,58,66));before.paste(old,mask=old.getchannel('A'));before.thumbnail((1152,768));before.save(OUT/f'{n:02d}_avant.jpg',quality=95)
    command=[sys.executable,'tools/import_codex_assets.py','--only',*j['ids'],'--force']
    env=os.environ.copy();env['PYTHONIOENCODING']='utf-8'
    r=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,encoding='utf-8',env=env);log=r.stdout+r.stderr
    (OUT/f'{n:02d}_import.log').write_text(log,encoding='utf-8')
    print(log)
    if r.returncode or 'AVERTISSEMENT' in log or 'avertissement(s)' in log:raise RuntimeError(log)
    _,items,_=imp.load_manifest();seams={}
    for iid in j['ids']:
        if iid in ['liquide_mousse_toxique','decor_tapis_mousse','couche_horizon_malade']:
            previous=lot.OUT;lot.OUT=OUT
            seams[iid]=lot.montage(iid,Image.open(ROOT/items[iid]['path']))
            lot.montage(iid,im if n==2 else im.crop((0,0 if n==11 else 512,1536,341 if n==11 else 1024)),suffix='_source')
            lot.OUT=previous
            assert seams[iid]['edge_rgba_max_difference']==0
    statepath=OUT/'suivi.json';state=json.loads(statepath.read_text(encoding='utf-8')) if statepath.exists() else {}
    state[str(n)]={**j,'raccords':seams,'status':'importe sans avertissement'}
    statepath.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
    update_docs(state)
def update_docs(state):
    import html
    parts=['<!doctype html><meta charset="utf-8"><title>Retouches poison</title><style>body{background:#20242c;color:#eee;font:16px system-ui;margin:30px}a{color:#9fce73}.pair{display:grid;grid-template-columns:1fr 1fr;gap:15px}img{width:100%}section{margin-bottom:35px}</style><h1>Retouches poison — avant / après</h1>']
    section='<!-- RETOUCHES_POISON_2026 -->\n## Retouches poison — 2026-10-23\n\nRedessins via imagegen : palette verte courte, aplats mats, contours noirs et pixels lisibles. Sauvegardes, générations, comparaisons et imports : `controles/retouches_poison_2026-10-23/`. Les cellules sans poison des planches mixtes sont conservées à l identique ; seuls les identifiants concernés sont réimportés.\n\n| Source | État | Contrôle |\n|---|---|---|\n'
    for key,d in state.items():
        n=int(key);notes=', '.join(k+' : raccord RGBA Δ='+str(v['edge_rgba_max_difference']) for k,v in d['raccords'].items())
        section+=f'| `{d["source"]}` | Import sans avertissement | {notes} |\n'
        parts.append(f'<section><h2>{html.escape(d["source"])}</h2><div class="pair"><div>Avant<img src="{n:02d}_avant.jpg"></div><div>Après<img src="{n:02d}_apres.jpg"></div></div><a href="{n:02d}_import.log">Journal import</a></section>')
    section+='\nGalerie : [avant / après](controles/retouches_poison_2026-10-23/index.html).\n<!-- /RETOUCHES_POISON_2026 -->'
    report=ROOT/'docs/production/RAPPORT_CODEX.md';text=report.read_text(encoding='utf-8')
    begin='<!-- RETOUCHES_POISON_2026 -->';end='<!-- /RETOUCHES_POISON_2026 -->'
    if begin in text:text=text[:text.index(begin)]+section+text[text.index(end)+len(end):]
    else:text+='\n\n'+section+'\n'
    report.write_text(text,encoding='utf-8');(OUT/'index.html').write_text(''.join(parts),encoding='utf-8')
if __name__=='__main__':
    if sys.argv[1]=='setup':setup()
    else:finish(int(sys.argv[1]),sys.argv[2])
