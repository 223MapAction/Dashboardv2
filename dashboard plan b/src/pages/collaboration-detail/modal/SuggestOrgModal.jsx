import React, { useState, useEffect, useRef } from 'react';
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
import { suggestCollaborationPartnerService } from '../service/collab_detail_service';

export const SuggestOrgModal = () => {
  const {
    collaboration,
    showSuggestModal,
    suggestModalClosing,
    suggestModalShowing,
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

  const [showDropdown, setShowDropdown] = useState(false);

  if (!showSuggestModal) return null;

  const panelClass = [
    'am-offcanvas-panel',
    suggestModalClosing ? 'am-offcanvas-panel--closing' : '',
    suggestModalShowing && !suggestModalClosing ? 'am-offcanvas-panel--opening' : '',
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    suggestModalClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={closeSuggestModal} />
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={collaboration?.role == "leader" ? "Inviter des organisations" : "Suggérer des organisations"}
      >
        <div className="am-offcanvas-header">
          <div className="d-flex flex-column" style={{ minWidth: 0, flex: 1 }}>
            <h5 className="am-offcanvas-title">
              {collaboration?.role == "leader" ? "Inviter des organisations" : "Suggérer des organisations"}
            </h5>
            <small style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{collaboration?.title}</small>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={closeSuggestModal}
            aria-label="Fermer"
          />
        </div>

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
            <div className="suggest-search-wrapper">
              <div className="suggest-search">
                <SearchNormal1 size={16} variant="Linear" color="#6C7278" />
                <input
                  type="text"
                  className="suggest-search-input"
                  placeholder="Tapez le nom d'une organisation..."
                  value={suggestSearch}
                  onChange={(e) => { setSuggestSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
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
              {showDropdown && <div className="suggest-search-results">
                {AVAILABLE_ORGS.filter(o =>
                  o.name.toLowerCase().includes(suggestSearch.toLowerCase()) &&
                  !suggestedOrgs.find(s => s.id === o.id)
                ).length === 0 ? (
                  <div className="suggest-search-empty">
                    <Buildings2 size={20} variant="Linear" color="#9CA3AF" />
                    <span>Aucune organisation disponible</span>
                  </div>
                ) : (
                  AVAILABLE_ORGS
                    .filter(o =>
                      o.name.toLowerCase().includes(suggestSearch.toLowerCase()) &&
                      !suggestedOrgs.find(s => s.id === o.id)
                    )
                    .map(org => (
                      <button
                        type="button"
                        key={org.id}
                        className="suggest-search-result"
                        onClick={() => toggleSuggestedOrg(org)}
                      >
                        <div
                          className="suggest-org-avatar"
                          style={{ backgroundColor: getOrgColor(org) }}
                        >
                          {getOrgInitials(org)}
                        </div>
                        <span className="suggest-org-name">{org.name}</span>
                        <Add size={18} variant="Linear" color="#3AA2DD" />
                      </button>
                    ))
                )}
              </div>}
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
      </div>
    </>
  );
};

export default SuggestOrgModal;
