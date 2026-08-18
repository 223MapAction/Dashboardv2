import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // eslint-plugin-react n'est pas installe, donc l'usage d'un identifiant
      // dans du JSX n'est pas suivi : `<Truc />` ne compte pas comme une
      // utilisation de `Truc`. D'ou la convention « majuscule = composant, on
      // ignore ». `varsIgnorePattern` la portait deja pour les variables ;
      // `argsIgnorePattern` l'etend aux parametres, sans quoi un composant
      // recu en parametre et rendu en JSX etait signale a tort.
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' },
      ],
      // `console` fuite en production et n'a aucun masquage : un appel suffit
      // a deverser un mot de passe, un jeton ou une reponse API complete dans
      // la console du navigateur. Passer par `src/utils/logger.js`, qui masque
      // les champs sensibles et se tait hors developpement.
      'no-console': 'error',
    },
  },
  {
    // Seul endroit autorise a appeler `console` : c'est lui qui l'encapsule.
    files: ['src/utils/logger.js'],
    rules: {
      'no-console': 'off',
    },
  },
])
