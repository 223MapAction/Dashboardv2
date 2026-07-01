import React, { useMemo } from 'react';
import useSWR from 'swr';
import { SearchNormal1, ArrowDown2 } from 'iconsax-react';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerCircularImage } from 'react-shimmer-effects';
import { Eye, Edit2, Trash } from 'iconsax-react';
import { BlurryImage } from '../../../../components/atoms/BlurryImage';
import { useIncidentModalContext } from '../../modale/IncidentModalContext';
import { authService } from '../../../auth/services/authService';
import { getCollaborationsService } from '../../service/collaboration_service';
import Pagination from '../../../../components/molecules/Pagination';
import './incident-list.css';

// Composant shimmer pour le chargement (version table)
const IncidentTableSkeleton = () => (
  <div className="incident-table-wrap">
    <table className="incident-table">
      <thead>
        <tr>
          <th>Incident</th>
          <th>Localisation</th>
          <th>Date de déclaration</th>
          <th>Date de résolution</th>
          <th>Statut</th>
          <th>Prise en charge & Collaboration</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {[...Array(5)].map((_, idx) => (
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
            <td><ShimmerText line={1} width={80} /></td>
            <td><ShimmerText line={1} width={80} /></td>
            <td><ShimmerThumbnail height={24} width={80} rounded /></td>
            <td><ShimmerText line={2} width={120} /></td>
            <td><ShimmerCircularImage size={32} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const IncidentList = ({
  incidents = [],
  onSelectIncident,
  selectedId,
  isLoading = false,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  page,
  setPage,
  pageSize,
  count
}) => {
  const { openDeleteModal, openAssignModal } = useIncidentModalContext();
  const user = authService.getCurrentUser();
  const isSuperAdmin = user?.web_role === 'super_admin';
  const orgRole = isSuperAdmin ? 'super_admin' : user?.org_role;
  const isAdmin = orgRole === 'org_admin' || orgRole === 'bureau_agent';

  const currentUserId = user?.id;
  const myOrgId = user?.organisation_member;
  const myOrgName = user?.organisation_name || 'Mon Organisation';

  const { data: collaborations } = useSWR(
    'collaborations',
    getCollaborationsService
  );

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      const matchesStatus =
        !statusFilter ||
        i.etat === statusFilter;

      return matchesStatus;
    });
  }, [incidents, statusFilter]);

  return (
    <section className="project-list-section">
      {/* Header */}
      <header className="project-list-header">
        <h1 className="project-list-title">Incidents</h1>
        <p className="project-list-subtitle">
          Rejoignez des initiatives environnementales en cours ou proposez votre
          expertise pour soutenir les communautés locales.
        </p>
      </header>

      {/* Filters bar */}
      <div className="project-filters">
        <div className="project-search">
          <SearchNormal1 size={18} variant="Linear" color="#6C7278" />
          <input
            type="search"
            id="incidents-search-input"
            name="incidents-search-query"
            autoComplete="off"
            placeholder="Rechercher un incident, une commune..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="project-filters-row">

          <div className="project-select">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="declared">Déclaré</option>
              <option value="taken_into_account">Pris en compte</option>
              <option value="resolved">Résolu</option>
            </select>
            <ArrowDown2 size={16} variant="Linear" color="#6C7278" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 var(--spacing-5) var(--spacing-5)' }}>
        {isLoading ? (
          <IncidentTableSkeleton />
        ) : filtered.length === 0 ? (
          <div className='d-flex flex-column align-items-center'>
            <div className='mb-2'>
              <SearchNormal1 size={48} variant="Linear" color="var(--color-text-muted)" />
            </div>
            <p>Aucun incident ne correspond à vos critères.</p>
          </div>
        ) : (
          <div className="incident-table-wrap">
            <table className="incident-table">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Localisation</th>
                  <th>Date de déclaration</th>
                  <th>Date de résolution</th>
                  <th>Statut</th>
                  <th>Gravité</th>
                  <th>Prise en charge & Collaboration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((incident) => {

                  const getTakingOrg = (inc) => {
                    if (!inc.taken_by_organisation && !inc.taken_by) return null;

                    let isMe = false;
                    let name = '';

                    const takenOrgId = inc.taken_by_organisation?.id;
                    const takenOrgName = inc.taken_by_organisation?.name;

                    if (myOrgId && takenOrgId && String(takenOrgId) === String(myOrgId)) {
                      isMe = true;
                    }

                    if (isMe) {
                      name = myOrgName;
                    } else {
                      name = takenOrgName || inc.taken_by_name || '';
                    }

                    return { isMe, name };
                  };

                  const takingOrg = getTakingOrg(incident);
                  const collabList = Array.isArray(collaborations)
                    ? collaborations
                    : Array.isArray(collaborations?.results)
                      ? collaborations.results
                      : [];
                  const collabRequest = collabList.find(c => c.incident === incident.id);

                  return (
                    <tr
                      key={incident.id}
                      onClick={() => onSelectIncident && onSelectIncident(incident)}
                      className={incident.id === selectedId ? 'is-selected' : ''}
                    >
                      <td>
                        <div className="incident-table-main-col">
                          <BlurryImage
                            src={incident.thumbnail ||  ""}
                            alt={incident.title}
                            className="incident-table-img"
                          />
                          <div>
                            <span className="incident-table-title">
                              {incident.title || 'Sans titre'}
                              {incident.isOwner ? (
                                <span className="incident-owner-tag" style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', background: 'var(--color-primary)', color: 'white', borderRadius: '4px' }}>Moi</span>
                              ) : incident.takenBy ? (
                                <span className="incident-owner-tag" style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', background: '#9CA3AF', color: 'white', borderRadius: '4px' }}>Autre</span>
                              ) : null}
                            </span>
                            <span className="incident-table-subtitle">{incident.description?.substring(0, 50)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="incident-table-cell-text">
                        {incident.location || 'Inconnue'}
                        {incident.coordinates && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {incident.coordinates.lat.toFixed(3)}, {incident.coordinates.lng.toFixed(3)}
                          </div>
                        )}
                      </td>
                      <td className="incident-table-cell-text">{incident.startDate}</td>
                      <td className="incident-table-cell-text">
                        {incident.endDate === 'En cours' ? (
                          <span className="incident-date-badge is-pending">En cours</span>
                        ) : (
                          <span className="incident-date-badge is-resolved">{incident.endDate}</span>
                        )}
                      </td>
                      <td>
                        <div className="incident-table-badges">
                          {incident.badges?.map((b, idx) => (
                            <span key={idx} className={`incident-badge-glow variant-${b.variant}`}>
                              {b.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="incident-table-badges">
                          {(() => {
                            if (incident.severity === 'high') {
                              return <span className="incident-badge-glow" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Élevée</span>;
                            }
                            if (incident.severity === 'medium') {
                              return <span className="incident-badge-glow" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>Moyenne</span>;
                            }
                            return <span className="incident-badge-glow" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--color-success)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>Faible</span>;
                          })()}
                        </div>
                      </td>
                      <td className="incident-table-cell-text" style={{ minWidth: '260px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {takingOrg ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                  {takingOrg.name}
                                </span>
                                {takingOrg.isMe ? (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    background: 'rgba(34, 197, 94, 0.12)',
                                    color: 'var(--color-success)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                  }}>
                                    Moi
                                  </span>
                                ) : (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    background: 'rgba(108, 114, 120, 0.12)',
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid rgba(108, 114, 120, 0.3)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600'
                                  }}>
                                    Autre
                                  </span>
                                )}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: 'var(--color-text-secondary)',
                                marginTop: '4px',
                                fontStyle: 'italic',
                                lineHeight: '1.4'
                              }}>
                                {(() => {
                                  const mode = incident.take_in_charge_mode;
                                  const isInternal = mode === 'internal' || mode === 'interne';
                                  const isCollaborative = mode === 'collaborative' || mode === 'collaboratif';
                                  if (isInternal) {
                                    return takingOrg.isMe
                                      ? "Nous travaillons en interne sur cet incident avec nos équipes"
                                      : `${takingOrg.name} travaille déjà en interne sur cet incident avec ses équipes`;
                                  } else if (isCollaborative) {
                                    return takingOrg.isMe
                                      ? "Nous collaborons avec d'autres organisations sur cet incident"
                                      : `${takingOrg.name} collabore avec d'autres organisations sur cet incident`;
                                  } else {
                                    return takingOrg.isMe
                                      ? "Pris en charge par notre organisation"
                                      : `Pris en charge par ${takingOrg.name}`;
                                  }
                                })()}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                              Disponible
                            </span>
                          )}

                          {collabRequest && (
                            <div style={{ marginTop: '2px' }}>
                              {(() => {
                                const role = collabRequest.role || '';
                                const status = collabRequest.status || 'pending';

                                const getRoleLabel = (r) => {
                                  const norm = r.toLowerCase();
                                  if (norm === 'leader') return 'Leader';
                                  if (norm === 'contributor' || norm === 'contributeur') return 'Contributeur';
                                  if (norm === 'observer' || norm === 'observateur') return 'Observateur';
                                  return r;
                                };

                                const getStatusLabel = (s) => {
                                  const norm = s.toLowerCase();
                                  if (norm === 'accepted' || norm === 'in-progress') return 'Acceptée';
                                  if (norm === 'pending') return 'En attente';
                                  if (norm === 'rejected' || norm === 'refused') return 'Refusée';
                                  return s;
                                };

                                const isAccepted = status === 'accepted' || status === 'in-progress';
                                const isPending = status === 'pending';
                                const isRejected = status === 'rejected' || status === 'refused';

                                let badgeColor = 'var(--color-text-secondary)';
                                let badgeBg = 'rgba(108, 114, 120, 0.1)';
                                let badgeBorder = 'rgba(108, 114, 120, 0.2)';

                                if (isAccepted) {
                                  badgeColor = 'var(--color-success)';
                                  badgeBg = 'rgba(34, 197, 94, 0.1)';
                                  badgeBorder = 'rgba(34, 197, 94, 0.2)';
                                } else if (isPending) {
                                  badgeColor = 'var(--color-warning)';
                                  badgeBg = 'rgba(245, 158, 11, 0.1)';
                                  badgeBorder = 'rgba(245, 158, 11, 0.2)';
                                } else if (isRejected) {
                                  badgeColor = 'var(--color-danger)';
                                  badgeBg = 'rgba(239, 68, 68, 0.1)';
                                  badgeBorder = 'rgba(239, 68, 68, 0.2)';
                                }

                                return (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: badgeColor,
                                    backgroundColor: badgeBg,
                                    borderColor: badgeBorder,
                                    borderWidth: '1px',
                                    borderStyle: 'solid'
                                  }}>

                                    {String(collabRequest.organisation_id) !== String(myOrgId)
                                      ? (isPending ? "Vous avez des demandes de collaboration en attente" : `Demande de collaboration : ${getStatusLabel(status)}`)
                                      : getRoleLabel(role) === "Leader" 
                                        ? "" 
                                        : `(Moi) j'ai fais une demande en tant que ${getRoleLabel(role)} : ${getStatusLabel(status)}`
                                    }
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {(incident.isOwner || takingOrg?.isMe) && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => openAssignModal(incident)}
                              title="Assigner à un agent"
                              style={{ width: 'max-content' }}
                            >
                              Assigner à un agent
                            </button>
                          )}
                          {!isAdmin && (
                            <button
                              type="button"
                              className="incident-action-btn delete-btn"
                              onClick={() => openDeleteModal(incident)}
                              title="Supprimer l'incident"
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
        )}
        <Pagination
          page={page}
          pageSize={pageSize}
          count={count}
          onChange={setPage}
        />
      </div>
    </section>
  );
};

export default IncidentList;
