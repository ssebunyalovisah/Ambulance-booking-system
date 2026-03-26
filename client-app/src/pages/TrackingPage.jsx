import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, ShieldAlert, Navigation, MoreVertical, X } from 'lucide-react';
import MapView from '../components/MapComponent';
import { useBookingStore } from '../store/useBookingStore';
import { useLocationStore } from '../store/useLocationStore';
import ambulanceDay from '../assets/ambulance-day.jpg';

export default function TrackingPage({ onCancel }) {
    const { activeBookingId, selectedAmbulance } = useBookingStore();
    const { userLocation, locationLoading } = useLocationStore();
    const [eta, setEta] = useState(selectedAmbulance?.eta || 5);
    const [distance, setDistance] = useState(selectedAmbulance?.distance || 1.2);
    
    // Simulate ambulance movement
    useEffect(() => {
        if (eta <= 0) return;
        
        const interval = setInterval(() => {
            setEta(prev => Math.max(0, prev - 1));
            setDistance(prev => Math.max(0, (prev - 0.2).toFixed(1)));
        }, 30000); // Update every 30s for demo
        
        return () => clearInterval(interval);
    }, [eta]);

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-slate-100 flex flex-col">
            {/* Top Bar overlaying Map */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-xl shadow-lg border border-white/20 rounded-2xl p-4 flex justify-between items-center pointer-events-auto max-w-4xl mx-auto">
                    <div>
                        <p className="text-orange-600 font-bold text-xs tracking-wider uppercase mb-1">Emergency Dispatch Active</p>
                        <h1 className="text-slate-800 font-bold text-lg md:text-xl leading-none">Tracking Real-Time...</h1>
                    </div>
                    <button onClick={onCancel} className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-sm font-bold transition">
                        Cancel Help
                    </button>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 w-full bg-slate-300 z-0 relative">
                <MapView 
                    userLocation={userLocation}
                    locationLoading={locationLoading}
                    ambulances={selectedAmbulance ? [selectedAmbulance] : []}
                    onAmbulanceSelect={() => {}}
                    trackingMode={true}
                />
            </div>

            {/* Bottom Sheet - Tracking Info */}
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 overflow-hidden max-h-[80vh] flex flex-col max-w-4xl mx-auto md:bottom-6 md:rounded-3xl"
            >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
                
                <div className="p-5 md:p-8 flex flex-col h-full">
                    {/* ETA Hero Row */}
                    <div className="flex items-end gap-4 mb-6 pb-6 border-b border-slate-100">
                        <div className="bg-orange-50 p-4 rounded-2xl">
                            <h2 className="text-orange-600 font-black text-4xl md:text-5xl leading-none">{eta}</h2>
                            <span className="text-orange-800 font-bold text-sm">MINUTES</span>
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium md:text-lg mb-1">{distance} km remaining</p>
                            <h3 className="text-slate-800 font-bold text-xl md:text-2xl tracking-tight">Ambulance arriving soon</h3>
                        </div>
                    </div>

                    {/* Ambulance & Driver Details */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-200 rounded-2xl overflow-hidden shrink-0 border-2 border-slate-100 shadow-sm">
                             <img 
                                src={ambulanceDay} 
                                alt="Ambulance" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {selectedAmbulance?.companyName || 'City Rescue Force'}
                                <ShieldAlert className="w-4 h-4 text-orange-500" />
                            </h4>
                            <p className="text-slate-500 font-medium text-sm">Plate: {selectedAmbulance?.plateNumber || 'EM-99X'}</p>
                            <div className="inline-flex mt-2 bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600 tracking-wide">
                                Paramedic Unit
                            </div>
                        </div>
                        <button className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition shrink-0">
                            <Phone className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            <span>Dispatched</span>
                            <span className="text-blue-600">En Route</span>
                            <span>Arrived</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-blue-500 rounded-full"
                                initial={{ width: "20%" }}
                                animate={{ width: "60%" }}
                                transition={{ duration: 2 }}
                            />
                        </div>
                    </div>

                    <div className="mt-auto pt-4 flex gap-3">
                        <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition flex justify-center items-center gap-2">
                            Share Live Eta
                        </button>
                        <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-4 rounded-2xl transition">
                            <MoreVertical className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
