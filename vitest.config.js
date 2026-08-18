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
    env: {
      // `src/config/api_url_base.js` refuse de se charger sans cette variable,
      // pour qu'aucun deploiement ne vise la production par accident. Les
      // tests n'emettent aucune requete reseau, mais importent des modules qui
      // remontent jusqu'a ce fichier : sans valeur ici, ils dependraient d'un
      // `.env` local et echoueraient en CI comme sur un clone frais.
      VITE_API_BASE_URL: 'http://api.invalide.test',
    },
  },
});
