"""Pack generated gorilla art into common canvases; no pose interpolation.

Requires Pillow, numpy, scipy. Run from any directory.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1] / 'assets/sprites/boss_gorille'
# Count, source-to-output uniform scale, source floor, frame durations (ms).
SPECS = {
    'idle': (4, 300/644, 691, [220, 220, 220, 220]),
    'marche': (6, 300/504, 615, [110]*6),
    'charge': (6, 280/451, 599, [75]*6),
    'attaque_frappe': (5, 300/472, 631, [120, 180, 65, 130, 180]),
    'attaque_saut': (6, 300/413, 677, [160, 90, 140, 75, 160, 180]),
    'cri': (4, 300/617, 680, [140, 150, 350, 180]),
    'degat': (2, 300/764, 776, [100, 160]),
    'mort': (5, 300/474, 622, [180, 160, 140, 180, 800]),
}
WIDTH, HEIGHT, FLOOR = 384, 512, 472


def main():
    packed = ROOT / 'sheets_ready'
    packed.mkdir(exist_ok=True)
    metadata = {'frameWidth': WIDTH, 'frameHeight': HEIGHT,
                'origin': [0.5, FLOOR/HEIGHT], 'animations': {}}
    for name, (count, scale, source_floor, durations) in SPECS.items():
        arr = np.array(Image.open(ROOT / 'sheets' / f'gorille_{name}.png').convert('RGBA'))
        mask = arr[:, :, 3] > 10
        # Two death poses touch at their outermost fur: partition that junction.
        if name == 'mort':
            candidates = mask[:, 800:825].sum(axis=0)
            seam = 800 + int(candidates.argmin())
            mask[:, seam] = False
        labels, _ = ndimage.label(mask)
        sizes = np.bincount(labels.ravel())
        objects = ndimage.find_objects(labels)
        bodies = [i for i in range(1, len(sizes)) if sizes[i] > 2000]
        bodies.sort(key=lambda i: objects[i-1][1].start)
        if len(bodies) != count:
            raise ValueError(f'{name}: expected {count} bodies, found {len(bodies)}')
        groups = {i: [i] for i in bodies}
        # Attach dust and detached stone chips to the closest body bounding box.
        for i in range(1, len(sizes)):
            if i in groups or sizes[i] < 8:
                continue
            sy, sx = objects[i-1]
            x, y = (sx.start+sx.stop)/2, (sy.start+sy.stop)/2
            def distance(body):
                by, bx = objects[body-1]
                return max(bx.start-x, 0, x-bx.stop)**2 + max(by.start-y, 0, y-by.stop)**2
            target = min(bodies, key=distance)
            if name == 'attaque_saut' and 1340 < x < 1840 and y > 400:
                target = bodies[4]
            groups[target].append(i)
        folder = ROOT / f'gorille_{name}_frames'
        folder.mkdir(exist_ok=True)
        sheet = Image.new('RGBA', (WIDTH*count, HEIGHT))
        files = []
        for index, body in enumerate(bodies):
            selected = np.isin(labels, groups[body])
            ys, xs = np.where(selected)
            x0, x1, y0, y1 = xs.min(), xs.max()+1, ys.min(), ys.max()+1
            crop = arr[y0:y1, x0:x1].copy()
            crop[~selected[y0:y1, x0:x1]] = 0
            sprite = Image.fromarray(crop).resize((round((x1-x0)*scale), round((y1-y0)*scale)), Image.Resampling.NEAREST)
            frame = Image.new('RGBA', (WIDTH, HEIGHT))
            # Use the body center, not effect extents. Retain vertical jump travel.
            _, bx = objects[body-1]
            center = (bx.start+bx.stop)/2
            px = round(WIDTH/2 + (x0-center)*scale)
            py = round(FLOOR + (y0-source_floor)*scale)
            if px < 0 or py < 0 or px+sprite.width > WIDTH or py+sprite.height > HEIGHT:
                raise ValueError(f'{name}/{index}: sprite exceeds canvas')
            frame.paste(sprite, (px, py))
            file = f'gorille_{name}_row0_{index}.png'
            frame.save(folder / file)
            sheet.paste(frame, (index*WIDTH, 0))
            files.append(f'{folder.name}/{file}')
        sheet.save(packed / f'gorille_{name}.png')
        metadata['animations'][name] = {'frames': files, 'durationsMs': durations,
            'loop': name in ('idle', 'marche', 'charge'),
            'sheet': f'sheets_ready/gorille_{name}.png'}
        print(f'{name}: {count} frames, {WIDTH}x{HEIGHT}, alpha preserved')
    (ROOT / 'animations.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
