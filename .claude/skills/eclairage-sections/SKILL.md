---
name: eclairage-sections
description: Rendre un sprite de Legend of Agarica sensible à la lumière (éclairage dynamique par sections) puis l'éclairer en jeu avec LightKit (torche, lune, contre-jour). À utiliser dès qu'on parle de lumière, d'éclairage, de normales, de carte de normales, de sprite en sections, de torche ou de contre-jour, ou après avoir généré / refait un sprite qui doit réagir à la lumière. Tout se fait avec Node depuis le dépôt (rien à installer).
---

# Éclairage par sections

Un sprite préparé a, dans `_lumiere/` à côté de son image, une version **neutre** (couleurs de
base en aplats, contour et œil gardés) et DEUX cartes :
- la **carte de sections** (zones en couleurs franches, 1 couleur = 1 direction) et les
  **normales** qui s'en déduisent : elles servent à la lumière de **FACE** (lampe devant) ;
- la **carte contre-jour** (`_cj.png`, aperçu coloré `_cj-apercu.png`) : quels bords sont
  exposés à une lampe **DERRIÈRE** le sprite, dans quelle direction et combien. Le milieu du
  sprite n'y est pas : une lampe derrière ne l'allume jamais.
Les deux sont générées automatiquement et retouchables à la main. En jeu, `src/utils/LightKit.js`
multiplie le neutre par la lumière reçue, arrondie en **paliers** (4) : ça reste du pixel art.
Le modèle de lumière vient du skill `pixel-art-forge` (réglé avec l'utilisateur sur sa page de
test, version v16) ; tout ce qu'il faut est dans le dépôt, rien ne dépend de ce skill ni d'un
autre PC.

## Chaîne complète (depuis la racine du jeu)

1. **Image** : génération Codex (skill `codex-images`), import, puis **pixel-fixer** au grain de
   sa catégorie (CLAUDE.md, « Pixel art ») : `node tools/pixelfix.js anim <id> ...`. Le facteur
   `f` noté dans `src/data/pixel_fixed.js` sert ensuite tout seul.
2. **Sections** :
   - une animation, TOUTES ses frames en une commande, dans l'ordre de `anims.create`
     (sinon l'éclairage clignote d'une frame à l'autre) :
     `npm run sections -- --animation assets/sprites/agarica_walk_frames/agarica_walk_{0..7}.png --fps 12 --vitesse 190 --nom agarica_walk`
     (fps = frameRate de l'anim ; vitesse = px/s de déplacement, pour la page de test ;
     `{0..7}` est développé par bash, pas par PowerShell : y lister les fichiers, ou donner le
     dossier quand il ne contient que cette animation, frames triées 0, 1, 2... 10) ;
   - un sprite seul (ou des frames de facteurs différents, comme le grizzly) :
     `npm run sections -- assets/sprites/grizzly_frames/grizzly_row0_0.png`
   - TOUJOURS ajouter `--echelle-jeu <setScale du code>` (voir « Taille à l'écran ») ; image encore peinte
     (absente de `pixel_fixed.js`) : même option
     (demande sharp : `npm install` dans `tools/pixel-fixer`) ; mieux : la passer d'abord dans
     pixel-fixer.
   - options : `--apercu` (planche origine / neutre / sections / éclairé g. / d.),
     `--garder hex,hex` (couleurs gardées telles quelles), `--rampes "hex,hex;hex,hex"` (matières
     forcées), `--facteur f` (forcer f).
   Sorties : `_lumiere/<nom>_natif.png`, `_neutre.png`, `_sections.png`, `_n.png`, `_cj.png`,
   `_cj-apercu.png`, et le manifeste `src/data/sections.js` (GÉNÉRÉ, `ASSET_VERSION` changée). Lire la ligne
   « rampes » : une matière par couleur de base ; si le visage et la tunique se mélangent, forcer
   `--rampes`.
3. **Vérifier** (section plus bas) puis **commiter** les `_lumiere/`, `sections.js` et
   `asset_version.js`.
4. **En jeu** : LightKit (section suivante).

## Essayer une image avant de l'intégrer (glisser-déposer)

Pour juger une image (nouvelle génération Codex, sprite trouvé, retouche) sous la lumière AVANT
de l'importer dans le jeu : `npm run lumiere:apercu -- --vide` (ou sans `--vide` pour l'avoir à
côté des sprites du jeu), puis donner à l'utilisateur le chemin de la page
(`tools/lumiere/sortie/...-lumiere.html`, double-clic). En haut : « Charger une image » ou
glisser-déposer un PNG / JPG ; plusieurs fichiers déposés ensemble = une animation, dans l'ordre
des noms (`marche_1, marche_2... marche_10`).
- Le calcul complet se fait dans la page, avec le même code que `npm run sections`
  (`tools/lumiere/coeur.js`, embarqué) : même résultat au pixel près que l'outil.
- Réglages : « Retirer le fond » (fond uni = couleur des 4 coins, effacé depuis les bords ;
  tolérance réglable ; un blanc ENFERMÉ, comme un œil, reste : un trou transparent enfermé
  redevient donc blanc sur une image à fond blanc) ; « Taille d'un pixel dessiné » (vide =
  détection de la grille, comme pixel-fixer ; la forcer si la détection se trompe).
- L'image apparaît au milieu, en tête de la liste, avec les mêmes réglages de lumière que les
  sprites du jeu ; liens pour télécharger neutre, normales, sections, carte contre-jour (et son
  aperçu).
- Messages de prudence : pas de transparence ni de fond uni (tout le cadre devient le sprite),
  pas de grille détectée (image prise telle quelle), plus de 64 couleurs (image peinte, ramenée à
  32 couleurs, matières moins nettes). Refus au-delà de 400 pixels dessinés de côté (indiquer la
  taille d'un pixel). PNG conseillé : un JPG abîme les aplats et la grille.
- Grand sprite : réglages à l'échelle automatiquement (message « Grand sprite : réglages en
  pixels multipliés par s »), calcul plus long (Kainati : 1,5 s seul, 9 s pour 4 images).
- Rien n'est envoyé sur Internet ; ne pas mettre les images d'essai de l'utilisateur dans le dépôt.
- Contrôle du code de la page : `npm run lumiere:test-page` (Chrome / Edge sans fenêtre, variable
  `NAVIGATEUR` sinon) : calcul du navigateur = calcul de Node = cartes du jeu, sur le grizzly, un
  grizzly recollé sur fond blanc et agrandi x4, la marche d'Agarica.

## En jeu : LightKit (opt-in)

Rien ne change tant qu'une scène n'appelle pas `LightKit.activer`. BootScene précharge les cartes
du manifeste ; chaque frame qui a des cartes est éclairée en sections, une frame sans carte est
éclairée à plat (préparer toutes les animations visibles d'un personnage éclairé).

```js
// create() d'une scène (WebGL ; renvoie false en Canvas, rien ne change)
LightKit.activer(this, { ambiance: 'nuit' });             // 'neutre' 0x5c5c5c, 'nuit' 0x55506a, 'jour', ou 0xRRGGBB
LightKit.eclairer(this.player);                           // un objet ou une liste ; nePlusEclairer() pour revenir
const torche = LightKit.ajouterLumiere(this, 'torche', { x: 640, y: 380 });
LightKit.suivre(torche, this.player, 30, -40);           // ou LightKit.deplacer(torche, x, y, profondeur)
LightKit.ajouterLumiere(this, 'lune', { x: 200, y: -300 });
LightKit.regler(torche, { profondeur: -20, portee: 300 }); // couleur, intensite, portee, profondeur
LightKit.reglerRendu(this, { paliers: 4, contre: 1.5, hemi: 0.05, detail: 0.7, epaule: 0.8 }); // ou ciel / sol : [r, g, b]
const soleil = LightKit.ajouterSoleil(this, { direction: { x: -0.25, y: 0.95, z: 0.2 }, intensite: 0.09 });
```

Lampe = `{ x, y, profondeur, couleur, intensite, portee }` en px du MONDE ; `profondeur` < 0 =
derrière le plan du sprite (contre-jour). Préréglages : `torche` (0xffb35c, portée 220,
profondeur 8), `lune` (0x9fb8ff, 0,8, portée 900, profondeur 30), `blanc`, `contrejour`
(torche à -20). Au plus 10 lampes visibles (Phaser, `maxLights`).

**Soleil** (`ajouterSoleil`) : lumière DIRECTIONNELLE fixe, même direction pour tous les pixels, sans position,
portée ni atténuation : le rendu ne change ni avec la caméra, ni avec le joueur, ni avec la place du sprite.
`direction` pointe VERS le soleil (x droite, y haut, z vers le spectateur). Plein jour : `ciel` = `sol` = 1,
`detail` 1 et `epaule` 0,95 redonnent le sprite d'origine, le soleil (0,09) n'ajoute qu'un léger éclaircissement
aux plans tournés vers le haut. Sous un abri : `soleil.attenuation = (o) => dessous(o) ? 0 : 1` et
`reglerRendu(this, { ombre: (o) => dessous(o) ? 0.82 : 1 })` (assombrit tout le sprite uniformément).

Réglages conseillés : torche à **+8** (près du plan) ; lune loin et haut, grande portée ;
contre-jour entre **-10 et -40**, contre 1,5 ; ambiance 0,3-0,4 la nuit ; 4 paliers.
**Grand ennemi (boss, Kainati)** : la portée des préréglages (220 px du monde) n'éclaire qu'un
bout de lui. Prendre `LightKit.porteeConseillee(boss)` (3 fois sa diagonale affichée) :
`LightKit.regler(torche, { portee: LightKit.porteeConseillee(boss) })` ; profondeur à l'échelle
aussi (devant : +8 à +20 ; derrière : -20 à -60 selon sa taille).

Mode de test sans toucher au code : `index.html?zone=foret_sombre_1&lumiere` (Agarica et tout
sprite préparé éclairés, nuit, torche au pointeur, molette = profondeur, lune) ;
`&lumiere=-20` = profondeur de départ.

## Taille à l'écran (règle des cartes)

Le jeu affiche ses sprites bien plus petits que la page de test : les cartes sont faites À LA TAILLE VUE
EN JEU, une case = np pixels d'écran entiers (np = max(1, round(échelle × f))). Toujours passer
`--echelle-jeu <setScale du code>` ; `npm run lumiere:cartes` refait tous les sprites préparés avec
leurs échelles (`tools/lumiere/cartes-jeu.js`, à compléter pour un nouveau sprite).

| Asset | Fichier | f pixel-fixer | setScale | Zoom | À l'écran | Px écran par pixel dessiné, avant -> cartes |
|---|---|---|---|---|---|---|
| Agarica (marche) | 261 x 357 | 3,76 | 0,24 | 1 | 61 x 85 | 0,90 -> 1 |
| Loup | 422 x 267 | 2,5 | 0,4 | 1 | 116 x 69 | 1 -> 1 |
| Grizzly | 352 x 319 | 4,75 / 4,13 / 3,65 | 0,4214 | 1 | 146 x 110 | 2 / 1,74 / 1,54 -> 2 |
| Crapaud | 1434 x 237 | 2,5 | 0,26 | 1 | 369 x 58 | 0,65 -> 1 |
| Kainati | 388 x 396 | 1,08 | 0,6 | 1 | 199 x 218 | 0,65 -> 1 |

- Réduction : chaque case prend la couleur la plus présente (traits sombres comptés double, couleurs de
  l'image gardées) ; si la grille dessinée tombe déjà juste (loup), elle est gardée telle quelle.
- L'échelle s des grands sprites se calcule donc sur la taille à l'écran (Kainati : 1,69).
- En jeu, LightKit cale les cases sur les pixels d'écran (caméra à zoom entier, sans rotation).
- Page de test : case « Taille reelle en jeu » ; pour vos images, champ « Échelle en jeu ».
- À reporter dans `sections.py` : `grilleEcran` et `echantillonnerEcran` de `coeur.js`, champs `ech` et
  `np` du manifeste, `--echelle-jeu` sur un sprite pixel-fixer.

## Labo d'éclairage en jeu (zone de test)

`index.html?zone=labo_lumiere&lumiere` : zone fermée construite comme une vraie zone
(`src/data/labo_lumiere_data.js`, `src/scenes/LaboLumiereScene.js`), Agarica jouable, loup, grizzly, crapaud
et Kainati immobiles à leur échelle du jeu dans chaque partie. Trois parties de 1920 px, ambiance et
lampes en fondu au passage (sur 360 px) :
- **Nuit** : champignons lumineux (décor du jeu, pulsation lente), lucioles (`fx_luciole`, s'allument et
  s'éteignent), feu de camp (animation du jeu, sans son menu, vacille), lampe qui passe derrière Kainati ;
- **Soleil** : sprite d'origine (ciel = sol = 1, détail 1) et soleil directionnel très faible sur le dessus ;
  auvent (marqueur dessiné) : plus de soleil dessous, sprite uniformément à 82 % ;
- **Banc d'essai** : torche au pointeur, lune, lampe derrière Kainati, lampe qui passe de devant à derrière
  (loup), lampe tournante (grizzly), trois couleurs (crapaud), Agarica retournée sous une lampe fixe.

Au plus 10 lampes à la fois (`maxLights` de Phaser) : le labo n'allume que celles qui atteignent la vue,
les prioritaires puis les plus proches. Aucun lien depuis le jeu ; sans `?lumiere` ni cette zone, les cartes
ne sont même pas chargées (`TOUJOURS` dans LightKit.js le jour où une vraie zone éclaire).

| Touche | Effet |
|---|---|
| U / J | réglage précédent / suivant (profondeur, portée, intensité, couleur, ciel, sol, détail, contre-jour, paliers) |
| H / L | baisser / monter la valeur |
| N | groupe de lampes suivant dans la partie |
| Y | aller à la partie suivante |
| Z | zoom x1, x1,5, x2 (rendu interne 1920 x 1080, caméra à zoom entier : pixels réguliers) |
| G | éclairage activé / désactivé (comparaison immédiate) |
| O | sprites d'origine (personnages sans éclairage, décor toujours éclairé) |
| V | décor éclairé à plat ou non |
| T | écran net (canvas agrandi sans lissage du navigateur) |
| C | copie les réglages de la partie (presse-papiers et console) : à transmettre tels quels |
| W | masquer le panneau |

Le panneau est un élément HTML posé sur le canvas : même place et même taille à tous les zooms, police selon la
fenêtre. La caméra se recale aussitôt après Y et Z et ne montre jamais sous le bas du monde. Il affiche la partie, les lampes actives, la taille à l'écran de chaque mannequin, ses pixels
d'écran par case, et la frame d'Agarica si elle n'a pas de cartes.

## Retoucher les cartes à la main

Toujours dans cet ordre : d'abord les sections (lumière de face), puis la carte contre-jour,
car `--depuis-sections` recalcule aussi la carte contre-jour (et écrase sa retouche).

**Sections (face)** : peindre `_lumiere/<nom>_sections.png` avec les couleurs EXACTES
ci-dessous (sans antialiasing ; la couleur la plus proche est prise de toute façon), puis
`npm run sections -- --depuis-sections assets/.../<nom>.png` (recalcule `_n.png` et la carte
contre-jour). Même famille de teinte = même direction (clair = incliné 40°, foncé = rasant 68°).

| Section | Couleur | | Section | Couleur |
|---|---|---|---|---|
| face | #c8c8c8 | | | |
| droite incliné | #fa7070 | | droite rasant | #9e0808 |
| haut-droite incliné | #fad870 | | haut-droite rasant | #9e7908 |
| haut incliné | #b5fa70 | | haut rasant | #539e08 |
| haut-gauche incliné | #70fa93 | | haut-gauche rasant | #089e2d |
| gauche incliné | #70fafa | | gauche rasant | #089e9e |
| bas-gauche incliné | #7093fa | | bas-gauche rasant | #082d9e |
| bas incliné | #b570fa | | bas rasant | #53089e |
| bas-droite incliné | #fa70d8 | | bas-droite rasant | #9e0879 |

Normales : R = x (droite), G = y (HAUT), B = z (vers le spectateur), n = rgb / 255 × 2 − 1.

**Carte contre-jour (arrière)** : peindre `_lumiere/<nom>_cj-apercu.png`. Teinte = direction
d'où la lumière de derrière arrive sur ce bord (rouge 0° = droite, jaune-vert 90° = haut, cyan
180° = gauche, bleu-violet 270° = bas, sens trigonométrique, comme la roue des sections) ;
clarté = exposition (noir = rien ; plus c'est clair, plus le bord s'allume) ; gris ou noir =
pas d'exposition. Pour éteindre une zone qui s'allume à tort : la peindre en noir ; pour en
allumer une : la teinte de sa direction, plus ou moins claire. Puis
`npm run sections -- --depuis-cj assets/.../<nom>.png` (réécrit `_cj.png`). Format de
`_cj.png` : R, G = direction (x droite, y haut, v = c / 255 × 2 − 1, 128 = aucune), B =
exposition 0-255, A = 255 sur le sprite.
Calcul automatique : sources = pixels qui touchent le vide ; l'exposition se propage SEULEMENT
dans la même section, les traits sombres intérieurs (luminance < 0,16 à plus de 2 px du vide)
font mur ; elle décroît sur la largeur de la zone (au plus 12 px) et vaut |n.xy| / 0,93 de la
section au bord (rasante 1, inclinée 0,69, face 0) ; frange d'adoucissement de 2 px (× 0,5 par
pixel, jamais à travers un trait).

## Vérifier (dans cet ordre)

1. `npm run lumiere:tests` : batterie sans navigateur (version CPU du shader sur les vraies
   cartes). Deux lignes « 0 » contrôlent le code (shader du jeu = page validée, GLSL = CPU) ;
   les autres : monotonie quand la lampe approche d'un côté, symétrie demi-sphère, continuité en
   profondeur et en largeur, pas de bande au contour, lumière devant = N.L, contour sombre
   ≤ 1 palier, adoucissement, fidélité à +49, milieu sombre (aucun pixel d'une section non
   reliée au bord allumé par une lampe derrière). Code 1 si un test échoue : lire la ligne.
   État au 2026-11-17 (v16) : 80 / 81 sur les cartes du jeu ; échec connu : Kainati, test 11
   (palier maximal 2 % des plans exposés à -49 pour un critère de 3 %).
2. `npm run lumiere:apercu [-- <anim|png>]` : page autonome dans `tools/lumiere/sortie/`
   (ignoré par git) ; donner le chemin à l'utilisateur. Lumière à glisser, profondeur, sens,
   animation, affichage des sections / normales / carte contre-jour. `--regarde gauche` pour un sprite dessiné
   tourné vers la gauche.
3. En jeu : `?zone=<zone>&lumiere`. L'utilisateur teste lui-même (ne pas lancer le jeu sans
   qu'il le demande).
4. `npm run sections -- verifier` : cartes à refaire parce que l'image du jeu a changé depuis
   (après un nouveau passage pixelfix, refaire les sections).

## Sur une nouvelle installation

- Node 18 ou plus, rien d'autre : pas de `npm install` (aucune dépendance), pas de Python, pas
  besoin du skill `pixel-art-forge`. Les commandes ci-dessus marchent dès le clone.
- Seulement pour pixel-fixer (étape 1) : `git submodule update --init` puis `npm install` dans
  `tools/pixel-fixer`.
- Le modèle de lumière est dans le dépôt : `tools/lumiere/apercu.html` (page validée, copie du
  gabarit du skill), `src/utils/LightKit.js` (même `eclairage()` en GLSL), `tools/lumiere/cpu.js`
  (même `eclairage()` en JS). Nouvelle version du modèle : recopier le gabarit dans
  `apercu.html` (en gardant le commentaire d'en-tête), reporter le corps de `eclairage()` dans
  `FRAG_ECLAIRAGE` de LightKit.js et dans cpu.js, relancer `npm run lumiere:tests` (les lignes
  « 0 » disent ce qui diffère).

## Grands sprites (échelle s)

Les réglages en pixels du découpage ont été mis au point sur les sprites de la démo (Agarica,
loup, grizzly, crapaud : racine de la surface opaque de 49 à 87 px). Un sprite plus grand
(Kainati, ~250 px) les prend à l'échelle **s = max(1, racine(surface opaque) / 96)** (médiane
des frames d'une animation ; arrondi au centième). s = 1 : rien ne change (cartes identiques à
`sections.py`). s > 1 (calculé et noté `s` dans le manifeste, sans option à donner) :
- sections : zones minimales × s², lissages, contour extérieur, bombé des parties × s, filtre
  majoritaire × s passes : de grands plans qui suivent les masses (épaule, bras, cuisse) au lieu
  d'éclats en escalier (Kainati : 951 zones -> 465, frontières -42 %, marches -49 %) ;
- carte contre-jour : décroissance jusqu'à 12 s px, contour 2 s, frange 2 s px, direction lissée
  2 s : de larges plans sur le bord, plus un liseré de 1-3 px (Kainati : bord exposé 11 % -> 36 %) ;
- neutre détaillé : seul l'ombrage à grande échelle est retiré, mèches et nuances gardées dans la
  palette (détail de la fourrure 0,4 % -> 2,1 %, l'original est à 2,0 %) ; les matières claires
  gardent leur valeur, les hautes lumières sont tenues par l'épaule du shader ;
- shader : normale lissée échantillonnée tous les round(s) px ; page de test : portée jusqu'à
  3 fois la diagonale, profondeur ± diagonale / 6 ;
- **plus de sections** (« il faut le sectionner davantage ») :
  - table FINE : face + 3 bagues (25°, 50°, 70°) × 12 azimuts (tous les 30°), codes 17 à 52 ;
    seuils de |n.xy| : face < 0,22 < 25° < 0,50 < 50° < 0,85 < 70° ;
  - dôme sur TOUTE la partie : rayon du bombé = 0,5 × profondeur réelle de la partie (au lieu de
    3 s px au plus) : plusieurs bagues du bord vers le centre ;
  - masses : partage des eaux sur (épaisseur du corps + 2 s × ombrage flouté de l'original,
    3 boîtes de rayon 2 s) ; les cols deviennent des frontières de partie ; fusion sous
    max(s ; 15 % du sommet) de profondeur ou 80 s² px ;
  - traits épaissis de round(s) px (disque) au lieu de 1, pixels rendus aux parties en 4 s passes ;
  - carte contre-jour : propagation dans la même DIRECTION (12 azimuts), toutes bagues confondues.
  Kainati : pixels de face 26 % -> 12 %, 17 -> 37 directions, 4 niveaux (face, 25, 50, 70°).
  Retouche : peindre `_sections.png` avec les couleurs de la table fine (teinte = direction,
  pâle = 25°, moyen = 50°, foncé = 70° ; `SECTIONS` de coeur.js, indices 17 à 52) ;
  `--depuis-sections` lit la table fine quand le manifeste porte `s` > 1.
  Limites : l'anatomie (épaule, biceps) n'est découpée que si l'original la dessine par des traits
  ou des ombres ; sur une animation, ces masses changent d'une pose à l'autre (Kainati : 63 %
  d'orientations changeantes avant lissage, 25 % après, contre 11 % avant ce changement).

## Le modèle en bref (v16)

Couleur = dessin × ambiance(n) + neutre × Σ couleur × intensité × palier(min(diff + cj, 1)), puis épaule.
Pour un soleil, min(diff + cj, 1) est remplacé par `directionnel()` = max(N·d, 0) (contour sombre : au plus 1 palier).
- **Ambiance ciel / sol** : ambiance(n) = mix(sol, ciel, 0,5 + 0,5 n.y), avec ciel et sol presque égaux (hemi 0,05) :
  l'utilisateur ne veut pas d'ombre marquée vers le bas, le volume vient d'une faible lumière sur le dessus.
- **Détail dans l'ombre** : dessin = mix(neutre, `_natif.png`, détail) (0,7 par défaut) : l'ambiance garde
  le dessin d'origine sur la grille des cartes, la lampe reste neutre × N·L (pas d'ombrage compté deux fois).
- **Épaule** : au-dessus de 0,8, la composante la plus forte est tassée vers le blanc sans l'atteindre, les
  trois canaux au même rapport (teinte gardée). Elle agit sur la somme, après les paliers : la courbe étant
  strictement croissante, chaque palier reste distinct jusque dans les blancs. Sans lampe active, ciel = sol = 1,
  détail = 1, épaule coupée : l'image est celle du jeu.

Poids « derrière » wb = smoothstep(15, −15, z).
`diff` = N·L × atténuation (normale de la section, mélangée à la normale lissée 5×5 et avec un
léger « wrap » quand wb > 0), × mix(1, exposition, wb) : la part « derrière » n'atteint que les
bords exposés de la carte contre-jour. Le **contre-jour** `cj` est la même réponse en cosinus
que la lumière de face, appliquée à la normale basculée vers la lampe : le bord exposé (direction
de la carte) vu comme une rasante basculée (angle au spectateur θ → 90° − θ), lampe en miroir
devant le plan (|z|) : cj = 0,6 × contre × wb × exposition × max((0,37 v·d.xy + 0,93 |z|) / dist,
0) × atténuation. Lampe devant (z ≥ 15) : wb = 0, exactement N·L, la carte contre-jour ne joue
pas. Contour sombre (luminance < 0,16) : pas de contre-jour, au plus 1 palier. UNE formule pour
toutes les positions de lampe, un seul palier à la fin.

## Pièges (leçons du réglage avec l'utilisateur)

- **Lampe trop loin devant** : le sommet des formes s'assombrit quand elle est proche (la face
  reçoit mieux que les rasantes du haut). Torche à ~8 px devant, pas 50.
- **Pas de liseré ni de bande** ajoutés par-dessus (ni couleur de lampe plaquée sur le contour,
  ni couronne, ni halo) : le contre-jour passe par les SECTIONS existantes, matière × lumière,
  mêmes paliers. Un terme basé sur la distance au bord fait toujours un anneau d'épaisseur
  constante (« effet bande sur les côtés ») : la rasance vient des sections.
- **Pas de règles tout-ou-rien** empilées sur des normales quantifiées (taches éparses, « logique
  forcée ») : un modèle continu, quantifié UNE fois à la fin.
- **Pas de bascule devant / derrière** : une formule devant et une derrière = changement de mode
  visible quand la lampe passe z = 0 ; poids lisses (smoothstep sur z), une seule formule.
- **Lampe cachée plus forte que lampe visible** (v13) : un côté doit s'éclairer de plus en plus
  quand la lampe s'en approche, y compris quand elle sort de la silhouette (test « monotonie »).
- **Bords à fond sans palier intermédiaire** (v14) : une rasante au palier max ne doit pas
  toucher directement une voisine à l'ambiance (test « adoucissement »).
- **La lumière de derrière ne doit jamais allumer le milieu ; elle passe uniquement par la carte
  contre-jour** (v16). Les normales de face ne disent pas ce qui est exposé par l'arrière : toute
  règle qui le devine depuis elles (bande, taches, bascule, milieu éclairé) échoue quelque part.
  Une information qui manque se met dans une carte dédiée, générée et retouchable, pas dans une
  règle de plus dans le shader. Un milieu qui s'allume à contre-jour se corrige dans
  `_cj-apercu.png` (en noir), pas dans le code.
- **Contre-jour réinventé** (v15) : ne pas empiler puissances, seuils et rayons ad hoc pour
  imiter l'effet de face ; reprendre la MÊME fonction (cosinus N·L) sur une orientation
  transformée. Mesurer la référence (+49) avant de fixer un objectif : +49 a déjà des sauts de
  3 paliers entre sections voisines, « sans saut brutal » est une impression d'étagement.
- **Clignotement d'animation** : toutes les frames en UNE commande `--animation` (même grille,
  même palette, mêmes matières, lissage dans le temps), jamais frame par frame.
- **Contour #212121** : luminance 0,13, doit être reconnu sombre (seuil 0,16), sinon il prend la
  couleur de la lampe (vert foncé visible sous une lampe verte).
- **flipX** : la carte n'est pas retournée par Phaser ; LightKit lit l'image en miroir ET inverse
  normal.x (sinon la lumière éclaire le mauvais côté). flipY n'est pas pris en charge.
- **Objets éclairés** : chacun coûte un appel de dessin et quitte le pipeline de LookKit (pas
  d'étalonnage de zone sur lui ; LookKit ne touche jamais un pipeline posé par le jeu).
- Sprite refait par pixelfix ou retouché : refaire les sections (`npm run sections -- verifier`).
- **Réglages en pixels absolus sur un grand sprite** : un seuil pensé pour 60-100 px (zone
  minimale, lissage, frange de 2 px) fait des éclats en escalier et un liseré de contre-jour en
  pointillés sur un sprite de 300-400 px. Tout réglage en pixels passe par l'échelle s (coeur.js :
  `aL` pour une longueur, `aS` pour une surface), et s = 1 doit redonner le calcul d'origine.
- **Neutre en aplats sur un sprite détaillé** : la moyenne par matière efface le dessin (fourrure
  devenue lisse). Retirer seulement l'ombrage à grande échelle ; et laisser de la marge sous le
  blanc, sinon les matières claires saturent dès le 2e palier.
