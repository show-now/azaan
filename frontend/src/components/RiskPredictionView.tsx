import React, { useEffect, useState, useTransition } from 'react';
import { fetchMetadata, runPrediction } from '../api';
import { 
  MetadataResponse, 
  PredictionApiResponse, 
  PredictionPayload 
} from '../types';
import { 
  Calculator, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  RotateCcw,
  Sliders,
  TrendingUp,
  Clock,
  DollarSign,
  Layers,
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';

interface Preset {
  name: string;
  badge: string;
  badgeColor: string;
  data: PredictionPayload;
}

const PRESETS: Preset[] = [
  {
    name: 'Distressed Coastal Highway',
    badge: 'High Risk Alert',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    data: {
      sector: 'Roads & Highways',
      state: 'Maharashtra',
      original_cost: 1250.0,
      planned_duration_months: 36,
      elapsed_months: 24.0,
      physical_progress_pct: 35.0,
      land_acquisition_pct: 60.0,
      approval_delay_months: 6.5,
      funding_risk: 'High',
      contractor_changes: 2,
      material_inflation_pct: 9.5,
    },
  },
  {
    name: 'On-Track Metro Expansion',
    badge: 'Healthy Baseline',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    data: {
      sector: 'Urban Development & Metro',
      state: 'Gujarat',
      original_cost: 3200.0,
      planned_duration_months: 48,
      elapsed_months: 24.0,
      physical_progress_pct: 54.0,
      land_acquisition_pct: 95.0,
      approval_delay_months: 0.5,
      funding_risk: 'Low',
      contractor_changes: 0,
      material_inflation_pct: 4.2,
    },
  },
  {
    name: 'Delayed Power Transmission',
    badge: 'Clearance Blocked',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    data: {
      sector: 'Power & Renewable Energy',
      state: 'Odisha',
      original_cost: 880.0,
      planned_duration_months: 30,
      elapsed_months: 18.0,
      physical_progress_pct: 42.0,
      land_acquisition_pct: 70.0,
      approval_delay_months: 5.0,
      funding_risk: 'Medium',
      contractor_changes: 1,
      material_inflation_pct: 6.8,
    },
  },
];

export const RiskPredictionView: React.FC = () => {
  const [meta, setMeta] = useState<MetadataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [, startTransition] = useTransition();

  const [formData, setFormData] = useState<PredictionPayload>(PRESETS[0].data);

  useEffect(() => {
    fetchMetadata().then(setMeta).catch(console.error);
    // Initial run on mount
    executePrediction(PRESETS[0].data);
  }, []);

  const executePrediction = async (payload: PredictionPayload) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await runPrediction(payload);
      setResult(resp);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PredictionPayload, val: any) => {
    const updated = { ...formData, [field]: val };
    setFormData(updated);

    if (autoCalculate) {
      startTransition(() => {
        executePrediction(updated);
      });
    }
  };

  const applyPreset = (preset: Preset) => {
    setFormData(preset.data);
    executePrediction(preset.data);
  };

  const resetForm = () => {
    applyPreset(PRESETS[0]);
  };

  const timelineElapsedPct = formData.planned_duration_months > 0
    ? Math.min(100, (formData.elapsed_months / formData.planned_duration_months) * 100)
    : 0;

  const progressLag = timelineElapsedPct - formData.physical_progress_pct;

  return (
    <div className="space-y-6">
      {/* Header + Dynamic Auto-Calculate Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Interactive Risk Prediction Calculator
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time inference using Models A (Cost), B (Delay), and C (Probability) with deterministic rule audit.
          </p>
        </div>

        {/* Dynamic Controls */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
            <Zap className={`w-3.5 h-3.5 ${autoCalculate ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            <span className="font-medium">Live Auto-Update</span>
            <input
              type="checkbox"
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${autoCalculate ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${autoCalculate ? 'translate-x-3' : 'translate-x-0'}`} />
            </div>
          </label>

          <button
            onClick={resetForm}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-200 text-xs font-semibold shadow-sm transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Quick-Load Realistic Scenarios:</span>
          </span>
          <span className="text-[11px] text-slate-400">One-click benchmark profiles</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {PRESETS.map((p) => {
            const isSelected = formData.sector === p.data.sector && formData.state === p.data.state && formData.original_cost === p.data.original_cost;
            return (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className={`text-left p-3 rounded-lg border transition-all text-xs flex items-center justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    ₹{p.data.original_cost} Cr &bull; {p.data.state}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${p.badgeColor}`}>
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Form with Dynamic Controls */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Project Monitoring Indicators</span>
            </h2>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
              11 Features
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Categoricals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Infrastructure Sector</label>
                <select
                  value={formData.sector}
                  onChange={(e) => handleChange('sector', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {meta?.sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">State / UT Jurisdiction</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {meta?.states.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sanctioned Cost & Duration with Instant Step buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Sanctioned Cost (₹ Cr)</label>
                  <span className="text-[11px] font-mono font-bold text-indigo-600">₹{formData.original_cost.toLocaleString()} Cr</span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={formData.original_cost}
                  onChange={(e) => handleChange('original_cost', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Planned Duration (Mo)</label>
                  <span className="text-[11px] font-mono font-bold text-indigo-600">{formData.planned_duration_months} mo</span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={formData.planned_duration_months}
                  onChange={(e) => handleChange('planned_duration_months', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Interactive Timeline vs Progress Visual Tracker */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Timeline Elapsed vs Physical Progress</span>
                </span>
                <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                  progressLag > 15
                    ? 'bg-rose-100 text-rose-700'
                    : progressLag > 5
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {progressLag > 0 ? `${progressLag.toFixed(1)}% behind schedule` : 'On or ahead of schedule'}
                </span>
              </div>

              {/* Dual progress bar */}
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                    <span>Time Elapsed: {formData.elapsed_months} / {formData.planned_duration_months} mo</span>
                    <span className="font-bold text-slate-700">{timelineElapsedPct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full transition-all duration-300" style={{ width: `${timelineElapsedPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                    <span>Physical Progress Completed</span>
                    <span className="font-bold text-emerald-600">{formData.physical_progress_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${formData.physical_progress_pct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sliders with visual color feedback */}
            <div className="space-y-3.5 pt-1">
              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span className="font-semibold">Physical Progress</span>
                  <span className="font-bold text-indigo-600">{formData.physical_progress_pct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.physical_progress_pct}
                  onChange={(e) => handleChange('physical_progress_pct', parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span className="font-semibold">Land Acquisition Progress</span>
                  <span className="font-bold text-emerald-600">{formData.land_acquisition_pct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.land_acquisition_pct}
                  onChange={(e) => handleChange('land_acquisition_pct', parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  *Acquisition below 80% triggers critical land-clearance early warning
                </span>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span className="font-semibold">Elapsed Duration (Months)</span>
                  <span className="font-bold text-sky-600">{formData.elapsed_months} Mo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(60, formData.planned_duration_months * 1.5)}
                  step="0.5"
                  value={formData.elapsed_months}
                  onChange={(e) => handleChange('elapsed_months', parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Approval Clearance Delay (Mo)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.approval_delay_months}
                    onChange={(e) => handleChange('approval_delay_months', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Material Inflation Escalation (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.material_inflation_pct}
                    onChange={(e) => handleChange('material_inflation_pct', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Risk Level & Contractor Replacements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Funding Risk Rating</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['Low', 'Medium', 'High'].map((r) => {
                      const active = formData.funding_risk === r;
                      return (
                        <button
                          type="button"
                          key={r}
                          onClick={() => handleChange('funding_risk', r)}
                          className={`py-1.5 rounded text-xs font-semibold border transition ${
                            active
                              ? r === 'High'
                                ? 'bg-rose-600 border-rose-600 text-white'
                                : r === 'Medium'
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contractor Changes</label>
                  <div className="flex items-center space-x-2">
                    {[0, 1, 2, 3].map((num) => {
                      const active = formData.contractor_changes === num;
                      return (
                        <button
                          type="button"
                          key={num}
                          onClick={() => handleChange('contractor_changes', num)}
                          className={`flex-1 py-1.5 rounded text-xs font-semibold border transition ${
                            active
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {num === 3 ? '3+' : num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {!autoCalculate && (
              <button
                type="button"
                onClick={() => executePrediction(formData)}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2 text-xs transition"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Run Multi-Model Prediction & Diagnostic Audit</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Dynamic Live Prediction & Early Warning Display */}
        <div className="lg:col-span-6 space-y-5">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <strong className="block font-bold">Prediction Failed:</strong>
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Outcome Header & Status Banner */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Executive Risk Classification
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      {result.prediction.risk_level === 'High'
                        ? 'High Overrun Risk & Potential Distress'
                        : result.prediction.risk_level === 'Medium'
                        ? 'Moderate Slippage / Watchlist'
                        : 'Low Risk / Controlled Delivery'}
                    </h2>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      result.prediction.risk_level === 'High'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                        : result.prediction.risk_level === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    Level: {result.prediction.risk_level}
                  </span>
                </div>

                {/* 3 Core Output Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Model A */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition">
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                      <span>Model A: Cost Overrun</span>
                      <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {result.prediction.predicted_cost_overrun_pct > 0 ? `+${result.prediction.predicted_cost_overrun_pct.toFixed(1)}%` : `${result.prediction.predicted_cost_overrun_pct.toFixed(1)}%`}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 font-mono">
                      ₹ {result.prediction.estimated_final_cost.toLocaleString()} Cr final
                    </div>
                  </div>

                  {/* Model B */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition">
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                      <span>Model B: Delay</span>
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="text-2xl font-extrabold text-amber-600 mt-1">
                      +{result.prediction.predicted_delay_months.toFixed(1)} Mo
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Schedule extension
                    </div>
                  </div>

                  {/* Model C */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition">
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                      <span>Model C: Overrun Risk</span>
                      <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                      {(result.prediction.overrun_risk_probability * 100).toFixed(0)}%
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Probability &ge; 10%
                    </div>
                  </div>
                </div>

                {/* Overrun probability gauge bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>High Overrun Threshold Probability (&ge;10%)</span>
                    <span className="font-bold text-slate-900">
                      {(result.prediction.overrun_risk_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.prediction.overrun_risk_probability >= 0.5
                          ? 'bg-rose-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, result.prediction.overrun_risk_probability * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Cost Escalation Delta Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Financial Slippage Breakdown</span>
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500 text-[11px]">Sanctioned Baseline Outlay</div>
                    <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                      ₹ {formData.original_cost.toLocaleString()} Cr
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg">
                    <div className="text-rose-700 text-[11px]">Estimated Additional Capital</div>
                    <div className="text-lg font-bold text-rose-600 mt-0.5 font-mono">
                      +₹ {Math.max(0, result.prediction.estimated_final_cost - formData.original_cost).toLocaleString(undefined, { maximumFractionDigits: 1 })} Cr
                    </div>
                  </div>
                </div>
              </div>

              {/* Early Warning Explanations & Recommendations */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Rule-Based Early Warning Audit</span>
                  </h3>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                    {result.early_warnings?.length || 0} Triggered Rules
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-slate-900">{result.executive_summary?.status || 'Assessed'}</div>
                  <div className="text-slate-600 leading-relaxed">{result.executive_summary?.summary_text || ''}</div>
                </div>

                {/* Audit Findings from early warnings */}
                {result.early_warnings && result.early_warnings.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Detected Execution Distress Triggers:
                    </h4>
                    <div className="space-y-2">
                      {result.early_warnings.map((w, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{w.condition}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              w.severity === 'High'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {w.severity} Severity
                            </span>
                          </div>
                          <div className="text-slate-600 font-mono text-[11px]">
                            {w.observed_value} &bull; Rule: {w.threshold_rule}
                          </div>
                          <div className="text-emerald-700 text-[11px] font-medium pt-1 border-t border-slate-200/60">
                            Suggested Action: {w.suggested_action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No critical early warning thresholds breached. Indicators align with standard delivery benchmarks.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
