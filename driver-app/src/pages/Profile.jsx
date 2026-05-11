import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Phone, LogOut, CheckCircle, Loader2 } from 'lucide-react';
import { updateDriverStatus, getMe } from '../services/api';

const Profile = () => {
    const [driver, setDriver] = useState(null);
    const [status, setStatus] = useState('available');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await getMe();
                setDriver(data);
                setStatus(data.status || 'available');
            } catch (err) {
                console.error('Failed to load profile', err);
                setError('Unable to load driver profile.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleStatusToggle = async (newStatus) => {
        if (newStatus === status) return;
        setError('');
        setIsUpdating(true);
        try {
            await updateDriverStatus(newStatus);
            setStatus(newStatus);
        } catch (error) {
            console.error('Failed to update status', error);
            setError('Unable to update status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        window.location.href = '/';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    const profileItems = [
        { icon: Shield, label: 'Driver ID', value: driver?.driver_id || 'DRV-XXXXX' },
        { icon: Shield, label: 'Ambulance', value: driver?.ambulance_number ? `Unit ${driver.ambulance_number}` : 'Unassigned' },
        { icon: Phone, label: 'Contact', value: driver?.phone || '+256 700 000 000' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 py-6 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-10">
                <button 
                    onClick={() => navigate('/requests')}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Driver Profile</h1>
            </div>

            <div className="flex-1 p-6 space-y-6">
                {/* Profile Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mb-6 relative">
                        <User className="w-12 h-12" />
                        {status === 'available' && (
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center text-white">
                               <CheckCircle className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">{driver?.name || 'Driver Name'}</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{driver?.company_name || 'Emergency Dispatch Team'}</p>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                    {profileItems.map((item, i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                <p className="font-bold text-slate-800">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-3xl text-sm font-semibold">
                        {error}
                    </div>
                )}

                {/* Status Toggle */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                    <div className="flex justify-between items-center mb-3 px-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duty Status</p>
                        {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                    </div>
                    <div className="flex gap-2">
                        {['available', 'offline'].map(s => (
                            <button
                                key={s}
                                disabled={isUpdating}
                                onClick={() => handleStatusToggle(s)}
                                className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all capitalize ${
                                    status === s 
                                    ? (s === 'available' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-900 text-white shadow-lg shadow-slate-200')
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Logout */}
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 py-5 text-red-500 font-black text-sm uppercase tracking-widest hover:bg-red-50 rounded-3xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out Account
                </button>
            </div>
        </div>
    );
};

export default Profile;