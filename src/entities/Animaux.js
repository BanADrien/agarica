// Animaux décoratifs : bébés cochons, poissons, papillons — agent Ennemis.
//
// Purement décoratifs (aucun corps physique, aucun dégât). Clé de donnée de
// zone `animals: [{type: 'cochons'|'poissons'|'papillons', x, y, w?, h?, count?}]`
// (cf. LEVEL_DATA_HANDLERS.animals en bas). Les groupes de cochons et de
// poissons comptent TOUJOURS exactement 3 individus (repère visuel de
// l'histoire, cf. histoire/PLAN_CARTE_DEMO.md) : couleurs/tailles distinctes
// pour qu'on les compte d'un coup d'œil.
//
// API réutilisable par les autres agents (cinématiques Morgat / trou sombre) :
//   spawnButterflies(scene, x, y, count = 6, opts) → array de papillons
//   butterfliesFlyTo(list, x, y, ms = 1500) → Promise
//   butterfliesFollow(list, target, {offsetY}) / butterfliesDisperse(list, ms) → Promise
//   spawnPiglets(scene, x, y, {w}) → array (3) ; spawnFish(scene, x, y, w, h) → array (3)

// Poissons : profondeur 4, ENTRE les deux couches d'eau de la mare de la forêt
// sombre 2 (3 et 5, cf. acte1Fs2DrawMare dans src/story/acte1.js) -- à ne pas
// remonter. Cochons : personnages terrestres, devant les décors comme
// Agarica (cf. CHARACTER_DEPTH dans LevelKit.js).
const ANIMAL_DEPTH = 4;
const PIGLET_DEPTH = CHARACTER_DEPTH;
const BUTTERFLY_DEPTH = 960;
const PIGLET_COUNT = 3;
const FISH_COUNT = 3;

// ---------------------------------------------------------------------------
// Boucle de mise à jour commune (une par scène). Écoute l'événement 'update'
// de la scène plutôt que LEVEL_UPDATE_HOOKS : les papillons doivent rester
// animés PENDANT les cinématiques (monde gelé). Retirée au shutdown, sinon
// l'écouteur survivrait au redémarrage de la scène.
// ---------------------------------------------------------------------------
function registerAnimal(scene, animal) {
  if (!scene.__animalUpdaters) {
    scene.__animalUpdaters = [];
    const tick = (time, delta) => {
      const list = scene.__animalUpdaters;
      if (!list) return;
      for (let i = list.length - 1; i >= 0; i--) {
        const a = list[i];
        if (!a.active) list.splice(i, 1);
        else a.animalUpdate(time, Math.min(delta, 50));
      }
    };
    scene.events.on('update', tick);
    scene.events.once('shutdown', () => {
      scene.events.off('update', tick);
      scene.__animalUpdaters = null;
    });
  }
  scene.__animalUpdaters.push(animal);
  return animal;
}

function animalPlayer(scene) {
  return scene.player && scene.player.active ? scene.player : null;
}

// ---------------------------------------------------------------------------
// Bébés cochons : trottinent autour de leur point, s'écartent avec un petit
// saut quand Agarica approche.
// ---------------------------------------------------------------------------
const PIGLET_W = 28;
const PIGLET_H = 20;
const PIGLET_TINTS = [0xffffff, 0xffe0e6, 0xf6c9a8]; // rose, rose pâle, rose tacheté
const PIGLET_SCALES = [1, 0.9, 0.82];

function drawPiglet(g, legPhase) {
  const h = PIGLET_H;
  // Pattes (alternées selon la frame).
  g.fillStyle(0xd9788f, 1);
  const legs = legPhase ? [6, 11, 16, 21] : [7, 10, 17, 20];
  legs.forEach((lx, i) => g.fillRect(lx, h - 6 + ((i + legPhase) % 2 ? 1 : 0), 2.5, 5));
  // Corps, tête, groin, oreille, queue en tire-bouchon.
  g.fillStyle(0xf6a9bc, 1);
  g.fillEllipse(13, h - 9, 19, 11);
  g.fillCircle(21, h - 11, 6);
  g.fillStyle(0xe58aa2, 1);
  g.fillEllipse(26.5, h - 10, 4, 5);
  g.fillTriangle(17, h - 15, 20, h - 19, 21, h - 14);
  g.fillStyle(0x5a2a36, 1);
  g.fillCircle(22.5, h - 13, 1.1);
  g.fillCircle(27, h - 10.5, 0.6);
  g.lineStyle(1.2, 0xe58aa2, 1);
  g.beginPath();
  g.arc(3.5, h - 11, 2.2, 0, Math.PI * 1.6, false);
  g.strokePath();
}

function ensurePigletTextures(scene) {
  if (scene.textures.exists('bebe-cochon-1')) return;
  for (const phase of [0, 1]) {
    const g = scene.add.graphics();
    drawPiglet(g, phase);
    g.generateTexture(`bebe-cochon-${phase}`, PIGLET_W, PIGLET_H);
    g.destroy();
  }
  scene.anims.create({
    key: 'bebe-cochon-trot',
    frames: [{ key: 'bebe-cochon-0' }, { key: 'bebe-cochon-1' }],
    frameRate: 9,
    repeat: -1,
  });
}

// Pieds posés sur la surface de MARCHE (haut de la hitbox des tuiles, comme
// Agarica) et non sur le haut de l'image des tuiles : les cochons flottaient
// de 16 px. Ils suivent ensuite le relief en trottinant (storyFollowGround).
function pigletFootY(scene, x, y) {
  if (typeof groundStandYAt !== 'function') return y;
  return groundStandYAt(scene, x, y) ?? y;
}

// Un cochon ne trottine que là où il y a du sol à portée de pas (ni vide, ni
// mur de plus d'une case).
function pigletCanReach(scene, x, footY) {
  return typeof storyWalkSurfaceY !== 'function' || storyWalkSurfaceY(scene, x, footY) != null;
}

function spawnPiglets(scene, x, y, { w = 180 } = {}) {
  const useArt = typeof hasManifestArt === 'function' && hasManifestArt(scene, 'cochon_bebe');
  if (!useArt) ensurePigletTextures(scene);
  const minX = x - w / 2;
  const maxX = x + w / 2;
  const piglets = [];
  for (let i = 0; i < PIGLET_COUNT; i++) {
    const px = x + (i - 1) * 34;
    const groundY = pigletFootY(scene, px, y);
    let s;
    if (useArt) {
      s = addManifestSprite(scene, px, groundY, 'cochon_bebe', 'idle');
      s.setScale(s.scaleX * PIGLET_SCALES[i]);
    } else {
      s = scene.add.sprite(px, groundY, 'bebe-cochon-0').setOrigin(0.5, 1).setScale(PIGLET_SCALES[i]);
      s.setTint(PIGLET_TINTS[i]);
    }
    s.setDepth(PIGLET_DEPTH);
    s.animalKind = 'cochon';
    // `feet` : position des pieds suivie au sol ; le sprite y ajoute le petit
    // saut de surprise (`hop`) et le dandinement.
    const st = s.pigState = {
      feet: { x: px, y: groundY }, hop: 0, minX, maxX, targetX: px, speed: 40,
      pauseUntil: 400 * i, scareUntil: 0, hopping: false, phase: Math.random() * 10,
    };
    const setMoving = (moving) => {
      if (useArt) s.playManifest(moving ? 'walk' : 'idle');
      else if (moving) s.play('bebe-cochon-trot', true);
      else { s.anims.stop(); s.setTexture('bebe-cochon-0'); }
    };
    s.animalUpdate = (time, delta) => {
      const player = animalPlayer(scene);
      // Agarica approche : petit saut de surprise puis s'écarte d'elle.
      if (player && time > st.scareUntil
        && Math.abs(player.x - s.x) < 110 && Math.abs(player.y - s.y) < 100) {
        st.scareUntil = time + 1600;
        const away = s.x >= player.x ? 1 : -1;
        const fleeX = Phaser.Math.Clamp(s.x + away * Phaser.Math.Between(60, 90), minX - 50, maxX + 50);
        if (pigletCanReach(scene, fleeX, st.feet.y)) st.targetX = fleeX;
        st.speed = 125;
        st.pauseUntil = 0;
        if (!st.hopping) {
          st.hopping = true;
          scene.tweens.add({
            targets: st, hop: 16, duration: 140, yoyo: true, ease: 'Quad.easeOut',
            onComplete: () => { st.hopping = false; st.hop = 0; },
          });
        }
      }
      const dx = st.targetX - s.x;
      if (Math.abs(dx) < 2) {
        if (st.pauseUntil === 0) st.pauseUntil = time + Phaser.Math.Between(500, 1800);
        setMoving(false);
        s.y = st.feet.y - st.hop;
        if (time >= st.pauseUntil) {
          // Évite de s'empiler sur un frère : les 3 doivent rester comptables.
          for (let k = 0; k < 6; k++) {
            st.targetX = Phaser.Math.Between(minX, maxX);
            if (!pigletCanReach(scene, st.targetX, st.feet.y)) { st.targetX = s.x; continue; }
            if (piglets.every((o) => o === s || Math.abs((o.pigState ? o.pigState.targetX : o.x) - st.targetX) > 32)) break;
          }
          st.speed = Phaser.Math.Between(32, 50);
          st.pauseUntil = 0;
        }
        return;
      }
      const dir = Math.sign(dx);
      s.x += dir * Math.min(Math.abs(dx), (st.speed * delta) / 1000);
      st.feet.x = s.x;
      if (typeof storyFollowGround === 'function') storyFollowGround(scene, st.feet, delta / 1000, { dir, speed: st.speed });
      // L'art regarde à DROITE (convention des nouvelles feuilles).
      s.setFlipX(dir < 0);
      setMoving(true);
      // Dandinement : les pieds décollent à peine (jamais sous la surface).
      const waddle = st.hopping ? 0 : Math.abs(Math.sin(time / 70 + st.phase)) * 1.5;
      s.y = st.feet.y - st.hop - waddle;
    };
    registerAnimal(scene, s);
    piglets.push(s);
  }
  return piglets;
}

// ---------------------------------------------------------------------------
// Poissons : nagent dans un rectangle d'eau (x, y = coin haut-gauche, comme
// la clé `water`), aller-retour + ondulation ; filent si Agarica s'approche.
// ---------------------------------------------------------------------------
const FISH_TINTS = [0xff9a3c, 0x9fd8ff, 0xffd75a]; // orange, argent-bleu, doré
const FISH_SCALES = [1, 0.85, 0.72];

function ensureFishTexture(scene) {
  if (scene.textures.exists('poisson')) return;
  const g = scene.add.graphics();
  g.fillStyle(0xdddddd, 1);
  g.fillTriangle(1, 1, 7, 5.5, 1, 10); // queue
  g.fillTriangle(10, 2.5, 14, -1, 16, 3); // nageoire dorsale
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(13, 5.5, 15, 8);
  g.fillStyle(0xffffff, 0.9);
  g.fillEllipse(14, 4, 6, 2); // reflet
  g.fillStyle(0x10202a, 1);
  g.fillCircle(17.5, 4.5, 1.1);
  g.generateTexture('poisson', 22, 11);
  g.destroy();
}

function spawnFish(scene, x, y, w = 200, h = 60) {
  const useArt = typeof hasManifestArt === 'function' && hasManifestArt(scene, 'poisson');
  if (!useArt) ensureFishTexture(scene);
  const fishes = [];
  const minX = x + 14;
  const maxX = x + w - 14;
  for (let i = 0; i < FISH_COUNT; i++) {
    const laneY = y + h * (0.3 + 0.22 * i);
    const fx = minX + ((i + 0.5) / FISH_COUNT) * (maxX - minX);
    let f;
    if (useArt) {
      f = addManifestSprite(scene, fx, laneY, 'poisson', 'idle', { origin: [0.5, 0.5] });
      f.setScale(f.scaleX * FISH_SCALES[i]);
    } else {
      f = scene.add.image(fx, laneY, 'poisson').setScale(FISH_SCALES[i]).setTint(FISH_TINTS[i]);
    }
    f.setDepth(ANIMAL_DEPTH).setAlpha(0.9);
    f.animalKind = 'poisson';
    const st = {
      dir: i % 2 ? -1 : 1, speed: Phaser.Math.Between(26, 44), laneY,
      phase: Math.random() * 10, pauseUntil: 0, dartUntil: 0,
    };
    f.animalUpdate = (time, delta) => {
      const player = animalPlayer(scene);
      if (player && time > st.dartUntil + 800
        && Math.abs(player.x - f.x) < 80 && Math.abs(player.y - f.y) < 90) {
        st.dir = f.x >= player.x ? 1 : -1;
        st.dartUntil = time + 600;
        st.pauseUntil = 0;
      }
      if (time < st.pauseUntil) {
        f.y = st.laneY + Math.sin(time / 400 + st.phase) * 2;
        return;
      }
      const speed = time < st.dartUntil ? 140 : st.speed;
      f.x += (st.dir * speed * delta) / 1000;
      if (f.x <= minX || f.x >= maxX) {
        f.x = Phaser.Math.Clamp(f.x, minX, maxX);
        st.dir *= -1;
        st.pauseUntil = time + Phaser.Math.Between(200, 900);
        st.speed = Phaser.Math.Between(26, 44);
      }
      f.setFlipX(st.dir < 0);
      f.y = st.laneY + Math.sin(time / 300 + st.phase) * 4;
      f.angle = Math.sin(time / 90 + st.phase) * 6; // battement de queue
    };
    registerAnimal(scene, f);
    fishes.push(f);
  }
  return fishes;
}

// ---------------------------------------------------------------------------
// Papillons lumineux de Morgat : petits corps + halo additif rose/cyan,
// flottement sinusoïdal autour d'un point « maison » qui peut se déplacer
// (butterfliesFlyTo) ou suivre une cible (butterfliesFollow).
// ---------------------------------------------------------------------------
const BUTTERFLY_COLORS = [0xff8fd8, 0x8ff6ff, 0xffd6f2, 0xa8fff0, 0xffb0e0, 0x9fdcff];

function ensureButterflyTexture(scene) {
  if (scene.textures.exists('papillon')) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(4.5, 4, 8, 7); // aile haute gauche
  g.fillEllipse(11.5, 4, 8, 7); // aile haute droite
  g.fillStyle(0xeeeeee, 1);
  g.fillEllipse(5, 9, 5, 5);
  g.fillEllipse(11, 9, 5, 5);
  g.fillStyle(0x2a1f45, 1);
  g.fillRect(7.3, 2, 1.4, 9);
  g.generateTexture('papillon', 16, 12);
  g.destroy();
}

function spawnButterflies(scene, x, y, count = 6, { radius = 40, colors = BUTTERFLY_COLORS, depth = BUTTERFLY_DEPTH, follow = null, scale = 1.3 } = {}) {
  ensureButterflyTexture(scene);
  if (typeof ensureGlowDotTexture === 'function') ensureGlowDotTexture(scene);
  const useArt = typeof hasManifestArt === 'function' && hasManifestArt(scene, 'papillon');
  const list = [];
  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];
    const halo = scene.add.image(0, 0, FX_GLOW_DOT_KEY)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(color).setScale(1.1).setAlpha(0.55);
    const wings = useArt
      ? addManifestSprite(scene, 0, 0, 'papillon', 'idle', { origin: [0.5, 0.5] })
      : scene.add.image(0, 0, 'papillon').setTint(color);
    const c = scene.add.container(x, y, [halo, wings]).setDepth(depth).setScale(scale);
    c.animalKind = 'papillon';
    c.butterfly = {
      homeX: x + Phaser.Math.Between(-radius / 2, radius / 2),
      homeY: y + Phaser.Math.Between(-radius / 3, radius / 3),
      rx: radius * Phaser.Math.FloatBetween(0.5, 1),
      ry: radius * Phaser.Math.FloatBetween(0.3, 0.6),
      fx: Phaser.Math.FloatBetween(0.0008, 0.0016),
      fy: Phaser.Math.FloatBetween(0.0014, 0.0026),
      phase: Math.random() * Math.PI * 2,
      flap: Phaser.Math.FloatBetween(0.025, 0.04),
      follow, offX: 0, offY: 0,
      wings, halo,
    };
    const b = c.butterfly;
    b.offX = b.homeX - x;
    b.offY = b.homeY - y;
    c.animalUpdate = (time) => {
      if (b.follow) {
        if (!b.follow.active) b.follow = null;
        else {
          b.homeX = b.follow.x + b.offX;
          b.homeY = b.follow.y + b.offY;
        }
      }
      const px = c.x;
      c.x = b.homeX + Math.cos(time * b.fx + b.phase) * b.rx;
      c.y = b.homeY + Math.sin(time * b.fy + b.phase) * b.ry;
      // Battement d'ailes (vue de face : compression horizontale).
      b.wings.scaleX = (useArt ? b.wings.scaleY : 1) * (0.25 + 0.75 * Math.abs(Math.sin(time * b.flap + b.phase)));
      if (c.x !== px) b.wings.setFlipX(c.x < px);
      b.halo.setAlpha(0.4 + 0.25 * Math.sin(time * 0.004 + b.phase));
    };
    // Apparition en douceur.
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, duration: 500, delay: i * 60 });
    registerAnimal(scene, c);
    list.push(c);
  }
  return list;
}

// Déplace le « point maison » de la nuée vers (x, y) en ms ; les papillons
// gardent leur flottement pendant le trajet. Détache un éventuel suivi.
function butterfliesFlyTo(list, x, y, ms = 1500) {
  const alive = (list || []).filter((c) => c && c.active && c.butterfly);
  if (!alive.length) return Promise.resolve();
  return Promise.all(alive.map((c, i) => new Promise((resolve) => {
    const b = c.butterfly;
    b.follow = null;
    const spread = Math.max(10, Math.min(b.rx, 40));
    c.scene.tweens.add({
      targets: b,
      homeX: x + Phaser.Math.Between(-spread, spread),
      homeY: y + Phaser.Math.Between(-spread / 2, spread / 2),
      duration: ms,
      delay: i * 40,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        b.offX = b.homeX - x;
        b.offY = b.homeY - y;
        resolve();
      },
    });
  }))).then(() => undefined);
}

// La nuée accompagne une cible (ex. Agarica) en restant autour d'elle.
function butterfliesFollow(list, target, { offsetY = -60, radius = 30 } = {}) {
  for (const c of list || []) {
    if (!c || !c.active || !c.butterfly) continue;
    const b = c.butterfly;
    b.follow = target;
    b.offX = Phaser.Math.Between(-radius, radius);
    b.offY = offsetY + Phaser.Math.Between(-radius / 2, radius / 2);
    b.rx = Math.min(b.rx, radius);
    b.ry = Math.min(b.ry, radius / 2);
  }
}

// La nuée s'envole vers le haut et disparaît.
function butterfliesDisperse(list, ms = 1200) {
  const alive = (list || []).filter((c) => c && c.active);
  return Promise.all(alive.map((c) => new Promise((resolve) => {
    if (c.butterfly) c.butterfly.follow = null;
    c.scene.tweens.add({
      targets: c.butterfly || c,
      homeY: (c.butterfly ? c.butterfly.homeY : c.y) - 160,
      homeX: (c.butterfly ? c.butterfly.homeX : c.x) + Phaser.Math.Between(-80, 80),
      duration: ms,
    });
    c.scene.tweens.add({
      targets: c, alpha: 0, duration: ms, onComplete: () => { c.destroy(); resolve(); },
    });
  }))).then(() => undefined);
}

// ---------------------------------------------------------------------------
// Clé de donnée de zone `animals`.
// ---------------------------------------------------------------------------
function spawnAnimalsFromData(scene, list) {
  const out = { cochons: [], poissons: [], papillons: [] };
  for (const a of list || []) {
    if (a.type === 'cochons') out.cochons.push(...spawnPiglets(scene, a.x, a.y, { w: a.w ?? 180 }));
    else if (a.type === 'poissons') out.poissons.push(...spawnFish(scene, a.x, a.y, a.w ?? 200, a.h ?? 60));
    else if (a.type === 'papillons') {
      out.papillons.push(...spawnButterflies(scene, a.x, a.y, a.count ?? 6, { radius: (a.w ?? 80) / 2 }));
    }
  }
  scene.animals = out;
  return out;
}

if (typeof LEVEL_DATA_HANDLERS !== 'undefined') {
  LEVEL_DATA_HANDLERS.animals = (scene, list) => spawnAnimalsFromData(scene, list);
}
