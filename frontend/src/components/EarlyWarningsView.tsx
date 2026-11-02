import React, { useEffect, useState } from 'react';
import { fetchEarlyWarnings } from '../api';
import { EarlyWarningAlert, WarningsResponse } from '../types';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Filter, 
  Download, 
  ShieldCheck, 
  ChevronRight,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

export const EarlyWarningsView: React.FC = () => {
  const [data, setData] = useState<WarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(['High', 'Medium']);
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');

  const loadWarnings = () => {
    setLoading(true);
    fetchEarlyWarnings({
      severity: selectedSeverities.length ? selectedSeverities : undefined,
      condition: selectedCondition !== 'ALL' ? [selectedCondition] : undefined,
      limit: 200,
    })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadWarnings();
  }, [selectedSeverities, selectedCondition]);

  const toggleSeverity = (sev: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  const handleExportCSV = () => {
    if (!data?.warnings.length) return;
    const headers = Object.keys(data.warnings[0]).join(',');
    const rows = data.warnings.map((w) => Object.values(w).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'early_warnings_audit_feed.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <span>Rule-Based Early Warning Audit Feed</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic, explainable detection of infrastructure distress conditions across active projects.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* KPI Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase flex justify-between items-center">
              <span>Total Triggered Flags</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              {data.total_triggered.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active system alerts
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase flex justify-between items-center">
              <span>High Severity Alerts</span>
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-rose-400">
              {data.high_severity_count.toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-300/80 mt-1">
              Requires immediate MoSPI audit
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase flex justify-between items-center">
              <span>Medium Severity Alerts</span>
              <AlertOctagon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-amber-400">
              {data.medium_severity_count.toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-300/80 mt-1">
              Escalation warning watchlist
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold uppercase flex justify-between items-center">
              <span>Flagged Projects</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-white">
              {data.flagged_projects_count.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Unique distressed assets
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>Filter Feed:</span>
          </div>

          {/* Severity Buttons */}
          <div className="flex items-center space-x-1.5">
            {['High', 'Medium'].map((sev) => {
              const active = selectedSeverities.includes(sev);
              return (
                <button
                  key={sev}
                  onClick={() => toggleSeverity(sev)}
                  className={`px-3 py-1 rounded text-xs font-semibold border transition ${
                    active
                      ? sev === 'High'
                        ? 'bg-rose-950 border-rose-800 text-rose-300'
                        : 'bg-amber-950 border-amber-800 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {sev} Severity
                </button>
              );
            })}
          </div>
        </div>

        {/* Condition Dropdown */}
        {data?.available_conditions && (
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Trigger Rule:</span>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Trigger Rules</option>
              {data.available_conditions.map((cond) => (
                <option key={cond} value={cond}>{cond}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Warning ID & Project</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Trigger Condition</th>
                <th className="py-3 px-3">Observed Value</th>
                <th className="py-3 px-3">Rule Definition</th>
                <th className="py-3 px-4">Prescribed Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Evaluating warning conditions...</p>
                  </td>
                </tr>
              ) : !data?.warnings.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No active warning flags match the selected criteria.
                  </td>
                </tr>
              ) : (
                data.warnings.map((w) => (
                  <tr key={`${w.project_id}-${w.warning_id}`} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      <div>{w.warning_id}</div>
                      <div className="text-[10px] text-indigo-400">{w.project_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.severity === 'High'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {w.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {w.condition}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-300">
                      {w.observed_value}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {w.threshold_rule}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-medium max-w-sm">
                      {w.suggested_action}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

