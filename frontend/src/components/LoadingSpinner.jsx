import React from 'react';

export const LoadingSpinner = ({ text = 'Analyzing telemetry data...' }) => (
  <div className="flex flex-col items-center justify-center p-12 space-y-3">
    <div className="relative h-10 w-10">
      <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
      <div className="absolute inset-0 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
    </div>
    {text && <p className="text-xs text-slate-400 font-medium tracking-wide animate-pulse">{text}</p>}
  </div>
);

export const AlertBadge = ({ severity }) => {
  const normalized = (severity || 'Info').toString().toLowerCase();

  if (normalized.includes('critical') || normalized.includes('highly')) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/30">
        Critical
      </span>
    );
  }
  if (normalized.includes('warning') || normalized.includes('unusual') || normalized.includes('high')) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
        Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
      Normal
    </span>
  );
};
