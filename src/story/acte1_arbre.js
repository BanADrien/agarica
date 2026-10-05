// Dialogues, cinématiques et scripts des zones du grand arbre — agent Acte 1 (arbre).
//
// Zones (cf. docs/production/PLAN_DEV.md, progression 4 à 7) :
//   foret_sombre_2 → grand_arbre_racines → grand_arbre_arene (Kainati,
//   src/story/boss_kainati.js) → monde_spirituel (forme singe) → arène →
//   foret_flottante_1 (acte 2). Optionnel : racines ⇄ epreuve_singe
//   (talisman du singe), par les lianes des racines, en forme singe.
// Chargé APRÈS boss_kainati.js : les textes de Kainati (`kainati_intro`,
// `kainati_victoire`, `kainati_calme`) remplacent ceux par défaut.
//
// Flags posés ici : mondeSpirituelFini, talismanSinge (+ item talisman_singe,
// compétence pierre), hasMonkeyForm (via l'étape `form`) ; + flags
// automatiques de StoryKit (trig_*, pickup_*).

// ---------------------------------------------------------------------------
// Petits utilitaires
// ---------------------------------------------------------------------------
function arbreGlowPassage(scene, x, y, h = 120, color = 0xbfe8a0) {
  // Fente lumineuse dans l'écorce (même langage visuel que le passage du totem de l'arène).
  const glow = scene.add.ellipse(x, y, 70, h, color, 0.3).setDepth(2);
  const core = scene.add.ellipse(x, y, 40, h - 24, 0x1a1428, 0.9).setDepth(2);
  scene.tweens.add({ targets: glow, alpha: 0.65, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return { glow, core };
}

// Lucioles / poussières de lumière qui montent lentement (décor, en boucle).
function arbreMotes(scene, x1, x2, y1, y2, count, colors) {
  for (let i = 0; i < count; i++) {
    const m = scene.add.circle(Phaser.Math.Between(x1, x2), Phaser.Math.Between(y1, y2),
      Phaser.Math.FloatBetween(1.5, 3.5), colors[i % colors.length], 0.7).setDepth(3);
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

// Plaques de mousse décoratives (tunnel des racines), sans corps.
function arbreMossDecor(scene, x, y, w, flip = false) {
  const g = scene.add.graphics({ x, y }).setDepth(2);
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
function arbreDropRock(scene, x, surfaceY, telegraph = 1000) {
  const shadow = scene.add.ellipse(x, surfaceY - 3, 22, 8, 0x12000c, 0.25).setDepth(990);
  scene.tweens.add({
    targets: shadow,
    scaleX: 3,
    scaleY: 2.2,
    alpha: 0.6,
    duration: telegraph,
    ease: 'Sine.easeIn',
    onComplete: () => {
      if (!scene.sys || !scene.sys.isActive()) return;
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
          shadow.destroy();
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
  { say: [
    { who: 'agarica', text: "Oh… Je n'avais jamais vu un arbre pareil." },
    { who: 'xara', text: "Le grand arbre. Il était déjà vieux quand ton bosquet n'était qu'une poignée de graines." },
    { who: 'agarica', text: "La piste du loup s'arrête ici. Elle grimpe… tout droit dans les racines." },
    { who: 'xara', text: "Alors grimpons. Doucement : cet arbre a un roi, et il n'aime pas qu'on monte sans y être invitée." },
  ] },
  { camera: { x: 1800, y: -160, ms: 1600 } },
  { wait: 700 },
  { cameraFollow: true },
  { toast: 'Le grand arbre se gravit : de racine en branche, jusqu\'à la cime.' },
];

CUTSCENES.racines_tunnel = [
  { say: [
    { who: 'xara', text: 'Tu sens ? La mousse est plus épaisse ici. Elle remonte les racines, vers le cœur de l\'arbre.' },
    { who: 'agarica', text: 'Et ces griffures dans l\'écorce… On dirait des mains. De petites mains.' },
    { who: 'xara', text: 'Des singes. Ils vivent dans les branches. D\'habitude, ils sont plus… accueillants.' },
  ] },
];

CUTSCENES.racines_lianes = [
  { camera: { x: 660, y: -200, ms: 1400 } },
  { say: [
    { who: 'xara', text: 'Regarde, là-bas : des lianes au-dessus du vide. Elles mènent à une fente dans l\'écorce.' },
    { who: 'agarica', text: 'Je pourrais atteindre la première… mais je ne tiendrai jamais jusqu\'au bout.' },
    { who: 'xara', text: 'Pas avec des mains de druidesse, non. Il faudrait celles d\'un singe.' },
    { who: 'xara', text: 'Garde cet endroit en tête. Les arbres ont la mémoire longue… et moi aussi.' },
  ] },
  { cameraFollow: true },
];

CUTSCENES.racines_lianes_singe = [
  { say: [
    { who: 'xara', text: 'Les lianes de tout à l\'heure… Cette fois, elles te porteront.' },
    { who: 'xara', text: 'Tu reviens de l\'arbre d\'avant, n\'est-ce pas ? Tu as cette lumière dans les yeux. Je la connais.' },
    { who: 'agarica', text: 'Tu la connais ? Comment ça ?' },
    { who: 'xara', text: '… Les lianes, Agarica. Par là, à gauche. L\'épreuve de son peuple t\'attend, si tu le veux.' },
  ] },
];

CUTSCENES.racines_pierres = [
  { call: (scene) => arbreDropRock(scene, scene.player.x + 120, GRAND_ARBRE_RACINES_DATA.rockfall.surfaceY, 900) },
  { wait: 1400 },
  { say: [
    { who: 'xara', text: 'Attention ! Ça tombe de là-haut.' },
    { who: 'xara', text: 'Regarde la branche : l\'ombre grandit juste avant que la pierre n\'arrive. Ne reste pas dessous.' },
    { who: 'agarica', text: 'Quelqu\'un nous les lance… Les singes ?' },
  ] },
];

CUTSCENES.racines_cime = [
  { say: [
    { who: 'xara', text: 'Là-haut, la cime. Quelque chose de grand se balance dans les lianes… Je l\'entends respirer.' },
    { who: 'agarica', text: 'Le roi de l\'arbre. Je vais lui parler.' },
    { who: 'xara', text: 'Parle-lui, si tu peux. Et s\'il ne t\'écoute pas… observe ses mouvements. Les lianes ne mentent pas.' },
  ] },
];

ZONE_SCRIPTS.grand_arbre_racines = {
  create(scene, data) {
    const st = { cfg: (data && data.rockfall) || null, timer: 600 };
    scene.__arbre = st;
    // La fente de l'épreuve du singe, au bout des lianes (corniche gauche).
    arbreGlowPassage(scene, 40, -190, 120);
    // Lumière de la cime, en haut à droite (sortie vers l'arène).
    const cime = scene.add.ellipse(3170, -260, 120, 200, 0xffe9a8, 0.12).setDepth(2);
    scene.tweens.add({ targets: cime, alpha: 0.25, duration: 1600, yoyo: true, repeat: -1 });
    // La mousse dense qui remonte le tunnel (sol et plafond).
    [420, 560, 900, 1040].forEach((x, i) => arbreMossDecor(scene, x, 448, 70 + (i % 2) * 20));
    [500, 760, 1120].forEach((x) => arbreMossDecor(scene, x, 320, 60, true));
    [1500, 1950, 2420, 2900].forEach((x, i) => arbreMossDecor(scene, x, i === 0 ? 64 : -192, 50));
    arbreMotes(scene, 1300, 3100, -380, 400, 14, [0x9bff5a, 0xbfe8a0, 0xff9ad5]);
  },

  update(scene, time, delta) {
    const st = scene.__arbre;
    const cfg = st && st.cfg;
    const p = scene.player;
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
// pas mauvais. À la fin, il reconnaît le combat d'Agarica et lui ouvre le
// passage du totem (monde spirituel).
DIALOGUES.kainati_intro = [
  { who: 'kainati', text: 'Halte, enfant d\'en bas !' },
  { who: 'kainati', text: 'Depuis des lunes, la mousse grimpe le long de mon arbre. Mon peuple tousse, mes branches pourrissent… et voilà qu\'elle t\'envoie, toi.' },
  { who: 'agarica', text: 'La mousse ? Non, je la combats ! Je cherche seulement à…' },
  { who: 'kainati', text: 'Tes pieds en portent l\'odeur ! Ma tête bourdonne… Personne n\'atteindra ma cime.' },
  { who: 'xara', text: 'Agarica, regarde ses yeux. Ce n\'est pas lui qui parle… J\'ai déjà vu ce regard. Il y a longtemps.' },
  { who: 'kainati', text: 'Assez ! Les branches jugeront pour moi.' },
];

DIALOGUES.kainati_victoire = [
  { who: 'kainati', text: '…' },
  { who: 'kainati', text: 'Le bourdonnement… s\'est tu. La brume quitte mes yeux.' },
  { who: 'kainati', text: 'Tu aurais pu me jeter au bas de mon arbre. Tu ne l\'as pas fait.' },
  { who: 'agarica', text: 'Ce n\'était pas toi, c\'était la mousse. Je la combats, Kainati. Elle ronge toute la forêt.' },
  { who: 'kainati', text: 'Alors nous avons le même ennemi. Elle s\'était glissée en moi comme la sève dans le bois… et j\'ai pris une enfant des bois pour une ennemie.' },
  { who: 'kainati', text: 'Pardonne au vieux roi. Tu as suivi mes lianes sans les connaître : tu as compris mon mouvement.' },
  { who: 'kainati', text: 'Derrière ma branche, l\'écorce s\'est ouverte. Là dort le totem de mon peuple : il te mènera dans l\'arbre d\'avant, où nos esprits t\'attendent.' },
  { who: 'kainati', text: 'Et quand tu seras prête, la route des hauteurs continue vers l\'est, au-delà de ma cime.' },
  { who: 'xara', text: 'Un totem qui ouvre sur le monde des esprits… Je ne pensais pas en revoir un un jour.' },
];

// Kainati apaisé (revisites) : ses mots suivent la progression d'Agarica.
CUTSCENES.kainati_calme = () => {
  if (!storyGet('hasMonkeyForm')) {
    return [{ say: [
      { who: 'kainati', text: 'Le passage du totem brille derrière ma branche. Mon peuple t\'attend dans l\'arbre d\'avant.' },
      { who: 'kainati', text: 'Va sans crainte. Là-bas, rien ne pourrit.' },
    ] }];
  }
  if (!storyGet('talismanSinge')) {
    return [{ say: [
      { who: 'kainati', text: 'Tu portes nos mains, maintenant. Je le vois à ta façon de regarder les lianes.' },
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
  { who: 'kainati', text: 'Le totem t\'attend derrière ma branche. Plus haut, la route mène vers les hauteurs.' },
  { who: 'kainati', text: 'Que les lianes te portent, petite druidesse.' },
];

// ---------------------------------------------------------------------------
// 6. MONDE SPIRITUEL — l'arbre d'avant
// ---------------------------------------------------------------------------
// Pieds de l'esprit à chaque étape du guide (lianes = celles de la donnée de zone).
function mondeSpirituelGuidePath() {
  const v = MONDE_SPIRITUEL_DATA.vines;
  return [v[0], v[1], v[2], { x: 1470, y: 384 }, v[3], v[4], v[5], { x: 2480, y: 448 }];
}

CUTSCENES.esprit_arrivee = [
  { wait: 400 },
  { say: [
    { who: 'kainati_esprit', text: 'Bienvenue dans l\'arbre d\'avant, petite druidesse. Ici, rien ne pourrit.' },
    { who: 'agarica', text: 'Kainati ? Tu… tu brilles.' },
    { who: 'kainati_esprit', text: 'Ce que tu vois, c\'est ce que j\'étais avant la mousse. Ce que mon peuple est depuis toujours.' },
    { who: 'kainati_esprit', text: 'Le totem t\'a ouverte à nous. Reçois notre forme.' },
  ] },
  { flash: { ms: 500, color: 0xbfe8a0 } },
  { form: 'hasMonkeyForm' },
  { wait: 900 },
  { say: [
    { who: 'kainati_esprit', text: 'Le singe ne vole pas. Son saut est plus court… mais ses mains n\'oublient jamais une liane.' },
    { who: 'kainati_esprit', text: 'En l\'air, approche-toi d\'une liane : tu t\'y accrocheras seule. Balance-toi, puis saute pour lâcher avec l\'élan.' },
    { who: 'kainati_esprit', text: 'Suis mes mouvements.' },
  ] },
  { toast: { text: 'Forme du singe : en l\'air, accroche-toi aux lianes.\n← → : se balancer · Saut : lâcher avec l\'élan · S : se laisser tomber', ms: 5200 } },
];

CUTSCENES.esprit_fin = [
  { playerFace: 'right' },
  { say: [
    { who: 'kainati_esprit', text: 'Tu as gardé l\'élan jusqu\'au bout. Les branches te reconnaissent.' },
    { who: 'kainati_esprit', text: 'D\'autres esprits t\'offriront peut-être des ailes. On dit que l\'aigle saute plus haut que nous… et qu\'il plane.' },
    { who: 'kainati_esprit', text: 'Mais ses ailes et nos mains partagent la même place en toi : une seule à la fois.' },
    { who: 'kainati_esprit', text: 'Près d\'un feu de camp, tu choisiras laquelle t\'accompagne dans les airs. Le loup, lui, garde toujours sa place.' },
    { who: 'agarica', text: 'Merci, Kainati. Je ferai honneur à ton peuple.' },
    { who: 'kainati_esprit', text: 'Les lianes de mes racines mènent à l\'épreuve de mon peuple. Celle qui la termine reçoit notre talisman.' },
    { who: 'kainati_esprit', text: 'Va. Le passage derrière moi te ramènera dans ton monde.' },
  ] },
  { set: { mondeSpirituelFini: true } },
];

DIALOGUES.esprit_guide = [
  { who: 'kainati_esprit', text: 'Ne regarde pas le vide. Regarde la liane suivante.' },
];
DIALOGUES.esprit_revisite = [
  { who: 'kainati_esprit', text: 'Tu reviens t\'exercer ? L\'arbre d\'avant est patient.' },
  { who: 'kainati_esprit', text: 'Souviens-toi : on lâche la liane quand elle monte, jamais quand elle retombe.' },
];

ZONE_SCRIPTS.monde_spirituel = {
  create(scene) {
    const done = storyGet('mondeSpirituelFini');
    // L'arbre spirituel (placeholder dessiné : tronc translucide + couronne de lumière).
    const tree = scene.add.graphics().setDepth(1);
    tree.fillStyle(0x9fe3ff, 0.16).fillEllipse(2620, 120, 620, 300);
    tree.fillStyle(0xbfe8a0, 0.12).fillEllipse(2560, 60, 420, 200);
    tree.fillStyle(0x7fd8c8, 0.28).fillRoundedRect(2560, 120, 110, 330, 30);
    tree.fillStyle(0xe8fff6, 0.18).fillRoundedRect(2590, 140, 30, 300, 12);
    arbreMotes(scene, 0, 2880, 60, 460, 26, [0x9fe3ff, 0xbfe8a0, 0xffffff, 0xff9ad5]);
    arbreGlowPassage(scene, 2840, 390, 120, 0x9fe3ff);

    const esprit = new KainatiEsprit(scene, done ? 2480 : 560, 448, { facing: done ? 'left' : 'right' });
    scene.__esprit = esprit;
    // Parler à l'esprit (invite « E : parler » de StoryKit).
    const sprite = esprit.sprite;
    sprite.npcKey = 'kainati_esprit';
    sprite.lookAtPlayer = false;
    sprite.talk = () => (storyGet('mondeSpirituelFini') ? 'esprit_revisite' : 'esprit_guide');
    scene.npcs.kainati_esprit = sprite;
    scene.__story.interactables.push({ kind: 'npc', npc: sprite });
    if (done) return;

    scene.time.delayedCall(300, async () => {
      if (!scene.sys.isActive() || scene.__esprit !== esprit) return;
      await runCutscene(scene, 'esprit_arrivee');
      if (scene.__esprit !== esprit) return;
      await esprit.guide(mondeSpirituelGuidePath(), { radius: 230, pauseMs: 300 });
      // Arrivé au pied de l'arbre : il se retourne vers Agarica.
      if (scene.__esprit === esprit && esprit.sprite.active) esprit.sprite.setFlipX(kainatiFlipFor('kainati_esprit', false));
    });
  },
};

// ---------------------------------------------------------------------------
// 7. ÉPREUVE DU SINGE (optionnelle)
// ---------------------------------------------------------------------------
CUTSCENES.epreuve_intro = [
  { say: [
    { who: 'kainati', name: 'Voix de Kainati', text: 'Tu es venue. Bien.' },
    { who: 'kainati', name: 'Voix de Kainati', text: 'Mon peuple grimpe ici depuis la première sève. Personne ne touche le sol.' },
    { who: 'kainati', name: 'Voix de Kainati', text: 'Monte jusqu\'à la lumière, tout là-haut. Le talisman de mon peuple t\'y attend.' },
  ] },
  { camera: { x: 1760, y: -200, ms: 1700 } },
  { wait: 900 },
  { cameraFollow: true },
  { toast: { text: 'Les lanternes sont des points de reprise : une chute te ramène à la dernière allumée.', ms: 3600 } },
];

CUTSCENES.epreuve_sans_singe = [
  { say: [
    { who: 'xara', text: 'Ces lianes montent jusqu\'au sommet… mais sans la forme du singe, elles ne te porteront pas.' },
    { who: 'xara', text: 'L\'esprit de Kainati pourrait t\'apprendre leurs secrets. Le passage de son totem est dans l\'arène.' },
  ] },
];

CUTSCENES.epreuve_forme_aigle = [
  { toast: { text: 'Ici, ce sont les mains du singe qu\'il te faut : choisis-le au feu de camp.', ms: 3200 } },
];

CUTSCENES.epreuve_talisman = [
  { flash: { ms: 450, color: 0xbfe8a0 } },
  { set: { talismanSinge: true } },
  { say: [
    { who: 'kainati', name: 'Voix de Kainati', text: 'Tu n\'as pas touché le sol. Mon peuple te salue, Agarica.' },
    { who: 'kainati', name: 'Voix de Kainati', text: 'Ce talisman garde notre plus vieux savoir : la pierre lancée juste, de loin, sans se mettre en danger.' },
  ] },
  { skill: 'pierre' },
  { wait: 1200 },
  { say: [
    { who: 'xara', text: 'Une pierre bien lancée vaut mieux qu\'une lame trop près des crocs. Ce vieux singe est sage.' },
    { who: 'agarica', text: 'Merci, Kainati. Merci à ton peuple.' },
  ] },
  { toast: { text: 'Lancer de pierre : il coûte un peu d\'énergie. Le passage à droite redescend vers les racines.', ms: 4000 } },
];

ZONE_SCRIPTS.epreuve_singe = {
  create(scene) {
    // Au sommet : un autel de pierre et un rai de lumière, visibles de loin.
    const g = scene.add.graphics().setDepth(1);
    g.fillStyle(0xffe9a8, 0.08).fillRect(1740, -400, 120, 150);
    g.fillStyle(0x4a4058, 1).fillRoundedRect(1772, -284, 56, 28, 6);
    g.fillStyle(0x6d6480, 1).fillRoundedRect(1780, -292, 40, 10, 4);
    const beam = scene.add.rectangle(1800, -330, 60, 140, 0xffe9a8, 0.12).setDepth(1);
    scene.tweens.add({ targets: beam, alpha: 0.28, duration: 1300, yoyo: true, repeat: -1 });
    arbreGlowPassage(scene, 1890, -320, 110);
    arbreMotes(scene, 400, 1900, -380, 420, 16, [0xbfe8a0, 0xffe9a8, 0x9bff5a]);
  },
};
