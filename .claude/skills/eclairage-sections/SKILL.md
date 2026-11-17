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
   - image encore peinte (absente de `pixel_fixed.js`) : `--echelle-jeu <setScale du code>`
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
LightKit.reglerRendu(this, { paliers: 4, contre: 1.5 });
```

Lampe = `{ x, y, profondeur, couleur, intensite, portee }` en px du MONDE ; `profondeur` < 0 =
derrière le plan du sprite (contre-jour). Préréglages : `torche` (0xffb35c, portée 220,
profondeur 8), `lune` (0x9fb8ff, 0,8, portée 900, profondeur 30), `blanc`, `contrejour`
(torche à -20). Au plus 10 lampes visibles (Phaser, `maxLights`).

Réglages conseillés : torche à **+8** (près du plan) ; lune loin et haut, grande portée ;
contre-jour entre **-10 et -40**, contre 1,5 ; ambiance 0,3-0,4 la nuit ; 4 paliers.

Mode de test sans toucher au code : `index.html?zone=foret_sombre_1&lumiere` (Agarica et tout
sprite préparé éclairés, nuit, torche au pointeur, molette = profondeur, lune) ;
`&lumiere=-20` = profondeur de départ.

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
   État au 2026-11-17 (v16) : 68 / 68 sur les cartes du jeu.
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

## Le modèle en bref (v16)

Lumière = ambiance + Σ couleur × intensité × palier(min(diff + cj, 1)), MULTIPLIÉE par la couleur
du neutre (aucune part additive de la lampe). Poids « derrière » wb = smoothstep(15, −15, z).
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
