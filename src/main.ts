// Point d'entrée du jeu : on charge le contenu, on calcule le plan, on monte le décor et l'interface.
// L'ordre suit les couches de l'architecture (voir docs/ARCHITECTURE.md) : contenu → règles → 3D → interface.

import * as THREE from 'three';
import './style.css';
import { chargerContenu } from './contenu/charger';
import { lirePlan } from './regles/plan';
import { creerTheatre } from './scene3d/creerScene';
import { construireAile } from './scene3d/construireAile';
import { placerPersonnages } from './scene3d/personnages';
import { brancherMarche } from './scene3d/marche';
import { monterInterface } from './ui/interface';

const contenu = chargerContenu();
const lieu = contenu.lieux[0];
const plan = lirePlan(lieu);

const centre = new THREE.Vector3(plan.largeur / 2, 0, plan.profondeur / 2);
const theatre = creerTheatre(document.querySelector<HTMLElement>('#scene')!, centre, Math.max(plan.largeur, plan.profondeur));
theatre.scene.add(construireAile(plan));
const personnages = placerPersonnages(plan, contenu.residents, contenu.personnel);
theatre.scene.add(personnages);
theatre.demanderRendu();

// Toucher ou cliquer le sol fait marcher l'agent joué par l'élève.
const joueur = contenu.personnel.find((p) => p.joueur);
const agent = joueur && personnages.getObjectByName(`personnage-${joueur.id}`);
if (agent) brancherMarche(theatre, plan, agent);

monterInterface(document.querySelector<HTMLElement>('#interface')!, lieu.nom, theatre, contenu.personnel);
