// Sons du jeu : identifiant `playSfx` -> fichiers de assets/audio/ (cf. SON_OUTILS.md, skill `son`).
// Un son n'est listé ici qu'une fois CHOISI par l'utilisateur et rangé (avec sa ligne dans
// assets/audio/CREDITS.md). Le moteur (SFX_HOOKS['*'], LevelKit) joue un de ses fichiers au hasard,
// avec une légère variation de hauteur (guide gamedev « audio-design » : ne pas répéter à l'identique).
//   id: { files: ['assets/audio/sfx/<id>.ogg', ...], volume: 0..1, pitch: écart de vitesse (0,05 = ±5 %),
//         cooldownMs: écart minimal entre deux lectures (rafales) }
// Ours à sonoriser (candidats en attente de choix) : ours_slam, owlbear_slam, grizzly_crash, ice_spike,
// panda_heal.
const AUDIO_SFX = {
};
