import React from 'react';
import { TickCircle, Danger, People, DocumentText, Camera, Warning2, InfoCircle, MessageText, Task, Archive } from 'iconsax-react';
import './activity-panel.css';

export const ActivityPanel = ({ activities: propActivities, isLoading, nextUrl, onLoadMore, isLoadingMore }) => {
  // Fonction pour obtenir l'icône selon le type d'activité
  const getActivityIcon = (type, severity) => {
    const iconProps = { size: 20, variant: "Bold" };

    switch (type) {
      case 'incident-taken':
        return <DocumentText {...iconProps} color="#3AA2DD" />;
      case 'incident-resolved':
        return <TickCircle {...iconProps} color="#22C55E" />;
      case 'collaboration':
        return <People {...iconProps} color="#F59E0B" />;
      case 'report':
        return <Camera {...iconProps} color="#3AA2DD" />;
      case 'alert':
        return <Danger {...iconProps} color="#EF4444" />;
      case 'warning':
        return <Warning2 {...iconProps} color="#F59E0B" />;
      case 'info':
        return <InfoCircle {...iconProps} color="#6C7278" />;
      case 'message':
        return <MessageText {...iconProps} color="#3AA2DD" />;
      case 'task':
        return <Task {...iconProps} color="#22C55E" />;
      case 'archive':
        return <Archive {...iconProps} color="#6C7278" />;
      default:
        return <InfoCircle {...iconProps} color="#6C7278" />;
    }
  };

  const formatTimeAgo = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      return '';
    }
  };

  const getSeverityFromAction = (action = '') => {
    const act = action.toLowerCase();
    if (act.includes('résolu') || act.includes('valide') || act.includes('accept')) return 'success';
    if (act.includes('refus') || act.includes('supprim') || act.includes('alert') || act.includes('danger')) return 'danger';
    if (act.includes('demand') || act.includes('invit') || act.includes('propos') || act.includes('warning')) return 'warning';
    return 'info';
  };

  const getTypeFromAction = (action = '') => {
    const act = action.toLowerCase();
    if (act.includes('pris en compte') || act.includes('charge')) return 'incident-taken';
    if (act.includes('résolu') || act.includes('clôt')) return 'incident-resolved';
    if (act.includes('collab') || act.includes('organis')) return 'collaboration';
    if (act.includes('rapport') || act.includes('terrain') || act.includes('photo')) return 'report';
    if (act.includes('tâche') || act.includes('valid')) return 'task';
    if (act.includes('alert') || act.includes('danger')) return 'alert';
    return 'info';
  };



  const activities = (propActivities || []).map((act) => {
    return {
      id: act.id,
      type: getTypeFromAction(act.action || ''),
      title: act.actor || act.user_name || act.organisation_name || '',
      description: act.action || '',
      time: formatTimeAgo(act.created_at || act.timeStamp),
      severity: getSeverityFromAction(act.action || ''),
      unread: false
    };
  });

  const unreadCount = activities.filter(a => a.unread).length;

  return (
    <div className="activity-panel">
      <div className="activity-header">
        <div className="activity-header-top">
          <h3 className="activity-title">
            Activité en temps réel
            <span className="live-indicator">
              <span className="live-dot"></span>
            </span>
          </h3>
          {unreadCount > 0 && (
            <span className="activity-unread-badge">{unreadCount} non lues</span>
          )}
        </div>
        <p className="activity-subtitle">Dernières mises à jour des flux</p>
      </div>

      <div className="activity-list">
        {isLoading ? (
          <div className="d-flex flex-column align-items-center justify-content-center p-4 text-center">
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
            <span className="text-muted mt-2" style={{ fontSize: '11px' }}>Chargement du flux...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center p-4 text-muted" style={{ fontSize: '12px' }}>
            Aucune activité récente.
          </div>
        ) : (
          <>
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`activity-item activity-${activity.severity} ${activity.unread ? 'unread' : ''}`}
              >
                <div className="activity-icon-wrapper">
                  {getActivityIcon(activity.type, activity.severity)}
                </div>
                <div className="activity-content">
                  <p className="activity-text">
                    <strong>{activity.title}</strong> {activity.description}
                  </p>
                  <span className="activity-time">{activity.time}</span>
                </div>
                {/* {activity.unread && <div className="activity-unread-dot"></div>} */}
              </div>
            ))}

            {nextUrl && (
              <div className="d-flex justify-content-center mt-3 mb-2">
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}

                >
                  {isLoadingMore ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" style={{ width: '10px', height: '10px' }} />
                      Chargement...
                    </>
                  ) : (
                    'Afficher plus'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityPanel;
