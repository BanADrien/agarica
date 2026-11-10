// Boss "Gorille de pierre" (grand singe au casque de pierre, cristaux verts
// luminescents) : le seul ennemi du jeu avec une VRAIE machine d'états à
// patterns (marche / charge / frappe au sol / saut-fracas / cri de phase),
// plusieurs PV et deux phases -- tout le reste du bestiaire (Araignée,
// Loup, Corbeau, Crapaud) tient en une dizaine de lignes de logique, cf.
// leur fichier respectif. Art fourni par l'utilisateur dans
// assets/sprites/boss_gorille/ (8 animations, cf. le README/LIVRAISON.md
// de ce dossier).
//
// POURQUOI LES PLANCHES `sheets_ready/` ET PAS DES FRAMES INDIVIDUELLES :
// tout le reste du projet charge des PNG frame par frame parce que les
// planches sources ont des cellules irrégulières (cf. les scripts
// tools/crop_*.py). Ici la livraison contient déjà `sheets_ready/`, des
// planches à cellules PARFAITEMENT régulières (384x512, une ligne par
// animation, cf. animations.json) : `load.spritesheet` suffit, sans
// découpe. Bonus non négligeable : les dossiers
// `gorille_marche_frames/`/`gorille_charge_frames/` sont restés VIDES à la
// livraison (leur planche source `sheets/` a disparu, donc
// tools/prepare_gorille.py ne peut plus les regénérer) alors que leurs
// planches `sheets_ready/` sont bien là -- les charger depuis les planches
// est donc le seul chemin qui donne les 8 animations complètes.
const GORILLE_FRAME_WIDTH = 384;
const GORILLE_FRAME_HEIGHT = 512;
// Ligne de sol DANS le canvas (donnée par animations.json : le gorille n'est
// pas posé au bas de sa frame, il reste 40px de marge sous ses pieds pour
// les débris/l'onde de choc du saut) -- d'où une origine Y à 472/512 et non
// (0.5, 1) comme les autres entités, sinon le boss flotterait de 40px * son
// échelle au-dessus du sol.
const GORILLE_FLOOR_Y = 472;
const GORILLE_ORIGIN_Y = GORILLE_FLOOR_Y / GORILLE_FRAME_HEIGHT;
// Silhouette source ~255x300px (mesurée sur les bbox alpha des frames idle) :
// à 0.55 le boss fait ~140x165px à l'écran, soit environ le double
// d'Agarica (~45x83px, cf. HUMAN_SCALE/AGARICA_BODY_BBOX dans Player.js) --
// imposant mais entier à l'écran (540px de haut) même quand il saute.
const GORILLE_SCALE = 0.55;

// Clés de texture (une par animation, cf. BootScene.js) -- le nom de
// l'animation vient tel quel de animations.json.
const GORILLE_ANIMS = [
  { name: 'idle', frames: 4 },
  { name: 'marche', frames: 6 },
  { name: 'charge', frames: 6 },
  { name: 'attaque_frappe', frames: 5 },
  { name: 'attaque_saut', frames: 6 },
  { name: 'cri', frames: 4 },
  { name: 'degat', frames: 2 },
  { name: 'mort', frames: 5 },
];
const GORILLE_TEXTURE_PREFIX = 'gorille-';

// Hitbox physique : le canvas (384x512) est bien plus large que le gorille,
// et sa silhouette elle-même est large d'épaules/de bras -- une boîte à la
// largeur pleine de la silhouette (255) rendrait les coups du joueur
// touchables depuis trop loin. Valeurs en pixels SOURCE (Arcade les
// multiplie par l'échelle du sprite, cf. la même recette dans LoupAlpha.js).
const GORILLE_BODY_WIDTH = 150;
const GORILLE_BODY_HEIGHT = 280;
const GORILLE_BODY_OFFSET_X = (GORILLE_FRAME_WIDTH - GORILLE_BODY_WIDTH) / 2;
// Bas du corps physique = ligne de sol du canvas = les pieds = `this.y`
// (cf. GORILLE_ORIGIN_Y) : aucun décalage à rattraper entre le sprite
// affiché et la hitbox.
const GORILLE_BODY_OFFSET_Y = GORILLE_FLOOR_Y - GORILLE_BODY_HEIGHT;

// --- Vie / phases ---------------------------------------------------------
// Dérogation assumée à la règle "1 PV" du GDD (section 6), comme le Loup
// Alpha (cf. LoupAlpha.js) : un boss à patterns qui meurt au premier coup
// de dague n'aurait aucun pattern à montrer.
const GORILLE_MAX_HP = 10;
// Cri de rage à la moitié de la vie -> phase 2 (cf. GORILLE_PHASE2_*).
const GORILLE_PHASE2_HP = 5;
// Fenêtre d'invulnérabilité entre deux coups reçus : la détection de
// l'attaque du joueur est faite à CHAQUE frame (overlap physique générique
// dans LevelKit.js + test direct de la zone d'attaque plus bas), donc sans
// ce verrou un seul coup d'épée consommerait les 6 PV en 6 frames.
// Règle aussi le RYTHME du combat, pas seulement l'anti-double-comptage :
// c'est la cadence max à laquelle le boss peut perdre des PV. À 380ms, un
// joueur collé au boss qui martèle la touche d'attaque le vidait en ~3s
// (mesuré en combat scripté) -- 550ms laisse le temps aux patterns d'exister.
const GORILLE_HIT_COOLDOWN = 550;
// "Armure de boss" : seuls ces états peuvent être interrompus par un coup
// reçu. Sans ce filtre, un joueur collé au boss l'enchaîne en réaction de
// recul sans fin -- mesuré dans un combat scripté : 8 PV tombés en ~3s sans
// que le boss ait pu placer UNE SEULE attaque, puisque chaque coup relançait
// son animation de dégât. Touché pendant une attaque, il encaisse et
// continue (juste un flash blanc).
const GORILLE_STAGGER_STATES = new Set(['idle', 'marche']);
// ...et même là, pas deux reculs coup sur coup : sinon l'enchaînement
// revient dès que le joueur frappe pile entre deux actions.
const GORILLE_STAGGER_COOLDOWN = 1500;

// --- Vitesses / portées ---------------------------------------------------
const GORILLE_WALK_SPEED = 70;
const GORILLE_WALK_SPEED_P2 = 100;
const GORILLE_CHARGE_SPEED = 300;
const GORILLE_CHARGE_SPEED_P2 = 370;
// Temps d'arrêt après chaque action avant d'en choisir une autre : c'est
// LA fenêtre où le joueur place ses coups. Raccourcie en phase 2 (le boss
// devient plus pressant sans que rien d'autre ne change).
const GORILLE_RECOVERY = 600;
const GORILLE_RECOVERY_P2 = 330;
// Corps à corps -> frappe au sol ; à moyenne distance -> saut-fracas ; au
// loin -> charge. En phase 2 le saut porte bien plus loin (il peut traverser
// la moitié de l'arène pour retomber sur Agarica).
const GORILLE_FRAPPE_RANGE = 150;
const GORILLE_SAUT_RANGE = 420;
const GORILLE_SAUT_RANGE_P2 = 620;
// Durée max d'une marche avant de re-décider (sinon le boss pourrait
// marcher indéfiniment derrière un joueur qui recule à la même vitesse).
const GORILLE_WALK_MAX_DURATION = 1100;
// Durée max d'une charge (garde-fou : normalement elle se termine en
// atteignant une borne de patrouille ou en dépassant le joueur).
const GORILLE_CHARGE_MAX_DURATION = 1800;
// Distance de dépassement au-delà de laquelle la charge s'arrête (le boss
// freine après avoir traversé la position du joueur, il ne fait pas
// demi-tour instantanément).
const GORILLE_CHARGE_OVERSHOOT = 140;

// --- Saut-fracas ----------------------------------------------------------
const GORILLE_JUMP_VELOCITY = -780;
// Vitesse horizontale max pendant le saut : le boss VISE la position du
// joueur (cf. l'état 'saut' plus bas), mais sans pouvoir se téléporter d'un
// bout à l'autre de l'arène.
const GORILLE_JUMP_SPEED_MAX = 280;
// Onde de choc à l'atterrissage : part des deux côtés, basse et large.
// Sautable -- elle ne touche QUE si Agarica a les pieds au sol au moment de
// l'impact (cf. l'état 'impact'), ce qui en fait un vrai pattern à lire et
// pas un dégât inévitable.
const GORILLE_SHOCKWAVE_REACH = 230;
const GORILLE_SHOCKWAVE_HEIGHT = 62;
const GORILLE_SHOCKWAVE_DAMAGE_MS = 150;
const GORILLE_IMPACT_HOLD_MS = 230;
const GORILLE_RECOVER_FRAME_MS = 180;

// --- Frappe au sol --------------------------------------------------------
// Zone de dégât DEVANT le boss uniquement (contrairement à l'onde de choc
// du saut, qui part des deux côtés) : mesurée sur la frame d'impact, le
// poing dépasse d'environ 140px source (~76px à l'écran) du centre du
// corps -- élargie à 140px d'écran pour que la zone dangereuse corresponde
// visuellement à tout l'avant-bras et au nuage d'impact, pas juste au poing.
const GORILLE_FRAPPE_HITBOX = { startX: 10, width: 140, height: 90 };

// Séquences d'animation pilotées IMAGE PAR IMAGE plutôt que par une
// animation Phaser : les durées livrées dans animations.json ne sont pas
// uniformes (ex: frappe = 120/180/65/130/180 ms), et surtout les fenêtres de
// dégât doivent tomber pile sur une frame précise (l'impact). Un petit
// script {frame, durée} lu au temps écoulé donne exactement ça, sans
// dépendre du comportement de `duration` par frame côté Phaser.
// Les animations à durées UNIFORMES (idle/marche/charge) restent de vraies
// animations Phaser en boucle (cf. ensureGorilleAnimations).
function gorilleScript(name, pairs) {
  return {
    textureKey: `${GORILLE_TEXTURE_PREFIX}${name}`,
    pairs,
    total: pairs.reduce((sum, [, ms]) => sum + ms, 0),
  };
}
// Durées reprises telles quelles de assets/sprites/boss_gorille/animations.json.
const GORILLE_SCRIPTS = {
  frappe: gorilleScript('attaque_frappe', [[0, 120], [1, 180], [2, 65], [3, 130], [4, 180]]),
  cri: gorilleScript('cri', [[0, 140], [1, 150], [2, 350], [3, 180]]),
  degat: gorilleScript('degat', [[0, 100], [1, 160]]),
  mort: gorilleScript('mort', [[0, 180], [1, 160], [2, 140], [3, 180], [4, 800]]),
};
// Fenêtre de dégât de la frappe : frames 2 et 3 du script ci-dessus, soit
// l'impact lui-même et le poing encore au sol juste après (300ms -> 495ms).
const GORILLE_FRAPPE_DAMAGE_START = 120 + 180;
const GORILLE_FRAPPE_DAMAGE_END = GORILLE_FRAPPE_DAMAGE_START + 65 + 130;

function ensureGorilleAnimations(scene) {
  const idleKey = `${GORILLE_TEXTURE_PREFIX}idle-loop`;
  if (scene.anims.exists(idleKey)) return;
  // Seules les 3 animations à durée uniforme (cf. le commentaire sur
  // gorilleScript) : 220ms/frame pour idle, 110 pour la marche, 75 pour la
  // charge.
  const loops = [
    { name: 'idle', frames: 4, frameRate: 1000 / 220 },
    { name: 'marche', frames: 6, frameRate: 1000 / 110 },
    { name: 'charge', frames: 6, frameRate: 1000 / 75 },
  ];
  for (const { name, frames, frameRate } of loops) {
    scene.anims.create({
      key: `${GORILLE_TEXTURE_PREFIX}${name}-loop`,
      frames: scene.anims.generateFrameNumbers(`${GORILLE_TEXTURE_PREFIX}${name}`, { start: 0, end: frames - 1 }),
      frameRate,
      repeat: -1,
    });
  }
}

class BossGorille extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolMinX, patrolMaxX) {
    ensureGorilleAnimations(scene);
    super(scene, x, y, `${GORILLE_TEXTURE_PREFIX}idle`, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, GORILLE_ORIGIN_Y);
    this.setScale(GORILLE_SCALE);
    this.setCollideWorldBounds(false);
    this.body.setSize(GORILLE_BODY_WIDTH, GORILLE_BODY_HEIGHT);
    this.body.setOffset(GORILLE_BODY_OFFSET_X, GORILLE_BODY_OFFSET_Y);

    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;

    // Lu par le HUD (barre de vie de boss, cf. drawHud dans LevelKit.js) --
    // même contrat que LoupAlpha.js.
    this.isBoss = true;
    this.bossName = 'Gorille de pierre';
    this.maxHp = GORILLE_MAX_HP;
    this.hp = GORILLE_MAX_HP;
    this.phase = 1;
    this.defeated = false;
    this.dying = false;
    this.hitCooldownUntil = 0;
    this.staggerReadyAt = 0;

    // Le contact simple avec un boss de cette taille viderait les cœurs
    // d'Agarica rien qu'en s'approchant : ses dégâts passent UNIQUEMENT par
    // ses zones d'attaque (cf. getAttackHitbox/dealDamage plus bas). Seule
    // exception, la charge : là le contact fait mal (harmless repasse à
    // false le temps de la course, cf. l'état 'charge'). `harmless` est lu
    // par l'overlap générique de LevelKit.js -- même marqueur que
    // l'Araignée fixe.
    this.harmless = true;

    this.facing = -1;
    this.state = 'idle';
    this.stateStart = scene.time.now;
    this.stateDuration = GORILLE_RECOVERY;
    this.lastAction = null;
    this.script = null;
    this.scriptStart = 0;
    // Sous-état du saut-fracas ('windup' | 'air' | 'impact' | 'recover').
    this.jumpPhase = null;
    // Secousse de caméra de la frappe : une seule par frappe (cf.
    // updateFrappe).
    this.frappeShook = false;
    this.hasLeftGround = false;
    // Rectangle de dégât actif cette frame (null la plupart du temps) --
    // exposé par getAttackHitbox() pour l'affichage de debug (Shift+A).
    this.attackHitbox = null;
  }

  // --- Utilitaires d'état -------------------------------------------------

  setState_(state, duration = 0) {
    this.state = state;
    this.stateStart = this.scene.time.now;
    this.stateDuration = duration;
    return this;
  }

  elapsed(now) {
    return now - this.stateStart;
  }

  playScript(name) {
    this.script = GORILLE_SCRIPTS[name];
    this.scriptStart = this.scene.time.now;
    this.anims.stop();
    this.setTexture(this.script.textureKey, this.script.pairs[0][0]);
  }

  // Applique la frame correspondant au temps écoulé dans le script courant
  // et renvoie ce temps écoulé (ms).
  advanceScript(now) {
    const el = now - this.scriptStart;
    let acc = 0;
    for (const [frame, ms] of this.script.pairs) {
      acc += ms;
      if (el < acc) {
        this.setTexture(this.script.textureKey, frame);
        return el;
      }
    }
    const last = this.script.pairs[this.script.pairs.length - 1][0];
    this.setTexture(this.script.textureKey, last);
    return el;
  }

  showFrame(name, frame) {
    this.anims.stop();
    this.setTexture(`${GORILLE_TEXTURE_PREFIX}${name}`, frame);
  }

  faceToward(player) {
    this.facing = player.x >= this.x ? 1 : -1;
    // Art tourné vers la DROITE par défaut (cf. le README de la livraison).
    this.setFlipX(this.facing < 0);
  }

  get walkSpeed() {
    return this.phase === 2 ? GORILLE_WALK_SPEED_P2 : GORILLE_WALK_SPEED;
  }

  get chargeSpeed() {
    return this.phase === 2 ? GORILLE_CHARGE_SPEED_P2 : GORILLE_CHARGE_SPEED;
  }

  get recoveryMs() {
    return this.phase === 2 ? GORILLE_RECOVERY_P2 : GORILLE_RECOVERY;
  }

  get sautRange() {
    return this.phase === 2 ? GORILLE_SAUT_RANGE_P2 : GORILLE_SAUT_RANGE;
  }

  // --- Dégâts infligés ----------------------------------------------------

  // Toutes les zones de dégât du boss passent par ici : un simple
  // rectangle (espace monde) testé contre le corps physique RÉEL d'Agarica,
  // exactement comme la zone de compétence du joueur côté LevelKit.js. Pas
  // de corps physique dédié à créer/détruire pour une fenêtre de 150ms.
  dealDamage(player, rect) {
    this.attackHitbox = rect;
    if (player.isInvulnerable) return;
    const body = player.body;
    const playerRect = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
    if (Phaser.Geom.Intersects.RectangleToRectangle(rect, playerRect)) {
      player.hitByEnemy();
    }
  }

  frappeRect() {
    const { startX, width, height } = GORILLE_FRAPPE_HITBOX;
    const x = this.facing >= 0 ? this.x + startX : this.x - startX - width;
    return new Phaser.Geom.Rectangle(x, this.y - height, width, height);
  }

  shockwaveRect() {
    return new Phaser.Geom.Rectangle(
      this.x - GORILLE_SHOCKWAVE_REACH,
      this.y - GORILLE_SHOCKWAVE_HEIGHT,
      GORILLE_SHOCKWAVE_REACH * 2,
      GORILLE_SHOCKWAVE_HEIGHT,
    );
  }

  // Lu par drawCombatDebugOverlays (LevelKit.js) pour tracer la zone de
  // dégât du boss en même temps que celle du joueur (Shift+A) -- même nom
  // de méthode que côté Player.js.
  getAttackHitbox() {
    return this.attackHitbox;
  }

  // --- Dégâts reçus -------------------------------------------------------

  // Appelée par l'overlap générique de LevelKit.js (coup de dague/compétence
  // au contact) ET par Feather.js (plume tirée en forme Aigle) : `takeHit`
  // existe -> le boss encaisse au lieu de mourir d'un coup.
  // Renvoie `true` si le coup a bien été encaissé, `false` s'il a été
  // ignoré (anti-rebond ou invulnérabilité) -- contrat lu par damageEnemy()
  // dans LevelKit.js pour ne créditer l'énergie du joueur qu'une fois par
  // coup réel.
  takeHit() {
    if (this.defeated || this.dying) return false;
    const now = this.scene.time.now;
    // Invulnérable pendant le cri de rage (changement de phase) : une
    // fenêtre de récompense pour le joueur serait plus lisible, mais c'est
    // surtout la seule façon d'éviter qu'un boss touché en plein cri
    // enchaîne cri -> dégât -> cri sans jamais finir son animation.
    if (this.state === 'cri') return false;
    if (now < this.hitCooldownUntil) return false;
    this.hitCooldownUntil = now + GORILLE_HIT_COOLDOWN;

    this.hp -= 1;
    if (this.hp <= 0) {
      this.die();
      return true;
    }

    if (this.hp <= GORILLE_PHASE2_HP && this.phase === 1) {
      this.enterPhase2();
      return true;
    }

    // Réaction de recul : seulement au sol, hors attaque (cf.
    // GORILLE_STAGGER_STATES) et pas deux fois de suite (cf.
    // GORILLE_STAGGER_COOLDOWN). Interrompre une attaque en cours casserait
    // en plus sa trajectoire physique pendant un saut (il resterait suspendu
    // sans jamais poser son onde de choc). Dans tous les autres cas, le flash
    // blanc seul signale que le coup a bien porté.
    this.flashHit();
    if (this.body.onFloor() && GORILLE_STAGGER_STATES.has(this.state) && now >= this.staggerReadyAt) {
      this.staggerReadyAt = now + GORILLE_STAGGER_COOLDOWN;
      this.setVelocityX(-this.facing * 90);
      this.playScript('degat');
      this.setState_('degat', GORILLE_SCRIPTS.degat.total);
    }
    return true;
  }

  // La dague d'Agarica porte bien plus loin que son propre corps (cf.
  // AGARICA_ATTACK_REACH_RAW dans Player.js), alors que l'overlap générique
  // de LevelKit.js ne déclenche le coup que quand les deux CORPS PHYSIQUES
  // se touchent : contre un boss large de 80px, il faudrait littéralement
  // rentrer dedans (donc encaisser sa frappe) pour le blesser, alors que la
  // lame le balaie déjà largement. Ce test supplémentaire, à la vraie portée
  // de l'attaque, reste LOCAL au boss -- l'équilibrage des ennemis normaux
  // (qui se tuent au contact) n'est pas touché. Comparé au corps physique du
  // boss et non à `getBounds()`, qui couvrirait tout son canvas 384x512, y
  // compris les 40px de vide sous ses pieds.
  checkPlayerMelee(player) {
    const hitbox = player.getAttackHitbox();
    if (!hitbox) return;
    const b = this.body;
    const bossRect = new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(hitbox, bossRect)) return;
    if (this.takeHit()) player.gainEnergy(ENERGY_PER_HIT);
  }

  flashHit() {
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => {
      if (this.active) this.clearTint();
    });
  }

  enterPhase2() {
    this.phase = 2;
    this.setVelocityX(0);
    this.playScript('cri');
    this.setState_('cri', GORILLE_SCRIPTS.cri.total);
    this.scene.cameras.main.shake(GORILLE_SCRIPTS.cri.total, 0.006);
    // Les cristaux verts "s'intensifient" au cri (cf. le README de la
    // livraison) : teinte verte pulsée le temps de l'animation, puis retour
    // à l'art d'origine -- pas de teinte permanente, qui délaverait tout le
    // pelage blanc du boss pour le reste du combat.
    this.scene.tweens.addCounter({
      from: 0, to: 1, duration: GORILLE_SCRIPTS.cri.total / 2, yoyo: true,
      onUpdate: (tween) => {
        if (!this.active) return;
        const v = tween.getValue();
        const g = 0xff;
        const rb = Math.round(0xff - 0x60 * v);
        this.setTint((rb << 16) | (g << 8) | rb);
      },
      onComplete: () => { if (this.active) this.clearTint(); },
    });
  }

  die() {
    if (this.dying) return;
    this.dying = true;
    this.setVelocityX(0);
    this.attackHitbox = null;
    this.harmless = true;
    this.playScript('mort');
    this.setState_('mort', GORILLE_SCRIPTS.mort.total);
    this.scene.cameras.main.shake(400, 0.008);
  }

  // `defeated` n'est posé qu'à la FIN de l'animation de mort (cf. update) :
  // une scène qui surveille la défaite du boss pour enchaîner (cf.
  // BossGorilleScene.js) laisse ainsi l'effondrement se jouer en entier.
  // Appelée directement par le chemin "1 PV" générique de LevelKit.js
  // (compétence du joueur) : redirigée vers takeHit() pour que le boss ne
  // meure pas d'un coup, comme LoupAlpha.
  defeat() {
    this.takeHit();
  }

  // --- Boucle ------------------------------------------------------------

  update(player) {
    if (this.defeated) return;
    const now = this.scene.time.now;
    // Remis à zéro à chaque frame : seuls les états qui ouvrent une fenêtre
    // de dégât le repositionnent (cf. dealDamage).
    this.attackHitbox = null;

    if (!this.dying) this.checkPlayerMelee(player);

    if (this.state === 'mort') {
      this.advanceScript(now);
      if (this.elapsed(now) >= this.stateDuration) {
        this.defeated = true;
        this.body.enable = false;
      }
      return;
    }

    switch (this.state) {
      case 'idle': this.updateIdle(player, now); break;
      case 'marche': this.updateMarche(player, now); break;
      case 'charge': this.updateCharge(player, now); break;
      case 'frappe': this.updateFrappe(player, now); break;
      case 'saut': this.updateSaut(player, now); break;
      case 'cri': this.updateCri(now); break;
      case 'degat': this.updateDegat(now); break;
    }

    // Garde-fou commun : jamais au-delà de son arène (le boss ne sort pas
    // de la salle, y compris en fin de charge ou de saut).
    if (this.x < this.patrolMinX) this.setX(this.patrolMinX);
    else if (this.x > this.patrolMaxX) this.setX(this.patrolMaxX);
  }

  // Temps mort (respiration) puis choix de la prochaine action selon la
  // distance -- c'est tout le "pattern" du boss, volontairement lisible
  // plutôt qu'aléatoire : collé à lui -> frappe au sol, à moyenne distance
  // -> saut-fracas, au loin -> charge. `lastAction` évite juste de répéter
  // deux fois de suite la même attaque à distance (sans elle, un joueur qui
  // garde la même distance verrait la même animation en boucle).
  updateIdle(player, now) {
    this.setVelocityX(0);
    this.anims.play(`${GORILLE_TEXTURE_PREFIX}idle-loop`, true);
    this.faceToward(player);
    if (this.elapsed(now) < this.stateDuration) return;

    const dist = Math.abs(player.x - this.x);
    if (dist < GORILLE_FRAPPE_RANGE) {
      this.startFrappe();
    } else if (dist < this.sautRange) {
      if (this.lastAction === 'saut') this.startMarche();
      else this.startSaut(player);
    } else if (this.lastAction === 'charge') {
      this.startMarche();
    } else {
      this.startCharge(player);
    }
  }

  startMarche() {
    this.lastAction = 'marche';
    this.setState_('marche', GORILLE_WALK_MAX_DURATION);
  }

  updateMarche(player, now) {
    this.faceToward(player);
    this.setVelocityX(this.facing * this.walkSpeed);
    this.anims.play(`${GORILLE_TEXTURE_PREFIX}marche-loop`, true);
    const dist = Math.abs(player.x - this.x);
    // Arrivé au contact : enchaîne directement sur la frappe, sans repasser
    // par un temps mort (un boss qui s'arrête pile devant le joueur pour
    // souffler ne ferait jamais peur).
    if (dist < GORILLE_FRAPPE_RANGE) {
      this.startFrappe();
      return;
    }
    const blocked = (this.facing < 0 && this.x <= this.patrolMinX)
      || (this.facing > 0 && this.x >= this.patrolMaxX);
    if (blocked || this.elapsed(now) >= this.stateDuration) {
      this.setVelocityX(0);
      this.setState_('idle', this.recoveryMs);
    }
  }

  startCharge(player) {
    this.lastAction = 'charge';
    this.faceToward(player);
    this.chargeFromX = this.x;
    this.setState_('charge', GORILLE_CHARGE_MAX_DURATION);
    // SEUL moment où le contact avec le boss blesse (cf. `harmless` dans le
    // constructeur) : une masse de pierre lancée à pleine vitesse.
    this.harmless = false;
  }

  updateCharge(player, now) {
    this.setVelocityX(this.facing * this.chargeSpeed);
    this.anims.play(`${GORILLE_TEXTURE_PREFIX}charge-loop`, true);
    const dx = (player.x - this.x) * this.facing;
    const atBound = (this.facing < 0 && this.x <= this.patrolMinX + 4)
      || (this.facing > 0 && this.x >= this.patrolMaxX - 4);
    // S'arrête en atteignant le mur, après avoir dépassé le joueur d'une
    // bonne longueur, ou au bout du garde-fou de durée.
    if (atBound || dx < -GORILLE_CHARGE_OVERSHOOT || this.elapsed(now) >= this.stateDuration) {
      this.setVelocityX(0);
      this.harmless = true;
      // Freinage marqué contre le mur (et petite secousse) : lisible comme
      // une ouverture, c'est le bon moment pour frapper le boss.
      if (atBound) this.scene.cameras.main.shake(160, 0.005);
      this.setState_('idle', this.recoveryMs);
    }
  }

  startFrappe() {
    this.lastAction = 'frappe';
    this.setVelocityX(0);
    this.playScript('frappe');
    this.setState_('frappe', GORILLE_SCRIPTS.frappe.total);
  }

  updateFrappe(player, now) {
    this.setVelocityX(0);
    const el = this.advanceScript(now);
    if (el >= GORILLE_FRAPPE_DAMAGE_START && el < GORILLE_FRAPPE_DAMAGE_END) {
      this.dealDamage(player, this.frappeRect());
    }
    // Secousse pile à l'impact (une seule fois, d'où le flag).
    if (!this.frappeShook && el >= GORILLE_FRAPPE_DAMAGE_START) {
      this.frappeShook = true;
      this.scene.cameras.main.shake(140, 0.004);
    }
    if (el >= this.stateDuration) {
      this.frappeShook = false;
      this.setState_('idle', this.recoveryMs);
    }
  }

  // Saut-fracas : le seul état piloté par la PHYSIQUE et pas par le temps
  // (l'onde de choc doit partir à l'atterrissage RÉEL, pas à une date
  // calculée d'avance -- le boss peut retomber plus tôt sur une plateforme
  // ou plus tard dans un creux).
  startSaut(player) {
    this.lastAction = 'saut';
    this.faceToward(player);
    this.setVelocityX(0);
    this.jumpPhase = 'windup';
    this.hasLeftGround = false;
    this.showFrame('attaque_saut', 0);
    this.setState_('saut', 0);
  }

  updateSaut(player, now) {
    const el = this.elapsed(now);

    if (this.jumpPhase === 'windup') {
      // Anticipation : frames 0 puis 1 de la planche (160 + 90ms), à
      // l'arrêt -- la fenêtre où le joueur voit le saut venir.
      this.setVelocityX(0);
      this.showFrame('attaque_saut', el < 160 ? 0 : 1);
      if (el >= 250) {
        this.faceToward(player);
        // Vise la position du joueur : durée de vol ~ 2*v/g, d'où la
        // vitesse horizontale nécessaire pour retomber dessus (bornée, cf.
        // GORILLE_JUMP_SPEED_MAX).
        const gravityY = this.scene.physics.world.gravity.y;
        const airtime = (2 * -GORILLE_JUMP_VELOCITY) / gravityY;
        const needed = (player.x - this.x) / airtime;
        this.setVelocityY(GORILLE_JUMP_VELOCITY);
        this.setVelocityX(Phaser.Math.Clamp(needed, -GORILLE_JUMP_SPEED_MAX, GORILLE_JUMP_SPEED_MAX));
        this.jumpPhase = 'air';
        this.setState_('saut', 0);
      }
      return;
    }

    if (this.jumpPhase === 'air') {
      // Frame 2 = corps ramassé en montée, frame 3 = retombée bras en avant.
      this.showFrame('attaque_saut', this.body.velocity.y < 0 ? 2 : 3);
      if (!this.body.onFloor()) this.hasLeftGround = true;
      // `hasLeftGround` : `onFloor()` est encore vrai la frame où la
      // vitesse verticale vient d'être appliquée -- sans ce verrou,
      // l'impact se déclencherait instantanément, au sol, sans aucun saut.
      if (this.hasLeftGround && this.body.onFloor()) {
        this.setVelocityX(0);
        this.jumpPhase = 'impact';
        this.showFrame('attaque_saut', 4);
        this.scene.cameras.main.shake(260, 0.012);
        this.setState_('saut', 0);
      }
      return;
    }

    if (this.jumpPhase === 'impact') {
      // Frame 4 = fracas au sol + onde de choc + débris. Ne touche QUE si
      // Agarica est au sol : l'onde est sautable (cf.
      // GORILLE_SHOCKWAVE_*).
      this.setVelocityX(0);
      this.showFrame('attaque_saut', 4);
      if (el < GORILLE_SHOCKWAVE_DAMAGE_MS) {
        const rect = this.shockwaveRect();
        this.attackHitbox = rect;
        if (player.body.onFloor()) this.dealDamage(player, rect);
      }
      if (el >= GORILLE_IMPACT_HOLD_MS) {
        this.jumpPhase = 'recover';
        this.setState_('saut', 0);
      }
      return;
    }

    // 'recover' : frame 5 (retour en position), puis temps mort normal.
    this.showFrame('attaque_saut', 5);
    if (el >= GORILLE_RECOVER_FRAME_MS) {
      this.jumpPhase = null;
      this.setState_('idle', this.recoveryMs);
    }
  }

  updateCri(now) {
    this.setVelocityX(0);
    this.advanceScript(now);
    if (this.elapsed(now) >= this.stateDuration) {
      // Enchaîne directement sur une charge : le cri annonce la phase 2, la
      // charge la fait sentir tout de suite.
      this.lastAction = 'cri';
      this.setState_('idle', 200);
    }
  }

  updateDegat(now) {
    this.advanceScript(now);
    if (this.elapsed(now) >= this.stateDuration) {
      this.setVelocityX(0);
      this.setState_('idle', this.recoveryMs);
    }
  }
}
