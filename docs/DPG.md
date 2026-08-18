# Digital Public Good — dossier du dashboard

Éléments réunis en vue du
[standard DPGA](https://digitalpublicgoods.net/standard/) pour ce dépôt.
Ce n'est pas une soumission officielle : c'est l'inventaire qui permet d'en
préparer une, et de savoir ce qui manque encore.

## 1. Pertinence pour les ODD

Le dashboard sert la coordination de la réponse environnementale et
humanitaire : ODD 11 (villes et communautés durables), ODD 13 (lutte contre
le changement climatique), ODD 17 (partenariats — la plateforme met en
relation citoyens, agents de terrain et organisations).

## 2. Licence ouverte

**AGPL-3.0**, approuvée OSI — voir [LICENSE](../LICENSE).
Copyright (C) 2026 Map Action Mali.

Les ressources non logicielles (logo, images, sons) restent la propriété de
Map Action Mali : voir [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

## 3. Propriété clairement établie

Détenteur : Map Action Mali. Mainteneurs et gouvernance :
[MAINTAINERS.md](../MAINTAINERS.md).

## 4. Indépendance vis-à-vis d'une plateforme

C'est le point le plus travaillé de ce dossier.

| Composant | Obligatoire | Alternative ouverte |
|---|---|---|
| Fond de carte | — | **MapLibre GL** + tuiles OpenStreetMap. Aucun compte tiers. |
| Mapbox | **Non** | Facultatif, uniquement pour le fond satellite. Sans jeton, le bouton n'apparaît pas. |
| Serveur de tuiles | — | Configurable via `VITE_OSM_TILE_URLS` : auto-hébergeable. |
| API backend | Oui | [`map-action-api`](https://github.com/223MapAction/map-action-api), également ouverte. Adresse configurable via `VITE_API_BASE_URL`. |
| Hébergement | — | `npm run build` produit un `dist/` statique, servi par n'importe quel serveur web. |

Aucune adresse n'est codée en dur. Un déploiement entièrement auto-hébergé
ne demande aucune modification du code source.

## 5. Documentation

- [README](../README.md) — installation, variables, architecture, déploiement
- [CONTRIBUTING](https://github.com/223MapAction/.github/blob/main/CONTRIBUTING.md) — au niveau de l'organisation
- [SECURITY](../SECURITY.md) — signalement des vulnérabilités
- [Données personnelles](./DONNEES-PERSONNELLES.md) — visibilité par rôle, GPS, médias

## 6. Extraction des données

Les données appartiennent à l'API et s'obtiennent par ses points d'accès
REST. Le dashboard n'en est qu'un lecteur ; l'export en masse relève de
[`map-action-api`](https://github.com/223MapAction/map-action-api).

## 7. Standards et bonnes pratiques

- Tests automatisés — Vitest, 179 tests.
- Lint — ESLint, dont `no-console` pour empêcher les fuites en journal.
- Intégration continue sur chaque pull request : installation depuis le
  lockfile, lint, tests, build, audit des dépendances
  ([`ci.yml`](../.github/workflows/ci.yml)).
- Analyse statique de sécurité par CodeQL.

## 8. Do No Harm — évaluation préliminaire

Risques identifiés, et ce qui est en place :

| Risque | État |
|---|---|
| Fuite de coordonnées GPS ou de contenus par les journaux | Traité — journaux muets en production, champs sensibles masqués |
| Accès trop large aux données | Partiellement — l'accès aux pages est contrôlé par rôle, le filtrage des données relève de l'API |
| Élévation de privilèges | Traité — aucun rôle par défaut, tout rôle inconnu est refusé |
| Secrets dans le dépôt | Traité — aucun ; `.env` non versionné |
| Réidentification via un signalement | **Non traité** — pas de floutage des coordonnées, à arbitrer |

Une évaluation Do No Harm complète — sécurité des agents sur le terrain,
protection des personnes signalant dans des zones sensibles — reste à
conduire par Map Action Mali.

## Ce qui reste à faire

- Base légale et durées de conservation, côté API
  (voir [Données personnelles](./DONNEES-PERSONNELLES.md)).
- Décision sur le floutage des coordonnées des signalements sensibles.
- Soumission DPG : par dépôt, ou pour la plateforme entière (dashboard,
  mobile, API, service d'analyse) via un inventaire central.
