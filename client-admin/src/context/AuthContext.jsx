import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('adminToken');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setAdmin(response.data);
                } catch (error) {
                    console.error('Auth verification failed', error);
                    // Interceptor will handle logout if refresh fails
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password, rememberMe) => {
        const response = await api.post('/auth/login', { email, password, rememberMe });
        const { accessToken, refreshToken, admin } = response.data;
        localStorage.setItem('adminToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('adminRefreshToken', refreshToken);
        }
        setAdmin(admin);
        return admin;
    };

    const signup = async (userData) => {
        const response = await api.post('/auth/signup', userData);
        return response.data;
    };

    const logout = async () => {
        const token = localStorage.getItem('adminRefreshToken');
        try {
            await api.post('/auth/logout', { token });
        } catch (err) {
            console.error('Logout error', err);
        }
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        setAdmin(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ admin, login, signup, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
