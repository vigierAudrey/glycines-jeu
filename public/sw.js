// Service worker : il garde une copie du jeu dans le navigateur pour qu'il marche sans réseau.
// Écrit à la main (pas de bibliothèque). Il n'appelle jamais un autre site que celui du jeu.
//
// - À l'installation : on lit les pages (index.html, enseignante.html), on y repère les fichiers
//   qu'elles chargent (scripts, styles) et on met le tout en cache.
// - Pages HTML : on essaie le réseau d'abord (pour avoir la dernière version), sinon la copie.
// - Fichiers de assets/ : leur nom change à chaque version, donc la copie est toujours bonne (cache d'abord).

const CACHE = 'glycines-v1';
const PAGES = ['./', './index.html', './enseignante.html', './manifest.webmanifest', './icone-192.png', './icone-512.png'];

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PAGES);
      // Fichiers cités par les pages : src="…" et href="…" relatifs.
      for (const page of ['./index.html', './enseignante.html']) {
        const html = await (await cache.match(page)).text();
        const fichiers = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((m) => m[1]);
        await cache.addAll(fichiers);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    (async () => {
      for (const nom of await caches.keys()) if (nom !== CACHE) await caches.delete(nom);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET' || new URL(requete.url).origin !== location.origin) return;

  const estPage = requete.mode === 'navigate';
  evenement.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (estPage) {
        try {
          const reponse = await fetch(requete);
          cache.put(requete, reponse.clone());
          return reponse;
        } catch {
          // Hors ligne : la copie de la page (sans le « ?sequence=… » de l'adresse).
          return (await cache.match(requete, { ignoreSearch: true })) ?? (await cache.match('./index.html'));
        }
      }
      const copie = await cache.match(requete);
      if (copie) return copie;
      const reponse = await fetch(requete);
      if (reponse.ok) cache.put(requete, reponse.clone());
      return reponse;
    })(),
  );
});
