import { HAS_MAPBOX_TOKEN } from './mapStyles';

/**
 * ============================================================================
 * MAP ENGINE
 * ============================================================================
 *
 * Un jeton Mapbox (VITE_MAPBOX_TOKEN) present active le moteur Mapbox.
 * Absent : MapLibre/OpenStreetMap, aucun compte tiers requis.
 *
 * Seul signal utilise dans toute l'application : IS_MAPBOX.
 *
 * MapLibre et Mapbox sont deux paquets react-map-gl distincts
 * (react-map-gl/maplibre, react-map-gl/mapbox) avec chacun leurs propres
 * composants Map, Marker, Popup : on ne les melange jamais dans un meme
 * composant. Voir MapViewMapLibre.jsx et MapViewMapbox.jsx.
 * ============================================================================
 */

export const IS_MAPBOX = HAS_MAPBOX_TOKEN;
