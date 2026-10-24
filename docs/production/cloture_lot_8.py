"""Cloture documentaire du lot 8 puis import complet demande."""
from pathlib import Path
import json,os,subprocess,sys,re
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/production/controles/lot_8'
sys.stdout.reconfigure(encoding='utf-8')
state=json.loads((OUT/'suivi.json').read_text(encoding='utf-8'))
audit=json.loads((OUT/'audit_final.json').read_text(encoding='utf-8'))
assert len(state)==27 and not audit['problems'],audit['problems']
report=ROOT/'docs/production/RAPPORT_CODEX.md'
s=report.read_text(encoding='utf-8')
notes={
1:'6 bandes ; surfaces animees derivees par decalages horizontaux de 96 px ; raccords source/import controles.',
2:'Bande toxique opaque dans son corps ; toile restante transparente.',
3:'Couche opaque ; bas uniforme #2a9ef7 sur 60 px.',
4:'3 bandes ; brume avant opaque dans ses 60 % inferieurs ; alpha doux au-dessus.',
5:'6 elements ; nuages et soleil en alpha doux.',
6:'6 objets ; paires eteint/allume et ferme/ouvert normalisees aux memes dimensions.',
7:'6 decors ; largeur des trois etats de plateforme identique.',
8:'3 objets ; pont normalise a 1440 x 90 px.',
9:'Regeneration corrective : retrait du tapis continu sous les iles ; alpha et raccords controles.',
10:'6 elements ; plante fleurie/bouton de memes dimensions ; petites variations de dessin entre les deux etats.',
11:'3 bandes ; seul le tapis est tuilable.',
12:'12 elements ; touffes petite/moyenne/grande 145/210/280 px de haut ; base commune. Mousse de tronc avec une mince bordure brune residuelle.',
13:'Vignette opaque en niveaux de gris.',
14:'12 particules ; suppression des miettes detachees.',
15:'12 effets ; lueurs et ombre sur vrai alpha.',
16:'6 lueurs ; halo regenere puis bords alpha adoucis ; legere texture nuageuse conservee dans le halo doux.',
17:'12 frames, 3 rangees de 4 ; import valide.',
18:'8 frames, 2 rangees de 4 ; import valide ; alpha doux.',
19:'8 frames : climb 4 / throw 4 ; silhouettes connexes. Grimpe jusqu a 260 px ; lancers accroupis 138-164 px, echelle commune preservee.',
20:'4 frames cast ; troisieme pose regeneree pour corriger la vue frontale ; toutes dirigees a droite ; silhouettes connexes.',
21:'9 frames : idle 4 / run 5 ; yeux bruns sans emission ; silhouettes connexes.',
22:'8 creatures ; petites particules de mousse detachees retirees.',
23:'4 accessoires ; fleche vers la droite ; note a gribouillis illisibles.',
24:'2 segments ; montages verticaux avant/apres import ; raccord RGBA exact.',
25:'4 panneaux ; pointe ouverte ; centres libres ; bordures et essais 9-slice mesures ci-dessous.',
26:'6 elements ; touches et cases sans lettres ; seul symbole typographique : !.',
27:'4 barres ; remplissages separes ; cadres mesures et essais en etirement horizontal.'}
start=s.index('<!-- LOT8_SUIVI -->');end=s.index('<!-- /LOT8_SUIVI -->',start)
part=s[start:end]
for n,note in notes.items():
    pattern=re.compile(r'(^\| '+str(n)+r' \|[^\n]*)( \|$)',re.M)
    part=pattern.sub(lambda m:m[1]+' '+note+m[2],part)
s=s[:start]+part+s[end:]
detail='\n### Cloture et limites du lot 8\n\n'
detail+='Les 27 sources ont ete generees dans l ordre des priorites 1 a 4, puis importees individuellement. Les revisions concernent uniquement ces nouvelles sources. Les 119 entrees livrent 114 images et 5 animations (41 frames). Galerie : [controles/lot_8/index.html](controles/lot_8/index.html).\n\n'
detail+='Les 16 elements tuilables disposent chacun de montages source et sortie : copies cote a cote, ou superposees pour corde/soie. Difference maximale RGBA aux bords apres import : **0**. Les sources font 1536 x 1024, sauf les segments verticaux en 1024 x 1536. Ciel et vignette sont opaques ; les autres toiles conservent leur transparence. Les lueurs sont livrees en alpha doux, **aucune sur fond noir**.\n\n'
detail+='Contraintes de taille contradictoires : les marges de 30 px ont ete preservees. Les elements annonces a 460/470/480 px dans une cellule de 512 px sont limites a 452 px ; ceux de 340 px dans une cellule de 384 px a 324 px ; la mousse de tronc de 320 px dans une rangee de 341 px a 281 px ; la banniere de 720 px a 708 px. Les formes d une meme famille restent dessinees par generation : les dimensions sont normalisees, mais les contours des etats ne sont pas des copies pixel-identiques. Les variations residuelles sont signalees dans les lignes concernees.\n\n'
detail+='#### Mesure des bordures et recommandations 9-slice\n\n'
detail+='Ordre des valeurs : **gauche / droite / haut / bas**, en pixels a l echelle source. La decoupe automatique rogne seulement les marges transparentes (1 a 2 px pour les panneaux), sans redimensionner ces cinq cadres. La bordure visible est mesuree sur les axes centraux, alpha >= 128, jusqu au remplissage interieur (distance RGB < 30). Les valeurs de retrait incluent les marges transparentes dues aux ornements. Les decoupes recommandees sont plus grandes pour proteger les coins ; elles ne sont pas des epaisseurs de trait.\n\n'
detail+='| Cadre | Sortie | Bordure visible G/D/H/B | Retrait au fond G/D/H/B | Decoupes conseillees G/D/H/B |\n|---|---|---|---|---|\n'
cuts=json.loads((OUT/'9slice_recommandations.json').read_text(encoding='utf-8'))
from PIL import Image
for d in state.values():
    for name,v in d.get('borders',{}).items():
        size=Image.open(ROOT/'assets/ui'/f'{name}.png').size
        order=['left','right','top','bottom']
        visible='/'.join(str(v['visible_border'][k]) for k in order)
        inset='/'.join(str(v[k]) for k in order)
        detail+=f'| `{name}` | {size[0]} x {size[1]} | {visible} | {inset} | '+ '/'.join(map(str,cuts[name]))+' |\n'
detail+='\nPreuves d etirement : `controles/lot_8/9slice_*.jpg`. Les barres utilisent surtout les extremites gauche/droite pour le 3-slice ; conserver leur hauteur. Les ouvertures centrales des cadres energie/boss mesurent environ 22/14 px de haut sur l axe central : ajuster la hauteur ou masquer les remplissages a l integration. Aucun code d integration ajoute.\n\n'
detail+='Audit : [audit_final.json](controles/lot_8/audit_final.json), aucune anomalie de dimensions, de raccord ou de connexite des frames des personnages. Empreintes comparees a l etat initial : **aucun asset existant modifie**, donc aucune retouche des images existantes Agarica/Geralt ni des elements a reutiliser. Le manifeste reste intact. Nous avons uniquement laisse l importeur mettre a jour `src/data/asset_present.js`. D autres modifications de `src/` sont apparues en parallele pendant la session ; elles sont listees dans l audit et n ont pas ete modifiees ni annulees par ce travail.\n'
marker='<!-- LOT8_CLOTURE -->'
if marker in s:s=s[:s.index(marker)]
report.write_text(s+'\n'+marker+'\n'+detail,encoding='utf-8')
env=os.environ.copy();env['PYTHONIOENCODING']='utf-8'
r=subprocess.run([sys.executable,'tools/import_codex_assets.py'],cwd=ROOT,env=env,capture_output=True,text=True,encoding='utf-8')
log=r.stdout+r.stderr
dest=ROOT/'docs/production/imports/final_lot_8_2026-10-23.log';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(log,encoding='utf-8')
tail=log[log.rfind('================ RAPPORT ================'):]
with report.open('a',encoding='utf-8') as f:f.write('\n#### Import complet final\n\nCommande : `python tools/import_codex_assets.py`. Journal : [final_lot_8_2026-10-23.log](imports/final_lot_8_2026-10-23.log).\n\n```text\n'+tail.rstrip()+'\n```\n')
print(tail)
if r.returncode or 'AVERTISSEMENT' in log or 'avertissement(s)' in log:raise RuntimeError(log)
