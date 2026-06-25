import React, { useEffect, useState } from 'react';
import { Trash } from 'iconsax-react';
import { deleteTaskService } from '../../incident/service/task_service';

export const DeleteTaskModal = ({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  taskId,
  incidentId,
  isDeleting: propIsDeleting
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [localIsDeleting, setLocalIsDeleting] = useState(false);
  const isDeleting = propIsDeleting || localIsDeleting;
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Matches transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isDeleting) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  const handleConfirm = async () => {
    if (!taskId) return;
    try {
      setLocalIsDeleting(true);
      await deleteTaskService(incidentId, taskId);
      if (onConfirm) {
        await onConfirm(taskId);
      }
    } catch (error) {
      console.error('[DeleteTaskModal] Erreur lors de la suppression de la tâche:', error);
    } finally {
      setLocalIsDeleting(false);
    }
  };

  if (!shouldRender) return null;

  const panelClass = [
    'am-offcanvas-panel',
    'am-offcanvas-panel--sm',
    isClosing ? 'am-offcanvas-panel--closing' : '',
    isOpen && !isClosing ? 'am-offcanvas-panel--opening' : ''
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    isClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={handleClose} />
      <div
        className={panelClass}
        role="alertdialog"
        aria-modal="true"
        aria-label="Supprimer la tâche"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="am-offcanvas-header am-offcanvas-header--danger">
          <h5 className="am-offcanvas-title">Supprimer la tâche</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={handleClose}
            disabled={isDeleting}
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
            Vous êtes sur le point de supprimer la tâche :<br />
            <strong>"{taskTitle || 'Sans titre'}"</strong>.
            Cette action est <strong>irréversible</strong>.
          </p>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="am-offcanvas-footer am-offcanvas-footer--col">
          <button
            type="button"
            className="am-btn am-btn--danger"
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isDeleting && <span className="am-spinner" aria-hidden="true" />}
            Supprimer définitivement
          </button>
          <button
            type="button"
            className="am-btn am-btn--outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Annuler
          </button>
        </div>
      </div>
    </>
  );
};

export default DeleteTaskModal;
