"""Archivage des bruts, placement des sprites et contrôle des dimensions."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/production/controles/kainati_sol_2026-10-23'
sys.stdout.reconfigure(encoding='utf-8')

def load(path,name):
    im=Image.open(path).convert('RGBA')
    im.save(OUT/(name+'_generation_brute.png'))
    return np.array(im)

def trim(a):
    y,x=np.where(a[:,:,3]>0)
    assert len(x),'Empty silhouette'
    return Image.fromarray(a[y.min():y.max()+1,x.min():x.max()+1])

def clean(a,one=True):
    labels,_=ndimage.label(a[:,:,3]>=128,np.ones((3,3)))
    sizes=np.bincount(labels.ravel());sizes[0]=0
    if one:
        core=labels==sizes.argmax()
    else:
        ids=np.where(sizes>=4)[0];core=np.isin(labels,ids)
    mask=ndimage.binary_dilation(core,iterations=2)&(a[:,:,3]>2)
    a=a.copy();a[~mask]=0
    return a

def largest(a):
    labels,_=ndimage.label(a[:,:,3]>0,np.ones((3,3)))
    sizes=np.bincount(labels.ravel());sizes[0]=0
    a=a.copy();a[labels!=sizes.argmax()]=0
    return a

def frames(a,nrows):
    labels,_=ndimage.label(a[:,:,3]>=128,np.ones((3,3)))
    sizes=np.bincount(labels.ravel());sizes[0]=0
    ids=sorted(range(1,len(sizes)),key=lambda k:sizes[k],reverse=True)[:4*nrows]
    assert len(ids)==4*nrows
    sl=ndimage.find_objects(labels)
    ids.sort(key=lambda k:(sl[k-1][0].start+sl[k-1][0].stop)/2)
    result=[]
    for r in range(nrows):
        row=[]
        for k in sorted(ids[r*4:r*4+4],key=lambda k:sl[k-1][1].start):
            sy,sx=sl[k-1]
            assert sizes[k]>5000,'Expected a complete character'
            row.append(trim(clean(a[max(0,sy.start-3):min(a.shape[0],sy.stop+3),max(0,sx.start-3):min(a.shape[1],sx.stop+3)])))
        result.append(row)
    return result

def save(im,name,folder):
    im.save(ROOT/folder/(name+'.png'))
    bg=Image.new('RGB',im.size,(44,47,55));bg.paste(im,mask=im.getchannel('A'))
    bg.thumbnail((1152,768));bg.save(OUT/(name+'_final.jpg'))

def boss(path,name,nrows):
    rows=frames(load(path,name),nrows)
    width_limit=344 if nrows==1 else 384
    scale=min(1.3,width_limit/max(im.width for row in rows for im in row),452/max(im.height for row in rows for im in row))
    def positions(widths):
        upper=[(i+1)*384-w for i,w in enumerate(widths)]
        for i in range(2,-1,-1):
            upper[i]=min(upper[i],upper[i+1]-40-widths[i])
        xs=[]
        for i,w in enumerate(widths):
            lower=max(i*384, xs[-1]+widths[i-1]+40 if i else 0)
            if lower>upper[i]:return None
            xs.append(max(lower,min(i*384+(384-w)//2,upper[i])))
        return xs
    while any(positions([round(im.width*scale) for im in row]) is None for row in rows):
        scale-=.001
    sheet=Image.new('RGBA',(1536,1024));boxes=[]
    for r,row in enumerate(rows):
        baseline=(482+r*512) if nrows==2 else 1024
        xs=positions([round(im.width*scale) for im in row])
        for c,im in enumerate(row):
            im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
            im=Image.fromarray(largest(np.array(im)))
            x=xs[c];y=baseline-im.height
            sheet.paste(im,(x,y));boxes.append({'row':r,'col':c,'box':[x,y,x+im.width,baseline],'size':list(im.size)})
    save(sheet,name,'assets/sprites')
    return {'size':[1536,1024],'frames':[4]*nrows,'uniform_scale':scale,'placements':boxes}

def vfx(path,name,height):
    a=load(path,name)
    crops=[trim(clean(a[:,c*a.shape[1]//4:(c+1)*a.shape[1]//4],one=False)) for c in range(4)]
    sx=300/max(im.width for im in crops);sy=height/max(im.height for im in crops)
    sheet=Image.new('RGBA',(1536,1024));boxes=[]
    for c,im in enumerate(crops):
        im=im.resize((round(im.width*sx),round(im.height*sy)),Image.Resampling.NEAREST)
        x=c*384+(384-im.width)//2;y=1020-im.height
        sheet.paste(im,(x,y));boxes.append([x,y,x+im.width,1020])
    save(sheet,name,'assets/vfx')
    return {'size':[1536,1024],'frames':[4],'max_size':[300,height],'boxes':boxes,'bottom':1020,'bottom_safety_margin':4}

if __name__=='__main__':
    paths=sys.argv[1:];assert len(paths)==6
    report={}
    for i,(name,nrows) in enumerate([('kainati_sol',2),('kainati_sol_p2',2),('kainati_sol_p3',1)]):
        report[name]=boss(paths[i],name,nrows)
    for i,(name,h) in enumerate([('vfx_onde_choc',90),('vfx_vague_mousse',70)],3):
        report[name]=vfx(paths[i],name,h)
    name='rocher_roulant'
    rock=trim(clean(load(paths[5],name))).resize((800,800),Image.Resampling.NEAREST)
    sheet=Image.new('RGBA',(1024,1024));sheet.paste(rock,(112,112));save(sheet,name,'assets/_codex_src')
    report[name]={'size':[1024,1024],'stone_bounds':[112,112,912,912]}
    (OUT/'normalisation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
