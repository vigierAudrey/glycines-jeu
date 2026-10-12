import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Chemins relatifs : le jeu fonctionne même copié dans un sous-dossier ou ouvert depuis un serveur simple.
  base: './',
  build: {
    target: 'es2022',
    // Three.js pèse ~600 ko : on relève le seuil d'avertissement pour ne pas polluer la sortie.
    chunkSizeWarningLimit: 900,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
