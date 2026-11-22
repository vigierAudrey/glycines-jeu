import { describe, expect, it } from 'vitest';
import { melanger, melangerSansOrdreDeDepart } from '../src/regles/hasard';

describe('mélange', () => {
  it('garde les mêmes éléments', () => {
    expect(melanger([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it('ne rend jamais l\'ordre de départ pour un protocole', () => {
    const identite = () => 0.999; // ce tirage laisse la liste telle quelle avec Fisher-Yates
    expect(melangerSansOrdreDeDepart(['a', 'b', 'c'], identite)).not.toEqual(['a', 'b', 'c']);
  });
});
