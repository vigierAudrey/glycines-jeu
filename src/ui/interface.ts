// Interface en HTML par-dessus la 3D : barre du haut, boutons de vue, légende « Qui est qui ? ».
// Le HTML gère nativement le clavier, le tactile, la taille du texte et les lecteurs d'écran.

import type { MembrePersonnel } from '../contenu/types';
import type { Theatre } from '../scene3d/creerScene';

export function monterInterface(racine: HTMLElement, titre: string, theatre: Theatre, personnel: MembrePersonnel[]): void {
  racine.innerHTML = `
    <header class="barre">
      <h1 class="barre__titre">${titre}</h1>
      <div class="barre__actions">
        <button type="button" class="bouton" data-action="gauche" aria-label="Tourner la vue vers la gauche">⟲</button>
        <button type="button" class="bouton" data-action="droite" aria-label="Tourner la vue vers la droite">⟳</button>
        <button type="button" class="bouton" data-action="centre" aria-label="Recentrer la vue">◎</button>
        <button type="button" class="bouton bouton--texte" data-action="legende" aria-expanded="false" aria-controls="legende">Qui est qui ?</button>
      </div>
    </header>
    <aside id="legende" class="legende" hidden>
      <h2>Le personnel de l'aile B</h2>
      <ul>
        ${personnel
          .map((p) => `<li><span class="pastille" style="background:${p.tenue}"></span><strong>${p.joueur ? 'Vous' : p.sigle}</strong> ${p.metier}${p.joueur ? '' : ` (${p.prenom})`}</li>`)
          .join('')}
      </ul>
      <p>Les résidents portent leur nom au-dessus de la tête.</p>
    </aside>
    <p class="conseil-paysage">Conseil : tournez votre téléphone pour jouer en paysage.</p>
    <p class="aide">Glisser pour se déplacer · pincer ou molette pour zoomer</p>
  `;

  const legende = racine.querySelector<HTMLElement>('#legende')!;
  racine.addEventListener('click', (evenement) => {
    const bouton = (evenement.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
    switch (bouton?.dataset.action) {
      case 'gauche':
        theatre.tourner(-1);
        break;
      case 'droite':
        theatre.tourner(1);
        break;
      case 'centre':
        theatre.recentrer();
        break;
      case 'legende':
        legende.hidden = !legende.hidden;
        bouton.setAttribute('aria-expanded', String(!legende.hidden));
        break;
    }
  });
}
