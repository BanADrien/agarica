// Les quatre ours du premier test des familles (2026-11-12, cf.
// docs/production/FAMILLES_DESIGN.md) : GRIZZLY (forme au sol), OURS-HIBOU
// (forme aérienne), PANDA et OURS POLAIRE (compétences). Chargé APRÈS
// Player.js, Projectiles.js et Familles.js (index.html).
//
// Player.js garde la mécanique des formes (touches, sauts, emplacements) et
// appelle les fonctions `urside…` d'ici pour ce qui est propre aux ours :
// images provisoires, poses, élan du grizzly, pics de glace, effets.
//
// IMAGES (2026-11-13) : les vraies feuilles sont livrées (ids du manifeste :
// `grizzly`, `ours_hibou`, `panda`, `ours_polaire`, et `ours_brun` qui remplace
// l'ancien ours de la compétence « ours », cf. PROMPT_CODEX_14.md). Tailles à
// l'écran fixées par l'utilisateur, en longueur de l'animal à quatre pattes :
// ours-hibou 190 px, grizzly 170, ours polaire 165, ours brun 150, panda 150
// (`scale` du manifeste ; échelles par image : URSIDE_FRAME_K ci-dessous).
// REPLI, seulement si une feuille manque : l'ANCIEN ours (`ours-0` à `ours-5`,
// assets/sprites/ours_frames/, chargé alors par BootScene) recoloré pixel par
// pixel dans un canvas -- aucun fichier écrit (hasManifestArt partout).
// Effets : poussière et pierres des fracas = images pixelfx (FRACAS_FX,
// tools/pixelfx/bear-slam.js) ; glace, traits de vitesse = dessinés par code
// en gros pixels nets, grain de 2 px d'écran, sans dégradé.

// ---------------------------------------------------------------------------
// Réglages (valeurs de départ de FAMILLES_DESIGN.md, ajustées en jouant)
// ---------------------------------------------------------------------------
// Échelle des images PROVISOIRES (ancien ours recoloré, 521 px de long) : ~135 x 78 px
// à l'écran. Les vraies feuilles ont leur `scale` au manifeste.
const URSIDE_FORM_SCALE = 0.26;

// Feuilles des cinq ours (ids du manifeste). Une seule manque -> BootScene
// charge aussi l'ancien ours, qui sert de repli (ursideLegacyBearNeeded).
const URSIDE_SHEET_IDS = ['ours_brun', 'grizzly', 'ours_hibou', 'panda', 'ours_polaire'];

// Images dessinées à une autre échelle que le reste de leur feuille : facteur à
// appliquer à l'échelle de la feuille, par rangée et par image (1 = rien).
//  - grizzly : dans la course et la charge, les deux foulées allongées sont
//    dessinées plus petites (elles remplissent la même case que l'ours ramassé :
//    œil-oreille à 65 et 57 px contre 75) ; le saut aussi (64 px). Sans cela
//    l'ours « pompe » en courant.
//  - ours brun : la pose patte levée est dessinée un peu plus petite.
// Les pieds restent au sol (origine en bas) et le corps physique ne change pas.
// Le pixel art est fait avec ces mêmes facteurs (tools/pixelfix_ours.sh) : si
// on en change un ici, le changer là-bas aussi.
const URSIDE_FRAME_K = {
  grizzly: { run: [1, 1.15, 1.3, 1], charge: [1, 1.1, 1.25, 1], jump: [1.15, 1.15, 1.15] },
  ours_brun: { slam: [1, 1.1, 1, 1, 1, 1] },
};
// Rangées `transform` : l'image 0 est Agarica, dessinée ~250 px de haut alors
// qu'elle en fait 83 à l'écran ; la dernière est l'animal, à l'échelle de sa
// feuille. Entre les deux, la part du chemin parcourue par chaque image (petit
// pas d'abord, grand ensuite : la surface vue grandit avec le carré).
const URSIDE_AGARICA_SCALE = 83 / 250;
const URSIDE_TRANSFO_STEPS = [0, 0.25, 0.7, 1];

let ursideFrameScaleMap = null;
// Échelle d'affichage propre à une image (clé de texture du manifeste), ou
// null si elle suit simplement l'échelle de sa feuille. Lue par les poses du
// grizzly, par les compétences d'ours et par les transformations (Player.js).
function ursideFrameScale(key) {
  if (!ursideFrameScaleMap) {
    ursideFrameScaleMap = new Map();
    const manifest = getAssetManifest();
    for (const id of URSIDE_SHEET_IDS) {
      const def = manifest[id];
      if (!def || !def.scale) continue;
      if (def.anims && def.anims.transform) {
        URSIDE_TRANSFO_STEPS.forEach((k, i) => ursideFrameScaleMap.set(
          manifestFrameKey(id, 'transform', i), URSIDE_AGARICA_SCALE + (def.scale - URSIDE_AGARICA_SCALE) * k,
        ));
      }
      for (const [anim, ks] of Object.entries(URSIDE_FRAME_K[id] || {})) {
        ks.forEach((k, i) => { if (k !== 1) ursideFrameScaleMap.set(manifestFrameKey(id, anim, i), def.scale * k); });
      }
    }
  }
  return ursideFrameScaleMap.get(key) || null;
}

// Vrai si l'ancien ours doit être chargé (BootScene) : la feuille de l'ours
// brun manque (il reprend alors sa place), ou celle d'un autre ours (il sert
// d'image provisoire, recoloré). Toutes livrées : il n'est plus chargé du tout.
function ursideLegacyBearNeeded() {
  const manifest = getAssetManifest();
  return !URSIDE_SHEET_IDS.every((id) => {
    const def = manifest[id];
    return def && Object.values(def.anims || {}).every((a) => assetPresent(`${def.dir}/${def.prefix}_row${a.row}_0.png`));
  });
}

const GRIZZLY_TUNING = {
  // Il part moins vite que le loup (396) et le dépasse au bout de l'élan.
  startSpeed: 230,
  topSpeed: 470,
  rampMs: 1500,
  acceleration: 1700,
  // Charge au-delà de 85 % de la vitesse max (~400 px/s).
  chargeRatio: 0.85,
  // Saut du loup (-680), un peu plus court.
  jumpVelocity: -630,
  // Percussion : projection en arrière et vers le haut, sans dégât.
  crashVx: 290,
  crashVy: -540,
  crashInvulnMs: 600,
  // Directions ignorées pendant presque tout le vol : tenir « avant » ne la
  // ramène pas contre ce qu'elle vient de percuter.
  crashLockMs: 520,
  // Corps physique (px du monde) : large et bas, comme le loup (86 x 54), à la
  // mesure de l'ours affiché (170 px de long, ~125 de haut avec la crête) :
  // les deux tiers de sa longueur, pas plus haut qu'Agarica debout (67 px : pas de
  // surprise sous un plafond en changeant de forme).
  bodyW: 112,
  bodyH: 66,
  // Zone de l'impact devant lui (ennemis, blocs de l'ours).
  impactW: 64,
  impactH: 96,
  impactMs: 90,
};

const OWLBEAR_TUNING = {
  // Chute minimale depuis le sommet du 2e saut pour que le fracas parte.
  minFall: 64,
  slamMs: 400,
  // Même zone que la compétence ours (SKILL_DEFS.ours).
  hitboxWidth: 220,
  hitboxHeight: 40,
};

const PANDA_TUNING = { cost: 45, eatMs: 700, scale: 0.28 };

const POLAR_TUNING = {
  cost: 40,
  // Dressé (signal lisible) avant que la glace parte.
  rearMs: 450,
  spikes: 5,
  reach: 320,
  spikeEveryMs: 70,
  // Largeur de la zone de dégâts d'un pic, et hauteurs (le gros : deux fois).
  spikeW: 28,
  spikeH: 48,
  bigW: 44,
  bigH: 96,
  riseMs: 110,
  hurtMs: 260,
  meltMs: 1000,
  // Écart de hauteur toléré entre deux pics (le sol « suivi ») ; au-delà : vide ou mur.
  stepUp: 8,
  stepDown: 16,
};

// ---------------------------------------------------------------------------
// Images provisoires : l'ours actuel recoloré dans un canvas
// ---------------------------------------------------------------------------
const URSIDE_SOURCE_FRAMES = 6;
// Œil de l'ours dans chaque image `ours-i` (px du canevas 705x396) : repère des
// retouches (masque de l'ours-hibou, taches du panda). Mesuré sur les images ;
// l'œil vert est aussi cherché dans les pixels (ursideFindEye), ceci est le repli.
const URSIDE_EYES = [
  { x: 566, y: 206 }, { x: 490, y: 186 }, { x: 440, y: 262 },
  { x: 440, y: 260 }, { x: 426, y: 244 }, { x: 484, y: 234 },
];
// Les retouches posées par-dessus (masque, taches) se décident par blocs de
// cette taille (px source) : des bords en marches d'escalier, au grain du dessin.
const URSIDE_BLOCK = 6;

function ursideFindEye(data, w, h, fallback) {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      // Vert vif de l'œil : rien d'autre n'est aussi vert sur l'ours.
      if (data[i + 3] > 200 && data[i + 1] > 170 && data[i] < 120 && data[i + 2] < 140) { sx += x; sy += y; n += 1; }
    }
  }
  return n >= 3 ? { x: sx / n, y: sy / n } : fallback;
}

// Une recette par variante : (r, g, b, x, y, ctx) -> [r, g, b] ou null (pixel
// inchangé). `ctx` : { eye, lum, bx, by } (œil, luminosité 0-255, centre du
// bloc de retouche). Les contours très sombres restent sombres partout.
const URSIDE_RECIPES = {
  // Grizzly : plus sombre, dos grisonnant, œil ambre.
  grizzly(r, g, b, x, y, c) {
    if (c.eyePixel) return [255, 170, 60];
    const back = c.by < c.eye.y - 34 && c.lum > 70 ? 22 : 0;
    return [r * 0.56 + back, g * 0.52 + back, b * 0.55 + back];
  },
  // Ours polaire : blanc bleuté, ombres bleues ; la terre du fracas devient glace.
  polaire(r, g, b, x, y, c) {
    if (c.eyePixel) return [40, 60, 110];
    if (c.lum < 34) return [44, 62, 96];
    const v = Math.min(255, 138 + c.lum * 0.95);
    return [v - 26, v - 8, Math.min(255, v + 12)];
  },
  // Panda : blanc, pattes, épaules, oreilles et tour de l'œil noirs.
  panda(r, g, b, x, y, c) {
    if (c.eyePixel) return [245, 245, 235];
    const dEye = Math.hypot(c.bx - c.eye.x, c.by - (c.eye.y + 4));
    const dEar = Math.hypot(c.bx - (c.eye.x - 46), c.by - (c.eye.y - 40));
    const legs = c.by > c.box.y1 - (c.box.y1 - c.box.y0) * 0.36;
    const shoulder = c.bx > c.eye.x - 196 && c.bx < c.eye.x - 124 && c.by > c.eye.y - 36;
    if (dEye < 20 || dEar < 22 || legs || shoulder) {
      const k = 18 + c.lum * 0.22;
      return [k, k, k + 6];
    }
    if (c.lum < 34) return [36, 34, 44];
    const v = Math.min(255, 150 + c.lum * 0.85);
    return [v, v - 2, v - 14];
  },
  // Ours-hibou : plumage gris-brun, masque de plumes clair, grand œil ambre, bec.
  owlbear(r, g, b, x, y, c) {
    const ex = c.eye.x;
    const ey = c.eye.y;
    const d = Math.hypot(c.bx - ex, c.by - ey);
    if (d < 7) return [40, 26, 20];
    if (d < 15) return [255, 190, 50];
    // Bec : le museau, devant et sous l'œil.
    if (c.bx > ex + 26 && c.bx < ex + 62 && c.by > ey + 6 && c.by < ey + 44) return c.lum < 34 ? [70, 40, 16] : [236, 150, 40];
    if (d < 50 && c.lum >= 34) {
      const v = Math.min(255, 168 + c.lum * 0.7);
      return [v, v - 8, v - 30];
    }
    // Plumes : damier clair sur le poitrail et le dos.
    const speck = ((Math.floor(c.bx / 12) + Math.floor(c.by / 12)) % 2 === 0) && c.lum > 60 ? 26 : 0;
    return [r * 0.66 + speck, g * 0.64 + speck, b * 0.86 + speck];
  },
};

// Aigrettes de l'ours-hibou : deux triangles de plumes AJOUTÉS au-dessus de la
// tête (pixels transparents de l'image d'origine), en blocs.
function ursideOwlTufts(data, w, h, eye) {
  const B = URSIDE_BLOCK;
  const put = (x, y, r, g, b) => {
    for (let yy = y; yy < y + B; yy++) {
      for (let xx = x; xx < x + B; xx++) {
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const i = (yy * w + xx) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
      }
    }
  };
  for (const [cx, lean] of [[eye.x - 44, -1], [eye.x - 12, 1]]) {
    const baseY = Math.floor((eye.y - 44) / B) * B;
    for (let row = 0; row < 5; row++) {
      const half = Math.max(0, 2 - Math.floor(row / 2));
      for (let k = -half; k <= half; k++) {
        const x = Math.floor((cx + k * B + lean * row * 2) / B) * B;
        const edge = k === -half || k === half || row === 4;
        put(x, baseY - row * B, edge ? 44 : 150, edge ? 30 : 120, edge ? 40 : 96);
      }
    }
  }
}

// Clé de la texture recolorée `<variante>-ours-<i>`, fabriquée au premier
// besoin. Replis : image d'origine absente, ou pixels illisibles (page ouverte
// en file:// : canvas « tainted ») -> la clé de l'ours d'origine, sans retouche.
function ursideVariantTexture(scene, variant, i) {
  const srcKey = `ours-${i}`;
  const key = `${variant}-ours-${i}`;
  const tm = scene.textures;
  if (tm.exists(key)) return key;
  scene.game.__ursideNoRecolor = scene.game.__ursideNoRecolor || {};
  if (scene.game.__ursideNoRecolor[key] || !tm.exists(srcKey) || !URSIDE_RECIPES[variant]) return srcKey;
  const src = tm.get(srcKey).getSourceImage();
  const w = src.width;
  const h = src.height;
  const scratch = document.createElement('canvas');
  scratch.width = w;
  scratch.height = h;
  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(src, 0, 0);
  let img;
  try {
    img = sctx.getImageData(0, 0, w, h);
  } catch (e) {
    scene.game.__ursideNoRecolor[key] = true;
    return srcKey;
  }
  const d = img.data;
  const eye = ursideFindEye(d, w, h, URSIDE_EYES[i] || URSIDE_EYES[0]);
  // Boîte des pixels visibles (pattes du panda : le tiers bas).
  const box = { x0: w, y0: h, x1: 0, y1: 0 };
  for (let y = 0; y < h; y += 3) {
    for (let x = 0; x < w; x += 3) {
      if (d[(y * w + x) * 4 + 3] > 40) {
        if (x < box.x0) box.x0 = x;
        if (x > box.x1) box.x1 = x;
        if (y < box.y0) box.y0 = y;
        if (y > box.y1) box.y1 = y;
      }
    }
  }
  const recipe = URSIDE_RECIPES[variant];
  const B = URSIDE_BLOCK;
  const c = { eye, box, lum: 0, bx: 0, by: 0, eyePixel: false };
  for (let y = 0; y < h; y++) {
    c.by = Math.floor(y / B) * B + B / 2;
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      if (d[p + 3] === 0) continue;
      const r = d[p];
      const g = d[p + 1];
      const b = d[p + 2];
      c.bx = Math.floor(x / B) * B + B / 2;
      c.lum = (r * 3 + g * 4 + b) / 8;
      c.eyePixel = g > 170 && r < 120 && b < 140;
      const out = recipe(r, g, b, x, y, c);
      if (!out) continue;
      d[p] = Math.max(0, Math.min(255, out[0]));
      d[p + 1] = Math.max(0, Math.min(255, out[1]));
      d[p + 2] = Math.max(0, Math.min(255, out[2]));
    }
  }
  if (variant === 'owlbear') ursideOwlTufts(d, w, h, eye);
  const tex = tm.createCanvas(key, w, h);
  tex.getContext().putImageData(img, 0, 0);
  tex.refresh();
  // Même filtre que l'image d'origine (pixel art net si elle l'est).
  const srcSource = tm.get(srcKey).source[0];
  if (srcSource && srcSource.scaleMode === Phaser.ScaleModes.NEAREST) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

function ursideVariantFrames(scene, variant, indices) {
  return indices.map((i) => ({ key: ursideVariantTexture(scene, variant, i) }));
}

// Anim provisoire `<clé>` sur les images recolorées (créée une fois).
function ursideEnsureAnim(scene, key, variant, indices, ms) {
  if (scene.anims.exists(key)) return key;
  const frames = ursideVariantFrames(scene, variant, indices);
  scene.anims.create({ key, frames, frameRate: frames.length / (ms / 1000), repeat: 0 });
  return key;
}

// Anim d'une vraie feuille du manifeste recalée sur une durée (`<id>-<anim>-t<ms>`),
// ou null si la rangée n'est pas livrée.
// `anim` : une rangée, ou plusieurs jouées à la suite (['rear', 'slam']) --
// toutes doivent être livrées.
function ursideManifestTimedAnim(scene, id, anim, ms, reverse = false) {
  const rows = Array.isArray(anim) ? anim : [anim];
  if (!rows.every((a) => hasManifestArt(scene, id, a))) return null;
  const key = `${id}-${rows.join('+')}-${reverse ? 'r' : 't'}${Math.round(ms)}`;
  if (!scene.anims.exists(key)) {
    const frames = rows.flatMap((a) => manifestAnimFrames(scene, id, a));
    if (!frames.length) return null;
    if (reverse) frames.reverse();
    scene.anims.create({ key, frames, frameRate: frames.length / (ms / 1000), repeat: 0 });
  }
  return key;
}

// Corps physique d'une taille monde donnée, centré, pieds en bas du canevas.
function ursideBody(frameW, frameH, scale, worldW, worldH) {
  const width = worldW / scale;
  const height = worldH / scale;
  return { width, height, offsetX: (frameW - width) / 2, offsetY: frameH - height };
}

// ---------------------------------------------------------------------------
// Formes : grizzly (sol) et ours-hibou (aérien)
// ---------------------------------------------------------------------------
const URSIDE_FORM_ART = {
  // id de forme -> id du manifeste, variante provisoire, rangée de référence.
  grizzly: { manifest: 'grizzly', variant: 'grizzly', anim: 'run' },
  owlbear: { manifest: 'ours_hibou', variant: 'owlbear', anim: 'jump' },
};

// Entrée de FORMS (Player.js) pour une forme d'ours : vraie feuille si elle
// existe, sinon l'image provisoire. `provisional: false` tant que la forme
// n'est pas débloquée : on ne fabrique pas d'image pour rien.
function ursideFormConfig(scene, formId, { provisional = true } = {}) {
  const art = URSIDE_FORM_ART[formId];
  const def = getAssetManifest()[art.manifest] || {};
  let texture;
  let scale;
  if (hasManifestArt(scene, art.manifest, art.anim)) {
    texture = manifestFrameKey(art.manifest, art.anim, 0);
    scale = def.scale || URSIDE_FORM_SCALE;
  } else {
    texture = provisional ? ursideVariantTexture(scene, art.variant, 0) : 'ours-0';
    scale = URSIDE_FORM_SCALE;
  }
  const src = scene.textures.get(texture).getSourceImage();
  const body = formId === 'grizzly'
    ? ursideBody(src.width, src.height, scale, GRIZZLY_TUNING.bodyW, GRIZZLY_TUNING.bodyH)
    // Forme aérienne : gabarit humain, comme le singe (aucune surprise de collision en l'air).
    : transfoBodyConfig(src.width, src.height, scale);
  return { texture, scale, frameWidth: src.width, frameHeight: src.height, body, ready: provisional };
}

// Appelé par le constructeur de Player : formes d'ours dans FORMS, art des
// compétences, et images provisoires des ours DÉJÀ débloqués -- fabriquées ici,
// pendant le chargement de la zone, pas au premier usage : recolorer une image
// prend quelques dizaines de ms, de quoi faire sauter une image en plein
// fracas. Sans ours débloqué : rien n'est fabriqué.
function ursideSetupPlayer(scene, player) {
  ursideRefreshSkillArt(scene);
  for (const formId of Object.keys(URSIDE_FORM_ART)) {
    const unlocked = !!player[FORM_FLAG_BY_ID[formId]];
    FORMS[formId] = ursideFormConfig(scene, formId, { provisional: unlocked });
    if (hasManifestArt(scene, URSIDE_FORM_ART[formId].manifest)) ensureManifestAnims(scene, URSIDE_FORM_ART[formId].manifest);
    if (unlocked) ursidePrepareForm(scene, formId);
  }
  for (const id of ['panda', 'ours_polaire']) {
    if (player.unlockedSkills.has(id)) ursideEnsureSkillArt(scene, SKILL_DEFS[id]);
  }
}

// Toutes les images provisoires d'une forme (poses en l'air, fracas).
function ursidePrepareForm(scene, formId) {
  if (formId !== 'owlbear') return;
  if (!hasManifestArt(scene, 'ours_hibou', 'jump')) ursideVariantFrames(scene, 'owlbear', [0, 1]);
  ursideEnsureSkillArt(scene, INTERNAL_SKILL_DEFS.owlbear_slam);
}

// Player.setForm : la forme vient d'être débloquée en cours de jeu -> ses
// images provisoires (un à-coup, une seule fois).
function ursideEnsureForm(scene, formId) {
  if (!URSIDE_FORM_ART[formId]) return;
  if (!FORMS[formId] || !FORMS[formId].ready) {
    FORMS[formId] = ursideFormConfig(scene, formId);
    ursidePrepareForm(scene, formId);
  }
}

// Transformation dessinée d'une forme d'ours (rangée `transform` de sa vraie
// feuille), dans un sens ou dans l'autre : { key, ms, scale, body } ou null.
// Sans feuille : bascule nette + éclat (comme le singe sans art).
const URSIDE_TRANSFO_MS = 200;
function ursideFormTransfo(scene, formId, reverse) {
  const art = URSIDE_FORM_ART[formId];
  if (!art) return null;
  const key = ursideManifestTimedAnim(scene, art.manifest, 'transform', URSIDE_TRANSFO_MS, reverse);
  if (!key) return null;
  const def = getAssetManifest()[art.manifest] || {};
  const scale = def.scale || URSIDE_FORM_SCALE;
  const src = scene.textures.get(manifestFrameKey(art.manifest, 'transform', 0)).getSourceImage();
  return { key, ms: URSIDE_TRANSFO_MS, scale, body: transfoBodyConfig(src.width, src.height, scale) };
}

// Pose du grizzly (branche `form === 'grizzly'` de Player.update). Vraie
// feuille : `charge` en charge, `run` en course, `jump` en l'air. Provisoire :
// une seule image -- le galop est rendu par un balancement du corps.
function ursideGrizzlyPose(p, now, s) {
  const sc = p.scene;
  const speed = Math.abs(p.body.velocity.x);
  if (hasManifestArt(sc, 'grizzly', 'run')) {
    if (!s.onGround && hasManifestArt(sc, 'grizzly', 'jump')) {
      const frames = manifestAnimFrames(sc, 'grizzly', 'jump');
      p.anims.stop();
      p.setTexture(frames[Math.min(frames.length - 1, p.body.velocity.y < 0 ? 0 : 1)].key);
    } else if (speed < 40 && s.dir === 0) {
      p.anims.stop();
      p.setTexture(manifestFrameKey('grizzly', 'run', 0));
    } else {
      playManifestOn(p, 'grizzly', p.grizzlyCharging && hasManifestArt(sc, 'grizzly', 'charge') ? 'charge' : 'run');
    }
    ursideGrizzlyFrameScale(p);
    return;
  }
  p.anims.stop();
  p.setTexture(ursideVariantTexture(sc, 'grizzly', 0));
  const dt = Math.min(50, sc.game.loop.delta || 16) / 1000;
  let rot = 0;
  if (!s.onGround) {
    rot = p.body.velocity.y < 0 ? -0.16 : 0.12;
  } else if (speed > 40) {
    // Foulée : d'autant plus rapide qu'il court vite.
    p.grizzlyStride = (p.grizzlyStride || 0) + dt * (7 + speed * 0.028);
    rot = Math.sin(p.grizzlyStride) * (p.grizzlyCharging ? 0.085 : 0.06);
  }
  p.setRotation(rot * (p.facingDir >= 0 ? 1 : -1));
  // Rotation remise à zéro à l'image suivante (Player.resetVineArtAnchor).
  p.vineArtAnchored = true;
}

// Image du grizzly dessinée à une autre échelle que sa feuille (foulées
// allongées, saut : URSIDE_FRAME_K) : son échelle, et le MÊME corps physique
// recalculé pour elle (taille monde et position inchangées, pieds au sol).
const URSIDE_GRIZZLY_BODIES = new Map();
function ursideGrizzlyFrameScale(p) {
  const key = p.texture.key;
  const scale = ursideFrameScale(key);
  if (!scale) return;
  let body = URSIDE_GRIZZLY_BODIES.get(key);
  if (!body) {
    body = ursideBody(p.frame.realWidth, p.frame.realHeight, scale, GRIZZLY_TUNING.bodyW, GRIZZLY_TUNING.bodyH);
    URSIDE_GRIZZLY_BODIES.set(key, body);
  }
  p.applyBodyForScale(scale, body);
}

// Pose de l'ours-hibou en l'air : `jump` en montée, `fall` en chute ;
// provisoire : patte levée en montée, corps penché vers le sol en chute.
function ursideOwlbearPose(p) {
  const sc = p.scene;
  const rising = p.body.velocity.y < 0;
  if (hasManifestArt(sc, 'ours_hibou', 'jump')) {
    playManifestOn(p, 'ours_hibou', !rising && hasManifestArt(sc, 'ours_hibou', 'fall') ? 'fall' : 'jump');
    return;
  }
  p.anims.stop();
  p.setTexture(ursideVariantTexture(sc, 'owlbear', rising ? 1 : 0));
  p.setRotation((rising ? -0.1 : 0.3) * (p.facingDir >= 0 ? 1 : -1));
  p.vineArtAnchored = true;
}

// ---------------------------------------------------------------------------
// Grizzly : élan, charge, percussion
// ---------------------------------------------------------------------------
// Appelée chaque image où le grizzly court (Player.update) : fait monter
// l'élan et renvoie l'accélération et la vitesse permise. L'élan (0 à 1) ne
// monte qu'en courant vraiment, au sol, dans le même sens ; il se garde en
// l'air et retombe vite dès qu'il s'arrête ou fait demi-tour.
function ursideGrizzlyRun(p, now, s) {
  const T = GRIZZLY_TUNING;
  const dt = Math.min(50, p.scene.game.loop.delta || 16);
  const vx = p.body.velocity.x;
  const speed = Math.abs(vx);
  const allowed = T.startSpeed + (T.topSpeed - T.startSpeed) * p.grizzlyRamp;
  const pushing = s.dir !== 0 && Math.sign(vx) === s.dir && speed >= allowed * 0.9 - 6;
  if (pushing) {
    if (s.onGround) p.grizzlyRamp = Math.min(1, p.grizzlyRamp + dt / T.rampMs);
  } else if (s.dir === 0 || Math.sign(vx) === -s.dir || speed < T.startSpeed * 0.5) {
    p.grizzlyRamp = Math.max(0, p.grizzlyRamp - dt / 180);
  }
  const charging = speed >= T.topSpeed * T.chargeRatio;
  if (charging && !p.grizzlyCharging) p.grizzlyChargeId = (p.grizzlyChargeId || 0) + 1;
  p.grizzlyCharging = charging;
  if (charging) p.grizzlyChargeDir = vx >= 0 ? 1 : -1;
  if (charging) ursideChargeFx(p, now, s);
  return { acceleration: T.acceleration, maxSpeed: T.startSpeed + (T.topSpeed - T.startSpeed) * p.grizzlyRamp };
}

// Contact d'un ennemi avec le grizzly EN CHARGE (overlap joueur / ennemis de
// LevelKit). Vrai si la charge a réglé le contact : petit ennemi tué, ou gros
// ennemi percuté (1 dégât, fin de la forme, projection). Faux : contact
// ordinaire (sous le seuil de charge, ennemi dans le dos, coup paré).
// « Gros » = propriété explicite `enemy.heavy` (boss, mannequin, loup alpha).
function ursideChargeContact(scene, player, enemy) {
  if (!player.grizzlyCharging || player.form !== 'grizzly' || !enemy || enemy.defeated) return false;
  const dir = player.grizzlyChargeDir || 1;
  const ex = enemy.body ? enemy.body.center.x : enemy.x;
  // Un ennemi qui le rattrape par derrière n'est pas « sur sa route ».
  if ((ex - player.body.center.x) * dir < -12) return false;
  const source = { kind: 'charge', player, x: player.x, y: player.y };
  if (typeof enemy.blocksHit === 'function' && enemy.blocksHit(source)) return false;
  const now = scene.time.now;
  if (enemy.heavy) {
    damageEnemy(scene, enemy, { ...source, token: `charge-${player.grizzlyChargeId}` });
    player.grizzlyCrash(now, dir, { enemy });
    return true;
  }
  // Petit ennemi : tué net, quels que soient ses PV.
  if (typeof enemy.defeat === 'function') {
    enemy.defeat();
    juiceOnEnemyHit(scene, enemy, source);
  } else {
    damageEnemy(scene, enemy, { ...source, token: `charge-${player.grizzlyChargeId}-${now}` });
  }
  player.gainEnergy(ENERGY_PER_HIT);
  ursideBurst(scene, ex, (enemy.body ? enemy.body.center.y : enemy.y - 30), { color: 0xffe9a8, count: 10, power: 1.1 });
  juiceShake(scene, 'light');
  return true;
}

// ---------------------------------------------------------------------------
// Effets en gros pixels (grain de 2 px, aucune transparence progressive)
// ---------------------------------------------------------------------------
// Une liste de petits rectangles par scène, redessinée chaque image dans un
// seul Graphics : chaque morceau garde sa couleur pleine puis disparaît d'un
// coup (ou rétrécit par crans de 2 px).
const URSIDE_PX = 2;

function ursideFxState(scene) {
  let st = scene.__ursideFx;
  if (!st || !st.g || !st.g.active || st.g.scene !== scene) {
    const g = scene.add.graphics().setDepth(CHARACTER_DEPTH + 2);
    g.lookRole = 'fx';
    st = scene.__ursideFx = { g, parts: [], spikes: [], castId: 0 };
  }
  return st;
}

// Morceau : { x, y, w, h, color, vx, vy, gy, born, ms, shrink }.
function ursideFxAdd(scene, part) {
  const st = ursideFxState(scene);
  if (st.parts.length > 260) st.parts.shift();
  st.parts.push({ vx: 0, vy: 0, gy: 0, shrink: true, born: scene.time.now, ms: 300, w: 4, h: 4, color: 0xffffff, ...part });
}

// Gerbe d'éclats carrés autour d'un point (impact, percussion).
function ursideBurst(scene, x, y, { color = 0xffffff, count = 10, power = 1, colors = null } = {}) {
  const palette = colors || [color, 0xffffff];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const sp = (120 + Math.random() * 180) * power;
    ursideFxAdd(scene, {
      x, y, w: i % 3 === 0 ? 6 : 4, h: i % 3 === 0 ? 6 : 4, color: palette[i % palette.length],
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, gy: 700, ms: 260 + Math.random() * 180,
    });
  }
  // Croix d'impact : deux barres pleines, une image ou deux.
  ursideFxAdd(scene, { x: x - 16, y: y - 2, w: 32, h: 4, color: 0xffffff, ms: 70, shrink: false });
  ursideFxAdd(scene, { x: x - 2, y: y - 16, w: 4, h: 32, color: 0xffffff, ms: 70, shrink: false });
}

// Vague de blocs au ras du sol, de part et d'autre d'un fracas : montre la
// largeur réelle de la zone (plus large au palier 3 des ursidés).
function ursideGroundWave(scene, x, y, width, { color = 0xd8b890, dark = 0x8a6a48 } = {}) {
  const half = width / 2;
  const n = Math.max(4, Math.round(half / 14));
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < n; i++) {
      const k = (i + 1) / n;
      ursideFxAdd(scene, {
        x: x + side * half * k - 4, y: y - 6 - (1 - k) * 10, w: 8, h: 6 + Math.round((1 - k) * 4) * 2,
        color: i % 2 ? color : dark, vx: side * 60 * k, vy: -90 - 120 * (1 - k), gy: 620,
        born: scene.time.now + i * 18, ms: 240 + i * 14,
      });
    }
  }
}

// Charge du grizzly : traits de vitesse derrière lui, mottes sous les pattes,
// léger tremblement de l'écran.
function ursideChargeFx(p, now, s) {
  const sc = p.scene;
  const dir = p.grizzlyChargeDir || 1;
  if (now >= (p.grizzlyLineAt || 0)) {
    p.grizzlyLineAt = now + 28;
    for (let i = 0; i < 2; i++) {
      const len = 22 + Math.floor(Math.random() * 5) * 8;
      ursideFxAdd(sc, {
        x: p.x - dir * (20 + Math.random() * 60) - (dir > 0 ? len : 0), y: p.y - 8 - Math.floor(Math.random() * 34) * 2,
        w: len, h: i === 0 ? 4 : 2, color: Math.random() < 0.3 ? 0xffd08a : 0xffffff, vx: -dir * 300, ms: 120 + Math.random() * 80, shrink: false,
      });
    }
  }
  if (s.onGround && now >= (p.grizzlyDustAt || 0)) {
    p.grizzlyDustAt = now + 60;
    ursideFxAdd(sc, {
      x: p.x - dir * 34, y: p.y - 6, w: 6, h: 6, color: Math.random() < 0.5 ? 0x8a6a48 : 0xc9a878,
      vx: -dir * (60 + Math.random() * 80), vy: -120 - Math.random() * 120, gy: 760, ms: 300,
    });
  }
  if (s.onGround && now >= (p.grizzlyShakeAt || 0)) {
    p.grizzlyShakeAt = now + 180;
    juiceShake(sc, 'tiny');
  }
}

function ursideFxDraw(scene, now) {
  const st = scene.__ursideFx;
  if (!st || !st.g || !st.g.active) return;
  const g = st.g;
  g.clear();
  const dt = Math.min(50, scene.game.loop.delta || 16) / 1000;
  const snap = (v) => Math.round(v / URSIDE_PX) * URSIDE_PX;
  st.parts = st.parts.filter((q) => now < q.born + q.ms);
  for (const q of st.parts) {
    if (now < q.born) continue;
    q.vy += q.gy * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    const k = (now - q.born) / q.ms;
    // Rétrécit par crans de 2 px dans le dernier tiers (jamais de fondu).
    const cut = q.shrink && k > 0.66 ? URSIDE_PX : 0;
    const w = Math.max(URSIDE_PX, snap(q.w) - cut);
    const h = Math.max(URSIDE_PX, snap(q.h) - cut);
    g.fillStyle(q.color, 1);
    g.fillRect(snap(q.x), snap(q.y), w, h);
  }
}

// ---------------------------------------------------------------------------
// Ours polaire : pics de glace
// ---------------------------------------------------------------------------
// Texture d'un pic, dessinée en « gros pixels » : 1 case du canvas = 2 px
// d'écran (image affichée à l'échelle 2, filtre net). Silhouette en dents
// irrégulières, contour sombre, corps bleu clair, arête blanche, ombre.
function ursideSpikeTexture(scene, big) {
  const key = big ? 'fx-pic-glace-gros' : 'fx-pic-glace';
  if (scene.textures.exists(key)) return key;
  const T = POLAR_TUNING;
  const w = Math.round((big ? T.bigW : T.spikeW) / URSIDE_PX);
  const h = Math.round((big ? T.bigH : T.spikeH) / URSIDE_PX);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  const OUT = '#16305c';
  const BODY = '#8fd4ff';
  const SHADE = '#4f9be0';
  const LIGHT = '#f2fdff';
  // Pointe principale au centre, deux éclats plus courts de chaque côté.
  const tips = big
    ? [{ cx: w * 0.5, top: 0, half: w * 0.3 }, { cx: w * 0.2, top: h * 0.45, half: w * 0.18 }, { cx: w * 0.82, top: h * 0.55, half: w * 0.16 }]
    : [{ cx: w * 0.5, top: 0, half: w * 0.32 }, { cx: w * 0.2, top: h * 0.5, half: w * 0.18 }, { cx: w * 0.8, top: h * 0.62, half: w * 0.16 }];
  const inside = (x, y) => tips.some((t) => {
    if (y < t.top) return false;
    const k = (y - t.top) / Math.max(1, h - t.top);
    return Math.abs(x + 0.5 - t.cx) <= 0.5 + t.half * k;
  });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1);
      const main = tips[0];
      const rel = (x + 0.5 - main.cx) / Math.max(1, main.half);
      let color = BODY;
      if (edge) color = OUT;
      else if (rel > 0.25) color = SHADE;
      else if (rel > -0.45 && rel < -0.1 && y > main.top + 2) color = LIGHT;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

// Bord gauche / droit / haut d'un appui solide (hors eau) sous un point.
function ursideGroundTopAt(scene, x, y, up, down) {
  const water = scene.water || [];
  let best = null;
  for (const b of scene.physics.overlapRect(x - 2, y - up, 4, up + down, false, true)) {
    if (water.includes(b.gameObject)) continue;
    if (b.top < y - up - 0.5) continue;
    if (best === null || b.top < best) best = b.top;
  }
  return best;
}

function ursideWallAt(scene, x, groundY) {
  const water = scene.water || [];
  return scene.physics.overlapRect(x - 2, groundY - 40, 4, 30, false, true)
    .some((b) => !water.includes(b.gameObject));
}

// Lance la rangée de pics devant Agarica (Player : compétence `ours_polaire`,
// au moment où l'ours retombe). Positions calculées tout de suite : le sol
// est suivi de proche en proche, la rangée s'arrête au premier vide ou mur.
// `size` : palier 3 des ursidés (portée et pics agrandis de 25 %).
function ursideCastIceSpikes(scene, player, now) {
  const T = POLAR_TUNING;
  const st = ursideFxState(scene);
  const size = player.bearSizeMultiplier || 1;
  const dir = player.facingDir >= 0 ? 1 : -1;
  const total = T.spikes + 1;
  const step = (T.reach * size) / T.spikes;
  const castId = ++st.castId;
  // Ennemis déjà touchés par ce lancer : par un petit pic (un seul compte,
  // même s'il en chevauche deux) et par le gros.
  const hits = { small: new Set(), big: new Set() };
  let groundY = player.body.bottom;
  const made = [];
  for (let i = 0; i < total; i++) {
    const big = i === total - 1;
    // Le gros pic : une demi-enjambée après le 5e, au bout de la rangée.
    const x = player.x + dir * (i < T.spikes ? step * (i + 1) : step * T.spikes + step * 0.55);
    const top = ursideGroundTopAt(scene, x, groundY, T.stepUp, T.stepDown);
    if (top === null || ursideWallAt(scene, x, top)) break;
    groundY = top;
    const w = (big ? T.bigW : T.spikeW) * size;
    const h = (big ? T.bigH : T.spikeH) * size;
    const img = scene.add.image(x, top, ursideSpikeTexture(scene, big)).setOrigin(0.5, 1)
      .setScale(URSIDE_PX * size).setDepth(CHARACTER_DEPTH + 1).setVisible(false);
    img.lookRole = 'fx';
    const spike = {
      img, x, y: top, w, h, big, index: i, castId, dir, hits,
      bornAt: now + i * T.spikeEveryMs, damage: big ? 2 : 1, popped: false, hitDone: false,
      rect: new Phaser.Geom.Rectangle(x - w / 2, top - h, w, h),
    };
    st.spikes.push(spike);
    made.push(spike);
  }
  player.lastIceCast = { id: castId, count: made.length, spikes: made };
  scene.events.emit('ice-spikes', player.lastIceCast);
  return made;
}

function ursideSpikesUpdate(scene, now) {
  const st = scene.__ursideFx;
  if (!st || !st.spikes.length) return;
  const T = POLAR_TUNING;
  const player = scene.player;
  st.spikes = st.spikes.filter((s) => {
    const age = now - s.bornAt;
    if (age < 0) return true;
    if (age >= T.meltMs || !s.img.active) {
      if (s.img.active) s.img.destroy();
      return false;
    }
    const img = s.img;
    const texH = img.height;
    if (!s.popped) {
      s.popped = true;
      img.setVisible(true);
      // Éclats de glace et mottes au pied du pic qui perce le sol.
      const n = s.big ? 10 : 5;
      for (let i = 0; i < n; i++) {
        ursideFxAdd(scene, {
          x: s.x + (Math.random() - 0.5) * s.w, y: s.y - 4, w: 4, h: 4,
          color: [0xf2fdff, 0x8fd4ff, 0x4f9be0][i % 3],
          vx: (Math.random() - 0.5) * 220, vy: -160 - Math.random() * (s.big ? 260 : 160), gy: 760, ms: 320,
        });
      }
      if (s.big) juiceShake(scene, 'medium');
      else if (s.index === 0) juiceShake(scene, 'light');
      playSfx('ice_spike', { big: s.big });
    }
    // Le pic SORT du sol puis y rentre : image rognée par le bas, par crans
    // d'une case (2 px d'écran) -- jamais étirée ni fondue.
    const rise = Math.min(1, age / T.riseMs);
    const meltStart = T.meltMs - 220;
    const sink = age > meltStart ? (age - meltStart) / 220 : 0;
    const shown = Math.max(0, Math.round(texH * rise * (1 - sink)));
    img.setCrop(0, 0, img.width, shown);
    img.y = s.y + (texH - shown) * img.scaleY;
    // Fonte : le pic clignote par crans juste avant de rentrer.
    img.setVisible(!(age > meltStart - 180 && age <= meltStart && Math.floor(age / 45) % 2 === 0));
    // Dégâts : pendant la sortie du pic, une fois par ennemi (liste `hits` du
    // lancer : le jeton de damageEnemy ne retient que le DERNIER coup). Un
    // ennemi prend au plus un petit pic par lancer, et le gros compte double.
    // Rien n'arrête la rangée : perforant.
    if (age <= T.hurtMs && player && player.active) {
      if (!s.hitDone) {
        s.hitDone = true;
        scene.events.emit('player-skill', { skillId: 'ours_polaire', rect: s.rect, token: `ice-${s.castId}-${s.big ? 'gros' : 'pic'}`, big: s.big });
      }
      for (const enemy of scene.enemies ? scene.enemies.getChildren().slice() : []) {
        if (!enemy || enemy.defeated || !enemy.active) continue;
        const target = typeof enemy.getMeleeBounds === 'function' ? enemy.getMeleeBounds() : enemy.getBounds();
        if (!Phaser.Geom.Intersects.RectangleToRectangle(s.rect, target)) continue;
        const done = s.big ? s.hits.big : s.hits.small;
        if (done.has(enemy)) continue;
        done.add(enemy);
        const base = { kind: 'skill', skillId: 'ours_polaire', player, x: s.x, y: s.y };
        let hit = false;
        for (let k = 0; k < s.damage; k++) hit = damageEnemy(scene, enemy, { ...base, token: `ice-${s.castId}-${s.index}-${k}` }) || hit;
        if (hit) player.gainEnergy(ENERGY_PER_HIT);
      }
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Compétences : panda (soin) et ours polaire (pics de glace) ; fracas de
// l'ours-hibou (compétence interne, lancée par l'atterrissage)
// ---------------------------------------------------------------------------
// Toutes passent par la mécanique de la compétence ours (transformation,
// animation, retour : Player.beginSkill / update). Champs ajoutés pour elles
// (lus par Player) : `rooted` (immobile pendant la compétence), `groundOnly`,
// `canActivate(player)` (sinon ni effet ni coût), `onStart(player, now)`,
// `family` (zone agrandie par le palier 3 des ursidés), `cardLabel`.
SKILL_DEFS.ours.family = 'ursides';

const URSIDE_SKILL_BODY = (scale) => transfoBodyConfig(OURS_FRAME_WIDTH, OURS_FRAME_HEIGHT, scale);

SKILL_DEFS.panda = {
  label: 'Panda — Soin',
  cardLabel: 'Panda',
  // Vert des pousses : assez sombre pour la lettre claire de la touche (HUD).
  hudColor: 0x4f7a43,
  family: 'ursides',
  cost: PANDA_TUNING.cost,
  rooted: true,
  groundOnly: true,
  // Cœurs pleins : sans effet et sans coût.
  canActivate: (player) => player.hearts < player.maxHearts,
  denyText: 'Tes cœurs sont déjà pleins.',
  transitionAnimKey: ANIM_TRANSFO_TO_OURS_KEY,
  transitionDurationMs: TRANSFO_OURS_DURATION,
  transitionScales: TRANSFO_OURS_FRAME_SCALES,
  transitionBodies: TRANSFO_OURS_FRAME_BODIES,
  transitionOutAnimKey: ANIM_TRANSFO_FROM_OURS_KEY,
  attackDurationMs: PANDA_TUNING.eatMs,
  transformDurationMs: TRANSFO_OURS_DURATION + PANDA_TUNING.eatMs + TRANSFO_OURS_EXIT_DURATION,
  animKey: 'ursprov-panda-eat',
  scale: PANDA_TUNING.scale,
  body: URSIDE_SKILL_BODY(PANDA_TUNING.scale),
  facesRight: true,
  // Elle mange : le cœur revient à la fin du repas. Un coup reçu avant
  // l'annule (Player.hitByEnemy) -- c'est le risque de la compétence.
  onStart(player, now) {
    player.pandaHealAt = player.skillAttackEndTime - 60;
    player.pandaMunchAt = player.skillTransitionEndTime + 80;
  },
};

SKILL_DEFS.ours_polaire = {
  label: 'Ours polaire — Pics de glace',
  cardLabel: 'Polaire',
  hudColor: 0x3f7fc4,
  family: 'ursides',
  cost: POLAR_TUNING.cost,
  rooted: true,
  groundOnly: true,
  transitionAnimKey: ANIM_TRANSFO_TO_OURS_KEY,
  transitionDurationMs: TRANSFO_OURS_DURATION,
  transitionScales: TRANSFO_OURS_FRAME_SCALES,
  transitionBodies: TRANSFO_OURS_FRAME_BODIES,
  transitionOutAnimKey: ANIM_TRANSFO_FROM_OURS_KEY,
  // Dressé `rearMs`, puis il retombe : 8 poses, la retombée à la 5e.
  attackDurationMs: Math.round(POLAR_TUNING.rearMs * 2),
  transformDurationMs: TRANSFO_OURS_DURATION + Math.round(POLAR_TUNING.rearMs * 2) + TRANSFO_OURS_EXIT_DURATION,
  animKey: 'ursprov-polaire-cast',
  scale: OURS_SCALE,
  body: URSIDE_SKILL_BODY(OURS_SCALE),
  facesRight: true,
  onStart(player, now) {
    player.iceCastAt = player.skillTransitionEndTime + POLAR_TUNING.rearMs;
  },
};

// Fracas de l'ours-hibou à l'atterrissage : compétence INTERNE (jamais dans un
// emplacement, ni débloquée, ni payée), lancée par Player quand il retombe
// après son 2e saut. `hitboxKind: 'ours'` : tout ce qui réagit au fracas de
// l'ours (blocs cassables `by: 'bear'`, amas de mousse) réagit à celui-ci.
INTERNAL_SKILL_DEFS.owlbear_slam = {
  label: 'Ours-hibou — Fracas',
  internal: true,
  family: 'ursides',
  hitboxKind: 'ours',
  rooted: true,
  cost: 0,
  hitboxDurationMs: 120,
  hitboxDelayMs: 30,
  attackDurationMs: OWLBEAR_TUNING.slamMs,
  transformDurationMs: OWLBEAR_TUNING.slamMs,
  hitboxWidth: OWLBEAR_TUNING.hitboxWidth,
  hitboxHeight: OWLBEAR_TUNING.hitboxHeight,
  hitboxOffsetX: 0,
  animKey: 'ursprov-owlbear-slam',
  scale: URSIDE_FORM_SCALE,
  body: URSIDE_SKILL_BODY(URSIDE_FORM_SCALE),
  facesRight: true,
};

// Art des trois compétences, revu à chaque création du joueur : vraies
// feuilles du manifeste si elles sont là, sinon l'ours recoloré. Les images
// provisoires ne sont fabriquées qu'au premier lancer (ursideEnsureSkillArt).
function ursideRefreshSkillArt(scene) {
  const real = (def, id, anim, ms, scale) => {
    const key = ursideManifestTimedAnim(scene, id, anim, ms);
    if (!key) return false;
    const src = scene.textures.get(manifestFrameKey(id, Array.isArray(anim) ? anim[0] : anim, 0)).getSourceImage();
    def.animKey = key;
    def.scale = scale;
    def.body = transfoBodyConfig(src.width, src.height, scale);
    def.provisional = null;
    // Transformation de la vraie feuille (aller, puis retour à l'envers), sinon aucune.
    const tIn = ursideManifestTimedAnim(scene, id, 'transform', URSIDE_TRANSFO_MS);
    const tOut = ursideManifestTimedAnim(scene, id, 'transform', URSIDE_TRANSFO_MS, true);
    def.transitionAnimKey = tIn;
    def.transitionOutAnimKey = tOut;
    def.transitionDurationMs = tIn ? URSIDE_TRANSFO_MS : 0;
    def.transitionScales = null;
    def.transitionBodies = null;
    if (tIn) {
      const ts = scene.textures.get(manifestFrameKey(id, 'transform', 0)).getSourceImage();
      def.transitionScale = scale;
      def.transitionBody = transfoBodyConfig(ts.width, ts.height, scale);
    }
    def.transformDurationMs = def.transitionDurationMs + def.attackDurationMs + (tOut ? URSIDE_TRANSFO_MS : 0);
    return true;
  };
  const mScale = (id, fallback) => (getAssetManifest()[id] || {}).scale || fallback;
  // (Sans feuille, rien à préparer : ensureManifestAnims créerait des anims de
  // placeholder `panda-eat`… -- les anims provisoires ont leurs propres clés.)
  for (const id of ['panda', 'ours_polaire', 'ours_hibou']) if (hasManifestArt(scene, id)) ensureManifestAnims(scene, id);
  const panda = SKILL_DEFS.panda;
  if (!real(panda, 'panda', 'eat', PANDA_TUNING.eatMs, mScale('panda', PANDA_TUNING.scale))) {
    panda.provisional = { key: 'ursprov-panda-eat', variant: 'panda', frames: [0, 5, 0, 5, 0, 5], ms: PANDA_TUNING.eatMs };
  }
  const polar = SKILL_DEFS.ours_polaire;
  // Vraie feuille : `rear` (dressé) puis `slam` (il retombe), chacune sur `rearMs`.
  if (!real(polar, 'ours_polaire', ['rear', 'slam'], POLAR_TUNING.rearMs * 2, mScale('ours_polaire', OURS_SCALE))) {
    polar.provisional = { key: 'ursprov-polaire-cast', variant: 'polaire', frames: [0, 1, 1, 1, 2, 3, 4, 5], ms: POLAR_TUNING.rearMs * 2 };
  }
  const slam = INTERNAL_SKILL_DEFS.owlbear_slam;
  if (!real(slam, 'ours_hibou', 'slam', OWLBEAR_TUNING.slamMs, mScale('ours_hibou', URSIDE_FORM_SCALE))) {
    slam.provisional = { key: 'ursprov-owlbear-slam', variant: 'owlbear', frames: [2, 3, 4, 5], ms: OWLBEAR_TUNING.slamMs };
  } else {
    // Le fracas n'a ni entrée ni sortie : il part de la forme déjà prise.
    slam.transitionAnimKey = null;
    slam.transitionOutAnimKey = null;
    slam.transitionDurationMs = 0;
    slam.transformDurationMs = slam.attackDurationMs;
  }
  ursideRefreshBrownBear(scene);
}

// Ours brun de la compétence « ours » (le fracas du talisman du chef) : la
// feuille refaite `ours_brun` remplace l'ancien ours (assets/sprites/ours_frames/,
// SKILL_DEFS.ours tel que Player.js le définit, qui reste le repli sans elle).
// Mêmes six poses dans le même ordre et MÊMES durées : ni le rythme ni la zone
// du fracas ne changent. La transformation garde ses trois images (Agarica,
// mi-ourse, presque ourse) : la 4e de la feuille est la 1re pose de l'attaque.
function ursideRefreshBrownBear(scene) {
  const id = 'ours_brun';
  if (!hasManifestArt(scene, id, 'slam') || !hasManifestArt(scene, id, 'transform')) return;
  const def = SKILL_DEFS.ours;
  const scale = (getAssetManifest()[id] || {}).scale || OURS_SCALE;
  const animKey = ursideManifestTimedAnim(scene, id, 'slam', OURS_ATTACK_DURATION);
  const steps = manifestAnimFrames(scene, id, 'transform').slice(0, TRANSFO_OURS_FRAME_COUNT);
  if (!animKey || steps.length < 2) return;
  if (!scene.anims.exists('ours_brun-transfo-in')) {
    scene.anims.create({ key: 'ours_brun-transfo-in', frames: steps, frameRate: TRANSFO_OURS_FRAME_RATE, repeat: 0 });
    scene.anims.create({ key: 'ours_brun-transfo-out', frames: steps.slice().reverse(), frameRate: TRANSFO_OURS_EXIT_FRAME_RATE, repeat: 0 });
  }
  const src = scene.textures.get(manifestFrameKey(id, 'slam', 0)).getSourceImage();
  def.animKey = animKey;
  def.scale = scale;
  def.body = transfoBodyConfig(src.width, src.height, scale);
  def.transitionAnimKey = 'ours_brun-transfo-in';
  def.transitionOutAnimKey = 'ours_brun-transfo-out';
  // Une échelle par image de la transformation (ursideFrameScale, lue par
  // Player) : plus de tableau indexé sur les anciennes textures.
  def.transitionScales = null;
  def.transitionBodies = null;
  def.transitionScale = scale;
  def.transitionBody = def.body;
}

// Player.beginSkill : l'anim provisoire de la compétence existe-t-elle ?
function ursideEnsureSkillArt(scene, def) {
  const pv = def && def.provisional;
  if (pv) ursideEnsureAnim(scene, pv.key, pv.variant, pv.frames, pv.ms);
}

// Horloges des compétences d'ours (début de Player.update, avant les poses).
function ursideSkillTick(player, now) {
  const sc = player.scene;
  if (player.pandaHealAt) {
    // Miettes de pousse pendant qu'elle mâche.
    if (now >= (player.pandaMunchAt || 0) && now < player.pandaHealAt) {
      player.pandaMunchAt = now + 110;
      const dir = player.facingDir >= 0 ? 1 : -1;
      // Bouche du panda assis : 28 px devant lui, 94 au-dessus du sol (vraie
      // feuille à 150 px de long) ; plus bas avec l'image provisoire.
      const real = hasManifestArt(sc, 'panda', 'eat');
      ursideFxAdd(sc, {
        x: player.x + dir * (real ? 28 : 34), y: player.y - (real ? 94 : 34), w: 4, h: 4, color: Math.random() < 0.5 ? 0x7fd06a : 0xc9f0a0,
        vx: dir * (20 + Math.random() * 60), vy: -60 - Math.random() * 80, gy: 520, ms: 300,
      });
    }
    if (now >= player.pandaHealAt) {
      player.pandaHealAt = 0;
      if (player.hearts > 0 && player.hearts < player.maxHearts) {
        player.hearts += 1;
        sc.registry.set('hearts', player.hearts);
        spawnFx(sc, 'heal', player.x, player.y - 40, { count: 10 });
        ursideBurst(sc, player.x, player.y - 46, { count: 8, power: 0.6, colors: [0xff6b8a, 0xffffff, 0x7fd06a] });
        playSfx('panda_heal');
        sc.events.emit('panda-heal', player);
      }
    }
  }
  if (player.iceCastAt && now >= player.iceCastAt) {
    player.iceCastAt = 0;
    const dir = player.facingDir >= 0 ? 1 : -1;
    // Il retombe : secousse, gerbe de givre sous les pattes, puis la glace part.
    juiceShake(sc, 'medium');
    ursideGroundWave(sc, player.x + dir * 30, player.body.bottom, 90, { color: 0xf2fdff, dark: 0x8fd4ff });
    ursideCastIceSpikes(sc, player, now);
  }
}

// ---------------------------------------------------------------------------
// Effets du fracas en images (pixelfx : tools/pixelfx/bear-slam.js, rendues
// par export_fracas.mjs ; nombre d'images, cadence et ancrage : FRACAS_FX,
// src/data/fracas_fx.js). Deux parties : `impact` (poussière et pierres, au
// point de choc) et `griffe` (traînée du coup de patte de l'ours brun).
// Sans les images : les anciens effets par code (repli).
// ---------------------------------------------------------------------------
// Largeur de la zone de fracas pour laquelle l'effet est dessiné à l'échelle 1.
const URSIDE_FRACAS_BASE_WIDTH = 220;

function ursideFracasReady(scene, part) {
  return typeof FRACAS_FX !== 'undefined' && !!FRACAS_FX[part] && scene.textures.exists(`fracas-${part}-0`);
}

// Joue une partie de l'effet, ancrée en (x, y) ; `dir` < 0 : retournée ;
// `size` : agrandie (palier 3 des ursidés). Vrai si l'effet est parti.
function ursidePlayFracas(scene, part, x, y, { dir = 1, size = 1 } = {}) {
  if (!ursideFracasReady(scene, part)) return false;
  const c = FRACAS_FX[part];
  const key = `fracas-${part}`;
  if (!scene.anims.exists(key)) {
    const frames = [];
    for (let i = 0; i < c.frames; i++) if (scene.textures.exists(`${key}-${i}`)) frames.push({ key: `${key}-${i}` });
    scene.anims.create({ key, frames, frameRate: c.fps, repeat: 0 });
  }
  const spr = scene.add.sprite(x, y, `${key}-0`).setDepth(CHARACTER_DEPTH + 2).setScale(size);
  spr.lookRole = 'fx';
  // Image retournée : Phaser la retourne dans son cadre, pas autour de son
  // origine -- l'ancrage passe donc de l'autre côté.
  const ox = c.ox / c.w;
  spr.setOrigin(dir >= 0 ? ox : 1 - ox, c.oy / c.h).setFlipX(dir < 0);
  spr.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => spr.destroy());
  spr.play(key);
  return true;
}

// Impact d'un fracas d'ours (Player, à l'ouverture de la zone de dégâts) :
// poussière et pierres sur la largeur RÉELLE de la zone (`rect`), et pour
// l'ours brun la traînée de sa patte. Faux sans les images (Player retombe
// alors sur l'ancien effet).
function ursideSlamFx(player, rect) {
  const sc = player.scene;
  if (!rect || !ursideFracasReady(sc, 'impact')) return false;
  ursidePlayFracas(sc, 'impact', rect.centerX, rect.bottom, { size: rect.width / URSIDE_FRACAS_BASE_WIDTH });
  // (même facteur pour l'anneau : palier 3 des ursidés, totems)
  const size = rect.width / URSIDE_FRACAS_BASE_WIDTH;
  if (player.activeSkillId === 'ours') {
    // Le fracas de l'ours brun est le pouvoir du talisman : son anneau ambre
    // dessiné reste (le même qu'avant, cf. spawnFx 'slam' dans LevelKit).
    juiceShockRing(sc, rect.centerX, rect.bottom - 6, { size: 230 * size, ms: 380, color: 0xffe2b0, flat: 0.28, variant: 'talisman' });
    if (hasManifestArt(sc, 'ours_brun', 'slam')) {
      ursidePlayFracas(sc, 'griffe', player.x, player.y, { dir: player.facingDir >= 0 ? 1 : -1 });
    }
  }
  return true;
}

// Fracas de l'ours-hibou SANS les images de l'effet : vague de blocs sur toute
// la largeur de la zone.
function ursideOwlbearSlamFx(player, rect) {
  ursideGroundWave(player.scene, rect.centerX, rect.bottom, rect.width);
}

// Percussion du grizzly : éclats au point de contact, pierres et poussière au
// pied de ce qu'il percute (même effet que le fracas, en plus petit).
function ursideCrashFx(player, x, y) {
  const sc = player.scene;
  const stones = ursidePlayFracas(sc, 'impact', x, player.body.bottom, { size: 0.7 * (player.bearSizeMultiplier || 1) });
  ursideBurst(sc, x, y, { count: stones ? 6 : 14, power: 1.3, colors: [0xffffff, 0xffd08a, 0xc9a878, 0x8a6a48] });
  juiceShake(sc, 'heavy');
  juiceHitStop(sc, 70);
  playSfx('grizzly_crash');
}

// Boucle commune (LEVEL_UPDATE_HOOKS, monde non gelé) : impact du grizzly sur
// les ennemis, pics de glace, effets.
function ursideUpdateHook(scene, time) {
  const now = scene.time.now;
  const p = scene.player;
  if (p && p.active && p.grizzlyImpact) {
    const imp = p.grizzlyImpact;
    if (now >= imp.until) {
      p.grizzlyImpact = null;
    } else if (scene.enemies) {
      for (const enemy of scene.enemies.getChildren().slice()) {
        if (!enemy || enemy.defeated || !enemy.active) continue;
        const target = typeof enemy.getMeleeBounds === 'function' ? enemy.getMeleeBounds() : enemy.getBounds();
        if (!Phaser.Geom.Intersects.RectangleToRectangle(imp.rect, target)) continue;
        if (damageEnemy(scene, enemy, { kind: 'charge', player: p, x: p.x, y: p.y, token: imp.token })) p.gainEnergy(ENERGY_PER_HIT);
      }
    }
  }
  ursideSpikesUpdate(scene, now);
  ursideFxDraw(scene, now);
}

if (typeof LEVEL_UPDATE_HOOKS !== 'undefined') LEVEL_UPDATE_HOOKS.push(ursideUpdateHook);

// Textes des bandeaux de déblocage (StoryKit), pour le jour où l'histoire
// donnera ces ours : aujourd'hui seule la zone de test les donne.
if (typeof SKILL_STORY_INFO !== 'undefined') {
  SKILL_STORY_INFO.panda = { name: 'Panda — Soin', desc: 'Elle s\'assoit, mange une pousse et retrouve un cœur.' };
  SKILL_STORY_INFO.ours_polaire = { name: 'Ours polaire — Pics de glace', desc: 'Il se dresse, retombe, et la glace perce le sol devant lui.' };
}
if (typeof STORY_FORM_INFO !== 'undefined') {
  STORY_FORM_INFO.hasGrizzlyForm = { type: 'grizzly', name: 'Forme du grizzly', desc: '[Maj] tenue : grizzly. Il prend de l\'élan, puis charge.' };
  STORY_FORM_INFO.hasOwlbearForm = { type: 'owlbear', name: "Forme de l'ours-hibou", desc: '[Espace] deux fois : ours-hibou. Il fracasse le sol en retombant.' };
}
