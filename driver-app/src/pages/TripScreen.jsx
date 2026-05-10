import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import socketService from '../services/socket.js';
import { completeTrip, updateDriverLocation, updateBookingStatus, cancelTrip } from '../services/api.js';
import useTripStore from '../store/useTripStore.js';
import useLocationStore from '../store/useLocationStore.js';
import useDriverLocation from '../hooks/useDriverLocation.js';
import { Phone, AlertTriangle, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon paths (broken by bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TripScreen = () => {
    const navigate = useNavigate();
    const currentTrip = useTripStore((state) => state.currentTrip);
    const { patientLocation } = useLocationStore();
    const { location: currentLocation } = useDriverLocation();
    const [status, setStatus] = useState(currentTrip?.status || 'accepted');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    // Guard — redirect if no active trip or no token
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/'); return; }
        if (!currentTrip) { navigate('/requests'); return; }
    }, [currentTrip, navigate]);

    // Emit driver GPS every 5 seconds (spec requirement)
    useEffect(() => {
        if (!currentLocation || !currentTrip) return;

        const send = () => {
            updateDriverLocation(currentLocation).catch(() => {});
            socketService.emitDriverLocation({
                bookingId:   currentTrip.id,
                companyId:   currentTrip.company_id,
                ambulanceId: currentTrip.ambulance_id,
                driverId:    currentTrip.driver_id,
                lat:         currentLocation.lat,
                lng:         currentLocation.lng,
            });
        };

        send(); // immediate send on location change
        const interval = setInterval(send, 5000);
        return () => clearInterval(interval);
    }, [currentLocation, currentTrip]);

    // Listen for patient location updates
    useEffect(() => {
        if (!currentTrip) return;
        socketService.onPatientLocation((data) => {
            if (data.bookingId === currentTrip.id) {
                useLocationStore.getState().setPatientLocation({ lat: data.lat, lng: data.lng });
            }
        });
    }, [currentTrip]);

    const handleArrived = async () => {
        try {
            await updateBookingStatus(currentTrip.id, 'ARRIVE');
            setStatus('arrived');
            socketService.socket?.emit('driver_arrived', { bookingId: currentTrip.id });
        } catch (error) {
            console.error('Arrived update failed', error);
        }
    };

    const handleComplete = async () => {
        try {
            await completeTrip(currentTrip.id);
            socketService.emitTripCompleted(currentTrip.id);
            useTripStore.getState().setCurrentTrip(null);
            navigate('/requests');
        } catch (error) {
            console.error('Complete failed', error);
        }
    };

    const handleCancelConfirm = async () => {
        if (!cancelReason.trim()) return;
        setCancelling(true);
        try {
            // v3 spec: always send cancelled_by + cancel_reason so admin sees context
            await cancelTrip(currentTrip.id, cancelReason);
            useTripStore.getState().setCurrentTrip(null);
            navigate('/requests');
        } catch (error) {
            console.error('Cancel failed', error);
        } finally {
            setCancelling(false);
            setShowCancelModal(false);
        }
    };

    if (!currentTrip) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <div className="text-4xl mb-4">🛑</div>
                    <p className="font-bold">No active trip found</p>
                    <button onClick={() => navigate('/requests')} className="mt-4 text-orange-500 font-bold text-sm uppercase">
                        Back to Requests
                    </button>
                </div>
            </div>
        );
    }

    const mapCenter = currentLocation
        ? [currentLocation.lat, currentLocation.lng]
        : [0.3476, 32.5825];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* Map Area */}
            <div className="h-[50vh] relative">
                <MapContainer
                    center={mapCenter}
                    zoom={15}
                    className="h-full w-full z-0"
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                    {currentLocation && (
                        <Marker position={[currentLocation.lat, currentLocation.lng]}>
                            <Popup>🚑 You are here</Popup>
                        </Marker>
                    )}
                    {patientLocation && (
                        <Marker position={[patientLocation.lat, patientLocation.lng]}>
                            <Popup>🏥 Patient Location</Popup>
                        </Marker>
                    )}
                </MapContainer>

                <div className="absolute top-6 left-6 right-6 z-10">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                        <p className="font-bold text-slate-900 line-clamp-1">
                            {currentTrip.pickup_address || 'Emergency Location'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Sheet */}
            <div className="flex-1 bg-white rounded-t-[40px] -mt-10 relative z-20 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)] p-8">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

                {/* Dispatch info — spec: always show real company + driver name + ID + call */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">
                            🚑 {currentTrip.company_name || 'Emergency Unit'}
                        </p>
                        <h2 className="text-2xl font-black text-slate-900">{currentTrip.patient_name}</h2>
                        <p className="text-sm font-bold text-slate-400 mt-0.5">
                            Driver: {currentTrip.driver_name || '—'} &nbsp;|&nbsp; ID: {currentTrip.driver_uid || '—'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Unit: {currentTrip.ambulance_number || '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                            {new Date(currentTrip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {/* Call patient button */}
                    <a
                        href={`tel:${currentTrip.phone}`}
                        className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 active:scale-90 transition-transform"
                    >
                        <Phone className="w-6 h-6 text-white" />
                    </a>
                </div>

                {/* Emergency description */}
                <div className="bg-slate-50 p-6 rounded-3xl mb-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Emergency Details</p>
                    <p className="text-slate-700 font-medium leading-relaxed">{currentTrip.emergency_description}</p>
                </div>

                {/* Action buttons */}
                <div className="space-y-4">
                    {['accepted', 'dispatched'].includes(status) ? (
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

                    <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full py-4 text-slate-400 font-bold text-sm uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" /> Cancel Trip
                    </button>
                </div>
            </div>

            {/* Cancel reason modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-900">Cancel Trip</h3>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-500 mb-4">Please provide a reason so the admin can follow up:</p>

                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="e.g. Vehicle breakdown, medical emergency at base…"
                            rows={3}
                            className="w-full p-4 border-2 border-slate-100 rounded-2xl text-sm text-slate-800 resize-none outline-none focus:border-orange-400 transition"
                        />

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition"
                            >
                                Keep Trip
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                disabled={!cancelReason.trim() || cancelling}
                                className="flex-1 py-4 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-2xl font-black transition active:scale-95"
                            >
                                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripScreen;
