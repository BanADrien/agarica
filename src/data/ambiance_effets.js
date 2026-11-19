// Effets d'ambiance qui s'ajoutent à une ambiance d'éclairage (src/utils/AmbianceEffets.js). Une ambiance de
// AMBIANCES_LUMIERE les active avec `effets: AMBIANCE_EFFETS.foret` (ou une copie réduite) ; la zone de test
// foret_ambiance les active tous et permet de couper chacun.
//
// Ordre et noms affichés dans le panneau de la zone de test
const AMBIANCE_EFFETS_LISTE = [
  { id: 'poussiere', nom: 'Poussiere dans les rayons' },
  { id: 'taches', nom: 'Ombres de feuilles mouvantes' },
  { id: 'rafales', nom: 'Rafales de vent' },
  { id: 'nuages', nom: 'Nuages qui passent' },
  { id: 'lucioles', nom: 'Lucioles qui eclairent' },
  { id: 'brume', nom: 'Brume eclairee par les rayons' },
  { id: 'profondeur', nom: 'Fonds bleutes et voiles' },
  { id: 'gouttes', nom: 'Gouttes et flaques qui brillent' },
  { id: 'feuilles', nom: 'Feuilles qui tombent' },
  { id: 'fougeres', nom: 'Fougeres qui s\'ecartent' },
  { id: 'animaux', nom: 'Animaux furtifs' },
  { id: 'soir', nom: 'Lumiere de fin de journee' },
  { id: 'clairiere', nom: 'Clairiere' },
];

const AMBIANCE_EFFETS = {
  foret: {
    // grains dans les faisceaux (déjà créés par AmbianceKit) : l'effet les montre ou les cache
    poussiere: {},
    // ombres des feuilles dans les rayons, au sol et sur les personnages : force (0-1), taille d'une tache (px du
    // monde), dérive par le vent (px/s)
    taches: { force: 0.55, taille: 15, derive: 5 },
    // rafale toutes les `entre` secondes (min, max), montée et descente sur `duree` s ; balancement des rayons
    // multiplié par `balancement` au plus fort
    rafales: { entre: [8, 16], duree: 3.5, balancement: 3.5 },
    // nuage toutes les `entre` s, passage sur `duree` s ; les rayons tombent à (1 - profondeur) au plus sombre
    nuages: { entre: [12, 24], duree: 8, profondeur: 0.6 },
    // lucioles déjà semées par la zone (LevelKit) qui deviennent des sources (forme cercle) ; au plus `max` allumées
    lucioles: { max: 3 },
    // nappe de brume au sol : sombre hors des rayons, claire dedans
    brume: { alpha: 0.3, alphaRayon: 0.34, hauteur: 70, sol: 448, sombre: 0x1c2436, claire: 0xb9b69c, vitesse: 4 },
    // fonds (parallaxe < 1) : teinte bleutée plus forte au loin, voile au-dessus des plans lointains
    profondeur: { bleu: 0x8ea4d8, voile: 0x2c3a5c, voileAlpha: 0.22 },
    // flaques (x du monde, posées sur le sol) et gouttes qui tombent de la canopée
    gouttes: { flaques: [1180, 1460, 2040, 2620], nombre: 16, flaque: 'assets/vfx/ambiance/flaque_eau.png' },
    // feuilles qui tombent, rafale : `rafale` de plus
    feuilles: { nombre: 10, rafale: 8 },
    // sous-bois qui s'écarte d'Agarica et plie au vent (angle max en degrés)
    fougeres: { angle: 9, portee: 46, vent: 4 },
    // oiseaux qui s'envolent quand on approche (x du monde), silhouette qui traverse au loin toutes les `entre` s
    animaux: {
      oiseaux: [900, 1750, 2350],
      // planche de 4 cases : posé, ailes hautes, ailes basses, posé (cf. assets/sprites/oiseau_foret.png)
      oiseau: { fichier: 'assets/sprites/oiseau_foret.png', largeur: 48, hauteur: 47 },
      silhouette: { entre: [18, 30], parallaxe: 0.45 },
    },
    // heure de 0 (après-midi) à 1 (fin de journée) en `duree` s ; la zone de test l'accélère
    soir: { duree: 600, soleil: 0xff9a4e, rayons: 0.7, ambiance: 0.72, faisceaux: [1, 0.66, 0.38] },
    // canopée ouverte au-dessus du sol de x0 à x1
    clairiere: { x0: 1900, x1: 2330, sol: 448 },
  },
};
