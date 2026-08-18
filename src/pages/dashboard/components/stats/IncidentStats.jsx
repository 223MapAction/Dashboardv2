import React, { useMemo } from 'react';
import { TickCircle, CloseCircle, Activity, Location, Chart2, Warning2 } from 'iconsax-react';
import './incident-stats.css';
import { lireRepartitionApi } from '../../../../utils/gravite';

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
  //
  // Les libellés, l'ordre et les couleurs viennent de utils/gravite.js, donc de
  // la carte : c'est elle la référence, et cette section s'y aligne. Elle disait
  // « Critique / Grave / Modéré » pour les trois niveaux que la carte nomme
  // « Élevée / Moyenne / Faible », et les peignait avec les couleurs de statut
  // — « moyenne » et « faible » partageaient d'ailleurs le même orange.
  const niveaux = useMemo(() => lireRepartitionApi(stats?.by_severity), [stats]);

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
          {niveaux.length === 0 && (
            <div className="no-data">Aucune donnée disponible</div>
          )}
          {niveaux.map(({ cle, libelle, count, percentage }) => (
              <div key={cle} className={`severity-stat-card ${cle}`}>
                <div className="severity-header">
                  <span className="severity-label">
                    {/* La pastille reprend la couleur du marqueur correspondant
                        sur la carte. Sans elle, la couleur ne vivait que dans
                        une bordure de 2px et une barre de progression : on
                        pouvait lire toute la section sans jamais faire le lien
                        avec ce qu'on voit sur la carte. */}
                    <span className={`severity-puce ${cle}`} aria-hidden="true" />
                    {libelle}
                  </span>
                  <span className="severity-percentage">{percentage}%</span>
                </div>
                <div className="severity-count">
                  {count} incident{count > 1 ? 's' : ''}
                </div>
                <div
                  className="severity-bar"
                  role="img"
                  aria-label={`Gravité ${libelle.toLowerCase()} : ${percentage}% des incidents`}
                >
                  <div
                    className={`severity-bar-fill ${cle}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IncidentStats;
