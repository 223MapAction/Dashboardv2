import React, { useMemo } from 'react';
import { NotificationBing, Activity, TickCircle, CloseCircle } from 'iconsax-react';
import './metrics-cards.css';

export const MetricsCards = ({ incidents = [] }) => {
  // Calculer les statistiques à partir des incidents réels
  const stats = useMemo(() => {
    const normalizedIncidents = Array.isArray(incidents)
      ? incidents
      : (incidents && Array.isArray(incidents.results) ? incidents.results : []);

    const resolved = normalizedIncidents.filter(inc => inc.etat === 'resolved' && !inc.is_deleted).length;
    const inProgress = normalizedIncidents.filter(inc => 
      (inc.etat === 'taken_into_account' || inc.etat === 'in_progress') && !inc.is_deleted
    ).length;
    const unresolved = normalizedIncidents.filter(inc => 
      inc.etat === 'declared' && !inc.is_deleted
    ).length;
    const total = normalizedIncidents.filter(inc => !inc.is_deleted).length;

    return { total, resolved, inProgress, unresolved };
  }, [incidents]);

  const metrics = [
    {
      id: 'total-alerts',
      label: 'Total des incidents',
      value: stats.total.toString(),
      color: 'primary',
      icon: <NotificationBing size={24} variant="Bold" color="#3AA2DD" />
    },
    {
      id: 'in-progress',
      label: 'En cours',
      value: stats.inProgress.toString(),
      color: 'warning',
      icon: <Activity size={24} variant="Bold" color="#F59E0B" />
    },
    {
      id: 'resolved',
      label: 'Incidents résolus',
      value: stats.resolved.toString(),
      color: 'success',
      icon: <TickCircle size={24} variant="Bold" color="#22C55E" />
    }
  ];

  return (
    <div className="metrics-cards">
      {metrics.map((metric) => (
        <div key={metric.id} className={`metric-card metric-card-${metric.color}`}>
          <div className="metric-icon-wrapper">
            {metric.icon}
          </div>
          <div className="metric-info">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;
