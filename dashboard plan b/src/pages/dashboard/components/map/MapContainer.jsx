import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText } from 'react-shimmer-effects';
import { getIncidentService } from '../../../incident/service/incident_service';
import { getOrgInternalIncidentsService } from '../../../mes-interventions/service/mes_interventions_service';
import { BlurryImage } from '../../../../components/atoms/BlurryImage';
import './map.css';

// Token Mapbox depuis les variables d'environnement
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Détermine la sévérité d'un incident à partir de base_severity (0 à 10) ou de ses badges
const getSeverity = (project) => {
  const baseSeverity = project.base_severity ?? project.incident_details?.prediction_details?.base_severity;
  if (baseSeverity !== undefined && baseSeverity !== null) {
    const val = parseFloat(baseSeverity);
    if (val >= 7) return 'high';
    if (val >= 4) return 'medium';
    return 'low';
  }

  // Repli sur les badges si base_severity est absent
  const badges = (project.badges || []).map((b) => b.variant);
  if (badges.includes('critical') || badges.includes('high') || badges.includes('expert-needed')) return 'high';
  if (badges.includes('in-progress') || badges.includes('medium')) return 'medium';
  return 'low';
};

// Calcule la classe de couleur du marqueur en fonction de son statut et de l'utilisateur connecté
const getMarkerColorClass = (incident, currentUserId) => {
  const isResolved = incident.etat === 'resolved';
  if (isResolved) {
    let takenById = null;
    if (incident.taken_by && typeof incident.taken_by === 'object') {
      takenById = incident.taken_by.id;
    } else {
      takenById = incident.taken_by || incident.takenBy;
    }
    const takenBy = parseInt(takenById);
    const me = parseInt(currentUserId);
    if (!isNaN(takenBy) && !isNaN(me) && takenBy === me) {
      return 'resolved-mine'; // Vert
    }
    return 'resolved-others'; // Bleu
  }

  // Si l'incident est actif, sa couleur dépend de sa sévérité (sans bleu ni vert)
  const severity = getSeverity(incident);
  if (severity === 'high') return 'active-high'; // Rouge
  if (severity === 'medium') return 'active-medium'; // Orange
  return 'active-low'; // Jaune
};

const INCIDENT_STATUS_STEPS = [
  { id: 'declared', label: 'Déclaré', },
  { id: 'taken_into_account', label: 'Pris en compte', },

  { id: 'resolved', label: 'Résolu' }
];

// Style "Humanitaire" inspiré d'OpenStreetMap HOT (Humanitarian OSM Team)
// Utilise les tiles HOT-OSM directement avec masque pour afficher uniquement le Mali
const HOT_OSM_STYLE = {
  version: 8,
  sources: {
    'hot-osm': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution:
        '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team'
    },
    'mali-boundary': {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            // Anneau externe : couvre le monde entier
            [
              [-180, -90],
              [-180, 90],
              [180, 90],
              [180, -90],
              [-180, -90]
            ],
            // Anneau interne (trou) : délimitation du Mali
            [
              [-12.24, 10.16], // Sud-Ouest
              [-12.24, 25.00], // Nord-Ouest
              [4.27, 25.00],   // Nord-Est
              [4.27, 10.16],   // Sud-Est
              [-12.24, 10.16]  // Fermeture
            ]
          ]
        }
      }
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#f0f0f0'
      }
    },
    {
      id: 'hot-osm-layer',
      type: 'raster',
      source: 'hot-osm',
      minzoom: 0,
      maxzoom: 19
    },
    {
      id: 'mali-mask',
      type: 'fill',
      source: 'mali-boundary',
      paint: {
        'fill-color': '#f0f0f0',
        'fill-opacity': 0.85
      }
    }
  ]
};

const MAP_STYLES = {
  humanitarian: {
    id: 'humanitarian',
    label: 'Carte',
    style: HOT_OSM_STYLE
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    style: 'mapbox://styles/mapbox/satellite-streets-v12'
  }
};

// Traduit l'état de l'incident en français
const translateEtat = (etat) => {
  switch (etat) {
    case 'resolved':
      return 'Résolu';
    case 'taken_into_account':
      return 'Pris en compte';
    case 'pending':
      return 'En attente';
    case 'declared':
      return 'Déclaré';
    default:
      return etat || '';
  }
};

export const MapContainer = ({ incidents = [], isLoading = false }) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [modalClosing, setModalClosing] = useState(false);
  const [modalShowing, setModalShowing] = useState(false);
  const navigate = useNavigate();

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (selectedIncidentId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedIncidentId]);
  const [activeStyle, setActiveStyle] = useState('humanitarian');

  // ── États locaux pour les filtres de la carte ────────────────────────────────
  const currentUserId = sessionStorage.getItem('user_id');
  const [ownershipFilter, setOwnershipFilter] = useState('all'); // 'all' | 'mine'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'resolved'

  // Utiliser useSWR pour récupérer les détails de l'incident sélectionné
  const { data: selectedIncident, isLoading: isLoadingIncident } = useSWR(
    selectedIncidentId ? `/incident/${selectedIncidentId}` : null,
    () => getIncidentService(selectedIncidentId),
    {
      revalidateOnFocus: false,

      onError: (err) => {
        console.error('[MAP] Erreur chargement incident:', err);
      },
      onSuccess: (data) => {
        console.log('[MAP] Incident chargé:', data);
      }
    }
  );

  // Utiliser useSWR pour récupérer les incidents quand "Mes incidents" est sélectionné
  const { data: orgIncidentsData, isLoading: isLoadingOrgIncidents } = useSWR(
    ownershipFilter === 'mine' ? '/org-incidents' : null,
    () => getOrgInternalIncidentsService(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onError: (err) => {
        console.error('[MAP] Erreur chargement incidents organisation:', err);
      }
    }
  );

  // S'assurer que incidents est un tableau (gestion de la pagination de l'API)
  const baseIncidents = ownershipFilter === 'mine' ? (orgIncidentsData || []) : incidents;
  const normalizedIncidents = Array.isArray(baseIncidents)
    ? baseIncidents
    : (baseIncidents && Array.isArray(baseIncidents.results) ? baseIncidents.results : []);

  console.log('[MAP] --- Début filtrage ---');
  console.log('[MAP] ownershipFilter:', ownershipFilter);
  console.log('[MAP] statusFilter:', statusFilter);
  console.log('[MAP] currentUserId:', currentUserId);
  console.log('[MAP] Prop incidents:', incidents);
  console.log('[MAP] baseIncidents résolu:', baseIncidents);
  console.log('[MAP] normalizedIncidents:', normalizedIncidents);

  const DEFAULT_MALI_LAT = 12.65; // Bamako
  const DEFAULT_MALI_LNG = -8.0;

  // Filtre uniquement les incidents avec coordonnées valides et selon les critères de filtres
  const validIncidents = normalizedIncidents.map((inc) => {
    const latVal = inc.lattitude !== undefined ? inc.lattitude : inc.latitude;
    const lat = parseFloat(latVal);
    const lng = parseFloat(inc.longitude);
    const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

    let finalLat = lat;
    let finalLng = lng;
    let hasFallbackCoords = false;

    if (!hasValidCoords) {
      hasFallbackCoords = true;
      // Ajout d'une petite variation déterministe basée sur l'ID de l'incident pour éviter la superposition parfaite
      const offsetId = inc.id || 0;
      finalLat = DEFAULT_MALI_LAT + (Math.sin(offsetId) * 0.005);
      finalLng = DEFAULT_MALI_LNG + (Math.cos(offsetId) * 0.005);
    }

    return {
      ...inc,
      _lat: finalLat,
      _lng: finalLng,
      _hasFallbackCoords: hasFallbackCoords
    };
  }).filter((inc) => {
    // 2. Filtre d'attribution (Tous vs Mes incidents)
    if (ownershipFilter === 'mine') {
      const takenBy = inc?.taken_by;
      if (!takenBy || !currentUserId || String(takenBy).toLowerCase() !== String(currentUserId).toLowerCase()) {
        console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") rejeté: Filtre 'mine' actif mais taken_by (${takenBy}) ne correspond pas à l'utilisateur actuel (${currentUserId})`);
        return false;
      }
    }

    // 3. Filtre de statut (Actifs vs Résolus)
    const isResolved = inc?.etat == 'resolved';
    if (statusFilter === 'active' && isResolved) {
      console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") rejeté: Filtre 'active' mais l'état est 'resolved'`);
      return false;
    }
    if (statusFilter === 'resolved' && !isResolved) {
      console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") rejeté: Filtre 'resolved' mais l'état est '${inc.etat}'`);
      return false;
    }

    // 4. Filtrer les incidents supprimés
    if (inc?.is_deleted || inc?.isDeleted) {
      console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") rejeté: Incident marqué comme supprimé (is_deleted: ${inc.is_deleted}, isDeleted: ${inc.isDeleted})`);
      return false;
    }

    if (inc._hasFallbackCoords) {
      console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") ACCEPTE et affiché avec coordonnées par défaut du Mali : [${inc._lat}, ${inc._lng}]`);
    } else {
      console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") ACCEPTE et affiché avec coordonnées réelles : [${inc._lat}, ${inc._lng}]`);
    }
    return true;
  });

  console.log('[MAP] Nombre total d\'incidents affichés (validIncidents):', validIncidents.length);
  console.log('[MAP] --- Fin filtrage ---');

  const openModal = (incident) => {
    setModalClosing(false);
    setSelectedIncidentId(incident.id);
    // Délai pour permettre l'animation CSS
    setTimeout(() => {
      setModalShowing(true);
    }, 10);
  };

  const closeModal = () => {
    setModalShowing(false);
    setModalClosing(true);
    setTimeout(() => {
      setSelectedIncidentId(null);
      setModalClosing(false);
    }, 300);
  };

  // Centre de la carte basé sur la moyenne des coordonnées
  const center = (() => {
    if (validIncidents.length === 0) return { lng: -8.0, lat: 12.65 };
    const avg = validIncidents.reduce(
      (acc, inc) => {
        return {
          lng: acc.lng + inc._lng,
          lat: acc.lat + inc._lat
        };
      },
      { lng: 0, lat: 0 }
    );
    return {
      lng: avg.lng / validIncidents.length,
      lat: avg.lat / validIncidents.length
    };
  })();

  // Index de l'étape de statut courante
  const statusIndex = selectedIncident
    ? Math.max(
      0,
      INCIDENT_STATUS_STEPS.findIndex(
        (s) => s.id === (selectedIncident.etat || 'declared')
      )
    )
    : 0;

  return (
    <div className="card">
      <div className="map-container">
        {/* Loader overlay */}
        {(isLoading ||
          (ownershipFilter === 'mine' && isLoadingOrgIncidents)) && (
            <div className="map-loading-overlay">
              <div className="map-loading-spinner">
                <div className="spinner"></div>
                <p>Chargement des incidents...</p>
              </div>
            </div>
          )}

        <Map
          initialViewState={{
            longitude: center.lng,
            latitude: center.lat,
            zoom: 6
          }}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLES[activeStyle].style}
          cooperativeGestures={true}
          touchZoomRotate={true}
          touchPitch={true}
          maxBounds={[[-13.0, 9.5], [5.0, 26.0]]}
          minZoom={5.5}
        >
          {/* Markers d'incidents */}
          {!isLoading && validIncidents.map((incident) => {
            const colorClass = getMarkerColorClass(incident, currentUserId);
            return (
              <Marker
                key={incident.id}
                longitude={incident._lng}
                latitude={incident._lat}
                anchor="center"
              >
                <button
                  type="button"
                  className={`incident-marker severity-${colorClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(incident);
                  }}
                  aria-label={`Voir l'incident ${incident.title}`}
                  title={incident.title}
                >
                  <span className="incident-marker-pulse" />
                  <span className="incident-marker-dot" />
                </button>
              </Marker>
            );
          })}
        </Map>

        {/* Bandeau titre */}
        <div className="map-title-overlay">
          <span className="map-title-overlay-label">
            {statusFilter === 'resolved' ? (
              <>
                <span className="desktop-only-inline">INCIDENTS RÉSOLUS</span>
                <span className="mobile-only-inline">Résolus</span>
              </>
            ) : (
              <>
                <span className="desktop-only-inline">INCIDENTS ACTIFS</span>
                <span className="mobile-only-inline">Actifs</span>
              </>
            )}
          </span>
          <span className="map-title-overlay-count">{validIncidents.length}</span>
        </div>

        {/* Switcher de style de carte */}
        <div className="map-style-switcher">
          {Object.values(MAP_STYLES).map((s) => (
            <button
              key={s.id}
              type="button"
              className={`map-style-btn ${activeStyle === s.id ? 'is-active' : ''}`}
              onClick={() => setActiveStyle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Filtres de la carte */}
        <div className="map-filters-overlay">
          <div className="map-filter-group">
            <select
              className="map-filter-select"
              value={ownershipFilter}
              onChange={(e) => setOwnershipFilter(e.target.value)}
              aria-label="Filtre d'attribution"
            >
              <option value="all">Tous les incidents</option>
              <option value="mine">Mes incidents</option>
            </select>
          </div>

          <div className="map-filter-buttons">
            <button
              type="button"
              className={`map-filter-btn ${statusFilter === 'active' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Actifs
            </button>
            <button
              type="button"
              className={`map-filter-btn ${statusFilter === 'resolved' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('resolved')}
            >
              Résolus
            </button>
          </div>
        </div>

        {/* Légende stylisée moderne */}
        <div className="map-legend-modern">
          {statusFilter === 'active' ? (
            <>
              <p className="map-legend-title">Gravité</p>
              <div className="map-legend-list">
                <div className="map-legend-item">
                  <span
                    className="map-legend-dot"
                    style={{ backgroundColor: '#EF4444' }}
                  />
                  Élevée
                </div>
                <div className="map-legend-item">
                  <span
                    className="map-legend-dot"
                    style={{ backgroundColor: '#F97316' }}
                  />
                  Moyenne
                </div>
                <div className="map-legend-item">
                  <span
                    className="map-legend-dot"
                    style={{ backgroundColor: '#FACC15' }}
                  />
                  Faible
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="map-legend-title">INCIDENTS RÉSOLUS</p>
              <div className="map-legend-list">
                <div className="map-legend-item">
                  <span
                    className="map-legend-dot"
                    style={{ backgroundColor: '#3AA2DD' }}
                  />
                  Par d'autres
                </div>
                <div className="map-legend-item">
                  <span
                    className="map-legend-dot"
                    style={{ backgroundColor: '#22C55E' }}
                  />
                  Par moi
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal d'incident (Bootstrap modal) */}
      {selectedIncidentId && (
        <>
          <div
            className={`modal fade ${modalShowing && !modalClosing ? 'show' : ''}`}
            style={{ display: 'block' }}
            tabIndex="-1"
            role="dialog"
            onClick={closeModal}
          >
            <div
              className="modal-dialog modal-dialog-scrollable"
              role="document"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content">
                {/* Header */}
                <div className="modal-header">
                  <div className="d-flex flex-column" style={{ minWidth: 0, flex: 1 }}>
                    <h5 className="modal-title fw-bold">
                      {isLoadingIncident ? (
                        <ShimmerTitle line={1} gap={10} variant="primary" />
                      ) : (
                        selectedIncident?.title || 'Chargement...'
                      )}
                    </h5>
                    <small className="text-muted mt-1">
                      {isLoadingIncident ? (
                        <ShimmerText line={1} gap={10} />
                      ) : (
                        <>{selectedIncident?.zone} • {translateEtat(selectedIncident?.etat)}</>
                      )}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                    aria-label="Fermer"
                  />
                </div>

                {/* Body scrollable */}
                <div className="modal-body">
                  {isLoadingIncident || !selectedIncident ? (
                    <div>
                      <ShimmerThumbnail height={240} rounded />
                      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                        <ShimmerTitle line={1} gap={10} variant="secondary" />
                      </div>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <ShimmerText line={3} gap={10} />
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <ShimmerThumbnail height={120} rounded />
                      </div>
                      <ShimmerText line={5} gap={10} />
                    </div>
                  ) : (
                    <>
                      {/* Cover image */}
                      {selectedIncident.photo && (
                        <BlurryImage
                          src={selectedIncident.photo}
                          alt={selectedIncident.title}
                          className="img-fluid rounded mb-3 w-100"
                          style={{ maxHeight: '300px', objectFit: 'cover' }}
                        />
                      )}

                      {/* Badges */}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className={`badge ${selectedIncident.etat === 'resolved'
                          ? 'badge-status-resolved'
                          : selectedIncident.etat === 'taken_into_account'
                            ? 'badge-status-taken_into_account'
                            : selectedIncident.etat === 'pending'
                              ? 'badge-status-pending'
                              : 'badge-status-declared'
                          }`}>
                          STATUT : {
                            selectedIncident.etat === 'resolved'
                              ? 'RÉSOLU'
                              : selectedIncident.etat === 'taken_into_account'
                                ? 'PRIS EN COMPTE'
                                : selectedIncident.etat === 'pending'
                                  ? 'EN ATTENTE'
                                  : 'DÉCLARÉ'
                          }
                        </span>
                        {selectedIncident.zone && (
                          <span className="badge bg-info text-dark">
                            {selectedIncident.zone}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {selectedIncident.description && (
                        <p className="text-secondary mb-3">
                          {selectedIncident.description}
                        </p>
                      )}

                      {/* Méta-données */}
                      <ul className="list-group list-group-flush mb-3">
                        <li className="list-group-item px-0">
                          <strong>Créé le :</strong>{' '}
                          {new Date(selectedIncident.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </li>
                        <li className="list-group-item px-0">
                          <strong>Coordonnées :</strong>{' '}
                          {(() => {
                            const latVal = selectedIncident.lattitude !== undefined ? selectedIncident.lattitude : selectedIncident.latitude;
                            const lat = parseFloat(latVal);
                            const lng = parseFloat(selectedIncident.longitude);
                            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                              return "Non spécifiées (Mali par défaut)";
                            }
                            return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
                          })()}
                        </li>
                      </ul>

                      {/* Statut de l'incident */}
                      <div className={`mb-4 status-stepper-${selectedIncident?.etat || 'declared'}`}>
                        <h6 className="section-title mb-3">STATUT DE L'INCIDENT</h6>
                        <div className="incident-modal-status-bar">
                          {INCIDENT_STATUS_STEPS.map((step, idx) => (
                            <div
                              key={step.id}
                              className={`incident-modal-status-segment ${idx < statusIndex ? 'is-done' : ''
                                } ${idx === statusIndex ? 'is-current' : ''}`}
                            />
                          ))}
                        </div>
                        <div className="incident-modal-status-steps">
                          {INCIDENT_STATUS_STEPS.map((step, idx) => (
                            <div
                              key={step.id}
                              className={`incident-modal-status-step ${idx < statusIndex ? 'is-done' : ''
                                } ${idx === statusIndex ? 'is-current' : ''}`}
                            >
                              <span className="incident-modal-status-dot" />
                              <span>{step.label.toUpperCase()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Audio */}
                      {selectedIncident.audio && (
                        <div className="mb-4">
                          <h6 className="section-title mb-2">AUDIO</h6>
                          <audio controls className="w-100">
                            <source src={selectedIncident.audio} type="audio/mpeg" />
                            Votre navigateur ne supporte pas l'élément audio.
                          </audio>
                        </div>
                      )}

                      {/* Vidéo */}
                      {selectedIncident.video && (
                        <div className="mb-4">
                          <h6 className="section-title mb-2">VIDÉO DE PRÉSENTATION</h6>
                          <video
                            controls
                            className="w-100 rounded"
                            style={{ maxHeight: '400px' }}
                          >
                            <source src={selectedIncident.video} type="video/mp4" />
                            Votre navigateur ne supporte pas la lecture de vidéos.
                          </video>
                        </div>
                      )}

                      {/* Organisations participantes */}
                      {selectedIncident.participants?.length > 0 && (
                        <div className="mb-3">
                          <h6 className="section-title mb-3">ORGANISATIONS MOBILISÉES</h6>
                          <div className="d-flex flex-wrap gap-3 mb-3">
                            {selectedIncident.participants.map((p, idx) => (
                              <div key={idx} className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                  style={{
                                    backgroundColor: p.color,
                                    width: '40px',
                                    height: '40px',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  {p.initials}
                                </div>
                                <span>{p.name}</span>
                              </div>
                            ))}
                            {selectedIncident.extraParticipants > 0 && (
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                  style={{
                                    backgroundColor: '#9CA3AF',
                                    width: '40px',
                                    height: '40px',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  +{selectedIncident.extraParticipants}
                                </div>
                                <span>Autres organisations</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer avec bouton Savoir plus */}
                {!isLoadingIncident && selectedIncident && (
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeModal}
                    >
                      Fermer
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        console.log(`/incidents/${selectedIncident.id}`);
                        console.log(selectedIncident);

                        // return
                        navigate(`/incidents/${selectedIncident.id}`, { state: "dashboard" })
                      }}
                    >
                      Savoir plus
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Backdrop */}
          <div className={`modal-backdrop fade ${modalShowing && !modalClosing ? 'show' : ''}`} />
        </>
      )}
    </div>
  );
};

export default MapContainer;
