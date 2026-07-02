import React from 'react';
import { Trash, TickCircle, CloseCircle } from 'iconsax-react';
import { useAgentsContext } from './AgentsModalContext';
import { removeOrganisationMemberService } from '../service/members_service';
import { authService } from '../../auth/services/authService';

export const AgentDeleteModal = () => {
  const {
    deleteModal,
    deleteAlert,
    setDeleteAlert,
    deleteAnimating,
    isDeleting,
    setIsDeleting,
    closeDeleteModal,
    mutateAgents,
  } = useAgentsContext();

  if (!deleteModal.open) return null;

  // ── Confirmation suppression ──────────────────────────
  const confirmDelete = async () => {
    setIsDeleting(true);
    setDeleteAlert({ type: null, message: null });
    try {
      // Récupérer l'ID de l'organisation de l'utilisateur connecté
      const currentUser = authService.getCurrentUser();
      const organisationId = currentUser?.organisation_member || currentUser?.organisation_id;
      
      if (!organisationId) {
        throw new Error('Organisation non trouvée');
      }

      await removeOrganisationMemberService(
        organisationId,
        deleteModal.agent.id
      );
      setDeleteAlert({ type: 'success', message: 'Agent supprimé avec succès !' });
      mutateAgents();
      setTimeout(() => closeDeleteModal(), 2000);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors de la suppression. Veuillez réessayer.';
      setDeleteAlert({ type: 'danger', message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Classes d'animation ───────────────────────────────
  const panelClass = [
    'am-offcanvas-panel',
    'am-offcanvas-panel--sm',
    deleteAnimating === 'closing' ? 'am-offcanvas-panel--closing' : '',
    deleteAnimating === 'opening' ? 'am-offcanvas-panel--opening' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    deleteAnimating === 'closing' ? 'am-offcanvas-backdrop--closing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Backdrop */}
      <div className={backdropClass} onClick={closeDeleteModal} />

      {/* Panel slide-from-right */}
      <div
        className={panelClass}
        role="alertdialog"
        aria-modal="true"
        aria-label="Supprimer l'agent"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="am-offcanvas-header am-offcanvas-header--danger">
          <h5 className="am-offcanvas-title">Supprimer l&apos;agent</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={closeDeleteModal}
            disabled={isDeleting || deleteAlert.type === 'success'}
            aria-label="Fermer"
          />
        </div>

        {/* ── Body ───────────────────────────────────────── */}
        <div className="am-offcanvas-body am-offcanvas-body--centered">

          {/* Alerte retour API */}
          {deleteAlert.message && (
            <div className={`am-alert am-alert--${deleteAlert.type === 'success' ? 'success' : 'danger'}`} role="alert" style={{ width: '100%' }}>
              {deleteAlert.type === 'success' ? (
                <TickCircle size={18} variant="Bold" color="var(--color-success)" />
              ) : (
                <CloseCircle size={18} variant="Bold" color="var(--color-danger)" />
              )}
              <span className="am-alert__message" style={{ textAlign: 'left' }}>{deleteAlert.message}</span>
            </div>
          )}

          {/* Icône */}
          <div className="am-delete-icon-wrap" aria-hidden="true">
            <Trash size={32} variant="Bold" color="var(--color-danger)" />
          </div>

          {/* Titre + message */}
          <p className="am-delete-title">Confirmer la suppression</p>
          <p className="am-delete-text">
            Vous êtes sur le point de supprimer{' '}
            <strong>&quot;{deleteModal.agent?.fullName}&quot;</strong>.
            Cette action est <strong>irréversible</strong>.
          </p>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="am-offcanvas-footer am-offcanvas-footer--col">
          <button
            type="button"
            className="am-btn am-btn--danger"
            onClick={confirmDelete}
            disabled={isDeleting || deleteAlert.type === 'success'}
          >
            {isDeleting && <span className="am-spinner" aria-hidden="true" />}
            Supprimer définitivement
          </button>
          <button
            type="button"
            className="am-btn am-btn--outline"
            onClick={closeDeleteModal}
            disabled={isDeleting || deleteAlert.type === 'success'}
          >
            Annuler
          </button>
        </div>
      </div>
    </>
  );
};

export default AgentDeleteModal;
