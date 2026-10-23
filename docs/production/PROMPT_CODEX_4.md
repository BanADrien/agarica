# Prompt Codex n°4 — retouches de couleur (2026-10-22, Geralt retiré le 2026-10-23)

```
Retouches de couleur sur des images DÉJÀ existantes de « Legend of Agarica ». Il s'agit d'ÉDITIONS d'image, pas de nouvelles créations : pour chaque fichier, garde EXACTEMENT la même image (même taille de toile, même transparence, mêmes poses, même cadrage, même visage, mêmes vêtements, mêmes contours) et ne change QUE la couleur indiquée. Ne déplace rien, ne redessine rien, n'ajoute rien. Ne modifie ni `src/` ni le manifeste. Lis aussi `CODEX_SPRITES_A_GENERER.md` (les fiches d'identité ont été mises à jour).

A) AGARICA — DÉJÀ FAIT par script le 2026-10-23 (tools/recolor_agarica_hair.py) : NE PAS retoucher ces images. Couleur retenue par l'utilisateur : AUBURN CLAIR #B5613A (proposition 7 ; ni #B5613A ni #C9773F). Pour toute NOUVELLE image d'Agarica, utiliser directement cette couleur.

Ancienne consigne, pour mémoire : ses cheveux ne sont pas rouges mais BRUN CLAIR ORANGÉ (cuivre clair chaleureux / châtain roux clair). Repères : teinte de base #C9773F, ombres #8E4F2A, reflets #E3A066. Ne change QUE les cheveux. Le tatouage rose/rouge sur le bras, les yeux verts, la cape verte, la peau et tout le reste restent identiques.

Fichiers à retoucher :
1. Feuilles sources (puis relancer l'import) :
   - `assets/sprites/agarica_extra.png`, `agarica_extra_p2.png`, `agarica_extra_p3.png`, `agarica_extra_p4.png`
     → puis `python tools/import_codex_assets.py --only agarica_extra --force`
   - `assets/sprites/transfo_singe.png` (seulement les frames où Agarica est encore humaine ou à moitié)
     → puis `python tools/import_codex_assets.py --only transfo_singe --force`
   - `assets/_codex_src/portrait_agarica.png`
     → puis `python tools/import_codex_assets.py --only portrait_agarica --force`
2. Frames existantes sans feuille source, à retoucher une par une, EN PLACE (même nom, même taille, fond transparent conservé) :
   - `assets/sprites/agarica_frames/*.png` (17 images : repos, ancienne marche, course)
   - `assets/sprites/agarica_walk_frames/*.png` (4)
   - `assets/sprites/agarica_attack_frames/*.png` (5) et la feuille `assets/sprites/agarica_attack.png`
   - `assets/sprites/transformation/transfo_frames/*.png` (3, Agarica-aigle)
   - `assets/sprites/transformation/transfo_loup_frames/*.png` (2) et `transfo_loup_piaf_frames/*.png` (1)
   - `assets/sprites/transformation/transfo_ours_frames/*.png` (3) et la feuille `transfo_ours.png`
   - `assets/sprites/transformation/transfo_pieuvre_frames/*.png` (4), uniquement si des cheveux d'Agarica y sont visibles
   Pour ces frames, travaille image par image et garde une teinte identique d'une frame à l'autre (compare côte à côte). Les animaux (loup, aigle, ours, pieuvre) gardent leurs couleurs : seuls les cheveux d'Agarica changent.
3. `assets/_codex_src/titre_logo.png` : si une silhouette ou des cheveux rouges d'Agarica y figurent, passe-les dans la même couleur, puis `python tools/import_codex_assets.py --only titre_logo --force`.

B) GERALT : AUCUNE retouche (l'utilisateur garde ses cheveux et sa barbe bruns).

Vérification pour chaque fichier : compare avant/après côte à côte. Il ne doit y avoir aucune autre différence que la couleur des cheveux / de la barbe, et aucune frame décalée, coupée ou redimensionnée. Les imports ne doivent afficher aucun AVERTISSEMENT.
À la fin :
- mets à jour `docs/production/RAPPORT_CODEX.md` (section « Retouches couleur 2026-10-22 ») ;
- lance un `python tools/import_codex_assets.py` final.
```
