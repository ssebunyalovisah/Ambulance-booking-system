import { Activity, ShieldAlert, CheckCircle2, Ambulance } from 'lucide-react';

export default function StatCards({ stats }) {
    const cards = [
        {
            title: 'Active Emergencies',
            value: stats?.active || 0,
            icon: ShieldAlert,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            pill: 'bg-red-100 text-red-600',
            label: stats?.active > 0 ? 'Requires attention' : 'All clear',
        },
        {
            title: 'Available Units',
            value: stats?.available || 0,
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
            pill: 'bg-green-100 text-green-600',
            label: 'Ready to dispatch',
        },
        {
            title: 'On Mission',
            value: stats?.busy || 0,
            icon: Ambulance,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            pill: 'bg-orange-100 text-orange-600',
            label: 'Currently responding',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div
                        key={idx}
                        className={`bg-white rounded-3xl border ${card.border} shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition-shadow`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${card.bg}`}>
                            <Icon className={`w-7 h-7 ${card.color}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{card.title}</p>
                            <h3 className="text-4xl font-black text-slate-800 mt-0.5 stat-number leading-none">{card.value}</h3>
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
