// Sauvegarde de la progression dans le navigateur (localStorage) et bloc « code de reprise » de la liste des missions.
// Rien ne quitte l'appareil : pas de compte, pas de réseau. Pour changer d'appareil, l'élève recopie son code.
// Le calcul du code est dans src/regles/sauvegarde.ts.

import type { Mission } from '../contenu/types';
import type { Bilan } from '../regles/mission';
import { decoderCode, encoderCode, enregistrerBilan, type Progression } from '../regles/sauvegarde';

const CLE = 'glycines-progression-v1';

// Le stockage peut être interdit (navigation privée, réglages du navigateur) : le jeu marche quand même, sans mémoire.
function lire(): Progression {
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? '{}') as Progression;
  } catch {
    return {};
  }
}
function ecrire(progression: Progression): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(progression));
  } catch {
    // stockage indisponible : la progression ne vit que pendant la partie
  }
}

export interface SuiviProgression {
  enregistrer: (bilan: Bilan) => void;
  /** « CT3.3 N3 · CT3.1 N2 » pour une mission déjà terminée, sinon undefined. */
  niveauxObtenus: (idMission: string) => string | undefined;
  /** Bloc HTML du code de reprise. `rafraichir` est appelée après une reprise réussie. */
  blocCode: (rafraichir: () => void) => HTMLElement;
}

export function suivreProgression(missions: Mission[]): SuiviProgression {
  let progression = lire();

  const blocCode = (rafraichir: () => void) => {
    const bloc = document.createElement('section');
    bloc.className = 'code-reprise';
    const code = encoderCode(progression, missions);

    const titre = document.createElement('h3');
    titre.textContent = 'Code de reprise';
    const actuel = document.createElement('p');
    if (code) {
      actuel.append('Pour continuer sur un autre appareil, notez ce code : ');
      const fort = document.createElement('strong');
      fort.className = 'code-reprise__code';
      fort.textContent = code;
      actuel.append(fort);
    } else {
      actuel.textContent = 'Terminez une mission pour obtenir un code.';
    }

    const formulaire = document.createElement('form');
    formulaire.className = 'code-reprise__formulaire';
    const etiquette = document.createElement('label');
    etiquette.textContent = 'Vous avez déjà un code ?';
    const champ = document.createElement('input');
    champ.name = 'code';
    champ.autocomplete = 'off';
    champ.autocapitalize = 'characters';
    champ.spellcheck = false;
    champ.placeholder = 'M00-332.K7';
    etiquette.append(champ);
    const bouton = document.createElement('button');
    bouton.type = 'submit';
    bouton.className = 'bouton bouton--texte';
    bouton.textContent = 'Reprendre';
    const message = document.createElement('p');
    message.className = 'code-reprise__message';
    message.setAttribute('role', 'status');
    formulaire.append(etiquette, bouton, message);
    formulaire.addEventListener('submit', (evenement) => {
      evenement.preventDefault();
      const resultat = decoderCode(champ.value, missions);
      if ('erreur' in resultat) {
        message.textContent = resultat.erreur;
        return;
      }
      progression = { ...progression, ...resultat.progression };
      ecrire(progression);
      rafraichir();
    });

    bloc.append(titre, actuel, formulaire);
    return bloc;
  };

  return {
    enregistrer: (bilan) => {
      progression = enregistrerBilan(progression, bilan);
      ecrire(progression);
    },
    niveauxObtenus: (id) => {
      const niveaux = progression[id];
      return niveaux && Object.entries(niveaux).map(([code, n]) => `${code} ${n}`).join(' · ');
    },
    blocCode,
  };
}
