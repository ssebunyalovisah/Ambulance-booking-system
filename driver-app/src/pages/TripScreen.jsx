// driver-app/src/pages/TripScreen.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import socketService from '../services/socket.js';
import { dispatchBooking, arriveBooking, completeTrip, cancelTrip, updateLocation } from '../services/api.js';
import useTripStore from '../store/useTripStore.js';
import useDriverLocation from '../hooks/useDriverLocation.js';
import { Phone, AlertTriangle, X, CheckCircle, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const TripScreen = () => {
  const navigate = useNavigate();
  const currentTrip = useTripStore((state) => state.currentTrip);
  const { location: currentLocation } = useDriverLocation();
  const [status, setStatus] = useState(currentTrip?.status || 'accepted');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!currentTrip) {
      navigate('/requests');
    } else {
      setStatus(currentTrip.status);
    }
  }, [currentTrip, navigate]);

  // Periodic Location Updates
  useEffect(() => {
    if (!currentLocation || !currentTrip) return;

    const interval = setInterval(() => {
      updateLocation({
        booking_id: currentTrip.id,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentLocation, currentTrip]);

  const handleDispatch = async () => {
    try {
      const { data } = await dispatchBooking(currentTrip.id);
      setStatus('dispatched');
      useTripStore.getState().setCurrentTrip(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleArrive = async () => {
    try {
      const { data } = await arriveBooking(currentTrip.id);
      setStatus('arrived');
      useTripStore.getState().setCurrentTrip(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async () => {
    try {
      await completeTrip(currentTrip.id);
      useTripStore.getState().setCurrentTrip(null);
      navigate('/requests');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) return;
    try {
      await cancelTrip(currentTrip.id, cancelReason);
      useTripStore.getState().setCurrentTrip(null);
      navigate('/requests');
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentTrip) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="h-[40vh] relative z-0">
        <MapContainer center={[currentTrip.patient_lat, currentTrip.patient_lng]} zoom={15} className="h-full w-full">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <Marker position={[currentTrip.patient_lat, currentTrip.patient_lng]}>
            <Popup>Patient Location</Popup>
          </Marker>
          {currentLocation && (
            <Marker position={[currentLocation.lat, currentLocation.lng]}>
              <Popup>You</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="flex-1 bg-white rounded-t-[40px] -mt-10 relative z-10 shadow-2xl p-8">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />

        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Active Emergency</p>
            <h2 className="text-2xl font-black text-slate-900">{currentTrip.patient_name}</h2>
            <p className="text-sm text-slate-500">{currentTrip.emergency_description}</p>
          </div>
          <a href={`tel:${currentTrip.phone}`} className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
            <Phone className="w-5 h-5 text-white" />
          </a>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl mb-8 flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Status</p>
                <p className="font-bold text-slate-900 uppercase">{status}</p>
            </div>
        </div>

        <div className="space-y-4">
          {status === 'accepted' && (
            <button onClick={handleDispatch} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-200">
              DISPATCH AMBULANCE
            </button>
          )}
          {status === 'dispatched' && (
            <button onClick={handleArrive} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200">
              MARK AS ARRIVED
            </button>
          )}
          {status === 'arrived' && (
            <button onClick={handleComplete} className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-200">
              COMPLETE TRIP
            </button>
          )}

          <button onClick={() => setShowCancelModal(true)} className="w-full py-4 text-slate-400 font-bold text-sm uppercase flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Cancel Trip
          </button>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in">
            <h3 className="text-xl font-black mb-4">Cancel Trip</h3>
            <textarea
              className="w-full p-4 border-2 border-slate-100 rounded-2xl mb-6 outline-none focus:border-orange-500"
              placeholder="Provide a reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold">Keep</button>
              <button onClick={handleCancel} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black">Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripScreen;
