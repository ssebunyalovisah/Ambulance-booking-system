import { useState, useEffect } from 'react';
import { adminSocket } from '../services/socket';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminMap from '../components/AdminMap';
import RequestsBoard from '../components/RequestsBoard';
import StatCards from '../components/StatCards';
import { Ambulance, Bell, Clock, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

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

  useEffect(() => {
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
      }
    };
    fetchData();
 
    if (admin?.company_id) {
      adminSocket.connect({ 
        companyId: admin.company_id, 
        isSuper: admin.role === 'super_admin' || admin.role === 'SUPER_ADMIN'
      });
    }
    
    const onNewBooking = (newBooking) => {
        setRequests(prev => [newBooking, ...prev]);
    };
    adminSocket.onNewBooking(onNewBooking);

    const onLocationUpdate = (data) => {
        setAmbulances(prev => prev.map(a => a.id === data.ambulanceId ? { ...a, lat: data.lat, lng: data.lng } : a));
    };
    adminSocket.onDriverLocation(onLocationUpdate);

    const onStatusUpdate = (updatedBooking) => {
        if (updatedBooking.id) {
            setRequests(prev => prev.map(r => r.id === updatedBooking.id ? { ...r, ...updatedBooking } : r));
        }
        fetchData();
    };
    adminSocket.onBookingStatusUpdate(onStatusUpdate);

    const onAmbUpdate = (updated) => {
        setAmbulances(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
    };
    adminSocket.onAmbulanceStatusUpdate(onAmbUpdate);

    const onDrvUpdate = (updated) => {
        fetchData();
    };
    adminSocket.onDriverStatusUpdate(onDrvUpdate);

    return () => {
        adminSocket.offNewBooking(onNewBooking);
        adminSocket.offBookingStatusUpdate(onStatusUpdate);
        adminSocket.offAmbulanceStatusUpdate(onAmbUpdate);
        adminSocket.offDriverStatusUpdate(onDrvUpdate);
        // adminSocket.disconnect(); // Don't disconnect here, keep it for other pages
    };
  }, [admin]);

  const handleAcceptRequest = async (id, ambulanceId) => {
      try {
          await api.patch(`/bookings/${id}/accept`, { ambulance_id: ambulanceId });
      } catch (err) {
          console.error('Error accepting request:', err);
      }
  };

  const handleRejectRequest = async (id) => {
    try {
        await api.patch(`/bookings/${id}/cancel`);
    } catch (err) {
        console.error('Error cancelling request:', err);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const activeCount = requests.filter(r => r.status === 'ACCEPTED' || r.status === 'DISPATCHED').length;
  const availableCount = ambulances.filter(a => a.status === 'AVAILABLE').length;
  const busyCount = ambulances.filter(a => a.status === 'BUSY').length;

  return (
    <div className="w-full overflow-y-auto max-h-screen">
      {/* HERO BANNER */}
      <div
        className="relative w-full h-[280px] md:h-[320px] overflow-hidden"
        style={{
          backgroundImage: `url('/ambulance-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      >
        {/* Multi-layer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Animated pulse ring for emergency feel */}
        {pendingCount > 0 && (
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute inset-0" />
              <div className="w-3 h-3 bg-red-500 rounded-full relative" />
            </div>
            <div className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-600/30">
              <AlertTriangle className="w-4 h-4" />
              {pendingCount} Pending {pendingCount === 1 ? 'Emergency' : 'Emergencies'}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/30">
                  <Ambulance className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs font-bold uppercase tracking-widest">System Live</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Dispatch Command<br />
                <span className="text-orange-400">Center</span>
              </h1>
              <p className="text-slate-300 mt-2 text-sm md:text-base max-w-md">
                Monitor live fleet status, respond to emergencies, and coordinate dispatch operations.
              </p>
            </div>

            {/* Quick stats badges */}
            <div className="hidden md:flex flex-col gap-2 text-right">
              <LiveClock />
              <div className="flex gap-3 justify-end mt-2">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-center min-w-[80px]">
                  <div className="text-2xl font-black text-orange-400">{availableCount}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ready</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-center min-w-[80px]">
                  <div className="text-2xl font-black text-red-400">{activeCount}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Active</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-center min-w-[80px]">
                  <div className="text-2xl font-black text-blue-400">{busyCount}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">On Mission</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-4 md:p-8">
        {/* Mobile clock */}
        <div className="md:hidden mb-4">
          <LiveClock />
        </div>

        <StatCards stats={{ 
            active: activeCount, 
            available: availableCount, 
            busy: busyCount,
            pending: pendingCount,
        }} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8" style={{ minHeight: 'calc(100vh - 520px)' }}>
          <div className="xl:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                Live Fleet Map
              </h2>
              <span className="text-xs text-slate-500 font-medium">{ambulances.length} units tracked</span>
            </div>
            <AdminMap ambulances={ambulances} activeRequests={requests} />
          </div>
          <div className="flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                Incoming Requests
              </h2>
              {pendingCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-black px-2 py-0.5 rounded-full">
                  {pendingCount} new
                </span>
              )}
            </div>
            <RequestsBoard 
              requests={requests.filter(r => r.status === 'PENDING')} 
              onAccept={handleAcceptRequest} 
              onReject={handleRejectRequest}
              availableAmbulances={ambulances.filter(a => a.status === 'AVAILABLE')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
