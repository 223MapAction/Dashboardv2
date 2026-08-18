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

## 📄 License

Propriétaire - Map Action Mali
