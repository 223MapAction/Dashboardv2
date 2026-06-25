import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Setting2, LogoutCurve, ArrowDown2, Notification, Danger, People, InfoCircle } from 'iconsax-react';
import logoMapActionMin from '../../assets/logo-min.svg';
import { authService } from '../../pages/auth/services/authService';
import { getNotifications, markNotificationAsRead } from './service/notification_service';
import { BlurryImage } from '../atoms/BlurryImage';
import './header.css';

export const Header = ({ onMenuToggle, user }) => {
  const navigate = useNavigate();
  const currentUser = user || authService.getCurrentUser();
  const [activeLanguage, setActiveLanguage] = useState('Français');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const languages = ['Bambara', 'Fulfulde', 'Français'];

  // Charger les notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoadingNotifications(true);
        const data = await getNotifications();
        console.log('[HEADER] Notifications chargées:', data);
        setNotifications(data);
      } catch (error) {
        console.error('[HEADER] Erreur chargement notifications:', error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Formater le temps relatif
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  // Marquer une notification comme lue
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      } catch (error) {
        console.error('[HEADER] Erreur marquage notification:', error);
      }
    }
  };

  // Fonction pour obtenir l'icône (toutes les notifs sont de type collaboration)
  const getNotificationIcon = () => {
    return <People size={20} variant="Bold" color="#3AA2DD" />;
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="menu-toggle btn btn-icon"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>


      </div>

      <div className="header-right">


        <div className="notification-dropdown">
          <button
            className="btn btn-icon notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Notification size={24} variant="Outline" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-menu">
              <div className="notification-menu-header">
                <h3>Notifications</h3>
                <span className="notification-count">{unreadCount} non lues</span>
              </div>

              <div className="notification-menu-divider"></div>

              <div className="notification-list">
                {isLoadingNotifications ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6C7278' }}>
                    Chargement...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6C7278' }}>
                    Aucune notification
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon()}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">Demande de collaboration</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{getRelativeTime(notification.created_at)}</div>
                      </div>
                      {!notification.read && <div className="notification-dot"></div>}
                    </div>
                  ))
                )}
              </div>

              <div className="notification-menu-divider"></div>

              <button className="notification-menu-footer">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>

        {currentUser && (
          <div className="profile-dropdown">
            <button
              className="header-profile"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="Menu profil"
            >
              {currentUser?.logo || currentUser?.logo_url ? (
                <BlurryImage
                  src={currentUser.logo || currentUser.logo_url}
                  alt="Logo"
                />
              ) : (
                <>
                  <div style={{ color: "white", fontWeight: "bold" }}>
                    {currentUser?.first_name?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <div className="header-profile-fallback" >
                    <User size={18} variant="Bold" style={{ fill: "white" }} />
                  </div>
                </>
              )}
            </button>

            {showProfileMenu && (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <div className="profile-name">{currentUser?.first_name || 'Utilisateur'}</div>
                  <div className="profile-email">{currentUser?.email}</div>
                </div>

                <div className="profile-menu-items">
                  <button
                    className="profile-menu-item"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                  >
                    <User size={18} variant="Outline" />
                    <span>Mon profil</span>
                  </button>



                  <button
                    className="profile-menu-item logout"
                    onClick={() => {
                      setShowProfileMenu(false);
                      authService.logout();
                      navigate('/login');
                    }}
                  >
                    <LogoutCurve size={18} variant="Outline" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
