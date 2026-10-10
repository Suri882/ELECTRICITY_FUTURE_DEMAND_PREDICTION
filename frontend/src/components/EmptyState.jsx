import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Database, ArrowRight } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Database,
  title = "No Data Found",
  description = "No electricity records yet. Log your first reading or upload historical consumption to initiate intelligence analysis.",
  actionLabel = "Add Consumption Data",
  actionTo = "/consumption/add",
  secondaryLabel,
  secondaryTo,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center sm:p-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-400 mb-4 shadow-inner">
        <Icon className="h-7 w-7 text-emerald-400" />
      </div>

      <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400 leading-relaxed">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {actionTo && actionLabel && (
          <Link
            to={actionTo}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{actionLabel}</span>
          </Link>
        )}

        {secondaryTo && secondaryLabel && (
          <Link
            to={secondaryTo}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <span>{secondaryLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
