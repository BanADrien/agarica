// Crapaud-piège ('crapaud_piege') — agent Ennemis.
//
// Décor tuable (demande utilisateur du 2026-11-08) : immobile, enfoncé dans le
// sol sous un dos de mousse et de cailloux, il passe pour un rocher moussu à un
// endroit stratégique (bord de saut, sous une liane, gardien d'un passage,
// près d'un trou). Quand Agarica passe à portée de langue, il SORT (0,22 s),
// gonfle la gorge en la visant (0,36 s, visée figée : on peut esquiver), tire
// la langue (y compris en diagonale vers le haut), reste exposé 0,9 s (la
// fenêtre pour le frapper) puis se renfonce, et se réarme 0,9 s plus tard.
// Il ne blesse JAMAIS au contact (`harmless`, comme l'araignée) : sa seule
// attaque est la langue, télégraphiée -- foncer dessus coûtait sinon un 2e
// cœur en traversant son corps juste après la langue (vérifié au banc).
// Enfoui, il est INVULNÉRABLE (retour des joueuses du 2026-11-09 : « qu'elle
// ne prenne pas de dégâts une fois dans le sol ») : le coup est paré (« tink »,
// cf. blocksHit / juiceOnBlockedHit dans LevelKit) et le réveille -- il sort
// et attaque. Vulnérable dès la 2e moitié de sa sortie, puis tant qu'il est
// dehors. On peut toujours rebondir sur son dos (pogo).
// Corrompu comme le sauteur (cf. CrapaudCorrompu.js) : le papillon le soigne,
// même caché, et dégage le passage sans le tuer.
//
// Apparence, tant que l'art n°12 (`crapaud_piege`) manque : la planche du
// crapaud corrompu, plus GROS que le sauteur (0,30 contre 0,24), teinté gris-
// mousse (pierre), avec un coussin de mousse, deux cailloux et des brins
// dessinés par code sur le dos (cf. ensureCrapaudPiegeMousse). Caché, l'image
// est enfoncée de CRAPAUD_PIEGE_SINK rangées (rognée sous le sol) : ne dépasse
// que le dos moussu et un œil mi-clos. Avec l'art n°12, ses poses `hidden` /
// `reveal` remplacent l'enfoncement et le décor dessiné.
const CRAPAUD_PIEGE_SCALE = 0.3;
// Rangées de la planche (237) enfoncées sous le sol quand il est caché : le
// haut visible commence vers la rangée 33 ; il en dépasse ~45 rangées (~13 px,
// plus la mousse), l'œil mi-clos au ras du sol. Moins enfoncé (127), on
// voyait toute la tête : un crapaud qui dépasse, pas un rocher.
const CRAPAUD_PIEGE_SINK = 159;
const CRAPAUD_PIEGE_REVEAL_MS = 220;
const CRAPAUD_PIEGE_EXPOSED_MS = 900;
const CRAPAUD_PIEGE_HIDE_MS = 320;
const CRAPAUD_PIEGE_REARM_MS = 900;
// Sortie déclenchée par un coup paré : un court instant d'abord, le temps
// que l'étincelle se lise.
const CRAPAUD_PIEGE_WAKE_MS = 200;
// Fraction de la sortie (0 -> 1) à partir de laquelle il peut être blessé.
const CRAPAUD_PIEGE_VULNERABLE_AT = 0.5;
// Teintes (multiplication) : pierre moussue sombre caché, plus claire sorti --
// il garde l'air d'un rocher, ce qui le distingue du sauteur vert toxique.
const CRAPAUD_PIEGE_TINT_HIDDEN = 0x6f7a66;
const CRAPAUD_PIEGE_TINT_OUT = 0xa9b59c;
const CRAPAUD_PIEGE_MOUSSE_KEY = 'crapaud-piege-mousse';
// Le coussin de mousse est dessiné dans les coordonnées de la planche (cadre
// `corps`, 300x237) : coin haut-gauche de sa texture dans ce cadre.
const CRAPAUD_PIEGE_MOUSSE_AT = [28, 0];
const CRAPAUD_PIEGE_MOUSSE_SIZE = [176, 140];

// Coussin de mousse BOMBÉ posé sur le dos (pente du dos mesurée sur la planche
// corrompue : x 45 -> rangée 114, x 175 -> rangée 44) : une rangée de touffes
// de tailles inégales qui débordent sur les flancs, éclairées en haut à gauche
// comme l'art, contour sombre ; deux cailloux, brins de fougère, points vert
// lunaire et lichen rose (palette du GDD). Une simple bande régulière se lisait
// comme une bûche posée sur le crapaud.
function ensureCrapaudPiegeMousse(scene) {
  if (scene.textures.exists(CRAPAUD_PIEGE_MOUSSE_KEY)) return CRAPAUD_PIEGE_MOUSSE_KEY;
  const [ox, oy] = CRAPAUD_PIEGE_MOUSSE_AT;
  // Haut du dos mesuré colonne par colonne (rangée du 1er pixel opaque) :
  // bombé, pas une droite -- une rangée droite flottait au-dessus du milieu.
  const contour = [[45, 114], [60, 97], [75, 81], [90, 74], [105, 65], [120, 61], [135, 55], [150, 52], [165, 41], [180, 44]];
  const backY = (x) => {
    for (let i = 1; i < contour.length; i++) {
      const [x0, y0] = contour[i - 1];
      const [x1, y1] = contour[i];
      if (x <= x1) return y0 + ((Math.max(x, x0) - x0) * (y1 - y0)) / (x1 - x0);
    }
    return contour[contour.length - 1][1];
  };
  const tufts = [];
  for (let i = 0; i < 12; i++) {
    const x = 48 + i * 11;
    // Rayons inégaux (bosses), plus gros au milieu du dos ; centre un peu SOUS
    // le contour : la mousse pousse sur le dos au lieu d'y être posée.
    const r = (8 + 10 * Math.sin((i / 11) * Math.PI)) * (0.8 + 0.35 * Math.abs(Math.sin(i * 2.3)));
    tufts.push([x, backY(x) + 5 - r * 0.2, r]);
  }
  const g = scene.add.graphics();
  const P = (x, y) => [x - ox, y - oy];
  // Passe par passe (contour, base, mi-ton, lumière) : un contour ne vient
  // jamais recouvrir la touffe voisine.
  const passes = [
    [0x141c16, (r) => r + 3, 0],
    [0x2c4a22, (r) => r, 0],
    [0x4e7a2e, (r) => r - 4, -2],
    [0x7fa84a, (r) => r * 0.37, -4],
  ];
  for (const [color, radius, d] of passes) {
    g.fillStyle(color, 1);
    for (const [x, y, r] of tufts) {
      const rr = radius(r);
      if (rr <= 0) continue;
      // Décalage vers le haut-gauche : lumière venue d'en haut à gauche.
      const [px, py] = P(x + d, y + d);
      g.fillCircle(px, py, rr);
    }
  }
  // Mèches qui pendent sur le flanc.
  g.fillStyle(0x2c4a22, 1);
  for (const [x, len] of [[58, 16], [84, 12], [112, 18], [140, 10]]) {
    const [px, py] = P(x, backY(x) + 10);
    g.fillEllipse(px, py + len / 2, 7, len);
  }
  // Cailloux (gris chaud, reflet en haut à gauche, contour sombre).
  for (const [x, y, rx, ry] of [[100, 56, 17, 12], [152, 40, 11, 8]]) {
    const [px, py] = P(x, y);
    g.fillStyle(0x141c16, 1).fillEllipse(px, py, rx * 2 + 6, ry * 2 + 6);
    g.fillStyle(0x6c675f, 1).fillEllipse(px, py, rx * 2, ry * 2);
    g.fillStyle(0x9a958c, 1).fillEllipse(px - rx * 0.3, py - ry * 0.35, rx, ry * 0.8);
  }
  // Brins de fougère : tige et deux petites feuilles.
  for (const [x, y, dx, dy] of [[66, 84, -8, -26], [124, 50, 2, -30], [133, 48, 12, -22], [168, 34, -5, -20]]) {
    const [px, py] = P(x, y);
    g.lineStyle(3, 0x6f9a3a, 1).beginPath().moveTo(px, py).lineTo(px + dx, py + dy).strokePath();
    g.fillStyle(0x8fbf4a, 1);
    g.fillEllipse(px + dx * 0.6 - 4, py + dy * 0.6, 8, 4);
    g.fillEllipse(px + dx * 0.8 + 4, py + dy * 0.8, 8, 4);
  }
  // Lueurs vert lunaire et lichen rose.
  g.fillStyle(0x8fe3b8, 1);
  for (const [x, y] of [[78, 70], [112, 56], [136, 50], [162, 36]]) { const [px, py] = P(x, y); g.fillCircle(px, py, 2.5); }
  g.fillStyle(0xff9fc9, 1);
  for (const [x, y] of [[62, 92], [126, 60], [104, 74]]) { const [px, py] = P(x, y); g.fillCircle(px, py, 3); }
  g.generateTexture(CRAPAUD_PIEGE_MOUSSE_KEY, CRAPAUD_PIEGE_MOUSSE_SIZE[0], CRAPAUD_PIEGE_MOUSSE_SIZE[1]);
  g.destroy();
  return CRAPAUD_PIEGE_MOUSSE_KEY;
}

class CrapaudPiege extends CrapaudCorrompu {
  constructor(scene, x, y, { hp = 2, facing, reach } = {}) {
    super(scene, x, y, {
      artId: 'crapaud_piege', scale: CRAPAUD_PIEGE_SCALE, bodyW: 56, bodyH: 38, hp,
      facing: facing === 'right' ? 1 : -1, reach: reach || 220, aimMs: 360,
    });
    // Ancré dans le sol : pas de sursaut quand on le frappe.
    this.knockY = 0;
    this.harmless = true;
    this.codeDecor = !this.look.n12;
    this.sinkMax = this.codeDecor ? CRAPAUD_PIEGE_SINK : 0;
    if (this.codeDecor) {
      ensureCrapaudPiegeMousse(scene);
      this.moss = scene.add.image(x, y, CRAPAUD_PIEGE_MOUSSE_KEY).setOrigin(0, 0);
      this.parts.push(this.moss);
    }
    this.rearmAt = 0;
    this.nextTell = 0;
    this.enterHidden(0);
  }

  // Teinte « pierre » : sombre caché, plus claire sorti (art n°12 : aucune).
  restoreTint() {
    if (this.healed || !this.codeDecor) { super.restoreTint(); return; }
    this.setTint(this.state === 'hidden' || this.state === 'hide' ? CRAPAUD_PIEGE_TINT_HIDDEN : CRAPAUD_PIEGE_TINT_OUT);
  }

  setSink(rows) {
    this.sink = Math.max(0, rows);
    this.applyLayout();
  }

  enterHidden(now) {
    this.state = 'hidden';
    this.stateAt = now;
    this.rearmAt = now + CRAPAUD_PIEGE_REARM_MS;
    this.setSink(this.sinkMax);
    this.setPose(this.look.n12 && this.look.hiddenFrames.length ? this.look.hiddenFrames[0] : this.look.shut);
    this.restoreTint();
  }

  startReveal(dir, now) {
    this.setFacing(dir);
    this.state = 'reveal';
    this.stateAt = now;
    this.stateEnd = now + CRAPAUD_PIEGE_REVEAL_MS;
    this.setPose(this.look.idle[0]);
    this.restoreTint();
    // Mousse et terre qui volent : il jaillit du sol.
    spawnFx(this.scene, 'land', this.x, this.body.bottom, { power: 0.9 });
    spawnFx(this.scene, 'leaves', this.x, this.body.bottom - 10, { count: 5, power: 0.6 });
    playSfx('crapaud_surgit');
  }

  startHide(now) {
    this.state = 'hide';
    this.stateAt = now;
    this.stateEnd = now + CRAPAUD_PIEGE_HIDE_MS;
    this.setPose(this.look.shut);
    this.restoreTint();
  }

  // Petit indice pour l'œil attentif : une bulle toxique monte de temps en
  // temps du « rocher » (pas de piège invisible, il se devine).
  tell(now) {
    if (now < this.nextTell) return;
    this.nextTell = now + Phaser.Math.Between(2200, 3600);
    const hx = this.x + this.facing * (205 - this.look.ox) * this.s;
    const dot = this.scene.add.image(hx, this.body.bottom - 6, FX_GLOW_DOT_KEY)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(CORRUPTION_TINT).setAlpha(0.6).setScale(0.14).setDepth(this.depth + 0.1);
    this.scene.tweens.add({ targets: dot, y: dot.y - 14, alpha: 0, scale: 0.05, duration: 900, ease: 'Sine.easeOut', onComplete: () => dot.destroy() });
    // Art n°12 : la 2e pose `hidden` (œil qui s'entrouvre) le temps de la bulle.
    const hid = this.look.hiddenFrames;
    if (this.look.n12 && hid.length > 1) {
      this.setPose(hid[1]);
      this.scene.time.delayedCall(320, () => { if (this.active && this.state === 'hidden') this.setPose(hid[0]); });
    }
  }

  think(player, now) {
    switch (this.state) {
      case 'hidden': {
        this.setVelocityX(0);
        this.tell(now);
        // Pas avant d'être posé (il tombe de quelques px à l'ouverture de la zone).
        if (now < this.rearmAt || !this.body.blocked.down) return;
        // Visée testée du côté d'Agarica : il se retourne en sortant.
        const dir = Math.sign(player.x - this.x) || this.facing;
        if (this.aimInfo(player, dir).ok) this.startReveal(dir, now);
        return;
      }
      case 'reveal': {
        const t = Phaser.Math.Clamp((now - this.stateAt) / CRAPAUD_PIEGE_REVEAL_MS, 0, 1);
        this.setSink(this.sinkMax * (1 - Phaser.Math.Easing.Back.Out(t)));
        const rev = this.look.revealFrames;
        if (rev.length) this.setPose(rev[Math.min(rev.length - 1, Math.floor(t * rev.length))]);
        if (t >= 1) {
          this.setSink(0);
          this.restoreTint();
          // Calmé pendant sa sortie (fin de dialogue) : il reste exposé sans viser.
          if (now < (this.calmUntil || 0)) this.onTongueDone(now);
          else this.startAim(player, now);
        }
        return;
      }
      case 'recover':
        // Exposé : bouche ouverte un instant, puis il respire (fenêtre de frappe).
        if (now - this.stateAt > 300) this.playIdle();
        if (now >= this.stateEnd) this.startHide(now);
        return;
      case 'hide': {
        const t = Phaser.Math.Clamp((now - this.stateAt) / CRAPAUD_PIEGE_HIDE_MS, 0, 1);
        this.setSink(this.sinkMax * Phaser.Math.Easing.Quadratic.In(t));
        if (t >= 1) this.enterHidden(now);
        return;
      }
      default:
    }
  }

  onCalm(now, ms) {
    this.rearmAt = Math.max(this.rearmAt, now + ms);
  }

  onTongueDone(now) {
    this.state = 'recover';
    this.stateAt = now;
    this.stateEnd = now + CRAPAUD_PIEGE_EXPOSED_MS;
  }

  // Enfoui (caché, en train de se cacher, ou dans la 1re moitié de sa sortie) :
  // aucun dégât. Contrat LevelKit (damageEnemy) : vrai = coup paré.
  blocksHit() {
    if (this.defeated || this.healed) return false;
    if (this.state === 'hidden' || this.state === 'hide') return true;
    if (this.state === 'reveal') {
      const now = this.scene.time.now;
      return (now - this.stateAt) / CRAPAUD_PIEGE_REVEAL_MS < CRAPAUD_PIEGE_VULNERABLE_AT;
    }
    return false;
  }

  // Coup paré : le « rocher » se réveille et sort vers Agarica.
  onBlockedHit() {
    if (this.state !== 'hidden' && this.state !== 'hide') return;
    const now = this.scene.time.now;
    const p = this.scene.player;
    const dir = p ? Math.sign(p.x - this.x) || this.facing : this.facing;
    this.startReveal(dir, now);
    this.stateAt = now + CRAPAUD_PIEGE_WAKE_MS;
    this.stateEnd = this.stateAt + CRAPAUD_PIEGE_REVEAL_MS;
  }

  // Frappé caché (appel direct de takeHit, hors damageEnemy) : il est
  // découvert et sort.
  onHurt(now) {
    if (this.state === 'hidden' || this.state === 'hide') {
      const p = this.scene.player;
      const dir = p ? Math.sign(p.x - this.x) || this.facing : this.facing;
      this.startReveal(dir, now);
      // Sa sortie démarre à la fin du sursaut du coup (stunnedUntil, pendant
      // lequel think() ne tourne pas) : sinon il resterait enfoncé 0,3 s puis
      // apparaîtrait d'un coup.
      this.stateAt = Math.max(now, this.stunnedUntil || now);
      this.stateEnd = this.stateAt + CRAPAUD_PIEGE_REVEAL_MS;
      return;
    }
    if (this.state === 'reveal') return;
    super.onHurt(now);
    // Un coup pendant le télégraphe le renvoie à sa fenêtre d'exposition.
    if (this.state === 'recover') this.stateEnd = now + CRAPAUD_PIEGE_EXPOSED_MS * 0.6;
  }

  // Caché : seule la partie qui dépasse du sol est frappable (et sert au
  // rebond) -- le dos (haut visible vers la rangée 33) PLUS le coussin de
  // mousse (~28 rangées au-dessus), soit ~22 px : le dos seul (13 px) passait
  // sous l'arc de la dague donné de côté.
  getMeleeBounds() {
    const b = this.body;
    const above = Math.max(8, (this.look.frameH - this.sink - 33 + (this.codeDecor ? 28 : 0)) * this.s);
    const h = Math.min(b.height, above);
    return new Phaser.Geom.Rectangle(b.x, b.bottom - h, b.width, h);
  }

  syncDecor() {
    // Caché ou en mouvement de cachette : sous la profondeur des personnages
    // (LookKit ne lui pose ni ombre ni liseré, qui le trahiraient).
    const hidden = this.state === 'hidden' || this.state === 'hide' || this.state === 'reveal';
    if (!this.defeated) crapaudSetDepth(this, hidden ? CHARACTER_DEPTH - 1 : CHARACTER_DEPTH);
    if (!this.moss || !this.moss.active) return;
    // Même transformation que le corps (cadre `corps` -> monde), retournée
    // avec lui ; l'écrasement de rendu (juice) n'est pas suivi, il est bref.
    const L = this.look;
    const [mx, my] = CRAPAUD_PIEGE_MOUSSE_AT;
    const f = this.facing;
    crapaudSetDepth(this.moss, this.depth + 0.02);
    this.moss.setScale(this.scaleX, this.scaleY).setFlipX(f < 0)
      .setOrigin(f < 0 ? 1 : 0, 0)
      .setPosition(this.x + f * (mx - L.ox) * this.s, this.y + (my - this.displayOriginY) * this.s)
      .setAlpha(this.alpha).setVisible(this.visible);
    // Rognée comme le corps quand il est enfoncé (la mousse ne flotte pas
    // au-dessus du sol pendant qu'il sort ou se cache).
    const cut = this.displayOriginY - my;
    if (this.sink > 0) this.moss.setCrop(0, 0, this.moss.frame.cutWidth, Math.max(0, cut));
    else if (this.moss.isCropped) this.moss.setCrop();
  }
  // Soin : celui de la base. La mousse reste sur le dos du crapaud guéri (même
  // animal) et le suit dans sa fuite : syncDecor tourne tant qu'il existe.
}

if (typeof ENEMY_REGISTRY !== 'undefined') {
  ENEMY_REGISTRY.crapaud_piege = (scene, e) => new CrapaudPiege(scene, e.x, e.y, { hp: e.hp ?? 2, facing: e.facing, reach: e.reach });
}
