import React, { useState, useEffect, useMemo } from 'react';
import { useMesInterventionsModalContext } from '../MesInterventionsModalContext';
import { CloseCircle, TickCircle, SearchNormal1, Profile } from 'iconsax-react';

import { EscapeToClose } from '../../../components/atoms/EscapeToClose';
const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');

export const IncidentMultiAssignModal = () => {
  const {
    assignModal,
    assignClosing,
    closeAssignModal,
    assignments,
    assignAgentsToIncident,
    allMockAgents
  } = useMesInterventionsModalContext();

  const [selectedAgents, setSelectedAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState({ type: null, message: null });

  // Initialiser les agents sélectionnés lors de l'ouverture
  useEffect(() => {
    if (assignModal.open && assignModal.incident) {
      const currentlyAssigned = assignments[assignModal.incident.id] || [];
      setSelectedAgents(currentlyAssigned);
      setAlert({ type: null, message: null });
    }
  }, [assignModal.open, assignModal.incident, assignments]);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allMockAgents;
    return allMockAgents.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.orgName.toLowerCase().includes(q)
    );
  }, [allMockAgents, searchQuery]);

  if (!assignModal.open || !assignModal.incident) return null;

  const handleToggleAgent = (agent) => {
    setSelectedAgents((prev) => {
      const exists = prev.some((a) => a.id === agent.id);
      if (exists) {
        return prev.filter((a) => a.id !== agent.id);
      } else {
        return [...prev, agent];
      }
    });
  };

  const handleConfirmAssign = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setAlert({ type: null, message: null });

    setTimeout(() => {
      assignAgentsToIncident(assignModal.incident.id, selectedAgents);
      setAlert({
        type: 'success',
        message: 'L\'équipe d\'agents a été mise à jour avec succès.'
      });
      setIsSaving(false);

      // Fermer après un court délai
      setTimeout(() => {
        closeAssignModal();
        setSearchQuery('');
      }, 1000);
    }, 400);
  };

  const handleOverlayClick = () => {
    if (isSaving || alert.type === 'success') return;
    closeAssignModal();
    setSearchQuery('');
  };

  const panelClass = [
    'am-offcanvas-panel',
    assignClosing ? 'am-offcanvas-panel--closing' : '',
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    assignClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={handleOverlayClick} />
      <EscapeToClose onClose={handleOverlayClick} />
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label="Assigner des agents"
      >
        <div className="am-offcanvas-header">
          <div>
            <h5 className="am-offcanvas-title">
              Gérer l'équipe terrain
            </h5>
            <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              {assignModal.incident.title || 'Sans titre'}
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={handleOverlayClick}
            aria-label="Fermer"
            disabled={isSaving || alert.type === 'success'}
          />
        </div>

        <form onSubmit={handleConfirmAssign} id="multi-assign-form" className="am-offcanvas-body" noValidate>
          {alert.message && (
            <div className={`am-alert am-alert--${alert.type === 'success' ? 'success' : 'danger'}`} role="alert" style={{ width: '100%' }}>
              {alert.type === 'success' ? (
                <TickCircle size={18} variant="Bold" color="#22C55E" />
              ) : (
                <CloseCircle size={18} variant="Bold" color="#EF4444" />
              )}
              <span className="am-alert__message" style={{ textAlign: 'left' }}>{alert.message}</span>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="am-field">
            <label className="am-label" htmlFor="multi-agent-search">
              Rechercher des collaborateurs
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <SearchNormal1
                size={16}
                variant="Linear"
                color="#6C7278"
                style={{ position: 'absolute', left: '12px' }}
              />
              <input
                id="multi-agent-search"
                type="text"
                className="am-input"
                placeholder="Nom, email ou organisation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Liste des agents avec multi-sélection */}
          <div className="am-field">
            <label className="am-label">
              Sélectionner les agents à assigner ({selectedAgents.length} sélectionné(s))
            </label>

            {filteredAgents.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center p-4 border rounded bg-light text-center">
                <Profile size={32} variant="Linear" color="#9CA3AF" />
                <span className="fw-medium mt-2" style={{ fontSize: '13px', color: '#6B7280' }}>Aucun agent trouvé</span>
              </div>
            ) : (
              <div className="incidents-agents-list">
                {Object.entries(
                  filteredAgents.reduce((acc, curr) => {
                    if (!acc[curr.orgName]) acc[curr.orgName] = [];
                    acc[curr.orgName].push(curr);
                    return acc;
                  }, {})
                ).map(([orgName, orgAgents]) => (
                  <div key={orgName} className="incidents-org-group">
                    <div className="incidents-org-name">{orgName}</div>
                    {orgAgents.map((agent) => {
                      const isChecked = selectedAgents.some((a) => a.id === agent.id);
                      return (
                        <div
                          key={agent.id}
                          className={`incidents-agent-item ${isChecked ? 'is-selected' : ''}`}
                          onClick={() => handleToggleAgent(agent)}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Géré par le clic sur le conteneur
                            style={{ marginRight: '12px', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                          />
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: agent.avatarColor,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '13px',
                              marginRight: '12px',
                              flexShrink: 0
                            }}
                          >
                            {getInitials(agent.fullName)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.fullName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {agent.role} &bull; {agent.email}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="am-offcanvas-footer">
          <button
            type="button"
            className="am-btn am-btn--secondary"
            onClick={handleOverlayClick}
            disabled={isSaving || alert.type === 'success'}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="multi-assign-form"
            className="am-btn am-btn--primary"
            disabled={isSaving || alert.type === 'success'}
          >
            {isSaving && <span className="am-spinner" aria-hidden="true" />}
            {isSaving ? 'Enregistrement...' : 'Enregistrer l\'équipe'}
          </button>
        </div>
      </div>
    </>
  );
};

export default IncidentMultiAssignModal;
