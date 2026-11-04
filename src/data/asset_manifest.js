// ============================================================================
// asset_manifest.js -- GÉNÉRÉ en même temps que CODEX_SPRITES_A_GENERER.md.
// Script global (pas de module) : charger AVANT les scènes dans index.html.
//
// ASSET_MANIFEST : une entrée par feuille animée (persos, ennemis, VFX).
//   Fichiers de frames : `${dir}/${prefix}_row${row}_${i}.png` (i = 0..frames-1),
//   écrits par tools/import_codex_assets.py (même format que split_spritesheet.py).
//   Toutes les frames d'une même entrée partagent le même canvas, alignées
//   bas-centre (align "bottom") => utiliser setOrigin(0.5, 1). VFX : align
//   "center" => setOrigin(0.5, 0.5) ; "left" => setOrigin(0, 0.5).
//   facing: "right" => le sprite regarde à droite (flipX pour aller à gauche).
//   scale : setScale cible (Agarica ~86 px de haut sur l'écran 960x540).
//   placeholder : rectangle à dessiner par code tant que l'art n'existe pas
//   (taille en px ÉCRAN, déjà à l'échelle).
//   sheets/cut/align : utilisés par tools/import_codex_assets.py (qui PARSE ce
//   fichier) -- ignorables côté jeu.
// ITEM_MANIFEST : images uniques (objets, UI, icônes, portraits, fonds, totem).
// TILESET_MANIFEST : tilesets alternatifs (mêmes 21 noms que autotile_frames).
//
// CONTRAINTES DE FORMAT (le script Python parse ce fichier) : chaînes entre
// guillemets DOUBLES, pas de ":" ni de "//" dans les chaînes, clés sans
// guillemets, couleurs en 0xRRGGBB.
// ============================================================================

const ASSET_MANIFEST = {
  // [P1] Agarica - animations narratives et de plateforme manquantes
  agarica_extra: {
    dir: "assets/sprites/agarica_extra_frames", prefix: "agarica_extra",
    anims: {
      jump_rise: { row: 0, frames: 3, fps: 10, repeat: 0 },
      jump_fall: { row: 1, frames: 3, fps: 10, repeat: -1 },
      hurt: { row: 2, frames: 3, fps: 12, repeat: 0 },
      death: { row: 3, frames: 4, fps: 8, repeat: 0 },
      talk: { row: 4, frames: 4, fps: 8, repeat: -1 },
      sad: { row: 5, frames: 4, fps: 5, repeat: -1 },
      liane_hang: { row: 6, frames: 3, fps: 6, repeat: -1 },
      liane_swing: { row: 7, frames: 4, fps: 8, repeat: -1 },
      cast: { row: 8, frames: 5, fps: 10, repeat: 0 },
      receive_item: { row: 9, frames: 4, fps: 8, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 36, h: 86, color: 0x3f7d3a, label: "Agarica" },
    sheets: [
      { file: "assets/sprites/agarica_extra.png", rows: [0, 1, 2] },
      { file: "assets/sprites/agarica_extra_p2.png", rows: [3, 4, 5] },
      { file: "assets/sprites/agarica_extra_p3.png", rows: [6, 7, 8] },
      { file: "assets/sprites/agarica_extra_p4.png", rows: [9] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Agarica - attaques à la dague en arc (côté / haut / bas en l'air),
  // demandées le 2026-10-23 pour remplacer l'estoc : poses du corps SEULES
  // (dague tenue, aucune traînée) ; l'arc lumineux est la feuille vfx_slash.
  agarica_slash: {
    dir: "assets/sprites/agarica_slash_frames", prefix: "agarica_slash",
    anims: {
      side: { row: 0, frames: 4, fps: 18, repeat: 0 },
      up: { row: 1, frames: 4, fps: 18, repeat: 0 },
      down: { row: 2, frames: 4, fps: 18, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 36, h: 86, color: 0x3f7d3a, label: "Agarica" },
    sheets: [
      { file: "assets/sprites/agarica_slash.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Agarica au feu de camp (prompt Codex n°11) : elle s'assoit (sit, joué
  // une fois) puis reste assise et respire (sit_idle, en boucle). La frame 0 de
  // sit est debout neutre : c'est elle qui cale toute la feuille sur l'idle
  // (manifestSheetScale). Sans elle, la pose assise serait prise pour la
  // hauteur debout et agrandie. ~250 px debout, ~180 px assise en px source.
  agarica_repos: {
    dir: "assets/sprites/agarica_repos_frames", prefix: "agarica_repos",
    anims: {
      sit: { row: 0, frames: 4, fps: 8, repeat: 0 },
      sit_idle: { row: 1, frames: 4, fps: 4, repeat: -1 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 70, h: 62, color: 0x3f7d3a, label: "Agarica" },
    sheets: [
      { file: "assets/sprites/agarica_repos.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Forme du singe (Agarica transformée)
  singe: {
    dir: "assets/sprites/singe_frames", prefix: "singe",
    anims: {
      // Double saut : salto en boule qui tourne (boucle).
      jump: { row: 0, frames: 4, fps: 14, repeat: -1 },
      liane_hang: { row: 1, frames: 3, fps: 6, repeat: -1 },
      liane_swing: { row: 2, frames: 4, fps: 10, repeat: -1 },
      release_flip: { row: 3, frames: 5, fps: 14, repeat: 0 },
      idle: { row: 4, frames: 4, fps: 6, repeat: -1 },
      run: { row: 5, frames: 5, fps: 12, repeat: -1 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 40, h: 60, color: 0x6b4226, label: "Singe" },
    sheets: [
      { file: "assets/sprites/singe.png", rows: [0, 1, 2] },
      { file: "assets/sprites/singe_p2.png", rows: [3, 4, 5] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Transformation humaine -> singe
  transfo_singe: {
    dir: "assets/sprites/transfo_singe_frames", prefix: "transfo_singe",
    anims: {
      transform: { row: 0, frames: 4, fps: 10, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 40, h: 86, color: 0xc0602a, label: "Transfo singe" },
    sheets: [
      { file: "assets/sprites/transfo_singe.png", rows: [0] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Geralt invoque Clak (duel de la forêt flottante 1, art Codex du
  // 2026-10-23) : rangée 0 = préparation / élévation, rangée 1 = canalisation
  // (yeux blancs) / retour au sol. Même échelle que `geralt`.
  geralt_invocation: {
    dir: "assets/sprites/geralt_invocation_frames", prefix: "geralt_invocation",
    anims: {
      rise: { row: 0, frames: 4, fps: 6, repeat: 0 },
      channel: { row: 1, frames: 4, fps: 6, repeat: 0 },
    },
    scale: 0.3,
    facing: "right",
    placeholder: { w: 60, h: 75, color: 0x6b4a2e, label: "Geralt" },
    sheets: [
      { file: "assets/sprites/geralt_invocation.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Forme papillon d'Agarica (3e forme aérienne, 2026-10-23) : au 2e saut,
  // un battement d'ailes depuis la position actuelle puis un dash en ligne
  // droite en diagonale avant-haut. Grand papillon lumineux aux couleurs d'Agarica.
  forme_papillon: {
    dir: "assets/sprites/forme_papillon_frames", prefix: "forme_papillon",
    anims: {
      flap: { row: 0, frames: 4, fps: 16, repeat: 0 },
      dash: { row: 1, frames: 4, fps: 18, repeat: -1 },
      glide: { row: 2, frames: 4, fps: 10, repeat: -1 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 56, h: 48, color: 0x9fe8ff, label: "Papillon" },
    sheets: [
      { file: "assets/sprites/forme_papillon.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "center",
  },
  // [P1] Transformation humaine -> papillon (et retour, joué à l'envers)
  transfo_papillon: {
    dir: "assets/sprites/transfo_papillon_frames", prefix: "transfo_papillon",
    anims: {
      transform: { row: 0, frames: 4, fps: 14, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 40, h: 86, color: 0x9fe8ff, label: "Transfo papillon" },
    sheets: [
      { file: "assets/sprites/transfo_papillon.png", rows: [0] },
    ],
    cut: "blob", align: "center",
  },
  // [P1] Xara - parole, excitation, indice Maexxna
  xara_extra: {
    dir: "assets/sprites/xara_extra_frames", prefix: "xara_extra",
    anims: {
      talk: { row: 0, frames: 4, fps: 8, repeat: -1 },
      excited: { row: 1, frames: 4, fps: 10, repeat: -1 },
      mysterious: { row: 2, frames: 4, fps: 6, repeat: -1 },
    },
    scale: 0.12,
    facing: "right",
    placeholder: { w: 40, h: 34, color: 0x5a2a4a, label: "Xara" },
    sheets: [
      { file: "assets/sprites/xara_extra.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Le père d'Agarica, chef du bosquet
  pere_chef: {
    dir: "assets/sprites/pere_chef_frames", prefix: "pere_chef",
    anims: {
      idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      talk: { row: 1, frames: 4, fps: 8, repeat: -1 },
      give_talisman: { row: 2, frames: 5, fps: 8, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 40, h: 102, color: 0x2e5e34, label: "Chef" },
    sheets: [
      { file: "assets/sprites/pere_chef.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Amanite, la tiefling
  amanite: {
    dir: "assets/sprites/amanite_frames", prefix: "amanite",
    anims: {
      idle: { row: 0, frames: 4, fps: 6, repeat: -1 },
      talk: { row: 1, frames: 4, fps: 8, repeat: -1 },
      run_idol: { row: 2, frames: 5, fps: 12, repeat: -1 },
      spear_thrust: { row: 3, frames: 4, fps: 12, repeat: 0 },
      walk_angry: { row: 4, frames: 5, fps: 9, repeat: -1 },
    },
    scale: 0.31,
    facing: "right",
    placeholder: { w: 36, h: 104, color: 0xb3242a, label: "Amanite" },
    sheets: [
      { file: "assets/sprites/amanite.png", rows: [0, 1, 2] },
      { file: "assets/sprites/amanite_p2.png", rows: [3, 4] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Habitant druide (gratte / brûle la mousse)
  habitant_druide: {
    dir: "assets/sprites/habitant_druide_frames", prefix: "habitant_druide",
    anims: {
      idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      scrape: { row: 1, frames: 4, fps: 8, repeat: -1 },
      burn: { row: 2, frames: 4, fps: 8, repeat: -1 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 36, h: 94, color: 0x6b8e4e, label: "Druide" },
    sheets: [
      { file: "assets/sprites/habitant_druide.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Habitant porteur de seaux
  habitant_porteur: {
    dir: "assets/sprites/habitant_porteur_frames", prefix: "habitant_porteur",
    anims: {
      walk_carry: { row: 0, frames: 5, fps: 8, repeat: -1 },
      idle: { row: 1, frames: 4, fps: 5, repeat: -1 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 44, h: 94, color: 0x8a6a3e, label: "Porteur" },
    sheets: [
      { file: "assets/sprites/habitant_porteur.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Garde du bosquet
  habitant_garde: {
    dir: "assets/sprites/habitant_garde_frames", prefix: "habitant_garde",
    anims: {
      idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      push: { row: 1, frames: 4, fps: 10, repeat: 0 },
      walk: { row: 2, frames: 5, fps: 9, repeat: -1 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 40, h: 97, color: 0x3d5a2a, label: "Garde" },
    sheets: [
      { file: "assets/sprites/habitant_garde.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Geralt, ranger halfelin
  geralt: {
    dir: "assets/sprites/geralt_frames", prefix: "geralt",
    anims: {
      idle: { row: 0, frames: 4, fps: 6, repeat: -1 },
      talk: { row: 1, frames: 4, fps: 8, repeat: -1 },
      attack_miss: { row: 2, frames: 5, fps: 10, repeat: 0 },
      trip_fall: { row: 3, frames: 5, fps: 10, repeat: 0 },
      map_reading: { row: 4, frames: 4, fps: 5, repeat: -1 },
      walk: { row: 5, frames: 5, fps: 9, repeat: -1 },
    },
    scale: 0.30,
    facing: "right",
    placeholder: { w: 34, h: 70, color: 0x7a5c3a, label: "Geralt" },
    sheets: [
      { file: "assets/sprites/geralt.png", rows: [0, 1, 2] },
      { file: "assets/sprites/geralt_p2.png", rows: [3, 4, 5] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Geralt au combat (duel de la forêt flottante 1, prompt Codex n°9) :
  // tir droit / en cloche, saut avec tir plongeant, réception ratée, sonné,
  // pose d'un collet, pris à son propre collet, touché. Même échelle source
  // que `geralt` (~230 px debout) ; calibré par planche sur son idle
  // (GeraltDuel.sheetFactor). Frames figées par le code : voir
  // docs/production/PROMPT_CODEX_9_GERALT.md.
  geralt_combat: {
    dir: "assets/sprites/geralt_combat_frames", prefix: "geralt_combat",
    anims: {
      shoot: { row: 0, frames: 5, fps: 12, repeat: 0 },
      shoot_up: { row: 1, frames: 5, fps: 12, repeat: 0 },
      jump_shoot: { row: 2, frames: 4, fps: 10, repeat: 0 },
      crash: { row: 3, frames: 4, fps: 10, repeat: 0 },
      stunned: { row: 4, frames: 4, fps: 6, repeat: -1 },
      set_trap: { row: 5, frames: 4, fps: 10, repeat: 0 },
      trapped: { row: 6, frames: 4, fps: 10, repeat: 0 },
      hurt: { row: 7, frames: 3, fps: 12, repeat: 0 },
    },
    scale: 0.30,
    facing: "right",
    placeholder: { w: 34, h: 70, color: 0x7a5c3a, label: "Geralt" },
    sheets: [
      { file: "assets/sprites/geralt_combat.png", rows: [0, 1, 2] },
      { file: "assets/sprites/geralt_combat_p2.png", rows: [3, 4, 5] },
      { file: "assets/sprites/geralt_combat_p3.png", rows: [6, 7] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Clak, le crabe totem de Geralt
  clak: {
    dir: "assets/sprites/clak_frames", prefix: "clak",
    anims: {
      idle: { row: 0, frames: 4, fps: 6, repeat: -1 },
      scuttle: { row: 1, frames: 4, fps: 12, repeat: -1 },
      snap: { row: 2, frames: 4, fps: 12, repeat: 0 },
    },
    scale: 0.19,
    facing: "right",
    placeholder: { w: 40, h: 30, color: 0xd0502a, label: "Clak" },
    sheets: [
      { file: "assets/sprites/clak.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Morgat, la guérisseuse aux papillons
  morgat: {
    dir: "assets/sprites/morgat_frames", prefix: "morgat",
    anims: {
      idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      talk: { row: 1, frames: 4, fps: 8, repeat: -1 },
      brew: { row: 2, frames: 5, fps: 8, repeat: -1 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 40, h: 92, color: 0x2f8f8a, label: "Morgat" },
    sheets: [
      { file: "assets/sprites/morgat.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Papillon lumineux
  papillon: {
    dir: "assets/sprites/papillon_frames", prefix: "papillon",
    anims: {
      idle: { row: 0, frames: 4, fps: 14, repeat: -1 },
    },
    scale: 0.1,
    facing: "right",
    placeholder: { w: 14, h: 12, color: 0x6ff0e0, label: "Papillon" },
    sheets: [
      { file: "assets/sprites/papillon.png", rows: [0] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P3] Bébé cochon
  cochon_bebe: {
    dir: "assets/sprites/cochon_bebe_frames", prefix: "cochon_bebe",
    anims: {
      idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      walk: { row: 1, frames: 4, fps: 10, repeat: -1 },
    },
    scale: 0.2,
    facing: "right",
    placeholder: { w: 44, h: 32, color: 0xd09080, label: "Cochon" },
    sheets: [
      { file: "assets/sprites/cochon_bebe.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // Trois bébés cochons de couleurs différentes (art Codex) : un par cochon du bosquet.
  cochon_bebe_rose: {
    dir: "assets/sprites/cochon_bebe_rose_frames", prefix: "cochon_bebe_rose",
    anims: {
      idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      walk: { row: 1, frames: 4, fps: 10, repeat: -1 },
    },
    scale: 0.2,
    facing: "right",
    placeholder: { w: 44, h: 32, color: 0xf0a8b8, label: "Cochon" },
    sheets: [
      { file: "assets/sprites/cochon_bebe_rose.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  cochon_bebe_gris: {
    dir: "assets/sprites/cochon_bebe_gris_frames", prefix: "cochon_bebe_gris",
    anims: {
      idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      walk: { row: 1, frames: 4, fps: 10, repeat: -1 },
    },
    scale: 0.2,
    facing: "right",
    placeholder: { w: 44, h: 32, color: 0x9a9aa2, label: "Cochon" },
    sheets: [
      { file: "assets/sprites/cochon_bebe_gris.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  cochon_bebe_orange: {
    dir: "assets/sprites/cochon_bebe_orange_frames", prefix: "cochon_bebe_orange",
    anims: {
      idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      walk: { row: 1, frames: 4, fps: 10, repeat: -1 },
    },
    scale: 0.2,
    facing: "right",
    placeholder: { w: 44, h: 32, color: 0xe0a060, label: "Cochon" },
    sheets: [
      { file: "assets/sprites/cochon_bebe_orange.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P3] Poisson de la source
  poisson: {
    dir: "assets/sprites/poisson_frames", prefix: "poisson",
    anims: {
      idle: { row: 0, frames: 4, fps: 8, repeat: -1 },
    },
    scale: 0.14,
    facing: "right",
    placeholder: { w: 36, h: 16, color: 0x6fb0b8, label: "Poisson" },
    sheets: [
      { file: "assets/sprites/poisson.png", rows: [0] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Kainati, Roi des Simiens (boss corrompu)
  kainati: {
    dir: "assets/sprites/kainati_frames", prefix: "kainati",
    anims: {
      idle: { row: 0, frames: 4, fps: 6, repeat: -1 },
      throw_stone: { row: 1, frames: 4, fps: 10, repeat: 0 },
      swing_vine: { row: 2, frames: 4, fps: 8, repeat: -1 },
      leap: { row: 3, frames: 4, fps: 10, repeat: 0 },
      land_stomp: { row: 4, frames: 4, fps: 10, repeat: 0 },
      hit: { row: 5, frames: 3, fps: 12, repeat: 0 },
      defeated_lucid: { row: 6, frames: 4, fps: 5, repeat: 0 },
    },
    scale: 0.6,
    facing: "right",
    placeholder: { w: 195, h: 210, color: 0xe8e8e8, label: "Kainati" },
    sheets: [
      { file: "assets/sprites/kainati.png", rows: [0, 1] },
      { file: "assets/sprites/kainati_p2.png", rows: [2, 3] },
      { file: "assets/sprites/kainati_p3.png", rows: [4, 5] },
      { file: "assets/sprites/kainati_p4.png", rows: [6] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Kainati au sol (refonte du combat, 2026-10-23) : il ne monte plus sur
  // les lianes ; ses grandes attaques couvrent tout le sol de l'arène et
  // s'esquivent suspendue aux lianes (forme singe). Même échelle que `kainati`.
  kainati_sol: {
    dir: "assets/sprites/kainati_sol_frames", prefix: "kainati_sol",
    anims: {
      charge: { row: 0, frames: 4, fps: 12, repeat: -1 },
      roar: { row: 1, frames: 4, fps: 8, repeat: 0 },
      slam: { row: 2, frames: 4, fps: 12, repeat: 0 },
      sweep: { row: 3, frames: 4, fps: 12, repeat: 0 },
      stunned: { row: 4, frames: 4, fps: 6, repeat: -1 },
    },
    scale: 0.6,
    facing: "right",
    placeholder: { w: 195, h: 210, color: 0xe8e8e8, label: "Kainati" },
    sheets: [
      { file: "assets/sprites/kainati_sol.png", rows: [0, 1] },
      { file: "assets/sprites/kainati_sol_p2.png", rows: [2, 3] },
      { file: "assets/sprites/kainati_sol_p3.png", rows: [4] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Kainati - forme d'esprit ancestral (monde spirituel)
  kainati_esprit: {
    dir: "assets/sprites/kainati_esprit_frames", prefix: "kainati_esprit",
    anims: {
      idle: { row: 0, frames: 4, fps: 6, repeat: -1 },
      swing: { row: 1, frames: 4, fps: 8, repeat: -1 },
    },
    scale: 0.6,
    facing: "right",
    placeholder: { w: 195, h: 210, color: 0x9ff0e0, label: "Esprit Kainati" },
    sheets: [
      { file: "assets/sprites/kainati_esprit.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Kainati épargné (après le combat) : assis, calme, lucide -- revisites
  // de l'arène et « E : parler ». Même échelle que `kainati` (recalé par
  // surface visible sur `defeated_lucid` frame 4 si besoin). Prompt Codex n°9.
  kainati_calme: {
    dir: "assets/sprites/kainati_calme_frames", prefix: "kainati_calme",
    anims: {
      sit_idle: { row: 0, frames: 4, fps: 5, repeat: -1 },
      sit_talk: { row: 1, frames: 4, fps: 7, repeat: -1 },
    },
    scale: 0.6,
    facing: "right",
    placeholder: { w: 195, h: 210, color: 0xe8e8e8, label: "Kainati" },
    sheets: [
      { file: "assets/sprites/kainati_calme.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Esprit simien ancestral : donne la forme singe (monde spirituel).
  // Prompt Codex n°9.
  kainati_esprit_extra: {
    dir: "assets/sprites/kainati_esprit_extra_frames", prefix: "kainati_esprit_extra",
    anims: {
      give: { row: 0, frames: 4, fps: 6, repeat: 0 },
    },
    scale: 0.6,
    facing: "right",
    placeholder: { w: 195, h: 210, color: 0x9ff0e0, label: "Esprit" },
    sheets: [
      { file: "assets/sprites/kainati_esprit_extra.png", rows: [0] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Ghil't, le Fléau de la Forêt (boss corrompu)
  ghilt: {
    dir: "assets/sprites/ghilt_frames", prefix: "ghilt",
    anims: {
      idle: { row: 0, frames: 3, fps: 4, repeat: -1 },
      walk: { row: 1, frames: 3, fps: 5, repeat: -1 },
      charge: { row: 2, frames: 3, fps: 10, repeat: -1 },
      toxic_breath: { row: 3, frames: 3, fps: 6, repeat: 0 },
      spit: { row: 4, frames: 3, fps: 8, repeat: 0 },
      roar: { row: 5, frames: 3, fps: 6, repeat: 0 },
      hit: { row: 6, frames: 3, fps: 10, repeat: 0 },
      weakened: { row: 7, frames: 3, fps: 4, repeat: -1 },
    },
    scale: 0.72,
    facing: "right",
    placeholder: { w: 330, h: 238, color: 0x3a4a5a, label: "Ghil't" },
    sheets: [
      { file: "assets/sprites/ghilt.png", rows: [0, 1] },
      { file: "assets/sprites/ghilt_p2.png", rows: [2, 3] },
      { file: "assets/sprites/ghilt_p3.png", rows: [4, 5] },
      { file: "assets/sprites/ghilt_p4.png", rows: [6, 7] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] Ghil't guéri (le gardien retrouvé)
  ghilt_gueri: {
    dir: "assets/sprites/ghilt_gueri_frames", prefix: "ghilt_gueri",
    anims: {
      idle: { row: 0, frames: 3, fps: 4, repeat: -1 },
      collapse: { row: 1, frames: 3, fps: 5, repeat: 0 },
    },
    scale: 0.72,
    facing: "right",
    placeholder: { w: 330, h: 238, color: 0x5a7aa0, label: "Ghil't gueri" },
    sheets: [
      { file: "assets/sprites/ghilt_gueri.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Loup sanguinaire (ennemi)
  loup_sanguinaire: {
    dir: "assets/sprites/loup_sanguinaire_frames", prefix: "loup_sanguinaire",
    anims: {
      patrol: { row: 0, frames: 4, fps: 8, repeat: -1 },
      charge: { row: 1, frames: 4, fps: 14, repeat: -1 },
      bite: { row: 2, frames: 4, fps: 12, repeat: 0 },
    },
    scale: 0.33,
    facing: "right",
    placeholder: { w: 110, h: 72, color: 0x6a1a22, label: "Loup sang." },
    sheets: [
      { file: "assets/sprites/loup_sanguinaire.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Araignée hostile (ennemi)
  araignee: {
    dir: "assets/sprites/araignee_frames", prefix: "araignee",
    anims: {
      idle: { row: 0, frames: 4, fps: 6, repeat: -1 },
      walk: { row: 1, frames: 4, fps: 12, repeat: -1 },
      attack: { row: 2, frames: 4, fps: 12, repeat: 0 },
    },
    scale: 0.25,
    facing: "right",
    placeholder: { w: 70, h: 42, color: 0x3a2a4a, label: "Araignee" },
    sheets: [
      { file: "assets/sprites/araignee.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Créature de mousse (ennemi)
  mousse_creature: {
    dir: "assets/sprites/mousse_creature_frames", prefix: "mousse_creature",
    anims: {
      idle: { row: 0, frames: 4, fps: 8, repeat: -1 },
      attack: { row: 1, frames: 4, fps: 10, repeat: 0 },
      death: { row: 2, frames: 5, fps: 10, repeat: 0 },
    },
    scale: 0.26,
    facing: "right",
    placeholder: { w: 56, h: 44, color: 0x5fd02a, label: "Mousse" },
    sheets: [
      { file: "assets/sprites/mousse_creature.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Crapaud corrompu (ennemi, même layout que le crapaud existant)
  crapaud_corrompu: {
    dir: "assets/sprites/crapaud_corrompu_frames", prefix: "crapaud_corrompu",
    anims: {
      attack: { row: 0, frames: 5, fps: 26, repeat: 0 },
      idle: { row: 1, frames: 4, fps: 6, repeat: -1 },
    },
    scale: 0.26,
    facing: "right",
    placeholder: { w: 68, h: 62, color: 0x6a7a2a, label: "Crapaud c." },
    sheets: [
      { file: "assets/sprites/crapaud_corrompu.png", rows: [0, 0, 1], frames: [4, 1, 4] },
    ],
    cut: "blob", align: "left-bottom",
    canvas: [1434, 237],
  },
  // [P2] Petit singe corrompu (sbire de Kainati)
  singe_corrompu: {
    dir: "assets/sprites/singe_corrompu_frames", prefix: "singe_corrompu",
    anims: {
      idle: { row: 0, frames: 4, fps: 6, repeat: -1 },
      run: { row: 1, frames: 5, fps: 12, repeat: -1 },
      throw: { row: 2, frames: 4, fps: 10, repeat: 0 },
    },
    scale: 0.28,
    facing: "right",
    placeholder: { w: 40, h: 50, color: 0x4a3a5a, label: "Singe c." },
    sheets: [
      { file: "assets/sprites/singe_corrompu.png", rows: [0, 1, 2] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P1] VFX - soin des papillons (compétence papillon)
  vfx_soin_papillon: {
    dir: "assets/vfx/vfx_soin_papillon_frames", prefix: "vfx_soin_papillon",
    anims: {
      swirl: { row: 0, frames: 4, fps: 12, repeat: -1 },
      burst: { row: 1, frames: 4, fps: 12, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 120, h: 120, color: 0x6ff0e0, label: "Soin" },
    sheets: [
      { file: "assets/vfx/vfx_soin_papillon.png", rows: [0, 1] },
    ],
    cut: "grid", align: "center",
  },
  // [P1] VFX - arcs de la dague (côté / haut / bas) : la forme de l'arc EST la
  // zone qui touche (Player : hitbox calée sur l'arc affiché).
  vfx_slash: {
    dir: "assets/vfx/vfx_slash_frames", prefix: "vfx_slash",
    anims: {
      side: { row: 0, frames: 3, fps: 20, repeat: 0 },
      up: { row: 1, frames: 3, fps: 20, repeat: 0 },
      down: { row: 2, frames: 3, fps: 20, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 110, h: 80, color: 0x9fffd0, label: "Slash" },
    sheets: [
      { file: "assets/vfx/vfx_slash.png", rows: [0, 1, 2] },
    ],
    cut: "grid", align: "center",
  },
  // [P1] VFX - morsure du loup (prompt Codex n°11) : deux rangées de crocs
  // clairs qui se referment devant la gueule, trait vert lunaire, même finition
  // que vfx_slash. Dessiné vers la droite (flipX pour la gauche). Fermeture
  // complète (l'impact) à la frame 2.
  vfx_croc: {
    dir: "assets/vfx/vfx_croc_frames", prefix: "vfx_croc",
    anims: {
      bite: { row: 0, frames: 5, fps: 20, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 80, h: 70, color: 0x9fffd0, label: "Croc" },
    sheets: [
      { file: "assets/vfx/vfx_croc.png", rows: [0] },
    ],
    cut: "grid", align: "center",
  },
  // [P2] VFX - souffle toxique de Ghil't
  vfx_souffle_toxique: {
    dir: "assets/vfx/vfx_souffle_toxique_frames", prefix: "vfx_souffle_toxique",
    anims: {
      start: { row: 0, frames: 3, fps: 12, repeat: 0 },
      idle: { row: 1, frames: 3, fps: 10, repeat: -1 },
    },
    scale: 0.42,
    facing: "right",
    placeholder: { w: 200, h: 90, color: 0x7fe02a, label: "Souffle" },
    sheets: [
      { file: "assets/vfx/vfx_souffle_toxique.png", rows: [0, 1] },
    ],
    cut: "grid", align: "left",
  },
  // [P2] VFX - flaque de mousse toxique au sol
  vfx_flaque_mousse: {
    dir: "assets/vfx/vfx_flaque_mousse_frames", prefix: "vfx_flaque_mousse",
    anims: {
      spawn: { row: 0, frames: 4, fps: 10, repeat: 0 },
      idle: { row: 1, frames: 4, fps: 6, repeat: -1 },
    },
    scale: 0.36,
    facing: "right",
    placeholder: { w: 128, h: 40, color: 0x5fd02a, label: "Flaque" },
    sheets: [
      { file: "assets/vfx/vfx_flaque_mousse.png", rows: [0, 1] },
    ],
    cut: "grid", align: "bottom",
  },
  // [P2] VFX - purification (la mousse se retire)
  vfx_purification: {
    dir: "assets/vfx/vfx_purification_frames", prefix: "vfx_purification",
    anims: {
      burst: { row: 0, frames: 4, fps: 12, repeat: 0 },
      fade: { row: 1, frames: 4, fps: 10, repeat: 0 },
    },
    scale: 0.46,
    facing: "right",
    placeholder: { w: 160, h: 160, color: 0xf0ffe0, label: "Purif." },
    sheets: [
      { file: "assets/vfx/vfx_purification.png", rows: [0, 1] },
    ],
    cut: "grid", align: "center",
  },
  // [P2] VFX - piste lumineuse (empreintes de loup)
  vfx_piste_loup: {
    dir: "assets/vfx/vfx_piste_loup_frames", prefix: "vfx_piste_loup",
    anims: {
      appear: { row: 0, frames: 4, fps: 10, repeat: 0 },
      glow: { row: 1, frames: 4, fps: 6, repeat: -1 },
    },
    scale: 0.1,
    facing: "right",
    placeholder: { w: 20, h: 8, color: 0x7fffd0, label: "Piste" },
    sheets: [
      { file: "assets/vfx/vfx_piste_loup.png", rows: [0, 1] },
    ],
    cut: "grid", align: "bottom",
  },
  // [P2] VFX - impact de pierre (lancers de Kainati)
  // [P1] VFX - onde de choc au sol de Kainati (couvre tout le sol de l'arène,
  // le jeu la répète en largeur) : 4 frames, posée au sol.
  vfx_onde_choc: {
    dir: "assets/vfx/vfx_onde_choc_frames", prefix: "vfx_onde_choc",
    anims: {
      idle: { row: 0, frames: 4, fps: 14, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 160, h: 50, color: 0xc9b38a, label: "Onde" },
    sheets: [
      { file: "assets/vfx/vfx_onde_choc.png", rows: [0] },
    ],
    cut: "grid", align: "bottom",
  },
  // [P1] VFX - vague de mousse toxique qui balaie le sol (attaque de Kainati)
  vfx_vague_mousse: {
    dir: "assets/vfx/vfx_vague_mousse_frames", prefix: "vfx_vague_mousse",
    anims: {
      idle: { row: 0, frames: 4, fps: 12, repeat: -1 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 120, h: 60, color: 0x6bbf3a, label: "Vague" },
    sheets: [
      { file: "assets/vfx/vfx_vague_mousse.png", rows: [0] },
    ],
    cut: "grid", align: "bottom",
  },
  // [P1] VFX - colonne de lumière où Clak se matérialise (invocation de Geralt).
  vfx_invocation_clak: {
    dir: "assets/vfx/vfx_invocation_clak_frames", prefix: "vfx_invocation_clak",
    anims: {
      idle: { row: 0, frames: 4, fps: 6, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 100, h: 260, color: 0xfff6e0, label: "Invocation" },
    sheets: [
      { file: "assets/vfx/vfx_invocation_clak.png", rows: [0] },
    ],
    cut: "grid", align: "bottom",
  },
  vfx_impact_pierre: {
    dir: "assets/vfx/vfx_impact_pierre_frames", prefix: "vfx_impact_pierre",
    anims: {
      idle: { row: 0, frames: 5, fps: 16, repeat: 0 },
    },
    scale: 0.24,
    facing: "right",
    placeholder: { w: 60, h: 40, color: 0x9a8a7a, label: "Impact" },
    sheets: [
      { file: "assets/vfx/vfx_impact_pierre.png", rows: [0] },
    ],
    cut: "grid", align: "bottom",
  },
  // ===== Lot Codex n°8 (2026-10-23, docs/production/PROMPT_CODEX_8.md) =====
  // [P3] Forme singe d'Agarica - grimper le long d'une liane (liane
  // invisible, mains l'une au-dessus de l'autre ; jouer à l'envers pour
  // descendre) et lancer d'une pierre (compétence pierre ; la pierre est
  // collée à la main jusqu'au lâcher, ensuite asset `pierre`).
  singe_extra: {
    dir: "assets/sprites/singe_extra_frames", prefix: "singe_extra",
    anims: {
      climb: { row: 0, frames: 4, fps: 10, repeat: -1 },
      throw: { row: 1, frames: 4, fps: 14, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 40, h: 60, color: 0x6b4226, label: "Singe" },
    sheets: [
      { file: "assets/sprites/singe_extra.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P3] Forme papillon - lancer de la compétence de soin (ailes déployées,
  // lueur de soin dessinée SUR le corps). Même échelle que forme_papillon.
  forme_papillon_extra: {
    dir: "assets/sprites/forme_papillon_extra_frames", prefix: "forme_papillon_extra",
    anims: {
      cast: { row: 0, frames: 4, fps: 10, repeat: 0 },
    },
    scale: 0.34,
    facing: "right",
    placeholder: { w: 56, h: 48, color: 0x9fe8ff, label: "Papillon" },
    sheets: [
      { file: "assets/sprites/forme_papillon_extra.png", rows: [0] },
    ],
    cut: "blob", align: "center",
  },
  // [P3] Singe sauvage guéri (même famille et même échelle que
  // singe_corrompu, sans mousse, yeux sombres) : remplace la silhouette
  // dessinée de SingeCorrompu une fois soigné.
  singe_gueri: {
    dir: "assets/sprites/singe_gueri_frames", prefix: "singe_gueri",
    anims: {
      idle: { row: 0, frames: 4, fps: 6, repeat: -1 },
      run: { row: 1, frames: 5, fps: 12, repeat: -1 },
    },
    scale: 0.28,
    facing: "right",
    placeholder: { w: 44, h: 58, color: 0x8a5a32, label: "Singe gueri" },
    sheets: [
      { file: "assets/sprites/singe_gueri.png", rows: [0, 1] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] VFX - mousse toxique liquide : bulle qui monte du lac et crève
  // (épreuve du singe), boule de mousse crachée par Ghil't (en vol, boucle),
  // goutte toxique des ennemis corrompus (frames 0-1 pendant la chute,
  // 2-3 à l'impact).
  // align "bottom" (et non "center") : la bulle naît posée sur le lac,
  // setOrigin(0.5, 1) ; en "center" elle flottait jusqu'à 5 px au-dessus.
  // La boule remplit presque tout le canvas (227x159) : son corps est en
  // x 0,65 et y 0,5 de la frame dans les deux alignements.
  vfx_mousse_toxique: {
    dir: "assets/vfx/vfx_mousse_toxique_frames", prefix: "vfx_mousse_toxique",
    anims: {
      bulle: { row: 0, frames: 4, fps: 10, repeat: 0 },
      boule: { row: 1, frames: 4, fps: 12, repeat: -1 },
      goutte: { row: 2, frames: 4, fps: 12, repeat: 0 },
    },
    scale: 0.12,
    facing: "right",
    placeholder: { w: 22, h: 22, color: 0x9bff5a, label: "Mousse" },
    sheets: [
      { file: "assets/vfx/vfx_mousse_toxique.png", rows: [0, 1, 2] },
    ],
    cut: "grid", align: "bottom",
  },
  // [P2] VFX - anneau de choc qui s'élargit : vert toxique (Ghil't) et ambre
  // (réveil du talisman de l'ours). Mode ADD obligatoire ; déjà coloré, NON
  // teintable : réservé aux variantes toxique et talisman (ailleurs, anneau
  // dessiné teinté, cf. juiceShockRing).
  // align "ring" : chaque frame est centrée sur le cercle ajusté de l'anneau
  // (son centre dérivait jusqu'à 20 px : les débris décentrent la boîte) ;
  // setOrigin(0.5, 0.5) = centre de l'anneau. Canvas calculé par l'import.
  vfx_anneau_choc: {
    dir: "assets/vfx/vfx_anneau_choc_frames", prefix: "vfx_anneau_choc",
    anims: {
      toxique: { row: 0, frames: 4, fps: 14, repeat: 0 },
      talisman: { row: 1, frames: 4, fps: 14, repeat: 0 },
    },
    scale: 0.3,
    facing: "right",
    placeholder: { w: 90, h: 90, color: 0x9bff5a, label: "Anneau" },
    sheets: [
      { file: "assets/vfx/vfx_anneau_choc.png", rows: [0, 1] },
    ],
    cut: "grid", align: "ring",
  },
};

const ITEM_MANIFEST = {
  // [P1] Rocher roulant lancé par Kainati sur toute la largeur du sol (le jeu le fait tourner).
  rocher_roulant: {
    path: "assets/items/objets/rocher_roulant.png", scale: 0.3,
    placeholder: { w: 70, h: 70, color: 0x8a8378, label: "Rocher" },
    src: { file: "assets/_codex_src/rocher_roulant.png" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] a rough grey throwing rock the size of a fist, with a few lighter chips and a tiny moss sp
  pierre: {
    path: "assets/items/objets/pierre.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0x8a8a8a, label: "pierre" },
    src: { planche: "assets/_codex_src/objets_A.png", grid: [3, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] the Emerald Grove idol: a small carved statuette of green jade-like stone showing a seated
  idole: {
    path: "assets/items/objets/idole.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0x2fa060, label: "idole" },
    src: { planche: "assets/_codex_src/objets_A.png", grid: [3, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] a broken shard of the same green jade idol (a piece of the leaf crown and head), cracked e
  idole_fragment: {
    path: "assets/items/objets/idole_fragment.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0x2fa060, label: "idole_fragment" },
    src: { planche: "assets/_codex_src/objets_A.png", grid: [3, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] the BEAR talisman: a round wooden medallion carved with a bear paw, polished amber inlay, 
  talisman_ours: {
    path: "assets/items/objets/talisman_ours.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0xa0703a, label: "talisman_ours" },
    src: { planche: "assets/_codex_src/objets_A.png", grid: [3, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] the MONKEY talisman: a round wooden medallion carved with a curled monkey tail spiral, a s
  talisman_singe: {
    path: "assets/items/objets/talisman_singe.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0xa0703a, label: "talisman_singe" },
    src: { planche: "assets/_codex_src/objets_A.png", grid: [3, 2], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] a broken POCKET TOTEM: a small carved wooden mini-totem (hand-sized) topped with a butterf
  totem_poche_casse: {
    path: "assets/items/objets/totem_poche_casse.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0x7a6a5a, label: "totem_poche_casse" },
    src: { planche: "assets/_codex_src/objets_A.png", grid: [3, 2], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] the same POCKET TOTEM repaired and active: crack sealed with glowing cyan light, butterfly
  totem_poche_actif: {
    path: "assets/items/objets/totem_poche_actif.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0x6ff0e0, label: "totem_poche_actif" },
    src: { planche: "assets/_codex_src/objets_B.png", grid: [3, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] a small round glass jar with a cork and twine, filled with a glowing mint-green and cyan l
  bocal_antidote: {
    path: "assets/items/objets/bocal_antidote.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0x7ff0c0, label: "bocal_antidote" },
    src: { planche: "assets/_codex_src/objets_B.png", grid: [3, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] a small leather-wrapped gourd flask with a wooden stopper, a pale white-yellow flower tied
  repulsif: {
    path: "assets/items/objets/repulsif.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0xd0b060, label: "repulsif" },
    src: { planche: "assets/_codex_src/objets_B.png", grid: [3, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] the RESISTANT FLOWER: a pure white flower with five large petals and a glowing golden-whit
  fleur_resistante: {
    path: "assets/items/objets/fleur_resistante.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0x4fa86a, label: "fleur_resistante" },
    src: { planche: "assets/_codex_src/objets_B.png", grid: [3, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] Geralt's map as an inventory item: a rolled-up parchment scroll tied with a cord, a corner
  carte_geralt: {
    path: "assets/items/objets/carte_geralt.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0xd8c08a, label: "carte_geralt" },
    src: { planche: "assets/_codex_src/objets_B.png", grid: [3, 2], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] Amanite's spear: a long wooden shaft wrapped with red cloth, a leaf-shaped black obsidian 
  lance_amanite: {
    path: "assets/items/objets/lance_amanite.png", scale: 0.16,
    placeholder: { w: 64, h: 10, color: 0x3a2a2a, label: "lance_amanite" },
    src: { planche: "assets/_codex_src/objets_B.png", grid: [3, 2], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P1] a dense waist-high MOUND of toxic moss blocking a path: lumpy glowing toxic-green moss ove
  mousse_amas_intact: {
    path: "assets/items/objets/mousse_amas_intact.png", scale: 0.25,
    placeholder: { w: 128, h: 96, color: 0x3fa02a, label: "mousse_amas_intact" },
    src: { planche: "assets/_codex_src/mousse_amas.png", grid: [2, 1], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  // [P1] EXACTLY the same moss mound, same shape and size, but cracked: deep glowing fissures of wh
  mousse_amas_fissure: {
    path: "assets/items/objets/mousse_amas_fissure.png", scale: 0.25,
    placeholder: { w: 128, h: 96, color: 0x8fd02a, label: "mousse_amas_fissure" },
    src: { planche: "assets/_codex_src/mousse_amas.png", grid: [2, 1], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  // [P2] a FULL health heart icon: a heart made of a glossy red-pink berry/leaf shape with a tiny g
  hud_coeur: {
    path: "assets/ui/hud_coeur.png", scale: 0.19,
    placeholder: { w: 24, h: 24, color: 0xe03050, label: "hud_coeur" },
    src: { planche: "assets/_codex_src/hud_coeurs.png", grid: [2, 1], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  // [P2] the SAME heart icon, same shape and size, but EMPTY: dark hollow interior (deep violet-gre
  hud_coeur_vide: {
    path: "assets/ui/hud_coeur_vide.png", scale: 0.19,
    placeholder: { w: 24, h: 24, color: 0x4a3a4a, label: "hud_coeur_vide" },
    src: { planche: "assets/_codex_src/hud_coeurs.png", grid: [2, 1], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  // [P1] the MONKEY totem, UNLIT: a tall carved wooden totem pole topped by a monkey head (round ea
  totem_monkey_dim: {
    path: "assets/items/totem_frames/totem_monkey_dim.png", scale: 0.35,
    placeholder: { w: 78, h: 264, color: 0x6a4a2a, label: "totem_monkey_dim" },
    src: { planche: "assets/_codex_src/totems_singe.png", grid: [2, 1], cell: 0, cut: "columns" },
    norm: { mode: "height", value: 754 },
  },
  // [P1] the SAME monkey totem, LIT: identical shape, the eyes and the spiral-tail medallion glowin
  totem_monkey_lit: {
    path: "assets/items/totem_frames/totem_monkey_lit.png", scale: 0.35,
    placeholder: { w: 78, h: 264, color: 0x6a4a2a, label: "totem_monkey_lit" },
    src: { planche: "assets/_codex_src/totems_singe.png", grid: [2, 1], cell: 1, cut: "columns" },
    norm: { mode: "height", value: 754 },
  },
  // [P1] Liane (segment vertical tileable)
  liane: {
    path: "assets/items/objets/liane.png", scale: 0.25,
    placeholder: { w: 12, h: 128, color: 0x4a7a2a, label: "Liane" },
    src: { file: "assets/_codex_src/liane.png" },
    norm: { mode: "height", value: 512, trim_x: true },
  },
  // [P1] Mur de mousse (bloque un passage, ouvert par le répulsif)
  mousse_mur: {
    path: "assets/items/objets/mousse_mur.png", scale: 0.25,
    placeholder: { w: 128, h: 192, color: 0x3fa02a, label: "Mur mousse" },
    src: { file: "assets/_codex_src/mousse_mur.png" },
    norm: { mode: "fit", value: 768 },
  },
  // [P2] Porte de bois déformée par la mousse
  porte_mousse: {
    path: "assets/items/objets/porte_mousse.png", scale: 0.21,
    placeholder: { w: 96, h: 160, color: 0x5a4a2a, label: "Porte" },
    src: { file: "assets/_codex_src/porte_mousse.png" },
    norm: { mode: "fit", value: 768 },
  },
  // [P2] Courant d'air ascendant
  courant_air: {
    path: "assets/items/objets/courant_air.png", scale: 0.33,
    placeholder: { w: 64, h: 256, color: 0xd0f0ff, label: "Courant" },
    src: { file: "assets/_codex_src/courant_air.png" },
    norm: { mode: "fit", value: 768 },
  },
  // [P2] Icône de forme : singe
  form_icone_singe: {
    path: "assets/items/form_icone/singe.png", scale: 0.1,
    placeholder: { w: 72, h: 72, color: 0xc0602a, label: "Singe" },
    src: { file: "assets/_codex_src/form_icone_singe.png" },
    norm: { mode: "square", value: 724 },
  },
  // [P1] Icône de forme : papillon (médaillon bois/lierre comme les autres)
  form_icone_papillon: {
    path: "assets/items/form_icone/papillon.png", scale: 0.1,
    placeholder: { w: 72, h: 72, color: 0x9fe8ff, label: "Papillon" },
    src: { file: "assets/_codex_src/form_icone_papillon.png" },
    norm: { mode: "square", value: 724 },
  },
  // [P2] Icône de compétence : ours
  skill_icone_ours: {
    path: "assets/items/skill_icone/ours.png", scale: 0.1,
    placeholder: { w: 72, h: 72, color: 0x7a4a2a, label: "Ours" },
    src: { file: "assets/_codex_src/skill_icone_ours.png" },
    norm: { mode: "square", value: 724 },
  },
  // [P2] Icône de compétence : singe
  skill_icone_singe: {
    path: "assets/items/skill_icone/singe.png", scale: 0.1,
    placeholder: { w: 72, h: 72, color: 0xc0602a, label: "Sk singe" },
    src: { file: "assets/_codex_src/skill_icone_singe.png" },
    norm: { mode: "square", value: 724 },
  },
  // [P2] Icône de compétence : papillon
  skill_icone_papillon: {
    path: "assets/items/skill_icone/papillon.png", scale: 0.1,
    placeholder: { w: 72, h: 72, color: 0x6ff0e0, label: "Papillon" },
    src: { file: "assets/_codex_src/skill_icone_papillon.png" },
    norm: { mode: "square", value: 724 },
  },
  // [P1] Boîte de dialogue (9-slice)
  dialogue_box: {
    path: "assets/ui/dialogue_box.png", scale: 1,
    placeholder: { w: 880, h: 150, color: 0x2a1e14, label: "Dialogue" },
    nineSlice: { left: 120, right: 120, top: 120, bottom: 120 },
    src: { file: "assets/_codex_src/dialogue_box.png" },
    norm: { mode: "trim" },
  },
  // [P3] Logo titre « Legend of Agarica »
  titre_logo: {
    path: "assets/ui/titre_logo.png", scale: 0.59,
    placeholder: { w: 600, h: 200, color: 0x3f7d3a, label: "Legend of Agarica" },
    src: { file: "assets/_codex_src/titre_logo.png" },
    norm: { mode: "fit", value: 1024 },
  },
  // [P2] Carte de Geralt (écran de carte)
  carte_parchemin: {
    path: "assets/ui/carte_parchemin.png", scale: 0.52,
    placeholder: { w: 800, h: 530, color: 0xd8c08a, label: "Carte" },
    src: { file: "assets/_codex_src/carte_parchemin.png" },
    norm: { mode: "fit", value: 1536 },
  },
  // [P1] Portrait agarica
  portrait_agarica: {
    path: "assets/ui/portraits/agarica.png", scale: 0.25,
    placeholder: { w: 128, h: 128, color: 0x2a1e14, label: "agarica" },
    src: { file: "assets/_codex_src/portrait_agarica.png" },
    norm: { mode: "square", value: 512 },
  },
  // [P1] Portrait xara
  portrait_xara: {
    path: "assets/ui/portraits/xara.png", scale: 0.25,
    placeholder: { w: 128, h: 128, color: 0x2a1e14, label: "xara" },
    src: { file: "assets/_codex_src/portrait_xara.png" },
    norm: { mode: "square", value: 512 },
  },
  // [P1] Portrait amanite
  portrait_amanite: {
    path: "assets/ui/portraits/amanite.png", scale: 0.25,
    placeholder: { w: 128, h: 128, color: 0x2a1e14, label: "amanite" },
    src: { file: "assets/_codex_src/portrait_amanite.png" },
    norm: { mode: "square", value: 512 },
  },
  // [P1] Portrait pere_chef
  portrait_pere_chef: {
    path: "assets/ui/portraits/pere_chef.png", scale: 0.25,
    placeholder: { w: 128, h: 128, color: 0x2a1e14, label: "pere_chef" },
    src: { file: "assets/_codex_src/portrait_pere_chef.png" },
    norm: { mode: "square", value: 512 },
  },
  // [P1] Portrait geralt
  portrait_geralt: {
    path: "assets/ui/portraits/geralt.png", scale: 0.25,
    placeholder: { w: 128, h: 128, color: 0x2a1e14, label: "geralt" },
    src: { file: "assets/_codex_src/portrait_geralt.png" },
    norm: { mode: "square", value: 512 },
  },
  // [P1] Portrait morgat
  portrait_morgat: {
    path: "assets/ui/portraits/morgat.png", scale: 0.25,
    placeholder: { w: 128, h: 128, color: 0x2a1e14, label: "morgat" },
    src: { file: "assets/_codex_src/portrait_morgat.png" },
    norm: { mode: "square", value: 512 },
  },
  // [P1] Portrait kainati
  portrait_kainati: {
    path: "assets/ui/portraits/kainati.png", scale: 0.25,
    placeholder: { w: 128, h: 128, color: 0x2a1e14, label: "kainati" },
    src: { file: "assets/_codex_src/portrait_kainati.png" },
    norm: { mode: "square", value: 512 },
  },
  // [P1] Portrait ghilt
  portrait_ghilt: {
    path: "assets/ui/portraits/ghilt.png", scale: 0.25,
    placeholder: { w: 128, h: 128, color: 0x2a1e14, label: "ghilt" },
    src: { file: "assets/_codex_src/portrait_ghilt.png" },
    norm: { mode: "square", value: 512 },
  },
  // [P2] the Emerald Grove at night: a peaceful forest village with round moss-roofed huts, a tree 
  fond_bosquet: {
    path: "assets/decors/fonds/fond_bosquet.png", scale: 0.714,
    placeholder: { w: 960, h: 540, color: 0x101828, label: "fond_bosquet" },
    src: { file: "assets/_codex_src/fond_bosquet.png" },
    norm: { mode: "cover", w: 2079, h: 756 },
  },
  // [P2] inside and around a GIGANTIC TREE: an immense vertical trunk with huge bark ridges, enormo
  // Fond de la forêt sombre (forêt sombre 1-2) : nuit, mousse toxique lumineuse.
  fond_foret_sombre: {
    path: "assets/decors/fonds/fond_foret_sombre.png", scale: 0.714,
    placeholder: { w: 960, h: 540, color: 0x0e1424, label: "fond_foret_sombre" },
    src: { file: "assets/_codex_src/fond_foret_sombre.png" },
    norm: { mode: "cover", w: 2079, h: 756 },
  },
  fond_grand_arbre: {
    path: "assets/decors/fonds/fond_grand_arbre.png", scale: 0.714,
    placeholder: { w: 960, h: 540, color: 0x101828, label: "fond_grand_arbre" },
    src: { file: "assets/_codex_src/fond_grand_arbre.png" },
    norm: { mode: "cover", w: 2079, h: 756 },
  },
  // [P2] DAYLIGHT above the forest canopy: bright blue sky with soft white clouds, warm golden sunl
  fond_foret_flottante: {
    path: "assets/decors/fonds/fond_foret_flottante.png", scale: 0.714,
    placeholder: { w: 960, h: 540, color: 0x101828, label: "fond_foret_flottante" },
    src: { file: "assets/_codex_src/fond_foret_flottante.png" },
    norm: { mode: "cover", w: 2079, h: 756 },
  },
  // [P2] the CORRUPTED FOREST: twisted sick trees with grey bark, everything draped in glowing toxi
  fond_foret_corrompue: {
    path: "assets/decors/fonds/fond_foret_corrompue.png", scale: 0.714,
    placeholder: { w: 960, h: 540, color: 0x101828, label: "fond_foret_corrompue" },
    src: { file: "assets/_codex_src/fond_foret_corrompue.png" },
    norm: { mode: "cover", w: 2079, h: 756 },
  },
  // [P2] the SPIRIT WORLD of the monkey: an ethereal giant ancestral tree made of glowing cyan and 
  fond_monde_spirituel: {
    path: "assets/decors/fonds/fond_monde_spirituel.png", scale: 0.714,
    placeholder: { w: 960, h: 540, color: 0x101828, label: "fond_monde_spirituel" },
    src: { file: "assets/_codex_src/fond_monde_spirituel.png" },
    norm: { mode: "cover", w: 2079, h: 756 },
  },
  // [P1] a DARK PIT underground: almost black cave walls of roots and earth, very dark indigo, a fa
  fond_trou_sombre: {
    path: "assets/decors/fonds/fond_trou_sombre.png", scale: 0.714,
    placeholder: { w: 960, h: 540, color: 0x101828, label: "fond_trou_sombre" },
    src: { file: "assets/_codex_src/fond_trou_sombre.png" },
    norm: { mode: "cover", w: 2079, h: 756 },
  },
  // [P2] GHIL'T'S ARENA: a wide circular clearing in the corrupted forest surrounded by huge dead t
  fond_arene_ghilt: {
    path: "assets/decors/fonds/fond_arene_ghilt.png", scale: 0.714,
    placeholder: { w: 960, h: 540, color: 0x101828, label: "fond_arene_ghilt" },
    src: { file: "assets/_codex_src/fond_arene_ghilt.png" },
    norm: { mode: "cover", w: 2079, h: 756 },
  },
  // ===== Lot Codex n°8 (2026-10-23, docs/production/PROMPT_CODEX_8.md) =====
  // Remplace les éléments dessinés par code (INVENTAIRE_DESSINS_CODE.md).
  // Branchés au fil de docs/production/PLAN_INTEGRATION_LOT_8.md (usage de
  // chaque id, sections 4 et 5) : chaque usage teste la texture item-<id>
  // et garde son dessin de repli si l'image manque. Les bandes TUILABLES
  // s'affichent en tileSprite (tileScale = scale).
  // [P1] Mare préservée (forêt sombre 2) : 6 bandes TUILABLES en largeur
  // (tileSprite, tileScale = scale). fond = eau arrière (profondeur 3) ;
  // voile = eau avant, dessinée opaque, à afficher en alpha 0,2-0,35
  // (profondeur 5, les poissons nagent entre les deux) ; surface_0..3 = ligne
  // de surface animée en boucle (~8 fps).
  liquide_mare_fond: {
    path: "assets/decors/liquides/liquide_mare_fond.png", scale: 0.6,
    placeholder: { w: 256, h: 84, color: 0x0d2a3a, label: "Mare fond" },
    src: { planche: "assets/_codex_src/liquides_mare.png", grid: [1, 6], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  liquide_mare_voile: {
    path: "assets/decors/liquides/liquide_mare_voile.png", scale: 0.6,
    placeholder: { w: 256, h: 84, color: 0x9fe6e0, label: "Mare voile" },
    src: { planche: "assets/_codex_src/liquides_mare.png", grid: [1, 6], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  liquide_mare_surface_0: {
    path: "assets/decors/liquides/liquide_mare_surface_0.png", scale: 0.6,
    placeholder: { w: 256, h: 21, color: 0xbff6ef, label: "Surface" },
    src: { planche: "assets/_codex_src/liquides_mare.png", grid: [1, 6], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  liquide_mare_surface_1: {
    path: "assets/decors/liquides/liquide_mare_surface_1.png", scale: 0.6,
    placeholder: { w: 256, h: 21, color: 0xbff6ef, label: "Surface" },
    src: { planche: "assets/_codex_src/liquides_mare.png", grid: [1, 6], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  liquide_mare_surface_2: {
    path: "assets/decors/liquides/liquide_mare_surface_2.png", scale: 0.6,
    placeholder: { w: 256, h: 21, color: 0xbff6ef, label: "Surface" },
    src: { planche: "assets/_codex_src/liquides_mare.png", grid: [1, 6], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  liquide_mare_surface_3: {
    path: "assets/decors/liquides/liquide_mare_surface_3.png", scale: 0.6,
    placeholder: { w: 256, h: 21, color: 0xbff6ef, label: "Surface" },
    src: { planche: "assets/_codex_src/liquides_mare.png", grid: [1, 6], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  // [P1] Mousse toxique liquide : lac du fond de l'épreuve du singe ET marée
  // qui monte et descend (même image). Tuilable en largeur, crête en haut,
  // corps opaque jusqu'en bas (on n'en montre que le haut, 80 px pour le lac,
  // 60 à 220 px pour la marée). Bulles = vfx_mousse_toxique, anim bulle.
  liquide_mousse_toxique: {
    path: "assets/decors/liquides/liquide_mousse_toxique.png", scale: 0.3,
    placeholder: { w: 352, h: 220, color: 0x16280f, label: "Mousse toxique" },
    src: { file: "assets/_codex_src/liquide_mousse_toxique.png" },
    norm: { mode: "fit", value: 1536 },
  },
  // [P1] Ciel de jour (dégradé + nuages, SANS soleil = couche_soleil), posé
  // au-dessus de fond_foret_flottante quand la caméra monte (forêt flottante,
  // clairière, hutte) ; bas raccord avec le haut de ce fond, tuilable en
  // largeur. Remplace aussi le voile bleu a2SkyWash. Préfixe couche_ (et non
  // fond_) : l'éditeur liste les fond_* comme fonds de zone.
  couche_ciel_jour: {
    path: "assets/decors/fonds/couche_ciel_jour.png", scale: 0.714,
    placeholder: { w: 1097, h: 731, color: 0x2a9ef7, label: "Ciel" },
    src: { file: "assets/_codex_src/couche_ciel_jour.png" },
    norm: { mode: "cover", w: 1536, h: 1024 },
  },
  // [P1] Nappes tuilables en largeur. nappe_nuages et nappe_brume = montée de
  // la forêt flottante 1 (remplacent le voile de brume et les 9 ellipses de
  // nuages ; plusieurs copies à des parallaxes différentes, alpha qui baisse
  // en montant). brume_avant = bande OPAQUE au premier plan, ancrée en bas
  // d'écran (scrollFactor >= 1), qui cache le bas des arbres du fond.
  couche_nappe_nuages: {
    path: "assets/decors/fonds/couche_nappe_nuages.png", scale: 0.7,
    placeholder: { w: 1075, h: 196, color: 0xe8ecff, label: "Nuages" },
    src: { planche: "assets/_codex_src/couche_nappes.png", grid: [1, 3], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  couche_nappe_brume: {
    path: "assets/decors/fonds/couche_nappe_brume.png", scale: 0.7,
    placeholder: { w: 1075, h: 112, color: 0xd6dcef, label: "Brume" },
    src: { planche: "assets/_codex_src/couche_nappes.png", grid: [1, 3], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  couche_brume_avant: {
    path: "assets/decors/fonds/couche_brume_avant.png", scale: 0.7,
    placeholder: { w: 1075, h: 210, color: 0xb8c8dc, label: "Brume avant" },
    src: { planche: "assets/_codex_src/couche_nappes.png", grid: [1, 3], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  // [P1] Nuages isolés (parallaxe 0,5-0,7) et soleil (scrollFactor 0 ; mode
  // ADD si l'image a été livrée sur fond noir).
  couche_nuage_0: {
    path: "assets/decors/fonds/couche_nuage_0.png", scale: 0.8,
    placeholder: { w: 350, h: 160, color: 0xe8ecff, label: "Nuage" },
    src: { planche: "assets/_codex_src/couche_nuages.png", grid: [3, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  couche_nuage_1: {
    path: "assets/decors/fonds/couche_nuage_1.png", scale: 0.8,
    placeholder: { w: 350, h: 160, color: 0xe8ecff, label: "Nuage" },
    src: { planche: "assets/_codex_src/couche_nuages.png", grid: [3, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  couche_nuage_2: {
    path: "assets/decors/fonds/couche_nuage_2.png", scale: 0.8,
    placeholder: { w: 350, h: 160, color: 0xe8ecff, label: "Nuage" },
    src: { planche: "assets/_codex_src/couche_nuages.png", grid: [3, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  couche_nuage_3: {
    path: "assets/decors/fonds/couche_nuage_3.png", scale: 0.8,
    placeholder: { w: 370, h: 100, color: 0xe8ecff, label: "Nuage" },
    src: { planche: "assets/_codex_src/couche_nuages.png", grid: [3, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  couche_nuage_4: {
    path: "assets/decors/fonds/couche_nuage_4.png", scale: 0.8,
    placeholder: { w: 225, h: 130, color: 0xe8ecff, label: "Nuage" },
    src: { planche: "assets/_codex_src/couche_nuages.png", grid: [3, 2], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  couche_soleil: {
    path: "assets/decors/fonds/couche_soleil.png", scale: 0.6,
    placeholder: { w: 264, h: 264, color: 0xfff1c0, label: "Soleil" },
    src: { planche: "assets/_codex_src/couche_nuages.png", grid: [3, 2], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  // [P1] Lanternes de reprise (éteinte / allumée, même cadrage ; halo =
  // fx_halo_doux ; centre du globe à 63 % de la hauteur depuis le bas ;
  // 0,15 = 30x51 px, à 0,09 le globe était illisible), fente lumineuse dans
  // l'écorce (fermée / ouverte, même cadrage ; échelle = hauteur / 440),
  // spirale gravée (arbre malade, forêt corrompue 1), contour fantôme d'une
  // plateforme cachée (forme loup) : contour des tirets en x 1-378, y 26-132
  // du PNG, calé par le code sur la case pleine (pas d'échelle fixe).
  decor_lanterne_eteinte: {
    path: "assets/decors/elements/decor_lanterne_eteinte.png", scale: 0.15,
    placeholder: { w: 30, h: 51, color: 0x2b2440, label: "Lanterne" },
    src: { planche: "assets/_codex_src/decor_lumineux.png", grid: [3, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_lanterne_allumee: {
    path: "assets/decors/elements/decor_lanterne_allumee.png", scale: 0.15,
    placeholder: { w: 30, h: 51, color: 0x8fe3b8, label: "Lanterne" },
    src: { planche: "assets/_codex_src/decor_lumineux.png", grid: [3, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_fente_fermee: {
    path: "assets/decors/elements/decor_fente_fermee.png", scale: 0.27,
    placeholder: { w: 70, h: 120, color: 0x1a1428, label: "Fente" },
    src: { planche: "assets/_codex_src/decor_lumineux.png", grid: [3, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_fente_ouverte: {
    path: "assets/decors/elements/decor_fente_ouverte.png", scale: 0.27,
    placeholder: { w: 70, h: 120, color: 0xbfe8a0, label: "Portail" },
    src: { planche: "assets/_codex_src/decor_lumineux.png", grid: [3, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_spirale_gravee: {
    path: "assets/decors/elements/decor_spirale_gravee.png", scale: 0.15,
    placeholder: { w: 45, h: 45, color: 0xb48cff, label: "Spirale" },
    src: { planche: "assets/_codex_src/decor_lumineux.png", grid: [3, 2], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_plateforme_fantome: {
    path: "assets/decors/elements/decor_plateforme_fantome.png", scale: 0.4,
    placeholder: { w: 192, h: 64, color: 0x7fffd0, label: "Fantome" },
    src: { planche: "assets/_codex_src/decor_lumineux.png", grid: [3, 2], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  // [P1] Structures : plateforme d'écorce qui s'effrite (intacte / fissurée /
  // brisée, même cadrage et même largeur ; dessus de mousse à y = 8/104 ;
  // échelle réelle (w + 6) / 451 pour coller à la hitbox w x 22, soit 0,29
  // pour w = 128), rampe de lancement à fanion (hutte de Morgat ; base
  // d'appui en x 5-189 du PNG), marches de racines (non utilisées : l'arche
  // foret_sombre_racine_arche les remplace en forêt sombre 2), autel du
  // sommet (épreuve ; 0,27 = même emprise que grand_arbre_autel_singe, qu'il
  // peut remplacer ; colonne = fx_rai_lumiere).
  decor_plateforme_ecorce_intacte: {
    path: "assets/decors/elements/decor_plateforme_ecorce_intacte.png", scale: 0.29,
    placeholder: { w: 128, h: 22, color: 0x4a3021, label: "Ecorce" },
    src: { planche: "assets/_codex_src/structures_ecorce.png", grid: [3, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_plateforme_ecorce_fissuree: {
    path: "assets/decors/elements/decor_plateforme_ecorce_fissuree.png", scale: 0.29,
    placeholder: { w: 128, h: 22, color: 0x6b4a33, label: "Ecorce" },
    src: { planche: "assets/_codex_src/structures_ecorce.png", grid: [3, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_plateforme_ecorce_brisee: {
    path: "assets/decors/elements/decor_plateforme_ecorce_brisee.png", scale: 0.29,
    placeholder: { w: 128, h: 22, color: 0x6b4a33, label: "Ecorce" },
    src: { planche: "assets/_codex_src/structures_ecorce.png", grid: [3, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_rampe_lancement: {
    path: "assets/decors/elements/decor_rampe_lancement.png", scale: 0.21,
    placeholder: { w: 92, h: 58, color: 0x8a6a3e, label: "Rampe" },
    src: { planche: "assets/_codex_src/structures_ecorce.png", grid: [3, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_marches_racines: {
    path: "assets/decors/elements/decor_marches_racines.png", scale: 0.28,
    placeholder: { w: 118, h: 112, color: 0x2a2238, label: "Racines" },
    src: { planche: "assets/_codex_src/structures_ecorce.png", grid: [3, 2], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_autel_sommet: {
    path: "assets/decors/elements/decor_autel_sommet.png", scale: 0.27,
    placeholder: { w: 107, h: 70, color: 0x4a4058, label: "Autel" },
    src: { planche: "assets/_codex_src/structures_ecorce.png", grid: [3, 2], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  // [P1] Grands éléments plats (une bande chacun, non tuilables) : pont en
  // tronc couché sur la mare (forêt sombre 2 ; affiché en setDisplaySize(w +
  // 44, 26) pour se lire comme un tronc, dessus du fût à y = 34/90 ; 0,205
  // = proportions exactes, il ressemble alors à une branche), cratère du
  // crash (forêt corrompue 1 ; fond du creux à y = 185/280, sur la ligne de
  // marche), trou de l'effondrement du sol (arène de Ghil't ; haut de la
  // fosse à y = 90/255).
  decor_pont_tronc: {
    path: "assets/decors/elements/decor_pont_tronc.png", scale: 0.205,
    placeholder: { w: 296, h: 18, color: 0x3b2a20, label: "Pont" },
    src: { planche: "assets/_codex_src/structures_larges.png", grid: [1, 3], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  decor_cratere: {
    path: "assets/decors/elements/decor_cratere.png", scale: 0.2,
    placeholder: { w: 230, h: 60, color: 0x1a2614, label: "Cratere" },
    src: { planche: "assets/_codex_src/structures_larges.png", grid: [1, 3], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  decor_trou_effondre: {
    path: "assets/decors/elements/decor_trou_effondre.png", scale: 0.14,
    placeholder: { w: 170, h: 36, color: 0x0a0710, label: "Trou" },
    src: { planche: "assets/_codex_src/structures_larges.png", grid: [1, 3], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  // [P1] Couches lointaines tuilables en largeur (parallaxe 0,25-0,3) :
  // îlots flottants (forêt flottante 2), forêt malade à l'horizon (forêt
  // flottante 1-2, hutte de Morgat). Échelle, alpha et teinte sont portés
  // par la clé de zone farLayers (îles à 0,4 et alpha 0,6). L'horizon malade
  // garde l'image actuelle (style poison, trop claire), ASSOMBRIE par le
  // code (teinte ~0x3c4e44, échelle 0,45) : la version peinte d'avant les
  // retouches poison est opaque dès sa 10e rangée (boîte sombre sur le
  // ciel), donc pas réimportable telle quelle.
  couche_iles_lointaines: {
    path: "assets/decors/fonds/couche_iles_lointaines.png", scale: 0.6,
    placeholder: { w: 922, h: 252, color: 0x6f8fb0, label: "Iles" },
    src: { planche: "assets/_codex_src/couche_lointains.png", grid: [1, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  couche_horizon_malade: {
    path: "assets/decors/fonds/couche_horizon_malade.png", scale: 0.7,
    placeholder: { w: 1075, h: 210, color: 0x1f3a1a, label: "Horizon malade" },
    src: { planche: "assets/_codex_src/couche_lointains.png", grid: [1, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  // [P1] Mare et plantes : berge (miroir pour l'autre rive), roseaux, fleur
  // perchée (forêt sombre 2), plante résistante sur sa tige (fleurie, puis
  // bouton après cueillette, même cadrage ; la fleur cueillie qui vole =
  // cadre tete (x 30, y 0, 198x195) de decor_plante_resistante_fleurie, et
  // non fleur_resistante, plante entière avec ses racines), graine de
  // chêne-coeur (+1 coeur, forêt sombre 2 ; sert aussi d'icône).
  decor_mare_berge: {
    path: "assets/decors/elements/decor_mare_berge.png", scale: 0.14,
    placeholder: { w: 62, h: 42, color: 0x3a3550, label: "Berge" },
    src: { planche: "assets/_codex_src/mare_plantes.png", grid: [3, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_mare_roseaux: {
    path: "assets/decors/elements/decor_mare_roseaux.png", scale: 0.08,
    placeholder: { w: 20, h: 35, color: 0x2d6b3a, label: "Roseaux" },
    src: { planche: "assets/_codex_src/mare_plantes.png", grid: [3, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_fleur_perchee: {
    path: "assets/decors/elements/decor_fleur_perchee.png", scale: 0.1,
    placeholder: { w: 30, h: 45, color: 0xff9fc9, label: "Fleur" },
    src: { planche: "assets/_codex_src/mare_plantes.png", grid: [3, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_plante_resistante_fleurie: {
    path: "assets/decors/elements/decor_plante_resistante_fleurie.png", scale: 0.2,
    placeholder: { w: 50, h: 94, color: 0x5fa86f, label: "Plante" },
    src: { planche: "assets/_codex_src/mare_plantes.png", grid: [3, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  decor_plante_resistante_bouton: {
    path: "assets/decors/elements/decor_plante_resistante_bouton.png", scale: 0.2,
    placeholder: { w: 50, h: 94, color: 0x5fa86f, label: "Plante" },
    src: { planche: "assets/_codex_src/mare_plantes.png", grid: [3, 2], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  objet_graine_coeur: {
    path: "assets/items/objets/objet_graine_coeur.png", scale: 0.09,
    placeholder: { w: 27, h: 22, color: 0xff6fa8, label: "Graine" },
    src: { planche: "assets/_codex_src/mare_plantes.png", grid: [3, 2], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  // [P1] Sols plats : tapis de mousse toxique (TUILABLE en largeur,
  // clairière), cercle sain fleuri autour de la plante (rayon 230 ;
  // setDisplaySize), tache de mousse séchée (forêt flottante 2, arène).
  decor_tapis_mousse: {
    path: "assets/decors/elements/decor_tapis_mousse.png", scale: 0.15,
    placeholder: { w: 230, h: 27, color: 0x2f5a2a, label: "Tapis mousse" },
    src: { planche: "assets/_codex_src/bandes_sol.png", grid: [1, 3], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  decor_cercle_sain: {
    path: "assets/decors/elements/decor_cercle_sain.png", scale: 0.32,
    placeholder: { w: 460, h: 38, color: 0x7bd35a, label: "Cercle sain" },
    src: { planche: "assets/_codex_src/bandes_sol.png", grid: [1, 3], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  decor_mousse_sechee: {
    path: "assets/decors/elements/decor_mousse_sechee.png", scale: 0.08,
    placeholder: { w: 80, h: 16, color: 0x34502a, label: "Mousse sechee" },
    src: { planche: "assets/_codex_src/bandes_sol.png", grid: [1, 3], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 1536 },
  },
  // [P1] Mousses : plaque à gratter (intacte / grattée / repoussée, même
  // cadrage, bosquet ; 0,216 = 70 px, la largeur de grattage ; coulures
  // 2 px sous la base, à enfoncer de 3 px), taches lumineuses (sol, tronc,
  // plafond, petite ; plafond = origine (0.5, 0), tronc = bord gauche
  // presque plat), touffes de mousse vivante (3 tailles même échelle + une
  // penchée vers la droite, pied à 40 % de la largeur, forêt corrompue 1),
  // empreinte boueuse (forêt sombre 2 ; livrée en VUE DE DESSUS, à écraser
  // en Y par la clé de prop flatY 0,5, soit 21x6 px).
  decor_mousse_plaque_intacte: {
    path: "assets/decors/elements/decor_mousse_plaque_intacte.png", scale: 0.216,
    placeholder: { w: 70, h: 30, color: 0x2f5a2a, label: "Mousse" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_mousse_plaque_grattee: {
    path: "assets/decors/elements/decor_mousse_plaque_grattee.png", scale: 0.216,
    placeholder: { w: 70, h: 30, color: 0x1d3a1a, label: "Mousse" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_mousse_plaque_repoussee: {
    path: "assets/decors/elements/decor_mousse_plaque_repoussee.png", scale: 0.216,
    placeholder: { w: 70, h: 30, color: 0x3e7a2c, label: "Mousse" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_mousse_lumineuse_sol: {
    path: "assets/decors/elements/decor_mousse_lumineuse_sol.png", scale: 0.2,
    placeholder: { w: 64, h: 26, color: 0x3e7a2c, label: "Mousse" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_mousse_lumineuse_tronc: {
    path: "assets/decors/elements/decor_mousse_lumineuse_tronc.png", scale: 0.2,
    placeholder: { w: 40, h: 64, color: 0x3e7a2c, label: "Mousse" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_mousse_lumineuse_plafond: {
    path: "assets/decors/elements/decor_mousse_lumineuse_plafond.png", scale: 0.2,
    placeholder: { w: 64, h: 26, color: 0x3e7a2c, label: "Mousse" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_mousse_lumineuse_petite: {
    path: "assets/decors/elements/decor_mousse_lumineuse_petite.png", scale: 0.2,
    placeholder: { w: 30, h: 16, color: 0x3e7a2c, label: "Mousse" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 6, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_touffe_mousse_petite: {
    path: "assets/decors/elements/decor_touffe_mousse_petite.png", scale: 0.18,
    placeholder: { w: 18, h: 26, color: 0x2f5a2a, label: "Touffe" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 7, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_touffe_mousse_moyenne: {
    path: "assets/decors/elements/decor_touffe_mousse_moyenne.png", scale: 0.18,
    placeholder: { w: 18, h: 38, color: 0x2f5a2a, label: "Touffe" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 8, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_touffe_mousse_grande: {
    path: "assets/decors/elements/decor_touffe_mousse_grande.png", scale: 0.18,
    placeholder: { w: 18, h: 50, color: 0x2f5a2a, label: "Touffe" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 9, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_touffe_mousse_penchee: {
    path: "assets/decors/elements/decor_touffe_mousse_penchee.png", scale: 0.18,
    placeholder: { w: 26, h: 36, color: 0x2f5a2a, label: "Touffe" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 10, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  decor_empreinte_boue: {
    path: "assets/decors/elements/decor_empreinte_boue.png", scale: 0.08,
    placeholder: { w: 21, h: 12, color: 0x140e20, label: "Empreinte" },
    src: { planche: "assets/_codex_src/mousses_plaques.png", grid: [4, 3], cell: 11, cut: "grid" },
    norm: { mode: "fit", value: 384 },
  },
  // [P1] Voile d'obscurité (clé ambient, ambient.vignette) : image OPAQUE en
  // niveaux de gris (centre blanc, bords sombres), plein écran en mode
  // MULTIPLY, NON teintée (alpha = force), profondeur 999,5 (sous le HUD).
  couche_vignette: {
    path: "assets/decors/fonds/couche_vignette.png", scale: 0.625,
    placeholder: { w: 960, h: 540, color: 0x15101f, label: "Vignette" },
    src: { file: "assets/_codex_src/couche_vignette.png" },
    norm: { mode: "cover", w: 1536, h: 864 },
  },
  // [P2] Particules (matières) : normalisées à 128 px (plus grand côté),
  // scale = taille écran moyenne, à faire varier par le code. Éclats et
  // mottes de mousse, motte de terre, éclat d'écorce, éclat de pierre,
  // feuille (prise de liane), pétales, gouttes (toxique, antidote), bulle
  // (répulsif, potion ; teinte par setTint), éclaboussure toxique.
  fx_eclat_mousse: {
    path: "assets/vfx/particules/fx_eclat_mousse.png", scale: 0.1,
    placeholder: { w: 12, h: 10, color: 0x6fae3a, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_motte_mousse: {
    path: "assets/vfx/particules/fx_motte_mousse.png", scale: 0.17,
    placeholder: { w: 22, h: 18, color: 0x3e7a2c, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_motte_terre: {
    path: "assets/vfx/particules/fx_motte_terre.png", scale: 0.11,
    placeholder: { w: 14, h: 12, color: 0x5a4630, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_eclat_ecorce: {
    path: "assets/vfx/particules/fx_eclat_ecorce.png", scale: 0.11,
    placeholder: { w: 14, h: 8, color: 0x6b4a33, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_eclat_pierre: {
    path: "assets/vfx/particules/fx_eclat_pierre.png", scale: 0.07,
    placeholder: { w: 8, h: 9, color: 0x8a8a8a, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_feuille: {
    path: "assets/vfx/particules/fx_feuille.png", scale: 0.09,
    placeholder: { w: 12, h: 7, color: 0x4fae5a, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_petale_rose: {
    path: "assets/vfx/particules/fx_petale_rose.png", scale: 0.08,
    placeholder: { w: 10, h: 8, color: 0xff9fc9, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 6, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_petale_blanc: {
    path: "assets/vfx/particules/fx_petale_blanc.png", scale: 0.08,
    placeholder: { w: 10, h: 8, color: 0xffe9f5, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 7, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_goutte_toxique: {
    path: "assets/vfx/particules/fx_goutte_toxique.png", scale: 0.045,
    placeholder: { w: 4, h: 6, color: 0x9bff5a, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 8, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_goutte_antidote: {
    path: "assets/vfx/particules/fx_goutte_antidote.png", scale: 0.05,
    placeholder: { w: 6, h: 8, color: 0x9fffd6, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 9, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_bulle: {
    path: "assets/vfx/particules/fx_bulle.png", scale: 0.08,
    placeholder: { w: 10, h: 10, color: 0xffffff, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 10, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_eclaboussure_toxique: {
    path: "assets/vfx/particules/fx_eclaboussure_toxique.png", scale: 0.12,
    placeholder: { w: 16, h: 8, color: 0x9bff5a, label: "fx" },
    src: { planche: "assets/_codex_src/particules_matieres.png", grid: [4, 3], cell: 11, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  // [P2] Particules (lumières et souffles), mode ADD conseillé pour les
  // lumières : luciole, grain de lumière (blanc, teinte par setTint),
  // étincelle de purification, étincelle et traînée du papillon (tête à
  // droite : orienter selon la vitesse), trait de vent (courant d'air),
  // ombre au sol annonçant une chute (alpha par le code), marqueur de danger
  // au sol (intérieur opaque : ADD obligatoire), spore toxique (12-14 px au
  // moins sur fond corrompu), bouffées de poussière et de gaz toxique,
  // braise (réveil du talisman). Échelles = taille UTILE mesurée (luciole
  // 14 px, grain 18-20, braise 10-12, étincelle papillon 16) ; documentaire,
  // le code de particules passe sa propre taille.
  fx_luciole: {
    path: "assets/vfx/particules/fx_luciole.png", scale: 0.11,
    placeholder: { w: 14, h: 14, color: 0xfff6a0, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_grain_lumiere: {
    path: "assets/vfx/particules/fx_grain_lumiere.png", scale: 0.15,
    placeholder: { w: 18, h: 19, color: 0xffffff, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_etincelle: {
    path: "assets/vfx/particules/fx_etincelle.png", scale: 0.1,
    placeholder: { w: 12, h: 12, color: 0xf0ffe0, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_etincelle_papillon: {
    path: "assets/vfx/particules/fx_etincelle_papillon.png", scale: 0.13,
    placeholder: { w: 14, h: 17, color: 0xffb3f0, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_trainee_papillon: {
    path: "assets/vfx/particules/fx_trainee_papillon.png", scale: 0.3,
    placeholder: { w: 38, h: 10, color: 0x9ff3ff, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_trait_vent: {
    path: "assets/vfx/particules/fx_trait_vent.png", scale: 0.3,
    placeholder: { w: 38, h: 8, color: 0xd0f0ff, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_ombre_sol: {
    path: "assets/vfx/particules/fx_ombre_sol.png", scale: 0.17,
    placeholder: { w: 22, h: 8, color: 0x12000c, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 6, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_marqueur_danger: {
    path: "assets/vfx/particules/fx_marqueur_danger.png", scale: 0.31,
    placeholder: { w: 40, h: 10, color: 0xff5a5a, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 7, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_spore_toxique: {
    path: "assets/vfx/particules/fx_spore_toxique.png", scale: 0.08,
    placeholder: { w: 10, h: 10, color: 0x9bff5a, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 8, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_bouffee_poussiere: {
    path: "assets/vfx/particules/fx_bouffee_poussiere.png", scale: 0.14,
    placeholder: { w: 18, h: 14, color: 0x8a6a4a, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 9, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_bouffee_toxique: {
    path: "assets/vfx/particules/fx_bouffee_toxique.png", scale: 0.19,
    placeholder: { w: 24, h: 20, color: 0x7fe02a, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 10, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  fx_braise: {
    path: "assets/vfx/particules/fx_braise.png", scale: 0.09,
    placeholder: { w: 9, h: 12, color: 0xffc36b, label: "fx" },
    src: { planche: "assets/_codex_src/particules_lumieres.png", grid: [4, 3], cell: 11, cut: "grid" },
    norm: { mode: "fit", value: 128 },
  },
  // [P2] Halos et lumières douces (blancs, teintés par setTint, mode ADD ;
  // taille réelle par setDisplaySize) : halo rond, halo à rayons, rai de
  // lumière (canopée, autel, vieux sentier ; haut net et intérieur en
  // plateau : haut hors caméra ou sous un plafond, alpha 0,2-0,35), halo
  // d'objet ramassable, aura de l'esprit de Kainati (alpha 0,15-0,2),
  // flaque de lumière au sol.
  // Retouches à l'import (norm) : halo rond et halo à rayons peints en
  // PLATEAU (lus comme des disques pleins) -> marge de 12 px puis dégradé
  // radial jusqu'à 0 au bord (falloff ; énergie 0,39 -> 0,18, proche des
  // halos dessinés ; ils paraissent environ 25 % plus petits à taille
  // égale) ; flaque au sol rognée de son ellipse fantôme (cropTop) et mise
  // en BLANC teintable (desaturate ; elle était cyan) ; trimAlpha 0 sur les
  // grandes lueurs garde leur traîne d'alpha (plus de bord net à alpha 11).
  fx_halo_doux: {
    path: "assets/vfx/particules/fx_halo_doux.png", scale: 0.28,
    placeholder: { w: 128, h: 128, color: 0xffffff, label: "Halo" },
    src: { planche: "assets/_codex_src/halos_lumiere.png", grid: [3, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 512, pad: 12, falloff: 1.0 },
  },
  fx_halo_rayons: {
    path: "assets/vfx/particules/fx_halo_rayons.png", scale: 0.33,
    placeholder: { w: 150, h: 150, color: 0xfff1c0, label: "Halo" },
    src: { planche: "assets/_codex_src/halos_lumiere.png", grid: [3, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 512, pad: 12, falloff: 0.9 },
  },
  fx_rai_lumiere: {
    path: "assets/vfx/particules/fx_rai_lumiere.png", scale: 0.45,
    placeholder: { w: 100, h: 210, color: 0xffe9a8, label: "Rai" },
    src: { planche: "assets/_codex_src/halos_lumiere.png", grid: [3, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 512, trimAlpha: 0 },
  },
  fx_halo_objet: {
    path: "assets/vfx/particules/fx_halo_objet.png", scale: 0.15,
    placeholder: { w: 44, h: 44, color: 0x8fe3b8, label: "Halo" },
    src: { planche: "assets/_codex_src/halos_lumiere.png", grid: [3, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 512, trimAlpha: 0 },
  },
  fx_aura_esprit: {
    path: "assets/vfx/particules/fx_aura_esprit.png", scale: 0.62,
    placeholder: { w: 273, h: 252, color: 0x9fe3ff, label: "Aura" },
    src: { planche: "assets/_codex_src/halos_lumiere.png", grid: [3, 2], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 512, trimAlpha: 0 },
  },
  fx_lueur_sol: {
    path: "assets/vfx/particules/fx_lueur_sol.png", scale: 0.4,
    placeholder: { w: 184, h: 48, color: 0xffffff, label: "Lueur" },
    src: { planche: "assets/_codex_src/halos_lumiere.png", grid: [3, 2], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 512, trimAlpha: 0, cropTop: 20, desaturate: true },
  },
  // [P3] Petites créatures (images fixes, animées par tweens) : petite
  // araignée qui s'incline devant Xara (3 poses, même échelle et même ligne
  // de base, forêt sombre 1), bête de mousse abattue par Amanite (vivante /
  // touchée / morte, forêt flottante 2 ; tournée à droite, flipX ; la morte
  // reste comme trace à la revisite ; mousse_creature en repli), créature
  // de mousse guérie (repos / rebond ; 0,2 = aussi haute que la créature
  // corrompue).
  araignee_petite_0: {
    path: "assets/sprites/petites/araignee_petite_0.png", scale: 0.1,
    placeholder: { w: 24, h: 14, color: 0x1a1024, label: "Araignee" },
    src: { planche: "assets/_codex_src/petites_creatures.png", grid: [4, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  araignee_petite_1: {
    path: "assets/sprites/petites/araignee_petite_1.png", scale: 0.1,
    placeholder: { w: 24, h: 14, color: 0x1a1024, label: "Araignee" },
    src: { planche: "assets/_codex_src/petites_creatures.png", grid: [4, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  araignee_petite_2: {
    path: "assets/sprites/petites/araignee_petite_2.png", scale: 0.1,
    placeholder: { w: 24, h: 14, color: 0x1a1024, label: "Araignee" },
    src: { planche: "assets/_codex_src/petites_creatures.png", grid: [4, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  bete_mousse_vivante: {
    path: "assets/sprites/petites/bete_mousse_vivante.png", scale: 0.25,
    placeholder: { w: 65, h: 49, color: 0x2f5a2a, label: "Bete" },
    src: { planche: "assets/_codex_src/petites_creatures.png", grid: [4, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  bete_mousse_touchee: {
    path: "assets/sprites/petites/bete_mousse_touchee.png", scale: 0.25,
    placeholder: { w: 53, h: 42, color: 0x2f5a2a, label: "Bete" },
    src: { planche: "assets/_codex_src/petites_creatures.png", grid: [4, 2], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  bete_mousse_morte: {
    path: "assets/sprites/petites/bete_mousse_morte.png", scale: 0.25,
    placeholder: { w: 61, h: 22, color: 0x34502a, label: "Bete" },
    src: { planche: "assets/_codex_src/petites_creatures.png", grid: [4, 2], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  mousse_creature_guerie_0: {
    path: "assets/sprites/petites/mousse_creature_guerie_0.png", scale: 0.2,
    placeholder: { w: 34, h: 36, color: 0x6fbf73, label: "Mousse guerie" },
    src: { planche: "assets/_codex_src/petites_creatures.png", grid: [4, 2], cell: 6, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  mousse_creature_guerie_1: {
    path: "assets/sprites/petites/mousse_creature_guerie_1.png", scale: 0.2,
    placeholder: { w: 39, h: 30, color: 0x6fbf73, label: "Mousse guerie" },
    src: { planche: "assets/_codex_src/petites_creatures.png", grid: [4, 2], cell: 7, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  // [P3] Objets : note de Geralt (id d'inventaire, utilisée automatiquement
  // par addItemImage dès qu'elle existe), accessoires du duel de Geralt
  // (grappin au bout de la corde, flèche pointe à droite, collet posé au
  // sol, piquet à droite). La note et le grappin dépassaient leur cellule
  // dans le dessin brut (controles/lot_8/23_generation_brute.png) : ils ont
  // été réextraits entiers dans objets_C.png (2026-10-25), sans génération.
  note_geralt: {
    path: "assets/items/objets/note_geralt.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0xe9d3a0, label: "Note" },
    src: { planche: "assets/_codex_src/objets_C.png", grid: [2, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  objet_grappin: {
    path: "assets/items/objets/objet_grappin.png", scale: 0.08,
    placeholder: { w: 20, h: 20, color: 0x8a6a3e, label: "Grappin" },
    src: { planche: "assets/_codex_src/objets_C.png", grid: [2, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  objet_fleche: {
    path: "assets/items/objets/objet_fleche.png", scale: 0.12,
    placeholder: { w: 30, h: 6, color: 0x8a6a3e, label: "Fleche" },
    src: { planche: "assets/_codex_src/objets_C.png", grid: [2, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  objet_collet: {
    path: "assets/items/objets/objet_collet.png", scale: 0.13,
    placeholder: { w: 34, h: 12, color: 0xc9a26b, label: "Collet" },
    src: { planche: "assets/_codex_src/objets_C.png", grid: [2, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  // [P3] Segments TUILABLES en hauteur (tileSprite, pivotable) : corde de
  // Geralt (jamais au-delà de 0,3), fil de soie de Xara (0,25 : perles
  // visibles, 3 px de large). Découpe par colonnes transparentes.
  objet_corde: {
    path: "assets/items/objets/objet_corde.png", scale: 0.15,
    placeholder: { w: 4, h: 77, color: 0xc9a26b, label: "Corde" },
    src: { planche: "assets/_codex_src/segments_tuilables.png", grid: [2, 1], cell: 0, cut: "columns" },
    norm: { mode: "height", value: 512, trim_x: true },
  },
  fx_fil_soie: {
    path: "assets/vfx/particules/fx_fil_soie.png", scale: 0.25,
    placeholder: { w: 3, h: 128, color: 0xe8e0ff, label: "Soie" },
    src: { planche: "assets/_codex_src/segments_tuilables.png", grid: [2, 1], cell: 1, cut: "columns" },
    norm: { mode: "height", value: 512, trim_x: true },
  },
  // [P4] Panneaux d'interface en 9-slice (bordures nineSlice en px source,
  // mesurées sur les images livrées ; top = bottom = 0 -> 3 morceaux
  // horizontaux, hauteur = hauteur de l'image x scale ; cf. addUiSliced) :
  // bulle de dialogue des personnages (padding 12/7, sinon le texte touche
  // les coins) + sa pointe (0,26 pour raccorder son liseré), panneau
  // d'invite E (24 px de haut), bannière objet obtenu (460x128 : à 104 px la
  // zone unie ne tenait pas 2 lignes de description).
  ui_bulle: {
    path: "assets/ui/ui_bulle.png", scale: 0.2,
    placeholder: { w: 220, h: 48, color: 0x15101f, label: "Bulle" },
    nineSlice: { left: 74, right: 74, top: 60, bottom: 60 },
    src: { planche: "assets/_codex_src/ui_panneaux.png", grid: [2, 2], cell: 0, cut: "grid" },
    norm: { mode: "trim" },
  },
  ui_bulle_pointe: {
    path: "assets/ui/ui_bulle_pointe.png", scale: 0.26,
    placeholder: { w: 18, h: 13, color: 0x15101f, label: "Pointe" },
    src: { planche: "assets/_codex_src/ui_panneaux.png", grid: [2, 2], cell: 1, cut: "grid" },
    norm: { mode: "trim" },
  },
  ui_invite: {
    path: "assets/ui/ui_invite.png", scale: 0.15,
    placeholder: { w: 128, h: 24, color: 0x2a1f45, label: "Invite" },
    nineSlice: { left: 105, right: 105, top: 0, bottom: 0 },
    src: { planche: "assets/_codex_src/ui_panneaux.png", grid: [2, 2], cell: 2, cut: "grid" },
    norm: { mode: "trim" },
  },
  ui_banniere: {
    path: "assets/ui/ui_banniere.png", scale: 0.65,
    placeholder: { w: 460, h: 128, color: 0x241510, label: "Banniere" },
    nineSlice: { left: 115, right: 115, top: 76, bottom: 78 },
    src: { planche: "assets/_codex_src/ui_panneaux.png", grid: [2, 2], cell: 3, cut: "grid" },
    norm: { mode: "trim" },
  },
  // [P4] HUD et icônes du monde : pastille de touche vierge en bois clair
  // (le jeu écrit la lettre, sombre #2a1f45 obligatoire ; 3 morceaux pour les
  // libellés longs), alerte !, étoiles d'étourdissement, case de compétence
  // vide (34 px), anneau de l'objet de la bannière (disque intérieur 50x46 :
  // icône de 46 px), ornement de carte-titre de zone (0,5, posé sous le
  // titre sans le toucher).
  ui_touche: {
    path: "assets/ui/ui_touche.png", scale: 0.09,
    placeholder: { w: 23, h: 23, color: 0xd8c08a, label: "Touche" },
    nineSlice: { left: 90, right: 90, top: 0, bottom: 0 },
    src: { planche: "assets/_codex_src/ui_hud.png", grid: [3, 2], cell: 0, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  ui_alerte: {
    path: "assets/ui/ui_alerte.png", scale: 0.1,
    placeholder: { w: 12, h: 26, color: 0xffe9f5, label: "Alerte" },
    src: { planche: "assets/_codex_src/ui_hud.png", grid: [3, 2], cell: 1, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  ui_etoiles_etourdi: {
    path: "assets/ui/ui_etoiles_etourdi.png", scale: 0.24,
    placeholder: { w: 61, h: 24, color: 0xffe066, label: "Etoiles" },
    src: { planche: "assets/_codex_src/ui_hud.png", grid: [3, 2], cell: 2, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  ui_case_competence: {
    path: "assets/ui/ui_case_competence.png", scale: 0.133,
    placeholder: { w: 34, h: 34, color: 0x2a1f45, label: "Case" },
    src: { planche: "assets/_codex_src/ui_hud.png", grid: [3, 2], cell: 3, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  ui_anneau_objet: {
    path: "assets/ui/ui_anneau_objet.png", scale: 0.28,
    placeholder: { w: 72, h: 72, color: 0x2a1f45, label: "Anneau" },
    src: { planche: "assets/_codex_src/ui_hud.png", grid: [3, 2], cell: 4, cut: "grid" },
    norm: { mode: "fit", value: 256 },
  },
  ui_ornement_titre: {
    path: "assets/ui/ui_ornement_titre.png", scale: 0.5,
    placeholder: { w: 186, h: 55, color: 0xffe9f5, label: "Ornement" },
    src: { planche: "assets/_codex_src/ui_hud.png", grid: [3, 2], cell: 5, cut: "grid" },
    norm: { mode: "fit", value: 512 },
  },
  // [P4] Barres, affichées plus épaisses que prévu pour que le remplissage
  // reste lisible (les rainures peintes sont fines) : énergie = cadre 150x22
  // en 3 morceaux, rainure de 114x7 (et non 128) où le remplissage est
  // affiché en displaySize(114, 7) et rogné par setCrop selon le ratio ;
  // boss = cadre 448x32, rainure 378x8 pour le remplissage.
  ui_energie_cadre: {
    path: "assets/ui/ui_energie_cadre.png", scale: 0.25,
    placeholder: { w: 150, h: 22, color: 0x241510, label: "Energie" },
    nineSlice: { left: 290, right: 290, top: 0, bottom: 0 },
    src: { planche: "assets/_codex_src/ui_barres.png", grid: [1, 4], cell: 0, cut: "grid" },
    norm: { mode: "trim" },
  },
  ui_energie_remplissage: {
    path: "assets/ui/ui_energie_remplissage.png", scale: 0.11,
    placeholder: { w: 114, h: 7, color: 0x8fe3b8, label: "Energie" },
    src: { planche: "assets/_codex_src/ui_barres.png", grid: [1, 4], cell: 1, cut: "grid" },
    norm: { mode: "trim" },
  },
  ui_boss_cadre: {
    path: "assets/ui/ui_boss_cadre.png", scale: 0.5,
    placeholder: { w: 448, h: 32, color: 0x241510, label: "Boss" },
    nineSlice: { left: 250, right: 250, top: 0, bottom: 0 },
    src: { planche: "assets/_codex_src/ui_barres.png", grid: [1, 4], cell: 2, cut: "grid" },
    norm: { mode: "trim" },
  },
  ui_boss_remplissage: {
    path: "assets/ui/ui_boss_remplissage.png", scale: 0.32,
    placeholder: { w: 378, h: 8, color: 0x7bd35a, label: "Boss" },
    src: { planche: "assets/_codex_src/ui_barres.png", grid: [1, 4], cell: 3, cut: "grid" },
    norm: { mode: "trim" },
  },
  // Panneau peint du menu du feu de camp (image EXISTANTE, pas à générer) :
  // CampfireMenuScene l'affiche si la texture item-ui_feu_camp existe, à
  // échelle uniforme calculée (toute la hauteur, 727x540). src = l'image
  // elle-même (l'import la voit présente) : JAMAIS de --force sur cette
  // entrée, il la rognerait de ses marges transparentes.
  ui_feu_camp: {
    path: "assets/items/firecamp_menu/interface.png", scale: 0.5,
    placeholder: { w: 727, h: 540, color: 0x2a1e14, label: "Feu de camp" },
    src: { file: "assets/items/firecamp_menu/interface.png" },
    norm: { mode: "trim" },
  },
  // [P1] Lot Codex n°11 : pièces de branches et de tronc du grand arbre, pour
  // que les plateformes (arène de Kainati, racines, épreuve du singe) se lisent
  // comme de vraies branches. Cf. docs/production/PROMPT_CODEX_11.md.
  // Mode height + trim_x avec value = hauteur de la case : ni rognage vertical
  // ni redimension (pixels source intacts). La ligne de marche reste donc à
  // une rangée FIXE : 256 sur 512 pour les 4 branches, soit le milieu de
  // l'image (setOrigin(x, 0.5) posé sur la surface). Pièces dessinées tronc à
  // gauche, pointe à droite (flipX pour l'autre sens). Milieu tuilable en
  // largeur (1536 px, soit 384 px = 6 cases à 0,25).
  branche_milieu: {
    path: "assets/decors/elements/branche_milieu.png", scale: 0.25,
    placeholder: { w: 384, h: 128, color: 0x4a2c28, label: "Branche" },
    src: { planche: "assets/_codex_src/branches_milieu_fourche.png", grid: [1, 2], cell: 0, cut: "grid" },
    norm: { mode: "height", value: 512, trim_x: true },
  },
  branche_fourche: {
    path: "assets/decors/elements/branche_fourche.png", scale: 0.25,
    placeholder: { w: 256, h: 128, color: 0x4a2c28, label: "Fourche" },
    src: { planche: "assets/_codex_src/branches_milieu_fourche.png", grid: [1, 2], cell: 1, cut: "grid" },
    norm: { mode: "height", value: 512, trim_x: true },
  },
  branche_base: {
    path: "assets/decors/elements/branche_base.png", scale: 0.25,
    placeholder: { w: 160, h: 128, color: 0x4a2c28, label: "Branche base" },
    src: { planche: "assets/_codex_src/branches_base_bout.png", grid: [1, 2], cell: 0, cut: "grid" },
    norm: { mode: "height", value: 512, trim_x: true },
  },
  branche_bout: {
    path: "assets/decors/elements/branche_bout.png", scale: 0.25,
    placeholder: { w: 112, h: 128, color: 0x4a2c28, label: "Branche bout" },
    src: { planche: "assets/_codex_src/branches_base_bout.png", grid: [1, 2], cell: 1, cut: "grid" },
    norm: { mode: "height", value: 512, trim_x: true },
  },
  // Tronc : segment tuilable en hauteur (1536 px, soit 384 px = 6 cases à 0,25 ;
  // fût de 768 px, soit 3 cases) et pied, dont le haut se raccorde au bas du
  // segment. Ligne de sol du pied : rangée 960 sur 1024, setOrigin(0.5, 0.9375).
  tronc_segment: {
    path: "assets/decors/elements/tronc_segment.png", scale: 0.25,
    placeholder: { w: 192, h: 384, color: 0x4a2c28, label: "Tronc" },
    src: { file: "assets/_codex_src/tronc_segment.png" },
    norm: { mode: "height", value: 1536, trim_x: true },
  },
  tronc_base: {
    path: "assets/decors/elements/tronc_base.png", scale: 0.25,
    placeholder: { w: 350, h: 256, color: 0x4a2c28, label: "Tronc base" },
    src: { file: "assets/_codex_src/tronc_base.png" },
    norm: { mode: "height", value: 1024, trim_x: true },
  },
};

const TILESET_MANIFEST = {
  tuiles_ecorce: {
    dir: "assets/decors/tuiles_ecorce_frames",
    src: { sol: "assets/_codex_src/tuiles_ecorce_sol.png", plateformes: "assets/_codex_src/tuiles_ecorce_plateformes.png", speciaux: "assets/_codex_src/tuiles_ecorce_speciaux.png" },
  },
  tuiles_flottantes: {
    dir: "assets/decors/tuiles_flottantes_frames",
    src: { sol: "assets/_codex_src/tuiles_flottantes_sol.png", plateformes: "assets/_codex_src/tuiles_flottantes_plateformes.png", speciaux: "assets/_codex_src/tuiles_flottantes_speciaux.png" },
  },
  tuiles_corrompues: {
    dir: "assets/decors/tuiles_corrompues_frames",
    src: { sol: "assets/_codex_src/tuiles_corrompues_sol.png", plateformes: "assets/_codex_src/tuiles_corrompues_plateformes.png", speciaux: "assets/_codex_src/tuiles_corrompues_speciaux.png" },
  },
};
