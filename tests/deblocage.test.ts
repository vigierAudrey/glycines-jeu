import { describe, expect, it } from 'vitest';
import type { Mission } from '../src/contenu/types';
import { estDebloquee, lireSequence, missionsAMontrer } from '../src/regles/deblocage';

const mission = (id: string, sequence_requise: string, statut: 'brouillon' | 'valide' = 'valide') => ({ id, sequence_requise, statut }) as Mission;

describe('déblocage des missions', () => {
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
