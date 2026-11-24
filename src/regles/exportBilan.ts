// Export de « Mon bilan » en fichier (couche « règles » : pas de navigateur ici, testable).
//
// Deux formats, fabriqués sur l'appareil de l'élève, sans rien envoyer :
// - un tableau CSV (séparateur « ; ») qui s'ouvre directement dans LibreOffice Calc ou Excel ;
// - un fichier JSON (données structurées), que la page enseignante pourra relire plus tard pour un bilan de classe.
// Le nom, le prénom et la classe sont tapés par l'élève au moment de l'export et ne sont gardés nulle part.

import type { Mission } from '../contenu/types';
import type { PartieBilan } from './bilanGlobal';
import { encoderCode, type Progression } from './sauvegarde';

export interface Eleve {
  prenom: string;
  nom: string;
  classe: string;
}

/** Une cellule de tableur : entre guillemets, et jamais lue comme une formule (=, +, -, @ en tête). */
export function cellule(valeur: string): string {
  const texte = /^[=+\-@\t\r]/.test(valeur) ? `'${valeur}` : valeur;
  return `"${texte.replace(/"/g, '""')}"`;
}

/** Tableau : une ligne par mission et par compétence (ou une ligne « pas encore » pour une compétence non travaillée). */
export function bilanEnCsv(parties: PartieBilan[], eleve: Eleve, date: string): string {
  const entete = ['Prénom', 'Nom', 'Classe', 'Date', 'Partie', 'Code', 'Compétence', 'Meilleur niveau', 'Mission', 'Niveau dans la mission', 'Critère officiel évalué'];
  const lignes: string[][] = [];
  for (const p of parties) {
    for (const l of p.lignes) {
      const debut = [eleve.prenom, eleve.nom, eleve.classe, date, p.titre, l.code, l.intitule, l.meilleur ?? 'pas encore'];
      if (l.resultats.length === 0) lignes.push([...debut, '', '', '']);
      for (const r of l.resultats) lignes.push([...debut, r.titre, r.niveau, r.critere]);
    }
  }
  // Le caractère invisible ﻿ en tête indique « UTF-8 » au tableur : les accents s'affichent correctement.
  return '﻿' + [entete, ...lignes].map((ligne) => ligne.map(cellule).join(';')).join('\r\n') + '\r\n';
}

/** Données complètes : identité tapée, date, code de reprise, progression brute et bilan rangé. */
export function bilanEnJson(parties: PartieBilan[], eleve: Eleve, date: string, progression: Progression, missions: Mission[]): string {
  return JSON.stringify(
    {
      jeu: 'Une journée aux Glycines',
      format: 'bilan-eleve',
      version: 1,
      eleve,
      date,
      code_reprise: encoderCode(progression, missions),
      progression,
      bilan: parties,
    },
    null,
    2,
  );
}

/** Nom de fichier lisible et sans caractère gênant : « bilan-glycines-Dupont-Lea-2026-11-24.csv ». */
export function nomDeFichier(eleve: Eleve, dateIso: string, extension: 'csv' | 'json'): string {
  const propre = (t: string) =>
    t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const morceaux = ['bilan-glycines', propre(eleve.nom), propre(eleve.prenom), dateIso].filter(Boolean);
  return `${morceaux.join('-')}.${extension}`;
}
