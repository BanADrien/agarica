// Prologue de la démo (Nouvelle partie) : le bosquet d'Émeraude face à la
// mousse toxique, puis BosquetScene. Les lignes apparaissent une à une ;
// une touche affiche la suivante, puis lance la partie. Texte ajustable.
// Retour des joueurs : « juste le début, il y a pas mal de texte ». Trois
// lignes courtes au plus, le reste se joue (cf. STYLE_DIALOGUES.md).
const PROLOGUE_LINES = [
  'Agarica est druidesse au bosquet d\'Émeraude. Son père en est le chef.',
  'Une mousse ronge la forêt et rend les bêtes folles.',
  'Cette nuit encore, tout le bosquet la gratte.',
];

class PrologueScene extends Phaser.Scene {
  constructor() {
    super('PrologueScene');
  }

  create() {
    const { width, height } = this.scale;
    this.__transitioningAway = false;
    fadeInScene(this);
    if (this.textures.exists('titre-fond')) {
      // Même fond peint que le titre et le chargement (image de l'utilisateur,
      // 2026-11-07), recadré au centre ; voile sombre pour la lecture du texte.
      const bg = this.add.image(width / 2, height / 2, 'titre-fond');
      bg.setScale(Math.max(width / bg.width, height / bg.height));
      this.add.rectangle(0, 0, width, height, 0x0d0b1a, 0.55).setOrigin(0);
    } else {
      addMoonlitDecor(this, width, height, width, [], 'fond_bosquet');
      addCaveCeiling(this, width);
      this.add.rectangle(0, 0, width, height, 0x0d0b1a, 0.6).setOrigin(0);
    }

    this.add.text(width / 2, 64, 'Le bosquet d\'Émeraude', {
      fontFamily: STORY_UI.serif, fontSize: '32px', fontStyle: 'bold', color: '#ffe9f5',
      stroke: '#15101f', strokeThickness: 6, padding: { x: 20, y: 16 },
    }).setOrigin(0.5).setShadow(0, 0, '#ff9fc9', 14, true, true);

    this.lineTexts = PROLOGUE_LINES.map((line, i) => this.add.text(width / 2, 130 + i * 62, line, {
      fontFamily: STORY_UI.serif, fontSize: '19px', color: '#e8d9ff', align: 'center',
      wordWrap: { width: width - 220 }, lineSpacing: 6,
      // Contour sombre : lisible sur les zones claires du fond peint.
      stroke: '#15101f', strokeThickness: 4,
    }).setOrigin(0.5, 0).setAlpha(0));
    this.shownCount = 0;

    this.prompt = this.add.text(width / 2, height - 30, 'Appuie sur une touche', {
      fontFamily: 'sans-serif', fontSize: '14px', color: STORY_UI.textSoft,
      backgroundColor: '#15101fb0', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: this.prompt, alpha: 0.9, duration: 900, yoyo: true, repeat: -1, delay: 800 });

    this.revealNext();
    // Défilement automatique doux ; une touche accélère.
    this.autoTimer = this.time.addEvent({ delay: 2600, loop: true, callback: () => this.revealNext() });
    // Petit délai avant d'écouter le clavier : la touche qui a validé
    // « Nouvelle partie » ne doit pas sauter le prologue.
    this.time.delayedCall(500, () => this.input.keyboard.on('keydown', (e) => { if (!e.repeat) this.advance(); }));
  }

  revealNext() {
    if (this.shownCount >= this.lineTexts.length) return false;
    this.tweens.add({ targets: this.lineTexts[this.shownCount], alpha: 1, duration: 700 });
    this.shownCount += 1;
    return true;
  }

  advance() {
    if (this.revealNext()) return;
    this.autoTimer.remove();
    goToScene(this, 'BosquetScene');
  }
}
