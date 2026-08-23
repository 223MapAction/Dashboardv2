# Rapport performance — Signalements et Collaborations

**Date :** 22 août 2026

## Temps par appel

| Appel | Lignes | Durée |
|---|---|---|
| `/MapApi/incident/` (Signalements) | 20 | **3,2 s** |
| `/MapApi/collaborations/dashboard/` (Collaborations) | 12 | **1,7 s** |

## Causes de lenteur

### Signalements

- **`/MapApi/incident/`** : temps de réponse proportionnel au nombre de lignes (~140 ms/ligne) pour un poids de réponse négligeable — signature d'un problème N+1 côté serializer (requêtes SQL répétées par ligne au lieu d'une jointure).

### Collaborations

- **`/MapApi/collaborations/dashboard/`** : même défaut, à plus petite échelle.
- **Images de la liste** : chargées en original (jusqu'à 1,5 Mo) au lieu de la vignette fournie par l'API (~14 Ko) — corrigé.
