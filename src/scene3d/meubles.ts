// Meubles des chambres, en formes simples (des boîtes), comme une maquette.
// Ce fichier ne contient aucune donnée : la place et l'orientation de chaque meuble viennent du plan
// (content/lieux/aile-b.json, champ « meubles »). Ici, on dit seulement à quoi ressemble un lit, un fauteuil…
//
// Chaque modèle est construit « tourné vers le sud » (vers +z) avec son point d'appui au centre de sa première case,
// puis on le fait pivoter selon le champ « vers ». Un lit va de sa tête (z = 0) jusqu'à ses pieds (z = 1).
// Plus tard (phase 2 bis), un modèle glTF pourra remplacer une de ces fonctions sans toucher au reste.

import * as THREE from 'three';
import type { Direction, TypeMeuble } from '../contenu/types';
import type { PlanCalcule } from '../regles/plan';

// Rotation autour de l'axe vertical pour tourner un modèle « vers le sud » dans chaque direction.
const ROTATION: Record<Direction, number> = { sud: 0, est: Math.PI / 2, nord: Math.PI, ouest: -Math.PI / 2 };

// Matériaux partagés entre tous les meubles : moins de travail pour la carte graphique.
const matiere = (couleur: string) => new THREE.MeshLambertMaterial({ color: couleur });
const BLANC = matiere('#fbfbfa');
const DRAP = matiere('#b9cde3');
const METAL = matiere('#9aa5b1');
const BOIS = matiere('#9b8468');
const TISSU = matiere('#5f8f8a');
const CHROME = matiere('#7d8590');
const ROUGE = matiere('#d64545');

/** Ajoute à un groupe une boîte de taille (largeur, hauteur, profondeur) centrée au point (x, y, z). */
function boite(groupe: THREE.Group, materiau: THREE.Material, [l, h, p]: number[], [x, y, z]: number[]): void {
  const maillage = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), materiau);
  maillage.position.set(x, y, z);
  groupe.add(maillage);
}

const MODELES: Record<TypeMeuble, (g: THREE.Group) => void> = {
  // Lit médicalisé : sommier en métal, matelas, couverture, oreiller, tête et pied de lit, une barrière.
  lit: (g) => {
    boite(g, METAL, [0.9, 0.3, 1.86], [0, 0.3, 0.5]);
    boite(g, BLANC, [0.86, 0.14, 1.82], [0, 0.52, 0.5]);
    boite(g, DRAP, [0.88, 0.06, 1.15], [0, 0.6, 0.88]);
    boite(g, BLANC, [0.6, 0.1, 0.3], [0, 0.64, -0.2]);
    boite(g, BOIS, [0.95, 0.75, 0.06], [0, 0.42, -0.42]);
    boite(g, BOIS, [0.95, 0.5, 0.06], [0, 0.3, 1.42]);
    boite(g, METAL, [0.03, 0.12, 0.9], [0.45, 0.7, 0.35]);
  },
  // Fauteuil : base, assise, dossier côté nord et deux accoudoirs.
  fauteuil: (g) => {
    boite(g, TISSU, [0.62, 0.42, 0.58], [0, 0.21, 0]);
    boite(g, TISSU, [0.62, 0.55, 0.12], [0, 0.65, -0.24]);
    boite(g, TISSU, [0.1, 0.2, 0.5], [-0.28, 0.52, 0.03]);
    boite(g, TISSU, [0.1, 0.2, 0.5], [0.28, 0.52, 0.03]);
  },
  // Lavabo contre le mur : colonne, vasque et robinet.
  lavabo: (g) => {
    boite(g, BLANC, [0.2, 0.62, 0.2], [0, 0.31, -0.3]);
    boite(g, BLANC, [0.56, 0.14, 0.42], [0, 0.69, -0.24]);
    boite(g, CHROME, [0.05, 0.12, 0.1], [0, 0.82, -0.38]);
  },
  // Sonnette d'appel : une poire rouge sur la tête du lit, à portée de main.
  sonnette: (g) => {
    const poire = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), ROUGE);
    poire.position.set(0.3, 0.72, -0.18);
    g.add(poire);
  },
};

export function construireMeubles(plan: PlanCalcule): THREE.Group {
  const groupe = new THREE.Group();
  groupe.name = 'meubles';
  for (const meuble of plan.meubles) {
    const modele = new THREE.Group();
    modele.name = `meuble-${meuble.type}`;
    MODELES[meuble.type](modele);
    modele.position.set(meuble.colonne + 0.5, 0, meuble.rangee + 0.5);
    modele.rotation.y = ROTATION[meuble.vers];
    groupe.add(modele);
  }
  return groupe;
}
