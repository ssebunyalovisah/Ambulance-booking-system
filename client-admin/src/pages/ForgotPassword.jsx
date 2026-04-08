import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Ambulance, Loader2, CheckCircle, Shield } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex overflow-hidden">
            {/* Left panel — ambulance city image */}
            <div
                className="hidden lg:flex lg:w-[45%] relative"
                style={{
                    backgroundImage: `url('/ambulance-city.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
                <div className="absolute bottom-12 left-12 right-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Ambulance className="text-white w-6 h-6" />
                        </div>
                        <span className="text-white font-black text-xl">RescueAdmin</span>
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight mb-3">
                        Secure Access<br />
                        <span className="text-orange-400">Recovery Portal</span>
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
                        We'll send a secure reset link to your registered email address within seconds.
                    </p>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-6 relative">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="max-w-md w-full relative z-10">
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors mb-10 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </button>

                    <div className="mb-8">
                        <div className="w-14 h-14 bg-orange-600/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-5">
                            <Shield className="w-7 h-7 text-orange-500" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Reset Password</h1>
                        <p className="text-slate-400 mt-2 text-sm">
                            Enter your admin email and we'll send a secure reset link.
                        </p>
                    </div>

                    {sent ? (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </div>
                            <h2 className="text-white font-black text-xl">Check your inbox</h2>
                            <p className="text-slate-400 text-sm max-w-xs">
                                If <span className="text-orange-400 font-semibold">{email}</span> is registered, you'll receive a reset link shortly.
                            </p>
                            <p className="text-slate-600 text-xs">
                                (In development: check the server console for the reset link)
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-4 w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-600/20"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-2xl">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-slate-600 text-sm"
                                        placeholder="admin@company.com"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                id="forgot-submit"
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                            </button>
                        </form>
                    )}

                    <p className="text-center text-slate-700 mt-10 text-xs font-medium uppercase tracking-widest">
                        © 2026 Ambulance Emergency Booking System
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
