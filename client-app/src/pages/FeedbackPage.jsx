import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, CheckCircle2, Home, Share2 } from 'lucide-react';
import ambulanceDay from '../assets/ambulance-day.jpg';

export default function FeedbackPage({ ambulance, onReturnHome }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // API call would go here
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-emerald-500/10 max-w-md w-full text-center border border-slate-100"
                >
                    <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Thank You!</h2>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                        Your feedback helps us maintain high standards for life-saving emergency services.
                    </p>
                    <button 
                        onClick={onReturnHome}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Back to Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-12">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full"
            >
                <div className="text-center mb-10">
                    <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-lg shadow-blue-500/10">
                        <Star className="w-8 h-8 fill-current" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Service Completed</h1>
                    <p className="text-slate-500 font-medium tracking-wide">How was your emergency response experience?</p>
                </div>

                <div className="bg-white rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-200 border border-slate-100">
                    <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200">
                            <img 
                                src={ambulanceDay} 
                                alt="Ambulance" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{ambulance?.companyName || 'City Rescue Force'}</h3>
                            <p className="text-slate-400 text-sm font-medium">Unit {ambulance?.plateNumber || 'NY-112'}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-center text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Rate the Speed & Care</label>
                            <div className="flex justify-center gap-2 md:gap-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="transition-all active:scale-90"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                    >
                                        <Star 
                                            className={`w-10 h-10 md:w-12 md:h-12 transition-colors ${
                                                star <= (hover || rating) 
                                                ? 'fill-yellow-400 text-yellow-400' 
                                                : 'text-slate-200 fill-slate-50'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <p className="text-center mt-4 text-slate-900 font-bold text-lg animate-in fade-in slide-in-from-top-2">
                                    {['Poor', 'Acceptable', 'Good', 'Very Good', 'Exceptional'][rating - 1]}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <MessageSquare className="w-4 h-4" />
                                Additional Comments
                            </label>
                            <textarea 
                                rows="4"
                                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none placeholder:text-slate-400 font-medium"
                                placeholder="Tell us more about your experience..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>

                        <button 
                            disabled={rating === 0}
                            type="submit"
                            className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 tracking-widest uppercase text-sm select-none ${
                                rating > 0 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.98]' 
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            Submit Feedback
                        </button>
                    </form>
                </div>

                <div className="mt-8 flex justify-center gap-6">
                    <button className="text-slate-400 hover:text-slate-600 font-bold text-sm flex items-center gap-2 transition">
                        <Share2 className="w-4 h-4" />
                        Share App
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
