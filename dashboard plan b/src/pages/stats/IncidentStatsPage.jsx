import React from 'react';
import useSWR from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Header, Sidebar } from '../../components/layout';
import { IncidentStats } from '../dashboard/components/stats/IncidentStats';
import { getIncidentsService } from '../dashboard/service/dashboard_service';
import { ShimmerThumbnail, ShimmerTitle } from 'react-shimmer-effects';
import './incident-stats-page.css';

export const IncidentStatsPage = () => {
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();

  // Récupérer tous les incidents
  const { data: incidents = [], isLoading, error } = useSWR(
    '/incidents/all',
    () => getIncidentsService('all'),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      onError: (err) => {
        console.error('[STATS] Erreur chargement incidents:', err);
      },
      onSuccess: (data) => {
        console.log('[STATS] Incidents chargés:', data);
      }
    }
  );

  return (
    <div className="stats-page-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      
      <div className={`stats-page-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={sidebarCollapsed}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="stats-page-content py-5 mt-5">
          <div className="stats-page-header">
            <h1 className="stats-page-title">Statistiques des Incidents</h1>
            <p className="stats-page-subtitle">
              Vue d'ensemble complète des incidents par statut, localité, type et gravité
            </p>
          </div>

          {isLoading ? (
            <div className="stats-loading">
              <ShimmerTitle line={1} gap={20} />
              <ShimmerThumbnail height={200} rounded />
              <ShimmerThumbnail height={200} rounded />
              <ShimmerThumbnail height={200} rounded />
            </div>
          ) : error ? (
            <div className="stats-error">
              <p>Erreur lors du chargement des statistiques</p>
              <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
          ) : (
            <IncidentStats incidents={incidents} />
          )}
        </main>
      </div>
    </div>
  );
};

export default IncidentStatsPage;
