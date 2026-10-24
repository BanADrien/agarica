// Menu du feu de camp (FEAT modif.txt) : vraie scène Phaser lancée EN
// PARALLÈLE de la Zone*Scene en cours (jamais un Graphics/Text bricolé
// par-dessus, cf. git history de ce fichier — LevelKit.js gèle
// player/xara/ennemis pendant que cette scène est active, cf.
// updateLevelFromData). Sa propre caméra (jamais de scrollFactor à gérer)
// simplifie tout le placement écran + le glisser-déposer, qui a besoin de
// coordonnées écran stables.
//
// 3 catégories, chacune avec DEUX façons d'équiper (demande explicite :
// "je veux pouvoir glisser deposer et cliquer sur un choix puis sur
// l'emplacement") :
// - Formes de déplacement : 3 emplacements typés (sol/aérien/eau, cf.
//   FORM_INFO) ; doivent être ÉQUIPÉES pour fonctionner en jeu.
// - Compétences (cf. SKILL_DEFS dans Player.js / Crapaud.js / Projectiles.js).
// - Totem : UN SEUL {head, body} (pas plusieurs emplacements -- revenu sur
//   l'idée de cumul entre plusieurs totems, demande explicite : "un seul
//   totem au total"), cf. Player.equippedTotem. VERROUILLÉ pour la démo,
//   cf. DEMO_TOTEMS_LOCKED (Player.js) et CAMPFIRE_TOTEMS_LOCKED plus bas.
//
// Cartes sans art dédié : rectangle coloré par catégorie + icône du
// manifest si elle existe. `rebuildUI()` détruit et recrée TOUTES les
// cartes à chaque changement plutôt que de patcher incrémentalement -- ça
// gère gratuitement le "retour à sa place" d'un geste refusé/annulé
// (glisser OU clic) : si l'état du joueur n'a pas changé, rebuildUI()
// replace chaque carte exactement là où elle était avant.
// Emplacements de formes (démo histoire) : SOL = loup, AÉRIEN = singe OU
// aigle (exclusifs), EAU = pieuvre. L'équipement passe par
// Player.equipForm/unequipForm (qui tiennent `equippedForms` + `airForm`).
// Le papillon n'est PAS une forme (décision utilisateur : « le papillon ne
// doit être qu'une compétence ») : il n'apparaît que parmi les compétences.

// Démo : totems verrouillés (cadenas, aucune interaction). La règle vit dans
// Player.js (DEMO_TOTEMS_LOCKED : bonus ignorés par recomputeTotemBonuses,
// sauvegarde intacte) ; le menu ne fait que la lire pour son affichage.
const CAMPFIRE_TOTEMS_LOCKED = typeof DEMO_TOTEMS_LOCKED !== 'undefined' ? DEMO_TOTEMS_LOCKED : true;

const FORM_INFO = {
  wolf: { flag: 'hasWolfForm', label: 'Loup', slot: 'ground', icon: ['form-icon-wolf'], desc: 'Loup (sol) : course rapide (Maj / double-tap), perçoit les pistes cachées.' },
  monkey: { flag: 'hasMonkeyForm', label: 'Singe', slot: 'air', icon: ['form-icon-monkey', 'item-form_icone_singe'], desc: 'Singe (aérien) : donne le double saut (court), s\'accroche aux lianes (gauche/droite pour se balancer, Espace pour lâcher, S pour tomber).' },
  eagle: { flag: 'hasEagleForm', label: 'Aigle', slot: 'air', icon: ['form-icon-eagle'], desc: 'Aigle (aérien) : donne le double saut (plus haut) puis le plané, porté par les courants d\'air (S = piqué).' },
  octopus: { flag: 'hasOctopusForm', label: 'Pieuvre', slot: 'water', icon: ['form-icon-octopus'], desc: 'Pieuvre (eau) : nage libre.' },
};
const FORM_IDS = Object.keys(FORM_INFO);
// Sous-titre court : l'ancien « Aérien (une seule forme) » débordait de sa
// colonne de 108 px.
const FORM_SLOTS = [
  { slot: 'ground', label: 'Sol' },
  { slot: 'air', label: 'Aérien · une seule' },
  { slot: 'water', label: 'Eau' },
];
// Icônes ITEM_MANIFEST (textures `item-<id>`) ; repli : pastille colorée.
const SKILL_ICON_ITEM = {
  ours: 'skill_icone_ours', pierre: 'skill_icone_singe', papillon: 'skill_icone_papillon',
};
const SKILL_INFO_DESC = {
  ours: 'Ours : fracas au sol, brise les amas de mousse.',
  pierre: 'Pierre : lancer en cloche (talisman du singe).',
  papillon: 'Papillons : soigne les créatures corrompues, sans les blesser.',
  crapaud: 'Crapaud : coup de langue devant soi.',
};
const SKILL_KEYS = ['A', 'F', 'R'];
// Les ids de têtes (Player.js) sont sans accents : libellés d'affichage.
const CAMPFIRE_HEAD_LABELS = { felin: 'Félin', canide: 'Canidé', cervide: 'Cervidé' };

const CARD_COLORS = {
  form: 0x3a5a8c,
  skill: 0x8c4a3a,
  totemHead: 0x6a4a8c,
  totemBody: 0x3f7a52,
};
// Totem verrouillé : mêmes cartes, teintes éteintes (gris violet / gris
// vert) pour qu'on lise « présent mais pas encore là ».
const CAMPFIRE_LOCKED_CARD_COLORS = { totemHead: 0x3b354a, totemBody: 0x343d39 };
const SLOT_EMPTY_COLOR = 0x241c3d;
const SELECT_HIGHLIGHT_COLOR = 0xffe066;
// Contour des textes posés sur les planches : sans lui, le violet clair et
// le vert lunaire se noient dans le bois.
const CAMPFIRE_TEXT_STROKE = '#1a0e12';

// Zone utile du panneau peint, en coordonnées écran 960x540, MESURÉE sur
// assets/items/firecamp_menu/interface.png (1455x1081, 4:3) affiché à
// échelle uniforme 0,4995 (727x540, centré) : intérieur des planches
// x 198..764, y 93..445 (pointes des ornements du haut et du bas, au
// centre) ; feuilles des coins du bas qui resserrent l'intérieur à
// x 219..743 sous y 402. Deux bandes gardent >= 12 px de marge avec les
// lianes : `main` (large) et `foot` (plus étroite, descend plus bas).
// Repris par le contrôle de mise en page des tests (getBounds).
const CAMPFIRE_SAFE = {
  main: { x0: 212, x1: 748, y0: 106, y1: 390 },
  foot: { x0: 232, x1: 728, y0: 106, y1: 433 },
};
// Grille commune. Colonne gauche (formes, compétences) : 3 colonnes de
// 108 px + gouttières de 12 px (212..560). Colonne droite (totem) :
// 576..748, 2 emplacements de 80 px ou 3 colonnes de 52 px (pas de 58).
// Rangées en y = HAUT des textes, CENTRE des emplacements, des cartes et du
// bloc de description (1 ou 2 lignes, centré dans sa hauteur) ; les deux
// colonnes partagent les rangées en-tête / emplacements / rangées du bas.
// Rythme vertical (mesuré au pixel) : >= 5 px entre le bas des lettres (y
// compris le « p » de « Corps » / « Compétences ») et le trait des cadres,
// 6 px entre un emplacement et sa rangée, 6 px entre deux sections. Les
// têtes de totem tombent sur la rangée de formes, l'entre-deux et les
// emplacements de compétences (236 / 267 / 298). Cartes de 28 px (icônes
// de 24 px : à 18 px les médaillons des formes devenaient identiques) dans
// des emplacements et des rangées de 34 px.
const CAMPFIRE_LAYOUT = {
  left: { x0: 212, colW: 108, gap: 12 },
  right: { x0: 576, x1: 748, slotW: 80, cellW: 52, cellStep: 58 },
  rows: {
    title: 106,
    head: 141, slotSub: 159, slot: 196, pool: 236,
    skillHead: 259, skillSlot: 298, skillPool: 338,
    heads: [236, 267, 298],
    desc: 376, bonus: 395, foot: 415,
  },
  slotH: 34, poolH: 34, cardH: 28, iconSize: 24, totemCardH: 26,
};

class CampfireMenuScene extends Phaser.Scene {
  constructor() {
    super('CampfireMenuScene');
  }

  init(data) {
    this.player = data.player;
  }

  create() {
    this.totemsLocked = CAMPFIRE_TOTEMS_LOCKED;
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    // Voile sombre : fond du menu ET repli si le panneau peint manque.
    this.add.rectangle(480, 270, 960, 540, 0x0d0b1a, 0.82).setName('fond');
    this.buildPanel();
    this.buildHeader();

    // Cf. historique : un simple TABLEAU de cartes de premier niveau (un
    // Container imbriqué cassait la zone de clic de ses enfants).
    this.dynamicCards = [];
    // Légendes des rangées vides (« repose ici pour retirer »), recréées
    // avec les cartes.
    this.dynamicDecor = [];
    this.dropZones = [];
    this.selectedCard = null;
    // Seuil de glisser : un clic immobile ne doit pas devenir un 'dragstart'.
    this.input.dragDistanceThreshold = 6;

    this.buildStaticSlots();
    if (this.totemsLocked) this.buildTotemLock();
    this.wireInputEvents();
    this.rebuildUI();
    // Juice : le menu du feu s'ouvre avec un léger rebond.
    juiceOverlayIn(this);

    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  // Panneau peint (ITEM_MANIFEST `ui_feu_camp`) à échelle UNIFORME : l'ancien
  // setDisplaySize(950, 534) étirait l'image 4:3 de 31 % en largeur (lianes
  // et feuilles écrasées). Il occupe donc toute la hauteur et 727 px de
  // large ; CAMPFIRE_SAFE est mesuré pour ce placement.
  buildPanel() {
    if (this.textures.exists('item-ui_feu_camp')) {
      const img = this.add.image(480, 270, 'item-ui_feu_camp');
      img.setScale(Math.min(960 / img.width, 540 / img.height)).setAlpha(0.97).setName('fond');
    } else if (typeof drawStoryPanel === 'function') {
      // Repli : cadre de bois dessiné (StoryKit) sur la même emprise que les
      // planches, pour que la mise en page reste juste sans l'image.
      const g = this.add.graphics().setName('fond');
      drawStoryPanel(g, 200, 96, 560, 340, { seed: 3 });
    }
  }

  // Texte posé sur les planches : contour sombre systématique (lisibilité).
  addPanelText(x, y, text, { size = 11, color = '#ffe9f5', bold = false, serif = false, originX = 0.5, originY = 0, stroke = 3 } = {}) {
    return this.add.text(x, y, text, {
      fontFamily: serif ? STORY_UI.serif : 'sans-serif',
      fontSize: `${size}px`,
      fontStyle: bold ? 'bold' : 'normal',
      color,
      stroke: CAMPFIRE_TEXT_STROKE,
      strokeThickness: stroke,
    }).setOrigin(originX, originY);
  }

  buildHeader() {
    const R = CAMPFIRE_LAYOUT.rows;
    // Titre sous la pointe de l'ornement central du haut (y 93 + marge).
    // « Vie et énergie restaurées » n'a plus sa ligne sous le titre : ces
    // 20 px servent à agrandir les cartes ; il ouvre la ligne des bonus.
    this.addPanelText(480, R.title, 'Feu de camp', { size: 20, color: STORY_UI.title, bold: true, serif: true, stroke: 4 });

    // Consigne raccourcie, en bas, sur la même ligne que la touche de
    // fermeture (avant : une longue phrase sur les lianes du haut).
    const hint = this.addPanelText(0, R.foot, 'Glisse ou clique une carte, puis sa place · en bas pour la retirer', { size: 10, color: '#d8ccf5', originX: 0 });
    const sep = this.addPanelText(0, R.foot, '   ·   ', { size: 10, color: '#a99bd6', originX: 0 });
    const close = this.addPanelText(0, R.foot, 'E ou Échap pour fermer', { size: 10, color: '#ffe066', bold: true, originX: 0 });
    const total = hint.width + sep.width + close.width;
    let x = 480 - total / 2;
    for (const t of [hint, sep, close]) {
      t.x = x;
      x += t.width;
    }
  }

  // En-tête de section : libellé + filet rose jusqu'au bout de la colonne.
  addSectionHeader(x0, x1, y, text) {
    const t = this.addPanelText(x0, y, text, { size: 12, bold: true, originX: 0 });
    const ruleX = t.x + t.width + 6;
    if (x1 - ruleX > 8) {
      // 0,6 : à 0,45 le filet disparaissait sur le joint sombre des planches (y 146-148).
      this.add.rectangle(ruleX, y + t.height / 2, x1 - ruleX, 1, 0xff9fc9, 0.6).setOrigin(0, 0.5);
    }
    return t;
  }

  // Rectangles d'emplacement, créés une fois : zones de dépôt ET cibles de
  // clic (`kind`/`slotIndex` en data). Une zone « pool » par catégorie pour
  // déséquiper (slotIndex 'pool'), discrète et rentrée dans les planches.
  buildStaticSlots() {
    const L = CAMPFIRE_LAYOUT;
    const R = L.rows;
    const drawSlotBox = (x, y, w, h, kind, slotIndex) => {
      const box = this.add.rectangle(x, y, w, h, SLOT_EMPTY_COLOR, 0.92)
        .setStrokeStyle(2, 0x8fe3b8, 0.7);
      box.setData('kind', kind);
      box.setData('slotIndex', slotIndex);
      box.setInteractive({ dropZone: true });
      this.dropZones.push(box);
      return box;
    };
    // Rangée « disponibles » : creux sombre à peine marqué (avant : un
    // rectangle de 900 px qui traversait tout le cadre).
    const drawPoolInset = (x0, x1, y, h, kind) => {
      const box = this.add.rectangle((x0 + x1) / 2, y, x1 - x0, h, 0x0d0816, 0.3)
        .setStrokeStyle(1, 0x8fe3b8, 0.22);
      box.setData('kind', kind);
      box.setData('slotIndex', 'pool');
      box.setInteractive({ dropZone: true });
      this.dropZones.push(box);
      return box;
    };
    const left0 = L.left.x0;
    const leftX1 = left0 + 3 * L.left.colW + 2 * L.left.gap;
    const colX = (i) => left0 + L.left.colW / 2 + i * (L.left.colW + L.left.gap);
    this.leftColumnX = { x0: left0, x1: leftX1, cx: (left0 + leftX1) / 2 };

    // -- Formes : 3 emplacements typés.
    this.addSectionHeader(left0, leftX1, R.head, 'Formes');
    this.formSlotBoxes = {};
    FORM_SLOTS.forEach((fs, i) => {
      this.addPanelText(colX(i), R.slotSub, fs.label, { size: 10, color: '#c9b8f0' });
      this.formSlotBoxes[fs.slot] = drawSlotBox(colX(i), R.slot, L.left.colW, L.slotH, 'form', fs.slot);
    });
    this.formPoolZone = drawPoolInset(left0, leftX1, R.pool, L.poolH, 'form');

    // -- Compétences : la touche est une petite « touche de clavier » dans
    // la partie gauche de l'emplacement, toujours visible (la carte équipée
    // occupe le reste).
    this.addSectionHeader(left0, leftX1, R.skillHead, 'Compétences');
    this.skillSlotBoxes = SKILL_KEYS.map((k, i) => {
      const box = drawSlotBox(colX(i), R.skillSlot, L.left.colW, L.slotH, 'skill', i);
      const kx = box.x - box.width / 2 + 12;
      this.add.rectangle(kx, box.y, 16, 20, 0x15101f, 1).setStrokeStyle(1, 0xffe066, 0.75);
      this.add.text(kx, box.y, k, { fontFamily: 'sans-serif', fontSize: '11px', color: '#ffe066', fontStyle: 'bold' }).setOrigin(0.5);
      return box;
    });
    this.skillPoolZone = drawPoolInset(left0, leftX1, R.skillPool, L.poolH, 'skill');

    // -- Totem : une tête + un corps (colonne droite).
    const rx0 = L.right.x0;
    const rx1 = L.right.x1;
    const totemSlotX = [rx0 + L.right.slotW / 2, rx1 - L.right.slotW / 2];
    this.totemColumn = { x0: rx0, x1: rx1, cx: (rx0 + rx1) / 2 };
    this.totemHeader = this.addSectionHeader(rx0, rx1, R.head, 'Totem');
    this.addPanelText(totemSlotX[0], R.slotSub, 'Tête', { size: 10, color: '#c9b8f0' });
    this.addPanelText(totemSlotX[1], R.slotSub, 'Corps', { size: 10, color: '#c9b8f0' });
    // Rangée des têtes : du haut de la rangée de formes au bas des
    // emplacements de compétences (mêmes lignes que la colonne gauche).
    const headsTop = R.pool - L.poolH / 2;
    const headsBottom = R.skillSlot + L.slotH / 2;
    if (this.totemsLocked) {
      // Verrouillé : mêmes emplacements, mais simples dessins (ni zone de
      // dépôt, ni cible de clic : rien ne doit réagir).
      const dim = (x, y, w, h) => this.add.rectangle(x, y, w, h, 0x1c1628, 0.7).setStrokeStyle(2, 0x6f6391, 0.45);
      this.totemHeadSlot = dim(totemSlotX[0], R.slot, L.right.slotW, L.slotH);
      this.totemBodySlot = dim(totemSlotX[1], R.slot, L.right.slotW, L.slotH);
      this.add.rectangle((rx0 + rx1) / 2, (headsTop + headsBottom) / 2, rx1 - rx0, headsBottom - headsTop, 0x0d0816, 0.25)
        .setStrokeStyle(1, 0x6f6391, 0.25);
      this.add.rectangle((rx0 + rx1) / 2, R.skillPool, rx1 - rx0, L.poolH, 0x0d0816, 0.25)
        .setStrokeStyle(1, 0x6f6391, 0.25);
    } else {
      this.totemHeadSlot = drawSlotBox(totemSlotX[0], R.slot, L.right.slotW, L.slotH, 'totemHead', 'equipped');
      this.totemBodySlot = drawSlotBox(totemSlotX[1], R.slot, L.right.slotW, L.slotH, 'totemBody', 'equipped');
      this.totemHeadPoolZone = drawPoolInset(rx0, rx1, (headsTop + headsBottom) / 2, headsBottom - headsTop, 'totemHead');
      this.totemBodyPoolZone = drawPoolInset(rx0, rx1, R.skillPool, L.poolH, 'totemBody');
    }

    // Description de la carte survolée/sélectionnée (aide contextuelle) :
    // largeur de la bande `foot` (plus étroite) car, sur 2 lignes, elle
    // descend sous y 390, là où les feuilles des coins resserrent le bois.
    this.descText = this.addPanelText(480, R.desc, '', { size: 11, color: '#ffe9f5', originY: 0.5 });
    this.descText.setAlign('center').setWordWrapWidth(CAMPFIRE_SAFE.foot.x1 - CAMPFIRE_SAFE.foot.x0 - 8);
    // Ligne d'état : « Vie et énergie restaurées » (ancien sous-titre, en
    // vert lunaire) puis les bonus actuels (lilas), centrés ensemble par
    // layoutBonusLine() à chaque mise à jour.
    this.restoredText = this.addPanelText(0, R.bonus, 'Vie et énergie restaurées', { size: 11, color: '#8fe3b8', bold: true, originX: 0 });
    this.bonusSep = this.addPanelText(0, R.bonus, '  •  ', { size: 11, color: '#a99bd6', originX: 0 });
    this.bonusText = this.addPanelText(0, R.bonus, '', { size: 11, color: '#d8ccf5', originX: 0 });
  }

  layoutBonusLine() {
    const parts = [this.restoredText, this.bonusSep, this.bonusText];
    const total = () => parts.reduce((w, t) => w + t.width, 0);
    // Totem déverrouillé, la ligne s'allonge (« x1.15 taille de
    // compétence ») : un cran plus petit pour rester dans la bande du bas.
    parts.forEach((t) => t.setFontSize(11));
    if (total() > CAMPFIRE_SAFE.foot.x1 - CAMPFIRE_SAFE.foot.x0 - 8) parts.forEach((t) => t.setFontSize(10));
    let x = 480 - total() / 2;
    for (const t of parts) {
      t.x = Math.round(x);
      x += t.width;
    }
  }

  // --- Verrou du totem (démo) -----------------------------------------------

  // Section totem assombrie, barrée de deux chaînes en croix tenues par un
  // cadenas. Tout est purement visuel : une seule zone de clic, qui fait
  // trembler le cadenas sans rien débloquer.
  buildTotemLock() {
    const L = CAMPFIRE_LAYOUT;
    const R = L.rows;
    const col = this.totemColumn;
    const top = R.head - 4;
    const bottom = R.skillPool + L.poolH / 2 + 2;
    const cy = (top + bottom) / 2;
    // Voile violet nuit par-dessus les cartes (profondeur 4 > cartes 0) :
    // assombrit et éteint les couleurs de toute la section.
    this.add.rectangle(col.cx, cy, col.x1 - col.x0, bottom - top, 0x120c1e, 0.5).setDepth(4);
    this.totemHeader.setDepth(9).setColor('#c9b8f0');

    campfireEnsureLockTextures(this);
    // Bouts à 18 px des bords : maillons tournés compris, la chaîne reste
    // dans la zone utile (pas sur les lianes).
    const pad = 18;
    // Départ sous l'en-tête « Totem », qui reste lisible au-dessus du voile.
    const a = { x: col.x0 + pad, y: R.slotSub + 15 };
    const b = { x: col.x1 - pad, y: bottom - 12 };
    this.addChain(a.x, a.y, b.x, b.y, 5);
    this.addChain(b.x, a.y, a.x, b.y, 6);

    // Cadenas au croisement, accroché par l'anse (origine haute : il
    // pivote comme un objet suspendu quand il tremble).
    const cross = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const lockKey = this.textures.exists('item-ui_cadenas') ? 'item-ui_cadenas' : 'campfire-padlock';
    const lock = this.add.image(cross.x, cross.y - 14, lockKey).setOrigin(0.5, 0.12).setDepth(7);
    if (lockKey !== 'campfire-padlock') lock.setScale(52 / lock.height);
    this.lockPadlock = lock;

    // « Verrouillé — bientôt » sur une petite plaque sombre sous le cadenas.
    const label = this.add.text(cross.x, lock.y + lock.displayHeight * 0.88 + 12, 'Verrouillé — bientôt', {
      fontFamily: 'sans-serif', fontSize: '10px', color: '#ffd6ea', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9);
    this.add.rectangle(label.x, label.y, label.width + 14, 16, 0x15101f, 0.9)
      .setStrokeStyle(1, 0xff9fc9, 0.55).setDepth(8);

    // Seule interaction : un clic fait trembler le cadenas. Pas de survol,
    // pas de dropZone (une carte glissée ici est simplement rendue).
    const zone = this.add.zone(col.cx, cy, col.x1 - col.x0, bottom - top).setDepth(9);
    zone.setInteractive();
    zone.on('pointerdown', () => this.shakeLock());
    this.totemLockZone = zone;
  }

  // Chaîne de maillons ovales alternés (de face / de profil) le long d'un
  // segment, clouée aux deux bouts. Les maillons de profil passent par-
  // dessus ceux de face : l'œil lit des maillons enchaînés.
  addChain(x1, y1, x2, y2, depth) {
    const custom = this.textures.exists('item-ui_chaine');
    const faceKey = custom ? 'item-ui_chaine' : 'campfire-chain-face';
    const sideKey = custom ? 'item-ui_chaine' : 'campfire-chain-side';
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const step = 15;
    const n = Math.max(2, Math.floor(len / step));
    const links = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const face = i % 2 === 0;
      const img = this.add.image(x1 + dx * t, y1 + dy * t, face ? faceKey : sideKey)
        .setRotation(angle).setScale(0.82).setDepth(depth + (face ? 0 : 0.5));
      if (custom) img.setScale(17 / img.height);
      links.push(img);
    }
    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      this.add.image(x, y, 'campfire-chain-bolt').setDepth(depth + 0.6);
    }
    return links;
  }

  shakeLock() {
    const lock = this.lockPadlock;
    if (!lock) return;
    this.tweens.killTweensOf(lock);
    lock.setAngle(0);
    this.tweens.add({
      targets: lock, angle: { from: -10, to: 10 }, duration: 60, yoyo: true, repeat: 2,
      ease: 'Sine.easeInOut', onComplete: () => lock.setAngle(0),
    });
    if (typeof playSfx === 'function') playSfx('skill_denied', { key: this.scene.key });
  }

  // --- Cartes -------------------------------------------------------------

  // Icône d'une carte : 1re texture existante parmi `keys`, sinon pastille
  // colorée avec l'initiale (placeholder tant que l'art n'existe pas).
  // Renvoie la largeur prise à gauche (marge + icône + jour avant le texte).
  addCardIcon(card, keys, size, fallbackColor, letter) {
    const key = (keys || []).find((k) => this.textures.exists(k));
    const ix = -card.width / 2 + size / 2 + 3;
    if (key) {
      const img = this.add.image(ix, 0, key);
      img.setScale(size / Math.max(img.width, img.height));
      card.add(img);
    } else {
      card.add(this.add.circle(ix, 0, size / 2, fallbackColor, 1).setStrokeStyle(1, 0xffe9f5, 0.7));
      card.add(this.add.text(ix, 0, letter, { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
    }
    return size + 5;
  }

  // Une carte glissable ET cliquable (Container = ombre + fond + icône +
  // texte). `slotIndex` seulement si elle occupe un emplacement. `inert` :
  // carte de la section verrouillée, affichée éteinte et sans AUCUNE
  // interactivité.
  makeCard(x, y, w, h, label, kind, id, slotIndex, { iconKeys = null, iconColor = 0x555555, desc = '', inert = false } = {}) {
    const card = this.add.container(x, y);
    card.setSize(w, h);
    card.add(this.add.rectangle(1.5, 2, w, h, 0x000000, 0.35));
    const color = inert ? CAMPFIRE_LOCKED_CARD_COLORS[kind] : CARD_COLORS[kind];
    const bg = this.add.rectangle(0, 0, w, h, color, 1).setStrokeStyle(1, inert ? 0x6f6391 : 0xffe9f5, 0.5);
    card.add(bg);
    // Liseré clair en haut : la carte se détache du bois.
    card.add(this.add.rectangle(0, -h / 2 + 1.5, w - 4, 1, 0xffffff, inert ? 0.08 : 0.2));
    // Zone du texte : toute la carte moins 3 px de chaque côté, ou, avec une
    // icône, ce qui reste à droite de l'icône.
    let textX = 0;
    let textW = w - 6;
    if (iconKeys) {
      const used = this.addCardIcon(card, iconKeys, Math.min(h - 4, CAMPFIRE_LAYOUT.iconSize), iconColor, label.charAt(0));
      textX = (used - 3) / 2;
      textW = w - used - 3;
    }
    const txt = this.add.text(Math.round(textX), 0, label, {
      fontFamily: 'sans-serif', fontSize: '11px', color: inert ? '#8f86a8' : '#ffe9f5', align: 'center',
    }).setOrigin(0.5);
    campfireFitLabel(txt, label, textW, h - 2);
    card.add(txt);
    card.setData('kind', kind);
    card.setData('id', id);
    card.setData('slotIndex', slotIndex ?? null);
    card.setData('bg', bg);
    card.setData('desc', desc);
    card.setData('label', txt);
    this.dynamicCards.push(card);
    if (inert) {
      card.setAlpha(0.75);
      return card;
    }
    // Zone de clic explicite (un Container n'en génère pas tout seul), en
    // coordonnées « coin haut gauche » : Phaser (InputManager.
    // pointWithinHitArea) ajoute déjà displayOriginX/Y = w/2, h/2 au point
    // testé. Avec (-w/2, -h/2), la zone réelle était décalée d'une demi-
    // carte en haut à gauche : moitié droite/basse muette, bois cliquable.
    card.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    this.input.setDraggable(card);
    card.on('pointerover', () => { if (desc) this.showDesc(desc); });
    card.on('pointerout', () => this.showDesc(this.selectedCard ? this.selectedCard.getData('desc') : ''));
    return card;
  }

  // Description sur 2 lignes au plus (sinon un cran plus petit) ; vide =
  // rappel par défaut.
  showDesc(text) {
    const t = this.descText;
    t.setFontSize(11).setText(text || this.defaultHint || '');
    if (t.height > 32) t.setFontSize(10);
  }

  // Légende discrète d'une rangée vide (« repose ici pour retirer ») :
  // rend visible la zone de dépôt quand elle ne contient aucune carte.
  addPoolCaption(zone, text) {
    const t = this.add.text(zone.x, zone.y, text, {
      fontFamily: 'sans-serif', fontSize: '10px', color: '#a99bd6', fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0.85);
    this.dynamicDecor.push(t);
  }

  formIsEquipped(id) {
    const player = this.player;
    if (FORM_INFO[id].slot === 'air') return player.airForm === id;
    return player.equippedForms.includes(id);
  }

  // Rangée centrée dans une colonne, pas fixe (grille de la rangée).
  rowXs(count, cx, step) {
    const start = cx - ((count - 1) * step) / 2;
    return Array.from({ length: count }, (_, i) => start + i * step);
  }

  // Détruit et recrée toutes les cartes depuis l'état RÉEL du joueur.
  rebuildUI() {
    this.dynamicCards.forEach((c) => c.destroy());
    this.dynamicCards = [];
    this.dynamicDecor.forEach((d) => d.destroy());
    this.dynamicDecor = [];
    const player = this.player;
    const L = CAMPFIRE_LAYOUT;
    const R = L.rows;
    const leftCx = this.leftColumnX.cx;

    // Formes : occupants des emplacements, puis formes débloquées libres.
    const unlocked = FORM_IDS.filter((id) => player[FORM_INFO[id].flag]);
    const formCards = [];
    const pool = [];
    for (const id of unlocked) {
      const info = FORM_INFO[id];
      const opts = { iconKeys: info.icon, iconColor: CARD_COLORS.form, desc: info.desc };
      if (this.formIsEquipped(id)) {
        const box = this.formSlotBoxes[info.slot];
        formCards.push(this.makeCard(box.x, box.y, box.width - 8, L.cardH, info.label, 'form', id, info.slot, opts));
      } else {
        pool.push([id, opts]);
      }
    }
    // Jusqu'à 3 formes libres : cartes de 100 alignées sur les colonnes des
    // emplacements (pas de 120) ; 4 (rien d'équipé) : cartes de 63, pas de
    // 69, SANS icône : avec, il resterait 31 px pour le nom (un nom de 8
    // lettres fait ~40 px à 11 px) et toute la rangée tomberait à 8 px.
    const formFew = pool.length <= 3;
    this.rowXs(pool.length, leftCx, formFew ? 120 : 69).forEach((x, i) => {
      const [id, opts] = pool[i];
      const o = formFew ? opts : { ...opts, iconKeys: null };
      formCards.push(this.makeCard(x, R.pool, formFew ? 100 : 63, L.cardH, FORM_INFO[id].label, 'form', id, null, o));
    });
    campfireUniformLabels(formCards);
    if (!pool.length) {
      this.addPoolCaption(this.formPoolZone, unlocked.length ? 'Repose une forme ici pour la retirer' : 'Aucune forme débloquée');
    }

    // Compétences (la carte équipée laisse visible la touche à gauche). Le
    // nom seul sur la carte (« Ours », pas « Ours — Fracas au sol ») : même
    // aspect équipée ou en réserve, une ligne en 11 px ; l'effet se lit
    // dans la description au survol.
    const skillName = (id) => SKILL_DEFS[id].label.split(' — ')[0];
    const skillOpts = (id) => ({
      iconKeys: [`item-${SKILL_ICON_ITEM[id] || `skill_icone_${id}`}`], iconColor: SKILL_DEFS[id].hudColor || CARD_COLORS.skill,
      desc: SKILL_INFO_DESC[id] || SKILL_DEFS[id].label,
    });
    const skillCards = [];
    player.skillSlots.forEach((id, slotIdx) => {
      if (!id || !SKILL_DEFS[id]) return;
      const box = this.skillSlotBoxes[slotIdx];
      // De 24 px après le bord gauche (touche de 16 px + jours) à 4 px du
      // bord droit : carte de 80 px.
      const x0 = box.x - box.width / 2 + 24;
      const x1 = box.x + box.width / 2 - 4;
      skillCards.push(this.makeCard((x0 + x1) / 2, box.y, x1 - x0, L.cardH, skillName(id), 'skill', id, slotIdx, skillOpts(id)));
    });
    const unequippedSkills = [...player.unlockedSkills].filter((id) => SKILL_DEFS[id] && !player.skillSlots.includes(id));
    // Même grille que les formes : jusqu'à 3 sur les colonnes, sinon
    // cartes de 80 (comme dans les emplacements), pas de 86.
    const skillFew = unequippedSkills.length <= 3;
    this.rowXs(unequippedSkills.length, leftCx, skillFew ? 120 : 86).forEach((x, i) => {
      const id = unequippedSkills[i];
      skillCards.push(this.makeCard(x, R.skillPool, skillFew ? 100 : 80, L.cardH, skillName(id), 'skill', id, null, skillOpts(id)));
    });
    campfireUniformLabels(skillCards);
    if (!unequippedSkills.length) {
      const anySkill = [...player.unlockedSkills].some((id) => SKILL_DEFS[id]);
      this.addPoolCaption(this.skillPoolZone, anySkill ? 'Repose une compétence ici pour la retirer' : 'Aucune compétence débloquée');
    }

    // Totem : un seul {head, body}. Verrouillé : mêmes cartes, inertes
    // (le totem sauvegardé reste affiché dans ses emplacements).
    const inert = this.totemsLocked;
    const headLabel = (id) => CAMPFIRE_HEAD_LABELS[id] || (id.charAt(0).toUpperCase() + id.slice(1));
    const t = player.equippedTotem;
    const totemCards = [];
    if (t.head) {
      const box = this.totemHeadSlot;
      totemCards.push(this.makeCard(box.x, box.y, box.width - 8, L.cardH, headLabel(t.head), 'totemHead', t.head, 'equipped', { inert }));
    }
    if (t.body && TOTEM_BODIES[t.body]) {
      const box = this.totemBodySlot;
      totemCards.push(this.makeCard(box.x, box.y, box.width - 8, L.cardH, TOTEM_BODIES[t.body].label, 'totemBody', t.body, 'equipped', { inert }));
    }
    // Têtes/corps toujours disponibles en pool (pas de stock limité) :
    // grille de 3 colonnes de 52 px, alignées sur les corps en dessous.
    const cellXs = this.rowXs(3, this.totemColumn.cx, L.right.cellStep);
    TOTEM_HEADS.forEach((id, i) => {
      const y = R.heads[Math.floor(i / 3) % R.heads.length];
      totemCards.push(this.makeCard(cellXs[i % 3], y, L.right.cellW, L.totemCardH, headLabel(id), 'totemHead', id, null, { inert }));
    });
    const bodyEntries = Object.entries(TOTEM_BODIES);
    this.rowXs(bodyEntries.length, this.totemColumn.cx, L.right.cellStep).forEach((x, i) => {
      const [id, def] = bodyEntries[i];
      totemCards.push(this.makeCard(x, R.skillPool, L.right.cellW, L.totemCardH, def.label, 'totemBody', id, null, { inert }));
    });
    campfireUniformLabels(totemCards);

    // Bonus actuels : pendant la démo, aucun bonus de totem (cf. verrou en
    // tête de fichier) -- la ligne le dit plutôt que d'afficher x1.00.
    const hearts = player.maxHearts - HEART_MAX;
    const energy = player.maxEnergy - ENERGY_MAX;
    this.bonusText.setText(inert
      ? `Bonus : +${hearts} cœur(s)  •  +${energy} énergie  •  totem verrouillé`
      : `Bonus : +${hearts} cœur(s)  •  +${energy} énergie  •  x${player.skillSizeMultiplier.toFixed(2)} taille de compétence`);
    this.layoutBonusLine();
    // Rappel (règle de saut) : seule une forme aérienne équipée donne le double saut.
    this.defaultHint = unlocked.length
      ? 'Survole une carte pour voir ce qu\'elle fait. Sans forme aérienne équipée : un seul saut.'
      : 'Les formes et les compétences se débloquent au fil de l\'histoire.';
    if (!this.descText.text) this.showDesc('');
    this.selectedCard = null;
  }

  setCardHighlight(card, on) {
    const bg = card.getData('bg');
    bg.setStrokeStyle(on ? 3 : 1, on ? SELECT_HIGHLIGHT_COLOR : 0xffe9f5, on ? 1 : 0.5);
  }

  selectCard(card) {
    if (this.selectedCard === card) {
      this.setCardHighlight(card, false);
      this.selectedCard = null;
      return;
    }
    if (this.selectedCard) this.setCardHighlight(this.selectedCard, false);
    this.selectedCard = card;
    this.setCardHighlight(card, true);
    if (card.getData('desc')) this.showDesc(card.getData('desc'));
  }

  wireInputEvents() {
    // -- Glisser-déposer.
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });
    this.input.on('dragstart', (pointer, gameObject) => {
      gameObject.setDepth(10);
      // Le 'pointerup' qui suit ne doit pas compter comme un clic de sélection.
      gameObject.setData('wasDragged', true);
    });
    this.input.on('drop', (pointer, gameObject, dropZone) => {
      this.applyDrop(gameObject, dropZone);
    });
    // Reconstruit dans tous les cas : remet chaque carte à sa place si rien
    // n'a changé.
    this.input.on('dragend', () => {
      this.rebuildUI();
    });

    // -- Clic-puis-clic : tout décidé au relâchement ('gameobjectup'), une
    // seule fois (cf. historique : scinder down/up créait une course).
    this.input.on('gameobjectup', (pointer, gameObject) => {
      if (this.dynamicCards.includes(gameObject)) {
        if (gameObject.getData('wasDragged')) {
          gameObject.setData('wasDragged', false);
          return;
        }
        // Cliquer la carte qui occupe une place revient à cliquer cette
        // place : la carte couvre presque tout son emplacement (et les
        // cartes du bas presque toute leur rangée), le clic n'atteignait
        // donc jamais la zone de dépôt et changeait la sélection. Un
        // déplacement n'a de sens que vers/depuis un emplacement ; deux
        // formes déjà équipées (emplacements typés) : simple changement de
        // sélection, comme deux cartes de la réserve.
        const sel = this.selectedCard;
        const kind = gameObject.getData('kind');
        if (sel && sel !== gameObject && sel.getData('kind') === kind) {
          const target = gameObject.getData('slotIndex') ?? 'pool';
          const fromSlot = sel.getData('slotIndex') !== null;
          const toSlot = target !== 'pool';
          const zone = this.dropZones.find((z) => z.getData('kind') === kind && z.getData('slotIndex') === target);
          if (zone && (fromSlot || toSlot) && !(kind === 'form' && fromSlot && toSlot)) {
            this.applyDrop(sel, zone);
            this.selectedCard = null;
            this.rebuildUI();
            return;
          }
        }
        this.selectCard(gameObject);
        return;
      }
      if (this.selectedCard && this.dropZones.includes(gameObject)) {
        this.applyDrop(this.selectedCard, gameObject);
        this.selectedCard = null;
        this.rebuildUI();
      }
    });
  }

  applyDrop(card, dropZone) {
    const kind = card.getData('kind');
    if (dropZone.getData('kind') !== kind) return; // mauvaise catégorie : rebuildUI la remet en place
    const zoneSlot = dropZone.getData('slotIndex');
    const sourceSlot = card.getData('slotIndex');
    const id = card.getData('id');
    const player = this.player;

    if (kind === 'form') {
      // Déposée sur N'IMPORTE QUEL emplacement de forme : rangée dans le sien
      // (le singe remplace l'aigle et inversement, cf. Player.equipForm).
      if (zoneSlot === 'pool') player.unequipForm(id);
      else player.equipForm(id);
    } else if (kind === 'skill') {
      if (sourceSlot !== null) player.skillSlots[sourceSlot] = null;
      if (zoneSlot !== 'pool') player.skillSlots[zoneSlot] = id; // l'ancien occupant retourne au pool
      this.registry.set('skillSlots', player.skillSlots);
    } else if (kind === 'totemHead' || kind === 'totemBody') {
      // Garde-fou : rien ne doit pouvoir modifier le totem pendant la démo.
      if (this.totemsLocked) return;
      const field = kind === 'totemHead' ? 'head' : 'body';
      if (sourceSlot === 'equipped') player.equippedTotem[field] = null;
      if (zoneSlot !== 'pool') player.equippedTotem[field] = id;
      this.registry.set('equippedTotem', player.equippedTotem);
      player.recomputeTotemBonuses();
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.player.interactKey) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.stop();
    }
  }
}

// Ajuste le libellé (un seul mot : les cartes ne portent que des noms) à
// sa place : 11 px si ça tient, sinon un cran plus petit, jusqu'à 8 px (un
// mot ne se coupe jamais : sans ça il débordait de la carte). La grille est
// dimensionnée pour que les noms actuels tiennent en 11 px (10 px pour les
// têtes de totem « Carnivore » / « Herbivore ») : 8-9 px reste un filet de
// sécurité pour un futur nom trop long.
function campfireFitLabel(txt, label, maxW, maxH) {
  const fits = () => txt.width <= maxW && txt.height <= maxH;
  txt.setText(label).setFontSize(11).setLineSpacing(0);
  for (const size of [10, 9, 8]) {
    if (fits()) return;
    txt.setFontSize(size);
  }
}

// Même taille de libellé pour tout un groupe de cartes (une catégorie) :
// la plus petite trouvée par campfireFitLabel. Sinon « Loup » en 11 px
// voisinait un nom plus long en 9 px dans la même rangée. Réduire ne fait que
// rétrécir, donc chaque libellé tient toujours dans sa carte.
function campfireUniformLabels(cards) {
  const labels = cards.map((c) => c.getData('label')).filter(Boolean);
  if (!labels.length) return;
  const size = Math.min(...labels.map((t) => parseFloat(t.style.fontSize)));
  for (const t of labels) {
    if (parseFloat(t.style.fontSize) !== size) t.setFontSize(size);
  }
}

// Chaîne et cadenas dessinés une fois par partie (textures partagées entre
// scènes) en « fer froid » violet sombre, cohérent avec la palette nuit :
// dégradés métalliques, contour sombre, reflet clair, ombre portée. Canvas
// 2D plutôt que Graphics : dégradés et ellipses propres.
function campfireEnsureLockTextures(scene) {
  const T = scene.textures;
  const metal = (c, x0, y0, x1, y1) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#ddd6f5');
    g.addColorStop(0.32, '#9289b4');
    g.addColorStop(0.68, '#564c78');
    g.addColorStop(1, '#2c2542');
    return g;
  };
  const roundRect = (c, x, y, w, h, r) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };

  // Maillon vu de face : anneau ovale (axe de la chaîne = x).
  if (!T.exists('campfire-chain-face')) {
    const tex = T.createCanvas('campfire-chain-face', 34, 24);
    const c = tex.getContext();
    const cx = 16.5;
    const cy = 11;
    const rx = 12.5;
    const ry = 7.2;
    const ring = (dx, dy, w, style) => {
      c.lineWidth = w;
      c.strokeStyle = style;
      c.beginPath();
      c.ellipse(cx + dx, cy + dy, rx, ry, 0, 0, Math.PI * 2);
      c.stroke();
    };
    ring(1.3, 2, 5, 'rgba(6,3,14,0.55)'); // ombre portée
    ring(0, 0, 6.5, '#140f22'); // contour sombre (bords int. et ext.)
    ring(0, 0, 4.2, metal(c, cx - rx, cy - ry, cx + rx, cy + ry));
    c.lineWidth = 1.3;
    c.strokeStyle = 'rgba(255,255,255,0.85)'; // reflet spéculaire en haut à gauche
    c.beginPath();
    c.ellipse(cx, cy, rx - 0.6, ry - 0.6, 0, Math.PI * 1.08, Math.PI * 1.5);
    c.stroke();
    c.strokeStyle = 'rgba(255,159,201,0.35)'; // pointe de rose dans le reflet bas
    c.beginPath();
    c.ellipse(cx, cy, rx + 0.4, ry + 0.4, 0, Math.PI * 0.15, Math.PI * 0.45);
    c.stroke();
    tex.refresh();
  }

  // Maillon vu de profil : barre arrondie (on voit la tranche de l'anneau).
  if (!T.exists('campfire-chain-side')) {
    const tex = T.createCanvas('campfire-chain-side', 34, 24);
    const c = tex.getContext();
    c.fillStyle = 'rgba(6,3,14,0.5)';
    roundRect(c, 5, 10.5, 26, 7, 3.5);
    c.fill();
    c.fillStyle = '#140f22';
    roundRect(c, 3.2, 7.2, 27.6, 9.6, 4.8);
    c.fill();
    c.fillStyle = metal(c, 0, 8, 0, 16);
    roundRect(c, 4.4, 8.4, 25.2, 7.2, 3.6);
    c.fill();
    c.strokeStyle = 'rgba(20,15,34,0.75)'; // jour entre les deux brins de l'anneau
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(9, 12.2);
    c.lineTo(25, 12.2);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.beginPath();
    c.moveTo(7.5, 9.6);
    c.lineTo(21, 9.6);
    c.stroke();
    tex.refresh();
  }

  // Piton qui cloue chaque bout de chaîne dans les planches.
  if (!T.exists('campfire-chain-bolt')) {
    const tex = T.createCanvas('campfire-chain-bolt', 14, 14);
    const c = tex.getContext();
    c.fillStyle = 'rgba(6,3,14,0.55)';
    c.beginPath();
    c.arc(7.8, 8.2, 5, 0, Math.PI * 2);
    c.fill();
    const g = c.createRadialGradient(5.5, 5.2, 0.5, 7, 7, 5.5);
    g.addColorStop(0, '#f0ebff');
    g.addColorStop(0.45, '#8a80ad');
    g.addColorStop(1, '#2a2340');
    c.fillStyle = g;
    c.strokeStyle = '#140f22';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(7, 7, 4.6, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    tex.refresh();
  }

  // Cadenas : anse en U, corps en fer violet sombre, rivets, entrée de
  // serrure cerclée de rose (le clin d'œil au tatouage d'Agarica).
  if (!T.exists('campfire-padlock')) {
    const W = 50;
    const H = 58;
    const tex = T.createCanvas('campfire-padlock', W, H);
    const c = tex.getContext();
    const cx = W / 2;
    // Anse : contour sombre, métal, reflet.
    const shackle = (w, style) => {
      c.lineWidth = w;
      c.strokeStyle = style;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx - 11, 31);
      c.lineTo(cx - 11, 20);
      c.arc(cx, 20, 11, Math.PI, 0);
      c.lineTo(cx + 11, 31);
      c.stroke();
    };
    shackle(9, '#140f22');
    shackle(5.5, metal(c, cx - 14, 6, cx + 14, 30));
    c.lineWidth = 1.3;
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.beginPath();
    c.arc(cx, 20, 11.6, Math.PI * 1.08, Math.PI * 1.45);
    c.stroke();
    // Corps : ombre, contour, dégradé violet nuit, biseau clair en haut.
    const bx = 7;
    const by = 28;
    const bw = W - 14;
    const bh = 26;
    c.fillStyle = 'rgba(6,3,14,0.55)';
    roundRect(c, bx + 2, by + 3, bw, bh, 6);
    c.fill();
    c.fillStyle = '#140f22';
    roundRect(c, bx - 1.5, by - 1.5, bw + 3, bh + 3, 7);
    c.fill();
    const body = c.createLinearGradient(0, by, 0, by + bh);
    body.addColorStop(0, '#8a7ab3');
    body.addColorStop(0.25, '#5d4e86');
    body.addColorStop(1, '#2a2140');
    c.fillStyle = body;
    roundRect(c, bx, by, bw, bh, 6);
    c.fill();
    c.strokeStyle = 'rgba(214,204,245,0.75)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(bx + 5, by + 2.2);
    c.lineTo(bx + bw - 5, by + 2.2);
    c.stroke();
    // Rivets aux quatre coins.
    for (const [rx, ry] of [[bx + 5, by + 6], [bx + bw - 5, by + 6], [bx + 5, by + bh - 5], [bx + bw - 5, by + bh - 5]]) {
      c.fillStyle = '#140f22';
      c.beginPath();
      c.arc(rx, ry, 2.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#d6cdf2';
      c.beginPath();
      c.arc(rx - 0.4, ry - 0.4, 1.3, 0, Math.PI * 2);
      c.fill();
    }
    // Entrée de serrure : rosace rose, trou de serrure noir.
    const ky = by + 12;
    c.fillStyle = '#ff9fc9';
    c.beginPath();
    c.arc(cx, ky, 6.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3a2340';
    c.beginPath();
    c.arc(cx, ky, 4.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#07040c';
    c.beginPath();
    c.arc(cx, ky - 1, 2.4, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(cx - 1.4, ky);
    c.lineTo(cx + 1.4, ky);
    c.lineTo(cx + 2.4, ky + 7.5);
    c.lineTo(cx - 2.4, ky + 7.5);
    c.closePath();
    c.fill();
    // Éclat de lumière sur le coin haut gauche du corps.
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath();
    c.moveTo(bx + 9, by + 4);
    c.lineTo(bx + 11, by + 6);
    c.lineTo(bx + 9, by + 8);
    c.lineTo(bx + 7, by + 6);
    c.closePath();
    c.fill();
    tex.refresh();
  }
}
