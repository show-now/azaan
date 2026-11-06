import React, { useEffect, useState } from 'react';
import { fetchMetadata, fetchProjects, createProject } from '../api';
import { MetadataResponse, ProjectRecord } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Building2,
  Calendar,
  IndianRupee,
  Activity,
  Layers
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

  // Quick preset filter
  const [activeFilterPreset, setActiveFilterPreset] = useState<'all' | 'distressed' | 'high_capital' | 'recent'>('all');

  // Selected project for inspection drawer
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);

  // New Project Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [newProject, setNewProject] = useState({
    project_id: '',
    project_name: '',
    sector: 'Roads & Highways',
    state: 'Maharashtra',
    original_cost: 500.0,
    planned_duration_months: 36,
    elapsed_months: 6.0,
    physical_progress_pct: 15.0,
    land_acquisition_pct: 80.0,
    approval_delay_months: 1.0,
    funding_risk: 'Low',
    contractor_changes: 0,
    material_inflation_pct: 5.0,
  });

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

  // Debounced search when user types
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleFilterPreset = (preset: 'all' | 'distressed' | 'high_capital' | 'recent') => {
    setActiveFilterPreset(preset);
    setPage(0);
    if (preset === 'all') {
      setSelectedRisk([]);
      setMinProgress(0);
      setMaxProgress(100);
      setSearch('');
    } else if (preset === 'distressed') {
      setSelectedRisk(['High']);
      setMinProgress(0);
      setMaxProgress(60);
    } else if (preset === 'high_capital') {
      setSelectedRisk([]);
      setMinProgress(0);
      setMaxProgress(100);
      // Trigger search filter
    } else if (preset === 'recent') {
      setMinProgress(0);
      setMaxProgress(30);
      setSelectedRisk([]);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await createProject(newProject);
      setFormSuccess(res.message);
      loadData();
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
        setNewProject({
          project_id: '',
          project_name: '',
          sector: 'Roads & Highways',
          state: 'Maharashtra',
          original_cost: 500.0,
          planned_duration_months: 36,
          elapsed_months: 6.0,
          physical_progress_pct: 15.0,
          land_acquisition_pct: 80.0,
          approval_delay_months: 1.0,
          funding_risk: 'Low',
          contractor_changes: 0,
          material_inflation_pct: 5.0,
        });
      }, 1200);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Search className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Interactive Project Explorer & Inspector
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, inspect indicators, view deep-dive project audits, and register monitored assets.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-300 text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Export View (CSV)</span>
          </button>
        </div>
      </div>

      {/* Dynamic Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] flex items-center space-x-1 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Quick Views:</span>
        </span>
        <button
          onClick={() => handleFilterPreset('all')}
          className={`px-3 py-1.5 rounded-full font-medium transition shrink-0 ${
            activeFilterPreset === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Projects ({totalMatched.toLocaleString()})
        </button>
        <button
          onClick={() => handleFilterPreset('distressed')}
          className={`px-3 py-1.5 rounded-full font-medium transition shrink-0 ${
            activeFilterPreset === 'distressed'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          High Risk & Lagging (&lt;60% progress)
        </button>
        <button
          onClick={() => handleFilterPreset('recent')}
          className={`px-3 py-1.5 rounded-full font-medium transition shrink-0 ${
            activeFilterPreset === 'recent'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Early Stage (&lt;30% progress)
        </button>
      </div>

      {/* Main Layout: Left Filters, Right Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Filter Sidebar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-sm h-fit">
          <div className="flex items-center justify-between text-slate-900 font-semibold text-sm border-b border-slate-200 pb-3">
            <span className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>Filter Criteria</span>
            </span>
            {(selectedSectors.length > 0 || selectedRisk.length > 0 || search || minProgress > 0 || maxProgress < 100) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedSectors([]);
                  setSelectedStates([]);
                  setSelectedRisk([]);
                  setMinProgress(0);
                  setMaxProgress(100);
                  setActiveFilterPreset('all');
                  setPage(0);
                }}
                className="text-[11px] text-indigo-600 hover:underline font-normal"
              >
                Reset
              </button>
            )}
          </div>

          {/* Instant Search Query */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Live Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, name, corridor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Funding Risk Level */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Funding Risk Level</label>
            <div className="flex flex-wrap gap-1.5">
              {['Low', 'Medium', 'High'].map((risk) => {
                const active = selectedRisk.includes(risk);
                return (
                  <button
                    key={risk}
                    onClick={() => toggleRisk(risk)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                      active
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {risk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical Progress Range Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
              <span>Physical Progress</span>
              <span className="text-indigo-600 font-bold font-mono">{minProgress}% - {maxProgress}%</span>
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
                className="w-full accent-indigo-600 cursor-pointer"
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
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Sectors Checkboxes */}
          {meta?.sectors && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">Infrastructure Sectors</label>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 text-xs">
                {meta.sectors.map((sec) => (
                  <label key={sec} className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 cursor-pointer p-1 rounded hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      checked={selectedSectors.includes(sec)}
                      onChange={() => toggleSector(sec)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="truncate">{sec}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Data Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{projects.length}</strong> of{' '}
              <strong className="text-indigo-600">{totalMatched.toLocaleString()}</strong> matched projects
            </span>
            <span className="font-mono text-slate-400">Page {page + 1} of {totalPages}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Project ID & Title</th>
                    <th className="py-3 px-3">Sector</th>
                    <th className="py-3 px-3">State</th>
                    <th className="py-3 px-3 text-right">Sanctioned</th>
                    <th className="py-3 px-3 text-right">Progress</th>
                    <th className="py-3 px-3 text-right">Elapsed</th>
                    <th className="py-3 px-3 text-center">Funding Risk</th>
                    <th className="py-3 px-3 text-right">Overrun %</th>
                    <th className="py-3 px-3 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p>Filtering project records...</p>
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No projects match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    projects.map((p) => {
                      const isHighOverrun = (p.cost_overrun_pct ?? 0) >= 10;
                      return (
                        <tr 
                          key={p.project_id} 
                          onClick={() => setSelectedProject(p)}
                          className="hover:bg-indigo-50/40 cursor-pointer transition group"
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition">{p.project_name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{p.project_id}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700">{p.sector}</td>
                          <td className="py-3 px-3 text-slate-500">{p.state}</td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                            ₹ {p.original_cost.toLocaleString()} Cr
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${p.physical_progress_pct}%` }} />
                              </div>
                              <span className="font-semibold text-emerald-600 font-mono">{p.physical_progress_pct}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500 font-mono">
                            {p.elapsed_months}/{p.planned_duration_months} mo
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.funding_risk === 'High'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : p.funding_risk === 'Medium'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {p.funding_risk}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {p.cost_overrun_pct !== undefined ? (
                              <span className={isHighOverrun ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                                {p.cost_overrun_pct > 0 ? `+${p.cost_overrun_pct}%` : `${p.cost_overrun_pct}%`}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(p);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Inspect Project Indicators"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Page <strong className="text-slate-900">{page + 1}</strong> of {totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded border border-slate-200 text-slate-700 flex items-center space-x-1 transition shadow-sm"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed rounded border border-slate-200 text-slate-700 flex items-center space-x-1 transition shadow-sm"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Project Inspection Slide-over / Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-[11px] font-mono text-indigo-600 font-bold">{selectedProject.project_id}</div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedProject.project_name}</h3>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 text-[11px]">Sector & Jurisdiction</div>
                <div className="font-bold text-slate-900 mt-0.5">{selectedProject.sector}</div>
                <div className="text-slate-600 mt-0.5">{selectedProject.state}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-slate-500 text-[11px]">Sanctioned Outlay</div>
                <div className="font-bold text-slate-900 mt-0.5 font-mono text-base">
                  ₹ {selectedProject.original_cost.toLocaleString()} Cr
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Est. Final: ₹ {selectedProject.actual_final_cost?.toLocaleString() || selectedProject.original_cost.toLocaleString()} Cr
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs border-t border-slate-200 pt-4">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                Monitoring Status Indicators
              </h4>
              
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Physical Progress</div>
                  <div className="font-bold text-emerald-600 text-sm mt-0.5">{selectedProject.physical_progress_pct}%</div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Land Acquisition</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedProject.land_acquisition_pct}%</div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Clearance Delays</div>
                  <div className="font-bold text-amber-600 text-sm mt-0.5">{selectedProject.approval_delay_months} Mo</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Elapsed Timeline</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {selectedProject.elapsed_months}/{selectedProject.planned_duration_months} mo
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Contractor Changes</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{selectedProject.contractor_changes}</div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Funding Risk</div>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{selectedProject.funding_risk}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Add New Infrastructure Project</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Project ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank (e.g. PRJ-IN-03001)"
                    value={newProject.project_id}
                    onChange={(e) => setNewProject({ ...newProject, project_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Project Name / Corridor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NH-Expwy Eastern Bypass Phase 2"
                    value={newProject.project_name}
                    onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Sector *</label>
                  <select
                    value={newProject.sector}
                    onChange={(e) => setNewProject({ ...newProject, sector: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  >
                    {meta?.sectors.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">State / UT *</label>
                  <select
                    value={newProject.state}
                    onChange={(e) => setNewProject({ ...newProject, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  >
                    {meta?.states.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Sanctioned Cost (₹ Cr) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={newProject.original_cost}
                    onChange={(e) => setNewProject({ ...newProject, original_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Scheduled Timeline (Months) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={newProject.planned_duration_months}
                    onChange={(e) => setNewProject({ ...newProject, planned_duration_months: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Elapsed Time (Months)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newProject.elapsed_months}
                    onChange={(e) => setNewProject({ ...newProject, elapsed_months: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Clearance / Approval Delay (Months)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newProject.approval_delay_months}
                    onChange={(e) => setNewProject({ ...newProject, approval_delay_months: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Physical Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={newProject.physical_progress_pct}
                    onChange={(e) => setNewProject({ ...newProject, physical_progress_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Land Acquisition Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={newProject.land_acquisition_pct}
                    onChange={(e) => setNewProject({ ...newProject, land_acquisition_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Funding Risk Rating</label>
                  <select
                    value={newProject.funding_risk}
                    onChange={(e) => setNewProject({ ...newProject, funding_risk: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  >
                    {['Low', 'Medium', 'High'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Contractor Replacements</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={newProject.contractor_changes}
                    onChange={(e) => setNewProject({ ...newProject, contractor_changes: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  <span>Register & Save Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
