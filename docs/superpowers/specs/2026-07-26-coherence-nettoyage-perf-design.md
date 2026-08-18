# Cohérence des rôles, nettoyage du code mort et diagnostic des lenteurs

Date : 2026-07-26
Branche : `fix/coherence-roles-cleanup-perf`
Statut : validé, prêt pour plan d'implémentation

## Contexte

Le dashboard Map Action est une SPA React 19 + Vite qui consomme l'API Django
`https://api.map-action.com`. Trois problèmes distincts ont été relevés lors de
l'analyse du code :

1. Les décisions d'accès aux pages se basent sur deux champs différents selon le
   fichier (`web_role` dans `ProtectedRoute`, `org_role` dans `Sidebar` et
   `IncidentList`).
2. Environ 2000 lignes de code ne sont importées nulle part.
3. Certaines pages sont lentes au chargement des données.

Ces trois chantiers sont indépendants et seront livrés en commits séparés.

## Décisions actées

| Question | Décision |
|---|---|
| Champ faisant autorité pour l'accès aux pages | `web_role`, partout |
| Périmètre de suppression du code mort | Mocks + composant orphelin + son CSS |
| Méthode pour la perf | Mesurer d'abord, corriger ensuite |
| Modalité de mesure | Session Chrome pilotée, utilisateur déjà authentifié sur localhost |

## Vocabulaire du domaine

Les deux champs de rôle ne sont pas interchangeables :

- **`web_role`** — niveau d'accès à l'application web.
  Valeurs observées dans le code : `super_admin`, `org_admin`, `bureau_agent`.
- **`org_role`** — fonction occupée dans l'organisation.
  Valeurs observées : `org_admin`, `bureau_agent`, `field_agent`.
  Envoyé par `AgentFormModal` à l'invitation, affiché par `Profile`.

Deux valeurs sur trois sont homonymes, ce qui explique la confusion d'origine.
`web_role` gouverne l'accès. `org_role` ne sert qu'à l'affichage d'un libellé de
fonction et aux payloads d'invitation.

---

## Phase 1 — Cohérence

Aucune dépendance externe. Réalisable immédiatement.

### 1.1 Centraliser les règles d'accès

**Problème.** La liste des chemins autorisés existe en deux exemplaires
divergents : `ProtectedRoute.jsx:33-42` (8 chemins, filtrés sur `web_role`) et
`Sidebar.jsx:100` (7 identifiants de menu, filtrés sur `org_role`). `IncidentList.jsx:69`
reproduit la logique de la Sidebar.

Conséquence observable : un utilisateur `web_role: 'super_admin'` /
`org_role: 'bureau_agent'` voit un menu à 7 entrées alors que les routes lui
ouvrent l'intégralité de l'application.

**Solution.** Créer `src/utils/permissions.js`, source unique de vérité :

```js
export const NAV_ITEMS_BY_ROLE   // identifiants de menu autorisés par web_role
export const PATHS_BY_ROLE       // chemins autorisés par web_role
export function getAccessibleNavIds(user)
export function canAccessPath(user, path)
export function isSuperAdmin(user)
```

Consommateurs à modifier :

| Fichier | Changement |
|---|---|
| `components/auth/ProtectedRoute.jsx` | Remplace la whitelist inline par `canAccessPath` |
| `components/layout/Sidebar.jsx:96-104` | `org_role` → `getAccessibleNavIds` |
| `pages/incident/components/IncidentList/IncidentList.jsx:68-69` | `org_role` → `getAccessibleNavIds` |

**Non concerné.** Les usages légitimes d'`org_role` restent inchangés :
`Profile.jsx:303`, `Agents.jsx:101-103`, `IncidentAssignModal.jsx:96-98`,
`MesInterventionsAssignModal.jsx:96-98`, `IncidentAgentsListModal.jsx:69`,
`MesInterventions.jsx:124`, et les payloads des services.

**Critère de réussite.** `grep -rn "org_role" src/` ne renvoie plus aucune
occurrence dans un contexte de décision d'accès — uniquement de l'affichage et
des payloads. Le comportement pour un `org_admin` et un `bureau_agent` reste
identique à aujourd'hui.

### 1.2 Supprimer les logs de credentials

`pages/auth/services/authService.js:27` écrit le mot de passe en clair dans la
console du navigateur :

```js
console.log('[AUTH] Tentative de connexion avec:', { email, password });
```

Ligne 44, le token d'accès est également logué (tronqué à 20 caractères).

**Solution.** Suppression des deux lignes. Les `console.error` des blocs `catch`
sont conservés — ils ne contiennent pas de secret et servent au diagnostic.

**Critère de réussite.** `grep -n "password" src/pages/auth/services/authService.js`
ne renvoie plus que des noms de paramètres et des URLs d'endpoint.

### 1.3 Intercepteur 401 avec rafraîchissement de token

**Problème.** `authService.refreshToken()` existe (ligne 151) mais n'est appelé
par aucun code de production. `createAuthenticatedAxios()` fabrique une instance
axios neuve à chaque appel de service, sans intercepteur. À l'expiration du
token d'accès, toutes les requêtes échouent en 401 sans tentative de
rafraîchissement — l'utilisateur voit des pages vides sans message.

**Solution.** Ajouter un intercepteur de réponse dans
`createAuthenticatedAxios()` :

1. Sur une réponse 401, si la requête n'a pas déjà été rejouée
   (drapeau `_retry` sur la config), déclencher le rafraîchissement.
2. **Garde anti-ruée** : une unique promesse de refresh est stockée au niveau du
   module. Les requêtes concurrentes qui prennent un 401 s'y abonnent au lieu
   d'émettre chacune leur propre `POST /token/refresh/`. La promesse est remise
   à `null` une fois résolue ou rejetée.
3. Sur succès, rejouer la requête initiale avec le nouveau token.
4. Sur échec, appeler `logout()` et rediriger vers `/login`.

**Exclusions.** Les routes `/MapApi/login/` et `/MapApi/token/refresh/` ne
déclenchent jamais le rejeu, pour éviter une boucle infinie.

**Critère de réussite.** Avec un token d'accès invalidé manuellement dans
`sessionStorage`, une navigation déclenche exactement un appel à
`/MapApi/token/refresh/` puis le rejeu réussi de la requête d'origine.

### 1.4 Hors périmètre de la phase 1

`pages/agents/Agents.jsx` compare `web_role` à trois orthographes différentes —
`'bureau_agent'`, `'bureau'`, `'agent_de_bureau'` — aux lignes 214, 240, 512 et
523. Normaliser sans connaître la valeur réellement renvoyée par l'API
reviendrait à parier sur l'accès en production.

Ce point est **reporté en phase 3**, où la réponse de `/MapApi/user_retrieve/`
sera inspectée directement. Décision documentée à ce moment-là.

---

## Phase 2 — Suppression du code mort

Vérifié : aucun de ces fichiers n'est importé nulle part dans `src/`.

| Fichier | Lignes |
|---|---|
| `pages/collaboration-requests/data/requests.js` | 528 |
| `pages/impact/data/impacts.js` | 268 |
| `pages/collaboration/data/collaborations.js` | 225 |
| `pages/incident/data/incidents.js` | 206 |
| `pages/trash/data/trashedIncidents.js` | 137 |
| `pages/collaboration/components/CollaborationDetail.jsx` | 659 |
| `pages/collaboration/components/collaboration-detail.css` | — |

Le composant orphelin est un doublon de `pages/collaboration-detail/CollaborationDetail.jsx`
(3755 lignes, celui que le routeur utilise). `pages/collaboration/index.js`
n'exporte que `Collaboration`.

**À conserver — ce ne sont pas des mocks mais des constantes de configuration,
importées par cinq fichiers :**

- `pages/agents/data/agents.js` (`ROLES`, `AVATAR_COLORS`)
- `pages/organisations/data/organisations.js` (`SECTORS`, `TYPES`, `COUNTRIES`)

**Critère de réussite.** `npm run build` réussit après suppression, et
`npm run lint` ne signale aucun import cassé.

---

## Phase 3 — Perf : mesure puis correction

### Protocole de mesure

L'utilisateur a déjà `npm run dev` lancé et une session authentifiée dans
Chrome. La mesure se fait en pilotant ce navigateur, sans manipulation de
credentials.

Pages à instrumenter, dans cet ordre :

1. `/mes-interventions`
2. `/impact`
3. `/signalements`
4. `/signalements/:id`

Relevés par page :

| Métrique | Source |
|---|---|
| Nombre de requêtes XHR | onglet Réseau |
| Durée totale jusqu'à affichage complet | onglet Réseau |
| Plus gros contributeur en temps | onglet Réseau |
| Taille des payloads | onglet Réseau |

Relevé complémentaire, une seule fois : le corps de la réponse
`/MapApi/user_retrieve/`, pour trancher le point 1.4.

### Hypothèses à confirmer ou infirmer

Ces quatre hypothèses sont issues de la lecture du code. **Elles ne seront
corrigées que si la mesure les confirme comme coûteuses.**

**H1 — N+1 sur « Mes interventions ».**
`MesInterventions.jsx:473` rend `<IncidentAgentsStack incident={incident} />`
dans le `.map()` de la liste. Chaque ligne porte son propre `useSWR`
(ligne 110) vers `/MapApi/incidents/:id/assignments/`. Attendu : autant de
requêtes que de lignes affichées.
*Correction envisagée si confirmé* : une requête unique au niveau de la liste,
résultat distribué aux lignes via `useMemo` ou contexte.

**H2 — Sérialisation bloquante dans `Impact`.**
`Impact.jsx:124` et `Impact.jsx:143` exécutent
`JSON.stringify(data, null, 2)` dans un `useEffect`, à chaque changement de
données, en production.
*Correction envisagée si confirmé* : suppression pure et simple des deux
`useEffect` de log.

**H3 — Fetcher mal câblé dans `IncidentDetail`.**
`IncidentDetail.jsx:254` écrit `useSWR('collaborations', getCollaborationsService)`.
SWR passe la clé au fetcher, donc le service reçoit la chaîne
`'collaborations'` comme objet de paramètres, puis l'étale :
`params: { scope: 'self', ...'collaborations' }` produit treize paramètres
parasites indexés. L'appel charge par ailleurs toutes les collaborations pour
une page de détail d'un seul signalement.
*Correction envisagée si confirmé* : fetcher explicite, et restriction du
périmètre au signalement courant si l'API le permet.

**H4 — Payloads surdimensionnés.**
`organisation_service.jsx:33` demande `page_size=1000`.
`incident_service.jsx:25` demande `page_size=100` par défaut.
*Correction envisagée si confirmé* : réduction alignée sur ce que l'écran
affiche réellement.

### Référence positive

`pages/collaboration/Collaboration.jsx` est déjà optimisé : préchargement de la
page suivante (lignes 207-213), `dedupingInterval` de 5 minutes sur la liste
de signalements du filtre (ligne 116), clés SWR complètes incluant tous les filtres.
Ce traitement n'a été appliqué qu'à cette page. Il sert de modèle si la mesure
justifie de l'étendre.

### Livrable

Un tableau page × métriques, puis un ordre de correction établi sur les chiffres
mesurés — non sur les hypothèses ci-dessus.

---

## Découpage en commits

1. `refactor(auth): centraliser les règles d'accès sur web_role`
2. `fix(auth): supprimer les logs de credentials et ajouter l'intercepteur 401`
3. `chore: supprimer les mocks et le composant collaboration orphelin`
4. `perf: <intitulé selon les mesures>`

Chaque commit est indépendant et annulable seul.

## Risques

| Risque | Mitigation |
|---|---|
| L'alignement sur `web_role` change l'accès d'utilisateurs réels | Comparer le menu avant/après pour chaque valeur de `web_role` pendant la session de mesure |
| L'intercepteur 401 boucle | Exclusion explicite des routes login et refresh, drapeau `_retry` par requête |
| Une suppression casse un import indirect | `npm run build` + `npm run lint` avant commit |
| Une correction de perf introduit une régression fonctionnelle | Corriger une cause à la fois, revérifier la page dans le navigateur après chaque changement |

## Hors périmètre

Absents de ce chantier, et assumés comme tels :

- Le découpage des trois gros composants (`CollaborationDetail` 3755 l.,
  `IncidentDetail` 2425 l., `Collaboration` 1860 l.)
- La factorisation du code de reconnexion WebSocket, dupliqué six fois
- L'ajout d'une infrastructure de test
- Le nettoyage général des `console.log` hors credentials et hors phase 3
