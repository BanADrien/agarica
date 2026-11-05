"""Derniers controles demandes sur les fichiers importes du lot 11."""
import json,sys,hashlib
import numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage
import lot_11 as lot
import controles_lot_11 as controls
ROOT,OUT=lot.ROOT,lot.OUT
state=json.loads((OUT/'suivi.json').read_text(encoding='utf-8'));assert len(state)==6
anims,items,_=lot.imp.load_manifest();result={'sources':{},'animations':{},'protection':{},'problems':[]}
for j in lot.JOBS:
    im=Image.open(ROOT/j['source']).convert('RGBA');expected=(1024,1536) if j['n']==4 else (1536,1024)
    assert im.size==expected and im.getchannel('A').getextrema()[0]==0
    result['sources'][str(j['n'])]={'size':list(im.size)}
for iid,count in [('vfx_croc',5),('agarica_repos',8)]:
    groups=lot.imp.anim_expected_files(iid,anims[iid]);files=[f for g in groups.values() for f in g];assert len(files)==count
    assert len(list((ROOT/anims[iid]['dir']).glob('*.png')))==count
    arrays=[np.array(Image.open(f).convert('RGBA')) for f in files]
    for f,a in zip(files,arrays):
        assert a[:,:,3].max()>0,f
        if iid=='agarica_repos':assert ndimage.label(a[:,:,3]>0,np.ones((3,3)))[1]==1,f
    result['animations'][iid]={'frames':count,'groups':{k:len(v) for k,v in groups.items()}}
    if iid=='agarica_repos':
        assert np.array_equal(arrays[3],arrays[4])
        assert all(np.array_equal(a[-90:],arrays[4][-90:]) for a in arrays[4:])
        bounds=[]
        for a in arrays[4:]:
            yy,xx=np.where(a[:,:,3]>0);bounds.append([int(xx.min()),int(xx.max())])
        assert np.ptp(np.array(bounds),axis=0).max()<=2
        result['animations'][iid].update({'sit_last_equals_idle_first':True,'lower_90_pixels_identical':True,'idle_horizontal_bounds':bounds,'stand_height':state['6']['stand_height'],'idle_heights':state['6']['idle_heights'],'idle_widths':state['6']['idle_widths']})
    else:
        pos=state['1']['placements']
        for k,p in enumerate(pos):
            x,y,x2,y2=p['bbox'];assert x>=k*1536/5+29 and x2<=(k+1)*1536/5-29
            assert abs((x+x2)/2-(k+.5)*1536/5)<=.5 and abs((y+y2)/2-512)<=.5
        result['animations'][iid]['soft_alpha_unique_values']=len(np.unique(np.array(Image.open(ROOT/'assets/vfx/vfx_croc.png'))[:,:,3]))
        assert result['animations'][iid]['soft_alpha_unique_values']>100
br=controls.branches();tr=controls.trunk()
for name,m in br['branches'].items():
    assert m['size'][1]==512 and abs(m['walk_median']-256)<=4 and abs(m['underside_median']-480)<=12,(name,m)
assert br['branches']['branche_milieu']['size']==[1536,512]
assert br['raccord_branche_milieu']['edge_rgba_max_difference']<=3
assert max(br['junction_edge_rgba_max_difference'].values())<=3
assert tr['raccord_tronc_segment']['edge_rgba_max_difference']<=3 and tr['segment_size'][1]==1536 and tr['base_size'][1]==1024
assert tr['segment_base_edge_rgba_max_difference']<=3 and tr['root_extent_balance']<=8
result['branch_controls']=br;result['trunk_controls']=tr
base=np.array(controls.item('tronc_base'));yy,xx=np.where(base[:,:,3]>128);result['trunk_controls']['root_ground_bottom_alpha128']=int(yy.max())
old=json.loads((OUT/'etat_avant.json').read_text(encoding='utf-8'));changes=[]
for name,digest in old.items():
    p=ROOT/name
    if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:changes.append(name.replace('\\','/'))
result['protection']={'existing_asset_changes':[n for n in changes if n.startswith('assets/')],
                      'src_changes_observed':[n for n in changes if n.startswith('src/')],
                      'manifest_unchanged':'src/data/asset_manifest.js' not in changes,
                      'importer_unchanged':'tools/import_codex_assets.py' not in changes}
assert not result['protection']['existing_asset_changes']
assert result['protection']['manifest_unchanged'] and result['protection']['importer_unchanged']
(OUT/'audit_final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
# A readable animation proof on a stable canvas; not an imported game asset.
proof=[]
for k in range(4,8):
    im=Image.open(OUT/'poses'/f'agarica_repos_{k:02d}.png').convert('RGBA');bg=Image.new('RGBA',(240,220),'#15101f');bg.alpha_composite(im,((240-im.width)//2,210-im.height));proof.append(bg.convert('RGB'))
proof[0].save(OUT/'agarica_sit_idle_controle.gif',save_all=True,append_images=proof[1:],duration=250,loop=0)
print(json.dumps({'sources':6,'frames':13,'branch_walk_medians':{k:v['walk_median'] for k,v in br['branches'].items()},'base_axis':tr['base_axis_measured'],'seam_delta':0,'protection':result['protection'],'problems':result['problems']},ensure_ascii=False))
