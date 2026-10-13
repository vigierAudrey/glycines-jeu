// Bulle qui présente une personne (nom et rôle) quand on la touche.
// C'est du HTML dans le calque interface, donc toujours au-dessus des étiquettes de la 3D.
// Après chaque dessin de la 3D, on la replace au-dessus de la tête de la personne :
// elle suit la personne quand la vue glisse, zoome ou tourne, et quand la personne marche.

import * as THREE from 'three';
import type { Fiche } from '../regles/fiche';
import type { Theatre } from '../scene3d/creerScene';

const HAUTEUR_TETE = 1.75; // en mètres : la pointe de la bulle se pose juste au-dessus de l'étiquette
const MARGE = 8; // en pixels : la bulle ne sort jamais de l'écran

export interface Bulle {
  ouvrir: (personne: THREE.Object3D, fiche: Fiche) => void;
  fermer: () => void;
}

export function creerBulle(racine: HTMLElement, theatre: Theatre): Bulle {
  const bulle = document.createElement('div');
  bulle.className = 'bulle';
  bulle.hidden = true;
  bulle.setAttribute('role', 'status'); // un lecteur d'écran lit la bulle quand elle s'ouvre
  bulle.innerHTML = `
    <p class="bulle__nom"></p>
    <p class="bulle__role"></p>
    <button type="button" class="bulle__fermer" aria-label="Fermer la bulle">×</button>
  `;
  racine.appendChild(bulle);
  const nom = bulle.querySelector<HTMLElement>('.bulle__nom')!;
  const role = bulle.querySelector<HTMLElement>('.bulle__role')!;

  let personne: THREE.Object3D | null = null;
  const pointe = new THREE.Vector3();

  const placer = () => {
    if (!personne) return;
    const { x, y } = theatre.versEcran(pointe.copy(personne.position).setY(HAUTEUR_TETE));
    const largeur = bulle.offsetWidth;
    const hauteur = bulle.offsetHeight;
    // Centrée au-dessus de la tête, mais retenue au bord de l'écran.
    const gauche = THREE.MathUtils.clamp(x - largeur / 2, MARGE, racine.clientWidth - largeur - MARGE);
    const haut = THREE.MathUtils.clamp(y - hauteur, MARGE, racine.clientHeight - hauteur - MARGE);
    bulle.style.transform = `translate(${Math.round(gauche)}px, ${Math.round(haut)}px)`;
    // Quand la bulle est retenue au bord, sa pointe se décale pour rester au-dessus de la personne.
    bulle.style.setProperty('--pointe', `${Math.round(THREE.MathUtils.clamp(x - gauche, 16, largeur - 16))}px`);
  };
  theatre.apresChaqueRendu(placer);

  const fermer = () => {
    personne = null;
    bulle.hidden = true;
  };
  bulle.querySelector('.bulle__fermer')!.addEventListener('click', fermer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fermer();
  });

  return {
    ouvrir: (quelquun, fiche) => {
      personne = quelquun;
      nom.textContent = fiche.nom;
      role.textContent = fiche.role;
      bulle.hidden = false;
      placer();
    },
    fermer,
  };
}
