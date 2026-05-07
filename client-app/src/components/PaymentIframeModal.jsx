import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentIframeModal({ isOpen, url, onClose }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-lg sm:max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[80vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <h3 className="font-bold text-slate-800">Secure Payment</h3>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            title="Cancel Payment"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Iframe Container */}
                    <div className="flex-1 bg-white relative w-full h-full">
                        <iframe 
                            src={url} 
                            className="absolute inset-0 w-full h-full border-none"
                            title="Pesapal Secure Checkout"
                            allow="payment"
                        />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
