import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Chemins relatifs : le jeu fonctionne même copié dans un sous-dossier ou ouvert depuis un serveur simple.
  base: './',
  build: {
    target: 'es2022',
    // Three.js pèse ~600 ko : on relève le seuil d'avertissement pour ne pas polluer la sortie.
    chunkSizeWarningLimit: 900,
    // Deux pages : le jeu (index.html) et la page enseignante (enseignante.html).
    rollupOptions: {
      input: { jeu: 'index.html', enseignante: 'enseignante.html' },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
