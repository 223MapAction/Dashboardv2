import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import debounce from 'lodash.debounce';
import { useSidebarState } from '../../hooks/useSidebarState';
import { Header, Sidebar } from '../../components/layout';
import {
  SearchNormal1, ArrowDown2, Add, Edit2, Trash,
  People, TickCircle, ShieldTick, Briefcase,
} from 'iconsax-react';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerCircularImage } from 'react-shimmer-effects';
import { ROLES, AVATAR_COLORS } from './data/agents';
import { getOrganisationsService } from '../organisations/service/organisation_service';
import { getOrganisationMembersService, getAgentsStatsService } from './service/members_service';
import AgentsContext from './modale/AgentsModalContext';
import { AgentFormModal, AgentDeleteModal } from './modale';
import Pagination from '../../components/molecules/Pagination';
import { authService } from '../auth/services/authService';
import './agents.css';

// ── Helpers ───────────────────────────────────────────────────────
const getRoleConfig = (roleId) =>
  ROLES.find((r) => r.id === roleId) || { label: roleId, color: '#9CA3AF' };

const getInitials = (name) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

const EMPTY_ARRAY = [];

const AgentTableSkeleton = () => (
  <div className="agents-table-wrap">
    <table className="agents-table">
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

  // ── Ouvrir modal édition ──────────────────────────────────────
  const openEdit = (agent, e) => {
    e?.stopPropagation();
    const isOffice = currentUser?.web_role === 'bureau_agent' || currentUser?.web_role === 'bureau' || currentUser?.web_role === 'agent_de_bureau';
    const isTargetAdmin = agent?.role === 'admin' || agent?.role === 'super_admin' || agent?.role === 'admin_organisation';
    if (isOffice && isTargetAdmin) {
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
    const isOffice = currentUser?.web_role === 'bureau_agent' || currentUser?.web_role === 'bureau' || currentUser?.web_role === 'agent_de_bureau';
    if (isOffice && agent.role !== 'terrain') {
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

              {/* ── Statistiques ── */}
              <div className="agents-stats">
                <div className="agents-stat">
                  <div className="agents-stat-icon agents-stat-icon-primary">
                    <People size={20} variant="Bold" color="var(--color-primary)" />
                  </div>
                  <div>
                    <div className="agents-stat-value">{statsTotal}</div>
                    <div className="agents-stat-label">Total agents</div>
                  </div>
                </div>
                <div className="agents-stat">
                  <div className="agents-stat-icon agents-stat-icon-success">
                    <TickCircle size={20} variant="Bold" color="var(--color-success)" />
                  </div>
                  <div>
                    <div className="agents-stat-value">{statsActive}</div>
                    <div className="agents-stat-label">Actifs</div>
                  </div>
                </div>
                <div className="agents-stat">
                  <div className="agents-stat-icon agents-stat-icon-warning">
                    <ShieldTick size={20} variant="Bold" color="var(--color-warning)" />
                  </div>
                  <div>
                    <div className="agents-stat-value">{statsAdmins}</div>
                    <div className="agents-stat-label">Admins</div>
                  </div>
                </div>
                <div className="agents-stat">
                  <div className="agents-stat-icon agents-stat-icon-danger">
                    <Briefcase size={20} variant="Bold" color="var(--color-danger)" />
                  </div>
                  <div>
                    <div className="agents-stat-value">{statsTerrain}</div>
                    <div className="agents-stat-label">Agents terrain</div>
                  </div>
                </div>
              </div>

              {/* ── Toolbar ── */}
              <div className="agents-toolbar">
                <div className="agents-search">
                  <SearchNormal1 size={16} variant="Linear" color="var(--color-text-muted)" />
                  <input
                    type="search"
                    id="agents-search-input"
                    name="agents-search-query"
                    autoComplete="off"
                    placeholder="Nom, email, organisation..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      debouncedSetSearch(e.target.value);
                    }}
                  />
                </div>

                <div className="agents-select-wrap">
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">Tous les rôles</option>
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                  <ArrowDown2 size={14} variant="Linear" color="var(--color-text-muted)" />
                </div>



                <div className="agents-select-wrap">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                  <ArrowDown2 size={14} variant="Linear" color="var(--color-text-muted)" />
                </div>

                <span className="agents-count-label">
                  {filtered.length} agent{filtered.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* ── Tableau ── */}
              {isDataLoading ? (
                <AgentTableSkeleton />
              ) : (
                <>
                  <div className="agents-table-wrap">
                    <table className="agents-table">
                      <thead>
                        <tr>
                          <th>Agent</th><th>Rôle</th><th>Organisation</th>
                          <th>Depuis</th><th>Statut</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAgents.map((agent, index) => {
                          const roleConfig = getRoleConfig(agent.role);
                          return (
                            <tr key={index}>
                              <td>
                                <div className="agents-cell-identity">
                                  {agent.avatar ? (
                                    <>
                                      <img
                                        src={agent.avatar}
                                        alt={agent.fullName}
                                        className="agents-avatar"
                                        style={{
                                          width: '32px',
                                          height: '32px',
                                          borderRadius: '50%',
                                          objectFit: 'cover',
                                          flexShrink: 0
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="agents-avatar" style={{ backgroundColor: agent.avatarColor, display: 'none' }}>
                                        {getInitials(agent.fullName)}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="agents-avatar" style={{ backgroundColor: agent.avatarColor }}>
                                      {getInitials(agent.fullName)}
                                    </div>
                                  )}
                                  <div>
                                    <span className="agents-full-name">{agent.fullName}</span>
                                    <span className="agents-email">{agent.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span
                                    className="agents-role"
                                    style={{ backgroundColor: `${roleConfig.color}18`, color: roleConfig.color }}
                                    title={roleConfig.description}
                                  >
                                    {roleConfig.label}
                                  </span>
                                  {roleConfig.mobileOnly && (
                                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '999px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      Mobile
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ fontSize: 'var(--font-size-body-small)', color: 'var(--color-text-secondary)' }}>
                                {agent.organisationName || '—'}
                              </td>
                              <td style={{ fontSize: 'var(--font-size-body-small)', color: 'var(--color-text-secondary)' }}>
                                {new Date(agent.joinedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td>
                                <span className={`agents-status agents-status-${agent.status}`}>
                                  <span className="agents-status-dot" />
                                  {agent.status === 'active' ? 'Actif' : 'Inactif'}
                                </span>
                              </td>
                              <td>
                                <div className="agents-row-actions">
                                  {!(
                                    (currentUser?.web_role === 'bureau_agent' || currentUser?.web_role === 'bureau' || currentUser?.web_role === 'agent_de_bureau') &&
                                    (agent.role === 'admin' || agent.role === 'super_admin' || agent.role === 'admin_organisation')
                                  ) && (
                                    <button
                                      className="agents-icon-btn agents-icon-btn-edit"
                                      onClick={(e) => openEdit(agent, e)}
                                      title="Modifier"
                                    >
                                      <Edit2 size={16} variant="Bold" color="var(--color-primary)" />
                                    </button>
                                  )}
                                  {(!(currentUser?.web_role === 'bureau_agent' || currentUser?.web_role === 'bureau' || currentUser?.web_role === 'agent_de_bureau') || agent.role === 'terrain') && (
                                    <button
                                      className="agents-icon-btn agents-icon-btn-delete"
                                      onClick={(e) => openDelete(agent, e)}
                                      title="Supprimer"
                                    >
                                      <Trash size={16} variant="Bold" color="var(--color-danger)" />
                                    </button>
                                  )}
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
