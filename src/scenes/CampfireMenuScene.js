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
//   totem au total"), cf. Player.equippedTotem.
//
// Aucun art pour l'instant (formes/compétences/totems) : chaque carte est
// un rectangle + texte coloré par catégorie. `rebuildUI()` détruit et
// recrée TOUT à chaque changement plutôt que de patcher incrémentalement
// -- ça gère gratuitement le "retour à sa place" d'un geste refusé/annulé
// (glisser OU clic) : si l'état du joueur n'a pas changé, rebuildUI()
// replace chaque carte exactement là où elle était avant.
// Emplacements de formes (démo histoire) : SOL = loup, AÉRIEN = singe OU
// aigle (exclusifs), EAU = pieuvre. L'équipement passe par
// Player.equipForm/unequipForm (qui tiennent `equippedForms` + `airForm`).
const FORM_INFO = {
  wolf: { flag: 'hasWolfForm', label: 'Loup', slot: 'ground', icon: ['form-icon-wolf'], desc: 'Loup (sol) : course rapide (Maj / double-tap), perçoit les pistes cachées.' },
  monkey: { flag: 'hasMonkeyForm', label: 'Singe', slot: 'air', icon: ['form-icon-monkey', 'item-form_icone_singe'], desc: 'Singe (aérien) : donne le double saut (court), s\'accroche aux lianes (gauche/droite pour se balancer, Saut pour lâcher).' },
  eagle: { flag: 'hasEagleForm', label: 'Aigle', slot: 'air', icon: ['form-icon-eagle'], desc: 'Aigle (aérien) : donne le double saut (plus haut) puis le plané, porté par les courants d\'air (S = piqué).' },
  octopus: { flag: 'hasOctopusForm', label: 'Pieuvre', slot: 'water', icon: ['form-icon-octopus'], desc: 'Pieuvre (eau) : nage libre.' },
};
const FORM_IDS = Object.keys(FORM_INFO);
const FORM_SLOTS = [
  { slot: 'ground', label: 'Sol', x: 330 },
  { slot: 'air', label: 'Aérien', x: 480 },
  { slot: 'water', label: 'Eau', x: 630 },
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

const CARD_COLORS = {
  form: 0x3a5a8c,
  skill: 0x8c4a3a,
  totemHead: 0x6a4a8c,
  totemBody: 0x3f7a52,
};
const SLOT_EMPTY_COLOR = 0x241c3d;
const SELECT_HIGHLIGHT_COLOR = 0xffe066;

class CampfireMenuScene extends Phaser.Scene {
  constructor() {
    super('CampfireMenuScene');
  }

  init(data) {
    this.player = data.player;
  }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.add.rectangle(480, 270, 960, 540, 0x0d0b1a, 0.82);
    // Panneau peint (ITEM_MANIFEST `ui_feu_camp`, assets/items/firecamp_menu/
    // interface.png) s'il est chargé ; sinon le voile sombre seul.
    if (this.textures.exists('item-ui_feu_camp')) {
      this.add.image(480, 270, 'item-ui_feu_camp').setDisplaySize(950, 534).setAlpha(0.95);
    }

    this.add.text(480, 12, 'Feu de camp', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffe9f5', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.add.text(480, 38, 'Vie et énergie restaurées — glisse une carte sur un emplacement, ou clique-la puis clique l\'emplacement. Remets-la en bas pour la retirer.', {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#a99bd6',
    }).setOrigin(0.5, 0);

    // Cf. historique : un simple TABLEAU de cartes de premier niveau (un
    // Container imbriqué cassait la zone de clic de ses enfants).
    this.dynamicCards = [];
    this.dropZones = [];
    this.selectedCard = null;
    // Seuil de glisser : un clic immobile ne doit pas devenir un 'dragstart'.
    this.input.dragDistanceThreshold = 6;

    this.buildStaticSlots();
    this.wireInputEvents();
    this.rebuildUI();

    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  // Rectangles d'emplacement, créés une fois : zones de dépôt ET cibles de
  // clic (`kind`/`slotIndex` en data). Une zone « pool » par catégorie pour
  // déséquiper (slotIndex 'pool').
  buildStaticSlots() {
    const drawSlotBox = (x, y, w, h, kind, slotIndex) => {
      const box = this.add.rectangle(x, y, w, h, SLOT_EMPTY_COLOR, 1)
        .setStrokeStyle(2, 0x8fe3b8, 0.7);
      box.setData('kind', kind);
      box.setData('slotIndex', slotIndex);
      box.setInteractive({ dropZone: true });
      this.dropZones.push(box);
      return box;
    };
    const label = (x, y, text) => this.add.text(x, y, text, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe9f5',
    });
    const small = { fontFamily: 'sans-serif', fontSize: '11px', color: '#a99bd6' };

    // -- Formes : 3 emplacements typés.
    label(40, 60, 'Formes');
    this.formSlotBoxes = {};
    for (const fs of FORM_SLOTS) {
      this.formSlotBoxes[fs.slot] = drawSlotBox(fs.x, 104, 130, 50, 'form', fs.slot);
      const sub = fs.slot === 'air' ? 'Aérien (Singe OU Aigle)' : fs.label;
      this.add.text(fs.x, 72, sub, small).setOrigin(0.5);
    }
    this.formPoolZone = drawSlotBox(480, 158, 900, 40, 'form', 'pool');
    this.formPoolZone.setFillStyle(0x0d0b1a, 0.001);

    // -- Compétences.
    label(40, 184, 'Compétences (touches A / F / R)');
    this.skillSlotBoxes = [0, 1, 2].map((i) => drawSlotBox(350 + i * 130, 222, 110, 40, 'skill', i));
    ['A', 'F', 'R'].forEach((k, i) => {
      this.add.text(350 + i * 130 - 65, 222, k, { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffe066', fontStyle: 'bold' }).setOrigin(0.5);
    });
    this.skillPoolZone = drawSlotBox(480, 268, 900, 36, 'skill', 'pool');
    this.skillPoolZone.setFillStyle(0x0d0b1a, 0.001);

    // -- Totem : une tête + un corps.
    label(40, 294, 'Totem (une tête + un corps)');
    this.totemHeadSlot = drawSlotBox(420, 326, 100, 40, 'totemHead', 'equipped');
    this.totemBodySlot = drawSlotBox(540, 326, 100, 40, 'totemBody', 'equipped');
    this.totemHeadPoolZone = drawSlotBox(480, 372, 900, 34, 'totemHead', 'pool');
    this.totemHeadPoolZone.setFillStyle(0x0d0b1a, 0.001);
    this.totemBodyPoolZone = drawSlotBox(480, 410, 900, 34, 'totemBody', 'pool');
    this.totemBodyPoolZone.setFillStyle(0x0d0b1a, 0.001);
    this.add.text(30, 372, 'Têtes', small).setOrigin(0, 0.5);
    this.add.text(30, 410, 'Corps', small).setOrigin(0, 0.5);

    // Description de la carte survolée/sélectionnée (aide contextuelle).
    this.descText = this.add.text(480, 444, '', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#ffe9f5', align: 'center', wordWrap: { width: 860 },
    }).setOrigin(0.5);
    this.bonusText = this.add.text(480, 472, '', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#8fe3b8', align: 'center',
    }).setOrigin(0.5);
    this.add.text(480, 500, 'E ou Échap pour fermer', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#ffe9f5',
    }).setOrigin(0.5);
  }

  // Icône d'une carte : 1re texture existante parmi `keys`, sinon pastille
  // colorée avec l'initiale (placeholder tant que l'art n'existe pas).
  addCardIcon(card, keys, size, fallbackColor, letter) {
    const key = (keys || []).find((k) => this.textures.exists(k));
    const ix = -card.width / 2 + size / 2 + 5;
    if (key) {
      const img = this.add.image(ix, 0, key);
      img.setScale(size / Math.max(img.width, img.height));
      card.add(img);
    } else {
      card.add(this.add.circle(ix, 0, size / 2, fallbackColor, 1).setStrokeStyle(1, 0xffe9f5, 0.7));
      card.add(this.add.text(ix, 0, letter, { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
    }
    return size + 8;
  }

  // Une carte glissable ET cliquable (Container = fond + icône + texte).
  // `slotIndex` seulement si elle occupe un emplacement.
  makeCard(x, y, w, h, label, kind, id, slotIndex, { iconKeys = null, iconColor = 0x555555, desc = '' } = {}) {
    const card = this.add.container(x, y);
    card.setSize(w, h);
    const bg = this.add.rectangle(0, 0, w, h, CARD_COLORS[kind], 1).setStrokeStyle(1, 0xffe9f5, 0.5);
    card.add(bg);
    let textX = 0;
    let textW = w - 8;
    if (iconKeys) {
      const used = this.addCardIcon(card, iconKeys, Math.min(h - 8, 32), iconColor, label.charAt(0));
      textX = used / 2;
      textW = w - used - 6;
    }
    const txt = this.add.text(textX, 0, label, {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#ffe9f5', align: 'center',
      wordWrap: { width: textW },
    }).setOrigin(0.5);
    // Libellé long à côté d'une icône (« Ours — Fracas au sol ») : plus petit
    // plutôt que de déborder de la carte.
    if (txt.height > h - 2) txt.setFontSize(9).setLineSpacing(-2);
    card.add(txt);
    card.setData('kind', kind);
    card.setData('id', id);
    card.setData('slotIndex', slotIndex ?? null);
    card.setData('bg', bg);
    card.setData('desc', desc);
    // Zone de clic explicite (un Container n'en génère pas tout seul).
    card.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    this.input.setDraggable(card);
    card.on('pointerover', () => { if (desc) this.descText.setText(desc); });
    this.dynamicCards.push(card);
    return card;
  }

  formIsEquipped(id) {
    const player = this.player;
    if (FORM_INFO[id].slot === 'air') return player.airForm === id;
    return player.equippedForms.includes(id);
  }

  // Détruit et recrée toutes les cartes depuis l'état RÉEL du joueur.
  rebuildUI() {
    this.dynamicCards.forEach((c) => c.destroy());
    this.dynamicCards = [];
    const player = this.player;

    // Formes : occupants des emplacements, puis formes débloquées libres.
    const unlocked = FORM_IDS.filter((id) => player[FORM_INFO[id].flag]);
    const pool = [];
    for (const id of unlocked) {
      const info = FORM_INFO[id];
      const opts = { iconKeys: info.icon, iconColor: CARD_COLORS.form, desc: info.desc };
      if (this.formIsEquipped(id)) {
        const box = this.formSlotBoxes[info.slot];
        this.makeCard(box.x, box.y, box.width - 6, box.height - 6, info.label, 'form', id, info.slot, opts);
      } else {
        pool.push([id, opts]);
      }
    }
    const formStep = 120;
    const formStartX = 480 - ((pool.length - 1) * formStep) / 2;
    pool.forEach(([id, opts], i) => {
      this.makeCard(formStartX + i * formStep, 158, 110, 36, FORM_INFO[id].label, 'form', id, null, opts);
    });

    // Compétences.
    const skillOpts = (id) => ({
      iconKeys: [`item-${SKILL_ICON_ITEM[id] || `skill_icone_${id}`}`], iconColor: SKILL_DEFS[id].hudColor || CARD_COLORS.skill,
      desc: SKILL_INFO_DESC[id] || SKILL_DEFS[id].label,
    });
    player.skillSlots.forEach((id, slotIdx) => {
      if (!id || !SKILL_DEFS[id]) return;
      const box = this.skillSlotBoxes[slotIdx];
      this.makeCard(box.x, box.y, box.width - 6, box.height - 6, SKILL_DEFS[id].label, 'skill', id, slotIdx, skillOpts(id));
    });
    const unequippedSkills = [...player.unlockedSkills].filter((id) => SKILL_DEFS[id] && !player.skillSlots.includes(id));
    const skillStep = 125;
    const skillStartX = 480 - ((unequippedSkills.length - 1) * skillStep) / 2;
    unequippedSkills.forEach((id, i) => {
      this.makeCard(skillStartX + i * skillStep, 268, 115, 32, SKILL_DEFS[id].label, 'skill', id, null, skillOpts(id));
    });

    // Totem : un seul {head, body}.
    if (player.equippedTotem.head) {
      const box = this.totemHeadSlot;
      this.makeCard(box.x, box.y, box.width, box.height, player.equippedTotem.head, 'totemHead', player.equippedTotem.head, 'equipped');
    }
    if (player.equippedTotem.body) {
      const box = this.totemBodySlot;
      const bodyId = player.equippedTotem.body;
      this.makeCard(box.x, box.y, box.width, box.height, TOTEM_BODIES[bodyId].label, 'totemBody', bodyId, 'equipped');
    }
    // Têtes/corps toujours disponibles en pool (pas de stock limité).
    const headStep = 80;
    const headStartX = 480 - ((TOTEM_HEADS.length - 1) * headStep) / 2;
    TOTEM_HEADS.forEach((id, i) => {
      this.makeCard(headStartX + i * headStep, 372, 70, 28, id, 'totemHead', id, null);
    });
    const bodyEntries = Object.entries(TOTEM_BODIES);
    const bodyStep = 160;
    const bodyStartX = 480 - ((bodyEntries.length - 1) * bodyStep) / 2;
    bodyEntries.forEach(([id, def], i) => {
      this.makeCard(bodyStartX + i * bodyStep, 410, 140, 28, def.label, 'totemBody', id, null);
    });

    this.bonusText.setText(
      `Bonus actuels : +${player.maxHearts - HEART_MAX} cœur(s)  •  +${player.maxEnergy - ENERGY_MAX} énergie  •  x${player.skillSizeMultiplier.toFixed(2)} taille de compétence`,
    );
    if (!this.descText.text) {
      // Rappel (règle de saut) : seule une forme aérienne équipée donne le double saut.
      this.descText.setText(unlocked.length
        ? 'Survole une carte pour voir ce qu\'elle fait. Sans forme aérienne équipée : un seul saut.'
        : 'Aucune forme débloquée pour l\'instant.');
    }
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
    if (card.getData('desc')) this.descText.setText(card.getData('desc'));
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
