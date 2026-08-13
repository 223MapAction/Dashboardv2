import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText } from 'react-shimmer-effects';
import { getIncidentService } from '../../../incident/service/incident_service';
import { getOrgInternalIncidentsService } from '../../../mes-interventions/service/mes_interventions_service';
import { getIncidentsFilteredService } from '../../service/dashboard_service';
import { BlurryImage } from '../../../../components/atoms/BlurryImage';
import { COUNTRIES } from '../../../organisations/data/organisations';
import './map.css';
import { useReinitialisationSurChangement } from '../../../../hooks/useReinitialisationSurChangement';


// Token Mapbox depuis les variables d'environnement
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Détermine la sévérité d'un incident à partir de sa sévérité directe, base_severity (0 à 10) ou de ses badges
const getSeverity = (project) => {
  if (project.severity === 'high' || project.severity === 'medium' || project.severity === 'low') {
    return project.severity;
  }

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
// Affichage mondial sans restriction géographique
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

const DEFAULT_MALI_LAT = 12.65; // Bamako
const DEFAULT_MALI_LNG = -8.0;

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

export const MapContainer = () => {
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
  const [countryFilter, setCountryFilter] = useState(''); // Filtre pays (vide = tous les pays)

  // Récupérer le pays de l'organisation de l'utilisateur
  const userOrgCountry = sessionStorage.getItem('organisation_country') || '';

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

  // ── Chargement progressif des incidents ──────────────────────────────────────
  const [allIncidents, setAllIncidents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadedPagesRef = useRef(new Set());

  // Sur ecran tactile, un doigt doit faire defiler la PAGE, pas deplacer la
  // carte : sur le tableau de bord elle occupe 77% de la hauteur, on ne
  // pourrait plus descendre. `dragPan` couvrant a la fois la souris et le
  // doigt, on ne le coupe que sur pointeur grossier — le glisser a la souris
  // reste intact sur ordinateur.
  //
  // Le pincement a deux doigts continue de zoomer via `touchZoomRotate`.
  const estTactile = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    []
  );

  // Déterminer le scope en fonction des filtres
  const getScope = () => {
    if (ownershipFilter === 'mine') return 'mine';
    if (statusFilter === 'resolved') return 'resolved';
    if (statusFilter === 'active') return 'unresolved';
    return 'all';
  };

  const scope = getScope();

  // Repartir d'une liste vide des qu'un filtre change : les incidents deja
  // charges appartiennent au filtre precedent.
  useReinitialisationSurChangement([ownershipFilter, statusFilter, countryFilter], () => {
    setAllIncidents([]);
    setCurrentPage(1);
    setHasMorePages(true);
    loadedPagesRef.current = new Set();
  });

  // Charger une page d'incidents
  const { data: pageData, isLoading: isLoadingPage } = useSWR(
    ownershipFilter === 'mine'
      ? (currentPage === 1 ? '/org-incidents' : null) // Pour "mine", utiliser l'ancien endpoint
      : `/map-incidents-${scope}-${countryFilter || 'all'}-page-${currentPage}`,
    async () => {
      if (ownershipFilter === 'mine') {
        // Pour "Mes incidents", utiliser l'ancien service
        return getOrgInternalIncidentsService();
      }
      // Pour les autres, utiliser le nouvel endpoint paginé
      const params = {
        scope,
        page: currentPage,
        page_size: 30
      };
      // Ajouter le filtre pays si défini
      if (countryFilter) {
        params.country = countryFilter;
      }
      return getIncidentsFilteredService(params);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onError: (err) => {
        console.error('[MAP] Erreur chargement incidents:', err);
        setIsLoadingMore(false);
      }
    }
  );

  // L'accumulation se fait ici, à partir de `data`, et non plus dans le
  // `onSuccess` de SWR.
  //
  // `onSuccess` ne se déclenche qu'au retour d'une requête réseau. Quand on
  // quittait le tableau de bord puis qu'on y revenait, SWR servait sa valeur en
  // cache sans refetch — donc sans `onSuccess` — tandis que `allIncidents`,
  // qui est un état de composant, repartait à zéro au remontage. La carte
  // restait vide alors que la donnée était là, dans le cache.
  //
  // Un effet sur `data` couvre les deux cas : réponse réseau ET valeur servie
  // depuis le cache au montage.
  /* eslint-disable react-hooks/set-state-in-effect --
     On synchronise ici une source exterieure a React (le cache SWR) vers un
     accumulateur local : c'est l'usage prevu d'un effet. Le garde-fou
     `loadedPagesRef` empeche toute boucle, une page deja integree est ignoree. */
  useEffect(() => {
    if (!pageData) return;

    const pageKey = `${scope}-${countryFilter || 'all'}-${currentPage}`;
    if (loadedPagesRef.current.has(pageKey)) return;
    loadedPagesRef.current.add(pageKey);

    const results = pageData.results || (Array.isArray(pageData) ? pageData : []);

    setAllIncidents((prev) => {
      const dejaLa = new Set(prev.map((inc) => inc.id));
      return [...prev, ...results.filter((inc) => !dejaLa.has(inc.id))];
    });

    setHasMorePages(ownershipFilter === 'mine' ? false : !!pageData.next);
    setIsLoadingMore(false);
  }, [pageData, scope, countryFilter, currentPage, ownershipFilter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fonction pour charger la page suivante
  const loadMoreIncidents = useCallback(() => {
    if (!hasMorePages || isLoadingMore || isLoadingPage) return;
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  }, [hasMorePages, isLoadingMore, isLoadingPage]);

  const normalizedIncidents = allIncidents;



  // Filtre uniquement les incidents avec coordonnées valides et selon les critères de filtres
  const validIncidents = useMemo(() => normalizedIncidents.map((inc) => {
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
      let offsetNum = 0;
      if (typeof offsetId === 'number') {
        offsetNum = offsetId;
      } else if (typeof offsetId === 'string') {
        for (let i = 0; i < offsetId.length; i++) {
          offsetNum = (offsetNum << 5) - offsetNum + offsetId.charCodeAt(i);
          offsetNum |= 0; // Convert to 32bit integer
        }
      }
      finalLat = DEFAULT_MALI_LAT + (Math.sin(offsetNum) * 0.005);
      finalLng = DEFAULT_MALI_LNG + (Math.cos(offsetNum) * 0.005);
    }

    if (isNaN(finalLat) || isNaN(finalLng)) {
      finalLat = DEFAULT_MALI_LAT;
      finalLng = DEFAULT_MALI_LNG;
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
        // console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") rejeté: Filtre 'mine' actif mais taken_by (${takenBy}) ne correspond pas à l'utilisateur actuel (${currentUserId})`);
        return false;
      }
    }

    // 3. Filtre de statut (Actifs vs Résolus)
    const isResolved = inc?.etat == 'resolved';
    // Si le filtre est 'resolved', on n'affiche que les incidents résolus.
    // Si le filtre est 'active', on affiche tout (actifs et résolus confondus).
    if (statusFilter === 'resolved' && !isResolved) {
      return false;
    }

    // 4. Filtrer les incidents supprimés
    if (inc?.is_deleted || inc?.isDeleted) {
      // console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") rejeté: Incident marqué comme supprimé (is_deleted: ${inc.is_deleted}, isDeleted: ${inc.isDeleted})`);
      return false;
    }

    if (inc._hasFallbackCoords) {
      // console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") ACCEPTE et affiché avec coordonnées par défaut du Mali : [${inc._lat}, ${inc._lng}]`);
    } else {
      // console.log(`[MAP] Incident ID ${inc.id} ("${inc.title}") ACCEPTE et affiché avec coordonnées réelles : [${inc._lat}, ${inc._lng}]`);
    }
    return true;
  }), [normalizedIncidents, ownershipFilter, statusFilter, currentUserId]);

  // Plusieurs incidents peuvent partager exactement la même position (même site
  // signalé plusieurs fois). Sans regroupement, les marqueurs se dessinent l'un
  // sur l'autre et seul le dernier est visible : la carte semble alors perdre
  // des incidents. On rend donc un marqueur par position, porteur du nombre
  // d'incidents qu'il représente.
  // Attention : `Map` est ici le composant react-map-gl importé en tête de
  // fichier, pas la structure de données JavaScript. On indexe donc avec un
  // objet simple pour éviter toute ambiguïté.
  const incidentGroups = useMemo(() => {
    const parPosition = Object.create(null);
    const ordre = [];
    for (const inc of validIncidents) {
      const cle = `${inc._lat}|${inc._lng}`;
      if (parPosition[cle]) {
        parPosition[cle].incidents.push(inc);
      } else {
        parPosition[cle] = { cle, lat: inc._lat, lng: inc._lng, incidents: [inc] };
        ordre.push(cle);
      }
    }
    return ordre.map((cle) => parPosition[cle]);
  }, [validIncidents]);

  // Position dont la liste d'incidents est ouverte (uniquement si elle en a
  // plusieurs — un marqueur isolé ouvre directement le détail).
  const [groupeOuvert, setGroupeOuvert] = useState(null);

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

  const isMapLoading = isLoadingPage && allIncidents.length === 0;

  return (
    <div className="card">
      <div className="map-container">
        {/* Loader overlay */}
        {isMapLoading && (
          <div className="map-loading-overlay">
            <div className="map-loading-spinner">
              <div className="spinner"></div>
              <p>Chargement des signalements...</p>
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
          dragPan={!estTactile}
          touchZoomRotate={true}
          touchPitch={true}
          minZoom={2}
          maxZoom={18}
          onMoveEnd={() => {
            // Charger automatiquement plus d'incidents quand l'utilisateur déplace/zoom la carte
            if (hasMorePages && !isLoadingMore && !isLoadingPage && validIncidents.length > 0) {
              loadMoreIncidents();
            }
          }}
        >

          {/* Markers d'incidents — un par position, pas un par incident */}
          {!isMapLoading && incidentGroups.map((groupe) => {
            const principal = groupe.incidents[0];
            const nombre = groupe.incidents.length;
            const colorClass = getMarkerColorClass(principal, currentUserId);
            const libelle = nombre > 1
              ? `${nombre} incidents à cet emplacement`
              : `Voir l'incident ${principal.title}`;

            return (
              <Marker
                key={groupe.cle}
                longitude={groupe.lng}
                latitude={groupe.lat}
                anchor="center"
              >
                <button
                  type="button"
                  className={`incident-marker severity-${colorClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (nombre > 1) {
                      setGroupeOuvert(groupe);
                    } else {
                      openModal(principal);
                    }
                  }}
                  aria-label={libelle}
                  title={libelle}
                >
                  <span className="incident-marker-pulse" />
                  <span className="incident-marker-dot" />
                  {nombre > 1 && (
                    <span className="incident-marker-count">{nombre}</span>
                  )}
                </button>
              </Marker>
            );
          })}

          {/* Liste des incidents partageant une même position */}
          {groupeOuvert && (
            <Popup
              longitude={groupeOuvert.lng}
              latitude={groupeOuvert.lat}
              anchor="bottom"
              offset={18}
              closeOnClick={false}
              onClose={() => setGroupeOuvert(null)}
              className="incident-group-popup"
            >
              <p className="incident-group-title">
                {groupeOuvert.incidents.length} incidents à cet emplacement
              </p>
              <ul className="incident-group-list">
                {groupeOuvert.incidents.map((inc) => (
                  <li key={inc.id}>
                    <button
                      type="button"
                      className={`incident-group-item severity-${getMarkerColorClass(inc, currentUserId)}`}
                      onClick={() => {
                        setGroupeOuvert(null);
                        openModal(inc);
                      }}
                    >
                      <span className="incident-group-dot" />
                      <span className="incident-group-label">
                        {inc.title || 'Incident sans titre'}
                      </span>
                      <span className="incident-group-etat">{translateEtat(inc.etat)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Popup>
          )}
        </Map>



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
              <option value="all">Tous les signalements</option>
              <option value="mine">Mes signalements</option>
            </select>
          </div>

          <div className="map-filter-group">
            <select
              className="map-filter-select"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              aria-label="Filtre par pays"
            >
              <option value="">Tous les pays</option>
              {userOrgCountry && (
                <option value={userOrgCountry}>
                  Mon pays ({COUNTRIES.find(c => c.en === userOrgCountry)?.fr || userOrgCountry})
                </option>
              )}
              {COUNTRIES.map((country) => (
                <option key={country.en} value={country.en}>
                  {country.fr}
                </option>
              ))}
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
                    style={{ backgroundColor: 'var(--color-severity-high)' }}
                  />
                  Élevée
                </div>
                <div className="map-legend-item">
                  <span
                    className="map-legend-dot"
                    style={{ backgroundColor: 'var(--color-warning)' }}
                  />
                  Moyenne
                </div>
                <div className="map-legend-item">
                  <span
                    className="map-legend-dot"
                    style={{ backgroundColor: 'var(--color-severity-medium)' }}
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
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                  Par d'autres
                </div>
                <div className="map-legend-item">
                  <span
                    className="map-legend-dot"
                    style={{ backgroundColor: 'var(--color-severity-low)' }}
                  />
                  Par moi
                </div>
              </div>
            </>
          )}
        </div>

        {/* Indicateur de chargement progressif et bouton "Charger plus" */}
        {!isMapLoading && (
          <div className="map-status-stack">
            {/* Compteur d'incidents affichés */}
            <div className="map-incidents-count">
              {validIncidents.length} incident{validIncidents.length > 1 ? 's' : ''} affiché{validIncidents.length > 1 ? 's' : ''}
            </div>

            {/* Bouton "Charger plus" si des pages restent */}
            {hasMorePages && (
              <button
                type="button"
                onClick={loadMoreIncidents}
                disabled={isLoadingMore || isLoadingPage}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(var(--rgb-ombre), 0.15)',
                  cursor: isLoadingMore || isLoadingPage ? 'not-allowed' : 'pointer',
                  opacity: isLoadingMore || isLoadingPage ? 0.7 : 1
                }}
              >
                {isLoadingMore || isLoadingPage ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                    Chargement...
                  </>
                ) : (
                  'Charger plus d\'incidents'
                )}
              </button>
            )}
          </div>
        )}
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
                                    backgroundColor: 'var(--color-text-muted)',
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
                        navigate(`/signalements/${selectedIncident.id}`, { state: { from: '/dashboard' } });
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
