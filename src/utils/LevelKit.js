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

function addProceduralForest(scene, height, levelWidth, avoidRanges = []) {
  scatterAlongLevel(scene, levelWidth, avoidRanges, ARBRE_SPACING_MIN, ARBRE_SPACING_MAX, (x) => {
    const variant = Phaser.Math.Between(0, ARBRE_COUNT - 1);
    const scale = ARBRE_BASE_SCALE * Phaser.Math.FloatBetween(0.85, 1.15);
    scene.add.image(x, height - ARBRE_GROUND_CLEARANCE + ARBRE_SINK, `${ARBRE_TEXTURE_PREFIX}${variant}`)
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setFlipX(Math.random() < 0.5)
      // Retour utilisateur : "à partir d'une certaine hauteur du joueur les
      // arbres... montent avec moi alors qu'ils devraient rester à la même
      // hauteur en prenant en compte la caméra qui monte" -- l'ancien Y=0
      // (calé au bord bas de l'ÉCRAN, pas du MONDE) causait exactement ça :
      // tant que la caméra ne scrolle pas verticalement (juste après le
      // spawn, la quasi-totalité du jeu), Y=0 et Y=facteur rendent
      // IDENTIQUEMENT (screenY = worldY - scrollY*facteur = worldY quand
      // scrollY=0) -- mais dès que le joueur grimpe assez haut pour que la
      // caméra scrolle, Y=0 gardait les arbres figés à l'écran au lieu de
      // les laisser reculer avec le sol réel (scrollFactor par défaut,
      // jamais changé). Même facteur qu'en X (0.35) plutôt que 1 plein : ce
      // plan reste un arrière-plan lointain, doit continuer à parallaxer
      // plus lentement que le sol dans les DEUX axes, pas juste en X.
      .setScrollFactor(0.35);
  });
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

function addMoonlitDecor(scene, width, height, levelWidth, avoidRanges = []) {
  const coverWidth = Math.ceil(levelWidth * 1.4);
  const scale = height / DECOR_SOURCE_HEIGHT;

  scene.add.tileSprite(-100, 0, coverWidth, height, 'decor-plan4')
    .setOrigin(0, 0)
    .setTileScale(scale, scale)
    .setScrollFactor(0.08);

  addProceduralForest(scene, height, levelWidth, avoidRanges);
  addProceduralGroundPlants(scene, height, levelWidth, avoidRanges);
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

function fadeInScene(scene) {
  scene.cameras.main.fadeIn(FADE_DURATION, ...FADE_COLOR);
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
  scene.cameras.main.fadeOut(FADE_DURATION, ...FADE_COLOR);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
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
const TOTEM_GROUND_SINK = 16;

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
  const icon = scene.add.image(
    banner.x,
    banner.y + UNLOCK_POPUP_MEDALLION_OFFSET_Y * targetScale,
    `form-icon-${totemType}`,
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

  scene.tweens.add({
    targets: banner,
    alpha: 1,
    scale: targetScale,
    duration: UNLOCK_POPUP_FADE_IN_MS,
    ease: 'Back.Out',
    onComplete: () => {
      banner.play(ANIM_UNLOCK_POPUP_KEY);
      banner.once('animationcomplete', () => {
        scene.tweens.add({ targets: [icon, label], alpha: 1, duration: UNLOCK_POPUP_ICON_FADE_MS });
        scene.tweens.add({
          targets: [banner, icon, label],
          alpha: 0,
          duration: UNLOCK_POPUP_FADE_OUT_MS,
          delay: UNLOCK_POPUP_HOLD_MS,
          onComplete: () => {
            banner.destroy();
            icon.destroy();
            label.destroy();
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
function groundSurfaceYAt(scene, x, referenceY) {
  const groundGroup = scene.ground;
  if (!groundGroup) return null;
  let best = null;
  let bestDist = Infinity;
  groundGroup.children.iterate((tile) => {
    if (!tile || !tile.active) return;
    const half = tile.displayWidth / 2;
    if (x < tile.x - half || x > tile.x + half) return;
    const surfaceY = tile.y - tile.displayHeight / 2;
    const dist = Math.abs(surfaceY - referenceY);
    if (best === null || dist < bestDist) {
      best = surfaceY;
      bestDist = dist;
    }
  });
  return best;
}

// Idempotent : le flag protège contre un second déclenchement. Vérifié à
// chaque frame via `scene.events.on('update', ...)` plutôt qu'un collider
// dédié : pas besoin de toucher la boucle update() de chaque Zone*Scene.
function addAbilityShrine(scene, x, y, flagName, message, scale = TOTEM_SCALE) {
  const totemType = TOTEM_TYPE_BY_FLAG[flagName] || 'wolf';
  const alreadyHas = !!scene.registry.get(flagName);
  const textureKey = `totem-${totemType}-${alreadyHas ? 'dim' : 'lit'}`;

  // Cf. TOTEM_GROUND_SINK : `y` (déjà calé sur la limite de grille par
  // l'appelant) est légèrement enfoncé pour que le socle touche vraiment
  // l'herbe au lieu de flotter juste au-dessus.
  y += TOTEM_GROUND_SINK;
  const marker = scene.physics.add.staticSprite(x, y, textureKey);
  marker.setOrigin(0.5, 1);
  marker.setScale(scale);
  marker.body.updateFromGameObject();
  const plants = addTotemPlants(scene, x, y - TOTEM_GROUND_SINK, marker.displayWidth);
  sendBehindFrontGround(scene, [marker, ...plants]);

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
    if (scene.registry.get(flagName)) {
      prompt.setVisible(false);
      return;
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
    marker.setTexture(`totem-${totemType}-dim`);
    prompt.setVisible(false);
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
// Les bûches débordent sous le cadre découpé (marge de crop) : sans ça, le
// feu paraît posé juste au-dessus du sol plutôt que planté dedans.
const CAMPFIRE_SINK = 14;

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
  scene.add.sprite(x, y + CAMPFIRE_SINK, `${CAMPFIRE_TEXTURE_PREFIX}0`)
    .setOrigin(0.5, 1)
    .setScale(scale)
    .play(ANIM_CAMPFIRE_BURN_KEY);

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
    // Menu ouvert (scène séparée, cf. CampfireMenuScene.update() pour sa
    // propre fermeture E/Échap) : le prompt "Appuie sur E" (texte MONDE,
    // pas écran) resterait sinon affiché par-dessus, inchangé depuis juste
    // avant l'ouverture.
    if (scene.scene.isActive('CampfireMenuScene')) {
      prompt.setVisible(false);
      return;
    }
    const inRange = Phaser.Math.Distance.Between(scene.player.x, scene.player.y, x, y) <= CAMPFIRE_INTERACT_RANGE;
    prompt.setVisible(inRange);
    if (!inRange || !Phaser.Input.Keyboard.JustDown(scene.player.interactKey)) return;
    scene.player.refillAtCampfire();
    // Coupe l'élan en cours avant de geler les updates (cf.
    // updateLevelFromData, qui n'appelle plus player.update() tant que
    // CampfireMenuScene est active) -- sans ça la vitesse au moment de
    // l'ouverture continuerait d'être appliquée par le moteur physique
    // pendant que les touches de direction, elles, ne font plus rien.
    scene.player.setVelocity(0, 0);
    scene.scene.launch('CampfireMenuScene', { player: scene.player });
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
// restent solides, seul le dernier 1/4 du haut ne l'est plus.
const AUTOTILE_GRASS_HITBOX_FRACTION = 0.75;
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
const DECOR_SECTIONS = {
  bosquet: [
    'grove', 'statue_hooded', 'standing_stone', 'lamp_post', 'banner_tree',
    'bush_round', 'bush_flowering', 'mossy_rock', 'signpost', 'fence',
    'cart', 'crates', 'well', 'antler_totem', 'tree_stump', 'log_pile',
    'bench', 'barrels',
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
function renderAutotileGrid(scene, groundGroup, cells, options = {}) {
  const isBackLayer = !!options.back;
  const solid = new Set(cells.map(([gx, gy]) => gridCellKey(gx, gy)));
  const images = [];
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
    } else {
      // `material` peut valoir 'rock' sur d'anciennes données de niveau
      // exportées avant le retrait de cette option (cf. AUTOTILE_PREFIX,
      // un seul matériau désormais) : retombe sur la terre plutôt que sur
      // une texture manquante.
      const prefix = AUTOTILE_PREFIX[material] || AUTOTILE_PREFIX.dirt;
      textureKey = `${prefix}${pos}`;
    }
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
    const heightBoost = isPlatform
      ? (AUTOTILE_PLATFORM_HEIGHT_BOOST[textureKey] || 1)
      : (AUTOTILE_CORNER_HEIGHT_BOOST[pos] || 1);
    const baseSize = GROUND_TILE_SIZE + AUTOTILE_OVERLAP * 2;

    if (groundGroup && !isBackLayer) {
      const tile = groundGroup.create(cx, cy, GROUND_HITBOX_KEY).setVisible(false);
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
        const solidHeight = GROUND_TILE_SIZE * AUTOTILE_GRASS_HITBOX_FRACTION;
        tile.body.setSize(GROUND_TILE_SIZE, solidHeight);
        tile.body.setOffset(0, GROUND_TILE_SIZE - solidHeight);
      }
    }
    const displayHeight = baseSize * heightBoost;
    const tileCenterY = cy - (displayHeight - baseSize) / 2;
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
      images.push(scene.add.rectangle(cx, cy, GROUND_TILE_SIZE, GROUND_TILE_SIZE, AUTOTILE_BACKLAYER_TINT, 1));
    }
    const img = scene.add.image(cx, tileCenterY, textureKey)
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
  if (groundGroup && !isBackLayer) groundGroup.refresh();
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
  fadeInScene(scene);
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

  const { width, height } = scene.scale;
  const levelWidth = data.levelWidth || width;
  const levelHeight = data.levelHeight || height;
  // Marge au-dessus de 0 : l'éditeur autorise à peindre du plafond
  // (coordonnées Y négatives, cf. EDITOR_WORLD_TOP dans EditorScene.js) —
  // sans cette marge, des bounds caméra/monde calés pile sur (0,0) rendent
  // ce plafond invisible/inaccessible en jeu (la caméra ne peut jamais
  // scroller au-dessus de Y=0). N'affecte pas un niveau plat classique : le
  // joueur n'a simplement jamais de raison d'aller dans cette marge.
  const levelTop = -400;
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

  if (data.decor !== false) {
    addMoonlitDecor(scene, width, height, levelWidth, data.avoidRanges || []);
    addCaveCeiling(scene, levelWidth);
  }
  setupDebugToggle(scene);

  ensureGroundHitboxTexture(scene);
  // Sol en second plan (cf. AUTOTILE_BACKLAYER_*) : peint indépendamment
  // dans l'éditeur (outil 'ground-back', jamais automatique), rendu AVANT
  // le sol normal pour rester derrière lui -- purement visuel, aucun corps
  // physique (cf. `options.back` dans renderAutotileGrid).
  renderAutotileGrid(scene, null, data.groundBackCells || [], { back: true });
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
  scene.__frontGroundFirstImage = renderAutotileGrid(scene, scene.ground, data.groundCells || [])[0];

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
  const cameraTop = data.tallLevel ? levelTop : 0;
  const cameraHeight = data.tallLevel ? (levelHeight - levelTop) : height;
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
  scene.player = new Player(scene, spawn.x, spawn.y);
  scene.xara = new Xara(scene, scene.player);
  scene.physics.add.collider(scene.player, scene.ground);
  scene.cameras.main.startFollow(scene.player, true, 1, 1);

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

  scene.enemies = scene.physics.add.group();
  for (const e of data.enemies || []) {
    const patrolMinX = e.patrolMinX ?? e.x - 150;
    const patrolMaxX = e.patrolMaxX ?? e.x + 150;
    let enemy = null;
    if (e.type === 'araignee') enemy = new Araignee(scene, e.x, e.y);
    else if (e.type === 'loup') enemy = new LoupSanguinaire(scene, e.x, e.y, patrolMinX, patrolMaxX);
    else if (e.type === 'loupAlpha') enemy = new LoupAlpha(scene, e.x, e.y, patrolMinX, patrolMaxX);
    else if (e.type === 'corbeau') enemy = new Corbeau(scene, e.x, e.y, patrolMinX, patrolMaxX, e.diveDepth ?? 220);
    else if (e.type === 'crapaud') enemy = new Crapaud(scene, e.x, e.y);
    if (enemy) {
      // `group.add()` réinitialise `body.allowGravity` à `true`, écrasant le
      // `setAllowGravity(false)` posé dans le constructeur de ces deux
      // ennemis (fixe/volant) — sans ce rattrapage ils tombent hors du
      // niveau dès l'ajout au groupe (vérifié : chute mesurée en jeu).
      scene.enemies.add(enemy);
      if (e.type === 'araignee' || e.type === 'corbeau') enemy.body.setAllowGravity(false);
      // L'araignée fixe n'attaque pas au contact (seule sa toile est un
      // obstacle, cf. Web.js/Zone3Scene d'origine) : sans ce marqueur, le
      // contact simple avec elle blesserait le joueur comme n'importe quel
      // autre ennemi via l'overlap générique ci-dessous.
      if (e.type === 'araignee') enemy.harmless = true;
    }
  }
  scene.physics.add.collider(scene.enemies, scene.ground);
  scene.physics.add.overlap(scene.player, scene.enemies, (player, enemy) => {
    if (player.isInvulnerable || enemy.defeated) return;
    const hitbox = player.getAttackHitbox();
    if (hitbox && Phaser.Geom.Intersects.RectangleToRectangle(hitbox, enemy.getBounds())) {
      enemy.defeat();
      // Petite portion d'énergie par coup porté (cf. ENERGY_PER_HIT dans
      // Player.js) — même règle que le tir de plume (cf. Feather.js), donc
      // factorisée dans gainEnergy() plutôt que dupliquée ici et là.
      player.gainEnergy(ENERGY_PER_HIT);
    } else if (!enemy.harmless) {
      player.hitByEnemy();
    }
  });

  for (const t of data.totems || []) {
    const y = groundSurfaceYAt(scene, t.x, t.y) ?? t.y;
    addAbilityShrine(scene, t.x, y, t.flag, t.message || '', t.scale || TOTEM_SCALE);
  }

  for (const p of data.props || []) {
    const y = groundSurfaceYAt(scene, p.x, p.y) ?? p.y;
    scene.add.image(p.x, y, `${PROP_PREFIX}${p.type}`).setOrigin(0.5, 1).setScale(p.scale || PROP_SCALE);
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
  // Construit du HAUT vers le BAS : les cœurs collent au bord haut de
  // l'écran, la barre d'énergie juste en dessous.
  const baseY = HUD_MARGIN;
  const barY = baseY + HUD_HEART_SIZE + HUD_ENERGY_BAR_GAP_Y;
  // `player.maxHearts`/`maxEnergy` (pas les constantes de base HEART_MAX/
  // ENERGY_MAX) : inclut les bonus de totems équipés (cf.
  // recomputeTotemBonuses dans Player.js), donc la barre/les cœurs
  // s'allongent tout seuls quand un totem "vie"/"énergie" est équipé.
  for (let i = 0; i < scene.player.maxHearts; i++) {
    const cx = HUD_MARGIN + HUD_HEART_SIZE / 2 + i * (HUD_HEART_SIZE + HUD_HEART_GAP);
    const cy = baseY + HUD_HEART_SIZE / 2;
    const filled = i < scene.player.hearts;
    drawHeartIcon(g, cx, cy, HUD_HEART_SIZE, filled ? 0xff4d6d : 0x4a3d63, filled ? 1 : 0.6);
  }
  const barX = HUD_MARGIN;
  g.fillStyle(0x2a1f45, 1);
  g.fillRoundedRect(barX, barY, HUD_ENERGY_BAR_WIDTH, HUD_ENERGY_BAR_HEIGHT, 4);
  const fillRatio = Phaser.Math.Clamp(scene.player.energy / scene.player.maxEnergy, 0, 1);
  if (fillRatio > 0) {
    g.fillStyle(0x8fe3b8, 1);
    g.fillRoundedRect(barX, barY, HUD_ENERGY_BAR_WIDTH * fillRatio, HUD_ENERGY_BAR_HEIGHT, 4);
  }

  // Compétences en bas à gauche (cf. HUD_SKILL_* plus haut), ancré au bord
  // BAS de l'écran (comme les cœurs sont ancrés au bord HAUT) donc calculé
  // depuis `scene.scale.height`, pas empilé après ce qui précède.
  const skillY = scene.scale.height - HUD_MARGIN - HUD_SKILL_SIZE / 2;
  const player = scene.player;
  const now = scene.time.now;
  HUD_SKILL_LABELS.forEach((label, i) => {
    const cx = HUD_MARGIN + HUD_SKILL_SIZE / 2 + i * (HUD_SKILL_SIZE + HUD_SKILL_GAP);
    const skillId = player.skillSlots[i];
    const def = skillId ? SKILL_DEFS[skillId] : null;
    // Indisponible (encore en cooldown -- couvre transfo+attaque, cf.
    // tryActivateSkill -- OU pas assez d'énergie) : case grisée plutôt que
    // masquée, pour que le joueur voie TOUJOURS ce qu'il a d'équipé.
    const unavailable = !def || now < player.skillCooldownEndTime || player.energy < def.cost;
    const alpha = def && unavailable ? HUD_SKILL_UNAVAILABLE_ALPHA : 1;
    g.fillStyle(def ? def.hudColor : HUD_SKILL_EMPTY_COLOR, alpha);
    g.fillRoundedRect(cx - HUD_SKILL_SIZE / 2, skillY - HUD_SKILL_SIZE / 2, HUD_SKILL_SIZE, HUD_SKILL_SIZE, 6);
    g.lineStyle(2, 0x8fe3b8, def ? alpha : 0.5);
    g.strokeRoundedRect(cx - HUD_SKILL_SIZE / 2, skillY - HUD_SKILL_SIZE / 2, HUD_SKILL_SIZE, HUD_SKILL_SIZE, 6);
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
  if (!scene.player) return;
  // CampfireMenuScene active (cf. addCampfire, lancée EN PARALLÈLE plutôt
  // qu'un flag sur cette scène) : monde entièrement gelé (aucun mouvement
  // joueur/Xara/ennemi, aucune sortie de zone) tant qu'elle ne s'est pas
  // arrêtée elle-même (cf. sa propre update()) -- seul le HUD continue
  // d'être dessiné ici, le menu se dessine lui-même dans sa propre scène.
  if (!scene.scene.isActive('CampfireMenuScene')) {
    scene.player.update();
    scene.xara.update(time, delta);
    scene.enemies.children.iterate((enemy) => enemy && enemy.update(scene.player));

    // Zone de dégâts d'une compétence active (cf. getSkillHitbox/SKILL_DEFS
    // dans Player.js) : vérifiée manuellement contre TOUS les ennemis, pas
    // via un `physics.add.overlap` comme l'attaque de mêlée habituelle
    // ci-dessus — cette zone est bien plus large que le corps d'Agarica
    // (touche des deux côtés), un ennemi dedans ne serait pas forcément en
    // contact physique avec elle. `enemy.defeat()` protège déjà contre un
    // second appel (cf. `this.defeated`), mais le check `!enemy.defeated`
    // ici évite en plus de créditer de l'énergie plusieurs fois pour le même
    // ennemi pendant les quelques frames où la fenêtre reste active.
    const skillHitbox = scene.player.getSkillHitbox();
    if (skillHitbox) {
      scene.enemies.children.iterate((enemy) => {
        if (!enemy || enemy.defeated) return;
        if (Phaser.Geom.Intersects.RectangleToRectangle(skillHitbox, enemy.getBounds())) {
          enemy.defeat();
          scene.player.gainEnergy(ENERGY_PER_HIT);
        }
      });
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
