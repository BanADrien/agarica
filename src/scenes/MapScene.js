// MapScene — carte du monde (refaite le 2026-11-08, point 4 de la liste ;
// avant : la carte peinte de Geralt, 5 régions révélées par visite).
// Touche M partout (cf. updateStoryKeys, StoryKit) et entrée « Carte » du menu
// du feu de camp. Chaque zone de l'histoire est dessinée en petit avec la
// silhouette de SON VRAI TERRAIN (zoneGroundCells : sol + branches du grand
// arbre), à sa place dans le monde (MAP_ZONE_LAYOUT, sinon placement déduit
// des sorties de bord), sur fond de parchemin. Seuls les blocs parcourus sont
// dessinés, le reste de la zone est dans le brouillard ; la carte montrée est
// celle du DERNIER FEU DE CAMP (`mapExplored`, cf. storyMapCommit) : ce qui a
// été découvert depuis attend le prochain feu. Feux de camp et passages (sorties
// de bord) y sont marqués ; Agarica aussi, si sa zone est déjà sur la carte.
// Flèches / ZQSD : déplacer ; + / − ou molette : zoom ; Espace : se retrouver ;
// M / Échap / E : fermer. `returnTo` (menu du feu) : cette scène-là reprend
// la main à la fermeture.

// Position de chaque zone dans le monde, en px de jeu : coin (0, 0) de la
// zone (x vers la droite, y vers le bas, comme en jeu). Écrite à la main,
// d'après les sorties de bord : chaque sortie tombe au bord de sa voisine, à
// la même hauteur de sol quand c'est possible. Le monde n'est pas tout à fait
// euclidien (la sortie basse de la forêt sombre 2 mène à la hutte de Morgat,
// placée en hauteur près de la clairière ; l'épreuve du singe repart du bord
// gauche des racines) : ces deux-là sont posées au plus lisible. Une zone
// absente de la table est placée automatiquement (mapAutoPlace). Les zones de
// test ne sont jamais sur la carte.
const MAP_ZONE_LAYOUT = {
  // Vague 3 (2026-11-08, VAGUE3_DESIGN.md § 1.4) : la forêt sombre 1 s'élargit de
  // 512 px (gouffre aux lianes), tout ce qui est à sa droite glisse de +512 ;
  // l'épreuve du singe monte (place du cercle de lune) ; chaque zone facultative
  // tombe au droit du passage de sa voisine. Hauteurs réelles des boîtes (cf.
  // mapZoneBox) : le sol descend jusqu'à 576 (rangée 8), pas 540 ; d'où les y
  // décalés de 36 par rapport au document (aucune boîte ne se chevauche).
  // Écarts voulus (monde pas tout à fait euclidien) : 144 px entre le bas des
  // racines et le haut des galeries ; 416 px entre le belvédère du chemin des
  // hauteurs et l'île du gardien, posée au-dessus des îles flottantes (dont la
  // boîte monte à -400, cf. leur sortie vers l'île des vents).
  bosquet: { x: 0, y: 0 },
  foret_sombre_1: { x: 3840, y: 0 },
  foret_sombre_2: { x: 8192, y: 0 },
  grand_arbre_racines: { x: 14080, y: 0 },
  // Sol de l'arène (448) au niveau de la sortie haute des racines (-192).
  grand_arbre_arene: { x: 17920, y: -640 },
  // Longue course au-dessus de la forêt sombre, qui revient aux racines.
  epreuve_singe: { x: 1792, y: -1152 },
  // Hors du chemin (fichiers gardés) : au-dessus du grand arbre.
  monde_spirituel: { x: 14512, y: -3400 },
  foret_flottante_1: { x: 19840, y: -640 },
  foret_flottante_2: { x: 23424, y: -1856 },
  clairiere_plante: { x: 27520, y: -1834 },
  hutte_morgat: { x: 29760, y: -1834 },
  // Le crash : en contrebas, au-delà de la hutte.
  foret_corrompue_1: { x: 33112, y: -500 },
  arene_ghilt: { x: 37272, y: -500 },
  trou_sombre: { x: 37272, y: 160 },
  bosquet_retour: { x: 38616, y: -500 },
  // Zones facultatives (vague 3).
  grotte_lisiere: { x: 7476, y: 720 },
  galeries_racines: { x: 11956, y: 720 },
  cercle_lune: { x: 10816, y: -576 },
  cime_cachee: { x: 17216, y: -1216 },
  ile_du_gardien: { x: 21490, y: -2796 },
  ile_des_vents: { x: 23764, y: -2796 },
  racines_suspendues: { x: 25280, y: -858 },
  marais_brumes: { x: 28416, y: -1258 },
  nid_cocons: { x: 33624, y: 76 },
  canopee_malade: { x: 34712, y: -1040 },
};
// Échelles (px d'écran par px de jeu), de la vue d'ensemble (le monde de la
// démo, ~40 000 px, tient dans le cadre) au détail.
const MAP_ZOOMS = [1 / 56, 1 / 32, 1 / 20, 1 / 12, 1 / 7];
const MAP_ZOOM_DEFAULT = 3;
const MAP_CELL = 64;
// Encre et papier.
const MAP_INK = 0x4a2e16;
const MAP_INK_HEX = '#4a2e16';
const MAP_PAPER = 0xecd9ab;
const MAP_FOG = 0xa88c5c;
const MAP_GRASS = 0x5f8a3e;
const MAP_PASSAGE = 0x9a2a1a;
// Cadre de la carte à l'écran (le parchemin déborde autour).
const MAP_VIEW = { x: 78, y: 96, w: 804, h: 318 };

// Donnée de zone par convention de nom (`foret_sombre_1` -> FORET_SOMBRE_1_DATA),
// lue telle qu'écrite dans src/data/ (les globales `const` ne sont pas sur window).
const MAP_ZONE_DATA_CACHE = {};
function mapZoneData(zone) {
  if (zone in MAP_ZONE_DATA_CACHE) return MAP_ZONE_DATA_CACHE[zone];
  const name = `${zone.toUpperCase()}_DATA`;
  let data = null;
  if (/^[A-Z0-9_]+$/.test(name)) {
    try {
      data = (new Function(`return typeof ${name} !== 'undefined' ? ${name} : null;`))();
    } catch (e) {
      data = null;
    }
  }
  MAP_ZONE_DATA_CACHE[zone] = data;
  return data;
}

// Boîte d'une zone (px de jeu, repère de la zone) : largeur du niveau, du
// haut (levelTop ou plus haute case) au bas (levelHeight ou plus basse case).
function mapZoneBox(data, cells) {
  let top = Math.min(0, data.levelTop || 0);
  let bottom = data.levelHeight || 540;
  for (const [, gy] of cells) {
    top = Math.min(top, gy * MAP_CELL);
    bottom = Math.max(bottom, (gy + 1) * MAP_CELL);
  }
  return { w: data.levelWidth || 960, top, bottom };
}

// Repli pour une future zone sans position : posée contre une zone déjà
// placée qui la relie par une sortie de bord (gauche, droite, haut, bas), dans
// un sens ou dans l'autre. Plusieurs passes (une zone peut se rattacher à une
// zone placée automatiquement à la passe d'avant).
function mapAutoPlace(zones, placed) {
  const sceneZone = (key) => {
    const e = storyZoneEntry(key);
    return e ? e.zone : null;
  };
  const opposite = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
  for (let pass = 0; pass < zones.length; pass++) {
    let progress = false;
    for (const z of zones) {
      if (placed[z.zone]) continue;
      for (const k of zones) {
        const kp = placed[k.zone];
        if (!kp || k === z) continue;
        // Sortie de K vers Z (bord de K), ou de Z vers K (bord opposé de K).
        let edge = null;
        let exit = null;
        exit = (k.data.exits || []).find((e) => e && e.edge && sceneZone(e.targetScene) === z.zone);
        if (exit) edge = exit.edge;
        if (!edge) {
          exit = (z.data.exits || []).find((e) => e && e.edge && sceneZone(e.targetScene) === k.zone);
          if (exit) edge = opposite[exit.edge];
          exit = null;
        }
        if (!edge) continue;
        const mid = exit && exit.from != null && exit.to != null ? (exit.from + exit.to) / 2 : k.box.w / 2;
        if (edge === 'right') placed[z.zone] = { x: kp.x + k.box.w, y: kp.y };
        else if (edge === 'left') placed[z.zone] = { x: kp.x - z.box.w, y: kp.y };
        else if (edge === 'top') placed[z.zone] = { x: kp.x + mid - z.box.w / 2, y: kp.y + k.box.top - z.box.bottom };
        else placed[z.zone] = { x: kp.x + mid - z.box.w / 2, y: kp.y + k.box.bottom - z.box.top };
        progress = true;
        break;
      }
    }
    if (!progress) break;
  }
}

// Le monde tel que la carte sauvegardée le connaît : zones avec au moins un
// bloc reporté, leur terrain, leurs feux et leurs passages.
function mapBuildWorld() {
  const all = [];
  for (const entry of DEMO_ZONES) {
    const data = mapZoneData(entry.zone);
    if (!data) continue;
    const cells = typeof zoneGroundCells === 'function' ? zoneGroundCells(data) : (data.groundCells || []);
    all.push({ zone: entry.zone, name: entry.name, scene: entry.scene, data, cells, box: mapZoneBox(data, cells) });
  }
  const placed = {};
  for (const z of all) if (MAP_ZONE_LAYOUT[z.zone]) placed[z.zone] = MAP_ZONE_LAYOUT[z.zone];
  mapAutoPlace(all, placed);
  const visited = campfiresVisited();
  const zones = [];
  for (const z of all) {
    const chunks = storyMapZoneChunks(z.zone);
    const pos = placed[z.zone];
    if (!chunks || !pos) continue;
    z.x = pos.x;
    z.y = pos.y;
    z.all = chunks === STORY_MAP_ALL;
    z.chunks = z.all ? null : chunks;
    z.fires = (z.data.campfires || []).map((c, i) => ({ x: c.x, y: c.y, visited: visited.includes(`${z.zone}#${i}`) }));
    zones.push(z);
  }
  let bounds = null;
  for (const z of zones) {
    const b = { x0: z.x, x1: z.x + z.box.w, y0: z.y + z.box.top, y1: z.y + z.box.bottom };
    bounds = bounds ? { x0: Math.min(bounds.x0, b.x0), x1: Math.max(bounds.x1, b.x1), y0: Math.min(bounds.y0, b.y0), y1: Math.max(bounds.y1, b.y1) } : b;
  }
  return { zones, bounds };
}

// Bloc (128 px) parcouru ? (`z.all` : zone reportée en entier.)
function mapChunkKnown(z, x, y) {
  if (z.all) return true;
  const C = STORY_MAP_CHUNK;
  return z.chunks.has(`${Math.floor(x / C)},${Math.floor(y / C)}`);
}

class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  init(data) {
    this.parentKey = data.parentKey;
    this.returnTo = data.returnTo || null;
  }

  create() {
    const { width, height } = this.scale;
    this.openedAt = this.time.now;
    // Juice : la carte s'ouvre avec un léger rebond.
    juiceOverlayIn(this);
    this.add.rectangle(0, 0, width, height, 0x0d0b1a, 0.75).setOrigin(0);
    this.drawParchmentBackground();

    this.world = mapBuildWorld();
    const parent = this.scene.get(this.parentKey);
    const entry = parent ? storyZoneEntry(parent) : null;
    const hereZone = entry && this.world.zones.find((z) => z.zone === entry.zone);
    this.here = hereZone && parent.player ? { zone: hereZone, x: hereZone.x + parent.player.x, y: hereZone.y + parent.player.y } : null;

    // Calques de la carte, coupés au cadre (masque) : brouillard, terrain,
    // marques ; textes des zones par-dessus.
    const V = MAP_VIEW;
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRect(V.x, V.y, V.w, V.h);
    this.viewMask = maskShape.createGeometryMask();
    this.g = this.add.graphics().setMask(this.viewMask);
    this.labels = this.world.zones.map((z) => this.add.text(0, 0, z.name, {
      fontFamily: STORY_UI.serif, fontSize: '12px', fontStyle: 'bold italic', color: MAP_INK_HEX,
      stroke: '#f3e3bd', strokeThickness: 3,
    }).setOrigin(0.5, 1).setMask(this.viewMask));
    this.pin = this.add.graphics().setMask(this.viewMask);
    this.pinLabel = this.add.text(0, 0, 'toi', {
      fontFamily: STORY_UI.serif, fontSize: '13px', fontStyle: 'bold italic', color: '#b0306a',
      stroke: '#f3e3bd', strokeThickness: 3,
    }).setMask(this.viewMask).setVisible(false);
    this.pinBob = { dy: 0 };
    this.tweens.add({ targets: this.pinBob, dy: -4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: () => this.drawPin() });

    this.addTitle();
    this.addLegend();
    this.addHints();

    // Vue de départ : Agarica si sa zone est sur la carte, sinon la dernière
    // zone reportée, sinon le centre.
    this.zoomIndex = MAP_ZOOM_DEFAULT;
    const focus = this.here || this.lastZoneFocus();
    this.camX = focus ? focus.x : 0;
    this.camY = focus ? focus.y : 0;
    this.clampCamera();
    this.redraw();

    this.input.keyboard.on('keydown', this.onKey, this);
    this.input.on('wheel', (pointer, objs, dx, dy) => this.zoomBy(dy > 0 ? -1 : 1));
    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const z = MAP_ZOOMS[this.zoomIndex];
      this.camX -= (pointer.x - pointer.prevPosition.x) / z;
      this.camY -= (pointer.y - pointer.prevPosition.y) / z;
      this.clampCamera();
      this.redraw();
    });
  }

  lastZoneFocus() {
    const zones = this.world.zones;
    if (!zones.length) return null;
    const last = zones.find((z) => z.zone === storyGet('lastZone')) || zones[zones.length - 1];
    return { x: last.x + last.box.w / 2, y: last.y + (last.box.top + last.box.bottom) / 2 };
  }

  // Parchemin : l'art `carte_parchemin` (ses dessins voilés de papier, on ne
  // garde que le grain et les bords déchirés), sinon un parchemin dessiné.
  drawParchmentBackground() {
    const { width, height } = this.scale;
    if (this.textures.exists('item-carte_parchemin')) {
      this.add.image(width / 2, height / 2, 'item-carte_parchemin').setDisplaySize(width - 24, height - 16);
      // Voile de papier aux bords fondus : couches de plus en plus opaques
      // vers le centre (les dessins de Geralt ne restent qu'en filigrane).
      const g = this.add.graphics();
      for (let i = 0; i < 7; i++) {
        const inset = 30 + i * 6;
        g.fillStyle(MAP_PAPER, i === 6 ? 0.85 : 0.12);
        g.fillRoundedRect(inset, inset - 10, width - 2 * inset, height - 2 * inset + 6, 40 - i * 2);
      }
    } else {
      this.drawParchment(width, height);
    }
    // Cadre de la carte : filet d'encre.
    const V = MAP_VIEW;
    const f = this.add.graphics();
    f.lineStyle(1.5, 0x9a7444, 0.7);
    f.strokeRoundedRect(V.x - 4, V.y - 4, V.w + 8, V.h + 8, 8);
  }

  drawParchment(width, height) {
    const x = 30;
    const y = 18;
    const w = width - 60;
    const h = height - 36;
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
  }

  addTitle() {
    const { width } = this.scale;
    this.add.text(width / 2, 48, 'Carte du monde', {
      fontFamily: STORY_UI.serif, fontSize: '24px', fontStyle: 'bold italic', color: MAP_INK_HEX, padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    // La version montrée (dernier feu) et ce qui attend le prochain feu.
    const pending = storyMapPendingCount();
    let sub = 'telle qu\'au dernier feu de camp';
    if (pending > 0) sub += ` — ${pending} coin${pending > 1 ? 's' : ''} découvert${pending > 1 ? 's' : ''} depuis, à reporter au prochain feu`;
    this.add.text(width / 2, 74, sub, {
      fontFamily: STORY_UI.serif, fontSize: '12px', fontStyle: 'italic', color: '#6b4a2a',
    }).setOrigin(0.5);
    const V = MAP_VIEW;
    if (!this.world.zones.length) {
      this.add.text(V.x + V.w / 2, V.y + V.h / 2, 'Rien n\'est encore cartographié.\nAssieds-toi à un feu de camp pour y reporter tes découvertes.', {
        fontFamily: STORY_UI.serif, fontSize: '15px', fontStyle: 'italic', color: MAP_INK_HEX, align: 'center',
      }).setOrigin(0.5);
    } else if (!this.here) {
      this.add.text(V.x + V.w - 8, V.y + 8, 'Ta zone n\'est pas encore sur la carte.', {
        fontFamily: STORY_UI.serif, fontSize: '11px', fontStyle: 'italic', color: '#8a2a1a',
        backgroundColor: '#f0dfb4', padding: { x: 5, y: 2 },
      }).setOrigin(1, 0);
    }
  }

  // Légende courte, sous la carte à gauche.
  addLegend() {
    const y = MAP_VIEW.y + MAP_VIEW.h + 14;
    let x = MAP_VIEW.x + 4;
    const g = this.add.graphics();
    const label = (text) => {
      const t = this.add.text(x, y, text, { fontFamily: STORY_UI.serif, fontSize: '11px', fontStyle: 'italic', color: MAP_INK_HEX }).setOrigin(0, 0.5);
      x += t.width + 16;
    };
    this.drawFlame(g, x + 6, y + 4, true, 1);
    x += 16;
    label('feu où tu t\'es assise');
    this.drawFlame(g, x + 6, y + 4, false, 1);
    x += 16;
    label('feu aperçu');
    this.drawChevron(g, x + 6, y, 'right', 6);
    x += 16;
    label('passage');
    this.drawHatch(g, x, y - 6, 18, 12, 1);
    g.lineStyle(1, MAP_INK, 0.35);
    g.strokeRect(x, y - 6, 18, 12);
    x += 24;
    label('brouillard');
    g.fillStyle(STORY_UI.pink, 1);
    g.fillCircle(x + 5, y - 3, 4.5);
    g.fillTriangle(x + 1, y - 1, x + 9, y - 1, x + 5, y + 6);
    x += 14;
    label('toi');
  }

  addHints() {
    const { width } = this.scale;
    const closeHint = this.returnTo ? 'M / Échap : retour au feu' : 'M / Échap : fermer';
    this.add.text(width / 2, MAP_VIEW.y + MAP_VIEW.h + 38, `←↑↓→ / ZQSD : déplacer   ·   + / − ou molette : zoom   ·   Espace : te retrouver   ·   ${closeHint}`, {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#5a3d22',
    }).setOrigin(0.5);
  }

  // --- Vue --------------------------------------------------------------------

  toScreen(wx, wy) {
    const z = MAP_ZOOMS[this.zoomIndex];
    return { x: MAP_VIEW.x + MAP_VIEW.w / 2 + (wx - this.camX) * z, y: MAP_VIEW.y + MAP_VIEW.h / 2 + (wy - this.camY) * z };
  }

  // La vue reste sur ce qui est cartographié (marge d'un demi-cadre).
  clampCamera() {
    const b = this.world.bounds;
    if (!b) return;
    const z = MAP_ZOOMS[this.zoomIndex];
    const halfW = MAP_VIEW.w / 2 / z;
    const halfH = MAP_VIEW.h / 2 / z;
    const fitX = (b.x1 - b.x0) <= 2 * halfW;
    const fitY = (b.y1 - b.y0) <= 2 * halfH;
    this.camX = fitX ? (b.x0 + b.x1) / 2 : Phaser.Math.Clamp(this.camX, b.x0 + halfW * 0.5, b.x1 - halfW * 0.5);
    this.camY = fitY ? (b.y0 + b.y1) / 2 : Phaser.Math.Clamp(this.camY, b.y0 + halfH * 0.5, b.y1 - halfH * 0.5);
  }

  zoomBy(d) {
    const i = Phaser.Math.Clamp(this.zoomIndex + d, 0, MAP_ZOOMS.length - 1);
    if (i === this.zoomIndex) return;
    this.zoomIndex = i;
    this.clampCamera();
    this.redraw();
  }

  pan(dx, dy) {
    const z = MAP_ZOOMS[this.zoomIndex];
    this.camX += (dx * MAP_VIEW.w * 0.18) / z;
    this.camY += (dy * MAP_VIEW.h * 0.22) / z;
    this.clampCamera();
    this.redraw();
  }

  redraw() {
    const g = this.g;
    g.clear();
    const z = MAP_ZOOMS[this.zoomIndex];
    const V = MAP_VIEW;
    const shown = [];
    this.world.zones.forEach((zone, i) => {
      const o = this.toScreen(zone.x, zone.y);
      const box = { x: o.x, y: o.y + zone.box.top * z, w: zone.box.w * z, h: (zone.box.bottom - zone.box.top) * z };
      const label = this.labels[i];
      label.setVisible(false);
      const onScreen = box.x < V.x + V.w && box.x + box.w > V.x && box.y < V.y + V.h && box.y + box.h > V.y;
      if (!onScreen) return;
      this.drawZone(g, zone, o, box, z);
      label.setPosition(Phaser.Math.Clamp(box.x + box.w / 2, V.x + label.width / 2 + 4, V.x + V.w - label.width / 2 - 4), Math.max(V.y + 16, box.y - 3));
      shown.push({ zone, label, box });
    });
    this.placeLabels(shown);
    this.drawPin();
  }

  // Noms des zones (zone d'Agarica d'abord, puis les plus larges) : jamais sur
  // un autre nom NI sur le dessin d'une autre zone. Retour des joueuses du
  // 2026-11-09 : posés toujours au-dessus de leur zone, des noms mordaient sur
  // la zone voisine du dessus (« Grotte de la lisière » sous la forêt sombre,
  // « Forêt sombre — les ravins » sous le cercle de lune) et se chevauchaient.
  // Places essayées dans l'ordre : au-dessus de la zone, dans son haut, dans son
  // bas, sous elle ; aucune de libre : le nom attend un zoom plus fort.
  placeLabels(shown) {
    const here = this.here && this.here.zone;
    shown.sort((a, b) => (b.zone === here) - (a.zone === here) || b.box.w - a.box.w);
    const taken = [];
    // L'épingle « toi » et son mot passent avant les noms.
    if (this.here) {
      const p = this.toScreen(this.here.x, this.here.y);
      taken.push(new Phaser.Geom.Rectangle(p.x - 10, p.y - 44, 46, 46));
    }
    const V = MAP_VIEW;
    const zoneRects = shown.map((s) => ({ s, r: new Phaser.Geom.Rectangle(s.box.x, s.box.y, s.box.w, s.box.h) }));
    const rectOf = (l) => new Phaser.Geom.Rectangle(l.x - l.width / 2 - 4, l.y - l.height, l.width + 8, l.height);
    // 1er passage : ni sur un nom, ni sur une autre zone. 2e passage (noms
    // restés sans place, petites zones serrées) : seulement pas sur un nom,
    // posés au-dessus de leur zone comme avant.
    let strict = true;
    const free = (r, s) => !taken.some((t) => Phaser.Geom.Intersects.RectangleToRectangle(t, r))
      && (!strict || !zoneRects.some((z) => z.s !== s && Phaser.Geom.Intersects.RectangleToRectangle(z.r, r)));
    const inView = (r) => r.y >= V.y + 2 && r.bottom <= V.y + V.h - 2;
    const pending = [];
    for (const s of shown) {
      const l = s.label;
      if (s.box.w < l.width * 0.7 && s.zone !== here) continue;
      const b = s.box;
      const ys = [b.y - 3];
      if (b.h >= l.height + 8) ys.push(b.y + l.height + 3, b.y + b.h - 3);
      ys.push(b.y + b.h + l.height + 3);
      const xs = [l.x];
      // Nom de la zone d'Agarica sous l'épingle : glissé à côté d'elle.
      if (s.zone === here) {
        const p = this.toScreen(this.here.x, this.here.y);
        xs.push(p.x - l.width / 2 - 16, p.x + l.width / 2 + 40);
      }
      // Toujours au-dessus (ou dans) SA zone : jamais glissé au-dessus de la voisine.
      const half = l.width / 2;
      const lo = Math.max(V.x + half + 4, b.w > l.width ? b.x + half : b.x + b.w / 2);
      const hi = Math.min(V.x + V.w - half - 4, b.w > l.width ? b.x + b.w - half : b.x + b.w / 2);
      let ok = false;
      for (const y of ys) {
        for (const x of xs) {
          l.setPosition(lo <= hi ? Phaser.Math.Clamp(x, lo, hi) : Phaser.Math.Clamp(x, V.x + half + 4, V.x + V.w - half - 4), y);
          const r = rectOf(l);
          if (inView(r) && free(r, s)) { ok = true; break; }
        }
        if (ok) break;
      }
      if (!ok) { pending.push(s); continue; }
      taken.push(rectOf(l));
      l.setVisible(true);
    }
    strict = false;
    for (const s of pending) {
      const l = s.label;
      l.setPosition(Phaser.Math.Clamp(s.box.x + s.box.w / 2, V.x + l.width / 2 + 4, V.x + V.w - l.width / 2 - 4), Math.max(V.y + 16, s.box.y - 3));
      const r = rectOf(l);
      if (!inView(r) || !free(r, s)) continue;
      taken.push(r);
      l.setVisible(true);
    }
  }

  drawZone(g, zone, o, box, z) {
    const C = STORY_MAP_CHUNK;
    // Brouillard : toute la zone, hachurée.
    g.fillStyle(MAP_FOG, 0.22);
    g.fillRect(box.x, box.y, box.w, box.h);
    this.drawHatch(g, box.x, box.y, box.w, box.h, z * 14 > 6 ? 1 : 0.6);
    // Parties parcourues : papier clair, par bandes de blocs contigus.
    g.fillStyle(MAP_PAPER, 0.92);
    if (zone.all) {
      g.fillRect(box.x, box.y, box.w, box.h);
    } else {
      const rows = new Map();
      for (const k of zone.chunks) {
        const [cx, cy] = k.split(',').map(Number);
        if (!rows.has(cy)) rows.set(cy, []);
        rows.get(cy).push(cx);
      }
      for (const [cy, xs] of rows) {
        xs.sort((a, b) => a - b);
        let start = xs[0];
        let prev = xs[0];
        for (let i = 1; i <= xs.length; i++) {
          if (i < xs.length && xs[i] === prev + 1) { prev = xs[i]; continue; }
          g.fillRect(o.x + start * C * z, o.y + cy * C * z, (prev - start + 1) * C * z, C * z);
          start = xs[i];
          prev = xs[i];
        }
      }
    }
    g.lineStyle(1, MAP_INK, 0.3);
    g.strokeRect(box.x, box.y, box.w, box.h);
    // Terrain : cases connues, en bandes ; liseré d'herbe sur le dessus.
    const known = (gx, gy) => mapChunkKnown(zone, gx * MAP_CELL + 1, gy * MAP_CELL + 1);
    const solid = new Set(zone.cells.map(([gx, gy]) => `${gx},${gy}`));
    const byRow = new Map();
    for (const [gx, gy] of zone.cells) {
      if (!known(gx, gy)) continue;
      if (!byRow.has(gy)) byRow.set(gy, []);
      byRow.get(gy).push(gx);
    }
    const s = MAP_CELL * z;
    for (const [gy, xs] of byRow) {
      xs.sort((a, b) => a - b);
      let start = xs[0];
      let prev = xs[0];
      for (let i = 1; i <= xs.length; i++) {
        if (i < xs.length && xs[i] === prev + 1) { prev = xs[i]; continue; }
        g.fillStyle(MAP_INK, 0.88);
        g.fillRect(o.x + start * s, o.y + gy * s, (prev - start + 1) * s + 0.5, s + 0.5);
        start = xs[i];
        prev = xs[i];
      }
      if (s >= 3) {
        g.fillStyle(MAP_GRASS, 0.95);
        for (const gx of xs) {
          if (!solid.has(`${gx},${gy - 1}`)) g.fillRect(o.x + gx * s, o.y + gy * s, s + 0.5, Math.max(1, s * 0.22));
        }
      }
    }
    // Passages (sorties de bord), s'ils ont été vus.
    for (const exit of zone.data.exits || []) {
      if (!exit || !exit.edge || !exit.targetScene) continue;
      const p = this.exitPoint(zone, exit);
      if (!p || !this.nearKnown(zone, p.x, p.y)) continue;
      this.drawChevron(g, o.x + p.x * z, o.y + p.y * z, exit.edge, Math.max(5, Math.min(9, 90 * z)));
    }
    // Feux : allumés (assise) ou simplement aperçus.
    for (const f of zone.fires) {
      if (!f.visited && !mapChunkKnown(zone, f.x, f.y - 20)) continue;
      this.drawFlame(g, o.x + f.x * z, o.y + f.y * z, f.visited, Math.max(0.8, Math.min(1.4, 24 * z)));
    }
  }

  // Point d'une sortie de bord (px de jeu, repère de la zone) : milieu du
  // passage, juste au-dessus du sol pour les bords gauche/droit.
  exitPoint(zone, exit) {
    const w = zone.box.w;
    if (exit.edge === 'left' || exit.edge === 'right') {
      const x = exit.edge === 'left' ? 0 : w;
      let ground = exit.to;
      if (ground == null) {
        // Sans `to` : le sol du bord, plus haute case de la moitié basse de la
        // colonne (une voûte au-dessus ne compte pas).
        const col = exit.edge === 'left' ? 0 : Math.floor((w - 1) / MAP_CELL);
        const tops = zone.cells.filter(([gx]) => gx === col).map(([, gy]) => gy * MAP_CELL);
        const low = tops.filter((t) => t >= 256);
        ground = low.length ? Math.min(...low) : (tops.length ? Math.min(...tops) : 448);
      }
      return { x, y: ground - 48 };
    }
    const x = exit.from != null && exit.to != null ? (exit.from + exit.to) / 2 : w / 2;
    return { x, y: exit.edge === 'top' ? zone.box.top : zone.box.bottom };
  }

  nearKnown(zone, x, y) {
    const C = STORY_MAP_CHUNK;
    for (const dx of [-C, 0, C]) for (const dy of [-C, 0, C]) if (mapChunkKnown(zone, x + dx, y + dy)) return true;
    return false;
  }

  // Hachures d'encre (brouillard), découpées au rectangle.
  drawHatch(g, x, y, w, h, alpha) {
    g.lineStyle(1, MAP_INK, 0.16 * alpha);
    const step = 9;
    for (let c = -h; c < w; c += step) {
      // Segment de la diagonale x - y = c (repère du rectangle), coupé au cadre.
      const x0 = Math.max(c, 0);
      const y0 = x0 - c;
      const x1 = Math.min(c + h, w);
      const y1 = x1 - c;
      if (x1 <= x0) continue;
      g.lineBetween(x + x0, y + h - y0, x + x1, y + h - y1);
    }
  }

  drawFlame(g, x, y, lit, k) {
    if (lit) {
      g.fillStyle(0xffb050, 0.3);
      g.fillCircle(x, y - 5 * k, 8 * k);
    }
    g.fillStyle(0x5a3a22, 1);
    g.fillRect(x - 5 * k, y - 2 * k, 10 * k, 2.5 * k);
    g.fillStyle(lit ? 0xe8622a : 0x9a8466, 1);
    g.fillTriangle(x - 4.5 * k, y - 2 * k, x + 4.5 * k, y - 2 * k, x, y - 13 * k);
    g.fillStyle(lit ? 0xffd25a : 0xcdb98e, 1);
    g.fillTriangle(x - 2 * k, y - 2 * k, x + 2 * k, y - 2 * k, x, y - 7 * k);
  }

  // Chevron rouge qui pointe vers l'extérieur du bord.
  drawChevron(g, x, y, edge, r) {
    const d = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] }[edge] || [1, 0];
    const [ux, uy] = d;
    const px = -uy;
    const py = ux;
    g.fillStyle(MAP_PASSAGE, 0.9);
    g.fillTriangle(x + ux * r, y + uy * r, x - ux * r * 0.4 + px * r * 0.8, y - uy * r * 0.4 + py * r * 0.8,
      x - ux * r * 0.4 - px * r * 0.8, y - uy * r * 0.4 - py * r * 0.8);
  }

  drawPin() {
    const pin = this.pin;
    if (!pin) return;
    pin.clear();
    if (!this.here) return;
    const p = this.toScreen(this.here.x, this.here.y);
    const V = MAP_VIEW;
    const inView = p.x > V.x && p.x < V.x + V.w && p.y > V.y && p.y < V.y + V.h;
    this.pinLabel.setVisible(inView);
    if (!inView) return;
    const y = p.y + this.pinBob.dy;
    pin.fillStyle(0x000000, 0.3);
    pin.fillEllipse(p.x, p.y + 2, 14, 5);
    pin.fillStyle(STORY_UI.pink, 1);
    pin.fillCircle(p.x, y - 18, 7);
    pin.fillTriangle(p.x - 6, y - 14, p.x + 6, y - 14, p.x, y);
    pin.fillStyle(0xffffff, 1);
    pin.fillCircle(p.x, y - 18, 2.6);
    this.pinLabel.setPosition(p.x + 10, y - 30);
  }

  onKey(event) {
    if (this.time.now - this.openedAt < 120) return;
    const k = event.key.toLowerCase();
    if (!event.repeat && (k === 'm' || k === 'escape' || k === 'e')) { this.close(); return; }
    if (k === 'arrowleft' || k === 'q') this.pan(-1, 0);
    else if (k === 'arrowright' || k === 'd') this.pan(1, 0);
    else if (k === 'arrowup' || k === 'z') this.pan(0, -1);
    else if (k === 'arrowdown' || k === 's') this.pan(0, 1);
    else if (k === '+' || k === '=' || k === 'pageup') this.zoomBy(1);
    else if (k === '-' || k === 'pagedown') this.zoomBy(-1);
    else if (k === ' ' || k === 'enter') {
      const f = this.here || this.lastZoneFocus();
      if (f) { this.camX = f.x; this.camY = f.y; this.clampCamera(); this.redraw(); }
    }
  }

  close() {
    this.input.keyboard.off('keydown', this.onKey, this);
    const parent = this.scene.get(this.parentKey);
    this.scene.stop();
    if (this.returnTo) this.scene.resume(this.returnTo);
    else if (parent) releaseStoryInput(parent);
  }
}
