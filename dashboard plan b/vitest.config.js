import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Runtime JSX automatique : sans lui, les fichiers de test attendraient un
  // `import React` explicite, contrairement au reste du projet.
  esbuild: { jsx: 'automatic' },
  test: {
    // L'environnement reste `node` par defaut : les tests de logique pure ne
    // paient pas le cout d'un DOM. Les tests de composants demandent jsdom
    // fichier par fichier, via `// @vitest-environment jsdom` en tete.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
