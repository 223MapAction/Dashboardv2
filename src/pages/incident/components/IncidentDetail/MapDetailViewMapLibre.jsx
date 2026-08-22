import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, Marker, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre';
import { Location } from 'iconsax-react';

/**
 * Mini-carte MapLibre de la fiche incident.
 * Separee de MapDetailViewMapbox.jsx : voir MapContainer/MapViewMapLibre.jsx
 * pour la raison (paquets react-map-gl/maplibre et /mapbox non-melangeables).
 */
export const MapDetailViewMapLibre = ({ carteRef, longitude, latitude, mapStyle }) => (
  <Map
    ref={carteRef}
    reuseMaps
    initialViewState={{ longitude, latitude, zoom: 14 }}
    style={{ width: '100%', height: '100%' }}
    mapStyle={mapStyle}
  >
    <Marker longitude={longitude} latitude={latitude} anchor="bottom">
      <div className="project-map-marker">
        <Location size={24} variant="Bold" color="var(--color-danger)" />
      </div>
    </Marker>
    <NavigationControl position="top-right" />
    <FullscreenControl position="top-left" />
  </Map>
);

export default MapDetailViewMapLibre;
