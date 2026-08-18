# Cohérence des rôles, nettoyage et perf — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aligner toutes les décisions d'accès sur `web_role`, supprimer les fuites de credentials, rattraper les 401 par un refresh de token, éliminer ~2000 lignes de code mort, puis mesurer et corriger les lenteurs de chargement.

**Architecture:** Un module unique `src/utils/permissions.js` devient la source de vérité des droits d'accès ; `ProtectedRoute`, `Sidebar` et `IncidentList` le consomment au lieu de dupliquer chacun sa règle. `authService.createAuthenticatedAxios()` gagne un intercepteur de réponse qui rafraîchit le token sur 401, avec une promesse partagée pour éviter la ruée. La phase perf est pilotée par la mesure, pas par les hypothèses.

**Tech Stack:** React 19, Vite 8, React Router 7, SWR 2, axios 1.15. Aucune infrastructure de test existante (voir Task 1).

## Global Constraints

- Champ faisant autorité pour l'accès aux pages : **`web_role`**. `org_role` ne sert qu'à l'affichage d'un libellé et aux payloads d'invitation.
- Valeurs de `web_role` traitées : `super_admin`, `org_admin`, `bureau_agent`. Toute autre valeur → déconnexion.
- Aucun secret (mot de passe, token) ne doit apparaître dans un `console.*`.
- Chaque tâche se termine par un commit indépendant et annulable seul.
- Commandes de vérification disponibles : `npm run build`, `npm run lint`. Il n'y a **pas** de `npm test` avant la Task 1.
- Spec de référence : `docs/superpowers/specs/2026-07-26-coherence-nettoyage-perf-design.md`

---

### Task 1 (OPTIONNELLE) : Installer Vitest et couvrir `permissions.js`

Le spec place l'infrastructure de test hors périmètre. Cette tâche l'ajoute quand même, limitée à un seul module, parce que `permissions.js` gouverne le contrôle d'accès : c'est le changement le plus risqué du plan et une fonction pure, donc le rapport valeur/effort est excellent. **Si elle est écartée, passer directement à la Task 2** — le reste du plan ne dépend pas d'elle.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `src/utils/permissions.test.js`

**Interfaces:**
- Consomme : rien.
- Produit : la commande `npm test`, utilisée en vérification par la Task 2.

- [ ] **Step 1 : Installer Vitest**

```bash
npm install --save-dev vitest@^3
```

- [ ] **Step 2 : Ajouter le script de test**

Dans `package.json`, section `"scripts"`, ajouter après `"lint"` :

```json
    "test": "vitest run",
```

- [ ] **Step 3 : Créer la configuration**

Créer `vitest.config.js` :

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
```

- [ ] **Step 4 : Écrire les tests (ils échoueront, le module n'existe pas encore)**

Créer `src/utils/permissions.test.js` :

```js
import { describe, it, expect } from 'vitest';
import {
  getAccessibleNavIds,
  canAccessPath,
  isSuperAdmin,
  isKnownWebRole,
} from './permissions';

const superAdmin = { web_role: 'super_admin', org_role: 'bureau_agent' };
const orgAdmin = { web_role: 'org_admin', org_role: 'org_admin' };
const bureau = { web_role: 'bureau_agent', org_role: 'field_agent' };
const fieldOnly = { web_role: 'field_agent', org_role: 'field_agent' };

describe('isKnownWebRole', () => {
  it('accepte les trois rôles web autorisés', () => {
    expect(isKnownWebRole(superAdmin)).toBe(true);
    expect(isKnownWebRole(orgAdmin)).toBe(true);
    expect(isKnownWebRole(bureau)).toBe(true);
  });

  it('refuse un rôle inconnu ou un utilisateur absent', () => {
    expect(isKnownWebRole(fieldOnly)).toBe(false);
    expect(isKnownWebRole(null)).toBe(false);
    expect(isKnownWebRole({})).toBe(false);
  });
});

describe('isSuperAdmin', () => {
  it('ne se base que sur web_role, jamais sur org_role', () => {
    expect(isSuperAdmin(superAdmin)).toBe(true);
    expect(isSuperAdmin({ web_role: 'org_admin', org_role: 'super_admin' })).toBe(false);
  });
});

describe('getAccessibleNavIds', () => {
  it('donne les 9 entrées au super_admin', () => {
    expect(getAccessibleNavIds(superAdmin)).toHaveLength(9);
    expect(getAccessibleNavIds(superAdmin)).toContain('trash');
    expect(getAccessibleNavIds(superAdmin)).toContain('organisations');
  });

  it('donne 7 entrées à org_admin et bureau_agent, sans trash ni organisations', () => {
    for (const user of [orgAdmin, bureau]) {
      const ids = getAccessibleNavIds(user);
      expect(ids).toHaveLength(7);
      expect(ids).not.toContain('trash');
      expect(ids).not.toContain('organisations');
    }
  });

  it('ignore org_role : un super_admin avec org_role bureau_agent garde tout', () => {
    expect(getAccessibleNavIds(superAdmin)).toHaveLength(9);
  });

  it('ne donne rien à un rôle inconnu', () => {
    expect(getAccessibleNavIds(fieldOnly)).toEqual([]);
    expect(getAccessibleNavIds(null)).toEqual([]);
  });
});

describe('canAccessPath', () => {
  it('ouvre tout au super_admin', () => {
    expect(canAccessPath(superAdmin, '/trash')).toBe(true);
    expect(canAccessPath(superAdmin, '/organisations')).toBe(true);
  });

  it('refuse trash et organisations à org_admin', () => {
    expect(canAccessPath(orgAdmin, '/trash')).toBe(false);
    expect(canAccessPath(orgAdmin, '/organisations')).toBe(false);
  });

  it('autorise les sous-chemins des routes permises', () => {
    expect(canAccessPath(orgAdmin, '/incidents/42')).toBe(true);
    expect(canAccessPath(orgAdmin, '/collaboration-detail/7')).toBe(true);
  });

  it('ne confond pas un préfixe avec un segment de chemin', () => {
    expect(canAccessPath(orgAdmin, '/incidents-archives')).toBe(false);
  });

  it('refuse tout à un rôle inconnu', () => {
    expect(canAccessPath(fieldOnly, '/dashboard')).toBe(false);
  });
});
```

- [ ] **Step 5 : Lancer les tests, vérifier qu'ils échouent**

Run : `npm test`
Expected : ÉCHEC — `Failed to resolve import "./permissions"`.

- [ ] **Step 6 : Commit**

```bash
git add package.json package-lock.json vitest.config.js src/utils/permissions.test.js
git commit -m "test: installer vitest et couvrir les règles d'accès"
```

---

### Task 2 : Centraliser les règles d'accès sur `web_role`

**Files:**
- Create: `src/utils/permissions.js`
- Modify: `src/components/auth/ProtectedRoute.jsx:19-58`
- Modify: `src/components/layout/Sidebar.jsx:94-104`
- Modify: `src/pages/incident/components/IncidentList/IncidentList.jsx:67-69`

**Interfaces:**
- Consomme : `npm test` de la Task 1, si elle a été faite.
- Produit :
  - `getAccessibleNavIds(user) -> string[]`
  - `canAccessPath(user, path) -> boolean`
  - `isSuperAdmin(user) -> boolean`
  - `isKnownWebRole(user) -> boolean`
  - `NAV_IDS` (constante exportée, tableau des 9 identifiants de menu)

- [ ] **Step 1 : Créer le module de permissions**

Créer `src/utils/permissions.js` :

```js
/**
 * Source unique de vérité pour les droits d'accès du dashboard.
 *
 * Règle : c'est `web_role` qui gouverne l'accès aux pages, jamais `org_role`.
 * `org_role` (org_admin | bureau_agent | field_agent) décrit la fonction dans
 * l'organisation — il sert aux libellés affichés et aux payloads d'invitation,
 * pas aux autorisations.
 */

const SUPER_ADMIN = 'super_admin';
const ORG_ADMIN = 'org_admin';
const BUREAU_AGENT = 'bureau_agent';

/** Rôles web autorisés à entrer dans l'application. */
export const ALLOWED_WEB_ROLES = [SUPER_ADMIN, ORG_ADMIN, BUREAU_AGENT];

/** Tous les identifiants de menu, dans l'ordre d'affichage de la sidebar. */
export const NAV_IDS = [
  'dashboard',
  'collaboration',
  'incidents',
  'mes-interventions',
  'organisations',
  'agents',
  'impact',
  'profile',
  'trash',
];

/** Menu réduit : org_admin et bureau_agent. Ni organisations, ni corbeille. */
const RESTRICTED_NAV_IDS = [
  'dashboard',
  'collaboration',
  'incidents',
  'mes-interventions',
  'agents',
  'impact',
  'profile',
];

/** Chemins ouverts à org_admin et bureau_agent. */
const RESTRICTED_PATHS = [
  '/dashboard',
  '/collaboration',
  '/collaboration-detail',
  '/incidents',
  '/mes-interventions',
  '/agents',
  '/profile',
  '/impact',
];

const getWebRole = (user) => user?.web_role ?? null;

export const isSuperAdmin = (user) => getWebRole(user) === SUPER_ADMIN;

export const isKnownWebRole = (user) => ALLOWED_WEB_ROLES.includes(getWebRole(user));

/**
 * Identifiants de menu visibles pour cet utilisateur.
 * @returns {string[]} vide si le rôle est inconnu
 */
export const getAccessibleNavIds = (user) => {
  if (!isKnownWebRole(user)) return [];
  return isSuperAdmin(user) ? NAV_IDS : RESTRICTED_NAV_IDS;
};

/**
 * Cet utilisateur peut-il ouvrir ce chemin ?
 * La comparaison se fait par segment : '/incidents-archives' ne passe pas
 * pour une autorisation sur '/incidents'.
 */
export const canAccessPath = (user, path) => {
  if (!isKnownWebRole(user)) return false;
  if (isSuperAdmin(user)) return true;
  return RESTRICTED_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`)
  );
};
```

- [ ] **Step 2 : Lancer les tests (si Task 1 faite), vérifier qu'ils passent**

Run : `npm test`
Expected : SUCCÈS — 12 tests passent.

Si la Task 1 a été écartée, passer directement au Step 3.

- [ ] **Step 3 : Brancher `ProtectedRoute` sur le module**

Dans `src/components/auth/ProtectedRoute.jsx`, ajouter l'import en tête de fichier :

```js
import { canAccessPath, isKnownWebRole } from '../../utils/permissions';
```

Puis remplacer tout le bloc des lignes 19 à 58 (de `const user = authService.getCurrentUser();` jusqu'à `sessionStorage.setItem('last_safe_path', currentPath);` inclus) par :

```js
  const user = authService.getCurrentUser();

  // Un rôle web non reconnu n'a rien à faire dans le dashboard.
  if (!isKnownWebRole(user)) {
    console.warn(`[ProtectedRoute] Accès refusé : web_role "${user?.web_role}" non autorisé.`);
    authService.logout();
    return (
      <Navigate
        to="/login"
        state={{ error: "Vous n'avez pas l'autorisation d'accéder à cette application." }}
        replace
      />
    );
  }

  const currentPath = location.pathname;

  if (!canAccessPath(user, currentPath)) {
    const lastSafePath = sessionStorage.getItem('last_safe_path') || '/dashboard';
    console.warn(`[ProtectedRoute] Accès refusé à ${currentPath}. Redirection vers ${lastSafePath}`);
    return <Navigate to={lastSafePath} replace />;
  }

  sessionStorage.setItem('last_safe_path', currentPath);
```

- [ ] **Step 4 : Brancher la Sidebar sur le module**

Dans `src/components/layout/Sidebar.jsx`, ajouter l'import :

```js
import { getAccessibleNavIds } from '../../utils/permissions';
```

Puis remplacer les lignes 94 à 104 (de `const user = authService.getCurrentUser();` jusqu'à la fin du `useMemo`) par :

```js
  const user = authService.getCurrentUser();

  const filteredNavItems = useMemo(() => {
    const allowedIds = getAccessibleNavIds(user);
    return navItems.filter((item) => allowedIds.includes(item.id));
  }, [user?.web_role]);
```

Note : la dépendance est `user?.web_role` et non `user`, car `getCurrentUser()` renvoie un objet fraîchement parsé à chaque rendu — passer `user` relancerait le calcul en permanence.

- [ ] **Step 5 : Brancher `IncidentList` sur le module**

Dans `src/pages/incident/components/IncidentList/IncidentList.jsx`, ajouter l'import :

```js
import { isSuperAdmin as checkSuperAdmin, getAccessibleNavIds } from '../../../../utils/permissions';
```

Puis remplacer les lignes 67 à 69 :

```js
  const isSuperAdmin = user?.web_role === 'super_admin';
  const orgRole = isSuperAdmin ? 'super_admin' : user?.org_role;
  const isAdmin = orgRole === 'org_admin' || orgRole === 'bureau_agent';
```

par :

```js
  const isSuperAdmin = checkSuperAdmin(user);
  // « admin » ici = peut piloter les incidents sans être super_admin.
  const isAdmin = !isSuperAdmin && getAccessibleNavIds(user).includes('incidents');
```

- [ ] **Step 6 : Vérifier qu'aucune décision d'accès ne lit plus `org_role`**

Run :
```bash
grep -rn "org_role" src/components/ src/pages/incident/components/IncidentList/
```
Expected : aucun résultat.

Run :
```bash
grep -rn "org_role" src/ | grep -v node_modules
```
Expected : uniquement des libellés d'affichage (`Agents.jsx`, `Profile.jsx`, les modales d'assignation) et des payloads de service. Aucune ligne ne décide d'un accès à une page.

- [ ] **Step 7 : Vérifier le build et le lint**

Run : `npm run build`
Expected : SUCCÈS, aucune erreur d'import.

Run : `npm run lint`
Expected : aucune nouvelle erreur par rapport à l'état de départ de la branche.

- [ ] **Step 8 : Commit**

```bash
git add src/utils/permissions.js src/components/auth/ProtectedRoute.jsx src/components/layout/Sidebar.jsx src/pages/incident/components/IncidentList/IncidentList.jsx
git commit -m "refactor(auth): centraliser les règles d'accès sur web_role"
```

---

### Task 3 : Supprimer les fuites de credentials

**Files:**
- Modify: `src/pages/auth/services/authService.js:27-28`, `:44`

**Interfaces:**
- Consomme : rien.
- Produit : rien.

- [ ] **Step 1 : Constater la fuite**

Run :
```bash
grep -n "password\|access.substring" src/pages/auth/services/authService.js
```
Expected : la ligne 27 contient `password: credentials.password` dans un `console.log`, la ligne 44 logue un fragment du token.

- [ ] **Step 2 : Supprimer les trois lignes**

Dans `src/pages/auth/services/authService.js`, supprimer :

```js
      console.log('[AUTH] Tentative de connexion avec:', { email: credentials.email, password: credentials.password });
      console.log('[AUTH] API URL:', `${API_URL}/MapApi/login/`);
```

et :

```js
      console.log('[AUTH] Token reçu, récupération user avec:', access.substring(0, 20) + '...');
```

Conserver tous les `console.error` des blocs `catch` : ils ne contiennent aucun secret et servent au diagnostic.

- [ ] **Step 3 : Vérifier**

Run :
```bash
grep -n "console.log" src/pages/auth/services/authService.js
```
Expected : aucune occurrence ne mentionne `password`, `access` ou `refresh`.

- [ ] **Step 4 : Commit**

```bash
git add src/pages/auth/services/authService.js
git commit -m "fix(auth): supprimer les logs de mot de passe et de token"
```

---

### Task 4 : Intercepteur 401 avec rafraîchissement de token

**Files:**
- Modify: `src/pages/auth/services/authService.js:242-251`

**Interfaces:**
- Consomme : `authService.refreshToken()`, `authService.logout()`, déjà présents dans le fichier.
- Produit : toute instance issue de `createAuthenticatedAxios()` rejoue automatiquement une requête après un 401.

- [ ] **Step 1 : Ajouter la promesse de refresh partagée**

Dans `src/pages/auth/services/authService.js`, juste après la déclaration `const API_URL = API_URL_BASE;` (ligne 5), insérer :

```js
// Une seule opération de refresh à la fois. Sans ce verrou, dix requêtes qui
// prennent un 401 en même temps déclencheraient dix POST /token/refresh/,
// et les derniers échoueraient avec un refresh token déjà consommé.
let refreshPromise = null;

// Ces routes ne doivent jamais déclencher de rejeu : un 401 y est une réponse
// métier légitime, et rejouer créerait une boucle infinie.
const NO_RETRY_PATHS = ['/MapApi/login/', '/MapApi/token/refresh/'];
```

- [ ] **Step 2 : Remplacer `createAuthenticatedAxios`**

Remplacer intégralement la méthode `createAuthenticatedAxios` (lignes 242 à 251) par :

```js
  createAuthenticatedAxios: () => {
    const token = authService.getAccessToken();
    const instance = axios.create({
      baseURL: API_URL,
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        const status = error.response?.status;

        const isRetryable =
          status === 401 &&
          original &&
          !original._retry &&
          !NO_RETRY_PATHS.some((path) => (original.url || '').includes(path));

        if (!isRetryable) {
          return Promise.reject(error);
        }

        original._retry = true;

        // Les requêtes concurrentes s'abonnent au refresh en cours
        // au lieu d'en démarrer chacune un nouveau.
        if (!refreshPromise) {
          refreshPromise = authService.refreshToken().finally(() => {
            refreshPromise = null;
          });
        }

        const newToken = await refreshPromise;

        if (!newToken) {
          // refreshToken() a déjà appelé logout() en cas d'échec.
          window.location.assign('/login');
          return Promise.reject(error);
        }

        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return instance(original);
      }
    );

    return instance;
  },
```

- [ ] **Step 3 : Vérifier le build**

Run : `npm run build`
Expected : SUCCÈS.

- [ ] **Step 4 : Vérifier le comportement dans le navigateur**

Dans l'onglet Chrome déjà authentifié sur `localhost` :

1. Ouvrir la console, exécuter `sessionStorage.setItem('access_token', 'jeton-invalide')`.
2. Ouvrir l'onglet Réseau, filtrer sur `MapApi`.
3. Naviguer vers `/incidents`.

Expected : une requête en 401, **exactement un** `POST /MapApi/token/refresh/`, puis le rejeu réussi de la requête d'origine en 200. La liste des incidents s'affiche. Aucune boucle de requêtes.

Si le refresh token est lui aussi expiré, le résultat attendu est une redirection vers `/login` — pas une boucle.

- [ ] **Step 5 : Commit**

```bash
git add src/pages/auth/services/authService.js
git commit -m "fix(auth): rafraîchir le token sur 401 avec garde anti-ruée"
```

---

### Task 5 : Supprimer le code mort

**Files:**
- Delete: `src/pages/collaboration-requests/data/requests.js` (528 l.)
- Delete: `src/pages/impact/data/impacts.js` (268 l.)
- Delete: `src/pages/collaboration/data/collaborations.js` (225 l.)
- Delete: `src/pages/incident/data/incidents.js` (206 l.)
- Delete: `src/pages/trash/data/trashedIncidents.js` (137 l.)
- Delete: `src/pages/collaboration/components/CollaborationDetail.jsx` (659 l.)
- Delete: `src/pages/collaboration/components/collaboration-detail.css`

**Interfaces:**
- Consomme : rien.
- Produit : rien.

**À ne pas toucher.** `src/pages/agents/data/agents.js` et `src/pages/organisations/data/organisations.js` ne sont pas des mocks : ce sont des constantes de configuration (`ROLES`, `AVATAR_COLORS`, `SECTORS`, `TYPES`, `COUNTRIES`) importées par cinq fichiers.

- [ ] **Step 1 : Reconfirmer que rien n'importe ces fichiers**

Run :
```bash
cd src && for n in incidents impacts collaborations requests trashedIncidents; do
  echo -n "$n : "; grep -rl "data/$n" . | tr '\n' ' '; echo "(vide = mort)"
done
grep -rn "components/CollaborationDetail" .
```
Expected : chaque ligne se termine par `(vide = mort)` sans fichier listé, et le dernier `grep` ne renvoie rien.

Si un fichier apparaît, **arrêter** et signaler : le fichier n'est pas mort, le plan doit être révisé.

- [ ] **Step 2 : Supprimer**

```bash
git rm src/pages/collaboration-requests/data/requests.js \
       src/pages/impact/data/impacts.js \
       src/pages/collaboration/data/collaborations.js \
       src/pages/incident/data/incidents.js \
       src/pages/trash/data/trashedIncidents.js \
       src/pages/collaboration/components/CollaborationDetail.jsx \
       src/pages/collaboration/components/collaboration-detail.css
```

- [ ] **Step 3 : Vérifier que rien ne casse**

Run : `npm run build`
Expected : SUCCÈS, aucune erreur de résolution de module.

Run : `npm run lint`
Expected : aucune nouvelle erreur.

- [ ] **Step 4 : Vérifier les pages concernées dans le navigateur**

Recharger `/collaboration`, `/impact`, `/incidents`, `/trash`.
Expected : les quatre pages s'affichent normalement, avec leurs données réelles issues de l'API.

- [ ] **Step 5 : Commit**

```bash
git commit -m "chore: supprimer les mocks inutilisés et le composant collaboration orphelin"
```

---

### Task 6 : Mesurer les performances

Aucune modification de code. Le livrable est un tableau de mesures qui déterminera le contenu de la Task 7.

**Files:**
- Create: `docs/superpowers/plans/2026-07-26-mesures-perf.md`

**Interfaces:**
- Consomme : session Chrome authentifiée sur `localhost`, fournie par l'utilisateur.
- Produit : le tableau de mesures et l'ordre de priorité de la Task 7.

- [ ] **Step 1 : Relever la réponse de `user_retrieve`**

Dans l'onglet Réseau, recharger l'application et ouvrir la réponse de `/MapApi/user_retrieve/`.
Noter la valeur exacte de `web_role` et celle d'`org_role`.

Ce relevé tranche le point 1.4 du spec : les trois orthographes testées dans `Agents.jsx` (`'bureau_agent'`, `'bureau'`, `'agent_de_bureau'`, lignes 214, 240, 512, 523).

- [ ] **Step 2 : Vérifier la non-régression du menu (risque n°1 du spec)**

Le passage de `org_role` à `web_role` pour la Sidebar peut changer ce que voient
des utilisateurs réels. Avec la valeur de `web_role` relevée au Step 1, comparer
le menu affiché à ce qu'il devait être avant le changement.

Dans la console du navigateur :

```js
JSON.parse(sessionStorage.getItem('user'))
```

Relever `web_role` et `org_role`. Puis compter les entrées visibles dans la
sidebar.

Expected :
- `web_role: 'super_admin'` → 9 entrées, y compris Organisations et Corbeille.
- `web_role: 'org_admin'` ou `'bureau_agent'` → 7 entrées, sans Organisations ni Corbeille.

Si `web_role` et `org_role` diffèrent sur ce compte, c'est précisément le cas que
la Task 2 corrige : le noter dans le document de mesures comme confirmation du
bug d'origine.

- [ ] **Step 3 : Mesurer les quatre pages**

Pour chacune de `/mes-interventions`, `/impact`, `/incidents`, `/incidents/:id` :

1. Vider le cache réseau, filtrer sur `MapApi`.
2. Naviguer vers la page.
3. Relever : nombre de requêtes XHR, durée jusqu'au dernier octet, requête la plus lente, taille totale transférée.

- [ ] **Step 4 : Consigner les mesures**

Créer `docs/superpowers/plans/2026-07-26-mesures-perf.md` avec ce tableau rempli :

```markdown
| Page | Nb requêtes | Durée totale | Requête la plus lente | Taille |
|---|---|---|---|---|
| /mes-interventions | | | | |
| /impact | | | | |
| /incidents | | | | |
| /incidents/:id | | | | |

## Verdict par hypothèse

- H1 (N+1 MesInterventions) : confirmée / infirmée — justification chiffrée
- H2 (JSON.stringify Impact) : confirmée / infirmée — justification chiffrée
- H3 (fetcher 'collaborations') : confirmée / infirmée — justification chiffrée
- H4 (page_size surdimensionnés) : confirmée / infirmée — justification chiffrée

## Valeurs réelles des rôles

- web_role : ...
- org_role : ...

## Ordre de correction retenu
```

- [ ] **Step 5 : Commit**

```bash
git add docs/superpowers/plans/2026-07-26-mesures-perf.md
git commit -m "docs: mesures de performance des pages du dashboard"
```

---

### Task 7 : Corriger les lenteurs confirmées

**Le contenu exact de cette tâche dépend de la Task 6.** Ne corriger que les hypothèses que la mesure a confirmées comme coûteuses — c'est le principe retenu au brainstorm. Les correctifs ci-dessous sont préparés mais conditionnels.

**Files (selon verdicts) :**
- Si H1 : `src/pages/mes-interventions/MesInterventions.jsx:108-118`, `:473`
- Si H2 : `src/pages/impact/Impact.jsx:118-150`
- Si H3 : `src/pages/incident/components/IncidentDetail/IncidentDetail.jsx:254-262` et `src/pages/incident/components/IncidentList/IncidentList.jsx:74-77`
- Si H4 : `src/pages/organisations/service/organisation_service.jsx:33`, `src/pages/incident/service/incident_service.jsx:25`
- Toujours : `src/pages/agents/Agents.jsx` (point 1.4, tranché par le Step 1 de la Task 6)

**Interfaces:**
- Consomme : les verdicts de `docs/superpowers/plans/2026-07-26-mesures-perf.md`.
- Produit : rien.

- [ ] **Step 1 : Si H2 confirmée — supprimer les sérialisations bloquantes**

C'est le correctif le moins risqué : ces deux `useEffect` ne font que du log.

Dans `src/pages/impact/Impact.jsx`, supprimer les deux blocs `useEffect` des lignes 118 à 150 (celui qui logue `globalImpactData` et celui qui logue `impactIncidentsData`). Ils appellent `JSON.stringify(data, null, 2)` à chaque changement de données, en production.

Conserver la remontée d'erreur en la réduisant à :

```js
  useEffect(() => {
    if (apiError) console.error('[Impact] Erreur API impact:', apiError);
    if (incidentsError) console.error('[Impact] Erreur API incidents:', incidentsError);
  }, [apiError, incidentsError]);
```

Vérifier : recharger `/impact`, la console ne déverse plus le payload complet.

- [ ] **Step 2 : Si H3 confirmée — corriger le fetcher `collaborations`**

`useSWR('collaborations', getCollaborationsService)` passe la clé au fetcher. Le service reçoit donc la chaîne `'collaborations'` comme objet de paramètres et l'étale : `params: { scope: 'self', ...'collaborations' }` produit treize paramètres parasites indexés (`0=c`, `1=o`, …).

Dans `src/pages/incident/components/IncidentDetail/IncidentDetail.jsx` ligne 254, et dans `src/pages/incident/components/IncidentList/IncidentList.jsx` ligne 74, remplacer :

```js
  useSWR('collaborations', getCollaborationsService, { /* options */ })
```

par :

```js
  useSWR('collaborations', () => getCollaborationsService(), { /* options */ })
```

Conserver les options existantes de chaque site d'appel telles quelles.

Vérifier dans l'onglet Réseau : l'URL de `/MapApi/collaborations/dashboard/` ne porte plus que `scope=self`.

- [ ] **Step 3 : Si H1 confirmée — supprimer le N+1 de « Mes interventions »**

`MesInterventions.jsx:473` rend `<IncidentAgentsStack incident={incident} />` dans le `.map()` de la liste, et chaque instance porte son propre `useSWR` (ligne 110). Une requête par ligne affichée.

Correctif : remonter la récupération au niveau de la liste, avec un seul `useSWR` qui agrège les assignations de tous les incidents affichés via `Promise.all`, puis passer le résultat aux lignes en prop. `IncidentAgentsStack` devient un composant purement présentationnel recevant `assignments`.

Le détail de l'implémentation dépend de la structure exacte relevée à la Task 6 : si l'API expose un endpoint acceptant plusieurs identifiants d'incident, le préférer à `Promise.all`. Vérifier ce point dans les relevés avant d'écrire le code.

Vérifier : le nombre de requêtes sur `/mes-interventions` passe de N+1 à la valeur mesurée attendue, et les avatars s'affichent toujours correctement.

- [ ] **Step 4 : Si H4 confirmée — ajuster les tailles de page**

`organisation_service.jsx:33` demande `page_size=1000`, `incident_service.jsx:25` demande `page_size=100`. Aligner sur ce que l'écran affiche réellement, valeur déterminée par les tailles de payload mesurées.

- [ ] **Step 5 : Normaliser les orthographes de `web_role` dans `Agents.jsx`**

Avec la valeur réelle relevée au Step 1 de la Task 6, remplacer les quatre occurrences de :

```js
currentUser?.web_role === 'bureau_agent' || currentUser?.web_role === 'bureau' || currentUser?.web_role === 'agent_de_bureau'
```

(lignes 214, 240, 512, 523) par un appel au module de permissions ou par la seule valeur confirmée. Ne procéder que si le relevé est sans ambiguïté.

- [ ] **Step 6 : Vérifier globalement**

Run : `npm run build`
Expected : SUCCÈS.

Reprendre les mesures de la Task 6 sur les pages corrigées et comparer au tableau initial.

- [ ] **Step 7 : Commit**

```bash
git add -A
git commit -m "perf: <intitulé reflétant les corrections effectivement retenues>"
```

---

## Ordre d'exécution

Les tâches 1 à 5 ne dépendent d'aucune ressource externe et s'enchaînent directement.
Les tâches 6 et 7 requièrent la session Chrome authentifiée de l'utilisateur.

## Hors périmètre

- Découpage des trois gros composants (`CollaborationDetail` 3755 l., `IncidentDetail` 2425 l., `Collaboration` 1860 l.)
- Factorisation du code de reconnexion WebSocket, dupliqué six fois
- Extension de la couverture de test au-delà de `permissions.js`
- Nettoyage général des `console.log` hors credentials et hors Task 7
