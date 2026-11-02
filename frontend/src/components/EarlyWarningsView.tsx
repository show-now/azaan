import React, { useEffect, useState } from 'react';
import { fetchEarlyWarnings } from '../api';
import { WarningsResponse } from '../types';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Download, 
  ShieldCheck, 
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <span>Rule-Based Early Warning Audit Feed</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic, explainable detection of infrastructure distress conditions across active projects.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 text-xs font-semibold shadow-sm transition"
        >
          <Download className="w-4 h-4 text-amber-600" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* KPI Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase flex justify-between items-center">
              <span>Total Triggered Flags</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {data.total_triggered.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active system alerts
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase flex justify-between items-center">
              <span>High Severity Alerts</span>
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-rose-600">
              {data.high_severity_count.toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-600 mt-1">
              Requires immediate MoSPI audit
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase flex justify-between items-center">
              <span>Medium Severity Alerts</span>
              <AlertOctagon className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-amber-600">
              {data.medium_severity_count.toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              Escalation warning watchlist
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 font-semibold uppercase flex justify-between items-center">
              <span>Flagged Projects</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {data.flagged_projects_count.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Unique distressed assets
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
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
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
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
            <span className="text-slate-600">Trigger Rule:</span>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:ring-1 focus:ring-indigo-500"
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
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Warning ID & Project</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Trigger Condition</th>
                <th className="py-3 px-3">Observed Value</th>
                <th className="py-3 px-3">Rule Definition</th>
                <th className="py-3 px-4">Prescribed Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Evaluating warning conditions...</p>
                  </td>
                </tr>
              ) : !data?.warnings.length ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No active warning flags match the selected criteria.
                  </td>
                </tr>
              ) : (
                data.warnings.map((w) => (
                  <tr key={`${w.project_id}-${w.warning_id}`} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <div>{w.warning_id}</div>
                      <div className="text-[10px] text-indigo-600">{w.project_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.severity === 'High'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {w.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {w.condition}
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-700">
                      {w.observed_value}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {w.threshold_rule}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-medium max-w-sm">
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
