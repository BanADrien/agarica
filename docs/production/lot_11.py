"""Finition mecanique et controles des dessins generes du lot 11.
Les formes proviennent toutes d'imagegen : placement, recadrage, echelle
uniforme, copie de parties fixes et coutures seulement.
"""
from pathlib import Path
import sys,json,os,subprocess
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/production/controles/lot_11'
sys.path.insert(0,str(ROOT/'tools'));import import_codex_assets as imp
sys.path.insert(0,str(ROOT/'docs/production'));import lot_8 as lot8
sys.stdout.reconfigure(encoding='utf-8')
JOBS=json.loads((OUT/'prompts.json').read_text(encoding='utf-8'))
def cleaned(im,soft=False):
    a=np.array(im.convert('RGBA'))
    if soft:a[a[:,:,3]<3]=0
    else:
        mask=ndimage.binary_dilation(a[:,:,3]>=128,iterations=2)&(a[:,:,3]>2);a[~mask]=0
    return Image.fromarray(a)
def crop(im,soft=False):
    im=cleaned(im,soft);b=im.getbbox();assert b,'Empty drawing';return im.crop(b)
def biggest(im):
    a=np.array(cleaned(im));ll,_=ndimage.label(a[:,:,3]>0,np.ones((3,3)));ss=np.bincount(ll.ravel());ss[0]=0;a[ll!=ss.argmax()]=0
    return crop(Image.fromarray(a))
def scale(im,s):return im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.Resampling.NEAREST)
def bbox_profile(im):
    a=np.array(im)[:,:,3]>128;valid=a.any(axis=0);top=np.argmax(a,axis=0).astype(float);bottom=(a.shape[0]-1-np.argmax(a[::-1],axis=0)).astype(float)
    top[~valid]=np.nan;bottom[~valid]=np.nan;return top,bottom
def preview(im,name):
    bg=Image.new('RGB',im.size,(37,29,48));bg.paste(im,mask=im.getchannel('A'));bg.thumbnail((1536,1024));bg.save(OUT/name,quality=95)
def vfx(raw):
    sheet=Image.new('RGBA',(1536,1024));meta=[]
    for k,target in enumerate([90,40,0,16,16]):
        f=raw.crop((k*raw.width//5,0,(k+1)*raw.width//5,raw.height));a=np.array(f)
        white=(a[:,:,0]>190)&(a[:,:,1]>210)&(a[:,:,2]>190)&(a[:,:,3]>80)
        yy,xx=np.where(white);assert len(xx)>10
        s=230/(xx.max()-xx.min()+1);f=scale(f,s);a=np.array(f)
        white=(a[:,:,0]>190)&(a[:,:,1]>210)&(a[:,:,2]>190)&(a[:,:,3]>80);yy,xx=np.where(white)
        cx=(xx.min()+xx.max())/2;cy=(yy.min()+yy.max())/2
        window=f.crop((round(cx-123),round(cy-120),round(cx+124),round(cy+120)))
        b=np.array(window);h,w=b.shape[:2];Y,X=np.mgrid[:h,:w]
        d=np.minimum.reduce([X,w-1-X,Y,h-1-Y]);weight=np.clip(d/8,0,1)
        b[:,:,3]=np.rint(b[:,:,3]*weight).astype('uint8')
        peak=[153,255,255,191,89][k];mx=b[:,:,3].max();b[:,:,3]=np.rint(b[:,:,3].astype(float)*peak/max(1,mx)).astype('uint8');b[b[:,:,3]<3]=0
        im=crop(Image.fromarray(b),True);x=round((k+.5)*1536/5-im.width/2);y=round(512-im.height/2);sheet.paste(im,(x,y))
        meta.append({'cell':k,'bbox':[x,y,x+im.width,y+im.height],'alpha_max':peak,'target_fang_gap':target})
    return sheet,{'frames':5,'placements':meta,'glow':'real alpha'}

def hrepeat(arr,width):
    out=arr.copy()
    while out.shape[1]<width+40:out=imp.join_seam(out,arr)
    out=imp.make_periodic(out,width)
    out[:,-1]=out[:,0]
    return out

def join_edge(piece,mid,left=False,right=False):
    a=np.array(piece).copy();m=np.array(mid);w=a.shape[1];n=40
    if left:
        donor=m[:,:80];c=imp.seam_cut(donor[:,40:80],a[:,40:80])
        for y in range(512):a[y,40:40+c[y]]=donor[y,40:40+c[y]]
        a[:,:40]=donor[:,:40]
    if right:
        donor=m[:,-80:];c=imp.seam_cut(a[:,-80:-40],donor[:,:40])
        for y in range(512):a[y,w-80+c[y]:w-40]=donor[y,c[y]:40]
        a[:,-40:]=donor[:,-40:]
    return Image.fromarray(a)

def middle_fork(raw):
    band=biggest(raw.crop((0,0,raw.width,raw.height//2)))
    top,bot=bbox_profile(band);t=float(np.nanpercentile(top,85));b=float(np.nanmedian(bot));s=224/(b-t)
    art=scale(band,s);t=round(t*s)
    # The upper cut is a crop through the moss cushion, making a stable flat
    # walk surface. The natural bark underside and the generated grain remain.
    art=art.crop((0,t,art.width,t+240));mid=Image.new('RGBA',(art.width,512));mid.paste(art,(0,256))
    mid=Image.fromarray(hrepeat(np.array(mid),1536));mid.save(OUT/'branche_milieu_reference.png')
    lower=biggest(raw.crop((0,raw.height//2,raw.width,raw.height)))
    lt,lb=bbox_profile(lower);safe=lt[:round(lower.width*.25)];surface=round(np.nanpercentile(safe,70))
    arm=biggest(lower.crop((0,0,lower.width,max(1,surface-3))))
    arm=scale(arm,min(620/arm.width,235/arm.height))
    fork=Image.new('RGBA',(1024,512));fork.paste(arm,(300,268-arm.height))
    fork=Image.alpha_composite(fork,mid.crop((0,0,1024,512)));fork=join_edge(fork,mid,True,True)
    sheet=Image.new('RGBA',(1536,1024));sheet.paste(mid,(0,0));sheet.paste(fork,(256,512))
    return sheet,{'pieces':{'branche_milieu':measure_branch('branche_milieu',mid),'branche_fourche':measure_branch('branche_fourche',fork)}}

def measure_branch(iid,im):
    top,bot=bbox_profile(im)
    if iid=='branche_base':sl=slice(im.width-384,im.width)
    elif iid=='branche_bout':sl=slice(0,320)
    else:sl=slice(None)
    tt=top[sl];bb=bot[sl]
    if iid=='branche_fourche':keep=tt>=252;tt=tt[keep];bb=bb[keep]
    return {'size':list(im.size),'walk_median':float(np.nanmedian(tt)),'underside_median':float(np.nanmedian(bb)),
            'walk_range':[float(np.nanmin(tt)),float(np.nanmax(tt))]}

def branch_end(raw,iid):
    art=biggest(raw);top,bot=bbox_profile(art)
    side=slice(round(art.width*.78),round(art.width*.96)) if iid=='branche_base' else slice(round(art.width*.03),round(art.width*.22))
    t=float(np.nanpercentile(top[side],80));b=float(np.nanmedian(bot[side]));s=224/(b-t)
    art=scale(art,s);piece=Image.new('RGBA',(art.width,512));piece.paste(art,(0,256-round(t*s)))
    mid=Image.open(OUT/'branche_milieu_reference.png').convert('RGBA');arr=np.array(piece);target=640 if iid=='branche_base' else 448
    if arr.shape[1]<target:
        extra=target-arr.shape[1]+40
        arr=imp.join_seam(arr,np.array(mid)[:,:extra]) if iid=='branche_base' else imp.join_seam(np.array(mid)[:,-extra:],arr)
    if arr.shape[1]>target:arr=arr[:,:target] if iid=='branche_base' else arr[:,-target:]
    arr[496:]=0
    if iid=='branche_base':arr[:256,-384:]=0
    else:arr[:256,:320]=0
    piece=Image.fromarray(arr);piece=join_edge(piece,mid,left=iid=='branche_bout',right=iid=='branche_base')
    return piece

def base_tip(base,bout):
    bb=branch_end(base,'branche_base');bt=branch_end(bout,'branche_bout')
    sheet=Image.new('RGBA',(1536,1024));sheet.paste(bb,((1536-bb.width)//2,0));sheet.paste(bt,((1536-bt.width)//2,512))
    return sheet,{'pieces':{'branche_base':measure_branch('branche_base',bb),'branche_bout':measure_branch('branche_bout',bt)}}

def trunk_segment(raw):
    art=biggest(raw);a=np.array(art);mask=a[:,:,3]>128;spans=[]
    for row in mask:
        xx=np.where(row)[0]
        if len(xx):spans.append(xx[-1]-xx[0]+1)
    art=scale(art,max(768/np.median(spans),1536/art.height));arr=np.array(art)
    # Use one contiguous generated length, rather than introduce an internal
    # repetition. Only the endpoint neighbourhoods are blended for the loop.
    arr=arr[(arr.shape[0]-1536)//2:(arr.shape[0]-1536)//2+1536].copy()
    widths=[]
    for row in arr[:,:,3]>128:
        xx=np.where(row)[0];widths.append(xx[-1]-xx[0]+1 if len(xx) else 0)
    arr=lot8.join_edges(arr,vertical=True)
    im=Image.new('RGBA',(1024,1536));im.paste(Image.fromarray(arr),((1024-arr.shape[1])//2,0));im.save(OUT/'tronc_segment_reference.png')
    return im,{'pieces':{'tronc_segment':{'size':[int(arr.shape[1]),1536],'body_median_width':int(np.median(widths))}}}

def trunk_base(raw):
    art=biggest(raw);art=scale(art,1400/art.width);a=np.array(art);widths=[]
    for row in a[:,:,3]>128:
        xx=np.where(row)[0];widths.append(xx[-1]-xx[0]+1 if len(xx) else 0)
    stable=ndimage.median_filter(np.array(widths),size=15)
    neck=int(np.where(stable>=780)[0][0]);roots=art.crop((0,neck,art.width,art.height))
    y=960-roots.height+1;x=(1536-art.width)//2
    donor=Image.open(ROOT/'assets/decors/elements/tronc_segment.png').convert('RGBA')
    stem=Image.new('RGBA',(1536,1024));stem.paste(donor.crop((0,0,donor.width,1024)),(round(768-donor.width/2),0))
    rootlayer=Image.new('RGBA',(1536,1024));rootlayer.paste(roots,(x,y))
    n=128;aa=np.array(stem);bb=np.array(rootlayer);out=bb.copy();out[:y]=aa[:y]
    t=(.5-.5*np.cos(np.linspace(0,np.pi,n)))[:,None,None]
    a=imp._premultiplied(aa[y:y+n]);b=imp._premultiplied(bb[y:y+n]);mixed=a*(1-t)+b*t
    al=mixed[:,:,3:4]/255;rgb=np.divide(mixed[:,:,:3],al,out=np.zeros_like(mixed[:,:,:3]),where=al>0)
    out[y:y+n]=np.rint(np.concatenate([rgb,mixed[:,:,3:4]],axis=2)).clip(0,255).astype('uint8')
    im=Image.fromarray(out);im.save(OUT/'tronc_base_prepare.png')
    return im,{'pieces':{'tronc_base':{'size':[1400,1024],'axis_source':768,'axis_final':700,'ground_line':960}},'root_join_y':y}

def repos(raw):
    import lot_10
    ff=lot_10.frames(raw,8);standing_scale=250/ff[0].height
    first=[biggest(scale(f,standing_scale)) for f in ff[:3]]
    idle_scale=180/ff[4].height;base=biggest(scale(ff[4],idle_scale));w=base.width
    basecanvas=Image.new('RGBA',(w,200));basecanvas.paste(base,(0,10));idle=[]
    for k,delta in enumerate([0,3,5,2]):
        if k==0:pose=base
        else:
            upper=biggest(scale(ff[4+k],idle_scale));variant=Image.new('RGBA',(w,200));variant.paste(upper,((w-upper.width)//2,10-delta))
            va=np.array(variant);ba=np.array(basecanvas);out=ba.copy();out[:75]=va[:75]
            cut=imp.seam_cut(np.swapaxes(va[75:95],0,1),np.swapaxes(ba[75:95],0,1))
            for col in range(w):out[75:75+cut[col],col]=va[75:75+cut[col],col]
            pose=biggest(Image.fromarray(out))
        idle.append(pose)
    allposes=first+[idle[0]]+idle;sheet=Image.new('RGBA',(1536,1024));placements=[]
    posefolder=OUT/'poses';posefolder.mkdir(exist_ok=True)
    for k,pose in enumerate(allposes):
        r,c=divmod(k,4);x=round((c+.5)*384-pose.width/2);y=450+r*512-pose.height
        sheet.paste(pose,(x,y));pose.save(posefolder/f'agarica_repos_{k:02d}.png');placements.append({'cell':k,'bbox':[x,y,x+pose.width,y+pose.height],'visible_size':list(pose.size)})
    return sheet,{'frames':8,'placements':placements,'stand_height':allposes[0].height,'idle_heights':[p.height for p in idle],'static_lower_pixels':90,'idle_widths':[p.width for p in idle]}
def do_import(n,im,data):
    j=JOBS[n-1];p=ROOT/j['source'];p.parent.mkdir(parents=True,exist_ok=True);im.save(p);preview(im,f'{n:02d}_final.jpg')
    env=os.environ.copy();env['PYTHONIOENCODING']='utf-8';cmd=[sys.executable,'tools/import_codex_assets.py','--only',*j['ids']]
    if (OUT/f'{n:02d}_import.log').exists():cmd.append('--force')
    r=subprocess.run(cmd,cwd=ROOT,env=env,capture_output=True,text=True,encoding='utf-8');log=r.stdout+r.stderr;(OUT/f'{n:02d}_import.log').write_text(log,encoding='utf-8');print(log)
    assert r.returncode==0 and 'AVERTISSEMENT' not in log and 'avertissement(s)' not in log
    if n in [2,3]:
        _,items,_=imp.load_manifest();data['pieces']={iid:measure_branch(iid,Image.open(ROOT/items[iid]['path']).convert('RGBA')) for iid in j['ids']}
    path=OUT/'suivi.json';state=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {};state[str(n)]={**j,**data,'status':'importe sans avertissement'};path.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8');docs(state)
def docs(state):
    section='<!-- LOT11 -->\n## Lot n°11 — 2026-11-04\n\nDessins via imagegen ; finition mécanique dans `lot_11.py`, sans modification de l importeur, de `src/` ni du manifeste. Générations, imports et contrôles : [galerie du lot 11](controles/lot_11/index.html), `controles/lot_11/suivi.json`.\n\n| # | Source | État | Contrôles |\n|---|---|---|---|\n'
    html=['<!doctype html><meta charset="utf-8"><title>Lot 11</title><style>body{background:#15101f;color:#eee;margin:25px;font:16px system-ui}img{max-width:100%}a{color:#8fe3b8}article{margin-bottom:35px}</style><h1>Lot 11 — crocs, branches et repos</h1>']
    for j in JOBS:
        n=j['n'];d=state.get(str(n));notes=''
        if d:
            notes=str(d.get('frames',''))+' frames' if d.get('frames') else '; '.join(k+': '+str(v.get('size',''))+' marche='+str(v.get('walk_median','—'))+' dessous='+str(v.get('underside_median','—')) for k,v in d.get('pieces',{}).items())
            section+=f'| {n} | `{j["source"]}` | {d["status"]} | {notes} |\n'
            html.append(f'<article><h2>{n} — {j["source"]}</h2><img src="{n:02d}_final.jpg"><p><a href="{n:02d}_import.log">Import</a></p></article>')
        else:section+=f'| {n} | `{j["source"]}` | En attente | — |\n'
    section+='\n<!-- /LOT11 -->'
    p=ROOT/'docs/production/RAPPORT_CODEX.md';text=p.read_text(encoding='utf-8')
    if '<!-- LOT11 -->' in text:text=text[:text.index('<!-- LOT11 -->')]+section+text[text.index('<!-- /LOT11 -->')+len('<!-- /LOT11 -->'):]
    else:text+='\n\n'+section+'\n'
    p.write_text(text,encoding='utf-8');(OUT/'index.html').write_text(''.join(html),encoding='utf-8')
def run(n,rawpath):
    raw=Image.open(rawpath).convert('RGBA');raw.save(OUT/f'{n:02d}_generation.png')
    if n==1:im,data=vfx(raw)
    elif n==2:im,data=middle_fork(raw)
    elif n==3:im,data=base_tip(Image.open(OUT/'03_base_generation.png').convert('RGBA'),raw)
    elif n==4:im,data=trunk_segment(raw)
    elif n==5:im,data=trunk_base(raw)
    elif n==6:im,data=repos(raw)
    else:raise NotImplementedError(n)
    do_import(n,im,data)
if __name__=='__main__':run(int(sys.argv[1]),sys.argv[2])
