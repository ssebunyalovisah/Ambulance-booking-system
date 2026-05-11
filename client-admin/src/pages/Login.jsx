// client-admin/src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, Ambulance, Eye, EyeOff, Shield } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginDriver } = useAuth();
  const navigate = useNavigate();

  // Smart Identification Logic
  useEffect(() => {
    const verify = async () => {
      const cleanId = identifier.trim();
      if (cleanId.length < 4) {
        setDisplayName('');
        return;
      }

      setIsVerifying(true);
      try {
        if (cleanId.includes('@')) {
          // Verify Admin Email
          const { data } = await api.get(`/auth/verify/${cleanId}`);
          setDisplayName(data.full_name);
        } else if (cleanId.startsWith('DRV-')) {
          // Verify Driver ID
          const { data } = await api.get(`/drivers/verify/${cleanId}`);
          setDisplayName(data.full_name);
        } else {
          setDisplayName('');
        }
      } catch (err) {
        setDisplayName('');
      } finally {
        setIsVerifying(false);
      }
    };

    const timer = setTimeout(verify, 600);
    return () => clearTimeout(timer);
  }, [identifier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const cleanId = identifier.trim();
      if (cleanId.includes('@')) {
        await login(cleanId, password, rememberMe);
        navigate('/');
      } else if (cleanId.startsWith('DRV-')) {
        const result = await loginDriver(cleanId, displayName, rememberMe);
        console.log('[Smart Login] Driver Auth Success:', result);
        
        const { accessToken, refreshToken } = result || {};
        const driverAppUrl = import.meta.env.VITE_DRIVER_APP_URL || 'http://localhost:5175';
        
        // Ensure we don't pass 'undefined' strings
        const tokenParam = accessToken ? `token=${accessToken}` : '';
        const refreshParam = refreshToken ? `&refresh=${refreshToken}` : '';
        
        const targetUrl = `${driverAppUrl.replace(/\/$/, '')}/?${tokenParam}${refreshParam}`;
        console.log('[Smart Login] Redirecting to:', targetUrl);
        window.location.href = targetUrl;
      } else {
        throw new Error('Please enter a valid email or Driver ID');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans">
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587507565239-bca541983995?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950" />
        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/40">
              <Ambulance className="text-white w-6 h-6" />
            </div>
            <span className="text-white font-black text-xl">RescueAdmin</span>
          </div>
          <div>
            <h2 className="text-5xl font-black text-white leading-tight mb-6">
              Command Center<br /><span className="text-orange-500">Dispatch Unit</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md">Precision monitoring and coordination for emergency ambulance services.</p>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Unified Emergency System v3</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-black text-white mb-2">Access Portal</h1>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Staff & Admin Verification</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl flex items-center gap-2 text-sm font-bold animate-shake">
                <Shield className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email or Driver ID</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all font-bold"
                  placeholder="admin@service.com or DRV-12345"
                  required
                />
                {isVerifying && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 animate-spin" />}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Verified Name</label>
                {displayName && <span className="text-[10px] font-black text-green-500 uppercase flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full"><Shield className="w-3 h-3" /> Verified</span>}
              </div>
              <input
                type="text"
                value={displayName}
                readOnly
                className={`w-full py-4 px-5 rounded-2xl font-black transition-all ${displayName ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-slate-900/50 text-slate-600 border border-slate-800'}`}
                placeholder="Identified User Name"
              />
            </div>

            {!identifier.trim().startsWith('DRV-') && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Security Key / Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white pl-12 pr-12 py-4 rounded-2xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                    placeholder="••••••••"
                    required={!identifier.trim().startsWith('DRV-')}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-orange-600 focus:ring-orange-500" />
                <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              {!identifier.trim().startsWith('DRV-') && (
                <Link to="/forgot-password" title="Recover Password" className="text-orange-500 hover:text-orange-400 font-bold">Forgot Password?</Link>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || (identifier.trim().startsWith('DRV-') && !displayName)}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-orange-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (identifier.trim().startsWith('DRV-') ? 'DRIVER SECURE SIGN IN' : 'SECURE SIGN IN')}
            </button>
          </form>

          <div className="text-center pt-8 border-t border-slate-900">
            <p className="text-slate-500">Not registered? <Link to="/signup" className="text-orange-500 font-bold">Register Company</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
