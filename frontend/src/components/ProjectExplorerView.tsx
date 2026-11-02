import React, { useEffect, useState } from 'react';
import { fetchMetadata, fetchProjects } from '../api';
import { MetadataResponse, ProjectRecord } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  ShieldAlert,
  Percent,
  Calendar,
  IndianRupee
} from 'lucide-react';

export const ProjectExplorerView: React.FC = () => {
  const [meta, setMeta] = useState<MetadataResponse | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [totalMatched, setTotalMatched] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<string[]>([]);
  const [minProgress, setMinProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(100);

  // Pagination
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchMetadata().then(setMeta).catch(console.error);
  }, []);

  const loadData = () => {
    setLoading(true);
    fetchProjects({
      sectors: selectedSectors.length ? selectedSectors : undefined,
      states: selectedStates.length ? selectedStates : undefined,
      funding_risk: selectedRisk.length ? selectedRisk : undefined,
      min_progress: minProgress,
      max_progress: maxProgress,
      search: search.trim() ? search.trim() : undefined,
      limit,
      offset: page * limit,
    })
      .then((res) => {
        setProjects(res.projects);
        setTotalMatched(res.total_matched);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [page, selectedSectors, selectedStates, selectedRisk, minProgress, maxProgress]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadData();
  };

  const handleExportCSV = () => {
    if (!projects.length) return;
    const headers = Object.keys(projects[0]).join(',');
    const rows = projects.map((p) => Object.values(p).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `infrastructure_projects_page_${page + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSector = (sector: string) => {
    setPage(0);
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const toggleState = (state: string) => {
    setPage(0);
    setSelectedStates((prev) =>
      prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
    );
  };

  const toggleRisk = (risk: string) => {
    setPage(0);
    setSelectedRisk((prev) =>
      prev.includes(risk) ? prev.filter((r) => r !== risk) : [...prev, risk]
    );
  };

  const totalPages = Math.ceil(totalMatched / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Search className="w-6 h-6 text-indigo-400" />
            <span>Interactive Project Explorer & Inspector</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, inspect indicators, and download records across monitored infrastructure investments.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Export Current View (CSV)</span>
        </button>
      </div>

      {/* Main Layout: Left Filters, Right Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Filter Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 shadow-sm h-fit">
          <div className="flex items-center space-x-2 text-white font-semibold text-sm border-b border-slate-800 pb-3">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Filter Criteria</span>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Project ID or Title</label>
            <form onSubmit={handleSearchSubmit} className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. PRJ-IN-01005"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-medium transition"
              >
                Go
              </button>
            </form>
          </div>

          {/* Funding Risk Level */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">Funding Risk Level</label>
            <div className="flex flex-wrap gap-1.5">
              {['Low', 'Medium', 'High'].map((risk) => {
                const active = selectedRisk.includes(risk);
                return (
                  <button
                    key={risk}
                    onClick={() => toggleRisk(risk)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                      active
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {risk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical Progress Range */}
          <div>
            <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-2">
              <span>Physical Progress</span>
              <span className="text-indigo-400">{minProgress}% - {maxProgress}%</span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={minProgress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val <= maxProgress) setMinProgress(val);
                }}
                className="w-full accent-indigo-500"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={maxProgress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= minProgress) setMaxProgress(val);
                }}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          {/* Sectors */}
          {meta?.sectors && (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">Sectors</label>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 text-xs">
                {meta.sectors.map((sec) => (
                  <label key={sec} className="flex items-center space-x-2 text-slate-400 hover:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSectors.includes(sec)}
                      onChange={() => toggleSector(sec)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span className="truncate">{sec}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSearch('');
              setSelectedSectors([]);
              setSelectedStates([]);
              setSelectedRisk([]);
              setMinProgress(0);
              setMaxProgress(100);
              setPage(0);
            }}
            className="w-full py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition"
          >
            Clear All Filters
          </button>
        </div>

        {/* Right Data Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-white">{projects.length}</strong> of{' '}
              <strong className="text-indigo-400">{totalMatched.toLocaleString()}</strong> matched projects
            </span>
            <span className="font-mono">Page {page + 1} of {totalPages}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Project ID & Title</th>
                    <th className="py-3 px-3">Sector</th>
                    <th className="py-3 px-3">State</th>
                    <th className="py-3 px-3 text-right">Sanctioned (₹ Cr)</th>
                    <th className="py-3 px-3 text-right">Progress</th>
                    <th className="py-3 px-3 text-right">Elapsed</th>
                    <th className="py-3 px-3 text-center">Funding Risk</th>
                    <th className="py-3 px-3 text-right">Overrun %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p>Filtering project records...</p>
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No projects match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    projects.map((p) => {
                      const isHighOverrun = (p.cost_overrun_pct ?? 0) >= 10;
                      return (
                        <tr key={p.project_id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{p.project_name}</div>
                            <div className="text-[10px] font-mono text-indigo-400">{p.project_id}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-300">{p.sector}</td>
                          <td className="py-3 px-3 text-slate-400">{p.state}</td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-200">
                            ₹ {p.original_cost.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-semibold text-emerald-400">{p.physical_progress_pct}%</span>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-400 font-mono">
                            {p.elapsed_months} / {p.planned_duration_months} mo
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.funding_risk === 'High'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : p.funding_risk === 'Medium'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {p.funding_risk}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {p.cost_overrun_pct !== undefined ? (
                              <span className={isHighOverrun ? 'text-rose-400' : 'text-slate-300'}>
                                {p.cost_overrun_pct > 0 ? `+${p.cost_overrun_pct}%` : `${p.cost_overrun_pct}%`}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Page <strong className="text-white">{page + 1}</strong> of {totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-slate-200 flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-slate-200 flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

