import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Header, Sidebar } from '../../components/layout';
import { SearchNormal1, ArrowDown2, Eye, EyeSlash, DirectboxReceive, People, UserAdd, DocumentText, Calendar, User, Location } from 'iconsax-react';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerCircularImage } from 'react-shimmer-effects';
import { MesInterventionsModalProvider, useMesInterventionsModalContext } from './MesInterventionsModalContext';
import { MesInterventionsAssignModal } from './modal/MesInterventionsAssignModal';
import { IncidentAgentsListModal } from './modal/IncidentAgentsListModal';
import { IncidentReportsModal } from './modal/IncidentReportsModal';
import { getOrgInternalIncidentsService, toggleIncidentPublicService } from './service/mes_interventions_service';
import { getIncidentAssignmentsService } from '../incident/service/incident_service';
import { BlurryImage } from '../../components/atoms/BlurryImage';
import Pagination from '../../components/molecules/Pagination';
import './mes-interventions.css';


// Initiales pour les avatars
const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

// Adaptation des données pour l'affichage
const adaptIncidentData = (incident) => {
  if (!incident) return null;

  const getBadgeFromEtat = (etat) => {
    const badges = {
      'declared': { label: 'DÉCLARÉ', variant: 'declared' },
      'taken_into_account': { label: 'PRIS EN COMPTE', variant: 'taken' },
      'in_progress': { label: 'EN COURS', variant: 'in-progress' },
      'resolved': { label: 'RÉSOLU', variant: 'resolved' }
    };
    return badges[etat] || { label: 'EN COURS', variant: 'in-progress' };
  };

  return {
    ...incident,
    location: incident.zone || incident.location || 'Localisation non spécifiée',
    type: incident.zone || incident.type || 'Non spécifié',
    image: incident.photo || incident.image || '',
    startDate: incident.created_at ? new Date(incident.created_at).toLocaleDateString('fr-FR') : 'Non spécifié',
    endDate: incident.resolution_end_date ? new Date(incident.resolution_end_date).toLocaleDateString('fr-FR') : 'En cours',
    badge: getBadgeFromEtat(incident.etat),
    progressValue: incident.progress || 0,
    is_public: incident.is_public ?? false
  };
};

const TableSkeleton = () => (
  <div className="mes-interventions-table-wrap">
    <table className="mes-interventions-table">
      <thead>
        <tr>
          <th>Incident</th>
          <th>Localisation</th>
          <th>Mode</th>
          <th>Date de déclaration</th>
          <th>Date de résolution</th>
          <th>Progression</th>
          <th>Équipe terrain</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {[...Array(4)].map((_, idx) => (
          <tr key={idx}>
            <td>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <ShimmerThumbnail height={40} width={40} rounded />
                <div>
                  <ShimmerTitle line={1} gap={4} width={150} />
                </div>
              </div>
            </td>
            <td><ShimmerText line={1} width={100} /></td>
            <td><ShimmerThumbnail height={20} width={80} rounded /></td>
            <td><ShimmerText line={1} width={80} /></td>
            <td><ShimmerText line={1} width={80} /></td>
            <td><ShimmerThumbnail height={8} width={60} rounded /></td>
            <td>
              <div style={{ display: 'flex', gap: '4px' }}>
                <ShimmerCircularImage size={24} />
                <ShimmerCircularImage size={24} />
              </div>
            </td>
            <td><ShimmerThumbnail height={24} width={80} rounded /></td>
            <td><ShimmerCircularImage size={32} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AVATAR_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E',
  '#3AA2DD', '#1E40AF', '#A855F7', '#EC4899',
  '#10B981', '#6366F1'
];

const IncidentAgentsStack = ({ incident }) => {
  const { openAgentsModal } = useMesInterventionsModalContext();
  const { data: assignmentsData, isLoading } = useSWR(
    incident ? `incident_assignments_${incident.id}` : null,
    () => getIncidentAssignmentsService(incident.id)
  );

  const incidentAgents = useMemo(() => {
    const list = assignmentsData || [];
    return list.map((a) => {
      const agentId = a.agent || a.id;
      const fullName = a.agent_name || `Agent #${agentId}`;
      const email = a.agent_email || '';
      const avatarColor = AVATAR_COLORS[Math.abs(agentId) % AVATAR_COLORS.length] || '#3AA2DD';

      const isReporter = a.incident_detail?.user_id?.id === agentId;
      const roleVal = isReporter ? a.incident_detail?.user_id?.org_role : null;
      let role = 'Terrain';
      if (roleVal === 'org_admin') role = 'Administrateur';
      if (roleVal === 'bureau_agent') role = 'Bureau';
      if (roleVal === 'field_agent') role = 'Terrain';

      const orgName = isReporter ? a.incident_detail?.user_id?.organisation_name : (a.incident_detail?.user_id?.organisation_name || 'Kaicedra Consulting SAS');

      return {
        id: agentId,
        fullName,
        email,
        avatarColor,
        role,
        orgName: orgName || 'Kaicedra Consulting SAS'
      };
    });
  }, [assignmentsData]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        <ShimmerCircularImage size={24} />
      </div>
    );
  }

  if (incidentAgents.length === 0) {
    return (
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        Aucun agent
      </span>
    );
  }

  return (
    <div
      className="avatar-stack"
      onClick={(e) => {
        e.stopPropagation();
        openAgentsModal(incident);
      }}
      title="Voir la liste des agents assignés"
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
    >
      {incidentAgents.slice(0, 3).map((agent, index) => (
        <div
          key={agent.id}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: agent.avatarColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '11px',
            border: '2px solid white',
            marginLeft: index > 0 ? '-8px' : '0',

            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {getInitials(agent.fullName)}
        </div>
      ))}
      {incidentAgents.length > 3 && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#E2E8F0',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '10px',
            border: '2px solid white',
            marginLeft: '-8px',
            zIndex: 1
          }}
        >
          +{incidentAgents.length - 3}
        </div>
      )}
    </div>
  );
};

const MesInterventionsContent = () => {
  const navigate = useNavigate();
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();

  const {
    openAssignModal,
    openAgentsModal,
    openReportsModal,
    setMutateIncidents
  } = useMesInterventionsModalContext();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('agents_or_internal');

  const { data, error, isLoading, mutate } = useSWR(
    ['/MapApi/org-incidents', sourceFilter],
    () => getOrgInternalIncidentsService(sourceFilter)
  );
  React.useEffect(() => {
    if (setMutateIncidents) {
      setMutateIncidents(() => mutate);
    }
  }, [mutate, setMutateIncidents]);




  const incidents = useMemo(() => {
    const rawList = data?.results || (Array.isArray(data) ? data : []);
    return rawList.map(adaptIncidentData);
  }, [data]);

  // Fonction pour ouvrir les rapports d'un incident
  const handleOpenReports = (incident) => {
    openReportsModal(incident);
  };

  // Filtres locaux (recherche et statut)
  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const matchesSearch =
        !search ||
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        i.location?.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = !statusFilter || (
        statusFilter === 'En cours'
          ? (i.etat === 'declared' || i.etat === 'taken_into_account' || i.etat === 'in_progress')
          : i.etat === 'resolved'
      );

      return matchesSearch && matchesStatus;
    });
  }, [incidents, search, statusFilter]);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Reset page to 1 on filter/search change
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sourceFilter]);

  const pagedIncidents = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredIncidents.slice(startIndex, startIndex + pageSize);
  }, [filteredIncidents, page, pageSize]);

  const handleRowClick = (incident) => {
    const collabId = incident.my_collaboration?.id;

    navigate(`/collaboration-detail/${collabId}`, {
      state: { from: '/mes-interventions' }
    });

  };

  const handleGoToIncidentDetail = (incident) => {
    navigate(`/incidents/${incident.id}`, {
      state: { incident, from: '/mes-interventions' }
    });
  };

  return (
    <div className="mes-interventions-page">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div className={`mes-interventions-page-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="mes-interventions-content">
          {/* Header de la page */}
          <header className="mes-interventions-header">
            <h1 className="mes-interventions-title">Mes interventions</h1>
            <p className="mes-interventions-subtitle">
              Retrouvez la liste complète des incidents qui vous ont été assignés personnellement et suivez leur avancement.
            </p>
          </header>

          {/* Filtres et Barre de recherche */}
          <div className="mes-interventions-filters">
            <div className="mes-interventions-search">
              <SearchNormal1 size={18} variant="Linear" color="#6C7278" />
              <input
                type="text"
                placeholder="Rechercher par titre, description, localisation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="mes-interventions-select-wrapper">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                aria-label="Filtrer par source"
              >
                <option value="agents_or_internal">Agents & Internes</option>
                <option value="internal">Internes uniquement</option>
                <option value="agents">Agents uniquement</option>
              </select>
              <ArrowDown2 size={16} variant="Linear" color="#6C7278" />
            </div>

            <div className="mes-interventions-select-wrapper">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filtrer par statut"
              >
                <option value="">Tous les statuts</option>
                <option value="En cours">En cours </option>
                <option value="terminer">Terminer</option>
              </select>
              <ArrowDown2 size={16} variant="Linear" color="#6C7278" />
            </div>
          </div>

          {/* Affichage des données / Chargement */}
          {isLoading ? (
            <TableSkeleton />
          ) : filteredIncidents.length === 0 ? (
            <div className="mes-interventions-empty">
              <p className="h1 mb-p pb-0">Aucun incident</p>
              <p className="mt-2">Aucun incident assigné ne correspond à vos critères.</p>
            </div>
          ) : (
            <>
              <div className="mes-interventions-table-wrap">
                <table className="mes-interventions-table">
                  <thead>
                    <tr>
                      <th>Incident</th>
                      <th>Localisation</th>
                      <th>Mode</th>
                      <th>Date de déclaration</th>
                      <th>Date de résolution</th>
                      <th>Progression</th>
                      <th>Équipe terrain</th>
                      <th>Rapports</th>
                      <th>Statut</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedIncidents?.map((incident) => {
                      return (
                        <tr
                          key={incident.id}
                          onClick={() => handleRowClick(incident)}
                          className="mes-interventions-row-clickable"
                        >
                          <td>
                            <div className="mes-interventions-main-cell">
                              <BlurryImage
                                src={incident.image}
                                alt={incident.title}
                                className="mes-interventions-img"
                              />
                              <div>
                                <span className="mes-interventions-row-title">
                                  {incident.title || 'Sans titre'}
                                </span>
                                <span className="mes-interventions-row-desc">
                                  {incident.description
                                    ? incident.description.substring(0, 80) +
                                    (incident.description.length > 80 ? '...' : '')
                                    : 'Aucune description disponible.'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="mes-interventions-cell-text">
                            {incident.location || 'Inconnue'}
                          </td>
                          <td className="mes-interventions-cell-text">
                            {incident.take_in_charge_mode && (
                              <span className={`take-in-charge-tag ${incident.take_in_charge_mode}`} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: (incident.take_in_charge_mode === 'internal' || incident.take_in_charge_mode === 'interne') ? 'rgba(58, 162, 221, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                                color: (incident.take_in_charge_mode === 'internal' || incident.take_in_charge_mode === 'interne') ? 'var(--color-primary)' : '#A855F7',
                                border: (incident.take_in_charge_mode === 'internal' || incident.take_in_charge_mode === 'interne') ? '1px solid rgba(58, 162, 221, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)'
                              }}>
                                {(incident.take_in_charge_mode === 'internal' || incident.take_in_charge_mode === 'interne') ? 'Interne' : 'Collaboratif'}
                              </span>
                            ) || (
                                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Non spécifié</span>
                              )}
                          </td>
                          <td className="mes-interventions-cell-text">
                            {incident.startDate}
                          </td>
                          <td className="mes-interventions-cell-text">
                            {incident.endDate === 'En cours' ? (
                              <span className="mes-interventions-date-badge is-pending">En cours</span>
                            ) : (
                              <span className="mes-interventions-date-badge is-resolved">{incident.endDate}</span>
                            )}
                          </td>
                          <td className="mes-interventions-cell-text">
                            <div className="mes-interventions-progress-container">
                              <div className="mes-interventions-progress-bar-bg">
                                <div
                                  className="mes-interventions-progress-bar-fill"
                                  style={{ width: `${incident.progressValue}%` }}
                                />
                              </div>
                              <span className="mes-interventions-progress-label">
                                {incident.progressValue}%
                              </span>
                            </div>
                          </td>
                          <td className="mes-interventions-cell-text">
                            <IncidentAgentsStack incident={incident} />
                          </td>
                          <td className="mes-interventions-cell-text" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const reportsCount = incident?.reports_count || 0;
                              return (
                                <button
                                  type="button"
                                  className="rapport-count-btn"
                                  onClick={(e) => { e.stopPropagation(); handleOpenReports(incident); }}
                                  disabled={reportsCount === 0}
                                  title={reportsCount > 0 ? `Voir les ${reportsCount} rapport(s)` : 'Aucun rapport'}
                                >
                                  <DocumentText size={16} variant={reportsCount > 0 ? 'Bold' : 'Linear'} color={reportsCount > 0 ? '#3AA2DD' : '#9CA3AF'} />
                                  <span>{reportsCount}</span>
                                </button>
                              );
                            })()}
                          </td>
                          <td>
                            <span className={`mes-interventions-badge-glow variant-${incident.badge.variant}`}
                              style={{ width: "max-content" }}
                            >
                              {incident.badge.label}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ width: "max-content" }}
                                onClick={(e) => { e.stopPropagation(); openAssignModal(incident); }}
                                title="Gérer l'équipe"
                              >
                                Gérer l'équipe
                              </button>

                              <button
                                type="button"
                                className="btn btn-light"
                                onClick={(e) => { e.stopPropagation(); handleGoToIncidentDetail(incident); }}
                                title="Voir le détail"
                              >
                                <Eye size={16} variant="Bold" color="#6C7278" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={page}
                pageSize={pageSize}
                count={filteredIncidents.length}
                onChange={setPage}
              />
            </>
          )}
        </main>
      </div>

      {/* Modales d'actions */}
      <MesInterventionsAssignModal />
      <IncidentAgentsListModal />
      <IncidentReportsModal />
    </div>
  );
};

export const MesInterventions = () => {
  return (
    <MesInterventionsModalProvider>
      <MesInterventionsContent />
    </MesInterventionsModalProvider>
  );
};

export default MesInterventions;
