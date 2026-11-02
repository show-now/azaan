import React, { useEffect, useState } from 'react';
import { fetchModelEvaluation } from '../api';
import { ModelEvaluationResponse } from '../types';
import { 
  LineChart as LineChartIcon, 
  CheckCircle, 
  Award, 
  BarChart2, 
  HelpCircle, 
  ShieldCheck 
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export const ModelEvaluationView: React.FC = () => {
  const [data, setData] = useState<ModelEvaluationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<'A' | 'B' | 'C'>('A');

  useEffect(() => {
    fetchModelEvaluation()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm">Loading statistical metrics and held-out validation benchmarks...</span>
        </div>
      </div>
    );
  }

  const { metrics, evaluation_charts } = data;
  const mA = metrics.model_a_cost_overrun_pct;
  const mB = metrics.model_b_delay_months;
  const mC = metrics.model_c_overrun_flag;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <LineChartIcon className="w-6 h-6 text-indigo-400" />
          <span>Machine Learning Validation & Benchmark Evaluation</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Held-out test set performance (20% split, {Math.round(metrics.n_samples * 0.2)} test samples) compared rigorously against statistical naive baselines.
        </p>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveModel('A')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeModel === 'A'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Model A: Cost Overrun Regressor
        </button>
        <button
          onClick={() => setActiveModel('B')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeModel === 'B'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Model B: Schedule Delay Regressor
        </button>
        <button
          onClick={() => setActiveModel('C')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeModel === 'C'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Model C: Overrun Risk Classifier
        </button>
      </div>

      {/* Model A View */}
      {activeModel === 'A' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Mean Absolute Error (MAE)</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{mA.mae.toFixed(2)}%</div>
              <div className="mt-1 text-[11px] text-emerald-400 font-medium">
                +{mA.mae_improvement_pct.toFixed(1)}% improvement vs baseline
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Root Mean Squared Error</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{mA.rmse.toFixed(2)}%</div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">Test split RMSE</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Coefficient of Determination (R²)</div>
              <div className="mt-2 text-2xl font-extrabold text-indigo-400">{mA.r2.toFixed(3)}</div>
              <div className="mt-1 text-[11px] text-indigo-300/80">Strong variance explained</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Dummy Baseline MAE</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-400">{mA.baseline_mean_mae.toFixed(2)}%</div>
              <div className="mt-1 text-[11px] text-slate-500">Predicting historical mean</div>
            </div>
          </div>

          {/* Scatter: Actual vs Predicted */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-white mb-1">
              Model A: Actual vs Predicted Cost Overrun % (Held-out Test Set)
            </h3>
            <p className="text-xs text-slate-400 mb-4">Sample test points verifying calibration along the diagonal line</p>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                  <XAxis 
                    type="number" 
                    dataKey="actual" 
                    name="Actual Overrun" 
                    unit="%" 
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="predicted" 
                    name="Predicted Overrun" 
                    unit="%" 
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [`${Number(val).toFixed(2)}%`]}
                  />
                  <Scatter name="Test Projects" data={evaluation_charts.model_a} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Model B View */}
      {activeModel === 'B' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Mean Absolute Error (MAE)</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{mB.mae.toFixed(2)} Mo</div>
              <div className="mt-1 text-[11px] text-emerald-400 font-medium">
                +{mB.mae_improvement_pct.toFixed(1)}% improvement vs baseline
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Root Mean Squared Error</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{mB.rmse.toFixed(2)} Mo</div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">Test split RMSE</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Coefficient of Determination (R²)</div>
              <div className="mt-2 text-2xl font-extrabold text-indigo-400">{mB.r2.toFixed(3)}</div>
              <div className="mt-1 text-[11px] text-indigo-300/80">Strong variance explained</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Dummy Baseline MAE</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-400">{mB.baseline_mean_mae.toFixed(2)} Mo</div>
              <div className="mt-1 text-[11px] text-slate-500">Predicting historical mean</div>
            </div>
          </div>

          {/* Scatter: Actual vs Predicted Delay */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-white mb-1">
              Model B: Actual vs Predicted Delay Months (Held-out Test Set)
            </h3>
            <p className="text-xs text-slate-400 mb-4">Sample test points comparing predicted delay in months against ground truth</p>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                  <XAxis 
                    type="number" 
                    dataKey="actual" 
                    name="Actual Delay" 
                    unit=" mo" 
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="predicted" 
                    name="Predicted Delay" 
                    unit=" mo" 
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)} Months`]}
                  />
                  <Scatter name="Test Projects" data={evaluation_charts.model_b} fill="#38bdf8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Model C View */}
      {activeModel === 'C' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Classification Accuracy</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{(mC.accuracy * 100).toFixed(1)}%</div>
              <div className="mt-1 text-[11px] text-emerald-400 font-medium">
                +{(mC.accuracy_gain * 100).toFixed(1)}% vs Majority Baseline
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">ROC-AUC Score</div>
              <div className="mt-2 text-2xl font-extrabold text-indigo-400">{(mC.roc_auc * 100).toFixed(1)}%</div>
              <div className="mt-1 text-[11px] text-indigo-300/80">Discriminative power</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Precision / Recall</div>
              <div className="mt-2 text-2xl font-extrabold text-white">
                {(mC.precision * 100).toFixed(0)}% / {(mC.recall * 100).toFixed(0)}%
              </div>
              <div className="mt-1 text-[11px] text-slate-400">F1 Score: {(mC.f1_score * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Majority Baseline Accuracy</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-400">{(mC.baseline_accuracy * 100).toFixed(1)}%</div>
              <div className="mt-1 text-[11px] text-slate-500">Zero-rule majority classifier</div>
            </div>
          </div>

          {/* Confusion Matrix Display */}
          {mC.confusion_matrix && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm max-w-lg">
              <h3 className="text-base font-semibold text-white mb-1">
                Model C: Test Split Confusion Matrix
              </h3>
              <p className="text-xs text-slate-400 mb-4">Evaluating binary overrun prediction (&ge;10% Overrun Threshold)</p>
              
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-lg">
                  <div className="text-slate-400 text-[11px]">True Negatives (TN)</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{mC.confusion_matrix[0][0]}</div>
                </div>
                <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-lg">
                  <div className="text-slate-400 text-[11px]">False Positives (FP)</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">{mC.confusion_matrix[0][1]}</div>
                </div>
                <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-lg">
                  <div className="text-slate-400 text-[11px]">False Negatives (FN)</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">{mC.confusion_matrix[1][0]}</div>
                </div>
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-lg">
                  <div className="text-slate-400 text-[11px]">True Positives (TP)</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">{mC.confusion_matrix[1][1]}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

