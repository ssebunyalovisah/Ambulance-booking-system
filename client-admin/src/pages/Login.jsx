import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, Ambulance, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { verifyDriverId } from '../services/api';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [credential, setCredential] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isDriver = identifier && !identifier.includes('@') && identifier.trim().toLowerCase().startsWith('drv-');

  // Auto-detect driver name when ID is entered
  useEffect(() => {
    const verify = async () => {
      const cleanId = identifier.trim();
      if (isDriver && cleanId.length >= 4) {
        setIsVerifying(true);
        try {
          const data = await verifyDriverId(cleanId);
          if (data.full_name) {
            setCredential(data.full_name);
            setError('');
          }
        } catch (err) {
          setCredential('');
        } finally {
          setIsVerifying(false);
        }
      } else if (isDriver) {
        setCredential('');
      }
    };
    const timer = setTimeout(verify, 400);
    return () => clearTimeout(timer);
  }, [identifier, isDriver]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(identifier, credential, rememberMe);
      if (!isDriver) {
          navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden">
      {/* LEFT PANEL — Image */}
      <div
        className="hidden lg:flex lg:w-[55%] relative"
        style={{
          backgroundImage: `url('/ambulance-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/40">
              <Ambulance className="text-white w-6 h-6" />
            </div>
            <span className="text-white font-black text-xl tracking-tight">RescueAdmin</span>
          </div>
          <h2 className="text-3xl font-black text-white leading-tight mb-3">
            Emergency Response<br />
            <span className="text-orange-400">Command Platform</span>
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
            Manage your ambulance fleet, respond to emergencies in real-time, and save lives with precision dispatch operations.
          </p>
          <div className="flex gap-6 mt-8">
            {[
              { label: 'Response Time', value: '< 5 min' },
              { label: 'Fleet Uptime', value: '99.8%' },
              { label: 'Lives Saved', value: '10K+' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-xl font-black text-orange-400">{stat.value}</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative">
        {/* Background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
              <Ambulance className="text-white w-6 h-6" />
            </div>
            <span className="text-white font-black text-xl">RescueAdmin</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">Welcome back</h1>
            <p className="text-slate-400 mt-2">Sign in to your dispatch portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded-2xl flex items-center gap-2">
                <Shield className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Email Address or Driver ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-slate-600 text-sm"
                  placeholder="admin@company.com or DRV-1234"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-slate-300">
                  {isDriver ? 'Driver Full Name' : 'Password'}
                </label>
                {isDriver && isVerifying && (
                  <span className="text-[10px] text-orange-400 font-bold animate-pulse uppercase tracking-widest">
                    Searching...
                  </span>
                )}
                {isDriver && !isVerifying && credential && (
                  <span className="text-[10px] text-green-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                    <CheckCircle className="w-3 h-3" /> Identity Verified
                  </span>
                )}
              </div>
              <div className="relative group">
                {!isDriver && <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />}
                <input
                  id="login-credential"
                  type={isDriver ? 'text' : (showPassword ? 'text' : 'password')}
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  className={`w-full bg-slate-900 border ${isDriver && credential ? 'border-green-500/50 text-green-400' : 'border-slate-700 text-white'} ${!isDriver ? 'pl-12 pr-12' : 'px-4'} py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-slate-600 text-sm`}
                  placeholder={isDriver ? 'Auto-detected from ID' : '••••••••'}
                  required
                />
                {!isDriver && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                      rememberMe 
                        ? 'bg-orange-600 border-orange-600' 
                        : 'bg-slate-900 border-slate-600 hover:border-orange-500'
                    }`}
                  >
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-slate-300 transition-colors">
                  Remember me
                  {rememberMe && <span className="ml-1 text-orange-400 text-xs font-medium">(Stay signed in 30 days)</span>}
                </span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-orange-400 hover:text-orange-300 transition-colors font-semibold"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 group mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In to Dashboard
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              Not registered yet?{' '}
              <button 
                onClick={() => navigate('/signup')} 
                className="text-orange-400 font-semibold hover:text-orange-300 transition-colors"
              >
                Register your company
              </button>
            </p>
          </div>

          <p className="text-center text-slate-700 mt-8 text-xs font-medium uppercase tracking-widest">
            © 2026 Ambulance Emergency Booking System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
