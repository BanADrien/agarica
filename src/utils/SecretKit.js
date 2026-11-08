// ============================================================================
// SecretKit.js -- secrets et récompenses (vague 3, 2026-11-08). Chargé juste
// après StoryKit.js. Contrat : docs/production/PLAN_DEV.md, section « Secrets,
// récompenses, marchand, quêtes ».
//   1. Éclats de lune (la monnaie) : compte sauvegardé, compteur discret à
//      côté des cœurs, éclats physiques qui sautent puis sont aspirés, butin
//      des ennemis vaincus.
//   2. Cœurs entiers : +1 cœur maximum, vie pleine, sauvegardé.
//   3. Contenus (coffres, trésors, quêtes, boutique) : secretGrantContents.
//   4. Coffres (`chests`) et trésors posés (`treasures`).
//   5. Murs et sols cassables (`breakables`).
//   6. Boutique : openShop / shopBuy (ShopScene.js, table SHOPS dans
//      src/data/shops_data.js).
// Tout s'affiche aussi sans art : images du manifeste si elles existent,
// sinon dessinées par code (STORY_DRAWN_ITEMS).
// ============================================================================

// ---------------------------------------------------------------------------
// Images dessinées (repli sans art Codex) : éclat, coffres, cœur entier.
// ---------------------------------------------------------------------------
Object.assign(STORY_DRAWN_ITEMS, {
  // Cristal de lune : losange allongé à facettes, reflet rose (le tatouage).
  eclat_lune: {
    w: 40, h: 56, scale: 0.36,
    draw(ctx, w, h) {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#f4fbff');
      grad.addColorStop(0.5, '#a9e8ff');
      grad.addColorStop(1, '#6fb8dc');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#1a1030';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 3); ctx.lineTo(w - 5, h * 0.42); ctx.lineTo(w * 0.55, h - 3); ctx.lineTo(5, h * 0.5);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.moveTo(w * 0.5, 7); ctx.lineTo(w * 0.6, h * 0.45); ctx.lineTo(11, h * 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffb3d9';
      ctx.beginPath(); ctx.arc(w * 0.66, h * 0.62, 3.5, 0, Math.PI * 2); ctx.fill();
    },
  },
  // Coffre de bois sombre cerclé de vert lunaire, serrure en gemme rose.
  coffre_ferme: {
    w: 100, h: 78, scale: 0.5,
    draw(ctx, w, h) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#140c1c';
      ctx.fillStyle = '#5a3a26';
      ctx.fillRect(8, 30, w - 16, h - 36); ctx.strokeRect(8, 30, w - 16, h - 36);
      ctx.fillStyle = '#6d4a30';
      ctx.beginPath(); ctx.moveTo(6, 32); ctx.quadraticCurveTo(w / 2, 2, w - 6, 32); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8fe3b8';
      for (const x of [20, w - 26]) { ctx.fillRect(x, 14, 6, h - 22); ctx.strokeRect(x, 14, 6, h - 22); }
      ctx.fillRect(8, 30, w - 16, 5);
      ctx.fillStyle = '#ff6fa8';
      ctx.beginPath(); ctx.moveTo(w / 2, 26); ctx.lineTo(w / 2 + 8, 38); ctx.lineTo(w / 2, 50); ctx.lineTo(w / 2 - 8, 38); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(w / 2 - 3, 32, 3, 5);
    },
  },
  coffre_ouvert: {
    w: 100, h: 92, scale: 0.5,
    draw(ctx, w, h) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#140c1c';
      // Couvercle rabattu en arrière.
      ctx.fillStyle = '#4e321f';
      ctx.beginPath(); ctx.moveTo(10, 46); ctx.lineTo(16, 6); ctx.lineTo(w - 16, 6); ctx.lineTo(w - 10, 46); ctx.closePath(); ctx.fill(); ctx.stroke();
      // Lueur de l'intérieur.
      const glow = ctx.createLinearGradient(0, 40, 0, 60);
      glow.addColorStop(0, '#fff6c2'); glow.addColorStop(1, '#8fe3b8');
      ctx.fillStyle = glow;
      ctx.fillRect(10, 42, w - 20, 12);
      ctx.fillStyle = '#5a3a26';
      ctx.fillRect(8, 50, w - 16, h - 56); ctx.strokeRect(8, 50, w - 16, h - 56);
      ctx.fillStyle = '#8fe3b8';
      for (const x of [20, w - 26]) { ctx.fillRect(x, 50, 6, h - 56); ctx.strokeRect(x, 50, 6, h - 56); }
    },
  },
  // Cœur entier : cœur rose framboise ceint d'une liane vert lunaire.
  coeur_entier: {
    w: 90, h: 84, scale: 0.4,
    draw(ctx, w, h) {
      const heart = (s) => {
        ctx.beginPath();
        ctx.moveTo(w / 2, h * 0.86 * s + h * (1 - s) * 0.5);
        ctx.bezierCurveTo(w * (0.5 - 0.62 * s), h * (0.5 + 0.02 * s), w * (0.5 - 0.42 * s), h * (0.5 - 0.48 * s), w / 2, h * (0.5 - 0.22 * s));
        ctx.bezierCurveTo(w * (0.5 + 0.42 * s), h * (0.5 - 0.48 * s), w * (0.5 + 0.62 * s), h * (0.5 + 0.02 * s), w / 2, h * 0.86 * s + h * (1 - s) * 0.5);
        ctx.closePath();
      };
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#8fe3b8';
      heart(1); ctx.stroke();
      ctx.fillStyle = '#e0346a';
      ctx.strokeStyle = '#1a0c18';
      ctx.lineWidth = 3;
      heart(0.86); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,209,225,0.9)';
      ctx.beginPath(); ctx.ellipse(w * 0.36, h * 0.36, 7, 5, -0.6, 0, Math.PI * 2); ctx.fill();
    },
  },
});

// État de la visite (remis à zéro à chaque construction de zone, cf.
// secretPrepareGroundCells appelée par buildLevelFromData).
function secretState(scene) {
  if (!scene.__secret || scene.__secret.visit !== scene.__storyVisit) {
    scene.__secret = {
      visit: scene.__storyVisit,
      breakables: [], chests: [], treasures: [], shards: [], shardGroup: null,
      hud: null, refuseToastShown: new Set(),
    };
  }
  return scene.__secret;
}

// Scène de zone où poser l'effet (la boutique ou le sac n'ont pas de joueur).
function secretLevelScene(scene) {
  if (scene && scene.player && scene.player.active) return scene;
  return typeof currentLevelScene !== 'undefined' && currentLevelScene && currentLevelScene.player ? currentLevelScene : null;
}

// ---------------------------------------------------------------------------
// 1. Éclats de lune
// ---------------------------------------------------------------------------
// Registre `eclats` (nombre). Une vieille sauvegarde n'en a pas : 0.
const ECLATS_KEY = 'eclats';
// Butin par type d'ennemi (de la donnée) : nombre fixe ou [min, max]. Une
// entrée de `enemies` peut le régler pour elle seule : `eclats: 0 | n | [a, b]`.
const ECLATS_ENEMY_DROPS = {
  default: [1, 2],
  loup: [1, 3], corbeau: [1, 2], crapaud: [1, 2], araignee: 0,
  mousse_creature: [1, 2], singe_corrompu: [2, 3],
  crapaud_sauteur: [2, 3], crapaud_corrompu: [2, 3], crapaud_piege: [2, 3],
  loupAlpha: [6, 8],
};
// Ennemi corrompu SOIGNÉ par le papillon : aucun éclat (choix du 2026-11-08).
// Le soin le rend à la forêt, il s'enfuit vivant : rien à ramasser sur lui.
// Et la nuée purifie plusieurs créatures d'un coup, sans risque : avec un
// butin, ce serait la façon la plus rentable de « récolter », pas un choix de
// cœur. Le soin reste récompensé par l'histoire, pas par la bourse.
const ECLATS_HEALED_DROP = 0;
// Éclat physique : taille à l'écran (px de haut), délai avant d'être aspiré,
// rayon d'aspiration (autour de la poitrine d'Agarica), vitesse d'aspiration.
const ECLATS_SIZE = 15;
const ECLATS_MAX_PIECES = 12;
const ECLATS_PICKUP_DELAY_MS = 380;
const ECLATS_MAGNET_RANGE = 120;
const ECLATS_MAGNET_ACCEL = 2600;
const ECLATS_MAGNET_MAX = 950;
const ECLATS_COLLECT_DIST = 18;
// Compteur du HUD : à droite des cœurs, visible quand le total change puis
// effacé (ECLATS_HUD_HOLD_MS, fondu ECLATS_HUD_FADE_MS).
const ECLATS_HUD_GAP = 14;
const ECLATS_HUD_ICON = 18;
const ECLATS_HUD_HOLD_MS = 2400;
const ECLATS_HUD_FADE_MS = 600;

function eclatsCount() {
  const n = storyGet(ECLATS_KEY, 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

// Ajoute `n` éclats au compte (sauvegardé) ; le compteur du HUD les montre.
function eclatsAdd(scene, n) {
  const add = Math.round(n);
  if (!(add > 0)) return eclatsCount();
  const total = eclatsCount() + add;
  storySet(ECLATS_KEY, total);
  eclatsHudBump(scene, add);
  return total;
}

// Dépense `n` éclats : faux (rien de retiré) s'il n'y en a pas assez.
function eclatsSpend(scene, n) {
  const cost = Math.max(0, Math.round(n));
  if (eclatsCount() < cost) return false;
  storySet(ECLATS_KEY, eclatsCount() - cost);
  eclatsHudBump(scene, -cost);
  return true;
}

function eclatTextureKey(scene) {
  if (scene.textures.exists('item-eclat_lune')) return 'item-eclat_lune';
  return storyDrawnItemKey(scene, 'eclat_lune');
}

// Compteur du HUD (créé une fois par visite, à côté du dernier cœur).
function eclatsHud(scene) {
  const st = secretState(scene);
  if (st.hud && st.hud.c.scene) return st.hud;
  const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(1001).setAlpha(0);
  c.lookRole = 'ui';
  const icon = scene.add.image(0, 0, eclatTextureKey(scene));
  icon.setScale(ECLATS_HUD_ICON / icon.height);
  const text = scene.add.text(ECLATS_HUD_ICON * 0.6, 0, '0', {
    fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#e6f7ff', stroke: '#15101f', strokeThickness: 3,
  }).setOrigin(0, 0.5);
  const delta = scene.add.text(0, 0, '', {
    fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#9fe8ff', stroke: '#15101f', strokeThickness: 3,
  }).setOrigin(0, 0.5).setAlpha(0);
  c.add([icon, text, delta]);
  // Comme le HUD : bulles et invites ne se posent pas dessous (tant qu'il est visible).
  if (typeof worldUiAddScreenObstacle === 'function') worldUiAddScreenObstacle(c);
  st.hud = { c, icon, text, delta, hideEvent: null };
  return st.hud;
}

// Le total a changé : le compteur apparaît (avec « +n » / « −n »), puis s'efface.
function eclatsHudBump(scene, deltaN = 0) {
  const lvl = secretLevelScene(scene);
  if (!lvl || !lvl.hudGraphics || !lvl.player) return;
  const h = eclatsHud(lvl);
  const hearts = Math.max(1, lvl.player.maxHearts || 1);
  h.c.setPosition(HUD_MARGIN + hearts * (HUD_HEART_SIZE + HUD_HEART_GAP) + ECLATS_HUD_GAP, HUD_MARGIN + HUD_HEART_SIZE / 2);
  h.text.setText(String(eclatsCount()));
  lvl.tweens.killTweensOf([h.c, h.text, h.delta]);
  h.c.setAlpha(Math.max(h.c.alpha, 0.01));
  lvl.tweens.add({ targets: h.c, alpha: 1, duration: 150 });
  h.text.setScale(1.25);
  lvl.tweens.add({ targets: h.text, scale: 1, duration: 220, ease: 'Back.Out' });
  if (deltaN) {
    h.delta.setText(deltaN > 0 ? `+${deltaN}` : `−${-deltaN}`).setColor(deltaN > 0 ? '#9fe8ff' : '#ffb3c9');
    h.delta.setPosition(h.text.x + h.text.width + 6, 0).setAlpha(1);
    lvl.tweens.add({ targets: h.delta, alpha: 0, y: -6, duration: 900, delay: 500, onComplete: () => h.delta.setY(0) });
  }
  if (h.hideEvent) h.hideEvent.remove(false);
  h.hideEvent = lvl.time.delayedCall(ECLATS_HUD_HOLD_MS, () => {
    h.hideEvent = null;
    if (h.c.scene) lvl.tweens.add({ targets: h.c, alpha: 0, duration: ECLATS_HUD_FADE_MS });
  });
}

// Groupe physique des éclats de la visite : un seul collider avec le sol.
function eclatsGroup(scene) {
  const st = secretState(scene);
  if (!st.shardGroup) {
    st.shardGroup = scene.physics.add.group();
    scene.physics.add.collider(st.shardGroup, scene.ground);
    if (scene.__story && scene.__story.mossGroup) scene.physics.add.collider(st.shardGroup, scene.__story.mossGroup);
  }
  return st.shardGroup;
}

// Fait jaillir `total` éclats de (x, y) : au plus ECLATS_MAX_PIECES morceaux
// (un gros éclat vaut plusieurs). `upward` : force du jet (1 = normal).
function eclatsSpawn(scene, x, y, total, { upward = 1, spread = 1 } = {}) {
  const lvl = secretLevelScene(scene);
  const n = Math.round(total);
  if (!(n > 0)) return;
  if (!lvl || !lvl.ground) {
    eclatsAdd(scene, n);
    return;
  }
  const pieces = Math.min(n, ECLATS_MAX_PIECES);
  const base = Math.floor(n / pieces);
  const extra = n % pieces;
  const key = eclatTextureKey(lvl);
  const group = eclatsGroup(lvl);
  const st = secretState(lvl);
  for (let i = 0; i < pieces; i++) {
    const value = base + (i < extra ? 1 : 0);
    const s = group.create(x + Phaser.Math.Between(-6, 6), y + Phaser.Math.Between(-4, 4), key);
    const size = ECLATS_SIZE * (1 + Math.min(0.7, (value - 1) * 0.15));
    s.setScale(size / s.height);
    s.setDepth(CHARACTER_DEPTH - 1);
    s.lookRole = 'prop';
    s.body.setSize(s.width * 0.7, s.height * 0.7);
    s.setBounce(0.35, 0.45);
    s.setVelocity(Phaser.Math.Between(-150, 150) * spread, Phaser.Math.Between(-430, -300) * upward);
    s.setAngularVelocity(Phaser.Math.Between(-420, 420));
    s.__eclat = { value, born: lvl.time.now, magnet: false, speed: 0, glintAt: lvl.time.now + Phaser.Math.Between(300, 900) };
    st.shards.push(s);
  }
  playSfx('eclats_burst', { n });
}

// Chaque image (monde non gelé) : rebonds amortis, aspiration, ramassage.
function eclatsUpdate(scene, delta) {
  const st = secretState(scene);
  if (!st.shards.length) return;
  const p = scene.player;
  const dt = Math.min(0.05, delta / 1000);
  const tx = p.x;
  const ty = p.y - 44;
  const fallY = (scene.__story && scene.__story.fall && scene.__story.fall.y) || (scene.physics.world.bounds.bottom + 120);
  const now = scene.time.now;
  st.shards = st.shards.filter((s) => {
    if (!s.active) return false;
    const d = s.__eclat;
    if (!d.magnet) {
      if (s.body.blocked.down) {
        s.body.velocity.x *= 0.82;
        s.setAngularVelocity(s.body.angularVelocity * 0.7);
      }
      // Tombé dans le vide : compté quand même (rien de perdu dans un trou).
      if (s.y > fallY) {
        eclatsAdd(scene, d.value);
        s.destroy();
        return false;
      }
      if (now >= d.glintAt) {
        d.glintAt = now + Phaser.Math.Between(700, 1600);
        spawnFx(scene, 'glint', s.x, s.y, { tint: 0xe6f7ff });
      }
      if (now - d.born < ECLATS_PICKUP_DELAY_MS || !p.active || p.fallingOut) return true;
      if (Phaser.Math.Distance.Between(s.x, s.y, tx, ty) > ECLATS_MAGNET_RANGE) return true;
      d.magnet = true;
      d.speed = 160;
      s.body.enable = false;
    }
    d.speed = Math.min(ECLATS_MAGNET_MAX, d.speed + ECLATS_MAGNET_ACCEL * dt);
    const dx = tx - s.x;
    const dy = ty - s.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= ECLATS_COLLECT_DIST + d.speed * dt) {
      eclatsAdd(scene, d.value);
      spawnFx(scene, 'glint', tx + Phaser.Math.Between(-6, 6), ty, { tint: 0x9fe8ff });
      playSfx('eclat_pickup', { value: d.value });
      s.destroy();
      return false;
    }
    s.x += (dx / dist) * d.speed * dt;
    s.y += (dy / dist) * d.speed * dt;
    s.rotation += 12 * dt;
    return true;
  });
}

// Nombre d'éclats lâchés par un ennemi vaincu (table, ou réglage de la donnée).
function eclatsEnemyDrop(enemy) {
  if (enemy.healed) return ECLATS_HEALED_DROP;
  const v = enemy.__lootEclats !== undefined ? enemy.__lootEclats
    : (ECLATS_ENEMY_DROPS[enemy.__lootType] ?? ECLATS_ENEMY_DROPS.default);
  if (Array.isArray(v)) return Phaser.Math.Between(Math.round(v[0]), Math.round(v[1] ?? v[0]));
  return Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
}

function eclatsLootEnemy(scene, enemy, x, y) {
  if (enemy.__looted) return;
  enemy.__looted = true;
  const n = eclatsEnemyDrop(enemy);
  if (n > 0) eclatsSpawn(scene, x, y, n, { upward: 0.85 });
}

// Ennemis de la donnée (`__lootType`, posé par buildLevelFromData) qui viennent
// d'être vaincus : butin au centre de leur corps. Filet : un ennemi détruit
// avant ce passage (vaincu pile au début d'un dialogue) lâche à sa destruction.
function eclatsScanEnemies(scene) {
  if (!scene.enemies) return;
  for (const e of scene.enemies.getChildren()) {
    if (!e || e.__lootType === undefined) continue;
    if (!e.__lootHooked) {
      e.__lootHooked = true;
      e.once('destroy', () => {
        if (!e.defeated || e.__looted || !scene.sys || !scene.sys.isActive() || scene.__storyVisit !== secretState(scene).visit) return;
        eclatsLootEnemy(scene, e, e.x, e.y - 30);
      });
    }
    if (e.defeated && !e.__looted) {
      const c = e.getCenter ? e.getCenter() : { x: e.x, y: e.y - 30 };
      eclatsLootEnemy(scene, e, c.x, c.y);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Cœurs entiers (+1 cœur maximum, vie pleine)
// ---------------------------------------------------------------------------
// Registre `heartUpgrades` = liste des sources déjà prises ('chest:zone:id',
// 'tresor:zone:id', 'quest:id', 'shop:...') : une même source ne compte
// jamais deux fois. Lu par Player.recomputeTotemBonuses et le résumé de
// sauvegarde (MenuKit). Le cœur de la forêt sombre 2 (`coeurBonusForet`)
// reste à part, inchangé.
function heartUpgradeList() {
  const v = storyGet('heartUpgrades');
  return Array.isArray(v) ? v : [];
}

function heartUpgradeCount() {
  const v = storyGet('heartUpgrades');
  if (Array.isArray(v)) return v.length;
  return Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
}

function heartUpgradeGrant(scene, source = null, { silent = false } = {}) {
  const list = heartUpgradeList();
  if (source && list.includes(source)) return false;
  storySet('heartUpgrades', [...list, source || `coeur_${list.length + 1}`]);
  const lvl = secretLevelScene(scene);
  const p = lvl && lvl.player;
  if (p && p.recomputeTotemBonuses) {
    p.recomputeTotemBonuses();
    p.hearts = p.maxHearts;
    lvl.registry.set('hearts', p.hearts);
    spawnFx(lvl, 'pickup', p.x, p.y - 44, { color: STORY_UI.pink });
    juiceSquash(p, 1.1, 0.92, 220);
  }
  if (!silent && lvl) {
    showStoryBanner(lvl, { kicker: 'Cœur entier', title: '+1 cœur maximum', desc: 'Ta vie est pleine.', itemId: 'coeur_entier', color: STORY_UI.pink });
  }
  playSfx('heart_up');
  return true;
}

// ---------------------------------------------------------------------------
// 3. Contenus (coffre, trésor, quête, boutique, cassable)
// ---------------------------------------------------------------------------
// Objet (plusieurs clés possibles) ou tableau d'objets :
//   { eclats: n } · { item: 'id' } · { coeur: true } · { consommable: 'id', n }
//   { skill: 'id' } · { set: { flag: valeur } }
// Options : `source` (identifiant stable : un cœur ne compte qu'une fois par
// source), `silent` (pas de bandeau), `x`/`y` (d'où jaillissent les éclats,
// sinon de la poitrine d'Agarica).
function secretGrantContents(scene, contents, { source = null, silent = false, x = null, y = null } = {}) {
  if (!contents) return;
  const lvl = secretLevelScene(scene) || scene;
  [].concat(contents).forEach((c, i) => {
    if (!c || typeof c !== 'object') return;
    if (c.eclats > 0) {
      const p = lvl && lvl.player;
      if (p && x == null) eclatsSpawn(lvl, p.x, p.y - 50, c.eclats, { upward: 0.7, spread: 0.6 });
      else if (p) eclatsSpawn(lvl, x, y, c.eclats);
      else eclatsAdd(lvl, c.eclats);
    }
    if (c.item) inventoryAdd(lvl, c.item, { silent });
    if (c.coeur) heartUpgradeGrant(lvl, typeof c.coeur === 'string' ? c.coeur : (source ? `${source}${i ? `#${i}` : ''}` : null), { silent });
    if (c.consommable) consumableAdd(lvl, c.consommable, c.n || 1, { silent });
    if (c.skill) unlockSkillFromStory(lvl, c.skill, { silent });
    if (c.set && typeof c.set === 'object') storySet(c.set);
  });
}

// Texte court d'un contenu (« 15 éclats de lune, Baie de soin ×2 »).
function secretContentsLabel(contents) {
  if (!contents) return '';
  const out = [];
  for (const c of [].concat(contents)) {
    if (!c || typeof c !== 'object') continue;
    if (c.eclats > 0) out.push(`${c.eclats} éclat${c.eclats > 1 ? 's' : ''} de lune`);
    if (c.item) out.push(itemInfo(c.item).name);
    if (c.coeur) out.push('1 cœur entier');
    if (c.consommable) out.push(`${itemInfo(c.consommable).name}${(c.n || 1) > 1 ? ` ×${c.n}` : ''}`);
    if (c.skill) out.push(`compétence ${(SKILL_STORY_INFO[c.skill] && SKILL_STORY_INFO[c.skill].name) || c.skill}`);
  }
  return out.join(', ');
}

// Icône d'un contenu (pour un trésor posé, une case de boutique).
function secretContentsIcon(contents) {
  const c = [].concat(contents || [])[0] || {};
  if (c.coeur) return 'coeur_entier';
  if (c.item) return c.item;
  if (c.consommable) return c.consommable;
  return 'eclat_lune';
}

// ---------------------------------------------------------------------------
// Aide commune : cases cassables intactes, ligne bloquée, sol d'une salle.
// ---------------------------------------------------------------------------
function secretCellRect(gx, gy) {
  return new Phaser.Geom.Rectangle(gx * GROUND_TILE_SIZE, gy * GROUND_TILE_SIZE, GROUND_TILE_SIZE, GROUND_TILE_SIZE);
}

function secretIntactBreakableCells(scene) {
  const out = [];
  for (const b of secretState(scene).breakables) if (!b.broken) out.push(...b.cells);
  return out;
}

// Vrai si un cassable intact se dresse entre (x1, y1) et (x2, y2) : un coffre
// caché derrière un mur ne s'ouvre pas (ni invite) tant que le mur tient.
function secretLineBlocked(scene, x1, y1, x2, y2) {
  const line = new Phaser.Geom.Line(x1, y1, x2, y2);
  return secretIntactBreakableCells(scene).some(([gx, gy]) => {
    const r = secretCellRect(gx, gy);
    return Phaser.Geom.Intersects.LineToRectangle(line, r) || r.contains(x2, y2);
  });
}

// Vrai si le rectangle touche une case cassable intacte (objet à cacher
// derrière le sol tant que le cassable tient).
function secretRectInIntactCells(scene, rect) {
  return secretIntactBreakableCells(scene).some(([gx, gy]) => Phaser.Geom.Intersects.RectangleToRectangle(rect, secretCellRect(gx, gy)));
}

// Ligne de marche sous (x, y), d'après la grille et SANS les cases cassables
// (le sol d'une salle cachée, même encore remplie) ; null si aucune case.
function secretFloorBelow(scene, x, y) {
  const gr = scene.__groundRender;
  if (!gr) return null;
  const breakKeys = new Set();
  for (const b of secretState(scene).breakables) for (const k of b.keys) breakKeys.add(k);
  const gx = Math.floor(x / GROUND_TILE_SIZE);
  for (let gy = Math.floor(y / GROUND_TILE_SIZE); gy < Math.floor(y / GROUND_TILE_SIZE) + 24; gy++) {
    const k = gridCellKey(gx, gy);
    if (gr.solid.has(k) && !breakKeys.has(k)) return gy * GROUND_TILE_SIZE + GROUND_STAND_SINK;
  }
  return null;
}

// Pieds d'un objet posé (coffre, PNJ…) : `y` donné -> sol de la grille sous
// lui (cassables ignorés : une salle cachée a son vrai sol) ; sinon le sol
// à découvert le plus proche de la ligne habituelle.
function secretFootY(scene, x, y) {
  if (y != null) return secretFloorBelow(scene, x, y - 8) ?? y;
  return storyStandY(scene, x, 448);
}

// ---------------------------------------------------------------------------
// 4a. Coffres : `chests: [{ id, x, y?, contents, requires?, forbids? }]`
// ---------------------------------------------------------------------------
// E pour ouvrir ; flag `chest_<zone>_<id>`. Caché derrière un cassable :
// dessiné derrière le sol, ni invite ni ouverture tant que le mur tient.
const CHEST_HEIGHT = 40;

function chestTextureKey(scene, open) {
  const id = open ? 'coffre_ouvert' : 'coffre_ferme';
  if (scene.textures.exists(`item-${id}`)) return `item-${id}`;
  return storyDrawnItemKey(scene, id);
}

function chestSetLook(scene, ch, open) {
  ch.img.setTexture(chestTextureKey(scene, open));
  ch.img.setScale((open ? CHEST_HEIGHT * 1.18 : CHEST_HEIGHT) / ch.img.height);
}

LEVEL_DATA_HANDLERS.chests = (scene, list) => {
  const zone = storyZoneId(scene);
  const st = secretState(scene);
  (list || []).forEach((c, i) => {
    if (!c || c.x == null) return;
    const id = c.id || `coffre${i}`;
    const flag = `chest_${zone}_${id}`;
    const footY = secretFootY(scene, c.x, c.y);
    const img = scene.add.image(c.x, footY + GROUND_CONTACT_SINK, chestTextureKey(scene, false)).setOrigin(0.5, 1);
    img.lookRole = 'prop';
    const ch = { id, flag, data: c, img, x: c.x, footY, opened: !!storyGet(flag), glintAt: 0 };
    chestSetLook(scene, ch, ch.opened);
    if (secretRectInIntactCells(scene, img.getBounds())) sendBehindFrontGround(scene, [img]);
    st.chests.push(ch);
    if (ch.opened) return;
    scene.__story.interactables.push({
      kind: 'chest', chest: ch,
      probe: (sc, p) => {
        if (ch.opened || !storyAllowed(c)) return null;
        if (Math.abs(p.y - ch.footY) > 70) return null;
        if (secretLineBlocked(sc, p.x, p.y - 40, ch.x, ch.footY - CHEST_HEIGHT / 2)) return null;
        return { x: ch.x, topY: ch.footY - CHEST_HEIGHT - 6, label: 'E : ouvrir' };
      },
      activate: (sc) => chestOpen(sc, ch),
    });
  });
};

function chestOpen(scene, ch) {
  if (ch.opened) return;
  ch.opened = true;
  storySet(ch.flag, true);
  scene.__story.interactables = scene.__story.interactables.filter((it) => it.chest !== ch);
  chestSetLook(scene, ch, true);
  const topY = ch.footY - CHEST_HEIGHT;
  juiceSquash(ch.img, 1.12, 0.9, 200);
  juiceBurstImage(scene, 'glow', ch.x, topY + 8, { size: 120, from: 0.3, to: 1.2, ms: 520, color: 0xfff6c2, alpha: 0.75 });
  spawnFx(scene, 'star', ch.x, topY + 4, { count: 10, power: 1.2, tint: [0xfff6c2, 0x9fe8ff, 0xff9fc9] });
  playSfx('chest_open');
  scene.events.emit('chest-opened', ch);
  // Le contenu jaillit un instant après le couvercle.
  scene.time.delayedCall(160, () => {
    secretGrantContents(scene, ch.data.contents, { source: `chest:${storyZoneId(scene)}:${ch.id}`, x: ch.x, y: topY + 6 });
  });
}

// ---------------------------------------------------------------------------
// 4b. Trésors posés (ramassés au contact) : `treasures: [{ id, x, y?, contents,
// requires?, forbids? }]` -- le cœur entier d'une salle secrète, une poignée
// d'éclats… `y` = centre de l'objet (défaut : 34 px au-dessus du sol).
// Flag `treasure_<zone>_<id>`.
// ---------------------------------------------------------------------------
const TREASURE_ICON = 34;

LEVEL_DATA_HANDLERS.treasures = (scene, list) => {
  const zone = storyZoneId(scene);
  const st = secretState(scene);
  (list || []).forEach((t, i) => {
    if (!t || t.x == null) return;
    const id = t.id || `tresor${i}`;
    const flag = `treasure_${zone}_${id}`;
    if (storyGet(flag)) return;
    const y = t.y != null ? t.y : storyStandY(scene, t.x, 448) - 34;
    const icon = secretContentsIcon(t.contents);
    const gt = juiceTexture(scene, 'fx_halo_objet', 'juice-glow');
    const gs = 84 / gt.size;
    const isHeart = icon === 'coeur_entier';
    const glow = scene.add.image(t.x, y, gt.key).setBlendMode(Phaser.BlendModes.ADD)
      .setTint(gt.art ? 0xffffff : (isHeart ? STORY_UI.pink : 0x9fe8ff)).setAlpha(0.6).setScale(gs);
    const img = icon === 'eclat_lune'
      ? scene.add.image(t.x, y, eclatTextureKey(scene)).setScale((TREASURE_ICON * 0.8) / 56)
      : addItemIcon(scene, t.x, y, icon, TREASURE_ICON);
    img.lookRole = 'prop';
    scene.tweens.add({ targets: glow, alpha: { from: 0.4, to: 0.85 }, scale: { from: gs * 0.85, to: gs * 1.1 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: [img, glow], y: y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (isHeart) scene.tweens.add({ targets: img, scale: img.scale * 1.08, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (secretRectInIntactCells(scene, img.getBounds())) sendBehindFrontGround(scene, [glow, img]);
    else { storyPutBehindPlayer(scene, glow); storyPutBehindPlayer(scene, img); }
    st.treasures.push({ id, flag, data: t, img, glow, x: t.x, y, taken: false, glintAt: 0 });
  });
};

function treasuresUpdate(scene) {
  const st = secretState(scene);
  if (!st.treasures.length) return;
  const p = scene.player;
  const body = playerBodyRect(p);
  for (const t of st.treasures) {
    if (t.taken) continue;
    const ok = storyAllowed(t.data) && !secretRectInIntactCells(scene, new Phaser.Geom.Rectangle(t.x - 4, t.y - 4, 8, 8));
    t.img.setVisible(ok);
    t.glow.setVisible(ok);
    if (!ok) continue;
    if (scene.time.now >= t.glintAt) {
      t.glintAt = scene.time.now + Phaser.Math.Between(700, 1500);
      spawnFx(scene, 'glint', t.x + Phaser.Math.Between(-12, 12), t.img.y + Phaser.Math.Between(-12, 8));
    }
    const r = new Phaser.Geom.Rectangle(t.x - 20, t.img.y - 20, 40, 40);
    if (!p.fallingOut && Phaser.Geom.Intersects.RectangleToRectangle(body, r)) treasureTake(scene, t);
  }
}

function treasureTake(scene, t) {
  t.taken = true;
  storySet(t.flag, true);
  // Même ramassage que les objets (pop, aspiré vers la poitrine), cf. StoryKit.
  storyPickupJuice(scene, { img: t.img, glow: t.glow, y: t.img.y, data: { item: secretContentsIcon(t.data.contents) } });
  const c = [].concat(t.data.contents || []);
  // Éclats : ils jaillissent de l'endroit du trésor.
  secretGrantContents(scene, c, { source: `tresor:${storyZoneId(scene)}:${t.id}`, x: t.x, y: t.y });
  scene.events.emit('treasure-taken', t);
}

// ---------------------------------------------------------------------------
// 5. Murs et sols cassables :
//   breakables: [{ id, cells: [[gx, gy], …] | x, y, w, h, by: 'sword' | 'bear',
//                  hits?: 3, hint?: 'fissure' | 'mousse' | 'poussiere' | false,
//                  reward?: contenu }]
// Cases solides, rendues AVEC le sol de la zone (même jeu de tuiles, blob ou
// atlas, mêmes raccords) : seul `hint` les trahit. `x, y, w, h` : rectangle
// (CENTRE, comme la mousse) -> toutes les cases dont le centre est dedans.
// Une salle cachée se met dans `cells` avec son mur : tout tombe d'un coup.
// `by: 'sword'` : `hits` coups de mêlée (dague ou croc du loup) ; l'ours casse
// aussi. `by: 'bear'` : seulement le fracas de l'ours. Flag `break_<zone>_<id>`.
// ---------------------------------------------------------------------------
const SECRET_SWORD_HITS = 3;
// Le fracas de l'ours part des pieds (40 px de haut) : on le prolonge vers le
// bas pour qu'il atteigne un sol cassable sous elle.
const SECRET_BEAR_REACH_DOWN = 28;
const SECRET_HINT_ALPHA = 0.55;

function secretBreakableCells(b) {
  if (Array.isArray(b.cells)) {
    return b.cells.filter((c) => Array.isArray(c) && c.length >= 2).map(([gx, gy]) => [Math.round(gx), Math.round(gy)]);
  }
  if (b.x != null && b.y != null && b.w && b.h) {
    const T = GROUND_TILE_SIZE;
    const out = [];
    for (let gy = Math.floor((b.y - b.h / 2) / T); gy <= Math.floor((b.y + b.h / 2) / T); gy++) {
      for (let gx = Math.floor((b.x - b.w / 2) / T); gx <= Math.floor((b.x + b.w / 2) / T); gx++) {
        const cx = gx * T + T / 2;
        const cy = gy * T + T / 2;
        if (Math.abs(cx - b.x) <= b.w / 2 && Math.abs(cy - b.y) <= b.h / 2) out.push([gx, gy]);
      }
    }
    return out;
  }
  return [];
}

// Appelée par buildLevelFromData AVANT le rendu du sol : cases cassables
// intactes ajoutées au sol, cases déjà cassées retirées. Renvoie les cases.
function secretPrepareGroundCells(scene, data, cells) {
  const st = secretState(scene);
  const list = Array.isArray(data.breakables) ? data.breakables : [];
  if (!list.length) return cells;
  const zone = storyZoneId(scene);
  const broken = new Set();
  const intact = new Map();
  list.forEach((b, i) => {
    if (!b || typeof b !== 'object') return;
    const id = b.id || `cassable${i}`;
    const flag = `break_${zone}_${id}`;
    const bc = secretBreakableCells(b);
    if (!bc.length) return;
    const isBroken = !!storyGet(flag);
    const keys = new Set(bc.map(([gx, gy]) => gridCellKey(gx, gy)));
    st.breakables.push({
      id, flag, data: b, cells: bc, keys, broken: isBroken, by: b.by === 'bear' ? 'bear' : 'sword',
      hits: 0, needed: Math.max(1, Math.round(b.hits || SECRET_SWORD_HITS)), lastToken: null, hint: [], crack: null, trembled: false,
    });
    for (const [gx, gy] of bc) {
      const k = gridCellKey(gx, gy);
      if (isBroken) broken.add(k);
      else intact.set(k, [gx, gy, 'dirt']);
    }
  });
  // Une case écrite deux fois dans la donnée n'est rendue qu'une fois ici : la
  // redessiner (casse) remplacerait sinon l'un des deux exemplaires seulement.
  const have = new Set();
  const out = cells.filter(([gx, gy]) => {
    const k = gridCellKey(gx, gy);
    if (have.has(k) || (broken.has(k) && !intact.has(k))) return false;
    have.add(k);
    return true;
  });
  for (const [k, c] of intact) if (!have.has(k)) out.push(c);
  return out;
}

// Le handler ne pose que les indices : les cases sont déjà dans le sol.
LEVEL_DATA_HANDLERS.breakables = (scene) => {
  for (const b of secretState(scene).breakables) if (!b.broken) secretDrawHint(scene, b);
};

// Faces exposées d'une case (voisin orthogonal hors du sol) : 'top', 'bottom', 'left', 'right'.
function secretExposedSides(scene, gx, gy) {
  const solid = scene.__groundRender ? scene.__groundRender.solid : new Set();
  const sides = [];
  if (!solid.has(gridCellKey(gx, gy - 1))) sides.push('top');
  if (!solid.has(gridCellKey(gx, gy + 1))) sides.push('bottom');
  if (!solid.has(gridCellKey(gx - 1, gy))) sides.push('left');
  if (!solid.has(gridCellKey(gx + 1, gy))) sides.push('right');
  return sides;
}

// Case la plus parlante pour l'indice : une face latérale exposée (mur) ou,
// sinon, le dessus (sol). Mur : la case la plus basse (à hauteur d'yeux).
function secretHintSpot(scene, b) {
  let best = null;
  for (const [gx, gy] of b.cells) {
    const sides = secretExposedSides(scene, gx, gy);
    const side = sides.find((s) => s === 'left' || s === 'right') || (sides.includes('top') ? 'top' : sides[0]);
    if (!side) continue;
    const score = (side === 'left' || side === 'right' ? 100 : side === 'top' ? 50 : 10) + gy;
    if (!best || score > best.score) best = { gx, gy, side, score };
  }
  return best;
}

// Indice discret : petite fissure (art `fissure_secret`, sinon tracée),
// mousse un peu plus pâle que les autres, ou filet de poussière de temps en
// temps (`poussiere`, cf. breakablesUpdate). `hint: false` : aucun.
function secretDrawHint(scene, b) {
  const kind = b.data.hint === undefined || b.data.hint === true ? 'fissure' : b.data.hint;
  if (!kind) return;
  const spot = secretHintSpot(scene, b);
  if (!spot) return;
  b.hintSpot = spot;
  const T = GROUND_TILE_SIZE;
  const x0 = spot.gx * T;
  const y0 = spot.gy * T;
  // Point de l'indice : contre la face exposée, un peu à l'intérieur.
  const at = {
    left: { x: x0 + 14, y: y0 + T * 0.55 }, right: { x: x0 + T - 14, y: y0 + T * 0.55 },
    top: { x: x0 + T * 0.5, y: y0 + 12 }, bottom: { x: x0 + T * 0.5, y: y0 + T - 12 },
  }[spot.side];
  b.hintAt = at;
  if (kind === 'poussiere') return;
  if (kind === 'fissure' && scene.textures.exists('item-fissure_secret')) {
    const img = scene.add.image(at.x, at.y, 'item-fissure_secret').setAlpha(SECRET_HINT_ALPHA);
    img.setScale(26 / Math.max(img.width, img.height));
    if (spot.side === 'top' || spot.side === 'bottom') img.setAngle(90);
    img.lookRole = 'world';
    b.hint.push(img);
    return;
  }
  const g = scene.add.graphics({ x: at.x, y: at.y });
  g.lookRole = 'world';
  const rnd = new Phaser.Math.RandomDataGenerator([`indice-${b.id}`]);
  if (kind === 'mousse') {
    // Touffe un peu plus pâle et plus bleue que la mousse des zones.
    const vertical = spot.side === 'left' || spot.side === 'right';
    for (let i = 0; i < 6; i++) {
      const dx = vertical ? rnd.realInRange(-3, 3) : rnd.realInRange(-12, 12);
      const dy = vertical ? rnd.realInRange(-12, 12) : rnd.realInRange(-3, 3);
      g.fillStyle(i % 2 ? 0x7fc9b0 : 0x5aa38e, 0.75);
      g.fillCircle(dx, dy, rnd.realInRange(2.5, 4.5));
    }
    g.fillStyle(0xd8fff0, 0.6);
    g.fillCircle(rnd.realInRange(-4, 4), rnd.realInRange(-4, 4), 1.5);
  } else {
    // Fissure : un trait brisé sombre (~24 px) bordé d'un liseré clair, qui
    // le détache aussi sur les jeux de tuiles chargés (écorce, mousse).
    const vertical = spot.side === 'left' || spot.side === 'right';
    const pts = [[0, 0]];
    for (let i = 0; i < 4; i++) {
      const [px, py] = pts[pts.length - 1];
      pts.push(vertical ? [px + rnd.realInRange(-4, 4), py + 6] : [px + 6, py + rnd.realInRange(-4, 4)]);
    }
    const off = vertical ? [-pts[pts.length - 1][0] / 2, -12] : [-12, -pts[pts.length - 1][1] / 2];
    const mid = pts[2];
    const branch = [mid[0] + (vertical ? 6 : 3), mid[1] + (vertical ? 3 : 6)];
    for (const [col, width, alpha, dx] of [[0xe8dcff, 1.4, 0.5, 1.2], [0x0d0812, 2.4, 0.9, 0]]) {
      g.lineStyle(width, col, alpha);
      g.beginPath();
      pts.forEach(([px, py], i) => (i ? g.lineTo : g.moveTo).call(g, px + off[0] + dx, py + off[1]));
      g.strokePath();
      // Petite branche de la fissure.
      g.lineBetween(mid[0] + off[0] + dx, mid[1] + off[1], branch[0] + off[0] + dx, branch[1] + off[1]);
    }
  }
  g.setAlpha(SECRET_HINT_ALPHA / 0.55 * 0.85);
  b.hint.push(g);
}

// Fissures qui s'agrandissent à chaque coup (épée) : traits depuis le point d'impact.
function secretCrackGrow(scene, b, x, y) {
  if (!b.crack) {
    b.crack = scene.add.graphics();
    b.crack.lookRole = 'world';
  }
  const g = b.crack;
  const rnd = new Phaser.Math.RandomDataGenerator([`casse-${b.id}-${b.hits}`]);
  const branches = 2 + b.hits;
  for (let k = 0; k < branches; k++) {
    const a = rnd.realInRange(0, Math.PI * 2);
    const len = rnd.realInRange(12, 18 + b.hits * 8);
    let px = x;
    let py = y;
    g.lineStyle(2, 0x0d0812, 0.85);
    g.beginPath();
    g.moveTo(px, py);
    for (let i = 1; i <= 4; i++) {
      px = x + Math.cos(a) * (len * i) / 4 + rnd.realInRange(-3, 3);
      py = y + Math.sin(a) * (len * i) / 4 + rnd.realInRange(-3, 3);
      g.lineTo(px, py);
    }
    g.strokePath();
  }
  // Rien hors des cases du cassable : les traits sont rognés par un masque.
  if (!g.mask) {
    const shape = scene.make.graphics({ add: false });
    shape.fillStyle(0xffffff);
    for (const [gx, gy] of b.cells) shape.fillRect(gx * GROUND_TILE_SIZE, gy * GROUND_TILE_SIZE, GROUND_TILE_SIZE, GROUND_TILE_SIZE);
    g.setMask(shape.createGeometryMask());
    b.crackMaskShape = shape;
  }
}

// Images posées sur les cases du cassable (tuiles + herbe).
function secretBreakableImages(scene, b) {
  const gr = scene.__groundRender;
  const out = [];
  for (const k of b.keys) {
    const rec = gr && gr.cellObjects.get(k);
    if (!rec) continue;
    out.push(...rec.images);
    if (rec.grass) out.push(rec.grass);
  }
  return out;
}

// Tremblement du dessin (jamais des corps) : les cases vibrent un instant.
function secretTremble(scene, b, amp = 2, times = 4) {
  for (const img of secretBreakableImages(scene, b)) {
    if (!img.active) continue;
    const x0 = img.__breakX ?? img.x;
    img.__breakX = x0;
    scene.tweens.killTweensOf(img);
    scene.tweens.add({ targets: img, x: { from: x0 - amp, to: x0 + amp }, duration: 40, yoyo: true, repeat: times, onComplete: () => img.setX(x0) });
  }
}

// Coup d'épée qui porte : fissures, éclats de terre, tremblement ; casse au dernier.
function secretBreakableHit(scene, b, x, y) {
  b.hits += 1;
  if (b.hits >= b.needed) {
    secretBreak(scene, b, { cause: 'sword', x, y });
    return;
  }
  secretCrackGrow(scene, b, x, y);
  secretTremble(scene, b, 2, 3);
  juiceParticles(scene, 'earth', x, y, { count: 4 + b.hits * 2, power: 0.7 });
  juiceParticles(scene, 'dust', x, y, { count: 3, power: 0.6, tint: [0x8a7a68, 0xb4a690, 0x6a5a4a] });
  juiceShake(scene, 'tiny');
  playSfx('breakable_hit', { hits: b.hits });
}

// Mauvaise méthode (dague contre un mur de l'ours) : rien ne cède. Première
// fois de la visite : un mot qui oriente sans tout dire.
function secretBreakableRefuse(scene, b, x, y) {
  juiceParticles(scene, 'dust', x, y, { count: 2, power: 0.4, tint: [0x8a7a68, 0xb4a690] });
  playSfx('breakable_denied');
  const st = secretState(scene);
  if (st.refuseToastShown.has(b.id)) return;
  st.refuseToastShown.add(b.id);
  const floor = b.hintSpot && b.hintSpot.side === 'top';
  showToast(scene, floor ? 'Le sol sonne creux… Il faudrait frapper bien plus fort.' : 'Ça sonne creux… Il faudrait frapper bien plus fort.', 2400);
}

// Éclats d'une case : ses images découpées en quatre, qui volent et tombent.
function secretDebris(scene, img, dir) {
  if (!img || !img.active || !img.frame) return;
  const fw = img.frame.width;
  const fh = img.frame.height;
  for (let q = 0; q < 4; q++) {
    const qx = q % 2;
    const qy = Math.floor(q / 2);
    const f = scene.add.image(img.x, img.y, img.texture.key, img.frame.name)
      .setOrigin(img.originX, img.originY).setScale(img.scaleX, img.scaleY).setFlip(img.flipX, img.flipY)
      .setTint(img.tintTopLeft).setDepth(CHARACTER_DEPTH + 1);
    f.lookRole = 'world';
    f.setCrop(qx * fw / 2, qy * fh / 2, fw / 2, fh / 2);
    scene.tweens.add({
      targets: f,
      x: f.x + (qx ? 1 : -1) * Phaser.Math.Between(10, 50) + dir * Phaser.Math.Between(0, 40),
      y: f.y + Phaser.Math.Between(50, 140),
      angle: Phaser.Math.Between(-160, 160),
      alpha: 0,
      duration: Phaser.Math.Between(420, 680),
      ease: 'Quad.easeIn',
      onComplete: () => f.destroy(),
    });
  }
}

// La casse : corps et images retirés, voisines redessinées (bords exposés),
// éclats, secousse, récompense éventuelle ; sauvegardée pour toujours.
function secretBreak(scene, b, { cause = 'sword', x = null, y = null } = {}) {
  if (b.broken) return;
  b.broken = true;
  storySet(b.flag, true);
  const gr = scene.__groundRender;
  const dir = scene.player && x != null ? Math.sign(x - scene.player.x) || 1 : 1;
  let sx = 0;
  let sy = 0;
  b.cells.forEach(([gx, gy], i) => {
    const k = gridCellKey(gx, gy);
    sx += gx * GROUND_TILE_SIZE + GROUND_TILE_SIZE / 2;
    sy += gy * GROUND_TILE_SIZE + GROUND_TILE_SIZE / 2;
    gr.solid.delete(k);
    const rec = gr.cellObjects.get(k);
    gr.cellObjects.delete(k);
    if (!rec) return;
    if (rec.body) scene.ground.remove(rec.body, true, true);
    for (const img of [...rec.images, rec.grass].filter(Boolean)) {
      scene.tweens.killTweensOf(img);
      if (img.__breakX != null) img.setX(img.__breakX);
      if (i < 16) secretDebris(scene, img, dir);
      if (scene.__frontGroundFirstImage === img) scene.__frontGroundFirstImage = null;
      img.destroy();
    }
    if (i < 16) {
      const cx = gx * GROUND_TILE_SIZE + GROUND_TILE_SIZE / 2;
      const cy = gy * GROUND_TILE_SIZE + GROUND_TILE_SIZE / 2;
      juiceParticles(scene, 'earth', cx, cy, { count: 5, spread: 24, power: 1 });
      juiceParticles(scene, 'dust', cx, cy, { count: 4, spread: 26, power: 1.2, tint: [0x8a7a68, 0xb4a690, 0x6a5a4a] });
    }
  });
  for (const o of [...b.hint, b.crack, b.crackMaskShape].filter(Boolean)) o.destroy();
  b.hint = [];
  b.crack = null;
  // Voisines (deux cases autour : la disposition 'atlas' regarde les voisins
  // des voisins) : nouveaux bords, herbe, faces de collision.
  const ring = new Set();
  for (const [gx, gy] of b.cells) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) ring.add(gridCellKey(gx + dx, gy + dy));
  }
  secretRerenderGround(scene, ring);
  // Repère du sol de premier plan perdu (sa case vient de tomber) : la 1re
  // image restante du sol.
  if (!scene.__frontGroundFirstImage || !scene.__frontGroundFirstImage.active) {
    for (const rec of gr.cellObjects.values()) {
      const img = rec.images.find((o) => o && o.active);
      if (img && (!scene.__frontGroundFirstImage || scene.children.getIndex(img) < scene.children.getIndex(scene.__frontGroundFirstImage))) {
        scene.__frontGroundFirstImage = img;
      }
    }
  }
  const n = b.cells.length;
  const cx = sx / n;
  const cy = sy / n;
  juiceShockRing(scene, cx, cy, { size: 120 + 24 * Math.min(6, n), ms: 360, color: 0xd8ccf5 });
  juiceHitStop(scene, cause === 'bear' ? 70 : 50);
  juiceShake(scene, cause === 'bear' ? 'heavy' : 'medium');
  playSfx('breakable_break', { cause });
  if (b.data.reward) secretGrantContents(scene, b.data.reward, { source: `break:${storyZoneId(scene)}:${b.id}`, x: cx, y: cy });
  scene.events.emit('breakable-broken', b);
}

// Redessine (corps + images) les cases `keys` encore pleines, avec le
// voisinage actuel ; les images gardent leur place dans la liste d'affichage
// (devant le fond, derrière les décors posés après le sol).
function secretRerenderGround(scene, keys) {
  const gr = scene.__groundRender;
  if (!gr) return;
  for (const k of keys) {
    if (!gr.solid.has(k)) continue;
    const [gx, gy] = k.split(',').map(Number);
    const old = gr.cellObjects.get(k);
    const tmp = new Map();
    renderAutotileGrid(scene, scene.ground, [[gx, gy, 'dirt']], {
      tileset: gr.tileset, noArt: gr.noArt, solid: gr.solid, cellObjects: tmp,
    });
    const rec = tmp.get(k);
    if (!rec) continue;
    if (old) {
      if (old.body) scene.ground.remove(old.body, true, true);
      const oldTile = old.images[old.images.length - 1] || null;
      rec.images.forEach((img) => {
        if (oldTile && oldTile.active) scene.children.moveAbove(img, oldTile);
        else scene.children.moveBelow(img, gr.end);
      });
      for (const img of old.images) {
        if (scene.__frontGroundFirstImage === img) scene.__frontGroundFirstImage = rec.images[0] || null;
        if (img.active) img.destroy();
      }
      if (rec.grass) {
        if (old.grass && old.grass.active) scene.children.moveAbove(rec.grass, old.grass);
        else scene.children.moveBelow(rec.grass, gr.end);
      }
      if (old.grass && old.grass.active) old.grass.destroy();
    }
    gr.cellObjects.set(k, rec);
  }
}

// Point de contact entre une zone de coup et les cases d'un cassable (null si aucun).
function secretHitPoint(b, rect) {
  for (const [gx, gy] of b.cells) {
    const r = secretCellRect(gx, gy);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(rect, r)) continue;
    const i = Phaser.Geom.Intersects.GetRectangleIntersection(rect, r);
    return { x: i.centerX, y: i.centerY };
  }
  return null;
}

function breakablesUpdate(scene) {
  const st = secretState(scene);
  if (!st.breakables.length) return;
  const p = scene.player;
  const now = scene.time.now;
  // Épée / croc : un coup = un jeton (comme les ennemis).
  const melee = p.isAttacking ? p.getAttackHitbox() : null;
  const token = melee ? `melee-${p.attackEndTime}` : null;
  // Ours : zone prolongée sous les pieds ; en attente (transformation) = tremblement.
  const bearRect = p.skillHitboxId === 'ours' ? p.getSkillHitbox() : null;
  const bearPending = p.skillHitboxId === 'ours' ? p.skillHitboxPendingRect : null;
  const extend = (r) => (r ? new Phaser.Geom.Rectangle(r.x, r.y, r.width, r.height + SECRET_BEAR_REACH_DOWN) : null);
  const bear = extend(bearRect);
  const bearSoon = extend(bearPending);
  const view = scene.cameras.main.worldView;
  for (const b of st.breakables) {
    if (b.broken) continue;
    if (bear) {
      const hit = secretHitPoint(b, bear);
      if (hit) { secretBreak(scene, b, { cause: 'bear', x: hit.x, y: hit.y }); continue; }
    }
    if (bearSoon && !b.trembled && secretHitPoint(b, bearSoon)) {
      b.trembled = true;
      secretTremble(scene, b, 3, 5);
    }
    if (!bearPending && !bearRect) b.trembled = false;
    if (melee && b.lastToken !== token) {
      const hit = secretHitPoint(b, melee);
      if (hit) {
        b.lastToken = token;
        if (b.by === 'bear') secretBreakableRefuse(scene, b, hit.x, hit.y);
        else secretBreakableHit(scene, b, hit.x, hit.y);
        if (b.broken) continue;
      }
    }
    // Indice « poussière » : un filet de terre de temps en temps, à l'écran seulement.
    if (b.data.hint === 'poussiere' && b.hintAt && now >= (b.dustAt || 0)) {
      b.dustAt = now + Phaser.Math.Between(3200, 6200);
      const a = b.hintAt;
      if (a.x > view.x - 40 && a.x < view.right + 40 && a.y > view.y - 40 && a.y < view.bottom + 40) {
        juiceParticles(scene, 'earth', a.x, a.y, { count: 2, power: 0.3, angle: [80, 100], speed: [10, 40] });
        juiceParticles(scene, 'dust', a.x, a.y, { count: 1, power: 0.3, tint: [0x8a7a68, 0xb4a690] });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Boutique (ShopScene, table SHOPS de src/data/shops_data.js)
// ---------------------------------------------------------------------------
// Registre `shopBought` = { 'boutique:article': nombre acheté } (stocks).
function shopBoughtCount(shopId, articleId) {
  const v = storyGet('shopBought');
  const n = v && typeof v === 'object' ? v[`${shopId}:${articleId}`] : 0;
  return Number.isFinite(n) ? n : 0;
}

// Articles d'une boutique, conditions (`requires` / `forbids`) appliquées,
// complétés (nom, description, icône, stock restant).
function shopArticles(shopId) {
  const def = typeof SHOPS !== 'undefined' ? SHOPS[shopId] : null;
  if (!def) return [];
  return (def.articles || []).filter((a) => a && a.id && storyAllowed(a)).map((a) => {
    const give = a.give || {};
    const first = [].concat(give)[0] || {};
    const infoId = first.consommable || first.item || null;
    const info = infoId ? itemInfo(infoId) : null;
    const name = a.name || (info && info.name) || (first.coeur ? 'Cœur entier' : a.id);
    const desc = a.desc || (info && info.desc) || (first.coeur ? '+1 cœur maximum, pour toujours.' : '');
    const bought = shopBoughtCount(shopId, a.id);
    const left = Number.isFinite(a.stock) ? Math.max(0, a.stock - bought) : null;
    return { ...a, give, name, desc, icon: a.icon || secretContentsIcon(give), left, owned: first.consommable ? consumableCount(first.consommable) : null };
  });
}

// Achat : { ok, reason?, text }. `reason` : 'eclats' (pas assez), 'stock'
// (épuisé), 'unknown'. Rien n'est retiré si l'achat échoue.
function shopBuy(scene, shopId, articleId) {
  const a = shopArticles(shopId).find((o) => o.id === articleId);
  if (!a) return { ok: false, reason: 'unknown', text: '' };
  if (a.left === 0) return { ok: false, reason: 'stock', text: 'Épuisé.' };
  const price = Math.max(0, Math.round(a.price || 0));
  if (eclatsCount() < price) {
    const miss = price - eclatsCount();
    return { ok: false, reason: 'eclats', text: `Il te manque ${miss} éclat${miss > 1 ? 's' : ''} de lune.` };
  }
  eclatsSpend(scene, price);
  const v = storyGet('shopBought');
  const bought = v && typeof v === 'object' ? { ...v } : {};
  const key = `${shopId}:${articleId}`;
  bought[key] = (bought[key] || 0) + 1;
  storySet('shopBought', bought);
  secretGrantContents(scene, a.give, { source: `shop:${key}#${bought[key]}`, silent: true });
  return { ok: true, text: `${a.name} : acheté !` };
}

// Ouvre la boutique par-dessus la zone (monde gelé). Promesse résolue à la fermeture.
function openShop(scene, shopId) {
  const def = typeof SHOPS !== 'undefined' ? SHOPS[shopId] : null;
  if (!def) {
    console.warn(`openShop : boutique "${shopId}" introuvable dans SHOPS.`);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    if (!scene.scene || scene.scene.isActive('ShopScene')) { resolve(); return; }
    hideStoryPrompt(scene);
    if (scene.player && scene.player.body) scene.player.setVelocityX(0);
    scene.scene.launch('ShopScene', { parentKey: scene.scene.key, shopId, onClose: resolve });
    scene.scene.bringToTop('ShopScene');
  });
}

// ---------------------------------------------------------------------------
// Boucle (monde non gelé) : butin, éclats, trésors, cassables.
// ---------------------------------------------------------------------------
function secretUpdateHook(scene, time, delta) {
  if (!scene.player || !scene.player.body || !scene.__story) return;
  secretState(scene);
  eclatsScanEnemies(scene);
  eclatsUpdate(scene, delta);
  treasuresUpdate(scene);
  breakablesUpdate(scene);
}
LEVEL_UPDATE_HOOKS.push(secretUpdateHook);
