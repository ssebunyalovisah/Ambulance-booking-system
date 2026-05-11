import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, CheckCircle2, Home, X, Loader2 } from 'lucide-react';
import ambulanceDay from '../assets/ambulance-day.jpg';
import api from '../services/api';

export default function FeedbackModal({ bookingId, ambulance, isOpen, onReturnHome }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!bookingId) {
            alert('Booking information is missing. Please return home and try again.');
            return;
        }

        if (rating === 0) {
            alert('Please select a rating before submitting.');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/feedback', {
                booking_id: bookingId,
                rating,
                comments: comment
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting feedback:', error.response?.data || error);
            alert('Could not submit feedback. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onReturnHome}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white rounded-[2.5rem] shadow-2xl shadow-orange-500/10 max-w-lg w-full overflow-hidden border border-white/20"
                >
                    {submitted ? (
                        <div className="p-10 text-center">
                            <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-orange-600 shadow-lg shadow-orange-500/10">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight font-outfit">Excellent!</h2>
                            <p className="text-slate-500 font-medium mb-10 leading-relaxed font-inter">
                                Your review helps us ensure everyone receives high-quality emergency care.
                            </p>
                            <button 
                                onClick={onReturnHome}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 shadow-orange-500/20 uppercase tracking-widest text-sm"
                            >
                                <Home className="w-5 h-5" />
                                Return Home
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Close Button */}
                            <button 
                                onClick={onReturnHome}
                                className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8 md:p-10">
                                <div className="text-center mb-8">
                                    <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-600 shadow-lg shadow-orange-500/10">
                                        <Star className="w-8 h-8 fill-current" />
                                    </div>
                                    <h1 className="text-3xl font-black text-slate-900 mb-2 font-outfit tracking-tight">How was your trip?</h1>
                                    <p className="text-slate-500 font-medium tracking-wide font-inter">Rate the response time and quality of care.</p>
                                </div>

                                <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
                                        <img src={ambulanceDay} alt="Ambulance" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 font-inter">{ambulance?.company_name || 'Rescue Force'}</h3>
                                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Unit {ambulance?.ambulance_number || 'NY-112'}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="flex justify-center gap-2 md:gap-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                disabled={isLoading}
                                                className="transition-all active:scale-90"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHover(star)}
                                                onMouseLeave={() => setHover(0)}
                                            >
                                                <Star 
                                                    className={`w-10 h-10 md:w-12 md:h-12 transition-all duration-300 ${
                                                        star <= (hover || rating) 
                                                        ? 'fill-orange-400 text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.5)]' 
                                                        : 'text-slate-200'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <textarea 
                                            required
                                            rows="3"
                                            className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none placeholder:text-slate-400 font-medium font-inter"
                                            placeholder="Any comments for the rescue team?"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>

                                    <button 
                                        disabled={rating === 0 || isLoading}
                                        type="submit"
                                        className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 tracking-widest uppercase text-xs select-none font-outfit ${
                                            rating > 0 && !isLoading
                                            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/30 active:scale-[0.98]' 
                                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        }`}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Send Rating & Continue'
                                        )}
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
