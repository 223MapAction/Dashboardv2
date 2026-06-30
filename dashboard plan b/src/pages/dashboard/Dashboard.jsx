import { useState, useEffect, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Clock, CloseCircle } from 'iconsax-react';
import { Header, Sidebar } from '../../components/layout';
import MetricsCards from './components/metrics/MetricsCards';
import MapContainer from './components/map/MapContainer';
import StatsWidgets from './components/widgets/StatsWidgets';
import ActivityPanel from './components/activity/ActivityPanel';
import './dashboard.css';
import { getIncidentsService, getIncidentsNotResolvedService, getIncidentsResolvedService, getActivityFeedService, getDashboardStatsService } from './service/dashboard_service';
import { logStats } from '../../utils/incidentStatsHelper';
import { API_URL_BASE } from '../../config/api_url_base';
import { authService } from '../auth/services/authService';

export const Dashboard = () => {
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalClosing, setActivityModalClosing] = useState(false);

  const { mutate } = useSWRConfig();

  // Utiliser useSWR pour récupérer les incidents non résolus (actifs)
  const { data: notResolvedData, isLoading: isLoadingNotResolved, mutate: mutateNotResolved } = useSWR(
    '/incidents/not-resolved',
    () => getIncidentsNotResolvedService(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,

      onError: (err) => {
        console.error('[DASHBOARD] Erreur chargement incidents actifs:', err);
      }
    }
  );

  // Utiliser useSWR pour récupérer les incidents résolus
  const { data: resolvedData, isLoading: isLoadingResolved, mutate: mutateResolved } = useSWR(
    '/incidents/resolved',
    () => getIncidentsResolvedService(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,

      onError: (err) => {
        console.error('[DASHBOARD] Erreur chargement incidents résolus:', err);
      }
    }
  );

  // Fusionner les incidents résolus et non résolus
  const incidents = useMemo(() => {
    const active = notResolvedData?.results || (Array.isArray(notResolvedData) ? notResolvedData : []);
    const resolved = resolvedData?.results || (Array.isArray(resolvedData) ? resolvedData : []);
    return [...active, ...resolved];
  }, [notResolvedData, resolvedData]);

  const isLoadingIncidents = isLoadingNotResolved || isLoadingResolved;

  const { data: statsData, isLoading: isLoadingStats, mutate: mutateStats } = useSWR(
    '/MapApi/incidents/dashboard-stats/',
    () => getDashboardStatsService(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,

    }
  );

  // Revalider et actualiser toutes les données du tableau de bord au chargement du composant (clic sur l'onglet)
  useEffect(() => {
    mutateNotResolved();
    mutateResolved();
    mutateStats();
    mutate('/org-incidents');
  }, [mutateNotResolved, mutateResolved, mutateStats, mutate]);

  const [activitiesList, setActivitiesList] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: activitiesData, isLoading: isLoadingActivities, mutate: mutateActivities } = useSWR(
    '/MapApi/activity-feed/?page_size=10',
    () => getActivityFeedService({ page_size: 10 }),
    {
      revalidateOnFocus: false
    }
  );

  // Sync initial SWR data to activitiesList state
  useEffect(() => {
    if (activitiesData) {
      const results = activitiesData.results || (Array.isArray(activitiesData) ? activitiesData : []);
      setActivitiesList(prev => {
        const merged = [...prev];
        results.forEach(act => {
          if (!merged.some(m => m.id === act.id)) {
            merged.push(act);
          }
        });
        // Trier par date décroissante pour garder les plus récentes en premier
        return merged.sort((a, b) => new Date(b.created_at || b.timeStamp) - new Date(a.created_at || a.timeStamp));
      });
      setNextUrl(activitiesData.next || null);
    }
  }, [activitiesData]);

  // Écoute temps réel de l'activité via WebSockets
  useEffect(() => {
    const wsBaseUrl = API_URL_BASE.replace(/^http/, 'ws');
    const token = authService.getAccessToken();
    const query = token ? `?token=${token}` : '';

    let socket = null;
    let isCleanedUp = false;
    let delay = 3000;

    const shouldRetry = (code) => ![1000, 4001, 4003, 4004].includes(code);

    const connect = () => {
      if (isCleanedUp) return;
      socket = new WebSocket(`${wsBaseUrl}/ws/activity-feed/${query}`);

      socket.onopen = () => {
        delay = 3000;
        console.log('[WS-Activity] Connecté au flux d\'activités');
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS-Activity] Message reçu en temps réel:', data);
          if (data.event === 'activity' || data.action) {
            const newAct = {
              id: data.id || `activity-${Date.now()}`,
              action: data.action,
              user_name: data.user_name,
              organisation_name: data.organisation_name,
              organisation_id: data.organisation_id,
              created_at: data.created_at || data.timeStamp || new Date().toISOString(),
              timeStamp: data.timeStamp || data.created_at
            };

            // Ajouter directement à l'état local en tête
            setActivitiesList(prev => {
              if (prev.some(act => act.id === newAct.id)) return prev;
              return [newAct, ...prev];
            });

            // Mettre à jour aussi le cache SWR
            mutateActivities((prev) => {
              const rawList = prev?.results || (Array.isArray(prev) ? prev : []);
              if (rawList.some((act) => act.id === newAct.id)) return prev;
              return Array.isArray(prev) ? [newAct, ...rawList] : { ...prev, results: [newAct, ...rawList] };
            }, { revalidate: false });
          }
        } catch (e) {
          console.error('[WS-Activity] Erreur parsing message:', e);
          mutateActivities();
        }
      };
      socket.onerror = () => socket.close();
      socket.onclose = (e) => {
        if (!isCleanedUp && shouldRetry(e.code)) {
          setTimeout(connect, delay);
          delay = Math.min(delay * 2, 30000);
        }
      };
    };

    connect();

    return () => {
      isCleanedUp = true;
      if (socket) {
        socket.close();
      }
    };
  }, [mutateActivities]);

  const handleLoadMoreActivities = async () => {
    if (!nextUrl || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await getActivityFeedService({ url: nextUrl });
      if (data) {
        const newResults = data.results || (Array.isArray(data) ? data : []);
        setActivitiesList(prev => {
          const merged = [...prev];
          newResults.forEach(act => {
            if (!merged.some(m => m.id === act.id)) {
              merged.push(act);
            }
          });
          return merged;
        });
        setNextUrl(data.next || null);
      }
    } catch (err) {
      console.error('[Dashboard] Erreur chargement plus d\'activités:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
            <MetricsCards incidents={incidents} stats={statsData} />

            {/* 3 widgets statistiques */}
            <StatsWidgets incidents={incidents} stats={statsData} />
          </div>
        </main>

        {/* Sidebar droite fixe - Activité en temps réel */}
        <aside className="dashboard-sidebar-right">
          <ActivityPanel
            activities={activitiesList}
            isLoading={isLoadingActivities}
            nextUrl={nextUrl}
            onLoadMore={handleLoadMoreActivities}
            isLoadingMore={isLoadingMore}
          />
        </aside>
      </div>

      {/* Bouton flottant mobile - Historique des activités */}
      <button
        className="activity-fab"
        onClick={openActivityModal}
        aria-label="Voir l'historique des activités"
      >
        <Clock size={24} variant="Bold" color="#FFFFFF" />
        {activitiesList.length > 0 && (
          <span className="activity-fab-badge">{activitiesList.length}</span>
        )}
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
            <ActivityPanel
              activities={activitiesList}
              isLoading={isLoadingActivities}
              nextUrl={nextUrl}
              onLoadMore={handleLoadMoreActivities}
              isLoadingMore={isLoadingMore}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
