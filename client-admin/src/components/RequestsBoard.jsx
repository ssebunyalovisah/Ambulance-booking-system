import { useState } from 'react';
import { Clock, MapPin, Phone, User, Ambulance, X, Check, ChevronDown } from 'lucide-react';

const formatRequestTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    return Number.isNaN(date.valueOf())
      ? 'Just now'
      : date.toLocaleString([], { hour: '2-digit', minute: '2-digit' });
};

export default function RequestsBoard({ requests, onAccept, onReject, availableAmbulances = [], readOnly = false }) {
    const [dispatchingId, setDispatchingId] = useState(null);
    const [selectedAmbulance, setSelectedAmbulance] = useState({});

    const handleDispatchClick = (reqId) => {
        setDispatchingId(reqId);
        // Default to first available ambulance
        if (availableAmbulances.length > 0 && !selectedAmbulance[reqId]) {
            setSelectedAmbulance(prev => ({ ...prev, [reqId]: availableAmbulances[0].id }));
        }
    };

    const handleConfirmDispatch = (reqId) => {
        const ambulanceId = selectedAmbulance[reqId];
        onAccept(reqId, ambulanceId);
        setDispatchingId(null);
    };

    const handleCancelDispatch = () => {
        setDispatchingId(null);
    };

    if (requests.length === 0) {
        return (
            <div className={`${readOnly ? '' : 'bg-white rounded-2xl shadow-sm border border-slate-200'} p-6 flex flex-col items-center justify-center min-h-[200px]`}>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Ambulance className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No pending requests</p>
                <p className="text-slate-400 text-sm mt-1">Listening for calls...</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-4">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    Live
                </div>
            </div>
        );
    }

    return (
        <div className={`${readOnly ? 'space-y-4' : 'bg-white rounded-2xl shadow-sm border border-slate-200 p-6'}`}>
            {!readOnly && (
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-slate-800">Pending Requests</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        <span className="font-semibold text-orange-600">{requests.length} Active</span>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {requests.map(req => (
                    <div key={req.id} className={`border border-slate-200 rounded-xl p-4 transition-all group ${readOnly ? 'bg-white' : 'hover:border-orange-200 hover:bg-orange-50/30'}`}>
                        {/* Patient Info */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                                    <User className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 leading-tight text-sm">
                                        {req.patient_name || 'Unknown Patient'}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                        <Phone className="w-3 h-3" />
                                        {req.phone_number}
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 px-2 py-1 rounded-md border border-orange-200">
                                {req.status || 'PENDING'}
                            </span>
                        </div>

                        {/* Emergency Description */}
                        {req.emergency_description && (
                            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1 opacity-50">EMERGENCY</p>
                                <p className="text-sm text-red-800 leading-snug font-medium">{req.emergency_description}</p>
                            </div>
                        )}

                        {/* Location */}
                        {req.pickup_address && (
                            <div className="flex items-start gap-2 text-xs text-slate-500 mb-2">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                                <span className="truncate">{req.pickup_address}</span>
                            </div>
                        )}

                        {/* Dispatch Selector - Only if not readOnly */}
                        {!readOnly && (
                            dispatchingId === req.id ? (
                                <div className="space-y-3 pt-2">
                                    {/* ... selector logic ... */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                                            Assign Ambulance Unit
                                        </label>
                                        {availableAmbulances.length === 0 ? (
                                            <p className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                                                ⚠ No available units
                                            </p>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    value={selectedAmbulance[req.id] || ''}
                                                    onChange={(e) => setSelectedAmbulance(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                    className="w-full appearance-none bg-slate-50 border-2 border-slate-200 focus:border-orange-500 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 outline-none pr-8 cursor-pointer"
                                                >
                                                    {availableAmbulances.map(amb => (
                                                        <option key={amb.id} value={amb.id}>
                                                            {amb.ambulance_number} — {amb.driver_name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleCancelDispatch} className="flex-1 py-2 rounded-lg border border-slate-200 font-bold text-slate-500 text-sm">Cancel</button>
                                        <button onClick={() => handleConfirmDispatch(req.id)} className="flex-1 py-2 rounded-lg bg-orange-600 text-white font-bold text-sm">Confirm</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => onReject(req.id)} className="flex-1 py-2 rounded-lg border border-slate-200 font-bold text-slate-500 text-sm hover:bg-red-50">Decline</button>
                                    <button onClick={() => handleDispatchClick(req.id)} className="flex-1 py-2 rounded-lg bg-orange-600 text-white font-bold text-sm">Dispatch</button>
                                </div>
                            )
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                            <Clock className="w-3 h-3" />
                            {formatRequestTime(req.created_at || req.createdAt)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
