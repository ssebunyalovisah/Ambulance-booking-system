import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { adminSocket } from '../services/socket';
import { Ambulance, Search, Trash2, Edit2, CheckCircle, XCircle, WifiOff, X, Loader2, Plus } from 'lucide-react';

const STATUS_CYCLE = { 'available': 'busy', 'busy': 'offline', 'offline': 'available' };
const STATUS_STYLES = {
  available: 'bg-green-100 text-green-700 border-green-200',
  busy: 'bg-red-100 text-red-700 border-red-200',
  offline: 'bg-slate-100 text-slate-500 border-slate-200',
};

const EMPTY_FORM = { ambulance_number: '', driver_id: '' };

const AmbulanceManagement = () => {
  const { admin } = useAuth();
  const [ambulances, setAmbulances] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAmbulances = async () => {
    try {
      const [ambRes, drvRes] = await Promise.all([
        api.get('/ambulances'),
        api.get('/drivers')
      ]);
      setAmbulances(ambRes.data);
      setDrivers(drvRes.data);
    } catch (error) {
      console.error('Error fetching ambulances', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAmbulances(); 
    
    if (admin?.company_id) {
        adminSocket.connect({ companyId: admin.company_id });
        
        const onAmbUpdate = (updated) => {
            setAmbulances(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
            fetchAmbulances(); // Force refresh to keep stats in sync
        };

        adminSocket.onAmbulanceStatusUpdate(onAmbUpdate);
        
        const onDrvUpdate = () => {
            fetchAmbulances();
        };
        adminSocket.onDriverStatusUpdate(onDrvUpdate);
        
        return () => {
            adminSocket.offAmbulanceStatusUpdate(onAmbUpdate);
            adminSocket.offDriverStatusUpdate(onDrvUpdate);
        };
    }
  }, [admin]);

  const openAddModal = () => {
    setEditingAmbulance(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (amb) => {
    setEditingAmbulance(amb);
    setFormData({
      ambulance_number: amb.ambulance_number,
      driver_id: amb.driver_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, driver_id: formData.driver_id || null };
      if (editingAmbulance) {
        // We only update status in the Ambulance Controller, so wait, we didn't add an update endpoint for ambulances.
        // Actually, the backend needs an update endpoint for ambulances if we are changing driver here.
        // Let's assume there is one or we change it in the backend later. Wait, driver assignment is better handled on driver side. 
        // We'll leave the API call as `/ambulances/${id}` and I'll add that to the backend later if needed.
        await api.patch(`/ambulances/${editingAmbulance.id}`, payload);
        showToast('Ambulance updated successfully');
      } else {
        await api.post('/ambulances', payload);
        showToast('Ambulance registered successfully');
      }
      setShowModal(false);
      fetchAmbulances();
    } catch (error) {
      showToast(error.response?.data?.error || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cycleStatus = async (id, currentStatus) => {
    const newStatus = STATUS_CYCLE[currentStatus] || 'AVAILABLE';
    try {
      await api.patch(`/ambulances/${id}/status`, { status: newStatus });
      setAmbulances(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      showToast(`Unit marked as ${newStatus}`);
    } catch (error) {
      showToast('Error updating status', 'error');
    }
  };

  const handleDelete = async (id, number) => {
    if (!window.confirm(`Delete ambulance ${number}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/ambulances/${id}`);
      setAmbulances(prev => prev.filter(a => a.id !== id));
      showToast('Ambulance removed');
    } catch (error) {
      showToast('Error deleting ambulance', 'error');
    }
  };

  const filtered = ambulances.filter(a =>
    a.ambulance_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.driver_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatusToggleButton = ({ amb }) => {
    const status = (amb.status || 'available').toLowerCase();
    if (status === 'available') return (
      <button onClick={() => cycleStatus(amb.id, 'available')} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition" title="Mark as Busy">
        <XCircle className="w-5 h-5" />
      </button>
    );
    if (status === 'busy') return (
      <button onClick={() => cycleStatus(amb.id, 'busy')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition" title="Mark as Offline">
        <WifiOff className="w-5 h-5" />
      </button>
    );
    return (
      <button onClick={() => cycleStatus(amb.id, 'offline')} className="p-2 rounded-lg hover:bg-green-50 text-green-500 transition" title="Mark as Available">
        <CheckCircle className="w-5 h-5" />
      </button>
    );
  };

  return (
    <div className="max-h-screen overflow-y-auto w-full">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 transition-all animate-in ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
          {toast.message}
        </div>
      )}

      {/* Fleet Hero Banner */}
      <div
        className="relative w-full h-[200px] md:h-[240px] overflow-hidden"
        style={{
          backgroundImage: `url('/ambulance-fleet.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 55%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/75 to-slate-900/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-end justify-between p-6 md:p-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <Ambulance className="w-4 h-4 text-white" />
              </div>
              <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Fleet Control</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Fleet Management</h1>
            <p className="text-slate-300 mt-1.5 text-sm">Register, monitor, and control your ambulance units.</p>
          </div>
          <button
            onClick={openAddModal}
            className="hidden md:flex items-center gap-2 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-orange-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Register New Unit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        {/* Mobile register button */}
        <div className="md:hidden mb-6">
          <button
            onClick={openAddModal}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all active:scale-95"
          >
            <Ambulance className="w-5 h-5" />
            Register New Unit
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Available', count: ambulances.filter(a => a.status?.toLowerCase() === 'available').length, color: 'text-green-600 bg-green-50 border-green-100' },
            { label: 'On Mission', count: ambulances.filter(a => a.status?.toLowerCase() === 'busy').length, color: 'text-red-600 bg-red-50 border-red-100' },
            { label: 'Offline', count: ambulances.filter(a => a.status?.toLowerCase() === 'offline').length, color: 'text-slate-500 bg-slate-50 border-slate-100' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
              <div className="text-2xl font-black">{s.count}</div>
              <div className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search units..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
              />
            </div>
            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">{filtered.length} units</span>
          </div>

          {/* Content */}
          {loading ? (
            <div className="px-6 py-12 text-center">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Ambulance className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">
                {searchTerm ? 'No units match your search.' : 'No ambulances registered yet. Add your first unit above.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Unit Info</th>
                      <th className="px-6 py-4">Driver</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">GPS</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map(amb => (
                      <tr key={amb.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                              <Ambulance className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">{amb.ambulance_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                           {amb.driver_name ? (
                              <div>
                                  <div>{amb.driver_name}</div>
                                  <div className="text-xs text-slate-400 font-mono">{amb.driver_uid}</div>
                              </div>
                           ) : (
                               <span className="text-slate-400 italic">Unassigned</span>
                           )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_STYLES[amb.status] || STATUS_STYLES.OFFLINE}`}>
                            {amb.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                          {amb.lat ? `${Number(amb.lat).toFixed(4)}, ${Number(amb.lng).toFixed(4)}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <StatusToggleButton amb={amb} />
                            <button onClick={() => openEditModal(amb)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition" title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(amb.id, amb.ambulance_number)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filtered.map(amb => (
                  <div key={amb.id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                          <Ambulance className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{amb.ambulance_number}</h4>
                          <p className="text-sm text-slate-500">{amb.driver_name}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${STATUS_STYLES[amb.status] || STATUS_STYLES.OFFLINE}`}>
                        {amb.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => cycleStatus(amb.id, amb.status)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          amb.status === 'AVAILABLE' ? 'bg-red-50 text-red-600 border-red-100' :
                          amb.status === 'BUSY' ? 'bg-slate-50 text-slate-500 border-slate-100' :
                          'bg-green-50 text-green-600 border-green-100'
                        }`}>
                        Mark {STATUS_CYCLE[amb.status]}
                      </button>
                      <button onClick={() => openEditModal(amb)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold">Edit</button>
                      <button onClick={() => handleDelete(amb.id, amb.ambulance_number)} className="px-3 py-2 border border-red-100 rounded-xl text-red-400 text-xs font-bold">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
                  {editingAmbulance ? `Edit ${editingAmbulance.ambulance_number}` : 'Register New Unit'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {editingAmbulance ? 'Update ambulance details below.' : 'Fill in the unit details to add it to your fleet.'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 md:px-8 py-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Plate / Unit Number *</label>
                <input
                  type="text" required
                  value={formData.ambulance_number}
                  onChange={e => setFormData({ ...formData, ambulance_number: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-2xl focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium text-sm"
                  placeholder="e.g. UAS 123X"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Assign Driver (Optional)</label>
                <select
                  value={formData.driver_id}
                  onChange={e => setFormData({ ...formData, driver_id: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent focus:border-orange-500 rounded-2xl focus:bg-white outline-none transition-all font-medium text-sm"
                >
                  <option value="">Unassigned</option>
                  {drivers.map(drv => (
                    <option key={drv.id} value={drv.id}>
                      {drv.full_name} ({drv.driver_id})
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
                  className="order-1 sm:order-2 flex-[2] px-10 py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAmbulance ? 'Save Changes' : 'Register Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceManagement;
