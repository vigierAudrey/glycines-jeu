# Une journée aux Glycines

Jeu sérieux en 3D isométrique pour les élèves de terminale **CAP Agent accompagnant au grand âge** (Bloc 2 d'abord, puis PSE et Bloc 1).
L'élève joue un agent accompagnant au grand âge dans l'aile B de l'EHPAD fictif Les Glycines.

## Démarrer

Dans le terminal Ubuntu (WSL), Node.js 20.19 ou plus récent, et pnpm installé une fois pour toutes avec `sudo npm install -g pnpm@12.11.2` :

```bash
cd ~/dev/glycine/glycines-jeu/glycines-jeu
pnpm install       # une seule fois : installe les bibliothèques
pnpm dev           # lance le jeu ; ouvrir l'adresse « Local » affichée (http://localhost:5173)
```

Avant chaque commit : `pnpm verifier`.

Adresses utiles pendant le développement :

- `http://localhost:5173/?sequence=S2` : le jeu, avec les missions de la séquence S2 ouvertes ;
- `http://localhost:5173/enseignante.html` : la page enseignante (missions, réponses attendues, débriefing, lien pour la classe).

## Documents

- [Cahier des charges](docs/CAHIER_DES_CHARGES.md) : ce que le jeu doit faire, et ne pas faire
- [Feuille de route](docs/ROADMAP.md) : l'avancement, tâche par tâche
- [Architecture](docs/ARCHITECTURE.md) : comment le jeu est construit
- [Décisions](docs/DECISIONS.md) · [Journal](docs/JOURNAL.md) · [Glossaire](docs/GLOSSAIRE.md) · [Prompts](docs/PROMPTS.md)
- [CLAUDE.md](CLAUDE.md) : les règles que suivent les IA de développement

Contenu pédagogique : référentiel du CAP AAGA, arrêté du 6 février 2023. Aucune donnée personnelle d'élève n'est collectée.
