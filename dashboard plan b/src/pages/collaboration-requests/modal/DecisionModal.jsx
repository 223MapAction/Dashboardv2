import React, { useState, useEffect } from 'react';
import { CloseCircle, TickCircle, CloseSquare, Crown1, People, Eye } from 'iconsax-react';
import '../../../styles/modals.css';

import { EscapeToClose } from '../../../components/atoms/EscapeToClose';
const ROLE_META = {
  leader: { label: 'Leader', icon: Crown1, color: 'var(--color-warning)' },
  contributeur: { label: 'Contributeur', icon: People, color: 'var(--color-primary)' },
  observateur: { label: 'Observateur', icon: Eye, color: 'var(--color-text-secondary)' },
  contributor: { label: 'Contributeur', icon: People, color: 'var(--color-primary)' },
  observer: { label: 'Observateur', icon: Eye, color: 'var(--color-text-secondary)' }
};

export const DecisionModal = ({
  request,
  onClose,
  onConfirm,
  isSubmitting = false,
  error = null,
  initialAction = null
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [decisionAction, setDecisionAction] = useState(initialAction); // 'accept' | 'reject' | null
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    setDecisionAction(initialAction);
  }, [initialAction]);

  if (!request) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 280);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!decisionAction) return;
    onConfirm(decisionAction, responseText);
  };

  const panelClass = [
    'am-offcanvas-panel',
    isClosing ? 'am-offcanvas-panel--closing' : 'am-offcanvas-panel--opening'
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    isClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={handleClose} />
      <EscapeToClose onClose={handleClose} />
      <aside
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={request.type === 'suggestion' ? 'Traiter la suggestion' : 'Répondre à la demande'}
      >
        <header className="am-offcanvas-header">
          <div>
            <h3 className="am-offcanvas-title">
              {request.type === 'suggestion' ? 'Traiter la suggestion' : 'Répondre à la demande'}
            </h3>
            <p className="decision-modal-subtitle" style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {request.projectTitle}
            </p>
          </div>
          <button
            type="button"
            className="incident-detail-modal-close"
            onClick={handleClose}
            aria-label="Fermer"
            style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <CloseCircle size={22} variant="Linear" color="currentColor" style={{ color: 'var(--color-text-primary)' }} />
          </button>
        </header>

        <form
          className="decision-modal-form"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <div className="am-offcanvas-body" style={{ flex: 1, overflowY: 'auto' }}>
            {error && (
              <div className="am-alert am-alert--danger" role="alert" style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloseCircle size={18} variant="Bold" color="var(--color-danger)" style={{ color: 'var(--color-danger)' }} />
                <span className="am-alert__message">{error}</span>
              </div>
            )}

            <div className="decision-summary" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <div
                className="decision-summary-avatar"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'var(--color-surface)',
                  backgroundColor: request.organisationColor || 'var(--color-primary)'
                }}
              >
                {request.organisationInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="decision-summary-org" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {request.organisation || request.applicantName}
                </span>
                <span className="decision-summary-role" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {request.type === 'suggestion' ? (
                    <>Rôle suggéré : <strong>{request.role}</strong></>
                  ) : (
                    <>Rôle : <strong>{request.role}</strong></>
                  )}
                </span>
              </div>
            </div>

            <div className="decision-motif" style={{ backgroundColor: 'var(--color-background)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 className="decision-block-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '6px', letterSpacing: '0.03em' }}>
                {request.type === 'suggestion' ? 'Justification de la suggestion' : 'Motif de participation'}
              </h4>
              <p className="decision-motif-text" style={{ fontSize: '13px', fontStyle: 'italic', margin: 0, color: 'var(--color-text-primary)' }}>
                "{request.type === 'suggestion' ? request.suggestionMessage : request.motif}"
              </p>
            </div>

            {/* Suggestions display */}
            {request.type === 'suggestion' && (
              <div className="decision-proposed" style={{ marginBottom: '16px' }}>
                <h4 className="decision-block-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                  Organisation suggérée
                </h4>
                <div className="proposed-collabs-list">
                  <div className="proposed-collab-card" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px' }}>
                    <div className="proposed-collab-header" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div
                        className="proposed-collab-avatar"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          color: 'var(--color-surface)',
                          fontSize: '12px',
                          backgroundColor: request.organisationColor || 'var(--color-primary)'
                        }}
                      >
                        {request.organisationInitials}
                      </div>
                      <div className="proposed-collab-info" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="proposed-collab-name" style={{ fontWeight: 600, fontSize: '13px' }}>{request.organisation}</span>
                        <span className="proposed-collab-role" style={{ fontSize: '11px', color: ROLE_META[request.role?.toLowerCase()]?.color || 'var(--color-primary)' }}>
                          Rôle : {ROLE_META[request.role?.toLowerCase()]?.label || request.role}
                        </span>
                      </div>
                    </div>
                    {request.suggestedBy && (
                      <p className="proposed-collab-comment" style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', marginBottom: 0 }}>
                        Suggéré par : {request.suggestedBy} ({request.suggestedByRole})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="decision-choice-group" role="radiogroup" style={{ marginBottom: '16px' }}>
              <h4 className="decision-block-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', letterSpacing: '0.03em' }}>
                Votre décision
              </h4>
              <div className="decision-choices" style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={decisionAction === 'accept'}
                  className={`decision-choice is-accept ${decisionAction === 'accept' ? 'is-selected' : ''}`}
                  onClick={() => setDecisionAction('accept')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '8px',
                    backgroundColor: decisionAction === 'accept' ? 'var(--color-success)' : 'var(--color-surface)',
                    color: decisionAction === 'accept' ? 'var(--color-surface)' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 600
                  }}
                >
                  <TickCircle size={22} variant="Bold" color="currentColor" style={{ color: decisionAction === 'accept' ? 'var(--color-surface)' : 'var(--color-success)' }} />
                  <span>Accepter</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={decisionAction === 'reject'}
                  className={`decision-choice is-reject ${decisionAction === 'reject' ? 'is-selected' : ''}`}
                  onClick={() => setDecisionAction('reject')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '8px',
                    backgroundColor: decisionAction === 'reject' ? 'var(--color-danger)' : 'var(--color-surface)',
                    color: decisionAction === 'reject' ? 'var(--color-surface)' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 600
                  }}
                >
                  <CloseSquare size={22} variant="Bold" color="currentColor" style={{ color: decisionAction === 'reject' ? 'var(--color-surface)' : 'var(--color-danger)' }} />
                  <span>Refuser</span>
                </button>
              </div>
            </div>

            <div className="am-field">
              <label htmlFor="decision-response" className="am-label">
                Message de réponse <span className="am-label__optional">(optionnel)</span>
              </label>
              <textarea
                id="decision-response"
                className="am-input"
                rows={4}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Saisissez votre réponse..."
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>
          </div>

          <footer className="am-offcanvas-footer">
            <button
              type="button"
              className="am-btn am-btn--secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="am-btn am-btn--primary"
              disabled={!decisionAction || isSubmitting}
            >
              {isSubmitting && (
                <span className="am-spinner" style={{ marginRight: '6px' }} />
              )}
              {decisionAction === 'reject' ? 'Confirmer le refus' : 'Confirmer l\'acceptation'}
            </button>
          </footer>
        </form>
      </aside>
    </>
  );
};

export default DecisionModal;
