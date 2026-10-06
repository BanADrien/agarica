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
  // durée-en-secondes).
  scene.anims.create({
    key: ANIM_TRANSFO_RISE_KEY,
    frames: [
      { key: TRANSFO_RISE_START_KEY },
      { key: TRANSFO_STEP2_KEY },
    ],
    frameRate: EAGLE_TRANSFO_FRAME_RATE,
    repeat: 0,
  });
  scene.anims.create({
    key: ANIM_TRANSFO_FALL_KEY,
    frames: [
      { key: TRANSFO_FALL_START_KEY },
      { key: TRANSFO_STEP2_KEY },
    ],
    frameRate: EAGLE_TRANSFO_FRAME_RATE,
    repeat: 0,
  });
  scene.anims.create({
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
  scene.anims.create({
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
const LOUP_ATTACK_FRAME_COUNT = 8;
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
// Durée propre à l'attaque humaine, DÉCOUPLÉE de `this.attackDuration`
// (constructeur) : ce dernier reste calé sur les 8 frames à 20fps de la
// morsure du Loup (400ms, cf. ANIM_WOLF_ATTACK_KEY) -- le réduire aussi
// pour accélérer l'anim humaine aurait raccourci la fenêtre d'attaque du
// Loup au point de couper sa propre anim avant la fin (et raccourci sa
// ruée, cf. attackDashActive). 4 frames à 14fps, cf. ensurePlayerAnimations.
const AGARICA_ATTACK_DURATION = Math.round((AGARICA_ATTACK_FRAME_COUNT / 14) * 1000);
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
// Portée de la hitbox de DÉGÂTS (cf. getAttackHitbox plus bas), pas la
// hitbox de collision passive ci-dessous -- retour utilisateur : "la hitbox
// de l'attaque d'agarica devrait être beaucoup plus longue devant". Mesurée
// directement sur agarica_attack_2.png (le contenu -- lame d'énergie
// comprise -- déborde jusqu'à x=8 côté gauche du canvas, alors que le
// personnage lui-même reste centré sur x=712, cf. AGARICA_ATTACK_BODY) :
// 712-8=704px BRUTS de portée réelle depuis le centre du corps dans le sens
// où elle attaque nativement, bien au-delà de sa propre largeur de
// silhouette (utilisée avant ce changement, beaucoup trop courte pour une
// lame qui déborde largement du corps).
const AGARICA_ATTACK_REACH_RAW = 704;
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
  // 4 frames à 14fps = ~286ms, calé pile sur attackDuration (cf.
  // constructeur) — jouée une seule fois sur la fenêtre d'attaque. Accélérée
  // depuis 10fps/400ms (retour utilisateur : "l'animation d'attaque
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
  // Jouée une seule fois sur la fenêtre d'attaque : cf. attackDuration.
  scene.anims.create({
    key: ANIM_WOLF_ATTACK_KEY,
    frames: Array.from({ length: LOUP_ATTACK_FRAME_COUNT }, (_, i) => ({ key: `loup-attack-${i}` })),
    frameRate: 20,
    repeat: 0,
  });

  // Transformation Loup, aller et retour (mêmes 4 frames, ordre inversé) —
  // jouées une fois à l'entrée/sortie du sprint (cf. WOLF_TRANSFORM_DURATION).
  scene.anims.create({
    key: ANIM_TRANSFO_TO_WOLF_KEY,
    frames: transfoWolfFrames([0, 1, 2, 3]),
    frameRate: 15,
    repeat: 0,
  });
  scene.anims.create({
    key: ANIM_TRANSFO_TO_HUMAN_FROM_WOLF_KEY,
    frames: transfoWolfFrames([3, 2, 1, 0]),
    frameRate: 15,
    repeat: 0,
  });

  // Transformation Pieuvre, aller et retour (mêmes 4 frames, ordre inversé)
  // — jouée à l'entrée/sortie de l'eau (cf. octopusTransformDuration).
  scene.anims.create({
    key: ANIM_TRANSFO_TO_OCTOPUS_KEY,
    frames: transfoPieuvreFrames([0, 1, 2, 3]),
    frameRate: 15,
    repeat: 0,
  });
  scene.anims.create({
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
// Cf. getAttackHitbox() plus bas : fraction de la silhouette PLEINE (pas
// PLAYER_BODY_FRACTION) gardée en hauteur pour la zone de dégâts de la
// dague/morsure -- "réduite en hauteur" (retour utilisateur), une bande
// centrée sur le torse plutôt que la pleine hauteur de la silhouette.
const ATTACK_HITBOX_HEIGHT_FRACTION = 0.6;
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
// N'affecte PAS getAttackHitbox() (cf. playerFullDisplaySize plus bas,
// recalculée directement depuis la bbox brute plutôt qu'en redivisant
// `body.width` -- sans ça la zone de dégâts de l'attaque aurait rétréci
// avec, jamais demandé).
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

// Taille affichée de la silhouette RÉELLE (pas réduite par
// PLAYER_BODY_FRACTION, contrairement à FORMS[form].body ci-dessus) pour la
// forme donnée -- cf. getAttackHitbox(), qui a besoin de la pleine largeur
// ("toute l'image"), la hitbox de collision passive ayant elle besoin de la
// version réduite. Recalculée directement depuis la bbox brute (PAS en
// redivisant `cfg.body.width` par PLAYER_BODY_FRACTION comme avant) :
// AGARICA_BODY_WIDTH_FRACTION (cf. plus haut) réduit maintenant la largeur
// du corps de collision d'Agarica d'un cran de PLUS que les 3 autres
// formes -- rediviser seulement par PLAYER_BODY_FRACTION aurait alors
// aussi rétréci la zone de dégâts de son attaque, jamais demandé.
const FORM_BODY_BBOX = {
  agarica: AGARICA_BODY_BBOX, eagle: EAGLE_BODY_BBOX, wolf: WOLF_BODY_BBOX, octopus: OCTOPUS_BODY_BBOX,
};
function playerFullDisplaySize(form) {
  // Singe : pas de bbox mesurée (art Codex pas encore là) -- même gabarit
  // de frappe que l'humaine plutôt qu'une bbox humaine à l'échelle du singe.
  if (form === 'monkey') form = 'agarica';
  const cfg = FORMS[form] || FORMS.agarica;
  const bbox = FORM_BODY_BBOX[form] || FORM_BODY_BBOX.agarica;
  return {
    width: (bbox.x1 - bbox.x0) * cfg.scale,
    height: (bbox.y1 - bbox.y0) * cfg.scale,
  };
}

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
const AIR_FORM_IDS = ['eagle', 'monkey'];
const FORM_FLAG_BY_ID = {
  wolf: 'hasWolfForm', eagle: 'hasEagleForm', monkey: 'hasMonkeyForm', octopus: 'hasOctopusForm',
};
// Double saut SANS forme aérienne : simple, un peu moins haut, aucune
// transformation. Singe : plus court que l'Aigle (eagleJumpVelocity = -550,
// inchangé : les anciennes zones sont calibrées dessus).
const BASE_DOUBLE_JUMP_VELOCITY = -450;
const MONKEY_JUMP_VELOCITY = -500;
// Art Codex (manifest `singe`, `agarica_extra`) dessiné face à DROITE,
// contrairement à la feuille humaine historique (face à gauche).
const MONKEY_FACES_RIGHT = true;
const AGARICA_EXTRA_FACES_RIGHT = true;
const MONKEY_TRANSFO_MS = 200;
const MONKEY_RELEASE_POSE_MS = 250;
const HURT_POSE_MS = 300;
// Invulnérabilité après un coup (cf. hitByEnemy) : durée totale, et
// clignotement pendant la partie qui suit le flash rouge.
const HIT_INVULN_MS = 950;
const HIT_BLINK_MS = 90;
const HIT_BLINK_ALPHA = 0.35;
const THROW_POSE_MS = 220;

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

// Analyse alpha d'une texture (une fois par clé, mise en cache) : boîte
// opaque et « poing » (point le plus haut de la silhouette : la main levée
// des poses suspendues). Sert à caler l'art Codex, dont le cadrage varie
// d'une planche à l'autre, sur la taille et la prise d'Agarica.
const TEXTURE_ALPHA_CACHE = new Map();
function textureAlphaInfo(scene, key) {
  if (TEXTURE_ALPHA_CACHE.has(key)) return TEXTURE_ALPHA_CACHE.get(key);
  let info = null;
  try {
    if (scene.textures.exists(key)) {
      const img = scene.textures.get(key).getSourceImage();
      const w = img.width;
      const h = img.height;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, w, h).data;
      let top = -1;
      let bottom = -1;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (d[(y * w + x) * 4 + 3] > 128) {
            if (top < 0) top = y;
            bottom = y;
            break;
          }
        }
      }
      if (top >= 0) {
        let sx = 0;
        let n = 0;
        for (let y = top; y < Math.min(h, top + 20); y++) {
          for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128) { sx += x; n++; }
        }
        info = { w, h, top, bottom, fistX: sx / n, fistY: top + 10 };
      }
    }
  } catch (e) {
    info = null;
  }
  TEXTURE_ALPHA_CACHE.set(key, info);
  return info;
}

// Échelle à laquelle la silhouette de la texture `key` a la même hauteur
// opaque que l'idle humaine historique (~85 px) -- jamais plus grande que
// `maxScale` (l'échelle du manifest) : on ne fait que réduire l'art trop
// grand (pose `talk`, `receive_item`, 1re frame de la transfo singe), pour
// qu'Agarica ne grandisse pas d'un coup en changeant de pose.
function scaleMatchingHumanHeight(scene, key, maxScale) {
  const ref = textureAlphaInfo(scene, 'agarica-idle-0');
  const t = textureAlphaInfo(scene, key);
  if (!ref || !t) return maxScale;
  const target = (ref.bottom - ref.top) * HUMAN_SCALE;
  return Math.min(maxScale, target / Math.max(1, t.bottom - t.top));
}

// Poses `agarica_extra` où Agarica est DEBOUT (silhouette comparable à
// l'idle) : leur art est dessiné plus grand que les autres rangées
// (mesuré : talk ~99 px, receive_item ~112 px contre ~85 px à l'idle).
const AGARICA_EXTRA_STANDING_ANIMS = ['talk', 'receive_item', 'cast'];

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

function ensureOursAnimations(scene) {
  if (scene.anims.exists(ANIM_OURS_SLAM_KEY)) return;
  // 6 frames, calé pile sur SKILL_DEFS.ours.attackDurationMs -- jouée une
  // seule fois (repeat 0), tient sur la dernière frame (pose de retombée)
  // le temps que le reste de la fenêtre de transfo s'écoule.
  scene.anims.create({
    key: ANIM_OURS_SLAM_KEY,
    frames: oursAnimFrames(),
    frameRate: OURS_ATTACK_FRAME_RATE,
    repeat: 0,
  });
  scene.anims.create({
    key: ANIM_TRANSFO_TO_OURS_KEY,
    frames: transfoOursFrames([0, 1, 2]),
    frameRate: TRANSFO_OURS_FRAME_RATE,
    repeat: 0,
  });
  scene.anims.create({
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

    this.setCollideWorldBounds(true);
    this.setMaxVelocity(400, 900);
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
    // Formes aériennes déjà connues à la création : seule une forme débloquée
    // EN COURS de jeu (totem, cinématique, triche) devient automatiquement
    // la forme aérienne active, cf. syncFormSlots().
    this.airFormsSeen = { eagle: this.hasEagleForm, monkey: this.hasMonkeyForm };
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
    // 400ms : laisse le temps aux 8 frames de la séquence de morsure du Loup
    // de s'afficher lisiblement (cf. ANIM_WOLF_ATTACK_KEY) — profite aussi à
    // la ruée (attackDashActive dure toute la fenêtre), qui va d'autant plus loin.
    this.attackDuration = 400;
    this.attackCooldown = 300;
    this.isAttacking = false;
    this.attackEndTime = 0;
    this.attackCooldownEndTime = 0;
    // Tir de plume (forme Aigle, cf. plus bas) : force la pose de battement
    // d'ailes (ANIM_PIAF_FLY_KEY) pendant cette fenêtre, même en plein
    // plané (vitesse verticale positive, qui montrerait sinon la pose de
    // glisse figée) — pour bien vendre "elle bat des ailes pour tirer".
    this.featherFlapEndTime = 0;
    // Attaque en forme Loup : ruée franche vers l'avant pendant toute la
    // fenêtre d'attaque. Nettement plus rapide que le sprint (396) pour
    // qu'on voie clairement la ruée au lieu qu'elle se confonde avec la
    // course normale.
    this.wolfAttackDashSpeed = 780;
    this.attackDashActive = false;
    this.attackDashDir = 1;

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
    this.baseDoubleJumpVelocity = BASE_DOUBLE_JUMP_VELOCITY;
    this.monkeyJumpVelocity = MONKEY_JUMP_VELOCITY;
    // Forme prise par le 2e saut en cours ('eagle' | 'monkey' | null = double
    // saut de base) -- remise à null à l'atterrissage.
    this.airJumpForm = null;
    // Liane tenue (forme singe, cf. Liane.js) ou null. `vineMomentumSpeed` :
    // élan horizontal conservé après le lâcher, jusqu'à l'atterrissage (sinon
    // moveMaxSpeed=190 le rabotait aussitôt).
    this.vine = null;
    this.lastVine = null;
    this.vineReleasedAt = -Infinity;
    this.vineMomentumSpeed = 0;
    this.monkeyReleasePoseUntil = 0;
    this.hurtPoseUntil = 0;
    this.throwPoseUntil = 0;
    // Compétence dont la hitbox (getSkillHitbox) est active, ex. 'ours' --
    // la Fondation s'en sert pour réserver la destruction des mossBlocks à
    // l'Ours. `lastSkillId` : dernière compétence lancée (y compris
    // instantanées : pierre, papillon).
    this.skillHitboxId = null;
    this.lastSkillId = null;
    FORMS.monkey = manifestFormConfig(scene, 'singe', 'jump');
    ensureManifestAnims(scene, 'singe');
    ensureManifestAnims(scene, 'transfo_singe');
    ensureManifestAnims(scene, 'agarica_extra');
    // Transfo singe : jouée seulement si l'art existe (sinon bascule nette).
    this.monkeyTransfoAnimKey = null;
    this.monkeyTransfoReverseKey = null;
    if (hasManifestArt(scene, 'transfo_singe')) {
      const tdef = getAssetManifest().transfo_singe;
      const tAnim = Object.keys(tdef.anims || {})[0];
      const fwdKey = `transfo_singe-${tAnim}`;
      if (scene.anims.exists(fwdKey)) {
        this.monkeyTransfoAnimKey = fwdKey;
        this.monkeyTransfoReverseKey = `${fwdKey}-reverse`;
        if (!scene.anims.exists(this.monkeyTransfoReverseKey)) {
          const frames = scene.anims.get(fwdKey).frames.map((f) => ({ key: f.textureKey })).reverse();
          scene.anims.create({ key: this.monkeyTransfoReverseKey, frames, frameRate: frames.length / (MONKEY_TRANSFO_MS / 1000), repeat: 0 });
        }
        // 1re frame = Agarica encore humaine : ramenée à la hauteur de l'idle
        // (l'art la dessine ~109 px de haut à l'échelle du manifest, d'où un
        // sursaut de taille au début de la transfo) ; la dernière frame, le
        // singe, tombe alors à ~67 px, proche du singe au repos (~64 px).
        const tcfg = manifestFormConfig(scene, 'transfo_singe', tAnim);
        const tScale = scaleMatchingHumanHeight(scene, tcfg.texture, tcfg.scale);
        this.monkeyTransfoCfg = { ...tcfg, scale: tScale, body: transfoBodyConfig(tcfg.frameWidth, tcfg.frameHeight, tScale) };
      }
    }
    // Triche Ctrl+Shift+D (écouteur principal dans LevelKit, qui ignore le
    // singe) : débloque aussi la forme singe, sans la rendre active (l'aigle
    // posé par LevelKit reste la forme aérienne -- anciennes zones).
    scene.input.keyboard.on('keydown-D', (event) => {
      if (!event.ctrlKey || !event.shiftKey || !this.active) return;
      this.hasMonkeyForm = true;
      this.airFormsSeen.monkey = true;
      playerStateSet(scene, 'hasMonkeyForm', true);
    });
    this.jumpsUsed = 0;
    this.justJumped = false;
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
    // Sens courant (mis à jour uniquement quand une direction est pressée) :
    // le sprite humain fait face à gauche par défaut, le loup fait face à
    // droite par défaut (cf. application du flip après setForm() plus bas).
    this.facingDir = -1;

    this.form = null;
    this.setForm('agarica');

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
    this.syncFormSlots();
    const left = this.cursors.left.isDown || this.keys.left.isDown;
    const right = this.cursors.right.isDown || this.keys.right.isDown;
    const leftJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.left)
      || Phaser.Input.Keyboard.JustDown(this.keys.left);
    const rightJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.right)
      || Phaser.Input.Keyboard.JustDown(this.keys.right);
    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.jump);
    const downHeld = this.cursors.down.isDown || this.keys.down.isDown;

    const now = this.scene.time.now;
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
    let transitionTriggeredThisFrame = false;

    if (Phaser.Input.Keyboard.JustDown(this.skillKeys.slot1)) this.tryActivateSkill(0, now);
    else if (Phaser.Input.Keyboard.JustDown(this.skillKeys.slot2)) this.tryActivateSkill(1, now);
    else if (Phaser.Input.Keyboard.JustDown(this.skillKeys.slot3)) this.tryActivateSkill(2, now);
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
      const endedSkillDef = SKILL_DEFS[this.activeSkillId];
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
      this.scene.physics.world.timeScale = FEATHER_SLOWMO_PHYSICS_TIMESCALE;
      this.scene.anims.globalTimeScale = FEATHER_SLOWMO_ANIM_TIMESCALE;
      this.scene.time.delayedCall(FEATHER_SLOWMO_DURATION_MS, () => {
        this.scene.physics.world.timeScale = 1;
        this.scene.anims.globalTimeScale = 1;
      });
    } else if (attackJustPressed && !this.isAttacking && this.form !== 'octopus' && now >= this.attackCooldownEndTime) {
      // Retour utilisateur : "retire l'attaque de la pieuvre" -- forme
      // 100% nage, jamais de combat (elle n'avait de toute façon aucune
      // pose d'attaque dédiée, cf. le cycle de nage rejoué tel quel plus
      // bas dans update() -- juste le flash de teinte générique et la
      // hitbox qui restaient actifs malgré l'absence de vraie animation).
      this.isAttacking = true;
      // Forme humaine : sa propre durée plus courte (cf.
      // AGARICA_ATTACK_DURATION) -- Loup/Pieuvre gardent `attackDuration`
      // (calé sur la morsure du Loup, cf. sa définition).
      this.attackEndTime = now + (this.form === 'agarica' ? AGARICA_ATTACK_DURATION : this.attackDuration);
      this.attackCooldownEndTime = now + this.attackCooldown;
      this.attackDashActive = this.form === 'wolf';
      this.attackDashDir = this.facingDir;
    }
    if (this.isAttacking && now >= this.attackEndTime) {
      this.isAttacking = false;
      this.attackDashActive = false;
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
    const shiftHeld = this.cursors.shift.isDown;
    // `onGround` n'est requis qu'au DÉCLENCHEMENT du sprint, pas en continu :
    // passer en forme Loup redimensionne le corps physique (cf. setForm),
    // ce qui fait rebondir `onGround` de façon instable sur plusieurs frames
    // tant qu'on sprinte (observé : pas juste 1 frame). Sans ce
    // `wolfSprintActive` qui ne dépend plus que des touches une fois lancé,
    // `sprinting` retombait à faux à chaque rebond, clignotant Loup/Agarica
    // et rejouant l'anim de transfo en boucle.
    const sprintInputHeld = (left || right) && (shiftHeld || this.tapSprintDirection !== null);
    if (swimming) {
      // La Pieuvre a la priorité absolue dans l'eau (cf. commentaire sur
      // `swimming` plus haut) : un sprint entamé juste avant d'entrer dans
      // l'eau ne doit pas rester actif en arrière-plan pendant la nage.
      this.wolfSprintActive = false;
    } else if (!this.wolfSprintActive) {
      this.wolfSprintActive = this.hasWolfForm && this.formEquipped('wolf') && onGround && sprintInputHeld;
    } else {
      this.wolfSprintActive = this.hasWolfForm && this.formEquipped('wolf') && sprintInputHeld;
    }
    const sprinting = this.wolfSprintActive;
    const acceleration = sprinting ? this.wolfAcceleration : this.moveAcceleration;
    const webSlowed = this.inWeb && !sprinting;
    const maxSpeed = this.attackDashActive
      ? this.wolfAttackDashSpeed
      : sprinting ? this.wolfMaxSpeed : webSlowed ? this.moveMaxSpeed * this.webSlowMultiplier : this.moveMaxSpeed;

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

    // Ruée d'attaque Loup : écrase le contrôle normal pour toute la fenêtre
    // d'attaque, direction figée au moment du coup (cf. déclenchement plus
    // haut), qu'une touche de déplacement soit tenue ou non.
    if (this.attackDashActive) {
      this.setAccelerationX(0);
      this.setVelocityX(this.attackDashDir * this.wolfAttackDashSpeed);
    }

    if (onGround) {
      this.jumpsUsed = 0;
      this.wolfJumpCarry = false;
      this.airJumpForm = null;
      this.vineMomentumSpeed = 0;
    }

    // Lianes (forme singe, cf. Liane.js) : accroche automatique en l'air,
    // balancement pendulaire (gauche/droite pompe l'élan), Saut = lâcher
    // avec l'élan, S = se laisser tomber. Sans singe actif : simple décor.
    const airForm = this.getActiveAirForm();
    const monkeyActive = !swimming && airForm === 'monkey';
    let jumpConsumed = false;
    if (this.vine && (!monkeyActive || onGround || !this.vine.alive)) this.releaseVine(false, now);
    if (this.vine) {
      if (jumpJustPressed) {
        this.releaseVine(true, now);
        jumpConsumed = true;
      } else if (downHeld) {
        this.releaseVine(false, now);
      } else {
        const dtSec = Math.min(this.scene.game.loop.delta, 50) / 1000;
        const target = this.vine.stepSwing(this, dir, dtSec);
        if (this.body.blocked.left || this.body.blocked.right) this.vine.bounceOffWall();
        this.setAcceleration(0, 0);
        this.setDrag(0, 0);
        this.body.maxVelocity.x = 1200;
        this.setVelocity((target.x - this.x) / dtSec, (target.y - this.y) / dtSec);
      }
    } else if (monkeyActive && !onGround && typeof findGrabbableVine === 'function') {
      const vine = findGrabbableVine(this.scene, this, now);
      if (vine) this.grabVine(vine, now);
    }
    // Élan conservé après un lâcher de liane : vitesse max relevée et frein
    // aérien réduit jusqu'à l'atterrissage (ou la prochaine liane).
    if (!this.vine && this.vineMomentumSpeed > 0 && !onGround) {
      this.body.maxVelocity.x = Math.max(maxSpeed, this.vineMomentumSpeed);
      this.setDragX(150);
    }

    // Vrai une seule frame, celle du saut de base (pas le double-saut) —
    // Xara s'en sert pour mimiquer ce saut si elle est à portée (cf.
    // XARA_JUMP_RANGE dans Xara.js). Remise à faux au début de chaque
    // update() (cf. tout en haut), jamais laissée traîner.
    if (jumpJustPressed && onGround && !jumpConsumed) this.justJumped = true;

    if (jumpJustPressed && !jumpConsumed && !this.vine) {
      if (onGround) {
        this.setVelocityY(this.jumpVelocity);
        this.jumpsUsed = 1;
        this.wolfJumpCarry = sprinting;
      } else if (!swimming && airForm !== 'eagle' && this.jumpsUsed < 2) {
        // Double saut de base (aucune forme aérienne) ou saut court du singe
        // (transformation visuelle singe, cf. sélection de forme plus bas).
        this.jumpsUsed += 1;
        if (this.jumpsUsed === 2) {
          this.airJumpForm = airForm === 'monkey' ? 'monkey' : null;
          this.setVelocityY(airForm === 'monkey' ? this.monkeyJumpVelocity : this.baseDoubleJumpVelocity);
          this.wolfJumpCarry = false;
          if (airForm !== 'monkey') this.spawnAirJumpPuff();
        } else {
          this.setVelocityY(this.jumpVelocity);
        }
      } else if (!swimming && airForm === 'eagle' && this.jumpsUsed < 2) {
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

    const falling = this.body.velocity.y > 0 && this.form !== 'eagle' && !this.vine;
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
    // (comme la ruée Loup/le piqué Aigle : on écrase après la logique
    // normale plutôt que de bâtir un système à part). `swimming` calculé
    // plus haut (cf. commentaire dessus).
    if (this.inWater && !(this.hasOctopusForm && this.formEquipped('octopus'))) {
      this.hitByEnemy();
    }
    this.body.setAllowGravity(!swimming && !this.vine);
    if (swimming) {
      const swimUp = this.cursors.up.isDown || this.keys.up.isDown;
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
    } else if (this.attackDashActive || sprinting || (this.wolfJumpCarry && this.jumpsUsed < 2)) {
      // attackDashActive : garde la forme Loup figée pendant toute la ruée,
      // insensible à un micro-rebond d'une frame de `onGround` (rebond
      // physique observé au moment où la vitesse de ruée est imposée) qui
      // ferait sinon retomber sprinting à faux et clignoter vers Agarica.
      this.setForm('wolf');
    } else {
      this.setForm('agarica');
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
    } else if (!transitionTriggeredThisFrame && !this.formTransitionActive && !swimming && leavingWolf) {
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
      this.beginFormTransition(now, ANIM_TRANSFO_TO_HUMAN_FROM_OCTOPUS_KEY, this.octopusTransformDuration, TRANSFO_PIEUVRE_SCALE, TRANSFO_PIEUVRE_BODY, false);    } else if (!transitionTriggeredThisFrame && !this.formTransitionActive && !swimming
      && this.monkeyTransfoAnimKey && this.form === 'monkey' && !wasMonkeyForm) {
      // Transfo singe (manifest `transfo_singe`) : seulement si l'art existe,
      // sinon bascule nette sur la silhouette (ou le placeholder) du singe.
      const tcfg = this.monkeyTransfoCfg;
      this.beginFormTransition(now, this.monkeyTransfoAnimKey, MONKEY_TRANSFO_MS, tcfg.scale, tcfg.body, MONKEY_FACES_RIGHT);
    } else if (!transitionTriggeredThisFrame && !this.formTransitionActive && !swimming
      && this.monkeyTransfoReverseKey && this.form === 'agarica' && wasMonkeyForm) {
      const tcfg = this.monkeyTransfoCfg;
      this.beginFormTransition(now, this.monkeyTransfoReverseKey, MONKEY_TRANSFO_MS, tcfg.scale, tcfg.body, MONKEY_FACES_RIGHT);
    }

    // Compétence avec art dédié (cf. SKILL_DEFS.ours, `animKey`) en cours :
    // prend le pas sur la forme sous-jacente pendant sa fenêtre de transfo,
    // le temps d'afficher sa propre silhouette animée -- calculé une seule
    // fois ici, réutilisé pour le flip ET le bloc texture/anim plus bas.
    // Origine décalée pour la prise de liane (cf. applyVineArtAnchor) : remise
    // à (0.5, 1) chaque frame AVANT les blocs ci-dessous, qui supposent tous
    // les pieds à l'origine ; la branche liane la repose si besoin.
    this.resetVineArtAnchor();
    const activeSkillDef = this.activeSkillId ? SKILL_DEFS[this.activeSkillId] : null;
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
        : (this.form === 'wolf' || this.form === 'eagle' || (this.form === 'monkey' && MONKEY_FACES_RIGHT));
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
      } else {
        // Échelle intermédiaire le temps de l'anim de transfo. Hitbox
        // réajustée au canvas/échelle de la transfo (cf. transfoBodyConfig)
        // plutôt que laissée à celle de la forme cible posée par setForm(),
        // sans quoi elle ne correspond plus du tout au visuel affiché
        // pendant la transfo (décalage/enfoncement dans le sol observé).
        this.applyBodyForScale(this.formTransitionScale, this.formTransitionBody);
        this.anims.play(this.formTransitionAnimKey, true);
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
      } else if (activeSkillDef.transitionOutAnimKey && now >= this.skillAttackEndTime) {
        // Phase 3 : retour à l'humaine, jouée APRÈS l'anim d'attaque
        // (demande explicite : "mettre l'animation de transformation a
        // l'envers apres l'attaque pour me retransformer en humain") --
        // MÊMES tailles que la phase 1 donc la silhouette rétrécit
        // automatiquement en sens inverse, juste les frames jouées à
        // l'envers (cf. ANIM_TRANSFO_FROM_OURS_KEY/ANIM_CRAPAUD_RETRACT_KEY).
        this.anims.play(activeSkillDef.transitionOutAnimKey, true);
        this.applySkillTransitionVisual(activeSkillDef);
      } else {
        // Phase 2 : anim d'attaque principale (cf. SKILL_DEFS.ours.animKey).
        this.applyBodyForScale(activeSkillDef.scale, activeSkillDef.body);
        this.anims.play(activeSkillDef.animKey, true);
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
        if (this.storyPose && extra(this.storyPose)) {
          // Pose narrative tenue (cf. setPlayerStoryPose dans StoryKit, chute de mort).
          this.applyAgaricaExtraPose(this.storyPose);
        } else if (now < this.hurtPoseUntil && !this.isAttacking && extra('hurt')) {
          this.applyAgaricaExtraPose('hurt');
        } else if (this.isAttacking || now < this.throwPoseUntil) {
          this.anims.play(ANIM_AGARICA_ATTACK_KEY, true);
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
        if (this.isAttacking) {
          this.anims.play(ANIM_WOLF_ATTACK_KEY, true);
        } else if (justLandedThisFrame) {
          this.anims.stop();
          this.setTexture(WOLF_LANDING_TEXTURE);
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
        const sc = this.scene;
        if (this.vine) {
          const want = Math.abs(this.vine.omega) > 0.8 ? 'liane_swing' : 'liane_hang';
          if (hasManifestArt(sc, 'singe', want)) { playManifestOn(this, 'singe', want); this.applyVineArtAnchor(); }
          else if (hasManifestArt(sc, 'singe', 'liane_hang')) { playManifestOn(this, 'singe', 'liane_hang'); this.applyVineArtAnchor(); }
          else if (hasManifestArt(sc, 'agarica_extra', want)) this.applyAgaricaExtraPose(want);
          else if (hasManifestArt(sc, 'agarica_extra', 'liane_hang')) this.applyAgaricaExtraPose('liane_hang');
          else playManifestOn(this, 'singe', 'liane_hang');
        } else {
          playManifestOn(this, 'singe', now < this.monkeyReleasePoseUntil ? 'release_flip' : 'jump');
        }
      } else if (this.form === 'octopus') {
        // Pas d'attaque du tout pour cette forme (cf. le garde-fou
        // `this.form !== 'octopus'` sur le déclenchement plus haut) --
        // juste un cycle de nage, vue de face. Pas d'idle séparé non plus :
        // figée sur la 1re frame du cycle au repos.
        const swimUp = this.cursors.up.isDown || this.keys.up.isDown;
        const moving = dir !== 0 || swimUp || downHeld;
        if (moving) {
          this.anims.play(ANIM_PIEUVRE_WALK_KEY, true);
        } else {
          this.anims.stop();
          this.setTexture('pieuvre-walk-0');
        }
      }
    }

    // Remis à faux ici : si la scène ne le repasse pas à `true` via overlap
    // au prochain step physique (plus en contact avec une toile), on reste
    // correctement "hors toile" sans dépendre d'un évènement de sortie.
    this.inWeb = false;
    this.inWater = false;
  }

  setForm(form) {
    if (this.form === form) return;
    this.form = form;

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

  // Arme l'overlay de transformation (cf. commentaire sur formTransitionActive
  // dans le constructeur) : les 6 champs sont toujours posés ensemble, un
  // par cas de figure (entrée/sortie Loup, sortie Aigle, entrée/sortie
  // Pieuvre, flash Loup->Aigle) — factorisé pour ne pas risquer d'en oublier
  // un en ajoutant un futur cas.
  beginFormTransition(now, animKey, duration, scale, body, facesRight) {
    this.formTransitionActive = true;
    this.formTransitionAnimKey = animKey;
    this.formTransitionEndTime = now + duration;
    this.formTransitionScale = scale;
    this.formTransitionBody = body;
    this.formTransitionFacesRight = facesRight;
  }

  // Rectangle (espace monde) de la dague active pendant la fenêtre
  // d'attaque, devant Agarica selon le sens où elle regarde. Retourne null
  // hors attaque.
  //
  // Retour utilisateur : "les hitbox d'attaque devraient prendre toute
  // l'image, réduite en hauteur (garder le centre)" -- l'ancien
  // attackRange/attackHeight (34x60) était un chiffre fixe unique, partagé
  // par les 4 formes malgré des silhouettes réelles très différentes (même
  // défaut que FORMS.body avant PLAYER_BODY_FRACTION, cf. plus haut) : la
  // dague d'Agarica et la morsure du Loup, bien plus large, frappaient
  // toutes les deux sur exactement la même largeur. Hauteur ramenée à
  // ATTACK_HITBOX_HEIGHT_FRACTION de la silhouette PLEINE (pas réduite comme
  // la hitbox de collision passive) et centrée sur le milieu du corps
  // plutôt qu'ancrée près de la tête ("garder le centre"), pour toutes les
  // formes. Largeur : reprise à playerFullDisplaySize ("toute l'image") pour
  // les formes SANS mesure dédiée -- mais retour utilisateur suivant : "la
  // hitbox de l'attaque d'agarica devrait être beaucoup plus longue devant"
  // -- sa propre silhouette (~45px) ne rendait pas justice à la vraie
  // portée de la lame d'énergie du swing, bien plus longue (cf.
  // AGARICA_ATTACK_REACH_RAW, mesurée directement sur la planche
  // d'attaque) : cas spécial pour sa forme uniquement, les autres formes
  // (Loup...) gardent leur propre largeur de silhouette, jamais mesurée
  // comme "trop courte".
  getAttackHitbox() {
    // Piqué Aigle (S maintenu en forme Aigle) : le contact seul inflige des
    // dégâts, pas de fenêtre d'attaque dédiée — clin d'œil au piqué du
    // Corbeau, qui touche aussi au simple contact.
    if (this.eagleDiving) return this.getBounds();
    if (!this.isAttacking) return null;
    const fullSize = playerFullDisplaySize(this.form);
    const attackWidth = this.form === 'agarica'
      ? AGARICA_ATTACK_REACH_RAW * AGARICA_ATTACK_SCALE
      : fullSize.width;
    const attackHeight = fullSize.height * ATTACK_HITBOX_HEIGHT_FRACTION;
    // `facingDir` plutôt que `flipX` : ce dernier a un sens inversé selon la
    // forme (le loup/l'aigle font face à droite par défaut, cf. setFlipX
    // dans update()), alors que facingDir reste la direction réelle voulue.
    const x = this.facingDir >= 0 ? this.x : this.x - attackWidth;
    // this.y = pieds (origine ancrée en bas) ; centre du corps = pieds -
    // moitié de la silhouette pleine. La bande réduite reste centrée sur ce
    // même point quelle que soit la forme, au lieu d'un décalage fixe.
    const bodyCenterY = this.y - fullSize.height / 2;
    const y = bodyCenterY - attackHeight / 2;
    return new Phaser.Geom.Rectangle(x, y, attackWidth, attackHeight);
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
    if (this.energy < def.cost) return; // pas de retour visuel dédié pour l'instant (TODO UI : flash de la barre ?)
    this.energy -= def.cost;
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
    // Léger cooldown propre à la compétence (pas juste borné par le coût en
    // énergie) : évite un spam à 2 activations la même frame si jamais le
    // coût devient très faible plus tard (totems ?).
    this.skillCooldownEndTime = now + def.transformDurationMs;

    this.skillTransformActive = true;
    this.skillTransformEndTime = now + def.transformDurationMs;
    this.activeSkillId = skillId;
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
    const dir = this.facingDir >= 0 ? 1 : -1;
    const centerX = this.x + dir * def.hitboxOffsetX;
    const w = def.hitboxWidth * this.skillSizeMultiplier;
    const h = def.hitboxHeight * this.skillSizeMultiplier;
    const rect = new Phaser.Geom.Rectangle(centerX - w / 2, this.y - h, w, h);
    // `hitboxDelayMs` (cf. SKILL_DEFS.ours) repousse seulement l'ACTIVATION
    // de la zone (cf. update()), pas sa position -- figée ici, au moment du
    // cast, comme avant.
    const delay = def.hitboxDelayMs || 0;
    this.skillHitboxId = skillId;
    if (delay > 0) {
      this.skillHitboxRect = null;
      this.skillHitboxPendingRect = rect;
      this.skillHitboxActivateAt = now + delay;
    } else {
      this.skillHitboxRect = rect;
      this.skillHitboxPendingRect = null;
    }
    this.skillActiveUntil = now + delay + def.hitboxDurationMs;
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
    const t = this.equippedTotem;
    if (t.head && t.body) {
      const body = TOTEM_BODIES[t.body];
      bonus[body.statKey] += body.perStack;
    }
    // +1 cœur permanent : secret de la forêt sombre 2 (flag d'histoire
    // `coeurBonusForet`, cf. src/story/acte1.js), cumulé au bonus de totem.
    const storyHeartBonus = this.scene && this.scene.registry.get('coeurBonusForet') ? 1 : 0;
    this.maxHearts = HEART_MAX + bonus.heartBonus + storyHeartBonus;
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

  // Forme aérienne réellement utilisable ('eagle' | 'monkey' | null).
  getActiveAirForm() {
    return this.airForm && this.isFormUnlocked(this.airForm) ? this.airForm : null;
  }

  // Choix initial : `airForm` du registre s'il est valide ; sinon déduit
  // d'`equippedForms` (anciennes sauvegardes / triche : aigle prioritaire) ;
  // jamais choisi et rien d'équipé → la forme aérienne débloquée (aigle si
  // les deux), pour qu'une forme obtenue sans feu de camp marche aussitôt.
  resolveInitialAirForm(regAir) {
    if (regAir === null) return null;
    if (regAir && this.isFormUnlocked(regAir)) return regAir;
    const inSlots = AIR_FORM_IDS.filter((id) => this.equippedForms.includes(id) && this.isFormUnlocked(id));
    if (inSlots.length) return inSlots.includes('eagle') ? 'eagle' : inSlots[0];
    if (regAir === undefined && this.equippedForms.every((f) => !f)) {
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
      this.equippedForms.includes('wolf') ? 'wolf' : null,
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
    const slotIdx = id === 'wolf' ? 0 : id === 'octopus' ? 2 : -1;
    if (slotIdx === -1) return;
    const next = this.equippedForms.slice();
    next[slotIdx] = id;
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
    this.wolfJumpCarry = false;
    this.scene.events.emit('vine-grab', vine);
  }

  // `withJump` : lâcher par Saut (élan + petite impulsion vers le haut) ;
  // sinon simple chute (S, forme retirée, coup reçu...).
  releaseVine(withJump, now) {
    const vine = this.vine;
    if (!vine) return;
    const v = vine.detach(this);
    this.vine = null;
    this.lastVine = vine;
    this.vineReleasedAt = now;
    let vx = v.vx;
    let vy = v.vy;
    if (withJump) {
      vx *= VINE_RELEASE_SPEED_MULT;
      vy = Math.min(vy, 0) + VINE_RELEASE_BOOST_Y;
      this.monkeyReleasePoseUntil = now + MONKEY_RELEASE_POSE_MS;
    }
    this.setVelocity(vx, vy);
    this.vineMomentumSpeed = Math.min(Math.abs(vx), VINE_MAX_CARRY_SPEED);
    this.body.maxVelocity.x = Math.max(this.body.maxVelocity.x, this.vineMomentumSpeed);
    this.scene.events.emit('vine-release', vine);
  }

  // Petit nuage sous les pieds pour le double saut de base (pas de transfo).
  spawnAirJumpPuff() {
    const g = this.scene.add.circle(this.x, this.y, 10, 0xe8f6ff, 0.55).setDepth(this.depth);
    this.scene.tweens.add({
      targets: g, scaleX: 2.2, scaleY: 0.8, alpha: 0, duration: 260, onComplete: () => g.destroy(),
    });
  }

  // Art singe suspendu : le poing levé est dessiné 64-96 px au-dessus des
  // pieds, alors que la physique tient les mains à VINE_HANG_OFFSET (58 px,
  // cf. Liane.js -- portée de prise calibrée sur les niveaux). Plutôt que de
  // changer cette physique, on cale le DESSIN : l'origine passe sur le poing
  // de la frame courante, posé sur le point de prise ; le corps physique est
  // compensé pour ne pas bouger d'un pixel. Le flipX de Phaser miroite la
  // texture dans le même cadre : d'où W - x quand Agarica regarde à gauche.
  applyVineArtAnchor() {
    const info = textureAlphaInfo(this.scene, this.texture.key);
    if (!info || typeof VINE_HANG_OFFSET === 'undefined') return;
    const W = this.frame.realWidth;
    const H = this.frame.realHeight;
    const fx = this.flipX ? W - info.fistX : info.fistX;
    this.setOrigin(Phaser.Math.Clamp(fx / W, 0, 1), (info.fistY + VINE_HANG_OFFSET / this.scaleY) / H);
    const b = FORMS.monkey.body;
    this.body.setOffset(b.offsetX + (this.displayOriginX - W / 2), b.offsetY + (this.displayOriginY - H));
    this.vineArtAnchored = true;
  }

  resetVineArtAnchor() {
    if (!this.vineArtAnchored) return;
    this.vineArtAnchored = false;
    this.setOrigin(0.5, 1);
  }

  applyAgaricaExtraPose(anim) {
    this.extraPoseCfg = this.extraPoseCfg || {};
    let cfg = this.extraPoseCfg[anim];
    if (!cfg) {
      cfg = manifestFormConfig(this.scene, 'agarica_extra', anim);
      if (AGARICA_EXTRA_STANDING_ANIMS.includes(anim)) {
        const scale = scaleMatchingHumanHeight(this.scene, cfg.texture, cfg.scale);
        cfg = { ...cfg, scale, body: transfoBodyConfig(cfg.frameWidth, cfg.frameHeight, scale) };
      }
      this.extraPoseCfg[anim] = cfg;
    }
    playManifestOn(this, 'agarica_extra', anim);
    this.applyBodyForScale(cfg.scale, cfg.body);
    this.setFlipX(AGARICA_EXTRA_FACES_RIGHT ? this.facingDir < 0 : this.facingDir > 0);
  }

  // Rectangle de la nuée de papillons (soin) en cours, ou null -- PAS
  // renvoyé par getSkillHitbox() : le papillon ne doit jamais blesser.
  getHealHitbox() {
    return this.papillonSwarm && this.papillonSwarm.active ? this.papillonSwarm.rect : null;
  }

  // Petite portion d'énergie gagnée par coup porté (mêlée ET plume, cf.
  // l'overlap dans LevelKit.js et Feather.js) — façon SOUL de Hollow Knight,
  // seule source de recharge hors feu de camp (cf. refillAtCampfire).
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

  // Appelé par la scène quand un ennemi touche Agarica hors fenêtre
  // d'attaque : perd 1 cœur avec un court flash d'invulnérabilité ; seul
  // un cœur tombé à 0 renvoie au point de départ de la zone (et restaure
  // les cœurs au passage) — perdre un cœur qui n'est pas le dernier ne
  // bouge plus Agarica de place, contrairement à l'ancien comportement
  // (retour systématique, avant l'introduction d'une vraie vie à
  // plusieurs points).
  hitByEnemy() {
    if (this.isInvulnerable) return;
    this.isInvulnerable = true;
    if (this.vine) this.releaseVine(false, this.scene.time.now);
    this.hurtPoseUntil = this.scene.time.now + HURT_POSE_MS;
    this.hearts -= 1;
    this.scene.registry.set('hearts', this.hearts);
    this.setTint(0xff4d6d);
    this.setVelocity(0, 0);
    const depleted = this.hearts <= 0;
    // Dernier cœur perdu : pose `death` (art Codex agarica_extra) tenue un
    // instant avant la réapparition, monde gelé via __cutsceneLock pour que
    // ni les ennemis ni les touches n'interfèrent. Sans art : comme avant.
    const deathPose = depleted && this.form === 'agarica' && hasManifestArt(this.scene, 'agarica_extra', 'death');
    if (deathPose) {
      this.storyPose = 'death';
      this.applyAgaricaExtraPose('death');
      this.scene.__cutsceneLock = (this.scene.__cutsceneLock || 0) + 1;
    }
    const flashMs = deathPose ? 1100 : 300;
    this.scene.time.delayedCall(flashMs, () => {
      if (deathPose) {
        this.storyPose = null;
        this.scene.__cutsceneLock = Math.max(0, (this.scene.__cutsceneLock || 0) - 1);
      }
      if (depleted) {
        this.hearts = this.maxHearts;
        this.scene.registry.set('hearts', this.hearts);
        this.setPosition(this.spawnX, this.spawnY);
      }
      this.setVelocity(0, 0);
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
}
