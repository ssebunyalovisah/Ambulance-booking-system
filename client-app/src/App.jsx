import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import { createBooking, getNearbyAmbulances, initiatePayment, cancelBooking, checkBookingStatus } from './services/api';
import { socketService } from './services/socket';
import { useBookingStore } from './store/useBookingStore';
import { useLocationStore } from './store/useLocationStore';

function EmergencyApp() {
  const navigate = useNavigate();
  const [paymentIframeUrl, setPaymentIframeUrl] = useState(null);

  // Removed the hard-refresh redirect glitch to allow direct access/refresh
  // useEffect(() => {
  //   if (!window.isClientNav) {
  //       navigate("/", { replace: true });
  //   }
  // }, [navigate]);

  const { 
    userLocation, 
    setUserLocation, 
    nearbyAmbulances, 
    setNearbyAmbulances,
    locationLoading,
    setLocationLoading
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

  // Listen for iframe payment success/failure messages
  useEffect(() => {
    const handleIframeMessage = (event) => {
        if (event.data?.type === 'PESAPAL_PAYMENT_SUCCESS') {
            setPaymentIframeUrl(null); // Close iframe
            setActiveBooking(event.data.bookingId, 'PAID');
        } else if (event.data?.type === 'PESAPAL_PAYMENT_FAILED') {
            setPaymentIframeUrl(null); // Close iframe
            alert("Payment failed or was cancelled. Please try again.");
        }
    };
    
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [setActiveBooking]);

  // 1. Initial Location Detection & Real API Integration
  useEffect(() => {
    const fetchAmbulances = async (coords) => {
        try {
            const data = await getNearbyAmbulances(coords.lat, coords.lng);
            if (data.success) {
                setNearbyAmbulances(data.ambulances || []);
            }
        } catch (err) {
            console.error("API fetch failed", err);
            setNearbyAmbulances([]);
        }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(coords);
          setLocationLoading(false);
          fetchAmbulances(coords);
        },
        (error) => {
          console.warn("Geolocation failed or blocked, using default center.", error);
          const fallback = { lat: 0.3476, lng: 32.5825 }; 
          setUserLocation(fallback);
          setLocationLoading(false);
          fetchAmbulances(fallback);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
        const fallback = { lat: 0.3476, lng: 32.5825 };
        setUserLocation(fallback);
        setLocationLoading(false);
        fetchAmbulances(fallback);
    }

    // Listen for real-time fleet updates to refresh the list automatically
    socketService.connect();
    const onFleetUpdate = () => {
        const latestLocation = useLocationStore.getState().userLocation;
        if (latestLocation) fetchAmbulances(latestLocation);
        else {
             // If location not yet set, use fallback
             fetchAmbulances({ lat: 0.3476, lng: 32.5825 });
        }
    };
    socketService.onAmbulanceUpdate(onFleetUpdate);

    return () => {
        socketService.offAmbulanceUpdate(onFleetUpdate);
    };
  }, [setUserLocation, setNearbyAmbulances]); // Removed userLocation to prevent infinite loop

  // 2. Socket Connection & Status Sync for Tracking
  useEffect(() => {
    if (activeBookingId) {
       // Sync initial status on mount/restore
       const syncStatus = async () => {
           try {
               const data = await checkBookingStatus(activeBookingId);
               if (data.status === 'completed') {
                   completeTrip();
               } else if (data.status === 'cancelled') {
                   clearBooking();
               } else {
                   setActiveBooking(activeBookingId, data.status);
                   if (data.ambulance_id) setSelectedAmbulance(data);
               }
           } catch (e) {
               console.error("Failed to sync booking status", e);
           }
       };
       syncStatus();

       socketService.connect();
       socketService.joinBookingRoom(activeBookingId);
       
        const handleBookingSync = (data) => {
            if (data.id === activeBookingId) {
                if (data.status === 'completed') {
                    completeTrip();
                } else if (data.status === 'cancelled' || data.status === 'denied') {
                    const msg = data.status === 'denied' 
                        ? 'Your request was declined by the assigned driver. Please try requesting another unit.'
                        : `Booking #${data.id} has been cancelled by the operator. Reason: ${data.cancel_reason || 'Administrative action'}`;
                    alert(msg);
                    clearBooking();
                    socketService.leaveBookingRoom();
                } else {
                    if (data.status === 'arrived') {
                        alert('🚑 Your ambulance has arrived! Please look out for the unit.');
                    }
                    setActiveBooking(activeBookingId, data.status);
                    if (data.company_name || data.driver_name) {
                        setSelectedAmbulance(data);
                    }
                }
            }
        };

        const handleDriverLocation = (data) => {
           console.log("Real-time driver movement received:", data);
           useBookingStore.getState().setDriverLocation({ lat: data.lat, lng: data.lng });
        };

        socketService.onBookingUpdate(handleBookingSync);
        socketService.onDriverLocation(handleDriverLocation);

        return () => {
            socketService.offBookingUpdate(handleBookingSync);
            socketService.offDriverLocation(handleDriverLocation);
        };
    }
  }, [activeBookingId, setActiveBooking, completeTrip]); // Stable socket lifecycle

  // 3. Independent Real-time Location Sharing
  useEffect(() => {
    if (activeBookingId && userLocation) {
        const interval = setInterval(() => {
            socketService.emitPatientLocation(activeBookingId, userLocation);
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [activeBookingId, userLocation]);

  const handleBookingSubmit = async (formData) => {
    try {
        const payload = {
            patient_name: formData.name,
            phone: formData.phone,
            emergency_description: formData.description,
            payment_method: formData.payment,
            patient_lat: userLocation.lat,
            patient_lng: userLocation.lng,
            ambulance_id: selectedAmbulance?.ambulance_id,
            company_id: selectedAmbulance?.company_id,
            driver_id: selectedAmbulance?.driver_id
        };
        const response = await createBooking(payload);
        
        // If payment is mobile money or card, we need to pay first
        if (formData.payment === 'momo' || formData.payment === 'card') {
            const paymentData = await initiatePayment(response.booking_id);
            // Save booking id to local storage so we can check it after callback
            localStorage.setItem("pending_booking_id", response.booking_id);
            // Open iframe instead of redirecting
            closeBookingModal();
            setPaymentIframeUrl(paymentData.redirect_url);
            return;
        }

        closeBookingModal();
        setActiveBooking(response.booking_id, 'PENDING');

    } catch (err) {
        console.error(err);
        if (err.response?.data?.error) {
            alert(err.response.data.reason || err.response.data.error);
        } else {
            alert("Emergency Request Failed. Please try calling emergency services directly.");
        }
    }
  };

  // --- RENDER LOGIC ---


  // If there is an active booking, show the Tracking Page (unless trip is completed)
  if (activeBookingId && !isTripCompleted) {
    return <TrackingPage onCancel={async () => {
        try {
            await cancelBooking(activeBookingId);
        } catch (e) {
            console.error("Server cancel failed", e);
        }
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
           <div className="bg-orange-500 p-2 md:p-2.5 rounded-xl text-white animate-pulse">
               <Stethoscope className="w-4 h-4 md:w-5 md:h-5" />
           </div>
           <span className="text-sm md:text-md text-orange-600 font-bold tracking-tight">Rescue System</span>
        </div>
      </div>

      {/* Main Map View */}
      <div className="absolute inset-0 z-0">
          <MapView 
            userLocation={userLocation}
            locationLoading={locationLoading}
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
      
      {/* Feedback Modal (Pop-up) */}
      <FeedbackModal 
        isOpen={isTripCompleted}
        bookingId={activeBookingId}
        ambulance={selectedAmbulance}
        onReturnHome={() => {
            clearBooking();
            navigate("/", { replace: true });
        }}
      />

      {/* Payment Iframe Modal */}
      <PaymentIframeModal 
        isOpen={!!paymentIframeUrl} 
        url={paymentIframeUrl} 
        onClose={() => setPaymentIframeUrl(null)} 
      />
      
      {/* Background overlay when modal is open */}
      {(isBookingModalOpen || paymentIframeUrl) && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 transition-all pointer-events-none" />
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <BrowserRouter suppressHydrationWarning>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/map" element={<EmergencyApp />} />
          <Route path="/payment-status" element={<PaymentStatusPage />} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <InstallPrompt />
    </>
  );
}

export default App;

