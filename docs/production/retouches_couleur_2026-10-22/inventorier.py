"""Sauvegarde et aperçu des images originales, sans modification des assets."""
from pathlib import Path
import hashlib
import json
import shutil

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sources = ['assets/sprites/agarica_extra.png', 'assets/sprites/agarica_extra_p2.png', 'assets/sprites/agarica_extra_p3.png', 'assets/sprites/agarica_extra_p4.png', 'assets/sprites/transfo_singe.png', 'assets/_codex_src/portrait_agarica.png', 'assets/sprites/agarica_attack.png', 'assets/sprites/transformation/transfo_ours.png', 'assets/_codex_src/titre_logo.png', 'assets/sprites/geralt.png', 'assets/sprites/geralt_p2.png', 'assets/_codex_src/portrait_geralt.png']
folders = ['assets/sprites/agarica_frames', 'assets/sprites/agarica_walk_frames', 'assets/sprites/agarica_attack_frames', 'assets/sprites/transformation/transfo_frames', 'assets/sprites/transformation/transfo_loup_frames', 'assets/sprites/transformation/transfo_loup_piaf_frames', 'assets/sprites/transformation/transfo_ours_frames', 'assets/sprites/transformation/transfo_pieuvre_frames']
paths = [ROOT / p for p in sources]
for folder in folders:
    paths.extend(sorted((ROOT / folder).glob('*.png')))
entries = []
for path in paths:
    if not path.is_file():
        raise SystemExit('Missing: ' + str(path))
    relative = path.relative_to(ROOT).as_posix()
    original = HERE / 'originaux' / relative
    original.parent.mkdir(parents=True, exist_ok=True)
    if not original.exists():
        shutil.copy2(path, original)
    im = Image.open(original)
    entries.append({'path': relative, 'size': im.size, 'mode': im.mode, 'sha256': hashlib.sha256(original.read_bytes()).hexdigest()})
(HERE / 'inventaire.json').write_text(json.dumps(entries, indent=2), encoding='utf-8')
hashes = {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT / 'src').rglob('*') if p.is_file()}
hash_path = HERE / 'src_avant.json'
if not hash_path.exists():
    hash_path.write_text(json.dumps(hashes, indent=2), encoding='utf-8')
groups = [('sources', entries[:len(sources)], 3, (600, 440)), ('frames', entries[len(sources):], 6, (300, 360))]
for name, items, cols, cell in groups:
    sheet = Image.new('RGB', (cols * cell[0], ((len(items) + cols - 1) // cols) * cell[1]), (48, 51, 59))
    draw = ImageDraw.Draw(sheet)
    for i, e in enumerate(items):
        im = Image.open(HERE / 'originaux' / e['path']).convert('RGBA')
        im.thumbnail((cell[0] - 8, cell[1] - 42))
        x, y = i % cols * cell[0], i // cols * cell[1]
        sheet.paste(im, (x + (cell[0] - im.width) // 2, y + 40), im)
        draw.text((x + 4, y + 4), e['path'].split('/')[-2] + '/' + Path(e['path']).name, fill='white')
    sheet.save(HERE / (name + '_avant.jpg'), quality=95)
print(json.dumps(entries))
