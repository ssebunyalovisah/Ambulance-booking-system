import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api.js';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(email, password);
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('role', response.role);
            // Assuming role is 'driver' for this app
            if (response.role === 'driver') {
                navigate('/requests');
            } else {
                setError('Invalid role for driver app');
            }
        } catch (err) {
            setError('Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
                <h2 className="text-2xl mb-4">Driver Login</h2>
                {error && <p className="text-red-500">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 mb-4 border"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mb-4 border"
                    required
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2">Login</button>
            </form>
        </div>
    );
};

export default Login;