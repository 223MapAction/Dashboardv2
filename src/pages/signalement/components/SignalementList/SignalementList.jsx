import React from 'react';
import useSWR from 'swr';
import { SearchNormal1 } from 'iconsax-react';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText, ShimmerCircularImage } from 'react-shimmer-effects';
import { Eye, Edit2, Trash } from 'iconsax-react';
import { BlurryImage } from '../../../../components/atoms/BlurryImage';
import { useSignalementModalContext } from '../../modale/SignalementModalContext';
import { authService } from '../../../auth/services/authService';
import { isSuperAdmin as checkSuperAdmin, getAccessibleNavIds } from '../../../../utils/permissions';
import { getCollaborationsService } from '../../service/collaboration_service';
import Pagination from '../../../../components/molecules/Pagination';
import { ResponsiveTable } from '../../../../components/molecules/ResponsiveTable';
import { FiltersBar } from '../../../../components/molecules/FiltersBar';
import './signalement-list.css';

import { TableActionsMenu } from '../../../../components/molecules/TableActionsMenu';
import { BadgeGravite } from '../../../../components/atoms/BadgeGravite';
import { gravite, couleurGravite } from '../../../../utils/gravite';
// Composant shimmer pour le chargement (version table)

export const SignalementList = ({
  signalements = [],
  onSelectSignalement,
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
  const { openDeleteModal, openAssignModal } = useSignalementModalContext();
  const user = authService.getCurrentUser();
  const isSuperAdmin = checkSuperAdmin(user);
  // « admin » ici = peut piloter les signalements sans être super_admin.
  const isAdmin = !isSuperAdmin && getAccessibleNavIds(user).includes('signalements');

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
  const filtered = signalements;

  // Chaque colonne est decrite une fois. ResponsiveTable en fait un <tr> sur
  // grand ecran et une carte sur telephone : le meme `rendu` sert aux deux,
  // donc un badge modifie ne peut pas diverger entre les deux vues.
  const lignes = filtered.map((signalement) => {
    const takenOrgId = signalement.taken_by_organisation?.id;
    const estMoi = Boolean(myOrgId && takenOrgId && String(takenOrgId) === String(myOrgId));
    const collabList = Array.isArray(collaborations)
      ? collaborations
      : Array.isArray(collaborations?.results) ? collaborations.results : [];

    return {
      ...signalement,
      _takingOrg: (signalement.taken_by_organisation || signalement.taken_by)
        ? {
          isMe: estMoi,
          name: estMoi ? myOrgName : (signalement.taken_by_organisation?.name || signalement.taken_by_name || ''),
        }
        : null,
      _collabRequest: collabList.find((c) => c.incident === signalement.id),
    };
  });

  const colonnes = [
    {
      id: 'signalement', entete: 'Signalement', priorite: 'titre',
      // Sur la carte, le titre se passe de la vignette : la photo est passee
      // en bandeau au-dessus. La description est omise quand elle repete le
      // titre, ce qui est le cas courant dans les donnees.
      renduCarte: (signalement) => (
        <>
          <span className="signalement-table-title">
            {signalement.title || 'Sans titre'}
            {signalement.isOwner ? (
              <span className="signalement-owner-tag" style={{ marginLeft: '8px', fontSize: 'var(--font-size-micro)', padding: '2px 6px', background: 'var(--color-primary-text)', color: 'white', borderRadius: '4px' }}>Moi</span>
            ) : signalement.takenBy ? (
              <span className="signalement-owner-tag" style={{ marginLeft: '8px', fontSize: 'var(--font-size-micro)', padding: '2px 6px', background: 'var(--color-text-muted)', color: 'white', borderRadius: '4px' }}>Autre</span>
            ) : null}
          </span>
          {signalement.description
            && !signalement.description.startsWith(signalement.title || '\u0000')
            && <span className="signalement-table-subtitle">{signalement.description.substring(0, 80)}</span>}
        </>
      ),
      rendu: (signalement) => (
                            <div className="signalement-table-main-col">
                              <BlurryImage
                                src={signalement.thumbnail ||  ""}
                                alt={signalement.title}
                                className="signalement-table-img"
                              />
                              <div>
                                <span className="signalement-table-title">
                                  {signalement.title || 'Sans titre'}
                                  {signalement.isOwner ? (
                                    <span className="signalement-owner-tag" style={{ marginLeft: '8px', fontSize: 'var(--font-size-micro)', padding: '2px 6px', background: 'var(--color-primary-text)', color: 'white', borderRadius: '4px' }}>Moi</span>
                                  ) : signalement.takenBy ? (
                                    <span className="signalement-owner-tag" style={{ marginLeft: '8px', fontSize: 'var(--font-size-micro)', padding: '2px 6px', background: 'var(--color-text-muted)', color: 'white', borderRadius: '4px' }}>Autre</span>
                                  ) : null}
                                </span>
                                <span className="signalement-table-subtitle">{signalement.description?.substring(0, 50)}...</span>
                              </div>
                            </div>
      ),
    },
    {
      id: 'localisation', entete: 'Localisation', priorite: 'sousTitre',
      rendu: (signalement) => (
        <span className="signalement-table-cell-text">
                            {signalement.location || 'Inconnue'}
                            {signalement.coordinates && (
                              <div style={{ fontSize: 'var(--font-size-micro)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                {signalement.coordinates.lat.toFixed(3)}, {signalement.coordinates.lng.toFixed(3)}
                              </div>
                            )}
        </span>
      ),
    },
    {
      id: 'periode', entete: 'Période', priorite: 'detail',
      rendu: (signalement) => (
                            <div className="signalement-periode">
                              {/* Date et fleche dans le meme span : sinon la fleche part
                                  seule a la ligne suivante quand la cellule est etroite. */}
                              <span className="signalement-periode-debut">
                                {signalement.startDate}
                                <span className="signalement-periode-lien" aria-hidden="true">→</span>
                              </span>
                              {signalement.endDate === 'En cours' ? (
                                <span className="signalement-date-badge is-pending">En cours</span>
                              ) : (
                                <span className="signalement-date-badge is-resolved">{signalement.endDate}</span>
                              )}
                            </div>
      ),
    },
    {
      id: 'etat', entete: 'État', priorite: 'marquant',
      // .incident-etat est en colonne — un choix fait pour une cellule etroite.
      // Sur une carte de 390px les deux badges tiennent cote a cote.
      renduCarte: (signalement) => (
        <>
          {signalement.badges?.map((b, idx) => (
            <span key={idx} className={`signalement-badge-glow variant-${b.variant}`}>{b.label}</span>
          ))}
          <BadgeGravite signalement={signalement} />
        </>
      ),
      rendu: (signalement) => (
                            <div className="signalement-etat">
                              <div className="signalement-table-badges">
                                {signalement.badges?.map((b, idx) => (
                                  <span key={idx} className={`signalement-badge-glow variant-${b.variant}`}>
                                    {b.label}
                                  </span>
                                ))}
                              </div>
                              <div className="signalement-table-badges">
                                <BadgeGravite signalement={signalement} />
                              </div>
                            </div>
      ),
    },
    {
      id: 'prise-en-charge', entete: 'Prise en charge & Collaboration',
      enteteCarte: 'Prise en charge', priorite: 'bloc',
      rendu: (signalement) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {signalement._takingOrg ? (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                      {signalement._takingOrg.name}
                                    </span>
                                    {signalement._takingOrg.isMe ? (
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
                                      const mode = signalement.take_in_charge_mode;
                                      const isInternal = mode === 'internal' || mode === 'interne';
                                      const isCollaborative = mode === 'collaborative' || mode === 'collaboratif';
                                      if (isInternal) {
                                        return signalement._takingOrg.isMe
                                          ? "Nous travaillons en interne sur cet signalement avec nos équipes"
                                          : `${signalement._takingOrg.name} travaille déjà en interne sur cet signalement avec ses équipes`;
                                      } else if (isCollaborative) {
                                        return signalement._takingOrg.isMe
                                          ? "Nous collaborons avec d'autres organisations sur cet signalement"
                                          : `${signalement._takingOrg.name} collabore avec d'autres organisations sur cet signalement`;
                                      } else {
                                        return signalement._takingOrg.isMe
                                          ? "Pris en charge par notre organisation"
                                          : `Pris en charge par ${signalement._takingOrg.name}`;
                                      }
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body-small)', fontStyle: 'italic' }}>
                                  Disponible
                                </span>
                              )}

                              {signalement._collabRequest && (
                                <div style={{ marginTop: '2px' }}>
                                  {(() => {
                                    const role = signalement._collabRequest.role || '';
                                    const status = signalement._collabRequest.status || 'pending';

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

                                        {String(signalement._collabRequest.organisation_id) !== String(myOrgId)
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
  const accentDe = (signalement) =>
    couleurGravite(gravite(signalement));

  // Le bandeau de la carte. Sur un signalement environnemental, la photo dit
  // ce qui se passe mieux qu'aucun badge.
  const mediaDe = (signalement) => (
    <BlurryImage src={signalement.thumbnail || ''} alt={signalement.title || 'Photo du signalement'} />
  );

  const actionsDe = (signalement) => (
    <div onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <TableActionsMenu
                                ariaLabel={`Actions sur ${signalement.title || 'cet signalement'}`}
                                actions={[
                                  {
                                    id: 'view',
                                    label: 'Voir le détail',
                                    icon: Eye,
                                    onSelect: () => onSelectSignalement && onSelectSignalement(signalement),
                                  },
                                  (signalement.isOwner || signalement._takingOrg?.isMe) && {
                                    id: 'assign',
                                    label: 'Assigner à un agent',
                                    icon: Edit2,
                                    onSelect: () => openAssignModal(signalement),
                                  },
                                  !isAdmin && {
                                    id: 'delete',
                                    label: "Supprimer l'signalement",
                                    icon: Trash,
                                    tone: 'danger',
                                    onSelect: () => openDeleteModal(signalement),
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
            onLigneClick={onSelectSignalement}
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

export default SignalementList;
