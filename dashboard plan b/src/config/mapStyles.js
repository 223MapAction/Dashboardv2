// Styles de carte MapLibre. Le style par defaut est base sur des tuiles
// OpenStreetMap ouvertes et auto-hebergeables (configurable via
// VITE_OSM_TILE_URLS) : aucun compte ni token n'est necessaire pour que la
// carte fonctionne.

const DEFAULT_OSM_TILE_URLS = [
  'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  'https://c.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
];

const OSM_TILE_URLS = import.meta.env.VITE_OSM_TILE_URLS
  ? import.meta.env.VITE_OSM_TILE_URLS.split(',').map((url) => url.trim())
  : DEFAULT_OSM_TILE_URLS;

export const OSM_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: OSM_TILE_URLS,
      tileSize: 256,
      attribution:
        '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f0f0f0' },
    },
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Mapbox n'est plus une dependance obligatoire : ce style satellite ne
// s'active que si un token est fourni, et n'utilise que l'API de tuiles
// raster de Mapbox (pas le SDK mapbox-gl).
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const MAPBOX_SATELLITE_STYLE = MAPBOX_TOKEN
  ? {
      version: 8,
      sources: {
        'mapbox-satellite': {
          type: 'raster',
          tiles: [
            `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png90?access_token=${MAPBOX_TOKEN}`,
          ],
          tileSize: 256,
          attribution: '© Mapbox © Maxar',
        },
      },
      layers: [
        {
          id: 'mapbox-satellite-layer',
          type: 'raster',
          source: 'mapbox-satellite',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    }
  : null;

export const HAS_MAPBOX_SATELLITE = Boolean(MAPBOX_TOKEN);
