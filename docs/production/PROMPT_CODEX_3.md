# Prompt Codex n°3 — images restantes (2026-10-22)

```
On continue la production des images de « Legend of Agarica ». Relis `CODEX_SPRITES_A_GENERER.md` et ton suivi `docs/production/RAPPORT_CODEX.md`. Les règles ne changent pas :
- un prompt anglais du document = une image, enregistrée au chemin exact indiqué ;
- fond transparent (ou noir pur sans halo) ;
- une rangée = une animation, nombre de frames exact ;
- frames séparées d'au moins 40 px, rangées d'au moins 60 px ;
- une silhouette connexe par frame, aucun texte ;
- personnages tournés vers la DROITE ;
- après chaque asset : `python tools/import_codex_assets.py --only <id>` ;
- ne modifie ni `src/` ni le manifeste.

NE REFAIS PAS les personnages déjà importés (agarica_extra, singe, transfo_singe, xara_extra, pere_chef, amanite, habitants, geralt, clak, morgat, papillon, cochon_bebe, poisson, kainati, kainati_esprit, ghilt, ghilt_gueri) juste pour des écarts de taille entre poses ou entre planches : le jeu normalise les tailles par le code. Ne régénère un asset que si `import_codex_assets.py` affiche un AVERTISSEMENT (rangées ou frames manquantes / collées), ou si une frame est vide ou coupée. Dans ton rapport, marque ces assets « fait » avec une simple note.

À PRODUIRE, dans cet ordre :

1. Ennemis :
   - `loup_sanguinaire` ;
   - `araignee` ;
   - `mousse_creature` ;
   - `crapaud_corrompu` (même disposition que le crapaud existant) ;
   - `singe_corrompu` : même famille visuelle que le singe brun de référence `assets/_codex_ref/singe_reference.png`, couvert de mousse vert toxique, yeux malades.
2. Objets et monde :
   - planches `objets_A`, `objets_B`, `mousse_amas`, `totems_singe` ;
   - puis `liane`, `mousse_mur`, `porte_mousse`, `courant_air`.
3. Interface :
   - `dialogue_box` ;
   - les 8 portraits : joins comme référence l'image déjà générée du personnage (`assets/sprites/<id>.png`) pour garder exactement le même visage et les mêmes couleurs ;
   - `hud_coeurs` ;
   - `form_icone_singe` (avec le singe brun) et les 3 `skill_icone_*` ;
   - `carte_parchemin`, `titre_logo`.
4. Effets : `vfx_soin_papillon`, `vfx_souffle_toxique`, `vfx_flaque_mousse`, `vfx_purification`, `vfx_piste_loup`, `vfx_impact_pierre`.
5. Fonds parallax : `fond_bosquet`, `fond_foret_sombre`, `fond_grand_arbre`, `fond_foret_flottante`, `fond_foret_corrompue`, `fond_monde_spirituel`, `fond_trou_sombre`, `fond_arene_ghilt`.
   - Le raccord gauche/droite est obligatoire : vérifie-le en collant l'image à côté d'elle-même.
6. Tilesets : `tuiles_ecorce`, `tuiles_flottantes`, `tuiles_corrompues`, en suivant exactement la disposition décrite dans leur section.
7. Planches de décor :
   - `grand_arbre`, `grand_arbre_tronc`, `foret_sombre`, `foret_flottante`, `foret_corrompue`, `hutte_morgat` ;
   - chaque objet doit être posé sur un bord bas plat (sa base touche le bas de sa case) : pas d'arbre ou d'objet dont la base flotte au-dessus des autres dans la même image ;
   - enregistre chaque planche dans `assets/decors/déco item/<section>/<section>_planche.png`, sans la découper.

À la fin (ou si tu t'arrêtes) :
- mets à jour `docs/production/RAPPORT_CODEX.md` ;
- termine par un `python tools/import_codex_assets.py` complet, pour que `src/data/asset_present.js` soit à jour.
```
