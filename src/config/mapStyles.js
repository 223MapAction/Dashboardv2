/**
 * ============================================================================
 * MAP STYLES
 * ============================================================================
 *
 * Ce fichier contient les styles utilisés par MapContainer.
 *
 * Styles disponibles :
 *
 *   OSM_STYLE
 *   MAPBOX_SATELLITE_STYLE
 *
 * Variables exportées :
 *
 *   MAPBOX_TOKEN
 *   HAS_MAPBOX_TOKEN
 *
 * ============================================================================
 */


/* ============================================================================
 * TOKEN MAPBOX
 * ========================================================================== */

export const MAPBOX_TOKEN = String(
  import.meta.env.VITE_MAPBOX_TOKEN || ''
).trim();

export const HAS_MAPBOX_TOKEN =
  MAPBOX_TOKEN.length > 0;


/* ============================================================================
 * TUILES OSM
 * ============================================================================
 *
 * Humanitarian OpenStreetMap Team.
 *
 * Ces tuiles sont accessibles sans token Mapbox.
 *
 * Tu peux également les remplacer via :
 *
 * VITE_OSM_TILE_URLS
 *
 * Exemple :
 *
 * VITE_OSM_TILE_URLS=https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png,...
 *
 * ============================================================================
 */

const DEFAULT_OSM_TILE_URLS = [
  'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
];


/**
 * Récupération des URLs personnalisées.
 */
const customOsmTileUrls = String(
  import.meta.env.VITE_OSM_TILE_URLS || ''
)
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);


/**
 * URLs finales.
 */
const OSM_TILE_URLS =
  customOsmTileUrls.length > 0
    ? customOsmTileUrls
    : DEFAULT_OSM_TILE_URLS;


/* ============================================================================
 * STYLE OSM
 * ============================================================================
 *
 * Compatible :
 *
 *   - MapLibre
 *   - Mapbox
 *
 * Aucun token Mapbox n'est nécessaire.
 *
 * ============================================================================
 */

export const OSM_STYLE = {
  version: 8,

  name: 'OpenStreetMap Humanitarian',

  sources: {
    'osm-tiles': {
      type: 'raster',

      tiles: OSM_TILE_URLS,

      tileSize: 256,

      attribution:
        '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',

      maxzoom: 19,
    },
  },

  layers: [
    {
      id: 'osm-background',

      type: 'background',

      paint: {
        'background-color':
          '#f0f0f0',
      },
    },

    {
      id: 'osm-tiles-layer',

      type: 'raster',

      source: 'osm-tiles',

      minzoom: 0,

      maxzoom: 19,

      paint: {
        'raster-opacity': 1,
        'raster-fade-duration': 0,
      },
    },
  ],
};


/* ============================================================================
 * STYLE SATELLITE MAPBOX
 * ============================================================================
 *
 * IMPORTANT :
 *
 * On n'utilise PAS :
 *
 *   mapbox://styles/mapbox/...
 *
 * ici.
 *
 * Pourquoi ?
 *
 * Parce que MapContainer peut fonctionner avec MapLibre.
 * Une URL "mapbox://" ne peut pas être utilisée comme une source raster
 * indépendante par MapLibre.
 *
 * On utilise donc directement les tuiles satellite Mapbox.
 *
 * ============================================================================
 */

export const MAPBOX_SATELLITE_STYLE =
  HAS_MAPBOX_TOKEN
    ? {
        version: 8,

        name: 'Mapbox Satellite',

        sources: {
          'mapbox-satellite': {
            type: 'raster',

            tiles: [
              `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png90?access_token=${MAPBOX_TOKEN}`,
            ],

            tileSize: 256,

            attribution:
              '© Mapbox © Maxar',

            maxzoom: 19,
          },
        },

        layers: [
          {
            id: 'mapbox-satellite-background',

            type: 'background',

            paint: {
              'background-color':
                '#101010',
            },
          },

          {
            id: 'mapbox-satellite-layer',

            type: 'raster',

            source:
              'mapbox-satellite',

            minzoom: 0,

            maxzoom: 19,

            paint: {
              'raster-opacity': 1,

              'raster-fade-duration': 0,
            },
          },
        ],
      }
    : null;


/* ============================================================================
 * EXPORTS UTILITAIRES
 * ========================================================================== */

/**
 * Vérifie si le style satellite est disponible.
 */
export const HAS_SATELLITE_STYLE =
  Boolean(
    MAPBOX_SATELLITE_STYLE
  );


/**
 * Styles disponibles.
 *
 * Cette constante n'est pas obligatoire dans MapContainer,
 * mais elle peut être utile ailleurs dans l'application.
 */
export const MAP_STYLES = {
  humanitarian: {
    id: 'humanitarian',

    label: 'Carte',

    style: OSM_STYLE,
  },

  ...(HAS_SATELLITE_STYLE
    ? {
        satellite: {
          id: 'satellite',

          label: 'Satellite',

          style:
            MAPBOX_SATELLITE_STYLE,
        },
      }
    : {}),
};