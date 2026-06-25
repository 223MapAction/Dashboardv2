import React, { useMemo } from 'react';
import { Location, Chart2, Warning2, ArrowRight2 } from 'iconsax-react';
import './stats-widgets.css';

// Détermine la sévérité d'un incident
const getSeverity = (incident) => {
  const baseSeverity = incident.base_severity ?? incident.incident_details?.prediction_details?.base_severity;
  if (baseSeverity !== undefined && baseSeverity !== null) {
    const val = parseFloat(baseSeverity);
    if (val >= 7) return 'high';
    if (val >= 4) return 'medium';
    return 'low';
  }
  const badges = (incident.badges || []).map((b) => b.variant);
  if (badges.includes('critical') || badges.includes('high') || badges.includes('expert-needed')) return 'high';
  if (badges.includes('in-progress') || badges.includes('medium')) return 'medium';
  return 'low';
};

export const StatsWidgets = ({ incidents = [] }) => {
  // Normaliser les incidents
  const normalizedIncidents = useMemo(() => {
    const data = Array.isArray(incidents)
      ? incidents
      : (incidents && Array.isArray(incidents.results) ? incidents.results : []);
    return data.filter(inc => !inc.is_deleted);
  }, [incidents]);

  // Calculer les statistiques par localité
  const locationStats = useMemo(() => {
    const locationMap = {};
    normalizedIncidents.forEach(inc => {
      const zone = inc.zone || 'Non spécifié';
      locationMap[zone] = (locationMap[zone] || 0) + 1;
    });
    return Object.entries(locationMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [normalizedIncidents]);

  // Calculer le top 5 des incidents par catégorie/titre
  const topIncidents = useMemo(() => {
    const categoryMap = {};
    normalizedIncidents.forEach(inc => {
      const category = inc.title || 'Incident anonyme';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    const total = normalizedIncidents.length || 1;
    return Object.entries(categoryMap)
      .map(([name, count]) => ({ 
        name: name.toUpperCase(), 
        percentage: Math.round((count / total) * 100),
        count 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [normalizedIncidents]);

  // Calculer les statistiques par gravité
  const severityData = useMemo(() => {
    const severityMap = { high: 0, medium: 0, low: 0 };
    normalizedIncidents.forEach(inc => {
      const severity = getSeverity(inc);
      severityMap[severity]++;
    });
    const total = normalizedIncidents.length || 1;
    return [
      { 
        label: 'Critique', 
        percentage: Math.round((severityMap.high / total) * 100), 
        color: 'var(--color-severity-high)' 
      },
      { 
        label: 'Grave', 
        percentage: Math.round((severityMap.medium / total) * 100), 
        color: 'var(--color-severity-medium)' 
      },
      { 
        label: 'Modéré', 
        percentage: Math.round((severityMap.low / total) * 100), 
        color: 'var(--color-severity-low)' 
      }
    ];
  }, [normalizedIncidents]);

  return (
    <div className="stats-widgets">
      {/* Par Localité */}
      <div className="stats-widget">
        <div className="widget-header">
          <Location size={18} variant="Bold"  />
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

      {/* Top 5 Incidents */}
      <div className="stats-widget">
        <div className="widget-header">
          <Chart2 size={18} variant="Bold"   />
          <h3>Top 5 Incidents</h3>
        </div>
        <div className="widget-content">
          {topIncidents.map((incident, index) => (
            <div key={index} className="incident-row">
              <div className="incident-info">
                <span className="incident-label">{incident.name}</span>
                <span className="incident-percentage">{incident.percentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${incident.percentage}%`,
                    backgroundColor: 'var(--color-primary)'
                  }}
                />
              </div>
            </div>
          ))}
          <button className="widget-link">
            Voir tout le classement
            <ArrowRight2 size={14} variant="Linear"  />
          </button>
        </div>
      </div>

      {/* Gravité */}
      <div className="stats-widget">
        <div className="widget-header">
          <Warning2 size={18} variant="Bold"  />
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
