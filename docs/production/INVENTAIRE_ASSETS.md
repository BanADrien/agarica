# Inventaire des assets existants (état au 2026-10-01)

Référence interne utilisée pour produire `CODEX_SPRITES_A_GENERER.md`.

## Guide de style (à respecter pour tout nouvel asset)

- Art IA haute résolution, look « HD pixel-art / cel-shading 2D », contour épais quasi-noir, aplats, couleurs saturées, texture pixel visible.
- Ours, crapaud, Kainati et props du bosquet : clairement pixel-art. Agarica, Xara, transformations : chibi / cel-shading anime plus propre. UI (cadres lianes/bois) : peint, brillant.
- Seul vrai pixel-art fait main : `assets/decors/tuiles.png` (144x144, grille 24 px).
- Palette : forêt de nuit violet/indigo/sarcelle, champignons cyan lumineux, accents magiques vert lumineux (yeux, runes, traînée d'attaque). Corruption = mousse vert toxique lumineuse qui dégouline (voir sprite Kainati). Plantes de premier plan : silhouettes violet-noir avec liseré rose.
- Vue strictement de profil. Agarica humaine (idle/marche/course) regarde à GAUCHE ; tout le reste (loup, aigle, ours, Xara, crapaud, Kainati, attaque dague) regarde à DROITE. **Nouvelles feuilles : regarder à DROITE.**
- Fond : PNG RGBA transparent (sinon noir pur, retiré par `tools/dechroma.py`). Pas d'outil de chroma vert.
- Tailles natives : 2172x724 (3:1, rangée de 4-6 frames), 1448x1086 (4:3, multi-rangées / planche d'objets), 1254x1254, 1536x1024.
- Agarica : chibi menue ~2,5-3 têtes, oreilles pointues, yeux verts, cheveux brun clair orangé courts en bataille (pas rouges), cape verte à capuche brodée feuilles/lianes avec fermoir argent rond, tunique beige sans manches, ceinture marron boucle dorée, pantalon gris foncé, bottes marron, mitaines noires, tatouage rose/spirale rouge sur le bras nu, dague argentée.
- Loup : gris-violet sombre, yeux verts. Aigle (« piaf ») : violet-noir, motifs feuilles vertes sur les ailes, œil vert, bec jaune. Ours : brun, yeux verts. Xara : araignée duveteuse prune foncé, rayures rose/magenta, losanges, grands yeux verts, crocs roses.
- Échelle en jeu (960x540, tuile 64 px) : Agarica frame 232x357 à 0.24 (~86 px) ; loup 422x267 à 0.40 ; aigle 413x401 à 0.28 ; Xara 292x320 à 0.15 ; totems ~225x750 à 0.35 ; feu de camp 472x617 à 0.15 ; props 0.4. Cible nouveaux persos : 250-400 px de haut par frame source.

## Existant

- `sprites/agarica_frames` (idle 6, ancienne marche 5, course 6), `agarica_walk_frames` (4), `agarica_attack_frames` (5). Pas de saut/blessure/mort/liane/parole dédiés.
- `loup_frames` (course 6, saut 4), `loup_attaque_frames` (8), `piaf_frames` (vol 4, plané 4, piqué 5) + plumes, `pieuvre_frames` (4), `ours_frames` (compétence fracas 6), `crapaud_frames` (5), `xara_frames` (marche, swing, switch, saut).
- `transformation/` : humain→aigle, humain→loup, loup→aigle (flash), humain→ours, pieuvre.
- `bosses_sprites/9a18...png` : Kainati corrompu, pose statique unique (1254x1254), non chargé.
- `items/totem_frames` : totems loup/pieuvre/aigle dim/lit. `feu_de_camp_frames` (4). `firecamp_menu/interface.png` (non utilisé). `form_icone/{loup,aigle,pieuvre}.png`. `unlock_popup_animate/unlock1..5`.
- `decors/` : `plan4_ciel.png` (fond nuit), `arbres_frames` (8), `sous_bois_frames` (14), `plantes_frames` (bplante/hplante), `autotile_frames` (21 tuiles, jeu 'floor') + `tuiles_frames` (atlas `tuiles.png` découpé par `tools/cut_tuiles.py` : A1-A9, B, C1-C7, D1-D6 + 4 herbes, jeu 'tuiles'), `surface_frames`, `deco_item_frames/bosquet` (18 props). Planche `bosquet componant.png` : cabane, huttes, cottage, tour, tente, murailles, cercle de feu NON découpés.

## Placeholders dessinés par code

Araignee (ennemi), LoupSanguinaire, Web (toile), treeline, HUD (cœurs, énergie, slots A/F/R), cartes du menu feu de camp, écrans Titre/Prologue/Fin (dégradé + texte), pas de boîte de dialogue ni portraits.

## Pipeline d'import

1. Feuille PNG fond transparent ; UNE rangée = UNE animation, frames de gauche à droite ; bande transparente entre rangées ; chaque frame = une silhouette connexe qui ne touche pas sa voisine (pas d'étincelles/débris détachés — sinon feuille d'effets séparée).
2. Déposer dans `assets/sprites/<nom>.png`.
3. `python tools/split_spritesheet.py assets/sprites/<nom>.png assets/sprites/<nom>_frames --prefix <nom>` → `<nom>_row<r>_<c>.png`, même canvas, aligné bas-centre.
4. Fond noir : `python tools/dechroma.py in.png out.png` avant.
5. Props de décor : `assets/decors/déco item/<section>/` puis `tools/crop_deco_items.py`, renommer, déclarer dans `DECOR_SECTIONS`.
