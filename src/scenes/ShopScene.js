// ShopScene — boutique d'un marchand (vague 3, 2026-11-08), en surimpression
// de la zone, qui reste gelée (cf. WORLD_FREEZING_SCENES). Ouverte par
// openShop(scene, id) (SecretKit.js) : PNJ `shop`, ou étape `{shop: 'id'}`.
// Même habillage que les dialogues : cadre de lianes Codex (addStoryVineFrame)
// ou, sans l'art, panneau dessiné (drawStoryPanel).
// À gauche les articles (icône, nom, prix en Éclats de lune) ; à droite la
// description de l'article choisi ; en bas, les éclats d'Agarica.
// ↑/↓ (ZQSD) ou souris : choisir ; E / Entrée / clic : acheter ; Échap : partir.
// Achat refusé (pas assez d'éclats, épuisé) : la ligne tremble, la raison
// s'affiche, rien n'est retiré (cf. shopBuy).
const SHOP_FRAME = { x: 110, y: 46, w: 740, h: 448 };
const SHOP_ROW = { step: 56, h: 48, icon: 38 };
const SHOP_ROWS_MAX = 5;

class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  init(data) {
    this.parentKey = data && data.parentKey;
    this.shopId = data && data.shopId;
    this.onClose = (data && data.onClose) || null;
    this.selected = 0;
    this.top = 0;
    this.closing = false;
  }

  create() {
    const def = (typeof SHOPS !== 'undefined' && SHOPS[this.shopId]) || null;
    if (!def) {
      this.close();
      return;
    }
    this.def = def;
    this.openedAt = this.time.now;
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x0d0b1a, 0.72).setOrigin(0);
    const F = SHOP_FRAME;
    const framed = addStoryVineFrame(this, F.x, F.y, F.w, F.h, { scale: 0.3 });
    if (framed) {
      this.inner = framed.inner;
    } else {
      drawStoryPanel(this.add.graphics(), F.x, F.y, F.w, F.h, { seed: 5 });
      this.inner = { x: F.x + 8, y: F.y + 8, w: F.w - 16, h: F.h - 16 };
    }
    const I = this.inner;
    this.add.text(I.x + I.w / 2, I.y + 14, def.name || 'Boutique', {
      fontFamily: STORY_UI.serif, fontSize: '24px', fontStyle: 'bold', color: STORY_UI.title, stroke: '#15101f', strokeThickness: 4,
    }).setOrigin(0.5, 0);
    if (def.greet) {
      this.add.text(I.x + I.w / 2, I.y + 50, `« ${def.greet} »`, {
        fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'italic', color: '#d8ccf5', align: 'center',
        wordWrap: { width: I.w - 60 },
      }).setOrigin(0.5, 0);
    }

    // Colonne des articles (gauche) et cadre de description (droite).
    this.listX = I.x + 22;
    this.listW = Math.round(I.w * 0.52);
    this.listTop = I.y + 92;
    this.descX = this.listX + this.listW + 18;
    this.descW = I.x + I.w - 22 - this.descX;
    const dg = this.add.graphics();
    dg.fillStyle(STORY_UI.nightSoft, 0.6);
    dg.fillRoundedRect(this.descX, this.listTop - 6, this.descW, SHOP_ROWS_MAX * SHOP_ROW.step + 2, 10);
    this.highlight = this.add.graphics();
    this.rowLayer = this.add.container(0, 0);
    this.descIcon = null;
    this.descName = this.add.text(this.descX + 14, this.listTop + 92, '', {
      fontFamily: STORY_UI.serif, fontSize: '19px', fontStyle: 'bold', color: STORY_UI.text, wordWrap: { width: this.descW - 28 },
    });
    this.descText = this.add.text(this.descX + 14, this.listTop + 122, '', {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#d8ccf5', lineSpacing: 3, wordWrap: { width: this.descW - 28 },
    });
    this.descNote = this.add.text(this.descX + 14, this.listTop + SHOP_ROWS_MAX * SHOP_ROW.step - 48, '', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#c9b8f0', lineSpacing: 3, wordWrap: { width: this.descW - 28 },
    });

    // Bas : éclats d'Agarica, retour du dernier achat, touches.
    const footY = I.y + I.h - 30;
    this.purseIcon = this.add.image(this.listX + 10, footY, eclatTextureKey(this));
    this.purseIcon.setScale(22 / this.purseIcon.height);
    this.purseText = this.add.text(this.listX + 26, footY, '', {
      fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#e6f7ff', stroke: '#15101f', strokeThickness: 3,
    }).setOrigin(0, 0.5);
    this.feedback = this.add.text(this.listX, footY - 26, '', {
      fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffe066', stroke: '#15101f', strokeThickness: 3,
    }).setOrigin(0, 0.5);
    this.add.text(I.x + I.w - 22, footY, '↑↓ : choisir   ·   E / Entrée : acheter   ·   Échap : partir', {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#a99bd6',
    }).setOrigin(1, 0.5);

    this.buildRows();
    this.refreshPurse(false);
    this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.onKey, this));
    juiceOverlayIn(this);
  }

  // (Re)construit les lignes d'articles visibles (stock et quantités à jour).
  // Plus de SHOP_ROWS_MAX articles : la liste défile (`this.top`), flèches ▲▼.
  buildRows() {
    this.rowLayer.removeAll(true);
    this.articles = shopArticles(this.shopId);
    this.rows = [];
    if (!this.articles.length) {
      this.rowLayer.add(this.add.text(this.listX + this.listW / 2, this.listTop + 60, 'Rien à vendre pour l\'instant.', {
        fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'italic', color: '#8f86a8',
      }).setOrigin(0.5));
      this.select(0);
      return;
    }
    this.selected = Phaser.Math.Clamp(this.selected, 0, this.articles.length - 1);
    const maxTop = Math.max(0, this.articles.length - SHOP_ROWS_MAX);
    this.top = Phaser.Math.Clamp(this.top || 0, 0, maxTop);
    if (this.selected < this.top) this.top = this.selected;
    if (this.selected >= this.top + SHOP_ROWS_MAX) this.top = this.selected - SHOP_ROWS_MAX + 1;
    this.articles.slice(this.top, this.top + SHOP_ROWS_MAX).forEach((a, k) => {
      const i = this.top + k;
      const y = this.listTop + k * SHOP_ROW.step + SHOP_ROW.h / 2;
      const icon = a.icon === 'eclat_lune'
        ? this.add.image(this.listX + 26, y, eclatTextureKey(this)).setScale(SHOP_ROW.icon * 0.8 / 56)
        : addItemIcon(this, this.listX + 26, y, a.icon, SHOP_ROW.icon);
      const soldOut = a.left === 0;
      const name = this.add.text(this.listX + 56, y, a.name, {
        fontFamily: STORY_UI.serif, fontSize: '17px', fontStyle: 'bold', color: soldOut ? '#8f86a8' : STORY_UI.text,
      }).setOrigin(0, 0.5);
      const priceText = this.add.text(this.listX + this.listW - 34, y, soldOut ? 'épuisé' : String(a.price || 0), {
        fontFamily: 'sans-serif', fontSize: soldOut ? '12px' : '16px', fontStyle: soldOut ? 'italic' : 'bold',
        color: soldOut ? '#8f86a8' : '#e6f7ff', stroke: '#15101f', strokeThickness: 3,
      }).setOrigin(1, 0.5);
      const priceIcon = this.add.image(this.listX + this.listW - 22, y, eclatTextureKey(this)).setVisible(!soldOut);
      priceIcon.setScale(18 / priceIcon.height);
      const zone = this.add.zone(this.listX + this.listW / 2, y, this.listW, SHOP_ROW.h).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.select(i));
      zone.on('pointerdown', () => { this.select(i); this.buy(); });
      this.rowLayer.add([icon, name, priceText, priceIcon, zone]);
      this.rows[i] = { y, icon, name, priceText };
    });
    const arrow = (txt, y) => this.rowLayer.add(this.add.text(this.listX + this.listW / 2, y, txt, {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#a99bd6',
    }).setOrigin(0.5));
    if (this.top > 0) arrow('▲', this.listTop - 12);
    if (this.top < maxTop) arrow('▼', this.listTop + SHOP_ROWS_MAX * SHOP_ROW.step - 2);
    this.select(this.selected);
  }

  select(i) {
    const a = this.articles && this.articles[i];
    this.highlight.clear();
    if (this.descIcon) { this.descIcon.destroy(); this.descIcon = null; }
    if (!a) {
      this.descName.setText('');
      this.descText.setText('');
      this.descNote.setText('');
      return;
    }
    if (i !== this.selected) this.feedback.setText('');
    this.selected = i;
    // Hors de la fenêtre visible : la liste défile d'abord.
    if (!this.rows[i]) {
      this.buildRows();
      return;
    }
    const r = this.rows[i];
    this.highlight.fillStyle(STORY_UI.pink, 0.12);
    this.highlight.fillRoundedRect(this.listX, r.y - SHOP_ROW.h / 2, this.listW, SHOP_ROW.h, 10);
    this.highlight.lineStyle(1.5, 0xffe066, 0.8);
    this.highlight.strokeRoundedRect(this.listX, r.y - SHOP_ROW.h / 2, this.listW, SHOP_ROW.h, 10);
    this.rows.forEach((o, k) => { if (o && this.articles[k].left !== 0) o.name.setColor(k === i ? '#ffe066' : STORY_UI.text); });
    const cx = this.descX + this.descW / 2;
    this.descIcon = a.icon === 'eclat_lune'
      ? this.add.image(cx, this.listTop + 44, eclatTextureKey(this)).setScale(64 / 56)
      : addItemIcon(this, cx, this.listTop + 44, a.icon, 72);
    const s0 = this.descIcon.scale;
    this.descIcon.setScale(s0 * 0.7);
    this.tweens.add({ targets: this.descIcon, scale: s0, duration: 220, ease: 'Back.Out' });
    this.descName.setText(a.name);
    this.descText.setText(a.desc || '');
    const bits = [`Prix : ${a.price || 0} éclat${(a.price || 0) > 1 ? 's' : ''} de lune`];
    if (a.left != null) bits.push(a.left > 0 ? `Encore ${a.left} en vente` : 'Épuisé');
    if (a.owned != null) bits.push(`Tu en as ${a.owned}`);
    this.descNote.setText(bits.join('\n'));
  }

  refreshPurse(pop = true) {
    this.purseText.setText(`${eclatsCount()}`);
    if (!pop) return;
    this.purseText.setScale(1.3);
    this.tweens.add({ targets: this.purseText, scale: 1, duration: 240, ease: 'Back.Out' });
  }

  buy() {
    const a = this.articles && this.articles[this.selected];
    if (!a) return;
    const parent = this.scene.get(this.parentKey);
    const res = shopBuy(parent || this, this.shopId, a.id);
    const r = this.rows[this.selected];
    if (!res.ok) {
      this.feedback.setColor('#ffb3c9').setText(res.text);
      this.tweens.killTweensOf(r.name);
      const x0 = this.listX + 56;
      this.tweens.add({ targets: r.name, x: { from: x0 - 4, to: x0 + 4 }, duration: 50, yoyo: true, repeat: 2, onComplete: () => r.name.setX(x0) });
      playSfx('skill_denied', { key: this.scene.key });
      return;
    }
    this.feedback.setColor('#ffe066').setText(res.text);
    spawnFx(this, 'uiStar', this.listX + 26, r.y, { count: 8, power: 0.9 });
    playSfx('shop_buy', { article: a.id });
    this.refreshPurse(true);
    this.buildRows();
    this.feedback.setText(res.text);
  }

  onKey(event) {
    if (event.repeat || this.closing || this.time.now - this.openedAt < 150) return;
    const action = menuKeyAction(event);
    const n = (this.articles || []).length;
    if (action === 'back') this.close();
    else if (action === 'up' && n) this.select((this.selected - 1 + n) % n);
    else if (action === 'down' && n) this.select((this.selected + 1) % n);
    else if (action === 'ok') this.buy();
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    const parent = this.parentKey ? this.scene.get(this.parentKey) : null;
    this.scene.stop();
    if (parent) releaseStoryInput(parent);
    if (this.onClose) this.onClose();
  }
}
