import React, { useEffect, useState } from 'react';
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
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  Info
} from 'lucide-react';

export const RiskPredictionView: React.FC = () => {
  const [meta, setMeta] = useState<MetadataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State initialized with realistic project values
  const [formData, setFormData] = useState<PredictionPayload>({
    sector: 'Roads & Highways',
    state: 'Maharashtra',
    original_cost: 750.0,
    planned_duration_months: 36,
    elapsed_months: 20.0,
    physical_progress_pct: 38.0,
    land_acquisition_pct: 65.0,
    approval_delay_months: 4.5,
    funding_risk: 'Medium',
    contractor_changes: 1,
    material_inflation_pct: 7.2,
  });

  useEffect(() => {
    fetchMetadata().then(setMeta).catch(console.error);
  }, []);

  const handleChange = (field: keyof PredictionPayload, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await runPrediction(formData);
      setResult(resp);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <Calculator className="w-6 h-6 text-indigo-400" />
          <span>Real-Time Project Risk Prediction & Early Warning Calculator</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Estimate cost overrun % (Model A), schedule delay (Model B), overrun probability (Model C), and trigger automated rule audits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>1. Project Input Indicators</span>
            <span className="text-[11px] font-normal text-slate-400">MoSPI Monitoring Parameters</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Sector */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Infrastructure Sector</label>
              <select
                value={formData.sector}
                onChange={(e) => handleChange('sector', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
              >
                {meta?.sectors.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">State / UT Jurisdiction</label>
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
              >
                {meta?.states.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Original Cost */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Sanctioned Baseline Cost (₹ Cr)</label>
              <input
                type="number"
                min="1"
                step="10"
                value={formData.original_cost}
                onChange={(e) => handleChange('original_cost', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Planned Duration */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Planned Duration (Months)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.planned_duration_months}
                onChange={(e) => handleChange('planned_duration_months', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Elapsed Months */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Elapsed Duration (Months)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.elapsed_months}
                onChange={(e) => handleChange('elapsed_months', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Approval Delay */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Clearance / Approval Delay (Mo)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.approval_delay_months}
                onChange={(e) => handleChange('approval_delay_months', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Funding Risk Level */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Funding Risk Rating</label>
              <select
                value={formData.funding_risk}
                onChange={(e) => handleChange('funding_risk', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
              >
                {['Low', 'Medium', 'High'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Contractor Changes */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Contractor Replacements</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.contractor_changes}
                onChange={(e) => handleChange('contractor_changes', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Sliders for percentages */}
          <div className="space-y-4 pt-2 border-t border-slate-800 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Physical Progress Achieved</span>
                <span className="font-bold text-indigo-400">{formData.physical_progress_pct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={formData.physical_progress_pct}
                onChange={(e) => handleChange('physical_progress_pct', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Land Acquisition Progress</span>
                <span className="font-bold text-emerald-400">{formData.land_acquisition_pct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={formData.land_acquisition_pct}
                onChange={(e) => handleChange('land_acquisition_pct', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Observed Material Escalation Rate</span>
                <span className="font-bold text-amber-400">{formData.material_inflation_pct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.1"
                value={formData.material_inflation_pct}
                onChange={(e) => handleChange('material_inflation_pct', parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 text-xs transition"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Run Multi-Model Prediction & Diagnostic Audit</span>
          </button>
        </form>

        {/* Prediction Results Display */}
        <div className="lg:col-span-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-200 text-xs">
              <strong className="block font-bold">Prediction Failed:</strong>
              {error}
            </div>
          )}

          {!result && !loading && (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center text-slate-400 h-full min-h-[420px]">
              <div className="p-4 bg-slate-800/60 rounded-full mb-3">
                <Calculator className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-white text-base">Awaiting Project Simulation</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Configure indicators on the left and click "Run Multi-Model Prediction" to synthesize ML forecasts from Models A, B, and C.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Prediction Cards */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-base font-semibold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                  <span>2. Multi-Model Forecast Outputs</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      result.prediction.risk_level === 'High'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : result.prediction.risk_level === 'Medium'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    Risk Level: {result.prediction.risk_level}
                  </span>
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {/* Model A */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                    <div className="text-[11px] text-slate-400 font-medium">Model A: Cost Overrun</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {result.prediction.predicted_cost_overrun_pct.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Est. Final: <strong className="text-indigo-300">₹ {result.prediction.estimated_final_cost.toLocaleString()} Cr</strong>
                    </div>
                  </div>

                  {/* Model B */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                    <div className="text-[11px] text-slate-400 font-medium">Model B: Delay Forecast</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1">
                      {result.prediction.predicted_delay_months.toFixed(1)} mo
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Schedule slippage estimate
                    </div>
                  </div>

                  {/* Model C */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg col-span-2">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                      <span>Model C: High Overrun Probability (&ge;10% Overrun)</span>
                      <span className="font-bold text-white">
                        {(result.prediction.overrun_risk_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          result.prediction.overrun_risk_probability >= 0.5
                            ? 'bg-rose-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, result.prediction.overrun_risk_probability * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Early Warning Explanations & Recommendations */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <span>3. Executive Early Warning Diagnosis</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {result.early_warnings.length} Active Rules Triggered
                  </span>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                  <div className="text-xs font-bold text-white">{result.executive_summary.status}</div>
                  <div className="text-xs text-slate-300 mt-1">{result.executive_summary.headline}</div>
                </div>

                {/* Audit Findings */}
                {result.executive_summary.findings.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Key Root Causes Detected
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-400">
                      {result.executive_summary.findings.map((f, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {result.executive_summary.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Prescriptive Interventions
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-400">
                      {result.executive_summary.recommendations.map((r, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-slate-200">{r}</span>
                        </li>
                      ))}
                    </ul>
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

