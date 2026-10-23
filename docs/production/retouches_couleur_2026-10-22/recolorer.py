"""Recoloration par masques sur les PNG originaux ; alpha et hors-masque intacts."""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / 'tools'))
import import_codex_assets as imp

parser = argparse.ArgumentParser()
parser.add_argument('--apply', action='store_true')
parser.add_argument('--only-geralt', action='store_true')
args = parser.parse_args()
entries = json.loads((HERE / 'inventaire.json').read_text())
if args.only_geralt:
    entries = [e for e in entries if 'geralt' in e['path']]
MASKS = HERE / 'masques'
PREVIEW = HERE / 'comparaisons'
MASKS.mkdir(exist_ok=True)
PREVIEW.mkdir(exist_ok=True)


def boxes(a, counts):
    rows = imp.blob_rows(a, len(counts), 'inspection')
    out = []
    for ri, (y0, y1) in enumerate(rows):
        labels, _ = ndimage.label(a[y0:y1+1, :, 3] > 10, np.ones((3, 3)))
        candidates = []
        for k, sl in enumerate(ndimage.find_objects(labels), 1):
            if sl is None:
                continue
            area = int((labels[sl] == k).sum())
            if area > 100:
                candidates.append((area, sl))
        biggest = max(t[0] for t in candidates)
        anchors = sorted([t for t in candidates if t[0] > biggest * .15], key=lambda t: -t[0])[:counts[ri]]
        anchors.sort(key=lambda t: t[1][1].start)
        if len(anchors) != counts[ri]:
            raise ValueError(('silhouettes', ri, len(anchors), counts[ri]))
        for area, sl in anchors:
            out.append([sl[1].start, y0 + sl[0].start, sl[1].stop, y0 + sl[0].stop])
    return out


def bbox(mask):
    ys, xs = np.where(mask)
    return [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1] if len(xs) else None


def agarica_mask(a, path):
    r, g, b = a[:, :, :3].astype(float).transpose(2, 0, 1)
    skin_colors = (g > r*.28) & (b > r*.2)
    eligible = (a[:, :, 3] > 0) & (r > 60) & (r > 1.85*g) & (r > 1.6*b) & ~skin_colors
    # Filled skin regions also protect their enclosed eyes, mouth and tattoo.
    skin_seed = (a[:,:,3]>0) & (r>80) & (g>r*.38) & (b>r*.2) & (r>g*1.03) & (g>b*1.05)
    skin_protected = ndimage.binary_fill_holes(skin_seed)
    eligible &= ~skin_protected
    h, w = a.shape[:2]
    if path.endswith('titre_logo.png'):
        polygon = [(484,305),(496,290),(530,277),(560,277),(606,291),(668,297),(712,289),(767,278),(800,275),(850,258),(885,282),(909,266),(931,244),(952,222),(975,197),(996,173),(1018,153),(1040,137),(1084,148),(1112,167),(1130,173),(1120,190),(1135,229),(1135,271),(1127,294),(1108,310),(1100,330),(1118,350),(1136,380),(1127,421),(1103,438),(1084,427),(1071,401),(1060,375),(1045,348),(1041,324),(1024,339),(1000,348),(989,344),(1024,388),(1010,399),(962,379),(936,367),(916,346),(901,326),(889,300),(881,291),(867,315),(853,321),(845,340),(808,359),(778,370),(743,377),(713,386),(681,389),(650,402),(618,405),(610,391),(632,364),(650,352),(628,353),(590,369),(559,374),(568,349),(579,331),(543,334),(515,348),(524,325),(535,311),(516,305)]
        region = Image.new('1', (w, h)); d = ImageDraw.Draw(region)
        d.polygon(polygon, fill=1)
        d.polygon([(964,254),(1017,242),(1037,264),(1055,281),(1068,317),(1047,338),(1031,344),(1008,334),(995,323),(977,308),(965,282)], fill=0)
        mask = np.asarray(region) & (a[:,:,3]>0) & (r>60) & (r>g*2) & (r>b*1.4)
        return mask, [bbox(mask)]
    if path.endswith('transfoloup_piaf_0.png') or path.endswith(('transfopieuvre_2.png', 'transfopieuvre_3.png')):
        return np.zeros((h, w), bool), []
    if 'agarica_extra' in path:
        counts = {'agarica_extra.png': [3, 3, 3], 'agarica_extra_p2.png': [4, 4, 4], 'agarica_extra_p3.png': [3, 4, 5], 'agarica_extra_p4.png': [4]}
        bs = boxes(a, counts[Path(path).name])
    elif path.endswith('transfo_singe.png'):
        bs = boxes(a, [4])[:2]
    elif path.endswith('agarica_attack.png'):
        bs = boxes(a, [4])
    elif path.endswith('transfo_ours.png'):
        bs = boxes(a, [4])[:3]
    else:
        bs = [bbox(a[:, :, 3] > 10)]
    mask = np.zeros((h, w), bool)
    rois = []
    for x0, y0, x1, y1 in bs:
        candidate = eligible[y0:y1, x0:x1].copy()
        # Only inspect the upper half: boots, belts and tattoos are excluded.
        candidate[int((y1-y0) * .58):] = False
        labs, n = ndimage.label(candidate, np.ones((3, 3)))
        sizes = np.bincount(labs.ravel()); sizes[0] = 0
        if not n or sizes.max() < 15:
            continue
        main = labs == int(sizes.argmax())
        bb = bbox(main)
        mx0, my0, mx1, my1 = bb
        # Nearby separate locks are included; the arm tattoo remains below ROI.
        px = max(3, round((mx1-mx0) * (1.0 if 'transfo_loup_frames/' in path else .12)))
        py = max(2, round((my1-my0) * .05))
        rx0, ry0 = max(x0, x0+mx0-px), max(y0, y0+my0-py)
        rx1, ry1 = min(x1, x0+mx1+px), min(y1, y0+my1+py)
        mask[ry0:ry1, rx0:rx1] |= eligible[ry0:ry1, rx0:rx1]
        rois.append([rx0, ry0, rx1, ry1])
    return mask, rois


def geralt_mask(a, path):
    h, w = a.shape[:2]
    r, g, b = a[:, :, :3].astype(float).transpose(2, 0, 1)
    eligible = (a[:, :, 3] >= 128) & (r > 55) & (r > g*1.7) & (g > b*1.27) & (r < 200)
    if 'portrait_' in path:
        bs = [[0, 0, w, h]]
    else:
        bs = boxes(a, [4, 4, 5] if path.endswith('geralt.png') else [5, 4, 5])
    mask = np.zeros((h, w), bool)
    rois = []
    custom_heads = {
        'geralt.png': [[185,85,340,205],[530,85,700,205],[885,85,1045,205],[1220,85,1395,205],[180,405,345,545],[540,405,710,545],[880,405,1055,545],[1215,405,1395,545],[75,730,230,890],[385,730,555,890],[685,730,860,905],[990,730,1165,905],[1305,730,1480,905]],
        'geralt_p2.png': [[110,45,300,198],[430,55,610,215],[715,100,905,280],[1075,185,1245,325],[1310,65,1500,240],[215,375,405,540],[485,370,685,525],[835,370,1030,545],[1145,375,1330,550],[70,720,255,875],[390,720,585,875],[700,720,890,875],[990,720,1175,880],[1310,720,1490,885]],
    }
    head_bottoms = {'geralt.png': [197,199,194,196,522,523,526,533,851,862,854,858,864], 'geralt_p2.png': [179,195,270,318,214,523,510,518,527,847,857,850,852,859]}
    for index, (x0, y0, x1, y1) in enumerate(bs):
        bh, bw = y1-y0, x1-x0
        if 'portrait_' in path:
            head = (0, 0, w, int(h*.65))
        else:
            head = tuple(custom_heads[Path(path).name][index])
            head = (*head[:3], head_bottoms[Path(path).name][index])
        rx0, ry0, rx1, ry1 = head
        candidate = eligible[ry0:ry1, rx0:rx1]
        labs, n = ndimage.label(candidate, np.ones((3, 3)))
        sizes = np.bincount(labs.ravel()); sizes[0] = 0
        if not n:
            continue
        # Keep the scalp component and sizeable beard components below it.
        # Irises, eyebrows, quiver and bow are deliberately excluded.
        selected = np.zeros_like(candidate)
        biggest = sizes.max()
        main_id = int(sizes.argmax())
        main_box = bbox(labs == main_id)
        hx0, hy0, hx1, hy1 = main_box
        for k, sl in enumerate(ndimage.find_objects(labs), 1):
            if sl is None:
                continue
            cx = (sl[1].start + sl[1].stop)/2
            cy = (sl[0].start + sl[0].stop)/2
            beard = sizes[k] >= max(10, biggest*.007) and cx > hx0+(hx1-hx0)*.36 and hy0+(hy1-hy0)*.72 < cy < hy1+(hy1-hy0)*.2
            pony = sizes[k] >= biggest*.035 and cy < hy1-(hy1-hy0)*.15 and cx < hx0+(hx1-hx0)*.55
            if k == main_id or beard or pony:
                selected |= labs == k
        mask[ry0:ry1, rx0:rx1] |= selected
        rois.append(list(head))
        if 'portrait_' not in path:
            # Foot hair is darker and more saturated than the surrounding skin.
            fy0 = int(y1 - bh*.18)
            rr, gg, bb = r[fy0:y1, x0:x1], g[fy0:y1, x0:x1], b[fy0:y1, x0:x1]
            skin = (rr > 165) & (gg > 100) & (bb > 60) & (rr < gg*1.9)
            domain = np.zeros_like(skin)
            fl, _ = ndimage.label(skin, np.ones((3,3)))
            for fk, sl in enumerate(ndimage.find_objects(fl), 1):
                if sl is not None and (fl[sl] == fk).sum() >= 20:
                    top = max(0, sl[0].start - int(bh*.08))
                    bottom = min(domain.shape[0], sl[0].start + 8)
                    domain[top:bottom, sl[1].start:sl[1].stop] = True
            feet = eligible[fy0:y1, x0:x1] & domain & (rr < 175) & (rr > 45) & (gg < rr*.53) & (bb < rr*.3)
            mask[fy0:y1, x0:x1] |= feet
            rois.append([x0, fy0, x1, y1])
    if path.endswith('geralt_p2.png'):
        # Raised/rear feet in the falling sequence are not on the row baseline.
        for fx0, fy0, fx1, fy1 in [(349,205,416,279), (605,247,690,311), (925,255,1018,319)]:
            rr, gg, bb = r[fy0:fy1, fx0:fx1], g[fy0:fy1, fx0:fx1], b[fy0:fy1, fx0:fx1]
            hair = eligible[fy0:fy1, fx0:fx1] & (rr<175) & (gg<rr*.53) & (bb<rr*.3)
            mask[fy0:fy1, fx0:fx1] |= hair
            rois.append([fx0, fy0, fx1, fy1])
    return mask, rois


all_data = []
for e in entries:
    path = e['path']
    a = np.asarray(Image.open(HERE / 'originaux' / path).convert('RGBA')).copy()
    geralt = 'geralt' in path
    mask, rois = geralt_mask(a, path) if geralt else agarica_mask(a, path)
    family = 'geralt_portrait' if geralt and 'portrait_' in path else 'geralt' if geralt else 'agarica_hd' if ('agarica_extra' in path or 'portrait_agarica' in path or 'transfo_singe.png' in path) else 'agarica_legacy'
    all_data.append((e, a, mask, rois, family))

params = {}
for family in sorted(set(t[4] for t in all_data)):
    vals = np.concatenate([a[:, :, 0][m] for _, a, m, _, f in all_data if f == family and m.any()])
    qs = np.percentile(vals, [10, 55, 95])
    qs[1] = max(qs[1], qs[0]+8)
    qs[2] = max(qs[2], qs[1]+8)
    params[family] = qs.tolist()

report = []
thumbs = []
for e, a, mask, rois, family in all_data:
    path = e['path']
    after = a.copy()
    qs = params[family]
    if family.startswith('geralt'):
        colors = [[25, 24, 23], [126, 123, 120], [185, 182, 176], [230, 227, 222], [252, 249, 244]]
    else:
        colors = [[40, 22, 12], [142, 79, 42], [201, 119, 63], [227, 160, 102], [245, 202, 160]]
    anchors = [0, *qs, 280]
    lut = np.stack([np.interp(np.arange(256), anchors, [c[i] for c in colors]) for i in range(3)], axis=1).round().clip(0, 255).astype('uint8')
    after[:, :, :3][mask] = lut[a[:, :, 0][mask]]
    assert np.array_equal(a[:, :, 3], after[:, :, 3])
    assert np.array_equal(a[~mask], after[~mask])
    changed = (a != after).any(axis=2)
    dest_mask = MASKS / path
    dest_mask.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(mask.astype('uint8')*255).save(dest_mask)
    proposal = HERE / 'propositions' / path
    proposal.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(after).save(proposal)
    if args.apply and changed.any():
        if hashlib.sha256((ROOT/path).read_bytes()).hexdigest() != e['sha256']:
            raise RuntimeError('Source changed since backup, refusing overwrite: ' + path)
        shutil.copy2(proposal, ROOT / path)
    orig, edited = Image.fromarray(a), Image.fromarray(after)
    overlay = a.copy()
    overlay[mask, :3] = [0, 240, 255]
    overlay[mask, 3] = 255
    panels = [orig, edited, Image.fromarray(overlay)]
    cell = (600, 430) if a.shape[1] > 1000 else (400, 430)
    proof = Image.new('RGB', (cell[0]*3, cell[1]), (48, 51, 59))
    draw = ImageDraw.Draw(proof)
    for i, (panel, label) in enumerate(zip(panels, ['AVANT', 'APRES', 'MASQUE (cyan)'])):
        panel.thumbnail((cell[0]-8, cell[1]-35))
        proof.paste(panel, (cell[0]*i+(cell[0]-panel.width)//2, 30), panel)
        draw.text((cell[0]*i+5, 5), label, fill='white')
    proof_path = PREVIEW / path.replace('/', '__').replace('.png', '.jpg')
    proof.save(proof_path, quality=96)
    thumbs.append((path, proof))
    report.append({'path': path, 'size': e['size'], 'pixels_changed': int(changed.sum()), 'alpha_identique': True, 'hors_masque_identique': True, 'family': family, 'rois': rois, 'proof': proof_path.relative_to(HERE).as_posix()})

for group in ['geralt', 'agarica_sources', 'agarica_frames']:
    selected = [(p, im) for p, im in thumbs if ('geralt' in p if group == 'geralt' else 'geralt' not in p and ('_frames/' not in p if group == 'agarica_sources' else '_frames/' in p))]
    page_size = 9 if group == 'agarica_frames' else 12
    for page, start in enumerate(range(0, len(selected), page_size)):
        page_items = selected[start:start+page_size]
        contact = Image.new('RGB', (1800, len(page_items)*360), (48, 51, 59))
        draw = ImageDraw.Draw(contact)
        for i, (path, im) in enumerate(page_items):
            small = im.copy(); small.thumbnail((1800, 330))
            contact.paste(small, ((1800-small.width)//2, i*360+28))
            draw.text((5, i*360+4), path, fill='white')
        contact.save(HERE / (group + '_' + str(page) + '.jpg'), quality=96)

(HERE / ('validation_geralt.json' if args.only_geralt else 'validation_pixels.json')).write_text(json.dumps({'applique': args.apply, 'palette_source': params, 'fichiers': report}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'files': len(report), 'changed': sum(r['pixels_changed'] > 0 for r in report), 'mode': 'apply' if args.apply else 'preview', 'palette_source': params}))
