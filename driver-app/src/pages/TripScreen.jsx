import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import socketService from '../services/socket.js';
import { completeTrip, updateDriverLocation } from '../services/api.js';
import useTripStore from '../store/useTripStore.js';
import useLocationStore from '../store/useLocationStore.js';
import useDriverLocation from '../hooks/useDriverLocation.js';
import 'leaflet/dist/leaflet.css';

const TripScreen = () => {
    const navigate = useNavigate();
    const currentTrip = useTripStore((state) => state.currentTrip);
    const { patientLocation } = useLocationStore();
    const { location: currentLocation } = useDriverLocation();
    const [status, setStatus] = useState(currentTrip?.status || 'accepted');

    useEffect(() => {
        if (currentLocation && currentTrip) {
            // Update both server and socket
            updateDriverLocation(currentLocation);
            socketService.emitDriverLocation({
                bookingId: currentTrip.id,
                companyId: currentTrip.company_id,
                ambulanceId: currentTrip.ambulance_id,
                driverId: currentTrip.driver_id,
                lat: currentLocation.lat,
                lng: currentLocation.lng
            });
        }
    }, [currentLocation, currentTrip]);

    const handleArrived = async () => {
        try {
            await socketService.emitDriverLocation({ ...currentLocation, bookingId: currentTrip.id }); // One last precise update
            // We should have an updateBookingStatus in api.js
            const { updateBookingStatus } = await import('../services/api.js');
            await updateBookingStatus(currentTrip.id, 'ARRIVED');
            setStatus('arrived');
            socketService.socket.emit('driver_arrived', { bookingId: currentTrip.id });
        } catch (error) {
            console.error('Arrived update failed', error);
        }
    };

    const handleComplete = async () => {
        try {
            await completeTrip(currentTrip.id);
            socketService.emitTripCompleted(currentTrip.id);
            navigate('/history');
        } catch (error) {
            console.error('Complete failed', error);
        }
    };

    if (!currentTrip) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <div className="text-4xl mb-4">🛑</div>
                    <p className="font-bold">No active trip found</p>
                    <button onClick={() => navigate('/request')} className="mt-4 text-orange-500 font-bold text-sm uppercase">Back to Requests</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Map Area */}
            <div className="h-[50vh] relative">
                <MapContainer 
                    center={[currentLocation?.lat || 0.3476, currentLocation?.lng || 32.5825]} 
                    zoom={15} 
                    className="h-full w-full z-0"
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    {currentLocation && (
                        <Marker position={[currentLocation.lat, currentLocation.lng]}>
                            <Popup>You are here</Popup>
                        </Marker>
                    )}
                    {patientLocation && (
                        <Marker position={[patientLocation.lat, patientLocation.lng]}>
                            <Popup>Patient Location</Popup>
                        </Marker>
                    )}
                </MapContainer>
                
                <div className="absolute top-6 left-6 right-6 z-10">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                        <p className="font-bold text-slate-900 line-clamp-1">{currentTrip.pickup_address || 'Emergency Location'}</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-t-[40px] -mt-10 relative z-20 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)] p-8">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
                
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{currentTrip.patient_name}</h2>
                        <p className="text-sm font-bold text-slate-400">Emergency Call • {new Date(currentTrip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <a href={`tel:${currentTrip.phone_number}`} className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 active:scale-90 transition-transform">
                        <span className="text-white text-2xl font-bold">📞</span>
                    </a>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Emergency Details</p>
                    <p className="text-slate-700 font-medium leading-relaxed">{currentTrip.emergency_description}</p>
                </div>

                <div className="space-y-4">
                    {status === 'accepted' ? (
                        <button 
                            onClick={handleArrived}
                            className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-200 transition-all active:scale-95"
                        >
                            MARK AS ARRIVED
                        </button>
                    ) : (
                        <button 
                            onClick={handleComplete}
                            className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-200 transition-all active:scale-95"
                        >
                            COMPLETE TRIP
                        </button>
                    )}
                    
                    <button className="w-full py-4 text-slate-400 font-bold text-sm uppercase tracking-widest hover:text-red-500 transition-colors">
                        Cancel Trip
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripScreen;