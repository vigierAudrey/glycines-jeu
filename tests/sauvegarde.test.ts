import { describe, expect, it } from 'vitest';
import { decoderCode, encoderCode, enregistrerBilan, phraseIgnorees, prefixeMission } from '../src/regles/sauvegarde';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const missions = lireContenuDepuisDisque().missions;
const karim = missions.find((m) => m.id === 'm00-exemple-chambre-karim')!;
const bilan = {
  mission: karim.id,
  confiance: 7,
  debriefing: [],
  parcours: [],
  competences: karim.competences.map((c, i) => ({ ...c, points: 0, max: 0, niveau: (['N3', 'N3', 'N2'] as const)[i] })),
};

describe('code de reprise', () => {
  const progression = enregistrerBilan({}, bilan);

  it('prend le préfixe de la mission', () => expect(prefixeMission(karim.id)).toBe('M00'));

  it('résume la progression en quelques caractères', () => {
    expect(encoderCode(progression, missions)).toMatch(/^M00-332\.[0-9A-Z]{2}$/);
    expect(encoderCode({}, missions)).toBe('');
  });

  it('se relit, même en minuscules et avec des espaces', () => {
    const code = encoderCode(progression, missions);
    expect(decoderCode(code, missions)).toEqual({ progression });
    expect(decoderCode(` ${code.toLowerCase()} `, missions)).toEqual({ progression });
  });

  it('détecte une faute de frappe', () => {
    const code = encoderCode(progression, missions).replace('332', '333');
    expect(decoderCode(code, missions)).toEqual({ erreur: expect.stringMatching(/incorrect/) });
  });

  it('refuse un code vide', () => expect(decoderCode('', missions)).toHaveProperty('erreur'));

  it('garde le reste quand une mission a changé ou disparu depuis le code (nouvelle version du jeu)', () => {
    const autre = missions.find((m) => m.id !== karim.id)!;
    const avant = { ...progression, [autre.id]: Object.fromEntries(autre.competences.map((c) => [c.code, 'N2' as const])) };
    const code = encoderCode(avant, missions);
    // Nouvelle version : Karim a une compétence de moins, l'autre mission est inchangée.
    const karimModifiee = { ...karim, competences: karim.competences.slice(1) };
    const apres = missions.map((m) => (m.id === karim.id ? karimModifiee : m));
    expect(decoderCode(code, apres)).toEqual({ progression: { [autre.id]: avant[autre.id] }, ignorees: ['M00'] });
    // Mission retirée du jeu : même chose.
    expect(decoderCode(code, missions.filter((m) => m.id !== karim.id))).toEqual({ progression: { [autre.id]: avant[autre.id] }, ignorees: ['M00'] });
    expect(phraseIgnorees(['M00'])).toMatch(/Une mission a changé .*M00.* à refaire/);
  });
});
