// Menu du feu de camp (FEAT modif.txt) : vraie scène Phaser lancée EN
// PARALLÈLE de la Zone*Scene en cours (jamais un Graphics/Text bricolé
// par-dessus, cf. git history de ce fichier — LevelKit.js gèle
// player/xara/ennemis pendant que cette scène est active, cf.
// updateLevelFromData). Sa propre caméra (jamais de scrollFactor à gérer)
// simplifie tout le placement écran + le glisser-déposer, qui a besoin de
// coordonnées écran stables.
//
// Feu refait le 2026-11-08 (point 3 de la liste) : Agarica s'assoit au feu
// (campfireSit, LevelKit) ; assise, E ou Entrée ouvre CE menu, qui a trois
// écrans (`mode`, un `scene.restart` par changement d'écran : chacun est
// reconstruit de zéro, rien à défaire) :
// - 'hub'    : la liste des entrées (CAMPFIRE_HUB_ENTRIES) ;
// - 'forms'  : formes et compétences (le panneau à glisser-déposer d'avant) ;
// - 'flight' : vol de l'aigle vers un autre feu (règles dans StoryKit).
// Carte et inventaire sont leurs propres scènes (MapScene, InventoryScene),
// ouvertes PAR-DESSUS ce menu mis en pause (`returnTo`) : les fermer le
// reprend là où il était. Échap dans le hub ferme le menu, Agarica reste
// assise ; la partie est sauvegardée à la fermeture (formes changées…).
//
// Écran 'forms', 2 catégories, chacune avec DEUX façons d'équiper (demande
// explicite : "je veux pouvoir glisser deposer et cliquer sur un choix puis
// sur l'emplacement") :
// - Formes de déplacement : 3 emplacements typés (sol/aérien/eau, cf.
//   FORM_INFO) ; doivent être ÉQUIPÉES pour fonctionner en jeu.
// - Compétences (cf. SKILL_DEFS dans Player.js / Crapaud.js / Projectiles.js).
// Totems à équiper (une tête + un corps, cf. Player.equippedTotem) : mis de
// côté tant qu'il y a peu de formes (décision du 2026-11-08) -- leur colonne
// n'est plus affichée (CAMPFIRE_SHOW_TOTEMS) ; code et sauvegarde gardés.
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

// Totems verrouillés (bonus ignorés, cf. DEMO_TOTEMS_LOCKED dans Player.js) ;
// le menu ne fait que lire la constante.
const CAMPFIRE_TOTEMS_LOCKED = typeof DEMO_TOTEMS_LOCKED !== 'undefined' ? DEMO_TOTEMS_LOCKED : true;
// Colonne des totems (tête + corps) dans l'écran des formes. `false` depuis
// le 2026-11-08 (plus de section totem, ni cadenas ni chaînes) ; `true` la
// rend telle qu'avant, en cartes inertes tant que les totems sont verrouillés.
const CAMPFIRE_SHOW_TOTEMS = false;

const FORM_INFO = {
  wolf: { flag: 'hasWolfForm', label: 'Loup', slot: 'ground', icon: ['form-icon-wolf'], desc: 'Loup (sol) : course rapide (Maj / double-tap), coup de croc (K), perçoit les pistes cachées.' },
  // Lianes : seule Agarica devenue singe s'y accroche, donc après le double saut.
  monkey: { flag: 'hasMonkeyForm', label: 'Singe', slot: 'air', icon: ['form-icon-monkey', 'item-form_icone_singe'], desc: 'Singe (aérien) : donne le double saut (court) ; après lui, s\'accroche aux lianes (gauche/droite pour se balancer, Espace pour lâcher, S pour tomber).' },
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
// 108 px + gouttières de 12 px (348 px) ; centrée sur le panneau (306..654)
// sans colonne des totems, sinon à gauche (212..560) et colonne droite
// (totem) 576..748, 2 emplacements de 80 px ou 3 colonnes de 52 px (pas de 58).
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
  left: { x0: CAMPFIRE_SHOW_TOTEMS ? 212 : 306, colW: 108, gap: 12 },
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

// Entrées du hub (écran d'accueil du menu). `icon` : textures essayées dans
// l'ordre (manifest, icônes de forme), sinon pastille avec l'initiale.
const CAMPFIRE_HUB_ENTRIES = [
  { id: 'forms', label: 'Formes et compétences', icon: ['form-icon-wolf'], color: 0x3a5a8c,
    desc: 'Équipe tes formes (sol, aérien, eau) et tes compétences (A, F, R).' },
  { id: 'map', label: 'Carte', icon: ['item-carte_geralt'], color: 0x9a7444,
    desc: 'La carte du monde, avec ce que tu as découvert jusqu\'à ce feu.' },
  { id: 'flight', label: 'Vol', icon: ['form-icon-eagle'], color: 0x6a4a8c,
    desc: 'Rejoins d\'un coup d\'aile un feu où tu t\'es déjà assise.' },
  { id: 'inventory', label: 'Inventaire', icon: ['item-talisman_ours'], color: 0x3f7a52,
    desc: 'Tes objets de quête et tes consommables.' },
  { id: 'items', label: 'Objets', icon: [], color: 0x4a4258, soon: true,
    desc: 'Bientôt.' },
];
// Liste du hub : centrée, une entrée tous les 38 px sous le titre et sa
// ligne d'état (jusqu'à y 340, au-dessus de la description).
const CAMPFIRE_HUB_LIST = { x0: 330, x1: 630, y0: 174, step: 38, rowH: 30 };
// Liste des destinations du vol (défile au-delà de `rows`).
const CAMPFIRE_FLIGHT_LIST = { x0: 300, x1: 660, y0: 178, step: 32, rowH: 28, rows: 6 };

class CampfireMenuScene extends Phaser.Scene {
  constructor() {
    super('CampfireMenuScene');
  }

  init(data) {
    this.player = data && data.player;
    this.fire = (data && data.fire) || null;
    this.parentKey = (data && data.parentKey) || (this.player && this.player.scene ? this.player.scene.scene.key : null);
    this.mode = (data && data.mode) || 'hub';
    this.hubIndex = (data && data.hubIndex) || 0;
    this.closing = false;
  }

  create() {
    // Toujours ouvert depuis une zone avec le joueur (LevelKit) ; lancé seul
    // (harnais de test, démarrage direct), il se referme au lieu de planter.
    if (!this.player || !this.player.scene) {
      this.scene.stop();
      return;
    }
    this.totemsLocked = CAMPFIRE_TOTEMS_LOCKED;
    this.showTotems = CAMPFIRE_SHOW_TOTEMS;
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    // Voile sombre : fond du menu ET repli si le panneau peint manque.
    this.add.rectangle(480, 270, 960, 540, 0x0d0b1a, 0.82).setName('fond');
    this.buildPanel();
    this.openedAt = this.time.now;
    this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.onKey, this));
    // Carte / inventaire refermés : ce menu reprend la main (touche de
    // fermeture de l'écran du dessus ignorée, cf. openedAt). Les événements de
    // la scène survivent à `restart` : un seul écouteur.
    this.events.off('resume', this.onResume, this);
    this.events.on('resume', this.onResume, this);
    if (this.mode === 'forms') this.buildFormsScreen();
    else if (this.mode === 'flight') this.buildFlightScreen();
    else this.buildHubScreen();
    // Juice : le menu s'ouvre avec un léger rebond (seulement à l'ouverture,
    // pas à chaque changement d'écran).
    if (!this.player.scene.__campfireMenuOpenFx) {
      this.player.scene.__campfireMenuOpenFx = true;
      juiceOverlayIn(this);
    }
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

  // Ligne du bas : morceaux posés bout à bout, centrés (consignes, touches).
  addFootLine(parts) {
    const R = CAMPFIRE_LAYOUT.rows;
    const texts = parts.map(([text, color, bold]) => this.addPanelText(0, R.foot, text, { size: 10, color, bold: !!bold, originX: 0 }));
    const total = texts.reduce((w, t) => w + t.width, 0);
    let x = 480 - total / 2;
    for (const t of texts) {
      t.x = Math.round(x);
      x += t.width;
    }
    return texts;
  }

  // Description centrée (2 lignes au plus) au-dessus de la ligne du bas.
  addDescText() {
    const R = CAMPFIRE_LAYOUT.rows;
    const t = this.addPanelText(480, R.desc, '', { size: 11, color: '#ffe9f5', originY: 0.5 });
    t.setAlign('center').setWordWrapWidth(CAMPFIRE_SAFE.foot.x1 - CAMPFIRE_SAFE.foot.x0 - 8);
    return t;
  }

  // Changer d'écran : la scène est reconstruite (cf. en-tête).
  switchMode(mode) {
    if (this.closing) return;
    this.closing = true;
    this.scene.restart({ player: this.player, fire: this.fire, parentKey: this.parentKey, mode, hubIndex: this.hubIndex });
  }

  // Ferme le menu (Agarica reste assise) : sauvegarde des formes/compétences
  // changées (zones de l'histoire seulement), touches de la zone relâchées.
  // `after` : appelé une fois le menu arrêté (vol).
  closeMenu(after = null) {
    if (this.closing) return;
    this.closing = true;
    const parent = this.parentKey ? this.scene.get(this.parentKey) : null;
    if (parent) {
      parent.__campfireMenuOpenFx = false;
      if (isStoryScene(parent)) saveGame(parent, { silent: true });
      releaseStoryInput(parent);
    }
    this.scene.stop();
    if (after && parent) after(parent);
  }

  // Carte ou inventaire PAR-DESSUS ce menu, mis en pause (cf. en-tête).
  openOverlay(key, data = {}) {
    if (!this.parentKey) return;
    this.scene.launch(key, { parentKey: this.parentKey, returnTo: this.scene.key, ...data });
    this.scene.bringToTop(key);
    this.scene.pause();
  }

  onResume() {
    this.openedAt = this.time.now;
  }

  onKey(event) {
    if (event.repeat || this.closing || this.time.now - this.openedAt < 150) return;
    const action = menuKeyAction(event);
    const k = (event.key || '').toLowerCase();
    if (this.mode === 'forms') {
      // E ou Échap : retour au hub (comme l'ancienne fermeture du panneau).
      if (k === 'e' || k === 'escape' || k === 'backspace') this.switchMode('hub');
      return;
    }
    if (this.mode === 'flight') {
      if (action === 'back') this.switchMode('hub');
      else if (action === 'up') this.selectFlight(this.flightIndex - 1);
      else if (action === 'down') this.selectFlight(this.flightIndex + 1);
      else if (action === 'ok' || k === 'enter') this.activateFlight();
      return;
    }
    if (action === 'back') this.closeMenu();
    else if (action === 'up') this.selectHub(this.hubIndex - 1, -1);
    else if (action === 'down') this.selectHub(this.hubIndex + 1, 1);
    else if (action === 'ok' || k === 'enter') this.activateHub();
  }

  // --- Hub ------------------------------------------------------------------

  // Entrées visibles (le vol n'apparaît qu'avec la forme de l'aigle) et leur
  // état : `disabled` (raison) ou null.
  hubEntries() {
    const p = this.player;
    const out = [];
    for (const e of CAMPFIRE_HUB_ENTRIES) {
      if (e.id === 'flight' && !(p.hasEagleForm || storyGet('hasEagleForm'))) continue;
      let disabled = null;
      if (e.soon) disabled = 'Bientôt.';
      else if (e.id === 'map' && !storyMapAvailable()) disabled = 'Tu n\'as pas encore de carte.';
      else if (e.id === 'flight' && this.fire && this.player.scene) disabled = campfireFlightDepartureBlock(this.player.scene, this.fire.id);
      out.push({ ...e, disabled });
    }
    return out;
  }

  buildHubScreen() {
    const R = CAMPFIRE_LAYOUT.rows;
    const L = CAMPFIRE_HUB_LIST;
    this.addPanelText(480, R.title, 'Feu de camp', { size: 20, color: STORY_UI.title, bold: true, serif: true, stroke: 4 });
    // État : ce que le repos vient de faire (cf. campfireSit).
    const story = this.player.scene && isStoryScene(this.player.scene);
    this.addPanelText(480, R.title + 28, story ? 'Vie et énergie restaurées  •  partie sauvegardée' : 'Vie et énergie restaurées',
      { size: 11, color: '#8fe3b8', bold: true });
    this.hubItems = this.hubEntries();
    this.hubHighlight = this.add.graphics();
    this.hubItems.forEach((it, i) => {
      const y = L.y0 + i * L.step;
      it.y = y;
      const dim = !!it.disabled;
      // Icône : texture du manifest ou pastille colorée avec l'initiale.
      const ix = L.x0 + 26;
      const key = (it.icon || []).find((t) => this.textures.exists(t));
      if (key) {
        const img = this.add.image(ix, y, key);
        img.setScale(24 / Math.max(img.width, img.height)).setAlpha(dim ? 0.45 : 1);
      } else {
        this.add.circle(ix, y, 12, it.color, dim ? 0.5 : 1).setStrokeStyle(1, 0xffe9f5, 0.6);
        this.add.text(ix, y, it.label.charAt(0), { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(dim ? 0.6 : 1);
      }
      it.text = this.addPanelText(ix + 22, y, it.label, { size: 16, bold: true, serif: true, originX: 0, originY: 0.5, color: dim ? '#8f86a8' : '#ffe9f5' });
      if (it.soon) {
        this.addPanelText(L.x1 - 14, y, 'bientôt', { size: 10, color: '#a99bd6', originX: 1, originY: 0.5 }).setFontStyle('italic');
      } else if (dim) {
        // Retour joueurs (2026-11-08, carte) : entrée grisée avec sa raison en
        // court sur la ligne même (la phrase complète s'affiche dessous quand
        // on la choisit) -- on comprend sans avoir à la sélectionner.
        const tag = it.id === 'map' ? 'pas encore de carte' : 'indisponible';
        this.addPanelText(L.x1 - 14, y, tag, { size: 10, color: '#a99bd6', originX: 1, originY: 0.5 }).setFontStyle('italic');
      }
      const zone = this.add.zone((L.x0 + L.x1) / 2, y, L.x1 - L.x0, L.rowH).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.selectHub(i));
      zone.on('pointerdown', () => { this.selectHub(i); this.activateHub(); });
    });
    this.hubDesc = this.addDescText();
    this.addFootLine([
      ['↑↓ : choisir', '#d8ccf5'], ['   ·   ', '#a99bd6'], ['E / Entrée : ouvrir', '#d8ccf5'],
      ['   ·   ', '#a99bd6'], ['Échap : fermer (tu restes assise)', '#ffe066', true],
    ]);
    this.selectHub(Phaser.Math.Clamp(this.hubIndex, 0, this.hubItems.length - 1));
  }

  // `dir` : sens de la flèche (saute les entrées « bientôt », jamais choisies au clavier).
  selectHub(i, dir = 0) {
    const n = this.hubItems.length;
    if (!n) return;
    let idx = ((i % n) + n) % n;
    if (dir) {
      for (let s = 0; s < n && this.hubItems[idx].soon; s++) idx = (((idx + dir) % n) + n) % n;
    }
    this.hubIndex = idx;
    const it = this.hubItems[idx];
    const L = CAMPFIRE_HUB_LIST;
    const g = this.hubHighlight;
    g.clear();
    g.fillStyle(0xff9fc9, 0.12);
    g.fillRoundedRect(L.x0, it.y - L.rowH / 2, L.x1 - L.x0, L.rowH, 9);
    g.lineStyle(1.5, it.disabled ? 0xa99bd6 : SELECT_HIGHLIGHT_COLOR, 0.8);
    g.strokeRoundedRect(L.x0, it.y - L.rowH / 2, L.x1 - L.x0, L.rowH, 9);
    this.hubItems.forEach((o) => {
      if (!o.disabled) o.text.setColor(o === it ? '#ffe066' : '#ffe9f5');
    });
    const desc = it.disabled && !it.soon ? `${it.desc}\n${it.disabled}` : it.desc;
    this.hubDesc.setFontSize(11).setText(desc);
    if (this.hubDesc.height > 32) this.hubDesc.setFontSize(10);
  }

  activateHub() {
    const it = this.hubItems && this.hubItems[this.hubIndex];
    if (!it) return;
    if (it.disabled) {
      // Refus lisible : la ligne tremble, la raison est déjà affichée dessous.
      this.tweens.killTweensOf(it.text);
      const x0 = it.text.x;
      this.tweens.add({ targets: it.text, x: { from: x0 - 4, to: x0 + 4 }, duration: 50, yoyo: true, repeat: 2, onComplete: () => it.text.setX(x0) });
      if (typeof playSfx === 'function') playSfx('skill_denied', { key: this.scene.key });
      return;
    }
    if (typeof playSfx === 'function') playSfx('menu_ok');
    if (it.id === 'forms') this.switchMode('forms');
    else if (it.id === 'flight') this.switchMode('flight');
    else if (it.id === 'map') this.openOverlay('MapScene');
    else if (it.id === 'inventory') this.openOverlay('InventoryScene', { campfire: true });
  }

  // --- Vol de l'aigle ---------------------------------------------------------

  buildFlightScreen() {
    const R = CAMPFIRE_LAYOUT.rows;
    const L = CAMPFIRE_FLIGHT_LIST;
    this.addPanelText(480, R.title, 'Vol de l\'aigle', { size: 20, color: STORY_UI.title, bold: true, serif: true, stroke: 4 });
    this.addPanelText(480, R.title + 28, 'Rejoins un feu où tu t\'es déjà assise. Tu t\'y poseras assise.', { size: 11, color: '#d8ccf5' });
    const scene = this.player.scene;
    const fromId = this.fire ? this.fire.id : null;
    this.flightBlock = campfireFlightDepartureBlock(scene, fromId);
    this.flightItems = this.flightBlock ? [] : campfireFlightDestinations(scene, fromId);
    this.flightDesc = this.addDescText();
    this.flightHighlight = this.add.graphics();
    this.flightRows = [];
    for (let r = 0; r < L.rows; r++) {
      const y = L.y0 + r * L.step;
      const flame = this.add.graphics();
      const text = this.addPanelText(L.x0 + 34, y, '', { size: 15, bold: true, serif: true, originX: 0, originY: 0.5 });
      const note = this.addPanelText(L.x1 - 12, y, '', { size: 10, color: '#a99bd6', originX: 1, originY: 0.5 });
      const zone = this.add.zone((L.x0 + L.x1) / 2, y, L.x1 - L.x0, L.rowH).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => { if (this.flightTop + r < this.flightItems.length) this.selectFlight(this.flightTop + r); });
      zone.on('pointerdown', () => {
        if (this.flightTop + r >= this.flightItems.length) return;
        this.selectFlight(this.flightTop + r);
        this.activateFlight();
      });
      this.flightRows.push({ y, flame, text, note });
    }
    this.flightMore = this.addPanelText(480, L.y0 + L.rows * L.step - 8, '', { size: 10, color: '#a99bd6' });
    this.flightTop = 0;
    this.flightIndex = 0;
    if (this.flightBlock || !this.flightItems.length) {
      this.addPanelText(480, L.y0 + 50, this.flightBlock || 'Aucun autre feu où tu te sois assise pour l\'instant.', { size: 13, color: '#ffe9f5', serif: true })
        .setAlign('center').setWordWrapWidth(L.x1 - L.x0);
    }
    this.addFootLine([
      ['↑↓ : choisir', '#d8ccf5'], ['   ·   ', '#a99bd6'], ['E / Entrée : t\'envoler', '#d8ccf5'],
      ['   ·   ', '#a99bd6'], ['Échap : retour', '#ffe066', true],
    ]);
    this.selectFlight(0);
  }

  // Petite flamme dessinée devant chaque destination (éteinte si interdite).
  drawFlightFlame(g, x, y, lit) {
    g.clear();
    g.fillStyle(0x5a3a22, 1);
    g.fillRect(x - 7, y + 5, 14, 3);
    g.fillStyle(lit ? 0xff9a3c : 0x6f6391, 1);
    g.fillTriangle(x - 6, y + 5, x + 6, y + 5, x, y - 9);
    g.fillStyle(lit ? 0xffe066 : 0x8f86a8, 1);
    g.fillTriangle(x - 3, y + 5, x + 3, y + 5, x, y - 3);
  }

  selectFlight(i) {
    const items = this.flightItems || [];
    const L = CAMPFIRE_FLIGHT_LIST;
    if (!items.length) {
      this.flightHighlight.clear();
      this.flightRows.forEach((row) => { row.text.setText(''); row.note.setText(''); row.flame.clear(); });
      this.flightDesc.setText('');
      return;
    }
    this.flightIndex = Phaser.Math.Clamp(i, 0, items.length - 1);
    // Défilement : la sélection reste dans les `rows` lignes visibles.
    if (this.flightIndex < this.flightTop) this.flightTop = this.flightIndex;
    if (this.flightIndex >= this.flightTop + L.rows) this.flightTop = this.flightIndex - L.rows + 1;
    this.flightRows.forEach((row, r) => {
      const it = items[this.flightTop + r];
      if (!it) { row.text.setText(''); row.note.setText(''); row.flame.clear(); return; }
      const on = this.flightTop + r === this.flightIndex;
      row.text.setText(it.label).setColor(it.blocked ? '#8f86a8' : (on ? '#ffe066' : '#ffe9f5'));
      row.note.setText(it.blocked ? 'impossible' : '');
      this.drawFlightFlame(row.flame, L.x0 + 18, row.y, !it.blocked);
    });
    const more = items.length - (this.flightTop + L.rows);
    this.flightMore.setText(more > 0 ? `… ${more} autre${more > 1 ? 's' : ''} plus bas` : '');
    const sel = items[this.flightIndex];
    const y = L.y0 + (this.flightIndex - this.flightTop) * L.step;
    const g = this.flightHighlight;
    g.clear();
    g.fillStyle(0xff9fc9, 0.12);
    g.fillRoundedRect(L.x0, y - L.rowH / 2, L.x1 - L.x0, L.rowH, 8);
    g.lineStyle(1.5, sel.blocked ? 0xa99bd6 : SELECT_HIGHLIGHT_COLOR, 0.8);
    g.strokeRoundedRect(L.x0, y - L.rowH / 2, L.x1 - L.x0, L.rowH, 8);
    this.flightDesc.setFontSize(11).setText(sel.blocked || `Envol vers : ${sel.label}.`);
  }

  activateFlight() {
    const items = this.flightItems || [];
    const it = items[this.flightIndex];
    if (!it) return;
    if (it.blocked) {
      const row = this.flightRows[this.flightIndex - this.flightTop];
      const x0 = row.text.x;
      this.tweens.add({ targets: row.text, x: { from: x0 - 4, to: x0 + 4 }, duration: 50, yoyo: true, repeat: 2, onComplete: () => row.text.setX(x0) });
      if (typeof playSfx === 'function') playSfx('skill_denied', { key: this.scene.key });
      return;
    }
    if (typeof playSfx === 'function') playSfx('menu_ok');
    this.closeMenu((parent) => campfireFlyTo(parent, it));
  }

  // --- Formes et compétences -------------------------------------------------

  buildFormsScreen() {
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
    this.wireInputEvents();
    this.rebuildUI();
  }

  buildHeader() {
    const R = CAMPFIRE_LAYOUT.rows;
    // Titre sous la pointe de l'ornement central du haut (y 93 + marge).
    this.addPanelText(480, R.title, 'Formes et compétences', { size: 20, color: STORY_UI.title, bold: true, serif: true, stroke: 4 });

    // Consigne raccourcie, en bas, sur la même ligne que la touche de retour.
    this.addFootLine([
      ['Glisse ou clique une carte, puis sa place · en bas pour la retirer', '#d8ccf5'],
      ['   ·   ', '#a99bd6'], ['E ou Échap : retour', '#ffe066', true],
    ]);
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
    // Touche peinte (`ui_touche`, bois clair, 20 px) : la même pastille que
    // les cases A/F/R du HUD, pour qu'on relie l'emplacement à sa touche en
    // jeu. Lettre sombre #2a1f45 obligatoire sur le bois clair. Elle tient
    // dans les 24 px laissés à gauche de la carte équipée (2..22 px).
    // Repli : la touche sombre dessinée, lettre jaune.
    const paintedKey = this.textures.exists('item-ui_touche');
    this.skillSlotBoxes = SKILL_KEYS.map((k, i) => {
      const box = drawSlotBox(colX(i), R.skillSlot, L.left.colW, L.slotH, 'skill', i);
      const kx = box.x - box.width / 2 + 12;
      if (paintedKey) {
        const key = this.add.image(kx, box.y, 'item-ui_touche');
        key.setScale(20 / Math.max(key.width, key.height));
        this.add.text(kx, box.y, k, { fontFamily: 'sans-serif', fontSize: '11px', color: '#2a1f45', fontStyle: 'bold' }).setOrigin(0.5);
      } else {
        this.add.rectangle(kx, box.y, 16, 20, 0x15101f, 1).setStrokeStyle(1, 0xffe066, 0.75);
        this.add.text(kx, box.y, k, { fontFamily: 'sans-serif', fontSize: '11px', color: '#ffe066', fontStyle: 'bold' }).setOrigin(0.5);
      }
      return box;
    });
    this.skillPoolZone = drawPoolInset(left0, leftX1, R.skillPool, L.poolH, 'skill');

    // -- Totem : une tête + un corps (colonne droite), seulement si la
    // section est affichée (CAMPFIRE_SHOW_TOTEMS) ; verrouillé, simples
    // dessins (ni zone de dépôt, ni cible de clic).
    if (this.showTotems) {
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
    }

    // Description de la carte survolée/sélectionnée (aide contextuelle) :
    // largeur de la bande `foot` (plus étroite) car, sur 2 lignes, elle
    // descend sous y 390, là où les feuilles des coins resserrent le bois.
    this.descText = this.addDescText();
    // Ligne d'état : les bonus actuels (lilas), centrés par layoutBonusLine().
    this.bonusText = this.addPanelText(0, R.bonus, '', { size: 11, color: '#d8ccf5', originX: 0 });
  }

  layoutBonusLine() {
    const t = this.bonusText;
    t.setFontSize(11);
    if (t.width > CAMPFIRE_SAFE.foot.x1 - CAMPFIRE_SAFE.foot.x0 - 8) t.setFontSize(10);
    t.x = Math.round(480 - t.width / 2);
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
      // De 24 px après le bord gauche (touche de 16 px, ou 20 px peinte, +
      // jours) à 4 px du
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

    // Totem : un seul {head, body}, seulement si sa colonne est affichée
    // (CAMPFIRE_SHOW_TOTEMS). Verrouillé : mêmes cartes, inertes (le totem
    // sauvegardé reste affiché dans ses emplacements).
    const inert = this.totemsLocked;
    if (this.showTotems) {
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
    }

    // Bonus actuels (cœurs gagnés dans l'histoire, totems s'ils comptent).
    const hearts = player.maxHearts - HEART_MAX;
    const energy = player.maxEnergy - ENERGY_MAX;
    this.bonusText.setText(inert
      ? `Bonus : +${hearts} cœur(s)  •  +${energy} énergie`
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
      // Garde-fou : rien ne doit pouvoir modifier le totem pendant la démo
      // (ni quand sa colonne est cachée).
      if (this.totemsLocked || !this.showTotems) return;
      const field = kind === 'totemHead' ? 'head' : 'body';
      if (sourceSlot === 'equipped') player.equippedTotem[field] = null;
      if (zoneSlot !== 'pool') player.equippedTotem[field] = id;
      this.registry.set('equippedTotem', player.equippedTotem);
      player.recomputeTotemBonuses();
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
