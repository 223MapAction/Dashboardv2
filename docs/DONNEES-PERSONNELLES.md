# Données personnelles et visibilité

Ce document décrit ce que le dashboard manipule, qui peut le voir, et ce qui
relève de l'API. Il ne remplace pas une analyse d'impact (AIPD/DPIA), qui
reste à conduire par Map Action Mali.

## Ce que le dashboard n'est pas

Le dashboard est un **client**. Il ne possède pas de base de données et ne
conserve rien durablement : chaque donnée affichée vient de l'API Map Action
et disparaît à la fermeture de l'onglet.

Les règles de conservation, de suppression et d'accès côté serveur relèvent
donc de [`map-action-api`](https://github.com/223MapAction/map-action-api).

## Catégories de données affichées

| Donnée | Sensibilité | Où |
|---|---|---|
| Identité (nom, courriel, organisation) | Personnelle | Session, profil, agents |
| **Coordonnées GPS des signalements** | Peut localiser un lieu de vie ou une personne | Carte, détail d'un signalement |
| Photos et fichiers joints | Peuvent contenir des visages, des plaques, des lieux privés | Signalements, discussions, rapports |
| Messages de collaboration | Peuvent citer des tiers non consentants | Discussions |
| Rapports de terrain | Idem | Interventions |

Les **coordonnées GPS** méritent une attention particulière : croisées avec
la date et la catégorie d'un signalement, elles peuvent réidentifier la
personne qui a signalé.

## Stockage côté navigateur

Seuls les jetons d'authentification et le profil courant sont conservés, en
`sessionStorage` — effacé à la fermeture de l'onglet. La déconnexion vide
`sessionStorage` et le cache SWR
([`authService.js`](../src/pages/auth/services/authService.js)).

Aucune donnée métier n'est écrite sur le disque de l'utilisateur.

## Visibilité par rôle

L'accès aux pages est décidé par `web_role`, et par lui seul
([`permissions.js`](../src/utils/permissions.js)).

| Page | `super_admin` | `org_admin` / `bureau_agent` |
|---|---|---|
| Dashboard, signalements, collaboration, interventions, agents, impact, profil | oui | oui |
| **Organisations** (toutes les organisations) | oui | **non** |
| **Corbeille** (éléments supprimés) | oui | **non** |

Deux garde-fous :

- Un `web_role` **absent ou inconnu** n'obtient rien : l'utilisateur est
  déconnecté et renvoyé vers la page de connexion. Aucun rôle n'est attribué
  par défaut, et jamais `super_admin`.
- La comparaison des chemins se fait **par segment** : une autorisation sur
  `/signalements` n'ouvre pas `/signalements-archives`.

**Limite importante** : ces règles décident quelles *pages* s'affichent. Le
filtrage des *données* — quels signalements une organisation peut lire — est
appliqué par l'API. Le dashboard affiche ce que l'API renvoie pour le jeton
présenté. Un contrôle côté navigateur ne protège rien à lui seul.

## Journaux

Les journaux applicatifs sont **muets en production** et masquent mots de
passe, jetons, courriels, téléphones et coordonnées GPS en développement
([`logger.js`](../src/utils/logger.js)). Une erreur réseau est réduite à son
diagnostic, sans en-têtes d'autorisation ni corps de réponse.

La règle ESLint `no-console` interdit d'écrire directement dans la console.

## À compléter par Map Action Mali

- Base légale du traitement (consentement, intérêt légitime humanitaire…).
- Durées de conservation exactes, côté API.
- Procédure d'exercice des droits (accès, rectification, suppression).
- Politique de floutage ou de troncature des coordonnées GPS pour les
  signalements sensibles, si elle doit exister.
