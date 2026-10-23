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
