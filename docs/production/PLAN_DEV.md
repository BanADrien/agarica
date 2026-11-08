# Plan de développement — Démo « Legend of Agarica » (histoire complète)

Branche git : `feature/demo-histoire`. Document de référence partagé par tous les agents
de développement. **Le contrat d'API ci-dessous fait foi** : si tu as besoin de
le modifier, fais-le de façon rétro-compatible et mets ce fichier à jour.

Sources narratives : `histoire/HISTOIRE_DEMO.md` (résumé canonique),
`histoire/PLAN_CARTE_DEMO.md` (zones + événements), `histoire/ZONES_ET_PROGRESSION.md`
(mécaniques détaillées), `histoire/DEMO_CONCEPTION.md`. En cas de contradiction,
HISTOIRE_DEMO.md + PLAN_CARTE_DEMO.md l'emportent. Le ranger s'appelle **Geralt** (nom définitif, demandé par l'utilisateur le 2026-10-22 ;
l'ancien nom « Galter » a été remplacé partout, identifiants compris).

Architecture existante : voir `docs/production/ARCHITECTURE.md`. Assets : voir
`docs/production/INVENTAIRE_ASSETS.md` et `src/data/asset_manifest.js`.

## Règles communes à tous les agents

1. Vanilla JS, globals, pas de modules/bundler. Commentaires en français, dans le style
   existant (explications du « pourquoi »), mais sans romans : 1-4 lignes suffisent.
2. **Ne modifie que les fichiers dont tu es propriétaire** (voir « Répartition »).
   Les balises `<script>` et l'enregistrement des scènes dans `src/main.js` sont DÉJÀ
   faits pour tous les fichiers prévus (fichiers stubs). Si tu crées un fichier non prévu,
   préviens dans ton rapport final au lieu de toucher `index.html`/`main.js`, sauf s'il
   est vraiment indispensable (alors ajoute UNE ligne, sans réordonner).
3. Aucun art n'existe encore pour les nouveaux éléments : tout passe par
   `addManifestSprite` / `addItemImage` (StoryKit) qui dessinent un placeholder lisible
   (rectangle coloré + étiquette) tant que la feuille Codex n'est pas importée. Le code
   doit fonctionner À L'IDENTIQUE avec ou sans art.
4. Tester avec le harnais headless (voir plus bas) sur **ton propre port** :
   Fondation 8811, Formes 8812, Kainati 8813, Ghil't 8814, Ennemis 8815, Acte 1 8816,
   Acte 2 8817, Éditeur 8818, Intégration 8819. Ne PAS lancer `tools/dev_server.py`
   (son Save réécrit les fichiers de zone).
5. Ne pas `git commit` : l'orchestrateur commit entre les vagues.
6. Fichiers de zone écrits À LA MAIN (helpers `groundRow`, commentaires). Le format doit
   rester compatible éditeur (JSON-like + helpers).

## Harnais de test

```
python tools/playtest.py --port 88xx --scene ForetSombre1Scene --flags xaraMet=true \
   --wait 3 --keys "ArrowRight:1500,Space:120" \
   --js "window.__game.scene.getScene('ForetSombre1Scene').player.x" --shot %TEMP%/x.png
```
Code de sortie 1 = erreur JS. Les 404 d'assets manquants sont ignorés (attendus).
Tu peux lire le screenshot avec l'outil Read pour vérifier visuellement.

## Contrat d'API — `src/utils/StoryKit.js` (chargé juste après LevelKit.js)

### Assets (manifest Codex)
- `ASSET_MANIFEST` / `ITEM_MANIFEST` : `src/data/asset_manifest.js` (chargé avant StoryKit).
- `loadManifestAssets(scene)` — appelé dans `BootScene.preload` ; charge les frames
  `${dir}/${prefix}_row${row}_${i}.png` et les images d'items ; les 404 sont tolérés.
- `manifestFrameKey(id, anim, i)` → `` `${id}-${anim}-${i}` ``.
- `hasManifestArt(scene, id, anim?)` → bool (vraie texture chargée, pas placeholder).
- `ensureManifestAnims(scene, id)` — crée les anims `` `${id}-${anim}` `` (vraies frames ou
  placeholder 1 frame).
- `addManifestSprite(scene, x, y, id, anim = 'idle', { physics = false, origin = [0.5, 1] } = {})`
  → `Phaser.GameObjects.Sprite` (ou `Physics.Arcade.Sprite` si physics) déjà à l'échelle
  `ASSET_MANIFEST[id].scale`, joue l'anim. `sprite.playManifest(anim)` pour changer
  d'anim (ne relance pas si déjà en cours). Taille du placeholder ≈ taille finale en jeu.
- `addItemImage(scene, x, y, id, { origin } = {})` → Image (placeholder si absent).
- Pour les entités qui étendent `Phaser.Physics.Arcade.Sprite` : utiliser
  `manifestInitialTexture(scene, id, anim)` → clé de texture valide (vraie frame 0 ou
  placeholder) à passer au `super(...)`, puis `ensureManifestAnims` + `this.play(...)`.

### État persistant, sauvegarde, inventaire
- `storyGet(key, def)`, `storySet(key, value)` — registre Phaser + sauvegarde auto
  localStorage (`agarica-save-v1`). Les clés existantes (`hasWolfForm`, `equippedForms`,
  `unlockedSkills`, `hearts`…) sont aussi sauvegardées.
- `saveGame(scene)`, `loadGame(game)` → bool, `hasSaveGame()`, `resetGame(game)`.
  Sauvegarde : à chaque feu de camp (en s'asseyant, et à la fermeture de son menu) + à chaque
  entrée de zone (`lastZone`, `lastEnterId`).
- Inventaire (objets-clés de l'histoire) : `inventoryAdd(scene, id, {silent})` (popup
  « Objet obtenu » avec `addItemImage`), `inventoryHas(id)`, `inventoryRemove(id)`,
  `inventoryList()`. Écran inventaire touche **I** (`InventoryScene`, overlay, monde gelé :
  objets de quête + consommables), avec la carte du monde (touche **M** → `MapScene`) si
  `storyMapAvailable()` (aujourd'hui : `inventoryHas('carte_geralt')`). Consommables, carte et
  feux de camp : voir « Feu de camp, carte du monde, vol de l'aigle » plus bas.
- `unlockSkillFromStory(scene, skillId)` — ajoute à `unlockedSkills`, équipe dans le 1er
  slot libre, popup « Compétence débloquée ». (Implémentée par l'agent Formes dans
  Player.js / StoryKit ? → **Fondation** l'implémente dans StoryKit, en réutilisant la
  logique de Player.)

### Dialogues & cinématiques
- `SPEAKERS` : `{ agarica, xara, amanite, pere_chef, geralt, clak, morgat, kainati,
  kainati_esprit, ghilt, habitant, garde, narrateur }` → `{ name, color }`.
- `DIALOGUES` (registre global, rempli par `src/story/*.js`) : `DIALOGUES[id] = [ {who, text}, … ]`.
  Une ligne peut avoir `choices: [{text, goto?}]` (optionnel, simple).
- `showDialogue(scene, linesOrId) → Promise` — overlay `DialogueScene` (boîte en bas,
  portrait `portrait-<who>` si art sinon médaillon coloré + nom, texte qui défile,
  E / Espace / Entrée pour avancer). Le monde est gelé pendant le dialogue.
- `CUTSCENES[id] = steps | (scene) => steps` (registre global, rempli par `src/story/*.js`).
- `runCutscene(scene, idOrSteps) → Promise`, joueur bloqué pendant toute la séquence.
  Étapes (objets, exécutées en série) :
  `{say: idOrLines}`, `{wait: ms}`, `{fadeOut: ms}`, `{fadeIn: ms}`,
  `{title: 'Texte', sub?: 'sous-titre'}` (carte de chapitre),
  `{npcMove: {npc: 'amanite', toX, speed?}}`, `{npcAnim: {npc, anim}}`, `{npcFace: {npc, dir}}`,
  `{npcRemove: 'amanite'}`, `{npcAdd: {id, x, y, anim}}`,
  `{playerMove: {toX, speed?}}`, `{playerFace: 'left'|'right'}`,
  `{camera: {x, y, ms}}` / `{cameraFollow: true}`, `{shake: {ms, intensity}}`, `{flash: {ms, color}}`,
  `{set: {flag: value, …}}`, `{give: 'itemId'}`, `{take: 'itemId'}`, `{skill: 'ours'}`,
  `{form: 'hasWolfForm'}` (débloque une forme comme un totem, avec popup),
  `{goto: {scene, data}}` (fin de cinématique), `{call: (scene) => Promise|void}`,
  `{parallel: [steps…]}`.
- `isWorldFrozen(scene)` — vrai si DialogueScene/InventoryScene/MapScene/CampfireMenuScene
  (ou PauseScene, ShopScene) actif ou `scene.__cutsceneLock`. `updateLevelFromData` l'utilise.
- Au début d'un dialogue ou d'une cinématique, Agarica s'arrête et se pose (pose stable) ; à la
  sortie, courte invulnérabilité : cf. « Agarica au début et à la sortie d'un dialogue » plus bas.
- `showBossBar(scene, name, getRatio)` / `hideBossBar(scene)` — barre de vie de boss HUD.
- `showToast(scene, text, ms)` — petit texte informatif à l'écran (indices de Xara, etc.).
- **Bulles de parole NON bloquantes** (2026-10-23) : `showSpeechBubble(scene, cible, texte,
  { ms, who, replace }) → Promise` (résolue quand la bulle a disparu). Bulle de BD au-dessus
  du personnage (fond sombre, liseré vert lunaire, pointe vers lui, ≤ 220 px de large,
  retour à la ligne) qui le SUIT (course, saut), ne gèle rien et ne prend aucune touche ;
  fondu après `ms` (défaut 2,5-5 s selon la longueur). `cible` : objet de jeu, ou
  `'agarica'`/`'player'`, `'xara'` (compagnon `scene.xara`, sinon PNJ), clé de `scene.npcs`
  ou id de manifest d'un PNJ ; introuvable → toast « Nom : texte ». Une bulle à la fois par
  personnage : les suivantes attendent (file), sauf `replace: true`. `clearSpeechBubbles(scene[, cible])`.
  Étape de cinématique `{bubble: {who, text, ms?, npc?}}` (ou `{bubble: 'texte'}` = Xara) :
  n'attend pas ; une cinématique faite UNIQUEMENT de bulles ne pose pas `__cutsceneLock`
  (monde non gelé). Réplique de dialogue `{who, text, bubble: true}` : part en bulle au lieu
  de la boîte (sauf dialogue à choix, entièrement dans la boîte). Usage côté histoire :
  `if (typeof showSpeechBubble === 'function') …`. Deux personnages côte à côte : la bulle
  suivante se range au-dessus de l'autre (pointe allongée), jamais l'une sur l'autre ;
  personnage hors champ : bulle collée au bord de l'écran.

### Nouvelles clés de données de zone (gérées via `LEVEL_DATA_HANDLERS`)
`buildLevelFromData` appelle, pour chaque clé `k` de la donnée présente dans
`LEVEL_DATA_HANDLERS`, `LEVEL_DATA_HANDLERS[k](scene, data[k], data)` après la création du
joueur/ennemis ; et chaque frame (monde non gelé) les fonctions de `LEVEL_UPDATE_HOOKS`
`(scene, time, delta)`. Ainsi n'importe quel fichier peut ajouter une clé sans toucher LevelKit.

Conditions communes (`requires` / `forbids`) : objet `{ flagName: valeurAttendue, … }` ou
`{item: 'id'}` ; évalué par `storyCondition(cond)`.

Clés gérées par la **Fondation** :
- `zoneName: 'Forêt sombre'` — carte-titre à l'entrée (une fois par visite).
- `background: 'fond_bosquet'` — fond parallaxe (ITEM_MANIFEST) à la place de plan4_ciel ;
  `ambient: {tint: 0xRRGGBB, darkness: 0..1, vignette?}` — voile de couleur (forêt corrompue, trou sombre) ;
  `vignette` : voir « Lot Codex n°8 : intégration ».
- `xara: false` — pas de Xara dans la zone (sinon Xara présente si `storyGet('xaraMet')`).
- `npcs: [{id, x, y, anim?, facing?, talk?: dialogueId | cutsceneId, requires?, forbids?, name?, shop?}]`
  → PNJ (`scene.npcs[id]`), invite « E : parler » à portée ; `talk` lance
  `runCutscene` si l'id existe dans CUTSCENES, sinon `showDialogue`. `shop` (vague 3) :
  marchand, cf. « Secrets, récompenses, marchand, quêtes ».
- `triggers: [{id?, x, y, w, h, cutscene, once?: true, requires?, forbids?}]` — zone
  invisible qui lance une cinématique quand le joueur y entre. `once` mémorisé via flag
  `trig_<zone>_<id>`.
- `pickups: [{item, x, y, requires?, cutscene?}]` — objet ramassable (E), disparaît si déjà
  dans l'inventaire. `requires`/`forbids` relus en continu depuis la vague 3 (l'objet d'une quête
  apparaît dès qu'elle commence, sans attendre une nouvelle visite).
- `mossBlocks: [{x, y, w, h}]` — amas de mousse solide, détruit par la compétence `ours`
  (hitbox de compétence qui le touche) ; mémorisé par flag.
- `mossWalls: [{id, x, y, w, h}]` — mur de mousse ; s'ouvre si le joueur a l'objet
  `repulsif` et appuie sur E devant (petite animation de dissolution), mémorisé.
- `fall: {y, mode: 'hurt'|'respawn'|'scene', scene?, data?, shade?}` — chute dans le vide (`shade: false` :
  pas d'obscurité au fond des trous, cf. lisibilité des bords, clé `exits`).
- `script: 'id'` — `ZONE_SCRIPTS[id] = { create(scene), update(scene, time, delta) }`
  pour la logique spécifique d'une zone (boss, événements) sans écrire dans la scène
  (les fichiers Scene restent le gabarit générique de l'éditeur).
- `checkpoints: [{x, y}]` — point de réapparition (sans menu), utilisé par l'épreuve du singe.
- `exits` / `entries` — **sorties de bord** (LevelKit, retour utilisateur du 2026-11-04 : « on
  change de zone au bord d'une zone, ou par une porte »). Plus aucune sortie au milieu d'une zone
  de la démo.
  - Sortie : `{ edge: 'left'|'right'|'top'|'bottom', from, to, targetScene, data: { enterId }, hint, panneau, panneauX }`.
    `from`/`to` bornent le passage le long du bord : altitude des PIEDS pour `left`/`right` (`to` = le
    sol du passage), x pour `top`/`bottom`. Sans eux, tout le bord.
  - Le changement part quand le CORPS a entièrement franchi le bord : `body.right <= 0`, `body.left >=
    levelWidth`, `body.bottom <=` haut, `body.top >=` bas. Haut et bas = ce que la caméra peut montrer
    (`scene.__edgeLimits` : `levelTop` et `levelHeight` en zone verticale, sinon 0 et 540), pas le monde
    physique, qui va plus loin. Puis court fondu (`goToScene`).
  - Côté sans sortie (ou hors de `from`/`to`) : un mur (bornes propres au joueur, `updateEdgeOpenings` +
    `syncStoryFallBounds`). Bas sans sortie : un trou, règle `fall` inchangée. Le monde n'a plus de marge
    de 200 px à droite, sauf zone qui garde une ancienne sortie. Une sortie sans `targetScene` reste un mur.
  - Entrée : `{ id, x, y, height, edge, from, to, inset, rise, overVoid }`. `x`/`y` restent le point écrit à
    la main : cinématique (`goto`), reprise de sauvegarde, menu des chapitres, réapparition. `edge` : arrivée
    par ce bord quand on vient d'une sortie de bord (`sceneData.edgeArrival`), juste après lui (`inset`, 44 px
    par défaut ; 96 px de pieds sous le bord haut). Sans `edge` : arrivée au point écrit à la main.
  - Altitude conservée : même hauteur au-dessus du sol du passage si sortie ET entrée ont un `to`, sinon
    même altitude, le tout borné à `from`/`to` de l'entrée. Haut/bas : même proportion dans le passage (ou
    même x). Sens de marche, élan, forme (loup, singe, aigle), sauts utilisés et touches tenues suivent
    (`leaveByEdgeExit`, `applyEdgeArrivalState`).
  - Jamais dans un mur (remontée à l'air libre, sinon point écrit à la main) ni au-dessus d'un trou d'une zone
    à règle `fall` (point écrit à la main, sauf `overVoid: true`). Arrivée par le bas : bond (`rise`, 190 px par
    défaut) et poussée vers l'avant pour gagner la lèvre.
  - Pas d'aller-retour : l'arrivée est à l'intérieur, seul un nouveau franchissement complet ressort. Arrivée
    du même côté que la sortie (Racines <-> Épreuve) : bord fermé jusqu'à 120 px d'écart
    (`EDGE_REARM_DISTANCE`), la touche étant encore tenue vers lui.
  - Scripts : `scene.__exits` reste la liste vivante (retirer une sortie la referme, en ajouter une l'ouvre
    avec ses indices) ; `kainatiArena.exitsAfterVictory`, `EPREUVE_SINGE_SORTIE_SOMMET` et la sortie de la
    clairière vers la hutte sont dans ce format.
  - Rétro-compatibilité : les anciennes sorties `{ x, y, height }` (zones de test, brouillons de l'éditeur) et
    `exit` (singulier) marchent comme avant, avec `enterRatio` et `portalId`.
  - **Lisibilité des bords** (automatique, `addEdgeHints`/`syncEdgeHints`). Sortie basse : lueur chaude qui
    monte, grains qui tombent, panneau de bois à flèche (`prop-bosquet_signpost`) sur la lèvre du trou. Trou
    mortel (règle `fall`, hors sortie basse) : le bas du trou s'enfonce dans le noir, ni lueur ni panneau
    (`fall: { shade: false }` la coupe). Sortie haute : lueur. Sortie latérale : lueur seulement si le passage
    est au-dessus du sol le plus bas de ce côté. Par sortie : `hint: false` (rien), `hint: 'lueur'`, `hint:
    'panneau'` (avec `panneau: 'clé de texture'`, `panneauX`). `prop-` : tout décor chargé convient.
  - Éditeur : outil **Sortie de bord** (clic près d'un bord = tout le bord, glisser le long du bord = passage
    borné) ; bandeau orange, déplaçable et allongeable (molette) avec l'outil Modifier. L'écran « Zones » propose
    « + Nouvelle sortie : bord droit / gauche ». Le portail reste proposé pour les zones de test.
  - Passages à revoir, qui demanderaient une vraie porte : **racines <-> épreuve du singe** (la fente) : les deux
    passages sont du même côté, l'arrivée repart donc vers l'intérieur au lieu de garder le sens de marche ;
    **poche de la forêt sombre -> hutte de Morgat** : la poche ne touche aucun bord, le sentier est devenu un trou
    (sortie basse) alors que la hutte est censée être plus haut que la forêt. Le bannissement (bosquet -> forêt
    sombre) et le retour hutte -> forêt sombre restent des cinématiques (`goto`).
- Bulles non bloquantes (acte1.js, utilisables partout) : `storyBulle(scene, who, text, ms?, {replace})`, `storyBulles(scene, lignes, toast?, délai?)`, `cutsceneBulles(lignes, toast?, délai?)` (cinématique « vide » pour un déclencheur : ne gèle rien). S'appuient sur `showSpeechBubble` (StoryKit) si elle existe, sinon un toast. Une seule « conversation » de bulles à la fois par zone : un nouveau `storyBulles` annule les répliques pas encore dites du précédent (sa 1re réplique remplace la bulle en cours du même personnage) ; pendant un dialogue bloquant, la suite attend. Règle : seules les scènes importantes (rencontres, révélations, boss, objets) restent des dialogues bloquants, et courts.

Clés gérées par l'agent **Formes** (fichier `src/entities/Liane.js`, `src/entities/Piste.js`,
`src/entities/CourantAir.js`) :
- `vines: [{x, y, length}]` — lianes accrochables (forme singe). (x, y) = point d'attache
  EN HAUT, `length` en px (la liane pend vers le bas). Prévoir le bas de la liane à
  ~100-150 px au-dessus du sol (les mains sont ~58 px au-dessus des pieds). `scene.vines`.
  Événements scène : `'vine-grab'` (vine) et `'vine-release'` (vine). Sans singe actif :
  pur décor.
- `tracks: [{x, y, w}]` — pistes du loup : empreintes de x à x+w, y = ligne du sol (pieds),
  visibles seulement en forme loup (fondu). `scene.wolfTracks`.
  `hiddenPlatforms: [{gx, gy, w}]` — w cases de grille à partir de (gx, gy), invisibles et
  traversables ; révélées (tuiles autotile ajoutées à `scene.ground`, donc solides) quand le
  joueur EN FORME LOUP passe à < 200 px. Mémorisé pour la visite seulement. Événement
  `'hidden-platform-revealed'`. `scene.hiddenPlatforms`.
- `windCurrents: [{x, y, w, h, force}]` — rectangle (x, y = coin HAUT-GAUCHE), `force` =
  vitesse de montée visée en px/s (défaut 320). Agit seulement sur l'aigle qui plane
  (pas en piqué). `scene.windCurrents`.

Formes (Player.js) — état & API :
- Registre : `hasWolfForm`, `hasEagleForm`, `hasMonkeyForm`, `hasOctopusForm`,
  `airForm` ('monkey' | 'eagle' | null — **à inclure dans la sauvegarde**), `equippedForms`
  (toujours un tableau de 3, normalisé en `[sol, aérien, eau]`, ex. `['wolf','eagle',null]`).
- **Le papillon n'est qu'une compétence** (décision de l'utilisateur, 2026-10-24) : formes
  aériennes = `AIR_FORM_IDS = ['eagle', 'monkey']`. Une vieille sauvegarde où `airForm` ou une
  case d'`equippedForms` vaut `'butterfly'` est migrée au chargement par
  `migrateSaveValues(values)` (StoryKit, appelée à la lecture de la sauvegarde, `readSaveData`) puis
  `player.resolveInitialAirForm(regAir)` (même règle pour un registre posé par `?flags=`) :
  aigle s'il est débloqué, sinon singe, sinon aucune. Le flag `hasButterflyForm` d'une vieille
  sauvegarde reste au registre, ignoré.
- Débloquer une forme aérienne en cours de jeu (flag posé au registre OU sur `player`) la rend
  automatiquement active (`airForm`). Totems LevelKit et triche Ctrl+Shift+D restent
  compatibles (la triche Player ajoute `hasMonkeyForm` sans changer l'aigle).
  `storySet('airForm', 'monkey')` est aussi suivi en direct.
- `player.getActiveAirForm()`, `player.equipForm(id)`, `player.unequipForm(id)`,
  `player.vine` (liane tenue ou null), `player.form` ∈ agarica/wolf/eagle/monkey/octopus.
- Saut = **Espace seul** (-680, ~172 px ; tolérance de bord 110 ms). **Sans forme aérienne :
  UN SEUL saut** (plus de double saut de base). 2e appui en l'air : singe = -500 + forme singe
  (qui seule s'accroche aux lianes) ; aigle = -550 + plané (inchangé) — un par saut.
  **Règle à deux appuis, la même pour le singe et l'aigle** (décision de l'utilisateur du
  2026-11-05) : en chute depuis un rebord (sans avoir sauté, tolérance de bord passée), le
  1er appui en l'air est un saut humain (-680) et le 2e la transformation. Textes d'aide
  (Contrôles, feu de camp, popups de forme) alignés sur cette règle.
- **Totems de bonus verrouillés pour la démo** : `DEMO_TOTEMS_LOCKED = true` (Player.js).
  `recomputeTotemBonuses` calcule alors comme si aucun totem n'était porté, sans toucher à
  `equippedTotem` ni au registre. Depuis le 2026-11-08 (totems à équiper mis de côté tant qu'il y
  a peu de formes), le menu du feu n'a plus de section totem (`CAMPFIRE_SHOW_TOTEMS = false`,
  CampfireMenuScene ; plus de cadenas ni de chaînes) ; code et sauvegarde (`equippedTotem`,
  `TOTEM_HEADS`/`TOTEM_BODIES`) intacts. Tout rouvrir : `DEMO_TOTEMS_LOCKED = false` ET
  `CAMPFIRE_SHOW_TOTEMS = true`. Les totems du monde qui donnent une forme ne changent pas.
- Lianes : seule Agarica **devenue singe** s'y accroche (`airJumpForm === 'monkey'`) : après le
  double saut qui la transforme, ou après un lâcher de liane (il compte comme ce double saut :
  on enchaîne les lianes). Un saut simple sous une liane passe au travers, même au sommet de
  l'arc. En forme humaine/aigle/loup elles sont ignorées partout (plus de lianes-tremplins,
  arène de Kainati comprise). La prise suivant toujours un double saut (plus rapide vers le
  haut), `VINE_CLIMB_FRACTION` = 0,35 et `VINE_MIN_SWING_FRACTION` = 0,8 (Liane.js) gardent un
  balancier de 136-154 px.
  Sur une liane (2026-10-23) : Q/D (←/→) pompe le balancement, plafonné à ~55°
  (`VINE_MAX_ANGLE` ; la pompe s'arrête et la vitesse est plafonnée à ce qui ramène à
  cet angle) ; Z/↑ monte et S/↓ descend le long de la liane (`VINE_CLIMB_MANUAL_SPEED`
  140 px/s, de `VINE_CLIMB_TOP_R` = 28 px sous l'attache jusqu'au bout) ; S tout en bas
  = se laisser tomber ; Espace = lâcher avec l'élan = LE saut du singe : compte comme le
  double saut (`jumpsUsed = 2`), plus aucun saut avant le sol ou la prochaine liane
  (l'accroche recharge). Aucune attaque sur une liane (K/clic ignorés).
  Lâcher plus puissant : vitesse horizontale du balancement × 1,45 (`VINE_RELEASE_SPEED_MULT`),
  au moins 300 px/s (`VINE_RELEASE_MIN_VX`, sens = balancement, sinon touche tenue, sinon
  regard), plafond 760 (`VINE_MAX_CARRY_SPEED`), + -330 vers le haut ; puis vol « plané »
  (`player.vineFlight`) jusqu'au sol/à la liane suivante : gravité normale sans le surplus
  de chute, frein aérien 60 (`VINE_FLIGHT_DRAG`). Mesuré (liane de 240 px, balancement
  plein) : ~460 px parcourus en revenant à la hauteur du lâcher, ~590 px 100 px plus bas
  (avant ≈ 250 / 330 px). Grimpe : anim `climb` du manifest `singe_extra` (lot Codex n°8 ;
  repli `singe` climb) si l'art existe
  (frame choisie selon la distance parcourue, une prise tous les 18 px, descente = mêmes
  prises), sinon frames de `liane_hang` au même rythme + traction de 3 px.
  Pose (lot n°8) : la distance grimpée et l'heure du dernier mouvement des mains
  (`vineClimbMovedAt`) sont relevées au pas de physique (`stepVinePhysics`) ; la grimpe
  s'affiche si Z/S est tenu et que les mains ont bougé depuis moins de
  `VINE_CLIMB_POSE_HOLD_MS` (50 ms), sinon la pose suspendue (`player.playVineHangAnim()` la
  relance si son anim est arrêtée) -- plus d'alternance de deux poses au-delà de 60 i/s.
  Dessin (Liane.js) : le haut de la liane entre de `VINE_TOP_TUCK` (12 px) dans le bloc
  au-dessus, mesuré sur ses pixels par `vineBlockAbove(scene, x, y)` (repli : boîte de
  l'image) ; liane derrière le sol de premier plan (`sendBehindFrontGround`). Attache physique,
  longueur utile, pendule, prise et grimpe inchangées.
- Combat (humaine + singe) : Z/↑ = viser haut, S/↓ = viser bas (en l'air seulement),
  K/clic = coup dans la direction visée (sinon devant). `player.getAttackHitbox()` renvoie le
  rectangle de l'ARC AFFICHÉ (art `vfx_slash`) pendant ses images actives seulement, null
  sinon ; jeton d'un coup = `attackEndTime`. Coup vers le bas qui touche (ennemi, amas de
  mousse, Kainati/ses pierres, ou objet de `scene.pogoTargets` : getBounds()/Rectangle)
  = rebond -600 (événement scène `'player-pogo'`). **Loup : coup de croc** (K/clic,
  `slashDir = 'bite'`, plus de ruée : le corps du loup ne blesse plus). Même logique que la
  dague : zone = crocs affichés (art `vfx_croc`, largeur visible calée sur 64 px, sinon
  mâchoires dessinées `drawBiteJaws`), mêmes jetons de coup et retour sur obstacle ; 280 ms
  (56 d'élan, 112 actives, 112 de retour), zone de +28 à +92 px devant les pieds
  (`SLASH_ARCS.bite`), vitesse au sol × 0,8 pendant le coup (en l'air : inchangée). Le loup
  reste affiché jusqu'au bout du coup ; une autre forme le coupe. Affiché à `WOLF_BITE_SCALE`
  (0,304 : la feuille d'attaque est dessinée 1,31 fois plus longue que la course), hitbox
  inchangée (`WOLF_BITE_BODY` = même boîte monde que la course).
- Événement scène `'player-depleted'` (player) au dernier cœur perdu (fiable même au tout
  premier `set('hearts')`, qui n'émet pas `changedata-hearts`).

Ennemis : `ENEMY_REGISTRY[type] = (scene, e) => instance` (Fondation migre les types
existants : araignee, loup, loupAlpha, corbeau, crapaud). Chaque fichier d'entité s'enregistre
lui-même en bas de fichier. Combat : si `enemy.takeHit` existe, LevelKit appelle
`enemy.takeHit(source)` (une seule fois par attaque/compétence grâce à un verrou par
attaque) sinon `enemy.defeat()`. Zone frappable par la mêlée (dague, croc) et le rebond :
`enemy.getMeleeBounds()` s'il existe, sinon `enemy.getBounds()` — à fournir quand l'image est
bien plus grande que l'ennemi (crapaud : son corps physique, étiré avec la langue, au lieu du
canevas de 373 px ; crapauds corrompus : le corps seul, la langue a son propre test). Ennemis corrompus : `enemy.corrupted = true` et
`enemy.heal()` (appelée par la compétence `papillon`). `enemy.harmless`, `enemy.noGravity`.

Types d'ennemis enregistrés (agent **Ennemis**), entrée `enemies: [{type, x, y, …}]` :

| type | Classe (fichier) | Paramètres de donnée | PV / notes |
|---|---|---|---|
| `loup` | LoupSanguinaire | `patrolMinX`/`patrolMaxX` (déf. x±150) | 1 ; patrouille, charge si joueur à <220 px. Art `loup_sanguinaire` (patrol/charge/bite) |
| `araignee` | Araignee | — | 1 ; fixe, `harmless`, `noGravity`. Art `araignee` (idle/attack ; walk inutilisé) |
| `loupAlpha` | LoupAlpha | `patrolMinX`/`patrolMaxX` (déf. x±150) | 3 (`takeHit`, `maxHp`), boss Zone5 |
| `corbeau` | Corbeau | `patrolMinX`/`patrolMaxX` (déf. x±150), `diveDepth` (déf. 220), `diveSpeed`, `diveCooldown`, `diveGroundedOnly` (piqué sur une Agarica posée seulement) | 1 ; `noGravity`, piqué quand le joueur passe dessous ; remonte aussi s'il touche le sol avant `diveDepth` |
| `crapaud` | Crapaud | — | 1 ; fixe, langue vers la droite |
| `mousse_creature` | MousseCreature | `patrolMinX`/`patrolMaxX` (déf. x±150 via LevelKit, ne les dépasse pas), `hp` (déf. 1) | corrompu ; rampe vers le joueur (<260 px), se tasse 0,4 s puis bondit. Art `mousse_creature` (idle/attack/death) |
| `singe_corrompu` | SingeCorrompu | `patrolMinX`/`patrolMaxX` (déf. x±150 via LevelKit), `hp` (déf. 2) | corrompu ; garde ses distances (170-360 px), lève une pierre 0,5 s puis la lance en cloche (`player.hitByEnemy()`, brisée au sol). Art `singe_corrompu` (idle/run/throw) |
| `crapaud_sauteur` | CrapaudSauteur (CrapaudCorrompu.js) | `patrolMinX`/`patrolMaxX` (déf. x±150 via LevelKit), `hp` (déf. 2), `facing` (`'left'` déf. / `'right'`), `reach` (portée de langue, déf. 220) | corrompu ; échelle 0,24. Se tourne vers Agarica (aggro 380 px, 240 au-dessus) ; petite machine à états : langue (télégraphe 0,42 s : gorge gonflée, lueur, 3 points de visée ; visée figée ; langue 0,45 s, de -75° à +25°, bloquée par les solides ; puis 0,65 s bouche ouverte) OU saut (accroupi 0,32 s puis bond ≤ 200 px : se rapproche, recule si < 70 px, saute sur elle entre 90 et 210 px). Alterne langue / saut. Reste dans ses bornes ET sur un sol continu au même niveau (± 24 px, sondé sous tout le trajet) : jamais dans un trou ni sur une marche |
| `crapaud_piege` | CrapaudPiege (CrapaudPiege.js) | `hp` (déf. 2), `facing`, `reach` (déf. 220) | corrompu ; échelle 0,30, teinte pierre + coussin de mousse dessiné par code. Caché (enfoncé, rogné sous le sol) ; sort (0,22 s) quand la langue peut atteindre Agarica, vise (0,36 s), langue, exposé 0,9 s, se recache (0,32 s), réarmé 0,9 s après. `harmless` (ne blesse qu'avec la langue) ; frappable caché (dos + mousse) : frappé, il sort |
| `crapaud_corrompu` | alias de `crapaud_sauteur` (depuis le 2026-11-08) | idem | l'ancien crapaud fixe à langue droite ; ses placements utilisent les bornes par défaut x±150 |

Crapauds corrompus (CrapaudCorrompu.js, base commune) : corps et langue SÉPARÉS. Le corps est
le cadre `corps` (300 px de gauche) découpé à l'exécution dans les planches 1434x237 existantes
(`crapaud_corrompu-*`, repli `crapaud-*` teinté), origine au centre des pattes (flipX = demi-tour) ;
la langue est une image à part (cadre `langue` = langue de l'apogée), ancrée à la bouche,
tournée vers la cible, sortie par rognage glissant. Dégâts de la langue : segment bouche → bout
(+ boule) contre le corps d'Agarica, testé par l'ennemi (`player.hitByEnemy()`) ; une mêlée qui
croise la langue frappe le crapaud (`damageEnemy`, même jeton que `tryPlayerMeleeHit`) et la
renvoie. `getMeleeBounds()` = le corps (piège caché : la partie hors du sol). `calm(ms)` (sortie de
dialogue, cf. `storyUnfrozenTick`) : télégraphe annulé, langue rentrée, rien avant `ms`. Soin : crapaud sain
orange (cadre `corps` de `crapaud-0`), reposé au sol s'il était en l'air. Art du prompt Codex
n°12 (`crapaud_sauteur`, `crapaud_piege`, `crapaud_langue`, clé `mouth` du manifeste) utilisé
dès qu'il existe.

Ennemis corrompus : `takeHit(source)` → -1 PV, flash blanc, recul (0 → `defeat()`).
`heal()` → purification : flash, particules lumineuses, apparence saine, petit saut puis
fuite paisible et disparition ; pose `healed = true` ET `defeated = true` (LevelKit cesse
update/contacts) — **ne compte pas comme tué** (tester `enemy.healed`). Événement scène
`'enemy-healed'` (enemy). Helpers globaux (MousseCreature.js) : `spawnLightParticles(scene, x,
y, opts)`, `spawnToxicDrip`, `corruptedTakeHit`, `purifyCorruptedEnemy(enemy, {onClean,
fleeDistance})`, `ensureGlowDotTexture` (`FX_GLOW_DOT_KEY`). Placeholder dessiné par code
tant que l'art du manifest manque (`applyEnemyManifestArt` garde la hitbox du placeholder).

Clé `animals` (agent **Ennemis**, `src/entities/Animaux.js`) — décor sans physique ni dégâts :
`animals: [{type: 'cochons', x, y, w?: 180}, {type: 'poissons', x, y, w?: 200, h?: 60},
{type: 'papillons', x, y, count?: 6, w?: 80}]`. Cochons : TOUJOURS 3 bébés (x, y = point au
sol), trottinent dans ±w/2, sautent et s'écartent quand Agarica approche ; un de chaque
couleur (art `cochon_bebe_rose`, `cochon_bebe_gris`, `cochon_bebe_orange`, repli `cochon_bebe`). Poissons : TOUJOURS 3,
dans le rectangle d'eau (x, y = coin haut-gauche, comme `water`). Résultat dans
`scene.animals = {cochons, poissons, papillons}`. Art optionnel `cochon_bebe` (idle/walk),
`poisson` (idle), `papillon` (idle). API papillons pour cinématiques :
`spawnButterflies(scene, x, y, count = 6, {radius, colors, depth, follow, scale}) → array`,
`butterfliesFlyTo(list, x, y, ms = 1500) → Promise`, `butterfliesFollow(list, target,
{offsetY, radius})`, `butterfliesDisperse(list, ms) → Promise`. Animés même monde gelé.

### Précisions de la Fondation (implémenté, rétro-compatible)
- **Assets** : seuls les fichiers listés dans `ASSET_PRESENT` (`src/data/asset_present.js`,
  régénéré à la fin de `tools/import_codex_assets.py`, ou `--present-only`) sont chargés.
  Après import d'art : relancer le script, sinon l'art n'est pas chargé.
  `addItemIcon(scene, x, y, id, size)` = `addItemImage` ajusté dans un carré.
- **Zones de l'histoire** : `DEMO_ZONES` (zone, scene, region, name), `STORY_REGIONS`,
  `LEGACY_TEST_ZONES`, `storyZoneEntry(sceneOrKeyOrZoneId)`, `isStoryScene(scene)`,
  `storyZoneId(scene)` (id utilisé dans les flags ; `data.zoneId` le force).
- **Règle Xara** (`shouldSpawnXara`) : `data.xara === false` → jamais ; zone hors
  `DEMO_ZONES` (anciennes zones, playtest éditeur) → toujours ; zone de l'histoire →
  seulement si `storyGet('xaraMet')`. Étape de cinématique `{xaraJoin: true}` : pose
  `xaraMet` et crée le vrai compagnon (à la place du PNJ `xara` s'il existe).
- **Sauvegarde** : TOUTE valeur JSON du registre (clé ne commençant pas par `__`) est
  sauvegardée. `storySet` sauvegarde aussitôt. Entrée d'une zone de l'histoire : flags
  `visited_<zone>`, `lastZone` (id de zone), `lastEnterId`, puis sauvegarde silencieuse.
  Feu de camp (zones de l'histoire seulement) : sauvegarde quand Agarica s'assoit et à la
  fermeture du menu. Les zones de test ne sauvegardent jamais d'elles-mêmes. `hasSaveGame()` exige
  `lastZone`. `storySet({a: 1, b: 2})` accepté.
- **Conditions** : `requires` = toutes les clés vraies ; `forbids` = interdit dès qu'UNE clé
  est vraie. Clés spéciales `item` / `noItem` (id ou tableau). `true`/`false` testent la
  véracité du flag, toute autre valeur est comparée strictement.
- **Dialogues** : ligne `{who, text, name?, portrait?, choices?}` ; une chaîne seule =
  narrateur. Choix `{text, goto?, set?}` : `goto` = index de ligne, id de DIALOGUES ou
  `'end'` ; `set` = flags posés. `showDialogue` résout `{lastChoice, choices}`. Monde gelé,
  et les touches (Espace/E/clic) sont « relâchées » à la fermeture (pas de saut fantôme).
- **Cinématiques** : étapes supplémentaires `{toast: 'texte'}`, `{xaraJoin: true}` ;
  `{npcFace: {npc, dir: 'player'}}` ; une étape peut aussi être une fonction. `goto` accepte
  un id de zone ou une clé de scène. La caméra déplacée est rendue au joueur en fin de
  cinématique. `npcAdd` sans `y` → posé sur le sol.
- **PNJ** (`npcs`) : `key` optionnel (clé dans `scene.npcs`, défaut `id`) pour plusieurs
  PNJ du même sprite ; `sprite` optionnel ; `y` absent → sol ; `talk` = id (CUTSCENES
  prioritaire, sinon DIALOGUES), tableau conditionnel `[{requires, forbids, talk}]`, ou
  fonction `(scene, npc) => talk`. `lookAtPlayer: false` pour un PNJ immobile.
  Placeholder jamais retourné (étiquette lisible).
- **Rectangles** (`triggers`, `mossBlocks`, `mossWalls`) : `x`, `y` = CENTRE ; `y`/`h` absents
  pour un trigger → colonne pleine hauteur ; `y` absent pour la mousse → posée sur le sol.
  Triggers : `once: false` → rejouable à chaque entrée. `triggers[i].id` défaut = index.
  Flags : `trig_<zone>_<id>`, `pickup_<zone>_<item>`, `moss_<zone>_<id|i>`,
  `mosswall_<zone>_<id|i>`. Événement scène `moss-destroyed`.
- **fall** : `mode: 'hurt'` → retour au dernier appui sûr + 1 cœur ; `'respawn'` → dernier
  checkpoint (sans dégât) ; `'scene'` → `goToScene(scene || id de zone, data)`.
  **Chute dans le vide (2026-10-24)** : tant que la zone a une règle `fall`, le bas du monde
  n'est plus un sol invisible (`syncStoryFallBounds`). Ligne de chute franchie → chute engagée
  (`Player.startFallOut` : monde gelé, plus de contrôle ni de collision, vitesse de chute ≥
  `FALL_OUT_MIN_VY`), Agarica sort par le bas de l'écran, fondu au noir, reprise du mode
  ci-dessus, fondu d'ouverture (`updateStoryFall`, StoryKit). Point sûr = toute la largeur des
  pieds sur un corps statique, pris loin du bord ; Xara regroupée à côté d'Agarica à la reprise ;
  une mort en l'air au-dessus du vide passe par la chute. Seuils et règles de reprise inchangés.
  **checkpoints** : redéfinit aussi le point de réapparition à la mort (`player.spawnX/Y`).
- **Ordre des handlers** : clés de la donnée dans l'ordre, `script` toujours en dernier ;
  chaque handler est protégé par try/catch (console.error). `script.update` ne tourne que
  monde non gelé.
- **Combat** : `damageEnemy(scene, enemy, source)` global (à utiliser par les projectiles :
  `source.token` unique par tir) ; compétence `papillon` (ou `SKILL_DEFS[id].heals`) →
  `enemy.heal(source)` sur les ennemis `corrupted` seulement. Événement scène
  `'player-skill'` `{skillId, rect, token}` émis une fois par activation (pour les boss hors
  du groupe `enemies`). Pendant un gel : vitesses horizontales joueur/ennemis remises à 0.
- **Formes** : `unlockFormFromStory(scene, flag)` utilise `player.equipForm(type)` s'il
  existe, sinon 1er emplacement libre. `TOTEM_TYPE_BY_FLAG.hasMonkeyForm = 'monkey'`
  (totem `item-totem_monkey_*` si présent).
- **UI** : `showTitleCard(scene, title, sub) → Promise`, `showStoryBanner`, `drawStoryPanel`,
  `STORY_UI` (palette), `openInventory(scene)`, `openMap(scene)`, `releaseStoryInput(scene)`.
  `addStoryVineFrame(scene, x, y, w, h, {scale = 0.3, container}) → {container, inner} | null` :
  cadre Codex `dialogue_box` (lianes + champignons) à n'importe quelle taille SANS étirement
  (moitiés en miroir), (x, y, w, h) = bords extérieurs des lianes, `inner` = planches (zone de
  texte) ; null sans l'art (alors `drawStoryPanel`). Utilisé par DialogueScene (boîte + choix).
  `SPEAKERS[who].portrait` / `.portraitTint` : portrait Codex d'un autre id (esprit de Kainati).
  HUD : `storyDrawHudArt(scene)` (appelée par `drawHud`, LevelKit) pose les cœurs `hud_coeur*`
  et les icônes `skill_icone_*` en images ; `drawHud` ne dessine plus que le repli.
  `note_geralt` a son art depuis le lot n°8 (réextrait du brut) : l'icône dessinée par code
  (`STORY_DRAWN_ITEMS`) ne sert plus que de repli.
- **Clé de zone `tileset: 'tuiles_ecorce'`** (TILESET_MANIFEST) : cases chargées sous
  `<id>:<clé>`. Jeu complet → rendu `'blob'` (images remontées de
  `AUTOTILE_BLOB_VISUAL_LIFT` : même ligne de marche que le jeu par défaut) ; jeu
  incomplet → jeu par défaut. Jeux proposés : racines / arène de Kainati / épreuve /
  monde spirituel / forêt flottante 1 = `tuiles_ecorce` ; forêt flottante 2, clairière,
  hutte = `tuiles_flottantes` ; forêt corrompue, Ghil't, trou sombre = `tuiles_corrompues`.
- **Profondeurs** : `CHARACTER_DEPTH` (10) pour les personnages ; les ennemis du groupe
  `scene.enemies` la reçoivent à l'ajout (même ajoutés par un script) ; props, totems et
  feux restent à 0 ; plantes de premier plan à `DECOR_FOREGROUND_DEPTH`.
- **Décors (props)** : `DECOR_SECTIONS` (LevelKit) = sections du menu de l'éditeur
  (bosquet, foret_sombre, grand_arbre, grand_arbre_tronc, foret_flottante,
  foret_corrompue, hutte_morgat) ; planches Codex découpées et nommées par
  `python tools/crop_deco_items.py --named`, base de l'image au ras du bas. Depuis le lot n°8,
  plus les sections du manifeste `decor`, `objet`, `rocher` (voir « Lot Codex n°8 : intégration »).
- **Dev** : `index.html?zone=foret_sombre_1&flags=xaraMet,hearts=2[&load][&enter=id]`.

### Placement au sol (2026-10-22, rétro-compatible)
- **Surface de marche** = haut de la hitbox des tuiles (`GROUND_STAND_SINK` sous le haut
  de la case : 0 avec le jeu 'tuiles' actif, 16 avec l'ancien 'floor' ; ne jamais écrire
  464 ou « + 16 » en dur) : pieds d'Agarica, des PNJ, des animaux, bas des props, feux de
  camp, totems. Le dessous d'une case sans voisin au sud est raccourci de
  `AUTOTILE_UNDERSIDE_TRIM` (16) : hauteurs libres sous plafonds/plateformes inchangées. `groundSurfaceYAt` / `groundStandYAt` / `storyStandY` n'utilisent plus
  que les tuiles à découvert (`openGroundTilesAt(scene, x)`) : la case cachée sous une
  marche n'est plus jamais choisie.
- **Pixels visibles** (LevelKit) : `propTopYAt(scene, x, type?)` (haut visible du prop
  sous x ; props gardés dans `scene.props`, `img.propType`), `visibleTopYAt(obj, x)`,
  `visibleBottomY(obj)`, `setVisibleBottomY(obj, y)`. Lecture alpha mise en cache ;
  en `file://` (canvas tainted) repli sur le cadre de l'image.
- **PNJ** : `npcs[i].onProp: true | 'type_de_prop'` → pieds sur le DESSUS du décor sous
  l'emprise de ses pieds (cf. `propSurfaceYUnder`, « Calibrage visuel ») ; prioritaire sur
  `y`. L'éditeur en tient compte. `storyPlaceOnProp(scene, obj, x, propType, fallbackY)`
  pose un objet sur un décor (idole sur l'autel `bosquet_antler_totem`).
- **Déplacements** : `npcMove` fait suivre le relief aux pieds du PNJ
  (`storyFollowGround(scene, obj, dt, {dir, speed, footOffset, snap})` : marche montée
  dès que l'avant des pieds la touche, descendue quand le centre la dépasse, ~0,1 s par
  case ; marche > `STORY_MAX_STEP` = autre couche). `playerMove` saute les marches qui
  le bloquent. Bébés cochons : posés sur la surface et suivent le relief.
- **Props du bosquet** : `bosquet_grove` (3 arbres, les 2 petits flottaient) découpé par
  `tools/split_grove.py` en `bosquet_grand_arbre`, `bosquet_arbre`, `bosquet_arbre_2`
  (à utiliser) ; `bosquet_grove` reste déclaré pour les anciens brouillons.
  `foret_sombre_arbre_moussu` est RETIRÉ (refusé, hors DA) : plus chargé ni proposé ; un
  décor dont la texture n'existe pas est ignoré sans erreur (jeu et éditeur).

### Calibrage visuel (2026-10-23, rétro-compatible)
Les planches (Codex, découpes) gardent des marges transparentes variables (4-9 px sous les
pieds, plus sur certains décors) et ne sont pas dessinées à la même échelle d'une image source
à l'autre. Tout ce qui se pose au sol et toute échelle de pose passe par les PIXELS VISIBLES
(alpha > `VISIBLE_ALPHA_MIN` = 40), mesurés une fois par frame et mis en cache (LevelKit).
Pixels illisibles (`file://`) : repli sur le cadre (`exact: false`), le jeu reste jouable.
- `visibleBounds(scene, key, frame?)` / `frameVisibleBounds(frame)` → `{ x0, y0, x1, y1, w, h,
  frameW, frameH, marginL, marginR, marginT, marginB, area, baseX0, baseX1, topW, exact }`
  (px de la frame ; `base*` = colonnes des rangées du bas = pieds/socle ; placeholders mesurés
  pareil). `objectVisibleBox(obj)` = boîte MONDE (origine, échelle, miroirs ; sans rotation).
  `visibleBottomY` / `setVisibleBottomY` / `visibleTopYAt` / `propTopYAt` inchangés.
- **Ancrage par le bas visible** : `placeOnGround(scene, obj, x, { refY, onProp, sink })` pose
  le bas visible sur `groundStandYAt` (ou sur un décor). `GROUND_CONTACT_SINK` (1 px) : les
  DÉCORS (props, feux, totems via `totemSink`) descendent d'1 px sous la ligne (le dernier rang
  d'une image réduite est à demi transparent) ; les personnages ont le bas visible pile sur la ligne.
- `anchorVisibleFeet(sprite, { body })` : pour un sprite d'origine (x, 1), `y` = bas visible des
  pieds pour TOUTE frame (marge stable = la plus petite de l'anim en cours : pas de tressautement).
  `body: true` : le bas du corps physique est recalé dessus à chaque image (POST_UPDATE,
  `syncBodyToVisibleFeet`) → au sol, bas du corps = `y` = bas visible. Appliqué : joueur, Xara,
  `addManifestSprite` (tout sprite du manifest ancré en bas : PNJ, cochons, Kainati, VFX au sol),
  feux de camp (flamme animée), totems, Ghil't, loup alpha. Ennemis à origine centrée
  (`applyEnemyManifestArt`, ancrage 'bottom') : corps décalé de `manifestFootMargin(scene, id)`
  (plus petite marge sous les pieds de l'entrée, constante).
- **Sur un décor** : `propSurfaceYUnder(scene, obj, type?, x?)` = 3e quartile du profil du haut
  visible du décor sous les colonnes des pieds de `obj` : le plateau d'une souche/d'un autel
  dessiné en perspective, pas son bord arrière (Xara « volait » au-dessus de sa souche).
- **Taille homogène des poses** : `calibratedScale(scene, frameKeys, { refKey, refScale, maxScale,
  method: 'auto'|'height'|'area', standing })` → `{ scale, method }` | null. UNE échelle par
  IMAGE SOURCE (toutes ses rangées sont dessinées à la même échelle) : (1) frames « debout
  neutres » (tête en haut, rapport largeur/hauteur ≤ celui de la référence + 0,2, hauteur ≥ 90 %
  de la plus haute) → hauteur visible médiane alignée sur la référence ; (2) sinon (fentes,
  sauts, couchée) ou `method: 'area'` → surface visible (√ nb de px) alignée.
  `manifestSheetScale(scene, id, anim, opts)` (StoryKit) regroupe les rangées par feuille via
  `sheets: [{file, rows}]` du manifest. Agarica (`agaricaSheetScale` / `agaricaSheetPoseConfig`,
  Player.js ; référence `agarica-idle-0` à `HUMAN_SCALE`) : `agarica_slash` (surface → 0,273 au
  lieu de 0,335 ; arc `vfx_slash` à la même échelle, positions `SLASH_ARCS` × échelle/0,335, la
  zone qui touche reste l'arc visible), `agarica_extra` par feuille (p1 sauts/hurt 0,314 ;
  p2 death/talk/sad 0,292 ; p3 lianes/cast 0,353 ; p4 receive_item 0,252), `transfo_singe`,
  `transfo_papillon`, `singe` et `forme_papillon` (`method: 'area'`). Debout : hauteur visible =
  83 px ± 1,5 pour toutes les poses debout ; une fente reste plus basse (genoux pliés), à tête égale.
  PNJ humanoïdes à plusieurs feuilles (`MANIFEST_SHEET_CALIBRATED` : Geralt, Amanite) :
  `playManifest(anim)` applique le facteur de la feuille de l'anim par rapport à celle de l'idle
  (`manifestSheetFactor`, multiplicatif : l'échelle réglée par l'appelant est gardée) -- Geralt
  ne grandit plus de 18 % en marchant. Bêtes (Ghil't, Kainati) : feuilles cohérentes, non calibrées.
- Contrôle (2026-10-23) : audit de placement (bas visible / surface de marche, 20 scénarios,
  ~430 objets : décors, feux, totems, PNJ, Xara, cochons, ennemis, joueur, empreintes) →
  0 écart > 2 px hors exceptions volontaires (en l'air, suspendus, objets ramassables qui
  flottent) ; PNJ en marche et cochons sur relief ≤ 1,7 px hors marches. Hauteurs affichées :
  idle 83 px, talk 83-84, receive_item 83-85, death de 71 (à genoux) à 35 (couchée), slash
  à surface égale à l'idle (√px 48-49 contre 47).

### Fonds, liquide et caméra verticale (2026-10-23, rétro-compatible)
Clés de zone toutes optionnelles (LevelKit) ; sans elles, rendu et caméra historiques.
- **Ligne de base des fonds** : `backgroundBaseline: y` (monde) ou `background: { id,
  baseline, groundLine }` (la forme chaîne `background: 'fond_x'` reste valable ; préférer
  `backgroundBaseline` si la scène réécrit `background`, cf. ForetFlottante1/2Scene.js). Le BAS
  VISIBLE des arbres du fond (forêt procédurale) est posé sur `y` (2 px dessous) et la ligne
  de sol de l'image de fond (`groundLine`, fraction de sa hauteur, défaut 1 = bord bas ; aussi
  lue dans l'entrée ITEM_MANIFEST) tombe sur `y` quand la caméra est au plus bas.
  `zoneBackgroundId(data)` / `zoneBackdropSpec(data)` normalisent.
- **Bande de liquide / brume** : `liquidFloor: { y, style: 'mousse'|'eau'|'brume', color?,
  x1?, x2?, image?, height?, front? }` — nappe de `y` jusque sous le monde, DEVANT les fonds
  (masque le bas des arbres), derrière le sol et les personnages (`front: true` : devant
  eux). Image du manifest : `image`, sinon celle du style (mousse : `liquide_mousse_toxique` ;
  eau : `liquide_mare_fond` + voile avant `liquide_mare_voile` (alpha 0,28) + ligne de surface
  animée `liquide_mare_surface_0..3` à 8 i/s ; brume : `couche_nappe_brume`, `front: true` →
  `couche_brume_avant`) — bande tuilable en tileSprite à l'échelle du manifest (ou
  `height` px), crête calée sur `y`, couleur du bas prolongée dessous ; sinon rendu par code
  (mousse = celui de l'épreuve : nappe, surface bosselée, points lumineux). Bulles : VFX
  `vfx_mousse_toxique` (`bulle`) si l'art existe, sinon cercles. Visuel seul : la chute
  reste `fall`. `scene.liquidFloor`. Calage des images (lot n°8, `LIQUID_IMAGE_ANCHOR_ROW`) :
  mousse toxique = sa crête médiane (rangée 82) sur `y` ; brume = sa rangée la plus dense
  (rangée 80) sur `y`, teintée de `color` (sarcelle au monde spirituel), sans rectangle de fond
  dessous ; eau = ligne de surface sur le liseré du fond. La brume de premier plan
  (`front: true`, `couche_brume_avant`) n'est posée nulle part (H2 écartée : invisible pendant
  la montée de la forêt flottante 1, elle masquerait le sol en tombant) ; pas de `frontY`.
- **Bords du fond lointain** : dès que la caméra défile verticalement (`tallLevel`,
  `camera.vertical`) ou avec une ligne de base, l'image de fond est prolongée en haut et en
  bas par sa propre couleur de bord (plus de bande vide en haut de l'écran en montant).
- **Monde plus haut** : `levelTop: -1600` (défaut -400 ; jamais plus bas) — marge du monde
  au-dessus de y=0 (physique, caméra, éditeur).
- **Caméra de zone** : `camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7,
  lerp: 0.08 | smoothTime: 0.24, lookAhead: 60, lookAheadX: 0 }`. Horizontal inchangé
  (centré). Vertical : zone morte (ne monte que si le buste d'Agarica passe au-dessus de 35 %
  du cadre, ne redescend que sous 70 %), ressort amorti sans dépassement (accélère puis
  freine, `lerp` 0,08 ≈ 0,21 s), regard de `lookAhead` px dans le sens d'une montée/chute
  rapide, bornes = monde (`levelTop` → `levelHeight`). Un saut normal (172 px) tient dans la
  zone morte : pas de tremblement. Cinématiques : `{camera}` détache, `{cameraFollow}` /
  fin de cinématique rendent la main via `cameraFollowPlayer(scene)` (LevelKit).
- **Ciel qui se révèle** : `skyReveal: true | { start: 0.1, end: 0.85, low: [haut, bas],
  high: [haut, bas], shade: 0.55, clouds: 7, rays: true, leaves: true, flashAt: 0.55,
  treesScrollY: 0.6, farScrollY: 0.08 }` (fractions de la course verticale de la caméra).
  La forêt du fond est posée en bas du monde (ligne de base, défilement vertical 0,6 :
  `treesAtScreenBottom` est alors ignoré) et descend quand on monte ; derrière apparaissent
  le fond lointain puis un dégradé de ciel fixé à l'écran (sombre/forêt → jour), voile de
  sous-bois qui s'efface, nuages en parallaxe lente, rayons de soleil additifs, feuilles qui
  tombent dans la canopée, éclat doux à la sortie de la canopée (`flashAt`). Images du
  manifest utilisées si présentes (lot Codex n°8, anciens noms en repli) : ciel `couche_ciel_jour`
  (couvre l'écran sans déformation), nuages `couche_nuage_0..4` (répartis sur la plage de ciel
  réellement visible, un par ~260 px, au plus `clouds` : 5 en forêt flottante 1 et 2, chaque
  image une fois ; `couche_nuage_4` rogné de 44 px à gauche), soleil `couche_soleil` (additif,
  fixé à l'écran), nappes `couche_nappe_nuages` (2 copies en parallaxe, alpha en cloche autour de
  la sortie de la canopée) ; sinon rendu par code. Fond peint qui a déjà son soleil
  (`BACKGROUNDS_WITH_SUN`, ex. `fond_foret_flottante`) : pas de second soleil (`rays: false`).
  À utiliser avec `camera.vertical`. `scene.__sky.progress` (0 → 1).
- Valeurs conseillées : forêt flottante 1 `levelTop` selon l'ascension (ex. -1300),
  `camera: { vertical: true, deadzoneTop: 0.35, deadzoneBottom: 0.7, lerp: 0.08, lookAhead: 60 }`,
  `skyReveal: { start: 0.1, end: 0.85 }` ; forêt flottante 2 (déjà au-dessus de la canopée),
  si elle monte : même `camera`, `skyReveal: { start: -1, end: 0, leaves: false }` (plein
  jour) ; épreuve du singe `backgroundBaseline: 492`, `liquidFloor: { y: 476, style: 'mousse' }`
  (remplace `epreuveDrawToxicMoss`).

### Juice — « game feel » (2026-10-23, rétro-compatible)
Effets PUREMENT visuels, regroupés en fin de `src/utils/LevelKit.js` (section « JUICE ») : aucun
ne change une hitbox, une vitesse, un timing de combat (horloge de scène) ni la durée d'une
cinématique. Images du lot Codex n°8 utilisées dès qu'elles existent (`fx_*`, `fx_halo_*`,
`vfx_anneau_choc`), sinon petites textures dessinées par code (`juice-*`, blanches, teintées).
- **Particules** : `spawnFx(scene, kind, x, y, opts)` — un émetteur Phaser réutilisé par recette
  et par visite (`FX_PARTICLES`, 160 particules vivantes max par émetteur, aucune création en
  continu). Effets composés : `land {power 0..1}`, `step {dir, power}`, `turn {dir}`, `impact
  {power, angle}`, `wallHit {dir}`, `poof {size}`, `leaves`, `feathers`, `transform {color, size}`,
  `slam {size}`, `embers`, `crackle`, `mossBreak {w, h}`, `melt {w, h}`, `pickup {color}`, `glint`,
  `motes {count, color, spread}`, `heal`, `wingDust`, `streaks {dir}` ; ou une recette brute
  (`dust`, `smoke`, `spark`, `star`, `mote`, `leaf`, `feather`, `chip`, `clod`, `earth`, `ember`,
  `drop`, `bubble`, `streak`, `petal`, `wing`, `uiShard`, `uiStar` — `ui*` fixées à l'écran) avec
  `opts` `{count, angle: [min, max] (degrés), speed: [min, max] | power, lifespan, tint, spread}`.
  Les images Codex déjà colorées ne sont pas teintées (sauf `fx_grain_lumiere`, `fx_bulle`).
  **Depuis Moteur 3 (2026-10-24)**, la teinte, l'angle, la vitesse (`speed` / `power`) et la
  durée de vie demandés par l'appelant sont vraiment appliqués à chaque émission :
  `juiceEmitterOp(e, name, value)` recharge l'opérateur de l'émetteur (`loadConfig`) -- les
  raccourcis de Phaser 3.80 ignoraient une valeur en tableau ou `{min, max}`. Une teinte
  demandée sur une recette dont l'art est déjà coloré émet avec la texture de repli blanche de
  la même recette (sinon rouge × vert ≈ noir). Lot n°8 : `artSize` par recette = taille quand
  l'image Codex est affichée (braise 11, grain et lueur 19, papillon 16 ; le repli garde sa
  taille) ; `spark` = traînée dessinée teintable, `dust` = poussière lavande dessinée (R10) ;
  recette `purif` (`fx_etincelle`), émise à chaque purification.
  Image unique : `juiceBurstImage(scene, 'glow'|'ring'|'rays'|'item', x, y, {size, color, ms, flat,
  ui})` (halo peint agrandi de `JUICE_HALO_ART_BOOST` = 1,28 pour garder l'emprise réglée par
  Juice), `juiceShockRing(scene, x, y, {size, color, ms, variant?, flat, depth})` : `variant`
  est **facultatif** (défaut `null`) -- l'art `vfx_anneau_choc` (déjà coloré, non teintable)
  ne sert QUE pour `variant: 'talisman'` ou `'toxique'` (`mossBreak` passe `'toxique'`) ; sans
  variante, anneau dessiné teinté de `color` (avant, l'anneau ambre du talisman sortait
  partout). L'anneau peint est mis à l'échelle sur son trait (287 px) et non sur le canevas.
- **Temps** : `juiceHitStop(scene, ms)` (physique Arcade en pause + anims quasi figées, temps réel,
  plafonné à 90 ms, pas de rattrapage), `juiceSlowMo(scene, {ms, physics, anims})` (timeScale
  Arcade et anims ; le ralenti de la plume de l'aigle y passe), `juiceZoomPulse(scene, {zoom, ms})`.
- **Dessin seul** (appliqué au 'prerender', retiré au 'render' : la physique ne le voit jamais) :
  `juiceSquash(obj, sx, sy, ms)`, `juiceTilt(obj, rad, ms)`, `juiceRecoil(obj, dx, dy, ms)` (jamais
  sur le joueur : la caméra le suit pendant le rendu), `juiceRender(obj).lean` (inclinaison
  continue), `juiceFlash(obj, color, ms)`, `juiceGhost(scene, sprite, {tint, alpha, ms})`
  (silhouette unie qui s'efface, réserve de 8 images par scène).
- **Secousses** : `juiceShake(scene, 'tiny'|'light'|'medium'|'heavy'|'huge' | intensité, ms)` — une
  secousse plus forte remplace la courante, jamais l'inverse. Réglage d'accessibilité
  **« Secousses d'écran »** (Options : Activées / Réduites ×0,35 / Désactivées), mémorisé dans
  `agarica-options-v1.screenShake` (`juiceShakeLevel()`, `juiceSetShakeLevel(l)`). `Camera.prototype.shake`
  est enveloppé : TOUTES les secousses (scripts d'histoire, boss, `{shake}` de cinématique)
  suivent le réglage ; à « Désactivées » la durée et le rappel de fin restent identiques.
- **Son** : `playSfx(id, opts)` = points d'accroche VIDES (`SFX_HOOKS[id] = fn` ou `SFX_HOOKS['*']`
  pour brancher l'audio un jour). Ids posés : jump, jump_air, land, slash, wolf_bite, pogo,
  slash_obstacle, feather_shot, enemy_hit, enemy_defeat, player_hurt, heart_lost, energy_full,
  skill_denied, skill_<id>, ours_slam, transform_<forme>, vine_grab, vine_release,
  pickup, campfire_rest, totem_activate, form_unlock, lantern_light,
  platform_reveal, moss_crack, moss_break, moss_melt, purify, boss_end, zone_exit, banner,
  title_card, dialogue_line, dialogue_blip, dialogue_next, dialogue_choice, menu_move, menu_ok,
  overlay_open.
- **Où c'est branché** : Agarica (Player.js) — étirement au saut, écrasement + poussière à
  l'atterrissage (∝ vitesse de chute), bouffées de pas et de demi-tour, loup penché + traînée,
  plumes de l'aigle, silhouettes du lâcher de liane, éclat à chaque
  changement de forme, fracas de l'ours, impact de l'arc sur le décor (une fois par coup),
  coup reçu (flash blanc puis rouge, recul au dessin, hit-stop 60 ms, voile rouge
  `juiceHurtVignette`), **tampon de saut** `JUMP_BUFFER_MS` = 120 ms (le « coyote time »
  `JUMP_COYOTE_MS` = 110 ms existait déjà). Combat : `damageEnemy` → `juiceOnEnemyHit(scene, enemy,
  source)` (hit-stop 35-70 ms et secousse selon le coup, étincelles au point d'impact, flash
  blanc si l'ennemi ne le fait pas, recul + écrasement au dessin, « poof » de défaite) ; la pierre
  du singe l'appelle aussi. Ghil't soigné (fin du combat) : ralenti 0,7 s + zoom 1,06 (pas
  Kainati). Monde : feux de camp (halo qui respire, braises, crépitements, embrasement au repos),
  totems (halo + lueurs avant, éclat + anneau + zoom à l'activation), objets ramassables (halo
  `fx_halo_objet`, balancement, étoiles ; pop puis aspiration vers Agarica), amas de mousse
  (fissure `mousse_amas_fissure` + tremblement pendant l'élan de l'ours, puis éclats + hit-stop),
  murs de mousse (frémissement, gouttes et bulles pendant la fonte), lanternes de reprise (art
  `decor_lanterne_*`, éclat + halo), plateformes cachées (contour `decor_plateforme_fantome`, cases
  qui montent une à une + lueurs + onde), lianes (`Liane.twang`), purification, lucioles et
  papillons d'ambiance (clé de zone optionnelle `ambientLife: false | {fireflies, butterflies}`).
  Caméra : regard en avant dans le sens de la course (`followOffset.x`, 46 px max, sans toucher
  au vertical ni aux cinématiques ; une zone qui règle `camera.lookAheadX` garde le sien),
  fondus de zone adoucis (`juiceFadeIn` 460 ms + posé de caméra 1,03 → 1 ; sortie : même durée
  qu'avant, 250 ms). Interface : cœurs du HUD qui tremblent puis se vident / repoussent (après la
  fermeture du menu du feu), barre d'énergie lissée avec traîne, pointe lumineuse, lueur pleine et
  refus (tremblement) quand l'énergie manque, icône de compétence qui saute, bandeaux (rebond,
  rayons, étoiles, reflet), formes débloquées (rayons, icône qui pousse), carte-titre (même durée
  totale), dialogues (boîte et répliques qui rebondissent, nom qui glisse, indicateur qui surgit),
  menus (surbrillance qui glisse, entrée qui grossit, appui qui rebondit), sac/carte/feu de camp
  (ouverture `juiceOverlayIn`), écran de fin (lucioles, pétales).

### Interface ancrée dans le monde : toujours dans l'écran (2026-10-24, Moteur 3, rétro-compatible)
Règle commune (LevelKit) : tout élément d'interface posé dans le MONDE (invites « E : … »,
textes flottants, bulles de parole) reste dans la vue de la caméra, à `WORLD_UI_MARGIN` (8 px)
des bords, recalé à chaque image (POST_UPDATE, puis au `FOLLOW_UPDATE` de la caméra : pas
d'image de retard). Le propriétaire continue de poser l'objet sur son ancre ; le recalage
s'applique par-dessus et s'annule seul quand l'ancre revient dans la vue.
- `keepWorldUiInView(obj, { prompt })` → obj : inscrit un texte, une image ou un conteneur
  (idempotent). `prompt: true` = invite d'interaction : si son ancre passe au-dessus du haut de
  l'écran, elle se pose à hauteur de la tête d'Agarica, à l'aplomb de la cible.
- `worldUiAddLayout(scene, id, fn)` : mise en page sur mesure appelée aux mêmes moments,
  `fn(view, { hud, characters })` ; peut renvoyer les rectangles (monde) qu'elle occupe, que
  les invites évitent (bulles de StoryKit : la pointe suit le personnage).
- `worldUiView(scene, margin?)` → `{ left, top, right, bottom }` : vue actuelle (monde), marge
  déduite, calculée depuis `scrollX/scrollY` et le zoom.
- `worldUiHudRects(scene)` → rectangles (monde) du HUD : cœurs + énergie en haut à gauche (cadre
  de la barre peinte compris), cases de compétences en bas ; obstacles que tout élément évite.
- `worldUiAddScreenObstacle(obj)` : objet fixé à l'écran ajouté aux obstacles tant qu'il est
  affiché (toast d'aide ; zone invisible qui suit Agarica pendant le duel de Geralt et le
  combat de Kainati).
- `worldUiFreeSpot(rect, view, durs, mous, gap?)` → `{ dx, dy }` : place libre la plus proche
  pour une bulle (sort des obstacles durs -- HUD, autres bulles -- en évitant si possible les
  personnages).

### Lot Codex n°8 : intégration (2026-10-25, rétro-compatible)
Toutes les clés ci-dessous sont facultatives : sans elles, rendu d'avant. Chaque image branchée
garde son repli si la texture manque (`hasManifestArt` / `scene.textures.exists`) ; aucune
hitbox, aucun timing ni aucune durée de cinématique n'a changé. Détail du plan :
`PLAN_INTEGRATION_LOT_8.md`.

**Clés de zone**
- `farLayers: [{ id, y, scale?, scrollX = 0.25, scrollY = 0.3, alpha = 1, tint?, fill = false,
  fadeInX?: [x0, x1], withSky = false }]` (LevelKit `addFarLayers` / `updateFarLayers`, via
  `zoneBackdropSpec`) : bandes lointaines du manifest répétées en largeur, entre le ciel (et ses
  nappes) et la forêt du fond. `y` = haut de la bande ; `tint` multiplie, donc ne fait
  qu'assombrir ; `fill` pose sous la bande la couleur de son bas (teinte comprise) ; `fadeInX` :
  apparaît quand le centre de l'écran va de x0 à x1 ; `withSky` : suit le ciel qui se révèle.
  Fondus recalculés chaque image, monde gelé compris. Image absente = rien. Posées : forêt
  flottante 1 (horizon malade à **y 125**, pas 95 : à 95 il masquait le pied des îles peintes),
  forêt flottante 2 (horizon + îles lointaines discrètes, alpha 0,5, teinte bleutée 0xa8c4e8),
  hutte de Morgat. Horizon malade = `couche_horizon_malade` assombri par le code
  (teinte 0x3c4e44, échelle 0,45 ; Q1).
- `lights: [{ id, x, y, w?, h?, tint?, alpha, pulse?: [min, max, ms], layer: 'back' |
  'aboveAmbient', requires?, forbids? }]` (StoryKit) : `id` ∈ `fx_rai_lumiere` (`y` = BAS du rai),
  `fx_lueur_sol`, `fx_halo_doux`, `fx_halo_rayons` (`y` = centre) ; images en ADD ; `'back'`
  (défaut) derrière les personnages, `'aboveAmbient'` à la profondeur 950, au-dessus du voile ;
  une lumière à condition s'éteint ou se rallume en fondu si le drapeau change pendant la
  visite. Posées : bosquet (rai de lune, alpha 0,38), retour au bosquet (aube), forêt sombre 1
  (souche), trou sombre.
- `ambient.vignette` : `false` = pas de vignette ; nombre 0..1 = sa force ; absente =
  `Clamp(0,35 + darkness × 0,6, 0,35, 0,85)`. Image `couche_vignette` plein écran en MULTIPLY,
  **jamais teintée**, profondeur 999,5. `vignette: false` au bosquet, aux racines, au monde
  spirituel et à l'épreuve : vignette seulement sur les zones sombres (forêts sombres 1-2, forêt
  corrompue 1, arène de Ghil't, trou sombre).
- `ambientLife.spores: n` (LevelKit) : spores toxiques `fx_spore_toxique` d'ambiance, 10-12 px,
  dérive lente, petit point vert en repli. Forêt corrompue 1 : 14.

**Décors (props) et éditeur**
- Clés d'une entrée de `props` : `flipX: true` (retournée) ; `angle: deg` (rotation, pas de
  recalage au sol, `y` = point d'enfoncement, le décor passe derrière le sol pour cacher la
  partie enfoncée) ; `hang: true` (origine (0,5 ; 0) en `y`) ; `free: true` (origine
  (0,5 ; 0,5)) ; `flatY: k` (échelle Y × k) ; `front: true` (profondeur
  `DECOR_FOREGROUND_DEPTH - 3`). Les clés de l'entrée l'emportent sur `DECOR_PROP_PLACEMENT`.
  Les décors `hang`, `free` et `angle` ne servent pas de surface aux PNJ (`propTopYAt`).
  Flèche plantée (pivot au milieu du fût) : `y ≈ 442` au sol.
- `MANIFEST_DECOR_SECTIONS = ['decor', 'objet', 'rocher']` (sections d'ITEM_MANIFEST posables) ;
  `propDefaultScale(type)` = échelle du manifest, sinon `PROP_SCALE` ;
  `DECOR_PROP_PLACEMENT` = placement par défaut (`decor_mousse_lumineuse_plafond: {hang}`,
  `_tronc: {free}`, `decor_empreinte_boue: {flatY: 0.5}`) ; `propTextureKey(scene, type)` se
  rabat sur `item-<id>` si `prop-<id>` n'est pas chargé. BootScene ne précharge ces sections que
  si l'image est livrée (plus de 404). Un décor dont l'image manque n'est pas dessiné.
- Éditeur : sections « Décors (Codex) », « Objets posés (Codex) », « Rochers (Codex) » (décors
  absents non proposés) ; échelle par défaut du manifest ; taille par pas de ×1,1, minimum 0,02,
  arrondie à 4 décimales ; aperçu fidèle des clés de props (`editorPropPlacement`, copie de la
  règle de `buildLevelFromData` : à garder alignées) ; ces clés se règlent par « Propriétés… »
  (JSON). Sauvegarde sans perte de `farLayers`, `lights`, `ambient.vignette`, `ambientLife` ni
  des clés de props. Objets ramassables : préfixes de décor exclus (`EDITOR_NON_PICKUP_ITEM`).

**Interface peinte (StoryKit, sauf mention)**
- `addUiSliced(scene, id, x, y, w, h, { scale, depth, container, scrollFactor })` → Container |
  null : panneau découpé selon `nineSlice` {left, right, top, bottom} (px source, manifest) ;
  coins à l'échelle `scale` (défaut : manifest), bords et centre étirés, jointures au pixel ;
  `top = bottom = 0` → 3 morceaux horizontaux, hauteur = texH × scale (`h` ignoré) ; bornes
  `w ≥ (left + right) × scale`, `h ≥ (top + bottom) × scale` ; origine en haut à gauche ; null si
  la texture manque. Le panneau porte `setUiSize(w, h)` et `uiW` / `uiH`. Pas de
  `scene.add.nineslice` (WebGL seulement en Phaser 3.80). `storyUiScale(id, repli)` lit
  l'échelle d'une image d'interface dans le manifest.
- `createStoryPromptLabel(scene, { depth, originY })` → objet qui imite un Text (Container) :
  pilule `ui_invite` (24 px de haut) + pastille `ui_touche` (lettre sombre #2a1f45) + texte ;
  `setText` découpe `/^([A-Z]) : (.*)$/` et ne fait rien si le libellé n'a pas changé ;
  `setText` / `setPosition` / `setVisible` / `setDepth` chaînables, `setOrigin` sans effet ;
  `visible`, `active`, `text`, `getBounds`. Sans `ui_invite` : le Text d'avant.
  `ensureStoryPrompt` l'utilise ; LevelKit aussi pour « E : te reposer » (feux) et
  « E : se recueillir » (totems), profondeur 1050.
- Bulles de parole sur `ui_bulle` + `ui_bulle_pointe` (pointe à 21 px des coins au moins) ;
  toast sur `ui_bulle` ; bannière « objet obtenu » `ui_banniere` de **128 px** (textes à
  y + 30 / 41 / 66, icône de 46 px dans `ui_anneau_objet`) ; carte-titre avec
  `ui_ornement_titre` ; HUD : cases vides `ui_case_competence` (profondeur 1000,8 : sous la
  lettre) et pastilles `ui_touche` ; barre de boss `ui_boss_cadre` 448x32, remplissage dans la
  rainure 378x8 ; barre d'énergie peinte (LevelKit `juiceEnergyArt` /
  `juiceDrawEnergyBarArt`) : cadre 150x22, remplissage rogné dans la rainure 114x7, traîne,
  pointe et refus conservés. Indicateur « suite » du dialogue = `ui_bulle_pointe` à 0,26
  (18x13 ; ▼ en repli). Touches A/F/R du feu de camp peintes (`ui_touche`, 20 px). Les touches
  de l'écran Contrôles restent dessinées (bois clair en jeu seulement, Q32).
- Réplique `{ who, text, mood }` : joue l'anim `mood` du PNJ (ex. `xara_extra.excited`) au lieu
  de `talk` si l'art existe ; vaut pour la boîte de dialogue, pas pour les bulles.
- Lanternes de reprise : `decor_lanterne_*` à 0,15 (30x51), globe à 0,63 de la hauteur, halo de
  110 px, lueur au sol alpha 0,45.

| Élément | Profondeur |
|---|---|
| Personnages | `CHARACTER_DEPTH` = 10 |
| Voile `ambient` | 900 |
| Éclat du ciel, `lights` `aboveAmbient` | 950 |
| Feuilles | 999 |
| Vignette | 999,5 |
| `hudGraphics`, premier plan (`DECOR_FOREGROUND_DEPTH`) | 1000 |
| Barre d'énergie peinte | 1000,2 à 1000,6 |
| Cases de compétence vides peintes | 1000,8 |
| Cœurs du HUD | 1001 |
| Barre de boss | 1001,5 à 1003 |
| Bulles de parole | 1040 |
| Invites | 1050 |

**PNJ créés en cours de visite (StoryKit)**
- `registerStoryNpc(scene, npc)` → npc | null : inscrit un PNJ créé par un script (invite
  « E : parler » comme ceux de la donnée), sans doublon ; retrouve sa clé dans `scene.npcs`
  (sinon son id de manifest) et l'y inscrit si la place est libre ; retire au passage les PNJ
  détruits. Chaque image purge aussi les PNJ détruits.
- `unregisterStoryInteractable(scene, objOrNpc)` → bool : retire l'entrée (PNJ, image, donnée,
  mur ou entrée) ; le PNJ reste dans `scene.npcs`. Usage : Clak (duel de Geralt, revisite du
  bosquet ; `a2RegisterNpc` passe par `registerStoryNpc`).

**Moteur, entités, effets**
- `levelSceneOn(scene, event, fn)` (LevelKit) : écouteur de scène retiré à l'arrêt de la scène
  (plus de fuite d'écouteurs `update` des totems et feux à chaque redémarrage).
- Totem qui « s'éveille » : `addAbilityShrine` choisit l'image selon le drapeau
  (`WAKING_TOTEM_FLAGS = ['hasMonkeyForm']` : `totem_monkey_dim` avant la forme, `_lit` après).
- Halos : `fx_halo_doux` réimporté en vrai dégradé (plus faible qu'un disque plein) ; compensé
  par `JUICE_HALO_ART_BOOST` (1,28 : feu, totem, `juiceBurstImage 'glow'`) et, dans les entités,
  par `entityHaloTexture(scene, repli)` (MousseCreature.js, ×1,12). Feu de camp : flaque
  `fx_lueur_sol` au pied, qui respire avec le halo.
- Transformations : anims créées seulement si leurs images sont chargées
  (`createAnimIfLoaded(scene, config)`, `animPlayable(scene, key)`, Player.js) -- sans image, la
  forme change net, sans erreur ; `TRANSFO_FRAME_CALIBRATION` recale `transfo-wolf-2` sur la
  surface de `loup-run-0` (hitbox inchangée).
- Ennemis corrompus guéris : art `mousse_creature_guerie_0/1` (0,2), `singe_gueri` ; pieds gardés
  au même endroit par `corruptedFeetGap(e)` / `corruptedKeepFeet(e, gap)` (MousseCreature.js) ;
  éclat `vfx_purification` à 2,4 × la taille de l'animal (72 à 130 px). Pierre du singe corrompu
  = art `pierre` (12 px) ; `calmSingesCorrompus(scene, filter?, ms = 8000)` (SingeCorrompu.js)
  immobilise les singes sans lancer (PV, patrouille et portée inchangés) et brise les pierres en
  vol : utilisé à la prise de
  la forme singe au totem des racines (8 s ; 5 s à l'arrivée par l'entrée `totem_singe`).
- Ghil't : souffle `vfx_souffle_toxique` étiré sur sa zone de dégâts (330 px), plus de cône
  translucide quand l'art existe, triangle de dégâts identique (Q8) ; boule de crachat peinte
  (hitbox de rayon 11 inchangée) ; anim `hit` en idle ou en récupération seulement.
- Plateformes cachées : contour `decor_plateforme_fantome` calé sur la case ; empreintes du loup
  qui apparaissent une à une. Courants d'air : traits `fx_trait_vent`. Fil de Xara :
  tileSprite `fx_fil_soie` de 3 px.
- Pose papillon de la compétence : voir « Détails compétences » plus bas.

**Histoire (helpers)**
- `acte1Particles(scene, x, y, { …, fx: [ids] })` (acte1.js) : images `fx_*` en alternance
  (ADD seulement pour `fx_braise`) ; sans `fx`, comportement d'avant. Utilisé aussi par
  acte1_arbre.js.
- `acte1DrawMossDecor` : taches au format `[x, y, r, kind, flipX]`.
- `acte1PutAboveProps(scene, obj)` / `a2PutAboveProps(scene, obj)` : objet de script posé juste
  devant les décors de la zone, derrière les personnages (`storyPutBehindPlayer` le mettait
  derrière TOUS les décors : bête d'Amanite cachée par l'arbre, plaque du bosquet par la hutte).
- `arbreGlowPassage(scene, x, y, h = 120, color, open = true)` → `{ glow, core, setOpen(v), art }`
  (acte1_arbre.js) : fente `decor_fente_ouverte` / `_fermee` posée au sol + halo ; `glow` et
  `core` portent `__sx` / `__sy` (tweener `scaleX` / `scaleY`, jamais `scale`).
- `CLAIRIERE_MOUSSE_VARIANTE` (acte2.js) = `'touffes'` (autres : `'lisere'`, `'aucune'`) :
  mousse de la clairière en touffes et plaques du lot 8 teintées presque noires, absentes à
  moins de 150 px du cercle sain.
- Arène de Ghil't : trou d'effondrement à 0,16 ; cercle d'herbe saine (H11) ; créatures guéries
  qui sortent de la mousse tombée de Ghil't et s'enfuient à l'arrivée d'Amanite (H16) ; arène
  calme : décor à la profondeur 9 (sous les personnages), rai alpha 0,3. Trou sombre :
  `ghLiftCharacters(scene, depth)` passe Agarica et Xara au-dessus du halo (0,28).

**Importeur et manifeste** (`tools/import_codex_assets.py`, `src/data/asset_manifest.js`)
- Options d'import : `trimAlpha` et `cropTop` (rognage), `pad`, `falloff` et `desaturate`
  (retouches des halos et de la flaque au sol), `align: "ring"` (anneau recentré sur son trait,
  canevas 316x336). Les frames sont collées sans masque alpha (l'alpha n'est plus élevé au carré
  sur les bords adoucis ; profite aux frames réimportées avec `--force`).
- Interface : découpes `nineSlice` et échelles de `ui_bulle`, `ui_bulle_pointe`, `ui_invite`,
  `ui_banniere` (128 px), `ui_touche`, `ui_ornement_titre`, barres (énergie 150x22, rainure
  114x7 ; boss 448x32, rainure 378x8) ; lanternes à 0,15 ; vignette non teintée.

### Rendu de cohésion (LookKit) (`src/utils/LookKit.js`, décision du 2026-10-28, rétro-compatible)
Reprise de la variante C du prototype (`prototype/coherence.html`, `src/proto/`, laissés tels quels).
Décision de l'utilisateur : plus aucune ombre sous les décors, décors à leur gamma d'origine, tout le
reste appliqué. Zone sans clé `look` : rendu d'avant, aucun coût (zones de test : restent sans look).

**Clé de zone `look`** (donnée simple, compatible éditeur ; lue par `lookAttach(scene, data)` en fin de
`buildLevelFromData`, démonté seul à la sortie de zone et au redémarrage de scène) :
- `look: false` ou absente : aucun effet ;
- `look: 'foret_sombre'` : un profil de `LOOK_PROFILES` (`foret_sombre` = réglages finaux du prototype,
  `nuit` et `jour` = points de départ à régler à l'image) ;
- `look: { profile: 'nuit', overlay: 0.8, back: { blur: 1 }, lights: { rules: { feu: { radius: 180 } } } }` :
  réglages fusionnés par-dessus le profil (objets fusionnés, tableaux et valeurs remplacés).

**Réglages d'un profil** (une clé absente = neutre ; `false` coupe `grade`, `back`, `tiles`, `lights`, `rim`, `shadow`) :
- `grade` : étalonnage du plan de jeu. `exposure`, `contrast` (autour de `pivot`), `sat`, `map` (3 couleurs :
  ombres, tons moyens, lumières) et `mapAmt`, `shadowTint` et `shadowAmt`, `highTint` et `highAmt`, `ambient` (RVB multiplié).
- `overlay` : part gardée du voile `ambient` de la zone (0,5 = moitié moins). Les décors compensent : ils
  gardent leur valeur d'avant quoi qu'on mette ici.
- `back` : fonds. `blur` (px d'écran), `bright`, `sat`, `contrast`, `fog` et `fogAmt` (brume uniforme) : précalculés
  en textures à l'entrée de zone ; `mist` et `mistBand` : brume du bas de l'écran (dans le shader) ;
  `lightMul` : 0 par défaut, > 0 fait éclairer les fonds par les lumières (poste le plus cher sur puce intégrée).
- `tiles` : par-dessus le réglage du jeu de tuiles de la zone (`LOOK_TILESETS` : `tuiles`, `floor`,
  `tuiles_ecorce`, `tuiles_flottantes`, `tuiles_corrompues`). `tint` : `body` et `grass` (jeu en atlas), `blob`
  (jeux de biomes) ; `grade` : `warm`, `green` (`hue`, `hueAmt`, `sat`, `light`, `contrast`), `greenRange`, `keep` (bande
  de teinte laissée telle quelle) : pixels des textures recalculés une fois à l'entrée de zone et rendus à la
  sortie ; `backBright` : valeur du sol de second plan (× après l'étalonnage, 0,55 par défaut).
- `lights` : `max` (8 au plus), `glow` (halo additif d'ensemble), `propMul` (part reçue par les décors, 0,5),
  `raiAlpha` et `haloAlpha` (× sur le rai de lune et le halo peint), `rules` (par source : `feu`, `champignons`,
  `souche`, `mousse`, `rai`, `lanterne` ; `radius`, `intensity`, `glow`, `color`), `fly` (lucioles), `self` (Agarica), `xara`.
- `rim` : liseré des personnages. `color`, `alpha`, `offsets`, `px`, `lightTint` (couleur tirée vers la lumière proche).
- `shadow` : ombre sous les personnages. `alpha`. `shadow: false` les coupe toutes.

**Rôles** : `obj.lookRole = 'back' | 'world' | 'prop' | 'ui'`, à poser à la création de l'objet. Sans rôle :
classement automatique (`lookAutoRole` : profondeur, parallaxe, préfixe de texture).
- `back` : fonds et couches lointaines (flou, brume, désaturation).
- `world` (défaut) : tuiles, personnages, effets (étalonnage, lumières). `obj.lookTile = 'body' | 'grass' | 'blob' | 'back'`
  choisit la teinte d'une tuile ; `'back'` = sol de second plan (`groundBackCells`), assombri après l'étalonnage
  pour rester un plan arrière texturé (sa teinte 0x404040 seule finirait en aplat noir).
- `prop` : décors (`props`, sous-bois, plantes de premier plan, totems, feux, mousse, lianes, lanternes) :
  **aucun étalonnage, aucune ombre, aucun liseré** ; seules les lumières les éclairent, jamais ne les assombrissent.
- `ui` : HUD, bulles, invites, bannières : intacts.

**Méthode** : étalonnage PAR OBJET dans le shader de lot de Phaser (`MultiPipeline` dérivé, 7 variantes), pas
d'effet plein écran : chaque objet garde sa place dans la liste d'affichage, un décor derrière Agarica reste
derrière elle. Coût mesuré (Edge sans fenêtre, Intel UHD, machine chargée, médiane de rendus alternés) :
forêt sombre 1 de 12,0 à 13,6 ms par image (+1,6), forêt sombre 2 (900 objets) de 9,9 à 10,9 ms (+1,0), 10 appels
de dessin de plus sur 32. Entrée de zone : 0,3 à 1,2 s (précalcul des fonds), recommencée à chaque entrée.

**Option « Effets visuels »** (`OptionsScene`, Activés / Désactivés, `visualFx` dans `agarica-options-v1`,
activés par défaut) : appliquée tout de suite à la zone en cours, y compris en pause. Désactivés : rendu d'avant
au pixel près, aucun coût.

**API** : `lookAttach(scene, data)` (`data` null : celle de la dernière pose), `lookDetach(scene)`, `lookEnabled()`,
`lookSetEnabled(on)`, `lookResolveConfig(data)`, `lookRoleOf(obj)`. Tests et console : `window.lookKit`
(`attach`, `detach`, `enabled`, `setEnabled`, `config`, `roleOf`, `info`, `state`, `profiles`, `tilesets` ; `--js` : préférer
`info` à `state`, qui contient toute la scène et bloque le harnais).

### Duel de Geralt — `GeraltDuel` (`src/entities/GeraltDuel.js`, 2026-10-24)
Mécanique seule ; l'histoire (rencontre, bulles de Xara, fin, carte) reste dans `acte2.js`.
- `new GeraltDuel(scene, { geralt, minX, maxX, groundY, spawn, resetX, onEvent, noTrap })` :
  `geralt` = PNJ `scene.npcs.geralt` (pieds = y) ; `minX`/`maxX` = murs de l'arène ; `spawn` =
  réapparition d'Agarica pendant le duel ; `resetX` = place de Geralt à la reprise ; `noTrap` =
  plages `[x0, x1]` sans collet ; `onEvent(name, data)` reçoit les événements du duel
  (`lob`, `shot`, `jump-shot`, `crash`, `trap`, `geralt-hit`, `geralt-trapped`,
  `player-trapped`, `player-clamped`, `invoke`, `invoke-target`, `column-hit`, `clak-spawned`,
  `clak-charge`, `clak-hit`, `clak-stunned`, `clak-landed`, `parry`, `heal`, `player-down`,
  `restart`, `victory`).
- `start()` ; `update(delta)` (appelé seulement monde NON gelé : tout s'arrête avec lui) ;
  `ratio()` (barre de boss) ; `destroy({ keepActors = true })`.
- Règles (`GERALT_DUEL_CFG`) : 8 coups pour gagner, Clak invoqué au 4e (colonne de lumière à
  esquiver), phase 2 où Clak charge et pince (on l'étourdit sans le vaincre) ; flèche en cloche
  annoncée par un marqueur, tir droit, saut en cloche avec tir plongeant puis réception ratée
  (fenêtre de frappe) ; collets où Agarica ET Geralt peuvent tomber (le 2e de chaque série de 3
  est posé derrière lui) ; dernier cœur perdu = reprise dans l'arène, avec un peu plus de répit
  à chaque défaite (`ease`, `teleEase`). Tirages reproductibles (graine fixe).
- Coups vers le bas sur Geralt ou Clak = rebond (`scene.pogoTargets`) ; Agarica est un obstacle
  de la règle « interface dans l'écran » pendant le duel (`worldUiAddScreenObstacle`) ; Clak
  inscrit / retiré par `registerStoryNpc` / `unregisterStoryInteractable`, calmé et posé au sol à
  la victoire comme à la défaite.
- Poses de combat : manifest `geralt_combat` (prompt Codex n°9, à générer) dès qu'il existe,
  sinon les poses actuelles (`GERALT_POSES`).

### Kainati (2026-10-25)
- Combat au sol (`src/entities/Kainati.js`, script `kainati_arene`) : charge, pierres, onde de
  choc (front à 800 px/s), vague de mousse, éboulement pleine largeur esquivés sur **2 lianes**
  (x 792 et 1192, y 64, longueur 170 : aucun point à plus de ~245 px d'une liane) ; frappable à
  tout moment, contact blessant, sonné après la charge ; épargné et inerte à la fin.
- Télégraphes : grandes attaques 1250 ms (phase 1) / 1200 ms (phase 2), préparation de la charge
  1200 ms ; vitesse de charge 620 / 700. Il attend que ses pierres aient touché le sol avant
  l'action suivante ; Agarica dans son dos → sa prochaine action est une charge vers l'autre
  bout ; en rentrant à son poste il s'arrête 120 px devant elle ; la pierre de la canopée vise
  la liane d'Agarica (ombre `fx_ombre_sol` + marqueur `fx_marqueur_danger`).
- Sans forme singe (ou aigle choisi au feu de camp), le combat ne démarre pas : Xara explique,
  le retour vers les racines reste libre. Poses `kainati_calme` (prompt Codex n°9, à générer)
  utilisées dès qu'elles existent.
- Pendant le combat, Agarica est un obstacle de la règle « interface dans l'écran »
  (`kainatiMakePlayerGuard`, comme `playerGuard` du duel de Geralt) : les alertes de Xara se
  posent au-dessus d'elle, plus sur sa tête. Toast d'entrée : « double saut sous une liane ».
- Pierres des racines et de l'épreuve (`arbreDropRock`, `epreuveDropRock`, acte1_arbre.js) :
  l'ombre est doublée du même marqueur `fx_marqueur_danger` au ras du sol (grandit et pulse
  jusqu'à l'impact) ; sans l'art, l'ombre seule.

### Branches et troncs (`src/utils/BrancheKit.js`, 2026-11-04, rétro-compatible)
Pour le grand arbre (arène de Kainati, racines, épreuve du singe) : de vraies branches reliées
à un tronc à la place des rectangles de tuiles. Zones sans ces clés : rien ne change. Construits
AVEC le sol dans `buildLevelFromData`, pas dans un handler : totems, décors et feux se calent sur
le sol juste après (`LEVEL_DATA_HANDLERS.branches` / `.trunks` sont des entrées vides).

- `trunks: [{ x, top?, bottom?, scale?, base?, tint?, flipX? }]` — `x` = axe du fût, `top` / `bottom`
  en px monde (défauts : haut du monde, bas du niveau), `scale` de l'art (0,25 : fût de 198 px).
  `base: true` : pied `tronc_base` dont la ligne de sol est sur `bottom`. Sans collision, derrière le
  sous-bois et le sol. `tint` : plus sombre pour le lire juste derrière le plan de jeu.
- `branches: [{ from: [x, y], to: [x, y], via?, bend?, rows?, cells?, solid?, attach?, tip?, thickness?, scaleX?, taper?, forks?, tint? }]`
  — ordre du tableau = du fond vers l'avant. `from` / `to` / `via` : points de la **ligne de surface**
  (haut de la mousse, là où l'on pose les pieds), `via` pour courber : la courbe passe PAR ces
  points sans les dépasser (monotone en x), une partie plate reste plate au pixel près.
  `bend` : flèche au milieu, sans `via`.
  - **Collision** : mêmes cases et mêmes corps que le sol (`renderAutotileGrid`, faces internes
    comprises). Branche plate : ses `rows` rangées (défaut 1), de `from.x` à `to.x` sous `y` : `x` et
    `y` multiples de 64. Branche courbe : aucune, sauf `cells` (liste `[gx, gy]`, `groundRow` utilisable) ;
    le reste de la courbe est un décor. `solid: false` : aucune case.
  - **Extrémités** : `attach` = côté du raccord au tronc (`'left'`, `'right'`, `'both'`, `'none'` si elle
    sort de l'écran), `branche_base` dont les colonnes de gauche recouvrent le tronc (64 px à
    l'échelle 0,25). `tip` = côté effilé (`'left'`, `'right'`, `'both'`, `'none'`), par défaut l'opposé du
    raccord. La pointe dépasse de la hitbox (32 px à 0,25).
  - **Dessin** : `thickness` = px entre surface et dessous de l'écorce (défaut 56, soit l'échelle 0,25 ;
    échelle = `thickness / 224`), `scaleX` = échelle en largeur si différente, `taper: [g, d]` = épaisseur
    relative à gauche et à droite (sous la surface), `forks: [{ at, flip? }]` = `branche_fourche` à `at` px
    du début de la surface (le bras haut est un décor), `tint` = branche d'arrière-plan.
- **Lisibilité** (revue du 2026-11-05) : une branche qui ne porte pas (décor, ou grande branche des
  lianes dont seule la case d'accroche est solide) prend la teinte d'arrière-plan `0x6e6878` ; un
  rameau courbe qui mène à une plateforme est coupé en deux : partie courbe en décor (`solid: false`,
  teinte, dessinée avant) et partie plate claire qui porte (racines : élan et marche du filet ;
  épreuve : îlot de S3, perchoir du singe, rebord de S4). Racines : la marche du bout du toit
  (x 1280-1344, y 256) est traversable par en dessous (script, `ARBRE_RACINES_ONE_WAY`) : le loup
  (86 px) ne passait pas dans la niche de 64 px au pied de la butte.
- **Pour lire le sol depuis la donnée : `zoneGroundCells(data)`** (sol peint + cases des branches, sans
  doublon), jamais `data.groundCells` seul. `branchCollisionCells(b)` : les cases d'une branche.
- **Rendu** : `item-branche_*` et `item-tronc_*` (lot n°11) si chargés, sinon les mêmes pièces dessinées
  par code (`brancheFallbackPiece`, même format : rangée de marche 256, dessous 480). Composé une fois
  dans un canvas (`autotile-branche-<signature>-<n>`, plusieurs images au-delà de 2048 px) : pièces mises
  bout à bout avec un fondu sur l'écorce, puis posées le long de la courbe par tranches. Image remontée
  de 12 rangées source (`BRANCHE_FOOT_SINK_ROWS`, 3 px à 0,25) : les pieds touchent la mousse, pas le
  contour sombre qui la surmonte.
- **Lianes** : le préfixe `autotile-` fait que `vineBlockAbove` (Liane.js) mesure le bas visible de la
  branche et y rentre le haut de la liane. Pour une liane attachée en (x, y), faire passer la surface
  en (x, y - thickness + 2) ; contrôle : `vine.drawLift > 0`.
- **Éditeur** : outils « Branche » (glisser = surface calée sur la grille ; molette : longueur, ou
  épaisseur si courbe) et « Tronc » (clic ; molette : échelle) dans « Plus d'outils » ; courbe, raccord,
  cases dans « Propriétés (JSON) ». Maj+flèche les décale avec le sol.

### Sous-bois : bandes sans plantes (`undergrowthAvoid`, 2026-11-05, rétro-compatible)
- `undergrowthAvoid: [[x1, x2], …]` (px monde, facultatif) : aucune plante du sous-bois
  (`addUndergrowth`, LevelKit) n'y est posée, même en partie, à toutes les hauteurs. Sans la clé :
  rien ne change. Distincte d'`avoidRanges`, qui ne concerne que les arbres et buissons du fond.
  Arène de Kainati : `[[512, 1472]]` (ses plantes se confondaient avec les éclats de l'onde de choc).
- **Éditeur** : clé non éditée, conservée telle quelle à l'aller-retour JSON (listée dans « Clés
  conservées sans édition ») ; Maj+flèche ne la décale pas (comme `avoidRanges`).

### Plantes de premier plan (`foregroundPlants`, 2026-11-08, rétro-compatible)
- `foregroundPlants: false` (facultatif, défaut `true`) : ni touffes au bas de l'écran
  (`addProceduralGroundPlants`) ni lianes suspendues en haut (`addCaveCeiling` →
  `addProceduralHangingPlants`, qui ne dessine aucun vrai plafond). Le reste du décor (fond, forêt,
  sous-bois `addUndergrowth`) ne change pas. Sans la clé : rendu d'avant.
- Décision utilisateur : ce premier plan ne reste que dans la forêt sombre (`foret_sombre_1`,
  `foret_sombre_2`). Toutes les autres zones de la démo portent `foregroundPlants: false` (les
  zones au fond `fond_foret_flottante` n'en avaient déjà pas) ; les anciennes zones de test
  (zone1-5, sous_grotte, zone_aquatique, zonetest) gardent leur rendu. `addMoonlitDecor` prend un
  10e paramètre `groundPlants` (défaut vrai : titre, prologue et écran de fin inchangés).
- **Éditeur** : clé non éditée, conservée telle quelle à l'aller-retour JSON.

### Agarica au début et à la sortie d'un dialogue / d'une cinématique (2026-11-08, rétro-compatible)
- **Début** (premier gel « d'histoire » : `showDialogue`, `runCutscene` bloquante, ou verrou
  `__cutsceneLock` posé par un script de boss) : `storyBeginSettle(scene)` coupe course, sprint du
  loup, coup, ours (`Player.storyStopActions`). Posée : pose de repos tout de suite
  (`Player.storyRestPose` : forme humaine, idle, vitesse nulle ; pieuvre figée dans l'eau). En
  l'air : la physique (qui tourne pendant le gel) la fait retomber en pose de saut humaine
  (`Player.storyAirPose`, élan horizontal gardé, freiné par l'air, même corps qu'un saut) ; la
  boîte de dialogue attend qu'elle soit posée et tienne debout (`STORY_SETTLE_STABLE_MS`, 80 ms),
  `STORY_SETTLE_MAX_MS` (1,2 s) au plus. Ligne de chute franchie pendant ce temps : chute dans le
  vide habituelle (fondu, point sûr, cœur), boîte ouverte après la reprise. Tant que le monde reste
  gelé, si elle perd son appui (corps de repos moins large au ras d'un bord), elle retombe en pose
  de saut puis reprend la pose de repos.
  Gardés tels quels : liane (pose de liane), pose narrative (`storyPose` : `sad`, `cast`…),
  joueur piloté (`__playerScripted` : `playerMove`, vol du crash, chute dans le vide), mort en
  cours, corps immobilisé par un script (`body.moves = false`), compétence « avec la forme »
  (pierre, papillon : jouée jusqu'au bout). Les étapes d'une cinématique ne sont pas retardées ;
  seules ses répliques (`say`) attendent. Chaque image de gel : `storyFrozenTick(scene)`
  (LevelKit, avant `freezeWorldBodies(scene, playerFalling)`).
- **Sortie** : à la fin de tout dialogue (boîte) ou cinématique bloquante, Agarica est invulnérable
  (`Player.storyInvulnPending`, dès la même image), puis, au premier dégel
  (`storyUnfrozenTick`), pendant `STORY_EXIT_INVULN_MS` (1 s, StoryKit), signalée comme après un
  coup (clignotement `HIT_BLINK_*`) — **depuis la vague 3, le clignotement ne s'affiche que si un
  ennemi est à moins de `STORY_EXIT_BLINK_RANGE` (300 px, centre à centre ; `storyThreatNear`)** ;
  l'invulnérabilité, elle, est toujours là (`grantStoryInvulnerability(ms, { blink: false })`). Les ennemis à moins de `STORY_EXIT_CALM_RANGE` (320 px) qui
  exposent `calm(ms)` (aujourd'hui `SingeCorrompu`) annulent leur attaque en cours. Contrat
  facultatif pour un ennemi : `calm(ms)` = attaque en cours annulée, immobile `ms`, pose de repos.
- `player.isInvulnerable` (lecture) = coup reçu OU sortie de dialogue ; écriture = coup reçu
  (`player.hitInvulnerable`, l'ancien booléen). Une chute dans le vide ignore l'invulnérabilité
  de sortie (`hitByEnemy({ fall: true })` et `storyFallRespawn` ne lisent que `hitInvulnerable`) :
  elle coûte toujours son cœur. `player.grantStoryInvulnerability(ms)` : API publique.

### Feu de camp, carte du monde, vol de l'aigle (2026-11-08, points 3-5 de la liste, rétro-compatible)
- **S'asseoir** (LevelKit `addCampfire` / `campfireSit`) : E à portée d'un feu (au sol, hors liane et
  eau) → `player.startCampfireRest(fire)` : immobile, tournée vers le feu, art `agarica_repos`
  (`sit` puis `sit_idle` en boucle ; repli sans art : idle debout). Effets : vie et énergie pleines
  (`refillAtCampfire`), puis `storyCampfireRest(scene, fireId)` (zones de l'histoire seulement) :
  feu ajouté à `campfiresVisited`, `lastCampfire`, `lastEnterId = 'feu:<id>'`, découvertes
  reportées sur la carte (`storyMapCommit`), sauvegarde. Toast « Vie et énergie restaurées · carte
  mise à jour ». Le monde n'est PAS gelé : marcher, sauter, frapper ou une compétence la relève
  (l'action part dans la même image, `updateCampfireRest`), un coup reçu, une cinématique
  (`storyStopActions`) ou une chute aussi (`endCampfireRest`). `player.campfireRest` = `{ fireId,
  since, anim }` ou null.
- **Identifiant d'un feu** : `<zone>#<indice dans data.campfires>` (`campfireIdFor(scene, i)`,
  `campfireParseId(id)`) ; `scene.__campfires` = `[{ id, index, x, y, fire, … }]` (une visite).
- **Point d'entrée `feu:<id>`** (`campfireEnterId(id)`, `campfireIndexFromEnterId(scene, enterId)`) :
  `buildLevelFromData` place Agarica à côté du feu (`campfireSeatSpot`) et l'assoit
  (`campfireArrive`, avec la descente de l'aigle si `sceneData.flight`). Sert au vol et à
  « Continuer » (reprise assise au dernier feu ; respawn de la zone = ce point). Feu introuvable :
  spawn par défaut.
- **Menu du feu** (`CampfireMenuScene`, assise : E ou Entrée ; données `{ player, fire, parentKey,
  mode }`) : écran `hub` (Formes et compétences, Carte, Vol si `hasEagleForm`, Inventaire, Objets
  grisé « bientôt »), `forms` (l'ancien panneau, centré, sans totems), `flight`. Échap ferme le menu
  (elle reste assise, sauvegarde silencieuse). Carte et inventaire s'ouvrent PAR-DESSUS le menu mis
  en pause (`returnTo: 'CampfireMenuScene'`) et le reprennent en se fermant.
- **Consommables** (StoryKit) : `CONSUMABLE_INFO` (`baie_soin` : +1 cœur, `seve_energie` : énergie
  pleine), registre `consumables` = `{ id: nombre }`. `consumableCount(id)`, `consumableAdd(scene, id,
  n = 1, { silent })` (popup « Objet obtenu »), `consumableUse(scene, id)` → `{ ok, text }` (rien de
  consommé si sans effet). Sources (vague 3) : coffres, trésors, boutique, récompenses de quête.
  Utilisables PARTOUT depuis le sac (I, ou
  entrée Inventaire du feu) : E / Entrée sur la case. Icônes dessinées (`STORY_DRAWN_ITEMS`).
- **Découvertes** (StoryKit, `storyMapRecord` dans `storyUpdateHook`, monde non gelé, zones de
  l'histoire) : blocs de `STORY_MAP_CHUNK` (128 px) dans ±`STORY_MAP_REVEAL_X/Y` (448 / 320 px)
  autour d'Agarica → `mapPending`. Au feu : `storyMapCommit()` les verse dans `mapExplored`. Format
  des deux clés : `{ zone: ['cx,cy', …] | '*' }` (`STORY_MAP_ALL = '*'` : zone entière).
  `storyMapZoneChunks(zone, key)`, `storyMapPendingCount()`.
- **Carte** (`MapScene`, refaite) : silhouette du vrai terrain (`zoneGroundCells`, branches
  comprises) de chaque zone présente dans `mapExplored`, sur le parchemin `carte_parchemin` voilé ;
  blocs non parcourus de la zone en brouillard hachuré ; feux (allumés si assise, sinon aperçus),
  passages (sorties de bord vues), épingle « toi » si la zone d'Agarica est sur la carte. C'est
  la version du dernier feu : le sous-titre compte les découvertes en attente. Positions :
  `MAP_ZONE_LAYOUT` (MapScene.js, px de jeu, coin (0,0) de chaque zone, 15 zones de la démo) ;
  zone absente → `mapAutoPlace` (collée à une zone placée qui la relie par une sortie de bord) ;
  zones de test jamais. Données : `<ZONE>_DATA` par convention de nom (`mapZoneData`). Flèches /
  ZQSD déplacent, + / − / molette / PageUp-PageDown zooment (`MAP_ZOOMS`), glisser à la souris,
  Espace recentre sur Agarica, M / Échap / E ferment.
- **Touche M partout** : `storyMapAvailable()` = `inventoryHas(STORY_MAP_ITEM)` (`'carte_geralt'`,
  donnée par Geralt dans la forêt flottante 1 ; `null` = toujours). Sans elle : toast « Tu n'as pas
  encore de carte. » (et entrée Carte grisée au feu) ; les découvertes s'enregistrent quand même.
- **Vol de l'aigle** (entrée « Vol », `hasEagleForm`) : destinations = `campfiresVisited` sauf le
  feu actuel (`campfireFlightDestinations(scene, fromId)` → `[{ id, zone, index, scene, label,
  blocked }]`) ; envol (`campfireFlyTo(scene, dest)` : l'aigle remplace Agarica et quitte l'écran,
  monde gelé, fondu) puis arrivée assise par `feu:<id>`. Règles (`CAMPFIRE_FLIGHT_RULES`, StoryKit) :
  départ refusé hors zone de l'histoire ; zone fermée (`campfireZoneSealed` : la donnée a des
  sorties mais son script les a toutes retirées — combat de Ghil't, trou sombre) ;
  défaite imposée face à Ghil't en cours (`ghiltPhase >= 2` sans `ghiltHealed`) ; forêt corrompue
  tant que `ghiltHealed` est faux (après le crash, la mousse se referme : ni départ ni arrivée).
  Arrivée refusée à la cime du grand arbre (`grand_arbre_arene`) tant que `kainatiDefeated` est
  faux. `campfireFlightDepartureBlock(scene, fromId)` → raison ou null.
- **Anciennes sauvegardes** (`migrateSaveMap`, appelée par `migrateSaveValues`) : sans
  `mapExplored`, chaque zone `visited_<zone>` est reportée en entier (`'*'`) ; une partie neuve pose
  `mapExplored = {}` dès son entrée en zone (jamais prise pour une ancienne).
- Nouvelles clés de sauvegarde : `campfiresVisited`, `lastCampfire`, `mapExplored`, `mapPending`,
  `consumables` ; `lastEnterId` peut valoir `feu:<id>`.

### Secrets, récompenses, marchand, quêtes (vague 3, 2026-11-08, rétro-compatible)
Fichiers : `src/utils/SecretKit.js` (chargé juste après StoryKit), `src/scenes/ShopScene.js`,
`src/data/shops_data.js` (table `SHOPS`), quêtes dans StoryKit (`QUESTS`). Tout s'affiche sans art :
images du manifeste (`eclat_lune`, `coffre_ferme`, `coffre_ouvert`, `coeur_entier`,
`fissure_secret`, PNJ `marchand`) dès qu'elles existent, sinon dessinées par code
(`STORY_DRAWN_ITEMS`) ou placeholder. Banc d'essai complet : zone `zonetest` (« Zones de test »),
quête d'exemple dans `src/story/banc_essai.js`.

**Trois décisions de l'utilisateur.**
- Feu de camp : assise, Agarica est invulnérable (`player.isInvulnerable` vaut vrai tant que
  `campfireRest` est posé ; une chute dans le vide coûte toujours son cœur).
- Consommables (baie de soin, sève d'énergie) : utilisables partout depuis le sac (I), et toujours
  depuis le menu du feu (entrée Inventaire).
- Sortie de dialogue : invulnérable 1 s comme avant ; ne clignote que près d'un ennemi (cf. plus haut).

**Contenu (format commun)** des coffres, trésors, quêtes, cassables et articles de boutique : un
objet (plusieurs clés possibles) ou un tableau d'objets, versé par `secretGrantContents(scene,
contenu, { source, silent, x, y })` :
`{ eclats: n }` (éclats qui jaillissent de (x, y) puis sont aspirés) · `{ item: 'id' }` (objet de
quête, ITEM_INFO) · `{ coeur: true }` (cœur entier) · `{ consommable: 'baie_soin', n: 2 }` ·
`{ skill: 'id' }` · `{ set: { flag: true } }`. `secretContentsLabel(contenu)` → texte court.

**Éclats de lune (la monnaie).** Registre `eclats` (nombre, sauvegardé ; absent = 0).
`eclatsCount()`, `eclatsAdd(scene, n)`, `eclatsSpend(scene, n)` → faux si pas assez (rien retiré),
`eclatsSpawn(scene, x, y, total)` (au plus 12 morceaux : un gros éclat en vaut plusieurs). Un éclat
saute, rebondit, puis, après 380 ms, est aspiré vers la poitrine d'Agarica à moins de 120 px ;
tombé dans le vide, il est compté quand même. Compteur discret à droite des cœurs (icône, total,
« +n »), visible 2,4 s après chaque changement puis effacé ; aussi dans le sac (en haut à droite)
et en bas de la boutique.
- Butin : seuls les ennemis de la DONNÉE (`enemies`) en lâchent, à leur défaite. Table
  `ECLATS_ENEMY_DROPS` par type (défaut [1, 2] ; loup [1, 3], singe et crapauds corrompus [2, 3],
  araignée 0, loup alpha [6, 8]) ; réglage par ennemi : `enemies: [{ type, x, y, eclats: 0 | n | [a, b] }]`.
  Ennemis ajoutés par un script (renforts, mousses de Ghil't) : rien (pas de récolte sans fin en combat).
- **Ennemi soigné par le papillon : aucun éclat** (`ECLATS_HEALED_DROP = 0`, choix argumenté). Il
  repart vivant, et la nuée purifie plusieurs créatures d'un coup sans risque : avec un butin, soigner
  deviendrait la façon la plus rentable de récolter, au lieu d'un choix de cœur. Le soin reste
  récompensé par l'histoire, pas par la bourse.

**Cœurs entiers.** +1 cœur maximum et vie pleine, pour toujours. Registre `heartUpgrades` = liste
des sources prises (`'chest:<zone>:<id>'`, `'tresor:<zone>:<id>'`, `'quest:<id>'`…) : une source ne
compte qu'une fois. Lu par `Player.recomputeTotemBonuses` (en plus de `coeurBonusForet`) et par le
résumé « Continuer ». `heartUpgradeCount()`, `heartUpgradeGrant(scene, source)` (bandeau « Cœur entier »).

**Murs et sols cassables** — clé `breakables` :
```
breakables: [
  { id: 'mur_epee', by: 'sword', hits: 3, hint: 'fissure',
    cells: [[16, 3], [16, 4], [17, 3], [17, 4]] },          // le mur ET la salle cachée derrière
  { id: 'sol_ours', by: 'bear', hint: 'poussiere', x: 2656, y: 352, w: 192, h: 64,
    reward: { eclats: 5 } },
]
```
- Cases de la grille (`cells`), ou rectangle `x, y, w, h` (x, y = CENTRE, comme la mousse : toutes
  les cases dont le centre est dedans). Peindre AUSSI ces cases en sol (`groundCells`) : l'éditeur et
  la carte les montrent alors pleines (le jeu les ajoute de toute façon).
- Avant la casse : solides et rendues AVEC le sol (même jeu de tuiles, dispositions `atlas` et
  `blob`, mêmes raccords) ; seul l'indice les trahit : `hint: 'fissure'` (défaut ; petite fissure sur
  une face exposée, art `fissure_secret` sinon tracée), `'mousse'` (touffe un peu plus pâle et plus
  bleue), `'poussiere'` (filet de terre toutes les 3-6 s, à l'écran), `false` (rien).
- Une salle ou une grotte cachée se met DANS `cells` avec son mur : tout tombe d'un coup (avant, on ne
  voit qu'un bloc plein). Pour son fond : `groundBackCells`. Un coffre ou un trésor posé dans des
  cases intactes est dessiné derrière le sol et ne s'ouvre pas (ni invite) tant qu'elles tiennent.
- `by: 'sword'` : `hits` coups de mêlée (défaut 3 ; dague ou croc du loup, un coup = un jeton),
  fissures qui grandissent, tremblement ; l'ours casse aussi. `by: 'bear'` : seulement le fracas de
  l'ours (sa zone est prolongée de 28 px sous les pieds pour atteindre un sol) ; la dague n'y fait
  rien (poussière + toast « Ça sonne creux… Il faudrait frapper bien plus fort. », une fois par visite).
- La casse : corps et images retirés, cases voisines redessinées (`secretRerenderGround` : bords
  exposés, herbe, faces de collision ; même place dans la liste d'affichage ; variante de case pleine
  tirée d'un hachage, `autotileCenterVariant`), éclats de tuiles, onde, secousse, `reward` versée.
  Flag `break_<zone>_<id>` : ouvert pour toujours. Événement scène `'breakable-broken'` (b).
- LevelKit : `renderAutotileGrid(…, { solid, cellObjects })` (voisinage imposé, objets par case),
  `scene.__groundRender = { cells, solid, cellObjects, tileset, noArt, end }`.

**Coffres** — `chests: [{ id, x, y?, contents, requires?, forbids? }]` : posé au sol (`y` = ligne des
pieds, OBLIGATOIRE dans une salle cachée : le sol de la grille sous lui, cassables ignorés), E pour
ouvrir (« E : ouvrir »), couvercle, lueur, contenu qui jaillit. Flag `chest_<zone>_<id>` ; ouvert, il
reste ouvert. Événement `'chest-opened'`. Exemple : `{ id: 'coffre_salle', x: 1248, y: 320,
contents: { eclats: 25 } }`.

**Trésors posés** — `treasures: [{ id, x, y?, contents, requires?, forbids? }]` : objet flottant
ramassé au CONTACT (cœur entier d'une grotte secrète, poignée d'éclats…), `y` = centre (défaut 34 px
au-dessus du sol). Flag `treasure_<zone>_<id>`. Exemple : `{ id: 'coeur_grotte', x: 2592, y: 470,
contents: { coeur: true } }`.

**Marchand.** PNJ `npcs: [{ id: 'marchand', x, shop: 'marchand_lune', talk?: 'accueil' }]` (sprite
`marchand` du manifeste) : E (« E : marchander ») ouvre la boutique, après la réplique `talk` s'il en
a une (sauf cinématique qui contient déjà `{shop}`). Étape de cinématique `{shop: 'id'}` (attend la
fermeture). `openShop(scene, id)` → Promise. Table `SHOPS` (`src/data/shops_data.js`) :
```
SHOPS.marchand_lune = {
  name: 'Marchand de lune', greet: 'Des baies, de la sève…',
  articles: [
    { id: 'baie_soin', price: 8, give: { consommable: 'baie_soin', n: 1 } },
    { id: 'seve_energie', price: 12, give: { consommable: 'seve_energie', n: 1 } },
    // plus tard : { id: 'armure_ecorce', price: 60, give: { item: 'armure_ecorce' }, stock: 1, name, desc }
  ],
};
```
`stock` (total vendable sur la partie ; registre `shopBought` = { 'boutique:article': n }), `name` /
`desc` / `icon` (sinon tirés de l'objet), `requires` / `forbids`. `shopArticles(id)`, `shopBuy(scene,
id, article)` → `{ ok, reason: 'eclats' | 'stock', text }` (rien retiré en cas de refus). ShopScene :
monde gelé, cadre de lianes (`addStoryVineFrame`, sinon `drawStoryPanel`), ↑/↓ choisir, E / Entrée
acheter (refus : la ligne tremble, « Il te manque n éclats de lune. »), Échap partir.

**Quêtes secondaires** (StoryKit). Registre global `QUESTS`, rempli par les fichiers d'histoire :
```
QUESTS.galet = {
  title: 'Le galet de lune', giver: 'Druide', desc: '…',
  steps: [{ id: 'chercher', text: 'Trouver le galet…' }, { id: 'rapporter', text: 'Le rapporter.' }],
  reward: { eclats: 15, consommable: 'baie_soin', n: 1 },   // même format que les coffres
  hidden: false,                                            // vrai : absente du sac avant la fin
};
```
- État sauvegardé `quests` = { id: { step, done } } (absent = pas commencée). `questStatus(id)` →
  'none' | 'active' | 'done', `questCurrentStep(id)`, `questStart(scene, id)`, `questSetStep(scene, id,
  step?)` (null : étape suivante), `questComplete(scene, id)` (verse `reward`), `questJournal()`.
- Étapes de cinématique : `{questStart: 'id'}` (bandeau « Nouvelle quête »), `{questStep: 'id'}` ou
  `{questStep: {id, step}}` (toast « Quête mise à jour », ne gèle rien), `{questComplete: 'id'}`
  (bandeau « Quête terminée » + récompense), `{reward: contenu}` (récompense hors quête) ; `{give}` /
  `{take}` existants pour les objets de quête. `{…, silent: true}` : sans bandeau.
- Conditions (`requires` / `forbids`, `talk` conditionnel des PNJ) : `quest: 'id'` (en cours),
  `questDone`, `questNone` (pas commencée), `questStep: 'id:étape'`, `eclats: n` (au moins n).
  PNJ dont la réplique suit la quête :
  `talk: [{ requires: { questDone: 'galet' }, talk: 'merci' }, { requires: { quest: 'galet', item:
  'galet_lune' }, talk: 'quete_fin' }, { requires: { quest: 'galet' }, talk: 'attente' },
  { talk: 'quete_debut' }]` ; objet de quête : `pickups: [{ item: 'galet_lune', x, requires: { quest:
  'galet' }, cutscene: 'galet_trouve' }]` (cinématique `[{questStep: {id: 'galet', step: 'rapporter'}}]`).
- Sac (I) : onglets « Objets » / « Quêtes » (Tab ou clic) ; quêtes en cours puis terminées, étapes
  franchies (✓), étape en cours (➤), suivantes cachées, récompense.

**Éditeur.** « Plus d'outils » : **Mur/sol cassable** (glisser = cases couvertes ; id, épée ou ours),
**Coffre** (id, contenu JSON), **Trésor** (cœur par défaut) ; PNJ `marchand` (avec `shop:
'marchand_lune'`). `breakables`, `chests`, `treasures` et `npcs[].shop` passent l'aller-retour JSON
sans perte ; le reste (indice, récompense, `hits`) : « Propriétés (JSON) ».

**Nouvelles clés de sauvegarde** : `eclats`, `heartUpgrades`, `quests`, `shopBought`, flags
`break_<zone>_<id>`, `chest_<zone>_<id>`, `treasure_<zone>_<id>`. Une ancienne sauvegarde se charge
telle quelle (0 éclat, aucun cœur entier, aucune quête).

## Progression & flags d'histoire (noms figés)

| Ordre | Zone (nom snake → Scene / DATA) | Événements | Flags posés |
|---|---|---|---|
| 1 | `bosquet` → BosquetScene | habitants vs mousse, aide (gratter), 3 bébés cochons, père → talisman ours, vol idole par Amanite, Agarica ment, bannissement | `talismanOurs` (item `talisman_ours`), `banished` |
| 2 | `foret_sombre_1` | désespoir, rencontre Xara, amas de mousse bloquant, talisman réagit → compétence ours, 1er ennemi corrompu | `xaraMet`, skill `ours` |
| 3 | `foret_sombre_2` | totem du loup, ravins, pistes, mare aux 3 poissons, plante résistante visible inaccessible (en hauteur), mur de mousse (repulsif, acte 2), vue sur le grand arbre | `hasWolfForm`, `planteVue` |
| 4 | `grand_arbre_racines` | racines, pierres qui tombent, ennemis, feu de camp, lianes visibles mais inutilisables ; au bout de la grande branche, TOTEM DU SINGE (clé `totems` comme le loup et l'aigle ; E : `totem_monkey_dim` → `totem_monkey_lit`) qui donne DIRECTEMENT la forme singe (décision du 2026-10-25 : plus de monde spirituel) ; les singes corrompus de la branche se calment 8 s ; bulle de Xara + rappel des lianes ; les 2 lianes de la cime (forme singe obligatoire) mènent seules à l'arène | `totemSingeActif`, `hasMonkeyForm` |
| 5 | `monde_spirituel` | **hors du chemin depuis le 2026-10-25** (fichiers gardés, jouable par « Zones de test ») ; une ancienne sauvegarde qui y reprend retombe devant le totem des racines (entrée `totem_singe`, qui remplace `from_monde_spirituel`) ; ses deux sorties mènent à cette entrée | — (`mondeSpirituelFini` n'est plus posé) |
| 6 | `grand_arbre_arene` | Boss Kainati (script `kainati_arene`) au sol : charge, pierres, attaques pleine largeur (onde de choc, vague de mousse, éboulement) esquivées sur 2 lianes → épargné (inerte, parle), ouvre la route des hauteurs ; pas de combat sans forme singe (voir « Kainati ») | `kainatiIntroSeen`, `kainatiDefeated`, `kainatiCalmX` |
| 7 | `epreuve_singe` (optionnel) | longue course de lianes en 5 sections de difficulté croissante (24 lianes pendues sous des blocs, 12 288 px de large, ~14 000 px de parcours dont ~800 px d'escalade le long des lianes ; une lanterne par section, chute = lanterne ; mousse toxique `liquidFloor` en contrebas ; clés de script : pierres en rythme `rhythmRocks` (couloirs `{x, top, offset}`), marée `tides`, plateformes qui s'effritent `crumble`, pierres `rockfalls` ; singe corrompu) → talisman du singe au sommet (bout droit) | `talismanSinge`, skill `pierre` |
| 8 | `foret_flottante_1` | Geralt + Clak, duel comique (s'ouvre sur l'« Invocation du Crabe Ancestral »), carte ; puis ASCENSION verticale (P1-P9, `camera.vertical`, `levelTop: -1200`, `skyReveal`) jusqu'au belvédère au-dessus des cimes, sortie en haut à droite vers les îles | `geraltMet`, item `carte_geralt` |
| 9 | `foret_flottante_2` | îles, totem de poche cassé, Amanite (1re rencontre), totem de l'aigle, courants d'air | item `totem_poche_casse`, `amaniteMet`, `hasEagleForm` |
| 10 | `clairiere_plante` | plane jusqu'à la plante, prélève la fleur | item `fleur_resistante` |
| 11 | `hutte_morgat` | Morgat + papillons, donne la fleur (obligatoire) → repulsif ; antidote en préparation ; rampe de lancement → cinématique crash | item `repulsif`, `crashDone` |
| 12 | `foret_corrompue_1` | réveil après crash, mousse vivante, note de Geralt, murs de mousse (repulsif) | — |
| 13 | `arene_ghilt` | Boss Ghil't phase 1 → défaite imposée (script `ghilt_arene`) | `ghiltPhase=1→2` |
| 14 | `trou_sombre` | noir, papillons, bocal d'antidote, Xara : verser dans le totem de poche → compétence papillon | item `totem_poche_actif`, skill `papillon` |
| 15 | `arene_ghilt` (phase 2) | soin de Ghil't, Amanite l'achève à la lance | `ghiltHealed` |
| 16 | `bosquet_retour` | Geralt explique au chef, Amanite part furieuse, Xara reconnaît un symbole, fin → EndScreen « à suivre » | `demoFinished` |

Le passage `mossWalls` de `foret_sombre_2` (ouvert avec le repulsif) mène à un secret
(cœur bonus / raccourci). Les anciennes zones (Zone1…Zone5, zonetest, SousGrotte,
ZoneAquatique) restent intactes, accessibles depuis le menu titre « Zones de test ».

### Forêt sombre (acte 1) — connexions, flags, mur de répulsif
- `foret_sombre_1` — entrées `from_bosquet` (x 140, arrivée du bannissement) et
  `from_foret_sombre_2` (x 3700). Sortie droite → `ForetSombre2Scene` `{enterId:
  'from_foret_sombre_1'}`. Pas de retour au bosquet (bannie). Amas `mossBlocks` id
  `amas_racines` (flag `moss_foret_sombre_1_amas_racines`) sous un mur de racines ;
  le trigger `talisman` donne `{skill:'ours'}` + énergie pleine (filet : le talisman
  recharge l'énergie près de l'amas tant qu'il n'est pas brisé). Feu de camp x 1640.
- `foret_sombre_2` — entrées `from_foret_sombre_1` (x 110), `from_racines` (x 5760,
  pour la sortie gauche des racines), `from_hutte_morgat` (x 4960, DANS la poche
  derrière le mur : le sentier de la hutte y débouche). Sorties : gauche →
  `ForetSombre1Scene` `from_foret_sombre_2` ; droite → `GrandArbreRacinesScene`
  `{enterId: 'from_foret_sombre'}` ; bord BAS, trou x 4992-5120 au fond de la poche →
  `HutteMorgatScene` `{enterId: 'from_foret_sombre'}`, où elle tombe du haut de l'écran
  (accessible seulement mur ouvert).
- Mur de répulsif : `mossWalls` id **`mur_repulsif_foret_sombre`** (flag
  `mosswall_foret_sombre_2_mur_repulsif_foret_sombre`), x 4384, sous le surplomb ;
  s'ouvre des deux côtés avec l'objet `repulsif`. Derrière : graine de chêne-cœur
  → flag **`coeurBonusForet`** = +1 cœur max permanent (lu par
  `Player.recomputeTotemBonuses`).
- Autres flags : `xaraMet` (FS1), `hasWolfForm` (totem FS2, sur la butte x 896,
  accessible sans loup), `planteVue` (trigger `plante`, FS2). Ravin de 5 cases
  (x 1280-1600, 3 cases plates d'élan avant) : loup obligatoire ; ravin de 9 cases (x 2816-3392) :
  `hiddenPlatforms` gx 46-48 et 51-52 (gy 6) révélées par le loup. Mare aux trois
  poissons dessinée par le script (pas de clé `water`). `levelHeight: 720` +
  `fall: {y: 620, mode: 'hurt'}` pour que les chutes se déclenchent.
- Level design : éviter une face de 2 cases ou plus qui part directement du sol
  (le joueur peut rester coincé contre, à cause de la hitbox 3/4 des tuiles
  d'herbe) — préférer des marches d'une case.

Formes : emplacement **sol** = loup ; emplacement **aérien** = singe OU aigle (exclusifs,
choix au feu de camp) ; sans forme aérienne, un seul saut (le double saut de base a été
retiré). Singe : saut moins haut + accroche auto aux lianes + balancement ; Aigle : double
saut plus haut + plané (+ courants d'air). Pieuvre : conservée (emplacement eau) mais hors
histoire. Le papillon n'est qu'une compétence (soin), jamais une forme ni un 2e saut.

Compétences : `ours` (existante, fracas — détruit `mossBlocks`), `pierre` (talisman du
singe : projectile de pierre en cloche), `papillon` (soin : touche un ennemi `corrupted`
→ `heal()`), `crapaud` (existante, hors histoire).

Détails compétences (agent Formes) :
- `SKILL_DEFS.pierre` (coût 20) et `SKILL_DEFS.papillon` (coût 40) sont dans
  `src/entities/Projectiles.js`, compétences **instantanées** (`onActivate(player, now)`) :
  elles gèrent elles-mêmes leurs collisions et **ne passent PAS par `getSkillHitbox()`**.
  Pierre : projectile physique → `enemy.takeHit(pierre)` sinon `enemy.defeat()`, +énergie.
  Papillon : nuée (`player.getHealHitbox()`), itère `scene.enemies` + `scene.healTargets`
  (tableau optionnel pour un boss hors groupe) ; émet `'papillon-swarm'` (rect) chaque frame
  et `'papillon-heal'` (enemy) au soin.
- **Compétences « avec la forme »** (2026-10-23, `Player.startSkillFormPose(kind, now,
  {onRelease})`, visuel seul : corps physique, énergie et délais inchangés ; seulement depuis
  la forme humaine, sinon comportement d'avant). **Pierre** : transfo `transfo_singe` (150 ms)
  → singe qui lance (anim `throw` du manifest `singe_extra`, repli `singe`, si l'art existe, sinon singe debout +
  élan du corps, 260 ms ; la pierre part à 45 % du geste, de la main) → transfo inverse
  (150 ms) ; relance pendant la pose = nouveau lancer sans retransformation. **Papillon** :
  transfo `transfo_papillon` (180 ms) → papillon qui incante (anim `cast` de
  `forme_papillon_extra`, repli `forme_papillon` cast, si l'art existe, sinon `glide`/`flap`,
  400 ms) → transfo inverse (160 ms) : 740 ms au total comme avant
  (`SKILL_FORM_POSE_MS.papillon`). Papillon centré 48 px au-dessus des pieds, AU CENTRE de la
  nuée qui tourbillonne autour de lui 420 ms (`PAPILLON_HOLD_MS`) puis file devant et finit au
  même endroit qu'avant (portée du soin inchangée). Depuis le lot n°10 (vrai papillon lunaire,
  mêmes ids) : images tirées de l'horloge de la pose (un ralenti ne coupe plus l'incantation,
  chaque image de la transfo est montrée), échelle et hauteur interpolées d'Agarica au
  papillon (plus de saut ×1,46 ni de pieds décollés), étincelles d'ailes
  `fx_etincelle_papillon` toutes les 110 ms, petite lueur au début et à la fin, traînée
  `fx_trainee_papillon` derrière chaque papillon de la nuée. `player.retimeSkillFormPose(now,
  { in, act, out })` change les durées d'une pose EN COURS sans saut d'image (sauvetage de
  Ghil't : `GH_SOIN_POSE_MS` = 290 / 640 / 290 ms, rythme peint, via `ghFinishSkillPose` qui
  termine ensuite la pose et ramène Agarica au repos pendant le panoramique : durée de la
  cinématique inchangée). Sans art de transfo : gerbe de feuilles / poussière lumineuse.
  Interrompue par un coup reçu, une pose narrative, une liane.
- **Règle pour LevelKit (Fondation)** : si une boucle générique applique une hitbox de
  compétence aux ennemis, elle DOIT appeler `SKILL_DEFS[id].onHitEnemy(player, enemy)`
  quand il existe AU LIEU de `takeHit`/`defeat` (papillon → `heal()`, ne tue jamais).
  `getSkillHitbox()` ne renvoie que les hitbox « dégâts » (ours, crapaud).
- mossBlocks : `player.getSkillHitbox() && player.skillHitboxId === 'ours'`
  (`player.activeSkillId` vaut aussi 'ours' pendant la transfo ; `player.lastSkillId` =
  dernière compétence lancée, instantanées comprises).

## Répartition (vague 1 : en parallèle)

| Agent | Propriétaire de | Port |
|---|---|---|
| Fondation | `src/utils/StoryKit.js`, `src/scenes/DialogueScene.js`, `src/scenes/InventoryScene.js`, `src/scenes/MapScene.js`, `src/scenes/TitleScene.js`, `src/utils/LevelKit.js` (hooks, registre ennemis, combat takeHit, freeze), `src/scenes/BootScene.js` (chargement manifest + titre → TitleScene), `src/scenes/PrologueScene.js`, `src/scenes/EndScreenScene.js` | 8811 |
| Formes | `src/entities/Player.js`, `src/scenes/CampfireMenuScene.js`, `src/entities/Xara.js`, `src/entities/Liane.js`, `src/entities/Piste.js`, `src/entities/CourantAir.js`, `src/entities/Projectiles.js` (pierre) | 8812 |
| Kainati | `src/entities/Kainati.js` (boss + pierres + esprit), `src/story/boss_kainati.js` (ZONE_SCRIPTS `kainati_arene`) | 8813 |
| Ghil't | `src/entities/Ghilt.js`, `src/story/boss_ghilt.js` (ZONE_SCRIPTS `ghilt_arene`) | 8814 |
| Ennemis | `src/entities/LoupSanguinaire.js`, `Araignee.js`, `Web.js`, `LoupAlpha.js`, `Corbeau.js`, `Crapaud.js`, nouveaux `MousseCreature.js`, `SingeCorrompu.js`, `CrapaudCorrompu.js` (+ `CrapaudPiege.js`, 2026-11-08), `Animaux.js` (cochons, poissons, papillons décor) | 8815 |

Vague 2 (après la vague 1) : Acte 1 (`src/story/acte1.js`, zones 1-7), Acte 2
(`src/story/acte2.js`, zones 8-16), Éditeur (`src/scenes/EditorScene.js`, `index.html`
#editor-ui) pour placer les nouvelles clés.

## Niveaux et histoire — règles (agent Niveaux 2, 2026-10-23)
- **Lianes** : chaque liane pend sous une case solide (attache = haut de la case + 64,
  x dans la case) ; dans un enchaînement, écarts réglés pour le lâcher puissant (il
  faut de l'élan, la liane précédente seule n'atteint jamais l'appui suivant).
  Racines : 2 + 2 lianes à 448 px (épreuve à gauche, cime à droite) ; monde spirituel : 4 (2 par vide, tutoriel) ;
  arène de Kainati : 2 (x 792 et 1192, y 64, longueur 170 ; 4 avant le 2026-10-25) ; épreuve : 24.
- **Saut simple sur le chemin critique** (avant le singe) : marches de 1-2 cases, ravin
  de 5 cases de la forêt sombre 2 précédé de 3 cases plates (fenêtre d'appel du loup
  x ≈ 1180-1340) ; aucune marche de 3 cases avant le singe.
- **Forêt flottante 1/2** : caméra verticale + ciel (`skyReveal`) ; FF2 en plein jour
  (`skyReveal: { start: -1, end: 0, leaves: false }`, `largeTrees: false` dans la donnée,
  plus forcés par les scènes). Plus de plafond `a2Ceiling` quand `camera.vertical`.
- **Bandes de liquide/brume** (`liquidFloor` + `backgroundBaseline`) : épreuve (mousse),
  FF1 (brume), FF2 (brume), monde spirituel (brume), hutte (brume au-delà de la falaise).
- **Réapparition** : forêt corrompue 1, après le mur de mousse qui se referme (x 700)
  et aux feux (`acte1RespawnAfter`) -- sinon une mort ramenait derrière le mur, coincée.
- Formes provisoires sombres dessinées par code retirées (silhouette du grand arbre en
  FS2, tronc des racines et collage de pans d'écorce, îles/horizon de FF2, horizon de la
  hutte, marches du vieux sentier) ; murs de l'arène de Ghil't en art `mousse_mur`.

## Poses narratives d'Agarica (orchestrateur, 2026-10-05)
Art Codex `agarica_extra` importé (rangées jump_rise, jump_fall, hurt, death, talk, sad ; liane_hang/liane_swing/cast/receive_item à venir).
- Étape de cinématique `{playerPose: 'sad'}` (tenue jusqu'à `{playerPose: null}` ou fin de cinématique). Une réplique de dialogue peut aussi porter `pose: 'cast'`.
- Automatique : Agarica prend `talk` quand elle parle (`who: 'agarica'`), sauf pose tenue ; `death` au dernier cœur perdu (1,1 s, monde gelé) ; `hurt` / `jump_*` dans Player.update.
- Sans art pour une pose : aucun effet (comportement historique). Helper : `setPlayerStoryPose(scene, anim|null)`.
