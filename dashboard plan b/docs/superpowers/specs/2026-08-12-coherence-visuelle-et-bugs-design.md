# Cohérence visuelle & correction de bugs — Design

Date : 2026-08-12
Branche : `fix/design-responsive-accessibilite`

## Problème

Le dashboard possède déjà un design system (`src/index.css`) largement adopté
— 4364 `var(--…)` contre 338 couleurs en dur — et une passe accessibilité
documentée. Mais la couverture est incomplète, et les trous produisent des
incohérences visibles :

- **338 hex en dur**, dont des doublons de tokens (`#3aa2dd` = `--color-primary`)
  et des variantes sauvages (`#16a34a`, `#4ade80`, `#b91c1c`, `#f87171`) : le
  même « vert succès » n'a pas la même valeur selon la page.
- **~160 `font-size` en px hors échelle**, dont 41× 11px, 21× 10px, 5× 9px et
  du 10.5px. L'échelle s'arrête à 12px. Ces tailles sont illisibles sur un
  téléphone en plein soleil — le contexte des agents de terrain — et
  contredisent le travail de contraste déjà fait.
- **90 erreurs ESLint**, dont des `react-hooks/set-state-in-effect` (vrais
  risques de boucle de rendu / état désynchronisé) et beaucoup de variables
  mortes signalant du code à moitié refactorisé.
- **6 `<div onClick>`** non atteignables au clavier.
- **Fichiers hors gabarit** : `CollaborationDetail.jsx` (3740 l.),
  `IncidentDetail.jsx` (2429 l.). C'est la cause racine : personne ne peut
  tenir ces fichiers en tête, donc chaque ajout redivergе.

## Principe directeur

On ne redessine rien. Pas de nouvelle direction artistique, pas de nouveaux
composants. On rend cohérent ce qui existe déjà, en faisant converger le code
vers le design system qui est déjà là.

## Livraison — un commit par famille

L'ordre va du moins risqué au plus risqué, pour qu'une régression soit facile
à isoler par `git revert`.

### Commit 1 — Typographie sur l'échelle

Étendre l'échelle avec les paliers manquants, puis remplacer les `font-size`
en px.

Nouveaux tokens :

- `--font-size-micro: 11px` — plancher lisible, pour les badges et légendes
- `--font-size-title: 20px` — comble le trou entre `h3` (18) et `h2` (24)
- `--font-size-display: 36px` — au-dessus de `h1`, pour les chiffres héros

Correspondance appliquée :

| px trouvés | token |
|---|---|
| 9, 10, 10.5, 11, 11.5 | `--font-size-micro` (11px) |
| 12, 12.5 | `--font-size-caption` (12px) |
| 13, 13.5 | `--font-size-body-small` (13px) |
| 14 | `--font-size-body` (14px) |
| 15, 16 | `--font-size-body-large` (16px) |
| 18 | `--font-size-h3` (18px) |
| 20, 22 | `--font-size-title` (20px) |
| 24 | `--font-size-h2` (24px) |
| 28, 30, 32 | `--font-size-h1` (32px) |
| 34, 36 | `--font-size-display` (36px) |

Les tailles décoratives isolées (80px, 110px — page 404, chiffre géant) ne
sont pas une échelle et restent telles quelles.

**Effet visible et assumé** : remonter les 9/10px à 11px élargit certains
badges et resserre certains tableaux.

### Commit 2 — Couleurs sur les tokens

Les 338 hex, traités en trois cas :

- **hex identique à un token** → substitution mécanique
- **variante proche** (`#16a34a`, `#4ade80` vs `--color-success`) → collapse
  sur le token ; c'est précisément l'incohérence à supprimer
- **hex sans équivalent** (fonds pâles type `#fee2e2`) → création du token
  manquant (`--color-danger-surface`…) plutôt que de laisser du dur

`#fff` / `#ffffff` deviennent `--color-surface`.

**Effet visible et assumé** : la teinte de certains verts et rouges change.

### Commit 3 — Accessibilité

- les `<div onClick>` deviennent `<button>`, ou reçoivent
  `role` + `tabIndex` + `onKeyDown` quand la sémantique HTML l'impose
- `alt` descriptif sur les images porteuses de sens, `alt=""` sur les
  décoratives
- vérification que le focus reste visible après le commit 2

### Commit 4 — Bugs React

En deux temps :

1. **code mort** (variables et fonctions inutilisées) — mécanique, sans risque
2. **`set-state-in-effect` et dépendances de hooks** — examinés un par un,
   chacun étant un vrai changement de comportement

Aucun `eslint-disable` de complaisance. Un cas légitime est documenté en
commentaire avec sa raison.

### Commit 5 — Découpage des fichiers hors gabarit

Limité aux deux pires fichiers : `CollaborationDetail.jsx` et
`IncidentDetail.jsx`. **Extraction pure** — sortir des sous-composants et des
hooks sans modifier une ligne de logique.

Le CSS volumineux n'est pas découpé : une fois les tokens en place, le
découper n'apporte rien.

## Vérification

À chaque commit, et avant toute affirmation de succès :

- `npx eslint src` passe
- `npm run build` passe
- contrôle visuel des pages touchées sur le serveur de dev

Aucune affirmation de réussite sans la sortie de commande correspondante.

## Hors périmètre

- refonte graphique ou nouvelle identité visuelle
- nouveaux composants ou nouvelles fonctionnalités
- refactoring non lié aux incohérences listées ci-dessus
- découpage du CSS
