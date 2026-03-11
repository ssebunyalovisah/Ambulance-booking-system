import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AdminMap from './components/AdminMap';
import RequestsBoard from './components/RequestsBoard';
import StatCards from './components/StatCards';
import { adminSocket } from './services/socket';

// Mock Data
const MOCK_AMBULANCES = [
  { id: '1', lat: 40.7138, lng: -74.0040, companyName: 'City Rescue Force', plateNumber: 'NY-112', status: 'AVAILABLE' }
];

function DashboardHome() {
  const [requests, setRequests] = useState([]);
  const [ambulances, setAmbulances] = useState(MOCK_AMBULANCES);

  useEffect(() => {
    adminSocket.connect();
    
    adminSocket.onNewBooking((newBooking) => {
        setRequests(prev => [newBooking, ...prev]);
    });

    return () => {
        adminSocket.disconnect();
    };
  }, []);

  const handleAcceptRequest = (id) => {
      setRequests(reqs => reqs.map(r => r.id === id ? { ...r, status: 'ACCEPTED' } : r));
      // In reality, we'd fire an API call to PUT /api/admin/bookings/:id/status
      // The API would then emit `booking_status_update` to the patient's room socket
  };

  const handleRejectRequest = (id) => {
      setRequests(reqs => reqs.filter(r => r.id !== id));
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dispatch Center</h1>
          <p className="text-slate-500 mt-1">Monitor live fleet status and incoming emergency requests.</p>
        </div>
      </div>

      <StatCards stats={{ active: requests.filter(r => r.status === 'ACCEPTED').length, available: ambulances.length, busy: 0 }} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
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
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-8 overflow-y-auto w-full max-h-screen">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
