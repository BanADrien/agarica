// DialogueScene — overlay lancé par showDialogue() (StoryKit.js) par-dessus
// la zone, qui reste gelée (cf. isWorldFrozen). Boîte en bas de l'écran
// (bois sombre + lianes), portrait `item-portrait_<who>` si l'art existe,
// sinon médaillon coloré avec l'initiale ; texte en machine à écrire.
// E / Espace / Entrée (ou clic) : complète la ligne, puis passe à la suivante.
// Choix simples : ↑/↓ (ou Z/S) puis validation.
const DIALOGUE_CHARS_PER_SEC = 55;
const DIALOGUE_BOX = { x: 40, y: 386, w: 880, h: 134 };
const DIALOGUE_PORTRAIT_SIZE = 104;
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
  }

  create() {
    this.openedAt = this.time.now;
    const B = DIALOGUE_BOX;
    this.root = this.add.container(0, 0).setAlpha(0);
    this.tweens.add({ targets: this.root, alpha: 1, duration: 140 });

    const frame = this.add.graphics();
    if (this.textures.exists('item-dialogue_box')) {
      // Art Codex (9-slice) : le cadre peint remplace le dessin par code.
      this.root.add(this.add.nineslice(B.x + B.w / 2, B.y + B.h / 2, 'item-dialogue_box', null, B.w + 24, B.h + 24, 120, 120, 120, 120));
    } else {
      drawStoryPanel(frame, B.x, B.y, B.w, B.h, { seed: 2 });
    }
    this.root.add(frame);

    this.portraitLayer = this.add.container(0, 0);
    this.namePlate = this.add.graphics();
    this.nameText = this.add.text(0, 0, '', {
      fontFamily: STORY_UI.serif, fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0, 0.5);
    this.bodyText = this.add.text(0, 0, '', {
      fontFamily: 'sans-serif', fontSize: '18px', color: STORY_UI.text, lineSpacing: 6,
    });
    this.nextMarker = this.add.text(B.x + B.w - 22, B.y + B.h - 14, '▼', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#8fe3b8',
    }).setOrigin(0.5, 1).setVisible(false);
    this.tweens.add({ targets: this.nextMarker, y: this.nextMarker.y + 4, duration: 450, yoyo: true, repeat: -1 });
    this.choiceLayer = this.add.container(0, 0);
    this.root.add([this.portraitLayer, this.namePlate, this.nameText, this.bodyText, this.nextMarker, this.choiceLayer]);

    this.input.keyboard.on('keydown', this.onKey, this);
    this.input.on('pointerdown', () => this.confirm());
    this.showLine(0);
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
    const B = DIALOGUE_BOX;
    storyDialogueLinePose(this.scene.get(this.parentKey), line);

    this.drawPortrait(narrator ? null : (line.portrait || who), speaker.initial || name, speaker.color);
    this.drawNamePlate(narrator ? '' : name, speaker.color);

    const textX = narrator ? B.x + 34 : B.x + 34 + DIALOGUE_PORTRAIT_SIZE + 20;
    this.bodyText.setPosition(textX, B.y + 22);
    this.bodyText.setWordWrapWidth(B.x + B.w - 40 - textX);
    this.bodyText.setFontStyle(narrator ? 'italic' : '');
    this.bodyText.setColor(narrator ? '#e8d9ff' : STORY_UI.text);

    this.clearChoices();
    this.fullText = line.text || '';
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

  drawPortrait(portraitId, name, color) {
    this.portraitLayer.removeAll(true);
    if (!portraitId) return;
    const B = DIALOGUE_BOX;
    const size = DIALOGUE_PORTRAIT_SIZE;
    const cx = B.x + 28 + size / 2;
    const cy = B.y + B.h / 2;
    const g = this.add.graphics();
    const key = `item-portrait_${portraitId}`;
    if (this.textures.exists(key)) {
      g.fillStyle(STORY_UI.woodDark, 1);
      g.fillRoundedRect(cx - size / 2 - 4, cy - size / 2 - 4, size + 8, size + 8, 12);
      const img = this.add.image(cx, cy, key);
      img.setScale(size / Math.max(img.width, img.height));
      const ring = this.add.graphics();
      ring.lineStyle(3, color, 1);
      ring.strokeRoundedRect(cx - size / 2 - 2, cy - size / 2 - 2, size + 4, size + 4, 11);
      this.portraitLayer.add([g, img, ring]);
      return;
    }
    // Médaillon : anneau bois, disque couleur du personnage, initiale.
    const r = size / 2 - 4;
    g.fillStyle(STORY_UI.woodDark, 1);
    g.fillCircle(cx, cy, r + 6);
    g.fillStyle(Phaser.Display.Color.ValueToColor(color).darken(45).color, 1);
    g.fillCircle(cx, cy, r);
    g.fillStyle(color, 1);
    g.fillCircle(cx, cy - 3, r - 6);
    g.lineStyle(2, STORY_UI.vineLight, 0.7);
    g.strokeCircle(cx, cy, r + 3);
    const initial = this.add.text(cx, cy - 3, (name || '?').charAt(0).toUpperCase(), {
      fontFamily: STORY_UI.serif, fontSize: '46px', fontStyle: 'bold', color: '#15101f',
    }).setOrigin(0.5);
    this.portraitLayer.add([g, initial]);
  }

  drawNamePlate(name, color) {
    this.namePlate.clear();
    this.nameText.setText(name);
    if (!name) return;
    const B = DIALOGUE_BOX;
    const x = B.x + 24;
    const y = B.y - 12;
    const w = this.nameText.width + 28;
    this.namePlate.fillStyle(STORY_UI.woodDark, 1);
    this.namePlate.fillRoundedRect(x - 3, y - 16, w + 6, 32, 9);
    this.namePlate.fillStyle(STORY_UI.wood, 1);
    this.namePlate.fillRoundedRect(x, y - 13, w, 26, 7);
    this.namePlate.fillStyle(color, 1);
    this.namePlate.fillCircle(x + 8, y, 3);
    this.nameText.setPosition(x + 16, y).setColor(colorToHex(color));
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

  showChoices(choices) {
    const B = DIALOGUE_BOX;
    const w = 330;
    const rowH = 32;
    const h = choices.length * rowH + 18;
    const x = B.x + B.w - w - 10;
    const y = B.y - h - 22;
    const g = this.add.graphics();
    drawStoryPanel(g, x, y, w, h, { vines: false });
    this.choiceLayer.add(g);
    this.choiceItems = choices.map((c, i) => {
      const t = this.add.text(x + 18, y + 10 + i * rowH + rowH / 2, c.text, {
        fontFamily: 'sans-serif', fontSize: '16px', color: STORY_UI.text,
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
