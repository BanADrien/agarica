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
  // [P1] Galter, ranger halfelin
  galter: {
    dir: "assets/sprites/galter_frames", prefix: "galter",
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
    placeholder: { w: 34, h: 70, color: 0x7a5c3a, label: "Galter" },
    sheets: [
      { file: "assets/sprites/galter.png", rows: [0, 1, 2] },
      { file: "assets/sprites/galter_p2.png", rows: [3, 4, 5] },
    ],
    cut: "blob", align: "bottom",
  },
  // [P2] Clak, le crabe totem de Galter
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
    scale: 0.46,
    facing: "right",
    placeholder: { w: 175, h: 205, color: 0xe8e8e8, label: "Kainati" },
    sheets: [
      { file: "assets/sprites/kainati.png", rows: [0, 1] },
      { file: "assets/sprites/kainati_p2.png", rows: [2, 3] },
      { file: "assets/sprites/kainati_p3.png", rows: [4, 5] },
      { file: "assets/sprites/kainati_p4.png", rows: [6] },
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
    scale: 0.46,
    facing: "right",
    placeholder: { w: 175, h: 205, color: 0x9ff0e0, label: "Esprit Kainati" },
    sheets: [
      { file: "assets/sprites/kainati_esprit.png", rows: [0, 1] },
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
};

const ITEM_MANIFEST = {
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
  // [P1] Galter's map as an inventory item: a rolled-up parchment scroll tied with a cord, a corner
  carte_galter: {
    path: "assets/items/objets/carte_galter.png", scale: 0.16,
    placeholder: { w: 36, h: 36, color: 0xd8c08a, label: "carte_galter" },
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
  // [P2] Carte de Galter (écran de carte)
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
  // [P1] Portrait galter
  portrait_galter: {
    path: "assets/ui/portraits/galter.png", scale: 0.25,
    placeholder: { w: 128, h: 128, color: 0x2a1e14, label: "galter" },
    src: { file: "assets/_codex_src/portrait_galter.png" },
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
