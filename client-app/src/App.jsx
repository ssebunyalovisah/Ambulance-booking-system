import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Stethoscope, ArrowLeft } from 'lucide-react';
import MapView from './components/MapComponent';
import AmbulanceCard from './components/AmbulanceCard';
import AvailableUnitsList from './components/AvailableUnitsList';
import BookingModal from './components/BookingModal';
import TrackingPage from './pages/TrackingPage';
import FeedbackPage from './pages/FeedbackPage';
import LandingPage from './pages/LandingPage';
import { createBooking } from './services/api';
import { socketService } from './services/socket';
import { useBookingStore } from './store/useBookingStore';
import { useLocationStore } from './store/useLocationStore';

// Temporary Mock Data for Demonstration
const MOCK_AMBULANCES = [
  { id: '1', lat: 40.7138, lng: -74.0040, companyName: 'City Rescue Force', plateNumber: 'NY-112', eta: 5, distance: 1.2 },
  { id: '2', lat: 40.7108, lng: -74.0080, companyName: 'Rapid Med Transport', plateNumber: 'NY-499', eta: 8, distance: 2.1 },
];

function EmergencyApp() {
  const navigate = useNavigate();

  // If a hard refresh happens, volatile memory is cleared. Force navigate back to Home (/)
  useEffect(() => {
    if (!window.isClientNav) {
        navigate("/", { replace: true });
    }
  }, [navigate]);

  const { 
    userLocation, 
    setUserLocation, 
    nearbyAmbulances, 
    setNearbyAmbulances 
  } = useLocationStore();

  const { 
    activeBookingId, 
    bookingStatus, 
    selectedAmbulance, 
    isBookingModalOpen,
    isTripCompleted,
    setSelectedAmbulance,
    openBookingModal,
    closeBookingModal,
    setActiveBooking,
    completeTrip,
    clearBooking
  } = useBookingStore();

  // 1. Initial Location Detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setNearbyAmbulances(MOCK_AMBULANCES);
        },
        (error) => {
          console.error("Error getting location", error);
          // Fallback center
          setUserLocation({ lat: 40.7128, lng: -74.0060 });
          setNearbyAmbulances(MOCK_AMBULANCES);
        }
      );
    }
  }, [setUserLocation, setNearbyAmbulances]);

  // 2. Socket Connection for Tracking
  useEffect(() => {
    if (activeBookingId) {
       socketService.connect();
       socketService.joinBookingRoom(activeBookingId);
       
       socketService.onBookingUpdate((data) => {
           if (data.status === 'COMPLETED') {
                completeTrip();
           } else {
                setActiveBooking(activeBookingId, `status_${data.status}`);
           }
       });

       socketService.onLocationSync((data) => {
           console.log("Real-time movement received:", data);
       });
    }

    return () => {
        socketService.disconnect();
    };
  }, [activeBookingId, setActiveBooking, completeTrip]);

  const handleBookingSubmit = async (formData) => {
    try {
        const payload = {
            ...formData,
            lat: userLocation.lat,
            lng: userLocation.lng
        };
        const response = await createBooking(payload);
        
        closeBookingModal();
        setActiveBooking(response.booking_id, 'PENDING');

    } catch (err) {
        console.error(err);
        alert("Emergency Request Failed. Please try calling emergency services directly.");
    }
  };

  // --- RENDER LOGIC ---

  // If trip is completed, show the Feedback Page
  if (isTripCompleted) {
    return (
        <FeedbackPage 
            ambulance={selectedAmbulance} 
            onReturnHome={() => {
                clearBooking();
                navigate("/", { replace: true });
            }} 
        />
    );
  }

  // If there is an active booking, show the Tracking Page
  if (activeBookingId) {
    return <TrackingPage onCancel={() => {
        clearBooking();
        navigate("/", { replace: true });
    }} />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-50">
      {/* Premium Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate("/")}
          className="bg-white/80 backdrop-blur-xl p-3 md:px-5 py-4 rounded-3xl shadow-xl hover:shadow-2xl border border-white/40 flex items-center gap-4 pointer-events-auto transform transition-all hover:scale-105 active:scale-95"
        >
          <div className="bg-slate-100 p-3 rounded-2xl text-slate-700">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="hidden md:block text-left">
            <h1 className="font-bold text-slate-800 text-sm md:text-md leading-none tracking-tight">Return Home</h1>
            <p className="mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cancel Request</p>
          </div>
        </button>

        <div className="bg-white/80 backdrop-blur-xl p-3 md:px-5 py-3 rounded-3xl shadow-xl pointer-events-auto flex items-center gap-3 border border-white/40 shadow-red-500/10">
           <div className="bg-red-500 p-2 md:p-2.5 rounded-xl text-white animate-pulse">
               <Stethoscope className="w-4 h-4 md:w-5 md:h-5" />
           </div>
           <span className="text-sm md:text-md text-red-600 font-bold tracking-tight">Rescue System</span>
        </div>
      </div>

      {/* Main Map View */}
      <div className="absolute inset-0 z-0">
          <MapView 
            userLocation={userLocation}
            ambulances={nearbyAmbulances}
            onAmbulanceSelect={setSelectedAmbulance}
          />
      </div>

      {/* Available Units List (Floating Bottom Sheet) */}
      {!isBookingModalOpen && !selectedAmbulance && (
        <AvailableUnitsList 
          ambulances={nearbyAmbulances} 
          onSelect={setSelectedAmbulance} 
        />
      )}

      {/* Selection Card (Slide up from bottom) */}
      {!isBookingModalOpen && selectedAmbulance && (
        <AmbulanceCard 
          ambulance={selectedAmbulance} 
          onRequest={openBookingModal} 
          onClose={() => setSelectedAmbulance(null)}
        />
      )}

      {/* Booking Form Modal */}
      {isBookingModalOpen && (
        <BookingModal 
          ambulance={selectedAmbulance} 
          onClose={closeBookingModal} 
          onSubmit={handleBookingSubmit} 
        />
      )}
      
      {/* Background overlay when modal is open */}
      {isBookingModalOpen && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-all pointer-events-none" />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<EmergencyApp />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

