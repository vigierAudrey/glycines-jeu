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
