import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDriverBookings } from '../services/api.js';
import { ArrowLeft, Clock, MapPin, User, ChevronRight } from 'lucide-react';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrip, setSelectedTrip] = useState(null);
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
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
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
                        <div 
                            key={trip.id} 
                            onClick={() => setSelectedTrip(trip)}
                            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                        >
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

            {/* Trip Detail Modal */}
            {selectedTrip && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg sm:rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Trip Details</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    ID: {selectedTrip.id.slice(0, 8)}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedTrip(null)}
                                className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 rotate-90" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Patient Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</p>
                                    <p className="text-xl font-bold text-slate-900">{selectedTrip.patient_name || 'Emergency Patient'}</p>
                                    <p className="text-sm text-slate-500 font-medium">{selectedTrip.phone || 'No phone provided'}</p>
                                </div>
                            </div>

                            <div className="h-[1px] bg-slate-100 w-full" />

                            {/* Trip Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date</p>
                                    <p className="text-sm font-bold text-slate-700">{new Date(selectedTrip.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Time</p>
                                    <p className="text-sm font-bold text-slate-700">{new Date(selectedTrip.created_at).toLocaleTimeString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-6 flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                                        <div className="w-[2px] flex-1 bg-slate-100 my-1" />
                                        <div className="w-2 h-2 rounded-full bg-green-500 mb-1" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pickup</p>
                                            <p className="text-sm font-medium text-slate-600">{selectedTrip.pickup_address || 'Patient Location Detected'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                                            <p className="text-sm font-medium text-slate-600 italic">"{selectedTrip.emergency_description || 'No description provided'}"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm border border-green-100">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    Trip Successfully Completed
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-0">
                            <button 
                                onClick={() => setSelectedTrip(null)}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;