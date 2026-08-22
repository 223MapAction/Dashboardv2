# Map Action — Dashboard

Tableau de bord web de Map Action, plateforme de gestion des signalements
environnementaux et humanitaires au Mali.

La plateforme relie trois acteurs : les **citoyens**, qui déposent un
signalement depuis l'application mobile ; les **agents de terrain**, qui
interviennent ; et les **organisations**, qui pilotent la réponse. Ce dépôt
contient l'outil des organisations — celui qui reçoit les signalements,
assigne les missions et suit leur impact.

## Fonctionnalités

| Page | Rôle |
|---|---|
| Dashboard | Vue d'ensemble et carte des signalements |
| Signalements | Liste et détail des signalements reçus |
| Mes interventions | Missions assignées à l'utilisateur connecté |
| Collaboration | Partenariats entre organisations, discussion, tâches |
| Organisations | Gestion des organisations partenaires |
| Agents | Gestion des agents rattachés à une organisation |
| Impact | Statistiques sur les interventions réalisées |
| Corbeille | Éléments supprimés, récupérables |
| Profil | Compte de l'utilisateur connecté |

## Prérequis

- **Node.js 20 ou plus** — la version utilisée par la CI et le déploiement.
- Un accès à une instance de l'**API Map Action** (voir plus bas). Ce
  dashboard est un client : il ne fonctionne pas seul.

## Installation et démarrage

```bash
git clone https://github.com/223MapAction/map-action-dashboard.git
cd map-action-dashboard
npm ci
cp .env.example .env
```

Renseignez ensuite `VITE_API_BASE_URL` dans `.env`, puis :

```bash
npm run dev
```

L'application démarre sur `http://localhost:5173`.

> Si `VITE_API_BASE_URL` est absente, l'application refuse de démarrer et
> indique quoi faire. C'est volontaire : aucune valeur par défaut ne pointe
> vers la production, pour qu'un poste mal configuré n'écrive jamais dans
> les données réelles sans que personne ne s'en aperçoive.

## Variables d'environnement

Toutes sont décrites dans [`.env.example`](./.env.example).

| Variable | Requise | Rôle |
|---|---|---|
| `VITE_API_BASE_URL` | **Oui** | Adresse de l'API Map Action. Sert aussi de base aux WebSocket : le préfixe `ws://` ou `wss://` en est déduit, il n'y a rien d'autre à configurer. |
| `VITE_OSM_TILE_URLS` | Non | Serveur de tuiles OpenStreetMap. Par défaut, les tuiles publiques `openstreetmap.fr`. À renseigner pour auto-héberger ses tuiles. |
| `VITE_MAPBOX_TOKEN` | Non | Sa présence décide du moteur cartographique : absent, MapLibre/OpenStreetMap (aucun compte tiers requis) ; présent, moteur Mapbox et fond de carte « Satellite » en plus d'OpenStreetMap. |
| `VITE_BASE_PATH` | Non | Préfixe d'URL si l'application n'est pas servie à la racine d'un domaine. Le déploiement GitHub Pages le renseigne automatiquement. |

`.env` n'est jamais versionné.

## Dépendance à l'API

Le dashboard consomme l'API [`map-action-api`](https://github.com/223MapAction/map-action-api)
(routes `/MapApi/…`). Il n'implémente aucune logique métier côté serveur :
authentification, signalements, collaborations et statistiques viennent tous de
l'API.

Pour un déploiement autonome, faites tourner votre propre instance de l'API
et pointez `VITE_API_BASE_URL` dessus.

## Premier compte

**Les comptes ne se créent pas depuis ce dashboard**, mais côté API. Chaque
utilisateur porte un champ `web_role` qui gouverne son accès :

| `web_role` | Accès |
|---|---|
| `super_admin` | Toutes les pages |
| `org_admin` | Son organisation : dashboard, collaboration, signalements, interventions, agents, impact, profil |
| `bureau_agent` | Idem `org_admin` |

Un rôle absent ou inconnu est refusé et l'utilisateur est déconnecté — il n'y
a **aucune attribution de rôle par défaut**, et notamment jamais de
`super_admin` implicite. Voir [`src/utils/permissions.js`](./src/utils/permissions.js)
et [`src/components/auth/ProtectedRoute.jsx`](./src/components/auth/ProtectedRoute.jsx).

Les agents de terrain utilisent l'application mobile, pas ce dashboard.

## Commandes

```bash
npm run dev      # serveur de développement
npm run lint     # ESLint
npm run test     # tests (Vitest)
npm run build    # build de production, dans dist/
npm run preview  # sert le build de production localement
```

## Déploiement

Chaque push sur `main` déclenche
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml), qui
construit l'application et la publie sur GitHub Pages.

Deux secrets se règlent dans **Settings → Secrets and variables → Actions** :

- `VITE_API_BASE_URL` — requis, sinon le site publié refuse de démarrer ;
- `VITE_MAPBOX_TOKEN` — facultatif, décide aussi du moteur cartographique (voir plus haut).

Pour héberger ailleurs, `npm run build` produit un `dist/` statique à servir
par n'importe quel serveur web. Si l'application n'est pas à la racine du
domaine, renseignez `VITE_BASE_PATH` au moment du build.

## Architecture

- **React 19** et **Vite**, routage avec **React Router v7** ([`src/App.jsx`](./src/App.jsx)).
- **Cartographie : MapLibre GL** via `react-map-gl/maplibre`, sur des tuiles
  OpenStreetMap ouvertes par défaut — aucune dépendance obligatoire à un
  service payant. Un `VITE_MAPBOX_TOKEN` bascule sur Mapbox GL
  (`react-map-gl/mapbox`) et débloque le fond « Satellite ». Les deux moteurs
  sont deux paquets `react-map-gl` distincts : ils ne partagent jamais un
  même composant (`src/config/mapEngine.js`, `MapView*.jsx`).
- Formulaires avec `react-hook-form` et `yup`, données via `axios` et `swr`,
  graphiques avec `recharts`.
- Chaque domaine métier vit dans `src/pages/<domaine>/`, avec son propre
  dossier `service/` pour les appels API.
- L'accès aux pages est contrôlé par
  [`ProtectedRoute`](./src/components/auth/ProtectedRoute.jsx), qui s'appuie
  sur `web_role`.
- La journalisation passe par [`src/utils/logger.js`](./src/utils/logger.js) :
  masquage des champs sensibles et silence complet en production. La règle
  ESLint `no-console` empêche de le contourner.

## Contribuer

Les vérifications tournent automatiquement sur chaque pull request : lint,
tests, build et audit des dépendances
([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)). Lancez-les en
local avant d'ouvrir une PR.

- [Guide de contribution](https://github.com/223MapAction/.github/blob/main/CONTRIBUTING.md) et [code de conduite](https://github.com/223MapAction/.github/blob/main/CODE_OF_CONDUCT.md) — au niveau de l'organisation
- [Signaler une vulnérabilité](./SECURITY.md)
- [Mainteneurs et gouvernance](./MAINTAINERS.md)
- [Données personnelles, GPS et visibilité par rôle](./docs/DONNEES-PERSONNELLES.md)
- [Dossier Digital Public Good](./docs/DPG.md)

## Licence

Distribué sous licence **AGPL-3.0** — voir [LICENSE](./LICENSE).

Copyright (C) 2026 Map Action Mali.

Le logo, les images et les sons appartiennent à Map Action Mali et ne sont
pas couverts par l'AGPL-3.0. Les fonds de carte relèvent de leurs
fournisseurs respectifs. Détail dans
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Les autres composants de Map Action

- [`map-action-api`](https://github.com/223MapAction/map-action-api) — l'API dont ce dashboard est le client
- [`map-action-mobile`](https://github.com/223MapAction/map-action-mobile) — l'application des citoyens et des agents de terrain
- [`map-action-ai-service`](https://github.com/223MapAction/map-action-ai-service) — le service d'analyse
