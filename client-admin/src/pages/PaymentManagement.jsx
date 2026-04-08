import { useState, useEffect } from 'react';
import api from '../services/api';
import { DollarSign, CreditCard, CheckCircle, Clock, Search, AlertCircle, FileText, XCircle, TrendingUp, BadgeCheck } from 'lucide-react';

const TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

const STATUS_STYLES = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const PaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payments');
            setPayments(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.patch(`/payments/${id}/status`, { status: 'APPROVED' });
            setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
            showToast('Payment approved successfully');
        } catch (err) {
            showToast('Failed to approve payment', 'error');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.patch(`/payments/${id}/status`, { status: 'REJECTED' });
            setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p));
            showToast('Payment rejected');
        } catch (err) {
            showToast('Failed to reject payment', 'error');
        }
    };

    const filtered = payments
        .filter(p => activeTab === 'ALL' || p.status === activeTab)
        .filter(p => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                (p.transaction_id || '').toLowerCase().includes(term) ||
                (p.patient_name || '').toLowerCase().includes(term)
            );
        });

    const totalRevenue = payments.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingCount = payments.filter(p => p.status === 'PENDING').length;
    const successRate = payments.length ? Math.round((payments.filter(p => p.status === 'APPROVED').length / payments.length) * 100) : 0;
    const tabCounts = TABS.reduce((acc, t) => {
        acc[t] = t === 'ALL' ? payments.length : payments.filter(p => p.status === t).length;
        return acc;
    }, {});

    return (
        <div className="p-4 md:p-8 max-h-screen overflow-y-auto w-full">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 animate-in ${
                    toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
                }`}>
                    {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Records</h1>
                <p className="text-slate-500 mt-1">Manage booking payments and transaction approvals.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {[
                    {
                        label: 'Total Revenue',
                        value: `$${totalRevenue.toLocaleString()}`,
                        icon: DollarSign,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                        border: 'border-blue-100',
                        sub: `${payments.filter(p => p.status === 'APPROVED').length} approved transactions`,
                    },
                    {
                        label: 'Pending Approval',
                        value: pendingCount,
                        icon: Clock,
                        color: 'text-amber-600',
                        bg: 'bg-amber-50',
                        border: 'border-amber-100',
                        sub: pendingCount > 0 ? 'Requires your review' : 'All up to date',
                    },
                    {
                        label: 'Success Rate',
                        value: `${successRate}%`,
                        icon: TrendingUp,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                        border: 'border-emerald-100',
                        sub: `${payments.filter(p => p.status === 'REJECTED').length} rejected payments`,
                    },
                ].map(card => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className={`bg-white border ${card.border} rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 ${card.bg} ${card.color} rounded-2xl`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">{card.value}</div>
                            <p className="text-xs text-slate-400 font-medium mt-2">{card.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
                    {/* Search */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search by name or transaction ID..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                id={`payment-tab-${tab.toLowerCase()}`}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                                {tabCounts[tab] > 0 && (
                                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                        activeTab === tab ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        {tabCounts[tab]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Patient & Trip</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400">
                                            <CreditCard className="w-8 h-8 animate-pulse" />
                                            <span className="text-sm font-medium">Loading transactions...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <FileText className="w-12 h-12 opacity-40" />
                                            <p className="font-bold text-slate-400">No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} transactions</p>
                                            <p className="text-xs text-slate-400">Transactions will appear here once bookings are completed</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-5 font-mono text-xs text-slate-500">
                                            {p.transaction_id || `TRX-${String(p.id).padStart(6, '0')}`}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-bold text-slate-900">{p.patient_name}</div>
                                            {p.pickup_address && (
                                                <div className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] truncate">
                                                    {p.pickup_address}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-black text-slate-900">${Number(p.amount || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-slate-500">
                                            {p.payment_date ? new Date(p.payment_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${STATUS_STYLES[p.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                {p.status === 'APPROVED' && <BadgeCheck className="w-3 h-3" />}
                                                {p.status === 'PENDING' && <Clock className="w-3 h-3" />}
                                                {p.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            {p.status === 'PENDING' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        id={`reject-payment-${p.id}`}
                                                        onClick={() => handleReject(p.id)}
                                                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all border border-red-100 active:scale-95"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        id={`approve-payment-${p.id}`}
                                                        onClick={() => handleApprove(p.id)}
                                                        className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-1"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                                        Approve
                                                    </button>
                                                </div>
                                            )}
                                            {p.status === 'APPROVED' && (
                                                <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                                                    <BadgeCheck className="w-3.5 h-3.5" /> Confirmed
                                                </span>
                                            )}
                                            {p.status === 'REJECTED' && (
                                                <span className="text-xs text-red-500 font-semibold">Declined</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentManagement;
