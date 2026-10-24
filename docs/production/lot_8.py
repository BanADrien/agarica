"""Finition mécanique, imports unitaires et preuves du lot 8.

Les dessins proviennent exclusivement des générations archivées. Le script
place les cellules, normalise les dimensions et raccorde leurs bords en alpha
prémultiplié. Il ne modifie ni le manifeste ni le code du jeu.
"""
from pathlib import Path
import sys,json,subprocess,os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/production/controles/lot_8'
sys.path.insert(0,str(ROOT/'tools'))
import import_codex_assets as importer
sys.stdout.reconfigure(encoding='utf-8')
ITEMS=json.loads((OUT/'prompts.json').read_text(encoding='utf-8'))

# Bounding sizes are capped by the requested 30px cell margin.
GRIDS={
5:(3,2,[(440,200)]*3+[(460,120),(280,160),(440,440)]),
6:(3,2,[(200,340),(200,340),(260,440),(260,440),(300,300),(452,160)]),
7:(3,2,[(452,105)]*3+[(440,280),(420,400),(400,260)]),
10:(3,2,[(440,300),(250,440),(300,450),(250,452),(250,452),(300,240)]),
12:(4,3,[(324,150)]*3+[(320,130),(200,281),(320,130),(150,80),(100,145),(100,210),(100,280),(145,200),(260,200)]),
14:(4,3,[(190,170),(210,190),(210,180),(180,180),(170,170),(210,140),(180,200),(180,200),(100,210),(150,190),(210,210),(220,130)]),
15:(4,3,[(210,210)]*4+[(220,50),(220,40),(220,80),(220,60),(180,180),(200,160),(200,170),(160,200)]),
16:(3,2,[(452,452),(452,452),(240,452),(300,300),(440,420),(452,120)]),
17:(4,3,[(90,80),(130,130),(130,165),(160,120)]+[(220,180)]*4+[(40,70),(50,55),(150,70),(120,25)]),
18:(4,2,[(90,90),(180,180),(270,270),(324,324)]*2),
22:(4,2,[(240,200)]*3+[(300,200),(300,170),(324,90),(260,180),(280,150)]),
23:(2,2,[(530,350),(400,350),(530,100),(530,220)]),
25:(2,2,[(640,300),(70,50),(640,160),(708,165)]),
26:(3,2,[(300,300),(160,360),(452,180),(320,320),(340,340),(452,110)])}
STRIPS={1:([140,140,35,35,35,35],[1536]*6,set(range(6))),
4:([280,160,300],[1536]*3,{0,1,2}),
8:([90,280,255],[1440,1150,1200],set()),
9:([420,300],[1536]*2,{0,1}),
11:([180,120,200],[1536,1440,1000],{0}),
27:([90,50,64,38],[1350,1290,1400,1360],set())}
SOFT={4,5,9,15,16,18}

def clean(a,soft=False):
    a=a.copy()
    if soft:
        a[a[:,:,3]<3]=0
    else:
        core=a[:,:,3]>=128
        keep=ndimage.binary_dilation(core,iterations=2)&(a[:,:,3]>2)
        a[~keep]=0
    return a

def crop(a,soft=False):
    a=clean(a,soft);y,x=np.where(a[:,:,3]>0)
    if not len(x):raise ValueError('Empty cell')
    return Image.fromarray(a[y.min():y.max()+1,x.min():x.max()+1])

def join_edges(a,vertical=False):
    if vertical:a=np.swapaxes(a,0,1).copy()
    a=a.copy();w=a.shape[1];n=min(96,w//6)
    # Pair the end neighbourhoods, with zero change at the inner boundary
    # and identical premultiplied colour/alpha at the wrapping edge.
    f=a.astype(float);alpha=f[:,:,3:4]/255
    prem=np.concatenate([f[:,:,:3]*alpha,f[:,:,3:4]],axis=2)
    left=prem[:,:n].copy();right=prem[:,-n:][:,::-1].copy()
    t=(.5*(1+np.cos(np.linspace(0,np.pi,n))))[None,:,None]*.5
    prem[:,:n]=left*(1-t)+right*t
    prem[:,-n:]=(right*(1-t)+left*t)[:,::-1]
    alpha=prem[:,:,3:4]/255
    rgb=np.divide(prem[:,:,:3],alpha,out=np.zeros_like(prem[:,:,:3]),where=alpha>0)
    a=np.rint(np.concatenate([rgb,prem[:,:,3:4]],axis=2)).clip(0,255).astype('uint8')
    a[:,-1]=a[:,0]
    if a[:,0,3].max()<=10 and a[:,0,3].max()>0:
        y=int(a[:,0,3].argmax());a[y,0,3]=12;a[y,-1]=a[y,0]
    if vertical:
        # Keep the resampling kernel inside identical endpoint pixels when
        # the importer reduces these 1536px segments to 512px.
        a[:,:12]=a[:,0:1];a[:,-12:]=a[:,0:1]
    return np.swapaxes(a,0,1).copy() if vertical else a

def fit(im,w,h):
    s=min(w/im.width,h/im.height)
    return im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.Resampling.NEAREST)

def grid(a,n):
    cols,rows,targets=GRIDS[n];sheet=Image.new('RGBA',(1536,1024));boxes=[]
    for k,target in enumerate(targets):
        r,c=divmod(k,cols);x0,x1=c*1536//cols,(c+1)*1536//cols;y0,y1=r*1024//rows,(r+1)*1024//rows
        cell=a[r*a.shape[0]//rows:(r+1)*a.shape[0]//rows,c*a.shape[1]//cols:(c+1)*a.shape[1]//cols]
        if n not in SOFT or n==18:
            labels,_=ndimage.label(cell[:,:,3]>=128,np.ones((3,3)))
            sizes=np.bincount(labels.ravel());sizes[0]=0
            slices=ndimage.find_objects(labels);remove=np.zeros(cell.shape[:2],bool)
            for label,sl in enumerate(slices,1):
                if sl is None:continue
                touches=sl[0].start==0 or sl[1].start==0 or sl[0].stop==cell.shape[0] or sl[1].stop==cell.shape[1]
                if touches and sizes[label]<sizes.max()*.25:remove|=labels==label
            if remove.any():
                cell=cell.copy();cell[ndimage.binary_dilation(remove,iterations=8 if n==18 else 3)]=0
        if n in [14,22]:
            cell=clean(cell);labels,_=ndimage.label(cell[:,:,3]>0,np.ones((3,3)))
            sizes=np.bincount(labels.ravel());sizes[0]=0
            cell[labels!=sizes.argmax()]=0
        raw=crop(cell,n in SOFT)
        tw,th=min(target[0],x1-x0-60),min(target[1],y1-y0-60)
        im=raw.resize((tw,th),Image.Resampling.LANCZOS if n in SOFT else Image.Resampling.NEAREST) if (n==6 and k<4) or n in [7,10,16,25] or (n==12 and k in [4,5,7,8,9,10]) or (n==15 and k in [4,5,6,7]) else fit(raw,tw,th)
        if n==12 and k<3:im=im.resize((324,im.height),Image.Resampling.NEAREST)
        if n==16:
            aa=np.array(im).copy();hh,ww=aa.shape[:2]
            yy,xx=np.mgrid[:hh,:ww]
            if k in [0,1,3,5]:
                radius=np.sqrt(((xx-(ww-1)/2)/(ww/2))**2+((yy-(hh-1)/2)/(hh/2))**2)
                weight=np.clip((1-radius)/.22,0,1)
            else:
                distance=np.minimum(np.minimum(xx,ww-1-xx),np.minimum(yy,hh-1-yy))
                weight=np.clip(distance/25,0,1)
            weight=weight*weight*(3-2*weight)
            aa[:,:,3]=np.rint(aa[:,:,3]*weight).astype('uint8');aa[aa[:,:,3]<3]=0
            im=Image.fromarray(aa)
        x=x0+(x1-x0-im.width)//2;y=y0+(y1-y0-im.height)//2
        if n==12 and k<3:y=y0+(y1-y0)//2+75-im.height
        if n==12 and k in [7,8,9,10]:y=y1-30-im.height
        if n==22:y=y0+(y1-y0)//2+(100 if k<6 else 90)-im.height
        sheet.paste(im,(x,y));boxes.append([x,y,x+im.width,y+im.height])
    return sheet,boxes

def strips(a,n):
    heights,widths,tile=STRIPS[n];count=len(heights);sheet=Image.new('RGBA',(1536,1024));boxes=[];base_surface=None
    detected=None
    for threshold in [128,80,200,220]:
        occupied=(a[:,:,3]>=threshold).sum(axis=1)>max(10,a.shape[1]*.02)
        occupied=ndimage.binary_closing(occupied,iterations=3)
        seg=[s[0] for s in ndimage.find_objects(ndimage.label(occupied)[0]) if s[0].stop-s[0].start>=8]
        if len(seg)==count:
            detected=seg;break
    for r,(h,w) in enumerate(zip(heights,widths)):
        y0,y1=r*1024//count,(r+1)*1024//count
        cell=a[max(0,detected[r].start-3):min(a.shape[0],detected[r].stop+3)] if detected else a[r*a.shape[0]//count:(r+1)*a.shape[0]//count]
        im=crop(cell,n in SOFT)
        if r in tile:
            im=im.resize((w,h),Image.Resampling.LANCZOS if n in SOFT else Image.Resampling.NEAREST)
            ar=np.array(im)
            if n in SOFT:
                feather=min(12,h//8)
                ar[:feather,:,3]=np.rint(ar[:feather,:,3]*np.linspace(0,1,feather)[:,None]).astype('uint8')
                if not ((n==4 and r==2) or (n==9 and r==1)):
                    ar[-feather:,:,3]=np.rint(ar[-feather:,:,3]*np.linspace(1,0,feather)[:,None]).astype('uint8')
            if n==1 and r<2:ar[:,:,3]=255
            if (n==4 and r==2) or (n==9 and r==1):
                body=ar[round(h*(.4 if n==4 else .8)):]
                missing=body[:,:,3]<128
                body[:,:,:3][missing]=[184,200,220] if n==4 else [31,58,26]
                body[:,:,3]=255
            if n==1 and r>=2:
                if base_surface is None:base_surface=join_edges(ar)
                ar=np.roll(base_surface,96*(r-2),axis=1)
            ar=join_edges(ar);im=Image.fromarray(ar)
        else:im=im.resize((w,h),Image.Resampling.NEAREST)
        x=(1536-im.width)//2;y=y0+(y1-y0-im.height)//2
        sheet.paste(im,(x,y));boxes.append([x,y,x+im.width,y+im.height])
    return sheet,boxes

def sprites(a,n):
    counts={19:[4,4],20:[4],21:[4,5]}[n]
    labels,_=ndimage.label(a[:,:,3]>=128,np.ones((3,3)))
    sizes=np.bincount(labels.ravel());sizes[0]=0;sl=ndimage.find_objects(labels)
    ids=sorted(range(1,len(sizes)),key=lambda k:sizes[k],reverse=True)[:sum(counts)]
    ids.sort(key=lambda k:(sl[k-1][0].start+sl[k-1][0].stop)/2)
    frames=[];offset=0
    for count in counts:
        row=[]
        for k in sorted(ids[offset:offset+count],key=lambda k:sl[k-1][1].start):
            sy,sx=sl[k-1];cell=a[max(0,sy.start-3):min(a.shape[0],sy.stop+3),max(0,sx.start-3):min(a.shape[1],sx.stop+3)]
            row.append(crop(cell))
        frames.append(row);offset+=count
    max_width=min(1536/c-40 for c in counts)
    s=min(max_width/max(im.width for row in frames for im in row),
          (260 if n==19 else 220 if n==20 else 200)/max(im.height for im in frames[0]))
    if n==20:s=min(s,220/max(im.width for im in frames[0]))
    sheet=Image.new('RGBA',(1536,1024));boxes=[]
    for r,row in enumerate(frames):
        baseline=800 if n==20 else 430+r*512
        if n==20:baseline=512+round(max(im.height for im in row)*s/2)
        for c,im in enumerate(row):
            im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.NEAREST)
            aa=np.array(im);ll,_=ndimage.label(aa[:,:,3]>0,np.ones((3,3)));ss=np.bincount(ll.ravel());ss[0]=0;aa[ll!=ss.argmax()]=0;im=Image.fromarray(aa)
            x=round((c+.5)*1536/len(row)-im.width/2);y=baseline-im.height
            sheet.paste(im,(x,y));boxes.append([x,y,x+im.width,baseline])
    return sheet,boxes

def prepare(n,path):
    a=np.array(Image.open(path).convert('RGBA'))
    Image.fromarray(a).save(OUT/f'{n:02d}_generation_brute.png')
    boxes=[]
    if n in GRIDS:im,boxes=grid(a,n)
    elif n in STRIPS:im,boxes=strips(a,n)
    elif n in [19,20,21]:im,boxes=sprites(a,n)
    elif n==24:
        im=Image.new('RGBA',(1024,1536))
        for c,w in enumerate([60,30]):
            part=crop(a[:,c*a.shape[1]//2:(c+1)*a.shape[1]//2])
            part=part.resize((w,1536),Image.Resampling.NEAREST)
            part=Image.fromarray(join_edges(np.array(part),True));im.paste(part,((330 if c==0 else 700)-w//2,0))
    elif n==13:
        im=Image.fromarray(a).convert('L').resize((1536,1024),Image.Resampling.LANCZOS).convert('RGBA')
    elif n==3:
        a=np.array(Image.fromarray(a).convert('RGB').resize((1536,1024))).copy()
        target=np.array([42,158,247]);start=824
        t=np.linspace(0,1,1024-start-60)[:,None,None]
        a[start:964]=np.rint(a[start:964]*(1-t)+target*t).astype('uint8');a[964:]=target
        im=Image.fromarray(join_edges(np.array(Image.fromarray(a).convert('RGBA'))))
    elif n==2:
        part=crop(a).resize((1536,944),Image.Resampling.NEAREST);a=np.array(part).copy()
        missing=a[120:,:,3]<128;a[120:,:,:3][missing]=[22,40,15];a[120:,:,3]=255
        im=Image.new('RGBA',(1536,1024));im.paste(Image.fromarray(join_edges(a)),(0,80))
    else:raise ValueError(n)
    source=ROOT/ITEMS[n-1]['source'];source.parent.mkdir(parents=True,exist_ok=True);im.save(source)
    bg=Image.new('RGB',im.size,(55,58,67));bg.paste(im,mask=im.getchannel('A'));bg.thumbnail((1152,768));bg.save(OUT/f'{n:02d}_final.jpg')
    return {'source':ITEMS[n-1]['source'],'size':list(im.size),'placements':boxes}

def montage(iid,im,vertical=False,suffix=''):
    im=im.convert('RGBA');a=np.array(im)
    edge=int(np.abs((a[-1] if vertical else a[:,-1]).astype(int)-(a[0] if vertical else a[:,0]).astype(int)).max())
    dims=(im.width,im.height*2) if vertical else (im.width*2,im.height)
    out=Image.new('RGBA',dims);out.paste(im,(0,0));out.paste(im,(0,im.height) if vertical else (im.width,0))
    out.save(OUT/f'raccord_{iid}{suffix}.png')
    # A dark presentation makes alpha seams visually inspectable too.
    bg=Image.new('RGB',dims,(44,48,60));bg.paste(out,mask=out.getchannel('A'));bg.thumbnail((1536,768));bg.save(OUT/f'raccord_{iid}{suffix}.jpg')
    return {'edge_rgba_max_difference':edge,'vertical':vertical}

def borders(im):
    a=np.array(im.convert('RGBA'));h,w=a.shape[:2];rgb=a[:,:,:3].astype(float)
    center=np.median(rgb[h//2-2:h//2+3,w//2-2:w//2+3],axis=(0,1))
    ok=(np.linalg.norm(rgb-center,axis=2)<30)&(a[:,:,3]>220)
    y,x=h//2,w//2;l=r=x;t=b=y
    while l>0 and ok[y,l-1]:l-=1
    while r<w-1 and ok[y,r+1]:r+=1
    while t>0 and ok[t-1,x]:t-=1
    while b<h-1 and ok[b+1,x]:b+=1
    solid=a[:,:,3]>=128
    xx=np.where(solid[y])[0]; yy=np.where(solid[:,x])[0]
    visible={'left':max(0,l-int(xx.min())), 'right':max(0,int(xx.max())-r),
             'top':max(0,t-int(yy.min())), 'bottom':max(0,int(yy.max())-b)}
    return {'left':l,'right':w-1-r,'top':t,'bottom':h-1-b,
            'visible_border':visible,
            'method':'central flat-fill scan, RGB distance <30; visible border excludes transparent margins, alpha threshold 128; inspect corners for slice insets'}

def finish(n,path):
    state_path=OUT/'suivi.json';state=json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else {}
    data=prepare(n,path);ids=ITEMS[n-1]['ids']
    command=[sys.executable,str(ROOT/'tools/import_codex_assets.py'),'--only',*ids]
    if str(n) in state or (OUT/f'{n:02d}_import.log').exists():command.append('--force')
    env=os.environ.copy();env['PYTHONIOENCODING']='utf-8'
    result=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True,encoding='utf-8')
    log=result.stdout+result.stderr;(OUT/f'{n:02d}_import.log').write_text(log,encoding='utf-8')
    if result.returncode or 'AVERTISSEMENT' in log or 'avertissement(s)' in log:raise RuntimeError(log)
    anims,items,_=importer.load_manifest();data['ids']=ids;data['status']='importe sans avertissement';data['raccords']={};data['borders']={}
    tile_ids=ids if n in [1,2,3,4,9,24] else ids[:1] if n==11 else []
    for iid in tile_ids:
        final=Image.open(ROOT/items[iid]['path']);data['raccords'][iid]=montage(iid,final,n==24)
        # Record the pre-import cell/source separately.
        ent=items[iid]['src'];source=Image.open(ROOT/data['source']).convert('RGBA')
        if 'grid' in ent:
            cols,rows=ent['grid'];r,c=divmod(ent['cell'],cols);source=source.crop((c*source.width//cols,r*source.height//rows,(c+1)*source.width//cols,(r+1)*source.height//rows))
        elif n==24:source=source.crop((0 if iid==ids[0] else 512,0,512 if iid==ids[0] else 1024,1536))
        montage(iid,source,n==24,'_source')
        if data['raccords'][iid]['edge_rgba_max_difference']>3:data.setdefault('problems',[]).append(iid+': bord apres import a controler')
    for iid in ids:
        if iid in ['ui_bulle','ui_invite','ui_banniere','ui_energie_cadre','ui_boss_cadre']:
            data['borders'][iid]=borders(Image.open(ROOT/items[iid]['path']))
    state[str(n)]=data;state_path.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
    report=ROOT/'docs/production/RAPPORT_CODEX.md';text=report.read_text(encoding='utf-8');start='<!-- LOT8_SUIVI -->';end='<!-- /LOT8_SUIVI -->'
    section=start+'\n## Lot n°8 — 2026-10-23\n\nGénération via image_gen intégré ; prompts : `controles/lot_8/prompts.json`. Dessins bruts, montages de raccord source/import et journaux : `controles/lot_8/`. Finition mécanique : `lot_8.py` (placement, dimensions, raccords en alpha prémultiplié). Aucun dessin de réutilisation régénéré, aucune retouche des images existantes d’Agarica/Geralt.\n\n| # | Source | Statut | Contrôles / problèmes |\n|---|---|---|---|\n'
    for i in ITEMS:
        d=state.get(str(i['n']));status=d['status'] if d else 'à générer'
        notes=('Raccords : '+', '.join(f'{k} Δ={v["edge_rgba_max_difference"]}' for k,v in d['raccords'].items())) if d and d['raccords'] else ''
        if d and d.get('problems'):notes+=' ; '+' ; '.join(d['problems'])
        section+=f'| {i["n"]} | `{i["source"]}` | {status} | {notes} |\n'
    section+='\n### Bordures mesurées (pixels des sorties, sans agrandissement pour ces cadres)\n\n'
    for d in state.values():
        for k,v in d.get('borders',{}).items():section+=f'- `{k}` : gauche {v["left"]}, droite {v["right"]}, haut {v["top"]}, bas {v["bottom"]}. Mesure de la bordure centrale ; réserver aussi les ornements des coins pour le 9-slice.\n'
    section+='\nLueurs : sorties RGBA à alpha réel ; aucun fond noir de repli utilisé. Mesures détaillées : `controles/lot_8/suivi.json`.\n'+end
    if start in text:text=text[:text.index(start)]+section+text[text.index(end)+len(end):]
    else:text+='\n\n'+section+'\n'
    report.write_text(text,encoding='utf-8');print(log);print(json.dumps(data,ensure_ascii=False))

if __name__=='__main__':finish(int(sys.argv[1]),sys.argv[2])
