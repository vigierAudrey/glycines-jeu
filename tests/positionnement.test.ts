import { describe, expect, it } from 'vitest';
import { comparerEstimation } from '../src/regles/positionnement';

describe('auto-positionnement', () => {
  it('compare l\'estimation au niveau obtenu', () => {
    expect(comparerEstimation('N2', 'N2')).toBe('juste');
    expect(comparerEstimation('N1', 'N3')).toBe('mieux');
    expect(comparerEstimation('N4', 'N2')).toBe('moins');
  });
});
