"""Import complet final puis compte rendu definitif du lot 11."""
import sys,json,os,subprocess
import lot_11 as lot
ROOT,OUT=lot.ROOT,lot.OUT
sys.stdout.reconfigure(encoding='utf-8')
audit=json.loads((OUT/'audit_final.json').read_text(encoding='utf-8'));assert not audit['problems']
state=json.loads((OUT/'suivi.json').read_text(encoding='utf-8'));assert len(state)==6
br=audit['branch_controls'];tr=audit['trunk_controls']
for n in [2,3]:state[str(n)]['pieces']={iid:br['branches'][iid] for iid in state[str(n)]['ids']}
state['4']['pieces']['tronc_segment']['size']=tr['segment_size']
state['5']['pieces']['tronc_base'].update({'size':tr['base_size'],'axis_final':tr['base_axis_measured'],'ground_line_alpha128':tr['root_ground_bottom_alpha128']})
(OUT/'suivi.json').write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding='utf-8')
env=os.environ.copy();env['PYTHONIOENCODING']='utf-8'
r=subprocess.run([sys.executable,'tools/import_codex_assets.py'],cwd=ROOT,env=env,capture_output=True,text=True,encoding='utf-8')
log=r.stdout+r.stderr;dest=ROOT/'docs/production/imports/final_lot_11_2026-11-04.log';dest.parent.mkdir(exist_ok=True,parents=True);dest.write_text(log,encoding='utf-8')
tail=log[log.rfind('================ RAPPORT ================'):]
# Refresh only this lot's progress section after the final import.
lot.docs(state)
report=ROOT/'docs/production/RAPPORT_CODEX.md'
detail='\n### Contrôles définitifs du lot n°11\n\n6 sources et 8 entrées livrées, dans l ordre demandé : crocs, milieu/fourche, base/bout, segment de tronc, pied, Agarica au repos. Le travail des branches a commencé par le milieu ; sa matière sert aux autres pièces. Les extrémités ont été générées séparément puis assemblées, comme autorisé. Les versions non retenues et les prompts sont conservés dans les contrôles. Aucune image existante régénérée ou retouchée.\n\n'
detail+='Dimensions ci-dessous mesurées **sur les fichiers après import**. Les 4 branches conservent bien leur case verticale de 512 px, sans rognage vertical ni changement d échelle par l importeur. Ligne de marche : première rangée alpha > 128, médiane sur la partie marchable ; bras haut exclu pour la fourche. Dessous : dernière rangée alpha > 128 sur cette même partie.\n\n'
detail+='| Pièce | Dimensions finales | Marche médiane | Dessous médian |\n|---|---|---:|---:|\n'
for iid in ['branche_milieu','branche_fourche','branche_base','branche_bout']:
    d=br['branches'][iid];detail+=f'| `{iid}` | {d["size"][0]} × {d["size"][1]} | {d["walk_median"]:g} | {d["underside_median"]:g} |\n'
detail+=f'\n`tronc_segment` : {tr["segment_size"][0]} × 1536, corps médian proche de 768 px, contours latéraux irréguliers inclus dans la largeur finale. `tronc_base` : 1400 × 1024 ; **axe mesuré x={tr["base_axis_measured"]}**, centre de l image x=700, donc écart −1,5 px. Déséquilibre gauche/droite des étendues des racines : {tr["root_extent_balance"]} px (tolérance 8). Fond des racines alpha > 128 : rangée {tr["root_ground_bottom_alpha128"]}, pour la ligne de sol nominale 960.\n\n'
detail+='Montages livrés : [raccord_branche_milieu.png](controles/lot_11/raccord_branche_milieu.png), [raccord_tronc_segment.png](controles/lot_11/raccord_tronc_segment.png), [assemblage_branche.png](controles/lot_11/assemblage_branche.png), [assemblage_tronc.png](controles/lot_11/assemblage_tronc.png). **Δ RGBA maximal = 0** sur les deux répétitions, les 4 jonctions de branches et la jonction segment/pied. Finition par couture et mélange des seuls pixels générés aux raccords ; aucun dessin produit par code.\n\n'
detail+='Le montage des branches comporte 128 px de marge haute pour montrer entièrement Agarica à 344 px de haut : les branches commencent donc à y=128 et la ligne rouge de marche locale 256 apparaît à y=384 dans le montage. Ses pieds reposent sur cette ligne. Le montage du tronc contient 2 segments, le pied centré, et les deux bases de branche symétriques avec 256 px de recouvrement.\n\n'
detail+='`vfx_croc` : **5 frames** `bite`, toutes centrées sur le même point et à distance des bords des cases ; fermeture/interverrouillage à la troisième frame, rebond puis disparition. Lueur sur **vrai alpha doux**, aucune livraison sur fond noir. Opacité maximale des frames : 60 %, 100 %, 100 %, 75 %, 35 %.\n\n'
idle=audit['animations']['agarica_repos']
detail+=f'`agarica_repos` : **4 sit + 4 sit_idle**, toutes connexes. Debout {idle["stand_height"]} px ; repos {", ".join(map(str,idle["idle_heights"]))} px de haut ; largeur {idle["idle_widths"][0]} px pour les 4 poses. Sit frame 4 identique pixel pour pixel à sit_idle frame 1 ; bas de l image sur 90 px identique et mêmes bords gauche/droite. Boucle de contrôle : [agarica_sit_idle_controle.gif](controles/lot_11/agarica_sit_idle_controle.gif). La pose est plus compacte en largeur que les ~220 px indicatifs du prompt : 175 px mesurés ; priorité conservée à l échelle du personnage et au rapport de hauteur assis/debout (~72 %).\n\n'
detail+='Audit détaillé : [audit_final.json](controles/lot_11/audit_final.json). Empreintes des assets déjà existants : inchangées. Manifeste et `tools/import_codex_assets.py` inchangés. Aucune édition de code du jeu par ce travail ; `asset_present.js` est mis à jour uniquement par l importeur. Les autres modifications de `src/` observées en parallèle sont listées dans l audit et préservées. Vérifications graphiques et d import effectuées ; aucun branchement ou test de scène en jeu ajouté.\n\n'
detail+='Import complet final : `python tools/import_codex_assets.py`. [Journal complet](imports/final_lot_11_2026-11-04.log).\n\n```text\n'+tail.rstrip()+'\n```\n'
with report.open('a',encoding='utf-8') as f:f.write(detail)
gallery=OUT/'index.html'
with gallery.open('a',encoding='utf-8') as f:
    f.write('<h2>Contrôles après import</h2>')
    for name in ['raccord_branche_milieu','raccord_tronc_segment','assemblage_branche','assemblage_tronc']:
        f.write(f'<h3>{name}</h3><a href="{name}.png"><img style="max-height:900px;object-fit:contain;display:block" src="{name}.jpg"></a>')
    f.write('<h3>Respiration — contrôle</h3><img src="agarica_sit_idle_controle.gif"><p><a href="audit_final.json">Audit</a></p>')
print(tail)
assert r.returncode==0 and 'AVERTISSEMENT' not in log and 'avertissement(s)' not in log
