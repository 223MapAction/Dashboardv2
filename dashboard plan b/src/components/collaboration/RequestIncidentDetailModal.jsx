import { useState } from 'react';
import { Eye } from 'iconsax-react';
import { ShimmerThumbnail } from 'react-shimmer-effects';
import { BlurryImage } from '../atoms/BlurryImage';
import { OffcanvasModal } from '../molecules/OffcanvasModal';

/**
 * Fiche detaillee d'un incident, ouverte depuis une demande ou une suggestion.
 *
 * Existait en deux exemplaires identiques au nom pres :
 * CollabIncidentDetailModal et SuggestIncidentDetailModal.
 */
export const RequestIncidentDetailModal = ({ incident, onClose }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);

  if (!incident) return null;

  const details = incident.incidentDetails || {};
  const prediction = incident.predictionDetails || {};
  const titre = details.title || "Details de l'incident";

  return (
    <OffcanvasModal
      onClose={onClose}
      title={titre}
      subtitle={prediction.incident_type ? (
        <span className="incident-detail-badge-pill context-danger">
          {prediction.incident_type}
        </span>
      ) : null}
    >
      <>

          <div className="am-offcanvas-body" style={{ padding: '24px' }}>
            {/* Media preview if exists */}
            {(details.photo || details.video) && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {details.photo && (
                    <div>
                      <h4 className='body-large mb-1'>Image de le signalement</h4>
                      <BlurryImage
                        src={details.photo}
                        alt="Aperçu de l'incident"
                        style={{
                          width: '100%',
                          maxHeight: '240px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #eaecf0',
                        }}
                      />
                    </div>
                  )}

                  {details.video && (
                    <div>
                      <h4 className='body-large mb-1'>Vidéo de le signalement</h4>
                      {!videoLoaded && (
                        <ShimmerThumbnail height={240} rounded />
                      )}
                      <video
                        src={details.video}
                        controls
                        onLoadedData={() => setVideoLoaded(true)}
                        style={{
                          width: '100%',
                          maxHeight: '240px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #eaecf0',
                          display: videoLoaded ? 'block' : 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* General info */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Informations Générales</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#344054' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                  <span style={{ color: '#667085' }}>Description</span>
                  <span style={{ textAlign: 'right', fontWeight: 500, maxWidth: '60%' }}>{details.description || "Aucune description fournie."}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                  <span style={{ color: '#667085' }}>Localisation</span>
                  <span style={{ textAlign: 'right', fontWeight: 500, maxWidth: '60%' }}>{prediction.display_name || details.zone || "Zone non spécifiée."}</span>
                </div>
                {details.created_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                    <span style={{ color: '#667085' }}>Signalé le</span>
                    <span style={{ textAlign: 'right', fontWeight: 500 }}>
                      {new Date(details.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                  <span style={{ color: '#667085' }}>GPS (Lat, Long)</span>
                  <span style={{ textAlign: 'right', fontWeight: 500 }}>
                    {details.lattitude || prediction.latitude || "N/A"}, {details.longitude || prediction.longitude || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            {prediction.analysis && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Analyse Intelligente (IA)</h4>
                <div style={{ background: '#f9fafb', border: '1px solid #eaecf0', padding: '16px', borderRadius: '8px', fontSize: '14px', color: '#344054', lineHeight: '1.5' }}>
                  <p style={{ margin: '0 0 12px 0' }}>{prediction.analysis}</p>
                  {prediction.recommendation && (
                    <div style={{ borderTop: '1px solid #eaecf0', paddingTop: '12px' }}>
                      <strong style={{ color: '#101828' }}>Recommandation : </strong>
                      {prediction.recommendation}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Environmental data */}
            {prediction.topography && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Données Environnementales</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#344054' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                    <span style={{ color: '#667085' }}>Température</span>
                    <span style={{ fontWeight: 500 }}>{prediction.topography.temperature_celsius ?? "N/A"} °C</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                    <span style={{ color: '#667085' }}>Vitesse du vent</span>
                    <span style={{ fontWeight: 500 }}>{prediction.topography.wind_speed ?? "N/A"} km/h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                    <span style={{ color: '#667085' }}>Précipitations</span>
                    <span style={{ fontWeight: 500 }}>{prediction.topography.precipitation ?? "N/A"} mm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                    <span style={{ color: '#667085' }}>Pente du terrain</span>
                    <span style={{ fontWeight: 500 }}>{prediction.topography.slope_percent ?? "N/A"} %</span>
                  </div>
                </div>
              </div>
            )}

            {/* Human Exposure */}
            {prediction.human_impact && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Impact Humain Estimé</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#344054' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                    <span style={{ color: '#667085' }}>Population totale exposée</span>
                    <span style={{ fontWeight: 500 }}>{prediction.human_impact.total_population_exposed ?? 0} personnes</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                    <span style={{ color: '#667085' }}>Hommes adultes</span>
                    <span style={{ fontWeight: 500 }}>{prediction.human_impact.adult_men_exposed ?? 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                    <span style={{ color: '#667085' }}>Femmes adultes</span>
                    <span style={{ fontWeight: 500 }}>{prediction.human_impact.adult_women_exposed ?? 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f2f4f7', paddingBottom: '6px' }}>
                    <span style={{ color: '#667085' }}>Enfants</span>
                    <span style={{ fontWeight: 500 }}>{prediction.human_impact.children_exposed ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
      </>
    </OffcanvasModal>
  );
};

export default RequestIncidentDetailModal;
