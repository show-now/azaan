import React, { useEffect, useState } from 'react';
import { fetchPortfolioOverview } from '../api';
import { PortfolioOverviewResponse } from '../types';
import { 
  Building2, 
  TrendingUp, 
  AlertOctagon, 
  Clock, 
  BarChart3, 
  MapPin, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  CartesianGrid 
} from 'recharts';

export const PortfolioOverviewView: React.FC = () => {
  const [data, setData] = useState<PortfolioOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolioOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 text-sm">Aggregating portfolio indicators...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
        <h3 className="font-semibold text-lg flex items-center space-x-2">
          <AlertOctagon className="w-5 h-5 text-rose-600" />
          <span>Error loading portfolio metrics</span>
        </h3>
        <p className="text-sm mt-1 text-rose-700">{error}</p>
      </div>
    );
  }

  const { kpis, sector_summary, state_distribution, scatter_progress_vs_delay } = data;

  return (
    <div className="space-y-8">
      {/* Page Title & Context */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <span>Macro Infrastructure Portfolio Overview</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          High-level capital expenditure tracking across {kpis.total_projects.toLocaleString()} ongoing major infrastructure projects (MoSPI/PAIMANA indicators).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Monitored Projects</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {kpis.total_projects.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center">
            <span className="text-emerald-600 font-semibold mr-1.5">100% active</span>
            <span>across 15 key states</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Sanctioned Baseline</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            ₹ {(kpis.total_sanctioned_cost_cr / 1000).toFixed(1)}k Cr
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Total Sanctioned: ₹ {kpis.total_sanctioned_cost_cr.toLocaleString()} Cr
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Projected Cost Overrun</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-rose-600">
            ₹ {kpis.projected_cost_overrun_cr.toLocaleString()} Cr
          </div>
          <div className="mt-2 text-xs text-rose-600 flex items-center font-medium">
            <span>+{kpis.cost_overrun_pct.toFixed(1)}% slippage vs baseline</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Early Warning Distress</span>
            <AlertOctagon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-600">
            {kpis.flagged_projects_count.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium">
            {kpis.flagged_projects_pct.toFixed(1)}% of projects triggered rule alerts
          </div>
        </div>
      </div>

      {/* Sector Capital Exposure Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Sector Cost Exposure vs Final Estimated Cost</h2>
            <p className="text-xs text-slate-500">Comparing original sanctioned capital against projected completion outlays (₹ Crores)</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-600 border border-slate-200">
            8 MoSPI Sectors
          </span>
        </div>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sector_summary} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
              <XAxis 
                dataKey="sector" 
                stroke="#64748b" 
                fontSize={11} 
                angle={-25} 
                textAnchor="end" 
                interval={0} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k Cr`} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                formatter={(value: any) => [`₹ ${Number(value).toLocaleString()} Cr`]}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar 
                dataKey="original_cost" 
                name="Sanctioned Baseline" 
                fill="#4f46e5" 
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Bar 
                dataKey="estimated_final_cost" 
                name="Estimated Final Cost" 
                fill="#ef4444" 
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Progress vs Delay Scatter & State Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress vs Schedule Delay Scatter */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Physical Progress vs Schedule Delay</span>
              </h2>
              <p className="text-xs text-slate-500">Sample of 300 projects showing timeline divergence</p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 font-medium">
              Red = Flagged Early
            </span>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis 
                  type="number" 
                  dataKey="physical_progress_pct" 
                  name="Physical Progress" 
                  unit="%" 
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={11}
                />
                <YAxis 
                  type="number" 
                  dataKey="actual_delay_months" 
                  name="Delay" 
                  unit=" mo" 
                  stroke="#64748b"
                  fontSize={11}
                />
                <ZAxis range={[20, 20]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload as any;
                    return (
                      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs space-y-1 text-slate-800">
                        <div className="font-bold text-slate-900">{d.project_name} ({d.project_id})</div>
                        <div className="text-slate-600">Sector: {d.sector} | {d.state}</div>
                        <div className="text-indigo-600 font-semibold">Progress: {d.physical_progress_pct}%</div>
                        <div className="text-rose-600 font-semibold">Delay: {d.actual_delay_months} Months</div>
                        <div className="text-amber-600 font-semibold">Cost Overrun: {d.cost_overrun_pct}%</div>
                      </div>
                    );
                  }}
                />
                <Scatter 
                  name="Projects" 
                  data={scatter_progress_vs_delay} 
                  fill="#4f46e5"
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={4.5} 
                        className="animated-scatter-point"
                        fill={payload.is_flagged ? '#ef4444' : '#4f46e5'} 
                        fillOpacity={0.85}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Geographic Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>Geographic Distribution (States & UTs)</span>
                </h2>
                <p className="text-xs text-slate-500">Project concentration and average physical completion</p>
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto pr-2 space-y-2.5">
              {state_distribution.map((item) => (
                <div 
                  key={item.state} 
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">{item.state}</span>
                    <div className="text-[11px] text-slate-500">
                      ₹ {item.total_sanctioned_cost.toLocaleString()} Cr capital
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-xs font-mono font-bold text-indigo-600">
                      {item.project_count} Projects
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium">
                      Avg Progress: {item.avg_progress}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
