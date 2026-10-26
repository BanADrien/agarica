# Éléments dessinés par code à remplacer par des images (inventaire du 2026-10-23, mis à jour le 2026-10-25)

**Mise à jour du 2026-10-25 : le lot Codex n°8 est intégré** (`PLAN_INTEGRATION_LOT_8.md`). Presque tous les dessins de cet inventaire sont remplacés par une image ; le dessin par code reste dans le code comme **repli** (affiché seulement si l'image manque). La liste de ce qui reste dessiné par code est en section 7.

Statuts :
- **IMAGE** : remplacé par l'image indiquée (lot n°8 sauf mention). Le dessin par code ne sert plus que de repli.
- **TOUJOURS** : encore dessiné par code même quand les images existent (voulu ou à faire).
- **REPLI** : dessiné seulement si l'image du manifest manque (déjà le cas avant le lot n°8).
- **RETIRÉ** : l'élément n'existe plus en jeu.
- **TEST** : utilisé seulement par les anciennes zones de test.

Les numéros de ligne sont ceux du 2026-10-23 (indicatifs : le code a bougé) ; se fier au nom de la fonction.

Script de zone → zone :

| Script | Zone |
|---|---|
| `acte2_ff1` | foret_flottante_1 |
| `acte2_ff2` | foret_flottante_2 |
| `acte2_clairiere` | clairiere_plante |
| `acte2_hutte` | hutte_morgat |
| `acte2_fc1` | foret_corrompue_1 |
| `acte2_bosquet_retour` | bosquet_retour |
| `kainati_arene` | grand_arbre_arene |
| `ghilt_arene` | arene_ghilt |

## 1. Eau et liquides
| # | Fichier:ligne (fonction) | Élément | Zone | État au 2026-10-25 |
|---|---|---|---|---|
| W1 | story/acte1.js:807-821 (acte1Fs2DrawMare) | Mare préservée : eau arrière + eau avant translucide, berges, roseaux | foret_sombre_2 | **IMAGE** : `liquide_mare_fond`, `liquide_mare_voile`, `liquide_mare_surface_0..3` (8 i/s), `decor_mare_berge`, `decor_mare_roseaux` |
| W2 | story/acte1_arbre.js:466-485 (epreuveDrawToxicMoss) | Lac de mousse toxique au fond de l'épreuve, bulles | epreuve_singe | **IMAGE** : `liquidFloor` style mousse (`liquide_mousse_toxique`, crête calée), bulles `vfx_mousse_toxique` `bulle` |
| W3 | story/acte1_arbre.js:560-578 (epreuveCreateTide) | Marée de mousse toxique | epreuve_singe | **IMAGE** : même image que le lac, qui défile, crête sur le haut de la marée |
| W4 | entities/Ghilt.js:429-437 (addSpitBall) | Boule de mousse crachée par Ghil't | arene_ghilt | **IMAGE** : `vfx_mousse_toxique` `boule`, tournée selon la vitesse (hitbox r11 inchangée) |
| W5 | entities/MousseCreature.js:62-72 (spawnToxicDrip) | Goutte toxique des ennemis corrompus | partout | **IMAGE** : `fx_goutte_toxique` (6 px) |

## 2. Particules et VFX
| # | Fichier:ligne | Élément | Zone | État au 2026-10-25 |
|---|---|---|---|---|
| V1 | story/acte1.js:17-30 (acte1Particles) | Éclats génériques (mousse, talisman, graine, débris) | bosquet, fs1, fs2, epreuve | **IMAGE** : option `fx` d'`acte1Particles` (`fx_eclat_mousse`, `fx_motte_mousse`, `fx_petale_*`, `fx_braise`…) sur les 7 appels |
| V2 | story/acte1.js:614-626 | Réveil du talisman de l'ours : anneaux orange | fs1 | **IMAGE** : `vfx_anneau_choc` `talisman` (frame fixe en ADD, suit Agarica) |
| V3 | story/acte1_arbre.js:29-45 (arbreMotes) | Lucioles / grains de lumière | racines, monde_spirituel, epreuve | **IMAGE** : `fx_grain_lumiere` |
| V4 | story/acte1_arbre.js:101-141 | Ombre annonçant une chute de pierre | racines, epreuve | **IMAGE** : `fx_ombre_sol` (taille et durée inchangées) |
| V5-V7 | entities/Kainati.js | Ombres, marqueur d'atterrissage, onde de choc | grand_arbre_arene | **IMAGE** : `fx_ombre_sol`, `fx_marqueur_danger`, `vfx_onde_choc` (refonte de Kainati) ; bande d'alerte en `fx_lueur_sol` |
| V8 | entities/Kainati.js:848 | Aura cyan de l'esprit | monde_spirituel | **IMAGE** : `fx_aura_esprit` |
| V9 | story/acte1_arbre.js:209-211 | Lumière de canopée à la sortie vers l'arène | racines | **IMAGE** : `fx_rai_lumiere` (discret) |
| V10 | entities/Ghilt.js:408-421, 507-522 | Cône de souffle toxique + 10 bouffées | arene_ghilt | **IMAGE** : `vfx_souffle_toxique` étiré sur la zone de dégâts (330 px), plus de cône quand l'art existe ; bouffées `fx_bouffee_toxique` |
| V11 | entities/Ghilt.js:541-549 | Bouffées de poussière brune | arene_ghilt | **IMAGE** : `fx_bouffee_poussiere` |
| V12 | entities/Ghilt.js:552-563 | Particules vertes aspirées | arene_ghilt | **IMAGE** : `fx_spore_toxique` (14 px, qui tournent) |
| V13 | story/boss_ghilt.js:571-572 | Anneau de choc vert | arene_ghilt | **IMAGE** : `vfx_anneau_choc` `toxique` (frame fixe, même diamètre) |
| V14 | story/boss_ghilt.js:579-587 | Effondrement du sol : trou noir + mottes | arene_ghilt | **IMAGE** : `decor_trou_effondre` (0,16), `fx_motte_terre` |
| V15 | story/boss_ghilt.js:647-653 | Mottes de mousse qui tombent de Ghil't guéri | arene_ghilt | **IMAGE** : `fx_motte_mousse` / `fx_eclat_mousse` en alternance |
| V16 | story/boss_ghilt.js:842-847 | Gouttes d'antidote | trou_sombre | **IMAGE** : `fx_goutte_antidote` (5x8) |
| V17-V18 | boss_ghilt.js:269-287 ; acte2.js:74-92 | Halos radiaux (lanterne, soleil, plante, hutte, totem…) | plusieurs | **IMAGE** : `fx_halo_doux` (réimporté en vrai dégradé), `fx_halo_rayons` pour le totem activé |
| V19 | entities/MousseCreature.js:18-59 | Étincelles de purification, halo des papillons | partout | **IMAGE** : `fx_grain_lumiere`, `vfx_purification` (2,4 × l'animal), recette `purif` (`fx_etincelle`) ; halo des papillons `fx_halo_doux` |
| V20 | entities/Projectiles.js:148-158 | Halo de la nuée de soin | — | **IMAGE** : `fx_halo_doux` (zone de soin inchangée) |
| V21-V22 | Projectiles.js:72-82 ; SingeCorrompu.js:107-121 | Éclats de pierre | — | **IMAGE** : `fx_eclat_pierre` |
| V23-V24 | entities/Player.js:2784-2813 | Étincelles et traînée du papillon | compétence papillon | **IMAGE** : `fx_etincelle_papillon` (pose, toutes les 110 ms), `fx_trainee_papillon` derrière chaque papillon de la nuée. La traînée du dash n'existe plus (le papillon n'est qu'une compétence) |
| V25 | entities/Player.js:2817-2836 | Gerbe de feuilles à la prise d'une liane | zones à lianes | **IMAGE** : `fx_feuille` (`spawnFx('leaves')`) |
| V26 | utils/StoryKit.js:2231-2241 | Bulles du répulsif | fs2, fc1 | **IMAGE** : `fx_bulle` (recette `melt`, plus de cercles en double) |
| V27 | utils/StoryKit.js:2290-2297 | Amas de mousse brisé à l'ours | fs1, fc1 | **IMAGE** : `mousse_amas_fissure` + éclats `fx_*` |
| V28-V29 | acte2.js:680-683, 1072-1076 | Morceaux de mousse, bulles de la potion de Morgat | ff2, hutte | **IMAGE** : `fx_motte_mousse` / `fx_eclat_mousse`, `fx_bulle` teintée |
| V30 | entities/CourantAir.js:23-59 | Traits du courant d'air | ff1, ff2, clairière | **IMAGE** : `fx_trait_vent`, plus de voile rectangulaire quand `courant_air` existe |
| V31 | entities/Piste.js:88-125 | Contour fantôme des plateformes cachées + flash | fs2 | **IMAGE** : `decor_plateforme_fantome` calé sur la case, éclat `fx_lueur_sol` |
| V32 | entities/Xara.js:888-915 | Fil de soie de Xara | — | **IMAGE** : `fx_fil_soie` (tileSprite de 3 px) |

## 3. Terrain, structures et fonds
| # | Fichier:ligne | Élément | Zone | État au 2026-10-25 |
|---|---|---|---|---|
| T1 | acte1.js:822-826 | Pont en tronc sur la mare | fs2 | **IMAGE** : `decor_pont_tronc` (300x26) |
| T2 | acte1.js:874-880 | Vieux sentier : marches de racines + rai rose | fs2 | Marches **RETIRÉES** (arche `foret_sombre_racine_arche`, Niveaux 2) ; rai **IMAGE** `fx_rai_lumiere`. `decor_marches_racines` non utilisé |
| T3 | acte1_arbre.js:18-26 ; boss_kainati.js:255-261 | Fente / portail lumineux dans l'écorce | racines, monde_spirituel, epreuve | **IMAGE** : `decor_fente_ouverte` / `decor_fente_fermee` + halo (`arbreGlowPassage`) ; plus de fente dans l'arène de Kainati |
| T4 | acte1_arbre.js:493-538 | Plateforme d'écorce qui s'effrite | epreuve | **IMAGE** : `decor_plateforme_ecorce_intacte` / `_fissuree` / `_brisee` |
| T5 | acte1_arbre.js:606-615 | Autel du sommet (dalle + colonne de lumière) | epreuve | Dalle **RETIRÉE** (l'autel est le décor `grand_arbre_autel_singe`) ; colonne **IMAGE** `fx_rai_lumiere`. `decor_autel_sommet` non utilisé (H5) |
| T6 | acte2.js:1232-1243 | Rampe de lancement | hutte_morgat | **IMAGE** : `decor_rampe_lancement` |
| T7 | acte2.js:1384-1396 | Cratère du crash | fc1 | **IMAGE** : `decor_cratere` |
| T8 | acte2.js:1399-1427 | Spirale gravée sur l'arbre malade | fc1 | **IMAGE** : `decor_spirale_gravee` (posée devant l'arbre : elle était cachée) |
| T9 | boss_kainati.js:128-153 | Rideaux de mousse de l'arène | arene Kainati | **IMAGE** : `mousse_mur` |
| T10 | boss_ghilt.js:367-382 | Piliers de mousse de l'arène | arene_ghilt | **IMAGE** : `mousse_mur` (Niveaux 2) |
| T11 | acte2.js:707-724 | Îles lointaines + horizon malade | ff2 | **IMAGE** : `farLayers` (`couche_iles_lointaines` discrètes, `couche_horizon_malade` assombri) |
| T12 | acte2.js:1253-1258 | Horizon de forêt malade | hutte_morgat | **IMAGE** : `farLayers` (`couche_horizon_malade`) |
| T13 | acte2.js:523-545 | Voile de brume + nappes de nuages | ff1 | **IMAGE** : `skyReveal` (`couche_ciel_jour`, `couche_nappe_nuages`, `couche_nuage_0..4`), brume `couche_nappe_brume` ; horizon `farLayers` |
| T14 | acte2.js:97-103 | Voile bleu de ciel de jour (palliatif) | ff1, ff2, clairière, hutte | **RETIRÉ** sur les fonds peints ; reste seulement sans fond peint |
| T15 | StoryKit.js:1946-1950 | Voile d'obscurité teinté (`ambient`) | plusieurs | **TOUJOURS** (voulu) : rectangle teinté ; s'y ajoute la vignette peinte `couche_vignette` sur les zones sombres |

## 4. Plantes et décor
| # | Fichier:ligne | Élément | Zone | État au 2026-10-25 |
|---|---|---|---|---|
| P1 | acte1.js:110-122, 378-386 | Plaques de mousse à gratter, dont une qui repousse | bosquet | **IMAGE** : `decor_mousse_plaque_intacte` / `_grattee` / `_repoussee` (la grattée reste comme trace) |
| P2 | acte1.js:663-675 | Taches de mousse lumineuse | fs1, fs2 | **IMAGE** : `decor_mousse_lumineuse_*` |
| P3 | acte1_arbre.js:48-61 | Plaques de mousse sol et plafond | racines | **IMAGE** : `decor_mousse_lumineuse_*` |
| P4 | acte1.js:832-845 | Fleur perchée hors d'atteinte | fs2 | **IMAGE** : `decor_plante_resistante_fleurie` réduite (la même plante que dans la clairière) + halo. `decor_fleur_perchee` en second choix, posable dans l'éditeur |
| P5 | acte2.js:815-890 | Plante résistante (bouton après cueillette) | clairière | **IMAGE** : `decor_plante_resistante_fleurie` / `_bouton` ; la fleur qui vole = tête rognée de l'image |
| P6 | acte2.js:845-877 | Tapis de mousse toxique + cercle sain fleuri | clairière | **IMAGE** : `decor_cercle_sain` + colonne `fx_rai_lumiere` ; mousse en touffes sombres (`CLAIRIERE_MOUSSE_VARIANTE = 'touffes'`). `decor_tapis_mousse` non posé (trop criard), posable dans l'éditeur |
| P7 | acte2.js:1430-1454 | Touffes de mousse vivante qui se penchent | fc1 | **IMAGE** : `decor_touffe_mousse_*` ; à moins de 40 px, fondu de 150 ms vers `decor_touffe_mousse_penchee` |
| P8 | acte2.js:735-738 ; boss_ghilt.js:739-741 | Taches de mousse séchée | ff2, arene_ghilt | **IMAGE** : `decor_mousse_sechee` |
| P9 | acte1.js:849-857 | Empreintes boueuses | fs2 | **IMAGE** : `decor_empreinte_boue` (21x6, écrasées) |
| P10 | acte1.js:859-870 | Graine de chêne-cœur | fs2 | **IMAGE** : `objet_graine_coeur` |
| P11 | StoryKit.js:245-284 | Note de Geralt | fc1 + inventaire | **IMAGE** : `note_geralt` (réextraite du brut) |
| P12 | StoryKit.js:1967-1981 | Halo sous les objets ramassables | plusieurs | **IMAGE** : `fx_halo_objet` (Juice) |
| P13 | acte1.js:445-447 | Halo de l'idole sur l'autel | bosquet | **IMAGE** : `fx_halo_doux` |
| P14 | StoryKit.js:2084-2103 | Lanterne de reprise : éteinte / allumée | epreuve, ff1, ff2, monde_spirituel | **IMAGE** : `decor_lanterne_eteinte` / `_allumee` (0,15) + halo + lueur au sol |

## 5. Personnages, créatures et accessoires
| # | Fichier:ligne | Élément | Zone | État au 2026-10-25 |
|---|---|---|---|---|
| C1 | acte1.js:629-660 | Petite araignée qui s'incline devant Xara | fs1 | **IMAGE** : `araignee_petite_0..2` |
| C2 | acte2.js:654-669 | Petite bête de mousse tuée par Amanite | ff2 | **IMAGE** : `bete_mousse_vivante` / `_touchee` / `_morte` (repli `mousse_creature`) |
| C3 | MousseCreature.js:203-224 | Créature de mousse guérie | partout | **IMAGE** : `mousse_creature_guerie_0` / `_1` (0,2) |
| C4 | SingeCorrompu.js:64-76 | Singe guéri | racines, epreuve, fc1 | **IMAGE** : `singe_gueri` |
| C5 | SingeCorrompu.js:77-87 | Pierre lancée par le singe corrompu | racines, epreuve, fc1 | **IMAGE** : `pierre` (12 px, teinte verte) |
| C6 | acte2.js:310-468 | Accessoires du duel de Geralt : grappin, flèche, collet, corde | ff1 (et fc1 pour le collet et la flèche plantés) | **IMAGE** : `objet_grappin`, `objet_fleche`, `objet_collet` (42x17), `objet_corde` ; le duel est dans `GeraltDuel.js` |

## 6. Interface dans le monde et HUD
| Élément | État au 2026-10-25 |
|---|---|
| Bulles de dialogue | **IMAGE** : `ui_bulle` + `ui_bulle_pointe` |
| Invites « E : … » | **IMAGE** : `ui_invite` + `ui_touche` (`createStoryPromptLabel`) |
| « ! » et étoiles d'étourdissement (Kainati, Geralt) | **IMAGE** : `ui_alerte`, `ui_etoiles_etourdi` |
| Barre d'énergie | **IMAGE** : `ui_energie_cadre` / `ui_energie_remplissage` (150x22) |
| Cases de compétence vides, pastille de touche | **IMAGE** : `ui_case_competence`, `ui_touche` |
| Barre de boss | **IMAGE** : `ui_boss_cadre` / `ui_boss_remplissage` (448x32) |
| Bannière « objet obtenu » / « compétence » | **IMAGE** : `ui_banniere` (128 px) + `ui_anneau_objet` |
| Ornements de la carte-titre | **IMAGE** : `ui_ornement_titre` |
| Toast | **IMAGE** : `ui_bulle` |
| Indicateur « suite » du dialogue | **IMAGE** : `ui_bulle_pointe` (repli ▼) |
| Touches A/F/R du feu de camp | **IMAGE** : `ui_touche` |
| Menu du feu de camp | **IMAGE** : `ui_feu_camp` (Juice) |

## 7. Ce qui reste dessiné par code (TOUJOURS, au 2026-10-25)
- **Voile d'ambiance** (`ambient`, rectangle teinté) : voulu, la vignette peinte s'y ajoute sur les zones sombres.
- **Anneau de choc générique** (`juiceShockRing` sans variante : coups, ramassages, totems…) : anneau dessiné et teinté (Q4). L'art ne sert que pour le talisman et le toxique.
- **Particules sans art adapté** : étincelles `spark` (traînée teintable), poussière `dust` (lavande, R10), petites étoiles teintées `glint` (l'art `fx_etincelle` ne prend pas la teinte), textures `juice-*` des recettes sans image.
- **Touches de l'écran Contrôles** (`menuDrawKeycap`, MenuKit) : violettes, dessinées (Q32 : bois clair en jeu seulement).
- **Rayons du bandeau « forme débloquée »** (LevelKit) et voile de sous-bois du ciel qui se révèle.
- **Panneaux de menus** (titre, pause, options, inventaire, carte) : `drawStoryPanel` / cadre `dialogue_box`, hors du périmètre du lot n°8.
- **Lianes** : tracé Graphics seulement en repli sans art `liane`.

## Art présent mais non utilisé (au 2026-10-25)
- Lot n°8 : `decor_marches_racines` (H6 : l'arche est gardée), `decor_autel_sommet` (H5 : autel actuel gardé), `fx_eclaboussure_toxique` (aucun usage recommandé), `couche_brume_avant` (H2 écartée), `decor_fleur_perchee` (second choix), `decor_tapis_mousse` (variante `'lisere'` seulement). Les décors du manifest restent posables dans l'éditeur (sections `decor`, `objet`, `rocher`).
- Plus anciens : `lance_amanite`, `porte_mousse` (H20 : aucun usage cohérent ; posables dans l'éditeur), `kainati_esprit_extra` (à générer, plus d'usage depuis que le monde spirituel est hors du chemin).
- Désormais utilisés : `vfx_onde_choc`, `vfx_vague_mousse`, `rocher_roulant`, `kainati_sol` (refonte de Kainati), `mousse_amas_fissure`, `pierre`, `mousse_mur`.
