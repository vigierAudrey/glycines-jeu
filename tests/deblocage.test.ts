import { describe, expect, it } from 'vitest';
import type { Mission } from '../src/contenu/types';
import { dansFamille, estDebloquee, lireSequence, missionsAMontrer } from '../src/regles/deblocage';

const mission = (id: string, sequence_requise: string, statut: 'brouillon' | 'valide' = 'valide') => ({ id, sequence_requise, statut }) as Mission;

describe('déblocage des missions', () => {
  it('range une mission dans une famille selon ses compétences', () => {
    const m = { competences: [{ code: 'CT4.1', critere: '' }, { code: 'C2.1.6', critere: '' }] } as unknown as Mission;
    expect(dansFamille(m, 'CT4.')).toBe(true);
    expect(dansFamille(m, 'C2.1.')).toBe(true);
    expect(dansFamille(m, 'C2.2.')).toBe(false);
    expect(dansFamille(m, null)).toBe(true);
  });

  it('ouvre toujours une mission de PSE, rangée après le Bloc 2', () => {
    const pse = { ...mission('m90', 'S5'), discipline: 'PSE' } as Mission;
    expect(estDebloquee(pse, 'S1')).toBe(true);
    expect(missionsAMontrer([pse, mission('m02', 'S7')], false).map((m) => m.id)).toEqual(['m02', 'm90']);
  });

  it('ouvre une mission quand sa séquence a été vue', () => {
    expect(estDebloquee(mission('m01', 'S2'), 'S2')).toBe(true);
    expect(estDebloquee(mission('m01', 'S2'), 'S5')).toBe(true);
    expect(estDebloquee(mission('m01', 'S3'), 'S2')).toBe(false);
  });

  it('range par séquence et cache les brouillons sauf demande', () => {
    const liste = [mission('m03', 'S3'), mission('m01', 'S1', 'brouillon'), mission('m02', 'S1')];
    expect(missionsAMontrer(liste, false).map((m) => m.id)).toEqual(['m02', 'm03']);
    expect(missionsAMontrer(liste, true).map((m) => m.id)).toEqual(['m01', 'm02', 'm03']);
  });

  it('lit une séquence tapée à la main', () => {
    expect(lireSequence(' s3 ')).toBe('S3');
    expect(lireSequence('S9')).toBeUndefined();
    expect(lireSequence(null)).toBeUndefined();
  });
});
