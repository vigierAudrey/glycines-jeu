import { describe, expect, it } from 'vitest';
import type { Lieu } from '../src/contenu/types';
import { lirePlan, positionDansZone, trouverZone } from '../src/regles/plan';
import aileB from '../content/lieux/aile-b.json';

// Un mini-plan écrit à la main : deux chambres reliées au couloir par une porte chacune.
const miniPlan: Lieu = {
  id: 'test',
  nom: 'Plan de test',
  vide: '.',
  grille: ['AABB', 'pAtB', 'CCCC'],
  zones: {
    A: { id: 'a', nom: 'Chambre A', type: 'chambre', couleur: '#ffffff' },
    B: { id: 'b', nom: 'Chambre B', type: 'chambre', couleur: '#ffffff' },
    C: { id: 'c', nom: 'Couloir', type: 'circulation', couleur: '#ffffff' },
    p: { id: 'porte', nom: 'Porte', type: 'porte', couleur: '#ffffff' },
    t: { id: 'porte2', nom: 'Porte', type: 'porte', couleur: '#ffffff' },
  },
};

describe('lirePlan', () => {
  it('regroupe les cases par zone et calcule leur centre', () => {
    const plan = lirePlan(miniPlan);
    expect(plan.largeur).toBe(4);
    expect(plan.profondeur).toBe(3);
    const a = trouverZone(plan, 'a')!;
    expect(a.cases).toHaveLength(3);
    expect(a.centre.x).toBeCloseTo((0.5 + 1.5 + 1.5) / 3);
  });

  it('ne pose pas de mur à côté d’une porte', () => {
    const plan = lirePlan(miniPlan);
    // La porte « t » est en colonne 2, rangée 1 : aucun mur sur ses quatre bords.
    const bordsDeLaPorte = plan.murs.filter(
      (m) => (m.x === 2 || m.x === 3) && m.z === 1.5 || (m.x === 2.5 && (m.z === 1 || m.z === 2)),
    );
    expect(bordsDeLaPorte).toHaveLength(0);
  });

  it('ferme le bâtiment sur son pourtour', () => {
    const plan = lirePlan(miniPlan);
    const bordNord = plan.murs.filter((m) => m.z === 0);
    expect(bordNord).toHaveLength(4);
  });

  it('refuse un caractère inconnu', () => {
    expect(() => lirePlan({ ...miniPlan, grille: ['AAZB'] })).toThrow(/inconnu/);
  });

  it('lit le plan réel de l’aile B', () => {
    const plan = lirePlan(aileB as Lieu);
    expect(plan.largeur).toBe(24);
    expect(trouverZone(plan, 'chambre-karim')).toBeDefined();
    expect(plan.murs.length).toBeGreaterThan(50);
  });

  it('ouvre la deuxième porte entre le couloir et la salle à manger (aile B)', () => {
    const plan = lirePlan(aileB as Lieu);
    // La nouvelle porte est en colonne 22, rangée 3 : juste au-dessus du couloir (rangée 4).
    expect((aileB as Lieu).grille[3][22]).toBe('p');
    const bordsDeLaPorte = plan.murs.filter(
      (m) => ((m.x === 22 || m.x === 23) && m.z === 3.5) || (m.x === 22.5 && (m.z === 3 || m.z === 4)),
    );
    expect(bordsDeLaPorte).toHaveLength(0);
  });

  it('a un patio de 5 rangées (aile B)', () => {
    const patio = trouverZone(lirePlan(aileB as Lieu), 'patio')!;
    expect(new Set(patio.cases.map((c) => c.rangee)).size).toBe(5);
  });
});

describe('positionDansZone', () => {
  it('donne des cases différentes pour poser plusieurs personnes', () => {
    const zone = trouverZone(lirePlan(miniPlan), 'c')!;
    const p0 = positionDansZone(zone, 0);
    const p1 = positionDansZone(zone, 1);
    expect(p0).not.toEqual(p1);
  });

  it('ne pose jamais une personne sur un lit ou un fauteuil (aile B)', () => {
    const plan = lirePlan(aileB as Lieu);
    const occupees = new Set(plan.meubles.filter((m) => m.bloquant).flatMap((m) => m.cases.map((c) => `${c.colonne + 0.5};${c.rangee + 0.5}`)));
    for (const zone of plan.zones) {
      for (let n = 0; n < 4; n++) {
        const { x, z } = positionDansZone(zone, n);
        expect(occupees.has(`${x};${z}`)).toBe(false);
      }
    }
  });
});

describe('meubles', () => {
  const avecLit = lirePlan({ ...miniPlan, meubles: [{ type: 'lit', colonne: 2, rangee: 2, vers: 'est' }] });

  it('un lit occupe 2 cases : la tête puis les pieds dans la direction « vers »', () => {
    expect(avecLit.meubles[0].cases).toEqual([{ colonne: 2, rangee: 2 }, { colonne: 3, rangee: 2 }]);
  });

  it('les cases d’un meuble ne sont plus libres', () => {
    const couloir = trouverZone(avecLit, 'c')!;
    expect(couloir.cases).toHaveLength(4);
    expect(couloir.casesLibres).toEqual([{ colonne: 0, rangee: 2 }, { colonne: 1, rangee: 2 }]);
  });

  it('la sonnette ne bloque pas le passage', () => {
    const plan = lirePlan({ ...miniPlan, meubles: [{ type: 'sonnette', colonne: 0, rangee: 2, vers: 'sud' }] });
    expect(trouverZone(plan, 'c')!.casesLibres).toHaveLength(4);
  });

  it('chaque chambre de l’aile B a un lit et une sonnette', () => {
    const plan = lirePlan(aileB as Lieu);
    for (const chambre of plan.zones.filter((z) => z.type === 'chambre')) {
      const dans = (m: { cases: { colonne: number; rangee: number }[] }) =>
        chambre.cases.some((c) => c.colonne === m.cases[0].colonne && c.rangee === m.cases[0].rangee);
      const types = plan.meubles.filter(dans).map((m) => m.type);
      expect(types, chambre.nom).toContain('lit');
      expect(types, chambre.nom).toContain('sonnette');
    }
  });
});
