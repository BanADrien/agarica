"""Preuve d'etirement des cadres du lot 8, sans modification des assets."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/production/controles/lot_8'
cuts={'ui_bulle':(74,74,60,60),'ui_invite':(105,105,70,70),
      'ui_banniere':(115,115,75,75),'ui_energie_cadre':(105,105,38,30),
      'ui_boss_cadre':(110,110,25,25)}
for name,(l,r,t,b) in cuts.items():
    im=Image.open(ROOT/'assets/ui'/f'{name}.png').convert('RGBA')
    w,h=im.size; nw=w+400; nh=h+(100 if name in ['ui_bulle','ui_invite','ui_banniere'] else 0)
    dst=Image.new('RGBA',(nw,nh)); xs=[0,l,w-r,w]; ys=[0,t,h-b,h]
    xd=[0,l,nw-r,nw]; yd=[0,t,nh-b,nh]
    for y in range(3):
        for x in range(3):
            p=im.crop((xs[x],ys[y],xs[x+1],ys[y+1]))
            p=p.resize((xd[x+1]-xd[x],yd[y+1]-yd[y]),Image.Resampling.NEAREST)
            dst.paste(p,(xd[x],yd[y]))
    panel=Image.new('RGB',(nw+40,h+nh+100),(55,58,66))
    panel.paste(im,(20,30),im);panel.paste(dst,(20,h+70),dst)
    d=ImageDraw.Draw(panel);d.text((20,8),f'{name} | L/R/T/B {l}/{r}/{t}/{b} px',fill='white')
    for xx in [l,w-r]:d.line((20+xx,30,20+xx,30+h),fill='#ff9fc9')
    for yy in [t,h-b]:d.line((20,30+yy,20+w,30+yy),fill='#ff9fc9')
    panel.save(OUT/f'9slice_{name}.jpg',quality=94)
(OUT/'9slice_recommandations.json').write_text(json.dumps(cuts,indent=2),encoding='utf-8')
