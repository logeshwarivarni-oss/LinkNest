import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Link2, Plus, Copy, Check, Trash2, BarChart3, QrCode, Calendar, 
  Sparkles, ExternalLink, HelpCircle, RefreshCw, Upload, Download
} from 'lucide-react';
import QRModal from '../components/QRModal';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const { authFetch, user } = useAuth();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control state
  const [activeTab, setActiveTab] = useState('single');

  // Form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Bulk state variables
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkError, setBulkError] = useState('');

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

  const handleCsvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setBulkError('Please upload a valid CSV file');
      return;
    }
    
    setCsvFile(file);
    setBulkError('');
    setBulkResults(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/);
      if (lines.length <= 1) {
        setBulkError('The CSV file is empty or only contains headers');
        return;
      }
      
      const parsedRows = [];
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const urlIdx = headers.indexOf('originalurl');
      const aliasIdx = headers.indexOf('customalias');
      const expiryIdx = headers.indexOf('expirydate');
      
      if (urlIdx === -1) {
        setBulkError('CSV must contain an "originalUrl" header column');
        return;
      }
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = [];
        let currentVal = '';
        let insideQuotes = false;
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          const char = line[charIdx];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentVal.trim());
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim());
        
        const originalUrl = values[urlIdx] || '';
        const customAlias = aliasIdx !== -1 ? values[aliasIdx] || '' : '';
        const expiryDate = expiryIdx !== -1 ? values[expiryIdx] || '' : '';
        
        if (originalUrl) {
          parsedRows.push({
            originalUrl,
            customAlias,
            expiryDate
          });
        }
      }
      
      if (parsedRows.length === 0) {
        setBulkError('No valid rows with URLs found in CSV');
        return;
      }
      
      setBulkRows(parsedRows);
      setCsvPreview(parsedRows.slice(0, 5));
    };
    
    reader.readAsText(file);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (bulkRows.length === 0) return;
    
    setBulkSubmitting(true);
    setBulkError('');
    setBulkResults(null);
    
    try {
      const res = await authFetch('/urls/bulk', {
        method: 'POST',
        body: JSON.stringify({ urls: bulkRows })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process bulk URLs');
      }
      
      setBulkResults(data.results);
      fetchUrls();
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,originalUrl,customAlias,expiryDate\nhttps://example.com,custom-alias-1,2026-12-31T23:59:59\nhttps://google.com,,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "linknest_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadResultsCsv = () => {
    if (!bulkResults) return;
    
    let csvRows = ['Row,Original URL,Custom Alias,Short URL,Status,Error/Details'];
    bulkResults.forEach(r => {
      const rowNum = r.row;
      const orig = `"${r.originalUrl.replace(/"/g, '""')}"`;
      const alias = r.customAlias ? `"${r.customAlias.replace(/"/g, '""')}"` : '';
      const sUrl = r.shortUrl || '';
      const status = r.status;
      const errorMsg = r.error ? `"${r.error.replace(/"/g, '""')}"` : '';
      
      csvRows.push(`${rowNum},${orig},${alias},${sUrl},${status},${errorMsg}`);
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "linknest_shortened_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              Shorten Links
            </h3>
            <p className="text-xs text-slate-400">Shorten a single URL or upload in batch.</p>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-slate-800 pb-1">
            <button
              type="button"
              onClick={() => { setActiveTab('single'); setFormError(''); setFormSuccess(''); }}
              className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition duration-200 cursor-pointer ${
                activeTab === 'single' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Single Link
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('bulk'); setBulkError(''); setBulkResults(null); }}
              className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition duration-200 cursor-pointer ${
                activeTab === 'bulk' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Bulk CSV
            </button>
          </div>

          {activeTab === 'single' ? (
            <>
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
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-slate-200 text-sm font-sans"
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
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-slate-200 text-sm font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  <span>{submitting ? 'Shortening...' : 'Generate Short URL'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              {bulkError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                  <span className="font-semibold">Error:</span> {bulkError}
                </div>
              )}

              {bulkResults ? (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl">
                    <span className="font-semibold">Success!</span> Processed {bulkResults.length} records.
                    <div className="mt-1 font-mono text-[10px]">
                      Successful: {bulkResults.filter(r => r.status === 'success').length} | Failed: {bulkResults.filter(r => r.status === 'failed').length}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={downloadResultsCsv}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Results CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCsvFile(null);
                      setCsvPreview([]);
                      setBulkRows([]);
                      setBulkResults(null);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-4 rounded-xl transition cursor-pointer"
                  >
                    Shorten More URLs
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBulkSubmit} className="space-y-4">
                  {/* File Upload Zone */}
                  <div className="relative group border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 transition text-center cursor-pointer bg-slate-900/30">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mx-auto mb-2 transition" />
                    <span className="text-xs text-slate-300 block font-semibold truncate px-2">
                      {csvFile ? csvFile.name : 'Upload CSV File'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : 'Drag & drop or browse files'}
                    </span>
                  </div>

                  {/* Template & Helper info */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Need the format?</span>
                    <button
                      type="button"
                      onClick={downloadSampleTemplate}
                      className="text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold bg-transparent border-0"
                    >
                      <Download className="w-3 h-3" /> Download Template
                    </button>
                  </div>

                  {/* Parsed Preview Table */}
                  {csvPreview.length > 0 && (
                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <span>Preview (First 5 Rows)</span>
                        <span className="text-indigo-400 font-mono text-[10px]">{bulkRows.length} total</span>
                      </div>
                      <div className="overflow-x-auto border border-slate-800/80 rounded-lg max-h-36">
                        <table className="w-full text-left text-[11px] text-slate-400 border-collapse">
                          <thead>
                            <tr className="bg-slate-900/40 border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold">
                              <th className="p-1.5 pl-2">URL</th>
                              <th className="p-1.5">Alias</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-800/50">
                                <td className="p-1.5 pl-2 max-w-[100px] truncate" title={row.originalUrl}>{row.originalUrl}</td>
                                <td className="p-1.5 font-mono text-[10px] text-slate-300">{row.customAlias || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bulkSubmitting || bulkRows.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/25 cursor-pointer"
                  >
                    <span>{bulkSubmitting ? 'Shortening Batch...' : `Shorten ${bulkRows.length} URLs`}</span>
                  </button>
                </form>
              )}
            </div>
          )}
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
