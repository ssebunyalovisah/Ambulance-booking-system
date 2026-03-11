import { useEffect } from 'react';
import { Stethoscope, AlertCircle } from 'lucide-react';
import MapView from './components/MapComponent';
import AmbulanceCard from './components/AmbulanceCard';
import BookingModal from './components/BookingModal';
import TrackingPage from './pages/TrackingPage';
import FeedbackPage from './pages/FeedbackPage';
import { createBooking } from './services/api';
import { socketService } from './services/socket';
import { useBookingStore } from './store/useBookingStore';
import { useLocationStore } from './store/useLocationStore';

// Temporary Mock Data for Demonstration
const MOCK_AMBULANCES = [
  { id: '1', lat: 40.7138, lng: -74.0040, companyName: 'City Rescue Force', plateNumber: 'NY-112', eta: 5, distance: 1.2 },
  { id: '2', lat: 40.7108, lng: -74.0080, companyName: 'Rapid Med Transport', plateNumber: 'NY-499', eta: 8, distance: 2.1 },
];

function App() {
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
            onReturnHome={() => clearBooking()} 
        />
    );
  }

  // If there is an active booking, show the Tracking Page
  if (activeBookingId) {
    return <TrackingPage onCancel={() => clearBooking()} />;
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-50">
      {/* Premium Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl px-5 py-4 rounded-3xl shadow-2xl border border-white/40 flex items-center gap-4 pointer-events-auto transform transition-all hover:scale-105">
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-2xl text-white shadow-lg shadow-red-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg leading-none tracking-tight">Rapid Rescue</h1>
            <p className="border-t border-slate-100 mt-1 pt-1 text-[10px] text-red-600 font-black tracking-[0.2em] uppercase">Emergency Dispatch</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-2 text-slate-600 border border-white/40">
           <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
           <span className="text-sm font-bold">Live Status</span>
        </div>
      </div>

      {/* Main Map View */}
      <MapView 
        userLocation={userLocation}
        ambulances={nearbyAmbulances}
        onAmbulanceSelect={setSelectedAmbulance}
      />

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
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-all" />
      )}
    </div>
  );
}

export default App;

