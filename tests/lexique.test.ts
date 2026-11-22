import { describe, expect, it } from 'vitest';
import { decouperAvecLexique } from '../src/regles/lexique';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const lexique = lireContenuDepuisDisque().lexique!;

describe('lexique du métier', () => {
  it('repère un mot du lexique, une seule fois, sans changer le texte', () => {
    const texte = 'Respectez son projet de vie. Le projet de vie compte.';
    const morceaux = decouperAvecLexique(texte, lexique);
    expect(morceaux.map((m) => m.texte).join('')).toBe(texte);
    expect(morceaux.filter((m) => m.entree)).toHaveLength(1);
    expect(morceaux.find((m) => m.entree)!.texte).toBe('projet de vie');
  });

  it('préfère le mot le plus long et accepte les deux apostrophes', () => {
    const m = decouperAvecLexique("Le détergent-désinfectant et le seuil d'alerte.", lexique).filter((x) => x.entree);
    expect(m.map((x) => x.entree!.mot)).toEqual(['Détergent-désinfectant', 'Seuil d’alerte']);
  });

  it('ne coupe pas un mot au milieu', () => {
    expect(decouperAvecLexique('Les relaisxyz', lexique).some((m) => m.entree)).toBe(false);
  });
});
