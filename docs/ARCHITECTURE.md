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
├── index.html                    la page : un calque 3D (#scene) et un calque interface (#interface)
├── package.json                  dépendances et commandes (pnpm)
├── pnpm-workspace.yaml           réglages de pnpm (bibliothèques autorisées à s'installer)
├── vite.config.ts, tsconfig.json réglages de Vite et de TypeScript
├── content/
│   ├── referentiel/bloc2.json    14 sous-compétences : NE PAS MODIFIER À LA MAIN
│   ├── lieux/aile-b.json         le plan en grille de lettres
│   ├── personnages/              residents.json, personnel.json
│   └── scenarios/                une mission par fichier
├── src/
│   ├── main.ts                   point d'entrée : branche les couches dans l'ordre
│   ├── contenu/                  types.ts (forme des données), charger.ts, valider.ts
│   ├── regles/                   plan.ts (grille → zones, centres, murs), chemin.ts (recherche de chemin A*),
│   │                             fiche.ts (nom et rôle d'une personne, pour la bulle)
│   ├── scene3d/                  creerScene.ts (caméra, contrôles, boucle d'animation), construireAile.ts, personnages.ts,
│   │                             toucher.ts (toucher bref ou glisser, raycasting), marche.ts (marche de l'agent)
│   └── ui/                       interface.ts (barre, boutons, légende), bulle.ts (bulle d'une personne touchée)
├── tools/valider-contenu.ts      la commande « pnpm valider »
├── tests/                        tests automatiques (Vitest)
└── docs/                         ce dossier
```

## Le plan en données (`content/lieux/aile-b.json`)

Chaque caractère de `grille` est une case de 1 m × 1 m. Une lettre majuscule = une zone (décrite dans `zones`), `p` = une porte, `.` = rien.
Les murs ne sont pas dessinés à la main : `src/regles/plan.ts` les calcule. Il pose un mur entre deux cases de zones différentes, sauf si l'une est une porte ou si les deux sont dehors.

**Exercice** : remplace un `R` par un `p` sur le bord de la chambre de Mme Rose et regarde la nouvelle porte apparaître.

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
- **A\*** (« A étoile ») : algorithme de plus court chemin sur la grille (`src/regles/chemin.ts`). Il explore d'abord les cases dont « chemin déjà fait + distance à vol d'oiseau restante » est le plus petit. On marche en 8 directions, jamais à travers un mur, et sans couper le coin d'un mur en diagonale.
- **Étiquettes HTML (CSS2DRenderer)** : les noms au-dessus des têtes sont du vrai texte HTML, net et lisible, pas des pixels dans la 3D.
- **Densité d'étiquettes** : selon le nombre de pixels par mètre à l'écran, le CSS masque les noms des chambres puis des pièces pour éviter les chevauchements (`data-densite` sur `#scene`).

## Commandes

| Commande | Effet |
|---|---|
| `pnpm dev` | Lance le serveur de développement (rechargement automatique). Adresse affichée dans le terminal. |
| `pnpm verifier` | Lance tout : types, validation du contenu, tests, construction. **À passer avant chaque commit.** |
| `pnpm valider` | Vérifie seulement le contenu (référentiel, plan, personnages, missions). |
| `pnpm test` | Lance seulement les tests. |
| `pnpm build` | Fabrique la version publiable dans `dist/`. |

## Tester sur un téléphone (phase 1.5)

`pnpm dev` écoute sur le réseau (`--host`), mais WSL2 isole son réseau de celui de Windows : le téléphone ne voit pas le serveur directement. Deux solutions seront documentées en phase 1.5 : activer le réseau « mirrored » de WSL, ou une redirection de port côté Windows.

## Format d'une mission (provisoire, fixé en phase 2.1)

Champs obligatoires aujourd'hui : `id`, `statut` (`brouillon` ou `valide`), `titre`, `duree_min` (20 max), `sequence_requise` (`S1` à `S7`), `lieu` (id de zone), `personnages` (ids), `competences` (liste de `{ code, critere }` avec le critère **mot pour mot**), `situation`, `objectif_eleve`. Le reste est libre jusqu'à la phase 2.
