---
name: brief-agent
description: Écrire le brief d'un sous-agent pour Legend of Agarica en peu de mots, en s'appuyant sur le fichier de règles communes du projet. À utiliser avant tout appel à l'outil Agent sur ce projet, pour ne pas réécrire les règles de test, les interdits et le format du compte rendu.
---

# Brief court pour un agent

Les règles communes (tests, un seul navigateur, interdits, format du compte rendu, que faire
si ça coince) sont dans `docs/production/REGLES_AGENTS.md`. Le brief ne les répète pas.

## Avant de lancer

- Poser d'abord les questions de conception à l'utilisateur : un agent ne peut pas en poser.
- Un seul agent avec navigateur à la fois. Jamais deux agents, ni un agent et la conversation
  principale, sur les mêmes fichiers.
- Une tâche d'un fichier et de quelques lignes se fait dans la conversation, sans agent.
- Si la conception tient en plus de dix lignes, l'écrire dans un fichier de
  `docs/production/` et y renvoyer, plutôt que de la mettre dans le brief.

## Gabarit

```
Projet : C:\Users\adrie\Documents\projet\agarica (Legend of Agarica).
Lis d'abord docs/production/REGLES_AGENTS.md et suis-le : il fait partie de ce brief.

Objectif : <une ou deux phrases : ce qui doit marcher à la fin, et pour qui>.

Décisions déjà prises : <liste courte, ou « voir docs/production/<FICHIER>.md »>.

Fichiers : <ceux à modifier ; ceux à ne pas toucher>.
Repères : <fonctions ou fichiers où commencer, à vérifier>.

À prouver : <les mesures ou captures qui montrent que c'est bon>.
Ports : <plage>. Dossier de travail : <dossier temporaire>.
```

## Après

- Ne rien annoncer de ses résultats avant sa notification de fin.
- À la fin : skill `livrer` (vérifier, commiter, résumer). Un agent coupé se reprend avec
  SendMessage, il garde son contexte.
