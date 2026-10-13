// Recherche de chemin sur la grille du plan (couche « règles » : aucune 3D ici, donc testable sans navigateur).
//
// Algorithme A* (« A étoile ») : on explore les cases en partant du départ, en choisissant toujours
// la case la plus prometteuse, celle dont le total « chemin déjà parcouru + distance à vol d'oiseau
// jusqu'à l'arrivée » est le plus petit. Dès qu'on atteint l'arrivée, on remonte les cases
// une à une jusqu'au départ : c'est le chemin le plus court.
//
// Règles de déplacement :
// - on ne marche que sur les cases libres d'une zone (pas sur le vide, pas à travers un lit ou un fauteuil) ;
// - on passe d'une case à sa voisine seulement s'il n'y a pas de mur entre les deux (murs calculés par plan.ts) ;
// - on peut aller en diagonale, mais sans « couper le coin » d'un mur : les deux cases voisines du coin doivent être accessibles.

import type { Case, PlanCalcule } from './plan';

const DIAGONALE = Math.SQRT2; // coût d'un pas en diagonale (1,41 m) ; un pas droit coûte 1 m

const DIRECTIONS: [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/** Case de la grille qui contient le point (x, z) du monde 3D. */
export function caseEn(x: number, z: number): Case {
  return { colonne: Math.floor(x), rangee: Math.floor(z) };
}

/** Centre d'une case dans le monde 3D. */
export function centreDe(c: Case): { x: number; z: number } {
  return { x: c.colonne + 0.5, z: c.rangee + 0.5 };
}

/**
 * Plus court chemin entre deux cases, départ et arrivée compris.
 * Renvoie null si l'arrivée n'est pas praticable ou si aucun chemin n'y mène.
 */
export function trouverChemin(plan: PlanCalcule, depart: Case, arrivee: Case): Case[] | null {
  const praticables = new Set(plan.zones.flatMap((z) => z.casesLibres.map(cle)));
  const murs = new Set(plan.murs.map((m) => `${m.x};${m.z};${m.orientation}`));
  if (!praticables.has(cle(depart)) || !praticables.has(cle(arrivee))) return null;

  // Peut-on faire un pas droit de a vers sa voisine b ?
  const pasDroitPossible = (a: Case, b: Case): boolean => {
    if (!praticables.has(cle(b))) return false;
    const mur =
      a.rangee === b.rangee
        ? `${Math.max(a.colonne, b.colonne)};${a.rangee + 0.5};le-long-de-z`
        : `${a.colonne + 0.5};${Math.max(a.rangee, b.rangee)};le-long-de-x`;
    return !murs.has(mur);
  };

  // Un pas en diagonale = deux pas droits possibles, par un côté comme par l'autre.
  const pasPossible = (a: Case, b: Case): boolean => {
    if (a.colonne === b.colonne || a.rangee === b.rangee) return pasDroitPossible(a, b);
    const coin1 = { colonne: b.colonne, rangee: a.rangee };
    const coin2 = { colonne: a.colonne, rangee: b.rangee };
    return pasDroitPossible(a, coin1) && pasDroitPossible(coin1, b) && pasDroitPossible(a, coin2) && pasDroitPossible(coin2, b);
  };

  // Distance estimée jusqu'à l'arrivée, sans tenir compte des murs (elle ne surestime jamais : A* reste exact).
  const estimation = (c: Case): number => {
    const dx = Math.abs(c.colonne - arrivee.colonne);
    const dz = Math.abs(c.rangee - arrivee.rangee);
    return Math.max(dx, dz) + (DIAGONALE - 1) * Math.min(dx, dz);
  };

  const coutDepuisDepart = new Map<string, number>([[cle(depart), 0]]);
  const venuDe = new Map<string, Case>(); // pour remonter le chemin à la fin
  const aExplorer = new Map<string, Case>([[cle(depart), depart]]);

  while (aExplorer.size > 0) {
    // On prend la case la plus prometteuse. Le plan est petit (quelques centaines de cases) :
    // un simple parcours de la liste suffit, pas besoin d'une structure plus savante.
    let courante!: Case;
    let meilleurTotal = Infinity;
    for (const c of aExplorer.values()) {
      const total = coutDepuisDepart.get(cle(c))! + estimation(c);
      if (total < meilleurTotal) {
        meilleurTotal = total;
        courante = c;
      }
    }

    if (courante.colonne === arrivee.colonne && courante.rangee === arrivee.rangee) {
      const chemin = [courante];
      let c: Case | undefined = venuDe.get(cle(courante));
      for (; c; c = venuDe.get(cle(c))) chemin.unshift(c);
      return chemin;
    }

    aExplorer.delete(cle(courante));
    for (const [dc, dr] of DIRECTIONS) {
      const voisine = { colonne: courante.colonne + dc, rangee: courante.rangee + dr };
      if (!pasPossible(courante, voisine)) continue;
      const cout = coutDepuisDepart.get(cle(courante))! + (dc !== 0 && dr !== 0 ? DIAGONALE : 1);
      if (cout < (coutDepuisDepart.get(cle(voisine)) ?? Infinity)) {
        coutDepuisDepart.set(cle(voisine), cout);
        venuDe.set(cle(voisine), courante);
        aExplorer.set(cle(voisine), voisine);
      }
    }
  }
  return null; // toutes les cases accessibles ont été explorées sans trouver l'arrivée
}

function cle(c: Case): string {
  return `${c.colonne};${c.rangee}`;
}
