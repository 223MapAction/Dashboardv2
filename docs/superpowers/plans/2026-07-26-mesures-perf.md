# Mesures de performance — 2026-07-26

Relevés effectués sur `http://localhost:5175`, compte réel, session authentifiée,
via l'API Performance du navigateur (`performance.getEntriesByType('resource')`).

## Contexte du jeu de données

**Important pour l'interprétation** : l'organisation de test (Kaicedra
Consulting SAS) contient **2 signalements** et **0 intervention assignée**. Les
mesures ci-dessous valent pour ce volume. Elles ne disent rien du comportement
à 50 ou 200 signalements.

## Relevés

| Page | Nb requêtes | Requête la plus lente | Détail |
|---|---|---|---|
| `/mes-interventions` | 2 | 736 ms (`org-incidents/`) | page vide, aucun signalement assigné |
| `/impact` | 3 | 1344 ms (`impact/`) | `impact/` et `impact/incidents/` en parallèle |
| `/signalements` | 3 | 1264 ms (`incident/`) | + `collaboration/` non paginé à 928 ms |

Les tailles de payload ne sont pas mesurables : l'API est cross-origin sans
en-tête `Timing-Allow-Origin`, donc `transferSize` vaut 0.

## Valeurs réelles des rôles

Relevé sur `/MapApi/user_retrieve/` :

```
web_role : "super_admin"
org_role : "org_admin"
```

**Les deux champs divergent sur ce compte** — confirmation directe du bug
d'origine.

## Verdict par hypothèse

### H1 — N+1 sur « Mes interventions » : NON CONCLUANT

La page ne contient aucune intervention assignée pour ce compte. Sans ligne
rendue, `IncidentAgentsStack` n'est jamais monté et le `useSWR` par ligne ne
part jamais. 2 requêtes mesurées.

Le défaut reste **structurellement présent** dans le code
(`MesInterventions.jsx:473` rend le composant dans le `.map()` de la liste,
et `MesInterventions.jsx:110` porte un `useSWR` par instance). Il ne se
manifestera qu'avec des données. À re-mesurer sur un compte ayant des
interventions assignées avant toute correction.

### H2 — Sérialisation bloquante dans `Impact` : CONFIRMÉE (par lecture du code)

Le coût exact en millisecondes n'a pas pu être chiffré : la mesure exigeait de
lire le jeton d'accès pour rejouer la requête, ce que le harnais bloque à juste
titre.

La correction a néanmoins été appliquée, car elle ne demande aucune
justification chiffrée : `JSON.stringify(payload, null, 2)` exécuté dans un
`useEffect` à chaque changement de données, en production, dont le seul effet
est d'écrire dans une console que personne ne lit, est du gaspillage pur. Le
coût est proportionnel à la taille du payload et croîtra avec les données.

Les deux `useEffect` de log ont été remplacés par une remontée d'erreur unique.

### H3 — Fetcher mal câblé : RÉFUTÉE

Hypothèse fausse. Elle reposait sur une confusion entre deux modules homonymes :

| Module | Signature |
|---|---|
| `pages/incident/service/collaboration_service.jsx` | `getCollaborationsService = async () =>` — **aucun paramètre** |
| `pages/collaboration/service/collaboration_service.js` | `getCollaborationsService = async (params = {}) =>` |

`IncidentDetail.jsx:13` et `IncidentList.jsx:10` importent tous deux le
**premier**, qui ignore l'argument que SWR lui passe. Aucun paramètre parasite
n'est émis.

Vérifié par la mesure : `/MapApi/collaboration/` part avec **zéro query
parameter**.

Les deux consommateurs du second module (`Collaboration.jsx`,
`CollaborationDetail.jsx`) passent un objet de paramètres correct.

**Aucune correction à faire.**

### H4 — Payloads surdimensionnés : PARTIELLEMENT INFIRMÉE

`/MapApi/incident/` est appelé avec `page` et `page_size` explicites depuis la
page `/signalements` : le défaut `page_size=100` d'`incident_service.jsx:25` ne
s'applique pas sur ce chemin.

`organisation_service.jsx:33` (`page_size=1000`) n'a pas été atteint pendant les
relevés.

**Aucune correction appliquée** faute de preuve d'un coût réel.

## Découverte non prévue

`/signalements` appelle `/MapApi/collaboration/` **non paginé** (928 ms) pour
alimenter une simple liste. L'endpoint renvoie toutes les collaborations de
l'utilisateur alors que la page n'en affiche qu'un extrait. C'est un coût réel
mais modéré au volume actuel ; il grandira linéairement avec le nombre de
collaborations.

Non corrigé : la correction demande de savoir si l'API accepte un filtrage par
signalement, ce qui n'a pas été vérifié.

## Vérification de l'intercepteur 401

Protocole : `sessionStorage.setItem('access_token', 'jeton-volontairement-invalide')`
puis navigation vers `/impact`.

| Endpoint | Appels |
|---|---|
| `/MapApi/token/refresh/` | **1** |
| `/MapApi/notifications/` | 2 |
| `/MapApi/impact/` | 2 |
| `/MapApi/impact/incidents/` | 2 |

Trois requêtes ont pris un 401 simultanément. Elles ont déclenché **un seul**
appel de rafraîchissement — le verrou anti-ruée fonctionne — puis ont toutes
été rejouées avec succès. La page s'affiche complète, sans redirection vers
`/login` ni boucle de requêtes.

**Comportement conforme.**

## Vérification du contrôle d'accès

- Requête de `/dashboard` sans session → redirection vers `/login`. Conforme.
- Menu affiché pour `web_role: super_admin` → 9 entrées, Organisations et
  Corbeille comprises. Conforme.

Le compte disponible étant `super_admin`, le cas `org_admin` / `bureau_agent`
n'a pas pu être vérifié en conditions réelles. Il est couvert par les tests
unitaires de `src/utils/permissions.test.js`.

## Point laissé ouvert : les orthographes de `web_role` dans `Agents.jsx`

`Agents.jsx` teste `web_role` contre `'bureau_agent'`, `'bureau'` et
`'agent_de_bureau'` (lignes 214, 240, 512, 523).

L'API renvoie des valeurs canoniques en snake_case (`super_admin`,
`org_admin`), ce qui suggère fortement que les deux variantes sont du code
défensif mort.

**Décision : ne pas modifier.** Un seul compte a été observé, et il est
`super_admin` — la valeur `bureau_agent` n'a donc jamais été vue en réponse
réelle. Normaliser sur cette base reviendrait à parier sur l'accès en
production pour un gain purement cosmétique. À trancher lors d'une connexion
avec un compte `bureau_agent`.

## Ce qui n'a pas été mesuré

- `/signalements/:id` — non relevé.
- Coût de rendu React (Profiler) — non relevé.
- Tailles de payload — non mesurables (cross-origin sans `Timing-Allow-Origin`).
