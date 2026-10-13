// Lecture du plan d'un lieu (couche « règles » : aucune 3D ici, donc testable sans navigateur).
//
// Le plan est une grille de caractères. Chaque case mesure 1 m sur 1 m.
// La case de la colonne c et de la rangée r a son centre au point (c + 0,5 ; r + 0,5) du monde 3D :
// l'axe x suit les colonnes, l'axe z suit les rangées, l'axe y monte vers le plafond.

import type { Direction, Lieu, Meuble, TypeMeuble, Zone } from '../contenu/types';

export interface Case {
  colonne: number;
  rangee: number;
}

export interface ZoneDuPlan extends Zone {
  cle: string; // caractère de la grille
  cases: Case[];
  casesLibres: Case[]; // cases sans meuble qui gêne le passage
  centre: { x: number; z: number };
}

/** Un meuble posé sur le plan, avec les cases qu'il occupe. */
export interface MeubleDuPlan extends Meuble {
  cases: Case[];
  bloquant: boolean; // vrai si on ne peut pas marcher à travers (la sonnette, accrochée au lit, ne bloque rien)
}

/** Nombre de cases occupées par chaque meuble, dans la direction « vers ». */
export const LONGUEUR_MEUBLE: Record<TypeMeuble, number> = { lit: 2, fauteuil: 1, lavabo: 1, sonnette: 1 };
export const MEUBLE_BLOQUANT: Record<TypeMeuble, boolean> = { lit: true, fauteuil: true, lavabo: true, sonnette: false };

/** Pas d'une case dans chaque direction. */
export const PAS: Record<Direction, { colonne: number; rangee: number }> = {
  nord: { colonne: 0, rangee: -1 },
  sud: { colonne: 0, rangee: 1 },
  est: { colonne: 1, rangee: 0 },
  ouest: { colonne: -1, rangee: 0 },
};

/** Cases occupées par un meuble : sa case de départ, puis les suivantes dans la direction « vers ». */
export function casesDuMeuble(meuble: Meuble): Case[] {
  const pas = PAS[meuble.vers];
  return Array.from({ length: LONGUEUR_MEUBLE[meuble.type] }, (_, i) => ({
    colonne: meuble.colonne + i * pas.colonne,
    rangee: meuble.rangee + i * pas.rangee,
  }));
}

/** Un mur occupe le bord commun à deux cases voisines. */
export interface Mur {
  x: number;
  z: number;
  orientation: 'le-long-de-x' | 'le-long-de-z';
}

export interface PlanCalcule {
  largeur: number; // nombre de colonnes
  profondeur: number; // nombre de rangées
  zones: ZoneDuPlan[];
  murs: Mur[];
  meubles: MeubleDuPlan[];
}

export function lirePlan(lieu: Lieu): PlanCalcule {
  const profondeur = lieu.grille.length;
  const largeur = Math.max(...lieu.grille.map((rangee) => rangee.length));
  const parCle = new Map<string, ZoneDuPlan>();

  lieu.grille.forEach((ligne, rangee) => {
    [...ligne].forEach((cle, colonne) => {
      if (cle === lieu.vide) return;
      const zone = lieu.zones[cle];
      if (!zone) throw new Error(`Plan « ${lieu.id} » : caractère « ${cle} » inconnu (rangée ${rangee}, colonne ${colonne}).`);
      let z = parCle.get(cle);
      if (!z) {
        z = { ...zone, cle, cases: [], casesLibres: [], centre: { x: 0, z: 0 } };
        parCle.set(cle, z);
      }
      z.cases.push({ colonne, rangee });
    });
  });

  for (const zone of parCle.values()) {
    const n = zone.cases.length;
    zone.centre = {
      x: zone.cases.reduce((s, c) => s + c.colonne + 0.5, 0) / n,
      z: zone.cases.reduce((s, c) => s + c.rangee + 0.5, 0) / n,
    };
  }

  // Meubles : on note les cases occupées, et chaque zone garde la liste de ses cases encore libres.
  const meubles = (lieu.meubles ?? []).map((m): MeubleDuPlan => ({ ...m, cases: casesDuMeuble(m), bloquant: MEUBLE_BLOQUANT[m.type] }));
  const occupees = new Set(meubles.filter((m) => m.bloquant).flatMap((m) => m.cases.map(({ colonne, rangee }) => `${colonne};${rangee}`)));
  for (const zone of parCle.values()) zone.casesLibres = zone.cases.filter((c) => !occupees.has(`${c.colonne};${c.rangee}`));

  return { largeur, profondeur, zones: [...parCle.values()], murs: calculerMurs(lieu, largeur, profondeur), meubles };
}

/**
 * Règle des murs : on pose un mur entre deux cases voisines quand
 * - elles n'appartiennent pas à la même zone,
 * - aucune des deux n'est une porte,
 * - au moins l'une des deux est un espace intérieur (pas le vide, pas l'extérieur).
 */
function calculerMurs(lieu: Lieu, largeur: number, profondeur: number): Mur[] {
  const cleEn = (colonne: number, rangee: number): string => lieu.grille[rangee]?.[colonne] ?? lieu.vide;
  const typeDe = (cle: string) => (cle === lieu.vide ? 'vide' : lieu.zones[cle]?.type ?? 'vide');
  const interieur = (cle: string) => !['vide', 'exterieur'].includes(typeDe(cle));
  const besoinDeMur = (a: string, b: string) =>
    a !== b && typeDe(a) !== 'porte' && typeDe(b) !== 'porte' && (interieur(a) || interieur(b));

  const murs: Mur[] = [];
  // On parcourt une case de plus dans chaque sens pour fermer le bord extérieur du bâtiment.
  for (let r = -1; r < profondeur; r++) {
    for (let c = -1; c < largeur; c++) {
      const ici = cleEn(c, r);
      if (besoinDeMur(ici, cleEn(c + 1, r))) murs.push({ x: c + 1, z: r + 0.5, orientation: 'le-long-de-z' });
      if (besoinDeMur(ici, cleEn(c, r + 1))) murs.push({ x: c + 0.5, z: r + 1, orientation: 'le-long-de-x' });
    }
  }
  return murs;
}

export function trouverZone(plan: PlanCalcule, idZone: string): ZoneDuPlan | undefined {
  return plan.zones.find((z) => z.id === idZone);
}

/**
 * Renvoie la n-ième case libre d'une zone, en partant du centre.
 * Sert à poser plusieurs personnages dans la même pièce sans qu'ils se superposent, ni sur un meuble.
 */
export function positionDansZone(zone: ZoneDuPlan, n: number): { x: number; z: number } {
  const triees = [...(zone.casesLibres.length > 0 ? zone.casesLibres : zone.cases)].sort((a, b) => distance(a, zone) - distance(b, zone) || a.rangee - b.rangee || a.colonne - b.colonne);
  const choisie = triees[n % triees.length];
  return { x: choisie.colonne + 0.5, z: choisie.rangee + 0.5 };
}

function distance(c: Case, zone: ZoneDuPlan): number {
  return Math.hypot(c.colonne + 0.5 - zone.centre.x, c.rangee + 0.5 - zone.centre.z);
}
