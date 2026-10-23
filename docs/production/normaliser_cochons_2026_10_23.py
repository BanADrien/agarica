from pathlib import Path
import json
import sys
import shutil
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'docs/production'))
sys.path.insert(0,str(ROOT/'tools'))
import normaliser_kainati_sol_2026_10_23 as helper
import import_codex_assets as imp

OUT=ROOT/'docs/production/controles/cochons_tricolores_2026-10-23'
sys.stdout.reconfigure(encoding='utf-8')
all_frames={};report={}
for color,path in zip(['rose','gris','orange'],sys.argv[1:]):
    name='cochon_bebe_'+color
    raw=Image.open(path).convert('RGBA');raw.save(OUT/(name+'_generation_brute.png'))
    frames=helper.frames(np.array(raw),2)
    scale=min(160/np.median([im.height for im in frames[0][:3]]),250/max(im.width for row in frames for im in row))
    sheet=Image.new('RGBA',(1536,1024));new_frames=[];boxes=[]
    for r,row in enumerate(frames):
        new_row=[]
        for c,im in enumerate(row):
            im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
            im=helper.trim(helper.largest(np.array(im)))
            x=c*384+(384-im.width)//2;y=430+r*512-im.height
            sheet.paste(im,(x,y));new_row.append(np.array(im));boxes.append([r,c,x,y,x+im.width,y+im.height])
        new_frames.append(new_row)
    sheet.save(ROOT/'assets/sprites'/(name+'.png'))
    bg=Image.new('RGB',sheet.size,(44,47,55));bg.paste(sheet,mask=sheet.getchannel('A'));bg.resize((1152,768)).save(OUT/(name+'_final.jpg'))
    all_frames[name]=new_frames
    report[name]={'source':'assets/sprites/'+name+'.png','size':[1536,1024],'frames':[4,4],'scale':scale,'placements':boxes}

cw=max(a.shape[1] for rows in all_frames.values() for row in rows for a in row)+2*imp.PAD
ch=max(a.shape[0] for rows in all_frames.values() for row in rows for a in row)+2*imp.PAD
for name,rows in all_frames.items():
    d=ROOT/'assets/sprites'/(name+'_frames');d.mkdir(exist_ok=True)
    for r,row in enumerate(rows):
        for c,a in enumerate(row):imp.place(a,cw,ch,'bottom').save(d/(name+f'_row{r}_{c}.png'))
    report[name]['frames_dir']=str(d.relative_to(ROOT)).replace('\\','/')
    report[name]['frame_canvas']=[cw,ch]
shutil.copy2(ROOT/'assets/sprites/cochon_bebe_rose.png',ROOT/'assets/sprites/cochon_bebe.png')
(OUT/'normalisation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
