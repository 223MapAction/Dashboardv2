import React from 'react';
import { Trash, TickCircle, CloseCircle } from 'iconsax-react';
import { useOrganisationsContext } from '../context/OrganisationsContext';

const DeleteOrganisationModal = () => {
  const {
    deleteModal,
    setDeleteModal,
    deleteAnimating,
    isDeleting,
    deleteAlert,
    closeDeleteModal,
    confirmDelete,
  } = useOrganisationsContext();

  if (!deleteModal.open) return null;

  const isClosing = deleteAnimating === 'closing';
  const panelClass = [
    'am-offcanvas-panel',
    'am-offcanvas-panel--sm',
    isClosing ? 'am-offcanvas-panel--closing' : '',
    deleteAnimating === 'opening' ? 'am-offcanvas-panel--opening' : '',
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    isClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={() => !(isDeleting || deleteAlert.type === 'success') && closeDeleteModal()} />
      <div
        className={panelClass}
        role="alertdialog"
        aria-modal="true"
        aria-label="Supprimer l'organisation"
      >
        <div className="am-offcanvas-header am-offcanvas-header--danger">
          <h5 className="am-offcanvas-title">Supprimer l'organisation</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={closeDeleteModal}
            disabled={isDeleting || deleteAlert.type === 'success'}
            aria-label="Fermer"
          />
        </div>

        <div className="am-offcanvas-body am-offcanvas-body--centered">
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

          <div className="am-delete-icon-wrap" aria-hidden="true">
            <Trash size={32} variant="Bold" color="var(--color-danger)" />
          </div>

          <p className="am-delete-title">Confirmer la suppression</p>
          <p className="am-delete-text">
            Vous êtes sur le point de supprimer <strong>"{deleteModal.org?.name}"</strong>. Cette action est <strong>irréversible</strong>.
          </p>
        </div>

        <div className="am-offcanvas-footer am-offcanvas-footer--col">
          <button
            type="button"
            className="am-btn am-btn--danger"
            onClick={confirmDelete}
            disabled={isDeleting || deleteAlert.type === 'success'}
          >
            {isDeleting && <span className="am-spinner" aria-hidden="true" />}
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
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

export default DeleteOrganisationModal;
