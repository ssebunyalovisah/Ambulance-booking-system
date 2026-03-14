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
                    setAdmin(response.data.admin);
                } catch (error) {
                    console.error('Auth verification failed', error);
                    localStorage.removeItem('adminToken');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, admin } = response.data;
        localStorage.setItem('adminToken', token);
        setAdmin(admin);
        return admin;
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setAdmin(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ admin, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
