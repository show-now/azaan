export interface PortfolioKPIs {
  total_projects: number;
  total_sanctioned_cost_cr: number;
  total_estimated_cost_cr: number;
  projected_cost_overrun_cr: number;
  cost_overrun_pct: number;
  flagged_projects_count: number;
  flagged_projects_pct: number;
}

export interface SectorSummaryItem {
  sector: string;
  original_cost: number;
  estimated_final_cost: number;
  overrun_cost: number;
  project_count: number;
}

export interface StateDistributionItem {
  state: string;
  project_count: number;
  total_sanctioned_cost: number;
  avg_progress: number;
}

export interface ScatterProject {
  project_id: string;
  project_name: string;
  sector: string;
  state: string;
  original_cost: number;
  physical_progress_pct: number;
  actual_delay_months: number;
  cost_overrun_pct: number;
  is_flagged: boolean;
}

export interface PortfolioOverviewResponse {
  kpis: PortfolioKPIs;
  sector_summary: SectorSummaryItem[];
  state_distribution: StateDistributionItem[];
  scatter_progress_vs_delay: ScatterProject[];
}

export interface ProjectRecord {
  project_id: string;
  project_name: string;
  sector: string;
  state: string;
  original_cost: number;
  planned_duration_months: number;
  elapsed_months: number;
  physical_progress_pct: number;
  land_acquisition_pct: number;
  approval_delay_months: number;
  contractor_changes: number;
  material_inflation_pct: number;
  funding_risk: string;
  actual_final_cost?: number;
  actual_delay_months?: number;
  cost_overrun_pct?: number;
  cost_overrun_flag?: number;
}

export interface ProjectsResponse {
  total_matched: number;
  limit: number;
  offset: number;
  projects: ProjectRecord[];
}

export interface PredictionPayload {
  sector: string;
  state: string;
  original_cost: number;
  planned_duration_months: number;
  elapsed_months: number;
  physical_progress_pct: number;
  land_acquisition_pct: number;
  approval_delay_months: number;
  funding_risk: string;
  contractor_changes: number;
  material_inflation_pct: number;
}

export interface PredictionResult {
  predicted_cost_overrun_pct: number;
  estimated_final_cost: number;
  predicted_delay_months: number;
  overrun_risk_probability: number;
  overrun_flag: number;
  risk_level: string;
}

export interface EarlyWarningAlert {
  warning_id: string;
  project_id: string;
  severity: 'High' | 'Medium' | 'Low';
  condition: string;
  observed_value: string;
  threshold_rule: string;
  suggested_action: string;
}

export interface ExecutiveSummary {
  status: string;
  severity_color: string;
  headline: string;
  total_active_alerts: number;
  high_severity_count: number;
  medium_severity_count: number;
  findings: string[];
  recommendations: string[];
}

export interface PredictionApiResponse {
  prediction: PredictionResult;
  early_warnings: EarlyWarningAlert[];
  executive_summary: ExecutiveSummary;
}

export interface WarningsResponse {
  total_triggered: number;
  high_severity_count: number;
  medium_severity_count: number;
  flagged_projects_count: number;
  available_conditions: string[];
  filtered_count: number;
  warnings: EarlyWarningAlert[];
}

export interface ModelMetricsData {
  seed: number;
  n_samples: number;
  predictor_features: string[];
  model_a_cost_overrun_pct: {
    mae: number;
    rmse: number;
    r2: number;
    baseline_mean_mae: number;
    mae_improvement_pct: number;
  };
  model_b_delay_months: {
    mae: number;
    rmse: number;
    r2: number;
    baseline_mean_mae: number;
    mae_improvement_pct: number;
  };
  model_c_overrun_flag: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    baseline_accuracy: number;
    accuracy_gain: number;
    confusion_matrix: number[][];
  };
}

export interface ModelEvaluationResponse {
  metrics: ModelMetricsData;
  evaluation_charts: {
    model_a: Array<{ actual: number; predicted: number }>;
    model_b: Array<{ actual: number; predicted: number }>;
  };
}

export interface MetadataResponse {
  sectors: string[];
  states: string[];
  funding_risk_levels: string[];
  disaster_types: string[];
  disaster_severities: string[];
  default_dataset_size: number;
  default_cost_overrun_threshold: number;
}

export interface DisasterSimulationPayload {
  sector: string;
  state: string;
  original_cost: number;
  planned_duration_months: number;
  elapsed_months: number;
  physical_progress_pct: number;
  disaster_type: string;
  severity: string;
}

export interface DisasterSimulationResult {
  disaster_type: string;
  severity: string;
  vulnerability_score: number;
  hazard_multiplier: number;
  estimated_damage_pct: number;
  estimated_repair_cost_cr: number;
  projected_additional_delay_months: number;
  vulnerability_tier: string;
  damage_description: string;
  precautions: {
    planning: string[];
    structural: string[];
    operational: string[];
  };
}

