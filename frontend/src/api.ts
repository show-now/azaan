import {
  MetadataResponse,
  ModelEvaluationResponse,
  PortfolioOverviewResponse,
  PredictionApiResponse,
  PredictionPayload,
  ProjectsResponse,
  WarningsResponse,
  DisasterSimulationPayload,
  DisasterSimulationResult,
} from './types';

const API_BASE = '/api';

export async function fetchMetadata(): Promise<MetadataResponse> {
  const res = await fetch(`${API_BASE}/meta`);
  if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.statusText}`);
  return res.json();
}

export async function fetchPortfolioOverview(): Promise<PortfolioOverviewResponse> {
  const res = await fetch(`${API_BASE}/portfolio/overview`);
  if (!res.ok) throw new Error(`Failed to fetch portfolio overview: ${res.statusText}`);
  return res.json();
}

export async function fetchProjects(params: {
  sectors?: string[];
  states?: string[];
  funding_risk?: string[];
  min_progress?: number;
  max_progress?: number;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ProjectsResponse> {
  const searchParams = new URLSearchParams();
  if (params.sectors) params.sectors.forEach((s) => searchParams.append('sector', s));
  if (params.states) params.states.forEach((s) => searchParams.append('state', s));
  if (params.funding_risk) params.funding_risk.forEach((f) => searchParams.append('funding_risk', f));
  if (params.min_progress !== undefined) searchParams.append('min_progress', params.min_progress.toString());
  if (params.max_progress !== undefined) searchParams.append('max_progress', params.max_progress.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
  if (params.offset !== undefined) searchParams.append('offset', params.offset.toString());

  const res = await fetch(`${API_BASE}/projects?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
  return res.json();
}

export async function runPrediction(payload: PredictionPayload): Promise<PredictionApiResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.detail || `Prediction error: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchEarlyWarnings(params?: {
  severity?: string[];
  condition?: string[];
  limit?: number;
}): Promise<WarningsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.severity) params.severity.forEach((s) => searchParams.append('severity', s));
  if (params?.condition) params.condition.forEach((c) => searchParams.append('condition', c));
  if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/warnings?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch warnings: ${res.statusText}`);
  return res.json();
}

export async function fetchModelEvaluation(): Promise<ModelEvaluationResponse> {
  const res = await fetch(`${API_BASE}/model-evaluation`);
  if (!res.ok) throw new Error(`Failed to fetch model evaluation: ${res.statusText}`);
  return res.json();
}

export async function runDisasterSimulation(
  payload: DisasterSimulationPayload
): Promise<DisasterSimulationResult> {
  const res = await fetch(`${API_BASE}/simulate-disaster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.detail || `Simulation error: ${res.statusText}`);
  }
  return res.json();
}

