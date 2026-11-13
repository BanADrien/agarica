# Outils de son : Openverse, Real SFX, earshot

Installés le 2026-11-13 pour sonoriser le jeu (pas des vidéos). Aucun son n'est encore dans le
jeu. Comment trouver ou fabriquer un son : skill `son` (`.claude/skills/son/SKILL.md`).

## Ce qui est installé, et où

| Outil | Rôle | Dans le dépôt | Sur le PC (hors dépôt) |
|---|---|---|---|
| **Openverse** | chercher et télécharger des sons CC0 | `tools/son/openverse.py` (rien à installer, API sans clé) | rien |
| **earshot** 0.4.1 | « oreilles » : décrire, comparer, classer, couper, fabriquer par code (banque de 252 sons) | skills `.claude/skills/earshot/` et `real-sound/` (430 Ko), serveur MCP déclaré dans `.mcp.json` | programme : `C:\Users\<nom>\.local\share\uv\tools\earshot` (1,1 Go), commande `earshot` dans `.local\bin` ; modèles : `C:\Users\<nom>\.cache\earshot` (1,1 Go) |
| **Real SFX** (Clipwing) | 78 sons d'interface CC0 en 12 styles (936 mp3), recherche dans `assets/audio/` | skill `.claude/skills/real-sfx/` (9 Mo, dont 7,7 Mo de sons) | rien (index refait sur chaque PC) |
| **FFmpeg** 9.0.2 | conversions, demandé par les trois | rien | `winget` (665 Mo), ajouté au PATH |

- Bibliothèque du jeu : `assets/audio/` (`sfx/`, `ui/`, `musique/`, `ambiances/`), fichiers `.ogg`
  nommés comme leur identifiant `playSfx`. Registre des sources : `assets/audio/CREDITS.md`.
- Origine du code copié : `github.com/Clipwing/skills` (commit `edbefcb`, scripts sous MIT d'après
  son README, le dépôt n'a pas de fichier de licence ; sons uisfx en CC0, licences gardées dans
  `vendor/node_modules/uisfx/`) et `github.com/Leonxlnx/earshot` (commit `4ac3d2a`, MIT, fichier
  `LICENSE` copié dans les deux skills). Les scripts ont été relus avant exécution : le seul
  accès réseau est le téléchargement des modèles (Hugging Face).
- Place prise sur ce PC : environ 3,1 Go (FFmpeg 0,7, earshot 1,1, modèles 1,1, cache uv 0,25).

## Commandes utiles

```
python tools/son/openverse.py chercher "sword swing" --max 8 --duree-max 3
python tools/son/openverse.py telecharger <identifiant> --vers assets/audio/sfx/slash
python tools/son/openverse.py noter assets/audio/sfx/jump.ogg --source "earshot sfx render …"
python tools/son/openverse.py retirer assets/audio/sfx/slash.ogg
earshot doctor                                  # état de l'installation
earshot sfx list --kind whoosh                  # la banque de sons fabriqués par code
earshot sfx render swish/blade -o C:/…/x.wav    # en fabriquer un (3 s, sans modèle)
earshot describe x.wav                          # ce que le son est vraiment (15 s)
earshot rank "a fast blade swish" C:/…/essais/ --top 3
python .claude/skills/real-sfx/scripts/setup.py check
python .claude/skills/real-sfx/scripts/search.py --uisfx        # les 78 sons d'interface
python .claude/skills/real-sfx/scripts/build_index.py           # après tout ajout dans assets/audio/
```

Dans Claude, les outils MCP d'earshot (`describe`, `match`, `rank`, `find`, `ab`, `measure`,
`sfx_list`, `sfx_render`…) gardent les modèles chargés : quelques secondes par écoute. Au premier
démarrage, Claude Code demande d'approuver le serveur `earshot` du projet.

## À refaire sur l'autre PC

1. Récupérer le dépôt (skills, `.mcp.json` et `tools/son/` viennent avec).
2. `winget install Gyan.FFmpeg` (et `winget install astral-sh.uv` si uv manque), rouvrir le terminal.
3. Dans un PowerShell ordinaire :
   ```
   $env:UV_TOOL_DIR = "$HOME\.local\share\uv\tools"
   uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot@4ac3d2ac2b151e1c23376f9ce7f3047a17050013"
   uv tool update-shell          # si uv dit que .local\bin n'est pas dans le PATH
   earshot doctor --fetch        # télécharge les deux modèles, 1,1 Go
   ```
   `UV_TOOL_DIR` compte : lancée depuis l'application Claude sans lui, l'installation part dans le
   dossier privé de l'application et `earshot` ne marche plus ailleurs (constaté ici, corrigé).
   La même variable est à remettre pour `uv tool upgrade` ou `uv tool uninstall earshot`.
4. `python .claude/skills/real-sfx/scripts/build_index.py` puis `… setup.py check` (l'index n'est
   pas dans git).
5. Redémarrer Claude et approuver le serveur MCP `earshot`.

## Limites constatées

- **Rien n'est branché** : `SFX_HOOKS` est vide, il reste à écrire le chargement et le moteur de
  son. Les `.ogg` ne sont pas lus par les anciens Safari : prévoir un repli à ce moment-là.
- **La banque d'earshot vise les films, pas les jeux** : deux coups de dague fabriqués
  (`swish/blade` à 0,3 s, `whoosh_fast/whip`) ont été lus « a snare hit » et « a record scratch »,
  alors qu'un enregistrement CC0 d'Openverse a été lu « a fast whoosh » (z +4,8). Toujours faire
  écouter un candidat par earshot avant de le proposer. earshot ne juge ni le goût ni la licence.
- **Openverse** : recherche par titres et mots-clés (« wolf bite » en CC0 : aucun résultat,
  « wolf growl » : 17) ; 20 requêtes par minute, 200 par jour ; les fichiers sont les aperçus de
  Freesound (environ 128 kbit/s), les originaux demandent un compte Freesound.
- **Real SFX et real-sound sont faits pour des vidéos** (repérage d'images, mixage, export MP4) :
  ici seuls servent la recherche, les sons d'interface et les règles de licence. real-sound
  accepte le CC BY ; pour le jeu la règle reste CC0 uniquement. Les « oreilles » optionnelles de
  Real SFX (`listen.py install`, `hear.py`) ne sont pas installées : earshot fait ce travail.
- **earshot en ligne de commande** : 3 s sans modèle, environ 15 s avec ; juste après
  l'installation les premiers appels ont pris 45 s à 1 min 40, et `earshot --help` est resté
  bloqué une fois. `earshot forge` (chercher un son neuf) occupe le processeur plusieurs minutes.
  `earshot llm` enverrait le son à Google : jamais sans demande de l'utilisateur.
- Une session ouverte avant l'installation ne voit ni `earshot` ni `ffmpeg` (PATH) : redémarrer.
  `openverse.py` retrouve quand même le FFmpeg de winget.
