import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket.js';
import { acceptBooking, denyBooking } from '../services/api.js';
import useTripStore from '../store/useTripStore.js';

const RequestScreen = () => {
    const [currentRequest, setCurrentRequest] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const navigate = useNavigate();
    const setCurrentTrip = useTripStore((state) => state.setCurrentTrip);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/');
            return;
        }
        const socket = socketService.connect();
        socketService.onNewBooking((data) => {
            // In a real app, check if this booking is assigned to THIS driver
            // For now, show any incoming booking
            setCurrentRequest(data);
            setTimeLeft(30);
        });

        return () => {
            // Keep socket alive
        };
    }, []);

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

    if (!currentRequest) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
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
        );
    }

    return (
        <div className="min-h-screen bg-orange-600 flex flex-col p-6 text-white animate-in fade-in duration-500">
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 animate-bounce">
                    <span className="text-5xl">🚑</span>
                </div>
                
                <h2 className="text-4xl font-black mb-2 text-center uppercase tracking-tighter">New Emergency!</h2>
                <div className="bg-white/10 px-4 py-1 rounded-full text-sm font-bold mb-12">
                   Expires in {timeLeft}s
                </div>

                <div className="w-full bg-white text-slate-900 p-6 rounded-3xl shadow-2xl space-y-4">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Name</p>
                        <p className="text-xl font-bold">{currentRequest.patient_name}</p>
                    </div>
                    
                    <div className="h-[1px] bg-slate-100" />
                    
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Description</p>
                        <p className="text-sm font-medium text-slate-600">{currentRequest.emergency_description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="bg-orange-50 px-3 py-2 rounded-xl">
                            <p className="text-[10px] font-black text-orange-400 uppercase">Distance</p>
                            <p className="text-sm font-bold text-orange-600">2.4 km</p>
                        </div>
                        <div className="bg-blue-50 px-3 py-2 rounded-xl">
                            <p className="text-[10px] font-black text-blue-400 uppercase">Est. Time</p>
                            <p className="text-sm font-bold text-blue-600">8 mins</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                <button 
                    onClick={handleDeny} 
                    className="flex-1 py-5 bg-white/20 hover:bg-white/30 rounded-2xl font-black text-lg transition-colors border-2 border-white/10"
                >
                    DENY
                </button>
                <button 
                    onClick={handleAccept} 
                    className="flex-[2] py-5 bg-white text-orange-600 hover:bg-slate-50 rounded-2xl font-black text-lg shadow-xl transition-transform active:scale-95"
                >
                    ACCEPT TRIP
                </button>
            </div>
        </div>
    );
};

export default RequestScreen;