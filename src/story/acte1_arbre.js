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
  const glow = scene.add.ellipse(x, y, 70, h, color, 0.3);
  const core = scene.add.ellipse(x, y, 40, h - 24, 0x1a1428, 0.9);
  storyPutBehindPlayer(scene, glow);
  storyPutBehindPlayer(scene, core);
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
function arbreDropRock(scene, x, surfaceY, telegraph = 1000) {
  // Opacité portée par l'objet (pas par le remplissage) : le tween d'alpha
  // ci-dessous la fait monter jusqu'à 0,6 (avant : ~0,15, invisible sur l'herbe).
  const shadow = scene.add.ellipse(x, surfaceY - 3, 22, 8, 0x12000c, 1).setAlpha(0.25).setDepth(990);
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

CUTSCENES.racines_cime = cutsceneBulles([
  'Là-haut, la cime. Quelque chose de grand se balance dans les lianes… Je l\'entends respirer.',
  { who: 'agarica', text: 'Le roi de l\'arbre. Je vais lui parler.' },
  'Et s\'il ne t\'écoute pas… Quand il plonge, il retombe sonné : c\'est là qu\'il faut frapper.',
]);

ZONE_SCRIPTS.grand_arbre_racines = {
  create(scene, data) {
    const st = { cfg: (data && data.rockfall) || null, timer: 600 };
    scene.__arbre = st;
    // Plus de tronc au premier plan (retour utilisateur) : ni le tronc
    // provisoire dessiné par code, ni le collage de pans d'écorce
    // (`grand_arbre_tronc_*`, dont sève corrompue et fenêtre de lune) qui
    // l'avait remplacé ; le fond `fond_grand_arbre` montre l'arbre.
    // Décors `grand_arbre_tronc_*` de la donnée : derrière les branches (les
    // décors sont sinon dessinés devant les tuiles).
    sendBehindFrontGround(scene, (scene.props || []).filter((p) => p.propType && p.propType.startsWith('grand_arbre_tronc_')));
    // Bord droit, sous la grande branche : mur invisible (le monde physique
    // continue 200 px plus loin). Pas de pilier de tuiles : un mur de 2 cases
    // ou plus partant du sol coince Agarica contre l'angle des tuiles.
    const wall = scene.add.zone(3216, 270, 32, 540);
    scene.physics.add.existing(wall, true);
    scene.physics.add.collider(scene.player, wall);
    if (scene.enemies) scene.physics.add.collider(scene.enemies, wall);
    // La fente de l'épreuve du singe, au bout des lianes (corniche gauche).
    arbreGlowPassage(scene, 40, -190, 120);
    // Lumière de la cime, en haut à droite (sortie vers l'arène).
    const cime = scene.add.ellipse(3170, -260, 120, 200, 0xffe9a8, 0.12);
    storyPutBehindPlayer(scene, cime);
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
  { who: 'kainati', text: 'Pardonne au vieux roi. Tu as lu mes bonds sans les connaître : tu as compris mon mouvement.' },
  { who: 'kainati', text: 'Derrière ma branche, l\'écorce s\'est ouverte. Là dort le totem de mon peuple : il te mènera dans l\'arbre d\'avant, où nos esprits t\'attendent.' },
  { who: 'kainati', text: 'Et quand tu seras prête, la route des hauteurs continue vers l\'est, au-delà de ma cime.' },
  { who: 'xara', text: 'Un totem qui ouvre sur le monde des esprits… Je ne pensais pas en revoir un un jour.' },
];

// Route des hauteurs sans la forme du singe : impossible au saut simple (la
// corniche de Geralt est à +192 px) -- Xara renvoie vers le passage du totem.
CUTSCENES.arene_sans_singe = [
  { call: (scene) => storyBulles(scene, [
    'Attends. Là-haut, les branches s\'écartent de trois bonnes longueurs… Tes jambes n\'y suffiront pas.',
    'Le passage du totem brille sur la branche derrière nous. Son peuple t\'attend : va d\'abord le voir.',
  ], 'Le passage du totem du singe : sur la branche haute, à gauche.') },
  { playerFace: 'left' },
  { playerMove: { toX: 1640 } },
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
// Pieds de l'esprit à chaque étape du guide (lianes = celles de la donnée de
// zone). Au sol : la surface de marche (haut de la hitbox des tuiles, là où se
// tient Agarica), pas le haut de leur image -- il flottait 16 px trop haut.
function mondeSpirituelGuidePath(scene) {
  const v = MONDE_SPIRITUEL_DATA.vines;
  const sol = (x, y) => ({ x, y: storyStandY(scene, x, y) });
  // 2 lianes par vide (une sur deux retirée, cf. monde_spirituel_data.js).
  return [v[0], v[1], sol(1470, 384), v[2], v[3], sol(2480, 448)];
}

CUTSCENES.esprit_arrivee = [
  { wait: 400 },
  { say: [
    { who: 'kainati_esprit', text: 'Bienvenue dans l\'arbre d\'avant, petite druidesse. Ici, rien ne pourrit.' },
    { who: 'agarica', text: 'Kainati ? Tu… tu brilles.' },
    { who: 'kainati_esprit', text: 'Ce que j\'étais avant la mousse. Le totem t\'a ouverte à nous : reçois notre forme.' },
  ] },
  { flash: { ms: 500, color: 0xbfe8a0 } },
  { form: 'hasMonkeyForm' },
  { wait: 900 },
  { say: [
    { who: 'kainati_esprit', text: 'En l\'air, approche-toi d\'une liane : tes mains s\'y accrocheront. Balance-toi, puis lâche avec l\'élan.' },
    { who: 'kainati_esprit', text: 'Suis mes mouvements.' },
  ] },
  { toast: { text: 'Forme du singe : en l\'air, accroche-toi aux lianes.\n← → : se balancer · Espace : lâcher · Z/S : monter/descendre', ms: 5200 } },
];

CUTSCENES.esprit_fin = [
  { playerFace: 'right' },
  { say: [
    { who: 'kainati_esprit', text: 'Tu as gardé l\'élan jusqu\'au bout. Les branches te reconnaissent.' },
    { who: 'kainati_esprit', text: 'Un jour, d\'autres esprits t\'offriront peut-être des ailes. Près d\'un feu, tu choisiras : nos mains ou leurs ailes, une seule à la fois.' },
    { who: 'agarica', text: 'Merci, Kainati. Je ferai honneur à ton peuple.' },
    { who: 'kainati_esprit', text: 'Les lianes de mes racines mènent à l\'épreuve de mon peuple. Le passage derrière moi te ramènera dans ton monde.' },
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
CUTSCENES.epreuve_intro = [
  { say: [
    { who: 'kainati', name: 'Voix de Kainati', text: 'Tu es venue. Bien. Ici, mon peuple ne touche jamais le sol.' },
    { who: 'kainati', name: 'Voix de Kainati', text: 'Cinq passages, chacun plus rude. En bas, la mousse attend ceux qui tombent. Au sommet, notre talisman.' },
  ] },
  { camera: { x: 1250, y: 120, ms: 1700 } },
  { wait: 900 },
  { cameraFollow: true },
  { toast: { text: '← → : prendre de l\'élan · Espace : lâcher quand la liane monte · Z/S : monter/descendre\nUne chute ramène à la dernière lanterne allumée.', ms: 5600 } },
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
  'L\'esprit de Kainati pourrait t\'apprendre leurs secrets. Le passage de son totem est dans l\'arène.',
]);

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
  { playerPose: 'cast' },
  { skill: 'pierre' },
  { wait: 1200 },
  { playerPose: null },
  { say: [
    { who: 'xara', text: 'Une pierre bien lancée vaut mieux qu\'une lame trop près des crocs. Ce vieux singe est sage.' },
    { who: 'agarica', text: 'Merci, Kainati. Merci à ton peuple.' },
  ] },
  { call: (scene) => epreuveOuvrirSommet(scene, false) },
  { toast: { text: 'Lancer de pierre : il coûte un peu d\'énergie. La fente, au bout du sommet, redescend vers les racines.', ms: 4000 } },
];

// La fente du sommet (raccourci vers les racines, bord droit du sommet) ne
// s'ouvre qu'une fois le talisman pris : sinon l'élan de la dernière liane y
// jetterait Agarica.
const EPREUVE_SINGE_SOMMET_X = 12088;
const EPREUVE_SINGE_SOMMET_Y = -128;
const EPREUVE_SINGE_SORTIE_SOMMET = { x: 12272, y: -186, height: 128, targetScene: 'GrandArbreRacinesScene', data: { enterId: 'from_epreuve' } };

function epreuveOuvrirSommet(scene, instant) {
  if (scene.__epreuveSommet) return;
  scene.__epreuveSommet = true;
  scene.__exits = scene.__exits || [];
  scene.__exits.push(EPREUVE_SINGE_SORTIE_SOMMET);
  const p = arbreGlowPassage(scene, 12256, -186, 110);
  if (!instant) [p.glow, p.core].forEach((o) => { o.setScale(0.1); scene.tweens.add({ targets: o, scale: 1, duration: 900, ease: 'Back.Out' }); });
}

// Plateformes d'écorce qui s'effritent (donnée `crumble`) : ~0,6 s après
// qu'Agarica s'y pose, elles tremblent puis cèdent, et repoussent 2,6 s plus tard.
const EPREUVE_CRUMBLE_DELAY_MS = 600;
const EPREUVE_CRUMBLE_RESPAWN_MS = 2600;
const EPREUVE_CRUMBLE_H = 22;

function epreuveCreateCrumbles(scene, list) {
  return (list || []).map((c) => {
    const w = c.w || 128;
    const g = scene.add.graphics({ x: c.x, y: c.y });
    g.fillStyle(0x4a3021, 1).fillRoundedRect(-w / 2, 0, w, EPREUVE_CRUMBLE_H, 7);
    g.fillStyle(0x6b4a33, 1).fillRoundedRect(-w / 2 + 4, 2, w - 8, 8, 4);
    g.fillStyle(0x3e7a2c, 1).fillRoundedRect(-w / 2 + 2, -3, w - 4, 7, 3);
    g.lineStyle(2, 0x21140d, 1);
    for (const dx of [-w * 0.28, w * 0.05, w * 0.3]) g.lineBetween(dx, 3, dx + 7, EPREUVE_CRUMBLE_H - 3);
    storyPutBehindPlayer(scene, g);
    const zone = scene.add.zone(c.x, c.y + EPREUVE_CRUMBLE_H / 2, w, EPREUVE_CRUMBLE_H);
    scene.physics.add.existing(zone, true);
    scene.physics.add.collider(scene.player, zone);
    return { c, w, g, zone, state: 'ok', until: 0 };
  });
}

function epreuveUpdateCrumbles(scene, list, now) {
  const p = scene.player;
  for (const k of list) {
    const top = k.c.y;
    if (k.state === 'ok') {
      const on = p.body.blocked.down && Math.abs(p.body.bottom - top) < 4 && Math.abs(p.x - k.c.x) < k.w / 2 + 16;
      if (on) { k.state = 'shake'; k.until = now + EPREUVE_CRUMBLE_DELAY_MS; }
    } else if (k.state === 'shake') {
      k.g.x = k.c.x + Phaser.Math.Between(-2, 2);
      if (now >= k.until) {
        k.state = 'gone';
        k.until = now + EPREUVE_CRUMBLE_RESPAWN_MS;
        k.zone.body.enable = false;
        k.g.x = k.c.x;
        if (typeof acte1Particles === 'function') acte1Particles(scene, k.c.x, top + 6, { count: 10, colors: [0x6b4a33, 0x3e7a2c], spread: k.w / 2, rise: -40 });
        scene.tweens.add({ targets: k.g, y: top + 40, alpha: 0, duration: 380, ease: 'Quad.easeIn' });
      }
    } else if (k.state === 'gone' && now >= k.until) {
      // Ne repousse pas sous les pieds d'Agarica (elle serait coincée dedans).
      const inside = Math.abs(p.x - k.c.x) < k.w / 2 + 20 && p.body.bottom > top - 4 && p.body.top < top + EPREUVE_CRUMBLE_H + 4;
      if (inside) continue;
      k.state = 'ok';
      k.zone.body.enable = true;
      scene.tweens.killTweensOf(k.g);
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
  const shadow = scene.add.ellipse(x, surfaceY - 5, 24, 8, 0x12000c, 1).setAlpha(0.3).setDepth(990);
  scene.tweens.add({
    targets: shadow, scaleX: 3, scaleY: 2, alpha: 0.8, duration: telegraph, ease: 'Sine.easeIn',
    onComplete: () => {
      if (!scene.sys || !scene.sys.isActive()) return;
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
          shadow.destroy();
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
function epreuveCreateTide(scene, t) {
  const g = scene.add.graphics();
  storyPutBehindPlayer(scene, g);
  const tide = { ...t, g, phase: 0, t: 0, top: t.low };
  epreuveDrawTide(tide, 0);
  return tide;
}

// Nappe un peu translucide (on devine le passage dessous), crête bosselée
// qui ondule et liseré de bulles toxiques : la même mousse que celle du fond.
function epreuveDrawTide(tide, time) {
  const g = tide.g;
  g.clear();
  const top = tide.top;
  const h = 560 - top;
  if (h <= 0) return;
  const x1 = tide.x;
  const x2 = tide.x + tide.w;
  const ph = time / 260;
  g.fillStyle(0x16280f, 0.86).fillRect(x1, top + 8, tide.w, h);
  g.fillStyle(0x24401a, 0.9).fillRect(x1, top + 8, tide.w, 26);
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
    const sx = EPREUVE_SINGE_SOMMET_X;
    // Au sommet : un rai de lumière au-dessus de l'autel (décor
    // `grand_arbre_autel_singe` de la donnée), visible de loin. L'ancien
    // socle dessiné par code est retiré : il doublait l'autel.
    const beam = scene.add.rectangle(sx, EPREUVE_SINGE_SOMMET_Y - 150, 64, 240, 0xffe9a8, 0.12);
    storyPutBehindPlayer(scene, beam);
    scene.tweens.add({ targets: beam, alpha: 0.28, duration: 1300, yoyo: true, repeat: -1 });
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

