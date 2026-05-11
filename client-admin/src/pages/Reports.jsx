import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart3, 
  Download, 
  Printer, 
  FileText, 
  Calendar, 
  ChevronDown, 
  TrendingUp, 
  Users, 
  Activity, 
  DollarSign,
  Filter,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#ef4444', '#a855f7'];

const REPORT_TYPES = [
  { id: 'BOOKING_SUMMARY', label: 'Booking Summary', icon: Activity },
  { id: 'REVENUE', label: 'Revenue & Payments', icon: DollarSign },
  { id: 'AMBULANCE_UTILIZATION', label: 'Ambulance Utilization', icon: BarChart3 },
  { id: 'DRIVER_PERFORMANCE', label: 'Driver Performance', icon: Users },
  { id: 'FEEDBACK', label: 'Patient & Feedback', icon: TrendingUp },
  { id: 'RESPONSE_TIME', label: 'Emergency Response Time', icon: RefreshCcw },
];

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('BOOKING_SUMMARY');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [data, setData] = useState(null);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports', {
        params: { ...filters, reportType }
      });
      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch report data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchReportData();
    }
  }, [filters.startDate, filters.endDate]);

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`${REPORT_TYPES.find(t => t.id === reportType)?.label} - RescueAdmin`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 35);

    let yPosition = 45;

    // Capture and add charts
    const chartIds = [];
    if (reportType === 'BOOKING_SUMMARY') {
      chartIds.push('chart-1', 'chart-2');
    } else if (reportType === 'REVENUE') {
      chartIds.push('chart-3');
    } else if (reportType === 'DRIVER_PERFORMANCE') {
      chartIds.push('chart-4');
    }

    for (const chartId of chartIds) {
      const chartElement = document.getElementById(chartId);
      if (chartElement) {
        try {
          const canvas = await html2canvas(chartElement, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          if (yPosition + imgHeight > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error('Error capturing chart:', error);
        }
      }
    }

    // Add table data
    let tableData = [];
    let columns = [];

    if (reportType === 'BOOKING_SUMMARY') {
      columns = ["Status", "Count"];
      tableData = data?.stats.map(s => [s.status, s.count]) || [];
    } else if (reportType === 'REVENUE') {
      columns = ["Date", "Amount"];
      tableData = data?.timeline.map(t => [t.date, `$${t.amount}`]) || [];
    } else if (reportType === 'AMBULANCE_UTILIZATION') {
      columns = ["Ambulance #", "Total Bookings", "Completed"];
      tableData = data?.utilization.map(u => [u.ambulance_number, u.total_bookings, u.completed_bookings]) || [];
    } else if (reportType === 'DRIVER_PERFORMANCE') {
      columns = ["Driver Name", "Trips"];
      tableData = data?.performance.map(p => [p.driver_name, p.trips]) || [];
    } else if (reportType === 'FEEDBACK') {
      columns = ["Rating", "Count"];
      tableData = data?.feedback?.map(f => [f.rating, f.count]) || [];
    } else if (reportType === 'RESPONSE_TIME') {
      columns = ["Time Range", "Count"];
      tableData = data?.response_times?.map(r => [r.range, r.count]) || [];
    }

    if (tableData.length > 0) {
      if (yPosition + 50 > 280) {
        doc.addPage();
        yPosition = 20;
      }
      doc.autoTable({
        startY: yPosition,
        head: [columns],
        body: tableData,
        theme: 'striped',
        headStyles: { fillStyle: '#f97316' }
      });
    }

    doc.save(`RescueReport_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    let exportData = [];
    let sheetName = 'Report';

    if (reportType === 'BOOKING_SUMMARY') {
      exportData = data?.stats || [];
      sheetName = 'Booking Summary';
    } else if (reportType === 'REVENUE') {
      exportData = data?.timeline || [];
      sheetName = 'Revenue Timeline';
    } else if (reportType === 'AMBULANCE_UTILIZATION') {
      exportData = data?.utilization || [];
      sheetName = 'Ambulance Utilization';
    } else if (reportType === 'DRIVER_PERFORMANCE') {
      exportData = data?.performance || [];
      sheetName = 'Driver Performance';
    } else if (reportType === 'FEEDBACK') {
      exportData = data?.feedback || [];
      sheetName = 'Feedback';
    } else if (reportType === 'RESPONSE_TIME') {
      exportData = data?.response_times || [];
      sheetName = 'Response Times';
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `RescueReport_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderVisualizations = () => {
    if (!data) return null;

    switch (reportType) {
      case 'BOOKING_SUMMARY':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" id="chart-1">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Booking Status Distribution</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.stats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="status"
                            >
                                {data.stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" id="chart-2">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Bookings Trend</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.timeline}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="date" 
                                fontSize={10} 
                                tickFormatter={(val) => new Date(val).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                            />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Area type="monotone" dataKey="count" stroke="#f97316" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
          </div>
        );
      case 'REVENUE':
        return (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" id="chart-3">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Revenue Analysis</h3>
                    <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-2xl font-black text-xl">
                        ${data.total?.toLocaleString()}
                    </div>
                </div>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.timeline}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="date" 
                                fontSize={10} 
                                tickFormatter={(val) => new Date(val).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                            />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="amount" fill="#f97316" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
        case 'DRIVER_PERFORMANCE':
            return (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" id="chart-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Trips per Driver</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={data.performance}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" fontSize={10} />
                                <YAxis dataKey="driver_name" type="category" fontSize={10} width={100} />
                                <Tooltip />
                                <Bar dataKey="trips" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
      default:
        return (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                Data visualization for this report type is under development.
            </div>
        );
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 font-medium mt-1">Operational and financial insights for your company.</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
                <FileText className="w-4 h-4 text-orange-500" /> PDF
            </button>
            <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
                <Download className="w-4 h-4 text-green-600" /> Excel
            </button>
            <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 rounded-xl text-xs font-bold text-white hover:bg-slate-800 transition shadow-lg"
            >
                <Printer className="w-4 h-4" /> Print
            </button>
        </div>
      </div>

      {/* Main Filter Toolbar */}
      <div className="bg-white/50 backdrop-blur-md sticky top-0 z-20 p-4 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
            <label className="absolute -top-2 left-4 px-1 bg-white text-[10px] font-black uppercase text-slate-400">Report Type</label>
            <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full appearance-none bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:border-orange-500 outline-none transition"
            >
                {REPORT_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1">
                <label className="absolute -top-2 left-4 px-1 bg-white text-[10px] font-black uppercase text-slate-400">Start Date</label>
                <input 
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-orange-500 transition" 
                />
            </div>
            <div className="text-slate-300">to</div>
            <div className="relative flex-1">
                <label className="absolute -top-2 left-4 px-1 bg-white text-[10px] font-black uppercase text-slate-400">End Date</label>
                <input 
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-orange-500 transition" 
                />
            </div>
        </div>

        <button 
            onClick={fetchReportData}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20"
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Filter className="w-5 h-5" />}
            GENERATE
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aggregating Data...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderVisualizations()}

            {/* Data Tables Detail (If applicable) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Detailed Data Records</h3>
                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-black text-slate-500">
                        {reportType.replace('_', ' ')}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Metric / Field</th>
                                <th className="px-6 py-4">Value</th>
                                <th className="px-6 py-4 text-right">Trend / Extra</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Generic Row mapping based on type */}
                            {reportType === 'BOOKING_SUMMARY' && data?.stats.map(s => (
                                <tr key={s.status} className="hover:bg-slate-50/30 transition">
                                    <td className="px-6 py-4 font-bold text-slate-700 capitalize">{s.status.toLowerCase()}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded-lg font-mono text-xs">{s.count} Bookings</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 text-[10px] text-green-600 font-bold">
                                            <TrendingUp className="w-3 h-3" /> Live
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {reportType === 'REVENUE' && data?.timeline.map(t => (
                                <tr key={t.date} className="hover:bg-slate-50/30 transition">
                                    <td className="px-6 py-4 font-bold text-slate-700">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-black text-orange-600">${t.amount?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-xs text-slate-400">Daily Total</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!data?.stats && !data?.timeline && (
                    <div className="p-12 text-center text-slate-400 text-sm font-medium">
                        No granular records found for the selected criteria.
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
