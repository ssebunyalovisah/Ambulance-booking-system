import { Activity, Clock, CheckCircle2 } from 'lucide-react';

export default function RequestsBoard({ requests, onAccept, onReject }) {
    
    // Status color mapping
    const getStatusStyle = (status) => {
        switch(status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'ACCEPTED': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 font-inter">Live Emergency Requests</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    Listening for updates...
                </div>
            </div>

            <div className="space-y-4">
                {requests.map(req => (
                    <div key={req.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{req.patientName}</h3>
                                <p className="text-slate-500 font-medium text-sm">{req.phone}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold border border-green-200">PAID</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.paymentMethod === 'momo' ? 'Mobile Money' : 'Card'}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                                {req.status}
                            </span>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mb-4 border border-slate-100 space-y-2">
                            <div><strong>Emergency:</strong> {req.description}</div>
                            {req.address && (
                                <div className="pt-2 border-t border-slate-200/60 font-medium text-slate-600">
                                    <strong>Pickup Location:</strong> {req.address}
                                </div>
                            )}
                        </div>

                        {req.status === 'PENDING' ? (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button 
                                    onClick={() => onReject(req.id)}
                                    className="py-2.5 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Decline
                                </button>
                                <button 
                                    onClick={() => onAccept(req.id)}
                                    className="py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md shadow-orange-600/20 transition"
                                >
                                    Dispatch Unit
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-end mt-2">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Dispatched to Unit NY-112
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
