import { useState, useEffect } from 'react';
import api from '../services/api';
import { Ambulance, Search, Filter, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';

const AmbulanceManagement = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAmbulance, setNewAmbulance] = useState({ 
    ambulance_number: '', 
    driver_name: '', 
    driver_contact: '',
    lat: 40.7128,
    lng: -74.0060 
  });

  const fetchAmbulances = async () => {
    try {
      const response = await api.get('/admin/ambulances');
      setAmbulances(response.data);
    } catch (error) {
      console.error('Error fetching ambulances', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const handleAddAmbulance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/ambulances', newAmbulance);
      setShowAddModal(false);
      setNewAmbulance({ 
        ambulance_number: '', 
        driver_name: '', 
        driver_contact: '',
        lat: 40.7128,
        lng: -74.0060 
      });
      fetchAmbulances();
    } catch (error) {
      console.error('Error adding ambulance', error);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    try {
      await api.patch(`/admin/ambulances/${id}/status`, { status: newStatus });
      fetchAmbulances();
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  return (
    <div className="p-4 md:p-8 max-h-screen overflow-y-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Fleet Management</h1>
          <p className="text-slate-500 mt-1">Register and manage your ambulance units.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Ambulance className="w-5 h-5" />
          Register New Unit
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search units..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 p-2 px-4 hover:bg-slate-100 rounded-lg text-slate-500 text-sm font-medium border border-slate-100 sm:border-transparent">
                <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
            <div className="px-6 py-12 text-center text-slate-400">Loading fleet data...</div>
        ) : ambulances.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 font-medium">No ambulances registered yet.</div>
        ) : (
            <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Unit Info</th>
                                <th className="px-6 py-4">Driver</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ambulances.map((amb) => (
                                <tr key={amb.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                                                <Ambulance className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800">{amb.ambulance_number}</div>
                                                <div className="text-xs text-slate-500">{amb.driver_contact}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{amb.driver_name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                            amb.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {amb.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => toggleStatus(amb.id, amb.status)}
                                                className={`p-2 rounded-lg transition-colors ${amb.status === 'AVAILABLE' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-500'}`}
                                                title={amb.status === 'AVAILABLE' ? 'Mark Busy' : 'Mark Available'}
                                            >
                                                {amb.status === 'AVAILABLE' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                            </button>
                                            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Edit2 className="w-4 h-4" /></button>
                                            <button className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {ambulances.map((amb) => (
                        <div key={amb.id} className="p-4 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                                        <Ambulance className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{amb.ambulance_number}</h4>
                                        <p className="text-sm font-medium text-slate-500">{amb.driver_name}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                    amb.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {amb.status}
                                </span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-4">
                                <div className="text-xs text-slate-400 font-bold tracking-tight">
                                    {amb.driver_contact}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => toggleStatus(amb.id, amb.status)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                            amb.status === 'AVAILABLE' 
                                            ? 'bg-red-50 text-red-600 border border-red-100 active:bg-red-100' 
                                            : 'bg-green-50 text-green-600 border border-green-100 active:bg-green-100'
                                        }`}
                                    >
                                        {amb.status === 'AVAILABLE' ? 'Mark Busy' : 'Mark Available'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg sm:rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Register New Unit</h2>
            <form onSubmit={handleAddAmbulance} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Plate Number</label>
                <input 
                  type="text" 
                  required
                  value={newAmbulance.ambulance_number}
                  onChange={(e) => setNewAmbulance({...newAmbulance, ambulance_number: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="e.g. UAS 123X"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Driver Name</label>
                <input 
                  type="text" 
                  required
                  value={newAmbulance.driver_name}
                  onChange={(e) => setNewAmbulance({...newAmbulance, driver_name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Driver Contact</label>
                <input 
                  type="text" 
                  required
                  value={newAmbulance.driver_contact}
                  onChange={(e) => setNewAmbulance({...newAmbulance, driver_contact: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="+256 700 000000"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="order-2 sm:order-1 flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="order-1 sm:order-2 flex-2 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  Register Unit
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
