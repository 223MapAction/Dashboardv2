import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { activerGestesCooperatifs } from '../../../../utils/gestesCarte';
import { NIVEAUX_GRAVITE, gravite, couleurGravite } from '../../../../utils/gravite';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ShimmerThumbnail, ShimmerTitle, ShimmerText } from 'react-shimmer-effects';
import { getSignalementService } from '../../../signalement/service/signalement_service';
import { getOrgInternalSignalementsService } from '../../../mes-interventions/service/mes_interventions_service';
import { getSignalementsFilteredService } from '../../service/dashboard_service';
import { BlurryImage } from '../../../../components/atoms/BlurryImage';
import { COUNTRIES } from '../../../organisations/data/organisations';
import { OSM_STYLE, MAPBOX_SATELLITE_STYLE, HAS_MAPBOX_SATELLITE } from '../../../../config/mapStyles';
import './map.css';
import { useReinitialisationSurChangement } from '../../../../hooks/useReinitialisationSurChangement';
import { logger } from '../../../../utils/logger';


// Calcule la classe de couleur du marqueur en fonction de son statut et de l'utilisateur connecté
const getMarkerColorClass = (signalement, currentUserId) => {
  const isResolved = signalement.etat === 'resolved';
  if (isResolved) {
    let takenById = null;
    if (signalement.taken_by && typeof signalement.taken_by === 'object') {
      takenById = signalement.taken_by.id;
    } else {
      takenById = signalement.taken_by || signalement.takenBy;
    }
    const takenBy = parseInt(takenById);
    const me = parseInt(currentUserId);
    if (!isNaN(takenBy) && !isNaN(me) && takenBy === me) {
      return 'resolved-mine'; // Vert
    }
    return 'resolved-others'; // Bleu
  }

  // Si l'signalement est actif, sa couleur dépend de sa gravité (sans bleu ni vert).
  // Les niveaux viennent de utils/gravite.js, qui lit le champ `severity` decide
  // par le serveur. La carte les recalculait avec ses propres seuils, si bien
  // qu'un signalement pouvait etre « moyen » ici et « eleve » sur la page Impact.
  return `active-${gravite(signalement)}`;
};

const INCIDENT_STATUS_STEPS = [
  { id: 'declared', label: 'Déclaré', },
  { id: 'taken_into_account', label: 'Pris en compte', },

  { id: 'resolved', label: 'Résolu' }
];

// Style "Humanitaire" par defaut : tuiles OpenStreetMap HOT ouvertes,
// aucune dependance a un service tiers payant. Satellite optionnel,
// disponible uniquement si un token Mapbox est configure.
const MAP_STYLES = {
  humanitarian: {
    id: 'humanitarian',
    label: 'Carte',
    style: OSM_STYLE
  },
  ...(HAS_MAPBOX_SATELLITE
    ? {
        satellite: {
          id: 'satellite',
          label: 'Satellite',
          style: MAPBOX_SATELLITE_STYLE
        }
      }
    : {})
};

const DEFAULT_MALI_LAT = 12.65; // Bamako
const DEFAULT_MALI_LNG = -8.0;

// Traduit l'état de l'signalement en français
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
  const [selectedSignalementId, setSelectedSignalementId] = useState(null);
  const [modalClosing, setModalClosing] = useState(false);
  const [modalShowing, setModalShowing] = useState(false);
  const navigate = useNavigate();

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (selectedSignalementId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedSignalementId]);
  const [activeStyle, setActiveStyle] = useState('humanitarian');

  // ── États locaux pour les filtres de la carte ────────────────────────────────
  const currentUserId = sessionStorage.getItem('user_id');
  const [ownershipFilter, setOwnershipFilter] = useState('all'); // 'all' | 'mine'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'resolved'
  const [countryFilter, setCountryFilter] = useState(''); // Filtre pays (vide = tous les pays)

  // Récupérer le pays de l'organisation de l'utilisateur
  const userOrgCountry = sessionStorage.getItem('organisation_country') || '';

  // Utiliser useSWR pour récupérer les détails de l'signalement sélectionné
  const { data: selectedSignalement, isLoading: isLoadingSignalement } = useSWR(
    selectedSignalementId ? `/incident/${selectedSignalementId}` : null,
    () => getSignalementService(selectedSignalementId),
    {
      revalidateOnFocus: false,

      onError: (err) => {
        logger.error('[MAP] Erreur chargement incident:', err);
      }
    }
  );

  // ── Chargement progressif des signalements ──────────────────────────────────────
  const [allSignalements, setAllSignalements] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadedPagesRef = useRef(new Set());
  const carteRef = useRef(null);

  // On passe par la reference et non par `onLoad` : cet evenement ne se
  // declenche pas de facon fiable ici — verifie, la carte s'affiche sans qu'il
  // parte jamais. La reference, elle, est posee des le montage.
  useEffect(() => {
    let annule = false;
    const essayer = () => {
      if (annule) return;
      const carte = carteRef.current?.getMap?.();
      if (carte) { activerGestesCooperatifs(carte); return; }
      setTimeout(essayer, 300);
    };
    essayer();
    return () => { annule = true; };
  }, []);

  // Déterminer le scope en fonction des filtres
  const getScope = () => {
    if (ownershipFilter === 'mine') return 'mine';
    if (statusFilter === 'resolved') return 'resolved';
    if (statusFilter === 'active') return 'unresolved';
    return 'all';
  };

  const scope = getScope();

  // Repartir d'une liste vide des qu'un filtre change : les signalements deja
  // charges appartiennent au filtre precedent.
  useReinitialisationSurChangement([ownershipFilter, statusFilter, countryFilter], () => {
    setAllSignalements([]);
    setCurrentPage(1);
    setHasMorePages(true);
    loadedPagesRef.current = new Set();
  });

  // Charger une page d'signalements
  const { data: pageData, isLoading: isLoadingPage } = useSWR(
    ownershipFilter === 'mine'
      ? (currentPage === 1 ? '/org-signalements' : null) // Pour "mine", utiliser l'ancien endpoint
      : `/map-signalements-${scope}-${countryFilter || 'all'}-page-${currentPage}`,
    async () => {
      if (ownershipFilter === 'mine') {
        // Pour "Mes signalements", utiliser l'ancien service
        return getOrgInternalSignalementsService();
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
      return getSignalementsFilteredService(params);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      onError: (err) => {
        logger.error('[MAP] Erreur chargement incidents:', err);
        setIsLoadingMore(false);
      }
    }
  );

  // L'accumulation se fait ici, à partir de `data`, et non plus dans le
  // `onSuccess` de SWR.
  //
  // `onSuccess` ne se déclenche qu'au retour d'une requête réseau. Quand on
  // quittait le tableau de bord puis qu'on y revenait, SWR servait sa valeur en
  // cache sans refetch — donc sans `onSuccess` — tandis que `allSignalements`,
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

    setAllSignalements((prev) => {
      const dejaLa = new Set(prev.map((inc) => inc.id));
      return [...prev, ...results.filter((inc) => !dejaLa.has(inc.id))];
    });

    setHasMorePages(ownershipFilter === 'mine' ? false : !!pageData.next);
    setIsLoadingMore(false);
  }, [pageData, scope, countryFilter, currentPage, ownershipFilter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fonction pour charger la page suivante
  const loadMoreSignalements = useCallback(() => {
    if (!hasMorePages || isLoadingMore || isLoadingPage) return;
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  }, [hasMorePages, isLoadingMore, isLoadingPage]);

  const normalizedSignalements = allSignalements;



  // Filtre uniquement les signalements avec coordonnées valides et selon les critères de filtres
  const validSignalements = useMemo(() => normalizedSignalements.map((inc) => {
    const latVal = inc.lattitude !== undefined ? inc.lattitude : inc.latitude;
    const lat = parseFloat(latVal);
    const lng = parseFloat(inc.longitude);
    const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

    let finalLat = lat;
    let finalLng = lng;
    let hasFallbackCoords = false;

    if (!hasValidCoords) {
      hasFallbackCoords = true;
      // Ajout d'une petite variation déterministe basée sur l'ID de l'signalement pour éviter la superposition parfaite
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
    // 2. Filtre d'attribution (Tous vs Mes signalements)
    if (ownershipFilter === 'mine') {
      const takenBy = inc?.taken_by;
      if (!takenBy || !currentUserId || String(takenBy).toLowerCase() !== String(currentUserId).toLowerCase()) {
        // console.log(`[MAP] Signalement ID ${inc.id} ("${inc.title}") rejeté: Filtre 'mine' actif mais taken_by (${takenBy}) ne correspond pas à l'utilisateur actuel (${currentUserId})`);
        return false;
      }
    }

    // 3. Filtre de statut (Actifs vs Résolus)
    const isResolved = inc?.etat == 'resolved';
    // Si le filtre est 'resolved', on n'affiche que les signalements résolus.
    // Si le filtre est 'active', on affiche tout (actifs et résolus confondus).
    if (statusFilter === 'resolved' && !isResolved) {
      return false;
    }

    // 4. Filtrer les signalements supprimés
    if (inc?.is_deleted || inc?.isDeleted) {
      // console.log(`[MAP] Signalement ID ${inc.id} ("${inc.title}") rejeté: Signalement marqué comme supprimé (is_deleted: ${inc.is_deleted}, isDeleted: ${inc.isDeleted})`);
      return false;
    }

    if (inc._hasFallbackCoords) {
      // console.log(`[MAP] Signalement ID ${inc.id} ("${inc.title}") ACCEPTE et affiché avec coordonnées par défaut du Mali : [${inc._lat}, ${inc._lng}]`);
    } else {
      // console.log(`[MAP] Signalement ID ${inc.id} ("${inc.title}") ACCEPTE et affiché avec coordonnées réelles : [${inc._lat}, ${inc._lng}]`);
    }
    return true;
  }), [normalizedSignalements, ownershipFilter, statusFilter, currentUserId]);

  // Plusieurs signalements peuvent partager exactement la même position (même site
  // signalé plusieurs fois). Sans regroupement, les marqueurs se dessinent l'un
  // sur l'autre et seul le dernier est visible : la carte semble alors perdre
  // des signalements. On rend donc un marqueur par position, porteur du nombre
  // d'signalements qu'il représente.
  // Attention : `Map` est ici le composant react-map-gl importé en tête de
  // fichier, pas la structure de données JavaScript. On indexe donc avec un
  // objet simple pour éviter toute ambiguïté.
  const incidentGroups = useMemo(() => {
    const parPosition = Object.create(null);
    const ordre = [];
    for (const inc of validSignalements) {
      const cle = `${inc._lat}|${inc._lng}`;
      if (parPosition[cle]) {
        parPosition[cle].incidents.push(inc);
      } else {
        parPosition[cle] = { cle, lat: inc._lat, lng: inc._lng, incidents: [inc] };
        ordre.push(cle);
      }
    }
    return ordre.map((cle) => parPosition[cle]);
  }, [validSignalements]);

  // Position dont la liste d'signalements est ouverte (uniquement si elle en a
  // plusieurs — un marqueur isolé ouvre directement le détail).
  const [groupeOuvert, setGroupeOuvert] = useState(null);

  const openModal = (signalement) => {
    setModalClosing(false);
    setSelectedSignalementId(signalement.id);
    // Délai pour permettre l'animation CSS
    setTimeout(() => {
      setModalShowing(true);
    }, 10);
  };

  const closeModal = () => {
    setModalShowing(false);
    setModalClosing(true);
    setTimeout(() => {
      setSelectedSignalementId(null);
      setModalClosing(false);
    }, 300);
  };

  // Centre de la carte basé sur la moyenne des coordonnées
  const center = (() => {
    if (validSignalements.length === 0) return { lng: -8.0, lat: 12.65 };
    const avg = validSignalements.reduce(
      (acc, inc) => {
        return {
          lng: acc.lng + inc._lng,
          lat: acc.lat + inc._lat
        };
      },
      { lng: 0, lat: 0 }
    );
    return {
      lng: avg.lng / validSignalements.length,
      lat: avg.lat / validSignalements.length
    };
  })();

  // Index de l'étape de statut courante
  const statusIndex = selectedSignalement
    ? Math.max(
      0,
      INCIDENT_STATUS_STEPS.findIndex(
        (s) => s.id === (selectedSignalement.etat || 'declared')
      )
    )
    : 0;

  const isMapLoading = isLoadingPage && allSignalements.length === 0;

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
          ref={carteRef}
          initialViewState={{
            longitude: center.lng,
            latitude: center.lat,
            zoom: 6
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAP_STYLES[activeStyle].style}
          cooperativeGestures={true}
          touchZoomRotate={true}
          touchPitch={true}
          minZoom={2}
          maxZoom={18}
          onMoveEnd={() => {
            // Charger automatiquement plus d'signalements quand l'utilisateur déplace/zoom la carte
            if (hasMorePages && !isLoadingMore && !isLoadingPage && validSignalements.length > 0) {
              loadMoreSignalements();
            }
          }}
        >

          {/* Markers d'signalements — un par position, pas un par signalement */}
          {!isMapLoading && incidentGroups.map((groupe) => {
            const principal = groupe.incidents[0];
            const nombre = groupe.incidents.length;
            const colorClass = getMarkerColorClass(principal, currentUserId);
            const libelle = nombre > 1
              ? `${nombre} signalements à cet emplacement`
              : `Voir l'signalement ${principal.title}`;

            return (
              <Marker
                key={groupe.cle}
                longitude={groupe.lng}
                latitude={groupe.lat}
                anchor="center"
              >
                <button
                  type="button"
                  className={`signalement-marker severity-${colorClass}`}
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
                  <span className="signalement-marker-pulse" />
                  <span className="signalement-marker-dot" />
                  {nombre > 1 && (
                    <span className="signalement-marker-count">{nombre}</span>
                  )}
                </button>
              </Marker>
            );
          })}

          {/* Liste des signalements partageant une même position */}
          {groupeOuvert && (
            <Popup
              longitude={groupeOuvert.lng}
              latitude={groupeOuvert.lat}
              anchor="bottom"
              offset={18}
              closeOnClick={false}
              onClose={() => setGroupeOuvert(null)}
              className="signalement-group-popup"
            >
              <p className="signalement-group-title">
                {groupeOuvert.incidents.length} signalements à cet emplacement
              </p>
              <ul className="signalement-group-list">
                {groupeOuvert.incidents.map((inc) => (
                  <li key={inc.id}>
                    <button
                      type="button"
                      className={`signalement-group-item severity-${getMarkerColorClass(inc, currentUserId)}`}
                      onClick={() => {
                        setGroupeOuvert(null);
                        openModal(inc);
                      }}
                    >
                      <span className="signalement-group-dot" />
                      <span className="signalement-group-label">
                        {inc.title || 'Signalement sans titre'}
                      </span>
                      <span className="signalement-group-etat">{translateEtat(inc.etat)}</span>
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
              {/* Legende derivee de l'echelle, pas recopiee : c'est une liste
                  ecrite a la main qui avait fini par afficher deux fois la meme
                  pastille pour deux niveaux differents. La carte reste la
                  reference — les autres vues s'alignent sur ces couleurs. */}
              <div className="map-legend-list">
                {NIVEAUX_GRAVITE.map(({ cle, libelle }) => (
                  <div className="map-legend-item" key={cle}>
                    <span
                      className="map-legend-dot"
                      style={{ backgroundColor: couleurGravite(cle) }}
                    />
                    {libelle}
                  </div>
                ))}
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
                    style={{ backgroundColor: 'var(--color-success)' }}
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
            {/* Compteur d'signalements affichés */}
            <div className="map-signalements-count">
              {validSignalements.length} signalement{validSignalements.length > 1 ? 's' : ''} affiché{validSignalements.length > 1 ? 's' : ''}
            </div>

            {/* Bouton "Charger plus" si des pages restent */}
            {hasMorePages && (
              <button
                type="button"
                onClick={loadMoreSignalements}
                disabled={isLoadingMore || isLoadingPage}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  fontSize: 'var(--font-size-body-small)',
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
                  'Charger plus d\'signalements'
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal d'signalement (Bootstrap modal) */}
      {selectedSignalementId && (
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
                      {isLoadingSignalement ? (
                        <ShimmerTitle line={1} gap={10} variant="primary" />
                      ) : (
                        selectedSignalement?.title || 'Chargement...'
                      )}
                    </h5>
                    <small className="text-muted mt-1">
                      {isLoadingSignalement ? (
                        <ShimmerText line={1} gap={10} />
                      ) : (
                        <>{selectedSignalement?.zone} • {translateEtat(selectedSignalement?.etat)}</>
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
                  {isLoadingSignalement || !selectedSignalement ? (
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
                      {selectedSignalement.photo && (
                        <BlurryImage
                          src={selectedSignalement.photo}
                          alt={selectedSignalement.title}
                          className="img-fluid rounded mb-3 w-100"
                          style={{ maxHeight: '300px', objectFit: 'cover' }}
                        />
                      )}

                      {/* Badges */}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className={`badge ${selectedSignalement.etat === 'resolved'
                          ? 'badge-status-resolved'
                          : selectedSignalement.etat === 'taken_into_account'
                            ? 'badge-status-taken_into_account'
                            : selectedSignalement.etat === 'pending'
                              ? 'badge-status-pending'
                              : 'badge-status-declared'
                          }`}>
                          STATUT : {
                            selectedSignalement.etat === 'resolved'
                              ? 'RÉSOLU'
                              : selectedSignalement.etat === 'taken_into_account'
                                ? 'PRIS EN COMPTE'
                                : selectedSignalement.etat === 'pending'
                                  ? 'EN ATTENTE'
                                  : 'DÉCLARÉ'
                          }
                        </span>
                        {selectedSignalement.zone && (
                          <span className="badge bg-info text-dark">
                            {selectedSignalement.zone}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {selectedSignalement.description && (
                        <p className="text-secondary mb-3">
                          {selectedSignalement.description}
                        </p>
                      )}

                      {/* Méta-données */}
                      <ul className="list-group list-group-flush mb-3">
                        <li className="list-group-item px-0">
                          <strong>Créé le :</strong>{' '}
                          {new Date(selectedSignalement.created_at).toLocaleDateString('fr-FR', {
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
                            const latVal = selectedSignalement.lattitude !== undefined ? selectedSignalement.lattitude : selectedSignalement.latitude;
                            const lat = parseFloat(latVal);
                            const lng = parseFloat(selectedSignalement.longitude);
                            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                              return "Non spécifiées (Mali par défaut)";
                            }
                            return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
                          })()}
                        </li>
                      </ul>

                      {/* Statut de l'signalement */}
                      <div className={`mb-4 status-stepper-${selectedSignalement?.etat || 'declared'}`}>
                        <h6 className="section-title mb-3">STATUT DE L'INCIDENT</h6>
                        <div className="signalement-modal-status-bar">
                          {INCIDENT_STATUS_STEPS.map((step, idx) => (
                            <div
                              key={step.id}
                              className={`signalement-modal-status-segment ${idx < statusIndex ? 'is-done' : ''
                                } ${idx === statusIndex ? 'is-current' : ''}`}
                            />
                          ))}
                        </div>
                        <div className="signalement-modal-status-steps">
                          {INCIDENT_STATUS_STEPS.map((step, idx) => (
                            <div
                              key={step.id}
                              className={`signalement-modal-status-step ${idx < statusIndex ? 'is-done' : ''
                                } ${idx === statusIndex ? 'is-current' : ''}`}
                            >
                              <span className="signalement-modal-status-dot" />
                              <span>{step.label.toUpperCase()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Audio */}
                      {selectedSignalement.audio && (
                        <div className="mb-4">
                          <h6 className="section-title mb-2">AUDIO</h6>
                          <audio controls className="w-100">
                            <source src={selectedSignalement.audio} type="audio/mpeg" />
                            Votre navigateur ne supporte pas l'élément audio.
                          </audio>
                        </div>
                      )}

                      {/* Vidéo */}
                      {selectedSignalement.video && (
                        <div className="mb-4">
                          <h6 className="section-title mb-2">VIDÉO DE PRÉSENTATION</h6>
                          <video
                            controls
                            className="w-100 rounded"
                            style={{ maxHeight: '400px' }}
                          >
                            <source src={selectedSignalement.video} type="video/mp4" />
                            Votre navigateur ne supporte pas la lecture de vidéos.
                          </video>
                        </div>
                      )}

                      {/* Organisations participantes */}
                      {selectedSignalement.participants?.length > 0 && (
                        <div className="mb-3">
                          <h6 className="section-title mb-3">ORGANISATIONS MOBILISÉES</h6>
                          <div className="d-flex flex-wrap gap-3 mb-3">
                            {selectedSignalement.participants.map((p, idx) => (
                              <div key={idx} className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                  style={{
                                    backgroundColor: p.color,
                                    width: '40px',
                                    height: '40px',
                                    fontSize: 'var(--font-size-body-small)'
                                  }}
                                >
                                  {p.initials}
                                </div>
                                <span>{p.name}</span>
                              </div>
                            ))}
                            {selectedSignalement.extraParticipants > 0 && (
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                  style={{
                                    backgroundColor: 'var(--color-text-muted)',
                                    width: '40px',
                                    height: '40px',
                                    fontSize: 'var(--font-size-body-small)'
                                  }}
                                >
                                  +{selectedSignalement.extraParticipants}
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
                {!isLoadingSignalement && selectedSignalement && (
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
                        navigate(`/signalements/${selectedSignalement.id}`, { state: { from: '/dashboard' } });
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
