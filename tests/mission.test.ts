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

  it('le parcours garde, pour chaque étape terminée, les textes choisis (fiche de fin de mission)', () => {
    const etat = jouer(karim, parcoursParfait);
    expect(etat.parcours.map((t) => t.etape)).toEqual(karim.etapes.map((e) => e.id));
    expect(etat.parcours.every((t) => t.reussi && t.reponses.length > 0)).toBe(true);
    expect(bilan(karim, etat).parcours).toEqual(etat.parcours);
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

  it('une réponse incomplète signale les compétences à revoir, une réponse parfaite aucune', () => {
    const bien = repondre(karim, demarrerMission(karim), parcoursParfait[0] as Reponse);
    expect(bien.aRevoir).toEqual([]);
    const mal = repondre(karim, demarrerMission(karim), { type: 'dialogue', verbal: 1, paraverbal: 1, non_verbal: 1 });
    expect(mal.aRevoir.length).toBeGreaterThan(0);
    const codes = karim.competences.map((c) => c.code);
    expect(mal.aRevoir.every((c) => codes.includes(c))).toBe(true);
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

describe('étape transmission (tâche P.3)', () => {
  const m16 = lireContenuDepuisDisque().missions.find((m) => m.id === 'm16-rose-confusion-soudaine')!;
  const etape = m16.etapes.find((e) => e.type === 'transmission')!;
  if (etape.type !== 'transmission') throw new Error('m16 doit contenir une étape transmission');
  const avant: EtatMission = { ...demarrerMission(m16), etape: etape.id };

  it('un tri exact donne tous les points et la transmission ne garde que les faits', () => {
    const r = repondre(m16, avant, { type: 'transmission', classements: Object.fromEntries(etape.phrases.map((ph) => [ph.id, ph.nature])) });
    expect(r.reussi).toBe(true);
    const derniere = r.retours.at(-1)!;
    for (const ph of etape.phrases) expect(derniere.includes(ph.texte)).toBe(ph.nature === 'fait');
  });

  it('un jugement gardé comme fait se retrouve dans la transmission et coûte un point', () => {
    const classements = Object.fromEntries(etape.phrases.map((ph) => [ph.id, ph.nature === 'jugement' ? 'fait' : ph.nature])) as Record<string, 'fait' | 'jugement' | 'interpretation'>;
    const r = repondre(m16, avant, { type: 'transmission', classements });
    expect(r.reussi).toBe(false);
    expect(r.aRevoir).toEqual(['C2.1.6']);
    expect(r.retours.at(-1)).toContain('sénile');
  });
});

describe('protocole et sélection (tâches P.4 et P.5)', () => {
  const m21 = lireContenuDepuisDisque().missions.find((m) => m.id === 'm21-karim-entretien-methode')!;
  const [chariot, protocole] = m21.etapes;
  if (chariot.type !== 'selection' || protocole.type !== 'ordre') throw new Error('m21 : sélection puis protocole attendus');

  it('cocher un produit à laisser coûte son point et le signale', () => {
    const choisis = chariot.elements.map((el) => el.id); // tout coché, y compris le flacon sans étiquette
    const r = repondre(m21, demarrerMission(m21), { type: 'selection', choisis });
    expect(r.reussi).toBe(false);
    expect(r.etat.points['C2.2.1']).toBe(chariot.elements.filter((el) => el.attendu).length);
  });

  it('un protocole en partie inversé donne les points des seules étapes bien placées', () => {
    const avant: EtatMission = { ...demarrerMission(m21), etape: protocole.id };
    const ids = protocole.elements.map((el) => el.id);
    const inverse = [ids[1], ids[0], ...ids.slice(2)];
    const r = repondre(m21, avant, { type: 'ordre', ordre: inverse });
    expect(r.etat.points['C2.2.1']).toBe(ids.length - 2);
    expect(r.retours.join(' ')).toContain('L\'ordre attendu');
  });
});

describe('QCM et association (Q.2)', () => {
  const entrainement = {
    id: 'm99-test', statut: 'valide', titre: 'Test', duree_min: 5, sequence_requise: 'S1', lieu: 'couloir', personnages: ['joueur'],
    format: 'entrainement', competences: [{ code: 'CT3.1', critere: 'x' }], situation: '', objectif_eleve: '', debriefing: ['a', 'b'],
    etapes: [
      { id: 'q', type: 'qcm', consigne: '', question: 'Q ?', options: [{ texte: 'Non' }, { texte: 'Oui', juste: true }], points: { 'CT3.1': 2 }, retour: 'Parce que.' },
      { id: 'a', type: 'association', consigne: '', paires: [
        { id: 'p1', terme: 'A', definition: 'déf A', points: { 'CT3.1': 1 } },
        { id: 'p2', terme: 'B', definition: 'déf B', points: { 'CT3.1': 1 } },
        { id: 'p3', terme: 'C', definition: 'déf C', points: { 'CT3.1': 1 } }] },
    ],
  } as unknown as Mission;

  it('un QCM rapporte ses points seulement avec la bonne réponse', () => {
    expect(pointsMaxMission(entrainement)).toEqual({ 'CT3.1': 5 });
    const faux = repondre(entrainement, demarrerMission(entrainement), { type: 'qcm', choix: 0 });
    expect(faux.reussi).toBe(false);
    expect(faux.retours[0]).toContain('La bonne réponse : Oui');
    const juste = repondre(entrainement, demarrerMission(entrainement), { type: 'qcm', choix: 1 });
    expect(juste.etat.points['CT3.1']).toBe(2);
  });

  it('une association compte chaque paire bien reliée', () => {
    const apresQcm = repondre(entrainement, demarrerMission(entrainement), { type: 'qcm', choix: 1 }).etat;
    const r = repondre(entrainement, apresQcm, { type: 'association', liens: { p1: 'p1', p2: 'p3', p3: 'p2' } });
    expect(r.etat.points['CT3.1']).toBe(3);
    expect(r.retours.filter((t) => t.startsWith('✔'))).toHaveLength(1);
  });
});
