// Petits helpers partagés entre les scènes de zone (terrain + décor lunaire),
// pour éviter de dupliquer ce code dans chaque Zone*Scene.
const GROUND_HITBOX_KEY = 'ground-hitbox';
// 64 (pas 32) : à 32 les blocs de assets/decors/surface.png (dessinés bien
// plus grands nativement, cf. tools/crop_ground.py) ressortaient minuscules
// une fois réduits à la taille de la grille — doublé pour que le sol reste
// lisible à l'écran. Toutes les scènes dérivent leurs décalages (totems,
// marche, etc.) de cette constante plutôt que de recalculer un demi/plein
// bloc en dur, donc la retoucher suffit à tout resynchroniser.
const GROUND_TILE_SIZE = 64;
const TREE_TEXTURE_KEY = 'treeline-placeholder';

// Sol : la hitbox (physique, un carré GROUND_TILE_SIZE invisible) est
// entièrement découplée du rendu (image décorative, voir addGroundTileVisual
// ci-dessous) — texture 100% transparente, jamais affichée (sprite mis en
// `visible(false)`), seulement support du static body Arcade. Ctrl+I continue
// d'afficher le contour réel du body (cf. setupDebugToggle), indépendant du
// visuel : ça permet de retravailler l'art du sol (assets/decors/surface.png)
// sans jamais toucher au gameplay (arcs de saut, largeur des fosses, etc.
// calés sur cette grille).
function ensureGroundHitboxTexture(scene) {
  if (scene.textures.exists(GROUND_HITBOX_KEY)) return;
  // Graphics vide -> generateTexture produit un carré 100% transparent
  // (même technique que ensureGroundTexture/ensureTreeTexture avant elle).
  const g = scene.add.graphics();
  g.generateTexture(GROUND_HITBOX_KEY, GROUND_TILE_SIZE, GROUND_TILE_SIZE);
  g.destroy();
}

// Blocs de sol (assets/decors/surface.png, lignes "SOL SURFACE"/"TERRE
// MILIEU"/"SOUS-SOL PROFOND" — voir tools/crop_ground.py), chacun recadré
// individuellement et serré (petit pad uniforme, pas de canvas partagé) :
// des tuiles collées sur un même canvas plus large que leur contenu, centrées
// dedans, ont déjà laissé une marge transparente qui, une fois mise à
// l'échelle de GROUND_TILE_SIZE, se voyait comme un vide entre les blocs —
// voir git history de ce fichier. Variantes piochées au hasard par bloc
// pour varier le rendu, comme la forêt/les plantes procédurales ci-dessous.
const GROUND_ART_COUNT = 7;
const GROUND_ART_PREFIX = 'ground-art-';
const DIRT_ART_COUNT = 8;
const DIRT_ART_PREFIX = 'dirt-art-';
const ROCK_ART_COUNT = 8;
const ROCK_ART_PREFIX = 'rock-art-';

// Sous la tuile de surface (herbe), quelques rangées de remplissage
// purement visuelles (terre puis roche, aucune hitbox propre — le sol reste
// un seul bloc de collision, cf. ensureGroundHitboxTexture) pour qu'un bord
// de sol (fosse, bord de plateforme flottante) ou une salle où le sol
// n'affleure pas le bas de l'écran (cf. SousGrotteScene) montre une vraie
// épaisseur de terre/roche au lieu de laisser voir le fond de la scène sous
// un bloc d'herbe qui semblerait alors flotter. 5 rangées : assez profond
// pour couvrir la fosse la plus profonde du jeu (300px, cf. Zone2/Zone4) à
// GROUND_TILE_SIZE=64. Les 2 premières rangées en terre, le reste en roche.
const FILL_DEPTH = 5;
const FILL_DIRT_LAYERS = 2;

// Le crop de tools/crop_ground.py et tools/crop_autotile.py n'est jamais
// tout à fait pixel-parfait (anti-crénelage sur le bord du contenu) — à
// taille pile GROUND_TILE_SIZE, ce dixième de pixel d'écart pouvait laisser
// un mince liseré transparent entre deux tuiles voisines. Chaque tuile est
// donc affichée volontairement un peu plus grande que sa case et centrée/
// ancrée dessus quand même, pour déborder légèrement sur ses voisines
// plutôt que risquer un vide entre elles — l'empiètement ne se voit pas
// (même texture terre/roche des deux côtés du bord). Revenu à 3 (pas 9) une
// fois tools/crop_autotile.py corrigé (bornes de case calées sur le centre
// du trait de contour partagé, plus de contamination de tuile voisine cf.
// git history) — 9 masquait un vrai défaut de découpe, pas juste
// l'anti-crénelage, et grossissait les tuiles au-delà du nécessaire.
const GROUND_TILE_OVERLAP = 3;

// Overlap dédié à renderAutotileGrid (floor.png / tools/crop_autotile.py),
// séparé de GROUND_TILE_OVERLAP ci-dessus qui reste au service des tuiles
// de remplissage (assets/decors/surface.png / tools/crop_ground.py) — pas
// le même pipeline de découpe, pas forcément le même besoin de marge.
// Retour utilisateur : à 3, le débordement de chaque tuile hors de sa
// case était visible en mode éditeur (grille de création affichée,
// "les tuile sont un poil plus grosse que les carré de la grille").
// D'abord monté à 2 (minimum qui masquait encore un vrai souci de fond :
// tools/crop_autotile.py, cf. flatten_to_opaque()) puis redescendu ici
// une fois CE souci corrigé à la source plutôt que masqué par la taille.
// Le vrai problème n'était pas un simple arrondi de sous-pixel : les
// cases de floor.png sont dessinées comme des "cartes" à coins arrondis
// avec un dégradé de transparence sur tout leur pourtour (~20-25px,
// confirmé pixel par pixel), pas des tuiles à bord franc — même à taille
// pile exacte, ce liseré semi-transparent laissait voir le fond derrière.
// `flatten_to_opaque()` étend la couleur valide vers l'extérieur et force
// l'opacité sur les tuiles de remplissage (dirt_c/var*, aucune
// transparence légitime à préserver) : une fois ce dégradé éliminé à la
// source, un pavage large (18x8) ne montre plus aucun trou même à 0.5,
// contre 2 avant. Gardé à 0.5 (pas 0) par prudence résiduelle pour
// l'arrondi de sous-pixel générique du renderer, mais désormais
// quasi-imperceptible. Les 9 autres positions (bords/coins/angle) n'ont
// pas ce traitement (art légitime à préserver dessus, ex. le ciel entre
// les tiges de champignon du haut) et comptent donc encore sur cet
// overlap pour masquer leur propre dégradé de bord.
const AUTOTILE_OVERLAP = 0.5;

// Contrairement au bloc de surface (bord bas fiable, bord haut variable —
// débordement d'herbe/champignons), les tuiles de remplissage n'ont pas de
// débordement et doivent s'emboîter pile des 4 côtés (tuile du dessus,
// tuile du dessous, voisines) : affichées à une taille carrée forcée
// (setDisplaySize) plutôt qu'une simple mise à l'échelle par la largeur,
// pour ignorer le ratio natif de la planche et garantir un carré
// GROUND_TILE_SIZE pile, sans quoi un léger écart de hauteur entre variantes
// aurait fini par décaler l'empilement colonne après colonne. La hauteur ne
// déborde que d'un côté (GROUND_TILE_OVERLAP, pas ×2) : avec l'origine
// calée sur le bord "vers la pièce" (bas pour un sol, haut pour un
// plafond), ce bord-là reste pile sur la case — c'est la tuile plus
// profonde qui empiète sur celle-ci en poussant vers la surface, pas
// l'inverse, donc chaque jonction n'est couverte que par un seul côté.
function addFillTileVisual(scene, cellCenterX, cellCenterY, ceiling, useRock) {
  const key = useRock
    ? `${ROCK_ART_PREFIX}${Phaser.Math.Between(0, ROCK_ART_COUNT - 1)}`
    : `${DIRT_ART_PREFIX}${Phaser.Math.Between(0, DIRT_ART_COUNT - 1)}`;
  const y = ceiling ? cellCenterY - GROUND_TILE_SIZE / 2 : cellCenterY + GROUND_TILE_SIZE / 2;
  const img = scene.add.image(cellCenterX, y, key).setFlipX(Math.random() < 0.5);
  img.setDisplaySize(GROUND_TILE_SIZE + GROUND_TILE_OVERLAP * 2, GROUND_TILE_SIZE + GROUND_TILE_OVERLAP);
  img.setOrigin(0.5, ceiling ? 0 : 1);
}

// Ancre une image de bloc de sol sur la grille de hitbox (voir
// ensureGroundHitboxTexture) sans jamais toucher au body physique : le bord
// bas du sprite (repère fiable, cf. commentaire GROUND_ART_COUNT) est calé
// sur le bord bas de la case pour un sol, sur son bord haut (image retournée
// verticalement) pour un plafond — dans les deux cas le débordement décoratif
// (herbe/champignons) part vers la pièce plutôt que vers la roche invisible.
// Légèrement surdimensionnée (GROUND_TILE_OVERLAP) pour la même raison que
// addFillTileVisual — ici une mise à l'échelle uniforme suffit (pas de
// setDisplaySize) puisque le débordement d'herbe doit rester proportionnel.
// Empile ensuite FILL_DEPTH rangées de terre/roche purement visuelles sous
// (ou au-dessus, pour un plafond) cette tuile de surface — voir addFillTileVisual.
function addGroundTileVisual(scene, cellCenterX, cellCenterY, ceiling) {
  const key = `${GROUND_ART_PREFIX}${Phaser.Math.Between(0, GROUND_ART_COUNT - 1)}`;
  const y = ceiling ? cellCenterY - GROUND_TILE_SIZE / 2 : cellCenterY + GROUND_TILE_SIZE / 2;
  const img = scene.add.image(cellCenterX, y, key).setFlipX(Math.random() < 0.5);
  img.setScale((GROUND_TILE_SIZE + GROUND_TILE_OVERLAP * 2) / img.width);
  if (ceiling) {
    img.setFlipY(true).setOrigin(0.5, 0);
  } else {
    img.setOrigin(0.5, 1);
  }

  for (let n = 1; n <= FILL_DEPTH; n++) {
    const fillCenterY = ceiling
      ? cellCenterY - n * GROUND_TILE_SIZE
      : cellCenterY + n * GROUND_TILE_SIZE;
    addFillTileVisual(scene, cellCenterX, fillCenterY, ceiling, n > FILL_DIRT_LAYERS);
  }
}

function ensureTreeTexture(scene, width, height) {
  if (scene.textures.exists(TREE_TEXTURE_KEY)) return;

  const g = scene.add.graphics();
  g.fillStyle(0x140e24, 1);
  const treeWidth = 90;
  for (let x = 0; x < width; x += treeWidth) {
    const treeHeight = height * (0.55 + 0.35 * Math.sin(x * 0.013));
    const topY = height - treeHeight;
    g.fillTriangle(x, height, x + treeWidth * 0.5, topY, x + treeWidth, height);
  }
  g.generateTexture(TREE_TEXTURE_KEY, width, height);
  g.destroy();
}

// Décor en plans de profondeur (assets/decors/, voir tools/split_spritesheet.py).
// Remplace l'ancien dégradé + lune + ligne d'arbres procéduraux. Du plus loin
// au plus proche : plan4 (ciel/lune/montagnes, quasi immobile, TileSprite —
// seul plan resté une bande tuilée fixe, pas de découpe individuelle prévue),
// plan3 (forêt, arbres individuels — addProceduralForest), plan1 (plantes en
// premier plan devant le joueur — addProceduralGroundPlants/HangingPlants).
const DECOR_SOURCE_HEIGHT = 724;
const DECOR_FOREGROUND_DEPTH = 1000;
// Profondeur commune des personnages (joueur, Xara, PNJ, ennemis, boss, animaux
// terrestres) : devant les décors (props, totems, feux, 0 par défaut), derrière
// les plantes de premier plan (DECOR_FOREGROUND_DEPTH).
const CHARACTER_DEPTH = 10;

// Forêt procédurale (plan3, assets/decors/arbres_frames/, découpés depuis
// assets/decors/arbres.png par îlots de pixels connectés — voir
// tools/split_spritesheet.py) : arbres individuels dispersés le long du
// niveau à espacement variable, plutôt qu'une bande tuilée fixe — permet de
// sauter les fosses/l'eau (`avoidRanges`, cf. Zone2/Zone4/ZoneAquatique) et de
// varier le rendu (essence, échelle, miroir) au lieu d'un motif qui se répète
// à l'identique.
const ARBRE_COUNT = 8;
const ARBRE_TEXTURE_PREFIX = 'decor-arbre-';
// 1.15 (pas 0.75) : les arbres paraissaient chétifs/trop bas par rapport au
// sol une fois celui-ci agrandi (cf. GROUND_TILE_SIZE) — plus grands pour
// dominer réellement le sol plutôt que de flotter au même gabarit qu'avant.
// Puis 1.35 (retour utilisateur : "les arbres au fond sont un peu trop bas
// et petits", cf. aussi ARBRE_GROUND_CLEARANCE).
const ARBRE_BASE_SCALE = 1.35;
// Espacement élargi en conséquence : au même espacement qu'avant, des
// arbres 53% plus grands se seraient chevauchés en un mur de feuillage
// continu au lieu d'une forêt dispersée.
const ARBRE_SPACING_MIN = 180;
const ARBRE_SPACING_MAX = 320;
// Marge de chaque côté d'une fosse/zone d'eau : un élément planté juste au
// bord paraîtrait plaqué sur le vide plutôt que clairement dedans ou dehors.
// Partagée par la forêt (plan3) et les plantes de sol (plan1).
const DECOR_AVOID_CLEARANCE = 40;

function scatterAlongLevel(scene, levelWidth, avoidRanges, spacingMin, spacingMax, place) {
  const isAvoided = (x) => avoidRanges.some(
    ([start, end]) => x >= start - DECOR_AVOID_CLEARANCE && x <= end + DECOR_AVOID_CLEARANCE,
  );

  let x = Phaser.Math.Between(-20, 20);
  while (x < levelWidth) {
    if (!isAvoided(x)) place(x);
    x += Phaser.Math.Between(spacingMin, spacingMax);
  }
}

// Les nouvelles frames (assets/decors/arbres_frames/) sont recadrées au
// pixel près (rochers/herbe de la base juste au bord du cadre, même marge de
// 4px qu'ailleurs) — un gros enfoncement les enterrait jusqu'au tronc
// ("coincés dans le sol"). Juste de quoi couvrir cette marge, pas plus.
const ARBRE_SINK = 6;
// Les blocs de sol (assets/decors/surface_frames/ground_*.png, cf.
// addGroundTileVisual) affichent bien plus que GROUND_TILE_SIZE de terre
// une fois mis à l'échelle (herbe/champignons qui débordent par-dessus le
// bloc) — les arbres, eux, restaient calés au bord bas de l'écran comme
// avant l'agrandissement du sol, et se retrouvaient enterrés jusqu'au
// tronc derrière ce bloc bien plus haut qu'avant ("on ne voit que les
// feuilles"). Remonte le pied de l'arbre d'à peu près la hauteur visible
// du sol pour qu'il reparte de la ligne d'herbe plutôt que du bord d'écran.
// 75 : remontés en même temps que ARBRE_BASE_SCALE ("un peu trop bas" à 70),
// puis redescendus ("un peu trop haut" à 100, "encore trop haut, un peu" à 85).
const ARBRE_GROUND_CLEARANCE = 75;

// `base` (optionnel, cf. zoneBackdropSpec) : { y, scrollY, camLow } -- BAS
// VISIBLE de chaque arbre posé sur la ligne de base `y` (monde) quand la
// caméra est au plus bas, défilement vertical `scrollY` (1 = collé au monde,
// < 1 = plan plus lointain qui descend moins vite quand on monte).
function addProceduralForest(scene, height, levelWidth, avoidRanges = [], canopyView = false, screenBottom = false, base = null) {
  // Ligne de base / ciel qui se révèle : prioritaires sur l'ancien ancrage au
  // bas de l'ÉCRAN (`treesAtScreenBottom`, incompatible avec une caméra qui monte).
  if (base) screenBottom = false;
  // En altitude, la forêt reste plantée loin sous les plateformes : seules
  // les cimes dépassent dans le cadre. Tous les troncs gardent le même sol.
  const tallestTree = canopyView && !base ? Math.max(...Array.from({ length: ARBRE_COUNT }, (_, i) =>
    scene.textures.get(`${ARBRE_TEXTURE_PREFIX}${i}`).getSourceImage().height,
  )) * ARBRE_BASE_SCALE * 1.15 : 0;
  const groundY = screenBottom ? height + ARBRE_SINK
    : canopyView && !base ? height + tallestTree * 0.72
      : height - ARBRE_GROUND_CLEARANCE + ARBRE_SINK;
  const trees = [];
  scatterAlongLevel(scene, levelWidth, avoidRanges, ARBRE_SPACING_MIN, ARBRE_SPACING_MAX, (x) => {
    const variant = Phaser.Math.Between(0, ARBRE_COUNT - 1);
    const scale = ARBRE_BASE_SCALE * Phaser.Math.FloatBetween(0.85, 1.15);
    const img = scene.add.image(x, groundY, `${ARBRE_TEXTURE_PREFIX}${variant}`)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setFlipX(Math.random() < 0.5)
      // Au camp de Geralt, le pied du décor reste au bas du cadre.
      // Les autres forêts gardent leur ancrage vertical dans le monde.
      .setScrollFactor(0.35, screenBottom ? 0 : (base ? base.scrollY : 1));
    if (base) {
      // Le plan défile à `scrollY` : il est posé là où sa base coïncide avec
      // la ligne de base quand la caméra est au plus bas (camLow).
      setVisibleBottomY(img, base.y - base.camLow * (1 - base.scrollY) + BACKDROP_TREE_SINK);
    }
    trees.push(img);
  });
  return trees;
}

// Plantes de premier plan (plan1, assets/decors/plantes_frames/, découpées
// depuis assets/decors/plantes.png du même bloc pixels-connectés — voir
// tools/split_spritesheet.py). Deux familles, triées à la main par préfixe
// de fichier (b = bas, au sol devant le joueur ; h = haut, suspendues au
// plafond, cf. addCaveCeiling), même principe que la forêt du plan3 ci-dessus.
const PLANTE_BUSH_INDICES = [0, 1, 2, 4, 10, 12, 13, 14, 15, 16, 17, 18, 21, 26, 28, 29];
const PLANTE_HANGING_INDICES = [3, 7, 8, 9, 11, 19, 20, 22, 23, 24, 25, 27];
const PLANTE_BUSH_PREFIX = 'decor-plante-b-';
const PLANTE_HANGING_PREFIX = 'decor-plante-h-';
// Touffes de sol trop hautes / lianes de plafond pas assez hautes ("pas assez
// haut ... vice versa pour le bas") : rééquilibrées dans l'autre sens.
const PLANTE_BUSH_BASE_SCALE = 0.3;
const PLANTE_BUSH_SPACING_MIN = 50;
const PLANTE_BUSH_SPACING_MAX = 110;
const PLANTE_HANGING_BASE_SCALE = 0.6;
const PLANTE_HANGING_SPACING_MIN = 100;
const PLANTE_HANGING_SPACING_MAX = 220;
// Le feuillage de chaque frame a un contour naturellement irrégulier (pointes
// de feuilles), pas un bord plat — le pad de 4px de tools/split_spritesheet.py
// n'explique qu'une petite partie de l'espace vide vu entre les plantes et le
// bord de l'écran ("pas assez haut/bas"). Plutôt que de caler pile sur le
// pixel utile (ce qui laisserait les feuilles les plus courtes en retrait),
// on fait déborder franchement le cadre au-delà du bord — le surplus part
// hors-écran (invisible) et seule la partie basse, plus dense, du feuillage
// reste visible, ce qui referme la ligne de ciel/sol qui se voyait encore.
const PLANTE_HANGING_OVERLAP = 35;
const PLANTE_BUSH_OVERLAP = 30;

function addProceduralGroundPlants(scene, height, levelWidth, avoidRanges = []) {
  scatterAlongLevel(scene, levelWidth, avoidRanges, PLANTE_BUSH_SPACING_MIN, PLANTE_BUSH_SPACING_MAX, (x) => {
    const variant = Phaser.Utils.Array.GetRandom(PLANTE_BUSH_INDICES);
    const scale = PLANTE_BUSH_BASE_SCALE * Phaser.Math.FloatBetween(0.85, 1.2);
    scene.add.image(x, height + PLANTE_BUSH_OVERLAP * scale, `${PLANTE_BUSH_PREFIX}${variant}`)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setFlipX(Math.random() < 0.5)
      // X>1 : premier plan, devant le joueur — défile plus vite que lui, pas
      // plus lentement. Même facteur en Y (cf. commentaire détaillé sur
      // addProceduralForest ci-dessus -- l'ancien Y=0 gardait ces touffes
      // plaquées à l'écran plutôt que de suivre le sol réel dès que la
      // caméra scrolle verticalement, "monte avec moi" au lieu de rester à
      // la même hauteur).
      .setScrollFactor(1.08)
      .setDepth(DECOR_FOREGROUND_DEPTH);
  });
}

function addProceduralHangingPlants(scene, levelWidth) {
  scatterAlongLevel(scene, levelWidth, [], PLANTE_HANGING_SPACING_MIN, PLANTE_HANGING_SPACING_MAX, (x) => {
    const variant = Phaser.Utils.Array.GetRandom(PLANTE_HANGING_INDICES);
    const scale = PLANTE_HANGING_BASE_SCALE * Phaser.Math.FloatBetween(0.85, 1.2);
    scene.add.image(x, -PLANTE_HANGING_OVERLAP * scale, `${PLANTE_HANGING_PREFIX}${variant}`)
      .setOrigin(0.5, 0)
      .setScale(scale)
      .setFlipX(Math.random() < 0.5)
      // Même facteur en Y qu'en X (cf. commentaire détaillé sur
      // addProceduralForest plus haut) -- l'ancien Y=0 gardait ces lianes
      // plaquées au bord haut de l'écran au lieu de suivre le plafond réel.
      .setScrollFactor(0.4)
      .setAlpha(0.85);
  });
}

// `background` (optionnel, clé de zone `background`) : id d'un fond de
// ITEM_MANIFEST (texture `item-<id>`) qui remplace le ciel plan4 ; plan4 reste
// le repli tant que l'image n'existe pas.
// `backdrop` (cf. zoneBackdropSpec, tout optionnel) : { baseline, groundLine,
// camLow, camHigh, sky, treesScrollY } -- ligne de base des fonds, plage de
// défilement vertical de la caméra, ciel qui se révèle (skyReveal). Sans
// aucune de ces options : rendu historique à l'identique.
function addMoonlitDecor(scene, width, height, levelWidth, avoidRanges = [], background = null, largeTrees = true, treesAtScreenBottom = false, backdrop = {}) {
  const coverWidth = Math.ceil(levelWidth * 1.4);
  const bgKey = background && scene.textures.exists(`item-${background}`) ? `item-${background}` : 'decor-plan4';
  const sourceHeight = bgKey === 'decor-plan4' ? DECOR_SOURCE_HEIGHT : scene.textures.get(bgKey).getSourceImage().height;
  const scale = height / sourceHeight;
  const { baseline = null, groundLine = 1, camLow = 0, camHigh = 0, sky = null } = backdrop;
  const farScroll = sky && sky.farScrollY != null ? sky.farScrollY : FAR_BG_SCROLL;

  // Ligne de base : la ligne de sol de l'image (`groundLine`, fraction de sa
  // hauteur, 1 = bord bas) tombe sur `baseline` quand la caméra est au plus bas.
  const top = baseline == null ? 0 : baseline - camLow * (1 - farScroll) - height * groundLine;
  if (sky) addSkyGradient(scene, sky);
  const far = scene.add.tileSprite(-100, top, coverWidth, height, bgKey)
    .setOrigin(0, 0)
    .setTileScale(scale, scale)
    .setScrollFactor(FAR_BG_SCROLL, farScroll);
  scene.__farBackground = far;
  // Caméra qui défile verticalement (tallLevel, camera.vertical) ou fond
  // décalé : bords haut/bas prolongés dans la couleur de l'image (plus de
  // bande vide en haut de l'écran quand on monte).
  if (camHigh < camLow || baseline != null) addFarBackgroundCaps(scene, far, bgKey, { top, height, coverWidth, camLow, camHigh, farScroll, skyFade: !!sky });
  if (sky) addSkyRevealBackLayers(scene, sky, { levelWidth, camLow, camHigh });

  const floatingBackground = background === 'fond_foret_flottante';
  const canopyView = floatingBackground && !treesAtScreenBottom;
  // Ligne de base (ou ciel qui se révèle) : la forêt du fond est POSÉE dessus
  // (bas visible des arbres), plus plantée sous l'écran façon « canopée ».
  const treeBase = baseline != null || sky ? {
    y: baseline != null ? baseline : height - ARBRE_GROUND_CLEARANCE + ARBRE_SINK,
    scrollY: sky && sky.treesScrollY != null ? sky.treesScrollY : (sky ? SKY_TREES_SCROLL_Y : 1),
    camLow,
  } : null;
  if (largeTrees) addProceduralForest(scene, height, levelWidth, canopyView && !treeBase ? [] : avoidRanges, canopyView, treesAtScreenBottom, treeBase);
  if (!floatingBackground) addProceduralGroundPlants(scene, height, levelWidth, avoidRanges);
}

// ===========================================================================
// FONDS « AU SOL », LIQUIDE, CAMÉRA VERTICALE, CIEL (2026-10-23, cf.
// PLAN_DEV.md « Fonds, liquide et caméra verticale »). Tout est optionnel :
// une zone sans ces clés garde son rendu et sa caméra historiques.
// ===========================================================================
// Défilement du fond lointain (TileSprite du ciel/fond de zone).
const FAR_BG_SCROLL = 0.08;
// Bas visible des arbres du fond posé 2 px SOUS la ligne de base (le liquide
// ou le sol devant recouvre ce dernier rang à demi transparent).
const BACKDROP_TREE_SINK = 2;
// Ciel qui se révèle : la forêt du fond défile à 0,6 en vertical (plus
// lointaine que le sol) -- en montant, elle descend et découvre le ciel.
const SKY_TREES_SCROLL_Y = 0.6;

// Normalise les clés de fond d'une zone : `background: 'id'` (historique) ou
// `background: { id, baseline, groundLine }`, `backgroundBaseline: y`.
function zoneBackgroundId(data) {
  const bg = data && data.background;
  return bg && typeof bg === 'object' ? bg.id || null : bg || null;
}
function zoneBackdropSpec(data, { camLow = 0, camHigh = 0 } = {}) {
  const bg = data.background && typeof data.background === 'object' ? data.background : {};
  const baseline = bg.baseline ?? data.backgroundBaseline ?? null;
  const id = zoneBackgroundId(data);
  const def = id && typeof getItemManifest === 'function' ? getItemManifest()[id] : null;
  const groundLine = bg.groundLine ?? data.backgroundGroundLine ?? (def && def.groundLine) ?? 1;
  const sky = data.skyReveal ? { ...(data.skyReveal === true ? {} : data.skyReveal) } : null;
  // Fond peint qui a déjà son propre soleil : pas de second soleil par-dessus
  // (sauf `rays: true` explicite dans la zone).
  if (sky && sky.rays === undefined && BACKGROUNDS_WITH_SUN.has(id)) sky.rays = false;
  return { baseline, groundLine, camLow, camHigh, sky };
}

// Fonds lointains dont l'image contient déjà un soleil (cf. zoneBackdropSpec).
const BACKGROUNDS_WITH_SUN = new Set(['fond_foret_flottante']);

// Couleur moyenne des rangées du haut ou du bas d'une texture (mise en
// cache) : prolongement des bords du fond lointain. Repli sombre si les
// pixels sont illisibles (file://).
const TEXTURE_EDGE_COLOR_CACHE = new Map();
function textureEdgeColor(scene, key, edge, fallback = 0x0d0b1a) {
  const ck = `${key}|${edge}`;
  if (TEXTURE_EDGE_COLOR_CACHE.has(ck)) return TEXTURE_EDGE_COLOR_CACHE.get(ck);
  let color = fallback;
  try {
    const img = scene.textures.get(key).getSourceImage();
    const rows = Math.max(2, Math.round(img.height * 0.01));
    const c = document.createElement('canvas');
    c.width = Math.min(256, img.width);
    c.height = rows;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, edge === 'top' ? 0 : img.height - rows, img.width, rows, 0, 0, c.width, rows);
    const d = ctx.getImageData(0, 0, c.width, rows).data;
    let r = 0; let g = 0; let b = 0; const n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    color = Phaser.Display.Color.GetColor(Math.round(r / n), Math.round(g / n), Math.round(b / n));
  } catch (e) {
    color = fallback;
  }
  TEXTURE_EDGE_COLOR_CACHE.set(ck, color);
  return color;
}

// Bords du fond lointain prolongés : sans eux, quand la caméra monte, le fond
// (qui ne défile qu'à 0,08) découvrait une bande vide en haut de l'écran
// (épreuve du singe, racines), et une ligne de base remontée laissait un vide
// dessous. Prolongement = l'image retournée verticalement (raccord sans
// couture : même rangée de pixels de part et d'autre), puis sa couleur de
// bord. `skyFade` (ciel qui se révèle) : le haut se fond en transparence
// pour laisser voir le dégradé de ciel derrière.
function addFarBackgroundCaps(scene, far, key, { top, height, coverWidth, camLow, camHigh, farScroll, skyFade }) {
  const topColor = textureEdgeColor(scene, key, 'top', 0x101828);
  const bottomColor = textureEdgeColor(scene, key, 'bottom');
  const reach = Math.max(0, camLow - camHigh) * farScroll + Math.abs(Math.min(0, camHigh)) * farScroll;
  const g = scene.add.graphics().setScrollFactor(FAR_BG_SCROLL, farScroll);
  const mirror = (y) => scene.add.tileSprite(far.x, y, far.width, height, key)
    .setOrigin(0, 0).setTileScale(far.tileScaleX, far.tileScaleY).setFlipY(true)
    .setScrollFactor(FAR_BG_SCROLL, farScroll);
  const parts = [g];
  if (skyFade) {
    const fade = 160;
    g.fillGradientStyle(topColor, topColor, topColor, topColor, 0, 0, 1, 1);
    g.fillRect(-100, top - fade, coverWidth, fade);
  } else {
    parts.push(mirror(top - height));
    const extra = Math.max(60, top + reach + 60 - height);
    g.fillStyle(topColor, 1).fillRect(-100, top - height - extra, coverWidth, extra + 1);
  }
  parts.push(mirror(top + height));
  g.fillStyle(bottomColor, 1).fillRect(-100, top + 2 * height - 1, coverWidth, Math.max(600, reach + 600));
  // Derrière le fond lointain dans la liste d'affichage.
  for (const o of parts) scene.children.moveBelow(o, far);
  // Ciel qui se révèle : filet de raccord DEVANT l'image (son 1er rang, filtré
  // en boucle, mélange le bas de l'image -> trait sombre sur le ciel).
  if (skyFade) {
    const seam = scene.add.graphics().setScrollFactor(FAR_BG_SCROLL, farScroll);
    seam.fillStyle(topColor, 1).fillRect(-100, top - 1, coverWidth, 3);
    scene.children.moveAbove(seam, far);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Bande de liquide / brume au premier plan du fond (clé `liquidFloor`) :
// { y, style: 'mousse' | 'eau' | 'brume', color?, x1?, x2?, image?, height?,
// front? }. Dessinée DEVANT les fonds (forêt du fond, sous-bois), derrière le
// sol et les personnages (`front: true` : devant eux, ils « s'y enfoncent »).
// Image du manifest (`image`, sinon celle du style, cf. LIQUID_STYLES.images :
// bande TUILABLE en largeur, crête en haut, corps opaque) répétée en
// tileSprite à l'échelle du manifest (`height` : hauteur affichée imposée),
// la crête calée sur `y`, sa couleur du bas prolongée dessous ; sinon rendu
// par code (nappe sombre, surface bosselée, points lumineux). Bulles : VFX
// `vfx_mousse_toxique` (anim `bulle`) si l'art existe, sinon cercles.
// Purement visuelle : y tomber reste géré par la clé `fall`.
// ---------------------------------------------------------------------------
// Images du lot Codex n°8 (ids du manifest) en premier, anciens noms en repli.
// Brume : nappe `couche_nappe_brume` ; au premier plan (`front: true`), la
// bande opaque `couche_brume_avant`. Eau : `liquide_mare_fond`, plus le voile
// avant `liquide_mare_voile` et la ligne de surface animée `liquide_mare_surface_0..3`.
const LIQUID_STYLES = {
  mousse: { deep: 0x16280f, blobs: [0x2f5a2a, 0x3e7a2c], glow: 0x9bff5a, images: ['liquide_mousse_toxique', 'liquide_mousse'] },
  eau: { deep: 0x0b1f33, blobs: [0x1d4a6e, 0x245a85], glow: 0x9fe3ff, images: ['liquide_mare_fond', 'liquide_eau'] },
  brume: { deep: 0x2a3550, blobs: [0x46557a, 0x5a6a90], glow: 0xd6e2ff, images: ['couche_nappe_brume', 'liquide_brume'], frontImages: ['couche_brume_avant'] },
};
const LIQUID_MARE_SURFACE_FRAMES = ['liquide_mare_surface_0', 'liquide_mare_surface_1', 'liquide_mare_surface_2', 'liquide_mare_surface_3'];

function addLiquidFloor(scene, cfg, levelWidth, levelHeight) {
  if (!cfg || cfg.y == null) return null;
  const style = LIQUID_STYLES[cfg.style] ? cfg.style : 'mousse';
  const pal = { ...LIQUID_STYLES[style] };
  if (cfg.color != null) pal.deep = cfg.color;
  const x1 = cfg.x1 ?? -200;
  const x2 = cfg.x2 ?? levelWidth + 200;
  const y = cfg.y;
  const bottom = Math.max(levelHeight, y) + 400;
  const objs = [];
  const rnd = new Phaser.Math.RandomDataGenerator([`liquide-${style}-${Math.round(y)}`]);
  const imgId = [cfg.image, ...(cfg.front && pal.frontImages ? pal.frontImages : []), ...pal.images]
    .find((id) => id && scene.textures.exists(`item-${id}`));
  if (imgId) {
    const key = `item-${imgId}`;
    const src = scene.textures.get(key).getSourceImage();
    const def = typeof getItemManifest === 'function' ? getItemManifest()[imgId] || {} : {};
    const k = cfg.height ? cfg.height / src.height : (def.scale || 96 / src.height);
    const band = src.height * k;
    // Crête (1er rang visible de l'image) quelques px au-dessus de `y`.
    const vb = visibleBounds(scene, key);
    const surfTop = y - (vb && !vb.empty ? vb.y0 * k : 0) - 6;
    const deep = scene.add.rectangle(x1, surfTop + band - 1, x2 - x1, Math.max(0, bottom - surfTop - band), textureEdgeColor(scene, key, 'bottom', pal.deep)).setOrigin(0, 0);
    const surf = scene.add.tileSprite(x1, surfTop, x2 - x1, band, key).setOrigin(0, 0).setTileScale(k, k);
    objs.push(deep, surf);
    // Lente dérive de la surface.
    scene.tweens.add({ targets: surf, tilePositionX: { from: 0, to: src.width }, duration: 60000, repeat: -1 });
    // Eau (mare, lot n°8) : ligne de surface animée (~8 i/s) et voile avant
    // translucide par-dessus le corps de l'eau.
    if (style === 'eau') {
      const frames = LIQUID_MARE_SURFACE_FRAMES.filter((id) => scene.textures.exists(`item-${id}`));
      if (frames.length) {
        const fdef = getItemManifest()[frames[0]] || {};
        const fsrc = scene.textures.get(`item-${frames[0]}`).getSourceImage();
        const fk = fdef.scale || k;
        const line = scene.add.tileSprite(x1, surfTop - fsrc.height * fk * 0.5, x2 - x1, fsrc.height * fk, `item-${frames[0]}`)
          .setOrigin(0, 0).setTileScale(fk, fk);
        let fi = 0;
        scene.time.addEvent({
          delay: 125, loop: true,
          callback: () => { if (!line.active) return; fi = (fi + 1) % frames.length; line.setTexture(`item-${frames[fi]}`); },
        });
        objs.push(line);
      }
      if (scene.textures.exists('item-liquide_mare_voile')) {
        const vdef = getItemManifest().liquide_mare_voile || {};
        const vsrc = scene.textures.get('item-liquide_mare_voile').getSourceImage();
        const vk = vdef.scale || k;
        const veil = scene.add.tileSprite(x1, surfTop + 4, x2 - x1, vsrc.height * vk, 'item-liquide_mare_voile')
          .setOrigin(0, 0).setTileScale(vk, vk).setAlpha(0.28);
        scene.tweens.add({ targets: veil, tilePositionX: { from: 0, to: -vsrc.width }, duration: 45000, repeat: -1 });
        objs.push(veil);
      }
    }
  } else {
    const g = scene.add.graphics();
    g.fillStyle(pal.deep, 1).fillRect(x1, y, x2 - x1, bottom - y);
    if (style === 'eau') {
      g.fillStyle(pal.blobs[1], 0.9).fillRect(x1, y - 2, x2 - x1, 6);
      for (let x = x1; x < x2; x += 34) g.fillStyle(pal.glow, 0.35).fillRect(x + rnd.between(0, 20), y + rnd.between(6, 40), rnd.between(8, 22), 2);
    } else {
      for (let x = x1; x < x2; x += 46) {
        g.fillStyle(pal.blobs[rnd.frac() < 0.5 ? 0 : 1], 1);
        g.fillEllipse(x + rnd.between(0, 20), y + 2 + rnd.between(-4, 6), rnd.between(50, 80), rnd.between(20, 34));
      }
      for (let x = x1; x < x2; x += 37) g.fillStyle(pal.glow, 0.65).fillCircle(x + rnd.between(0, 30), y + rnd.between(-6, 14), rnd.realInRange(1.5, 3.5));
    }
    objs.push(g);
  }
  // Bulles (mousse) / reflets (eau) qui montent et crèvent.
  const bubbleArt = style === 'mousse' && typeof hasManifestArt === 'function' && hasManifestArt(scene, 'vfx_mousse_toxique', 'bulle');
  for (let x = x1 + 120; x < x2; x += 260 + rnd.between(0, 160)) {
    if (bubbleArt) {
      const b = addManifestSprite(scene, x, y + 4, 'vfx_mousse_toxique', 'bulle', { origin: [0.5, 1] }).setVisible(false);
      objs.push(b);
      const pop = () => {
        if (!b.active) return;
        b.setPosition(x + rnd.between(-40, 40), y + 4).setVisible(true);
        b.play('vfx_mousse_toxique-bulle');
        b.once('animationcomplete', () => { if (b.active) b.setVisible(false); });
        scene.time.delayedCall(rnd.between(1600, 3600), pop);
      };
      scene.time.delayedCall(rnd.between(0, 2500), pop);
    } else {
      const b = scene.add.circle(x, y + 6, rnd.between(3, 7), pal.glow, style === 'eau' ? 0.35 : 0.55);
      objs.push(b);
      scene.tweens.add({
        targets: b, y: y - 16, alpha: 0, scale: 1.6, duration: rnd.between(1300, 2200),
        delay: rnd.between(0, 2000), repeat: -1, repeatDelay: rnd.between(300, 1500),
      });
    }
  }
  if (cfg.front) {
    for (const o of objs) o.setDepth(DECOR_FOREGROUND_DEPTH - 2);
  } else if (scene.__frontGroundFirstImage) {
    // Derrière le sol principal (donc les personnages) : juste avant sa 1re image.
    for (const o of objs) scene.children.moveBelow(o, scene.__frontGroundFirstImage);
  }
  scene.liquidFloor = { y, style, objects: objs };
  return scene.liquidFloor;
}

// ---------------------------------------------------------------------------
// Ciel qui se révèle en montant (clé `skyReveal`, avec `camera.vertical`) :
// dégradé de ciel fixé à l'écran DERRIÈRE le fond lointain (forêt/nuit en bas
// -> jour lumineux en haut, fondu selon la hauteur de la caméra), voile de
// sous-bois sur le fond lointain, nuages en parallaxe lente, rayons de
// soleil, feuilles qui tombent dans la canopée, éclat de lumière à la sortie
// de la canopée. Images du manifest utilisées si elles existent
// (`ciel_jour`, `nuages`, `rayons_soleil`), sinon rendu par code.
//   skyReveal: { start: 0.1, end: 0.85 (fractions de la course verticale de
//   la caméra), low: [haut, bas], high: [haut, bas] (couleurs du dégradé),
//   shade: 0.55 (voile du fond en bas), clouds: 7, rays: true, leaves: true,
//   flashAt: 0.55, treesScrollY: 0.6, farScrollY: 0.08 }
// ---------------------------------------------------------------------------
const SKY_DEFAULTS = {
  start: 0.1, end: 0.85,
  low: [0x0f2230, 0x1d3b33], high: [0x3d8fe0, 0xbfe5ff],
  shade: 0.55, shadeColor: 0x0b1a17, clouds: 7, rays: true, leaves: true, flashAt: 0.55,
};

function addSkyGradient(scene, sky) {
  const cfg = { ...SKY_DEFAULTS, ...(sky || {}) };
  const { width, height } = scene.scale;
  const st = { cfg, progress: 0, flashArmed: true, leafAt: 0, raySway: 0, flashBoost: 0 };
  scene.__sky = st;
  const grad = (top, bottom) => {
    const g = scene.add.graphics().setScrollFactor(0).setDepth(-20);
    g.fillGradientStyle(top, top, bottom, bottom, 1);
    g.fillRect(0, 0, width, height);
    return g;
  };
  st.low = grad(cfg.low[0], cfg.low[1]);
  // Ciel de jour : `couche_ciel_jour` (lot Codex n°8, repli ancien `ciel_jour`),
  // couvrant l'écran sans déformation, calé en haut.
  const skyKey = ['item-couche_ciel_jour', 'item-ciel_jour'].find((k) => scene.textures.exists(k));
  if (skyKey) {
    st.high = scene.add.image(width / 2, 0, skyKey).setOrigin(0.5, 0).setScrollFactor(0).setDepth(-19);
    st.high.setScale(Math.max(width / st.high.width, height / st.high.height));
  } else {
    st.high = grad(cfg.high[0], cfg.high[1]).setDepth(-19);
  }
  st.high.setAlpha(0);
}

// Voile, nuages et rayons : entre le fond lointain et la forêt du fond.
function addSkyRevealBackLayers(scene, sky, { levelWidth, camLow, camHigh }) {
  const st = scene.__sky;
  if (!st) return;
  const cfg = st.cfg;
  const { width, height } = scene.scale;
  st.shade = scene.add.rectangle(0, 0, width, height, cfg.shadeColor, cfg.shade).setOrigin(0, 0).setScrollFactor(0);
  // Nuages : dans le haut de la course de la caméra, parallaxe lente.
  st.clouds = [];
  const n = cfg.clouds || 0;
  const cloudScroll = 0.25;
  const rnd = new Phaser.Math.RandomDataGenerator(['ciel-nuages']);
  for (let i = 0; i < n; i++) {
    const s = camHigh + (camLow - camHigh) * rnd.realInRange(0, 0.45);
    const cy = s * cloudScroll + rnd.between(40, Math.round(height * 0.45));
    const cx = ((levelWidth * 0.35 + width) * i) / Math.max(1, n) + rnd.between(0, 200);
    let c;
    // Nuages isolés `couche_nuage_0..4` (lot n°8), repli ancien `nuages`.
    const cloudId = [`couche_nuage_${i % 5}`, 'couche_nuage_0', 'nuages'].find((id) => scene.textures.exists(`item-${id}`));
    if (cloudId) {
      const cdef = getItemManifest()[cloudId] || {};
      c = scene.add.image(cx, cy, `item-${cloudId}`).setScale((cdef.scale || 0.7) * rnd.realInRange(0.75, 1.1));
    } else {
      // Nuage doux : base ombrée, puis boules de plus en plus claires.
      c = scene.add.graphics({ x: cx, y: cy });
      const w = rnd.between(150, 280);
      c.fillStyle(0xc9dcef, 0.55).fillEllipse(0, 12, w * 0.95, 30);
      for (let k = 0; k < 7; k++) {
        c.fillStyle(k < 3 ? 0xe4eef8 : 0xffffff, 0.5 + k * 0.05);
        c.fillEllipse(rnd.between(-w * 0.42, w * 0.42), rnd.between(-14, 6), rnd.between(56, 104), rnd.between(30, 50));
      }
    }
    c.setScrollFactor(0.12, cloudScroll).setAlpha(0);
    scene.tweens.add({ targets: c, x: cx + rnd.between(120, 260), duration: rnd.between(40000, 70000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    st.clouds.push(c);
  }
  // Rayons de soleil (coin haut droit), additifs, fixés à l'écran.
  st.rays = null;
  if (cfg.rays) {
    // Soleil `couche_soleil` (lot n°8, additif, fixé à l'écran), repli ancien
    // `rayons_soleil`, sinon rayons dessinés.
    const sunId = ['couche_soleil', 'rayons_soleil'].find((id) => scene.textures.exists(`item-${id}`));
    if (sunId === 'couche_soleil') {
      const sdef = getItemManifest().couche_soleil || {};
      st.rays = scene.add.image(width * 0.86, height * 0.12, 'item-couche_soleil').setScrollFactor(0).setScale(sdef.scale || 0.6);
    } else if (sunId) {
      st.rays = scene.add.image(width, 0, `item-${sunId}`).setOrigin(1, 0).setScrollFactor(0);
    } else {
      st.rays = scene.add.graphics().setScrollFactor(0);
      const ox = width * 0.88;
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (0.58 + i * 0.07);
        const len = height * 1.3;
        const spread = 0.025 + (i % 2) * 0.015;
        st.rays.fillStyle(0xfff4c8, 0.09 + (i % 2) * 0.04);
        st.rays.fillTriangle(ox, -20, ox + Math.cos(a - spread) * len, -20 + Math.sin(a - spread) * len,
          ox + Math.cos(a + spread) * len, -20 + Math.sin(a + spread) * len);
      }
    }
    st.rays.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    scene.tweens.add({ targets: st, raySway: { from: -1, to: 1 }, duration: 5200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // Nappes de nuages `couche_nappe_nuages` (lot n°8, tuilables) : deux copies
  // à des parallaxes différentes, visibles à la traversée de la canopée puis
  // de plus en plus transparentes en montant (cf. updateSkyReveal).
  st.nappes = [];
  if (scene.textures.exists('item-couche_nappe_nuages')) {
    const ndef = getItemManifest().couche_nappe_nuages || {};
    const nsrc = scene.textures.get('item-couche_nappe_nuages').getSourceImage();
    const nk = ndef.scale || 0.7;
    const mid = camHigh + (camLow - camHigh) * 0.45;
    [[0.22, 0.32, 0.62], [0.4, 0.5, 0.78]].forEach(([px, py, at], i) => {
      const n = scene.add.tileSprite(0, mid * py + height * at, levelWidth * px + width + 40, nsrc.height * nk, 'item-couche_nappe_nuages')
        .setOrigin(0, 0.5).setTileScale(nk, nk).setScrollFactor(px, py).setAlpha(0);
      n.tilePositionX = i * 420;
      st.nappes.push(n);
    });
  }
  // Éclat de lumière à la sortie de la canopée (au-dessus de tout le décor).
  st.flash = scene.add.rectangle(0, 0, width, height, 0xfff3c4, 0).setOrigin(0, 0).setScrollFactor(0).setDepth(950);
}

// Progression 0 (bas de la course de la caméra) -> 1 (haut) et rendu.
function updateSkyReveal(scene, dt) {
  const st = scene.__sky;
  if (!st || !st.low || !st.low.active) return;
  const cam = scene.cameras.main;
  const zc = scene.__zoneCamera;
  const low = zc ? zc.camLow : 0;
  const high = zc ? zc.camHigh : 0;
  const raw = low > high ? (low - cam.scrollY) / (low - high) : 0;
  const cfg = st.cfg;
  const p = Phaser.Math.Clamp((raw - cfg.start) / Math.max(0.01, cfg.end - cfg.start), 0, 1);
  // Lissé : pas de saut de lumière quand la caméra rattrape un grand saut.
  st.progress += (p - st.progress) * (1 - Math.exp(-dt * 4));
  const e = st.progress * st.progress * (3 - 2 * st.progress); // smoothstep
  st.high.setAlpha(e);
  if (st.shade) st.shade.setAlpha(cfg.shade * (1 - e));
  for (const c of st.clouds || []) c.setAlpha(Phaser.Math.Clamp((e - 0.2) / 0.5, 0, 1) * 0.9);
  // Nappes : en cloche autour de la sortie de la canopée (0,25 -> 0,95).
  for (const n of st.nappes || []) n.setAlpha(Math.max(0, Math.sin(Phaser.Math.Clamp((e - 0.25) / 0.7, 0, 1) * Math.PI)) * 0.85);
  if (st.rays) {
    const base = Phaser.Math.Clamp((e - 0.3) / 0.5, 0, 1) * (0.75 + 0.25 * st.raySway);
    st.rays.setAlpha(Phaser.Math.Clamp(base + st.flashBoost, 0, 1));
  }
  // Sortie de la canopée : éclat doux une fois (réarmé quand on redescend).
  if (cfg.flashAt != null && st.flash) {
    if (st.flashArmed && st.progress >= cfg.flashAt) {
      st.flashArmed = false;
      scene.tweens.killTweensOf(st.flash);
      st.flash.setAlpha(0);
      scene.tweens.add({ targets: st.flash, alpha: { from: 0, to: 0.3 }, duration: 160, yoyo: true, hold: 120, ease: 'Sine.easeOut' });
      st.flashBoost = 0.35;
      scene.tweens.add({ targets: st, flashBoost: 0, duration: 1400, ease: 'Quad.easeOut' });
    } else if (!st.flashArmed && st.progress < cfg.flashAt - 0.2) {
      st.flashArmed = true;
    }
  }
  // Feuilles qui tombent tant qu'on traverse la canopée.
  if (cfg.leaves && st.progress > 0.08 && st.progress < 0.8 && scene.time.now >= st.leafAt) {
    st.leafAt = scene.time.now + Phaser.Math.Between(260, 520);
    spawnSkyLeaf(scene);
  }
}

function spawnSkyLeaf(scene) {
  const view = scene.cameras.main.worldView;
  const x = view.x + Phaser.Math.Between(0, Math.round(view.width));
  const y = view.y - 10;
  const leaf = scene.add.ellipse(x, y, 10, 5, Phaser.Utils.Array.GetRandom([0x6fbf5a, 0xa8e07a, 0x4f9a48]), 0.9)
    .setDepth(DECOR_FOREGROUND_DEPTH - 1).setRotation(Math.random() * Math.PI);
  const fall = Phaser.Math.Between(260, 420);
  scene.tweens.add({ targets: leaf, y: y + fall, duration: Phaser.Math.Between(2600, 3800), ease: 'Sine.easeIn', onComplete: () => leaf.destroy() });
  scene.tweens.add({ targets: leaf, x: x + Phaser.Math.Between(-60, 60), rotation: leaf.rotation + Phaser.Math.FloatBetween(-3, 3), duration: 900, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
  scene.tweens.add({ targets: leaf, alpha: 0, delay: 2000, duration: 900 });
}

// ---------------------------------------------------------------------------
// Caméra de zone (clé `camera`) : { vertical: true, deadzoneTop: 0.35,
// deadzoneBottom: 0.7, lerp | smoothTime, lookAhead: 60, lookAheadX: 0 }.
// Horizontal : suivi historique (centré, immédiat). Vertical : zone morte --
// la caméra ne monte que quand Agarica (buste) dépasse `deadzoneTop` du cadre
// et ne redescend que sous `deadzoneBottom` --, rattrapage par ressort amorti
// (accélère puis décélère, sans dépassement : « smooth damp »), léger regard
// dans le sens de la montée/de la chute, bornes = monde de la zone.
// ---------------------------------------------------------------------------
const ZONE_CAMERA_DEFAULTS = { deadzoneTop: 0.35, deadzoneBottom: 0.7, smoothTime: 0.24, lookAhead: 60, lookAheadX: 0 };
const ZONE_CAMERA_FOCUS_ABOVE_FEET = 40;

function setupZoneCamera(scene, data, { camLow = 0, camHigh = 0 } = {}) {
  const c = data.camera && data.camera.vertical ? { ...ZONE_CAMERA_DEFAULTS, ...data.camera } : null;
  // `lerp` (par image à 60 i/s, façon Phaser) -> temps de lissage équivalent.
  if (c && data.camera.smoothTime == null && data.camera.lerp) c.smoothTime = Phaser.Math.Clamp(1 / (data.camera.lerp * 60), 0.05, 1.5);
  scene.__zoneCamera = c || scene.__sky ? { cfg: c, vel: 0, target: null, look: 0, lookX: 0, camLow, camHigh } : null;
  cameraFollowPlayer(scene, { snap: true });
  if (scene.__zoneCamera && !scene.__zoneCameraHook) {
    scene.__zoneCameraHook = true;
    // Après la physique (POST_UPDATE, après Arcade) : position finale du joueur.
    scene.events.on('postupdate', (time, delta) => {
      if (!scene.__zoneCamera || !scene.player) return;
      const dt = Math.min(delta || 16, 50) / 1000;
      updateZoneCamera(scene, dt);
      updateSkyReveal(scene, dt);
    });
  }
}

// (Re)met la caméra sur Agarica selon la caméra de la zone (cinématiques :
// cf. storyCameraFollow). `snap` : directement à la bonne hauteur.
function cameraFollowPlayer(scene, { snap = false } = {}) {
  const cam = scene.cameras.main;
  const p = scene.player;
  if (!p) return;
  const zc = scene.__zoneCamera && scene.__zoneCamera.cfg ? scene.__zoneCamera : null;
  const keepY = cam.scrollY;
  cam.startFollow(p, true, 1, zc ? 0 : 1);
  if (!zc) return;
  zc.vel = 0;
  zc.look = 0;
  zc.target = null;
  if (snap) {
    const focus = p.y - ZONE_CAMERA_FOCUS_ABOVE_FEET;
    cam.scrollY = cam.clampY(focus - ((zc.cfg.deadzoneTop + zc.cfg.deadzoneBottom) / 2) * cam.height);
  } else {
    cam.scrollY = keepY;
  }
}

// Ressort amorti critique (« SmoothDamp ») : rejoint `target` en ~smoothTime
// sans le dépasser, vitesse continue (accélération puis freinage en douceur).
function cameraSmoothDamp(current, target, state, smoothTime, dt) {
  const omega = 2 / Math.max(0.0001, smoothTime);
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (state.vel + omega * change) * dt;
  state.vel = (state.vel - omega * temp) * exp;
  let out = target + (change + temp) * exp;
  // Pas de dépassement (anti-oscillation).
  if ((target - current > 0) === (out > target)) { out = target; state.vel = 0; }
  return out;
}

function updateZoneCamera(scene, dt) {
  const zc = scene.__zoneCamera;
  if (!zc || !zc.cfg) return;
  const cam = scene.cameras.main;
  const p = scene.player;
  // Cinématique qui a pris la caméra (pan, caméra détachée) : on n'y touche pas.
  if (!p || !p.active || !p.body || scene.__cameraDetached || cam._follow !== p || (cam.panEffect && cam.panEffect.isRunning)) {
    zc.vel = 0;
    zc.target = null;
    return;
  }
  const c = zc.cfg;
  const h = cam.height;
  const focus = p.y - ZONE_CAMERA_FOCUS_ABOVE_FEET;
  let target = zc.target == null ? cam.scrollY : zc.target;
  if (focus < target + c.deadzoneTop * h) target = focus - c.deadzoneTop * h;
  else if (focus > target + c.deadzoneBottom * h) target = focus - c.deadzoneBottom * h;
  zc.target = cam.clampY(target);
  // Regard : un peu plus haut en pleine montée, plus bas en chute rapide.
  const vy = p.body.velocity.y;
  const want = vy < -150 ? -c.lookAhead * Phaser.Math.Clamp((-vy - 150) / 450, 0, 1)
    : vy > 300 ? c.lookAhead * Phaser.Math.Clamp((vy - 300) / 500, 0, 1) : 0;
  zc.look += (want - zc.look) * (1 - Math.exp(-dt * 3));
  const goal = cam.clampY(zc.target + zc.look);
  cam.scrollY = cameraSmoothDamp(cam.scrollY, goal, zc, c.smoothTime, dt);
  if (c.lookAheadX) {
    const wantX = -(p.facingDir >= 0 ? 1 : -1) * c.lookAheadX;
    zc.lookX += (wantX - zc.lookX) * (1 - Math.exp(-dt * 2));
    cam.followOffset.x = zc.lookX;
  }
}

// Plafond (lianes suspendues, assets/decors/plantes_frames/ — voir
// addProceduralHangingPlants ci-dessus) : referme visuellement le haut de la
// salle, pour qu'elle lise comme une chambre plutôt qu'un champ ouvert sur
// les 4 côtés (cf. GDD "grotte"). Purement décoratif (pas de collision, même
// parallaxe qu'avant) pour ne rien changer aux arcs de saut/plané Aigle déjà
// calés au-dessus des fosses de Zone2/Zone4.
function addCaveCeiling(scene, levelWidth) {
  addProceduralHangingPlants(scene, levelWidth);
}

// `y` est le CENTRE de la case de sol (hitbox GROUND_TILE_SIZE), pas sa
// surface (cf. commentaires `groundY - 16` dans les scènes). `ceiling: true`
// pour un plafond (cf. SousGrotteScene) : même grille/hitbox, art retourné
// et calé sur le bord haut de la case pour pendre dans la pièce.
function fillGroundTiles(groundGroup, startX, endX, y, { ceiling = false } = {}) {
  const scene = groundGroup.scene;
  for (let x = startX; x < endX; x += GROUND_TILE_SIZE) {
    const cellCenterX = x + GROUND_TILE_SIZE / 2;
    groundGroup.create(cellCenterX, y, GROUND_HITBOX_KEY).setVisible(false);
    addGroundTileVisual(scene, cellCenterX, y, ceiling);
  }
}

// Volume d'eau (zone aquatique) : simple rectangle translucide + ligne de
// surface plus claire, avec une zone physique statique pour l'overlap —
// non solide (pas de collider), la traversée se fait par la nage (forme
// Pieuvre) ou pas du tout (cf. Player.js : sans la capacité, l'eau profonde
// est un piège).
function addWaterZone(scene, x, y, width, height) {
  scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x1c5f6e, 0.45);
  scene.add.rectangle(x + width / 2, y, width, 4, 0x9fe6e0, 0.7);

  const zone = scene.add.zone(x + width / 2, y + height / 2, width, height);
  scene.physics.add.existing(zone, true);
  return zone;
}

function addPlatformTiles(groundGroup, centerX, y, tileCount) {
  const scene = groundGroup.scene;
  const startX = centerX - ((tileCount - 1) * GROUND_TILE_SIZE) / 2;
  for (let i = 0; i < tileCount; i++) {
    const cellCenterX = startX + i * GROUND_TILE_SIZE;
    groundGroup.create(cellCenterX, y, GROUND_HITBOX_KEY).setVisible(false);
    addGroundTileVisual(scene, cellCenterX, y, false);
  }
}

// Bascule d'affichage des hitbox/vecteurs de vélocité (debug Arcade
// Physics), Ctrl+I — pratique pour ajuster le ressenti des collisions,
// désactivé par défaut pour ne pas polluer l'expérience de jeu finale.
// État partagé entre scènes (variable de module, pas une propriété de
// scène) : chaque scène recrée son propre physics.world, qui repartirait
// sinon toujours de la valeur par défaut du config Phaser.
let debugHitboxesVisible = false;

function applyDebugVisibility(scene) {
  const world = scene.physics.world;
  // Avec debug:false au démarrage (cf. main.js), Phaser ne crée jamais
  // debugGraphic tout seul : sans ce createDebugGraphic() à la demande,
  // activer drawDebug plus tard ferait planter le rendu (accès à un
  // debugGraphic resté undefined).
  if (debugHitboxesVisible && !world.debugGraphic) {
    world.createDebugGraphic();
  }
  world.drawDebug = debugHitboxesVisible;
  if (!debugHitboxesVisible && world.debugGraphic) {
    world.debugGraphic.clear();
  }
}

// Bascules Shift+A / Shift+J (retour utilisateur) : contrairement à Ctrl+I
// ci-dessus (debug Arcade Physics natif, TOUS les bodies confondus -- sol,
// plateformes, totems... -- pratique pour le level design mais bruyant pour
// juste juger un combat), ces deux-là dessinent SEULEMENT ce qui compte
// pendant un combat, chacune sa couleur, sur un Graphics dédié par scène :
// - Shift+A : zones de dégâts de l'ATTAQUE (dague + compétence active).
//   Ce ne sont PAS de vrais Arcade bodies (juste des Phaser.Geom.Rectangle
//   comparés à la main, cf. getAttackHitbox()/getSkillHitbox() dans
//   Player.js) -- Ctrl+I ne les affiche donc jamais, quel que soit son état.
// - Shift+J : corps physique des ENTITÉS (joueur + ennemis uniquement, pas
//   le décor/sol) -- un sous-ensemble ciblé de ce que Ctrl+I montre déjà.
let attackHitboxesVisible = false;
let entityHitboxesVisible = false;
// Bascule Ctrl+Shift+H (retour utilisateur : "met une touche pour afficher
// les hitbox du sol") : SEULEMENT `scene.ground` (le body invisible de
// chaque case, cf. ensureGroundHitboxTexture), pas les plateformes/
// totems/ennemis comme Ctrl+I -- pensée pour juger juste le collider du
// terrain (utile pour diagnostiquer le passage-à-travers sur les côtés en
// spammant la transfo Loup, cf. modif.txt) sans le bruit du reste.
let groundHitboxesVisible = false;

// Créés une seule fois par scène (jamais détruits, juste clear()/redessinés
// chaque frame depuis updateLevelFromData -- cf. plus bas) : un Graphics
// vide ne coûte rien tant que rien n'est dessiné dedans.
function ensureCombatDebugGraphics(scene) {
  if (!scene.__attackHitboxGraphic) {
    scene.__attackHitboxGraphic = scene.add.graphics().setDepth(2500);
  }
  if (!scene.__entityHitboxGraphic) {
    scene.__entityHitboxGraphic = scene.add.graphics().setDepth(2500);
  }
  if (!scene.__groundHitboxGraphic) {
    scene.__groundHitboxGraphic = scene.add.graphics().setDepth(2500);
  }
}

// Appelé chaque frame par updateLevelFromData (même si les deux bascules
// sont désactivées -- clear() reste nécessaire pour effacer un dessin de la
// frame précédente juste après un Shift+A/Shift+J qui désactive).
function drawCombatDebugOverlays(scene) {
  const attackGraphic = scene.__attackHitboxGraphic;
  const entityGraphic = scene.__entityHitboxGraphic;
  if (!attackGraphic || !entityGraphic) return;

  attackGraphic.clear();
  if (attackHitboxesVisible && scene.player) {
    const attackHitbox = scene.player.getAttackHitbox();
    if (attackHitbox) {
      attackGraphic.lineStyle(2, 0xff3355, 1);
      attackGraphic.strokeRectShape(attackHitbox);
    }
    const skillHitbox = scene.player.getSkillHitbox();
    if (skillHitbox) {
      attackGraphic.lineStyle(2, 0xffaa00, 1);
      attackGraphic.strokeRectShape(skillHitbox);
    }
  }

  entityGraphic.clear();
  if (entityHitboxesVisible) {
    entityGraphic.lineStyle(2, 0x33ccff, 1);
    if (scene.player && scene.player.body) {
      const b = scene.player.body;
      entityGraphic.strokeRect(b.x, b.y, b.width, b.height);
    }
    if (scene.enemies) {
      scene.enemies.children.iterate((enemy) => {
        if (!enemy || !enemy.body) return;
        entityGraphic.strokeRect(enemy.body.x, enemy.body.y, enemy.body.width, enemy.body.height);
      });
    }
  }

  const groundGraphic = scene.__groundHitboxGraphic;
  if (groundGraphic) {
    groundGraphic.clear();
    if (groundHitboxesVisible && scene.ground) {
      groundGraphic.lineStyle(2, 0x33ff77, 1);
      scene.ground.children.iterate((tile) => {
        if (!tile || !tile.body) return;
        groundGraphic.strokeRect(tile.body.x, tile.body.y, tile.body.width, tile.body.height);
      });
    }
  }
}

function setupDebugToggle(scene) {
  applyDebugVisibility(scene);
  ensureCombatDebugGraphics(scene);
  scene.input.keyboard.on('keydown-I', (event) => {
    if (!event.ctrlKey) return;
    debugHitboxesVisible = !debugHitboxesVisible;
    applyDebugVisibility(scene);
  });

  // Shift+A/Shift+J (cf. commentaire au-dessus de attackHitboxesVisible) --
  // ATTENTION : 'A' est AUSSI la touche de la compétence d'emplacement 1
  // (cf. skillKeys.slot1 dans Player.js), lue via un Key Phaser qui ignore
  // les modificateurs -- Shift+A active donc CETTE bascule ET, si une
  // compétence y est équipée, déclenche cette compétence (même effet de
  // bord que Ctrl+Shift+D avec la touche D, déjà accepté plus haut). 'J'
  // n'est lié à rien d'autre, aucun conflit de ce genre pour cette touche-là.
  scene.input.keyboard.on('keydown-A', (event) => {
    if (!event.shiftKey) return;
    attackHitboxesVisible = !attackHitboxesVisible;
  });
  scene.input.keyboard.on('keydown-J', (event) => {
    if (!event.shiftKey) return;
    entityHitboxesVisible = !entityHitboxesVisible;
  });

  // Ctrl+Shift+H (retour utilisateur) : cf. groundHitboxesVisible plus haut.
  scene.input.keyboard.on('keydown-H', (event) => {
    if (!event.ctrlKey || !event.shiftKey) return;
    groundHitboxesVisible = !groundHitboxesVisible;
  });

  // Ctrl+Shift+D (retour utilisateur -- remplace Ctrl+E, qui remplaçait
  // Ctrl+A, qui remplaçait Ctrl+G, lui-même un remplacement de l'ancien
  // Ctrl+Shift+J fusionné avec l'ancien Ctrl+Shift+O de Player.js : un seul
  // raccourci de triche au lieu de deux) : débloque ET équipe d'un coup les
  // 3 formes de déplacement ET toutes les compétences existantes (aide au
  // test des zones avancées sans refaire tout le parcours des sanctuaires).
  // Pose chaque flag au registry (persiste) ET sur l'instance Player vivante.
  // ATTENTION : 'D' est AUSSI la touche de déplacement à droite (ZQSD, cf.
  // player.keys.right dans Player.js) -- lue en continu via `isDown`, pas
  // `JustDown`, donc Ctrl+Shift+D fait avancer Agarica d'un cran vers la
  // droite pendant l'appui (effet de bord mineur, pas un bug) en plus de
  // débloquer/équiper.
  scene.input.keyboard.on('keydown-D', (event) => {
    if (!event.ctrlKey || !event.shiftKey) return;
    for (const flag of ['hasWolfForm', 'hasEagleForm', 'hasOctopusForm']) {
      scene.registry.set(flag, true);
      if (scene.player) scene.player[flag] = true;
    }
    // Débloquer ne suffit plus à activer une forme (cf. equippedForms dans
    // Player.js) -- équipe aussi les 3 dans les 3 emplacements pour que ce
    // raccourci de test reste immédiatement utilisable sans repasser par
    // le feu de camp.
    if (scene.player) {
      scene.player.equippedForms = ['wolf', 'eagle', 'octopus'];
      scene.registry.set('equippedForms', scene.player.equippedForms);
    }
    // Compétences : débloque TOUTES les entrées de SKILL_DEFS (une seule,
    // 'ours', pour l'instant -- boucle générique plutôt que hardcodé pour
    // rester correct sans y retoucher le jour où une 2e/3e compétence
    // existera) et les équipe dans les emplacements libres, comme pour les
    // formes ci-dessus.
    if (scene.player) {
      const player = scene.player;
      for (const skillId of Object.keys(SKILL_DEFS)) {
        player.unlockedSkills.add(skillId);
        if (!player.skillSlots.includes(skillId)) {
          const emptyIdx = player.skillSlots.indexOf(null);
          if (emptyIdx !== -1) player.skillSlots[emptyIdx] = skillId;
        }
      }
      scene.registry.set('unlockedSkills', [...player.unlockedSkills]);
      scene.registry.set('skillSlots', player.skillSlots);
    }
  });
}

// Fondus courts pour chaque changement de scène : un `scene.start()` brut
// coupait instantanément d'une zone à l'autre. À appeler à la place de
// `this.scene.start(...)` partout ; chaque scène doit appeler `fadeInScene`
// en tout début de `create()` pour l'aller-retour symétrique.
const FADE_DURATION = 250;
const FADE_COLOR = [13, 11, 26]; // #0d0b1a, fond du jeu

// Fondu d'entrée adouci (cf. juiceFadeIn, section « Juice » en fin de
// fichier) ; `opts.zoom` : léger « posé » de la caméra (zones de jeu).
function fadeInScene(scene, opts = {}) {
  juiceFadeIn(scene, opts);
}

function goToScene(scene, key, data) {
  // Retour utilisateur : "la logique des entré sortie [...] ne marche pas"
  // -- un portail relié (cf. EditorScene.js, écran "Zones") vers une zone
  // encore SEULEMENT à l'état de brouillon (jamais "Téléchargée pour le
  // projet" + câblée dans main.js, cf. le docstring d'EditorScene.js) pointe
  // vers une clé de scène Phaser qui n'existe tout simplement pas encore.
  // Avant ce garde-fou : le fondu au noir démarrait quand même
  // (`__transitioningAway` posé à true), `scene.scene.start(key, ...)`
  // échouait EN SILENCE (juste un avertissement console "Scene not found for
  // key", vérifié empiriquement -- ni exception, ni scène courante coupée),
  // et comme `__transitioningAway` ne repasse JAMAIS à false, l'écran
  // restait noir pour de bon (`goToScene` refuse tout appel suivant, plus
  // aucune sortie de cette scène ne peut plus jamais se déclencher) --
  // exactement ce qu'un "ça ne marche pas" décrit : pas d'erreur visible,
  // juste un blocage silencieux et permanent. Vérifié AVANT de déclencher le
  // fondu (`scene.scene.get(key)`, la même API que `.start()` utilise en
  // interne pour résoudre la clé) : cible absente -> message de statut clair
  // à la place, aucun fondu commencé, la zone courante reste jouable.
  if (!scene.scene.get(key)) {
    // En jeu réel ET pendant un Playtest (cf. startPlaytest dans
    // EditorScene.js, qui CACHE tout #editor-ui -- son statut texte y est
    // invisible, inutile ici) : un texte DANS le canvas, toujours visible
    // quel que soit le contexte, plutôt que le panneau HTML de l'éditeur.
    const cam = scene.cameras.main;
    const msg = scene.add.text(cam.width / 2, cam.height / 2, `Portail non relié à une vraie scène :\n"${key}" n'existe pas encore.`, {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#ffe9f5', align: 'center',
      backgroundColor: '#2a1f45', padding: { x: 10, y: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(3000);
    scene.tweens.add({ targets: msg, alpha: 0, delay: 1800, duration: 400, onComplete: () => msg.destroy() });
    console.warn(`goToScene: target scene "${key}" is not registered — is it still a draft that hasn't been downloaded/wired into main.js yet?`);
    return;
  }
  // Sans ce verrou, un déclencheur de sortie qui reste vrai plusieurs frames
  // de suite (ex: `player.x > levelWidth - 30`) relance fadeOut() à chaque
  // frame, ce qui remet le fondu à zéro en boucle — la scène ne change alors
  // jamais (camerafadeoutcomplete ne se déclenche jamais).
  if (scene.__transitioningAway) return;
  scene.__transitioningAway = true;
  // Même durée qu'avant (FADE_DURATION), courbe adoucie + léger zoom (juice).
  playSfx('zone_exit', { key });
  juiceFadeOut(scene, FADE_DURATION, () => {
    scene.scene.stop();
    scene.scene.start(key, data);
  });
}

// Totems de capacité (assets/items/totems.png, fond noir opaque -> découpé
// en assets/items/totem_frames/ via tools/crop_totems.py, qui utilise
// tools/dechroma.py pour le fond noir) : une paire "lit"/"dim" par forme —
// lumineux tant que la capacité n'est pas récupérée, éteint une fois
// obtenue (au lieu de simplement disparaître).
const TOTEM_TYPE_BY_FLAG = {
  hasMonkeyForm: 'monkey',
  hasWolfForm: 'wolf',
  hasEagleForm: 'eagle',
  hasOctopusForm: 'octopus',
};
// Retour utilisateur "les totems sont trop haut" mal lu la première fois
// comme "trop grands" (taille rétrécie à 0.2) -- retour user suivant :
// "ils sont devenus tout petit et ne touche pas le sol pour autant", donc
// "trop haut" voulait dire trop HAUT DANS LES AIRS (flotte au-dessus du
// sol), pas trop GRAND. Taille remise à l'originale ; le vrai bug (le
// totem ne touche pas le sol) est ailleurs, cf. addAbilityShrine/
// groundSurfaceYAt plus bas.
const TOTEM_SCALE = 0.35;
// `groundSurfaceYAt`/`groundSurfaceYAtGrid` posent le bas du totem pile sur
// la limite de grille (le haut "brut" de la case), mais les brins d'herbe
// dessinés sur la tuile du dessous sont épars (pointes, pas un trait plein)
// -- posé pile sur cette limite, on voit un filet de fond entre le socle du
// totem et les pointes d'herbe (retour utilisateur : "ils sont trop haut,
// ils ne touchent pas le sol" ; un premier essai à 10px restait
// insuffisant -- "encore trop haut" -- vérifié au pixel près sur fond
// magenta isolé : jusqu'à ~5px de filet visible encore visible à 10).
// Repris sur la MÊME référence que le joueur (qui, lui, ne flotte jamais :
// cf. AUTOTILE_GRASS_HITBOX_FRACTION plus bas dans ce fichier -- son corps
// s'enfonce déjà de GROUND_TILE_SIZE*(1-0.75)=16px sous cette même limite)
// plutôt qu'un nouveau chiffre au pif : si un enfoncement de 16px donne un
// ancrage correct pour ELLE sur cette tuile, la même valeur donne au moins
// autant de marge pour le socle du totem. (Valeur recopiée en dur, pas une
// référence directe à AUTOTILE_GRASS_HITBOX_FRACTION -- déclarée plus bas
// dans ce fichier, une `const` de plus haut niveau ne peut pas la lire
// avant son initialisation.) Appliqué UNIQUEMENT au totem (cf.
// addAbilityShrine), pas à `groundSurfaceYAt` elle-même (partagée avec les
// props/le feu de camp, qui n'ont pas ce problème).
// Valeur désormais propre au jeu de tuiles (AUTOTILE_TILESETS[..].totemSink :
// 16 pour 'floor', inchangé) : TOTEM_GROUND_SINK est déclaré plus bas, après
// AUTOTILE_TILESETS (une `const` de haut niveau ne peut pas lire une `const`
// déclarée après elle).

// Plantes devant le socle de chaque totem (retour utilisateur : "mettre des
// plantes devant les totems par défaut pour mieux les intégrer") -- mêmes
// frames que le sous-bois (cf. addUndergrowth) : un buisson de chaque côté,
// tourné vers l'extérieur, et une petite touffe au centre. Indices dans
// assets/decors/sous_bois_frames/ : 1-5 = buissons/fougères (rangée 3 de
// arbres.png), 6-13 = petites touffes (rangée 4).
// Retour utilisateur suivant : "les plantes sont trop hautes autour des
// totems, mets-les au même niveau que les autres" -- d'abord posées DEVANT
// le sol principal (base entièrement visible, donc plus hautes que le
// sous-bois voisin dont le pied passe derrière la frange d'herbe). Désormais
// au même enfoncement (SOUS_BOIS_SINK) et sur le même plan que le sous-bois,
// cf. sendBehindFrontGround : totem ET plantes passent juste derrière le sol
// principal, les plantes restant devant le totem.
const TOTEM_PLANT_SIDE_INDICES = [1, 2, 3, 4, 5];
const TOTEM_PLANT_CENTER_INDICES = [6, 7, 8, 9, 11, 13];
const TOTEM_PLANT_SIDE_SCALE = 0.34;
const TOTEM_PLANT_CENTER_SCALE = 0.38;
// Écart horizontal des buissons latéraux, en fraction de la largeur affichée
// du totem (depuis son centre).
const TOTEM_PLANT_SIDE_OFFSET = 0.5;

// `surfaceY` : haut visuel de la case de sol sous le totem (cf.
// groundSurfaceYAt), pas le bas du totem déjà enfoncé.
function addTotemPlants(scene, x, surfaceY, totemWidth) {
  const y = surfaceY + SOUS_BOIS_SINK;
  const jitter = () => Phaser.Math.FloatBetween(0.9, 1.1);
  const offset = totemWidth * TOTEM_PLANT_SIDE_OFFSET;
  return [
    addUndergrowthImage(scene, x - offset, y, pickUndergrowthVariant(scene, TOTEM_PLANT_SIDE_INDICES, x - offset, y), TOTEM_PLANT_SIDE_SCALE * jitter(), true),
    addUndergrowthImage(scene, x + offset, y, pickUndergrowthVariant(scene, TOTEM_PLANT_SIDE_INDICES, x + offset, y), TOTEM_PLANT_SIDE_SCALE * jitter(), false),
    addUndergrowthImage(scene, x, y, pickUndergrowthVariant(scene, TOTEM_PLANT_CENTER_INDICES, x, y), TOTEM_PLANT_CENTER_SCALE * jitter(), Math.random() < 0.5),
  ];
}

// Place les objets donnés juste derrière le sol principal (dans l'ordre :
// le premier reste le plus en arrière), sans toucher à leur profondeur --
// cf. `scene.__frontGroundFirstImage`, posé par buildLevelFromData.
function sendBehindFrontGround(scene, objects) {
  const anchor = scene.__frontGroundFirstImage;
  if (!anchor) return;
  for (const obj of objects) scene.children.moveBelow(obj, anchor);
}

// Bannière "transformation débloquée" : popup plein écran bref au premier
// déblocage, en plus du texte flottant déjà présent sur le totem. Retour
// utilisateur : "j'ai changé les popups, si tu veux bien les refaire" --
// l'ancien système (une image statique par forme, assets/items/
// unlock_frames/, RETIRÉ du disque) est remplacé par une vraie animation de
// pousse (assets/items/unlock_popup_animate/unlock{1..5}.png : graine qui
// craque -> liane qui pousse -> pancarte de bois complète, 5 poses
// PARTAGÉES par les 3 formes, pas une par forme). Une fois la pancarte
// poussée (dernière frame), l'icône de la forme (assets/items/form_icone/,
// SON PROPRE médaillon liane+feuilles complet, pas juste une image plate)
// vient se poser sur le médaillon rond déjà dessiné en haut de la
// pancarte, puis le texte (écrit à la main ci-dessous -- pas dérivable des
// images, retour utilisateur explicite) apparaît sur la planche de bois du
// milieu.
const UNLOCK_POPUP_ANIM_FRAME_COUNT = 5;
const ANIM_UNLOCK_POPUP_KEY = 'unlock-popup-grow';
const UNLOCK_POPUP_TARGET_WIDTH = 620;
const UNLOCK_POPUP_GROW_FRAME_RATE = 8;
const UNLOCK_POPUP_HOLD_MS = 1800;
const UNLOCK_POPUP_FADE_IN_MS = 350;
const UNLOCK_POPUP_ICON_FADE_MS = 250;
const UNLOCK_POPUP_FADE_OUT_MS = 500;
const UNLOCK_POPUP_DEPTH = 2000;
// Médaillon rond du haut de la pancarte, mesuré sur unlock5.png (dernière
// frame, 1448x1086) : centre à (724, 270), ~320px de diamètre extérieur.
// Exprimé en écart depuis le CENTRE du canvas (origine (0.5,0.5) par
// défaut sur `scene.add.sprite`) pour rester correct quelle que soit
// l'échelle appliquée à la pancarte.
const UNLOCK_POPUP_MEDALLION_OFFSET_Y = 270 - 1086 / 2;
const UNLOCK_POPUP_MEDALLION_DIAMETER = 320;
// Planche de bois du milieu (sous le médaillon), même mesure : centre à peu
// près à (724, 600).
const UNLOCK_POPUP_TEXT_OFFSET_Y = 600 - 1086 / 2;
// Texte écrit à la main (retour utilisateur explicite : pas dans les
// images) -- nom de la forme + le geste qui la déclenche, même vocabulaire
// que les commentaires de Player.js (sprint/double-saut/nage auto).
const FORM_UNLOCK_LABEL = {
  monkey: 'Forme Singe\nAccroche aux lianes',
  wolf: 'Forme Loup\nSprint (Shift ou double-tap)',
  eagle: 'Forme Aigle\nDouble-saut',
  octopus: 'Forme Pieuvre\nNage automatique',
};

function ensureUnlockPopupAnimation(scene) {
  if (scene.anims.exists(ANIM_UNLOCK_POPUP_KEY)) return;
  scene.anims.create({
    key: ANIM_UNLOCK_POPUP_KEY,
    frames: Array.from({ length: UNLOCK_POPUP_ANIM_FRAME_COUNT }, (_, i) => ({ key: `unlock-anim-${i}` })),
    frameRate: UNLOCK_POPUP_GROW_FRAME_RATE,
    repeat: 0,
  });
}

function showFormUnlockPopup(scene, totemType) {
  ensureUnlockPopupAnimation(scene);
  const cam = scene.cameras.main;
  const banner = scene.add.sprite(cam.width / 2, cam.height / 2, 'unlock-anim-0')
    .setScrollFactor(0)
    .setDepth(UNLOCK_POPUP_DEPTH)
    .setAlpha(0);
  const targetScale = UNLOCK_POPUP_TARGET_WIDTH / banner.width;
  banner.setScale(targetScale * 0.7);

  // Icône + texte : posés dès maintenant (mêmes coordonnées écran fixes que
  // la pancarte, jamais recalculées) mais invisibles (alpha 0) jusqu'à ce
  // que la pousse soit terminée -- cf. onComplete de l'anim plus bas.
  // Forme sans icône historique (singe) : icône du manifest ou placeholder.
  const iconKey = scene.textures.exists(`form-icon-${totemType}`) ? `form-icon-${totemType}`
    : (scene.textures.exists('item-form_icone_singe') && totemType === 'monkey' ? 'item-form_icone_singe' : manifestPlaceholderKey(scene, 'form_icone_singe'));
  const icon = scene.add.image(
    banner.x,
    banner.y + UNLOCK_POPUP_MEDALLION_OFFSET_Y * targetScale,
    iconKey,
  ).setScrollFactor(0).setDepth(UNLOCK_POPUP_DEPTH + 1).setAlpha(0);
  icon.setScale((UNLOCK_POPUP_MEDALLION_DIAMETER * targetScale) / icon.width);

  const label = scene.add.text(
    banner.x,
    banner.y + UNLOCK_POPUP_TEXT_OFFSET_Y * targetScale,
    FORM_UNLOCK_LABEL[totemType] || '',
    {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#f3e6c9',
      align: 'center',
      fontStyle: 'bold',
    },
  ).setOrigin(0.5).setScrollFactor(0).setDepth(UNLOCK_POPUP_DEPTH + 1).setAlpha(0);

  // Juice : rayons de lumière qui tournent lentement derrière la pancarte,
  // icône qui « pousse » (rebond) avec une gerbe d'étoiles, texte qui monte.
  const rays = scene.add.graphics().setScrollFactor(0).setDepth(UNLOCK_POPUP_DEPTH - 1)
    .setPosition(icon.x, icon.y).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    rays.fillStyle(i % 2 ? 0x8fe3b8 : 0xfff1c0, 0.22);
    rays.fillTriangle(0, 0, Math.cos(a - 0.07) * 260, Math.sin(a - 0.07) * 260, Math.cos(a + 0.07) * 260, Math.sin(a + 0.07) * 260);
  }
  const raysSpin = scene.tweens.add({ targets: rays, angle: 360, duration: 14000, repeat: -1 });
  const iconScale = icon.scale;
  const labelY = label.y;
  playSfx('form_unlock', { form: totemType });

  scene.tweens.add({
    targets: banner,
    alpha: 1,
    scale: targetScale,
    duration: UNLOCK_POPUP_FADE_IN_MS,
    ease: 'Back.Out',
    onComplete: () => {
      banner.play(ANIM_UNLOCK_POPUP_KEY);
      banner.once('animationcomplete', () => {
        icon.setScale(iconScale * 0.2);
        label.setY(labelY + 10);
        scene.tweens.add({ targets: icon, alpha: 1, scale: iconScale, duration: UNLOCK_POPUP_ICON_FADE_MS + 120, ease: 'Back.Out' });
        scene.tweens.add({ targets: label, alpha: 1, y: labelY, duration: UNLOCK_POPUP_ICON_FADE_MS + 80, delay: 80, ease: 'Cubic.Out' });
        scene.tweens.add({ targets: rays, alpha: 1, duration: 300 });
        spawnFx(scene, 'uiStar', icon.x, icon.y, { count: 14, power: 1.8 });
        scene.tweens.add({
          targets: [banner, icon, label, rays],
          alpha: 0,
          duration: UNLOCK_POPUP_FADE_OUT_MS,
          delay: UNLOCK_POPUP_HOLD_MS,
          onComplete: () => {
            banner.destroy();
            icon.destroy();
            label.destroy();
            raysSpin.remove();
            rays.destroy();
          },
        });
      });
    },
  });
}

// Sanctuaire de capacité : totem (lumineux tant que non récupérée, éteint
// une fois obtenue) + invite "E" flottante tant qu'Agarica est à portée et
// que la capacité n'est pas encore récupérée — le contact seul ne suffit
// plus, il faut appuyer sur E (interactKey, cf. Player.js) pour débloquer la
// transformation (registry, pour survivre au changement de scène, +
// instance Player vivante), avec un texte bref et une bannière plein écran.
// Hauteur du sol RÉEL (haut VISUEL de la tuile, pas le corps physique) sous
// un x donné. Sert à caler totem/feu de camp pile sur le sol plutôt que sur
// leur `y` de donnée brut (retour utilisateur : "les éléments comme feu de
// camp, totem etc sont trop hauts, il faut les redescendre au même niveau
// que agarica... même si je change le niveau" -- un `y` écrit à la main, ou
// collé depuis un autre niveau, peut facilement ne plus coller pile au sol
// réel dès que la grille change ; le recalculer depuis le sol RÉEL au
// moment de construire la scène rend ce genre d'objet increvable à ce
// décalage, quel que soit le niveau). `referenceY` : si DEUX tuiles de sol
// couvrent le même x (ex: une plateforme surélevée au-dessus d'un chemin
// continu, cf. Zone1Scene), retient celle la plus proche du y déjà fourni,
// pas systématiquement la plus haute -- sans ça un objet posé sur le chemin
// du bas sauterait sur la plateforme juste parce qu'elle existe quelque
// part au-dessus. Retourne null si la colonne n'a aucun sol (au-dessus d'un
// vide) : l'appelant garde alors le `y` d'origine plutôt que de planter.
//
// `tile.y - tile.displayHeight/2` (haut visuel de la case, TOUJOURS pleine
// case), PAS `tile.body.top` (retour utilisateur : "le feu de camp est un
// peu trop bas" -- régression du premier jet de cette fonction, qui lisait
// le corps physique. Ce dernier est délibérément RÉTRÉCI aux 3/4 du bas sur
// les tuiles d'herbe, cf. AUTOTILE_GRASS_TOP_POSITIONS/renderAutotileGrid,
// pour qu'Agarica s'enfonce visuellement dans les brins d'herbe -- correct
// pour ELLE (un personnage qui marche dedans), mais pas pour un décor
// statique qui doit rester posé sur le sommet visuel de l'herbe, ~16px plus
// haut).
//
// Seules les tuiles À DÉCOUVERT comptent (cf. openGroundTilesAt) : la case
// de sol cachée sous une marche ou un rocher en escalier pouvait être « la
// plus proche » de `referenceY` -- le décor se retrouvait alors enfoncé de
// toute la hauteur de la marche, dessiné sur sa face.
function groundSurfaceYAt(scene, x, referenceY) {
  let best = null;
  let bestDist = Infinity;
  for (const tile of openGroundTilesAt(scene, x)) {
    const surfaceY = tile.y - tile.displayHeight / 2;
    const dist = Math.abs(surfaceY - referenceY);
    if (best === null || dist < bestDist) {
      best = surfaceY;
      bestDist = dist;
    }
  }
  return best;
}

// Tuiles de sol sous `x` dont le dessus est à l'air libre (aucune autre tuile
// posée directement dessus) : les seules surfaces sur lesquelles on peut
// poser quelque chose.
function openGroundTilesAt(scene, x) {
  const groundGroup = scene.ground;
  if (!groundGroup) return [];
  const column = [];
  groundGroup.children.iterate((tile) => {
    if (!tile || !tile.active) return;
    const half = tile.displayWidth / 2;
    if (x >= tile.x - half && x <= tile.x + half) column.push(tile);
  });
  const covered = (t) => column.some((o) => o !== t
    && Math.abs(o.y + o.displayHeight / 2 - (t.y - t.displayHeight / 2)) < 2);
  return column.filter((t) => !covered(t));
}

// Comme groundSurfaceYAt, mais renvoie le haut de la HITBOX de la tuile (la
// ligne où les pieds d'Agarica se posent) plutôt que le haut de son image.
function groundStandYAt(scene, x, referenceY) {
  let best = null;
  let bestDist = Infinity;
  for (const tile of openGroundTilesAt(scene, x)) {
    const visualTop = tile.y - tile.displayHeight / 2;
    const standY = tile.body ? tile.body.top : visualTop;
    const dist = Math.abs(visualTop - referenceY);
    if (best === null || dist < bestDist) {
      best = standY;
      bestDist = dist;
    }
  }
  return best;
}

// ===========================================================================
// CALIBRAGE VISUEL (2026-10-23, cf. PLAN_DEV.md « Calibrage visuel »)
// Les images (art Codex, planches découpées) ont des marges transparentes
// variables (4-9 px sous les pieds, davantage sur certains décors) : poser au
// sol ou mettre à l'échelle d'après le CADRE de l'image laissait des objets
// flotter de quelques px et donnait des tailles différentes d'une pose à
// l'autre. Tout passe donc par la boîte des pixels VISIBLES
// (alpha > VISIBLE_ALPHA_MIN), mesurée une fois par frame (cache). Lecture
// impossible (page ouverte en file:// : canvas « tainted ») : repli sur le
// cadre de l'image (`exact: false`), le jeu reste jouable.
// ===========================================================================
const FRAME_ALPHA_CACHE = new Map();
const VISIBLE_ALPHA_MIN = 40;
// Décors posés au sol (props, feux, objets) : bas visible 1 px SOUS la ligne
// de marche. Le dernier rang de pixels d'une image réduite (filtrage
// linéaire) est à demi transparent : posé pile sur la ligne, un filet de
// fond restait visible entre le décor et l'herbe. Les personnages, eux, ont
// le bas visible exactement sur la ligne (bas de leur corps physique).
const GROUND_CONTACT_SINK = 1;
// Rangées du bas (fraction de la hauteur visible) qui forment la « base »
// (pieds, socle) et rangées du haut qui forment la « tête » (cf.
// calibratedScale), mesurées avec la boîte.
const VISIBLE_BASE_BAND = 0.12;
const VISIBLE_TOP_BAND = 0.15;

// Canal alpha d'une frame, MIS EN CACHE (requêtes colonne par colonne :
// haut visible des décors, poing des poses suspendues).
function frameAlphaMap(frame) {
  const key = `${frame.texture.key}#${frame.name}`;
  if (FRAME_ALPHA_CACHE.has(key)) return FRAME_ALPHA_CACHE.get(key);
  const map = readFrameAlpha(frame);
  FRAME_ALPHA_CACHE.set(key, map);
  return map;
}

// Lecture brute (sans cache) : la boîte visible des frames de personnages
// n'a besoin du canal alpha qu'une fois -- inutile de garder des Mo de
// pixels par frame animée.
function readFrameAlpha(frame) {
  let map = null;
  try {
    const w = frame.cutWidth;
    const h = frame.cutHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(frame.source.image, frame.cutX, frame.cutY, w, h, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const alpha = new Uint8Array(w * h);
    for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
    map = { w, h, alpha };
  } catch (e) {
    map = null;
  }
  return map;
}

// Étendue horizontale [x0, x1[ des pixels visibles des rangées [r0, r1[.
function visibleColumnSpan(map, r0, r1) {
  let x0 = map.w;
  let x1 = -1;
  for (let y = Math.max(0, r0); y < Math.min(map.h, r1); y++) {
    for (let x = 0; x < map.w; x++) {
      if (map.alpha[y * map.w + x] > VISIBLE_ALPHA_MIN) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
      }
    }
  }
  return x1 < 0 ? null : [x0, x1 + 1];
}

// Boîte des pixels visibles d'une frame, en px de la frame (non mis à
// l'échelle), mise en cache : { x0, y0, x1, y1 (bornes exclues), w, h,
// frameW, frameH, marginL, marginR, marginT, marginB (marges transparentes),
// area (nombre de px visibles), baseX0/baseX1 (colonnes visibles des rangées
// du bas : pieds, socle), topW (largeur visible des rangées du haut), exact }.
// Placeholder (canvas dessiné par code) : mesuré pareil (boîte ~pleine).
const VISIBLE_BOUNDS_CACHE = new Map();

function frameVisibleBounds(frame) {
  if (!frame || !frame.texture) return null;
  const key = `${frame.texture.key}#${frame.name}`;
  if (VISIBLE_BOUNDS_CACHE.has(key)) return VISIBLE_BOUNDS_CACHE.get(key);
  const fw = frame.cutWidth;
  const fh = frame.cutHeight;
  const map = FRAME_ALPHA_CACHE.get(`${frame.texture.key}#${frame.name}`) || readFrameAlpha(frame);
  let b = { x0: 0, y0: 0, x1: fw, y1: fh, area: fw * fh, baseX0: 0, baseX1: fw, topW: fw, exact: false };
  if (map) {
    let x0 = fw; let y0 = fh; let x1 = -1; let y1 = -1; let area = 0;
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        if (map.alpha[y * fw + x] > VISIBLE_ALPHA_MIN) {
          area++;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          y1 = y;
        }
      }
    }
    if (y1 < 0) {
      b = { ...b, area: 0, exact: true, empty: true };
    } else {
      const h = y1 + 1 - y0;
      const base = visibleColumnSpan(map, y1 + 1 - Math.max(2, Math.round(h * VISIBLE_BASE_BAND)), y1 + 1);
      const top = visibleColumnSpan(map, y0, y0 + Math.max(2, Math.round(h * VISIBLE_TOP_BAND)));
      b = {
        x0, y0, x1: x1 + 1, y1: y1 + 1, area, baseX0: base[0], baseX1: base[1],
        topW: top[1] - top[0], exact: true,
      };
    }
  }
  Object.assign(b, {
    w: b.x1 - b.x0, h: b.y1 - b.y0, frameW: fw, frameH: fh,
    marginL: b.x0, marginR: fw - b.x1, marginT: b.y0, marginB: fh - b.y1,
  });
  VISIBLE_BOUNDS_CACHE.set(key, b);
  return b;
}

// Boîte des pixels visibles de la texture `key` (frame `frameName`, sinon
// l'image entière) ; null si la texture n'existe pas.
function visibleBounds(scene, key, frameName) {
  if (!scene || !key || !scene.textures.exists(key)) return null;
  return frameVisibleBounds(scene.textures.getFrame(key, frameName));
}

// Coin haut-gauche monde d'une image/sprite non tourné (origine quelconque).
function objectFrameTopLeft(obj) {
  return {
    left: obj.x - obj.displayOriginX * Math.abs(obj.scaleX),
    top: obj.y - obj.displayOriginY * Math.abs(obj.scaleY),
  };
}

// Boîte MONDE des pixels visibles d'une image/sprite non tourné (miroirs
// gérés) : { left, right, top, bottom, baseLeft, baseRight }. Null sans frame.
function objectVisibleBox(obj) {
  const b = obj && frameVisibleBounds(obj.frame);
  if (!b) return null;
  const sx = Math.abs(obj.scaleX);
  const sy = Math.abs(obj.scaleY);
  const { left, top } = objectFrameTopLeft(obj);
  const fx = (c) => (obj.flipX ? b.frameW - c : c);
  const fy = (r) => (obj.flipY ? b.frameH - r : r);
  const span = (a, c, f) => [Math.min(f(a), f(c)), Math.max(f(a), f(c))];
  const [l, r] = span(b.x0, b.x1, fx);
  const [t, bo] = span(b.y0, b.y1, fy);
  const [bl, br] = span(b.baseX0, b.baseX1, fx);
  return {
    left: left + l * sx, right: left + r * sx, top: top + t * sy, bottom: top + bo * sy,
    baseLeft: left + bl * sx, baseRight: left + br * sx,
  };
}

// Haut visible (1er pixel opaque) de la colonne monde `x` d'un objet non
// retourné verticalement (les décors ne le sont jamais), ou null si `x` est
// hors de l'objet ou tombe sur une colonne vide.
function visibleTopYAt(obj, x) {
  const f = obj.frame;
  const sx = Math.abs(obj.scaleX);
  const sy = Math.abs(obj.scaleY);
  const { left, top } = objectFrameTopLeft(obj);
  let col = Math.floor((x - left) / sx);
  if (col < 0 || col >= f.cutWidth) return null;
  if (obj.flipX) col = f.cutWidth - 1 - col;
  const map = frameAlphaMap(f);
  if (!map) return top;
  for (let row = 0; row < map.h; row++) {
    if (map.alpha[row * map.w + col] > VISIBLE_ALPHA_MIN) return top + row * sy;
  }
  return null;
}

// Bas visible (sous la dernière rangée opaque) d'un objet, en coordonnées monde.
function visibleBottomY(obj) {
  const box = objectVisibleBox(obj);
  return box ? box.bottom : obj.y;
}

// Déplace `obj` verticalement pour que le bas de ses pixels visibles soit en `y`.
function setVisibleBottomY(obj, y) {
  obj.y += y - visibleBottomY(obj);
  return obj;
}

// Marge transparente sous les pieds (px de la frame), STABLE sur toute
// l'animation en cours : la plus petite de ses frames -- le personnage ne
// tressaute pas d'une frame à l'autre (les pieds d'une frame un peu plus
// haute flottent d'une fraction de px). Frame posée hors de l'anim courante
// (setTexture direct) : sa propre marge.
const ANIM_FOOT_MARGIN_CACHE = new WeakMap();
function stableFootMargin(sprite) {
  const frame = sprite.frame;
  const own = frameVisibleBounds(frame);
  if (!own || own.empty) return 0;
  const anim = sprite.anims && sprite.anims.currentAnim;
  if (!anim || !anim.frames.some((f) => f.frame === frame)) return own.marginB;
  if (!ANIM_FOOT_MARGIN_CACHE.has(anim)) {
    let m = Infinity;
    for (const af of anim.frames) {
      const b = frameVisibleBounds(af.frame);
      if (b && !b.empty) m = Math.min(m, b.marginB);
    }
    ANIM_FOOT_MARGIN_CACHE.set(anim, Number.isFinite(m) ? m : 0);
  }
  return ANIM_FOOT_MARGIN_CACHE.get(anim);
}

// Origine « aux pieds VISIBLES » d'un sprite d'origine (x, 1) : `y` désigne
// le bas visible (marge stable de l'anim en cours) et non plus le bord du
// cadre, pour TOUTE frame, quel que soit qui la change (anims, setTexture) --
// Phaser rappelle updateDisplayOrigin à chaque changement de frame. Sans
// effet tant que l'origine n'est pas en bas (poses ancrées ailleurs : liane,
// papillon). `body: true` : le bas du corps physique suit (cf.
// syncBodyToVisibleFeet), donc au sol : bas du corps = y = bas visible.
function anchorVisibleFeet(sprite, { body = false } = {}) {
  if (!sprite || !sprite.updateDisplayOrigin) return sprite;
  if (!sprite.__visibleFeet) {
    sprite.__visibleFeet = true;
    const base = sprite.updateDisplayOrigin;
    sprite.updateDisplayOrigin = function updateDisplayOriginOnVisibleFeet() {
      base.call(this);
      if (this.originY === 1 && this.frame && this.frame.cutHeight) {
        this._displayOriginY = this.height - stableFootMargin(this) * (this.height / this.frame.cutHeight);
      }
      return this;
    };
    sprite.updateDisplayOrigin();
  }
  if (body && sprite.body && sprite.scene) registerVisibleFeetBody(sprite);
  return sprite;
}

// Bas du corps physique d'un sprite ancré aux pieds visibles = son origine.
// Le code de chaque entité règle `body.offset` d'après le bas du CADRE (offsetY
// = hauteur de frame - hauteur du corps) : recalé ici après coup, à chaque
// image (cf. registerVisibleFeetBody), plutôt que dans chacune d'elles.
function syncBodyToVisibleFeet(sprite) {
  const body = sprite.body;
  if (!body || !body.setOffset || sprite.originY !== 1 || !sprite.__visibleFeet) return;
  const oy = sprite.displayOriginY - body.sourceHeight;
  if (Math.abs(body.offset.y - oy) > 0.01) body.setOffset(body.offset.x, oy);
}

// Recalage après la mise à jour de la scène (POST_UPDATE : après les update()
// des entités, avant le pas de physique suivant). Une liste par instance de
// scène (le listener reste posé d'une visite à l'autre, la liste se vide des
// sprites détruits).
function registerVisibleFeetBody(sprite) {
  const scene = sprite.scene;
  if (!scene.__visibleFeetBodies) {
    scene.__visibleFeetBodies = new Set();
    scene.events.on('postupdate', () => {
      for (const s of scene.__visibleFeetBodies) {
        if (!s.active || !s.body) scene.__visibleFeetBodies.delete(s);
        else syncBodyToVisibleFeet(s);
      }
    });
  }
  scene.__visibleFeetBodies.add(sprite);
  syncBodyToVisibleFeet(sprite);
}

// Haut visible du décor (`scene.props`, cf. buildLevelFromData) sous `x` : le
// plus haut si plusieurs se recouvrent ; `type` restreint à un type de prop.
// Null si aucun décor n'est sous `x`.
function propTopYAt(scene, x, type = null) {
  let best = null;
  for (const img of scene.props || []) {
    if (!img.active || (type && img.propType !== type)) continue;
    const y = visibleTopYAt(img, x);
    if (y != null && (best === null || y < best)) best = y;
  }
  return best;
}

// Dessus d'un décor sous les PIEDS de `obj` (colonnes visibles de ses rangées
// du bas, cf. frameVisibleBounds) : profil du haut visible du décor colonne
// par colonne, puis son 3e quartile (vers le bas). Le haut visible d'une
// souche ou d'un autel dessiné en perspective est le BORD ARRIÈRE de son
// plateau : posée sur le seul pixel le plus haut sous son centre (ancien
// calcul), Xara semblait voler au-dessus de sa souche. Le 3e quartile tombe
// dans le plateau et ignore une écharde isolée. `x` : position où `obj` sera
// posé (défaut : la sienne). Null si aucun décor sous ses pieds.
function propSurfaceYUnder(scene, obj, type = null, x = obj.x) {
  const box = objectVisibleBox(obj);
  const dx = x - obj.x;
  const l = (box ? box.baseLeft : obj.x - 4) + dx;
  const r = (box ? box.baseRight : obj.x + 4) + dx;
  const n = Math.max(3, Math.min(24, Math.round(r - l)));
  const ys = [];
  for (let i = 0; i < n; i++) {
    const y = propTopYAt(scene, l + ((i + 0.5) * (r - l)) / n, type);
    if (y != null) ys.push(y);
  }
  if (!ys.length) return null;
  ys.sort((a, c) => a - c);
  return ys[Math.min(ys.length - 1, Math.floor(ys.length * 0.75))];
}

// Pose `obj` en `x` pour que le BAS VISIBLE de son image touche la surface de
// marche sous lui (groundStandYAt ; `refY` départage deux couches), ou le
// dessus d'un décor (`onProp` : true ou type de prop, cf. propSurfaceYUnder,
// repli sur le sol). `sink` : enfoncement sous la surface
// (GROUND_CONTACT_SINK pour un décor, 0 pour un personnage). Renvoie la
// surface retenue, ou null (rien dessous : y inchangé).
function placeOnGround(scene, obj, x = obj.x, { refY = obj.y, onProp = null, sink = 0 } = {}) {
  obj.x = x;
  let surface = onProp ? propSurfaceYUnder(scene, obj, onProp === true ? null : onProp) : null;
  if (surface == null) surface = groundStandYAt(scene, x, refY);
  if (surface == null) return null;
  setVisibleBottomY(obj, surface + sink);
  return surface;
}

// Échelle « même taille apparente » d'une PLANCHE de poses : toutes les
// frames d'une même image source (feuille Codex) ont été dessinées à la même
// échelle, on en tire donc UNE échelle, appliquée à toutes ses poses --
// accroupie, couchée ou bras levé ne sont jamais agrandies ou réduites à
// tort. Référence : `refKey` affichée à `refScale` (ex. l'idle d'Agarica).
//  1. Frames « debout neutres » : tête en haut (rangées du haut assez larges,
//     pas un bras ou une arme levés), rapport largeur/hauteur proche de la
//     référence, hauteur parmi les plus grandes -> leur hauteur visible
//     médiane est alignée sur celle de la référence.
//  2. Sinon (coups en fente, sauts, roulades) ou `method: 'area'` (forme
//     animale) : surface visible (racine du nombre de px visibles, médiane)
//     alignée sur celle de la référence -- une fente perd de la hauteur mais
//     gagne en largeur, la surface reste comparable.
// `standing` : clés des frames à considérer debout (force la règle 1).
// Renvoie { scale, method } ou null (art absent / pixels illisibles : garder
// l'échelle par défaut).
const CALIB_STANDING_RATIO_TOL = 0.2;
const CALIB_HEAD_MIN_WIDTH = 0.35;
const CALIB_TALL_FRACTION = 0.9;

function calibrationMedian(values) {
  const v = values.slice().sort((a, b) => a - b);
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

function calibratedScale(scene, frameKeys, { refKey, refScale = 1, maxScale = Infinity, method = 'auto', standing = null } = {}) {
  const ref = visibleBounds(scene, refKey);
  const frames = frameKeys.map((key) => ({ key, b: visibleBounds(scene, key) })).filter((f) => f.b && !f.b.empty);
  if (!ref || !ref.exact || ref.empty || !frames.length || frames.some((f) => !f.b.exact)) return null;
  let scale = null;
  let used = 'area';
  if (method !== 'area') {
    const headUp = frames.filter((f) => f.b.topW >= CALIB_HEAD_MIN_WIDTH * f.b.w);
    const tallest = Math.max(0, ...headUp.map((f) => f.b.h));
    const st = standing ? frames.filter((f) => standing.includes(f.key))
      : headUp.filter((f) => f.b.w / f.b.h <= ref.w / ref.h + CALIB_STANDING_RATIO_TOL && f.b.h >= CALIB_TALL_FRACTION * tallest);
    if (st.length) {
      scale = (ref.h * refScale) / calibrationMedian(st.map((f) => f.b.h));
      used = 'height';
    }
  }
  if (scale == null) scale = (Math.sqrt(ref.area) * refScale) / calibrationMedian(frames.map((f) => Math.sqrt(f.b.area)));
  return { scale: Math.min(maxScale, scale), method: used };
}

// Totem sans art historique (singe) : image du manifest `totem_<type>_<état>`
// (ou son placeholder) à la place de `totem-<type>-<état>`.
function totemTextureKey(scene, totemType, state) {
  const key = `totem-${totemType}-${state}`;
  if (scene.textures.exists(key)) return key;
  const itemId = `totem_${totemType}_${state}`;
  if (scene.textures.exists(`item-${itemId}`)) return `item-${itemId}`;
  return manifestPlaceholderKey(scene, itemId);
}

// Idempotent : le flag protège contre un second déclenchement. Vérifié à
// chaque frame via `scene.events.on('update', ...)` plutôt qu'un collider
// dédié : pas besoin de toucher la boucle update() de chaque Zone*Scene.
function addAbilityShrine(scene, x, y, flagName, message, scale = TOTEM_SCALE) {
  const totemType = TOTEM_TYPE_BY_FLAG[flagName] || 'wolf';
  const alreadyHas = !!scene.registry.get(flagName);
  const textureKey = totemTextureKey(scene, totemType, alreadyHas ? 'dim' : 'lit');

  // Cf. TOTEM_GROUND_SINK : `y` (déjà calé sur la limite de grille par
  // l'appelant) est légèrement enfoncé pour que le socle touche vraiment
  // l'herbe au lieu de flotter juste au-dessus. Origine aux pieds VISIBLES
  // (cf. anchorVisibleFeet) : c'est le bas du socle dessiné qui est enfoncé,
  // pas le bord du cadre (marge transparente de ~2 px), y compris après le
  // passage lumineux -> éteint (setTexture plus bas).
  y += TOTEM_GROUND_SINK;
  const marker = scene.physics.add.staticSprite(x, y, textureKey);
  marker.setOrigin(0.5, 1);
  marker.setScale(scale);
  anchorVisibleFeet(marker);
  marker.body.updateFromGameObject();
  const plants = addTotemPlants(scene, x, y - TOTEM_GROUND_SINK, marker.displayWidth);
  // Juice : halo qui « respire » derrière le totem tant qu'il n'est pas
  // activé, lueurs qui montent (cf. l'update plus bas).
  const haloY = y - marker.displayHeight * 0.55;
  let halo = null;
  if (!alreadyHas) {
    const ht = juiceTexture(scene, 'fx_halo_doux', 'juice-glow');
    const hs = (marker.displayHeight * 1.15) / ht.size;
    halo = scene.add.image(x, haloY, ht.key).setBlendMode(Phaser.BlendModes.ADD).setTint(0x8fe3b8).setAlpha(0.3).setScale(hs);
    scene.tweens.add({ targets: halo, alpha: { from: 0.14, to: 0.42 }, scale: { from: hs * 0.9, to: hs * 1.08 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  sendBehindFrontGround(scene, [...(halo ? [halo] : []), marker, ...plants]);
  let nextMoteAt = 0;

  const prompt = scene.add.text(x, y - marker.displayHeight - 14, 'Appuie sur E', {
    fontFamily: 'sans-serif',
    fontSize: '13px',
    color: '#ffe9f5',
    backgroundColor: '#2a1f45',
    padding: { x: 6, y: 3 },
  }).setOrigin(0.5).setVisible(false);

  scene.events.on('update', () => {
    // Cf. `currentLevelScene` : ce listener n'est jamais retiré au départ
    // de la zone (persiste sur `scene.events`, réutilisé d'une visite à
    // l'autre) -- sans ce garde-fou il continuerait à tourner sur un
    // `marker`/`scene.player` d'une visite précédente, potentiellement déjà
    // détruits, après un retour dans cette même zone.
    if (scene !== currentLevelScene) return;
    // Écouteur d'une visite précédente (totem détruit avec elle) : inerte.
    if (!marker.scene) return;
    if (scene.registry.get(flagName) || isWorldFrozen(scene)) {
      prompt.setVisible(false);
      return;
    }
    // Lueurs qui montent du totem encore actif (plus serrées à portée).
    const now = scene.time.now;
    if (halo && halo.active && now >= nextMoteAt) {
      const near = Math.abs(scene.player.x - x) < 220;
      nextMoteAt = now + (near ? 260 : 520);
      spawnFx(scene, 'motes', x + Phaser.Math.Between(-18, 18), haloY + Phaser.Math.Between(-20, 30), { count: 1, color: [0x8fe3b8, 0xe8fff2, 0xff9fc9] });
    }
    const inRange = scene.physics.overlap(scene.player, marker);
    prompt.setVisible(inRange);
    if (!inRange || !Phaser.Input.Keyboard.JustDown(scene.player.interactKey)) return;

    scene.registry.set(flagName, true);
    scene.player[flagName] = true;
    // Équipe aussitôt la forme dans le 1er emplacement libre (même geste
    // que la triche Ctrl+Shift+D, cf. setupDebugToggle) -- retour
    // utilisateur : "les totems lance l'animation de débloquage mais ne
    // débloque pas la forme". `hasWolfForm` seul ne suffit pas à l'utiliser
    // (cf. formEquipped() dans Player.js, `equippedForms` réglé UNIQUEMENT
    // depuis CampfireMenuScene) -- correct pour un feu de camp accessible
    // juste après coup, mais un seul feu de camp existe dans tout le jeu
    // (Zone1, AVANT son propre totem) : les sanctuaires Aigle/Pieuvre
    // (Zone3/Zone4) n'ont plus aucun feu de camp accessible ensuite pour
    // les équiper, rendant ces 2 formes à jamais inutilisables malgré le
    // flag posé. `TOTEM_TYPE_BY_FLAG[flagName]` (pas `totemType`, qui
    // retombe sur 'wolf' par défaut) exclut les futurs sanctuaires de
    // compétence (flagName hors de cette table) -- ceux-là doivent
    // continuer à passer par le choix explicite du feu de camp.
    if (TOTEM_TYPE_BY_FLAG[flagName] && !scene.player.equippedForms.includes(totemType)) {
      const emptySlot = scene.player.equippedForms.indexOf(null);
      if (emptySlot !== -1) scene.player.equippedForms[emptySlot] = totemType;
      scene.registry.set('equippedForms', scene.player.equippedForms);
    }
    // Éteint plutôt que détruit : le totem reste planté là, juste sans
    // lueur, comme une capacité déjà récupérée.
    marker.setTexture(totemTextureKey(scene, totemType, 'dim'));
    if (isStoryScene(scene)) saveGame(scene, { silent: true });
    prompt.setVisible(false);
    // Juice : gros éclat à l'activation (flash du totem, halo, anneau,
    // gerbe de lueurs), secousse et petit zoom ; le halo s'éteint.
    juiceFlash(marker, 0xffffff, 140);
    juiceBurstImage(scene, 'glow', x, haloY, { size: marker.displayHeight * 2.6, from: 0.3, to: 1.2, ms: 520, color: 0xe8fff2, alpha: 0.9 });
    juiceShockRing(scene, x, haloY, { size: marker.displayHeight * 2.2, ms: 520, color: 0x8fe3b8 });
    spawnFx(scene, 'motes', x, haloY, { count: 22, spread: 26, power: 2.4, color: [0x8fe3b8, 0xe8fff2, 0xff9fc9] });
    spawnFx(scene, 'star', x, haloY, { count: 12, power: 2 });
    juiceShake(scene, 'medium');
    juiceZoomPulse(scene, { zoom: 1.04, ms: 700 });
    playSfx('totem_activate', { form: totemType });
    if (halo) {
      const h = halo;
      halo = null;
      scene.tweens.killTweensOf(h);
      scene.tweens.add({ targets: h, alpha: 0, scale: h.scale * 1.6, duration: 700, onComplete: () => h.destroy() });
    }
    showFormUnlockPopup(scene, totemType);

    const label = scene.add.text(marker.x, marker.y - marker.displayHeight - 10, message, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#ffe9f5',
      align: 'center',
    }).setOrigin(0.5);
    scene.tweens.add({
      targets: label,
      alpha: 0,
      y: label.y - 30,
      duration: 1800,
      delay: 700,
      onComplete: () => label.destroy(),
    });
  });
}

// Feu de camp décoratif (assets/items/feu de camp.png, 4 flambées côte à
// côte, découpé en assets/items/feu_de_camp_frames/ par plage de colonnes
// avec contenu — les étincelles volantes forment des îlots séparés de la
// flamme, ce qui ferait exploser tools/split_spritesheet.py habituel en
// dizaines de micro-frames). Purement décoratif (pas de collision, pas de
// lumière/chaleur), juste une boucle d'anim en continu.
const CAMPFIRE_FRAME_COUNT = 4;
const CAMPFIRE_TEXTURE_PREFIX = 'decor-campfire-';
const ANIM_CAMPFIRE_BURN_KEY = 'campfire-burn';
const CAMPFIRE_SCALE = 0.15;

function ensureCampfireAnimation(scene) {
  if (scene.anims.exists(ANIM_CAMPFIRE_BURN_KEY)) return;

  scene.anims.create({
    key: ANIM_CAMPFIRE_BURN_KEY,
    frames: Array.from({ length: CAMPFIRE_FRAME_COUNT }, (_, i) => ({ key: `${CAMPFIRE_TEXTURE_PREFIX}${i}` })),
    frameRate: 8,
    repeat: -1,
  });
}

// Portée (px) pour interagir avec un feu de camp (cf. plus bas) : distance
// simple plutôt qu'un corps physique dédié, le feu lui-même reste une
// sprite purement décorative (cf. commentaire CAMPFIRE_FRAME_COUNT) sans
// body — plus léger que de lui ajouter une hitbox juste pour ce check.
const CAMPFIRE_INTERACT_RANGE = 70;

// `y` est le sol sous le feu (même convention que addAbilityShrine :
// origine ancrée en bas). Interaction (E) : restaure vie/énergie au max
// (cf. Player.refillAtCampfire) ET lance CampfireMenuScene (cf. ce
// fichier) EN PARALLÈLE -- vrai menu à glisser-déposer (formes/
// compétences/totems), plus le bricolage Graphics/Text+touches d'avant
// (retour utilisateur : "fais un vrai menu propre... glisser déposer").
function addCampfire(scene, x, y, scale = CAMPFIRE_SCALE) {
  ensureCampfireAnimation(scene);
  // Bûches posées sur la surface de marche (haut de la hitbox, comme les
  // props et les pieds d'Agarica) ; l'ancien enfoncement fixe de 14 px sous
  // le haut de l'image de tuile laissait le feu 3 px au-dessus d'elle.
  // Bas VISIBLE des bûches (marge transparente la plus basse des 4 flambées,
  // cf. anchorVisibleFeet : aucun tressautement d'une flambée à l'autre),
  // enfoncé de GROUND_CONTACT_SINK -- posé sur le bord du cadre, le feu
  // flottait encore de 1-2 px au-dessus de l'herbe.
  const footY = groundStandYAt(scene, x, y) ?? y;
  const fire = scene.add.sprite(x, footY, `${CAMPFIRE_TEXTURE_PREFIX}0`)
    .setOrigin(0.5, 1)
    .setScale(scale)
    .play(ANIM_CAMPFIRE_BURN_KEY);
  anchorVisibleFeet(fire);
  fire.y = footY + GROUND_CONTACT_SINK;
  // Juice : halo chaud qui respire derrière la flamme, braises qui montent et
  // petites gerbes d'étincelles au hasard (cf. l'update plus bas).
  const flameY = footY - fire.displayHeight * 0.42;
  const glowTex = juiceTexture(scene, 'fx_halo_doux', 'juice-glow');
  const glowScale = (fire.displayWidth * 3.4) / glowTex.size;
  const halo = scene.add.image(x, flameY, glowTex.key).setBlendMode(Phaser.BlendModes.ADD)
    .setTint(0xffa860).setAlpha(0.3).setScale(glowScale);
  scene.children.moveBelow(halo, fire);
  scene.tweens.add({
    targets: halo, alpha: { from: 0.28, to: 0.52 }, scale: { from: glowScale * 0.93, to: glowScale * 1.07 },
    duration: 950, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });
  let nextEmberAt = 0;
  let nextCrackleAt = 0;

  const prompt = scene.add.text(x, y - 90, 'Appuie sur E pour te reposer', {
    fontFamily: 'sans-serif',
    fontSize: '13px',
    color: '#ffe9f5',
    backgroundColor: '#2a1f45',
    padding: { x: 6, y: 3 },
  }).setOrigin(0.5).setVisible(false);

  scene.events.on('update', () => {
    // Cf. `currentLevelScene` (même raison que dans addAbilityShrine) :
    // ce listener persiste d'une visite à l'autre de la zone.
    if (scene !== currentLevelScene) return;
    // Écouteur d'une visite précédente (feu détruit avec elle) : inerte.
    if (!fire.scene) return;
    // Crépitement : braises en continu, gerbe d'étincelles de temps en temps
    // (seulement près de l'écran ; aussi pendant le menu, monde gelé).
    const now = scene.time.now;
    const view = scene.cameras.main.worldView;
    if (x > view.x - 120 && x < view.right + 120) {
      if (now >= nextEmberAt) {
        nextEmberAt = now + Phaser.Math.Between(120, 260);
        spawnFx(scene, 'embers', x + Phaser.Math.Between(-8, 8), flameY - 4, { count: 1, spread: 6 });
      }
      if (now >= nextCrackleAt) {
        nextCrackleAt = now + Phaser.Math.Between(1300, 3200);
        spawnFx(scene, 'crackle', x + Phaser.Math.Between(-6, 6), flameY, { count: Phaser.Math.Between(3, 6) });
        halo.setAlpha(Math.min(0.55, halo.alpha + 0.12));
      }
    }
    // Menu ouvert (scène séparée, cf. CampfireMenuScene.update() pour sa
    // propre fermeture E/Échap) : le prompt "Appuie sur E" (texte MONDE,
    // pas écran) resterait sinon affiché par-dessus, inchangé depuis juste
    // avant l'ouverture.
    if (isWorldFrozen(scene)) {
      prompt.setVisible(false);
      return;
    }
    const inRange = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, x, y) <= CAMPFIRE_INTERACT_RANGE;
    prompt.setVisible(inRange);
    if (!inRange || !Phaser.Input.Keyboard.JustDown(scene.player.interactKey)) return;
    // Juice : le feu s'embrase (flamme qui grandit, gerbe d'étincelles, halo).
    scene.tweens.add({ targets: fire, scaleX: scale * 1.15, scaleY: scale * 1.28, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
    spawnFx(scene, 'crackle', x, flameY, { count: 16 });
    juiceBurstImage(scene, 'glow', x, flameY, { size: fire.displayWidth * 5, from: 0.4, to: 1.1, ms: 600, color: 0xffb070, alpha: 0.6 });
    spawnFx(scene, 'motes', scene.player.x, scene.player.y - 40, { count: 10, spread: 18, color: [0xffd8a0, 0xff9fc9, 0xe8fff2] });
    playSfx('campfire_rest');
    scene.player.refillAtCampfire();
    // Coupe l'élan en cours avant de geler les updates (cf.
    // updateLevelFromData, qui n'appelle plus player.update() tant que
    // CampfireMenuScene est active) -- sans ça la vitesse au moment de
    // l'ouverture continuerait d'être appliquée par le moteur physique
    // pendant que les touches de direction, elles, ne font plus rien.
    scene.player.setVelocity(0, 0);
    scene.scene.launch('CampfireMenuScene', { player: scene.player });
    // Les zones de l'histoire sont déclarées APRÈS le menu dans main.js : sans
    // ça le menu serait dessiné sous la zone.
    scene.scene.bringToTop('CampfireMenuScene');
    // Sauvegarde à chaque feu de camp (zones de l'histoire seulement : les
    // zones de test ne doivent pas écraser la progression).
    if (isStoryScene(scene)) {
      saveGame(scene);
      scene.scene.get('CampfireMenuScene').events.once('shutdown', () => saveGame(scene, { silent: true }));
    }
  });
}

// ---------------------------------------------------------------------
// Terrain en grille (mode édition, voir EditorScene.js) : contrairement au
// sol des Zone*Scene existantes (une seule rangée fixe + remplissage, cf.
// fillGroundTiles plus haut), un niveau construit dans l'éditeur est un
// ensemble de cellules quelconque (formes libres, îlots, plafonds...) —
// chaque cellule choisit automatiquement le bon morceau de tuile 9-slice
// (assets/decors/floor.png, voir tools/crop_autotile.py) selon ses 4
// voisins directs, comme un autotile "blob" classique. Les Zone*Scene
// actuelles ne sont PAS migrées vers ce système — il ne sert qu'aux
// nouveaux niveaux construits dans l'éditeur (buildLevelFromData
// ci-dessous). Un seul matériau ("terre") : l'ancienne option "Roche"
// (planche dédiée séparée, avec ses propres variantes "-bare" pour un bord
// vertical exposé sur le côté plutôt que tourné vers le ciel) a été retirée
// de l'éditeur quand floor.png est passé à une planche terre uniquement,
// plutôt que de réutiliser les mêmes tuiles sous un faux choix "Roche".
// DEUX jeux de tuiles de terrain interchangeables : basculer de l'un à
// l'autre = changer AUTOTILE_TILESET ci-dessous et rien d'autre.
//   'floor'  -- le jeu d'origine, généré par IA puis découpé de
//               assets/decors/floor.png par tools/crop_autotile.py.
//               Grosses images (283 à 1254 px) réduites à l'affichage :
//               terre brune, bancs de rochers gris sur les bords exposés,
//               canopée de mousse et champignons sur le dessus.
//   'tuiles' -- le pixel art dessiné à la main, généré par
//               tools/cut_tuiles.py depuis assets/decors/tuiles.png.
//               Tuiles de 24 px agrandies à l'affichage, donc filtre au
//               plus proche voisin obligatoire (`pixelArt` ci-dessous, cf.
//               BootScene) : en filtrage linéaire — le défaut de Phaser,
//               correct pour tout le reste des assets, qui sont dessinés
//               en grand puis RÉDUITS — un caillou de 3 px devient une
//               bouillie floue.
// Les deux jeux n'ont PLUS la même disposition (refonte de 'tuiles', 2026-10) :
//   layout 'blob'  ('floor') -- les 21 fichiers dirt_*.png, choisis par
//                  autotilePositionKey (9-slice + coins intérieurs +
//                  plateformes), herbe DESSINÉE dans les tuiles du haut avec
//                  du ciel transparent au-dessus, d'où une hitbox aux 3/4
//                  (grassHitboxFraction 0.75) et les boosts de hauteur.
//   layout 'atlas' ('tuiles') -- l'atlas en cases nommées découpé par
//                  tools/cut_tuiles.py (A1..A9, B, C1..C7, D1..D6 + herbes
//                  séparées, cf. son en-tête et atlasTileFor) : chaque case
//                  est PLEINE, le haut de la case de surface est la ligne où
//                  l'on marche et l'herbe est une image à part posée
//                  par-dessus, sans hitbox -> grassHitboxFraction 1.
// Basculer de l'un à l'autre reste un seul mot (AUTOTILE_TILESET) : tout ce
// qui dépend de la hauteur de marche passe par GROUND_STAND_SINK (dérivé de
// grassHitboxFraction) au lieu d'un « +16 » écrit en dur.
// Les jeux des biomes (clé de zone `tileset`, TILESET_MANIFEST) sont TOUJOURS
// au format 'blob' : une zone qui en a un complet est rendue en 'blob' quel
// que soit le jeu par défaut, avec la ligne de marche du jeu par défaut (cf.
// autotileLayoutFor et AUTOTILE_BLOB_ART_STAND_SINK).
// `totemSink` : enfoncement du socle du totem sous le haut VISUEL de la case
// (cf. TOTEM_GROUND_SINK) -- pour 'floor', la valeur historique réglée à l'œil.
// `undersideTrim` : px retirés du BAS de la hitbox d'une case sans voisin au
// sud (dessous d'une plateforme, plafond d'un tunnel), cf.
// AUTOTILE_UNDERSIDE_TRIM.
const AUTOTILE_TILESET = 'tuiles';
const AUTOTILE_TILESETS = {
  floor: {
    dir: 'assets/decors/autotile_frames', pixelArt: false, layout: 'blob',
    grassHitboxFraction: 0.75, totemSink: 16, undersideTrim: 0,
  },
  tuiles: {
    dir: 'assets/decors/tuiles_frames', pixelArt: true, layout: 'atlas',
    grassHitboxFraction: 1, totemSink: 1, undersideTrim: 16,
  },
};
const AUTOTILE_TILESET_DIR = AUTOTILE_TILESETS[AUTOTILE_TILESET].dir;
const AUTOTILE_LAYOUT = AUTOTILE_TILESETS[AUTOTILE_TILESET].layout;

const AUTOTILE_POSITIONS = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br'];
const AUTOTILE_PREFIX = { dirt: 'autotile-dirt-' };
// Les 3 positions du haut (tl/t/tr) ont une haute touffe d'herbe dessinée
// sur floor.png, qui occupe visuellement environ la moitié haute de la
// case — la hitbox pleine case (cf. plus bas) rendait donc le sol "solide"
// bien plus haut que la terre elle-même, comme si on marchait en l'air au
// niveau des brins les plus hauts. Réduite aux 3/4 du bas (demande
// explicite : "au 3/4 du haut" — la partie SOLIDE fait 3/4 de la case,
// seul le dernier quart du haut, les tout derniers brins, n'est plus
// solide) pour ces 3 positions uniquement — les autres (bord nu ou
// intérieur) n'ont pas cette touffe et gardent la hitbox pleine case
// normale.
const AUTOTILE_GRASS_TOP_POSITIONS = new Set(['tl', 't', 'tr']);
// Cf. commentaire sur son usage dans renderAutotileGrid : les 3 tuiles du
// haut affichées un peu plus hautes que la case carrée normale (tl un peu
// plus que tr, 't' juste une touche — ajustées une par une en jeu, retours
// utilisateur successifs). Valeurs à continuer d'affiner si besoin.
const AUTOTILE_CORNER_HEIGHT_BOOST = { tl: 1.16, tr: 1.09, t: 1.07 };
// Boost dédié aux plateformes (indexé par texture, pas par `pos` — cf.
// `isPlatform` dans renderAutotileGrid : platform2 partage 'tl'/'tr' avec
// les tuiles de sol normales ci-dessus mais ne doit PAS hériter de leur
// boost, bien plus fort). Retours utilisateur successifs : d'abord trop
// haute avec le boost tl/tr complet, puis un peu trop basse à 1 (aucun
// boost) -- petite valeur dédiée à la place.
const AUTOTILE_PLATFORM_HEIGHT_BOOST = { 'autotile-dirt-platform2': 1.05 };
// dirt_t2/tl2/tr2 (variantes alternatives des tuiles du haut, dessinées à
// part par l'utilisateur) existent toujours sur le disque mais ne sont
// PLUS du tout tirées dans la construction (retour utilisateur : d'abord
// "vire tr2 et tl2 des construction", puis "retire t2 de la liste des
// tuiles") -- ne pas les re-brancher sans qu'il le redemande.
// Plateforme flottante (assets/decors/plateforme.png, cf.
// tools/crop_autotile.py) : une case "herbe du dessus" qui n'a AUCUN
// voisin au sud (un vrai bloc isolé en l'air, pas le sommet d'une masse de
// terre continue) affiche un pourtour rocheux fermé de tous les côtés au
// lieu de la tuile top habituelle, qui suppose que quelque chose de solide
// continue en dessous et ne dessine donc rien pour fermer le dessous.
const AUTOTILE_PLATFORM_VARIANT_COUNT = 3;
// Part SOLIDE de la case (pas la part retirée) : 0.75 = les 3/4 du bas
// restent solides, seul le dernier 1/4 du haut ne l'est plus. Propriété du
// jeu de tuiles (cf. AUTOTILE_TILESETS) : 1 pour 'tuiles' (case pleine).
const AUTOTILE_GRASS_HITBOX_FRACTION = AUTOTILE_TILESETS[AUTOTILE_TILESET].grassHitboxFraction;
// Écart entre le haut VISUEL d'une case de surface (multiple de 64, ex. 448)
// et la ligne où l'on MARCHE (haut de sa hitbox) : 16 px pour 'floor', 0 pour
// 'tuiles'. SEULE source de vérité pour tout ce qui doit se poser à hauteur
// des pieds d'Agarica (PNJ, arènes de boss, décors, constantes des
// src/data/*.js et src/story/*.js) -- ne jamais réécrire « 448 + 16 » / 464.
const GROUND_STAND_SINK = GROUND_TILE_SIZE * (1 - AUTOTILE_GRASS_HITBOX_FRACTION);
// Les décors (props) sont posés sur la surface de marche, cf.
// groundStandYAt ; l'éditeur décale son aperçu d'autant.
const PROP_GROUND_SINK = GROUND_STAND_SINK;
// Passer de 'floor' à 'tuiles' remonte la ligne de marche de 16 px (cases
// pleines) sans bouger le dessous des cases : toutes les hauteurs libres sous
// une plateforme ou un plafond perdaient 16 px. Les niveaux sont pleins de
// plateformes posées une rangée au-dessus du sol (64 px libres + 16 = 80 avec
// 'floor') : à 64 px, Agarica (corps de ~67 px) restait bloquée dessous
// (vérifié : Zone1, carrefour de la forêt corrompue). On retire donc ces
// mêmes 16 px du BAS de la hitbox des cases sans voisin au sud : toutes les
// distances verticales du jeu (sauts, passages, plafonds) redeviennent
// identiques au pixel près à celles réglées avec 'floor'. Effet visuel : la
// tête peut mordre de quelques px (16 au plus, en se cognant) dans le dessous
// de la case -- à réduire ici si ça se voit trop (garder ≥ 4 px pour
// qu'Agarica humaine passe encore sous une plateforme à une rangée du sol).
const AUTOTILE_UNDERSIDE_TRIM = AUTOTILE_TILESETS[AUTOTILE_TILESET].undersideTrim;
// Cf. son commentaire d'origine plus haut (addAbilityShrine). 'tuiles' : le
// dessus de l'herbe est un trait plein à la hauteur de marche, un enfoncement
// de 3 px suffit à planter le socle dedans. (Le feu de camp, lui, se pose
// directement sur la surface de marche, cf. addCampfire.)
const TOTEM_GROUND_SINK = AUTOTILE_TILESETS[AUTOTILE_TILESET].totemSink;
// Art au format 'blob' ('floor' ET jeux Codex des biomes, cf.
// tools/import_codex_assets.py) : la ligne d'herbe où l'on marche y est
// dessinée au 1er quart de la case (hitbox d'herbe aux 3/4, 16 px). Quand le
// jeu par défaut marche plus haut (GROUND_STAND_SINK 0 avec 'tuiles'), le
// rendu 'blob' d'une zone remonte TOUTES ses images de la différence
// (AUTOTILE_BLOB_VISUAL_LIFT) : l'herbe dessinée retombe sur la ligne de
// marche commune, et le dessous des masses sur le dessous de leur hitbox
// (raccourci d'AUTOTILE_UNDERSIDE_TRIM, la même valeur).
const AUTOTILE_BLOB_ART_STAND_SINK = 16;
const AUTOTILE_BLOB_VISUAL_LIFT = AUTOTILE_BLOB_ART_STAND_SINK - GROUND_STAND_SINK;
// Coin INTÉRIEUR (concave) : les 4 voisins orthogonaux sont pleins (donc
// pas d'arête exposée, cf. autotilePositionKey) mais un voisin EN DIAGONALE
// manque — cas d'un escalier en blocs carrés (ex: une marche qui monte en
// diagonale), que le blob 4-directionnel normal ne peut pas représenter (il
// retomberait sur la case pleine 'c', sans repli visible à l'endroit exact
// où le vide diagonal touche cette case). Les 2 coins du HAUT (in-tl/in-tr,
// là où on monte/marche sur la diagonale, herbe visible) utilisent
// dirt_angle.png ; les 2 coins du BAS (in-bl/in-br, le dessous d'un bloc,
// jamais foulé, pas d'herbe) utilisent coin.png à la place — pas la même
// image, celle du haut a une touffe d'herbe qui n'a pas de sens à l'envers.
// dirt_angle.png ne tourne JAMAIS (demande explicite plus ancienne : une
// vraie rotation retournerait l'éclairage du mur dessiné, qui suppose
// toujours "haut = haut") — seul un miroir HORIZONTAL distingue gauche
// (in-tl) de droite (in-tr). coin.png (pur rocher, sans direction de
// lumière aussi marquée) est utilisée "à l'envers" pour les 2 coins du bas
// (retour utilisateur) : miroir VERTICAL depuis son orientation dessinée
// (coin en haut à gauche) pour rejoindre le bas de la case, PLUS un miroir
// horizontal pour distinguer in-bl de in-br, comme dirt_angle.png au-dessus.
const AUTOTILE_INNER_CORNER_TEXTURE = {
  'in-tl': 'autotile-dirt-angle', 'in-tr': 'autotile-dirt-angle',
  'in-bl': 'autotile-dirt-coin', 'in-br': 'autotile-dirt-coin',
};
const AUTOTILE_INNER_CORNER_FLIP_X = { 'in-tl': false, 'in-tr': true, 'in-bl': false, 'in-br': true };
const AUTOTILE_INNER_CORNER_FLIP_Y = { 'in-tl': false, 'in-tr': false, 'in-bl': true, 'in-br': true };
// Case "intérieure" (fill, tous voisins pleins) : plusieurs variantes
// (assets/decors/floor.png, les cases hors du bloc 3x3 classique — cf.
// tools/crop_autotile.py) piochées au hasard plutôt qu'une texture fixe,
// pour qu'une grande zone de terre pleine ne répète pas visiblement la
// même case. La 7e (var6, coin bas-droite de la planche) a été retirée à
// la demande de l'utilisateur.
const DIRT_CENTER_VARIANT_COUNT = 6;
// Retour utilisateur : "pour les élément de décors du mode édit j'ai
// rajouter le dossier déco item qui contient d'autre dossier avec le nom
// des zones pour faire des sections dans le mode édit, dedans j'ai mis la
// première plaque de frame a découper pour les integrer dans le mode a la
// place des actuel qui n'ont pas d'images" -- l'ancienne liste PROP_TYPES
// (mushroom/crystal/vine/sprout) ne pointait vers AUCUN fichier réel
// (assets/decors/prop_frames/ resté vide, jamais dessiné) ; remplacée par
// ce système de SECTIONS, une par sous-dossier de
// `assets/decors/déco item/<section>/`, chaque planche découpée en items
// individuels par tools/crop_deco_items.py (composantes connexes sur
// l'alpha -- items déjà bien séparés sur cette planche, pas besoin du
// pipeline de crop_autotile.py) puis triés/renommés à la main (certains
// exclus : bâtiments/remparts fusionnés entre eux faute de vraie séparation
// alpha, tuiles de sol -- catégorie à part, pas un item posable en 'prop').
// `DECOR_SECTIONS` reste la source de vérité (nom de section -> items) ;
// `PROP_TYPES` (dérivé, `${section}_${item}`) est gardé tel quel pour ne
// pas retoucher tout le reste du fichier qui boucle dessus (chargement
// BootScene, sélection dans l'éditeur).
// `grove` (3 arbres sur une image, les 2 petits flottaient : leur base est
// dessinée plus haut que celle du grand) est découpé par tools/split_grove.py
// en `grand_arbre` / `arbre` / `arbre_2`, à utiliser à sa place ; `grove`
// reste déclaré pour ne pas casser d'anciens brouillons d'éditeur.
// Planches Codex (une section par planche, ordre de la planche) : découpées
// ET nommées par `python tools/crop_deco_items.py --named` (table PLANCHES,
// à garder synchro avec ces listes), base de chaque image au ras du bas.
const DECOR_SECTIONS = {
  bosquet: [
    'grand_arbre', 'arbre', 'arbre_2',
    'grove', 'statue_hooded', 'standing_stone', 'lamp_post', 'banner_tree',
    'bush_round', 'bush_flowering', 'mossy_rock', 'signpost', 'fence',
    'cart', 'crates', 'well', 'antler_totem', 'tree_stump', 'log_pile',
    'bench', 'barrels',
    // bâtiments de la 1re rangée de la planche (crop_deco_items.py --named bosquet)
    'cabane_arbre', 'hutte_mousse', 'hutte_paille', 'cottage', 'tour', 'tente',
    'muraille_tour', 'muraille_pan', 'muraille_pan_2', 'muraille_tour_2', 'muraille_porte',
  ],
  // `arbre_moussu` retiré (refusé par l'utilisateur : hors DA) : plus chargé
  // ni proposé ; un ancien brouillon qui le cite est ignoré sans erreur (cf.
  // buildLevelFromData, texture absente -> décor non affiché).
  foret_sombre: [
    'souche_champignons', 'rocher_mousse', 'champignons_lumineux',
    'racine_arche', 'buisson_epineux', 'tronc_couche', 'fougere_sombre',
    'toile_araignee', 'mare_bord', 'pierre_runique', 'fleur_corniche',
  ],
  grand_arbre: [
    'racine_tunnel', 'champignon_etagere', 'nid_singe', 'tas_pierres',
    'morceaux_ecorce', 'lanterne_lucioles', 'statue_simien', 'rideau_lianes',
    'trou_tronc', 'autel_singe',
  ],
  grand_arbre_tronc: [
    'paroi_ecorce', 'paroi_noeud', 'branche_courte', 'branche_longue', 'escalier_racines',
    'fenetre_lune', 'lianes_hautes', 'champignons_lumineux', 'seve_corrompue', 'corniche_mousse',
  ],
  foret_flottante: [
    'ile_petite', 'ile_moyenne', 'rocher_flottant', 'nuage',
    'arbre_jeune', 'pont_corde', 'tente_geralt', 'panneau_geralt',
    'pissenlit_geant', 'fleurs_hautes',
  ],
  foret_corrompue: [
    'arbre_malade', 'souche_corrompue', 'pustule_mousse', 'racine_tordue',
    'os_creature', 'cocon_mousse', 'champignon_toxique', 'rocher_fissure',
    'pilier_arene', 'arche_arene', 'pierre_symbole',
  ],
  hutte_morgat: [
    'hutte_morgat', 'chaudron', 'etagere_bocaux', 'table_herbes',
    'sechoir_plantes', 'lanterne_papillons', 'panier_plantes', 'tapis_rond',
    'pot_fleurs', 'bocal_papillons',
  ],
};
const PROP_PREFIX = 'prop-';
const PROP_TYPES = Object.entries(DECOR_SECTIONS).flatMap(
  ([section, items]) => items.map((item) => `${section}_${item}`),
);
const PROP_SCALE = 0.4;

function gridCellKey(gx, gy) {
  return `${gx},${gy}`;
}

// Un set de 9 positions ne couvre pas les 16 combinaisons possibles de
// voisins (N/S/E/W) d'une forme libre — priorité aux coins (les deux bords
// concernés exposés), puis à un seul bord, puis "intérieur" si les 4
// voisins sont pleins. Une cellule isolée (aucun voisin) retombe sur "tl" :
// pas de tuile dédiée "isolée" dans la planche, mais au moins un coin
// mousseux plutôt qu'un carré totalement nu.
// Les 4 voisins EN DIAGONALE (hasNE/NW/SE/SW) ne servent qu'à départager le
// cas "intérieur" (aucune arête N/S/E/W exposée) : si l'un d'eux manque
// quand même (escalier en blocs carrés, cf. AUTOTILE_INNER_CORNER_TEXTURE),
// un repli d'angle apparaît à cet endroit précis plutôt qu'une case pleine
// lisse. Ignorés dès qu'une arête orthogonale est déjà exposée (déjà
// couvert par un coin/bord normal, pas besoin d'un 2e traitement).
function autotilePositionKey(hasNorth, hasSouth, hasEast, hasWest, hasNE, hasNW, hasSE, hasSW) {
  const exposedTop = !hasNorth;
  const exposedBottom = !hasSouth;
  const exposedLeft = !hasWest;
  const exposedRight = !hasEast;
  if (exposedTop && exposedLeft) return 'tl';
  if (exposedTop && exposedRight) return 'tr';
  if (exposedBottom && exposedLeft) return 'bl';
  if (exposedBottom && exposedRight) return 'br';
  if (exposedTop) return 't';
  if (exposedBottom) return 'b';
  if (exposedLeft) return 'l';
  if (exposedRight) return 'r';
  // Coins intérieurs du HAUT (escalier qu'on monte, herbe visible, cf.
  // AUTOTILE_INNER_CORNER_TEXTURE) d'abord, puis ceux du BAS (dessous d'un
  // bloc, jamais foulé, cf. coin.png) — demande explicite de l'utilisateur
  // d'ajouter ces 2 derniers plutôt que de les laisser retomber sur la case
  // pleine lisse 'c' comme avant.
  if (!hasNW) return 'in-tl';
  if (!hasNE) return 'in-tr';
  if (!hasSW) return 'in-bl';
  if (!hasSE) return 'in-br';
  return 'c';
}

// Sol en second plan (feat demandée -- v3, la v1 agrandissait la copie du
// dessous, la v2 dupliquait automatiquement CHAQUE tuile normale en plus
// sombre juste derrière elle -- retour utilisateur : "dans le mode édit je
// ne vois pas le moyen pour rajouter les plateforme d'arrière plan", donc
// la v2 s'est avérée être la mauvaise lecture de la demande initiale : "la
// même chose que le placement des tuiles normal [...] sur le plan de
// derrière" voulait dire un OUTIL d'éditeur séparé, peint indépendamment
// (cf. `groundBackCells`/l'outil 'ground-back' dans EditorScene.js), pas un
// effet automatique sur le sol normal). Rendu identique au sol normal (même
// sélection autotile ci-dessous), juste teinté plus sombre et sans corps
// physique (purement décoratif -- combler un trou dans l'image, pas une
// vraie plateforme).
// Retour utilisateur : d'abord "un poil sombre" (0x4a4a4a -> 0x333333, alpha
// 0.75 -> 0.85), puis "trop sombre" (entre les deux, alpha 0.8), puis "ne
// doivent pas être transparentes juste plus sombres" -- alpha pleine (1),
// tout l'assombrissement vient de la teinte.
const AUTOTILE_BACKLAYER_TINT = 0x404040;
const AUTOTILE_BACKLAYER_ALPHA = 1;

// `cells` : tableau de [gx, gy, material] (coordonnées de grille, pas
// pixel — cellule (0,0) centrée sur (GROUND_TILE_SIZE/2, GROUND_TILE_SIZE/2),
// voir gridToWorld). Une seule hitbox GROUND_TILE_SIZE par cellule (même
// texture invisible que fillGroundTiles) ; le rendu pioche la bonne tuile
// 9-slice selon les voisins, agrandie de AUTOTILE_OVERLAP de chaque côté
// (voir sa définition : filet anti-vide de sous-pixel, pas un vrai
// débordement de contenu).
// `groundGroup` peut être null (aperçu de l'éditeur en mode édition, pas de
// physique tant qu'on ne playteste pas) — dans ce cas seul le visuel est
// créé. `options.back` (cf. AUTOTILE_BACKLAYER_*) : rendu du sol en second
// plan -- jamais de corps physique (même si `groundGroup` est fourni) et
// teinte/alpha assombries. Retourne la liste des images créées, pour que
// l'éditeur puisse les détruire et redessiner à chaque coup de pinceau sans
// tout reconstruire.
// [clé de texture, nom de fichier] des 21 cases d'un jeu au format 'blob'
// (« 9-slice » de terre + plateformes + variantes de centre + coins
// intérieurs, cf. tools/crop_autotile.py / tools/import_codex_assets.py) :
// 'floor' et les jeux des biomes (chargés sous `<id>:<clé>`, cf. BootScene).
// dirt_t2/tl2/tr2 existent encore sur disque mais ne sont plus utilisées
// (retour utilisateur) : ne pas les rebrancher sans qu'il le redemande.
function autotileBlobFiles() {
  const files = AUTOTILE_POSITIONS.map((pos) => [`autotile-dirt-${pos}`, `dirt_${pos}.png`]);
  for (let i = 0; i < AUTOTILE_PLATFORM_VARIANT_COUNT; i++) files.push([`autotile-dirt-platform${i}`, `dirt_platform${i}.png`]);
  for (let i = 0; i < DIRT_CENTER_VARIANT_COUNT; i++) files.push([`autotile-dirt-c-var${i}`, `dirt_c_var${i}.png`]);
  files.push(['autotile-dirt-angle', 'dirt_angle.png'], ['autotile-dirt-coin', 'coin.png']);
  files.push(['autotile-dirt-column', 'dirt_column.png']);
  return files;
}

// Disposition d'un rendu : un jeu de biome (`tileset`, toujours 'blob') dont
// les 21 cases sont chargées l'emporte ; sinon celle du jeu par défaut. Avec
// le défaut 'floor' (déjà 'blob'), un jeu incomplet garde son ancien repli
// case par case sur le défaut ; avec 'tuiles' ('atlas'), il n'y a pas de case
// 'blob' de repli : la zone reste en 'atlas'.
function autotileLayoutFor(scene, tileset) {
  if (!tileset || AUTOTILE_LAYOUT === 'blob') return AUTOTILE_LAYOUT;
  const complete = autotileBlobFiles().every(([key]) => scene.textures.exists(`${tileset}:${key}`));
  return complete ? 'blob' : AUTOTILE_LAYOUT;
}

function renderAutotileGrid(scene, groundGroup, cells, options = {}) {
  if (autotileLayoutFor(scene, options.tileset) === 'atlas') return renderAtlasAutotileGrid(scene, groundGroup, cells, options);
  const isBackLayer = !!options.back;
  const solid = new Set(cells.map(([gx, gy]) => gridCellKey(gx, gy)));
  const images = [];
  const tileBodies = []; // corps créés, cf. arêtes internes en fin de fonction
  for (const [gx, gy, material] of cells) {
    const hasNorth = solid.has(gridCellKey(gx, gy - 1));
    const hasSouth = solid.has(gridCellKey(gx, gy + 1));
    const hasEast = solid.has(gridCellKey(gx + 1, gy));
    const hasWest = solid.has(gridCellKey(gx - 1, gy));
    const hasNE = solid.has(gridCellKey(gx + 1, gy - 1));
    const hasNW = solid.has(gridCellKey(gx - 1, gy - 1));
    const hasSE = solid.has(gridCellKey(gx + 1, gy + 1));
    const hasSW = solid.has(gridCellKey(gx - 1, gy + 1));
    const pos = autotilePositionKey(hasNorth, hasSouth, hasEast, hasWest, hasNE, hasNW, hasSE, hasSW);
    let textureKey;
    let flipAngleX = false;
    let flipAngleY = false;
    // Distingue une tuile de PLATEFORME (art dédié, cf. plus bas) d'une
    // tuile de sol normale au même `pos` -- AUTOTILE_CORNER_HEIGHT_BOOST
    // (pensé pour la canopée de dirt_tl/t/tr) ne doit pas s'appliquer aux
    // plateformes, qui partagent pourtant les mêmes valeurs 'tl'/'t'/'tr'
    // (retour utilisateur : "la plateforme2... trop haute" -- elle héritait
    // du boost de dirt_tr/tl par erreur, cf. plus bas).
    let isPlatform = false;
    if (pos.startsWith('in-')) {
      // dirt_angle.png (in-tl/in-tr) ou coin.png (in-bl/in-br) selon le cas,
      // cf. AUTOTILE_INNER_CORNER_TEXTURE/FLIP_X/FLIP_Y — jamais tournées,
      // seulement miroir(s).
      textureKey = AUTOTILE_INNER_CORNER_TEXTURE[pos];
      flipAngleX = AUTOTILE_INNER_CORNER_FLIP_X[pos];
      flipAngleY = AUTOTILE_INNER_CORNER_FLIP_Y[pos];
    } else if (AUTOTILE_GRASS_TOP_POSITIONS.has(pos) && !hasSouth) {
      // Herbe du dessus SANS aucun voisin au sud : un vrai bloc isolé en
      // l'air (cf. AUTOTILE_PLATFORM_VARIANT_COUNT), pas juste le sommet
      // d'une masse de terre continue. Choix DÉTERMINISTE selon le nombre
      // de voisins latéraux (retour utilisateur : "j'ai l'impression que
      // la logique est aléatoire", à raison — plus de Phaser.Math.Between
      // ici), pas un tirage au hasard :
      // - 2 voisins (pos 't', garantit hasEast ET hasWest, cf.
      //   autotilePositionKey : 'tl'/'tr' gagneraient sinon la priorité dès
      //   qu'un seul manque) -> platform0, seule variante sans bordure
      //   latérale, pour ne pas doubler visuellement celle déjà dessinée
      //   par la case voisine à cet endroit.
      // - 1 seul voisin À DROITE (pos 'tl' avec hasEast -- extrémité GAUCHE
      //   d'une plateforme) -> platform2, dont la bordure fermée par défaut
      //   est justement à GAUCHE (vérifié sur l'image).
      // - 1 seul voisin À GAUCHE (pos 'tr', implique hasWest -- extrémité
      //   DROITE) -> platform2 en miroir horizontal, même image mais
      //   bordure fermée à droite.
      // - aucun voisin (pos 'tl' sans hasEast -- îlot d'une seule case)
      //   -> platform1, seule variante fermée des DEUX côtés.
      // Jeux des biomes : platform0 est périodique et le bord droit de
      // platform2 est celui de platform0 (tools/import_codex_assets.py,
      // make_platform_tiles) -- une rangée se lit comme UN seul bloc.
      if (pos === 't') {
        textureKey = 'autotile-dirt-platform0';
      } else if (pos === 'tr') {
        textureKey = 'autotile-dirt-platform2';
        flipAngleX = true;
      } else if (hasEast) {
        textureKey = 'autotile-dirt-platform2';
      } else {
        textureKey = 'autotile-dirt-platform1';
      }
      isPlatform = true;
    } else if (pos === 'c') {
      textureKey = `autotile-dirt-c-var${Phaser.Math.Between(0, DIRT_CENTER_VARIANT_COUNT - 1)}`;
    } else if (pos === 'l' && !hasEast) {
      // Milieu d'une colonne d'une case de large (exposée des DEUX côtés) :
      // 'l' laissait le flanc droit coupé net.
      textureKey = 'autotile-dirt-column';
    } else {
      // `material` peut valoir 'rock' sur d'anciennes données de niveau
      // exportées avant le retrait de cette option (cf. AUTOTILE_PREFIX,
      // un seul matériau désormais) : retombe sur la terre plutôt que sur
      // une texture manquante.
      const prefix = AUTOTILE_PREFIX[material] || AUTOTILE_PREFIX.dirt;
      textureKey = `${prefix}${pos}`;
    }
    // Jeu de tuiles alternatif de la zone (clé `tileset`, cf. TILESET_MANIFEST
    // et BootScene) : mêmes noms de cases, préfixés `<id>:` ; case absente →
    // jeu par défaut. Les boosts de hauteur restent indexés sur la clé d'origine.
    const visualKey = options.tileset && scene.textures.exists(`${options.tileset}:${textureKey}`)
      ? `${options.tileset}:${textureKey}` : textureKey;
    const { x: cx, y: cy } = gridToWorld(gx, gy);

    // tl/tr (retour utilisateur : "c'est plutôt tr et tl qui sont trop bas,
    // il faut les élargir légèrement en hauteur, tl un peu plus encore") :
    // leur touffe d'herbe/canopée dessinée sur floor.png est naturellement
    // moins haute que celle de 't' (composition de l'artiste, pas un souci
    // de découpe -- les 3 cellules source tl/t/tr ont la même bbox brute,
    // cf. tools/crop_autotile.py) : seule une case, tl/tr, est étirée
    // verticalement au rendu pour compenser, ancrée par le BAS (le centre
    // remonte de la moitié du surplus de hauteur ajouté) pour ne pousser le
    // surplus que vers le haut -- la ligne de sol/hitbox en bas ne doit pas
    // bouger. Calculé ici (avant le bloc hitbox juste en dessous, pas
    // seulement au moment de créer l'image) : la hitbox en a maintenant
    // besoin aussi, cf. son commentaire.
    // Jeux des biomes : cases déjà à leur proportion naturelle (en-tête de
    // champignons compris, cf. tools/import_codex_assets.py), jamais étirées.
    const zoneFrame = visualKey !== textureKey ? scene.textures.getFrame(visualKey) : null;
    let heightBoost = isPlatform
      ? (AUTOTILE_PLATFORM_HEIGHT_BOOST[textureKey] || 1)
      : (AUTOTILE_CORNER_HEIGHT_BOOST[pos] || 1);
    if (zoneFrame) heightBoost = zoneFrame.realHeight / zoneFrame.realWidth;
    const baseSize = GROUND_TILE_SIZE + AUTOTILE_OVERLAP * 2;

    if (groundGroup && !isBackLayer) {
      const tile = groundGroup.create(cx, cy, GROUND_HITBOX_KEY).setVisible(false);
      tile.__cell = { gx, gy };
      tileBodies.push(tile);
      if (AUTOTILE_GRASS_TOP_POSITIONS.has(pos)) {
        // Retour utilisateur : deux essais précédents ici (un rectangle
        // uniformément rehaussé du même `heightBoost` que l'image, puis un
        // escalier de plusieurs corps pour suivre la pente de dirt_tl/tr,
        // cf. git history) ont tous les deux raté la vraie cible ("ça
        // voulais pas dire fais des colonnes en vrai" -- ni l'un ni
        // l'autre ne corrigeait le vrai bug signalé, "je flotte en l'air
        // quand je suis sur un bord"). Revenu à la version simple d'origine
        // : hitbox pleine largeur, hauteur SOLIDE fixe (3/4 du bas de la
        // case) pour les 3 positions du dessus, complètement indépendante
        // du boost visuel (`heightBoost`, qui ne touche que l'image
        // affichée plus bas, jamais la hitbox) -- AUTOTILE_GRASS_HITBOX_FRACTION
        // est la part SOLIDE de la case (les 3/4 du bas), pas la part
        // retirée — inversé une première fois (retour utilisateur : "tu
        // l'as mise à 1/4 au lieu de 3/4").
        // Avec le défaut 'tuiles' (zone en jeu de biome), fraction 1 : la
        // hitbox reste pleine et ce sont les images qui remontent, cf.
        // AUTOTILE_BLOB_VISUAL_LIFT.
        const solidHeight = GROUND_TILE_SIZE * AUTOTILE_GRASS_HITBOX_FRACTION;
        tile.body.setSize(GROUND_TILE_SIZE, solidHeight);
        tile.body.setOffset(0, GROUND_TILE_SIZE - solidHeight);
      }
      // Dessous raccourci (cf. AUTOTILE_UNDERSIDE_TRIM, 0 avec 'floor') : il
      // suit le dessous des images, remontées d'autant.
      if (AUTOTILE_UNDERSIDE_TRIM && !hasSouth) {
        const top = tile.body.offset.y;
        tile.body.setSize(GROUND_TILE_SIZE, GROUND_TILE_SIZE - top - AUTOTILE_UNDERSIDE_TRIM);
        tile.body.setOffset(0, top);
      }
    }
    const displayHeight = baseSize * heightBoost;
    const tileCenterY = cy - (displayHeight - baseSize) / 2 - AUTOTILE_BLOB_VISUAL_LIFT;
    // Retour utilisateur : "les tuiles terre arriere plan ne doivent pas
    // etre transparant du tout" -- AUTOTILE_BACKLAYER_ALPHA=1 ci-dessous
    // (déjà réglé par un retour précédent) ne peut que RÉDUIRE
    // l'opacité de la texture, jamais masquer une transparence déjà
    // présente DANS la texture source elle-même. Contrairement aux
    // variantes de REMPLISSAGE (dirt_c/var*, cf. flatten_to_opaque()
    // dans tools/crop_autotile.py), les autres positions (bords/coins/
    // angle) gardent un dégradé de transparence légitime sur leur
    // pourtour -- de l'art à préserver pour le sol de PREMIER plan (le
    // fond doit se voir entre les brins d'herbe), mais l'exact inverse de
    // ce qu'un second plan doit faire (boucher un trou, jamais laisser
    // voir au travers). Un simple rectangle plein (même teinte, TOUJOURS
    // opaque) posé derrière comble ce dégradé sans retoucher la texture
    // source ni son usage en premier plan.
    //
    // Correction (retour utilisateur : "les tuiles de terre en arriere
    // plan ont toujours un fond gris meme sur les partie censé etre
    // transparente a 100%... le cas surtout pour dirt_t/tl/tr qui ne
    // prennent pas toute la taille d'une tuile carrée") : tl/t/tr (cf.
    // AUTOTILE_GRASS_TOP_POSITIONS) sont un cas à part -- leur "dégradé
    // léger" est en réalité une GRANDE zone transparente légitime (le
    // ciel au-dessus de la touffe d'herbe/champignons, qui ne remplit
    // qu'environ la moitié basse de la case) : le rectangle plein pleine
    // case posé derrière EFFACE cette silhouette de butte et la remplace
    // par un carré gris plein, visible juste au-dessus de la canopée
    // (confirmé par rendu isolé). Exclues ici -- ces 3 positions n'ont
    // simplement AUCUN rectangle de bouchage, en premier plan comme en
    // second (leur vrai fond, jamais un aplat gris, doit se voir au
    // travers dans les deux cas).
    if (isBackLayer && !AUTOTILE_GRASS_TOP_POSITIONS.has(pos)) {
      images.push(scene.add.rectangle(cx, cy - AUTOTILE_BLOB_VISUAL_LIFT, GROUND_TILE_SIZE, GROUND_TILE_SIZE, AUTOTILE_BACKLAYER_TINT, 1));
    }
    const img = scene.add.image(cx, tileCenterY, visualKey)
      .setDisplaySize(baseSize, displayHeight)
      .setFlipX(flipAngleX)
      .setFlipY(flipAngleY);
    if (isBackLayer) img.setTint(AUTOTILE_BACKLAYER_TINT).setAlpha(AUTOTILE_BACKLAYER_ALPHA);
    images.push(img);
  }
  // Un corps STATIQUE redimensionné après coup (cf. AUTOTILE_GRASS_TOP_POSITIONS
  // ci-dessus) ne met pas à jour tout seul l'arbre de collision du groupe —
  // sans ce refresh, la case restait solide sur toute sa hauteur d'origine
  // (le joueur tombait au travers de la partie "retirée" comme si de rien
  // n'était, ou pire, traversait toute la plateforme).
  if (groundGroup && !isBackLayer) {
    groundGroup.refresh();
    disableInternalGroundFaces(tileBodies, solid);
  }
  return images;
}

// Arêtes INTERNES (correctif "paroi qui coince") : une face collée à une
// autre case pleine ne doit jamais repousser un corps. Sans ça, avec le jeu
// 'floor', la case pleine SOUS un mur (hitbox entière, haut à y) dépasse de
// 16 px la case d'herbe voisine (hitbox aux 3/4) : la séparation Arcade en Y
// (passe en premier, tolère overlapBias = 20 px) la traitait comme une marche
// et perchait Agarica 16 px plus haut contre le mur. Le petit bout de face
// latérale ainsi désactivé est toujours couvert par la case du mur au-dessus
// (corps du joueur bien plus haut que 16 px). Gardé aussi pour 'atlas' (cases
// toutes pleines) : une face interne n'a jamais à arrêter quoi que ce soit, et
// ça évite qu'un corps accroche la jointure entre deux cases d'un même sol.
function disableInternalGroundFaces(tileBodies, solid) {
  for (const tile of tileBodies) {
    const { gx, gy } = tile.__cell;
    const cc = tile.body.checkCollision;
    cc.up = !solid.has(gridCellKey(gx, gy - 1));
    cc.down = !solid.has(gridCellKey(gx, gy + 1));
    cc.left = !solid.has(gridCellKey(gx - 1, gy));
    cc.right = !solid.has(gridCellKey(gx + 1, gy));
  }
}

// ---------------------------------------------------------------------------
// Disposition 'atlas' (jeu 'tuiles', cf. AUTOTILE_TILESETS et l'en-tête de
// tools/cut_tuiles.py pour la carte des cases de assets/decors/tuiles.png).
// ---------------------------------------------------------------------------
// Clé de texture d'une case de l'atlas : `autotile-atlas-A1`, `…-grass_mid`…
const AUTOTILE_ATLAS_PREFIX = 'autotile-atlas-';
const AUTOTILE_ATLAS_TILES = [
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9',
  'B', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7',
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6',
];
// Taille d'une case dans l'atlas (px source) : facteur d'agrandissement
// GROUND_TILE_SIZE / 24, le MÊME pour les cases et les herbes (l'herbe garde
// sa taille naturelle, elle n'est jamais étirée pour remplir la case).
const AUTOTILE_ATLAS_SOURCE_TILE = 24;
// Herbes posées par-dessus les cases de surface, SANS hitbox, à leur taille
// naturelle : `dx` = décalage (px source) du bord gauche de l'image par
// rapport au bord gauche de la case -- elles DÉPASSENT du bord exposé
// (demande utilisateur : « laisser l'herbe dépasser, c'est pour pas que ça
// fasse trop plat »). Le haut de l'image = le haut de la case = la ligne où
// l'on marche. Mêmes valeurs que GRASS_SPECS dans tools/cut_tuiles.py.
const AUTOTILE_ATLAS_GRASS = {
  mid: { file: 'grass_mid', dx: 0 },      // H1 : voisins des deux côtés
  left: { file: 'grass_left', dx: -2 },   // H3 : pas de voisin à l'ouest
  right: { file: 'grass_right', dx: 0 },  // H4 : pas de voisin à l'est
  single: { file: 'grass_single', dx: -2 }, // H3+H4 : aucun voisin latéral
};

// Choix de la case de l'atlas pour (gx, gy), d'après `solid` (Set de
// gridCellKey = l'ensemble S des cases pleines). Règles de l'utilisateur
// (« une couche de B avant la logique des A en dessous » ; les D sont les
// coins INTÉRIEURS, les C les variantes « minces » du 9-slice) :
//  1. Case de surface (pas de voisin N dans S) AVEC un voisin S dans S ET au
//     moins un voisin E ou O dans S -> B (les « cases B »).
//  2. Région R = S privé des cases B (les surfaces minces -- plateforme sans
//     dessous, haut de colonne -- restent donc dans R). Une case de R n'a
//     pour voisins QUE des cases de R : tout ce qui est hors de R (case B
//     comprise) compte comme EXPOSÉ. Avec n/s/e/o/no/ne/so/se = voisin ∈ R :
//       !n && !s : !o && !e -> C4 ; !o -> C1 ; !e -> C3 ; sinon C2
//       sinon !o && !e : !n -> C5 ; !s -> C7 ; sinon C6
//       !n && !o -> A1 ; !n && !e -> A3 ; !s && !o -> A7 ; !s && !e -> A9
//       !n -> A2
//       !s -> !no -> D1 ; !ne -> D2 ; sinon A8
//       !o -> A4 ; !e -> A6
//       intérieur : !no -> D6 ; !ne -> D5 ; !so -> D4 ; !se -> D3 ; sinon A5
//  3. Herbe sur TOUTE case sans voisin N dans S : H3 (grass_left) sans voisin
//     O dans S, H4 (grass_right) sans voisin E dans S, les deux
//     (grass_single) si aucun des deux, sinon H1 (grass_mid).
// Le petit bout d'herbe H2 de l'atlas n'est pas utilisé (rôle non précisé).
// Retourne { tile, grass } (`grass` : clé de AUTOTILE_ATLAS_GRASS ou null).
function atlasTileFor(solid, gx, gy) {
  const inS = (x, y) => solid.has(gridCellKey(x, y));
  const isB = (x, y) => inS(x, y) && !inS(x, y - 1) && inS(x, y + 1) && (inS(x - 1, y) || inS(x + 1, y));
  let grass = null;
  if (!inS(gx, gy - 1)) {
    const w = inS(gx - 1, gy);
    const e = inS(gx + 1, gy);
    grass = !w && !e ? 'single' : !w ? 'left' : !e ? 'right' : 'mid';
  }
  if (isB(gx, gy)) return { tile: 'B', grass };
  const inR = (x, y) => inS(x, y) && !isB(x, y);
  const n = inR(gx, gy - 1);
  const s = inR(gx, gy + 1);
  const e = inR(gx + 1, gy);
  const o = inR(gx - 1, gy);
  let tile;
  if (!n && !s) tile = !o && !e ? 'C4' : !o ? 'C1' : !e ? 'C3' : 'C2';
  else if (!o && !e) tile = !n ? 'C5' : !s ? 'C7' : 'C6';
  else if (!n && !o) tile = 'A1';
  else if (!n && !e) tile = 'A3';
  else if (!s && !o) tile = 'A7';
  else if (!s && !e) tile = 'A9';
  else if (!n) tile = 'A2';
  else if (!s) tile = !inR(gx - 1, gy - 1) ? 'D1' : !inR(gx + 1, gy - 1) ? 'D2' : 'A8';
  else if (!o) tile = 'A4';
  else if (!e) tile = 'A6';
  else if (!inR(gx - 1, gy - 1)) tile = 'D6';
  else if (!inR(gx + 1, gy - 1)) tile = 'D5';
  else if (!inR(gx - 1, gy + 1)) tile = 'D4';
  else if (!inR(gx + 1, gy + 1)) tile = 'D3';
  else tile = 'A5';
  return { tile, grass };
}

// Équivalent de renderAutotileGrid pour la disposition 'atlas' (mêmes
// paramètres, même valeur de retour, même hitbox d'une case par cellule et
// mêmes faces internes désactivées). Différences : hitbox dont le haut est
// le haut de la case (grassHitboxFraction 1 ; dessous raccourci de
// AUTOTILE_UNDERSIDE_TRIM s'il n'y a rien en dessous), cases affichées à
// EXACTEMENT GROUND_TILE_SIZE (pas d'AUTOTILE_OVERLAP : textures séparées en
// filtre NEAREST, positions entières sur la grille de 64 -> les bords se
// touchent pile, et un débord de 0,5 px décalerait la grille de pixels d'une
// case à l'autre), aucun boost de
// hauteur, et l'herbe ajoutée en images séparées APRÈS toutes les cases (pour
// passer devant les cases voisines qu'elle déborde). Un jeu de biome complet
// (`options.tileset`, format 'blob') passe par renderAutotileGrid en 'blob'
// (cf. autotileLayoutFor) ; incomplet, il est ignoré ici.
function renderAtlasAutotileGrid(scene, groundGroup, cells, options = {}) {
  const isBackLayer = !!options.back;
  const solid = new Set(cells.map(([gx, gy]) => gridCellKey(gx, gy)));
  const scale = GROUND_TILE_SIZE / AUTOTILE_ATLAS_SOURCE_TILE;
  const images = [];
  const grassCells = [];
  const tileBodies = [];
  for (const [gx, gy] of cells) {
    const { tile, grass } = atlasTileFor(solid, gx, gy);
    const { x: cx, y: cy } = gridToWorld(gx, gy);
    if (groundGroup && !isBackLayer) {
      const body = groundGroup.create(cx, cy, GROUND_HITBOX_KEY).setVisible(false);
      body.__cell = { gx, gy };
      // Haut de la hitbox = haut de la case (ligne de marche) ; dessous
      // raccourci si rien en dessous, cf. AUTOTILE_UNDERSIDE_TRIM.
      if (AUTOTILE_UNDERSIDE_TRIM && !solid.has(gridCellKey(gx, gy + 1))) {
        body.body.setSize(GROUND_TILE_SIZE, GROUND_TILE_SIZE - AUTOTILE_UNDERSIDE_TRIM);
        body.body.setOffset(0, 0);
      }
      tileBodies.push(body);
    }
    const img = scene.add.image(cx, cy, `${AUTOTILE_ATLAS_PREFIX}${tile}`)
      .setDisplaySize(GROUND_TILE_SIZE, GROUND_TILE_SIZE);
    if (isBackLayer) img.setTint(AUTOTILE_BACKLAYER_TINT).setAlpha(AUTOTILE_BACKLAYER_ALPHA);
    images.push(img);
    if (grass) grassCells.push([gx, gy, grass]);
  }
  // Herbes créées APRÈS toutes les cases de ce rendu (ordre d'affichage =
  // ordre de création) : un débord latéral passerait sinon sous la case
  // voisine créée après lui.
  for (const [gx, gy, grass] of grassCells) {
    const spec = AUTOTILE_ATLAS_GRASS[grass];
    const g = scene.add.image(gx * GROUND_TILE_SIZE + spec.dx * scale, gy * GROUND_TILE_SIZE, `${AUTOTILE_ATLAS_PREFIX}${spec.file}`)
      .setOrigin(0, 0).setScale(scale);
    if (isBackLayer) g.setTint(AUTOTILE_BACKLAYER_TINT).setAlpha(AUTOTILE_BACKLAYER_ALPHA);
    images.push(g);
  }
  if (groundGroup && !isBackLayer) {
    groundGroup.refresh();
    disableInternalGroundFaces(tileBodies, solid);
  }
  return images;
}

// Sous-bois (assets/decors/sous_bois_frames/, découpés depuis les 2
// DERNIÈRES rangées de assets/decors/arbres.png -- buissons, fougères,
// champignons -- voir tools/crop_sous_bois.py) : dispersés au hasard comme la
// forêt du plan3 (essence, échelle, miroir, espacement variable, cf.
// addProceduralForest), mais sur un plan intermédiaire -- devant le sol de
// fond (groundBackCells), derrière le sol principal (groundCells), cf. ordre
// de rendu dans buildLevelFromData -- et sans parallaxe (scrollFactor par
// défaut, 1) : ils défilent avec le sol réel sur lequel ils sont posés, leur
// pied caché derrière la frange d'herbe du sol principal.
const SOUS_BOIS_COUNT = 14;
const SOUS_BOIS_TEXTURE_PREFIX = 'decor-sous-bois-';
const SOUS_BOIS_BASE_SCALE = 0.45;
// Retour utilisateur : "y en a pas assez sur les longues lignes" -- resserré
// depuis 90-220 (environ 1 élément toutes les 2-3 tuiles au lieu de 4-5).
const SOUS_BOIS_SPACING_MIN = 45;
const SOUS_BOIS_SPACING_MAX = 110;
// Bas du cadre enfoncé sous le HAUT de la case de surface : la ligne d'herbe
// dessinée sur dirt_t/tl/tr tombe vers le 1er quart de la case (cf.
// AUTOTILE_GRASS_HITBOX_FRACTION), sa frange de mousse descend plus bas --
// assez pour que les rochers/l'herbe de la base passent derrière elle
// plutôt que de flotter au-dessus du sol.
const SOUS_BOIS_SINK = 24;
// Retrait minimal entre le bord d'un élément et le bout de son tronçon de
// sol : les tuiles de coin (tl/tr) arrondissent déjà le bord, un élément
// calé pile dessus déborderait visuellement au-dessus du vide.
const SOUS_BOIS_EDGE_INSET = 8;
// Un tronçon court ne peut pas accueillir les plus larges éléments : quelques
// tirages de variante avant d'abandonner cet emplacement, pour qu'un petit
// élément (rangée du bas de la planche) ait sa chance plutôt que rien.
const SOUS_BOIS_FIT_ATTEMPTS = 4;
// Retour utilisateur : "au moins une plante par étage de plateforme qui fait
// au moins 3 tuiles et 1 chance sur deux pour les lignes de 2 tuiles" -- la
// dispersion à espacement aléatoire seule pouvait laisser un tronçon entier
// vide (premier pas tiré au-delà de son bout, ou variantes trop larges).
const SOUS_BOIS_GUARANTEED_RUN_TILES = 3;
const SOUS_BOIS_SHORT_RUN_TILES = 2;
const SOUS_BOIS_SHORT_RUN_CHANCE = 0.5;
// Retour utilisateur : "fais en sorte que des plantes identiques ne puissent
// pas être à côté" -- une variante déjà posée à moins de cette distance
// (centre à centre, même hauteur de sol) est exclue du tirage. Au-delà du
// pas de dispersion maximal, pour couvrir aussi les voisins immédiats les
// plus espacés. Partagé avec les plantes des totems (cf. addTotemPlants).
const SOUS_BOIS_SAME_VARIANT_MIN_DISTANCE = 160;

// `scene.__undergrowthPlants` (remis à zéro par buildLevelFromData) : toutes
// les plantes posées dans la zone, pour pickUndergrowthVariant.
function isUndergrowthVariantNearby(scene, variant, x, baseY) {
  return (scene.__undergrowthPlants || []).some((p) => p.variant === variant
    && Math.abs(p.x - x) < SOUS_BOIS_SAME_VARIANT_MIN_DISTANCE
    && Math.abs(p.baseY - baseY) < GROUND_TILE_SIZE);
}

function pickUndergrowthVariant(scene, candidates, x, baseY) {
  const allowed = candidates.filter((variant) => !isUndergrowthVariantNearby(scene, variant, x, baseY));
  // Repli sur la liste complète seulement si TOUTES les candidates sont déjà
  // prises autour (jamais avec les 14 du sous-bois, possible en théorie pour
  // une petite liste comme celles des totems).
  return Phaser.Utils.Array.GetRandom(allowed.length ? allowed : candidates);
}

function addUndergrowthImage(scene, x, baseY, variant, scale, flipX) {
  if (!scene.__undergrowthPlants) scene.__undergrowthPlants = [];
  scene.__undergrowthPlants.push({ x, baseY, variant });
  return scene.add.image(x, baseY, `${SOUS_BOIS_TEXTURE_PREFIX}${variant}`)
    .setOrigin(0.5, 1)
    .setScale(scale)
    .setFlipX(flipX);
}

// Uniquement sur le SOL PRINCIPAL (groundCells), jamais au-dessus d'un vide :
// une case de sol "de surface" est une case de sol principal sans autre case
// de sol principal au-dessus -- plateformes d'une seule case d'épaisseur
// comprises. Le sol de fond (groundBackCells) ne compte PAS comme obstacle
// (retour utilisateur : "quand y a un sol de fond ça apparaît pas ou
// derrière" -- la 1re version excluait toute surface avec du sol de fond
// au-dessus) : ce plan est justement dessiné devant lui. Les cases de
// surface contiguës d'une même rangée forment un tronçon ; chaque élément
// doit tenir en entier sur son tronçon (jamais à cheval sur une fosse),
// avoir la place en hauteur (pas enfoncé dans un plafond de sol principal)
// et rester hors de l'eau.
function addUndergrowth(scene, data) {
  const front = new Set((data.groundCells || []).map(([gx, gy]) => gridCellKey(gx, gy)));
  const isOpen = (gx, gy) => !front.has(gridCellKey(gx, gy));
  const water = (data.water || []).map((w) => new Phaser.Geom.Rectangle(w.x, w.y, w.width, w.height));

  const surfaceRows = new Map();
  for (const [gx, gy] of data.groundCells || []) {
    if (!isOpen(gx, gy - 1)) continue;
    if (!surfaceRows.has(gy)) surfaceRows.set(gy, new Set());
    surfaceRows.get(gy).add(gx);
  }

  for (const [gy, gxSet] of surfaceRows) {
    const gxs = [...gxSet].sort((a, b) => a - b);
    let runStart = 0;
    for (let i = 1; i <= gxs.length; i++) {
      if (i < gxs.length && gxs[i] === gxs[i - 1] + 1) continue;
      scatterUndergrowthOnRun(scene, gxs[runStart], gxs[i - 1], gy, isOpen, water);
      runStart = i;
    }
  }
}

function scatterUndergrowthOnRun(scene, gxStart, gxEnd, gy, isOpen, water) {
  const left = gxStart * GROUND_TILE_SIZE + SOUS_BOIS_EDGE_INSET;
  const right = (gxEnd + 1) * GROUND_TILE_SIZE - SOUS_BOIS_EDGE_INSET;
  const baseY = gy * GROUND_TILE_SIZE + SOUS_BOIS_SINK;

  const fits = (x, width, height) => {
    if (x - width / 2 < left || x + width / 2 > right) return false;
    const rect = new Phaser.Geom.Rectangle(x - width / 2, baseY - height, width, height);
    if (water.some((w) => Phaser.Geom.Intersects.RectangleToRectangle(rect, w))) return false;
    const gxFrom = Math.floor(rect.left / GROUND_TILE_SIZE);
    const gxTo = Math.floor((rect.right - 1) / GROUND_TILE_SIZE);
    const gyTop = Math.floor(rect.top / GROUND_TILE_SIZE);
    for (let cgx = gxFrom; cgx <= gxTo; cgx++) {
      for (let cgy = gyTop; cgy < gy; cgy++) {
        if (!isOpen(cgx, cgy)) return false;
      }
    }
    return true;
  };

  const frameOf = (variant) => scene.textures.getFrame(`${SOUS_BOIS_TEXTURE_PREFIX}${variant}`);
  const place = (x, variant, scale) => addUndergrowthImage(scene, x, baseY, variant, scale, Math.random() < 0.5);

  // Placement "garanti" : toutes les variantes dans un ordre aléatoire, à une
  // position libre tirée au hasard sur le tronçon, plutôt qu'à la position
  // imposée par le pas de dispersion -- ne renonce que si AUCUNE variante ne
  // tient nulle part (plafond trop bas, eau, voisine identique...).
  const placeAnywhere = () => {
    const variants = Phaser.Utils.Array.Shuffle([...Array(SOUS_BOIS_COUNT).keys()]);
    for (const variant of variants) {
      const frame = frameOf(variant);
      const scale = SOUS_BOIS_BASE_SCALE * Phaser.Math.FloatBetween(0.85, 1.15);
      const width = frame.width * scale;
      if (width > right - left) continue;
      for (let attempt = 0; attempt < SOUS_BOIS_FIT_ATTEMPTS; attempt++) {
        const x = Phaser.Math.FloatBetween(left + width / 2, right - width / 2);
        if (isUndergrowthVariantNearby(scene, variant, x, baseY)) continue;
        if (!fits(x, width, frame.height * scale)) continue;
        place(x, variant, scale);
        return true;
      }
    }
    return false;
  };

  const runTiles = gxEnd - gxStart + 1;
  if (runTiles < SOUS_BOIS_SHORT_RUN_TILES) return;
  if (runTiles < SOUS_BOIS_GUARANTEED_RUN_TILES) {
    if (Math.random() < SOUS_BOIS_SHORT_RUN_CHANCE) placeAnywhere();
    return;
  }

  let placedCount = 0;
  let x = left + Phaser.Math.Between(0, SOUS_BOIS_SPACING_MIN);
  while (x < right) {
    for (let attempt = 0; attempt < SOUS_BOIS_FIT_ATTEMPTS; attempt++) {
      const variant = pickUndergrowthVariant(scene, [...Array(SOUS_BOIS_COUNT).keys()], x, baseY);
      const frame = frameOf(variant);
      const scale = SOUS_BOIS_BASE_SCALE * Phaser.Math.FloatBetween(0.85, 1.15);
      if (!fits(x, frame.width * scale, frame.height * scale)) continue;
      place(x, variant, scale);
      placedCount++;
      break;
    }
    x += Phaser.Math.Between(SOUS_BOIS_SPACING_MIN, SOUS_BOIS_SPACING_MAX);
  }
  if (placedCount === 0) placeAnywhere();
}

function gridToWorld(gx, gy) {
  return { x: gx * GROUND_TILE_SIZE + GROUND_TILE_SIZE / 2, y: gy * GROUND_TILE_SIZE + GROUND_TILE_SIZE / 2 };
}

function worldToGrid(x, y) {
  return { gx: Math.floor(x / GROUND_TILE_SIZE), gy: Math.floor(y / GROUND_TILE_SIZE) };
}

// Petit utilitaire pour écrire à la main des niveaux "par défaut" au format
// éditeur (voir data/zone*_data.js) : une plage de colonnes [gxStart, gxEnd)
// sur une ou plusieurs rangées, plutôt que de lister chaque triple
// [gx, gy, material] à la main — même résultat qu'un export JSON de
// l'éditeur, juste plus lisible/écrivable pour un niveau construit hors de
// l'UI (mêmes silhouettes que les Zone*Scene d'origine, migrées ici).
function groundRow(gxStart, gxEnd, gyList, material = 'dirt') {
  const cells = [];
  for (let gx = gxStart; gx < gxEnd; gx++) {
    for (const gy of gyList) cells.push([gx, gy, material]);
  }
  return cells;
}

// Retour utilisateur : "les maps s'actualise dans le mode edit mais pas
// dans le mode de base" -- une zone RÉELLE (zone1, zone3...) charge sa
// `const XXX_DATA` figée depuis une balise <script> (cf. index.html),
// jamais retouchée par le jeu -- éditer cette zone puis "Enregistrer"
// dans EditorScene.js n'écrit que dans IndexedDB (cf. EDITOR_IDB_NAME/
// idbPutZone là-bas), un brouillon que seul l'éditeur relisait jusqu'ici
// (cf. fetchZoneData). Chaque Zone*Scene.create() appelle maintenant
// `resolveZoneData(nom, XXX_DATA)` au lieu d'utiliser XXX_DATA
// directement : MÊME base IndexedDB que l'éditeur (nom/store/version
// identiques, cf. EDITOR_IDB_NAME là-bas), lue ici en pure lecture. Si un
// brouillon existe sous ce nom, il prend le pas sur la const figée --
// sinon (jamais ouvert l'éditeur, ou zone jamais éditée) `fallbackData`
// est utilisé tel quel, donc aucun changement de comportement pour qui ne
// touche jamais à l'éditeur. Toujours asynchrone (IndexedDB l'est de
// toute façon) mais jamais bloquant en cas d'échec (navigateur sans
// IndexedDB, quota, etc.) -- retombe silencieusement sur `fallbackData`.
const ZONE_DRAFTS_IDB_NAME = 'legend-of-agarica-editor';
const ZONE_DRAFTS_IDB_STORE = 'zones';

function getZoneDraft(name) {
  return new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open(ZONE_DRAFTS_IDB_NAME, 2);
    } catch (e) {
      resolve(undefined);
      return;
    }
    // Même structure que EditorScene.openEditorDB : ne crée le store que
    // s'il manque encore -- si le jeu "normal" est lancé avant que
    // l'éditeur n'ait jamais tourné dans ce navigateur, cette base/ce
    // store n'existent pas encore et sont créés ici (vides, get() rendra
    // simplement `undefined` juste après -- comportement identique à
    // "jamais édité").
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(ZONE_DRAFTS_IDB_STORE)) {
        req.result.createObjectStore(ZONE_DRAFTS_IDB_STORE);
      }
    };
    req.onerror = () => resolve(undefined);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(ZONE_DRAFTS_IDB_STORE)) {
        resolve(undefined);
        return;
      }
      const getReq = db.transaction(ZONE_DRAFTS_IDB_STORE, 'readonly').objectStore(ZONE_DRAFTS_IDB_STORE).get(name);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => resolve(undefined);
    };
  });
}

async function resolveZoneData(name, fallbackData) {
  try {
    const draft = await getZoneDraft(name);
    return draft !== undefined ? draft : fallbackData;
  } catch (e) {
    return fallbackData;
  }
}

// Retour utilisateur : "la hitbox des entré sortie devrais lancer le
// changement de zone quand la hitbox touche le portail" -- un portail
// n'était jusque là qu'une ligne verticale de largeur nulle (`exit.x`
// comparé au CENTRE du joueur, jamais à son corps physique), franchissable
// UNIQUEMENT en marchant vers la droite (`player.x > exit.x`), jamais en
// entrant par la gauche ni en touchant juste son contour. Remplacé par un
// vrai rectangle de déclenchement (cf. `getExitTriggerRect` et son usage
// dans updateLevelFromData) comparé au corps physique RÉEL du joueur
// (`Phaser.Geom.Intersects.RectangleToRectangle`, même recette que
// getSkillHitbox() plus bas dans ce fichier) -- fonctionne désormais dans
// les DEUX sens (entrer par la gauche OU la droite du portail déclenche
// pareil), pas juste en sortant vers la droite. Largeur généreuse (pas la
// largeur d'affichage, 6px, qui laisserait un Loup en sprint tunneller au
// travers en un seul step physique, cf. `overlapBias` dans main.js pour un
// souci de tunneling apparenté) -- une pleine case de terrain, cohérente
// avec le pas de la grille.
const EXIT_TRIGGER_WIDTH = GROUND_TILE_SIZE;

function getExitTriggerRect(exit) {
  const height = exit.height != null ? exit.height : Number.POSITIVE_INFINITY;
  const y = height === Number.POSITIVE_INFINITY ? -1e6 : exit.y - height / 2;
  return new Phaser.Geom.Rectangle(exit.x - EXIT_TRIGGER_WIDTH / 2, y, EXIT_TRIGGER_WIDTH, height);
}

// Construit une scène complète à partir des données exportées par
// EditorScene.js (voir son docstring pour le schéma). Sert à la fois à
// `PlayedLevelScene` (une nouvelle Zone créée à partir d'un niveau exporté,
// cf. commentaire en tête de fichier) et au mode "playtest" de l'éditeur
// lui-même, qui appelle directement cette fonction sur les données en
// cours d'édition plutôt que de repasser par un export/import.
//
// `sceneData` (optionnel) : les données passées par `goToScene(scene, key,
// exit.data)` au moment de la transition -- PAS les données de NIVEAU
// (`data`, le 2e paramètre). Retour utilisateur : "rajoute des entré en
// plus des sortie dans le mode édit pour relier les sortie au entrer et
// pouvoir faire le chemin dans l'autre sens dans le jeu" -- avant ça,
// TOUTE sortie ramenait au spawn par défaut de la zone cible, quel que
// soit le sens du trajet (cf. `data.entries`/`sceneData.enterId` plus
// bas). Chaque Zone*Scene.create(sceneData) doit désormais faire suivre
// SON PROPRE paramètre `sceneData` ici (certaines l'utilisaient déjà pour
// leur propre logique bien avant ça, ex: Zone4Scene et `enterFrom` --
// les deux coexistent sans conflit, `sceneData` n'est jamais consommé
// qu'une fois par clé).
// Cf. son affectation dans buildLevelFromData et son usage dans
// updateLevelFromData/addAbilityShrine/addCampfire pour le pourquoi : sert
// à ignorer les frames fantômes d'une zone quittée dont Phaser continue
// d'appeler update() (cause exacte non identifiée, contournée au niveau
// appli plutôt qu'au niveau moteur).
let currentLevelScene = null;

function buildLevelFromData(scene, data, sceneData) {
  // État « juice » de la visite précédente (émetteurs, HUD) : objets déjà
  // détruits avec la scène, repartir de zéro.
  scene.__juiceFx = null;
  scene.__hudFx = null;
  scene.__juiceZooming = false;
  fadeInScene(scene, { zoom: 1.03 });
  // Retour utilisateur : "je ne peux plus retourner a la zone1, ça me met
  // un écran vide" -- `goToScene` pose `__transitioningAway = true` sur LA
  // SCÈNE (cf. son commentaire) pour ignorer les frames suivantes tant que
  // le fondu est en cours, mais ne le repasse JAMAIS à false lui-même.
  // Phaser réutilise la MÊME instance de scène à chaque `scene.start(...)`
  // (`create()` est rappelé, mais les propriétés posées à la volée comme
  // celle-ci survivent) : une fois qu'on est sorti UNE fois d'une zone, le
  // verrou reste posé pour de bon sur cette instance -- la 2e tentative de
  // sortie de cette MÊME zone (aller-retour, ex: zonetest <-> zone1) ne
  // déclenchait donc plus jamais rien (goToScene retourne immédiatement à
  // sa ligne `if (scene.__transitioningAway) return;`). Invisible tant
  // qu'aucune zone n'était traversée dans les deux sens -- jamais remarqué
  // avant le premier portail aller-retour de ce projet. Réinitialisé ici,
  // au tout début de chaque `create()` (donc à chaque (re)entrée dans la
  // zone), pour n'empêcher que les déclenchements multiples PENDANT un même
  // passage, jamais les passages suivants.
  scene.__transitioningAway = false;
  // État « histoire » (PNJ, déclencheurs, verrous de cinématique...) remis à
  // zéro à chaque visite, cf. StoryKit.js.
  resetStoryState(scene, data);

  const { width, height } = scene.scale;
  const levelWidth = data.levelWidth || width;
  const levelHeight = data.levelHeight || height;
  // Marge au-dessus de 0 : l'éditeur autorise à peindre du plafond
  // (coordonnées Y négatives, cf. EDITOR_WORLD_TOP dans EditorScene.js) —
  // sans cette marge, des bounds caméra/monde calés pile sur (0,0) rendent
  // ce plafond invisible/inaccessible en jeu (la caméra ne peut jamais
  // scroller au-dessus de Y=0). N'affecte pas un niveau plat classique : le
  // joueur n'a simplement jamais de raison d'aller dans cette marge.
  // `levelTop` (optionnel, négatif) : monde plus haut que la marge par défaut
  // (zone qu'on gravit, cf. `camera.vertical`).
  const levelTop = Math.min(-400, data.levelTop ?? -400);
  // Marge à DROITE du monde PHYSIQUE (jamais la caméra, cf. plus bas) --
  // retour utilisateur : "la hitbox du loup ne permet pas de changer de
  // zone de par sa taille... corrige la logique pour toutes les formes à
  // venir qui pourraient avoir le même problème". Repro : le mur invisible
  // du monde était calé PILE sur `levelWidth`, sans aucune marge -- pour
  // une forme dont le corps physique est plus large que le rayon
  // `levelWidth - data.exit.x` (le Loup, ~86px de large depuis
  // PLAYER_BODY_FRACTION, cf. FORMS dans Player.js, contre 30px de marge
  // pour l'exit de Zone1Scene), le bord DROIT du corps butait contre ce mur
  // avant même que `this.x` (le CENTRE, comparé à `exit.x` par le
  // déclenchement générique de sortie de zone, cf. updateLevelFromData
  // plus bas) ait pu l'atteindre -- bloqué indéfiniment, jamais de
  // transition. Même recette que `levelTop` ci-dessus (marge sur le monde
  // PHYSIQUE uniquement, jamais visible/traversée en pratique par un
  // niveau normal) plutôt qu'un correctif propre au Loup : n'importe quelle
  // forme future, plus large encore, en profite pareil sans y retoucher.
  const levelRightPad = 200;

  // Course verticale de la caméra (cf. plus bas : tallLevel / camera.vertical) :
  // calculée dès ici pour caler les fonds (ligne de base, ciel, bords).
  const verticalCamera = !!(data.tallLevel || (data.camera && data.camera.vertical));
  const cameraTop = verticalCamera ? levelTop : 0;
  const cameraHeight = verticalCamera ? (levelHeight - levelTop) : height;
  const camLow = cameraTop + cameraHeight - height;
  const camHigh = cameraTop;
  scene.__sky = null;
  scene.liquidFloor = null;
  if (data.decor !== false) {
    addMoonlitDecor(scene, width, height, levelWidth, data.avoidRanges || [], zoneBackgroundId(data), data.largeTrees !== false,
      data.treesAtScreenBottom === true, zoneBackdropSpec(data, { camLow, camHigh }));
    if (zoneBackgroundId(data) !== 'fond_foret_flottante') addCaveCeiling(scene, levelWidth);
  }
  setupDebugToggle(scene);

  ensureGroundHitboxTexture(scene);
  // Sol en second plan (cf. AUTOTILE_BACKLAYER_*) : peint indépendamment
  // dans l'éditeur (outil 'ground-back', jamais automatique), rendu AVANT
  // le sol normal pour rester derrière lui -- purement visuel, aucun corps
  // physique (cf. `options.back` dans renderAutotileGrid).
  renderAutotileGrid(scene, null, data.groundBackCells || [], { back: true, tileset: data.tileset });
  // Entre les deux sols : devant le fond, derrière le sol principal (cf.
  // addUndergrowth). Même condition que le reste du décor générique.
  // Réutilisée d'une visite à l'autre (même instance de scène, cf.
  // __transitioningAway plus haut) : repartir d'une liste vide.
  scene.__undergrowthPlants = [];
  if (data.decor !== false) addUndergrowth(scene, data);
  scene.ground = scene.physics.add.staticGroup();
  // Premier visuel du sol principal : repère pour glisser juste derrière lui
  // des objets créés plus tard (totems et leurs plantes, cf.
  // sendBehindFrontGround).
  scene.__frontGroundFirstImage = renderAutotileGrid(scene, scene.ground, data.groundCells || [], { tileset: data.tileset })[0];
  // Bande de liquide/brume devant les fonds (cf. addLiquidFloor) : masque le
  // bas des arbres du fond au-dessus d'un vide (épreuve du singe…).
  if (data.liquidFloor) addLiquidFloor(scene, data.liquidFloor, levelWidth, levelHeight);

  // `scene.water` gardé (comme scene.ground/scene.enemies) : l'overlap qui
  // arme `player.inWater` (cf. Player.js, forme Pieuvre automatique) doit
  // attendre la création du joueur juste plus bas.
  scene.water = (data.water || []).map((w) => addWaterZone(scene, w.x, w.y, w.width, w.height));

  scene.physics.world.setBounds(0, levelTop, levelWidth + levelRightPad, levelHeight - levelTop);
  // Retour utilisateur : toutes les zones ACTUELLES tiennent sur un seul
  // écran (aucune n'a de vraie raison de faire scroller la caméra
  // verticalement) -- sans borne dédiée, la caméra POUVAIT quand même
  // scroller dans la marge d'édition ci-dessus (levelTop=-400) dès que le
  // joueur montait ou tombait assez, décrochant visiblement le décor du
  // sol réel (arbres, plantes...) même si le fix de leur scrollFactor,
  // plus haut dans ce fichier, limite déjà les dégâts une fois que ça
  // arrive -- ceci règle la CAUSE : pour ces zones, la caméra ne devrait
  // simplement jamais pouvoir aller voir plus haut/bas que l'écran de
  // base. `data.tallLevel` (pas encore posé par aucune zone existante) :
  // point d'extension explicite pour un futur "niveau en hauteur" qui
  // voudrait de la vraie verticalité (cf. modif.txt) -- seul un niveau qui
  // le déclare récupère la pleine marge ci-dessus pour SA caméra. Le monde
  // PHYSIQUE, lui, garde toujours sa pleine hauteur quoi qu'il arrive :
  // une vraie fosse peut continuer d'exister sous l'écran (cf. Zone2/
  // Zone4, qui tombent dedans avant un changement de scène/dégâts) --
  // seule la caméra arrête de suivre une fois sortie de l'écran, au lieu
  // de continuer à descendre avec le joueur.
  // (cameraTop/cameraHeight calculés plus haut, avec les fonds ; `camera.
  // vertical` ouvre la même course que tallLevel, cf. setupZoneCamera.)
  scene.cameras.main.setBounds(0, cameraTop, levelWidth, cameraHeight);
  scene.levelWidth = levelWidth;

  // Point d'entrée précis (cf. commentaire de fonction ci-dessus) : une
  // sortie reliée via "Arrivée dans ..." (openConnectPicker) passe
  // `enterId` dans `exit.data`, retrouvé ici parmi `data.entries` (posées
  // avec l'outil "Entrée" de l'éditeur -- même segment vertical qu'une
  // sortie désormais, cf. EditorScene.js). Introuvable ou absent -> spawn
  // par défaut de la zone, comportement d'avant inchangé.
  const enterId = sceneData && sceneData.enterId;
  const enteredAt = enterId && (data.entries || []).find((e) => e.id === enterId);
  let spawn = enteredAt || data.playerSpawn || { x: 80, y: 100 };
  // Retour utilisateur : "quand je prend une gate d'un sens ou l'autre je
  // doit arriver au meme equivalent altitude de l'autre coté" -- `enterRatio`
  // (posé par updateLevelFromData au moment de franchir la sortie source,
  // 0 = haut de SA ligne, 1 = bas) est réappliqué ici le long de la propre
  // hauteur de l'ENTRÉE ciblée plutôt que de toujours retomber pile sur son
  // centre (`entry.y`) quelle que soit la hauteur à laquelle on est sorti.
  if (enteredAt && enteredAt.height != null && sceneData.enterRatio != null) {
    const ratio = Phaser.Math.Clamp(sceneData.enterRatio, 0, 1);
    spawn = { x: enteredAt.x, y: (enteredAt.y - enteredAt.height / 2) + ratio * enteredAt.height };
  }
  // Un portail (cf. EditorScene.js finishPortalDrag) pose sa sortie ET son
  // entrée AU MÊME endroit -- la même porte, empruntable dans les 2 sens.
  // Le déclenchement par contact réel de hitbox (cf. EXIT_TRIGGER_WIDTH plus
  // haut) touche donc CETTE zone dès le spawn si on vient d'arriver par ce
  // portail précis : sans ce garde-fou, on repartirait instantanément dans
  // l'autre sens (aller-retour infini) avant même d'avoir pu s'en éloigner.
  // Désarmé pour ce seul `portalId` jusqu'à ce que le joueur cesse de
  // toucher son rectangle une première fois (cf. updateLevelFromData).
  scene.__spawnPortalId = (enteredAt && enteredAt.portalId) || null;
  // Retour utilisateur : "je ne peux plus retourner a la zone1, ça me met
  // un écran vide" (partie 2, après le fix de `__transitioningAway`
  // ci-dessus) -- vérifié empiriquement : après un aller-retour de zone,
  // l'ANCIENNE instance de la zone quittée continue de recevoir des appels
  // update() de Phaser (son `scene.player`/`scene.xara` d'alors ont bien
  // été détruits entre-temps -- `this.scene` y vaut `undefined` -- mais
  // rien n'empêchait `updateLevelFromData`/les callbacks `scene.events.on
  // ('update', ...)` posés par `addAbilityShrine`/`addCampfire` de
  // continuer à tourner dessus, plantant sur ces objets détruits et
  // empêchant la vraie zone courante de jamais recevoir sa propre frame
  // "sortie déjà quittée" (cf. reset de `__spawnPortalId` plus bas, jamais
  // atteint une fois le crash lancé). Pourquoi Phaser continue d'appeler
  // update() sur cette instance après `goToScene` reste incompris (son
  // `sys.settings.active`/`status` lisent pourtant RUNNING) -- plutôt que
  // de percer ce mystère plus loin, on tranche au niveau appli : un seul
  // pointeur module-level (`currentLevelScene`) vers la DERNIÈRE zone
  // construite ; toute frame reçue par une instance qui n'est plus celle-là
  // (donc forcément une frame fantôme d'une zone quittée) est ignorée sans
  // toucher à aucun objet potentiellement détruit.
  currentLevelScene = scene;
  // `scene.restart()` / sortie de zone : sans ça, update() tournerait sur
  // l'ancien joueur détruit tant que la nouvelle visite n'a pas fini de se
  // construire (resolveZoneData est asynchrone).
  scene.events.once('shutdown', () => {
    hideBossBar(scene);
    scene.player = null;
    scene.xara = null;
    if (currentLevelScene === scene) currentLevelScene = null;
  });
  scene.player = new Player(scene, spawn.x, spawn.y);
  // Xara peut être absente (`xara: false`, ou zone de l'histoire avant sa
  // rencontre) : cf. shouldSpawnXara dans StoryKit.js pour la règle.
  scene.xara = shouldSpawnXara(scene, data) ? new Xara(scene, scene.player) : null;
  scene.physics.add.collider(scene.player, scene.ground);
  // Suivi historique (centré, immédiat), ou caméra de zone (`camera.vertical` :
  // zone morte + ressort, ciel qui se révèle), cf. setupZoneCamera.
  setupZoneCamera(scene, data, { camLow, camHigh });

  if (scene.water.length) {
    scene.physics.add.overlap(scene.player, scene.water, () => { scene.player.inWater = true; });
  }

  // Toiles au sol (voir Web.js) : zone non solide, juste un ralentissement
  // hors forme Loup (cf. Player.js `inWeb`) — même mécanique que l'eau
  // ci-dessus, pas de collider.
  scene.webs = (data.webs || []).map((w) => new Web(scene, w.x, w.y));
  if (scene.webs.length) {
    scene.physics.add.overlap(scene.player, scene.webs, () => { scene.player.inWeb = true; });
  }

  // Personnages devant les décors (cf. CHARACTER_DEPTH) : profondeur posée à
  // l'AJOUT dans le groupe, donc aussi pour les ennemis qu'un script ajoute
  // plus tard (renforts, mousses invoquées par Ghil't, boss) ; leurs
  // projectiles/effets créés ensuite à `this.depth + 1` suivent.
  scene.enemies = scene.physics.add.group({
    createCallback: (enemy) => { if (enemy && enemy.setDepth) enemy.setDepth(CHARACTER_DEPTH); },
  });
  for (const e of data.enemies || []) {
    // Registre data-driven (cf. ENEMY_REGISTRY dans StoryKit.js, chaque
    // fichier d'entité peut s'y enregistrer) à la place de l'ancienne chaîne
    // if/else par type.
    const factory = ENEMY_REGISTRY[e.type];
    if (!factory) {
      console.warn(`buildLevelFromData : type d'ennemi inconnu "${e.type}"`);
      continue;
    }
    const enemy = factory(scene, {
      ...e,
      patrolMinX: e.patrolMinX ?? e.x - 150,
      patrolMaxX: e.patrolMaxX ?? e.x + 150,
    });
    if (!enemy) continue;
    // `group.add()` réinitialise `body.allowGravity` à `true`, écrasant le
    // `setAllowGravity(false)` posé dans le constructeur des ennemis fixes/
    // volants — sans ce rattrapage ils tombent hors du niveau dès l'ajout.
    scene.enemies.add(enemy);
    if (enemy.noGravity || e.type === 'araignee' || e.type === 'corbeau') enemy.body.setAllowGravity(false);
    // L'araignée fixe n'attaque pas au contact (seule sa toile gêne).
    if (e.type === 'araignee' && enemy.harmless === undefined) enemy.harmless = true;
  }
  scene.physics.add.collider(scene.enemies, scene.ground);
  // Contact des corps : dégâts subis, sauf si la portée de l'attaque couvre
  // l'ennemi (le coup lui-même est porté par tryPlayerMeleeHit, aussi testé
  // chaque frame SANS contact dans updateLevelFromData).
  scene.physics.add.overlap(scene.player, scene.enemies, (player, enemy) => {
    if (player.isInvulnerable || enemy.defeated || isWorldFrozen(scene)) return;
    if (tryPlayerMeleeHit(scene, player, enemy)) return;
    if (!enemy.harmless) player.hitByEnemy();
  });

  for (const t of data.totems || []) {
    const y = groundSurfaceYAt(scene, t.x, t.y) ?? t.y;
    addAbilityShrine(scene, t.x, y, t.flag, t.message || '', t.scale || TOTEM_SCALE);
  }

  // Gardés dans `scene.props` : un PNJ ou un objet posé SUR un décor (Xara sur
  // sa souche, l'idole sur son autel) se cale sur le haut visible de l'image
  // (cf. propTopYAt) plutôt que sur un y écrit à la main.
  scene.props = [];
  for (const p of data.props || []) {
    // Décor retiré du jeu (ex. `foret_sombre_arbre_moussu`) ou image absente :
    // ignoré en silence plutôt qu'affiché en carré « texture manquante ».
    if (!scene.textures.exists(`${PROP_PREFIX}${p.type}`)) continue;
    // Surface où l'on MARCHE (haut de la hitbox, cf. GROUND_STAND_SINK :
    // 16 px sous le haut visuel des tuiles d'herbe avec 'floor', le haut de la
    // case avec 'tuiles'), pas le haut de l'image de tuile -- sinon, avec
    // 'floor', les décors flottaient au-dessus de l'herbe.
    // Par le bas VISIBLE de l'image (cf. placeOnGround) : les planches gardent
    // quelques px de marge transparente sous le socle (2-3 px affichés).
    const stand = groundStandYAt(scene, p.x, p.y);
    const img = scene.add.image(p.x, stand ?? p.y, `${PROP_PREFIX}${p.type}`).setOrigin(0.5, 1).setScale(p.scale || PROP_SCALE);
    if (stand != null) setVisibleBottomY(img, stand + GROUND_CONTACT_SINK);
    img.propType = p.type;
    scene.props.push(img);
  }

  // Retour utilisateur : "rajoute le feu de camp dans les element
  // rajoutable dans le mode édit" -- jusqu'ici planté à la main par
  // Zone1Scene.js (seule zone à en avoir un), maintenant une vraie donnée
  // de niveau comme totems/props, posable dans n'importe quelle zone
  // depuis l'éditeur. Même recalage sur le sol RÉEL que pour eux (pas la
  // position brute stockée) : cf. leur commentaire respectif.
  for (const c of data.campfires || []) {
    const y = groundSurfaceYAt(scene, c.x, c.y) ?? c.y;
    addCampfire(scene, c.x, y, c.scale || CAMPFIRE_SCALE);
  }

  // Retour utilisateur : "une zone doit avoir plusieurs sorties" -- `exits`
  // (tableau) est le format actuel (cf. EditorScene.js, outil "Sortie
  // niveau", chaque sortie est désormais un élément posé comme un
  // totem/décor, pas une seule ligne verticale couvrant toute la zone) ;
  // `exit` (singulier) reste lu pour les zones plus anciennes qui n'ont
  // jamais été retouchées depuis l'éditeur (zone1/zone3/zone4/zone5/
  // sous_grotte/zone_aquatique) -- pas besoin de les migrer à la main,
  // juste normalisé en tableau d'un seul élément ici.
  scene.__exits = data.exits || (data.exit ? [data.exit] : []);

  createHud(scene);

  // Clés de données additionnelles (PNJ, déclencheurs, mousse, script de
  // zone...) : cf. LEVEL_DATA_HANDLERS dans StoryKit.js / PLAN_DEV.md.
  runLevelDataHandlers(scene, data);
  storyOnZoneEnter(scene, data, sceneData);
  // Juice : temps (hit-stop), regard caméra, lucioles/papillons d'ambiance.
  juiceSetupLevel(scene, data);
}

// Mêlée / piqué de l'aigle contre UN ennemi : vrai si la portée de l'attaque
// (player.getAttackHitbox) recouvre ses bounds -- qu'il y ait ou non contact
// des corps (correctif : avant, le coup n'était testé que dans l'overlap des
// corps, donc la lame d'Agarica ne touchait qu'au corps à corps). Un coup =
// un seul dégât, même si la fenêtre d'attaque couvre plusieurs frames (token,
// cf. damageEnemy) ; le piqué de l'aigle frappe au plus toutes les 400 ms.
function tryPlayerMeleeHit(scene, player, enemy) {
  if (!enemy || enemy.defeated || !enemy.active) return false;
  const hitbox = player.getAttackHitbox();
  if (!hitbox || !Phaser.Geom.Intersects.RectangleToRectangle(hitbox, enemy.getBounds())) return false;
  const token = player.isAttacking ? `melee-${player.attackEndTime}` : `dive-${Math.floor(scene.time.now / 400)}`;
  if (damageEnemy(scene, enemy, { kind: player.isAttacking ? 'melee' : 'dive', player, token })) {
    // Petite portion d'énergie par coup porté (cf. ENERGY_PER_HIT).
    player.gainEnergy(ENERGY_PER_HIT);
  }
  return true;
}

// Inflige un coup à un ennemi : `takeHit(source)` s'il existe (ennemis à
// plusieurs PV, boss), sinon `defeat()`. `source.token` identifie l'attaque
// (mêlée, plume, compétence) : un même token ne touche qu'une fois le même
// ennemi -- corrige le Loup Alpha (hp 3) tué en un seul coup, quand la
// fenêtre de mêlée touchait sur plusieurs frames. Vrai si le coup a porté.
function damageEnemy(scene, enemy, source = {}) {
  if (!enemy || enemy.defeated || !enemy.active) return false;
  if (source.token != null) {
    if (enemy.__lastHitToken === source.token) return false;
    enemy.__lastHitToken = source.token;
  }
  if (typeof enemy.takeHit === 'function') enemy.takeHit(source);
  else enemy.defeat();
  // Retour visuel du coup (hit-stop, étincelles, flash, poof) : cf. Juice.
  juiceOnEnemyHit(scene, enemy, source);
  return true;
}

// Cœurs (cf. HEART_MAX dans Player.js) + barre d'énergie (cf. ENERGY_MAX) :
// un seul Graphics redessiné chaque frame (cf. drawHud plus bas) plutôt que
// des sprites individuels à créer/détruire quand le nombre de cœurs change
// -- plus simple tant qu'il n'y a que 3 cœurs fixes. "Image changeable"
// (demande FEAT modif.txt) : dessiné en forme de cœur générique pour
// l'instant, faute d'asset dédié -- prévu pour être remplacé par une vraie
// image le jour où l'utilisateur en fournit une (même remarque que pour la
// compétence Ours dans Player.js, aucun art créé ici).
const HUD_MARGIN = 16;
const HUD_HEART_SIZE = 22;
const HUD_HEART_GAP = 8;
const HUD_ENERGY_BAR_WIDTH = 150;
const HUD_ENERGY_BAR_HEIGHT = 10;
const HUD_ENERGY_BAR_GAP_Y = 14;
// Emplacements de compétences en bas à gauche (retour utilisateur : "met
// les icone de compétence selectionner en bas a gauche"), touches A/F/R
// (cf. player.skillKeys dans Player.js) affichées sur chaque case dans le
// même ordre. Pas d'icône dédiée par compétence pour l'instant (même
// remarque que partout ailleurs dans ce fichier/Player.js) : un carré de
// la couleur `hudColor` de la compétence (cf. SKILL_DEFS) si équipée, vide
// sinon -- la lettre de la touche reste lisible dans les deux cas.
const HUD_SKILL_SIZE = 34;
const HUD_SKILL_GAP = 8;
const HUD_SKILL_LABELS = ['A', 'F', 'R'];
const HUD_SKILL_EMPTY_COLOR = 0x241c3d;
const HUD_SKILL_UNAVAILABLE_ALPHA = 0.45;

function drawHeartIcon(g, cx, cy, size, color, alpha) {
  const r = size * 0.28;
  g.fillStyle(color, alpha);
  g.fillCircle(cx - r * 0.95, cy - r * 0.4, r);
  g.fillCircle(cx + r * 0.95, cy - r * 0.4, r);
  g.fillTriangle(
    cx - r * 1.9, cy - r * 0.15,
    cx + r * 1.9, cy - r * 0.15,
    cx, cy + r * 1.9,
  );
}

function createHud(scene) {
  // En haut à gauche (retour utilisateur : "met la barre de vie et energie
  // en haut de l'ecran" -- remplace le texte d'aide de zone qui occupait
  // ce coin, retiré en même temps, cf. buildLevelFromData) :
  // `setScrollFactor(0)` + position dérivée de scene.scale pour rester
  // ancré au coin de l'écran quelle que soit la caméra.
  scene.hudGraphics = scene.add.graphics().setScrollFactor(0).setDepth(1000);
  // Lettres des touches de compétence (cf. HUD_SKILL_LABELS) : 3 Text
  // créés une seule fois ici, repositionnés/retextés chaque frame dans
  // drawHud -- même raisonnement que hudGraphics, éviter de recréer des
  // objets à chaque frame pour un simple HUD qui se redessine en continu.
  scene.hudSkillTexts = HUD_SKILL_LABELS.map(() => scene.add.text(0, 0, '', {
    fontFamily: 'sans-serif', fontSize: '14px', color: '#ffe9f5', fontStyle: 'bold',
  }).setOrigin(0.5).setScrollFactor(0).setDepth(1001));
}

// Appelée depuis updateLevelFromData -- redessine tout depuis zéro chaque
// frame (coût négligeable pour quelques formes géométriques simples).
function drawHud(scene) {
  const g = scene.hudGraphics;
  g.clear();
  // Juice : cœurs perdus/regagnés animés, énergie lissée (cf. juiceHudUpdate).
  juiceHudUpdate(scene);
  // Art Codex (cœurs hud_coeur*, icônes skill_icone_*) : posé en images par
  // storyDrawHudArt (StoryKit.js, agent UI) ; ici seulement le repli dessiné.
  const art = typeof storyDrawHudArt === 'function' ? storyDrawHudArt(scene) : null;
  // Construit du HAUT vers le BAS : les cœurs collent au bord haut de
  // l'écran, la barre d'énergie juste en dessous.
  const baseY = HUD_MARGIN;
  const barY = baseY + HUD_HEART_SIZE + HUD_ENERGY_BAR_GAP_Y;
  // `player.maxHearts`/`maxEnergy` (pas les constantes de base HEART_MAX/
  // ENERGY_MAX) : inclut les bonus de totems équipés (cf.
  // recomputeTotemBonuses dans Player.js), donc la barre/les cœurs
  // s'allongent tout seuls quand un totem "vie"/"énergie" est équipé.
  for (let i = 0; !(art && art.hearts) && i < scene.player.maxHearts; i++) {
    const cx = HUD_MARGIN + HUD_HEART_SIZE / 2 + i * (HUD_HEART_SIZE + HUD_HEART_GAP);
    const cy = baseY + HUD_HEART_SIZE / 2;
    const hf = juiceHudHeart(scene, i, cx, cy);
    const filled = hf.full;
    const size = HUD_HEART_SIZE * hf.scale;
    drawHeartIcon(g, cx + hf.dx, cy + hf.dy, size, filled ? 0xff4d6d : 0x4a3d63, filled ? 1 : 0.6);
    if (hf.flash > 0) drawHeartIcon(g, cx + hf.dx, cy + hf.dy, size, 0xffffff, 0.7 * hf.flash);
  }
  const barX = HUD_MARGIN;
  juiceDrawEnergyBar(scene, g, barX, barY, HUD_ENERGY_BAR_WIDTH, HUD_ENERGY_BAR_HEIGHT);

  // Compétences en bas à gauche (cf. HUD_SKILL_* plus haut), ancré au bord
  // BAS de l'écran (comme les cœurs sont ancrés au bord HAUT) donc calculé
  // depuis `scene.scale.height`, pas empilé après ce qui précède.
  const skillY = scene.scale.height - HUD_MARGIN - HUD_SKILL_SIZE / 2;
  const player = scene.player;
  const now = scene.time.now;
  HUD_SKILL_LABELS.forEach((label, i) => {
    if (art && art.skills[i]) return; // icône Codex (storyDrawHudArt)
    const cx = HUD_MARGIN + HUD_SKILL_SIZE / 2 + i * (HUD_SKILL_SIZE + HUD_SKILL_GAP);
    const skillId = player.skillSlots[i];
    const def = skillId ? SKILL_DEFS[skillId] : null;
    // Indisponible (encore en cooldown -- couvre transfo+attaque, cf.
    // tryActivateSkill -- OU pas assez d'énergie) : case grisée plutôt que
    // masquée, pour que le joueur voie TOUJOURS ce qu'il a d'équipé.
    const unavailable = !def || now < player.skillCooldownEndTime || player.energy < def.cost;
    const alpha = def && unavailable ? HUD_SKILL_UNAVAILABLE_ALPHA : 1;
    const s = HUD_SKILL_SIZE * juiceHudSkillScale(scene, i);
    g.fillStyle(def ? def.hudColor : HUD_SKILL_EMPTY_COLOR, alpha);
    g.fillRoundedRect(cx - s / 2, skillY - s / 2, s, s, 6);
    g.lineStyle(2, 0x8fe3b8, def ? alpha : 0.5);
    g.strokeRoundedRect(cx - s / 2, skillY - s / 2, s, s, 6);
    const text = scene.hudSkillTexts[i];
    text.setText(label);
    text.setPosition(cx, skillY);
    text.setAlpha(def ? alpha : 0.5);
  });
}

// Boucle `update()` commune à une scène construite par buildLevelFromData —
// même contenu que ce que chaque Zone*Scene répète à la main aujourd'hui.
function updateLevelFromData(scene, time, delta) {
  // Cf. le commentaire sur `currentLevelScene` (déclaration plus haut) et
  // celui dans buildLevelFromData -- une zone quittée peut continuer à
  // recevoir des frames update() fantômes ; ignorées ici avant de toucher
  // le moindre objet (player/xara/...) potentiellement déjà détruit.
  if (scene !== currentLevelScene) return;
  // `scene.create()` attend maintenant `resolveZoneData(...)` (une
  // promesse IndexedDB, cf. son commentaire) avant d'appeler
  // buildLevelFromData -- Phaser continue d'appeler update() à chaque
  // frame pendant cette (très courte) attente, alors que rien n'existe
  // encore (scene.player/ground/enemies tous undefined). Sans ce retour
  // anticipé, la toute première frame plantait presque à coup sûr sur
  // `scene.player.update()` un peu plus bas.
  if (!scene.player || !scene.player.active || !scene.player.body) return;
  // Monde gelé (cf. isWorldFrozen dans StoryKit.js : menu du feu de camp,
  // dialogue, inventaire, carte, cinématique) : aucun mouvement joueur/Xara/
  // ennemi, aucune sortie de zone -- seul le HUD continue d'être dessiné ici,
  // les overlays se dessinent eux-mêmes dans leur propre scène.
  if (isWorldFrozen(scene)) {
    freezeWorldBodies(scene);
  } else {
    scene.player.update();
    if (scene.xara) scene.xara.update(time, delta);
    scene.enemies.children.iterate((enemy) => enemy && enemy.update(scene.player));
    // Portée de la mêlée testée contre TOUS les ennemis, pas seulement ceux
    // dont le corps touche Agarica (cf. tryPlayerMeleeHit).
    if (scene.player.getAttackHitbox()) {
      scene.enemies.getChildren().slice().forEach((enemy) => tryPlayerMeleeHit(scene, scene.player, enemy));
    }

    // Zone de dégâts d'une compétence active (cf. getSkillHitbox/SKILL_DEFS
    // dans Player.js) : vérifiée manuellement contre TOUS les ennemis, pas
    // via un `physics.add.overlap` comme l'attaque de mêlée -- cette zone est
    // bien plus large que le corps d'Agarica. Un seul coup par activation et
    // par ennemi (token, cf. damageEnemy). La compétence `papillon` soigne
    // les ennemis corrompus (`heal()`) au lieu de frapper.
    const skillHitbox = scene.player.getSkillHitbox();
    if (skillHitbox) {
      const skillId = scene.player.activeSkillId;
      const token = `skill-${skillId}-${scene.player.skillActiveUntil}`;
      if (scene.__lastSkillEventToken !== token) {
        scene.__lastSkillEventToken = token;
        // Pour les boss/scripts hors du groupe `enemies` (Kainati, Ghil't...).
        scene.events.emit('player-skill', { skillId, rect: skillHitbox, token });
      }
      const def = typeof SKILL_DEFS !== 'undefined' ? SKILL_DEFS[skillId] : null;
      const heals = skillId === 'papillon' || (def && def.heals);
      scene.enemies.children.iterate((enemy) => {
        if (!enemy || enemy.defeated) return;
        if (!Phaser.Geom.Intersects.RectangleToRectangle(skillHitbox, enemy.getBounds())) return;
        if (heals) {
          if (enemy.corrupted && typeof enemy.heal === 'function' && enemy.__lastHitToken !== token) {
            enemy.__lastHitToken = token;
            enemy.heal({ kind: 'skill', skillId, player: scene.player, token });
          }
          return;
        }
        if (damageEnemy(scene, enemy, { kind: 'skill', skillId, player: scene.player, token })) {
          scene.player.gainEnergy(ENERGY_PER_HIT);
        }
      });
    }

    // Clés de zone dynamiques (cf. LEVEL_UPDATE_HOOKS, StoryKit.js).
    for (const hook of LEVEL_UPDATE_HOOKS) {
      hook(scene, time, delta);
      if (scene.__transitioningAway) break;
    }

    // Plusieurs sorties possibles désormais (cf. scene.__exits) : déclenche
    // la première touchée -- une seule peut jouer de toute façon, la scène
    // change dès que goToScene() est appelé.
    //
    // Retour utilisateur : "la hitbox des entré sortie devrais lancer le
    // changement de zone quand la hitbox touche le portail" -- comparaison
    // du corps physique RÉEL du joueur (pas juste son centre) contre un
    // vrai rectangle de déclenchement (cf. EXIT_TRIGGER_WIDTH/
    // getExitTriggerRect plus haut), dans les DEUX sens, plutôt que l'ancien
    // seuil `player.x > exit.x` (uniquement en marchant vers la droite).
    const playerBodyRect = new Phaser.Geom.Rectangle(
      scene.player.body.x, scene.player.body.y, scene.player.body.width, scene.player.body.height,
    );
    let stillTouchingSpawnPortal = false;
    for (const exit of scene.__exits || []) {
      if (!exit) continue;
      const touching = Phaser.Geom.Intersects.RectangleToRectangle(playerBodyRect, getExitTriggerRect(exit));
      if (!touching) continue;
      // Cf. scene.__spawnPortalId (posé dans buildLevelFromData) : on
      // vient d'arriver PAR ce portail précis -- ignoré tant qu'on ne l'a
      // pas quitté au moins une fois, sinon aller-retour infini.
      if (exit.portalId && exit.portalId === scene.__spawnPortalId) {
        stillTouchingSpawnPortal = true;
        continue;
      }
      if (!exit.targetScene) continue;
      // Retour utilisateur : "quand je prend une gate d'un sens ou l'autre
      // je doit arriver au meme equivalent altitude de l'autre coté" --
      // position relative (0 = haut du portail, 1 = bas) au moment du
      // contact, réappliquée à l'ENTRÉE ciblée (même logique, sa propre
      // hauteur, cf. `enterRatio` dans buildLevelFromData) plutôt que de
      // toujours arriver pile au centre de l'entrée. Anciennes sorties
      // (jamais de `height` stocké, cf. normalisation dans
      // buildLevelFromData) : pas de ratio, comportement d'avant (spawn/
      // centre de l'entrée).
      const ratio = exit.height != null
        ? Phaser.Math.Clamp((scene.player.y - (exit.y - exit.height / 2)) / exit.height, 0, 1)
        : null;
      const exitData = (ratio != null && exit.data && exit.data.enterId)
        ? { ...exit.data, enterRatio: ratio }
        : exit.data;
      goToScene(scene, exit.targetScene, exitData);
      break;
    }
    // Le joueur a fini de traverser sa propre porte d'arrivée (ne la touche
    // plus) : réarme son déclenchement pour un futur aller-retour.
    if (!stillTouchingSpawnPortal) scene.__spawnPortalId = null;
  }
  // Hors du `if` ci-dessus : redessine (ou efface, si une bascule vient de
  // repasser à faux) même pendant que CampfireMenuScene est ouverte par-
  // dessus, sinon un dernier tracé resterait figé à l'écran au lieu de
  // disparaître au Shift+A/Shift+J pendant que le menu est ouvert.
  drawCombatDebugOverlays(scene);
  drawHud(scene);
}

// Pendant un gel, la physique continue (gravité) : on coupe l'élan horizontal
// du joueur (sauf s'il est piloté par une cinématique, cf. playerMove) et
// celui des ennemis, sinon ils glisseraient sur leur dernière vitesse.
function freezeWorldBodies(scene) {
  const player = scene.player;
  if (player.body && !scene.__playerScripted) player.setVelocityX(0);
  // L'accélération de course (Player.update) restait appliquée pendant le
  // gel : Agarica glissait (~30 px/s) pendant un dialogue, jusqu'à tomber
  // d'un bord de ravin. Player.update la repose à chaque frame une fois dégelé.
  if (player.body) player.setAccelerationX(0);
  scene.enemies.children.iterate((enemy) => {
    if (!enemy || !enemy.body || !enemy.body.enable) return;
    enemy.body.setVelocityX(0);
    if (!enemy.body.allowGravity) enemy.body.setVelocityY(0);
  });
}

// ===========================================================================
// JUICE — « game feel » (2026-10-23). Effets PUREMENT visuels : particules,
// secousses dosées, micro-pauses (hit-stop), squash & stretch appliqués au
// seul moment du dessin (jamais à la hitbox), fondus de zone, recadrage de la
// caméra. Aucun ne change une hitbox, un timing de combat (horloge de scène)
// ni la durée d'une cinématique. API (PLAN_DEV.md, section « Juice ») :
//   spawnFx(scene, kind, x, y, opts)   effet ponctuel (cf. liste avant spawnFx)
//   juiceShake(scene, force, ms)       secousse dosée (réglage « Secousses d'écran »)
//   juiceHitStop(scene, ms) · juiceSlowMo(scene, opts) · juiceZoomPulse(scene, opts)
//   juiceSquash(obj, sx, sy, ms) · juiceRecoil(obj, dx, dy, ms) · juiceTilt(obj, rad, ms)
//   juiceFlash(obj, color, ms) · juiceGhost(scene, sprite, opts) · juiceBurstImage(...)
//   playSfx(id, opts)                  point d'accroche audio, sans effet
// Images du lot Codex n°8 (`fx_*`, `fx_halo_*`, `vfx_anneau_choc`) utilisées
// dès qu'elles existent, sinon petites textures dessinées par code.
// ===========================================================================

// --- Son : points d'accroche vides (le projet n'a pas d'audio) -------------
// Brancher un son plus tard : SFX_HOOKS[id] = (id, opts) => … (ou '*').
const SFX_HOOKS = {};
function playSfx(id, opts = {}) {
  const hook = SFX_HOOKS[id] || SFX_HOOKS['*'];
  if (!hook) return;
  try { hook(id, opts); } catch (e) { console.warn('playSfx', id, e); }
}

// --- Réglage d'accessibilité « Secousses d'écran » --------------------------
// Mémorisé avec les autres options (menuOptions, MenuKit.js, localStorage).
const JUICE_SHAKE_LEVELS = { on: 1, reduced: 0.35, off: 0 };
const JUICE_SHAKE_LABELS = { on: 'Activées', reduced: 'Réduites', off: 'Désactivées' };
const JUICE_SHAKE_ORDER = ['on', 'reduced', 'off'];
let juiceShakeCache = { at: -Infinity, level: 'on' };

function juiceShakeLevel() {
  const now = Date.now();
  if (now - juiceShakeCache.at > 500) {
    let level = 'on';
    try { if (typeof menuOptions === 'function') level = menuOptions().screenShake || 'on'; } catch (e) { level = 'on'; }
    juiceShakeCache = { at: now, level: JUICE_SHAKE_LEVELS[level] != null ? level : 'on' };
  }
  return juiceShakeCache.level;
}

function juiceSetShakeLevel(level) {
  if (JUICE_SHAKE_LEVELS[level] == null) return;
  if (typeof menuSetOption === 'function') menuSetOption('screenShake', level);
  juiceShakeCache = { at: Date.now(), level };
}

function juiceShakeFactor() {
  return JUICE_SHAKE_LEVELS[juiceShakeLevel()];
}

// TOUTE secousse de caméra (y compris les `cam.shake(...)` des scripts
// d'histoire et des boss) passe par le réglage : intensité × facteur. À 0 la
// caméra ne bouge plus, mais la durée et le rappel de fin restent identiques
// (aucune cinématique ne change de rythme).
(function juiceInstallShakeGuard() {
  const proto = Phaser.Cameras.Scene2D.Camera.prototype;
  if (proto.__juiceShakeGuard) return;
  const original = proto.shake;
  proto.shake = function shake(duration, intensity, force, callback, context) {
    const f = juiceShakeFactor();
    let k = intensity;
    if (f !== 1) {
      if (intensity === undefined) k = 0.05 * f;
      else if (typeof intensity === 'number') k = intensity * f;
      else if (intensity && typeof intensity.x === 'number') k = new Phaser.Math.Vector2(intensity.x * f, intensity.y * f);
    }
    return original.call(this, duration, k, force, callback, context);
  };
  proto.__juiceShakeGuard = true;
}());

// Secousses dosées : [durée ms, intensité]. Une secousse plus forte remplace
// celle en cours, jamais l'inverse (un petit coup ne coupe pas un gros).
const JUICE_SHAKES = {
  tiny: [70, 0.0012], light: [110, 0.0028], medium: [170, 0.0055], heavy: [260, 0.0095], huge: [420, 0.015],
};

function juiceShake(scene, force = 'light', ms) {
  const cam = scene && scene.cameras && scene.cameras.main;
  if (!cam) return;
  const preset = typeof force === 'number' ? [ms || 150, force] : (JUICE_SHAKES[force] || JUICE_SHAKES.light);
  const f = juiceShakeFactor();
  if (f <= 0) return;
  const eff = cam.shakeEffect;
  if (eff && eff.isRunning && eff.intensity && preset[1] * f < eff.intensity.x) return;
  cam.shake(ms || preset[0], preset[1], true);
}

// --- Temps : micro-pause (hit-stop) et ralenti ------------------------------
// Physique Arcade en PAUSE (aucun rattrapage à la reprise) et anims quasi
// figées, mesurées en temps RÉEL : l'horloge de scène (fenêtres d'attaque,
// IA, minuteries, cinématiques) continue -- aucun timing de jeu ne bouge.
const JUICE_HITSTOP_MAX_MS = 90;

function juiceTimeState(scene) {
  if (!scene || !scene.events || !scene.physics) return null;
  let st = scene.__juiceTime;
  if (!st) {
    st = { stopUntil: 0, slowUntil: 0, slowPhysics: 1, slowAnims: 1, paused: false, ts: null, anim: null };
    scene.__juiceTime = st;
    scene.events.on('update', () => juiceUpdateTime(scene));
    scene.events.on('shutdown', () => juiceResetTime(scene));
  }
  return st;
}

function juiceUpdateTime(scene) {
  const st = scene.__juiceTime;
  if (!st) return;
  const now = performance.now();
  const stopping = now < st.stopUntil;
  const slowing = now < st.slowUntil;
  const world = scene.physics && scene.physics.world;
  if (world) {
    if (stopping && !st.paused) { world.pause(); st.paused = true; } else if (!stopping && st.paused) { world.resume(); st.paused = false; }
    const ts = slowing ? st.slowPhysics : 1;
    if (st.ts !== ts) { world.timeScale = ts; st.ts = ts; }
  }
  const anim = stopping ? 0.02 : (slowing ? st.slowAnims : 1);
  if (st.anim !== anim && scene.anims) { scene.anims.globalTimeScale = anim; st.anim = anim; }
}

function juiceResetTime(scene) {
  const st = scene.__juiceTime;
  if (!st) return;
  st.stopUntil = 0;
  st.slowUntil = 0;
  const world = scene.physics && scene.physics.world;
  if (world && st.paused) world.resume();
  if (world) world.timeScale = 1;
  st.paused = false;
  st.ts = 1;
  if (scene.anims) scene.anims.globalTimeScale = 1;
  st.anim = 1;
}

function juiceHitStop(scene, ms = 50) {
  const st = juiceTimeState(scene);
  if (!st || ms <= 0) return;
  const now = performance.now();
  st.stopUntil = Math.min(now + JUICE_HITSTOP_MAX_MS, Math.max(st.stopUntil, now + ms));
  juiceUpdateTime(scene);
}

// Ralenti : physique `physics` fois plus lente (timeScale Arcade), anims × `anims`.
function juiceSlowMo(scene, { ms = 500, physics = 2.5, anims = 0.4 } = {}) {
  const st = juiceTimeState(scene);
  if (!st) return;
  st.slowUntil = Math.max(st.slowUntil, performance.now() + ms);
  st.slowPhysics = physics;
  st.slowAnims = anims;
  juiceUpdateTime(scene);
}

// Petit zoom aller-retour de la caméra (mort de boss, gros éclat).
function juiceZoomPulse(scene, { zoom = 1.05, ms = 900, ease = 'Sine.easeInOut' } = {}) {
  const cam = scene && scene.cameras && scene.cameras.main;
  if (!cam || scene.__juiceZooming || Math.abs(cam.zoom - 1) > 0.001) return;
  scene.__juiceZooming = true;
  scene.tweens.add({
    targets: cam, zoom, duration: ms * 0.35, hold: ms * 0.3, yoyo: true, ease,
    onComplete: () => { cam.setZoom(1); scene.__juiceZooming = false; },
  });
}

// --- Squash & stretch, recul, inclinaison : au moment du DESSIN seulement ---
// Échelle/rotation/décalage posés juste avant le rendu ('prerender') et
// retirés juste après ('render') : la physique (taille du corps calculée sur
// l'échelle du sprite) ne les voit jamais. Jamais de décalage sur le joueur :
// la caméra le suit pendant le rendu (elle suivrait le décalage).
function juiceRender(obj) {
  if (!obj || !obj.scene || !obj.scene.events) return null;
  if (!obj.__juice) {
    const scene = obj.scene;
    obj.__juice = { sq: { x: 1, y: 1 }, off: { x: 0, y: 0 }, tilt: { r: 0 }, lean: 0, saved: null };
    juiceRenderSet(scene).add(obj);
    obj.once('destroy', () => { if (scene.__juiceRenderSet) scene.__juiceRenderSet.delete(obj); });
  }
  return obj.__juice;
}

function juiceRenderSet(scene) {
  if (!scene.__juiceRenderSet) {
    const set = new Set();
    scene.__juiceRenderSet = set;
    scene.events.on('prerender', () => {
      for (const o of set) {
        const j = o.__juice;
        j.saved = null;
        if (!o.active || !o.visible) continue;
        const r = j.tilt.r + j.lean;
        if (j.sq.x === 1 && j.sq.y === 1 && !r && !j.off.x && !j.off.y) continue;
        j.saved = [o.scaleX, o.scaleY, o.rotation, o.x, o.y];
        o.scaleX *= j.sq.x;
        o.scaleY *= j.sq.y;
        o.rotation += r;
        o.x += j.off.x;
        o.y += j.off.y;
      }
    });
    scene.events.on('render', () => {
      for (const o of set) {
        const j = o.__juice;
        if (!j.saved) continue;
        [o.scaleX, o.scaleY, o.rotation, o.x, o.y] = j.saved;
        j.saved = null;
      }
    });
    scene.events.on('shutdown', () => set.clear());
  }
  return scene.__juiceRenderSet;
}

function juiceSquash(obj, sx, sy, ms = 180, ease = 'Back.easeOut') {
  const j = juiceRender(obj);
  if (!j) return;
  obj.scene.tweens.killTweensOf(j.sq);
  j.sq.x = sx;
  j.sq.y = sy;
  obj.scene.tweens.add({ targets: j.sq, x: 1, y: 1, duration: ms, ease });
}

function juiceRecoil(obj, dx, dy = 0, ms = 140) {
  const j = juiceRender(obj);
  if (!j) return;
  obj.scene.tweens.killTweensOf(j.off);
  j.off.x = dx;
  j.off.y = dy;
  obj.scene.tweens.add({ targets: j.off, x: 0, y: 0, duration: ms, ease: 'Quad.easeOut' });
}

function juiceTilt(obj, r, ms = 160) {
  const j = juiceRender(obj);
  if (!j) return;
  obj.scene.tweens.killTweensOf(j.tilt);
  j.tilt.r = r;
  obj.scene.tweens.add({ targets: j.tilt, r: 0, duration: ms, ease: 'Back.easeOut' });
}

// Flash de couleur pleine (blanc par défaut), teinte d'avant rendue ensuite.
function juiceFlash(obj, color = 0xffffff, ms = 70) {
  if (!obj || !obj.active || !obj.setTintFill || !obj.scene) return;
  const hadTint = obj.isTinted;
  const tint = obj.tintTopLeft;
  const fill = obj.tintFill;
  obj.setTintFill(color);
  obj.scene.time.delayedCall(ms, () => {
    if (!obj.active) return;
    if (hadTint) { obj.setTint(tint); obj.tintFill = fill; } else obj.clearTint();
  });
}

// --- Textures de repli (dessinées une fois, blanches pour être teintées) ----
function juiceEnsureTextures(scene) {
  const tm = scene.textures;
  if (tm.exists('juice-dot')) return;
  const make = (key, w, h, draw) => {
    const t = tm.createCanvas(key, w, h);
    draw(t.getContext(), w, h);
    t.refresh();
  };
  const radial = (ctx, cx, cy, r, stops) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    for (const [at, a] of stops) g.addColorStop(at, `rgba(255,255,255,${a})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  make('juice-dot', 16, 16, (c) => radial(c, 8, 8, 8, [[0, 1], [0.35, 0.6], [1, 0]]));
  make('juice-glow', 96, 96, (c) => radial(c, 48, 48, 48, [[0, 0.95], [0.25, 0.55], [0.6, 0.14], [1, 0]]));
  make('juice-puff', 40, 34, (c) => {
    for (const [x, y, r] of [[13, 20, 11], [24, 18, 12], [19, 12, 10], [30, 23, 8], [10, 25, 7]]) radial(c, x, y, r, [[0, 0.85], [0.6, 0.45], [1, 0]]);
  });
  make('juice-spark', 26, 6, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.65, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0.2)');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(w / 2, h / 2, w / 2, h / 2 - 0.5, 0, 0, Math.PI * 2);
    c.fill();
  });
  make('juice-star', 18, 18, (c) => {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(9, 0); c.lineTo(10.4, 7.6); c.lineTo(18, 9); c.lineTo(10.4, 10.4);
    c.lineTo(9, 18); c.lineTo(7.6, 10.4); c.lineTo(0, 9); c.lineTo(7.6, 7.6);
    c.closePath();
    c.fill();
    radial(c, 9, 9, 4, [[0, 1], [1, 0]]);
  });
  make('juice-leaf', 14, 8, (c) => {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(0, 4); c.quadraticCurveTo(6, -2, 14, 4); c.quadraticCurveTo(6, 10, 0, 4);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)';
    c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(1, 4); c.lineTo(12, 4); c.stroke();
  });
  make('juice-feather', 22, 8, (c) => {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(0, 4); c.quadraticCurveTo(9, -1, 22, 3); c.quadraticCurveTo(10, 9, 0, 4);
    c.fill();
    c.strokeStyle = 'rgba(120,110,150,0.6)';
    c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(0, 4); c.lineTo(20, 3.5); c.stroke();
  });
  make('juice-ring', 96, 96, (c) => {
    c.strokeStyle = 'rgba(255,255,255,0.22)';
    c.lineWidth = 11;
    c.beginPath(); c.arc(48, 48, 40, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,1)';
    c.lineWidth = 3;
    c.beginPath(); c.arc(48, 48, 42, 0, Math.PI * 2); c.stroke();
  });
  make('juice-chip', 10, 9, (c) => {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(1, 3); c.lineTo(5, 0); c.lineTo(10, 2); c.lineTo(8, 8); c.lineTo(2, 9);
    c.closePath();
    c.fill();
  });
  make('juice-drop', 6, 10, (c) => {
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(3, 0); c.quadraticCurveTo(6, 6, 3, 10); c.quadraticCurveTo(0, 6, 3, 0);
    c.fill();
  });
  make('juice-streak', 40, 3, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
}

// Image du manifest (`item-<id>`) si l'art existe, sinon texture de repli.
function juiceTexture(scene, artId, fallback) {
  juiceEnsureTextures(scene);
  const key = artId && scene.textures.exists(`item-${artId}`) ? `item-${artId}` : fallback;
  const src = scene.textures.get(key).getSourceImage();
  return { key, art: key !== fallback, size: Math.max(src.width, src.height, 1) };
}

// --- Particules : une recette = un émetteur réutilisé par scène -------------
// `size` : taille à l'écran (px) ; `scale`/`alpha` : facteurs de début/fin
// (fixes par recette) ; `speed`, `angle` (degrés, 0 = droite, 90 = bas),
// `lifespan`, `tint` : valeurs par défaut, modifiables à chaque appel
// (calculées à l'émission seulement : sans effet sur les particules déjà là).
// Teinte : les images Codex sont déjà colorées -> `artTint` (défaut : aucune)
// ; seules celles livrées en blanc pour être teintées (`tintArt: true` :
// grain de lumière, bulle) prennent la teinte de l'appel, comme le repli.
const FX_PARTICLES = {
  dust: {
    art: 'fx_bouffee_poussiere', tex: 'juice-puff', size: 24, depth: 'front', artTint: [0xc9b8f5, 0xb9a9e9],
    lifespan: [360, 620], speed: [20, 90], angle: [190, 350], gravityY: -30,
    scale: [0.55, 1.4], alpha: [0.62, 0], tint: [0xd8ccf5, 0xb9a9d9, 0xece6fa], spin: true,
  },
  smoke: {
    art: null, tex: 'juice-puff', size: 30, depth: 'front',
    lifespan: [420, 720], speed: [30, 110], angle: [0, 360], gravityY: -50,
    scale: [0.6, 1.6], alpha: [0.6, 0], tint: [0x8a78c0, 0x6a5a9a, 0xb4a6e0], spin: true,
  },
  spark: {
    art: 'fx_etincelle', tex: 'juice-spark', size: 20, depth: 'front', add: true,
    lifespan: [180, 360], speed: [200, 480], angle: [0, 360], gravityY: 300,
    scale: [1, 0.25], alpha: [1, 0], tint: [0xffffff, 0xe8fff2, 0x9fffd0, 0xffb3e0], alignToVelocity: true,
  },
  star: {
    art: 'fx_grain_lumiere', tex: 'juice-star', size: 12, depth: 'front', add: true, tintArt: true,
    lifespan: [420, 800], speed: [20, 90], angle: [0, 360], gravityY: -20,
    scale: [1, 0], alpha: [1, 0.2], tint: [0xffffff, 0x8fe3b8, 0xff9fc9], spin: true,
  },
  mote: {
    art: 'fx_grain_lumiere', tex: 'juice-dot', size: 12, depth: 'front', add: true, tintArt: true,
    lifespan: [700, 1300], speed: [10, 45], angle: [245, 295], gravityY: -40,
    scale: [1, 0.2], alpha: [0.95, 0], tint: [0x8fe3b8, 0xe8fff2, 0xff9fc9],
  },
  leaf: {
    art: 'fx_feuille', tex: 'juice-leaf', size: 12, depth: 'front',
    lifespan: [650, 1050], speed: [60, 190], angle: [0, 360], gravityY: 240,
    scale: [1, 0.8], alpha: [1, 0], tint: [0x6fbf5a, 0xa8e07a, 0x4f9a48], spin: true,
  },
  feather: {
    art: null, tex: 'juice-feather', size: 15, depth: 'behind',
    lifespan: [900, 1500], speed: [15, 70], angle: [0, 360], gravityY: 50,
    scale: [1, 0.7], alpha: [0.9, 0], tint: [0xf3ecff, 0xd9cff0, 0xfff6e0], spin: true,
  },
  chip: {
    art: 'fx_eclat_mousse', tex: 'juice-chip', size: 9, depth: 'front',
    lifespan: [450, 800], speed: [130, 330], angle: [200, 340], gravityY: 760,
    scale: [1, 0.7], alpha: [1, 0], tint: [0x6fae3a, 0x9bff5a, 0x3e7a2c], spin: true,
  },
  clod: {
    art: 'fx_motte_mousse', tex: 'juice-chip', size: 15, depth: 'front',
    lifespan: [500, 850], speed: [100, 260], angle: [215, 325], gravityY: 820,
    scale: [1, 0.8], alpha: [1, 0], tint: [0x2f5a2a, 0x3e7a2c, 0x24451f], spin: true,
  },
  earth: {
    art: 'fx_motte_terre', tex: 'juice-chip', size: 10, depth: 'front',
    lifespan: [400, 700], speed: [110, 280], angle: [210, 330], gravityY: 820,
    scale: [1, 0.7], alpha: [1, 0], tint: [0x5a4630, 0x7a5f40, 0x3d2f22], spin: true,
  },
  ember: {
    art: 'fx_braise', tex: 'juice-dot', size: 6, depth: 'front', add: true,
    lifespan: [700, 1300], speed: [15, 55], angle: [250, 290], gravityY: -55,
    scale: [1, 0.3], alpha: [1, 0], tint: [0xffc36b, 0xff9a3c, 0xffe29a],
  },
  drop: {
    art: 'fx_goutte_toxique', tex: 'juice-drop', size: 7, depth: 'front',
    lifespan: [450, 750], speed: [20, 90], angle: [60, 120], gravityY: 620,
    scale: [1, 0.8], alpha: [1, 0], tint: [0x9bff5a, 0x6fdc3a],
  },
  bubble: {
    art: 'fx_bulle', tex: 'juice-ring', size: 10, depth: 'front', tintArt: true,
    lifespan: [600, 1000], speed: [15, 50], angle: [245, 295], gravityY: -70,
    scale: [0.6, 1.25], alpha: [0.9, 0], tint: [0xff9fc9, 0xffd0e6, 0xd0b060],
  },
  streak: {
    art: 'fx_trait_vent', tex: 'juice-streak', size: 34, depth: 'behind', add: true,
    lifespan: [180, 280], speed: [0, 30], angle: [0, 0], gravityY: 0,
    scale: [1, 0.6], alpha: [0.55, 0], tint: [0xffffff, 0xd8ccf5],
  },
  petal: {
    art: 'fx_petale_rose', tex: 'juice-leaf', size: 9, depth: 'front',
    lifespan: [800, 1300], speed: [40, 140], angle: [0, 360], gravityY: 120,
    scale: [1, 0.7], alpha: [1, 0], tint: [0xff9fc9, 0xffd0e6], spin: true,
  },
  wing: {
    art: 'fx_etincelle_papillon', tex: 'juice-star', size: 9, depth: 'front', add: true,
    lifespan: [320, 560], speed: [20, 110], angle: [0, 360], gravityY: 40,
    scale: [1, 0.1], alpha: [1, 0], tint: [0x9ff3ff, 0x6fd8ff, 0xffb3f0, 0xfff6a0],
  },
  // Interface (fixées à l'écran) : éclats de cœur, étincelles de bandeau.
  uiShard: {
    art: null, tex: 'juice-chip', size: 6, depth: 'ui',
    lifespan: [380, 600], speed: [60, 170], angle: [200, 340], gravityY: 520,
    scale: [1, 0.6], alpha: [1, 0], tint: [0xff4d6d, 0xff9fc9, 0xffd1e1], spin: true,
  },
  uiStar: {
    art: null, tex: 'juice-star', size: 11, depth: 'ui', add: true,
    lifespan: [380, 700], speed: [30, 140], angle: [0, 360], gravityY: 0,
    scale: [1, 0], alpha: [1, 0.3], tint: [0xffffff, 0x8fe3b8, 0xff9fc9],
  },
};

const FX_DEPTHS = { behind: CHARACTER_DEPTH - 1, front: CHARACTER_DEPTH + 2, ui: 2300 };
// Plafond de particules VIVANTES par émetteur (les mortes sont recyclées).
const FX_MAX_ALIVE = 160;

function juiceFxState(scene) {
  if (!scene.__juiceFx) scene.__juiceFx = { emitters: {}, ghosts: [], ghostIdx: 0 };
  return scene.__juiceFx;
}

function juiceEmitter(scene, kind) {
  const st = juiceFxState(scene);
  let e = st.emitters[kind];
  if (e && e.scene) return e;
  const r = FX_PARTICLES[kind];
  if (!r) return null;
  const tex = juiceTexture(scene, r.art, r.tex);
  const base = r.size / tex.size;
  const cfg = {
    emitting: false,
    lifespan: { min: r.lifespan[0], max: r.lifespan[1] },
    speed: { min: r.speed[0], max: r.speed[1] },
    angle: { min: r.angle[0], max: r.angle[1] },
    gravityY: r.gravityY || 0,
    scale: { start: r.scale[0] * base, end: r.scale[1] * base },
    alpha: { start: r.alpha[0], end: r.alpha[1] },
    tint: r.tint,
    maxAliveParticles: FX_MAX_ALIVE,
    blendMode: r.add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL,
  };
  if (r.alignToVelocity) cfg.rotate = { onEmit: (p) => Phaser.Math.RadToDeg(Math.atan2(p.velocityY, p.velocityX)) };
  else if (r.spin) cfg.rotate = { min: 0, max: 360 };
  if (tex.art && !r.tintArt) cfg.tint = r.artTint ?? 0xffffff;
  e = scene.add.particles(0, 0, tex.key, cfg).setDepth(FX_DEPTHS[r.depth] ?? FX_DEPTHS.front);
  if (r.depth === 'ui') e.setScrollFactor(0);
  e.__recipe = r;
  e.__fixedTint = tex.art && !r.tintArt ? (r.artTint ?? 0xffffff) : null;
  st.emitters[kind] = e;
  return e;
}

// Émet `count` particules de la recette `kind` en (x, y). opts : count,
// angle [min, max], speed [min, max] ou `power` (multiplie la vitesse),
// lifespan [min, max], tint (couleur ou tableau), spread (px autour du point).
function juiceParticles(scene, kind, x, y, opts = {}) {
  if (!scene || !scene.add || !scene.sys || !scene.sys.isActive()) return null;
  const e = juiceEmitter(scene, kind);
  if (!e) return null;
  const r = e.__recipe;
  const power = opts.power ?? 1;
  const sp = opts.speed || r.speed;
  const ang = opts.angle || r.angle;
  e.setEmitterAngle({ min: ang[0], max: ang[1] });
  e.setParticleSpeed({ min: sp[0] * power, max: sp[1] * power });
  const life = opts.lifespan || r.lifespan;
  e.setParticleLifespan({ min: life[0], max: life[1] });
  if (e.__fixedTint !== null) e.setParticleTint(e.__fixedTint);
  else e.setParticleTint(opts.tint !== undefined && opts.tint !== null ? opts.tint : r.tint);
  const count = Math.max(0, Math.round(opts.count ?? 6));
  const spread = opts.spread || 0;
  if (!spread) {
    e.explode(count, x, y);
  } else {
    for (let i = 0; i < count; i++) e.explode(1, x + Phaser.Math.FloatBetween(-spread, spread), y + Phaser.Math.FloatBetween(-spread / 2, spread / 2));
  }
  return e;
}

// Image unique qui grandit et s'efface. `kind` : 'ring' (anneau dessiné) |
// 'glow' (halo, art fx_halo_doux) | 'rays' (art fx_halo_rayons) | 'item'
// (art fx_halo_objet). `flat` : aplatissement vertical (onde au sol).
function juiceBurstImage(scene, kind, x, y, { size = 80, from = 0.3, to = 1, ms = 380, color = 0xffffff, alpha = 0.9, depth, ui = false, flat = 1, ease = 'Cubic.easeOut' } = {}) {
  if (!scene || !scene.add) return null;
  const arts = { ring: null, glow: 'fx_halo_doux', rays: 'fx_halo_rayons', item: 'fx_halo_objet' };
  const tex = juiceTexture(scene, arts[kind], kind === 'ring' ? 'juice-ring' : 'juice-glow');
  const img = scene.add.image(x, y, tex.key).setTint(color).setAlpha(alpha)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(depth ?? (ui ? FX_DEPTHS.ui : FX_DEPTHS.front));
  if (ui) img.setScrollFactor(0);
  const k = size / tex.size;
  img.setScale(k * from, k * from * flat);
  scene.tweens.add({
    targets: img, scaleX: k * to, scaleY: k * to * flat, alpha: 0, duration: ms, ease,
    onComplete: () => img.destroy(),
  });
  return img;
}

// Anneau de choc : art `vfx_anneau_choc` (anim 'talisman' ou 'toxique') s'il
// existe, sinon anneau dessiné.
function juiceShockRing(scene, x, y, { size = 120, color = 0xe8fff2, ms = 420, variant = 'talisman', flat = 1, depth } = {}) {
  if (typeof hasManifestArt === 'function' && hasManifestArt(scene, 'vfx_anneau_choc', variant)) {
    const fx = addManifestSprite(scene, x, y, 'vfx_anneau_choc', variant, { origin: [0.5, 0.5] })
      .setDepth(depth ?? FX_DEPTHS.front).setBlendMode(Phaser.BlendModes.ADD);
    const k = size / Math.max(fx.width, 1);
    fx.setScale(k, k * flat);
    fx.once('animationcomplete', () => fx.destroy());
    scene.time.delayedCall(ms + 800, () => { if (fx.active) fx.destroy(); });
    return fx;
  }
  return juiceBurstImage(scene, 'ring', x, y, { size, color, ms, from: 0.2, to: 1, alpha: 0.85, flat, depth });
}

// Silhouette fantôme (traînée) : copie de la frame courante, d'une couleur
// unie, qui s'efface.
// Réserve de 8 images par scène, réutilisées (aucune création en continu).
const JUICE_GHOST_POOL = 8;
function juiceGhost(scene, sprite, { tint = 0x9a7dff, alpha = 0.38, ms = 200, add = true } = {}) {
  if (!sprite || !sprite.active || !sprite.frame || !sprite.visible) return;
  const st = juiceFxState(scene);
  st.ghostIdx = (st.ghostIdx + 1) % JUICE_GHOST_POOL;
  let g = st.ghosts[st.ghostIdx];
  if (!g || !g.scene) {
    g = scene.add.image(0, 0, sprite.texture.key, sprite.frame.name);
    st.ghosts[st.ghostIdx] = g;
  }
  scene.tweens.killTweensOf(g);
  g.setTexture(sprite.texture.key, sprite.frame.name)
    .setOrigin(sprite.originX, sprite.originY)
    .setPosition(sprite.x, sprite.y)
    .setScale(sprite.scaleX, sprite.scaleY)
    .setFlip(sprite.flipX, sprite.flipY)
    .setRotation(sprite.rotation)
    .setDepth(sprite.depth - 1)
    // Silhouette pleine de la couleur (les formes sont sombres : une simple
    // teinte additive ne se verrait pas) -> contour lumineux façon DA.
    .setTintFill(tint)
    .setBlendMode(add ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL)
    .setAlpha(alpha)
    .setVisible(true);
  scene.tweens.add({ targets: g, alpha: 0, duration: ms, ease: 'Quad.easeOut', onComplete: () => g.setVisible(false) });
}

// --- Effets composés : spawnFx(scene, kind, x, y, opts) ---------------------
//   'land' {power 0..1}            poussière des deux côtés des pieds
//   'step' {dir, power}            petite bouffée derrière les pieds (course)
//   'turn' {dir}                   bouffée devant (demi-tour)
//   'impact' {power, angle}        étincelles + éclat (coup qui porte)
//   'wallHit' {dir}                étincelles + poussière contre un obstacle
//   'poof' {size}                  nuage violet + lueurs (ennemi vaincu)
//   'leaves' {count, power, angle} gerbe de feuilles (lianes, singe)
//   'feathers' {count}             plumes (aigle)
//   'transform' {color, size}      halo + anneau + étoiles (changement de forme)
//   'slam' {size}                  fracas au sol (ours)
//   'embers' {count} / 'crackle'   braises du feu de camp / gerbe d'étincelles
//   'mossBreak' {w, h} / 'melt' {w, h}   mousse qui éclate / qui fond
//   'pickup' {color} / 'glint'     objet ramassé / petite étoile qui scintille
//   'motes' {count, color, spread} lueurs qui montent (totem, lanterne)
//   'heal' {count}                 lueurs douces (soin)
//   'wingDust' {count}             poussière d'ailes (papillon)
//   'streaks' {dir, count}         traits de vitesse
//   ou le nom d'une recette de FX_PARTICLES (opts de juiceParticles).
// Toujours sans effet sur le jeu.
function spawnFx(scene, kind, x, y, opts = {}) {
  if (!scene || !scene.add || !scene.sys || !scene.sys.isActive()) return;
  const dir = opts.dir >= 0 ? 1 : -1;
  const power = Phaser.Math.Clamp(opts.power ?? 1, 0, 2);
  switch (kind) {
    case 'land': {
      const n = Math.round(2 + 7 * power);
      const life = [300, 520 + 200 * power];
      juiceParticles(scene, 'dust', x - 10, y - 4, { count: Math.ceil(n / 2), angle: [182, 215], power: 0.6 + power, lifespan: life });
      juiceParticles(scene, 'dust', x + 10, y - 4, { count: Math.ceil(n / 2), angle: [325, 358], power: 0.6 + power, lifespan: life });
      if (power > 0.6) juiceParticles(scene, 'earth', x, y - 2, { count: Math.round(3 * power), power: 0.6 });
      break;
    }
    case 'step':
      juiceParticles(scene, 'dust', x - dir * 10, y - 3, { count: opts.count ?? 1, angle: dir > 0 ? [190, 230] : [310, 350], power: 0.5 * power + 0.3, lifespan: [260, 420] });
      break;
    case 'turn':
      juiceParticles(scene, 'dust', x + dir * 12, y - 3, { count: 3, angle: dir > 0 ? [300, 345] : [195, 240], power: 0.9, lifespan: [280, 460] });
      break;
    case 'impact':
      juiceParticles(scene, 'spark', x, y, { count: Math.round(6 + 6 * power), angle: opts.angle || [0, 360], power: 0.7 + 0.5 * power });
      juiceBurstImage(scene, 'glow', x, y, { size: 60 + 36 * power, from: 0.4, to: 1, ms: 190, color: opts.color ?? 0xe8fff2, alpha: 0.9 });
      if (power >= 1) juiceShockRing(scene, x, y, { size: 70 + 40 * power, ms: 260, color: opts.color ?? 0xe8fff2 });
      break;
    case 'wallHit':
      juiceParticles(scene, 'spark', x, y, { count: 6, angle: dir > 0 ? [140, 220] : [-40, 40], power: 0.7 });
      juiceParticles(scene, 'dust', x, y, { count: 3, angle: dir > 0 ? [150, 210] : [-30, 30], power: 0.6 });
      juiceParticles(scene, 'earth', x, y, { count: 2, power: 0.5 });
      break;
    case 'poof': {
      const s = opts.size ?? 1;
      juiceParticles(scene, 'smoke', x, y, { count: Math.round(7 * s), power: s, spread: 10 * s });
      juiceParticles(scene, 'mote', x, y, { count: Math.round(6 * s), spread: 14 * s, tint: [0xff9fc9, 0x8fe3b8, 0xc77dff] });
      juiceShockRing(scene, x, y, { size: 60 * s, ms: 300, color: 0xc77dff });
      break;
    }
    case 'leaves':
      juiceParticles(scene, 'leaf', x, y, { count: opts.count ?? 7, power, angle: opts.angle, spread: opts.spread });
      break;
    case 'feathers':
      juiceParticles(scene, 'feather', x, y, { count: opts.count ?? 4, power, spread: 8 });
      break;
    case 'transform': {
      const color = opts.color ?? 0x8fe3b8;
      const s = opts.size ?? 1;
      juiceBurstImage(scene, 'glow', x, y, { size: 90 * s, from: 0.3, to: 1.1, ms: 260, color, alpha: 0.75 });
      juiceShockRing(scene, x, y, { size: 96 * s, ms: 320, color });
      juiceParticles(scene, 'star', x, y, { count: Math.round(8 * s), tint: [color, 0xffffff, 0xff9fc9], power: 1.2 * s });
      break;
    }
    case 'slam': {
      const s = opts.size ?? 1;
      juiceParticles(scene, 'dust', x - 20, y - 4, { count: Math.round(6 * s), angle: [180, 200], power: 2.2 * s, lifespan: [420, 760] });
      juiceParticles(scene, 'dust', x + 20, y - 4, { count: Math.round(6 * s), angle: [340, 360], power: 2.2 * s, lifespan: [420, 760] });
      juiceParticles(scene, 'earth', x, y - 4, { count: Math.round(8 * s), power: 1.2 });
      juiceShockRing(scene, x, y - 6, { size: 230 * s, ms: 380, color: 0xffe2b0, flat: 0.28 });
      break;
    }
    case 'embers':
      juiceParticles(scene, 'ember', x, y, { count: opts.count ?? 2, spread: opts.spread ?? 10 });
      break;
    case 'crackle':
      juiceParticles(scene, 'ember', x, y, { count: opts.count ?? 6, speed: [60, 150], angle: [235, 305], spread: 6, lifespan: [400, 800] });
      break;
    case 'mossBreak': {
      const w = opts.w || 96;
      const h = opts.h || 96;
      const n = Phaser.Math.Clamp(Math.round((w * h) / 900), 8, 26);
      juiceParticles(scene, 'chip', x, y, { count: n, spread: w / 3, power: 1.1 });
      juiceParticles(scene, 'clod', x, y, { count: Math.round(n / 2), spread: w / 3 });
      juiceParticles(scene, 'drop', x, y, { count: Math.round(n / 3), spread: w / 2, angle: [200, 340], speed: [60, 200] });
      juiceParticles(scene, 'dust', x, y + h / 2 - 6, { count: 8, spread: w / 2, angle: [190, 350], power: 1.4, tint: [0x6f8f5a, 0x9bbf7a, 0x4f6a43] });
      juiceShockRing(scene, x, y, { size: Math.max(w, h) * 1.3, ms: 340, color: 0x9bff5a, variant: 'toxique' });
      break;
    }
    case 'melt': {
      const w = opts.w || 96;
      const h = opts.h || 192;
      juiceParticles(scene, 'drop', x, y - h / 2, { count: opts.count ?? 4, spread: w / 2 });
      juiceParticles(scene, 'bubble', x, y, { count: opts.count ?? 3, spread: w / 2 });
      break;
    }
    case 'pickup': {
      const color = opts.color ?? 0x8fe3b8;
      juiceParticles(scene, 'star', x, y, { count: 10, power: 1.4, tint: [color, 0xffffff, 0xff9fc9] });
      juiceShockRing(scene, x, y, { size: 70, ms: 300, color });
      juiceBurstImage(scene, 'glow', x, y, { size: 70, from: 0.4, to: 1.2, ms: 260, color, alpha: 0.7 });
      break;
    }
    case 'glint':
      juiceParticles(scene, 'star', x, y, { count: 1, speed: [0, 8], lifespan: [380, 520], tint: opts.tint ?? 0xffffff });
      break;
    case 'motes':
      juiceParticles(scene, 'mote', x, y, { count: opts.count ?? 3, spread: opts.spread ?? 12, tint: opts.color, power });
      break;
    case 'heal':
      juiceParticles(scene, 'mote', x, y, { count: opts.count ?? 8, spread: 16, tint: [0xfff6c2, 0x9ffcff, 0xffb6e8, 0xd8ffb0] });
      break;
    case 'wingDust':
      juiceParticles(scene, 'wing', x, y, { count: opts.count ?? 4, spread: opts.spread ?? 6, power });
      break;
    case 'streaks':
      juiceParticles(scene, 'streak', x, y, { count: opts.count ?? 2, spread: opts.spread ?? 16, angle: dir > 0 ? [180, 180] : [0, 0], speed: [40, 90] });
      break;
    default:
      juiceParticles(scene, kind, x, y, opts);
  }
}

// --- Combat : retour de chaque coup porté (appelé par damageEnemy) ----------
// Hit-stop 35-70 ms et secousse dosés selon la force du coup, étincelles au
// point d'impact, flash blanc et recul (dessin seulement) de l'ennemi touché,
// « poof » de défaite. Jamais de changement de PV, de vitesse ou de hitbox.
const JUICE_HIT_PROFILES = {
  melee: { stop: 55, shake: 'light', power: 0.9 },
  dive: { stop: 40, shake: 'light', power: 0.8 },
  feather: { stop: 35, shake: 'tiny', power: 0.6 },
  pierre: { stop: 45, shake: 'tiny', power: 0.7 },
  skill: { stop: 70, shake: 'medium', power: 1.4 },
};

function juiceOnEnemyHit(scene, enemy, source = {}) {
  if (!scene || !enemy || !scene.sys || !scene.sys.isActive()) return;
  const isProjectile = source instanceof Phaser.GameObjects.GameObject;
  const kind = source.kind === 'skill' || source.skillId ? 'skill' : (source.kind || (isProjectile ? 'pierre' : 'melee'));
  const prof = JUICE_HIT_PROFILES[kind] || JUICE_HIT_PROFILES.melee;
  const killed = !!enemy.defeated && !enemy.healed;
  let b = null;
  try { b = enemy.getBounds(); } catch (e) { b = null; }
  // Point d'impact : centre de l'intersection coup / ennemi, sinon le bord
  // de l'ennemi côté joueur (projectiles : leur position).
  const player = (!isProjectile && source.player) || scene.player;
  let ix = b ? b.centerX : enemy.x;
  let iy = b ? b.centerY : enemy.y;
  const hitRect = !isProjectile && (source.rect || (kind === 'melee' && player && player.getAttackHitbox ? player.getAttackHitbox() : null));
  if (b && hitRect) {
    const r = Phaser.Geom.Rectangle.Intersection(hitRect, b);
    if (r.width > 0 && r.height > 0) { ix = r.centerX; iy = r.centerY; }
  } else if (b && player) {
    ix = Phaser.Math.Clamp(player.x, b.x, b.right);
  }
  if (typeof source.x === 'number' && kind !== 'melee') { ix = source.x; iy = source.y; }
  const from = player ? (enemy.x >= player.x ? 1 : -1) : 1;
  juiceHitStop(scene, killed ? prof.stop + 15 : prof.stop);
  juiceShake(scene, killed && prof.shake === 'light' ? 'medium' : prof.shake);
  spawnFx(scene, 'impact', ix, iy, { power: prof.power + (killed ? 0.3 : 0), angle: kind === 'skill' ? null : (from > 0 ? [-60, 60] : [120, 240]) });
  playSfx(killed ? 'enemy_defeat' : 'enemy_hit', { kind });
  if (!enemy.active) return;
  // Flash blanc si l'ennemi ne s'en charge pas déjà (corrompus, loup alpha…).
  if (!(enemy.isTinted && enemy.tintFill)) juiceFlash(enemy, 0xffffff, killed ? 90 : 70);
  juiceRecoil(enemy, from * (killed ? 10 : 7), -2, 150);
  juiceSquash(enemy, 1.12, 0.9, 170);
  if (killed) {
    // Le poof part pendant que l'ennemi disparaît (fondu ~200 ms).
    const cx = b ? b.centerX : enemy.x;
    const cy = b ? b.centerY : enemy.y;
    const size = b ? Phaser.Math.Clamp(Math.max(b.width, b.height) / 60, 0.7, 2) : 1;
    scene.time.delayedCall(110, () => spawnFx(scene, 'poof', cx, cy, { size }));
  }
}

// --- Caméra : regard en avant dans le sens de la course ---------------------
// Décalage horizontal doux (followOffset) vers l'avant d'Agarica, plus marqué
// en courant ; ne touche jamais au vertical (caméra de zone). En pause pendant
// une cinématique qui a pris la caméra, monde gelé, ou si la zone règle
// elle-même `camera.lookAheadX`.
const JUICE_LOOK_AHEAD = 46;

function juiceUpdateCameraLook(scene, dt) {
  const cam = scene.cameras.main;
  const p = scene.player;
  if (!p || !p.active || !p.body || cam._follow !== p || scene.__cameraDetached) return;
  if (cam.panEffect && cam.panEffect.isRunning) return;
  const zc = scene.__zoneCamera;
  if (zc && zc.cfg && zc.cfg.lookAheadX) return;
  if (typeof isWorldFrozen === 'function' && isWorldFrozen(scene)) return;
  const vx = p.body.velocity.x;
  const facing = p.facingDir >= 0 ? 1 : -1;
  const run = Phaser.Math.Clamp((Math.abs(vx) - 30) / 330, 0, 1);
  const want = -facing * JUICE_LOOK_AHEAD * (0.3 + 0.7 * run);
  const k = 1 - Math.exp(-dt * (run > 0.2 ? 1.8 : 1.1));
  cam.followOffset.x += (want - cam.followOffset.x) * k;
}

// --- Vie ambiante : lucioles (nuit) et papillons (jour) ---------------------
// Clé de zone optionnelle `ambientLife: false | { fireflies: n, butterflies: n }`
// (défaut selon le fond : lucioles la nuit, quelques papillons le jour).
// Nombre fixe d'objets par visite (pas d'émission continue).
const JUICE_DAY_BACKGROUNDS = ['fond_bosquet', 'fond_foret_flottante'];

function juiceAddAmbientLife(scene, data) {
  if (data.decor === false || data.ambientLife === false) return;
  const cfg = data.ambientLife && typeof data.ambientLife === 'object' ? data.ambientLife : {};
  const bg = zoneBackgroundId(data);
  const day = JUICE_DAY_BACKGROUNDS.includes(bg);
  const lw = scene.levelWidth || scene.scale.width;
  const rnd = new Phaser.Math.RandomDataGenerator([`ambiant-${lw}-${bg}`]);
  const nFire = cfg.fireflies ?? (day ? 3 : Phaser.Math.Clamp(Math.round(lw / 190), 6, 30));
  const tex = juiceTexture(scene, 'fx_luciole', 'juice-dot');
  const colors = [0xd8ffb0, 0x8fe3b8, 0xfff6a0, 0xd8ffb0, 0xffb3e0];
  for (let i = 0; i < nFire; i++) {
    const x = rnd.between(30, Math.max(31, lw - 30));
    const ground = groundStandYAt(scene, x, 448);
    const y = (ground ?? 440) - rnd.between(24, 190);
    const front = rnd.frac() < 0.25;
    const size = front ? rnd.between(9, 13) : rnd.between(5, 8);
    const f = scene.add.image(x, y, tex.key).setBlendMode(Phaser.BlendModes.ADD)
      .setTint(tex.art ? 0xffffff : colors[i % colors.length]).setScale((size * (tex.art ? 2.2 : 1)) / tex.size).setAlpha(0)
      .setDepth(front ? DECOR_FOREGROUND_DEPTH - 3 : CHARACTER_DEPTH - 2);
    scene.tweens.add({
      targets: f, x: x + rnd.between(-60, 60), y: y + rnd.between(-30, 30),
      duration: rnd.between(3200, 6400), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd.between(0, 2000),
    });
    scene.tweens.add({
      targets: f, alpha: { from: 0.08, to: front ? 0.55 : 0.85 },
      duration: rnd.between(900, 2200), yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: rnd.between(0, 2500),
    });
  }
  const hasButterflies = (data.animals || []).some((a) => a && a.type === 'papillons');
  const nBut = cfg.butterflies ?? (day && !hasButterflies ? Phaser.Math.Clamp(Math.round(lw / 900), 2, 5) : 0);
  if (nBut > 0 && typeof spawnButterflies === 'function') {
    for (let i = 0; i < nBut; i++) {
      const x = rnd.between(200, Math.max(220, lw - 200));
      const ground = groundStandYAt(scene, x, 448);
      spawnButterflies(scene, x, (ground ?? 440) - rnd.between(50, 120), 1, { radius: 70, scale: 0.8, depth: CHARACTER_DEPTH - 1 });
    }
  }
}

// --- Entrée / sortie de zone ------------------------------------------------
// Fondu plus doux : voile à courbe adoucie (au lieu du fondu linéaire de la
// caméra) et léger « posé » de la caméra (zoom 1,03 → 1) à l'arrivée. La
// sortie garde sa durée (FADE_DURATION) : une cinématique qui finit par un
// changement de zone ne change pas de rythme.
const JUICE_FADE_IN_MS = 460;
const JUICE_VEIL_DEPTH = 9500;

function juiceFadeIn(scene, { ms = JUICE_FADE_IN_MS, zoom = 0 } = {}) {
  const { width, height } = scene.scale;
  const veil = scene.add.rectangle(0, 0, width, height, 0x0d0b1a, 1).setOrigin(0).setScrollFactor(0).setDepth(JUICE_VEIL_DEPTH);
  scene.tweens.add({ targets: veil, alpha: 0, duration: ms, ease: 'Sine.easeOut', onComplete: () => veil.destroy() });
  const cam = scene.cameras.main;
  if (zoom && cam) {
    cam.setZoom(zoom);
    scene.tweens.add({ targets: cam, zoom: 1, duration: ms + 260, ease: 'Sine.easeOut', onComplete: () => cam.setZoom(1) });
  }
}

function juiceFadeOut(scene, ms, onDone) {
  const { width, height } = scene.scale;
  const veil = scene.add.rectangle(0, 0, width, height, 0x0d0b1a, 1).setOrigin(0).setScrollFactor(0)
    .setDepth(JUICE_VEIL_DEPTH).setAlpha(0);
  scene.tweens.add({ targets: veil, alpha: 1, duration: ms, ease: 'Sine.easeIn', onComplete: onDone });
  const cam = scene.cameras.main;
  if (cam && Math.abs(cam.zoom - 1) < 0.001) scene.tweens.add({ targets: cam, zoom: 1.025, duration: ms, ease: 'Sine.easeIn' });
}

// Remise à zéro par visite (instance de scène réutilisée) + crochet caméra +
// vie ambiante. Appelée à la fin de buildLevelFromData.
function juiceSetupLevel(scene, data) {
  juiceTimeState(scene);
  juiceResetTime(scene);
  if (!scene.__juiceCameraHook) {
    scene.__juiceCameraHook = true;
    scene.events.on('postupdate', (time, delta) => {
      if (scene !== currentLevelScene || !scene.player) return;
      juiceUpdateCameraLook(scene, Math.min(delta || 16, 50) / 1000);
    });
  }
  try { juiceAddAmbientLife(scene, data); } catch (e) { console.warn('juiceAddAmbientLife', e); }
}

// --- HUD : cœurs qui tremblent puis se vident, énergie qui se remplit -------
// État par visite (scene.__hudFx) ; lu par drawHud (repli dessiné) et par
// storyDrawHudArt (StoryKit, cœurs Codex).
const JUICE_HEART_SHAKE_MS = 220;
const JUICE_HEART_EMPTY_MS = 300;
const JUICE_HEART_GAIN_MS = 300;

function juiceHudState(scene) {
  const p = scene.player;
  let st = scene.__hudFx;
  if (!st || st.player !== p) {
    st = {
      player: p, hearts: p.hearts, fx: [], energyShown: p.energy, energyTrail: p.energy,
      trailHoldUntil: 0, lastEnergy: p.energy, denyAt: -Infinity, fullAt: -Infinity, skillPop: [],
    };
    scene.__hudFx = st;
  }
  return st;
}

// Appelée une fois par image par drawHud : détecte les changements.
function juiceHudUpdate(scene) {
  const p = scene.player;
  const st = juiceHudState(scene);
  const now = scene.time.now;
  if (p.hearts < st.hearts) {
    for (let i = Math.max(0, p.hearts); i < st.hearts; i++) st.fx[i] = { kind: 'lost', t0: now, burst: false };
    playSfx('heart_lost');
  } else if (p.hearts > st.hearts) {
    // Cœurs rendus au feu de camp : l'animation attend la fermeture du menu
    // (sinon elle se jouerait cachée dessous).
    if (scene.scene.isActive('CampfireMenuScene')) return st;
    for (let i = Math.max(0, st.hearts); i < p.hearts; i++) st.fx[i] = { kind: 'gain', t0: now + (i - st.hearts) * 80, burst: false };
  }
  st.hearts = p.hearts;
  // Énergie : la barre monte en douceur ; une dépense la fait tomber net,
  // avec une traîne pâle qui suit après un court instant.
  const dt = Math.min(scene.game.loop.delta || 16, 50) / 1000;
  const e = p.energy;
  if (e < st.lastEnergy) st.trailHoldUntil = now + 260;
  if (e >= p.maxEnergy && st.lastEnergy < p.maxEnergy) { st.fullAt = now; playSfx('energy_full'); }
  st.lastEnergy = e;
  if (st.energyShown < e) st.energyShown = Math.min(e, st.energyShown + Math.max(20, (e - st.energyShown) * 6) * dt);
  else st.energyShown = e;
  if (st.energyTrail < st.energyShown) st.energyTrail = st.energyShown;
  else if (now > st.trailHoldUntil) st.energyTrail = Math.max(st.energyShown, st.energyTrail - Math.max(30, (st.energyTrail - st.energyShown) * 5) * dt);
  return st;
}

// État visuel du cœur i : { full, dx, dy, scale, flash } (+ éclats au bon moment).
function juiceHudHeart(scene, i, cx, cy) {
  const st = scene.__hudFx;
  const p = scene.player;
  const base = { full: i < p.hearts, dx: 0, dy: 0, scale: 1, flash: 0 };
  const f = st && st.fx[i];
  if (!f) return base;
  const t = scene.time.now - f.t0;
  if (f.kind === 'lost') {
    if (t < JUICE_HEART_SHAKE_MS) {
      const k = t / JUICE_HEART_SHAKE_MS;
      return { full: true, dx: Math.sin(t * 0.12) * 3.5 * (1 - k), dy: 0, scale: 1 + 0.18 * Math.sin(k * Math.PI), flash: 1 - k };
    }
    if (!f.burst) {
      f.burst = true;
      spawnFx(scene, 'uiShard', cx, cy, { count: 7 });
    }
    const k = (t - JUICE_HEART_SHAKE_MS) / JUICE_HEART_EMPTY_MS;
    if (k >= 1) { st.fx[i] = null; return base; }
    return { full: false, dx: 0, dy: 0, scale: 0.72 + 0.28 * Phaser.Math.Easing.Back.Out(k), flash: 0 };
  }
  if (t < 0) return { ...base, full: false };
  if (!f.burst) {
    f.burst = true;
    spawnFx(scene, 'uiStar', cx, cy, { count: 4, power: 0.7 });
  }
  const k = t / JUICE_HEART_GAIN_MS;
  if (k >= 1) { st.fx[i] = null; return base; }
  return { full: true, dx: 0, dy: 0, scale: 0.5 + 0.5 * Phaser.Math.Easing.Back.Out(k), flash: 1 - k };
}

// Refus visuel (compétence sans assez d'énergie) : la barre tremble, liseré rouge.
function juiceHudDeny(scene) {
  if (!scene || !scene.player || !scene.hudGraphics) return;
  juiceHudState(scene).denyAt = scene.time.now;
  playSfx('skill_denied');
}

// Icône de compétence qui « saute » quand la compétence part.
function juiceHudSkillPop(scene, slotIndex) {
  if (!scene || !scene.player || !scene.hudGraphics) return;
  juiceHudState(scene).skillPop[slotIndex] = scene.time.now;
}

function juiceHudSkillScale(scene, i) {
  const st = scene.__hudFx;
  const t0 = st && st.skillPop[i];
  if (t0 == null) return 1;
  const t = (scene.time.now - t0) / 260;
  if (t >= 1 || t < 0) return 1;
  return 1 + 0.28 * Math.sin(t * Math.PI) * (1 - t * 0.4);
}

// Barre d'énergie : fond, traîne pâle, remplissage lissé, reflet, pointe
// lumineuse pendant qu'elle monte, lueur qui respire quand elle est pleine.
function juiceDrawEnergyBar(scene, g, x, y, w, h) {
  const p = scene.player;
  const st = scene.__hudFx || juiceHudState(scene);
  const now = scene.time.now;
  const dk = (now - st.denyAt) / 260;
  const deny = dk < 1 ? Math.sin(dk * Math.PI * 4) * 3 * (1 - dk) : 0;
  const bx = x + deny;
  g.fillStyle(0x2a1f45, 1);
  g.fillRoundedRect(bx, y, w, h, 4);
  const max = Math.max(1, p.maxEnergy);
  const trail = Phaser.Math.Clamp(st.energyTrail / max, 0, 1);
  const shown = Phaser.Math.Clamp(st.energyShown / max, 0, 1);
  if (trail > shown + 0.002) {
    g.fillStyle(0xffe9f5, 0.45);
    g.fillRoundedRect(bx, y, Math.max(h, w * trail), h, 4);
  }
  if (shown > 0) {
    g.fillStyle(0x8fe3b8, 1);
    g.fillRoundedRect(bx, y, Math.max(h * 0.8, w * shown), h, 4);
    g.fillStyle(0xe8fff2, 0.35);
    g.fillRect(bx + 3, y + 1, Math.max(0, w * shown - 6), 2);
    if (st.energyShown < p.energy - 0.5) {
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(bx + w * shown, y + h / 2, h * 0.65);
    }
  }
  if (dk < 1) {
    g.lineStyle(2, 0xff4d6d, 0.9 * (1 - dk));
    g.strokeRoundedRect(bx - 1, y - 1, w + 2, h + 2, 5);
  }
  if (p.energy >= max) {
    const burst = Math.max(0, 1 - (now - st.fullAt) / 500);
    const breathe = 0.25 + 0.2 * Math.sin(now / 320);
    g.lineStyle(2, 0x8fe3b8, Math.min(1, breathe + burst));
    g.strokeRoundedRect(bx - 1.5, y - 1.5, w + 3, h + 3, 5);
  }
}

// Voile rouge sur les bords de l'écran (Agarica touchée), qui s'efface.
function juiceHurtVignette(scene, color = 0xff2a55) {
  if (!scene || !scene.add) return;
  const { width, height } = scene.scale;
  const d = 64;
  const a = 0.38;
  const g = scene.add.graphics().setScrollFactor(0).setDepth(1500);
  g.fillGradientStyle(color, color, color, color, a, a, 0, 0);
  g.fillRect(0, 0, width, d);
  g.fillGradientStyle(color, color, color, color, 0, 0, a, a);
  g.fillRect(0, height - d, width, d);
  g.fillGradientStyle(color, color, color, color, a, 0, a, 0);
  g.fillRect(0, 0, d, height);
  g.fillGradientStyle(color, color, color, color, 0, a, 0, a);
  g.fillRect(width - d, 0, d, height);
  scene.tweens.add({ targets: g, alpha: 0, duration: 450, ease: 'Quad.easeIn', onComplete: () => g.destroy() });
}

// Ouverture d'un écran par-dessus le jeu (sac, carte, feu de camp) : la
// caméra de l'overlay apparaît en fondu avec un léger rebond d'échelle.
function juiceOverlayIn(scene, { ms = 240 } = {}) {
  const cam = scene && scene.cameras && scene.cameras.main;
  if (!cam) return;
  cam.setAlpha(0).setZoom(0.96);
  scene.tweens.add({ targets: cam, alpha: 1, duration: ms * 0.7 });
  scene.tweens.add({ targets: cam, zoom: 1, duration: ms, ease: 'Back.Out', onComplete: () => cam.setZoom(1) });
  playSfx('overlay_open', { key: scene.scene && scene.scene.key });
}
