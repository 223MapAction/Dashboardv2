import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../pages/auth/services/authService';
import { getAccessibleNavIds } from '../../utils/permissions';
import {
  Element4,
  Briefcase, Award, Trash, Buildings2, Profile2User, Lock1
} from 'iconsax-react';
import logoMapAction from '../../assets/logo.webp';
import logoMapActionMin from '../../assets/logo-min.webp';
import './sidebar.css';
import {
  User,          // Mon profil
  Setting2,      // Paramètres
  LogoutCurve,   // Déconnexion
  People as IconsaxPeople
} from 'iconsax-react';

export const Sidebar = ({ isOpen, onClose, isCollapsed: controlledCollapsed, onCollapsedChange, onToggleCollapse }) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const navigate = useNavigate();
  const location = useLocation();

  const handleToggleCollapsed = () => {
    const newCollapsedState = !isCollapsed;
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsedState);
    } else if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(newCollapsedState);
    }
  };
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Element4,
      path: '/dashboard'
    },
    {
      id: 'collaboration',
      label: 'Collaborations',
      icon: IconsaxPeople,
      path: '/collaboration'
    },
    {
      id: 'incidents',
      label: 'Signalements',
      icon: Briefcase,
      path: '/signalements'
    },
    {
      id: 'mes-interventions',
      label: 'Mes interventions',
      icon: Lock1,
      path: '/mes-interventions'
    },
    {
      id: 'organisations',
      label: 'Organisations',
      icon: Buildings2,
      path: '/organisations'
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: Profile2User,
      path: '/agents'
    },
    {
      id: 'impact',
      label: 'Impact',
      icon: Award,
      path: '/impact'
    },


    {
      id: 'profile',
      label: 'Mon profil',
      icon: User,
      path: '/profile'
    },
    {
      id: 'trash',
      label: 'Corbeille',
      icon: Trash,
      path: '/trash'
    }
  ];

  const user = authService.getCurrentUser();

  // Dépendance sur `user?.web_role` et non sur `user` : getCurrentUser() fait un
  // JSON.parse à chaque rendu et renvoie donc un objet neuf à chaque fois, ce
  // qui invaliderait le mémo en permanence.
  const filteredNavItems = useMemo(() => {
    const allowedIds = getAccessibleNavIds(user);
    return navItems.filter(item => allowedIds.includes(item.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.web_role]);

  const handleItemClick = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (path) => {
    const fromTab = location.state?.from;
    if (fromTab) {
      return path === fromTab;
    }
    if (location.pathname === path) return true;
    if (path !== '/' && location.pathname.startsWith(path + '/')) return true;
    if (path === '/collaboration' && location.pathname.startsWith('/collaboration-detail')) return true;
    // Garder mes-interventions actif si on vient de cette page vers collaboration-detail
    if (path === '/mes-interventions' && location.pathname.startsWith('/collaboration-detail') && fromTab === '/mes-interventions') return true;
    return false;
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Bouton Toggle Flottant - Au-dessus de tout */}
        <button
          className="sidebar-toggle-btn"
          onClick={() => {
            // Sur mobile: fermer l'overlay
            if (window.innerWidth < 1024) {
              onClose();
            } else {
              // Sur desktop: toggle collapsed state
              handleToggleCollapsed();
            }
          }}
          aria-label={isCollapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            {isCollapsed ? (
              <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>

        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {isCollapsed ? (
              <img src={logoMapActionMin} alt="Map Action" className="logo-image-min" />
            ) : (
              <img src={logoMapAction} alt="Map Action" className="logo-image" />
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" role="navigation">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleItemClick(item.path)}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <span className="sidebar-icon">
                <item.icon size={20} variant="Bold" />
              </span>
              <span className="sidebar-label">{item.label}</span>
            </button>
          ))}
        </nav>



      </aside>
    </>
  );
};

export default Sidebar;
