import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Star } from 'lucide-react';

export default function AvailableUnitsList({ ambulances, onSelect }) {
    const hasAmbulances = ambulances && ambulances.length > 0;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-30 flex flex-col pointer-events-auto pb-6 max-h-[60vh]"
            >
                <div className="p-4 border-b border-slate-100 flex justify-center cursor-grab active:cursor-grabbing shrink-0">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                </div>
                
                <div className="px-6 py-4 overflow-y-auto custom-scrollbar flex-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                        Nearby Units {hasAmbulances ? `(${ambulances.length})` : ''}
                    </h3>
                    <div className="space-y-3 pb-8">
                        {hasAmbulances ? (
                            ambulances.map(amb => (
                                <button 
                                    key={amb.id}
                                    onClick={() => onSelect(amb)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-white border-2 border-transparent hover:border-blue-100 active:border-blue-500 rounded-2xl transition-all text-left shadow-sm hover:shadow-md group"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">{amb.company_name || 'Rescue Unit'}</p>
                                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">{amb.ambulance_number}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider -mt-1">{amb.driver_name || 'Awaiting Driver'}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] sm:text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded-md flex items-center gap-1.5 uppercase tracking-wide">
                                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                                                {amb.eta || '?'} min
                                            </span>
                                            <span className="text-[10px] sm:text-xs bg-white text-slate-600 font-bold px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                                                <Navigation className="w-3 h-3 text-blue-500" />
                                                {amb.distance || '?'} km
                                            </span>
                                            <span className="text-[10px] sm:text-xs bg-orange-50 text-orange-600 font-bold px-2 py-1 rounded-md border border-orange-100 flex items-center gap-1.5 uppercase tracking-wide">
                                                <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                                                {amb.rating || '4.8'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white text-blue-600 p-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 w-12 h-12 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <MapPin className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-bold text-sm">No Active Units Nearby</p>
                                <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-wider font-extrabold">Dispatchers are currently unavailable</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
