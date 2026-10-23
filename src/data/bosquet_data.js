// Zone « bosquet » : le bosquet d'Émeraude, la nuit, déjà rongé par la mousse
// (acte 1, zone 1 de PLAN_DEV.md). Toute la logique (tutoriel, aide aux
// druides, talisman, vol de l'idole, bannissement) vit dans
// src/story/acte1.js (ZONE_SCRIPTS.bosquet + CUTSCENES/DIALOGUES `bosquet_*`).
//
// Plan (grille 64, surface du sol y=448) — de gauche à droite :
//   x 0-760      la hutte d'Agarica (départ, tutoriel déplacement/saut)
//   x 760-1700   la place : enclos des 3 bébés cochons (terrasse), puits,
//                porteur de seaux, druide qui brûle la mousse
//   x 1700-2500  le chemin de la source : plaques de mousse à gratter (K),
//                amas dense sur la source (échec), créature de mousse
//   x 2500-3100  la hutte du chef (talisman de l'ours)
//   x 3100-3640  le sanctuaire de l'idole (estrade) : vol par Amanite
//   x 3640-3840  les portes de l'est (sortie après le bannissement)
const BOSQUET_SURFACE_Y = 448;

const BOSQUET_DATA = {
  levelWidth: 3840,
  levelHeight: 540,
  zoneName: "Bosquet d'Émeraude",
  zoneSub: 'La nuit où tout a basculé',
  background: 'fond_bosquet',
  ambient: { tint: 0x0a1030, darkness: 0.12 },
  xara: false,
  script: 'bosquet',
  groundCells: [
    // (groundRow : borne de fin exclue)
    ...groundRow(0, 60, [7, 8]),     // sol continu du bosquet
    ...groundRow(9, 11, [6]),        // marche devant la hutte (tuto saut, 1 case)
    ...groundRow(14, 19, [6]),       // terrasse de l'enclos des cochons (x 896-1216)
    ...groundRow(22, 24, [5]),       // tas de caisses / grenier (2 cases, optionnel)
    ...groundRow(43, 46, [6]),       // seuil de la hutte du chef (x 2752-2944)
    ...groundRow(50, 57, [6]),       // estrade du sanctuaire (x 3200-3648)
    ...groundRow(52, 55, [5]),       // marche de l'autel (x 3328-3520)
  ],
  playerSpawn: { x: 150, y: 412 },
  props: [
    // Hutte d'Agarica : le grand arbre à lanternes + deux arbres (anciennement
    // le prop unique `bosquet_grove`, dont les deux petits arbres flottaient,
    // cf. tools/split_grove.py).
    { type: 'bosquet_grand_arbre', x: 225, y: BOSQUET_SURFACE_Y, scale: 0.85 },
    { type: 'bosquet_arbre', x: 370, y: BOSQUET_SURFACE_Y, scale: 0.85 },
    { type: 'bosquet_arbre_2', x: 474, y: BOSQUET_SURFACE_Y, scale: 0.85 },
    { type: 'bosquet_lamp_post', x: 560, y: BOSQUET_SURFACE_Y, scale: 0.55 },
    { type: 'bosquet_bush_flowering', x: 60, y: BOSQUET_SURFACE_Y, scale: 0.5 },
    { type: 'bosquet_signpost', x: 760, y: BOSQUET_SURFACE_Y, scale: 0.5 },
    // La place
    { type: 'bosquet_fence', x: 940, y: 384, scale: 0.5 },
    { type: 'bosquet_fence', x: 1175, y: 384, scale: 0.5 },
    { type: 'bosquet_barrels', x: 1290, y: BOSQUET_SURFACE_Y, scale: 0.5 },
    { type: 'bosquet_crates', x: 1440, y: 320, scale: 0.55 },
    { type: 'bosquet_well', x: 1360, y: BOSQUET_SURFACE_Y, scale: 0.6 },
    { type: 'bosquet_bench', x: 1580, y: BOSQUET_SURFACE_Y, scale: 0.55 },
    { type: 'bosquet_lamp_post', x: 1680, y: BOSQUET_SURFACE_Y, scale: 0.55 },
    { type: 'bosquet_log_pile', x: 1500, y: BOSQUET_SURFACE_Y, scale: 0.45 },
    // Chemin de la source (le puits-source est recouvert par l'amas, cf. script)
    { type: 'bosquet_mossy_rock', x: 1760, y: BOSQUET_SURFACE_Y, scale: 0.5 },
    { type: 'bosquet_well', x: 2290, y: BOSQUET_SURFACE_Y, scale: 0.6 },
    { type: 'bosquet_cart', x: 2470, y: BOSQUET_SURFACE_Y, scale: 0.5 },
    // Hutte du chef : le grand arbre au sol, les deux petits sur le seuil
    // (x 2752-2944), chacun posé sur la surface sous lui.
    { type: 'bosquet_grand_arbre', x: 2562, y: BOSQUET_SURFACE_Y, scale: 1.1 },
    { type: 'bosquet_arbre', x: 2802, y: 384, scale: 1.1 },
    { type: 'bosquet_arbre_2', x: 2906, y: 384, scale: 1.1 },
    { type: 'bosquet_banner_tree', x: 2980, y: BOSQUET_SURFACE_Y, scale: 0.6 },
    { type: 'bosquet_lamp_post', x: 3070, y: BOSQUET_SURFACE_Y, scale: 0.55 },
    // Sanctuaire de l'idole
    { type: 'bosquet_standing_stone', x: 3250, y: 384, scale: 0.55 },
    // Statues en retrait des bords de la marche de l'autel (x 3328-3520) :
    // posées pile au bord, la moitié de leur socle débordait dans le vide.
    { type: 'bosquet_statue_hooded', x: 3362, y: 320, scale: 0.6 },
    { type: 'bosquet_antler_totem', x: 3424, y: 320, scale: 0.55 },   // l'autel de l'idole
    { type: 'bosquet_statue_hooded', x: 3486, y: 320, scale: 0.6 },
    { type: 'bosquet_standing_stone', x: 3600, y: 384, scale: 0.55 },
    // Portes de l'est
    { type: 'bosquet_fence', x: 3790, y: BOSQUET_SURFACE_Y, scale: 0.55 },
    { type: 'bosquet_lamp_post', x: 3700, y: BOSQUET_SURFACE_Y, scale: 0.55 },
  ],
  animals: [
    { type: 'cochons', x: 1056, y: 384, w: 200 },
  ],
  npcs: [
    { id: 'habitant_porteur', key: 'porteur', x: 1240, anim: 'idle', talk: 'bosquet_porteur' },
    { id: 'habitant_garde', key: 'garde_cochons', x: 860, talk: 'bosquet_garde_cochons', forbids: { banished: true } },
    { id: 'habitant_druide', key: 'druide_feu', x: 1540, anim: 'burn', lookAtPlayer: false, talk: 'bosquet_druide_feu' },
    {
      id: 'habitant_druide', key: 'druide_orme', x: 1840, anim: 'scrape',
      talk: [
        { requires: { aideFaite: true }, talk: 'bosquet_orme_apres' },
        { talk: 'bosquet_orme_aide' },
      ],
    },
    {
      id: 'pere_chef', x: 2840,
      talk: [
        { requires: { talismanOurs: true }, talk: 'bosquet_pere_apres' },
        { requires: { aideFaite: true }, talk: 'bosquet_talisman' },
        { talk: 'bosquet_pere_avant' },
      ],
      forbids: { idoleVolee: true },
    },
    { id: 'habitant_garde', key: 'garde_porte', x: 3720, talk: 'bosquet_garde_porte', forbids: { idoleVolee: true } },
  ],
  triggers: [
    { id: 'intro', x: 150, w: 200, cutscene: 'bosquet_intro' },
    { id: 'tuto_saut', x: 520, w: 40, cutscene: [{ toast: 'Espace (ou Z / ↑) : sauter. Encore une fois en l\'air : double saut.' }] },
    { id: 'tuto_parler', x: 760, w: 40, cutscene: [{ toast: 'E : parler aux habitants.' }] },
    { id: 'aide', x: 1760, w: 40, cutscene: 'bosquet_aide_debut' },
    // Barrières douces (rejouables) : on ne saute pas une étape de l'histoire.
    { id: 'barriere_aide', x: 2400, w: 30, once: false, forbids: { aideFaite: true }, cutscene: 'bosquet_barriere_aide' },
    { id: 'barriere_pere', x: 3080, w: 30, once: false, forbids: { talismanOurs: true }, cutscene: 'bosquet_barriere_pere' },
    { id: 'vol', x: 3165, w: 40, requires: { talismanOurs: true }, cutscene: 'bosquet_vol' },
    { id: 'porte', x: 3790, w: 40, once: false, cutscene: 'bosquet_porte' },
  ],
  exits: [],
  entries: [
    { id: 'from_foret_sombre_1', x: 3600, y: 380, height: 140 },
  ],
};
