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

// Component to handle map re-centering when user location changes
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ onAmbulanceSelect, ambulances, userLocation, locationLoading }) {
  // Don't render map until we have a real location
  if (locationLoading || !userLocation) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl shadow-lg">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700 text-lg">Getting Your Location</p>
            <p className="text-slate-400 text-sm mt-1">Please allow location access when prompted</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full z-0">
        <MapContainer 
            center={userLocation} 
            zoom={14} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            <ChangeView center={userLocation} zoom={14} />

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
