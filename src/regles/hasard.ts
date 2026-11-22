// Mélange au hasard (couche « règles » : pure, testable).
// Le tirage est passé en paramètre pour que les tests puissent le fixer.

/** Renvoie une copie mélangée de la liste (mélange de Fisher-Yates). */
export function melanger<T>(liste: readonly T[], hasard: () => number = Math.random): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Mélange une liste en évitant de rendre l'ordre de départ (utile pour un protocole à remettre dans l'ordre). */
export function melangerSansOrdreDeDepart<T>(liste: readonly T[], hasard: () => number = Math.random): T[] {
  if (liste.length < 2) return [...liste];
  for (let essai = 0; essai < 10; essai++) {
    const m = melanger(liste, hasard);
    if (m.some((x, i) => x !== liste[i])) return m;
  }
  return [...liste.slice(1), liste[0]];
}
