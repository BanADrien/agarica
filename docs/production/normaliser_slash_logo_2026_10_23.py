"""Finition déterministe des trois images générées : masques, grille et palette."""
from pathlib import Path
import hashlib
import json
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE / 'controles' / 'slash_2026-10-23'
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(ROOT / 'tools'))
import import_codex_assets as imp


def load_original(relative):
    path = ROOT / relative
    backup = OUT / (path.stem + '_generation_brute.png')
    if not backup.exists():
        backup.write_bytes(path.read_bytes())
    return np.asarray(Image.open(backup).convert('RGBA')).copy()


def clean(a, threshold=128, dilation=2):
    core = a[:, :, 3] >= threshold
    keep = ndimage.binary_dilation(core, iterations=dilation)
    out = a.copy()
    out[~keep] = 0
    out[out[:, :, 3] < 3] = 0
    return out


def trim(a):
    ys, xs = np.where(a[:, :, 3] > 0)
    if not len(xs):
        raise ValueError('Empty image')
    return a[ys.min():ys.max()+1, xs.min():xs.max()+1].copy()


report = {}
relative = 'assets/sprites/agarica_slash.png'
a = clean(load_original(relative))
rows = imp.blob_rows(a, 3, 'agarica_slash')
frames = [imp.blob_frames(a, y0, y1, 4, 'agarica_slash') for y0, y1 in rows]
if [len(r) for r in frames] != [4, 4, 4]:
    raise ValueError('Expected 4/4/4 poses')
frames = [[trim(f) for f in row] for row in frames]
scale = min(250 / float(np.median([f.shape[0] for f in frames[0]])), 340 / max(f.shape[1] for row in frames for f in row))
resized = [[Image.fromarray(f).resize((round(f.shape[1]*scale), round(f.shape[0]*scale)), Image.Resampling.NEAREST) for f in row] for row in frames]
heights = [max(im.height for im in row) for row in resized]
padding = (1024 - sum(heights) - 120) // 2
if padding < 8:
    raise ValueError('Sheet does not fit without reducing character')
sheet = Image.new('RGBA', (1536, 1024))
top = padding
placements = []
for ri, row in enumerate(resized):
    bottom = top + heights[ri]
    for col, im in enumerate(row):
        x, y = col*384+(384-im.width)//2, bottom-im.height
        sheet.paste(im, (x,y))
        placements.append({'row':ri,'col':col,'box':[x,y,x+im.width,bottom]})
    top = bottom + 60
# Match the explicitly requested chestnut base with one shared colour transfer.
arr = np.asarray(sheet).copy()
r,g,b = arr[:,:,:3].astype(float).transpose(2,0,1)
eligible = (arr[:,:,3]>=128) & (r>80) & (r>g*1.6) & (r>b*2.4)
hair_mask = np.zeros(arr.shape[:2],bool)
for placement in placements:
    x0,y0,x1,y1 = placement['box']
    cy1 = y0+round((y1-y0)*.72)
    candidate = eligible[y0:cy1,x0:x1]
    labels,_ = ndimage.label(candidate,np.ones((3,3)))
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    main = int(sizes.argmax())
    if not sizes[main]:
        raise ValueError('Hair region missing')
    yy,xx = np.where(labels==main)
    hx0,hx1,hy0,hy1 = xx.min()-4,xx.max()+5,yy.min()-4,yy.max()+5
    selected = np.zeros_like(candidate)
    for k,sl in enumerate(ndimage.find_objects(labels),1):
        if sl is not None and sizes[k]>=max(8,sizes[main]*.06):
            cx,cy=(sl[1].start+sl[1].stop)/2,(sl[0].start+sl[0].stop)/2
            if hx0<=cx<=hx1 and hy0<=cy<=hy1:
                selected |= labels==k
    hair_mask[y0:cy1,x0:x1] |= selected
before_hair = arr.copy()
median = np.median(arr[:,:,:3][hair_mask],axis=0)
transfer = np.array([168,92,52])/median
arr[:,:,:3][hair_mask] = np.rint(arr[:,:,:3][hair_mask]*transfer).clip(0,255).astype('uint8')
assert np.array_equal(arr[:,:,3],before_hair[:,:,3])
assert np.array_equal(arr[~hair_mask],before_hair[~hair_mask])
Image.fromarray(hair_mask.astype('uint8')*255).save(OUT/'agarica_slash_cheveux_masque.png')
Image.fromarray(arr).save(ROOT / relative)
report['agarica_slash'] = {'size': [1536,1024], 'frames': [4,4,4], 'scale': scale, 'placements': placements, 'row_heights': heights, 'empty_row_gap': 60,'hair_base':'#A85C34','hair_mask_pixels':int(hair_mask.sum()),'hair_source_median':median.tolist(),'hair_transfer':transfer.tolist()}

relative = 'assets/vfx/vfx_slash.png'
a = load_original(relative)
sheet = Image.new('RGBA', (1536, 1024))
placements = []
for row, target in enumerate([(300,200),(220,280),(220,280)]):
    y0, y1 = row*1024//3, (row+1)*1024//3
    crops = [trim(clean(a[y0:y1, col*512:(col+1)*512], threshold=128, dilation=3)) for col in range(3)]
    maxw, maxh = max(c.shape[1] for c in crops), max(c.shape[0] for c in crops)
    sx, sy = target[0]/maxw, target[1]/maxh
    for col, crop in enumerate(crops):
        im = Image.fromarray(crop).resize((round(crop.shape[1]*sx),round(crop.shape[0]*sy)),Image.Resampling.NEAREST)
        x, y = col*512+(512-im.width)//2, y0+(y1-y0-im.height)//2
        sheet.paste(im,(x,y))
        placements.append({'row':row,'col':col,'box':[x,y,x+im.width,y+im.height]})
sheet.save(ROOT / relative)
report['vfx_slash'] = {'size':[1536,1024],'frames':[3,3,3],'placements':placements,'targets':[[300,200],[220,280],[220,280]]}

relative = 'assets/_codex_src/titre_logo.png'
a = load_original(relative)
# Hard alpha and an explicit ten-colour palette remove the generated soft halo.
small = Image.fromarray(a).resize((384,256),Image.Resampling.NEAREST)
b = np.asarray(small).copy()
palette = np.array([[21,16,31],[42,31,69],[63,138,90],[127,216,166],[255,233,208],[255,159,201],[199,109,154],[49,103,70],[201,232,190],[99,75,118]],dtype=np.int16)
visible = b[:,:,3] >= 220
rgb = b[:,:,:3].astype(np.int16)
dist = ((rgb[:,:,None,:].astype(float)-palette[None,None,:,:])**2).sum(axis=3)
quant = palette[dist.argmin(axis=2)].astype('uint8')
b[:,:,:3] = quant
b[:,:,3] = np.where(visible,255,0)
b[~visible] = 0
im = Image.fromarray(b).resize((1536,1024),Image.Resampling.NEAREST)
im.save(ROOT / relative)
result = np.asarray(im)
colors = np.unique(result[:,:,:3][result[:,:,3]>0],axis=0)
report['titre_logo'] = {'size':[1536,1024],'palette':colors.tolist(),'visible_colors':len(colors),'alpha_values':np.unique(result[:,:,3]).tolist(),'pixel_grid':4,'ancien':'assets/_codex_src/titre_logo_ancien.png'}
(OUT / 'normalisation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
