import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner, AlertBadge } from '../components/LoadingSpinner';
import { AlertTriangle, ShieldAlert, CheckCircle2, Info, Calendar, Zap } from 'lucide-react';

const AnomaliesPage = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        setLoading(true);
        const res = await api.get('/anomalies');
        setAnomalies(res.data);
      } catch (err) {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Screening telemetry for statistical anomalies..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl flex items-center gap-2.5">
          <span>Consumption Anomaly Detection</span>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
            Statistical Engine
          </span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Z-score standard deviation and peak-load ratio monitoring to isolate unusual consumption events
        </p>
      </div>

      {/* Safety Policy Notice (Section 17) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 flex items-start gap-3">
        <Info className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
        <p>
          <strong>Notice on Diagnostic Terminology:</strong> In accordance with energy compliance standards,
          deviations are flagged as <em>Unusual consumption detected</em>. Physical inspections and appliance
          audits are recommended to verify sub-metering or wiring integrity.
        </p>
      </div>

      {/* Anomalies List */}
      {anomalies.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Zero Anomalies Detected"
          description="All recorded billing cycles fall within normal statistical limits and standard deviations. No surge anomalies or abnormal peak loads have been flagged."
          actionLabel="Log New Reading"
          actionTo="/consumption/add"
        />
      ) : (
        <div className="space-y-4">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 backdrop-blur-sm shadow-lg hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`rounded-lg p-2 ${
                      anom.severity === 'Highly Unusual'
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Unusual Consumption Event</span>
                      <AlertBadge severity={anom.severity} />
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                      {anom.record_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Date: {anom.record_date}</span>
                        </span>
                      )}
                      {anom.record_units && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Zap className="h-3 w-3" />
                          <span>Billed: {anom.record_units} kWh</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:text-right">
                  <div className="rounded-xl bg-slate-950 px-3 py-1.5 border border-slate-800">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Anomaly Score</div>
                    <div className="text-sm font-bold text-amber-400">
                      {(anom.anomaly_score * 100).toFixed(1)}% ({anom.anomaly_score})
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Engine Explanation & Root Cause
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  {anom.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnomaliesPage;
