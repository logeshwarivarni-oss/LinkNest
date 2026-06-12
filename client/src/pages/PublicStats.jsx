import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart3, Calendar, ExternalLink, Link2, 
  Sparkles, ShieldCheck, ArrowRight, ShieldAlert, Monitor, Info, Clock
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const PublicStats = () => {
  const { shortCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsTab, setStatsTab] = useState('overview');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchPublicStats = async () => {
      try {
        const res = await fetch(`${API_URL}/urls/public/stats/${shortCode}`);
        const payload = await res.json();
        
        if (!res.ok) {
          throw new Error(payload.error || 'Failed to retrieve stats');
        }
        
        setData(payload);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicStats();
  }, [shortCode]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Gathering click data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
        {/* Decorative background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl"></div>

        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center space-y-5 relative z-10 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">Stats Lookup Failed</h3>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
          <Link 
            to="/login" 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/25"
          >
            <span>Create Custom Short Links</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { 
    originalUrl, clicks, createdAt, expiryDate, isExpired,
    browserStats, osStats, deviceStats, countryStats, cityStats 
  } = data;
  
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Decorative background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl animate-pulse-slow"></div>

      {/* Main Stats Card */}
      <div className="glass-panel w-full max-w-xl rounded-3xl p-8 relative z-10 shadow-2xl space-y-6">
        
        {/* Header Logo & Title */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-2 shadow-md">
              <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
              Link<span className="text-indigo-400">Nest</span>
            </h1>
          </div>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Public Statistics
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-900 pb-1">
          <button
            onClick={() => setStatsTab('overview')}
            className={`flex-1 pb-2 text-xs font-semibold text-center border-b-2 transition duration-205 cursor-pointer ${
              statsTab === 'overview' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setStatsTab('insights')}
            className={`flex-1 pb-2 text-xs font-semibold text-center border-b-2 transition duration-205 cursor-pointer ${
              statsTab === 'insights' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Audience Insights
          </button>
        </div>

        {statsTab === 'overview' ? (
          <div className="space-y-6">
            {/* Short Code & Stats summary */}
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-2">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Redirections Recorded
              </span>
              <div className="relative flex items-center justify-center">
                {/* Click Count Ring */}
                <div className="w-36 h-36 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-900/40 shadow-inner relative">
                  <div className="absolute inset-0.5 rounded-full border border-indigo-500/20 animate-ping opacity-30"></div>
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {clicks.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest mt-1">
                    Clicks
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-mono font-bold text-white pt-2">
                /r/{shortCode}
              </h2>
            </div>

            {/* URL Properties */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 text-sm">
              {/* Destination */}
              <div className="space-y-1">
                <span className="text-xs text-slate-500 block uppercase font-semibold tracking-wider">Original Destination</span>
                <a 
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 break-all font-mono hover:underline text-xs"
                >
                  {originalUrl}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-4">
                {/* Created */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 block uppercase font-semibold tracking-wider">Shortened Date</span>
                  <span className="text-slate-300 font-medium font-mono text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(createdAt).toLocaleDateString()}
                  </span>
                </div>
                {/* Expiry Status */}
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 block uppercase font-semibold tracking-wider">Expiry Status</span>
                  <span className="text-slate-300 font-medium font-mono text-xs flex items-center gap-1.5">
                    {isExpired ? (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-red-400 font-bold">Expired</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Active</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {expiryDate && (
                <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Expiry Date:</span>
                  <span className="font-mono text-slate-400">{new Date(expiryDate).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Device breakdown */}
            {deviceStats && deviceStats.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center border-b border-slate-900 pb-5">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-indigo-400" /> Devices
                    </h3>
                    <div className="h-32 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceStats.map(item => ({ name: item._id, value: item.count }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={40}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {deviceStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                          <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={6} formatter={(value) => <span className="text-slate-550 text-[10px]">{value}</span>} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Systems</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {osStats.map((item, idx) => {
                        const pct = clicks > 0 ? ((item.count / clicks) * 100).toFixed(0) : 0;
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                              <span>{item._id}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-1">
                  {/* Browsers List */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1">
                      <Info className="w-4 h-4 text-emerald-450" /> Browsers
                    </h3>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {browserStats.map((item, idx) => {
                        const pct = clicks > 0 ? ((item.count / clicks) * 100).toFixed(0) : 0;
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-350">
                              <span>{item._id}</span>
                              <span>{pct}% ({item.count})</span>
                            </div>
                            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Geolocation List */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1">
                      <ExternalLink className="w-4 h-4 text-amber-450" /> Top Locations
                    </h3>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {countryStats.map((item, idx) => {
                        const pct = clicks > 0 ? ((item.count / clicks) * 100).toFixed(0) : 0;
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-350">
                              <span>🌐 {item._id}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                No audience analytics available yet.
              </div>
            )}
          </div>
        )}

        {/* Promotion Call To Action */}
        <div className="text-center pt-2 border-t border-slate-900/60">
          <Link 
            to="/login"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-center gap-1 group transition"
          >
            Create your own shortened links
            <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PublicStats;
