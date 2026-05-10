import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socketService from '../services/socket.js';
import { acceptBooking, denyBooking } from '../services/api.js';
import useTripStore from '../store/useTripStore.js';
import { Bell, X, Check, MapPin, User, Clock } from 'lucide-react';

const DriverLayout = ({ children }) => {
    const [currentRequest, setCurrentRequest] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const navigate = useNavigate();
    const location = useLocation();
    const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        
        // If no token and not on login, redirect
        if (!token && location.pathname !== '/') {
            navigate('/');
            return;
        }

        // If we have a token, ensure socket is connected and listening
        if (token) {
            const socket = socketService.connect();
            const companyId = localStorage.getItem('companyId');
            const driverDbId = localStorage.getItem('driverDbId');

            if (companyId) socketService.joinDashboard(companyId);
            if (driverDbId) socketService.joinDriverRoom(driverDbId);

            const handleNewBooking = (data) => {
                const activeTrip = useTripStore.getState().currentTrip;
                if (!activeTrip) {
                    setCurrentRequest(data);
                    setTimeLeft(30);
                }
            };

            // Remove existing listeners before adding new ones to prevent duplicates
            socket.off('new_booking');
            socket.off('booking_status_update');
            
            socketService.onNewBooking(handleNewBooking);
            socketService.onBookingUpdate((data) => {
                if (data.status === 'dispatched' || data.status === 'accepted') {
                    handleNewBooking(data);
                }
            });
        }
    }, [navigate, location.pathname]); // Listen to path changes to ensure we re-verify token/socket status

    useEffect(() => {
        if (currentRequest && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (currentRequest && timeLeft === 0) {
            handleDeny();
        }
    }, [currentRequest, timeLeft]);

    const handleAccept = async () => {
        try {
            await acceptBooking(currentRequest.id);
            socketService.emitAcceptBooking(currentRequest.id);
            setCurrentTrip(currentRequest);
            setCurrentRequest(null);
            navigate('/trip');
        } catch (error) {
            console.error('Accept failed', error);
        }
    };

    const handleDeny = async () => {
        try {
            await denyBooking(currentRequest.id);
            socketService.emitDenyBooking(currentRequest.id);
            setCurrentRequest(null);
        } catch (error) {
            console.error('Deny failed', error);
        }
    };

    return (
        <div className="min-h-screen relative">
            {children}

            {/* Global Request Overlay */}
            {currentRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                        {/* Header */}
                        <div className="bg-orange-600 p-6 flex flex-col items-center text-white">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-3 animate-bounce">
                                <Bell className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">New Emergency!</h2>
                            <div className="mt-2 bg-black/20 px-3 py-1 rounded-full text-xs font-bold">
                                Expires in {timeLeft}s
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Name</p>
                                    <p className="text-lg font-bold text-slate-900">{currentRequest.patient_name}</p>
                                    <p className="text-sm text-slate-500 font-medium leading-tight mt-1">
                                        {currentRequest.emergency_description || 'Immediate assistance required'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Distance
                                    </p>
                                    <p className="text-md font-black text-orange-600">2.4 km</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Est. Time
                                    </p>
                                    <p className="text-md font-black text-blue-600">8 mins</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 pt-0 flex gap-3">
                            <button 
                                onClick={handleDeny}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-5 h-5" /> Deny
                            </button>
                            <button 
                                onClick={handleAccept}
                                className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-orange-600/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check className="w-6 h-6" /> ACCEPT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverLayout;
