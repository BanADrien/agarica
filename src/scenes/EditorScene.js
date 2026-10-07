// Mode édition de niveau (voir index.html?editor) : construit à la main
// tout ce qu'une Zone*Scene assemble aujourd'hui par code (cf. LevelKit.js
// buildLevelFromData) — sol en grille libre (autotile 9-slice, voir
// AUTOTILE_POSITIONS), totems, ennemis, eau, décors, spawn joueur, sortie de
// niveau. Ne touche à aucune des Zone*Scene existantes (toujours codées à
// la main tant qu'on ne les charge pas dans l'éditeur, cf. plus bas).
//
// Enregistrer une zone (bouton "Enregistrer", cf. exportLevel) est
// purement local : IndexedDB, jamais un fichier -- retour utilisateur :
// "je veux une interface pas ouvrir l'explorateur de fichier" (essayé
// avant avec File System Access/`showDirectoryPicker`, rejeté même une
// fois la poignée mémorisée pour ne plus jamais la redemander -- un
// sélecteur de dossier natif reste un sélecteur de dossier natif). Le
// bouton "Zones" (cf. openZonesOverview) liste aussi bien ces brouillons
// que les vraies zones déjà chargées par une balise <script> de la page --
// "Charger" ramène l'une ou l'autre dans l'éditeur pour la modifier.
//
// Faire d'un brouillon une VRAIE scène jouable dans le jeu reste une étape
// à part et explicite (il faut bien, à un moment, de vrais fichiers) :
// "Télécharger pour le projet" (cf. downloadZoneForProject) télécharge
// juste le fichier de données + une classe de scène prête à l'emploi :
//
//   class MonNiveauScene extends Phaser.Scene {
//     constructor() { super('MonNiveauScene'); }
//     create() { buildLevelFromData(this, MON_NIVEAU_DATA); }
//     update(time, delta) { updateLevelFromData(this, time, delta); }
//   }
//
// à déplacer à la main dans src/data/ et src/scenes/, puis câbler dans
// index.html (deux balises <script>) et le tableau `scene` de main.js --
// un téléchargement classique de navigateur, jamais de fenêtre de
// sélection (pas de fetch() JSON non plus : le jeu tourne aussi en
// file://, sans serveur — cf. CLAUDE.md "fichier ou lien, sans install").
//
// UI en HTML par-dessus le canvas (#editor-ui dans index.html), pas dessinée
// en Phaser : boutons/select/input natifs, bien plus rapide à câbler que de
// reconstruire une UI dans un Graphics. EditorScene lit/écrit le DOM
// directement (pas de framework, cf. CLAUDE.md).
const EDITOR_DEFAULT_LEVEL_WIDTH = 2400;
const EDITOR_DEFAULT_LEVEL_HEIGHT = 540;
const EDITOR_WORLD_PAD_X = 200;
const EDITOR_WORLD_TOP = -320;
const EDITOR_WORLD_BOTTOM = 1400;
const EDITOR_CAMERA_SPEED = 600;

const EDITOR_TOTEM_TYPES = [
  { value: 'hasWolfForm', label: 'Loup' },
  { value: 'hasEagleForm', label: 'Aigle' },
  { value: 'hasOctopusForm', label: 'Pieuvre' },
];
// Tous les types de ENEMY_REGISTRY (cf. PLAN_DEV.md) : couleur/lettre du
// marqueur, `patrol` = reçoit patrolMinX/patrolMaxX (x±150) à la pose.
const EDITOR_ENEMY_TYPES = [
  { value: 'araignee', label: 'Araignée (fixe)', color: 0xcc4477, letter: 'A' },
  { value: 'loup', label: 'Loup sanguinaire (patrouille)', color: 0x8888ff, letter: 'L', patrol: true },
  { value: 'loupAlpha', label: 'Loup alpha (boss, 3 PV)', color: 0x4455dd, letter: 'Lα', patrol: true },
  { value: 'corbeau', label: 'Corbeau (patrouille + piqué)', color: 0x6644aa, letter: 'C', patrol: true },
  { value: 'crapaud', label: 'Crapaud (fixe, langue)', color: 0x55aa55, letter: 'Cr' },
  { value: 'mousse_creature', label: 'Créature de mousse (corrompue)', color: 0x7fdc3a, letter: 'M', patrol: true },
  { value: 'singe_corrompu', label: 'Singe corrompu (lance des pierres)', color: 0xc9a040, letter: 'S', patrol: true },
  { value: 'crapaud_corrompu', label: 'Crapaud corrompu', color: 0x9bff5a, letter: 'Cc' },
  { value: 'ghilt', label: "Ghil't (boss)", color: 0xff5533, letter: 'G' },
];
const EDITOR_ENEMY_BY_TYPE = Object.fromEntries(EDITOR_ENEMY_TYPES.map((t) => [t.value, t]));
const EDITOR_DEFAULT_TOTEM_MESSAGE = "Une nouvelle capacité s'éveille en toi.";
const EDITOR_ENEMY_PATROL_HALF_WIDTH = 150;
const EDITOR_MARKER_HIT_RADIUS = 26;
// Cf. pushUndo/undo plus bas.
const EDITOR_UNDO_MAX = 50;
// Retour utilisateur : "modifier permet de sélectionner un élément pour le
// déplacer/l'agrandir" -- outil 'modify', cf. findMarkerNear/selectMarker/
// moveSelectedMarker/le listener 'wheel' plus bas. Seuls les éléments avec
// une vraie image (pas les marqueurs cercle+lettre spawn/ennemi) ont un
// agrandissement qui a un sens.
const EDITOR_RESIZABLE_KINDS = new Set(['totem', 'campfire', 'prop']);
const EDITOR_GROUND_SNAPPED_KINDS = new Set(['totem', 'campfire', 'prop']);
const EDITOR_SCALE_STEP = 0.03;
const EDITOR_MIN_SCALE = 0.08;
const EDITOR_MAX_SCALE = 2.5;
const EDITOR_ENEMY_MARKER_COLORS = Object.fromEntries(EDITOR_ENEMY_TYPES.map((t) => [t.value, t.color]));
const EDITOR_ENEMY_MARKER_LABELS = Object.fromEntries(EDITOR_ENEMY_TYPES.map((t) => [t.value, t.letter]));

// PNJ proposés par l'outil PNJ (ids du manifest, cf. asset_manifest.js) ;
// EDITOR_NPC_DEFAULTS : champs posés à la place de `{id}` pour un sprite
// dont l'id de PNJ diffère (Xara = PNJ `xara`, remplacé par le vrai
// compagnon par l'étape {xaraJoin}).
const EDITOR_NPC_IDS = [
  'xara_extra', 'pere_chef', 'amanite', 'habitant_druide', 'habitant_porteur', 'habitant_garde',
  'galter', 'clak', 'morgat', 'kainati', 'kainati_esprit', 'ghilt', 'ghilt_gueri',
];
const EDITOR_NPC_DEFAULTS = { xara_extra: { id: 'xara', sprite: 'xara_extra' } };
// Objets d'ITEM_MANIFEST qui ne sont pas des objets ramassables (UI, fonds...).
const EDITOR_NON_PICKUP_ITEM = /^(hud_|fond_|portrait_|skill_icone|form_icone|dialogue_box|titre_logo|carte_parchemin|totem_monkey|liane$|mousse_|porte_mousse|courant_air)/;
const EDITOR_ANIMAL_TYPES = [
  { value: 'cochons', label: 'Bébés cochons (x3, au sol)' },
  { value: 'poissons', label: 'Poissons (x3, rectangle d\'eau)' },
  { value: 'papillons', label: 'Papillons (nuée)' },
];
// Clés de zone éditées par le panneau « Propriétés de la zone » (cf.
// syncZonePropsUI) -- toutes les autres clés inconnues de l'éditeur sont
// conservées telles quelles (Object.assign dans applyLevelData) et listées.
const EDITOR_ZONE_PROP_KEYS = ['zoneName', 'background', 'tileset', 'xara', 'script', 'tallLevel'];
const EDITOR_MIN_RECT = 16;

// Éléments de l'histoire (clés de PLAN_DEV.md), tous gérés par le même code
// générique : pose (point / rectangle glissé / ligne horizontale / liane),
// marqueur (couleur + étiquette), sélection, déplacement (outil Modifier),
// molette (taille), suppression, round-trip. Chaque définition :
//   key     : tableau de la donnée de zone ;
//   shape   : 'point' (clic), 'rect' (glisser), 'hline' (glisser horizontal),
//             'vine' (clic = attache, glisser vers le bas = longueur) ;
//   create(ed, geom, subtype) -> entrée (ou null si annulé) ;
//   draw(ed, entry) -> objets Phaser (le 1er sert au test de clic/contour) ;
//   anchor(ed, entry) -> {x, y} ; move(ed, entry, x, y) ; wheel?(entry, sign).
// Conventions de coordonnées : cf. PLAN_DEV.md (centre pour triggers/
// mousse, coin haut-gauche pour windCurrents/poissons, grille pour
// hiddenPlatforms, y absent = posé au sol au runtime).
const EDITOR_STORY_KINDS = {
  npc: {
    key: 'npcs', shape: 'point', label: 'PNJ',
    create(ed, g, subtype) {
      const base = { ...(EDITOR_NPC_DEFAULTS[subtype] || { id: subtype }) };
      const sameId = (ed.data.npcs || []).filter((n) => (n.key || n.id) === base.id || n.id === base.id).length;
      if (sameId) base.key = `${base.id}_${sameId + 1}`;
      const talk = window.prompt(`Dialogue/cinématique du PNJ "${base.id}" (id de DIALOGUES ou CUTSCENES, vide = aucun) :`, '');
      const entry = { ...base, x: Math.round(g.x), y: ed.snapY(g.x, g.y) };
      if (talk && talk.trim()) entry.talk = talk.trim();
      return entry;
    },
    draw(ed, e) {
      const y = e.y != null ? e.y : ed.groundYOr(e.x, 400);
      const sprite = addManifestSprite(ed, e.x, y, e.sprite || e.id, e.anim || 'idle');
      if (e.facing === 'left') sprite.setFlipX(true);
      const talk = typeof e.talk === 'string' ? e.talk : (e.talk ? '(conditionnel)' : '—');
      return [sprite, ed.markerLabel(e.x, y - sprite.displayHeight - 10, `PNJ ${e.key || e.id} : ${talk}`, '#ffe08a')];
    },
    anchor: (ed, e) => ({ x: e.x, y: e.y != null ? e.y : ed.groundYOr(e.x, 400) }),
    move(ed, e, x, y) { e.x = Math.round(x); e.y = ed.snapY(x, y); },
  },
  trigger: {
    defaultSize: { w: 128, h: 192 },
    key: 'triggers', shape: 'rect', label: 'Déclencheur',
    create(ed, g) {
      const n = (ed.data.triggers || []).length + 1;
      const cutscene = window.prompt('Cinématique lancée (id de CUTSCENES) :', '');
      if (cutscene === null) return null;
      return {
        id: `t${n}`, x: Math.round(g.x + g.w / 2), y: Math.round(g.y + g.h / 2), w: Math.round(g.w), h: Math.round(g.h), cutscene: cutscene.trim(),
      };
    },
    draw(ed, e) {
      const full = e.y == null || e.h == null;
      const w = e.w || 64;
      const h = full ? EDITOR_WORLD_BOTTOM - EDITOR_WORLD_TOP : e.h;
      const cy = full ? (EDITOR_WORLD_TOP + EDITOR_WORLD_BOTTOM) / 2 : e.y;
      const rect = ed.add.rectangle(e.x, cy, w, h, 0xff9933, 0.18).setStrokeStyle(2, 0xffb366, 0.9);
      const label = `Déclencheur ${e.id != null ? e.id : ''} → ${e.cutscene || '?'}${e.once === false ? ' (rejouable)' : ''}`;
      return [rect, ed.markerLabel(e.x, (full ? 60 : cy - h / 2) - 10, label, '#ffb366')];
    },
    anchor: (ed, e) => ({ x: e.x, y: e.y != null && e.h != null ? e.y : 270 }),
    move(ed, e, x, y) { e.x = Math.round(x); if (e.y != null && e.h != null) e.y = Math.round(y); },
  },
  pickup: {
    key: 'pickups', shape: 'point', label: 'Objet',
    create: (ed, g, subtype) => ({ item: subtype, x: Math.round(g.x), y: Math.round(g.y) }),
    draw(ed, e) {
      const y = e.y != null ? e.y : ed.groundYOr(e.x, 400) - 30;
      const icon = addItemIcon(ed, e.x, y, e.item, 34);
      const ring = ed.add.circle(e.x, y, 20, 0xffe066, 0.15).setStrokeStyle(1, 0xffe066, 0.8);
      return [icon, ring, ed.markerLabel(e.x, y - 30, `Objet : ${e.item}`, '#ffe066')];
    },
    anchor: (ed, e) => ({ x: e.x, y: e.y != null ? e.y : ed.groundYOr(e.x, 400) - 30 }),
    move(ed, e, x, y) { e.x = Math.round(x); e.y = Math.round(y); },
  },
  mossBlock: {
    defaultSize: { w: 96, h: 96 },
    key: 'mossBlocks', shape: 'rect', label: 'Amas de mousse',
    create: (ed, g) => ({ x: Math.round(g.x + g.w / 2), y: ed.mossClickY(g), w: Math.round(g.w), h: Math.round(g.h) }),
    draw: (ed, e) => ed.drawMossMarker(e, 96, 0x3e7a2c, `Amas de mousse${e.id != null ? ` ${e.id}` : ''} (ours)`),
    anchor: (ed, e) => ed.mossCenter(e, 96),
    move(ed, e, x, y) { e.x = Math.round(x); e.y = Math.round(y); },
  },
  mossWall: {
    defaultSize: { w: 96, h: 192 },
    key: 'mossWalls', shape: 'rect', label: 'Mur de mousse',
    create(ed, g) {
      const n = (ed.data.mossWalls || []).length + 1;
      const id = window.prompt('Identifiant du mur de mousse (flag mosswall_<zone>_<id>) :', `mur${n}`);
      if (id === null) return null;
      return {
        id: id.trim() || `mur${n}`, x: Math.round(g.x + g.w / 2), y: ed.mossClickY(g), w: Math.round(g.w), h: Math.round(g.h),
      };
    },
    draw: (ed, e) => ed.drawMossMarker(e, 192, 0x2a5a24, `Mur de mousse ${e.id || ''} (répulsif)`),
    anchor: (ed, e) => ed.mossCenter(e, 192),
    move(ed, e, x, y) { e.x = Math.round(x); e.y = Math.round(y); },
  },
  checkpoint: {
    key: 'checkpoints', shape: 'point', label: 'Checkpoint',
    create: (ed, g) => ({ x: Math.round(g.x), y: ed.snapY(g.x, g.y) }),
    draw(ed, e) {
      const y = e.y != null ? e.y : ed.groundYOr(e.x, 400);
      const post = ed.add.rectangle(e.x, y - 15, 18, 30, 0x2b2440, 1).setStrokeStyle(2, 0x9bffd0, 0.9);
      return [post, ed.markerLabel(e.x, y - 40, 'Checkpoint', '#9bffd0')];
    },
    anchor: (ed, e) => ({ x: e.x, y: (e.y != null ? e.y : ed.groundYOr(e.x, 400)) - 15 }),
    move(ed, e, x, y) { e.x = Math.round(x); e.y = ed.snapY(x, y + 15); },
  },
  vine: {
    key: 'vines', shape: 'vine', label: 'Liane',
    create: (ed, g) => ({ x: Math.round(g.x), y: Math.round(g.y), length: Math.round(g.length) }),
    draw(ed, e) {
      const len = e.length || 200;
      const line = ed.add.rectangle(e.x, e.y + len / 2, 6, len, 0x5fae3a, 0.85).setStrokeStyle(1, 0xb6f08a, 0.9);
      const knot = ed.add.circle(e.x, e.y, 6, 0xb6f08a, 1);
      return [line, knot, ed.markerLabel(e.x, e.y - 12, `Liane ${len}px`, '#b6f08a')];
    },
    anchor: (ed, e) => ({ x: e.x, y: e.y }),
    move(ed, e, x, y) { e.x = Math.round(x); e.y = Math.round(y); },
    wheel(e, sign) { e.length = Math.max(32, (e.length || 200) + sign * 16); },
  },
  track: {
    defaultSize: { w: 192, h: 0 },
    key: 'tracks', shape: 'hline', label: 'Piste de loup',
    create: (ed, g) => ({ x: Math.round(g.x), y: ed.snapY(g.x + g.w / 2, g.y), w: Math.round(g.w) }),
    draw(ed, e) {
      const w = e.w || 200;
      const rect = ed.add.rectangle(e.x + w / 2, e.y - 4, w, 8, 0xc08850, 0.6).setStrokeStyle(1, 0xffd0a0, 0.9);
      return [rect, ed.markerLabel(e.x + w / 2, e.y - 18, 'Piste (loup)', '#ffd0a0')];
    },
    anchor: (ed, e) => ({ x: e.x + (e.w || 200) / 2, y: e.y - 4 }),
    move(ed, e, x, y) { const w = e.w || 200; e.x = Math.round(x - w / 2); e.y = ed.snapY(x, y + 4); },
    wheel(e, sign) { e.w = Math.max(32, (e.w || 200) + sign * 32); },
  },
  hiddenPlatform: {
    defaultSize: { w: 192, h: 0 },
    key: 'hiddenPlatforms', shape: 'hline', label: 'Plateforme cachée',
    create(ed, g) {
      const a = worldToGrid(g.x, g.y);
      const b = worldToGrid(g.x + g.w, g.y);
      return { gx: a.gx, gy: a.gy, w: Math.max(1, b.gx - a.gx + 1) };
    },
    draw(ed, e) {
      const T = GROUND_TILE_SIZE;
      const w = (e.w || 1) * T;
      const rect = ed.add.rectangle(e.gx * T + w / 2, e.gy * T + T / 2, w, T, 0x8a6a3a, 0.25).setStrokeStyle(2, 0xd9b27a, 0.8);
      return [rect, ed.markerLabel(e.gx * T + w / 2, e.gy * T - 10, `Plateforme cachée (${e.w} case(s), loup)`, '#d9b27a')];
    },
    anchor: (ed, e) => ({ x: e.gx * GROUND_TILE_SIZE + ((e.w || 1) * GROUND_TILE_SIZE) / 2, y: e.gy * GROUND_TILE_SIZE + GROUND_TILE_SIZE / 2 }),
    move(ed, e, x, y) {
      const left = x - ((e.w || 1) * GROUND_TILE_SIZE) / 2;
      e.gx = Math.round(left / GROUND_TILE_SIZE);
      e.gy = Math.floor(y / GROUND_TILE_SIZE);
    },
    wheel(e, sign) { e.w = Math.max(1, (e.w || 1) + sign); },
  },
  windCurrent: {
    defaultSize: { w: 160, h: 320 },
    key: 'windCurrents', shape: 'rect', label: "Courant d'air",
    create: (ed, g) => ({ x: Math.round(g.x), y: Math.round(g.y), w: Math.round(g.w), h: Math.round(g.h), force: 320 }),
    draw(ed, e) {
      const rect = ed.add.rectangle(e.x + e.w / 2, e.y + e.h / 2, e.w, e.h, 0x88ddff, 0.15).setStrokeStyle(2, 0xbff0ff, 0.8);
      return [rect, ed.markerLabel(e.x + e.w / 2, e.y - 10, `Courant d'air ↑ ${e.force || 320}`, '#bff0ff')];
    },
    anchor: (ed, e) => ({ x: e.x + e.w / 2, y: e.y + e.h / 2 }),
    move(ed, e, x, y) { e.x = Math.round(x - e.w / 2); e.y = Math.round(y - e.h / 2); },
  },
  animal: {
    key: 'animals', shape: 'point', label: 'Animaux',
    create(ed, g, subtype) {
      if (subtype === 'poissons') return { type: 'poissons', x: Math.round(g.x), y: Math.round(g.y), w: 200, h: 60 };
      if (subtype === 'papillons') return { type: 'papillons', x: Math.round(g.x), y: Math.round(g.y), count: 6, w: 80 };
      return { type: 'cochons', x: Math.round(g.x), y: ed.snapY(g.x, g.y), w: 180 };
    },
    draw(ed, e) {
      if (e.type === 'poissons') {
        const w = e.w || 200;
        const h = e.h || 60;
        const rect = ed.add.rectangle(e.x + w / 2, e.y + h / 2, w, h, 0x3399cc, 0.2).setStrokeStyle(1, 0x99ddff, 0.9);
        return [rect, ed.markerLabel(e.x + w / 2, e.y - 10, 'Poissons x3', '#99ddff')];
      }
      if (e.type === 'papillons') {
        const w = e.w || 80;
        const c = ed.add.circle(e.x, e.y, w / 2, 0xffaaee, 0.15).setStrokeStyle(1, 0xffccf4, 0.9);
        return [c, ed.markerLabel(e.x, e.y - w / 2 - 10, `Papillons x${e.count || 6}`, '#ffccf4')];
      }
      const w = e.w || 180;
      const y = e.y != null ? e.y : ed.groundYOr(e.x, 400);
      const rect = ed.add.rectangle(e.x, y - 12, w, 24, 0xf0a0a0, 0.25).setStrokeStyle(1, 0xffc8c8, 0.9);
      return [rect, ed.markerLabel(e.x, y - 34, `Cochons x3 (${e.type})`, '#ffc8c8')];
    },
    anchor(ed, e) {
      if (e.type === 'poissons') return { x: e.x + (e.w || 200) / 2, y: e.y + (e.h || 60) / 2 };
      if (e.type === 'papillons') return { x: e.x, y: e.y };
      return { x: e.x, y: (e.y != null ? e.y : ed.groundYOr(e.x, 400)) - 12 };
    },
    move(ed, e, x, y) {
      if (e.type === 'poissons') { e.x = Math.round(x - (e.w || 200) / 2); e.y = Math.round(y - (e.h || 60) / 2); return; }
      if (e.type === 'papillons') { e.x = Math.round(x); e.y = Math.round(y); return; }
      e.x = Math.round(x); e.y = ed.snapY(x, y + 12);
    },
    wheel(e, sign) {
      if (e.type === 'papillons') e.count = Math.max(1, (e.count || 6) + sign);
      else e.w = Math.max(40, (e.w || 180) + sign * 20);
    },
  },
  web: {
    key: 'webs', shape: 'point', label: 'Toile',
    create: (ed, g) => ({ x: Math.round(g.x), y: ed.snapY(g.x, g.y) - 11 }),
    draw(ed, e) {
      const rect = ed.add.rectangle(e.x, e.y, 70, 22, 0xe8e8ff, 0.35).setStrokeStyle(1, 0xffffff, 0.9);
      return [rect, ed.markerLabel(e.x, e.y - 20, 'Toile', '#e8e8ff')];
    },
    anchor: (ed, e) => ({ x: e.x, y: e.y }),
    move(ed, e, x, y) { e.x = Math.round(x); e.y = ed.snapY(x, y + 11) - 11; },
  },
};
const EDITOR_STORY_KIND_BY_KEY = Object.fromEntries(Object.entries(EDITOR_STORY_KINDS).map(([k, d]) => [d.key, k]));

// Outils qui posent un point d'un coup de clic (pas de peinture/glisser).
// 'portal' (cf. plus bas, outil clic-glisser -- pose une ligne verticale
// comme l'ancien couple 'exit'/'entry') N'EN fait PAS partie, volontairement.
const EDITOR_CLICK_TOOLS = new Set(['spawn', 'totem', 'enemy', 'prop', 'campfire']);
// Sous cette hauteur de glisser (px), une sortie posée d'un simple clic
// (sans vraiment glisser) reçoit cette hauteur par défaut plutôt qu'une
// ligne quasi invisible -- retour utilisateur : "je clique à un endroit et
// glisse pour la dimension de la ligne", mais un simple clic doit rester
// utilisable.
const EDITOR_EXIT_MIN_DRAG = 8;
const EDITOR_EXIT_DEFAULT_HEIGHT = 96;
// Outils de peinture du sol (glisser pour peindre en continu, cf. paintAt) :
// 'ground'/'erase' visent `data.groundCells` (premier plan, avec collision
// une fois playtesté) ; 'ground-back'/'erase-back' visent
// `data.groundBackCells` (second plan, cf. AUTOTILE_BACKLAYER_* dans
// LevelKit.js -- retour utilisateur : "dans le mode édit je ne vois pas le
// moyen pour rajouter les plateforme d'arrière plan", un vrai outil dédié
// plutôt qu'un effet automatique sur le sol normal).
const EDITOR_GROUND_PAINT_TOOLS = new Set(['ground', 'erase', 'ground-back', 'erase-back']);
const EDITOR_BACK_LAYER_TOOLS = new Set(['ground-back', 'erase-back']);
const EDITOR_ERASE_TOOLS = new Set(['erase', 'erase-back']);

// Brouillons de zones enregistrés depuis l'éditeur (cf. exportLevel) --
// IndexedDB plutôt que localStorage : pas de limite de taille pratique
// gênante pour des niveaux qui peuvent contenir beaucoup de cases de sol.
const EDITOR_IDB_NAME = 'legend-of-agarica-editor';
const EDITOR_IDB_ZONES_STORE = 'zones';

class EditorScene extends Phaser.Scene {
  constructor() {
    super('EditorScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#140e24');
    this.tool = 'ground';
    this.material = 'dirt';
    this.subtype = EDITOR_TOTEM_TYPES[0].value;
    this.data = EditorScene.emptyLevelData();
    this.groundImages = [];
    this.markers = [];
    this.lastPaintedCell = null;
    this.waterDragStart = null;
    this.waterPreview = null;
    // Retour utilisateur : "les connexion entré sortie sont trop complexe...
    // enfaite mieux fusionne entré et sortie en 1 seul truc" -- les outils
    // 'exit'/'entry' séparés (un clic-glisser pour chaque, à poser au même
    // endroit pour faire un aller-retour) sont remplacés par un seul outil
    // 'portal' : UN clic-glisser pose à la fois l'entrée ET la sortie au
    // même endroit (cf. finishPortalDrag), reliées par un `portalId` partagé.
    // buildExitVisual/buildEntryVisual/data.exits/data.entries restent
    // inchangés en interne (cf. leurs commentaires) -- seul le GESTE de
    // placement et la connexion (cf. openConnectPicker) sont fusionnés ;
    // d'anciennes sorties/entrées non-appairées (zones jamais retouchées
    // depuis ce changement) restent lues normalement (cf. applyLevelData).
    this.portalDragStart = null;
    this.portalPreview = null;
    // Outil 'modify' (retour utilisateur : "une option modifier qui permet
    // de selectionner un element de le deplacer l'agrandir") : cf.
    // selectMarker/moveSelectedMarker/handleModifyWheel plus bas.
    this.selectedMarker = null;
    this.modifyDragOffset = null;
    this.modifyDragPushed = false;
    this.modifyResizePushed = false;
    this.modifyResizeTimer = null;
    // Annuler (retour utilisateur : "rajoute le ctrl Z dans le mode editor
    // quand je supprime ou rajoute un truc ça l'annule") : cf. pushUndo/undo
    // plus bas.
    this.undoStack = [];

    this.cursors = this.input.keyboard.createCursorKeys();
    // ZQSD (pas WASD) : clavier AZERTY, celui utilisé pour ce projet.
    this.zqsd = this.input.keyboard.addKeys('Z,Q,S,D');
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Maj+flèche : décale TOUTES les tuiles de sol (premier ET second plan)
    // d'une case dans cette direction, sans repeindre -- retour utilisateur :
    // "rajoute une touche pour bouger toute les tuile d'un coup d'une
    // direction". Combinaison Maj+flèche (pas flèche seule, déjà prise pour
    // déplacer la caméra, cf. handleCameraPan) : un événement `keydown`
    // discret (une case par appui), pas une bascule continue tenue à chaque
    // frame comme le déplacement de caméra -- "d'un coup" suggère un pas net,
    // pas un glissement.
    this.input.keyboard.on('keydown-UP', (e) => { if (e.shiftKey) this.shiftAllTiles(0, -1); });
    this.input.keyboard.on('keydown-DOWN', (e) => { if (e.shiftKey) this.shiftAllTiles(0, 1); });
    this.input.keyboard.on('keydown-LEFT', (e) => { if (e.shiftKey) this.shiftAllTiles(-1, 0); });
    this.input.keyboard.on('keydown-RIGHT', (e) => { if (e.shiftKey) this.shiftAllTiles(1, 0); });

    // Ctrl+Z : annule la dernière action de peinture/placement/suppression
    // (cf. pushUndo/undo plus bas). Garde-fou input actif : un Ctrl+Z tapé
    // pendant l'édition du champ "Nom du niveau" (ou tout autre champ HTML)
    // ne doit pas annuler une action de l'éditeur -- même filtre que
    // handleCameraPan/shiftAllTiles ci-dessus.
    this.input.keyboard.on('keydown-Z', (e) => {
      if (!e.ctrlKey) return;
      const active = document.activeElement;
      if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
      e.preventDefault();
      this.undo();
    });

    this.gridGraphics = this.add.graphics();
    // Contour de sélection de l'outil 'modify' (cf. updateSelectionVisual) --
    // profondeur fixe pour rester au-dessus de n'importe quel élément
    // (sol/décor/totem...) peu importe l'ordre dans lequel ils ont été
    // ajoutés à la scène.
    this.selectionGraphics = this.add.graphics().setDepth(1000);
    this.refreshWorldBounds();
    this.redrawGround();

    this.input.on('pointerdown', (p) => this.onPointerDown(p));
    this.input.on('pointermove', (p) => this.onPointerMove(p));
    this.input.on('pointerup', (p) => this.onPointerUp(p));
    // Molette = redimensionner l'élément sélectionné (outil 'modify', cf.
    // handleModifyWheel) -- pas de zoom caméra dans cet éditeur, la molette
    // était jusqu'ici totalement inutilisée, aucun conflit.
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => this.handleModifyWheel(deltaY));

    EditorScene.wireUI();
    EditorScene.syncUIFromScene(this);

    this.add.text(16, 16, "Mode édition — ZQSD/flèches : déplacer la caméra — Maj+flèche : décaler toutes les tuiles", {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#a99bd6',
    }).setScrollFactor(0);
  }

  static emptyLevelData() {
    return {
      levelWidth: EDITOR_DEFAULT_LEVEL_WIDTH,
      levelHeight: EDITOR_DEFAULT_LEVEL_HEIGHT,
      groundCells: [],
      groundBackCells: [],
      water: [],
      webs: [],
      totems: [],
      enemies: [],
      props: [],
      campfires: [],
      playerSpawn: null,
      exits: [],
      entries: [],
      helpText: '',
    };
  }

  update(time, delta) {
    this.handleCameraPan(delta);
  }

  handleCameraPan(delta) {
    const active = document.activeElement;
    if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
    // Maj+flèche décale les tuiles (cf. shiftAllTiles) au lieu de la caméra
    // -- sans cette garde, tenir Maj+flèche aurait aussi fait défiler la
    // caméra en continu pendant le décalage ponctuel des tuiles.
    if (this.shiftKey.isDown) return;

    const speed = (EDITOR_CAMERA_SPEED * delta) / 1000;
    const cam = this.cameras.main;
    if (this.cursors.left.isDown || this.zqsd.Q.isDown) cam.scrollX -= speed;
    if (this.cursors.right.isDown || this.zqsd.D.isDown) cam.scrollX += speed;
    if (this.cursors.up.isDown || this.zqsd.Z.isDown) cam.scrollY -= speed;
    if (this.cursors.down.isDown || this.zqsd.S.isDown) cam.scrollY += speed;
  }

  // Annuler (retour utilisateur : "rajoute le ctrl Z dans le mode editor
  // quand je supprime ou rajoute un truc ça l'annule") : une pile de
  // snapshots COMPLETS de `this.data` (JSON, déjà 100% sérialisable -- même
  // recette qu'exportLevel) plutôt qu'un historique de commandes par outil.
  // Un seul mécanisme couvre alors peinture/gomme de sol (premier ET second
  // plan), tous les marqueurs (spawn/totem/ennemi/prop/eau/sortie), leur
  // suppression ET le décalage global (shiftAllTiles) sans code dédié par
  // action -- chaque appelant n'a qu'à appeler pushUndo() juste avant de
  // modifier `this.data`. Plafonnée (EDITOR_UNDO_MAX) pour ne pas grossir
  // indéfiniment sur une longue session.
  pushUndo() {
    this.undoStack.push(JSON.stringify(this.data));
    if (this.undoStack.length > EDITOR_UNDO_MAX) this.undoStack.shift();
  }

  // `applyLevelData` (cf. plus bas) sait déjà reconstruire TOUT l'état
  // visuel (sol + marqueurs) depuis un objet de données -- exactement ce
  // qu'il faut pour revenir à un ancien snapshot, donc réutilisé tel quel
  // plutôt que dupliquer sa logique de reconstruction ici. Elle passe par
  // `newLevel()`, qui vide `this.undoStack` (cf. son commentaire) : sauvé/
  // restauré autour de l'appel pour que défaire une action n'efface pas le
  // reste de l'historique (sans ça, un seul Ctrl+Z aurait été possible par
  // session au lieu d'une vraie pile).
  undo() {
    if (!this.undoStack.length) {
      EditorScene.setStatus('Rien à annuler.');
      return;
    }
    const snapshot = JSON.parse(this.undoStack.pop());
    this.rebuildFromData(snapshot);
    EditorScene.setStatus(`Action annulée (${this.undoStack.length} encore possible(s)).`);
  }

  // Retour utilisateur : "rajoute une touche pour bouger toute les tuile
  // d'un coup d'une direction dans le mode editor" -- décale TOUTES les
  // cases de sol (premier ET second plan, cf. groundBackCells) d'une case
  // de grille dans cette direction, en une seule fois (Maj+flèche, cf.
  // create()) plutôt que devoir tout repeindre à la main. Simple translation
  // des coordonnées de grille, donc trivialement réversible (la même touche
  // dans la direction opposée annule exactement le décalage) -- et
  // maintenant aussi par Ctrl+Z comme les autres actions (cf. pushUndo).
  shiftAllTiles(dgx, dgy) {
    const active = document.activeElement;
    if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
    this.pushUndo();
    for (const cell of this.data.groundCells) {
      cell[0] += dgx;
      cell[1] += dgy;
    }
    for (const cell of this.data.groundBackCells) {
      cell[0] += dgx;
      cell[1] += dgy;
    }
    this.redrawGround();
  }

  refreshWorldBounds() {
    const w = this.data.levelWidth + EDITOR_WORLD_PAD_X * 2;
    const h = EDITOR_WORLD_BOTTOM - EDITOR_WORLD_TOP;
    this.cameras.main.setBounds(-EDITOR_WORLD_PAD_X, EDITOR_WORLD_TOP, w, h);
    this.drawGrid();
  }

  drawGrid() {
    const g = this.gridGraphics;
    g.clear();
    g.lineStyle(1, 0x4a3f6b, 0.35);
    const x0 = -EDITOR_WORLD_PAD_X;
    const x1 = this.data.levelWidth + EDITOR_WORLD_PAD_X;
    for (let x = Math.ceil(x0 / GROUND_TILE_SIZE) * GROUND_TILE_SIZE; x <= x1; x += GROUND_TILE_SIZE) {
      g.lineBetween(x, EDITOR_WORLD_TOP, x, EDITOR_WORLD_BOTTOM);
    }
    for (let y = Math.ceil(EDITOR_WORLD_TOP / GROUND_TILE_SIZE) * GROUND_TILE_SIZE; y <= EDITOR_WORLD_BOTTOM; y += GROUND_TILE_SIZE) {
      g.lineBetween(x0, y, x1, y);
    }
    // Ligne de largeur de niveau (limite droite jouable) en surbrillance.
    g.lineStyle(2, 0xff6666, 0.6);
    g.lineBetween(this.data.levelWidth, EDITOR_WORLD_TOP, this.data.levelWidth, EDITOR_WORLD_BOTTOM);
  }

  worldPointFromPointer(pointer) {
    return this.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }

  onPointerDown(pointer) {
    if (pointer.rightButtonDown()) return; // clic droit réservé (pas d'action pour l'instant)
    const p = this.worldPointFromPointer(pointer);

    if (EDITOR_GROUND_PAINT_TOOLS.has(this.tool)) {
      // Un seul snapshot pour tout le glisser (cf. pushUndo) -- pas un par
      // case peinte (onPointerMove rappelle paintAt en continu pendant le
      // glisser, cf. plus bas) : Ctrl+Z doit annuler tout le coup de
      // pinceau d'un coup, pas juste la dernière case touchée.
      this.pushUndo();
      this.lastPaintedCell = null;
      this.paintAt(p.x, p.y);
      return;
    }
    if (this.tool === 'water') {
      this.waterDragStart = { x: p.x, y: p.y };
      return;
    }
    if (this.tool === 'portal') {
      this.portalDragStart = { x: p.x, y: p.y };
      return;
    }
    const storyDef = EDITOR_STORY_KINDS[this.tool];
    if (storyDef) {
      if (storyDef.shape === 'point') this.placeStoryElement(this.tool, { x: p.x, y: p.y });
      else this.shapeDragStart = { x: p.x, y: p.y };
      return;
    }
    if (this.tool === 'delete') {
      // Retour utilisateur : "ne peux pas etre maintenu pour supprimer tout
      // ce que je touche" -- un seul snapshot pour tout le glisser (même
      // recette que la peinture de sol ci-dessus), `deleteNear` elle-même ne
      // pousse plus d'annulation (cf. son commentaire) : onPointerMove
      // rappelle juste deleteNear en continu pendant que le bouton reste
      // enfoncé, sans ajouter de nouveaux crans d'annulation.
      this.pushUndo();
      this.deleteNear(p.x, p.y);
      return;
    }
    if (this.tool === 'modify') {
      const marker = this.findMarkerNear(p.x, p.y);
      this.selectMarker(marker);
      if (marker) {
        const a = this.markerAnchor(marker);
        this.modifyDragOffset = { x: p.x - a.x, y: p.y - a.y };
        this.modifyDragPushed = false;
      }
      return;
    }
    if (EDITOR_CLICK_TOOLS.has(this.tool)) {
      this.placeAt(p.x, p.y);
    }
  }

  onPointerMove(pointer) {
    const p = this.worldPointFromPointer(pointer);
    const cell = worldToGrid(p.x, p.y);
    EditorScene.setStatus(`x:${Math.round(p.x)} y:${Math.round(p.y)} — case (${cell.gx},${cell.gy})`);

    if (!pointer.isDown) return;
    if (EDITOR_GROUND_PAINT_TOOLS.has(this.tool)) {
      this.paintAt(p.x, p.y);
    } else if (this.tool === 'water' && this.waterDragStart) {
      this.updateWaterPreview(p.x, p.y);
    } else if (this.tool === 'portal' && this.portalDragStart) {
      this.updatePortalPreview(p.x, p.y);
    } else if (this.shapeDragStart && EDITOR_STORY_KINDS[this.tool]) {
      this.updateShapePreview(p.x, p.y);
    } else if (this.tool === 'delete') {
      this.deleteNear(p.x, p.y);
    } else if (this.tool === 'modify' && this.selectedMarker && this.modifyDragOffset) {
      // Cf. onPointerDown : un seul snapshot pour tout le glisser, poussé au
      // tout premier mouvement plutôt qu'au clic (un simple clic de
      // sélection, sans jamais bouger la souris, ne doit pas créer de cran
      // d'annulation vide).
      if (!this.modifyDragPushed) { this.pushUndo(); this.modifyDragPushed = true; }
      this.moveSelectedMarker(p.x - this.modifyDragOffset.x, p.y - this.modifyDragOffset.y);
    }
  }

  onPointerUp(pointer) {
    if (this.tool === 'water' && this.waterDragStart) {
      const p = this.worldPointFromPointer(pointer);
      this.finishWaterDrag(p.x, p.y);
    }
    if (this.tool === 'portal' && this.portalDragStart) {
      const p = this.worldPointFromPointer(pointer);
      this.finishPortalDrag(p.x, p.y);
    }
    if (this.shapeDragStart && EDITOR_STORY_KINDS[this.tool]) {
      const p = this.worldPointFromPointer(pointer);
      this.finishShapeDrag(p.x, p.y);
    }
    this.shapeDragStart = null;
    this.modifyDragOffset = null;
    this.waterDragStart = null;
    this.portalDragStart = null;
    this.lastPaintedCell = null;
  }

  // Glisser vite (vrai mouvement de souris comme un clic-glisser rapide,
  // pas seulement les mouvements synthétiques d'un test) ne déclenche pas
  // un pointermove par cellule traversée — sans ce rattrapage, peindre
  // vite laissait des trous dans la ligne de cases (cf. le drag de test qui
  // avait sauté la case du milieu). On relie donc la dernière case peinte à
  // la nouvelle par un simple Bresenham sur les coordonnées de grille.
  paintAt(worldX, worldY) {
    const { gx, gy } = worldToGrid(worldX, worldY);
    if (this.lastPaintedCell && this.lastPaintedCell.gx === gx && this.lastPaintedCell.gy === gy) return;

    if (this.lastPaintedCell) {
      this.paintLine(this.lastPaintedCell.gx, this.lastPaintedCell.gy, gx, gy);
    } else {
      this.paintCell(gx, gy);
    }
    this.lastPaintedCell = { gx, gy };
    this.redrawGround();
  }

  paintLine(gx0, gy0, gx1, gy1) {
    let x = gx0;
    let y = gy0;
    const dx = Math.abs(gx1 - gx0);
    const dy = -Math.abs(gy1 - gy0);
    const sx = gx0 < gx1 ? 1 : -1;
    const sy = gy0 < gy1 ? 1 : -1;
    let err = dx + dy;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      this.paintCell(x, y);
      if (x === gx1 && y === gy1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }

  // N'écrit que dans data.groundCells -- pas de redraw ici : pendant un
  // glisser, paintLine() appelle ceci pour chaque case traversée, et
  // reconstruire tout le rendu à chaque case serait inutilement coûteux
  // (voir le seul redrawGround() en fin de paintAt).
  paintCell(gx, gy) {
    const arr = EDITOR_BACK_LAYER_TOOLS.has(this.tool) ? this.data.groundBackCells : this.data.groundCells;
    const idx = arr.findIndex(([cx, cy]) => cx === gx && cy === gy);
    if (!EDITOR_ERASE_TOOLS.has(this.tool)) {
      if (idx >= 0) arr[idx][2] = this.material;
      else arr.push([gx, gy, this.material]);
    } else if (idx >= 0) {
      arr.splice(idx, 1);
    }
  }

  redrawGround() {
    for (const img of this.groundImages) img.destroy();
    const backImages = renderAutotileGrid(this, null, this.data.groundBackCells, { back: true });
    const frontImages = renderAutotileGrid(this, null, this.data.groundCells);
    this.groundImages = [...backImages, ...frontImages];
    EditorScene.setStatus(`${this.data.groundCells.length} case(s) de sol, ${this.data.groundBackCells.length} arrière-plan`);
  }

  updateWaterPreview(worldX, worldY) {
    if (this.waterPreview) this.waterPreview.destroy();
    const x0 = Math.min(this.waterDragStart.x, worldX);
    const y0 = Math.min(this.waterDragStart.y, worldY);
    const w = Math.abs(worldX - this.waterDragStart.x);
    const h = Math.abs(worldY - this.waterDragStart.y);
    this.waterPreview = this.add.rectangle(x0 + w / 2, y0 + h / 2, w, h, 0x1c5f6e, 0.45)
      .setStrokeStyle(1, 0x9fe6e0, 0.8);
  }

  finishWaterDrag(worldX, worldY) {
    if (this.waterPreview) {
      this.waterPreview.destroy();
      this.waterPreview = null;
    }
    const x0 = Math.min(this.waterDragStart.x, worldX);
    const y0 = Math.min(this.waterDragStart.y, worldY);
    const w = Math.abs(worldX - this.waterDragStart.x);
    const h = Math.abs(worldY - this.waterDragStart.y);
    if (w < 8 || h < 8) return; // clic sans glisser : ignoré

    this.pushUndo();
    const entry = { x: x0, y: y0, width: w, height: h };
    this.data.water.push(entry);
    const obj = this.add.rectangle(x0 + w / 2, y0 + h / 2, w, h, 0x1c5f6e, 0.45)
      .setStrokeStyle(1, 0x9fe6e0, 0.8);
    this.markers.push({ kind: 'water', entry, obj: [obj], sourceArray: this.data.water });
  }

  // Retour utilisateur : "pour les sortie niveau je veux définir une
  // ligne, je sélectionne sortie, je clique à un endroit et glisse pour la
  // dimension de la ligne" -- même geste que l'outil Eau (clic-glisser),
  // mais un SEGMENT VERTICAL (x fixé au clic de départ, seule la hauteur
  // varie avec le glisser) plutôt qu'un rectangle libre : un portail est un
  // seuil vertical (cf. updateLevelFromData dans LevelKit.js), pas une
  // zone 2D.
  //
  // Retour utilisateur (round suivant) : "les connexion entré sortie sont
  // trop complexe... fusionne entré et sortie en 1 seul truc" -- CE geste
  // pose maintenant À LA FOIS l'entrée ET la sortie au même endroit (cf.
  // finishPortalDrag), remplaçant les 2 outils/gestes séparés d'avant.
  updatePortalPreview(worldX, worldY) {
    if (this.portalPreview) this.portalPreview.destroy();
    const x = this.portalDragStart.x;
    const y0 = Math.min(this.portalDragStart.y, worldY);
    const y1 = Math.max(this.portalDragStart.y, worldY);
    const height = Math.max(y1 - y0, EDITOR_EXIT_MIN_DRAG);
    this.portalPreview = this.add.rectangle(x, (y0 + y1) / 2, 6, height, 0xb388ff, 0.5)
      .setStrokeStyle(1, 0xe0ccff, 0.8);
  }

  // Pose UN portail = une sortie (data.exits) + une entrée (data.entries)
  // au même x/y/height, reliées par `portalId` (cf. openConnectPicker, qui
  // les traite désormais comme une seule paire à connecter).
  //
  // Retour utilisateur : "je veux pas avoir choisir le nom d'un portail
  // avant de le mettre mais apres, ça me met un input quand je lache le
  // clique et pose le portail" -- la cible n'est plus pré-remplie dans un
  // champ à part AVANT de glisser (l'ancien champ "Cible directe" à
  // toujours-visible, fastidieux à retaper avant chaque pose) : un
  // `window.prompt` s'ouvre juste APRÈS le relâchement, une fois le
  // portail déjà posé -- annuler/laisser vide le garde simplement non relié
  // (reliable ensuite via ce même prompt en le reposant, ou depuis l'écran
  // "Zones" comme n'importe quel portail).
  finishPortalDrag(worldX, worldY) {
    if (this.portalPreview) {
      this.portalPreview.destroy();
      this.portalPreview = null;
    }
    const x = this.portalDragStart.x;
    const y0 = Math.min(this.portalDragStart.y, worldY);
    const y1 = Math.max(this.portalDragStart.y, worldY);
    const dragged = y1 - y0;
    // Glisser négligeable (quasi un simple clic) : hauteur par défaut
    // centrée sur le point de clic plutôt qu'une ligne quasi invisible.
    const height = dragged < EDITOR_EXIT_MIN_DRAG ? EDITOR_EXIT_DEFAULT_HEIGHT : dragged;
    const y = dragged < EDITOR_EXIT_MIN_DRAG ? this.portalDragStart.y : (y0 + y1) / 2;
    this.pushUndo();

    const promptedTarget = window.prompt('Cible directe du portail (nom de scène, optionnel -- laisser vide pour relier plus tard depuis "Zones") :', '');
    const targetScene = (promptedTarget && promptedTarget.trim()) || null;
    const portalId = EditorScene.generateEntryId();
    const exitEntry = { x, y, height, targetScene, data: {}, portalId };
    const entryEntry = { id: portalId, x, y, height, portalId };
    this.data.exits.push(exitEntry);
    this.data.entries.push(entryEntry);
    const { obj, label } = EditorScene.buildPortalVisual(this, exitEntry);
    this.markers.push({
      kind: 'portal', entry: exitEntry, pairEntry: entryEntry, obj: [obj, label], sourceArray: this.data.exits,
    });
  }

  // Dessin partagé placement/rechargement (cf. finishPortalDrag et
  // applyLevelData) : un fin bandeau vertical de la hauteur définie par
  // l'utilisateur (`entry.height`), violet (ni le rouge "sortie" ni le
  // cyan "entrée" d'avant -- une seule couleur pour la notion fusionnée).
  static buildPortalVisual(scene, entry) {
    const height = entry.height || EDITOR_EXIT_DEFAULT_HEIGHT;
    const obj = scene.add.rectangle(entry.x, entry.y, 6, height, 0xb388ff, 0.6)
      .setStrokeStyle(1, 0xe0ccff, 0.9);
    const label = scene.add.text(entry.x, entry.y - height / 2 - 12, `Portail ${entry.targetScene ? `-> ${entry.targetScene}` : '(non relié)'}`, {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#e0ccff',
    }).setOrigin(0.5);
    return { obj, label };
  }

  // Rendu de secours pour d'anciennes sorties/entrées posées AVANT la
  // fusion en portails (pas de `portalId`, cf. applyLevelData) -- gardé tel
  // quel (rouge/cyan) pour continuer à distinguer visuellement ces
  // vestiges non-appairés d'un vrai portail.
  static buildExitVisual(scene, entry) {
    const height = entry.height || EDITOR_EXIT_DEFAULT_HEIGHT;
    const obj = scene.add.rectangle(entry.x, entry.y, 6, height, 0xff6666, 0.6)
      .setStrokeStyle(1, 0xffb3b3, 0.9);
    const label = scene.add.text(entry.x, entry.y - height / 2 - 12, `Sortie ${entry.targetScene ? `-> ${entry.targetScene}` : '(non reliée)'}`, {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#ff9999',
    }).setOrigin(0.5);
    return { obj, label };
  }

  static buildEntryVisual(scene, entry) {
    const height = entry.height || EDITOR_EXIT_DEFAULT_HEIGHT;
    const obj = scene.add.rectangle(entry.x, entry.y, 6, height, 0x66ccff, 0.6)
      .setStrokeStyle(1, 0xb3e6ff, 0.9);
    const label = scene.add.text(entry.x, entry.y - height / 2 - 12, 'Entrée (ancienne)', {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#b3e6ff',
    }).setOrigin(0.5);
    return { obj, label };
  }

  // Équivalent de `groundSurfaceYAt` (LevelKit.js) mais lu directement sur
  // `data.groundCells` (coordonnées de grille) plutôt que sur des corps
  // physiques : l'éditeur ne construit jamais `scene.ground` (pas de
  // physique tant qu'on ne playteste pas, cf. redrawGround), donc rien à
  // sonder côté physique ici. Retour utilisateur : "les totems sont trop
  // hauts, ils ne touchent pas le sol" -- au RUNTIME (buildLevelFromData)
  // totems/décors sont déjà recalés sur le sol réel, mais l'éditeur plaçait
  // leur marqueur de prévisualisation pile au clic, sans jamais le recaler
  // -- ce qui pouvait rester correct à l'export mais donnait l'impression
  // d'un objet qui flotte tant qu'on ne lance pas un Playtest pour vérifier.
  // Ne considère que les cases dont le dessus est EXPOSÉ (pas de voisine au
  // nord) : une case enterrée n'est pas une vraie surface où poser un objet.
  // `referenceY` : cf. groundSurfaceYAt, même logique de plus proche voisin
  // pour ne pas sauter sur une autre plateforme juste parce qu'elle existe
  // plus haut dans la même colonne.
  groundSurfaceYAtGrid(worldX, referenceY) {
    return EditorScene.groundSurfaceYAtGridStatic(this.data.groundCells, worldX, referenceY);
  }

  // Extrait en static (cf. resolvePortalChoice, qui n'a pas de scène vivante
  // -- appelé depuis l'écran "Zones", sur de simples objets de données) :
  // même recette de plus proche colonne EXPOSÉE (pas de voisine au nord).
  static groundSurfaceYAtGridStatic(groundCells, worldX, referenceY) {
    const solid = new Set(groundCells.map(([cx, cy]) => `${cx},${cy}`));
    const gx = Math.floor(worldX / GROUND_TILE_SIZE);
    let best = null;
    let bestDist = Infinity;
    for (const [cx, cy] of groundCells) {
      if (cx !== gx || solid.has(`${cx},${cy - 1}`)) continue;
      const top = cy * GROUND_TILE_SIZE;
      const dist = Math.abs(top - referenceY);
      if (dist < bestDist) { bestDist = dist; best = top; }
    }
    return best;
  }

  placeAt(worldX, worldY) {
    // Toujours appelée depuis onPointerDown pour un outil-clic (spawn/
    // totem/ennemi/prop, cf. EDITOR_CLICK_TOOLS) -- un seul appel = une
    // seule action, donc un seul snapshot ici couvre les 4 cas sans
    // dupliquer pushUndo() dans chaque branche ci-dessous.
    this.pushUndo();
    if (this.tool === 'spawn') {
      this.removeMarkersOfKind('spawn');
      this.data.playerSpawn = { x: worldX, y: worldY };
      const obj = this.addMarkerVisual(worldX, worldY, 0x66ff99, 'D');
      this.markers.push({ kind: 'spawn', entry: this.data.playerSpawn, obj: [obj], sourceArray: null });
      return;
    }
    if (this.tool === 'campfire') {
      // Retour utilisateur : "rajoute le feu de camp dans les element
      // rajoutable dans le mode édit" -- jusqu'ici planté à la main dans
      // Zone1Scene.js (cf. addCampfire dans LevelKit.js), donc invisible/
      // impossible à repositionner ou ajouter ailleurs depuis l'éditeur.
      // Même schéma que 'prop'/'totem' : calé sur le sol RÉEL de la grille
      // au moment du placement (aperçu honnête), `addCampfire` au runtime
      // (buildLevelFromData) refait le même calage sur le sol RÉEL une
      // fois construit -- jamais figé en dur.
      const y = this.groundSurfaceYAtGrid(worldX, worldY) ?? worldY;
      const entry = { x: worldX, y };
      this.data.campfires.push(entry);
      // `${CAMPFIRE_TEXTURE_PREFIX}0` (cf. LevelKit.js) : simple pose
      // statique pour l'aperçu éditeur -- l'animation de flammes en
      // continu (ensureCampfireAnimation) n'est posée qu'au runtime par
      // addCampfire, pas ici (l'éditeur n'affiche jamais d'animation).
      // + CAMPFIRE_SINK : même enfoncement que addCampfire (les bûches
      // débordent sous le cadre découpé), pour que l'aperçu ne mente pas --
      // même raison que TOTEM_GROUND_SINK pour l'outil Totem juste au-dessus.
      const obj = this.add.image(worldX, y + CAMPFIRE_SINK, `${CAMPFIRE_TEXTURE_PREFIX}0`).setOrigin(0.5, 1).setScale(CAMPFIRE_SCALE);
      this.markers.push({ kind: 'campfire', entry, obj: [obj], sourceArray: this.data.campfires });
      return;
    }
    if (this.tool === 'totem') {
      const flag = this.subtype;
      const y = this.groundSurfaceYAtGrid(worldX, worldY) ?? worldY;
      const entry = { x: worldX, y, flag, message: EDITOR_DEFAULT_TOTEM_MESSAGE };
      this.data.totems.push(entry);
      const totemType = TOTEM_TYPE_BY_FLAG[flag] || 'wolf';
      // + TOTEM_GROUND_SINK (cf. LevelKit.js) : même enfoncement qu'au
      // runtime (addAbilityShrine), pour que la prévisualisation ne mente
      // pas -- `entry.y` lui reste la référence de surface "propre", non
      // enfoncée (cf. addAbilityShrine, qui applique le même +SINK lui-même).
      const obj = this.add.image(worldX, y + TOTEM_GROUND_SINK, `totem-${totemType}-lit`).setOrigin(0.5, 1).setScale(TOTEM_SCALE);
      this.markers.push({ kind: 'totem', entry, obj: [obj], sourceArray: this.data.totems });
      return;
    }
    if (this.tool === 'enemy') {
      const type = this.subtype;
      const entry = { type, x: worldX, y: worldY };
      if (EDITOR_ENEMY_BY_TYPE[type] && EDITOR_ENEMY_BY_TYPE[type].patrol) {
        entry.patrolMinX = worldX - EDITOR_ENEMY_PATROL_HALF_WIDTH;
        entry.patrolMaxX = worldX + EDITOR_ENEMY_PATROL_HALF_WIDTH;
      }
      this.data.enemies.push(entry);
      const color = EDITOR_ENEMY_MARKER_COLORS[type] || 0xffffff;
      const obj = this.addMarkerVisual(worldX, worldY, color, EDITOR_ENEMY_MARKER_LABELS[type] || '?');
      const extras = [obj];
      if (entry.patrolMinX !== undefined) {
        extras.push(this.add.rectangle(worldX, worldY, EDITOR_ENEMY_PATROL_HALF_WIDTH * 2, 4, color, 0.35));
      }
      this.markers.push({ kind: 'enemy', entry, obj: extras, sourceArray: this.data.enemies });
      return;
    }
    if (this.tool === 'prop') {
      const type = this.subtype;
      const y = this.groundSurfaceYAtGrid(worldX, worldY) ?? worldY;
      const entry = { type, x: worldX, y, scale: PROP_SCALE };
      this.data.props.push(entry);
      const obj = this.add.image(worldX, y + PROP_GROUND_SINK, `${PROP_PREFIX}${type}`).setOrigin(0.5, 1).setScale(PROP_SCALE);
      this.markers.push({ kind: 'prop', entry, obj: [obj], sourceArray: this.data.props });
    }
  }

  // --- Éléments de l'histoire (cf. EDITOR_STORY_KINDS) ---

  // Géométrie d'un glisser selon la forme de l'outil ; un simple clic (glisser
  // négligeable) prend la taille par défaut de l'outil.
  shapeGeometry(kind, x1, y1) {
    const def = EDITOR_STORY_KINDS[kind];
    const s = this.shapeDragStart;
    if (!Number.isFinite(x1) || !Number.isFinite(y1)) { x1 = s.x; y1 = s.y; }
    if (def.shape === 'vine') {
      const dy = y1 - s.y;
      return { x: s.x, y: s.y, length: dy < EDITOR_MIN_RECT ? 200 : dy };
    }
    const size = def.defaultSize || { w: 96, h: 96 };
    let x = Math.min(s.x, x1);
    let y = Math.min(s.y, y1);
    let w = Math.abs(x1 - s.x);
    let h = Math.abs(y1 - s.y);
    if (def.shape === 'hline') {
      if (w < EDITOR_MIN_RECT) { x = s.x; w = size.w; }
      return { x, y: s.y, w, h: 0 };
    }
    if (w < EDITOR_MIN_RECT || h < EDITOR_MIN_RECT) {
      w = size.w; h = size.h; x = s.x - w / 2; y = s.y - h / 2;
      return { x, y, w, h, clicked: true };
    }
    return { x, y, w, h };
  }

  updateShapePreview(worldX, worldY) {
    if (this.shapePreview) this.shapePreview.destroy();
    const g = this.shapeGeometry(this.tool, worldX, worldY);
    if (EDITOR_STORY_KINDS[this.tool].shape === 'vine') {
      this.shapePreview = this.add.rectangle(g.x, g.y + g.length / 2, 6, g.length, 0x5fae3a, 0.5);
    } else {
      this.shapePreview = this.add.rectangle(g.x + g.w / 2, g.y + g.h / 2, g.w, Math.max(g.h, 6), 0xffffff, 0.15)
        .setStrokeStyle(1, 0xffffff, 0.8);
    }
  }

  finishShapeDrag(worldX, worldY) {
    if (this.shapePreview) { this.shapePreview.destroy(); this.shapePreview = null; }
    this.placeStoryElement(this.tool, this.shapeGeometry(this.tool, worldX, worldY));
  }

  // Crée l'entrée (cf. def.create, qui peut demander un champ via prompt()
  // et renvoyer null = annulé), l'ajoute au tableau de la donnée (créé au
  // besoin) et pose son marqueur.
  placeStoryElement(kind, geom) {
    const def = EDITOR_STORY_KINDS[kind];
    const snapshot = JSON.stringify(this.data);
    const entry = def.create(this, geom, this.subtype);
    if (!entry) return null;
    this.undoStack.push(snapshot);
    if (this.undoStack.length > EDITOR_UNDO_MAX) this.undoStack.shift();
    if (!Array.isArray(this.data[def.key])) this.data[def.key] = [];
    this.data[def.key].push(entry);
    const marker = this.addStoryMarker(kind, entry);
    EditorScene.setStatus(`${def.label} ajouté(e) (${def.key}).`);
    return marker;
  }

  addStoryMarker(kind, entry) {
    const def = EDITOR_STORY_KINDS[kind];
    const marker = { kind, entry, obj: def.draw(this, entry), sourceArray: this.data[def.key] };
    this.markers.push(marker);
    return marker;
  }

  // Redessine un marqueur après modification de son entrée (déplacement,
  // molette, propriétés) -- plus simple et plus sûr que de recaler chaque
  // objet un à un.
  redrawMarker(m) {
    for (const o of m.obj) o.destroy();
    const def = EDITOR_STORY_KINDS[m.kind];
    if (def) m.obj = def.draw(this, m.entry);
  }

  // Point de référence d'un marqueur (test de clic, glisser de l'outil Modifier).
  markerAnchor(m) {
    const def = EDITOR_STORY_KINDS[m.kind];
    if (def) return def.anchor(this, m.entry);
    if (m.kind === 'water') return { x: m.entry.x + m.entry.width / 2, y: m.entry.y + m.entry.height / 2 };
    return { x: m.entry.x, y: m.entry.y != null ? m.entry.y : (m.displayY ?? 0) };
  }

  snapY(x, y) {
    return Math.round(this.groundSurfaceYAtGrid(x, y) ?? y);
  }

  groundYOr(x, fallback) {
    return this.groundSurfaceYAtGrid(x, fallback) ?? fallback;
  }

  markerLabel(x, y, text, color) {
    return this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '11px', color, backgroundColor: 'rgba(13,11,26,0.6)', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1).setDepth(500);
  }

  // Mousse : x, y = CENTRE ; y absent = posée sur le sol (cf. mossRect dans StoryKit).
  mossCenter(e, defaultH) {
    const h = e.h || defaultH;
    return { x: e.x, y: e.y != null ? e.y : this.groundYOr(e.x, 400) - h / 2 };
  }

  // Centre vertical d'une mousse posée : un simple clic la pose SUR le sol
  // sous le point cliqué (au lieu de la centrer sur le clic, à moitié enterrée).
  mossClickY(g) {
    const cy = g.y + g.h / 2;
    return g.clicked ? Math.round(this.snapY(g.x + g.w / 2, cy) - g.h / 2) : Math.round(cy);
  }

  drawMossMarker(e, defaultH, color, label) {
    const w = e.w || 96;
    const h = e.h || defaultH;
    const c = this.mossCenter(e, defaultH);
    const rect = this.add.rectangle(c.x, c.y, w, h, color, 0.55).setStrokeStyle(2, 0x9bff5a, 0.8);
    return [rect, this.markerLabel(c.x, c.y - h / 2 - 4, label, '#9bff5a')];
  }

  addMarkerVisual(x, y, color, label) {
    const container = this.add.container(x, y);
    const circle = this.add.circle(0, 0, 14, color, 0.85).setStrokeStyle(2, 0xffffff, 0.8);
    const text = this.add.text(0, 0, label, { fontFamily: 'sans-serif', fontSize: '13px', color: '#1a1030' }).setOrigin(0.5);
    container.add([circle, text]);
    return container;
  }

  removeMarkersOfKind(kind) {
    this.markers = this.markers.filter((m) => {
      if (m.kind !== kind) return true;
      for (const o of m.obj) o.destroy();
      return false;
    });
  }

  // Retour utilisateur : "supprimé ne prend pas toute l'image" -- pour un
  // décor/totem/feu de camp affiché en GRAND (une vraie image, cf. placeAt),
  // cliquer loin de son point d'ancrage (le pied de l'image, cf. setOrigin
  // (0.5,1)) mais toujours DANS l'image ne touchait rien : seule la distance
  // à l'ancre comptait (EDITOR_MARKER_HIT_RADIUS, pensé pour les petits
  // marqueurs cercle+lettre spawn/ennemi). Un marqueur est maintenant aussi
  // détecté si le point clique tombe dans les vrais bounds affichés de son
  // image (m.obj[0].getBounds()) -- en PLUS du rayon existant (jamais à sa
  // place, seulement en complément : les petits marqueurs sans image restent
  // cliquables avec la même marge généreuse qu'avant).
  findMarkerNear(worldX, worldY) {
    let best = null;
    let bestDist = Infinity;
    for (const m of this.markers) {
      // Sortie : plus une ligne verticale (cf. placeAt), un point comme
      // les autres -- même calcul de proximité, plus de cas particulier.
      const p = this.markerAnchor(m);
      const d = Phaser.Math.Distance.Between(worldX, worldY, p.x, p.y);
      const primary = m.obj[0];
      const hitsBounds = primary && primary.getBounds ? primary.getBounds().contains(worldX, worldY) : false;
      if (!(d < EDITOR_MARKER_HIT_RADIUS || hitsBounds)) continue;
      if (d < bestDist) { bestDist = d; best = m; }
    }
    return best;
  }

  deleteNear(worldX, worldY) {
    const best = this.findMarkerNear(worldX, worldY);
    if (!best) return;
    if (best === this.selectedMarker) this.selectMarker(null);
    for (const o of best.obj) o.destroy();
    if (best.sourceArray) {
      const i = best.sourceArray.indexOf(best.entry);
      if (i >= 0) best.sourceArray.splice(i, 1);
    } else if (best.kind === 'spawn') {
      this.data.playerSpawn = null;
    }
    // Portail = paire sortie+entrée (cf. finishPortalDrag) : supprimer la
    // moitié "sortie" ci-dessus ne retire pas sa moitié "entrée" -- sans ce
    // second retrait, une entrée fantôme (plus jamais affichée/éditable,
    // toujours dans data.entries) restait ciblable par un futur `enterId`.
    if (best.kind === 'portal' && best.pairEntry) {
      const j = this.data.entries.indexOf(best.pairEntry);
      if (j >= 0) this.data.entries.splice(j, 1);
    }
    this.markers = this.markers.filter((m) => m !== best);
  }

  // Retour utilisateur : "je veux une option modifier qui permet de
  // selectionner un element de le deplacer l'agrandir etc" -- outil
  // 'modify' : réutilise le même hit-test que Supprimer (findMarkerNear) au
  // lieu d'un système de sélection séparé. Sélectionner un AUTRE marqueur
  // (ou cliquer dans le vide, marker=null) remplace toujours la sélection en
  // cours -- un seul élément modifiable à la fois.
  selectMarker(marker) {
    this.selectedMarker = marker || null;
    this.updateSelectionVisual();
    EditorScene.syncSelectionUI(this);
  }

  // Rectangle en pointillés jaunes autour des bounds RÉELS de l'image
  // sélectionnée (pas un simple point comme les marqueurs cercle+lettre) --
  // redessiné à chaque déplacement/redimensionnement plutôt que suivi
  // automatiquement, pour rester juste même après un changement d'échelle.
  updateSelectionVisual() {
    if (!this.selectionGraphics) return;
    this.selectionGraphics.clear();
    if (!this.selectedMarker) return;
    const b = this.selectedMarker.obj[0].getBounds();
    this.selectionGraphics.lineStyle(2, 0xffe066, 1);
    this.selectionGraphics.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
  }

  // Déplace le marqueur sélectionné à cette position monde -- même calage
  // sol que placeAt pour les types qui y sont posés dessus (totem/feu de
  // camp/décor), sinon la position brute (ennemi/spawn, cf. placeAt).
  moveSelectedMarker(worldX, worldY) {
    const m = this.selectedMarker;
    if (!m) return;
    const entry = m.entry;
    const storyDef = EDITOR_STORY_KINDS[m.kind];
    if (storyDef) {
      storyDef.move(this, entry, worldX, worldY);
      this.redrawMarker(m);
      this.updateSelectionVisual();
      return;
    }
    if (m.kind === 'water') {
      entry.x = Math.round(worldX - entry.width / 2);
      entry.y = Math.round(worldY - entry.height / 2);
      m.obj[0].setPosition(entry.x + entry.width / 2, entry.y + entry.height / 2);
      this.updateSelectionVisual();
      return;
    }
    if (m.kind === 'portal' || m.kind === 'exit' || m.kind === 'entry') {
      // Portail : la sortie ET son entrée jumelle bougent ensemble, étiquette comprise.
      entry.x = Math.round(worldX);
      entry.y = Math.round(worldY);
      if (m.pairEntry) { m.pairEntry.x = entry.x; m.pairEntry.y = entry.y; }
      for (const o of m.obj) o.destroy();
      const build = m.kind === 'portal' ? EditorScene.buildPortalVisual : m.kind === 'exit' ? EditorScene.buildExitVisual : EditorScene.buildEntryVisual;
      const { obj, label } = build(this, entry);
      m.obj = [obj, label];
      this.updateSelectionVisual();
      return;
    }
    entry.x = worldX;
    entry.y = EDITOR_GROUND_SNAPPED_KINDS.has(m.kind)
      ? (this.groundSurfaceYAtGrid(worldX, worldY) ?? worldY)
      : worldY;

    if (m.kind === 'totem') {
      m.obj[0].setPosition(entry.x, entry.y + TOTEM_GROUND_SINK);
    } else if (m.kind === 'campfire') {
      m.obj[0].setPosition(entry.x, entry.y + CAMPFIRE_SINK);
    } else if (m.kind === 'prop') {
      // Même surface que dans le jeu (cf. groundStandYAt / PROP_GROUND_SINK).
      m.obj[0].setPosition(entry.x, entry.y + PROP_GROUND_SINK);
    } else if (m.kind === 'enemy') {
      m.obj[0].setPosition(entry.x, entry.y);
      // obj[1] (s'il existe) : bande de patrouille, recentrée avec lui pour
      // rester cohérente avec patrolMinX/patrolMaxX (cf. placeAt).
      if (entry.patrolMinX !== undefined) {
        entry.patrolMinX = entry.x - EDITOR_ENEMY_PATROL_HALF_WIDTH;
        entry.patrolMaxX = entry.x + EDITOR_ENEMY_PATROL_HALF_WIDTH;
        if (m.obj[1]) m.obj[1].setPosition(entry.x, entry.y);
      }
    } else {
      m.obj[0].setPosition(entry.x, entry.y);
    }
    this.updateSelectionVisual();
  }

  // Molette pendant que l'outil 'modify' a un élément redimensionnable
  // sélectionné (cf. EDITOR_RESIZABLE_KINDS) -- un seul cran d'annulation
  // pour tout un geste de défilement continu (même esprit que le glisser de
  // peinture/suppression/déplacement), fermé 600ms après le dernier
  // ajustement plutôt que sur un événement de fin de molette (le navigateur
  // n'en fournit pas de fiable).
  handleModifyWheel(deltaY) {
    const m = this.selectedMarker;
    if (this.tool !== 'modify' || !m) return;
    // Éléments de l'histoire : molette = longueur/largeur/nombre (cf. def.wheel).
    const storyDef = EDITOR_STORY_KINDS[m.kind];
    if (storyDef) {
      if (!storyDef.wheel) return;
      if (!this.modifyResizePushed) { this.pushUndo(); this.modifyResizePushed = true; }
      clearTimeout(this.modifyResizeTimer);
      this.modifyResizeTimer = setTimeout(() => { this.modifyResizePushed = false; }, 600);
      storyDef.wheel(m.entry, -Math.sign(deltaY));
      this.redrawMarker(m);
      this.updateSelectionVisual();
      EditorScene.syncSelectionUI(this);
      return;
    }
    if (!EDITOR_RESIZABLE_KINDS.has(m.kind)) return;
    if (!this.modifyResizePushed) {
      this.pushUndo();
      this.modifyResizePushed = true;
    }
    clearTimeout(this.modifyResizeTimer);
    this.modifyResizeTimer = setTimeout(() => { this.modifyResizePushed = false; }, 600);

    const fallback = m.kind === 'totem' ? TOTEM_SCALE : m.kind === 'campfire' ? CAMPFIRE_SCALE : PROP_SCALE;
    const current = m.entry.scale || fallback;
    const next = Phaser.Math.Clamp(
      current - Math.sign(deltaY) * EDITOR_SCALE_STEP,
      EDITOR_MIN_SCALE,
      EDITOR_MAX_SCALE,
    );
    m.entry.scale = next;
    m.obj[0].setScale(next);
    this.updateSelectionVisual();
  }

  // Bouton « Propriétés… » (outil Modifier) : le champ principal de
  // l'élément via prompt() (talk d'un PNJ, cinématique d'un déclencheur,
  // id d'un mur de mousse, force d'un courant d'air...) ; sinon JSON complet.
  editSelectedProperties() {
    const m = this.selectedMarker;
    if (!m) return;
    const field = {
      npc: 'talk', trigger: 'cutscene', mossWall: 'id', mossBlock: 'id', windCurrent: 'force', pickup: 'item', vine: 'length',
    }[m.kind];
    if (!field || (field === 'talk' && m.entry.talk && typeof m.entry.talk !== 'string')) {
      this.editSelectedJSON();
      return;
    }
    const current = m.entry[field] != null ? String(m.entry[field]) : '';
    const answer = window.prompt(`${field} (vide = retirer le champ) :`, current);
    if (answer === null) return;
    this.pushUndo();
    const v = answer.trim();
    if (!v) delete m.entry[field];
    else m.entry[field] = (field === 'force' || field === 'length') && Number.isFinite(Number(v)) ? Number(v) : v;
    this.rebuildFromData(this.data, m.entry);
  }

  // Édition libre de l'entrée sélectionnée en JSON (requires/forbids, once,
  // anim, facing, hp...) -- les champs absents de l'UI restent éditables.
  editSelectedJSON() {
    const m = this.selectedMarker;
    if (!m) return;
    const answer = window.prompt('Propriétés (JSON) :', JSON.stringify(m.entry));
    if (answer === null) return;
    let parsed;
    try {
      parsed = JSON.parse(answer);
    } catch (e) {
      EditorScene.setStatus('JSON invalide, rien modifié.');
      return;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      EditorScene.setStatus('Un objet JSON est attendu, rien modifié.');
      return;
    }
    this.pushUndo();
    for (const k of Object.keys(m.entry)) delete m.entry[k];
    Object.assign(m.entry, parsed);
    this.rebuildFromData(this.data, m.entry);
  }

  setTool(tool) {
    this.tool = tool;
    this.lastPaintedCell = null;
    this.shapeDragStart = null;
    // Changer d'outil quitte le mode Modifier : le contour de sélection ne
    // doit pas rester affiché pendant qu'un autre outil est utilisé.
    if (tool !== 'modify') this.selectMarker(null);
  }

  applyLevelSize(width, height) {
    this.data.levelWidth = width;
    this.data.levelHeight = height;
    this.refreshWorldBounds();
  }

  newLevel() {
    for (const img of this.groundImages) img.destroy();
    for (const m of this.markers) { for (const o of m.obj) o.destroy(); }
    if (this.waterPreview) this.waterPreview.destroy();
    if (this.shapePreview) { this.shapePreview.destroy(); this.shapePreview = null; }
    this.groundImages = [];
    // Clés présentes dans la donnée chargée (cf. applyLevelData /
    // serializeLevelData) : null = niveau neuf, toutes les clés par défaut gardées.
    this.originalKeys = null;
    this.loadedUnsafePaths = [];
    this.markers = [];
    // `this.markers` vient d'être vidé (tous les objets détruits) : une
    // sélection en cours (outil 'modify') pointerait sinon vers un marqueur
    // fantôme (Ctrl+Z, chargement d'une autre zone...).
    this.selectMarker(null);
    this.modifyDragOffset = null;
    this.data = EditorScene.emptyLevelData();
    // Repartir de zéro (ou charger une autre zone, cf. applyLevelData plus
    // bas qui appelle newLevel() en premier) efface l'historique -- annuler
    // ne doit jamais ramener un niveau/une zone PRÉCÉDENT(E), seulement des
    // actions sur celui/celle en cours. `undo()` sauvegarde/restaure
    // explicitement `this.undoStack` autour de son propre appel à
    // applyLevelData() pour ne pas se vider lui-même à chaque Ctrl+Z.
    this.undoStack = [];
    this.refreshWorldBounds();
    this.redrawGround();
    EditorScene.syncUIFromScene(this);
  }

  // Retour utilisateur : d'abord "fais les export et enregistrement dans un
  // dossier du projet... si j'enregistre tu remplace celui qui a le meme
  // nom", puis "fais en sorte que enregistrer rajoute la zone dans la liste
  // des zones du jeu" -- essayé avec File System Access
  // (`showDirectoryPicker`, écriture directe sur disque + câblage
  // automatique d'index.html/main.js). Retour utilisateur suivant : "nan je
  // veux une interface pas ouvrir l'explorateur de fichier" -- un vrai
  // sélecteur de dossier natif reste un sélecteur de dossier natif, même
  // mémorisé pour ne plus jamais le redemander : ça ne correspond pas à "une
  // interface". Enregistrer une zone est donc désormais 100% en local
  // (IndexedDB, cf. idbPutZone) -- instantané, jamais de fenêtre système.
  // Obtenir les VRAIS fichiers à coller dans le projet (pour qu'une zone
  // devienne une vraie scène jouable) reste une étape séparée et
  // explicite : cf. `downloadZoneForProject`, un simple téléchargement de
  // navigateur (jamais de sélecteur de dossier), pas une écriture directe.
  async exportLevel() {
    const safeName = EditorScene.sanitizeLevelName(EditorScene.getLevelNameInput());
    // Garde-fou : une zone écrite à la main peut contenir des fonctions
    // (ex. `talk` conditionnel) qu'une copie JSON perdrait -- ni brouillon
    // (il masquerait le fichier au runtime) ni écriture disque dans ce cas.
    const unsafe = [...(this.loadedUnsafePaths || []), ...EditorScene.unsafePathsForZone(safeName)];
    if (unsafe.length) {
      EditorScene.setStatus(`Enregistrement refusé : la zone contient des valeurs non-JSON (${[...new Set(unsafe)].join(', ')}) que l'éditeur perdrait. Modifie ce fichier à la main.`);
      return;
    }
    const snapshot = this.serializeLevelData();
    try {
      await EditorScene.idbPutZone(safeName, snapshot);
    } catch (e) {
      EditorScene.setStatus(`Échec de l'enregistrement : ${e && e.message}`);
      return;
    }
    const result = await EditorScene.syncZoneToProjectServer(safeName, snapshot);
    if (result && result.ok) {
      const backup = result.backup ? ` Ancienne version copiée dans ${result.backup}.` : '';
      EditorScene.setStatus(result.newlyWired
        ? `Enregistré ET écrit dans le projet : "${safeName}" (${result.sceneClass}).${backup} Nouvelle zone : rafraîchis la page une fois pour la voir en mode de base.`
        : `Enregistré ET mis à jour dans le projet : "${safeName}" (${result.sceneClass}).${backup}`);
      EditorScene.refreshZoneQuickSelect(safeName);
      return;
    }
    if (result && result.error) {
      EditorScene.setStatus(`Brouillon enregistré, mais le fichier du projet n'a PAS été écrit : ${result.error}`);
      return;
    }
    EditorScene.setStatus(`Enregistré : "${safeName}" (ouvre "Zones" pour la voir/la télécharger pour le projet).`);
    EditorScene.refreshZoneQuickSelect(safeName);
  }

  // Retour utilisateur : "pourtant pour les sol ça se met bien a jour dans
  // le jeu de base juste les portail marche pas" -- BUG réel : seul
  // `exportLevel` (le bouton "Enregistrer" de l'écran d'édition normal)
  // appelait tools/dev_server.py. `confirmConnect`/`disconnectZoneExit`
  // (l'écran "Zones", où se fait la connexion des portails, cf.
  // openConnectPicker) écrivent directement en IndexedDB par un chemin
  // SÉPARÉ -- jamais vu par ce fetch, donc jamais écrits dans les vrais
  // fichiers du projet. D'où l'édition du SOL (toujours via "Enregistrer")
  // qui se répercute bien en jeu, mais la CONNEXION d'un portail (toujours
  // via "Zones") qui restait bloquée dans IndexedDB pour de bon. Factorisé
  // ici pour que les 3 chemins d'écriture (exportLevel, confirmConnect,
  // disconnectZoneExit) appellent la même chose après CHAQUE `idbPutZone`,
  // au lieu de ne couvrir qu'un seul d'entre eux. Best-effort partout :
  // silencieux si tools/dev_server.py n'est pas le serveur utilisé (fichier
  // local, `python -m http.server` classique) -- le brouillon IndexedDB
  // reste dans tous les cas la source de vérité tant que rien de plus n'a
  // réussi.
  static async syncZoneToProjectServer(name, data) {
    try {
      const res = await fetch('/__save_zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data }),
      });
      return res.ok ? await res.json() : null;
    } catch (e) {
      return null;
    }
  }

  // Écrit une zone modifiée HORS de l'éditeur (écran Zones : connexion/
  // déconnexion de portails) : mêmes garde-fous que exportLevel.
  static async saveZoneSafely(name, data) {
    const unsafe = EditorScene.unsafePathsForZone(name);
    if (unsafe.length) throw new Error(`"${name}" contient des valeurs non-JSON (${unsafe.join(', ')}), modifie-la à la main`);
    await EditorScene.idbPutZone(name, data);
    const result = await EditorScene.syncZoneToProjectServer(name, data);
    if (result && result.ok === false) throw new Error(`fichier non écrit : ${result.error}`);
    return result;
  }

  // "zone2" -> "Zone2" ; "sous_grotte" -> "SousGrotte" -- pour nommer la
  // classe/scène comme les zones existantes (Zone1Scene, SousGrotteScene...).
  static toPascalCase(snakeName) {
    return snakeName.split('_').filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join('');
  }

  // Un seul store IndexedDB ("zones", nom -> données JSON) -- toute la
  // persistance de l'éditeur tient là-dedans, rien sur disque tant que
  // l'utilisateur ne télécharge pas explicitement (cf.
  // downloadZoneForProject). Version 2 : une v1 antérieure de ce fichier
  // créait un store "handles" pour une poignée de dossier (abandonné, cf.
  // plus haut) -- `onupgradeneeded` ne recrée que ce qui manque, ne casse
  // rien si ce vieux store existe encore chez un utilisateur.
  static openEditorDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(EDITOR_IDB_NAME, 2);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(EDITOR_IDB_ZONES_STORE)) {
          req.result.createObjectStore(EDITOR_IDB_ZONES_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  static async idbGetZone(name) {
    const db = await EditorScene.openEditorDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(EDITOR_IDB_ZONES_STORE, 'readonly').objectStore(EDITOR_IDB_ZONES_STORE).get(name);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  static async idbPutZone(name, data) {
    const db = await EditorScene.openEditorDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(EDITOR_IDB_ZONES_STORE, 'readwrite');
      tx.objectStore(EDITOR_IDB_ZONES_STORE).put(data, name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // « Oublier le brouillon » (écran Zones) : un brouillon IndexedDB masque
  // le fichier de la zone au runtime (resolveZoneData) -- à supprimer quand
  // le fichier écrit à la main doit reprendre la main.
  static async idbDeleteZone(name) {
    const db = await EditorScene.openEditorDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(EDITOR_IDB_ZONES_STORE, 'readwrite');
      tx.objectStore(EDITOR_IDB_ZONES_STORE).delete(name);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async idbGetAllZoneNames() {
    const db = await EditorScene.openEditorDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(EDITOR_IDB_ZONES_STORE, 'readonly').objectStore(EDITOR_IDB_ZONES_STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Zones déjà RÉELLES (chargées par une balise <script src="src/data/...">
  // dans LA PAGE ACTUELLE, cf. index.html) -- lu directement sur le DOM de
  // la page en cours, jamais sur le disque : aucun accès fichier requis
  // pour savoir qu'elles existent.
  // Seuls les fichiers `*_data.js` sont des zones (pas asset_manifest.js...) ;
  // les zones de l'histoire (DEMO_ZONES, StoryKit) sont toujours incluses.
  static listKnownRealZoneNames() {
    const fromScripts = Array.from(document.querySelectorAll('script[src^="src/data/"]'))
      .map((s) => s.getAttribute('src').replace('src/data/', ''))
      .filter((f) => /_data\.js$/.test(f))
      .map((f) => f.replace(/_data\.js$/, ''));
    const story = typeof DEMO_ZONES !== 'undefined' ? DEMO_ZONES.map((z) => z.zone) : [];
    return [...new Set([...story, ...fromScripts])];
  }

  // Génère le contenu des deux fichiers (données + scène) pour une zone --
  // même format que les vraies zones existantes (Zone1Scene.js etc.), donc
  // le même appel à resolveZoneData (cf. LevelKit.js, retour utilisateur :
  // "les maps s'actualise dans le mode edit mais pas dans le mode de
  // base") et le même passage de `sceneData` à buildLevelFromData (cf.
  // `entries`/`enterId`, retour utilisateur : "rajoute des entré...") --
  // sans ça, une zone TOUTE NEUVE créée par ce flux n'aurait profité
  // d'aucun des deux dès sa création.
  static buildZoneFiles(safeName, data) {
    const constName = `${safeName.toUpperCase()}_DATA`;
    const sceneClass = `${EditorScene.toPascalCase(safeName)}Scene`;
    return {
      dataFileName: `${safeName}_data.js`,
      dataContent: `const ${constName} = ${JSON.stringify(data, null, 2)};\n`,
      sceneFileName: `${sceneClass}.js`,
      sceneContent: `class ${sceneClass} extends Phaser.Scene {\n  constructor() {\n    super('${sceneClass}');\n  }\n\n  create(sceneData) {\n    resolveZoneData('${safeName}', ${constName}).then((data) => buildLevelFromData(this, data, sceneData));\n  }\n\n  update(time, delta) {\n    updateLevelFromData(this, time, delta);\n  }\n}\n`,
      constName,
      sceneClass,
    };
  }

  // Retour utilisateur : "je veux une interface pas ouvrir l'explorateur de
  // fichier" -- faire d'une zone une VRAIE scène jouable reste une étape à
  // part (il faut bien, à un moment, de vrais fichiers dans le projet),
  // mais un simple téléchargement de navigateur (comme n'importe quel
  // fichier téléchargé) n'ouvre AUCUNE fenêtre de sélection -- contrairement
  // à `showDirectoryPicker`, que l'utilisateur a explicitement rejeté. Les
  // instructions de câblage (où coller quoi) sont affichées plutôt
  // qu'appliquées automatiquement, puisqu'on n'a plus la main sur les
  // fichiers du projet pour le faire soi-même.
  async downloadZoneForProject(name) {
    try {
      const data = await this.fetchZoneData(name);
      const { dataFileName, dataContent, sceneFileName, sceneContent, sceneClass } = EditorScene.buildZoneFiles(name, data);
      EditorScene.downloadTextFile(dataFileName, dataContent);
      EditorScene.downloadTextFile(sceneFileName, sceneContent);
      EditorScene.setStatus(
        `Téléchargé : ${dataFileName} + ${sceneFileName}. Pour l'intégrer : mets-les dans src/data/ et src/scenes/, ajoute dans index.html <script src="src/data/${dataFileName}"></script> et <script src="src/scenes/${sceneFileName}"></script>, et ajoute "${sceneClass}" dans le tableau scene de main.js.`,
      );
    } catch (e) {
      EditorScene.setStatus(`Échec de l'export : ${e && e.message}`);
    }
  }

  // Charge une zone (réelle déjà chargée en <script>, ou brouillon
  // IndexedDB) dans l'éditeur pour l'éditer -- "modifier" (retour
  // utilisateur) : l'éditer puis Enregistrer sous le même nom la remplace.
  async loadZone(name) {
    if (!name) return;
    try {
      const parsed = await this.fetchZoneData(name);
      this.applyLevelData(parsed);
      this.loadedUnsafePaths = EditorScene.unsafePathsForZone(name);
      const extra = EditorScene.unmanagedKeys(this.data);
      EditorScene.setStatus(`Chargé : ${name}.${extra.length ? ` Clés conservées sans édition : ${extra.join(', ')}.` : ''}${this.loadedUnsafePaths.length ? ' ATTENTION : valeurs non-JSON, enregistrement désactivé.' : ''}`);
      const nameInput = document.getElementById('level-name-input');
      if (nameInput) nameInput.value = name;
    } catch (e) {
      EditorScene.setStatus(`Échec du chargement : ${e && e.message}`);
    }
  }

  // Renvoie l'objet de données RÉSOLU d'une zone sans toucher à l'état de
  // l'éditeur (contrairement à `loadZone`, qui l'applique ensuite) --
  // réutilisé par la vue d'ensemble pour dessiner les miniatures/connexions
  // sans jamais écraser ce qui est en cours d'édition.
  // Retour utilisateur : "les zones actuelles sont pas lisibles apparemment
  // (json)" -- les VRAIES zones écrites à la main (zone1/zone3/zone4/
  // zone5/sous_grotte/zone_aquatique) ne sont PAS du JSON : commentaires,
  // constantes intermédiaires, expressions calculées et appels de fonction
  // (...groundRow(0, 36, [7, 8])) -- mais elles sont déjà chargées par une
  // balise <script> au démarrage de la page (cf. index.html) : le
  // NAVIGATEUR a déjà tout résolu dans la vraie `const NOM_DATA` -- pas
  // besoin de lire/parser quoi que ce soit dans ce cas, juste reprendre
  // cette valeur déjà toute faite (cf. readGlobalConst). Sinon (une zone
  // encore seulement en brouillon), lit le store IndexedDB.
  // Retour utilisateur (bug réel) : "le bouton enregistrer nous dis que ça
  // enregistre mais ça met pas la map a jour" + "la croix pour couper une
  // liaison marche pas" -- les DEUX venaient d'ici. `idbPutZone` (cf.
  // exportLevel/disconnectZoneExit) écrivait bien le brouillon modifié dans
  // IndexedDB, mais cette fonction lisait la `const NOM_DATA` RÉELLE (cf.
  // readGlobalConst, chargée en <script> au démarrage, jamais modifiée) EN
  // PREMIER dès qu'elle existe -- pour une zone déjà réelle (zone1, zone3...,
  // le cas le plus courant en pratique), le brouillon IndexedDB restait donc
  // à jamais masqué par l'original figé : "Enregistrer" semblait réussir
  // (message de statut) mais le prochain chargement/aperçu revoyait
  // systématiquement l'ancienne version, et déconnecter une sortie (qui
  // relit puis réécrit via ce même chemin) semblait ne rien faire du tout,
  // la vue d'ensemble se redessinant aussitôt après depuis les données
  // originales toujours connectées. IndexedDB vérifié EN PREMIER maintenant :
  // une fois un brouillon enregistré sous un nom, il prend le pas sur
  // l'original réel de ce nom, exactement l'intention déjà documentée
  // ci-dessus ("si j'enregistre tu remplace celui qui a le meme nom").
  async fetchZoneData(name) {
    const stored = await EditorScene.idbGetZone(name);
    if (stored !== undefined) return stored;
    const constName = `${name.toUpperCase()}_DATA`;
    const existing = EditorScene.readGlobalConst(constName);
    if (existing !== undefined) return JSON.parse(JSON.stringify(existing));
    throw new Error(`zone "${name}" introuvable`);
  }

  // Lit une `const NOM_DATA` déclarée par une balise <script> de premier
  // niveau (cf. loadZone) -- `window[nom]` ne marche PAS pour
  // ça : un `const`/`let` top-level de script classique (pas un module) ne
  // devient JAMAIS une propriété de `window` (seuls `var` et les
  // déclarations de fonction le font), contrairement à ce qu'on pourrait
  // attendre. `new Function('return NOM')()` fonctionne : son corps
  // s'exécute dans la portée globale, qui voit bien ces déclarations (
  // vérifié : `window.ZONE1_DATA` est `undefined`, `new Function(...)`
  // retourne la vraie valeur). N'accepte qu'un identifiant JS déjà propre
  // (garde-fou, même si l'appelant ne construit ce nom qu'à partir de noms
  // de fichiers déjà passés par `sanitizeLevelName`) -- jamais un texte
  // arbitraire injecté dans le `new Function`.
  static readGlobalConst(name) {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) return undefined;
    try {
      // eslint-disable-next-line no-new-func
      return new Function(`try { return ${name}; } catch (e) { return undefined; }`)();
    } catch (e) {
      return undefined;
    }
  }

  static downloadTextFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Convertit un nom saisi librement ("Zone 2", "sous grotte"...) en
  // identifiant snake_case sûr, cohérent avec la convention déjà utilisée
  // par les fichiers de zone existants (zone1_data.js -> ZONE1_DATA,
  // sous_grotte_data.js -> SOUS_GROTTE_DATA...).
  static sanitizeLevelName(raw) {
    let s = (raw || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!s) s = 'level';
    if (/^[0-9]/.test(s)) s = `level_${s}`;
    return s;
  }

  // Identifiant d'un point d'entrée (cf. finishPortalDrag, outil 'portal')
  // -- référencé par sa VALEUR depuis exit.data.enterId (confirmConnect
  // dans EditorScene, resolveZoneData/entries dans LevelKit.js), jamais
  // par position dans le tableau -- doit donc rester stable/unique même
  // après ajout ou suppression d'autres entrées. Réutilisé aussi comme
  // `portalId` (même valeur que `entry.id`) : sert à relier la sortie et
  // l'entrée d'un même portail sans dupliquer le générateur d'id.
  static generateEntryId() {
    return `entry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }

  importLevel(jsonText) {
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      EditorScene.setStatus('Fichier invalide (JSON illisible).');
      return;
    }
    this.applyLevelData(parsed);
    EditorScene.setStatus('Niveau importé.');
  }

  // Reconstruit l'éditeur (données + tous les marqueurs) à partir d'un objet
  // NIVEAU DÉJÀ RÉSOLU (plus de JSON à parser) -- extrait d'`importLevel`
  // pour être réutilisable par `loadZone` sur les zones déjà chargées via
  // <script> ou lues depuis IndexedDB (déjà de vrais objets JS, jamais une
  // chaîne à re-parser).
  applyLevelData(parsed) {
    this.newLevel();
    // Object.assign : TOUTES les clés de `parsed` sont gardées, y compris
    // celles que l'éditeur ne sait pas afficher (script, kainatiArena,
    // ambient, fall...) -- elles repartent telles quelles à la sauvegarde.
    this.data = Object.assign(EditorScene.emptyLevelData(), parsed);
    this.originalKeys = new Set(Object.keys(parsed));
    // Zones plus anciennes (jamais retouchées depuis l'éditeur, cf.
    // buildLevelFromData dans LevelKit.js pour la même normalisation côté
    // jeu) : `exit` singulier -> `exits` tableau d'un seul élément.
    if (!parsed.exits && parsed.exit) { this.data.exits = [parsed.exit]; this.originalKeys.add('exits'); }
    delete this.data.exit;
    this.refreshWorldBounds();
    this.redrawGround();
    for (const entry of this.data.totems) {
      const totemType = TOTEM_TYPE_BY_FLAG[entry.flag] || 'wolf';
      // + TOTEM_GROUND_SINK : cf. placeAt, même raison. `entry.scale` (posé
      // par l'outil 'modify', cf. handleModifyWheel) prime sur la constante
      // par défaut si présent -- sinon un totem redimensionné reviendrait à
      // sa taille d'origine à chaque rechargement de la zone.
      const obj = this.add.image(entry.x, entry.y + TOTEM_GROUND_SINK, `totem-${totemType}-lit`).setOrigin(0.5, 1).setScale(entry.scale || TOTEM_SCALE);
      this.markers.push({ kind: 'totem', entry, obj: [obj], sourceArray: this.data.totems });
    }
    for (const entry of this.data.enemies) {
      const color = EDITOR_ENEMY_MARKER_COLORS[entry.type] || 0xffffff;
      const obj = this.addMarkerVisual(entry.x, entry.y, color, EDITOR_ENEMY_MARKER_LABELS[entry.type] || '?');
      const extras = [obj];
      if (entry.patrolMinX !== undefined) {
        extras.push(this.add.rectangle(entry.x, entry.y, EDITOR_ENEMY_PATROL_HALF_WIDTH * 2, 4, color, 0.35));
      }
      this.markers.push({ kind: 'enemy', entry, obj: extras, sourceArray: this.data.enemies });
    }
    for (const entry of this.data.props) {
      const obj = this.add.image(entry.x, entry.y + PROP_GROUND_SINK, `${PROP_PREFIX}${entry.type}`).setOrigin(0.5, 1).setScale(entry.scale || PROP_SCALE);
      this.markers.push({ kind: 'prop', entry, obj: [obj], sourceArray: this.data.props });
    }
    for (const entry of this.data.campfires) {
      // `entry.scale` : cf. le commentaire équivalent sur les totems ci-dessus.
      const obj = this.add.image(entry.x, entry.y + CAMPFIRE_SINK, `${CAMPFIRE_TEXTURE_PREFIX}0`).setOrigin(0.5, 1).setScale(entry.scale || CAMPFIRE_SCALE);
      this.markers.push({ kind: 'campfire', entry, obj: [obj], sourceArray: this.data.campfires });
    }
    for (const entry of this.data.water) {
      const obj = this.add.rectangle(entry.x + entry.width / 2, entry.y + entry.height / 2, entry.width, entry.height, 0x1c5f6e, 0.45)
        .setStrokeStyle(1, 0x9fe6e0, 0.8);
      this.markers.push({ kind: 'water', entry, obj: [obj], sourceArray: this.data.water });
    }
    if (this.data.playerSpawn) {
      const obj = this.addMarkerVisual(this.data.playerSpawn.x, this.data.playerSpawn.y, 0x66ff99, 'D');
      this.markers.push({ kind: 'spawn', entry: this.data.playerSpawn, obj: [obj], sourceArray: null });
    }
    // Retour utilisateur : "fusionne entré et sortie en 1 seul truc" --
    // une sortie posée avec l'outil 'portal' partage un `portalId` avec son
    // entrée jumelle (cf. finishPortalDrag) : reconstruit UN marqueur
    // 'portal' pour chaque paire trouvée, plutôt que 2 marqueurs 'exit'/
    // 'entry' distincts. Toute entrée non réclamée par une sortie (ancienne
    // donnée d'avant la fusion, ou entrée orpheline) reste affichée à part
    // (cf. buildEntryVisual) pour rester visible/supprimable.
    const claimedEntryIds = new Set();
    for (const entry of this.data.exits) {
      // Anciennes sorties (format `exit` singulier, jamais de `y`/`height`
      // stockés -- cf. normalisation plus haut) : AFFICHÉES sur le sol réel
      // sous ce x, sans écrire ce `y` dans la donnée (round-trip exact ;
      // sans `height`, la sortie reste une colonne pleine hauteur en jeu).
      const displayY = entry.y != null ? entry.y : (this.groundSurfaceYAtGrid(entry.x, 400) ?? 400);
      const shown = entry.y != null ? entry : { ...entry, y: displayY };
      const pairEntry = entry.portalId ? this.data.entries.find((e) => e.id === entry.portalId) : null;
      if (pairEntry) {
        claimedEntryIds.add(pairEntry.id);
        const { obj, label } = EditorScene.buildPortalVisual(this, shown);
        this.markers.push({
          kind: 'portal', entry, pairEntry, displayY, obj: [obj, label], sourceArray: this.data.exits,
        });
      } else {
        const { obj, label } = EditorScene.buildExitVisual(this, shown);
        this.markers.push({ kind: 'exit', entry, displayY, obj: [obj, label], sourceArray: this.data.exits });
      }
    }
    for (const entry of this.data.entries) {
      if (claimedEntryIds.has(entry.id)) continue;
      const { obj, label } = EditorScene.buildEntryVisual(this, entry);
      this.markers.push({ kind: 'entry', entry, obj: [obj, label], sourceArray: this.data.entries });
    }
    // Éléments de l'histoire (npcs, triggers, pickups, mousse, lianes...).
    // Une entrée illisible (champ manquant, sprite inconnu) ne doit jamais
    // empêcher de charger la zone : elle reste dans la donnée, juste sans marqueur.
    for (const [kind, def] of Object.entries(EDITOR_STORY_KINDS)) {
      const list = this.data[def.key];
      if (!Array.isArray(list)) continue;
      for (const entry of list) {
        if (!entry || typeof entry !== 'object') continue;
        try {
          this.addStoryMarker(kind, entry);
        } catch (e) {
          console.warn(`Éditeur : marqueur ${def.key} illisible`, entry, e);
        }
      }
    }
    EditorScene.syncUIFromScene(this);
  }

  // Reconstruit tous les marqueurs depuis `this.data` sans perdre
  // l'historique d'annulation ni les clés d'origine (annuler, édition de
  // propriétés) ; resélectionne l'entrée `keepEntry` si fournie.
  rebuildFromData(data, keepEntry = null) {
    const remaining = this.undoStack;
    const originalKeys = this.originalKeys;
    const unsafe = this.loadedUnsafePaths;
    this.applyLevelData(data);
    this.undoStack = remaining;
    this.originalKeys = originalKeys;
    this.loadedUnsafePaths = unsafe;
    if (keepEntry) this.selectMarker(this.markers.find((m) => m.entry === keepEntry) || null);
  }

  // Donnée prête à sauvegarder : copie JSON de `this.data`, sans les clés
  // par défaut de l'éditeur restées vides qui n'existaient pas dans la zone
  // chargée (pas de `water: []`, `helpText: ''`... ajoutés à une zone écrite
  // à la main). Toutes les autres clés, connues ou non, sont conservées.
  serializeLevelData() {
    const out = JSON.parse(JSON.stringify(this.data));
    if (!this.originalKeys) return out;
    const defaults = EditorScene.emptyLevelData();
    for (const k of Object.keys(defaults)) {
      if (this.originalKeys.has(k)) continue;
      const v = out[k];
      if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) delete out[k];
    }
    for (const [k, v] of Object.entries(out)) {
      if (!this.originalKeys.has(k) && Array.isArray(v) && v.length === 0 && EDITOR_STORY_KIND_BY_KEY[k]) delete out[k];
    }
    return out;
  }

  // Chemins des valeurs qu'une copie JSON perdrait ou altérerait (fonctions,
  // NaN/Infinity) -- ex. `talk: (scene, npc) => ...` d'un PNJ écrit à la main.
  // Sauvegarder une telle zone depuis l'éditeur la casserait : refusé.
  static nonJsonPaths(value, path = '', out = []) {
    if (typeof value === 'function') out.push(path || '(racine)');
    else if (typeof value === 'number' && !Number.isFinite(value)) out.push(path);
    else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) EditorScene.nonJsonPaths(v, path ? `${path}.${k}` : k, out);
    }
    return out;
  }

  // Valeurs non-JSON de la VRAIE zone `name` (const chargée par <script>).
  static unsafePathsForZone(name) {
    const existing = EditorScene.readGlobalConst(`${name.toUpperCase()}_DATA`);
    return existing === undefined ? [] : EditorScene.nonJsonPaths(existing);
  }

  startPlaytest() {
    if (!this.data.playerSpawn) {
      EditorScene.setStatus("Place d'abord un spawn joueur avant de playtester.");
      return;
    }
    document.getElementById('editor-ui').style.display = 'none';
    this.scene.sleep();
    this.scene.launch('PlaytestScene', this.data);
  }

  // --- Pont statique vers le DOM (#editor-ui), câblé une seule fois. ---

  static getEditor() {
    return window.__game.scene.getScene('EditorScene');
  }

  static setStatus(text) {
    const el = document.getElementById('editor-status');
    if (el) el.textContent = text;
  }

  static getLevelNameInput() {
    const el = document.getElementById('level-name-input');
    return (el && el.value.trim()) || '';
  }

  // Nom lisible dérivé d'une clé d'item ("standing_stone" -> "Standing
  // stone") : évite de maintenir un libellé écrit à la main pour chaque
  // nouvel item de chaque nouvelle section (cf. DECOR_SECTIONS).
  static humanizeDecorItemName(item) {
    const words = item.replace(/_/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  static populateSubtypeOptions(tool) {
    const select = document.getElementById('subtype-select');
    const section = document.getElementById('subtype-section');
    const label = document.getElementById('subtype-label');
    if (!select) return;
    select.innerHTML = '';

    // Retour utilisateur : "j'ai rajouter le dossier déco item qui contient
    // d'autre dossier avec le nom des zones pour faire des sections dans le
    // mode édit" -- une <optgroup> HTML par section (cf. DECOR_SECTIONS
    // dans LevelKit.js) plutôt qu'une liste plate, pour que le menu déroulant
    // du décor lise déjà comme des sections une fois plusieurs zones
    // fournies, pas juste une liste d'items sans distinction. Cas à part
    // (pas le chemin générique EDITOR_TOTEM_TYPES/EDITOR_ENEMY_TYPES
    // ci-dessous) car aucun autre outil n'a besoin de ce regroupement.
    if (tool === 'prop') {
      section.style.display = '';
      label.textContent = 'Décor';
      let firstValue = null;
      for (const [sectionName, items] of Object.entries(DECOR_SECTIONS)) {
        const group = document.createElement('optgroup');
        group.label = EditorScene.humanizeDecorItemName(sectionName);
        for (const item of items) {
          const value = `${sectionName}_${item}`;
          if (firstValue === null) firstValue = value;
          const o = document.createElement('option');
          o.value = value;
          o.textContent = EditorScene.humanizeDecorItemName(item);
          group.appendChild(o);
        }
        select.appendChild(group);
      }
      EditorScene.getEditor().subtype = firstValue;
      return;
    }

    let options = null;
    let labelText = '';
    if (tool === 'totem') { options = EDITOR_TOTEM_TYPES; labelText = 'Forme'; }
    else if (tool === 'enemy') { options = EDITOR_ENEMY_TYPES; labelText = 'Ennemi'; }
    else if (tool === 'npc') {
      const manifest = typeof ASSET_MANIFEST !== 'undefined' ? ASSET_MANIFEST : {};
      options = EDITOR_NPC_IDS.filter((id) => manifest[id]).map((id) => ({ value: id, label: (EDITOR_NPC_DEFAULTS[id] || {}).id || id }));
      labelText = 'PNJ (sprite du manifest)';
    } else if (tool === 'pickup') {
      const ids = new Set([
        ...Object.keys(typeof ITEM_INFO !== 'undefined' ? ITEM_INFO : {}),
        ...Object.keys(typeof ITEM_MANIFEST !== 'undefined' ? ITEM_MANIFEST : {}).filter((id) => !EDITOR_NON_PICKUP_ITEM.test(id)),
      ]);
      options = [...ids].map((id) => ({ value: id, label: typeof itemInfo === 'function' && itemInfo(id).name !== id ? `${itemInfo(id).name} (${id})` : id }));
      labelText = 'Objet';
    } else if (tool === 'animal') { options = EDITOR_ANIMAL_TYPES; labelText = 'Animaux'; }

    if (!options) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    label.textContent = labelText;
    for (const opt of options) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      select.appendChild(o);
    }
    EditorScene.getEditor().subtype = options[0].value;
  }

  static syncUIFromScene(scene) {
    const widthInput = document.getElementById('level-width-input');
    const heightInput = document.getElementById('level-height-input');
    if (widthInput) widthInput.value = scene.data.levelWidth;
    if (heightInput) heightInput.value = scene.data.levelHeight;
    EditorScene.syncZonePropsUI(scene);
    EditorScene.syncSelectionUI(scene);
  }

  // Clés de la zone que l'éditeur ne sait ni afficher ni éditer (ambient,
  // fall, kainatiArena...) : conservées telles quelles, juste listées.
  static unmanagedKeys(data) {
    const managed = new Set([
      ...Object.keys(EditorScene.emptyLevelData()),
      ...Object.values(EDITOR_STORY_KINDS).map((d) => d.key),
      ...EDITOR_ZONE_PROP_KEYS,
    ]);
    return Object.keys(data).filter((k) => !managed.has(k));
  }

  static syncZonePropsUI(scene) {
    const d = scene.data;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('zone-name-input', d.zoneName || '');
    set('zone-script-input', d.script || '');
    set('zone-xara-select', d.xara === false ? 'false' : d.xara === true ? 'true' : '');
    for (const [id, key] of [['zone-background-select', 'background'], ['zone-tileset-select', 'tileset']]) {
      const el = document.getElementById(id);
      if (!el) continue;
      // Valeur inconnue de la liste (écrite à la main) : ajoutée pour ne pas l'écraser.
      if (d[key] && ![...el.options].some((o) => o.value === d[key])) {
        const o = document.createElement('option');
        o.value = d[key];
        o.textContent = `${d[key]} (?)`;
        el.appendChild(o);
      }
      el.value = d[key] || '';
    }
    const tall = document.getElementById('zone-tall-input');
    if (tall) tall.checked = !!d.tallLevel;
    const extra = document.getElementById('zone-extra-keys');
    if (extra) {
      const keys = EditorScene.unmanagedKeys(d);
      extra.textContent = keys.length ? `Conservées sans édition : ${keys.join(', ')}` : '';
    }
  }

  // Écrit un champ du panneau de zone dans la donnée ; valeur vide = clé retirée.
  static setZoneProp(key, value) {
    const editor = EditorScene.getEditor();
    if (!editor) return;
    const current = editor.data[key];
    if (value === undefined ? current === undefined : current === value) return;
    editor.pushUndo();
    if (value === undefined) delete editor.data[key];
    else editor.data[key] = value;
    EditorScene.syncZonePropsUI(editor);
  }

  static syncSelectionUI(scene) {
    const section = document.getElementById('selection-section');
    if (!section) return;
    const m = scene.selectedMarker;
    section.style.display = m ? '' : 'none';
    if (!m) return;
    const def = EDITOR_STORY_KINDS[m.kind];
    const info = document.getElementById('selection-info');
    if (info) info.textContent = `${def ? def.label : m.kind} : ${JSON.stringify(m.entry).slice(0, 160)}`;
  }

  static async refreshZoneQuickSelect(selected) {
    const select = document.getElementById('zone-quick-select');
    if (!select) return;
    const real = EditorScene.listKnownRealZoneNames();
    const drafts = await EditorScene.idbGetAllZoneNames().catch(() => []);
    const story = typeof DEMO_ZONES !== 'undefined' ? DEMO_ZONES : [];
    const storyIds = new Set(story.map((z) => z.zone));
    select.innerHTML = '<option value="">— Charger une zone —</option>';
    const addGroup = (label, items) => {
      if (!items.length) return;
      const g = document.createElement('optgroup');
      g.label = label;
      for (const [value, text] of items) {
        const o = document.createElement('option');
        o.value = value;
        o.textContent = text + (drafts.includes(value) ? ' *' : '');
        g.appendChild(o);
      }
      select.appendChild(g);
    };
    addGroup('Histoire (démo)', story.map((z) => [z.zone, `${z.zone} — ${z.name}`]));
    addGroup('Anciennes zones', real.filter((n) => !storyIds.has(n)).map((n) => [n, n]));
    addGroup('Brouillons seuls', drafts.filter((n) => !real.includes(n)).sort().map((n) => [n, n]));
    if (selected) select.value = selected;
  }

  // Active un outil (bouton de la grille OU menu « Plus d'outils »).
  static activateTool(tool) {
    document.querySelectorAll('#editor-ui [data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
    const more = document.getElementById('tool-more-select');
    if (more) more.value = EDITOR_STORY_KINDS[tool] ? tool : '';
    EditorScene.getEditor().setTool(tool);
    document.getElementById('material-section').style.display = (tool === 'ground' || tool === 'ground-back') ? '' : 'none';
    EditorScene.populateSubtypeOptions(tool);
    const hint = {
      trigger: 'Glisser un rectangle (cinématique demandée au lâcher).',
      mossBlock: 'Glisser un rectangle (clic = 96x96).',
      mossWall: 'Glisser un rectangle (clic = 96x192), id demandé.',
      windCurrent: 'Glisser un rectangle (clic = 160x320).',
      vine: 'Clic = point d\'attache, glisser vers le bas = longueur (molette en mode Modifier).',
      track: 'Glisser horizontalement le long du sol.',
      hiddenPlatform: 'Glisser horizontalement sur les cases.',
      npc: 'Clic au sol (dialogue demandé).',
    }[tool];
    if (hint) EditorScene.setStatus(hint);
  }

  static wireUI() {
    if (window.__editorUIWired) return;
    window.__editorUIWired = true;

    // Retour utilisateur : "comme zqsd sert à se déplacer dans le mode edit
    // quand je sélectionne une zone de texte ses touches ne marche pas" --
    // Phaser CAPTURE ces touches (Z/Q/S/D, flèches, Maj -- cf. `this.zqsd`/
    // `this.cursors`/`this.shiftKey` dans create()) : par défaut, ça appelle
    // `preventDefault()` sur l'événement clavier natif AVANT que le champ
    // texte focalisé ne puisse recevoir le caractère, quel que soit le
    // `document.activeElement` (le garde-fou déjà présent dans
    // handleCameraPan ne protège que la caméra elle-même, pas la frappe du
    // navigateur -- vérifié : taper "zqsd" dans un champ donnait "" avec les
    // touches capturées encore actives). Retire la capture tant qu'un champ
    // de l'UI a le focus, la restaure une fois qu'il le perd.
    const EDITOR_CAPTURE_KEYS = 'Z,Q,S,D,UP,DOWN,LEFT,RIGHT,SHIFT';
    document.querySelectorAll('#editor-ui input, #editor-ui select, #editor-ui textarea').forEach((el) => {
      el.addEventListener('focus', () => {
        const editor = EditorScene.getEditor();
        if (editor) editor.input.keyboard.removeCapture(EDITOR_CAPTURE_KEYS);
      });
      el.addEventListener('blur', () => {
        const editor = EditorScene.getEditor();
        if (editor) editor.input.keyboard.addCapture(EDITOR_CAPTURE_KEYS);
      });
    });

    document.querySelectorAll('#editor-ui [data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => EditorScene.activateTool(btn.dataset.tool));
    });
    // Menu « Plus d'outils » (éléments de l'histoire) : options générées
    // depuis EDITOR_STORY_KINDS. blur() après choix : sinon le <select>
    // garde le focus et ZQSD ne déplace plus la caméra (cf. handleCameraPan).
    const more = document.getElementById('tool-more-select');
    if (more) {
      const groups = {
        Histoire: ['npc', 'trigger', 'pickup', 'checkpoint'],
        Obstacles: ['mossBlock', 'mossWall', 'web'],
        'Formes (singe, loup, aigle)': ['vine', 'track', 'hiddenPlatform', 'windCurrent'],
        Faune: ['animal'],
      };
      for (const [label, kinds] of Object.entries(groups)) {
        const g = document.createElement('optgroup');
        g.label = label;
        for (const k of kinds) {
          const o = document.createElement('option');
          o.value = k;
          o.textContent = EDITOR_STORY_KINDS[k].label;
          g.appendChild(o);
        }
        more.appendChild(g);
      }
      more.addEventListener('change', (e) => {
        if (e.target.value) EditorScene.activateTool(e.target.value);
        e.target.blur();
      });
    }
    const quick = document.getElementById('zone-quick-select');
    if (quick) {
      quick.addEventListener('change', (e) => {
        const name = e.target.value;
        e.target.blur();
        if (!name) return;
        if (confirm(`Charger "${name}" ? Les modifications non enregistrées du niveau en cours seront perdues.`)) {
          EditorScene.getEditor().loadZone(name);
        } else {
          e.target.value = '';
        }
      });
      EditorScene.refreshZoneQuickSelect();
    }
    // Panneau « Propriétés de la zone ».
    const bg = document.getElementById('zone-background-select');
    if (bg) {
      const items = typeof ITEM_MANIFEST !== 'undefined' ? Object.keys(ITEM_MANIFEST).filter((k) => k.startsWith('fond_')) : [];
      bg.innerHTML = '<option value="">(ciel par défaut)</option>' + items.map((k) => `<option value="${k}">${k}</option>`).join('');
      bg.addEventListener('change', (e) => { EditorScene.setZoneProp('background', e.target.value || undefined); e.target.blur(); });
    }
    const ts = document.getElementById('zone-tileset-select');
    if (ts) {
      const items = typeof TILESET_MANIFEST !== 'undefined' ? Object.keys(TILESET_MANIFEST) : [];
      ts.innerHTML = '<option value="">(tuiles par défaut)</option>' + items.map((k) => `<option value="${k}">${k}</option>`).join('');
      ts.addEventListener('change', (e) => { EditorScene.setZoneProp('tileset', e.target.value || undefined); e.target.blur(); });
    }
    const textProp = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', (e) => EditorScene.setZoneProp(key, e.target.value.trim() || undefined));
    };
    textProp('zone-name-input', 'zoneName');
    textProp('zone-script-input', 'script');
    const xara = document.getElementById('zone-xara-select');
    if (xara) {
      xara.addEventListener('change', (e) => {
        const v = e.target.value;
        EditorScene.setZoneProp('xara', v === 'false' ? false : v === 'true' ? true : undefined);
        e.target.blur();
      });
    }
    const tall = document.getElementById('zone-tall-input');
    if (tall) tall.addEventListener('change', (e) => EditorScene.setZoneProp('tallLevel', e.target.checked ? true : undefined));
    const propsBtn = document.getElementById('btn-selection-props');
    if (propsBtn) propsBtn.addEventListener('click', () => EditorScene.getEditor().editSelectedProperties());
    const jsonBtn = document.getElementById('btn-selection-json');
    if (jsonBtn) jsonBtn.addEventListener('click', () => EditorScene.getEditor().editSelectedJSON());

    document.getElementById('material-select').addEventListener('change', (e) => {
      EditorScene.getEditor().material = e.target.value;
    });
    document.getElementById('subtype-select').addEventListener('change', (e) => {
      EditorScene.getEditor().subtype = e.target.value;
    });
    document.getElementById('apply-size-btn').addEventListener('click', () => {
      const w = parseInt(document.getElementById('level-width-input').value, 10) || EDITOR_DEFAULT_LEVEL_WIDTH;
      const h = parseInt(document.getElementById('level-height-input').value, 10) || EDITOR_DEFAULT_LEVEL_HEIGHT;
      EditorScene.getEditor().applyLevelSize(w, h);
    });
    document.getElementById('btn-new').addEventListener('click', () => {
      if (confirm('Effacer le niveau en cours et repartir de zéro ?')) EditorScene.getEditor().newLevel();
    });
    document.getElementById('btn-save').addEventListener('click', () => {
      EditorScene.getEditor().exportLevel();
    });
    document.getElementById('btn-load').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => EditorScene.getEditor().importLevel(reader.result);
      reader.readAsText(file);
      e.target.value = '';
    });
    document.getElementById('btn-playtest').addEventListener('click', () => {
      EditorScene.getEditor().startPlaytest();
    });
    document.getElementById('btn-zones-overview').addEventListener('click', () => {
      EditorScene.getEditor().openZonesOverview();
    });
    document.getElementById('btn-close-zones-overview').addEventListener('click', () => {
      EditorScene.closeZonesOverview();
    });
  }

  // --- Vue d'ensemble des zones (retour utilisateur : "les enregistrements
  // sont pas simple... je veux un menu avec toutes les map vues en mini de
  // la map entière, avec leur position entre elles où je peux changer les
  // positions, rajouter des map etc un vrai menu simple UX") -- panneau
  // plein écran (HTML par-dessus le canvas, comme le reste de l'UI éditeur)
  // listant CHAQUE zone connue (les vraies, déjà chargées en <script>, cf.
  // listKnownRealZoneNames -- ET les brouillons IndexedDB, cf.
  // idbGetAllZoneNames) sous forme de carte avec une miniature dessinée
  // directement depuis ses données (pas un rendu Phaser complet, trop
  // coûteux à faire pour chaque zone juste pour un aperçu) -- déplaçable à
  // la souris, position mémorisée dans localStorage (propre à ce
  // navigateur, purement une commodité d'organisation visuelle -- ne fait
  // PAS partie des données de la zone elle-même). Des lignes relient les
  // zones dont la sortie mène vers une autre zone de la liste, pour
  // visualiser d'un coup d'œil comment elles s'enchaînent. Aucune de ces
  // actions (ouvrir la vue, charger une zone) n'ouvre quoi que ce soit sur
  // le disque -- seul "Télécharger pour le projet" (par carte) le fait,
  // via un téléchargement classique, jamais un sélecteur de dossier.

  async openZonesOverview() {
    try {
      const realNames = EditorScene.listKnownRealZoneNames();
      const draftNames = await EditorScene.idbGetAllZoneNames().catch(() => []);
      EditorScene._draftNames = new Set(draftNames);
      const names = [...new Set([...realNames, ...draftNames])].sort();
      const dataByName = {};
      for (const name of names) {
        try {
          dataByName[name] = await this.fetchZoneData(name);
        } catch (e) {
          dataByName[name] = null;
        }
      }
      EditorScene.renderZonesOverview(dataByName);
      document.getElementById('zones-overview-overlay').style.display = 'block';
    } catch (e) {
      EditorScene.setStatus(`Impossible d'ouvrir la vue d'ensemble : ${e && e.message}`);
    }
  }

  static closeZonesOverview() {
    document.getElementById('zones-overview-overlay').style.display = 'none';
  }

  static getZonesLayout() {
    try {
      return JSON.parse(localStorage.getItem('editorZonesLayout') || '{}');
    } catch (e) {
      return {};
    }
  }

  static saveZonePosition(name, x, y) {
    const layout = EditorScene.getZonesLayout();
    layout[name] = { x, y };
    try {
      localStorage.setItem('editorZonesLayout', JSON.stringify(layout));
    } catch (e) {
      // Stockage indisponible (navigation privée, quota...) -- la position
      // reste simplement pour cette session, pas bloquant.
    }
  }

  static renderZonesOverview(dataByName) {
    const canvasArea = document.getElementById('zones-overview-canvas');
    canvasArea.querySelectorAll('.zone-card').forEach((el) => el.remove());

    const layout = EditorScene.getZonesLayout();
    const names = Object.keys(dataByName).sort();
    const positions = {};
    names.forEach((name, i) => {
      positions[name] = layout[name] || { x: 40 + (i % 5) * 220, y: 40 + Math.floor(i / 5) * 220 };
    });

    const editor = EditorScene.getEditor();

    for (const name of names) {
      const data = dataByName[name];
      const card = document.createElement('div');
      card.className = 'zone-card';
      card.style.left = `${positions[name].x}px`;
      card.style.top = `${positions[name].y}px`;

      const thumb = document.createElement('canvas');
      thumb.width = 320;
      thumb.height = 160;
      if (data) EditorScene.drawZoneThumbnail(thumb, data);

      const label = document.createElement('div');
      label.className = 'zone-card-name';
      label.textContent = name;

      const loadBtn = document.createElement('button');
      loadBtn.textContent = 'Charger';
      loadBtn.addEventListener('click', () => {
        editor.loadZone(name);
        EditorScene.closeZonesOverview();
      });

      // Retour utilisateur : "je veux une interface pas ouvrir
      // l'explorateur de fichier" -- devenir une vraie scène jouable dans
      // le projet reste une étape à part, explicite, par zone (cf.
      // downloadZoneForProject) -- un simple téléchargement de navigateur,
      // jamais un sélecteur de dossier.
      const downloadBtn = document.createElement('button');
      downloadBtn.textContent = 'Télécharger pour le projet';
      downloadBtn.style.marginTop = '4px';
      downloadBtn.addEventListener('click', () => editor.downloadZoneForProject(name));

      // Retour utilisateur : "je veux pouvoir connecter déconnecter les
      // zones avec des rond où j'appuie et je sélectionne les zones à
      // laquelle la relier" -- un simple bouton rond, jamais un tag
      // <button> générique (déjà exempté du glisser de carte, cf.
      // makeZoneCardDraggable, qui ignore tout mousedown sur un BUTTON).
      const connector = document.createElement('button');
      connector.className = 'zone-card-connector';
      connector.title = 'Relier à une autre zone';
      connector.textContent = '';
      connector.addEventListener('click', () => EditorScene.handleConnectorClick(name, dataByName, positions));

      card.appendChild(thumb);
      card.appendChild(label);
      card.appendChild(loadBtn);
      card.appendChild(downloadBtn);
      // Brouillon IndexedDB d'une zone qui a aussi un vrai fichier : il
      // masque ce fichier au runtime (resolveZoneData) -- bouton pour le jeter.
      if (EditorScene._draftNames && EditorScene._draftNames.has(name) && EditorScene.readGlobalConst(`${name.toUpperCase()}_DATA`) !== undefined) {
        const forgetBtn = document.createElement('button');
        forgetBtn.textContent = 'Oublier le brouillon';
        forgetBtn.title = 'Le jeu relira le fichier src/data/ de cette zone';
        forgetBtn.style.marginTop = '4px';
        forgetBtn.addEventListener('click', async () => {
          if (!confirm(`Supprimer le brouillon de "${name}" ? Le jeu et l'éditeur reliront le fichier src/data/${name}_data.js.`)) return;
          await EditorScene.idbDeleteZone(name);
          EditorScene.setStatus(`Brouillon de "${name}" supprimé.`);
          await editor.openZonesOverview();
          EditorScene.refreshZoneQuickSelect();
        });
        card.appendChild(forgetBtn);
      }
      card.appendChild(connector);
      canvasArea.appendChild(card);
      EditorScene.makeZoneCardDraggable(card, name, positions, dataByName);
    }

    // Carte "+ Nouvelle zone" : toujours juste après la dernière dans la
    // même grille par défaut, jamais déplaçable/mémorisée (ce n'est pas une
    // zone) -- un simple raccourci pour démarrer une zone vide.
    const newIndex = names.length;
    const newCard = document.createElement('div');
    newCard.className = 'zone-card zone-card-new';
    newCard.style.left = `${40 + (newIndex % 5) * 220}px`;
    newCard.style.top = `${40 + Math.floor(newIndex / 5) * 220}px`;
    newCard.style.height = '150px';
    newCard.style.flexDirection = 'column';
    newCard.style.gap = '8px';
    const plus = document.createElement('div');
    plus.style.fontSize = '28px';
    plus.textContent = '+';
    const newBtn = document.createElement('button');
    newBtn.textContent = 'Nouvelle zone';
    newBtn.addEventListener('click', () => {
      editor.newLevel();
      EditorScene.closeZonesOverview();
      const nameInput = document.getElementById('level-name-input');
      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
    });
    newCard.appendChild(plus);
    newCard.appendChild(newBtn);
    canvasArea.appendChild(newCard);

    EditorScene.drawZoneConnections(dataByName, positions);
  }

  // Dessine un schéma miniature de la zone directement depuis ses données
  // (sol premier/second plan, spawn, sortie, totems, eau) -- pas un rendu
  // Phaser réel (bien trop coûteux à faire pour chaque zone juste pour un
  // aperçu de la vue d'ensemble).
  static drawZoneThumbnail(canvas, data) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#0d0b1a';
    ctx.fillRect(0, 0, w, h);

    const TILE = 64;
    const cells = data.groundCells || [];
    const backCells = data.groundBackCells || [];
    let minGX = 0;
    let maxGX = Math.ceil((data.levelWidth || TILE * 10) / TILE);
    let minGY = 0;
    let maxGY = Math.ceil((data.levelHeight || TILE * 6) / TILE);
    for (const [gx, gy] of cells.concat(backCells)) {
      minGX = Math.min(minGX, gx);
      maxGX = Math.max(maxGX, gx + 1);
      minGY = Math.min(minGY, gy);
      maxGY = Math.max(maxGY, gy + 1);
    }
    const spanX = Math.max(1, maxGX - minGX);
    const spanY = Math.max(1, maxGY - minGY);
    const scale = Math.min(w / spanX, h / spanY);
    const offX = (w - spanX * scale) / 2;
    const offY = (h - spanY * scale) / 2;
    const toPx = (gx, gy) => [offX + (gx - minGX) * scale, offY + (gy - minGY) * scale];
    const toPxWorld = (wx, wy) => toPx(wx / TILE, wy / TILE);

    ctx.fillStyle = '#3a2f1a';
    for (const [gx, gy] of backCells) {
      const [x, y] = toPx(gx, gy);
      ctx.fillRect(x, y, Math.max(1, scale), Math.max(1, scale));
    }
    ctx.fillStyle = '#8a6a3a';
    for (const [gx, gy] of cells) {
      const [x, y] = toPx(gx, gy);
      ctx.fillRect(x, y, Math.max(1, scale), Math.max(1, scale));
    }

    ctx.fillStyle = '#1c5f6e';
    for (const wRect of (data.water || [])) {
      const [x, y] = toPxWorld(wRect.x, wRect.y);
      const [x2, y2] = toPxWorld(wRect.x + wRect.width, wRect.y + wRect.height);
      ctx.fillRect(x, y, Math.max(1, x2 - x), Math.max(1, y2 - y));
    }
    for (const exit of EditorScene.normalizeExits(data)) {
      const [x] = toPxWorld(exit.x, 0);
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (exit.y != null) {
        // Segment court, à la bonne hauteur (pas toute la hauteur -- cf.
        // retour utilisateur sur la ligne verticale pleine hauteur) -- une
        // longueur fixe à l'écran (pas la vraie hauteur mise à l'échelle,
        // souvent imperceptible sur une si petite miniature).
        const [, y] = toPxWorld(exit.x, exit.y);
        ctx.moveTo(x, y - 7);
        ctx.lineTo(x, y + 7);
      } else {
        // Ancienne sortie sans y connu : hauteur inconnue, pleine hauteur
        // comme avant plutôt que deviner une position.
        ctx.moveTo(x, offY);
        ctx.lineTo(x, offY + spanY * scale);
      }
      ctx.stroke();
    }
    for (const t of (data.totems || [])) {
      const [x, y] = toPxWorld(t.x, t.y);
      ctx.fillStyle = '#cc88ff';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (data.playerSpawn) {
      const [x, y] = toPxWorld(data.playerSpawn.x, data.playerSpawn.y);
      ctx.fillStyle = '#66ff99';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Lignes SVG entre zones dont la sortie (`exit.targetScene`) mène vers
  // une autre zone déjà présente dans la vue -- recalculées à chaque
  // déplacement de carte (cf. makeZoneCardDraggable) pour rester collées
  // aux cartes en temps réel.
  static drawZoneConnections(dataByName, positions) {
    const svg = document.getElementById('zones-overview-lines');
    if (!svg) return;
    svg.innerHTML = '';
    const CARD_W = 180;
    const CARD_H = 150;
    const nameBySceneClass = {};
    for (const name of Object.keys(dataByName)) {
      nameBySceneClass[`${EditorScene.toPascalCase(name)}Scene`] = name;
    }
    // Une zone peut désormais avoir PLUSIEURS sorties (cf. exits) : une
    // ligne par sortie reliée, pas juste une par zone.
    for (const [name, data] of Object.entries(dataByName)) {
      if (!data) continue;
      const exits = EditorScene.normalizeExits(data);
      exits.forEach((exit, exitIndex) => {
        if (!exit.targetScene) return;
        const targetName = nameBySceneClass[exit.targetScene];
        if (!targetName || targetName === name || !positions[targetName] || !positions[name]) return;
        const from = positions[name];
        const to = positions[targetName];
        const x1 = from.x + CARD_W / 2;
        const y1 = from.y + CARD_H / 2;
        const x2 = to.x + CARD_W / 2;
        const y2 = to.y + CARD_H / 2;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#6b4fb3');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', '0.7');
        svg.appendChild(line);

        // Retour utilisateur : "actuellement je peux pas retirer une
        // liaison, fais un truc simple" -- cliquer pile sur la ligne (fine,
        // souvent en diagonale au milieu d'autres) n'était pas fiable/
        // évident. Un rond "×" bien visible au milieu de la ligne, avec une
        // zone de clic large (cf. rayon du cercle), au lieu de compter sur
        // la précision du clic sur le trait lui-même.
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hit.setAttribute('cx', midX);
        hit.setAttribute('cy', midY);
        hit.setAttribute('r', '9');
        hit.setAttribute('fill', '#3a2a5c');
        hit.setAttribute('stroke', '#ff8080');
        hit.setAttribute('stroke-width', '1.5');
        hit.dataset.fromZone = name;
        hit.dataset.exitIndex = String(exitIndex);
        hit.style.pointerEvents = 'all';
        hit.style.cursor = 'pointer';
        const cross = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        cross.setAttribute('x', midX);
        cross.setAttribute('y', midY);
        cross.setAttribute('text-anchor', 'middle');
        cross.setAttribute('dominant-baseline', 'central');
        cross.setAttribute('fill', '#ff8080');
        cross.setAttribute('font-size', '11');
        cross.setAttribute('font-family', 'sans-serif');
        cross.style.pointerEvents = 'none';
        cross.textContent = '×';
        const onDisconnectClick = () => EditorScene.disconnectZoneExit(name, exitIndex);
        hit.addEventListener('click', onDisconnectClick);
        hit.addEventListener('mouseenter', () => hit.setAttribute('fill', '#ff6666'));
        hit.addEventListener('mouseleave', () => hit.setAttribute('fill', '#3a2a5c'));
        svg.appendChild(hit);
        svg.appendChild(cross);
      });
    }
  }

  // "exit" (legacy, un seul objet) ou "exits" (tableau) -> toujours un
  // tableau -- même normalisation que côté jeu (cf. buildLevelFromData
  // dans LevelKit.js) pour lire n'importe quelle zone, ancienne ou neuve.
  static normalizeExits(data) {
    if (!data) return [];
    return data.exits || (data.exit ? [data.exit] : []);
  }

  // Position par défaut d'une sortie créée sans clic dans le monde (cf.
  // confirmConnect, "+ Nouvelle sortie") : proche du bord droit du niveau,
  // mais décalée d'une sortie déjà existante à l'autre pour ne jamais
  // tomber pile au même x.
  static nextExitX(data, existingExits) {
    return (data.levelWidth || 960) - 30 - existingExits.length * 40;
  }

  // Retour utilisateur : "je veux pouvoir connecter déconnecter les zones
  // avec des rond où j'appuie et je sélectionne les zones à laquelle la
  // relier" -- premier clic sur un rond = "source" armée (surlignée en
  // rouge, cf. classe .armed) ; second clic sur le rond d'une AUTRE carte =
  // ouvre le choix des sorties à relier (cf. openConnectPicker) ; re-clic
  // sur le même rond = annule. État volontairement statique (pas sur
  // l'instance) : un seul lien "en cours d'armement" à la fois, quelle que
  // soit la carte, cohérent avec le fait qu'un seul clic peut être armé
  // visuellement en même temps.
  static handleConnectorClick(name, dataByName, positions) {
    if (!EditorScene._linkSourceName) {
      EditorScene._linkSourceName = name;
      EditorScene.setConnectorArmed(name, true);
      EditorScene.setStatus(`Clique sur le rond d'une autre zone pour la relier à "${name}" (re-clique ici pour annuler).`);
      return;
    }
    if (EditorScene._linkSourceName === name) {
      EditorScene.setConnectorArmed(name, false);
      EditorScene._linkSourceName = null;
      EditorScene.setStatus('Connexion annulée.');
      return;
    }
    const sourceName = EditorScene._linkSourceName;
    EditorScene.setConnectorArmed(sourceName, false);
    EditorScene._linkSourceName = null;
    EditorScene.openConnectPicker(sourceName, name, dataByName, positions);
  }

  static setConnectorArmed(name, armed) {
    document.querySelectorAll('.zone-card').forEach((card) => {
      const label = card.querySelector('.zone-card-name');
      if (!label || label.textContent !== name) return;
      const dot = card.querySelector('.zone-card-connector');
      if (dot) dot.classList.toggle('armed', armed);
    });
  }

  // Petite fenêtre de choix : quel portail de la source, quel portail de la
  // cible -- retour utilisateur : "les connexion entré sortie sont trop
  // complexe, je clique pour connecter ça me propose la sortie du premier
  // et une entré du 2eme, enfaite mieux fusionne entré et sortie en 1 seul
  // truc, qui permet la connexion des zones (avec equivalence altitude pour
  // les 2...)". Remplace l'ancienne fenêtre à 4 listes (sortie source,
  // arrivée cible, retour cible->source, arrivée source) par SEULEMENT 2 :
  // un portail par zone. Confirmer relie TOUJOURS les deux sens d'un coup
  // (un portail est par nature un aller-retour) -- chacun arrivant pile à
  // la même hauteur EN POURCENTAGE que celle franchie côté départ (déjà
  // géré par `enterRatio`, cf. buildLevelFromData/updateLevelFromData dans
  // LevelKit.js, inchangé ici).
  static openConnectPicker(sourceName, targetName, dataByName, positions) {
    const existingModal = document.getElementById('zone-connect-modal');
    if (existingModal) existingModal.remove();

    const sourceExits = EditorScene.normalizeExits(dataByName[sourceName]);
    const targetExits = EditorScene.normalizeExits(dataByName[targetName]);

    const modal = document.createElement('div');
    modal.id = 'zone-connect-modal';
    modal.className = 'zone-connect-modal';

    const title = document.createElement('h4');
    title.textContent = `Relier "${sourceName}" et "${targetName}"`;
    modal.appendChild(title);

    // Chaque option = un portail déjà posé dans cette zone (paire sortie+
    // entrée, cf. finishPortalDrag) OU une ancienne sortie seule (pas de
    // portalId -- reste utilisable, juste sans point d'arrivée précis dans
    // l'autre sens) -- "+ Nouveau portail" en crée un depuis cet écran.
    const buildPortalOptions = (select, exits) => {
      exits.forEach((ex, i) => {
        const opt = document.createElement('option');
        opt.value = String(i);
        const target = ex.targetScene ? `-> ${ex.targetScene}` : 'non relié';
        opt.textContent = `Portail ${i + 1} (${target})${ex.portalId ? '' : ' [ancienne sortie]'}`;
        select.appendChild(opt);
      });
      const newOpt = document.createElement('option');
      newOpt.value = 'new';
      newOpt.textContent = '+ Nouveau portail';
      select.appendChild(newOpt);
    };

    const sourceField = document.createElement('div');
    sourceField.className = 'zone-connect-field';
    const sourceLabel = document.createElement('label');
    sourceLabel.textContent = `Portail de "${sourceName}"`;
    const sourceSelect = document.createElement('select');
    buildPortalOptions(sourceSelect, sourceExits);
    if (sourceExits.length === 0) sourceSelect.value = 'new';
    sourceField.appendChild(sourceLabel);
    sourceField.appendChild(sourceSelect);
    modal.appendChild(sourceField);

    const targetField = document.createElement('div');
    targetField.className = 'zone-connect-field';
    const targetLabel = document.createElement('label');
    targetLabel.textContent = `Portail de "${targetName}"`;
    const targetSelect = document.createElement('select');
    buildPortalOptions(targetSelect, targetExits);
    if (targetExits.length === 0) targetSelect.value = 'new';
    targetField.appendChild(targetLabel);
    targetField.appendChild(targetSelect);
    modal.appendChild(targetField);

    const row = document.createElement('div');
    row.className = 'row';
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirmer (aller-retour)';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Annuler';
    cancelBtn.addEventListener('click', () => modal.remove());
    row.appendChild(confirmBtn);
    row.appendChild(cancelBtn);
    modal.appendChild(row);

    confirmBtn.addEventListener('click', async () => {
      modal.remove();
      await EditorScene.confirmConnect(sourceName, targetName, dataByName, sourceSelect.value, targetSelect.value);
    });

    document.body.appendChild(modal);
  }

  // Résout un choix de portail ('new' ou un index de sortie existante) en
  // l'objet sortie à faire pointer -- crée la paire sortie+entrée manquante
  // pour '+ Nouveau portail', même recette que finishPortalDrag mais sans
  // position choisie dans le monde (créé depuis l'écran Zones, pas cliqué
  // dans le niveau).
  //
  // Bug réel corrigé ici (retour utilisateur : "la logique des entré sortie
  // [...] ne marche pas") : la 1re version posait `entry.y = 400` EN DUR,
  // sans jamais tenir compte du sol RÉEL de la zone -- pour toute zone dont
  // le sol n'est pas déjà pile vers y=400 (cf. `groundCells`), le portail
  // atterrissait en pleine terre ou en plein ciel, impossible à toucher en
  // marchant dessus. PIRE : `exit` lui-même n'avait AUCUN `y` du tout (`y`
  // n'était posé que sur `entry`, jamais copié sur la sortie qui porte
  // pourtant la hitbox de déclenchement, cf. getExitTriggerRect dans
  // LevelKit.js) -- `exit.y - height/2` valait `undefined - 48` = NaN, un
  // rectangle de déclenchement totalement invalide qui ne pouvait JAMAIS
  // toucher quoi que ce soit, quelle que soit la position du joueur. Les
  // DEUX bugs se cumulaient : même en tombant sur le bon y par chance, la
  // sortie elle-même restait inerte. Fixé en calant `y` sur le sol réel
  // sous ce x (même recette que placeAt pour totem/prop/feu de camp, cf.
  // groundSurfaceYAtGridStatic) quand il y en a un, et en appliquant LA
  // MÊME valeur aux deux moitiés du portail.
  static resolvePortalChoice(data, exits, choice) {
    if (choice !== 'new') return exits[parseInt(choice, 10)];
    const portalId = EditorScene.generateEntryId();
    const x = EditorScene.nextExitX(data, exits);
    const height = EDITOR_EXIT_DEFAULT_HEIGHT;
    // Pas de sol connu sous ce x (zone encore vide, ou colonne sans case
    // exposée) : retombe sur une hauteur raisonnable au lieu de planter --
    // reste ajustable à la main ensuite (glisser le portail dans l'éditeur
    // de niveau le replace où on veut, comme n'importe quel portail).
    const groundY = EditorScene.groundSurfaceYAtGridStatic(data.groundCells || [], x, 400);
    const y = groundY != null ? groundY - height / 2 : 400;
    const exit = { x, y, height, targetScene: null, data: {}, portalId };
    const entry = { id: portalId, x, y, height, portalId };
    exits.push(exit);
    data.entries = data.entries || [];
    data.entries.push(entry);
    return exit;
  }

  static async confirmConnect(sourceName, targetName, dataByName, sourceChoice, targetChoice) {
    try {
      const sourceData = dataByName[sourceName];
      const targetData = dataByName[targetName];
      const sourceSceneClass = `${EditorScene.toPascalCase(sourceName)}Scene`;
      const targetSceneClass = `${EditorScene.toPascalCase(targetName)}Scene`;

      const sourceExits = EditorScene.normalizeExits(sourceData);
      const targetExits = EditorScene.normalizeExits(targetData);
      const sourceExit = EditorScene.resolvePortalChoice(sourceData, sourceExits, sourceChoice);
      const targetExit = EditorScene.resolvePortalChoice(targetData, targetExits, targetChoice);

      // Équivalence d'altitude dans les 2 sens (cf. `enterRatio` dans
      // LevelKit.js, déjà géré au runtime) : il suffit que chaque sortie
      // vise l'`id` de l'entrée jumelle de l'AUTRE portail, quand elle en a
      // une (une ancienne sortie sans portalId n'a pas d'entrée précise --
      // retombe sur le spawn par défaut, comportement d'avant inchangé).
      const targetEntry = targetExit.portalId ? (targetData.entries || []).find((e) => e.id === targetExit.portalId) : null;
      const sourceEntry = sourceExit.portalId ? (sourceData.entries || []).find((e) => e.id === sourceExit.portalId) : null;

      sourceExit.targetScene = targetSceneClass;
      sourceExit.data = targetEntry ? { enterId: targetEntry.id } : {};
      sourceData.exits = sourceExits;
      delete sourceData.exit;

      targetExit.targetScene = sourceSceneClass;
      targetExit.data = sourceEntry ? { enterId: sourceEntry.id } : {};
      targetData.exits = targetExits;
      delete targetData.exit;

      // Cf. syncZoneToProjectServer : sans ça, la connexion restait bloquée
      // dans IndexedDB pour de bon, jamais vue par le jeu "de base" même
      // avec tools/dev_server.py lancé. Vérifie les deux avant d'écrire.
      for (const n of [sourceName, targetName]) {
        const unsafe = EditorScene.unsafePathsForZone(n);
        if (unsafe.length) throw new Error(`"${n}" contient des valeurs non-JSON (${unsafe.join(', ')})`);
      }
      await EditorScene.saveZoneSafely(sourceName, sourceData);
      await EditorScene.saveZoneSafely(targetName, targetData);

      EditorScene.setStatus(`Portail relié : "${sourceName}" <-> "${targetName}" (aller-retour).`);
      await EditorScene.getEditor().openZonesOverview();
    } catch (e) {
      EditorScene.setStatus(`Échec de la connexion : ${e && e.message}`);
    }
  }

  // Clic sur une ligne de connexion existante (cf. drawZoneConnections) --
  // "déconnecter" : vide la cible de CETTE sortie précise (elle reste
  // posée à sa position, juste plus reliée à rien) plutôt que de la
  // supprimer -- une sortie non reliée reste un élément valide qu'on peut
  // relier ailleurs ensuite, cf. openConnectPicker qui la propose déjà
  // comme "non reliée".
  static async disconnectZoneExit(name, exitIndex) {
    try {
      const data = await EditorScene.getEditor().fetchZoneData(name);
      const exits = EditorScene.normalizeExits(data);
      if (!exits[exitIndex]) return;
      exits[exitIndex] = { ...exits[exitIndex], targetScene: null };
      data.exits = exits;
      delete data.exit;
      await EditorScene.saveZoneSafely(name, data);
      EditorScene.setStatus(`Sortie déconnectée : "${name}".`);
      await EditorScene.getEditor().openZonesOverview();
    } catch (e) {
      EditorScene.setStatus(`Échec de la déconnexion : ${e && e.message}`);
    }
  }

  // Glisser une carte à la souris (retour utilisateur : "où je peux
  // changer les positions") -- position mise à jour en direct pendant le
  // glisser (les lignes suivent), mémorisée dans localStorage au lâcher.
  // Ignore un mousedown venant du bouton "Charger" (le clic doit rester un
  // clic, pas déclencher un glisser).
  static makeZoneCardDraggable(cardEl, name, positions, dataByName) {
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    const onMouseMove = (e) => {
      const x = origLeft + (e.clientX - startX);
      const y = origTop + (e.clientY - startY);
      cardEl.style.left = `${x}px`;
      cardEl.style.top = `${y}px`;
      positions[name] = { x, y };
      EditorScene.drawZoneConnections(dataByName, positions);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      cardEl.classList.remove('dragging');
      EditorScene.saveZonePosition(name, positions[name].x, positions[name].y);
    };
    cardEl.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      startX = e.clientX;
      startY = e.clientY;
      origLeft = parseFloat(cardEl.style.left) || 0;
      origTop = parseFloat(cardEl.style.top) || 0;
      cardEl.classList.add('dragging');
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    });
  }
}

// Scène de playtest lancée par-dessus l'éditeur endormi (voir startPlaytest) :
// une vraie partie jouable sur les données en cours d'édition, sans jamais
// exporter/réimporter. Échap referme le playtest et réveille l'éditeur —
// tout ce que buildLevelFromData a créé (joueur, ennemis, décor, sol...)
// disparaît avec elle (scene.stop() détruit tout automatiquement), pas de
// nettoyage manuel à faire ici.
class PlaytestScene extends Phaser.Scene {
  constructor() {
    super('PlaytestScene');
  }

  init(levelData) {
    this.levelData = levelData;
  }

  create() {
    buildLevelFromData(this, this.levelData);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.add.text(16, 40, 'Échap : retour à l\'éditeur', {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#a99bd6',
    }).setScrollFactor(0);
  }

  update(time, delta) {
    updateLevelFromData(this, time, delta);
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      document.getElementById('editor-ui').style.display = 'block';
      this.scene.stop();
      this.scene.wake('EditorScene');
    }
  }
}
