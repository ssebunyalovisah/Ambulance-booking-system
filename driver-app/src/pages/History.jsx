import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDriverBookings } from '../services/api.js';
import { ArrowLeft, Clock, MapPin, User, ChevronRight } from 'lucide-react';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const bookings = await getDriverBookings();
                // Normalize status to lowercase for filtering
                setHistory(bookings.filter(b => b.status?.toLowerCase() === 'completed'));
            } catch (error) {
                console.error('Fetch history failed', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 py-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-10">
                <button 
                    onClick={() => navigate('/requests')}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Trip History</h1>
            </div>

            <div className="flex-1 p-6 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading History...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold">No completed trips</h3>
                        <p className="text-slate-500 text-sm mt-1 max-w-[200px]">Your finished trips will appear here.</p>
                    </div>
                ) : (
                    history.map((trip) => (
                        <div key={trip.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-900">{trip.patient_name || 'Patient'}</h4>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(trip.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <User className="w-3 h-3 text-slate-400" />
                                    <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                                        {trip.pickup_address || 'Trip Completed Successfully'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default History;