import { describe, expect, it } from 'vitest';
import { decoderCode, encoderCode, enregistrerBilan, prefixeMission } from '../src/regles/sauvegarde';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const missions = lireContenuDepuisDisque().missions;
const karim = missions.find((m) => m.id === 'm00-exemple-chambre-karim')!;
const bilan = {
  mission: karim.id,
  confiance: 7,
  debriefing: [],
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
});
