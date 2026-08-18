# Politique de sécurité

## Signaler une vulnérabilité

**N'ouvrez pas d'issue publique** pour une faille non corrigée : cela
l'expose avant qu'un correctif existe.

Deux canaux, au choix :

1. **GitHub Security Advisories** — onglet
   [Security](https://github.com/223MapAction/map-action-dashboard/security/advisories/new)
   du dépôt, « Report a vulnerability ». L'échange reste privé et suit le
   correctif jusqu'à sa publication.
2. **Courriel** — [contact@map-action.com](mailto:contact@map-action.com),
   l'adresse publique de Map Action.

Décrivez si possible : ce que vous avez observé, comment le reproduire, et
l'impact que vous estimez.

Nous visons un accusé de réception sous **5 jours ouvrés**.

## Portée

Ce dépôt ne contient que le **dashboard web**. Il ne stocke aucune donnée :
tout vient de l'API Map Action. Une faille côté serveur relève de
[`map-action-api`](https://github.com/223MapAction/map-action-api).

Les vulnérabilités des dépendances npm sont suivies automatiquement : la CI
échoue sur toute vulnérabilité de niveau *high* ou *critical*
([`ci.yml`](./.github/workflows/ci.yml)).

## Versions couvertes

Seule la branche `main` est maintenue. Les correctifs y sont appliqués, sans
rétroportage vers des versions antérieures.

## Ce qui est déjà en place

- Aucun secret dans le dépôt. `.env` n'est pas versionné ; seul
  [`.env.example`](./.env.example) décrit les variables attendues.
- Aucune donnée sensible dans les journaux :
  [`src/utils/logger.js`](./src/utils/logger.js) masque mots de passe,
  jetons, courriels et coordonnées GPS, et reste muet en production. La
  règle ESLint `no-console` empêche de le contourner.
- Aucun rôle attribué par défaut. Un `web_role` absent ou inconnu est refusé
  et l'utilisateur déconnecté
  ([`ProtectedRoute.jsx`](./src/components/auth/ProtectedRoute.jsx)).
- Aucune adresse d'API codée en dur : sans `VITE_API_BASE_URL`, l'application
  refuse de démarrer plutôt que de viser la production par défaut.
