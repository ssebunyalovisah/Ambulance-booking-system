import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, User, Phone, Clock, ChevronDown, ChevronUp, Activity, Star, CreditCard, Ambulance } from 'lucide-react';

const STATUS_COLORS = {
  pending:    'bg-orange-100 text-orange-700 border-orange-200',
  accepted:   'bg-blue-100 text-blue-700 border-blue-200',
  dispatched: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  arrived:    'bg-cyan-100 text-cyan-700 border-cyan-200',
  completed:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-red-100 text-red-700 border-red-200',
  denied:     'bg-slate-100 text-slate-600 border-slate-200',
  timed_out:  'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const PAYMENT_COLORS = {
  unpaid:    'bg-red-50 text-red-600',
  paid:      'bg-green-50 text-green-600',
  confirmed: 'bg-emerald-50 text-emerald-700',
};

function PatientCard({ patient }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Patient header row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-black text-lg">
            {patient.patient_name?.[0]?.toUpperCase() || 'P'}
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-900">{patient.patient_name}</p>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" /> {patient.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Bookings</span>
            <span className="text-xl font-black text-orange-600">{patient.booking_count}</span>
          </div>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {/* Expanded booking history */}
      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {patient.bookings.map((b) => (
            <div key={b.id} className="p-5 hover:bg-slate-50/40 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLORS[b.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {b.status}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PAYMENT_COLORS[b.payment_status] || 'bg-slate-50 text-slate-500'}`}>
                    {b.payment_status || 'unpaid'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <Clock className="w-3 h-3" />
                  {new Date(b.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              <p className="text-sm text-slate-700 font-medium mb-3 leading-snug">{b.emergency_description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Company / Driver / Unit — no generic labels per spec */}
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Ambulance className="w-3 h-3" /> Company
                  </p>
                  <p className="text-sm font-bold text-slate-800">{b.company_name || '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Driver
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {b.driver_name ? `${b.driver_name} (${b.driver_uid})` : '—'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Payment
                  </p>
                  <p className="text-sm font-bold text-slate-800 capitalize">{b.payment_method || '—'}</p>
                </div>
              </div>

              {/* Rating if exists */}
              {b.rating && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= b.rating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-200 fill-slate-200'}`} />
                    ))}
                  </div>
                  {b.feedback && <span className="text-slate-500 text-xs italic">"{b.feedback}"</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Fetch all bookings and group client-side by patient phone
        const res = await api.get('/bookings');
        const bookings = res.data;

        // Group by phone number — each unique phone = one patient record
        const map = {};
        bookings.forEach((b) => {
          const key = b.phone;
          if (!map[key]) {
            map[key] = {
              patient_name: b.patient_name,
              phone: b.phone,
              booking_count: 0,
              bookings: [],
            };
          }
          map[key].booking_count++;
          map[key].bookings.push(b);
          // Keep the most recent name in case of discrepancy
          if (new Date(b.created_at) > new Date(map[key].bookings[0]?.created_at || 0)) {
            map[key].patient_name = b.patient_name;
          }
        });

        // Sort by most recent booking
        const list = Object.values(map).sort((a, b) => {
          const aDate = new Date(a.bookings[0]?.created_at || 0);
          const bDate = new Date(b.bookings[0]?.created_at || 0);
          return bDate - aDate;
        });

        setPatients(list);
      } catch (err) {
        console.error('Failed to fetch patient records', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && p.bookings.some((b) => b.status === statusFilter.toLowerCase());
  });

  return (
    <div className="p-4 md:p-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Patient Records</h1>
        <p className="text-slate-500 font-medium mt-1">Emergency history for every patient in the system.</p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-orange-400 transition shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-orange-400 transition shadow-sm"
        >
          {['ALL','PENDING','ACCEPTED','COMPLETED','CANCELLED','DENIED','TIMED_OUT'].map(s => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
          ))}
        </select>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Patients', value: patients.length, icon: User },
          { label: 'Total Bookings', value: patients.reduce((s, p) => s + p.booking_count, 0), icon: Activity },
          { label: 'Showing', value: filtered.length, icon: Search },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-black text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Patient list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
          <p className="font-bold text-sm uppercase tracking-widest">Loading Records…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <User className="w-12 h-12 mb-4 opacity-30" />
          <p className="font-bold">No patients found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PatientCard key={p.phone} patient={p} />
          ))}
        </div>
      )}
    </div>
  );
}
