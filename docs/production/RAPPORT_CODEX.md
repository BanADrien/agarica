# Rapport de production Codex

## Lot du 22 octobre 2026

Les **58 images sources demandées sont présentes**. Génération avec `image_gen` intégré ; prompts du guide et références dans [generation_2026-10-22.json](generation_2026-10-22.json), reçus des générations dans [generation_2026-10-22_recus.json](generation_2026-10-22_recus.json). Toutes les sources sont copiées dans le projet.

Les huit portraits ont chacun reçu la référence du personnage. Pour Agarica et Xara, absence de `agarica.png` et `xara.png` : utilisation de `agarica_extra.png` et `xara_extra.png`. Le singe corrompu et son icône utilisent bien le singe brun demandé.

Les huit fonds ont été collés chacun à eux-mêmes, avant et après import, puis corrigés. [Montage des raccords finaux](controles/lot_2026-10-22/fonds_contact.jpg). Les trois tilesets ont chacun leurs trois sources et leurs 21 fichiers finaux. Les six planches de décor restent **entières**, dans `assets/decors/déco item/<section>/<section>_planche.png`.

**Production encore à reprendre :** hauteur du loup, échelle de l’attaque de l’araignée, largeur de la créature de mousse, espacement de deux poses du crapaud, et alignement strict au bas des cases des six décors. Ces fichiers existent et s’importent, mais ne sont pas déclarés conformes. Aucun avertissement d’import ne remplace ces contrôles graphiques.

[Validation de tous les assets de ce lot](imports/lot_2026-10-22_validation.log) ; [mesures et montages](controles/lot_2026-10-22/audit.json) ; [décors](controles/lot_2026-10-22/decors_contact.jpg) ; [portraits et icônes](controles/lot_2026-10-22/interface_contact.jpg) ; [effets](controles/lot_2026-10-22/vfx_contact.jpg) ; [tuiles](controles/lot_2026-10-22/tuiles_contact.jpg).

Ordre : singe/transformation ; Agarica p3/p4 ; boss ; Xara ; habitants/animaux ; ennemis ; objets ; interface ; VFX ; fonds ; tuiles ; décors.

Prompts anglais intégraux du guide mis à jour, génération avec image_gen intégré et références locales. Aucune modification manuelle de src/ ou du manifeste. asset_present.js est écrit uniquement par l’importeur demandé.

« À refaire » inclut une production partielle ou une validation encore incomplète. Les décors seront livrés sans découpe.

| Asset | Statut | Détail | Dernier journal |
|---|---|---|---|
| `agarica_extra` | à refaire | p1/p2 sources conservées. p3 validée : 3/4/5 frames, bandes 86/68 px. p4 importée mais trop grande : 329-338 px au lieu de ~250. 37 frames présentes. p2 conservée sur demande malgré une bande de 59 px. | [journal](imports/agarica_extra_force.log) |
| `singe` | fait | 25 frames, six animations ; import ciblé sans avertissement. Contrôle visuel : aucune frame vide ou coupée. Marges mesurées : >=67 px entre rangées, >=71 px horizontalement. Référence du singe brun utilisée. | [journal](imports/singe.log) |
| `fond_foret_sombre` | fait | Bords corrigés ; source et sortie importée collées chacune à elle-même. Contrôle visuel des montages et mesures dans controles/lot_2026-10-22/. Sortie 2079x756. | [journal](imports/lot_2026-10-22_validation.log) |
| `grand_arbre_tronc` (planche décor)` | à refaire | Planche entière enregistrée au chemin demandé, aucune découpe. Deux passes de génération ; bases visuellement rapprochées mais bas des cases régulières pas strictement respecté et certaines silhouettes débordent de leur bande. Repositionnement encore nécessaire. | [journal](controles/lot_2026-10-22/audit.json) |
| `xara_extra` | fait | 12 frames contrôlées visuellement, aucune vide ou coupée. Bandes 73 et 85 px ; écarts horizontaux au moins 66 px. Import sans avertissement. | [journal](imports/xara_extra.log) |
| `pere_chef` | fait | Déclaré terminé par l’utilisateur le 6 octobre ; conservé sans modification. | [dernier import](import_codex_latest.log) |
| `amanite` | fait | Déclaré terminé par l’utilisateur le 6 octobre ; conservé sans modification. | [dernier import](import_codex_latest.log) |
| `geralt` | fait | Déclaré terminé par l’utilisateur le 6 octobre ; conservé sans modification. | [dernier import](import_codex_latest.log) |
| `morgat` | fait | Déclaré terminé par l’utilisateur le 6 octobre ; conservé sans modification. | [dernier import](import_codex_latest.log) |
| `papillon` | à refaire | 4 frames importées sans avertissement, aucune vide/coupée. Écarts >=166 px. Largeur proche de 200 px au lieu de ~150 : réduction encore nécessaire. | [journal](imports/papillon_force.log) |
| `kainati` | à refaire | 27 frames présentes, import sans avertissement et contrôle visuel sans vide/coupe. p2/p3/p4 marges conformes. p1 lancer : écarts de 23 et 8 px insuffisants. Échelle à harmoniser. | [journal](imports/kainati_force.log) |
| `ghilt` | à refaire | 24 frames importées sans avertissement, aucune vide/coupée. Marges conformes : bandes >=79 px, écarts >=40 px. Variation de taille entre planches : harmonisation requise. | [journal](imports/ghilt_force.log) |
| `ghilt_gueri` | à refaire | 6 frames importées sans avertissement, aucune vide/coupée. Bande 186 px, écarts >=53 px. Échelle des poses collapse à harmoniser avec idle. | [journal](imports/ghilt_gueri_force.log) |
| `vfx_soin_papillon` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `pierre` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `idole` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `idole_fragment` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `talisman_ours` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `talisman_singe` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `totem_poche_casse` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `totem_poche_actif` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `bocal_antidote` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `repulsif` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `fleur_resistante` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `carte_geralt` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `lance_amanite` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `mousse_amas_intact` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `mousse_amas_fissure` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `totem_monkey_dim` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `totem_monkey_lit` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `liane` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `mousse_mur` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `dialogue_box` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `portrait_agarica` | fait | Portrait généré avec référence assets/sprites/agarica_extra.png ; visage et palette comparés visuellement ; sortie 512x512. | [journal](imports/lot_2026-10-22_validation.log) |
| `portrait_xara` | fait | Portrait généré avec référence assets/sprites/xara_extra.png ; visage et palette comparés visuellement ; sortie 512x512. | [journal](imports/lot_2026-10-22_validation.log) |
| `portrait_amanite` | fait | Portrait généré avec référence assets/sprites/amanite.png ; visage et palette comparés visuellement ; sortie 512x512. | [journal](imports/lot_2026-10-22_validation.log) |
| `portrait_pere_chef` | fait | Portrait généré avec référence assets/sprites/pere_chef.png ; visage et palette comparés visuellement ; sortie 512x512. | [journal](imports/lot_2026-10-22_validation.log) |
| `portrait_geralt` | fait | Portrait généré avec référence assets/sprites/geralt.png ; visage et palette comparés visuellement ; sortie 512x512. | [journal](imports/lot_2026-10-22_validation.log) |
| `portrait_morgat` | fait | Portrait généré avec référence assets/sprites/morgat.png ; visage et palette comparés visuellement ; sortie 512x512. | [journal](imports/lot_2026-10-22_validation.log) |
| `portrait_kainati` | fait | Portrait généré avec référence assets/sprites/kainati.png ; visage et palette comparés visuellement ; sortie 512x512. | [journal](imports/lot_2026-10-22_validation.log) |
| `portrait_ghilt` | fait | Portrait généré avec référence assets/sprites/ghilt.png ; visage et palette comparés visuellement ; sortie 512x512. | [journal](imports/lot_2026-10-22_validation.log) |
| `fond_trou_sombre` | fait | Bords corrigés ; source et sortie importée collées chacune à elle-même. Contrôle visuel des montages et mesures dans controles/lot_2026-10-22/. Sortie 2079x756. | [journal](imports/lot_2026-10-22_validation.log) |
| `transfo_singe` | à refaire | 4 silhouettes brunes, feuilles attachées, import sans avertissement. Écarts >=76 px. Première pose humaine trop grande : 322 px au lieu de ~250. | [journal](imports/transfo_singe_force.log) |
| `habitant_druide` | fait | 12 frames, import sans avertissement ; contrôle visuel sans frame vide ou coupée. Bandes 84/77 px, écarts horizontaux >=101 px. | [journal](imports/habitant_druide.log) |
| `habitant_porteur` | fait | 9 frames, import sans avertissement ; contrôle visuel sans frame vide ou coupée. Bande 166 px, écarts horizontaux >=51 px. Seaux reliés au joug. | [journal](imports/habitant_porteur.log) |
| `habitant_garde` | fait | 13 frames contrôlées, sans vide ni coupe ; import sans avertissement. Bandes 82/67 px et écarts horizontaux >=59 px. | [journal](imports/habitant_garde.log) |
| `clak` | fait | 12 frames contrôlées sans vide ni coupe ; flèches connectées aux pinces. Bandes >=90 px et intervalles >=49 px. Import sans avertissement. | [journal](imports/clak.log) |
| `kainati_esprit` | fait | 8 frames contrôlées sans vide/coupe. Bande 89 px, écarts >=49 px. Import sans avertissement. | [journal](imports/kainati_esprit_force.log) |
| `loup_sanguinaire` | à refaire | 12 frames, bandes >=120 px et écarts >=76 px. Encore trop bas : 135-162 px selon pose au lieu de ~220 ; correction de hauteur à terminer. | [journal](imports/lot_2026-10-22_validation.log) |
| `araignee` | à refaire | 12 frames, bandes >=100 px et écarts >=67 px. Hauteur 170-197 px en repos/marche, 230 px en cabrage : échelle de l’attaque à harmoniser avec ~170 px. | [journal](imports/lot_2026-10-22_validation.log) |
| `mousse_creature` | à refaire | 13 frames, bandes >=145 px et écarts >=50 px. Hauteur <=173 px, mais largeur maximale 293 px hors padding au lieu de ~220 ; réduire les extensions. | [journal](imports/lot_2026-10-22_validation.log) |
| `crapaud_corrompu` | à refaire | Disposition 4/1/4 conservée ; 5 attaques +4 repos sur canvas 1434x237. Corps ~200 px, bandes >=84 px. Écart de 8 px entre deux poses de la première rangée au lieu de >=40 : à reprendre. | [journal](imports/lot_2026-10-22_validation.log) |
| `singe_corrompu` | fait | 13 frames, singe brun de référence avec mousse toxique et yeux malades. Bandes >=124 px, écarts >=68 px ; hauteur 157-202 px selon pose ; contrôle visuel sans coupe ni frame vide. | [journal](imports/lot_2026-10-22_validation.log) |
| `vfx_souffle_toxique` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `vfx_flaque_mousse` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `vfx_purification` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `vfx_piste_loup` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `vfx_impact_pierre` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `hud_coeur` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `hud_coeur_vide` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `porte_mousse` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `courant_air` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `form_icone_singe` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `skill_icone_ours` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `skill_icone_singe` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `skill_icone_papillon` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `carte_parchemin` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |
| `fond_bosquet` | fait | Bords corrigés ; source et sortie importée collées chacune à elle-même. Contrôle visuel des montages et mesures dans controles/lot_2026-10-22/. Sortie 2079x756. | [journal](imports/lot_2026-10-22_validation.log) |
| `fond_grand_arbre` | fait | Bords corrigés ; source et sortie importée collées chacune à elle-même. Contrôle visuel des montages et mesures dans controles/lot_2026-10-22/. Sortie 2079x756. | [journal](imports/lot_2026-10-22_validation.log) |
| `fond_foret_flottante` | fait | Bords corrigés ; source et sortie importée collées chacune à elle-même. Contrôle visuel des montages et mesures dans controles/lot_2026-10-22/. Sortie 2079x756. | [journal](imports/lot_2026-10-22_validation.log) |
| `fond_foret_corrompue` | fait | Bords corrigés ; source et sortie importée collées chacune à elle-même. Contrôle visuel des montages et mesures dans controles/lot_2026-10-22/. Sortie 2079x756. | [journal](imports/lot_2026-10-22_validation.log) |
| `fond_monde_spirituel` | fait | Bords corrigés ; source et sortie importée collées chacune à elle-même. Contrôle visuel des montages et mesures dans controles/lot_2026-10-22/. Sortie 2079x756. | [journal](imports/lot_2026-10-22_validation.log) |
| `fond_arene_ghilt` | fait | Bords corrigés ; source et sortie importée collées chacune à elle-même. Contrôle visuel des montages et mesures dans controles/lot_2026-10-22/. Sortie 2079x756. | [journal](imports/lot_2026-10-22_validation.log) |
| `tuiles_ecorce` | fait | Trois sources, disposition sol 4x4 + plateformes 1x3 + spéciaux 1x3 vérifiée visuellement ; 21 sorties importées sans avertissement. | [journal](imports/lot_2026-10-22_validation.log) |
| `tuiles_flottantes` | fait | Trois sources, disposition sol 4x4 + plateformes 1x3 + spéciaux 1x3 vérifiée visuellement ; 21 sorties importées sans avertissement. | [journal](imports/lot_2026-10-22_validation.log) |
| `tuiles_corrompues` | fait | Trois sources, disposition sol 4x4 + plateformes 1x3 + spéciaux 1x3 vérifiée visuellement ; 21 sorties importées sans avertissement. | [journal](imports/lot_2026-10-22_validation.log) |
| `bosquet (bâtiments)` | non fait | Pas encore généré. | [dernier import](import_codex_latest.log) |
| `décor foret_sombre` | à refaire | Planche entière enregistrée au chemin demandé, aucune découpe. Deux passes de génération ; bases visuellement rapprochées mais bas des cases régulières pas strictement respecté et certaines silhouettes débordent de leur bande. Repositionnement encore nécessaire. | [journal](controles/lot_2026-10-22/audit.json) |
| `décor grand_arbre` | à refaire | Planche entière enregistrée au chemin demandé, aucune découpe. Deux passes de génération ; bases visuellement rapprochées mais bas des cases régulières pas strictement respecté et certaines silhouettes débordent de leur bande. Repositionnement encore nécessaire. | [journal](controles/lot_2026-10-22/audit.json) |
| `décor foret_flottante` | à refaire | Planche entière enregistrée au chemin demandé, aucune découpe. Deux passes de génération ; bases visuellement rapprochées mais bas des cases régulières pas strictement respecté et certaines silhouettes débordent de leur bande. Repositionnement encore nécessaire. | [journal](controles/lot_2026-10-22/audit.json) |
| `décor foret_corrompue` | à refaire | Planche entière enregistrée au chemin demandé, aucune découpe. Deux passes de génération ; bases visuellement rapprochées mais bas des cases régulières pas strictement respecté et certaines silhouettes débordent de leur bande. Repositionnement encore nécessaire. | [journal](controles/lot_2026-10-22/audit.json) |
| `décor hutte_morgat` | à refaire | Planche entière enregistrée au chemin demandé, aucune découpe. Deux passes de génération ; bases visuellement rapprochées mais bas des cases régulières pas strictement respecté et certaines silhouettes débordent de leur bande. Repositionnement encore nécessaire. | [journal](controles/lot_2026-10-22/audit.json) |
| `cochon_bebe` | fait | 8 frames contrôlées sans vide/coupe ni traits détachés. Bande 254 px, écarts >=132 px. Hauteurs 146-197 px selon pose ; trottinement 171-183 px. Import sans avertissement. | [journal](imports/cochon_bebe_force.log) |
| `poisson` | à refaire | 4 frames importées sans avertissement et sans vide/coupe. Écarts >=67 px. Échelle encore supérieure aux 260x120 px : largeur proche de 310 px, hauteur avec nageoires 170-199 px. | [journal](imports/poisson_force.log) |
| `titre_logo` | fait | Lot du 22 octobre 2026 : source générée avec image_gen intégré, import contrôlé sans avertissement et contrôle visuel de la planche. | [journal](imports/lot_2026-10-22_validation.log) |

## Retouches couleur 2026-10-22

Édition par masques Pillow/NumPy autorisée par l’utilisateur après rejet du test génératif, qui ne conservait pas les dimensions. Les trois sources de Geralt (`geralt.png`, `geralt_p2.png`, `portrait_geralt.png`) ont été recolorées en gris-blanc pour les cheveux, la barbe et les poils des pieds. Les pixels hors masque et l’alpha sont identiques aux originaux ; les 27 frames et le portrait ont été réimportés sans avertissement. Voir [validation Geralt](retouches_couleur_2026-10-22/validation_geralt.json) et les comparaisons dans `retouches_couleur_2026-10-22/comparaisons/`.

Les fichiers d’Agarica avaient déjà reçu de nouvelles retouches externes au 23 octobre : ces versions ont été conservées, sans application des anciennes propositions. Les sources `agarica_extra`, `transfo_singe` et `portrait_agarica` ont été réimportées avec `--force`. Le contrôle final des 50 sources/frames hors ancien logo et des 70 sorties existantes confirme la conservation des dimensions et de l’alpha. La recoloration de l’ancien logo est remplacée par la refonte demandée le 23 octobre. Originaux archivés dans `retouches_couleur_2026-10-22/originaux/`.

## Planches slash et logo — 2026-10-23

Trois sources transparentes de 1536 × 1024 pixels livrées :

- `assets/sprites/agarica_slash.png` : 12 poses, lignes side/up/down de 4 frames. Références : `agarica_extra_row4_0.png` et `assets/ui/portraits/agarica.png`. Cheveux châtain roux, base #A85C34 ; dague solidaire de la main, sans effet. Espacements verticaux de 60 pixels et horizontaux d’au moins 79 pixels. [Aperçu](controles/slash_2026-10-23/agarica_slash_final.jpg).
- `assets/vfx/vfx_slash.png` : 9 arcs, lignes de 3 frames, ouvertures gauche/bas/haut ; cellules avec marges d’au moins 30 pixels, dimensions maximales 300 × 200 puis 220 × 280. [Aperçu](controles/slash_2026-10-23/vfx_slash_final.jpg).
- `assets/_codex_src/titre_logo.png` : nouveau logo sobre, 10 couleurs, grille de 4 pixels, alpha strictement 0/255, sans halo. Ancien logo archivé dans `assets/_codex_src/titre_logo_ancien.png`. [Aperçu](controles/slash_2026-10-23/titre_logo_final.jpg).

Génération par image_gen intégré, puis nettoyage et placement déterministes avec [le script de normalisation](normaliser_slash_logo_2026_10_23.py). [Prompts et références](generation_slash_logo_2026-10-23.json), [mesures](controles/slash_2026-10-23/normalisation.json) et [validation finale](controles/slash_2026-10-23/validation_finale.json). Les imports ciblés ont produit 12 frames de personnage et 9 frames d’effet sans avertissement. Aucun changement manuel de `src/` ni du manifeste ; `asset_present.js` est actualisé par l’importeur.

## Dernière exécution historique du 22 octobre

Commande : `tools/import_codex_assets.py`

```text

================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (78) : agarica_extra, singe, transfo_singe, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, poisson, kainati, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_impact_pierre, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (0) : -

Aucun avertissement.

asset_present.js : 487 fichier(s) présent(s).
```


## Import final du 23 octobre 2026

Commande : `python tools/import_codex_assets.py`

[Journal complet](imports/final_2026-10-23.log).

```text

================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (80) : agarica_extra, agarica_slash, singe, transfo_singe, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, poisson, kainati, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_impact_pierre, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (3) : forme_papillon, transfo_papillon, form_icone_papillon

Aucun avertissement.

asset_present.js : 511 fichier(s) présent(s).

```


## Forme papillon ? 2026-10-23

Trois images g?n?r?es avec image_gen int?gr?, en joignant les r?f?rences demand?es (portrait d?Agarica, papillon lumineux, singe et transformation singe ; m?daillons loup/singe pour l?ic?ne). La forme termin?e sert ?galement de r?f?rence ? la transformation.

- `assets/sprites/forme_papillon.png` : 1536 ? 1024, 12 frames en lignes flap/dash/glide de 4. Battement descendant corrig? lors d?une passe cibl?e. Envergure maximale proche de 220 pixels ; espacements horizontaux ?179 pixels, verticaux 158 et 185 pixels. [Aper?u](controles/papillon_2026-10-23/forme_papillon_final.jpg).
- `assets/sprites/transfo_papillon.png` : 1536 ? 1024, une ligne de 4 ?tapes, humaine vers papillon ; feuilles/p?tales attach?s ? la silhouette. Espacements horizontaux ?182 pixels. [Aper?u](controles/papillon_2026-10-23/transfo_papillon_final.jpg).
- `assets/_codex_src/form_icone_papillon.png` : 1024 ? 1024, m?daillon bois/lierre et papillon sculpt? ? spirales ; sortie import?e `assets/items/form_icone/papillon.png`, 724 ? 724. [Aper?u](controles/papillon_2026-10-23/form_icone_papillon_final.jpg).

Fond transparent, orientation droite et absence de texte contr?l?s visuellement. Une composante connexe par frame v?rifi?e sur l?alpha non nul. Les dessins bruts sont conserv?s dans `controles/papillon_2026-10-23/` ; [script de finition](normaliser_papillon_2026_10_23.py) : retrait des halos et pixels isol?s, redimensionnement uniforme des planches et placement dans les cellules, sans redessin. [Prompts initiaux](controles/papillon_2026-10-23/prompts.json), [mesures](controles/papillon_2026-10-23/normalisation.json), [validation](controles/papillon_2026-10-23/validation.json).

Imports cibl?s : 12 + 4 frames et une ic?ne, sans avertissement. Aucun changement manuel de `src/` ni du manifeste ; seul `asset_present.js` change automatiquement ? l?import.


### Import final du lot papillon

Commande : `python tools/import_codex_assets.py`

[Journal](imports/final_papillon_2026-10-23.log).

```text

================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (83) : agarica_extra, agarica_slash, singe, transfo_singe, forme_papillon, transfo_papillon, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, poisson, kainati, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_impact_pierre, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, form_icone_papillon, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (0) : -

Aucun avertissement.

asset_present.js : 528 fichier(s) présent(s).

```


## Animations au sol de Kainati — 2026-10-23

Six images créées avec image_gen intégré. Les deux références demandées sont jointes à chaque génération : `assets/sprites/kainati.png` et `assets/sprites/kainati_frames/kainati_row0_0.png`. La fiche complète de Kainati figure dans chaque prompt, y compris comme contexte de palette pour les effets et l’objet. [Prompts](controles/kainati_sol_2026-10-23/prompts.json) et [générations, variantes et sélection](controles/kainati_sol_2026-10-23/generation.json).

- `assets/sprites/kainati_sol.png` : 1536 × 1024, charge et roar, 4 + 4 frames ; intervalles horizontaux ≥40 pixels, intervalle entre rangées 67 pixels sur l’alpha non nul. [Aperçu](controles/kainati_sol_2026-10-23/kainati_sol_final.jpg).
- `assets/sprites/kainati_sol_p2.png` : 1536 × 1024, slam et sweep, 4 + 4 frames ; intervalles horizontaux ≥40 pixels, intervalle entre rangées 94 pixels sur l’alpha non nul. Les rochers restent en contact avec les mains aux trois premières poses de sweep ; mains vides à la quatrième. [Aperçu](controles/kainati_sol_2026-10-23/kainati_sol_p2_final.jpg).
- `assets/sprites/kainati_sol_p3.png` : 1536 × 1024, stunned, 4 frames, bases au bas de la toile ; intervalles horizontaux ≥40 pixels sur l’alpha non nul. [Aperçu](controles/kainati_sol_2026-10-23/kainati_sol_p3_final.jpg).
- `assets/vfx/vfx_onde_choc.png` : 1536 × 1024, 4 cellules, étendue maximale 300 × 90 pixels ; terre/écorce brun-beige et crête toxique. [Aperçu](controles/kainati_sol_2026-10-23/vfx_onde_choc_final.jpg).
- `assets/vfx/vfx_vague_mousse.png` : 1536 × 1024, 4 cellules, étendue maximale 300 × 70 pixels. [Aperçu](controles/kainati_sol_2026-10-23/vfx_vague_mousse_final.jpg).
- `assets/_codex_src/rocher_roulant.png` : 1024 × 1024, rocher gris-beige rond, spirale gravée, mousse toxique, emprise carrée 800 × 800 pixels, sans ombre. Sortie importée : `assets/items/objets/rocher_roulant.png`, 256 × 256. [Aperçu](controles/kainati_sol_2026-10-23/rocher_roulant_final.jpg).

Chaque pose du boss a une seule composante connexe, sans effet détaché. Orientation droite, couronne, peinture rouge, fourrure blanche et palette contrôlées visuellement. Les silhouettes ne sont pas déformées : réduction uniforme par planche et placement dans les cellules, avec optimisation des positions horizontales pour conserver au moins 40 pixels de vide. Les deux effets sont posés sur une base commune à y=1020, avec 4 pixels transparents sous la base pour éviter l’alerte de bord de cellule de l’importeur.

**Échelle mesurée :** les poses de charge et de retour sur les phalanges font environ 330–360 pixels utiles, les poses redressées de roar environ 410–445 pixels ; le maximum avec poings levés est de 452 pixels. Le dessin de référence existant a 348 pixels utiles sur les phalanges dans une toile de 388 × 396 pixels. Le rendu conserve ainsi un gabarit proche de cette référence, mais la cible de 400 pixels utiles sur les phalanges n’est pas atteinte strictement. Cette différence reste à reprendre si 400 pixels utiles est impératif.

Les bruts retenus sont archivés ici ; les variantes restent dans le dossier de génération indiqué dans `generation.json`. [Normalisation](controles/kainati_sol_2026-10-23/normalisation.json), [validation](controles/kainati_sol_2026-10-23/validation.json), [mesures détaillées des trois sources](controles/kainati_sol_2026-10-23/../kainati_sol.json), script : `docs/production/normaliser_kainati_sol_2026_10_23.py`.

Import ciblé des trois planches ensemble : 20 frames, canvas uniforme 391 × 459. Effets : 4 + 4 frames. Import de l’objet et imports ciblés finaux sans avertissement. Les premiers avertissements de bord inférieur des effets ont été corrigés en ajoutant la marge transparente. Aucun changement manuel de `src/` ou du manifeste par ce travail ; `asset_present.js` est actualisé automatiquement par l’importeur. Des modifications concurrentes de plusieurs fichiers de jeu ont été observées et laissées intactes.



### Import final du lot Kainati

Commande : `python tools/import_codex_assets.py`

[Journal complet](imports/final_kainati_sol_2026-10-23.log).

```text

================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (87) : agarica_extra, agarica_slash, singe, transfo_singe, forme_papillon, transfo_papillon, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, poisson, kainati, kainati_sol, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_onde_choc, vfx_vague_mousse, vfx_impact_pierre, rocher_roulant, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, form_icone_papillon, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (0) : -

Aucun avertissement.

asset_present.js : 557 fichier(s) présent(s).

```


## Trois cochons unis — 2026-10-23

Trois planches refaites avec image_gen intégré, en prenant l’ancien `cochon_bebe.png` comme référence. Pelages unis rose, gris et orangé, sans les anciennes rayures crème. Chaque planche transparente de 1536 × 1024 contient 4 poses idle et 4 poses walk, toutes tournées à droite. Originaux sauvegardés dans `controles/cochons_tricolores_2026-10-23/originaux/`.

- Rose : `assets/sprites/cochon_bebe_rose.png`, 8 frames dans `assets/sprites/cochon_bebe_rose_frames/`.
- Gris : `assets/sprites/cochon_bebe_gris.png`, 8 frames dans `assets/sprites/cochon_bebe_gris_frames/`.
- Orangé : `assets/sprites/cochon_bebe_orange.png`, 8 frames dans `assets/sprites/cochon_bebe_orange_frames/`.

Les 24 frames ont une toile commune de 228 × 188 pixels et une silhouette connexe chacune. Nettoyage des halos, réduction uniforme et placement par `docs/production/normaliser_cochons_2026_10_23.py`. [Prompts](controles/cochons_tricolores_2026-10-23/prompts.json), [génération](controles/cochons_tricolores_2026-10-23/generation.json), [mesures](controles/cochons_tricolores_2026-10-23/normalisation.json), [validation](controles/cochons_tricolores_2026-10-23/validation.json).

Le rose remplace également la source commune `assets/sprites/cochon_bebe.png` ; ses 8 frames historiques sont réimportées avec `--only cochon_bebe --force`, sans avertissement. Aucun changement manuel de `src/` ni du manifeste, conformément à la consigne conservée. **Raccordement restant côté jeu :** `spawnPiglets` utilise actuellement cette unique source commune pour les trois cochons ; les variantes grise et orangée sont livrées avec leurs frames, mais le code devra sélectionner ces variantes pour les afficher simultanément. L’importeur complet n’inscrit que les fichiers déjà déclarés au manifeste.

Aperçus : [rose](controles/cochons_tricolores_2026-10-23/cochon_bebe_rose_final.jpg), [gris](controles/cochons_tricolores_2026-10-23/cochon_bebe_gris_final.jpg), [orangé](controles/cochons_tricolores_2026-10-23/cochon_bebe_orange_final.jpg).



### Import final du lot cochons

Commande : `python tools/import_codex_assets.py`

```text

================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (87) : agarica_extra, agarica_slash, singe, transfo_singe, forme_papillon, transfo_papillon, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, poisson, kainati, kainati_sol, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_onde_choc, vfx_vague_mousse, vfx_impact_pierre, rocher_roulant, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, form_icone_papillon, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (0) : -

Aucun avertissement.

asset_present.js : 557 fichier(s) présent(s).

```


## Invocation de Clak par Geralt — 2026-10-23

Création via image_gen intégré, puis placement et montage déterministes par `docs/production/preparer_invocation_clak_2026_10_23.py`. Références de Geralt et Clak jointes aux générations ; la nouvelle animation respecte les cheveux/barbe gris-blanc demandés précédemment, malgré les références actuelles brunes. [Prompts](controles/invocation_clak_2026-10-23/prompts.json) et [générations](controles/invocation_clak_2026-10-23/generation.json).

- `assets/sprites/geralt_invocation.png` : planche transparente 1536 × 1024, 8 poses en deux lignes de 4, préparation/ascension puis canalisation/retour. Yeux blancs sans pupilles pendant la transe, pieds relâchés, bras ouverts ; yeux bruns au début et à la fin. Taille debout environ 215 pixels ; frames dans `assets/sprites/geralt_invocation_frames/`, toile uniforme 185 × 249.
- `assets/vfx/vfx_invocation_clak.png` : planche transparente 1536 × 1024, 4 phases de colonne blanche avec Clak se matérialisant en son milieu. Clak conserve carapace rouge-orangé, rune turquoise et grande pince. Maximum 280 × 770 pixels utiles, sans fond opaque ; frames dans `assets/vfx/vfx_invocation_clak_frames/`, toile 288 × 778.
- `assets/cinematiques/invocation_clak_plan_large.png` : plan cinématique opaque 1536 × 1024, forêt lointaine minuscule et immense colonne blanche traversant les nuages lumineux. Le fond est volontairement complet pour cette vue du ciel.
- [Aperçu animé](controles/invocation_clak_2026-10-23/invocation_clak_apercu.gif) : GIF 960 × 540, 8,4 secondes, 10 images/s avant fusion des images identiques. Geralt se soulève, la colonne apparaît, Clak se matérialise, coupe sur le plan large du ciel, retour au pic d’énergie, dissipation, descente de Clak et retour de Geralt au sol. Fond de proximité : bosquet existant. [Storyboard](controles/invocation_clak_2026-10-23/invocation_clak_storyboard.jpg).

8 poses de Geralt avec une silhouette connexe chacune, 4 cellules VFX non coupées, alpha transparent et durée du GIF vérifiés. [Mesures et chronologie](controles/invocation_clak_2026-10-23/normalisation.json), [validation](controles/invocation_clak_2026-10-23/validation.json). Bruts archivés dans le même dossier de contrôle. Les effets sont séparés du personnage ; l’élévation et la descente sont animées dans le montage en conservant l’alignement bas des frames sources.

Aucun changement manuel de `src/` ou du manifeste. Ces nouvelles sources et frames sont livrées avec l’aperçu, mais ne sont pas encore raccordées à une cinématique du jeu ; l’importeur complet ne traite que les entrées déjà déclarées au manifeste.



### Import final apres creation de l invocation

Commande : `python tools/import_codex_assets.py`

```text

================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (87) : agarica_extra, agarica_slash, singe, transfo_singe, forme_papillon, transfo_papillon, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, poisson, kainati, kainati_sol, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_onde_choc, vfx_vague_mousse, vfx_impact_pierre, rocher_roulant, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, form_icone_papillon, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (0) : -

Aucun avertissement.

asset_present.js : 557 fichier(s) présent(s).

```


### Correction des couleurs de Geralt — 2026-10-23

La dernière référence fournie par l’utilisateur remplace la consigne antérieure de poils gris-blanc : cheveux, barbe, moustache et poils des pieds sont désormais **brun-roux**, comme le Geralt actuellement présent dans le jeu. Les yeux blancs sans pupilles pendant l’invocation restent conservés, ainsi que les yeux bruns au début et à la fin.

Planche `assets/sprites/geralt_invocation.png` et 8 frames remplacées après édition par image_gen intégré avec la planche précédente comme cible et le sprite actuel comme référence de couleur. L’ancienne version est archivée dans `controles/invocation_clak_2026-10-23/avant_correction_brun/`. Colonne et Clak conservés. Le montage réutilise le plan large archivé dans `controles/invocation_clak_2026-10-23/invocation_clak_plan_large_generation.png` ; la copie précédemment livrée dans `assets/cinematiques/` n’était plus présente au début de cette correction et n’a pas été recréée.

[Nouvel aperçu animé brun — 8,4 s](controles/invocation_clak_2026-10-23/invocation_clak_apercu_brun.gif), [image de contrôle](controles/invocation_clak_2026-10-23/invocation_clak_pic_brun.png), [prompt et résultat](controles/invocation_clak_2026-10-23/correction_brun.json), [validation des 8 poses et de la durée](controles/invocation_clak_2026-10-23/validation_brun.json). L’aperçu principal a également été remplacé. Aucun changement manuel de `src/` ni du manifeste.



Import final : `python tools/import_codex_assets.py`

```text

================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (87) : agarica_extra, agarica_slash, singe, transfo_singe, forme_papillon, transfo_papillon, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, poisson, kainati, kainati_sol, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_onde_choc, vfx_vague_mousse, vfx_impact_pierre, rocher_roulant, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, form_icone_papillon, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (0) : -

Aucun avertissement.

asset_present.js : 557 fichier(s) présent(s).

```


## Foret suspendue : cimes et ancrage au sol - 2026-10-23

Dans src/utils/LevelKit.js, les grands arbres gardent une parallaxe horizontale de 0.35 et suivent verticalement le monde (facteur Y=1). Pour le fond foret_flottante, leur sol commun est place sous les plateformes, a partir de la hauteur maximale des textures : seules les cimes restent visibles en contrebas. Les plantes generiques de sol et le plafond de lianes sont omis dans ces zones ouvertes ; les decors des plateformes restent presents.

Verification Playwright/Edge : ForetFlottante1Scene (capture controles/foret_suspendue_cimes.png), ForetFlottante2Scene et Zone1Scene ; aucune erreur JavaScript. Sol des arbres mesure a y=1073 en altitude et y=471 au sol, facteur vertical 1 dans les trois scenes. Des avertissements de ressources absentes et textures transfo-wolf sont egalement journalises par le harnais.


### Correction de la repartition des decors - 2026-10-23

Camp de Geralt (ForetFlottante1Scene) : fond foret_sombre et grands arbres normaux, pieds a y=471. Zone suivante (ForetFlottante2Scene) : grands arbres proceduraux totalement retires (largeTrees=false), fond des iles conserve. Reglages appliques apres chargement des brouillons pour fonctionner egalement sur une sauvegarde existante. Les petits arbres poses sur les plateformes restent des decors distincts. Verification Edge/Playwright des deux zones : aucune erreur JavaScript ; 0 grand arbre dans la seconde. Captures : controles/camp_geralt_foret_sombre.png et controles/iles_sans_gros_arbres.png.


### Camp de Geralt : arbres au bas du cadre - 2026-10-23

Fond foret_flottante retabli dans ForetFlottante1Scene. Option treesAtScreenBottom : pieds des grands arbres abaisses de 75 pixels, a y=546 pour une vue de 540 pixels (6 pixels pour absorber la marge du sprite), facteur vertical 0 pour les verrouiller au bas du cadre pendant les mouvements de camera. Les autres zones gardent leur comportement ; largeTrees=false dans la zone suivante reste applique. Verification Edge/Playwright : pieds y=546, scrollFactorY=0, aucune erreur JavaScript. Capture : controles/geralt_arbres_bas_cadre.png.


<!-- LOT8_SUIVI -->
## Lot n°8 — 2026-10-23

Génération via image_gen intégré ; prompts : `controles/lot_8/prompts.json`. Dessins bruts, montages de raccord source/import et journaux : `controles/lot_8/`. Finition mécanique : `lot_8.py` (placement, dimensions, raccords en alpha prémultiplié). Aucun dessin de réutilisation régénéré, aucune retouche des images existantes d’Agarica/Geralt.

| # | Source | Statut | Contrôles / problèmes |
|---|---|---|---|
| 1 | `assets/_codex_src/liquides_mare.png` | importe sans avertissement | Raccords : liquide_mare_fond Δ=0, liquide_mare_voile Δ=0, liquide_mare_surface_0 Δ=0, liquide_mare_surface_1 Δ=0, liquide_mare_surface_2 Δ=0, liquide_mare_surface_3 Δ=0 6 bandes ; surfaces animees derivees par decalages horizontaux de 96 px ; raccords source/import controles. |
| 2 | `assets/_codex_src/liquide_mousse_toxique.png` | importe sans avertissement | Raccords : liquide_mousse_toxique Δ=0 Bande toxique opaque dans son corps ; toile restante transparente. |
| 3 | `assets/_codex_src/couche_ciel_jour.png` | importe sans avertissement | Raccords : couche_ciel_jour Δ=0 Couche opaque ; bas uniforme #2a9ef7 sur 60 px. |
| 4 | `assets/_codex_src/couche_nappes.png` | importe sans avertissement | Raccords : couche_nappe_nuages Δ=0, couche_nappe_brume Δ=0, couche_brume_avant Δ=0 3 bandes ; brume avant opaque dans ses 60 % inferieurs ; alpha doux au-dessus. |
| 5 | `assets/_codex_src/couche_nuages.png` | importe sans avertissement |  6 elements ; nuages et soleil en alpha doux. |
| 6 | `assets/_codex_src/decor_lumineux.png` | importe sans avertissement |  6 objets ; paires eteint/allume et ferme/ouvert normalisees aux memes dimensions. |
| 7 | `assets/_codex_src/structures_ecorce.png` | importe sans avertissement |  6 decors ; largeur des trois etats de plateforme identique. |
| 8 | `assets/_codex_src/structures_larges.png` | importe sans avertissement |  3 objets ; pont normalise a 1440 x 90 px. |
| 9 | `assets/_codex_src/couche_lointains.png` | importe sans avertissement | Raccords : couche_iles_lointaines Δ=0, couche_horizon_malade Δ=0 Regeneration corrective : retrait du tapis continu sous les iles ; alpha et raccords controles. |
| 10 | `assets/_codex_src/mare_plantes.png` | importe sans avertissement |  6 elements ; plante fleurie/bouton de memes dimensions ; petites variations de dessin entre les deux etats. |
| 11 | `assets/_codex_src/bandes_sol.png` | importe sans avertissement | Raccords : decor_tapis_mousse Δ=0 3 bandes ; seul le tapis est tuilable. |
| 12 | `assets/_codex_src/mousses_plaques.png` | importe sans avertissement |  12 elements ; touffes petite/moyenne/grande 145/210/280 px de haut ; base commune. Mousse de tronc avec une mince bordure brune residuelle. |
| 13 | `assets/_codex_src/couche_vignette.png` | importe sans avertissement |  Vignette opaque en niveaux de gris. |
| 14 | `assets/_codex_src/particules_matieres.png` | importe sans avertissement |  12 particules ; suppression des miettes detachees. |
| 15 | `assets/_codex_src/particules_lumieres.png` | importe sans avertissement |  12 effets ; lueurs et ombre sur vrai alpha. |
| 16 | `assets/_codex_src/halos_lumiere.png` | importe sans avertissement |  6 lueurs ; halo regenere puis bords alpha adoucis ; legere texture nuageuse conservee dans le halo doux. |
| 17 | `assets/vfx/vfx_mousse_toxique.png` | importe sans avertissement |  12 frames, 3 rangees de 4 ; import valide. |
| 18 | `assets/vfx/vfx_anneau_choc.png` | importe sans avertissement |  8 frames, 2 rangees de 4 ; import valide ; alpha doux. |
| 19 | `assets/sprites/singe_extra.png` | importe sans avertissement |  8 frames : climb 4 / throw 4 ; silhouettes connexes. Grimpe jusqu a 260 px ; lancers accroupis 138-164 px, echelle commune preservee. |
| 20 | `assets/sprites/forme_papillon_extra.png` | importe sans avertissement |  4 frames cast ; troisieme pose regeneree pour corriger la vue frontale ; toutes dirigees a droite ; silhouettes connexes. |
| 21 | `assets/sprites/singe_gueri.png` | importe sans avertissement |  9 frames : idle 4 / run 5 ; yeux bruns sans emission ; silhouettes connexes. |
| 22 | `assets/_codex_src/petites_creatures.png` | importe sans avertissement |  8 creatures ; petites particules de mousse detachees retirees. |
| 23 | `assets/_codex_src/objets_C.png` | importe sans avertissement |  4 accessoires ; fleche vers la droite ; note a gribouillis illisibles. |
| 24 | `assets/_codex_src/segments_tuilables.png` | importe sans avertissement | Raccords : objet_corde Δ=0, fx_fil_soie Δ=0 2 segments ; montages verticaux avant/apres import ; raccord RGBA exact. |
| 25 | `assets/_codex_src/ui_panneaux.png` | importe sans avertissement |  4 panneaux ; pointe ouverte ; centres libres ; bordures et essais 9-slice mesures ci-dessous. |
| 26 | `assets/_codex_src/ui_hud.png` | importe sans avertissement |  6 elements ; touches et cases sans lettres ; seul symbole typographique : !. |
| 27 | `assets/_codex_src/ui_barres.png` | importe sans avertissement |  4 barres ; remplissages separes ; cadres mesures et essais en etirement horizontal. |

### Bordures mesurées (pixels des sorties, sans agrandissement pour ces cadres)

- `ui_bulle` : gauche 21, droite 21, haut 32, bas 33. Mesure de la bordure centrale ; réserver aussi les ornements des coins pour le 9-slice.
- `ui_invite` : gauche 41, droite 39, haut 34, bas 29. Mesure de la bordure centrale ; réserver aussi les ornements des coins pour le 9-slice.
- `ui_banniere` : gauche 40, droite 46, haut 53, bas 39. Mesure de la bordure centrale ; réserver aussi les ornements des coins pour le 9-slice.
- `ui_energie_cadre` : gauche 75, droite 75, haut 38, bas 30. Mesure de la bordure centrale ; réserver aussi les ornements des coins pour le 9-slice.
- `ui_boss_cadre` : gauche 71, droite 69, haut 25, bas 25. Mesure de la bordure centrale ; réserver aussi les ornements des coins pour le 9-slice.

Lueurs : sorties RGBA à alpha réel ; aucun fond noir de repli utilisé. Mesures détaillées : `controles/lot_8/suivi.json`.
<!-- /LOT8_SUIVI -->

<!-- LOT8_CLOTURE -->

### Cloture et limites du lot 8

Les 27 sources ont ete generees dans l ordre des priorites 1 a 4, puis importees individuellement. Les revisions concernent uniquement ces nouvelles sources. Les 119 entrees livrent 114 images et 5 animations (41 frames). Galerie : [controles/lot_8/index.html](controles/lot_8/index.html).

Les 16 elements tuilables disposent chacun de montages source et sortie : copies cote a cote, ou superposees pour corde/soie. Difference maximale RGBA aux bords apres import : **0**. Les sources font 1536 x 1024, sauf les segments verticaux en 1024 x 1536. Ciel et vignette sont opaques ; les autres toiles conservent leur transparence. Les lueurs sont livrees en alpha doux, **aucune sur fond noir**.

Contraintes de taille contradictoires : les marges de 30 px ont ete preservees. Les elements annonces a 460/470/480 px dans une cellule de 512 px sont limites a 452 px ; ceux de 340 px dans une cellule de 384 px a 324 px ; la mousse de tronc de 320 px dans une rangee de 341 px a 281 px ; la banniere de 720 px a 708 px. Les formes d une meme famille restent dessinees par generation : les dimensions sont normalisees, mais les contours des etats ne sont pas des copies pixel-identiques. Les variations residuelles sont signalees dans les lignes concernees.

#### Mesure des bordures et recommandations 9-slice

Ordre des valeurs : **gauche / droite / haut / bas**, en pixels a l echelle source. La decoupe automatique rogne seulement les marges transparentes (1 a 2 px pour les panneaux), sans redimensionner ces cinq cadres. La bordure visible est mesuree sur les axes centraux, alpha >= 128, jusqu au remplissage interieur (distance RGB < 30). Les valeurs de retrait incluent les marges transparentes dues aux ornements. Les decoupes recommandees sont plus grandes pour proteger les coins ; elles ne sont pas des epaisseurs de trait.

| Cadre | Sortie | Bordure visible G/D/H/B | Retrait au fond G/D/H/B | Decoupes conseillees G/D/H/B |
|---|---|---|---|---|
| `ui_bulle` | 638 x 298 | 18/18/17/17 | 21/21/32/33 | 74/74/60/60 |
| `ui_invite` | 639 x 159 | 40/37/22/21 | 41/39/34/29 | 105/105/70/70 |
| `ui_banniere` | 706 x 164 | 23/30/35/20 | 40/46/53/39 | 115/115/75/75 |
| `ui_energie_cadre` | 1350 x 90 | 69/70/19/19 | 75/75/38/30 | 105/105/38/30 |
| `ui_boss_cadre` | 1398 x 64 | 65/63/16/18 | 71/69/25/25 | 110/110/25/25 |

Preuves d etirement : `controles/lot_8/9slice_*.jpg`. Les barres utilisent surtout les extremites gauche/droite pour le 3-slice ; conserver leur hauteur. Les ouvertures centrales des cadres energie/boss mesurent environ 22/14 px de haut sur l axe central : ajuster la hauteur ou masquer les remplissages a l integration. Aucun code d integration ajoute.

Audit : [audit_final.json](controles/lot_8/audit_final.json), aucune anomalie de dimensions, de raccord ou de connexite des frames des personnages. Empreintes comparees a l etat initial : **aucun asset existant modifie**, donc aucune retouche des images existantes Agarica/Geralt ni des elements a reutiliser. Le manifeste reste intact. Nous avons uniquement laisse l importeur mettre a jour `src/data/asset_present.js`. D autres modifications de `src/` sont apparues en parallele pendant la session ; elles sont listees dans l audit et n ont pas ete modifiees ni annulees par ce travail.

#### Import complet final

Commande : `python tools/import_codex_assets.py`. Journal : [final_lot_8_2026-10-23.log](imports/final_lot_8_2026-10-23.log).

```text
================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (212) : agarica_extra, agarica_slash, singe, transfo_singe, geralt_invocation, forme_papillon, transfo_papillon, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, cochon_bebe_rose, cochon_bebe_gris, cochon_bebe_orange, poisson, kainati, kainati_sol, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_onde_choc, vfx_vague_mousse, vfx_invocation_clak, vfx_impact_pierre, singe_extra, forme_papillon_extra, singe_gueri, vfx_mousse_toxique, vfx_anneau_choc, rocher_roulant, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, form_icone_papillon, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, liquide_mare_fond, liquide_mare_voile, liquide_mare_surface_0, liquide_mare_surface_1, liquide_mare_surface_2, liquide_mare_surface_3, liquide_mousse_toxique, couche_ciel_jour, couche_nappe_nuages, couche_nappe_brume, couche_brume_avant, couche_nuage_0, couche_nuage_1, couche_nuage_2, couche_nuage_3, couche_nuage_4, couche_soleil, decor_lanterne_eteinte, decor_lanterne_allumee, decor_fente_fermee, decor_fente_ouverte, decor_spirale_gravee, decor_plateforme_fantome, decor_plateforme_ecorce_intacte, decor_plateforme_ecorce_fissuree, decor_plateforme_ecorce_brisee, decor_rampe_lancement, decor_marches_racines, decor_autel_sommet, decor_pont_tronc, decor_cratere, decor_trou_effondre, couche_iles_lointaines, couche_horizon_malade, decor_mare_berge, decor_mare_roseaux, decor_fleur_perchee, decor_plante_resistante_fleurie, decor_plante_resistante_bouton, objet_graine_coeur, decor_tapis_mousse, decor_cercle_sain, decor_mousse_sechee, decor_mousse_plaque_intacte, decor_mousse_plaque_grattee, decor_mousse_plaque_repoussee, decor_mousse_lumineuse_sol, decor_mousse_lumineuse_tronc, decor_mousse_lumineuse_plafond, decor_mousse_lumineuse_petite, decor_touffe_mousse_petite, decor_touffe_mousse_moyenne, decor_touffe_mousse_grande, decor_touffe_mousse_penchee, decor_empreinte_boue, couche_vignette, fx_eclat_mousse, fx_motte_mousse, fx_motte_terre, fx_eclat_ecorce, fx_eclat_pierre, fx_feuille, fx_petale_rose, fx_petale_blanc, fx_goutte_toxique, fx_goutte_antidote, fx_bulle, fx_eclaboussure_toxique, fx_luciole, fx_grain_lumiere, fx_etincelle, fx_etincelle_papillon, fx_trainee_papillon, fx_trait_vent, fx_ombre_sol, fx_marqueur_danger, fx_spore_toxique, fx_bouffee_poussiere, fx_bouffee_toxique, fx_braise, fx_halo_doux, fx_halo_rayons, fx_rai_lumiere, fx_halo_objet, fx_aura_esprit, fx_lueur_sol, araignee_petite_0, araignee_petite_1, araignee_petite_2, bete_mousse_vivante, bete_mousse_touchee, bete_mousse_morte, mousse_creature_guerie_0, mousse_creature_guerie_1, note_geralt, objet_grappin, objet_fleche, objet_collet, objet_corde, fx_fil_soie, ui_bulle, ui_bulle_pointe, ui_invite, ui_banniere, ui_touche, ui_alerte, ui_etoiles_etourdi, ui_case_competence, ui_anneau_objet, ui_ornement_titre, ui_energie_cadre, ui_energie_remplissage, ui_boss_cadre, ui_boss_remplissage, ui_feu_camp, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (0) : -

Aucun avertissement.

asset_present.js : 749 fichier(s) présent(s).
```


<!-- RETOUCHES_POISON_2026 -->
## Retouches poison — 2026-10-23

Redessins via imagegen : palette verte courte, aplats mats, contours noirs et pixels lisibles. Sauvegardes, générations, comparaisons et imports : `controles/retouches_poison_2026-10-23/`. Les cellules sans poison des planches mixtes sont conservées à l identique ; seuls les identifiants concernés sont réimportés.

| Source | État | Contrôle |
|---|---|---|
| `assets/_codex_src/liquide_mousse_toxique.png` | Import sans avertissement | liquide_mousse_toxique : raccord RGBA Δ=0 |
| `assets/_codex_src/bandes_sol.png` | Import sans avertissement | decor_tapis_mousse : raccord RGBA Δ=0 |
| `assets/_codex_src/mousses_plaques.png` | Import sans avertissement |  |
| `assets/_codex_src/particules_matieres.png` | Import sans avertissement |  |
| `assets/_codex_src/particules_lumieres.png` | Import sans avertissement |  |
| `assets/vfx/vfx_mousse_toxique.png` | Import sans avertissement |  |
| `assets/_codex_src/petites_creatures.png` | Import sans avertissement |  |
| `assets/_codex_src/couche_lointains.png` | Import sans avertissement | couche_horizon_malade : raccord RGBA Δ=0 |
| `assets/vfx/vfx_souffle_toxique.png` | Import sans avertissement |  |
| `assets/vfx/vfx_flaque_mousse.png` | Import sans avertissement |  |
| `assets/vfx/vfx_vague_mousse.png` | Import sans avertissement |  |
| `assets/_codex_src/mousse_amas.png` | Import sans avertissement |  |
| `assets/_codex_src/mousse_mur.png` | Import sans avertissement |  |
| `assets/_codex_src/porte_mousse.png` | Import sans avertissement |  |

Galerie : [avant / après](controles/retouches_poison_2026-10-23/index.html).
<!-- /RETOUCHES_POISON_2026 -->

### Contrôles finaux des retouches poison

14 sources redessinées : 28 images fixes et 4 animations totalisant 30 frames. Les 3 raccords tuilables ont une différence RGBA nulle après import. Les cellules hors poison sont pixel-identiques aux sauvegardes. Les dimensions de toile et les nombres de frames sont conservés. Les dessins sont issus d imagegen ; les scripts assurent uniquement découpe, placement, dimensions et raccords. Le haut d une touffe et les gouttières du souffle ont été repositionnés pour éviter une coupe des dessins. La vague est normalisée à 300 x 70 px par frame.

Sauvegardes : `controles/retouches_poison_2026-10-23/avant/`. Audit : [audit_final.json](controles/retouches_poison_2026-10-23/audit_final.json). Aucun changement des images existantes Agarica/Geralt ni des assets hors du périmètre. Aucun code du jeu ni manifeste édité par ce travail. Des modifications parallèles de `src/` sont recensées dans l audit ; elles ont été préservées.

Import complet : `python tools/import_codex_assets.py`. [Journal complet](imports/final_retouches_poison_2026-10-23.log).

```text
================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (212) : agarica_extra, agarica_slash, singe, transfo_singe, geralt_invocation, forme_papillon, transfo_papillon, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, cochon_bebe_rose, cochon_bebe_gris, cochon_bebe_orange, poisson, kainati, kainati_sol, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_onde_choc, vfx_vague_mousse, vfx_invocation_clak, vfx_impact_pierre, singe_extra, forme_papillon_extra, singe_gueri, vfx_mousse_toxique, vfx_anneau_choc, rocher_roulant, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, form_icone_papillon, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, liquide_mare_fond, liquide_mare_voile, liquide_mare_surface_0, liquide_mare_surface_1, liquide_mare_surface_2, liquide_mare_surface_3, liquide_mousse_toxique, couche_ciel_jour, couche_nappe_nuages, couche_nappe_brume, couche_brume_avant, couche_nuage_0, couche_nuage_1, couche_nuage_2, couche_nuage_3, couche_nuage_4, couche_soleil, decor_lanterne_eteinte, decor_lanterne_allumee, decor_fente_fermee, decor_fente_ouverte, decor_spirale_gravee, decor_plateforme_fantome, decor_plateforme_ecorce_intacte, decor_plateforme_ecorce_fissuree, decor_plateforme_ecorce_brisee, decor_rampe_lancement, decor_marches_racines, decor_autel_sommet, decor_pont_tronc, decor_cratere, decor_trou_effondre, couche_iles_lointaines, couche_horizon_malade, decor_mare_berge, decor_mare_roseaux, decor_fleur_perchee, decor_plante_resistante_fleurie, decor_plante_resistante_bouton, objet_graine_coeur, decor_tapis_mousse, decor_cercle_sain, decor_mousse_sechee, decor_mousse_plaque_intacte, decor_mousse_plaque_grattee, decor_mousse_plaque_repoussee, decor_mousse_lumineuse_sol, decor_mousse_lumineuse_tronc, decor_mousse_lumineuse_plafond, decor_mousse_lumineuse_petite, decor_touffe_mousse_petite, decor_touffe_mousse_moyenne, decor_touffe_mousse_grande, decor_touffe_mousse_penchee, decor_empreinte_boue, couche_vignette, fx_eclat_mousse, fx_motte_mousse, fx_motte_terre, fx_eclat_ecorce, fx_eclat_pierre, fx_feuille, fx_petale_rose, fx_petale_blanc, fx_goutte_toxique, fx_goutte_antidote, fx_bulle, fx_eclaboussure_toxique, fx_luciole, fx_grain_lumiere, fx_etincelle, fx_etincelle_papillon, fx_trainee_papillon, fx_trait_vent, fx_ombre_sol, fx_marqueur_danger, fx_spore_toxique, fx_bouffee_poussiere, fx_bouffee_toxique, fx_braise, fx_halo_doux, fx_halo_rayons, fx_rai_lumiere, fx_halo_objet, fx_aura_esprit, fx_lueur_sol, araignee_petite_0, araignee_petite_1, araignee_petite_2, bete_mousse_vivante, bete_mousse_touchee, bete_mousse_morte, mousse_creature_guerie_0, mousse_creature_guerie_1, note_geralt, objet_grappin, objet_fleche, objet_collet, objet_corde, fx_fil_soie, ui_bulle, ui_bulle_pointe, ui_invite, ui_banniere, ui_touche, ui_alerte, ui_etoiles_etourdi, ui_case_competence, ui_anneau_objet, ui_ornement_titre, ui_energie_cadre, ui_energie_remplissage, ui_boss_cadre, ui_boss_remplissage, ui_feu_camp, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (0) : -

Aucun avertissement.

asset_present.js : 749 fichier(s) présent(s).
```


<!-- LOT10 -->
## Lot n°10 — Papillon lunaire — 2026-10-26

Trois feuilles remplacées via imagegen, anciennes sources archivées dans `controles/lot_10/avant/`. Le papillon est un insecte violet nuit à nervures vert lunaire et spirales roses, sans visage humain. Contrôles : [galerie avant / après](controles/lot_10/index.html), `controles/lot_10/suivi.json`, générations et imports unitaires.

| Image | État | Frames | Envergure / dimensions visibles en px source |
|---|---|---|---|
| `forme_papillon.png` | importe sans avertissement | 12 | 215×200, 200×165, 203×140, 200×187, 203×120, 180×141, 194×126, 178×135, 220×153, 188×149, 226×154, 201×130 |
| `transfo_papillon.png` | importe sans avertissement | 4 | 250×232, 213×235, 220×204, 220×153 |
| `forme_papillon_extra.png` | importe sans avertissement | 4 | 164×200, 176×191, 234×163, 168×180 |

Mesures : largeur × hauteur de la silhouette alpha visible ; en profil, les ailes se chevauchent et la largeur varie avec le battement. Les antennes et longues queues sont incluses. La pose finale de transformation est une copie pixel-identique de `glide` frame 1. Les trois toiles font 1536 × 1024, poses centrées, une composante connexe par frame. Finition mécanique uniquement : nettoyage des pixels détachés, mise à l échelle, centrage ; aucun dessin généré par code.
<!-- /LOT10 -->

### Contrôles finaux du lot n°10

20 frames découpées : `flap` 4, `dash` 4, `glide` 4 ; `transform` 4 ; `cast` 4. Vérification des marges, du centrage, de la transparence et de la connexité : aucun élément vide ou coupé. Les trois archives sont identiques aux sources avant remplacement (SHA-256). Seuls les trois PNG et leurs 20 frames ont changé parmi les assets existants. Le manifeste reste intact ; aucune édition manuelle de `src/`. Audit : `controles/lot_10/audit_final.json`.

La largeur de la pose `glide` 1 est de 220 px source (hauteur 153 px, antennes et queues incluses). Les amplitudes des ailes varient avec les poses ; les dimensions de chaque frame sont mesurées dans le tableau et le suivi. La transformation finale est pixel-identique à cette pose. Comparaison visuelle : couleurs et design communs, papillon insecte sans tête humaine dans les formes achevées ; visage humain seulement dans les deux premiers stades de transformation. Incantation à lumière tenue par les pattes. Aucun test de compétence en jeu effectué dans cette livraison ; contrôles des feuilles et des frames importées.

Import complet final : `python tools/import_codex_assets.py`. [Journal complet](imports/final_lot_10_2026-10-26.log).

```text
================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (212) : agarica_extra, agarica_slash, singe, transfo_singe, geralt_invocation, forme_papillon, transfo_papillon, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, cochon_bebe_rose, cochon_bebe_gris, cochon_bebe_orange, poisson, kainati, kainati_sol, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_onde_choc, vfx_vague_mousse, vfx_invocation_clak, vfx_impact_pierre, singe_extra, forme_papillon_extra, singe_gueri, vfx_mousse_toxique, vfx_anneau_choc, rocher_roulant, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, form_icone_papillon, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, liquide_mare_fond, liquide_mare_voile, liquide_mare_surface_0, liquide_mare_surface_1, liquide_mare_surface_2, liquide_mare_surface_3, liquide_mousse_toxique, couche_ciel_jour, couche_nappe_nuages, couche_nappe_brume, couche_brume_avant, couche_nuage_0, couche_nuage_1, couche_nuage_2, couche_nuage_3, couche_nuage_4, couche_soleil, decor_lanterne_eteinte, decor_lanterne_allumee, decor_fente_fermee, decor_fente_ouverte, decor_spirale_gravee, decor_plateforme_fantome, decor_plateforme_ecorce_intacte, decor_plateforme_ecorce_fissuree, decor_plateforme_ecorce_brisee, decor_rampe_lancement, decor_marches_racines, decor_autel_sommet, decor_pont_tronc, decor_cratere, decor_trou_effondre, couche_iles_lointaines, couche_horizon_malade, decor_mare_berge, decor_mare_roseaux, decor_fleur_perchee, decor_plante_resistante_fleurie, decor_plante_resistante_bouton, objet_graine_coeur, decor_tapis_mousse, decor_cercle_sain, decor_mousse_sechee, decor_mousse_plaque_intacte, decor_mousse_plaque_grattee, decor_mousse_plaque_repoussee, decor_mousse_lumineuse_sol, decor_mousse_lumineuse_tronc, decor_mousse_lumineuse_plafond, decor_mousse_lumineuse_petite, decor_touffe_mousse_petite, decor_touffe_mousse_moyenne, decor_touffe_mousse_grande, decor_touffe_mousse_penchee, decor_empreinte_boue, couche_vignette, fx_eclat_mousse, fx_motte_mousse, fx_motte_terre, fx_eclat_ecorce, fx_eclat_pierre, fx_feuille, fx_petale_rose, fx_petale_blanc, fx_goutte_toxique, fx_goutte_antidote, fx_bulle, fx_eclaboussure_toxique, fx_luciole, fx_grain_lumiere, fx_etincelle, fx_etincelle_papillon, fx_trainee_papillon, fx_trait_vent, fx_ombre_sol, fx_marqueur_danger, fx_spore_toxique, fx_bouffee_poussiere, fx_bouffee_toxique, fx_braise, fx_halo_doux, fx_halo_rayons, fx_rai_lumiere, fx_halo_objet, fx_aura_esprit, fx_lueur_sol, araignee_petite_0, araignee_petite_1, araignee_petite_2, bete_mousse_vivante, bete_mousse_touchee, bete_mousse_morte, mousse_creature_guerie_0, mousse_creature_guerie_1, note_geralt, objet_grappin, objet_fleche, objet_collet, objet_corde, fx_fil_soie, ui_bulle, ui_bulle_pointe, ui_invite, ui_banniere, ui_touche, ui_alerte, ui_etoiles_etourdi, ui_case_competence, ui_anneau_objet, ui_ornement_titre, ui_energie_cadre, ui_energie_remplissage, ui_boss_cadre, ui_boss_remplissage, ui_feu_camp, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (3) : geralt_combat, kainati_calme, kainati_esprit_extra

Aucun avertissement.

asset_present.js : 749 fichier(s) présent(s).
```


<!-- LOT11 -->
## Lot n°11 — 2026-11-04

Dessins via imagegen ; finition mécanique dans `lot_11.py`, sans modification de l importeur, de `src/` ni du manifeste. Générations, imports et contrôles : [galerie du lot 11](controles/lot_11/index.html), `controles/lot_11/suivi.json`.

| # | Source | État | Contrôles |
|---|---|---|---|
| 1 | `assets/vfx/vfx_croc.png` | importe sans avertissement | 5 frames |
| 2 | `assets/_codex_src/branches_milieu_fourche.png` | importe sans avertissement | branche_milieu: [1536, 512] marche=256.0 dessous=481.0; branche_fourche: [1024, 512] marche=256.0 dessous=481.0 |
| 3 | `assets/_codex_src/branches_base_bout.png` | importe sans avertissement | branche_base: [640, 512] marche=256.0 dessous=477.0; branche_bout: [448, 512] marche=256.0 dessous=479.0 |
| 4 | `assets/_codex_src/tronc_segment.png` | importe sans avertissement | tronc_segment: [793, 1536] marche=— dessous=— |
| 5 | `assets/_codex_src/tronc_base.png` | importe sans avertissement | tronc_base: [1400, 1024] marche=— dessous=— |
| 6 | `assets/sprites/agarica_repos.png` | importe sans avertissement | 8 frames |

<!-- /LOT11 -->

### Contrôles définitifs du lot n°11

6 sources et 8 entrées livrées, dans l ordre demandé : crocs, milieu/fourche, base/bout, segment de tronc, pied, Agarica au repos. Le travail des branches a commencé par le milieu ; sa matière sert aux autres pièces. Les extrémités ont été générées séparément puis assemblées, comme autorisé. Les versions non retenues et les prompts sont conservés dans les contrôles. Aucune image existante régénérée ou retouchée.

Dimensions ci-dessous mesurées **sur les fichiers après import**. Les 4 branches conservent bien leur case verticale de 512 px, sans rognage vertical ni changement d échelle par l importeur. Ligne de marche : première rangée alpha > 128, médiane sur la partie marchable ; bras haut exclu pour la fourche. Dessous : dernière rangée alpha > 128 sur cette même partie.

| Pièce | Dimensions finales | Marche médiane | Dessous médian |
|---|---|---:|---:|
| `branche_milieu` | 1536 × 512 | 256 | 481 |
| `branche_fourche` | 1024 × 512 | 256 | 481 |
| `branche_base` | 640 × 512 | 256 | 477 |
| `branche_bout` | 448 × 512 | 256 | 479 |

`tronc_segment` : 793 × 1536, corps médian proche de 768 px, contours latéraux irréguliers inclus dans la largeur finale. `tronc_base` : 1400 × 1024 ; **axe mesuré x=698.5**, centre de l image x=700, donc écart −1,5 px. Déséquilibre gauche/droite des étendues des racines : 3.0 px (tolérance 8). Fond des racines alpha > 128 : rangée 958, pour la ligne de sol nominale 960.

Montages livrés : [raccord_branche_milieu.png](controles/lot_11/raccord_branche_milieu.png), [raccord_tronc_segment.png](controles/lot_11/raccord_tronc_segment.png), [assemblage_branche.png](controles/lot_11/assemblage_branche.png), [assemblage_tronc.png](controles/lot_11/assemblage_tronc.png). **Δ RGBA maximal = 0** sur les deux répétitions, les 4 jonctions de branches et la jonction segment/pied. Finition par couture et mélange des seuls pixels générés aux raccords ; aucun dessin produit par code.

Le montage des branches comporte 128 px de marge haute pour montrer entièrement Agarica à 344 px de haut : les branches commencent donc à y=128 et la ligne rouge de marche locale 256 apparaît à y=384 dans le montage. Ses pieds reposent sur cette ligne. Le montage du tronc contient 2 segments, le pied centré, et les deux bases de branche symétriques avec 256 px de recouvrement.

`vfx_croc` : **5 frames** `bite`, toutes centrées sur le même point et à distance des bords des cases ; fermeture/interverrouillage à la troisième frame, rebond puis disparition. Lueur sur **vrai alpha doux**, aucune livraison sur fond noir. Opacité maximale des frames : 60 %, 100 %, 100 %, 75 %, 35 %.

`agarica_repos` : **4 sit + 4 sit_idle**, toutes connexes. Debout 250 px ; repos 179, 182, 184, 181 px de haut ; largeur 175 px pour les 4 poses. Sit frame 4 identique pixel pour pixel à sit_idle frame 1 ; bas de l image sur 90 px identique et mêmes bords gauche/droite. Boucle de contrôle : [agarica_sit_idle_controle.gif](controles/lot_11/agarica_sit_idle_controle.gif). La pose est plus compacte en largeur que les ~220 px indicatifs du prompt : 175 px mesurés ; priorité conservée à l échelle du personnage et au rapport de hauteur assis/debout (~72 %).

Audit détaillé : [audit_final.json](controles/lot_11/audit_final.json). Empreintes des assets déjà existants : inchangées. Manifeste et `tools/import_codex_assets.py` inchangés. Aucune édition de code du jeu par ce travail ; `asset_present.js` est mis à jour uniquement par l importeur. Les autres modifications de `src/` observées en parallèle sont listées dans l audit et préservées. Vérifications graphiques et d import effectuées ; aucun branchement ou test de scène en jeu ajouté.

Import complet final : `python tools/import_codex_assets.py`. [Journal complet](imports/final_lot_11_2026-11-04.log).

```text
================ RAPPORT ================
Découpés maintenant (0) : -
Déjà présents (220) : agarica_extra, agarica_slash, agarica_repos, singe, transfo_singe, geralt_invocation, forme_papillon, transfo_papillon, xara_extra, pere_chef, amanite, habitant_druide, habitant_porteur, habitant_garde, geralt, clak, morgat, papillon, cochon_bebe, cochon_bebe_rose, cochon_bebe_gris, cochon_bebe_orange, poisson, kainati, kainati_sol, kainati_esprit, ghilt, ghilt_gueri, loup_sanguinaire, araignee, mousse_creature, crapaud_corrompu, singe_corrompu, vfx_soin_papillon, vfx_slash, vfx_croc, vfx_souffle_toxique, vfx_flaque_mousse, vfx_purification, vfx_piste_loup, vfx_onde_choc, vfx_vague_mousse, vfx_invocation_clak, vfx_impact_pierre, singe_extra, forme_papillon_extra, singe_gueri, vfx_mousse_toxique, vfx_anneau_choc, rocher_roulant, pierre, idole, idole_fragment, talisman_ours, talisman_singe, totem_poche_casse, totem_poche_actif, bocal_antidote, repulsif, fleur_resistante, carte_geralt, lance_amanite, mousse_amas_intact, mousse_amas_fissure, hud_coeur, hud_coeur_vide, totem_monkey_dim, totem_monkey_lit, liane, mousse_mur, porte_mousse, courant_air, form_icone_singe, form_icone_papillon, skill_icone_ours, skill_icone_singe, skill_icone_papillon, dialogue_box, titre_logo, carte_parchemin, portrait_agarica, portrait_xara, portrait_amanite, portrait_pere_chef, portrait_geralt, portrait_morgat, portrait_kainati, portrait_ghilt, fond_bosquet, fond_foret_sombre, fond_grand_arbre, fond_foret_flottante, fond_foret_corrompue, fond_monde_spirituel, fond_trou_sombre, fond_arene_ghilt, liquide_mare_fond, liquide_mare_voile, liquide_mare_surface_0, liquide_mare_surface_1, liquide_mare_surface_2, liquide_mare_surface_3, liquide_mousse_toxique, couche_ciel_jour, couche_nappe_nuages, couche_nappe_brume, couche_brume_avant, couche_nuage_0, couche_nuage_1, couche_nuage_2, couche_nuage_3, couche_nuage_4, couche_soleil, decor_lanterne_eteinte, decor_lanterne_allumee, decor_fente_fermee, decor_fente_ouverte, decor_spirale_gravee, decor_plateforme_fantome, decor_plateforme_ecorce_intacte, decor_plateforme_ecorce_fissuree, decor_plateforme_ecorce_brisee, decor_rampe_lancement, decor_marches_racines, decor_autel_sommet, decor_pont_tronc, decor_cratere, decor_trou_effondre, couche_iles_lointaines, couche_horizon_malade, decor_mare_berge, decor_mare_roseaux, decor_fleur_perchee, decor_plante_resistante_fleurie, decor_plante_resistante_bouton, objet_graine_coeur, decor_tapis_mousse, decor_cercle_sain, decor_mousse_sechee, decor_mousse_plaque_intacte, decor_mousse_plaque_grattee, decor_mousse_plaque_repoussee, decor_mousse_lumineuse_sol, decor_mousse_lumineuse_tronc, decor_mousse_lumineuse_plafond, decor_mousse_lumineuse_petite, decor_touffe_mousse_petite, decor_touffe_mousse_moyenne, decor_touffe_mousse_grande, decor_touffe_mousse_penchee, decor_empreinte_boue, couche_vignette, fx_eclat_mousse, fx_motte_mousse, fx_motte_terre, fx_eclat_ecorce, fx_eclat_pierre, fx_feuille, fx_petale_rose, fx_petale_blanc, fx_goutte_toxique, fx_goutte_antidote, fx_bulle, fx_eclaboussure_toxique, fx_luciole, fx_grain_lumiere, fx_etincelle, fx_etincelle_papillon, fx_trainee_papillon, fx_trait_vent, fx_ombre_sol, fx_marqueur_danger, fx_spore_toxique, fx_bouffee_poussiere, fx_bouffee_toxique, fx_braise, fx_halo_doux, fx_halo_rayons, fx_rai_lumiere, fx_halo_objet, fx_aura_esprit, fx_lueur_sol, araignee_petite_0, araignee_petite_1, araignee_petite_2, bete_mousse_vivante, bete_mousse_touchee, bete_mousse_morte, mousse_creature_guerie_0, mousse_creature_guerie_1, note_geralt, objet_grappin, objet_fleche, objet_collet, objet_corde, fx_fil_soie, ui_bulle, ui_bulle_pointe, ui_invite, ui_banniere, ui_touche, ui_alerte, ui_etoiles_etourdi, ui_case_competence, ui_anneau_objet, ui_ornement_titre, ui_energie_cadre, ui_energie_remplissage, ui_boss_cadre, ui_boss_remplissage, ui_feu_camp, branche_milieu, branche_fourche, branche_base, branche_bout, tronc_segment, tronc_base, tuiles_ecorce, tuiles_flottantes, tuiles_corrompues
Source manquante (à générer) (3) : geralt_combat, kainati_calme, kainati_esprit_extra

Aucun avertissement.

asset_present.js : 768 fichier(s) présent(s).
```
