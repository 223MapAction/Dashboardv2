# Dashboard Page - Sentinelle Environnementale

Page principale du dashboard avec vue d'ensemble des données environnementales.

## 📦 Composants

### MetricsCards
Cartes de métriques principales affichant les KPIs.

**Données affichées:**
- Total des alertes: 1 284
- Réponses actives: 42
- Audit IA en attente: 15

**Fichiers:**
- `components/MetricsCards.jsx`
- `components/metrics-cards.css`

---

### MapSection
Section de carte interactive avec badge de localisation.

**Features:**
- Badge "DIRECT: BAMAKO"
- Placeholder pour carte OSM/Leaflet
- Gradient de fond avec grille
- Responsive (300px → 500px)

**Fichiers:**
- `components/MapSection.jsx`
- `components/map-section.css`

---

### StatsWidgets
Trois widgets de statistiques côte à côte.

**Widgets:**
1. **Par Localité** - Top 5 des communes
2. **Top 5 Incidents** - Barres de progression
3. **Gravité** - Graphique en donut

**Fichiers:**
- `components/StatsWidgets.jsx`
- `components/stats-widgets.css`

---

### ActivityPanel
Panneau d'activité en temps réel avec indicateur live.

**Features:**
- Indicateur "live" animé
- 5 activités récentes avec icônes emoji
- Codes couleur par sévérité (info, success, warning, danger)
- Bouton "VOIR TOUT L'HISTORIQUE"
- Scroll vertical si > 5 items

**Fichiers:**
- `components/ActivityPanel.jsx`
- `components/activity-panel.css`

---

## 🎨 Layout Responsive

### Mobile (< 768px)
```
┌─────────────────┐
│  MetricsCards   │ (1 colonne)
├─────────────────┤
│   MapSection    │
├─────────────────┤
│  StatsWidgets   │ (1 colonne)
├─────────────────┤
│ ActivityPanel   │
└─────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────┐
│    MetricsCards (3)     │
├─────────────────────────┤
│      MapSection         │
├─────────────────────────┤
│  StatsWidgets (2-3)     │
├─────────────────────────┤
│    ActivityPanel        │
└─────────────────────────┘
```

### Desktop (≥ 1024px)
```
┌──────────────────┬──────────┐
│ MetricsCards (3) │          │
├──────────────────┤          │
│   MapSection     │ Activity │
├──────────────────┤  Panel   │
│  StatsWidgets    │          │
│    (3 cols)      │          │
└──────────────────┴──────────┘
     2fr              1fr
```

---

## 🎨 Palette de Couleurs

### Métriques
- **Primary:** `#164E63` (Cyan 900)
- **Success:** `#22C55E` (Green 500)
- **Warning:** `#F59E0B` (Amber 500)

### Activités
- **Info:** Bleu cyan
- **Success:** Vert
- **Warning:** Orange
- **Danger:** Rouge

### Carte
- Gradient rouge-orange (simulation heatmap)
- Grille jaune semi-transparente

---

## 📊 Données Mockées

### Localités
- Commune IV: 342
- Commune I: 215
- Kati: 189
- Ségou: 156
- Kayes: 124

### Top Incidents
- DÉFORESTATION: 42%
- POLLUTION EAU: 28%
- INCENDIE: 15%

### Gravité
- Critique: 12%
- Grave: 23%
- Modéré: 65%

---

## 🔄 Prochaines Étapes

1. **Intégration Leaflet/OSM**
   - Remplacer le placeholder par une vraie carte
   - Ajouter des markers pour les incidents
   - Heatmap des zones critiques

2. **Données Réelles**
   - Connexion API backend
   - WebSocket pour activités temps réel
   - Mise à jour automatique des métriques

3. **Interactions**
   - Clic sur localité → filtre carte
   - Clic sur incident → détails
   - Clic sur activité → modal détails

4. **Graphiques**
   - Chart.js ou Recharts pour donut interactif
   - Sparklines pour tendances
   - Graphiques temporels

---

## 💡 Utilisation

```jsx
import { Dashboard } from './pages/dashboard';

<Dashboard 
  user={{ name: 'John Doe', avatar: '/avatar.jpg' }}
  onLogout={() => console.log('Logout')}
/>
```

Tous les composants sont **mobile-first** et **responsive** par défaut.
