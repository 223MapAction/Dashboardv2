import React from 'react';
import { Trash, TickCircle, CloseCircle } from 'iconsax-react';
import { useIncidentModalContext } from './IncidentModalContext';
import { deleteIncidentService } from '../service/incident_service';

export const IncidentDeleteModal = () => {
  const {
    deleteModal,
    deleteClosing,
    isDeleting,
    setIsDeleting,
    deleteAlert,
    setDeleteAlert,
    closeDeleteModal,
    mutateIncidents
  } = useIncidentModalContext();

  if (!deleteModal.open || !deleteModal.incident) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteAlert({ type: null, message: null });

    try {
      await deleteIncidentService(deleteModal.incident.id);
      setDeleteAlert({
        type: 'success',
        message: 'L\'incident a été supprimé avec succès.'
      });
      // Rafraîchir les données de la table
      if (mutateIncidents) {
        await mutateIncidents();
      }
      // Fermer la modale après un petit délai de succès
      setTimeout(() => {
        closeDeleteModal();
      }, 1500);
    } catch (err) {
      console.error('[IncidentDeleteModal] Erreur lors de la suppression:', err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Une erreur est survenue lors de l\'suppression de l\'incident.';
      setDeleteAlert({
        type: 'danger',
        message: msg
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOverlayClick = () => {
    if (isDeleting || deleteAlert.type === 'success') return;
    closeDeleteModal();
  };

  const panelClass = [
    'am-offcanvas-panel',
    'am-offcanvas-panel--sm',
    deleteClosing ? 'am-offcanvas-panel--closing' : '',
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    deleteClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={handleOverlayClick} />
      <div
        className={panelClass}
        role="alertdialog"
        aria-modal="true"
        aria-label="Supprimer l'incident"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="am-offcanvas-header am-offcanvas-header--danger">
          <h5 className="am-offcanvas-title">Supprimer l'incident</h5>
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


          {/* Icône */}
          <div className="am-delete-icon-wrap" aria-hidden="true">
            <Trash size={32} variant="Bold" color="var(--color-danger)" />
          </div>

          {/* Titre + message */}
          <p className="am-delete-title">Confirmer la suppression</p>
          <p className="am-delete-text">
            Vous êtes sur le point de supprimer l'incident{' '}
            <strong>"{deleteModal.incident.title || 'Sans titre'}"</strong>.
            Cette action est <strong>irréversible</strong>.
          </p>

          {/* Alerte retour API */}
          {deleteAlert.message && (
            <div className={`am-alert am-alert--${deleteAlert.type === 'success' ? 'success' : 'danger'}`} role="alert" style={{ width: '100%' }}>

              <span className="am-alert__message" style={{ textAlign: 'left' }}>{deleteAlert.message}</span>
            </div>
          )}
        </div>


        {/* ── Footer ─────────────────────────────────────── */}
        <div className="am-offcanvas-footer am-offcanvas-footer--col">
          <button
            type="button"
            className="am-btn am-btn--danger"
            onClick={handleConfirmDelete}
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

export default IncidentDeleteModal;

