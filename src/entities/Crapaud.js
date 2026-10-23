// Ennemi Crapaud : fixe (comme l'Araignée), attaque à distance en tirant
// la langue plutôt qu'au contact -- utilisateur : "j'ai rajouter les frame
// pour le crapeau, l'apogé de l'attaque avec la langue c'est l'image
// entière de la 2eme ligne, ensuite tu refais l'animation a l'envers pour
// qu'il rerentre sa langue". Généré depuis assets/sprites/image.png via
// tools/crop_crapaud.py (voir ce script pour pourquoi il lui faut une
// découpe dédiée, alignée à GAUCHE plutôt que centrée).
const CRAPAUD_FRAME_COUNT = 5;
const CRAPAUD_FRAME_WIDTH = 1434;
const CRAPAUD_FRAME_HEIGHT = 237;
// Retour utilisateur : "trop petit le crapeau" -- augmentée depuis 0.19
// (visée initiale ~40px, comparable à l'Araignée/au Loup sanguinaire).
// Partagée par l'ennemi ET la compétence du joueur (cf. SKILL_DEFS.crapaud
// plus bas), donc ce changement s'applique aux deux d'un coup.
const CRAPAUD_SCALE = 0.26;
// Largeur de CONTENU (pas le canvas, qui est le même 1434px pour toutes les
// frames une fois uniformisé) mesurée par tools/crop_crapaud.py pour
// chaque frame -- sert de portée de la hitbox pendant l'attaque : la
// langue au repos (frame 0) ne dépasse pas du corps, à l'apogée (frame 4)
// elle atteint presque toute la largeur du canvas. Corps + langue restant
// alignés à GAUCHE (cf. plus haut), cette portée se lit directement comme
// "distance en pixels bruts depuis le bord gauche du canvas".
const CRAPAUD_FRAME_REACH = [274, 281, 332, 468, 1422];
// Retour utilisateur : "accelere l'attaque du crapeau" -- montée de 14 à 26
// (extend/retract ~192ms au lieu de ~357ms). Partagée par l'ennemi ET la
// compétence du joueur (cf. CRAPAUD_SCALE plus haut, même règle).
const CRAPAUD_FRAME_RATE = 26;
const ANIM_CRAPAUD_EXTEND_KEY = 'crapaud-extend';
const ANIM_CRAPAUD_RETRACT_KEY = 'crapaud-retract';
// Pose figée à l'apogée (une seule frame, cf. SKILL_DEFS.crapaud plus bas
// -- sert de "animKey" pendant la pause entre extension et rétraction,
// aussi bien pour l'ennemi que pour la compétence du joueur).
const ANIM_CRAPAUD_HOLD_KEY = 'crapaud-hold';
const CRAPAUD_EXTEND_DURATION = Math.round((CRAPAUD_FRAME_COUNT / CRAPAUD_FRAME_RATE) * 1000);
// Petite pause à l'apogée avant de rentrer la langue -- non demandée
// explicitement, mais une langue qui se rétracte instantanément sans
// aucune pause aurait l'air d'un bug plutôt que d'une vraie attaque.
// Raccourcie avec le reste de l'attaque (cf. CRAPAUD_FRAME_RATE) : 150 -> 90.
const CRAPAUD_HOLD_DURATION = 90;
// Portée de détection calée sur l'allonge max de la langue (frame 4) --
// inutile de déclencher l'attaque si le joueur est hors de portée réelle.
const CRAPAUD_DETECTION_RANGE_X = CRAPAUD_FRAME_REACH[4] * CRAPAUD_SCALE;
const CRAPAUD_DETECTION_RANGE_Y = 40;
const CRAPAUD_ATTACK_COOLDOWN = 2000;

function crapaudAnimFrames(indices) {
  return indices.map((i) => ({ key: `crapaud-${i}` }));
}

function ensureCrapaudAnimations(scene) {
  if (scene.anims.exists(ANIM_CRAPAUD_EXTEND_KEY)) return;
  scene.anims.create({
    key: ANIM_CRAPAUD_EXTEND_KEY,
    frames: crapaudAnimFrames([0, 1, 2, 3, 4]),
    frameRate: CRAPAUD_FRAME_RATE,
    repeat: 0,
  });
  scene.anims.create({
    key: ANIM_CRAPAUD_RETRACT_KEY,
    frames: crapaudAnimFrames([4, 3, 2, 1, 0]),
    frameRate: CRAPAUD_FRAME_RATE,
    repeat: 0,
  });
  scene.anims.create({
    key: ANIM_CRAPAUD_HOLD_KEY,
    frames: crapaudAnimFrames([4]),
    frameRate: 1,
    repeat: -1,
  });
}

// Numéro de frame actuellement affiché (0-4), lu depuis la texture en
// cours plutôt que la position dans l'anim -- même technique que
// getTransfoOursFrameIndex dans Player.js : comme l'anim de rétraction
// rejoue les mêmes textures en sens inverse, indexer par texture fait
// automatiquement rétrécir la hitbox en sens inverse sans code dédié.
function getCrapaudFrameIndex(sprite) {
  const key = sprite.anims.currentFrame && sprite.anims.currentFrame.textureKey;
  // Suffixe numérique final : marche aussi pour les frames du manifest
  // (`crapaud_corrompu-attack-3`, cf. CrapaudCorrompu.js).
  const match = /-(\d+)$/.exec(key || '');
  return match ? Number(match[1]) : 0;
}

// Hauteur/décalage vertical de la hitbox : fixes quelle que soit la frame
// (la langue reste à hauteur de bouche, pas besoin de grandir en Y).
const CRAPAUD_BODY_HEIGHT = 150;
const CRAPAUD_BODY_OFFSET_Y = CRAPAUD_FRAME_HEIGHT - 6 - CRAPAUD_BODY_HEIGHT;
const CRAPAUD_BODY_OFFSET_X = 6;
// Origine horizontale du sprite calée sur le CENTRE DU CORPS (frame 0),
// pas 0.5 (centre du canvas) : le canvas est bien plus large que le
// crapaud lui-même une fois uniformisé sur la frame la plus large (langue
// à l'apogée), et son contenu est aligné à GAUCHE (cf. tools/crop_crapaud.py)
// -- avec une origine à 0.5, placer l'ennemi à un `x` donné aurait mis le
// CENTRE DU CANVAS (donc du vide, pas le crapaud) à cet `x`, décalant
// visiblement le corps vers la droite du point d'apparition voulu.
const CRAPAUD_ORIGIN_X = (CRAPAUD_BODY_OFFSET_X + CRAPAUD_FRAME_REACH[0] / 2) / CRAPAUD_FRAME_WIDTH;

// Fixe (ne patrouille pas, cf. Araignee.js), toujours face à droite (l'art
// source n'a pas de pose miroir -- pas de flip pour l'instant, comme
// l'Araignée) mais attaque à distance quand Agarica est à portée : contrairement
// à l'Araignée, la langue inflige bien des dégâts. La hitbox PHYSIQUE
// (this.body, pas juste le sprite affiché) s'étire avec chaque frame de
// l'anim pour suivre la portée réelle de la langue, ce qui suffit à
// déclencher les dégâts via le système d'overlap générique déjà en place
// dans LevelKit.js -- pas besoin d'un système de hitbox séparé comme
// getSkillHitbox() côté joueur.
class Crapaud extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    ensureCrapaudAnimations(scene);
    super(scene, x, y, 'crapaud-0');
    // Clés de texture/anims en champs d'instance : CrapaudCorrompu les
    // remplace par celles de son art (même découpe 5 frames) s'il existe.
    this.idleTextureKey = 'crapaud-0';
    this.extendAnimKey = ANIM_CRAPAUD_EXTEND_KEY;
    this.retractAnimKey = ANIM_CRAPAUD_RETRACT_KEY;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(CRAPAUD_SCALE);
    this.setOrigin(CRAPAUD_ORIGIN_X, 1);

    this.applyReachBody(0);

    this.state = 'idle'; // 'idle' | 'extending' | 'holding' | 'retracting'
    this.stateEndTime = 0;
    this.lastAttackEndTime = -Infinity;
    this.defeated = false;
  }

  // Étire/rétrécit la hitbox physique pour suivre la portée de la langue à
  // la frame `frameIdx` (cf. CRAPAUD_FRAME_REACH plus haut). Le corps
  // reste aligné à GAUCHE (offsetX fixe) -- seule sa LARGEUR change,
  // exactement comme la langue elle-même ne fait que s'étirer vers la
  // droite depuis la bouche.
  applyReachBody(frameIdx) {
    const reach = CRAPAUD_FRAME_REACH[frameIdx];
    this.body.setSize(reach - CRAPAUD_BODY_OFFSET_X, CRAPAUD_BODY_HEIGHT);
    this.body.setOffset(CRAPAUD_BODY_OFFSET_X, CRAPAUD_BODY_OFFSET_Y);
  }

  update(player) {
    if (this.defeated) return;
    const now = this.scene.time.now;

    if (this.state === 'idle') {
      this.setTexture(this.idleTextureKey);
      this.applyReachBody(0);
      const dx = player.x - this.x;
      // Toujours face à droite (cf. commentaire sur la classe) : n'attaque
      // que si Agarica est de CE côté-là, comme l'Ours ne pourrait pas
      // mordre quelqu'un derrière lui.
      const inRange = dx > 0
        && Math.abs(dx) < CRAPAUD_DETECTION_RANGE_X
        && Math.abs(player.y - this.y) < CRAPAUD_DETECTION_RANGE_Y;
      if (inRange && now - this.lastAttackEndTime > CRAPAUD_ATTACK_COOLDOWN) {
        this.state = 'extending';
        this.anims.play(this.extendAnimKey, true);
      }
      return;
    }

    if (this.state === 'extending') {
      this.applyReachBody(getCrapaudFrameIndex(this));
      const animDone = this.anims.currentAnim
        && this.anims.currentAnim.key === this.extendAnimKey
        && !this.anims.isPlaying;
      if (animDone) {
        this.state = 'holding';
        this.stateEndTime = now + CRAPAUD_HOLD_DURATION;
      }
      return;
    }

    if (this.state === 'holding') {
      this.applyReachBody(CRAPAUD_FRAME_COUNT - 1);
      if (now >= this.stateEndTime) {
        this.state = 'retracting';
        this.anims.play(this.retractAnimKey, true);
      }
      return;
    }

    if (this.state === 'retracting') {
      this.applyReachBody(getCrapaudFrameIndex(this));
      const animDone = this.anims.currentAnim
        && this.anims.currentAnim.key === this.retractAnimKey
        && !this.anims.isPlaying;
      if (animDone) {
        this.state = 'idle';
        this.lastAttackEndTime = now;
      }
    }
  }

  // 1 PV : meurt en un coup de dague (cf. GDD section 6, même règle que
  // tous les autres ennemis).
  defeat() {
    if (this.defeated) return;
    this.defeated = true;
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: CRAPAUD_SCALE * 0.6,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}

if (typeof ENEMY_REGISTRY !== 'undefined') {
  ENEMY_REGISTRY.crapaud = (scene, e) => new Crapaud(scene, e.x, e.y);
}

// Compétence Crapaud, réutilisant les MÊMES frames/anims que l'ennemi
// ci-dessus (retour utilisateur : "le crapeau a pas été rajouter dans la
// liste des competence" -- c'était bien une compétence attendue, pas
// seulement un ennemi). Ajoutée ici (pas dans Player.js) parce que
// Crapaud.js charge APRÈS Player.js (cf. index.html) : SKILL_DEFS existe
// déjà à ce stade, donc une simple affectation suffit, sans dépendance
// dans l'autre sens. `ensureCrapaudAnimations` est aussi appelée depuis
// `ensurePlayerAnimations` dans Player.js (référence différée -- la
// fonction n'est *appelée* qu'au runtime, bien après que ce fichier ait
// fini de s'exécuter), pour que les anims existent même si aucun ennemi
// Crapaud n'apparaît jamais dans la zone où la compétence est utilisée.
//
// Contrairement à l'Ours, aucune planche de transformation séparée n'a
// été fournie : le SKILL_DEFS.ours a un `transitionAnimKey` qui montre
// Agarica progressivement se transformer AVANT son anim d'attaque propre.
// Ici, l'extension de la langue EST directement la "transformation" (bascule
// instantanée sur la silhouette Crapaud dès l'activation) ET l'attaque à
// la fois -- `transitionAnimKey`/`transitionOutAnimKey` réutilisent
// extend/retract, `animKey` n'a besoin que de tenir la pose figée à
// l'apogée (ANIM_CRAPAUD_HOLD_KEY) pendant la fenêtre de dégâts.
//
// `originX` : ce skill affiche les mêmes textures LARGES-MAIS-ALIGNÉES-À-
// GAUCHE que l'ennemi sur le sprite d'Agarica, dont l'origine est FIXE à
// (0.5, 1) tout le reste du temps (cf. Player.js) -- sans corriger
// l'origine pendant que ce skill est actif, son corps semblerait sauter
// sur le côté (même bug que celui déjà corrigé pour l'ennemi, cf.
// CRAPAUD_ORIGIN_X plus haut). `update()` dans Player.js doit donc
// appliquer CET originX pendant que le skill est actif, puis restaurer
// (0.5, 1) à la fin -- cf. le bloc dédié dans Player.js.
// `CRAPAUD_ORIGIN_X` passé explicitement : le canvas est aligné à GAUCHE
// (pas centré comme les autres formes), donc `transfoBodyConfig` a besoin de
// ce point d'ancrage pour poser la hitbox sur le corps réel plutôt que sur
// le centre du canvas (cf. commentaire sur `transfoBodyConfig` dans
// Player.js -- corrige "l'attaque du crapaud se téléporte dans le sol").
const CRAPAUD_SKILL_BODY = transfoBodyConfig(CRAPAUD_FRAME_WIDTH, CRAPAUD_FRAME_HEIGHT, CRAPAUD_SCALE, CRAPAUD_ORIGIN_X);
SKILL_DEFS.crapaud = {
  label: 'Crapaud — Langue',
  hudColor: 0x8c6a3a,
  cost: 30,
  // Fenêtre de dégâts : pendant la pause à l'apogée (la langue est à sa
  // portée max pile à ce moment-là).
  hitboxDurationMs: CRAPAUD_HOLD_DURATION,
  hitboxDelayMs: CRAPAUD_EXTEND_DURATION,
  attackDurationMs: CRAPAUD_HOLD_DURATION,
  transformDurationMs: CRAPAUD_EXTEND_DURATION * 2 + CRAPAUD_HOLD_DURATION,
  // Zone longue et fine devant Agarica (pas symétrique comme celle de
  // l'Ours) -- une langue qui fouette vers l'avant, pas un impact au sol
  // des deux côtés. Portée choisie pour rester dans l'ordre de grandeur de
  // l'allonge réelle de la langue à l'écran (cf. CRAPAUD_DETECTION_RANGE_X
  // côté ennemi).
  hitboxWidth: 240,
  hitboxHeight: 40,
  hitboxOffsetX: 120,
  transitionAnimKey: ANIM_CRAPAUD_EXTEND_KEY,
  transitionDurationMs: CRAPAUD_EXTEND_DURATION,
  transitionScale: CRAPAUD_SCALE,
  transitionBody: CRAPAUD_SKILL_BODY,
  transitionOutAnimKey: ANIM_CRAPAUD_RETRACT_KEY,
  animKey: ANIM_CRAPAUD_HOLD_KEY,
  scale: CRAPAUD_SCALE,
  body: CRAPAUD_SKILL_BODY,
  facesRight: true,
  originX: CRAPAUD_ORIGIN_X,
};
