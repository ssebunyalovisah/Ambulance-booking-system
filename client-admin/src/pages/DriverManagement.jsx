import { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Search, Trash2, Edit2, Loader2, Plus, Phone, Truck, CheckCircle, XCircle } from 'lucide-react';

const STATUS_STYLES = {
  AVAILABLE: 'bg-green-100 text-green-700 border-green-200',
  ON_TRIP: 'bg-blue-100 text-blue-700 border-blue-200',
  OFFLINE: 'bg-slate-100 text-slate-500 border-slate-200',
};

const EMPTY_FORM = { full_name: '', phone: '', ambulance_id: '' };

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [driversRes, ambRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/ambulances')
      ]);
      setDrivers(driversRes.data);
      setAmbulances(ambRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAddModal = () => {
    setEditingDriver(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      full_name: driver.full_name,
      phone: driver.phone,
      ambulance_id: driver.ambulance_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...formData, ambulance_id: formData.ambulance_id || null };
    try {
      if (editingDriver) {
        await api.patch(`/drivers/${editingDriver.id}`, payload);
        showToast('Driver updated successfully');
      } else {
        await api.post('/drivers', payload);
        showToast('Driver registered successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.error || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = drivers.filter(d =>
    d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.driver_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-h-screen overflow-y-auto w-full">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 transition-all animate-in ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
          {toast.message}
        </div>
      )}

      {/* Hero Banner */}
      <div
        className="relative w-full h-[200px] md:h-[240px] overflow-hidden"
        style={{
          backgroundImage: `url('/driver-bg.jpg')`, // You might want to add a nice driver-related image in public/
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#0f172a'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/75 to-slate-900/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-end justify-between p-6 md:p-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Team Management</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Driver Personnel</h1>
            <p className="text-slate-300 mt-1.5 text-sm">Manage your registered drivers and their assignments.</p>
          </div>
          <button
            onClick={openAddModal}
            className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Register Driver
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="md:hidden mb-6">
          <button
            onClick={openAddModal}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <User className="w-5 h-5" />
            Register Driver
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Available', count: drivers.filter(d => d.status === 'available').length, color: 'text-green-600 bg-green-50 border-green-100' },
            { label: 'On Trip', count: drivers.filter(d => d.status === 'on_trip').length, color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: 'Offline', count: drivers.filter(d => d.status === 'offline').length, color: 'text-slate-500 bg-slate-50 border-slate-100' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
              <div className="text-2xl font-black">{s.count}</div>
              <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">{filtered.length} drivers</span>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">
                {searchTerm ? 'No drivers match your search.' : 'No drivers registered yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Driver Profile</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Assignment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(driver => (
                    <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black">
                            {driver.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{driver.full_name}</div>
                            <div className="text-xs text-slate-500 font-mono">{driver.driver_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {driver.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {driver.ambulance_number ? (
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
                            <Truck className="w-4 h-4" />
                            {driver.ambulance_number}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_STYLES[driver.status?.toUpperCase()] || STATUS_STYLES.OFFLINE}`}>
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openEditModal(driver)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingDriver ? `Edit ${editingDriver.full_name}` : 'Register Driver'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {editingDriver ? 'Update driver details.' : 'Add a new driver to your team.'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 md:px-8 py-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Full Name *</label>
                <input
                  type="text" required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium text-sm"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Phone Number *</label>
                <input
                  type="text" required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium text-sm"
                  placeholder="+256 700 000000"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Assign Ambulance (Optional)</label>
                <select
                  value={formData.ambulance_id}
                  onChange={e => setFormData({ ...formData, ambulance_id: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:bg-white outline-none transition-all font-medium text-sm"
                >
                  <option value="">Unassigned</option>
                  {ambulances.map(amb => (
                    <option key={amb.id} value={amb.id}>
                      {amb.ambulance_number} {amb.driver_name && amb.id !== editingDriver?.ambulance_id ? `(Currently with ${amb.driver_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="order-2 sm:order-1 flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="order-1 sm:order-2 flex-[2] px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingDriver ? 'Save Changes' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
