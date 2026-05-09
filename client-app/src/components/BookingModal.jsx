import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CreditCard, Stethoscope } from 'lucide-react';

export default function BookingModal({ ambulance, onClose, onSubmit }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        description: '',
        address: '',
        payment: 'momo'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        
        // Simulate Payment Processing
        setTimeout(() => {
            setIsProcessing(false);
            onSubmit(formData);
        }, 3000);
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
                    <div className="md:w-5/12 relative hidden md:block bg-slate-900 border-r border-slate-100">
                        <img 
                            src="https://images.unsplash.com/photo-1551076805-e1869043e560?q=80&w=1000&auto=format&fit=crop" 
                            alt="Medical Professional" 
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent p-8 flex flex-col justify-end">
                            <div className="bg-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
                                <Stethoscope className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3 font-outfit">Emergency Response</h2>
                            <p className="text-slate-300 leading-relaxed font-inter">
                                Our medical professionals are standing by. Please provide accurate details for immediate dispatch.
                            </p>
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <p className="text-white font-semibold">Dispatching:</p>
                                <p className="text-orange-400 font-bold text-xl uppercase tracking-wider">{ambulance?.company_name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="flex-1 flex flex-col h-full overscroll-none overflow-y-auto">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-10 border-b border-slate-100 p-4 md:p-5 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-orange-700 font-bold">
                            <div className="bg-orange-100 p-2 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                                <div className="leading-tight">
                                    <h3 className="text-lg font-outfit">Dispatch Request</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit {ambulance?.ambulance_number}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-7 space-y-5 flex-1">
                            {/* Mobile Banner replacing left image */}
                            <div className="md:hidden bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
                                <p className="text-sm text-slate-600 font-inter">
                                    Dispatching <strong className="text-slate-800">{ambulance?.company_name}</strong>.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 font-inter">Patient Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-400 font-inter font-medium"
                                            placeholder="Full name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 font-inter">Contact Number</label>
                                        <input 
                                            required
                                            type="tel" 
                                            className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-400 font-inter font-medium"
                                            placeholder="Phone number"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 font-inter">
                                        Emergency Description <span className="text-orange-500">*</span>
                                    </label>
                                    <textarea 
                                        required
                                        rows="2"
                                        className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none placeholder:text-slate-400 font-inter font-medium"
                                        placeholder="Heart attack, accident, etc."
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 font-inter">
                                        Pickup Address / Nearest Landmark <span className="text-orange-500">*</span>
                                    </label>
                                    <textarea 
                                        required
                                        rows="2"
                                        className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none placeholder:text-slate-400 font-inter font-medium"
                                        placeholder="Detailed address and nearest landmarks"
                                        value={formData.address}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-3 font-inter">Payment Method <span className="text-orange-500">*</span></label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => setFormData({...formData, payment: 'momo'})}
                                            className={`py-3 px-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all font-inter ${
                                                formData.payment === 'momo' 
                                                ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm' 
                                                : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="w-5 h-5 bg-yellow-400 rounded-md flex items-center justify-center text-[8px] text-white font-black">MoMo</div>
                                            Mobile Money
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => setFormData({...formData, payment: 'card'})}
                                            className={`py-3 px-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all font-inter ${
                                                formData.payment === 'card' 
                                                ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm' 
                                                : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <CreditCard className="w-4 h-4"/> Card
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => setFormData({...formData, payment: 'cash'})}
                                            className={`py-3 px-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all font-inter ${
                                                formData.payment === 'cash' 
                                                ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm' 
                                                : 'border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            💵 Cash
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 pb-2">
                                <button 
                                    type="submit" 
                                    disabled={isProcessing}
                                    className={`w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-orange-500/20 transition-all text-lg flex items-center justify-center gap-3 uppercase tracking-wider font-outfit ${isProcessing ? 'opacity-80 pointer-events-none' : ''}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                            />
                                            Processing Payment...
                                        </>
                                    ) : (
                                        <>
                                            Pay & Confirm Dispatch
                                            <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                                                →
                                            </motion.div>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-[10px] text-slate-500 font-bold mt-4 uppercase tracking-widest font-inter">
                                    Your request will be sent immediately after successful payment.
                                </p>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
