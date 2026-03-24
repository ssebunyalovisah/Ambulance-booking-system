import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const ambulanceIconAvailable = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048314.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
    className: 'filter-green' // We can use CSS to tint if needed, or different icons
});

const ambulanceIconBusy = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048314.png',
    iconSize: [35, 35],
    iconAnchor: [17, 17],
    className: 'filter-red'
});

const requestIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const defaultCenter = [0.3476, 32.5825];

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function AdminMap({ ambulances, activeRequests }) {
  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <ChangeView center={defaultCenter} />

        {/* Ambulances */}
        {ambulances?.filter(a => a.lat && a.lng).map(amb => (
            <Marker 
                key={amb.id}
                position={[amb.lat, amb.lng]}
                icon={amb.status === 'AVAILABLE' ? ambulanceIconAvailable : ambulanceIconBusy}
            >
                <Popup>
                    <div className="p-1">
                        <p className="font-bold text-slate-800">{amb.ambulance_number}</p>
                        <p className="text-xs text-slate-500">Driver: {amb.driver_name}</p>
                        <p className={`text-xs font-bold mt-1 ${amb.status === 'AVAILABLE' ? 'text-green-600' : 'text-red-600'}`}>
                            {amb.status}
                        </p>
                    </div>
                </Popup>
            </Marker>
        ))}

        {/* Active Requests */}
        {activeRequests?.filter(r => r.lat && r.lng).map(req => (
            <Marker 
                key={req.id}
                position={[req.lat, req.lng]}
                icon={requestIcon}
            >
                <Popup>
                    <div className="p-1">
                        <p className="font-bold text-red-600">EMERGENCY REQUEST</p>
                        <p className="text-xs text-slate-600">Patient: {req.patient_name || 'Anonymous'}</p>
                        <p className="text-xs text-slate-500 mt-1">{req.emergency_description}</p>
                    </div>
                </Popup>
            </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg z-[1000] text-xs font-bold space-y-2">
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm"></div>
              <span className="text-slate-600">Available Unit</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm"></div>
              <span className="text-slate-600">Busy Unit</span>
          </div>
          <div className="flex items-center gap-2">
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" className="w-3" alt="" />
              <span className="text-slate-600">Emergency Request</span>
          </div>
      </div>
    </div>
  );
}
