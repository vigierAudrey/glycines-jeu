// Validation du contenu pédagogique.
// Cette fonction ne lit aucun fichier : elle reçoit le contenu déjà chargé et renvoie la liste des problèmes.
// Elle est utilisée par tools/valider-contenu.ts (en ligne de commande) et par les tests.
//
// Règle d'or : le référentiel est la source de vérité. Une mission qui cite une compétence
// ou un critère absent du référentiel est refusée.

import { casesDuMeuble, LONGUEUR_MEUBLE, PAS } from '../regles/plan';
import type { Contenu, Lieu, Mission, Points } from './types';

export interface Probleme {
  fichier: string;
  message: string;
}

const COULEUR = /^#[0-9a-f]{6}$/i;
const TIRET_CADRATIN = '\u2014';

export function validerContenu(contenu: Contenu): Probleme[] {
  const problemes: Probleme[] = [];
  const signaler = (fichier: string, message: string) => problemes.push({ fichier, message });

  // ---------- Référentiel ----------
  const competences = new Map(contenu.referentiel.competences.map((c) => [c.code, c]));
  if (competences.size !== contenu.referentiel.competences.length) {
    signaler('referentiel', 'Deux compétences portent le même code.');
  }
  for (const c of contenu.referentiel.competences) {
    if (c.criteres_officiels.length === 0) signaler('referentiel', `${c.code} n'a aucun critère officiel.`);
  }

  // ---------- Lieux ----------
  const idsZones = new Set<string>();
  for (const lieu of contenu.lieux) {
    const f = `lieux/${lieu.id}`;
    const largeurs = new Set(lieu.grille.map((l) => l.length));
    if (largeurs.size > 1) signaler(f, `Les rangées de la grille n'ont pas toutes la même longueur (${[...largeurs].join(', ')}).`);
    lieu.grille.forEach((ligne, r) =>
      [...ligne].forEach((cle, c) => {
        if (cle !== lieu.vide && !lieu.zones[cle]) signaler(f, `Caractère « ${cle} » inconnu en rangée ${r}, colonne ${c}.`);
      }),
    );
    for (const [cle, zone] of Object.entries(lieu.zones)) {
      if (!COULEUR.test(zone.couleur)) signaler(f, `Zone « ${cle} » : couleur « ${zone.couleur} » invalide (attendu #rrggbb).`);
      if (zone.type !== 'porte' && !lieu.grille.some((l) => l.includes(cle))) signaler(f, `Zone « ${zone.nom} » déclarée mais absente de la grille.`);
      idsZones.add(zone.id);
    }
    validerMeubles(lieu, (message) => signaler(f, message));
  }

  // ---------- Personnages ----------
  const idsPersonnages = new Set<string>();
  const ajouterId = (fichier: string, id: string) => {
    if (idsPersonnages.has(id)) signaler(fichier, `Identifiant « ${id} » utilisé deux fois.`);
    idsPersonnages.add(id);
  };
  for (const r of contenu.residents) {
    ajouterId('personnages/residents', r.id);
    if (!idsZones.has(r.chambre)) signaler('personnages/residents', `${r.civilite} ${r.nom} : chambre « ${r.chambre} » introuvable dans les lieux.`);
  }
  for (const p of contenu.personnel) {
    ajouterId('personnages/personnel', p.id);
    if (!COULEUR.test(p.tenue)) signaler('personnages/personnel', `${p.prenom} : couleur de tenue « ${p.tenue} » invalide.`);
    if (!idsZones.has(p.zone_habituelle)) signaler('personnages/personnel', `${p.prenom} : zone « ${p.zone_habituelle} » introuvable.`);
  }
  if (contenu.personnel.filter((p) => p.joueur).length !== 1) signaler('personnages/personnel', 'Il faut exactement un personnage joueur.');

  // ---------- Missions ----------
  const idsMissions = new Set<string>();
  for (const m of contenu.missions) {
    const f = `scenarios/${m.id}`;
    if (idsMissions.has(m.id)) signaler(f, 'Identifiant de mission utilisé deux fois.');
    idsMissions.add(m.id);
    if (!['brouillon', 'valide'].includes(m.statut)) signaler(f, `Statut « ${m.statut} » inconnu (brouillon ou valide).`);
    if (!idsZones.has(m.lieu)) signaler(f, `Lieu « ${m.lieu} » introuvable.`);
    for (const id of m.personnages) if (!idsPersonnages.has(id)) signaler(f, `Personnage « ${id} » introuvable.`);
    if (!(m.duree_min > 0 && m.duree_min <= 20)) signaler(f, `Durée de ${m.duree_min} min : une mission dure 20 min au plus.`);
    if (!/^S[1-7]$/.test(m.sequence_requise)) signaler(f, `Séquence requise « ${m.sequence_requise} » invalide (S1 à S7).`);
    if (m.competences.length === 0) signaler(f, 'Aucune compétence visée.');
    for (const cv of m.competences) {
      const comp = competences.get(cv.code);
      if (!comp) {
        signaler(f, `Compétence « ${cv.code} » absente du référentiel.`);
      } else if (!comp.criteres_officiels.includes(cv.critere)) {
        signaler(f, `${cv.code} : le critère « ${cv.critere} » ne reprend pas mot pour mot un critère officiel.`);
      }
    }
    validerEtapes(m, contenu, (message) => signaler(f, message));
  }

  // ---------- Style : pas de tiret cadratin dans les textes montrés aux élèves ----------
  const aVerifier: [string, unknown][] = [
    ...contenu.lieux.map((l): [string, unknown] => [`lieux/${l.id}`, l]),
    ['personnages/residents', contenu.residents],
    ['personnages/personnel', contenu.personnel],
    ...contenu.missions.map((m): [string, unknown] => [`scenarios/${m.id}`, m]),
  ];
  for (const [fichier, valeur] of aVerifier) {
    if (JSON.stringify(valeur).includes(TIRET_CADRATIN)) signaler(fichier, 'Tiret cadratin interdit : le remplacer par « : », « · » ou une parenthèse.');
  }

  return problemes;
}

/**
 * Règles des meubles : un type et une direction connus, posés entièrement dans une même pièce
 * (pas sur une porte, pas dans le vide), sans se chevaucher, et une sonnette toujours posée sur un lit
 * (elle doit rester à portée de main du résident).
 */
function validerMeubles(lieu: Lieu, signaler: (message: string) => void): void {
  const occupees = new Map<string, string>(); // case → meuble qui l'occupe
  const casesDeLits = new Set<string>();
  const sonnettes: { nom: string; cle: string }[] = [];

  (lieu.meubles ?? []).forEach((meuble, i) => {
    const nom = `Meuble n° ${i + 1} (${meuble.type}, colonne ${meuble.colonne}, rangée ${meuble.rangee})`;
    if (!(meuble.type in LONGUEUR_MEUBLE)) return signaler(`${nom} : type inconnu (lit, fauteuil, lavabo ou sonnette).`);
    if (!(meuble.vers in PAS)) return signaler(`${nom} : direction « ${meuble.vers} » inconnue (nord, sud, est ou ouest).`);

    const cases = casesDuMeuble(meuble);
    const zones = new Set(cases.map((c) => lieu.grille[c.rangee]?.[c.colonne] ?? lieu.vide));
    const zone = lieu.zones[[...zones][0]];
    if (zones.size > 1) return signaler(`${nom} : il dépasse de sa pièce.`);
    if (!zone) return signaler(`${nom} : il est posé hors du plan ou dans le vide.`);
    if (zone.type === 'porte') return signaler(`${nom} : il est posé sur une porte.`);

    for (const c of cases) {
      const cle = `${c.colonne};${c.rangee}`;
      if (meuble.type === 'sonnette') {
        sonnettes.push({ nom, cle });
        continue;
      }
      if (meuble.type === 'lit') casesDeLits.add(cle);
      const deja = occupees.get(cle);
      if (deja) signaler(`${nom} : il chevauche ${deja}.`);
      occupees.set(cle, `le meuble n° ${i + 1} (${meuble.type})`);
    }
  });

  for (const s of sonnettes) if (!casesDeLits.has(s.cle)) signaler(`${s.nom} : une sonnette se pose sur un lit, à portée de main du résident.`);
}

/** Zone (id) de chaque case des lieux, sous la forme « colonne;rangée ». */
function zonesDesCases(contenu: Contenu): Map<string, string> {
  const zones = new Map<string, string>();
  for (const lieu of contenu.lieux) {
    lieu.grille.forEach((ligne, r) => [...ligne].forEach((cle, c) => {
      const zone = lieu.zones[cle];
      if (zone) zones.set(`${c};${r}`, zone.id);
    }));
  }
  return zones;
}

/**
 * Règles des étapes d'une mission (format décrit dans docs/ARCHITECTURE.md) :
 * identifiants uniques, suites qui mènent à une étape existante, points donnés seulement
 * pour les compétences visées par la mission, et chaque compétence visée évaluée au moins une fois.
 */
function validerEtapes(m: Mission, contenu: Contenu, signaler: (message: string) => void): void {
  if (!Array.isArray(m.etapes) || m.etapes.length === 0) return signaler('Aucune étape.');
  if (!Array.isArray(m.debriefing) || m.debriefing.length < 2 || m.debriefing.length > 3) signaler('Le débriefing compte 2 ou 3 questions.');

  const codes = new Set(m.competences.map((c) => c.code));
  const evaluees = new Set<string>();
  const ids = new Set<string>();
  const personnel = new Map(contenu.personnel.map((p) => [p.id, p]));
  const zones = zonesDesCases(contenu);

  const lirePoints = (ou: string, points?: Points) => {
    for (const [code, n] of Object.entries(points ?? {})) {
      if (!codes.has(code)) signaler(`${ou} : points en ${code}, compétence non visée par la mission.`);
      if (!(Number.isInteger(n) && n >= 0 && n <= 3)) signaler(`${ou} : ${n} points en ${code} (entier de 0 à 3 attendu).`);
      if (n > 0) evaluees.add(code);
    }
  };

  for (const e of m.etapes) {
    const ou = `Étape « ${e.id} »`;
    if (ids.has(e.id)) signaler(`${ou} : identifiant utilisé deux fois.`);
    ids.add(e.id);
    switch (e.type) {
      case 'dialogue':
        if (!m.personnages.includes(e.interlocuteur)) signaler(`${ou} : interlocuteur « ${e.interlocuteur} » absent des personnages de la mission.`);
        for (const canal of ['verbal', 'paraverbal', 'non_verbal'] as const) {
          if (!(e[canal]?.length >= 2)) signaler(`${ou} : le canal ${canal} demande au moins 2 options.`);
          for (const o of e[canal] ?? []) {
            lirePoints(ou, o.points);
            if (!(Number.isInteger(o.confiance) && Math.abs(o.confiance) <= 2)) signaler(`${ou} : confiance ${o.confiance} (entier de -2 à 2 attendu).`);
          }
        }
        break;
      case 'observation': {
        if (!(e.elements?.length > 0)) signaler(`${ou} : aucun élément à repérer.`);
        const idsElements = new Set<string>();
        for (const el of e.elements ?? []) {
          if (idsElements.has(el.id)) signaler(`${ou} : élément « ${el.id} » en double.`);
          idsElements.add(el.id);
          if (zones.get(`${el.colonne};${el.rangee}`) !== m.lieu) signaler(`${ou} : l'élément « ${el.id} » n'est pas dans le lieu de la mission.`);
          if (!['facilite', 'gene'].includes(el.effet)) signaler(`${ou} : effet « ${el.effet} » inconnu (facilite ou gene).`);
          lirePoints(ou, el.points);
        }
        break;
      }
      case 'decision':
        if (!(e.choix?.length >= 2)) signaler(`${ou} : au moins 2 choix.`);
        for (const o of e.choix ?? []) {
          if (!['agir', 'adapter', 'alerter'].includes(o.decision)) signaler(`${ou} : décision « ${o.decision} » inconnue (agir, adapter ou alerter).`);
          lirePoints(ou, o.points);
        }
        break;
      case 'relais': {
        const p = personnel.get(e.destinataire);
        if (!p || p.joueur) signaler(`${ou} : destinataire « ${e.destinataire} » introuvable dans le personnel.`);
        lirePoints(ou, e.points);
        break;
      }
      default:
        signaler(`${ou} : type « ${(e as { type: string }).type} » inconnu (dialogue, observation, decision ou relais).`);
    }
  }

  for (const e of m.etapes) {
    if (e.type !== 'decision') continue;
    for (const o of e.choix ?? []) {
      if (o.suite && o.suite !== 'fin' && !ids.has(o.suite)) signaler(`Étape « ${e.id} » : la suite « ${o.suite} » n'existe pas.`);
    }
  }
  for (const code of codes) if (!evaluees.has(code)) signaler(`${code} est visée mais aucune étape ne lui donne de points.`);
}
