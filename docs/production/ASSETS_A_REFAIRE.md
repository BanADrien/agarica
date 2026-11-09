# Assets à refaire à la main, par priorité

But : remplacer à terme TOUTES les images IA (Codex) par du pixel art fait main, comme
`tuiles.png`. Le jeu compte environ 1 190 images. L'ordre ci-dessous va de ce qu'on voit
le plus à ce qu'on voit le moins. On s'arrête quand on veut : chaque lot rend déjà le jeu
plus cohérent.

★ = n'a encore AUCUNE image : le jeu affiche une forme provisoire ou se rabat sur une
autre image. Dessiner l'un de ces éléments rend inutile le prompt Codex qui le
concernait (n°9, 12 ou 13).

## Avant de commencer : l'échelle

Tes tuiles font **24 px par case, affichées à 64 px** : 1 pixel dessiné = 2,67 px à
l'écran. Pour que tout aille ensemble, garde cette même densité partout. Tailles
conseillées (hauteur du personnage, marge non comprise) :

| Élément | Taille à dessiner |
|---|---|
| Agarica | ≈ 32 px |
| Xara | ≈ 12 px |
| Loup | ≈ 45 px de long |
| Crapaud, singe corrompu, araignée | ≈ 20-24 px |
| PNJ (père, Amanite, Geralt…) | ≈ 34-45 px |
| Kainati | ≈ 90-100 px |
| Ghil't | ≈ 115 px |
| Un écran de fond | 360 × 203 px |

Si tu préfères plus de détail, on peut passer à 1 pixel = 1,33 px à l'écran (tailles
doublées). Mais ce sera moins raccord avec les tuiles.

**Premier pas conseillé** : dessine seulement Agarica au repos et en course (12 images). Je
l'intègre (échelle, affichage net sans flou) et tu juges sur l'écran avant de lancer le
reste.

**Format** :
- PNG à fond transparent ;
- une rangée par animation, images de gauche à droite ;
- personnage tourné vers la DROITE.

Envoie-moi chaque feuille dès qu'elle est finie : l'intégration est rapide.

---

## Lot 1 : ce qu'on voit tout le temps (≈ 75 images + 3 jeux de tuiles)

| Quoi | Images | Pourquoi |
|---|---|---|
| **Agarica** : repos 6, marche 4, course 6, saut (montée 3, chute 3), attaque à la dague (côté, haut, bas : 12), blessure 3 | 37 | à l'écran 100 % du temps |
| **Xara** : marche, saut, balancement au fil, bascule, parole, excitation | ≈ 27 | elle suit Agarica partout ; minuscule, donc rapide |
| **HUD** : cœur plein et vide, jauge d'énergie (cadre + remplissage), case de compétence, 3 icônes de compétence (ours, pierre, papillon), 5 icônes de forme | ≈ 13 | toujours affiché |
| **Terrain des biomes**, en atlas 6×6 de 24 px comme `tuiles.png` : écorce (racines, arène de Kainati, épreuve du singe, forêt flottante 1), îles flottantes (forêt flottante 2, clairière, hutte), sol corrompu (forêt corrompue, arène de Ghil't, trou sombre) | 3 atlas | ces jeux sont encore IA et couvrent 10 des 14 zones du chemin principal ; je passerai leur code en mode « atlas » |

## Lot 2 : formes, ennemis et combat (≈ 210 images)

| Quoi | Images | Pourquoi |
|---|---|---|
| **Loup** : course 6, saut 4, morsure 8, + une pose debout (nouvelle : aujourd'hui, image de course figée) | ≈ 19 | [Maj] tenue = loup, très fréquent |
| **Singe** : forme (saut, liane, balancement) 25, grimpe et lancer 8, transformation 4 | 37 | lianes et tout l'acte du grand arbre |
| **Aigle** : vol 4, plané 4, piqué 5, plume 3 | 16 | forêt flottante 2 et voyage rapide |
| **Transformations** : humain → loup, aigle, ours ; loup → aigle | 9 | jouées à chaque changement de forme |
| **Ennemis du chemin** : crapaud corrompu 9, ★ crapaud sauteur 10, ★ crapaud-piège 12, singe corrompu 13, créature de mousse 13, araignée 12, loup sanguinaire 12 | 81 | on les croise dans presque toutes les zones |
| **Effets de combat** : arc de la dague 9, crocs du loup 5, impact de pierre 5 | 19 | à chaque coup |
| **Compétences** : ours (fracas 6), papillon (forme 12, lancer 4, transformation 4, soin 8) | 34 | murs cassables, soin des corrompus |
| **Pieuvre** : nage 4, transformation 4 | 8 | seulement la mare de la forêt sombre 2 |

## Lot 3 : décors de premier plan et objets posés (≈ 230 images)

| Quoi | Images | Pourquoi |
|---|---|---|
| **Sous-bois et herbes** au pied des tuiles | 14 | collés aux tuiles, le contraste se voit tout de suite |
| **Plantes de premier plan** (haut et bas de l'écran, forêt sombre) | 28 | début du jeu, première impression |
| **Feu de camp** 4, **totems** (loup, aigle, singe, pieuvre ; éteint et allumé) 8 | 12 | points de repère dans chaque zone |
| **Props du bosquet** : lampadaires, pierres dressées, huttes, chaumière, tour, murailles, puits… | 32 | début ET fin du jeu |
| **Props des autres biomes** : forêt sombre 11, grand arbre 10 + tronc 10, forêt flottante 10, hutte de Morgat 10, forêt corrompue 11 | 62 | un biome à la fois, dans l'ordre du jeu |
| **Éléments de décor** : mousses (plaques, touffes, lumineuses), plateformes d'écorce, lanternes, arche, branches, berges de mare… | 50 | posés un peu partout |
| **Arbres** 8, **surfaces** (terre, roche) 23, **liquides** (mare, mousse toxique) 7 | 38 | |

## Lot 4 : fonds (≈ 20 images, mais grandes)

| Quoi | Pourquoi |
|---|---|
| **7 fonds de zone**, par ordre d'usage : forêt flottante (4 zones), grand arbre (3), forêt sombre (2 zones, première impression), forêt corrompue, bosquet (début et fin), arène de Ghil't, trou sombre | grande surface, mais assombrie et derrière ; un fond peint derrière du pixel art passe mieux que l'inverse |
| **13 couches de ciel** : ciel de jour, nuages 0-4, nappes de nuages et de brume, horizon malade, îles lointaines, soleil, vignette | |

## Lot 5 : personnages de l'histoire et boss (≈ 260 images)

| Quoi | Images | Pourquoi |
|---|---|---|
| **Portraits de dialogue**, d'abord Agarica et Xara (presque tous les dialogues), puis père, Amanite, Geralt, Morgat, Kainati (corrompu, calmé), Ghil't | 9 | doivent ressembler aux nouveaux sprites |
| **PNJ** : père 13, Amanite 22, Geralt 27 (+ ★ au combat 33), Morgat 13, druide 12, porteur 9, garde 13, Clak 12 | ≈ 154 | vus surtout pendant les scènes |
| **Kainati** : corrompu 27, au sol 20, ★ calmé 8 | 55 | gros (≈ 100 px) mais vu une fois |
| **Ghil't** : corrompu 24, guéri 6 | 30 | le plus gros sprite du jeu |
| **Marchand et vague 3** : ★ Tamarin 8, ★ Tika 8, ★ Pépin 12, ★ Dame Écaille 8, ★ coffre animé 8 | 44 | à faire avant ou pendant les lots A, B et C des nouvelles zones |
| **Animaux** : papillon 4, singe guéri 9, poisson 4, cochon 8 (les 3 couleurs de cochon se font par teinte dans le code, inutile de les dessiner) | 25 | |

## Lot 6 : objets, interface, effets (en dernier, ≈ 160 images)

| Quoi | Images |
|---|---|
| **Objets d'inventaire** : idole, fragments, talismans, bocal, répulsif, fleur, carte, lance… | ≈ 37 |
| **Interface** : boîte de dialogue, bulles, bannière, invite, touche, cadre de vie du boss, menu du feu de camp, parchemin de la carte | ≈ 20 |
| **Effets restants** : souffle toxique, flaque et vague de mousse, purification, piste du loup, onde de choc, invocation de Clak, anneaux, bulles toxiques | ≈ 70 |
| **Particules** (éclats, feuilles, gouttes, lucioles, halos…) : petites et vite faites, mais peu visibles une à une | 31 |

## À NE PAS refaire

- `autotile_frames` (21 tuiles) : ancien jeu de terrain « floor », inactif depuis tes tuiles.
- Monde spirituel (esprit de Kainati, son fond) : hors du chemin depuis le 2026-10-25.
- Les images des anciennes zones de test.
- Ancienne attaque d'estoc et ancienne marche d'Agarica : remplacées. Je vérifierai
  qu'elles ne servent plus avant de les retirer.
- `fond_titre.jpg` : c'est ton image, pas de l'IA.
