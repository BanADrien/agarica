// Branches et troncs du grand arbre (clés de zone `branches` et `trunks`, cf.
// docs/production/PLAN_DEV.md). Remplacent les rectangles de tuiles d'écorce :
// chaque branche a sa propre image (base reliée au tronc, milieu répété, bout
// effilé, fourches), courbée au besoin, et ses cases de collision (cellules
// calculées dans LevelKit, cf. branchCollisionCells : mêmes corps que le sol).
//
// Rendu : l'art du lot Codex n°11 (`item-branche_*`, `item-tronc_*`), ou à
// défaut les mêmes pièces dessinées par code (même format, cf. plus bas) ; le
// reste de la chaîne ne voit pas la différence. Tout est composé une fois dans
// un canvas (texture réutilisée d'une visite à l'autre) : une branche courbe ne
// peut pas se faire en tuiles, et des tuiles sur de grandes longueurs laisseraient
// des joints au demi-pixel.

// Format des pièces (cf. PROMPT_CODEX_11.md) : tronc à gauche, pointe à droite,
// ligne de marche à la rangée 256, dessous de l'écorce vers la rangée 480.
const BRANCHE_WALK_ROW = 256;
const BRANCHE_UNDER_ROW = 480;
const BRANCHE_THICK_SRC = BRANCHE_UNDER_ROW - BRANCHE_WALK_ROW;
const BRANCHE_SRC_ROWS = 512;
const BRANCHE_TILE_COLS = 1536;      // largeur de branche_milieu (périodique)
const BRANCHE_BASE_OVER = 256;       // colonnes de branche_base posées sur le tronc
const BRANCHE_BASE_WALK = 384;       // … et colonnes où l'on marche
const BRANCHE_TIP_WALK = 320;        // colonnes de branche_bout où l'on marche
const BRANCHE_TIP_OVER = 128;        // … et pointe, qui dépasse de la hitbox
const BRANCHE_FORK_COLS = 1024;
const BRANCHE_ROW_TOP = { flat: 250, tip: 234, fork: 96, base: 76 }; // rangée la plus haute visible
const BRANCHE_ROW_BOTTOM = 500;
const BRANCHE_DEFAULT_THICKNESS = 56; // échelle 0,25 de l'art
// Rangées de mousse sous les pieds : le haut de l'art est un contour sombre, puis
// la mousse. Sans ça, Agarica flotte de 2-3 px au-dessus du vert (mesuré à l'écran).
const BRANCHE_FOOT_SINK_ROWS = 12;
// Pièces de longueur différente mises bout à bout : fondu sur l'écorce (le dessus
// de mousse reste continu), jamais un joint net. En px monde, à l'échelle 0,25.
const BRANCHE_SEAM_FADE = 16;
const BRANCHE_SLICE_STEP = 2;        // largeur des tranches d'une branche courbe
const BRANCHE_MAX_TEXTURE = 2048;    // au-delà : plusieurs images côte à côte
const TRONC_SEGMENT_COLS = 793;
const TRONC_SEGMENT_ROWS = 1536;
const TRONC_BASE_COLS = 1400;
const TRONC_BASE_ROWS = 1024;
const TRONC_BASE_GROUND_ROW = 960;   // ligne de sol du pied

function brancheCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

// Pièces refaites en pixel art (tools/pixelfix.js, registre PIXEL_FIXED) : on les
// réduit SANS lissage, sinon leurs blocs de pixels redeviennent flous une fois
// ramenés à l'échelle du monde. Art IA d'origine ou dessin par code : lissé.
const BRANCHE_PIXEL_ART = typeof PIXEL_FIXED !== 'undefined' && !!PIXEL_FIXED['assets/decors/elements/branche_milieu.png'];

function brancheCtx(c) {
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = !BRANCHE_PIXEL_ART;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

// Image source d'une pièce : l'art s'il est chargé, sinon le dessin par code.
function branchePiece(scene, id) {
  const key = `item-${id}`;
  if (scene.textures.exists(key)) return scene.textures.get(key).getSourceImage();
  return brancheFallbackPiece(id);
}

function brancheHasArt(scene) {
  return ['branche_milieu', 'branche_base', 'branche_bout', 'branche_fourche', 'tronc_segment', 'tronc_base']
    .map((id) => (scene.textures.exists(`item-${id}`) ? '1' : '0')).join('');
}

function brancheHash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

// ---------------------------------------------------------------------------
// Bande droite : pièces posées de gauche à droite, à l'échelle du monde.
// ---------------------------------------------------------------------------
// `length` = partie où l'on marche ; les parties qui dépassent (base sur le
// tronc, pointe) sont en plus. Résultat : { canvas, overL, walkRow }.
function brancheStrip(scene, { length, kx, ky, left, right, forks = [], seed = 0 }) {
  const walkL = left === 'base' ? BRANCHE_BASE_WALK : left === 'bout' ? BRANCHE_TIP_WALK : 0;
  const walkR = right === 'base' ? BRANCHE_BASE_WALK : right === 'bout' ? BRANCHE_TIP_WALK : 0;
  const fade = Math.max(6, BRANCHE_SEAM_FADE * (kx / 0.25));
  // Plateforme courte : les deux bouts se resserrent en largeur pour tenir.
  const capNeed = (walkL + walkR) * kx;
  const capK = capNeed > length && capNeed > 0 ? kx * Math.max(0.3, (length + fade) / capNeed) : kx;
  const overL = (left === 'base' ? BRANCHE_BASE_OVER : left === 'bout' ? BRANCHE_TIP_OVER : 0) * capK;
  const overR = (right === 'base' ? BRANCHE_BASE_OVER : right === 'bout' ? BRANCHE_TIP_OVER : 0) * capK;
  const capL = walkL * capK;
  const capR = walkR * capK;

  let rowTop = BRANCHE_ROW_TOP.flat;
  if (left === 'bout' || right === 'bout') rowTop = BRANCHE_ROW_TOP.tip;
  if (forks.length) rowTop = BRANCHE_ROW_TOP.fork;
  if (left === 'base' || right === 'base') rowTop = BRANCHE_ROW_TOP.base;
  const rows = BRANCHE_ROW_BOTTOM - rowTop;
  const h = rows * ky;
  const w = overL + length + overR;
  const canvas = brancheCanvas(w, h);
  const ctx = brancheCtx(canvas);
  const drawRows = (c, img, dx, dw, flip) => {
    c.save();
    if (flip) { c.translate(dx + dw, 0); c.scale(-1, 1); dx = 0; }
    c.drawImage(img, 0, rowTop, img.width, rows, dx, 0, dw, h);
    c.restore();
  };

  // Milieu : sous tout le reste, décalé selon la branche (les nœuds ne se
  // retrouvent pas au même endroit d'une plateforme à l'autre). Largeur entière
  // pour que les copies se touchent sans joint.
  const milieu = branchePiece(scene, 'branche_milieu');
  const tileW = Math.max(16, Math.round(BRANCHE_TILE_COLS * kx));
  const midA = overL + capL - (capL ? fade : 0);
  const midB = overL + length - capR + (capR ? fade : 0);
  if (midB > midA) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(midA, 0, midB - midA, h);
    ctx.clip();
    const phase = seed % tileW;
    for (let x = Math.floor(midA) - phase; x < midB; x += tileW) drawRows(ctx, milieu, x, tileW, false);
    ctx.restore();
  }

  // Une pièce posée sur le milieu : bords en fondu pour que le raccord ne se lise pas.
  const overlay = (img, dx, dw, flip, fadeL, fadeR) => {
    const tmp = brancheCanvas(dw, h);
    const t = brancheCtx(tmp);
    drawRows(t, img, 0, tmp.width, flip);
    t.globalCompositeOperation = 'destination-in';
    const grad = t.createLinearGradient(0, 0, tmp.width, 0);
    const a = fadeL ? Math.min(0.49, fade / tmp.width) : 0;
    const b = fadeR ? Math.min(0.49, fade / tmp.width) : 0;
    grad.addColorStop(0, fadeL ? 'rgba(0,0,0,0)' : '#000');
    if (a) grad.addColorStop(a, '#000');
    if (b) grad.addColorStop(1 - b, '#000');
    grad.addColorStop(1, fadeR ? 'rgba(0,0,0,0)' : '#000');
    t.fillStyle = grad;
    t.fillRect(0, 0, tmp.width, h);
    ctx.drawImage(tmp, Math.round(dx), 0);
  };

  // Fourches : le bras haut est un décor, la surface reste celle du milieu.
  if (forks.length) {
    const fourche = branchePiece(scene, 'branche_fourche');
    for (const f of forks) {
      const at = typeof f === 'number' ? f : f.at;
      const flip = !!(f && f.flip);
      overlay(fourche, overL + at, BRANCHE_FORK_COLS * kx, flip, true, true);
    }
  }
  // Bouts : leur bord intérieur reprend celui du milieu, le fondu rattrape le
  // décalage de phase. Dessinés tronc à gauche, pointe à droite : miroir selon le côté.
  const capPiece = (type) => branchePiece(scene, type === 'base' ? 'branche_base' : 'branche_bout');
  if (left) overlay(capPiece(left), 0, overL + capL, left === 'bout', false, true);
  if (right) overlay(capPiece(right), overL + length - capR, overR + capR, right === 'base', true, false);

  return { canvas, overL, overR, walkRow: (BRANCHE_WALK_ROW - rowTop) * ky, h };
}

// ---------------------------------------------------------------------------
// Courbe de la branche (ligne de surface, de gauche à droite)
// ---------------------------------------------------------------------------
function branchePath(pts, bend = 0) {
  let ctrl = pts;
  if (pts.length === 2 && bend) {
    ctrl = [pts[0], { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 + bend }, pts[1]];
  }
  // Interpolation monotone en x (PCHIP) : passe PAR les points écrits dans la
  // donnée sans jamais les dépasser. Une liane attachée à un point y trouve la
  // branche, et une partie plate (surface de marche) le reste au pixel près.
  const n = ctrl.length;
  const dxs = [];
  const slopes = [];
  for (let i = 0; i < n - 1; i++) {
    dxs.push(Math.max(1, ctrl[i + 1].x - ctrl[i].x));
    slopes.push((ctrl[i + 1].y - ctrl[i].y) / dxs[i]);
  }
  const tangent = [slopes[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) { tangent.push(0); continue; }
    const w1 = 2 * dxs[i] + dxs[i - 1];
    const w2 = dxs[i] + 2 * dxs[i - 1];
    tangent.push((w1 + w2) / (w1 / slopes[i - 1] + w2 / slopes[i]));
  }
  tangent.push(slopes[n - 2]);
  const samples = [];
  for (let i = 0; i < n - 1; i++) {
    const a = ctrl[i];
    const b = ctrl[i + 1];
    const steps = Math.max(4, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    const h = dxs[i];
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      samples.push({
        x: a.x + (b.x - a.x) * t,
        y: (2 * t3 - 3 * t2 + 1) * a.y + (t3 - 2 * t2 + t) * h * tangent[i] + (-2 * t3 + 3 * t2) * b.y + (t3 - t2) * h * tangent[i + 1],
      });
    }
  }
  samples.push({ x: ctrl[ctrl.length - 1].x, y: ctrl[ctrl.length - 1].y });
  const cum = [0];
  for (let i = 1; i < samples.length; i++) cum.push(cum[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y));
  const length = cum[cum.length - 1];
  // Tangente lissée sur ~50 px : l'angle varie continûment d'une tranche à l'autre
  // (une cassure ouvrirait des fentes en éventail sur le bord extérieur).
  const last = samples.length - 1;
  const raw = samples.map((_, i) => {
    const a = samples[Math.max(0, i - 2)];
    const b = samples[Math.min(last, i + 2)];
    return Math.atan2(b.y - a.y, b.x - a.x);
  });
  const angles = raw.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - 6); j <= Math.min(last, i + 6); j++) { sum += raw[j]; count++; }
    return sum / count;
  });
  let cursor = 0;
  const at = (s) => {
    // Au-delà des extrémités (base sur le tronc, pointe) : la tangente continue.
    if (s <= 0 || s >= length) {
      const from = s <= 0 ? samples[0] : samples[last];
      const ang = s <= 0 ? angles[0] : angles[last];
      const d = s <= 0 ? s : s - length;
      return { x: from.x + Math.cos(ang) * d, y: from.y + Math.sin(ang) * d, a: ang };
    }
    while (cursor > 0 && cum[cursor] > s) cursor--;
    while (cursor < last - 1 && cum[cursor + 1] < s) cursor++;
    const a = samples[cursor];
    const b = samples[cursor + 1];
    const seg = cum[cursor + 1] - cum[cursor] || 1;
    const t = (s - cum[cursor]) / seg;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, a: angles[cursor] + (angles[cursor + 1] - angles[cursor]) * t };
  };
  return { length, at };
}

// Bande posée le long de la courbe, tranche par tranche. `taper` : épaisseur
// sous la ligne de marche, de gauche à droite (la mousse du dessus ne bouge pas).
function brancheBend(strip, path, taper) {
  const { canvas: src, overL, walkRow, h } = strip;
  const below = h - walkRow;
  const w = src.width;
  const thick = (sx) => {
    if (!taper) return 1;
    const t = Phaser.Math.Clamp(sx / Math.max(1, w), 0, 1);
    return taper[0] + (taper[1] - taper[0]) * t;
  };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let sx = 0; sx <= w + 8; sx += 8) {
    const p = path.at(sx - overL);
    const nx = -Math.sin(p.a);
    const ny = Math.cos(p.a);
    for (const d of [-walkRow, below * thick(sx)]) {
      minX = Math.min(minX, p.x + nx * d);
      maxX = Math.max(maxX, p.x + nx * d);
      minY = Math.min(minY, p.y + ny * d);
      maxY = Math.max(maxY, p.y + ny * d);
    }
  }
  minX = Math.floor(minX) - 4;
  minY = Math.floor(minY) - 4;
  const canvas = brancheCanvas(maxX - minX + 8, maxY - minY + 8);
  const ctx = brancheCtx(canvas);
  for (let sx = 0; sx < w; sx += BRANCHE_SLICE_STEP) {
    const p = path.at(sx - overL);
    const c = Math.cos(p.a);
    const s = Math.sin(p.a);
    ctx.setTransform(c, s, -s, c, p.x - minX, p.y - minY);
    // Tranche assez large pour couvrir l'éventail du côté extérieur de la courbe.
    const turn = Math.abs(path.at(sx - overL + BRANCHE_SLICE_STEP).a - p.a);
    const overlap = 1 + Math.min(10, Math.ceil(turn * Math.max(walkRow, below)));
    const sw = Math.min(BRANCHE_SLICE_STEP + overlap, w - sx);
    ctx.drawImage(src, sx, 0, sw, walkRow, 0, -walkRow, sw, walkRow);
    ctx.drawImage(src, sx, walkRow, sw, below, 0, 0, sw, below * thick(sx));
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return { canvas, x: minX, y: minY };
}

// ---------------------------------------------------------------------------
// Image(s) d'une branche
// ---------------------------------------------------------------------------
// Extrémités : `attach` = côté du raccord au tronc ('left' | 'right' | 'both' |
// 'none' si elle sort de l'écran) ; `tip` = côté effilé ('left' | 'right' |
// 'both' | 'none'), par défaut l'opposé du raccord.
function brancheEnds(b) {
  const attach = b.attach || 'none';
  const tip = b.tip || (attach === 'left' ? 'right' : attach === 'right' ? 'left' : 'none');
  const end = (side) => {
    if (attach === side || attach === 'both') return 'base';
    return tip === side || tip === 'both' ? 'bout' : null;
  };
  return { left: end('left'), right: end('right') };
}

function branchePoints(b) {
  const pts = [b.from, ...(b.via || []), b.to].map(([x, y]) => ({ x, y }));
  if (pts[0].x > pts[pts.length - 1].x) pts.reverse();
  return pts;
}

function brancheCompose(scene, b) {
  const pts = branchePoints(b);
  const thickness = b.thickness || BRANCHE_DEFAULT_THICKNESS;
  const ky = thickness / BRANCHE_THICK_SRC;
  const kx = b.scaleX || ky;
  const { left, right } = brancheEnds(b);
  const flat = pts.length === 2 && pts[0].y === pts[1].y && !b.bend;
  const path = flat ? null : branchePath(pts, b.bend);
  const needsBend = !flat || !!b.taper;
  const length = flat ? pts[1].x - pts[0].x : path.length;
  // Graine de phase tirée de la position (fixe pour une donnée) : les branches de
  // même longueur n'ont pas toutes les mêmes nœuds.
  const seed = Math.abs(Math.round(pts[0].x * 7 + pts[0].y * 3 + length));
  const strip = brancheStrip(scene, { length, kx, ky, left, right, forks: b.forks || [], seed });
  const lift = BRANCHE_FOOT_SINK_ROWS * ky;
  if (!needsBend) return { canvas: strip.canvas, dx: -strip.overL, dy: -strip.walkRow - lift };
  const bent = brancheBend(strip, path || branchePath(pts), b.taper);
  return { canvas: bent.canvas, dx: bent.x - pts[0].x, dy: bent.y - pts[0].y - lift };
}

// Texture composée une fois par branche, réutilisée d'une visite à l'autre (la
// position n'y entre que par la phase de l'écorce). Clé 'autotile-…' : Liane.js
// (vineBlockAbove) mesure le bas visible des images de ce préfixe pour rentrer le
// haut de la liane dans le bloc qui la porte.
function brancheTextureKey(scene, b) {
  const pts = branchePoints(b);
  const rel = pts.map((p) => [p.x - pts[0].x, p.y - pts[0].y]);
  const sig = JSON.stringify([rel, b.thickness, b.scaleX, b.attach, b.tip, b.forks, b.bend, b.taper, Math.round(pts[0].x * 7 + pts[0].y * 3), brancheHasArt(scene)]);
  return `autotile-branche-${brancheHash(sig)}`;
}

function addBranchImage(scene, b) {
  const pts = branchePoints(b);
  const key = brancheTextureKey(scene, b);
  let meta = BRANCHE_META.get(key);
  if (!meta || !scene.textures.exists(`${key}-0`)) {
    const { canvas, dx, dy } = brancheCompose(scene, b);
    const chunks = [];
    for (let i = 0, x = 0; x < canvas.width; i++, x += BRANCHE_MAX_TEXTURE) {
      const w = Math.min(BRANCHE_MAX_TEXTURE, canvas.width - x);
      const part = brancheCanvas(w, canvas.height);
      part.getContext('2d').drawImage(canvas, x, 0, w, canvas.height, 0, 0, w, canvas.height);
      const k = `${key}-${i}`;
      if (scene.textures.exists(k)) scene.textures.remove(k);
      scene.textures.addCanvas(k, part);
      chunks.push({ key: k, x });
    }
    meta = { dx, dy, chunks };
    BRANCHE_META.set(key, meta);
  }
  return meta.chunks.map((c) => {
    const img = scene.add.image(pts[0].x + meta.dx + c.x, pts[0].y + meta.dy, c.key).setOrigin(0, 0);
    if (b.tint != null) img.setTint(b.tint);
    // Rendu de cohésion (LookKit) : plan de jeu, sans teinte de tuile.
    img.lookRole = 'world';
    return img;
  });
}
const BRANCHE_META = new Map();

// Branches de la zone, dans l'ordre de la donnée (la dernière passe devant).
function addZoneBranches(scene, data) {
  const images = [];
  for (const b of data.branches || []) {
    if (!b || !b.from || !b.to) continue;
    images.push(...addBranchImage(scene, b));
  }
  return images;
}

// ---------------------------------------------------------------------------
// Troncs
// ---------------------------------------------------------------------------
function addTrunkImage(scene, t, data) {
  const k = t.scale || 0.25;
  const levelTop = Math.min(-400, (data && data.levelTop) ?? -400);
  const top = t.top ?? levelTop;
  const bottom = t.bottom ?? ((data && data.levelHeight) || 540);
  const hasBase = !!t.base;
  const segW = Math.round(TRONC_SEGMENT_COLS * k);
  const tileH = Math.round(TRONC_SEGMENT_ROWS * k);
  const baseW = Math.round(TRONC_BASE_COLS * k);
  const baseH = Math.round(TRONC_BASE_ROWS * k);
  const groundRow = Math.round(TRONC_BASE_GROUND_ROW * k);
  const sig = JSON.stringify([k, bottom - top, hasBase, t.flipX, brancheHasArt(scene)]);
  const key = `tronc-${brancheHash(sig)}`;
  const w = hasBase ? baseW : segW;
  const h = bottom - top + (hasBase ? baseH - groundRow : 0);
  if (!scene.textures.exists(key)) {
    const canvas = brancheCanvas(w, h);
    const ctx = brancheCtx(canvas);
    const footTop = bottom - top - groundRow;
    // Fût : du pied vers le haut, pour que le segment du bas se raccorde au pied.
    const seg = branchePiece(scene, 'tronc_segment');
    const dx = Math.round((w - segW) / 2);
    for (let y = hasBase ? footTop : h; y > 0; y -= tileH) ctx.drawImage(seg, dx, y - tileH, segW, tileH);
    if (hasBase) ctx.drawImage(branchePiece(scene, 'tronc_base'), 0, footTop, baseW, baseH);
    scene.textures.addCanvas(key, canvas);
  }
  const img = scene.add.image(t.x - w / 2, top, key).setOrigin(0, 0);
  if (t.flipX) img.setFlipX(true);
  if (t.tint != null) img.setTint(t.tint);
  img.lookRole = 'world';
  return img;
}

function addZoneTrunks(scene, data) {
  return (data.trunks || []).filter((t) => t && t.x != null).map((t) => addTrunkImage(scene, t, data));
}

// ---------------------------------------------------------------------------
// Repli : les mêmes pièces dessinées par code (art n°11 absent)
// ---------------------------------------------------------------------------
// Même cadre que l'art (ligne de marche 256, dessous 480, pièces tronc à gauche) :
// le reste de la chaîne n'a rien à savoir. Pas un rectangle : dessus de mousse,
// écorce veinée, nœuds, dessous irrégulier et violet.
const BRANCHE_FALLBACK = new Map();

function brancheFallbackPiece(id) {
  if (BRANCHE_FALLBACK.has(id)) return BRANCHE_FALLBACK.get(id);
  const paint = {
    branche_milieu: () => brancheFallbackBark(BRANCHE_TILE_COLS, { knots: [260, 870, 1330] }),
    branche_base: brancheFallbackBase,
    branche_bout: brancheFallbackTip,
    branche_fourche: brancheFallbackFork,
    tronc_segment: brancheFallbackTrunk,
    tronc_base: brancheFallbackFoot,
  }[id];
  const canvas = paint();
  BRANCHE_FALLBACK.set(id, canvas);
  return canvas;
}

const BRANCHE_INK = '#160d17';
const BRANCHE_BARK = ['#7a4630', '#5e3426', '#3f2430', '#2a1c3c'];
const BRANCHE_MOSS = ['#3f5a14', '#6f8f1e', '#a3bb2e'];

function brancheBarkGradient(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  BRANCHE_BARK.forEach((col, i) => g.addColorStop(i / (BRANCHE_BARK.length - 1), col));
  return g;
}

// Veines : ondulations périodiques en x (fréquences entières sur la largeur).
function brancheVeins(ctx, w, y0, y1, count = 8) {
  const period = (Math.PI * 2) / w;
  for (let n = 0; n < count; n++) {
    const base = y0 + ((n + 0.5) / count) * (y1 - y0);
    for (const [col, width, shift] of [[BRANCHE_INK, 5, 0], ['#a2643f', 2.5, 7]]) {
      ctx.strokeStyle = col;
      ctx.globalAlpha = col === BRANCHE_INK ? 0.8 : 0.5;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let x = -8; x <= w + 8; x += 12) {
        const y = base + shift + Math.sin(x * period * (2 + (n % 3)) + n * 1.7) * 13 + Math.sin(x * period * (5 + n) + n) * 5;
        if (x < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function brancheKnot(ctx, x, y, r) {
  ctx.fillStyle = '#5e3426';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.4, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BRANCHE_INK;
  for (let i = 0; i < 4; i++) {
    ctx.lineWidth = i === 0 ? 6 : 4;
    ctx.beginPath();
    ctx.ellipse(x, y, (r * 1.4 * (4 - i)) / 4, (r * (4 - i)) / 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Mousse le long d'une fonction de hauteur `top(x)`, avec coulures périodiques.
function brancheMoss(ctx, x0, x1, top, seed = 3) {
  const layer = (col, depth, spike) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x0, top(x0) - 2);
    for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, top(x) - 2 - (Math.sin(x * 0.31 + seed) > 0.6 ? 3 : 0));
    for (let x = x1; x >= x0; x -= 8) {
      const n = Math.sin(x * 0.083 + seed) + Math.sin(x * 0.211 + seed * 2);
      ctx.lineTo(x, top(x) + depth + (n > 1 ? spike * (n - 1) : Math.abs(n) * 5));
    }
    ctx.closePath();
    ctx.fill();
  };
  layer(BRANCHE_INK, 34, 76);
  layer(BRANCHE_MOSS[0], 30, 68);
  layer(BRANCHE_MOSS[1], 20, 34);
  layer(BRANCHE_MOSS[2], 8, 0);
  // Quelques fleurs roses et points turquoise (palette du jeu).
  for (let x = x0 + 60; x < x1 - 40; x += 197) {
    ctx.fillStyle = (x % 2) ? '#ff9ad5' : '#7fe8d8';
    ctx.fillRect(x, top(x) + 8, 10, 10);
  }
}

// Morceau de branche périodique : dessus plat, dessous irrégulier.
function brancheFallbackBark(w, { knots = [] } = {}) {
  const c = brancheCanvas(w, BRANCHE_SRC_ROWS);
  const ctx = brancheCtx(c);
  const period = (Math.PI * 2) / w;
  const bottom = (x) => BRANCHE_UNDER_ROW + Math.sin(x * period * 7) * 7 + Math.sin(x * period * 19 + 1) * 4;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(-16, BRANCHE_WALK_ROW);
    ctx.lineTo(w + 16, BRANCHE_WALK_ROW);
    for (let x = w + 16; x >= -16; x -= 12) ctx.lineTo(x, bottom(x));
    ctx.closePath();
  };
  ctx.save();
  shape();
  ctx.fillStyle = brancheBarkGradient(ctx, BRANCHE_WALK_ROW, BRANCHE_UNDER_ROW);
  ctx.fill();
  ctx.clip();
  brancheVeins(ctx, w, BRANCHE_WALK_ROW + 30, BRANCHE_UNDER_ROW - 8);
  for (const x of knots) brancheKnot(ctx, x, BRANCHE_WALK_ROW + 112, 34);
  ctx.restore();
  shape();
  ctx.strokeStyle = BRANCHE_INK;
  ctx.lineWidth = 8;
  ctx.stroke();
  brancheMoss(ctx, 0, w, () => BRANCHE_WALK_ROW);
  return c;
}

// Base : mêmes bords à droite que le milieu ; à gauche, l'écorce s'évase en
// mèches qui se fondent dans le tronc, et la mousse grimpe.
function brancheFallbackBase() {
  const w = BRANCHE_BASE_OVER + BRANCHE_BASE_WALK;
  const c = brancheCanvas(w, BRANCHE_SRC_ROWS);
  const ctx = brancheCtx(c);
  ctx.drawImage(brancheFallbackPiece('branche_milieu'), 0, 0, w, BRANCHE_SRC_ROWS, 0, 0, w, BRANCHE_SRC_ROWS);
  ctx.clearRect(0, 0, BRANCHE_BASE_OVER, BRANCHE_SRC_ROWS);
  const top = (x) => BRANCHE_WALK_ROW - Math.max(0, BRANCHE_BASE_OVER - x) * 0.68;
  ctx.fillStyle = brancheBarkGradient(ctx, 90, BRANCHE_UNDER_ROW);
  ctx.strokeStyle = BRANCHE_INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(BRANCHE_BASE_OVER + 2, BRANCHE_WALK_ROW);
  for (let x = BRANCHE_BASE_OVER; x >= 96; x -= 16) ctx.lineTo(x, top(x));
  // Mèches : pointes vers le tronc, à hauteurs variées.
  [[6, 150, 60, 186], [24, 232, 70, 262], [10, 306, 62, 340], [24, 384, 66, 418], [8, 470, 60, BRANCHE_UNDER_ROW + 8]]
    .forEach(([tipX, tipY, backX, backY]) => { ctx.lineTo(tipX, tipY); ctx.lineTo(backX, backY); });
  ctx.lineTo(BRANCHE_BASE_OVER + 2, BRANCHE_UNDER_ROW + 6);
  // Contour ouvert du côté du milieu : pas de trait vertical au raccord.
  ctx.stroke();
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = BRANCHE_INK;
  ctx.lineWidth = 4;
  for (let y = 120; y < BRANCHE_UNDER_ROW; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y - 10);
    ctx.quadraticCurveTo(BRANCHE_BASE_OVER * 0.6, y + 24, BRANCHE_BASE_OVER + 4, BRANCHE_WALK_ROW + (y - 120) * 0.62);
    ctx.stroke();
  }
  ctx.restore();
  brancheMoss(ctx, 100, BRANCHE_BASE_OVER, top, 5);
  return c;
}

// Bout : le dessus reste plat, le dessous remonte jusqu'à la pointe feuillue.
function brancheFallbackTip() {
  const w = BRANCHE_TIP_WALK + BRANCHE_TIP_OVER;
  const c = brancheCanvas(w, BRANCHE_SRC_ROWS);
  const ctx = brancheCtx(c);
  const bottom = (x) => {
    if (x <= 170) return BRANCHE_UNDER_ROW + Math.sin(x * 0.04) * 6;
    const t = (x - 170) / (396 - 170);
    return BRANCHE_UNDER_ROW + (BRANCHE_WALK_ROW + 32 - BRANCHE_UNDER_ROW) * Math.pow(Math.min(1, t), 1.5);
  };
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(-4, BRANCHE_WALK_ROW);
    ctx.lineTo(392, BRANCHE_WALK_ROW);
    ctx.lineTo(398, BRANCHE_WALK_ROW + 24);
    for (let x = 396; x >= -4; x -= 8) ctx.lineTo(x, bottom(x));
    ctx.closePath();
  };
  ctx.save();
  shape();
  ctx.fillStyle = brancheBarkGradient(ctx, BRANCHE_WALK_ROW, BRANCHE_UNDER_ROW);
  ctx.fill();
  ctx.clip();
  brancheVeins(ctx, BRANCHE_TILE_COLS, BRANCHE_WALK_ROW + 30, BRANCHE_UNDER_ROW - 8, 6);
  ctx.restore();
  shape();
  ctx.strokeStyle = BRANCHE_INK;
  ctx.lineWidth = 8;
  ctx.stroke();
  brancheMoss(ctx, 0, 386, () => BRANCHE_WALK_ROW, 2);
  brancheLeaf(ctx, 402, BRANCHE_WALK_ROW + 22, -0.7);
  brancheLeaf(ctx, 402, BRANCHE_WALK_ROW + 28, 0.35);
  return c;
}

function brancheLeaf(ctx, x, y, angle, size = 42) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = BRANCHE_MOSS[1];
  ctx.strokeStyle = BRANCHE_INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.45, size, 0);
  ctx.quadraticCurveTo(size * 0.5, size * 0.45, 0, 0);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Fourche : milieu + bras décoratif qui s'élève vers la droite.
function brancheFallbackFork() {
  const c = brancheCanvas(BRANCHE_FORK_COLS, BRANCHE_SRC_ROWS);
  const ctx = brancheCtx(c);
  ctx.drawImage(brancheFallbackPiece('branche_milieu'), 0, 0, BRANCHE_FORK_COLS, BRANCHE_SRC_ROWS, 0, 0, BRANCHE_FORK_COLS, BRANCHE_SRC_ROWS);
  ctx.fillStyle = brancheBarkGradient(ctx, 100, BRANCHE_WALK_ROW);
  ctx.strokeStyle = BRANCHE_INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(360, BRANCHE_WALK_ROW);
  ctx.quadraticCurveTo(620, 190, 890, 108);
  ctx.lineTo(896, 122);
  ctx.quadraticCurveTo(740, 230, 580, BRANCHE_WALK_ROW);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const arm = (x) => BRANCHE_WALK_ROW - (x - 360) * 0.272;
  brancheMoss(ctx, 380, 880, arm, 7);
  brancheLeaf(ctx, 892, 112, -0.6, 32);
  brancheLeaf(ctx, 892, 116, 0.4, 32);
  return c;
}

// Tronc : l'écorce d'une branche, couchée à la verticale, sans mousse continue.
function brancheFallbackTrunk() {
  const c = brancheCanvas(TRONC_SEGMENT_COLS, TRONC_SEGMENT_ROWS);
  const ctx = brancheCtx(c);
  const w = TRONC_SEGMENT_COLS;
  const h = TRONC_SEGMENT_ROWS;
  const period = (Math.PI * 2) / h;
  const edge = (y) => Math.sin(y * period * 5) * 8;
  ctx.beginPath();
  ctx.moveTo(12 + edge(0), 0);
  for (let y = 0; y <= h; y += 16) ctx.lineTo(12 + edge(y), y);
  for (let y = h; y >= 0; y -= 16) ctx.lineTo(w - 12 - edge(y), y);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#2a1c3c');
  g.addColorStop(0.18, '#55302c');
  g.addColorStop(0.5, '#7a4630');
  g.addColorStop(0.82, '#55302c');
  g.addColorStop(1, '#2a1c3c');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let n = 0; n < 11; n++) {
    const base = ((n + 0.5) / 11) * w;
    for (const [col, width, shift, alpha] of [[BRANCHE_INK, 7, 0, 0.8], ['#a2643f', 3, 9, 0.45]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let y = -8; y <= h + 8; y += 16) {
        const x = base + shift + Math.sin(y * period * (2 + (n % 3)) + n * 1.9) * 22 + Math.sin(y * period * (6 + n) + n) * 7;
        if (y < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  brancheKnot(ctx, 240, 340, 70);
  brancheKnot(ctx, 540, 1060, 78);
  // Coulées de mousse verticales.
  ctx.fillStyle = BRANCHE_MOSS[1];
  for (const [x, y, len] of [[90, 480, 150], [420, 620, 180], [600, 300, 130], [230, 1020, 120], [440, 1280, 140]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 22, y + len / 2, x, y + len);
    ctx.quadraticCurveTo(x - 22, y + len / 2, x, y);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = BRANCHE_INK;
  ctx.lineWidth = 10;
  for (const side of [(y) => 12 + edge(y), (y) => w - 12 - edge(y)]) {
    ctx.beginPath();
    for (let y = 0; y <= h; y += 16) { if (y === 0) ctx.moveTo(side(y), y); else ctx.lineTo(side(y), y); }
    ctx.stroke();
  }
  return c;
}

// Pied : le bas du fût + racines qui s'évasent sur le sol (ligne de sol 960).
function brancheFallbackFoot() {
  const c = brancheCanvas(TRONC_BASE_COLS, TRONC_BASE_ROWS);
  const ctx = brancheCtx(c);
  const w = TRONC_BASE_COLS;
  const dx = (w - TRONC_SEGMENT_COLS) / 2;
  ctx.drawImage(brancheFallbackPiece('tronc_segment'), 0, 0, TRONC_SEGMENT_COLS, TRONC_BASE_ROWS, dx, 0, TRONC_SEGMENT_COLS, TRONC_BASE_ROWS);
  ctx.clearRect(0, TRONC_BASE_GROUND_ROW, w, TRONC_BASE_ROWS - TRONC_BASE_GROUND_ROW);
  const root = (a, b, tipX, tipY, c1x, c1y) => {
    ctx.fillStyle = brancheBarkGradient(ctx, 700, TRONC_BASE_GROUND_ROW);
    ctx.strokeStyle = BRANCHE_INK;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(a, 740);
    ctx.quadraticCurveTo(c1x, c1y, tipX, tipY);
    ctx.quadraticCurveTo((tipX + b) / 2, TRONC_BASE_GROUND_ROW + 6, b, TRONC_BASE_GROUND_ROW - 6);
    ctx.lineTo(b, 740);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  root(dx + 90, dx + 120, 6, 942, dx - 60, 830);
  root(dx + TRONC_SEGMENT_COLS - 90, dx + TRONC_SEGMENT_COLS - 120, w - 6, 942, dx + TRONC_SEGMENT_COLS + 60, 830);
  root(dx + 180, dx + 300, dx + 40, 950, dx + 120, 860);
  root(dx + TRONC_SEGMENT_COLS - 180, dx + TRONC_SEGMENT_COLS - 300, dx + TRONC_SEGMENT_COLS - 40, 950, dx + TRONC_SEGMENT_COLS - 120, 860);
  root(dx + 320, dx + 470, dx + 395, 958, dx + 380, 860);
  return c;
}

// La clé n'a rien à faire aux handlers (branches et troncs sont construits avec
// le sol, avant les totems et les feux qui s'y posent, cf. buildLevelFromData) :
// entrées vides pour signaler qu'elles sont connues, comme `background`.
LEVEL_DATA_HANDLERS.branches = () => {};
LEVEL_DATA_HANDLERS.trunks = () => {};
