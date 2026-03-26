import { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Calendar, Ambulance, Filter, Search, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function FeedbackManagement() {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState('all');

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const response = await api.get('/feedback/admin/all');
            setFeedback(response.data);
        } catch (err) {
            console.error('Failed to fetch feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredFeedback = feedback.filter(item => {
        const matchesSearch = item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.ambulance_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRating = filterRating === 'all' || item.rating === parseInt(filterRating);
        return matchesSearch && matchesRating;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight font-outfit">Service Feedback</h1>
                <p className="text-slate-500 mt-2 font-medium font-inter">Monitor patient satisfaction and driver performance ratings.</p>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-slate-100 flex items-center gap-4">
                        <div className="bg-orange-100 p-4 rounded-2xl text-orange-600">
                            <Star className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Average Rating</p>
                            <h3 className="text-2xl font-black text-slate-900">
                                {feedback.length > 0 
                                    ? (feedback.reduce((acc, curr) => acc + curr.rating, 0) / feedback.length).toFixed(1) 
                                    : '0.0'}
                            </h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-slate-100 flex items-center gap-4">
                        <div className="bg-blue-100 p-4 rounded-2xl text-blue-600">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Reviews</p>
                            <h3 className="text-2xl font-black text-slate-900">{feedback.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shadow-slate-100 flex items-center gap-4">
                        <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Satisfaction rate</p>
                            <h3 className="text-2xl font-black text-slate-900">
                                {feedback.length > 0 
                                    ? ((feedback.filter(f => f.rating >= 4).length / feedback.length) * 100).toFixed(0) 
                                    : '0'}%
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/30">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Search by patient or unit..."
                            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-2 border-transparent focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select 
                            className="bg-white px-6 py-3 rounded-2xl border-2 border-transparent focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-bold text-slate-600 cursor-pointer"
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">Excellent (5)</option>
                            <option value="4">Great (4)</option>
                            <option value="3">Good (3)</option>
                            <option value="2">Fair (2)</option>
                            <option value="1">Poor (1)</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Patient & Date</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Ambulance Unit</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Rating</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Feedback Comment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredFeedback.length > 0 ? (
                                filteredFeedback.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{item.patient_name}</p>
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mt-0.5">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <Ambulance className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{item.ambulance_number}</p>
                                                    <p className="text-slate-400 text-xs font-medium mt-0.5">Driver: {item.driver_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1 text-orange-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        className={`w-4 h-4 ${i < item.rating ? 'fill-current' : 'text-slate-200'}`} 
                                                    />
                                                ))}
                                                <span className="ml-2 font-black text-slate-900">{item.rating}.0</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-slate-600 font-medium leading-relaxed max-w-md italic">
                                                &ldquo;{item.comments}&rdquo;
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center text-slate-400 font-medium">
                                        No feedback found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
