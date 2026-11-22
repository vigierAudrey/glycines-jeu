import { describe, expect, it } from 'vitest';
import { appliquerVariante, tirerVariante } from '../src/regles/variantes';
import { pointsMaxMission } from '../src/regles/mission';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const contenu = lireContenuDepuisDisque();
const m09 = contenu.missions.find((m) => m.id === 'm09-rose-malentendante')!;

describe('variantes d\'une mission', () => {
  it('m09 a au moins une variante', () => {
    expect(m09.variantes?.length).toBeGreaterThan(0);
  });

  it('une variante change le contexte, pas les points', () => {
    const v = appliquerVariante(m09, m09.variantes![0]);
    expect(v.situation).toBe(m09.variantes![0].situation);
    expect(v.id).toBe(m09.id);
    expect(pointsMaxMission(v)).toEqual(pointsMaxMission(m09));
  });

  it('le tirage peut rendre la version de base ou une variante', () => {
    expect(tirerVariante(m09, () => 0)).toBe(m09);
    expect(tirerVariante(m09, () => 0.99).situation).toBe(m09.variantes!.at(-1)!.situation);
  });

  it('une mission sans variante reste la même', () => {
    const sans = contenu.missions.find((m) => !m.variantes)!;
    expect(tirerVariante(sans, () => 0.7)).toBe(sans);
  });
});
