import { Trash, TickCircle, CloseCircle } from 'iconsax-react';
import { useOrganisationsContext } from '../context/OrganisationsContext';
import { OffcanvasModal } from '../../../components/molecules/OffcanvasModal';

const DeleteOrganisationModal = () => {
  const {
    deleteModal,
    deleteAnimating,
    isDeleting,
    deleteAlert,
    closeDeleteModal,
    confirmDelete,
  } = useOrganisationsContext();

  if (!deleteModal.open) return null;

  const verrouille = isDeleting || deleteAlert.type === 'success';

  return (
    <OffcanvasModal
      onClose={closeDeleteModal}
      isClosing={deleteAnimating === 'closing'}
      title="Supprimer l'organisation"
      role="alertdialog"
      tone="danger"
      size="sm"
      closeVariant="plain"
      closeDisabled={verrouille}
      footerLayout="col"
      footer={
        <>
          <button
            type="button"
            className="am-btn am-btn--danger"
            onClick={confirmDelete}
            disabled={verrouille}
          >
            {isDeleting && <span className="am-spinner" aria-hidden="true" />}
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </button>
          <button
            type="button"
            className="am-btn am-btn--outline"
            onClick={closeDeleteModal}
            disabled={verrouille}
          >
            Annuler
          </button>
        </>
      }
    >
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
          Vous êtes sur le point de supprimer <strong>&quot;{deleteModal.org?.name}&quot;</strong>. Cette action est <strong>irréversible</strong>.
        </p>
      </div>
    </OffcanvasModal>
  );
};

export default DeleteOrganisationModal;
