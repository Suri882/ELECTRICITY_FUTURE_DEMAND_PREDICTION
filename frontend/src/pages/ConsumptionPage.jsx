import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  Zap,
  PlusCircle,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Trash2,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';

const ConsumptionPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'upload'
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/consumption');
      setRecords(res.data);
    } catch (err) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consumption record?')) return;
    try {
      await api.delete(`/consumption/${id}`);
      setRecords(records.filter((r) => r.id !== id));
    } catch (err) {
      alert('Failed to delete record.');
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.toLowerCase().endsWith('.csv')) {
      setFile(selected);
      setUploadError('');
    } else {
      setFile(null);
      setUploadError('Please select a valid .csv file.');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a CSV file to upload.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSummary(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/consumption/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSummary(res.data);
      fetchRecords();
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'CSV upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      'date,units_consumed,bill_amount,number_of_days,peak_usage\n' +
      '2026-01-15,380.50,2660.00,30,95.00\n' +
      '2026-02-15,412.00,2884.00,30,105.50\n' +
      '2026-03-15,445.00,3115.00,30,122.00\n' +
      '2026-04-15,488.50,3420.00,30,140.00\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_electricity_consumption.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Electricity Consumption Telemetry
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Manage your historical readings and import batch CSV records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Download sample CSV format"
          >
            <Download className="h-4 w-4" />
            <span>Sample CSV</span>
          </button>

          <Link
            to="/consumption/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:from-emerald-400 hover:to-teal-400 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Single Log</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition-colors ${
            activeTab === 'list'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Consumption Logs ({records.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          <span>Batch CSV Upload</span>
        </button>
      </div>

      {/* Tab 1: Records Table */}
      {activeTab === 'list' && (
        <>
          {loading ? (
            <LoadingSpinner text="Retrieving consumption logs..." />
          ) : records.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No consumption records found"
              description="Welcome! Add your first electricity record or upload a batch CSV dataset to begin predictive demand analysis and anomaly tracking."
              actionLabel="Add Electricity Record"
              actionTo="/consumption/add"
              secondaryLabel="Upload CSV"
              secondaryTo="/consumption"
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Date</th>
                      <th className="py-3.5 px-4 font-semibold">Units (kWh)</th>
                      <th className="py-3.5 px-4 font-semibold">Bill Amount</th>
                      <th className="py-3.5 px-4 font-semibold">Cycle</th>
                      <th className="py-3.5 px-4 font-semibold">Peak Usage</th>
                      <th className="py-3.5 px-4 font-semibold">Avg Rate</th>
                      <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {records.map((r) => {
                      const rate = r.units_consumed > 0 ? (r.bill_amount / r.units_consumed).toFixed(2) : '0';
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-white">
                            {new Date(r.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 font-semibold text-emerald-400">
                            {r.units_consumed} kWh
                          </td>
                          <td className="py-3 px-4 text-slate-200">₹{r.bill_amount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-slate-400">{r.number_of_days} days</td>
                          <td className="py-3 px-4 text-amber-400">{r.peak_usage} kWh</td>
                          <td className="py-3 px-4 text-slate-400">₹{rate}/kWh</td>
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
            </div>
          )}
        </>
      )}

      {/* Tab 2: Batch CSV Upload */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-sm shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Upload Consumption CSV</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Upload multiple monthly readings at once. The system will perform strict validation,
              detect duplicate entries, verify positive values, and extract features for machine learning.
            </p>

            {uploadError && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/80 p-8 text-center hover:border-emerald-500/50 transition-colors">
                <UploadCloud className="mx-auto h-10 w-10 text-emerald-400 mb-3" />
                <p className="text-sm font-medium text-slate-200">
                  {file ? file.name : 'Choose a .csv file or drag and drop'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Columns: date, units_consumed, bill_amount, number_of_days, peak_usage</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="mt-4 inline-block rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer transition-colors"
                >
                  Browse File
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Sample CSV Template</span>
                </button>

                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
                >
                  {uploading ? 'Validating & Ingesting...' : 'Upload & Process CSV'}
                </button>
              </div>
            </form>
          </div>

          {/* Upload Summary Modal / Section (Section 12) */}
          {uploadSummary && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
              <h4 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span>Upload Processing Summary</span>
              </h4>

              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="text-xl font-bold text-white">{uploadSummary.total_rows}</div>
                  <div className="text-[11px] text-slate-400">Total Rows</div>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <div className="text-xl font-bold text-emerald-400">{uploadSummary.successful_rows}</div>
                  <div className="text-[11px] text-slate-400">Successful</div>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                  <div className="text-xl font-bold text-rose-400">{uploadSummary.failed_rows}</div>
                  <div className="text-[11px] text-slate-400">Failed / Duplicate</div>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-4">{uploadSummary.message}</p>

              {uploadSummary.error_details && uploadSummary.error_details.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <h5 className="text-xs font-semibold text-rose-400 mb-2 uppercase tracking-wider">
                    Validation Details & Flagged Rows
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-400 max-h-48 overflow-y-auto">
                    {uploadSummary.error_details.map((err, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-400 shrink-0">•</span>
                        <span>
                          Row {err.row} [{err.field}]: {err.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsumptionPage;
