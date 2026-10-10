import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  FileText,
  Download,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Calendar,
  FileSpreadsheet,
  History,
  Filter,
  TrendingUp,
  Sliders,
  Lightbulb
} from 'lucide-react';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReportsAndHistory = async () => {
    try {
      setLoading(true);
      const [repsRes, histRes] = await Promise.all([
        api.get('/reports').catch(() => ({ data: [] })),
        api.get('/reports/history-unified').catch(() => ({ data: [] })),
      ]);
      setReports(repsRes.data || []);
      setHistoryItems(histRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsAndHistory();
  }, []);

  const handleGenerateReport = async () => {
    setError('');
    setSuccess('');
    setGenerating(true);
    try {
      const res = await api.post('/reports/generate');
      setSuccess(`Report compiled: ${res.data.file_name}`);
      fetchReportsAndHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate audit report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = (id, fileName) => {
    const downloadUrl = `/api/reports/download/${id}`;
    api
      .get(downloadUrl, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => {
        alert('Could not download PDF report.');
      });
  };

  const handleExportCsv = () => {
    setExportingCsv(true);
    api
      .get('/reports/export/csv', { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `energy_telemetry_audit_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => {
        alert('Could not export CSV audit.');
      })
      .finally(() => {
        setExportingCsv(false);
      });
  };

  if (loading) {
    return <LoadingSpinner text="Loading energy reports & audit history..." />;
  }

  const filteredHistory = historyItems.filter((item) => {
    if (selectedHistoryFilter === 'ALL') return true;
    if (selectedHistoryFilter === 'PREDICTIONS') return item.type === 'Prediction Run';
    if (selectedHistoryFilter === 'SIMULATIONS') return item.type === 'Simulation Scenario';
    if (selectedHistoryFilter === 'DIRECTIVES') return item.type === 'Optimization Directive';
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            <FileCheck className="h-3 w-3" />
            Auditable Intelligence
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Energy Reports & Unified History
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Generate executive PDF audits, export raw telemetry to CSV, and inspect full chronological history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-cyan-400 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{exportingCsv ? 'Exporting...' : 'Export CSV Audit'}</span>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all hover:scale-105 disabled:opacity-50"
          >
            <FileText className={`h-4 w-4 ${generating ? 'animate-bounce' : ''}`} />
            <span>{generating ? 'Generating PDF...' : 'Compile PDF Report'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <p className="font-semibold text-rose-400">Report Generation Error</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Compiled PDF Documents Section */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-200">Compiled PDF Audit Reports</h2>

        {reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No PDF energy reports compiled yet"
            description="Click 'Compile PDF Report' to generate an executive energy audit containing consumption history, ML forecasts, anomalies, and recommendations."
            actionLabel="Compile First PDF"
            actionTo="#"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-sm shadow-lg hover:border-slate-700 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-400 border border-indigo-500/20 shrink-0">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{r.report_type}</h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.file_name}</p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadPdf(r.id, r.file_name)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-750 hover:border-emerald-500/40 transition-colors shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unified Chronological History Trail */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold text-slate-100">Unified Energy Intelligence History Log</h2>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'PREDICTIONS', label: 'Predictions' },
              { id: 'SIMULATIONS', label: 'What-If Sims' },
              { id: 'DIRECTIVES', label: 'Directives' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedHistoryFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedHistoryFilter === f.id
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No historical events recorded for this filter.</p>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {filteredHistory.map((h, idx) => (
              <div key={idx} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        h.type === 'Prediction Run'
                          ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                          : h.type === 'Simulation Scenario'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {h.type}
                    </span>
                    <span className="font-semibold text-slate-200 text-xs">{h.title}</span>
                  </div>
                  <p className="text-slate-400 text-xs pl-1">{h.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="rounded bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 border border-slate-700">
                    {h.tag}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-1">
                    {new Date(h.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
