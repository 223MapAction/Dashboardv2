# Ressources et droits

Le **code source** de ce dépôt est distribué sous licence AGPL-3.0 — voir
[LICENSE](./LICENSE).

Copyright (C) 2026 Map Action Mali.

Ce document couvre ce que l'AGPL-3.0 ne couvre pas : les ressources non
logicielles, et les données cartographiques affichées par l'application.

## Identité visuelle et ressources de l'application

Les fichiers suivants appartiennent à **Map Action Mali** et **ne sont pas
couverts par l'AGPL-3.0**. Une licence libre sur le code n'emporte pas de
droit d'usage sur la marque : vous pouvez redistribuer et modifier
l'application, mais pas vous en réclamer ni réutiliser l'identité de
Map Action Mali.

| Fichier | Nature |
|---|---|
| `src/assets/logo.webp`, `src/assets/logo-min.webp` | Logo |
| `src/assets/login_bg.webp`, `src/assets/login_bg_1.webp` | Images des écrans de connexion |
| `src/assets/notif.mp3`, `src/assets/send_message.mp3` | Sons de notification |
| `public/favicon*`, `public/android-chrome-*`, `public/apple-touch-icon.png`, `src/assets/favicon_io/*` | Favicons, dérivés du logo |
| `public/icons.svg` | Pictogrammes de l'interface |

Si vous déployez une instance pour votre propre organisation, remplacez ces
fichiers par les vôtres.

## Fonds de carte

L'application affiche des tuiles cartographiques qu'elle ne redistribue pas :
elle les demande au serveur configuré. Leurs conditions relèvent du
fournisseur choisi.

- **OpenStreetMap** (par défaut, via `VITE_OSM_TILE_URLS`) — données sous
  [ODbL](https://opendatacommons.org/licenses/odbl/), © les contributeurs
  OpenStreetMap. Rendu de style Humanitarian OpenStreetMap Team.
  L'attribution est affichée sur la carte, comme l'exige la licence : ne la
  retirez pas.
- **Mapbox** (facultatif, via `VITE_MAPBOX_TOKEN`) — n'est utilisé que si un
  jeton est fourni, et seulement pour le fond satellite. Soumis aux
  conditions de Mapbox. Sans jeton, l'application fonctionne entièrement
  avec OpenStreetMap : aucune dépendance obligatoire à un service payant.

## Dépendances logicielles

Les bibliothèques npm gardent chacune leur propre licence, déclarée dans leur
paquet. La liste installée et ses licences se consultent avec :

```bash
npm ls --prod --depth=0
```
