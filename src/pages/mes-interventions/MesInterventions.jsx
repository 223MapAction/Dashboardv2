import React, { useState, useMemo } from 'react';
import { useRechercheDebouncee } from '../../hooks/useRechercheDebouncee';
import { FiltersBar } from '../../components/molecules/FiltersBar';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Header, Sidebar } from '../../components/layout';
import { SearchNormal1, ArrowDown2, Eye, EyeSlash, DirectboxReceive, People, UserAdd, DocumentText, Calendar, User, Location } from 'iconsax-react';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerCircularImage } from 'react-shimmer-effects';
import { MesInterventionsModalProvider } from './MesInterventionsModalContext';
import { useMesInterventionsModalContext } from './mesInterventionsModalContexte';
import { MesInterventionsAssignModal } from './modal/MesInterventionsAssignModal';
import { SignalementAgentsListModal } from './modal/SignalementAgentsListModal';
import { SignalementReportsModal } from './modal/SignalementReportsModal';
import { getOrgInternalSignalementsService } from './service/mes_interventions_service';
import { getSignalementAssignmentsService } from '../signalement/service/signalement_service';
import { BlurryImage } from '../../components/atoms/BlurryImage';
import Pagination from '../../components/molecules/Pagination';
import { ResponsiveTable } from '../../components/molecules/ResponsiveTable';
import { creerColonnesInterventions, mediaIntervention } from './colonnes';
import './mes-interventions.css';


import { TableActionsMenu } from '../../components/molecules/TableActionsMenu';
import { AVATAR_COLORS, AVATAR_COULEUR_DEFAUT } from '../../utils/couleursAvatar';
import { BandeauErreur } from '../../components/molecules/BandeauErreur';
// Initiales pour les avatars
const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

// Adaptation des données pour l'affichage
const adaptSignalementData = (signalement) => {
  if (!signalement) return null;

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
    ...signalement,
    location: signalement.zone || signalement.location || 'Localisation non spécifiée',
    type: signalement.zone || signalement.type || 'Non spécifié',
    image: signalement.photo || signalement.image || '',
    startDate: signalement.created_at ? new Date(signalement.created_at).toLocaleDateString('fr-FR') : 'Non spécifié',
    endDate: signalement.resolution_end_date ? new Date(signalement.resolution_end_date).toLocaleDateString('fr-FR') : 'En cours',
    badge: getBadgeFromEtat(signalement.etat),
    progressValue: signalement.progress || 0,
    is_public: signalement.is_public ?? false
  };
};


const SignalementAgentsStack = ({ signalement }) => {
  const { openAgentsModal } = useMesInterventionsModalContext();
  const { data: assignmentsData, isLoading } = useSWR(
    signalement ? `incident_assignments_${signalement.id}` : null,
    () => getSignalementAssignmentsService(signalement.id)
  );

  const incidentAgents = useMemo(() => {
    const list = assignmentsData || [];
    return list.map((a) => {
      const agentId = a.agent || a.id;
      const fullName = a.agent_name || `Agent #${agentId}`;
      const email = a.agent_email || '';
      const avatarColor = AVATAR_COLORS[Math.abs(agentId) % AVATAR_COLORS.length] || AVATAR_COULEUR_DEFAUT;

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
      <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        Aucun agent
      </span>
    );
  }

  return (
    <div
      className="avatar-stack"
      onClick={(e) => {
        e.stopPropagation();
        openAgentsModal(signalement);
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
            fontSize: 'var(--font-size-micro)',
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
            backgroundColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: 'var(--font-size-micro)',
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
    openReportsModal,
    setMutateSignalements
  } = useMesInterventionsModalContext();

  const {
    saisie: searchInput,
    setSaisie: setSearchInput,
    recherche: search,
    reinitialiser: reinitialiserRecherche,
  } = useRechercheDebouncee();
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('agents_or_internal');

  const [page, setPage] = useState(1);
  const pageSize = 20;


  // Reset page to 1 on filter/search change
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sourceFilter]);

  const mappedStatus = useMemo(() => {
    if (statusFilter === 'En cours') return 'taken_into_account';
    if (statusFilter === 'terminer') return 'resolved';
    return '';
  }, [statusFilter]);

  const { data, error: erreurInterventions, isLoading, mutate } = useSWR(
    ['/MapApi/org-signalements', sourceFilter, mappedStatus, search, page],
    () => getOrgInternalSignalementsService({
      sourceFilter,
      status: mappedStatus,
      search,
      page,
      page_size: pageSize
    })
  );

  React.useEffect(() => {
    if (setMutateSignalements) {
      setMutateSignalements(() => mutate);
    }
  }, [mutate, setMutateSignalements]);

  const signalements = useMemo(() => {
    const rawList = data?.results || (Array.isArray(data) ? data : []);
    return rawList.map(adaptSignalementData);
  }, [data]);

  // Fonction pour ouvrir les rapports d'un signalement
  const handleOpenReports = (signalement) => {
    openReportsModal(signalement);
  };

  const handleRowClick = (signalement) => {
    const collabId = signalement?.my_collaboration?.id;
    // return
    navigate(`/collaboration-detail/${collabId}`, {
      state: { from: '/mes-interventions' }
    });

  };

  // Les colonnes vivent dans ./colonnes : sorties d'ici, elles se testent,
  // et ce fichier redescend sous les 400 lignes.
  const colonnes = creerColonnesInterventions({
    onOuvrirRapports: handleOpenReports,
    RenduEquipe: SignalementAgentsStack,
  });

  const actionsDe = (signalement) => (
    <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <TableActionsMenu
                ariaLabel={`Actions sur ${signalement.title || 'cette intervention'}`}
                actions={[
                  {
                    id: 'detail',
                    label: 'Voir le détail',
                    icon: Eye,
                    onSelect: () => handleGoToSignalementDetail(signalement),
                  },
                  {
                    id: 'team',
                    label: "Gérer l'équipe",
                    icon: People,
                    onSelect: () => openAssignModal(signalement),
                  },
                ]}
              />
            </div>
    </>
  );

  const handleGoToSignalementDetail = (signalement) => {
    navigate(`/signalements/${signalement.id}`, {
      state: { signalement, from: '/mes-interventions' }
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
          <BandeauErreur
            erreur={erreurInterventions}
            onReessayer={mutate}
            message="Impossible de charger vos interventions. La liste affichée peut ne plus être à jour."
          />
          {/* Header de la page */}
          <header className="mes-interventions-header">
            <h1 className="mes-interventions-title">Mes interventions</h1>
            <p className="mes-interventions-subtitle">
              Retrouvez la liste complète des signalements qui vous ont été assignés personnellement et suivez leur avancement.
            </p>
          </header>

          {/* Filtres et Barre de recherche — fixe au defilement : voir
              .mes-interventions-filtres-fixes. */}
          <div className="mes-interventions-filtres-fixes">
          <FiltersBar
            recherche={searchInput}
            onRecherche={setSearchInput}
            placeholder="Rechercher un titre, une description, un lieu…"
            selects={[
              { id: 'source', valeur: sourceFilter, onChange: setSourceFilter,
                ariaLabel: 'Filtrer par source', neutre: 'agents_or_internal',
                options: [
                  { value: 'agents_or_internal', label: 'Agents & internes' },
                  { value: 'internal', label: 'Internes uniquement' },
                  { value: 'agents', label: 'Agents uniquement' },
                ] },
              { id: 'statut', valeur: statusFilter, onChange: setStatusFilter,
                ariaLabel: 'Filtrer par statut', tousLabel: 'Tous les statuts',
                options: [
                  { value: 'En cours', label: 'En cours' },
                  { value: 'terminer', label: 'Terminée' },
                ] },
            ]}
            onEffacer={() => {
              reinitialiserRecherche();
              setSourceFilter('agents_or_internal'); setStatusFilter('');
            }}
            resultats={data?.count ?? signalements.length}
            nomResultat="intervention"
          />
          </div>

          {/* Affichage des données / Chargement */}
          {!isLoading && signalements.length === 0 ? (
            <div className="mes-interventions-empty">
              <p className="h1 mb-p pb-0">Aucun signalement</p>
              <p className="mt-2">Aucun signalement assigné ne correspond à vos critères.</p>
            </div>
          ) : (
            <>
              <ResponsiveTable
                colonnes={colonnes}
                donnees={signalements || []}
                cleDe={(i) => i.id}
                actions={actionsDe}
                onLigneClick={handleRowClick}
                media={mediaIntervention}
                chargement={isLoading}
                classeLigne={() => 'mes-interventions-row-clickable'}
                classeTable="mes-interventions-table"
                classeWrap="mes-interventions-table-wrap"
                libelleListe="Mes interventions"
              />

              <Pagination
                page={page}
                pageSize={pageSize}
                count={data?.count ?? (Array.isArray(data) ? data.length : 0)}
                onChange={setPage}
              />
            </>
          )}
        </main>
      </div>

      {/* Modales d'actions */}
      <MesInterventionsAssignModal />
      <SignalementAgentsListModal />
      <SignalementReportsModal />
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
