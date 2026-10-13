// Lecture à voix haute des textes des missions, avec la synthèse vocale du navigateur (aucun réseau, aucune dépendance).
// Chaque panneau a un bouton 🔊 (data-action="lire"), caché si le navigateur ne sait pas parler.
// On lit, dans l'ordre de la page, les textes marqués « a-lire », les titres des canaux et les choix proposés.

const LISIBLE = '.a-lire, legend, .choix';

export function brancherVoix(racine: HTMLElement): void {
  const synthese = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let boutonActif: HTMLElement | null = null;

  const arreter = () => {
    synthese?.cancel();
    boutonActif?.setAttribute('aria-pressed', 'false');
    boutonActif = null;
  };

  // Un nouveau panneau s'affiche : on arrête la lecture en cours et on montre son bouton 🔊.
  racine.addEventListener('panneau-affiche', (evenement) => {
    arreter();
    const panneau = (evenement as CustomEvent<HTMLElement>).detail;
    for (const b of panneau.querySelectorAll<HTMLElement>('[data-action="lire"]')) {
      b.hidden = !synthese;
      b.setAttribute('aria-pressed', 'false');
    }
  });

  racine.addEventListener('click', (evenement) => {
    const bouton = (evenement.target as HTMLElement).closest<HTMLElement>('[data-action="lire"]');
    if (!bouton || !synthese) return;
    if (boutonActif === bouton) return arreter(); // deuxième appui : on se tait

    arreter();
    const zone = bouton.closest('.panneau, .fenetre__carte') ?? racine;
    const texte = [...zone.querySelectorAll<HTMLElement>(LISIBLE)]
      .map((e) => e.innerText.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .map((t) => (/[.!?»]$/.test(t) ? t : `${t}.`)) // un point entre deux textes : la voix marque une pause
      .join(' ');
    const phrase = new SpeechSynthesisUtterance(texte);
    phrase.lang = 'fr-FR';
    phrase.rate = 0.95; // un peu plus lent : mieux compris
    const voixFr = synthese.getVoices().find((v) => v.lang.startsWith('fr'));
    if (voixFr) phrase.voice = voixFr;
    phrase.onend = () => {
      if (boutonActif === bouton) arreter();
    };
    boutonActif = bouton;
    bouton.setAttribute('aria-pressed', 'true');
    synthese.speak(phrase);
  });

  // Quitter la page (ou la masquer sur téléphone) coupe la voix.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) arreter();
  });
}
