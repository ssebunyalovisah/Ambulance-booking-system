import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, verifyDriverId } from '../services/api.js';
import socketService from '../services/socket.js';

const Login = () => {
    const [driverId, setDriverId] = useState('');
    const [driverName, setDriverName] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Auto-detect driver name when ID is entered
    useEffect(() => {
        const verify = async () => {
            const cleanId = driverId.trim();
            if (cleanId.length >= 3) {
                setIsVerifying(true);
                try {
                    const data = await verifyDriverId(cleanId);
                    if (data.full_name) {
                        setDriverName(data.full_name);
                        setError('');
                    }
                } catch (err) {
                    setDriverName('');
                } finally {
                    setIsVerifying(false);
                }
            } else {
                setDriverName('');
            }
        };
        const timer = setTimeout(verify, 400);
        return () => clearTimeout(timer);
    }, [driverId]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('role', 'driver');
            navigate('/requests');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(driverId, driverName);
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('role', response.user.role);
            localStorage.setItem('companyId', response.user.company_id);
            localStorage.setItem('driverDbId', response.user.id);
            
            if (response.user.role === 'driver') {
                // ── Initialize socket BEFORE navigating ─────────────────────────
                // DriverLayout's permanent socket effect runs once on mount (before login),
                // so we must manually connect + join rooms here after a fresh login.
                const socket = socketService.connect();
                socketService.joinDashboard(response.user.company_id);
                socketService.joinDriverRoom(response.user.id);

                // Socket emits 'connect' which triggers reconcileState in DriverLayout.
                // If already connected (socket was initialized), join rooms directly.
                if (socket.connected) {
                    socket.emit('join_dashboard', { companyId: response.user.company_id });
                    socket.emit('join_driver_room', { driverId: response.user.id });
                }

                navigate('/requests');
            } else {
                setError('Invalid role for driver app');
            }
        } catch (err) {
            setError('Login failed. Please check your ID and Name.');
        }
    };
 
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
                <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">Driver Portal</h2>
                {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
                
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Driver ID</label>
                    <input
                        type="text"
                        placeholder="e.g. DRV-001"
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        required
                    />
                </div>
 
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                        {isVerifying && <span className="text-[10px] text-blue-500 font-bold animate-pulse">Verifying ID...</span>}
                        {!isVerifying && driverName && <span className="text-[10px] text-green-500 font-bold">✓ Verified</span>}
                    </div>
                    <input
                        type="text"
                        placeholder="Auto-fills on valid ID"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        className={`w-full p-3 border rounded-xl outline-none transition-all ${
                            driverName ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-100'
                        }`}
                        required
                    />
                </div>
 
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                    Sign In
                </button>
            </form>
        </div>
    );
};

export default Login;