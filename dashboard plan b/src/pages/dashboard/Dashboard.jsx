import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Clock, CloseCircle } from 'iconsax-react';
import { Header, Sidebar } from '../../components/layout';
import MetricsCards from './components/metrics/MetricsCards';
import MapContainer from './components/map/MapContainer';
import StatsWidgets from './components/widgets/StatsWidgets';
import ActivityPanel from './components/activity/ActivityPanel';
import './dashboard.css';
import { getIncidentsService } from './service/dashboard_service';
import { logStats } from '../../utils/incidentStatsHelper';

export const Dashboard = () => {
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalClosing, setActivityModalClosing] = useState(false);

  // Utiliser useSWR pour récupérer les incidents
  const { data: incidents = [], isLoading: isLoadingIncidents, error } = useSWR(
    '/incidents/all',
    () => getIncidentsService('all'),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      onError: (err) => {
        console.error('[DASHBOARD] Erreur chargement incidents:', err);
      },
      onSuccess: (data) => {
        console.log('[DASHBOARD] Incidents chargés:', data);
      }
    }
  );

  const openActivityModal = () => {
    setActivityModalOpen(true);
    setActivityModalClosing(false);
  };

  const closeActivityModal = () => {
    setActivityModalClosing(true);
    setTimeout(() => {
      setActivityModalOpen(false);
      setActivityModalClosing(false);
    }, 250);
  };

  // Logger les statistiques quand les incidents sont chargés
  useEffect(() => {
    if (incidents && incidents.length > 0) {
      logStats(incidents);
    }
  }, [incidents]);

  return (
    <div className="dashboard-layout">
      {/* Sidebar gauche */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      
      {/* Contenu principal */}
      <div className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={sidebarCollapsed}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* Zone centrale avec scroll */}
        <main className="dashboard-content py-5 mt-5">
          <div className="dashboard-grid">
            {/* Carte en premier (grande) */}
            <MapContainer incidents={incidents} isLoading={isLoadingIncidents} />
            
            {/* 3 cartes métriques */}
            <MetricsCards incidents={incidents} />
            
            {/* 3 widgets statistiques */}
            <StatsWidgets incidents={incidents} />
          </div>
        </main>
        
        {/* Sidebar droite fixe - Activité en temps réel */}
        <aside className="dashboard-sidebar-right">
          <ActivityPanel />
        </aside>
      </div>

      {/* Bouton flottant mobile - Historique des activités */}
      <button
        className="activity-fab"
        onClick={openActivityModal}
        aria-label="Voir l'historique des activités"
      >
        <Clock size={24} variant="Bold" color="#FFFFFF" />
        <span className="activity-fab-badge">4</span>
      </button>

      {/* Modal Activité pour mobile */}
      {activityModalOpen && (
        <div
          className={`activity-modal-overlay ${activityModalClosing ? 'closing' : ''}`}
          onClick={closeActivityModal}
        >
          <div
            className={`activity-modal ${activityModalClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="activity-modal-close"
              onClick={closeActivityModal}
              aria-label="Fermer"
            >
              <CloseCircle size={28} variant="Bold" color="#6C7278" />
            </button>
            <ActivityPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
