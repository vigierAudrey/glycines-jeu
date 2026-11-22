import { describe, expect, it } from 'vitest';
import { rappelsAMontrer, rappelsApresMission } from '../src/regles/consequences';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const missions = lireContenuDepuisDisque().missions;
const m00 = missions.find((m) => m.id === 'm00-exemple-chambre-karim')!;
const etapeAvecRappel = m00.etapes.find((e) => e.si_oubli)!;

describe('conséquences plus tard', () => {
  it('une étape avec rappel manquée met le rappel de côté', () => {
    const r = rappelsApresMission([], m00, [{ etape: etapeAvecRappel.id, reponses: [], reussi: false }]);
    expect(r).toHaveLength(1);
    expect(r[0].texte).toBe(etapeAvecRappel.si_oubli);
  });

  it('réussir l\'étape en rejouant efface le rappel', () => {
    const avant = rappelsApresMission([], m00, [{ etape: etapeAvecRappel.id, reponses: [], reussi: false }]);
    expect(rappelsApresMission(avant, m00, [{ etape: etapeAvecRappel.id, reponses: [], reussi: true }])).toEqual([]);
  });

  it('le rappel se montre dans une autre mission, pas dans la même', () => {
    const r = rappelsApresMission([], m00, [{ etape: etapeAvecRappel.id, reponses: [], reussi: false }]);
    expect(rappelsAMontrer(r, m00.id)).toEqual([]);
    expect(rappelsAMontrer(r, 'm01-rose-patio-matin')).toHaveLength(1);
  });
});
