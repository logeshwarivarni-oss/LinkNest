import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Link2, Plus, Copy, Check, Trash2, BarChart3, QrCode, Calendar, 
  Sparkles, ExternalLink, HelpCircle, RefreshCw
} from 'lucide-react';
import QRModal from '../components/QRModal';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const { authFetch, user } = useAuth();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // QR Modal state
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedQrUrl, setSelectedQrUrl] = useState('');
  const [selectedQrCode, setSelectedQrCode] = useState('');

  const navigate = useNavigate();
  const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const fetchUrls = async () => {
    try {
      const res = await authFetch('/urls');
      if (res.ok) {
        const data = await res.json();
        setUrls(data);
      }
    } catch (err) {
      console.error('Fetch URLs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const handleShorten = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    if (!originalUrl) {
      setFormError('Please enter a URL to shorten');
      setSubmitting(false);
      return;
    }

    try {
      const res = await authFetch('/urls/shorten', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl,
          customAlias: customAlias || undefined,
          expiryDate: expiryDate || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to shorten URL');
      }

      setFormSuccess('URL shortened successfully!');
      setOriginalUrl('');
      setCustomAlias('');
      setExpiryDate('');
      fetchUrls(); // refresh list
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this link? All analytics data will be permanently removed.')) {
      return;
    }

    try {
      const res = await authFetch(`/urls/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setUrls(urls.filter(url => url._id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete link');
      }
    } catch (err) {
      console.error('Delete URL error:', err);
    }
  };

  const handleCopy = (id, code) => {
    const fullUrl = `${BACKEND_BASE}/r/${code}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openQrModal = (code) => {
    const fullUrl = `${BACKEND_BASE}/r/${code}`;
    setSelectedQrUrl(fullUrl);
    setSelectedQrCode(code);
    setQrOpen(true);
  };

  // Compute Stats
  const totalLinks = urls.length;
  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const activeLinks = urls.filter(url => {
    if (!url.expiryDate) return true;
    return new Date(url.expiryDate) >= new Date();
  }).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Welcome, {user?.username} <Sparkles className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-slate-400 text-sm">Create, manage, and inspect performance metrics for your links.</p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchUrls(); }}
          className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard 
          title="Total Short Links" 
          value={totalLinks} 
          icon={<Link2 className="w-6 h-6" />} 
          color="indigo" 
        />
        <StatCard 
          title="Total Redirects" 
          value={totalClicks} 
          icon={<BarChart3 className="w-6 h-6" />} 
          color="emerald" 
        />
        <StatCard 
          title="Active Links" 
          value={activeLinks} 
          icon={<Calendar className="w-6 h-6" />} 
          color="amber" 
        />
      </div>

      {/* Two Column Layout: Shorten Form + Link Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Shortening Form Panel */}
        <div className="glass-panel p-6 rounded-3xl space-y-6 lg:sticky lg:top-24">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Shorten a Link
            </h3>
            <p className="text-xs text-slate-400">Generate instantly or customize settings below.</p>
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2">
              <span className="font-semibold">Error:</span> {formError}
            </div>
          )}

          {formSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl flex items-center gap-2">
              <span className="font-semibold">Success:</span> {formSuccess}
            </div>
          )}

          <form onSubmit={handleShorten} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Destination URL
              </label>
              <input
                type="url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="https://example.com/very/long/destination/url"
                className="w-full px-4 py-2.5 glass-input rounded-xl text-slate-200 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Custom Alias <span className="text-slate-500 text-[10px] lowercase font-normal">(optional)</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-sm font-mono select-none">/r/</span>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="custom-slug"
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-xl text-slate-200 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Expiry Date <span className="text-slate-500 text-[10px] lowercase font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().substring(0, 16)}
                className="w-full px-4 py-2.5 glass-input rounded-xl text-slate-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/25"
            >
              <span>{submitting ? 'Shortening...' : 'Generate Short URL'}</span>
            </button>
          </form>
        </div>

        {/* Links Directory Table */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Your URL Catalog</h3>
            <p className="text-xs text-slate-400">Click links to visit destination or access metrics.</p>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Gathering link records...</p>
            </div>
          ) : urls.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-600">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-300 font-semibold text-sm">No shortened URLs found</p>
                <p className="text-slate-500 text-xs">Shorten your first destination URL in the panel on the left!</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Original Destination</th>
                    <th className="pb-3 px-4">Short Link</th>
                    <th className="pb-3 px-4">Redirects</th>
                    <th className="pb-3 px-4">Expiry</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {urls.map((url) => {
                    const fullShortUrl = `${BACKEND_BASE}/r/${url.shortCode}`;
                    const isExpired = url.expiryDate && new Date(url.expiryDate) < new Date();
                    
                    return (
                      <tr key={url._id} className="text-sm text-slate-300 hover:bg-slate-900/30 transition duration-150">
                        <td className="py-4 pr-4 max-w-[200px] truncate" title={url.originalUrl}>
                          <a 
                            href={url.originalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-indigo-400 flex items-center gap-1.5 truncate"
                          >
                            {url.originalUrl}
                            <ExternalLink className="w-3 h-3 shrink-0 text-slate-500" />
                          </a>
                        </td>
                        <td className="py-4 px-4 font-mono font-medium">
                          <div className="flex items-center gap-1.5">
                            <a 
                              href={fullShortUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`hover:underline flex items-center gap-1 ${isExpired ? 'text-slate-500 line-through' : 'text-indigo-400'}`}
                            >
                              /r/{url.shortCode}
                            </a>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-200">
                          {url.clicks || 0}
                        </td>
                        <td className="py-4 px-4">
                          {url.expiryDate ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                              {isExpired ? 'Expired' : new Date(url.expiryDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">Never</span>
                          )}
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleCopy(url._id, url.shortCode)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                              title="Copy Short URL"
                            >
                              {copiedId === url._id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openQrModal(url.shortCode)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                              title="Generate QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/analytics/${url._id}`}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition"
                              title="View Analytics"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(url._id)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
                              title="Delete Link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal Overlay */}
      <QRModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        shortUrl={selectedQrUrl}
        shortCode={selectedQrCode}
      />
    </div>
  );
};

export default Dashboard;
