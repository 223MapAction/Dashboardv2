import React from 'react';
import useSWR from 'swr';
import { SearchNormal1 } from 'iconsax-react';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerCircularImage } from 'react-shimmer-effects';
import { Eye, Edit2, Trash } from 'iconsax-react';
import { BlurryImage } from '../../../../components/atoms/BlurryImage';
import { useIncidentModalContext } from '../../modale/IncidentModalContext';
import { authService } from '../../../auth/services/authService';
import { isSuperAdmin as checkSuperAdmin, getAccessibleNavIds } from '../../../../utils/permissions';
import { getCollaborationsService } from '../../service/collaboration_service';
import Pagination from '../../../../components/molecules/Pagination';
import { ResponsiveTable } from '../../../../components/molecules/ResponsiveTable';
import { FiltersBar } from '../../../../components/molecules/FiltersBar';
import './incident-list.css';

import { TableActionsMenu } from '../../../../components/molecules/TableActionsMenu';
import { BadgeGravite } from '../../../../components/atoms/BadgeGravite';
import { gravite, couleurGravite } from '../../../../utils/gravite';
// Composant shimmer pour le chargement (version table)

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
  const isSuperAdmin = checkSuperAdmin(user);
  // « admin » ici = peut piloter les incidents sans être super_admin.
  const isAdmin = !isSuperAdmin && getAccessibleNavIds(user).includes('incidents');

  const myOrgId = user?.organisation_member;
  const myOrgName = user?.organisation_name || 'Mon Organisation';

  // /MapApi/collaboration/ met 7 a 16 secondes : la route n'est pas paginee et
  // renvoie toute la table, alors qu'on n'en tire qu'un badge par ligne. On ne
  // peut pas supprimer l'appel depuis le front — la reponse de /incident/ ne
  // porte aucune information de collaboration — mais on peut cesser de le
  // refaire a chaque visite. Une fois par session suffit : ces demandes ne
  // changent pas d'une minute a l'autre, et le badge n'est pas critique.
  // Le correctif propre appartient a l'API (pagination + filtre par signalement).
  const { data: collaborations } = useSWR(
    'collaborations',
    getCollaborationsService,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 30 * 60 * 1000,
    }
  );

  // Le filtre par statut est desormais applique par le serveur (parametre
  // `etat`), donc sur l'ensemble du jeu de donnees. Le refaire ici ne
  // filtrerait que la page courante tout en laissant la pagination annoncer
  // le total complet — c'est ce qui rendait le filtre menteur.
  const filtered = incidents;

  // Chaque colonne est decrite une fois. ResponsiveTable en fait un <tr> sur
  // grand ecran et une carte sur telephone : le meme `rendu` sert aux deux,
  // donc un badge modifie ne peut pas diverger entre les deux vues.
  const lignes = filtered.map((incident) => {
    const takenOrgId = incident.taken_by_organisation?.id;
    const estMoi = Boolean(myOrgId && takenOrgId && String(takenOrgId) === String(myOrgId));
    const collabList = Array.isArray(collaborations)
      ? collaborations
      : Array.isArray(collaborations?.results) ? collaborations.results : [];

    return {
      ...incident,
      _takingOrg: (incident.taken_by_organisation || incident.taken_by)
        ? {
          isMe: estMoi,
          name: estMoi ? myOrgName : (incident.taken_by_organisation?.name || incident.taken_by_name || ''),
        }
        : null,
      _collabRequest: collabList.find((c) => c.incident === incident.id),
    };
  });

  const colonnes = [
    {
      id: 'signalement', entete: 'Signalement', priorite: 'titre',
      // Sur la carte, le titre se passe de la vignette : la photo est passee
      // en bandeau au-dessus. La description est omise quand elle repete le
      // titre, ce qui est le cas courant dans les donnees.
      renduCarte: (incident) => (
        <>
          <span className="incident-table-title">
            {incident.title || 'Sans titre'}
            {incident.isOwner ? (
              <span className="incident-owner-tag" style={{ marginLeft: '8px', fontSize: 'var(--font-size-micro)', padding: '2px 6px', background: 'var(--color-primary-text)', color: 'white', borderRadius: '4px' }}>Moi</span>
            ) : incident.takenBy ? (
              <span className="incident-owner-tag" style={{ marginLeft: '8px', fontSize: 'var(--font-size-micro)', padding: '2px 6px', background: 'var(--color-text-muted)', color: 'white', borderRadius: '4px' }}>Autre</span>
            ) : null}
          </span>
          {incident.description
            && !incident.description.startsWith(incident.title || '\u0000')
            && <span className="incident-table-subtitle">{incident.description.substring(0, 80)}</span>}
        </>
      ),
      rendu: (incident) => (
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
                                    <span className="incident-owner-tag" style={{ marginLeft: '8px', fontSize: 'var(--font-size-micro)', padding: '2px 6px', background: 'var(--color-primary-text)', color: 'white', borderRadius: '4px' }}>Moi</span>
                                  ) : incident.takenBy ? (
                                    <span className="incident-owner-tag" style={{ marginLeft: '8px', fontSize: 'var(--font-size-micro)', padding: '2px 6px', background: 'var(--color-text-muted)', color: 'white', borderRadius: '4px' }}>Autre</span>
                                  ) : null}
                                </span>
                                <span className="incident-table-subtitle">{incident.description?.substring(0, 50)}...</span>
                              </div>
                            </div>
      ),
    },
    {
      id: 'localisation', entete: 'Localisation', priorite: 'sousTitre',
      rendu: (incident) => (
        <span className="incident-table-cell-text">
                            {incident.location || 'Inconnue'}
                            {incident.coordinates && (
                              <div style={{ fontSize: 'var(--font-size-micro)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                {incident.coordinates.lat.toFixed(3)}, {incident.coordinates.lng.toFixed(3)}
                              </div>
                            )}
        </span>
      ),
    },
    {
      id: 'periode', entete: 'Période', priorite: 'detail',
      rendu: (incident) => (
                            <div className="incident-periode">
                              {/* Date et fleche dans le meme span : sinon la fleche part
                                  seule a la ligne suivante quand la cellule est etroite. */}
                              <span className="incident-periode-debut">
                                {incident.startDate}
                                <span className="incident-periode-lien" aria-hidden="true">→</span>
                              </span>
                              {incident.endDate === 'En cours' ? (
                                <span className="incident-date-badge is-pending">En cours</span>
                              ) : (
                                <span className="incident-date-badge is-resolved">{incident.endDate}</span>
                              )}
                            </div>
      ),
    },
    {
      id: 'etat', entete: 'État', priorite: 'marquant',
      // .incident-etat est en colonne — un choix fait pour une cellule etroite.
      // Sur une carte de 390px les deux badges tiennent cote a cote.
      renduCarte: (incident) => (
        <>
          {incident.badges?.map((b, idx) => (
            <span key={idx} className={`incident-badge-glow variant-${b.variant}`}>{b.label}</span>
          ))}
          <BadgeGravite incident={incident} />
        </>
      ),
      rendu: (incident) => (
                            <div className="incident-etat">
                              <div className="incident-table-badges">
                                {incident.badges?.map((b, idx) => (
                                  <span key={idx} className={`incident-badge-glow variant-${b.variant}`}>
                                    {b.label}
                                  </span>
                                ))}
                              </div>
                              <div className="incident-table-badges">
                                <BadgeGravite incident={incident} />
                              </div>
                            </div>
      ),
    },
    {
      id: 'prise-en-charge', entete: 'Prise en charge & Collaboration',
      enteteCarte: 'Prise en charge', priorite: 'bloc',
      rendu: (incident) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {incident._takingOrg ? (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                      {incident._takingOrg.name}
                                    </span>
                                    {incident._takingOrg.isMe ? (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        background: 'rgba(var(--rgb-success), 0.12)',
                                        color: 'var(--color-success-text)',
                                        border: '1px solid rgba(var(--rgb-success), 0.3)',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: 'var(--font-size-micro)',
                                        fontWeight: '600'
                                      }}>
                                        Moi
                                      </span>
                                    ) : (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        background: 'rgba(var(--rgb-text-secondary), 0.12)',
                                        color: 'var(--color-text-secondary)',
                                        border: '1px solid rgba(var(--rgb-text-secondary), 0.3)',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: 'var(--font-size-micro)',
                                        fontWeight: '600'
                                      }}>
                                        Autre
                                      </span>
                                    )}
                                  </div>
                                  <div style={{
                                    fontSize: 'var(--font-size-caption)',
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
                                        return incident._takingOrg.isMe
                                          ? "Nous travaillons en interne sur cet incident avec nos équipes"
                                          : `${incident._takingOrg.name} travaille déjà en interne sur cet incident avec ses équipes`;
                                      } else if (isCollaborative) {
                                        return incident._takingOrg.isMe
                                          ? "Nous collaborons avec d'autres organisations sur cet incident"
                                          : `${incident._takingOrg.name} collabore avec d'autres organisations sur cet incident`;
                                      } else {
                                        return incident._takingOrg.isMe
                                          ? "Pris en charge par notre organisation"
                                          : `Pris en charge par ${incident._takingOrg.name}`;
                                      }
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body-small)', fontStyle: 'italic' }}>
                                  Disponible
                                </span>
                              )}

                              {incident._collabRequest && (
                                <div style={{ marginTop: '2px' }}>
                                  {(() => {
                                    const role = incident._collabRequest.role || '';
                                    const status = incident._collabRequest.status || 'pending';

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
                                    let badgeBg = 'rgba(var(--rgb-text-secondary), 0.1)';
                                    let badgeBorder = 'rgba(var(--rgb-text-secondary), 0.2)';

                                    if (isAccepted) {
                                      badgeColor = 'var(--color-success)';
                                      badgeBg = 'rgba(var(--rgb-success), 0.1)';
                                      badgeBorder = 'rgba(var(--rgb-success), 0.2)';
                                    } else if (isPending) {
                                      badgeColor = 'var(--color-warning)';
                                      badgeBg = 'rgba(var(--rgb-warning), 0.1)';
                                      badgeBorder = 'rgba(var(--rgb-warning), 0.2)';
                                    } else if (isRejected) {
                                      badgeColor = 'var(--color-danger)';
                                      badgeBg = 'rgba(var(--rgb-danger), 0.1)';
                                      badgeBorder = 'rgba(var(--rgb-danger), 0.2)';
                                    }

                                    return (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: 'var(--font-size-micro)',
                                        fontWeight: '600',
                                        color: badgeColor,
                                        backgroundColor: badgeBg,
                                        borderColor: badgeBorder,
                                        borderWidth: '1px',
                                        borderStyle: 'solid'
                                      }}>

                                        {String(incident._collabRequest.organisation_id) !== String(myOrgId)
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
      ),
    },
  ];

  // Le lisere colore du bord gauche de la carte double le badge de gravite,
  // il ne le remplace pas : la couleur seule ne doit jamais porter le sens.
  const accentDe = (incident) =>
    couleurGravite(gravite(incident));

  // Le bandeau de la carte. Sur un signalement environnemental, la photo dit
  // ce qui se passe mieux qu'aucun badge.
  const mediaDe = (incident) => (
    <BlurryImage src={incident.thumbnail || ''} alt={incident.title || 'Photo du signalement'} />
  );

  const actionsDe = (incident) => (
    <div onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <TableActionsMenu
                                ariaLabel={`Actions sur ${incident.title || 'cet incident'}`}
                                actions={[
                                  {
                                    id: 'view',
                                    label: 'Voir le détail',
                                    icon: Eye,
                                    onSelect: () => onSelectIncident && onSelectIncident(incident),
                                  },
                                  (incident.isOwner || incident._takingOrg?.isMe) && {
                                    id: 'assign',
                                    label: 'Assigner à un agent',
                                    icon: Edit2,
                                    onSelect: () => openAssignModal(incident),
                                  },
                                  !isAdmin && {
                                    id: 'delete',
                                    label: "Supprimer l'incident",
                                    icon: Trash,
                                    tone: 'danger',
                                    onSelect: () => openDeleteModal(incident),
                                  },
                                ].filter(Boolean)}
                              />
                            </div>
    </div>
  );

  return (
    <section className="project-list-section">
      {/* Header */}
      <header className="project-list-header">
        <h1 className="project-list-title">Signalements</h1>
        <p className="project-list-subtitle">
          Rejoignez des initiatives environnementales en cours ou proposez votre
          expertise pour soutenir les communautés locales.
        </p>
      </header>

      <div className="project-filtres-zone">
        <FiltersBar
          recherche={search}
          onRecherche={setSearch}
          placeholder="Rechercher un signalement, une commune…"
          selects={[{
            id: 'statut',
            valeur: statusFilter,
            onChange: setStatusFilter,
            ariaLabel: 'Filtrer par statut',
            tousLabel: 'Tous les statuts',
            options: [
              { value: 'declared', label: 'Déclaré' },
              { value: 'taken_into_account', label: 'Pris en compte' },
              { value: 'resolved', label: 'Résolu' },
            ],
          }]}
          onEffacer={() => { setSearch(''); setStatusFilter(''); }}
          resultats={count}
          nomResultat="signalement"
        />
      </div>

      {/* Table */}
      <div style={{ padding: '0 var(--spacing-5) var(--spacing-5)' }}>
        {!isLoading && filtered.length === 0 ? (
          <div className='d-flex flex-column align-items-center'>
            <div className='mb-2'>
              <SearchNormal1 size={48} variant="Linear" color="var(--color-text-muted)" />
            </div>
            <p>Aucun signalement ne correspond à vos critères.</p>
          </div>
        ) : (
          <ResponsiveTable
            colonnes={colonnes}
            donnees={lignes}
            cleDe={(i) => i.id}
            actions={actionsDe}
            media={mediaDe}
            accentDe={accentDe}
            chargement={isLoading}
            onLigneClick={onSelectIncident}
            classeLigne={(i) => (i.id === selectedId ? 'is-selected' : '')}
            libelleListe="Signalements"
          />
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
