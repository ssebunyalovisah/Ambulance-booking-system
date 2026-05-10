import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { Clock, AlertTriangle, LogOut } from 'lucide-react';

const AuthContext = createContext();

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // warn at 25 minutes

function SessionWarningModal({ onStaySignedIn, onLogout, secondsLeft }) {
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-5">
                        <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Session Expiring Soon</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        You've been inactive. For security, you'll be automatically signed out in{' '}
                        <span className="font-black text-amber-600">{Math.ceil(secondsLeft / 1000)}s</span>.
                    </p>
                    <div className="w-full flex flex-col gap-3">
                        <button
                            onClick={onStaySignedIn}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-600/20"
                        >
                            Stay Signed In
                        </button>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 font-semibold py-2 transition-colors text-sm"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSessionWarning, setShowSessionWarning] = useState(false);
    const [warningTimeLeft, setWarningTimeLeft] = useState(WARNING_BEFORE);
    
    const inactivityTimer = useRef(null);
    const warningTimer = useRef(null);
    const warningCountdown = useRef(null);

    const performLogout = useCallback(async () => {
        const token = localStorage.getItem('adminRefreshToken');
        try {
            await api.post('/auth/logout', { token });
        } catch (err) {
            console.error('Logout error', err);
        }
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        setAdmin(null);
        setShowSessionWarning(false);
        window.location.href = '/login';
    }, []);

    const clearAllTimers = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        clearTimeout(warningTimer.current);
        clearInterval(warningCountdown.current);
    }, []);

    const resetInactivityTimer = useCallback(() => {
        if (!localStorage.getItem('adminToken')) return;
        clearAllTimers();
        setShowSessionWarning(false);

        // Show warning 5 min before timeout if not "remember me"
        if (localStorage.getItem('adminRememberMe') !== 'true') {
            warningTimer.current = setTimeout(() => {
                setShowSessionWarning(true);
                setWarningTimeLeft(WARNING_BEFORE);
                // Countdown
                warningCountdown.current = setInterval(() => {
                    setWarningTimeLeft(prev => {
                        if (prev <= 1000) {
                            clearInterval(warningCountdown.current);
                            performLogout();
                            return 0;
                        }
                        return prev - 1000;
                    });
                }, 1000);
            }, INACTIVITY_TIMEOUT - WARNING_BEFORE);
        }

        // Auto-logout if not "remember me"
        if (localStorage.getItem('adminRememberMe') !== 'true') {
            inactivityTimer.current = setTimeout(() => {
                performLogout();
            }, INACTIVITY_TIMEOUT);
        }
    }, [clearAllTimers, performLogout]);

    const handleStaySignedIn = useCallback(() => {
        setShowSessionWarning(false);
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    // Listen for activity
    useEffect(() => {
        if (!admin) return;

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        const handleActivity = () => resetInactivityTimer();
        
        events.forEach(e => document.addEventListener(e, handleActivity, { passive: true }));
        resetInactivityTimer();

        return () => {
            events.forEach(e => document.removeEventListener(e, handleActivity));
            clearAllTimers();
        };
    }, [admin, resetInactivityTimer, clearAllTimers]);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('adminToken');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setAdmin(response.data);
                } catch (error) {
                    console.error('Auth verification failed', error);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (identifier, credential, rememberMe) => {
        let response;
        if (identifier.includes('@')) {
            response = await api.post('/auth/login/admin', { email: identifier, password: credential, rememberMe });
        } else {
            response = await api.post('/auth/login/driver', { driver_id: identifier, driver_name: credential, rememberMe });
        }
        
        const { accessToken, refreshToken, user } = response.data;
        localStorage.setItem('adminToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('adminRefreshToken', refreshToken);
        }
        if (rememberMe) {
            localStorage.setItem('adminRememberMe', 'true');
        } else {
            localStorage.removeItem('adminRememberMe');
        }
        
        if (user.role === 'driver') {
            const driverAppUrl = import.meta.env.VITE_DRIVER_APP_URL || 'http://localhost:5175';
            window.location.href = `${driverAppUrl}/?token=${accessToken}`;
        } else {
            setAdmin(user);
            return user;
        }
    };

    const signup = async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    };

    const logout = async () => {
        await performLogout();
    };

    return (
        <AuthContext.Provider value={{ admin, login, signup, logout, loading }}>
            {!loading && children}
            {showSessionWarning && admin && (
                <SessionWarningModal
                    onStaySignedIn={handleStaySignedIn}
                    onLogout={performLogout}
                    secondsLeft={warningTimeLeft}
                />
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
