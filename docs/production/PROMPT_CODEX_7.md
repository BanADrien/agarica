# Prompt Codex n°7 — nouvelles animations du combat de Kainati (2026-10-23)

Le combat de Kainati est refait : il reste AU SOL, et ses grandes attaques couvrent tout le sol de l'arène (on les esquive suspendue aux lianes). Images déjà déclarées dans `src/data/asset_manifest.js` (`kainati_sol`, `vfx_onde_choc`, `vfx_vague_mousse`, `rocher_roulant`).

```
Nouvelles images pour « Legend of Agarica ». Règles habituelles :
- fond transparent ;
- une rangée = une animation, nombre de frames exact ;
- frames séparées d'au moins 40 px, rangées d'au moins 60 px ;
- une silhouette connexe par frame ;
- tourné vers la DROITE ;
- aucun texte ;
- ne modifie ni `src/` ni le manifeste.
Joins comme référence `assets/sprites/kainati.png` et `assets/sprites/kainati_frames/kainati_row0_0.png`.
Même personnage, MÊME ÉCHELLE (Kainati ~400 px de haut en position debout sur les phalanges), même rendu.
Ne dessine AUCUN effet détaché sur les feuilles du personnage (poussière, éclats, ondes) : les effets sont des images à part.

Fiche (à inclure dans chaque prompt) : KAINATI, KING OF THE SIMIANS (corrupted boss) - must match the existing reference art exactly: a huge gorilla-like ape king, thick shaggy pure-white fur with black outlines, dark grey skin on face, chest, hands and feet, glowing green eyes, angry heavy brow, red tribal paint stripes on his cheek, a tall carved Maya-like stone crown/headdress made of grey-beige stone blocks with spiral glyphs, thick brown vine bracelets wrapped around wrists and ankles, patches of glowing toxic-green moss stuck in his fur and on his crown. Knuckle-walking stance. Clearly pixel-art style, thick dark outline, side view, facing RIGHT.

1) `assets/sprites/kainati_sol.png` (1536 x 1024, 2 rangées de 4 frames, cellules 384 x 512)
   Rangée 1 « charge » (course lourde sur les phalanges, en boucle) :
   - frame 1 : bras avancés, poings qui frappent le sol ;
   - frame 2 : corps soulevé, jambes ramenées sous lui ;
   - frame 3 : jambes qui poussent, corps tendu vers l'avant ;
   - frame 4 : retombée sur les poings.
   Rangée 2 « roar » (cri de rage, debout) :
   - frame 1 : il se redresse sur ses jambes ;
   - frame 2 : poings qui frappent sa poitrine ;
   - frame 3 : tête rejetée en arrière, gueule grande ouverte qui hurle ;
   - frame 4 : il retombe sur les phalanges.
   Puis `python tools/import_codex_assets.py --only kainati_sol` (une fois les 3 images faites).

2) `assets/sprites/kainati_sol_p2.png` (1536 x 1024, 2 rangées de 4 frames)
   Rangée 1 « slam » (frappe du sol à deux poings qui déclenche l'onde de choc) :
   - frame 1 : debout, les deux poings joints levés très haut au-dessus de la tête ;
   - frame 2 : poings qui descendent ;
   - frame 3 : impact, les deux poings écrasés au sol, corps penché, genoux pliés ;
   - frame 4 : il se relève, poings encore au sol.
   Rangée 2 « sweep » (il fait rouler un énorme rocher sur le sol vers l'avant) :
   - frame 1 : il soulève un gros rocher rond à deux mains au-dessus de lui (le rocher touche ses mains) ;
   - frame 2 : rocher ramené derrière lui ;
   - frame 3 : il le projette vers l'avant, au ras du sol, bras tendus (le rocher touche encore ses mains) ;
   - frame 4 : mains vides, suivi du geste.

3) `assets/sprites/kainati_sol_p3.png` (1536 x 1024, 1 rangée de 4 frames, cellules 384 x 1024, centrées en bas)
   Rangée 1 « stunned » (sonné après une attaque, en boucle) :
   - frame 1 : assis lourdement, tête qui dodeline, yeux plissés ;
   - frame 2 : tête penchée de l'autre côté ;
   - frame 3 : une main sur la couronne, l'air hébété ;
   - frame 4 : comme la frame 1.

4) `assets/vfx/vfx_onde_choc.png` (1536 x 1024, 1 rangée de 4 cellules de 384 px, posé en BAS de chaque cellule)
   Onde de choc au sol vue de profil : une vague de terre, de poussière et d'éclats d'écorce qui avance au ras du sol, environ 300 px de large et 90 px de haut, palette brun-beige avec une crête vert toxique.
   - frame 1 : naissance ;
   - frame 2 : pleine hauteur ;
   - frame 3 : elle s'étire ;
   - frame 4 : elle retombe.
   Les morceaux peuvent être séparés mais restent dans leur cellule.
   Puis `python tools/import_codex_assets.py --only vfx_onde_choc`.

5) `assets/vfx/vfx_vague_mousse.png` (1536 x 1024, 1 rangée de 4 cellules de 384 px, posé en BAS)
   Vague de mousse toxique vivante qui glisse au ras du sol, en boucle : une nappe épaisse vert toxique lumineuse avec des bulles et des filaments qui ondulent, environ 300 px de large et 70 px de haut. Les 4 frames forment une ondulation qui boucle.
   Puis `python tools/import_codex_assets.py --only vfx_vague_mousse`.

6) `assets/_codex_src/rocher_roulant.png` (1024 x 1024)
   Un gros rocher rond gris-beige, avec une spirale gravée et quelques plaques de mousse vert toxique, vu de profil. Il est parfaitement rond pour pouvoir tourner, fond transparent, sans ombre.
   Puis `python tools/import_codex_assets.py --only rocher_roulant`.

À la fin :
- mets à jour `docs/production/RAPPORT_CODEX.md` ;
- lance un `python tools/import_codex_assets.py` final.
```
