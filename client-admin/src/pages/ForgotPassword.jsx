import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Ambulance, Loader2, CheckCircle } from 'lucide-react';
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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />

            <div className="max-w-md w-full relative z-10">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors mb-6 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </button>

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20 mb-4">
                            <Ambulance className="text-white w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
                        <p className="text-slate-400 mt-2 text-center text-sm">
                            Enter your admin email and we'll send a reset link.
                        </p>
                    </div>

                    {sent ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-white font-bold text-lg">Check your email</h2>
                            <p className="text-slate-400 text-sm text-center">
                                If <span className="text-orange-400 font-medium">{email}</span> is registered, you'll receive a reset link shortly.
                            </p>
                            <p className="text-slate-600 text-xs text-center mt-2">
                                (In development mode, check the server console for the reset link)
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-4 w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-2xl transition"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl text-center">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-slate-600"
                                        placeholder="admin@company.com"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
