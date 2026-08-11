import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import debounce from 'lodash.debounce';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Header, Sidebar } from '../../components/layout';
import {
  SearchNormal1, ArrowDown2, Add, Edit2, Trash,
} from 'iconsax-react';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerCircularImage } from 'react-shimmer-effects';
import { ROLES, AVATAR_COLORS } from './data/agents';
import { getOrganisationsService } from '../organisations/service/organisation_service';
import { getOrganisationMembersService, getAgentsStatsService } from './service/members_service';
import AgentsContext from './modale/AgentsModalContext';
import { AgentFormModal, AgentDeleteModal } from './modale';
import Pagination from '../../components/molecules/Pagination';
import { TableActionsMenu } from '../../components/molecules/TableActionsMenu';
import { grouperParRole } from './roles';
import { AgentCard } from './components/AgentCard';
import { AgentListRow } from './components/AgentListRow';
import { AgentsFilters } from './components/AgentsFilters';
import { AgentsResume } from './components/AgentsResume';
import { authService } from '../auth/services/authService';
import './agents.css';
import './agents-roster.css';

const EMPTY_ARRAY = [];

const AgentTableSkeleton = () => (
  <div className="agents-table-wrap">
    <table className="agents-table has-sticky-actions">
      <thead>
        <tr>
          <th>Agent</th>
          <th>Rôle</th>
          <th>Organisation</th>
          <th>Depuis</th>
          <th>Statut</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {[...Array(5)].map((_, idx) => (
          <tr key={idx}>
            <td>
              <div className="agents-cell-identity" style={{ opacity: 0.7 }}>
                <ShimmerCircularImage size={32} style={{ margin: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <ShimmerTitle line={1} gap={0} width={120} style={{ margin: 0 }} />
                  <ShimmerText line={1} width={160} style={{ margin: 0 }} />
                </div>
              </div>
            </td>
            <td>
              <ShimmerThumbnail height={20} width={70} rounded style={{ margin: 0 }} />
            </td>
            <td>
              <ShimmerText line={1} width={100} style={{ margin: 0 }} />
            </td>
            <td>
              <ShimmerText line={1} width={80} style={{ margin: 0 }} />
            </td>
            <td>
              <ShimmerThumbnail height={20} width={60} rounded style={{ margin: 0 }} />
            </td>
            <td>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <ShimmerThumbnail height={24} width={24} rounded style={{ margin: 0 }} />
                <ShimmerThumbnail height={24} width={24} rounded style={{ margin: 0 }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const fetcher = async ([, organisationsList, search, role, status]) => {
  if (!organisationsList || organisationsList.length === 0) return [];
  const allMembers = [];

  const getIndexFromId = (id) => {
    if (!id) return 0;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  try {
    const data = await getOrganisationMembersService(null, search, role, status);
    const members = data.results || data || [];
    members.forEach((m) => {
      let parsedRole = 'bureau';
      if (m.org_role === 'org_admin') parsedRole = 'admin';
      if (m.org_role === 'field_agent') parsedRole = 'terrain';
      if (m.org_role === 'bureau_agent') parsedRole = 'bureau';

      const orgId = m.organisation_member || m.organisation;
      const org = (organisationsList || []).find(
        (o) => String(o.id) === String(orgId)
      );

      allMembers.push({
        id: m.id,
        firstName: m.first_name || '',
        lastName: m.last_name || '',
        fullName: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email,
        email: m.email,
        phone: m.phone || '',
        agentCode: m.agent_code || '',
        address: m.address || '',
        role: parsedRole,
        organisationId: orgId || '',
        organisationName: m.organisation_name || org?.name || 'Organisation inconnue',
        organisationLogo: org?.avatar || '',
        avatar: m.avatar || '',
        status: m.is_active ? 'active' : 'inactive',
        avatarColor: AVATAR_COLORS[getIndexFromId(m.id) % AVATAR_COLORS.length] || '#3AA2DD',
        joinedAt: m.date_joined || new Date().toISOString()
      });
    });
  } catch (err) {
    console.error(`[Agents] Erreur lors de la récupération des agents:`, err);
  }

  // Tri récent (plus récent en premier)
  allMembers.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  return allMembers;
};

export const Agents = () => {
  const currentUser = authService.getCurrentUser();
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();

  // ── Filtres ───────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Debounce search input de 200ms
  const debouncedSetSearch = useMemo(
    () => debounce((val) => setSearch(val), 200),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  // ── Chargement des données ────────────────────────────────────
  const { data: rawOrgs, isLoading: loadingOrgs } = useSWR(
    'organisation_list',
    getOrganisationsService
  );
  const organisationsList = useMemo(() => rawOrgs || EMPTY_ARRAY, [rawOrgs]);

  // Statistiques des agents
  const { data: statsData, mutate: mutateStats } = useSWR(
    'agents_stats',
    getAgentsStatsService
  );

  const {
    data: fetchedAgents,
    isLoading: loadingMembers,
    mutate: mutateAgents,
  } = useSWR(
    organisationsList.length > 0 ? ['agents_list', organisationsList, search, roleFilter, statusFilter] : null,
    fetcher
  );

  const isDataLoading = loadingOrgs || (organisationsList.length > 0 && loadingMembers);
  const agents = fetchedAgents || EMPTY_ARRAY;

  // ── Modal form ────────────────────────────────────────────────
  const [formModal, setFormModal] = useState({ open: false, mode: 'create', agent: null });
  const [showPassword, setShowPassword] = useState(false);
  const [modalAlert, setModalAlert] = useState({ type: null, message: null });
  const [formAnimating, setFormAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Modal suppression ─────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState({ open: false, agent: null });
  const [deleteAlert, setDeleteAlert] = useState({ type: null, message: null });
  const [deleteAnimating, setDeleteAnimating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Ouvrir modal création ─────────────────────────────────────
  const openCreate = () => {
    setModalAlert({ type: null, message: null });
    setShowPassword(false);
    setFormAnimating('opening');
    setFormModal({ open: true, mode: 'create', agent: null });
    setTimeout(() => setFormAnimating(false), 350);
  };

  // Un agent de bureau ne peut ni modifier ni supprimer un administrateur.
  //
  // Les trois orthographes testées ci-dessous sont conservées telles quelles :
  // seule la valeur `super_admin` a été observée en réponse réelle de l'API, et
  // normaliser sans avoir vu un compte `bureau_agent` reviendrait à parier sur
  // les droits en production.
  const estAgentDeBureau = () =>
    currentUser?.web_role === 'bureau_agent'
    || currentUser?.web_role === 'bureau'
    || currentUser?.web_role === 'agent_de_bureau';

  const estAdministrateur = (agent) =>
    agent?.role === 'admin' || agent?.role === 'super_admin' || agent?.role === 'admin_organisation';

  const peutModifier = (agent) => !(estAgentDeBureau() && estAdministrateur(agent));
  const peutSupprimer = (agent) => !estAgentDeBureau() || agent?.role === 'terrain';

  // ── Ouvrir modal édition ──────────────────────────────────────
  const openEdit = (agent, e) => {
    e?.stopPropagation();
    if (!peutModifier(agent)) {
      return;
    }
    setModalAlert({ type: null, message: null });
    setShowPassword(false);
    setFormAnimating('opening');
    setFormModal({ open: true, mode: 'edit', agent });
    setTimeout(() => setFormAnimating(false), 350);
  };

  // ── Fermer modal form ─────────────────────────────────────────
  const closeFormModal = () => {
    if (isSubmitting) return;
    setFormAnimating('closing');
    setTimeout(() => {
      setFormModal({ open: false, mode: 'create', agent: null });
      setFormAnimating(false);
      setModalAlert({ type: null, message: null });
    }, 320);
  };

  // ── Ouvrir modal suppression ──────────────────────────────────
  const openDelete = (agent, e) => {
    e?.stopPropagation();
    if (!peutSupprimer(agent)) {
      return;
    }
    setDeleteAlert({ type: null, message: null });
    setDeleteAnimating('opening');
    setDeleteModal({ open: true, agent });
    setTimeout(() => setDeleteAnimating(false), 350);
  };

  // ── Fermer modal suppression ──────────────────────────────────
  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteAnimating('closing');
    setTimeout(() => {
      setDeleteModal({ open: false, agent: null });
      setDeleteAnimating(false);
    }, 320);
  };

  // ── Stats ─────────────────────────────────────────────────────
  const statsTotal = statsData?.total ?? agents.length;
  const statsActive = statsData?.active ?? agents.filter((a) => a.status === 'active').length;
  const statsAdmins = statsData?.admins ?? agents.filter((a) => a.role === 'admin').length;
  const statsTerrain = statsData?.field_agents ?? agents.filter((a) => a.role === 'terrain').length;

  // ── Filtrage (géré côté serveur désormais) ────────────────────
  const filtered = agents;

  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Preference d'affichage, conservee entre les sessions comme celle de la sidebar.
  const [vue, setVue] = useState(() => {
    try {
      return localStorage.getItem('mapaction_agents_vue') === 'liste' ? 'liste' : 'fiches';
    } catch {
      return 'fiches';
    }
  });

  const changerVue = (v) => {
    setVue(v);
    try { localStorage.setItem('mapaction_agents_vue', v); } catch { /* stockage indisponible */ }
  };

  const filtreActif = Boolean(searchInput || roleFilter || statusFilter);

  const effacerFiltres = () => {
    setSearchInput('');
    setSearch('');
    debouncedSetSearch.cancel();
    setRoleFilter('');
    setStatusFilter('');
  };

  // Actions disponibles sur un agent, selon les droits de l'utilisateur connecte.
  const actionsPour = (agent) => [
    peutModifier(agent) && { id: 'edit', label: 'Modifier', icon: Edit2, onSelect: () => openEdit(agent) },
    peutSupprimer(agent) && { id: 'delete', label: 'Supprimer', icon: Trash, tone: 'danger', onSelect: () => openDelete(agent) },
  ].filter(Boolean);

  // Reset page to 1 on filter/search change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const paginatedAgents = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, page, pageSize]);

  // ── contextValue (même pattern que Organisations.jsx) ─────────
  const contextValue = {
    // Form modal
    formModal,
    showPassword,
    setShowPassword,
    modalAlert,
    setModalAlert,
    formAnimating,
    isSubmitting,
    setIsSubmitting,
    openCreate,
    openEdit,
    closeFormModal,
    // Delete modal
    deleteModal,
    deleteAlert,
    setDeleteAlert,
    deleteAnimating,
    isDeleting,
    setIsDeleting,
    openDelete,
    closeDeleteModal,
    // Shared
    mutateAgents: () => {
      mutateAgents();
      mutateStats();
    },
    organisationsList,
  };

  return (
    <AgentsContext.Provider value={contextValue}>
      <div className="agents-layout">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        <div className={`agents-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            sidebarCollapsed={sidebarCollapsed}
          />

          <main className="agents-content">
            <div className="agents-page">

              {/* ── En-tête ── */}
              <div className="agents-page-header">
                <div>
                  <h1 className="agents-title">Agents</h1>
                  <p className="agents-subtitle">Gérez les agents et leurs accès à Map Action.</p>
                </div>
                <button className="agents-add-btn" onClick={openCreate}>
                  <Add size={18} color="#fff" />
                  Nouvel agent
                </button>
              </div>

              <AgentsResume
                filtreActif={filtreActif}
                nbResultats={filtered.length}
                total={statsTotal}
                actifs={statsActive}
                terrain={statsTerrain}
                admins={statsAdmins}
              />

              <AgentsFilters
                recherche={searchInput}
                onRecherche={(v) => { setSearchInput(v); debouncedSetSearch(v); }}
                role={roleFilter}
                onRole={setRoleFilter}
                statut={statusFilter}
                onStatut={setStatusFilter}
                vue={vue}
                onVue={changerVue}
                onEffacer={effacerFiltres}
                filtreActif={filtreActif}
              />

              {/* ── Tableau ── */}
              {isDataLoading ? (
                <AgentTableSkeleton />
              ) : (
                <>
                  {grouperParRole(paginatedAgents).map((groupe) => (
                    <section key={groupe.role} className="agents-groupe">
                      <h2 className="agents-groupe-titre">
                        {groupe.libelle}
                        <span className="agents-groupe-compte">{groupe.agents.length}</span>
                      </h2>

                      {vue === 'fiches' ? (
                        <div className="agents-grille">
                          {groupe.agents.map((agent) => (
                            <AgentCard key={agent.id} agent={agent} actions={actionsPour(agent)} />
                          ))}
                        </div>
                      ) : (
                        <ul className="agents-liste">
                          {groupe.agents.map((agent) => (
                            <AgentListRow key={agent.id} agent={agent} actions={actionsPour(agent)} />
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}

                  {paginatedAgents.length === 0 && (
                    <div className="agents-vide">
                      <p className="agents-vide-titre">Aucun agent ne correspond</p>
                      <p className="agents-vide-texte">
                        Modifiez votre recherche, ou invitez un nouvel agent dans l’équipe.
                      </p>
                      <button type="button" className="agents-add-btn" onClick={openCreate}>
                        <Add size={18} color="#fff" />
                        Nouvel agent
                      </button>
                    </div>
                  )}

                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    count={filtered.length}
                    onChange={setPage}
                  />
                </>
              )}

            </div>
          </main>
        </div>

        {/* ── Modals ── */}
        <AgentFormModal key="AgentFormModalKey" />
        <AgentDeleteModal key="AgentDeleteModalKey" />

      </div>
    </AgentsContext.Provider>
  );
};

export default Agents;
