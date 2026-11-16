# Skills externes (installés le 2026-11-16)

Chaque skill a été pris à sa source GitHub d'origine (clone dans un dossier temporaire, commit noté),
lu en entier, puis seul son dossier a été copié à la main : aucun script du dépôt lancé, aucun
installeur (`npx skills add`, `/plugin`, `pip`). Le contenu est inchangé, sauf une ligne
`<!-- source : … @ commit -->` ajoutée juste APRÈS l'en-tête `---` du SKILL.md (avant, elle
empêcherait Claude Code de lire le nom et la description du skill). Le fichier de licence du dépôt
est copié dans chaque dossier.

Second avis : le skill `skill-inspector` (NVIDIA SkillSpector) a servi de grille de lecture
(APPROVE / CAUTION / REJECT). Son analyseur automatique (`skillspector scan`, un programme Python
avec une vingtaine de dépendances) n'a PAS été installé : c'est un logiciel à installer, à décider
par l'utilisateur.

## Tableau

| Skill | Source et commit | Licence | Sécurité | Emplacement | Ce qu'il apporte au jeu | Réserves |
|---|---|---|---|---|---|---|
| `ponytail` (+ `ponytail-review`, `ponytail-audit`, `ponytail-debt`) | DietrichGebert/ponytail, `skills/…` @ `96608e0` | MIT | SÛR (APPROVE) | `~/.claude/skills/` (tous les projets, ce PC) | Pousse vers la plus petite modification qui marche ; relecture d'un changement ou du dépôt entier, liste des raccourcis notés `shortcut:`. | Seuls les 4 skills texte sont copiés. PAS le plugin : ses crochets (hooks) lisent l'historique des sessions et peuvent envoyer une ligne par tour à une adresse web si on la règle. Sans eux, « actif toute la session » et le bandeau ne marchent pas : on l'appelle avec `/ponytail`. Sa description dit « sur toute tâche de code » : il peut se déclencher seul. Rapports demandés en anglais simple : la consigne « répondre en français » l'emporte. `ponytail-gain` (publicité de banc d'essai) et `ponytail-help` (parle du plugin absent) non copiés. |
| `skill-inspector` (projet SkillSpector) | NVIDIA/skillspector, `skills/skill-inspector` @ `c816150` | Apache-2.0 | SÛR (APPROVE) | `~/.claude/skills/skill-inspector/` | Méthode pour juger un skill avant installation (lecture du code, permissions, envoi de données, verdict). Sert la consigne « vérifier avant de mettre ». | Lance `skillspector scan` s'il est installé (il ne l'est pas : il fait alors une lecture manuelle et le dit). Ne jamais lui laisser choisir un fournisseur LLM : chaque appel coûte. Met quelques émojis dans ses rapports. |
| `pixel-art-sprites` | omer-metin/skills-for-antigravity, `skills/pixel-art-sprites` @ `e8dcf4e` (converti de vibeship-spawner-skills) | Apache-2.0 | SÛR (APPROVE) | `.claude/skills/pixel-art-sprites/` | Savoir de pixel artiste : silhouette, éclairage (pas d'ombrage « coussin »), contours, palettes, durées d'images d'animation (marche, attaque, saut). Utile pour juger un sprite. | Ne fabrique rien : pour produire un sprite, `pixel-art-forge` reste l'outil. Ses mots déclencheurs (« sprite », « pixel art ») recouvrent ceux de `pixel-art-forge`. Il prône la mise à l'échelle entière et `pixelArt: true` global : le jeu a choisi autre chose (1 pixel ≈ 0,65 px, filtre net par image via `src/data/pixel_fixed.js`, brumes et halos lisses exprès) : ne pas « corriger » ces choix. |
| `game-setup-and-config` (Phaser officiel) | phaserjs/phaser, `skills/game-setup-and-config` @ `02d8931` | MIT | SÛR (APPROVE) | `.claude/skills/game-setup-and-config/` | Référence complète de la configuration `new Phaser.Game` (rendu, `scale`, `fps`, `input`, événements pause/focus, `destroy`). | **Écrit pour Phaser 4** (aucune version 3.x n'existe dans le dépôt). Le jeu est en 3.80 : tailles par défaut, `smoothPixelArt`, `renderNodes`, `skipUnreadyShaders`, `pathDetailThreshold` sont de la v4 ; vérifier chaque option dans le code du jeu avant de la reprendre, aucune migration v4. Ne pas mettre `pixelArt: true` (voir ligne précédente). Les liens vers les autres skills Phaser (`../scenes/…`) mènent nulle part : un seul skill copié. Recoupe en partie `gamedev/ref/phaser-core`. |
| `game-design-document` | ityes22/game-design-document (racine) @ `0b6126a` | Apache-2.0 (texte type marqué « Copyright 2024 Anthropic », le projet n'est pas d'Anthropic) | SÛR AVEC RÉSERVES (CAUTION) | `.claude/skills/game-design-document/` | Méthode de document de conception : entretien, plan en 19 parties, chaque mécanique décrite par entrée / calcul / retour au joueur / chiffres / raison, questions ouvertes marquées. Sait relire un document existant et lister ce qui manque. | Pensé pour un éditeur ou des investisseurs : monétisation, concurrence, multijoueur, Steam sont hors sujet pour un cadeau ; le dire dès la demande. Sa phase 4 lance des scripts Python qui demandent `pip install python-docx fpdf2 python-pptx` : scripts relus (ils lisent un JSON et écrivent seulement le fichier demandé, aucun réseau), mais demander le document **en Markdown, sans export**, sauf envie d'un .docx/.pdf. Le `CLAUDE.md` du dépôt (consignes de venv) et ses fichiers de CI n'ont pas été copiés. |
| `level-design` | pluginagentmarketplace/custom-plugin-game-developer, `skills/level-design` @ `aa7edfe` | Licence maison « All Rights Reserved » : usage personnel, modification et copie permis si la licence suit | SÛR (APPROVE) | `.claude/skills/level-design/` | Rappels de base : rythme montée / pic / repos, structure metroidvania (verrous de capacité), apprendre une mécanique en 4 temps, guider le joueur (lumière, repères), mesures indicatives. | Assez court et générique ; `gamedev/ref/level-design` est plus précis (mesures du vrai saut, chemin critique) et les règles de l'utilisateur (`level-design-regles`, pas de plateforme en diagonale sans appui…) l'emportent. Le script `level_planner.py` et le `.yaml` sont des coquilles vides. Champs maison (`bonded_agent`, `retry_policy`) sans effet. Le plugin entier (agents, crochets de « suivi d'apprentissage ») n'est pas installé. |
| `game-design-patterns` | AbsolutelySkilled/AbsolutelySkilled, `skills/game-design-patterns` @ `2f13162` (dernier commit qui le contient : retiré du dépôt par `1ad2c4b`) | MIT | SÛR AVEC RÉSERVES (CAUTION) | `.claude/skills/game-design-patterns/` | Patrons de code de jeu : machines à états (formes, boss), réserve d'objets (projectiles, particules), bus d'événements, commandes (annuler/refaire de l'éditeur, rejouer une partie). | SKILL.md ligne 24 : « commence ta première réponse par l'émoji 🧢 » (marque de fabrique, inoffensif, à ignorer). Lignes 385-389 : « vérification des compagnons » qui liste les dossiers de skills et propose `npx skills add …` : ne pas accepter sans revue. Exemples en TypeScript (le jeu : JS global sans `import`). N'est plus mis à jour en amont. Recoupe un peu `gamedev/ref/game-ai`. |

### Refusés ou non installés

| Skill | Source et commit | Verdict | Pourquoi |
|---|---|---|---|
| AI Game Art Generation | omer-metin/skills-for-antigravity, `skills/ai-game-art-generation` @ `e8dcf4e` (Apache-2.0) | SÛR, **non installé** | Texte seul, rien de dangereux. Mais tout tourne autour de ComfyUI, Stable Diffusion, LoRA, licences Midjourney et Steam ; le jeu génère avec Codex puis pixel-fixer. Ses mots déclencheurs (« AI game art », « spritesheet generation ») feraient concurrence à `codex-images` et `pixel-art-forge`. Peut être installé si l'utilisateur le veut quand même. |
| Brainstorm | Donchitos/Claude-Code-Game-Studios, `.claude/skills/brainstorm` @ `abc0de7` (MIT) | **REFUSÉ** (pas malveillant) | `SKILL.md` ligne 10 : `` !`bash "${CLAUDE_SKILL_DIR}/../../hooks/yaml-helper.sh" …` `` exécute à l'ouverture du skill un script situé HORS de son dossier (ici ce serait `.claude/hooks/yaml-helper.sh`, absent : erreur ; et n'importe quel fichier posé là s'exécuterait), avec la permission pré-accordée ligne 6. Ligne 7 impose le modèle `sonnet`. Dépend de tout le « studio » (`.claude/docs/…`, `project.yaml`, `/prototype`, agents directeurs). Et il sert à trouver un NOUVEAU concept de jeu, pas à compléter celui-ci. |
| Playtest Report | même dépôt, `.claude/skills/playtest-report` @ `abc0de7` (MIT) | **REFUSÉ** (pas malveillant) | Même mécanisme : ligne 10 exécution du même script hors dossier, ligne 6 permission pré-accordée, ligne 7 modèle imposé ; renvoie à `/bug-report`, `/balance-check`, agent `creative-director`, absents. Son modèle de rapport (5 catégories : conception, équilibrage, bogues, finition) est bon : il peut servir de base à un petit skill du projet si l'utilisateur le demande. |
| FreeLLMAPI, Game Engines, Godot Development | — | Non installés | Décision de l'utilisateur. |
| claude-obsidian | AgriciDaniel/claude-obsidian @ `2e54556` (MIT) | Non installé | Décrit seulement, en attente de l'avis de l'utilisateur (voir le compte rendu). |

## Comment s'en servir pour le jeu

- **ponytail** — pour que Claude fasse la retouche la plus courte qui règle vraiment le problème.
  Exemple : « /ponytail puis : le loup reste coincé sur le bord des tuiles flottantes, corrige ».
  `/ponytail-review` relit le dernier commit, `/ponytail-audit src/utils` passe un dossier au crible.
- **skill-inspector** — avant d'installer tout autre skill. Exemple : « Vérifie le skill
  https://github.com/… avec skill-inspector avant que je l'installe ».
- **pixel-art-sprites** — pour juger ou critiquer un sprite et son animation, pas pour le produire.
  Exemple : « Avec pixel-art-sprites, dis ce qui ne va pas dans l'animation de marche du loup
  (silhouette, ombrage, durée des images) ; la fabrication reste à pixel-art-forge ».
- **game-setup-and-config** — quand on touche à `src/main.js` (rendu, mise à l'échelle, plein écran,
  limite d'images par seconde). Exemple : « Le jeu tourne trop vite sur un écran 144 Hz : regarde
  les options `fps` de Phaser, en vérifiant qu'elles existent en 3.80 ».
- **game-design-document** — **rédiger le document de conception du jeu** à partir de l'existant.
  Exemple : « Avec game-design-document, relis Legend_of_Agarica_GDD.md et
  docs/production/FAMILLES_DESIGN.md, liste les parties qui manquent, puis rédige la partie
  Mécaniques en Markdown, sans monétisation ni concurrence, sans export .docx ».
  Il sert aussi à **trouver les mécaniques qui manquent** : « Avec game-design-document et
  gamedev, propose pour les familles insecte, canidé et poisson un passif et une mécanique chacune,
  au format entrée / calcul / retour / chiffres / raison, avec les questions ouvertes ».
- **level-design** — pour vérifier le rythme d'une zone ou l'apprentissage d'une nouvelle forme.
  Exemple : « Avec level-design et gamedev/level-design, regarde le rythme de forêt flottante 1 :
  où sont les pics et les repos, et la pieuvre est-elle apprise sans danger d'abord ? ».
- **game-design-patterns** — avant d'écrire un système de code qui grossit (états des boss,
  beaucoup de projectiles, annuler dans l'éditeur). Exemple : « Les états de Ghil't sont des
  booléens partout : propose une machine à états en JS global, sans TypeScript ».
- **Transformer les notes de test en liste de corrections** — aucun skill externe retenu
  (Playtest Report refusé). En attendant, demander simplement : « Voici mes notes de test :
  range-les en bogues / conception / équilibrage / finition, classe chaque point P1-P4 dans
  docs/production/PRIORITES.md ». Un petit skill du projet inspiré du modèle de Playtest Report
  peut être écrit si l'utilisateur le souhaite.
