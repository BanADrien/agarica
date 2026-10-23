// MenuKit — briques communes des menus (écran-titre, pause, options,
// contrôles, crédits) : textes faciles à modifier, réglages et progression
// mémorisés dans localStorage, liste navigable clavier + souris, boîte de
// confirmation, chapitres, et le crochet de jeu qui ouvre la pause (Échap / P).
// Chargé après StoryKit.js (utilise STORY_UI, DEMO_ZONES, LEVEL_UPDATE_HOOKS…).

// ---------------------------------------------------------------------------
// Textes (à personnaliser librement)
// ---------------------------------------------------------------------------
const CREDITS_TITLE = 'Legend of Agarica';
const CREDITS_DEDICATION = "Un petit jeu fait main, pour l'anniversaire d'Agarica.";
const CREDITS_SECTIONS = [
  { title: 'Création', lines: ['Adrien'] },
  {
    title: 'Les personnages',
    lines: [
      'Agarica, Xara, Amanite, Geralt, Clak, Morgat, Kainati, Ghil\'t…',
      'sont nés autour d\'une table, pendant notre campagne de Donjons & Dragons.',
    ],
  },
  { title: 'Merci', lines: ['à toi, d\'avoir donné vie à ta druidesse du Cercle de la Lune.'] },
];
const CREDITS_CLOSING = 'Joyeux anniversaire ✦';
const TITLE_SUBTITLE = 'La mousse et la lune — démo';
const TITLE_FOOTER = 'Pour Agarica, avec tendresse ✦';

// Écran « Contrôles » (vérifié dans Player.js / StoryKit.js / LevelKit.js).
const CONTROLS_GROUPS = [
  {
    title: 'Se déplacer',
    rows: [
      { keys: ['←', '→'], alt: ['Q', 'D'], text: 'Marcher' },
      { keys: ['Z', '↑', 'Espace'], text: 'Sauter (double saut : seulement en Singe ou en Aigle)' },
      { keys: ['Shift'], text: 'Courir — forme du Loup (ou double appui ← / →)' },
      { keys: ['S', '↓'], text: 'Piqué de l\'Aigle · lâcher une liane' },
    ],
  },
  {
    title: 'Agir',
    rows: [
      { keys: ['K'], alt: ['Clic'], text: 'Attaquer (dague)' },
      { keys: ['E'], text: 'Parler, examiner, interagir' },
      { keys: ['A', 'F', 'R'], text: 'Compétences (coûtent de l\'énergie)' },
    ],
  },
  {
    title: 'Menus',
    rows: [
      { keys: ['I'], text: 'Sac (inventaire)' },
      { keys: ['M'], text: 'Carte de Geralt (une fois trouvée)' },
      { keys: ['Échap'], alt: ['P'], text: 'Pause' },
    ],
  },
];
const CONTROLS_FORMS_NOTE = 'Les formes viennent toutes seules : courir = Loup, double saut = Singe ou Aigle '
  + '(sans forme aérienne, un seul saut), eau = Pieuvre. Au feu de camp : soin, sauvegarde, formes et compétences.';
// Rappel discret affiché en jeu si l'option est activée.
const CONTROLS_HINT_LINE = '←→/QD bouger · Z/↑/Espace sauter · Shift courir · K attaquer · E agir · A F R compétences · I sac · Échap pause';

// ---------------------------------------------------------------------------
// Chapitres : point de départ de chaque grande région, avec l'état cohérent
// (flags, objets, compétences, formes) de quelqu'un qui y arrive en jouant.
// `gives` = ce que le chapitre ajoute pour les SUIVANTS (cumulatif).
// ---------------------------------------------------------------------------
const MENU_CHAPTERS = [
  {
    id: 'bosquet', act: 'Acte I', name: "Le bosquet d'Émeraude",
    desc: 'La mousse toxique ronge la forêt, et le bosquet lutte comme il peut…',
    scene: 'PrologueScene', zones: ['bosquet'], color: 0x2f5d3a, bg: 'fond_bosquet',
    gives: {
      flags: { visited_bosquet: true, aideFaite: true, talismanOurs: true, amaniteCouverte: true, idoleVolee: true, banished: true },
      items: ['talisman_ours'],
    },
  },
  {
    id: 'foret_sombre', act: 'Acte I', name: 'La forêt sombre',
    desc: 'Bannie, Agarica s\'enfonce seule dans les bois… mais quelqu\'un l\'observe.',
    scene: 'ForetSombre1Scene', enterId: 'from_bosquet', zones: ['foret_sombre_1', 'foret_sombre_2'], color: 0x1d2a4a, bg: 'fond_foret_sombre',
    gives: {
      flags: {
        visited_foret_sombre_1: true, visited_foret_sombre_2: true, xaraMet: true, hasWolfForm: true, planteVue: true,
        trig_foret_sombre_1_talisman: true, moss_foret_sombre_1_amas_racines: true,
      },
      skills: ['ours'],
    },
  },
  {
    id: 'grand_arbre', act: 'Acte I', name: 'Le grand arbre',
    desc: 'Des racines immenses, des pierres qui tombent… et une gardienne au sommet.',
    scene: 'GrandArbreRacinesScene', enterId: 'from_foret_sombre', zones: ['grand_arbre_racines', 'grand_arbre_arene', 'monde_spirituel', 'epreuve_singe'], color: 0x4a3420, bg: 'fond_grand_arbre',
    gives: {
      flags: {
        visited_grand_arbre_racines: true, visited_grand_arbre_arene: true, visited_monde_spirituel: true,
        kainatiIntroSeen: true, kainatiDefeated: true, hasMonkeyForm: true, mondeSpirituelFini: true, airForm: 'monkey',
      },
    },
  },
  {
    id: 'foret_flottante', act: 'Acte II', name: 'La forêt flottante',
    desc: 'Des îles suspendues, un cartographe douteux et son crabe… et une fleur rare.',
    scene: 'ForetFlottante1Scene', enterId: 'from_arbre', zones: ['foret_flottante_1', 'foret_flottante_2', 'clairiere_plante', 'hutte_morgat'], color: 0x2a4470, bg: 'fond_foret_flottante',
    gives: {
      flags: {
        visited_foret_flottante_1: true, visited_foret_flottante_2: true, visited_clairiere_plante: true, visited_hutte_morgat: true,
        geraltMet: true, amaniteMet: true, hasEagleForm: true, airForm: 'eagle', fleurPrelevee: true, clairiereArrivee: true,
        morgatVue: true, crashDone: true,
      },
      items: ['carte_geralt', 'totem_poche_casse', 'repulsif'],
    },
  },
  {
    id: 'foret_corrompue', act: 'Acte II', name: 'La forêt corrompue',
    desc: 'Après la chute, la mousse est vivante. Au fond des bois, Ghil\'t attend.',
    scene: 'ForetCorrompue1Scene', enterId: 'from_crash', zones: ['foret_corrompue_1', 'arene_ghilt', 'trou_sombre', 'bosquet_retour'], color: 0x3a1838, bg: 'fond_foret_corrompue',
    gives: {},
  },
];

function menuChapterIndexOfZone(zoneId) {
  return MENU_CHAPTERS.findIndex((c) => c.zones.includes(zoneId));
}

// État du registre pour démarrer au chapitre `index` (cumul des précédents).
function menuChapterState(index) {
  const flags = {};
  const items = [];
  const skills = [];
  for (let i = 0; i < index; i++) {
    const g = MENU_CHAPTERS[i].gives || {};
    Object.assign(flags, g.flags || {});
    for (const it of g.items || []) if (!items.includes(it)) items.push(it);
    for (const s of g.skills || []) if (!skills.includes(s)) skills.push(s);
  }
  if (items.length) flags.inventory = items;
  if (skills.length) {
    flags.unlockedSkills = skills;
    flags.skillSlots = [skills[0] || null, skills[1] || null, skills[2] || null];
  }
  // Emplacements de formes [sol, aérien, eau] (cf. Player.applyAirForm).
  if (flags.hasWolfForm || flags.airForm) {
    flags.equippedForms = [flags.hasWolfForm ? 'wolf' : null, flags.airForm || null, null];
  }
  return flags;
}

// Nouvelle partie au chapitre `index` : efface la sauvegarde, pose l'état, lance la zone.
function menuStartChapter(scene, index) {
  const ch = MENU_CHAPTERS[index];
  menuNoteSaveProgress();
  resetGame(scene.game);
  const state = menuChapterState(index);
  if (Object.keys(state).length) storySet(state);
  goToScene(scene, ch.scene, ch.enterId ? { enterId: ch.enterId } : undefined);
}

// ---------------------------------------------------------------------------
// Réglages et progression (localStorage, séparés de la sauvegarde de partie)
// ---------------------------------------------------------------------------
const MENU_OPTIONS_KEY = 'agarica-options-v1';
const MENU_PROGRESS_KEY = 'agarica-progress-v1';
const MENU_OPTIONS_DEFAULTS = { controlsHint: false, musicVolume: 80, sfxVolume: 80 };

function menuReadJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) || {} : {};
  } catch (e) {
    return {};
  }
}

function menuWriteJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* stockage indisponible */ }
}

function menuOptions() {
  return { ...MENU_OPTIONS_DEFAULTS, ...menuReadJson(MENU_OPTIONS_KEY) };
}

function menuSetOption(key, value) {
  const o = menuOptions();
  o[key] = value;
  menuWriteJson(MENU_OPTIONS_KEY, o);
}

// Progression « méta » : chapitres atteints et fin de démo vue. Gardée même
// quand on efface la sauvegarde ou recommence : c'est ce qui débloque les chapitres.
function menuProgress() {
  const p = menuReadJson(MENU_PROGRESS_KEY);
  return { chapters: Array.isArray(p.chapters) ? p.chapters : [], demoFinished: !!p.demoFinished, devUnlock: !!p.devUnlock };
}

function menuUpdateProgress(fn) {
  const p = menuProgress();
  fn(p);
  menuWriteJson(MENU_PROGRESS_KEY, p);
  return p;
}

function menuNoteChapter(chapterId) {
  if (!chapterId || menuProgress().chapters.includes(chapterId)) return;
  menuUpdateProgress((p) => p.chapters.push(chapterId));
}

// Recopie dans la progression ce que la sauvegarde courante a atteint.
function menuNoteSaveProgress() {
  const save = typeof readSaveData === 'function' ? readSaveData() : null;
  if (!save) return;
  const v = save.values;
  const reached = MENU_CHAPTERS.filter((c) => c.zones.some((z) => v[`visited_${z}`] || v.lastZone === z)).map((c) => c.id);
  if (!reached.length && !v.demoFinished) return;
  menuUpdateProgress((p) => {
    for (const id of reached) if (!p.chapters.includes(id)) p.chapters.push(id);
    if (v.demoFinished) p.demoFinished = true;
  });
}

function menuChapterUnlocked(index) {
  if (index === 0) return true;
  const p = menuProgress();
  return p.demoFinished || p.devUnlock || p.chapters.includes(MENU_CHAPTERS[index].id);
}

// Résumé de la sauvegarde pour « Continuer » (null sans sauvegarde).
function menuSaveSummary() {
  if (!hasSaveGame()) return null;
  const save = readSaveData();
  const v = save.values;
  const entry = storyZoneEntry(v.lastZone) || DEMO_ZONES[0];
  const chapter = MENU_CHAPTERS[Math.max(0, menuChapterIndexOfZone(entry.zone))];
  const base = typeof HEART_MAX === 'number' ? HEART_MAX : 3;
  const maxHearts = base + (v.coeurBonusForet ? 1 : 0);
  const hearts = typeof v.hearts === 'number' && v.hearts > 0 ? Math.min(v.hearts, maxHearts) : maxHearts;
  const forms = [
    ['hasWolfForm', 'wolf', 'Loup'], ['hasMonkeyForm', 'monkey', 'Singe'],
    ['hasEagleForm', 'eagle', 'Aigle'], ['hasOctopusForm', 'octopus', 'Pieuvre'],
  ].filter(([flag]) => v[flag]).map(([, type, name]) => ({ type, name }));
  return {
    zoneName: entry.name, chapter, hearts, maxHearts, forms,
    skills: Array.isArray(v.unlockedSkills) ? v.unlockedSkills : [],
    items: Array.isArray(v.inventory) ? v.inventory.length : 0,
    savedAt: save.savedAt || null,
  };
}

function menuFormatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} à ${hh}h${mm}`;
}

// ---------------------------------------------------------------------------
// Dessin
// ---------------------------------------------------------------------------
const MENU_KEY_ALIASES = {
  up: ['arrowup', 'z'], down: ['arrowdown', 's'], left: ['arrowleft', 'q'], right: ['arrowright', 'd'],
  ok: ['enter', ' ', 'e'], back: ['escape', 'backspace'],
};

function menuKeyAction(event) {
  const k = (event.key || '').toLowerCase();
  for (const [action, keys] of Object.entries(MENU_KEY_ALIASES)) if (keys.includes(k)) return action;
  return null;
}

function menuAddFireflies(scene, count = 18, { depth = 0, area = null } = {}) {
  const { width, height } = scene.scale;
  const a = area || { x: 0, y: 50, w: width, h: height - 90 };
  for (let i = 0; i < count; i++) {
    const c = scene.add.circle(a.x + Math.random() * a.w, a.y + Math.random() * a.h,
      Phaser.Math.FloatBetween(1.5, 3), i % 3 === 0 ? STORY_UI.pink : STORY_UI.vineLight, 0.8).setDepth(depth);
    scene.tweens.add({
      targets: c, x: c.x + Phaser.Math.Between(-60, 60), y: c.y + Phaser.Math.Between(-40, 40),
      alpha: 0.12, duration: Phaser.Math.Between(2200, 4200), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 1500),
    });
  }
}

// Titre de panneau : texte serif rose + petite liane fleurie dessous.
function menuPanelTitle(scene, x, y, text, { size = 26, depth = 0 } = {}) {
  const t = scene.add.text(x, y, text, {
    fontFamily: STORY_UI.serif, fontSize: `${size}px`, fontStyle: 'bold', color: '#ffe9f5',
    stroke: '#15101f', strokeThickness: 5, padding: { x: 12, y: 8 },
  }).setOrigin(0.5).setDepth(depth);
  t.setShadow(0, 0, '#ff9fc9', 10, true, true);
  const half = Math.min(200, t.width / 2 + 30);
  const g = scene.add.graphics().setDepth(depth);
  const ly = y + size * 0.75;
  g.lineStyle(1.5, STORY_UI.vineLight, 0.7);
  g.lineBetween(x - half, ly, x - 9, ly);
  g.lineBetween(x + 9, ly, x + half, ly);
  g.fillStyle(STORY_UI.pink, 1);
  g.fillTriangle(x, ly - 5, x + 5, ly, x, ly + 5);
  g.fillTriangle(x, ly - 5, x - 5, ly, x, ly + 5);
  return [t, g];
}

// Touche de clavier dessinée ; renvoie sa largeur.
function menuDrawKeycap(scene, x, y, label, { depth = 0, container = null, dim = false } = {}) {
  const t = scene.add.text(0, 0, label, {
    fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: dim ? '#a99bd6' : '#ffe9f5',
  }).setOrigin(0.5);
  const w = Math.max(26, t.width + 14);
  const g = scene.add.graphics();
  g.fillStyle(0x0b0814, 0.9);
  g.fillRoundedRect(x, y - 11, w, 26, 6);
  g.fillStyle(dim ? 0x241a3a : STORY_UI.nightSoft, 1);
  g.fillRoundedRect(x, y - 13, w, 24, 6);
  g.lineStyle(1.2, dim ? 0x4a3d6b : STORY_UI.vineLight, dim ? 0.6 : 0.55);
  g.strokeRoundedRect(x, y - 13, w, 24, 6);
  t.setPosition(x + w / 2, y - 1);
  for (const o of [g, t]) {
    o.setDepth(depth);
    if (container) container.add(o);
  }
  return w;
}

// Cœur dessiné (résumé de sauvegarde).
function menuDrawHeart(g, x, y, r, full) {
  g.fillStyle(full ? 0xff6f9f : 0x3a2c55, 1);
  g.fillCircle(x - r * 0.5, y - r * 0.2, r * 0.58);
  g.fillCircle(x + r * 0.5, y - r * 0.2, r * 0.58);
  g.fillTriangle(x - r * 1.05, y + r * 0.05, x + r * 1.05, y + r * 0.05, x, y + r * 1.1);
  if (full) {
    g.fillStyle(0xffd1e1, 0.9);
    g.fillCircle(x - r * 0.55, y - r * 0.35, r * 0.18);
  }
}

// Petit cadenas dessiné (chapitre verrouillé).
function menuDrawLock(g, x, y) {
  g.lineStyle(3, 0xc9b8f0, 0.9);
  g.beginPath();
  g.arc(x, y - 6, 7, Math.PI, 0, false);
  g.strokePath();
  g.fillStyle(0xc9b8f0, 0.95);
  g.fillRoundedRect(x - 10, y - 6, 20, 15, 3);
  g.fillStyle(0x15101f, 1);
  g.fillCircle(x, y + 0, 2.5);
  g.fillRect(x - 1, y + 1, 2, 5);
}

// ---------------------------------------------------------------------------
// Liste de menu navigable (clavier + souris)
// items : { label, action?, disabled?, value?: () => string, onLeft?, onRight?, dim?, note? }
// ---------------------------------------------------------------------------
class MenuList {
  constructor(scene, { x, y, width = 300, spacing = 42, size = 22, items, depth = 10, onSelect = null, align = 'center' }) {
    this.scene = scene;
    this.items = items;
    this.onSelect = onSelect;
    this.width = width;
    this.align = align;
    this.container = scene.add.container(0, 0).setDepth(depth);
    this.highlight = scene.add.graphics();
    this.container.add(this.highlight);
    this.index = -1;
    items.forEach((it, i) => {
      const iy = y + i * spacing;
      it.y = iy;
      it.x = x;
      const color = it.disabled ? '#6f6391' : (it.dim ? STORY_UI.textSoft : STORY_UI.text);
      const hasValue = typeof it.value === 'function';
      const tx = align === 'left' || hasValue ? x - width / 2 + 34 : x;
      it.text = scene.add.text(tx, iy, it.label, {
        fontFamily: STORY_UI.serif, fontSize: `${it.dim ? Math.round(size * 0.78) : size}px`, color,
        stroke: '#15101f', strokeThickness: 4, padding: { x: 6, y: 4 },
      }).setOrigin(align === 'left' || hasValue ? 0 : 0.5, 0.5);
      this.container.add(it.text);
      if (hasValue) {
        it.valueText = scene.add.text(x + width / 2 - 22, iy, '', {
          fontFamily: 'sans-serif', fontSize: '15px', color: it.disabled ? '#6f6391' : '#c9b8f0',
          padding: { x: 4, y: 3 },
        }).setOrigin(1, 0.5);
        this.container.add(it.valueText);
      }
      it.zone = scene.add.zone(x, iy, width, spacing - 4).setInteractive({ useHandCursor: !it.disabled });
      this.container.add(it.zone);
      it.zone.on('pointerover', () => { if (!it.disabled && this.enabled) this.select(i); });
      it.zone.on('pointerdown', (pointer) => {
        if (it.disabled || !this.enabled) return;
        this.select(i);
        // Clic sur la moitié gauche/droite d'un réglage : diminue/augmente.
        if (hasValue && (it.onLeft || it.onRight) && !it.action) {
          if (pointer.x < x && it.onLeft) it.onLeft();
          else if (it.onRight) it.onRight();
          this.refresh();
          return;
        }
        this.activate();
      });
    });
    this.enabled = true;
    this.refresh();
    const first = items.findIndex((it) => !it.disabled);
    this.select(first === -1 ? 0 : first, { silent: true });
  }

  refresh() {
    for (const it of this.items) if (it.valueText) it.valueText.setText(it.value());
  }

  select(i, { silent = false } = {}) {
    if (!this.items[i] || this.items[i].disabled) return;
    const changed = i !== this.index;
    this.index = i;
    const it = this.items[i];
    this.items.forEach((o, k) => {
      if (o.disabled) return;
      const on = k === i;
      o.text.setColor(on ? '#ffc4dd' : (o.dim ? STORY_UI.textSoft : STORY_UI.text));
      o.text.setShadow(0, 0, '#ff9fc9', on ? 10 : 0, false, true);
    });
    const g = this.highlight;
    g.clear();
    const hx = it.x - this.width / 2;
    g.fillStyle(STORY_UI.pink, 0.1);
    g.fillRoundedRect(hx + 6, it.y - 17, this.width - 12, 34, 10);
    g.lineStyle(1.5, STORY_UI.pink, 0.45);
    g.strokeRoundedRect(hx + 6, it.y - 17, this.width - 12, 34, 10);
    // Feuille + fleur à gauche de l'entrée choisie.
    g.fillStyle(STORY_UI.vineLight, 1);
    g.fillEllipse(hx + 20, it.y, 12, 6);
    g.fillStyle(STORY_UI.pink, 1);
    g.fillCircle(hx + 27, it.y, 3.5);
    if (changed && !silent) {
      g.setAlpha(0.3);
      this.scene.tweens.add({ targets: g, alpha: 1, duration: 160 });
      this.scene.tweens.add({ targets: it.text, scale: { from: 0.96, to: 1 }, duration: 160, ease: 'Back.easeOut' });
    }
    if (this.onSelect && changed) this.onSelect(it, i);
  }

  move(dir) {
    const n = this.items.length;
    let i = this.index;
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n;
      if (!this.items[i].disabled) break;
    }
    this.select(i);
  }

  activate() {
    const it = this.items[this.index];
    if (!it || it.disabled) return;
    if (it.action) it.action(it);
    else if (it.onRight) it.onRight();
    this.refresh();
  }

  // Renvoie vrai si la touche a été utilisée.
  handleAction(action) {
    if (!this.enabled) return false;
    const it = this.items[this.index];
    if (action === 'up') this.move(-1);
    else if (action === 'down') this.move(1);
    else if (action === 'left' && it && it.onLeft) { it.onLeft(); this.refresh(); }
    else if (action === 'right' && it && it.onRight) { it.onRight(); this.refresh(); }
    else if (action === 'ok') this.activate();
    else return false;
    return true;
  }

  setEnabled(on) {
    this.enabled = on;
  }

  destroy() {
    this.container.destroy(true);
  }
}

// ---------------------------------------------------------------------------
// Boîte de confirmation modale (Oui / Non). La scène lui passe ses touches
// tant que `scene.menuModal` existe.
// ---------------------------------------------------------------------------
function menuConfirm(scene, { title, text, yes = 'Oui', no = 'Non', depth = 3000 }) {
  return new Promise((resolve) => {
    const { width, height } = scene.scale;
    const c = scene.add.container(0, 0).setDepth(depth).setAlpha(0);
    const veil = scene.add.rectangle(0, 0, width, height, 0x07050d, 0.6).setOrigin(0).setInteractive();
    const w = 440;
    const h = 200;
    const px = (width - w) / 2;
    const py = (height - h) / 2;
    const g = scene.add.graphics();
    drawStoryPanel(g, px, py, w, h, { seed: 7 });
    const t = scene.add.text(width / 2, py + 36, title, {
      fontFamily: STORY_UI.serif, fontSize: '22px', fontStyle: 'bold', color: STORY_UI.title, padding: { x: 6, y: 4 },
    }).setOrigin(0.5);
    const body = scene.add.text(width / 2, py + 88, text, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#d8ccf5', align: 'center', lineSpacing: 4,
      wordWrap: { width: w - 60 },
    }).setOrigin(0.5);
    c.add([veil, g, t, body]);
    const buttons = [no, yes].map((label, i) => {
      const bx = width / 2 + (i === 0 ? -90 : 90);
      const by = py + h - 38;
      const bg = scene.add.graphics();
      const bt = scene.add.text(bx, by, label, {
        fontFamily: STORY_UI.serif, fontSize: '19px', color: STORY_UI.text, padding: { x: 6, y: 4 },
      }).setOrigin(0.5);
      const z = scene.add.zone(bx, by, 150, 38).setInteractive({ useHandCursor: true });
      c.add([bg, bt, z]);
      return { bx, by, bg, bt, z, value: i === 1 };
    });
    let sel = 0; // « Non » par défaut : on ne jette rien par erreur.
    const draw = () => buttons.forEach((b, i) => {
      b.bg.clear();
      const on = i === sel;
      b.bg.fillStyle(on ? STORY_UI.pink : STORY_UI.nightSoft, on ? 0.18 : 0.7);
      b.bg.fillRoundedRect(b.bx - 72, b.by - 18, 144, 36, 10);
      b.bg.lineStyle(1.5, on ? STORY_UI.pink : STORY_UI.vineLight, on ? 0.9 : 0.35);
      b.bg.strokeRoundedRect(b.bx - 72, b.by - 18, 144, 36, 10);
      b.bt.setColor(on ? '#ffc4dd' : STORY_UI.text);
    });
    const finish = (value) => {
      if (scene.menuModal !== modal) return;
      scene.menuModal = null;
      scene.tweens.add({ targets: c, alpha: 0, duration: 140, onComplete: () => c.destroy() });
      resolve(value);
    };
    buttons.forEach((b, i) => {
      b.z.on('pointerover', () => { sel = i; draw(); });
      b.z.on('pointerdown', () => finish(b.value));
    });
    const modal = {
      handleAction(action) {
        if (action === 'left' || action === 'up') { sel = 0; draw(); } else if (action === 'right' || action === 'down') { sel = 1; draw(); } else if (action === 'ok') finish(buttons[sel].value);
        else if (action === 'back') finish(false);
      },
    };
    scene.menuModal = modal;
    draw();
    scene.tweens.add({ targets: c, alpha: 1, duration: 160 });
  });
}

// ---------------------------------------------------------------------------
// Sous-écrans en overlay (Options, Contrôles, Crédits) : lancés par-dessus
// l'appelant (Title ou Pause), qui ignore ses touches tant qu'ils sont ouverts.
// ---------------------------------------------------------------------------
function menuOpenChild(scene, key, data = {}) {
  if (scene.scene.isActive(key)) return;
  scene.menuChildOpen = key;
  scene.input.keyboard.enabled = false;
  scene.scene.launch(key, { callerKey: scene.scene.key, ...data });
  scene.scene.bringToTop(key);
}

class MenuOverlayScene extends Phaser.Scene {
  init(data) {
    this.callerKey = data && data.callerKey;
    this.overlayData = data || {};
    this.closing = false;
  }

  // Voile + panneau ; renvoie {x, y, w, h}.
  buildFrame(w, h, { seed = 3, veil = 0.6 } = {}) {
    const { width, height } = this.scale;
    this.openedAt = this.time.now;
    this.root = this.add.container(0, 0).setAlpha(0);
    const v = this.add.rectangle(0, 0, width, height, 0x07050d, veil).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    const x = Math.round((width - w) / 2);
    const y = Math.round((height - h) / 2);
    drawStoryPanel(g, x, y, w, h, { seed });
    this.root.add([v, g]);
    this.tweens.add({ targets: this.root, alpha: 1, duration: 180 });
    this.input.keyboard.on('keydown', (e) => this.onKeyDown(e));
    return { x, y, w, h };
  }

  onKeyDown(event) {
    if (event.repeat || this.closing || this.time.now - this.openedAt < 120) return;
    const action = menuKeyAction(event);
    if (this.menuModal) { if (action) this.menuModal.handleAction(action); return; }
    if (this.handleExtraKey && this.handleExtraKey(event, action)) return;
    if (action === 'back') { this.close(); return; }
    if (this.list && action) this.list.handleAction(action);
  }

  close(result = null) {
    if (this.closing) return;
    this.closing = true;
    this.tweens.add({
      targets: this.root, alpha: 0, duration: 140,
      onComplete: () => {
        const caller = this.callerKey && this.scene.get(this.callerKey);
        this.scene.stop();
        if (caller) {
          caller.menuChildOpen = null;
          caller.menuChildClosedAt = caller.time.now;
          caller.input.keyboard.enabled = true;
          if (caller.onChildClosed) caller.onChildClosed(this.scene.key, result);
        }
      },
    });
  }
}

// ---------------------------------------------------------------------------
// En jeu : Échap / P ouvre la pause ; note la progression (chapitres) ;
// rappel des touches optionnel. Crochet de zone (monde non gelé seulement).
// ---------------------------------------------------------------------------
const MENU_PAUSE_EXCLUDED_SCENES = ['PlaytestScene'];

function menuGameHook(scene, time) {
  if (typeof EDITOR_MODE !== 'undefined' && EDITOR_MODE) return;
  if (MENU_PAUSE_EXCLUDED_SCENES.includes(scene.scene.key)) return;
  let st = scene.__menuHook;
  if (!st || st.player !== scene.player) {
    st = scene.__menuHook = {
      player: scene.player,
      esc: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC, false),
      p: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P, false),
      lastTime: -Infinity, unfrozenSince: time, hint: null, noted: null,
    };
  }
  // Le crochet ne tourne pas monde gelé : un trou dans les appels = un
  // overlay vient de se fermer (souvent avec Échap) — on ignore cet appui-là.
  if (time - st.lastTime > 120) st.unfrozenSince = time;
  st.lastTime = time;

  const entry = storyZoneEntry(scene);
  if (entry && st.noted !== entry.zone) {
    st.noted = entry.zone;
    const ch = MENU_CHAPTERS[menuChapterIndexOfZone(entry.zone)];
    if (ch) menuNoteChapter(ch.id);
  }
  if (!st.demoNoted && storyGet('demoFinished')) {
    st.demoNoted = true;
    menuUpdateProgress((p) => { p.demoFinished = true; });
  }

  // Réglage relu deux fois par seconde (il peut changer depuis la pause).
  if (time - (st.hintCheckedAt || -Infinity) > 500) {
    st.hintCheckedAt = time;
    menuUpdateControlsHint(scene, st);
  }

  const escDown = Phaser.Input.Keyboard.JustDown(st.esc);
  const pDown = Phaser.Input.Keyboard.JustDown(st.p);
  if ((escDown || pDown) && time - st.unfrozenSince > 150 && !scene.__transitioningAway) openPauseMenu(scene);
}

function menuUpdateControlsHint(scene, st) {
  const want = !!menuOptions().controlsHint;
  if (want && !st.hint) {
    const { width, height } = scene.scale;
    st.hint = scene.add.text(width / 2, height - 8, CONTROLS_HINT_LINE, {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#d8ccf5', backgroundColor: '#15101fb0',
      padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(1001).setAlpha(0.85);
  } else if (!want && st.hint) {
    st.hint.destroy();
    st.hint = null;
  }
}

function openPauseMenu(scene) {
  if (scene.scene.isActive('PauseScene') || isWorldFrozen(scene)) return;
  if (scene.player && scene.player.body) scene.player.setVelocityX(0);
  scene.scene.launch('PauseScene', { parentKey: scene.scene.key });
  scene.scene.bringToTop('PauseScene');
  // Vrai gel : physique, tweens, minuteries et scripts de la zone s'arrêtent.
  scene.scene.pause();
}

if (typeof LEVEL_UPDATE_HOOKS !== 'undefined') LEVEL_UPDATE_HOOKS.push(menuGameHook);
