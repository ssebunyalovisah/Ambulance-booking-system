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

const ambulanceIcon = new L.DivIcon({
    className: 'custom-ambulance-icon',
    html: `
        <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 bg-white rounded-full shadow-lg border-2 border-orange-500 animate-pulse-slow"></div>
            <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" class="w-6 h-6 z-10 relative" />
        </div>
    `,
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

export default function MapView({ onAmbulanceSelect, ambulances, userLocation, locationLoading, trackingMode = false }) {
  // Don't render map until we have a valid location object
  const isValidLocation = userLocation && 
                          typeof userLocation.lat === 'number' && 
                          typeof userLocation.lng === 'number';

  const mapKey = isValidLocation ? `${userLocation.lat}-${userLocation.lng}` : 'no-location';

  if (locationLoading || !isValidLocation) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4 p-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/40">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-50/50" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-black text-slate-800 text-xl tracking-tight">Locating You...</p>
            <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-widest">Ensuring rapid response accuracy</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full z-0 relative">
        <MapContainer 
            key={mapKey}
            center={userLocation} 
            zoom={trackingMode ? 16 : 14} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number' && (
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

            {ambulances
                .filter(amb => amb && typeof amb.lat === 'number' && typeof amb.lng === 'number')
                .map((amb) => (
                    <Marker 
                        key={amb.ambulance_id || amb.id}
                        position={{ lat: amb.lat, lng: amb.lng }}
                        icon={ambulanceIcon}
                        eventHandlers={{
                            click: () => onAmbulanceSelect && onAmbulanceSelect(amb),
                        }}
                    />
                ))}
        </MapContainer>
    </div>
  );
}
