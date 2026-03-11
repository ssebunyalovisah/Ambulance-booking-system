import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function StatCards({ stats }) {
    const cards = [
        { title: 'Active Emergencies', value: stats?.active || 0, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-100' },
        { title: 'Available Units', value: stats?.available || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Busy Units', value: stats?.busy || 0, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${card.bg}`}>
                            <Icon className={`w-7 h-7 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
                            <h3 className="text-3xl font-bold text-slate-800">{card.value}</h3>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
