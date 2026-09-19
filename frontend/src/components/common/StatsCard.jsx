import React from 'react';

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  colorScheme = 'indigo',
  subtext,
  isLoading = false,
}) => {
  const schemeStyles = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      glow: 'group-hover:border-indigo-200',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      glow: 'group-hover:border-emerald-200',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      glow: 'group-hover:border-amber-200',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      glow: 'group-hover:border-slate-300',
    },
  };

  const currentScheme = schemeStyles[colorScheme] || schemeStyles.indigo;

  return (
    <div
      className={`group relative bg-white p-5 rounded-2xl border ${currentScheme.border} shadow-sm transition-all duration-200 hover:shadow-md ${currentScheme.glow}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse my-1"></div>
          ) : (
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          )}
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${currentScheme.bg} ${currentScheme.text}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
