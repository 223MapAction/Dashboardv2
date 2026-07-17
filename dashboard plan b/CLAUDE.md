# Map Action — Résumé du projet & Guide d'utilisation

## 1. Qu'est-ce que Map Action ?

Map Action est une plateforme de gestion des incidents environnementaux et
humanitaires. Elle relie trois types d'acteurs :

- **Les citoyens** : signalent un incident (pollution, catastrophe, situation
  d'urgence...) sur le terrain.
- **Les agents de terrain** : se déplacent, interviennent sur les incidents
  qui leur sont assignés, et rapportent ce qu'ils ont fait.
- **Les organisations** : pilotent la réponse — elles reçoivent les
  signalements, invitent des partenaires, assignent les missions et suivent
  l'impact des interventions.

Ce dépôt contient le **tableau de bord web** (dashboard) utilisé par les
organisations et leurs équipes pour piloter cette réponse. C'est un dashboard
de gestion des actions humanitaires et environnementales au Mali.

## 2. Stack technique (pour toi, Racine)

- React 19 + Vite
- React Router v7 (`src/App.jsx`)
- Cartographie : Mapbox GL / MapLibre GL / react-map-gl
- Formulaires : react-hook-form + yup
- Données : axios + swr
- Graphiques : recharts

## 3. Les rôles (web_role)

L'accès aux pages est contrôlé par `src/components/auth/ProtectedRoute.jsx`
selon le champ `user.web_role` :

| Rôle | Description | Accès |
|---|---|---|
| `super_admin` | Administrateur global de la plateforme | Toutes les pages |
| `org_admin` | Responsable d'une organisation (ONG, structure) | Dashboard, collaboration, incidents, mes interventions, agents, profil, impact |
| `bureau_agent` | Agent de bureau rattaché à une organisation | Mêmes pages que org_admin |

> Note : les **agents de terrain** (souvent peu familiers avec l'informatique)
> n'utilisent en général pas ce dashboard web directement, mais une
> application mobile plus simple. Le dashboard sert surtout aux responsables
> d'organisation et agents de bureau qui pilotent, assignent et suivent.

## 4. Les grandes fonctionnalités (pages)

- **Dashboard** (`/dashboard`) — vue d'ensemble, carte des incidents.
- **Incidents** (`/incidents`) — liste et détail des signalements reçus.
- **Mes interventions** (`/mes-interventions`) — missions assignées à
  l'utilisateur connecté.
- **Collaboration** (`/collaboration`) — gestion des partenariats entre
  organisations.
- **Demandes de collaboration** (collaboration-requests) — invitations
  envoyées/reçues entre organisations.
- **Organisations** (`/organisations`) — gestion des organisations
  partenaires.
- **Agents** (`/agents`) — gestion des agents rattachés à une organisation
  (invitation, suppression...).
- **Impact** (`/impact`) — statistiques et indicateurs sur les interventions
  réalisées.
- **Suggestions** (suggest-request) — demandes/suggestions soumises.
- **Corbeille** (`/trash`) — éléments supprimés, récupérables.
- **Profil** (`/profile`) — informations du compte connecté.

## 5. Guide d'utilisation simplifié (pour les acteurs de terrain)

> **Objectif** : ce guide doit pouvoir être lu à voix haute ou suivi étape
> par étape par une personne peu familière avec un ordinateur. On utilise des
> phrases courtes, un vocabulaire simple, et on décrit chaque bouton par ce
> qu'il fait plutôt que par son nom technique.

### Avant de commencer

- Il faut un ordinateur ou un téléphone connecté à Internet.
- Il faut avoir reçu un identifiant (nom d'utilisateur) et un mot de passe
  de la part de son organisation.

### Étape 1 — Se connecter

1. Ouvrir l'application (le lien envoyé par l'organisation).
2. Taper son identifiant.
3. Taper son mot de passe.
4. Appuyer sur le bouton **"Se connecter"**.

*Si le mot de passe est oublié* : appuyer sur **"Mot de passe oublié"** et
suivre les instructions envoyées par message.

### Étape 2 — Voir les missions à faire

1. Une fois connecté, aller sur **"Mes interventions"**.
2. Chaque mission affichée est une intervention qui vous a été confiée.
3. Appuyer sur une mission pour voir les détails : le lieu, le problème
   signalé, ce qu'il faut faire.

### Étape 3 — Voir un incident sur la carte

1. Aller sur **"Dashboard"** ou **"Incidents"**.
2. La carte montre des points : chaque point est un incident signalé.
3. Appuyer sur un point pour voir les informations (lieu, description,
   photos si disponibles).

### Étape 4 — Faire un rapport après une intervention

1. Ouvrir la mission concernée dans **"Mes interventions"**.
2. Remplir ce qui est demandé (ce qui a été fait, l'état de la situation).
3. Appuyer sur **"Envoyer"** ou **"Valider"** pour confirmer.

### Conseils pratiques

- Toujours vérifier sa connexion Internet avant de commencer.
- En cas de doute sur un bouton, ne pas hésiter à demander de l'aide à un
  collègue ou au responsable de l'organisation avant d'appuyer.
- Se déconnecter (bouton profil) si l'appareil est partagé avec d'autres
  personnes.

---
*Ce fichier sert de mémoire de contexte pour Claude Code sur ce projet, et de
base pour créer un guide utilisateur illustré destiné aux acteurs de terrain.*
