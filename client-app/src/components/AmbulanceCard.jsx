import { motion } from 'framer-motion';
import { Clock, Navigation, Phone, ShieldAlert, DollarSign } from 'lucide-react';

export default function AmbulanceCard({ ambulance, onRequest }) {
    if (!ambulance) return null;

    return (
        <motion.div 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="absolute bottom-6 left-4 right-4 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-30"
        >
            {/* Header Image Area - Represents provided Ambulance Image (e.g. night/day ambulance) */}
            <div className="relative h-44 w-full bg-slate-200">
                <img 
                    src="https://images.unsplash.com/photo-1587556930799-8dca6a5f4bb5?q=80&w=800&auto=format&fit=crop" 
                    alt="Emergency Ambulance" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-5">
                    <h3 className="font-bold text-2xl text-white flex items-center gap-2 drop-shadow-md">
                        {ambulance.companyName}
                        <ShieldAlert className="w-5 h-5 text-red-500 fill-red-500/20" />
                    </h3>
                    <p className="text-white/80 text-sm font-medium mt-1 tracking-wide">UNIT: {ambulance.plateNumber}</p>
                </div>
                
                {/* Distance Badge floating top-right */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-800 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    {ambulance.distance} km
                </div>
            </div>

            <div className="p-5">
                <div className="flex gap-3 mb-5 text-sm font-semibold">
                    <div className="flex flex-col items-center justify-center bg-red-50 text-red-700 p-3 rounded-2xl flex-1 border border-red-100">
                        <Clock className="w-6 h-6 mb-1 text-red-600" />
                        <span>{ambulance.eta} Min</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 p-3 rounded-2xl flex-1 border border-blue-100">
                        <Phone className="w-6 h-6 mb-1 text-blue-600" />
                        <span>Contact</span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-emerald-50 text-emerald-700 p-3 rounded-2xl flex-1 border border-emerald-100">
                        <DollarSign className="w-6 h-6 mb-1 text-emerald-600" />
                        <span>Est. $150</span>
                    </div>
                </div>

                <button 
                    onClick={onRequest}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-600/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2 text-lg uppercase tracking-wide"
                >
                    Request Emergency Rescue
                </button>
            </div>
        </motion.div>
    );
}
