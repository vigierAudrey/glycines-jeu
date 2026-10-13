// Construit le décor 3D à partir du plan calculé (src/regles/plan.ts).
// Ce fichier ne contient aucune donnée : changer la grille dans content/lieux/aile-b.json suffit à changer le décor.

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { PlanCalcule } from '../regles/plan';
import { aretesGroupees, CHARTE } from './charte';

const EPAISSEUR_SOL = 0.1;
const HAUTEUR_MUR = 0.9; // murs bas, « coupés » : on voit l'intérieur des pièces comme sur une maquette
const EPAISSEUR_MUR = 0.1;

export function construireAile(plan: PlanCalcule): THREE.Group {
  const aile = new THREE.Group();
  aile.name = 'aile';

  // ---------- Sols ----------
  // Une « instance » par case : la carte graphique dessine toutes les cases d'une zone en une seule fois.
  const geometrieCase = new THREE.BoxGeometry(0.98, EPAISSEUR_SOL, 0.98);
  const matrice = new THREE.Matrix4();
  const matricesSol: THREE.Matrix4[] = [];
  for (const zone of plan.zones) {
    const sols = new THREE.InstancedMesh(geometrieCase, new THREE.MeshLambertMaterial({ color: zone.couleur }), zone.cases.length);
    sols.name = `sol-${zone.id}`;
    zone.cases.forEach((c, i) => {
      matrice.makeTranslation(c.colonne + 0.5, -EPAISSEUR_SOL / 2, c.rangee + 0.5);
      sols.setMatrixAt(i, matrice);
      matricesSol.push(matrice.clone());
    });
    aile.add(sols);

    if (['chambre', 'collectif', 'service', 'exterieur'].includes(zone.type)) {
      aile.add(etiquette(zone.nom, `etiquette-piece etiquette-piece--${zone.type}`, new THREE.Vector3(zone.centre.x, 0.05, zone.centre.z)));
    }
  }

  // ---------- Murs ----------
  const geometrieMur = new THREE.BoxGeometry(1 + EPAISSEUR_MUR, HAUTEUR_MUR, EPAISSEUR_MUR);
  const murs = new THREE.InstancedMesh(geometrieMur, new THREE.MeshLambertMaterial({ color: CHARTE.mur }), plan.murs.length);
  murs.name = 'murs';
  const quartDeTour = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const sansRotation = new THREE.Quaternion();
  const unite = new THREE.Vector3(1, 1, 1);
  const matricesMurs: THREE.Matrix4[] = [];
  plan.murs.forEach((m, i) => {
    const rotation = m.orientation === 'le-long-de-z' ? quartDeTour : sansRotation;
    matrice.compose(new THREE.Vector3(m.x, HAUTEUR_MUR / 2, m.z), rotation, unite);
    murs.setMatrixAt(i, matrice);
    matricesMurs.push(matrice.clone());
  });
  aile.add(murs);

  // ---------- Contours (charte « Repères nets ») ----------
  // Traits foncés sur les arêtes des murs, traits discrets entre les cases du sol.
  aile.add(aretesGroupees(geometrieMur, matricesMurs));
  aile.add(aretesGroupees(geometrieCase, matricesSol, true, true));

  return aile;
}

/** Crée une étiquette HTML accrochée à un point de la scène 3D. */
export function etiquette(texte: string, classe: string, position: THREE.Vector3): CSS2DObject {
  const element = document.createElement('div');
  element.className = classe;
  element.textContent = texte;
  const objet = new CSS2DObject(element);
  objet.position.copy(position);
  return objet;
}
