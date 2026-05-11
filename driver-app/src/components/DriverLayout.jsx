// driver-app/src/components/DriverLayout.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket.js';
import { acceptBooking, denyBooking, timeoutBooking, getActiveBooking } from '../services/api.js';
import useTripStore from '../store/useTripStore.js';
import useDriverLocation from '../hooks/useDriverLocation.js';
import { Bell, X, Check, MapPin, User, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const TIMEOUT_SECONDS = 30;

const DriverLayout = ({ children }) => {
  const [currentRequest, setCurrentRequest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
  const navigate = useNavigate();
  const { location: driverLocation } = useDriverLocation();
  const currentRequestRef = useRef(null);

  useEffect(() => {
    currentRequestRef.current = currentRequest;
  }, [currentRequest]);

  // Socket Connection & Reconciliation
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const driverId = localStorage.getItem('driverDbId');
    const socket = socketService.connect(driverId);

    const reconcile = async () => {
      if (!driverId) return;
      try {
        const { data: activeTrip } = await getActiveBooking(driverId);
        if (activeTrip) {
          if (activeTrip.status === 'pending') {
            setCurrentRequest(activeTrip);
            setTimeLeft(TIMEOUT_SECONDS);
          } else {
            useTripStore.getState().setCurrentTrip(activeTrip);
          }
        }
      } catch (err) {
        console.error('Reconciliation failed:', err);
      }
    };

    reconcile();
    socket.on('connect', reconcile);

    const handleNewBooking = (data) => {
      if (!useTripStore.getState().currentTrip) {
        setCurrentRequest(data);
        setTimeLeft(TIMEOUT_SECONDS);
      }
    };

    const handleBookingUpdate = (data) => {
      if (data.status === 'cancelled') {
        if (currentRequestRef.current?.id === data.id) {
          setCurrentRequest(null);
        }
        if (useTripStore.getState().currentTrip?.id === data.id) {
          useTripStore.getState().setCurrentTrip(null);
          alert('Trip was cancelled by the patient/admin');
          navigate('/requests');
        }
      }
    };

    socket.on('new_booking', handleNewBooking);
    socket.on('booking_status_update', handleBookingUpdate);
    socket.on('booking_cancelled', handleBookingUpdate);

    return () => {
      socket.off('connect', reconcile);
      socket.off('new_booking', handleNewBooking);
      socket.off('booking_status_update', handleBookingUpdate);
      socket.off('booking_cancelled', handleBookingUpdate);
      // Keep the socket connection alive while the driver app is mounted
    };
  }, [navigate]);

  // Countdown
  useEffect(() => {
    if (!currentRequest) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [currentRequest, timeLeft]);

  const handleTimeout = async () => {
    const req = currentRequestRef.current;
    if (!req) return;
    try {
      await timeoutBooking(req.id);
    } finally {
      setCurrentRequest(null);
    }
  };

  const handleAccept = async () => {
    try {
      const { data: trip } = await acceptBooking(currentRequest.id);
      useTripStore.getState().setCurrentTrip(trip);
      socketService.joinBookingRoom(trip.id);
      setCurrentRequest(null);
      navigate('/trip');
    } catch (err) {
      console.error('Accept failed', err);
    }
  };

  const handleDeny = async () => {
    try {
      await denyBooking(currentRequest.id);
    } finally {
      setCurrentRequest(null);
    }
  };

  return (
    <div className="min-h-screen relative font-sans">
      {children}

      {/* Incoming Request Overlay */}
      {currentRequest && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8">
            <div className="bg-orange-600 p-6 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-bounce">
                <Bell className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black uppercase">New Emergency!</h2>
              <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold inline-block ${timeLeft <= 10 ? 'bg-red-500 animate-pulse' : 'bg-black/20'}`}>
                Expires in {timeLeft}s
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</p>
                  <p className="text-lg font-bold text-slate-900">{currentRequest.patient_name}</p>
                  <p className="text-sm text-slate-500 mt-1">{currentRequest.emergency_description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                  <p className="text-[10px] font-black text-orange-400 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Distance
                  </p>
                  <p className="text-md font-black text-orange-600">Nearby</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Est. Time
                  </p>
                  <p className="text-md font-black text-blue-600">5-10 min</p>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button onClick={handleDeny} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold">
                <X className="w-5 h-5 inline mr-1" /> Deny
              </button>
              <button onClick={handleAccept} className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-600/20 active:scale-95 transition-all">
                <Check className="w-6 h-6 inline mr-1" /> ACCEPT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverLayout;
