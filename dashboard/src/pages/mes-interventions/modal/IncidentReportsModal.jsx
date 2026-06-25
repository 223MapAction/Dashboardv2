import React from 'react';
import { useMesInterventionsModalContext } from '../MesInterventionsModalContext';
import { DocumentText, Location, } from 'iconsax-react';
import { BlurryImage } from '../../../components/atoms/BlurryImage';

const formatDate = (isoString) => {
  if (!isoString) return 'Non spécifiée';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
};

export const IncidentReportsModal = () => {
  const {
    reportsModal,
    reportsClosing,
    closeReportsModal
  } = useMesInterventionsModalContext();

  const currentIncident = reportsModal.incident;
  const reports = reportsModal.reports || [];

  if (!reportsModal.open || !currentIncident) return null;

  const handleOverlayClick = () => {
    closeReportsModal();
  };

  const panelClass = [
    'am-offcanvas-panel',
    reportsClosing ? 'am-offcanvas-panel--closing' : '',
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    reportsClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={backdropClass} onClick={handleOverlayClick} />
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label="Liste des rapports de terrain"
      >
        <div className="am-offcanvas-header">
          <div>
            <h5 className="am-offcanvas-title">
              Rapports de terrain
            </h5>
            <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              {currentIncident.title || 'Sans titre'}
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={handleOverlayClick}
            aria-label="Fermer"
          />
        </div>

        <div className="am-offcanvas-body">
          {reports.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center p-5 border rounded bg-light text-center" style={{ gap: '12px' }}>
              <DocumentText size={48} variant="Linear" color="#9CA3AF" />
              <div>
                <span className="fw-semibold d-block" style={{ fontSize: '14px', color: '#4B5563' }}>
                  Aucun rapport disponible
                </span>
                <span className="text-muted d-block mt-1" style={{ fontSize: '12px' }}>
                  Aucun rapport de terrain n'a encore été remonté pour cet incident.
                </span>
              </div>
            </div>
          ) : (
            <div className="incidents-reports-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  Rapport(s) remonté(s) ({reports.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="incidents-report-item"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      backgroundColor: 'var(--color-background-card)',
                      gap: '12px'
                    }}
                  >
                    {/* Header: Icon, Agent Name, Date */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(58, 162, 221, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          flexShrink: 0
                        }}
                      >
                        <DocumentText size={20} variant="Bold" color="#3AA2DD" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {report.agent_name || 'Agent inconnu'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatDate(report.visited_at || report.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Notes/Description */}
                    {report.notes && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--color-primary)',
                        fontSize: '14px',
                        color: 'var(--color-text-secondary)',
                        lineHeight: '1.6'
                      }}>
                        {report.notes}
                      </div>
                    )}

                    {/* Details: Zone, Coordinates, Distance */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--color-border)', paddingTop: '10px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {report.incident_zone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Location size={14} variant="Bold" color="#6C7278" />
                          <span style={{ fontWeight: '500' }}>{report.incident_zone}</span>
                        </div>
                      )}

                      {report.location_lat && report.location_lon && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Location size={14} variant="Bold" color="#6C7278" />
                          <span style={{ fontWeight: '500' }}>
                            {parseFloat(report.location_lat).toFixed(4)}°, {parseFloat(report.location_lon).toFixed(4)}°
                          </span>
                        </div>
                      )}

                      {report.distance_meters && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Distance :</span>
                          <span style={{ fontWeight: '500' }}>{report.distance_meters}m</span>
                        </div>
                      )}


                    </div>

                    {/* Photo */}
                    {report.photo && (
                      <div style={{
                        width: '100%',
                        height: '200px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginTop: '8px'
                      }}>
                        <BlurryImage
                          src={report.photo}
                          alt="Photo du rapport"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="am-offcanvas-footer">
          <button
            type="button"
            className="am-btn am-btn--secondary w-full"
            onClick={handleOverlayClick}
          >
            Fermer
          </button>
        </div>
      </div>
    </>
  );
};

export default IncidentReportsModal;
