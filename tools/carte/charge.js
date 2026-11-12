// Carte du monde (outil de travail) -- chargement des VRAIES données du jeu.
//
// Les fichiers de zone (src/data/*_data.js) sont des scripts globaux qui
// appellent des fonctions du jeu (groundRow, constantes...). Pour les lire sans
// rien recopier, on charge ici les mêmes scripts que index.html, dans le même
// ordre, SAUF src/main.js : le jeu ne démarre donc pas, mais toutes ses tables
// (zones, DEMO_ZONES, MAP_ZONE_LAYOUT, ENEMY_REGISTRY...) existent dans la page.
// La liste est lue dans index.html à chaque ouverture : une zone ajoutée au jeu
// apparaît ici toute seule.
(function () {
  'use strict';

  // Scripts à ne jamais lancer ici (le jeu ne doit pas démarrer).
  const SCRIPTS_EXCLUS = [/(^|\/)src\/main\.js$/];

  function chargerScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => resolve(src);
      s.onerror = () => reject(new Error(`script introuvable : ${src}`));
      document.head.appendChild(s);
    });
  }

  // Lit une `const NOM` globale d'un script du jeu (une `const` de premier
  // niveau n'est pas sur `window` : même méthode que mapZoneData, MapScene.js).
  function lireGlobale(nom) {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nom)) return undefined;
    try {
      return (new Function(`return typeof ${nom} !== 'undefined' ? ${nom} : undefined;`))();
    } catch (e) {
      return undefined;
    }
  }

  async function chargerJeu(suivi) {
    const reponse = await fetch('index.html', { cache: 'no-store' });
    if (!reponse.ok) throw new Error(`index.html illisible (${reponse.status})`);
    const doc = new DOMParser().parseFromString(await reponse.text(), 'text/html');
    const sources = Array.from(doc.querySelectorAll('script[src]')).map((s) => s.getAttribute('src'));
    const aCharger = sources.filter((src) => !SCRIPTS_EXCLUS.some((re) => re.test(src)));
    // Les fichiers du projet sont redemandés à chaque ouverture (pas de vieille
    // version gardée par le navigateur) ; Phaser (CDN) garde son cache.
    const tampon = `carte=${Date.now()}`;
    let fait = 0;
    for (const src of aCharger) {
      const distant = /^https?:\/\//.test(src);
      await chargerScript(distant ? src : `${src}${src.includes('?') ? '&' : '?'}${tampon}`);
      fait += 1;
      if (suivi) suivi(fait, aCharger.length, src);
    }
    return { sources, zonesData: sources.filter((s) => /^src\/data\/.+_data\.js$/.test(s)).map((s) => s.replace(/^src\/data\//, '').replace(/_data\.js$/, '')) };
  }

  window.CarteCharge = { chargerJeu, lireGlobale };
})();
