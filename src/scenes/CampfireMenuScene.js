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
// - Formes de déplacement (Aigle/Loup/Pieuvre) : doivent être ÉQUIPÉES
//   pour fonctionner en jeu, pas juste débloquées (cf. Player.formEquipped
//   -- vrai choix fonctionnel, demande explicite de l'utilisateur).
// - Compétences (cf. SKILL_DEFS dans Player.js).
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
const FORM_INFO = {
  eagle: { flag: 'hasEagleForm', label: 'Aigle\n(Vol)' },
  wolf: { flag: 'hasWolfForm', label: 'Loup\n(Course)' },
  octopus: { flag: 'hasOctopusForm', label: 'Pieuvre\n(Nage)' },
};
const FORM_IDS = Object.keys(FORM_INFO);

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

    this.add.text(480, 16, 'Feu de camp', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffe9f5', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.add.text(480, 42, 'Vie et énergie restaurées — glisse une carte, ou clique dessus puis sur l\'emplacement', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#a99bd6',
    }).setOrigin(0.5, 0);

    // Liste dynamique : tout ce que rebuildUI() détruit/recrée à chaque
    // passage (cartes de pool + occupants de slot). Les rectangles de
    // SLOT eux-mêmes (les zones de dépôt) sont créés une seule fois dans
    // buildStaticSlots() -- seuls leurs OCCUPANTS (les cartes dessus) sont
    // dynamiques. Un simple TABLEAU (pas un Container) : un Container
    // imbriqué a un souci de zone de clic sur ses ENFANTS interactifs
    // (bug réel rencontré ici, cf. makeCard -- le clic/glisser ne
    // touchait jamais la carte alors qu'elle s'affichait au bon endroit),
    // donc chaque carte reste un objet de premier niveau de la scène.
    this.dynamicCards = [];
    this.dropZones = [];
    // Carte actuellement sélectionnée par CLIC (mode alternatif au
    // glisser, cf. en-tête du fichier) -- null si aucune. Surlignée en
    // jaune (cf. setCardHighlight) tant qu'elle est sélectionnée.
    this.selectedCard = null;

    // Phaser démarre un glisser dès le moindre micro-mouvement après
    // 'pointerdown' (seuil par défaut = 0 px) -- un simple clic immobile
    // (mode 2, clic-puis-clic) déclenchait quand même un 'dragstart' à
    // distance quasi nulle, ce qui absorbait le 'pointerup' dans
    // 'dragend' au lieu de 'gameobjectup' : la sélection par clic ne se
    // déclenchait alors jamais (bug réel rencontré ici). Un vrai seuil
    // laisse les glissers intentionnels fonctionner tout en rendant le
    // clic-puis-clic fiable.
    this.input.dragDistanceThreshold = 6;

    this.buildStaticSlots();
    this.wireInputEvents();
    this.rebuildUI();

    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  // Rectangles de fond + contour pour chaque emplacement (formes/
  // compétences/totem), créés une fois pour toutes -- servent aussi de
  // zones de dépôt (`setInteractive({ dropZone: true })`) ET de cibles de
  // clic (cf. wireInputEvents), identifiées par `kind`/`slotIndex` en
  // data. Une zone de dépôt par POOL (par catégorie) en plus des
  // emplacements : y déposer/cliquer une carte issue d'un emplacement la
  // déséquipe (slotIndex `'pool'`, cf. applyDrop).
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

    // -- Formes : 3 emplacements en haut, pool juste dessous.
    this.add.text(40, 68, 'Formes de déplacement (doivent être équipées pour agir en jeu)', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe9f5',
    });
    this.formSlotBoxes = [0, 1, 2].map((i) => drawSlotBox(340 + i * 100, 112, 90, 34, 'form', i));
    this.formPoolZone = drawSlotBox(480, 156, 900, 34, 'form', 'pool');
    this.formPoolZone.setFillStyle(0x0d0b1a, 0.001); // quasi invisible, juste une zone

    // -- Compétences.
    this.add.text(40, 182, 'Compétences (A/F/R en jeu)', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe9f5',
    });
    this.skillSlotBoxes = [0, 1, 2].map((i) => drawSlotBox(340 + i * 100, 226, 90, 34, 'skill', i));
    this.skillPoolZone = drawSlotBox(480, 270, 900, 34, 'skill', 'pool');
    this.skillPoolZone.setFillStyle(0x0d0b1a, 0.001);

    // -- Totem : UN SEUL emplacement tête + UN SEUL emplacement corps
    // (demande explicite, revenu sur l'idée de plusieurs totems cumulables
    // évoquée plus tôt dans la session).
    this.add.text(40, 296, 'Totem (une tête + un corps)', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe9f5',
    });
    this.totemHeadSlot = drawSlotBox(420, 332, 100, 50, 'totemHead', 'equipped');
    this.totemBodySlot = drawSlotBox(540, 332, 100, 50, 'totemBody', 'equipped');

    // Têtes (9, cf. TOTEM_HEADS) et corps (3) sur leur propre ligne pleine
    // largeur -- 9 items ne tiennent pas à côté de 3 sur une simple moitié
    // d'écran (bug réel rencontré ici avant de les séparer en 2 lignes).
    this.totemHeadPoolZone = drawSlotBox(480, 384, 900, 36, 'totemHead', 'pool');
    this.totemHeadPoolZone.setFillStyle(0x0d0b1a, 0.001);
    this.totemBodyPoolZone = drawSlotBox(480, 424, 900, 36, 'totemBody', 'pool');
    this.totemBodyPoolZone.setFillStyle(0x0d0b1a, 0.001);
    this.add.text(30, 384, 'Têtes', { fontFamily: 'sans-serif', fontSize: '11px', color: '#a99bd6' }).setOrigin(0, 0.5);
    this.add.text(30, 424, 'Corps', { fontFamily: 'sans-serif', fontSize: '11px', color: '#a99bd6' }).setOrigin(0, 0.5);

    this.bonusText = this.add.text(480, 460, '', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#8fe3b8', align: 'center',
    }).setOrigin(0.5);
    this.add.text(480, 484, 'E ou Échap pour fermer', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#ffe9f5',
    }).setOrigin(0.5);
  }

  // Une seule carte (glissable ET cliquable -- Container = fond + texte),
  // `kind`/`id` toujours renseignés ; `slotIndex` seulement si elle
  // représente l'OCCUPANT d'un emplacement (permet de le vider en cas de
  // déplacement) -- `'equipped'` pour le totem (un seul emplacement, pas
  // besoin d'index numérique), un vrai index pour formes/compétences.
  makeCard(x, y, w, h, label, kind, id, slotIndex) {
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, CARD_COLORS[kind], 1).setStrokeStyle(1, 0xffe9f5, 0.5);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'sans-serif', fontSize: '11px', color: '#ffe9f5', align: 'center',
      wordWrap: { width: w - 8 },
    }).setOrigin(0.5);
    card.add([bg, txt]);
    card.setSize(w, h);
    card.setData('kind', kind);
    card.setData('id', id);
    card.setData('slotIndex', slotIndex ?? null);
    card.setData('bg', bg); // pour le surlignage de sélection, cf. setCardHighlight
    // Un Container n'a pas de texture propre : contrairement à une
    // Image/un Sprite, `setInteractive()` sans forme explicite ne lui
    // génère PAS de zone de clic automatique à partir de setSize() --
    // sans ce rectangle (centré sur l'origine locale du container, pas
    // top-left), la carte entière était invisible aux clics/au glisser
    // (bug réel rencontré : le drop ne se produisait jamais, silencieusement).
    card.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
    this.input.setDraggable(card);
    if (card === this.selectedCardRef) this.setCardHighlight(card, true);
    this.dynamicCards.push(card);
    return card;
  }

  // Détruit toutes les cartes dynamiques et les recrée depuis l'état RÉEL
  // du joueur -- slots occupés en priorité (par-dessus leur rectangle de
  // fond), puis le reste des éléments disponibles en pool.
  rebuildUI() {
    this.dynamicCards.forEach((c) => c.destroy());
    this.dynamicCards = [];
    const player = this.player;

    // Formes.
    FORM_IDS.forEach((id) => {
      const slotIdx = player.equippedForms.indexOf(id);
      if (slotIdx !== -1) {
        const box = this.formSlotBoxes[slotIdx];
        this.makeCard(box.x, box.y, box.width, box.height, FORM_INFO[id].label, 'form', id, slotIdx);
      }
    });
    const unequippedForms = FORM_IDS.filter((id) => player[FORM_INFO[id].flag] && !player.equippedForms.includes(id));
    unequippedForms.forEach((id, i) => {
      this.makeCard(80 + i * 100, 156, 90, 30, FORM_INFO[id].label, 'form', id, null);
    });

    // Compétences.
    player.skillSlots.forEach((id, slotIdx) => {
      if (!id) return;
      const box = this.skillSlotBoxes[slotIdx];
      this.makeCard(box.x, box.y, box.width, box.height, SKILL_DEFS[id].label, 'skill', id, slotIdx);
    });
    const unequippedSkills = [...player.unlockedSkills].filter((id) => !player.skillSlots.includes(id));
    unequippedSkills.forEach((id, i) => {
      this.makeCard(80 + i * 100, 270, 90, 30, SKILL_DEFS[id].label, 'skill', id, null);
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
    // Têtes/corps toujours disponibles en pool (pas de notion de stock
    // limité, cf. Player.js) -- répétées même si déjà utilisées.
    const headStep = 80;
    const headStartX = 480 - ((TOTEM_HEADS.length - 1) * headStep) / 2;
    TOTEM_HEADS.forEach((id, i) => {
      this.makeCard(headStartX + i * headStep, 384, 70, 28, id, 'totemHead', id, null);
    });
    const bodyEntries = Object.entries(TOTEM_BODIES);
    const bodyStep = 160;
    const bodyStartX = 480 - ((bodyEntries.length - 1) * bodyStep) / 2;
    bodyEntries.forEach(([id, def], i) => {
      this.makeCard(bodyStartX + i * bodyStep, 424, 140, 28, def.label, 'totemBody', id, null);
    });

    this.bonusText.setText(
      `Bonus actuels : +${player.maxHearts - HEART_MAX} cœur(s)  •  +${player.maxEnergy - ENERGY_MAX} énergie  •  x${player.skillSizeMultiplier.toFixed(2)} taille de compétence`,
    );

    // La sélection par clic ne survit pas à une reconstruction (l'objet
    // sélectionné vient d'être détruit) -- jamais de référence pendante.
    this.selectedCard = null;
  }

  // Éclaire/éteint le contour d'une carte pour montrer qu'elle est
  // sélectionnée (mode clic-puis-clic, cf. en-tête du fichier).
  setCardHighlight(card, on) {
    const bg = card.getData('bg');
    bg.setStrokeStyle(on ? 3 : 1, on ? SELECT_HIGHLIGHT_COLOR : 0xffe9f5, on ? 1 : 0.5);
  }

  selectCard(card) {
    if (this.selectedCard === card) {
      // Cliquer à nouveau sur la carte déjà sélectionnée l'annule.
      this.setCardHighlight(card, false);
      this.selectedCard = null;
      return;
    }
    if (this.selectedCard) this.setCardHighlight(this.selectedCard, false);
    this.selectedCard = card;
    this.setCardHighlight(card, true);
  }

  wireInputEvents() {
    // -- Glisser-déposer (mode 1).
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });
    this.input.on('dragstart', (pointer, gameObject) => {
      gameObject.setDepth(10);
      // Marque le geste comme un glisser réel : le 'pointerup' qui suivra
      // la relâche ne doit alors PAS être traité comme un clic de
      // sélection (cf. plus bas) -- sans ce garde-fou, chaque glisser
      // terminait aussi par une (re)sélection fantôme de la carte.
      gameObject.setData('wasDragged', true);
    });
    this.input.on('drop', (pointer, gameObject, dropZone) => {
      this.applyDrop(gameObject, dropZone);
    });
    // Dans TOUS les cas (déposée sur une zone valide, une invalide qui n'a
    // pas donné lieu à un changement, ou nulle part) : reconstruit depuis
    // l'état réel, ce qui remet chaque carte pile à sa place si rien n'a
    // changé -- pas besoin de gérer le "retour en arrière" séparément.
    this.input.on('dragend', () => {
      this.rebuildUI();
    });

    // -- Clic-puis-clic (mode 2, demande explicite) : cliquer une carte la
    // sélectionne (surlignée), cliquer ensuite un emplacement/une zone de
    // pool compatible l'y place -- exactement le même applyDrop() que le
    // glisser, juste déclenché différemment.
    //
    // Tout passe par UN SEUL événement ('gameobjectup', déclenché au
    // relâchement) plutôt que de répartir "sélectionner" sur 'up' et
    // "placer" sur 'down' : un clic de placement fait apparaître (via
    // rebuildUI) une nouvelle carte pile sous le pointeur, donc scinder
    // la logique entre deux événements différents du MÊME clic ouvre une
    // course -- le 'up' peut retomber tantôt sur la nouvelle carte,
    // tantôt sur la zone statique en dessous, et un drapeau de
    // suppression partagé entre les deux finit désynchronisé (bug réel
    // rencontré ici : un clic de placement sur une zone laissait le
    // drapeau bloqué à `true`, ce qui avalait silencieusement la
    // sélection suivante). En ne décidant qu'au 'up', et seulement une
    // fois, ce problème disparaît structurellement.
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
    if (dropZone.getData('kind') !== kind) return; // mauvaise catégorie, ignoré (rebuildUI la remet en place)
    const zoneSlot = dropZone.getData('slotIndex');
    const sourceSlot = card.getData('slotIndex');
    const id = card.getData('id');
    const player = this.player;

    if (kind === 'form') {
      if (sourceSlot !== null) player.equippedForms[sourceSlot] = null;
      if (zoneSlot !== 'pool') player.equippedForms[zoneSlot] = id;
      this.registry.set('equippedForms', player.equippedForms);
    } else if (kind === 'skill') {
      if (sourceSlot !== null) player.skillSlots[sourceSlot] = null;
      if (zoneSlot !== 'pool') player.skillSlots[zoneSlot] = id;
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
