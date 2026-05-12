import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Users, 
    Trash2, 
    Shield, 
    Building2, 
    ArrowRight,
    Search,
    AlertCircle,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CompanyManagement() {
    const { admin } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const response = await api.get('/companies');
            setCompanies(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to fetch companies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admin?.role?.toLowerCase() === 'super_admin') {
            fetchCompanies();
        }
    }, [admin]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this company? This will permanently remove all its ambulances, admins, and bookings. This action CANNOT be undone.')) {
            return;
        }

        setDeletingId(id);
        setError(null);
        try {
            await api.delete(`/companies/${id}`);
            setSuccess('Company deleted successfully');
            setCompanies(companies.filter(c => c.id !== id));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    if (admin?.role?.toLowerCase() !== 'super_admin') {
        return (
            <div className="p-8 flex items-center justify-center h-[80vh]">
                <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h1>
                    <p className="text-slate-500 font-medium">You need Super Admin privileges to access company management.</p>
                </div>
            </div>
        );
    }

    const filtered = companies.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.contact_email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Registry</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage all registered ambulance companies and their data.</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search companies or emails..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-800 focus:border-orange-500 outline-none transition shadow-sm"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-8 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-sm">{success}</span>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(company => (
                        <div key={company.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Building2 className="w-24 h-24 text-slate-900" />
                            </div>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                                    {company.name[0].toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-black text-slate-900 truncate">{company.name}</h3>
                                    <p className="text-xs text-slate-500 font-bold truncate">{company.contact_email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Status</p>
                                    <span className="text-xs font-black text-green-600">ACTIVE</span>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">ID</p>
                                    <span className="text-xs font-mono font-bold text-slate-600">#{company.id}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <button 
                                    onClick={() => handleDelete(company.id)}
                                    disabled={deletingId === company.id || company.id === admin?.company_id}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                        company.id === admin?.company_id 
                                        ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-50'
                                        : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                                    }`}
                                >
                                    {deletingId === company.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {company.id === admin?.company_id ? 'PROTECTED' : 'TERMINATE'}
                                </button>
                                
                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    Registered: {new Date(company.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-sm">No companies found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
