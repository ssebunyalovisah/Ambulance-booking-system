// driver-app/src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, verifyDriverId } from '../services/api.js';
import socketService from '../services/socket.js';
import { User, ShieldCheck, Activity, Loader2 } from 'lucide-react';

const Login = () => {
  const [driverId, setDriverId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Smart Login: Auto-verify Driver ID
  useEffect(() => {
    const verify = async () => {
      const cleanId = driverId.trim();
      if (cleanId.length >= 4) {
        setIsVerifying(true);
        try {
          const { data } = await verifyDriverId(cleanId);
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
    const timer = setTimeout(verify, 500);
    return () => clearTimeout(timer);
  }, [driverId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login({ driver_id: driverId, driver_name: driverName });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('driverDbId', data.user.id);
      localStorage.setItem('companyId', data.user.company_id);

      socketService.connect(data.user.id);
      navigate('/requests');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
        <div className="bg-orange-600 p-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Activity className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">DRIVER PORTAL</h1>
          <p className="text-orange-100 text-sm mt-1 font-medium opacity-80 uppercase tracking-widest">Emergency Dispatch System</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Driver ID</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. DRV-12345"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isVerifying ? <Loader2 className="w-5 h-5 text-orange-500 animate-spin" /> : <User className="w-5 h-5 text-slate-300" />}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              {driverName && (
                <span className="flex items-center gap-1 text-[10px] font-black text-green-500 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="Auto-fills on valid ID"
              value={driverName}
              readOnly
              className={`w-full p-4 rounded-2xl font-bold transition-all ${
                driverName ? 'bg-green-50 text-green-700 border-2 border-green-100' : 'bg-slate-50 text-slate-400 border-2 border-slate-50'
              }`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!driverName}
            className="w-full py-5 bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white rounded-2xl font-black text-lg transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
          >
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;