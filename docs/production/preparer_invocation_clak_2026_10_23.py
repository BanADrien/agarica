"""Planches, frames et aperçu animé de l'invocation, sans modification du jeu."""
from pathlib import Path
import json
import math
import sys
import numpy as np
from PIL import Image, ImageOps, ImageEnhance
from scipy import ndimage

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'docs/production'))
import normaliser_kainati_sol_2026_10_23 as helper
OUT=ROOT/'docs/production/controles/invocation_clak_2026-10-23'
sys.stdout.reconfigure(encoding='utf-8')

def save_preview(im,name):
    bg=Image.new('RGB',im.size,(37,41,54));bg.paste(im,mask=im.getchannel('A'))
    bg.thumbnail((1152,768));bg.save(OUT/(name+'_final.jpg'))

def save_frames(rows,name,folder):
    cw=max(im.width for row in rows for im in row)+8
    ch=max(im.height for row in rows for im in row)+8
    d=ROOT/folder/(name+'_frames');d.mkdir(parents=True,exist_ok=True)
    frames=[]
    for r,row in enumerate(rows):
        for c,im in enumerate(row):
            canvas=Image.new('RGBA',(cw,ch));canvas.paste(im,((cw-im.width)//2,ch-4-im.height))
            canvas.save(d/(name+f'_row{r}_{c}.png'));frames.append(canvas)
    return frames,[cw,ch]

def character(path):
    raw=Image.open(path).convert('RGBA');raw.save(OUT/'geralt_invocation_generation_brute.png')
    rows=helper.frames(np.array(raw),2)
    factor=215/rows[0][0].height
    sheet=Image.new('RGBA',(1536,1024));resized=[];boxes=[]
    for r,row in enumerate(rows):
        out=[]
        for c,im in enumerate(row):
            im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.NEAREST)
            im=helper.trim(helper.largest(np.array(im)))
            x=c*384+(384-im.width)//2;y=430+r*512-im.height
            sheet.paste(im,(x,y));out.append(im);boxes.append([x,y,x+im.width,y+im.height])
        resized.append(out)
    sheet.save(ROOT/'assets/sprites/geralt_invocation.png');save_preview(sheet,'geralt_invocation')
    frames,canvas=save_frames(resized,'geralt_invocation','assets/sprites')
    return frames,{'frames':[4,4],'size':[1536,1024],'frame_canvas':canvas,'placements':boxes,'standing_height':215}

def effect(path):
    raw=Image.open(path).convert('RGBA');raw.save(OUT/'vfx_invocation_clak_generation_brute.png')
    a=np.array(raw);crops=[]
    for c in range(4):
        cell=a[:,c*a.shape[1]//4:(c+1)*a.shape[1]//4].copy()
        labels,_=ndimage.label(cell[:,:,3]>=220,np.ones((3,3)))
        sizes=np.bincount(labels.ravel());sizes[0]=0
        core=np.isin(labels,np.where(sizes>=4)[0])
        keep=ndimage.binary_dilation(core,iterations=6)&(cell[:,:,3]>2)
        cell[~keep]=0;crops.append(helper.trim(cell))
    factor=min(280/max(im.width for im in crops),900/max(im.height for im in crops))
    sheet=Image.new('RGBA',(1536,1024));row=[];boxes=[]
    for c,im in enumerate(crops):
        im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.NEAREST)
        x=c*384+(384-im.width)//2;y=1000-im.height
        sheet.paste(im,(x,y));row.append(im);boxes.append([x,y,x+im.width,1000])
    sheet.save(ROOT/'assets/vfx/vfx_invocation_clak.png');save_preview(sheet,'vfx_invocation_clak')
    frames,canvas=save_frames([row],'vfx_invocation_clak','assets/vfx')
    return frames,{'frames':[4],'size':[1536,1024],'frame_canvas':canvas,'placements':boxes,'uniform_scale':factor}

def resized(im,scale):
    return im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)

def put(dest,im,x,base,opacity=1):
    if opacity<=0:return
    if opacity<1:
        im=im.copy();im.putalpha(im.getchannel('A').point(lambda a:round(a*opacity)))
    dest.alpha_composite(im,(round(x-im.width/2),round(base-im.height)))

def preview(chars,fx,wide):
    bg=ImageOps.fit(Image.open(ROOT/'assets/decors/fonds/fond_bosquet.png').convert('RGB'),(960,540)).convert('RGBA')
    far=ImageOps.fit(wide.convert('RGB'),(960,540)).convert('RGBA')
    chars=[resized(im,.72) for im in chars];fx=[resized(im,.54) for im in fx]
    crab=Image.open(ROOT/'assets/sprites/clak_frames/clak_row0_0.png').convert('RGBA')
    crab=crab.crop(crab.getbbox());crab=crab.resize((112,round(crab.height*112/crab.width)),Image.Resampling.NEAREST)
    # Find the materialized crab centre in the peak effect to land it smoothly.
    a=np.array(fx[2]);r,g,b=a[:,:,:3].transpose(2,0,1).astype(float)
    red=(a[:,:,3]>128)&(r>g*1.4)&(r>b*1.8)&(r>100)
    yy,xx=np.where(red)
    crab_center_y=520-fx[2].height+(yy.min()+yy.max())/2
    crab_center_x=625-fx[2].width/2+(xx.min()+xx.max())/2
    images=[]
    for i in range(84):
        t=i/10
        scene=bg.copy();lift=0;phase=0;strength=0;ci=0;draw_crab=False;crab_base=495
        if t<.8:ci=0
        elif t<1.4:
            ci=1;lift=45*(t-.8)/.6;phase=0;strength=(t-.8)/.6
        elif t<2.0:
            ci=2;lift=45+15*(t-1.4)/.6;phase=1;strength=1
        elif t<2.8:ci=3;lift=60;phase=2;strength=1
        elif t<4.2:
            scene=ImageEnhance.Brightness(far).enhance(1+.025*math.sin(t*4)).convert('RGBA')
            images.append(scene.convert('RGB'));continue
        elif t<5.2:ci=4 if t<4.7 else 5;lift=60+3*math.sin(t*6);phase=2;strength=1
        elif t<6.0:ci=6;lift=60;phase=3;strength=max(0,1-(t-5.2)/.8)
        elif t<6.9:
            ci=6;lift=60*(1-(t-6)/.9);draw_crab=True
            s=(t-6)/.9;s=s*s*(3-2*s)
            crab_base=crab_center_y+crab.height/2+(495-crab_center_y-crab.height/2)*s
        else:ci=7;draw_crab=True
        if strength:
            put(scene,fx[phase],625,520,strength)
        if 5.7<=t<6.0:
            put(scene,crab,crab_center_x,crab_center_y+crab.height/2,(t-5.7)/.3)
        if draw_crab:put(scene,crab,crab_center_x,crab_base)
        put(scene,chars[ci],300,495-lift)
        images.append(scene.convert('RGB'))
    # Use a shared palette to prevent palette changes between animation frames.
    sample=Image.new('RGB',(960,540))
    for j,k in enumerate([0,12,19,25,34,44,54,64,76]):
        sample.paste(images[k].resize((320,180)),((j%3)*320,(j//3)*180))
    palette=sample.quantize(colors=256)
    encoded=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in images]
    target=OUT/'invocation_clak_apercu.gif'
    encoded[0].save(target,save_all=True,append_images=encoded[1:],duration=100,loop=0,disposal=2,optimize=False)
    sample.save(OUT/'invocation_clak_storyboard.jpg')
    images[24].save(OUT/'invocation_clak_pic.png')
    return {'path':str(target.relative_to(ROOT)).replace('\\','/'),'size':[960,540],'duration_seconds':8.4,'fps':10,'timeline':{'preparation':[0,.8],'white_eyes_liftoff':[.8,2.0],'column_crab':[2,2.8],'sky_cutaway':[2.8,4.2],'climax':[4.2,5.2],'dissipation':[5.2,6],'crab_lands':[6,6.9],'recovery':[6.9,8.4]}}

if __name__=='__main__':
    chars,cr=character(sys.argv[1]);fx,er=effect(sys.argv[2])
    wide=Image.open(sys.argv[3]).convert('RGB')
    wide=wide.resize((1536,1024),Image.Resampling.NEAREST)
    d=ROOT/'assets/cinematiques';d.mkdir(exist_ok=True)
    wide.save(d/'invocation_clak_plan_large.png');wide.save(OUT/'invocation_clak_plan_large_generation.png')
    data={'geralt_invocation':cr,'vfx_invocation_clak':er,'preview':preview(chars,fx,wide)}
    (OUT/'normalisation.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
    print(json.dumps(data,indent=2))
