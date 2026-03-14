import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CreditCard, Stethoscope } from 'lucide-react';

export default function BookingModal({ ambulance, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        description: '',
        payment: 'cash'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4">
                <motion.div 
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white w-full max-w-4xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[95vh] sm:h-auto max-h-[95vh] sm:max-h-[850px]"
                >
                    {/* Left Side - Image/Context Panel */}
                    <div className="md:w-5/12 relative hidden md:block bg-slate-900">
                        <img 
                            src="https://images.unsplash.com/photo-1551076805-e1869043e560?q=80&w=1000&auto=format&fit=crop" 
                            alt="Medical Professional" 
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent p-8 flex flex-col justify-end">
                            <div className="bg-red-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/30">
                                <Stethoscope className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3">Emergency Response</h2>
                            <p className="text-slate-300 leading-relaxed">
                                Our medical professionals are standing by. Please provide accurate details to help us dispatch the correct life-saving team immediately.
                            </p>
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <p className="text-white font-semibold">Dispatching:</p>
                                <p className="text-red-400 font-bold text-xl">{ambulance?.companyName}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="flex-1 flex flex-col h-full overscroll-none overflow-y-auto">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-10 border-b border-slate-100 p-4 md:p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3 text-red-700 font-bold">
                                <div className="bg-red-100 p-2 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="leading-tight">
                                    <h3 className="text-lg">Dispatch Request</h3>
                                    <p className="text-sm font-medium text-slate-500">Unit {ambulance?.plateNumber}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 flex-1">
                            {/* Mobile Banner replacing left image */}
                            <div className="md:hidden bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                                <p className="text-sm text-slate-600">
                                    Dispatching <strong className="text-slate-800">{ambulance?.companyName}</strong>. Please provide accurate details.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Patient Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                        placeholder="Enter patient's full name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Emergency Contact</label>
                                    <input 
                                        required
                                        type="tel" 
                                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                                        placeholder="Phone number for updates"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Emergency Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea 
                                        required
                                        rows="3"
                                        className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none placeholder:text-slate-400 font-medium"
                                        placeholder="Describe the medical emergency (e.g. Heart attack, acccident...)"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Payment Method</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, payment: 'cash'})}
                                            className={`py-4 px-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                                                formData.payment === 'cash' 
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                                                : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                            }`}
                                        >
                                            Pay on Arrival
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, payment: 'card'})}
                                            className={`py-4 px-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                                                formData.payment === 'card' 
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                                                : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                            }`}
                                        >
                                            <CreditCard className="w-5 h-5"/> Secure Card
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 pb-4">
                                <button 
                                    type="submit" 
                                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-5 rounded-2xl shadow-xl shadow-red-600/20 transition-all text-lg flex items-center justify-center gap-3 uppercase tracking-wider"
                                >
                                    Confirm Emergency Dispatch
                                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                        →
                                    </motion.div>
                                </button>
                                <p className="text-center text-xs text-slate-500 font-medium mt-4">
                                    By confirming, you agree to the emergency dispatch priority terms.
                                </p>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
