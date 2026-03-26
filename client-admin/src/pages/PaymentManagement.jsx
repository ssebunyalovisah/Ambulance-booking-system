import { useState, useEffect } from 'react';
import api from '../services/api';
import { DollarSign, CreditCard, CheckCircle, Clock, Search, AlertCircle, FileText, XCircle, X } from 'lucide-react';

const PaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [toast, setToast] = useState(null);

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
            fetchPayments();
            showToast('Payment approved');
        } catch (err) {
            showToast('Failed to approve payment', 'error');
        }
    };

    const handleReject = async (id) => {
        try {
            await api.patch(`/payments/${id}/status`, { status: 'REJECTED' });
            fetchPayments();
            showToast('Payment rejected');
        } catch (err) {
            showToast('Failed to reject payment', 'error');
        }
    };

    const filteredPayments = activeTab === 'ALL' 
        ? payments 
        : payments.filter(p => p.status === activeTab);

    return (
        <div className="p-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 ${
                    toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
                }`}>
                    {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                    {toast.message}
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Records</h1>
                    <p className="text-slate-500">Manage booking payments and transaction approvals.</p>
                </div>
                
                <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start md:self-center">
                    {['ALL', 'PENDING', 'APPROVED'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        ${payments.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Approval</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {payments.filter(p => p.status === 'PENDING').length}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Success Rate</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {payments.length ? Math.round((payments.filter(p => p.status === 'APPROVED').length / payments.length) * 100) : 0}%
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search by Transaction ID or Patient Name..." 
                        className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 font-medium"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="px-8 py-5">Transaction ID</th>
                                <th className="px-8 py-5">Patient & Trip</th>
                                <th className="px-8 py-5">Amount</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic-none">
                            {filteredPayments.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 font-mono text-xs text-slate-500">{p.transaction_id || 'TRX-DEFAULT-ID'}</td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-bold text-slate-900">{p.patient_name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase mt-1">To: {p.pickup_address.substring(0, 30)}...</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-black text-slate-900">${p.amount}</span>
                                    </td>
                                    <td className="px-8 py-5 text-xs text-slate-500">
                                        {new Date(p.payment_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${
                                            p.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' : 
                                            p.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                            'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        {p.status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleReject(p.id)}
                                                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all border border-red-100"
                                                >
                                                    Reject
                                                </button>
                                                <button 
                                                    onClick={() => handleApprove(p.id)}
                                                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPayments.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-bold">No transaction records found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentManagement;
