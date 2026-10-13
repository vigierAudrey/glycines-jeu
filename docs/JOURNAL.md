# Journal de bord

Trois lignes par session : ce qui a été fait, ce qui reste à surveiller, la prochaine tâche.

## 12/10/2026 · Phase 0 (tâches 0.1 à 0.4)

- **Fait** : projet Vite + TypeScript + Three.js ; documents ; référentiel du Bloc 2 importé (14 sous-compétences) ; validateur et 11 tests ; aile B en 3D à partir du plan en grille, 6 résidents des cours et 6 professionnels identifiables par couleur de tenue, rotation par quarts de tour, légende « Qui est qui ? ». Vérifié : `npm run verifier` OK, affichage contrôlé à 1280 px, 390 px portrait et 844 px paysage, aucune erreur console.
- **À surveiller** : le libellé de CT3.4 est reconstitué dans la matrice (à vérifier sur l'arrêté) ; la mission `m00` est un exemple en brouillon ; les prénoms du personnel sont provisoires.
- **Prochaine tâche** : 0.5 (installer et lancer chez Audrey), puis 0.6 (git et GitHub).

## 12/10/2026 · Passage à pnpm

- **Fait** : pnpm 12.11.2 (fixé dans package.json), `pnpm-workspace.yaml` (esbuild autorisé), lockfile pnpm, documentation mise à jour ; phase 2 bis « Habillage graphique » ajoutée à la feuille de route. `pnpm verifier` OK.
- **À surveiller** : ne pas mélanger `npm install` et `pnpm install` dans ce projet.
- **Prochaine tâche** : 0.5 puis 0.6.

## 12/10/2026 · Installation chez Audrey (tâche 0.5)

- **Fait** : projet installé dans `~/dev/glycine/glycines-jeu/glycines-jeu`, pnpm 12.11.2 installé globalement, `pnpm dev` OK, jeu affiché dans VS Code (WSL: Ubuntu-24.04). Obstacles rencontrés et résolus : terminal PowerShell au lieu d'Ubuntu, dossier décompressé deux fois l'un dans l'autre, fichiers parasites `Zone.Identifier` de Windows, corepack incompatible (remplacé par `npm install -g pnpm`).
- **À surveiller** : dans un panneau étroit, des étiquettes se chevauchent (IDE et Cadre, Vous et AS) et « Mme Rose » passe sous la barre du haut : tâche 1.7 ajoutée.
- **Prochaine tâche** : 0.6 (git et GitHub privé).

## 12/10/2026 · Exercice de la grille et marche de l'agent (tâches 0.7 et 1.1)

- **Fait** : patio agrandi de 2 rangées, deuxième porte couloir/salle à manger (colonne 22, rangée 3) avec son test ; recherche de chemin A* dans `src/regles/chemin.ts` (9 tests), toucher bref ou clic = l'agent marche, glisser = la vue bouge ; boucle d'animation qui redessine pendant la marche puis s'arrête. `pnpm verifier` OK (22 tests), vérifié dans Chromium à 1280 px et 390 px (toucher, glisser, retour à 0 image par seconde à l'arrêt).
- **À surveiller** : l'agent peut s'arrêter sur la case d'un autre personnage (figurines superposées) ; un clic sur le haut d'un mur vise la case située derrière ; pas encore testé sur un vrai téléphone (tâche 1.5).
- **Prochaine tâche** : 1.2 (la caméra suit l'agent en douceur).

## 13/10/2026 · La caméra suit l'agent (tâche 1.2)

- **Fait** : `theatre.suivre(agent)` dans `creerScene.ts`, appelé par `marche.ts` à chaque toucher du sol ; la vue glisse en douceur (amorti exponentiel, même allure à 60 ou 120 images par seconde), le zoom reste libre, un glisser de l'élève rend la main. `pnpm verifier` OK (22 tests), vérifié dans Chromium à 1280 px (avec zoom molette pendant la marche) et 390 px (toucher, puis glisser pendant la marche), retour à 0 image par seconde à l'arrêt.
- **À surveiller** : sur ordinateur, le plan entier ne reste plus forcément à l'écran après une marche (bouton Recentrer) ; un pincement qui déplace aussi la vue arrête le suivi ; `favicon.ico` absent (erreur 404 sans gravité).
- **Prochaine tâche** : 1.3 (toucher un personnage : bulle avec son nom et son métier).

## 13/10/2026 · Commits et bulle des personnages (tâche 1.3)

- **Fait** : commits des tâches 0.7 et 1.1 puis 1.2 (sans push). Toucher une personne ouvre une bulle HTML avec son nom et son rôle (`src/regles/fiche.ts`, 5 tests ; `src/ui/bulle.ts`) ; détection à l'écran avec 24 px de tolérance ; toucher le sol ferme la bulle, Échap et le bouton × aussi ; le calque 3D est isolé pour que les étiquettes ne passent plus devant l'interface. `pnpm verifier` OK (27 tests), vérifié dans Chromium à 1280 px et 390 px.
- **À surveiller** : sur deux personnes très proches (IDE et Cadre), il faut viser le bon corps ; la bulle d'un résident ne montre que son nom (rien de `repris_du_cours`) ; « Mme Rose » passe désormais sous la barre du haut (mieux, mais 1.7 reste à faire).
- **Prochaine tâche** : 1.4 (meubles simples dans les chambres, décrits en données).

## 13/10/2026 · Meubles des chambres (tâche 1.4)

- **Fait** : commit de la tâche 1.3. Champ `meubles` dans `aile-b.json` (lit, sonnette, lavabo, fauteuil dans chaque chambre, sauf le fauteuil de Mme Denise, gardé pour l'exercice 1.6) ; cases occupées calculées par `plan.ts`, évitées par A* et par le placement des personnages ; 5 règles de validation ; `src/scene3d/meubles.ts` dessine les meubles en boîtes. `pnpm verifier` OK (40 tests), vérifié dans Chromium à 1280 px et 390 px, marche, suivi et bulle toujours bons.
- **À surveiller** : toucher un lit ne fait rien (l'agent ne va pas à côté) ; chaque meuble ajoute quelques dessins pour la carte graphique (environ 80 au total, à surveiller sur téléphone en 1.5) ; pas encore de modèle glTF.
- **Prochaine tâche** : 1.5 (test sur un vrai téléphone).
