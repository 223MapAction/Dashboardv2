import React, { useMemo } from 'react';
import { TickCircle, CloseCircle, Activity, Location, Chart2, Warning2 } from 'iconsax-react';
import './incident-stats.css';

export const IncidentStats = ({ stats }) => {
  // 1. Statistiques de statut
  const statusStats = useMemo(() => {
    const total = stats?.total_alerts ?? 0;
    const resolved = stats?.resolved_incidents ?? 0;
    const inProgress = stats?.active_responses ?? 0;
    const unresolved = total - resolved - inProgress;

    return { total, resolved, inProgress, unresolved };
  }, [stats]);

  // 2. Statistiques par localité (Top 5)
  const locationStats = useMemo(() => {
    if (stats?.by_zone && Array.isArray(stats.by_zone)) {
      return stats.by_zone.map(z => ({ name: z.name, count: z.count })).slice(0, 5);
    }
    return [];
  }, [stats]);

  // 3. Top 5 des incidents par catégorie
  const topIncidents = useMemo(() => {
    if (stats?.by_category && Array.isArray(stats.by_category) && stats.by_category.length > 0) {
      const total = stats.total_alerts || 1;
      return stats.by_category.map(cat => ({
        name: cat.name.toUpperCase(),
        percentage: Math.round((cat.count / total) * 100),
        count: cat.count
      })).slice(0, 5);
    }
    return [];
  }, [stats]);

  // 4. Statistiques par gravité
  const severityStats = useMemo(() => {
    if (stats?.by_severity) {
      return {
        high: {
          count: stats.by_severity.high?.count ?? 0,
          percentage: stats.by_severity.high?.percentage ?? 0
        },
        medium: {
          count: stats.by_severity.medium?.count ?? 0,
          percentage: stats.by_severity.medium?.percentage ?? 0
        },
        low: {
          count: stats.by_severity.low?.count ?? 0,
          percentage: stats.by_severity.low?.percentage ?? 0
        }
      };
    }
    return {
      high: { count: 0, percentage: 0 },
      medium: { count: 0, percentage: 0 },
      low: { count: 0, percentage: 0 }
    };
  }, [stats]);

  return (
    <div className="incident-stats-container">
      {/* Section 1: Statistiques de statut */}
      <div className="stats-section">
        <h2 className="stats-section-title">
          <Activity size={24} variant="Bold" />
          Statistiques par Statut
        </h2>
        <div className="status-stats-grid">
          <div className="status-stat-card total">
            <div className="stat-icon">
              <Chart2 size={32} variant="Bold" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{statusStats.total}</div>
              <div className="stat-label">Total des signalements</div>
            </div>
          </div>

          <div className="status-stat-card resolved">
            <div className="stat-icon">
              <TickCircle size={32} variant="Bold" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{statusStats.resolved}</div>
              <div className="stat-label">Signalements résolus</div>
            </div>
          </div>

          <div className="status-stat-card in-progress">
            <div className="stat-icon">
              <Activity size={32} variant="Bold" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{statusStats.inProgress}</div>
              <div className="stat-label">En cours</div>
            </div>
          </div>

          <div className="status-stat-card unresolved">
            <div className="stat-icon">
              <CloseCircle size={32} variant="Bold" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{statusStats.unresolved}</div>
              <div className="stat-label">Non résolus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Par Localité */}
      <div className="stats-section">
        <h2 className="stats-section-title">
          <Location size={24} variant="Bold" />
          Top 5 par Localité
        </h2>
        <div className="location-stats-list">
          {locationStats.length > 0 ? (
            locationStats.map((location, index) => (
              <div key={index} className="location-stat-item">
                <div className="location-rank">{index + 1}</div>
                <div className="location-name">{location.name}</div>
                <div className="location-count">{location.count} incidents</div>
              </div>
            ))
          ) : (
            <div className="no-data">Aucune donnée disponible</div>
          )}
        </div>
      </div>

      {/* Section 3: Top 5 Incidents */}
      <div className="stats-section">
        <h2 className="stats-section-title">
          <Chart2 size={24} variant="Bold" />
          Top 5 Types d'Incidents
        </h2>
        <div className="top-incidents-list">
          {topIncidents.length > 0 ? (
            topIncidents.map((incident, index) => (
              <div key={index} className="top-incident-item">
                <div className="incident-header">
                  <span className="incident-name">{incident.name}</span>
                  <span className="incident-stats">{incident.count} ({incident.percentage}%)</span>
                </div>
                <div className="incident-progress-bar">
                  <div
                    className="incident-progress-fill"
                    style={{ width: `${incident.percentage}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">Aucune donnée disponible</div>
          )}
        </div>
      </div>

      {/* Section 4: Par Gravité */}
      <div className="stats-section">
        <h2 className="stats-section-title">
          <Warning2 size={24} variant="Bold" />
          Répartition par Gravité
        </h2>
        <div className="severity-stats-grid">
          <div className="severity-stat-card high">
            <div className="severity-header">
              <span className="severity-label">Critique</span>
              <span className="severity-percentage">{severityStats.high.percentage}%</span>
            </div>
            <div className="severity-count">{severityStats.high.count} incidents</div>
            <div className="severity-bar">
              <div
                className="severity-bar-fill high"
                style={{ width: `${severityStats.high.percentage}%` }}
              />
            </div>
          </div>

          <div className="severity-stat-card medium">
            <div className="severity-header">
              <span className="severity-label">Grave</span>
              <span className="severity-percentage">{severityStats.medium.percentage}%</span>
            </div>
            <div className="severity-count">{severityStats.medium.count} incidents</div>
            <div className="severity-bar">
              <div
                className="severity-bar-fill medium"
                style={{ width: `${severityStats.medium.percentage}%` }}
              />
            </div>
          </div>

          <div className="severity-stat-card low">
            <div className="severity-header">
              <span className="severity-label">Modéré</span>
              <span className="severity-percentage">{severityStats.low.percentage}%</span>
            </div>
            <div className="severity-count">{severityStats.low.count} incidents</div>
            <div className="severity-bar">
              <div
                className="severity-bar-fill low"
                style={{ width: `${severityStats.low.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentStats;
