"""Montages de controle sur les sorties finales du lot 11."""
import sys,json,hashlib
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageOps
import lot_11 as lot
ROOT,OUT=lot.ROOT,lot.OUT
def item(iid):return Image.open(ROOT/'assets/decors/elements'/f'{iid}.png').convert('RGBA')
def montage(iid,im,vertical=False):
    old=lot.lot8.OUT;lot.lot8.OUT=OUT;r=lot.lot8.montage(iid,im,vertical);lot.lot8.OUT=old;return r
def branches():
    names=['branche_base','branche_milieu','branche_fourche','branche_milieu','branche_bout'];images=[item(n) for n in names]
    canvas=Image.new('RGBA',(sum(p.width for p in images),640),'#15101f');x=0;junctions={}
    for k,im in enumerate(images):
        canvas.alpha_composite(im,(x,128));x+=im.width
        if k<len(images)-1:
            a=np.array(im)[:,-1].astype(int);b=np.array(images[k+1])[:,0].astype(int)
            junctions[f'{names[k]}_{names[k+1]}']=int(np.abs(a-b).max())
    ImageDraw.Draw(canvas).line((0,384,canvas.width-1,384),fill='#ff3030',width=1)
    hero=Image.open(ROOT/'assets/sprites/agarica_extra_frames/agarica_extra_row4_0.png').convert('RGBA');hero=hero.crop(hero.getbbox());hero=lot.scale(hero,344/hero.height)
    canvas.alpha_composite(hero,(images[0].width+180,384-hero.height));canvas.save(OUT/'assemblage_branche.png');lot.preview(canvas,'assemblage_branche.jpg')
    result={'raccord_branche_milieu':montage('branche_milieu',item('branche_milieu')),'junction_edge_rgba_max_difference':junctions,
            'branches':{n:lot.measure_branch(n,item(n)) for n in dict.fromkeys(names)},'assembly_walk_global_y':384,'assembly_branch_y':128,'hero_visible_height':344}
    (OUT/'controle_branches.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
    return result
def trunk():
    seg=item('tronc_segment');base=item('tronc_base');branch=item('branche_base')
    w=2048;h=seg.height*2+base.height;center=w//2
    canvas=Image.new('RGBA',(w,h),'#15101f')
    for y in [0,seg.height]:canvas.alpha_composite(seg,(round(center-seg.width/2),y))
    canvas.alpha_composite(base,(round(center-base.width/2),seg.height*2))
    right=round(center+seg.width/2-256);walk=2100;by=walk-256
    canvas.alpha_composite(branch,(right,by));canvas.alpha_composite(ImageOps.mirror(branch),(w-right-branch.width,by))
    canvas.save(OUT/'assemblage_tronc.png');lot.preview(canvas,'assemblage_tronc.jpg')
    # Compare on a common centered canvas to account for horizontal trim.
    aa=Image.new('RGBA',(1536,1));bb=aa.copy();aa.paste(seg.crop((0,seg.height-1,seg.width,seg.height)),(round(768-seg.width/2),0));bb.paste(base.crop((0,0,base.width,1)),(round(768-base.width/2),0))
    edge=int(np.abs(np.array(aa).astype(int)-np.array(bb).astype(int)).max())
    a=np.array(base);xx=np.where(a[0,:,3]>128)[0];axis=(int(xx.min())+int(xx.max())+1)/2
    result={'raccord_tronc_segment':montage('tronc_segment',seg,True),'segment_base_edge_rgba_max_difference':edge,
            'segment_size':list(seg.size),'base_size':list(base.size),'base_axis_measured':axis,'base_center':base.width/2,'root_extent_balance':abs(2*axis-base.width)}
    (OUT/'controle_tronc.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result));return result
if __name__=='__main__':
    if len(sys.argv)>1 and sys.argv[1]=='tronc':trunk()
    else:branches()
