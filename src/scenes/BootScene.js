class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Sprites forme humaine : fichiers individuels (un par frame), générés
    // à partir de assets/sprites/agarica.png via tools/split_spritesheet.py
    // (voir AGARICA_ANIM_ROWS dans Player.js pour le mapping ligne -> anim).
    for (const { name, row, count } of AGARICA_ANIM_ROWS) {
      for (let c = 0; c < count; c++) {
        this.load.image(`agarica-${name}-${c}`, `assets/sprites/agarica_frames/agarica_row${row}_${c}.png`);
      }
    }
    // Marche : feuille dédiée, voir AGARICA_WALK_FRAME_INDICES dans
    // Player.js, généré depuis assets/sprites/agarica_walk.png.
    for (const i of AGARICA_WALK_FRAME_INDICES) {
      this.load.image(`agarica-walk-${i}`, `assets/sprites/agarica_walk_frames/agarica_walk_${i}.png`);
    }
    // Attaque à la dague : feuille dédiée (assets/sprites/agarica_attack.png,
    // fond noir), voir AGARICA_ATTACK_FRAME_COUNT dans Player.js.
    for (let i = 0; i < AGARICA_ATTACK_FRAME_COUNT; i++) {
      this.load.image(`agarica-attack-${i}`, `assets/sprites/agarica_attack_frames/agarica_attack_${i}.png`);
    }
    // Sprites forme Loup : voir LOUP_ANIM_ROWS dans Player.js pour le mapping
    // ligne -> anim (course / saut), généré depuis assets/sprites/loup.png.
    for (const { name, row, count } of LOUP_ANIM_ROWS) {
      for (let c = 0; c < count; c++) {
        this.load.image(`loup-${name}-${c}`, `assets/sprites/loup_frames/loup_row${row}_${c}.png`);
      }
    }
    // Attaque du Loup : feuille dédiée (voir LOUP_ATTACK_ANIM_ROWS dans
    // Player.js), généré depuis assets/sprites/loup_attaque.png.
    let attackFrameIndex = 0;
    for (const { row, count } of LOUP_ATTACK_ANIM_ROWS) {
      for (let c = 0; c < count; c++) {
        this.load.image(`loup-attack-${attackFrameIndex}`, `assets/sprites/loup_attaque_frames/loupattaque_row${row}_${c}.png`);
        attackFrameIndex++;
      }
    }
    // Sprites Corbeau/Aigle : voir PIAF_ANIM_ROWS dans Player.js pour le
    // mapping ligne -> anim (vol / glisse / piqué), partagé entre l'ennemi
    // Corbeau et la forme Aigle du joueur, généré depuis assets/sprites/piaf.png.
    for (const { name, row, count } of PIAF_ANIM_ROWS) {
      for (let c = 0; c < count; c++) {
        this.load.image(`piaf-${name}-${c}`, `assets/sprites/piaf_frames/piaf_row${row}_${c}.png`);
      }
    }
    // Plume tirée en forme Aigle (voir Feather.js), animée (léger scintillement
    // en vol) : 4 frames découpées depuis assets/sprites/piaf_frames/plume_animation.png.
    for (let i = 0; i < FEATHER_FRAME_COUNT; i++) {
      this.load.image(`${FEATHER_ANIM_PREFIX}${i}`, `assets/sprites/piaf_frames/plume_animation_frames/plumeanim_row0_${i}.png`);
    }
    // Toutes les feuilles de TRANSFORMATION (humain <-> Loup/Aigle/Pieuvre/
    // Ours, + le flash Loup->Aigle) vivent sous assets/sprites/transformation/
    // (rangées ensemble à part des frames "propres" à chaque forme --
    // demande explicite : "range toute les transformation dans un dossier
    // transformation" -- alors que loup_frames/piaf_frames/pieuvre_frames/
    // ours_frames, qui sont les poses de DÉPLACEMENT/ATTAQUE de chaque
    // forme une fois transformée, restent directement sous assets/sprites/).
    //
    // Transformation humaine -> Aigle (voir les constantes TRANSFO_* dans
    // Player.js pour le mapping ligne/colonne), généré depuis
    // assets/sprites/image.png (planche d'origine supprimée après découpe).
    this.load.image(TRANSFO_RISE_START_KEY, 'assets/sprites/transformation/transfo_frames/transfo_row0_1.png');
    this.load.image(TRANSFO_FALL_START_KEY, 'assets/sprites/transformation/transfo_frames/transfo_row1_1.png');
    this.load.image(TRANSFO_STEP2_KEY, 'assets/sprites/transformation/transfo_frames/transfo_row0_2.png');
    // Transformation humaine <-> Loup (voir ANIM_TRANSFO_TO_WOLF_KEY dans
    // Player.js), généré depuis assets/sprites/transfo_loup.png.
    for (let i = 0; i < TRANSFO_WOLF_FRAME_COUNT_LOADED; i++) {
      this.load.image(`transfo-wolf-${i}`, `assets/sprites/transformation/transfo_loup_frames/transfoloup_${i}.png`);
    }
    // Flash Loup -> Aigle (voir TRANSFO_WOLF_EAGLE_* dans Player.js), généré
    // depuis assets/sprites/transfo_loup_piaf.png.
    this.load.image(TRANSFO_WOLF_EAGLE_TEXTURE_KEY, 'assets/sprites/transformation/transfo_loup_piaf_frames/transfoloup_piaf_0.png');
    // Sprites Xara (marche au sol / balancier suspendue à un fil), voir
    // XARA_WALK_FRAME_INDICES dans Xara.js, généré depuis
    // assets/sprites/Xara.png. Une seule pose pour le balancier
    // (`swing-0`, mouvement fait par code, pas par cycle d'anim) + 3 poses
    // de bascule sol <-> balancier (`switch-1..3`).
    for (const i of XARA_WALK_FRAME_INDICES) {
      this.load.image(`xara-walk-${i}`, `assets/sprites/xara_frames/xara_walk_${i}.png`);
    }
    this.load.image('xara-swing-0', 'assets/sprites/xara_frames/xara_swing_0.png');
    for (let i = 1; i <= 3; i++) {
      this.load.image(`xara-switch-${i}`, `assets/sprites/xara_frames/xara_switch_${i}.png`);
    }
    // Poses de saut (sol, forme Agarica) : générées depuis
    // assets/sprites/xara_frames/xara_jump_frames.png (rééchelonnées au même
    // gabarit que les frames de marche ci-dessus, cf. XARA_JUMP_RISE_TEXTURE
    // dans Xara.js).
    for (let i = 0; i <= 3; i++) {
      this.load.image(`xara-jump-${i}`, `assets/sprites/xara_frames/xara_jump_${i}.png`);
    }
    // Sprites forme Pieuvre : voir PIEUVRE_WALK_FRAME_COUNT dans Player.js,
    // généré depuis assets/sprites/pieuvre-mooves.png.
    for (let i = 0; i < PIEUVRE_WALK_FRAME_COUNT; i++) {
      this.load.image(`pieuvre-walk-${i}`, `assets/sprites/pieuvre_frames/pieuvre_walk_${i}.png`);
    }
    // Transformation humaine <-> Pieuvre (voir ANIM_TRANSFO_TO_OCTOPUS_KEY
    // dans Player.js), généré depuis
    // assets/sprites/transfo-humain-pieuvre.png.
    for (let i = 0; i < TRANSFO_PIEUVRE_FRAME_COUNT_LOADED; i++) {
      this.load.image(`transfo-pieuvre-${i}`, `assets/sprites/transformation/transfo_pieuvre_frames/transfopieuvre_${i}.png`);
    }
    // Transformation humaine <-> Ours (voir ANIM_TRANSFO_TO_OURS_KEY dans
    // Player.js, jouée au lancement de la compétence Ours AVANT l'anim
    // d'attaque elle-même, cf. ANIM_OURS_SLAM_KEY plus bas), généré depuis
    // assets/sprites/transformation/transfo_ours.png (planche d'origine,
    // gardée cette fois -- contrairement aux autres transfos dont la
    // planche source a été supprimée après découpe). 4 poses (humaine ->
    // hybride -> hybride avancée -> ours final), découpées via l'habituel
    // tools/split_spritesheet.py (silhouette d'un seul tenant, contrairement
    // à la planche d'attaque de l'Ours qui a besoin de son découpage dédié).
    for (let i = 0; i < TRANSFO_OURS_FRAME_COUNT; i++) {
      this.load.image(`transfo-ours-${i}`, `assets/sprites/transformation/transfo_ours_frames/transfo_ours_row0_${i}.png`);
    }
    // Compétence Ours ("fracas au sol", voir ANIM_OURS_SLAM_KEY/SKILL_DEFS
    // dans Player.js), généré depuis assets/sprites/compétence/ours.png via
    // tools/crop_ours_skill.py (pas split_spritesheet.py habituel -- les
    // débris de l'impact sont disjoints du corps de l'ours dans l'image
    // source, ce qui explose la découpe par composantes connexes standard).
    // Index i -> row{floor(i/3)}_{i%3} = ordre de lecture naturel de la
    // planche (gauche->droite, haut->bas), qui est aussi l'ordre de l'anim.
    for (let i = 0; i < OURS_ANIM_FRAME_COUNT; i++) {
      this.load.image(`ours-${i}`, `assets/sprites/ours_frames/ours_row${Math.floor(i / 3)}_${i % 3}.png`);
    }
    // Ennemi Crapaud (langue-attaque, voir Crapaud.js), généré depuis
    // assets/sprites/image.png via tools/crop_crapaud.py -- PAS
    // split_spritesheet.py habituel : ce script-là centre chaque frame
    // indépendamment, ce qui ferait sauter le corps du crapaud d'un côté à
    // l'autre du canvas puisque ses frames ont des largeurs très
    // différentes (langue plus ou moins tirée) ; crop_crapaud.py aligne
    // plutôt tout le monde à GAUCHE, le corps reste fixe et seule la
    // langue s'étire vers la droite. Index i -> row0_i pour i<4 (langue qui
    // sort progressivement), row1_0 pour i=4 (apogée : la planche entière
    // de la 2e ligne, une seule frame très large) -- ordre de lecture
    // naturel de la planche, déjà le bon ordre d'anim.
    for (let i = 0; i < CRAPAUD_FRAME_COUNT; i++) {
      const row = i < 4 ? 0 : 1;
      const col = i < 4 ? i : 0;
      this.load.image(`crapaud-${i}`, `assets/sprites/crapaud_frames/crapaud_row${row}_${col}.png`);
    }
    // Totems de capacité (voir TOTEM_TYPE_BY_FLAG dans LevelKit.js), généré
    // depuis assets/items/totems.png. Une paire lit/dim par forme.
    for (const type of ['wolf', 'eagle', 'octopus']) {
      for (const state of ['lit', 'dim']) {
        this.load.image(`totem-${type}-${state}`, `assets/items/totem_frames/totem_${type}_${state}.png`);
      }
    }
    // Bannière "transformation débloquée" (voir showFormUnlockPopup dans
    // LevelKit.js) : remplace l'ancienne image statique unique par planche
    // (assets/items/unlock_frames/, retirée) par une VRAIE animation de
    // pousse (graine -> liane -> pancarte de bois, 5 poses partagées par
    // les 3 formes, cf. UNLOCK_POPUP_ANIM_FRAME_COUNT dans LevelKit.js),
    // depuis assets/items/unlock_popup_animate/unlock{1..5}.png.
    for (let i = 0; i < UNLOCK_POPUP_ANIM_FRAME_COUNT; i++) {
      this.load.image(`unlock-anim-${i}`, `assets/items/unlock_popup_animate/unlock${i + 1}.png`);
    }
    // Icône de forme (voir showFormUnlockPopup), rajoutée par-dessus la
    // pancarte une fois l'animation ci-dessus terminée -- depuis
    // assets/items/form_icone/ (noms français dans les fichiers, clés
    // anglaises TOTEM_TYPE_BY_FLAG dans le jeu).
    const FORM_ICON_FILE_BY_TYPE = { wolf: 'loup', eagle: 'aigle', octopus: 'pieuvre' };
    for (const type of ['wolf', 'eagle', 'octopus']) {
      this.load.image(`form-icon-${type}`, `assets/items/form_icone/${FORM_ICON_FILE_BY_TYPE[type]}.png`);
    }
    // Feu de camp décoratif (voir addCampfire dans LevelKit.js), découpé
    // depuis assets/items/feu de camp.png (4 flambées, par plage de colonnes
    // avec contenu plutôt que composantes connexes — les étincelles
    // volantes de chaque flambée forment des îlots séparés de la flamme
    // elle-même, ce qui ferait exploser la découpe habituelle en dizaines de
    // micro-frames au lieu de 4).
    for (let i = 0; i < CAMPFIRE_FRAME_COUNT; i++) {
      this.load.image(`${CAMPFIRE_TEXTURE_PREFIX}${i}`, `assets/items/feu_de_camp_frames/feu_${i}.png`);
    }
    // Blocs de sol (voir GROUND_ART_COUNT/addGroundTileVisual dans
    // LevelKit.js), découpés depuis assets/decors/surface.png
    // (tools/crop_ground.py) — ligne "SOL SURFACE" de la planche.
    for (let i = 0; i < GROUND_ART_COUNT; i++) {
      this.load.image(`${GROUND_ART_PREFIX}${i}`, `assets/decors/surface_frames/ground_${i}.png`);
    }
    // Remplissage terre/roche sous la surface (voir FILL_DEPTH/
    // addFillTileVisual dans LevelKit.js), même planche, lignes "TERRE
    // MILIEU"/"SOUS-SOL PROFOND".
    for (let i = 0; i < DIRT_ART_COUNT; i++) {
      this.load.image(`${DIRT_ART_PREFIX}${i}`, `assets/decors/surface_frames/dirt_${i}.png`);
    }
    for (let i = 0; i < ROCK_ART_COUNT; i++) {
      this.load.image(`${ROCK_ART_PREFIX}${i}`, `assets/decors/surface_frames/rock_${i}.png`);
    }
    // Terrain en grille façon éditeur (voir AUTOTILE_POSITIONS/
    // renderAutotileGrid dans LevelKit.js), découpé depuis
    // assets/decors/floor.png (tools/crop_autotile.py) — un jeu de 9 tuiles
    // "9-slice" (terre uniquement, cf. AUTOTILE_PREFIX — l'option "Roche" a
    // été retirée de l'éditeur quand cette planche est passée à un seul
    // matériau), indépendant du système de sol à une rangée ci-dessus,
    // utilisé uniquement par les niveaux construits dans EditorScene.js
    // (les 8 Zone*Scene actuelles ne migrent pas dessus).
    for (const pos of AUTOTILE_POSITIONS) {
      this.load.image(`autotile-dirt-${pos}`, `assets/decors/autotile_frames/dirt_${pos}.png`);
    }
    // dirt_t2/tl2/tr2 existent toujours dans assets/decors/autotile_frames/
    // mais ne sont plus chargées/utilisées du tout (retour utilisateur :
    // "vire tr2 et tl2 des construction", puis "retire t2 de la liste des
    // tuiles") -- ne pas les rebrancher sans qu'il le redemande.
    // Plateforme flottante (cf. AUTOTILE_PLATFORM_VARIANT_COUNT dans
    // LevelKit.js) : une case "herbe du dessus" sans aucune case en dessous
    // (vrai bloc isolé, pas juste le dessus d'une masse de terre continue)
    // a besoin d'un pourtour rocheux fermé de tous les côtés, pas juste du
    // haut -- assets/decors/plateforme.png, 3 variantes.
    for (let i = 0; i < AUTOTILE_PLATFORM_VARIANT_COUNT; i++) {
      this.load.image(`autotile-dirt-platform${i}`, `assets/decors/autotile_frames/dirt_platform${i}.png`);
    }
    // Variantes de la case "intérieure" (fill, aucun bord exposé, voir
    // DIRT_CENTER_VARIANT_COUNT dans LevelKit.js), découpées de la même
    // planche (les 7 cases hors du bloc 3x3 classique) — piochées au hasard
    // à la place de la tuile `autotile-dirt-c` unique ci-dessus, pour
    // varier une grande zone de terre pleine au lieu de répéter la même
    // case partout.
    for (let i = 0; i < DIRT_CENTER_VARIANT_COUNT; i++) {
      this.load.image(`autotile-dirt-c-var${i}`, `assets/decors/autotile_frames/dirt_c_var${i}.png`);
    }
    // Coins intérieurs (escalier en blocs carrés, cf.
    // AUTOTILE_INNER_CORNER_TEXTURE/FLIP_X/FLIP_Y dans LevelKit.js) : 2
    // images (haut/bas), chacune retournée en miroir pour ses 2 orientations
    // gauche/droite plutôt que 4 fichiers séparés (jamais tournées, cf. ce
    // commentaire dans LevelKit.js). Dessinées à part (pas une case de
    // floor.png), mais recadrées au même format carré que les autres par
    // tools/crop_autotile.py.
    this.load.image('autotile-dirt-angle', 'assets/decors/autotile_frames/dirt_angle.png');
    this.load.image('autotile-dirt-coin', 'assets/decors/autotile_frames/coin.png');
    // Décors "déco item" plaçables dans l'éditeur, groupés par section (cf.
    // DECOR_SECTIONS dans LevelKit.js et tools/crop_deco_items.py) --
    // chaque item vient de assets/decors/deco_item_frames/<section>/
    // <section>_<item>.png, sa clé de texture reprend le même
    // `${section}_${item}` que PROP_TYPES pour rester cohérente partout.
    for (const [section, items] of Object.entries(DECOR_SECTIONS)) {
      for (const item of items) {
        const key = `${section}_${item}`;
        this.load.image(`${PROP_PREFIX}${key}`, `assets/decors/deco_item_frames/${section}/${key}.png`);
      }
    }
    // Décor en plans de profondeur (voir addMoonlitDecor dans LevelKit.js) :
    // plan4 = ciel/lune/montagnes (le plus loin, seul plan resté une bande
    // tuilée fixe). Découpé depuis assets/decors/.
    this.load.image('decor-plan4', 'assets/decors/plan4_ciel.png');
    // Forêt procédurale (plan3, voir addProceduralForest dans LevelKit.js),
    // arbres individuels découpés depuis assets/decors/arbres.png.
    for (let i = 0; i < ARBRE_COUNT; i++) {
      this.load.image(`${ARBRE_TEXTURE_PREFIX}${i}`, `assets/decors/arbres_frames/arbre_${i}.png`);
    }
    // Plantes de premier plan (touffes au sol + lianes au plafond, voir
    // addProceduralGroundPlants/HangingPlants dans LevelKit.js), découpées
    // depuis assets/decors/plantes.png (préfixe b/h du nom de fichier = bas/haut).
    for (const i of PLANTE_BUSH_INDICES) {
      this.load.image(`${PLANTE_BUSH_PREFIX}${i}`, `assets/decors/plantes_frames/bplante_${i}.png`);
    }
    for (const i of PLANTE_HANGING_INDICES) {
      this.load.image(`${PLANTE_HANGING_PREFIX}${i}`, `assets/decors/plantes_frames/hplante_${i}.png`);
    }
  }

  create() {
    const { width, height } = this.scale;

    // Mode édition (index.html?editor, cf. main.js) : les assets sont
    // chargés (BootScene reste le seul point d'entrée qui précharge tout),
    // mais on saute l'écran-titre normal pour aller droit à l'éditeur.
    if (new URLSearchParams(window.location.search).has('editor')) {
      this.scene.start('EditorScene');
      return;
    }

    // Fond dégradé violet nuit -> vert lunaire, en attendant la vraie DA.
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1030, 0x1a1030, 0x1f3d2b, 0x1f3d2b, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2, 'Legend of Agarica', {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      color: '#e8d9ff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 40, 'Appuie sur une touche pour commencer', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#a99bd6',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown', () => goToScene(this, 'PrologueScene'));
  }
}
