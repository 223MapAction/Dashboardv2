import { useEffect, useState } from 'react';
import { CloseCircle, TickCircle, CloseSquare, Crown1, People, Eye } from 'iconsax-react';
import { OffcanvasModal } from '../molecules/OffcanvasModal';

const ROLE_META = {
  leader: { label: 'Leader', icon: Crown1, color: 'var(--color-warning-text)' },
  contributeur: { label: 'Contributeur', icon: People, color: 'var(--color-primary-text)' },
  observateur: { label: 'Observateur', icon: Eye, color: 'var(--color-text-secondary)' },
  contributor: { label: 'Contributeur', icon: People, color: 'var(--color-primary-text)' },
  observer: { label: 'Observateur', icon: Eye, color: 'var(--color-text-secondary)' }
};

/**
 * Traitement d'une demande de collaboration ou d'une suggestion.
 *
 * Ce composant existait en deux exemplaires strictement identiques —
 * DecisionModal (collaboration-requests) et SuggestDecisionModal
 * (suggest-request) — qui ne differaient que par leur nom. Les deux pages
 * consomment desormais celui-ci.
 */
export const RequestDecisionModal = ({
  request,
  onClose,
  onConfirm,
  isSubmitting = false,
  error = null,
  initialAction = null
}) => {
  const [decisionAction, setDecisionAction] = useState(initialAction);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    setDecisionAction(initialAction);
  }, [initialAction]);

  if (!request) return null;

  const estSuggestion = request.type === 'suggestion';
  const titre = estSuggestion ? 'Traiter la suggestion' : 'Repondre a la demande';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!decisionAction) return;
    onConfirm(decisionAction, responseText);
  };

  return (
    <OffcanvasModal onClose={onClose} title={titre} subtitle={request.projectTitle}>
      {({ close }) => (
          <form
            className="decision-modal-form"
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
          >
            <div className="am-offcanvas-body" style={{ flex: 1, overflowY: 'auto' }}>
              {error && (
                <div className="am-alert am-alert--danger" role="alert" style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CloseCircle size={18} variant="Bold" color="var(--color-danger)" style={{ color: 'var(--color-danger-text)' }} />
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
                  <span className="decision-summary-org" style={{ fontWeight: 600, fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)' }}>
                    {request.organisation || request.applicantName}
                  </span>
                  <span className="decision-summary-role" style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-secondary)' }}>
                    {request.type === 'suggestion' ? (
                      <>Rôle suggéré : <strong>{request.role}</strong></>
                    ) : (
                      <>Rôle : <strong>{request.role}</strong></>
                    )}
                  </span>
                </div>
              </div>

              <div className="decision-motif" style={{ backgroundColor: 'var(--color-background)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                <h4 className="decision-block-label" style={{ fontSize: 'var(--font-size-caption)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '6px', letterSpacing: '0.03em' }}>
                  {request.type === 'suggestion' ? 'Justification de la suggestion' : 'Motif de participation'}
                </h4>
                <p className="decision-motif-text" style={{ fontSize: 'var(--font-size-body-small)', fontStyle: 'italic', margin: 0, color: 'var(--color-text-primary)' }}>
                  "{request.type === 'suggestion' ? request.suggestionMessage : request.motif}"
                </p>
              </div>

              {/* Suggestions display */}
              {request.type === 'suggestion' && (
                <div className="decision-proposed" style={{ marginBottom: '16px' }}>
                  <h4 className="decision-block-label" style={{ fontSize: 'var(--font-size-caption)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', letterSpacing: '0.03em' }}>
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
                            fontSize: 'var(--font-size-caption)',
                            backgroundColor: request.organisationColor || 'var(--color-primary)'
                          }}
                        >
                          {request.organisationInitials}
                        </div>
                        <div className="proposed-collab-info" style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="proposed-collab-name" style={{ fontWeight: 600, fontSize: 'var(--font-size-body-small)' }}>{request.organisation}</span>
                          <span className="proposed-collab-role" style={{ fontSize: 'var(--font-size-micro)', color: ROLE_META[request.role?.toLowerCase()]?.color || 'var(--color-primary)' }}>
                            Rôle : {ROLE_META[request.role?.toLowerCase()]?.label || request.role}
                          </span>
                        </div>
                      </div>
                      {request.suggestedBy && (
                        <p className="proposed-collab-comment" style={{ fontSize: 'var(--font-size-micro)', color: 'var(--color-text-muted)', marginTop: '6px', marginBottom: 0 }}>
                          Suggéré par : {request.suggestedBy} ({request.suggestedByRole})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="decision-choice-group" role="radiogroup" style={{ marginBottom: '16px' }}>
                <h4 className="decision-block-label" style={{ fontSize: 'var(--font-size-caption)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', letterSpacing: '0.03em' }}>
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
                onClick={close}
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
      )}
    </OffcanvasModal>
  );
};

export default RequestDecisionModal;
