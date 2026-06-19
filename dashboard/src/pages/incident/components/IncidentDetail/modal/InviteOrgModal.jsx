import React from 'react';
import { useIncidentDetail } from '../IncidentDetailContext';
import {
  CloseCircle,

  SearchNormal1,
  Add,
  People,

  EyeSlash
} from 'iconsax-react';

export const InviteOrgModal = () => {
  const {
    joinOpen,
    joinClosing,
    joinShowing,
    closeJoinModal,
    safeIncident,
    handleJoinSubmit,
    alertMessage,
    alertType,
    setAlertMessage,
    motif,
    setMotif,
    selfRole,
    setSelfRole,
    orgSearch,
    setOrgSearch,
    showOrgDropdown,
    setShowOrgDropdown,
    isLoadingOrgs,
    filteredOrgs,
    availableOrgs,
    addInvitedOrg,
    invitedOrgs,
    removeInvitedOrg,
    updateOrgRole,
    updateOrgComment,
    isSubmitting,
    ROLE_OPTIONS,
    ORG_ROLE_OPTIONS,

    setIsInvolvePrivate,
    workMode,
    setWorkMode,
    takingOrg
  } = useIncidentDetail();

  if (!joinOpen) return null;

  const panelClass = [
    'am-offcanvas-panel',
    joinClosing ? 'am-offcanvas-panel--closing' : '',
    joinShowing && !joinClosing ? 'am-offcanvas-panel--opening' : '',
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    joinClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={closeJoinModal} />
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={safeIncident.isOwner ? 'Inviter des organisations' : "Rejoindre l'action"}
      >
        <div className="am-offcanvas-header">
          <div className="d-flex flex-column" style={{ minWidth: 0, flex: 1 }}>
            <h5 className="am-offcanvas-title">
              {safeIncident.isOwner ? 'Inviter des organisations' : "Rejoindre l'action"}
            </h5>
            <small className="text-muted mt-1">{safeIncident.title}</small>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={closeJoinModal}
            aria-label="Fermer"
          />
        </div>

        <form onSubmit={handleJoinSubmit} id="invite-org-form" className="am-offcanvas-body" noValidate>


          {!safeIncident.isOwner && (
            <>
              {/* Choix du mode de travail si l'incident n'est pas encore pris en charge (déclaré) ou s'il a déjà un mode de prise en charge */}
              {(safeIncident?.etat === 'declared' || safeIncident?.take_in_charge_mode) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-5)' }}>
                  <label className="join-modal-label">
                    Mode de travail <span className="required">*</span>
                  </label>
                  <p className="join-modal-help">
                    Choisissez comment vous souhaitez être impliquer dans cet incident.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                    <button
                      type="button"
                      disabled={!!safeIncident?.take_in_charge_mode}
                      className={`work-mode-option ${workMode === 'interne' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setWorkMode('interne');
                        setSelfRole('leader');
                        setIsInvolvePrivate(true);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--spacing-4)',
                        backgroundColor: workMode === 'interne' ? 'rgba(58, 162, 221, 0.08)' : 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: workMode === 'interne' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        cursor: safeIncident?.take_in_charge_mode ? 'not-allowed' : 'pointer',
                        opacity: safeIncident?.take_in_charge_mode ? 0.5 : 1,
                        pointerEvents: safeIncident?.take_in_charge_mode ? 'none' : 'auto',
                        transition: 'all 0.2s ease',
                        gap: '8px',
                        minHeight: '100px'
                      }}
                    >
                      <EyeSlash size={24} variant={workMode === 'interne' ? "Bold" : "Linear"} color={workMode === 'interne' ? "var(--color-primary)" : "#6C7278"} />
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-bold)',
                        color: workMode === 'interne' ? 'var(--color-primary)' : 'var(--color-text-primary)'
                      }}>
                        Agir en interne
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: '1.3' }}>
                        Je vais le gérer avec mes équipes en interne simplement
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`work-mode-option ${workMode === 'collaboration' ? 'is-selected' : ''}`}
                      onClick={() => {
                        setWorkMode('collaboration');
                        if (selfRole !== 'leader' && selfRole !== 'contributeur' && selfRole !== 'observateur') {
                          setSelfRole('leader');
                        }
                        setIsInvolvePrivate(false);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--spacing-4)',
                        backgroundColor: workMode === 'collaboration' ? 'rgba(58, 162, 221, 0.08)' : 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: workMode === 'collaboration' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        gap: '8px',
                        minHeight: '100px'
                      }}
                    >
                      <People size={24} variant={workMode === 'collaboration' ? "Bold" : "Linear"} color={workMode === 'collaboration' ? "var(--color-primary)" : "#6C7278"} />
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-bold)',
                        color: workMode === 'collaboration' ? 'var(--color-primary)' : 'var(--color-text-primary)'
                      }}>
                        Travailler en collaboration
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: '1.3' }}>
                        Public et visible par tous
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Sélecteur de rôle pour soi-même - MASQUÉ si travail en interne */}
              {(safeIncident?.etat !== 'declared' || workMode === 'collaboration') && (
                <div className="self-role-section" style={{ marginBottom: 'var(--spacing-5)' }}>
                  <label className="join-modal-label">
                    Rôle souhaité <span className="required">*</span>
                  </label>
                  <p className="join-modal-help">
                    Choisissez le rôle que vous souhaitez avoir dans ce projet.
                  </p>
                  <div className="role-options">
                    {/* Le rôle leader n'est disponible que si l'incident est déclaré et non pris en charge en interne */}
                    {ROLE_OPTIONS.filter((role) => {
                      const isInternal = safeIncident?.take_in_charge_mode === 'internal' || safeIncident?.take_in_charge_mode === 'interne';
                      if (isInternal) {
                        return role.id !== 'leader';
                      }
                      return safeIncident?.etat === 'declared' || role.id !== 'leader';
                    }).map((role) => {
                      const RoleIcon = role.icon;
                      const isSelected = selfRole === role.id;
                      return (
                        <button
                          type="button"
                          key={role.id}
                          className={`role-option ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setSelfRole(role.id)}
                          style={isSelected ? { borderColor: role.color, color: role.color } : {}}
                          title={role.description}
                        >
                          <RoleIcon
                            size={14}
                            variant={isSelected ? 'Bold' : 'Linear'}
                            color={isSelected ? role.color : '#6C7278'}
                          />
                          {role.label}
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const role = ROLE_OPTIONS.find((r) => r.id === selfRole);
                    return role ? (
                      <p className="invited-org-role-desc" style={{ marginTop: '8px' }}>
                        {role.description}
                      </p>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Si l'incident est en cours de prise en charge et qu'on travaille en interne */}
              {safeIncident?.etat === 'declared' && workMode === 'interne' && (
                <div style={{
                  padding: 'var(--spacing-5)',
                  backgroundColor: 'rgba(58, 162, 221, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(58, 162, 221, 0.2)',
                  marginBottom: 'var(--spacing-5)'
                }}>
                  <p style={{ margin: 0, color: 'var(--color-primary)', fontSize: 'var(--font-size-body)', lineHeight: '1.6' }}>
                    <strong>Agir en interne</strong><br />
                    Vous allez prendre en charge cet incident en interne. Vous le gérerez avec vos propres équipes simplement sans qu'il ne devienne privé.
                  </p>
                </div>
              )}

              {/* Si l'incident est en cours de prise en charge, qu'on travaille en collaboration et qu'on a choisi d'être leader */}
              {safeIncident?.etat === 'declared' && workMode === 'collaboration' && selfRole === 'leader' && (
                <div style={{
                  padding: 'var(--spacing-5)',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  marginBottom: 'var(--spacing-5)'
                }}>
                  <p style={{ margin: 0, color: 'var(--color-info)', fontSize: 'var(--font-size-body)', lineHeight: '1.6' }}>
                    <strong>Prendre en compte en collaboration (Public)</strong><br />
                    En confirmant, vous deviendrez le <strong>leader</strong> de cet incident public. Vous serez responsable de sa coordination et de la collaboration avec les autres organisations partenaires.
                  </p>
                </div>
              )}

              {/* Saisie du motif - uniquement requise pour le rôle contributeur */}
              {selfRole === 'contributeur' && (
                <>
                  <label htmlFor="join-motif" className="join-modal-label">
                    Motif <span className="required">*</span>
                  </label>
                  <p className="join-modal-help">
                    Expliquez pourquoi vous souhaitez rejoindre ce projet en tant que contributeur et ce
                    que vous pouvez apporter.
                  </p>
                  <textarea
                    id="join-motif"
                    className="join-modal-textarea"
                    rows={6}
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Ex : Je souhaite contribuer en apportant notre expertise de terrain..."
                    required
                  />
                </>
              )}
              {alertMessage && (
                <div className={`am-alert am-alert--${alertType === 'success' ? 'success' : 'danger'}`} role="alert" style={{ marginBottom: 'var(--spacing-4)' }}>
                  <span className="am-alert__message">{alertMessage}</span>
                  <button
                    type="button"
                    className="am-alert__close"
                    onClick={() => setAlertMessage(null)}
                    aria-label="Close"
                  >×</button>
                </div>
              )}
            </>
          )}

          {/* Section Inviter des organisations - uniquement pour le propriétaire */}
          {safeIncident.isOwner && (
            <div className={`invite-orgs-section ${safeIncident.isOwner ? 'is-owner' : ''}`}>
              <div className="invite-orgs-header">
                <div>
                  <label className="join-modal-label">
                    Inviter des organisations
                  </label>
                  <p className="join-modal-help">
                    Invitez d'autres organisations à participer et attribuez-leur un rôle.
                  </p>
                </div>
              </div>

              {/* Champ recherche */}
              <div className="invite-orgs-search-wrapper">
                <div className="invite-orgs-search">
                  <SearchNormal1 size={16} variant="Linear" color="var(--color-text-secondary)" />
                  <input
                    type="text"
                    className="invite-orgs-search-input"
                    placeholder="Rechercher une organisation..."
                    value={orgSearch}
                    onChange={(e) => {
                      setOrgSearch(e.target.value);
                      setShowOrgDropdown(true);
                    }}
                    onFocus={() => setShowOrgDropdown(true)}
                  />
                  {orgSearch && (
                    <button
                      type="button"
                      className="invite-orgs-clear"
                      onClick={() => setOrgSearch('')}
                    >
                      <CloseCircle size={16} variant="Linear" color="var(--color-text-secondary)" />
                    </button>
                  )}
                </div>

                {showOrgDropdown && (
                  <div className="invite-orgs-dropdown">
                    {isLoadingOrgs ? (
                      <div className="invite-orgs-empty">
                        Chargement des organisations...
                      </div>
                    ) : filteredOrgs.length > 0 ? (
                      filteredOrgs.map((org) => (
                        <button
                          type="button"
                          key={org.id}
                          className="invite-orgs-option"
                          onClick={() => addInvitedOrg(org)}
                        >
                          <div
                            className="invite-orgs-avatar"
                            style={{ backgroundColor: org.color }}
                          >
                            {org.initials}
                          </div>
                          <span className="invite-orgs-option-name">{org.name}</span>
                          <Add size={18} variant="Linear" color="var(--color-primary)" />
                        </button>
                      ))
                    ) : (
                      <div className="invite-orgs-empty">
                        {availableOrgs.length === 0
                          ? 'Aucune organisation disponible'
                          : 'Aucune organisation trouvée'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Liste des organisations invitées */}
              {invitedOrgs.length > 0 && (
                <div className="invite-orgs-list">
                  <div className="invite-orgs-list-label">
                    {invitedOrgs.length} organisation{invitedOrgs.length > 1 ? 's' : ''} invitée{invitedOrgs.length > 1 ? 's' : ''}
                  </div>
                  {invitedOrgs.map((org) => {
                    const currentRole = ROLE_OPTIONS.find((r) => r.id === org.role);
                    return (
                      <div key={org.id} className="invited-org-card">
                        <div className="invited-org-info">
                          <div
                            className="invited-org-avatar"
                            style={{ backgroundColor: org.color }}
                          >
                            {org.initials}
                          </div>
                          <div className="invited-org-name">{org.name}</div>
                          <button
                            type="button"
                            className="invited-org-remove"
                            onClick={() => removeInvitedOrg(org.id)}
                            aria-label="Retirer"
                          >
                            <CloseCircle size={18} variant="Linear" color="var(--color-danger)" />
                          </button>
                        </div>

                        <div className="invited-org-roles">
                          <span className="invited-org-role-label">Rôle :</span>
                          <div className="role-options">
                            {ORG_ROLE_OPTIONS.map((role) => {
                              const RoleIcon = role.icon;
                              const isSelected = org.role === role.id;
                              return (
                                <button
                                  type="button"
                                  key={role.id}
                                  className={`role-option ${isSelected ? 'is-selected' : ''}`}
                                  onClick={() => updateOrgRole(org.id, role.id)}
                                  style={isSelected ? { borderColor: role.color, color: role.color } : {}}
                                  title={role.description}
                                >
                                  <RoleIcon
                                    size={14}
                                    variant={isSelected ? 'Bold' : 'Linear'}
                                    color={isSelected ? role.color : '#6C7278'}
                                  />
                                  {role.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="invited-org-comment" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className="invited-org-role-label" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Motif de l'invitation / Justification :</span>
                          <input
                            type="text"
                            className="invite-orgs-search-input"
                            style={{ width: '100%', fontSize: '13px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}
                            placeholder="Ex: Expert en biodiversité pour aider sur la zone A..."
                            value={org.comment || ''}
                            onChange={(e) => updateOrgComment(org.id, e.target.value)}
                          />
                        </div>

                        {currentRole && (
                          <p className="invited-org-role-desc">
                            {currentRole.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </form>

        <div className="am-offcanvas-footer">
          <button
            type="button"
            className="am-btn am-btn--secondary"
            onClick={closeJoinModal}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="invite-org-form"
            className="am-btn am-btn--primary"
            disabled={
              isSubmitting ||
              (safeIncident.isOwner
                ? invitedOrgs.length === 0
                : selfRole === 'contributeur' && !motif.trim())
            }
          >
            {isSubmitting ? (
              <>
                <span className="am-spinner" aria-hidden="true" />
                Envoi en cours...
              </>
            ) : (
              <>
                {safeIncident.isOwner
                  ? 'Envoyer les invitations'
                  : selfRole === 'leader'
                    ? 'Être impliqué'
                    : 'Demander à être impliqué'
                }
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default InviteOrgModal;
