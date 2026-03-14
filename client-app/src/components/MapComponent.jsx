import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';

const containerStyle = {
  width: '100vw',
  height: '100vh'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

export default function MapView({ onAmbulanceSelect, ambulances, userLocation }) {
  // Using an empty/invalid key will trigger the Google Map development mode overlay,
  // honoring the request to show the "real" map component instead of our mock list.
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback(function callback(map) {
    if (userLocation) {
        map.setZoom(14);
    }
    setMap(map);
  }, [userLocation]);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  if (loadError) {
      return (
          <div className="h-screen w-screen bg-slate-100 flex items-center justify-center text-red-500 font-bold p-6 text-center">
              Map cannot be loaded at the moment. Please check your API key.
          </div>
      );
  }

  if (!isLoaded) {
      return (
          <div className="h-screen w-screen bg-slate-100 flex flex-col items-center justify-center text-slate-500 font-bold p-6 text-center">
             <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
             Loading Emergency Grid...
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


