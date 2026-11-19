// Zone de test « foret_ambiance » (`index.html?zone=foret_ambiance`, ou Options > Zones de test) : même copie de la
// première partie de la forêt sombre que foret_lumiere, pour essayer les effets d'ambiance (src/data/ambiance_effets.js)
// un par un (src/scenes/ForetAmbianceScene.js). La zone d'origine n'est pas touchée.
const FORET_AMBIANCE_DATA = {
  ...FORET_LUMIERE_DATA,
  zoneName: 'Forêt d\'ambiance',
  zoneSub: 'Zone de test',
};
