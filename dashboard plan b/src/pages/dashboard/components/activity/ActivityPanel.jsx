import React from 'react';
import { TickCircle, Danger, People, DocumentText, Camera, Warning2, InfoCircle, MessageText, Task, Archive } from 'iconsax-react';
import './activity-panel.css';

export const ActivityPanel = () => {
  // Fonction pour obtenir l'icône selon le type d'activité
  const getActivityIcon = (type, severity) => {
    const iconProps = { size: 20, variant: "Bold" };
    
    switch(type) {
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

  const activities = [
    {
      id: 1,
      type: 'incident-taken',
      title: 'La mairie de la commune IV',
      description: 'a pris en compte un incident.',
      time: 'À l\'instant',
      severity: 'info',
      unread: true
    },
    {
      id: 2,
      type: 'incident-resolved',
      title: 'L\'Unicef',
      description: 'a résolu un incident.',
      time: 'Il y a 5 min',
      severity: 'success',
      unread: true
    },
    {
      id: 3,
      type: 'collaboration',
      title: 'Le GEDEFOR',
      description: 'demande une collaboration avec la DNACPN sur un incident.',
      time: 'Il y a 12 min',
      severity: 'warning',
      unread: true
    },
    {
      id: 4,
      type: 'report',
      title: 'Un Agent terrain',
      description: 'a soumis un nouveau rapport photo à Kayes.',
      time: 'Il y a 26 min',
      severity: 'info',
      unread: true
    },
    {
      id: 5,
      type: 'alert',
      title: 'Alerte IA:',
      description: 'Détection de fumée anormale dans le secteur de Baoulé.',
      time: 'Il y a 32 min',
      severity: 'danger',
      unread: false
    },
    {
      id: 6,
      type: 'message',
      title: 'La DNACPN',
      description: 'a envoyé un message concernant le rapport de Kayes.',
      time: 'Il y a 45 min',
      severity: 'info',
      unread: false
    },
    {
      id: 7,
      type: 'task',
      title: 'Un superviseur',
      description: 'a validé une tâche de surveillance.',
      time: 'Il y a 1h',
      severity: 'success',
      unread: false
    },
    {
      id: 8,
      type: 'warning',
      title: 'Système',
      description: 'Niveau d\'alerte élevé détecté dans la zone de Sikasso.',
      time: 'Il y a 1h 30min',
      severity: 'warning',
      unread: false
    },
    {
      id: 9,
      type: 'incident-taken',
      title: 'Le Ministère',
      description: 'a pris en charge un incident prioritaire.',
      time: 'Il y a 2h',
      severity: 'info',
      unread: false
    },
    {
      id: 10,
      type: 'archive',
      title: 'Système',
      description: 'a archivé 3 incidents résolus.',
      time: 'Il y a 3h',
      severity: 'info',
      unread: false
    }
  ];

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
            {activity.unread && <div className="activity-unread-dot"></div>}
          </div>
        ))}
      </div>

      <div className="activity-footer">
        <button className="activity-footer-btn">
          Voir tout l'historique
        </button>
      </div>
    </div>
  );
};

export default ActivityPanel;
