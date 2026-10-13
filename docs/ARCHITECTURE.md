# Architecture · comment le jeu est construit

## L'idée en une image : un théâtre

| Couche | Dossier | Au théâtre | Règle |
|---|---|---|---|
| **Contenu** | `content/` | Le texte de la pièce | Que des données (JSON). C'est ton domaine : référentiel, plan, personnages, missions. |
| **Règles** | `src/regles/`, `src/contenu/` | Le régisseur | Logique pure : **jamais d'import de `three`** ici. Tout est testable sans navigateur. |
| **Décor 3D** | `src/scene3d/` | Le décor et la lumière | Three.js. Ne contient **aucune donnée pédagogique** : il dessine ce que les règles lui donnent. |
| **Interface** | `src/ui/`, `src/style.css` | Le programme et le rideau | HTML et CSS par-dessus la 3D : boutons, dialogues, bilans. |

```
content/*.json ──► src/contenu/charger.ts ──► src/regles/plan.ts ──► src/scene3d/*  ──► écran
                         │                                             ▲
                         └──► src/contenu/valider.ts (contrôle)        │
                                                         src/ui/* ─────┘ (boutons : tourner, recentrer…)
```

**Pourquoi séparer ainsi ?** Parce que le moteur ne sait rien du CAP AAGA. Ajouter la PSE ou le Bloc 1 revient surtout à écrire de nouveaux fichiers dans `content/`. Et une erreur dans le décor ne peut pas fausser une règle pédagogique.

## Carte des fichiers

```
glycines-jeu/
├── CLAUDE.md, AGENTS.md          consignes lues par Claude Code et Codex
├── index.html                    la page du jeu : un calque 3D (#scene) et un calque interface (#interface)
├── enseignante.html              la page enseignante (missions, réponses attendues, débriefing, lien de classe)
├── package.json                  dépendances et commandes (pnpm)
├── pnpm-workspace.yaml           réglages de pnpm (bibliothèques autorisées à s'installer)
├── vite.config.ts, tsconfig.json réglages de Vite et de TypeScript
├── content/
│   ├── referentiel/bloc2.json    14 sous-compétences : NE PAS MODIFIER À LA MAIN
│   ├── lieux/aile-b.json         le plan en grille de lettres
│   ├── personnages/              residents.json, personnel.json
│   └── scenarios/                une mission par fichier
├── src/
│   ├── main.ts                   point d'entrée du jeu : branche les couches dans l'ordre
│   ├── enseignante.ts, .css      page enseignante (sans 3D), imprimable
│   ├── contenu/                  types.ts (forme des données), charger.ts, valider.ts
│   ├── regles/                   plan.ts (grille → zones, centres, murs), chemin.ts (recherche de chemin A*),
│   │                             fiche.ts (nom et rôle d'une personne, pour la bulle),
│   │                             etiquettes.ts (écarter les noms qui se chevauchent à l'écran),
│   │                             mission.ts (moteur de mission : étapes, points, confiance, niveaux),
│   │                             sauvegarde.ts (progression et code de reprise),
│   │                             deblocage.ts (missions ouvertes selon la séquence vue en cours)
│   ├── scene3d/                  creerScene.ts (caméra, contrôles, boucle d'animation), construireAile.ts, personnages.ts,
│   │                             toucher.ts (toucher bref ou glisser, raycasting), marche.ts (marche de l'agent),
│   │                             meubles.ts (lit, fauteuil, lavabo, sonnette en formes simples),
│   │                             ecartEtiquettes.ts (applique l'écart des noms après chaque dessin)
│   └── ui/                       interface.ts (barre, boutons, légende), bulle.ts (bulle d'une personne touchée),
│                                 mission.ts (liste des missions, panneau d'étape, loupe, jauge, relève),
│                                 progression.ts (sauvegarde dans le navigateur, bloc du code de reprise),
│                                 voix.ts (lecture à voix haute avec la synthèse vocale du navigateur),
│                                 echapper.ts (protège les textes insérés dans le HTML)
├── public/                       copié tel quel : manifest.webmanifest, sw.js (hors ligne), icônes
├── .github/workflows/publier.yml publication sur GitHub Pages, lancée à la main seulement
├── tools/valider-contenu.ts      la commande « pnpm valider »
├── tests/                        tests automatiques (Vitest)
└── docs/                         ce dossier
```

## Le plan en données (`content/lieux/aile-b.json`)

Chaque caractère de `grille` est une case de 1 m × 1 m. Une lettre majuscule = une zone (décrite dans `zones`), `p` = une porte, `.` = rien.
Les murs ne sont pas dessinés à la main : `src/regles/plan.ts` les calcule. Il pose un mur entre deux cases de zones différentes, sauf si l'une est une porte ou si les deux sont dehors.

**Exemple** : remplacer un `R` par un `p` sur le bord de la chambre de Mme Rose fait apparaître une nouvelle porte.

### Les meubles

Le champ `meubles` liste les meubles du plan, un par ligne :

```json
{ "type": "lit", "colonne": 0, "rangee": 0, "vers": "sud" }
```

- `type` : `lit`, `fauteuil`, `lavabo` ou `sonnette`.
- `colonne`, `rangee` : la case où le meuble est posé (on compte à partir de 0, en haut à gauche de la grille).
- `vers` : le côté vers lequel il est tourné (`nord` = vers le haut de la grille, `sud`, `est` = vers la droite, `ouest`). Le lit occupe 2 cases : sa tête est sur la case indiquée, ses pieds vers `vers`. Un fauteuil ou un lavabo a le dos du côté opposé à `vers`.

`src/regles/plan.ts` calcule les cases occupées : on ne marche pas à travers un lit, un fauteuil ou un lavabo, et personne n'est posé dessus. La sonnette se pose sur la tête du lit et ne bloque rien. `pnpm valider` refuse un meuble posé sur une porte, qui dépasse de sa pièce, qui en chevauche un autre, ou une sonnette loin d'un lit.

## Les notions 3D utilisées

- **Scène** : la boîte qui contient tous les objets.
- **Maillage (mesh)** : une forme (géométrie) + un matériau (couleur, réaction à la lumière).
- **Instances** : une même forme dessinée N fois en un seul appel à la carte graphique. On s'en sert pour les cases de sol et les murs, ce qui garde le jeu fluide sur téléphone.
- **Caméra orthographique** : sans perspective. Placée à 35,26° au-dessus du sol et à 45° de côté, elle donne la vue isométrique.
- **Rendu à la demande** : on ne redessine l'image que si quelque chose change (glisser, zoom, rotation). Sur téléphone, c'est de la batterie gagnée.
- **Boucle d'animation** : pendant un mouvement (l'agent qui marche), on redessine à chaque image de l'écran (environ 60 fois par seconde) avec `requestAnimationFrame`. Chaque animation reçoit le temps écoulé et dit si elle continue. Quand plus rien ne bouge, la boucle s'arrête et on revient au rendu à la demande (`theatre.animer(...)` dans `creerScene.ts`).
- **Suivi de caméra** : quand l'agent marche, le centre de la vue parcourt à chaque image une fraction de l'écart qui le sépare de lui (grande fraction quand il est loin, petite quand il est proche), d'où un mouvement doux (`theatre.suivre(...)` dans `creerScene.ts`). Le zoom n'est pas touché. Si l'élève fait glisser la vue, le suivi s'arrête ; il reprend au prochain toucher du sol.
- **Raycasting** : pour savoir ce qu'on touche à l'écran, on lance un rayon depuis la caméra à travers le pixel touché et on cherche où il rencontre le sol (`toucher.ts`).
- **Toucher ou glisser** : un geste court (moins de 0,5 s), qui bouge de moins de 10 px et n'utilise qu'un doigt, est un toucher (l'agent marche). Sinon c'est un glisser ou un pincement (la vue bouge).
- **Toucher un personnage** : une figurine fait à peine 10 px de large sur téléphone. Au lieu de viser la figurine en 3D, on la projette à l'écran (un trait des pieds au haut de l'étiquette) et on accepte un toucher à moins de 24 px de ce trait : la cible fait au moins 44 px. Si deux personnes sont proches, la plus proche du doigt gagne. Un personnage touché ouvre sa bulle ; sinon, le toucher fait marcher l'agent (`main.ts` décide).
- **Bulle qui suit la 3D** : la bulle est du HTML dans le calque interface. Après chaque dessin (`theatre.apresChaqueRendu`), on calcule où se trouve la tête de la personne à l'écran (`theatre.versEcran`) et on y replace la bulle, retenue au bord de l'écran si besoin.
- **Cadrage d'une pièce** : pour la loupe, `theatre.cadrer(x, z, largeur)` amène la vue sur la pièce en 0,6 s et règle le zoom pour qu'elle occupe le haut de l'écran, au-dessus du panneau de la mission.
- **Repères de la loupe** : comme la bulle, ce sont des boutons HTML de 44 px replacés après chaque dessin au-dessus de leur case (`src/ui/mission.ts`). Pas de 3D en plus.
- **A\*** (« A étoile ») : algorithme de plus court chemin sur la grille (`src/regles/chemin.ts`). Il explore d'abord les cases dont « chemin déjà fait + distance à vol d'oiseau restante » est le plus petit. On marche en 8 directions, jamais à travers un mur, et sans couper le coin d'un mur en diagonale.
- **Étiquettes HTML (CSS2DRenderer)** : les noms au-dessus des têtes sont du vrai texte HTML, net et lisible, pas des pixels dans la 3D.
- **Écart des étiquettes** : après chaque dessin, on mesure le rectangle de chaque nom de personne à l'écran. De la plus basse à la plus haute, une étiquette qui en touche une autre monte juste au-dessus ; une étiquette qui passerait sous la barre du haut est descendue dessous (`src/regles/etiquettes.ts`, testé sans navigateur). Le décalage passe par la propriété CSS `translate`, qui s'ajoute au `transform` posé par Three.js.
- **Densité d'étiquettes** : selon le nombre de pixels par mètre à l'écran, le CSS masque les noms des chambres puis des pièces pour éviter les chevauchements (`data-densite` sur `#scene`).

## Jouer une mission (interface : `src/ui/mission.ts`)

1. Au lancement, l'**écran d'accueil** présente le jeu et la liste des missions ; le bouton **Missions** la rouvre. Les missions sont rangées par séquence ; celles d'une séquence pas encore vue sont verrouillées 🔒. La séquence vue se choisit dans la liste, ou par un lien de l'enseignante : `…/index.html?sequence=S3` (mémorisée ensuite sur l'appareil). Les **brouillons** ne sont visibles qu'avec `pnpm dev` ou en ajoutant `?brouillons` à l'adresse. Choisir une mission fait marcher l'agent vers son lieu.
2. Le **panneau du bas** montre l'étape : dialogue en 3 canaux, loupe, décision (badges Agir, Adapter, Alerter) ou relais. Après chaque réponse, il explique (« Bien joué » ou « À retenir »).
3. La **jauge de confiance** du résident reste en haut du panneau pendant toute la mission.
4. Pour un **relais**, l'élève touche un professionnel dans l'aile : `main.ts` donne d'abord le toucher à la mission (`personneTouchee`), qui fait marcher l'agent vers lui.
5. La **relève** donne le niveau de chaque compétence (avec le sens de N1 à N4 tiré du référentiel) et les questions de débriefing.

### Lecture à voix haute

Chaque panneau de mission et la relève ont un bouton 🔊. Il lit, dans l'ordre, les textes marqués `a-lire`, les titres des canaux du dialogue et les choix proposés, avec la voix française du navigateur (`speechSynthesis`, sans réseau). Un second appui arrête la lecture ; changer de panneau aussi. Si le navigateur ne sait pas parler, le bouton est caché. Pour qu'un nouveau texte soit lu, il suffit de lui donner la classe `a-lire`.

### Sauvegarde et code de reprise

À la fin d'une mission, les niveaux obtenus sont gardés dans le navigateur (`localStorage`, clé `glycines-progression-v1`), sur l'appareil seulement. Le **code de reprise** (en bas de la liste des missions) les résume : `M00-332.K7` veut dire « mission m00 : N3, N3, N2 » (dans l'ordre des compétences de la mission), et `K7` est une clé de contrôle qui repère une faute de frappe. Sur un autre appareil, l'élève tape ce code et retrouve ses niveaux. C'est pourquoi l'identifiant d'une mission commence par `m` et deux chiffres (`m01-…`), vérifié par `pnpm valider`.

L'interface ne calcule rien : elle envoie la réponse au moteur (`repondre`) et affiche ce qu'il renvoie.

## Page enseignante (`enseignante.html`)

Adresse : `http://localhost:5173/enseignante.html` (ou `enseignante.html` à côté de `index.html` une fois publié). Elle montre toutes les missions, brouillons compris : situation, compétences et critères, points maximum, **réponses attendues** étape par étape (la réponse qui rapporte le plus), questions de débriefing. Le bouton « Imprimer » donne une version papier sans le bloc du lien. Le bloc « Lien pour la classe » fabrique l'adresse `index.html?sequence=S…` à donner aux élèves. Elle n'est pas reliée au jeu : les élèves n'y ont pas accès par un bouton (mais elle n'est pas secrète).

## Jouer sans réseau (PWA)

Une fois publié, le jeu s'installe comme une application (« Ajouter à l'écran d'accueil ») et marche sans réseau :

- `public/manifest.webmanifest` donne le nom, les couleurs et les icônes de l'application ;
- `public/sw.js` est un **service worker** : un petit programme que le navigateur garde à côté du jeu. À la première visite, il copie les pages et leurs fichiers ; ensuite, sans réseau, il sert ces copies. Les pages passent d'abord par le réseau (pour recevoir les mises à jour), les fichiers de `assets/` sont pris dans la copie (leur nom change à chaque version) ;
- il n'est activé que dans la version construite (`pnpm build`), jamais avec `pnpm dev`.

Pour le tester : `pnpm build`, puis `pnpm preview`, ouvrir l'adresse, puis couper le réseau (outils de développement du navigateur, onglet Réseau, « Hors ligne ») et recharger.

## Publier le jeu (GitHub Pages)

Le jeu construit (`dist/`) est un simple dossier de fichiers : n'importe quel hébergement statique convient. Avec GitHub Pages, gratuit pour un dépôt public :

1. Sur GitHub, dans le dépôt : **Settings → Pages → Source : GitHub Actions** (une seule fois).
2. Pousser les commits (`git push`).
3. Onglet **Actions → Publier sur GitHub Pages → Run workflow**. Le workflow lance `pnpm verifier` puis publie `dist/`.
4. Le jeu est à l'adresse `https://vigieraudrey.github.io/glycines-jeu/`, la page enseignante à `…/glycines-jeu/enseignante.html`.

Rien n'est publié tant qu'on ne lance pas le workflow à la main. Seules les missions `valide` sont visibles dans la version publiée.

## Commandes

| Commande | Effet |
|---|---|
| `pnpm dev` | Lance le serveur de développement (rechargement automatique). Adresse affichée dans le terminal. |
| `pnpm verifier` | Lance tout : types, validation du contenu, tests, construction. **À passer avant chaque commit.** |
| `pnpm valider` | Vérifie seulement le contenu (référentiel, plan, personnages, missions). |
| `pnpm test` | Lance seulement les tests. |
| `pnpm build` | Fabrique la version publiable dans `dist/`. |

## Tester sur un téléphone (phase 1.5)

`pnpm dev` écoute sur le réseau (`--host`), mais WSL2 isole son réseau de celui de Windows : le téléphone ne voit pas le serveur directement. Le téléphone et l'ordinateur doivent être sur **le même wifi**.

### Solution 1 (conseillée) : le réseau « mirrored » de WSL

1. Sous Windows, ouvrir (ou créer) le fichier `C:\Users\<ton nom>\.wslconfig` et y écrire :
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```
2. Dans PowerShell : `wsl --shutdown`, puis rouvrir le terminal Ubuntu.
3. Autoriser le port 5173 dans le pare-feu de Windows (PowerShell **en administrateur**) :
   ```powershell
   New-NetFirewallRule -DisplayName "Vite 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   ```
   et, pour le pare-feu propre à WSL : `Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow`
4. `pnpm dev` : l'adresse « Network » affichée (par exemple `http://192.168.1.23:5173/`) est celle de l'ordinateur. La taper dans le navigateur du téléphone.

### Solution 2 : une redirection de port côté Windows

Si le mode « mirrored » n'est pas disponible (Windows 10) :

1. Dans Ubuntu : `hostname -I` donne l'adresse de WSL (par exemple `172.20.5.10`).
2. Dans PowerShell **en administrateur** :
   ```powershell
   netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=172.20.5.10
   ```
   puis la règle de pare-feu de l'étape 3 ci-dessus.
3. Dans PowerShell : `ipconfig` donne l'adresse wifi de Windows. Sur le téléphone : `http://<cette adresse>:5173/`.
4. L'adresse de WSL change à chaque redémarrage : refaire l'étape 2 (supprimer l'ancienne avec `netsh interface portproxy reset`).

### Ce qu'on vérifie sur le téléphone

- Toucher le sol : l'agent marche ; glisser : la vue bouge ; pincer : zoom.
- Toucher une personne : la bulle s'ouvre et se ferme avec ×.
- Fluidité pendant la marche (pas de saccades) ; le téléphone ne chauffe pas à l'arrêt.
- Paysage et portrait ; les boutons font au moins un doigt de large.

## Format d'une mission (fixé en phase 2.1)

Une mission est un fichier de `content/scenarios/`. Exemple complet : `m00-exemple-chambre-karim.json`.

| Champ | Contenu |
|---|---|
| `id`, `titre`, `statut` | `statut` : `brouillon` ou `valide` (seule Audrey passe une mission à `valide`). |
| `duree_min` | 20 au plus. |
| `sequence_requise` | `S1` à `S7` : la séquence de cours que la mission suppose. |
| `lieu` | id de la zone où se passe la mission (l'agent s'y rend au début). |
| `personnages` | ids des résidents et du personnel concernés. |
| `competences` | liste de `{ code, critere }`, critère **mot pour mot** du référentiel. |
| `situation`, `objectif_eleve` | phrases courtes lues au début. |
| `transfert` | facultatif. `true` si c'est une situation nouvelle : seul cas où N4 est possible. |
| `confiance_depart` | facultatif, de 0 à 10 (5 par défaut). |
| `etapes` | la suite des étapes (voir ci-dessous). |
| `debriefing` | 2 ou 3 questions pour la relève de fin de mission. |

### Les 4 types d'étapes

Chaque étape a un `id`, un `type` et une `consigne`. Les **points** s'écrivent `{ "CT4.1": 2 }` : un entier de 0 à 3 par compétence, et seulement pour une compétence visée par la mission.

- **`dialogue`** : `interlocuteur` (id), `replique` (facultatif), puis trois listes d'options : `verbal` (la phrase), `paraverbal` (le ton, le débit), `non_verbal` (la posture, le regard). L'élève choisit une option dans chaque liste. Chaque option a `texte`, `retour`, `confiance` (de -2 à +2) et parfois `points`.
- **`observation`** (la loupe) : `elements`, chacun avec `id`, `libelle`, `colonne`, `rangee` (une case du lieu de la mission), `effet` (`facilite` ou `gene`), `retour` et `points`. L'élève touche chaque repère et dit s'il facilite ou gêne l'activité.
- **`decision`** : `question` et `choix`, chacun avec `decision` (`agir`, `adapter` ou `alerter`), `texte`, `retour`, `points` et éventuellement `suite` (id de l'étape suivante, ou `fin`). Sans `suite`, on passe à l'étape d'après.
- **`relais`** : `destinataire` (id du membre du personnel à rejoindre), `points` (gagnés seulement au premier essai), `retour` et `retour_erreur` (l'élève peut réessayer).

### Les niveaux (moteur : `src/regles/mission.ts`)

Pour chaque compétence, le moteur compare les points obtenus au maximum possible (le meilleur choix à chaque étape) : moins de 40 % → **N1**, moins de 70 % → **N2**, sinon **N3**. **N4** demande 90 % dans une mission marquée `transfert`. Il n'y a jamais de note globale.

`pnpm valider` refuse : une étape sans identifiant unique, une `suite` qui ne mène nulle part, des points pour une compétence non visée, une compétence visée qui ne rapporte jamais de points, un repère hors du lieu, un relais vers une personne inconnue, un dialogue avec moins de 2 options par canal, un débriefing qui n'a pas 2 ou 3 questions.
