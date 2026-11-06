// Dialogues, cinématiques et scripts des zones du grand arbre — agent Acte 1 (arbre).
//
// Zones (cf. docs/production/PLAN_DEV.md, progression 4 à 7) — ordre décidé
// par l'utilisateur (2026-10-25 : « pas de phase avec singe ancestral,
// allume juste le totem à l'origine comme les autres ») :
//   foret_sombre_2 → grand_arbre_racines : TOTEM DU SINGE au bout de la
//   grande branche (E : il s'allume et donne DIRECTEMENT la forme singe,
//   comme les totems du loup et de l'aigle -- clé de zone `totems`,
//   addAbilityShrine) → lianes de la cime (forme singe obligatoire) →
//   grand_arbre_arene (Kainati, src/story/boss_kainati.js, épargné) →
//   foret_flottante_1 (acte 2).
//   Optionnel : racines ⇄ epreuve_singe (talisman du singe), par les lianes
//   de la branche d'élan, en forme singe (avant ou après Kainati).
//   Le monde spirituel (esprit simien ancestral) n'est PLUS sur le chemin :
//   zone gardée telle quelle (réversible), atteinte seulement depuis
//   « Zones de test » ; une ancienne sauvegarde qui s'y était arrêtée
//   retombe devant le totem des racines (ZONE_SCRIPTS.monde_spirituel).
// Chargé APRÈS boss_kainati.js : les textes de Kainati (`kainati_intro`,
// `kainati_victoire`, `kainati_calme`) remplacent ceux par défaut.
//
// Flags posés ici : totemSingeActif (totem allumé, posé avec hasMonkeyForm),
// talismanSinge (+ compétence pierre) ; hasMonkeyForm est posé par le totem
// (LevelKit) ; mondeSpirituelFini ne l'est plus que par la zone de test et
// ne bloque plus rien ; + flags automatiques de StoryKit (trig_*, pickup_*).

// ---------------------------------------------------------------------------
// Petits utilitaires
// ---------------------------------------------------------------------------
// Fente lumineuse dans l'écorce (passage vers l'épreuve, raccourci du
// sommet, retour du monde spirituel). Contrat PLAN_INTEGRATION_LOT_8 §3.3 :
//   arbreGlowPassage(scene, x, y, h = 120, color, open = true)
//     → { glow, core, art, setOpen(v) }
// `y` = centre de l'ancienne amande dessinée ; avec l'art Codex
// (`decor_fente_ouverte` / `_fermee`, 440 px source), l'écorce est POSÉE sur
// la surface sous ce centre (bas en storyStandY + 2 : on la voit sortir du
// bois, pas flotter), `h` px de haut, devant un halo doux `fx_halo_doux`
// teinté `color` qui respire. `glow` et `core` portent `__sx` / `__sy`
// (échelles de repos) : les appelants tweenent scaleX / scaleY, jamais
// `scale` (l'image est à h / 440 : `scale: 1` la gonflerait à 440 px).
// Le cœur n'est jamais teinté (R11 : au monde spirituel, seul le halo est
// cyan, l'écorce garde sa couleur). Sans l'art : les ellipses d'avant
// (rien pour une fente fermée) et un setOpen() sans effet.
function arbreGlowPassage(scene, x, y, h = 120, color = 0xbfe8a0, open = true) {
  const key = open ? 'item-decor_fente_ouverte' : 'item-decor_fente_fermee';
  if (scene.textures.exists(key)) {
    const by = storyStandY(scene, x, y + h / 2) + 2;
    const ht = typeof juiceTexture === 'function' ? juiceTexture(scene, 'fx_halo_doux', 'juice-glow') : null;
    let glow = null;
    if (ht) {
      // Halo peint (réimport M04) : ~25 % de lumière en moins qu'un disque
      // plein à taille égale -- même compensation que les halos de LevelKit.
      const boost = ht.art && typeof JUICE_HALO_ART_BOOST === 'number' ? JUICE_HALO_ART_BOOST : 1;
      glow = scene.add.image(x, by - h / 2, ht.key).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(color).setDisplaySize(h * 0.9 * boost, h * 1.1 * boost).setAlpha(0.3);
      glow.__sx = glow.scaleX;
      glow.__sy = glow.scaleY;
      storyPutBehindPlayer(scene, glow);
      scene.tweens.add({ targets: glow, alpha: 0.65, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const core = scene.add.image(x, by, key).setOrigin(0.5, 1).setScale(h / 440);
    core.__sx = core.scaleX;
    core.__sy = core.scaleY;
    // Après le halo : le cœur passe devant lui (et toujours sous Agarica).
    storyPutBehindPlayer(scene, core);
    return {
      glow, core, art: true,
      setOpen(v) {
        const k = v ? 'item-decor_fente_ouverte' : 'item-decor_fente_fermee';
        if (core.active && scene.textures.exists(k)) core.setTexture(k);
      },
    };
  }
  if (!open) return { glow: null, core: null, art: false, setOpen() {} };
  const glow = scene.add.ellipse(x, y, 70, h, color, 0.3);
  const core = scene.add.ellipse(x, y, 40, h - 24, 0x1a1428, 0.9);
  glow.__sx = 1; glow.__sy = 1; core.__sx = 1; core.__sy = 1;
  storyPutBehindPlayer(scene, glow);
  storyPutBehindPlayer(scene, core);
  scene.tweens.add({ targets: glow, alpha: 0.65, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return { glow, core, art: false, setOpen() {} };
}

// Lucioles / poussières de lumière qui montent lentement (décor, en boucle).
// Grain peint `fx_grain_lumiere` (livré blanc pour être teinté) en ADD, à
// 2,6 × le diamètre de l'ancien point : le grain n'occupe qu'une partie de
// son canevas de 128 px (halo, éclats). Sans l'art : le point dessiné.
function arbreMotes(scene, x1, x2, y1, y2, count, colors) {
  const art = scene.textures.exists('item-fx_grain_lumiere');
  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.Between(x1, x2);
    const y = Phaser.Math.Between(y1, y2);
    const r = Phaser.Math.FloatBetween(1.5, 3.5);
    const color = colors[i % colors.length];
    const m = art
      ? scene.add.image(x, y, 'item-fx_grain_lumiere').setScale((2 * r * 2.6) / 128).setTint(color)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.7).setDepth(3)
      : scene.add.circle(x, y, r, color, 0.7).setDepth(3);
    scene.tweens.add({
      targets: m,
      y: m.y - Phaser.Math.Between(60, 160),
      x: m.x + Phaser.Math.Between(-30, 30),
      alpha: { from: 0, to: 0.8 },
      duration: Phaser.Math.Between(2600, 4800),
      delay: Phaser.Math.Between(0, 3000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

// Plaques de mousse décoratives (tunnel des racines), sans corps. Art Codex :
// - sol (`decor_mousse_lumineuse_sol`, 287 px source) : `w` px de large,
//   bas sur la surface de marche réelle (+2 : posée dans l'herbe) ;
// - plafond (`flip`, `decor_mousse_lumineuse_plafond`, 318 px) : accrochée
//   par son haut en `y` (296 : rentrée de quelques px sous le dessous visible
//   du toit du tunnel, ~302 ; à 302 tout juste, elle flottait sous l'écorce) ;
// - petite touffe des branches (w ≤ 50, `decor_mousse_lumineuse_petite`) à
//   0,3 (45 px) : la plaque du sol, réduite, s'écrasait en tache.
// Sans l'art : les pastilles dessinées d'avant.
function arbreMossDecor(scene, x, y, w, flip = false) {
  const id = flip ? 'decor_mousse_lumineuse_plafond' : w <= 50 ? 'decor_mousse_lumineuse_petite' : 'decor_mousse_lumineuse_sol';
  if (scene.textures.exists(`item-${id}`)) {
    const img = scene.add.image(x, y, `item-${id}`);
    if (flip) {
      img.setOrigin(0.5, 0).setScale(w / 318);
    } else {
      img.setOrigin(0.5, 1).setScale(id === 'decor_mousse_lumineuse_petite' ? 0.3 : w / 287);
      img.y = storyStandY(scene, x, y) + 2;
    }
    storyPutBehindPlayer(scene, img);
    return img;
  }
  const g = scene.add.graphics({ x, y });
  storyPutBehindPlayer(scene, g);
  const rnd = new Phaser.Math.RandomDataGenerator([`arbre${x},${y}`]);
  const dir = flip ? 1 : -1; // pousse vers le haut (sol) ou vers le bas (plafond)
  for (let i = 0; i < 6; i++) {
    g.fillStyle(i % 2 ? 0x3e7a2c : 0x2f5a2a, 0.95);
    g.fillCircle(rnd.realInRange(-w / 2, w / 2), dir * rnd.realInRange(2, 12), rnd.realInRange(6, 12));
  }
  for (let i = 0; i < 5; i++) {
    g.fillStyle(0x9bff5a, 0.7).fillCircle(rnd.realInRange(-w / 2, w / 2), dir * rnd.realInRange(2, 14), rnd.realInRange(1.5, 3));
  }
  return g;
}

// Pierre qui tombe des branches supérieures, télégraphiée par une ombre qui
// grandit sur la branche (`surfaceY`). Tout en tweens : la démo de la
// cinématique fonctionne monde gelé ; les dégâts, eux, attendent le dégel.
// Ombre qui annonce une pierre (racines et épreuve) : ellipse peinte
// `fx_ombre_sol` (bord doux) à la taille de l'ancienne ellipse, ou l'ellipse
// dessinée sans l'art. Renvoie l'objet et les cibles du télégraphe, RELATIVES
// à l'échelle de base de l'image (§3.1 : `scaleX: 3` sur une image à 0,17
// l'aurait gonflée à 380 px) ; avec l'art, alpha cible × 1,3 (plafonné à 1) :
// le bord doux éclaircit l'ombre, qui doit rester lisible sur l'herbe.
// Taille, durée et position inchangées : seul le dessin change.
function arbreRockShadow(scene, x, y, w, h, alpha, growX, growY, alphaTo, ms = 1000) {
  const marker = arbreDangerMarker(scene, x, y, w * growX, h * growY, ms);
  if (scene.textures.exists('item-fx_ombre_sol')) {
    const s = scene.add.image(x, y, 'item-fx_ombre_sol').setDisplaySize(w, h).setAlpha(alpha).setDepth(990);
    return { obj: s, marker, to: { scaleX: s.scaleX * growX, scaleY: s.scaleY * growY, alpha: Math.min(1, alphaTo * 1.3) } };
  }
  const s = scene.add.ellipse(x, y, w, h, 0x12000c, 1).setAlpha(alpha).setDepth(990);
  return { obj: s, marker, to: { scaleX: growX, scaleY: growY, alpha: alphaTo } };
}

// Marqueur rouge au ras du sol, sous l'ombre (même anneau que la pierre de la
// canopée de Kainati, `fx_marqueur_danger`, Kainati.js) : l'ombre seule, sombre
// sur une écorce sombre, ne se voyait presque pas (revue du 2026-11-05, ~10 L*
// d'écart) alors qu'elle est le seul signal avant la pierre et que Xara dit de
// la regarder. Il grandit avec l'ombre et pulse ; détruit à l'impact
// (arbreClearRockShadow). Sans l'art : rien de plus, l'ombre reste le signal.
function arbreDangerMarker(scene, x, y, wEnd, hEnd, ms) {
  if (!scene.textures.exists('item-fx_marqueur_danger')) return null;
  const m = scene.add.image(x, y, 'item-fx_marqueur_danger').setDisplaySize(40, 10)
    .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(990);
  const born = scene.time.now;
  // Taille finale : un peu plus large que l'ombre pleine, comme chez Kainati.
  const W = Math.max(40, wEnd * 1.6);
  const H = Math.max(14, hEnd * 1.3);
  m.__tick = scene.time.addEvent({
    delay: 16, loop: true,
    callback: () => {
      if (!m.active) return;
      const t = scene.time.now - born;
      const e = Math.sin((Math.min(1, t / ms) * Math.PI) / 2);
      m.setDisplaySize(40 + (W - 40) * e, 10 + (H - 10) * e)
        .setAlpha(Math.min(1, t / 120) * (0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t / 80))));
    },
  });
  return m;
}

// Retire l'ombre et son marqueur (impact de la pierre).
function arbreClearRockShadow(sh) {
  if (sh.obj && sh.obj.active) sh.obj.destroy();
  const m = sh.marker;
  if (!m) return;
  if (m.__tick) m.__tick.remove(false);
  if (m.active) m.destroy();
}

function arbreDropRock(scene, x, surfaceY, telegraph = 1000) {
  // Opacité portée par l'objet (pas par le remplissage) : le tween d'alpha
  // ci-dessous la fait monter jusqu'à 0,6 (avant : ~0,15, invisible sur l'herbe).
  const sh = arbreRockShadow(scene, x, surfaceY - 3, 22, 8, 0.25, 3, 2.2, 0.6, telegraph);
  const shadow = sh.obj;
  scene.tweens.add({
    targets: shadow,
    ...sh.to,
    duration: telegraph,
    ease: 'Sine.easeIn',
    onComplete: () => {
      if (!scene.sys || !scene.sys.isActive()) { arbreClearRockShadow(sh); return; }
      const rock = typeof addKainatiStoneImage === 'function'
        ? addKainatiStoneImage(scene, x, surfaceY - 320)
        : scene.add.circle(x, surfaceY - 320, 12, 0x6d6a70).setStrokeStyle(2, 0x1e1a24).setDepth(991);
      let hit = false;
      scene.tweens.add({
        targets: rock,
        y: surfaceY - 12,
        angle: 200,
        duration: 340,
        ease: 'Quad.easeIn',
        onUpdate: () => {
          const p = scene.player;
          if (hit || !p || !p.body || isWorldFrozen(scene)) return;
          const b = p.body;
          const circle = new Phaser.Geom.Circle(rock.x, rock.y, 12);
          if (Phaser.Geom.Intersects.CircleToRectangle(circle, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) {
            hit = true;
            p.hitByEnemy();
          }
        },
        onComplete: () => {
          arbreClearRockShadow(sh);
          if (typeof spawnKainatiImpact === 'function') spawnKainatiImpact(scene, rock.x, surfaceY);
          rock.destroy();
          if (!hit && scene.player && Math.abs(scene.player.x - x) < 300) scene.cameras.main.shake(90, 0.003);
        },
      });
    },
  });
}

// ---------------------------------------------------------------------------
// 4. RACINES DU GRAND ARBRE
// ---------------------------------------------------------------------------
CUTSCENES.racines_intro = [
  // Arrivée au grand arbre (révélation) : court, avec la caméra qui monte.
  { say: [
    { who: 'agarica', text: 'Oh… Je n\'avais jamais vu un arbre pareil. La piste du loup grimpe tout droit dans ses racines.' },
    { who: 'xara', text: 'Alors grimpons. Doucement : cet arbre a un roi, et il n\'aime pas qu\'on monte sans y être invitée.' },
  ] },
  { camera: { x: 1800, y: -160, ms: 1600 } },
  { wait: 700 },
  { cameraFollow: true },
  { toast: 'Le grand arbre se gravit : de racine en branche, jusqu\'à la cime.' },
];

CUTSCENES.racines_tunnel = cutsceneBulles([
  'Tu sens ? La mousse remonte les racines, vers le cœur de l\'arbre.',
  { who: 'agarica', text: 'Et ces griffures dans l\'écorce… De petites mains.' },
  'Des singes. D\'habitude, ils sont plus… accueillants.',
]);

CUTSCENES.racines_lianes = cutsceneBulles([
  'Regarde, à gauche : des lianes au-dessus du vide. Elles mènent à une fente dans l\'écorce.',
  { who: 'agarica', text: 'Elles pendent bien trop loin du bord… Je ne pourrais jamais m\'y accrocher.' },
  'Pas avec des mains de druidesse. Il faudrait celles d\'un singe. Garde cet endroit en tête.',
]);

CUTSCENES.racines_lianes_singe = cutsceneBulles([
  'Les lianes de tout à l\'heure… Cette fois, elles te porteront.',
  'Par là, à gauche. L\'épreuve de son peuple t\'attend, si tu le veux.',
]);

CUTSCENES.racines_pierres = cutsceneBulles((scene) => {
  // Une première pierre, pour montrer l'ombre qui l'annonce (sans rien geler).
  arbreDropRock(scene, scene.player.x + 120, GRAND_ARBRE_RACINES_DATA.rockfall.surfaceY, 900);
  return [
    'Attention ! Ça tombe de là-haut. Regarde l\'ombre grandir : ne reste pas dessous.',
    { who: 'agarica', text: 'Quelqu\'un nous les lance… Les singes ?' },
  ];
});

// Bout de la grande branche, sans la forme singe : le vide de la cime, ses
// lianes hors d'atteinte… et le totem.
CUTSCENES.racines_cime = cutsceneBulles([
  'La cime est de l\'autre côté de ce vide. Il n\'y a que ces lianes pour y aller.',
  { who: 'agarica', text: 'Bien trop loin pour mes mains. Et ce totem… un singe sculpté.' },
  'Il dort. Pose ta main dessus : ce bois-là a une âme.',
], 'Le totem du singe : approche-toi et appuie sur E.');

// Forme singe déjà en main en arrivant au bout de la branche (ancienne
// sauvegarde : forme reçue au monde spirituel, avant la décision du
// 2026-10-25) : rappel des lianes de la cime. Le totem allumé pendant la
// visite joue `racines_singe_eveil` à la place (et coche ce déclencheur).
CUTSCENES.racines_cime_singe = cutsceneBulles([
  'Tes mains de singe, maintenant. Saute, puis saute encore : une fois singe, tu saisis les lianes jusqu\'à la cime.',
  { who: 'agarica', text: 'Et là-haut, le roi des singes. Je ne veux pas me battre contre lui.' },
  'Prends de l\'élan, lâche quand la liane remonte.',
], 'Lianes : double saut pour devenir singe et s\'y accrocher\n← → pour se balancer · Espace pour lâcher · Z/S pour monter/descendre');

// Totem du singe allumé (E, clé de zone `totems` -> addAbilityShrine, comme
// le loup et l'aigle) : la forme est donnée sur-le-champ, avec l'éclat et la
// bannière du totem. Ensuite, une seule bulle de Xara et le rappel des
// lianes, APRÈS la bannière (~2,6 s, même délai que le loup en forêt
// sombre 2) : la route des lianes de la cime mène à l'arène.
CUTSCENES.racines_singe_eveil = cutsceneBulles([
  'Les mains du peuple singe ! Saute, puis saute encore près d\'une liane : une fois singe, tu la saisis.',
], { text: 'Lianes : double saut pour devenir singe et s\'y accrocher\n← → se balancer · Espace : lâcher · Z/S : monter/descendre', ms: 5600 }, 2600);

// Le totem lui-même est une donnée de zone (`totems`, grand_arbre_racines_data.js) :
// art `totem_monkey_lit` tant que la forme attend, puis `totem_monkey_dim` une
// fois prise, comme les autres totems (addAbilityShrine), invite « E : se recueillir »
// maintenue dans l'écran (le totem est haut sur la branche).

// Lumière de la cime : rai peint `fx_rai_lumiere` (bas en 3170, -192, au
// milieu du vide des lianes ; 120x240), teinté miel, en ADD, qui respire.
// Sans l'art : l'ellipse d'avant, au-dessus de la corniche de la cime.
function arbreCimeLight(scene, levelWidth) {
  if (scene.textures.exists('item-fx_rai_lumiere')) {
    const ray = scene.add.image(3170, -192, 'item-fx_rai_lumiere').setOrigin(0.5, 1).setDisplaySize(120, 240)
      .setTint(0xffe9a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.2);
    storyPutBehindPlayer(scene, ray);
    scene.tweens.add({ targets: ray, alpha: 0.4, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return ray;
  }
  const cime = scene.add.ellipse(levelWidth - 50, -300, 120, 220, 0xffe9a8, 0.12);
  storyPutBehindPlayer(scene, cime);
  scene.tweens.add({ targets: cime, alpha: 0.25, duration: 1600, yoyo: true, repeat: -1 });
  return cime;
}

// Singes corrompus de la GRANDE BRANCHE HAUTE (au-dessus du sol, à l'est de
// la branche intermédiaire) : ceux qui ont le totem du singe à portée. Le
// singe du toit de racines (y 150, x < 1200) n'est pas concerné.
const ARBRE_TOTEM_CALM_MS = 8000;   // bannière (~2,6 s) + bulle de Xara (5,2 s)
const ARBRE_ARRIVAL_CALM_MS = 5000; // fondu d'arrivée + quelques pas
function arbreCalmBranchMonkeys(scene, ms) {
  if (typeof calmSingesCorrompus !== 'function') return 0;
  return calmSingesCorrompus(scene, (e) => e.y < 0 && e.x > 2200, ms);
}

// Cases traversables par en dessous (on retombe dessus) : la marche d'une case
// au bout du toit (x 1280-1344, y 256-320). Au pied de la butte, la niche de
// 64 px (x 1344-1408) est plus étroite que le loup (86 px) : en sprint, il
// passait en partie sous la marche et chaque saut s'y cognait (0 passage sur 6,
// Maj tenue). Élargir la niche cassait le saut butte → marche à pied ; ainsi les
// deux passent. Rectangles monde [x0, y0, x1, y1] ; collision gardée en dessus
// et sur les côtés.
const ARBRE_RACINES_ONE_WAY = [[1280, 256, 1344, 320]];
function arbreOneWayCells(scene, rects) {
  const bodies = scene.ground && scene.ground.getChildren ? scene.ground.getChildren() : [];
  for (const o of bodies) {
    const b = o.body;
    if (!b) continue;
    const inside = rects.some(([x0, y0, x1, y1]) => b.left >= x0 - 1 && b.right <= x1 + 1 && b.top >= y0 - 1 && b.bottom <= y1 + 1);
    if (inside) b.checkCollision.down = false;
  }
}

ZONE_SCRIPTS.grand_arbre_racines = {
  create(scene, data) {
    // `hadMonkey` : forme singe déjà là en arrivant ; sinon, le totem
    // (LevelKit) la donne pendant la visite -> bulle de Xara (cf. update).
    const st = { cfg: (data && data.rockfall) || null, timer: 600, hadMonkey: !!storyGet('hasMonkeyForm') };
    scene.__arbre = st;
    const levelWidth = (data && data.levelWidth) || 3840;
    // Le tronc est la clé de zone `trunks` (cf. BrancheKit.js), juste derrière
    // le plan de jeu : plus de tronc dessiné ici ni de collage de pans d'écorce.
    // Décors `grand_arbre_tronc_*` de la donnée : derrière les branches (les
    // décors sont sinon dessinés devant les tuiles).
    sendBehindFrontGround(scene, (scene.props || []).filter((p) => p.propType && p.propType.startsWith('grand_arbre_tronc_')));
    // (Bord droit : un mur, hors du passage de la corniche, cf. sorties de bord.)
    // La fente de l'épreuve du singe, au bout des lianes (corniche gauche).
    arbreGlowPassage(scene, 40, -190, 120);
    // Lumière de la cime, au-dessus du vide des lianes (route de l'arène).
    arbreCimeLight(scene, levelWidth);
    // La mousse dense qui remonte le tunnel (sol et plafond), puis quelques
    // touffes sur les branches (§5 : 330 et 1110 évitent l'écorce et les
    // pierres ; 1950 est sur la branche intermédiaire, le tronc dessiné qui
    // la portait à -192 a été retiré).
    [330, 560, 900, 1110].forEach((x, i) => arbreMossDecor(scene, x, 448, 70 + (i % 2) * 20));
    [500, 760, 1120].forEach((x) => arbreMossDecor(scene, x, 296, 60, true));
    [[1530, 64], [1950, -64], [2420, -192], [2560, -192]].forEach(([x, y]) => arbreMossDecor(scene, x, y, 50));
    arbreMotes(scene, 1300, levelWidth - 100, -500, 400, 18, [0x9bff5a, 0xbfe8a0, 0xff9ad5]);
    // (Le totem du singe, au bout de la grande branche, est la clé de zone
    // `totems` : LevelKit le pose et le gère comme les autres totems.)
    // Arrivée DEVANT le totem (entrée `totem_singe` : ancienne sauvegarde du
    // monde spirituel) : à portée du singe de la grande branche, qui tirait
    // avant même le fondu d'arrivée (2 cœurs en 3,5 s). Il se calme le temps
    // de se repérer ; la suite (patrouille, lancers) est inchangée.
    const sd = (scene.sys.settings && scene.sys.settings.data) || {};
    if (sd.enterId === 'totem_singe') arbreCalmBranchMonkeys(scene, ARBRE_ARRIVAL_CALM_MS);
    arbreOneWayCells(scene, ARBRE_RACINES_ONE_WAY);
  },

  update(scene, time, delta) {
    const st = scene.__arbre;
    const cfg = st && st.cfg;
    const p = scene.player;
    // Totem du singe allumé pendant la visite (LevelKit pose hasMonkeyForm) :
    // le totem reste allumé (`totemSingeActif`, gardé pour les sauvegardes et
    // les chapitres), Xara rappelle les lianes ; le rappel du bout de la
    // branche (`cime_singe`) n'a plus lieu d'être.
    if (st && !st.hadMonkey && storyGet('hasMonkeyForm')) {
      st.hadMonkey = true;
      storySet({ totemSingeActif: true, trig_grand_arbre_racines_cime_singe: true });
      // Le monde n'est pas gelé pendant la bannière « Forme du singe » (~2,6 s)
      // puis la bulle de Xara (5,2 s) : le singe de la grande branche, à
      // portée du totem, la bombardait pendant qu'elle lisait (bannière
      // par-dessus, pierre invisible : 3 cœurs perdus en 9 s). Il se calme
      // le temps de ce moment-là ; ses pierres en vol se brisent.
      arbreCalmBranchMonkeys(scene, ARBRE_TOTEM_CALM_MS);
      runCutscene(scene, 'racines_singe_eveil');
    }
    // Le feu de camp de la fourche sert aussi de point de reprise : une
    // chute de cœurs plus haut ne renvoie pas tout en bas de l'arbre.
    if (st && p && !st.forkSpawn && p.body.blocked.down && p.x > 1344 && p.x < 1728 && p.y < 100 && p.y > 0) {
      st.forkSpawn = true;
      p.spawnX = 1600;
      p.spawnY = 60;
    }
    // Les guetteurs de Kainati se taisent une fois leur roi apaisé.
    if (!cfg || !p || storyGet('kainatiDefeated')) return;
    const onBranch = p.x > cfg.x1 - 80 && p.x < cfg.x2 + 80 && p.y < cfg.surfaceY + 40 && p.y > cfg.surfaceY - 260;
    if (!onBranch) { st.timer = Math.min(st.timer, 600); return; }
    st.timer -= delta;
    if (st.timer > 0) return;
    st.timer = cfg.every;
    // Visée : un peu devant Agarica, pour qu'elle doive lire l'ombre et s'arrêter/accélérer.
    const lead = Phaser.Math.Clamp(p.body.velocity.x * 0.45, -160, 160);
    const x = Phaser.Math.Clamp(p.x + lead + Phaser.Math.Between(-30, 30), cfg.x1, cfg.x2);
    arbreDropRock(scene, x, cfg.surfaceY, cfg.telegraph);
  },
};

// ---------------------------------------------------------------------------
// 5. ARÈNE — textes de Kainati (le combat : src/story/boss_kainati.js)
// ---------------------------------------------------------------------------
// Kainati est digne et protecteur : la mousse l'a rendu méfiant et colérique,
// pas mauvais. Agarica arrive avec les mains de ses ancêtres (forme singe) :
// il y voit un vol. Épargné, il reconnaît son combat et lui ouvre la route
// des hauteurs.
DIALOGUES.kainati_intro = [
  { who: 'kainati', text: 'Halte, enfant d\'en bas ! Qui t\'a appris à courir sur mes lianes ?' },
  { who: 'agarica', text: 'Le totem de ton peuple, au bout de la grande branche. Il s\'est allumé sous ma main.' },
  { who: 'kainati', text: 'Mensonge ! Tu portes l\'odeur de la mousse… Elle grimpe le long de mon arbre depuis des lunes, et voilà qu\'elle t\'envoie.' },
  { who: 'xara', text: 'Agarica, regarde ses yeux. Ce n\'est pas lui qui parle : c\'est la mousse.' },
  { who: 'kainati', text: 'Assez ! Ma colère va secouer cet arbre jusqu\'aux racines. Reste au sol, si tu l\'oses !' },
];

DIALOGUES.kainati_victoire = [
  { who: 'kainati', text: '…' },
  { who: 'kainati', text: 'Le bourdonnement… s\'est tu. La brume quitte mes yeux.' },
  { who: 'kainati', text: 'Tu aurais pu me jeter au bas de mon arbre. Tu ne l\'as pas fait.' },
  { who: 'agarica', text: 'Ce n\'était pas toi, c\'était la mousse. Je la combats : elle ronge toute la forêt.' },
  { who: 'kainati', text: 'Alors nous avons le même ennemi. Elle s\'était glissée en moi comme la sève dans le bois… et j\'ai pris une enfant des bois pour une ennemie.' },
  { who: 'kainati', text: 'Tu portes bien les mains de mon peuple. Pardonne au vieux roi.' },
  { who: 'kainati', text: 'La route des hauteurs continue vers l\'est, au-delà de ma cime. Elle est à toi.' },
  { who: 'xara', text: 'Il est à bout de forces. Laissons-le se reposer.' },
];

// Filet (ancienne sauvegarde ou démarrage de test sans la forme singe) : la
// route des hauteurs l'exige -- Xara renvoie vers le totem des racines.
CUTSCENES.arene_sans_singe = [
  { call: (scene) => storyBulles(scene, [
    'Attends. Là-haut, les branches s\'écartent de trois bonnes longueurs… Tes jambes n\'y suffiront pas.',
    'Le totem du singe, au bout de la grande branche des racines : pose ta main dessus.',
  ], 'Le totem du singe : dans les racines, au bout de la grande branche.') },
  { playerFace: 'left' },
  { playerMove: { toX: 1640 } },
];

// Kainati apaisé (E : parler, revisites comprises) : ses mots suivent la
// progression d'Agarica. Il reste assis, inerte.
CUTSCENES.kainati_calme = () => {
  if (!storyGet('talismanSinge')) {
    return [{ say: [
      { who: 'kainati', text: 'Mes jambes ne me portent plus… La mousse m\'a pris toutes mes forces en partant.' },
      { who: 'kainati', text: 'Les lianes de mes racines mènent à l\'épreuve de mon peuple. Termine-la, et notre talisman sera tien.' },
      { who: 'kainati', text: 'Ou continue vers l\'est, par la route des hauteurs. L\'épreuve t\'attendra : les arbres sont patients.' },
    ] }];
  }
  return [{ say: [
    { who: 'kainati', text: 'Le talisman de mon peuple te va bien, petite druidesse.' },
    { who: 'kainati', text: 'Que les lianes te portent. À l\'est, la route des hauteurs t\'attend.' },
  ] }];
};
// Repli si un jour CUTSCENES n'était pas consulté en premier.
DIALOGUES.kainati_calme = [
  { who: 'kainati', text: 'Plus haut, à l\'est, la route mène vers les hauteurs.' },
  { who: 'kainati', text: 'Que les lianes te portent, petite druidesse.' },
];

// ---------------------------------------------------------------------------
// 6. MONDE SPIRITUEL — l'arbre d'avant
// ---------------------------------------------------------------------------
// Pieds de l'esprit à chaque étape du guide (lianes = celles de la donnée de
// zone). Au sol : la surface de marche (haut de la hitbox des tuiles, là où se
// tient Agarica), pas le haut de leur image -- il flottait 16 px trop haut.
function mondeSpirituelGuidePath(scene) {
  const v = MONDE_SPIRITUEL_DATA.vines;
  const sol = (x, y) => ({ x, y: storyStandY(scene, x, y) });
  // 2 lianes par vide (une sur deux retirée, cf. monde_spirituel_data.js).
  return [v[0], v[1], sol(1470, 384), v[2], v[3], sol(2480, 448)];
}

// L'esprit simien ANCESTRAL (art `kainati_esprit`, nom affiché « Esprit
// ancestral ») : l'aïeul du peuple de Kainati. Il éprouve le cœur d'Agarica
// (question), lui donne la forme singe, puis la guide de liane en liane.
const ESPRIT_NOM = 'Esprit ancestral';
const espritDit = (text) => ({ who: 'kainati_esprit', name: ESPRIT_NOM, text });

CUTSCENES.esprit_arrivee = [
  { wait: 400 },
  { say: [
    espritDit('Bienvenue dans l\'arbre d\'avant, enfant des bois. Ici, rien ne pourrit.'),
    { who: 'agarica', text: 'Tu… tu brilles. Qui es-tu ?' },
    espritDit('Le premier de mon peuple. Mon descendant, Kainati, règne sur la cime de ton arbre… et la mousse lui ronge l\'esprit.'),
    { ...espritDit('Dis-moi. Pourquoi veux-tu atteindre sa cime ?'), choices: [
      { text: 'Pour arrêter la mousse qui ronge la forêt.' },
      { text: 'Pour parler à votre roi, pas pour le combattre.' },
    ] },
    espritDit('Ta réponse a le goût de la sève, pas de la mousse. Ton cœur est droit.'),
    espritDit('Reçois nos mains. Et si Kainati se dresse contre toi… ne le tue pas. Rends-lui ses yeux.'),
  ] },
  { call: (scene) => (scene.__esprit ? scene.__esprit.bless(1200) : null) },
  { flash: { ms: 500, color: 0xbfe8a0 } },
  { form: 'hasMonkeyForm' },
  { wait: 900 },
  { say: [
    espritDit('Mais des mains ne suffisent pas. Montre-moi qu\'elles ont compris.'),
    espritDit('Saute, puis saute encore : devenue singe, tes mains saisiront la liane. Balance-toi, puis lâche avec l\'élan. Suis mes mouvements.'),
  ] },
  { toast: { text: 'Forme du singe : double saut pour devenir singe et s\'accrocher aux lianes.\n← → : se balancer · Espace : lâcher · Z/S : monter/descendre', ms: 5600 } },
];

CUTSCENES.esprit_fin = [
  { playerFace: 'right' },
  { say: [
    espritDit('Tu as gardé l\'élan jusqu\'au bout. L\'épreuve est réussie : les branches te reconnaissent.'),
    espritDit('Un jour, d\'autres esprits t\'offriront peut-être des ailes. Près d\'un feu, tu choisiras : nos mains ou leurs ailes, une seule à la fois.'),
    { who: 'agarica', text: 'Merci. Je ferai honneur à ton peuple.' },
    espritDit('Retourne au totem. Au-delà, les lianes de la cime te mèneront jusqu\'à Kainati. Et les lianes de la branche d\'élan, à l\'épreuve de mon peuple.'),
  ] },
  { set: { mondeSpirituelFini: true } },
  { toast: { text: 'Le passage derrière l\'arbre spirituel ramène au totem des racines.', ms: 3200 } },
];

DIALOGUES.esprit_guide = [
  espritDit('Ne regarde pas le vide. Regarde la liane suivante.'),
];
DIALOGUES.esprit_revisite = [
  espritDit('Tu reviens t\'exercer ? L\'arbre d\'avant est patient.'),
  espritDit('Souviens-toi : on lâche la liane quand elle monte, jamais quand elle retombe.'),
];

// Le monde spirituel n'est plus sur le chemin de l'histoire (décision du
// 2026-10-25 : le totem des racines donne directement la forme singe). La
// zone est gardée telle quelle (réversible) et reste jouable depuis
// « Zones de test » ou le harnais, qui l'ouvrent SANS point d'entrée. Une
// arrivée AVEC un point d'entrée vient de l'histoire d'avant (« Continuer »
// d'une sauvegarde arrêtée ici : lastEnterId = from_racines) : elle retombe
// aussitôt devant le totem des racines (entrée `totem_singe`), où la forme
// se prend (ou est déjà prise) -- rien n'attend plus mondeSpirituelFini.
const MONDE_SPIRITUEL_RETOUR = { scene: 'GrandArbreRacinesScene', enterId: 'totem_singe' };

ZONE_SCRIPTS.monde_spirituel = {
  create(scene) {
    const sd = (scene.sys.settings && scene.sys.settings.data) || {};
    if (sd.enterId) {
      // Démarrage direct (pas de fondu sur une zone qu'on ne doit pas voir) :
      // l'arrêt de cette scène et le démarrage des racines passent à l'image suivante.
      scene.scene.start(MONDE_SPIRITUEL_RETOUR.scene, { enterId: MONDE_SPIRITUEL_RETOUR.enterId });
      return;
    }
    const done = storyGet('mondeSpirituelFini');
    // (L'arbre spirituel provisoire, dessiné en formes translucides, a été
    // retiré : le fond `fond_monde_spirituel` suffit.)
    arbreMotes(scene, 0, 2880, 60, 460, 26, [0x9fe3ff, 0xbfe8a0, 0xffffff, 0xff9ad5]);
    arbreGlowPassage(scene, 2840, 390, 120, 0x9fe3ff);

    const espritX = done ? 2480 : 560;
    const esprit = new KainatiEsprit(scene, espritX, storyStandY(scene, espritX, 448), { facing: done ? 'left' : 'right' });
    scene.__esprit = esprit;
    // Parler à l'esprit (invite « E : parler » de StoryKit).
    const sprite = esprit.sprite;
    sprite.npcKey = 'kainati_esprit';
    sprite.lookAtPlayer = false;
    sprite.talk = () => (storyGet('mondeSpirituelFini') ? 'esprit_revisite' : 'esprit_guide');
    scene.npcs.kainati_esprit = sprite;
    scene.__story.interactables.push({ kind: 'npc', npc: sprite });
    if (done) return;

    // Zone quittée pendant l'intro (menu pause → titre, sortie…) : la
    // cinématique peut se terminer APRÈS la sortie, sur une scène éteinte dont
    // le sol est détruit (storyStandY plantait sur `ground.children`). On
    // vérifie la scène, la visite et l'esprit avant chaque étape.
    const visit = scene.__storyVisit;
    const alive = () => !!(scene.sys && scene.sys.isActive() && scene.__storyVisit === visit
      && scene.__esprit === esprit && esprit.sprite && esprit.sprite.active
      && scene.player && scene.ground && scene.ground.children);
    scene.time.delayedCall(300, async () => {
      try {
        if (!alive()) return;
        await runCutscene(scene, 'esprit_arrivee');
        if (!alive()) return;
        await esprit.guide(mondeSpirituelGuidePath(scene), { radius: 230, pauseMs: 300 });
        // Arrivé au pied de l'arbre : il se retourne vers Agarica.
        if (alive()) esprit.sprite.setFlipX(kainatiFlipFor('kainati_esprit', false));
      } catch (e) {
        if (alive()) console.warn('[monde spirituel] guidage interrompu :', e);
      }
    });
  },
};

// ---------------------------------------------------------------------------
// 7. ÉPREUVE DU SINGE (optionnelle)
// ---------------------------------------------------------------------------
// Seule l'arrivée (la voix de Kainati) est un dialogue bloquant ; les
// remarques de chaque passage sont des bulles (elles ne gèlent rien).
// La voix de l'épreuve est celle des ANCÊTRES (esprit ancestral) : l'épreuve
// est ouverte avant comme après le combat contre Kainati.
CUTSCENES.epreuve_intro = [
  { say: [
    { who: 'kainati_esprit', name: 'Voix ancestrale', text: 'Tu es venue. Bien. Ici, mon peuple ne touche jamais le sol.' },
    { who: 'kainati_esprit', name: 'Voix ancestrale', text: 'Cinq passages, chacun plus rude. En bas, la mousse attend ceux qui tombent. Au sommet, notre talisman.' },
  ] },
  { camera: { x: 1250, y: 120, ms: 1700 } },
  { wait: 900 },
  { cameraFollow: true },
  { toast: { text: 'Double saut : devenue singe, tu saisis la 1re liane.\n← → : prendre de l\'élan · Espace : lâcher quand la liane monte · Z/S : monter/descendre\nUne chute ramène à la dernière lanterne allumée.', ms: 6000 } },
];

CUTSCENES.epreuve_s2 = cutsceneBulles([
  'Des pierres, encore… Elles tombent en rythme. Regarde l\'ombre.',
  { who: 'agarica', text: 'J\'attends qu\'elle tombe, je saute, et je grimpe vite.' },
]);

CUTSCENES.epreuve_s3 = cutsceneBulles([
  'Les lianes s\'écartent. Prends tout ton élan avant de lâcher.',
  'Et méfie-toi d\'en bas : un singe nous guette.',
]);

CUTSCENES.epreuve_s4 = cutsceneBulles([
  'La mousse monte et descend, là, en bas… comme une respiration.',
  { who: 'agarica', text: 'Quand elle reflue, je fonce et je grimpe.' },
]);

CUTSCENES.epreuve_s5 = cutsceneBulles([
  'Plus de repos, maintenant. Et cette branche, en bas, ne tiendra pas.',
  { who: 'agarica', text: 'Je vois la lumière, tout en haut. J\'y suis presque.' },
]);

CUTSCENES.epreuve_sans_singe = cutsceneBulles([
  'Ces lianes filent jusqu\'au bout des branches… mais sans la forme du singe, elles ne te porteront pas.',
  'Le totem du singe, au bout de la grande branche des racines : pose ta main dessus, il te donnera les mains de son peuple.',
]);

CUTSCENES.epreuve_forme_aigle = [
  { toast: { text: 'Ici, ce sont les mains du singe qu\'il te faut : choisis-le au feu de camp.', ms: 3200 } },
];

CUTSCENES.epreuve_talisman = [
  { flash: { ms: 450, color: 0xbfe8a0 } },
  { set: { talismanSinge: true } },
  { say: [
    { who: 'kainati_esprit', name: 'Voix ancestrale', text: 'Tu n\'as pas touché le sol. Mon peuple te salue, Agarica.' },
    { who: 'kainati_esprit', name: 'Voix ancestrale', text: 'Ce talisman garde notre plus vieux savoir : la pierre lancée juste, de loin, sans se mettre en danger.' },
  ] },
  { playerPose: 'cast' },
  { skill: 'pierre' },
  { wait: 1200 },
  { playerPose: null },
  { say: [
    { who: 'xara', text: 'Une pierre bien lancée vaut mieux qu\'une lame trop près des crocs. Ces vieux singes sont sages.' },
    { who: 'agarica', text: 'Merci, esprits du peuple singe.' },
  ] },
  { call: (scene) => epreuveOuvrirSommet(scene, false) },
  { toast: { text: 'Lancer de pierre : il coûte un peu d\'énergie. La fente, au bout du sommet, redescend vers les racines.', ms: 4000 } },
];

// La fente du sommet (raccourci vers les racines, bord droit du sommet) ne
// s'ouvre qu'une fois le talisman pris : sinon l'élan de la dernière liane y
// jetterait Agarica.
const EPREUVE_SINGE_SOMMET_X = 12088;
const EPREUVE_SINGE_SOMMET_Y = -128;
const EPREUVE_SINGE_SORTIE_SOMMET = { edge: 'right', to: -128, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_epreuve' } };

// Fente du sommet : posée FERMÉE dès l'arrivée tant que le talisman n'est
// pas pris (option H7 : on voit de loin qu'un passage attend au bout du
// sommet), ouverte d'un éclat à la prise du talisman. Sans l'art (pas de
// fente fermée dessinée), l'amande ouverte pousse comme avant, à son échelle
// de repos (__sx / __sy) : tweener `scale` vers 1 la gonflait à 440 px.
const EPREUVE_SINGE_FENTE = { x: 12256, y: -186, h: 110 };

function epreuveOuvrirSommet(scene, instant) {
  if (scene.__epreuveSommet) return;
  scene.__epreuveSommet = true;
  // Nouveau tableau : scene.__exits EST le tableau `exits` de la donnée de zone
  // (LevelKit) ; y pousser la sortie la laissait ouverte pour toute la page
  // (nouvelle partie sans le talisman comprise). Même piège que boss_kainati.js.
  scene.__exits = [...(scene.__exits || []), EPREUVE_SINGE_SORTIE_SOMMET];
  const f = EPREUVE_SINGE_FENTE;
  const closed = scene.__sommetFente;
  if (closed && closed.art && closed.core && closed.core.active) {
    closed.setOpen(true);
    if (!instant) {
      const cy = closed.core.y - f.h / 2;
      juiceFlash(closed.core, 0xffffff, 160);
      juiceBurstImage(scene, 'glow', f.x, cy, { size: f.h * 2, from: 0.3, to: 1.1, ms: 520, color: 0xe8fff2, alpha: 0.85 });
      spawnFx(scene, 'motes', f.x, cy, { count: 16, spread: 22, power: 2, color: [0xbfe8a0, 0xe8fff2, 0xff9fc9] });
    }
    return;
  }
  const p = arbreGlowPassage(scene, f.x, f.y, f.h);
  if (!instant) {
    [p.glow, p.core].filter(Boolean).forEach((o) => {
      o.setScale(o.__sx * 0.1, o.__sy * 0.1);
      scene.tweens.add({ targets: o, scaleX: o.__sx, scaleY: o.__sy, duration: 900, ease: 'Back.Out' });
    });
  }
}

// Plateformes d'écorce qui s'effritent (donnée `crumble`) : ~0,6 s après
// qu'Agarica s'y pose, elles tremblent puis cèdent, et repoussent 2,6 s plus tard.
const EPREUVE_CRUMBLE_DELAY_MS = 600;
const EPREUVE_CRUMBLE_RESPAWN_MS = 2600;
const EPREUVE_CRUMBLE_H = 22;
// Art Codex de la branche (lot 8), un état par phase : intacte (posée),
// fissurée (elle tremble sous les pieds), brisée (elle cède et tombe).
const EPREUVE_CRUMBLE_ART = { ok: 'decor_plateforme_ecorce_intacte', shake: 'decor_plateforme_ecorce_fissuree', gone: 'decor_plateforme_ecorce_brisee' };
// Rangée (px source, image de 104 px) du dessus de la mousse : posée sur la
// surface de la hitbox, pour que les pieds touchent la mousse peinte.
const EPREUVE_CRUMBLE_ART_TOP = 8;

// Pose l'image de l'état `state` (largeur de la hitbox + 6 px : la mousse
// déborde un peu des bords, comme sur l'ancien dessin) ; sans effet sur le
// repli dessiné (Graphics, sans setTexture) ou si l'image manque.
function epreuveCrumbleArt(scene, k, state) {
  const key = `item-${EPREUVE_CRUMBLE_ART[state]}`;
  if (!k.g.setTexture || !scene.textures.exists(key)) return;
  k.g.setTexture(key);
  k.g.setOrigin(0.5, EPREUVE_CRUMBLE_ART_TOP / k.g.height).setScale((k.w + 6) / k.g.width);
}

function epreuveCreateCrumbles(scene, list) {
  return (list || []).map((c) => {
    const w = c.w || 128;
    let g;
    if (scene.textures.exists(`item-${EPREUVE_CRUMBLE_ART.ok}`)) {
      g = scene.add.image(c.x, c.y, `item-${EPREUVE_CRUMBLE_ART.ok}`);
    } else {
      g = scene.add.graphics({ x: c.x, y: c.y });
      g.fillStyle(0x4a3021, 1).fillRoundedRect(-w / 2, 0, w, EPREUVE_CRUMBLE_H, 7);
      g.fillStyle(0x6b4a33, 1).fillRoundedRect(-w / 2 + 4, 2, w - 8, 8, 4);
      g.fillStyle(0x3e7a2c, 1).fillRoundedRect(-w / 2 + 2, -3, w - 4, 7, 3);
      g.lineStyle(2, 0x21140d, 1);
      for (const dx of [-w * 0.28, w * 0.05, w * 0.3]) g.lineBetween(dx, 3, dx + 7, EPREUVE_CRUMBLE_H - 3);
    }
    storyPutBehindPlayer(scene, g);
    const zone = scene.add.zone(c.x, c.y + EPREUVE_CRUMBLE_H / 2, w, EPREUVE_CRUMBLE_H);
    scene.physics.add.existing(zone, true);
    scene.physics.add.collider(scene.player, zone);
    const k = { c, w, g, zone, state: 'ok', until: 0 };
    epreuveCrumbleArt(scene, k, 'ok');
    return k;
  });
}

function epreuveUpdateCrumbles(scene, list, now) {
  const p = scene.player;
  for (const k of list) {
    const top = k.c.y;
    if (k.state === 'ok') {
      const on = p.body.blocked.down && Math.abs(p.body.bottom - top) < 4 && Math.abs(p.x - k.c.x) < k.w / 2 + 16;
      if (on) {
        k.state = 'shake';
        k.until = now + EPREUVE_CRUMBLE_DELAY_MS;
        epreuveCrumbleArt(scene, k, 'shake');
      }
    } else if (k.state === 'shake') {
      k.g.x = k.c.x + Phaser.Math.Between(-2, 2);
      if (now >= k.until) {
        k.state = 'gone';
        k.until = now + EPREUVE_CRUMBLE_RESPAWN_MS;
        k.zone.body.enable = false;
        k.g.x = k.c.x;
        epreuveCrumbleArt(scene, k, 'gone');
        // Éclats d'écorce et de mousse peints (option `fx` d'acte1Particles,
        // contrat du lot A1 : ignorée tant qu'elle n'existe pas).
        if (typeof acte1Particles === 'function') acte1Particles(scene, k.c.x, top + 6, { count: 10, colors: [0x6b4a33, 0x3e7a2c], spread: k.w / 2, rise: -40, fx: ['fx_eclat_ecorce', 'fx_eclat_mousse'] });
        scene.tweens.add({ targets: k.g, y: top + 40, alpha: 0, duration: 380, ease: 'Quad.easeIn' });
      }
    } else if (k.state === 'gone' && now >= k.until) {
      // Ne repousse pas sous les pieds d'Agarica (elle serait coincée dedans).
      const inside = Math.abs(p.x - k.c.x) < k.w / 2 + 20 && p.body.bottom > top - 4 && p.body.top < top + EPREUVE_CRUMBLE_H + 4;
      if (inside) continue;
      k.state = 'ok';
      k.zone.body.enable = true;
      scene.tweens.killTweensOf(k.g);
      epreuveCrumbleArt(scene, k, 'ok');
      k.g.setPosition(k.c.x, top).setAlpha(0);
      scene.tweens.add({ targets: k.g, alpha: 1, duration: 300 });
    }
  }
}

// Pierre d'un couloir en rythme : comme arbreDropRock (ombre qui grandit sur
// la branche, puis chute), mais elle part de `topY` (par défaut 320 px plus
// haut) avec une durée de chute qui suit la hauteur (même accélération). Un
// couloir posé le long d'une liane couvre ainsi toute sa partie basse, là où
// l'on s'accroche et commence à grimper : rester dessous = prendre la pierre.
// L'ombre fonce vraiment en grandissant (opacité de remplissage pleine,
// alpha de l'objet 0,3 → 0,8, posée sur les brins d'herbe) : avec le
// remplissage à 0,25 d'arbreDropRock, elle tombait à ~0,15 d'opacité et ne
// se voyait plus sur l'herbe. Renvoie le délai jusqu'à l'impact (ms).
function epreuveDropRock(scene, x, surfaceY, telegraph, topY) {
  const top = topY != null ? topY : surfaceY - 320;
  const fallMs = Math.round(340 * Math.sqrt(Math.max(1, surfaceY - 12 - top) / 308));
  const sh = arbreRockShadow(scene, x, surfaceY - 5, 24, 8, 0.3, 3, 2, 0.8, telegraph);
  const shadow = sh.obj;
  scene.tweens.add({
    targets: shadow, ...sh.to, duration: telegraph, ease: 'Sine.easeIn',
    onComplete: () => {
      if (!scene.sys || !scene.sys.isActive()) { arbreClearRockShadow(sh); return; }
      const rock = typeof addKainatiStoneImage === 'function'
        ? addKainatiStoneImage(scene, x, top)
        : scene.add.circle(x, top, 12, 0x6d6a70).setStrokeStyle(2, 0x1e1a24).setDepth(991);
      let hit = false;
      scene.tweens.add({
        targets: rock, y: surfaceY - 12, angle: 260, duration: fallMs, ease: 'Quad.easeIn',
        onUpdate: () => {
          const p = scene.player;
          if (hit || !p || !p.body || isWorldFrozen(scene)) return;
          const b = p.body;
          if (Phaser.Geom.Intersects.CircleToRectangle(new Phaser.Geom.Circle(rock.x, rock.y, 12), new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) {
            hit = true;
            p.hitByEnemy();
          }
        },
        onComplete: () => {
          arbreClearRockShadow(sh);
          if (typeof spawnKainatiImpact === 'function') spawnKainatiImpact(scene, rock.x, surfaceY);
          rock.destroy();
          if (!hit && scene.player && Math.abs(scene.player.x - x) < 300) scene.cameras.main.shake(90, 0.003);
        },
      });
    },
  });
  return telegraph + fallMs;
}

// Pierres EN RYTHME (donnée `rhythmRocks`) : tous les `period` ms, une pierre
// par couloir, annoncée par l'ombre qui grandit (`telegraph`). Couloir = x, ou
// { x, top, offset } (départ de la chute, décalage dans le cycle en ms : deux
// couloirs décalés d'une demi-période font « boum… boum… »). Le rythme ne
// dépend pas d'Agarica (on l'observe, puis on passe entre deux chutes) :
// l'horloge tourne tout le temps (sinon elle repartait de zéro à l'arrivée et
// qui fonçait passait toujours avant la 1re pierre), les pierres ne tombent
// que si elle est dans les parages (`x1`-`x2`). `impacts[i]` : instant du
// prochain impact du couloir i (repère public pour lire le rythme, tests).
function epreuveUpdateRhythms(scene, list, time, delta) {
  const p = scene.player;
  for (const r of list) {
    const prev = r.clock;
    r.clock += delta;
    if (p.x < r.x1 || p.x > r.x2) continue;
    r.lanes.forEach((ln, i) => {
      const lane = typeof ln === 'number' ? { x: ln } : ln;
      const off = lane.offset || 0;
      // Déclenche quand (horloge - décalage) franchit un multiple de la période.
      if (Math.floor((r.clock - off) / r.period) <= Math.floor((prev - off) / r.period)) return;
      r.impacts[i] = time + epreuveDropRock(scene, lane.x, r.surfaceY, r.telegraph, lane.top);
      r.lastImpactAt = r.impacts[i];
    });
  }
}

// Marée de mousse toxique (donnée `tides`) : une nappe qui monte sur un
// passage bas puis reflue, en boucle (phases bas / montée / haut / descente,
// en ms). La toucher = retour à la dernière lanterne, comme une chute.
// Avec l'art : la même nappe peinte que le lac du fond (`liquide_mousse_toxique`,
// à l'échelle du manifeste), en bande qui défile, crête médiane (rangée 82,
// comme LIQUID_IMAGE_ANCHOR_ROW de LevelKit) calée sur le haut de la marée,
// un aplat de la couleur du bas de l'image dessous ; un peu translucide (on
// devine le passage). Seul le dessin change : cycle, hauteurs et test de
// mort (`top + 10`) sont ceux de la donnée.
const EPREUVE_TIDE_ART = 'liquide_mousse_toxique';
const EPREUVE_TIDE_CREST_ROW = 82;
// Côtés adoucis : la nappe est dessinée EPREUVE_TIDE_FADE px plus large de
// chaque côté et s'efface en fondu sur ~36 px, à mi-opacité sur le bord de la
// zone qui blesse (`x`, `x + w`, inchangée). La limite du fondu ondule de ±6 px
// avec la hauteur : la marée ne monte plus comme un bloc rectangulaire.
const EPREUVE_TIDE_FADE = 24;
const EPREUVE_TIDE_FADE_WIDTH = 36;

// Masque (WebGL) : canvas de l'alpha de la nappe, opaque au milieu, en fondu
// irrégulier sur les côtés ; couvre toute la course verticale de la marée.
// Sans WebGL (pas de masque bitmap en Canvas) : bords francs, comme avant.
function epreuveTideMask(scene, tide, objs) {
  if (!scene.sys.game.renderer || scene.sys.game.renderer.type !== Phaser.WEBGL) return;
  const F = EPREUVE_TIDE_FADE;
  const FW = EPREUVE_TIDE_FADE_WIDTH;
  const w = tide.w + 2 * F;
  const y0 = Math.floor(Math.min(tide.low, tide.high) - (tide.crest || 0) - 16);
  const y1 = Math.ceil(Math.max(Math.max(tide.low, tide.high) - (tide.crest || 0) + (tide.band || 0) + 124, 580));
  const h = y1 - y0;
  const key = `epreuve-maree-masque-${w}x${h}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    const margin = (F * 2 - FW) / 2; // 6 : amplitude de l'ondulation
    for (let y = 0; y < h; y += 2) {
      const wobL = Math.sin(y * 0.09) * 0.7 + Math.sin(y * 0.23 + 1.7) * 0.3;
      const wobR = Math.sin(y * 0.08 + 2.4) * 0.7 + Math.sin(y * 0.21 + 0.5) * 0.3;
      const l0 = margin + wobL * margin;
      const r0 = w - margin - wobR * margin;
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(l0 / w, 'rgba(255,255,255,0)');
      g.addColorStop((l0 + FW) / w, 'rgba(255,255,255,1)');
      g.addColorStop((r0 - FW) / w, 'rgba(255,255,255,1)');
      g.addColorStop(r0 / w, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y, w, 2);
    }
    tex.refresh();
  }
  // Hors de la liste d'affichage : il ne sert qu'au masque (même caméra que la nappe).
  const img = scene.make.image({ x: tide.x - F, y: y0, key, add: false }).setOrigin(0, 0);
  const mask = img.createBitmapMask();
  objs.forEach((o) => o.setMask(mask));
  scene.events.once('shutdown', () => { mask.destroy(); img.destroy(); });
}

function epreuveCreateTide(scene, t) {
  const tide = { ...t, phase: 0, t: 0, top: t.low };
  // Emprise dessinée (plus large que la zone qui blesse, cf. EPREUVE_TIDE_FADE).
  tide.drawX = t.x - EPREUVE_TIDE_FADE;
  tide.drawW = t.w + 2 * EPREUVE_TIDE_FADE;
  const key = `item-${EPREUVE_TIDE_ART}`;
  if (scene.textures.exists(key)) {
    const src = scene.textures.get(key).getSourceImage();
    const k = (getItemManifest()[EPREUVE_TIDE_ART] || {}).scale || 0.3;
    tide.crest = EPREUVE_TIDE_CREST_ROW * k;
    tide.band = src.height * k;
    tide.fill = scene.add.rectangle(tide.drawX, 0, tide.drawW, 120, textureEdgeColor(scene, key, 'bottom', 0x16280f)).setOrigin(0, 0).setAlpha(0.92);
    tide.img = scene.add.tileSprite(tide.drawX, 0, tide.drawW, tide.band, key).setOrigin(0, 0).setTileScale(k, k).setAlpha(0.92);
    storyPutBehindPlayer(scene, tide.fill);
    storyPutBehindPlayer(scene, tide.img);
    epreuveTideMask(scene, tide, [tide.fill, tide.img]);
  } else {
    tide.g = scene.add.graphics();
    storyPutBehindPlayer(scene, tide.g);
    epreuveTideMask(scene, tide, [tide.g]);
  }
  epreuveDrawTide(tide, 0);
  return tide;
}

// Nappe un peu translucide (on devine le passage dessous), crête bosselée
// qui ondule et liseré de bulles toxiques : la même mousse que celle du fond.
function epreuveDrawTide(tide, time) {
  if (tide.img) {
    const y = tide.top - tide.crest;
    tide.img.setY(y);
    tide.img.tilePositionX = time * 0.02;
    tide.fill.setY(y + tide.band - 1);
    return;
  }
  const g = tide.g;
  g.clear();
  const top = tide.top;
  const h = 560 - top;
  if (h <= 0) return;
  const x1 = tide.drawX;
  const x2 = tide.drawX + tide.drawW;
  const ph = time / 260;
  g.fillStyle(0x16280f, 0.86).fillRect(x1, top + 8, tide.drawW, h);
  g.fillStyle(0x24401a, 0.9).fillRect(x1, top + 8, tide.drawW, 26);
  for (let x = x1, i = 0; x < x2; x += 24, i++) {
    g.fillStyle(i % 2 ? 0x3e7a2c : 0x2f5a2a, 1).fillEllipse(x + 12, top + 8 + Math.sin(ph + i * 0.9) * 3, 36, 18);
  }
  g.fillStyle(0x9bff5a, 0.75);
  for (let x = x1 + 10, i = 0; x < x2; x += 38, i++) {
    g.fillCircle(x + Math.sin(ph * 0.7 + i) * 4, top + 3 + Math.cos(ph + i * 1.7) * 2, 2.5);
  }
}

function epreuveUpdateTides(scene, list, time, delta) {
  const p = scene.player;
  for (const td of list) {
    td.t += delta;
    while (td.t >= td.phases[td.phase]) { td.t -= td.phases[td.phase]; td.phase = (td.phase + 1) % 4; }
    const k = td.t / td.phases[td.phase];
    // 0 bas, 1 montée, 2 haut, 3 descente.
    const ease = (u) => 0.5 - Math.cos(Math.PI * u) / 2;
    td.top = td.phase === 0 ? td.low : td.phase === 2 ? td.high
      : td.phase === 1 ? Phaser.Math.Linear(td.low, td.high, ease(k)) : Phaser.Math.Linear(td.high, td.low, ease(k));
    epreuveDrawTide(td, time);
    const inX = p.x > td.x && p.x < td.x + td.w;
    if (inX && p.body.bottom > td.top + 10 && !isWorldFrozen(scene)) {
      const back = scene.__story.checkpoint || { x: p.spawnX, y: p.spawnY };
      if (p.vine) p.releaseVine(false, scene.time.now);
      p.setVelocity(0, 0);
      p.setPosition(back.x, back.y - 4);
      scene.cameras.main.flash(180, 120, 255, 90);
    }
  }
}

ZONE_SCRIPTS.epreuve_singe = {
  create(scene, data) {
    scene.__epreuveSommet = false;
    scene.__sommetFente = null;
    const sx = EPREUVE_SINGE_SOMMET_X;
    // Au sommet : un rai de lumière au-dessus de l'autel (décor
    // `grand_arbre_autel_singe` de la donnée), visible de loin. L'ancien
    // socle dessiné par code est retiré : il doublait l'autel. Rai peint
    // `fx_rai_lumiere` (bas sur le sommet, 110x300), sinon le rectangle.
    if (scene.textures.exists('item-fx_rai_lumiere')) {
      const beam = scene.add.image(sx, EPREUVE_SINGE_SOMMET_Y, 'item-fx_rai_lumiere').setOrigin(0.5, 1)
        .setDisplaySize(110, 300).setTint(0xffe9a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.25);
      storyPutBehindPlayer(scene, beam);
      scene.tweens.add({ targets: beam, alpha: 0.5, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      const beam = scene.add.rectangle(sx, EPREUVE_SINGE_SOMMET_Y - 150, 64, 240, 0xffe9a8, 0.12);
      storyPutBehindPlayer(scene, beam);
      scene.tweens.add({ targets: beam, alpha: 0.28, duration: 1300, yoyo: true, repeat: -1 });
    }
    // Côté arrivée (option H8) : la même fente que celle de la corniche des
    // racines, au bord gauche, là où la sortie redescend vers elles.
    arbreGlowPassage(scene, 40, 390, 120);
    const w = (data && data.levelWidth) || scene.levelWidth || 12288;
    arbreMotes(scene, 0, w, -380, 420, 60, [0xbfe8a0, 0xffe9a8, 0x9bff5a]);
    // (La mousse toxique du fond est la bande `liquidFloor` de la donnée,
    // LevelKit : plus de nappe dessinée ici, elle l'était deux fois.)
    scene.__epreuve = {
      crumbles: epreuveCreateCrumbles(scene, data && data.crumble),
      rockfalls: ((data && data.rockfalls) || []).map((r) => ({ ...r, timer: 600 })),
      // Pierres en rythme : horloge propre (même cadence à chaque visite).
      rhythms: ((data && data.rhythmRocks) || []).map((r) => ({ ...r, clock: 0, lastImpactAt: -1e9, impacts: r.lanes.map(() => -1e9) })),
      tides: ((data && data.tides) || []).map((t) => epreuveCreateTide(scene, t)),
    };
    if (storyGet('talismanSinge')) epreuveOuvrirSommet(scene, true);
    else {
      const f = EPREUVE_SINGE_FENTE;
      scene.__sommetFente = arbreGlowPassage(scene, f.x, f.y, f.h, undefined, false);
    }
  },

  update(scene, time, delta) {
    const st = scene.__epreuve;
    const p = scene.player;
    if (!st || !p || !p.body) return;
    epreuveUpdateCrumbles(scene, st.crumbles, time);
    epreuveUpdateRhythms(scene, st.rhythms, time, delta);
    epreuveUpdateTides(scene, st.tides, time, delta);
    // Pierres des guetteurs : seulement quand Agarica est sur l'îlot (ou juste
    // au-dessus), comme sur la grande branche des racines.
    for (const rf of st.rockfalls) {
      const on = p.x > rf.x1 - 80 && p.x < rf.x2 + 80 && p.y < rf.surfaceY + 40 && p.y > rf.surfaceY - 260;
      if (!on) { rf.timer = Math.min(rf.timer, 500); continue; }
      rf.timer -= delta;
      if (rf.timer > 0) continue;
      rf.timer = rf.every;
      const x = Phaser.Math.Clamp(p.x + Phaser.Math.Between(-30, 30), rf.x1, rf.x2);
      epreuveDropRock(scene, x, rf.surfaceY, rf.telegraph);
    }
  },
};

