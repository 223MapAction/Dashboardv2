import { useState } from 'react';
import { closeSignalementService } from '../signalement/service/signalement_service';
import { logger } from '../../utils/logger';

/**
 * Cloture d'un signalement depuis sa collaboration : dates de resolution,
 * piece justificative, envoi.
 *
 * @param {object|null} collaboration collaboration formatee
 * @param {Function} mutateCollaboration rafraichit la collaboration apres cloture
 */
export function useClotureSignalement(collaboration, mutateCollaboration) {
  // États pour le modal de clôture d'signalement
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeModalShowing, setCloseModalShowing] = useState(false);
  const [resolutionStartDate, setResolutionStartDate] = useState('');
  const [resolutionEndDate, setResolutionEndDate] = useState('');
  const [resolutionFile, setResolutionFile] = useState(null);
  const [closeAlert, setCloseAlert] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // Ouvrir le modal de clôture d'signalement
  const openCloseModal = () => {
    setShowCloseModal(true);
    setResolutionStartDate('');
    setResolutionEndDate('');
    setResolutionFile(null);
    setCloseAlert(null);
    setTimeout(() => {
      setCloseModalShowing(true);
    }, 10);
  };

  // Fermer le modal de clôture d'signalement
  const closeCloseModal = () => {
    setCloseModalShowing(false);
    setTimeout(() => {
      setShowCloseModal(false);
      setResolutionStartDate('');
      setResolutionEndDate('');
      setResolutionFile(null);
      setCloseAlert(null);
    }, 300);
  };

  // Clôturer l'signalement
  const handleCloseSignalement = async () => {
    if (!resolutionStartDate || !resolutionEndDate) {
      setCloseAlert({ type: 'danger', message: 'Veuillez renseigner les deux dates.' });
      return;
    }

    if (new Date(resolutionStartDate) > new Date(resolutionEndDate)) {
      setCloseAlert({ type: 'danger', message: 'La date de début doit être antérieure à la date de fin.' });
      return;
    }

    setIsClosing(true);
    setCloseAlert(null);

    try {
      await closeSignalementService(collaboration.signalementId, {
        resolution_start_date: resolutionStartDate,
        resolution_end_date: resolutionEndDate,
        resolution_file: resolutionFile
      });
      setCloseAlert({ type: 'success', message: 'Signalement résolu avec succès !' });
      setTimeout(() => {
        closeCloseModal();
        mutateCollaboration(); // Recharger uniquement les données SWR au lieu de la page entière
      }, 2000);
    } catch (err) {
      logger.error('[CloseSignalement] Erreur:', err);
      const errorMsg = err?.detail || err?.message || 'Erreur lors de la résolution de l\'signalement.';
      setCloseAlert({ type: 'danger', message: errorMsg });
    } finally {
      setIsClosing(false);
    }
  };

  return {
    showCloseModal,
    closeModalShowing,
    openCloseModal, closeCloseModal, handleCloseSignalement,
    resolutionStartDate, setResolutionStartDate,
    resolutionEndDate, setResolutionEndDate,
    resolutionFile, setResolutionFile,
    closeAlert,
    isClosing,
  };
}
