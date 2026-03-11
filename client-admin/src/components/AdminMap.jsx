import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

export default function AdminMap({ ambulances, activeRequests }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY"
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  if (!isLoaded) return <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />;

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{ streetViewControl: false, mapTypeControl: false }}
      >
        {ambulances?.map(amb => (
            <Marker 
                key={amb.id}
                position={{ lat: amb.lat, lng: amb.lng }}
                icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: amb.status === 'AVAILABLE' ? '#22c55e' : '#ef4444',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                }}
                label={{ text: amb.plateNumber, color: '#334155', fontSize: '12px', fontWeight: 'bold', className: 'mt-8 bg-white px-1 rounded shadow' }}
            />
        ))}

        {activeRequests?.map(req => (
            <Marker 
                key={req.id}
                position={{ lat: req.lat, lng: req.lng }}
                icon={{
                    url: 'https://cdn-icons-png.flaticon.com/512/1048/1048314.png',
                    scaledSize: new window.google.maps.Size(30, 30)
                }}
            />
        ))}
      </GoogleMap>
    </div>
  );
}
