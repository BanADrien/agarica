# Règles communes à tout agent lancé sur le projet

À lire en entier avant de commencer. Le brief que tu as reçu ne répète pas ces règles : il
donne seulement l'objectif, les fichiers et les décisions propres à ta tâche. En cas de
conflit, le brief l'emporte.

## Le projet

- Lis `CLAUDE.md` (racine) : structure, contrôles, outils. Le contrat d'API est
  `docs/production/PLAN_DEV.md` : reste rétro-compatible avec lui et ajoute-y une courte
  section pour tout ce que tu crées (clés de zone, drapeaux, fonctions publiques).
- JavaScript pur + Phaser 3.80, scripts globaux chargés par `index.html`, aucun build.
- Réponds et commente en français. Les commentaires expliquent le « pourquoi ».
- Textes affichés au joueur : `docs/production/STYLE_DIALOGUES.md` (court, parlé).
- Données de zone écrites à la main, compatibles avec l'éditeur.
- Règle de niveaux : jamais deux cases de sol qui ne se touchent que par un coin (ajouter la
  case du coin). Pas de faux sol de second plan au fond d'un trou où l'on ne descend pas.
- Chaque image a un repli : un élément sans image s'affiche en provisoire, sans erreur.
- Une sauvegarde existante doit toujours se charger et se jouer comme avant.

## Interdits

- Pas de commit, pas de push.
- Ne touche pas à `assets.zip`, ni à `CLAUDE.md`, ni à `docs/production/PRIORITES.md`.
- Ne modifie que les fichiers que ton brief te donne. S'il en faut un autre, dis-le dans ton
  compte rendu au lieu de le faire.
- N'utilise pas `tools/dev_server.py` (son bouton Save réécrit les fichiers de zone).
- N'arrête pas le serveur du port 8000 (celui de l'utilisateur) et ne t'en sers pas.

## Tests

- **Un seul navigateur sans fenêtre à la fois.** Jamais deux en parallèle, jamais de test
  lancé en arrière-plan pendant qu'un autre tourne : le PC de l'utilisateur sature.
- Ports : ceux de ton brief ; à défaut 9781 à 9799.
- Commandes prêtes (sortie courte, à préférer à tout script maison) :
  - `python tools/verif.py` : toutes les scènes, l'éditeur et la règle des diagonales.
    `--scenes A,B` pour quelques scènes, `--robot fs1 fs2` pour faire jouer le chemin
    principal par le robot (`--robot tout` : tout le chemin, long).
  - `python tools/capture.py <zone> --x … --y … [--flags a=b] [--keys …] [--js …] [--zoom x,y,l,h]` :
    une capture à un endroit précis, plus un gros plan.
  - `python tools/playtest.py --port … --scene … --flags cle=valeur --pre-js "…" --keys "ArrowRight:1500" --js "…" --shot x.png` :
    le harnais de base. UNE clé par `--flags`. Ordre : `--pre-js`, `--keys`, `--js`, capture.
    Le jeu est dans `window.__game`. Une cinématique de début de zone bloque les touches :
    passe les drapeaux qui l'évitent.
- Prouve chaque mécanique par une mesure dans le jeu, pas par la seule lecture du code.
- Regarde tes captures toi-même et corrige ce qui est illisible.
- À la fin : une seule passe de `python tools/verif.py`, plus le robot si tu as touché au
  joueur, aux commandes ou à une zone du chemin principal.
- Scripts et captures de travail : dans un dossier temporaire, jamais dans le projet. Écris
  les chemins Windows en entier (`C:\…` ou `C:/…`), jamais `/c/…`.

## Si ça coince

Si un point bloque ou s'annonce très long, mets-le de côté proprement (désactivé, le jeu
reste jouable) et rends une version testable. L'utilisateur préfère une version testable
vite à une version complète.

## Compte rendu

En français, 25 lignes au plus, dans cet ordre :
1. ce qui est fait, point par point ;
2. comment c'est vérifié (mesures, commandes) ;
3. comment l'utilisateur l'essaie (adresse exacte, touches) ;
4. écarts avec le brief ou la conception, et pourquoi ;
5. fichiers modifiés et créés ;
6. chemins absolus des captures ;
7. ce qui est mis de côté, incertain, ou à décider.
