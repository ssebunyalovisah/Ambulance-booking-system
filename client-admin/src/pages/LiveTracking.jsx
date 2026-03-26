import { useState, useEffect } from 'react';
import { adminSocket } from '../services/socket';
import api from '../services/api';
import AdminMap from '../components/AdminMap';
import { Shield, Radio, Navigation } from 'lucide-react';

const LiveTracking = () => {
    const [ambulances, setAmbulances] = useState([]);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [ambRes, bookRes] = await Promise.all([
                    api.get('/admin/ambulances'),
                    api.get('/admin/bookings')
                ]);
                setAmbulances(ambRes.data);
                setRequests(bookRes.data.filter(r => r.status === 'ACCEPTED' || r.status === 'DISPATCHED'));
            } catch (err) {
                console.error(err);
            }
        };
        fetchInitial();

        adminSocket.connect();
        adminSocket.onAmbulanceLocation((data) => {
            setAmbulances(prev => prev.map(a => a.id === data.ambulanceId ? { ...a, lat: data.lat, lng: data.lng } : a));
        });

        return () => {
            // Socket usually shared, but simple here
        };
    }, []);

    return (
        <div className="h-[calc(100vh-64px)] lg:h-screen flex flex-col relative">
            <div className="absolute top-6 left-6 z-20 flex gap-4 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl pointer-events-auto">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        <h1 className="font-bold text-slate-900 tracking-tight">Live Fleet Monitor</h1>
                    </div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Active Monitoring • {ambulances.length} Units</p>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Missions</span>
                        <span className="text-xl font-black text-orange-500">{requests.length}</span>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-700" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fleet Status</span>
                        <span className="text-sm font-bold text-green-400">OPTIMAL</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <AdminMap 
                    ambulances={ambulances} 
                    activeRequests={requests} 
                    isFullscreen={true}
                />
            </div>
            
            {/* Legend/Footer Overlay */}
            <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 pointer-events-none">
                 <div className="bg-white/80 backdrop-blur-md p-3 rounded-xl border border-slate-200 pointer-events-auto">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                             <div className="w-4 h-4 rounded-md bg-orange-600 flex items-center justify-center text-[10px] text-white">A</div>
                             Ambulance Unit
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                             <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-sm" />
                             Emergency Location
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default LiveTracking;
