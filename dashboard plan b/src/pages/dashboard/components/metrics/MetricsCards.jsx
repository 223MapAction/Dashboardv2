import React, { useMemo } from 'react';
import { NotificationBing, Activity, TickCircle, CloseCircle } from 'iconsax-react';
import './metrics-cards.css';

export const MetricsCards = ({ stats: statsData }) => {
  // Extraire les statistiques fournies par le backend
  const stats = useMemo(() => {
    const total = statsData?.total_alerts ?? 0;
    const resolved = statsData?.resolved_incidents ?? 0;
    const takenIntoAccount = statsData?.active_responses ?? 0;
    const unresolved = total - resolved - takenIntoAccount;

    return { total, resolved, takenIntoAccount, unresolved };
  }, [statsData]);

  const metrics = [
    {
      id: 'total-alerts',
      label: 'Total des signalements',
      value: stats.total.toString(),
      color: 'primary',
      icon: <NotificationBing size={24} variant="Bold" color="#3AA2DD" />
    },
    {
      id: 'taken-into-account',
      label: 'Signalements pris en compte',
      value: stats.takenIntoAccount.toString(),
      color: 'warning',
      icon: <Activity size={24} variant="Bold" color="#F59E0B" />
    },
    {
      id: 'resolved',
      label: 'Signalements résolus',
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
