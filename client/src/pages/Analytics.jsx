import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Calendar, BarChart3, Clock, Link2, 
  ExternalLink, Copy, Check, Info, FileText, Monitor
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import StatCard from '../components/StatCard';

const Analytics = () => {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const fetchAnalytics = async () => {
    try {
      const res = await authFetch(`/urls/${id}/analytics`);
      const payload = await res.json();
      
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to retrieve analytics');
      }
      
      setData(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const handleCopy = (code) => {
    const fullUrl = `${BACKEND_BASE}/r/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Aggregating redirect data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-3xl max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 font-bold text-lg">!</div>
        <h3 className="text-lg font-bold text-white">Analytics Error</h3>
        <p className="text-slate-400 text-sm">{error}</p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const { url, totalClicks, lastVisited, recentVisits, dailyTrends } = data;
  const isExpired = url.expiryDate && new Date(url.expiryDate) < new Date();
  const shortUrl = `${BACKEND_BASE}/r/${url.shortCode}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center space-x-4">
        <Link 
          to="/" 
          className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white border border-slate-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Link Analytics
          </h2>
          <p className="text-slate-400 text-sm">Detailed performance inspection for short code: <span className="font-mono text-indigo-400">/r/{url.shortCode}</span></p>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="glass-panel p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-3">
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Short URL Details
          </span>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              /r/{url.shortCode}
              <button 
                onClick={() => handleCopy(url.shortCode)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </h3>
            <p className="text-slate-400 text-xs truncate max-w-xl flex items-center gap-1.5" title={url.originalUrl}>
              Destination:{' '}
              <a 
                href={url.originalUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-300 hover:text-indigo-400 underline font-mono truncate"
              >
                {url.originalUrl}
              </a>
              <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
            </p>
          </div>
        </div>
        
        <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Created Date</span>
            <span className="text-slate-200 font-semibold">{new Date(url.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Custom Alias</span>
            <span className="text-slate-200 font-semibold font-mono">{url.customAlias ? `/r/${url.customAlias}` : 'None'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Expiry Limit</span>
            <span className="text-slate-200 font-semibold">
              {url.expiryDate ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isExpired ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {isExpired ? 'Expired' : new Date(url.expiryDate).toLocaleDateString()}
                </span>
              ) : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard 
          title="Total Hits" 
          value={totalClicks} 
          icon={<BarChart3 className="w-6 h-6" />} 
          color="indigo" 
        />
        <StatCard 
          title="Last Visit Time" 
          value={lastVisited ? new Date(lastVisited).toLocaleDateString() : 'Never'} 
          icon={<Clock className="w-6 h-6" />} 
          color="emerald" 
        />
        <StatCard 
          title="Status" 
          value={isExpired ? 'Expired' : 'Active'} 
          icon={<Info className="w-6 h-6" />} 
          color={isExpired ? 'rose' : 'amber'} 
        />
      </div>

      {/* Charts & Table Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Trend Chart (Takes 2 cols) */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Daily Redirect Activity
            </h3>
            <p className="text-xs text-slate-400">Total clicks aggregated over the last 7 calendar days.</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(str) => {
                    const parts = str.split('-');
                    return `${parts[1]}/${parts[2]}`; // MM/DD
                  }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '12px'
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar dataKey="clicks" radius={[6, 6, 0, 0]}>
                  {dailyTrends.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.clicks > 0 ? '#6366f1' : '#1e293b'} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Redirect Logs */}
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Live Redirect Logs
            </h3>
            <p className="text-xs text-slate-400">Showing details of the last 10 visits.</p>
          </div>

          {recentVisits.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-1">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>No redirection traffic recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {recentVisits.map((visit) => (
                <div 
                  key={visit._id} 
                  className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl space-y-1.5 text-xs hover:border-slate-700 transition"
                >
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-mono text-indigo-400 font-semibold">{visit.ip}</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="truncate max-w-[150px] flex items-center gap-1" title={visit.userAgent}>
                      <Monitor className="w-3 h-3 text-slate-500" />
                      {visit.userAgent}
                    </span>
                    <span className="text-slate-500">
                      {new Date(visit.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
