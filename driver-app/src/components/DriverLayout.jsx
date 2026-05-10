import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import socketService from '../services/socket.js';
import { acceptBooking, denyBooking, timeoutBooking, getActiveBooking } from '../services/api.js';
import useTripStore from '../store/useTripStore.js';
import useDriverLocation from '../hooks/useDriverLocation.js';
import { Bell, X, Check, MapPin, User, Clock, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon paths (broken by bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Haversine distance in km
function haversineKm(a, b) {
    if (!a || !b) return null;
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const TIMEOUT_SECONDS = 30;

const DriverLayout = ({ children }) => {
    const [currentRequest, setCurrentRequest] = useState(null);
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);

    const navigate   = useNavigate();
    const location   = useLocation();
    const { location: driverLocation } = useDriverLocation();

    // Keep a ref to currentRequest so socket callbacks always see the latest value
    // without being in the dependency array (avoids listener churn on every modal open/close)
    const currentRequestRef = useRef(null);
    useEffect(() => { currentRequestRef.current = currentRequest; }, [currentRequest]);

    // ── Auth guard (lightweight — only redirects if token is missing) ───────────
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token && location.pathname !== '/') {
            navigate('/');
        }
    }, [location.pathname, navigate]);

    // ── PERMANENT Socket setup — runs ONCE on mount, NEVER re-runs on navigation ─
    // This is the critical implementation: the new_booking listener lives here,
    // NOT inside any page component. It survives all route changes.
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return; // Not logged in yet — listener will be registered after login via reconnect

        const companyId  = localStorage.getItem('companyId');
        const driverDbId = localStorage.getItem('driverDbId');

        const socket = socketService.connect();

        // ── Reconcile state with server (v3 spec) ───────────────────────────────
        const reconcileState = async () => {
            let currentCompanyId = localStorage.getItem('companyId');
            let currentDriverDbId = localStorage.getItem('driverDbId');

            // Fallback for older sessions that didn't store driverDbId
            if (!currentDriverDbId && token) {
                try {
                    const meRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (meRes.ok) {
                        const meData = await meRes.json();
                        currentDriverDbId = meData.id;
                        currentCompanyId = meData.company_id;
                        localStorage.setItem('driverDbId', currentDriverDbId);
                        localStorage.setItem('companyId', currentCompanyId);
                    }
                } catch (e) {
                    console.error('Failed to restore session state', e);
                }
            }

            if (currentCompanyId)  socketService.joinDashboard(currentCompanyId);
            if (currentDriverDbId) socketService.joinDriverRoom(currentDriverDbId);

            if (!currentDriverDbId) return;
            try {
                const activeBooking = await getActiveBooking(currentDriverDbId);
                const storedTrip = useTripStore.getState().currentTrip;

                if (activeBooking) {
                    if (activeBooking.status === 'pending') {
                        // The booking is still pending, so show the incoming request overlay
                        setCurrentRequest(activeBooking);
                        
                        // Calculate time left based on created_at, or default to 30
                        const createdTime = new Date(activeBooking.created_at).getTime();
                        const now = new Date().getTime();
                        const elapsed = Math.floor((now - createdTime) / 1000);
                        const remaining = Math.max(0, TIMEOUT_SECONDS - elapsed);
                        
                        if (remaining > 0) {
                            setTimeLeft(remaining);
                        } else {
                            // If it's already expired according to our local calculation, we could
                            // either wait for the server to time it out, or time it out locally.
                            // Let's just give them 10 seconds grace period if they just logged in.
                            setTimeLeft(10); 
                        }
                        console.log('[DriverLayout] Pending request restored from server:', activeBooking.id);
                    } else {
                        // It's an active trip (accepted/dispatched/arrived)
                        useTripStore.getState().setCurrentTrip(activeBooking);
                        console.log('[DriverLayout] Active trip restored from server:', activeBooking.id);
                    }

                } else if (storedTrip) {
                    useTripStore.getState().setCurrentTrip(null);
                    console.log('[DriverLayout] Stale trip cleared — server has no active booking.');
                }
            } catch (e) {
                console.error('[DriverLayout] Reconcile failed:', e);
            }
        };

        // Immediate reconciliation on first load
        reconcileState();

        // Re-run reconciliation every time the socket reconnects
        socket.on('connect', reconcileState);

        // ── Global new_booking listener — ALWAYS ON regardless of current page ──
        const handleNewBooking = (data) => {
            console.log('[DriverLayout] new_booking received on any page:', data.id);
            const activeTrip = useTripStore.getState().currentTrip;
            if (!activeTrip) {
                setCurrentRequest(data);
                setTimeLeft(TIMEOUT_SECONDS);
            }
        };

        // ── booking_status_update — handles cancellations from any surface ───────
        const handleBookingSync = (data) => {
            if (data.status === 'cancelled') {
                // Dismiss the incoming request modal if it's for this booking
                if (currentRequestRef.current?.id === data.id) {
                    setCurrentRequest(null);
                }
                // Clear active trip state
                const activeTrip = useTripStore.getState().currentTrip;
                if (activeTrip?.id === data.id) {
                    useTripStore.getState().setCurrentTrip(null);
                    alert(`Booking #${data.id} was cancelled by the ${data.cancelled_by || 'patient'}.`);
                    navigate('/requests');
                }
            }
        };

        // ── booking_cancelled — explicit cancellation event with full context ────
        const handleBookingCancelled = (data) => {
            // Dismiss incoming request modal
            if (currentRequestRef.current?.id === data.id) {
                setCurrentRequest(null);
            }
            // Clear active trip
            const activeTrip = useTripStore.getState().currentTrip;
            if (activeTrip?.id === data.id) {
                useTripStore.getState().setCurrentTrip(null);
                const who = data.cancelled_by === 'client' ? 'Patient'
                           : data.cancelled_by === 'admin'  ? 'Admin'
                           : 'Operator';
                alert(`⚠️ ${who} cancelled this trip.${data.cancel_reason ? '\nReason: ' + data.cancel_reason : ''}`);
                navigate('/requests');
            }
        };

        // Register all permanent listeners
        socket.on('new_booking',          handleNewBooking);
        socket.on('booking_status_update', handleBookingSync);
        socket.on('booking_cancelled',    handleBookingCancelled);

        // Cleanup only runs when the component fully unmounts (app exit / logout)
        return () => {
            socket.off('connect',              reconcileState);
            socket.off('new_booking',          handleNewBooking);
            socket.off('booking_status_update', handleBookingSync);
            socket.off('booking_cancelled',    handleBookingCancelled);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ← EMPTY DEPS: runs once, never re-registers listeners during navigation

    // ── Countdown timer ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!currentRequest) return;
        if (timeLeft <= 0) { handleTimeout(); return; }
        const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [currentRequest, timeLeft]);

    // ── Computed distance & ETA ────────────────────────────────────────────────
    const distanceKm = currentRequest
        ? haversineKm(driverLocation, {
              lat: parseFloat(currentRequest.patient_lat),
              lng: parseFloat(currentRequest.patient_lng),
          })
        : null;

    const distanceLabel = distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '…';
    const etaMinutes    = distanceKm !== null ? Math.ceil((distanceKm / 30) * 60) : null;
    const etaLabel      = etaMinutes !== null ? `${etaMinutes} min` : '…';

    const patientPos =
        currentRequest &&
        !isNaN(parseFloat(currentRequest.patient_lat)) &&
        !isNaN(parseFloat(currentRequest.patient_lng))
            ? [parseFloat(currentRequest.patient_lat), parseFloat(currentRequest.patient_lng)]
            : null;

    // ── Actions ────────────────────────────────────────────────────────────────
    const handleAccept = async () => {
        try {
            await acceptBooking(currentRequest.id);
            socketService.emitAcceptBooking(currentRequest.id);
            useTripStore.getState().setCurrentTrip(currentRequest);
            setCurrentRequest(null);
            navigate('/trip');
        } catch (error) {
            console.error('Accept failed', error);
        }
    };

    const handleDeny = async () => {
        try {
            await denyBooking(currentRequest.id);
            socketService.emitDenyBooking(currentRequest.id);
            setCurrentRequest(null);
        } catch (error) {
            console.error('Deny failed', error);
        }
    };

    const handleTimeout = useCallback(async () => {
        const req = currentRequestRef.current;
        if (!req) return;
        try {
            await timeoutBooking(req.id);
            socketService.socket?.emit('booking_timed_out', { bookingId: req.id });
        } catch (error) {
            console.error('Timeout update failed', error);
        } finally {
            setCurrentRequest(null);
        }
    }, []);

    return (
        <div className="min-h-screen relative">
            {/* Page content — routes render here */}
            {children}

            {/* ── Global Incoming Request Overlay (SafeBoda-style) ────────────────
                This overlay is rendered HERE in the layout, not inside any page.
                It shows on top of ALL pages regardless of which route is active.
                z-[100] ensures it floats above everything including maps.         */}
            {currentRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">

                        {/* Header */}
                        <div className="bg-orange-600 p-6 flex flex-col items-center text-white">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3 animate-bounce">
                                <Bell className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">New Emergency!</h2>
                            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${timeLeft <= 10 ? 'bg-red-900/60 animate-pulse' : 'bg-black/20'}`}>
                                Expires in {timeLeft}s
                            </div>
                        </div>

                        {/* Leaflet map preview of patient location */}
                        {patientPos ? (
                            <div className="h-36 w-full relative z-0 border-b border-slate-100">
                                <MapContainer
                                    center={patientPos}
                                    zoom={15}
                                    className="h-full w-full"
                                    zoomControl={false}
                                    dragging={false}
                                    touchZoom={false}
                                    doubleClickZoom={false}
                                    scrollWheelZoom={false}
                                    attributionControl={false}
                                >
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <Marker position={patientPos}>
                                        <Popup>Patient Location</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        ) : (
                            <div className="h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-sm border-b border-slate-200">
                                <MapPin className="w-4 h-4 mr-2" /> Location not available
                            </div>
                        )}

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</p>
                                    <p className="text-lg font-bold text-slate-900">{currentRequest.patient_name}</p>
                                    <p className="text-sm text-slate-500 font-medium leading-tight mt-1">
                                        {currentRequest.emergency_description || 'Immediate assistance required'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Distance
                                    </p>
                                    <p className="text-md font-black text-orange-600">{distanceLabel}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Est. Time
                                    </p>
                                    <p className="text-md font-black text-blue-600">{etaLabel}</p>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
                                        <Activity className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-600">
                                        Company: <span className="text-slate-900">{currentRequest.company_name || 'Ambulance Service'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={handleDeny}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-5 h-5" /> Deny
                            </button>
                            <button
                                onClick={handleAccept}
                                className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-600/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check className="w-6 h-6" /> ACCEPT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverLayout;
