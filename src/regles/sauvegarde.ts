// Progression de l'élève et code de reprise (couche « règles » : pas de navigateur ici, testable).
//
// La progression garde, pour chaque mission terminée, le dernier niveau obtenu par compétence.
// Le code de reprise la résume en quelques caractères à recopier sur un autre appareil, sans compte ni réseau.
// Exemple : « M00-332.K7 » = mission m00, niveaux N3, N3, N2 (dans l'ordre des compétences de la mission),
// puis une clé de contrôle (K7) qui détecte une faute de frappe.

import type { Mission } from '../contenu/types';
import type { Bilan, Niveau } from './mission';

/** id de mission → (code de compétence → dernier niveau obtenu). */
export type Progression = Record<string, Record<string, Niveau>>;

const NIVEAUX: Niveau[] = ['N1', 'N2', 'N3', 'N4'];

/** Préfixe court d'une mission dans le code : ce qui précède le premier tiret de son id (« m00-… » → « M00 »). */
export const prefixeMission = (id: string) => id.split('-')[0].toUpperCase();

export function enregistrerBilan(progression: Progression, bilan: Bilan): Progression {
  return { ...progression, [bilan.mission]: Object.fromEntries(bilan.competences.map((c) => [c.code, c.niveau])) };
}

/** Clé de contrôle : 2 caractères calculés à partir de tout le reste du code. */
function cle(texte: string): string {
  let somme = 7;
  for (const caractere of texte) somme = (somme * 31 + caractere.charCodeAt(0)) % 1296; // 1296 = 36 × 36
  return somme.toString(36).toUpperCase().padStart(2, '0');
}

export function encoderCode(progression: Progression, missions: Mission[]): string {
  const morceaux = missions
    .filter((m) => progression[m.id])
    .map((m) => `${prefixeMission(m.id)}-${m.competences.map((c) => (NIVEAUX.indexOf(progression[m.id][c.code]) + 1) || 1).join('')}`);
  if (morceaux.length === 0) return '';
  const corps = morceaux.join('.');
  return `${corps}.${cle(corps)}`;
}

export function decoderCode(code: string, missions: Mission[]): { progression: Progression } | { erreur: string } {
  const propre = code.toUpperCase().replace(/\s+/g, '');
  const morceaux = propre.split('.');
  const controle = morceaux.pop();
  if (!controle || morceaux.length === 0) return { erreur: 'Code vide ou incomplet.' };
  if (cle(morceaux.join('.')) !== controle) return { erreur: 'Code incorrect : vérifiez chaque caractère.' };

  const progression: Progression = {};
  for (const morceau of morceaux) {
    const [, prefixe, chiffres] = /^([A-Z0-9]+)-([1-4]+)$/.exec(morceau) ?? [];
    const mission = missions.find((m) => prefixeMission(m.id) === prefixe);
    if (!mission) return { erreur: `Mission « ${prefixe ?? morceau} » inconnue dans cette version du jeu.` };
    if (chiffres.length !== mission.competences.length) return { erreur: `La mission ${prefixe} a changé depuis ce code.` };
    progression[mission.id] = Object.fromEntries(mission.competences.map((c, i) => [c.code, NIVEAUX[Number(chiffres[i]) - 1]]));
  }
  return { progression };
}
