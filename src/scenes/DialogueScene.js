// DialogueScene — overlay lancé par showDialogue() (StoryKit.js) par-dessus
// la zone, qui reste gelée (cf. isWorldFrozen). Boîte : cadre Codex
// `item-dialogue_box` composé SANS étirement (addStoryVineFrame), portrait
// `item-portrait_<who>` dans un médaillon rond à gauche, DANS le cadre,
// plaque de nom posée sur la liane du haut, texte en machine à écrire sur les
// planches. Sans l'art : panneau dessiné (drawStoryPanel), médaillon coloré
// avec l'initiale. Narrateur : ni portrait ni nom, texte en italique.
// E / Espace / Entrée (ou clic) : complète la ligne, puis passe à la suivante.
// Choix simples : ↑/↓ (ou Z/S) puis validation.
const DIALOGUE_CHARS_PER_SEC = 55;
// Bords EXTÉRIEURS des lianes ; feuilles et champignons débordent de ~14 px.
const DIALOGUE_BOX = { x: 30, y: 374, w: 900, h: 150 };
// En haut : sous les cœurs du HUD (sinon ils dépassaient derrière le cadre).
const DIALOGUE_BOX_TOP_Y = 52;
// Échelle de l'art (1692x624) : lianes de ~17 px, champignons de ~40 px.
const DIALOGUE_FRAME_SCALE = 0.3;
const DIALOGUE_MEDALLION_R = 48;
// Visage de chaque portrait Codex (fraction de l'image 512x512), placé au
// centre du médaillon ; zoom : le médaillon montre ~3/4 de l'image.
const DIALOGUE_PORTRAIT_ZOOM = 1.3;
const DIALOGUE_PORTRAIT_FOCUS = {
  agarica: [0.52, 0.42], xara: [0.62, 0.5], amanite: [0.62, 0.42], pere_chef: [0.56, 0.36],
  geralt: [0.6, 0.45], morgat: [0.58, 0.42], kainati: [0.55, 0.45], ghilt: [0.48, 0.42],
};
const DIALOGUE_CHOICE_ROW_H = 34;
// Ignore les appuis juste après l'ouverture (touche encore enfoncée).
const DIALOGUE_OPEN_GUARD_MS = 150;

class DialogueScene extends Phaser.Scene {
  constructor() {
    super('DialogueScene');
  }

  init(data) {
    this.lines = data.lines || [];
    this.onDone = data.onDone;
    this.parentKey = data.parentKey;
    this.index = -1;
    this.choicesMade = [];
    this.lastChoice = -1;
    this.finished = false;
    this.typing = false;
    this.choiceItems = null;
    this.portraitMask = null;
  }

  create() {
    this.openedAt = this.time.now;
    this.box = this.computeBox();
    const B = this.box;
    this.root = this.add.container(0, 0).setAlpha(0);
    this.tweens.add({ targets: this.root, alpha: 1, duration: 140 });

    const framed = addStoryVineFrame(this, B.x, B.y, B.w, B.h, { scale: DIALOGUE_FRAME_SCALE, container: this.root });
    if (framed) {
      this.inner = framed.inner;
    } else {
      const g = this.add.graphics();
      drawStoryPanel(g, B.x, B.y, B.w, B.h, { seed: 2 });
      this.root.add(g);
      this.inner = { x: B.x + 6, y: B.y + 6, w: B.w - 12, h: B.h - 12 };
    }

    this.portraitLayer = this.add.container(0, 0);
    this.namePlate = this.add.graphics();
    this.nameText = this.add.text(0, 0, '', {
      fontFamily: STORY_UI.serif, fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#120a0e', strokeThickness: 3, padding: { x: 2, y: 2 },
    }).setOrigin(0, 0.5);
    this.bodyText = this.add.text(0, 0, '', {
      fontFamily: 'sans-serif', fontSize: '18px', color: STORY_UI.text, lineSpacing: 6,
      shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true },
    });
    const I = this.inner;
    this.nextMarker = this.add.text(I.x + I.w - 18, I.y + I.h - 8, '▼', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#8fe3b8',
    }).setOrigin(0.5, 1).setVisible(false);
    this.tweens.add({ targets: this.nextMarker, y: this.nextMarker.y + 4, duration: 450, yoyo: true, repeat: -1 });
    this.choiceLayer = this.add.container(0, 0);
    this.root.add([this.portraitLayer, this.namePlate, this.nameText, this.bodyText, this.nextMarker, this.choiceLayer]);

    this.input.keyboard.on('keydown', this.onKey, this);
    this.input.on('pointerdown', () => this.confirm());
    this.events.once('shutdown', () => this.clearPortraitMask());
    this.showLine(0);
  }

  // Boîte en HAUT de l'écran quand Agarica (et donc les PNJ à qui elle parle)
  // se tient au sol, dans le bas de l'écran : en bas, la boîte cachait les
  // personnages qui parlent (et leurs anims talk). Agent Histoire, 2026-10-06.
  computeBox() {
    const parent = this.parentKey && this.scene.get(this.parentKey);
    const p = parent && parent.player;
    const cam = parent && parent.cameras && parent.cameras.main;
    if (!p || !cam || !p.active) return { ...DIALOGUE_BOX };
    const feetScreenY = (p.y - cam.worldView.y) * cam.zoom;
    const hidden = feetScreenY > DIALOGUE_BOX.y - 4 && feetScreenY - 90 < DIALOGUE_BOX.y + DIALOGUE_BOX.h;
    return hidden ? { ...DIALOGUE_BOX, y: DIALOGUE_BOX_TOP_Y, top: true } : { ...DIALOGUE_BOX };
  }

  onKey(event) {
    if (event.repeat || this.time.now - this.openedAt < DIALOGUE_OPEN_GUARD_MS) return;
    const k = event.key.toLowerCase();
    if (k === 'e' || k === ' ' || k === 'enter') this.confirm();
    else if (this.choiceItems && (k === 'arrowup' || k === 'z')) this.moveChoice(-1);
    else if (this.choiceItems && (k === 'arrowdown' || k === 's')) this.moveChoice(1);
  }

  showLine(i) {
    if (i >= this.lines.length || i < 0) {
      this.finish();
      return;
    }
    this.index = i;
    const line = this.lines[i];
    const who = line.who || 'narrateur';
    const speaker = SPEAKERS[who] || { name: who, color: 0xa99bd6 };
    const name = line.name !== undefined ? line.name : speaker.name;
    const narrator = who === 'narrateur';
    const I = this.inner;
    storyDialogueLinePose(this.scene.get(this.parentKey), line);

    const R = DIALOGUE_MEDALLION_R;
    const medallionX = I.x + 16 + R;
    this.drawPortrait(narrator ? null : (line.portrait || speaker.portrait || who), speaker, name, medallionX, I.y + I.h / 2);
    const textX = narrator ? I.x + 40 : medallionX + R + 26;
    this.drawNamePlate(narrator ? '' : name, speaker.color, textX - 12);

    this.bodyText.setWordWrapWidth(I.x + I.w - 34 - textX);
    this.bodyText.setFontStyle(narrator ? 'italic' : '');
    this.bodyText.setColor(narrator ? '#e8d9ff' : STORY_UI.text);
    this.fullText = line.text || '';
    // Texte centré verticalement sur les planches : hauteur mesurée sur la
    // ligne complète avant la machine à écrire (la boîte ne « saute » pas).
    this.bodyText.setText(this.fullText);
    const textY = Math.max(I.y + 12, I.y + (I.h - this.bodyText.height) / 2);
    this.bodyText.setPosition(textX, Math.round(textY));

    this.clearChoices();
    this.shown = 0;
    this.bodyText.setText('');
    this.nextMarker.setVisible(false);
    this.typing = true;
    if (this.typeEvent) this.typeEvent.remove();
    this.typeEvent = this.time.addEvent({
      delay: 1000 / DIALOGUE_CHARS_PER_SEC,
      loop: true,
      callback: () => {
        this.shown += 1;
        this.bodyText.setText(this.fullText.slice(0, this.shown));
        if (this.shown >= this.fullText.length) this.completeLine();
      },
    });
  }

  clearPortraitMask() {
    if (this.portraitMask) this.portraitMask.destroy();
    this.portraitMask = null;
  }

  // Médaillon : anneau de bois sombre, liseré couleur du personnage ; dedans
  // le portrait Codex (découpé en rond) ou l'initiale.
  drawPortrait(portraitId, speaker, name, cx, cy) {
    this.portraitLayer.removeAll(true);
    this.clearPortraitMask();
    if (!portraitId) return;
    const R = DIALOGUE_MEDALLION_R;
    const color = speaker.color;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillCircle(cx + 2, cy + 3, R + 7);
    g.fillStyle(STORY_UI.woodDark, 1);
    g.fillCircle(cx, cy, R + 7);
    g.fillStyle(0x5a3a26, 1);
    g.fillCircle(cx, cy, R + 4);
    g.fillStyle(STORY_UI.nightSoft, 1);
    g.fillCircle(cx, cy, R);
    this.portraitLayer.add(g);

    const key = `item-portrait_${portraitId}`;
    if (this.textures.exists(key)) {
      const img = this.add.image(cx, cy, key);
      const [fx, fy] = DIALOGUE_PORTRAIT_FOCUS[portraitId] || [0.5, 0.45];
      // Le visage au centre, sans jamais laisser voir le bord de l'image.
      const half = 0.5 / DIALOGUE_PORTRAIT_ZOOM;
      img.setOrigin(Phaser.Math.Clamp(fx, half, 1 - half), Phaser.Math.Clamp(fy, half, 1 - half));
      img.setScale((2 * R * DIALOGUE_PORTRAIT_ZOOM) / Math.max(img.width, img.height));
      if (speaker.portraitTint) img.setTint(speaker.portraitTint);
      const shape = this.make.graphics({}, false);
      shape.fillStyle(0xffffff, 1);
      shape.fillCircle(cx, cy, R);
      img.setMask(shape.createGeometryMask());
      this.portraitMask = shape;
      this.portraitLayer.add(img);
    } else {
      // Pas de portrait (habitant, garde, Clak…) : disque couleur + initiale.
      const d = this.add.graphics();
      d.fillStyle(Phaser.Display.Color.ValueToColor(color).darken(45).color, 1);
      d.fillCircle(cx, cy, R - 2);
      d.fillStyle(color, 1);
      d.fillCircle(cx, cy - 3, R - 8);
      const initial = this.add.text(cx, cy - 3, (speaker.initial || name || '?').charAt(0).toUpperCase(), {
        fontFamily: STORY_UI.serif, fontSize: '44px', fontStyle: 'bold', color: '#15101f',
      }).setOrigin(0.5);
      this.portraitLayer.add([d, initial]);
    }

    const ring = this.add.graphics();
    ring.lineStyle(3, color, 1);
    ring.strokeCircle(cx, cy, R + 1.5);
    ring.lineStyle(1.5, STORY_UI.vineLight, 0.45);
    ring.strokeCircle(cx, cy, R + 5.5);
    this.portraitLayer.add(ring);
  }

  // Plaque de nom : petite planche posée à cheval sur la liane du haut,
  // alignée sur le début du texte.
  drawNamePlate(name, color, x) {
    this.namePlate.clear();
    this.nameText.setText(name);
    if (!name) return;
    const y = this.box.y + 6;
    const w = this.nameText.width + 30;
    const h = 28;
    const g = this.namePlate;
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(x + 2, y - h / 2 + 3, w, h, 8);
    g.fillStyle(STORY_UI.woodDark, 1);
    g.fillRoundedRect(x, y - h / 2, w, h, 8);
    g.fillStyle(0x3d271c, 1);
    g.fillRoundedRect(x + 2, y - h / 2 + 2, w - 4, h - 4, 6);
    g.lineStyle(1, 0x6b4a36, 0.9);
    g.lineBetween(x + 8, y - h / 2 + 4, x + w - 8, y - h / 2 + 4);
    g.lineStyle(1.5, color, 0.9);
    g.strokeRoundedRect(x + 2, y - h / 2 + 2, w - 4, h - 4, 6);
    g.fillStyle(color, 1);
    g.fillCircle(x + 10, y, 3);
    this.nameText.setPosition(x + 17, y).setColor(colorToHex(color));
  }

  completeLine() {
    if (this.typeEvent) this.typeEvent.remove();
    this.typeEvent = null;
    this.typing = false;
    this.bodyText.setText(this.fullText);
    const line = this.lines[this.index];
    if (line.choices && line.choices.length) this.showChoices(line.choices);
    else this.nextMarker.setVisible(true);
  }

  // Choix : petit cadre de lianes (même art, même échelle) au-dessus de la
  // boîte (sous la boîte quand elle est en haut de l'écran), à droite.
  showChoices(choices) {
    const B = this.box;
    const w = 380;
    const h = choices.length * DIALOGUE_CHOICE_ROW_H + 30;
    const x = B.x + B.w - w - 24;
    const y = B.top ? B.y + B.h + 26 : B.y - h - 26;
    const framed = addStoryVineFrame(this, x, y, w, h, { scale: DIALOGUE_FRAME_SCALE, container: this.choiceLayer });
    let I = framed && framed.inner;
    if (!framed) {
      const g = this.add.graphics();
      drawStoryPanel(g, x, y, w, h, { vines: false });
      this.choiceLayer.add(g);
      I = { x: x + 6, y: y + 6, w: w - 12, h: h - 12 };
    }
    this.choiceHighlight = this.add.graphics();
    this.choiceLayer.add(this.choiceHighlight);
    const top = I.y + (I.h - choices.length * DIALOGUE_CHOICE_ROW_H) / 2;
    this.choiceRows = { x: I.x + 8, w: I.w - 16, top };
    this.choiceItems = choices.map((c, i) => {
      const t = this.add.text(I.x + 22, top + i * DIALOGUE_CHOICE_ROW_H + DIALOGUE_CHOICE_ROW_H / 2, c.text, {
        fontFamily: 'sans-serif', fontSize: '16px', color: STORY_UI.text,
        shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true },
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.selectChoice(i));
      t.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); this.selectChoice(i); this.pickChoice(i); });
      this.choiceLayer.add(t);
      return t;
    });
    this.selectChoice(0);
  }

  selectChoice(i) {
    this.choiceIndex = i;
    const r = this.choiceRows;
    const g = this.choiceHighlight;
    g.clear();
    g.fillStyle(STORY_UI.pink, 0.14);
    g.fillRoundedRect(r.x, r.top + i * DIALOGUE_CHOICE_ROW_H + 2, r.w, DIALOGUE_CHOICE_ROW_H - 4, 8);
    g.lineStyle(1.5, STORY_UI.pink, 0.55);
    g.strokeRoundedRect(r.x, r.top + i * DIALOGUE_CHOICE_ROW_H + 2, r.w, DIALOGUE_CHOICE_ROW_H - 4, 8);
    this.choiceItems.forEach((t, k) => {
      const c = this.lines[this.index].choices[k];
      t.setText(`${k === i ? '▸ ' : '   '}${c.text}`);
      t.setColor(k === i ? '#ff9fc9' : STORY_UI.text);
    });
  }

  moveChoice(d) {
    const n = this.choiceItems.length;
    this.selectChoice((this.choiceIndex + d + n) % n);
  }

  clearChoices() {
    this.choiceLayer.removeAll(true);
    this.choiceItems = null;
  }

  pickChoice(i) {
    const choice = this.lines[this.index].choices[i];
    this.lastChoice = i;
    this.choicesMade.push(i);
    if (choice.set) storySet(choice.set);
    this.clearChoices();
    if (typeof choice.goto === 'number') this.showLine(choice.goto);
    else if (choice.goto === 'end') this.finish();
    else if (typeof choice.goto === 'string' && DIALOGUES[choice.goto] !== undefined) {
      this.lines = resolveDialogueLines(this.scene.get(this.parentKey) || this, choice.goto);
      this.showLine(0);
    } else this.showLine(this.index + 1);
  }

  confirm() {
    if (this.finished || this.time.now - this.openedAt < DIALOGUE_OPEN_GUARD_MS) return;
    if (this.typing) {
      this.completeLine();
      return;
    }
    if (this.choiceItems) {
      this.pickChoice(this.choiceIndex);
      return;
    }
    this.showLine(this.index + 1);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    const cb = this.onDone;
    this.onDone = null;
    this.input.keyboard.off('keydown', this.onKey, this);
    this.scene.stop();
    if (cb) cb({ lastChoice: this.lastChoice, choices: this.choicesMade });
  }
}
