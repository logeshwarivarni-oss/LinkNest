import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Copy, Check } from 'lucide-react';

const QRModal = ({ isOpen, onClose, shortUrl, shortCode }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `qr-code-${shortCode}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-5 pt-2">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">QR Code</h3>
            <p className="text-xs text-slate-400">Scan to visit shortened URL</p>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-200">
            <QRCodeCanvas
              id="qr-code-canvas"
              value={shortUrl}
              size={180}
              level={"H"}
              includeMargin={false}
            />
          </div>

          <div className="w-full space-y-3">
            {/* Short URL field with Copy */}
            <div className="flex items-center justify-between bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 text-sm">
              <span className="text-slate-300 font-mono select-all truncate max-w-[200px]">
                {shortUrl}
              </span>
              <button
                onClick={handleCopy}
                className="text-indigo-400 hover:text-indigo-300 transition p-1.5 hover:bg-slate-900 rounded-lg"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/25"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRModal;
