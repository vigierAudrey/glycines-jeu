# Consignes pour les IA de développement (Claude Code, Codex…)

Projet : **Une journée aux Glycines**, jeu sérieux 3D isométrique pour les élèves de terminale CAP AAGA.
Propriétaire : Audrey, enseignante et développeuse débutante. Elle veut **comprendre** ce qui est construit.

## Au début de chaque session

1. Lis `docs/ROADMAP.md` et prends **la première tâche non cochée** (sauf si Audrey en désigne une autre). **Une seule tâche par session.**
2. Lis `docs/ARCHITECTURE.md` et les fichiers concernés **avant** de modifier quoi que ce soit.
3. Annonce en 2 ou 3 phrases ce que tu vas faire et quels fichiers tu vas toucher.

## Règles d'architecture

- `content/` = données pédagogiques uniquement. `src/regles/` et `src/contenu/` = logique pure, **aucun import de `three`**. `src/scene3d/` = Three.js, **aucune donnée pédagogique en dur**. `src/ui/` = HTML/CSS.
- **Ne jamais modifier `content/referentiel/bloc2.json`.** C'est la source de vérité.
- Une mission cite ses critères **mot pour mot** depuis le référentiel. Ne jamais inventer une compétence, un critère, un savoir, ni un élément médical sur un résident (voir `repris_du_cours`).
- Aucun diagnostic dans le jeu : l'élève observe, adapte dans son rôle, transmet.
- Pas de nouvelle dépendance sans l'expliquer et sans l'accord d'Audrey. Préférer gratuit, open source, léger.
- Pas de réécriture massive d'une partie qui fonctionne.

## Contraintes produit

- PC **et** téléphone : cibles tactiles de 44 px minimum, test à 390 px et sur ordinateur, pas d'ombres temps réel, rendu à la demande.
- Aucune donnée personnelle, aucun traceur, aucun appel réseau externe pendant le jeu.
- Textes en français, phrases courtes, **jamais de tiret cadratin** (utiliser « : », « · » ou des parenthèses). Noms de variables et de fonctions en français, comme le code existant.

## Avant de déclarer la tâche finie

1. `pnpm verifier` doit passer (types, contenu, tests, build).
2. Si l'affichage a changé : vérifier dans le navigateur, sur ordinateur et à 390 px.
3. Cocher la tâche dans `docs/ROADMAP.md`, ajouter une entrée de 3 lignes dans `docs/JOURNAL.md`, et une entrée dans `docs/DECISIONS.md` si un choix important a été fait.
4. Expliquer à Audrey : **ce que fait le code → pourquoi → où il intervient → ce qui pourrait casser → comment le tester.** Puis lui poser **2 questions de compréhension**.
5. Proposer le message de commit, **sans committer** : c'est Audrey qui committe (TESTER → VÉRIFIER → COMMIT).
