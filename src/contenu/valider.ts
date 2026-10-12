// Validation du contenu pédagogique.
// Cette fonction ne lit aucun fichier : elle reçoit le contenu déjà chargé et renvoie la liste des problèmes.
// Elle est utilisée par tools/valider-contenu.ts (en ligne de commande) et par les tests.
//
// Règle d'or : le référentiel est la source de vérité. Une mission qui cite une compétence
// ou un critère absent du référentiel est refusée.

import type { Contenu } from './types';

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
