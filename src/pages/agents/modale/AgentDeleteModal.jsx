import { Trash, TickCircle, CloseCircle } from 'iconsax-react';
import { useAgentsContext } from './AgentsModalContext';
import { removeOrganisationMemberService } from '../service/members_service';
import { authService } from '../../auth/services/authService';
import { OffcanvasModal } from '../../../components/molecules/OffcanvasModal';

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

  const verrouille = isDeleting || deleteAlert.type === 'success';

  const confirmDelete = async () => {
    setIsDeleting(true);
    setDeleteAlert({ type: null, message: null });
    try {
      const currentUser = authService.getCurrentUser();
      const isSuperAdmin = currentUser?.web_role === 'super_admin';
      // Super admin : utiliser l'organisation de l'agent, sinon celle de l'utilisateur connecté
      const organisationId = isSuperAdmin
        ? deleteModal.agent?.organisationId
        : (currentUser?.organisation_member || currentUser?.organisation_id);

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

  return (
    <OffcanvasModal
      onClose={closeDeleteModal}
      isClosing={deleteAnimating === 'closing'}
      title="Supprimer l'agent"
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
            Supprimer définitivement
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

        <div className="am-delete-icon-wrap" aria-hidden="true">
          <Trash size={32} variant="Bold" color="var(--color-danger)" />
        </div>

        <p className="am-delete-title">Confirmer la suppression</p>
        <p className="am-delete-text">
          Vous êtes sur le point de supprimer{' '}
          <strong>&quot;{deleteModal.agent?.fullName}&quot;</strong>.
          Cette action est <strong>irréversible</strong>.
        </p>
      </div>
    </OffcanvasModal>
  );
};

export default AgentDeleteModal;
