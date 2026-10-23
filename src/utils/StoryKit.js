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

function attachPlayManifest(sprite, id) {
  sprite.manifestId = id;
  sprite.playManifest = function playManifest(anim, ignoreIfPlaying = true) {
    const key = `${id}-${anim}`;
    if (!this.scene || !this.scene.anims.exists(key)) return this;
    this.currentManifestAnim = anim;
    // Sortie d'une pose de repos figée (cf. storyNpcRest).
    this.__restPaused = false;
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
  { zone: 'bosquet', scene: 'BosquetScene', region: 'bosquet', name: "Bosquet d'Émeraude" },
  { zone: 'foret_sombre_1', scene: 'ForetSombre1Scene', region: 'foret_sombre', name: 'Forêt sombre' },
  { zone: 'foret_sombre_2', scene: 'ForetSombre2Scene', region: 'foret_sombre', name: 'Forêt sombre — les ravins' },
  { zone: 'grand_arbre_racines', scene: 'GrandArbreRacinesScene', region: 'grand_arbre', name: 'Racines du grand arbre' },
  { zone: 'grand_arbre_arene', scene: 'GrandArbreAreneScene', region: 'grand_arbre', name: 'Cime du grand arbre' },
  { zone: 'monde_spirituel', scene: 'MondeSpirituelScene', region: 'grand_arbre', name: 'Monde spirituel' },
  { zone: 'epreuve_singe', scene: 'EpreuveSingeScene', region: 'grand_arbre', name: 'Épreuve du singe' },
  { zone: 'foret_flottante_1', scene: 'ForetFlottante1Scene', region: 'foret_flottante', name: 'Forêt flottante' },
  { zone: 'foret_flottante_2', scene: 'ForetFlottante2Scene', region: 'foret_flottante', name: 'Îles flottantes' },
  { zone: 'clairiere_plante', scene: 'ClairierePlanteScene', region: 'foret_flottante', name: 'Clairière de la plante' },
  { zone: 'hutte_morgat', scene: 'HutteMorgatScene', region: 'foret_flottante', name: 'Hutte de Morgat' },
  { zone: 'foret_corrompue_1', scene: 'ForetCorrompue1Scene', region: 'foret_corrompue', name: 'Forêt corrompue' },
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
    return parsed && parsed.values ? parsed : null;
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
  saveGame(scene, { silent: true });
}

// ---------------------------------------------------------------------------
// Inventaire (objets-clés de l'histoire)
// ---------------------------------------------------------------------------
const ITEM_INFO = {
  talisman_ours: { name: "Talisman de l'ours", desc: "Confié par ton père avant ton départ. Il semble endormi… mais il pulse parfois d'une chaleur sourde." },
  idole: { name: 'Idole du bosquet', desc: "L'idole sacrée du bosquet d'Émeraude, sculptée dans une pierre verte. Elle n'aurait jamais dû quitter son autel." },
  talisman_singe: { name: 'Talisman du singe', desc: "Récompense de l'épreuve des lianes. Il renferme une compétence : lancer des pierres en cloche." },
  carte_geralt: { name: 'Carte de Geralt', desc: 'Incomplète, couverte de flèches contradictoires et de traces de pinces. Touche M pour la consulter.' },
  totem_poche_casse: { name: 'Totem de poche cassé', desc: 'Trouvé dans la hutte de Morgat. Fendu, éteint… À quoi peut-il bien servir ?' },
  totem_poche_actif: { name: 'Totem de poche', desc: "Ravivé par l'antidote. Il donne accès à la compétence du papillon : soigner au lieu de détruire." },
  fleur_resistante: { name: 'Fleur résistante', desc: 'Une fleur autour de laquelle la mousse refuse de pousser. Une guérisseuse saurait quoi en faire.' },
  repulsif: { name: 'Répulsif à mousse', desc: 'Préparé par Morgat. Quelques gouttes suffisent à dissoudre un mur de mousse (E devant le mur).' },
  bocal_antidote: { name: "Bocal d'antidote", desc: 'Apporté par les papillons dans le noir. Le liquide brille doucement.' },
  note_geralt: { name: 'Note de Geralt', desc: "« Si tu lis ceci, c'est que je suis passé par là. Ou que je l'ai perdue. Clak, rends-moi ce crayon. »" },
};

function itemInfo(id) {
  return ITEM_INFO[id] || { name: id, desc: '' };
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
  return !already;
}

const STORY_FORM_INFO = {
  hasWolfForm: { type: 'wolf', name: 'Forme du loup', desc: 'Sprint (Shift ou double appui) : cours, franchis les ravins, suis les pistes.' },
  // Sans forme aérienne, Agarica n'a qu'un saut : c'est la forme qui donne le double saut.
  hasEagleForm: { type: 'eagle', name: "Forme de l'aigle", desc: 'Donne le double saut (plus haut) et le plané.' },
  hasMonkeyForm: { type: 'monkey', name: 'Forme du singe', desc: 'Donne le double saut ; accroche aux lianes et balancement.' },
  hasOctopusForm: { type: 'octopus', name: 'Forme de la pieuvre', desc: 'Nage automatique.' },
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
    showStoryBanner(scene, { kicker: 'Nouvelle forme', title: info.name, desc: info.desc, itemId: `form_icone_${info.type === 'monkey' ? 'singe' : info.type}`, color: 0xc77dff });
  }
  return true;
}

// ---------------------------------------------------------------------------
// Conditions `requires` / `forbids`
// ---------------------------------------------------------------------------
// `{flag: valeur, item: 'id' | ['id'…], noItem: 'id'}` : toutes les clés
// doivent être vraies. `true`/`false` comparent la valeur « vraie/fausse »
// du flag (un flag absent vaut faux), toute autre valeur est comparée strictement.
function storyConditionPart(key, expected) {
  if (key === 'item') return [].concat(expected).every((id) => inventoryHas(id));
  if (key === 'noItem') return [].concat(expected).every((id) => !inventoryHas(id));
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

// HUD — art Codex, appelé par drawHud (LevelKit.js) à chaque frame : cœurs
// `hud_coeur` / `hud_coeur_vide` et icônes des compétences équipées
// (`skill_icone_*`, lettre de la touche en pastille). Images créées une fois
// par visite puis seulement mises à jour (le Graphics du HUD, lui, est
// redessiné chaque frame). Renvoie ce que drawHud ne doit PAS dessiner :
// { hearts: bool, skills: [bool, bool, bool] } (repli dessiné sans l'art).
const HUD_ART_HEART_H = 24;
const HUD_ART_SKILL_SIZE = 40;

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
      const key = i < player.hearts ? 'item-hud_coeur' : 'item-hud_coeur_vide';
      if (img.texture.key !== key) img.setTexture(key);
      img.setScale(HUD_ART_HEART_H / img.height);
      img.setPosition(HUD_MARGIN + HUD_HEART_SIZE / 2 + i * (HUD_HEART_SIZE + HUD_HEART_GAP), HUD_MARGIN + HUD_HEART_SIZE / 2);
    });
  }

  const skillY = scene.scale.height - HUD_MARGIN - HUD_SKILL_SIZE / 2;
  HUD_SKILL_LABELS.forEach((label, i) => {
    const id = player.skillSlots[i];
    const def = id && typeof SKILL_DEFS !== 'undefined' ? SKILL_DEFS[id] : null;
    const key = def ? storyHudSkillIconKey(id) : null;
    const has = !!key && scene.textures.exists(key);
    let slot = art.skills[i];
    if (has && !slot) {
      const badge = scene.add.graphics().setScrollFactor(0).setDepth(1002);
      badge.fillStyle(STORY_UI.night, 0.95);
      badge.fillCircle(0, 0, 8);
      badge.lineStyle(1.5, STORY_UI.vineLight, 0.9);
      badge.strokeCircle(0, 0, 8);
      slot = art.skills[i] = {
        icon: scene.add.image(0, 0, key).setScrollFactor(0).setDepth(1001),
        badge,
        letter: scene.add.text(0, 0, label, {
          fontFamily: 'sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#ffe9f5',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1003),
      };
    }
    if (slot) for (const o of [slot.icon, slot.badge, slot.letter]) o.setVisible(has);
    const text = scene.hudSkillTexts && scene.hudSkillTexts[i];
    if (text) text.setVisible(!has);
    if (!has) return;
    result.skills[i] = true;
    const cx = HUD_MARGIN + HUD_SKILL_SIZE / 2 + i * (HUD_SKILL_SIZE + HUD_SKILL_GAP);
    if (slot.icon.texture.key !== key) slot.icon.setTexture(key);
    slot.icon.setPosition(cx, skillY).setScale(HUD_ART_SKILL_SIZE / Math.max(slot.icon.width, slot.icon.height));
    // Même règle que drawHud : grisée en recharge ou sans assez d'énergie.
    const unavailable = scene.time.now < player.skillCooldownEndTime || player.energy < def.cost;
    slot.icon.setAlpha(unavailable ? HUD_SKILL_UNAVAILABLE_ALPHA : 1);
    slot.badge.setPosition(cx + 14, skillY + 14);
    slot.letter.setPosition(cx + 14, skillY + 14);
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

function showStoryBanner(scene, { kicker, title, desc = '', itemId = null, color = STORY_UI.pink }) {
  const now = scene.time.now;
  const startAt = Math.max(now, scene.__storyBannerFreeAt || 0);
  scene.__storyBannerFreeAt = startAt + STORY_BANNER_MS + 200;
  scene.time.delayedCall(startAt - now, () => {
    const w = 460;
    const h = 104;
    const x = (scene.scale.width - w) / 2;
    const y = 70;
    const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(2100).setAlpha(0);
    const g = scene.add.graphics();
    drawStoryPanel(g, x, y, w, h, { seed: 3 });
    c.add(g);
    let textX = x + 24;
    if (itemId) {
      const ringX = x + 58;
      const ringY = y + h / 2;
      const ring = scene.add.graphics();
      ring.fillStyle(STORY_UI.nightSoft, 1);
      ring.fillCircle(ringX, ringY, 36);
      ring.lineStyle(2, color, 0.9);
      ring.strokeCircle(ringX, ringY, 36);
      c.add(ring);
      c.add(addItemIcon(scene, ringX, ringY, itemId, 56));
      textX = x + 110;
    }
    const kick = scene.add.text(textX, y + 14, kicker.toUpperCase(), {
      fontFamily: 'sans-serif', fontSize: '12px', color: colorToHex(color), fontStyle: 'bold',
    });
    if (kick.setLetterSpacing) kick.setLetterSpacing(2);
    c.add(kick);
    c.add(scene.add.text(textX, y + 32, title, {
      fontFamily: STORY_UI.serif, fontSize: '21px', color: STORY_UI.text, fontStyle: 'bold',
    }));
    if (desc) {
      c.add(scene.add.text(textX, y + 60, desc, {
        fontFamily: 'sans-serif', fontSize: '12px', color: STORY_UI.textSoft,
        wordWrap: { width: x + w - textX - 18 }, lineSpacing: 2,
      }));
    }
    c.y = -12;
    scene.tweens.add({ targets: c, alpha: 1, y: 0, duration: 300, ease: 'Back.Out' });
    scene.tweens.add({
      targets: c, alpha: 0, duration: 400, delay: STORY_BANNER_MS - 400,
      onComplete: () => c.destroy(),
    });
  });
}

// Petit texte informatif en haut de l'écran (indices de Xara, messages).
// En haut de l'écran (correctif : à y 318, juste au-dessus d'Agarica, il
// recouvrait les invites « E : … » affichées sur les PNJ/objets proches).
// Sous le bord haut, entre le HUD (en haut à gauche) et les bandeaux (y 70).
const STORY_TOAST_Y = 42;

function showToast(scene, text, ms = 2600) {
  if (scene.__storyToast && scene.__storyToast.active) scene.__storyToast.destroy();
  const t = scene.add.text(scene.scale.width / 2, STORY_TOAST_Y, text, {
    fontFamily: 'sans-serif', fontSize: '15px', color: STORY_UI.text, align: 'center',
    backgroundColor: '#2a1f45', padding: { x: 12, y: 7 }, wordWrap: { width: 590 }, // ne déborde pas sur le HUD
  }).setOrigin(0.5).setScrollFactor(0).setDepth(2050).setAlpha(0);
  scene.__storyToast = t;
  scene.tweens.add({ targets: t, alpha: 1, duration: 200 });
  scene.tweens.add({ targets: t, alpha: 0, duration: 350, delay: Math.max(400, ms - 350), onComplete: () => t.destroy() });
  return t;
}

// Carte de chapitre / nom de zone. Promesse résolue une fois disparue.
function showTitleCard(scene, title, sub, { hold = 1600 } = {}) {
  return new Promise((resolve) => {
    const { width } = scene.scale;
    const y = 225;
    const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(2200).setAlpha(0);
    const titleText = scene.add.text(width / 2, y, title, {
      fontFamily: STORY_UI.serif, fontSize: '36px', color: '#ffe9f5', fontStyle: 'bold',
      stroke: '#15101f', strokeThickness: 6, padding: { x: 20, y: 16 },
    }).setOrigin(0.5);
    titleText.setShadow(0, 0, '#ff9fc9', 14, true, true);
    const half = Math.min(320, titleText.width / 2 + 60);
    const g = scene.add.graphics();
    g.lineStyle(2, STORY_UI.vineLight, 0.8);
    g.lineBetween(width / 2 - half, y + 30, width / 2 - 12, y + 30);
    g.lineBetween(width / 2 + 12, y + 30, width / 2 + half, y + 30);
    g.fillStyle(STORY_UI.pink, 1);
    g.fillTriangle(width / 2, y + 23, width / 2 + 7, y + 30, width / 2, y + 37);
    g.fillTriangle(width / 2, y + 23, width / 2 - 7, y + 30, width / 2, y + 37);
    c.add([g, titleText]);
    if (sub) {
      c.add(scene.add.text(width / 2, y + 52, sub, {
        fontFamily: STORY_UI.serif, fontSize: '17px', color: '#c9b8f0', fontStyle: 'italic',
        stroke: '#15101f', strokeThickness: 4,
      }).setOrigin(0.5));
    }
    scene.tweens.add({ targets: c, alpha: 1, duration: 500 });
    scene.tweens.add({
      targets: c, alpha: 0, duration: 600, delay: 500 + hold,
      onComplete: () => { c.destroy(); resolve(); },
    });
  });
}

// Barre de vie de boss (HUD, en bas au centre). `getRatio()` → 0..1, lue chaque frame.
function showBossBar(scene, name, getRatio) {
  hideBossBar(scene);
  const w = 440;
  const x = (scene.scale.width - w) / 2;
  const y = scene.scale.height - 40;
  const g = scene.add.graphics().setScrollFactor(0).setDepth(1002);
  const label = scene.add.text(scene.scale.width / 2, y - 8, name, {
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
  scene.__bossBar = { g, label, draw };
  return scene.__bossBar;
}

function hideBossBar(scene) {
  const bar = scene.__bossBar;
  if (!bar) return;
  scene.events.off('update', bar.draw);
  bar.g.destroy();
  bar.label.destroy();
  scene.__bossBar = null;
}

// ---------------------------------------------------------------------------
// Gel du monde (dialogue, cinématique, menus)
// ---------------------------------------------------------------------------
const WORLD_FREEZING_SCENES = ['DialogueScene', 'InventoryScene', 'MapScene', 'CampfireMenuScene', 'PauseScene'];

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
  kainati: { name: 'Kainati', color: 0xc08a4a },
  kainati_esprit: { name: 'Esprit de Kainati', color: 0x7fffd4, portrait: 'kainati', portraitTint: 0x9ffff0 },
  ghilt: { name: "Ghil't", color: 0x7bd35a },
  habitant: { name: 'Habitant', color: 0xa99bd6 },
  garde: { name: 'Garde', color: 0x8a8fb5 },
  narrateur: { name: '', color: 0xe8d9ff },
};

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
      n.__autoTalk = false;
      if (n.active && n.currentManifestAnim === 'talk') storyNpcRest(n);
    }
  }
  const x = scene.xara;
  if (x && x !== except && x.__autoTalk) {
    x.__autoTalk = false;
    if (x.__talkSprite) { x.__talkSprite.destroy(); x.__talkSprite = null; }
    if (x.active) x.setVisible(true);
  }
}

function storySpeakerTalkAnim(scene, line) {
  if (!scene) return;
  const npc = line && line.who !== 'agarica' && line.who !== 'narrateur' ? storyFindSpeakerNpc(scene, line) : null;
  const companion = !npc && line && line.who === 'xara' && scene.xara && scene.xara.active ? scene.xara : null;
  storyStopSpeakerTalk(scene, npc || companion);
  if (npc && npc.playManifest && hasManifestArt(scene, npc.manifestId, 'talk')
    && (!npc.currentManifestAnim || npc.currentManifestAnim === 'idle' || npc.__restPaused)) {
    npc.__restPaused = false;
    npc.playManifest('talk', false);
    npc.__autoTalk = true;
  } else if (companion && !companion.__autoTalk && hasManifestArt(scene, 'xara_extra', 'talk')) {
    // Sprite de parole posé PAR-DESSUS le compagnon (caché le temps de la
    // réplique) : changer la texture/l'échelle du compagnon lui-même modifiait
    // son corps physique, qui s'enfonçait dans le sol et la faisait tomber.
    const t = addManifestSprite(scene, companion.x, companion.y, 'xara_extra', 'talk');
    t.setFlipX(companion.flipX).setDepth(companion.depth).setRotation(companion.rotation);
    if (scene.children.moveAbove) scene.children.moveAbove(t, companion);
    companion.__talkSprite = t;
    companion.setVisible(false);
    companion.__autoTalk = true;
  }
}

let storyDialogueChain = Promise.resolve();

// Promesse résolue à la fin avec `{ lastChoice, choices }` (indices des choix faits).
function showDialogue(scene, linesOrId) {
  if (typeof linesOrId === 'string' && DIALOGUES[linesOrId] === undefined && /^[a-z0-9_]+$/.test(linesOrId)) {
    console.warn(`showDialogue : dialogue "${linesOrId}" introuvable dans DIALOGUES.`);
    return Promise.resolve({ lastChoice: -1, choices: [] });
  }
  const lines = resolveDialogueLines(scene, linesOrId);
  if (lines.length === 0) return Promise.resolve({ lastChoice: -1, choices: [] });
  scene.__storyFreeze = (scene.__storyFreeze || 0) + 1;
  hideStoryPrompt(scene);
  if (scene.player && scene.player.body) scene.player.setVelocityX(0);
  const run = () => new Promise((resolve) => {
    scene.scene.launch('DialogueScene', {
      lines,
      parentKey: scene.scene.key,
      onDone: (result) => {
        if (scene.player && scene.player.storyPose === 'talk') setPlayerStoryPose(scene, null);
        storyStopSpeakerTalk(scene, null);
        scene.__storyFreeze = Math.max(0, (scene.__storyFreeze || 0) - 1);
        releaseStoryInput(scene);
        resolve(result);
      },
    });
    scene.scene.bringToTop('DialogueScene');
  });
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

function runCutscene(scene, idOrSteps) {
  const steps = resolveCutsceneSteps(scene, idOrSteps);
  if (steps.length === 0) return Promise.resolve();
  const visit = scene.__storyVisit;
  scene.__cutsceneLock = (scene.__cutsceneLock || 0) + 1;
  hideStoryPrompt(scene);
  if (scene.player && scene.player.body) scene.player.setVelocityX(0);
  const finish = () => {
    if (scene.__storyVisit !== visit) return;
    scene.__cutsceneLock = Math.max(0, (scene.__cutsceneLock || 0) - 1);
    if (scene.__cutsceneLock === 0) {
      scene.__playerScripted = false;
      setPlayerStoryPose(scene, null);
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
  cam.startFollow(scene.player, true, 1, 1);
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
    const walkAnim = ['walk', 'run'].find((a) => def.anims && def.anims[a]);
    const before = npc.currentManifestAnim || 'idle';
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
    interactables: [], triggers: [], mossBlocks: [], mossWalls: [], checkpoints: [],
    fall: null, safePos: null, checkpoint: null, prompt: null, mossGroup: null, keys: null,
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

// Où poser les pieds d'un PNJ : sur le haut VISIBLE d'un décor (`onProp: true`
// ou le type du prop, ex. Xara sur sa souche, cf. propTopYAt), sinon `y`
// explicite, sinon la surface de marche.
function storyNpcFootY(scene, n) {
  if (n.onProp) {
    const top = propTopYAt(scene, n.x, n.onProp === true ? null : n.onProp);
    if (top != null) return top;
  }
  return n.y != null ? n.y : storyStandY(scene, n.x);
}

// Pose un objet SUR le décor `propType` en x (le bas de ses pixels visibles
// sur le haut visible du décor, cf. propTopYAt) ; repli si le décor manque :
// `fallbackY` tel quel. Ex. l'idole sur son autel.
function storyPlaceOnProp(scene, obj, x, propType, fallbackY) {
  const top = propTopYAt(scene, x, propType);
  obj.setPosition(x, top == null ? fallbackY : top);
  if (top != null) setVisibleBottomY(obj, top);
  return obj;
}

// Place `obj` juste sous le joueur dans la liste d'affichage (PNJ, objets).
function storyPutBehindPlayer(scene, obj) {
  if (scene.player && scene.children.moveBelow) scene.children.moveBelow(obj, scene.player);
}

function ensureStoryPrompt(scene) {
  const st = scene.__story;
  if (!st.prompt || !st.prompt.active) {
    st.prompt = scene.add.text(0, 0, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe9f5',
      backgroundColor: '#2a1f45', padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 1).setDepth(STORY_PROMPT_DEPTH).setVisible(false);
  }
  return st.prompt;
}

// Crée un PNJ (données `npcs` ou étape `npcAdd`) dans scene.npcs[key || id].
function createStoryNpc(scene, n) {
  const key = n.key || n.id;
  const npc = addManifestSprite(scene, n.x, storyNpcFootY(scene, n), n.sprite || n.id, n.anim || 'idle');
  npc.npcKey = key;
  npc.talk = n.talk || null;
  npc.npcName = n.name || null;
  npc.lookAtPlayer = n.lookAtPlayer !== false;
  setNpcFacing(npc, n.facing === 'left' ? -1 : 1);
  // Devant les décors (props, feux, totems), comme tous les personnages ; à
  // profondeur égale, juste sous le joueur dans la liste d'affichage.
  npc.setDepth(CHARACTER_DEPTH);
  storyPutBehindPlayer(scene, npc);
  if (scene.npcs[key]) scene.npcs[key].destroy();
  scene.npcs[key] = npc;
  return npc;
}

LEVEL_DATA_HANDLERS.zoneName = (scene, name, data) => {
  showTitleCard(scene, name, data.zoneSub);
};

// `background` est appliqué par addMoonlitDecor (il remplace le ciel plan4) ;
// rien à faire ici, l'entrée existe pour documenter la clé.
LEVEL_DATA_HANDLERS.background = () => {};

LEVEL_DATA_HANDLERS.ambient = (scene, amb) => {
  const { width, height } = scene.scale;
  scene.ambientOverlay = scene.add.rectangle(0, 0, width, height, amb.tint ?? 0x000000, amb.darkness ?? 0.35)
    .setOrigin(0, 0).setScrollFactor(0).setDepth(900);
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

LEVEL_DATA_HANDLERS.pickups = (scene, list) => {
  const zone = storyZoneId(scene);
  (list || []).forEach((p) => {
    const flag = `pickup_${zone}_${p.item}`;
    if (storyGet(flag) || inventoryHas(p.item) || !storyAllowed(p)) return;
    const y = p.y != null ? p.y : storyGroundY(scene, p.x) - 30;
    const glow = scene.add.circle(p.x, y, 22, STORY_UI.vineLight, 0.18);
    const img = addItemIcon(scene, p.x, y, p.item, 40);
    scene.tweens.add({ targets: [img, glow], y: y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: glow, alpha: 0.05, duration: 1100, yoyo: true, repeat: -1 });
    storyPutBehindPlayer(scene, glow);
    storyPutBehindPlayer(scene, img);
    scene.__story.interactables.push({ kind: 'pickup', data: p, flag, img, glow, x: p.x, y });
  });
};

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
  if (scene.textures.exists(`item-${artId}`)) {
    const img = scene.add.image(x, y + h / 2, `item-${artId}`).setOrigin(0.5, 1).setDisplaySize(w * 1.15, h * 1.1);
    return setVisibleBottomY(img, footY);
  }
  const g = scene.add.graphics({ x, y: footY - h / 2 });
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

LEVEL_DATA_HANDLERS.checkpoints = (scene, list) => {
  for (const c of list || []) {
    const y = c.y != null ? c.y : storyGroundY(scene, c.x);
    const g = scene.add.graphics({ x: c.x, y });
    const draw = (lit) => {
      g.clear();
      g.fillStyle(0x2b2440, 1);
      g.fillRoundedRect(-9, -30, 18, 30, 5);
      g.fillStyle(lit ? STORY_UI.vineLight : 0x5a5070, lit ? 1 : 0.8);
      g.fillCircle(0, -18, 4);
      if (lit) {
        g.fillStyle(STORY_UI.vineLight, 0.2);
        g.fillCircle(0, -18, 12);
      }
    };
    draw(false);
    storyPutBehindPlayer(scene, g);
    scene.__story.checkpoints.push({ x: c.x, y, draw, lit: false });
  }
};

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
      if (!it.talk) continue;
      x = npc.x;
      topY = npc.y - npc.displayHeight;
      if (Math.abs(player.y - npc.y) > STORY_INTERACT_RANGE_Y) continue;
      label = 'E : parler';
    } else if (it.kind === 'pickup') {
      if (it.done) continue;
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
    storyTalk(scene, it.talk);
  } else if (it.kind === 'pickup') {
    it.done = true;
    storySet(it.flag, true);
    inventoryAdd(scene, it.data.item);
    scene.tweens.killTweensOf([it.img, it.glow]);
    scene.tweens.add({
      targets: [it.img, it.glow], y: it.y - 40, alpha: 0, duration: 400,
      onComplete: () => { it.img.destroy(); it.glow.destroy(); },
    });
    if (it.data.cutscene) runCutscene(scene, it.data.cutscene);
  } else if (it.kind === 'mossWall') {
    if (inventoryHas('repulsif')) openMossWall(scene, it.wall);
    else showToast(scene, "Un mur de mousse épaisse et visqueuse. Impossible de passer…\nIl faudrait quelque chose pour la dissoudre.");
  }
}

function openMossWall(scene, wall) {
  wall.open = true;
  storySet(wall.flag, true);
  removeMossBody(scene, wall.body);
  const v = wall.visual;
  const baseY = wall.y + wall.h / 2;
  // Bulles roses de répulsif pendant que la mousse se dissout vers le bas.
  for (let i = 0; i < 14; i++) {
    const b = scene.add.circle(wall.x + Phaser.Math.Between(-wall.w / 2, wall.w / 2), baseY - Phaser.Math.Between(0, wall.h),
      Phaser.Math.Between(3, 7), i % 2 ? STORY_UI.pink : 0xd0b060, 0.9).setDepth(STORY_PROMPT_DEPTH - 1);
    scene.tweens.add({ targets: b, y: b.y - 50, alpha: 0, duration: 700 + i * 40, delay: i * 50, onComplete: () => b.destroy() });
  }
  if (v.setTint) v.setTint(0xb07ad0);
  scene.tweens.add({
    targets: v, alpha: 0, scaleY: 0.1, y: v.y + (v.originY === 1 ? 0 : wall.h / 2), duration: 1100, ease: 'Sine.easeIn',
    onComplete: () => v.destroy(),
  });
  showToast(scene, 'La mousse se dissout en sifflant…', 1800);
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
  const hitbox = player.getSkillHitbox && player.getSkillHitbox();
  if (!hitbox || player.activeSkillId !== 'ours') return;
  for (const m of scene.__story.mossBlocks) {
    if (m.destroyed) continue;
    const rect = new Phaser.Geom.Rectangle(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
    if (!Phaser.Geom.Intersects.RectangleToRectangle(hitbox, rect)) continue;
    m.destroyed = true;
    storySet(m.flag, true);
    removeMossBody(scene, m.body);
    scene.cameras.main.shake(200, 0.008);
    for (let i = 0; i < 12; i++) {
      const p = scene.add.circle(m.x, m.y, Phaser.Math.Between(4, 9), i % 3 ? 0x3e7a2c : 0x9bff5a, 1).setDepth(STORY_PROMPT_DEPTH - 1);
      scene.tweens.add({
        targets: p, x: m.x + Phaser.Math.Between(-90, 90), y: m.y + Phaser.Math.Between(-80, 30), alpha: 0,
        duration: 600, ease: 'Quad.easeOut', onComplete: () => p.destroy(),
      });
    }
    scene.tweens.add({ targets: m.visual, alpha: 0, duration: 350, onComplete: () => m.visual.destroy() });
    scene.events.emit('moss-destroyed', m);
  }
}

function updateStoryCheckpoints(scene) {
  const player = scene.player;
  for (const c of scene.__story.checkpoints) {
    if (c.lit || Math.abs(player.x - c.x) > 40 || Math.abs(player.y - c.y) > 120) continue;
    for (const o of scene.__story.checkpoints) if (o.lit) { o.lit = false; o.draw(false); }
    c.lit = true;
    c.draw(true);
    scene.__story.checkpoint = { x: c.x, y: c.y };
    // La mort (cœurs à 0, cf. Player.hitByEnemy) ramène aussi ici.
    player.spawnX = c.x;
    player.spawnY = c.y - 4;
    showToast(scene, 'Point de reprise', 1200);
  }
}

function updateStoryFall(scene) {
  const player = scene.player;
  const st = scene.__story;
  const fall = st.fall;
  // Dernier appui sûr (pas le bas du monde, pas déjà sous la ligne de chute).
  // `blocked.down` SEUL (correctif FF1) : `touching.down` est aussi levé par
  // un simple overlap (corbeau en piqué, ennemi...) -- le point sûr était
  // alors pris en plein vide, et chaque chute y ramenait Agarica, qui
  // retombait aussitôt (un cœur perdu par boucle jusqu'à la mort). Tous les
  // appuis réels (sol, plateformes, murs de mousse) sont statiques et lèvent
  // `blocked.down`.
  const onGround = player.body.blocked.down;
  const atWorldBottom = player.body.bottom >= scene.physics.world.bounds.bottom - 1;
  if (onGround && !atWorldBottom && (!fall || player.y < fall.y - 40)) st.safePos = { x: player.x, y: player.y };
  // Le bas du monde physique vaut `levelHeight` (540) : posé dessus, le joueur
  // n'atteint jamais `fall.y` (600 par défaut) et resterait coincé au fond du
  // vide. Toucher le bas du monde compte donc aussi comme une chute.
  if (!fall || (player.y <= fall.y && !atWorldBottom)) return;
  if (fall.mode === 'scene' && fall.scene) {
    const entry = storyZoneEntry(fall.scene);
    goToScene(scene, entry ? entry.scene : fall.scene, fall.data);
    return;
  }
  const back = (fall.mode === 'respawn' && st.checkpoint) || st.safePos || { x: player.spawnX, y: player.spawnY };
  player.setVelocity(0, 0);
  player.setPosition(back.x, back.y - 4);
  if (fall.mode === 'hurt') player.hitByEnemy();
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
  else if (Phaser.Input.Keyboard.JustDown(st.keys.map) && inventoryHas('carte_geralt')) openMap(scene);
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

function storyUpdateHook(scene, time, delta) {
  if (!scene.__story || !scene.player || !scene.player.body) return;
  updateStoryFall(scene);
  updateStoryCheckpoints(scene);
  updateStoryMossBlocks(scene);
  updateStoryTriggers(scene);
  if (isWorldFrozen(scene)) return;
  updateStoryInteractables(scene);
  updateStoryKeys(scene);
  if (scene.__zoneScript && scene.__zoneScript.update) scene.__zoneScript.update(scene, time, delta);
}
LEVEL_UPDATE_HOOKS.push(storyUpdateHook);
