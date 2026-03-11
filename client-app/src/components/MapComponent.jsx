import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { MapPin, Info, List } from 'lucide-react';

const containerStyle = {
  width: '100vw',
  height: '100vh'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

export default function MapView({ onAmbulanceSelect, ambulances, userLocation }) {
  const API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
  const isDemoMode = API_KEY === "YOUR_GOOGLE_MAPS_API_KEY";

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY
  });

  const [map, setMap] = useState(null);
  const [showList, setShowList] = useState(isDemoMode);

  const onLoad = useCallback(function callback(map) {
    if (userLocation) {
        map.setZoom(14);
    }
    setMap(map);
  }, [userLocation]);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // FALLBACK UI FOR DEMO
  if (loadError || !isLoaded || isDemoMode) {
    return (
        <div className="h-screen w-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 animate-in fade-in zoom-in duration-500">
                <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-lg shadow-blue-500/10">
                    <List className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Ambulance Dispatch</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
                    {isDemoMode ? "Map is in Demo Mode. Select an ambulance from the list below to proceed." : "Searching for nearby emergency units..."}
                </p>
                
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left ml-1">Available Units Nearby</p>
                    {ambulances.map(amb => (
                        <button 
                            key={amb.id}
                            onClick={() => onAmbulanceSelect(amb)}
                            className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-blue-500 border-2 border-transparent rounded-2xl transition-all text-left group active:scale-[0.98]"
                        >
                            <div>
                                <p className="font-bold text-slate-900 group-hover:text-blue-600">{amb.companyName}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full uppercase italic">{amb.eta} min</span>
                                    <span className="text-[10px] bg-slate-200 text-slate-600 font-black px-2 py-0.5 rounded-full uppercase">{amb.distance}km</span>
                                </div>
                            </div>
                            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <MapPin className="w-4 h-4" />
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3 text-[10px] text-slate-400 justify-center">
                    <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                        ))}
                    </div>
                    <span className="font-bold">12 units patrolling your sector</span>
                </div>
            </div>
            
            {isDemoMode && (
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/50 px-4 py-2 rounded-full border border-white/50">
                    <Info className="w-4 h-4" />
                    <span>Real-time map requires Google Maps API Key</span>
                </div>
            )}
        </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={userLocation || defaultCenter}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        disableDefaultUI: true,
        zoomControl: false,
      }}
    >
      {userLocation && (
        <>
            <Marker 
                position={userLocation} 
                icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                }} 
            />
            <Circle
                center={userLocation}
                radius={800}
                options={{
                    strokeColor: '#3b82f6',
                    strokeOpacity: 0.2,
                    strokeWeight: 1,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                }}
            />
        </>
      )}

      {ambulances.map((amb) => (
        <Marker 
            key={amb.id}
            position={{ lat: amb.lat, lng: amb.lng }}
            onClick={() => onAmbulanceSelect(amb)}
            icon={{
                url: 'https://cdn-icons-png.flaticon.com/512/1048/1048314.png',
                scaledSize: new window.google.maps.Size(40, 40)
            }}
        />
      ))}
    </GoogleMap>
  );
}


