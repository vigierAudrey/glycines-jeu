// Bilan de la classe (page enseignante) : couche « règles », pure et testable.
//
// L'enseignante rassemble les bilans que les élèves lui ont remis :
// - les fichiers « Fichier de données » (.json) téléchargés depuis « Mon bilan » ;
// - ou des lignes « Prénom Nom ; code de reprise » recopiées à la main.
// Tout est lu dans son navigateur : rien n'est envoyé, rien n'est gardé après la fermeture de la page.
// La progression est toujours relue à partir du code de reprise (contrôlé par sa clé) : un fichier modifié à la main
// ou venant d'une ancienne version du jeu est signalé au lieu d'être cru sur parole.

import type { Mission, Referentiel } from '../contenu/types';
import { bilanGlobal } from './bilanGlobal';
import { cellule, type Eleve } from './exportBilan';
import type { Niveau } from './mission';
import { decoderCode, phraseIgnorees, type Progression } from './sauvegarde';

export interface BilanEleve {
  eleve: Eleve;
  date: string; // date du fichier (AAAA-MM-JJ), vide pour un code recopié
  progression: Progression;
}

/** `avertissement` : le bilan est lu, mais des missions ont changé depuis et ne sont pas comptées. */
export type Lecture = { bilan: BilanEleve; avertissement?: string } | { erreur: string };

/** Lit un fichier .json produit par « Mon bilan ». */
export function lireFichierBilan(texte: string, missions: Mission[]): Lecture {
  let donnees: unknown;
  try {
    donnees = JSON.parse(texte);
  } catch {
    return { erreur: "Ce fichier n'est pas un fichier de données du jeu." };
  }
  const d = donnees as { format?: unknown; eleve?: Partial<Record<keyof Eleve, unknown>>; date?: unknown; code_reprise?: unknown };
  if (!d || d.format !== 'bilan-eleve') return { erreur: "Ce fichier n'est pas un bilan d'élève du jeu." };
  const texteOuVide = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 60) : '');
  const eleve: Eleve = { prenom: texteOuVide(d.eleve?.prenom), nom: texteOuVide(d.eleve?.nom), classe: texteOuVide(d.eleve?.classe) };
  const code = typeof d.code_reprise === 'string' ? d.code_reprise : '';
  const progression = code ? decoderCode(code, missions) : { progression: {} };
  if ('erreur' in progression) return { erreur: progression.erreur };
  const bilan = { eleve, date: /^\d{4}-\d{2}-\d{2}$/.test(String(d.date)) ? String(d.date) : '', progression: progression.progression };
  return 'ignorees' in progression && progression.ignorees ? { bilan, avertissement: phraseIgnorees(progression.ignorees) } : { bilan };
}

/** Lit une ligne « Prénom Nom ; CODE » (ou avec une tabulation, copiée d'un tableur). Le nom est gardé tel quel. */
export function lireLigneCode(ligne: string, missions: Mission[]): Lecture {
  const [nom, code] = ligne.split(/[;\t]/).map((t) => t.trim());
  if (!nom || !code) return { erreur: `Ligne « ${ligne.trim()} » : il faut le nom, un point-virgule, puis le code.` };
  const lu = decoderCode(code, missions);
  if ('erreur' in lu) return { erreur: `${nom} : ${lu.erreur}` };
  const bilan = { eleve: { prenom: '', nom: nom.slice(0, 60), classe: '' }, date: '', progression: lu.progression };
  return lu.ignorees ? { bilan, avertissement: `${nom} : ${phraseIgnorees(lu.ignorees)}` } : { bilan };
}

const cleEleve = (e: Eleve) => `${e.prenom} ${e.nom} ${e.classe}`.trim().toLocaleLowerCase('fr').replace(/\s+/g, ' ');
export const nomAffiche = (e: Eleve) => `${e.nom} ${e.prenom}`.trim() || 'Sans nom';

/** Ajoute un bilan à la liste. Le même élève remis deux fois : on garde le fichier le plus récent. Liste triée par nom. */
export function ajouterBilan(liste: BilanEleve[], nouveau: BilanEleve): BilanEleve[] {
  const cle = cleEleve(nouveau.eleve);
  const existant = cle ? liste.find((b) => cleEleve(b.eleve) === cle) : undefined;
  if (existant && existant.date > nouveau.date) return liste;
  return [...liste.filter((b) => b !== existant), nouveau].sort((a, b) => nomAffiche(a.eleve).localeCompare(nomAffiche(b.eleve), 'fr'));
}

export interface TableauClasse {
  titre: string;
  competences: { code: string; intitule: string }[];
  lignes: { eleve: Eleve; date: string; missionsFaites: number; niveaux: (Niveau | undefined)[] }[];
}

/** Un tableau par partie (Bloc 2, PSE) : une ligne par élève, une colonne par compétence (meilleur niveau obtenu). */
export function tableauxClasse(
  bilans: BilanEleve[],
  missions: Mission[],
  parties: readonly { titre: string; referentiel: Referentiel }[],
): TableauClasse[] {
  const calcules = bilans.map((b) => ({ b, parties: bilanGlobal(b.progression, missions, parties) }));
  return parties.map(({ titre, referentiel }, i) => ({
    titre,
    competences: referentiel.competences.map((c) => ({ code: c.code, intitule: c.intitule })),
    lignes: calcules.map(({ b, parties: p }) => ({
      eleve: b.eleve,
      date: b.date,
      // Missions de cette partie terminées par l'élève (une mission compte une fois, même si elle vise plusieurs compétences).
      missionsFaites: new Set(p[i].lignes.flatMap((l) => l.resultats.map((r) => r.mission))).size,
      niveaux: p[i].lignes.map((l) => l.meilleur),
    })),
  }));
}

/** Les tableaux de la classe en CSV (LibreOffice, Excel) : une ligne par élève et par partie. */
export function classeEnCsv(tableaux: TableauClasse[]): string {
  const lignes: string[][] = [];
  for (const t of tableaux) {
    lignes.push([t.titre]);
    lignes.push(['Nom', 'Prénom', 'Classe', 'Date du bilan', 'Missions faites', ...t.competences.map((c) => `${c.code} ${c.intitule}`)]);
    for (const l of t.lignes) lignes.push([l.eleve.nom, l.eleve.prenom, l.eleve.classe, l.date, String(l.missionsFaites), ...l.niveaux.map((n) => n ?? '')]);
    lignes.push([]);
  }
  return '﻿' + lignes.map((l) => l.map(cellule).join(';')).join('\r\n') + '\r\n';
}
