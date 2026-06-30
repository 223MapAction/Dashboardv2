import React, { useMemo } from 'react';
import { TickCircle, CloseCircle, Activity, Location, Chart2, Warning2 } from 'iconsax-react';
import './incident-stats.css';

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

export const IncidentStats = ({ incidents = [] }) => {
  // Normaliser les incidents
  const normalizedIncidents = useMemo(() => {
    const data = Array.isArray(incidents)
      ? incidents
      : (incidents && Array.isArray(incidents.results) ? incidents.results : []);
    return data.filter(inc => !inc.is_deleted);
  }, [incidents]);

  // 1. Calculer les statistiques de statut
  const statusStats = useMemo(() => {
    const resolved = normalizedIncidents.filter(inc => inc.etat === 'resolved').length;
    const inProgress = normalizedIncidents.filter(inc => 
      inc.etat === 'taken_into_account' || inc.etat === 'in_progress'
    ).length;
    const unresolved = normalizedIncidents.filter(inc => inc.etat === 'declared').length;
    const total = normalizedIncidents.length;

    return { total, resolved, inProgress, unresolved };
  }, [normalizedIncidents]);

  // 2. Calculer les statistiques par localité (Top 5)
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

  // 3. Calculer le top 5 des incidents par catégorie/titre
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

  // 4. Calculer les statistiques par gravité
  const severityStats = useMemo(() => {
    const severityMap = { high: 0, medium: 0, low: 0 };
    normalizedIncidents.forEach(inc => {
      const severity = getSeverity(inc);
      severityMap[severity]++;
    });
    const total = normalizedIncidents.length || 1;
    return {
      high: {
        count: severityMap.high,
        percentage: Math.round((severityMap.high / total) * 100)
      },
      medium: {
        count: severityMap.medium,
        percentage: Math.round((severityMap.medium / total) * 100)
      },
      low: {
        count: severityMap.low,
        percentage: Math.round((severityMap.low / total) * 100)
      }
    };
  }, [normalizedIncidents]);

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
              <div className="stat-label">Total des incidents</div>
            </div>
          </div>
          
          <div className="status-stat-card resolved">
            <div className="stat-icon">
              <TickCircle size={32} variant="Bold" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{statusStats.resolved}</div>
              <div className="stat-label">Incidents résolus</div>
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
