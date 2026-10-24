from pathlib import Path
import json,html

folder=Path(__file__).resolve().parent/'controles/lot_8'
jobs=json.loads((folder/'prompts.json').read_text(encoding='utf-8'))
state=json.loads((folder/'suivi.json').read_text(encoding='utf-8'))
parts=['''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Legend of Agarica — Lot 8</title>
<style>body{margin:30px;background:#151922;color:#ebefe8;font:16px system-ui}h1{color:#a6e4bb}nav{display:flex;gap:8px;position:sticky;top:0;padding:12px;background:#151922}button{padding:10px 18px;background:#304537;color:white;border:1px solid #8db49a;border-radius:6px;cursor:pointer}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px}article{background:#252d36;padding:14px;border-radius:10px}img{width:100%;display:block}a{color:#a6e4bb}small{display:block;margin:10px 0;color:#ccd5d7}summary{cursor:pointer}li{margin:6px 0}</style>
<h1>Legend of Agarica — Lot n°8</h1><p>Planches, imports et montages des raccords. Les aperçus gris montrent les zones transparentes.</p><nav>''']
for p,label in [('all','Tout'),('1','Priorité 1'),('2','Priorité 2'),('3','Priorité 3'),('4','Priorité 4')]:parts.append(f'<button onclick="filter(\'{p}\')">{label}</button>')
parts.append('</nav><p>Retouches poison : <a href="../retouches_poison_2026-10-23/index.html">comparaison avant / après</a>.</p>')
for priority,span in enumerate([(1,13),(14,18),(19,24),(25,27)],1):
    parts.append(f'<section data-priority="{priority}"><h2>Priorité {priority}</h2><div class="cards">')
    for n in range(span[0],span[1]+1):
        job=jobs[n-1];data=state.get(str(n),{});source=html.escape(job['source']);name=Path(source).name
        parts.append(f'<article><h3>{n:02d} — {name}</h3><a href="../../../../{source}"><img loading="lazy" src="{n:02d}_final.jpg" alt="{name}"></a><small>{html.escape(data.get("status","à générer"))}</small><a href="../../../../{source}">Source PNG</a> · <a href="{n:02d}_import.log">Import</a>')
        if data.get('raccords'):
            parts.append('<details><summary>Contrôles de raccord</summary><ul>')
            for iid in data['raccords']:parts.append(f'<li><a href="raccord_{iid}.png">{iid}, après import</a> · <a href="raccord_{iid}_source.png">source</a></li>')
            parts.append('</ul></details>')
        parts.append('</article>')
    parts.append('</div></section>')
parts.append('''<script>function filter(p){document.querySelectorAll('section').forEach(s=>s.hidden=p!=='all'&&s.dataset.priority!==p)}</script></html>''')
(folder/'index.html').write_text(''.join(parts),encoding='utf-8')
print(folder/'index.html')
