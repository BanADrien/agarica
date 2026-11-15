// Petits décors cassables à l'épée (demande de l'utilisateur du 2026-11-14, « comme les
// éléments dans Hollow Knight ») : buissons, arbustes, branches et mottes de mousse du sous-bois,
// et quelques décors posés à la main (buisson épineux, souches, tronc couché). Un coup de dague, de crocs ou une
// compétence (fracas d'ours, pics de glace) les tranche : il disparaît, des éclats
// à LEUR couleur volent (feuilles coupées, copeaux de bois) et un son de la matière part.
// Purement décoratif : aucune collision, rien à ramasser ; tout repousse à la prochaine visite.
//
// Matières (retour du 2026-11-15 : casser les feuilles vidait trop le décor) :
//   'buisson' : buissons et arbustes, un coup, disparus jusqu'à la prochaine visite ;
//   'bois'    : deux coups (le premier l'entame). Un décor de bois sous un PNJ (Xara sur sa
//               souche) ne casse jamais : il ne fait que perdre des copeaux ;
//   'mousse'  : la mousse TOXIQUE vert fluo (plaques du tunnel des racines, touffes et plaques
//               semées dans l'acte 2 ; decorBreakRegisterMoss), un coup, et elle REPOUSSE en 5 à 7 s.
//   'champignon', 'fleur' (2026-11-15) : mottes à champignons lumineux du sous-bois, champignons,
//               fleurs hautes et pissenlits posés à la main ; un coup, et ils REPOUSSENT en 9 à 13 s.
// Les feuillages, fougères et buissons ne se cassent pas (ils vidaient le décor).
const DECOR_BREAK = {
  buisson: { hp: 1, sfx: 'decor_feuilles', count: 14 },
  bois: { hp: 2, sfx: 'decor_bois', count: 11 },
  mousse: { hp: 1, sfx: 'decor_feuilles', count: 9, regrowMs: [5000, 7000] },
  // 2026-11-15 (« pas assez d'éléments cassables ») : champignons et fleurs, un coup ; ils REPOUSSENT
  // (le décor ne se vide pas, contrairement aux buissons retirés plus tôt).
  champignon: { hp: 1, sfx: 'decor_feuilles', count: 10, regrowMs: [9000, 13000] },
  fleur: { hp: 1, sfx: 'decor_feuilles', count: 12, regrowMs: [9000, 13000] },
};
// Sous-bois (assets/decors/sous_bois_frames, 0 à 13) : 0 = arbuste ; 1 et 3 = gros buissons ronds ;
// 9 et 10 = touffes avec une branche morte. Les autres (feuillages, fleurs, mottes et petits
// champignons) restent intacts.
// (2026-11-15 : les buissons 1 et 3 et le buisson épineux ne se cassent plus, demande de l'utilisateur)
// (2026-11-15 : 6, 8 et 11, les mottes à champignons lumineux, se cassent et repoussent)
const DECOR_BREAK_UNDERGROWTH = { 0: 'bois', 9: 'bois', 10: 'bois', 6: 'champignon', 8: 'champignon', 11: 'champignon' };
// Décors posés à la main (`props` des zones) : seulement ceux-ci.
const DECOR_BREAK_PROPS = {
  foret_sombre_souche_champignons: 'bois', foret_corrompue_souche_corrompue: 'bois', foret_sombre_tronc_couche: 'bois',
  // ajoutés le 2026-11-15 : petits décors sans rôle (ni plateforme, ni appui)
  bosquet_tree_stump: 'bois', grand_arbre_morceaux_ecorce: 'bois', foret_corrompue_racine_tordue: 'bois',
  foret_corrompue_os_creature: 'bois',
  foret_sombre_champignons_lumineux: 'champignon', grand_arbre_champignon_etagere: 'champignon',
  foret_corrompue_champignon_toxique: 'champignon',
  foret_flottante_fleurs_hautes: 'fleur', foret_flottante_pissenlit_geant: 'fleur', hutte_morgat_pot_fleurs: 'fleur',
  // mousse toxique en boule ou en cocon : frappable comme les plaques (repousse)
  foret_corrompue_pustule_mousse: 'mousse', foret_corrompue_cocon_mousse: 'mousse',
};

function decorBreakRegister(scene, img, kind) {
  if (!scene || !img || !DECOR_BREAK[kind]) return;
  if (!scene.__breakDecor) scene.__breakDecor = [];
  scene.__breakDecor.push({ img, kind, hp: DECOR_BREAK[kind].hp, broken: false, lastHit: -1 });
}

function decorBreakRegisterUndergrowth(scene, img, variant) {
  if (DECOR_BREAK_UNDERGROWTH[variant]) decorBreakRegister(scene, img, DECOR_BREAK_UNDERGROWTH[variant]);
}

// Mousse toxique décorative (acte1_arbre.js, acte2.js) : frappable, repousse vite.
// `extra` : images jumelles à cacher et à remontrer avec elle (touffe penchée de l'acte 2).
function decorBreakRegisterMoss(scene, img, extra = []) {
  decorBreakRegister(scene, img, 'mousse');
  const d = scene.__breakDecor && scene.__breakDecor[scene.__breakDecor.length - 1];
  if (d && d.img === img) d.extra = extra.filter(Boolean);
}

// Mousse toxique posée à la main dans une zone (éditeur) : frappable comme celle semée par l'histoire.
const DECOR_BREAK_MOSS_PROP = /^decor_(mousse_(lumineuse|plaque)_|touffe_mousse_|tapis_mousse)/;

function decorBreakRegisterProp(scene, img, type) {
  if (DECOR_BREAK_MOSS_PROP.test(type || '')) { decorBreakRegisterMoss(scene, img); return; }
  // (un décor de BOIS accroché, penché ou posé librement ne casse pas : `__noPropSurface` ; champignons,
  // fleurs et mousses cassent où qu'ils soient)
  const kind = DECOR_BREAK_PROPS[type];
  if (kind && (kind !== 'bois' || !img.__noPropSurface)) decorBreakRegister(scene, img, kind);
}

// Quelques couleurs prises dans l'image même (pixels opaques tirés au hasard) : les éclats
// d'un buisson violet sont violets, ceux d'une souche sont bruns.
function decorBreakColors(scene, img) {
  if (img.__breakColors) return img.__breakColors;
  const out = [];
  const f = img.frame;
  for (let i = 0; i < 60 && out.length < 6; i++) {
    const px = scene.textures.getPixel(Math.floor(Math.random() * f.width), Math.floor(f.height * (0.15 + Math.random() * 0.7)), img.texture.key, f.name);
    if (px && px.alpha > 200) out.push(px.color);
  }
  img.__breakColors = out.length ? out : [0x6fbf5a, 0x4f9a48];
  return img.__breakColors;
}

function decorBreakBurst(scene, d, dir, strong) {
  const img = d.img;
  const b = img.getBounds();
  const colors = decorBreakColors(scene, img);
  const n = Math.round(DECOR_BREAK[d.kind].count * (strong ? 1 : 0.45));
  if (typeof ursideFxAdd !== 'function') return;
  for (let i = 0; i < n; i++) {
    const leaf = d.kind !== 'bois';   // feuilles, mousse, champignons, pétales : éclats légers
    ursideFxAdd(scene, {
      x: b.x + Math.random() * b.width, y: b.y + b.height * (0.15 + Math.random() * 0.55),
      // feuilles : petits carrés légers qui retombent lentement ; bois : éclats allongés, plus vifs
      w: leaf ? (i % 3 ? 4 : 6) : 6 + (i % 2) * 2, h: leaf ? 4 : 2,
      color: colors[i % colors.length],
      vx: dir * (40 + Math.random() * (leaf ? 110 : 190)) + (Math.random() - 0.5) * 120,
      vy: -(leaf ? 90 : 150) - Math.random() * (leaf ? 110 : 150), gy: leaf ? 330 : 760,
      ms: (leaf ? 520 : 380) + Math.random() * 260,
    });
  }
}

function decorBreakHit(scene, d, dir) {
  const img = d.img;
  const cfg = DECOR_BREAK[d.kind];
  d.hp -= 1;
  // Un PNJ posé dessus (Xara sur sa souche) : entamé, jamais cassé.
  if (d.hp <= 0 && d.kind === 'bois' && img.propType && scene.npcs) {
    const b = img.getBounds();
    if (Object.values(scene.npcs).some((n) => n && n.active && n.x > b.x && n.x < b.right)) d.hp = 1;
  }
  const broke = d.hp <= 0;
  decorBreakBurst(scene, d, dir, broke);
  if (typeof playSfx === 'function') playSfx(broke ? cfg.sfx : `${cfg.sfx}_coup`);
  if (broke) {
    d.broken = true;
    // Tranché : le décor disparaît en entier (retour du 2026-11-14 : ne rien laisser en bas).
    img.setVisible(false);
    (d.extra || []).forEach((e) => e.setVisible(false));
    if (typeof juiceShake === 'function') juiceShake(scene, 'tiny');
    // La mousse repousse : elle ressort du sol en 5 à 7 s, de nouveau frappable.
    if (cfg.regrowMs) {
      const sy = img.scaleY;
      scene.time.delayedCall(cfg.regrowMs[0] + Math.random() * (cfg.regrowMs[1] - cfg.regrowMs[0]), () => {
        if (!img.active) return;
        img.setVisible(true);
        (d.extra || []).forEach((e) => e.active && e.setVisible(true));
        d.broken = false;
        d.hp = cfg.hp;
        scene.tweens.add({ targets: img, scaleY: { from: sy * 0.1, to: sy }, duration: 420, ease: 'Back.easeOut' });
      });
    }
  }
  // Entamé sans casser (bois, 1er coup) : secoué par le coup, retour élastique.
  if (!broke) {
    const sx = img.scaleX;
    scene.tweens.add({ targets: img, scaleX: { from: sx * 1.12, to: sx }, duration: 180, ease: 'Back.easeOut' });
  }
}

function decorBreakUpdate(scene) {
  const list = scene.__breakDecor;
  const p = scene.player;
  if (!list || !list.length || !p || !p.active) return;
  const rects = [];
  const melee = typeof p.getAttackHitbox === 'function' ? p.getAttackHitbox() : null;
  if (melee) rects.push([melee, p.attackEndTime]);
  const skill = typeof p.getSkillHitbox === 'function' ? p.getSkillHitbox() : null;
  if (skill) rects.push([skill, `s${p.skillActiveUntil}`]);
  // Pics de glace de l'ours polaire (leurs propres zones, Ursides.js).
  const st = scene.__ursideFx;
  if (st && st.spikes) for (const s of st.spikes) if (s.popped && !s.decorDone) { s.decorDone = true; rects.push([s.rect, `g${s.castId}-${s.index}`]); }
  if (p.grizzlyCharging && p.body) rects.push([new Phaser.Geom.Rectangle(p.body.x, p.body.y, p.body.width, p.body.height), `c${p.grizzlyChargeId}`]);
  if (!rects.length) return;
  for (const d of list) {
    if (d.broken || !d.img.active) continue;
    const b = d.img.getBounds();
    // Cœur de l'image : les bords transparents ne comptent pas.
    // (remonté de 28 px : les touffes basses sont à moitié dans l'herbe, un coup donné à hauteur
    // du corps doit quand même les trancher)
    const core = new Phaser.Geom.Rectangle(b.x + b.width * 0.2, b.y - 28, b.width * 0.6, b.height + 28);
    for (const [r, id] of rects) {
      if (d.lastHit === id || !Phaser.Geom.Intersects.RectangleToRectangle(r, core)) continue;
      d.lastHit = id;
      decorBreakHit(scene, d, core.centerX >= p.x ? 1 : -1);
      break;
    }
  }
}

if (typeof LEVEL_UPDATE_HOOKS !== 'undefined') LEVEL_UPDATE_HOOKS.push((scene) => decorBreakUpdate(scene));
