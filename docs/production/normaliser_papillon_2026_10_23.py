"""Place les dessins générés sans modifier leur composition interne."""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/production/controles/papillon_2026-10-23'
sys.stdout.reconfigure(encoding='utf-8')

def silhouette(a):
    labels, _ = ndimage.label(a[:,:,3] >= 128, np.ones((3,3)))
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    keep = labels == sizes.argmax()
    # Retain antialiasing immediately adjoining the connected silhouette.
    keep = ndimage.binary_dilation(keep, iterations=2) & (a[:,:,3] > 2)
    labels, _ = ndimage.label(keep, np.ones((3,3)))
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    a = a.copy(); a[labels != sizes.argmax()] = 0
    ys,xs = np.where(a[:,:,3]>0)
    return Image.fromarray(a[ys.min():ys.max()+1,xs.min():xs.max()+1])

def sheet(name, raw, nrows):
    a = np.array(Image.open(raw).convert('RGBA'))
    Image.fromarray(a).save(OUT/(name+'_generation_brute.png'))
    labels,_=ndimage.label(a[:,:,3]>=128,np.ones((3,3)))
    sizes=np.bincount(labels.ravel());sizes[0]=0
    ids=sorted(range(1,len(sizes)),key=lambda k:sizes[k],reverse=True)[:nrows*4]
    slices=ndimage.find_objects(labels)
    ids.sort(key=lambda k:(slices[k-1][0].start+slices[k-1][0].stop)/2)
    frames=[]
    for r in range(nrows):
        row=[]
        for k in sorted(ids[r*4:r*4+4],key=lambda k:slices[k-1][1].start):
            sy,sx=slices[k-1]
            y0,y1=max(0,sy.start-3),min(a.shape[0],sy.stop+3)
            x0,x1=max(0,sx.start-3),min(a.shape[1],sx.stop+3)
            row.append(silhouette(a[y0:y1,x0:x1]))
        frames.append(row)
    scale = 220/max(im.width for row in frames for im in row) if nrows==3 else 250/frames[0][0].height
    result = Image.new('RGBA',(1536,1024)); boxes=[]
    for r,row in enumerate(frames):
        for c,im in enumerate(row):
            im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
            pixels=np.array(im)
            labels,_=ndimage.label(pixels[:,:,3]>0,np.ones((3,3)))
            sizes=np.bincount(labels.ravel());sizes[0]=0
            pixels[labels!=sizes.argmax()]=0
            im=Image.fromarray(pixels)
            assert im.width<=344 and im.height <= (281 if nrows==3 else 900)
            x=c*384+(384-im.width)//2
            y=r*1024//nrows+((r+1)*1024//nrows-r*1024//nrows-im.height)//2
            result.paste(im,(x,y)); boxes.append({'row':r,'col':c,'box':[x,y,x+im.width,y+im.height]})
    result.save(ROOT/'assets/sprites'/(name+'.png'))
    preview=Image.new('RGB',result.size,(42,45,54));preview.paste(result,mask=result.getchannel('A'))
    preview.resize((1152,768)).save(OUT/(name+'_final.jpg'))
    return {'size':[1536,1024],'frames':[4]*nrows,'scale':scale,'placements':boxes}

if __name__=='__main__':
    report={}
    report['forme_papillon']=sheet('forme_papillon',sys.argv[1],3)
    report['transfo_papillon']=sheet('transfo_papillon',sys.argv[2],1)
    raw=Image.open(sys.argv[3]).convert('RGBA');raw.save(OUT/'form_icone_papillon_generation_brute.png')
    if raw.size!=(1024,1024):
        raw=raw.resize((1024,1024),Image.Resampling.NEAREST)
    icon=silhouette(np.array(raw));final=Image.new('RGBA',(1024,1024))
    final.paste(icon,((1024-icon.width)//2,(1024-icon.height)//2))
    final.save(ROOT/'assets/_codex_src/form_icone_papillon.png')
    bg=Image.new('RGB',final.size,(42,45,54));bg.paste(final,mask=final.getchannel('A'));bg.resize((640,640)).save(OUT/'form_icone_papillon_final.jpg')
    report['form_icone_papillon']={'size':[1024,1024],'visible_size':list(icon.size)}
    (OUT/'normalisation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
