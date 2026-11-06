import React, { useEffect, useState, useTransition } from 'react';
import { fetchMetadata, runDisasterSimulation } from '../api';
import { 
  MetadataResponse, 
  DisasterSimulationPayload, 
  DisasterSimulationResult 
} from '../types';
import { 
  ShieldAlert, 
  Flame, 
  Waves, 
  CloudRain, 
  Wind, 
  Mountain, 
  SunMedium, 
  CheckCircle, 
  Hammer, 
  FileText, 
  AlertTriangle,
  PlayCircle,
  Clock,
  Zap,
  TrendingUp,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface DisasterPreset {
  title: string;
  hazard: string;
  location: string;
  severity: string;
  sector: string;
  cost: number;
  duration: number;
  progress: number;
}

const DISASTER_PRESETS: DisasterPreset[] = [
  {
    title: 'Super Cyclone Phailin / Fani Simulation',
    hazard: 'Cyclone / Storm Surge',
    location: 'Odisha',
    severity: 'Severe (Level 3)',
    sector: 'Ports & Shipping',
    cost: 2200.0,
    duration: 48,
    progress: 45.0,
  },
  {
    title: 'Himalayan Cloudburst & Flash Flood',
    hazard: 'Flood / Cloudburst',
    location: 'Jammu & Kashmir',
    severity: 'Severe (Level 3)',
    sector: 'Roads & Highways',
    cost: 1450.0,
    duration: 36,
    progress: 55.0,
  },
  {
    title: 'High-Seismic Zone Fault Shaking',
    hazard: 'Earthquake / Seismic Tremor',
    location: 'Assam',
    severity: 'Severe (Level 3)',
    sector: 'Railways',
    cost: 3800.0,
    duration: 60,
    progress: 40.0,
  },
  {
    title: 'Western Ghats Monsoonal Landslide',
    hazard: 'Landslide / Debris Flow',
    location: 'Kerala',
    severity: 'Moderate (Level 2)',
    sector: 'Roads & Highways',
    cost: 650.0,
    duration: 24,
    progress: 60.0,
  },
];

export const DisasterSimulationView: React.FC = () => {
  const [meta, setMeta] = useState<MetadataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DisasterSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSimulate, setAutoSimulate] = useState(true);
  const [, startTransition] = useTransition();

  const [formData, setFormData] = useState<DisasterSimulationPayload>({
    sector: DISASTER_PRESETS[0].sector,
    state: DISASTER_PRESETS[0].location,
    original_cost: DISASTER_PRESETS[0].cost,
    planned_duration_months: DISASTER_PRESETS[0].duration,
    elapsed_months: 24.0,
    physical_progress_pct: DISASTER_PRESETS[0].progress,
    disaster_type: DISASTER_PRESETS[0].hazard,
    severity: DISASTER_PRESETS[0].severity,
  });

  useEffect(() => {
    fetchMetadata().then(setMeta).catch(console.error);
    executeSimulation(formData);
  }, []);

  const executeSimulation = async (payload: DisasterSimulationPayload) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await runDisasterSimulation(payload);
      setResult(resp);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof DisasterSimulationPayload, val: any) => {
    const updated = { ...formData, [field]: val };
    setFormData(updated);

    if (autoSimulate) {
      startTransition(() => {
        executeSimulation(updated);
      });
    }
  };

  const applyPreset = (preset: DisasterPreset) => {
    const updated: DisasterSimulationPayload = {
      ...formData,
      sector: preset.sector,
      state: preset.location,
      original_cost: preset.cost,
      planned_duration_months: preset.duration,
      physical_progress_pct: preset.progress,
      disaster_type: preset.hazard,
      severity: preset.severity,
    };
    setFormData(updated);
    executeSimulation(updated);
  };

  const getDisasterIcon = (type: string) => {
    if (type.includes('Flood')) return <CloudRain className="w-4 h-4 text-sky-600" />;
    if (type.includes('Earthquake')) return <Waves className="w-4 h-4 text-amber-600" />;
    if (type.includes('Cyclone')) return <Wind className="w-4 h-4 text-teal-600" />;
    if (type.includes('Landslide')) return <Mountain className="w-4 h-4 text-emerald-600" />;
    return <SunMedium className="w-4 h-4 text-rose-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Natural Disaster Simulation & Resilience Engineering
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Stress-test projects against environmental shocks, quantify fiscal remediation outlays, and view construction precautions.
          </p>
        </div>

        {/* Dynamic Controls */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50">
            <Zap className={`w-3.5 h-3.5 ${autoSimulate ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            <span className="font-medium">Live Auto-Simulate</span>
            <input
              type="checkbox"
              checked={autoSimulate}
              onChange={(e) => setAutoSimulate(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${autoSimulate ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${autoSimulate ? 'translate-x-3' : 'translate-x-0'}`} />
            </div>
          </label>

          <button
            onClick={() => applyPreset(DISASTER_PRESETS[0])}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg border border-slate-200 text-xs font-semibold shadow-sm transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Historical Hazard Presets */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Quick-Load Historical Stress Profiles:</span>
          </span>
          <span className="text-[11px] text-slate-400">One-click regional disaster simulations</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DISASTER_PRESETS.map((p) => {
            const isSelected = formData.disaster_type === p.hazard && formData.state === p.location && formData.sector === p.sector;
            return (
              <button
                key={p.title}
                onClick={() => applyPreset(p)}
                className={`text-left p-3 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/50 shadow-sm ring-1 ring-rose-500/20'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 truncate">{p.title}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>{p.location} &bull; {p.hazard.split('/')[0]}</span>
                  <span className="font-semibold text-rose-600">{p.severity.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Parameters */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <PlayCircle className="w-4 h-4 text-rose-600" />
              <span>Stress-Test Parameters</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Interactive Hazard
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Disaster Type */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Natural Disaster Shock</label>
              <select
                value={formData.disaster_type}
                onChange={(e) => handleChange('disaster_type', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 font-medium"
              >
                {meta?.disaster_types ? (
                  meta.disaster_types.map((dt) => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))
                ) : (
                  <>
                    <option value="Flood / Cloudburst">Flood / Cloudburst</option>
                    <option value="Earthquake / Seismic Tremor">Earthquake / Seismic Tremor</option>
                    <option value="Cyclone / Storm Surge">Cyclone / Storm Surge</option>
                    <option value="Landslide / Debris Flow">Landslide / Debris Flow</option>
                    <option value="Extreme Heatwave & Drought">Extreme Heatwave & Drought</option>
                  </>
                )}
              </select>
            </div>

            {/* Severity Level Buttons */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Hazard Severity / Return Period</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Minor (Level 1)',
                  'Moderate (Level 2)',
                  'Severe (Level 3)',
                  'Catastrophic (Level 4)',
                ].map((sev) => {
                  const active = formData.severity === sev;
                  return (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => handleChange('severity', sev)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition text-left ${
                        active
                          ? sev.includes('Catastrophic') || sev.includes('Severe')
                            ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                            : 'bg-amber-500 border-amber-500 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="leading-tight">{sev}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Sector */}
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

              {/* State */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Geographical State</label>
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

            <div className="grid grid-cols-2 gap-3">
              {/* Original Cost */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Sanctioned Cost (₹ Cr)</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={formData.original_cost}
                  onChange={(e) => handleChange('original_cost', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              {/* Planned Duration */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Scheduled Timeline (Mo)</label>
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

            {/* Dynamic Physical Progress Slider */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-semibold">Stage at Impact (Physical Completion)</span>
                <span className="font-bold text-rose-600 text-sm">{formData.physical_progress_pct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={formData.physical_progress_pct}
                onChange={(e) => handleChange('physical_progress_pct', parseFloat(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0% Site Prep</span>
                <span className="text-rose-600 font-semibold">Peak Exposure (25% - 70%)</span>
                <span>100% Commissioned</span>
              </div>
            </div>

            {!autoSimulate && (
              <button
                type="button"
                onClick={() => executeSimulation(formData)}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center space-x-2 text-xs transition"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Flame className="w-4 h-4" />
                )}
                <span>Simulate Natural Disaster Impact</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Damage Estimation & Engineering Precautions */}
        <div className="lg:col-span-7 space-y-5">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <strong className="block font-bold">Simulation Error:</strong>
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Damage & Outlay Metrics */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    {getDisasterIcon(result.disaster_type)}
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Damage & Schedule Slippage Assessment
                      </h2>
                      <span className="text-xs text-slate-500">
                        {result.disaster_type} &bull; {result.severity}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      result.vulnerability_tier.includes('Critical')
                        ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                        : result.vulnerability_tier.includes('Elevated')
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {result.vulnerability_tier}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Estimated Damage % */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] text-slate-500 font-semibold">Physical Damage</div>
                    <div className="text-2xl font-extrabold text-rose-600 mt-1">
                      {result.estimated_damage_pct}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Hazard multiplier: {result.hazard_multiplier}x
                    </div>
                  </div>

                  {/* Financial Outlay Cr */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] text-slate-500 font-semibold">Remediation Outlay</div>
                    <div className="text-2xl font-extrabold text-amber-600 mt-1">
                      ₹ {result.estimated_repair_cost_cr.toLocaleString()} Cr
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Reconstruction & stabilization
                    </div>
                  </div>

                  {/* Schedule Delay Months */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[11px] text-slate-500 font-semibold">Schedule Delay Added</div>
                    <div className="text-2xl font-bold text-sky-600 mt-1">
                      +{result.projected_additional_delay_months} Mo
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Downtime & clearance
                    </div>
                  </div>
                </div>

                {/* Narrative Summary */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Disaster Impact Synopsis</span>
                  </div>
                  {result.damage_description}
                </div>
              </div>

              {/* Actionable Engineering & Construction Precautions */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                    <Hammer className="w-5 h-5 text-indigo-600" />
                    <span>Proactive Precautions to Take While Building</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    BIS & MoSPI Resilience Specs
                  </span>
                </div>

                {/* 3 Categories: Planning, Structural, Operational */}
                <div className="space-y-4">
                  {/* Planning & Design Precautions */}
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Pre-Construction & Site Planning Measures</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {result.precautions.planning?.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Structural & Material Specifications */}
                  <div className="border-t border-slate-200 pt-3">
                    <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Structural & Material Resilience Engineering</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {result.precautions.structural?.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Operational Construction Safety */}
                  <div className="border-t border-slate-200 pt-3">
                    <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Active Construction Site Protocols & Emergency Warning</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {result.precautions.operational?.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
