# Prompt Codex n°2 — images restantes (2026-10-06)

```
On continue la production des images de « Legend of Agarica ». Relis `CODEX_SPRITES_A_GENERER.md` (il a été mis à jour) et `docs/production/RAPPORT_CODEX.md` (ton suivi). Les règles ne changent pas :
- un prompt anglais du document = une image, enregistrée au chemin exact indiqué ;
- fond transparent (ou noir pur, SANS halo ni lueur colorée) ;
- une rangée = une animation, nombre de frames exact ;
- frames séparées d'au moins 40 px, rangées d'au moins 60 px ;
- une silhouette connexe par frame, aucun texte, personnages tournés vers la DROITE ;
- après chaque asset : `python tools/import_codex_assets.py`, et régénération si AVERTISSEMENT (`--only <id> --force`) ;
- ne modifie ni `src/` ni le manifeste.

Déjà fait, ne pas refaire : agarica_extra p1-p2, pere_chef, amanite, galter, morgat. Kainati p1-p2 existent.

ORDRE DE PRODUCTION :

1. Forme singe d'Agarica (section `singe`, MISE À JOUR) :
   - Le design suit maintenant l'image de référence `assets/_codex_ref/singe_reference.png` : singe brun aux mèches en pointes, visage et mains crème, yeux vert lumineux, longue queue enroulée en spirale. Joins-la comme référence et reproduis exactement ce rendu.
   - Rangée 0 `jump` = le DOUBLE SAUT : un salto en boule qui tourne, la même boule pivotée d'un quart de tour à chaque frame (4 frames en boucle).
   - Rangées `liane_hang` / `liane_swing` : suspendu à une liane invisible, balancement.
   - Puis `release_flip`, `idle`, `run` (singe_p2).
   - Ensuite `transfo_singe` (Agarica → ce singe brun, tourbillon de feuilles collé à la silhouette).
2. `agarica_extra_p3.png` et `agarica_extra_p4.png` (Agarica humaine accrochée et se balançant à une liane, sort de soin `cast`, réception d'objet). Même échelle et même rendu que p1-p2 déjà faits.
3. Boss :
   - `kainati_p3.png`, `kainati_p4.png` (même design que p1-p2) ;
   - `kainati_esprit` (forme ancestrale éthérée) ;
   - `ghilt` (toutes ses images) et `ghilt_gueri`.
4. Refaire `xara_extra` : la bande vide entre les rangées faisait 45 px, il en faut au moins 60.
5. Nouveaux personnages des docs :
   - `habitant_druide`, `habitant_porteur`, `habitant_garde` ;
   - `clak` (crabe totem de Galter) ;
   - `papillon` ;
   - `cochon_bebe`, `poisson`.
6. Ennemis : `loup_sanguinaire`, `araignee`, `mousse_creature`, `crapaud_corrompu`, `singe_corrompu` (petit singe corrompu, même famille visuelle que le singe brun de référence, mais couvert de mousse vert toxique et yeux malades).
7. Objets et monde :
   - planches `objets_A`, `objets_B`, `mousse_amas`, `totems_singe` ;
   - `liane`, `mousse_mur`, `porte_mousse`, `courant_air`.
8. Interface :
   - `dialogue_box` ;
   - les 8 portraits (cohérents avec les feuilles des personnages déjà générés : joins leurs images comme référence) ;
   - `hud_coeurs` ;
   - les icônes `form_icone_singe` (avec le singe brun), `skill_icone_*` ;
   - `carte_parchemin`, `titre_logo`.
9. Effets : `vfx_soin_papillon`, `vfx_souffle_toxique`, `vfx_flaque_mousse`, `vfx_purification`, `vfx_piste_loup`, `vfx_impact_pierre`.
10. Biomes — fonds parallax (raccord gauche/droite obligatoire) :
    - `fond_foret_sombre` (NOUVEAU), `fond_bosquet`, `fond_grand_arbre`, `fond_foret_flottante`, `fond_foret_corrompue`, `fond_monde_spirituel`, `fond_trou_sombre`, `fond_arene_ghilt`.
11. Biomes — tuiles : `tuiles_ecorce` (le grand arbre et la montée dans le tronc), `tuiles_flottantes`, `tuiles_corrompues`. Suis exactement la disposition des 21 tuiles décrite dans leur section.
12. Biomes — planches de décor :
    - `grand_arbre` ;
    - `grand_arbre_tronc` (NOUVEAU : parois d'écorce verticales, branches, escalier de racines, fenêtre sur la lune, lianes, sève corrompue : pour la zone qui monte le long et dans le tronc) ;
    - `foret_sombre`, `foret_flottante`, `foret_corrompue`, `hutte_morgat`.
    - Enregistre-les dans `assets/decors/déco item/<section>/<section>_planche.png`, sans les découper : je m'occupe de la découpe.

À la fin (ou si tu t'arrêtes) :
- mets à jour `docs/production/RAPPORT_CODEX.md` (fait / à refaire / non fait par asset) ;
- termine toujours par un `python tools/import_codex_assets.py` final.
```
