# Composants Layout - Réutilisables

Ces composants sont **partagés** et peuvent être utilisés dans toutes les pages de l'application.

## 📦 Composants Disponibles

### Header
Barre de navigation supérieure avec logo, sélecteur de langue, notifications et profil utilisateur.

**Props:**
- `onMenuToggle` (function) - Callback pour ouvrir/fermer le menu mobile
- `user` (object) - Informations utilisateur { name, avatar }

**Utilisation:**
```jsx
import { Header } from '../../components/layout';

<Header 
  onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
  user={{ name: 'John Doe', avatar: '/avatar.jpg' }}
/>
```

**Features:**
- ✅ Sélecteur de langue (Bambara, Fulfulde, Français)
- ✅ Badge de notifications
- ✅ Bouton paramètres
- ✅ Avatar utilisateur
- ✅ Responsive mobile-first
- ✅ Sticky header

---

### Sidebar
Navigation latérale avec icônes et labels.

**Props:**
- `isOpen` (boolean) - État ouvert/fermé
- `onClose` (function) - Callback pour fermer la sidebar
- `activeItem` (string) - ID de l'item actif
- `onItemClick` (function) - Callback au clic sur un item

**Utilisation:**
```jsx
import { Sidebar } from '../../components/layout';

<Sidebar 
  isOpen={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  activeItem="dashboard"
  onItemClick={(id) => setActiveNav(id)}
/>
```

**Features:**
- ✅ Navigation avec icônes
- ✅ État actif visuel
- ✅ Overlay mobile
- ✅ Mode compact desktop
- ✅ Mode étendu large desktop
- ✅ Avatar utilisateur en footer

---

## 🎨 Comportement Responsive

### Mobile (< 768px)
- **Header:** Logo + Menu hamburger + Notifications + Avatar
- **Sidebar:** Cachée par défaut, overlay au clic sur menu
- **Language selector:** Caché

### Tablet (768px - 1023px)
- **Header:** Logo + Language selector + Actions
- **Sidebar:** Overlay avec largeur 240px

### Desktop (1024px - 1279px)
- **Header:** Complet sans bouton menu
- **Sidebar:** Fixe, mode compact (80px, icônes seulement)

### Large Desktop (≥ 1280px)
- **Header:** Complet
- **Sidebar:** Fixe, mode étendu (240px, icônes + labels)

---

## 🎯 Items de Navigation

Les items par défaut dans la Sidebar :
1. **Dashboard** - Vue d'ensemble
2. **Utilisateurs** - Gestion des utilisateurs
3. **Téléchargements** - Centre de téléchargement
4. **Calendrier** - Planning et événements
5. **Alertes** - Notifications et alertes
6. **Rapports** - Génération de rapports

Pour personnaliser, modifier le tableau `navItems` dans `Sidebar.jsx`.

---

## 📝 Exemple Complet

```jsx
import { useState } from 'react';
import { Header, Sidebar } from '../../components/layout';

function MyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  
  const user = {
    name: 'John Doe',
    avatar: '/avatar.jpg'
  };

  return (
    <div className="page-layout">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeItem={activeNav}
        onItemClick={setActiveNav}
      />
      
      <div className="page-main">
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          user={user}
        />
        
        <main className="page-content">
          {/* Votre contenu ici */}
        </main>
      </div>
    </div>
  );
}
```

---

## 🎨 Personnalisation

### Modifier les Couleurs
Les composants utilisent les variables CSS du design system :
- `--color-primary` : Couleur principale
- `--color-surface` : Fond des composants
- `--color-border` : Bordures

### Ajouter des Items de Navigation
Modifier le tableau `navItems` dans `Sidebar.jsx` :
```jsx
const navItems = [
  {
    id: 'mon-item',
    label: 'Mon Item',
    icon: <svg>...</svg>
  },
  // ...
];
```

### Modifier les Langues
Modifier le tableau `languages` dans `Header.jsx` :
```jsx
const languages = ['Bambara', 'Fulfulde', 'Français', 'English'];
```
