import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { User, Setting2, LogoutCurve, ArrowDown2, Notification, Danger, People, InfoCircle } from 'iconsax-react';
import logoMapActionMin from '../../assets/logo-min.svg';
import { authService } from '../../pages/auth/services/authService';
import { getNotifications, markNotificationAsRead } from './service/notification_service';
import { BlurryImage } from '../atoms/BlurryImage';
import { API_URL_BASE } from '../../config/api_url_base';
import './header.css';

export const Header = ({ onMenuToggle, user }) => {
  const navigate = useNavigate();
  const currentUser = user || authService.getCurrentUser();
  const [activeLanguage, setActiveLanguage] = useState('Français');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [nextNotificationsUrl, setNextNotificationsUrl] = useState(null);
  const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);
  const { data: notificationsData, isLoading: isLoadingNotifications, mutate: mutateNotifications } = useSWR(
    '/MapApi/notifications/?page_size=15',
    () => getNotifications(15),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 15000 // 15 seconds deduping
    }
  );

  const notifications = useMemo(() => {
    return notificationsData?.results || (Array.isArray(notificationsData) ? notificationsData : []);
  }, [notificationsData]);

  useEffect(() => {
    console.log('[NOTIFICATIONS] Liste actuelle des notifications:', notifications);
  }, [notifications]);

  // Synchroniser nextUrl quand les données SWR changent
  useEffect(() => {
    if (notificationsData && notificationsData.next !== undefined) {
      setNextNotificationsUrl(notificationsData.next);
    }
  }, [notificationsData]);

  // Écoute temps réel des notifications via WebSockets
  useEffect(() => {
    const wsBaseUrl = window.location.protocol === 'https:' || API_URL_BASE.startsWith('https')
      ? API_URL_BASE.replace(/^https/, 'wss')
      : API_URL_BASE.replace(/^http/, 'ws');
    const token = authService.getAccessToken();
    const query = token ? `?token=${token}` : '';

    let socket = null;
    let isCleanedUp = false;
    let delay = 3000;

    const shouldRetry = (code) => ![1000, 4001, 4003, 4004].includes(code);

    const connect = () => {
      if (isCleanedUp) return;
      socket = new WebSocket(`${wsBaseUrl}/ws/notifications/${query}`);

      socket.onopen = () => {
        delay = 3000;
        console.log('[WS-Notifications] Connecté aux notifications');
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS-Notifications] Message reçu en temps réel:', data);
          if (data.event === 'notification' || data.message) {
            const newNotification = {
              id: data.id || `notif-${Date.now()}`,
              title: data.title,
              type: data.type,
              incident_title: data.incident_title,
              message: data.message,
              read: data.read ?? false,
              link: data.link,
              created_at: data.created_at || new Date().toISOString()
            };

            mutateNotifications(prev => {
              const list = prev?.results || (Array.isArray(prev) ? prev : []);
              if (list.some(n => n.id === newNotification.id)) return prev;
              const sorted = [newNotification, ...list];
              return Array.isArray(prev) ? sorted : { ...prev, results: sorted };
            }, { revalidate: false });
          }
        } catch (e) {
          console.error('[WS-Notifications] Erreur parsing message:', e);
        }
      };
      socket.onerror = () => socket.close();
      socket.onclose = (e) => {
        if (!isCleanedUp && shouldRetry(e.code)) {
          setTimeout(connect, delay);
          delay = Math.min(delay * 2, 30000);
        }
      };
    };

    const handleBeforeUnload = () => {
      isCleanedUp = true;
      if (socket) {
        socket.close(1000, "Page unloading");
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    connect();

    return () => {
      isCleanedUp = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (socket) {
        socket.close(1000, "Component unmounting");
      }
    };
  }, [mutateNotifications]);

  const handleLoadMoreNotifications = async () => {
    if (!nextNotificationsUrl || isLoadingMoreNotifications) return;
    try {
      setIsLoadingMoreNotifications(true);
      const data = await getNotifications(nextNotificationsUrl);
      const results = data.results || [];
      
      mutateNotifications(prev => {
        const list = prev?.results || (Array.isArray(prev) ? prev : []);
        const merged = [...list];
        results.forEach(notif => {
          if (!merged.some(m => m.id === notif.id)) {
            merged.push(notif);
          }
        });
        const sorted = merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return Array.isArray(prev) ? sorted : { ...prev, results: sorted, next: data.next || null };
      }, { revalidate: false });

      setNextNotificationsUrl(data.next || null);
    } catch (error) {
      console.error('[HEADER] Erreur chargement notifications supplémentaires:', error);
    } finally {
      setIsLoadingMoreNotifications(false);
    }
  };

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

  const formatNotificationMessage = (msg) => {
    if (!msg) return '';
    return msg.replace(/L'organisation None/gi, "Une organisation");
  };

  // Marquer une notification comme lue et naviguer
  const handleNotificationClick = async (notification) => {
    let targetUrl = null;
    if (notification.link) {
      if (typeof notification.link === 'object') {
        targetUrl = notification.link.url;
      } else if (typeof notification.link === 'string') {
        try {
          const parsed = JSON.parse(notification.link);
          targetUrl = parsed.url;
        } catch (e) {
          if (notification.link.startsWith('/')) {
            targetUrl = notification.link;
          }
        }
      }
    }

    if (targetUrl) {
      navigate(targetUrl);
      setShowNotifications(false);
    }

    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        mutateNotifications(prev => {
          const list = prev?.results || (Array.isArray(prev) ? prev : []);
          const updated = list.map(n => n.id === notification.id ? { ...n, read: true } : n);
          return Array.isArray(prev) ? updated : { ...prev, results: updated };
        }, { revalidate: false });
      } catch (error) {
        console.error('[HEADER] Erreur marquage notification:', error);
      }
    }
  };

  // Fonction pour obtenir l'icône selon le type de notification
  const getNotificationIcon = (type) => {
    const iconProps = { size: 20, variant: "Bold" };
    switch (type) {
      case 'collaboration':
      case 'leader':
      case 'co-leader':
      case 'collaborator':
        return <People {...iconProps} color="#3AA2DD" />;
      case 'danger':
      case 'alert':
      case 'incident':
        return <Danger {...iconProps} color="#EF4444" />;
      default:
        return <InfoCircle {...iconProps} color="#F59E0B" />;
    }
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
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title || 'Notification'}</div>
                        <div className="notification-message">
                          {formatNotificationMessage(notification.message)}
                          {notification.incident_title && (
                            <span className="notification-incident-tag" style={{ display: 'block', fontSize: '10px', color: '#6C7278', marginTop: '2px', fontStyle: 'italic' }}>
                              Incident : {notification.incident_title}
                            </span>
                          )}
                        </div>
                        <div className="notification-time">{getRelativeTime(notification.created_at)}</div>
                      </div>
                      {!notification.read && <div className="notification-dot"></div>}
                    </div>
                  ))
                )}
              </div>

              {nextNotificationsUrl && (
                <>
                  <div className="notification-menu-divider"></div>
                  <button
                    className="notification-menu-footer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadMoreNotifications();
                    }}
                    disabled={isLoadingMoreNotifications}
                    style={{ width: '100%' }}
                  >
                    {isLoadingMoreNotifications ? 'Chargement...' : 'Charger plus'}
                  </button>
                </>
              )}
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
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Logo"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
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
                  {currentUser?.organisation_name && (
                    <div className="profile-org" style={{ fontSize: '13px', color: 'var(--color-primary)', marginTop: '4px', fontWeight: '500' }}>
                      {currentUser.organisation_name}
                    </div>
                  )}
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
