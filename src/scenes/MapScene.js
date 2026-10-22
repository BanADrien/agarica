// MapScene — carte de Geralt (touche M en jeu si `carte_geralt` est dans le
// sac). Parchemin (art `item-carte_parchemin` si présent, sinon dessiné) avec
// les 5 grandes régions de la démo : une région n'est révélée qu'une fois
// une de ses zones visitée (flags `visited_<zone>`, cf. storyOnZoneEnter),
// avec la note (pas toujours utile) de Geralt. M / Échap / E ferme.
const MAP_REGION_LAYOUT = {
  bosquet: { x: 190, y: 400, note: 'Des druides. Accueillants,\nsauf avec les bannies.' },
  foret_sombre: { x: 330, y: 270, note: 'Sombre. (Vérifier si c\'est\npour ça le nom.)' },
  grand_arbre: { x: 490, y: 360, note: 'Un singe m\'y a lancé une pierre.\nPuis deux. Puis Clak.' },
  foret_flottante: { x: 630, y: 190, note: 'Trop haut pour moi.\nPas pour mes ambitions.' },
  foret_corrompue: { x: 780, y: 330, note: 'Mousse partout. NE PAS LÉCHER.\n(Clak, je te vois.)' },
};
const MAP_INK = 0x4a2e16;
const MAP_INK_HEX = '#4a2e16';

class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  init(data) {
    this.parentKey = data.parentKey;
  }

  create() {
    const { width, height } = this.scale;
    this.openedAt = this.time.now;
    this.add.rectangle(0, 0, width, height, 0x0d0b1a, 0.75).setOrigin(0);
    this.drawParchment(width, height);

    this.add.text(width / 2, 62, 'Carte de la forêt', {
      fontFamily: STORY_UI.serif, fontSize: '26px', fontStyle: 'bold italic', color: MAP_INK_HEX,
    }).setOrigin(0.5);
    this.add.text(width / 2, 90, 'par Geralt, ranger (et Clak) — incomplète, mais pleine de bonne volonté', {
      fontFamily: STORY_UI.serif, fontSize: '13px', fontStyle: 'italic', color: '#6b4a2a',
    }).setOrigin(0.5);

    const parent = this.scene.get(this.parentKey);
    const here = parent ? storyZoneEntry(parent) : null;
    const revealed = {};
    for (const r of STORY_REGIONS) {
      revealed[r.id] = DEMO_ZONES.some((z) => z.region === r.id && storyGet(`visited_${z.zone}`));
    }
    if (here) revealed[here.region] = true;

    this.drawPath(revealed);
    for (const r of STORY_REGIONS) this.drawRegion(r, revealed[r.id], here && here.region === r.id);
    this.drawCompass(width - 150, height - 140);

    // Raccourci barré : la cartographie selon Geralt.
    this.add.text(410, 440, 'raccourci ?', {
      fontFamily: STORY_UI.serif, fontSize: '13px', fontStyle: 'italic', color: '#7a5a3a',
    }).setOrigin(0.5).setAngle(-6);
    const g = this.add.graphics();
    g.lineStyle(2, 0x8a2a1a, 0.8);
    g.lineBetween(375, 446, 446, 434);
    this.add.text(456, 446, 'NON.', {
      fontFamily: STORY_UI.serif, fontSize: '13px', fontStyle: 'bold', color: '#8a2a1a',
    }).setAngle(-4);

    this.add.text(width / 2, height - 30, 'M / Échap : fermer', {
      fontFamily: 'sans-serif', fontSize: '13px', color: STORY_UI.textSoft,
    }).setOrigin(0.5);
    this.input.keyboard.on('keydown', this.onKey, this);
  }

  drawParchment(width, height) {
    const x = 70;
    const y = 36;
    const w = width - 140;
    const h = height - 86;
    if (this.textures.exists('item-carte_parchemin')) {
      this.add.image(width / 2, y + h / 2, 'item-carte_parchemin').setDisplaySize(w + 20, h + 20);
      return;
    }
    const g = this.add.graphics();
    // Bords déchirés : polygone légèrement irrégulier.
    const rnd = new Phaser.Math.RandomDataGenerator(['geralt']);
    const pts = [];
    const step = 28;
    for (let px = x; px <= x + w; px += step) pts.push({ x: px, y: y + rnd.realInRange(-4, 4) });
    for (let py = y; py <= y + h; py += step) pts.push({ x: x + w + rnd.realInRange(-4, 4), y: py });
    for (let px = x + w; px >= x; px -= step) pts.push({ x: px, y: y + h + rnd.realInRange(-4, 4) });
    for (let py = y + h; py >= y; py -= step) pts.push({ x: x + rnd.realInRange(-4, 4), y: py });
    g.fillStyle(0x000000, 0.35);
    g.fillPoints(pts.map((p) => ({ x: p.x + 6, y: p.y + 8 })), true);
    g.fillStyle(0xb8955a, 1);
    g.fillPoints(pts, true);
    g.fillStyle(0xe2cc98, 1);
    g.fillRoundedRect(x + 10, y + 10, w - 20, h - 20, 18);
    // Taches de café (ou de crabe).
    for (let i = 0; i < 9; i++) {
      g.fillStyle(0xc9ac72, rnd.realInRange(0.25, 0.5));
      g.fillCircle(rnd.between(x + 40, x + w - 40), rnd.between(y + 40, y + h - 40), rnd.between(8, 28));
    }
    g.lineStyle(2, 0x9a7444, 0.6);
    g.strokeRoundedRect(x + 18, y + 18, w - 36, h - 36, 14);
  }

  drawPath(revealed) {
    const g = this.add.graphics();
    const ids = STORY_REGIONS.map((r) => r.id);
    for (let i = 0; i < ids.length - 1; i++) {
      const a = MAP_REGION_LAYOUT[ids[i]];
      const b = MAP_REGION_LAYOUT[ids[i + 1]];
      if (!revealed[ids[i]]) continue;
      // Trait pointillé à la main ; s'arrête à mi-chemin vers l'inconnu.
      const end = revealed[ids[i + 1]] ? 1 : 0.5;
      const n = 14;
      g.lineStyle(3, MAP_INK, 0.75);
      for (let k = 0; k < n; k += 2) {
        const t0 = (k / n) * end;
        const t1 = ((k + 1) / n) * end;
        const bend = (t) => Math.sin(t * Math.PI) * 26;
        g.lineBetween(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0 - bend(t0),
          a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1 - bend(t1));
      }
    }
  }

  drawRegion(region, revealed, isHere) {
    const L = MAP_REGION_LAYOUT[region.id];
    const g = this.add.graphics();
    if (!revealed) {
      g.fillStyle(0x9a8a6a, 0.35);
      for (let i = 0; i < 5; i++) g.fillCircle(L.x - 30 + i * 15, L.y + Math.sin(i) * 6, 22);
      this.add.text(L.x, L.y, '???', {
        fontFamily: STORY_UI.serif, fontSize: '22px', fontStyle: 'bold', color: '#7a6a4a',
      }).setOrigin(0.5);
      return;
    }
    this.drawRegionSymbol(g, region.id, L.x, L.y);
    this.add.text(L.x, L.y + 34, region.name, {
      fontFamily: STORY_UI.serif, fontSize: '16px', fontStyle: 'bold', color: MAP_INK_HEX,
    }).setOrigin(0.5, 0);
    this.add.text(L.x, L.y + 54, L.note, {
      fontFamily: STORY_UI.serif, fontSize: '12px', fontStyle: 'italic', color: '#6b4a2a', align: 'center',
    }).setOrigin(0.5, 0);
    if (isHere) {
      const pin = this.add.graphics();
      pin.fillStyle(STORY_UI.pink, 1);
      pin.fillCircle(L.x + 34, L.y - 34, 8);
      pin.fillTriangle(L.x + 27, L.y - 30, L.x + 41, L.y - 30, L.x + 34, L.y - 16);
      pin.fillStyle(0xffffff, 1);
      pin.fillCircle(L.x + 34, L.y - 34, 3);
      this.add.text(L.x + 48, L.y - 42, 'tu es ici', {
        fontFamily: STORY_UI.serif, fontSize: '12px', fontStyle: 'italic', color: '#b0306a',
      });
      this.tweens.add({ targets: pin, y: -4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  // Petits pictogrammes à l'encre, un par région.
  drawRegionSymbol(g, id, x, y) {
    g.lineStyle(2, MAP_INK, 1);
    g.fillStyle(0x6b8a4a, 0.5);
    if (id === 'bosquet') {
      for (const dx of [-22, 0, 22]) {
        g.fillTriangle(x + dx - 12, y + 10, x + dx + 12, y + 10, x + dx, y - 12);
        g.strokeTriangle(x + dx - 12, y + 10, x + dx + 12, y + 10, x + dx, y - 12);
      }
    } else if (id === 'foret_sombre') {
      g.fillStyle(0x3a4a3a, 0.6);
      for (const [dx, s] of [[-24, 1], [-6, 1.3], [14, 1], [30, 0.8]]) {
        g.fillTriangle(x + dx - 10 * s, y + 14, x + dx + 10 * s, y + 14, x + dx, y - 20 * s);
        g.strokeTriangle(x + dx - 10 * s, y + 14, x + dx + 10 * s, y + 14, x + dx, y - 20 * s);
      }
    } else if (id === 'grand_arbre') {
      g.fillStyle(0x7a5a3a, 0.7);
      g.fillRect(x - 6, y - 10, 12, 26);
      g.strokeRect(x - 6, y - 10, 12, 26);
      g.fillStyle(0x5a7a3a, 0.6);
      g.fillCircle(x, y - 22, 22);
      g.strokeCircle(x, y - 22, 22);
    } else if (id === 'foret_flottante') {
      g.fillStyle(0x7a9a6a, 0.6);
      for (const [dx, dy] of [[-26, 6], [4, -10], [30, 8]]) {
        g.fillEllipse(x + dx, y + dy, 30, 10);
        g.strokeEllipse(x + dx, y + dy, 30, 10);
      }
    } else if (id === 'foret_corrompue') {
      g.fillStyle(0x5aa02a, 0.6);
      for (const [dx, r] of [[-18, 12], [2, 16], [22, 10]]) {
        g.fillCircle(x + dx, y, r);
        g.strokeCircle(x + dx, y, r);
      }
      g.lineStyle(2, 0x8a2a1a, 1);
      g.strokeCircle(x, y, 32);
    }
  }

  drawCompass(x, y) {
    const g = this.add.graphics();
    g.lineStyle(1.5, MAP_INK, 0.9);
    g.strokeCircle(x, y, 26);
    g.fillStyle(MAP_INK, 0.85);
    g.fillTriangle(x, y - 34, x - 6, y, x + 6, y);
    g.fillStyle(0xb8955a, 1);
    g.fillTriangle(x, y + 34, x - 6, y, x + 6, y);
    this.add.text(x, y - 48, 'N', { fontFamily: STORY_UI.serif, fontSize: '14px', fontStyle: 'bold', color: MAP_INK_HEX }).setOrigin(0.5);
    this.add.text(x, y + 44, '(à peu près)', { fontFamily: STORY_UI.serif, fontSize: '10px', fontStyle: 'italic', color: '#6b4a2a' }).setOrigin(0.5);
  }

  onKey(event) {
    if (event.repeat || this.time.now - this.openedAt < 120) return;
    const k = event.key.toLowerCase();
    if (k === 'm' || k === 'escape' || k === 'e') this.close();
  }

  close() {
    this.input.keyboard.off('keydown', this.onKey, this);
    const parent = this.scene.get(this.parentKey);
    this.scene.stop();
    if (parent) releaseStoryInput(parent);
  }
}
