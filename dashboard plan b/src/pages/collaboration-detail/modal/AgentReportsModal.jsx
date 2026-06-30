import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { DocumentText, Location, Calendar, CloseSquare } from 'iconsax-react';
import { ShimmerThumbnail, ShimmerText } from 'react-shimmer-effects';
import { getFieldReportsService } from '../../collaboration/service/collaboration_service';
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

export const AgentReportsModal = ({ isOpen, onClose, incidentId, incidentTitle }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
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

  const [reportsList, setReportsList] = useState([]);
  const [nextUrl, setNextUrl] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: initialData, error, isLoading } = useSWR(
    isOpen && incidentId ? `field-reports-${incidentId}` : null,
    () => getFieldReportsService({ incident_id: incidentId, page_size: 10 }),
    { revalidateOnFocus: false }
  );

  // Initialiser ou réinitialiser les états locaux
  useEffect(() => {
    if (initialData) {
      const results = initialData.results || [];
      setReportsList(results);
      setNextUrl(initialData.next || null);
    }
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) {
      setReportsList([]);
      setNextUrl(null);
    }
  }, [isOpen]);

  const loadMore = async () => {
    if (!nextUrl || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await getFieldReportsService({ url: nextUrl });
      if (data) {
        const newResults = data.results || [];
        setReportsList(prev => [...prev, ...newResults]);
        setNextUrl(data.next || null);
      }
    } catch (err) {
      console.error('[AgentReportsModal] Erreur chargement rapports:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  if (!shouldRender) return null;

  const panelClass = [
    'am-offcanvas-panel',
    isClosing ? 'am-offcanvas-panel--closing' : '',
    isOpen && !isClosing ? 'am-offcanvas-panel--opening' : ''
  ].filter(Boolean).join(' ');

  const backdropClass = [
    'am-offcanvas-backdrop',
    isClosing ? 'am-offcanvas-backdrop--closing' : '',
  ].filter(Boolean).join(' ');

  const displayedReports = (reportsList || []).filter(report => {
    const reportIncidentId = report.incident ?? report.incident_id;
    if (reportIncidentId === undefined || reportIncidentId === null) return false;
    return String(reportIncidentId).toLowerCase() === String(incidentId).toLowerCase();
  });

  return (
    <>
      <div className={backdropClass} onClick={handleClose} />
      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label="Liste des rapports de terrain des agents"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="am-offcanvas-header">
          <div>
            <h5 className="am-offcanvas-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Rapports des agents
            </h5>
            <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 0 0', fontWeight: '500' }}>
              {incidentTitle || `Incident #${incidentId}`}
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={handleClose}
            aria-label="Fermer"
          />
        </div>

        {/* ── Body ───────────────────────────────────────── */}
        <div className="am-offcanvas-body">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    backgroundColor: 'var(--color-surface)',
                    gap: '12px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ marginRight: '12px', flexShrink: 0 }}>
                      <ShimmerThumbnail height={40} width={40} rounded />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '50%', height: '16px', marginBottom: '6px' }}>
                        <ShimmerThumbnail height={16} rounded />
                      </div>
                      <div style={{ width: '30%', height: '12px' }}>
                        <ShimmerThumbnail height={12} rounded />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <ShimmerText line={2} gap={8} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="d-flex flex-column align-items-center justify-content-center p-5 border rounded bg-light text-center" style={{ gap: '12px' }}>
              <CloseSquare size={48} variant="Linear" color="var(--color-danger)" />
              <div>
                <span className="fw-semibold d-block" style={{ fontSize: '14px', color: '#4B5563' }}>
                  Erreur de chargement
                </span>
                <span className="text-muted d-block mt-1" style={{ fontSize: '12px' }}>
                  Une erreur est survenue lors de la récupération des rapports de terrain.
                </span>
              </div>
            </div>
          ) : displayedReports.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center p-5 border rounded bg-light text-center" style={{ gap: '12px', borderStyle: 'dashed' }}>
              <DocumentText size={48} variant="Linear" color="#9CA3AF" />
              <div>
                <span className="fw-semibold d-block" style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  Aucun rapport disponible
                </span>
                <span className="text-muted d-block mt-1" style={{ fontSize: '12px' }}>
                  Aucun rapport de terrain n'a encore été remonté pour cet incident.
                </span>
              </div>
            </div>
          ) : (
            <div className="incidents-reports-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                  {displayedReports.length} rapport(s) de terrain trouvé(s)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displayedReports.map((report) => (
                  <div
                    key={report.id}
                    className="incidents-report-item"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      backgroundColor: 'var(--color-surface)',
                      gap: '12px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {/* Header: Agent info */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {report.agent_name || 'Agent de terrain'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatDate(report.visited_at || report.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {report.notes && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: 'var(--color-background)',
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--color-primary)',
                        fontSize: '14px',
                        color: 'var(--color-text-secondary)',
                        lineHeight: '1.6'
                      }}>
                        {report.notes}
                      </div>
                    )}

                    {/* Metadata */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--color-border)', paddingTop: '10px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {report.incident_zone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Location size={14} variant="Bold" color="#6C7278" />
                          <span style={{ fontWeight: '500' }}>Zone : {report.incident_zone}</span>
                        </div>
                      )}

                      {report.location_lat && report.location_lon && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Location size={14} variant="Bold" color="#6C7278" />
                          <span style={{ fontWeight: '500' }}>
                            Coordonnées : {parseFloat(report.location_lat).toFixed(4)}°, {parseFloat(report.location_lon).toFixed(4)}°
                          </span>
                        </div>
                      )}

                      {report.distance_meters && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>Précision de localisation :</span>
                          <span style={{ fontWeight: '500' }}>± {report.distance_meters}m de l'incident</span>
                        </div>
                      )}
                    </div>

                    {/* Report Image */}
                    {report.photo && (
                      <div style={{
                        width: '100%',
                        maxHeight: '220px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginTop: '4px',
                        border: '1px solid var(--color-border)'
                      }}>
                        <BlurryImage
                          src={report.photo}
                          alt="Preuve du rapport"
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

                {nextUrl && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={loadMore}
                      disabled={isLoadingMore}

                    >
                      {isLoadingMore ? (
                        <>
                          <span className="am-spinner" style={{ width: '12px', height: '12px', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-primary)' }} />
                          Chargement...
                        </>
                      ) : (
                        'Afficher plus'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="am-offcanvas-footer">
          <button
            type="button"
            className="am-btn am-btn--outline w-full"
            onClick={handleClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </>
  );
};

export default AgentReportsModal;
