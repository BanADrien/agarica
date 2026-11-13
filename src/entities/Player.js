// Sprites forme Pieuvre : fichiers individuels par frame, générés depuis
// assets/sprites/pieuvre-mooves.png (voir tools/split_spritesheet.py — une
// seule ligne "MARCHE (AVANT)", 4 colonnes, vue de face uniquement — pas de
// pose dédiée par direction ni d'attaque, ni d'idle séparé : la 1re frame du
// cycle sert de pose statique au repos). Chargées dans BootScene sous la
// clé `pieuvre-walk-{colonne}`. Nage : anim jouée tant qu'une direction est
// tenue (gauche/droite fait juste un flip, comme le Loup/l'Aigle), pose
// figée sinon ; l'attaque réutilise le flash de teinte générique (pas
// d'anim dédiée sur cette feuille).
const PIEUVRE_FRAME_WIDTH = 381;
const PIEUVRE_FRAME_HEIGHT = 364;
const PIEUVRE_WALK_FRAME_COUNT = 4;
const ANIM_PIEUVRE_WALK_KEY = 'pieuvre-walk';
const PIEUVRE_SCALE = 0.24;

function pieuvreAnimFrames(name, count) {
  return Array.from({ length: count }, (_, i) => ({ key: `pieuvre-${name}-${i}` }));
}

function ensurePieuvreAnimations(scene) {
  if (scene.anims.exists(ANIM_PIEUVRE_WALK_KEY)) return;

  scene.anims.create({ key: ANIM_PIEUVRE_WALK_KEY, frames: pieuvreAnimFrames('walk', PIEUVRE_WALK_FRAME_COUNT), frameRate: 8, repeat: -1 });
}

// Transformation humaine <-> Pieuvre, à l'entrée/sortie de l'eau : générée
// depuis assets/sprites/transfo-humain-pieuvre.png (4 étapes : humaine ->
// hybride -> hybride avancée -> pieuvre finale). Retour (Pieuvre -> humaine)
// réutilise les mêmes frames dans l'ordre inverse, comme le Loup.
const TRANSFO_PIEUVRE_FRAME_COUNT_LOADED = 4;
const TRANSFO_PIEUVRE_FRAME_WIDTH = 332;
const TRANSFO_PIEUVRE_FRAME_HEIGHT = 436;
const TRANSFO_PIEUVRE_SCALE = 0.18;
const ANIM_TRANSFO_TO_OCTOPUS_KEY = 'transfo-to-octopus';
const ANIM_TRANSFO_TO_HUMAN_FROM_OCTOPUS_KEY = 'transfo-to-human-octopus';

function transfoPieuvreFrames(indices) {
  return indices.map((i) => ({ key: `transfo-pieuvre-${i}` }));
}

// Sprites Corbeau/Aigle : fichiers individuels par frame, générés depuis
// assets/sprites/piaf.png (voir tools/split_spritesheet.py — traité à part,
// la ligne de piqué a des traînées de vitesse détachées du corps par
// endroits). Partagés entre la forme Aigle du joueur (ci-dessous) et
// l'ennemi Corbeau (Corbeau.js), chargés dans BootScene sous la clé
// `piaf-{nom}-{colonne}`.
const PIAF_ANIM_ROWS = [
  { name: 'fly', row: 0, count: 4 },
  { name: 'glide', row: 1, count: 4 },
  { name: 'dive', row: 2, count: 5 },
];
const ANIM_PIAF_FLY_KEY = 'piaf-fly';
const ANIM_PIAF_GLIDE_KEY = 'piaf-glide';
const ANIM_PIAF_DIVE_KEY = 'piaf-dive';
// Tir de plume (cf. featherFlapEndTime) : durée du battement d'ailes forcé,
// et petit ralentissement global pour appuyer le tir (retour utilisateur —
// "un petit ralentissement pour faire un effet sympa"). Arcade Physics et
// l'Animation Manager n'ont PAS la même convention d'échelle de temps :
// world.timeScale est INVERSÉ (plus grand = plus lent, ex: 2 = moitié
// vitesse — cf. doc Phaser), alors que anims.globalTimeScale est un
// multiplicateur classique (plus petit = plus lent) — d'où les deux
// constantes séparées plutôt qu'une seule.
const FEATHER_FLAP_DURATION_MS = 220;
const FEATHER_SLOWMO_DURATION_MS = 90;
const FEATHER_SLOWMO_PHYSICS_TIMESCALE = 2.6;
const FEATHER_SLOWMO_ANIM_TIMESCALE = 0.38;
const PIAF_FRAME_WIDTH = 413;
const PIAF_FRAME_HEIGHT = 401;
// Hauteur affichée pour la forme Aigle du joueur (l'ennemi Corbeau a sa
// propre échelle, plus petite, dans Corbeau.js). Les poses vol/glisse
// n'occupent qu'une partie du canvas partagé avec le piqué (bien plus haut),
// d'où une échelle plus grande que WOLF_SCALE pour un rendu comparable.
const EAGLE_SCALE = 0.28;

// Transformation humaine -> Aigle au moment du double-saut : générée depuis
// assets/sprites/image.png (4 lignes = 4 poses de saut d'Agarica, 5
// colonnes = étapes de transformation). 2 frames par séquence, convergeant
// sur la même 2e frame (row0_col2) : row0_col1 -> row0_col2 à la montée,
// row1_col1 -> row0_col2 à la descente.
const TRANSFO_RISE_START_KEY = 'transfo-rise-start'; // row0 col1
const TRANSFO_FALL_START_KEY = 'transfo-fall-start'; // row1 col1
const TRANSFO_STEP2_KEY = 'transfo-step2'; // row0 col2
const ANIM_TRANSFO_RISE_KEY = 'transfo-rise';
const ANIM_TRANSFO_FALL_KEY = 'transfo-fall';
// Retour Aigle -> humaine (à l'atterrissage) : mêmes frames que la montée,
// ordre inversé.
const ANIM_TRANSFO_TO_HUMAN_FROM_EAGLE_KEY = 'transfo-to-human-eagle';
const TRANSFO_FRAME_WIDTH = 308;
const TRANSFO_FRAME_HEIGHT = 266;
// Entre HUMAN_SCALE et EAGLE_SCALE : évite un changement de taille brusque
// juste avant de basculer sur les vraies frames Aigle.
const TRANSFO_SCALE = 0.3;
const EAGLE_TRANSFO_FRAME_RATE = 13.33; // 2 frames / 150ms, cf. eagleTransformDuration

function piafAnimFrames(name, count) {
  return Array.from({ length: count }, (_, i) => ({ key: `piaf-${name}-${i}` }));
}

function ensurePiafAnimations(scene) {
  if (scene.anims.exists(ANIM_PIAF_FLY_KEY)) return;

  scene.anims.create({
    key: ANIM_PIAF_FLY_KEY,
    frames: piafAnimFrames('fly', 4),
    frameRate: 8,
    repeat: -1,
  });
  scene.anims.create({
    key: ANIM_PIAF_GLIDE_KEY,
    frames: piafAnimFrames('glide', 4),
    frameRate: 8,
    repeat: -1,
  });
  // En boucle : le piqué du Corbeau finit toujours avant un cycle complet
  // (courte diveDepth), mais celui d'Agarica dure tant que S est tenu — une
  // anim non bouclée s'arrêterait puis relancerait sans cesse depuis la
  // frame 0, un vrai clignotement au-delà d'un cycle.
  scene.anims.create({
    key: ANIM_PIAF_DIVE_KEY,
    frames: piafAnimFrames('dive', 5),
    frameRate: 7,
    repeat: -1,
  });

  // Jouées une fois au moment du double-saut, avant de basculer sur les
  // vraies frames Aigle (cf. eagleTransformDuration dans le constructeur) —
  // 2 frames calées pour tenir pile dans cette durée (frameRate = 2 /
  // durée-en-secondes). Créées seulement avec leurs images chargées (cf.
  // createAnimIfLoaded, plus bas) : sans image, pas de transfo dessinée.
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_RISE_KEY,
    frames: [
      { key: TRANSFO_RISE_START_KEY },
      { key: TRANSFO_STEP2_KEY },
    ],
    frameRate: EAGLE_TRANSFO_FRAME_RATE,
    repeat: 0,
  });
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_FALL_KEY,
    frames: [
      { key: TRANSFO_FALL_START_KEY },
      { key: TRANSFO_STEP2_KEY },
    ],
    frameRate: EAGLE_TRANSFO_FRAME_RATE,
    repeat: 0,
  });
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_TO_HUMAN_FROM_EAGLE_KEY,
    frames: [
      { key: TRANSFO_STEP2_KEY },
      { key: TRANSFO_RISE_START_KEY },
    ],
    frameRate: EAGLE_TRANSFO_FRAME_RATE,
    repeat: 0,
  });

  // Flash Loup -> Aigle (voir TRANSFO_WOLF_EAGLE_* plus haut) : une seule
  // pose, jouée sans boucle le temps du double-saut.
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_WOLF_TO_EAGLE_KEY,
    frames: [{ key: TRANSFO_WOLF_EAGLE_TEXTURE_KEY }],
    frameRate: 10,
    repeat: 0,
  });
}

// Sprites forme Loup : mêmes fichiers individuels par frame, générés à
// partir de assets/sprites/loup.png via tools/split_spritesheet.py. Chargés
// dans BootScene.preload() sous la clé `loup-{name}-{colonne}`.
const LOUP_ANIM_ROWS = [
  { name: 'run', row: 0, count: 6 },
  { name: 'jump', row: 1, count: 4 },
];
// Attaque : feuille dédiée (assets/sprites/loup_attaque.png), plus détaillée
// que l'ancienne ligne "attack" de loup.png — élan (row0, 4 frames) puis
// morsure + choc + retour (row1, 4 frames). Chargée à part dans BootScene
// sous des clés `loup-attack-{0..7}` continues sur les deux lignes.
const LOUP_ATTACK_ANIM_ROWS = [
  { row: 0, count: 4 },
  { row: 1, count: 4 },
];
// Coup de croc : images gardées de la feuille pour un coup vif (toute la feuille
// = 400 ms, bien plus que la dague). 0_3 = gueule ouverte, 1_0 = gueule grande
// ouverte (morsure), 1_1 = gueule fermée (tenue deux images), 1_3 = retour.
// Calées une à une sur les crocs `vfx_croc` (cf. drawBiteFx, 56 ms chacune) :
// crocs ouverts pendant l'élan → gueule ouverte, crocs qui se referment →
// gueule fermée. Avec 0_2 (gueule close) en tête, tout était décalé d'une
// image : gueule grande ouverte pile quand les crocs se fermaient. Sans 1_2 :
// le loup s'y cabrait, pose de fin de ruée. Durée = celle d'un coup de dague,
// cf. SLASH_TOTAL_MS.
const WOLF_BITE_FRAMES = [3, 4, 5, 5, 7];
const ANIM_WOLF_RUN_KEY = 'loup-run';
const ANIM_WOLF_ATTACK_KEY = 'loup-attack';
// Comme pour le saut humain (cf. JUMP_RISE_TEXTURE/JUMP_FALL_TEXTURE) : pas
// d'animation jouée en l'air, poses statiques piochées dans la séquence de
// bond (row1) — jump-1 = élan vers le haut, jump-2 = chute, jump-3 = pose de
// réception, affichée une seule frame pile à l'atterrissage (cf.
// justLandedThisFrame) avant d'enchaîner sur la course.
const WOLF_JUMP_RISE_TEXTURE = 'loup-jump-1';
const WOLF_JUMP_FALL_TEXTURE = 'loup-jump-2';
const WOLF_LANDING_TEXTURE = 'loup-jump-3';
// Loup à l'arrêt (Maj tenue sans avancer, 2026-11-09) : pas d'idle dessiné,
// la 1re image de la course (la plus « debout ») figée, sous cette vitesse.
const WOLF_STAND_TEXTURE = 'loup-run-0';
const WOLF_STAND_SPEED = 40;
// Canvas partagé par TOUTES les frames Loup (course/saut ET attaque) —
// ré-uniformisé après coup (cf. tools/unify_wolf_frames usage ponctuel) car
// la feuille d'attaque, traitée séparément, avait généré un canvas
// légèrement différent (422x257 contre 408x269), ce qui décalait la hitbox
// (elle "s'enfonçait dans le sol") pile pendant l'animation d'attaque/dash.
const WOLF_FRAME_WIDTH = 422;
const WOLF_FRAME_HEIGHT = 267;
// Hauteur affichée un peu au-dessus de la forme humaine (357 * HUMAN_SCALE
// ~= 86px) pour que le loup ait une présence bien affirmée au sprint, quitte
// à être bien plus large (silhouette de quadrupède).
const WOLF_SCALE = 0.4;
// Les 2 poses de saut (rise/fall) paraissaient un peu chétives à WOLF_SCALE
// une fois en l'air — même recette que JUMP_SCALE pour la forme humaine :
// légèrement plus grande le temps du saut, hitbox réappliquée juste après
// (cf. plus bas) pour rester cohérente avec ce visuel agrandi.
const WOLF_JUMP_SCALE = 0.46;
// La feuille d'attaque est dessinée plus grande que celle de course (surface
// visible x 1,73 en moyenne sur les 5 images du coup, soit x 1,31 en longueur) :
// à WOLF_SCALE, le loup grossissait pendant les 280 ms du croc puis rétrécissait
// d'un coup. 0,4 / 1,315 : même taille que la course. La hitbox, elle, ne change
// pas (WOLF_BITE_BODY = même boîte monde que FORMS.wolf.body).
const WOLF_BITE_SCALE = 0.304;

function loupAnimFrames(name, indices) {
  return indices.map((i) => ({ key: `loup-${name}-${i}` }));
}

// Transformation humaine <-> Loup, à l'entrée/sortie du sprint : générée
// depuis assets/sprites/transfo_loup.png (4 étapes sur une seule ligne :
// humaine -> hybride -> loup+cape -> loup final). Le retour (Loup ->
// humaine) réutilise exactement les mêmes frames dans l'ordre inverse.
const ANIM_TRANSFO_TO_WOLF_KEY = 'transfo-to-wolf';
const ANIM_TRANSFO_TO_HUMAN_FROM_WOLF_KEY = 'transfo-to-human-wolf';
const TRANSFO_WOLF_FRAME_COUNT_LOADED = 4;
// 1503x1046 (pas 634x442) : assets/sprites/transfo_loup_frames/transfoloup_1.png
// a été régénéré à une résolution native plus grande (même cadrage/ratio à
// ~0.2% près, juste un rendu plus haute-def) sans repasser l'échelle à
// l'échelle — la transfo ressortait ~2.4x trop grosse à l'écran. Échelle
// recalculée au même prorata (ancienne largeur/nouvelle largeur) pour
// retrouver exactement le gabarit d'avant, toujours entre HUMAN_SCALE et
// WOLF_SCALE (le loup occupe une bien plus grande part du canvas que sur la
// feuille de course, peu de marge autour de la silhouette).
const TRANSFO_WOLF_FRAME_WIDTH = 1503;
const TRANSFO_WOLF_FRAME_HEIGHT = 1046;
const TRANSFO_WOLF_SCALE = 0.0675;

function transfoWolfFrames(indices) {
  return indices.map((i) => ({ key: `transfo-wolf-${i}` }));
}

// --- Anims de transformation : seulement les images chargées ---------------
// Bug corrigé : la transfo Loup cite 4 images (transfo-wolf-0..3) dont seules
// la 1 et la 2 existent sur disque -- Phaser écrivait « Texture
// transfo-wolf-0 / transfo-wolf-3 not found » à chaque création, et si les
// deux images restantes manquaient aussi (chargement raté), l'anim n'avait
// AUCUNE frame : la transfo affichait alors la texture précédente à
// l'échelle de la transfo (0,0675 : Agarica quasi invisible, 18x11 px), puis
// une erreur JS (« reading 'duration' »). Désormais : anim créée avec ses
// seules images chargées, pas d'anim du tout sans image, et pas de transfo
// dessinée quand son anim n'est pas jouable (cf. beginFormTransition) -- la
// forme change alors net, comme sans art.
function loadedAnimFrames(scene, frames) {
  return frames.filter((f) => scene.textures.exists(f.key));
}

function createAnimIfLoaded(scene, config) {
  const frames = loadedAnimFrames(scene, config.frames);
  if (!frames.length) return null;
  return scene.anims.create({ ...config, frames });
}

function animPlayable(scene, key) {
  const anim = key && scene.anims.exists(key) ? scene.anims.get(key) : null;
  return !!(anim && anim.frames.length);
}

// Images de transformation dont la planche n'a pas été dessinée à la même
// échelle que les autres (calibrage visuel : pas de saut de taille d'une pose
// à l'autre). transfoloup_2 (loup encore capé, 1536x1024) sortait à
// TRANSFO_WOLF_SCALE 25 % plus petite que le loup qui suit (51 px de haut
// contre 64-68) : elle prend la même surface visible que loup-run-0 à
// WOLF_SCALE. Hitbox inchangée (même gabarit humain, cf. transfoBodyConfig).
const TRANSFO_FRAME_CALIBRATION = {
  'transfo-wolf-2': { refKey: 'loup-run-0', refScale: WOLF_SCALE },
};
const TRANSFO_FRAME_SCALE_CACHE = new Map();
function transfoFrameScale(scene, key) {
  // Ours : chaque image de leur rangée `transform` a son échelle (Agarica au
  // départ, l'animal à l'arrivée -- cf. ursideFrameScale, Ursides.js).
  if (typeof ursideFrameScale === 'function') {
    const bear = ursideFrameScale(key);
    if (bear) return bear;
  }
  const cal = TRANSFO_FRAME_CALIBRATION[key];
  if (!cal || typeof calibratedScale !== 'function') return null;
  if (TRANSFO_FRAME_SCALE_CACHE.has(key)) return TRANSFO_FRAME_SCALE_CACHE.get(key);
  const res = calibratedScale(scene, [key], { refKey: cal.refKey, refScale: cal.refScale, method: 'area' });
  const scale = res ? res.scale : null;
  // Pas de mise en cache d'un échec de lecture (pixels pas encore lisibles).
  if (scale) TRANSFO_FRAME_SCALE_CACHE.set(key, scale);
  return scale;
}

// Transformation Loup -> Aigle en plein vol (double-saut déclenché alors
// qu'on sprintait encore, cf. wolfJumpCarry) : une seule pose hybride
// (assets/sprites/transfo_loup_piaf.png), affichée en flash le temps du
// double-saut, à la place des frames humaine->Aigle (qui montraient une
// silhouette humaine incohérente en sortant du Loup). Pas de retour dédié
// (Aigle -> Loup) : hors scope de la demande actuelle.
const TRANSFO_WOLF_EAGLE_TEXTURE_KEY = 'transfo-wolf-eagle-0';
const TRANSFO_WOLF_EAGLE_FRAME_WIDTH = 1453;
const TRANSFO_WOLF_EAGLE_FRAME_HEIGHT = 1024;
// Plus petite que WOLF_SCALE*WOLF_FRAME_HEIGHT/EAGLE_SCALE*PIAF_FRAME_HEIGHT
// (~110px) : à cette taille-là, le flash paraissait bien trop imposant par
// rapport au Loup/Aigle réels avant/après.
const TRANSFO_WOLF_EAGLE_SCALE = 0.08;
const ANIM_TRANSFO_WOLF_TO_EAGLE_KEY = 'transfo-wolf-to-eagle';

// Sprites forme humaine : fichiers individuels (un par frame), générés à
// partir de assets/sprites/agarica.png via tools/split_spritesheet.py (voir
// ce script pour re-générer après un changement d'illustration). Chargés
// dans BootScene.preload() sous la clé `agarica-{name}-{colonne}`.
const AGARICA_ANIM_ROWS = [
  { name: 'idle', row: 0, count: 6 },
  { name: 'run', row: 2, count: 6 },
];
// Marche : feuille dédiée (assets/sprites/agarica_walk.png), remplace
// l'ancienne marche empruntée à agarica.png (juste 2 poses en alternance,
// la ligne dédiée de la feuille d'origine rendait bizarre avec ses poses de
// transition intermédiaires). La feuille fournit 5 poses mais la 5e est un
// quasi-doublon de la 1re (redondante vu que l'anim boucle déjà dessus) :
// seules les 4 premières sont chargées/utilisées, en cycle simple.
const AGARICA_WALK_FRAME_INDICES = [0, 1, 2, 3];
const ANIM_IDLE_KEY = 'agarica-idle';
const ANIM_WALK_KEY = 'agarica-walk';
const HUMAN_SCALE = 0.24;
// Pas de ligne dédiée au saut dans la feuille : on emprunte deux poses
// aériennes de la ligne "course" comme pose statique montée/descente
// pendant le saut simple (avant transformation Aigle éventuelle au 2e saut).
const JUMP_RISE_TEXTURE = 'agarica-run-2';
const JUMP_FALL_TEXTURE = 'agarica-run-4';
// Poses de saut plus imposantes que le reste (idle/marche/course) : même
// canvas/texture, juste une échelle plus grande le temps du saut (cf. plus
// bas, ré-appliquée avec la hitbox pour rester cohérente avec le visuel).
const JUMP_SCALE = 0.29;

// Attaque à la dague (assets/sprites/agarica_attack.png, fond noir enlevé au
// dechroma) : 5 frames sur une seule ligne (élan, levée, poussée + étincelles
// naissantes, poussée pleine avec lame d'énergie, retour) — pas le même
// canvas que idle/marche/course (personnage plus large : fente + dague
// tendue), redimensionné au montage pour garder la même taille de
// personnage affichée (cf. tools, script de découpe ponctuel).
const ANIM_AGARICA_ATTACK_KEY = 'agarica-attack';
const AGARICA_ATTACK_FRAME_COUNT = 4;
const AGARICA_ATTACK_FRAME_WIDTH = 1424;
const AGARICA_ATTACK_FRAME_HEIGHT = 366;
// Un peu plus petite que HUMAN_SCALE (retour utilisateur : "un peu trop
// grande") : le personnage lui-même mesure quasiment la même hauteur que
// idle/marche à l'échelle brute (~350px contre ~346px de contenu réel),
// donc l'impression de trop grand vient surtout de la lame d'énergie, bien
// plus spectaculaire qu'un simple coup de dague — réduit l'ensemble
// (personnage + effet) proportionnellement plutôt que de les traiter
// séparément.
const AGARICA_ATTACK_SCALE = HUMAN_SCALE * 0.85;
// (L'ancienne portée « estoc » AGARICA_ATTACK_REACH_RAW = 704 px bruts, mesurée
// sur la lame de lumière de la frame 2, a été remplacée par les arcs
// directionnels SLASH_ARCS : la zone qui touche est désormais celle affichée.)
// Même gabarit affiché que FORMS.agarica (cf. PLAYER_BODY_FRACTION/
// AGARICA_BODY_BBOX plus bas), recalculé pour CE canvas précis (échelle
// différente, AGARICA_ATTACK_SCALE) -- sans ce recalcul, la hitbox
// sauterait d'une taille à l'autre pile au déclenchement/à la fin de
// l'attaque (le genre de "sursaut" déjà documenté ailleurs dans ce fichier,
// cf. transfoBodyConfig). Le personnage est CENTRÉ sur le canvas (cf. tools,
// script de découpe ponctuel — char_left calé sur la largeur de la frame 0,
// sans effet) même si la lame d'énergie déborde largement d'un côté sur les
// autres frames : l'origine du sprite est (0.5, 1) (setOrigin dans le
// constructeur), donc tout ce qui n'est pas centré sur le canvas se
// déplace visiblement par rapport à idle/marche au moment où l'attaque
// démarre/se termine. offsetX/offsetY mesurés directement sur la bbox réelle
// de agarica_attack_0.png (553,8)-(871,358) -- pas la formule naïve
// `frameHeight - height`, qui aurait ignoré la marge basse de 8px propre à
// CETTE planche (déjà le cas avant ce changement, cf. l'ancien offsetY=183
// au lieu de 191 = 366-175).
const AGARICA_ATTACK_BODY = {
  width: 176.0,
  height: 327.5,
  offsetX: 624.0,
  offsetY: 30.5,
};

// --- Attaques directionnelles (forme humaine ET singe), façon Hollow Knight ---
// Retour utilisateur : l'ancien estoc (lame d'énergie de 144 px dessinée sur
// UNE seule frame, hitbox active pendant toute l'anim) tuait des ennemis
// qu'on ne voyait pas touchés. Règle : LA ZONE QUI TOUCHE = L'ARC AFFICHÉ,
// et seulement pendant ses images actives (SLASH_ACTIVE_MS) ; un coup par
// ennemi et par coup (jeton `attackEndTime`, cf. damageEnemy dans LevelKit).
// Direction choisie à l'appui : Z/↑ tenu = haut, S/↓ tenu EN L'AIR = bas,
// sinon de côté (devant). Art Codex : `agarica_slash` (poses du corps) et
// `vfx_slash` (l'arc lumineux, origine au centre), tous deux face à DROITE.
// Placement de l'arc par direction (À RECALER ICI si l'art change) : centre
// du sprite d'arc relatif aux pieds (this.x, this.y), `cx` vers l'avant, `cy`
// vertical. La zone qui touche est calculée sur les pixels VISIBLES de l'arc
// (cf. slashArtBounds, union des images affichées pendant la phase active) ;
// `w`/`h` ne servent qu'au croissant dessiné par code quand l'art manque.
const SLASH_ARCS = {
  side: { cx: 62, cy: -40, w: 104, h: 80 },
  up: { cx: 8, cy: -92, w: 108, h: 72 },
  down: { cx: 0, cy: 12, w: 100, h: 80 },
  // Coup de croc du Loup (slashDir = 'bite') : même règle, zone = crocs affichés.
  // Courte et devant la gueule (corps jusqu'à +43 px) : la morsure doit se
  // placer, là où l'ancienne ruée touchait de tout le corps. Calée sur la gueule
  // du loup à WOLF_BITE_SCALE (bout du museau ~ +54 px, gueule ~ 28 px au-dessus
  // des pieds) : à (76, -42), réglage d'avant à l'échelle 0,4, les crocs
  // flottaient devant elle une fois le loup ramené à sa taille de course.
  // 2026-11-11 : crocs retournés (charnière côté loup, cf. drawBiteFx) et avancés de 60 à 76 :
  // la charnière tombait sinon sur la tête du loup et la cachait.
  bite: { cx: 76, cy: -32, w: 64, h: 52 },
  // Coup de patte du Loup vers le bas (slashDir = 'paw', en l'air + S/↓) :
  // sous ses pattes, à peine en avant ; griffes dessinées par code dans ce
  // rectangle (cf. drawPawClaws), qui est aussi la zone qui touche.
  paw: { cx: 6, cy: 16, w: 92, h: 68 },
};
// Échelle de l'art `agarica_slash`/`vfx_slash` au moment où SLASH_ARCS a été
// réglé : les positions d'arc suivent l'échelle calibrée de la pose (cf.
// slashArcFactor) pour que l'arc parte toujours de la dague.
const SLASH_ARCS_ART_SCALE = 0.335;
// Phases d'un coup, calées sur les 4 frames du corps (`agarica_slash`, une
// frame par SLASH_WINDUP_MS) : frame 0 = élan (rien ne touche), frames 1-2 =
// images actives (l'arc est affiché ET touche), frame 3 = retour (l'arc
// s'efface, ne touche plus).
const SLASH_WINDUP_MS = 56;
const SLASH_ACTIVE_MS = 112;
const SLASH_RECOVERY_MS = 112;
const SLASH_FADE_MS = 70;
// Images de l'arc `vfx_slash` montrées pendant la phase active (la 3e,
// plus pâle, pendant l'effacement) : la zone qui touche = leur union.
const SLASH_VFX_ACTIVE_FRAMES = [0, 1];
const SLASH_TOTAL_MS = SLASH_WINDUP_MS + SLASH_ACTIVE_MS + SLASH_RECOVERY_MS;
// Art des crocs (lot Codex n°11, 5 images : ouverture pendant l'élan, 2 images
// actives = zone qui touche, 2 d'effacement) ; repli : drawBiteJaws.
const BITE_VFX_ID = 'vfx_croc';
const BITE_VFX_ACTIVE_FRAMES = [1, 2];
// Vitesse au sol pendant la morsure (fraction de la vitesse de course) : le coup
// pèse sans propulser. En l'air, rien : un saut d'élan garde sa portée (ravins).
const WOLF_BITE_GROUND_SPEED = 0.8;
// Rebond (« pogo ») : un coup vers le bas qui touche un ennemi, un amas de
// mousse ou un danger relance Agarica vers le haut (~140 px).
const POGO_VELOCITY = -600;
// Croissant dessiné par code tant que l'art `vfx_slash` n'existe pas (palette
// du jeu : vert lunaire, cœur blanc, liseré rose).
const SLASH_COLORS = { glow: 0x5fd88f, body: 0x9fffd0, core: 0xe8fff2, edge: 0xffb3e0 };
// Poses du corps sans l'art `agarica_slash` : [élan, actif, retour]. Côté :
// planche d'attaque historique SANS la frame 2 (son estoc de lumière
// débordait de la zone de coup) ; haut : bras levés (`cast`) ; bas : genoux
// repliés, dague vers le bas (`jump_rise`).
const SLASH_FALLBACK_POSES = {
  side: [{ attack: 0 }, { attack: 1 }, { attack: 3 }],
  up: [{ extra: 'cast', frame: 1 }, { extra: 'cast', frame: 2 }, { extra: 'cast', frame: 3 }],
  down: [{ extra: 'jump_rise', frame: 1 }, { extra: 'jump_rise', frame: 2 }, { extra: 'jump_rise', frame: 2 }],
};
// Lancer de pierre : pose fixe bras tendu (frame 1 de la planche d'attaque) --
// l'anim d'attaque complète montrait l'estoc de lumière pendant un lancer.
const THROW_POSE_TEXTURE = 'agarica-attack-1';

// Croissant lumineux inscrit dans le rectangle `r` du coup (= hitbox) : arc
// extérieur = demi-ellipse qui touche les bords du rectangle côté coup, arc
// intérieur plus court sur la même base (pointes fines, ventre épais).
function drawSlashCrescent(g, r, dir, facing, alpha) {
  let cx; let cy; let rx; let ry; let a0; let a1;
  if (dir === 'up') {
    cx = r.centerX; cy = r.bottom; rx = r.width / 2; ry = r.height; a0 = Math.PI; a1 = Math.PI * 2;
  } else if (dir === 'down') {
    cx = r.centerX; cy = r.y; rx = r.width / 2; ry = r.height; a0 = 0; a1 = Math.PI;
  } else {
    cx = facing > 0 ? r.x : r.right; cy = r.centerY; rx = r.width; ry = r.height / 2;
    a0 = facing > 0 ? -Math.PI / 2 : Math.PI / 2; a1 = a0 + Math.PI;
  }
  const N = 20;
  const band = (outer, inner) => {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const a = a0 + ((a1 - a0) * i) / N;
      pts.push({ x: cx + Math.cos(a) * rx * outer, y: cy + Math.sin(a) * ry * outer });
    }
    for (let i = N; i >= 0; i--) {
      const a = a0 + ((a1 - a0) * i) / N;
      // Côté ventre : rayon intérieur réduit surtout au milieu de l'arc.
      const mid = Math.sin(((a - a0) / (a1 - a0)) * Math.PI);
      const k = 1 - (1 - inner) * mid;
      const rr = dir === 'side' ? { x: rx * outer * k, y: ry * outer * (0.94 + 0.06 * (1 - mid)) }
        : { x: rx * outer * (0.94 + 0.06 * (1 - mid)), y: ry * outer * k };
      pts.push({ x: cx + Math.cos(a) * rr.x, y: cy + Math.sin(a) * rr.y });
    }
    return pts;
  };
  g.fillStyle(SLASH_COLORS.glow, 0.32 * alpha);
  g.fillPoints(band(1, 0.42), true);
  g.fillStyle(SLASH_COLORS.body, 0.75 * alpha);
  g.fillPoints(band(0.96, 0.6), true);
  g.fillStyle(SLASH_COLORS.core, 0.95 * alpha);
  g.fillPoints(band(0.92, 0.8), true);
  // Liseré rose sur le bord extérieur (clin d'œil au tatouage d'Agarica).
  g.lineStyle(2, SLASH_COLORS.edge, 0.8 * alpha);
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = a0 + ((a1 - a0) * i) / N;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.strokePath();
}

// Crocs dessinés tant que l'art `vfx_croc` n'existe pas : deux mâchoires en
// croissant (trait vert lunaire) et leurs rangées de crocs clairs, décalées d'une
// rangée à l'autre pour s'emboîter une fois fermées. `r` = zone qui touche,
// `close` 0 (grande ouverte, bords de la zone) à 1 (fermée).
function drawBiteJaws(g, r, facing, close, alpha) {
  const cx = r.centerX;
  const cy = r.centerY;
  const hw = r.width / 2;
  // Bord des crocs : `BASE` au centre de l'arc, `ARCH` en plus au milieu.
  const BASE = 7;
  const ARCH = 5;
  const gap = (1 - close) * (r.height / 2 - BASE - ARCH);
  const px = (u) => cx + facing * u * hw;
  // u : -1 (arrière) à 1 (museau) ; `side` : -1 mâchoire du haut, +1 du bas.
  const edgeY = (u, side) => cy + side * (gap + BASE + ARCH * (1 - u * u));
  for (const side of [-1, 1]) {
    const inner = [];
    const outer = [];
    for (let i = 0; i <= 14; i++) {
      const u = -1 + (2 * i) / 14;
      inner.push({ x: px(u), y: edgeY(u, side) });
      // Croissant effilé aux deux bouts.
      outer.push({ x: px(u), y: edgeY(u, side) + side * (1 + 3.5 * (1 - u * u)) });
    }
    const teeth = side < 0 ? [-0.8, -0.42, -0.04, 0.34, 0.72] : [-0.61, -0.23, 0.15, 0.53, 0.9];
    for (const u of teeth) {
      // Plus longs côté museau (canines), comme une vraie gueule.
      const len = 8 + 5 * Math.max(0, (u + 0.6) / 1.5);
      const tw = u > 0.6 ? 0.15 : 0.12;
      const y0 = edgeY(u - tw, side);
      const y1 = edgeY(u + tw, side);
      const tipY = edgeY(u, side) - side * len;
      g.fillStyle(SLASH_COLORS.core, alpha);
      g.fillTriangle(px(u - tw), y0, px(u + tw), y1, px(u), tipY);
      g.lineStyle(1, SLASH_COLORS.glow, 0.85 * alpha);
      g.strokeTriangle(px(u - tw), y0, px(u + tw), y1, px(u), tipY);
    }
    g.lineStyle(6, SLASH_COLORS.glow, 0.28 * alpha);
    g.strokePoints(outer, false);
    g.fillStyle(SLASH_COLORS.body, alpha);
    g.fillPoints(inner.concat(outer.slice().reverse()), true);
  }
  // Fermeture : petit éclat côté museau (liseré rose, comme l'arc de la dague).
  if (close >= 1) {
    const x0 = cx + facing * (hw + 2);
    g.lineStyle(2, SLASH_COLORS.edge, 0.9 * alpha);
    for (const a of [-0.55, 0, 0.55]) {
      g.lineBetween(x0, cy + a * 7, x0 + facing * Math.cos(a) * 10, cy + a * 7 + Math.sin(a) * 10);
    }
  }
}

// Griffes du coup de patte du Loup (pas d'art : dessinées par code) : trois
// entailles qui ratissent `r` de haut en bas, penchées vers l'avant, effilées
// aux deux bouts ; halo vert lunaire, cœur clair, liseré rose (palette des
// arcs). `reach` 0 -> 1 : longueur déjà tracée (le geste se lit de haut en bas).
function drawPawClaws(g, r, facing, reach, alpha) {
  const N = 12;
  const lean = 16;
  for (const k of [-1, 0, 1]) {
    const x0 = r.centerX + k * r.width * 0.24 - facing * lean * 0.5;
    const top = r.y + 4 + Math.abs(k) * 6;
    const len = (r.height - 8 - Math.abs(k) * 10) * reach;
    if (len < 2) continue;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      pts.push({ x: x0 + facing * lean * Math.sin(t * Math.PI / 2), y: top + t * len, w: 5.5 * Math.sin(Math.PI * Math.min(1, t * 1.05)) + 0.6 });
    }
    const band = (scale) => {
      const left = pts.map((p) => ({ x: p.x - p.w * scale, y: p.y }));
      const right = pts.map((p) => ({ x: p.x + p.w * scale, y: p.y })).reverse();
      return left.concat(right);
    };
    g.fillStyle(SLASH_COLORS.glow, 0.3 * alpha);
    g.fillPoints(band(2.2), true);
    g.fillStyle(SLASH_COLORS.body, 0.85 * alpha);
    g.fillPoints(band(1), true);
    g.fillStyle(SLASH_COLORS.core, alpha);
    g.fillPoints(band(0.45), true);
    g.lineStyle(1.5, SLASH_COLORS.edge, 0.85 * alpha);
    g.strokePoints(pts.map((p) => ({ x: p.x + facing * p.w * 1.1, y: p.y })), false);
  }
}

function agaricaAnimFrames(name, indices) {
  return indices.map((i) => ({ key: `agarica-${name}-${i}` }));
}

function ensurePlayerAnimations(scene) {
  if (scene.anims.exists(ANIM_IDLE_KEY)) return;

  scene.anims.create({
    key: ANIM_IDLE_KEY,
    frames: agaricaAnimFrames('idle', [0, 1, 2, 3, 4, 5]),
    frameRate: 6,
    repeat: -1,
  });
  scene.anims.create({
    key: ANIM_WALK_KEY,
    frames: agaricaAnimFrames('walk', AGARICA_WALK_FRAME_INDICES),
    frameRate: 12,
    repeat: -1,
  });
  // 4 frames à 14fps = ~286ms — jouée une seule fois sur la fenêtre d'attaque.
  // Accélérée depuis 10fps/400ms (retour utilisateur : "l'animation d'attaque
  // d'agarica est trop lente").
  scene.anims.create({
    key: ANIM_AGARICA_ATTACK_KEY,
    frames: Array.from({ length: AGARICA_ATTACK_FRAME_COUNT }, (_, i) => ({ key: `agarica-attack-${i}` })),
    frameRate: 14,
    repeat: 0,
  });

  scene.anims.create({
    key: ANIM_WOLF_RUN_KEY,
    frames: loupAnimFrames('run', [0, 1, 2, 3, 4, 5]),
    frameRate: 12,
    repeat: -1,
  });
  // Jouée une seule fois par coup de croc, calée sur sa durée (SLASH_TOTAL_MS).
  scene.anims.create({
    key: ANIM_WOLF_ATTACK_KEY,
    frames: WOLF_BITE_FRAMES.map((i) => ({ key: `loup-attack-${i}` })),
    frameRate: WOLF_BITE_FRAMES.length / (SLASH_TOTAL_MS / 1000),
    repeat: 0,
  });

  // Transformation Loup, aller et retour (mêmes frames, ordre inversé) —
  // jouées une fois à l'entrée/sortie du sprint (cf. WOLF_TRANSFORM_DURATION).
  // Seules les images 1 et 2 existent (cf. createAnimIfLoaded) : la transfo
  // joue donc hybride -> loup capé (~133 ms), comme avant, sans avertissement.
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_TO_WOLF_KEY,
    frames: transfoWolfFrames([0, 1, 2, 3]),
    frameRate: 15,
    repeat: 0,
  });
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_TO_HUMAN_FROM_WOLF_KEY,
    frames: transfoWolfFrames([3, 2, 1, 0]),
    frameRate: 15,
    repeat: 0,
  });

  // Transformation Pieuvre, aller et retour (mêmes 4 frames, ordre inversé)
  // — jouée à l'entrée/sortie de l'eau (cf. octopusTransformDuration).
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_TO_OCTOPUS_KEY,
    frames: transfoPieuvreFrames([0, 1, 2, 3]),
    frameRate: 15,
    repeat: 0,
  });
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_TO_HUMAN_FROM_OCTOPUS_KEY,
    frames: transfoPieuvreFrames([3, 2, 1, 0]),
    frameRate: 15,
    repeat: 0,
  });

  ensurePiafAnimations(scene);
  ensureOursAnimations(scene);
  // Définie dans Crapaud.js (chargé APRÈS ce fichier, cf. index.html) --
  // référence différée, sans risque : cette fonction n'est *appelée* qu'au
  // runtime (à la création du joueur), bien après que tous les scripts
  // aient fini de s'exécuter. Nécessaire même si aucun ennemi Crapaud
  // n'existe dans la zone, pour que la compétence du même nom ait ses
  // anims prêtes (cf. SKILL_DEFS.crapaud dans Crapaud.js).
  ensureCrapaudAnimations(scene);
}

// Config par forme : texture/échelle/hitbox. Le sprite a une origine
// (0.5, 1) — ancrée aux pieds, pas au centre — donc `this.y` représente
// directement "où sont les pieds" et le bas visuel de CHAQUE frame tombe
// pile sur `this.y`, quelle que soit la taille du canvas de la texture.
// offsetY = hauteur de frame - hauteur de hitbox place systématiquement le
// bas de la hitbox sur `this.y` aussi : les pieds ne s'enfoncent jamais
// dans le sol et la hitbox ne saute pas au changement de forme (ex :
// atterrissage en Aigle -> Agarica).
//
// Retour utilisateur : "les hitbox de joueur sous toutes les formes sont
// mal définies, prends la taille de l'image et réduis-la un peu pour que ce
// soit plus cohérent" -- l'ancienne recette forçait un gabarit FIXE
// (~22x42px affichés) identique pour les 4 formes, un chiffre choisi pour
// Agarica puis recopié tel quel pour Loup/Aigle/Pieuvre malgré des
// silhouettes réelles bien plus grandes et de proportions très différentes
// (le Loup est large et bas, l'Aigle ailes déployées est presque carré) --
// display disconnecté du visuel réel, "mal défini" au sens propre. Remplacé
// par une hitbox dérivée du contenu RÉEL de chaque texture de référence
// (bbox non-transparente mesurée via PIL sur agarica_row0_0/loup_row0_0/
// piaf_row0_0/pieuvre_walk_0 -- les 4 valeurs XXX_BODY_BBOX ci-dessous),
// réduite de PLAYER_BODY_FRACTION (0.8, "un peu") pour rester légèrement
// dans la silhouette plutôt que pile dessus. Cohérente PAR CONSTRUCTION
// (même recette pour les 4 formes) sans qu'aucune n'ait besoin d'un chiffre
// choisi à la main. offsetX reste `(frameWidth - body.width) / 2` (centre
// du canvas) car les 4 planches sources sont déjà centrées par
// tools/split_spritesheet.py (vérifié : marges gauche/droite de la bbox
// égales sur les 4, contrairement aux planches Ours/Crapaud qui ont eu
// besoin d'un outil de découpe dédié aligné à un bord).
const PLAYER_BODY_FRACTION = 0.8;
// { x0, y0, x1, y1 } = bbox mesurée (PIL .getbbox()) sur la texture de
// référence de chaque forme, dans l'espace RAW du canvas (avant échelle).
const AGARICA_BODY_BBOX = { x0: 22, y0: 5, x1: 209, y1: 353 };
const EAGLE_BODY_BBOX = { x0: 67, y0: 69, x1: 346, y1: 397 };
const WOLF_BODY_BBOX = { x0: 77, y0: 93, x1: 345, y1: 263 };
const OCTOPUS_BODY_BBOX = { x0: 0, y0: 0, x1: 381, y1: 364 };

function playerBodyFromBBox(bbox) {
  return {
    width: (bbox.x1 - bbox.x0) * PLAYER_BODY_FRACTION,
    height: (bbox.y1 - bbox.y0) * PLAYER_BODY_FRACTION,
  };
}

// Retour utilisateur : "la hitbox de agarica est un poil trop épais" --
// PLAYER_BODY_FRACTION reste partagé par les 4 formes (cf. son commentaire
// "cohérente PAR CONSTRUCTION... aucune n'a besoin d'un chiffre choisi à la
// main"), donc pas touché ici pour ne pas re-modifier Loup/Aigle/Pieuvre en
// même temps -- ce resserrement supplémentaire, "un poil" (0.9), ne
// s'applique qu'à la LARGEUR du corps de collision passive d'Agarica.
// N'affecte PAS getAttackHitbox() (zone = arc affiché, cf. SLASH_ARCS).
// Retour utilisateur (round suivant) : "toujours un trop épaisse" -- resserré
// une seconde fois, plus franchement que le "un poil" (0.9) d'origine.
const AGARICA_BODY_WIDTH_FRACTION = 0.7;
const AGARICA_BODY = playerBodyFromBBox(AGARICA_BODY_BBOX);
AGARICA_BODY.width *= AGARICA_BODY_WIDTH_FRACTION;

// Retour utilisateur (même round) : "et trop derrière elle, avance la
// hitbox vers l'avant d'agarica" -- Arcade Physics ne mire JAMAIS
// `body.offset` avec flipX (vérifié empiriquement : offset/bodyX identiques
// entre facingDir=-1 et +1, seul le rendu visuel mire) -- sans correction
// manuelle, la boîte reste au même endroit brut du canvas quel que soit le
// sens affiché, ce qui la fait paraître décalée vers l'arrière une fois
// tournée dans un sens. Appliqué en nudge post-hoc dans update() (cf. plus
// bas, juste après le bloc form==='agarica' qui pose l'offset centré de
// base/attaque/saut) plutôt que théoriquement dans offsetX ci-dessus : les 3
// variantes de hitbox d'Agarica (base, AGARICA_ATTACK_BODY, saut) partagent
// toutes un offsetX CENTRÉ sur un personnage lui-même centré dans son
// canvas — un même nudge signé (avant = vers x plus petit quand non-flippée,
// puisque la texture de base fait face à GAUCHE, cf. plus bas) s'applique
// donc correctement aux 3 sans dupliquer le calcul.
const AGARICA_BODY_FORWARD_SHIFT = 14;

const FORMS = {
  agarica: {
    texture: 'agarica-idle-0',
    scale: HUMAN_SCALE,
    frameWidth: 232,
    frameHeight: 357,
    body: AGARICA_BODY,
  },
  eagle: {
    texture: 'piaf-fly-0',
    scale: EAGLE_SCALE,
    frameWidth: PIAF_FRAME_WIDTH,
    frameHeight: PIAF_FRAME_HEIGHT,
    body: playerBodyFromBBox(EAGLE_BODY_BBOX),
  },
  wolf: {
    texture: 'loup-run-0',
    scale: WOLF_SCALE,
    frameWidth: WOLF_FRAME_WIDTH,
    frameHeight: WOLF_FRAME_HEIGHT,
    body: playerBodyFromBBox(WOLF_BODY_BBOX),
  },
  octopus: {
    texture: 'pieuvre-walk-0',
    scale: PIEUVRE_SCALE,
    frameWidth: PIEUVRE_FRAME_WIDTH,
    frameHeight: PIEUVRE_FRAME_HEIGHT,
    body: playerBodyFromBBox(OCTOPUS_BODY_BBOX),
  },
};

for (const cfg of Object.values(FORMS)) {
  cfg.body.offsetX = (cfg.frameWidth - cfg.body.width) / 2;
  cfg.body.offsetY = cfg.frameHeight - cfg.body.height;
}

// Hitbox du loup pendant le croc, affiché à WOLF_BITE_SCALE : la MÊME boîte
// monde que la course (taille en px de texture × WOLF_SCALE / WOLF_BITE_SCALE,
// centrée, pieds en bas). Le visuel rapetisse, le corps physique ne bouge pas :
// aucun mur ni plafond ne peut le coincer à la fin du coup.
const WOLF_BITE_BODY = (() => {
  const k = WOLF_SCALE / WOLF_BITE_SCALE;
  const width = FORMS.wolf.body.width * k;
  const height = FORMS.wolf.body.height * k;
  return { width, height, offsetX: (WOLF_FRAME_WIDTH - width) / 2, offsetY: WOLF_FRAME_HEIGHT - height };
})();

// Hitbox pendant une anim de transfo (Loup ou Aigle) : `setForm()` a déjà
// posé la hitbox de la forme CIBLE (cf. plus bas, ex: 55x105 pour le Loup à
// WOLF_SCALE) au moment où `this.form` change, mais la transfo affiche pour
// ~150-267ms une texture totalement différente (canvas et échelle propres,
// TRANSFO_WOLF_SCALE/TRANSFO_SCALE) — sans recalcul, la hitbox reste celle
// de la forme cible alors que le visuel affiché ne lui correspond plus du
// tout, d'où le décalage/enfoncement dans le sol observé pile pendant la
// transfo. Même principe que FORMS ci-dessus (gabarit fixe affiché, cf.
// TRANSFO_BODY_MIN_WIDTH/HEIGHT plus bas), appliqué au canvas/échelle de la
// transfo plutôt qu'à ceux de la forme cible.
//
// `originX` (0.5 par défaut) : la formule d'offsetX suppose que le corps est
// CENTRÉ horizontalement sur le canvas (vrai pour Loup/Aigle/Pieuvre/Ours).
// SKILL_DEFS.crapaud réutilise cette fonction mais son canvas est bien plus
// large et aligné à GAUCHE (cf. CRAPAUD_ORIGIN_X dans Crapaud.js) -- avec le
// défaut 0.5, la hitbox se retrouvait centrée sur le vide au milieu du
// canvas, à ~140px du corps réellement affiché, la décrochant du sol
// pendant toute la compétence ("l'attaque du crapaud se téléporte dans le
// sol"). Passer CRAPAUD_ORIGIN_X ici recale offsetX sur le même point
// d'ancrage que `setOrigin()`, comme pour les autres formes.
// Gabarit fixe (22x42 affichés) devenu plus PETIT que les 4 formes réelles
// depuis leur passage d'un gabarit choisi à la main à une hitbox dérivée du
// contenu réel des textures (cf. PLAYER_BODY_FRACTION plus haut -- ce
// commentaire n'a jamais été mis à jour en même temps). Retour utilisateur
// (persistant, reformulé plus précisément une 2e fois : "au moment de la
// transfo la hitbox se desactive ou s'actualise donc je passe à travers les
// murs pendant quelques frames") : un corps aussi petit, déplacé à pleine
// vitesse de sprint pendant tout le ~267ms de chaque transfo Loup, franchit
// plus facilement un mur fin avant que la séparation Arcade (cf. overlapBias
// dans main.js) n'ait la profondeur de chevauchement nécessaire pour agir.
// Repris sur le gabarit HUMAIN (le plus petit des 4 formes réelles) plutôt
// qu'un nouveau chiffre au pif : ne descend plus jamais sous ce qu'Agarica
// porte déjà en marche normale.
const TRANSFO_BODY_MIN_WIDTH = FORMS.agarica.body.width * HUMAN_SCALE;
const TRANSFO_BODY_MIN_HEIGHT = FORMS.agarica.body.height * HUMAN_SCALE;

function transfoBodyConfig(frameWidth, frameHeight, scale, originX = 0.5) {
  const width = TRANSFO_BODY_MIN_WIDTH / scale;
  const height = TRANSFO_BODY_MIN_HEIGHT / scale;
  return { width, height, offsetX: originX * frameWidth - width / 2, offsetY: frameHeight - height };
}
const TRANSFO_WOLF_BODY = transfoBodyConfig(TRANSFO_WOLF_FRAME_WIDTH, TRANSFO_WOLF_FRAME_HEIGHT, TRANSFO_WOLF_SCALE);
const TRANSFO_EAGLE_BODY = transfoBodyConfig(TRANSFO_FRAME_WIDTH, TRANSFO_FRAME_HEIGHT, TRANSFO_SCALE);
const TRANSFO_PIEUVRE_BODY = transfoBodyConfig(TRANSFO_PIEUVRE_FRAME_WIDTH, TRANSFO_PIEUVRE_FRAME_HEIGHT, TRANSFO_PIEUVRE_SCALE);
const TRANSFO_WOLF_EAGLE_BODY = transfoBodyConfig(TRANSFO_WOLF_EAGLE_FRAME_WIDTH, TRANSFO_WOLF_EAGLE_FRAME_HEIGHT, TRANSFO_WOLF_EAGLE_SCALE);

// --- Emplacements de formes (démo histoire) -------------------------------
// SOL = loup, AÉRIEN = singe OU aigle (exclusifs, choisis au feu de camp),
// EAU = pieuvre. `equippedForms` garde son format historique (tableau de 3,
// lu par LevelKit : sanctuaires, triche Ctrl+Shift+D) mais est normalisé en
// [sol, aérien, eau] ; `airForm` (registre) mémorise le choix aérien.
// Décision utilisateur : « le papillon ne doit être qu'une compétence, pas
// remplacer le double saut ». Plus de forme aérienne papillon (l'ancien
// battement + dash en diagonale est retiré) : seuls le singe et l'aigle
// donnent le 2e saut. Le papillon reste la compétence de soin (SKILL_DEFS,
// Projectiles.js), avec sa courte pose d'incantation (startSkillFormPose).
// Familles (2026-11-12) : l'ours-hibou est une 3e forme aérienne ; au sol, le
// grizzly peut prendre la place du loup (exclusifs, comme les formes aériennes).
const AIR_FORM_IDS = ['eagle', 'monkey', 'owlbear'];
const GROUND_FORM_IDS = ['wolf', 'grizzly'];
// Anciennes formes aériennes encore présentes dans de vieilles sauvegardes
// (`airForm`, `equippedForms`) : migrées au chargement vers la forme
// aérienne débloquée restante (cf. resolveInitialAirForm).
const OBSOLETE_AIR_FORM_IDS = ['butterfly'];
const FORM_FLAG_BY_ID = {
  wolf: 'hasWolfForm', eagle: 'hasEagleForm', monkey: 'hasMonkeyForm', octopus: 'hasOctopusForm',
  grizzly: 'hasGrizzlyForm', owlbear: 'hasOwlbearForm',
};
// --- Pose PAPILLON de la compétence de soin ---------------------------------
// Durée de la transformation humaine -> papillon (art `transfo_papillon`,
// recréée à cette durée) : la phase 'in' de SKILL_FORM_POSE_MS.papillon.
const BUTTERFLY_TRANSFO_MS = 180;
// Images de la pose papillon tirées de son horloge (et non jouées par
// l'anim) : un ralenti (juiceSlowMo du soin de Ghil't) ne coupe plus
// l'incantation, et chaque image de la transfo est montrée. Échelle et
// hauteur passent progressivement de celles d'Agarica (1re image de la
// transfo, pieds au sol) à celles du papillon de l'incantation (dernière) :
// plus de saut de taille (×1,46 avant) ni de pieds décollés (12 px).
// Étincelles d'ailes (`fx_etincelle_papillon`, recette 'wingDust') pendant
// l'incantation, toutes les BUTTERFLY_DUST_EVERY_MS ; petite lueur douce au
// début de la transfo et au retour à la forme humaine (fondu de silhouette).
const BUTTERFLY_DUST_EVERY_MS = 110;
const BUTTERFLY_POSE_GLOW = { size: 96, color: 0xf3dcff, alpha: 0.45, ms: 300 };
// Poussière lumineuse de la pose (centrée sur le buste, pas aux pieds).
const BUTTERFLY_CENTER_ABOVE_FEET = 38;
const BUTTERFLY_DUST_COLORS = [0x9ff3ff, 0x6fd8ff, 0xffb3f0, 0xfff6a0];
// Taille à l'écran d'une étincelle peinte `fx_etincelle_papillon` (px).
const BUTTERFLY_SPARKLE_ART_SIZE = 16;
const BUTTERFLY_PH_KEY = 'butterfly-ph';
const ANIM_BUTTERFLY_PH_KEY = 'butterfly-ph-flap';
const BUTTERFLY_PH_SIZE = { w: 60, h: 52 };

// Placeholder du papillon (tant que `forme_papillon` n'existe pas) : 4
// textures dessinées par code, ailes plus ou moins ouvertes (battement).
function ensureButterflyPlaceholder(scene) {
  if (scene.anims.exists(ANIM_BUTTERFLY_PH_KEY)) return;
  const { w, h } = BUTTERFLY_PH_SIZE;
  const opens = [1, 0.7, 0.35, 0.7];
  opens.forEach((open, i) => {
    const key = `${BUTTERFLY_PH_KEY}-${i}`;
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const cx = w / 2;
    const cy = h / 2;
    for (const side of [-1, 1]) {
      // Aile haute (cyan, liseré bleu) et aile basse (rose), vues de profil :
      // largeur = ouverture du battement.
      g.fillStyle(0x2a6fd8, 1);
      g.fillEllipse(cx + side * 13 * open, cy - 8, 26 * open + 4, 30);
      g.fillStyle(0x9ff3ff, 1);
      g.fillEllipse(cx + side * 13 * open, cy - 8, 22 * open + 2, 25);
      g.fillStyle(0xffb3f0, 1);
      g.fillEllipse(cx + side * 10 * open, cy + 10, 17 * open + 3, 17);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(cx + side * 15 * open, cy - 14, 2.5);
    }
    g.fillStyle(0x3a1d5a, 1);
    g.fillEllipse(cx, cy + 2, 6, 26);
    g.lineStyle(1.5, 0x3a1d5a, 1);
    g.lineBetween(cx, cy - 10, cx + 7, cy - 22);
    g.lineBetween(cx, cy - 10, cx - 2, cy - 23);
    g.generateTexture(key, w, h);
    g.destroy();
  });
  scene.anims.create({
    key: ANIM_BUTTERFLY_PH_KEY,
    frames: opens.map((_, i) => ({ key: `${BUTTERFLY_PH_KEY}-${i}` })),
    frameRate: 18,
    repeat: -1,
  });
}
// Retour utilisateur : SANS forme aérienne (ni singe ni aigle dans
// l'emplacement aérien), Agarica ne fait qu'UN saut -- l'ancien « double saut
// de base » (-450, petit nuage) est retiré. Le 2e saut n'existe qu'avec le
// singe (saut court + lianes) ou l'aigle (saut haut + plané). Singe : plus
// court que l'Aigle (eagleJumpVelocity = -550, inchangé : les anciennes zones
// sont calibrées dessus).
const MONKEY_JUMP_VELOCITY = -500;
// Tolérance de bord (« coyote time ») : un saut demandé juste après avoir
// quitté le sol SANS sauter (pas de trop au bord d'une plateforme) compte
// encore comme un saut au sol. Sans forme aérienne, c'est la seule façon de
// sauter en l'air -- sans elle, rater le bord d'un pixel ne laisse plus rien.
// Retour joueurs (2026-11-08 : « deux fois que je tombe, quand même ») :
// fenêtre mesurée au pilote à 103-120 ms (scratchpad exp_coyote.py), soit
// ~21 px de marche après le bord ; portée à 140 ms (~27 px à la marche, ~55 px
// en sprint de loup) : plus tolérante pour qui découvre, sans saut « dans le
// vide » visible (Agarica n'est descendue que de ~13 px à 140 ms).
const JUMP_COYOTE_MS = 140;
// Tampon de saut (« jump buffer », passage juice) : un appui sur Espace en
// l'air qui ne fait RIEN (aucun saut aérien disponible) déclenche le saut au
// sol s'il arrive dans les 120 ms avant l'atterrissage -- sinon l'appui
// fait juste avant de toucher le sol était perdu.
const JUMP_BUFFER_MS = 120;
// Saut à hauteur variable (retour des joueuses du 2026-11-09 : « un petit
// saut, comme Hollow Knight/Ori, ça fluidifie le déplacement ») : relâcher
// Espace pendant la montée d'un saut lancé par Espace (au sol, ou 2e saut du
// singe / de l'aigle) ramène la vitesse de montée à JUMP_CUT_VY. Tenu
// jusqu'au sommet, rien ne change : même hauteur qu'avant (~178 px au sol),
// les niveaux sont calés dessus. Appui bref (~100 ms) : ~85 px, soit plus
// d'une case ; le plus court (une image) : ~35 px. Le lâcher de liane, le
// rebond (pogo) et les courants d'air ne sont jamais coupés.
const JUMP_CUT_VY = 240;
// Lianes (retour du 2026-11-09 : « le singe s'accroche tout seul, ça m'a
// gênée contre le boss ») : on s'accroche en appuyant sur Z/↑ près d'une
// liane, ou en le tenant en passant. Un appui fait jusqu'à ce délai AVANT
// d'arriver à portée compte encore (appui un poil trop tôt).
const VINE_GRAB_BUFFER_MS = 200;
// Juice (visuel seul) : couleurs des éclats de transformation par forme.
const FORM_FX_COLORS = {
  agarica: 0xff9fc9, wolf: 0x7dfcd8, eagle: 0xfff1c0, monkey: 0xa8e07a, octopus: 0x9fe3ff,
  grizzly: 0xd9a441, owlbear: 0xe8c890,
};
// Même idée en sortant de l'eau (forme pieuvre) : la nage s'arrête
// `waterGraceMs` après la surface ; un saut dans cette fenêtre fait sortir
// de l'eau (avant, c'était le « double saut de base » qui s'en chargeait).
const WATER_EXIT_JUMP_MS = 350;
// Vitesse maximale du corps pendant le balancement (la liane impose sa
// vitesse à chaque pas de physique, cf. stepVinePhysics) ; hors liane, la
// chute reste plafonnée à PLAYER_MAX_FALL_SPEED (setMaxVelocity du constructeur).
const VINE_BODY_MAX_SPEED = 2400;
const PLAYER_MAX_FALL_SPEED = 900;
// Poses de liane (art `singe`, cf. applyVinePose) : sens = sens du balancement
// dès que la vitesse angulaire dépasse ce seuil (hystérésis aux extrêmes, où
// elle s'annule) ; inclinaison du dessin = fraction de l'angle de la liane.
const VINE_LOOK_OMEGA = 0.35;
const VINE_ART_TILT = 0.55;
// Grimpe le long de la liane : une prise de main tous les 18 px parcourus,
// le dessin remontant de 3 px au plus fort de la traction (repli sans art `climb`).
const VINE_CLIMB_STEP_PX = 18;
const VINE_CLIMB_BOB_PX = 3;
// Pose de grimpe tenue tant que les mains ont bougé dans ce délai (ms) : plus
// long que l'écart entre deux pas de physique (16,7 ms, parfois une image de
// plus), pour couvrir les images affichées sans pas de physique (cf.
// stepVinePhysics) ; assez court pour que la pose suspendue revienne net à
// l'arrêt en haut ou en bas de la liane.
const VINE_CLIMB_POSE_HOLD_MS = 50;
// Passage pose suspendue (1 bras, anim lente) <-> poses de balancement (2 bras,
// choisies selon la phase) : seuils d'entrée et de sortie distincts, sinon la
// pose clignote quand le balancement s'éteint.
const VINE_SWING_POSE_ENTER = { omega: 1.0, angle: 0.35 };
const VINE_SWING_POSE_EXIT = { omega: 0.45, angle: 0.18 };
// Art Codex (manifest `singe`, `agarica_extra`) dessiné face à DROITE,
// contrairement à la feuille humaine historique (face à gauche).
const MONKEY_FACES_RIGHT = true;
const AGARICA_EXTRA_FACES_RIGHT = true;
const MONKEY_TRANSFO_MS = 200;
// Salto du lâcher (`release_flip`, 5 frames à 14 fps) : tenu jusqu'au bout,
// sinon il était coupé à la 3e frame (saut de pose visible).
const MONKEY_RELEASE_POSE_MS = 360;
const HURT_POSE_MS = 300;
// Transitions d'animation adoucies (retour joueurs 2026-11-08 : « certaines
// transitions d'animation sont brusques »). Repérées en jeu, les pires :
//  1. réception du loup : la pose `loup-jump-3` ne durait qu'UNE image (16 ms,
//     un flash) -> durée minimale WOLF_LAND_POSE_MS ;
//  2. fin d'une transformation (sortie du loup, de l'aigle, de la pieuvre,
//     du singe) : la dernière image de la transfo cédait d'un coup la place à
//     la forme cible, à une autre échelle -> fondu enchaîné court ;
//  3. fin d'un coup (arc de dague, morsure) : retour sec à la marche / au
//     repos -> fondu enchaîné court ;
//  4. réception humaine : pose de chute -> repos/marche d'une image à l'autre
//     -> fondu enchaîné court.
// Fondu enchaîné = copie de l'image d'avant posée PAR-DESSUS Agarica, qui
// s'efface en suivant ses pas (cf. poseCrossfade) : purement visuel, aucune
// durée de jeu (hitbox, temps d'attaque) n'est changée.
const WOLF_LAND_POSE_MS = 110;
const POSE_XFADE_TRANSFO_MS = 110;
const POSE_XFADE_ATTACK_MS = 90;
const POSE_XFADE_LAND_MS = 80;
// Invulnérabilité après un coup (cf. hitByEnemy) : durée totale, et
// clignotement pendant la partie qui suit le flash rouge.
const HIT_INVULN_MS = 950;
const HIT_BLINK_MS = 90;
const HIT_BLINK_ALPHA = 0.35;
// Chute dans le vide (cf. startFallOut, et updateStoryFall dans StoryKit) :
// vitesse de chute minimale une fois la chute engagée, pour qu'Agarica sorte
// franchement par le bas de l'écran (en plané d'aigle, elle le traversait
// sinon au ralenti).
const FALL_OUT_MIN_VY = 520;
const THROW_POSE_MS = 220;
// Compétences « avec la forme » (cf. startSkillFormPose) : durées des phases
// transfo -> geste -> transfo inverse (ms) ; `releaseAt` = fraction du geste
// où la pierre quitte la main. Pierre ~0,56 s, papillon ~0,74 s (sous son
// délai de 1 s) : courtes mais lisibles. Papillon (lot n°10) : 4 images de
// transfo en 180 ms (130 avant : une image sur deux sautait), les 4 images
// de l'incantation en 400 ms (leur rythme peint, 10 i/s), retour en 160 ms ;
// même total de 740 ms (nuée, énergie et délai inchangés).
const SKILL_FORM_POSE_MS = {
  pierre: { in: 150, act: 260, out: 150, releaseAt: 0.45 },
  papillon: { in: 180, act: 400, out: 160, releaseAt: 0 },
};
// Papillon du soin : centre du dessin au-dessus des pieds = centre de la nuée
// pendant le battement (cf. PapillonSwarm, Projectiles.js).
const SKILL_BUTTERFLY_CENTER_ABOVE_FEET = 48;

// Écrit une clé persistante : storySet (sauvegarde auto, Fondation) si
// disponible, sinon le registre Phaser brut.
function playerStateSet(scene, key, value) {
  if (typeof storySet === 'function') storySet(key, value);
  else scene.registry.set(key, value);
}

// Config de forme bâtie depuis le manifest (texture réelle ou placeholder) :
// hitbox au gabarit HUMAIN affiché (cf. transfoBodyConfig), pas de bbox
// mesurée tant que l'art n'existe pas -- même jeu de hitbox avec ou sans art.
function manifestFormConfig(scene, id, anim) {
  const tex = manifestInitialTexture(scene, id, anim);
  const src = scene.textures.get(tex).getSourceImage();
  const def = getAssetManifest()[id] || {};
  const scale = def.scale || 1;
  return {
    texture: tex, scale, frameWidth: src.width, frameHeight: src.height,
    body: transfoBodyConfig(src.width, src.height, scale),
  };
}

// « Poing » d'une texture (point le plus haut de la silhouette : la main levée
// des poses suspendues), en px du canvas, mis en cache. Sert à caler l'art
// Codex suspendu sur la prise de la liane (cf. applyVineArtAnchor). Lecture
// des pixels : frameAlphaMap / frameVisibleBounds (calibrage visuel, LevelKit).
const TEXTURE_FIST_CACHE = new Map();
function textureAlphaInfo(scene, key) {
  if (TEXTURE_FIST_CACHE.has(key)) return TEXTURE_FIST_CACHE.get(key);
  let info = null;
  const frame = scene.textures.exists(key) ? scene.textures.getFrame(key) : null;
  const b = frame ? frameVisibleBounds(frame) : null;
  const map = frame ? frameAlphaMap(frame) : null;
  if (b && map && !b.empty) {
    let sx = 0;
    let n = 0;
    for (let y = b.y0; y < Math.min(map.h, b.y0 + 20); y++) {
      for (let x = 0; x < map.w; x++) if (map.alpha[y * map.w + x] > VISIBLE_ALPHA_MIN) { sx += x; n++; }
    }
    info = { w: b.frameW, h: b.frameH, top: b.y0, bottom: b.y1 - 1, fistX: sx / n, fistY: b.y0 + 10 };
  }
  TEXTURE_FIST_CACHE.set(key, info);
  return info;
}

// Boîte des pixels visibles d'une texture, en px du canvas : enveloppe de
// visibleBounds (LevelKit) au format historique { x0, y0, x1, y1, w, h }
// (w/h = taille du CANVAS). Sert à caler la zone de coup sur l'arc dessiné.
function textureOpaqueBox(scene, key) {
  const b = visibleBounds(scene, key);
  if (!b || b.empty) return null;
  return { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, w: b.frameW, h: b.frameH };
}

// Échelle d'une pose d'Agarica tirée d'une feuille Codex : la FEUILLE entière
// (cf. manifestSheetScale / calibratedScale) prend la même taille apparente
// que l'idle humaine (agarica-idle-0 à HUMAN_SCALE) -- debout neutre alignée
// en hauteur, sinon surface visible. `death` (couchée) prend ainsi l'échelle
// de `talk` (debout, même image), les coups en fente celle de leur surface.
// `method: 'area'` pour les formes animales (singe, papillon) : même « masse »
// visible qu'Agarica. Repli sans art ni pixels lisibles : `fallback`.
function agaricaSheetScale(scene, id, anim, fallback, opts = {}) {
  const r = manifestSheetScale(scene, id, anim, { refKey: 'agarica-idle-0', refScale: HUMAN_SCALE, ...opts });
  return r ? r.scale : fallback;
}

// Config échelle + hitbox (gabarit humain, cf. transfoBodyConfig) d'une
// rangée du manifest calibrée par feuille ; mise en cache par scène.
function agaricaSheetPoseConfig(scene, id, anim, opts = {}) {
  scene.__agaricaPoseCfg = scene.__agaricaPoseCfg || {};
  const ck = `${id}|${anim}|${opts.method || 'auto'}`;
  let cfg = scene.__agaricaPoseCfg[ck];
  if (!cfg) {
    const base = manifestFormConfig(scene, id, anim);
    const scale = agaricaSheetScale(scene, id, anim, base.scale, opts);
    cfg = { ...base, scale, body: transfoBodyConfig(base.frameWidth, base.frameHeight, scale) };
    scene.__agaricaPoseCfg[ck] = cfg;
  }
  return cfg;
}

// Joue `${id}-${anim}` si l'anim manifest existe, sinon pose la texture de
// repli (placeholder) : le jeu marche à l'identique avec ou sans art.
function playManifestOn(sprite, id, anim) {
  const key = `${id}-${anim}`;
  if (sprite.scene.anims.exists(key)) {
    // Anim non bouclée déjà jouée jusqu'au bout : on garde sa dernière frame
    // (sinon play() la relancerait à chaque frame, cf. formTransitionActive).
    const cur = sprite.anims.currentAnim;
    if (cur && cur.key === key && !sprite.anims.isPlaying) return;
    sprite.anims.play(key, true);
  } else {
    sprite.anims.stop();
    sprite.setTexture(manifestInitialTexture(sprite.scene, id, anim));
  }
}

// Vie/énergie/compétences (FEAT modif.txt) : cœurs + énergie + des
// compétences actives, une par type d'animal à terme (félin/canidé/
// oursidé/oiseau/reptile — même taxonomie que les futurs totems façon
// Inscryption, pas encore construits, qui booteront un de ces 5 types ;
// ATTENTION à ne pas confondre avec TOTEM_TYPE_BY_FLAG dans LevelKit.js,
// un système SÉPARÉ et déjà existant qui débloque les 3 formes de
// déplacement wolf/eagle/octopus via des sanctuaires -- rien à voir avec
// ces skills). Seule "Ours" est définie ici : demande explicite de
// l'utilisateur ("pour les compétences attend que je décide des quels
// mettre moi même") -- ne PAS ajouter félin/canidé/oiseau/reptile ici tant
// qu'il n'a pas donné leurs specs (coût/forme de zone/etc), même si le
// menu feu de camp et tryActivateSkill sont déjà prêts à en accueillir
// d'autres sans changement de code (cf. plus bas), juste par ajout d'une
// entrée à cette table.
const HEART_MAX = 3;
const ENERGY_MAX = 100;
// "Portion faible" par coup porté (retour utilisateur, façon SOUL de Hollow
// Knight) : ~8 coups pour remplir la barre depuis vide, sans compter la
// recharge complète au feu de camp (cf. CAMPFIRE_REFILL dans LevelKit.js).
const ENERGY_PER_HIT = 12;

// Art dédié de la compétence Ours ("fracas au sol", cf. SKILL_DEFS
// ci-dessous) : 6 frames individuelles générées depuis
// assets/sprites/compétence/ours.png via tools/crop_ours_skill.py --
// PAS tools/split_spritesheet.py habituel, parce que les éclats de
// pierre/débris de l'impact sont disjoints (par un vrai trou transparent)
// de la silhouette de l'ours dans l'image source, ce qui fait exploser le
// découpage par composantes connexes standard en dizaines de micro-frames.
// L'ordre de lecture naturel de la planche (gauche->droite, haut->bas) est
// directement l'ordre de l'animation, aucun remapping nécessaire : pose
// neutre -> levée de patte (amorce) -> 1er impact -> gerbe de débris ->
// gerbe plus large -> retombée/poussière.
const OURS_FRAME_WIDTH = 705;
const OURS_FRAME_HEIGHT = 396;
const OURS_ANIM_FRAME_COUNT = 6;
// Cf. FORMS plus bas pour la logique générale : hitbox ramenée au même
// gabarit HUMAIN que toutes les autres formes/transfos (transfoBodyConfig,
// défini plus haut, cf. TRANSFO_BODY_MIN_WIDTH/HEIGHT), silhouette affichée
// bien plus grande -- l'Ours doit
// paraître imposant (c'était déjà l'intention du placeholder teinte+
// agrandissement x1.3 qu'il remplace). Retour utilisateur : "l'attaque de
// l'ours est un peu trop petite vraiment un peu" -- trim minime (0.32 -> 0.34).
const OURS_SCALE = 0.34;
const ANIM_OURS_SLAM_KEY = 'ours-slam';
const OURS_SKILL_BODY = transfoBodyConfig(OURS_FRAME_WIDTH, OURS_FRAME_HEIGHT, OURS_SCALE);
// Doit rester cohérente avec le frameRate de l'anim créée dans
// ensureOursAnimations plus bas (cf. SKILL_DEFS.ours.attackDurationMs, qui
// s'en sert pour savoir quand lancer la transfo de sortie inverse). Retour
// utilisateur après le retrait du ralenti debug : "transfo et attaque un
// peu rapide" -- ralentie modestement (12 -> 10fps).
const OURS_ATTACK_FRAME_RATE = 10;
const OURS_ATTACK_DURATION = Math.round((OURS_ANIM_FRAME_COUNT / OURS_ATTACK_FRAME_RATE) * 1000);

function oursAnimFrames() {
  return Array.from({ length: OURS_ANIM_FRAME_COUNT }, (_, i) => ({ key: `ours-${i}` }));
}

// Transformation humaine <-> Ours, jouée AVANT l'anim d'attaque elle-même
// au lancement de la compétence (demande explicite : "les frame de
// transformation humain>ours a mettre quand on lance l'attaque avant
// l'anime d'attaque") : générées depuis
// assets/sprites/transformation/transfo_ours.png (4 poses sur la planche,
// mais la 4e -- l'ours complet -- n'est PLUS utilisée dans l'anim, cf.
// TRANSFO_OURS_FRAME_COUNT ci-dessous : "vire la dernière image des transfo
// finalement", après plusieurs allers-retours infructueux sur sa taille --
// le fichier reste sur le disque, juste plus chargé/utilisé). Contrairement
// à la planche d'attaque ci-dessus, la silhouette y est d'un seul tenant à
// chaque pose (pas de débris disjoints) -- le découpage standard
// tools/split_spritesheet.py suffit, pas besoin d'un script dédié.
const TRANSFO_OURS_FRAME_COUNT = 3;
const TRANSFO_OURS_FRAME_WIDTH = 738;
const TRANSFO_OURS_FRAME_HEIGHT = 493;
// Historique de la taille finale (frame 3, l'ours complet) avant de la
// caler directement sur OURS_SCALE (cf. TRANSFO_OURS_FRAME_SCALES plus
// bas) : 0.28 -> 0.20 -> 0.16 -> 0.12 -> 0.15, une valeur propre
// (TRANSFO_OURS_SCALE) indépendante de l'échelle de l'attaque -- abandonnée
// une fois établi que la transfo doit grandir JUSQU'À la taille de
// l'attaque plutôt que vers une taille "propre" à elle, cf. plus bas.
const ANIM_TRANSFO_TO_OURS_KEY = 'transfo-to-ours';
// Retour humaine, jouée APRÈS l'anim d'attaque (demande explicite : "pense
// a mettre l'animation de transformation a l'envers apres l'attaque pour
// me retransformer en humain") -- mêmes 4 frames, ordre inversé, exactement
// comme ANIM_TRANSFO_TO_HUMAN_FROM_WOLF_KEY/_EAGLE_KEY/_OCTOPUS_KEY plus
// haut pour les autres formes.
const ANIM_TRANSFO_FROM_OURS_KEY = 'transfo-from-ours';
// Échelle CROISSANTE d'une frame à l'autre (retour utilisateur : "il faut
// que les images de transformation de l'ours augmante l'une plus que la
// precedente") -- indexée par le SUFFIXE NUMÉRIQUE de la texture affichée
// (transfo-ours-0..3, cf. getTransfoOursFrameIndex plus bas), pas par la
// position dans la séquence d'anim : comme la sortie (ANIM_TRANSFO_FROM_OURS_KEY)
// rejoue les mêmes textures dans l'ordre inverse (3,2,1,0), indexer par
// texture plutôt que par position d'anim fait RÉTRÉCIR automatiquement la
// sortie en sens inverse (l'Ours qui redevient humaine reprend la même
// courbe de taille, sans code dédié).
// Historique : [0.08, 0.1, 0.13, 0.15] -> [0.12, 0.13, 0.14, 0.15] ->
// [0.135, 0.14, 0.145, 0.15] -- resserrements successifs autour d'un
// maximum de 0.15, jusqu'à "elles sont toute trop petite la" (TOUTES,
// donc le maximum lui-même était en cause, pas juste la courbe). Question
// posée à l'utilisateur pour caler ce maximum sans re-deviner à l'aveugle
// une 6e fois : réponse "même taille que l'attaque" -- la dernière image
// de la transfo rejoint maintenant EXACTEMENT OURS_SCALE (0.32), donc plus
// aucun saut de taille au moment où l'anim d'attaque prend le relais.
// Retour ensuite : "la première est un poil trop petite et les autre de
// plus en plus 'trop grosse'" -- une progression LINÉAIRE grossit trop
// vite au milieu (l'aire perçue grandit avec le CARRÉ de l'échelle, pas
// linéairement) ; remplacée par une courbe "ease-in" (petits pas au
// début, grand saut juste avant l'attaque) qui reste plus proche d'OURS_SCALE
// jusqu'à la toute dernière frame.
// Puis : "la première est a la bonne taille les autre sont vraiment trop
// grosse" -- ease-in encore accentué (frames 1/2 resserrées bien plus près
// de la frame 0, désormais confirmée correcte). Frame 3 d'abord laissée à
// OURS_SCALE (contrainte du retour "même taille que l'attaque"), question
// posée en retour à l'utilisateur -- confirmé ensuite : "la dernière image
// de la transformation est abusément trop grosse", donc "les autres" au
// pluriel incluait bien la frame 3. Découplée d'OURS_SCALE : priorité
// donnée à la taille de CETTE frame plutôt qu'à un raccord parfait avec
// l'anim d'attaque -- un saut de taille réapparaît donc au moment où
// l'attaque démarre (compromis accepté, contraire au retour précédent).
// Puis : "la dernière est encore un peu trop grosse" -- trim modeste
// (0.24 -> 0.21), frames 0-2 inchangées.
// Puis, finalement : "vire la dernière image des transfo" -- après ces
// nombreux essais sur SA taille, la frame 3 (l'ours complet) est retirée
// de la séquence plutôt que retunée encore une fois ; la transfo s'arrête
// maintenant sur la frame 2 (hybride avancée), juste 3 tailles.
const TRANSFO_OURS_FRAME_SCALES = [0.16, 0.17, 0.2];
const TRANSFO_OURS_FRAME_BODIES = TRANSFO_OURS_FRAME_SCALES.map(
  (scale) => transfoBodyConfig(TRANSFO_OURS_FRAME_WIDTH, TRANSFO_OURS_FRAME_HEIGHT, scale),
);

function getTransfoOursFrameIndex(sprite) {
  const key = sprite.anims.currentFrame && sprite.anims.currentFrame.textureKey;
  const match = /transfo-ours-(\d)/.exec(key || '');
  return match ? Number(match[1]) : 0;
}
// Plus rapide que les autres transfos Loup/Aigle/Pieuvre (15fps) -- retour
// utilisateur : "un peu lente". Puis, après le retrait du ralenti debug :
// "transfo et attaque un peu rapide" -- ralentie modestement (20 -> 16fps).
const TRANSFO_OURS_FRAME_RATE = 16;
const TRANSFO_OURS_DURATION = Math.round((TRANSFO_OURS_FRAME_COUNT / TRANSFO_OURS_FRAME_RATE) * 1000);
// Cadence de la SORTIE (retour humain, cf. ANIM_TRANSFO_FROM_OURS_KEY),
// désormais différente de l'entrée -- retour utilisateur : "la détransfo
// est un peu trop rapide" (l'entrée, elle, restait correcte à 16fps), puis
// "encore un poil rapide" -- encore un peu ralentie (12 -> 10fps).
const TRANSFO_OURS_EXIT_FRAME_RATE = 10;
const TRANSFO_OURS_EXIT_DURATION = Math.round((TRANSFO_OURS_FRAME_COUNT / TRANSFO_OURS_EXIT_FRAME_RATE) * 1000);

function transfoOursFrames(indices) {
  return indices.map((i) => ({ key: `transfo-ours-${i}` }));
}

// ANCIEN ours (2026-11-13) : l'ours brun refait (`ours_brun` au manifeste,
// branché par ursideRefreshBrownBear dans Ursides.js) le remplace. Ses images
// ne sont plus chargées que comme repli (feuille manquante, cf. BootScene) :
// ces trois anims ne sont créées que si elles le sont (createAnimIfLoaded).
function ensureOursAnimations(scene) {
  if (scene.anims.exists(ANIM_OURS_SLAM_KEY)) return;
  // 6 frames, calé pile sur SKILL_DEFS.ours.attackDurationMs -- jouée une
  // seule fois (repeat 0), tient sur la dernière frame (pose de retombée)
  // le temps que le reste de la fenêtre de transfo s'écoule.
  createAnimIfLoaded(scene, {
    key: ANIM_OURS_SLAM_KEY,
    frames: oursAnimFrames(),
    frameRate: OURS_ATTACK_FRAME_RATE,
    repeat: 0,
  });
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_TO_OURS_KEY,
    frames: transfoOursFrames([0, 1, 2]),
    frameRate: TRANSFO_OURS_FRAME_RATE,
    repeat: 0,
  });
  createAnimIfLoaded(scene, {
    key: ANIM_TRANSFO_FROM_OURS_KEY,
    frames: transfoOursFrames([2, 1, 0]),
    frameRate: TRANSFO_OURS_EXIT_FRAME_RATE,
    repeat: 0,
  });
}

// Définition des compétences actives (emplacements 1/2/3 côté données, cf.
// this.skillSlots -- touches A/F/R en jeu, cf. this.skillKeys) : chaque
// entrée sait combien elle coûte, combien de temps la fenêtre de dégâts +
// la transformation visuelle durent, et la
// forme de sa zone de dégâts. `hitboxOffsetX` (>= 0) décale la zone devant
// Agarica dans le sens où elle regarde (cf. tryActivateSkill) au lieu de
// la centrer sur elle -- 0 pour une zone symétrique comme celle de l'Ours.
// `animKey`/`scale`/`body`/`facesRight` (+ `transitionAnimKey` optionnel) :
// art dédié (cf. tryActivateSkill/update()) -- une compétence qui les
// fournit affiche une vraie silhouette animée au lieu du placeholder
// teinte+agrandissement (`tint`/`scaleMultiplier`, encore utilisé par une
// compétence qui n'a pas ces champs). `hudColor` : couleur de sa case dans
// le HUD bas-gauche (cf. drawHud dans LevelKit.js), indépendante de l'art
// en jeu. Futures compétences = juste une nouvelle entrée ici, aucune des
// méthodes ci-dessus n'a besoin de changer. Autres entrées : `crapaud`
// (Crapaud.js), `pierre` et `papillon` (Projectiles.js, compétences
// instantanées via `onActivate`, + `onHitEnemy` optionnel, cf. PLAN_DEV.md).
const SKILL_DEFS = {
  ours: {
    label: 'Ours — Fracas au sol',
    // Couleur de sa case dans le HUD bas-gauche (cf. drawHud dans
    // LevelKit.js) -- même brun que l'ancien placeholder teinte/
    // agrandissement, réutilisé ici pour la lettre plutôt qu'une vraie
    // icône dédiée (aucun art d'icône fourni pour l'instant).
    hudColor: 0x6b4226,
    cost: 35,
    // Fenêtre où getSkillHitbox() renvoie un rectangle actif (cf. plus bas)
    // -- courte, un seul "boum" plutôt qu'une zone qui dure.
    hitboxDurationMs: 120,
    // Délai avant que cette fenêtre ne s'ouvre : le temps de la
    // transformation (cf. transitionDurationMs ci-dessous) PUIS 2 frames de
    // l'anim d'attaque (fin de la levée de patte/tout début de l'impact) --
    // sans ce délai le coup partirait dès l'appui, avant même que l'Ours
    // ait fini de se former à l'écran. Dérivé d'OURS_ATTACK_FRAME_RATE
    // (pas un "165" en dur) pour rester en phase si sa cadence change.
    hitboxDelayMs: TRANSFO_OURS_DURATION + Math.round((2 / OURS_ATTACK_FRAME_RATE) * 1000),
    // Durée de l'anim d'attaque elle-même (cf. OURS_ATTACK_DURATION plus
    // haut) -- sert à `update()` pour savoir quand la fenêtre d'attaque se
    // termine et que la transfo de sortie (`transitionOutAnimKey`) doit
    // prendre le relais.
    attackDurationMs: OURS_ATTACK_DURATION,
    // Reste "transformée" jusqu'à la fin de la transfo de sortie : entrée
    // (transitionDurationMs) + attaque (attackDurationMs) + sortie -- cette
    // dernière a sa PROPRE durée (TRANSFO_OURS_EXIT_DURATION), plus lente
    // que l'entrée depuis "la détransfo est un peu trop rapide".
    transformDurationMs: TRANSFO_OURS_DURATION + OURS_ATTACK_DURATION + TRANSFO_OURS_EXIT_DURATION,
    // Zone horizontale au niveau du sol (demande explicite : "zone
    // horizontale au sol qui monte de quelques pixels", pas un rayon
    // circulaire) -- large des deux côtés d'Agarica, peu profonde.
    hitboxWidth: 220,
    hitboxHeight: 40,
    hitboxOffsetX: 0,
    // Jouée en premier (cf. update()) : transformation humaine -> Ours,
    // AVANT l'anim d'attaque (`animKey`) elle-même -- demande explicite de
    // l'utilisateur, cf. commentaire sur ANIM_TRANSFO_TO_OURS_KEY plus haut.
    transitionAnimKey: ANIM_TRANSFO_TO_OURS_KEY,
    transitionDurationMs: TRANSFO_OURS_DURATION,
    // Tableaux (pas une valeur unique) : échelle/hitbox CROISSANTES d'une
    // frame à l'autre, cf. TRANSFO_OURS_FRAME_SCALES/getTransfoOursFrameIndex
    // plus haut -- update() indexe dedans avec le numéro de la texture
    // affichée à l'instant T, pour l'entrée COMME la sortie.
    transitionScales: TRANSFO_OURS_FRAME_SCALES,
    transitionBodies: TRANSFO_OURS_FRAME_BODIES,
    // Jouée en DERNIER, après l'anim d'attaque (demande explicite : "pense
    // a mettre l'animation de transformation a l'envers apres l'attaque
    // pour me retransformer en humain") -- même tableaux de tailles que
    // l'entrée (indexés par texture, donc rétrécit automatiquement en sens
    // inverse), juste les frames jouées à l'envers.
    transitionOutAnimKey: ANIM_TRANSFO_FROM_OURS_KEY,
    animKey: ANIM_OURS_SLAM_KEY,
    scale: OURS_SCALE,
    body: OURS_SKILL_BODY,
    facesRight: true,
  },
};

// Totems (FEAT modif.txt) : une TÊTE (espèce) fusionnée à un CORPS (effet),
// équipés par glisser-déposer (OU clic-puis-clic) au feu de camp (cf.
// CampfireMenuScene dans LevelKit.js, qui mute `equippedTotem` directement).
// UN SEUL totem à la fois (demande explicite, revenue sur l'idée de cumul
// entre plusieurs totems évoquée plus tôt dans la session : "un seul totem
// au total") -- `equippedTotem` est un unique `{head, body}`, pas un
// tableau d'emplacements. Aucun art pour l'instant (l'utilisateur
// l'ajoutera plus tard, cf. sa demande) donc pas de fusion visuelle, juste
// le mécanisme. Liste des têtes volontairement large/ouverte (l'utilisateur
// : "etc, demande moi des idées") -- une simple entrée de tableau pour en
// ajouter, même si un seul totem à la fois rend le CHOIX de tête surtout
// cosmétique/thématique pour l'instant (aucun effet mécanique par tête,
// seul le corps compte, cf. recomputeTotemBonuses).
const TOTEM_HEADS = [
  'felin', 'canide', 'ourside', 'oiseau', 'reptile',
  'insecte', 'cervide', 'carnivore', 'herbivore',
];
// `statKey` : quelle stat calculée (cf. recomputeTotemBonuses) ce corps
// alimente. `perStack` : bonus par unité de compte d'espèce -- valeurs de
// départ, à ajuster une fois testées en jeu (comme les autres constantes
// de cette session, cf. mémoire du projet).
// `label` volontairement court (affiché sur une petite carte, cf.
// CampfireMenuScene) -- l'effet numérique exact se lit dans le résumé de
// bonus du menu, pas sur la carte elle-même.
const TOTEM_BODIES = {
  vie: { label: 'Vie', statKey: 'heartBonus', perStack: 1 },
  energie: { label: 'Énergie', statKey: 'energyBonus', perStack: 15 },
  degats: { label: 'Dégâts', statKey: 'skillSizeBonus', perStack: 0.15 },
};
// Démo : le système de totems est prévu APRÈS la démo (demande explicite :
// "lock la partie totem pour la démo, cadenas chaîne"). Tant que c'est vrai,
// recomputeTotemBonuses calcule comme si aucun totem n'était porté, SANS
// toucher à `equippedTotem` ni au registre (un totem équipé avant le verrou
// -- ancienne partie, tests -- reste sauvegardé). Depuis le 2026-11-08 (totems
// mis de côté tant qu'il y a peu de formes), le menu du feu de camp n'a plus
// de section totem du tout (cf. CAMPFIRE_SHOW_TOTEMS, CampfireMenuScene) :
// pour tout rouvrir, passer cette constante à `false` ET CAMPFIRE_SHOW_TOTEMS
// à `true`. Règle tenue ici, dans le joueur, plutôt qu'en remplaçant la
// méthode depuis le menu (patch invisible).
const DEMO_TOTEMS_LOCKED = true;

// Compétences INTERNES (2026-11-12) : même mécanique que SKILL_DEFS
// (transformation, animation, zone de dégâts), mais jamais dans un emplacement,
// ni débloquées, ni payées -- lancées par le jeu (Player.beginSkill). Ex. le
// fracas de l'ours-hibou à l'atterrissage (Ursides.js). Table à part : la triche
// Ctrl+Maj+D et le menu du feu parcourent SKILL_DEFS.
const INTERNAL_SKILL_DEFS = {};
function skillDefOf(id) {
  return (id && (SKILL_DEFS[id] || INTERNAL_SKILL_DEFS[id])) || null;
}

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    ensurePlayerAnimations(scene);
    ensurePieuvreAnimations(scene);
    super(scene, x, y, 'agarica-idle-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Origine ancrée aux pieds : `this.y` = position des pieds, quelle que
    // soit la taille de la frame active (voir commentaire sur FORMS).
    this.setOrigin(0.5, 1);
    // ... et plus précisément le bas VISIBLE des pieds, pour toutes les poses
    // (les planches gardent 4-9 px transparents sous les pieds : 1-3 px de
    // flottement à l'écran) ; le bas du corps physique y est recalé à chaque
    // image (cf. anchorVisibleFeet / syncBodyToVisibleFeet, LevelKit), donc
    // posée au sol : bas du corps = this.y = bas visible des bottes.
    anchorVisibleFeet(this, { body: true });

    this.setCollideWorldBounds(true);
    this.setMaxVelocity(400, PLAYER_MAX_FALL_SPEED);
    // Personnages devant les décors (props, totems, feux à 0), derrière les
    // plantes de premier plan (cf. CHARACTER_DEPTH dans LevelKit.js).
    this.setDepth(CHARACTER_DEPTH);
    // Retour utilisateur répété : "les hitbox bloquent mal, je passe à
    // travers, par dessous ou les côtés". Confirmé isolé à un vrai
    // comportement Arcade Physics : sans détection de collision continue,
    // un déplacement en un seul pas assez grand pour dépasser l'épaisseur
    // d'une tuile (64px) saute par-dessus SANS jamais qu'aucun overlap ne
    // soit détecté -- `overlapBias` (cf. main.js) n'aide que quand un
    // overlap existe déjà, pas dans ce cas précis (aucun overlap n'a jamais
    // lieu). `deltaMax` plafonne le déplacement par pas de physique
    // indépendamment de la vitesse/du framerate : sous ce plafond (48px,
    // sous la taille de tuile), impossible de sauter une tuile entière en
    // un seul pas. Sans effet perceptible en jeu normal (60fps stable
    // déplace largement moins que ça par frame de toute façon).
    this.body.deltaMax.set(48, 48);

    this.spawnX = x;
    this.spawnY = y;
    this.isInvulnerable = false;
    // Invulnérabilité de sortie de dialogue / cinématique (cf.
    // grantStoryInvulnerability) : armée au gel, minutée au dégel.
    this.storyInvulnPending = false;
    this.storyInvulnUntil = 0;
    this.storyInvulnBlink = null;

    // Capacités débloquées par sanctuaire (cf. addAbilityShrine dans
    // LevelKit.js) — persistées dans le registry Phaser (survit aux
    // changements de scène, contrairement à cette instance recréée à
    // chaque zone). Sans la capacité correspondante, sprinter ne déclenche
    // pas le Loup et un 2e saut en l'air ne déclenche pas l'Aigle.
    this.hasWolfForm = scene.registry.get('hasWolfForm') || false;
    this.hasEagleForm = scene.registry.get('hasEagleForm') || false;
    this.hasOctopusForm = scene.registry.get('hasOctopusForm') || false;
    // Formes ÉQUIPÉES (menu feu de camp, glisser-déposer, cf. LevelKit.js
    // CampfireMenuScene) : SÉPARÉ de hasXForm ci-dessus, qui reste "a été
    // découverte au moins une fois" (jamais remis à false). Demande
    // explicite de l'utilisateur : un vrai choix fonctionnel, pas juste
    // visuel -- une forme débloquée mais pas équipée ne se déclenche plus
    // du tout en jeu (cf. formEquipped() et ses appels dans update()).
    // 3 emplacements pour 3 formes : pas de pénurie forcée (aurait pu
    // bloquer un passage qui suppose une forme précise, ex. le grand vide
    // de Zone2 qui exige l'Aigle) -- le choix reste réel (rien n'empêche
    // de déséquiper une forme) sans risque de blocage si les 3 sont
    // débloquées.
    this.equippedForms = scene.registry.get('equippedForms') || [null, null, null];
    // Forme singe (démo histoire) + emplacement aérien (cf. AIR_FORM_IDS).
    this.hasMonkeyForm = scene.registry.get('hasMonkeyForm') || false;
    // Ours du premier test des familles (cf. Ursides.js) : grizzly (sol) et
    // ours-hibou (aérien). Débloqués par la zone de test, rien dans l'histoire.
    this.hasGrizzlyForm = scene.registry.get('hasGrizzlyForm') || false;
    this.hasOwlbearForm = scene.registry.get('hasOwlbearForm') || false;
    // Formes aériennes déjà connues à la création : seule une forme débloquée
    // EN COURS de jeu (totem, cinématique, triche) devient automatiquement
    // la forme aérienne active, cf. syncFormSlots(). (Plus de forme papillon :
    // `hasButterflyForm` d'une vieille sauvegarde reste au registre, ignoré.)
    this.airFormsSeen = { eagle: this.hasEagleForm, monkey: this.hasMonkeyForm, owlbear: this.hasOwlbearForm };
    this.airForm = this.resolveInitialAirForm(scene.registry.get('airForm'));
    this.applyAirForm(this.airForm);

    // Vie/énergie (cf. HEART_MAX/ENERGY_MAX plus haut) : persistées au
    // registry comme les capacités ci-dessus, jamais réinitialisées à
    // chaque nouvelle zone (perdre un cœur en Zone1 doit rester perdu en
    // Zone2). `?? ` (pas `||`) : 0 point de vie ou d'énergie est une valeur
    // valide, contrairement à `false` pour les flags de forme ci-dessus.
    this.hearts = scene.registry.get('hearts') ?? HEART_MAX;
    this.energy = scene.registry.get('energy') ?? 0;
    // Compétences actives : jusqu'à 3 emplacements (touches A/F/R,
    // demande explicite -- évite tout conflit avec les touches de
    // déplacement ZQSD/saut espace/attaque K/interaction E),
    // chacun soit vide (null) soit un id de compétence débloquée (cf.
    // SKILL_DEFS). Pour l'instant une seule compétence existe ('ours'),
    // débloquée par le raccourci secret ci-dessous plutôt que par une
    // vraie progression in-game (pas encore construite, cf. modif.txt —
    // le feu de camp pour choisir/échanger les emplacements viendra une
    // fois ce mécanisme validé en jeu). Auto-équipée en emplacement 1 dès
    // qu'elle est débloquée s'il est encore vide.
    this.unlockedSkills = new Set(scene.registry.get('unlockedSkills') || []);
    this.skillSlots = scene.registry.get('skillSlots') || [null, null, null];
    this.skillActiveUntil = 0; // fin de la fenêtre de hitbox active (cf. getSkillHitbox)
    this.skillCooldownEndTime = 0;
    this.skillTransformActive = false;
    this.skillTransformEndTime = 0;
    this.activeSkillId = null; // cf. SKILL_DEFS[this.activeSkillId].animKey dans update()
    // Fin de la sous-phase "transformation d'entrée" d'une compétence avec
    // `transitionAnimKey` (cf. SKILL_DEFS.ours) -- tant que non atteinte,
    // update() joue la transfo d'entrée au lieu de l'anim d'attaque
    // principale. `skillAttackEndTime` : fin de l'anim d'attaque elle-même
    // (cf. `attackDurationMs`) -- une fois atteinte, update() bascule sur
    // la transfo de SORTIE (`transitionOutAnimKey`) si la compétence en a
    // une.
    this.skillTransitionEndTime = 0;
    this.skillAttackEndTime = 0;
    this.skillHitboxRect = null;
    // Hitbox différée (cf. SKILL_DEFS.ours.hitboxDelayMs) : figée à l'activation
    // mais pas encore "vue" par getSkillHitbox() tant que skillHitboxActivateAt
    // n'est pas atteint (cf. update()).
    this.skillHitboxPendingRect = null;
    this.skillHitboxActivateAt = 0;
    this.skillKeys = scene.input.keyboard.addKeys({
      slot1: Phaser.Input.Keyboard.KeyCodes.A,
      slot2: Phaser.Input.Keyboard.KeyCodes.F,
      slot3: Phaser.Input.Keyboard.KeyCodes.R,
    });
    // Raccourci de triche pour débloquer/équiper les compétences (ex-
    // Ctrl+Shift+O ici) : fusionné dans Ctrl+G, cf. setupDebugToggle dans
    // LevelKit.js -- un seul raccourci de triche couvre maintenant formes
    // ET compétences (demande explicite de l'utilisateur), plus besoin
    // d'un listener séparé ici.

    // Totem (cf. TOTEM_HEADS/TOTEM_BODIES plus haut) : UN SEUL {head, body},
    // édité au feu de camp (cf. LevelKit.js). Contrairement aux
    // compétences, pas de notion de "débloqué" pour l'instant (rien de
    // précisé par l'utilisateur là-dessus) -- toutes les têtes/corps sont
    // librement combinables dès le début.
    this.equippedTotem = scene.registry.get('equippedTotem') || { head: null, body: null };
    this.maxHearts = HEART_MAX;
    this.maxEnergy = ENERGY_MAX;
    this.skillSizeMultiplier = 1;
    // Passifs de famille (cf. Familles.js), recalculés avec les bonus ci-dessous :
    // taille des fracas d'ours (palier 3 des ursidés) et « plus de recul sous
    // les coups » (palier 4). `familySig` : équipe pour laquelle ils sont à jour.
    this.bearSizeMultiplier = 1;
    this.knockbackImmune = false;
    this.familySig = null;
    // Recalcule maxHearts/maxEnergy/skillSizeMultiplier ET replafonne
    // hearts/energy (chargés juste au-dessus) dessus -- doit tourner APRÈS
    // avoir chargé equippedTotems mais peut tourner avant ou après
    // hearts/energy puisque recomputeTotemBonuses() replafonne lui-même
    // les deux à la fin.
    this.recomputeTotemBonuses();
    // Plus de touches dédiées ici (FOUR/FIVE/SIX/SEVEN) : formes/
    // compétences/totems s'équipent maintenant par glisser-déposer dans
    // CampfireMenuScene (cf. LevelKit.js), qui mute directement
    // equippedForms/skillSlots/equippedTotems plutôt que de passer par des
    // méthodes cycleXxx pilotées au clavier (retirées).

    // Toile d'araignée (Zone 3) : mis à `true` par la scène via un overlap
    // tant qu'Agarica est dessus, remis à `false` en fin d'update() — donc
    // redevient faux dès qu'elle n'est plus en contact. Ignoré en forme
    // Loup (cf. GDD : le sprint traverse les pièges au sol).
    this.inWeb = false;
    this.webSlowMultiplier = 0.4;

    // Eau (zone aquatique) : mis à `true` par la scène via un overlap, même
    // pattern que `inWeb`. Avec la Pieuvre : nage libre (gravité coupée).
    // Sans : l'eau profonde est un piège (reset, cf. hitByEnemy plus bas).
    this.inWater = false;
    // `inWater` est remis à faux CHAQUE frame (cf. fin de update()) et doit
    // être reconfirmé par l'overlap de la scène la frame suivante : si le
    // pas de physique et l'update de la scène se désynchronisent ne serait-
    // ce qu'une frame, l'overlap peut manquer un tour, `swimming` retombe à
    // faux puis revrai aussitôt — assez pour redéclencher l'anim de transfo
    // Pieuvre en boucle (constaté en jeu). `lastInWaterTime` + une petite
    // marge lissent ça au lieu de dépendre d'un overlap confirmé every frame.
    this.lastInWaterTime = -Infinity;
    this.waterGraceMs = 120;
    this.swimSpeed = 160;
    this.waterDrag = 600;

    // Attaque de base (dague) : courte fenêtre active devant Agarica,
    // vérifiée par la scène contre le groupe d'ennemis. K et clic gauche
    // déclenchent la même chose (cf. attackPointerJustDown, consommé au
    // prochain update() comme un JustDown clavier) ; E est réservé à
    // l'interaction (cf. interactKey plus bas).
    this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.attackPointerJustDown = false;
    scene.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) this.attackPointerJustDown = true;
    });
    // Interagir (sanctuaires de capacité, cf. addAbilityShrine dans
    // LevelKit.js) : plus de récupération automatique au simple contact.
    this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.attackCooldown = 300;
    this.isAttacking = false;
    this.attackEndTime = 0;
    this.attackCooldownEndTime = 0;
    // Coup en cours (cf. SLASH_ARCS) : 'side' | 'up' | 'down' (dague), 'bite'
    // (crocs du Loup) | null (Aigle : plume). Sens figé à l'appui.
    this.slashDir = null;
    // Anim de morsure à lancer à la prochaine pose (une seule fois par coup).
    this.biteAnimPending = false;
    this.slashFacing = 1;
    this.slashStart = 0;
    this.pogoDone = false;
    // Arc dessiné APRÈS la synchro physique (événement 'postupdate') pour
    // coller au sprite, devant les personnages.
    this.slashGfx = scene.add.graphics().setDepth(CHARACTER_DEPTH + 1);
    this.slashSprite = null;
    // Mesure des arcs dès maintenant (lecture de pixels) : évite un à-coup
    // au tout premier coup de la zone.
    for (const d of Object.keys(SLASH_ARCS)) this.slashArtBounds(d);
    this.onSlashPostUpdate = () => this.drawSlashArc();
    scene.events.on('postupdate', this.onSlashPostUpdate);
    scene.events.once('shutdown', () => scene.events.off('postupdate', this.onSlashPostUpdate));
    // Tir de plume (forme Aigle, cf. plus bas) : force la pose de battement
    // d'ailes (ANIM_PIAF_FLY_KEY) pendant cette fenêtre, même en plein
    // plané (vitesse verticale positive, qui montrerait sinon la pose de
    // glisse figée) — pour bien vendre "elle bat des ailes pour tirer".
    this.featherFlapEndTime = 0;

    this.jumpVelocity = -680;
    // Gravité additionnelle appliquée uniquement pendant la chute (pas à la
    // montée), pour une chute plus franche sans changer la hauteur du saut.
    this.fallGravityBonus = 750;

    // Déplacement de base : accélération progressive vers une vitesse max,
    // freinage (drag) progressif quand aucune touche n'est pressée. Le drag
    // en l'air est plus faible pour garder un peu de contrôle en saut/plané.
    this.moveAcceleration = 1500;
    // 190 (pas 220) : la marche ressortait un poil trop rapide. Ne touche
    // pas au sprint Loup (cf. wolfMaxSpeed plus bas, découplé de cette
    // valeur depuis ce changement — sinon la vitesse du Loup aurait aussi
    // baissé avec, ce qui n'a jamais été demandé).
    this.moveMaxSpeed = 190;
    this.groundDrag = 1800;
    this.airDrag = 500;
    // Quand on inverse la direction, on accélère plus fort pour un demi-tour
    // net plutôt qu'un freinage-puis-réaccélération qui traîne.
    this.turnAccelerationMultiplier = 2.2;

    // Forme Aigle : déclenchée par le 2e saut en l'air (double-saut).
    this.eagleJumpVelocity = -550;
    this.glideMaxFallSpeed = 90;
    // Descente en piqué : S maintenu en forme Aigle. Accélération (pas une
    // vitesse imposée d'un coup) plafonnée à eagleDiveMaxSpeed — assez forte
    // pour ne pas traîner au début, sans être un à-coup instantané (clin
    // d'œil à l'attaque du Corbeau, mêmes frames d'animation).
    this.eagleDiveGravity = 1600;
    this.eagleDiveMaxSpeed = 700;
    this.monkeyJumpVelocity = MONKEY_JUMP_VELOCITY;
    // Forme prise par le 2e saut en cours ('eagle' | 'monkey' | null) --
    // remise à null à l'atterrissage.
    this.airJumpForm = null;
    // Dernier instant posée au sol (cf. JUMP_COYOTE_MS).
    this.lastGroundedAt = -Infinity;
    // Liane tenue (forme singe, cf. Liane.js) ou null. `vineMomentumSpeed` :
    // élan horizontal conservé après le lâcher, jusqu'à l'atterrissage (sinon
    // moveMaxSpeed=190 le rabotait aussitôt).
    this.vine = null;
    // Direction tenue pendant le balancement, lue par stepVinePhysics à chaque
    // pas de physique ; `vineLook`/`vineSwingPose` : état visuel (cf. applyVinePose).
    this.vineDir = 0;
    // Montée (-1) / descente (+1) le long de la liane (Z/↑, S/↓).
    this.vineClimb = 0;
    this.vineLook = 0;
    this.vineSwingPose = false;
    // Le pendule avance au rythme FIXE de la physique (60 Hz), pas à celui de
    // l'affichage : cf. stepVinePhysics (cause du tremblement sur liane).
    this.onVineWorldStep = (delta) => this.stepVinePhysics(delta);
    // Référence gardée : au 'shutdown' de la scène, `scene.physics.world`
    // est déjà remis à null par le plugin Arcade.
    const world = scene.physics.world;
    world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, this.onVineWorldStep);
    scene.events.once('shutdown', () => world.off(Phaser.Physics.Arcade.Events.WORLD_STEP, this.onVineWorldStep));
    this.lastVine = null;
    this.vineReleasedAt = -Infinity;
    this.vineMomentumSpeed = 0;
    // Vol après un lâcher avec Espace (cf. releaseVine) : jusqu'au sol/liane.
    this.vineFlight = false;
    // Grimpe : distance parcourue (rythme des mains) et heure du dernier pas
    // de physique qui a fait bouger les mains (cf. stepVinePhysics).
    this.vineClimbDist = 0;
    this.vineClimbMovedAt = -Infinity;
    this.monkeyReleasePoseUntil = 0;
    this.hurtPoseUntil = 0;
    this.throwPoseUntil = 0;
    // Chute dans le vide engagée (cf. startFallOut) : plus de contrôle ni de
    // collision jusqu'à la reprise (endFallOut).
    this.fallingOut = false;
    // Compétence « avec la forme » en cours (cf. startSkillFormPose) ou null.
    this.skillFormPose = null;
    // Compétence dont la hitbox (getSkillHitbox) est active, ex. 'ours' --
    // la Fondation s'en sert pour réserver la destruction des mossBlocks à
    // l'Ours. `lastSkillId` : dernière compétence lancée (y compris
    // instantanées : pierre, papillon).
    this.skillHitboxId = null;
    this.lastSkillId = null;
    // Singe et papillon : feuilles calibrées sur la surface visible de l'idle
    // (cf. agaricaSheetScale, `method: 'area'`) -- même « masse » apparente
    // qu'Agarica, une échelle par image source (singe.png / singe_p2.png).
    FORMS.monkey = agaricaSheetPoseConfig(scene, 'singe', 'jump', { method: 'area' });
    // Grizzly et ours-hibou : FORMS.grizzly / FORMS.owlbear (vraie feuille ou
    // ours recoloré), art des compétences d'ours.
    if (typeof ursideSetupPlayer === 'function') ursideSetupPlayer(scene, this);
    // Papillon (pose de la compétence de soin, cf. drawSkillFormPose) : art
    // `forme_papillon` (centré, face à DROITE) s'il existe, sinon placeholder
    // dessiné par code ; hitbox au gabarit humain (comme le singe) pour que
    // les collisions ne changent pas pendant l'incantation.
    ensureManifestAnims(scene, 'forme_papillon');
    ensureManifestAnims(scene, 'transfo_papillon');
    ensureButterflyPlaceholder(scene);
    this.butterflyArt = hasManifestArt(scene, 'forme_papillon');
    if (this.butterflyArt) {
      FORMS.butterfly = agaricaSheetPoseConfig(scene, 'forme_papillon', 'dash', { method: 'area' });
    } else {
      const { w, h } = BUTTERFLY_PH_SIZE;
      FORMS.butterfly = { texture: `${BUTTERFLY_PH_KEY}-0`, scale: 1, frameWidth: w, frameHeight: h, body: transfoBodyConfig(w, h, 1) };
    }
    // Transfo humaine -> papillon (phases 'in'/'out' de la pose de soin) :
    // recréée à la durée de ces phases (BUTTERFLY_TRANSFO_MS).
    this.butterflyTransfoKey = null;
    if (hasManifestArt(scene, 'transfo_papillon') && scene.anims.exists('transfo_papillon-transform')) {
      this.butterflyTransfoKey = 'transfo_papillon-transform-timed';
      if (!scene.anims.exists(this.butterflyTransfoKey)) {
        const frames = scene.anims.get('transfo_papillon-transform').frames.map((f) => ({ key: f.textureKey }));
        scene.anims.create({ key: this.butterflyTransfoKey, frames, frameRate: frames.length / (BUTTERFLY_TRANSFO_MS / 1000), repeat: 0 });
      }
    }
    ensureManifestAnims(scene, 'singe');
    ensureManifestAnims(scene, 'transfo_singe');
    ensureManifestAnims(scene, 'agarica_extra');
    // Repos au feu de camp (`sit` puis `sit_idle`, cf. startCampfireRest).
    ensureManifestAnims(scene, 'agarica_repos');
    this.campfireRest = null;
    // Lot Codex n°8 : grimpe/lancer du singe (`singe_extra` : climb, throw) et
    // incantation du papillon (`forme_papillon_extra` : cast), séparés des
    // feuilles d'origine ; repli sur les anims de `singe` / `forme_papillon`.
    ensureManifestAnims(scene, 'singe_extra');
    ensureManifestAnims(scene, 'forme_papillon_extra');
    // Transfo singe : jouée seulement si l'art existe (sinon bascule nette).
    this.monkeyTransfoAnimKey = null;
    this.monkeyTransfoReverseKey = null;
    if (hasManifestArt(scene, 'transfo_singe')) {
      const tdef = getAssetManifest().transfo_singe;
      const tAnim = Object.keys(tdef.anims || {})[0];
      const fwdKey = `transfo_singe-${tAnim}`;
      if (scene.anims.exists(fwdKey)) {
        // Aller ET retour recréés à la durée de la transfo (MONKEY_TRANSFO_MS) :
        // l'anim du manifest (10 fps, 400 ms) était coupée à mi-chemin par la
        // fin de la transfo (200 ms) -- le singe surgissait à la 2e frame.
        this.monkeyTransfoAnimKey = `${fwdKey}-timed`;
        this.monkeyTransfoReverseKey = `${fwdKey}-reverse`;
        const fwdFrames = scene.anims.get(fwdKey).frames.map((f) => ({ key: f.textureKey }));
        const rate = fwdFrames.length / (MONKEY_TRANSFO_MS / 1000);
        if (!scene.anims.exists(this.monkeyTransfoAnimKey)) {
          scene.anims.create({ key: this.monkeyTransfoAnimKey, frames: fwdFrames, frameRate: rate, repeat: 0 });
        }
        if (!scene.anims.exists(this.monkeyTransfoReverseKey)) {
          scene.anims.create({ key: this.monkeyTransfoReverseKey, frames: fwdFrames.slice().reverse(), frameRate: rate, repeat: 0 });
        }
        // Feuille calibrée (cf. agaricaSheetScale) : l'art dessine la 1re
        // frame (Agarica accroupie dans les feuilles) bien plus grande que
        // l'idle à l'échelle du manifest, d'où un sursaut de taille au début.
        this.monkeyTransfoCfg = agaricaSheetPoseConfig(scene, 'transfo_singe', tAnim);
      }
    }
    // Triche Ctrl+Shift+D (écouteur principal dans LevelKit, qui ignore le
    // singe) : débloque aussi la forme singe, sans la rendre active (l'aigle
    // posé par LevelKit reste la forme aérienne -- anciennes zones).
    // Réservée au développement comme les autres (cf. devKeysAllowed, LevelKit).
    scene.input.keyboard.on('keydown-D', (event) => {
      if (!event.ctrlKey || !event.shiftKey || !this.active) return;
      if (typeof devKeysAllowed === 'function' && !devKeysAllowed(scene)) return;
      this.hasMonkeyForm = true;
      this.airFormsSeen.monkey = true;
      playerStateSet(scene, 'hasMonkeyForm', true);
    });
    this.jumpsUsed = 0;
    this.justJumped = false;
    // Saut en cours lancé par Espace et encore « coupable » (cf. JUMP_CUT_VY).
    this.jumpCutArmed = false;
    // Dernier appui sur Z/↑ (prise de liane, cf. VINE_GRAB_BUFFER_MS) ; Z/↑
    // tenu au moment de la prise ne fait pas grimper tant qu'il n'a pas été
    // relâché (sinon tenir ↑ pour s'accrocher hissait aussitôt Agarica).
    this.upPressedAt = -Infinity;
    this.vineClimbLatch = false;
    // Tampon de saut (cf. JUMP_BUFFER_MS) et état du juice (visuel seul).
    this.jumpBufferedAt = -Infinity;
    this.juicePrevVy = 0;
    this.juiceStepAt = 0;
    this.juiceGhostAt = 0;
    this.juiceFeatherAt = 0;
    this.juiceLastDir = 0;
    this.juicePrevForm = 'agarica';
    this.juiceFormFxAt = -Infinity;
    this.slashObstacleDone = true;
    // Détecte l'atterrissage (transition air -> sol) pour la pose Loup
    // dédiée à la réception, cf. WOLF_LANDING_TEXTURE plus bas.
    this.wasOnGround = false;
    // Transformation visuelle jouée une fois à chaque changement de forme
    // marquant (double-saut -> Aigle, atterrissage -> humaine, entrée/sortie
    // du sprint -> Loup), avant de laisser la forme cible habituelle prendre
    // le relais. Un seul jeu de champs génériques réutilisé pour les 4 cas
    // (un seul actif à la fois) plutôt qu'un état par forme.
    this.formTransitionActive = false;
    this.formTransitionAnimKey = ANIM_TRANSFO_RISE_KEY;
    this.formTransitionEndTime = 0;
    this.formTransitionScale = HUMAN_SCALE;
    this.formTransitionBody = TRANSFO_EAGLE_BODY;
    // Convention de flip à utiliser PENDANT la transformation, indépendante
    // de la forme réelle (déjà basculée pour la physique) : garde la
    // continuité visuelle avec l'anim qui précède immédiatement la transfo
    // (ex: sortie du Loup doit continuer à utiliser la convention Loup
    // jusqu'à ce que l'anim inverse se termine, même si `this.form` est
    // déjà redevenu 'agarica').
    this.formTransitionFacesRight = false;
    // 2 frames à 13.33fps (Aigle) / 4 frames à 15fps (Loup, Pieuvre).
    this.eagleTransformDuration = 150;
    this.wolfTransformDuration = 267;
    this.octopusTransformDuration = 267;

    // Forme Loup : déclenchée par Shift maintenu ou double-tap direction, au sol.
    // Accélération et vitesse max plus élevées pour un sprint qui se sent
    // franchement plus rapide, sans être un simple saut de vitesse instantané.
    this.wolfAcceleration = 2600;
    // Valeur figée (pas `moveMaxSpeed * 1.8`) : reste à 396 (220 * 1.8,
    // l'ancienne vitesse de marche) même si moveMaxSpeed change — le Loup
    // n'a pas à ralentir juste parce que la marche humaine a été réajustée.
    this.wolfMaxSpeed = 396;
    this.doubleTapWindowMs = 260;
    this.lastTapTime = { left: -Infinity, right: -Infinity };
    this.tapSprintDirection = null;
    this.wolfSprintActive = false;
    // Vrai le temps d'un premier saut lancé en sprint : garde la forme Loup
    // en l'air (au lieu de retomber en Agarica) tant qu'un double-saut ne
    // déclenche pas l'Aigle. Remis à faux à l'atterrissage.
    this.wolfJumpCarry = false;
    // Forme au sol du sprint en cours ('wolf' | 'grizzly') : gardée pendant
    // le saut porté (wolfJumpCarry), même si [Maj] est relâchée en l'air.
    this.sprintForm = 'wolf';
    // Grizzly (cf. Ursides.js) : élan (0 à 1), charge en cours et son sens,
    // zone d'impact de la dernière percussion. `groundFormLocked` : après une
    // percussion, [Maj] doit être relâchée avant de reprendre la forme ;
    // `controlLockUntil` : directions ignorées pendant la projection.
    this.grizzlyRamp = 0;
    this.grizzlyCharging = false;
    this.grizzlyChargeDir = 1;
    this.grizzlyChargeId = 0;
    this.grizzlyImpact = null;
    this.groundFormLocked = false;
    this.controlLockUntil = 0;
    // Ours-hibou : point le plus haut depuis son 2e saut (hauteur de chute).
    this.owlbearTopY = 0;
    // Horloges des compétences d'ours (soin du panda, départ de la glace).
    this.pandaHealAt = 0;
    this.iceCastAt = 0;
    // Sens courant (mis à jour uniquement quand une direction est pressée) :
    // le sprite humain fait face à gauche par défaut, le loup fait face à
    // droite par défaut (cf. application du flip après setForm() plus bas).
    this.facingDir = -1;

    this.form = null;
    this.setForm('agarica');
    // Pas d'entrée automatiques après un bord de zone (cf. update()).
    this.edgeEntryWalk = null;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });
  }

  update() {
    this.justJumped = false;
    // Chute dans le vide engagée : le monde est gelé (cf. updateStoryFall),
    // ce garde-fou couvre un dégel imprévu -- ni touche ni changement de
    // forme ne doit la rattraper avant la reprise.
    if (this.fallingOut) return;
    // Assise au feu de camp : immobile tant qu'aucune action ne la relève.
    if (this.campfireRest && this.updateCampfireRest()) return;
    this.syncFormSlots();
    // Équipe changée (feu de camp, histoire, triche) : passifs de famille à jour.
    if (typeof familyTeamSignature === 'function' && familyTeamSignature(this) !== this.familySig) this.recomputeTotemBonuses();
    let left = this.cursors.left.isDown || this.keys.left.isDown;
    let right = this.cursors.right.isDown || this.keys.right.isDown;
    const leftJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.left)
      || Phaser.Input.Keyboard.JustDown(this.keys.left);
    const rightJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.right)
      || Phaser.Input.Keyboard.JustDown(this.keys.right);
    // Décision utilisateur : SAUT = ESPACE SEUL. Z/↑ et S/↓ servent à viser
    // (attaque vers le haut / vers le bas en l'air) ; S/↓ garde ses rôles de
    // piqué (Aigle), de lâcher de liane (singe) et de nage (pieuvre).
    let jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump);
    const upHeld = this.cursors.up.isDown || this.keys.up.isDown;
    const downHeld = this.cursors.down.isDown || this.keys.down.isDown;

    const now = this.scene.time.now;
    // Prise de liane sur appui (cf. VINE_GRAB_BUFFER_MS) : `|` (pas `||`) pour
    // consommer les deux JustDown, comme pour la marche.
    const upJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) | Phaser.Input.Keyboard.JustDown(this.keys.up);
    if (upJustPressed) this.upPressedAt = now;
    if (!upHeld) this.vineClimbLatch = false;
    // Pas d'entrée après un passage par un bord (cf. applyEdgeArrivalState,
    // LevelKit) : direction tenue pour elle, le temps de quelques pas. La
    // moindre touche de direction ou de saut rend la main aussitôt.
    const ew = this.edgeEntryWalk;
    if (ew) {
      const reached = ew.dir > 0 ? this.x >= ew.toX : this.x <= ew.toX;
      if (left || right || jumpJustPressed || reached || now >= ew.until || this.vine) this.edgeEntryWalk = null;
      else if (ew.dir > 0) right = true;
      else left = true;
    }
    // Calculé tôt (avant saut/sprint) : la Pieuvre a la priorité absolue
    // dans l'eau — sans ça, un double-saut (Aigle) ou un sprint (Loup)
    // déclenché en nageant lançait quand même son anim de transfo (et sa
    // hitbox) par-dessus la Pieuvre, un vrai bug visuel signalé en jeu.
    if (this.inWater) this.lastInWaterTime = now;
    const swimming = this.hasOctopusForm && this.formEquipped('octopus') && (now - this.lastInWaterTime < this.waterGraceMs);
    // Capturés avant toute logique de cette frame : comparés à `this.form`
    // une fois la sélection de forme faite plus bas, pour détecter une
    // sortie du Loup/de l'Aigle et déclencher l'anim de transfo inverse.
    const wasWolfForm = this.form === 'wolf';
    const wasEagleForm = this.form === 'eagle';
    const wasOctopusForm = this.form === 'octopus';
    const wasMonkeyForm = this.form === 'monkey';
    const prevForm = this.form;
    let transitionTriggeredThisFrame = false;

    if (Phaser.Input.Keyboard.JustDown(this.skillKeys.slot1)) this.tryActivateSkill(0, now);
    else if (Phaser.Input.Keyboard.JustDown(this.skillKeys.slot2)) this.tryActivateSkill(1, now);
    else if (Phaser.Input.Keyboard.JustDown(this.skillKeys.slot3)) this.tryActivateSkill(2, now);
    // Pose « compétence avec la forme » : horloge (lâcher de la pierre, fin).
    this.tickSkillFormPose(now);
    // Compétences d'ours : soin du panda, départ des pics de glace.
    if (typeof ursideSkillTick === 'function') ursideSkillTick(this, now);
    // Grizzly en charge arrêté par un mur : percussion (cf. grizzlyCrash).
    // Testé ICI, avant la lecture du sol : la projection vers le haut fait
    // d'elle un corps en l'air dès cette image. `grizzlyCharging` date de
    // l'image d'avant -- à celle-ci, le mur a déjà remis sa vitesse à zéro.
    if (this.grizzlyCharging && this.form === 'grizzly') {
      const cd = this.grizzlyChargeDir;
      if ((cd > 0 && this.body.blocked.right) || (cd < 0 && this.body.blocked.left)) this.grizzlyCrash(now, cd);
    }
    // Compétence qui cloue sur place (`rooted` : panda qui mange, ours polaire
    // dressé, fracas de l'ours-hibou) : ni marche, ni saut, ni coup. Projection
    // après une percussion : directions ignorées un instant (controlLockUntil).
    const rootedDef = this.skillTransformActive ? skillDefOf(this.activeSkillId) : null;
    const skillRooted = !!(rootedDef && rootedDef.rooted);
    if (skillRooted || now < this.controlLockUntil) { left = false; right = false; }
    if (skillRooted) jumpJustPressed = false;
    // Fenêtre de dégâts de la compétence active (cf. tryActivateSkill) :
    // se referme toute seule, jamais consommée/effacée ailleurs — un seul
    // rectangle par activation, jamais recalculé frame après frame comme
    // l'attaque de mêlée habituelle (cf. getAttackHitbox), donc la position
    // reste celle d'Agarica au moment PRÉCIS de l'activation, pas suivie.
    // Activation elle-même différée (cf. SKILL_DEFS.ours.hitboxDelayMs) :
    // le rectangle existe dès l'appel mais reste invisible à getSkillHitbox()
    // tant que skillHitboxActivateAt n'est pas atteint.
    if (this.skillHitboxPendingRect && now >= this.skillHitboxActivateAt) {
      this.skillHitboxRect = this.skillHitboxPendingRect;
      this.skillHitboxPendingRect = null;
      // Image très longue (à-coup de chargement) : l'heure de fin a pu passer
      // avant même l'ouverture -- la zone vit au moins cette image, sinon le
      // coup ne toucherait rien (LevelKit la lit après cet update).
      if (now >= this.skillActiveUntil) this.skillActiveUntil = now + 1;
      // Juice : l'impact du fracas (poussière des deux côtés, onde au sol).
      if (this.skillHitboxId === 'ours') {
        // Poussière, pierres et traînée de la patte : images pixelfx, à part de
        // l'ours et sur la largeur RÉELLE de la zone (ursideSlamFx, Ursides.js).
        // Sans elles : l'ancien effet par code.
        const drawn = typeof ursideSlamFx === 'function' && ursideSlamFx(this, this.skillHitboxRect);
        if (!drawn) {
          spawnFx(this.scene, 'slam', this.x, this.y, { size: this.skillSizeMultiplier || 1 });
          // Vague de blocs sur la largeur RÉELLE de la zone : fracas de
          // l'ours-hibou, et fracas de l'ours élargi (palier 3 des ursidés).
          if ((this.activeSkillId === 'owlbear_slam' || this.bearSizeMultiplier > 1) && typeof ursideOwlbearSlamFx === 'function') {
            ursideOwlbearSlamFx(this, this.skillHitboxRect);
          }
        }
        juiceShake(this.scene, 'medium');
        playSfx('ours_slam');
      }
    }
    if (this.skillHitboxRect && now >= this.skillActiveUntil) this.skillHitboxRect = null;
    if (!this.skillHitboxRect && !this.skillHitboxPendingRect) this.skillHitboxId = null;
    // Fin de la transformation temporaire (cf. SKILL_DEFS/tryActivateSkill) :
    // pour une compétence sans art dédié, retire le placeholder teinte +
    // agrandissement posé à l'activation. Pour une compétence AVEC art (cf.
    // `animKey`), rien à défaire ici -- la branche `skillArtActive` plus bas
    // arrête de se déclencher toute seule dès que ce flag repasse à faux, et
    // le bloc normal par forme qui reprend la main juste après repose déjà
    // l'échelle/hitbox de la forme réelle.
    if (this.skillTransformActive && now >= this.skillTransformEndTime) {
      this.skillTransformActive = false;
      const endedSkillDef = skillDefOf(this.activeSkillId);
      this.activeSkillId = null;
      // Restaure l'origine par défaut si cette compétence l'avait changée
      // (cf. SKILL_DEFS.crapaud.originX/update()) -- sinon la forme humaine
      // normale se retrouverait affichée avec une origine décalée.
      if (endedSkillDef && endedSkillDef.originX !== undefined) this.setOrigin(0.5, 1);
      if (!endedSkillDef || !endedSkillDef.animKey) {
        this.clearTint();
        // Restaure l'échelle de la forme RÉELLE en cours (pas une valeur
        // générique) : la compétence peut se terminer pendant que la forme
        // sous-jacente a changé entre-temps (ex: elle saute pendant le
        // fracas et retombe en Aigle) — FORMS[this.form] reste la source de
        // vérité, comme partout ailleurs dans cette classe (cf. setForm()).
        this.setScale(FORMS[this.form].scale);
      }
    }

    const attackJustPressed = Phaser.Input.Keyboard.JustDown(this.attackKey) || this.attackPointerJustDown;
    this.attackPointerJustDown = false;
    if (attackJustPressed && this.form === 'eagle' && now >= this.attackCooldownEndTime) {
      // Forme Aigle : pas de dague en vol, une plume tirée en diagonale vers
      // le bas dans le sens actuel à la place (cf. Feather.js). Même
      // cooldown que l'attaque au sol, mais pas de fenêtre `isAttacking` —
      // ça reste un tir instantané, sans hitbox de mêlée.
      this.attackCooldownEndTime = now + this.attackCooldown;
      new Feather(this.scene, this.x, this.y, this.facingDir);
      // Battement d'ailes forcé (cf. FEATHER_FLAP_DURATION_MS, appliqué
      // plus bas dans la sélection d'anim Aigle) + petit ralentissement
      // global pour appuyer le tir, restauré après coup par le delayedCall.
      this.featherFlapEndTime = now + FEATHER_FLAP_DURATION_MS;
      // Ralenti centralisé (juiceSlowMo, LevelKit) : mêmes valeurs qu'avant,
      // sans conflit avec un hit-stop ni un ralenti de boss en cours.
      juiceSlowMo(this.scene, {
        ms: FEATHER_SLOWMO_DURATION_MS, physics: FEATHER_SLOWMO_PHYSICS_TIMESCALE, anims: FEATHER_SLOWMO_ANIM_TIMESCALE,
      });
      spawnFx(this.scene, 'feathers', this.x, this.y - 40, { count: 2, power: 0.8 });
      playSfx('feather_shot');
    } else if (attackJustPressed && !this.isAttacking && this.form !== 'octopus' && !this.vine
      && this.form !== 'grizzly' && !skillRooted && now >= this.attackCooldownEndTime) {
      // (Grizzly : pas de morsure, sa charge est son attaque -- K est ignoré.)
      // (Sur une liane : aucune attaque -- les deux mains tiennent la liane,
      // demande utilisateur ; K/clic y est simplement ignoré.)
      // Retour utilisateur : "retire l'attaque de la pieuvre" -- forme
      // 100% nage, jamais de combat (elle n'avait de toute façon aucune
      // pose d'attaque dédiée, cf. le cycle de nage rejoué tel quel plus
      // bas dans update() -- juste le flash de teinte générique et la
      // hitbox qui restaient actifs malgré l'absence de vraie animation).
      this.isAttacking = true;
      // Humaine / singe : coup directionnel (cf. SLASH_ARCS). `this.onGround`
      // = état de l'image précédente (le sol n'est relu que plus bas).
      // Loup : coup de croc, toujours devant lui, sans propulsion (l'ancienne
      // ruée à 780 px/s, retirée à la demande de l'utilisateur, était trop puissante).
      // Loup en l'air + S/↓ : coup de patte vers le bas ('paw', retour du
      // 2026-11-09 : « que le loup puisse taper en dessous aussi ») -- même
      // rebond que la dague vers le bas (cf. pogo plus bas).
      const bite = this.form === 'wolf';
      const paw = bite && downHeld && !this.onGround;
      this.slashDir = paw ? 'paw' : bite ? 'bite' : (upHeld ? 'up' : (downHeld && !this.onGround ? 'down' : 'side'));
      // Sens : la direction tenue à cet instant (sinon le sens courant) --
      // `facingDir` n'est mis à jour que plus bas dans update().
      const heldDir = left && !right ? -1 : right && !left ? 1 : 0;
      this.slashFacing = heldDir || (this.facingDir >= 0 ? 1 : -1);
      this.slashStart = now;
      this.pogoDone = false;
      this.attackEndTime = now + SLASH_TOTAL_MS;
      this.startSlashVfx();
      // Juice : impact de l'arc sur un obstacle (une fois par coup, cf.
      // updateSlashObstacleFx) ; petit élan du corps.
      this.slashObstacleDone = false;
      if (bite) {
        // La transfo d'entrée (267 ms) masquerait la morsure alors que la zone
        // touche déjà : le coup la coupe, comme la prise d'une liane.
        this.formTransitionActive = false;
        this.biteAnimPending = !paw;
        juiceSquash(this, paw ? 0.94 : 1.08, paw ? 1.08 : 0.94, 140);
        playSfx(paw ? 'wolf_paw' : 'wolf_bite');
      } else {
        juiceSquash(this, 1.05, 0.96, 140);
        playSfx('slash', { dir: this.slashDir });
      }
      this.attackCooldownEndTime = now + this.attackCooldown;
    }
    if (this.isAttacking && now >= this.attackEndTime) {
      this.isAttacking = false;
      this.slashDir = null;
      this.poseCrossfade(POSE_XFADE_ATTACK_MS);
    }

    if (leftJustDown) {
      if (now - this.lastTapTime.left < this.doubleTapWindowMs) this.tapSprintDirection = 'left';
      this.lastTapTime.left = now;
    }
    if (rightJustDown) {
      if (now - this.lastTapTime.right < this.doubleTapWindowMs) this.tapSprintDirection = 'right';
      this.lastTapTime.right = now;
    }
    if ((this.tapSprintDirection === 'left' && !left) || (this.tapSprintDirection === 'right' && !right)) {
      this.tapSprintDirection = null;
    }

    // `velocity.y >= 0` : le pas physique d'Arcade est fixe (60 Hz) alors
    // qu'update() suit l'affichage -- sur un écran 120/144 Hz, la frame qui
    // suit un saut voit encore `blocked.down` (le corps n'a pas encore
    // bougé) : jumpsUsed retombait à 0 et le double saut devenait un simple
    // 2e saut, sans singe (constaté en test headless, ~240 images/s). Un
    // corps vraiment posé n'a jamais de vitesse verticale négative.
    const onGround = (this.body.blocked.down || this.body.touching.down) && this.body.velocity.y >= 0;
    // Exposée sur l'instance (pas juste locale) : Xara s'en sert pour savoir
    // quand afficher sa propre pose de saut pendant le saut de base d'Agarica.
    this.onGround = onGround;
    // Vrai une seule frame, celle où elle vient de retoucher le sol — pose
    // de réception dédiée pour la forme Loup (cf. WOLF_LANDING_TEXTURE).
    const justLandedThisFrame = onGround && !this.wasOnGround;
    this.wasOnGround = onGround;
    if (justLandedThisFrame && !this.formTransitionActive && !this.isAttacking) {
      if (this.form === 'wolf') this.wolfLandPoseUntil = now + WOLF_LAND_POSE_MS;
      else if (this.form === 'agarica' && !this.vine) this.poseCrossfade(POSE_XFADE_LAND_MS);
    }
    const shiftHeld = this.cursors.shift.isDown;
    // `onGround` n'est requis qu'au DÉCLENCHEMENT du sprint, pas en continu :
    // passer en forme Loup redimensionne le corps physique (cf. setForm),
    // ce qui fait rebondir `onGround` de façon instable sur plusieurs frames
    // tant qu'on sprinte (observé : pas juste 1 frame). Sans ce
    // `wolfSprintActive` qui ne dépend plus que des touches une fois lancé,
    // `sprinting` retombait à faux à chaque rebond, clignotant Loup/Agarica
    // et rejouant l'anim de transfo en boucle.
    // Maj TENUE = forme loup, même à l'arrêt (retour des joueuses du
    // 2026-11-09 : « rester transformé en appuyant sur Maj sans courir », pour
    // chercher pistes et plateformes cachées). En avançant, le loup garde sa
    // vitesse de sprint. Le double appui ← / → reste un sprint : il n'existe
    // qu'avec la direction tenue.
    const sprintInputHeld = shiftHeld || ((left || right) && this.tapSprintDirection !== null);
    // Forme au sol équipée : loup ou grizzly (même touche, mêmes règles).
    const groundForm = this.getActiveGroundForm();
    if (this.groundFormLocked && !sprintInputHeld) this.groundFormLocked = false;
    const groundReady = !!groundForm && !this.groundFormLocked;
    if (swimming) {
      // La Pieuvre a la priorité absolue dans l'eau (cf. commentaire sur
      // `swimming` plus haut) : un sprint entamé juste avant d'entrer dans
      // l'eau ne doit pas rester actif en arrière-plan pendant la nage.
      this.wolfSprintActive = false;
    } else if (!this.wolfSprintActive) {
      this.wolfSprintActive = groundReady && onGround && sprintInputHeld;
    } else {
      this.wolfSprintActive = groundReady && sprintInputHeld;
    }
    const sprinting = this.wolfSprintActive;
    if (sprinting) this.sprintForm = groundForm;
    // Grizzly : l'élan monte en courant (cf. ursideGrizzlyRun) ; au-delà du
    // seuil, c'est la charge. Hors de sa course : ni élan ni charge.
    const grizzlyRun = sprinting && groundForm === 'grizzly' && typeof ursideGrizzlyRun === 'function'
      ? ursideGrizzlyRun(this, now, { dir: left && !right ? -1 : right && !left ? 1 : 0, onGround }) : null;
    if (!grizzlyRun) {
      this.grizzlyCharging = false;
      this.grizzlyRamp = 0;
    }
    const acceleration = grizzlyRun ? grizzlyRun.acceleration : sprinting ? this.wolfAcceleration : this.moveAcceleration;
    const webSlowed = this.inWeb && !sprinting;
    const biteSlow = onGround && this.slashDir === 'bite' ? WOLF_BITE_GROUND_SPEED : 1;
    const maxSpeed = biteSlow * (grizzlyRun ? grizzlyRun.maxSpeed : sprinting ? this.wolfMaxSpeed
      : webSlowed ? this.moveMaxSpeed * this.webSlowMultiplier : this.moveMaxSpeed);

    this.body.maxVelocity.x = maxSpeed;
    this.setDragX(onGround ? this.groundDrag : this.airDrag);

    const dir = left && !right ? -1 : right && !left ? 1 : 0;
    if (dir !== 0) {
      const isReversing = Math.sign(this.body.velocity.x) === -dir;
      const turnBoost = isReversing ? this.turnAccelerationMultiplier : 1;
      this.setAccelerationX(dir * acceleration * turnBoost);
      this.facingDir = dir;
    } else {
      this.setAccelerationX(0);
    }

    // Ours-hibou : il retombe après son 2e saut -> fracas (compétence interne
    // `owlbear_slam`, Ursides.js), seulement après une vraie chute depuis le
    // sommet du saut (une case) : un simple saut ne le déclenche jamais.
    if (this.airJumpForm === 'owlbear') {
      if (!onGround) {
        this.owlbearTopY = Math.min(this.owlbearTopY, this.y);
      } else if (!swimming && !this.skillTransformActive && typeof OWLBEAR_TUNING !== 'undefined'
        && this.y - this.owlbearTopY >= OWLBEAR_TUNING.minFall) {
        this.beginSkill('owlbear_slam', now);
      }
    }
    if (onGround) {
      this.jumpsUsed = 0;
      this.wolfJumpCarry = false;
      this.airJumpForm = null;
      this.vineMomentumSpeed = 0;
      this.vineFlight = false;
      this.lastGroundedAt = now;
    }

    // Lianes (forme singe, cf. Liane.js) : accroche automatique, mais seulement
    // une fois Agarica vraiment transformée en singe (demande utilisateur) : après
    // le double saut qui déclenche la transformation, ou un lâcher de liane (qui
    // compte comme ce double saut, cf. releaseVine : on enchaîne donc les lianes).
    // Balancement pendulaire (Q/D ou gauche/droite pompe l'élan), Z/↑ monte et
    // S/↓ descend le long de la liane (S tout en bas = se laisser tomber),
    // Saut = lâcher avec l'élan (le saut du singe : compte comme le double
    // saut, cf. releaseVine). Sans singe actif (forme humaine, aigle, loup) :
    // pur décor, traversé sans rebond ni accroche -- partout, arène de
    // Kainati comprise (décision utilisateur).
    const airForm = this.getActiveAirForm();
    const monkeyActive = !swimming && airForm === 'monkey';
    let jumpConsumed = false;
    if (this.vine && (!monkeyActive || onGround || !this.vine.alive)) this.releaseVine(false, now);
    if (this.vine) {
      if (jumpJustPressed) {
        this.releaseVine(true, now);
        jumpConsumed = true;
      } else if (downHeld && this.vine.atBottom()) {
        this.releaseVine(false, now);
      } else {
        // Le mouvement lui-même est imposé à chaque pas de physique (cf.
        // stepVinePhysics) : ici on ne fait que transmettre la direction et
        // la montée (-1) / descente (+1).
        this.vineDir = dir;
        // Z/↑ encore tenu depuis la prise : pas de grimpe avant de le relâcher.
        const climbUp = upHeld && !this.vineClimbLatch;
        this.vineClimb = climbUp && !downHeld ? -1 : downHeld && !upHeld ? 1 : 0;
        this.setAcceleration(0, 0);
        this.setDrag(0, 0);
        this.body.maxVelocity.set(VINE_BODY_MAX_SPEED, VINE_BODY_MAX_SPEED);
      }
    } else if (monkeyActive && !onGround && this.airJumpForm === 'monkey' && typeof findGrabbableVine === 'function'
      && (upHeld || now - this.upPressedAt <= VINE_GRAB_BUFFER_MS)) {
      // Prise SUR APPUI de Z/↑ (ou tenu en passant), plus automatique : un
      // singe qui passe près d'une liane sans rien demander la traverse.
      const vine = findGrabbableVine(this.scene, this, now);
      if (vine) {
        this.grabVine(vine, now);
        this.vineClimbLatch = upHeld;
        this.upPressedAt = -Infinity;
      }
    }
    // Élan conservé après un lâcher de liane : vitesse max relevée et frein
    // aérien réduit jusqu'à l'atterrissage (ou la prochaine liane).
    if (!this.vine && this.vineMomentumSpeed > 0 && !onGround) {
      this.body.maxVelocity.x = Math.max(maxSpeed, this.vineMomentumSpeed);
      this.setDragX(this.vineFlight ? VINE_FLIGHT_DRAG : 150);
    }

    // Saut « comme au sol » : posée, ou à peine sortie d'un bord sans avoir
    // sauté (JUMP_COYOTE_MS), ou à la surface de l'eau (WATER_EXIT_JUMP_MS).
    const groundLikeJump = onGround || (!swimming && this.jumpsUsed === 0
      && (now - this.lastGroundedAt <= JUMP_COYOTE_MS || now - this.lastInWaterTime <= WATER_EXIT_JUMP_MS));

    // Vrai une seule frame, celle du saut de base (pas le double-saut) —
    // Xara s'en sert pour mimiquer ce saut si elle est à portée (cf.
    // XARA_JUMP_RANGE dans Xara.js). Remise à faux au début de chaque
    // update() (cf. tout en haut), jamais laissée traîner.
    // Tampon de saut (cf. JUMP_BUFFER_MS) : appui récent resté sans effet en
    // l'air, rejoué à l'atterrissage comme un saut au sol.
    const bufferedJump = !jumpJustPressed && onGround && !swimming && !this.vine
      && now - this.jumpBufferedAt <= JUMP_BUFFER_MS;
    const jumpPress = jumpJustPressed || bufferedJump;
    if (jumpPress && groundLikeJump && !jumpConsumed) this.justJumped = true;
    // Juice : type de saut de cette image ('ground' | 'air'), pour l'étirement.
    let juiceJump = null;
    let jumpActed = false;

    if (jumpPress && !jumpConsumed && !this.vine) {
      if (groundLikeJump) {
        // Grizzly : le saut du loup, un peu plus court (il est lourd).
        this.setVelocityY(grizzlyRun ? GRIZZLY_TUNING.jumpVelocity : this.jumpVelocity);
        this.jumpsUsed = 1;
        this.wolfJumpCarry = sprinting;
        juiceJump = 'ground';
        jumpActed = true;
        this.jumpCutArmed = true;
        this.jumpBufferedAt = -Infinity;
      } else if (!swimming && airForm === 'monkey' && this.jumpsUsed < 2) {
        // Saut court du singe = LE double saut : transforme en singe (cf.
        // sélection de forme plus bas) et rend les lianes accrochables. Même
        // règle que l'aigle (décision utilisateur du 2026-11-05) : en chute
        // depuis un rebord, le 1er appui reste un saut humain, seul le 2e
        // transforme. Sans forme aérienne : AUCUN saut en l'air.
        this.jumpsUsed += 1;
        jumpActed = true;
        juiceJump = 'air';
        this.jumpCutArmed = true;
        if (this.jumpsUsed === 2) {
          this.airJumpForm = 'monkey';
          this.setVelocityY(this.monkeyJumpVelocity);
          this.wolfJumpCarry = false;
        } else {
          this.setVelocityY(this.jumpVelocity);
        }
      } else if (!swimming && airForm === 'owlbear' && this.jumpsUsed < 2) {
        // Ours-hibou : mêmes règles et même hauteur que le singe ; ni liane
        // ni plané. Le fracas part à l'atterrissage (cf. plus haut).
        this.jumpsUsed += 1;
        jumpActed = true;
        juiceJump = 'air';
        this.jumpCutArmed = true;
        if (this.jumpsUsed === 2) {
          this.airJumpForm = 'owlbear';
          this.setVelocityY(this.monkeyJumpVelocity);
          this.wolfJumpCarry = false;
          this.owlbearTopY = this.y;
        } else {
          this.setVelocityY(this.jumpVelocity);
        }
      } else if (!swimming && airForm === 'eagle' && this.jumpsUsed < 2) {
        jumpActed = true;
        juiceJump = 'air';
        this.jumpCutArmed = true;
        // Pose actuelle (montée ou descente du 1er saut) au moment précis
        // du double-saut : décide quelle des deux séquences de
        // transformation jouer (cf. TRANSFO_RISE/FALL_START_KEY).
        const wasRising = this.body.velocity.y < 0;
        // Double-saut déclenché en plein sprint (wolfJumpCarry) : `this.form`
        // vaut encore 'wolf' à cet instant (setForm() n'a pas encore tourné
        // cette frame) -> flash Loup->Aigle dédié plutôt que les frames
        // humaine->Aigle, incohérentes en sortant du Loup.
        const fromWolf = this.form === 'wolf';
        this.jumpsUsed += 1;
        if (this.jumpsUsed === 2) {
          this.setVelocityY(this.eagleJumpVelocity);
          this.airJumpForm = 'eagle';
          if (fromWolf) {
            this.beginFormTransition(now, ANIM_TRANSFO_WOLF_TO_EAGLE_KEY, this.eagleTransformDuration, TRANSFO_WOLF_EAGLE_SCALE, TRANSFO_WOLF_EAGLE_BODY, true);
          } else {
            const animKey = wasRising ? ANIM_TRANSFO_RISE_KEY : ANIM_TRANSFO_FALL_KEY;
            this.beginFormTransition(now, animKey, this.eagleTransformDuration, TRANSFO_SCALE, TRANSFO_EAGLE_BODY, true);
          }
          transitionTriggeredThisFrame = true;
        } else {
          this.setVelocityY(this.jumpVelocity);
        }
      }
    }
    // Appui en l'air sans aucun effet : mémorisé pour l'atterrissage.
    if (jumpJustPressed && !jumpActed && !jumpConsumed && !this.vine && !onGround && !swimming) this.jumpBufferedAt = now;

    // Rebond (pogo) : coup vers le bas qui touche quelque chose de frappable,
    // une fois par coup. Testé AVANT LevelKit (qui applique les dégâts juste
    // après Player.update) : l'ennemi touché est donc encore vivant ici.
    if (this.isAttacking && (this.slashDir === 'down' || this.slashDir === 'paw') && !this.pogoDone && !onGround && !this.vine
      && this.isSlashActive(now) && this.pogoTargetHit(this.getSlashRect())) {
      this.pogoDone = true;
      this.setVelocityY(POGO_VELOCITY);
      // Le rebond n'est jamais raccourci en relâchant Espace (cf. JUMP_CUT_VY).
      this.jumpCutArmed = false;
      // Rend l'éventuel saut aérien (singe/aigle), comme dans Hollow Knight ;
      // sans forme aérienne, jumpsUsed >= 1 : toujours aucun saut en l'air.
      this.jumpsUsed = 1;
      // Coup de patte du loup : il reste loup pendant le rebond.
      this.wolfJumpCarry = this.slashDir === 'paw';
      // Juice : rebond étiré + éclat sous les pieds.
      juiceSquash(this, 0.86, 1.16, 200);
      spawnFx(this.scene, 'star', this.x, this.y + 8, { count: 5, angle: [20, 160], power: 1.2 });
      playSfx('pogo');
      this.scene.events.emit('player-pogo', this);
    }

    // Saut à hauteur variable (cf. JUMP_CUT_VY) : Espace relâché pendant la
    // montée d'un saut lancé par Espace -> montée ramenée à JUMP_CUT_VY, une
    // seule fois. Le saut tenu jusqu'au sommet n'est jamais touché.
    if (this.jumpCutArmed) {
      const vy = this.body.velocity.y;
      if (vy >= 0 || this.vine || swimming) {
        this.jumpCutArmed = false;
      } else if (!this.keys.jump.isDown) {
        if (vy < -JUMP_CUT_VY) this.setVelocityY(-JUMP_CUT_VY);
        this.jumpCutArmed = false;
      }
    }

    // Vol de liane en liane (lâcher avec Espace, cf. releaseVine) : chute à la
    // gravité normale, sans le surplus de chute -- un vrai vol plané.
    const falling = this.body.velocity.y > 0 && this.form !== 'eagle' && !this.vine && !this.vineFlight;
    this.body.gravity.y = falling ? this.fallGravityBonus : 0;

    // Descente en piqué : S maintenu remplace le plané par une accélération
    // franche vers le bas (gravité additionnelle, pas une vitesse imposée
    // d'un coup), plafonnée à eagleDiveMaxSpeed. Sinon, plané léger habituel
    // qui plafonne la vitesse de chute tant qu'Agarica est sous forme Aigle.
    const eagleDiving = this.form === 'eagle' && downHeld;
    // Exposée sur l'instance : getAttackHitbox() (appelée par la scène) s'en
    // sert pour infliger des dégâts au contact pendant le piqué.
    this.eagleDiving = eagleDiving;
    if (eagleDiving) {
      this.body.gravity.y = this.eagleDiveGravity;
      if (this.body.velocity.y > this.eagleDiveMaxSpeed) {
        this.setVelocityY(this.eagleDiveMaxSpeed);
      }
    } else if (this.form === 'eagle' && this.body.velocity.y > this.glideMaxFallSpeed) {
      this.setVelocityY(this.glideMaxFallSpeed);
    }

    // Eau : sans la Pieuvre, piège façon ancienne fosse (reset) ; avec,
    // nage libre 4 directions, gravité coupée, vitesse imposée directement
    // (comme le piqué Aigle : on écrase après la logique normale plutôt que
    // de bâtir un système à part). `swimming` calculé
    // plus haut (cf. commentaire dessus).
    if (this.inWater && !(this.hasOctopusForm && this.formEquipped('octopus'))) {
      this.hitByEnemy();
    }
    this.body.setAllowGravity(!swimming && !this.vine);
    if (swimming) {
      const swimUp = upHeld || this.keys.jump.isDown;
      const vy = swimUp ? -this.swimSpeed : downHeld ? this.swimSpeed : 0;
      this.setAcceleration(0, 0);
      this.setVelocity(dir * this.swimSpeed, vy);
      this.setDrag(this.waterDrag, this.waterDrag);
    }

    if (swimming) {
      this.setForm('octopus');
    } else if (this.vine) {
      this.setForm('monkey');
    } else if (!onGround && this.jumpsUsed >= 2 && this.airJumpForm === 'eagle') {
      this.setForm('eagle');
    } else if (!onGround && this.airJumpForm === 'monkey') {
      this.setForm('monkey');
    } else if (!onGround && this.airJumpForm === 'owlbear') {
      this.setForm('owlbear');
    } else if (this.slashDir === 'bite' || this.slashDir === 'paw') {
      // 'bite' : le Loup reste jusqu'au bout du coup, même Maj relâchée
      // (sinon Agarica apparaîtrait à la place du loup, crocs encore affichés).
      this.setForm('wolf');
    } else if (sprinting || (this.wolfJumpCarry && this.jumpsUsed < 2)) {
      // Forme au sol du sprint : loup ou grizzly (cf. sprintForm).
      this.setForm(this.sprintForm === 'grizzly' ? 'grizzly' : 'wolf');
    } else {
      this.setForm('agarica');
    }
    // Morsure coupée par une autre forme (double saut, eau) : plus de crocs.
    if ((this.slashDir === 'bite' || this.slashDir === 'paw') && this.form !== 'wolf') {
      this.isAttacking = false;
      this.slashDir = null;
    }

    // Entrée/sortie du Loup, sortie de l'Aigle (l'entrée de l'Aigle est
    // déclenchée explicitement au double-saut ci-dessus, plus précis qu'une
    // simple comparaison de forme) : lance l'anim de transfo correspondante.
    // `transitionTriggeredThisFrame` évite qu'une sortie du Loup détectée ici
    // n'écrase une entrée d'Aigle déclenchée la même frame (double-saut en
    // plein sprint, cas rare mais possible via wolfJumpCarry). `!swimming`
    // évite de même de lancer une transfo Loup/Aigle en entrant dans l'eau
    // (la Pieuvre prend la forme instantanément, sans anim dédiée).
    const enteringWolf = this.form === 'wolf' && !wasWolfForm;
    const leavingWolf = this.form !== 'wolf' && wasWolfForm;
    const leavingEagle = this.form !== 'eagle' && wasEagleForm;
    // Entrée/sortie de la Pieuvre : correspond exactement au moment où
    // `swimming` bascule (cf. plus haut), donc jamais gardé par `!swimming`
    // comme les 3 cas au-dessus.
    const enteringOctopus = this.form === 'octopus' && !wasOctopusForm;
    const leavingOctopus = this.form !== 'octopus' && wasOctopusForm;
    if (!transitionTriggeredThisFrame && !this.formTransitionActive && !swimming && enteringWolf) {
      // Retour utilisateur : la feuille rendait la transfo dans le mauvais
      // sens avec `facesRight=false` (miroir par rapport au sens de
      // déplacement) — même convention dans les deux sens (entrée/sortie).
      this.beginFormTransition(now, ANIM_TRANSFO_TO_WOLF_KEY, this.wolfTransformDuration, TRANSFO_WOLF_SCALE, TRANSFO_WOLF_BODY, true);
    } else if (!transitionTriggeredThisFrame && !this.formTransitionActive && !swimming && leavingWolf
      && this.form !== 'monkey') {
      // (Loup -> singe : c'est la transfo singe, plus bas, qui prend le relais
      // -- l'anim Loup -> humaine aurait montré Agarica entre les deux.)
      // `!this.formTransitionActive` (retour utilisateur, reformulé une 2e
      // fois avec plus de détail : "au moment de la transfo la hitbox se
      // desactive ou s'actualise donc je passe à travers les murs pendant
      // quelques frames") : SANS ce garde-fou (ajouté ici, déjà en place
      // pour l'Aigle ci-dessous), retaper Maj/direction plus vite que
      // wolfTransformDuration (267ms) réarmait cette transfo en boucle --
      // pendant tout ce temps la hitbox reste celle, réduite, de la transfo
      // (cf. transfoBodyConfig/TRANSFO_BODY_MIN_WIDTH/HEIGHT) tout en
      // gardant la vitesse de sprint, donc spammer maintenait ce corps plus
      // petit à haute vitesse près des murs BIEN plus longtemps qu'un
      // aller-retour normal (qui ne le traverse qu'une fois par entrée/
      // sortie) -- plus de temps passé petit + vite près d'un mur, plus de
      // chances de le franchir avant que la séparation Arcade (cf.
      // overlapBias dans main.js) n'ait eu la profondeur de chevauchement
      // nécessaire pour agir. Combiné à l'agrandissement de ce gabarit de
      // transfo (cf. TRANSFO_BODY_MIN_WIDTH/HEIGHT, qui referme l'autre
      // moitié du problème : même SANS spam, ce corps redescendait sous la
      // plus petite silhouette réelle du jeu). Ce garde-fou laisse
      // maintenant une transfo entamée toujours finir avant qu'une nouvelle
      // ne puisse s'armer, quel que soit le nombre de fois où la touche est
      // retapée entre-temps.
      this.beginFormTransition(now, ANIM_TRANSFO_TO_HUMAN_FROM_WOLF_KEY, this.wolfTransformDuration, TRANSFO_WOLF_SCALE, TRANSFO_WOLF_BODY, true);
    } else if (!transitionTriggeredThisFrame && !this.formTransitionActive && !swimming && leavingEagle) {
      // `!this.formTransitionActive` : n'interrompt jamais la transfo
      // d'entrée en Aigle (déclenchée au double-saut, plus haut) si elle
      // joue encore — sans ça, ré-atterrir pendant qu'elle joue l'écrasait
      // par la transfo de sortie, la coupant avant qu'on ait pu la voir en
      // entier (surtout visible depuis qu'eagleTransformDuration est
      // ralentie pour le test visuel, cf. plus haut — au jeu normal, l'entrée
      // a largement le temps de finir avant l'atterrissage).
      // Convention Aigle : continuité avec le vol/plané qui précède.
      this.beginFormTransition(now, ANIM_TRANSFO_TO_HUMAN_FROM_EAGLE_KEY, this.eagleTransformDuration, TRANSFO_SCALE, TRANSFO_EAGLE_BODY, true);
    } else if (!transitionTriggeredThisFrame && enteringOctopus) {
      // La feuille est dessinée face à gauche, comme la forme humaine.
      this.beginFormTransition(now, ANIM_TRANSFO_TO_OCTOPUS_KEY, this.octopusTransformDuration, TRANSFO_PIEUVRE_SCALE, TRANSFO_PIEUVRE_BODY, false);
    } else if (!transitionTriggeredThisFrame && leavingOctopus) {
      this.beginFormTransition(now, ANIM_TRANSFO_TO_HUMAN_FROM_OCTOPUS_KEY, this.octopusTransformDuration, TRANSFO_PIEUVRE_SCALE, TRANSFO_PIEUVRE_BODY, false);
    } else if (!transitionTriggeredThisFrame && !this.formTransitionActive && !swimming
      && this.monkeyTransfoAnimKey && this.form === 'monkey' && !wasMonkeyForm) {
      // Transfo singe (manifest `transfo_singe`) : seulement si l'art existe,
      // sinon bascule nette sur la silhouette (ou le placeholder) du singe.
      const tcfg = this.monkeyTransfoCfg;
      this.beginFormTransition(now, this.monkeyTransfoAnimKey, MONKEY_TRANSFO_MS, tcfg.scale, tcfg.body, MONKEY_FACES_RIGHT);
    } else if (!transitionTriggeredThisFrame && !this.formTransitionActive && !swimming
      && this.monkeyTransfoReverseKey && this.form === 'agarica' && wasMonkeyForm) {
      const tcfg = this.monkeyTransfoCfg;
      this.beginFormTransition(now, this.monkeyTransfoReverseKey, MONKEY_TRANSFO_MS, tcfg.scale, tcfg.body, MONKEY_FACES_RIGHT);
    } else if (!transitionTriggeredThisFrame && !this.formTransitionActive && !swimming && !this.skillTransformActive
      && this.form !== prevForm && typeof ursideFormTransfo === 'function') {
      // Grizzly / ours-hibou : transformation dessinée seulement quand leur
      // vraie feuille existe (rangée `transform`), à l'aller comme au retour ;
      // avec les images provisoires, bascule nette + éclat.
      const bear = (id) => id === 'grizzly' || id === 'owlbear';
      const ut = bear(this.form) ? ursideFormTransfo(this.scene, this.form, false)
        : this.form === 'agarica' && bear(prevForm) ? ursideFormTransfo(this.scene, prevForm, true) : null;
      if (ut) this.beginFormTransition(now, ut.key, ut.ms, ut.scale, ut.body, true);
    }

    // Compétence avec art dédié (cf. SKILL_DEFS.ours, `animKey`) en cours :
    // prend le pas sur la forme sous-jacente pendant sa fenêtre de transfo,
    // le temps d'afficher sa propre silhouette animée -- calculé une seule
    // fois ici, réutilisé pour le flip ET le bloc texture/anim plus bas.
    // Origine décalée pour la prise de liane (cf. applyVineArtAnchor) : remise
    // à (0.5, 1) chaque frame AVANT les blocs ci-dessous, qui supposent tous
    // les pieds à l'origine ; la branche liane la repose si besoin.
    this.resetVineArtAnchor();
    const activeSkillDef = skillDefOf(this.activeSkillId);
    const skillArtActive = !!(this.skillTransformActive && activeSkillDef && activeSkillDef.animKey);

    // Le sprite humain fait face à gauche par défaut, le Loup et l'Aigle
    // font face à droite par défaut : le flip s'inverse selon la forme
    // active — sauf pendant une transformation, où la convention est figée
    // sur celle de la forme qui précède (cf. formTransitionFacesRight). La
    // Pieuvre n'a qu'une pose de face (pas de profil dédié) : même flip que
    // la forme humaine, juste pour distinguer gauche/droite en nageant.
    const defaultFacesRight = this.formTransitionActive
      ? this.formTransitionFacesRight
      : skillArtActive
        ? activeSkillDef.facesRight
        : (this.form === 'wolf' || this.form === 'eagle' || this.form === 'grizzly' || this.form === 'owlbear'
          || (this.form === 'monkey' && MONKEY_FACES_RIGHT));
    this.setFlipX(defaultFacesRight ? this.facingDir < 0 : this.facingDir > 0);

    if (this.formTransitionActive) {
      // L'anim (4 frames à 15fps ≈ 267ms) et `formTransitionEndTime` visent
      // la même durée mais viennent de deux horloges distinctes : l'anim
      // termine parfois une frame plus tôt (non bouclée, `repeat:0`), et
      // rappeler `.play()` sur une anim déjà finie la relance depuis le
      // début (`ignoreIfPlaying` ne protège que contre un appel PENDANT la
      // lecture) — d'où un sursaut visible juste avant la coupure. Vérifier
      // l'anim AVANT de la (re)lancer évite ce sursaut.
      const animAlreadyDone = this.anims.currentAnim
        && this.anims.currentAnim.key === this.formTransitionAnimKey
        && !this.anims.isPlaying;
      if (animAlreadyDone || now >= this.formTransitionEndTime) {
        // Ne PAS reposer l'échelle/la hitbox ici : `this.form` a déjà sa
        // valeur cible mais la texture est encore celle de la transfo
        // (634x442, minuscule à TRANSFO_WOLF_SCALE) — appliquer l'échelle
        // de la forme cible (WOLF_SCALE, bien plus grande) à CETTE texture
        // pour une seule frame donnait un aigle/loup géant qui flashait
        // juste avant la coupure. Le bloc ci-dessous applique échelle ET
        // texture ensemble, dès cette même frame (pas de retour anticipé).
        this.formTransitionActive = false;
        this.poseCrossfade(POSE_XFADE_TRANSFO_MS);
      } else {
        // Échelle intermédiaire le temps de l'anim de transfo. Hitbox
        // réajustée au canvas/échelle de la transfo (cf. transfoBodyConfig)
        // plutôt que laissée à celle de la forme cible posée par setForm(),
        // sans quoi elle ne correspond plus du tout au visuel affiché
        // pendant la transfo (décalage/enfoncement dans le sol observé).
        this.applyBodyForScale(this.formTransitionScale, this.formTransitionBody);
        this.anims.play(this.formTransitionAnimKey, true);
        // Image dessinée à une autre échelle que ses voisines (cf.
        // TRANSFO_FRAME_CALIBRATION) : sa propre échelle, et la hitbox du même
        // gabarit recentrée sur SON canvas -- taille monde du corps inchangée.
        const frameScale = transfoFrameScale(this.scene, this.texture.key);
        if (frameScale) {
          this.applyBodyForScale(frameScale, transfoBodyConfig(this.frame.realWidth, this.frame.realHeight, frameScale));
        }
      }
    }

    if (skillArtActive) {
      // Origine : la plupart des compétences affichent leur art sur le
      // canvas humain normal (origine (0.5,1) fixée dans le constructeur,
      // jamais touchée) -- mais une compétence dont l'art est un canvas
      // large-mais-aligné-à-un-bord (cf. CRAPAUD_ORIGIN_X dans Crapaud.js,
      // même raison que pour l'ennemi Crapaud lui-même) a besoin d'une
      // origine différente le temps qu'elle est active, sans quoi son
      // corps semblerait sauter sur le côté. `originX` optionnel, absent
      // pour l'Ours -- ne change alors rien.
      if (activeSkillDef.originX !== undefined) this.setOrigin(activeSkillDef.originX, 1);
      // Compétence avec art dédié (cf. plus haut) : prend le pas sur la
      // forme sous-jacente ET sur une éventuelle transfo Loup/Aigle/Pieuvre
      // en cours (rare chevauchement, ex : activer l'Ours pile pendant
      // l'entrée en sprint Loup) -- le bloc formTransitionActive ci-dessus
      // continue de tenir SA PROPRE horloge normalement pendant ce temps
      // (juste son rendu est recouvert), donc la transfo reprend la main
      // sans accroc dès que la fenêtre de la compétence se termine.
      if (activeSkillDef.transitionAnimKey && now < this.skillTransitionEndTime) {
        // Phase 1 : transformation humaine -> silhouette de la compétence,
        // jouée AVANT l'anim d'attaque elle-même (demande explicite, cf.
        // ANIM_TRANSFO_TO_OURS_KEY). `.play()` AVANT de lire la frame
        // courante : au tout premier tick de cette phase, c'est cet appel
        // qui pose la texture de la frame 0 -- la lire avant l'aurait
        // laissée sur la texture de l'anim précédente.
        this.anims.play(activeSkillDef.transitionAnimKey, true);
        this.applySkillTransitionVisual(activeSkillDef);
        this.applyFrameScaleOverride();
      } else if (activeSkillDef.transitionOutAnimKey && now >= this.skillAttackEndTime) {
        // Phase 3 : retour à l'humaine, jouée APRÈS l'anim d'attaque
        // (demande explicite : "mettre l'animation de transformation a
        // l'envers apres l'attaque pour me retransformer en humain") --
        // MÊMES tailles que la phase 1 donc la silhouette rétrécit
        // automatiquement en sens inverse, juste les frames jouées à
        // l'envers (cf. ANIM_TRANSFO_FROM_OURS_KEY/ANIM_CRAPAUD_RETRACT_KEY).
        this.anims.play(activeSkillDef.transitionOutAnimKey, true);
        this.applySkillTransitionVisual(activeSkillDef);
        this.applyFrameScaleOverride();
      } else {
        // Phase 2 : anim d'attaque principale (cf. SKILL_DEFS.ours.animKey).
        this.applyBodyForScale(activeSkillDef.scale, activeSkillDef.body);
        this.anims.play(activeSkillDef.animKey, true);
        this.applyFrameScaleOverride();
      }
    } else if (!this.formTransitionActive) {
      // Toujours réappliquées (même hors sortie de transfo à l'instant) :
      // `setForm()` les pose déjà au moment du changement de forme, mais
      // les reposer ici aussi les synchronise avec la texture ci-dessous
      // dans la MÊME frame quand une transfo vient tout juste de finir —
      // sans ce bloc, l'échelle cible s'appliquait un instant à l'ancienne
      // texture de transfo (sursaut de taille), cf. commentaire ci-dessus.
      this.applyBodyForScale(FORMS[this.form].scale, FORMS[this.form].body);

      if (this.form === 'agarica') {
        // Poses Codex optionnelles (manifest `agarica_extra`, face à DROITE) :
        // utilisées seulement si l'art existe, sinon comportement historique.
        const extra = (anim) => hasManifestArt(this.scene, 'agarica_extra', anim);
        if (this.skillFormPose && this.drawSkillFormPose(now)) {
          // Compétence avec la forme : singe qui lance la pierre, papillon du
          // soin (cf. startSkillFormPose).
        } else if (this.storyPose && extra(this.storyPose)) {
          // Pose narrative tenue (cf. setPlayerStoryPose dans StoryKit, chute de mort).
          this.applyAgaricaExtraPose(this.storyPose);
        } else if (now < this.hurtPoseUntil && !this.isAttacking && extra('hurt')) {
          this.applyAgaricaExtraPose('hurt');
        } else if (this.isAttacking && this.slashDir) {
          this.applySlashPose(now);
        } else if (this.isAttacking || now < this.throwPoseUntil) {
          // Lancer de pierre : pose fixe bras tendu (cf. THROW_POSE_TEXTURE).
          this.anims.stop();
          this.setTexture(THROW_POSE_TEXTURE);
          // Canvas différent de celui d'idle/marche (cf. AGARICA_ATTACK_BODY)
          // : hitbox dédiée pour rester correctement centrée/calée au sol
          // pendant les 4 frames de l'animation. Échelle légèrement réduite
          // (cf. AGARICA_ATTACK_SCALE) plutôt que HUMAN_SCALE : les offsets
          // de la hitbox restent en coordonnées BRUTES (espace texture),
          // donc n'ont pas besoin de changer — Phaser applique l'échelle en
          // multipliant, ce qui les rétrécit avec le visuel automatiquement.
          this.applyBodyForScale(AGARICA_ATTACK_SCALE, AGARICA_ATTACK_BODY);
        } else if (onGround) {
          this.anims.play(dir !== 0 ? ANIM_WALK_KEY : ANIM_IDLE_KEY, true);
        } else if (extra(this.body.velocity.y < 0 ? 'jump_rise' : 'jump_fall')) {
          this.applyAgaricaExtraPose(this.body.velocity.y < 0 ? 'jump_rise' : 'jump_fall');
        } else {
          this.anims.stop();
          this.setTexture(this.body.velocity.y < 0 ? JUMP_RISE_TEXTURE : JUMP_FALL_TEXTURE);
          // Ré-appliquée après coup : la hitbox posée juste au-dessus vient
          // d'être calculée pour HUMAN_SCALE, avant qu'on grossisse le
          // visuel ci-dessus — sans ce recalcul elle resterait plus petite
          // que le personnage affiché pendant tout le saut.
          this.applyBodyForScale(JUMP_SCALE, FORMS.agarica.body);
        }
        // Cf. AGARICA_BODY_FORWARD_SHIFT plus haut : nudge post-hoc, après
        // TOUTE la logique ci-dessus (attaque/sol/saut ont chacun réappliqué
        // un offsetX centré) -- `this.flipX` vient d'être posé un peu plus
        // haut dans cette même frame (cf. setFlipX). Texture de base non
        // flippée = face à GAUCHE (cf. commentaire sur defaultFacesRight),
        // donc "avant" = x plus petit quand !flipX, x plus grand quand flipX.
        // `facingDir` (pas flipX) : équivalent pour la feuille historique, et
        // reste juste pour les poses `agarica_extra` (convention de flip inverse).
        this.body.setOffset(
          this.body.offset.x + this.facingDir * AGARICA_BODY_FORWARD_SHIFT,
          this.body.offset.y,
        );
      } else if (this.form === 'wolf') {
        if (this.slashDir === 'bite') {
          // Une seule fois par coup : relancée à chaque image, une anim qui
          // vient de finir repartirait de sa 1re image (sursaut).
          if (this.biteAnimPending) {
            this.biteAnimPending = false;
            this.anims.play(ANIM_WOLF_ATTACK_KEY);
          }
          // Feuille d'attaque dessinée plus grande : ramenée à la taille de la
          // course (cf. WOLF_BITE_SCALE), hitbox inchangée.
          this.applyBodyForScale(WOLF_BITE_SCALE, WOLF_BITE_BODY);
          // Sens figé à l'appui, comme les crocs (loup de face à droite).
          this.setFlipX(this.slashFacing < 0);
        } else if (this.slashDir === 'paw') {
          // Coup de patte vers le bas : pose de réception (pattes avant
          // tendues vers le sol), griffes dessinées dessous (cf. drawPawFx).
          this.anims.stop();
          this.setTexture(WOLF_LANDING_TEXTURE);
          this.applyBodyForScale(WOLF_JUMP_SCALE, FORMS.wolf.body);
          this.setFlipX(this.slashFacing < 0);
        } else if (onGround && now < (this.wolfLandPoseUntil || 0)) {
          // Réception tenue WOLF_LAND_POSE_MS (une seule image : un flash).
          this.anims.stop();
          this.setTexture(WOLF_LANDING_TEXTURE);
        } else if (onGround && dir === 0 && Math.abs(this.body.velocity.x) < WOLF_STAND_SPEED) {
          // Loup tenu à l'arrêt (Maj seule) : debout, sans courir sur place.
          this.anims.stop();
          this.setTexture(WOLF_STAND_TEXTURE);
        } else if (onGround) {
          this.anims.play(ANIM_WOLF_RUN_KEY, true);
        } else {
          this.anims.stop();
          this.setTexture(this.body.velocity.y < 0 ? WOLF_JUMP_RISE_TEXTURE : WOLF_JUMP_FALL_TEXTURE);
          // Ré-appliquée après coup, comme pour le saut humain (cf.
          // JUMP_SCALE) : la hitbox posée juste au-dessus vient d'être
          // calculée pour WOLF_SCALE, avant qu'on grossisse le visuel.
          this.applyBodyForScale(WOLF_JUMP_SCALE, FORMS.wolf.body);
        }
      } else if (this.form === 'eagle') {
        if (eagleDiving) {
          this.anims.play(ANIM_PIAF_DIVE_KEY, true);
        } else if (now < this.featherFlapEndTime) {
          // Vient de tirer une plume (cf. featherFlapEndTime plus haut) :
          // bat des ailes même en plein plané, où la vitesse verticale
          // seule aurait sinon montré la pose de glisse figée.
          this.anims.play(ANIM_PIAF_FLY_KEY, true);
        } else {
          // Battement d'ailes tant qu'elle monte encore (juste après le
          // double-saut), glisse ailes déployées pendant tout le plané.
          this.anims.play(this.body.velocity.y < 0 ? ANIM_PIAF_FLY_KEY : ANIM_PIAF_GLIDE_KEY, true);
        }
      } else if (this.form === 'monkey') {
        // Singe (manifest `singe` : jump/liane_hang/liane_swing/release_flip)
        // -- placeholder tant que l'art n'existe pas. Sur une liane sans art
        // singe mais avec les poses `agarica_extra`, Agarica suspendue.
        if (this.vine) {
          this.applyVinePose();
        } else {
          const monkeyAnim = now < this.monkeyReleasePoseUntil ? 'release_flip' : 'jump';
          playManifestOn(this, 'singe', monkeyAnim);
          // `release_flip` est sur l'autre image source (singe_p2) : son échelle.
          const mc = agaricaSheetPoseConfig(this.scene, 'singe', monkeyAnim, { method: 'area' });
          this.applyBodyForScale(mc.scale, mc.body);
        }
      } else if (this.form === 'grizzly') {
        // Course, charge et saut du grizzly (vraie feuille ou image provisoire).
        ursideGrizzlyPose(this, now, { onGround, dir });
      } else if (this.form === 'owlbear') {
        ursideOwlbearPose(this);
      } else if (this.form === 'octopus') {
        // Pas d'attaque du tout pour cette forme (cf. le garde-fou
        // `this.form !== 'octopus'` sur le déclenchement plus haut) --
        // juste un cycle de nage, vue de face. Pas d'idle séparé non plus :
        // figée sur la 1re frame du cycle au repos.
        const swimUp = upHeld || this.keys.jump.isDown;
        const moving = dir !== 0 || swimUp || downHeld;
        if (moving) {
          this.anims.play(ANIM_PIEUVRE_WALK_KEY, true);
        } else {
          this.anims.stop();
          this.setTexture('pieuvre-walk-0');
        }
      }
    }

    // Juice (visuel seul) : squash & stretch, poussière, traînées, éclats.
    this.updateJuice(now, {
      onGround, justLanded: justLandedThisFrame, dir, sprinting, swimming, eagleDiving, jump: juiceJump,
    });
    this.updateSlashObstacleFx(now);

    // Remis à faux ici : si la scène ne le repasse pas à `true` via overlap
    // au prochain step physique (plus en contact avec une toile), on reste
    // correctement "hors toile" sans dépendre d'un évènement de sortie.
    this.inWeb = false;
    this.inWater = false;
  }

  // --- Juice (passage « game feel », 2026-10-23) : rien ici ne touche au
  // corps physique, aux vitesses ni aux timings -- seulement le dessin
  // (juiceSquash/juiceRender, appliqués au rendu) et des particules.
  updateJuice(now, s) {
    const sc = this.scene;
    const j = juiceRender(this);
    const vx = this.body.velocity.x;
    // Atterrissage : écrasement + poussière proportionnels à la vitesse de chute
    // (celle de l'image d'avant : à l'impact, la vitesse est déjà remise à 0).
    if (s.justLanded && !this.vine && !s.swimming) {
      const fall = this.juicePrevVy;
      if (fall > 140) {
        const power = Phaser.Math.Clamp((fall - 160) / 700, 0, 1);
        spawnFx(sc, 'land', this.x, this.y, { power });
        const k = 0.07 + 0.17 * power;
        juiceSquash(this, 1 + k, 1 - k, 160 + 100 * power);
        if (power > 0.85) juiceShake(sc, 'tiny');
        playSfx('land', { power });
      }
    }
    // Décollage : étirement (saut au sol, petite bouffée) ; plus discret en l'air.
    if (s.jump === 'ground') {
      juiceSquash(this, 0.84, 1.18, 220);
      spawnFx(sc, 'land', this.x, this.y, { power: 0.1 });
      playSfx('jump');
    } else if (s.jump === 'air') {
      juiceSquash(this, 0.9, 1.1, 180);
      playSfx('jump_air');
    }
    // Course : petites bouffées sous les pas, bouffée et écrasement au demi-tour.
    const turned = s.dir !== 0 && Math.sign(vx) === -s.dir && this.juiceLastDir !== s.dir;
    if (s.dir !== 0) this.juiceLastDir = s.dir;
    if (s.onGround && !this.vine && !s.swimming) {
      const speed = Math.abs(vx);
      if (turned && speed > 90) {
        spawnFx(sc, 'turn', this.x, this.y, { dir: s.dir });
        juiceSquash(this, 1.07, 0.95, 150);
      } else if (speed > 110 && now >= this.juiceStepAt) {
        this.juiceStepAt = now + (s.sprinting ? 80 : 200);
        spawnFx(sc, 'step', this.x, this.y, { dir: vx > 0 ? 1 : -1, power: s.sprinting ? 1 : 0.4, count: s.sprinting ? 2 : 1 });
      }
    }
    // Sprint loup : penché vers l'avant (au dessin), traînée violette.
    const wolfRun = this.form === 'wolf' && s.onGround && Math.abs(vx) > 200;
    const leanWant = wolfRun ? 0.075 * Math.sign(vx) * Math.min(1, (Math.abs(vx) - 200) / 180) : 0;
    j.lean += (leanWant - j.lean) * 0.25;
    if (Math.abs(j.lean) < 0.002) j.lean = 0;
    if (this.form === 'wolf' && Math.abs(vx) > 300 && now >= this.juiceGhostAt) {
      this.juiceGhostAt = now + 55;
      juiceGhost(sc, this, { tint: 0x9a7dff, alpha: 0.26, ms: 190 });
    }
    // Aigle : plumes qui se détachent en plané, silhouettes en piqué.
    if (this.form === 'eagle' && !s.onGround && now >= this.juiceFeatherAt) {
      if (s.eagleDiving) {
        this.juiceFeatherAt = now + 50;
        juiceGhost(sc, this, { tint: 0xd8ccf5, alpha: 0.22, ms: 160 });
      } else if (this.body.velocity.y >= 0) {
        this.juiceFeatherAt = now + Phaser.Math.Between(180, 320);
        spawnFx(sc, 'feathers', this.x - this.facingDir * 16, this.y - 34, { count: 1, power: 0.6 });
      }
    }
    // Lâcher de liane : élan visible (silhouettes vertes) au début du vol.
    if (this.vineFlight && now - this.vineReleasedAt < 340 && now >= this.juiceGhostAt) {
      this.juiceGhostAt = now + 45;
      juiceGhost(sc, this, { tint: 0x8fe3b8, alpha: 0.24, ms: 180 });
    }
    // Changement de forme : éclat + particules (cf. juiceFormChange).
    if (this.form !== this.juicePrevForm) {
      this.juiceFormChange(this.juicePrevForm, this.form, now);
      this.juicePrevForm = this.form;
    }
    this.juicePrevVy = this.body.velocity.y;
  }

  // Éclat de transformation, couleur de la forme (FORM_FX_COLORS) ; le loup
  // (qui va et vient à chaque sprint) n'a qu'une bouffée de poussière et
  // quelques étoiles, pas d'anneau.
  juiceFormChange(from, to, now) {
    const sc = this.scene;
    if (now - this.juiceFormFxAt < 120) return;
    this.juiceFormFxAt = now;
    const cy = this.y - 38;
    const color = FORM_FX_COLORS[to] || 0x8fe3b8;
    playSfx(`transform_${to}`, { from });
    // (Grizzly : comme le loup, il va et vient avec [Maj].)
    const groundSide = GROUND_FORM_IDS.includes(to) ? to : (GROUND_FORM_IDS.includes(from) && to === 'agarica' ? from : null);
    if (groundSide) {
      spawnFx(sc, 'land', this.x, this.y, { power: 0.45 });
      spawnFx(sc, 'star', this.x, cy, { count: 4, tint: [FORM_FX_COLORS[groundSide], 0xffffff], power: 0.8 });
      return;
    }
    if (to === 'monkey' && this.vine) return; // gerbe de feuilles déjà faite à la prise
    if (to === 'agarica') {
      spawnFx(sc, 'star', this.x, cy, { count: 5, tint: [color, 0xffffff], power: 0.8 });
      if (from === 'monkey') spawnFx(sc, 'leaves', this.x, cy, { count: 4, power: 0.7 });
      if (from === 'eagle') spawnFx(sc, 'feathers', this.x, cy, { count: 3 });
      return;
    }
    spawnFx(sc, 'transform', this.x, cy, { color, size: 0.85 });
    if (to === 'monkey') spawnFx(sc, 'leaves', this.x, cy, { count: 8 });
    if (to === 'eagle' || to === 'owlbear') spawnFx(sc, 'feathers', this.x, cy, { count: 6, power: 1.3 });
  }

  // L'arc d'un coup qui heurte le décor (mur, plafond, sol en coup vers le
  // bas, amas/mur de mousse) : étincelles + poussière au point de contact,
  // une fois par coup. Visuel seul (aucun rebond, aucun dégât).
  updateSlashObstacleFx(now) {
    if (this.slashObstacleDone || !this.isAttacking || !this.slashDir || !this.isSlashActive(now)) return;
    const sc = this.scene;
    const r = this.getSlashRect();
    // Zone d'essai resserrée : le bas d'un coup de côté frôle toujours le sol.
    const t = new Phaser.Geom.Rectangle(r.x + 6, r.y + 6, r.width - 12, r.height - 12);
    const side = this.slashDir === 'side' || this.slashDir === 'bite';
    if (side) t.height = Math.max(4, Math.min(t.height, this.y - 14 - t.y));
    if (t.width <= 0 || t.height <= 0) return;
    const bodies = sc.physics.overlapRect(t.x, t.y, t.width, t.height, false, true);
    let hit = null;
    for (const b of bodies) {
      const go = b.gameObject;
      if (!go) continue;
      const isGround = sc.ground && sc.ground.contains(go);
      const st = sc.__story;
      const isMoss = st && st.mossGroup && st.mossGroup.contains(go);
      if (!isGround && !isMoss) continue;
      hit = { b, moss: isMoss };
      break;
    }
    if (!hit) return;
    this.slashObstacleDone = true;
    const b = hit.b;
    let x;
    let y;
    if (side) {
      x = this.slashFacing > 0 ? Math.max(t.x, b.left) : Math.min(t.right, b.right);
      y = Phaser.Math.Clamp(t.centerY, b.top, b.bottom);
    } else {
      x = Phaser.Math.Clamp(t.centerX, b.left, b.right);
      y = this.slashDir === 'up' ? Math.min(t.bottom, b.bottom) : Math.max(t.y, b.top);
    }
    if (hit.moss) {
      spawnFx(sc, 'chip', x, y, { count: 6, power: 0.8 });
      spawnFx(sc, 'drop', x, y, { count: 2 });
    } else {
      spawnFx(sc, 'wallHit', x, y, { dir: side ? this.slashFacing : 1 });
    }
    juiceShake(sc, 'tiny');
    playSfx('slash_obstacle', { moss: hit.moss });
  }

  setForm(form) {
    if (this.form === form) return;
    this.form = form;
    // Forme d'ours débloquée en cours de jeu : son image provisoire (Ursides.js).
    if (typeof ursideEnsureForm === 'function') ursideEnsureForm(this.scene, form);

    const cfg = FORMS[form];
    this.setScale(cfg.scale);
    // Le corps physique met en cache le scale du sprite et ne le
    // rafraîchit normalement qu'au step physique suivant : sans ce
    // forçage, setSize() ci-dessous utiliserait encore l'ancien scale
    // pendant une frame, donnant une hitbox non mise à l'échelle (donc
    // bien trop grande en passant d'Aigle/Loup à Agarica) — ce qui
    // enfonçait le perso dans le sol pile à l'atterrissage.
    this.body.updateBounds();
    if (form !== 'agarica') {
      this.anims.stop();
      this.setTexture(cfg.texture);
    }
    this.body.setSize(cfg.body.width, cfg.body.height);
    this.body.setOffset(cfg.body.offsetX, cfg.body.offsetY);
  }

  // Applique une échelle d'affichage ET la hitbox qui va avec, dans cet
  // ordre précis (cf. commentaire sur `body.updateBounds()` dans setForm()
  // ci-dessus : le corps physique doit être resynchronisé sur la NOUVELLE
  // échelle avant tout setSize/setOffset, sans quoi la hitbox reste à
  // l'ancienne taille pendant une frame). Factorisé ici car réutilisé tel
  // quel à 3 endroits (transfo en cours, forme normale, saut humain agrandi).
  applyBodyForScale(scale, body) {
    this.setScale(scale);
    this.body.updateBounds();
    this.body.setSize(body.width, body.height);
    this.body.setOffset(body.offsetX, body.offsetY);
  }

  // Applique l'échelle/hitbox d'une compétence pendant sa phase de
  // transition (entrée ou sortie, cf. skillArtActive dans update()) --
  // deux formes possibles selon la compétence : soit `transitionScales`/
  // `transitionBodies` (tableaux, une taille CROISSANTE par frame, cf.
  // SKILL_DEFS.ours et getTransfoOursFrameIndex), soit un simple
  // `transitionScale`/`transitionBody` fixe (cf. SKILL_DEFS.crapaud, qui
  // n'a pas besoin de grandir -- seule sa langue s'étire, pas tout son
  // corps). Centralisé ici pour que les deux branches (entrée/sortie) dans
  // update() n'aient pas à dupliquer ce choix.
  applySkillTransitionVisual(def) {
    if (def.transitionScales) {
      const frameIdx = getTransfoOursFrameIndex(this);
      this.applyBodyForScale(def.transitionScales[frameIdx], def.transitionBodies[frameIdx]);
    } else {
      this.applyBodyForScale(def.transitionScale, def.transitionBody);
    }
  }

  // Image d'une compétence dessinée à une autre échelle que sa feuille (ours :
  // Agarica des rangées `transform`, patte levée de l'ours brun -- cf.
  // ursideFrameScale, Ursides.js) : son échelle, avec le même corps au gabarit
  // humain recentré sur elle. Sans effet pour toute autre image.
  applyFrameScaleOverride() {
    const scale = typeof ursideFrameScale === 'function' ? ursideFrameScale(this.texture.key) : null;
    if (scale) this.applyBodyForScale(scale, transfoBodyConfig(this.frame.realWidth, this.frame.realHeight, scale));
  }

  // Arme l'overlay de transformation (cf. commentaire sur formTransitionActive
  // dans le constructeur) : les 6 champs sont toujours posés ensemble, un
  // par cas de figure (entrée/sortie Loup, sortie Aigle, entrée/sortie
  // Pieuvre, flash Loup->Aigle) — factorisé pour ne pas risquer d'en oublier
  // un en ajoutant un futur cas.
  beginFormTransition(now, animKey, duration, scale, body, facesRight) {
    // Anim de transfo absente ou vide (images non chargées, cf.
    // createAnimIfLoaded) : changement de forme net plutôt qu'une silhouette
    // précédente rétrécie à l'échelle de la transfo.
    if (!animPlayable(this.scene, animKey)) return;
    this.formTransitionActive = true;
    this.formTransitionAnimKey = animKey;
    this.formTransitionEndTime = now + duration;
    this.formTransitionScale = scale;
    this.formTransitionBody = body;
    this.formTransitionFacesRight = facesRight;
  }

  // Rectangle (espace monde) de la zone qui touche, ou null : arc de la dague
  // (humaine/singe) ou crocs du Loup, images actives seulement (cf. SLASH_ARCS),
  // piqué de l'Aigle (tout le corps). API utilisée par LevelKit, Kainati,
  // Ghil't, les scripts d'actes (jeton anti-double-coup : `attackEndTime`).
  getAttackHitbox() {
    // Piqué Aigle (S maintenu en forme Aigle) : le contact seul inflige des
    // dégâts, pas de fenêtre d'attaque dédiée — clin d'œil au piqué du
    // Corbeau, qui touche aussi au simple contact.
    if (this.eagleDiving) return this.getBounds();
    if (!this.isAttacking || !this.slashDir) return null;
    // L'arc ou les crocs affichés, et seulement pendant leurs images actives
    // (cf. SLASH_ARCS) -- null pendant l'élan et le retour. Même rectangle que
    // celui que dessine drawSlashArc().
    if (!this.isSlashActive(this.scene.time.now)) return null;
    const r = this.getSlashRect();
    // Morsure du loup : touche aussi la moitié AVANT de son propre corps
    // (retour de l'utilisateur, 2026-11-12 : « taper devant et sur la moitié
    // avant de sa hitbox, pas que devant lui »). Un ennemi collé contre le
    // museau, ou déjà sous la tête, échappait aux crocs placés devant la gueule.
    // Zone de dégâts seulement : les crocs dessinés et le rebond ne changent pas.
    if (this.slashDir === 'bite' && this.body) {
      const b = this.body;
      const half = b.width / 2;
      const front = new Phaser.Geom.Rectangle(this.slashFacing > 0 ? b.center.x : b.x, b.y, half, b.height);
      return Phaser.Geom.Rectangle.Union(r, front);
    }
    return r;
  }

  // Rectangle (espace monde) de la compétence active, pendant sa courte
  // fenêtre de dégâts UNIQUEMENT (cf. tryActivateSkill/SKILL_DEFS) — jamais
  // recalculé depuis la position courante comme getAttackHitbox() ci-dessus,
  // le rectangle est figé au moment de l'activation dans skillHitboxRect.
  // Retourne null hors fenêtre active.
  getSkillHitbox() {
    return this.skillHitboxRect;
  }

  // Active la compétence de l'emplacement `slotIndex` (0/1/2, cf. touches
  // A/F/R dans update()) si elle est équipée et que l'énergie suffit.
  // Entièrement pilotée par SKILL_DEFS (coût/durée/forme de zone/teinte/
  // échelle) : ajouter une compétence future = ajouter une entrée à cette
  // table, sans toucher à cette méthode.
  tryActivateSkill(slotIndex, now) {
    const skillId = this.skillSlots[slotIndex];
    if (!skillId || now < this.skillCooldownEndTime) return;
    const def = SKILL_DEFS[skillId];
    if (!def) return;
    // Compétence sans effet ici : ni coût ni délai, l'icône refuse. `groundOnly`
    // (panda, ours polaire : pas en l'air) ; `canActivate` (panda : cœurs pleins),
    // avec sa raison en clair (`denyText`).
    const refused = typeof def.canActivate === 'function' && !def.canActivate(this);
    if (refused || (def.groundOnly && !this.onGround)) {
      juiceHudDeny(this.scene);
      if (refused && def.denyText && typeof showToast === 'function') showToast(this.scene, def.denyText, 1400);
      return;
    }
    if (this.energy < def.cost) {
      // Retour visuel : la barre d'énergie tremble (juice, HUD).
      juiceHudDeny(this.scene);
      return;
    }
    this.energy -= def.cost;
    juiceHudSkillPop(this.scene, slotIndex);
    playSfx(`skill_${skillId}`);
    this.scene.registry.set('energy', this.energy);
    this.lastSkillId = skillId;
    // Compétence INSTANTANÉE (cf. SKILL_DEFS.pierre/papillon dans
    // Projectiles.js) : `onActivate` fait tout (projectile, nuée...), sans
    // transformation ni hitbox getSkillHitbox().
    if (typeof def.onActivate === 'function') {
      this.skillCooldownEndTime = now + (def.cooldownMs ?? 300);
      def.onActivate(this, now);
      return;
    }
    this.beginSkill(skillId, now);
  }

  // Lance la transformation, l'animation et la zone de dégâts d'une compétence
  // (SKILL_DEFS ou INTERNAL_SKILL_DEFS), sans rien vérifier ni faire payer :
  // tryActivateSkill pour les touches A/F/R, ou le jeu lui-même (fracas de
  // l'ours-hibou à l'atterrissage).
  beginSkill(skillId, now) {
    const def = skillDefOf(skillId);
    if (!def) return;
    // Image provisoire d'un ours recoloré : fabriquée au premier lancer.
    if (typeof ursideEnsureSkillArt === 'function') ursideEnsureSkillArt(this.scene, def);
    // Léger cooldown propre à la compétence (pas juste borné par le coût en
    // énergie) : évite un spam à 2 activations la même frame si jamais le
    // coût devient très faible plus tard (totems ?).
    this.skillCooldownEndTime = now + def.transformDurationMs;

    this.skillTransformActive = true;
    this.skillTransformEndTime = now + def.transformDurationMs;
    this.activeSkillId = skillId;
    // Juice : éclat de transformation (ours : brun doré). Pas pour une
    // compétence interne : elle part d'une forme déjà prise.
    if (!def.internal) {
      spawnFx(this.scene, 'transform', this.x, this.y - 40, { color: skillId === 'ours' ? 0xd9a441 : (def.hudColor || 0x8fe3b8), size: 1 });
    }
    if (def.animKey) {
      // Art dédié (cf. SKILL_DEFS.ours) : le vrai changement de
      // texture/anim se fait dans update() (branché sur skillTransformActive
      // + activeSkillId), pas ici -- même schéma que formTransitionActive,
      // pour éviter un sursaut d'une frame avec l'ancienne texture à la
      // mauvaise échelle en posant texture ET hitbox ensemble au même endroit.
      // `transitionAnimKey` (transformation jouée AVANT l'anim d'attaque,
      // cf. update()) est optionnel -- 0 si absent, la branche skillArtActive
      // passe alors directement à l'anim d'attaque dès la 1re frame.
      this.skillTransitionEndTime = def.transitionAnimKey ? now + def.transitionDurationMs : now;
      // Fin de l'anim d'attaque = fin de la transfo d'entrée + sa propre
      // durée -- au-delà, update() passe à `transitionOutAnimKey` si la
      // compétence en a une (cf. SKILL_DEFS.ours).
      this.skillAttackEndTime = this.skillTransitionEndTime + (def.attackDurationMs || 0);
    } else {
      // Pas (encore) d'art dédié : habillage placeholder, teinte +
      // agrandissement du sprite de la forme courante.
      this.setTint(def.tint);
      this.setScale(FORMS[this.form].scale * def.scaleMultiplier);
    }

    // Zone de dégâts : centrée sur Agarica si `hitboxOffsetX` vaut 0 (cf.
    // l'Ours, un fracas touche des deux côtés), sinon décalée devant elle
    // dans le sens où elle regarde. Toujours calée sur ses pieds moins la
    // hauteur de la zone (donc "monte" depuis le sol). `skillSizeMultiplier`
    // (cf. recomputeTotemBonuses) grossit la zone selon les totems "dégâts"
    // équipés -- 1 si aucun.
    // Compétence sans zone de dégâts propre (panda, ours polaire : ses pics
    // sont des objets à part) : seulement son départ (`onStart`).
    if (!def.hitboxWidth) {
      this.skillHitboxId = null;
      this.skillHitboxRect = null;
      this.skillHitboxPendingRect = null;
      this.skillActiveUntil = now;
      if (typeof def.onStart === 'function') def.onStart(this, now);
      return;
    }
    // Palier 3 des ursidés (cf. Familles.js) : fracas d'ours plus larges.
    const size = this.skillSizeMultiplier * (def.family === 'ursides' ? this.bearSizeMultiplier : 1);
    const dir = this.facingDir >= 0 ? 1 : -1;
    const centerX = this.x + dir * def.hitboxOffsetX;
    const w = def.hitboxWidth * size;
    const h = def.hitboxHeight * size;
    const rect = new Phaser.Geom.Rectangle(centerX - w / 2, this.y - h, w, h);
    // `hitboxDelayMs` (cf. SKILL_DEFS.ours) repousse seulement l'ACTIVATION
    // de la zone (cf. update()), pas sa position -- figée ici, au moment du
    // cast, comme avant.
    const delay = def.hitboxDelayMs || 0;
    // `hitboxKind` : ce fracas compte comme celui d'une autre compétence
    // (ours-hibou -> 'ours' : blocs cassables et amas de mousse y réagissent).
    this.skillHitboxId = def.hitboxKind || skillId;
    if (delay > 0) {
      this.skillHitboxRect = null;
      this.skillHitboxPendingRect = rect;
      this.skillHitboxActivateAt = now + delay;
    } else {
      this.skillHitboxRect = rect;
      this.skillHitboxPendingRect = null;
    }
    this.skillActiveUntil = now + delay + def.hitboxDurationMs;
    if (typeof def.onStart === 'function') def.onStart(this, now);
  }

  // Recalcule maxHearts/maxEnergy/skillSizeMultiplier à partir de
  // `equippedTotem` (un seul {head, body}, cf. TOTEM_HEADS/TOTEM_BODIES)
  // puis replafonne hearts/energy dessus (au cas où le totem "vie"/
  // "énergie" vient d'être retiré et que le max a diminué sous la valeur
  // courante). Appelée à la création du joueur et à chaque changement
  // d'équipement (cf. CampfireMenuScene.applyDrop dans LevelKit.js). Plus
  // de cumul par nombre d'espèce (un seul totem possible à la fois,
  // demande explicite) -- le bonus du corps équipé s'applique tel quel,
  // une seule fois.
  recomputeTotemBonuses() {
    const bonus = { heartBonus: 0, energyBonus: 0, skillSizeBonus: 0 };
    // Démo (DEMO_TOTEMS_LOCKED) : totem équipé ignoré, mais gardé tel quel.
    const t = DEMO_TOTEMS_LOCKED ? { head: null, body: null } : (this.equippedTotem || { head: null, body: null });
    if (t.head && t.body) {
      const body = TOTEM_BODIES[t.body];
      bonus[body.statKey] += body.perStack;
    }
    // +1 cœur permanent : secret de la forêt sombre 2 (flag d'histoire
    // `coeurBonusForet`, cf. src/story/acte1.js), cumulé au bonus de totem.
    const storyHeartBonus = this.scene && this.scene.registry.get('coeurBonusForet') ? 1 : 0;
    // Cœurs entiers ramassés (coffres, trésors, marchand : registre
    // `heartUpgrades`, cf. heartUpgradeCount dans SecretKit.js).
    const upgrades = typeof heartUpgradeCount === 'function' ? heartUpgradeCount() : 0;
    // Passifs de famille (cf. Familles.js), comptés sur les animaux ÉQUIPÉS.
    // Ursidés : 2 -> +1 cœur, 3 -> fracas d'ours plus larges, 4 -> plus de
    // recul sous les coups. Sans ours équipé en plus : rien ne change.
    const fam = typeof familyPassiveStats === 'function' ? familyPassiveStats(this) : { hearts: 0, bearSize: 0, steadfast: false };
    this.bearSizeMultiplier = 1 + (fam.bearSize || 0);
    this.knockbackImmune = !!fam.steadfast;
    this.familySig = typeof familyTeamSignature === 'function' ? familyTeamSignature(this) : null;
    this.maxHearts = HEART_MAX + bonus.heartBonus + storyHeartBonus + upgrades + (fam.hearts || 0);
    this.maxEnergy = ENERGY_MAX + bonus.energyBonus;
    this.skillSizeMultiplier = 1 + bonus.skillSizeBonus;
    this.hearts = Math.min(this.hearts, this.maxHearts);
    this.energy = Math.min(this.energy, this.maxEnergy);
  }

  // Vrai en jeu seulement si la forme est À LA FOIS débloquée (hasXForm)
  // ET glissée dans un emplacement au feu de camp (cf. equippedForms,
  // CampfireMenuScene dans LevelKit.js) -- demande explicite : un vrai
  // choix fonctionnel, pas juste un affichage.
  formEquipped(key) {
    return this.equippedForms.includes(key);
  }

  // --- Emplacements de formes (sol / aérien / eau) -------------------------

  isFormUnlocked(id) {
    return !!this[FORM_FLAG_BY_ID[id]];
  }

  // Forme au sol réellement utilisable ('wolf' | 'grizzly' | null).
  getActiveGroundForm() {
    const id = GROUND_FORM_IDS.find((g) => this.equippedForms.includes(g));
    return id && this.isFormUnlocked(id) ? id : null;
  }

  // Grizzly lancé en charge (au-delà du seuil de vitesse, cf. Ursides.js).
  isGrizzlyCharging() {
    return !!this.grizzlyCharging && this.form === 'grizzly';
  }

  // Percussion du grizzly en charge (mur, ou gros ennemi : cf.
  // ursideChargeContact) : la forme casse, Agarica est projetée en diagonale,
  // vers le haut et l'arrière, sans perdre de cœur (courte invulnérabilité).
  // L'impact frappe devant lui (ennemis, blocs cassables de l'ours).
  grizzlyCrash(now, dir, opts = {}) {
    const T = GRIZZLY_TUNING;
    const b = this.body;
    this.grizzlyCharging = false;
    this.grizzlyRamp = 0;
    this.wolfSprintActive = false;
    this.wolfJumpCarry = false;
    this.tapSprintDirection = null;
    this.groundFormLocked = true;
    this.controlLockUntil = now + T.crashLockMs;
    // Comme après un premier saut : le 2e saut (forme aérienne) reste possible.
    this.jumpsUsed = 1;
    this.airJumpForm = null;
    this.jumpCutArmed = false;
    // Élan de la projection gardé jusqu'au sol (même mécanisme que le lâcher
    // de liane : vitesse max relevée, frein de l'air réduit).
    this.vineMomentumSpeed = T.crashVx;
    b.maxVelocity.x = Math.max(b.maxVelocity.x, T.crashVx);
    this.setAccelerationX(0);
    this.setVelocity(-dir * T.crashVx, T.crashVy);
    this.grantStoryInvulnerability(T.crashInvulnMs, { blink: false });
    const size = this.bearSizeMultiplier || 1;
    const w = T.impactW * size;
    const h = T.impactH * size;
    const x = dir > 0 ? b.right - 12 : b.left + 12 - w;
    this.grizzlyImpact = {
      rect: new Phaser.Geom.Rectangle(x, b.bottom - h, w, h), until: now + T.impactMs, token: `charge-${this.grizzlyChargeId}`,
    };
    ursideCrashFx(this, dir > 0 ? b.right : b.left, b.center.y);
    this.scene.events.emit('grizzly-crash', { player: this, dir, enemy: opts.enemy || null });
  }

  // Zone d'impact de la percussion en cours, ou null (lue par SecretKit :
  // elle casse les blocs de l'ours).
  getGrizzlyImpactRect() {
    const imp = this.grizzlyImpact;
    return imp && this.scene.time.now < imp.until ? imp.rect : null;
  }

  // Forme aérienne réellement utilisable ('eagle' | 'monkey' | 'owlbear' | null).
  getActiveAirForm() {
    return this.airForm && this.isFormUnlocked(this.airForm) ? this.airForm : null;
  }

  // Choix initial : `airForm` du registre s'il est valide ; sinon déduit
  // d'`equippedForms` (anciennes sauvegardes / triche : aigle prioritaire) ;
  // jamais choisi et rien d'équipé → la forme aérienne débloquée (aigle si
  // les deux), pour qu'une forme obtenue sans feu de camp marche aussitôt.
  // Vieille sauvegarde où le papillon (forme aérienne retirée, cf.
  // OBSOLETE_AIR_FORM_IDS) était équipé : même repli -- l'aigle ou le singe
  // débloqué reprend l'emplacement, sinon aucun (un seul saut). applyAirForm,
  // juste après, réécrit `airForm` / `equippedForms` (sauvegarde migrée).
  resolveInitialAirForm(regAir) {
    if (regAir === null) return null;
    if (AIR_FORM_IDS.includes(regAir) && this.isFormUnlocked(regAir)) return regAir;
    const inSlots = AIR_FORM_IDS.filter((id) => this.equippedForms.includes(id) && this.isFormUnlocked(id));
    if (inSlots.length) return inSlots.includes('eagle') ? 'eagle' : inSlots[0];
    const obsolete = OBSOLETE_AIR_FORM_IDS.includes(regAir)
      || this.equippedForms.some((f) => OBSOLETE_AIR_FORM_IDS.includes(f));
    if (obsolete || (regAir === undefined && this.equippedForms.every((f) => !f))) {
      if (this.hasEagleForm) return 'eagle';
      if (this.hasMonkeyForm) return 'monkey';
    }
    return null;
  }

  // Normalise `equippedForms` en [sol, aérien, eau] et écrit `airForm` +
  // `equippedForms` au registre. NOUVEAU tableau à chaque fois : la
  // détection de changement externe (triche) compare la référence.
  applyAirForm(id) {
    this.airForm = AIR_FORM_IDS.includes(id) ? id : null;
    const slots = [
      GROUND_FORM_IDS.find((g) => this.equippedForms.includes(g)) || null,
      this.airForm,
      this.equippedForms.includes('octopus') ? 'octopus' : null,
    ];
    this.equippedForms = slots;
    this.equippedFormsRef = slots;
    playerStateSet(this.scene, 'equippedForms', slots);
    playerStateSet(this.scene, 'airForm', this.airForm);
  }

  // API du feu de camp : équipe une forme dans SON emplacement (le singe
  // remplace l'aigle et inversement).
  equipForm(id) {
    if (AIR_FORM_IDS.includes(id)) {
      this.applyAirForm(id);
      return;
    }
    // Sol : le grizzly remplace le loup et inversement.
    const ground = GROUND_FORM_IDS.includes(id);
    if (!ground && id !== 'octopus') return;
    const next = this.equippedForms.filter((f) => f && f !== id && !(ground && GROUND_FORM_IDS.includes(f)));
    next.push(id);
    this.equippedForms = next;
    this.applyAirForm(this.airForm);
  }

  unequipForm(id) {
    if (AIR_FORM_IDS.includes(id)) {
      if (this.airForm === id) this.applyAirForm(null);
      return;
    }
    this.equippedForms = this.equippedForms.map((f) => (f === id ? null : f));
    this.applyAirForm(this.airForm);
  }

  // Appelée en tête d'update() : rattrape les changements faits hors de
  // Player (totem LevelKit, cinématique storySet, triche Ctrl+Shift+D).
  syncFormSlots() {
    const reg = this.scene.registry;
    for (const flag of Object.values(FORM_FLAG_BY_ID)) {
      if (!this[flag] && reg.get(flag)) this[flag] = true;
    }
    // Une forme aérienne débloquée en cours de jeu devient la forme active.
    for (const id of AIR_FORM_IDS) {
      if (this.isFormUnlocked(id) && !this.airFormsSeen[id]) {
        this.airFormsSeen[id] = true;
        this.applyAirForm(id);
        return;
      }
    }
    if (this.equippedForms !== this.equippedFormsRef) {
      // Tableau remplacé de l'extérieur (triche) ou muté par un totem.
      const inSlots = AIR_FORM_IDS.filter((id) => this.equippedForms.includes(id));
      const air = inSlots.length === 1 ? inSlots[0]
        : inSlots.length > 1 ? (inSlots.includes(this.airForm) ? this.airForm : 'eagle')
          : null;
      this.applyAirForm(air);
      return;
    }
    const regAir = reg.get('airForm');
    if (regAir !== undefined && regAir !== this.airForm) this.applyAirForm(regAir);
  }

  // --- Lianes (forme singe) --------------------------------------------------

  grabVine(vine, now) {
    this.vine = vine;
    vine.attach(this);
    this.jumpsUsed = 1;
    this.airJumpForm = 'monkey';
    this.vineMomentumSpeed = 0;
    this.vineFlight = false;
    this.wolfJumpCarry = false;
    this.vineDir = 0;
    this.vineLook = 0;
    this.vineSwingPose = false;
    // Montée/descente : distance parcourue le long de la liane (rythme des
    // mains, cf. stepVinePhysics / applyVinePose).
    this.vineClimbDist = 0;
    this.vineClimbMovedAt = -Infinity;
    // Une transfo en cours (saut du singe juste avant la prise) s'afficherait
    // ancrée aux pieds, sous la liane : la pose suspendue prend la main tout de suite.
    this.formTransitionActive = false;
    // Plus d'élan balistique : c'est la liane qui pilote le corps dès le
    // prochain pas de physique (cf. stepVinePhysics).
    this.setVelocity(0, 0);
    this.body.maxVelocity.set(VINE_BODY_MAX_SPEED, VINE_BODY_MAX_SPEED);
    // Juice : feuilles qui tombent de la prise, liane qui vibre.
    spawnFx(this.scene, 'leaves', this.x, this.y - VINE_HANG_OFFSET, { count: 5, power: 0.7 });
    if (typeof vine.twang === 'function') vine.twang(0.8);
    playSfx('vine_grab');
    this.scene.events.emit('vine-grab', vine);
  }

  // Balancement, appelé à CHAQUE pas de physique (événement WORLD_STEP, 60 Hz
  // fixes) et non une fois par image affichée. Cause du tremblement sur liane :
  // la vitesse était calculée pour atteindre la cible en `game.loop.delta`
  // (≈ 7 ms à 144 Hz, 6 ms en test headless) alors qu'Arcade l'intègre par pas
  // de 16,7 ms, 0, 1 ou 2 fois par image -- le corps dépassait la cible de 2 à
  // 3 fois puis revenait (±20 px d'une image à l'autre), pendant que la liane,
  // elle, était redessinée à son angle exact : main décalée, singe qui
  // tressaute. Ici la cible du pas suivant est atteinte en un pas exactement,
  // et la liane est dessinée à l'angle qui correspond à la position du corps
  // (cf. Liane.drawTheta), quel que soit le rythme de l'écran. Les collisions
  // restent celles d'Arcade (vitesse intégrée, séparation normale).
  stepVinePhysics(delta) {
    const vine = this.vine;
    if (!vine || !this.active || !this.body || !vine.alive || delta <= 0) return;
    // Monde gelé (dialogue, menu, cinématique) : la physique tourne encore,
    // mais la liane ne doit plus déplacer Agarica (gravité coupée sur liane).
    if (typeof isWorldFrozen === 'function' && isWorldFrozen(this.scene)) {
      this.body.setVelocity(0, 0);
      return;
    }
    const b = this.body;
    // Mur dans le sens du balancement : renvoi (une fois, pas à chaque pas
    // de la même image -- `blocked` n'est remis à zéro qu'au 1er pas).
    if ((b.blocked.right && vine.omega > 0) || (b.blocked.left && vine.omega < 0)) vine.bounceOffWall();
    const r0 = vine.swingR;
    const target = vine.stepSwing(this, this.vineDir, delta, this.vineClimb || 0);
    // Grimpe (Z/S) mesurée ICI, au pas de physique, et non d'une image
    // affichée à l'autre : sur un écran à plus de 60 Hz, une image sur deux ou
    // trois n'a aucun pas de physique, les mains n'y bougent pas, et la pose
    // retombait sur la pose suspendue -- les deux poses alternaient à chaque
    // image (bug signalé : « superpose la pose de base et en basse opacité
    // l'animation de montée »). applyVinePose lit vineClimbMovedAt.
    const dr = Math.abs(vine.swingR - r0);
    if (this.vineClimb && dr > 0.01) {
      this.vineClimbDist += dr;
      this.vineClimbMovedAt = this.scene.time.now;
    }
    // Pieds = bas-centre du corps (invariant de toutes les hitbox du joueur,
    // cf. FORMS et applyVineArtAnchor) ; `this.x/y` ne sont resynchronisés
    // sur le corps qu'en fin d'image.
    b.setVelocity((target.x - b.center.x) / delta, (target.y - b.bottom) / delta);
  }

  // `withJump` : lâcher par Saut (élan + petite impulsion vers le haut) ;
  // sinon simple chute (S, forme retirée, coup reçu...).
  releaseVine(withJump, now) {
    const vine = this.vine;
    if (!vine) return;
    const v = vine.detach(this);
    this.vine = null;
    this.vineClimb = 0;
    this.lastVine = vine;
    this.vineReleasedAt = now;
    // Le lâcher EST le saut du singe : il compte comme le double saut -- plus
    // aucun saut avant le sol ou la prochaine liane (qui recharge, cf. grabVine).
    this.jumpsUsed = 2;
    this.airJumpForm = 'monkey';
    let vx = v.vx;
    let vy = v.vy;
    this.vineFlight = false;
    if (withJump) {
      // Sens du vol : celui du balancement ; presque à l'arrêt, la direction
      // tenue, sinon le regard (cf. VINE_RELEASE_MIN_VX dans Liane.js).
      const sign = Math.abs(vx) > 40 ? Math.sign(vx)
        : (this.vineDir || (this.vineLook || (this.facingDir >= 0 ? 1 : -1)));
      vx = sign * Phaser.Math.Clamp(Math.abs(vx) * VINE_RELEASE_SPEED_MULT, VINE_RELEASE_MIN_VX, VINE_MAX_CARRY_SPEED);
      vy = Math.min(vy, 0) + VINE_RELEASE_BOOST_Y;
      this.monkeyReleasePoseUntil = now + MONKEY_RELEASE_POSE_MS;
      // Vol plané jusqu'au sol ou à la prochaine liane (cf. update()).
      this.vineFlight = true;
    }
    this.setVelocity(vx, vy);
    this.body.maxVelocity.y = PLAYER_MAX_FALL_SPEED;
    this.vineMomentumSpeed = Math.min(Math.abs(vx), VINE_MAX_CARRY_SPEED);
    this.body.maxVelocity.x = Math.max(this.body.maxVelocity.x, this.vineMomentumSpeed);
    // Garde le sens du balancement au lâcher (sinon, sans touche tenue, le
    // singe se retournait vers la dernière direction pressée).
    if (Math.abs(vx) > 40) this.facingDir = vx > 0 ? 1 : -1;
    // Juice : la liane fouette, feuilles et traits de vitesse au lâcher sauté.
    if (typeof vine.twang === 'function') vine.twang(withJump ? 1 : 0.5);
    if (withJump) {
      spawnFx(this.scene, 'leaves', this.x, this.y - VINE_HANG_OFFSET, { count: 6, power: 1 });
      spawnFx(this.scene, 'streaks', this.x, this.y - 30, { dir: vx >= 0 ? 1 : -1, count: 3, spread: 18 });
      juiceSquash(this, 0.88, 1.14, 200);
      playSfx('vine_release');
    }
    this.scene.events.emit('vine-release', vine);
  }

  // --- Pose papillon (compétence de soin) -------------------------------------
  // (L'ancienne forme aérienne papillon -- battement + dash en diagonale -- a
  // été retirée : le papillon n'est plus qu'une compétence, cf. AIR_FORM_IDS.)

  // Poussière lumineuse (pose de soin sans art de transformation).
  // Art : étincelles `fx_etincelle_papillon` (lot n°8, déjà rose et cyan, non
  // teintées) à 16 px -- leur taille utile --, rétrécies en RELATIF (× 0,3,
  // comme les points de repli) ; repli : points colorés dessinés.
  spawnButterflySparkles(count) {
    const sc = this.scene;
    const cx = this.x;
    const cy = this.y - BUTTERFLY_CENTER_ABOVE_FEET;
    const art = sc.textures.exists('item-fx_etincelle_papillon');
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      let base = 1;
      let dot;
      if (art) {
        base = (BUTTERFLY_SPARKLE_ART_SIZE * Phaser.Math.FloatBetween(0.75, 1)) / 128;
        dot = sc.add.image(cx, cy, 'item-fx_etincelle_papillon').setScale(base).setRotation(Math.random() * 0.6 - 0.3);
      } else {
        dot = sc.add.circle(cx, cy, Phaser.Math.Between(2, 4), BUTTERFLY_DUST_COLORS[i % BUTTERFLY_DUST_COLORS.length], 1);
      }
      dot.setDepth(this.depth + 1).setBlendMode(Phaser.BlendModes.ADD);
      sc.tweens.add({
        targets: dot, x: cx + Math.cos(a) * Phaser.Math.Between(18, 42), y: cy + Math.sin(a) * Phaser.Math.Between(14, 34),
        alpha: 0, scale: base * 0.3, duration: Phaser.Math.Between(260, 420), ease: 'Quad.easeOut', onComplete: () => dot.destroy(),
      });
    }
  }

  // Pose suspendue (art `singe`, dessiné face à DROITE) : choisie d'après
  // l'état du pendule, pas d'après une anim jouée en boucle. Avant :
  // `liane_hang` / `liane_swing` alternaient selon |omega| > 0,8 -- deux fois
  // par oscillation (omega s'annule aux extrêmes), chaque bascule relançant
  // l'anim à sa 1re frame ; le singe se retournait aussi à chaque changement
  // de touche (pompe gauche/droite) ; le corps restait vertical sous une
  // liane penchée. Maintenant : sens = sens du balancement, pose suspendue au
  // repos (anim lente) / poses de balancement selon la phase, avec hystérésis,
  // et dessin incliné avec la liane autour du poing (cf. applyVineArtAnchor).
  applyVinePose() {
    const sc = this.scene;
    const vine = this.vine;
    const theta = vine.displayAngle;
    const om = vine.omega;
    if (Math.abs(om) > VINE_LOOK_OMEGA) this.vineLook = om > 0 ? 1 : -1;
    if (!this.vineLook) this.vineLook = this.facingDir >= 0 ? 1 : -1;
    this.facingDir = this.vineLook;
    if (this.vineSwingPose) {
      if (Math.abs(om) < VINE_SWING_POSE_EXIT.omega && Math.abs(theta) < VINE_SWING_POSE_EXIT.angle) this.vineSwingPose = false;
    } else if (Math.abs(om) > VINE_SWING_POSE_ENTER.omega || Math.abs(theta) > VINE_SWING_POSE_ENTER.angle) {
      this.vineSwingPose = true;
    }
    // Montée / descente (Z/↑, S/↓) : mains l'une après l'autre au rythme de
    // la distance parcourue le long de la liane (une prise tous les
    // VINE_CLIMB_STEP_PX) -- anim `climb` (`singe_extra`, sinon `singe`) si
    // l'art existe, sinon les poses suspendues `liane_hang` + un léger
    // mouvement de traction. « Grimpe » = touche tenue ET mains qui ont bougé
    // dans les VINE_CLIMB_POSE_HOLD_MS (cf. stepVinePhysics) : la même pose à
    // CHAQUE image affichée, avec ou sans pas de physique ; arrêtée en haut ou
    // en bas de la liane, la pose suspendue revient.
    const climbing = this.vineClimb && this.scene.time.now - this.vineClimbMovedAt <= VINE_CLIMB_POSE_HOLD_MS;
    if (climbing) {
      this.applyVineClimbPose(theta);
      return;
    }
    const swingFrames = sc.anims.exists('singe-liane_swing') ? sc.anims.get('singe-liane_swing').frames : null;
    if (this.vineSwingPose && swingFrames && swingFrames.length >= 4) {
      // Phase : s > 0 = côté vers lequel elle file. Frames de la planche :
      // 0 jambes traînées derrière, 1 jambes repliées, 3 droite à la
      // verticale, 2 jambes lancées devant. Au retournement (extrême),
      // `vineLook` change de signe en même temps que `s` : on passe de 2 à 0,
      // jambes toujours du même côté de l'écran.
      const s = theta * this.vineLook;
      const idx = s < -0.45 ? 0 : s < -0.12 ? 1 : s < 0.32 ? 3 : 2;
      this.anims.stop();
      this.setTexture(swingFrames[idx].textureKey);
    } else if (hasManifestArt(sc, 'singe', 'liane_hang')) {
      this.playVineHangAnim();
    } else if (hasManifestArt(sc, 'agarica_extra', 'liane_hang')) {
      this.applyAgaricaExtraPose('liane_hang');
      return;
    } else {
      playManifestOn(this, 'singe', 'liane_hang');
    }
    this.setFlipX(MONKEY_FACES_RIGHT ? this.vineLook < 0 : this.vineLook > 0);
    this.applyVineArtAnchor(-theta * VINE_ART_TILT);
  }

  // Pose suspendue `singe-liane_hang` (boucle lente). `play(key, true)` et non
  // playManifestOn : la grimpe et les poses de balancement arrêtent l'anim
  // pour poser leurs images une à une (setTexture), et playManifestOn garde
  // alors l'image figée d'une anim arrêtée (garde prévue pour les anims non
  // bouclées) -- la dernière image de GRIMPE restait affichée au repos, à
  // l'échelle de la pose suspendue (plus petite d'un cinquième). Ici l'anim
  // repart dès qu'elle n'est plus en cours ; sinon elle continue.
  playVineHangAnim() {
    if (this.scene.anims.exists('singe-liane_hang')) this.anims.play('singe-liane_hang', true);
    else playManifestOn(this, 'singe', 'liane_hang');
  }

  // Pose de grimpe (cf. applyVinePose) : frame choisie d'après la distance
  // parcourue (descendre rejoue les mêmes prises), dessin incliné avec la
  // liane comme la pose suspendue.
  applyVineClimbPose(theta) {
    const sc = this.scene;
    const step = Math.floor(this.vineClimbDist / VINE_CLIMB_STEP_PX);
    let body = FORMS.monkey.body;
    let bob = 0;
    // Art de grimpe : `singe_extra` (lot n°8), sinon `singe` (ancien emplacement).
    const climbId = ['singe_extra', 'singe'].find((id) => hasManifestArt(sc, id, 'climb') && sc.anims.exists(`${id}-climb`));
    if (climbId) {
      const frames = sc.anims.get(`${climbId}-climb`).frames;
      this.anims.stop();
      this.setTexture(frames[step % frames.length].textureKey);
      // Feuille de l'art de grimpe (peut-être une autre image source) : son échelle.
      const cfg = agaricaSheetPoseConfig(sc, climbId, 'climb', { method: 'area' });
      this.applyBodyForScale(cfg.scale, cfg.body);
      body = cfg.body;
    } else {
      const hang = sc.anims.exists('singe-liane_hang') ? sc.anims.get('singe-liane_hang').frames : null;
      if (hang && hang.length && hasManifestArt(sc, 'singe', 'liane_hang')) {
        this.anims.stop();
        this.setTexture(hang[step % hang.length].textureKey);
      } else if (hasManifestArt(sc, 'agarica_extra', 'liane_hang')) {
        // Sans art singe mais avec Agarica suspendue : même pose qu'au repos
        // (cf. applyVinePose), plutôt que le placeholder du singe.
        this.applyAgaricaExtraPose('liane_hang');
        return;
      } else {
        playManifestOn(this, 'singe', 'liane_hang');
      }
      // Traction : le corps remonte d'un cran à chaque prise puis se relâche.
      const k = (this.vineClimbDist / VINE_CLIMB_STEP_PX) % 1;
      bob = Math.sin(k * Math.PI) * VINE_CLIMB_BOB_PX;
    }
    this.setFlipX(MONKEY_FACES_RIGHT ? this.vineLook < 0 : this.vineLook > 0);
    this.applyVineArtAnchor(-theta * VINE_ART_TILT, bob, body);
  }

  // Art singe suspendu : le poing levé est dessiné 64-96 px au-dessus des
  // pieds, alors que la physique tient les mains à VINE_HANG_OFFSET (58 px,
  // cf. Liane.js -- portée de prise calibrée sur les niveaux). Plutôt que de
  // changer cette physique, on cale le DESSIN : l'origine (pivot de la
  // rotation) est choisie pour que le poing de la frame courante tombe sur le
  // point de prise, les pieds physiques (this.x, this.y) restant 58 px
  // dessous ; le corps physique est compensé pour ne pas bouger d'un pixel.
  // Repère : texture (u, v) -> monde = pieds + R(rot)·(sx·(u − u0), s·(v − v0)),
  // sx = −s quand flipX (Phaser miroite autour de l'origine : u0 = W − originX·W).
  // Poing -> prise impose u0 = poingX + 58·sin(rot)/sx, v0 = poingY + 58·cos(rot)/s.
  // `lift` : px dont le dessin remonte le long de la liane (traction de la
  // grimpe) ; `body` : hitbox de la feuille affichée (gabarit fixe).
  applyVineArtAnchor(rotation = 0, lift = 0, body = FORMS.monkey.body) {
    const info = textureAlphaInfo(this.scene, this.texture.key);
    if (!info || typeof VINE_HANG_OFFSET === 'undefined') return;
    const W = this.frame.realWidth;
    const H = this.frame.realHeight;
    const s = this.scaleY;
    const sx = this.flipX ? -this.scaleX : this.scaleX;
    const hang = VINE_HANG_OFFSET + lift;
    const u0 = info.fistX + (hang * Math.sin(rotation)) / sx;
    const v0 = info.fistY + (hang * Math.cos(rotation)) / s;
    this.setRotation(rotation);
    this.setOrigin((this.flipX ? W - u0 : u0) / W, v0 / H);
    const b = body;
    this.body.setOffset(b.offsetX + (this.displayOriginX - W / 2), b.offsetY + (this.displayOriginY - H));
    this.vineArtAnchored = true;
  }

  resetVineArtAnchor() {
    if (!this.vineArtAnchored) return;
    this.vineArtAnchored = false;
    this.setOrigin(0.5, 1);
    this.setRotation(0);
  }

  // Échelle + hitbox d'une rangée `agarica_extra` : échelle de SA FEUILLE
  // Codex (cf. agaricaSheetScale -- 4 images dessinées à des échelles
  // différentes : `death`/`sad` prennent celle de `talk`, debout, dessinés
  // ensemble ; les sauts et `hurt`, sans pose debout, leur surface visible).
  extraPoseConfig(anim) {
    return agaricaSheetPoseConfig(this.scene, 'agarica_extra', anim);
  }

  applyAgaricaExtraPose(anim) {
    const cfg = this.extraPoseConfig(anim);
    playManifestOn(this, 'agarica_extra', anim);
    this.applyBodyForScale(cfg.scale, cfg.body);
    this.setFlipX(AGARICA_EXTRA_FACES_RIGHT ? this.facingDir < 0 : this.facingDir > 0);
  }

  // --- Compétences « avec la forme » (2026-10-23, demande utilisateur) -----
  // Pierre : Agarica devient brièvement le SINGE qui lance la pierre ;
  // papillon (soin) : elle devient la FORME PAPILLON au centre de la nuée.
  // Purement visuel (corps physique, énergie et délais inchangés) : phases
  // 'in' (transfo dessinée, saut net + gerbe de feuilles sans l'art), 'act'
  // (lancer / battement), 'out' (transfo à l'envers). Seulement depuis la
  // forme humaine ; sinon la compétence part comme avant (cf. Projectiles.js).
  // `onRelease` : appelé au moment du lâcher (pierre), une seule fois, même
  // si la pose est interrompue (coup reçu, changement de forme).
  // Renvoie false si la pose ne peut pas être jouée.
  startSkillFormPose(kind, now, { onRelease = null } = {}) {
    if (this.form !== 'agarica' || this.vine || this.storyPose) return false;
    const prev = this.skillFormPose;
    // Relance pendant la pose (pierre en rafale) : déjà singe, on enchaîne le lancer.
    const chained = prev && prev.kind === kind && prev.phase !== 'out';
    if (prev) this.endSkillFormPose(true);
    const t = SKILL_FORM_POSE_MS[kind];
    const hasIn = kind === 'pierre' ? !!this.monkeyTransfoAnimKey : !!this.butterflyTransfoKey;
    const inMs = chained ? 0 : (hasIn ? t.in : 0);
    const outMs = hasIn ? t.out : 0;
    this.skillFormPose = {
      kind, start: now, phase: inMs ? 'in' : 'act', inEnd: now + inMs, actEnd: now + inMs + t.act,
      end: now + inMs + t.act + outMs, releaseAt: now + inMs + t.act * t.releaseAt, released: false, onRelease,
      puffOut: !hasIn,
    };
    // Cassure d'un coup en cours : c'est la compétence qui prend la main.
    this.isAttacking = false;
    this.slashDir = null;
    if (!hasIn && !chained) this.spawnSkillFormPuff(kind);
    return true;
  }

  endSkillFormPose(releaseNow = false) {
    const p = this.skillFormPose;
    if (!p) return;
    if (!p.released && p.onRelease && releaseNow) { p.released = true; p.onRelease(); }
    this.skillFormPose = null;
  }

  // Horloge de la pose (début d'update, quel que soit l'affichage : la pierre
  // part à l'heure même si un autre rendu a la main cette image).
  tickSkillFormPose(now) {
    const p = this.skillFormPose;
    if (!p) return;
    if (!p.released && p.onRelease && now >= p.releaseAt) { p.released = true; p.onRelease(); }
    // Coup reçu, pose narrative, liane : la pose s'efface.
    if (now < this.hurtPoseUntil || this.storyPose || this.vine) { this.endSkillFormPose(true); return; }
    if (now >= p.end) {
      if (p.puffOut) this.spawnSkillFormPuff(p.kind);
      this.endSkillFormPose(true);
      return;
    }
    p.phase = now < p.inEnd ? 'in' : now < p.actEnd ? 'act' : 'out';
  }

  // Affichage (branche forme humaine d'update) ; true si la pose a été dessinée.
  drawSkillFormPose(now) {
    const p = this.skillFormPose;
    if (!p) return false;
    const sc = this.scene;
    const progress = (a, b) => Phaser.Math.Clamp((now - a) / Math.max(1, b - a), 0, 0.999);
    const frameAt = (animKey, k, reverse = false) => {
      const frames = sc.anims.exists(animKey) ? sc.anims.get(animKey).frames : null;
      if (!frames || !frames.length) return false;
      const i = Math.floor(k * frames.length);
      this.anims.stop();
      this.setTexture(frames[reverse ? frames.length - 1 - i : i].textureKey);
      return true;
    };
    if (p.kind === 'pierre') {
      // Singe : art dessiné face à DROITE (cf. MONKEY_FACES_RIGHT).
      this.setFlipX(MONKEY_FACES_RIGHT ? this.facingDir < 0 : this.facingDir > 0);
      if (p.phase === 'in' || p.phase === 'out') {
        const k = p.phase === 'in' ? progress(p.start, p.inEnd) : progress(p.actEnd, p.end);
        const base = this.monkeyTransfoAnimKey && sc.anims.exists(this.monkeyTransfoAnimKey) ? this.monkeyTransfoAnimKey : null;
        if (!base || !frameAt(base, k, p.phase === 'out')) return false;
        this.applyBodyForScale(this.monkeyTransfoCfg.scale, this.monkeyTransfoCfg.body);
        return true;
      }
      const k = progress(p.inEnd, p.actEnd);
      // Lancer : `singe_extra` (lot n°8), sinon `singe` (ancien emplacement).
      const throwId = ['singe_extra', 'singe'].find((id) => hasManifestArt(sc, id, 'throw'));
      // `singe_extra` : les 3 premières images (prise, élan, bras tendu, pierre
      // en main) se partagent le geste AVANT le lâcher, la 4e (main vide) vient
      // pile quand la pierre part (releaseAt) -- avant, l'image vide tombait au
      // milieu du geste et la pierre semblait partir de nulle part. Horaire du
      // lâcher et position du projectile inchangés.
      let kThrow = k;
      if (throwId === 'singe_extra') {
        const rel = SKILL_FORM_POSE_MS.pierre.releaseAt;
        const i = k < rel ? Math.min(2, Math.floor((k / rel) * 3)) : 3;
        kThrow = (i + 0.5) / 4;
      }
      if (throwId && frameAt(`${throwId}-throw`, kThrow)) {
        const cfg = agaricaSheetPoseConfig(sc, throwId, 'throw', { method: 'area' });
        this.applyBodyForScale(cfg.scale, cfg.body);
        return true;
      }
      // Sans art de lancer : singe debout + geste du corps (élan en arrière,
      // détente vers l'avant au lâcher, retour), pivot aux pieds.
      if (!(hasManifestArt(sc, 'singe', 'idle') && frameAt('singe-idle', 0))) playManifestOn(this, 'singe', 'idle');
      const cfg = agaricaSheetPoseConfig(sc, 'singe', 'idle', { method: 'area' });
      this.applyBodyForScale(cfg.scale, cfg.body);
      const rel = SKILL_FORM_POSE_MS.pierre.releaseAt;
      const lean = k < rel ? -0.3 * Math.sin((k / rel) * Math.PI / 2)
        : k < rel + 0.2 ? -0.3 + 0.55 * ((k - rel) / 0.2)
          : 0.25 * (1 - (k - rel - 0.2) / (0.8 - rel));
      this.setRotation(lean * this.facingDir);
      this.vineArtAnchored = true; // origine/rotation remises à zéro à l'image suivante
      return true;
    }
    // Papillon : forme papillon centrée sur le buste (au centre de la nuée).
    let cfg = FORMS.butterfly;
    if (p.phase === 'in' || p.phase === 'out') {
      const k = p.phase === 'in' ? progress(p.start, p.inEnd) : progress(p.actEnd, p.end);
      if (!this.butterflyTransfoKey || !frameAt(this.butterflyTransfoKey, k, p.phase === 'out')) return false;
      // Lueur douce au tout début de la transfo et à la dernière image du
      // retour (masque la bascule de silhouette, sans changer la pose).
      if (p.phase === 'in' && !p.glowIn) { p.glowIn = true; this.butterflyPoseGlow(); }
      if (p.phase === 'out' && k > 0.7 && !p.glowOut) { p.glowOut = true; this.butterflyPoseGlow(); }
      const place = this.butterflyTransfoPlacement(k, p.phase === 'out');
      if (place) {
        // Échelle / hauteur interpolées (cf. butterflyTransfoPlacement).
        this.applyBodyForScale(place.scale, place.body);
        this.setFlipX(this.facingDir < 0);
        this.setRotation(0);
        this.setOrigin(0.5, place.originY);
        const W = this.frame.realWidth;
        const H = this.frame.realHeight;
        this.body.setOffset(place.body.offsetX + (this.displayOriginX - W / 2), place.body.offsetY + (this.displayOriginY - H));
        this.vineArtAnchored = true;
        return true;
      }
      cfg = agaricaSheetPoseConfig(sc, 'transfo_papillon', 'transform');
    } else if (hasManifestArt(sc, 'forme_papillon_extra', 'cast')) {
      // Incantation du soin : `forme_papillon_extra` (lot n°8). Calibrée sur
      // sa SEULE feuille (ailes repliées en incantation : moins de surface),
      // elle sortait 12 % plus petite que le papillon qu'elle prolonge ; elle
      // prend donc l'échelle de `forme_papillon` (FORMS.butterfly) -- sans cet
      // art, FORMS.butterfly est le placeholder à l'échelle 1 : on garde alors
      // la calibration propre. Hitbox : même gabarit humain, recentré.
      // Image tirée de l'horloge de la pose (les 4 sur la durée du geste) :
      // l'anim jouée était ralentie par le ralenti du soin de Ghil't et
      // s'arrêtait avant l'orbe (images 3 et 4 jamais vues).
      if (!frameAt('forme_papillon_extra-cast', progress(p.inEnd, p.actEnd))) playManifestOn(this, 'forme_papillon_extra', 'cast');
      const c = agaricaSheetPoseConfig(sc, 'forme_papillon_extra', 'cast', { method: 'area' });
      const s = this.butterflyArt ? FORMS.butterfly.scale : c.scale;
      cfg = { ...c, scale: s, body: transfoBodyConfig(c.frameWidth, c.frameHeight, s) };
    } else if (this.butterflyArt) {
      const anim = ['cast', 'glide', 'flap'].find((a) => hasManifestArt(sc, 'forme_papillon', a));
      if (anim) {
        playManifestOn(this, 'forme_papillon', anim);
        cfg = agaricaSheetPoseConfig(sc, 'forme_papillon', anim, { method: 'area' });
      }
    } else {
      this.anims.play(ANIM_BUTTERFLY_PH_KEY, true);
    }
    // Étincelles d'ailes peintes (`fx_etincelle_papillon`, recette 'wing')
    // autour du papillon pendant le geste.
    if (p.phase === 'act' && now >= (p.dustAt || 0) && typeof spawnFx === 'function') {
      p.dustAt = now + BUTTERFLY_DUST_EVERY_MS;
      spawnFx(sc, 'wingDust', this.x, this.y - SKILL_BUTTERFLY_CENTER_ABOVE_FEET, { count: 2, spread: 16 });
    }
    this.applyBodyForScale(cfg.scale, cfg.body);
    this.setFlipX(this.facingDir < 0);
    this.setRotation(0);
    // Léger flottement pendant le soin, nul au début et à la fin du geste
    // (raccord sans saut avec la transfo, cf. butterflyTransfoPlacement).
    const kAct = progress(p.inEnd, p.actEnd);
    const hover = p.phase === 'act' ? Math.sin((now - p.inEnd) / 90) * 2.5 * Math.sin(Math.PI * kAct) : 0;
    const W = this.frame.realWidth;
    const H = this.frame.realHeight;
    this.setOrigin(0.5, 0.5 + (SKILL_BUTTERFLY_CENTER_ABOVE_FEET + hover) / (H * this.scaleY));
    const b = cfg.body;
    this.body.setOffset(b.offsetX + (this.displayOriginX - W / 2), b.offsetY + (this.displayOriginY - H));
    this.vineArtAnchored = true;
    return true;
  }

  // Placement d'une image de la transfo papillon (`k` = progression de la
  // phase, `reverse` pour le retour) : { scale, originY, body }, ou null
  // (pixels illisibles : on garde la calibration d'avant). Image i sur n :
  // échelle et centre visible interpolés entre « Agarica » (i = 0 : même
  // hauteur visible que l'idle, même bas visible, aux pieds) et « papillon »
  // (i = n-1 : échelle de l'incantation, centre à
  // SKILL_BUTTERFLY_CENTER_ABOVE_FEET, comme elle). Avant : toute la transfo
  // à une échelle unique, centrée 48 px au-dessus des pieds -- Agarica
  // rapetissait et décollait de 12 px à la 1re image, puis le papillon
  // grossissait d'un coup (×1,46) en passant à l'incantation.
  butterflyTransfoPlacement(k, reverse = false) {
    const sc = this.scene;
    const key = this.butterflyTransfoKey;
    const frames = key && sc.anims.exists(key) ? sc.anims.get(key).frames : null;
    if (!frames || frames.length < 2 || typeof visibleBounds !== 'function') return null;
    const ends = this.butterflyTransfoEnds(frames);
    if (!ends) return null;
    const n = frames.length;
    const i0 = Math.min(n - 1, Math.floor(k * n));
    const i = reverse ? n - 1 - i0 : i0;
    const vb = visibleBounds(sc, frames[i].textureKey);
    if (!vb || vb.empty) return null;
    const t = i / (n - 1);
    const scale = ends.s0 + (ends.s1 - ends.s0) * t;
    const c = ends.c0 + (ends.c1 - ends.c0) * t; // centre visible au-dessus des pieds (px monde)
    const ty = (vb.y0 + vb.y1) / 2;
    return { scale, originY: (ty + c / scale) / vb.frameH, body: transfoBodyConfig(vb.frameW, vb.frameH, scale) };
  }

  // Bornes de l'interpolation (mises en cache) : cf. butterflyTransfoPlacement.
  butterflyTransfoEnds(frames) {
    if (this.butterflyEnds !== undefined) return this.butterflyEnds;
    const sc = this.scene;
    const first = visibleBounds(sc, frames[0].textureKey);
    const idle = sc.textures.exists('agarica-idle-0') ? visibleBounds(sc, 'agarica-idle-0') : null;
    let ends = null;
    // Sans aucun art de papillon (placeholder à l'échelle 1) : calibration
    // d'avant, l'image de transfo n'a pas de papillon peint auquel se raccorder.
    const hasCast = hasManifestArt(sc, 'forme_papillon_extra', 'cast');
    if (first && !first.empty && idle && !idle.empty && (hasCast || this.butterflyArt)) {
      const idleH = (idle.y1 - idle.y0) * HUMAN_SCALE;
      // Idle : origine (0.5, 1), bas du cadre aux pieds.
      const idleCenter = (idle.frameH - (idle.y0 + idle.y1) / 2) * HUMAN_SCALE;
      let castScale = FORMS.butterfly.scale;
      if (hasCast && !this.butterflyArt) {
        castScale = agaricaSheetPoseConfig(sc, 'forme_papillon_extra', 'cast', { method: 'area' }).scale;
      }
      ends = { s0: idleH / (first.y1 - first.y0), c0: idleCenter, s1: castScale, c1: SKILL_BUTTERFLY_CENTER_ABOVE_FEET };
    }
    this.butterflyEnds = ends;
    return ends;
  }

  // Lueur douce derrière Agarica (début de la transfo, fin du retour).
  butterflyPoseGlow() {
    if (typeof juiceBurstImage !== 'function') return;
    const g = BUTTERFLY_POSE_GLOW;
    juiceBurstImage(this.scene, 'glow', this.x, this.y - SKILL_BUTTERFLY_CENTER_ABOVE_FEET, {
      size: g.size, from: 0.5, to: 1.1, ms: g.ms, color: g.color, alpha: g.alpha, depth: this.depth - 1,
    });
  }

  // Change les durées d'une pose EN COURS sans saut : la phase et sa
  // progression (donc l'image affichée) sont gardées, seule la suite est
  // allongée ou raccourcie. Une phase absente (pas d'art de transfo) le
  // reste. Sert à la cinématique du soin de Ghil't (boss_ghilt.js), qui joue
  // la transfo, l'incantation et le retour à leur rythme peint.
  retimeSkillFormPose(now, ms = {}) {
    const p = this.skillFormPose;
    if (!p) return;
    const t = { in: p.inEnd - p.start, act: p.actEnd - p.inEnd, out: p.end - p.actEnd };
    const nt = {
      in: t.in > 0 ? (ms.in ?? t.in) : 0,
      act: ms.act ?? t.act,
      out: t.out > 0 ? (ms.out ?? t.out) : 0,
    };
    const frac = (a, d) => (d > 0 ? Phaser.Math.Clamp((now - a) / d, 0, 1) : 1);
    if (now < p.inEnd) {
      p.start = now - frac(p.start, t.in) * nt.in;
      p.inEnd = p.start + nt.in;
      p.actEnd = p.inEnd + nt.act;
    } else if (now < p.actEnd) {
      p.inEnd = now - frac(p.inEnd, t.act) * nt.act;
      p.start = p.inEnd - nt.in;
      p.actEnd = p.inEnd + nt.act;
    } else {
      p.actEnd = now - frac(p.actEnd, t.out) * nt.out;
      p.inEnd = p.actEnd - nt.act;
      p.start = p.inEnd - nt.in;
    }
    p.end = p.actEnd + nt.out;
    p.releaseAt = p.inEnd + nt.act * ((SKILL_FORM_POSE_MS[p.kind] || {}).releaseAt || 0);
  }

  // Bascule sans art de transformation : gerbe de feuilles (singe) ou de
  // poussière lumineuse (papillon) qui masque le changement de silhouette.
  spawnSkillFormPuff(kind) {
    if (kind === 'papillon') { this.spawnButterflySparkles(14); return; }
    const sc = this.scene;
    const cx = this.x;
    const cy = this.y - 40;
    // Gerbe de feuilles commune du juice (art `fx_feuille`), comme la prise de
    // liane ; repli : les ellipses vertes ci-dessous.
    if (typeof spawnFx === 'function') {
      spawnFx(sc, 'leaves', cx, cy, { count: 8, power: 0.9 });
      return;
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
      const leaf = sc.add.ellipse(cx, cy, 9, 5, i % 2 ? 0x6fbf5a : 0xa8e07a, 0.95)
        .setDepth(this.depth + 1).setRotation(a);
      sc.tweens.add({
        targets: leaf, x: cx + Math.cos(a) * Phaser.Math.Between(20, 36), y: cy + Math.sin(a) * Phaser.Math.Between(18, 34),
        rotation: a + 2, alpha: 0, duration: 300, ease: 'Quad.easeOut', onComplete: () => leaf.destroy(),
      });
    }
  }

  // --- Coups directionnels (cf. SLASH_ARCS) ---------------------------------

  isSlashActive(now) {
    const t = now - this.slashStart;
    return t >= SLASH_WINDUP_MS && t < SLASH_WINDUP_MS + SLASH_ACTIVE_MS;
  }

  // Échelle commune du corps ET de l'arc (art Codex) : feuille `agarica_slash`
  // calibrée sur l'idle (cf. agaricaSheetScale). Aucune frame n'y est debout
  // neutre (fentes, bras levé) : c'est la surface visible qui est alignée --
  // l'ancien calage sur la HAUTEUR de la fente (frame 0, accroupie) agrandissait
  // tout le coup de ~20 % (retour utilisateur : « l'attaque est plus grosse
  // que la taille de base »). L'arc, dessiné à la même échelle que le corps
  // sur la planche, suit le même rapport.
  slashArtScale() {
    if (this.slashScaleCache) return this.slashScaleCache;
    const def = getAssetManifest().agarica_slash || {};
    const scale = agaricaSheetScale(this.scene, 'agarica_slash', 'side', def.scale || 0.34);
    this.slashScaleCache = scale;
    return scale;
  }

  // Facteur appliqué aux positions d'arc (SLASH_ARCS, réglées avec l'art à
  // SLASH_ARCS_ART_SCALE) : l'arc reste collé à la dague quand la pose change
  // d'échelle. 1 sans l'art (croissant dessiné par code).
  slashArcFactor(dir = this.slashDir) {
    return hasManifestArt(this.scene, 'vfx_slash', dir) ? this.slashArtScale() / SLASH_ARCS_ART_SCALE : 1;
  }

  // Échelle des crocs `vfx_croc` : leur largeur visible = SLASH_ARCS.bite.w. À
  // l'échelle du manifeste (0,34), la zone faisait 82 x 80 px, presque celle de la
  // dague alors que la morsure doit rester courte ; ainsi réglés, les crocs
  // enserrent juste le museau.
  biteArtScale() {
    if (this.biteScaleCache) return this.biteScaleCache;
    const b = textureOpaqueBox(this.scene, manifestFrameKey(BITE_VFX_ID, 'bite', BITE_VFX_ACTIVE_FRAMES[0]));
    this.biteScaleCache = b ? SLASH_ARCS.bite.w / (b.x1 - b.x0) : ((getAssetManifest()[BITE_VFX_ID] || {}).scale || 1);
    return this.biteScaleCache;
  }

  // Pixels visibles de l'effet d'un coup (arc `vfx_slash` d'une direction, crocs
  // `vfx_croc` : union des images montrées pendant la phase active), relatifs au
  // CENTRE du sprite, en px affichés, art non retourné. null si l'art manque.
  slashArtBounds(dir) {
    this.slashBoundsCache = this.slashBoundsCache || {};
    if (dir in this.slashBoundsCache) return this.slashBoundsCache[dir];
    const sc = this.scene;
    const bite = dir === 'bite';
    const id = bite ? BITE_VFX_ID : 'vfx_slash';
    let res = null;
    if (hasManifestArt(sc, id, dir)) {
      const scale = bite ? this.biteArtScale() : this.slashArtScale();
      let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
      for (const i of bite ? BITE_VFX_ACTIVE_FRAMES : SLASH_VFX_ACTIVE_FRAMES) {
        const b = textureOpaqueBox(sc, manifestFrameKey(id, dir, i));
        if (!b) continue;
        x0 = Math.min(x0, b.x0 - b.w / 2); x1 = Math.max(x1, b.x1 - b.w / 2);
        y0 = Math.min(y0, b.y0 - b.h / 2); y1 = Math.max(y1, b.y1 - b.h / 2);
      }
      if (x1 > x0) res = { x0: x0 * scale, y0: y0 * scale, x1: x1 * scale, y1: y1 * scale };
    }
    this.slashBoundsCache[dir] = res;
    return res;
  }

  // Rectangle de l'arc du coup en cours (espace monde), à la position
  // actuelle = la zone qui touche (pixels visibles de l'arc s'il y a l'art,
  // sinon le rectangle du croissant dessiné).
  getSlashRect(dir = this.slashDir, facing = this.slashFacing) {
    const a = SLASH_ARCS[dir] || SLASH_ARCS.side;
    const k = this.slashArcFactor(dir);
    const cx = this.x + facing * a.cx * k;
    const cy = this.y + a.cy * k;
    const art = this.slashArtBounds(dir);
    if (art) {
      const x0 = facing > 0 ? art.x0 : -art.x1;
      const x1 = facing > 0 ? art.x1 : -art.x0;
      return new Phaser.Geom.Rectangle(cx + x0, cy + art.y0, x1 - x0, art.y1 - art.y0);
    }
    return new Phaser.Geom.Rectangle(cx - a.w / 2, cy - a.h / 2, a.w, a.h);
  }

  // Pose du corps pendant un coup (forme humaine) : art `agarica_slash` s'il
  // existe (face à DROITE, une frame par SLASH_WINDUP_MS : élan / 2 actives /
  // retour), sinon poses existantes (SLASH_FALLBACK_POSES).
  applySlashPose(now) {
    const sc = this.scene;
    const dir = this.slashDir;
    if (hasManifestArt(sc, 'agarica_slash', dir)) {
      const scale = this.slashArtScale();
      this.slashBodyCfg = this.slashBodyCfg || {};
      let body = this.slashBodyCfg[dir];
      if (!body) {
        const cfg = manifestFormConfig(sc, 'agarica_slash', dir);
        body = transfoBodyConfig(cfg.frameWidth, cfg.frameHeight, scale);
        this.slashBodyCfg[dir] = body;
      }
      const t = now - this.slashStart;
      const frame = Math.min(3, Math.max(0, Math.floor(t / SLASH_WINDUP_MS)));
      const key = manifestFrameKey('agarica_slash', dir, frame);
      this.anims.stop();
      if (sc.textures.exists(key)) this.setTexture(key);
      this.applyBodyForScale(scale, body);
      this.setFlipX(this.slashFacing < 0);
      return;
    }
    const t = now - this.slashStart;
    const phase = t < SLASH_WINDUP_MS ? 0 : t < SLASH_WINDUP_MS + SLASH_ACTIVE_MS ? 1 : 2;
    const pose = SLASH_FALLBACK_POSES[dir][phase];
    const extraKey = pose.extra ? manifestFrameKey('agarica_extra', pose.extra, pose.frame) : null;
    this.anims.stop();
    if (extraKey && sc.textures.exists(extraKey)) {
      const cfg = this.extraPoseConfig(pose.extra);
      this.setTexture(extraKey);
      this.applyBodyForScale(cfg.scale, cfg.body);
      this.setFlipX(AGARICA_EXTRA_FACES_RIGHT ? this.slashFacing < 0 : this.slashFacing > 0);
    } else {
      // Planche d'attaque historique (face à GAUCHE).
      this.setTexture(`agarica-attack-${pose.attack ?? 1}`);
      this.applyBodyForScale(AGARICA_ATTACK_SCALE, AGARICA_ATTACK_BODY);
      this.setFlipX(this.slashFacing > 0);
    }
  }

  // Prépare le sprite de l'effet, arc `vfx_slash` ou crocs `vfx_croc` (sinon :
  // croissant ou mâchoires dessinés par code).
  startSlashVfx() {
    const sc = this.scene;
    const id = this.slashDir === 'bite' ? BITE_VFX_ID : 'vfx_slash';
    if (!hasManifestArt(sc, id, this.slashDir)) return;
    if (!this.slashSprite || !this.slashSprite.active) {
      this.slashSprite = sc.add.sprite(this.x, this.y, manifestFrameKey(id, this.slashDir, 0))
        .setOrigin(0.5, 0.5).setDepth(this.depth + 1).setVisible(false);
    }
  }

  // Arc du coup en cours, redessiné après la synchro physique : affiché
  // pendant les images actives (= zone qui touche), puis bref effacement
  // (SLASH_FADE_MS, ne touche plus). Art : 3 images, les deux premières sur
  // la phase active (SLASH_VFX_ACTIVE_FRAMES), la 3e pendant l'effacement.
  drawSlashArc() {
    const g = this.slashGfx;
    if (!g || !g.active || !this.active) return;
    g.clear();
    const spr = this.slashSprite && this.slashSprite.active ? this.slashSprite : null;
    const now = this.scene.time.now;
    const t = now - this.slashStart;
    const after = t - SLASH_WINDUP_MS - SLASH_ACTIVE_MS;
    // Coup de patte du loup : griffes tracées dès l'élan, de haut en bas,
    // complètes à mi-phase active (zone qui touche = phase active seulement).
    if (this.isAttacking && this.slashDir === 'paw' && after < SLASH_FADE_MS) {
      if (spr) spr.setVisible(false);
      const reach = Phaser.Math.Clamp(t / (SLASH_WINDUP_MS + SLASH_ACTIVE_MS / 2), 0, 1);
      const a = after < 0 ? (t < SLASH_WINDUP_MS ? 0.8 : 1) : 0.7 * (1 - after / SLASH_FADE_MS);
      drawPawClaws(g, this.getSlashRect('paw'), this.slashFacing, 1 - (1 - reach) * (1 - reach), a);
      return;
    }
    // Crocs visibles dès l'élan : c'est le geste de se refermer qui se lit
    // (ils ne touchent qu'aux images actives, cf. isSlashActive).
    const bite = this.slashDir === 'bite';
    if (!this.isAttacking || !this.slashDir || (!bite && t < SLASH_WINDUP_MS) || after >= SLASH_FADE_MS) {
      if (spr) spr.setVisible(false);
      return;
    }
    const alpha = after < 0 ? 1 : 0.6 * (1 - after / SLASH_FADE_MS);
    if (bite) {
      this.drawBiteFx(g, spr, t, after, t < SLASH_WINDUP_MS ? 0.75 : alpha);
      return;
    }
    const dir = this.slashDir;
    if (spr && hasManifestArt(this.scene, 'vfx_slash', dir)) {
      const a = SLASH_ARCS[dir];
      const k = this.slashArcFactor(dir);
      const frame = after >= 0 ? 2 : (t - SLASH_WINDUP_MS < SLASH_ACTIVE_MS / 2 ? 0 : 1);
      const key = manifestFrameKey('vfx_slash', dir, frame);
      if (this.scene.textures.exists(key)) spr.setTexture(key);
      spr.setVisible(true).setScale(this.slashArtScale())
        .setPosition(this.x + this.slashFacing * a.cx * k, this.y + a.cy * k)
        .setFlipX(this.slashFacing < 0).setAlpha(alpha);
      return;
    }
    drawSlashCrescent(g, this.getSlashRect(), dir, this.slashFacing, alpha);
  }

  // Crocs du coup en cours : art `vfx_croc` (image 0 pendant l'élan, 1-2 pendant
  // la phase active, 3-4 pendant l'effacement), sinon mâchoires dessinées, fermées
  // à mi-phase active (`close` en carré : elles se referment d'un coup sec).
  drawBiteFx(g, spr, t, after, alpha) {
    const facing = this.slashFacing;
    if (spr && hasManifestArt(this.scene, BITE_VFX_ID, 'bite')) {
      const a = SLASH_ARCS.bite;
      const frame = after >= 0 ? (after < SLASH_FADE_MS / 2 ? 3 : 4)
        : t < SLASH_WINDUP_MS ? 0 : (t - SLASH_WINDUP_MS < SLASH_ACTIVE_MS / 2 ? 1 : 2);
      const key = manifestFrameKey(BITE_VFX_ID, 'bite', frame);
      if (this.scene.textures.exists(key)) spr.setTexture(key);
      // Alpha 1 : l'apparition et l'effacement sont peints dans les images.
      spr.setVisible(true).setScale(this.biteArtScale())
        .setPosition(this.x + facing * a.cx, this.y + a.cy)
        // L'art a sa charnière à DROITE et s'ouvre vers la gauche : non retourné
        // devant un loup tourné à droite, la gueule lumineuse s'ouvrait vers le
        // loup (retour utilisateur du 2026-11-11 : « pas dans le bon sens »). On
        // le retourne donc quand il regarde à droite : charnière côté loup,
        // crocs ouverts vers la cible.
        .setFlipX(facing > 0).setAlpha(1);
      return;
    }
    if (spr) spr.setVisible(false);
    const close = Phaser.Math.Clamp(t / (SLASH_WINDUP_MS + SLASH_ACTIVE_MS / 2), 0, 1);
    drawBiteJaws(g, this.getSlashRect('bite', facing), facing, close * close, alpha);
  }

  // Quelque chose de frappable sous un coup vers le bas ? (cf. POGO_VELOCITY)
  // Ennemis (dont Ghil't), amas de mousse, Kainati et ses projectiles, et
  // `scene.pogoTargets` : liste libre pour les scripts de zone (objets avec
  // getBounds() et `active`, ou Phaser.Geom.Rectangle).
  pogoTargetHit(rect) {
    const sc = this.scene;
    const hit = (r) => !!r && Phaser.Geom.Intersects.RectangleToRectangle(rect, r);
    if (sc.enemies && sc.enemies.getChildren) {
      for (const e of sc.enemies.getChildren()) {
        if (!e || !e.active || e.defeated || e.healed) continue;
        // Même zone frappable que la mêlée (cf. tryPlayerMeleeHit, LevelKit).
        if (typeof e.getMeleeBounds === 'function' ? hit(e.getMeleeBounds()) : typeof e.getBounds === 'function' && hit(e.getBounds())) return true;
      }
    }
    for (const m of (sc.__story && sc.__story.mossBlocks) || []) {
      if (!m.destroyed && m.body && m.body.active && hit(m.body.getBounds())) return true;
    }
    const k = sc.kainati;
    if (k && k.active && !k.defeated && !k.calm && hit(k.getHitRect())) return true;
    if (k && k.hazards) {
      for (const h of k.hazards.list) {
        if (h.dead || !h.img || !h.img.active || (h.kind !== 'stone' && h.kind !== 'wave')) continue;
        if (hit(h.img.getBounds())) return true;
      }
    }
    for (const o of sc.pogoTargets || []) {
      if (!o || o.active === false) continue;
      if (hit(typeof o.getBounds === 'function' ? o.getBounds() : o)) return true;
    }
    return false;
  }

  // Rectangle de la nuée de papillons (soin) en cours, ou null -- PAS
  // renvoyé par getSkillHitbox() : le papillon ne doit jamais blesser.
  getHealHitbox() {
    return this.papillonSwarm && this.papillonSwarm.active ? this.papillonSwarm.rect : null;
  }

  // Petite portion d'énergie gagnée par coup porté (mêlée ET plume, cf.
  // l'overlap dans LevelKit.js et Feather.js) — façon SOUL de Hollow Knight,
  // seule source de recharge hors feu de camp (cf. refillAtCampfire).
  // Fondu enchaîné (cf. WOLF_LAND_POSE_MS et suivants) : l'image affichée
  // juste avant le changement de pose est recopiée par-dessus Agarica et
  // s'efface en `ms`, en la suivant. Une seule copie (réutilisée).
  poseCrossfade(ms) {
    const sc = this.scene;
    if (!sc || !sc.add || !this.visible || !this.frame || this.alpha < 0.5) return;
    let g = this.poseXfade;
    if (!g || !g.scene) {
      g = sc.add.image(0, 0, this.texture.key, this.frame.name);
      this.poseXfade = g;
      g.lookRole = this.lookRole;
    }
    sc.tweens.killTweensOf(g);
    const dx = 0;
    const dy = 0;
    g.setTexture(this.texture.key, this.frame.name)
      .setOrigin(this.originX, this.originY)
      .setPosition(this.x, this.y)
      .setScale(this.scaleX, this.scaleY)
      .setFlip(this.flipX, this.flipY)
      .setRotation(this.rotation)
      .setDepth(this.depth + 0.001)
      .setAlpha(0.85)
      .setVisible(true);
    if (this.isTinted) g.setTint(this.tintTopLeft); else g.clearTint();
    sc.tweens.add({
      targets: g, alpha: 0, duration: ms, ease: 'Sine.easeOut',
      onUpdate: () => { if (this.active) g.setPosition(this.x + dx, this.y + dy); },
      onComplete: () => g.setVisible(false),
    });
  }

  gainEnergy(amount) {
    this.energy = Phaser.Math.Clamp(this.energy + amount, 0, this.maxEnergy);
    this.scene.registry.set('energy', this.energy);
  }

  // Feu de camp (cf. addCampfire dans LevelKit.js) : restaure vie ET
  // énergie au maximum, sans condition (contrairement aux sanctuaires de
  // capacité, réutilisable à volonté). `this.maxHearts`/`this.maxEnergy`
  // (pas les constantes de base HEART_MAX/ENERGY_MAX) : inclut les bonus
  // de totems équipés, cf. recomputeTotemBonuses.
  refillAtCampfire() {
    this.hearts = this.maxHearts;
    this.energy = this.maxEnergy;
    this.scene.registry.set('hearts', this.hearts);
    this.scene.registry.set('energy', this.energy);
  }

  // --- Assise au feu de camp (2026-11-08, point 3 de la liste) ---------------
  // E près d'un feu (cf. campfireSit, LevelKit) : Agarica s'assoit, tournée
  // vers le feu (art `agarica_repos` : `sit` puis `sit_idle` en boucle ;
  // repli sans art : pose de repos debout). Le monde continue de tourner.
  // Marcher, sauter, frapper ou lancer une compétence la relève (l'action part
  // dans la même image) ; un coup reçu, une cinématique ou une chute aussi.
  // E / Entrée (menu du feu) sont lus par le feu, jamais ici.
  startCampfireRest(fire) {
    const now = this.scene.time.now;
    if (this.vine) this.releaseVine(false, now);
    this.endSkillFormPose(true);
    this.storyStopActions();
    this.storyForceHuman();
    this.setAcceleration(0, 0);
    this.setVelocityX(0);
    if (fire && Number.isFinite(fire.x) && Math.abs(fire.x - this.x) > 4) this.facingDir = fire.x > this.x ? 1 : -1;
    this.campfireRest = { fireId: fire ? fire.id : null, since: now, anim: null };
    // Ni « gros atterrissage » ni éclat de forme en se relevant (cf. updateJuice).
    this.wasOnGround = true;
    this.juicePrevVy = 0;
    this.applyCampfireRestPose('sit');
  }

  applyCampfireRestPose(anim) {
    const rest = this.campfireRest;
    if (!rest) return;
    rest.anim = anim;
    if (hasManifestArt(this.scene, 'agarica_repos', anim)) {
      const cfg = agaricaSheetPoseConfig(this.scene, 'agarica_repos', anim);
      playManifestOn(this, 'agarica_repos', anim);
      this.applyBodyForScale(cfg.scale, cfg.body);
      // Art `agarica_repos` dessiné face à DROITE, comme `agarica_extra`.
      this.setFlipX(AGARICA_EXTRA_FACES_RIGHT ? this.facingDir < 0 : this.facingDir > 0);
    } else {
      if (this.scene.anims.exists(ANIM_IDLE_KEY)) this.anims.play(ANIM_IDLE_KEY, true);
      this.applyBodyForScale(FORMS.agarica.scale, FORMS.agarica.body);
      this.setFlipX(this.facingDir > 0);
    }
  }

  // Vrai tant qu'elle reste assise (update() s'arrête là pour cette image).
  // Touches lues SANS les consommer (isDown) : celle qui la relève agit aussitôt
  // dans la suite d'update() (premier pas, saut, coup).
  updateCampfireRest() {
    const rest = this.campfireRest;
    const k = this.keys;
    const sk = this.skillKeys;
    const wantsToAct = this.cursors.left.isDown || k.left.isDown || this.cursors.right.isDown || k.right.isDown
      || k.jump.isDown || this.attackKey.isDown || this.attackPointerJustDown
      || sk.slot1.isDown || sk.slot2.isDown || sk.slot3.isDown;
    if (wantsToAct) {
      this.endCampfireRest();
      return false;
    }
    this.setAccelerationX(0);
    this.setVelocityX(0);
    this.onGround = (this.body.blocked.down || this.body.touching.down) && this.body.velocity.y >= 0;
    this.wasOnGround = this.onGround;
    // `sit` (non bouclée) finie : `sit_idle` en boucle.
    if (rest.anim === 'sit') {
      const cur = this.anims.currentAnim;
      if (!this.anims.isPlaying || !cur || cur.key !== 'agarica_repos-sit') this.applyCampfireRestPose('sit_idle');
    }
    this.inWeb = false;
    this.inWater = false;
    return true;
  }

  // Se relever : pose de repos humaine ; update() reprend la main normalement.
  endCampfireRest() {
    if (!this.campfireRest) return;
    this.campfireRest = null;
    if (this.form === 'agarica' && this.scene && this.scene.anims.exists(ANIM_IDLE_KEY)) this.anims.play(ANIM_IDLE_KEY, true);
    if (this.body) this.applyBodyForScale(FORMS.agarica.scale, FORMS.agarica.body);
    this.wasOnGround = true;
    this.juicePrevVy = 0;
  }

  // --- Chute dans le vide (retour utilisateur : « quand on tombe dans le
  // vide on doit passer dans le sol pour mourir, pas s'allonger en bas de
  // l'écran ») ------------------------------------------------------------
  // Appelée par updateStoryFall (StoryKit) dès que la ligne de chute de la
  // zone est franchie : Agarica continue de tomber et sort par le bas de
  // l'écran. Plus de liane ni de plané ; collisions coupées (sol,
  // ennemis) pour qu'aucun rebord sous la ligne de chute ne la rattrape ; le
  // monde est gelé par StoryKit (ni touche ni ennemi), la physique continue.
  startFallOut() {
    if (this.fallingOut) return;
    const now = this.scene.time.now;
    this.endCampfireRest();
    if (this.vine) this.releaseVine(false, now);
    this.endSkillFormPose(true);
    this.fallingOut = true;
    this.isAttacking = false;
    this.slashDir = null;
    this.eagleDiving = false;
    this.formTransitionActive = false;
    this.vineFlight = false;
    this.wolfSprintActive = false;
    this.resetVineArtAnchor();
    this.setRotation(0);
    const b = this.body;
    b.checkCollision.none = true;
    b.setAllowGravity(true);
    this.setAcceleration(0, 0);
    b.maxVelocity.y = PLAYER_MAX_FALL_SPEED;
    b.gravity.y = this.fallGravityBonus;
    this.setVelocity(b.velocity.x * 0.6, Math.max(b.velocity.y, FALL_OUT_MIN_VY));
    this.applyFallOutPose();
  }

  // Pose de chute de la forme en cours, posée une fois (update() ne tourne
  // plus pendant la chute) ; jamais la pose `death` couchée.
  applyFallOutPose() {
    const facingRight = this.facingDir >= 0;
    if (this.form === 'agarica') {
      if (hasManifestArt(this.scene, 'agarica_extra', 'jump_fall')) {
        this.applyAgaricaExtraPose('jump_fall');
      } else {
        this.anims.stop();
        this.setTexture(JUMP_FALL_TEXTURE);
        this.applyBodyForScale(JUMP_SCALE, FORMS.agarica.body);
        this.setFlipX(facingRight);
      }
    } else if (this.form === 'wolf') {
      this.anims.stop();
      this.setTexture(WOLF_JUMP_FALL_TEXTURE);
      this.applyBodyForScale(WOLF_JUMP_SCALE, FORMS.wolf.body);
      this.setFlipX(!facingRight);
    } else if (this.form === 'eagle') {
      if (this.scene.anims.exists(ANIM_PIAF_DIVE_KEY)) this.anims.play(ANIM_PIAF_DIVE_KEY, true);
      this.setFlipX(!facingRight);
    } else if (this.form === 'monkey') {
      // Relancée : playManifestOn garde la texture en place si 'singe-jump'
      // a déjà fini (pose de liane restée affichée après un lâcher).
      if (this.scene.anims.exists('singe-jump')) this.anims.play('singe-jump');
      else playManifestOn(this, 'singe', 'jump');
      const mc = agaricaSheetPoseConfig(this.scene, 'singe', 'jump', { method: 'area' });
      this.applyBodyForScale(mc.scale, mc.body);
      this.setFlipX(MONKEY_FACES_RIGHT ? !facingRight : facingRight);
    }
  }

  // Reprise après la chute (StoryKit, sous le fondu au noir, AVANT de
  // replacer Agarica) : debout, en forme humaine, collisions rétablies.
  // Forme humaine imposée : sans ça, une chute en aigle, singe ou loup
  // rejouait la transformation de sortie au point de reprise.
  endFallOut() {
    if (!this.fallingOut) return;
    this.fallingOut = false;
    const b = this.body;
    b.checkCollision.none = false;
    b.setAllowGravity(true);
    b.gravity.y = 0;
    b.maxVelocity.y = PLAYER_MAX_FALL_SPEED;
    this.setAcceleration(0, 0);
    this.setVelocity(0, 0);
    this.setRotation(0);
    this.jumpsUsed = 0;
    this.airJumpForm = null;
    this.wolfJumpCarry = false;
    this.vineMomentumSpeed = 0;
    this.monkeyReleasePoseUntil = 0;
    this.jumpBufferedAt = -Infinity;
    this.setForm('agarica');
    this.anims.play(ANIM_IDLE_KEY, true);
    this.applyBodyForScale(FORMS.agarica.scale, FORMS.agarica.body);
    // Ni éclat de transformation ni « gros atterrissage » (vitesse d'avant
    // la chute) en se reposant au point de reprise (cf. updateJuice).
    this.juicePrevForm = this.form;
    this.juicePrevVy = 0;
    this.wasOnGround = true;
  }

  // --- Dialogue / cinématique : pose stable (2026-11-08, retour utilisateur :
  // « quand un dialogue se lance, le personnage continue son animation
  // actuelle, et parfois au milieu du vide ») --------------------------------
  // Le monde est gelé (update() ne tourne plus) : l'image de course, de marche
  // ou d'attaque restait affichée, une transformation (loup, aigle, singe)
  // aussi, et un déclencheur franchi en plein saut ouvrait la boîte avec
  // Agarica en l'air. StoryKit (storyBeginSettle / storySettleStep) appelle :
  //   storyStopActions() une fois, au début du gel ;
  //   storyAirPose()     à chaque image tant qu'elle tombe (la physique tourne) ;
  //   storyRestPose()    une fois posée.
  // Une pose narrative (`storyPose`, posée par la cinématique) et la liane
  // gardent toujours la main.
  storyStopActions() {
    // Une cinématique relève Agarica assise au feu (sa pose narrative prime).
    this.endCampfireRest();
    this.isAttacking = false;
    this.slashDir = null;
    this.biteAnimPending = false;
    this.eagleDiving = false;
    this.wolfSprintActive = false;
    this.tapSprintDirection = null;
    this.wolfJumpCarry = false;
    this.grizzlyCharging = false;
    this.grizzlyRamp = 0;
    this.pandaHealAt = 0;
    this.iceCastAt = 0;
    this.formTransitionActive = false;
    this.jumpBufferedAt = -Infinity;
    this.monkeyReleasePoseUntil = 0;
    this.featherFlapEndTime = 0;
    this.throwPoseUntil = 0;
    this.vineFlight = false;
    this.vineMomentumSpeed = 0;
    if (this.body) this.setAccelerationX(0);
    // Ours (art dédié) en pleine transformation : coupé net, comme à sa fin
    // normale dans update() (origine, teinte du repli sans art). Sa zone de
    // dégâts n'agit de toute façon pas pendant le gel.
    if (this.skillTransformActive) {
      const def = skillDefOf(this.activeSkillId);
      this.skillTransformActive = false;
      this.activeSkillId = null;
      this.skillHitboxRect = null;
      this.skillHitboxPendingRect = null;
      this.skillHitboxId = null;
      if (def && def.originX !== undefined) this.setOrigin(0.5, 1);
      if (!def || !def.animKey) this.clearTint();
    }
  }

  // Retour à la forme humaine sans anim de transfo (le monde est gelé, elle
  // ne se jouerait pas) : petit éclat de la forme quittée à la place.
  storyForceHuman() {
    const from = this.form;
    if (from === 'agarica') return;
    this.resetVineArtAnchor();
    this.setForm('agarica');
    this.airJumpForm = null;
    this.juiceFormChange(from, 'agarica', this.scene.time.now);
    this.juicePrevForm = 'agarica';
  }

  // En l'air pendant le gel : forme humaine, pose de saut (montée / chute),
  // gravité d'une chute normale (sans plané). La vitesse horizontale est
  // gardée (fin de l'arc, freinée par l'air), cf. freezeWorldBodies.
  storyAirPose() {
    const b = this.body;
    if (!b) return;
    this.storyForceHuman();
    const rising = b.velocity.y < 0;
    b.setAllowGravity(true);
    b.gravity.y = rising ? 0 : this.fallGravityBonus;
    b.maxVelocity.y = PLAYER_MAX_FALL_SPEED;
    if (this.storyPose) return;
    const anim = rising ? 'jump_rise' : 'jump_fall';
    if (hasManifestArt(this.scene, 'agarica_extra', anim)) {
      this.applyAgaricaExtraPose(anim);
    } else {
      this.anims.stop();
      this.setTexture(rising ? JUMP_RISE_TEXTURE : JUMP_FALL_TEXTURE);
      this.applyBodyForScale(JUMP_SCALE, FORMS.agarica.body);
      this.setFlipX(this.facingDir > 0);
    }
    // Même corps qu'un saut normal (décalé vers l'avant, cf. fin d'update) :
    // elle se pose là où le saut l'aurait posée.
    b.setOffset(b.offset.x + this.facingDir * AGARICA_BODY_FORWARD_SHIFT, b.offset.y);
  }

  // Posée (ou dans l'eau) : immobile, pose de repos de la forme humaine (la
  // pieuvre garde sa pose de nage figée). Même rendu que la branche « forme
  // humaine au sol » d'update(), décalage avant du corps compris.
  storyRestPose() {
    const b = this.body;
    if (!b || this.vine || this.fallingOut) return;
    this.setAccelerationX(0);
    this.setVelocityX(0);
    if (this.form === 'octopus') {
      this.setVelocity(0, 0);
      this.anims.stop();
      this.setTexture('pieuvre-walk-0');
      return;
    }
    this.storyForceHuman();
    b.gravity.y = 0;
    // Pas de « gros atterrissage » ni d'éclat de forme à la reprise.
    this.wasOnGround = true;
    this.juicePrevVy = 0;
    if (this.storyPose) return;
    this.resetVineArtAnchor();
    if (this.scene.anims.exists(ANIM_IDLE_KEY)) this.anims.play(ANIM_IDLE_KEY, true);
    this.applyBodyForScale(FORMS.agarica.scale, FORMS.agarica.body);
    this.setFlipX(this.facingDir > 0);
    b.setOffset(b.offset.x + this.facingDir * AGARICA_BODY_FORWARD_SHIFT, b.offset.y);
  }

  // --- Invulnérabilité ---------------------------------------------------------
  // Deux sources, un seul test (`isInvulnerable`, lu par LevelKit, les boss,
  // le duel...) : le coup reçu (`hitInvulnerable`, l'ancien booléen, posé et
  // levé par hitByEnemy/finishHit -- l'écriture de `isInvulnerable` garde ce
  // sens) et la sortie d'un dialogue ou d'une cinématique (ci-dessous).
  // Assise au feu de camp (décision de l'utilisateur, vague 3) : rien ne la
  // touche tant qu'elle reste assise -- un ennemi qui passe ne la relève plus.
  // Une chute dans le vide (`hitByEnemy({ fall })`) ne lit que `hitInvulnerable`.
  get isInvulnerable() {
    return !!this.hitInvulnerable || this.storyInvulnerable() || !!this.campfireRest;
  }

  set isInvulnerable(v) {
    this.hitInvulnerable = !!v;
  }

  storyInvulnerable() {
    if (this.storyInvulnPending) return true;
    const sc = this.scene;
    return !!(sc && sc.time && sc.time.now < (this.storyInvulnUntil || 0));
  }

  // Sortie d'un dialogue ou d'une cinématique (StoryKit) : `storyInvulnPending`
  // protège dès la fermeture (même image : un ennemi au contact ne frappe pas
  // avant le dégel), puis cette méthode, au premier dégel, minute `ms`. Même
  // signal que l'invulnérabilité d'un coup (clignotement HIT_BLINK_*), qui
  // garde la main si elle tourne déjà.
  // `blink: false` (vague 3, décision de l'utilisateur) : protégée sans
  // clignoter -- StoryKit ne fait clignoter que si un ennemi est proche
  // (STORY_EXIT_BLINK_RANGE) : loin de tout danger, le signal n'apprend rien.
  grantStoryInvulnerability(ms, opts = {}) {
    const sc = this.scene;
    this.storyInvulnPending = false;
    if (!sc || !this.active || !(ms > 0)) return;
    this.storyInvulnUntil = Math.max(this.storyInvulnUntil || 0, sc.time.now + ms);
    if (this.storyInvulnBlink || opts.blink === false) return;
    const blink = sc.time.addEvent({
      delay: HIT_BLINK_MS,
      loop: true,
      callback: () => {
        if (!this.active || sc.time.now >= this.storyInvulnUntil) {
          blink.remove(false);
          this.storyInvulnBlink = null;
          if (this.active && !this.hitInvulnerable) this.setAlpha(1);
          return;
        }
        if (this.hitInvulnerable) return;
        this.setAlpha(this.alpha < 1 ? 1 : HIT_BLINK_ALPHA);
      },
    });
    this.storyInvulnBlink = blink;
    if (!this.hitInvulnerable) this.setAlpha(HIT_BLINK_ALPHA);
  }

  // Appelé par la scène quand un ennemi touche Agarica hors fenêtre
  // d'attaque : perd 1 cœur avec un court flash d'invulnérabilité ; seul
  // un cœur tombé à 0 renvoie au point de départ de la zone (et restaure
  // les cœurs au passage) — perdre un cœur qui n'est pas le dernier ne
  // bouge plus Agarica de place, contrairement à l'ancien comportement
  // (retour systématique, avant l'introduction d'une vraie vie à
  // plusieurs points).
  // `opts.fall` : perte de cœur due à une chute dans le vide (cf.
  // updateStoryFall), appelée au point de reprise, sous le fondu.
  hitByEnemy(opts = {}) {
    // Chute dans le vide : seule l'invulnérabilité d'un coup récent l'épargne
    // (règle d'avant) ; celle de la sortie d'un dialogue ne protège que des
    // ennemis -- une chute juste après un dialogue coûte toujours son cœur.
    if ((opts.fall ? this.hitInvulnerable : this.isInvulnerable) || this.fallingOut) return;
    // Touchée assise au feu : elle se relève sous le coup.
    this.endCampfireRest();
    this.isInvulnerable = true;
    if (this.vine) this.releaseVine(false, this.scene.time.now);
    // Palier 4 des ursidés (« Robustesse », cf. Familles.js) : elle encaisse
    // sans reculer -- ni arrêt net, ni bascule en arrière, ni pose de douleur ;
    // elle garde son élan. Le cœur perdu, le flash et l'invulnérabilité restent.
    const steady = !!this.knockbackImmune;
    if (!steady) this.hurtPoseUntil = this.scene.time.now + HURT_POSE_MS;
    // Panda dérangé pendant son repas : pas de cœur rendu, la compétence s'arrête.
    if (this.pandaHealAt) {
      this.pandaHealAt = 0;
      if (this.activeSkillId === 'panda') this.skillTransformEndTime = this.scene.time.now;
    }
    this.hearts -= 1;
    this.scene.registry.set('hearts', this.hearts);
    // Juice (visuel seul, la vitesse reste remise à 0 comme avant) : flash
    // blanc puis rouge, recul du corps au dessin, micro-pause, secousse,
    // voile rouge sur les bords de l'écran, étincelles roses.
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (!this.active || !this.isInvulnerable || !this.tintFill) return;
      this.tintFill = false;
      this.setTint(0xff4d6d);
    });
    if (!steady) juiceTilt(this, -(this.facingDir >= 0 ? 1 : -1) * 0.2, 280);
    juiceSquash(this, 0.92, 1.06, 220);
    juiceHitStop(this.scene, 60);
    juiceShake(this.scene, 'medium');
    juiceHurtVignette(this.scene);
    spawnFx(this.scene, 'spark', this.x, this.y - 40, { count: 9, tint: [0xff4d6d, 0xff9fc9, 0xffffff], power: 0.8 });
    playSfx('player_hurt');
    const depleted = this.hearts <= 0;
    if (!steady || depleted || opts.fall) this.setVelocity(0, 0);
    // Dernier cœur perdu : signalé aux scripts de zone (boss : remise à zéro
    // du combat). Le registre seul ne suffit pas : son 1er `set('hearts')`
    // émet 'setdata' et non 'changedata-hearts'.
    if (depleted) this.scene.events.emit('player-depleted', this);
    // Chute fatale : réapparition tout de suite (sous le fondu de la chute),
    // pas 300 ms plus tard -- elle aurait sinon été vue au point de reprise
    // puis ramenée en arrière alors qu'elle a déjà repris la main.
    if (depleted && opts.fall) this.reviveAtSpawn();
    // Dernier cœur perdu EN L'AIR dans une zone à vide (règle `fall`) : la
    // pose couchée est réservée aux morts au sol -- en l'air au-dessus du
    // trou, elle traversait le bas de l'écran couchée puis réapparaissait
    // d'un coup, sans fondu. StoryKit (storyWatchAirDeath) prend la suite,
    // monde gelé : posée → fin du coup ci-dessous (pose couchée au sol) ;
    // ligne de chute franchie → chute dans le vide (sortie par le bas de
    // l'écran, fondu, réapparition au point de reprise, sans 2e cœur perdu).
    // (Pas dans l'eau : la Pieuvre nage sans gravité, mort sur place comme avant.)
    const swimming = this.hasOctopusForm && this.formEquipped('octopus')
      && (this.scene.time.now - this.lastInWaterTime < this.waterGraceMs);
    if (depleted && !opts.fall && !this.body.blocked.down && !swimming
      && typeof storyWatchAirDeath === 'function' && storyWatchAirDeath(this.scene)) {
      // update() ne tourne plus (monde gelé) : gravité rendue ici (la liane
      // la coupe, update() la rétablissait), plus de plané,
      // et pose de coup tenue pendant la chute.
      this.body.setAllowGravity(true);
      this.body.gravity.y = this.fallGravityBonus;
      this.body.maxVelocity.y = PLAYER_MAX_FALL_SPEED;
      this.setAcceleration(0, 0);
      this.eagleDiving = false;
      this.endSkillFormPose(true);
      if (this.form === 'agarica' && hasManifestArt(this.scene, 'agarica_extra', 'hurt')) this.applyAgaricaExtraPose('hurt');
      return;
    }
    this.finishHit(depleted, opts);
  }

  // Fin d'un coup reçu (cf. hitByEnemy) : flash, invulnérabilité et, cœurs à
  // 0, pose `death` puis réapparition. Appelée aussi par StoryKit
  // (storyWatchAirDeath) quand Agarica, touchée à mort en l'air, retombe au sol.
  finishHit(depleted, opts = {}) {
    // Dernier cœur perdu : pose `death` (art Codex agarica_extra) tenue un
    // instant avant la réapparition, monde gelé via __cutsceneLock pour que
    // ni les ennemis ni les touches n'interfèrent. Sans art : comme avant.
    // Pose couchée réservée aux morts par dégâts : une chute fatale ne
    // l'affiche jamais (elle est déjà sortie par le bas de l'écran).
    const deathPose = depleted && !opts.fall && this.form === 'agarica' && hasManifestArt(this.scene, 'agarica_extra', 'death');
    if (deathPose) {
      this.storyPose = 'death';
      this.applyAgaricaExtraPose('death');
      this.scene.__cutsceneLock = (this.scene.__cutsceneLock || 0) + 1;
    }
    const respawnLater = depleted && !opts.fall;
    const flashMs = deathPose ? 1100 : 300;
    this.scene.time.delayedCall(flashMs, () => {
      if (deathPose) {
        this.storyPose = null;
        this.scene.__cutsceneLock = Math.max(0, (this.scene.__cutsceneLock || 0) - 1);
      }
      if (respawnLater) this.reviveAtSpawn();
      // Pas après une chute (elle a déjà repris la main au point de reprise)
      // ni en pleine chute dans le vide (elle doit sortir de l'écran).
      if (!opts.fall && !this.fallingOut && (depleted || !this.knockbackImmune)) this.setVelocity(0, 0);
      this.clearTint();
      // Correctif : 300 ms d'invulnérabilité laissaient une salve (pierres de
      // Kainati) enlever 3 cœurs d'affilée. Elle dure maintenant
      // HIT_INVULN_MS au total, signalée par un clignotement (alpha). Après
      // une réapparition (cœurs rechargés), pas de rallonge : comme avant.
      const rest = depleted ? 0 : HIT_INVULN_MS - flashMs;
      if (rest <= 0) { this.isInvulnerable = false; return; }
      const blink = this.scene.time.addEvent({
        delay: HIT_BLINK_MS, loop: true,
        callback: () => { if (this.active) this.setAlpha(this.alpha < 1 ? 1 : HIT_BLINK_ALPHA); },
      });
      this.scene.time.delayedCall(rest, () => {
        blink.remove(false);
        if (this.active) this.setAlpha(1);
        this.isInvulnerable = false;
      });
    });
  }

  // Réapparition après le dernier cœur : cœurs rechargés au point de reprise
  // (départ de zone, ou dernière lanterne allumée, cf. updateStoryCheckpoints).
  reviveAtSpawn() {
    this.hearts = this.maxHearts;
    this.scene.registry.set('hearts', this.hearts);
    this.setPosition(this.spawnX, this.spawnY);
  }

  // Mort en l'air finie dans le vide (StoryKit, sous le fondu, après
  // endFallOut) : même réapparition que la mort au sol (finishHit), sans
  // pose couchée ni 2e cœur perdu ; fin de l'invulnérabilité du coup.
  reviveAfterAirDeath() {
    this.reviveAtSpawn();
    this.storyPose = null;
    this.clearTint();
    this.setAlpha(1);
    this.isInvulnerable = false;
  }
}
