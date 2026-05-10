import { useState, useEffect, Fragment } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Phone, MapPin, Activity, AlertCircle, Ambulance, ChevronDown, X, Check, XCircle } from 'lucide-react';
import { adminSocket } from '../services/socket';
import LocationModal from '../components/LocationModal';

const STATUS_TABS = ['ALL', 'PENDING', 'ACCEPTED', 'DISPATCHED', 'ARRIVED', 'COMPLETED', 'CANCELLED'];

const STATUS_COLORS = {
  PENDING: 'bg-orange-100 text-orange-600 border-orange-200',
  ACCEPTED: 'bg-blue-100 text-blue-600 border-blue-200',
  DISPATCHED: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  ARRIVED: 'bg-cyan-100 text-cyan-600 border-cyan-200',
  COMPLETED: 'bg-green-100 text-green-600 border-green-200',
  CANCELLED: 'bg-red-100 text-red-600 border-red-200',
};

const BookingRequests = () => {
  const { admin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [availableAmbulances, setAvailableAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [dispatchingId, setDispatchingId] = useState(null);
  const [selectedAmbulance, setSelectedAmbulance] = useState({});
  const [toast, setToast] = useState(null);
  const [showMap, setShowMap] = useState(null); // {lat, lng, address}

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (admin?.company_id || admin?.role === 'super_admin' || admin?.role === 'SUPER_ADMIN') {
      adminSocket.connect({ 
        companyId: admin.company_id, 
        isSuper: admin.role === 'super_admin' || admin.role === 'SUPER_ADMIN'
      });
    }
    
    const fetchData = async () => {
      try {
        const [bookRes, ambRes] = await Promise.all([
          api.get('/bookings'),
          api.get('/ambulances'),
        ]);
        setBookings(bookRes.data);
        setAvailableAmbulances(ambRes.data.filter(a => a.status.toLowerCase() === 'available'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    adminSocket.onNewBooking((newBooking) => {
      setBookings(prev => [newBooking, ...prev]);
    });

    const updateBookingStatus = (updated) => {
      setBookings(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
      // Re-fetch ambulances to update available list
      fetchAmbulances();
    };

    adminSocket.onBookingStatusUpdate(updateBookingStatus);
  }, [admin]);

  const fetchAmbulances = async () => {
    try {
      const ambRes = await api.get('/ambulances');
      setAvailableAmbulances(ambRes.data.filter(a => a.status.toLowerCase() === 'available'));
    } catch (err) {
      console.error('Error fetching ambulances', err);
    }
  };

  const updateStatus = async (id, status, ambulance_id = null) => {
    try {
      await api.patch(`/bookings/${id}/${status.toLowerCase()}`, { ambulance_id, driver_id: availableAmbulances.find(a => a.id === ambulance_id)?.driver_id });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status.toLowerCase(), ambulance_id: ambulance_id || b.ambulance_id } : b));
      setDispatchingId(null);
      showToast(`Booking ${status.toLowerCase()}`);
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleDispatch = (id) => {
    if (availableAmbulances.length > 0 && !selectedAmbulance[id]) {
      setSelectedAmbulance(prev => ({ ...prev, [id]: availableAmbulances[0].id }));
    }
    setDispatchingId(id);
  };

  const filtered = activeTab === 'ALL' 
    ? bookings 
    : bookings.filter(b => b.status?.toUpperCase() === activeTab);

  const counts = {
    ALL: bookings.length,
    PENDING: bookings.filter(b => b.status?.toUpperCase() === 'PENDING').length,
    ACCEPTED: bookings.filter(b => b.status?.toUpperCase() === 'ACCEPTED').length,
    DISPATCHED: bookings.filter(b => b.status?.toUpperCase() === 'DISPATCHED').length,
    ARRIVED: bookings.filter(b => b.status?.toUpperCase() === 'ARRIVED').length,
    COMPLETED: bookings.filter(b => b.status?.toUpperCase() === 'COMPLETED').length,
    CANCELLED: bookings.filter(b => b.status?.toUpperCase() === 'CANCELLED').length,
  };

  return (
    <div className="p-4 md:p-8 overflow-y-auto w-full max-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <Check className="w-4 h-4 text-green-400" />}
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Emergency Requests</h1>
        <p className="text-slate-500 mt-1">Manage and dispatch all emergency booking requests.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', count: counts.PENDING, color: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'Active', count: counts.ACCEPTED + counts.DISPATCHED + counts.ARRIVED, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Completed', count: counts.COMPLETED, color: 'text-green-600 bg-green-50 border-green-100' },
          { label: 'Total', count: counts.ALL, color: 'text-slate-600 bg-slate-50 border-slate-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <div className="text-2xl font-black">{s.count}</div>
            <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl mb-6 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
            {counts[tab] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === tab ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'
              }`}>
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Activity className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Emergency</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(booking => (
                  <Fragment key={booking.id}>
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{booking.patient_name}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {booking.phone_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-slate-700 line-clamp-2">
                          {booking.emergency_description || 'No description provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-slate-600 flex items-start gap-2 group">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400 group-hover:text-orange-500 transition-colors" />
                        <div className="flex flex-col">
                            <span className="line-clamp-1">{booking.pickup_address}</span>
                            <button 
                                onClick={() => setShowMap({ lat: booking.patient_lat || booking.lat, lng: booking.patient_lng || booking.lng, address: booking.pickup_address })}
                                className="text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider text-left transition-colors"
                            >
                                View on Map
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[booking.status?.toUpperCase()] || 'bg-slate-100 text-slate-600'}`}>
                          {booking.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] uppercase mt-0.5">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {booking.status?.toUpperCase() === 'PENDING' && (
                            <>
                              <button
                                onClick={() => updateStatus(booking.id, 'CANCEL')}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition" title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDispatch(booking.id)}
                                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                              >
                                <Ambulance className="w-3.5 h-3.5" /> Dispatch
                              </button>
                            </>
                          )}
                          {booking.status?.toUpperCase() === 'ACCEPTED' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'DISPATCH')}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
                            >
                              Mark Dispatched
                            </button>
                          )}
                          {booking.status?.toUpperCase() === 'DISPATCHED' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'ARRIVE')}
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg transition"
                            >
                              Mark Arrived
                            </button>
                          )}
                          {booking.status?.toUpperCase() === 'ARRIVED' && (
                            <button
                              onClick={() => updateStatus(booking.id, 'COMPLETE')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Inline Dispatch Row */}
                    {dispatchingId === booking.id && (
                      <tr key={`dispatch-${booking.id}`} className="bg-orange-50 border-b border-orange-100">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex-1">
                              <label className="text-xs font-bold text-orange-700 uppercase tracking-wider block mb-1.5">
                                Select Ambulance for Dispatch
                              </label>
                              {availableAmbulances.length === 0 ? (
                                <p className="text-xs text-red-600 font-medium">⚠ No available ambulances. Please mark a unit as available first.</p>
                              ) : (
                                <div className="relative max-w-xs">
                                  <select
                                    value={selectedAmbulance[booking.id] || ''}
                                    onChange={e => setSelectedAmbulance(prev => ({ ...prev, [booking.id]: e.target.value }))}
                                    className="w-full appearance-none bg-white border-2 border-orange-300 focus:border-orange-500 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none pr-8 cursor-pointer"
                                  >
                                    {availableAmbulances.map(amb => (
                                      <option key={amb.id} value={amb.id}>
                                        🚑 {amb.company_name} | Driver: {amb.driver_name} | ID: {amb.driver_uid} | Unit: {amb.ambulance_number}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 pointer-events-none" />
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 self-end">
                              <button
                                onClick={() => setDispatchingId(null)}
                                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-white transition"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={availableAmbulances.length === 0}
                                onClick={() => updateStatus(booking.id, 'ACCEPT', selectedAmbulance[booking.id])}
                                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" /> Confirm
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="p-20 text-center">
              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} requests found.</p>
            </div>
          )}
        </div>
      )}

      {showMap && (
        <LocationModal 
            lat={showMap.lat} 
            lng={showMap.lng} 
            address={showMap.address} 
            onClose={() => setShowMap(null)} 
        />
      )}
    </div>
  );
};

export default BookingRequests;
