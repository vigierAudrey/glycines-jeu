import { describe, expect, it } from 'vitest';
import type { Lieu } from '../src/contenu/types';
import { caseEn, trouverChemin } from '../src/regles/chemin';
import { lirePlan, trouverZone, type Case } from '../src/regles/plan';
import aileB from '../content/lieux/aile-b.json';

// Deux chambres séparées par un mur, chacune reliée au couloir par une porte.
//   A A . B B
//   A p . p B
//   C C C C C
const lieu: Lieu = {
  id: 'test',
  nom: 'Plan de test',
  vide: '.',
  grille: ['AA.BB', 'Ap.pB', 'CCCCC'],
  zones: {
    A: { id: 'a', nom: 'Chambre A', type: 'chambre', couleur: '#ffffff' },
    B: { id: 'b', nom: 'Chambre B', type: 'chambre', couleur: '#ffffff' },
    C: { id: 'c', nom: 'Couloir', type: 'circulation', couleur: '#ffffff' },
    p: { id: 'porte', nom: 'Porte', type: 'porte', couleur: '#ffffff' },
  },
};
const plan = lirePlan(lieu);
const ici = (colonne: number, rangee: number): Case => ({ colonne, rangee });

describe('trouverChemin', () => {
  it('va tout droit quand rien ne gêne', () => {
    expect(trouverChemin(plan, ici(0, 2), ici(4, 2))).toEqual([ici(0, 2), ici(1, 2), ici(2, 2), ici(3, 2), ici(4, 2)]);
  });

  it('renvoie la case de départ seule si on y est déjà', () => {
    expect(trouverChemin(plan, ici(0, 0), ici(0, 0))).toEqual([ici(0, 0)]);
  });

  it('passe par les portes pour aller d’une chambre à l’autre', () => {
    const chemin = trouverChemin(plan, ici(0, 0), ici(4, 0))!;
    expect(chemin).not.toBeNull();
    expect(chemin).toContainEqual(ici(1, 1)); // porte de A
    expect(chemin).toContainEqual(ici(3, 1)); // porte de B
  });

  it('ne traverse jamais un mur', () => {
    const murs = new Set(plan.murs.map((m) => `${m.x};${m.z}`));
    const chemin = trouverChemin(plan, ici(0, 0), ici(4, 0))!;
    for (let i = 1; i < chemin.length; i++) {
      const a = chemin[i - 1];
      const b = chemin[i];
      if (a.rangee === b.rangee) expect(murs.has(`${Math.max(a.colonne, b.colonne)};${a.rangee + 0.5}`)).toBe(false);
      if (a.colonne === b.colonne) expect(murs.has(`${a.colonne + 0.5};${Math.max(a.rangee, b.rangee)}`)).toBe(false);
    }
  });

  it('ne coupe pas le coin d’un mur en diagonale', () => {
    // De la chambre A (0,1) au couloir (1,2), la diagonale frôlerait le mur entre A et le couloir.
    // Il faut d'abord entrer dans la porte (1,1), puis descendre.
    const chemin = trouverChemin(plan, ici(0, 1), ici(1, 2))!;
    expect(chemin).toEqual([ici(0, 1), ici(1, 1), ici(1, 2)]);
  });

  it('refuse une arrivée hors du bâtiment ou sur le vide', () => {
    expect(trouverChemin(plan, ici(0, 0), ici(2, 0))).toBeNull(); // case vide « . »
    expect(trouverChemin(plan, ici(0, 0), ici(9, 9))).toBeNull(); // hors de la grille
  });

  it('renvoie null quand une pièce est fermée', () => {
    const ferme = lirePlan({ ...lieu, grille: ['AA.BB', 'AA.pB', 'CCCCC'] }); // la chambre A n'a plus de porte
    expect(trouverChemin(ferme, ici(0, 0), ici(4, 2))).toBeNull();
  });

  it('trouve un chemin dans l’aile B, du couloir au patio', () => {
    const planAile = lirePlan(aileB as Lieu);
    const patio = trouverZone(planAile, 'patio')!;
    const chemin = trouverChemin(planAile, ici(0, 4), patio.cases[patio.cases.length - 1]);
    expect(chemin).not.toBeNull();
    expect(chemin).toContainEqual(ici(18, 9)); // la porte entre le salon et le patio
  });
});

describe('trouverChemin avec des meubles', () => {
  it('contourne un lit', () => {
    // Un lit en travers du couloir, sur les colonnes 1 et 2 : il faut passer par… nulle part (couloir d'une case).
    const bloque = lirePlan({ ...lieu, meubles: [{ type: 'lit', colonne: 1, rangee: 2, vers: 'est' }] });
    expect(trouverChemin(bloque, ici(0, 2), ici(4, 2))).toBeNull();
    // Avec un lit dans la chambre A, on peut toujours entrer par la porte et atteindre la case libre.
    const chambre = lirePlan({ ...lieu, meubles: [{ type: 'lit', colonne: 0, rangee: 0, vers: 'sud' }] });
    expect(trouverChemin(chambre, ici(4, 2), ici(1, 0))).not.toBeNull();
  });

  it('refuse d’arriver sur un meuble', () => {
    const chambre = lirePlan({ ...lieu, meubles: [{ type: 'fauteuil', colonne: 0, rangee: 0, vers: 'sud' }] });
    expect(trouverChemin(chambre, ici(4, 2), ici(0, 0))).toBeNull();
  });

  it('atteint toutes les cases libres de l’aile B depuis le couloir : aucun meuble ne ferme une pièce', () => {
    const planAile = lirePlan(aileB as Lieu);
    for (const zone of planAile.zones) {
      for (const c of zone.casesLibres) expect(trouverChemin(planAile, ici(0, 4), c), `${zone.nom} (${c.colonne}, ${c.rangee})`).not.toBeNull();
    }
  });
});

describe('caseEn', () => {
  it('trouve la case qui contient un point du sol', () => {
    expect(caseEn(2.7, 0.1)).toEqual(ici(2, 0));
  });
});
