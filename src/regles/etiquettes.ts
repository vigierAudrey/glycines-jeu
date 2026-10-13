// Écarter les étiquettes des personnes pour qu'elles ne se chevauchent pas à l'écran.
// Logique pure (aucun import de three) : on travaille sur des rectangles en pixels.
//
// Principe :
// 1. chaque étiquette part de sa place naturelle (centrée au-dessus de la tête) ;
// 2. une étiquette qui passerait sous la barre du haut est descendue juste en dessous ;
// 3. on place les étiquettes de la plus basse à la plus haute à l'écran ; si une étiquette en touche
//    une déjà placée, on la monte juste au-dessus (ou, faute de place en haut, on la descend juste en dessous).

export interface EtiquetteAEcarter {
  /** Centre de l'étiquette à sa place naturelle, en pixels depuis le coin haut gauche. */
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

const ESPACE = 2; // pixels laissés entre deux étiquettes
const ESSAIS_MAX = 20; // sécurité : on n'essaie pas plus de 20 places par étiquette

interface Rectangle {
  gauche: number;
  droite: number;
  haut: number;
  bas: number;
}

const seTouchent = (a: Rectangle, b: Rectangle) =>
  a.gauche < b.droite && b.gauche < a.droite && a.haut < b.bas + ESPACE && b.haut < a.bas + ESPACE;

/**
 * Renvoie, pour chaque étiquette (dans le même ordre), le décalage vertical à lui appliquer en pixels
 * (négatif = vers le haut). `hautMinimum` est la première ligne de pixels libre sous la barre du haut.
 */
export function ecarterEtiquettes(etiquettes: EtiquetteAEcarter[], hautMinimum = 0): number[] {
  const rectangles: Rectangle[] = etiquettes.map((e) => {
    const haut = Math.max(e.y - e.hauteur / 2, hautMinimum);
    return { gauche: e.x - e.largeur / 2, droite: e.x + e.largeur / 2, haut, bas: haut + e.hauteur };
  });

  // De la plus basse à la plus haute : les personnes au premier plan gardent leur étiquette en place.
  const ordre = rectangles.map((_, i) => i).sort((a, b) => rectangles[b].haut - rectangles[a].haut);
  const places: Rectangle[] = [];
  for (const i of ordre) {
    const r = rectangles[i];
    const hauteur = r.bas - r.haut;
    const depart = r.haut;
    // D'abord vers le haut…
    for (let essai = 0; essai < ESSAIS_MAX; essai++) {
      const gene = places.find((p) => seTouchent(r, p));
      if (!gene) break;
      r.haut = gene.haut - ESPACE - hauteur;
      r.bas = r.haut + hauteur;
    }
    // … et si l'étiquette est passée sous la barre du haut, on cherche une place vers le bas.
    if (r.haut < hautMinimum) {
      r.haut = depart;
      r.bas = depart + hauteur;
      for (let essai = 0; essai < ESSAIS_MAX; essai++) {
        const gene = places.find((p) => seTouchent(r, p));
        if (!gene) break;
        r.haut = gene.bas + ESPACE;
        r.bas = r.haut + hauteur;
      }
    }
    places.push(r);
  }

  return etiquettes.map((e, i) => Math.round(rectangles[i].haut + e.hauteur / 2 - e.y));
}
