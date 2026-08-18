# Dashboard Map Action Mali

Dashboard de gestion des actions humanitaires et environnementales au Mali.

## 🚀 Installation

```bash
npm install
```

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet (voir `.env.example`) :

```env
REACT_APP_MAPBOX_TOKEN=votre_token_mapbox_ici
```

**Obtenir un token Mapbox :**
1. Créez un compte gratuit sur [https://account.mapbox.com/](https://account.mapbox.com/)
2. Allez dans la section "Access tokens"
3. Copiez votre token public (commence par `pk.`)
4. Collez-le dans votre fichier `.env`

⚠️ **Important** : Ne commitez JAMAIS votre fichier `.env` avec un vrai token !

## 🏃 Démarrage

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📦 Build

```bash
npm run build
```

## 🛠️ Technologies

- React 18
- Vite
- Mapbox GL JS
- React Map GL
- Iconsax React
- React DatePicker

## 📄 Licence

Ce dépôt est distribué sous licence **AGPL-3.0** — voir le fichier
[LICENSE](./LICENSE) à la racine.

Copyright (C) 2026 Map Action Mali.

Les ressources non logicielles (logo, images, sons) appartiennent à
Map Action Mali et ne sont pas couvertes par l'AGPL-3.0 : voir
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
