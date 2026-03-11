import { Activity, Clock, CheckCircle2 } from 'lucide-react';

export default function RequestsBoard({ requests, onAccept, onReject }) {
    
    // Status color mapping
    const getStatusStyle = (status) => {
        switch(status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'ACCEPTED': return 'bg-blue-100 text-blue-800 border-blue-200';
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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Listening for updates...
                </div>
            </div>

            <div className="space-y-4">
                {requests.map(req => (
                    <div key={req.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition group">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{req.patientName}</h3>
                                <p className="text-slate-500 font-medium">{req.phone}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                                {req.status}
                            </span>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mb-4 border border-slate-100">
                            <strong>Emergency:</strong> {req.description}
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
                                    className="py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20 transition"
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
