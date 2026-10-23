## Trois cochons unis — 2026-10-23

Trois planches refaites avec image_gen intégré, en prenant l’ancien `cochon_bebe.png` comme référence. Pelages unis rose, gris et orangé, sans les anciennes rayures crème. Chaque planche transparente de 1536 × 1024 contient 4 poses idle et 4 poses walk, toutes tournées à droite. Originaux sauvegardés dans `controles/cochons_tricolores_2026-10-23/originaux/`.

- Rose : `assets/sprites/cochon_bebe_rose.png`, 8 frames dans `assets/sprites/cochon_bebe_rose_frames/`.
- Gris : `assets/sprites/cochon_bebe_gris.png`, 8 frames dans `assets/sprites/cochon_bebe_gris_frames/`.
- Orangé : `assets/sprites/cochon_bebe_orange.png`, 8 frames dans `assets/sprites/cochon_bebe_orange_frames/`.

Les 24 frames ont une toile commune de 228 × 188 pixels et une silhouette connexe chacune. Nettoyage des halos, réduction uniforme et placement par `docs/production/normaliser_cochons_2026_10_23.py`. [Prompts](controles/cochons_tricolores_2026-10-23/prompts.json), [génération](controles/cochons_tricolores_2026-10-23/generation.json), [mesures](controles/cochons_tricolores_2026-10-23/normalisation.json), [validation](controles/cochons_tricolores_2026-10-23/validation.json).

Le rose remplace également la source commune `assets/sprites/cochon_bebe.png` ; ses 8 frames historiques sont réimportées avec `--only cochon_bebe --force`, sans avertissement. Aucun changement manuel de `src/` ni du manifeste, conformément à la consigne conservée. **Raccordement restant côté jeu :** `spawnPiglets` utilise actuellement cette unique source commune pour les trois cochons ; les variantes grise et orangée sont livrées avec leurs frames, mais le code devra sélectionner ces variantes pour les afficher simultanément. L’importeur complet n’inscrit que les fichiers déjà déclarés au manifeste.

Aperçus : [rose](controles/cochons_tricolores_2026-10-23/cochon_bebe_rose_final.jpg), [gris](controles/cochons_tricolores_2026-10-23/cochon_bebe_gris_final.jpg), [orangé](controles/cochons_tricolores_2026-10-23/cochon_bebe_orange_final.jpg).
