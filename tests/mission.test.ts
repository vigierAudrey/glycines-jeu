import { describe, expect, it } from 'vitest';
import type { Mission } from '../src/contenu/types';
import { bilan, demarrerMission, niveau, pointsMaxMission, repondre, type EtatMission, type Reponse } from '../src/regles/mission';
import { lireContenuDepuisDisque } from '../tools/valider-contenu';

const karim = lireContenuDepuisDisque().missions.find((m) => m.id === 'm00-exemple-chambre-karim')!;

/** Joue une suite de réponses et renvoie l'état final. */
const jouer = (mission: Mission, reponses: Reponse[]): EtatMission =>
  reponses.reduce((etat, r) => repondre(mission, etat, r).etat, demarrerMission(mission));

const parcoursParfait: Reponse[] = [
  { type: 'dialogue', verbal: 0, paraverbal: 0, non_verbal: 0 },
  { type: 'observation', classements: { 'sol-mouille': 'gene', 'fauteuil-sans-freins': 'gene', 'sonnette-loin': 'gene', 'affaires-pretes': 'facilite', 'lit-bas': 'facilite' } },
  { type: 'decision', choix: 0 },
  { type: 'decision', choix: 0 },
  { type: 'relais', destinataire: 'ash' },
];

describe('moteur de mission', () => {
  it('démarre à la première étape avec la confiance de départ', () => {
    const etat = demarrerMission(karim);
    expect(etat.etape).toBe('entrer');
    expect(etat.confiance).toBe(5);
    expect(etat.points).toEqual({});
  });

  it('un parcours parfait donne tous les points, N3 partout, et termine la mission', () => {
    const etat = jouer(karim, parcoursParfait);
    expect(etat.etape).toBeNull();
    expect(etat.points).toEqual(pointsMaxMission(karim));
    expect(bilan(karim, etat).competences.map((c) => c.niveau)).toEqual(['N3', 'N3', 'N3']);
    expect(etat.decisions).toEqual(['agir', 'adapter']);
  });

  it('le dialogue fait bouger la confiance, bornée entre 0 et 10', () => {
    const bien = repondre(karim, demarrerMission(karim), parcoursParfait[0] as Reponse);
    expect(bien.etat.confiance).toBe(9);
    expect(bien.reussi).toBe(true);
    const mal = repondre(karim, demarrerMission(karim), { type: 'dialogue', verbal: 1, paraverbal: 1, non_verbal: 1 });
    expect(mal.etat.confiance).toBe(0);
    expect(mal.reussi).toBe(false);
    expect(mal.retours).toHaveLength(3);
  });

  it('l\'observation compte un point par élément bien classé', () => {
    const etat = jouer(karim, [parcoursParfait[0], { type: 'observation', classements: { 'sol-mouille': 'gene', 'lit-bas': 'gene' } }]);
    expect(etat.points['CT3.3']).toBe(1);
    expect(etat.points['CT3.1']).toBe(1);
  });

  it('un mauvais destinataire laisse réessayer, sans les points', () => {
    const avant = jouer(karim, parcoursParfait.slice(0, 4));
    const erreur = repondre(karim, avant, { type: 'relais', destinataire: 'infirmiere' });
    expect(erreur.etat.etape).toBe('prevenir');
    expect(erreur.etat.essais).toBe(1);
    const ensuite = repondre(karim, erreur.etat, { type: 'relais', destinataire: 'ash' });
    expect(ensuite.etat.etape).toBeNull();
    expect(ensuite.etat.points['CT3.1']).toBe(avant.points['CT3.1']);
  });

  it('refuse une réponse qui ne correspond pas à l\'étape', () => {
    expect(() => repondre(karim, demarrerMission(karim), { type: 'decision', choix: 0 })).toThrow(/inattendue/);
  });

  it('suit la suite indiquée par un choix', () => {
    const mission = {
      ...karim,
      etapes: [
        { id: 'a', type: 'decision', consigne: '', question: '', choix: [
          { decision: 'alerter', texte: '', retour: '', suite: 'c' },
          { decision: 'agir', texte: '', retour: '', suite: 'fin' },
        ] },
        { id: 'b', type: 'relais', consigne: '', destinataire: 'ash', retour: '', retour_erreur: '' },
        { id: 'c', type: 'relais', consigne: '', destinataire: 'infirmiere', retour: '', retour_erreur: '' },
      ],
    } as Mission;
    expect(repondre(mission, demarrerMission(mission), { type: 'decision', choix: 0 }).etat.etape).toBe('c');
    expect(repondre(mission, demarrerMission(mission), { type: 'decision', choix: 1 }).etat.etape).toBeNull();
  });
});

describe('niveaux', () => {
  it('suivent la part des points obtenus', () => {
    expect(niveau(0, 10)).toBe('N1');
    expect(niveau(4, 10)).toBe('N2');
    expect(niveau(7, 10)).toBe('N3');
    expect(niveau(10, 10)).toBe('N3');
  });
  it('N4 seulement dans une mission de transfert', () => {
    expect(niveau(9, 10, true)).toBe('N4');
    expect(niveau(8, 10, true)).toBe('N3');
  });
});
