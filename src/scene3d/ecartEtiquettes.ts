// Après chaque dessin, écarte les étiquettes des personnes qui se chevauchent à l'écran (IDE et Cadre, Vous et AS…)
// et descend sous la barre du haut celles qui passeraient dessous. Le calcul est dans src/regles/etiquettes.ts.
//
// CSS2DRenderer place chaque étiquette avec la propriété CSS `transform`. On ajoute notre décalage avec
// la propriété `translate`, distincte : les deux s'additionnent sans se gêner.

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ecarterEtiquettes } from '../regles/etiquettes';
import type { Theatre } from './creerScene';

/** `hautMinimum` donne la première ligne de pixels libre sous la barre du haut. */
export function ecarterEtiquettesDesPersonnes(theatre: Theatre, personnages: THREE.Object3D, hautMinimum: () => number): void {
  const etiquettes: CSS2DObject[] = [];
  personnages.traverse((objet) => {
    if (objet instanceof CSS2DObject) etiquettes.push(objet);
  });
  const point = new THREE.Vector3();

  theatre.apresChaqueRendu(() => {
    const mesures = etiquettes.map((e) => {
      const { x, y } = theatre.versEcran(e.getWorldPosition(point));
      return { x, y, largeur: e.element.offsetWidth, hauteur: e.element.offsetHeight };
    });
    const decalages = ecarterEtiquettes(mesures, hautMinimum());
    etiquettes.forEach((e, i) => {
      e.element.style.translate = decalages[i] ? `0 ${decalages[i]}px` : '';
    });
  });
}
