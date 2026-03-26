import { useState, useEffect } from 'react';
import { adminSocket } from '../services/socket';
import api from '../services/api';
import AdminMap from '../components/AdminMap';
import RequestsBoard from '../components/RequestsBoard';
import StatCards from '../components/StatCards';

const Dashboard = () => {
  const [requests, setRequests] = useState([]);
  const [ambulances, setAmbulances] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ambRes, bookRes] = await Promise.all([
            api.get('/admin/ambulances'),
            api.get('/admin/bookings')
        ]);
        setAmbulances(ambRes.data);
        setRequests(bookRes.data);
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      }
    };
    fetchData();

    adminSocket.connect();
    
    adminSocket.onNewBooking((newBooking) => {
        setRequests(prev => [newBooking, ...prev]);
    });

    adminSocket.onAmbulanceLocation((data) => {
        setAmbulances(prev => prev.map(a => a.id === data.ambulanceId ? { ...a, lat: data.lat, lng: data.lng } : a));
    });

    adminSocket.onBookingStatusUpdate((updatedBooking) => {
        setRequests(prev => prev.map(r => r.id === updatedBooking.id ? updatedBooking : r));
    });

    return () => {
        adminSocket.disconnect();
    };
  }, []);

  const handleAcceptRequest = async (id, ambulanceId) => {
      try {
          await api.patch(`/admin/bookings/${id}/status`, { status: 'ACCEPTED', ambulance_id: ambulanceId });
      } catch (err) {
          console.error('Error accepting request:', err);
      }
  };

  const handleRejectRequest = async (id) => {
    try {
        await api.patch(`/admin/bookings/${id}/status`, { status: 'CANCELLED' });
    } catch (err) {
        console.error('Error cancelling request:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 overflow-y-auto w-full max-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dispatch Center</h1>
          <p className="text-slate-500 mt-1">Monitor live fleet status and incoming emergency requests.</p>
        </div>
      </div>

      <StatCards stats={{ 
          active: requests.filter(r => r.status === 'ACCEPTED' || r.status === 'DISPATCHED').length, 
          available: ambulances.filter(a => a.status === 'AVAILABLE').length, 
          busy: ambulances.filter(a => a.status === 'BUSY').length 
      }} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 min-h-0 xl:h-[calc(100vh-320px)] mt-8">
        <div className="xl:col-span-2 flex flex-col">
          <AdminMap ambulances={ambulances} activeRequests={requests} />
        </div>
        <div className="flex flex-col overflow-y-auto">
          <RequestsBoard 
            requests={requests.filter(r => r.status === 'PENDING')} 
            onAccept={handleAcceptRequest} 
            onReject={handleRejectRequest}
            availableAmbulances={ambulances.filter(a => a.status === 'AVAILABLE')}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
