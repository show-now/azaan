import React, { useEffect, useState } from 'react';
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
  Layers
} from 'lucide-react';

export const DisasterSimulationView: React.FC = () => {
  const [meta, setMeta] = useState<MetadataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DisasterSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form input state
  const [formData, setFormData] = useState<DisasterSimulationPayload>({
    sector: 'Ports & Shipping',
    state: 'Odisha',
    original_cost: 1500.0,
    planned_duration_months: 48,
    elapsed_months: 24.0,
    physical_progress_pct: 45.0,
    disaster_type: 'Cyclone / Storm Surge',
    severity: 'Severe (Level 3)',
  });

  useEffect(() => {
    fetchMetadata().then(setMeta).catch(console.error);
  }, []);

  const handleChange = (field: keyof DisasterSimulationPayload, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await runDisasterSimulation(formData);
      setResult(resp);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper icons for disaster type
  const getDisasterIcon = (type: string) => {
    if (type.includes('Flood')) return <CloudRain className="w-4 h-4 text-sky-400" />;
    if (type.includes('Earthquake')) return <Waves className="w-4 h-4 text-amber-400" />;
    if (type.includes('Cyclone')) return <Wind className="w-4 h-4 text-teal-400" />;
    if (type.includes('Landslide')) return <Mountain className="w-4 h-4 text-emerald-400" />;
    return <SunMedium className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
          <span>Natural Disaster Simulation & Resilience Engineering</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Stress-test projects against environmental shocks (floods, cyclones, seismic tremors, landslides, heatwaves), quantify physical damage and fiscal remediation outlays, and view construction precautions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Simulation Setup */}
        <form onSubmit={handleSimulate} className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <PlayCircle className="w-4 h-4 text-indigo-400" />
              <span>1. Stress-Test Parameters</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Hazard Profile</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Disaster Type */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Natural Disaster Shock</label>
              <select
                value={formData.disaster_type}
                onChange={(e) => handleChange('disaster_type', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
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

            {/* Severity Level */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Hazard Severity / Return Period</label>
              <select
                value={formData.severity}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
              >
                {meta?.disaster_severities ? (
                  meta.disaster_severities.map((sev) => (
                    <option key={sev} value={sev}>{sev}</option>
                  ))
                ) : (
                  <>
                    <option value="Minor (Level 1)">Minor (Level 1)</option>
                    <option value="Moderate (Level 2)">Moderate (Level 2)</option>
                    <option value="Severe (Level 3)">Severe (Level 3)</option>
                    <option value="Catastrophic (Level 4)">Catastrophic (Level 4)</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
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
                <label className="block text-slate-300 font-medium mb-1">Geographical State</label>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Original Cost */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Sanctioned Cost (₹ Cr)</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={formData.original_cost}
                  onChange={(e) => handleChange('original_cost', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Planned Duration */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Scheduled Timeline (Mo)</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={formData.planned_duration_months}
                  onChange={(e) => handleChange('planned_duration_months', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Physical progress slider */}
            <div className="pt-2">
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Stage at Impact (Physical Completion)</span>
                <span className="font-bold text-indigo-400">{formData.physical_progress_pct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={formData.physical_progress_pct}
                onChange={(e) => handleChange('physical_progress_pct', parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                *Projects midway (25-70%) with exposed scaffolding, cut slopes, and curing structures face peak vulnerability.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-md shadow-rose-600/30 flex items-center justify-center space-x-2 text-xs transition"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Flame className="w-4 h-4" />
            )}
            <span>Simulate Natural Disaster Impact</span>
          </button>
        </form>

        {/* Right: Damage Estimation & Engineering Precautions */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-200 text-xs">
              <strong className="block font-bold">Simulation Error:</strong>
              {error}
            </div>
          )}

          {!result && !loading && (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center text-slate-400 h-full min-h-[420px]">
              <div className="p-4 bg-slate-800/60 rounded-full mb-3">
                <ShieldAlert className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="font-semibold text-white text-base">Disaster Impact Engine Ready</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Select a natural hazard (e.g., Cyclone in Odisha, Cloudburst in Uttarakhand/Kerala, or Seismic Tremor) and execute simulation to view damage metrics and building precautions.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Damage & Outlay Metrics */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    {getDisasterIcon(result.disaster_type)}
                    <h2 className="text-base font-semibold text-white">
                      Damage & Schedule Slippage Assessment
                    </h2>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      result.vulnerability_tier.includes('Critical')
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : result.vulnerability_tier.includes('Elevated')
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {result.vulnerability_tier}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Estimated Damage % */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                    <div className="text-[11px] text-slate-400 font-medium">Estimated Physical Damage</div>
                    <div className="text-2xl font-bold text-rose-400 mt-1">
                      {result.estimated_damage_pct}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Hazard multiplier: {result.hazard_multiplier}x
                    </div>
                  </div>

                  {/* Financial Outlay Cr */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                    <div className="text-[11px] text-slate-400 font-medium">Remediation Cost Outlay</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1">
                      ₹ {result.estimated_repair_cost_cr.toLocaleString()} Cr
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Reconstruction & stabilization
                    </div>
                  </div>

                  {/* Schedule Delay Months */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg">
                    <div className="text-[11px] text-slate-400 font-medium">Schedule Delay Added</div>
                    <div className="text-2xl font-bold text-sky-400 mt-1">
                      +{result.projected_additional_delay_months} Mo
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Downtime & remediation slippage
                    </div>
                  </div>
                </div>

                {/* Narrative Summary */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed">
                  <div className="font-semibold text-white mb-1 flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Disaster Impact Synopsis</span>
                  </div>
                  {result.damage_description}
                </div>
              </div>

              {/* Actionable Engineering & Construction Precautions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                    <Hammer className="w-5 h-5 text-indigo-400" />
                    <span>Proactive Precautions to Take While Building</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    BIS & MoSPI Resilience Specs
                  </span>
                </div>

                {/* 3 Categories: Planning, Structural, Operational */}
                <div className="space-y-4">
                  {/* Planning & Design Precautions */}
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Pre-Construction & Site Planning Measures</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {result.precautions.planning?.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Structural & Material Specifications */}
                  <div className="border-t border-slate-800 pt-3">
                    <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Structural & Material Resilience Engineering</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {result.precautions.structural?.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Operational Construction Safety */}
                  <div className="border-t border-slate-800 pt-3">
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Active Construction Site Protocols & Emergency Warning</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {result.precautions.operational?.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
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

