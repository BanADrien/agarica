// StoryKit — couche « histoire » de la démo : registres partagés, assets du
// manifest Codex (avec placeholders tant que l'art n'existe pas), état
// persistant, dialogues, cinématiques. Contrat d'API complet :
// docs/production/PLAN_DEV.md. Chargé juste après LevelKit.js et
// asset_manifest.js, avant les entités (qui s'enregistrent dans les registres).

// ---------------------------------------------------------------------------
// Registres globaux (remplis par les fichiers d'entités et src/story/*.js)
// ---------------------------------------------------------------------------
const ENEMY_REGISTRY = {};
const LEVEL_DATA_HANDLERS = {};
const LEVEL_UPDATE_HOOKS = [];
const DIALOGUES = {};
const CUTSCENES = {};
const ZONE_SCRIPTS = {};

// ---------------------------------------------------------------------------
// Assets du manifest (src/data/asset_manifest.js)
// ---------------------------------------------------------------------------
function getAssetManifest() {
  return typeof ASSET_MANIFEST !== 'undefined' ? ASSET_MANIFEST : {};
}

function getItemManifest() {
  return typeof ITEM_MANIFEST !== 'undefined' ? ITEM_MANIFEST : {};
}

function manifestFrameKey(id, anim, i) {
  return `${id}-${anim}-${i}`;
}

// Ne charge QUE les fichiers du manifest réellement présents sur disque
// (`ASSET_PRESENT`, src/data/asset_present.js, régénéré par
// tools/import_codex_assets.py) : demander les centaines de frames pas encore
// générées coûtait autant de 404 et plus de 30 s de chargement. Liste absente
// → aucun art du manifest, placeholders partout.
function assetPresent(path) {
  return typeof ASSET_PRESENT !== 'undefined' && ASSET_PRESENT.has(path);
}

function loadManifestAssets(scene) {
  for (const [id, def] of Object.entries(getAssetManifest())) {
    for (const [anim, a] of Object.entries(def.anims || {})) {
      for (let i = 0; i < a.frames; i++) {
        const path = `${def.dir}/${def.prefix}_row${a.row}_${i}.png`;
        if (assetPresent(path)) scene.load.image(manifestFrameKey(id, anim, i), path);
      }
    }
  }
  for (const [id, def] of Object.entries(getItemManifest())) {
    if (def.path && assetPresent(def.path)) scene.load.image(`item-${id}`, def.path);
  }
}

// Placeholder dessiné sur un canvas à la résolution SOURCE (taille écran /
// échelle) : ainsi l'entité garde la même échelle et les mêmes hitbox qu'avec
// le vrai art, seul le visuel change le jour où la feuille Codex arrive.
function ensurePlaceholderTexture(scene, key, ph, scale) {
  if (scene.textures.exists(key)) return key;
  const s = scale || 1;
  const w = Math.max(4, Math.round((ph.w || 40) / s));
  const h = Math.max(4, Math.round((ph.h || 40) / s));
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  const color = `#${(ph.color ?? 0x8866aa).toString(16).padStart(6, '0')}`;
  const r = Math.min(w, h) * 0.18;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#120c1e';
  ctx.lineWidth = Math.max(2, Math.round(3 / s));
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (ph.label) {
    const fontPx = Math.max(8, Math.round(11 / s));
    ctx.font = `bold ${fontPx}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ph.label, w / 2, h / 2, w - 4);
  }
  tex.refresh();
  return key;
}

function manifestPlaceholderKey(scene, id) {
  const def = getAssetManifest()[id] || getItemManifest()[id] || {};
  const ph = def.placeholder || { w: 40, h: 40, color: 0x8866aa, label: id };
  return ensurePlaceholderTexture(scene, `ph-${id}`, ph, def.scale);
}

function hasManifestArt(scene, id, anim) {
  const def = getAssetManifest()[id];
  if (!def) return scene.textures.exists(`item-${id}`);
  const anims = anim ? [anim] : Object.keys(def.anims || {});
  return anims.some((a) => scene.textures.exists(manifestFrameKey(id, a, 0)));
}

function manifestInitialTexture(scene, id, anim) {
  const def = getAssetManifest()[id];
  const first = anim || (def && Object.keys(def.anims || {})[0]) || 'idle';
  const key = manifestFrameKey(id, first, 0);
  return scene.textures.exists(key) ? key : manifestPlaceholderKey(scene, id);
}

// Frames présentes d'une anim du manifest (liste vide si la rangée manque).
function manifestAnimFrames(scene, id, anim) {
  const a = ((getAssetManifest()[id] || {}).anims || {})[anim];
  const frames = [];
  for (let i = 0; a && i < a.frames; i++) {
    const key = manifestFrameKey(id, anim, i);
    if (scene.textures.exists(key)) frames.push({ key });
  }
  return frames;
}

function ensureManifestAnims(scene, id) {
  const def = getAssetManifest()[id];
  if (!def) return;
  // Art partiel (ex. Kainati : rangées 0-3 livrées, hit/defeated pas encore) :
  // une rangée manquante rejoue l'idle (ou la 1re rangée livrée) plutôt que de
  // faire clignoter le rectangle placeholder au milieu du vrai art.
  const animNames = Object.keys(def.anims || {});
  const fallbackAnim = ['idle', ...animNames].find((n) => manifestAnimFrames(scene, id, n).length > 0);
  const fallbackFrames = fallbackAnim ? manifestAnimFrames(scene, id, fallbackAnim) : [];
  for (const [anim, a] of Object.entries(def.anims || {})) {
    const animKey = `${id}-${anim}`;
    if (scene.anims.exists(animKey)) continue;
    let frames = manifestAnimFrames(scene, id, anim);
    if (frames.length === 0) frames = fallbackFrames.slice();
    if (frames.length === 0) frames.push({ key: manifestPlaceholderKey(scene, id) });
    scene.anims.create({ key: animKey, frames, frameRate: a.fps || 8, repeat: a.repeat ?? -1 });
  }
}

// Rangées (anims) dessinées sur la même IMAGE SOURCE que la rangée `anim` de
// l'entrée `id` (manifest `sheets: [{file, rows}]`) ; sans `sheets`, toute
// l'entrée = une feuille. Toutes ces rangées partagent la même échelle de
// dessin : c'est l'unité de calibrage (cf. manifestSheetScale).
function manifestSheetAnims(id, anim) {
  const def = getAssetManifest()[id];
  if (!def || !def.anims || !def.anims[anim]) return [];
  const row = def.anims[anim].row;
  const sheet = (def.sheets || []).find((s) => (s.rows || []).includes(row));
  return Object.keys(def.anims).filter((a) => !sheet || sheet.rows.includes(def.anims[a].row));
}

// Échelle calibrée (cf. calibratedScale, LevelKit) de la feuille qui contient
// la rangée `anim` de `id` : UNE valeur pour toutes ses rangées (ex. `death`,
// couchée, prend l'échelle de `talk`, debout, dessinée sur la même image).
// `opts` : refKey / refScale (référence de taille), method, maxScale.
// { scale, method } mis en cache, ou null sans art (garder l'échelle du manifest).
const MANIFEST_SHEET_SCALE_CACHE = new Map();
function manifestSheetScale(scene, id, anim, opts = {}) {
  const anims = manifestSheetAnims(id, anim);
  const ck = `${id}|${anims.join(',')}|${opts.refKey}|${opts.refScale}|${opts.method || 'auto'}|${opts.maxScale ?? ''}`;
  if (MANIFEST_SHEET_SCALE_CACHE.has(ck)) return MANIFEST_SHEET_SCALE_CACHE.get(ck);
  const keys = anims.flatMap((a) => manifestAnimFrames(scene, id, a).map((f) => f.key));
  const res = keys.length ? calibratedScale(scene, keys, opts) : null;
  // Pas de mise en cache d'un échec de lecture (art pas encore chargé).
  if (res) MANIFEST_SHEET_SCALE_CACHE.set(ck, res);
  return res;
}

// Plus petite marge transparente sous les pieds parmi toutes les frames
// présentes d'une entrée (px de la frame ; 0 sans art). Décalage CONSTANT pour
// poser le bas visible d'une entité physique sur le bas de son corps sans
// tressautement d'une anim à l'autre (cf. applyEnemyManifestArt).
const MANIFEST_FOOT_MARGIN_CACHE = new Map();
function manifestFootMargin(scene, id) {
  if (MANIFEST_FOOT_MARGIN_CACHE.has(id)) return MANIFEST_FOOT_MARGIN_CACHE.get(id);
  let m = Infinity;
  for (const anim of Object.keys((getAssetManifest()[id] || {}).anims || {})) {
    for (const f of manifestAnimFrames(scene, id, anim)) {
      const b = visibleBounds(scene, f.key);
      if (b && b.exact && !b.empty) m = Math.min(m, b.marginB);
    }
  }
  m = Number.isFinite(m) ? m : 0;
  MANIFEST_FOOT_MARGIN_CACHE.set(id, m);
  return m;
}

// PNJ humanoïdes dont les images sources n'ont pas été dessinées à la même
// échelle (mesuré : Geralt p2 -- marche, carte -- ~18 % plus grand que p1,
// Amanite p2 ~12 %) : chaque anim reçoit le facteur de SA feuille par
// rapport à celle de l'idle (cf. manifestSheetScale, calibrage visuel), il ne
// grandit plus en se mettant à marcher. Bêtes (Ghil't, Kainati) : feuilles
// cohérentes à l'œil, et la détection « debout neutre » ne s'y applique pas.
const MANIFEST_SHEET_CALIBRATED = ['geralt', 'amanite'];
function manifestSheetFactor(scene, id, anim) {
  if (!MANIFEST_SHEET_CALIBRATED.includes(id)) return 1;
  const refKey = manifestFrameKey(id, 'idle', 0);
  if (!scene.textures.exists(refKey)) return 1;
  const a = manifestSheetScale(scene, id, anim, { refKey, refScale: 1 });
  const b = manifestSheetScale(scene, id, 'idle', { refKey, refScale: 1 });
  return a && b ? a.scale / b.scale : 1;
}

function attachPlayManifest(sprite, id) {
  sprite.manifestId = id;
  sprite.playManifest = function playManifest(anim, ignoreIfPlaying = true) {
    const key = `${id}-${anim}`;
    if (!this.scene || !this.scene.anims.exists(key)) return this;
    // Facteur de feuille (cf. manifestSheetFactor), multiplicatif : une
    // échelle réglée par l'appelant (cochons de tailles différentes…) est gardée.
    const f = manifestSheetFactor(this.scene, id, anim);
    const prev = this.__sheetFactor || 1;
    if (Math.abs(f - prev) > 1e-4) {
      this.setScale((this.scaleX / prev) * f, (this.scaleY / prev) * f);
      this.__sheetFactor = f;
    }
    this.currentManifestAnim = anim;
    // Sortie d'une pose de repos figée (cf. storyNpcRest, storyStageDialogueLine).
    this.__restPaused = false;
    this.__holdPose = null;
    if (this.anims && this.anims.isPaused) this.anims.resume();
    return this.play(key, ignoreIfPlaying);
  };
  return sprite;
}

function addManifestSprite(scene, x, y, id, anim = 'idle', { physics = false, origin = [0.5, 1] } = {}) {
  const def = getAssetManifest()[id] || {};
  ensureManifestAnims(scene, id);
  const texture = manifestInitialTexture(scene, id, anim);
  const sprite = physics ? scene.physics.add.sprite(x, y, texture) : scene.add.sprite(x, y, texture);
  sprite.setOrigin(origin[0], origin[1]);
  sprite.setScale(def.scale || 1);
  attachPlayManifest(sprite, id);
  sprite.playManifest(anim);
  // Ancré par le bas : `y` = bas VISIBLE des pieds pour toutes les anims (les
  // planches Codex gardent 4-5 px transparents sous les pieds, cf.
  // anchorVisibleFeet) -- PNJ, animaux, VFX posés au sol.
  if (origin[1] === 1) anchorVisibleFeet(sprite, { body: physics });
  return sprite;
}

// Objets de l'inventaire sans art Codex prévu, dessinés par code (plus
// lisible qu'un rectangle étiqueté) : la note de Geralt = papier griffonné.
// Canvas sans image source : jamais « tainted », même en file://.
const STORY_DRAWN_ITEMS = {
  note_geralt: {
    w: 100, h: 120, scale: 0.36,
    draw(ctx, w, h) {
      ctx.fillStyle = '#e9d3a0';
      ctx.strokeStyle = '#8a6438';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(8, 10); ctx.lineTo(w - 30, 6); ctx.lineTo(w - 6, 30); ctx.lineTo(w - 10, h - 8);
      ctx.lineTo(12, h - 4); ctx.lineTo(6, h / 2); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9a66a'; // coin replié
      ctx.beginPath(); ctx.moveTo(w - 30, 6); ctx.lineTo(w - 28, 30); ctx.lineTo(w - 6, 30); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#4a2e16';
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const y = 34 + i * 13;
        ctx.beginPath();
        ctx.moveTo(18, y);
        for (let x = 18; x < w - 22 - (i % 3) * 10; x += 8) ctx.lineTo(x + 4, y + ((x / 8) % 2 ? -2 : 2));
        ctx.stroke();
      }
      ctx.fillStyle = '#b03a2e'; // trace de pince de Clak
      ctx.beginPath(); ctx.arc(w - 26, h - 24, 6, 0, Math.PI * 2); ctx.fill();
    },
  },
  // Consommables (cf. CONSUMABLE_INFO) : pas d'art Codex pour l'instant.
  baie_soin: {
    w: 100, h: 100, scale: 0.4,
    draw(ctx, w, h) {
      ctx.strokeStyle = '#2a1a12';
      ctx.lineWidth = 4;
      // Tige et feuille.
      ctx.fillStyle = '#5aa04a';
      ctx.beginPath(); ctx.ellipse(62, 22, 18, 8, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(50, 36); ctx.lineTo(54, 16); ctx.stroke();
      // Trois grains rouges (rose framboise, palette du jeu).
      for (const [x, y, r] of [[36, 56, 20], [64, 58, 20], [50, 76, 19]]) {
        ctx.fillStyle = '#d8345f';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffb3c9';
        ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, Math.PI * 2); ctx.fill();
      }
    },
  },
  seve_energie: {
    w: 100, h: 110, scale: 0.4,
    draw(ctx, w, h) {
      ctx.strokeStyle = '#1a1028';
      ctx.lineWidth = 4;
      // Fiole : bouchon, col, panse ronde remplie de sève vert lunaire.
      ctx.fillStyle = '#8a6438';
      ctx.fillRect(40, 8, 20, 14); ctx.strokeRect(40, 8, 20, 14);
      ctx.fillStyle = 'rgba(220,235,255,0.35)';
      ctx.beginPath(); ctx.moveTo(42, 22); ctx.lineTo(58, 22); ctx.lineTo(58, 40);
      ctx.arc(50, 70, 32, -Math.PI / 2 + 0.25, Math.PI * 1.5 - 0.25); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8fe3b8';
      ctx.beginPath(); ctx.arc(50, 70, 27, 0.15, Math.PI - 0.15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8fff2';
      ctx.beginPath(); ctx.arc(40, 78, 4, 0, Math.PI * 2); ctx.arc(58, 84, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(50, 70, 24, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
    },
  },
};

function storyDrawnItemKey(scene, id) {
  const d = STORY_DRAWN_ITEMS[id];
  if (!d) return null;
  const key = `drawn-item-${id}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, d.w, d.h);
    d.draw(tex.getContext(), d.w, d.h);
    tex.refresh();
  }
  return key;
}

function addItemImage(scene, x, y, id, { origin = [0.5, 0.5] } = {}) {
  const def = getItemManifest()[id] || {};
  let key = `item-${id}`;
  let scale = def.scale || 1;
  if (!scene.textures.exists(key)) {
    const drawn = storyDrawnItemKey(scene, id);
    key = drawn || manifestPlaceholderKey(scene, id);
    if (drawn) scale = STORY_DRAWN_ITEMS[id].scale;
  }
  const img = scene.add.image(x, y, key).setOrigin(origin[0], origin[1]);
  img.setScale(scale);
  return img;
}


// Image d'objet ajustée pour tenir dans un carré de `size` px (inventaire,
// popups) quelle que soit la taille de l'art ou du placeholder.
function addItemIcon(scene, x, y, id, size) {
  const img = addItemImage(scene, x, y, id);
  const s = size / Math.max(img.width, img.height, 1);
  img.setScale(s);
  return img;
}

// ---------------------------------------------------------------------------
// Ennemis existants (les fichiers d'entités peuvent écraser ces entrées en
// s'enregistrant eux-mêmes plus bas dans index.html). Classes résolues à
// l'appel : elles sont définies APRÈS ce fichier.
// ---------------------------------------------------------------------------
ENEMY_REGISTRY.araignee = (scene, e) => {
  const a = new Araignee(scene, e.x, e.y);
  // Fixe et inoffensive au contact (seule sa toile gêne, cf. Web.js).
  a.harmless = true;
  a.noGravity = true;
  return a;
};
ENEMY_REGISTRY.loup = (scene, e) => new LoupSanguinaire(scene, e.x, e.y, e.patrolMinX, e.patrolMaxX);
ENEMY_REGISTRY.loupAlpha = (scene, e) => new LoupAlpha(scene, e.x, e.y, e.patrolMinX, e.patrolMaxX);
ENEMY_REGISTRY.corbeau = (scene, e) => {
  const c = new Corbeau(scene, e.x, e.y, e.patrolMinX, e.patrolMaxX, e.diveDepth ?? 220);
  c.noGravity = true;
  return c;
};
ENEMY_REGISTRY.crapaud = (scene, e) => new Crapaud(scene, e.x, e.y);

// ---------------------------------------------------------------------------
// Zones de la démo : ordre de l'histoire, région de la carte de Geralt.
// Sert à reconnaître une « scène d'histoire » (Xara conditionnelle,
// sauvegarde auto, carte) par opposition aux anciennes zones de test.
// ---------------------------------------------------------------------------
const STORY_REGIONS = [
  { id: 'bosquet', name: "Bosquet d'Émeraude" },
  { id: 'foret_sombre', name: 'Forêt sombre' },
  { id: 'grand_arbre', name: 'Grand arbre' },
  { id: 'foret_flottante', name: 'Forêt flottante' },
  { id: 'foret_corrompue', name: 'Forêt corrompue' },
];

const DEMO_ZONES = [
  // Vague 3 (2026-11-08) : les 10 zones facultatives (VAGUE3_DESIGN.md § 1.2)
  // suivent chacune la zone d'où l'on y entre ; la région colore la carte.
  { zone: 'bosquet', scene: 'BosquetScene', region: 'bosquet', name: "Bosquet d'Émeraude" },
  { zone: 'foret_sombre_1', scene: 'ForetSombre1Scene', region: 'foret_sombre', name: 'Forêt sombre' },
  { zone: 'grotte_lisiere', scene: 'GrotteLisiereScene', region: 'foret_sombre', name: 'Grotte de la lisière' },
  { zone: 'foret_sombre_2', scene: 'ForetSombre2Scene', region: 'foret_sombre', name: 'Forêt sombre — les ravins' },
  { zone: 'cercle_lune', scene: 'CercleLuneScene', region: 'foret_sombre', name: 'Cercle de lune' },
  { zone: 'grand_arbre_racines', scene: 'GrandArbreRacinesScene', region: 'grand_arbre', name: 'Racines du grand arbre' },
  { zone: 'galeries_racines', scene: 'GaleriesRacinesScene', region: 'grand_arbre', name: 'Galeries des racines' },
  { zone: 'grand_arbre_arene', scene: 'GrandArbreAreneScene', region: 'grand_arbre', name: 'Cime du grand arbre' },
  { zone: 'cime_cachee', scene: 'CimeCacheeScene', region: 'grand_arbre', name: 'Cime cachée' },
  { zone: 'monde_spirituel', scene: 'MondeSpirituelScene', region: 'grand_arbre', name: 'Monde spirituel' },
  { zone: 'epreuve_singe', scene: 'EpreuveSingeScene', region: 'grand_arbre', name: 'Épreuve du singe' },
  { zone: 'foret_flottante_1', scene: 'ForetFlottante1Scene', region: 'foret_flottante', name: 'Forêt flottante' },
  { zone: 'ile_du_gardien', scene: 'IleDuGardienScene', region: 'foret_flottante', name: 'Île du gardien' },
  { zone: 'foret_flottante_2', scene: 'ForetFlottante2Scene', region: 'foret_flottante', name: 'Îles flottantes' },
  { zone: 'ile_des_vents', scene: 'IleDesVentsScene', region: 'foret_flottante', name: 'Île des vents' },
  { zone: 'clairiere_plante', scene: 'ClairierePlanteScene', region: 'foret_flottante', name: 'Clairière de la plante' },
  { zone: 'racines_suspendues', scene: 'RacinesSuspenduesScene', region: 'foret_flottante', name: 'Racines suspendues' },
  { zone: 'marais_brumes', scene: 'MaraisBrumesScene', region: 'foret_flottante', name: 'Marais des brumes' },
  { zone: 'hutte_morgat', scene: 'HutteMorgatScene', region: 'foret_flottante', name: 'Hutte de Morgat' },
  { zone: 'foret_corrompue_1', scene: 'ForetCorrompue1Scene', region: 'foret_corrompue', name: 'Forêt corrompue' },
  { zone: 'nid_cocons', scene: 'NidCoconsScene', region: 'foret_corrompue', name: 'Nid des cocons' },
  { zone: 'canopee_malade', scene: 'CanopeeMaladeScene', region: 'foret_corrompue', name: 'Canopée malade' },
  { zone: 'arene_ghilt', scene: 'AreneGhiltScene', region: 'foret_corrompue', name: "Antre de Ghil't" },
  { zone: 'trou_sombre', scene: 'TrouSombreScene', region: 'foret_corrompue', name: 'Trou sombre' },
  { zone: 'bosquet_retour', scene: 'BosquetRetourScene', region: 'bosquet', name: 'Retour au bosquet' },
];

// Anciennes zones de développement, accessibles depuis « Zones de test ».
const LEGACY_TEST_ZONES = [
  { scene: 'Zone1Scene', name: 'Zone 1 — intro' },
  { scene: 'Zone3Scene', name: 'Zone 3 — toiles' },
  { scene: 'Zone2Scene', name: 'Zone 2 — ravin' },
  { scene: 'SousGrotteScene', name: 'Sous-grotte' },
  { scene: 'Zone4Scene', name: 'Zone 4' },
  { scene: 'ZoneAquatiqueScene', name: 'Zone aquatique' },
  { scene: 'Zone5Scene', name: 'Zone 5 — Loup Alpha' },
  { scene: 'ZonetestScene', name: 'Zone test' },
];

// `sceneOrKey` : scène Phaser, clé de scène ('BosquetScene') ou id de zone ('bosquet').
function storyZoneEntry(sceneOrKey) {
  if (!sceneOrKey) return null;
  const key = typeof sceneOrKey === 'string' ? sceneOrKey : sceneOrKey.scene && sceneOrKey.scene.key;
  return DEMO_ZONES.find((z) => z.scene === key || z.zone === key) || null;
}

function isStoryScene(scene) {
  return !!storyZoneEntry(scene);
}

// Identifiant utilisé dans les flags (`trig_<zone>_<id>`, `moss_<zone>_<i>`...).
function storyZoneId(scene) {
  if (scene.__storyZoneId) return scene.__storyZoneId;
  const entry = storyZoneEntry(scene);
  return entry ? entry.zone : scene.scene.key;
}

// Règle Xara (cf. PLAN_DEV.md) : dans les zones de l'histoire, Xara n'est là
// qu'une fois rencontrée (`xaraMet`) ; les anciennes zones de test (et le
// playtest de l'éditeur) la gardent toujours. `data.xara === false` la retire partout.
function shouldSpawnXara(scene, data) {
  if (data && data.xara === false) return false;
  if (!isStoryScene(scene)) return true;
  return !!storyGet('xaraMet');
}

// ---------------------------------------------------------------------------
// État persistant + sauvegarde localStorage
// ---------------------------------------------------------------------------
const SAVE_STORAGE_KEY = 'agarica-save-v1';
// Clés historiques du joueur (documentation : TOUTE valeur JSON du registre
// est sauvegardée, ces clés-là comprises, ainsi que les flags d'histoire et
// l'inventaire `inventory`).
const SAVE_PLAYER_KEYS = [
  'hasWolfForm', 'hasEagleForm', 'hasOctopusForm', 'hasMonkeyForm', 'equippedForms', 'airForm',
  'hearts', 'energy', 'unlockedSkills', 'skillSlots', 'equippedTotem',
];

// Sauvegardes d'avant la décision « le papillon n'est qu'une compétence » :
// la forme aérienne papillon (retirée, cf. AIR_FORM_IDS dans Player.js) a pu
// y être équipée (`airForm`, 2e case d'`equippedForms`). Migrée au
// chargement vers la forme aérienne débloquée restante (aigle d'abord, puis
// singe), sinon aucune -- même règle que Player.resolveInitialAirForm, qui
// rattrape aussi un registre posé autrement (?flags=, tests). Le reste de la
// sauvegarde (flag `hasButterflyForm` compris, désormais ignoré) est gardé.
const SAVE_OBSOLETE_AIR_FORMS = ['butterfly'];

function migrateSaveValues(values) {
  if (!values || typeof values !== 'object') return values;
  migrateSaveMap(values);
  const forms = Array.isArray(values.equippedForms) ? values.equippedForms : null;
  const obsoleteAir = SAVE_OBSOLETE_AIR_FORMS.includes(values.airForm);
  const obsoleteSlot = !!forms && forms.some((f) => SAVE_OBSOLETE_AIR_FORMS.includes(f));
  if (!obsoleteAir && !obsoleteSlot) return values;
  const air = values.hasEagleForm ? 'eagle' : values.hasMonkeyForm ? 'monkey' : null;
  if (obsoleteAir || values.airForm === undefined) values.airForm = air;
  if (forms) {
    values.equippedForms = forms.map((f) => (SAVE_OBSOLETE_AIR_FORMS.includes(f) ? (values.airForm || null) : f));
  }
  return values;
}

// Sauvegardes d'avant la carte du monde (2026-11-08) : aucune clé `mapExplored`.
// Une zone déjà visitée a été traversée : elle est reportée en entier sur la
// carte (STORY_MAP_ALL) plutôt que de repartir d'une carte vide. Les nouvelles
// sauvegardes ont toujours `mapExplored` (posée dès la 1re image en zone).
function migrateSaveMap(values) {
  if (values.mapExplored !== undefined) return;
  const explored = {};
  for (const z of DEMO_ZONES) if (values[`visited_${z.zone}`]) explored[z.zone] = STORY_MAP_ALL;
  values.mapExplored = explored;
}

function storyRegistry(scene) {
  if (scene && scene.registry) return scene.registry;
  return window.__game ? window.__game.registry : null;
}

function storyGet(key, def) {
  const reg = storyRegistry();
  if (!reg) return def;
  const v = reg.get(key);
  return v === undefined ? def : v;
}

// `storySet('flag', true)` ou `storySet({ a: 1, b: true })`. Sauvegarde aussitôt.
function storySet(key, value) {
  const reg = storyRegistry();
  if (!reg) return;
  if (key && typeof key === 'object') {
    for (const [k, v] of Object.entries(key)) reg.set(k, v);
  } else {
    reg.set(key, value);
  }
  writeSaveData(reg);
}

function isSaveableValue(v) {
  if (v === null) return true;
  const t = typeof v;
  if (t === 'boolean' || t === 'string') return true;
  if (t === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(isSaveableValue);
  if (t === 'object' && Object.getPrototypeOf(v) === Object.prototype) return Object.values(v).every(isSaveableValue);
  return false;
}

function saveableRegistryEntries(reg) {
  return Object.entries(reg.getAll()).filter(([k, v]) => !k.startsWith('__') && isSaveableValue(v));
}

function writeSaveData(reg) {
  try {
    const values = Object.fromEntries(saveableRegistryEntries(reg));
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), values }));
    return true;
  } catch (e) {
    console.warn('Sauvegarde impossible :', e);
    return false;
  }
}

function readSaveData() {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.values) return null;
    migrateSaveValues(parsed.values);
    return parsed;
  } catch (e) {
    return null;
  }
}

function saveGame(scene, { silent = false } = {}) {
  const ok = writeSaveData(storyRegistry(scene));
  if (ok && !silent && scene && scene.add) showSaveIndicator(scene);
  return ok;
}

// Remplace l'état du registre par la sauvegarde. Vrai si une sauvegarde existait.
function loadGame(game) {
  const save = readSaveData();
  if (!save) return false;
  const reg = (game && game.registry) || storyRegistry();
  for (const [k] of saveableRegistryEntries(reg)) reg.remove(k);
  for (const [k, v] of Object.entries(save.values)) reg.set(k, v);
  // Une sauvegarde prise pile au moment d'un K.O. ne doit pas relancer à 0 cœur.
  if (typeof reg.get('hearts') === 'number' && reg.get('hearts') <= 0) reg.remove('hearts');
  return true;
}

function hasSaveGame() {
  const save = readSaveData();
  return !!(save && save.values && save.values.lastZone);
}

// Nouvelle partie : efface la sauvegarde ET les données de jeu du registre
// (les valeurs non sérialisables, internes à d'autres systèmes, sont gardées).
function resetGame(game) {
  try { localStorage.removeItem(SAVE_STORAGE_KEY); } catch (e) { /* stockage indisponible */ }
  const reg = (game && game.registry) || storyRegistry();
  if (!reg) return;
  for (const [k] of saveableRegistryEntries(reg)) reg.remove(k);
}

// Appelé par buildLevelFromData : flags de visite + sauvegarde auto.
function storyOnZoneEnter(scene, data, sceneData) {
  const entry = storyZoneEntry(scene);
  if (!entry) return;
  const reg = storyRegistry(scene);
  reg.set(`visited_${entry.zone}`, true);
  reg.set('lastZone', entry.zone);
  reg.set('lastEnterId', (sceneData && sceneData.enterId) || null);
  // Marque une sauvegarde « avec carte du monde » (cf. migrateSaveMap) : sans
  // elle, une partie neuve quittée avant son 1er pas serait prise pour une
  // ancienne sauvegarde et sa zone reportée en entier sur la carte.
  if (reg.get('mapExplored') === undefined) reg.set('mapExplored', {});
  saveGame(scene, { silent: true });
}

// ---------------------------------------------------------------------------
// Inventaire (objets-clés de l'histoire)
// ---------------------------------------------------------------------------
const ITEM_INFO = {
  talisman_ours: { name: "Talisman de l'ours", desc: "Le talisman des chefs du bosquet. Ton père te l'a confié." },
  idole: { name: 'Idole du bosquet', desc: "L'idole sacrée du bosquet. Elle n'aurait jamais dû quitter son autel." },
  talisman_singe: { name: 'Talisman du singe', desc: "Gagné à l'épreuve du singe. Donne le lancer de pierre." },
  carte_geralt: { name: 'Carte de Geralt', desc: 'Pleine de flèches qui se contredisent et de traces de pinces. [M] pour l\'ouvrir.' },
  totem_poche_casse: { name: 'Totem de poche cassé', desc: 'Un petit totem fendu, trouvé sur une île flottante. Il est froid.' },
  totem_poche_actif: { name: 'Totem de poche', desc: "Ravivé par l'antidote. Donne la compétence du papillon : soigner." },
  fleur_resistante: { name: 'Fleur résistante', desc: 'La mousse ne pousse pas autour d\'elle. Une guérisseuse saurait quoi en faire.' },
  repulsif: { name: 'Répulsif à mousse', desc: 'De Morgat. Quelques gouttes font fondre un mur de mousse ([E] devant le mur).' },
  bocal_antidote: { name: "Bocal d'antidote", desc: 'Apporté par les papillons de Morgat. Il brille un peu.' },
  note_geralt: { name: 'Note de Geralt', desc: "« Si tu lis ceci, c'est que je suis passé par là. Ou que je l'ai perdue. Clak, rends-moi ce crayon. »" },
};

function itemInfo(id) {
  return ITEM_INFO[id] || CONSUMABLE_INFO[id] || { name: id, desc: '' };
}

function inventoryList() {
  return [...storyGet('inventory', [])];
}

function inventoryHas(id) {
  return inventoryList().includes(id);
}

// Vrai si l'objet vient d'être ajouté (faux s'il était déjà là).
function inventoryAdd(scene, id, { silent = false } = {}) {
  const list = inventoryList();
  if (list.includes(id)) return false;
  list.push(id);
  storySet('inventory', list);
  if (!silent && scene && scene.add) {
    const info = itemInfo(id);
    showStoryBanner(scene, { kicker: 'Objet obtenu', title: info.name, desc: info.desc, itemId: id });
  }
  return true;
}

function inventoryRemove(id) {
  const list = inventoryList();
  const i = list.indexOf(id);
  if (i === -1) return false;
  list.splice(i, 1);
  storySet('inventory', list);
  return true;
}

// ---------------------------------------------------------------------------
// Consommables (2026-11-08) : objets à usage unique, comptés (registre
// `consumables` = { id: nombre }), à part des objets-clés. Aucune source en jeu
// pour l'instant : la structure et l'usage (sac, touche I ou menu du feu) sont
// prêts ; une source future appelle `consumableAdd(scene, 'baie_soin')`.
// `effect` : 'heart' (+1 cœur, plafonné) ou 'energy' (énergie pleine).
// ---------------------------------------------------------------------------
const CONSUMABLE_INFO = {
  baie_soin: { name: 'Baie de soin', desc: 'Rouge et sucrée. Rend un cœur.', effect: 'heart' },
  seve_energie: { name: "Sève d'énergie", desc: "De la sève qui brille. Remplit l'énergie.", effect: 'energy' },
};
const CONSUMABLE_IDS = Object.keys(CONSUMABLE_INFO);

function consumableCounts() {
  const v = storyGet('consumables');
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

function consumableCount(id) {
  const n = consumableCounts()[id];
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

// Ajoute `n` exemplaires (popup « Objet obtenu » sauf `silent`). Renvoie le nouveau total.
function consumableAdd(scene, id, n = 1, { silent = false } = {}) {
  if (!CONSUMABLE_INFO[id] || !(n > 0)) return consumableCount(id);
  const counts = { ...consumableCounts(), [id]: consumableCount(id) + n };
  storySet('consumables', counts);
  if (!silent && scene && scene.add) {
    const info = CONSUMABLE_INFO[id];
    showStoryBanner(scene, { kicker: n > 1 ? `Objet obtenu (×${n})` : 'Objet obtenu', title: info.name, desc: info.desc, itemId: id });
  }
  return counts[id];
}

// Utilise un consommable sur Agarica (`scene` : la zone, avec `scene.player`).
// Renvoie { ok, text } : `text` dit ce qui s'est passé (ou pourquoi rien).
// Un consommable sans effet utile (cœurs déjà pleins…) n'est pas consommé.
function consumableUse(scene, id) {
  const info = CONSUMABLE_INFO[id];
  const p = scene && scene.player;
  if (!info) return { ok: false, text: '' };
  if (consumableCount(id) <= 0) return { ok: false, text: 'Tu n\'en as plus.' };
  if (!p || !p.active) return { ok: false, text: 'Impossible ici.' };
  if (info.effect === 'heart') {
    if (p.hearts >= p.maxHearts) return { ok: false, text: 'Tes cœurs sont déjà pleins.' };
    p.hearts = Math.min(p.maxHearts, p.hearts + 1);
    scene.registry.set('hearts', p.hearts);
  } else if (info.effect === 'energy') {
    if (p.energy >= p.maxEnergy) return { ok: false, text: 'Ton énergie est déjà pleine.' };
    p.energy = p.maxEnergy;
    scene.registry.set('energy', p.energy);
  }
  storySet('consumables', { ...consumableCounts(), [id]: consumableCount(id) - 1 });
  if (typeof spawnFx === 'function') spawnFx(scene, 'heal', p.x, p.y - 40, { count: 10 });
  return { ok: true, text: info.effect === 'heart' ? 'Un cœur retrouvé.' : 'Énergie pleine.' };
}

// ---------------------------------------------------------------------------
// Quêtes secondaires (vague 3, 2026-11-08) : légères et pilotées par les
// données. Registre global rempli par les fichiers d'histoire :
//   QUESTS[id] = { title, giver?, desc?, steps: [{ id, text }], reward?: contenu,
//                  hidden?: bool (pas dans le sac tant qu'elle n'est pas finie) }
// `reward` : même format que le contenu d'un coffre (cf. secretGrantContents,
// SecretKit.js : { eclats }, { item }, { coeur }, { consommable, n }…).
// État sauvegardé : registre `quests` = { id: { step: 'idÉtape', done: bool } }
// (une quête absente = pas commencée ; vieilles sauvegardes : aucune).
// Pilotage : étapes de cinématique {questStart}, {questStep}, {questComplete}
// et conditions `quest` / `questDone` / `questNone` / `questStep` (cf.
// storyConditionPart) pour les variantes de `talk` des PNJ.
// ---------------------------------------------------------------------------
const QUESTS = {};

function questStates() {
  const v = storyGet('quests');
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

// 'none' (pas commencée), 'active' ou 'done'.
function questStatus(id) {
  const s = questStates()[id];
  if (!s) return 'none';
  return s.done ? 'done' : 'active';
}

function questCurrentStep(id) {
  const s = questStates()[id];
  return s && !s.done ? (s.step || null) : null;
}

function questStepDef(id, stepId) {
  const q = QUESTS[id];
  return q && Array.isArray(q.steps) ? q.steps.find((st) => st.id === stepId) || null : null;
}

function questWrite(id, state) {
  storySet('quests', { ...questStates(), [id]: state });
}

// Commence la quête (1re étape). Faux si inconnue ou déjà commencée.
function questStart(scene, id, { silent = false } = {}) {
  const q = QUESTS[id];
  if (!q) {
    console.warn(`questStart : quête "${id}" introuvable dans QUESTS.`);
    return false;
  }
  if (questStatus(id) !== 'none') return false;
  const first = (q.steps && q.steps[0]) || null;
  questWrite(id, { step: first ? first.id : null, done: false });
  if (!silent && scene && scene.add) {
    showStoryBanner(scene, { kicker: 'Nouvelle quête', title: q.title || id, desc: first ? first.text : (q.desc || ''), color: STORY_UI.vineLight });
  }
  return true;
}

// Passe à l'étape `stepId` (null : la suivante). Commence la quête si besoin.
// Faux si rien n'a changé (quête finie, étape inconnue, déjà à cette étape).
function questSetStep(scene, id, stepId = null, { silent = false } = {}) {
  const q = QUESTS[id];
  if (!q || questStatus(id) === 'done') return false;
  if (questStatus(id) === 'none') questStart(scene, id, { silent: true });
  const steps = q.steps || [];
  const cur = questCurrentStep(id);
  let next = stepId;
  if (next == null) {
    const i = steps.findIndex((st) => st.id === cur);
    next = i >= 0 && i + 1 < steps.length ? steps[i + 1].id : null;
  }
  if (!next || next === cur || !questStepDef(id, next)) return false;
  questWrite(id, { step: next, done: false });
  if (!silent && scene && scene.add) showToast(scene, `Quête mise à jour : ${questStepDef(id, next).text}`, 2800);
  return true;
}

// Termine la quête et verse sa récompense (une seule fois).
function questComplete(scene, id, { silent = false } = {}) {
  const q = QUESTS[id];
  if (!q || questStatus(id) === 'done') return false;
  questWrite(id, { step: questCurrentStep(id), done: true });
  if (!silent && scene && scene.add) {
    const what = typeof secretContentsLabel === 'function' ? secretContentsLabel(q.reward) : '';
    showStoryBanner(scene, { kicker: 'Quête terminée', title: q.title || id, desc: what ? `Récompense : ${what}` : '', color: STORY_UI.vineLight });
  }
  if (q.reward && typeof secretGrantContents === 'function') secretGrantContents(scene, q.reward, { source: `quest:${id}`, silent: true });
  return true;
}

// Quêtes à montrer dans le sac : en cours d'abord, puis terminées.
function questJournal() {
  const st = questStates();
  const out = [];
  for (const [id, s] of Object.entries(st)) {
    const q = QUESTS[id];
    if (!q) continue;
    if (q.hidden && !s.done) continue;
    out.push({ id, quest: q, done: !!s.done, step: s.step || null });
  }
  return out.sort((a, b) => Number(a.done) - Number(b.done));
}

// ---------------------------------------------------------------------------
// Carte du monde : découvertes (2026-11-08, points 3 et 4 de la liste)
// ---------------------------------------------------------------------------
// Pendant le jeu, chaque bloc de STORY_MAP_CHUNK px autour d'Agarica (un
// rectangle de ±STORY_MAP_REVEAL_X/Y, à peu près l'écran) est noté « en
// attente » (`mapPending`). S'asseoir à un feu de camp les reporte sur la carte
// sauvegardée (`mapExplored`, storyMapCommit) : la touche M montre cette
// version-là. Format des deux clés : { zone: ['cx,cy', …] | STORY_MAP_ALL }.
// Zones de test : jamais notées (hors carte).
// La carte reste liée à l'objet de l'histoire STORY_MAP_ITEM (la carte de
// Geralt) : sans lui, M ne l'ouvre pas, mais les découvertes s'enregistrent
// quand même. `null` : carte toujours disponible.
const STORY_MAP_ITEM = 'carte_geralt';
const STORY_MAP_CHUNK = 128;
const STORY_MAP_REVEAL_X = 448;
const STORY_MAP_REVEAL_Y = 320;
// Zone reportée en entier (ancienne sauvegarde, cf. migrateSaveMap).
const STORY_MAP_ALL = '*';

function storyMapAvailable() {
  return !STORY_MAP_ITEM || inventoryHas(STORY_MAP_ITEM);
}

function storyMapStore(key) {
  const v = storyGet(key);
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

// Blocs connus d'une zone dans `mapExplored` (ou `mapPending`) : Set de
// 'cx,cy', STORY_MAP_ALL, ou null si la zone n'y est pas.
function storyMapZoneChunks(zone, key = 'mapExplored') {
  const v = storyMapStore(key)[zone];
  if (v === STORY_MAP_ALL) return STORY_MAP_ALL;
  return Array.isArray(v) && v.length ? new Set(v) : null;
}

// Nombre de blocs découverts depuis le dernier feu de camp.
function storyMapPendingCount() {
  let n = 0;
  for (const v of Object.values(storyMapStore('mapPending'))) n += v === STORY_MAP_ALL ? 1 : (Array.isArray(v) ? v.length : 0);
  return n;
}

// Chaque image (monde non gelé, cf. storyUpdateHook) : rien à faire tant
// qu'Agarica reste dans le même bloc ; sinon les blocs neufs autour d'elle
// passent en attente.
function storyMapRecord(scene) {
  const entry = storyZoneEntry(scene);
  const p = scene.player;
  if (!entry || !p || !p.body || p.fallingOut) return;
  const reg = storyRegistry(scene);
  let st = scene.__mapRec;
  if (!st || st.visit !== scene.__storyVisit) {
    if (reg.get('mapExplored') === undefined) reg.set('mapExplored', {});
    const saved = storyMapZoneChunks(entry.zone);
    const pending = storyMapZoneChunks(entry.zone, 'mapPending');
    st = scene.__mapRec = {
      visit: scene.__storyVisit, zone: entry.zone, last: null,
      all: saved === STORY_MAP_ALL || pending === STORY_MAP_ALL,
      known: new Set([...(saved instanceof Set ? saved : []), ...(pending instanceof Set ? pending : [])]),
    };
  }
  if (st.all) return;
  const C = STORY_MAP_CHUNK;
  // Centre du corps (les pieds sont au bas d'un bloc la moitié du temps).
  const py = p.y - 40;
  const here = `${Math.floor(p.x / C)},${Math.floor(py / C)}`;
  if (st.last === here) return;
  st.last = here;
  const maxCx = Math.max(0, Math.ceil((scene.levelWidth || 960) / C) - 1);
  const fresh = [];
  const x0 = Math.max(0, Math.floor((p.x - STORY_MAP_REVEAL_X) / C));
  const x1 = Math.min(maxCx, Math.floor((p.x + STORY_MAP_REVEAL_X) / C));
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = Math.floor((py - STORY_MAP_REVEAL_Y) / C); cy <= Math.floor((py + STORY_MAP_REVEAL_Y) / C); cy++) {
      const k = `${cx},${cy}`;
      if (st.known.has(k)) continue;
      st.known.add(k);
      fresh.push(k);
    }
  }
  if (!fresh.length) return;
  const pending = { ...storyMapStore('mapPending') };
  const prev = Array.isArray(pending[entry.zone]) ? pending[entry.zone] : [];
  pending[entry.zone] = prev.concat(fresh);
  reg.set('mapPending', pending);
}

// Feu de camp : les découvertes en attente rejoignent la carte sauvegardée.
// Renvoie le nombre de blocs ajoutés.
function storyMapCommit() {
  const reg = storyRegistry();
  if (!reg) return 0;
  const pending = storyMapStore('mapPending');
  const saved = { ...storyMapStore('mapExplored') };
  let added = 0;
  for (const [zone, list] of Object.entries(pending)) {
    if (saved[zone] === STORY_MAP_ALL) continue;
    if (list === STORY_MAP_ALL) {
      saved[zone] = STORY_MAP_ALL;
      added += 1;
      continue;
    }
    const set = new Set(Array.isArray(saved[zone]) ? saved[zone] : []);
    const before = set.size;
    for (const k of Array.isArray(list) ? list : []) set.add(k);
    added += set.size - before;
    saved[zone] = [...set];
  }
  reg.set('mapExplored', saved);
  reg.set('mapPending', {});
  return added;
}

// ---------------------------------------------------------------------------
// Feux de camp : identifiants, repos, vol de l'aigle (2026-11-08)
// ---------------------------------------------------------------------------
// Identifiant d'un feu = zone + indice dans le tableau `campfires` de sa
// donnée : 'foret_sombre_1#0'. Registre : `campfiresVisited` (feux où Agarica
// s'est assise, destinations du vol), `lastCampfire`. S'asseoir pose aussi
// `lastEnterId = 'feu:<id>'` : « Continuer » reprend assise à ce feu
// (buildLevelFromData lit ce point d'entrée, cf. campfireIndexFromEnterId).
const CAMPFIRE_ENTER_PREFIX = 'feu:';

function campfireIdFor(scene, index) {
  return `${storyZoneId(scene)}#${index}`;
}

function campfireParseId(id) {
  const s = String(id || '');
  const i = s.lastIndexOf('#');
  if (i <= 0) return null;
  const index = Number(s.slice(i + 1));
  return Number.isInteger(index) && index >= 0 ? { zone: s.slice(0, i), index } : null;
}

function campfireEnterId(id) {
  return CAMPFIRE_ENTER_PREFIX + id;
}

// Indice du feu visé par un point d'entrée 'feu:<zone>#<i>' dans CETTE zone, sinon null.
function campfireIndexFromEnterId(scene, enterId) {
  if (typeof enterId !== 'string' || !enterId.startsWith(CAMPFIRE_ENTER_PREFIX)) return null;
  const f = campfireParseId(enterId.slice(CAMPFIRE_ENTER_PREFIX.length));
  return f && f.zone === storyZoneId(scene) ? f.index : null;
}

function campfiresVisited() {
  const v = storyGet('campfiresVisited', []);
  return Array.isArray(v) ? v : [];
}

// Agarica vient de s'asseoir au feu `fireId` (cf. campfireSit, LevelKit) :
// mémorisé, découvertes reportées sur la carte, partie sauvegardée. Zones de
// test : rien de tout ça (ni carte ni sauvegarde). Renvoie { saved, mapAdded }.
function storyCampfireRest(scene, fireId) {
  if (!isStoryScene(scene)) return { saved: false, mapAdded: 0 };
  const reg = storyRegistry(scene);
  const list = campfiresVisited();
  if (!list.includes(fireId)) reg.set('campfiresVisited', [...list, fireId]);
  reg.set('lastCampfire', fireId);
  reg.set('lastEnterId', campfireEnterId(fireId));
  const mapAdded = storyMapCommit();
  const saved = saveGame(scene);
  return { saved, mapAdded };
}

// Règles d'histoire du vol (décidées d'après les scripts de src/story/) : chaque
// règle renvoie la raison du refus, montrée telle quelle, ou null.
// `ctx` : { scene, from: {zone, index, region}, to: {zone, index, region} | null }.
// Règles de départ : `to` vaut null ; règles d'arrivée : testées par destination.
const CAMPFIRE_FLIGHT_RULES = [
  // Départ : seulement d'une zone de l'histoire.
  { at: 'from', why: (c) => (!c.from.region ? 'Pas de vol depuis une zone de test.' : null) },
  // Zone fermée par un combat ou une épreuve (toutes ses sorties retirées par
  // son script : arène de Ghil't pendant le combat, trou sombre…).
  { at: 'from', why: (c) => (campfireZoneSealed(c.scene) ? 'Le passage est fermé : impossible de t\'envoler maintenant.' : null) },
  // Défaite imposée face à Ghil't puis trou sombre : la suite se joue à pied.
  { at: 'from', why: () => (storyGet('ghiltPhase', 1) >= 2 && !storyGet('ghiltHealed') ? 'Ghil\'t t\'attend. Pas question de fuir maintenant.' : null) },
  // Forêt corrompue (après le crash, la mousse se referme derrière elle) : les
  // vents de la corruption ont déjà jeté l'aigle au sol ; plus de vol, ni pour
  // en partir ni pour y revenir, tant que Ghil't n'est pas soigné.
  { at: 'from', why: (c) => (c.from.region === 'foret_corrompue' && !storyGet('ghiltHealed') ? 'Trop de vent ici : impossible de t\'envoler.' : null) },
  { at: 'to', why: (c) => (c.to.region === 'foret_corrompue' && !storyGet('ghiltHealed') ? 'Trop de vent là-bas : impossible d\'y aller.' : null) },
  // Cime du grand arbre : Kainati la garde tant qu'il n'est pas apaisé.
  { at: 'to', why: (c) => (c.to.zone === 'grand_arbre_arene' && !storyGet('kainatiDefeated') ? 'Kainati garde encore la cime du grand arbre.' : null) },
];

// La donnée de la zone a des sorties (`scene.__dataExitCount`, cf.
// buildLevelFromData) mais le script les a toutes retirées pour l'instant.
function campfireZoneSealed(scene) {
  if (!scene || !(scene.__dataExitCount > 0)) return false;
  return !(scene.__exits || []).some((e) => e && e.targetScene);
}

function campfireFlightPlace(scene, id) {
  const f = campfireParseId(id);
  if (!f) return null;
  const entry = storyZoneEntry(f.zone);
  return { ...f, id, region: entry ? entry.region : null, entry };
}

// Raison qui interdit tout vol depuis ce feu (null : on peut s'envoler).
function campfireFlightDepartureBlock(scene, fromId) {
  const from = campfireFlightPlace(scene, fromId) || { zone: null, index: null, region: null };
  if (!from.region || !isStoryScene(scene)) from.region = null;
  for (const r of CAMPFIRE_FLIGHT_RULES) {
    if (r.at !== 'from') continue;
    const why = r.why({ scene, from, to: null });
    if (why) return why;
  }
  return null;
}

// Destinations du vol depuis `fromId` : les feux où Agarica s'est assise (sauf
// celui-ci), dans l'ordre de l'histoire, chacun avec `blocked` (raison) ou null.
function campfireFlightDestinations(scene, fromId) {
  const from = campfireFlightPlace(scene, fromId) || { zone: null, index: null, region: null };
  const order = (z) => {
    const i = DEMO_ZONES.findIndex((e) => e.zone === z);
    return i === -1 ? DEMO_ZONES.length : i;
  };
  const places = campfiresVisited().filter((id) => id !== fromId).map((id) => campfireFlightPlace(scene, id))
    .filter((t) => t && t.entry)
    .sort((a, b) => order(a.zone) - order(b.zone) || a.index - b.index);
  const perZone = {};
  for (const t of places) perZone[t.zone] = (perZone[t.zone] || 0) + 1;
  return places.map((to) => {
    let blocked = null;
    for (const r of CAMPFIRE_FLIGHT_RULES) {
      if (r.at !== 'to') continue;
      blocked = r.why({ scene, from, to });
      if (blocked) break;
    }
    const label = perZone[to.zone] > 1 || to.index > 0 ? `${to.entry.name} — feu ${to.index + 1}` : to.entry.name;
    return { id: to.id, zone: to.zone, index: to.index, scene: to.entry.scene, label, blocked };
  });
}

// ---------------------------------------------------------------------------
// Compétences et formes débloquées par l'histoire
// ---------------------------------------------------------------------------
const SKILL_STORY_INFO = {
  ours: { name: 'Ours — Fracas au sol', desc: 'Brise les amas de mousse et frappe autour de toi.' },
  pierre: { name: 'Singe — Lancer de pierre', desc: 'Lance une pierre en cloche.' },
  papillon: { name: 'Papillon — Soin', desc: 'Guérit les créatures corrompues au lieu de les détruire.' },
  crapaud: { name: 'Crapaud', desc: '' },
};
const SKILL_KEY_LABELS = ['A', 'F', 'R'];
// Icône (ITEM_MANIFEST) de chaque compétence quand le nom diffère.
const STORY_SKILL_ICON = { pierre: 'skill_icone_singe' };

// Même logique que la triche Ctrl+Shift+D (setupDebugToggle) : ajout à
// `unlockedSkills` et équipement dans le 1er emplacement libre — seulement
// si la compétence existe dans SKILL_DEFS (sinon tryActivateSkill planterait).
function unlockSkillFromStory(scene, skillId, { silent = false } = {}) {
  const player = scene && scene.player;
  const unlocked = new Set(player ? player.unlockedSkills : storyGet('unlockedSkills', []));
  const slots = player ? player.skillSlots : [...storyGet('skillSlots', [null, null, null])];
  const already = unlocked.has(skillId);
  unlocked.add(skillId);
  let slotIndex = slots.indexOf(skillId);
  const defined = typeof SKILL_DEFS !== 'undefined' && !!SKILL_DEFS[skillId];
  if (slotIndex === -1 && defined) {
    slotIndex = slots.indexOf(null);
    if (slotIndex !== -1) slots[slotIndex] = skillId;
  }
  if (player) player.unlockedSkills = unlocked;
  storySet({ unlockedSkills: [...unlocked], skillSlots: slots });
  if (!silent && !already && scene && scene.add) {
    const info = SKILL_STORY_INFO[skillId] || { name: (defined && SKILL_DEFS[skillId].label) || skillId, desc: '' };
    const keyHint = slotIndex !== -1 ? `Équipée sur la touche ${SKILL_KEY_LABELS[slotIndex]}.` : 'À équiper au feu de camp.';
    showStoryBanner(scene, {
      kicker: 'Compétence débloquée', title: info.name, desc: `${info.desc} ${keyHint}`.trim(),
      itemId: STORY_SKILL_ICON[skillId] || `skill_icone_${skillId}`, color: 0x8fe3b8,
    });
  }
  // (Le papillon ne débloque plus de forme aérienne : décision utilisateur,
  // « le papillon ne doit être qu'une compétence, pas remplacer le double
  // saut », cf. AIR_FORM_IDS dans Player.js.)
  return !already;
}

const STORY_FORM_INFO = {
  // Maj tenue = loup même à l'arrêt (2026-11-09).
  hasWolfForm: { type: 'wolf', name: 'Forme du loup', desc: '[Maj] tenue : loup, même à l\'arrêt. Il court, voit les pistes cachées et mord [K].' },
  // Sans forme aérienne, Agarica n'a qu'un saut : c'est la forme qui donne le double saut.
  hasEagleForm: { type: 'eagle', name: "Forme de l'aigle", desc: '[Espace] deux fois : plus haut, puis tu planes.' },
  // Lianes : seule Agarica devenue singe s'y accroche (cf. Player.js).
  // Prise sur appui de Z/↑ depuis le 2026-11-09 (plus d'accroche automatique).
  hasMonkeyForm: { type: 'monkey', name: 'Forme du singe', desc: '[Espace] deux fois : tu deviens singe. [↑] près d\'une liane : tu t\'y accroches.' },
  hasOctopusForm: { type: 'octopus', name: 'Forme de la pieuvre', desc: 'Tu nages dans l\'eau.' },
};

// Débloque une forme comme un totem (flag + équipement + popup). Si Player
// expose `equipForm(type)` (règles d'emplacements sol/aérien), il est utilisé.
function unlockFormFromStory(scene, flag, { silent = false } = {}) {
  const info = STORY_FORM_INFO[flag] || { type: flag, name: flag, desc: '' };
  const player = scene && scene.player;
  const already = !!storyGet(flag);
  if (player) player[flag] = true;
  if (player && typeof player.equipForm === 'function') {
    player.equipForm(info.type);
    storySet({ [flag]: true, equippedForms: player.equippedForms });
  } else {
    const forms = player ? player.equippedForms : [...storyGet('equippedForms', [null, null, null])];
    if (!forms.includes(info.type)) {
      const i = forms.indexOf(null);
      if (i !== -1) forms[i] = info.type;
    }
    storySet({ [flag]: true, equippedForms: forms });
  }
  if (silent || already || !scene || !scene.add) return !already;
  if (scene.textures.exists('unlock-anim-0') && scene.textures.exists(`form-icon-${info.type}`)) {
    showFormUnlockPopup(scene, info.type);
  } else {
    const iconId = { monkey: 'singe' }[info.type] || info.type;
    showStoryBanner(scene, { kicker: 'Nouvelle forme', title: info.name, desc: info.desc, itemId: `form_icone_${iconId}`, color: 0xc77dff });
  }
  return true;
}

// ---------------------------------------------------------------------------
// Conditions `requires` / `forbids`
// ---------------------------------------------------------------------------
// `{flag: valeur, item: 'id' | ['id'…], noItem: 'id'}` : toutes les clés
// doivent être vraies. `true`/`false` comparent la valeur « vraie/fausse »
// du flag (un flag absent vaut faux), toute autre valeur est comparée strictement.
// Quêtes (vague 3) : `quest: 'id'` (en cours), `questDone: 'id'` (finie),
// `questNone: 'id'` (pas commencée), `questStep: 'id:étape'` (en cours, à
// cette étape) ; chacune accepte aussi un tableau (toutes vraies).
// Monnaie : `eclats: n` (au moins n Éclats de lune).
function storyConditionPart(key, expected) {
  if (key === 'item') return [].concat(expected).every((id) => inventoryHas(id));
  if (key === 'noItem') return [].concat(expected).every((id) => !inventoryHas(id));
  if (key === 'quest') return [].concat(expected).every((id) => questStatus(id) === 'active');
  if (key === 'questDone') return [].concat(expected).every((id) => questStatus(id) === 'done');
  if (key === 'questNone') return [].concat(expected).every((id) => questStatus(id) === 'none');
  if (key === 'questStep') {
    return [].concat(expected).every((s) => {
      const [id, step] = String(s).split(':');
      return questCurrentStep(id) === step;
    });
  }
  if (key === 'eclats' && typeof expected === 'number') return (typeof eclatsCount === 'function' ? eclatsCount() : 0) >= expected;
  const v = storyGet(key);
  if (expected === true) return !!v;
  if (expected === false) return !v;
  return v === expected;
}

function storyCondition(cond) {
  if (!cond) return true;
  if (typeof cond === 'function') return !!cond();
  return Object.entries(cond).every(([k, v]) => storyConditionPart(k, v));
}

// `requires` : toutes les clés vraies. `forbids` : interdit dès qu'UNE de ses clés est vraie.
function storyAllowed(entry) {
  if (!entry) return true;
  if (entry.requires && !storyCondition(entry.requires)) return false;
  if (entry.forbids) {
    if (typeof entry.forbids === 'function') return !entry.forbids();
    if (Object.entries(entry.forbids).some(([k, v]) => storyConditionPart(k, v))) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// UI commune : palette, panneau bois/lianes, bandeaux, toasts, carte-titre
// ---------------------------------------------------------------------------
const STORY_UI = {
  night: 0x15101f,
  nightSoft: 0x2a1f45,
  wood: 0x4a2f22,
  woodDark: 0x241510,
  vine: 0x3f7a52,
  vineLight: 0x8fe3b8,
  pink: 0xff9fc9,
  text: '#ffe9f5',
  textSoft: '#a99bd6',
  title: '#ff9fc9',
  serif: 'Georgia, "Times New Roman", serif',
};

function colorToHex(c) {
  return `#${(c >>> 0).toString(16).padStart(6, '0').slice(-6)}`;
}

// Cadre de bois sombre + fond violet nuit + liane fleurie sur le bord haut.
function drawStoryPanel(g, x, y, w, h, { alpha = 0.94, vines = true, seed = 1 } = {}) {
  g.fillStyle(0x000000, 0.35);
  g.fillRoundedRect(x + 4, y + 7, w, h, 14);
  g.fillStyle(STORY_UI.woodDark, 1);
  g.fillRoundedRect(x - 7, y - 7, w + 14, h + 14, 16);
  g.fillStyle(STORY_UI.wood, 1);
  g.fillRoundedRect(x - 4, y - 4, w + 8, h + 8, 14);
  // Veinures du bois : quelques traits clairs le long du cadre.
  g.lineStyle(1, 0x6b4a36, 0.8);
  for (let i = 0; i < 4; i++) {
    const t = (i + 0.5) / 4;
    g.lineBetween(x + w * t - 30, y + h + 2, x + w * t + 30, y + h + 2);
  }
  g.fillStyle(STORY_UI.night, alpha);
  g.fillRoundedRect(x, y, w, h, 12);
  g.lineStyle(1.5, STORY_UI.vineLight, 0.4);
  g.strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, 9);
  if (vines) drawStoryVines(g, x, y, w, h, seed);
}

function drawStoryVines(g, x, y, w, h, seed = 1) {
  const n = Math.max(8, Math.round(w / 36));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(new Phaser.Math.Vector2(x - 6 + t * (w + 12), y - 5 + Math.sin(t * Math.PI * 5 + seed) * 4));
  }
  g.lineStyle(3, STORY_UI.vine, 1);
  g.strokePoints(pts, false);
  for (let i = 1; i < n; i++) {
    const p = pts[i];
    const up = (i + seed) % 2 === 0;
    g.fillStyle(up ? STORY_UI.vine : 0x5fa86f, 1);
    g.fillEllipse(p.x + 4, p.y + (up ? -5 : 5), 11, 5);
  }
  for (let i = 2; i < n; i += 4) {
    const p = pts[i];
    g.fillStyle(STORY_UI.pink, 1);
    g.fillCircle(p.x, p.y, 3.5);
    g.fillStyle(0xffe9f5, 1);
    g.fillCircle(p.x, p.y, 1.3);
  }
  // Liane qui pend sur le côté gauche.
  const hang = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    hang.push(new Phaser.Math.Vector2(x - 4 + Math.sin(t * 4 + seed) * 3, y + t * Math.min(h * 0.7, 90)));
  }
  g.lineStyle(2.5, STORY_UI.vine, 1);
  g.strokePoints(hang, false);
  for (let i = 1; i < hang.length; i += 2) {
    g.fillStyle(0x5fa86f, 1);
    g.fillEllipse(hang[i].x + 5, hang[i].y, 9, 4);
  }
}

// Cadre Codex `item-dialogue_box` (1692x624 : lianes tressées, champignons
// cyan aux coins, planches sombres) à n'importe quelle taille SANS étirer les
// lianes (une 9-slice les déformait : bout de liane écrasé, champignon géant).
// Sur chaque axe, la 1re moitié est un morceau de l'image et la 2e son miroir
// (raccord du milieu continu) ; plus grand que l'image, un morceau retourné
// rallonge chaque moitié (raccord en miroir lui aussi). Taille proche de
// l'image (±15 %) : l'image entière, à peine étirée. Mesures en px source.
const STORY_VINE_FRAME = {
  key: 'item-dialogue_box', w: 1692, h: 624,
  outer: { l: 36, t: 48, r: 32, b: 40 }, // marge transparente (feuilles qui débordent)
  inner: { l: 92, t: 100, r: 88, b: 88 }, // début des planches depuis chaque bord
  maxHalf: { x: 1500, y: 500 }, // au-delà : décor du coin opposé
  corner: { x: 320, y: 170 }, // coin (champignon + feuilles), jamais répété
  fitTolerance: 0.15,
};

function storyVineFrameAxis(target, scale, size, oStart, oEnd, maxHalf, corner) {
  const natural = size - oStart - oEnd;
  const want = target / scale;
  if (Math.abs(want - natural) <= natural * STORY_VINE_FRAME.fitTolerance) {
    return { k: target / natural, segs: [{ a: 0, b: size, flip: false }], start: oStart, mirrored: false };
  }
  const half = Math.round(want / 2 + oStart);
  let segs = [{ a: 0, b: Math.min(half, maxHalf), flip: false }];
  if (half > maxHalf) {
    const r = Math.min(half - maxHalf, maxHalf - corner);
    segs.push({ a: maxHalf - r, b: maxHalf, flip: true });
  }
  segs = segs.concat(segs.slice().reverse().map((s) => ({ ...s, flip: !s.flip })));
  const length = segs.reduce((sum, s) => sum + s.b - s.a, 0);
  return { k: target / (length - 2 * oStart), segs, start: oStart, mirrored: true };
}

// (x, y, w, h) = bords EXTÉRIEURS des lianes (feuilles et champignons
// débordent d'environ 50 px source × échelle). Les morceaux sont ajoutés à
// `container` (ou à un nouveau). Renvoie { container, inner } — inner = les
// planches (zone de texte) en coordonnées écran — ou null sans l'art.
function addStoryVineFrame(scene, x, y, w, h, { scale = 0.3, container = null } = {}) {
  const F = STORY_VINE_FRAME;
  if (!scene.textures.exists(F.key)) return null;
  const tex = scene.textures.get(F.key);
  const ax = storyVineFrameAxis(w, scale, F.w, F.outer.l, F.outer.r, F.maxHalf.x, F.corner.x);
  const ay = storyVineFrameAxis(h, scale, F.h, F.outer.t, F.outer.b, F.maxHalf.y, F.corner.y);
  // Bords des morceaux arrondis au pixel : morceaux jointifs, sans liseré.
  const edges = (axis, origin) => {
    let cum = 0;
    return [Math.round(origin), ...axis.segs.map((s) => Math.round(origin + (cum += s.b - s.a) * axis.k))];
  };
  const xs = edges(ax, x - ax.start * ax.k);
  const ys = edges(ay, y - ay.start * ay.k);
  const c = container || scene.add.container(0, 0);
  ay.segs.forEach((sy, j) => ax.segs.forEach((sx, i) => {
    const name = `vine_${sx.a}_${sx.b}_${sy.a}_${sy.b}`;
    if (!tex.has(name)) tex.add(name, 0, sx.a, sy.a, sx.b - sx.a, sy.b - sy.a);
    c.add(scene.add.image(xs[i], ys[j], F.key, name).setOrigin(0, 0)
      .setDisplaySize(xs[i + 1] - xs[i], ys[j + 1] - ys[j]).setFlip(sx.flip, sy.flip));
  }));
  const insetL = (F.inner.l - F.outer.l) * ax.k;
  const insetR = (ax.mirrored ? F.inner.l - F.outer.l : F.inner.r - F.outer.r) * ax.k;
  const insetT = (F.inner.t - F.outer.t) * ay.k;
  const insetB = (ay.mirrored ? F.inner.t - F.outer.t : F.inner.b - F.outer.b) * ay.k;
  const inner = { x: x + insetL, y: y + insetT, w: w - insetL - insetR, h: h - insetT - insetB };
  return { container: c, inner };
}

// Panneau d'interface Codex découpé (lot n°8 : bulle, invite, bannière,
// touche, cadres des barres), contrat PLAN_INTEGRATION_LOT_8 §3.3 :
//   addUiSliced(scene, id, x, y, w, h, { scale, depth, container, scrollFactor }) → Container | null
// Bordures `nineSlice` {left, right, top, bottom} lues dans le manifeste, en
// px SOURCE. Coins et bouts à l'échelle `scale` (défaut : celle du
// manifeste), bords et centre étirés, jointures arrondies au pixel (pas de
// liseré entre deux morceaux). `top = bottom = 0` : 3 morceaux horizontaux,
// la hauteur vaut texH x scale et `h` est ignoré. Bornes minimales :
// w ≥ (left + right) x scale, h ≥ (top + bottom) x scale. Origine en haut à
// gauche ; `container` : le panneau y est ajouté ; `scrollFactor` vaut aussi
// pour les morceaux. Null si la texture manque (l'appelant garde son dessin).
// Pas de `scene.add.nineslice` : en Phaser 3.80 il ne marche qu'en WebGL, et
// main.js est en Phaser.AUTO (repli Canvas possible).
// Le panneau renvoyé porte `setUiSize(w, h)` (même règles, pour une invite
// dont le texte change) et `uiW` / `uiH` (taille affichée réelle).
function addUiSliced(scene, id, x, y, w, h, { scale, depth, container = null, scrollFactor } = {}) {
  const key = `item-${id}`;
  if (!scene || !scene.textures || !scene.textures.exists(key)) return null;
  const def = getItemManifest()[id] || {};
  const k = scale || def.scale || 1;
  const ns = def.nineSlice || {};
  const tex = scene.textures.get(key);
  const src = tex.getSourceImage();
  const tw = src.width;
  const th = src.height;
  // Bordures bornées à l'image (une valeur de manifeste trop grande ne doit
  // pas produire de morceau de taille négative).
  const L = Phaser.Math.Clamp(ns.left || 0, 0, tw);
  const R = Phaser.Math.Clamp(ns.right || 0, 0, tw - L);
  const T = Phaser.Math.Clamp(ns.top || 0, 0, th);
  const B = Phaser.Math.Clamp(ns.bottom || 0, 0, th - T);
  const three = !T && !B;
  const cols = [0, L, tw - R, tw];
  const rows = three ? [0, th] : [0, T, th - B, th];
  const c = scene.add.container(x, y);
  const pieces = [];
  for (let j = 0; j < rows.length - 1; j++) {
    for (let i = 0; i < cols.length - 1; i++) {
      const sw = cols[i + 1] - cols[i];
      const sh = rows[j + 1] - rows[j];
      if (sw <= 0 || sh <= 0) continue;
      const name = `slice_${id}_${cols[i]}_${rows[j]}_${sw}_${sh}`;
      if (!tex.has(name)) tex.add(name, 0, cols[i], rows[j], sw, sh);
      const img = scene.add.image(0, 0, key, name).setOrigin(0, 0);
      c.add(img);
      pieces.push({ img, i, j });
    }
  }
  c.__ui = { k, L, R, T, B, th, three, pieces };
  c.setUiSize = (w2, h2) => layoutUiSliced(c, w2, h2);
  layoutUiSliced(c, w, h);
  if (depth != null) c.setDepth(depth);
  if (scrollFactor != null) {
    c.setScrollFactor(scrollFactor);
    for (const p of pieces) p.img.setScrollFactor(scrollFactor);
  }
  if (container) container.add(c);
  return c;
}

// Échelle d'une image d'interface lue dans le manifeste (règle du lot n°8 :
// pas de valeur en dur), avec la valeur du plan en repli si l'entrée manque.
// Les mises en page qui en dépendent (rainure de la barre de boss, zone unie
// de la bannière) ont été mesurées à ces échelles-là.
function storyUiScale(id, fallback) {
  return (getItemManifest()[id] || {}).scale || fallback;
}

// Place les morceaux d'un panneau addUiSliced pour la taille (w, h).
function layoutUiSliced(c, w, h) {
  const u = c && c.__ui;
  if (!u) return c;
  const r = Math.round;
  const W = r(Math.max(Number(w) || 0, (u.L + u.R) * u.k));
  const H = u.three ? r(u.th * u.k) : r(Math.max(Number(h) || 0, (u.T + u.B) * u.k));
  const xs = [0, r(u.L * u.k), W - r(u.R * u.k), W];
  xs[2] = Math.max(xs[2], xs[1]);
  const ys = u.three ? [0, H] : [0, r(u.T * u.k), H - r(u.B * u.k), H];
  if (!u.three) ys[2] = Math.max(ys[2], ys[1]);
  for (const p of u.pieces) {
    const pw = xs[p.i + 1] - xs[p.i];
    const ph = ys[p.j + 1] - ys[p.j];
    p.img.setVisible(pw > 0 && ph > 0);
    if (pw > 0 && ph > 0) p.img.setPosition(xs[p.i], ys[p.j]).setDisplaySize(pw, ph);
  }
  c.uiW = W;
  c.uiH = H;
  return c;
}

// HUD — art Codex, appelé par drawHud (LevelKit.js) à chaque frame : cœurs
// `hud_coeur` / `hud_coeur_vide` et icônes des compétences équipées
// (`skill_icone_*`, lettre de la touche en pastille). Images créées une fois
// par visite puis seulement mises à jour (le Graphics du HUD, lui, est
// redessiné chaque frame). Renvoie ce que drawHud ne doit PAS dessiner :
// { hearts: bool, skills: [bool, bool, bool] } (repli dessiné sans l'art).
const HUD_ART_HEART_H = 24;
const HUD_ART_SKILL_SIZE = 40;
// Pastille de touche peinte (`ui_touche`, bois clair) : 18 px sur les icônes
// du HUD. Encre des lettres posées sur ce bois (une lettre claire n'y est
// pas lisible) : la même pour les invites « E : … ».
const HUD_ART_KEY_SIZE = 18;
const STORY_UI_KEY_INK = '#2a1f45';

function storyHudSkillIconKey(skillId) {
  return `item-${STORY_SKILL_ICON[skillId] || `skill_icone_${skillId}`}`;
}

function storyDrawHudArt(scene) {
  const player = scene.player;
  const result = { hearts: false, skills: [false, false, false] };
  if (!player || !scene.hudGraphics || !player.skillSlots) return result;
  let art = scene.__hudArt;
  // Nouvelle visite : createHud a recréé son Graphics, les anciennes images
  // ont été détruites avec la scène.
  if (!art || art.owner !== scene.hudGraphics) {
    art = scene.__hudArt = { owner: scene.hudGraphics, hearts: [], skills: [] };
  }

  if (scene.textures.exists('item-hud_coeur') && scene.textures.exists('item-hud_coeur_vide')) {
    result.hearts = true;
    const n = player.maxHearts;
    while (art.hearts.length < n) {
      art.hearts.push(scene.add.image(0, 0, 'item-hud_coeur').setScrollFactor(0).setDepth(1001));
    }
    art.hearts.forEach((img, i) => {
      img.setVisible(i < n);
      if (i >= n) return;
      const cx = HUD_MARGIN + HUD_HEART_SIZE / 2 + i * (HUD_HEART_SIZE + HUD_HEART_GAP);
      const cy = HUD_MARGIN + HUD_HEART_SIZE / 2;
      // Juice (LevelKit) : cœur perdu qui tremble puis se vide, regagné qui pousse.
      const hf = typeof juiceHudHeart === 'function' ? juiceHudHeart(scene, i, cx, cy)
        : { full: i < player.hearts, dx: 0, dy: 0, scale: 1, flash: 0 };
      const key = hf.full ? 'item-hud_coeur' : 'item-hud_coeur_vide';
      if (img.texture.key !== key) img.setTexture(key);
      img.setScale((HUD_ART_HEART_H / img.height) * hf.scale);
      img.setPosition(cx + hf.dx, cy + hf.dy);
      if (hf.flash > 0.45) img.setTintFill(0xffffff);
      else if (img.isTinted) img.clearTint();
    });
  }

  const skillY = scene.scale.height - HUD_MARGIN - HUD_SKILL_SIZE / 2;
  // Lot n°8 : case vide peinte `ui_case_competence` (34 px, la taille de la
  // case dessinée) et pastille de touche en bois clair `ui_touche` (lettre
  // sombre #2a1f45 : le bois est clair) sur les icônes équipées.
  const caseArt = scene.textures.exists('item-ui_case_competence');
  const keyArt = scene.textures.exists('item-ui_touche');
  if (!art.cases) art.cases = [];
  HUD_SKILL_LABELS.forEach((label, i) => {
    const id = player.skillSlots[i];
    const def = id && typeof SKILL_DEFS !== 'undefined' ? SKILL_DEFS[id] : null;
    const key = def ? storyHudSkillIconKey(id) : null;
    const has = !!key && scene.textures.exists(key);
    const cx = HUD_MARGIN + HUD_SKILL_SIZE / 2 + i * (HUD_SKILL_SIZE + HUD_SKILL_GAP);
    const text = scene.hudSkillTexts && scene.hudSkillTexts[i];
    // Case vide : image peinte + lettre de drawHud, posées ICI (drawHud saute
    // les cases signalées dans `result.skills` : sans cela, la lettre resterait
    // en (0, 0)). L'image est cachée dès qu'une compétence est équipée.
    const empty = !def && caseArt;
    let box = art.cases[i];
    if (empty && !box) {
      // Sous la lettre (hudSkillTexts, 1001, créée avant) et au-dessus de
      // hudGraphics (1000) : à profondeur égale, l'image cachait la lettre.
      box = art.cases[i] = scene.add.image(0, 0, 'item-ui_case_competence').setScrollFactor(0).setDepth(1000.8);
    }
    if (box) box.setVisible(empty);
    if (empty) {
      box.setPosition(cx, skillY).setScale(HUD_SKILL_SIZE / Math.max(box.width, box.height));
      if (text) text.setText(label).setPosition(cx, skillY).setAlpha(0.5).setVisible(true);
      result.skills[i] = true;
    }
    let slot = art.skills[i];
    if (has && !slot) {
      let badge;
      if (keyArt) {
        badge = scene.add.image(0, 0, 'item-ui_touche').setScrollFactor(0).setDepth(1002);
        badge.setScale(HUD_ART_KEY_SIZE / Math.max(badge.width, badge.height));
      } else {
        badge = scene.add.graphics().setScrollFactor(0).setDepth(1002);
        badge.fillStyle(STORY_UI.night, 0.95);
        badge.fillCircle(0, 0, 8);
        badge.lineStyle(1.5, STORY_UI.vineLight, 0.9);
        badge.strokeCircle(0, 0, 8);
      }
      slot = art.skills[i] = {
        icon: scene.add.image(0, 0, key).setScrollFactor(0).setDepth(1001),
        badge,
        letter: scene.add.text(0, 0, label, {
          fontFamily: 'sans-serif', fontSize: '11px', fontStyle: 'bold', color: keyArt ? STORY_UI_KEY_INK : '#ffe9f5',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1003),
      };
    }
    if (slot) for (const o of [slot.icon, slot.badge, slot.letter]) o.setVisible(has);
    if (text && !empty) text.setVisible(!has);
    if (!has) return;
    result.skills[i] = true;
    if (slot.icon.texture.key !== key) slot.icon.setTexture(key);
    const pop = typeof juiceHudSkillScale === 'function' ? juiceHudSkillScale(scene, i) : 1;
    slot.icon.setPosition(cx, skillY).setScale((HUD_ART_SKILL_SIZE / Math.max(slot.icon.width, slot.icon.height)) * pop);
    // Même règle que drawHud : grisée en recharge ou sans assez d'énergie.
    const unavailable = scene.time.now < player.skillCooldownEndTime || player.energy < def.cost;
    slot.icon.setAlpha(unavailable ? HUD_SKILL_UNAVAILABLE_ALPHA : 1);
    // Pastille peinte (18 px) un peu plus près de la case que le rond
    // dessiné : elle reste dans la bande du HUD que les bulles et les
    // invites évitent (WORLD_UI_HUD_ART_REACH = 22, LevelKit).
    const off = keyArt ? 13 : 14;
    slot.badge.setPosition(cx + off, skillY + off);
    slot.letter.setPosition(cx + off, skillY + off);
  });
  return result;
}

// Petit indicateur « Partie sauvegardée » en bas à droite.
function showSaveIndicator(scene) {
  const { width, height } = scene.scale;
  const t = scene.add.text(width - 16, height - 16, '✦ Partie sauvegardée', {
    fontFamily: 'sans-serif', fontSize: '13px', color: '#8fe3b8',
  }).setOrigin(1, 1).setScrollFactor(0).setDepth(2600).setAlpha(0);
  scene.tweens.add({
    targets: t, alpha: 1, duration: 250, yoyo: true, hold: 1200,
    onComplete: () => t.destroy(),
  });
}

// Bandeau « Objet obtenu / Compétence débloquée » : file d'attente par scène
// pour ne jamais superposer deux bandeaux.
const STORY_BANNER_MS = 2600;
// Mise en page de la bannière (px depuis son bord haut / gauche). Peinte :
// textes et reflet dans la zone unie des planches, MESURÉE à 128 px de haut
// (y + 31 à y + 99 ; le plan estimait y + 23 à y + 106 : à y + 70, la 2e
// ligne de description mordait sur la liane du bas), marge droite élargie
// (lianes du bout) ; dessinée : valeurs d'avant le lot 8.
const STORY_BANNER_ART_LAYOUT = {
  h: 128, ringY: 64, icon: 46, textX: 52, kickY: 30, titleY: 41, descY: 66, padR: 34, shineTop: 30, shineBottom: 30,
};
const STORY_BANNER_DRAWN_LAYOUT = {
  h: 104, ringY: 52, icon: 56, textX: 24, kickY: 14, titleY: 32, descY: 60, padR: 18, shineTop: 0, shineBottom: 0,
};

function showStoryBanner(scene, { kicker, title, desc = '', itemId = null, color = STORY_UI.pink }) {
  const now = scene.time.now;
  const startAt = Math.max(now, scene.__storyBannerFreeAt || 0);
  scene.__storyBannerFreeAt = startAt + STORY_BANNER_MS + 200;
  scene.time.delayedCall(startAt - now, () => {
    // Lot n°8 : bannière peinte `ui_banniere` (128 px de haut : à 104, sa
    // zone unie ne tenait pas 2 lignes de description, R6) et anneau peint
    // `ui_anneau_objet` (disque intérieur 50x46 : icône de 46 px). Sans
    // l'art : panneau et anneau dessinés, mise en page d'avant.
    const art = scene.textures.exists('item-ui_banniere');
    const L = art ? STORY_BANNER_ART_LAYOUT : STORY_BANNER_DRAWN_LAYOUT;
    const w = 460;
    const h = L.h;
    const x = (scene.scale.width - w) / 2;
    const y = 70;
    const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(2100).setAlpha(0);
    c.lookRole = 'ui';
    const bg = art ? addUiSliced(scene, 'ui_banniere', x, y, w, h, { scale: storyUiScale('ui_banniere', 0.65), scrollFactor: 0 }) : null;
    if (bg) {
      c.add(bg);
    } else {
      const g = scene.add.graphics();
      drawStoryPanel(g, x, y, w, h, { seed: 3 });
      c.add(g);
    }
    let textX = x + L.textX;
    // Juice : rayons qui tournent derrière l'icône, icône qui « pousse » avec
    // une gerbe d'étoiles, reflet qui balaie le panneau (cf. plus bas).
    let iconFx = null;
    if (itemId) {
      const ringX = x + 58;
      const ringY = y + L.ringY;
      const rays = scene.add.graphics().setPosition(ringX, ringY).setBlendMode(Phaser.BlendModes.ADD);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        rays.fillStyle(color, 0.16);
        rays.fillTriangle(0, 0, Math.cos(a - 0.12) * 52, Math.sin(a - 0.12) * 52, Math.cos(a + 0.12) * 52, Math.sin(a + 0.12) * 52);
      }
      // Ordre gardé : anneau, rayons (ADD), icône.
      let ring;
      if (scene.textures.exists('item-ui_anneau_objet')) {
        ring = scene.add.image(ringX, ringY, 'item-ui_anneau_objet');
        ring.setScale(72 / Math.max(ring.width, ring.height));
      } else {
        ring = scene.add.graphics();
        ring.fillStyle(STORY_UI.nightSoft, 1);
        ring.fillCircle(ringX, ringY, 36);
        ring.lineStyle(2, color, 0.9);
        ring.strokeCircle(ringX, ringY, 36);
      }
      c.add(ring);
      c.add(rays);
      const icon = addItemIcon(scene, ringX, ringY, itemId, L.icon);
      c.add(icon);
      iconFx = { rays, icon, x: ringX, y: ringY, scale: icon.scale };
      icon.setScale(icon.scale * 0.2);
      textX = x + 110;
    }
    const kick = scene.add.text(textX, y + L.kickY, kicker.toUpperCase(), {
      fontFamily: 'sans-serif', fontSize: '12px', color: colorToHex(color), fontStyle: 'bold',
    });
    if (kick.setLetterSpacing) kick.setLetterSpacing(2);
    c.add(kick);
    c.add(scene.add.text(textX, y + L.titleY, title, {
      fontFamily: STORY_UI.serif, fontSize: '21px', color: STORY_UI.text, fontStyle: 'bold',
    }));
    if (desc) {
      c.add(scene.add.text(textX, y + L.descY, desc, {
        fontFamily: 'sans-serif', fontSize: '12px', color: STORY_UI.textSoft,
        wordWrap: { width: x + w - textX - L.padR }, lineSpacing: 2,
      }));
    }
    c.y = -34;
    scene.tweens.add({ targets: c, alpha: 1, y: 0, duration: 420, ease: 'Back.Out' });
    let spin = null;
    if (iconFx) {
      scene.tweens.add({ targets: iconFx.icon, scale: iconFx.scale, duration: 420, delay: 140, ease: 'Back.Out' });
      spin = scene.tweens.add({ targets: iconFx.rays, angle: 360, duration: 9000, repeat: -1 });
      scene.time.delayedCall(220, () => {
        if (typeof spawnFx === 'function') spawnFx(scene, 'uiStar', iconFx.x, iconFx.y, { count: 10, power: 1.2 });
      });
    }
    // Reflet : bande claire qui traverse le panneau une fois (bannière
    // peinte : seulement sur les planches, pas sur les lianes du bord).
    const shine = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    shine.fillStyle(0xffffff, 0.16);
    const sy0 = y + L.shineTop;
    const sy1 = y + h - L.shineBottom;
    shine.fillPoints([{ x: 0, y: sy0 }, { x: 26, y: sy0 }, { x: 6, y: sy1 }, { x: -20, y: sy1 }], true);
    shine.x = x + 24;
    c.add(shine);
    scene.tweens.add({ targets: shine, x: x + w - 30, alpha: { from: 1, to: 0.2 }, duration: 700, delay: 320, ease: 'Sine.easeInOut', onComplete: () => shine.setVisible(false) });
    if (typeof playSfx === 'function') playSfx('banner', { kicker });
    scene.tweens.add({
      targets: c, alpha: 0, y: -16, duration: 400, delay: STORY_BANNER_MS - 400, ease: 'Sine.easeIn',
      onComplete: () => { if (spin) spin.remove(); c.destroy(); },
    });
  });
}

// Petit texte informatif en haut de l'écran (indices de Xara, messages).
// En haut de l'écran (correctif : à y 318, juste au-dessus d'Agarica, il
// recouvrait les invites « E : … » affichées sur les PNJ/objets proches).
// Sous le bord haut, entre le HUD (en haut à gauche) et les bandeaux (y 70).
const STORY_TOAST_Y = 42;

// Lot n°8 (SK-8) : posé sur le cadre peint des bulles (`ui_bulle`, même
// famille que les bulles de parole) au lieu du fond violet plein ; même
// conteneur pour les tweens. Sans l'art : le Text à fond violet d'avant.
const STORY_TOAST_ART_PAD = { x: 16, y: 8 };

function showToast(scene, text, ms = 2600) {
  if (scene.__storyToast && scene.__storyToast.active) scene.__storyToast.destroy();
  const art = scene.textures.exists('item-ui_bulle');
  const style = {
    fontFamily: 'sans-serif', fontSize: '15px', color: STORY_UI.text, align: 'center',
    wordWrap: { width: 590 }, // ne déborde pas sur le HUD
  };
  if (!art) Object.assign(style, { backgroundColor: '#2a1f45', padding: { x: 12, y: 7 } });
  let t = scene.add.text(scene.scale.width / 2, STORY_TOAST_Y, text, style).setOrigin(0.5);
  if (art) {
    const label = t.setPosition(0, 0);
    const w = Math.ceil(label.width + STORY_TOAST_ART_PAD.x * 2);
    const h = Math.ceil(label.height + STORY_TOAST_ART_PAD.y * 2);
    const bg = addUiSliced(scene, 'ui_bulle', -Math.round(w / 2), -Math.round(h / 2), w, h, { scale: storyUiScale('ui_bulle', 0.2), scrollFactor: 0 });
    t = scene.add.container(scene.scale.width / 2, STORY_TOAST_Y, [bg, label]);
  }
  t.setScrollFactor(0).setDepth(2050).setAlpha(0);
  t.lookRole = 'ui';
  scene.__storyToast = t;
  // Règle commune (LevelKit) : bulles et invites ne se posent pas dessous.
  if (typeof worldUiAddScreenObstacle === 'function') worldUiAddScreenObstacle(t);
  t.setScale(0.92);
  scene.tweens.add({ targets: t, alpha: 1, scale: 1, duration: 240, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, alpha: 0, duration: 350, delay: Math.max(400, ms - 350), onComplete: () => t.destroy() });
  return t;
}

// ---------------------------------------------------------------------------
// Bulles de parole NON bloquantes (2026-10-23). Retour utilisateur : Xara
// « coupait le jeu toutes les 4 secondes » avec des dialogues qui gèlent le
// monde. Une bulle de BD au-dessus de qui parle, qui le SUIT (Agarica peut
// courir et sauter), ne gèle rien, ne prend aucune touche et s'efface seule.
//   showSpeechBubble(scene, cible, texte, { ms, who, replace }) → Promise
//   (résolue quand la bulle a disparu). `cible` : objet de jeu, ou id :
//   'agarica'/'player' (le joueur), 'xara' (compagnon, sinon PNJ), clé de
//   scene.npcs ou id de manifest d'un PNJ. Introuvable : toast « Nom : texte ».
//   Une bulle à la fois par personnage : les suivantes attendent leur tour
//   (file), sauf `replace: true` (remplace aussitôt). `ms` : durée affichée
//   (défaut selon la longueur, 2,5-5 s). `who` : qui parle (nom du toast de
//   repli, et cible si `cible` est vide).
//   clearSpeechBubbles(scene[, cible]) : retire les bulles (et leurs files).
// Cinématique : étape `{bubble: {who, text, ms?}}` (n'attend pas, ne gèle
// rien). Dialogue : une réplique `{who, text, bubble: true}` part en bulle.
// ---------------------------------------------------------------------------
const SPEECH_BUBBLE_MAX_W = 220;
const SPEECH_BUBBLE_PAD = { x: 9, y: 6 };
const SPEECH_BUBBLE_TAIL = 8; // hauteur de la pointe
const SPEECH_BUBBLE_GAP = 4; // entre la pointe et le haut visible du personnage
// Au-dessus des personnages et des plantes de premier plan
// (DECOR_FOREGROUND_DEPTH), sous les invites « Appuie sur E ».
const SPEECH_BUBBLE_DEPTH = 1040;
const SPEECH_BUBBLE_FADE_MS = 220;
// Place FIXE (retour des joueuses du 2026-11-09 : « le truc vraiment chiant,
// c'est l'araignée et les dialogues : mets un endroit fixe ») : les bulles ne
// suivent plus le personnage, elles s'empilent en haut à droite de l'écran
// (les cœurs sont en haut à gauche), avec le visage et le nom de qui parle,
// sans pointe. Elles évitent le HUD et le toast d'aide (worldUiHudRects) et
// glissent d'une place à l'autre quand une bulle du dessus s'en va.
// `false` : bulles de BD au-dessus des personnages, comme avant.
const SPEECH_BUBBLE_FIXED = true;
const SPEECH_BUBBLE_FIXED_MAX_W = 260;
const SPEECH_BUBBLE_FIXED_PAD = { x: 10, y: 7 };
const SPEECH_BUBBLE_FIXED_FACE = 30; // diamètre du médaillon
const SPEECH_BUBBLE_FIXED_GAP = 6; // entre deux bulles empilées
const SPEECH_BUBBLE_FIXED_EASE = 0.3; // glissement vers la nouvelle place, par image
const SPEECH_BUBBLE_FIXED_MAX = 3; // au-delà, les plus anciennes s'effacent

function speechBubbleDuration(text) {
  return Phaser.Math.Clamp(1400 + String(text).length * 45, 2500, 5000);
}

function speechBubbleTarget(scene, target) {
  if (target && typeof target === 'object') return target.active === false ? null : target;
  if (!target) return null;
  if (target === 'agarica' || target === 'player') return scene.player || null;
  if (target === 'xara' && scene.xara && scene.xara.active) return scene.xara;
  const npcs = scene.npcs || {};
  if (npcs[target] && npcs[target].active) return npcs[target];
  return Object.values(npcs).find((n) => n && n.active && n.manifestId === target) || null;
}

// Haut VISIBLE du personnage (cf. objectVisibleBox) ; un sprite tourné
// (suspendu, penché) : ses bornes. Xara qui parle est cachée sous son sprite
// de parole (cf. storySpeakerTalkAnim) : c'est lui qu'on suit alors.
// `left`/`right` : bords visibles (bulle posée à côté, cf. layoutSpeechBubble).
function speechBubbleAnchor(target) {
  const t = target.__talkSprite && target.__talkSprite.active ? target.__talkSprite : target;
  if (t.frame && !t.rotation && typeof objectVisibleBox === 'function') {
    const box = objectVisibleBox(t);
    if (box) return { x: (box.left + box.right) / 2, top: box.top, left: box.left, right: box.right };
  }
  const b = t.getBounds ? t.getBounds() : { centerX: t.x, y: t.y - 60, x: t.x - 20, right: t.x + 20 };
  return { x: b.centerX, top: b.y, left: b.x, right: b.right };
}

function speechBubbleState(scene) {
  if (!scene.__speechBubbles || scene.__speechBubbles.visit !== scene.__storyVisit) {
    scene.__speechBubbles = { visit: scene.__storyVisit, byTarget: new Map() };
  }
  if (!scene.__speechBubbleHook) {
    // Après la physique et les update() : la bulle suit la position finale.
    scene.__speechBubbleHook = true;
    scene.events.on('postupdate', () => updateSpeechBubbles(scene));
    scene.events.on('shutdown', () => { scene.__speechBubbles = null; });
  }
  // Règle commune « interface toujours dans l'écran » (LevelKit) : la bulle
  // est remise en page avec la vue de la caméra une fois son défilement de
  // l'image calculé (sinon une image de retard en mouvement).
  if (typeof worldUiAddLayout === 'function') worldUiAddLayout(scene, 'speechBubbles', (view, ctx) => layoutAllSpeechBubbles(scene, view, ctx));
  return scene.__speechBubbles;
}

// Vue (monde) où les bulles doivent tenir : celle de la règle commune
// (marge WORLD_UI_MARGIN), sinon la vue brute de la caméra.
function speechBubbleView(scene) {
  if (typeof worldUiView === 'function') return worldUiView(scene);
  const v = scene.cameras.main.worldView;
  return { left: v.x + 8, top: v.y + 8, right: v.right - 8, bottom: v.bottom - 8 };
}

// Bulle peinte du lot n°8 (`ui_bulle` + `ui_bulle_pointe`) : marges
// intérieures plus grandes (le liseré et les feuilles des coins mordent sur
// le bord : à 9/6 le texte touchait les coins arrondis), tailles minimales
// = les coins découpés (bornes d'addUiSliced). Échelles : 0,2 et 0,26 (le
// liseré de la pointe raccorde celui de la bulle). La pointe entre de
// `tailInset` px dans la bulle (`tailInsetSide` sur un bord latéral) : son
// haut sombre recouvre le liseré du bord, qui s'ouvre sur elle. Sa base
// reste à `tailMargin` px des coins (feuilles). Le Graphics reste le repli
// sans l'art.
const SPEECH_BUBBLE_ART = {
  pad: { x: 12, y: 7 }, minW: 30, minH: 24, scale: 0.2, tailScale: 0.26, tailW: 18,
  tailInset: 7, tailInsetSide: 5, tailMargin: { x: 21, y: 21 },
};

// Qui parle dans une bulle : id (SPEAKERS ou manifeste), nom et couleur.
function speechBubbleSpeaker(scene, target, who, targetOrNpcId) {
  let id = who || (typeof targetOrNpcId === 'string' ? targetOrNpcId : null);
  if (!id && target) {
    if (target === scene.player) id = 'agarica';
    else if (target === scene.xara) id = 'xara';
    else id = target.manifestId || target.npcKey || null;
  }
  if (id === 'player') id = 'agarica';
  const sp = (id && SPEAKERS[id]) || null;
  const name = (sp && sp.name) || (target && target.npcName) || (id ? id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' ') : '');
  return { id, name, color: sp ? sp.color : 0xa99bd6, initial: (sp && sp.initial) || (name ? name.charAt(0) : '?') };
}

// Visage rond du médaillon : portrait Codex recadré sur le visage (même
// repère que la boîte de dialogue, DIALOGUE_PORTRAIT_FOCUS) dans une petite
// texture ronde, faite une fois par portrait. null sans portrait.
function speechBubbleFaceKey(scene, speakerId) {
  const pid = speakerId ? storySpeakerPortraitId(speakerId) : null;
  const src = pid ? `item-portrait_${pid}` : null;
  if (!src || !scene.textures.exists(src)) return null;
  const key = `bulle-visage-${pid}`;
  if (scene.textures.exists(key)) return key;
  const img = scene.textures.get(src).getSourceImage();
  if (!img || !img.width) return null;
  const S = 64;
  const tex = scene.textures.createCanvas(key, S, S);
  const ctx = tex.getContext();
  const focus = (typeof DIALOGUE_PORTRAIT_FOCUS !== 'undefined' && DIALOGUE_PORTRAIT_FOCUS[pid]) || [0.5, 0.45];
  // ~45 % de l'image autour du visage (la boîte de dialogue en montre ~75 %).
  const span = Math.min(img.width, img.height) * 0.45;
  const sx = Phaser.Math.Clamp(focus[0] * img.width - span / 2, 0, img.width - span);
  const sy = Phaser.Math.Clamp(focus[1] * img.height - span / 2, 0, img.height - span);
  ctx.save();
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#2a1f45';
  ctx.fillRect(0, 0, S, S);
  ctx.drawImage(img, sx, sy, span, span, 0, 0, S, S);
  ctx.restore();
  tex.refresh();
  return key;
}

// Bulle à place fixe : médaillon (visage, sinon pastille couleur + initiale)
// à gauche, nom de qui parle au-dessus du texte.
function buildFixedSpeechBubble(scene, text, speaker) {
  const P = SPEECH_BUBBLE_FIXED_PAD;
  const D = SPEECH_BUBBLE_FIXED_FACE;
  const art = scene.textures.exists('item-ui_bulle');
  const sp = speaker || { name: '', color: 0xa99bd6, initial: '?' };
  const colorHex = `#${(sp.color >>> 0).toString(16).padStart(6, '0')}`;
  const textX = D + 8;
  const wrap = SPEECH_BUBBLE_FIXED_MAX_W - P.x * 2 - textX;
  const nameT = scene.add.text(0, 0, sp.name || '', {
    fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: colorHex, stroke: '#15101f', strokeThickness: 2,
  }).setOrigin(0, 0);
  const label = scene.add.text(0, 0, text, {
    fontFamily: 'sans-serif', fontSize: '13px', color: STORY_UI.text, lineSpacing: 1,
    wordWrap: { width: wrap, useAdvancedWrap: true },
  }).setOrigin(0, 0);
  const nameH = sp.name ? nameT.height : 0;
  const innerW = textX + Math.max(nameT.width, label.width);
  const innerH = Math.max(D, nameH + label.height);
  const w = Math.ceil(innerW + P.x * 2);
  const h = Math.ceil(innerH + P.y * 2);
  const x0 = -w / 2 + P.x;
  const y0 = -h / 2 + P.y;
  nameT.setPosition(x0 + textX, y0);
  label.setPosition(x0 + textX, y0 + nameH);
  const g = scene.add.graphics();
  const bg = art ? addUiSliced(scene, 'ui_bulle', -w / 2, -h / 2, w, h, { scale: storyUiScale('ui_bulle', SPEECH_BUBBLE_ART.scale) }) : null;
  // Médaillon : visage du portrait, sinon disque couleur + initiale ; liseré
  // de la couleur de qui parle.
  const fx = x0 + D / 2;
  const fy = y0 + D / 2;
  const faceKey = speechBubbleFaceKey(scene, sp.id);
  const face = [];
  if (faceKey) {
    face.push(scene.add.image(fx, fy, faceKey).setDisplaySize(D, D));
  } else {
    const disc = scene.add.graphics();
    disc.fillStyle(sp.color, 0.9).fillCircle(fx, fy, D / 2);
    const ini = scene.add.text(fx, fy, sp.initial || '?', {
      fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#15101f',
    }).setOrigin(0.5);
    face.push(disc, ini);
  }
  const ring = scene.add.graphics();
  ring.lineStyle(2, sp.color, 1).strokeCircle(fx, fy, D / 2);
  const parts = [bg, g, ...face, ring, nameT, label].filter(Boolean);
  const c = scene.add.container(0, 0, parts).setDepth(SPEECH_BUBBLE_DEPTH).setAlpha(0);
  c.lookRole = 'ui';
  return { container: c, g, label, w, h, bg, tail: null, fixed: true };
}

function buildSpeechBubble(scene, text, speaker = null) {
  if (SPEECH_BUBBLE_FIXED) return buildFixedSpeechBubble(scene, text, speaker);
  const A = SPEECH_BUBBLE_ART;
  const art = scene.textures.exists('item-ui_bulle');
  const pad = art ? A.pad : SPEECH_BUBBLE_PAD;
  const label = scene.add.text(0, 0, text, {
    fontFamily: 'sans-serif', fontSize: '13px', color: STORY_UI.text, align: 'center', lineSpacing: 1,
    wordWrap: { width: SPEECH_BUBBLE_MAX_W - pad.x * 2, useAdvancedWrap: true },
  }).setOrigin(0.5, 1);
  let w = Math.ceil(label.width + pad.x * 2);
  let h = Math.ceil(label.height + pad.y * 2);
  if (art) {
    w = Math.max(A.minW, w);
    h = Math.max(A.minH, h);
  }
  // Origine du conteneur = CENTRE de la bulle : l'apparition (échelle 0,85 -> 1)
  // reste dans le rectangle final, donc dans l'écran (avant, l'origine était
  // le bout de la pointe et la bulle glissait vers le personnage en grandissant).
  label.setPosition(0, h / 2 - pad.y);
  const g = scene.add.graphics();
  const bg = art ? addUiSliced(scene, 'ui_bulle', -w / 2, -h / 2, w, h, { scale: storyUiScale('ui_bulle', A.scale) }) : null;
  const tail = bg && scene.textures.exists('item-ui_bulle_pointe')
    ? scene.add.image(0, 0, 'item-ui_bulle_pointe').setOrigin(0.5, 0).setScale(storyUiScale('ui_bulle_pointe', A.tailScale)).setVisible(false) : null;
  // Fond, pointe (sur le liseré du bas), texte ; le Graphics ne sert plus
  // qu'à la pointe dessinée si son image manque.
  const parts = bg ? [bg, g, tail, label].filter(Boolean) : [g, label];
  const c = scene.add.container(0, 0, parts).setDepth(SPEECH_BUBBLE_DEPTH).setAlpha(0);
  // Rendu de cohésion (LookKit) : interface (bulle et texte nets).
  c.lookRole = 'ui';
  const b = { container: c, g, label, w, h, bg, tail };
  if (bg) b.tailMargin = A.tailMargin;
  return b;
}

// Base de la pointe d'une bulle (w x h, centre en 0,0) vers `tip` (relatif
// au centre) : bord latéral seulement si le point visé est à côté de la
// bulle, dans sa hauteur (bulle posée à côté) ; sinon bord du bas (ou du
// haut), même si le personnage déborde un peu de la bulle (bulle calée
// contre le bord de l'écran). { beside, s, x, y } : `s` = sens du bord
// (+1 droite/bas, -1 gauche/haut), (x, y) = milieu de la base SUR le bord.
// `margin` : écart minimal entre la base et les coins (bulle peinte : ses
// coins feuillus, cf. SPEECH_BUBBLE_ART), borné à la demi-taille.
function speechBubbleTailBase(w, h, tip, margin = { x: 12, y: 9 }) {
  const hw = w / 2;
  const hh = h / 2;
  const mx = Math.min(margin.x, hw);
  const my = Math.min(margin.y, hh);
  const beside = Math.abs(tip.x) > hw && Math.abs(tip.y) <= hh;
  if (beside) {
    const s = tip.x > 0 ? 1 : -1;
    return { beside, s, x: s * hw, y: Phaser.Math.Clamp(tip.y, -hh + my, hh - my) };
  }
  const s = tip.y > 0 ? 1 : -1;
  return { beside, s, x: Phaser.Math.Clamp(tip.x, -hw + mx, hw - mx), y: s * hh };
}

// Bulle peinte : panneau découpé + image de pointe orientée de sa base
// (sur le bord, rentrée de tailInset px) vers `tip`, étirée à la longueur.
function drawSpeechBubbleArt(b, tip) {
  const A = SPEECH_BUBBLE_ART;
  b.bg.setPosition(-b.w / 2, -b.h / 2);
  b.g.clear();
  if (!tip) {
    if (b.tail) b.tail.setVisible(false);
    return;
  }
  const base = speechBubbleTailBase(b.w, b.h, tip, A.tailMargin);
  if (!b.tail) {
    // Image de pointe absente : pointe dessinée sous la même règle.
    b.g.fillStyle(STORY_UI.night, 0.93);
    if (base.beside) b.g.fillTriangle(base.x - base.s * 3, base.y - 7, base.x - base.s * 3, base.y + 7, tip.x, tip.y);
    else b.g.fillTriangle(base.x - 7, base.y - base.s * 3, base.x + 7, base.y - base.s * 3, tip.x, tip.y);
    return;
  }
  const bx = base.beside ? base.x - base.s * A.tailInsetSide : base.x;
  const by = base.beside ? base.y : base.y - base.s * A.tailInset;
  const dx = tip.x - bx;
  const dy = tip.y - by;
  // L'image pointe vers le bas (+y) : rotation qui amène +y sur (dx, dy).
  b.tail.setPosition(bx, by).setRotation(Math.atan2(-dx, dy))
    .setDisplaySize(A.tailW, Math.max(1, Math.hypot(dx, dy))).setVisible(true);
}

// Fond sombre, liseré vert lunaire, pointe vers le personnage. `tip` : bout
// de la pointe relatif au CENTRE de la bulle, ou null (pointe cachée). La
// pointe part du bord qui fait face au personnage (bas d'habitude ; haut, ou
// côté, quand la bulle a dû se poser ailleurs) et sa base glisse le long de
// ce bord pour rester en face de lui.
function drawSpeechBubble(b, tip) {
  if (b.bg) { drawSpeechBubbleArt(b, tip); return; }
  const { g, w, h } = b;
  const hw = w / 2;
  const hh = h / 2;
  g.clear();
  g.fillStyle(STORY_UI.night, 0.93);
  g.lineStyle(2, STORY_UI.vineLight, 0.95);
  g.fillRoundedRect(-hw, -hh, w, h, 8);
  g.strokeRoundedRect(-hw, -hh, w, h, 8);
  if (!tip) return;
  // Base de la pointe : deux points du bord, posés 1 px DANS la bulle.
  const base = speechBubbleTailBase(w, h, tip);
  const s = base.s;
  let p1;
  let p2;
  let c1;
  let c2;
  if (!base.beside) {
    const tx = base.x;
    const ey = base.y;
    p1 = [tx - 7, ey - s];
    p2 = [tx + 7, ey - s];
    c1 = [tx - 5.5, ey - s];
    c2 = [tx + 5.5, ey - s];
  } else {
    const ex = base.x;
    const ty = base.y;
    p1 = [ex - s, ty - 7];
    p2 = [ex - s, ty + 7];
    c1 = [ex - s, ty - 5.5];
    c2 = [ex - s, ty + 5.5];
  }
  g.fillTriangle(p1[0], p1[1], p2[0], p2[1], tip.x, tip.y);
  g.lineBetween(p1[0], p1[1], tip.x, tip.y);
  g.lineBetween(p2[0], p2[1], tip.x, tip.y);
  // Recouvre le liseré sous la base de la pointe (la pointe sort de la bulle).
  g.lineStyle(3, STORY_UI.night, 1);
  g.lineBetween(c1[0], c1[1], c2[0], c2[1]);
}

// Écart horizontal entre le bord visible du personnage et une bulle posée à
// côté de lui (cf. layoutSpeechBubble).
const SPEECH_BUBBLE_SIDE_GAP = 14;
// Déplacement d'une bulle qui évite une autre bulle ou le HUD (cf.
// worldUiFreeSpot) : lissé une fois par image (elle glisse vers sa place,
// comme l'ancienne « remontée lissée ») ; un grand saut (nouvelle bulle,
// autre situation) est pris d'un coup.
const SPEECH_BUBBLE_SHIFT_EASE = 0.3;
const SPEECH_BUBBLE_SHIFT_SNAP = 60;

function speechBubbleRectsMeet(a, b, gap = 0) {
  return a.left < b.right + gap && a.right > b.left - gap && a.top < b.bottom + gap && a.bottom > b.top - gap;
}

// Boîte visible d'un personnage et personnages à l'écran (Agarica, Xara,
// PNJ) : une bulle évite de les cacher. Calculés par la règle commune de
// LevelKit (worldUiBodyBox, worldUiCharacterRects : les invites les évitent
// aussi).
function speechBubbleBodyBox(obj) {
  return typeof worldUiBodyBox === 'function' ? worldUiBodyBox(obj) : null;
}

function speechBubbleCharacters(scene, view) {
  return typeof worldUiCharacterRects === 'function' ? worldUiCharacterRects(scene, view) : [];
}

// Bulle posée à CÔTÉ du personnage (`side` : 1 à droite, -1 à gauche), à
// hauteur de sa tête.
function speechBubbleSideRect(b, L, side, view) {
  const half = b.w / 2;
  const cx = side > 0 ? L.right + SPEECH_BUBBLE_SIDE_GAP + half : L.left - SPEECH_BUBBLE_SIDE_GAP - half;
  const bottom = Phaser.Math.Clamp(L.tipY + SPEECH_BUBBLE_GAP + b.h - 6, view.top + b.h, view.bottom);
  return { left: cx - half, right: cx + half, top: bottom - b.h, bottom };
}

// Côté où poser la bulle quand il n'y a pas la place au-dessus : celui où
// elle tient dans l'écran sans toucher un obstacle (HUD, bulle déjà posée)
// ni cacher un autre personnage. Ordre : le côté déjà pris (pas de
// va-et-vient d'une image à l'autre), puis le côté OPPOSÉ à Agarica (ou à
// Xara quand c'est Agarica qui parle : sa compagne la suit de près) --
// relecture : la bulle de Xara se posait toujours à sa droite, sur Agarica
// debout à côté, alors que la gauche était libre. 0 si aucun côté n'est
// libre : la bulle reste alors au-dessus, calée en haut de l'écran.
function speechBubbleChooseSide(b, L, view, hard, others) {
  const scene = b.container.scene;
  const ref = b.target === scene.player ? scene.xara : scene.player;
  const refBox = ref && ref !== b.target ? speechBubbleBodyBox(ref) : null;
  const away = refBox && (refBox.left + refBox.right) / 2 > L.ax ? -1 : 1;
  const order = b.side ? [b.side, -b.side] : [away, -away];
  for (const side of order) {
    const r = speechBubbleSideRect(b, L, side, view);
    if (r.left < view.left || r.right > view.right) continue;
    if (hard.some((o) => speechBubbleRectsMeet(r, o, 4)) || others.some((o) => speechBubbleRectsMeet(r, o))) continue;
    return side;
  }
  return 0;
}

// Mise en page d'une bulle dans la vue `view` (règle commune de LevelKit :
// tout dans l'écran, marge WORLD_UI_MARGIN), d'après `b.layout` (ancre
// lissée par positionSpeechBubble). Appelée en postupdate ET quand la caméra
// a fini son défilement de l'image, toujours via layoutAllSpeechBubbles (même
// ordre, même résultat). `ctx` : { placed, hud, characters } = bulles déjà
// posées dans cette passe, bandes du HUD, personnages à l'écran.
// 1. Au-dessus du personnage, glissée le long du bord gauche/droit au besoin,
//    calée en haut de la vue s'il n'y a pas la place.
// 2. Pas la place au-dessus (tête près du haut de l'écran) et personnage
//    VISIBLE en x : à CÔTÉ de lui, à hauteur de sa tête, du côté libre (cf.
//    speechBubbleChooseSide) -- plutôt que de descendre sur sa tête. Hors
//    de l'écran sur le côté : jamais à côté (relecture : la bulle d'une Xara
//    sortie à gauche était posée à côté d'elle, donc hors de l'écran).
// 3. Si elle touche le HUD ou une bulle déjà posée (deux têtes près du haut,
//    coin de l'écran) : déplacée à la place libre la plus proche
//    (worldUiFreeSpot), en évitant de cacher les personnages.
// 4. Toujours ramenée dans la vue. Pointe : vers le haut visible du
//    personnage, cachée si ce point est hors de l'écran ou recouvert par la
//    bulle ; tracée par layoutAllSpeechBubbles une fois toutes les bulles posées.
function layoutSpeechBubble(b, view, ctx = {}) {
  const L = b.layout;
  if (!L || !view || !b.container.active) return;
  const placed = ctx.placed || [];
  const hard = [...(ctx.hud || []), ...placed];
  const chars = ctx.characters || [];
  const others = chars.filter((c) => c.owner !== b.target);
  const half = b.w / 2;
  let cx = Phaser.Math.Clamp(L.ax, view.left + half, view.right - half);
  let bottom = Phaser.Math.Clamp(L.tipY - SPEECH_BUBBLE_TAIL, view.top + b.h, view.bottom);
  // Point visé par la pointe : le haut visible du personnage (bulle au-dessus)
  // ou son visage, juste avant son bord (bulle à côté).
  let aimX = L.ax;
  let aimY = L.tipY;
  const roomAbove = L.tipY - SPEECH_BUBBLE_TAIL - b.h >= view.top;
  const visibleX = L.left != null && L.right >= view.left && L.left <= view.right;
  b.side = !roomAbove && visibleX ? speechBubbleChooseSide(b, L, view, hard, others) : 0;
  if (b.side) {
    const r = speechBubbleSideRect(b, L, b.side, view);
    cx = (r.left + r.right) / 2;
    bottom = r.bottom;
    aimX = b.side > 0 ? L.right + 4 : L.left - 4;
    aimY = L.tipY + SPEECH_BUBBLE_GAP + 14;
  }
  const rect = { left: cx - half, right: cx + half, top: bottom - b.h, bottom };
  const shift = typeof worldUiFreeSpot === 'function' ? worldUiFreeSpot(rect, view, hard, chars) : { dx: 0, dy: 0 };
  const frame = b.container.scene.game.loop.frame;
  if (b.shiftFrame !== frame) {
    b.shiftPrev = b.shift || null;
    b.shiftFrame = frame;
  }
  const prev = b.shiftPrev;
  b.shift = !prev || Math.hypot(shift.dx - prev.dx, shift.dy - prev.dy) > SPEECH_BUBBLE_SHIFT_SNAP ? shift
    : { dx: prev.dx + (shift.dx - prev.dx) * SPEECH_BUBBLE_SHIFT_EASE, dy: prev.dy + (shift.dy - prev.dy) * SPEECH_BUBBLE_SHIFT_EASE };
  // Le glissement ne doit pas faire passer la bulle SUR une autre (ou sur le
  // HUD) quand sa place d'arrivée est libre (saut rapide, caméra verticale :
  // le lissage traînait derrière et les textes se chevauchaient quelques
  // images) : elle y va alors d'un coup.
  const onHard = (d) => hard.some((o) => speechBubbleRectsMeet({
    left: rect.left + d.dx, right: rect.right + d.dx, top: rect.top + d.dy, bottom: rect.bottom + d.dy,
  }, o));
  if ((b.shift.dx !== shift.dx || b.shift.dy !== shift.dy) && onHard(b.shift) && !onHard(shift)) b.shift = shift;
  // Toujours dans la vue, quel que soit le côté choisi ou le déplacement.
  cx = Phaser.Math.Clamp(cx + b.shift.dx, view.left + half, view.right - half);
  bottom = Phaser.Math.Clamp(bottom + b.shift.dy, view.top + b.h, view.bottom);
  const cy = bottom - b.h / 2;
  b.container.setPosition(cx, cy);
  b.rect = { left: cx - half, right: cx + half, top: bottom - b.h, bottom };
  const m = typeof WORLD_UI_MARGIN === 'number' ? WORLD_UI_MARGIN : 8;
  const onScreen = aimX >= view.left - m && aimX <= view.right + m && aimY >= view.top - m && aimY <= view.bottom + m;
  const tx = aimX - cx;
  const ty = aimY - cy;
  const covered = Math.abs(tx) <= half + 3 && Math.abs(ty) <= b.h / 2 + 3;
  b.tip = onScreen && !covered ? { x: tx, y: ty } : null;
}

// Pointe libre : elle ne traverse aucune autre bulle ni le HUD. Retour de
// relecture : une bulle remontée au-dessus d'une autre tirait sa pointe à
// travers celle du dessous et en barrait le texte (« Enco|e une nuit… »).
// Segment de la base (sur le bord de la bulle) au bout, échantillonné tous
// les 3 px, obstacles élargis de la demi-largeur de la pointe.
function speechBubbleTailClear(b, blockers) {
  const tip = b.tip;
  if (!tip) return false;
  const base = speechBubbleTailBase(b.w, b.h, tip, b.tailMargin);
  const x0 = b.container.x + base.x;
  const y0 = b.container.y + base.y;
  const x1 = b.container.x + tip.x;
  const y1 = b.container.y + tip.y;
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
  const pad = 4;
  for (let i = 1; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const y = y0 + ((y1 - y0) * i) / n;
    if (blockers.some((r) => r !== b.rect && x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad)) return false;
  }
  return true;
}

// Met en page TOUTES les bulles, dans l'ordre où elles sont apparues : une
// bulle évite celles déjà posées. Appelée en postupdate (updateSpeechBubbles)
// et par la règle commune de LevelKit (worldUiAddLayout, `ctx.hud`) ; les
// pointes sont tracées à la fin, quand on connaît la place de chacune.
// Renvoie les rectangles des bulles visibles : les invites « E » les évitent.
function layoutAllSpeechBubbles(scene, view, ctx = {}) {
  const st = scene.__speechBubbles;
  if (!st || !st.byTarget.size || !view) return [];
  const hud = ctx.hud || (typeof worldUiHudRects === 'function' ? worldUiHudRects(scene) : []);
  if (SPEECH_BUBBLE_FIXED) return layoutFixedSpeechBubbles(scene, view, hud);
  const characters = ctx.characters || speechBubbleCharacters(scene, view);
  const placed = [];
  const laid = [];
  for (const [target, slot] of st.byTarget) {
    const b = slot.current;
    if (!b || !target.active || !b.container.active) continue;
    positionSpeechBubble(scene, b);
    layoutSpeechBubble(b, view, { placed, hud, characters });
    if (!b.rect) continue;
    placed.push(b.rect);
    laid.push(b);
  }
  const blockers = [...placed, ...hud];
  for (const b of laid) drawSpeechBubble(b, b.tip && speechBubbleTailClear(b, blockers) ? b.tip : null);
  return laid.filter((b) => b.container.alpha > 0).map((b) => b.rect);
}

// Bulles à place fixe (SPEECH_BUBBLE_FIXED) : colonne en haut à droite de la
// vue, dans l'ordre d'apparition, chacune sous la précédente et sous tout
// obstacle de la règle commune qu'elle chevaucherait (HUD, toast d'aide).
// Place visée en coordonnées ÉCRAN, rejointe en glissant une fois par image
// (une bulle qui s'en va laisse monter les suivantes) ; la colonne suit la
// caméra. Au-delà de SPEECH_BUBBLE_FIXED_MAX bulles, les plus anciennes
// s'effacent.
function layoutFixedSpeechBubbles(scene, view, hud) {
  const st = scene.__speechBubbles;
  const live = [];
  for (const [target, slot] of st.byTarget) {
    const b = slot.current;
    if (b && target.active && b.container.active) live.push({ b, target, slot });
  }
  const extra = live.filter((e) => !e.b.ending).length - SPEECH_BUBBLE_FIXED_MAX;
  for (let i = 0, n = 0; i < live.length && n < extra; i++) {
    if (live[i].b.ending) continue;
    n += 1;
    finishSpeechBubble(scene, live[i].target, live[i].slot);
  }
  const meet = (a, r) => a.left < r.right && a.right > r.left && a.top < r.bottom && a.bottom > r.top;
  const frame = scene.game.loop.frame;
  const laid = [];
  let y = view.top;
  for (const { b } of live) {
    let rect = { left: view.right - b.w, right: view.right, top: y, bottom: y + b.h };
    for (let guard = 0; guard < 6; guard++) {
      const hit = hud.find((r) => meet(rect, r));
      if (!hit) break;
      rect = { left: rect.left, right: rect.right, top: hit.bottom + SPEECH_BUBBLE_FIXED_GAP, bottom: hit.bottom + SPEECH_BUBBLE_FIXED_GAP + b.h };
    }
    const goal = rect.top - view.top;
    if (b.fixedFrame !== frame) {
      b.fixedFrame = frame;
      b.fixedY = b.fixedY == null ? goal : b.fixedY + (goal - b.fixedY) * SPEECH_BUBBLE_FIXED_EASE;
      if (Math.abs(goal - b.fixedY) < 0.5) b.fixedY = goal;
    }
    const top = view.top + b.fixedY;
    b.rect = { left: rect.left, right: rect.right, top, bottom: top + b.h };
    b.tip = null;
    b.container.setPosition((rect.left + rect.right) / 2, top + b.h / 2);
    drawSpeechBubble(b, null);
    laid.push(b);
    // La suivante se range sous la place VISÉE (pas sous la place glissée).
    y = rect.bottom + SPEECH_BUBBLE_FIXED_GAP;
  }
  return laid.filter((b) => b.container.alpha > 0).map((b) => b.rect);
}

// Ancre de la bulle : haut visible du personnage, lissé UNE fois par image
// (les frames d'une anim n'ont pas toutes la même tête) -- les mises en page
// suivantes de la même image (caméra, cf. worldUiAddLayout) repartent de la
// même valeur au lieu de lisser une 2e fois.
function positionSpeechBubble(scene, b) {
  const a = speechBubbleAnchor(b.target);
  const tipY = a.top - SPEECH_BUBBLE_GAP;
  const frame = scene.game.loop.frame;
  if (b.tipFrame !== frame) {
    b.tipPrev = b.tipY;
    b.tipFrame = frame;
  }
  const prev = b.tipPrev;
  b.tipY = prev == null || Math.abs(tipY - prev) > 40 ? tipY : prev + (tipY - prev) * 0.25;
  b.layout = { ax: a.x, tipY: b.tipY, left: a.left, right: a.right };
}

function updateSpeechBubbles(scene) {
  const st = scene.__speechBubbles;
  if (!st) return;
  // Copie : terminer une bulle peut retirer son entrée ou lancer la suivante.
  for (const [target, slot] of [...st.byTarget]) {
    const b = slot.current;
    if (b && (!target.active || !b.container.active)) finishSpeechBubble(scene, target, slot, true);
  }
  layoutAllSpeechBubbles(scene, speechBubbleView(scene));
}

function finishSpeechBubble(scene, target, slot, instant = false) {
  const b = slot.current;
  if (!b || b.ending) return;
  b.ending = true;
  if (b.timer) b.timer.remove(false);
  const done = () => {
    if (b.container.active) b.container.destroy();
    if (slot.current === b) slot.current = null;
    b.resolve();
    const next = slot.queue.shift();
    if (next && target.active && scene.sys.isActive()) startSpeechBubble(scene, target, slot, next);
    else if (!slot.queue.length) {
      const st = scene.__speechBubbles;
      if (st && !slot.current) st.byTarget.delete(target);
    }
  };
  if (instant || !b.container.active) { done(); return; }
  // Fondu seul : la position est tenue à chaque image (dans l'écran).
  scene.tweens.add({ targets: b.container, alpha: 0, duration: SPEECH_BUBBLE_FADE_MS, onComplete: done });
}

function startSpeechBubble(scene, target, slot, req) {
  const b = buildSpeechBubble(scene, req.text, req.speaker);
  Object.assign(b, { target, resolve: req.resolve, tipY: null, shift: null, side: 0 });
  slot.current = b;
  // Toutes les bulles remises en page : la nouvelle prend d'emblée une place
  // libre à côté de ses voisines (cf. layoutSpeechBubble).
  updateSpeechBubbles(scene);
  b.container.setScale(0.85);
  scene.tweens.add({ targets: b.container, alpha: 1, scale: 1, duration: 140, ease: 'Back.Out' });
  b.timer = scene.time.delayedCall(req.ms, () => finishSpeechBubble(scene, target, slot));
}

function showSpeechBubble(scene, targetOrNpcId, text, { ms, who, replace = false } = {}) {
  if (!scene || !scene.sys || !text) return Promise.resolve();
  const target = speechBubbleTarget(scene, targetOrNpcId || who);
  const dur = ms || speechBubbleDuration(text);
  if (!target) {
    const id = who || (typeof targetOrNpcId === 'string' ? targetOrNpcId : '');
    const name = id && SPEAKERS[id] ? SPEAKERS[id].name : '';
    showToast(scene, name ? `${name} : ${text}` : text, dur);
    return storyWait(scene, dur);
  }
  const st = speechBubbleState(scene);
  let slot = st.byTarget.get(target);
  if (!slot) {
    slot = { current: null, queue: [] };
    st.byTarget.set(target, slot);
  }
  return new Promise((resolve) => {
    const req = { text: String(text), ms: dur, resolve, speaker: speechBubbleSpeaker(scene, target, who, targetOrNpcId) };
    if (replace) {
      for (const q of slot.queue) q.resolve();
      slot.queue = [req];
      if (slot.current) finishSpeechBubble(scene, target, slot, true);
      else startSpeechBubble(scene, target, slot, slot.queue.shift());
    } else if (slot.current) {
      slot.queue.push(req);
    } else {
      startSpeechBubble(scene, target, slot, req);
    }
  });
}

function clearSpeechBubbles(scene, targetOrNpcId = null) {
  const st = scene && scene.__speechBubbles;
  if (!st) return;
  const only = targetOrNpcId ? speechBubbleTarget(scene, targetOrNpcId) : null;
  for (const [target, slot] of [...st.byTarget]) {
    if (only && target !== only) continue;
    for (const q of slot.queue) q.resolve();
    slot.queue = [];
    finishSpeechBubble(scene, target, slot, true);
  }
}

// Carte de chapitre / nom de zone. Promesse résolue une fois disparue.
// Juice (même durée totale qu'avant : 500 ms d'entrée + `hold` + 600 ms de
// sortie, les cinématiques gardent leur rythme) : bande d'ombre douce, titre
// qui se pose en montant (léger zoom arrière ; pas d'espacement de lettres
// animé : avec un contour, Phaser décale le trait), filets qui se déploient
// depuis le centre, losange qui pivote, quelques étincelles, sous-titre décalé.
// Sous-titre sous l'ornement peint (qui descend jusqu'à ≈ y + 75).
const STORY_TITLE_ORNAMENT_SUB_Y = 84;

function showTitleCard(scene, title, sub, { hold = 1600 } = {}) {
  return new Promise((resolve) => {
    const { width } = scene.scale;
    const y = 225;
    const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(2200).setAlpha(0);
    c.lookRole = 'ui';
    const band = scene.add.graphics();
    const bandH = sub ? 150 : 120;
    band.fillGradientStyle(0x0d0b1a, 0x0d0b1a, 0x0d0b1a, 0x0d0b1a, 0, 0, 0.55, 0.55);
    band.fillRect(0, y - bandH / 2, width, bandH / 2);
    band.fillGradientStyle(0x0d0b1a, 0x0d0b1a, 0x0d0b1a, 0x0d0b1a, 0.55, 0.55, 0, 0);
    band.fillRect(0, y, width, bandH / 2 + (sub ? 30 : 0));
    const titleText = scene.add.text(width / 2, y + 8, title, {
      fontFamily: STORY_UI.serif, fontSize: '36px', color: '#ffe9f5', fontStyle: 'bold',
      stroke: '#15101f', strokeThickness: 6, padding: { x: 20, y: 16 },
    }).setOrigin(0.5);
    titleText.setShadow(0, 0, '#ff9fc9', 14, true, true);
    titleText.setScale(1.1);
    const half = Math.min(320, titleText.width / 2 + 40);
    // Lot n°8 : ornement peint `ui_ornement_titre` (372x110, lune et lianes)
    // à la place des filets et du losange, posé sous le titre sans le
    // toucher (origine en haut) et déployé depuis le centre comme les
    // filets ; le sous-titre descend d'autant. Sans l'art : filets + losange.
    const ornament = scene.textures.exists('item-ui_ornement_titre');
    const subY = ornament ? STORY_TITLE_ORNAMENT_SUB_Y : 52;
    const sparkY = ornament ? 32 : 30;
    if (ornament) {
      const s = Phaser.Math.Clamp((2 * half) / 372, 0.4, 0.5);
      const orn = scene.add.image(width / 2, y + 20, 'item-ui_ornement_titre').setOrigin(0.5, 0).setScale(0, s);
      c.add([band, orn, titleText]);
      scene.tweens.add({ targets: orn, scaleX: s, duration: 800, delay: 150, ease: 'Cubic.easeOut' });
    } else {
      const lineL = scene.add.graphics().setPosition(width / 2 - 12, y + 30);
      lineL.lineStyle(2, STORY_UI.vineLight, 0.8);
      lineL.lineBetween(-(half - 12), 0, 0, 0);
      const lineR = scene.add.graphics().setPosition(width / 2 + 12, y + 30);
      lineR.lineStyle(2, STORY_UI.vineLight, 0.8);
      lineR.lineBetween(0, 0, half - 12, 0);
      lineL.scaleX = 0;
      lineR.scaleX = 0;
      const gem = scene.add.graphics().setPosition(width / 2, y + 30);
      gem.fillStyle(STORY_UI.pink, 1);
      gem.fillTriangle(0, -7, 7, 0, 0, 7);
      gem.fillTriangle(0, -7, -7, 0, 0, 7);
      gem.setScale(0).setAngle(-90);
      c.add([band, lineL, lineR, gem, titleText]);
      scene.tweens.add({ targets: [lineL, lineR], scaleX: 1, duration: 800, delay: 150, ease: 'Cubic.easeOut' });
      scene.tweens.add({ targets: gem, scale: 1, angle: 0, duration: 520, delay: 250, ease: 'Back.Out' });
    }
    let subText = null;
    if (sub) {
      subText = scene.add.text(width / 2, y + subY + 6, sub, {
        fontFamily: STORY_UI.serif, fontSize: '17px', color: '#c9b8f0', fontStyle: 'italic',
        stroke: '#15101f', strokeThickness: 4,
      }).setOrigin(0.5).setAlpha(0);
      c.add(subText);
    }
    scene.tweens.add({ targets: c, alpha: 1, duration: 500, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: titleText, y, scale: 1, duration: 1000, ease: 'Cubic.easeOut' });
    if (subText) scene.tweens.add({ targets: subText, alpha: 1, y: y + subY, duration: 600, delay: 380, ease: 'Sine.easeOut' });
    scene.time.delayedCall(330, () => {
      if (c.active && typeof spawnFx === 'function') spawnFx(scene, 'uiStar', width / 2, y + sparkY, { count: 6, power: 0.8 });
    });
    if (typeof playSfx === 'function') playSfx('title_card', { title });
    scene.tweens.add({
      targets: c, alpha: 0, y: -6, duration: 600, delay: 500 + hold, ease: 'Sine.easeIn',
      onComplete: () => { c.destroy(); resolve(); },
    });
  });
}

// Barre de vie de boss (HUD, en bas au centre). `getRatio()` → 0..1, lue chaque frame.
// Lot n°8 (Q6 : barre agrandie) : cadre peint `ui_boss_cadre` en 3 morceaux
// (448x32 au lieu de 448x20 : la rainure peinte est fine), remplissage
// `ui_boss_remplissage` affiché dans la rainure (378x8, à 35 px du bord du
// cadre) et rogné par setCrop selon la vie ; le Graphics ne trace plus que la
// traînée claire. Sans les deux images : le dessin d'avant.
const BOSS_BAR_ART = { frameX: -4, frameY: -10, frameW: 448, scale: 0.5, grooveX: 31, grooveY: 2, grooveW: 378, grooveH: 8, labelY: -12 };

function showBossBar(scene, name, getRatio) {
  hideBossBar(scene);
  const w = 440;
  const x = (scene.scale.width - w) / 2;
  const y = scene.scale.height - 40;
  const A = BOSS_BAR_ART;
  const frame = scene.textures.exists('item-ui_boss_remplissage')
    ? addUiSliced(scene, 'ui_boss_cadre', x + A.frameX, y + A.frameY, A.frameW, null, { scale: storyUiScale('ui_boss_cadre', A.scale), scrollFactor: 0, depth: 1001.5 })
    : null;
  let fill = null;
  if (frame) {
    fill = scene.add.image(x + A.grooveX, y + A.grooveY, 'item-ui_boss_remplissage').setOrigin(0, 0)
      .setScrollFactor(0).setDepth(1002.5);
    fill.setDisplaySize(A.grooveW, A.grooveH);
  }
  const g = scene.add.graphics().setScrollFactor(0).setDepth(1002);
  // Rendu de cohésion (LookKit) : interface.
  g.lookRole = 'ui';
  if (fill) fill.lookRole = 'ui';
  if (frame) frame.lookRole = 'ui';
  const label = scene.add.text(scene.scale.width / 2, y + (frame ? A.labelY : -8), name, {
    fontFamily: STORY_UI.serif, fontSize: '16px', color: '#ffe9f5', fontStyle: 'bold',
    stroke: '#15101f', strokeThickness: 4,
  }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(1003);
  let shown = 1;
  const draw = () => {
    if (!g.active) return;
    let ratio = 1;
    try { ratio = Phaser.Math.Clamp(Number(getRatio()) || 0, 0, 1); } catch (e) { ratio = 0; }
    shown += (ratio - shown) * 0.15;
    g.clear();
    if (fill) {
      // Traînée (vie perdue qui se vide lentement) sous le remplissage.
      if (shown > ratio + 0.002) {
        g.fillStyle(0xffe9f5, 0.5);
        g.fillRect(x + A.grooveX, y + A.grooveY, A.grooveW * shown, A.grooveH);
      }
      fill.setVisible(ratio > 0);
      fill.setCrop(0, 0, fill.width * ratio, fill.height);
      return;
    }
    g.fillStyle(STORY_UI.woodDark, 1);
    g.fillRoundedRect(x - 4, y - 4, w + 8, 20, 6);
    g.fillStyle(0x2a1f45, 1);
    g.fillRoundedRect(x, y, w, 12, 4);
    g.fillStyle(0xffe9f5, 0.5);
    if (shown > ratio + 0.002) g.fillRoundedRect(x, y, w * shown, 12, 4);
    g.fillStyle(0x7bd35a, 1);
    if (ratio > 0) g.fillRoundedRect(x, y, w * ratio, 12, 4);
    g.lineStyle(1.5, STORY_UI.pink, 0.8);
    g.strokeRoundedRect(x, y, w, 12, 4);
  };
  draw();
  scene.events.on('update', draw);
  scene.__bossBar = { g, label, draw, frame, fill };
  return scene.__bossBar;
}

function hideBossBar(scene) {
  const bar = scene.__bossBar;
  if (!bar) return;
  scene.events.off('update', bar.draw);
  for (const o of [bar.g, bar.label, bar.frame, bar.fill]) if (o) o.destroy();
  scene.__bossBar = null;
}

// ---------------------------------------------------------------------------
// Gel du monde (dialogue, cinématique, menus)
// ---------------------------------------------------------------------------
const WORLD_FREEZING_SCENES = ['DialogueScene', 'InventoryScene', 'MapScene', 'CampfireMenuScene', 'PauseScene', 'ShopScene'];

function isWorldFrozen(scene) {
  if (!scene || !scene.scene) return false;
  if ((scene.__cutsceneLock || 0) > 0 || (scene.__storyFreeze || 0) > 0) return true;
  return WORLD_FREEZING_SCENES.some((k) => scene.scene.isActive(k));
}

// À la sortie d'un overlay : les appuis faits pendant le dialogue (Espace,
// E, clic) restent « JustDown » dans les Key du joueur et déclencheraient un
// saut / une nouvelle interaction à la frame suivante.
function releaseStoryInput(scene) {
  if (!scene || !scene.input || !scene.input.keyboard) return;
  scene.input.keyboard.resetKeys();
  if (scene.player) scene.player.attackPointerJustDown = false;
  scene.__storyTalkCooldownUntil = scene.time.now + 250;
}

function hideStoryPrompt(scene) {
  if (scene.__story && scene.__story.prompt) scene.__story.prompt.setVisible(false);
}

// ---------------------------------------------------------------------------
// Agarica au début d'un dialogue ou d'une cinématique (2026-11-08, retour
// utilisateur : « le personnage continue son animation actuelle (course,
// marche…) et parfois au milieu du vide »)
// ---------------------------------------------------------------------------
// Au premier gel « d'histoire » (dialogue, cinématique, verrou de boss) :
// actions coupées (course, sprint du loup, coup, ours), puis
//  - posée : pose de repos tout de suite (forme humaine, idle) ;
//  - en l'air : la physique (qui tourne pendant le gel) la fait retomber, en
//    pose de saut humaine, en gardant son élan horizontal ; la boîte de
//    dialogue attend qu'elle soit posée, STORY_SETTLE_MAX_MS au plus (elle
//    continue ensuite de tomber, jamais figée au-dessus du vide). Ligne de
//    chute franchie : chute dans le vide habituelle (fondu, point sûr, cœur),
//    la boîte s'ouvre après la reprise ;
//  - liane, eau : poses stables gardées (liane immobile, nage figée).
// Pose narrative de la cinématique (`storyPose`), joueur piloté
// (`__playerScripted` : playerMove, vol du crash, chute dans le vide), mort en
// cours ou corps immobilisé par un script (`body.moves`) : rien n'est touché.
// Les étapes d'une cinématique ne sont pas retardées ; seules ses répliques
// (`say`) attendent, comme les dialogues.
const STORY_SETTLE_MAX_MS = 1200;
// Posée après une chute : la boîte attend qu'elle tienne debout ce temps-là.
const STORY_SETTLE_STABLE_MS = 80;
// Posée puis appui perdu : pose de saut au-delà de cette chute (px).
const STORY_SETTLE_SLIP_PX = 10;
// Garde-fou absolu (chute dans le vide et son fondu compris).
const STORY_SETTLE_ABORT_MS = 6000;
// Invulnérabilité à la sortie d'un dialogue ou d'une cinématique (retour
// utilisateur : « elle peut se faire attaquer dès la sortie »), comptée à
// partir du dégel du monde, signalée comme après un coup (cf.
// Player.grantStoryInvulnerability). Les ennemis proches qui savent se calmer
// (`enemy.calm(ms)`, cf. SingeCorrompu) annulent aussi leur attaque en cours.
const STORY_EXIT_INVULN_MS = 1000;
const STORY_EXIT_CALM_RANGE = 320;
// Clignotement de cette invulnérabilité (vague 3, décision de l'utilisateur) :
// seulement si un ennemi est à moins de ~300 px (centre à centre). Sinon
// Agarica est protégée tout pareil, sans signal inutile à chaque dialogue.
const STORY_EXIT_BLINK_RANGE = 300;

// Gel posé par l'histoire (et non par un menu : inventaire, carte, pause, feu).
function isStoryFrozen(scene) {
  return (scene.__cutsceneLock || 0) > 0 || (scene.__storyFreeze || 0) > 0;
}

function storySettleSkipped(scene, p) {
  const st = scene.__story;
  return !p || !p.active || !p.body || typeof p.storyRestPose !== 'function'
    || scene.__playerScripted || p.fallingOut || !p.body.moves
    || p.hearts <= 0 || p.storyPose === 'death' || !!(st && (st.airDeath || st.fallOut));
}

// En l'air : ni posée (sol, plateforme, mousse), ni sur une liane, ni dans
// l'eau. Avant le premier pas de physique (cinématique lancée à la création de
// la zone), `blocked.down` est encore faux : appui sous les pieds testé.
function storyPlayerAirborne(scene, p) {
  if (p.vine || p.form === 'octopus' || p.body.allowGravity === false) return false;
  if (p.body.blocked.down || p.body.touching.down) return false;
  return !storySupportedAt(scene, p.x, p.y);
}

// Commence la mise au repos (une fois par épisode de gel). Renvoie la mise au
// repos en cours (`phase` : 'air', 'pose', 'chute', 'repos'), ou null si elle
// est sautée (joueur piloté, mort…) ou déjà finie pour ce gel.
function storyBeginSettle(scene) {
  const st = scene.__story;
  if (!st) return null;
  if (st.settle && !st.settle.over) return st.settle;
  if (st.settleEpisode) return null;
  st.settleEpisode = true;
  const p = scene.player;
  if (storySettleSkipped(scene, p)) return null;
  p.storyStopActions();
  const s = { start: scene.time.now, visit: scene.__storyVisit, phase: null, over: false, ready: false, waiters: [] };
  s.onShutdown = () => storySettleEnd(scene, s);
  scene.events.once('shutdown', s.onShutdown);
  st.settle = s;
  storySettleStep(scene, s);
  return s.over ? null : s;
}

// La boîte peut s'ouvrir (posée, ou délai écoulé).
function storySettleReady(s) {
  if (s.ready) return;
  s.ready = true;
  const w = s.waiters;
  s.waiters = [];
  w.forEach((resolve) => resolve());
}

function storySettleEnd(scene, s) {
  if (s.over) return;
  s.over = true;
  if (s.onShutdown) scene.events.off('shutdown', s.onShutdown);
  storySettleReady(s);
}

// Promesse résolue quand la boîte de dialogue peut s'ouvrir, ou null si rien
// n'est en attente.
function storySettleWait(scene) {
  const s = scene.__story && scene.__story.settle;
  if (!s || s.ready) return null;
  return new Promise((resolve) => s.waiters.push(resolve));
}

// Phases : 'air' (elle retombe), 'chute' (chute dans le vide en cours),
// 'pose' (compétence avec la forme), 'repos' (posée : la boîte peut s'ouvrir).
// En 'repos', on continue de veiller tant que le monde est gelé : si elle perd
// son appui (corps de repos moins large que celui du saut, posée au ras d'un
// bord), elle retombe en pose de saut puis reprend la pose de repos -- jamais
// l'idle en l'air.
function storySettleStep(scene, s) {
  if (s.over) return;
  const st = scene.__story;
  const p = scene.player;
  const now = scene.time.now;
  const age = now - s.start;
  if (s.visit !== scene.__storyVisit || !p || !p.active || !p.body) {
    storySettleEnd(scene, s);
    return;
  }
  if (age >= STORY_SETTLE_ABORT_MS) storySettleReady(s);
  // Chute dans le vide engagée pendant la mise au repos : sa reprise (fondu,
  // point sûr) se joue ; une fois debout au point de reprise, pose de repos.
  if (st.fallOut) {
    s.phase = 'chute';
    return;
  }
  if (s.phase === 'chute') {
    if (!scene.__playerScripted) p.storyRestPose();
    s.phase = 'repos';
    s.restSince = now;
    s.restY = p.y;
    return;
  }
  // La cinématique a pris la main sur le joueur (playerMove, script...).
  if (scene.__playerScripted || p.fallingOut || !p.body.moves || p.hearts <= 0) {
    storySettleEnd(scene, s);
    return;
  }
  // Compétence « avec la forme » (lancer de la pierre, nuée du papillon) :
  // purement visuelle et courte, elle va au bout (boss_ghilt la rejoue aussi
  // à son rythme pendant le soin de Ghil't), puis pose de repos.
  if (p.skillFormPose && !p.storyPose) {
    p.tickSkillFormPose(now);
    if (p.skillFormPose && p.drawSkillFormPose(now)) {
      s.phase = 'pose';
      return;
    }
    if (p.skillFormPose) p.endSkillFormPose(true);
  }
  if (storyPlayerAirborne(scene, p)) {
    // Appui perdu juste après la pose de repos (au ras d'une arête) : pose de
    // saut seulement une fois vraiment en chute. Sinon les corps du repos et
    // du saut (~1 px d'écart) se relaient sur l'arête : pose qui clignote.
    if (s.phase === 'repos' && p.y - s.restY < STORY_SETTLE_SLIP_PX) return;
    s.phase = 'air';
    p.storyAirPose();
    // Règle de chute de la zone : son crochet ne tourne pas pendant le gel.
    updateStoryFall(scene);
    if (st.fallOut) {
      s.phase = 'chute';
      return;
    }
    if (age >= STORY_SETTLE_MAX_MS) storySettleReady(s);
    return;
  }
  if (s.phase !== 'repos') {
    p.storyRestPose();
    // Posée après une chute : la boîte attend qu'elle tienne (corps de repos
    // posé) ; déjà au sol au début du gel : tout de suite.
    s.restSince = s.phase ? now : -Infinity;
    s.restY = p.y;
    s.phase = 'repos';
  }
  if (now - s.restSince >= STORY_SETTLE_STABLE_MS) storySettleReady(s);
}

// Chaque image de gel (updateLevelFromData) : mise au repos commencée par un
// gel de script (verrou de boss…) ou poursuivie. Renvoie vrai tant
// qu'Agarica retombe (freezeWorldBodies lui laisse alors son élan horizontal).
function storyFrozenTick(scene) {
  const st = scene.__story;
  if (!st || !scene.player) return false;
  if (!isStoryFrozen(scene)) {
    st.settleEpisode = false;
    return false;
  }
  if (!st.settleEpisode) storyBeginSettle(scene);
  const s = st.settle;
  if (!s || s.over) return false;
  storySettleStep(scene, s);
  return !s.over && s.phase === 'air';
}

// Première image sans gel : fin de l'épisode ; invulnérabilité de sortie
// minutée (armée par la fin du dialogue / de la cinématique).
function storyUnfrozenTick(scene) {
  const st = scene.__story;
  if (st) {
    st.settleEpisode = false;
    if (st.settle && !st.settle.over) storySettleEnd(scene, st.settle);
  }
  const p = scene.player;
  if (!p || !p.storyInvulnPending || typeof p.grantStoryInvulnerability !== 'function') return;
  p.grantStoryInvulnerability(STORY_EXIT_INVULN_MS, { blink: storyThreatNear(scene, p, STORY_EXIT_BLINK_RANGE) });
  if (!scene.enemies) return;
  scene.enemies.getChildren().forEach((e) => {
    if (!e || !e.active || e.defeated || typeof e.calm !== 'function') return;
    if (Math.abs(e.x - p.x) > STORY_EXIT_CALM_RANGE || Math.abs(e.y - p.y) > STORY_EXIT_CALM_RANGE) return;
    e.calm(STORY_EXIT_INVULN_MS);
  });
}

// Un ennemi encore dangereux à moins de `range` px d'Agarica (centre à
// centre) ? Ennemis du groupe (boss compris : Ghil't y est), Kainati (hors
// groupe, sauf calmé ou vaincu). Les soignés, vaincus et inoffensifs ne
// comptent pas (le crapaud-piège, `harmless` mais à langue, compte).
function storyThreatNear(scene, p, range) {
  const cx = p.x;
  const cy = p.y - 40;
  const near = (o) => {
    if (!o || !o.active) return false;
    const c = typeof o.getCenter === 'function' ? o.getCenter() : o;
    return Phaser.Math.Distance.Between(cx, cy, c.x, c.y) <= range;
  };
  if (scene.enemies) {
    const list = scene.enemies.getChildren();
    for (const e of list) {
      if (!e || e.defeated || e.healed) continue;
      if (e.harmless && typeof e.calm !== 'function' && !e.corrupted) continue;
      if (near(e)) return true;
    }
  }
  const k = scene.kainati;
  return !!(k && !k.defeated && !k.calm && near(k));
}

// Fin d'un dialogue ou d'une cinématique : Agarica est protégée dès
// maintenant (même image) ; la durée court à partir du dégel.
function storyArmExitInvulnerability(scene) {
  const p = scene && scene.player;
  if (p && p.active && typeof p.grantStoryInvulnerability === 'function') p.storyInvulnPending = true;
}

// ---------------------------------------------------------------------------
// Dialogues
// ---------------------------------------------------------------------------
// `portrait` (optionnel) : id du portrait Codex `item-portrait_<id>` s'il
// diffère de la clé ; `portraitTint` : teinte appliquée (esprit de Kainati).
const SPEAKERS = {
  agarica: { name: 'Agarica', color: 0xff9fc9 },
  xara: { name: 'Xara', color: 0xc77dff },
  amanite: { name: 'Amanite', color: 0xe0464f },
  pere_chef: { name: 'Le Chef', color: 0x8fe3b8, initial: 'C' },
  geralt: { name: 'Geralt', color: 0xd9a441 },
  clak: { name: 'Clak', color: 0xff7f50 },
  morgat: { name: 'Morgat', color: 0x9ad1ff },
  // Épargné (`kainatiDefeated`) : portrait aux yeux calmes, sans la lueur
  // verte de la corruption (retour du 2026-11-09, cf. storySpeakerPortraitId).
  kainati: { name: 'Kainati', color: 0xc08a4a, portraitByFlag: { kainatiDefeated: 'kainati_calme' } },
  kainati_esprit: { name: 'Esprit de Kainati', color: 0x7fffd4, portrait: 'kainati', portraitTint: 0x9ffff0 },
  ghilt: { name: "Ghil't", color: 0x7bd35a },
  habitant: { name: 'Habitant', color: 0xa99bd6 },
  garde: { name: 'Garde', color: 0x8a8fb5 },
  // Vague 3 : marchand des Éclats de lune (PNJ `shop`, cf. SHOPS).
  marchand: { name: 'Marchand', color: 0xd9c27a },
  narrateur: { name: '', color: 0xe8d9ff },
};

// Portrait d'un personnage (id de la texture `item-portrait_<id>`) : celui de
// la réplique (`line.portrait`), sinon le premier `portraitByFlag` dont le
// drapeau est vrai, sinon `portrait` de SPEAKERS, sinon sa clé. Utilisé par la
// boîte de dialogue et les bulles.
function storySpeakerPortraitId(who, line = null) {
  if (line && line.portrait) return line.portrait;
  const sp = SPEAKERS[who] || {};
  if (sp.portraitByFlag) {
    for (const [flag, id] of Object.entries(sp.portraitByFlag)) if (storyGet(flag)) return id;
  }
  return sp.portrait || who;
}

// Normalise `linesOrId` (id de DIALOGUES, tableau, fonction, chaîne seule).
function resolveDialogueLines(scene, linesOrId) {
  let lines = linesOrId;
  if (typeof lines === 'string') {
    if (DIALOGUES[lines] !== undefined) lines = DIALOGUES[lines];
    else return [{ who: 'narrateur', text: lines }];
  }
  if (typeof lines === 'function') lines = lines(scene);
  if (!Array.isArray(lines)) lines = lines ? [lines] : [];
  return lines.map((l) => (typeof l === 'string' ? { who: 'narrateur', text: l } : l));
}

// Poses narratives d'Agarica (manifest `agarica_extra` : talk, sad, cast,
// receive_item, death…). Sans art, ne fait rien (comportement historique).
// Le monde est gelé pendant dialogues/cinématiques (Player.update ne tourne
// plus) : la pose est donc appliquée directement, et Player.update la
// respecte tant que `player.storyPose` est posé.
function setPlayerStoryPose(scene, anim) {
  const p = scene && scene.player;
  if (!p || !p.active || p.form !== 'agarica' || typeof p.applyAgaricaExtraPose !== 'function') return;
  if (anim && hasManifestArt(scene, 'agarica_extra', anim)) {
    p.storyPose = anim;
    p.applyAgaricaExtraPose(anim);
  } else if (!anim && p.storyPose) {
    p.storyPose = null;
    // Retour à l'idle historique (feuille face à GAUCHE → flip quand on regarde à droite).
    if (scene.anims.exists(ANIM_IDLE_KEY)) p.anims.play(ANIM_IDLE_KEY, true);
    p.applyBodyForScale(FORMS.agarica.scale, FORMS.agarica.body);
    p.setFlipX(p.facingDir > 0);
  }
}

// Appelée par DialogueScene à chaque réplique : `line.pose` explicite, sinon
// Agarica prend la pose `talk` quand c'est elle qui parle (sauf pose tenue
// par la cinématique, ex. `sad`).
function storyDialogueLinePose(scene, line) {
  const p = scene && scene.player;
  if (!p || !line) return;
  storyStageDialogueLine(scene, line);
  storySpeakerTalkAnim(scene, line);
  if (line.pose !== undefined) setPlayerStoryPose(scene, line.pose);
  else if (line.who === 'agarica' && (!p.storyPose || p.storyPose === 'talk')) setPlayerStoryPose(scene, 'talk');
  else if (p.storyPose === 'talk') setPlayerStoryPose(scene, null);
}

// PNJ qui parle (agent Histoire, 2026-10-06) : pendant la réplique d'un PNJ
// (`line.who` = clé de scene.npcs, ou id de manifest du PNJ, ou `line.npc`),
// il passe de `idle` à son anim `talk` du manifest, puis revient à `idle` dès
// qu'un autre parle. Une anim posée par la cinématique (brew, run_idol, talk
// explicite…) n'est jamais écrasée : seul l'idle est remplacé. Xara compagnon
// (scene.xara, monde gelé pendant le dialogue) joue `xara_extra.talk`.
function storyFindSpeakerNpc(scene, line) {
  const npcs = scene.npcs || {};
  const key = line.npc || line.who;
  if (!key) return null;
  if (npcs[key] && npcs[key].active) return npcs[key];
  return Object.values(npcs).find((n) => n && n.active && n.manifestId === key) || null;
}

// Pose de repos d'un PNJ : `idle` du manifest, sinon (Xara : talk/excited/
// mysterious seulement) la 1re frame de `talk`, figée.
function storyNpcRest(npc) {
  if (!npc || !npc.active || !npc.playManifest) return;
  const def = getAssetManifest()[npc.manifestId] || {};
  npc.__restPaused = false;
  if (def.anims && def.anims.idle) { npc.playManifest('idle'); return; }
  if (def.anims && def.anims.talk && hasManifestArt(npc.scene, npc.manifestId, 'talk')) {
    npc.playManifest('talk', false);
    npc.anims.pause();
    npc.__restPaused = true;
  }
}

function storyStopSpeakerTalk(scene, except) {
  for (const n of Object.values(scene.npcs || {})) {
    if (n && n !== except && n.__autoTalk) {
      const anim = n.__autoTalkAnim || 'talk';
      n.__autoTalk = false;
      n.__autoTalkAnim = null;
      if (n.active && n.currentManifestAnim === anim) storyNpcRest(n);
    }
  }
  const x = scene.xara;
  if (x && x !== except && x.__autoTalk) {
    x.__autoTalk = false;
    x.__autoTalkAnim = null;
    if (x.__talkSprite) { x.__talkSprite.destroy(); x.__talkSprite = null; }
    if (x.active) x.setVisible(true);
  }
}

// Anim jouée pendant une réplique : `talk`, ou l'humeur de la réplique
// (champ `mood`, contrat §3.3 du lot n°8 : `{ who: 'xara', mood: 'excited' }`
// joue `xara_extra.excited`, Xara qui sautille de joie) si l'art la contient.
function storySpeakerAnimFor(scene, id, line) {
  const mood = line && line.mood;
  if (mood && mood !== 'talk' && hasManifestArt(scene, id, mood)) return mood;
  return hasManifestArt(scene, id, 'talk') ? 'talk' : null;
}

function storySpeakerTalkAnim(scene, line) {
  if (!scene) return;
  const npc = line && line.who !== 'agarica' && line.who !== 'narrateur' ? storyFindSpeakerNpc(scene, line) : null;
  const companion = !npc && line && line.who === 'xara' && scene.xara && scene.xara.active ? scene.xara : null;
  storyStopSpeakerTalk(scene, npc || companion);
  const npcAnim = npc && npc.playManifest ? storySpeakerAnimFor(scene, npc.manifestId, line) : null;
  if (npcAnim && (!npc.currentManifestAnim || npc.currentManifestAnim === 'idle' || npc.__restPaused
    || (npc.__autoTalk && npc.currentManifestAnim === npc.__autoTalkAnim))) {
    // (Même PNJ, réplique suivante : il peut changer d'humeur.)
    npc.__restPaused = false;
    npc.playManifest(npcAnim, npc.currentManifestAnim === npcAnim);
    npc.__autoTalk = true;
    npc.__autoTalkAnim = npcAnim;
    return;
  }
  const xAnim = companion ? storySpeakerAnimFor(scene, 'xara_extra', line) : null;
  if (!xAnim) return;
  if (companion.__autoTalk && companion.__autoTalkAnim === xAnim && companion.__talkSprite) return;
  if (companion.__talkSprite) { companion.__talkSprite.destroy(); companion.__talkSprite = null; }
  // Sprite de parole posé PAR-DESSUS le compagnon (caché le temps de la
  // réplique) : changer la texture/l'échelle du compagnon lui-même modifiait
  // son corps physique, qui s'enfonçait dans le sol et la faisait tomber.
  const t = addManifestSprite(scene, companion.x, companion.y, 'xara_extra', xAnim);
  t.setFlipX(companion.flipX).setDepth(companion.depth).setRotation(companion.rotation);
  if (scene.children.moveAbove) scene.children.moveAbove(t, companion);
  companion.__talkSprite = t;
  companion.setVisible(false);
  companion.__autoTalk = true;
  companion.__autoTalkAnim = xAnim;
}

// PNJ pendant un dialogue (retour des joueuses du 2026-11-09 : « Amanite court
// sur place pendant qu'on parle »). À chaque réplique de la boîte :
// - un PNJ immobile qui jouait une anim de déplacement (`walk`, `run`,
//   `run_idol`, `walk_angry`… cf. STORY_NPC_LOCO_RE) passe au repos : son
//   `idle`, ou une image figée de la même anim (STORY_NPC_LOCO_HOLD : Amanite
//   qui serre l'idole volée). L'anim est retenue (`__locoAnim`) pour le
//   prochain `npcMove`, qui la rejoue en marchant ;
// - celui qui parle se tourne vers son interlocuteur (Agarica, ou `line.to` :
//   clé d'un PNJ) ; les autres PNJ à moins de STORY_DIALOGUE_STAGE_RANGE se
//   tournent vers celui qui parle (Agarica, Xara ou un PNJ) ;
// - Xara compagnon (monde gelé, elle marchait sur place) s'arrête.
// Laissés tels quels : un PNJ que la cinématique déplace (`__scripted`, tween),
// un PNJ dont elle a fixé le sens (`npcFace` gauche/droite : `__faceLocked`,
// jusqu'à la fin de la cinématique), un PNJ `lookAtPlayer: false` qui ne parle
// pas (il regarde ailleurs exprès), un sprite `noDialogueStage` (boss).
const STORY_NPC_LOCO_RE = /(^|_)(walk|run)(_|$)/;
const STORY_NPC_LOCO_HOLD = { run_idol: 4 };
const STORY_DIALOGUE_STAGE_RANGE = 480;

function storyNpcIsMoving(npc) {
  return !!npc.__scripted || !!(npc.scene && npc.scene.tweens && npc.scene.tweens.isTweening(npc));
}

function storyNpcRestFromLoco(npc) {
  const anim = npc.currentManifestAnim;
  if (!anim || npc.__holdPose || !STORY_NPC_LOCO_RE.test(anim) || !npc.anims || !npc.anims.currentAnim) return;
  if (!npc.anims.isPlaying && !npc.anims.isPaused) return;
  npc.__locoAnim = anim;
  const hold = STORY_NPC_LOCO_HOLD[anim];
  const frames = npc.anims.currentAnim.frames;
  if (hold != null && frames && frames.length) {
    npc.anims.pause(frames[Math.min(hold, frames.length - 1)]);
    npc.__holdPose = anim;
    return;
  }
  storyNpcRest(npc);
  // Pas d'idle dans le manifeste : la 1re image de l'anim, figée.
  if (npc.currentManifestAnim === anim && npc.anims.isPlaying) {
    npc.anims.pause(frames[0]);
    npc.__holdPose = anim;
  }
}

function storyStageDialogueLine(scene, line) {
  if (!scene || !line || !scene.npcs) return;
  const p = scene.player;
  const speaker = line.who && line.who !== 'agarica' && line.who !== 'narrateur' ? storyFindSpeakerNpc(scene, line) : null;
  const companion = scene.xara && scene.xara.active ? scene.xara : null;
  let talker = speaker;
  if (!talker && line.who === 'agarica') talker = p;
  if (!talker && line.who === 'xara') talker = companion;
  let listener = p;
  if (line.to && line.to !== 'agarica' && scene.npcs[line.to] && scene.npcs[line.to].active) listener = scene.npcs[line.to];
  for (const npc of Object.values(scene.npcs)) {
    if (!npc || !npc.active || !npc.playManifest || npc.noDialogueStage || storyNpcIsMoving(npc)) continue;
    storyNpcRestFromLoco(npc);
    if (npc.__faceLocked) continue;
    let look = null;
    if (npc === speaker) look = listener;
    else if (npc.lookAtPlayer !== false && talker && talker !== npc && Math.abs(talker.x - npc.x) < STORY_DIALOGUE_STAGE_RANGE) look = talker;
    if (look && look !== npc && Math.abs(look.x - npc.x) > 4) setNpcFacing(npc, look.x >= npc.x ? 1 : -1);
  }
  const walkKey = typeof ANIM_XARA_WALK_KEY !== 'undefined' ? ANIM_XARA_WALK_KEY : 'xara-walk';
  if (companion && companion.anims && companion.anims.isPlaying && companion.anims.currentAnim
    && companion.anims.currentAnim.key === walkKey) {
    companion.anims.stop();
    const first = typeof XARA_WALK_FRAME_INDICES !== 'undefined' ? XARA_WALK_FRAME_INDICES[0] : 0;
    if (scene.textures.exists(`xara-walk-${first}`)) companion.setTexture(`xara-walk-${first}`);
  }
}

let storyDialogueChain = Promise.resolve();

// Promesse résolue à la fin avec `{ lastChoice, choices }` (indices des choix faits).
// Répliques `bubble: true` (sans choix) : bulle au-dessus de qui parle (cf.
// showSpeechBubble), sans geler le monde ni attendre ; les autres passent
// dans la boîte comme avant, dans l'ordre. Un dialogue à choix (indices
// `goto`) reste entièrement dans la boîte.
function showDialogue(scene, linesOrId) {
  if (typeof linesOrId === 'string' && DIALOGUES[linesOrId] === undefined && /^[a-z0-9_]+$/.test(linesOrId)) {
    console.warn(`showDialogue : dialogue "${linesOrId}" introuvable dans DIALOGUES.`);
    return Promise.resolve({ lastChoice: -1, choices: [] });
  }
  const lines = resolveDialogueLines(scene, linesOrId);
  if (lines.length === 0) return Promise.resolve({ lastChoice: -1, choices: [] });
  if (lines.some((l) => l.bubble) && !lines.some((l) => l.choices)) {
    return (async () => {
      let result = { lastChoice: -1, choices: [] };
      let box = [];
      for (const l of lines) {
        if (!l.bubble) { box.push(l); continue; }
        if (box.length) { result = await showDialogueBox(scene, box); box = []; }
        showSpeechBubble(scene, l.npc || l.who, l.text, { who: l.who, ms: l.ms });
      }
      if (box.length) result = await showDialogueBox(scene, box);
      return result;
    })();
  }
  return showDialogueBox(scene, lines);
}

// Boîte de dialogue (DialogueScene), monde gelé : `lines` déjà normalisées.
function showDialogueBox(scene, lines) {
  scene.__storyFreeze = (scene.__storyFreeze || 0) + 1;
  hideStoryPrompt(scene);
  // Agarica s'arrête et prend une pose stable ; en l'air, elle finit sa chute
  // (élan horizontal gardé) avant que la boîte ne s'ouvre (cf. storyBeginSettle).
  const settle = storyBeginSettle(scene);
  if (scene.player && scene.player.body && !(settle && settle.phase === 'air')) scene.player.setVelocityX(0);
  const visit = scene.__storyVisit;
  const open = () => new Promise((resolve) => {
    scene.scene.launch('DialogueScene', {
      lines,
      parentKey: scene.scene.key,
      onDone: (result) => {
        if (scene.player && scene.player.storyPose === 'talk') setPlayerStoryPose(scene, null);
        storyStopSpeakerTalk(scene, null);
        scene.__storyFreeze = Math.max(0, (scene.__storyFreeze || 0) - 1);
        releaseStoryInput(scene);
        storyArmExitInvulnerability(scene);
        resolve(result);
      },
    });
    scene.scene.bringToTop('DialogueScene');
  });
  const run = () => {
    const wait = storySettleWait(scene);
    if (!wait) return open();
    // Zone quittée pendant la mise au repos : plus de boîte à ouvrir ici (le
    // gel de cette visite est rendu, la visite suivante repart de zéro).
    return wait.then(() => {
      const st = scene.sys && scene.sys.settings.status;
      if (scene.__storyVisit === visit && st >= Phaser.Scenes.CREATING && st <= Phaser.Scenes.SLEEPING) return open();
      if (scene.__storyVisit === visit) scene.__storyFreeze = Math.max(0, (scene.__storyFreeze || 0) - 1);
      return { lastChoice: -1, choices: [], interrupted: true };
    });
  };
  const p = storyDialogueChain.then(run);
  storyDialogueChain = p.catch(() => {});
  return p;
}

// ---------------------------------------------------------------------------
// Cinématiques
// ---------------------------------------------------------------------------
function storyWait(scene, ms) {
  return new Promise((resolve) => scene.time.delayedCall(Math.max(0, ms || 0), resolve));
}

// Une cinématique s'arrête si la scène est quittée (ou revisitée) en cours de route.
function cutsceneAlive(scene, visit) {
  const st = scene.sys && scene.sys.settings.status;
  return st >= Phaser.Scenes.CREATING && st <= Phaser.Scenes.SLEEPING
    && !scene.__transitioningAway && scene.__storyVisit === visit;
}

const CUTSCENE_STOP = Symbol('cutscene-stop');

function resolveCutsceneSteps(scene, idOrSteps) {
  let steps = idOrSteps;
  if (typeof steps === 'string') {
    if (!CUTSCENES[steps]) {
      console.warn(`runCutscene : cinématique "${steps}" introuvable dans CUTSCENES.`);
      return [];
    }
    steps = CUTSCENES[steps];
  }
  if (typeof steps === 'function') steps = steps(scene);
  if (!Array.isArray(steps)) steps = steps ? [steps] : [];
  return steps;
}

// Étapes qui ne bloquent rien : une cinématique faite uniquement de bulles
// ne pose pas __cutsceneLock (le monde continue, le joueur garde la main).
// `questStep` (vague 3) : une avancée de quête (toast) ne gèle rien non plus.
const CUTSCENE_NON_BLOCKING_STEPS = ['bubble', 'questStep'];
function isNonBlockingCutsceneStep(step) {
  return !!step && typeof step === 'object' && Object.keys(step).length === 1
    && CUTSCENE_NON_BLOCKING_STEPS.includes(Object.keys(step)[0]);
}

function runCutscene(scene, idOrSteps) {
  const steps = resolveCutsceneSteps(scene, idOrSteps);
  if (steps.length === 0) return Promise.resolve();
  const visit = scene.__storyVisit;
  if (steps.every(isNonBlockingCutsceneStep)) {
    for (const step of steps) runCutsceneStep(scene, step, visit);
    return Promise.resolve();
  }
  scene.__cutsceneLock = (scene.__cutsceneLock || 0) + 1;
  hideStoryPrompt(scene);
  // Pose stable, chute finie (cf. storyBeginSettle) : les étapes ne sont pas
  // retardées, seules les répliques attendent qu'Agarica soit posée.
  const settle = storyBeginSettle(scene);
  if (scene.player && scene.player.body && !(settle && settle.phase === 'air')) scene.player.setVelocityX(0);
  const finish = () => {
    if (scene.__storyVisit !== visit) return;
    scene.__cutsceneLock = Math.max(0, (scene.__cutsceneLock || 0) - 1);
    storyArmExitInvulnerability(scene);
    if (scene.__cutsceneLock === 0) {
      scene.__playerScripted = false;
      setPlayerStoryPose(scene, null);
      for (const n of Object.values(scene.npcs || {})) if (n) n.__faceLocked = false;
      // Caméra déplacée par la cinématique et jamais rendue : on la rend.
      if (scene.__cameraDetached && scene.player && scene.player.active) storyCameraFollow(scene);
      releaseStoryInput(scene);
    }
  };
  return runCutsceneSteps(scene, steps, visit)
    .catch((e) => console.error('runCutscene :', e))
    .finally(finish);
}

async function runCutsceneSteps(scene, steps, visit) {
  for (const step of steps) {
    if (!cutsceneAlive(scene, visit)) return CUTSCENE_STOP;
    const r = await runCutsceneStep(scene, step, visit);
    if (r === CUTSCENE_STOP) return CUTSCENE_STOP;
  }
  return null;
}

function storyNpc(scene, key) {
  const npc = scene.npcs && scene.npcs[key];
  if (!npc) console.warn(`Cinématique : PNJ "${key}" absent de scene.npcs.`);
  return npc;
}

function storyCameraFollow(scene) {
  const cam = scene.cameras.main;
  scene.__cameraDetached = false;
  // Caméra de la zone (zone morte verticale, cf. cameraFollowPlayer, LevelKit).
  if (typeof cameraFollowPlayer === 'function') cameraFollowPlayer(scene);
  else cam.startFollow(scene.player, true, 1, 1);
}

// Saut d'une marche par le joueur piloté (gravité 1300 : ~90 px de haut, de
// quoi passer une case de 64 px avec la hitbox aux 3/4 des tuiles d'herbe).
const STORY_PLAYER_HOP_VY = -480;

// Déplace le joueur jusqu'à `toX` (joueur piloté : player.update() est gelé).
// Corps physique : il suit déjà le sol (gravité + collisions) ; contre une
// marche, il ne pourrait que pousser le mur jusqu'au délai de sécurité -- il
// saute donc par-dessus, comme le ferait le joueur.
function cutscenePlayerMove(scene, { toX, speed = 170 }) {
  const player = scene.player;
  if (!player || !player.body) return Promise.resolve();
  return new Promise((resolve) => {
    const dir = toX >= player.x ? 1 : -1;
    const timeoutAt = scene.time.now + (Math.abs(toX - player.x) / speed) * 1000 + 2500;
    scene.__playerScripted = true;
    player.facingDir = dir;
    storyFacePlayer(player, dir);
    if (player.form === 'agarica' && scene.anims.exists(ANIM_WALK_KEY)) player.anims.play(ANIM_WALK_KEY, true);
    const tick = () => {
      if (!player.active || !player.body) { scene.events.off('update', tick); resolve(); return; }
      const done = dir > 0 ? player.x >= toX - 3 : player.x <= toX + 3;
      if (done || scene.time.now > timeoutAt) {
        scene.events.off('update', tick);
        player.setVelocityX(0);
        if (player.form === 'agarica' && scene.anims.exists(ANIM_IDLE_KEY)) player.anims.play(ANIM_IDLE_KEY, true);
        scene.__playerScripted = false;
        resolve();
        return;
      }
      player.setVelocityX(dir * speed);
      const body = player.body;
      if (body.blocked.down && (dir > 0 ? body.blocked.right : body.blocked.left)) player.setVelocityY(STORY_PLAYER_HOP_VY);
    };
    scene.events.on('update', tick);
  });
}

// ---------------------------------------------------------------------------
// Suivi du sol des sprites SANS physique (PNJ en cinématique, animaux) : à
// chaque frame d'un déplacement horizontal, les pieds (y, origine en bas)
// reviennent sur la surface de marche sous eux, au lieu de garder le y de
// départ (ils flottaient au-dessus des creux et s'enfonçaient dans les
// marches). Une marche montante est gravie dès que l'avant des pieds la
// touche, une descendante dès que le centre la dépasse, à vitesse bornée :
// une case se franchit en ~0,1 s, en douceur plutôt que d'un coup.
// ---------------------------------------------------------------------------
const STORY_FOOT_REACH = 18; // px devant le centre des pieds, dans le sens de la marche
const STORY_MAX_STEP = 72; // marche la plus haute qu'un marcheur gravit (~1 case)
const STORY_STEP_SPEED_MIN = 480; // px/s

// Surface où poser les pieds d'un marcheur en `x` dont les pieds sont à
// `footY` : la plus haute à portée de pas (une plateforme bien plus haute est
// une autre couche, ignorée), sous le centre et l'avant des pieds. Null
// au-dessus du vide.
function storyWalkSurfaceY(scene, x, footY, dir = 0) {
  let best = null;
  for (const sx of dir ? [x, x + dir * STORY_FOOT_REACH] : [x]) {
    for (const t of openGroundTilesAt(scene, sx)) {
      const top = t.body ? t.body.top : t.y - t.displayHeight / 2;
      if (top < footY - STORY_MAX_STEP) continue;
      if (best === null || top < best) best = top;
    }
  }
  return best;
}

// Ramène les pieds de `obj` (y + footOffset) vers la surface, d'au plus une
// vitesse de marche par frame. `dt` en secondes, `dir` = sens de la marche
// (-1, 0, 1), `speed` = vitesse horizontale (px/s). Au-dessus du vide (hors
// du niveau) : y inchangé.
function storyFollowGround(scene, obj, dt, { dir = 0, speed = 120, footOffset = 0, snap = false } = {}) {
  const feet = obj.y + footOffset;
  const target = storyWalkSurfaceY(scene, obj.x, feet, dir);
  if (target == null) return;
  const step = snap ? Infinity : Math.max(STORY_STEP_SPEED_MIN, 4 * speed) * dt;
  obj.y += Phaser.Math.Clamp(target - feet, -step, step);
}

// Durée de la dernière frame (s), bornée : un onglet en arrière-plan ne doit
// pas téléporter un marcheur.
function storyFrameDt(scene) {
  return Math.min(scene.game.loop.delta || 16, 50) / 1000;
}

// Le sprite humain regarde à GAUCHE par défaut (cf. Player.update).
function storyFacePlayer(player, dir) {
  player.facingDir = dir;
  const facesRight = player.form === 'wolf' || player.form === 'eagle';
  player.setFlipX(facesRight ? dir < 0 : dir > 0);
}

// Les sprites du manifest regardent à droite (facing: "right").
function setNpcFacing(npc, dir) {
  const def = getAssetManifest()[npc.manifestId] || {};
  const facesRight = def.facing !== 'left';
  npc.facingDir = dir;
  // Placeholder : jamais retourné, son étiquette deviendrait illisible.
  if (!hasManifestArt(npc.scene, npc.manifestId)) {
    npc.setFlipX(false);
    return;
  }
  npc.setFlipX(facesRight ? dir < 0 : dir > 0);
}

function cutsceneNpcMove(scene, { npc: key, toX, speed = 120 }) {
  const npc = storyNpc(scene, key);
  if (!npc) return Promise.resolve();
  return new Promise((resolve) => {
    const dx = toX - npc.x;
    if (Math.abs(dx) < 1) { resolve(); return; }
    npc.__scripted = true;
    setNpcFacing(npc, dx > 0 ? 1 : -1);
    const def = getAssetManifest()[npc.manifestId] || {};
    // Anim de marche : `walk`/`run` du manifeste, sinon l'anim de déplacement
    // posée par la cinématique (en cours, ou mise au repos pendant un
    // dialogue, cf. storyStageDialogueLine : `run_idol`, `walk_angry`…).
    const cur = npc.currentManifestAnim;
    const walkAnim = ['walk', 'run'].find((a) => def.anims && def.anims[a])
      || (cur && STORY_NPC_LOCO_RE.test(cur) ? cur : null) || npc.__locoAnim || null;
    npc.__locoAnim = null;
    const before = cur || 'idle';
    if (walkAnim) npc.playManifest(walkAnim);
    const dir = dx > 0 ? 1 : -1;
    scene.tweens.add({
      targets: npc, x: toX, duration: (Math.abs(dx) / speed) * 1000,
      // Les pieds suivent le relief (cf. storyFollowGround).
      onUpdate: () => storyFollowGround(scene, npc, storyFrameDt(scene), { dir, speed }),
      onComplete: () => {
        if (npc.active) storyFollowGround(scene, npc, 0, { snap: true });
        if (walkAnim && npc.active) npc.playManifest(before === walkAnim ? 'idle' : before);
        npc.__scripted = false;
        resolve();
      },
    });
  });
}

const CUTSCENE_STEP_HANDLERS = {
  say: (scene, v) => showDialogue(scene, v),
  wait: (scene, ms) => storyWait(scene, ms),
  fadeOut: (scene, ms) => {
    scene.cameras.main.fadeOut(ms || 400, ...FADE_COLOR);
    return storyWait(scene, (ms || 400) + 20);
  },
  fadeIn: (scene, ms) => {
    scene.cameras.main.fadeIn(ms || 400, ...FADE_COLOR);
    return storyWait(scene, ms || 400);
  },
  title: (scene, v, step) => (typeof v === 'object'
    ? showTitleCard(scene, v.title || v.text, v.sub, v)
    : showTitleCard(scene, v, step.sub)),
  toast: (scene, v) => { showToast(scene, typeof v === 'object' ? v.text : v, v.ms); },
  // Bulle de parole : n'attend PAS (la cinématique continue aussitôt).
  bubble: (scene, v) => {
    const b = typeof v === 'string' ? { who: 'xara', text: v } : v;
    showSpeechBubble(scene, b.npc || b.who, b.text, { who: b.who, ms: b.ms, replace: b.replace });
  },
  npcMove: (scene, v) => cutsceneNpcMove(scene, v),
  npcAnim: (scene, { npc: key, anim }) => {
    const npc = storyNpc(scene, key);
    if (npc) npc.playManifest(anim, false);
  },
  npcFace: (scene, { npc: key, dir }) => {
    const npc = storyNpc(scene, key);
    if (!npc) return;
    if (dir === 'player' && scene.player) setNpcFacing(npc, scene.player.x >= npc.x ? 1 : -1);
    else setNpcFacing(npc, dir === 'left' ? -1 : 1);
    // Sens choisi par la cinématique : gardé pendant ses dialogues (cf.
    // storyStageDialogueLine), jusqu'à sa fin.
    npc.__faceLocked = dir !== 'player';
  },
  npcRemove: (scene, key) => {
    const npc = storyNpc(scene, key);
    if (!npc) return null;
    delete scene.npcs[key];
    return new Promise((resolve) => {
      scene.tweens.add({ targets: npc, alpha: 0, duration: 300, onComplete: () => { npc.destroy(); resolve(); } });
    });
  },
  npcAdd: (scene, v) => {
    const npc = createStoryNpc(scene, v);
    npc.setAlpha(0);
    return new Promise((resolve) => scene.tweens.add({ targets: npc, alpha: 1, duration: 300, onComplete: resolve }));
  },
  playerMove: (scene, v) => cutscenePlayerMove(scene, v),
  playerFace: (scene, dir) => {
    const p = scene.player;
    if (!p) return;
    storyFacePlayer(p, dir === 'left' ? -1 : 1);
    // Pose tenue : la feuille agarica_extra a la convention de flip inverse.
    if (p.storyPose) p.applyAgaricaExtraPose(p.storyPose);
  },
  // `{playerPose: 'sad'}` (tenue jusqu'à `{playerPose: null}` ou la fin de la cinématique).
  playerPose: (scene, anim) => setPlayerStoryPose(scene, anim || null),
  camera: (scene, { x, y, ms = 800 }) => {
    const cam = scene.cameras.main;
    cam.stopFollow();
    scene.__cameraDetached = true;
    cam.pan(x ?? cam.midPoint.x, y ?? cam.midPoint.y, ms, 'Sine.easeInOut');
    return storyWait(scene, ms);
  },
  cameraFollow: (scene) => {
    if (!scene.player) return null;
    const cam = scene.cameras.main;
    cam.pan(scene.player.x, scene.player.y - 40, 500, 'Sine.easeInOut');
    return storyWait(scene, 500).then(() => storyCameraFollow(scene));
  },
  shake: (scene, v = {}) => {
    const ms = v.ms || 300;
    scene.cameras.main.shake(ms, v.intensity ?? 0.01);
    return storyWait(scene, ms);
  },
  flash: (scene, v = {}) => {
    const ms = v.ms || 300;
    const c = v.color ?? 0xffffff;
    scene.cameras.main.flash(ms, (c >> 16) & 255, (c >> 8) & 255, c & 255);
    return storyWait(scene, ms);
  },
  set: (scene, v) => { storySet(v); },
  give: (scene, id) => { inventoryAdd(scene, id); return storyWait(scene, 300); },
  take: (scene, id) => { inventoryRemove(id); },
  skill: (scene, id) => { unlockSkillFromStory(scene, id); return storyWait(scene, 300); },
  form: (scene, flag) => { unlockFormFromStory(scene, flag); return storyWait(scene, 300); },
  // Quêtes (vague 3) : `{questStart: 'id'}`, `{questStep: 'id'}` (étape
  // suivante) ou `{questStep: {id, step}}`, `{questComplete: 'id'}` (verse la
  // récompense). Bandeau / toast, sauf `{questStart: {id, silent: true}}`.
  questStart: (scene, v) => {
    const o = typeof v === 'object' ? v : { id: v };
    if (questStart(scene, o.id, { silent: !!o.silent })) return storyWait(scene, 300);
    return null;
  },
  questStep: (scene, v) => {
    const o = typeof v === 'object' ? v : { id: v };
    questSetStep(scene, o.id, o.step ?? null, { silent: !!o.silent });
  },
  questComplete: (scene, v) => {
    const o = typeof v === 'object' ? v : { id: v };
    if (questComplete(scene, o.id, { silent: !!o.silent })) return storyWait(scene, 300);
    return null;
  },
  // Récompense hors quête (contenu de coffre) : `{reward: {eclats: 10}}`.
  reward: (scene, contents) => {
    if (typeof secretGrantContents === 'function') secretGrantContents(scene, contents, { source: 'cutscene' });
    return storyWait(scene, 300);
  },
  // Boutique (ShopScene) : la cinématique attend qu'elle soit refermée.
  shop: (scene, id) => (typeof openShop === 'function' ? openShop(scene, id) : null),
  // Xara rejoint Agarica : le compagnon réel remplace le PNJ « xara » s'il existe.
  xaraJoin: (scene) => {
    storySet('xaraMet', true);
    if (scene.xara || !scene.player) return;
    const npc = scene.npcs && scene.npcs.xara;
    scene.xara = new Xara(scene, scene.player);
    scene.xara.setDepth(CHARACTER_DEPTH);
    storyPutBehindPlayer(scene, scene.xara);
    if (npc) {
      scene.xara.setPosition(npc.x, npc.y);
      delete scene.npcs.xara;
      npc.destroy();
    }
  },
  goto: (scene, v) => {
    const target = typeof v === 'string' ? { scene: v } : v;
    const entry = storyZoneEntry(target.scene);
    goToScene(scene, entry ? entry.scene : target.scene, target.data);
    return CUTSCENE_STOP;
  },
  call: (scene, fn) => fn(scene),
  parallel: (scene, list, step, visit) => Promise.all(list.map((s) => runCutsceneStep(scene, s, visit))),
};

function runCutsceneStep(scene, step, visit) {
  if (typeof step === 'function') return Promise.resolve(step(scene));
  const key = Object.keys(step).find((k) => CUTSCENE_STEP_HANDLERS[k]);
  if (!key) {
    console.warn('runCutscene : étape inconnue', step);
    return Promise.resolve();
  }
  return Promise.resolve(CUTSCENE_STEP_HANDLERS[key](scene, step[key], step, visit));
}

// `talk` d'un PNJ : id (CUTSCENES prioritaire, sinon DIALOGUES), tableau
// conditionnel `[{requires, forbids, talk}]` (le 1er autorisé gagne), ou fonction.
function resolveStoryTalk(scene, talk, npc) {
  if (!talk) return null;
  if (typeof talk === 'function') return resolveStoryTalk(scene, talk(scene, npc), npc);
  if (Array.isArray(talk) && talk.length && talk[0] && talk[0].talk !== undefined) {
    const hit = talk.find((t) => storyAllowed(t));
    return hit ? resolveStoryTalk(scene, hit.talk, npc) : null;
  }
  return talk;
}

function storyTalk(scene, talk) {
  if (typeof talk === 'string' && CUTSCENES[talk]) return runCutscene(scene, talk);
  if (typeof talk === 'string' && DIALOGUES[talk] === undefined) {
    console.warn(`PNJ : "${talk}" n'est ni dans CUTSCENES ni dans DIALOGUES.`);
    return Promise.resolve();
  }
  if (Array.isArray(talk) && talk.length && typeof talk[0] === 'object' && !talk[0].who && !talk[0].text) {
    return runCutscene(scene, talk);
  }
  return showDialogue(scene, talk);
}

// ---------------------------------------------------------------------------
// Handlers de données de zone (cf. LEVEL_DATA_HANDLERS dans PLAN_DEV.md)
// ---------------------------------------------------------------------------
const STORY_INTERACT_RANGE_X = 70;
const STORY_INTERACT_RANGE_Y = 110;
const STORY_PROMPT_DEPTH = 1050;

// Appelé par buildLevelFromData au début de chaque visite (instance de scène réutilisée).
function resetStoryState(scene, data) {
  scene.__storyVisit = (scene.__storyVisit || 0) + 1;
  scene.__storyZoneId = data && data.zoneId ? data.zoneId : null;
  scene.__cutsceneLock = 0;
  scene.__storyFreeze = 0;
  scene.__playerScripted = false;
  scene.__cameraDetached = false;
  scene.__storyBannerFreeAt = 0;
  scene.__zoneScript = null;
  scene.__bossBar = null;
  scene.npcs = {};
  scene.__story = {
    interactables: [], triggers: [], mossBlocks: [], mossWalls: [], checkpoints: [], lights: [],
    fall: null, safePos: null, checkpoint: null, prompt: null, mossGroup: null, keys: null,
    // Chute dans le vide en cours (cf. startStoryFallOut) et bornes du monde
    // propres au joueur, ouvertes vers le bas (cf. syncStoryFallBounds) ;
    // surface de la bande `liquidFloor` où elle s'enfonce (cf. storyFallSinkMask).
    fallOut: null, fallBounds: null, liquid: null,
    // Dernier cœur perdu en l'air, en attente de la suite (cf. storyWatchAirDeath).
    airDeath: null,
    // Mise au repos d'Agarica au début d'un dialogue / d'une cinématique
    // (cf. storyBeginSettle) ; `settleEpisode` : déjà faite pour ce gel.
    settle: null, settleEpisode: false,
  };
}

function storyGroundY(scene, x, fallbackY = 448) {
  const y = groundSurfaceYAt(scene, x, fallbackY);
  return y == null ? fallbackY : y;
}

// Où POSER LES PIEDS d'un PNJ en x (agent Histoire, 2026-10-06) : haut du
// CORPS physique de la tuile (les tuiles d'herbe ont une hitbox aux 3/4, son
// haut est 16 px sous le haut de l'image — c'est là que se tient Agarica), et
// seulement une tuile à découvert (pas une tuile de sol cachée sous une
// marche/souche, que storyGroundY choisissait quand elle était plus proche de
// `refY`). Parmi les surfaces à découvert, la plus proche de `refY`.
function storyStandY(scene, x, refY = 448) {
  if (!scene.ground) return storyGroundY(scene, x, refY);
  const open = openGroundTilesAt(scene, x);
  if (!open.length) return refY;
  let best = null;
  for (const t of open) {
    const top = t.body ? t.body.top : t.y - t.displayHeight / 2;
    if (best === null || Math.abs(top - refY) < Math.abs(best - refY)) best = top;
  }
  return best;
}

// Où poser les pieds d'un PNJ (sprite ancré aux pieds visibles, cf.
// addManifestSprite) : sur le DESSUS d'un décor (`onProp: true` ou le type du
// prop, ex. Xara sur sa souche, cf. propSurfaceYUnder : sous l'emprise de ses
// pieds, pas le seul bord arrière du plateau), sinon `y` explicite, sinon la
// surface de marche. `npc` absent (aperçu sans sprite) : haut visible sous x.
function storyNpcFootY(scene, n, npc = null) {
  if (n.onProp) {
    const type = n.onProp === true ? null : n.onProp;
    const top = npc ? propSurfaceYUnder(scene, npc, type, n.x) : propTopYAt(scene, n.x, type);
    if (top != null) return top;
  }
  return n.y != null ? n.y : storyStandY(scene, n.x);
}

// Pose un objet SUR le décor `propType` en x (le bas de ses pixels visibles
// sur le dessus du décor sous sa base, cf. propSurfaceYUnder) ; repli si le
// décor manque : `fallbackY` tel quel. Ex. l'idole sur son autel.
function storyPlaceOnProp(scene, obj, x, propType, fallbackY) {
  obj.setPosition(x, fallbackY);
  const top = propSurfaceYUnder(scene, obj, propType, x);
  if (top != null) setVisibleBottomY(obj, top);
  return obj;
}

// Place `obj` juste sous le joueur dans la liste d'affichage (PNJ, objets).
function storyPutBehindPlayer(scene, obj) {
  if (scene.player && scene.children.moveBelow) scene.children.moveBelow(obj, scene.player);
}

// Invite « E : parler » peinte (lot n°8, contrat PLAN_INTEGRATION_LOT_8 §3.3) :
//   createStoryPromptLabel(scene, { depth, originY }) → objet qui imite un Text
// Pilule `ui_invite` en 3 morceaux (0,15 : 24 px de haut), pastille de touche
// `ui_touche` de 19 px (lettre en gras de 12 px #2a1f45 : le bois est clair),
// texte de 13 px #ffe9f5 ; largeur = 10 + 19 + 4 + texte + 12. `setText`
// découpe « X : reste » en pastille + reste (sans touche : texte seul) et ne
// fait rien si le libellé n'a pas changé (appelé à chaque image). Méthodes
// setText / setPosition / setVisible / setDepth chaînables, setOrigin sans
// effet (l'origine est fixée à la création : x au centre, `originY` en y),
// propriétés visible / active / text. C'est un Container : getBounds marche
// (règle « interface dans l'écran », keepWorldUiInView). Sans `ui_invite` :
// le Text d'avant (fond violet), avec la même origine.
const STORY_PROMPT_ART = { h: 24, padL: 10, key: 19, gap: 4, padR: 12, scale: 0.15 };

function createStoryPromptLabel(scene, { depth = STORY_PROMPT_DEPTH, originY = 1 } = {}) {
  if (!scene.textures.exists('item-ui_invite')) {
    const t = scene.add.text(0, 0, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe9f5',
      backgroundColor: '#2a1f45', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, originY).setDepth(depth);
    t.lookRole = 'ui';
    return t;
  }
  const A = STORY_PROMPT_ART;
  const c = scene.add.container(0, 0).setDepth(depth);
  const pill = addUiSliced(scene, 'ui_invite', 0, 0, 60, A.h, { scale: storyUiScale('ui_invite', A.scale) });
  let key;
  if (scene.textures.exists('item-ui_touche')) {
    key = scene.add.image(0, 0, 'item-ui_touche');
    key.setScale(A.key / Math.max(key.width, key.height));
  } else {
    // Pastille dessinée du même bois clair si l'image manque.
    key = scene.add.graphics();
    key.fillStyle(0xd8c08a, 1);
    key.fillRoundedRect(-A.key / 2, -A.key / 2, A.key, A.key, 5);
    key.lineStyle(1.5, 0x6b4a36, 1);
    key.strokeRoundedRect(-A.key / 2, -A.key / 2, A.key, A.key, 5);
  }
  const keyText = scene.add.text(0, 0, '', {
    fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: STORY_UI_KEY_INK,
  }).setOrigin(0.5);
  const label = scene.add.text(0, 0, '', {
    fontFamily: 'sans-serif', fontSize: '13px', color: STORY_UI.text,
  }).setOrigin(0, 0.5);
  c.add([pill, key, keyText, label]);
  c.text = null;
  c.setOrigin = function setOrigin() { return this; };
  c.setText = function setText(value) {
    const str = value == null ? '' : String(value);
    if (str === this.text) return this;
    this.text = str;
    const m = /^([A-Z]) : (.*)$/.exec(str);
    const hasKey = !!m;
    keyText.setText(hasKey ? m[1] : '');
    label.setText(hasKey ? m[2] : str);
    key.setVisible(hasKey);
    keyText.setVisible(hasKey);
    const textX = hasKey ? A.padL + A.key + A.gap : A.padR;
    const w = Math.ceil(textX + label.width + A.padR);
    pill.setUiSize(w, A.h);
    // Positions entières (texte net) ; x centré, y selon `originY`.
    const left = -Math.round(w / 2);
    const top = -Math.round(pill.uiH * originY);
    const midY = top + Math.round(pill.uiH / 2);
    pill.setPosition(left, top);
    key.setPosition(left + A.padL + A.key / 2, midY);
    keyText.setPosition(left + A.padL + A.key / 2, midY);
    label.setPosition(left + textX, midY);
    return this;
  };
  c.setText('');
  // Rendu de cohésion (LookKit) : interface.
  c.lookRole = 'ui';
  return c;
}

function ensureStoryPrompt(scene) {
  const st = scene.__story;
  if (!st.prompt || !st.prompt.active) {
    // Invite peinte si `ui_invite` existe, sinon le Text d'avant (cf.
    // createStoryPromptLabel) : même origine (bas, centre), même profondeur.
    st.prompt = createStoryPromptLabel(scene, { depth: STORY_PROMPT_DEPTH, originY: 1 }).setVisible(false);
    // Règle commune (LevelKit) : invite toujours dans l'écran ; ancre au-dessus
    // du haut (grand PNJ, objet en hauteur) -> à hauteur de la tête d'Agarica.
    if (typeof keepWorldUiInView === 'function') keepWorldUiInView(st.prompt, { prompt: true });
  }
  return st.prompt;
}

// Crée un PNJ (données `npcs` ou étape `npcAdd`) dans scene.npcs[key || id].
function createStoryNpc(scene, n) {
  const key = n.key || n.id;
  const npc = addManifestSprite(scene, n.x, storyNpcFootY(scene, n), n.sprite || n.id, n.anim || 'idle');
  npc.npcKey = key;
  npc.talk = n.talk || null;
  // Marchand (vague 3) : `shop: 'id'` de SHOPS -- E ouvre la boutique
  // (après la réplique `talk` s'il en a une), cf. updateStoryInteractables.
  npc.shopId = n.shop || null;
  npc.npcName = n.name || null;
  npc.lookAtPlayer = n.lookAtPlayer !== false;
  setNpcFacing(npc, n.facing === 'left' ? -1 : 1);
  // Sur un décor : recalé sous l'emprise réelle de ses pieds (sprite créé et
  // tourné du bon côté).
  if (n.onProp) npc.y = storyNpcFootY(scene, n, npc);
  // Devant les décors (props, feux, totems), comme tous les personnages ; à
  // profondeur égale, juste sous le joueur dans la liste d'affichage.
  npc.setDepth(CHARACTER_DEPTH);
  storyPutBehindPlayer(scene, npc);
  if (scene.npcs[key]) scene.npcs[key].destroy();
  scene.npcs[key] = npc;
  return npc;
}

// PNJ interactif créé en cours de visite (Clak à l'invocation du duel de
// Geralt, PNJ d'une revisite…) : invite « E : parler » comme ceux de la
// donnée `npcs`. Avant, les scripts poussaient eux-mêmes { kind: 'npc' }
// dans scene.__story.interactables sans jamais l'en retirer : une entrée
// morte de plus à chaque reprise du duel. Ici :
// - pas de doublon (même sprite inscrit deux fois = une entrée) ;
// - les entrées de PNJ détruits sont retirées au passage ;
// - le PNJ doit être dans scene.npcs sous `npc.npcKey` (règle de
//   updateStoryInteractables) : clé retrouvée dans scene.npcs, sinon prise
//   sur l'id du manifest, et le PNJ y est inscrit si la place est libre.
// Renvoie le PNJ (ou null).
function registerStoryNpc(scene, npc) {
  const st = scene && scene.__story;
  if (!st || !npc || !npc.active) return null;
  storyPruneInteractables(scene);
  if (!scene.npcs) scene.npcs = {};
  if (!npc.npcKey) {
    const known = Object.keys(scene.npcs).find((k) => scene.npcs[k] === npc);
    npc.npcKey = known || npc.manifestId || `npc_${st.interactables.length}`;
  }
  if (!scene.npcs[npc.npcKey] || !scene.npcs[npc.npcKey].active) scene.npcs[npc.npcKey] = npc;
  if (!st.interactables.some((it) => it.npc === npc)) st.interactables.push({ kind: 'npc', npc });
  return npc;
}

// Retire un objet interactif : PNJ (sprite), ramassable (son image ou sa
// donnée), mur de mousse, ou l'entrée elle-même. Le PNJ reste dans
// scene.npcs (c'est à son créateur de le détruire). Vrai si retiré.
function unregisterStoryInteractable(scene, objOrNpc) {
  const st = scene && scene.__story;
  if (!st || !objOrNpc) return false;
  const before = st.interactables.length;
  st.interactables = st.interactables.filter((it) => it !== objOrNpc && it.npc !== objOrNpc
    && it.img !== objOrNpc && it.data !== objOrNpc && it.wall !== objOrNpc);
  return st.interactables.length !== before;
}

// Entrées de PNJ détruits (sprite sans scène) : jamais réutilisables.
function storyPruneInteractables(scene) {
  const st = scene.__story;
  if (st.interactables.some((it) => it.kind === 'npc' && it.npc && !it.npc.scene)) {
    st.interactables = st.interactables.filter((it) => !(it.kind === 'npc' && it.npc && !it.npc.scene));
  }
}

LEVEL_DATA_HANDLERS.zoneName = (scene, name, data) => {
  showTitleCard(scene, name, data.zoneSub);
};

// `background` est appliqué par addMoonlitDecor (il remplace le ciel plan4) ;
// rien à faire ici, l'entrée existe pour documenter la clé.
LEVEL_DATA_HANDLERS.background = () => {};

// Voile d'ambiance (rectangle teinté, profondeur 900) et, lot n°8, vignette
// peinte `couche_vignette` : bords assombris en MULTIPLY, plein écran.
// `ambient.vignette` (contrat §3.3) : false = pas de vignette ; nombre entre
// 0 et 1 = sa force (alpha) ; absente = 0,35 + darkness x 0,6, bornée à
// [0,35 ; 0,85]. JAMAIS teintée (l'image est en niveaux de gris, la teinte
// est déjà dans le voile). Profondeur 999,5 : sous `hudGraphics` (1000 :
// barre d'énergie et cases de repli, dans le coin le plus sombre), au-dessus
// des feuilles (999).
const STORY_VIGNETTE_DEPTH = 999.5;

LEVEL_DATA_HANDLERS.ambient = (scene, amb) => {
  const { width, height } = scene.scale;
  scene.ambientOverlay = scene.add.rectangle(0, 0, width, height, amb.tint ?? 0x000000, amb.darkness ?? 0.35)
    .setOrigin(0, 0).setScrollFactor(0).setDepth(900);
  // Rendu de cohésion (LookKit) : voile et vignette rendus TELS QUELS (rôle
  // 'ui' = aucun shader) ; le rendu règle l'alpha du voile lui-même et les
  // objets dessinés dessous compensent (cf. LookKit.js, `overlay`).
  scene.ambientOverlay.lookRole = 'ui';
  scene.ambientVignette = null;
  const vig = amb.vignette ?? true;
  if (vig !== false && scene.textures.exists('item-couche_vignette')) {
    const force = typeof vig === 'number' ? Phaser.Math.Clamp(vig, 0, 1)
      : Phaser.Math.Clamp(0.35 + (amb.darkness ?? 0.35) * 0.6, 0.35, 0.85);
    scene.ambientVignette = scene.add.image(width / 2, height / 2, 'item-couche_vignette')
      .setDisplaySize(width, height).setScrollFactor(0).setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setAlpha(force).setDepth(STORY_VIGNETTE_DEPTH);
    scene.ambientVignette.lookRole = 'ui';
  }
};

LEVEL_DATA_HANDLERS.npcs = (scene, list) => {
  for (const n of list || []) {
    if (!storyAllowed(n)) continue;
    const npc = createStoryNpc(scene, n);
    scene.__story.interactables.push({ kind: 'npc', npc });
  }
};

LEVEL_DATA_HANDLERS.triggers = (scene, list) => {
  const zone = storyZoneId(scene);
  (list || []).forEach((t, i) => {
    scene.__story.triggers.push({ ...t, flag: `trig_${zone}_${t.id || i}`, inside: false });
  });
};

// `requires` / `forbids` d'un ramassable (vague 3) : relus en continu --
// l'objet d'une quête apparaît dès qu'elle commence, même pendant la visite
// (avant : seulement à l'entrée de la zone ; aucune zone n'en dépendait).
LEVEL_DATA_HANDLERS.pickups = (scene, list) => {
  const zone = storyZoneId(scene);
  (list || []).forEach((p) => {
    const flag = `pickup_${zone}_${p.item}`;
    if (storyGet(flag) || inventoryHas(p.item)) return;
    const y = p.y != null ? p.y : storyGroundY(scene, p.x) - 30;
    // Juice : halo d'objet (art `fx_halo_objet`, sinon halo dessiné) qui
    // respire, objet qui flotte en se balançant ; petites étoiles de temps en
    // temps (cf. updateStoryInteractables).
    let glow;
    if (typeof juiceTexture === 'function') {
      const gt = juiceTexture(scene, 'fx_halo_objet', 'juice-glow');
      const gs = 84 / gt.size;
      glow = scene.add.image(p.x, y, gt.key).setBlendMode(Phaser.BlendModes.ADD).setTint(gt.art ? 0xffffff : STORY_UI.vineLight)
        .setAlpha(0.6).setScale(gs);
      scene.tweens.add({ targets: glow, alpha: { from: 0.4, to: 0.85 }, scale: { from: gs * 0.85, to: gs * 1.1 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      glow = scene.add.circle(p.x, y, 22, STORY_UI.vineLight, 0.18);
      scene.tweens.add({ targets: glow, alpha: 0.05, duration: 1100, yoyo: true, repeat: -1 });
    }
    const img = addItemIcon(scene, p.x, y, p.item, 40);
    scene.tweens.add({ targets: [img, glow], y: y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: img, angle: { from: -5, to: 5 }, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    storyPutBehindPlayer(scene, glow);
    storyPutBehindPlayer(scene, img);
    const it = { kind: 'pickup', data: p, flag, img, glow, x: p.x, y, glintAt: 0, gated: !!(p.requires || p.forbids) };
    scene.__story.interactables.push(it);
    if (it.gated) storyPickupGate(it);
  });
};

// Ramassable conditionnel : caché tant que ses conditions ne tiennent pas.
// Vrai s'il est disponible.
function storyPickupGate(it) {
  if (!it.gated) return true;
  const ok = storyAllowed(it.data);
  if (it.img && it.img.visible !== ok) it.img.setVisible(ok);
  if (it.glow && it.glow.visible !== ok) it.glow.setVisible(ok);
  return ok;
}

function ensureMossGroup(scene) {
  const st = scene.__story;
  if (!st.mossGroup) {
    st.mossGroup = scene.physics.add.staticGroup();
    scene.physics.add.collider(scene.player, st.mossGroup);
    if (scene.enemies) scene.physics.add.collider(scene.enemies, st.mossGroup);
  }
  return st.mossGroup;
}

// Bas du visuel d'un amas/mur : le rectangle s'arrête au haut de l'image des
// tuiles (y de donnée) ; s'il repose sur le sol, son visuel descend jusqu'à
// la surface de marche (16 px plus bas sur l'herbe) au lieu de flotter.
const MOSS_GROUND_SNAP = 24;
function mossVisualFootY(scene, x, bottom) {
  const stand = storyStandY(scene, x, bottom);
  return stand > bottom && stand - bottom <= MOSS_GROUND_SNAP ? stand : bottom;
}

// Visuel d'un amas/mur : art du manifest si présent, sinon mousse dessinée.
function drawMossVisual(scene, x, y, w, h, artId, wall) {
  const footY = mossVisualFootY(scene, x, y + h / 2);
  // Rendu de cohésion (LookKit) : la mousse vert acide est un signal
  // d'histoire (la corruption) : décor gardé à son gamma d'origine.
  if (scene.textures.exists(`item-${artId}`)) {
    const img = scene.add.image(x, y + h / 2, `item-${artId}`).setOrigin(0.5, 1).setDisplaySize(w * 1.15, h * 1.1);
    img.lookRole = 'prop';
    return setVisibleBottomY(img, footY);
  }
  const g = scene.add.graphics({ x, y: footY - h / 2 });
  g.lookRole = 'prop';
  const rnd = new Phaser.Math.RandomDataGenerator([`${x},${y}`]);
  const blobs = Math.max(5, Math.round((w * h) / 1800));
  g.fillStyle(0x10200f, 1);
  g.fillRoundedRect(-w / 2, -h / 2 + 6, w, h - 6, Math.min(24, w / 3));
  for (let i = 0; i < blobs; i++) {
    const bx = rnd.realInRange(-w / 2 + 10, w / 2 - 10);
    const by = rnd.realInRange(-h / 2 + 14, h / 2 - 10);
    const r = rnd.realInRange(12, Math.min(w, h) * 0.35 + 12);
    g.fillStyle(i % 3 === 0 ? 0x2f5a2a : 0x3e7a2c, 1);
    g.fillCircle(bx, by, r);
  }
  // Reflets vert toxique + coulures.
  for (let i = 0; i < blobs; i++) {
    g.fillStyle(0x9bff5a, wall ? 0.55 : 0.7);
    g.fillCircle(rnd.realInRange(-w / 2 + 8, w / 2 - 8), rnd.realInRange(-h / 2 + 8, h / 2 - 8), rnd.realInRange(2, 5));
  }
  for (let i = 0; i < Math.round(w / 30); i++) {
    const dx = rnd.realInRange(-w / 2 + 8, w / 2 - 8);
    g.fillStyle(0x6fdc3a, 0.8);
    g.fillRoundedRect(dx, h / 2 - 12, 4, rnd.realInRange(10, 22), 2);
  }
  return g;
}

function addMossBody(scene, x, y, w, h) {
  const group = ensureMossGroup(scene);
  const zone = scene.add.zone(x, y, w, h);
  scene.physics.add.existing(zone, true);
  group.add(zone);
  return zone;
}

function removeMossBody(scene, zone) {
  scene.__story.mossGroup.remove(zone, true, true);
}

// x, y = CENTRE du rectangle ; y absent → posé sur le sol.
function mossRect(scene, m, defaultH) {
  const w = m.w || 96;
  const h = m.h || defaultH;
  const y = m.y != null ? m.y : storyGroundY(scene, m.x) - h / 2;
  return { x: m.x, y, w, h };
}

LEVEL_DATA_HANDLERS.mossBlocks = (scene, list) => {
  const zone = storyZoneId(scene);
  (list || []).forEach((m, i) => {
    const flag = `moss_${zone}_${m.id || i}`;
    if (storyGet(flag)) return;
    const r = mossRect(scene, m, 96);
    const visual = drawMossVisual(scene, r.x, r.y, r.w, r.h, 'mousse_amas_intact', false);
    const body = addMossBody(scene, r.x, r.y, r.w, r.h);
    scene.__story.mossBlocks.push({ ...r, flag, visual, body, destroyed: false });
  });
};

LEVEL_DATA_HANDLERS.mossWalls = (scene, list) => {
  const zone = storyZoneId(scene);
  (list || []).forEach((m, i) => {
    const flag = `mosswall_${zone}_${m.id || i}`;
    if (storyGet(flag)) return;
    const r = mossRect(scene, m, 192);
    const visual = drawMossVisual(scene, r.x, r.y, r.w, r.h, 'mousse_mur', true);
    const body = addMossBody(scene, r.x, r.y, r.w, r.h);
    const wall = { ...r, id: m.id, flag, visual, body, open: false };
    scene.__story.mossWalls.push(wall);
    scene.__story.interactables.push({ kind: 'mossWall', wall, x: r.x, y: r.y + r.h / 2 });
  });
};

LEVEL_DATA_HANDLERS.fall = (scene, fall) => {
  scene.__story.fall = { mode: 'hurt', y: scene.scale.height + 60, ...fall };
};

// La bande elle-même est dessinée par LevelKit (addLiquidFloor) ; retenue ici
// pour la chute : Agarica s'y enfonce au lieu de passer devant (cf.
// storyFallSinkMask). Sans `x1`/`x2`, elle couvre toute la zone.
LEVEL_DATA_HANDLERS.liquidFloor = (scene, cfg) => {
  if (!cfg || cfg.y == null) return;
  scene.__story.liquid = { y: cfg.y, x1: cfg.x1 ?? -Infinity, x2: cfg.x2 ?? Infinity };
};

// Lanternes de reprise : art `decor_lanterne_eteinte` / `_allumee` (lot
// Codex n°8) s'il existe, sinon lanterne dessinée. Juice : halo qui respire
// une fois allumée, éclat à l'allumage (cf. updateStoryCheckpoints).
const STORY_LANTERN_ART = ['item-decor_lanterne_eteinte', 'item-decor_lanterne_allumee'];
// Lot n°8 (R1 : lanternes à 0,15, 30x51) : centre MESURÉ du globe à 63 % de
// la hauteur depuis le bas (0,55 visait le pied de la cage). Halo de 110 px
// (plan : 64 -> 80, « à réajuster sur capture ») : le halo `fx_halo_doux`
// réimporté en dégradé (M04) n'est plus un disque plein, et la lanterne en
// cache le centre ; à 80 px il ne se voyait presque plus. Lueur au sol
// `fx_lueur_sol` sous la lanterne allumée (vert lunaire ; alpha 0,45 au lieu
// des 0,3 du plan, invisible sur l'herbe) : on voit d'un coup d'œil laquelle
// est le point de reprise.
const STORY_LANTERN_GLOBE_Y = 0.63;
const STORY_LANTERN_HALO = 110;
const STORY_LANTERN_POOL = { w: 90, h: 18, alpha: 0.45 };

LEVEL_DATA_HANDLERS.checkpoints = (scene, list) => {
  const art = STORY_LANTERN_ART.every((k) => scene.textures.exists(k));
  const scale = (getItemManifest().decor_lanterne_eteinte || {}).scale || 0.15;
  for (const c of list || []) {
    const y = c.y != null ? c.y : storyGroundY(scene, c.x);
    let img = null;
    let g = null;
    let lampY = y - 18;
    if (art) {
      img = scene.add.image(c.x, y, STORY_LANTERN_ART[0]).setOrigin(0.5, 1).setScale(scale);
      setVisibleBottomY(img, y + GROUND_CONTACT_SINK);
      lampY = y - img.displayHeight * STORY_LANTERN_GLOBE_Y;
    } else {
      g = scene.add.graphics({ x: c.x, y });
    }
    let halo = null;
    if (typeof juiceTexture === 'function') {
      const ht = juiceTexture(scene, 'fx_halo_doux', 'juice-glow');
      halo = scene.add.image(c.x, lampY, ht.key).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(STORY_UI.vineLight).setScale(STORY_LANTERN_HALO / ht.size).setAlpha(0).setVisible(false);
    }
    const pool = scene.textures.exists('item-fx_lueur_sol')
      ? scene.add.image(c.x, y, 'item-fx_lueur_sol').setBlendMode(Phaser.BlendModes.ADD).setTint(STORY_UI.vineLight)
        .setDisplaySize(STORY_LANTERN_POOL.w, STORY_LANTERN_POOL.h).setAlpha(STORY_LANTERN_POOL.alpha).setVisible(false)
      : null;
    const draw = (lit) => {
      if (pool) pool.setVisible(lit);
      if (img) {
        img.setTexture(STORY_LANTERN_ART[lit ? 1 : 0]);
      } else {
        g.clear();
        g.fillStyle(0x2b2440, 1);
        g.fillRoundedRect(-9, -30, 18, 30, 5);
        g.fillStyle(lit ? STORY_UI.vineLight : 0x5a5070, lit ? 1 : 0.8);
        g.fillCircle(0, -18, 4);
        if (lit) {
          g.fillStyle(STORY_UI.vineLight, 0.2);
          g.fillCircle(0, -18, 12);
        }
      }
      if (!halo) return;
      scene.tweens.killTweensOf(halo);
      halo.setVisible(lit);
      if (lit) {
        const hs = STORY_LANTERN_HALO / juiceTexture(scene, 'fx_halo_doux', 'juice-glow').size;
        scene.tweens.add({ targets: halo, alpha: { from: 0.3, to: 0.55 }, scale: { from: hs * 0.9, to: hs * 1.1 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    };
    draw(false);
    // Rendu de cohésion (LookKit) : la lanterne est un décor (gamma
    // d'origine) ; allumée, c'est une source de lumière (règle 'lanterne').
    (img || g).lookRole = 'prop';
    // Ordre d'affichage : lueur au sol, halo, lanterne (puis le joueur).
    if (pool) storyPutBehindPlayer(scene, pool);
    if (halo) storyPutBehindPlayer(scene, halo);
    storyPutBehindPlayer(scene, img || g);
    scene.__story.checkpoints.push({ x: c.x, y, draw, lit: false, lampY });
  }
};

// Lumières posées dans la donnée de zone (lot n°8, contrat §3.3) :
//   lights: [{ id, x, y, w, h, tint, alpha, pulse?: [min, max, ms],
//              layer: 'back' | 'aboveAmbient', requires?, forbids? }]
// `id` : fx_rai_lumiere (rai : `y` = son BAS, posé sur le sol éclairé),
// fx_lueur_sol, fx_halo_doux, fx_halo_rayons (`y` = centre). `w`/`h` : taille
// affichée (défaut : échelle du manifeste). Images en ADD (elles ne font
// qu'éclaircir) ; `layer` 'back' (défaut) : derrière les personnages ;
// 'aboveAmbient' : profondeur 950, au-dessus du voile `ambient` (900) — un
// filet de lumière qui doit percer l'obscurité (trou sombre). `pulse` :
// l'alpha respire de min à max. Rien n'est affiché sans l'image (décor
// facultatif). Une lumière à condition (`requires`/`forbids`) s'éteint ou se
// rallume en fondu si le drapeau change pendant la visite (idole volée…).
const STORY_LIGHT_IDS = ['fx_rai_lumiere', 'fx_lueur_sol', 'fx_halo_doux', 'fx_halo_rayons'];
const STORY_LIGHT_ABOVE_AMBIENT_DEPTH = 950;
const STORY_LIGHT_FADE_MS = 600;

LEVEL_DATA_HANDLERS.lights = (scene, list) => {
  for (const L of list || []) {
    if (!L || !STORY_LIGHT_IDS.includes(L.id)) continue;
    const key = `item-${L.id}`;
    if (!scene.textures.exists(key)) continue;
    const def = getItemManifest()[L.id] || {};
    const img = scene.add.image(L.x, L.y, key).setOrigin(0.5, L.id === 'fx_rai_lumiere' ? 1 : 0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    const k = def.scale || 1;
    img.setDisplaySize(L.w ?? img.width * k, L.h ?? img.height * k);
    if (L.tint != null) img.setTint(L.tint);
    if (L.layer === 'aboveAmbient') img.setDepth(STORY_LIGHT_ABOVE_AMBIENT_DEPTH);
    else storyPutBehindPlayer(scene, img);
    const light = { data: L, img, on: storyAllowed(L), tween: null, conditional: !!(L.requires || L.forbids) };
    storyLightApply(scene, light, true);
    scene.__story.lights.push(light);
  }
};

// Allume / éteint une lumière selon `light.on` (fondu sauf `instant`) ;
// allumée avec `pulse`, son alpha respire en boucle.
function storyLightApply(scene, light, instant = false) {
  const { img, data: L } = light;
  if (light.tween) { light.tween.remove(); light.tween = null; }
  scene.tweens.killTweensOf(img);
  const pulse = Array.isArray(L.pulse) && L.pulse.length >= 2 ? L.pulse : null;
  const target = light.on ? (pulse ? pulse[0] : (L.alpha ?? 1)) : 0;
  const breathe = () => {
    if (!light.on || !pulse || !img.active) return;
    light.tween = scene.tweens.add({
      targets: img, alpha: { from: pulse[0], to: pulse[1] }, duration: pulse[2] || 1800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  };
  if (instant) {
    img.setAlpha(target);
    breathe();
    return;
  }
  scene.tweens.add({ targets: img, alpha: target, duration: STORY_LIGHT_FADE_MS, ease: 'Sine.easeInOut', onComplete: breathe });
}

function updateStoryLights(scene) {
  for (const light of scene.__story.lights) {
    if (!light.conditional || !light.img.active) continue;
    const on = storyAllowed(light.data);
    if (on === light.on) continue;
    light.on = on;
    storyLightApply(scene, light);
  }
}

LEVEL_DATA_HANDLERS.script = (scene, id, data) => {
  const script = ZONE_SCRIPTS[id];
  if (!script) {
    console.warn(`ZONE_SCRIPTS["${id}"] introuvable (script de zone pas encore écrit ?).`);
    return;
  }
  scene.__zoneScript = script;
  if (script.create) script.create(scene, data);
};

// Ordre d'appel : `script` en DERNIER (il peut s'appuyer sur scene.npcs, la mousse…).
const LEVEL_DATA_HANDLER_LAST = ['script'];

function runLevelDataHandlers(scene, data) {
  const keys = Object.keys(data).filter((k) => LEVEL_DATA_HANDLERS[k] && !LEVEL_DATA_HANDLER_LAST.includes(k));
  for (const k of LEVEL_DATA_HANDLER_LAST) if (data[k] !== undefined && LEVEL_DATA_HANDLERS[k]) keys.push(k);
  for (const k of keys) {
    try {
      LEVEL_DATA_HANDLERS[k](scene, data[k], data);
    } catch (e) {
      console.error(`Handler de zone "${k}" :`, e);
    }
  }
}

// ---------------------------------------------------------------------------
// Boucle « histoire » (LEVEL_UPDATE_HOOKS, monde non gelé uniquement)
// ---------------------------------------------------------------------------
function playerBodyRect(player) {
  const b = player.body;
  return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
}

function updateStoryTriggers(scene) {
  const rect = playerBodyRect(scene.player);
  for (const t of scene.__story.triggers) {
    const w = t.w || 64;
    const h = t.h != null ? t.h : 1e6;
    const y = t.y != null ? t.y : 0;
    const area = new Phaser.Geom.Rectangle(t.x - w / 2, y - h / 2, w, h);
    const inside = Phaser.Geom.Intersects.RectangleToRectangle(rect, area);
    const entered = inside && !t.inside;
    t.inside = inside;
    if (!entered) continue;
    if (t.once !== false && storyGet(t.flag)) continue;
    if (!storyAllowed(t)) continue;
    if (t.once !== false) storySet(t.flag, true);
    if (t.cutscene) runCutscene(scene, t.cutscene);
    if (isWorldFrozen(scene)) return;
  }
}

// Un seul objet interactif à la fois : le plus proche à portée.
function updateStoryInteractables(scene) {
  const player = scene.player;
  const prompt = ensureStoryPrompt(scene);
  storyPruneInteractables(scene);
  let best = null;
  let bestDist = Infinity;
  for (const it of scene.__story.interactables) {
    let x;
    let topY;
    let label;
    if (it.kind === 'npc') {
      const npc = it.npc;
      if (!npc.active || scene.npcs[npc.npcKey] !== npc) continue;
      if (npc.lookAtPlayer && !npc.__scripted && Math.abs(player.x - npc.x) < 260) {
        setNpcFacing(npc, player.x >= npc.x ? 1 : -1);
      }
      it.talk = resolveStoryTalk(scene, npc.talk, npc);
      if (!it.talk && !npc.shopId) continue;
      x = npc.x;
      topY = npc.y - npc.displayHeight;
      if (Math.abs(player.y - npc.y) > STORY_INTERACT_RANGE_Y) continue;
      label = it.talk ? 'E : parler' : 'E : marchander';
    } else if (it.kind === 'pickup') {
      if (it.done || !storyPickupGate(it)) continue;
      // Juice : étoile qui scintille sur l'objet de temps en temps.
      if (typeof spawnFx === 'function' && scene.time.now >= it.glintAt) {
        it.glintAt = scene.time.now + Phaser.Math.Between(700, 1500);
        spawnFx(scene, 'glint', it.x + Phaser.Math.Between(-12, 12), it.img.y + Phaser.Math.Between(-12, 8));
      }
      x = it.x;
      topY = it.y - 28;
      if (Math.abs(player.y - 40 - it.y) > STORY_INTERACT_RANGE_Y) continue;
      label = 'E : ramasser';
    } else if (it.kind === 'mossWall') {
      if (it.wall.open) continue;
      // Portée mesurée depuis le bord du mur, pas son centre.
      x = player.x < it.wall.x ? it.wall.x - it.wall.w / 2 : it.wall.x + it.wall.w / 2;
      topY = it.wall.y - it.wall.h / 2 - 6;
      if (player.y < it.wall.y - it.wall.h / 2 - 40 || player.y > it.wall.y + it.wall.h / 2 + 60) continue;
      label = inventoryHas('repulsif') ? 'E : verser le répulsif' : 'E : examiner';
    } else if (typeof it.probe === 'function') {
      // Objet interactif générique (vague 3 : coffres, cf. SecretKit.js) :
      // `probe(scene, player)` -> { x, topY, label } à portée, sinon null ;
      // `activate(scene)` à l'appui sur E.
      const pr = it.probe(scene, player);
      if (!pr) continue;
      ({ x, topY, label } = pr);
    } else {
      continue;
    }
    const d = Math.abs(player.x - x);
    if (d > STORY_INTERACT_RANGE_X || d >= bestDist) continue;
    best = { it, x, topY, label };
    bestDist = d;
  }
  if (!best) {
    prompt.setVisible(false);
    return;
  }
  prompt.setText(best.label).setPosition(best.x, best.topY - 8).setVisible(true);
  if (scene.time.now < (scene.__storyTalkCooldownUntil || 0)) return;
  if (!Phaser.Input.Keyboard.JustDown(player.interactKey)) return;
  prompt.setVisible(false);
  const it = best.it;
  if (it.kind === 'npc') {
    const shopId = it.npc.shopId;
    if (!shopId) {
      storyTalk(scene, it.talk);
    } else {
      // Marchand : sa réplique (s'il en a une) puis la boutique -- sauf si la
      // réplique est une cinématique qui l'ouvre déjà (étape `{shop}`).
      const visit = scene.__storyVisit;
      const opensItself = typeof it.talk === 'string' && Array.isArray(CUTSCENES[it.talk]) && CUTSCENES[it.talk].some((s) => s && s.shop);
      Promise.resolve(it.talk ? storyTalk(scene, it.talk) : null).then(() => {
        if (opensItself || scene.__storyVisit !== visit || scene.__transitioningAway || typeof openShop !== 'function') return;
        openShop(scene, shopId);
      });
    }
  } else if (typeof it.activate === 'function') {
    it.activate(scene);
  } else if (it.kind === 'pickup') {
    it.done = true;
    storySet(it.flag, true);
    inventoryAdd(scene, it.data.item);
    storyPickupJuice(scene, it);
    if (it.data.cutscene) runCutscene(scene, it.data.cutscene);
  } else if (it.kind === 'mossWall') {
    if (inventoryHas('repulsif')) openMossWall(scene, it.wall);
    else showToast(scene, "Un mur de mousse. Il faudrait de quoi le dissoudre.");
  }
}

// Ramassage (juice, visuel seul) : l'objet « saute » (pop), puis est aspiré
// vers la poitrine d'Agarica en rapetissant ; gerbe d'étoiles à l'arrivée.
function storyPickupJuice(scene, it) {
  const player = scene.player;
  scene.tweens.killTweensOf([it.img, it.glow]);
  if (typeof playSfx === 'function') playSfx('pickup', { item: it.data.item });
  if (typeof spawnFx !== 'function' || !player) {
    scene.tweens.add({
      targets: [it.img, it.glow], y: it.y - 40, alpha: 0, duration: 400,
      onComplete: () => { it.img.destroy(); it.glow.destroy(); },
    });
    return;
  }
  const s0 = it.img.scale;
  // Devant Agarica le temps d'être aspiré (il était posé derrière elle).
  it.img.setDepth(CHARACTER_DEPTH + 3);
  spawnFx(scene, 'star', it.img.x, it.img.y, { count: 6, power: 1 });
  scene.tweens.add({ targets: it.glow, alpha: 0, scale: it.glow.scale * 1.8, duration: 300, onComplete: () => it.glow.destroy() });
  scene.tweens.add({
    targets: it.img, scale: s0 * 1.45, y: it.img.y - 14, angle: 0, duration: 140, ease: 'Back.Out',
    onComplete: () => {
      const from = { x: it.img.x, y: it.img.y };
      const k = { t: 0 };
      scene.tweens.add({
        targets: k, t: 1, duration: 280, ease: 'Cubic.easeIn',
        onUpdate: () => {
          if (!it.img.active) return;
          // Courbe vers la poitrine (qui peut bouger), légèrement en cloche.
          const tx = player.active ? player.x : from.x;
          const ty = player.active ? player.y - 44 : from.y;
          it.img.setPosition(from.x + (tx - from.x) * k.t, from.y + (ty - from.y) * k.t - Math.sin(k.t * Math.PI) * 26);
          it.img.setScale(s0 * (1.45 - 1.1 * k.t));
        },
        onComplete: () => {
          if (player.active) {
            spawnFx(scene, 'pickup', player.x, player.y - 44, { color: STORY_UI.vineLight });
            juiceSquash(player, 1.08, 0.94, 180);
          }
          it.img.destroy();
        },
      });
    },
  });
}

function openMossWall(scene, wall) {
  wall.open = true;
  storySet(wall.flag, true);
  removeMossBody(scene, wall.body);
  const v = wall.visual;
  const baseY = wall.y + wall.h / 2;
  // Bulles roses de répulsif pendant que la mousse se dissout vers le bas.
  // Avec les particules de Juice, la recette `melt` (plus bas) émet déjà ces
  // bulles (`fx_bulle` teintée rose et or) : les dessiner en plus les
  // doublait. Sans elles : bulles `fx_bulle` teintées (cercles sans l'art).
  if (typeof spawnFx !== 'function') {
    const bubbleArt = scene.textures.exists('item-fx_bulle');
    for (let i = 0; i < 14; i++) {
      const bx = wall.x + Phaser.Math.Between(-wall.w / 2, wall.w / 2);
      const by = baseY - Phaser.Math.Between(0, wall.h);
      const r = Phaser.Math.Between(3, 7);
      const color = i % 2 ? STORY_UI.pink : 0xd0b060;
      const b = bubbleArt
        ? scene.add.image(bx, by, 'item-fx_bulle').setTint(color).setScale((2 * r * 1.2) / 128).setAlpha(0.9)
        : scene.add.circle(bx, by, r, color, 0.9);
      b.setDepth(STORY_PROMPT_DEPTH - 1);
      scene.tweens.add({ targets: b, y: b.y - 50, alpha: 0, duration: 700 + i * 40, delay: i * 50, onComplete: () => b.destroy() });
    }
  }
  if (v.setTint) v.setTint(0xb07ad0);
  // Juice : le mur frémit (dessin seulement), coule en gouttes et bulles
  // pendant toute la fonte (même durée qu'avant), bouffée au pied à la fin.
  if (typeof spawnFx === 'function') {
    const j = juiceRender(v);
    if (j) scene.tweens.add({ targets: j.sq, x: { from: 0.94, to: 1.06 }, duration: 110, yoyo: true, repeat: 4 });
    juiceBurstImage(scene, 'glow', wall.x, wall.y, { size: Math.max(wall.w, wall.h) * 1.4, from: 0.5, to: 1.1, ms: 600, color: STORY_UI.pink, alpha: 0.5 });
    scene.time.addEvent({
      delay: 110, repeat: 8,
      callback: () => spawnFx(scene, 'melt', wall.x, baseY - Phaser.Math.Between(20, wall.h * 0.7), { w: wall.w, h: 60, count: 2 }),
    });
    scene.time.delayedCall(1000, () => spawnFx(scene, 'dust', wall.x, baseY - 4, { count: 8, spread: wall.w / 2, power: 0.8, tint: [0xb07ad0, 0xd8ccf5] }));
    juiceShake(scene, 'tiny', 600);
    playSfx('moss_melt');
  }
  scene.tweens.add({
    targets: v, alpha: 0, scaleY: 0.1, y: v.y + (v.originY === 1 ? 0 : wall.h / 2), duration: 1100, ease: 'Sine.easeIn',
    onComplete: () => v.destroy(),
  });
  showToast(scene, 'La mousse fond en sifflant.', 1800);
}

// Anti-traversée des murs/amas de mousse (agent Histoire, 2026-10-06) : en
// passant humain → loup collé à un mur, le corps du loup (plus long, décalé
// vers l'avant) apparaît DANS le mur ; Arcade ne sépare plus un corps déjà
// enfoncé et le loup traversait le mur (poche secrète et hutte de Morgat
// atteintes sans répulsif). On mémorise le côté du joueur tant qu'il ne
// touche pas le mur, et on le ressort de ce côté-là s'il se retrouve dedans.
function guardStoryMossOverlap(scene) {
  const p = scene.player;
  const pb = p && p.body;
  if (!pb) return;
  const solids = [
    ...scene.__story.mossWalls.filter((w) => !w.open),
    ...scene.__story.mossBlocks.filter((m) => !m.destroyed),
  ];
  for (const m of solids) {
    const left = m.x - m.w / 2;
    const right = m.x + m.w / 2;
    const top = m.y - m.h / 2;
    const bottom = m.y + m.h / 2;
    const inside = pb.right > left + 1 && pb.left < right - 1 && pb.bottom > top + 1 && pb.top < bottom - 1;
    if (!inside) {
      if (pb.bottom > top + 1 && pb.top < bottom - 1) m.__playerSide = p.x < m.x ? -1 : 1;
      continue;
    }
    const side = m.__playerSide || (p.x < m.x ? -1 : 1);
    const dx = side < 0 ? left - pb.right - 1 : right - pb.left + 1;
    p.x += dx;
    pb.x += dx;
    if (Math.sign(pb.velocity.x) === -side) pb.setVelocityX(0);
  }
}

function updateStoryMossBlocks(scene) {
  guardStoryMossOverlap(scene);
  const player = scene.player;
  // Juice : l'ours prend son élan au-dessus d'un amas -> il se fissure et
  // tremble AVANT le fracas (la zone de coup est encore en attente).
  const pending = player.skillHitboxPendingRect;
  if (pending && player.skillHitboxId === 'ours') {
    for (const m of scene.__story.mossBlocks) {
      if (m.destroyed || m.cracked) continue;
      const rect = new Phaser.Geom.Rectangle(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
      if (Phaser.Geom.Intersects.RectangleToRectangle(pending, rect)) storyMossCrack(scene, m);
    }
  }
  const hitbox = player.getSkillHitbox && player.getSkillHitbox();
  if (!hitbox || player.activeSkillId !== 'ours') return;
  for (const m of scene.__story.mossBlocks) {
    if (m.destroyed) continue;
    const rect = new Phaser.Geom.Rectangle(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(hitbox, rect)) continue;
    m.destroyed = true;
    storySet(m.flag, true);
    removeMossBody(scene, m.body);
    storyMossBreak(scene, m);
    scene.events.emit('moss-destroyed', m);
  }
}

// Amas fissuré (juice, visuel seul) : art `mousse_amas_fissure` s'il existe,
// sinon fissures lumineuses dessinées par-dessus ; tremblement, éclats.
function storyMossCrack(scene, m) {
  m.cracked = true;
  const v = m.visual;
  if (!v || !v.active) return;
  const key = 'item-mousse_amas_fissure';
  if (v.setTexture && scene.textures.exists(key)) {
    const w = v.displayWidth;
    const h = v.displayHeight;
    const bottom = visibleBottomY(v);
    v.setTexture(key).setDisplaySize(w, h);
    setVisibleBottomY(v, bottom);
  } else {
    const g = scene.add.graphics({ x: m.x, y: m.y });
    const rnd = new Phaser.Math.RandomDataGenerator([`fissure-${m.x}`]);
    for (const [col, width] of [[0x10200f, 4], [0x9bff5a, 1.5]]) {
      g.lineStyle(width, col, 1);
      for (let k = 0; k < 4; k++) {
        let px = rnd.realInRange(-m.w / 4, m.w / 4);
        let py = -m.h / 2 + 10;
        g.beginPath();
        g.moveTo(px, py);
        for (let i = 0; i < 5; i++) {
          px += rnd.realInRange(-14, 14);
          py += m.h / 6;
          g.lineTo(px, py);
        }
        g.strokePath();
      }
    }
    if (scene.children.moveAbove) scene.children.moveAbove(g, v);
    m.crackGfx = g;
  }
  if (typeof juiceRender !== 'function') return;
  for (const o of [v, m.crackGfx].filter(Boolean)) {
    const j = juiceRender(o);
    scene.tweens.add({ targets: j.off, x: { from: -3, to: 3 }, duration: 45, yoyo: true, repeat: 5 });
  }
  spawnFx(scene, 'chip', m.x, m.y - m.h / 4, { count: 5, spread: m.w / 3, power: 0.5 });
  spawnFx(scene, 'dust', m.x, m.y + m.h / 2 - 6, { count: 4, spread: m.w / 2, power: 0.6, tint: [0x6f8f5a, 0x9bbf7a] });
  playSfx('moss_crack');
}

// Fracas (juice) : éclats, mottes, gouttes, onde, micro-pause et secousse ;
// l'amas gonfle une fraction de seconde puis s'efface.
function storyMossBreak(scene, m) {
  if (typeof spawnFx === 'function') {
    spawnFx(scene, 'mossBreak', m.x, m.y, { w: m.w, h: m.h });
    juiceHitStop(scene, 65);
    juiceShake(scene, 'heavy');
    playSfx('moss_break');
  } else {
    scene.cameras.main.shake(200, 0.008);
  }
  for (const o of [m.visual, m.crackGfx].filter((x) => x && x.active)) {
    scene.tweens.add({
      targets: o, alpha: 0, scaleX: o.scaleX * 1.12, scaleY: o.scaleY * 0.9, duration: 260, ease: 'Quad.easeOut',
      onComplete: () => o.destroy(),
    });
  }
}

function updateStoryCheckpoints(scene) {
  const player = scene.player;
  for (const c of scene.__story.checkpoints) {
    if (c.lit || Math.abs(player.x - c.x) > 40 || Math.abs(player.y - c.y) > 120) continue;
    for (const o of scene.__story.checkpoints) if (o.lit) { o.lit = false; o.draw(false); }
    c.lit = true;
    c.draw(true);
    // Juice : la lanterne s'allume avec un éclat et une gerbe de lueurs.
    if (typeof spawnFx === 'function') {
      juiceBurstImage(scene, 'glow', c.x, c.lampY, { size: 130, from: 0.2, to: 1.2, ms: 520, color: STORY_UI.vineLight, alpha: 0.85 });
      juiceShockRing(scene, c.x, c.lampY, { size: 90, ms: 420, color: STORY_UI.vineLight });
      spawnFx(scene, 'motes', c.x, c.lampY, { count: 12, spread: 10, power: 1.8, color: [STORY_UI.vineLight, 0xe8fff2, STORY_UI.pink] });
      playSfx('lantern_light');
    }
    scene.__story.checkpoint = { x: c.x, y: c.y };
    // La mort (cœurs à 0, cf. Player.hitByEnemy) ramène aussi ici.
    player.spawnX = c.x;
    player.spawnY = c.y - 4;
    showToast(scene, 'Point de reprise', 1200);
  }
}

// --- Chute dans le vide (clé de zone `fall`) --------------------------------
// Retour utilisateur : « quand on tombe dans le vide on doit passer dans le
// sol pour mourir, pas s'allonger en bas de l'écran ». Avant, le bas du monde
// physique (levelHeight) servait de sol invisible au joueur : Agarica s'y
// posait, était ramenée sur-le-champ au point sûr et, sur son dernier cœur, y
// jouait la pose couchée `death` -- souvent retombée au fond depuis un point
// sûr pris au ras du bord. Maintenant (règles de reprise inchangées) :
//   1. tant que la zone a une règle `fall`, le joueur n'a plus de bord bas
//      (bornes propres, cf. syncStoryFallBounds) : il traverse le bas du monde ;
//   2. ligne de chute franchie (mêmes seuils qu'avant) : chute engagée, monde
//      gelé, plus de contrôle ni de collision (Player.startFallOut) ; la caméra
//      reste dans ses bornes, donc au bas du niveau ;
//   3. Agarica sortie par le bas de l'écran : fondu au noir, la reprise
//      d'avant (cœur perdu au point sûr, lanterne, départ de zone ou
//      changement de scène), puis fondu d'ouverture.
const STORY_FALL_BOUNDS_EXTRA = 4000;
// Garde-fou : fondu même si elle n'a jamais quitté l'écran (caméra déplacée...).
const STORY_FALL_MAX_MS = 1400;
const STORY_FALL_FADE_OUT_MS = 220;
const STORY_FALL_FADE_IN_MS = 320;
// Ligne où elle disparaît dans une bande de liquide : un peu sous sa crête.
const STORY_FALL_LIQUID_SINK = 6;

// Bornes du joueur = celles du monde (relues à chaque image : des scripts les
// changent, cf. a2Ceiling), prolongées vers le bas s'il y a une règle `fall`.
// Sorties de bord (cf. updateEdgeOpenings, LevelKit) : le côté d'une sortie
// qu'Agarica a en face s'ouvre aussi ; tous les autres restent des murs.
function syncStoryFallBounds(scene, player, open) {
  const st = scene.__story;
  const body = player.body;
  const world = scene.physics.world.bounds;
  const edges = updateEdgeOpenings(scene, player);
  const anyEdge = edges && (edges.left || edges.right || edges.top || edges.bottom);
  if (!open && !anyEdge) {
    if (body.customBoundsRectangle !== world) body.setBoundsRectangle(null);
    return;
  }
  if (!st.fallBounds) st.fallBounds = new Phaser.Geom.Rectangle();
  let { x, y, width, height } = world;
  if (open) height += STORY_FALL_BOUNDS_EXTRA;
  if (anyEdge) {
    const margin = EDGE_EXIT_OPEN_MARGIN;
    if (edges.left) { x -= margin; width += margin; }
    if (edges.right) width += margin;
    if (edges.top) { y -= margin; height += margin; }
    if (edges.bottom && !open) height += margin;
  }
  st.fallBounds.setTo(x, y, width, height);
  if (body.customBoundsRectangle !== st.fallBounds) body.setBoundsRectangle(st.fallBounds);
}

// Point sûr : TOUTE la largeur des pieds (forme humaine, celle de la reprise)
// doit reposer sur un corps statique (sol, plateforme, mousse ; pas l'eau).
// Avec `blocked.down` seul, il était pris au ras du bord, le corps à moitié
// dans le vide : Agarica reprenait sur la lèvre du trou (et y retombait
// parfois aussitôt -- un cœur perdu par boucle jusqu'à la mort). Demi-largeur
// testée : corps humain (25 px) décalé au plus de AGARICA_BODY_FORWARD_SHIFT
// (14 px, cf. Player.js) vers l'avant, soit ~27 px de part et d'autre du centre.
const STORY_SAFE_FEET_HALF = 28;
function storyFeetSupported(scene, player) {
  return storyStandOk(scene, player.x, player.body.bottom);
}

// Agarica (forme humaine) tiendrait debout ici : appui sous toute la largeur
// des pieds.
function storyStandOk(scene, x, feetY) {
  return storySupportedAt(scene, x - STORY_SAFE_FEET_HALF, feetY)
    && storySupportedAt(scene, x, feetY)
    && storySupportedAt(scene, x + STORY_SAFE_FEET_HALF, feetY);
}

function storySupportedAt(scene, x, feetY) {
  if (typeof scene.physics.overlapRect !== 'function') return true;
  const water = scene.water || [];
  return scene.physics.overlapRect(x - 1, feetY - 2, 2, 8, false, true)
    .some((b) => !water.includes(b.gameObject));
}

// Haut du premier appui statique sous (x, y), à `maxDrop` px au plus (null
// sinon) : le départ de zone est souvent posé un peu au-dessus du sol.
function storyGroundYBelow(scene, x, y, maxDrop = 160) {
  if (typeof scene.physics.overlapRect !== 'function') return null;
  const water = scene.water || [];
  let best = null;
  for (const b of scene.physics.overlapRect(x - 1, y - 4, 2, maxDrop, false, true)) {
    if (water.includes(b.gameObject) || b.top < y - 4) continue;
    if (best === null || b.top < best) best = b.top;
  }
  return best;
}

// Rien de solide juste au-dessus des pieds (pas dans un mur ou une marche).
function storyClearAt(scene, x, feetY) {
  if (typeof scene.physics.overlapRect !== 'function') return true;
  return scene.physics.overlapRect(x - 1, feetY - 40, 2, 32, false, true).length === 0;
}

// Xara posée à son ancre au sol (x + XARA_GROUND_OFFSET_X, à gauche
// d'Agarica) y tient debout : appui sous elle, pas de mur.
const STORY_XARA_HALF = 12;
function storyXaraAnchorX(x) {
  return x + (typeof XARA_GROUND_OFFSET_X === 'number' ? XARA_GROUND_OFFSET_X : -46);
}
function storyXaraStandOk(scene, x, feetY) {
  return storySupportedAt(scene, x - STORY_XARA_HALF, feetY)
    && storySupportedAt(scene, x + STORY_XARA_HALF, feetY)
    && storyClearAt(scene, x, feetY);
}

function updateStoryFall(scene) {
  const player = scene.player;
  const st = scene.__story;
  const fall = st.fall;
  if (st.fallOut) return;
  syncStoryFallBounds(scene, player, !!fall);
  const worldBottom = scene.physics.world.bounds.bottom;
  // Dernier appui sûr (pas le bas du monde, pas déjà sous la ligne de chute).
  // `blocked.down` SEUL (correctif FF1) : `touching.down` est aussi levé par
  // un simple overlap (corbeau en piqué, ennemi...) -- le point sûr était
  // alors pris en plein vide, et chaque chute y ramenait Agarica, qui
  // retombait aussitôt (un cœur perdu par boucle jusqu'à la mort). Tous les
  // appuis réels (sol, plateformes, murs de mousse) sont statiques et lèvent
  // `blocked.down`.
  const onGround = player.body.blocked.down;
  const atWorldBottom = player.body.bottom >= worldBottom - 1;
  if (onGround && !atWorldBottom && (!fall || player.y < fall.y - 40) && storyFeetSupported(scene, player)) {
    st.safePos = { x: player.x, y: player.y };
  }
  if (!fall) return;
  // Fondu de sortie lancé, ou trou qui mène ailleurs (sortie basse) : ce n'est
  // pas une chute, la sortie de bord prend le relais sous l'écran.
  if (scene.__transitioningAway || edgeExitBelowPlayer(scene, player)) return;
  // Mêmes seuils qu'avant : la ligne `fall.y`, ou le bas du monde physique
  // (`levelHeight`, 540, plus haut que `fall.y` = 600 dans plusieurs zones).
  // `player.y` (pieds) et non le corps : celui-ci n'est recalé qu'au pas de
  // physique suivant une téléportation (reprise, réapparition).
  if (player.y <= Math.min(fall.y, worldBottom - 1)) return;
  // Mort par dégâts en cours (cœurs à 0) : sa réapparition ramène Agarica
  // (en l'air, cf. storyWatchAirDeath, qui lance lui-même la chute).
  if (player.hearts <= 0) return;
  startStoryFallOut(scene);
}

// `opts.dead` : dernier cœur déjà perdu en l'air (cf. storyWatchAirDeath) --
// la reprise est alors celle de la mort (départ ou lanterne, cœurs rechargés).
function startStoryFallOut(scene, opts = {}) {
  const st = scene.__story;
  const fo = {
    phase: 'plunge', t: 0, visit: scene.__storyVisit, scripted: !!scene.__playerScripted, done: false, dead: !!opts.dead,
  };
  st.fallOut = fo;
  // Monde gelé le temps de la chute et du fondu (ennemis, déclencheurs,
  // lanternes, sorties, touches) ; `__playerScripted` garde son élan
  // horizontal (cf. freezeWorldBodies). Les hooks étant gelés, la suite est
  // menée par l'événement 'postupdate' de la scène : APRÈS le report du corps
  // sur le sprite (postUpdate d'Arcade). Téléportée avant, Agarica recevait
  // en plus le déplacement de sa chute (~15 px à 900 px/s), se retrouvait
  // enfoncée dans le sol du point de reprise et passait au travers.
  scene.__cutsceneLock = (scene.__cutsceneLock || 0) + 1;
  scene.__playerScripted = true;
  hideStoryPrompt(scene);
  scene.player.startFallOut();
  storyFallSinkMask(scene, fo);
  fo.tick = (time, delta) => stepStoryFallOut(scene, fo, delta);
  fo.cleanup = () => stopStoryFallOut(scene, fo);
  scene.events.on('postupdate', fo.tick);
  scene.events.once('shutdown', fo.cleanup);
}

// Bande `liquidFloor` sous elle (mousse toxique, brume du vide) : la partie
// d'Agarica passée sous la crête est masquée, elle s'enfonce dedans au lieu
// de tomber devant (la bande est dessinée derrière les personnages).
function storyFallSinkMask(scene, fo) {
  const liquid = scene.__story.liquid;
  const player = scene.player;
  if (!liquid || player.x < liquid.x1 || player.x > liquid.x2) return;
  const y = liquid.y + STORY_FALL_LIQUID_SINK;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillRect(-100000, y - 200000, 200000, 200000);
  fo.maskGfx = g;
  fo.vanishY = y;
  player.setMask(g.createGeometryMask());
}

function storyFallClearMask(scene, fo) {
  if (!fo.maskGfx) return;
  if (scene.player && scene.player.active) scene.player.clearMask(true);
  fo.maskGfx.destroy();
  fo.maskGfx = null;
}

function stopStoryFallOut(scene, fo) {
  scene.events.off('postupdate', fo.tick);
  scene.events.off('shutdown', fo.cleanup);
  storyFallClearMask(scene, fo);
  if (fo.done) return;
  fo.done = true;
  if (scene.__story && scene.__story.fallOut === fo) scene.__story.fallOut = null;
  if (scene.__storyVisit !== fo.visit) return;
  scene.__cutsceneLock = Math.max(0, (scene.__cutsceneLock || 0) - 1);
  scene.__playerScripted = fo.scripted;
}

function stepStoryFallOut(scene, fo, delta) {
  const player = scene.player;
  if (fo.done || fo.visit !== scene.__storyVisit || !player || !player.active || !player.body) {
    stopStoryFallOut(scene, fo);
    return;
  }
  fo.t += Math.min(delta || 16, 50);
  const cam = scene.cameras.main;
  storyFallHoldXara(scene);
  if (fo.phase === 'plunge') {
    // Sortie par le bas de l'écran : le haut de la silhouette passe sous le
    // bas de la caméra (restée au bas du niveau, cf. ses bornes), ou sous la
    // crête du liquide où elle s'enfonce.
    const vanishY = Math.min(cam.worldView.bottom, fo.vanishY ?? Infinity);
    const gone = player.getBounds().top >= vanishY;
    if (!gone && fo.t < STORY_FALL_MAX_MS) return;
    const fall = scene.__story.fall;
    // Morte (cœurs à 0) : jamais vers une autre zone, réapparition sur place.
    if (!fo.dead && fall && fall.mode === 'scene' && fall.scene) {
      const entry = storyZoneEntry(fall.scene);
      goToScene(scene, entry ? entry.scene : fall.scene, fall.data);
      // Fondu de sortie de zone lancé : rien d'autre à faire ici.
      if (scene.__transitioningAway) { stopStoryFallOut(scene, fo); return; }
    }
    fo.phase = 'fade';
    fo.t = 0;
    cam.fadeOut(STORY_FALL_FADE_OUT_MS, ...FADE_COLOR);
    return;
  }
  // Écran noir : reprise et fondu d'ouverture. La main (et les hooks) ne
  // reviennent qu'une fois le corps physique recalé sur le point de reprise
  // (phase 'settle') : avant, update() et les hooks voyaient encore l'ancien
  // corps, sous l'écran.
  if (fo.phase === 'fade') {
    if (fo.t < STORY_FALL_FADE_OUT_MS + 30) return;
    storyFallClearMask(scene, fo);
    storyFallRespawn(scene, fo);
    cam.fadeIn(STORY_FALL_FADE_IN_MS, ...FADE_COLOR);
    fo.phase = 'settle';
    fo.t = 0;
    return;
  }
  // Recalage au pas de physique suivant, plus tard si le micro-arrêt du cœur
  // perdu (juiceHitStop) a mis la physique en pause.
  const synced = !scene.physics.world.isPaused && Math.abs(player.body.bottom - player.y) < 8;
  if (!synced && fo.t < 400) return;
  stopStoryFallOut(scene, fo);
}

// Xara pendant la chute : comme les ennemis gelés (cf. freezeWorldBodies),
// plus d'élan horizontal -- sinon elle continuait de marcher vers le vide.
function storyFallHoldXara(scene) {
  const xara = scene.xara;
  if (xara && xara.active && xara.body) xara.body.setVelocityX(0);
}

// Xara remise au sol, posée en (x, feetY) : état 'ground' imposé, quel que
// soit son état. Sans ça, en balancier (Agarica en loup, singe, aigle ou
// papillon au moment de la chute), la reprise en forme humaine la faisait
// basculer vers le sol en tombant SUR PLACE (Xara.update, `fallingInPlace`),
// c'est-à-dire au-dessus du vide. Historique oublié : elle visait la
// position d'Agarica d'il y a 300 ms, encore au bord du trou.
// `reset` : téléportation pendant update() (avant le report du corps sur le
// sprite, cf. startStoryFallOut) -- body.reset annule le déplacement du pas.
function storyPlaceXaraOnGround(scene, x, feetY, { reset = false } = {}) {
  const xara = scene.xara;
  if (!xara || !xara.active || !xara.body) return;
  xara.transitionActive = false;
  xara.transitionTarget = null;
  xara.state = 'ground';
  xara.swingPivotX = null;
  xara.swingBlendFromX = null;
  xara.swingPeakConsumed = false;
  xara.climbUntil = 0;
  xara.bigHeightGapSince = null;
  xara.airVelX = 0;
  if (Array.isArray(xara.history)) xara.history.length = 0;
  xara.setRotation(0);
  if (typeof xara.drawThread === 'function') xara.drawThread(0);
  if (typeof xara.drawBubble === 'function') xara.drawBubble(0);
  xara.body.setAllowGravity(true);
  if (reset) xara.body.reset(x, feetY - 2);
  else xara.setPosition(x, feetY - 2);
  xara.body.setVelocity(0, 0);
}

// Reprise de Xara avec Agarica, sous le fondu : posée à son ancre au sol (où
// elle ne bouge plus) si elle y tient, sinon à côté d'Agarica, du côté où il
// y a un appui.
function storyFallRegroupXara(scene, player, feetY) {
  const xara = scene.xara;
  if (!xara || !xara.active || !xara.body) return;
  const ax = storyXaraAnchorX(player.x);
  const mirror = player.x + (player.x - ax);
  const x = [ax, mirror, player.x].find((sx) => storyXaraStandOk(scene, sx, feetY)) ?? player.x;
  storyPlaceXaraOnGround(scene, x, feetY);
}

// Point de reprise décalé (vers la droite, de 72 px au plus, sur le même
// appui) pour que l'ancre de Xara, 46 px à GAUCHE d'Agarica, ne tombe pas
// au-dessus du vide : point sûr ou lanterne au ras d'un bord gauche, Xara
// partait sinon vers son ancre et sautait dans le trou.
const STORY_XARA_NUDGE_MAX = 72;
function storyFallNudgeForXara(scene, player, feetY) {
  const xara = scene.xara;
  if (!xara || !xara.active || !xara.visible) return;
  const ok = (x) => storyStandOk(scene, x, feetY) && storyClearAt(scene, x, feetY)
    && storyXaraStandOk(scene, storyXaraAnchorX(x), feetY);
  if (ok(player.x)) return;
  for (let d = 4; d <= STORY_XARA_NUDGE_MAX; d += 4) {
    if (ok(player.x + d)) { player.setPosition(player.x + d, player.y); return; }
  }
}

// Reprise d'avant, inchangée : 'respawn' → dernière lanterne, sinon dernier
// point sûr, sinon départ ; 'hurt' → un cœur de moins au point sûr (rien
// pendant l'invulnérabilité d'un coup récent) et, sur le dernier cœur,
// réapparition au point de reprise (lanterne ou départ), sans pose couchée.
// Morte en l'air (`fo.dead`, cf. storyWatchAirDeath) : réapparition de la
// mort (départ ou lanterne, cœurs rechargés), sans 2e cœur perdu.
function storyFallRespawn(scene, fo = {}) {
  const st = scene.__story;
  const player = scene.player;
  const fall = st.fall || {};
  const hurt = fall.mode === 'hurt';
  player.endFallOut();
  if (fo.dead) {
    player.reviveAfterAirDeath();
  } else {
    // Invulnérabilité d'un coup récent seulement (`hitInvulnerable`) : celle de
    // la sortie d'un dialogue n'épargne pas une chute (cf. Player.hitByEnemy).
    const hitInv = player.hitInvulnerable !== undefined ? player.hitInvulnerable : player.isInvulnerable;
    const fatal = hurt && !hitInv && player.hearts <= 1;
    const back = fatal ? { x: player.spawnX, y: player.spawnY + 4 }
      : (fall.mode === 'respawn' && st.checkpoint) || st.safePos || { x: player.spawnX, y: player.spawnY };
    player.setPosition(back.x, back.y - 4);
    if (hurt) player.hitByEnemy({ fall: true });
  }
  // Sol sous le point de reprise (le départ de zone peut être en l'air).
  const feetY = storyGroundYBelow(scene, player.x, player.y) ?? player.y;
  storyFallNudgeForXara(scene, player, feetY);
  storyFallRegroupXara(scene, player, feetY);
  // Caméra recadrée d'un coup sur Agarica (zone morte verticale comprise).
  if (typeof cameraFollowPlayer === 'function') cameraFollowPlayer(scene, { snap: true });
  else scene.cameras.main.startFollow(player, true, 1, 1);
}

// --- Dernier cœur perdu en l'air (zone avec règle `fall`) -------------------
// Appelée par Player.hitByEnemy : la pose couchée `death` est réservée aux
// morts au sol. Monde gelé (ni ennemi ni touche), Agarica retombe dans sa pose
// de coup ; posée → fin du coup habituelle (Player.finishHit : pose couchée au
// sol puis réapparition) ; ligne de chute franchie (mêmes seuils que
// updateStoryFall) → chute dans le vide, reprise de la mort sous le fondu.
// Renvoie false (comportement d'avant) hors zone à vide ou chute déjà engagée.
// Garde-fou : ni posée ni tombée au bout de STORY_AIR_DEATH_MAX_MS → fin du
// coup sur place, comme avant.
const STORY_AIR_DEATH_MAX_MS = 2500;
function storyWatchAirDeath(scene) {
  const st = scene.__story;
  const player = scene.player;
  if (!st || !st.fall || st.fallOut || st.airDeath || !player || !player.body) return false;
  const ad = { t: 0, visit: scene.__storyVisit, done: false };
  st.airDeath = ad;
  scene.__cutsceneLock = (scene.__cutsceneLock || 0) + 1;
  hideStoryPrompt(scene);
  ad.tick = (time, delta) => stepStoryAirDeath(scene, ad, delta);
  ad.cleanup = () => stopStoryAirDeath(scene, ad);
  scene.events.on('postupdate', ad.tick);
  scene.events.once('shutdown', ad.cleanup);
  return true;
}

function stopStoryAirDeath(scene, ad) {
  scene.events.off('postupdate', ad.tick);
  scene.events.off('shutdown', ad.cleanup);
  if (ad.done) return;
  ad.done = true;
  if (scene.__story && scene.__story.airDeath === ad) scene.__story.airDeath = null;
  if (scene.__storyVisit !== ad.visit) return;
  scene.__cutsceneLock = Math.max(0, (scene.__cutsceneLock || 0) - 1);
}

function stepStoryAirDeath(scene, ad, delta) {
  const player = scene.player;
  const fall = scene.__story && scene.__story.fall;
  if (ad.done || ad.visit !== scene.__storyVisit || !player || !player.active || !player.body) {
    stopStoryAirDeath(scene, ad);
    return;
  }
  ad.t += Math.min(delta || 16, 50);
  storyFallHoldXara(scene);
  const worldBottom = scene.physics.world.bounds.bottom;
  if (fall && player.y > Math.min(fall.y, worldBottom - 1)) {
    stopStoryAirDeath(scene, ad);
    startStoryFallOut(scene, { dead: true });
    return;
  }
  if (player.body.blocked.down || ad.t >= STORY_AIR_DEATH_MAX_MS || !fall) {
    stopStoryAirDeath(scene, ad);
    player.finishHit(true);
  }
}

// --- Filet de sécurité : Xara tombée dans le vide ---------------------------
// Xara n'a pas de bord bas (elle n'est pas retenue par les bornes du monde) :
// tombée dans un trou (saut raté, ancre au-dessus du vide...), elle tombait
// sans fin et ne revenait jamais. Une fois loin sous le niveau, elle est
// reposée à son ancre au sol dès qu'Agarica est posée, en forme humaine, et
// que l'ancre a un appui (sinon elle y retomberait aussitôt) ; d'ici là, elle
// reste hors de vue. En balancier ou en bulle, elle revient d'elle-même.
const STORY_XARA_RESCUE_BELOW = 100;
function updateStoryXaraRescue(scene) {
  const xara = scene.xara;
  const player = scene.player;
  if (!xara || !xara.active || !xara.body || !xara.visible) return;
  if (xara.state !== 'ground' || xara.transitionActive) return;
  if (xara.y <= scene.physics.world.bounds.bottom + STORY_XARA_RESCUE_BELOW) return;
  if (!player.body.blocked.down || player.form !== 'agarica' || player.fallingOut) return;
  const ax = storyXaraAnchorX(player.x);
  if (!storyXaraStandOk(scene, ax, player.y)) return;
  storyPlaceXaraOnGround(scene, ax, player.y, { reset: true });
  if (typeof spawnFx === 'function') {
    spawnFx(scene, 'motes', ax, player.y - 14, { count: 8, spread: 10, power: 1.2, color: [STORY_UI.vineLight, 0xe8fff2] });
  }
}

function updateStoryKeys(scene) {
  const st = scene.__story;
  if (!st.keys) {
    st.keys = {
      inventory: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      map: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
    };
  }
  // Ctrl+I reste la bascule de debug physique (cf. setupDebugToggle).
  if (Phaser.Input.Keyboard.JustDown(st.keys.inventory) && !st.keys.inventory.ctrlKey) openInventory(scene);
  else if (Phaser.Input.Keyboard.JustDown(st.keys.map)) {
    // Carte liée à l'objet de l'histoire (STORY_MAP_ITEM) : sans lui, un mot
    // plutôt que rien (les découvertes, elles, s'enregistrent déjà).
    if (storyMapAvailable()) openMap(scene);
    else showToast(scene, 'Tu n\'as pas encore de carte.', 1800);
  }
}

function openStoryOverlay(scene, key) {
  if (scene.scene.isActive(key)) return;
  hideStoryPrompt(scene);
  if (scene.player && scene.player.body) scene.player.setVelocityX(0);
  scene.scene.launch(key, { parentKey: scene.scene.key });
  scene.scene.bringToTop(key);
}

function openInventory(scene) { openStoryOverlay(scene, 'InventoryScene'); }
function openMap(scene) { openStoryOverlay(scene, 'MapScene'); }

// Xara n'est pas retenue par les bornes du monde et son ancre est à gauche
// d'Agarica : arrivée par le bord gauche (x 44), l'ancre sort du niveau, Xara
// tombait hors de la zone et ne revenait qu'une fois Agarica éloignée du bord.
function updateStoryXaraInZone(scene) {
  const xara = scene.xara;
  if (!xara || !xara.active || !xara.body || xara.state !== 'ground' || xara.transitionActive) return;
  const over = 0 - xara.body.left;
  if (over <= 0) return;
  xara.x += over;
  if (xara.body.velocity.x < 0) xara.body.velocity.x = 0;
}

function storyUpdateHook(scene, time, delta) {
  if (!scene.__story || !scene.player || !scene.player.body) return;
  updateStoryFall(scene);
  updateStoryXaraInZone(scene);
  updateStoryXaraRescue(scene);
  // Carte du monde : blocs parcourus, en attente du prochain feu de camp.
  storyMapRecord(scene);
  updateStoryCheckpoints(scene);
  updateStoryLights(scene);
  updateStoryMossBlocks(scene);
  updateStoryTriggers(scene);
  if (isWorldFrozen(scene)) return;
  updateStoryInteractables(scene);
  updateStoryKeys(scene);
  if (scene.__zoneScript && scene.__zoneScript.update) scene.__zoneScript.update(scene, time, delta);
}
LEVEL_UPDATE_HOOKS.push(storyUpdateHook);
