import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useSidebarState } from '../../hooks/useSidebarState';
import {
  SearchNormal1,
  Clock,
  TickCircle,
  CloseCircle,
  Briefcase,
  Calendar,
  MessageText1,
  ArrowRight2,
  CloseSquare,
  Building,
  Crown1,
  People,
  Eye,
  UserAdd,
  Send2,
  Import,
  Export,
  InfoCircle,
  Location
} from 'iconsax-react';
import { Header, Sidebar } from '../../components/layout';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText } from 'react-shimmer-effects';
import {
  listPartnerSuggestionsService,
  getPartnerSuggestionService,
  getMyPendingReceivedSuggestionsService,
  acceptPartnerSuggestionService,
  rejectPartnerSuggestionService,
  listDemandeDeCollaborationsService,
  getCollaborationDashboardService,
  acceptCollaborationService,
  rejectCollaborationService
} from './service/partner_service';
import { CollabIncidentDetailModal } from './modal/CollabIncidentDetailModal';
import './collaboration-requests.css';

const STATUS_META = {
  pending: {
    label: 'En attente',
    icon: Clock,
    color: '#F59E0B',
    className: 'status-pending'
  },
  accepted: {
    label: 'Active',
    icon: TickCircle,
    color: '#22C55E',
    className: 'status-accepted'
  },
  rejected: {
    label: 'Refusée',
    icon: CloseCircle,
    color: '#EF4444',
    className: 'status-rejected'
  },
  declined: {
    label: 'Refusée',
    icon: CloseCircle,
    color: '#EF4444',
    className: 'status-rejected'
  }
};

const ROLE_META = {
  leader: { label: 'Leader', icon: Crown1, color: '#F59E0B' },
  contributeur: { label: 'Contributeur', icon: People, color: '#3AA2DD' },
  observateur: { label: 'Observateur', icon: Eye, color: '#6C7278' },
  contributor: { label: 'Contributeur', icon: People, color: '#3AA2DD' },
  observer: { label: 'Observateur', icon: Eye, color: '#6C7278' }
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

const RequestCardSkeleton = () => (
  <div className="incident-centric-list" style={{ marginTop: '8px' }}>
    {[...Array(3)].map((_, idx) => (
      <section key={idx} className="incident-group-card" style={{ pointerEvents: 'none', border: '1px solid var(--color-border)' }}>
        <header className="incident-group-header" style={{ display: 'flex', gap: '16px', padding: '16px 20px', alignItems: 'center' }}>
          <ShimmerThumbnail height={110} width={140} rounded style={{ margin: 0 }} />
          <div className="incident-group-title-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShimmerText line={1} width={80} style={{ margin: 0 }} />
              <span style={{ color: 'var(--color-text-muted)' }}>•</span>
              <ShimmerText line={1} width={100} style={{ margin: 0 }} />
            </div>
            <ShimmerTitle line={1} gap={4} width={200} style={{ margin: 0 }} />
            <ShimmerText line={2} style={{ margin: 0 }} />
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <ShimmerThumbnail height={20} width={100} rounded style={{ margin: 0 }} />
              <ShimmerThumbnail height={20} width={120} rounded style={{ margin: 0 }} />
            </div>
          </div>
          <div className="incident-group-summary-side" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShimmerThumbnail height={30} width={30} rounded style={{ margin: 0 }} />
          </div>
        </header>
      </section>
    ))}
  </div>
);

export const CollaborationRequests = ({
  embedded = false
}) => {
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
  } = useSidebarState();

  const [localRequests, setLocalRequests] = useState([]);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedIncident, setExpandedIncident] = useState(null);
  const [selectedIncidentForModal, setSelectedIncidentForModal] = useState(null);

  // Modal de décision
  const [decisionRequest, setDecisionRequest] = useState(null);
  const [decisionAction, setDecisionAction] = useState(null); // 'accept' | 'reject' | null
  const [decisionClosing, setDecisionClosing] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [suggestionsStatus, setSuggestionsStatus] = useState({}); // {orgName: 'accepted' | 'rejected'}
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState(null);

  // Clé SWR pour la suggestion sélectionnée
  const [selectedSuggestionKey, setSelectedSuggestionKey] = useState(null);

  // SWR Calls
  const { data: pendingSuggestions, mutate: mutatePendingSuggestions, isLoading: loadingSuggestions } = useSWR(
    typeFilter === 'sug-received' || typeFilter === 'all' ? 'my-pending-received-suggestions' : null,
    getMyPendingReceivedSuggestionsService,
    { revalidateOnFocus: false }
  );

  const { data: activeCollabs, mutate: mutateActiveCollabs, isLoading: loadingCollabs } = useSWR(
    typeFilter === 'app-sent' || typeFilter === 'all' ? ['my-active-collaborations', {}] : null,
    ([, params]) => getCollaborationDashboardService(params),
    { revalidateOnFocus: false }
  );

  const { data: pendingInvitations, mutate: mutatePendingInvitations, isLoading: loadingInvitations } = useSWR(
    typeFilter === 'app-received' || typeFilter === 'all' ? ['my-pending-contributor-invitations', { status: 'pending', role: 'contributor' }] : null,
    ([, params]) => listDemandeDeCollaborationsService(params),
    { revalidateOnFocus: false }
  );

  const isDataLoading =
    ((typeFilter === 'sug-received' || typeFilter === 'all') && loadingSuggestions && !pendingSuggestions) ||
    ((typeFilter === 'app-sent' || typeFilter === 'all') && loadingCollabs && !activeCollabs) ||
    ((typeFilter === 'app-received' || typeFilter === 'all') && loadingInvitations && !pendingInvitations);

  useEffect(() => {
    if (typeFilter === 'all') {
      mutatePendingSuggestions();
      mutateActiveCollabs();
      mutatePendingInvitations();
    } else if (typeFilter === 'app-sent') {
      mutateActiveCollabs();
    } else if (typeFilter === 'app-received') {
      mutatePendingInvitations();
    } else if (typeFilter === 'sug-received') {
      mutatePendingSuggestions();
    }
  }, [typeFilter, mutatePendingSuggestions, mutateActiveCollabs, mutatePendingInvitations]);

  const { data: selectedSuggestionDetail } = useSWR(
    selectedSuggestionKey
      ? `partner-suggestion-${selectedSuggestionKey[0]}-${selectedSuggestionKey[1]}`
      : null,
    selectedSuggestionKey
      ? () => getPartnerSuggestionService(selectedSuggestionKey[0], selectedSuggestionKey[1])
      : null,
    { revalidateOnFocus: false }
  );

  const openDecision = (request, action = null) => {
    setDecisionRequest(request);
    setDecisionAction(action);
    setResponseText('');
    setDecisionClosing(false);
    setSuggestionsStatus({});
    setDecisionError(null);
    if (request?.incidentId && (request?.apiId || request?.id)) {
      setSelectedSuggestionKey([request.incidentId, request.apiId || request.id]);
    } else {
      setSelectedSuggestionKey(null);
    }
  };

  const closeDecision = () => {
    setDecisionClosing(true);
    setTimeout(() => {
      setDecisionRequest(null);
      setDecisionAction(null);
      setDecisionClosing(false);
      setResponseText('');
      setSuggestionsStatus({});
      setDecisionError(null);
    }, 280);
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!decisionRequest || !decisionAction) return;
    setIsSubmittingDecision(true);
    setDecisionError(null);

    const newStatus = decisionAction === 'accept' ? 'accepted' : 'rejected';

    try {
      if (typeof decisionRequest.id === 'string' && decisionRequest.id.startsWith('sug_received_')) {
        const suggestionId = decisionRequest.apiId;
        const incidentId = decisionRequest.incidentId;

        if (decisionAction === 'accept') {
          await acceptPartnerSuggestionService(incidentId, suggestionId);
        } else {
          await rejectPartnerSuggestionService(incidentId, suggestionId);
        }
        mutatePendingSuggestions();
      } else if (typeof decisionRequest.id === 'string' && decisionRequest.id.startsWith('invitation_pending_')) {
        const collaborationId = decisionRequest.apiId;

        if (decisionAction === 'accept') {
          await acceptCollaborationService(collaborationId);
        } else {
          await rejectCollaborationService(collaborationId);
        }
        mutatePendingInvitations();
      } else {
        setLocalRequests((prev) =>
          prev.map((r) =>
            r.id === decisionRequest.id
              ? {
                ...r,
                status: newStatus,
                respondedAt: new Date().toISOString(),
                response: responseText.trim() || null
              }
              : r
          )
        );
      }
      closeDecision();
    } catch (err) {
      console.error('[Decision] Erreur lors du traitement:', err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Une erreur est survenue lors de l'enregistrement de votre décision.";
      setDecisionError(msg);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Compile flat requests list
  const requests = [
    ...localRequests,
    ...(pendingSuggestions || []).map((item) => {
      const orgName = item.suggested_partner_name || item.partner_name || 'Partenaire';
      return {
        id: `sug_received_${item.id}`,
        type: 'suggestion',
        direction: 'received',
        projectTitle: item.incident_details?.title || item.incident_title || (item.incident_id ? `Incident #${item.incident_id}` : 'Incident sans titre'),
        projectImage: item.incident_details?.photo || item.incident_details?.image || '',
        organisation: orgName,
        organisationInitials: getInitials(orgName),
        organisationColor: '#3AA2DD',
        suggestedBy: item.suggested_by_name || 'Leader',
        suggestedByRole: item.suggested_by_role || 'Leader',
        suggestionMessage: item.justification || item.message || 'Pas de message.',
        role: (item.suggested_role || item.role || 'contributor') === 'leader' ? 'Leader' : ((item.suggested_role || item.role || 'contributor') === 'observer' || (item.suggested_role || item.role || 'contributor') === 'observateur') ? 'Observateur' : 'Contributeur',
        proposedCollaborators: (item.proposed_collaborators || []).map((pc) => ({
          name: pc.partner_name || 'Partenaire',
          initials: getInitials(pc.partner_name || 'PT'),
          color: '#10B981',
          role: pc.role || 'contributeur',
          comment: pc.justification || ''
        })),
        status: item.status || 'pending',
        submittedAt: item.created_at || new Date().toISOString(),
        respondedAt: item.updated_at || null,
        response: item.response_message || null,
        incidentId: item.incident_id || item.incident,
        apiId: item.id,
        incidentDetails: item.incident_details,
        predictionDetails: item.prediction_details,
        userFullName: item.user_full_name,
        userEmail: item.user_email,
        organisationId: item.organisation_id,
        organisationName: item.organisation_name || orgName
      };
    }),
    ...(activeCollabs || []).map((item) => {
      const orgName = item.organisation_name || item.leader_name || 'Organisation sans nom';
      const projTitle = item.incident_details?.title || item.incident_title || (item.incident_id ? `Incident #${item.incident_id}` : 'Incident sans titre');
      const projImg = item.incident_details?.photo || item.incident_details?.image || '';
      return {
        id: `collab_active_${item.id}`,
        direction: 'sent',
        projectTitle: projTitle,
        projectImage: projImg,
        organisation: orgName,
        organisationInitials: getInitials(orgName),
        organisationColor: '#22C55E',
        role: item.role === 'leader' ? 'Leader' : (item.role === 'contributor' || item.role === 'contributeur') ? 'Contributeur' : 'Observateur',
        motif: item.justification || item.motivation || 'Collaboration acceptée en cours.',
        status: item.status || 'accepted',
        submittedAt: item.created_at || new Date().toISOString(),
        respondedAt: item.updated_at || null,
        response: null,
        incidentId: item.incident_details?.id || item.incident_id || item.incident,
        apiId: item.id,
        incidentDetails: item.incident_details,
        predictionDetails: item.prediction_details,
        userFullName: item.user_full_name,
        userEmail: item.user_email,
        organisationId: item.organisation_id,
        organisationName: item.organisation_name || orgName
      };
    }),
    ...(pendingInvitations || []).map((item) => {
      const orgName = item.organisation_name || item.leader_name || 'Organisation sans nom';
      const projTitle = item.incident_details?.title || item.incident_title || (item.incident_id ? `Incident #${item.incident_id}` : 'Incident sans titre');
      const projImg = item.incident_details?.photo || item.incident_details?.image || '';
      return {
        id: `invitation_pending_${item.id}`,
        direction: 'received',
        applicantName: item.user_full_name || item.invited_member_name || 'Membre',
        applicantOrg: orgName,
        projectTitle: projTitle,
        projectImage: projImg,
        organisation: orgName,
        organisationInitials: getInitials(orgName),
        organisationColor: '#F59E0B',
        role: item.role === 'leader' ? 'Leader' : (item.role === 'contributor' || item.role === 'contributeur') ? 'Contributeur' : 'Observateur',
        motif: item.justification || item.motivation || 'Invitation en attente de réponse.',
        status: item.status || 'pending',
        submittedAt: item.created_at || new Date().toISOString(),
        respondedAt: null,
        response: null,
        incidentId: item.incident_details?.id || item.incident_id || item.incident,
        apiId: item.id,
        incidentDetails: item.incident_details,
        predictionDetails: item.prediction_details,
        userFullName: item.user_full_name,
        userEmail: item.user_email,
        organisationId: item.organisation_id,
        organisationName: item.organisation_name || orgName
      };
    })
  ].filter(r => r.status !== 'accepted');

  const q = search.trim().toLowerCase();
  const filtered = requests.filter((r) => {
    const isSuggestion = r.type === 'suggestion';
    const isSent = r.direction === 'sent';
    if (typeFilter === 'app-sent' && (isSuggestion || !isSent)) return false;
    if (typeFilter === 'app-received' && (isSuggestion || isSent)) return false;
    if (typeFilter === 'sug-sent' && (!isSuggestion || !isSent)) return false;
    if (typeFilter === 'sug-received' && (!isSuggestion || isSent)) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!q) return true;
    return (
      r.projectTitle.toLowerCase().includes(q) ||
      r.organisation.toLowerCase().includes(q) ||
      (r.role || r.proposedRole || '').toLowerCase().includes(q) ||
      (r.applicantName || '').toLowerCase().includes(q) ||
      (r.applicantOrg || '').toLowerCase().includes(q)
    );
  });

  // Incident-centric grouping
  const groupedIncidents = [];
  const incidentsMap = {};

  filtered.forEach((r) => {
    const incidentId = r.incidentId || 'unknown';
    if (!incidentsMap[incidentId]) {
      incidentsMap[incidentId] = {
        id: incidentId,
        projectTitle: r.projectTitle || 'Incident sans titre',
        projectImage: r.projectImage || '',
        leader: null,
        userCollab: null,
        otherCollabs: [],
        suggestions: [],
        incidentDetails: r.incidentDetails,
        predictionDetails: r.predictionDetails
      };
      groupedIncidents.push(incidentsMap[incidentId]);
    }

    const group = incidentsMap[incidentId];
    if (r.incidentDetails && !group.incidentDetails) {
      group.incidentDetails = r.incidentDetails;
    }
    if (r.predictionDetails && !group.predictionDetails) {
      group.predictionDetails = r.predictionDetails;
    }

    if (r.type === 'suggestion') {
      group.suggestions.push(r);
    } else {
      if (r.role?.toLowerCase() === 'leader' && r.status === 'accepted') {
        group.leader = {
          name: r.applicantName || r.organisation || 'Leader',
          org: r.applicantOrg || r.organisation,
          color: r.organisationColor || '#F59E0B'
        };
      }
      const isForCurrentUser = r.direction === 'sent' || (r.direction === 'received' && !r.applicantName);
      if (isForCurrentUser) {
        group.userCollab = r;
      } else {
        group.otherCollabs.push(r);
      }
    }
  });

  // Resolve leader presence
  groupedIncidents.forEach((group) => {
    if (group.userCollab && group.userCollab.role?.toLowerCase() === 'leader') {
      group.leader = {
        name: 'Vous',
        isMe: true,
        color: '#F59E0B'
      };
    }
    if (!group.leader) {
      const activeLeader = group.otherCollabs.find(oc => oc.role?.toLowerCase() === 'leader' && oc.status === 'accepted');
      if (activeLeader) {
        group.leader = {
          name: activeLeader.applicantName || activeLeader.organisation || 'Leader',
          org: activeLeader.applicantOrg || activeLeader.organisation,
          color: activeLeader.organisationColor || '#F59E0B'
        };
      }
    }
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    accepted: requests.filter((r) => r.status === 'accepted').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    appSent: requests.filter((r) => r.type !== 'suggestion' && r.direction === 'sent').length,
    appReceived: requests.filter((r) => r.type !== 'suggestion' && r.direction === 'received').length,
    sugSent: requests.filter((r) => r.type === 'suggestion' && r.direction === 'sent').length,
    sugReceived: requests.filter((r) => r.type === 'suggestion' && r.direction === 'received').length
  };

  const content = (
    <>
      {!embedded && (
        <div className="requests-page-header">
          <div>
            <h1 className="requests-title">Demandes de collaboration</h1>
            <p className="requests-subtitle">
              Gérez vos demandes de participation et suivez les rôles associés aux incidents.
            </p>
          </div>
        </div>
      )}


      {/* Toolbar */}
      <div className="requests-toolbar">
        <div className="requests-search">
          <SearchNormal1 size={18} variant="Linear" color="#6C7278" style={{ color: '#6C7278' }} />
          <input
            type="text"
            placeholder="Rechercher un incident, rôle, organisation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="requests-filters">
          <button
            type="button"
            className={`requests-filter-pill ${statusFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Toutes
            <span className="requests-filter-count">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`requests-filter-pill ${statusFilter === 'pending' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            <Clock size={14} variant="Bold" color="currentColor" style={{ color: 'currentColor' }} />
            En attente
            <span className="requests-filter-count">{counts.pending}</span>
          </button>
          <button
            type="button"
            className={`requests-filter-pill ${statusFilter === 'accepted' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('accepted')}
          >
            <TickCircle size={14} variant="Bold" color="currentColor" style={{ color: 'currentColor' }} />
            Actives
            <span className="requests-filter-count">{counts.accepted}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Info Banner (Scenarios 2 & 3 Explanation) */}
      {showInfoBanner && (
        <div className="collaboration-info-banner">
          <div className="info-banner-content">
            <InfoCircle size={24} variant="Bold" className="info-banner-icon" style={{ color: 'var(--color-primary)' }} />
            <div className="info-banner-text">
              <h4>Règles de collaboration sur les Incidents</h4>
              <p>
                <strong>1. Sans Leader :</strong> Si aucun leader n'a encore pris l'incident en charge, toute demande d'observation ou de contribution est <strong>automatiquement acceptée</strong>.
              </p>
              <p>
                <strong>2. Prise en charge par un Leader :</strong> Dès qu'une organisation prend en charge l'incident en tant que <strong>Leader</strong>, toutes les contributions existantes repassent en status <strong>"En attente"</strong> pour lui permettre de les valider manuellement. Les observateurs restent actifs.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="info-banner-close"
            onClick={() => setShowInfoBanner(false)}
            aria-label="Fermer"
          >
            <CloseCircle size={20} variant="Linear" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>
      )}

      {/* Grouped Incident List */}
      {isDataLoading ? (
        <RequestCardSkeleton />
      ) : groupedIncidents.length === 0 ? (
        <div className="requests-empty">
          <Briefcase size={48} variant="Linear" color="#9CA3AF" style={{ color: '#9CA3AF' }} />
          <p>Aucune collaboration ne correspond à vos critères.</p>
        </div>
      ) : (
        <div className="incident-centric-list">
          {groupedIncidents.map((incident) => {
            const isExpanded = expandedIncident === incident.id;
            const hasLeader = !!incident.leader;
            const isUserLeader = incident.leader?.isMe;

            // Status details for user's own participation
            const myCollab = incident.userCollab;
            const meta = myCollab ? STATUS_META[myCollab.status] : null;
            const myRoleKey = myCollab?.role?.toLowerCase() === 'leader' ? 'leader' :
              (myCollab?.role?.toLowerCase() === 'contributeur' || myCollab?.role?.toLowerCase() === 'contributor') ? 'contributor' : 'observer';
            const myRoleMeta = myCollab ? ROLE_META[myRoleKey] : null;

            // Find other accepted collaborators
            const acceptedOthers = incident.otherCollabs.filter(c => c.status === 'accepted');
            const pendingOthers = incident.otherCollabs.filter(c => c.status === 'pending');

            const showAcceptReject = myCollab && myCollab.incidentDetails?.taken_by && myCollab.organisationId && Number(myCollab.incidentDetails.taken_by) === Number(myCollab.organisationId);

            return (
              <section
                key={incident.id}
                className={`incident-group-card ${isExpanded ? 'is-expanded' : ''} ${hasLeader ? 'has-leader' : 'no-leader'}`}
              >
                {/* Incident Group Header */}
                <header
                  className="incident-group-header"
                  onClick={() => setExpandedIncident(isExpanded ? null : incident.id)}
                >
                  <div
                    className="incident-group-thumb"
                    style={incident.projectImage ? { backgroundImage: `url(${incident.projectImage})` } : {}}
                  >
                    {myCollab && meta && (
                      <span className={`request-status-badge ${meta.className}`} style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        padding: '3px 8px',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        backgroundColor: meta.color,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}>
                        {meta.label}
                      </span>
                    )}
                  </div>

                  <div className="incident-group-title-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {incident.incidentDetails?.type || 'COLLABORATION'}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                        <Location size={12} variant="Bold" color="#6C7278" style={{ color: '#6C7278' }} />
                        {incident.incidentDetails?.zone || incident.incidentDetails?.location || 'Localisation non spécifiée'}
                      </span>
                    </div>

                    <h3 className="incident-group-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                      {incident.projectTitle}
                    </h3>

                    <p style={{
                      margin: 0,
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineClamp: 2,
                      overflow: 'hidden'
                    }}>
                      {incident.incidentDetails?.description || 'Aucune description disponible.'}
                    </p>

                    <div className="incident-group-status-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {/* User's own role badge if participating */}
                      {myCollab && myRoleMeta && (
                        <span className="my-participation-badge" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: myRoleMeta.color,
                          borderColor: 'transparent',
                          backgroundColor: `${myRoleMeta.color}15`
                        }}>
                          <People size={13} variant="Bold" color={myRoleMeta.color} style={{ color: myRoleMeta.color }} />
                          Rôle : {myCollab.role}
                        </span>
                      )}

                      {incident.leader && (
                        <span className="leader-badge" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#92400E',
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          border: 'none'
                        }}>
                          <Crown1 size={13} variant="Bold" color="#F59E0B" style={{ color: '#F59E0B' }} />
                          Leader : {incident.leader.name}
                        </span>
                      )}

                      {(myCollab?.organisationName || myCollab?.organisation) && (
                        <span className="my-participation-badge" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: 'var(--color-text-secondary)',
                          borderColor: 'transparent',
                          backgroundColor: 'rgba(108, 114, 120, 0.08)'
                        }}>
                          <Building size={13} variant="Bold" color="#6C7278" style={{ color: '#6C7278' }} />
                          {myCollab.organisationName || myCollab.organisation}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="incident-group-summary-side" onClick={(e) => e.stopPropagation()}>
                    {/* Accept/Reject buttons */}
                    {showAcceptReject && myCollab.status === 'pending' && (
                      <div className="header-action-buttons" style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
                        <button
                          type="button"
                          className="btn-card-accept"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#22C55E',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={() => openDecision(myCollab, 'accept')}
                        >
                          <TickCircle size={14} variant="Bold" style={{ color: '#FFFFFF' }} />
                          Accepter
                        </button>
                        <button
                          type="button"
                          className="btn-card-reject"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#EF4444',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={() => openDecision(myCollab, 'reject')}
                        >
                          <CloseSquare size={14} variant="Bold" style={{ color: '#FFFFFF' }} />
                          Refuser
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      className={`incident-group-toggle ${isExpanded ? 'is-open' : ''}`}
                      onClick={() => setExpandedIncident(isExpanded ? null : incident.id)}
                      aria-label={isExpanded ? 'Réduire' : 'Développer'}
                    >
                      <ArrowRight2 size={18} />
                    </button>
                  </div>
                </header>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="incident-group-body">
                    <div className="incident-details-grid">
                      {/* Left: Your collaboration state details */}
                      <div className="grid-column my-collab-details">
                        <h4 className="detail-section-title">Votre participation</h4>
                        {myCollab ? (
                          <div className="my-collab-info-box">
                            <p className="my-collab-motif">
                              <strong>Votre motif :</strong> "{myCollab.motif || myCollab.suggestionMessage || 'Aucun motif renseigné'}"
                            </p>

                            {/* Contextual pending/accepted help text depending on Leader presence (Scenarios 2 & 3) */}
                            <div className="scenario-explanation-box">
                              {myCollab.status === 'pending' ? (
                                <p className="status-note status-pending">
                                  <Clock size={16} variant="Bold" style={{ color: '#92400E' }} />
                                  {myCollab.incidentDetails?.etat === "taken_into_account" ? (
                                    <>
                                      En attente de validation par le leader {incident.leader?.name && (<strong>({incident.leader.name})</strong>)}
                                    </>
                                  ) : (
                                    <>
                                      En attente. En l'absence de leader, votre demande sera acceptée automatiquement.
                                    </>
                                  )}
                                </p>
                              ) : myCollab.status === 'accepted' ? (
                                <p className="status-note status-accepted">
                                  {myCollab.role?.toLowerCase() === 'observer' || myCollab.role?.toLowerCase() === 'observateur' ? (
                                    <>Participation active en tant qu'observateur (Toujours approuvée).</>
                                  ) : hasLeader ? (
                                    <>Approuvée par le leader (<strong>{incident.leader.name}</strong>).</>
                                  ) : (
                                    <>Active (Auto-acceptée car aucun leader n'est désigné sur l'incident).</>
                                  )}
                                </p>
                              ) : (
                                <p className="status-note status-rejected">
                                  Collaboration refusée. {myCollab.response && `Motif : "${myCollab.response}"`}
                                </p>
                              )}
                            </div>

                            {/* Actions buttons inside details box */}
                            {showAcceptReject && myCollab.status === 'pending' && (
                              <div className="collab-action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                <button
                                  type="button"
                                  className="btn-card-accept"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: '#22C55E',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                  }}
                                  onClick={() => openDecision(myCollab, 'accept')}
                                >
                                  <TickCircle size={16} variant="Bold" style={{ color: '#FFFFFF' }} />
                                  Accepter
                                </button>
                                <button
                                  type="button"
                                  className="btn-card-reject"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: '#EF4444',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '13px'
                                  }}
                                  onClick={() => openDecision(myCollab, 'reject')}
                                >
                                  <CloseSquare size={16} variant="Bold" style={{ color: '#FFFFFF' }} />
                                  Refuser
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="no-participation-text">Vous ne participez pas encore à cet incident.</p>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ marginTop: '12px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncidentForModal(incident);
                          }}
                        >
                          Voir incident
                        </button>
                      </div>

                      {/* Center: Collaborators Stack */}
                      <div className="grid-column collaborators-section">
                        <h4 className="detail-section-title">Collaborateurs actifs ({acceptedOthers.length})</h4>
                        {acceptedOthers.length === 0 ? (
                          <p className="no-collabs-text">Aucun autre collaborateur actif.</p>
                        ) : (
                          <div className="collabs-avatar-grid">
                            {acceptedOthers.map((collab, idx) => {
                              const key = collab.role?.toLowerCase() === 'leader' ? 'leader' :
                                (collab.role?.toLowerCase() === 'contributeur' || collab.role?.toLowerCase() === 'contributor') ? 'contributor' : 'observer';
                              const roleMeta = ROLE_META[key];
                              return (
                                <div key={idx} className="collab-avatar-card" title={`${collab.organisation || collab.applicantName} - ${collab.role}`}>
                                  <div className="avatar-bubble" style={{ backgroundColor: collab.organisationColor || '#6C7278' }}>
                                    {collab.organisationInitials || getInitials(collab.organisation || 'PT')}
                                  </div>
                                  <div className="avatar-details">
                                    <span className="collab-name">{collab.organisation || collab.applicantName}</span>
                                    <span className="collab-role" style={{ color: roleMeta?.color }}>
                                      {roleMeta?.label || collab.role}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Right: Validation Actions for Leader or Suggestions */}
                      <div className="grid-column actions-section">
                        {/* Scenario validation box for leaders */}
                        {isUserLeader ? (
                          <>
                            <h4 className="detail-section-title text-gold">Demandes à valider ({pendingOthers.length})</h4>
                            {pendingOthers.length === 0 ? (
                              <p className="no-actions-text">Aucune demande en attente de votre décision.</p>
                            ) : (
                              <div className="leader-pending-requests">
                                {pendingOthers.map((pendingReq) => (
                                  <div key={pendingReq.id} className="leader-action-box">
                                    <div className="leader-action-info">
                                      <strong>{pendingReq.applicantName || pendingReq.organisation}</strong>
                                      <span className="request-role-badge contribution-pill">
                                        {pendingReq.role}
                                      </span>
                                    </div>
                                    <p className="leader-action-motif">"{pendingReq.motif}"</p>

                                    <div className="leader-action-buttons">
                                      <button
                                        type="button"
                                        className="btn-action-accept"
                                        onClick={() => openDecision(pendingReq)}
                                      >
                                        Accepter / Rejeter
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <h4 className="detail-section-title">Suggestions de partenaires ({incident.suggestions.length})</h4>
                            {incident.suggestions.length === 0 ? (
                              <p className="no-actions-text">Aucune suggestion pour cet incident.</p>
                            ) : (
                              <div className="incident-suggestions-list">
                                {incident.suggestions.map((sug) => (
                                  <div key={sug.id} className="sug-action-card">
                                    <div className="sug-card-header">
                                      <strong>{sug.organisation}</strong>
                                      <span className="sug-count">Rôle suggéré : {sug.role}</span>
                                    </div>
                                    <p className="sug-justification">"{sug.suggestionMessage}"</p>

                                    {sug.status === 'pending' && (
                                      <button
                                        type="button"
                                        className="sug-action-btn"
                                        onClick={() => openDecision(sug)}
                                      >
                                        Traiter la suggestion
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Decision modal */}
      {decisionRequest && (
        <div
          className={`decision-modal-overlay ${decisionClosing ? 'closing' : ''}`}
          onClick={closeDecision}
        >
          <aside
            className={`decision-modal ${decisionAction ? (decisionAction === 'accept' ? 'is-accept' : 'is-reject') : ''} ${decisionClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Répondre"
          >
            <header className="decision-modal-header">
              <div>
                <h3 className="decision-modal-title">
                  {decisionRequest.type === 'suggestion' ? 'Traiter la suggestion' : 'Répondre à la demande'}
                </h3>
                <p className="decision-modal-subtitle">
                  {decisionRequest.projectTitle}
                </p>
              </div>
              <button
                type="button"
                className="decision-modal-close"
                onClick={closeDecision}
                aria-label="Fermer"
              >
                <CloseCircle size={22} variant="Linear" color="#1A1C1E" style={{ color: '#1A1C1E' }} />
              </button>
            </header>

            <form
              className="decision-modal-form"
              onSubmit={handleConfirmDecision}
            >
              <div className="decision-modal-body">
                {decisionError && (
                  <div className="am-alert am-alert--danger" role="alert" style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CloseCircle size={18} variant="Bold" color="var(--color-danger)" style={{ color: 'var(--color-danger)' }} />
                    <span className="am-alert__message">{decisionError}</span>
                  </div>
                )}

                <div className="decision-summary">
                  <div
                    className="decision-summary-avatar"
                    style={{ backgroundColor: decisionRequest.organisationColor }}
                  >
                    {decisionRequest.organisationInitials}
                  </div>
                  <div>
                    <span className="decision-summary-org">
                      {decisionRequest.organisation || decisionRequest.applicantName}
                    </span>
                    <span className="decision-summary-role">
                      {decisionRequest.type === 'suggestion' ? (
                        <>Rôle suggéré : <strong>{decisionRequest.role}</strong></>
                      ) : (
                        <>Rôle : <strong>{decisionRequest.role}</strong></>
                      )}
                    </span>
                  </div>
                </div>

                <div className="decision-motif">
                  <h4 className="decision-block-label">
                    {decisionRequest.type === 'suggestion' ? 'Justification de la suggestion' : 'Motif de participation'}
                  </h4>
                  <p className="decision-motif-text">
                    {decisionRequest.type === 'suggestion' ? decisionRequest.suggestionMessage : decisionRequest.motif}
                  </p>
                </div>

                {/* Suggestions display */}
                {decisionRequest.type === 'suggestion' && (
                  <div className="decision-proposed">
                    <h4 className="decision-block-label">Organisation suggérée</h4>
                    <div className="proposed-collabs-list">
                      <div className="proposed-collab-card">
                        <div className="proposed-collab-header">
                          <div className="proposed-collab-avatar" style={{ backgroundColor: decisionRequest.organisationColor }}>
                            {decisionRequest.organisationInitials}
                          </div>
                          <div className="proposed-collab-info">
                            <span className="proposed-collab-name">{decisionRequest.organisation}</span>
                            <span className="proposed-collab-role" style={{ color: ROLE_META[decisionRequest.role?.toLowerCase()]?.color || '#3AA2DD' }}>
                              Rôle : {ROLE_META[decisionRequest.role?.toLowerCase()]?.label || decisionRequest.role}
                            </span>
                          </div>
                        </div>
                        {decisionRequest.suggestedBy && (
                          <p className="proposed-collab-comment" style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Suggéré par : {decisionRequest.suggestedBy} ({decisionRequest.suggestedByRole})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="decision-choice-group" role="radiogroup">
                  <h4 className="decision-block-label">Votre décision</h4>
                  <div className="decision-choices">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={decisionAction === 'accept'}
                      className={`decision-choice is-accept ${decisionAction === 'accept' ? 'is-selected' : ''}`}
                      onClick={() => setDecisionAction('accept')}
                    >
                      <TickCircle size={22} variant="Bold" color={decisionAction === 'accept' ? '#FFFFFF' : '#22C55E'} style={{ color: decisionAction === 'accept' ? '#FFFFFF' : '#22C55E' }} />
                      <span>Accepter</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={decisionAction === 'reject'}
                      className={`decision-choice is-reject ${decisionAction === 'reject' ? 'is-selected' : ''}`}
                      onClick={() => setDecisionAction('reject')}
                    >
                      <CloseSquare size={22} variant="Bold" color={decisionAction === 'reject' ? '#FFFFFF' : '#EF4444'} style={{ color: decisionAction === 'reject' ? '#FFFFFF' : '#EF4444' }} />
                      <span>Refuser</span>
                    </button>
                  </div>
                </div>

                <label htmlFor="decision-response" className="decision-label">
                  Message de réponse <span className="decision-optional">(optionnel)</span>
                </label>
                <textarea
                  id="decision-response"
                  className="decision-textarea"
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Saisissez votre réponse..."
                />
              </div>

              <footer className="decision-modal-footer">
                <button
                  type="button"
                  className="decision-btn-secondary"
                  onClick={closeDecision}
                  disabled={isSubmittingDecision}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`decision-btn-primary ${decisionAction === 'accept' ? 'is-accept' : decisionAction === 'reject' ? 'is-reject' : ''}`}
                  disabled={!decisionAction || isSubmittingDecision}
                >
                  {isSubmittingDecision && (
                    <span className="spinner-mini" />
                  )}
                  {decisionAction === 'reject' ? 'Confirmer le refus' : 'Confirmer l\'acceptation'}
                </button>
              </footer>
            </form>
          </aside>
        </div>
      )}
      {/* Incident Detail Modal */}
      {selectedIncidentForModal && (
        <CollabIncidentDetailModal
          incident={selectedIncidentForModal}
          onClose={() => setSelectedIncidentForModal(null)}
        />
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="requests-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div className={`requests-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="requests-content">
          <div className="requests-page">
            {content}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CollaborationRequests;
