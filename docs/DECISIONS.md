# Journal des décisions

Chaque décision importante est notée ici avec sa raison, pour ne pas la rouvrir sans motif.
Format : contexte → décision → pourquoi → ce qu'on abandonne.

## D-001 · Web (Three.js) plutôt que Godot · 12/10/2026

- **Contexte** : jeu 3D isométrique jouable sur PC **et téléphones** (Android et iPhone), par des élèves, sans installation.
- **Décision** : application web en TypeScript avec Three.js.
- **Pourquoi** : léger (quelques centaines de Ko), s'ouvre d'un lien ou d'un QR code, installable en PWA sur iPhone comme sur Android ; les IA de code maîtrisent bien Three.js ; compétences réutilisables pour la plateforme pédagogique et BlobSurf.
- **Ce qu'on abandonne** : l'éditeur visuel de Godot. Compensation : le plan et les meubles sont décrits en données éditables à la main.
- **À reconsidérer si** : jeu réservé au PC, ou projet en réalité virtuelle.

## D-002 · Vite + TypeScript · 12/10/2026

TypeScript signale les erreurs avant l'exécution, ce qui sécurise le code écrit par une IA. Vite donne le rechargement instantané et une construction simple.

## D-003 · Contenu pédagogique séparé du moteur, en JSON · 12/10/2026

Le moteur ne connaît pas le CAP AAGA. Toute la pédagogie est dans `content/`. Ajouter la PSE ou le Bloc 1 = ajouter des fichiers.

## D-004 · Référentiel copié et validé automatiquement · 12/10/2026

`content/referentiel/bloc2.json` est extrait de la matrice des cours (version du 16/08/2026). Le validateur exige que chaque mission cite un critère officiel **mot pour mot**. Attention : le libellé de CT3.4 a été reconstitué lors de l'extraction (voir le champ `avertissement`) ; à vérifier sur le texte de l'arrêté.

## D-005 · Pas de compte élève · 12/10/2026

Sauvegarde dans le navigateur et code de reprise. Aucune donnée personnelle, aucun traceur, aucun service tiers (privacy by design).

## D-006 · Interface en HTML par-dessus la 3D · 12/10/2026

Texte net, accessible, compatible avec la lecture à voix haute et les lecteurs d'écran ; plus simple à faire évoluer que des boutons dessinés en 3D.

## D-007 · Dépôt dans WSL, hors Nextcloud · 12/10/2026

Le projet vit dans `~/dev/glycine/glycines-jeu/glycines-jeu` (WSL) avec un dépôt GitHub public. Jamais dans `Documents\cours\` : `node_modules` contient des milliers de fichiers que Nextcloud synchroniserait.

## D-008 · Rendu à la demande et étiquettes selon la densité · 12/10/2026

On ne redessine que si la vue change (batterie des téléphones). Les étiquettes se masquent par niveaux quand la vue est petite, pour rester lisible à 390 px.

## D-009 · pnpm comme gestionnaire de paquets · 12/10/2026

- **Décision** : pnpm (version fixée dans `package.json`, champ `packageManager`), à la demande d'Audrey. Installé globalement avec `sudo npm install -g pnpm@12.11.2` : corepack a été écarté (sa version fournie avec Node 22 ne sait pas lancer pnpm 12, et `corepack enable` bute sur le yarn déjà installé).
- **Pourquoi** : plus rapide, économe en disque, et plus sûr : pnpm 12 bloque par défaut les scripts d'installation des bibliothèques et les versions publiées depuis moins d'un jour.
- **Conséquences** : `pnpm-workspace.yaml` autorise uniquement esbuild (outil utilisé par tsx) à exécuter son script d'installation. Vitest est fixé en 5.0.2 plutôt que 5.0.4, publiée le jour même. `package-lock.json` est remplacé par `pnpm-lock.yaml`.

## D-010 · Rendu continu seulement pendant les animations · 12/10/2026

- **Décision** : `theatre.animer(animation)` lance une boucle `requestAnimationFrame` qui redessine à chaque image tant qu'une animation renvoie `true`, puis s'arrête. Hors animation, le rendu à la demande (D-008) reste la règle.
- **Pourquoi** : une marche fluide demande environ 60 images par seconde, mais redessiner en permanence viderait la batterie des téléphones.
- **Conséquences** : toute animation future (caméra qui suit l'agent en 1.2, personnages animés en G.2) passe par `animer`. La recherche de chemin (A*, 8 directions, sans couper les coins) reste dans `src/regles/` et réutilise les murs calculés par `plan.ts` : un seul endroit décide où sont les murs.

## D-011 · La caméra suit l'agent, mais l'élève garde la main · 13/10/2026

- **Décision** : pendant une marche, le centre de la vue rejoint l'agent en douceur. Le suivi s'arrête dès que l'élève fait glisser la vue (ou touche « Recentrer ») et reprend au toucher suivant. Le zoom n'est jamais modifié par le suivi.
- **Pourquoi** : sur téléphone en portrait, la vue est zoomée et l'agent sortirait vite de l'écran ; mais un élève qui veut regarder ailleurs ne doit pas être ramené de force.
- **Comment** : le suivi est une animation de `theatre.animer` (D-010) ; il détecte un glisser en constatant que le centre de la vue n'est plus celui qu'il a posé à l'image précédente.
- **Ce qu'on abandonne** : une « zone morte » (ne suivre que quand l'agent approche du bord), plus confortable sur grand écran mais plus complexe. À reconsidérer après le test sur téléphone (1.5).

## D-012 · Bulle des personnages : cible à l'écran, bulle en HTML · 13/10/2026

- **Décision** : un personnage est « touché » si le doigt est à moins de 24 px de sa silhouette projetée à l'écran (pieds → étiquette), et non par un rayon qui doit frapper la figurine 3D. La bulle est un élément HTML du calque interface, replacé après chaque dessin, plutôt qu'une étiquette 3D (CSS2D).
- **Pourquoi** : une figurine fait environ 10 px sur téléphone, bien en dessous des 44 px exigés par le cahier des charges. En HTML dans l'interface, la bulle reste au-dessus des étiquettes, peut contenir un vrai bouton de fermeture et est lue par les lecteurs d'écran (`role="status"`).
- **Conséquence** : le calque 3D est isolé (`isolation: isolate`) pour que les z-index posés par Three.js sur les étiquettes ne passent jamais devant l'interface. `toucher.ts` ne décide plus rien : il dit ce qui est sous le doigt (personnage et/ou sol), `main.ts` choisit l'action.
- **Ce qu'on abandonne** : rien de ce qui était prévu ; la bulle n'affiche que le nom et le rôle, jamais d'élément médical (règle `repris_du_cours`).
