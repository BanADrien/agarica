# Prompt Codex n°15 — la marche d'Agarica refaite en 8 images (2026-11-15)

Demande de l'utilisateur : « refaire l'animation de marche d'Agarica […] actuellement c'est bizarre ».
Les 4 images actuelles (`assets/sprites/agarica_walk_frames/`) avaient deux défauts : le corps
glissait vers l'arrière d'une image à l'autre (corrigé par recalage le 2026-11-15), et les deux pas
se ressemblaient (même jambe devant aux images 1 et 3) : c'est ce second défaut que cette feuille
corrige, avec un vrai cycle de 8 poses où les jambes ALTERNENT.

**1 image** : une NOUVELLE feuille, `assets/sprites/agarica_marche.png`. Elle ne remplace aucun
fichier ; le découpage, le pixel-fixer et le branchement dans le jeu sont faits à part (pas par Codex).

## Prompt à coller dans Codex

```
Nouvelle commande d'image pour « Legend of Agarica » (prompt n°15) : 1 image, le cycle de marche d'Agarica en 8 poses.

RÈGLES
- Ne modifie ni `src/` ni `src/data/asset_manifest.js`, ni aucun outil de `tools/`. Ne lance AUCUN import : tu écris seulement le fichier image demandé.
- Ne régénère et ne retouche aucune image existante : `assets/sprites/agarica_marche.png` est un NOUVEAU fichier.
- Fond transparent (alpha réel). Aucun texte, aucune lettre, aucun chiffre, aucune grille, aucun cadre, aucun sol, aucune ombre portée, aucune poussière, aucun effet.
- Une rangée = quatre poses, séparées d'au moins 40 px ; rangées séparées d'au moins 60 px. Personnage de PROFIL, tourné vers la DROITE.
- C'est le MÊME personnage dans les 8 poses, COPIÉ FIDÈLEMENT des images de référence : mêmes proportions, même tête, mêmes cheveux, même cape, mêmes couleurs, même taille de dessin. Tu ne réinventes rien : tu ne fais que la faire marcher.
- Ne commite rien et ne pousse rien.

RÉFÉRENCES À JOINDRE
- Agarica debout : assets/sprites/agarica_frames/agarica_row0_0.png (jeune druidesse elfe, cheveux courts auburn clair #B5613A, oreilles pointues, yeux verts, cape verte à capuche avec un motif de feuille brodé en bas, tunique beige ceinturée, tatouages orangés sur les bras, gants sombres, collants sombres, bottes brunes).
- Sa marche actuelle, pour le STYLE, l'échelle et la cape (pas pour les poses, qui sont à refaire) : assets/sprites/agarica_walk_frames/agarica_walk_0.png, agarica_walk_1.png, agarica_walk_2.png, agarica_walk_3.png.

BLOCS COMMUNS (remplace [STYLE] par le bloc complet ci-dessous)

[STYLE] =
Game asset for 'Legend of Agarica', a 2D side-scrolling dark-fantasy druid platformer. Art style: high-resolution 'HD pixel-art / cel-shaded 2D' look, thick near-black outlines (3-4 px), flat saturated color fills with 2-3 tone cel shading, visible chunky pixel texture, clean readable silhouettes, lighting from the upper left. Dark silhouettes in the spirit of Hollow Knight. World palette: night forest in deep violet, indigo and teal, magical accents in luminous moonlit green (#8fe3b8) and touches of rose pink (#ff9fc9). Strict side view (profile).


1) assets/sprites/agarica_marche.png (1536 x 1024, 2 rangées de 4 poses, cases 384 x 512)
Taille : dans chaque case, Agarica mesure environ 430 px de haut, tête et pieds compris (même taille dans les 8 poses, à 2 % près).
Prompt :
[STYLE]
THE CHARACTER IS AGARICA, EXACTLY AS IN THE REFERENCE IMAGES: a young elf druid seen in strict side view facing RIGHT, short messy light-auburn hair, pointed ear, green eyes, a green hooded cloak with an embroidered leaf motif near its lower edge, a beige belted tunic, orange tattoos on her bare upper arms, dark gloves, dark leggings, brown boots. Same proportions (large head, small body), same colors, same outline as the references. Do not redesign her.
SPRITE SHEET LAYOUT: canvas 1536 x 1024 px, fully transparent background. Exactly 2 horizontal rows of 4 poses each (8 poses), read left to right then top row to bottom row: ONE continuous 8-frame WALK CYCLE that loops (pose 8 leads back into pose 1). Each row is a band about 512 px tall; cells are 384 px wide; each pose is centered in its cell. In ALL 8 poses the head and torso stay at the SAME horizontal place in the cell (the body does not drift forward or backward) and the feet rest on the SAME baseline; only a small natural vertical bob of 6 to 10 px (lowest on the contact poses, highest on the passing poses). At least 40 px of empty space between poses.
THE WALK, a calm natural walk in place (classic 8-pose cycle). "Near" = the leg and arm closest to the viewer, "far" = the ones behind her body (drawn a little darker). The two legs must clearly ALTERNATE: poses 1-4 are one step, poses 5-8 are the mirrored step with the OTHER leg forward.
Pose 1 - CONTACT A: NEAR leg stretched forward, heel touching the ground; FAR leg stretched back, toe on the ground. Near arm swung BACK, far arm swung FORWARD (arms always opposite to the legs). Widest stride.
Pose 2 - DOWN A: weight drops onto the near leg, its knee bends, foot flat; far leg starts lifting behind. Body at its lowest.
Pose 3 - PASSING A: near leg straight under the body carrying the weight; far leg bent, knee passing forward beside it, foot off the ground. Arms hang near the body. Body at its highest.
Pose 4 - UP A: near leg pushing off behind on the toes; far leg swinging forward in the air, knee up, about to land.
Pose 5 - CONTACT B: the mirror of pose 1: FAR leg stretched forward, heel touching the ground; NEAR leg stretched back, toe on the ground. Near arm swung FORWARD, far arm swung BACK. Widest stride.
Pose 6 - DOWN B: weight drops onto the far leg, knee bent; near leg starts lifting behind. Body at its lowest.
Pose 7 - PASSING B: far leg straight under the body; near leg bent, knee passing forward in front of it, foot off the ground. Body at its highest.
Pose 8 - UP B: far leg pushing off behind on the toes; near leg swinging forward in the air, about to land into pose 1.
The cloak trails behind her and sways gently, a little different in each pose, always attached at the shoulders; the hair moves very slightly. No motion lines, no dust, no ground, no shadow.
Output: one PNG, 1536 x 1024 px, transparent background, exactly 2 rows of 4 poses.

À LA FIN
Contrôles sur le fichier final :
- EXACTEMENT 8 poses (4 / 4), fond transparent réel, rien d'autre dans l'image.
- Les jambes alternent : la jambe proche est devant à la pose 1, la jambe éloignée à la pose 5.
- Tête et buste au même endroit horizontal dans les 8 cases ; pieds sur la même ligne de base.
- Même personnage que les références (couleurs, proportions, cape).
N'importe rien, ne modifie aucun autre fichier. Écris un bilan de trois lignes.
```

## Côté code (après la livraison)

Découpe en 8 images dans `assets/sprites/agarica_walk_frames/` (recalées sur la tête), pixel-fixer
(`agarica:marche`, tools/pixelfix.js), `AGARICA_WALK_FRAME_INDICES` et le nombre d'images chargées
(BootScene) passés à 8, cadence ajustée.
