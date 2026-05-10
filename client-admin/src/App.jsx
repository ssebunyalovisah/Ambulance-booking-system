import { useState } from 'react';
import { Ambulance } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AmbulanceManagement from './pages/AmbulanceManagement';
import DriverManagement from './pages/DriverManagement';
import BookingRequests from './pages/BookingRequests';
import LiveTracking from './pages/LiveTracking';
import PaymentManagement from './pages/PaymentManagement';
import FeedbackManagement from './pages/FeedbackManagement';
import Reports from './pages/Reports';
import CompanyManagement from './pages/CompanyManagement';
import PatientRecords from './pages/PatientRecords';
import { AuthProvider } from './context/AuthContext';

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-1.5 rounded-lg text-white">
              <Ambulance className="w-5 h-5" />
            </div>
            <span className="font-bold text-white tracking-tight italic">RescueAdmin</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-800 rounded-xl text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </header>

        <main className="flex-1 h-screen overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
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

          <Route path="/drivers" element={
            <ProtectedRoute>
              <Layout>
                <DriverManagement />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/requests" element={
            <ProtectedRoute>
              <Layout>
                <BookingRequests />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/tracking" element={
            <ProtectedRoute>
              <Layout>
                <LiveTracking />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute>
              <Layout>
                <PaymentManagement />
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

          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/companies" element={
            <ProtectedRoute>
              <Layout>
                <CompanyManagement />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/patients" element={
            <ProtectedRoute>
              <Layout>
                <PatientRecords />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
