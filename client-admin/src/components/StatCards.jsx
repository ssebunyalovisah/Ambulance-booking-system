import { Activity, ShieldAlert, CheckCircle2, Ambulance, Bell } from 'lucide-react';

export default function StatCards({ stats }) {
    const cards = [
        {
            title: 'Active Emergencies',
            value: stats?.active || 0,
            icon: ShieldAlert,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            pill: stats?.active > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700',
            label: stats?.active > 0 ? '⚠ Requires attention' : '✓ All clear',
            pulse: stats?.active > 0,
        },
        {
            title: 'Available Units',
            value: stats?.available || 0,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            pill: 'bg-emerald-100 text-emerald-700',
            label: 'Ready to dispatch',
            pulse: false,
        },
        {
            title: 'On Mission',
            value: stats?.busy || 0,
            icon: Ambulance,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            pill: 'bg-orange-100 text-orange-700',
            label: 'Currently responding',
            pulse: false,
        },
        ...(stats?.pending !== undefined ? [{
            title: 'Pending Requests',
            value: stats?.pending || 0,
            icon: Bell,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            pill: stats?.pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500',
            label: stats?.pending > 0 ? 'Awaiting dispatch' : 'No pending',
            pulse: stats?.pending > 0,
        }] : []),
    ];

    return (
        <div className={`grid gap-5 ${cards.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div
                        key={idx}
                        className={`bg-white rounded-3xl border ${card.border} shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-0.5 duration-200`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.bg} relative`}>
                            <Icon className={`w-6 h-6 ${card.color}`} />
                            {card.pulse && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{card.title}</p>
                            <h3 className={`text-3xl font-black text-slate-800 mt-0.5 stat-number leading-none ${card.color}`}>{card.value}</h3>
                            <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${card.pill}`}>
                                {card.label}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
