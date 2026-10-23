// TitleScene — écran-titre et menu principal.
// - Au lancement (depuis BootScene, `{fromBoot: true}`) : logo + « Appuie sur
//   une touche », puis le menu glisse en place.
// - Menu : Continuer (résumé de la sauvegarde à droite) / Nouvelle partie
//   (confirmation si sauvegarde) / Chapitres / Options / Contrôles / Crédits.
// - Chapitres : reprendre au début d'une grande région déjà atteinte (toutes
//   après la fin de la démo ; code « lune » tapé sur l'écran-titre = tout
//   débloquer, pour le développement). Cf. MENU_CHAPTERS dans MenuKit.js.
// - Zones de test : sous-menu discret, depuis Options.
// Clavier (flèches / ZQSD + Entrée / Espace / E, Échap = retour) et souris.
const TITLE_SECRET_CODE = 'lune';

// « La forêt sombre » → « Forêt sombre » (vignettes étroites).
function menuShortName(name) {
  const n = name.replace(/^(Le |La )/, '');
  return n.charAt(0).toUpperCase() + n.slice(1);
}

class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(data) {
    const { width, height } = this.scale;
    // Instance réutilisée à chaque retour au titre : cf. buildLevelFromData.
    this.__transitioningAway = false;
    this.menuModal = null;
    this.menuChildOpen = null;
    this.menuChildClosedAt = 0;
    this.input.keyboard.enabled = true;
    this.secretBuffer = '';
    menuNoteSaveProgress();
    fadeInScene(this);

    addMoonlitDecor(this, width, height, width);
    addCaveCeiling(this, width);
    const veil = this.add.graphics();
    veil.fillGradientStyle(0x0d0b1a, 0x0d0b1a, 0x0d0b1a, 0x0d0b1a, 0.2, 0.2, 0.7, 0.7);
    veil.fillRect(0, 0, width, height);
    // Halo de lune derrière le logo.
    const halo = this.add.graphics();
    for (let r = 220; r > 0; r -= 22) {
      halo.fillStyle(0xc9b8f0, 0.018);
      halo.fillCircle(width / 2, 120, r);
    }
    menuAddFireflies(this, 22);

    this.buildCharacters(width, height);
    this.buildLogo(width);

    this.footer = this.add.text(width - 14, height - 10, TITLE_FOOTER, {
      fontFamily: STORY_UI.serif, fontSize: '12px', fontStyle: 'italic', color: '#a99bd6', padding: { x: 4, y: 3 },
    }).setOrigin(1, 1).setDepth(1100).setAlpha(0.8);
    this.hint = this.add.text(width / 2, height - 22, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: STORY_UI.textSoft,
      backgroundColor: '#15101fcc', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setDepth(1100);
    this.toastText = this.add.text(width / 2, 30, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#8fe3b8', backgroundColor: '#15101fdd', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(3100).setAlpha(0);

    this.layers = {};
    this.openedAt = this.time.now;
    this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.onKey, this));

    if (data && data.fromBoot) this.showSplash();
    else this.showMainMenu({ animate: false });
  }

  // --- Décor ---------------------------------------------------------------

  // Agarica et Xara, à gauche, regardent le menu.
  buildCharacters(width, height) {
    const groundY = height - 76;
    this.characters = this.add.container(0, 0);
    if (this.textures.exists('agarica-idle-0')) {
      if (!this.anims.exists('title-agarica-idle')) {
        const frames = [];
        for (let i = 0; this.textures.exists(`agarica-idle-${i}`); i++) frames.push({ key: `agarica-idle-${i}` });
        this.anims.create({ key: 'title-agarica-idle', frames, frameRate: 6, repeat: -1 });
      }
      const a = this.add.sprite(150, groundY, 'agarica-idle-0').setOrigin(0.5, 1)
        .setScale((typeof HUMAN_SCALE === 'number' ? HUMAN_SCALE : 0.24) * 1.25).setFlipX(true);
      a.play('title-agarica-idle');
      this.characters.add(a);
    }
    if (this.textures.exists('xara-walk-0')) {
      const x = this.add.image(214, groundY + 2, 'xara-walk-0').setOrigin(0.5, 1)
        .setScale((typeof XARA_SCALE === 'number' ? XARA_SCALE : 0.15) * 1.25).setFlipX(true);
      this.tweens.add({ targets: x, y: x.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.characters.add(x);
    }
  }

  buildLogo(width) {
    this.logo = this.add.container(width / 2, 120).setDepth(20);
    if (this.textures.exists('item-titre_logo')) {
      const img = this.add.image(0, 0, 'item-titre_logo');
      img.setScale(Math.min(560 / img.width, 200 / img.height));
      this.logo.add(img);
      return;
    }
    const title = this.add.text(0, -12, 'Legend of Agarica', {
      fontFamily: STORY_UI.serif, fontSize: '58px', fontStyle: 'bold', color: '#ffe9f5',
      stroke: '#15101f', strokeThickness: 8, padding: { x: 28, y: 22 },
    }).setOrigin(0.5);
    title.setShadow(0, 0, '#ff9fc9', 22, true, true);
    const g = this.add.graphics();
    g.lineStyle(2, STORY_UI.vineLight, 0.8);
    g.lineBetween(-230, 38, -14, 38);
    g.lineBetween(14, 38, 230, 38);
    g.fillStyle(STORY_UI.pink, 1);
    g.fillTriangle(0, 31, 7, 38, 0, 45);
    g.fillTriangle(0, 31, -7, 38, 0, 45);
    // Petites feuilles au bout des traits.
    g.fillStyle(STORY_UI.vine, 1);
    g.fillEllipse(-236, 35, 12, 5);
    g.fillEllipse(236, 35, 12, 5);
    const sub = this.add.text(0, 62, TITLE_SUBTITLE, {
      fontFamily: STORY_UI.serif, fontSize: '17px', fontStyle: 'italic', color: '#c9b8f0', padding: { x: 6, y: 4 },
    }).setOrigin(0.5);
    this.logo.add([title, g, sub]);
  }

  clearLayers() {
    for (const l of Object.values(this.layers)) l.destroy();
    this.layers = {};
    this.list = null;
    this.chapterCards = null;
  }

  toast(text) {
    this.toastText.setText(text);
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setAlpha(0);
    this.tweens.add({ targets: this.toastText, alpha: 1, duration: 200, yoyo: true, hold: 2200 });
  }

  // --- Écran « Appuie sur une touche » --------------------------------------

  showSplash() {
    this.mode = 'splash';
    this.clearLayers();
    const { width, height } = this.scale;
    this.logo.setPosition(width / 2, 200).setScale(1.12).setAlpha(0);
    this.tweens.add({ targets: this.logo, alpha: 1, duration: 900, ease: 'Sine.easeOut' });
    this.hint.setVisible(false);
    const layer = this.layers.splash = this.add.container(0, 0).setDepth(30);
    const prompt = this.add.text(width / 2, height - 130, 'Appuie sur une touche', {
      fontFamily: STORY_UI.serif, fontSize: '20px', fontStyle: 'italic', color: '#ffe9f5',
      stroke: '#15101f', strokeThickness: 4, padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setAlpha(0);
    layer.add(prompt);
    this.tweens.add({ targets: prompt, alpha: { from: 0.25, to: 1 }, duration: 1100, yoyo: true, repeat: -1, delay: 700, ease: 'Sine.easeInOut' });
    this.splashZone = this.add.zone(0, 0, width, height).setOrigin(0).setInteractive().setDepth(40);
    this.splashZone.once('pointerdown', () => this.leaveSplash());
  }

  leaveSplash() {
    if (this.mode !== 'splash') return;
    this.mode = 'leaving-splash';
    if (this.splashZone) { this.splashZone.destroy(); this.splashZone = null; }
    this.tweens.add({
      targets: this.layers.splash, alpha: 0, duration: 250,
    });
    this.tweens.add({
      targets: this.logo, y: 112, scale: 0.86, duration: 600, ease: 'Cubic.easeInOut',
      onComplete: () => this.showMainMenu({ animate: true }),
    });
  }

  // --- Menu principal -----------------------------------------------------

  showMainMenu({ animate = true } = {}) {
    this.mode = 'main';
    this.clearLayers();
    const { width } = this.scale;
    this.logo.setVisible(true).setAlpha(1).setPosition(width / 2, 112).setScale(0.86);
    this.characters.setVisible(true);
    this.hint.setVisible(true).setText('↑ ↓ : choisir   ·   Entrée : valider   ·   souris aussi');

    const summary = menuSaveSummary();
    const items = [];
    if (summary) items.push({ label: 'Continuer', action: () => this.continueGame() });
    items.push({ label: 'Nouvelle partie', action: () => this.newGame() });
    items.push({ label: 'Chapitres', action: () => this.showChapters() });
    items.push({ label: 'Options', action: () => menuOpenChild(this, 'OptionsScene') });
    items.push({ label: 'Contrôles', action: () => menuOpenChild(this, 'ControlsScene') });
    items.push({ label: 'Crédits', action: () => menuOpenChild(this, 'CreditsScene') });

    const spacing = 38;
    const pw = 300;
    const ph = items.length * spacing + 28;
    const px = width / 2 - pw / 2;
    const py = 214;
    const layer = this.layers.main = this.add.container(0, 0).setDepth(50);
    const g = this.add.graphics();
    drawStoryPanel(g, px, py, pw, ph, { seed: 3, alpha: 0.88 });
    layer.add(g);
    this.list = new MenuList(this, {
      x: width / 2, y: py + 14 + spacing / 2, width: pw - 20, spacing, size: 22, items,
      onSelect: (it) => this.highlightSummary(it.label === 'Continuer'),
    });
    layer.add(this.list.container);
    if (summary) layer.add(this.buildSummary(summary, px + pw + 34, py + 4));
    this.highlightSummary(!!summary);
    if (animate) {
      layer.setAlpha(0).setY(14);
      this.tweens.add({ targets: layer, alpha: 1, y: 0, duration: 380, ease: 'Cubic.easeOut' });
    }
  }

  // Carte « Ta partie » : chapitre, zone, cœurs, formes, date.
  buildSummary(s, x, y) {
    const w = 236;
    const h = 196;
    const c = this.add.container(0, 0);
    this.summaryCard = c;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(x + 3, y + 5, w, h, 12);
    g.fillStyle(STORY_UI.night, 0.86);
    g.fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(1.5, STORY_UI.vineLight, 0.45);
    g.strokeRoundedRect(x, y, w, h, 12);
    c.add(g);
    const pad = 16;
    c.add(this.add.text(x + pad, y + 14, 'Ta partie', {
      fontFamily: STORY_UI.serif, fontSize: '15px', fontStyle: 'bold', color: STORY_UI.title, padding: { x: 2, y: 2 },
    }));
    c.add(this.add.text(x + pad, y + 38, `${s.chapter.act} — ${s.chapter.name}`, {
      fontFamily: STORY_UI.serif, fontSize: '13px', fontStyle: 'italic', color: '#c9b8f0', padding: { x: 2, y: 2 },
      wordWrap: { width: w - pad * 2 },
    }));
    c.add(this.add.text(x + pad, y + 58, s.zoneName, {
      fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: STORY_UI.text,
      wordWrap: { width: w - pad * 2 },
    }));
    // Cœurs Codex (hud_coeur / hud_coeur_vide) comme en jeu, sinon dessinés.
    const heartArt = this.textures.exists('item-hud_coeur') && this.textures.exists('item-hud_coeur_vide');
    const hg = this.add.graphics();
    c.add(hg);
    for (let i = 0; i < s.maxHearts; i++) {
      if (!heartArt) { menuDrawHeart(hg, x + pad + 9 + i * 24, y + 98, 8, i < s.hearts); continue; }
      const img = this.add.image(x + pad + 9 + i * 24, y + 98, i < s.hearts ? 'item-hud_coeur' : 'item-hud_coeur_vide');
      c.add(img.setScale(20 / img.height));
    }
    // Formes obtenues : icônes si l'art existe, sinon pastilles nommées.
    let fx = x + pad;
    const fy = y + 132;
    if (!s.forms.length) {
      c.add(this.add.text(fx, fy - 8, 'Aucune forme… pour l\'instant', {
        fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'italic', color: STORY_UI.textSoft,
      }));
    }
    for (const f of s.forms) {
      const key = [`form-icon-${f.type}`, f.type === 'monkey' ? 'item-form_icone_singe' : null]
        .find((k) => k && this.textures.exists(k));
      if (key) {
        const img = this.add.image(fx + 15, fy, key);
        img.setScale(30 / Math.max(img.width, img.height));
        c.add(img);
        fx += 36;
      } else {
        const t = this.add.text(fx, fy, f.name, {
          fontFamily: 'sans-serif', fontSize: '11px', color: '#15101f', backgroundColor: '#8fe3b8', padding: { x: 5, y: 2 },
        }).setOrigin(0, 0.5);
        c.add(t);
        fx += t.width + 6;
      }
    }
    const extra = [];
    if (s.skills.length) extra.push(`${s.skills.length} compétence${s.skills.length > 1 ? 's' : ''}`);
    if (s.items) extra.push(`${s.items} objet${s.items > 1 ? 's' : ''}`);
    const date = menuFormatDate(s.savedAt);
    c.add(this.add.text(x + pad, y + h - 30, [extra.join(' · '), date ? `Sauvé le ${date}` : ''].filter(Boolean).join('\n'), {
      fontFamily: 'sans-serif', fontSize: '11px', color: STORY_UI.textSoft, lineSpacing: 2,
    }).setOrigin(0, 0.5));
    return c;
  }

  highlightSummary(on) {
    if (!this.summaryCard || !this.summaryCard.active) return;
    this.tweens.killTweensOf(this.summaryCard);
    this.tweens.add({ targets: this.summaryCard, alpha: on ? 1 : 0.55, duration: 200 });
  }

  // --- Chapitres ------------------------------------------------------------

  showChapters() {
    this.mode = 'chapters';
    this.clearLayers();
    const { width } = this.scale;
    this.logo.setVisible(false);
    this.characters.setVisible(false);
    this.hint.setText('← → : choisir   ·   Entrée : commencer   ·   Échap : retour');
    const layer = this.layers.chapters = this.add.container(0, 0).setDepth(50).setAlpha(0);
    this.tweens.add({ targets: layer, alpha: 1, duration: 250 });
    layer.add(menuPanelTitle(this, width / 2, 52, 'Chapitres', { size: 30 }));
    const progress = menuProgress();
    layer.add(this.add.text(width / 2, 92, progress.demoFinished || progress.devUnlock
      ? 'Tous les chapitres sont ouverts.'
      : 'Un chapitre s\'ouvre dès que tu l\'as atteint ; tous, une fois la démo terminée.', {
      fontFamily: STORY_UI.serif, fontSize: '14px', fontStyle: 'italic', color: '#c9b8f0', padding: { x: 4, y: 3 },
    }).setOrigin(0.5));

    const cw = 164;
    const ch = 132;
    const gap = 14;
    const x0 = (width - (MENU_CHAPTERS.length * cw + (MENU_CHAPTERS.length - 1) * gap)) / 2;
    const cy = 128;
    this.chapterCards = MENU_CHAPTERS.map((chapter, i) => {
      const x = x0 + i * (cw + gap);
      const unlocked = menuChapterUnlocked(i);
      const card = this.add.container(x + cw / 2, cy + ch / 2);
      card.add(this.buildChapterArt(chapter, cw, ch, unlocked));
      card.add(this.add.text(0, ch / 2 - 30, `${i + 1}`, {
        fontFamily: STORY_UI.serif, fontSize: '13px', fontStyle: 'bold', color: '#ffe9f5', padding: { x: 2, y: 2 },
      }).setOrigin(0.5));
      card.add(this.add.text(0, ch / 2 - 13, menuShortName(chapter.name), {
        fontFamily: STORY_UI.serif, fontSize: '14px', fontStyle: 'bold', color: unlocked ? '#ffe9f5' : '#8d80b0',
        stroke: '#15101f', strokeThickness: 3, padding: { x: 2, y: 2 },
      }).setOrigin(0.5));
      if (!unlocked) {
        const lg = this.add.graphics();
        menuDrawLock(lg, 0, -14);
        card.add(lg);
      }
      const frame = this.add.graphics();
      card.add(frame);
      const zone = this.add.zone(0, 0, cw, ch).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.selectChapter(i));
      zone.on('pointerdown', () => { this.selectChapter(i); this.startChapter(i); });
      card.add(zone);
      layer.add(card);
      return { card, frame, unlocked, cw, ch };
    });

    // Description du chapitre choisi.
    const dy = cy + ch + 24;
    const dg = this.add.graphics();
    drawStoryPanel(dg, 150, dy, width - 300, 128, { seed: 8, alpha: 0.9 });
    layer.add(dg);
    this.chapterTitle = this.add.text(width / 2, dy + 26, '', {
      fontFamily: STORY_UI.serif, fontSize: '20px', fontStyle: 'bold', color: STORY_UI.title, padding: { x: 4, y: 3 },
    }).setOrigin(0.5);
    this.chapterDesc = this.add.text(width / 2, dy + 62, '', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#e8dcff', align: 'center', wordWrap: { width: width - 360 },
    }).setOrigin(0.5);
    this.chapterNote = this.add.text(width / 2, dy + 100, '', {
      fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'italic', color: STORY_UI.textSoft, align: 'center',
    }).setOrigin(0.5);
    layer.add([this.chapterTitle, this.chapterDesc, this.chapterNote]);

    const back = this.add.text(width / 2, dy + 160, '← Retour', {
      fontFamily: STORY_UI.serif, fontSize: '18px', color: STORY_UI.text, padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#ffc4dd'));
    back.on('pointerout', () => back.setColor(STORY_UI.text));
    back.on('pointerdown', () => this.showMainMenu());
    layer.add(back);

    // Pré-sélection : le chapitre de la sauvegarde, sinon le dernier ouvert.
    const s = menuSaveSummary();
    let start = s ? MENU_CHAPTERS.indexOf(s.chapter) : -1;
    if (start < 0) start = Math.max(0, MENU_CHAPTERS.map((c, i) => menuChapterUnlocked(i)).lastIndexOf(true));
    this.chapterIndex = -1;
    this.selectChapter(start);
  }

  // Vignette : fond Codex de la région s'il existe, sinon ciel dégradé + lune + arbres.
  buildChapterArt(chapter, w, h, unlocked) {
    const c = this.add.container(0, 0);
    const key = `item-${chapter.bg}`;
    if (this.textures.exists(key)) {
      const img = this.add.image(0, 0, key);
      const scale = Math.max(w / img.width, h / img.height);
      const cw = w / scale;
      const ch = h / scale;
      img.setCrop((img.width - cw) / 2, (img.height - ch) / 2, cw, ch).setScale(scale);
      c.add(img);
    } else {
      const g = this.add.graphics();
      const top = Phaser.Display.Color.IntegerToColor(chapter.color);
      const light = Phaser.Display.Color.GetColor(Math.min(255, top.red + 40), Math.min(255, top.green + 40), Math.min(255, top.blue + 50));
      g.fillGradientStyle(light, light, 0x0d0b1a, 0x0d0b1a, 1, 1, 1, 1);
      g.fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle(0xfff3d6, 0.85);
      g.fillCircle(w / 2 - 30, -h / 2 + 24, 9);
      g.fillStyle(0xfff3d6, 0.12);
      g.fillCircle(w / 2 - 30, -h / 2 + 24, 18);
      // Silhouettes d'arbres (graine = index de la région, pour varier).
      const seed = MENU_CHAPTERS.indexOf(chapter) + 1;
      g.fillStyle(0x0b0814, 0.9);
      for (let i = 0; i < 7; i++) {
        const tx = -w / 2 + ((i * 37 + seed * 23) % w);
        const th = 34 + ((i * 13 + seed * 7) % 30);
        g.fillTriangle(tx - 12, h / 2 - 34, tx + 12, h / 2 - 34, tx, h / 2 - 34 - th);
      }
      if (chapter.id === 'foret_flottante') {
        g.fillStyle(0x0b0814, 0.85);
        g.fillEllipse(-28, -6, 50, 12);
        g.fillEllipse(34, -24, 36, 9);
      }
      g.fillStyle(0x0b0814, 1);
      g.fillRect(-w / 2, h / 2 - 36, w, 36);
      c.add(g);
    }
    // Bandeau sombre pour le nom en bas.
    const band = this.add.graphics();
    band.fillStyle(0x0b0814, 0.75);
    band.fillRect(-w / 2, h / 2 - 40, w, 40);
    if (!unlocked) {
      band.fillStyle(0x0b0814, 0.55);
      band.fillRect(-w / 2, -h / 2, w, h - 40);
    }
    c.add(band);
    // Masque arrondi des coins : simple contour épais couleur nuit.
    const corner = this.add.graphics();
    corner.lineStyle(6, 0x0d0b1a, 1);
    corner.strokeRoundedRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 12);
    c.add(corner);
    return c;
  }

  selectChapter(i) {
    if (!this.chapterCards) return;
    const n = MENU_CHAPTERS.length;
    i = (i + n) % n;
    if (i === this.chapterIndex) return;
    this.chapterIndex = i;
    this.chapterCards.forEach((c, k) => {
      const on = k === i;
      c.frame.clear();
      c.frame.lineStyle(on ? 3 : 1.5, on ? STORY_UI.pink : STORY_UI.vineLight, on ? 1 : 0.35);
      c.frame.strokeRoundedRect(-c.cw / 2, -c.ch / 2, c.cw, c.ch, 10);
      this.tweens.killTweensOf(c.card);
      this.tweens.add({ targets: c.card, scale: on ? 1.06 : 1, y: 128 + c.ch / 2 + (on ? -4 : 0), duration: 160, ease: 'Sine.easeOut' });
    });
    const chapter = MENU_CHAPTERS[i];
    const unlocked = this.chapterCards[i].unlocked;
    this.chapterTitle.setText(`${chapter.act} · ${chapter.name}`);
    this.chapterDesc.setText(unlocked ? chapter.desc : 'Ce chapitre se dévoilera quand tu l\'auras atteint.');
    this.chapterNote.setText(unlocked
      ? (hasSaveGame() ? 'Commencer ici remplacera ta sauvegarde actuelle.' : 'Entrée ou clic : commencer ici.')
      : '');
  }

  async startChapter(i) {
    if (this.mode !== 'chapters' || this.__transitioningAway || this.menuModal) return;
    if (!this.chapterCards[i].unlocked) {
      const card = this.chapterCards[i].card;
      this.tweens.add({ targets: card, x: card.x + 6, duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    if (hasSaveGame()) {
      const ok = await menuConfirm(this, {
        title: `Chapitre ${i + 1}`,
        text: `Recommencer à « ${MENU_CHAPTERS[i].name} » ?\nTa sauvegarde actuelle sera remplacée.`,
        yes: 'Commencer', no: 'Annuler',
      });
      if (!ok || this.mode !== 'chapters') return;
    }
    menuStartChapter(this, i);
  }

  // --- Zones de test (développement) ---------------------------------------

  showTestMenu() {
    this.mode = 'test';
    this.clearLayers();
    this.logo.setVisible(false);
    this.characters.setVisible(false);
    this.hint.setText('Flèches : choisir   ·   Entrée : lancer   ·   Échap : retour');
    const { width } = this.scale;
    const layer = this.layers.test = this.add.container(0, 0).setDepth(50);
    const items = [];
    LEGACY_TEST_ZONES.forEach((z, row) => items.push({ label: z.name, col: 0, row, action: () => goToScene(this, z.scene) }));
    DEMO_ZONES.forEach((z, row) => items.push({ label: `${row + 1}. ${z.name}`, col: 1, row, action: () => goToScene(this, z.scene) }));
    items.push({ label: '← Retour', col: 0, row: LEGACY_TEST_ZONES.length + 1, action: () => this.showMainMenu() });
    const top = 84;
    for (const [x, label] of [[width / 2 - 200, 'Anciennes zones'], [width / 2 + 200, 'Démo (accès direct)']]) {
      layer.add(this.add.text(x, top - 30, label, {
        fontFamily: STORY_UI.serif, fontSize: '18px', fontStyle: 'bold', color: STORY_UI.title,
        stroke: '#15101f', strokeThickness: 4, padding: { x: 4, y: 3 },
      }).setOrigin(0.5));
    }
    items.forEach((it, i) => {
      it.text = this.add.text(it.col === 0 ? width / 2 - 200 : width / 2 + 200, top + it.row * 26, it.label, {
        fontFamily: 'sans-serif', fontSize: '16px', color: STORY_UI.text, stroke: '#15101f', strokeThickness: 4,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      it.text.on('pointerover', () => this.selectTest(i));
      it.text.on('pointerdown', () => { this.selectTest(i); it.action(); });
      layer.add(it.text);
    });
    this.testItems = items;
    this.selectTest(0);
  }

  selectTest(i) {
    this.testIndex = Phaser.Math.Clamp(i, 0, this.testItems.length - 1);
    this.testItems.forEach((it, k) => {
      const on = k === this.testIndex;
      it.text.setText(on ? `❧  ${it.label}  ` : it.label);
      it.text.setColor(on ? '#ff9fc9' : STORY_UI.text);
    });
  }

  testMenuKey(action) {
    const items = this.testItems;
    const cur = items[this.testIndex];
    if (action === 'ok') { cur.action(); return; }
    if (action === 'up' || action === 'down') {
      const same = items.map((it, i) => ({ it, i })).filter(({ it }) => it.col === cur.col);
      const pos = same.findIndex(({ i }) => i === this.testIndex);
      this.selectTest(same[(pos + (action === 'up' ? -1 : 1) + same.length) % same.length].i);
    } else if (action === 'left' || action === 'right') {
      const other = items.map((it, i) => ({ it, i })).filter(({ it }) => it.col !== cur.col);
      const best = other.reduce((a, b) => (Math.abs(b.it.row - cur.row) < Math.abs(a.it.row - cur.row) ? b : a));
      this.selectTest(best.i);
    }
  }

  // --- Actions ----------------------------------------------------------------

  continueGame() {
    loadGame(this.game);
    const entry = storyZoneEntry(storyGet('lastZone')) || DEMO_ZONES[0];
    const enterId = storyGet('lastEnterId');
    goToScene(this, entry.scene, enterId ? { enterId } : {});
  }

  async newGame() {
    if (hasSaveGame()) {
      const s = menuSaveSummary();
      const ok = await menuConfirm(this, {
        title: 'Nouvelle partie ?',
        text: `Ta sauvegarde actuelle (${s ? s.zoneName : 'en cours'}) sera effacée.`,
        yes: 'Recommencer', no: 'Annuler',
      });
      if (!ok || this.mode !== 'main') return;
    }
    menuNoteSaveProgress();
    resetGame(this.game);
    goToScene(this, 'PrologueScene');
  }

  onChildClosed(key, result) {
    if (result === 'testZones') this.showTestMenu();
    else if (this.mode === 'main' && key === 'OptionsScene') this.showMainMenu({ animate: false });
  }

  // --- Clavier ----------------------------------------------------------------

  onKey(event) {
    if (event.repeat || this.__transitioningAway || this.menuChildOpen) return;
    if (this.time.now - this.openedAt < 300 || this.time.now - this.menuChildClosedAt < 150) return;
    const k = (event.key || '').toLowerCase();
    // Code secret de développement : « lune » ouvre tous les chapitres.
    if (k.length === 1) {
      this.secretBuffer = (this.secretBuffer + k).slice(-TITLE_SECRET_CODE.length);
      if (this.secretBuffer === TITLE_SECRET_CODE) {
        this.secretBuffer = '';
        menuUpdateProgress((p) => { p.devUnlock = true; });
        this.toast('✦ Tous les chapitres sont ouverts (développement)');
        if (this.mode === 'chapters') { this.showChapters(); }
        return;
      }
    }
    if (this.mode === 'splash') { this.leaveSplash(); return; }
    const action = menuKeyAction(event);
    if (!action) return;
    if (this.menuModal) { this.menuModal.handleAction(action); return; }
    if (this.mode === 'main') {
      if (this.list) this.list.handleAction(action);
    } else if (this.mode === 'chapters') {
      if (action === 'back') this.showMainMenu();
      else if (action === 'left' || action === 'up') this.selectChapter(this.chapterIndex - 1);
      else if (action === 'right' || action === 'down') this.selectChapter(this.chapterIndex + 1);
      else if (action === 'ok') this.startChapter(this.chapterIndex);
    } else if (this.mode === 'test') {
      if (action === 'back') this.showMainMenu();
      else this.testMenuKey(action);
    }
  }
}
