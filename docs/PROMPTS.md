# Prompts à copier-coller

## Début de session (Claude Code ou Codex, dans le dossier du projet)

```
Lis CLAUDE.md, puis docs/ROADMAP.md. Prends la première tâche non cochée.
Avant de coder : inspecte les fichiers concernés et annonce ton plan en 3 phrases.
Je suis débutante : explique les notions nouvelles quand tu les utilises.
```

## Fin de session

```
Lance pnpm verifier. Si tout passe : coche la tâche dans docs/ROADMAP.md,
ajoute 3 lignes dans docs/JOURNAL.md, explique-moi ce que tu as fait
(quoi, pourquoi, où, ce qui pourrait casser, comment tester),
pose-moi 2 questions de compréhension et propose un message de commit.
```

## Quand le quota Claude est épuisé (relais Codex)

```
Lis AGENTS.md (qui renvoie à CLAUDE.md) et docs/JOURNAL.md pour savoir où on en est.
Continue la tâche en cours de docs/ROADMAP.md en respectant les mêmes règles.
```

## Rédiger une mission (dans une conversation, pas dans l'IDE)

```
Voici le référentiel du Bloc 2 (content/referentiel/bloc2.json) et les résidents (content/personnages/residents.json).
Aide-moi à écrire une mission de 15 minutes pour la compétence <CODE>, au format de content/scenarios/m00-exemple-chambre-karim.json.
Cite le critère officiel mot pour mot. N'ajoute aucun élément médical absent du champ repris_du_cours. Pas de diagnostic.
```
