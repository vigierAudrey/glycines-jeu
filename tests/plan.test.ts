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
});

describe('positionDansZone', () => {
  it('donne des cases différentes pour poser plusieurs personnes', () => {
    const zone = trouverZone(lirePlan(miniPlan), 'c')!;
    const p0 = positionDansZone(zone, 0);
    const p1 = positionDansZone(zone, 1);
    expect(p0).not.toEqual(p1);
  });
});
