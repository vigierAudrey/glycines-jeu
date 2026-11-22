// Lexique du métier (P.16) : couche « règles », pure et testable.
// Découpe un texte en morceaux : ceux qui sont un mot du lexique deviennent touchables dans l'interface.
// Chaque mot n'est repéré qu'une fois par texte, pour ne pas surcharger la lecture.

import type { EntreeLexique } from '../contenu/types';

export interface Morceau {
  texte: string;
  entree?: EntreeLexique;
}

const apostrophes = (t: string) => t.replace(/’/g, "'");
const LETTRE = 'a-zA-Z0-9àâäçéèêëîïôöùûüÿœæÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒÆ';
const echapperRegex = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function decouperAvecLexique(texte: string, entrees: readonly EntreeLexique[]): Morceau[] {
  if (entrees.length === 0) return [{ texte }];
  // Les mots les plus longs d'abord : « détergent-désinfectant » avant « détergent ».
  const tries = [...entrees].sort((a, b) => b.mot.length - a.mot.length);
  const motif = new RegExp(
    `(?<![${LETTRE}])(${tries.map((e) => echapperRegex(apostrophes(e.mot))).join('|')})s?(?![${LETTRE}])`,
    'gi',
  );
  const morceaux: Morceau[] = [];
  const dejaVus = new Set<EntreeLexique>();
  const normal = apostrophes(texte); // même longueur que le texte : les positions correspondent
  let debut = 0;
  for (const trouve of normal.matchAll(motif)) {
    const entree = tries.find((e) => apostrophes(e.mot).toLowerCase() === trouve[1].toLowerCase());
    if (!entree || dejaVus.has(entree)) continue;
    dejaVus.add(entree);
    const i = trouve.index!;
    if (i > debut) morceaux.push({ texte: texte.slice(debut, i) });
    morceaux.push({ texte: texte.slice(i, i + trouve[0].length), entree });
    debut = i + trouve[0].length;
  }
  if (debut < texte.length) morceaux.push({ texte: texte.slice(debut) });
  return morceaux;
}
