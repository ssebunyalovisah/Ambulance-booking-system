import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Ambulance, 
  Settings, 
  Bell, 
  CreditCard, 
  MessageSquare, 
  LogOut,
  ChevronRight,
  Radio
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const { admin, logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/' },
        { icon: Bell, label: 'Incoming Requests', path: '/requests' },
        { icon: Ambulance, label: 'Fleet Management', path: '/ambulances' },
        { icon: Radio, label: 'Live Tracking', path: '/tracking' },
        { icon: CreditCard, label: 'Payments', path: '/payments' },
        { icon: MessageSquare, label: 'Feedback & Ratings', path: '/feedback' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <div className={`w-64 bg-slate-900 h-screen fixed left-0 top-0 text-slate-300 flex flex-col border-r border-slate-800 z-[70] transition-transform duration-300 lg:translate-x-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                        <Ambulance className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-lg tracking-tight">RescueAdmin</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Live System</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 mt-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) => 
                                `flex items-center justify-between p-3 rounded-xl transition-all group ${
                                    isActive 
                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                                    : 'hover:bg-slate-800/50 hover:text-white'
                                }`
                            }
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 mt-auto">
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold">
                                {admin?.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{admin?.name || 'Admin'}</p>
                                <p className="text-[10px] text-slate-500 truncate">{admin?.email}</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => {
                                onClose();
                                logout();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-700/50 hover:bg-orange-500/10 hover:text-orange-400 rounded-xl transition-all text-xs font-semibold"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
