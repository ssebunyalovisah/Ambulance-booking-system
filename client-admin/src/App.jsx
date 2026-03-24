import { useState, useEffect } from 'react';
import { Ambulance } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AdminMap from './components/AdminMap';
import RequestsBoard from './components/RequestsBoard';
import StatCards from './components/StatCards';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AmbulanceManagement from './pages/AmbulanceManagement';
import FeedbackManagement from './pages/FeedbackManagement';
import { adminSocket } from './services/socket';
import { useAuth } from './context/AuthContext';
import api from './services/api';

// Mock Data
const MOCK_AMBULANCES = [
  { id: '1', lat: 40.7138, lng: -74.0040, companyName: 'City Rescue Force', plateNumber: 'NY-112', status: 'AVAILABLE' }
];

function DashboardHome() {
  const [requests, setRequests] = useState([]);
  const [ambulances, setAmbulances] = useState([]);

  useEffect(() => {
    // Fetch initial data
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

  const handleAcceptRequest = async (id) => {
      try {
          // In a real flow, we might first assign an ambulance. For now, just mark as accepted.
          await api.patch(`/admin/bookings/${id}/status`, { status: 'ACCEPTED' });
          // Socket will handle the UI update
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
          <h1 className="text-3xl font-bold text-slate-800">Dispatch Center</h1>
          <p className="text-slate-500 mt-1">Monitor live fleet status and incoming emergency requests.</p>
        </div>
      </div>

      <StatCards stats={{ active: requests.filter(r => r.status === 'ACCEPTED').length, available: ambulances.length, busy: 0 }} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 min-h-0 xl:h-[calc(100vh-320px)] mt-8">
        <div className="xl:col-span-2 flex flex-col">
          <AdminMap ambulances={ambulances} activeRequests={requests} />
        </div>
        <div className="flex flex-col overflow-y-auto">
          <RequestsBoard 
            requests={requests} 
            onAccept={handleAcceptRequest} 
            onReject={handleRejectRequest} 
          />
        </div>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-1.5 rounded-lg text-white">
              <Ambulance className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">RescueAdmin</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-100 rounded-xl text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <DashboardHome />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/ambulances" element={
          <ProtectedRoute>
            <Layout>
              <AmbulanceManagement />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/feedback" element={
          <ProtectedRoute>
            <Layout>
              <FeedbackManagement />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
