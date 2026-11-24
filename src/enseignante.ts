// Page enseignante (enseignante.html) : toutes les missions, leurs compétences, les réponses attendues
// et les questions de débriefing, à lire à l'écran ou à imprimer. Elle est rangée comme le jeu (matière, puis format,
// puis séquence) et donne les liens pour ouvrir le jeu : par séquence pour les élèves, tout ouvert en mode classe,
// ou une mission précise (bouton « Jouer »).
// Aucune 3D ici : la page reste légère et s'imprime proprement.

import './enseignante.css';
import { chargerContenu } from './contenu/charger';
import type { Etape, Mission, Option, Points } from './contenu/types';
import { dansFamille, SEQUENCES } from './regles/deblocage';
import { NOMS_NATURE, pointsMaxMission } from './regles/mission';
import { ajouterBilan, classeEnCsv, lireFichierBilan, lireLigneCode, nomAffiche, tableauxClasse, type BilanEleve } from './regles/bilanClasse';
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
  const titre = `<h4>Étape ${i + 1} · ${echapper(e.consigne)}</h4>${e.document ? `<p><em>Document « ${echapper(e.document.titre)} » :</em> ${e.document.lignes.map(echapper).join(' · ')}</p>` : ''}${e.si_oubli ? `<p><em>📌 Rappel si l'étape est manquée (montré au début d'une prochaine mission) :</em> ${echapper(e.si_oubli)}</p>` : ''}`;
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
    case 'transmission':
      return `${titre}<p><em>Transmission.</em> Tri attendu (seuls les faits observés sont transmis) :</p>
        <ul>${e.phrases.map((ph) => `<li>« ${echapper(ph.texte)} » → <strong>${NOMS_NATURE[ph.nature]}</strong> <span class="points">${pointsEnTexte(ph.points)}</span></li>`).join('')}</ul>`;
    case 'ordre':
      return `${titre}<p><em>Protocole.</em> Ordre attendu (mélangé à l'écran) :</p>
        <ol>${e.elements.map((el) => `<li>${echapper(el.texte)} <span class="points">${pointsEnTexte(el.points)}</span></li>`).join('')}</ol>`;
    case 'selection':
      return `${titre}<p><em>${echapper(e.question)}</em> Réponses attendues :</p>
        <ul>${e.elements.map((el) => `<li>${echapper(el.texte)}${el.stock !== undefined ? ` (stock ${el.stock}, seuil ${el.seuil})` : ''} → <strong>${el.attendu ? 'à cocher' : 'à laisser'}</strong> <span class="points">${pointsEnTexte(el.points)}</span></li>`).join('')}</ul>`;
    case 'qcm':
      return `${titre}<p><em>QCM.</em> ${echapper(e.question)} <span class="points">${pointsEnTexte(e.points)}</span></p>
        <ul>${e.options.map((o) => `<li>${o.juste ? '<strong>' : ''}${echapper(o.texte)}${o.juste ? ' ✔</strong>' : ''}</li>`).join('')}</ul>`;
    case 'association':
      return `${titre}<p><em>Association.</em> Paires attendues :</p>
        <ul>${e.paires.map((p) => `<li><strong>${echapper(p.terme)}</strong> : ${echapper(p.definition)} <span class="points">${pointsEnTexte(p.points)}</span></li>`).join('')}</ul>`;
    case 'tri':
      return `${titre}<p><em>Tri.</em> Rangement attendu :</p>
        <ul>${e.elements.map((el) => `<li>${echapper(el.texte)} → <strong>${echapper(e.categories.find((c) => c.id === el.categorie)?.libelle ?? '')}</strong> <span class="points">${pointsEnTexte(el.points)}</span></li>`).join('')}</ul>`;
  }
}

/** Adresse du jeu, à partir de la page enseignante (même dossier). */
const adresse = (parametres: string) => new URL(`index.html${parametres ? `?${parametres}` : ''}`, location.href).href;
const familles = contenu.familles ?? [];
const famillesDe = (m: Mission) => familles.filter((f) => dansFamille(m, f.prefixe)).map((f) => f.court);

function missionEnHtml(m: Mission): string {
  const max = pointsMaxMission(m);
  const id = m.id.split('-')[0];
  return `
    <details class="mission" id="${echapper(m.id)}">
      <summary>
        <span class="mission__titre">${echapper(m.titre)} ${m.statut === 'brouillon' ? '<span class="brouillon">brouillon</span>' : ''}</span>
        <span class="meta">${echapper(id)} · ${m.duree_min} min · ${echapper(lieux.get(m.lieu) ?? m.lieu)} · ${m.competences.map((c) => echapper(c.code)).filter((c, i, t) => t.indexOf(c) === i).join(', ')}</span>
        ${famillesDe(m).length ? `<span class="etiquettes">${famillesDe(m).map((f) => `<span class="etiquette">${echapper(f)}</span>`).join('')}</span>` : ''}
      </summary>
      <p class="jouer">
        <a class="bouton-lien" href="${adresse(`mission=${id}`)}" target="_blank" rel="noopener">▶ Jouer cette mission</a>
        <a class="bouton-lien" href="${adresse(`mission=${id}&classe`)}" target="_blank" rel="noopener">📽 La projeter (mode classe)</a>
      </p>
      <p><strong>Situation :</strong> ${echapper(m.situation)}</p>
      ${m.variantes?.length ? `<p><strong>Variantes tirées au hasard</strong> (mêmes réponses attendues) :</p>
      <ul>${m.variantes.map((v) => `<li><strong>${echapper(v.libelle)}</strong> : ${echapper(v.situation)}</li>`).join('')}</ul>` : ''}
      <p><strong>Objectif de l'élève :</strong> ${echapper(m.objectif_eleve)}</p>
      ${m.transfert ? '<p class="meta">Situation de transfert : N4 possible.</p>' : ''}
      <h4>Compétences et critères (référentiel)</h4>
      <ul>${m.competences.map((c) => `<li><strong>${echapper(c.code)}</strong> ${echapper(c.critere)} <span class="points">(${max[c.code] ?? 0} points au maximum)</span></li>`).join('')}</ul>
      <h4>Déroulé et réponses attendues</h4>
      ${m.etapes.map(etapeEnHtml).join('')}
      <h4>Questions de débriefing</h4>
      <ol>${m.debriefing.map((q) => `<li>${echapper(q)}</li>`).join('')}</ol>
    </details>`;
}

// Même rangement que dans le jeu : matière (Bloc 2, PSE), puis format (missions dans l'aile, entraînements), puis séquence.
const MATIERES = [
  { id: 'bloc2', titre: 'Bloc 2', estDeLaMatiere: (m: Mission) => m.discipline !== 'PSE' },
  { id: 'pse', titre: 'PSE', estDeLaMatiere: (m: Mission) => m.discipline === 'PSE' },
] as const;
const FORMATS = [
  { id: 'missions', titre: "🏠 Missions dans l'aile", estDuFormat: (m: Mission) => m.format !== 'entrainement' },
  { id: 'entrainements', titre: '⚡ Entraînements rapides', estDuFormat: (m: Mission) => m.format === 'entrainement' },
] as const;
const rangees = MATIERES.map((mat) => ({
  ...mat,
  formats: FORMATS.map((f) => {
    const liste = contenu.missions.filter((m) => mat.estDeLaMatiere(m) && f.estDuFormat(m)).sort((a, b) => a.sequence_requise.localeCompare(b.sequence_requise) || a.id.localeCompare(b.id, 'fr', { numeric: true }));
    const sequences = [...new Set(liste.map((m) => m.sequence_requise))].map((s) => ({ s, missions: liste.filter((m) => m.sequence_requise === s) }));
    return { ...f, ancre: `${mat.id}-${f.id}`, nombre: liste.length, sequences };
  }),
}));

const racine = document.querySelector<HTMLElement>('#enseignante')!;
racine.innerHTML = `
  <header class="entete">
    <h1>Une journée aux Glycines · page enseignante</h1>
    <p>${echapper(contenu.referentiel.diplome)} · ${contenu.missions.length} activités</p>
    <div class="actions">
      <button type="button" class="imprimer" data-action="tout-ouvrir">Tout déplier</button>
      <button type="button" class="imprimer" data-action="tout-fermer">Tout replier</button>
      <button type="button" class="imprimer" onclick="window.print()">Imprimer</button>
    </div>
  </header>

  <section class="lien-classe">
    <h2>Ouvrir le jeu</h2>
    <p>Il n'y a pas de code à retenir : <strong>c'est l'adresse qui ouvre les missions</strong>. Dans le Bloc 2, une mission s'ouvre quand sa séquence a été vue. Les missions de PSE sont toujours ouvertes.</p>
    <ul class="ouvrir">
      <li><a class="bouton-lien bouton-lien--fort" href="${adresse('classe')}" target="_blank" rel="noopener">📽 Mode classe : toutes les missions ouvertes</a> <span class="meta">Pour le vidéoprojecteur : grands caractères, correction cachée jusqu'au bouton « Révéler ».</span></li>
      <li><a class="bouton-lien" href="${adresse('sequence=S7')}" target="_blank" rel="noopener">▶ Tout ouvert, sans mode classe</a> <span class="meta">Pour tester seule sur votre ordinateur.</span></li>
    </ul>
    <h3>Lien à donner aux élèves</h3>
    <p class="meta">Choisissez la dernière séquence vue en cours. Les élèves peuvent aussi changer eux-mêmes « Séquence vue en cours » en haut de la liste du Bloc 2.</p>
    <table class="sequences">
      ${SEQUENCES.map((s) => `<tr><th>${s}</th><td class="sequences__adresse"><code>${adresse(`sequence=${s}`)}</code></td><td class="sequences__boutons"><a class="petit" href="${adresse(`sequence=${s}`)}" target="_blank" rel="noopener">Ouvrir</a> <button type="button" class="petit" data-copier="${adresse(`sequence=${s}`)}">Copier</button></td></tr>`).join('')}
    </table>
    <p class="meta" id="copie" role="status"></p>
  </section>

  <section class="bilans-classe" id="classe">
    <h2>Bilans de la classe</h2>
    <p>Les élèves téléchargent leur bilan depuis « 📄 Mon bilan » (bouton « 🗂 Fichier de données ») et vous le remettent (ENT, Pronote, clé USB). Ajoutez ici tous les fichiers d'un coup : vous obtenez le meilleur niveau de chaque élève pour chaque compétence.</p>
    <p class="meta">Tout est lu sur cet ordinateur : rien n'est envoyé ni gardé. En fermant la page, le tableau disparaît (téléchargez-le avant).</p>
    <label class="depot" data-depot>
      <input type="file" accept=".json,application/json" multiple data-fichiers>
      <span>📂 Choisir les fichiers .json des élèves</span>
      <span class="meta">ou les glisser ici</span>
    </label>
    <details class="codes">
      <summary>Ou coller des codes de reprise</summary>
      <p class="meta">Une ligne par élève : le nom, un point-virgule, puis le code. Exemple : <code>Dupont Léa ; M01-332.M05-23.K7</code></p>
      <textarea rows="5" data-codes spellcheck="false"></textarea>
      <button type="button" class="petit" data-action="ajouter-codes">Ajouter ces élèves</button>
    </details>
    <ul class="messages" data-messages role="status"></ul>
    <div data-resultat></div>
  </section>

  <nav class="sommaire" aria-label="Sommaire">
    ${rangees.map((mat) => `<div><strong>${mat.titre}</strong>${mat.formats.filter((f) => f.nombre).map((f) => `<a href="#${f.ancre}">${f.titre} (${f.nombre})</a>`).join('')}</div>`).join('')}
    <div><strong>Repères</strong><a href="#classe">Bilans de la classe</a><a href="#niveaux">Niveaux N1 à N4</a><a href="#lexique">Lexique</a></div>
  </nav>

  ${rangees.map((mat) => `
  <section class="matiere">
    <h2>${mat.titre}</h2>
    ${mat.formats.filter((f) => f.nombre).map((f) => `
    <h3 class="format" id="${f.ancre}">${f.titre} · ${f.nombre}</h3>
    ${f.sequences.map(({ s, missions }) => `
    <details class="sequence" open>
      <summary>Séquence ${echapper(s)}${mat.id === 'pse' ? ' de PSE' : ''} · ${missions.length} ${f.id === 'missions' ? 'mission' : 'entraînement'}${missions.length > 1 ? 's' : ''}</summary>
      ${missions.map(missionEnHtml).join('')}
    </details>`).join('')}`).join('')}
  </section>`).join('')}

  <section id="niveaux">
    <h2>Niveaux</h2>
    <ul>${Object.entries(contenu.referentiel.niveaux).map(([n, sens]) => `<li><strong>${n}</strong> : ${echapper(sens)}</li>`).join('')}</ul>
    <p class="meta">Calcul : part des points obtenus sur le maximum de la mission. Moins de 40 % : N1 ; moins de 70 % : N2 ; sinon N3. N4 seulement dans une mission de transfert, avec 90 % au moins.</p>
  </section>

  <section id="lexique">
    <h2>Lexique du métier (${contenu.lexique?.length ?? 0} mots touchables dans les missions)</h2>
    <p class="meta">Définitions reprises mot pour mot des rubriques « Lexique » des séances. Fichier : content/lexique.json.</p>
    <ul>${(contenu.lexique ?? []).map((l) => `<li><strong>${echapper(l.mot)}</strong> : ${echapper(l.definition)} <span class="meta">(${echapper(l.source)})</span></li>`).join('')}</ul>
  </section>`;

const toutesLesFiches = () => racine.querySelectorAll<HTMLDetailsElement>('details.mission, details.sequence');
racine.addEventListener('click', (evenement) => {
  const cible = (evenement.target as HTMLElement).closest<HTMLElement>('button');
  if (!cible) return;
  if (cible.dataset.action === 'tout-ouvrir') toutesLesFiches().forEach((d) => (d.open = true));
  if (cible.dataset.action === 'tout-fermer') racine.querySelectorAll<HTMLDetailsElement>('details.mission').forEach((d) => (d.open = false));
  if (cible.dataset.copier) {
    const message = racine.querySelector<HTMLElement>('#copie')!;
    navigator.clipboard?.writeText(cible.dataset.copier).then(
      () => (message.textContent = 'Lien copié.'),
      () => (message.textContent = 'Copie impossible : sélectionnez le lien à la main.'),
    );
  }
});
// ---------- Bilans de la classe ----------
// Les bilans restent dans cette variable : rien n'est gardé dans le navigateur, rien n'est envoyé.
const partiesReferentiel = [
  { titre: 'Bloc 2', referentiel: contenu.referentiel },
  ...(contenu.referentielPse ? [{ titre: 'PSE', referentiel: contenu.referentielPse }] : []),
];
let bilans: BilanEleve[] = [];
const zoneClasse = racine.querySelector<HTMLElement>('#classe')!;
const messages = zoneClasse.querySelector<HTMLElement>('[data-messages]')!;
const resultat = zoneClasse.querySelector<HTMLElement>('[data-resultat]')!;

function afficherClasse() {
  if (!bilans.length) {
    resultat.innerHTML = '';
    return;
  }
  const tableaux = tableauxClasse(bilans, contenu.missions, partiesReferentiel);
  resultat.innerHTML = `
    <h3>${bilans.length} élève${bilans.length > 1 ? 's' : ''}</h3>
    <div class="actions">
      <button type="button" class="petit" data-action="classe-csv">📊 Télécharger le tableau (LibreOffice ou Excel)</button>
      <button type="button" class="petit" data-action="classe-imprimer">🖨 Imprimer le tableau</button>
      <button type="button" class="petit" data-action="classe-vider">Vider</button>
    </div>
    ${tableaux.map((t) => `
      <h4>${echapper(t.titre)}</h4>
      <div class="defilement">
        <table class="tableau-classe">
          <thead><tr><th>Élève</th><th>Missions faites</th>${t.competences.map((c) => `<th title="${echapper(c.intitule)}">${echapper(c.code)}</th>`).join('')}</tr></thead>
          <tbody>${t.lignes.map((l) => `
            <tr><th>${echapper(nomAffiche(l.eleve))}${l.eleve.classe ? ` <span class="meta">${echapper(l.eleve.classe)}</span>` : ''}${l.date ? `<br><span class="meta">${echapper(new Date(l.date).toLocaleDateString('fr-FR'))}</span>` : ''}</th>
              <td>${l.missionsFaites}</td>
              ${l.niveaux.map((n) => `<td>${n ? `<span class="niveau niveau--${n}">${n}</span>` : '<span class="meta">·</span>'}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
      <details class="legende"><summary>Que veulent dire les codes ?</summary>
        <ul>${t.competences.map((c) => `<li><strong>${echapper(c.code)}</strong> ${echapper(c.intitule)}</li>`).join('')}</ul>
      </details>`).join('')}
    <p class="meta">Meilleur niveau obtenu dans le jeu, toutes missions confondues. « · » : compétence pas encore travaillée.</p>`;
}

function ajouterLectures(lectures: { origine: string; lecture: ReturnType<typeof lireLigneCode> }[]) {
  const lignes: string[] = [];
  let ajoutes = 0;
  for (const { origine, lecture } of lectures) {
    if ('erreur' in lecture) lignes.push(`<li class="erreur">${origine ? `${echapper(origine)} : ` : ''}${echapper(lecture.erreur)}</li>`);
    else {
      bilans = ajouterBilan(bilans, lecture.bilan);
      ajoutes++;
    }
  }
  if (ajoutes) lignes.unshift(`<li>${ajoutes} bilan${ajoutes > 1 ? 's' : ''} ajouté${ajoutes > 1 ? 's' : ''}.</li>`);
  messages.innerHTML = lignes.join('');
  afficherClasse();
}

async function lireFichiers(fichiers: FileList | File[]) {
  const liste = [...fichiers];
  const lectures = await Promise.all(liste.map(async (f) => ({
    origine: f.name,
    lecture: f.size > 1_000_000 ? { erreur: 'fichier trop gros.' } : lireFichierBilan(await f.text(), contenu.missions),
  })));
  ajouterLectures(lectures);
}

const champFichiers = zoneClasse.querySelector<HTMLInputElement>('[data-fichiers]')!;
champFichiers.addEventListener('change', () => {
  if (champFichiers.files) void lireFichiers(champFichiers.files);
  champFichiers.value = '';
});
const depot = zoneClasse.querySelector<HTMLElement>('[data-depot]')!;
depot.addEventListener('dragover', (e) => {
  e.preventDefault();
  depot.classList.add('depot--survol');
});
depot.addEventListener('dragleave', () => depot.classList.remove('depot--survol'));
depot.addEventListener('drop', (e) => {
  e.preventDefault();
  depot.classList.remove('depot--survol');
  if (e.dataTransfer?.files.length) void lireFichiers(e.dataTransfer.files);
});

zoneClasse.addEventListener('click', (evenement) => {
  const action = (evenement.target as HTMLElement).closest<HTMLElement>('button')?.dataset.action;
  if (action === 'ajouter-codes') {
    const zone = zoneClasse.querySelector<HTMLTextAreaElement>('[data-codes]')!;
    const lignes = zone.value.split(/\r?\n/).filter((l) => l.trim());
    ajouterLectures(lignes.map((l) => ({ origine: '', lecture: lireLigneCode(l, contenu.missions) })));
    if (lignes.length) zone.value = '';
  }
  if (action === 'classe-vider') {
    bilans = [];
    messages.innerHTML = '';
    afficherClasse();
  }
  if (action === 'classe-csv') {
    const url = URL.createObjectURL(new Blob([classeEnCsv(tableauxClasse(bilans, contenu.missions, partiesReferentiel))], { type: 'text/csv;charset=utf-8' }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `bilans-classe-glycines-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (action === 'classe-imprimer') {
    // Seul le tableau de la classe est imprimé (voir enseignante.css, .impression-classe).
    document.documentElement.classList.add('impression-classe');
    zoneClasse.querySelectorAll<HTMLDetailsElement>('.legende').forEach((d) => (d.open = true));
    const nettoyer = () => {
      document.documentElement.classList.remove('impression-classe');
      window.removeEventListener('afterprint', nettoyer);
    };
    window.addEventListener('afterprint', nettoyer);
    window.print();
  }
});

// À l'impression, toutes les fiches sont dépliées.
window.addEventListener('beforeprint', () => {
  if (!document.documentElement.classList.contains('impression-classe')) toutesLesFiches().forEach((d) => (d.open = true));
});
