import React, { useMemo } from 'react';
import { Location, Chart2, Warning2, ArrowRight2, Clock } from 'iconsax-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
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
      return { backgroundColor: 'rgba(var(--rgb-success), 0.1)', color: 'var(--color-success-text)' };
    case 'taken_into_account':
    case 'in_progress':
      return { backgroundColor: 'rgba(var(--rgb-warning), 0.1)', color: 'var(--color-warning-text)' };
    case 'declared':
    default:
      return { backgroundColor: 'rgba(var(--rgb-text-muted), 0.1)', color: 'var(--color-text-secondary)' };
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
          color: 'var(--color-danger-text)'
        },
        {
          label: 'Moyenne',
          percentage: medium,
          color: 'var(--color-warning-text)'
        },
        {
          label: 'Faible',
          percentage: low,
          color: 'var(--color-warning-text)'
        }
      ];
    }
    return [
      { label: 'Élevée', percentage: 0, color: 'var(--color-danger-text)' },
      { label: 'Moyenne', percentage: 0, color: 'var(--color-warning-text)' },
      { label: 'Faible', percentage: 0, color: 'var(--color-warning-text)' }
    ];
  }, [stats]);

  const chartData = useMemo(() => {
    const hasData = severityData.some(item => item.percentage > 0);
    if (!hasData) {
      return [{ name: 'Pas de données', value: 100, color: 'var(--color-border)' }];
    }
    return severityData.map(item => ({
      name: item.label,
      value: item.percentage,
      color: item.color
    })).filter(item => item.value > 0);
  }, [severityData]);

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
                  fontSize: 'var(--font-size-micro)',
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
            <div className="text-center p-3 text-muted" style={{ fontSize: 'var(--font-size-micro)' }}>
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
          <div className="donut-chart" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
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
