import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner, AlertBadge } from '../components/LoadingSpinner';
import {
  History,
  Search,
  ArrowUpDown,
  Filter,
  Calendar,
  Zap,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const HistoryPage = () => {
  const [records, setRecords] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recsRes, anomRes, predsRes] = await Promise.all([
        api.get('/consumption'),
        api.get('/anomalies'),
        api.get('/predictions'),
      ]);
      setRecords(recsRes.data);
      setAnomalies(anomRes.data);
      setPredictions(predsRes.data);
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this historical record?')) return;
    try {
      await api.delete(`/consumption/${id}`);
      setRecords(records.filter((r) => r.id !== id));
    } catch (err) {
      alert('Failed to delete record.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Compiling historical consumption records..." />;
  }

  // Filter & Search
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.date.includes(searchTerm) ||
      r.units_consumed.toString().includes(searchTerm) ||
      r.bill_amount.toString().includes(searchTerm);
    return matchesSearch;
  });

  // Sort
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'date') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    if (sortAsc) {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Historical Telemetry & Audit Logs
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Search, filter, and inspect previous electricity consumption cycles
        </p>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={History}
          title="No historical electricity records"
          description="You have not logged any consumption readings yet. Records will be listed here with anomaly diagnostics and historical trends."
          actionLabel="Log First Reading"
          actionTo="/consumption/add"
        />
      ) : (
        <div className="space-y-4">
          {/* Controls: Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by date or units..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="text-xs text-slate-400">
              Showing {paginatedRecords.length} of {filteredRecords.length} records
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th
                      onClick={() => toggleSort('date')}
                      className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('units_consumed')}
                      className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Units (kWh)</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('bill_amount')}
                      className="py-3 px-4 font-semibold cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Bill Amount</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-semibold">Peak Load</th>
                    <th className="py-3 px-4 font-semibold">Anomaly Flag</th>
                    <th className="py-3 px-4 font-semibold">Effective Rate</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedRecords.map((r) => {
                    const hasAnomaly = anomalies.find(
                      (a) => a.record_id === r.id || (a.record_date && a.record_date === r.date)
                    );
                    const rate = r.units_consumed > 0 ? (r.bill_amount / r.units_consumed).toFixed(2) : '0';

                    return (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                          {new Date(r.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-400">
                          {r.units_consumed} kWh
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          ₹{r.bill_amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-amber-400">
                          {r.peak_usage} kWh ({((r.peak_usage / r.units_consumed) * 100).toFixed(0)}%)
                        </td>
                        <td className="py-3 px-4">
                          {hasAnomaly ? (
                            <AlertBadge severity={hasAnomaly.severity} />
                          ) : (
                            <span className="text-xs text-slate-500">Normal</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">₹{rate}/kWh</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
                <div>
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
