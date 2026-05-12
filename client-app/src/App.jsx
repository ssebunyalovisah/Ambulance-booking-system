// client-app/src/App.jsx
import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowLeft } from 'lucide-react';
import MapView from './components/MapComponent';
import AmbulanceCard from './components/AmbulanceCard';
import AvailableUnitsList from './components/AvailableUnitsList';
import BookingModal from './components/BookingModal';
import PaymentIframeModal from './components/PaymentIframeModal';
import InstallPrompt from './components/InstallPrompt';
import TrackingPage from './pages/TrackingPage';
import FeedbackModal from './pages/FeedbackPage';
import LandingPage from './pages/LandingPage';
import PaymentStatusPage from './pages/PaymentStatus';
import { createBooking, getNearbyAmbulances, cancelBooking, checkBookingStatus, updatePatientLocation } from './services/api';
import { socketService } from './services/socket';
import { useBookingStore } from './store/useBookingStore';
import { useLocationStore } from './store/useLocationStore';

function EmergencyApp() {
  const navigate = useNavigate();
  const [paymentIframeUrl, setPaymentIframeUrl] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { 
    userLocation, locationLoading, nearbyAmbulances, setUserLocation, setNearbyAmbulances, setLocationLoading 
  } = useLocationStore();

  const { 
    activeBookingId, bookingStatus, selectedAmbulance, isBookingModalOpen, isTripCompleted,
    setSelectedAmbulance, openBookingModal, closeBookingModal, setActiveBooking, completeTrip, clearBooking
  } = useBookingStore();

  // Initial Location & Fleet Load
  useEffect(() => {
    const fetchAmbulances = async (coords) => {
      try {
        const data = await getNearbyAmbulances();
        console.log(`Received ${data?.length || 0} ambulances from API`);
        setNearbyAmbulances(data || []);
      } catch (err) {
        console.error("Fleet fetch failed", err);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          setLocationLoading(false);
          fetchAmbulances();
        },
        () => {
          const fallback = { lat: 0.3476, lng: 32.5825 };
          setUserLocation(fallback);
          setLocationLoading(false);
          fetchAmbulances();
        },
        { enableHighAccuracy: true }
      );
    }
  }, [setUserLocation, setNearbyAmbulances, setLocationLoading]);

  // Socket & Status Synchronization
  useEffect(() => {
    if (!activeBookingId) return;

    socketService.connect();
    socketService.joinBookingRoom(activeBookingId);

    const sync = async () => {
      try {
        const data = await checkBookingStatus(activeBookingId);
        if (data.status === 'completed') completeTrip();
        else if (data.status === 'cancelled' || data.status === 'timed_out') {
          clearBooking();
        } else {
          setActiveBooking(activeBookingId, data.status);
        }
      } catch (err) {
        console.error('Status sync failed', err);
        // If the booking is not found (404), it means the DB was reset or booking deleted
        if (err.response?.status === 404) {
          console.warn('Active booking not found on server. Clearing stale state.');
          clearBooking();
        }
      }
    };

    sync();

    socketService.onBookingUpdate((data) => {
      if (data.bookingId === activeBookingId) {
        if (data.status === 'completed') {
          completeTrip();
        } else if (data.status === 'cancelled' || data.status === 'timed_out') {
          alert(data.status === 'timed_out' ? 'Booking timed out.' : 'Booking was cancelled');
          clearBooking();
        } else {
          setActiveBooking(activeBookingId, data.status);
        }
      }
    });

    socketService.onAmbulanceLocation((data) => {
      if (data.bookingId === activeBookingId) {
        useBookingStore.getState().setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    });

    const locationInterval = setInterval(() => {
      if (userLocation) {
        updatePatientLocation(activeBookingId, userLocation.lat, userLocation.lng);
      }
    }, 5000);

    return () => {
      clearInterval(locationInterval);
    };
  }, [activeBookingId, completeTrip, clearBooking, setActiveBooking, userLocation]);

  const handleBookingSubmit = async (formData) => {
    try {
      const payload = {
        patient_name: formData.name,
        phone: formData.phone,
        emergency_description: formData.description,
        payment_method: formData.payment,
        patient_lat: userLocation.lat,
        patient_lng: userLocation.lng,
        ambulance_id: selectedAmbulance?.id,
        company_id: selectedAmbulance?.company_id,
        driver_id: selectedAmbulance?.driver_id,
      };
      const response = await createBooking(payload);
      closeBookingModal();
      setActiveBooking(response.id, 'pending');
    } catch (err) {
      alert("Booking failed. Please try again.");
    }
  };

  if (activeBookingId && !isTripCompleted) {
    return (
      <TrackingPage
        onCancel={async () => {
          await cancelBooking(activeBookingId);
          clearBooking();
          navigate("/map");
        }}
        onExit={() => {
          clearBooking();
          navigate("/map");
        }}
      />
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden overflow-x-hidden bg-slate-50 font-sans">
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center">
        <button onClick={() => navigate("/")} className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/50 flex items-center gap-3">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
          <span className="font-bold text-slate-800 text-sm">Home</span>
        </button>
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-3xl shadow-xl border border-white/50 flex flex-col items-end">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-orange-600 animate-pulse" />
            <span className="font-black text-slate-800 text-xs uppercase tracking-tight">Rescue System</span>
          </div>
          <div className="text-[10px] font-bold text-slate-500 mt-0.5 tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} | {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-0">
        <MapView 
          userLocation={userLocation} 
          locationLoading={locationLoading} 
          ambulances={nearbyAmbulances} 
          onAmbulanceSelect={setSelectedAmbulance} 
        />
      </div>

      {!selectedAmbulance && <AvailableUnitsList ambulances={nearbyAmbulances} onSelect={setSelectedAmbulance} />}
      {selectedAmbulance && !isBookingModalOpen && <AmbulanceCard ambulance={selectedAmbulance} onRequest={openBookingModal} onClose={() => setSelectedAmbulance(null)} />}
      {isBookingModalOpen && <BookingModal ambulance={selectedAmbulance} onClose={closeBookingModal} onSubmit={handleBookingSubmit} />}
      
      <FeedbackModal isOpen={isTripCompleted} bookingId={activeBookingId} onReturnHome={() => { clearBooking(); navigate("/"); }} />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<EmergencyApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallPrompt />
    </HashRouter>
  );
}

export default App;
