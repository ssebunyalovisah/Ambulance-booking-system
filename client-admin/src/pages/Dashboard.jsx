import { useState, useEffect } from 'react';
import { adminSocket } from '../services/socket';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminMap from '../components/AdminMap';
import RequestsBoard from '../components/RequestsBoard';
import { Ambulance, Bell, Clock, Activity, Check } from 'lucide-react';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex items-center gap-2 text-white/70 text-sm font-mono">
      <Clock className="w-4 h-4" />
      <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      <span className="text-white/40 mx-1">·</span>
      <span className="text-white/50">{time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
    </div>
  );
}

const Dashboard = () => {
  const { admin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  const [socketConnected, setSocketConnected] = useState(true);

  const fetchData = async () => {
    try {
      const [ambRes, bookRes] = await Promise.all([
          api.get('/ambulances'),
          api.get('/bookings')
      ]);
      setAmbulances(ambRes.data);
      setRequests(bookRes.data);
    } catch (err) {
      console.error('Failed to fetch initial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
 
    if (admin?.company_id || admin?.role === 'super_admin' || admin?.role === 'SUPER_ADMIN') {
      adminSocket.connect({ 
        companyId: admin.company_id, 
        isSuper: admin.role === 'super_admin' || admin.role === 'SUPER_ADMIN'
      });
    }

    // Track socket connection state for System Live indicator
    const sock = adminSocket.socket;
    const onConnect    = () => { setSocketConnected(true);  fetchData(); }; // re-fetch on reconnect
    const onDisconnect = () => setSocketConnected(false);
    if (sock) {
        sock.on('connect',    onConnect);
        sock.on('disconnect', onDisconnect);
    }
    
    const onNewBooking = (newBooking) => {
        setRequests(prev => {
            if (prev.some(r => r.id === newBooking.id)) return prev;
            return [newBooking, ...prev];
        });
    };
    adminSocket.onNewBooking(onNewBooking);

    const onLocationUpdate = (data) => {
        setAmbulances(prev => prev.map(a => a.id === data.ambulanceId ? { ...a, lat: data.lat, lng: data.lng } : a));
    };
    adminSocket.onDriverLocation(onLocationUpdate);

    const onStatusUpdate = (updatedBooking) => {
        setRequests(prev => prev.map(r => r.id === updatedBooking.id ? { ...r, ...updatedBooking } : r));
        fetchData();
    };
    adminSocket.onBookingStatusUpdate(onStatusUpdate);

    const onAmbUpdate = (updated) => {
        setAmbulances(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
    };
    adminSocket.onAmbulanceStatusUpdate(onAmbUpdate);

    const onDrvUpdate = (updated) => {
        setAmbulances(prev => prev.map(a => a.driver_id === updated.driver_id ? { ...a, status: updated.status } : a));
        fetchData();
    };
    adminSocket.onDriverStatusUpdate(onDrvUpdate);

    return () => {
        if (sock) {
            sock.off('connect',    onConnect);
            sock.off('disconnect', onDisconnect);
        }
        adminSocket.offNewBooking(onNewBooking);
        adminSocket.offBookingStatusUpdate(onStatusUpdate);
        adminSocket.offAmbulanceStatusUpdate(onAmbUpdate);
        adminSocket.offDriverStatusUpdate(onDrvUpdate);
        adminSocket.offDriverLocation(onLocationUpdate);
    };
  }, [admin]);

  const counts = {
    ready: ambulances.filter(a => a.status?.toLowerCase() === 'available').length,
    active: requests.filter(r => ['accepted', 'dispatched'].includes(r.status?.toLowerCase())).length,
    onMission: requests.filter(r => r.status?.toLowerCase() === 'arrived').length,
    pending: requests.filter(r => r.status?.toLowerCase() === 'pending').length,
  };

  return (
    <div className="w-full overflow-y-auto max-h-screen bg-slate-50">
      {/* HERO BANNER */}
      <div
        className="relative w-full h-[320px] overflow-hidden"
        style={{
          backgroundImage: `url('/ambulance-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-600/40">
                  <Ambulance className="w-7 h-7 text-white" />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-ping'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${socketConnected ? 'text-green-400' : 'text-red-400'}`}>
                            {socketConnected ? 'System Live' : 'Reconnecting…'}
                        </span>
                    </div>
                    <h2 className="text-white/60 text-xs font-bold uppercase tracking-widest mt-0.5">Dispatch Command Center</h2>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-4">
                Monitoring Live<br />
                <span className="text-orange-500">Fleet Operations</span>
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-md opacity-80">
                Watching real-time status changes, driver responses, and emergency coordination across the network.
              </p>
            </div>

            <div className="flex flex-col items-end gap-4">
              <LiveClock />
              <div className="flex gap-3 mt-2">
                {[
                    { label: 'Ready', val: counts.ready, color: 'text-green-400' },
                    { label: 'Active', val: counts.active, color: 'text-orange-400' },
                    { label: 'On Mission', val: counts.onMission, color: 'text-blue-400' },
                    { label: 'Pending', val: counts.pending, color: 'text-red-400' },
                ].map(s => (
                    <div key={s.label} className="bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl text-center min-w-[100px] shadow-2xl">
                        <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-black mt-1">{s.label}</div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN COMMAND INTERFACE */}
      <div className="p-6 md:p-10 -mt-8 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Activity className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider">Live Fleet Map</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{ambulances.length} units tracked globally</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full" /> Available
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                        <div className="w-2 h-2 bg-red-500 rounded-full" /> On Trip
                    </div>
                </div>
              </div>
              <div className="flex-1 relative">
                <AdminMap ambulances={ambulances} activeRequests={requests} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.filter(r => ['accepted', 'dispatched', 'arrived'].includes(r.status?.toLowerCase())).slice(0, 6).map(r => (
                    <div key={r.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                                r.status === 'arrived' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                                {r.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 truncate">{r.patient_name}</h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Ambulance className="w-3 h-3" /> {r.driver_name || 'Unit'} | {r.ambulance_number}
                        </p>
                    </div>
                ))}
                {counts.active + counts.onMission === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3">
                            <Check className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">All Clear • No Active Emergencies</p>
                    </div>
                )}
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="px-6 py-5 border-b border-slate-100 bg-white/50 backdrop-blur-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                            <Bell className="w-4 h-4 text-red-500 animate-pulse" />
                        </div>
                        <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider">Incoming Requests</h2>
                    </div>
                    {counts.pending > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {counts.pending}
                        </span>
                    )}
                </div>
                <div className="p-4 space-y-4 overflow-y-auto max-h-[700px]">
                    <RequestsBoard 
                        requests={requests.filter(r => r.status?.toLowerCase() === 'pending')} 
                        readOnly={true} 
                    />
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
