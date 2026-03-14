import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons not showing up in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const ambulanceIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048314.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

// Component to handle map re-centering when user location changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ onAmbulanceSelect, ambulances, userLocation }) {
  const center = userLocation || defaultCenter;

  return (
    <div className="w-full h-full z-0">
        <MapContainer 
            center={center} 
            zoom={14} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            <ChangeView center={center} zoom={14} />

            {userLocation && (
                <>
                    <Marker position={userLocation} icon={userIcon} />
                    <Circle 
                        center={userLocation} 
                        pathOptions={{ 
                            fillColor: '#3b82f6', 
                            fillOpacity: 0.1, 
                            color: '#3b82f6', 
                            weight: 1 
                        }} 
                        radius={800} 
                    />
                </>
            )}

            {ambulances.map((amb) => (
                <Marker 
                    key={amb.id}
                    position={{ lat: amb.lat, lng: amb.lng }}
                    icon={ambulanceIcon}
                    eventHandlers={{
                        click: () => onAmbulanceSelect(amb),
                    }}
                />
            ))}
        </MapContainer>
    </div>
  );
}


