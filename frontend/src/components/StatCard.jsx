import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  badge,
  badgeColor = 'emerald',
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'emerald':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm transition-all hover:border-slate-700/80 hover:shadow-lg hover:shadow-slate-950/40 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {badge && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getBadgeStyle()}`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate">{subtitle}</span>
        {trend && (
          <div
            className={`flex items-center font-medium ${
              trendType === 'positive'
                ? 'text-emerald-400'
                : trendType === 'negative'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {trendType === 'positive' ? (
              <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
            ) : trendType === 'negative' ? (
              <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
            ) : null}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
