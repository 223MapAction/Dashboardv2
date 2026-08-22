import 'mapbox-gl/dist/mapbox-gl.css';
import { Map, Marker, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import { Location } from 'iconsax-react';
import { MAPBOX_TOKEN } from '../../../../config/mapStyles';

/**
 * Mini-carte Mapbox de la fiche incident.
 * Separee de MapDetailViewMapLibre.jsx : voir MapContainer/MapViewMapbox.jsx
 * pour la raison (paquets react-map-gl/maplibre et /mapbox non-melangeables).
 */
export const MapDetailViewMapbox = ({ carteRef, longitude, latitude, mapStyle }) => (
  <Map
    ref={carteRef}
    reuseMaps
    mapboxAccessToken={MAPBOX_TOKEN}
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

export default MapDetailViewMapbox;
