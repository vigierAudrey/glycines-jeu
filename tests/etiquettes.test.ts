import { describe, expect, it } from 'vitest';
import { ecarterEtiquettes } from '../src/regles/etiquettes';

const etiquette = (x: number, y: number) => ({ x, y, largeur: 40, hauteur: 16 });

describe('ecarterEtiquettes', () => {
  it('ne touche pas des étiquettes éloignées', () => {
    expect(ecarterEtiquettes([etiquette(100, 100), etiquette(300, 100)])).toEqual([0, 0]);
  });

  it('monte la plus haute de deux étiquettes qui se chevauchent', () => {
    const [basse, haute] = ecarterEtiquettes([etiquette(100, 110), etiquette(110, 100)]);
    expect(basse).toBe(0);
    // La haute (centre à 100) doit finir au-dessus de la basse (haut à 102), avec 2 px d'écart.
    expect(100 + haute + 8).toBeLessThanOrEqual(102 - 2);
  });

  it('empile trois étiquettes au même endroit sans chevauchement', () => {
    const decalages = ecarterEtiquettes([etiquette(100, 100), etiquette(100, 100), etiquette(100, 100)]);
    const centres = decalages.map((d) => 100 + d).sort((a, b) => a - b);
    expect(centres[1] - centres[0]).toBeGreaterThanOrEqual(18);
    expect(centres[2] - centres[1]).toBeGreaterThanOrEqual(18);
  });

  it('descend sous la barre du haut une étiquette qui passerait dessous', () => {
    const [d] = ecarterEtiquettes([etiquette(100, 20)], 60);
    expect(20 + d - 8).toBe(60);
  });

  it('près de la barre, écarte vers le bas plutôt que de repasser sous la barre', () => {
    const decalages = ecarterEtiquettes([etiquette(100, 70), etiquette(100, 68)], 60);
    const hauts = decalages.map((d, i) => [70, 68][i] + d - 8);
    expect(Math.min(...hauts)).toBeGreaterThanOrEqual(60);
    expect(Math.abs(hauts[0] - hauts[1])).toBeGreaterThanOrEqual(18);
  });
});
