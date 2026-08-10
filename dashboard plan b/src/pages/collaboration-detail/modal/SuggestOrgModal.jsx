import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import useSWRInfinite from 'swr/infinite';
import debounce from 'lodash.debounce';
import { useCollaborationDetail } from '../context/CollaborationDetailContext';
import {
  CloseCircle,
  Crown1,
  SearchNormal1,
  Buildings2,
  Add,
  People,
  Edit2,
  TickCircle
} from 'iconsax-react';
import { suggestCollaborationPartnerService, getOtherOrganisationsService } from '../service/collab_detail_service';

import { OffcanvasModal } from '../../../components/molecules/OffcanvasModal';
export const SuggestOrgModal = () => {
  const {
    collaboration,
    showSuggestModal,
    suggestModalClosing,
    closeSuggestModal,
    suggestSearch,
    setSuggestSearch,
    suggestedOrgs,
    toggleSuggestedOrg,
    updateSuggestedRole,
    updateSuggestedComment,
    suggestAlert,
    setSuggestAlert,
    suggestSubmitting,
    handleSuggestSubmit,
    ROLE_OPTIONS,
    AVAILABLE_ORGS
  } = useCollaborationDetail();

  const bodyRef = useRef(null);
  const searchWrapperRef = useRef(null);
  const pageSize = 10;
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce de la recherche : ne fait QUE mettre à jour la valeur débouncée.
  // Le reset de pagination est géré par useSWRInfinite (voir setSize plus bas).
  const debouncedSetSearch = useMemo(
    () => debounce((value) => {
      setDebouncedSearch(value);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(suggestSearch);
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [suggestSearch, debouncedSetSearch]);

  // --- Récupération paginée + recherche via useSWRInfinite ---
  // getKey retourne la clé de chaque page. Elle inclut `debouncedSearch`,
  // donc un changement de recherche invalide automatiquement toutes les pages.
  const getKey = useCallback(
    (pageIndex, previousPageData) => {
      // On a atteint la fin : plus de page suivante.
      if (previousPageData && !previousPageData.next) return null;
      // Sinon on demande la page suivante (pageIndex commence à 0).
      return ['other-organisations', debouncedSearch, pageIndex + 1];
    },
    [debouncedSearch]
  );

  const fetcher = useCallback(([, search, pageNumber]) => {
    const params = { page: pageNumber, page_size: pageSize };
    if (search.trim()) {
      params.search = search.trim();
    }
    return getOtherOrganisationsService(params);
  }, []);

  const {
    data: pages,
    error: orgsError,
    size,
    setSize,
    isLoading: orgsLoading,
    isValidating
  } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false, // évite de re-fetch la page 1 à chaque "charger plus"
    keepPreviousData: true
  });

  // Réinitialise la pagination à la page 1 dès qu'une nouvelle recherche démarre.
  useEffect(() => {
    setSize(1);
  }, [debouncedSearch, setSize]);

  // Aplatit toutes les pages en une seule liste, en dédupliquant par id (sécurité).
  const organisations = useMemo(() => {
    if (!pages) return [];
    const seen = new Set();
    const flat = [];
    for (const pg of pages) {
      for (const org of pg?.results ?? []) {
        if (!seen.has(org.id)) {
          seen.add(org.id);
          flat.push(org);
        }
      }
    }
    return flat;
  }, [pages]);

  const lastPage = pages?.[pages.length - 1];
  const hasMore = Boolean(lastPage?.next);
  const isInitialLoading = orgsLoading && !pages;
  const isLoadingMore =
    orgsLoading || (size > 0 && pages && typeof pages[size - 1] === 'undefined');

  const loadMore = useCallback(() => {
    if (hasMore && !isValidating) {
      setSize((prev) => prev + 1);
    }
  }, [hasMore, isValidating, setSize]);

  useEffect(() => {
    if (suggestAlert?.message && bodyRef.current) {
      bodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [suggestAlert?.message]);

  const getOrgInitials = (org) => {
    if (org.acronym) return org.acronym.substring(0, 2).toUpperCase();
    return org.name ? org.name.substring(0, 2).toUpperCase() : 'OR';
  };

  const getOrgColor = (org) => {
    return org.primary_color || '#3AA2DD';
  };

  // Sélection d'une organisation : on l'ajoute, on vide la recherche
  // et on referme la liste déroulante.
  const handleSelectOrg = (org) => {
    toggleSuggestedOrg(org);
    setSuggestSearch('');
    setShowDropdown(false);
  };

  const [showDropdown, setShowDropdown] = useState(false);

  // Ferme la liste UNIQUEMENT lors d'un clic réellement en dehors du bloc
  // recherche. On n'utilise plus onBlur sur l'input : sinon un clic sur
  // "Afficher plus" (qui fait perdre le focus à l'input) refermait la liste.
  useEffect(() => {
    if (!showDropdown) return;
    const handlePointerDown = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showDropdown]);

  if (!showSuggestModal) return null;

  const selectableOrgs = organisations.filter(
    (o) => !suggestedOrgs.find((s) => s.id === o.id)
  );

  return (
    <OffcanvasModal
      onClose={closeSuggestModal}
      isClosing={Boolean(suggestModalClosing)}
      title={collaboration?.role == "leader" ? "Inviter des organisations" : "Suggérer des organisations"}
      subtitle={collaboration?.title}
      ariaLabel={collaboration?.role == "leader" ? "Inviter des organisations" : "Suggérer des organisations"}
      closeVariant="plain"
    >

        <div className="am-offcanvas-body" ref={bodyRef}>
          {/* Alerte de retour */}
          {suggestAlert && (
            <div className={`am-alert am-alert--${suggestAlert.type === 'success' ? 'success' : 'danger'}`} role="alert" style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {suggestAlert.type === 'success' ? (
                <TickCircle size={18} variant="Bold" color="var(--color-success)" style={{ flexShrink: 0 }} />
              ) : (
                <CloseCircle size={18} variant="Bold" color="var(--color-danger)" style={{ flexShrink: 0 }} />
              )}
              <span className="am-alert__message" style={{ margin: 0 }}>{suggestAlert.message}</span>
            </div>
          )}
          {/* Bandeau d'info */}
          <div className="suggest-info-banner">
            <Crown1 size={18} variant="Bold" color="#F59E0B" />
            <span>
              En tant que <strong>{collaboration.role == "leader" ? "Leader" : "Contributeur"}</strong>, vous pouvez
              {collaboration?.role == "leader" ? "inviter des organisations" : "suggérer des organisations"}

              et leur attribuer un rôle.
            </span>
          </div>

          {/* Recherche */}
          <div className="suggest-section">
            <label className="suggest-section-label">
              Rechercher une organisation
            </label>
            <div className="suggest-search-wrapper" ref={searchWrapperRef}>
              <div className="suggest-search">
                <SearchNormal1 size={16} variant="Linear" color="#6C7278" />
                <input
                  type="text"
                  className="suggest-search-input"
                  placeholder="Tapez le nom d'une organisation..."
                  value={suggestSearch}
                  onChange={(e) => { setSuggestSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                />
                {suggestSearch && (
                  <button
                    type="button"
                    className="suggest-search-clear"
                    onClick={() => { setSuggestSearch(''); setShowDropdown(false); }}
                  >
                    <CloseCircle size={16} variant="Linear" color="#6C7278" />
                  </button>
                )}
              </div>

              {/* Résultats déroulants */}
              {showDropdown && (
                <div
                  className="suggest-search-results"
                  style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
                  {/* Zone SCROLLABLE : seule la liste défile ici */}
                  <div
                    className="suggest-search-results-scroll"
                    style={{ overflowY: 'auto', maxHeight: '300px' }}
                  >
                    {isInitialLoading ? (
                      <div className="suggest-search-empty">
                        <span>Chargement...</span>
                      </div>
                    ) : orgsError ? (
                      <div className="suggest-search-empty">
                        <Buildings2 size={20} variant="Linear" color="#EF4444" />
                        <span>Erreur de chargement</span>
                      </div>
                    ) : selectableOrgs.length === 0 ? (
                      <div className="suggest-search-empty">
                        <Buildings2 size={20} variant="Linear" color="#9CA3AF" />
                        <span>Aucune organisation disponible</span>
                      </div>
                    ) : (
                      selectableOrgs.map(org => (
                        <button
                          type="button"
                          key={org.id}
                          className="suggest-search-result"
                          onClick={() => handleSelectOrg(org)}
                        >
                          <div
                            className="suggest-org-avatar"
                            style={{ backgroundColor: getOrgColor(org) }}
                          >
                            {getOrgInitials(org)}
                          </div>
                          <span className="suggest-org-name">{org.name}</span>
                         </button>
                      ))
                    )}
                  </div>

                  {/* Bouton "Afficher plus" FIXE en bas (hors de la zone scrollable) */}
                  {hasMore && !isInitialLoading && !orgsError && (
                    <div
                      className="suggest-search-results-footer"
                      style={{
                        flexShrink: 0,
                        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                        background: 'var(--color-surface, #ffffff)'
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-link"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px',
                          margin: 0
                        }}
                        onMouseEnter={(e) => !isLoadingMore && (e.currentTarget.style.backgroundColor = 'rgba(58, 162, 221, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {isLoadingMore ? (
                          <>
                            <span className="am-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                            Chargement...
                          </>
                        ) : (
                          'Afficher plus'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Organisations sélectionnées */}
          <div className="suggest-section">
            <label className="suggest-section-label">
              <People size={16} variant="Bold" color="#3AA2DD" />
              Sélectionnées ({suggestedOrgs.length})
            </label>

            {suggestedOrgs.length === 0 ? (
              <div className="suggest-empty">
                <People size={28} variant="Linear" color="#9CA3AF" />
                <p>Aucune organisation sélectionnée pour le moment.</p>
              </div>
            ) : (
              <div className="suggest-roles-list">
                {suggestedOrgs.map(org => {
                  const currentRole = ROLE_OPTIONS.find(r => r.id === org.role);
                  return (
                    <div key={org.id} className="suggest-role-row">
                      <div className="suggest-role-row-header">
                        <div className="suggest-role-org">
                          <div
                            className="suggest-org-avatar"
                            style={{ backgroundColor: getOrgColor(org) }}
                          >
                            {getOrgInitials(org)}
                          </div>
                          <span className="suggest-org-name">{org.name}</span>
                        </div>
                        <button
                          type="button"
                          className="suggest-remove-btn"
                          onClick={() => toggleSuggestedOrg(org)}
                          title="Retirer"
                        >
                          <CloseCircle size={18} variant="Linear" color="#EF4444" />
                        </button>
                      </div>

                      <div className="suggest-role-attribution">
                        <span className="suggest-role-attribution-label">Rôle :</span>
                        <div className="role-options">
                          {ROLE_OPTIONS.map(role => {
                            const RoleIcon = role.icon;
                            const isRoleSel = org.role === role.id;
                            return (
                              <button
                                type="button"
                                key={role.id}
                                className={`role-option ${isRoleSel ? 'is-selected' : ''}`}
                                onClick={() => updateSuggestedRole(org.id, role.id)}
                                style={
                                  isRoleSel
                                    ? { borderColor: role.color, color: role.color }
                                    : {}
                                }
                              >
                                <RoleIcon
                                  size={12}
                                  variant={isRoleSel ? 'Bold' : 'Linear'}
                                  color={isRoleSel ? role.color : '#6C7278'}
                                />
                                {role.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {currentRole && (
                        <p className="suggest-role-desc">
                          {currentRole.description}
                        </p>
                      )}

                      <div className="suggest-role-comment">
                        <label className="suggest-role-attribution-label">
                          Commentaire *
                        </label>
                        <textarea
                          className="suggest-textarea"
                          rows={2}
                          value={org.comment || ''}
                          onChange={(e) => updateSuggestedComment(org.id, e.target.value)}
                          placeholder="Pourquoi suggérez-vous cette organisation ?"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="am-offcanvas-footer">
          <button
            type="button"
            className="am-btn am-btn--secondary"
            onClick={closeSuggestModal}
          >
            Annuler
          </button>
          <button
            type="button"
            className="am-btn am-btn--primary"
            onClick={handleSuggestSubmit}
            disabled={suggestedOrgs.length === 0 || suggestSubmitting}
          >
            {suggestSubmitting ? (
              <>
                <span className="am-spinner" aria-hidden="true" />
                Envoi en cours...
              </>
            ) : (
              <>
                Envoyer
              </>
            )}
          </button>
        </div>
      </OffcanvasModal>
  );
};

export default SuggestOrgModal;