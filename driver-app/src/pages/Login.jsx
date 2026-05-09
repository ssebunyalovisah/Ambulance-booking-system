import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api.js';

const Login = () => {
    const [driverId, setDriverId] = useState('');
    const [driverName, setDriverName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
 
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
            
            if (response.user.role === 'driver') {
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Ssendawula John"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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