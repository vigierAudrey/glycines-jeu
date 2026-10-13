// Page enseignante (enseignante.html) : toutes les missions, leurs compétences, les réponses attendues
// et les questions de débriefing, à lire à l'écran ou à imprimer. Elle donne aussi le lien à envoyer à la classe.
// Aucune 3D ici : la page reste légère et s'imprime proprement.

import './enseignante.css';
import { chargerContenu } from './contenu/charger';
import type { Etape, Mission, Option, Points } from './contenu/types';
import { SEQUENCES } from './regles/deblocage';
import { pointsMaxMission } from './regles/mission';
import { echapper } from './ui/echapper';

const contenu = chargerContenu();
const noms = new Map<string, string>([
  ...contenu.residents.map((r): [string, string] => [r.id, `${r.civilite} ${r.nom}`]),
  ...contenu.personnel.map((p): [string, string] => [p.id, p.joueur ? "l'élève (AAGA)" : `${p.prenom} (${p.metier}, ${p.sigle})`]),
]);
const lieux = new Map(contenu.lieux.flatMap((l) => Object.values(l.zones)).map((z) => [z.id, z.nom]));

const total = (p: Points = {}) => Object.values(p).reduce((a, b) => a + b, 0);
const pointsEnTexte = (p: Points = {}) => Object.entries(p).filter(([, n]) => n > 0).map(([c, n]) => `${c} +${n}`).join(', ');
/** L'option qui rapporte le plus de points (la réponse attendue). */
const meilleure = <T extends Option>(options: T[]) => options.reduce((m, o) => (total(o.points) > total(m.points) ? o : m), options[0]);

function etapeEnHtml(e: Etape, i: number): string {
  const titre = `<h4>Étape ${i + 1} · ${echapper(e.consigne)}</h4>`;
  switch (e.type) {
    case 'dialogue':
      return `${titre}<p><em>Dialogue avec ${echapper(noms.get(e.interlocuteur) ?? e.interlocuteur)}.</em> Réponses attendues :</p>
        <ul>${([['Verbal', e.verbal], ['Paraverbal', e.paraverbal], ['Non-verbal', e.non_verbal]] as const)
          .map(([canal, options]) => { const o = meilleure([...options]); return `<li><strong>${canal}</strong> : ${echapper(o.texte)} <span class="points">${pointsEnTexte(o.points)}</span></li>`; })
          .join('')}</ul>`;
    case 'observation':
      return `${titre}<p><em>Loupe.</em> Repères et classement attendu :</p>
        <ul>${e.elements.map((el) => `<li>${echapper(el.libelle)} → <strong>${el.effet === 'gene' ? 'gêne' : 'facilite'}</strong> <span class="points">${pointsEnTexte(el.points)}</span></li>`).join('')}</ul>`;
    case 'decision': {
      const o = meilleure(e.choix);
      return `${titre}<p><em>${echapper(e.question)}</em> Réponse attendue : <strong>${o.decision}</strong> · ${echapper(o.texte)} <span class="points">${pointsEnTexte(o.points)}</span></p>`;
    }
    case 'relais':
      return `${titre}<p><em>Relais.</em> Personne à rejoindre : <strong>${echapper(noms.get(e.destinataire) ?? e.destinataire)}</strong> <span class="points">${pointsEnTexte(e.points)}</span></p>`;
  }
}

function missionEnHtml(m: Mission): string {
  const max = pointsMaxMission(m);
  return `
    <article class="mission">
      <header>
        <h3>${echapper(m.titre)} ${m.statut === 'brouillon' ? '<span class="brouillon">brouillon</span>' : ''}</h3>
        <p class="meta">${echapper(m.id)} · séquence ${echapper(m.sequence_requise)} · ${m.duree_min} min · ${echapper(lieux.get(m.lieu) ?? m.lieu)}${m.transfert ? ' · situation de transfert (N4 possible)' : ''}</p>
      </header>
      <p><strong>Situation :</strong> ${echapper(m.situation)}</p>
      <p><strong>Objectif de l'élève :</strong> ${echapper(m.objectif_eleve)}</p>
      <h4>Compétences et critères (référentiel)</h4>
      <ul>${m.competences.map((c) => `<li><strong>${echapper(c.code)}</strong> ${echapper(c.critere)} <span class="points">(${max[c.code] ?? 0} points au maximum)</span></li>`).join('')}</ul>
      <details open>
        <summary>Déroulé et réponses attendues</summary>
        ${m.etapes.map(etapeEnHtml).join('')}
      </details>
      <h4>Questions de débriefing</h4>
      <ol>${m.debriefing.map((q) => `<li>${echapper(q)}</li>`).join('')}</ol>
    </article>`;
}

const missions = [...contenu.missions].sort((a, b) => a.sequence_requise.localeCompare(b.sequence_requise) || a.id.localeCompare(b.id));
const racine = document.querySelector<HTMLElement>('#enseignante')!;
racine.innerHTML = `
  <header class="entete">
    <h1>Une journée aux Glycines · page enseignante</h1>
    <p>${echapper(contenu.referentiel.diplome)} · ${echapper(contenu.referentiel.bloc)}</p>
    <button type="button" class="imprimer" onclick="window.print()">Imprimer</button>
  </header>

  <section class="lien-classe">
    <h2>Lien pour la classe</h2>
    <p>Les missions s'ouvrent selon la séquence vue en cours. Choisissez la séquence, puis donnez ce lien aux élèves.</p>
    <label>Séquence vue <select id="sequence">${SEQUENCES.map((s) => `<option>${s}</option>`).join('')}</select></label>
    <p><code id="lien"></code></p>
  </section>

  <section>
    <h2>Niveaux</h2>
    <ul>${Object.entries(contenu.referentiel.niveaux).map(([n, sens]) => `<li><strong>${n}</strong> : ${echapper(sens)}</li>`).join('')}</ul>
    <p class="meta">Calcul : part des points obtenus sur le maximum de la mission. Moins de 40 % : N1 ; moins de 70 % : N2 ; sinon N3. N4 seulement dans une mission de transfert, avec 90 % au moins.</p>
  </section>

  <section>
    <h2>Missions (${missions.length})</h2>
    ${missions.map(missionEnHtml).join('')}
  </section>`;

const choix = racine.querySelector<HTMLSelectElement>('#sequence')!;
const lien = racine.querySelector<HTMLElement>('#lien')!;
const majLien = () => {
  lien.textContent = new URL(`index.html?sequence=${choix.value}`, location.href).href;
};
choix.addEventListener('change', majLien);
majLien();
