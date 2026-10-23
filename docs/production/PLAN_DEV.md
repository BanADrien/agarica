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
  Sauvegarde : à chaque feu de camp + à chaque entrée de zone (`lastZone`, `lastEnterId`).
- Inventaire (objets-clés de l'histoire) : `inventoryAdd(scene, id, {silent})` (popup
  « Objet obtenu » avec `addItemImage`), `inventoryHas(id)`, `inventoryRemove(id)`,
  `inventoryList()`. Écran inventaire touche **I** (`InventoryScene`, overlay, monde gelé),
  avec la carte de Geralt (touche **M** → `MapScene`) si `inventoryHas('carte_geralt')`.
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
  actif ou `scene.__cutsceneLock`. `updateLevelFromData` l'utilise.
- `showBossBar(scene, name, getRatio)` / `hideBossBar(scene)` — barre de vie de boss HUD.
- `showToast(scene, text, ms)` — petit texte informatif à l'écran (indices de Xara, etc.).

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
  `ambient: {tint: 0xRRGGBB, darkness: 0..1}` — voile de couleur (forêt corrompue, trou sombre).
- `xara: false` — pas de Xara dans la zone (sinon Xara présente si `storyGet('xaraMet')`).
- `npcs: [{id, x, y, anim?, facing?, talk?: dialogueId | cutsceneId, requires?, forbids?, name?}]`
  → PNJ (`scene.npcs[id]`), invite « E : parler » à portée ; `talk` lance
  `runCutscene` si l'id existe dans CUTSCENES, sinon `showDialogue`.
- `triggers: [{id?, x, y, w, h, cutscene, once?: true, requires?, forbids?}]` — zone
  invisible qui lance une cinématique quand le joueur y entre. `once` mémorisé via flag
  `trig_<zone>_<id>`.
- `pickups: [{item, x, y, requires?, cutscene?}]` — objet ramassable (E), disparaît si déjà
  dans l'inventaire.
- `mossBlocks: [{x, y, w, h}]` — amas de mousse solide, détruit par la compétence `ours`
  (hitbox de compétence qui le touche) ; mémorisé par flag.
- `mossWalls: [{id, x, y, w, h}]` — mur de mousse ; s'ouvre si le joueur a l'objet
  `repulsif` et appuie sur E devant (petite animation de dissolution), mémorisé.
- `fall: {y, mode: 'hurt'|'respawn'|'scene', scene?, data?}` — chute dans le vide.
- `script: 'id'` — `ZONE_SCRIPTS[id] = { create(scene), update(scene, time, delta) }`
  pour la logique spécifique d'une zone (boss, événements) sans écrire dans la scène
  (les fichiers Scene restent le gabarit générique de l'éditeur).
- `checkpoints: [{x, y}]` — point de réapparition (sans menu), utilisé par l'épreuve du singe.

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
- Débloquer une forme aérienne en cours de jeu (flag posé au registre OU sur `player`) la rend
  automatiquement active (`airForm`). Totems LevelKit et triche Ctrl+Shift+D restent
  compatibles (la triche Player ajoute `hasMonkeyForm` sans changer l'aigle).
  `storySet('airForm', 'monkey')` est aussi suivi en direct.
- `player.getActiveAirForm()`, `player.equipForm(id)`, `player.unequipForm(id)`,
  `player.vine` (liane tenue ou null), `player.form` ∈ agarica/wolf/eagle/monkey/octopus.
- Double saut : sans forme aérienne = saut simple -450 (pas de transfo) ; singe = -500 +
  forme singe + accroche aux lianes ; aigle = -550 + plané (inchangé).

Ennemis : `ENEMY_REGISTRY[type] = (scene, e) => instance` (Fondation migre les types
existants : araignee, loup, loupAlpha, corbeau, crapaud). Chaque fichier d'entité s'enregistre
lui-même en bas de fichier. Combat : si `enemy.takeHit` existe, LevelKit appelle
`enemy.takeHit(source)` (une seule fois par attaque/compétence grâce à un verrou par
attaque) sinon `enemy.defeat()`. Ennemis corrompus : `enemy.corrupted = true` et
`enemy.heal()` (appelée par la compétence `papillon`). `enemy.harmless`, `enemy.noGravity`.

Types d'ennemis enregistrés (agent **Ennemis**), entrée `enemies: [{type, x, y, …}]` :

| type | Classe (fichier) | Paramètres de donnée | PV / notes |
|---|---|---|---|
| `loup` | LoupSanguinaire | `patrolMinX`/`patrolMaxX` (déf. x±150) | 1 ; patrouille, charge si joueur à <220 px. Art `loup_sanguinaire` (patrol/charge/bite) |
| `araignee` | Araignee | — | 1 ; fixe, `harmless`, `noGravity`. Art `araignee` (idle/attack ; walk inutilisé) |
| `loupAlpha` | LoupAlpha | `patrolMinX`/`patrolMaxX` (déf. x±150) | 3 (`takeHit`, `maxHp`), boss Zone5 |
| `corbeau` | Corbeau | `patrolMinX`/`patrolMaxX` (déf. x±150), `diveDepth` (déf. 220) | 1 ; `noGravity`, piqué quand le joueur passe dessous |
| `crapaud` | Crapaud | — | 1 ; fixe, langue vers la droite |
| `mousse_creature` | MousseCreature | `patrolMinX`/`patrolMaxX` (déf. x±150 via LevelKit, ne les dépasse pas), `hp` (déf. 1) | corrompu ; rampe vers le joueur (<260 px), se tasse 0,4 s puis bondit. Art `mousse_creature` (idle/attack/death) |
| `singe_corrompu` | SingeCorrompu | `patrolMinX`/`patrolMaxX` (déf. x±150 via LevelKit), `hp` (déf. 2) | corrompu ; garde ses distances (170-360 px), lève une pierre 0,5 s puis la lance en cloche (`player.hitByEnemy()`, brisée au sol). Art `singe_corrompu` (idle/run/throw) |
| `crapaud_corrompu` | CrapaudCorrompu (hérite de Crapaud) | `hp` (déf. 2) | corrompu ; teinte toxique + aura + gouttes, ou art `crapaud_corrompu` (anim `attack` 5 frames, canvas 1434x237 comme crapaud_frames ; `idle` inutilisé) |

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
sol), trottinent dans ±w/2, sautent et s'écartent quand Agarica approche. Poissons : TOUJOURS 3,
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
  Feu de camp (zones de l'histoire seulement) : sauvegarde à l'ouverture et à la fermeture
  du menu. Les zones de test ne sauvegardent jamais d'elles-mêmes. `hasSaveGame()` exige
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
  Objets sans art prévu (`note_geralt`) : icône dessinée par code (`STORY_DRAWN_ITEMS`).
- **Clé de zone `tileset: 'tuiles_ecorce'`** (TILESET_MANIFEST) : cases chargées sous
  `<id>:<clé>`, case absente → jeu par défaut.
- **Dev** : `index.html?zone=foret_sombre_1&flags=xaraMet,hearts=2[&load][&enter=id]`.

### Placement au sol (2026-10-22, rétro-compatible)
- **Surface de marche** = haut de la hitbox des tuiles (16 px sous le haut de l'image
  des tuiles d'herbe) : pieds d'Agarica, des PNJ, des animaux, bas des props, feux de
  camp, totems. `groundSurfaceYAt` / `groundStandYAt` / `storyStandY` n'utilisent plus
  que les tuiles à découvert (`openGroundTilesAt(scene, x)`) : la case cachée sous une
  marche n'est plus jamais choisie.
- **Pixels visibles** (LevelKit) : `propTopYAt(scene, x, type?)` (haut visible du prop
  sous x ; props gardés dans `scene.props`, `img.propType`), `visibleTopYAt(obj, x)`,
  `visibleBottomY(obj)`, `setVisibleBottomY(obj, y)`. Lecture alpha mise en cache ;
  en `file://` (canvas tainted) repli sur le cadre de l'image.
- **PNJ** : `npcs[i].onProp: true | 'type_de_prop'` → pieds sur le haut visible du
  décor sous lui (Xara sur sa souche) ; prioritaire sur `y`. L'éditeur en tient compte.
  `storyPlaceOnProp(scene, obj, x, propType, fallbackY)` pose un objet sur un décor
  (idole sur l'autel `bosquet_antler_totem`).
- **Déplacements** : `npcMove` fait suivre le relief aux pieds du PNJ
  (`storyFollowGround(scene, obj, dt, {dir, speed, footOffset, snap})` : marche montée
  dès que l'avant des pieds la touche, descendue quand le centre la dépasse, ~0,1 s par
  case ; marche > `STORY_MAX_STEP` = autre couche). `playerMove` saute les marches qui
  le bloquent. Bébés cochons : posés sur la surface et suivent le relief.
- **Props du bosquet** : `bosquet_grove` (3 arbres, les 2 petits flottaient) découpé par
  `tools/split_grove.py` en `bosquet_grand_arbre`, `bosquet_arbre`, `bosquet_arbre_2`
  (à utiliser) ; `bosquet_grove` reste déclaré pour les anciens brouillons.

## Progression & flags d'histoire (noms figés)

| Ordre | Zone (nom snake → Scene / DATA) | Événements | Flags posés |
|---|---|---|---|
| 1 | `bosquet` → BosquetScene | habitants vs mousse, aide (gratter), 3 bébés cochons, père → talisman ours, vol idole par Amanite, Agarica ment, bannissement | `talismanOurs` (item `talisman_ours`), `banished` |
| 2 | `foret_sombre_1` | désespoir, rencontre Xara, amas de mousse bloquant, talisman réagit → compétence ours, 1er ennemi corrompu | `xaraMet`, skill `ours` |
| 3 | `foret_sombre_2` | totem du loup, ravins, pistes, mare aux 3 poissons, plante résistante visible inaccessible (en hauteur), mur de mousse (repulsif, acte 2), vue sur le grand arbre | `hasWolfForm`, `planteVue` |
| 4 | `grand_arbre_racines` | racines, pierres qui tombent, ennemis, feu de camp, lianes visibles mais inutilisables | — |
| 5 | `grand_arbre_arene` | Boss Kainati (script `kainati_arene`) → épargné, ouvre accès au totem du singe | `kainatiDefeated` |
| 6 | `monde_spirituel` | Kainati esprit montre les lianes → forme singe | `hasMonkeyForm` |
| 7 | `epreuve_singe` (optionnel) | course verticale lianes + checkpoints → talisman du singe | `talismanSinge`, skill `pierre` |
| 8 | `foret_flottante_1` | Geralt + Clak, duel comique, carte | `geraltMet`, item `carte_geralt` |
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
  `{enterId: 'from_foret_sombre'}` ; fond de la poche (x 5080) → `HutteMorgatScene`
  `{enterId: 'from_foret_sombre'}` (accessible seulement mur ouvert).
- Mur de répulsif : `mossWalls` id **`mur_repulsif_foret_sombre`** (flag
  `mosswall_foret_sombre_2_mur_repulsif_foret_sombre`), x 4384, sous le surplomb ;
  s'ouvre des deux côtés avec l'objet `repulsif`. Derrière : graine de chêne-cœur
  → flag **`coeurBonusForet`** = +1 cœur max permanent (lu par
  `Player.recomputeTotemBonuses`).
- Autres flags : `xaraMet` (FS1), `hasWolfForm` (totem FS2, sur la butte x 896,
  accessible sans loup), `planteVue` (trigger `plante`, FS2). Ravin de 5 cases
  (x 1152-1472) : loup obligatoire ; ravin de 9 cases (x 2816-3392) :
  `hiddenPlatforms` gx 46-48 et 51-52 (gy 6) révélées par le loup. Mare aux trois
  poissons dessinée par le script (pas de clé `water`). `levelHeight: 720` +
  `fall: {y: 620, mode: 'hurt'}` pour que les chutes se déclenchent.
- Level design : éviter une face de 2 cases ou plus qui part directement du sol
  (le joueur peut rester coincé contre, à cause de la hitbox 3/4 des tuiles
  d'herbe) — préférer des marches d'une case.

Formes : emplacement **sol** = loup ; emplacement **aérien** = singe OU aigle (exclusifs,
choix au feu de camp) ; sans forme aérienne, double saut de base simple (sans
transformation). Singe : saut moins haut + accroche auto aux lianes + balancement ;
Aigle : double saut plus haut + plané (+ courants d'air). Pieuvre : conservée (emplacement
eau) mais hors histoire.

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
| Ennemis | `src/entities/LoupSanguinaire.js`, `Araignee.js`, `Web.js`, `LoupAlpha.js`, `Corbeau.js`, `Crapaud.js`, nouveaux `MousseCreature.js`, `SingeCorrompu.js`, `CrapaudCorrompu.js`, `Animaux.js` (cochons, poissons, papillons décor) | 8815 |

Vague 2 (après la vague 1) : Acte 1 (`src/story/acte1.js`, zones 1-7), Acte 2
(`src/story/acte2.js`, zones 8-16), Éditeur (`src/scenes/EditorScene.js`, `index.html`
#editor-ui) pour placer les nouvelles clés.

## Poses narratives d'Agarica (orchestrateur, 2026-10-05)
Art Codex `agarica_extra` importé (rangées jump_rise, jump_fall, hurt, death, talk, sad ; liane_hang/liane_swing/cast/receive_item à venir).
- Étape de cinématique `{playerPose: 'sad'}` (tenue jusqu'à `{playerPose: null}` ou fin de cinématique). Une réplique de dialogue peut aussi porter `pose: 'cast'`.
- Automatique : Agarica prend `talk` quand elle parle (`who: 'agarica'`), sauf pose tenue ; `death` au dernier cœur perdu (1,1 s, monde gelé) ; `hurt` / `jump_*` dans Player.update.
- Sans art pour une pose : aucun effet (comportement historique). Helper : `setPlayerStoryPose(scene, anim|null)`.
