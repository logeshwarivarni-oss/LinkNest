import React from 'react';
const Navbar = ({ user, onLogout }) => {
  return (
    <header className="glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-between p-2 shadow-lg shadow-indigo-500/20">
          <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
            Link<span className="text-indigo-400">Nest</span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">URL Shortening & Realtime Analytics</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 bg-slate-900/60 py-1.5 px-3 rounded-xl border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-200 hidden sm:block">
              {user.username}
            </span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="text-xs bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 transition px-3.5 py-2 rounded-xl border border-slate-700 hover:border-red-900 font-semibold shadow-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
