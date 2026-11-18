// Zone de test « foret_lumiere » (`index.html?zone=foret_lumiere&lumiere`) : copie jouable de la première partie
// de la forêt sombre pour essayer les rayons de soleil sous la canopée (src/scenes/ForetLumiereScene.js). Mêmes
// tuiles, décors, plateformes, ennemis et musique ; la zone d'origine n'est pas touchée. Retirés : l'histoire
// (script, cinématiques, PNJ), les sorties, l'amas qui demande l'ours, et les voiles remplacés par l'éclairage.
const FORET_LUMIERE_DATA = (() => {
  const { script, ambient, look, ...base } = FORET_SOMBRE_1_DATA;
  return {
    ...base,
    zoneName: 'Forêt de lumière',
    zoneSub: 'Zone de test',
    lights: [],
    xara: false,
    npcs: [],
    triggers: [],
    butterflies: [],
    mossBlocks: [],
    breakables: [],
    exits: [],
    entries: [base.entries[0]],
  };
})();
