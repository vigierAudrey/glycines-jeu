# Glossaire

| Mot | En clair |
|---|---|
| **pnpm** | Le gestionnaire de paquets du projet : il installe les bibliothèques (`pnpm install`) et lance les commandes (`pnpm dev`, `pnpm verifier`…). Plus rapide et plus économe en disque que npm, l'outil fourni avec Node.js. |
| **packageManager** | Champ de `package.json` qui indique la version de pnpm attendue (12.11.2). pnpm l'utilise pour que tout le monde travaille avec la même version. |
| **sudo** | « Faire en tant qu'administrateur » sous Ubuntu : nécessaire pour installer un outil pour tout le système (comme pnpm). Jamais pour `pnpm install` dans le projet. |
| **WSL** | Le Linux (Ubuntu) qui tourne dans Windows. Le projet vit côté Ubuntu : le terminal doit afficher `audrey@Janga:…$`, pas `PS C:\…`. |
| **pnpm-lock.yaml** | La liste exacte des versions installées : tout le monde (et chaque IA) obtient les mêmes. Ne jamais le modifier à la main. |
| **package.json** | La fiche d'identité du projet : nom, bibliothèques utilisées et leurs versions, commandes. |
| **node_modules** | Le dossier où pnpm range les bibliothèques installées. Jamais versionné dans git, jamais dans Nextcloud. |
| **Vite** | L'outil qui sert le jeu pendant le développement (rechargement instantané) et fabrique la version finale (`dist/`). |
| **TypeScript** | JavaScript avec des types : on déclare la forme des données, et les erreurs sont signalées avant l'exécution. |
| **Three.js** | La bibliothèque qui dessine la 3D dans le navigateur (via WebGL, la carte graphique). |
| **Scène, maillage, matériau** | La scène contient les objets ; un maillage = une forme + un matériau (couleur, réaction à la lumière). |
| **Caméra orthographique** | Caméra sans perspective : c'est elle qui donne la vue isométrique. |
| **Isométrique** | Vue en biais, d'en haut, où les distances ne rétrécissent pas avec l'éloignement (comme un plan de maquette). |
| **JSON** | Format de données texte : `{ "cle": "valeur" }`. Lisible par l'humain et par le programme. |
| **Test automatique** | Petit programme qui vérifie qu'une fonction donne le bon résultat. Lancé par `pnpm test`. |
| **Validateur** | Le script `pnpm valider` : il vérifie que le contenu respecte le référentiel et les règles du projet. |
| **Build** | Fabrication de la version publiable du jeu (`pnpm build` → dossier `dist/`). |
| **Commit** | Une photo enregistrée de l'état du projet, avec un message qui dit ce qui a changé. |
| **Dépôt (repository)** | L'ensemble de l'historique des commits ; sur GitHub, sa copie en ligne. |
| **PWA** | Site web installable comme une application, qui fonctionne hors ligne. |
| **glTF / .glb** | Format standard de modèle 3D ; Blender l'exporte. |
| **Raycasting** | Lancer un « rayon » depuis le doigt ou la souris pour savoir quel objet 3D est touché. |
| **A\* (A étoile)** | Algorithme qui trouve le chemin le plus court sur une grille en contournant les obstacles. |
| **Low-poly** | Modèles 3D à peu de faces : légers, lisibles, adaptés au téléphone. |
