import React, { useMemo } from 'react';
import { Location, Chart2, Warning2, ArrowRight2, Clock } from 'iconsax-react';
import './stats-widgets.css';

const getStatusLabel = (etat) => {
  switch (etat) {
    case 'resolved': return 'Résolu';
    case 'taken_into_account':
    case 'in_progress': return 'En cours';
    case 'declared': return 'Déclaré';
    default: return etat || 'Déclaré';
  }
};

const getStatusStyle = (etat) => {
  switch (etat) {
    case 'resolved':
      return { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' };
    case 'taken_into_account':
    case 'in_progress':
      return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
    case 'declared':
    default:
      return { backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
  }
};

export const StatsWidgets = ({ stats }) => {
  // Calculer les statistiques par localité
  const locationStats = useMemo(() => {
    if (stats?.by_zone && Array.isArray(stats.by_zone)) {
      return stats.by_zone.map(z => ({ name: z.name, count: z.count })).slice(0, 5);
    }
    return [];
  }, [stats]);

  // Récupérer les activités récentes
  const recentActivities = useMemo(() => {
    if (stats?.recent_activity && Array.isArray(stats.recent_activity)) {
      return stats.recent_activity.slice(0, 5);
    }
    return [];
  }, [stats]);

  // Calculer les statistiques par gravité
  const severityData = useMemo(() => {
    if (stats?.by_severity) {
      const high = stats.by_severity.high?.percentage ?? 0;
      const medium = stats.by_severity.medium?.percentage ?? 0;
      const low = stats.by_severity.low?.percentage ?? 0;
      return [
        {
          label: 'Élevée',
          percentage: high,
          color: '#EF4444'
        },
        {
          label: 'Moyenne',
          percentage: medium,
          color: '#F97316'
        },
        {
          label: 'Faible',
          percentage: low,
          color: '#FACC15'
        }
      ];
    }
    return [
      { label: 'Élevée', percentage: 0, color: '#EF4444' },
      { label: 'Moyenne', percentage: 0, color: '#F97316' },
      { label: 'Faible', percentage: 0, color: '#FACC15' }
    ];
  }, [stats]);

  return (
    <div className="stats-widgets">
      {/* Par Localité */}
      <div className="stats-widget">
        <div className="widget-header">
          <Location size={18} variant="Bold" />
          <h3>Par Localité</h3>
        </div>
        <div className="widget-content">
          {locationStats.map((location, index) => (
            <div key={index} className="stat-row">
              <span className="stat-label">{location.name}</span>
              <span className="stat-value">{location.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activité récente */}
      <div className="stats-widget">
        <div className="widget-header">
          <Clock size={18} variant="Bold" />
          <h3>Activité récente</h3>
        </div>
        <div className="widget-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <div key={activity.id} className="recent-activity-row" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span
                    className='body' style={{ fontWeight: "500" }} >
                    {activity.title}
                  </span>
                  <span
                    className='body-small '
                    style={{ color: 'var(--color-text-secondary)' }}>
                    {activity.zone} • {new Date(activity.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <span style={{
                  fontSize: '9px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  ...getStatusStyle(activity.etat)
                }}>
                  {getStatusLabel(activity.etat)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center p-3 text-muted" style={{ fontSize: '11px' }}>
              Aucune activité récente.
            </div>
          )}
        </div>
      </div>

      {/* Gravité */}
      <div className="stats-widget">
        <div className="widget-header">
          <Warning2 size={18} variant="Bold" />
          <h3>Gravité</h3>
        </div>
        <div className="widget-content">
          <div className="donut-chart">
            <svg viewBox="0 0 120 120" className="donut-svg">
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="var(--color-severity-low)"
                strokeWidth="20"
                strokeDasharray="282.7"
                strokeDashoffset="70.675"
                transform="rotate(-90 60 60)"
              />
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="var(--color-severity-medium)"
                strokeWidth="20"
                strokeDasharray="282.7"
                strokeDashoffset="217.7"
                transform="rotate(145 60 60)"
              />
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="var(--color-severity-high)"
                strokeWidth="20"
                strokeDasharray="282.7"
                strokeDashoffset="248.8"
                transform="rotate(228 60 60)"
              />
              <text x="60" y="60" textAnchor="middle" dy="7" className="donut-label">
                Global
              </text>
            </svg>
          </div>
          <div className="severity-legend">
            {severityData.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-dot" style={{ backgroundColor: item.color }}></div>
                <span className="legend-label">{item.label}: {item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsWidgets;
