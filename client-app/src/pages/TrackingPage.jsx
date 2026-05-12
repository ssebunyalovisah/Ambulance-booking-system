// client-app/src/pages/TrackingPage.jsx
import { motion } from 'framer-motion';
import { Phone, Navigation, MapPin, Activity, ShieldCheck, X } from 'lucide-react';
import MapView from '../components/MapComponent';
import { useBookingStore } from '../store/useBookingStore';
import { useLocationStore } from '../store/useLocationStore';

export default function TrackingPage({ onCancel }) {
  const { activeBookingId, selectedAmbulance, bookingStatus, driverLocation } = useBookingStore();
  const { userLocation } = useLocationStore();
  
  const displayStatus = (bookingStatus || 'pending').toUpperCase();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-100 flex flex-col font-sans">
      {/* Top Banner */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl border border-white/40 rounded-[32px] p-6 flex justify-between items-center max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Emergency Tracking</p>
              <h1 className="text-slate-900 font-black text-xl tracking-tight truncate">{displayStatus}</h1>
            </div>
          </div>
          {['pending', 'accepted', 'dispatched', 'arrived'].includes((bookingStatus || 'pending').toLowerCase()) && (
            <button 
              onClick={onCancel} 
              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-2xl transition-all flex items-center gap-2"
            >
              <span className="text-[10px] font-black uppercase tracking-widest hidden xs:block">Cancel</span>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 w-full bg-slate-200 z-0 relative">
        <MapView 
          userLocation={userLocation}
          ambulances={driverLocation ? [{ ...selectedAmbulance, lat: driverLocation.lat, lng: driverLocation.lng }] : []}
          trackingMode={true}
        />
      </div>

      {/* Info Sheet */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[48px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] z-20 p-8 max-w-2xl mx-auto"
      >
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
        
        <div className="flex items-center gap-6 mb-8">
          <div className="bg-orange-500 p-5 rounded-[28px] text-white shadow-xl shadow-orange-100">
            <Navigation className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-slate-900 font-black text-2xl tracking-tight">
              {displayStatus === 'ARRIVED' ? 'Help has Arrived!' : 'Ambulance is En Route'}
            </h3>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Live Location Sharing Active</p>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-[32px] mb-8 border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-200">🚑</div>
            <div className="flex-1">
              <h4 className="font-black text-lg text-slate-900">{selectedAmbulance?.company_name || 'Emergency Unit'}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit: {selectedAmbulance?.ambulance_number || '---'}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Dispatch
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <a href={`tel:${selectedAmbulance?.driver_phone || '999'}`} className="flex flex-col items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-5 rounded-[28px] shadow-lg shadow-green-100 transition-all active:scale-95">
            <Phone className="w-6 h-6" />
            <span className="font-black text-[10px] uppercase tracking-widest">Call Driver</span>
          </a>
          <a href={`tel:${selectedAmbulance?.company_phone || '999'}`} className="flex flex-col items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-5 rounded-[28px] shadow-lg shadow-slate-200 transition-all active:scale-95">
            <Phone className="w-6 h-6" />
            <span className="font-black text-[10px] uppercase tracking-widest">Call Base</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
