import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTripStore from '../store/useTripStore.js';
import { Clock, User } from 'lucide-react';

const RequestScreen = () => {
    const navigate = useNavigate();
    const currentTrip = useTripStore((state) => state.currentTrip);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/');
            return;
        }
        
        // If there's an active trip, go straight to it
        if (currentTrip) {
            navigate('/trip');
        }
    }, [currentTrip, navigate]);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl font-bold">🚑</span>
                    </div>
                    <h1 className="text-white font-bold tracking-tight">Driver Portal</h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/history')} className="text-slate-400 hover:text-white transition-colors">
                        <Clock className="w-6 h-6" />
                    </button>
                    <button onClick={() => navigate('/profile')} className="text-slate-400 hover:text-white transition-colors">
                        <User className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-white">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <div className="w-10 h-10 bg-slate-700 rounded-full" />
                </div>
                <h1 className="text-xl font-bold mb-2">Waiting for Requests...</h1>
                <p className="text-slate-400 text-center max-w-xs">You will be notified immediately when a new emergency is assigned to you.</p>
                <div className="mt-12 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Active & Online</span>
                </div>
            </div>
        </div>
    );
};

export default RequestScreen;