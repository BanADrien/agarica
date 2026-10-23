# Éléments dessinés par code à remplacer par des images (inventaire du 2026-10-23)

Statuts :
- **TOUJOURS** : dessiné par code même si une image existe. Ce sont les cibles des prompts Codex.
- **REPLI** : dessiné seulement si l'image du manifest manque. L'image est présente, donc ce dessin ne s'affiche plus.
- **TEST** : utilisé seulement par les anciennes zones de test.

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
| # | Fichier:ligne (fonction) | Élément | Zone | Taille | Animation |
|---|---|---|---|---|---|
| W1 | story/acte1.js:807-821 (acte1Fs2DrawMare) | Mare préservée : eau arrière (prof. 3) + eau avant translucide (prof. 5), berges en pierre, roseaux. Les poissons nagent entre les deux couches. | foret_sombre_2 | 256x88 | Alpha avant 1↔0,75 |
| W2 | story/acte1_arbre.js:466-485 (epreuveDrawToxicMoss) | Lac de mousse toxique au fond de l'épreuve, avec bulles qui montent | epreuve_singe | toute la largeur x 80 | Bulles en boucle |
| W3 | story/acte1_arbre.js:560-578 (epreuveCreateTide) | Marée de mousse toxique qui monte et descend | epreuve_singe | 352 x 60→220 | Cycle |
| W4 | entities/Ghilt.js:429-437 (addSpitBall) | Boule de mousse crachée par Ghil't | arene_ghilt | r11 | Mobile |
| W5 | entities/MousseCreature.js:62-72 (spawnToxicDrip) | Goutte toxique qui tombe des ennemis corrompus | Toutes les zones avec ennemis corrompus | 3x5 | Tween |

## 2. Particules et VFX (tous TOUJOURS, sauf mention)
| # | Fichier:ligne | Élément | Zone | Taille |
|---|---|---|---|---|
| V1 | story/acte1.js:17-30 (acte1Particles) | Éclats génériques : mousse verte, orange et rose (talisman), rose et blanc (graine cœur), brun et vert (débris) | bosquet, fs1, fs2, epreuve | r3-7 |
| V2 | story/acte1.js:614-626 | Réveil du talisman de l'ours : anneaux orange | fs1 | r18 ×4 |
| V3 | story/acte1_arbre.js:29-45 (arbreMotes) | Lucioles / grains de lumière | racines, monde_spirituel, epreuve | r1,5-3,5 |
| V4 | story/acte1_arbre.js:101-141 | Ombre annonçant une chute de pierre | racines, epreuve | 22x8 → 66x18 |
| V5-V7 | entities/Kainati.js | Ombres, marqueur d'atterrissage, onde de choc en rectangles (art `vfx_onde_choc` présent mais NON utilisé) | grand_arbre_arene | — |
| V8 | entities/Kainati.js:848 | Aura cyan de l'esprit | monde_spirituel | ~273x252 |
| V9 | story/acte1_arbre.js:209-211 | Lumière de canopée à la sortie vers l'arène | racines | 120x200 |
| V10 | entities/Ghilt.js:408-421, 507-522 | Cône de souffle toxique + 10 bouffées, dessiné MÊME par-dessus `vfx_souffle_toxique` | arene_ghilt | ~330x200 |
| V11 | entities/Ghilt.js:541-549 | Bouffées de poussière brune | arene_ghilt | r5-10 |
| V12 | entities/Ghilt.js:552-563 | Particules vertes aspirées | arene_ghilt | r5 |
| V13 | story/boss_ghilt.js:571-572 | Anneau de choc vert | arene_ghilt | r30 ×30 |
| V14 | story/boss_ghilt.js:579-587 | Effondrement du sol : trou noir + 8 mottes de terre | arene_ghilt | 170x36 |
| V15 | story/boss_ghilt.js:647-653 | Mottes de mousse qui tombent de Ghil't guéri | arene_ghilt | r5-12 |
| V16 | story/boss_ghilt.js:842-847 | Gouttes d'antidote | trou_sombre | r3 |
| V17-V18 | boss_ghilt.js:269-287 ; acte2.js:74-92 | Halos radiaux (lanterne, soleil, plante, fenêtre de la hutte, totem…) | plusieurs | — |
| V19 | entities/MousseCreature.js:18-59 | Étincelles de purification, halo des papillons | partout | 8-16 |
| V20 | entities/Projectiles.js:148-158 | Halo de la nuée de soin | — | ~170x160 |
| V21-V22 | Projectiles.js:72-82 ; SingeCorrompu.js:107-121 | Éclats de pierre | — | r2,5 |
| V23-V24 | entities/Player.js:2784-2813 | Étincelles et traînée du papillon | forme papillon | r2-4 |
| V25 | entities/Player.js:2817-2836 | Gerbe de feuilles à la prise d'une liane | zones à lianes | 9x5 |
| V26 | utils/StoryKit.js:2231-2241 | Bulles du répulsif | fs2, fc1 | r3-7 |
| V27 | utils/StoryKit.js:2290-2297 | Amas de mousse brisé à l'ours (art `mousse_amas_fissure` présent mais NON utilisé) | fs1, fc1 | r4-9 |
| V28-V29 | acte2.js:680-683, 1072-1076 | Morceaux de mousse, bulles de la potion de Morgat | ff2, hutte | r3-7 |
| V30 | entities/CourantAir.js:23-59 | Traits du courant d'air, dessinés PAR-DESSUS l'art `courant_air` | ff1, ff2, clairière | 14-40 |
| V31 | entities/Piste.js:88-125 | Contour fantôme des plateformes cachées + flash | fs2 | 192x64 |
| V32 | entities/Xara.js:888-915 | Fil de soie de Xara | — | 1,5 px |

## 3. Terrain, structures et fonds (TOUJOURS)
| # | Fichier:ligne | Élément | Zone |
|---|---|---|---|
| T1 | acte1.js:822-826 | Pont en tronc couché sur la mare (296x16) | fs2 |
| T2 | acte1.js:874-880 | Vieux sentier : 4 marches de racines + rai de lumière rose | fs2 |
| T3 | acte1_arbre.js:18-26 ; boss_kainati.js:255-261 | Fente / portail lumineux dans l'écorce (70x110-120) | racines, monde_spirituel, epreuve, arene |
| T4 | acte1_arbre.js:493-538 | Plateforme d'écorce qui s'effrite (96x22) | epreuve |
| T5 | acte1_arbre.js:606-615 | Autel du sommet (dalle + colonne de lumière) | epreuve |
| T6 | acte2.js:1232-1243 | Rampe de lancement (planche, poteau, fanion rose) ~90x50 | hutte_morgat |
| T7 | acte2.js:1384-1396 | Cratère du crash (200x26 + branches cassées) | fc1 |
| T8 | acte2.js:1399-1427 | Spirale gravée sur l'arbre malade (~45 px) | fc1 |
| T9 | boss_kainati.js:128-153 | Rideaux de mousse aux bords de l'arène (44x488 ; pourrait réutiliser `mousse_mur`) | arene Kainati |
| T10 | boss_ghilt.js:367-382 | Piliers de mousse fermant l'arène (52x300 ; pourrait réutiliser `mousse_mur`) | arene_ghilt |
| T11 | acte2.js:707-724 | Îles flottantes lointaines + horizon de forêt malade (fond) | ff2 |
| T12 | acte2.js:1253-1258 | Horizon de forêt malade (fond) | hutte_morgat |
| T13 | acte2.js:523-545 | Voile de brume + 9 nappes de nuages qui se dissipent en montant | ff1 |
| T14 | acte2.js:97-103 | Voile bleu de ciel de jour plein écran (palliatif) | ff1, ff2, clairière, hutte |
| T15 | StoryKit.js:1946-1950 | Voile d'obscurité teinté (`ambient`) | plusieurs |

## 4. Plantes et décor (TOUJOURS)
| # | Fichier:ligne | Élément | Zone |
|---|---|---|---|
| P1 | acte1.js:110-122, 378-386 | Plaques de mousse à gratter (~70x30), dont une qui repousse | bosquet |
| P2 | acte1.js:663-675 | Taches de mousse lumineuse (sol et troncs) | fs1, fs2 |
| P3 | acte1_arbre.js:48-61 | Plaques de mousse sol et plafond | racines |
| P4 | acte1.js:832-845 | Fleur perchée hors d'atteinte (~30x45) | fs2 |
| P5 | acte2.js:815-890 | Plante résistante (tige, feuilles, fleur ; bouton après cueillette). L'art `fleur_resistante` existe mais n'est pas utilisé dans le monde. | clairière |
| P6 | acte2.js:845-877 | Tapis de mousse toxique + cercle sain fleuri | clairière |
| P7 | acte2.js:1430-1454 | Touffes de mousse vivante qui se penchent vers Agarica (18 x 26/38/50) | fc1 |
| P8 | acte2.js:735-738 ; boss_ghilt.js:739-741 | Taches de mousse séchée | ff2, arene_ghilt |
| P9 | acte1.js:849-857 | Empreintes boueuses (13x6) | fs2 |
| P10 | acte1.js:859-870 | Graine de chêne-cœur (+1 cœur, ~26x20) | fs2 |
| P11 | StoryKit.js:245-284 | Note de Geralt (papier froissé, sans entrée manifest) | fc1 + inventaire |
| P12 | StoryKit.js:1967-1981 | Halo sous les objets ramassables | plusieurs |
| P13 | acte1.js:445-447 | Halo de l'idole sur l'autel | bosquet |
| P14 | StoryKit.js:2084-2103 | Lanterne de reprise : éteinte / allumée (18x30) | epreuve, ff1, ff2, monde_spirituel |

## 5. Personnages, créatures et accessoires (TOUJOURS)
| # | Fichier:ligne | Élément | Zone |
|---|---|---|---|
| C1 | acte1.js:629-660 | Petite araignée qui s'incline devant Xara (~20x12) | fs1 |
| C2 | acte2.js:654-669 | Petite bête de mousse tuée par Amanite (~64x50) | ff2 |
| C3 | MousseCreature.js:203-224 | Créature de mousse guérie (boule verte avec une pousse) | partout |
| C4 | SingeCorrompu.js:64-76 | Singe guéri (brun, sans mousse, 44x58) | racines, epreuve, fc1 |
| C5 | SingeCorrompu.js:77-87 | Pierre lancée par le singe corrompu (l'art `pierre` existe mais n'est pas branché) | racines, epreuve, fc1 |
| C6 | acte2.js:310-468 | Accessoires du duel de Geralt : grappin, flèche, collet, corde | ff1 |

## 6. Interface dans le monde et HUD
- Bulles de dialogue (StoryKit buildSpeechBubble) ; invites « E : … » (texte sur fond) ; icônes « ! » et étoiles d'étourdissement de Kainati (texte).
- HUD :
  - barre d'énergie 150x10 ;
  - cases de compétence vides 34 px ;
  - pastille de touche ;
  - barre de boss (cadre bois 448x20) ;
  - bannière « objet obtenu » / « compétence » (panneau 460x104 dessiné) ;
  - ornements de la carte-titre des zones.

## Art déjà présent mais non utilisé
- `vfx_onde_choc`, `vfx_vague_mousse`, `rocher_roulant`, `kainati_sol` (pour la refonte de Kainati).
- `mousse_amas_fissure`, `porte_mousse`, `lance_amanite`.
- Réutilisables tels quels :
  - `pierre` → pierre du singe corrompu ;
  - `fleur_resistante` → plante de la clairière ;
  - `mousse_mur` → rideaux et piliers de mousse des arènes.
