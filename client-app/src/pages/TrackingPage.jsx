import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, ShieldAlert, Navigation, MoreVertical, X } from 'lucide-react';
import MapView from '../components/MapComponent';
import { useBookingStore } from '../store/useBookingStore';
import { useLocationStore } from '../store/useLocationStore';
import ambulanceDay from '../assets/ambulance-day.jpg';

export default function TrackingPage({ onCancel }) {
    const { activeBookingId, selectedAmbulance, bookingStatus, driverLocation } = useBookingStore();
    const { userLocation, locationLoading } = useLocationStore();
    
    const displayStatus = (bookingStatus || 'pending').toUpperCase();

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-slate-100 flex flex-col">
            {/* Top Bar overlaying Map */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-xl shadow-lg border border-white/20 rounded-2xl p-4 flex justify-between items-center pointer-events-auto max-w-4xl mx-auto">
                    <div>
                        <p className="text-orange-600 font-bold text-xs tracking-wider uppercase mb-1">Emergency Dispatch Active</p>
                        <h1 className="text-slate-800 font-bold text-lg md:text-xl leading-none">Status: {displayStatus}</h1>
                    </div>
                    {['pending', 'accepted'].includes(bookingStatus) && (
                        <button onClick={onCancel} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold transition">
                            Cancel Request
                        </button>
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 w-full bg-slate-300 z-0 relative">
                <MapView 
                    userLocation={userLocation}
                    locationLoading={locationLoading}
                    ambulances={driverLocation ? [{ ...selectedAmbulance, lat: driverLocation.lat, lng: driverLocation.lng }] : (selectedAmbulance ? [selectedAmbulance] : [])}
                    onAmbulanceSelect={() => {}}
                    trackingMode={true}
                />
            </div>

            {/* Bottom Sheet - Tracking Info */}
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 overflow-hidden max-h-[80vh] flex flex-col max-w-4xl mx-auto md:bottom-6 md:rounded-[40px]"
            >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
                
                <div className="p-6 md:p-10 flex flex-col h-full">
                    {/* ETA Hero Row */}
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                        <div className="bg-orange-500 p-5 rounded-[32px] text-white shadow-xl shadow-orange-100">
                            <Navigation className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-slate-900 font-black text-2xl md:text-3xl tracking-tight">Ambulance is {displayStatus === 'ARRIVED' ? 'Arrived!' : 'En Route'}</h3>
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Real-time GPS Tracking Active</p>
                        </div>
                    </div>

                    {/* Dispatch Info Panel — No Generic Labels Rule */}
                    <div className="bg-slate-50 p-6 rounded-[32px] mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100">
                                🚑
                            </div>
                            <div>
                                <h4 className="font-black text-xl text-slate-900 leading-tight">
                                    {selectedAmbulance?.company_name || 'Emergency Unit'}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unit: {selectedAmbulance?.ambulance_number || 'N/A'}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ID: {selectedAmbulance?.driver_uid || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-4 border-t border-slate-200">
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Assigned Driver</p>
                                <p className="font-bold text-slate-800">{selectedAmbulance?.driver_name || 'Awaiting Dispatch'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <a 
                            href={`tel:${selectedAmbulance?.driver_phone || '999'}`}
                            className="flex flex-col items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-5 rounded-[28px] transition-all shadow-lg shadow-green-100 active:scale-95"
                        >
                            <Phone className="w-6 h-6" />
                            <span className="font-black text-xs uppercase tracking-widest">Call Driver</span>
                        </a>
                        <a 
                            href={`tel:${selectedAmbulance?.company_phone || '999'}`}
                            className="flex flex-col items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[28px] transition-all shadow-lg shadow-slate-200 active:scale-95"
                        >
                            <Phone className="w-6 h-6" />
                            <span className="font-black text-xs uppercase tracking-widest">Call Company</span>
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
