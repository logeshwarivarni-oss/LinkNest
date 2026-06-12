import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
  const colorMap = {
    indigo: 'from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-400'
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className={`glass-card p-6 rounded-2xl flex items-center justify-between bg-gradient-to-br ${selectedColor}`}>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <span className="text-3xl font-extrabold text-white tracking-tight block">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
