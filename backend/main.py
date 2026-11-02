"""FastAPI Backend Server for Infrastructure Project Risk Analytics.

Runs on port 8001 and interfaces with:
- ML Prediction Service (Models A, B, and C)
- Rule-based Early Warning System & Root Cause Explanations
- Synthetic / Monitored Infrastructure Dataset (2,000 projects)
- Model Evaluation Metrics and Baselines
"""

import json
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from infrastructure_risk.config import (
    FUNDING_RISK_LEVELS,
    METRICS_DIR,
    SECTORS,
    STATES,
    TARGET_COST_OVERRUN_PCT,
    TARGET_DELAY_MONTHS,
)
from infrastructure_risk.data.loader import load_or_generate_dataset
from infrastructure_risk.features import split_train_test
from infrastructure_risk.models.prediction import (
    PredictionInput,
    PredictionResult,
    RiskPredictionService,
)
from infrastructure_risk.warnings.explanations import generate_executive_risk_summary
from infrastructure_risk.warnings.rules import (
    evaluate_batch_warnings,
    evaluate_project_warnings,
)
from infrastructure_risk.warnings.simulation import (
    DISASTER_SEVERITIES,
    DISASTER_TYPES,
    DisasterSimulationInput,
    DisasterSimulationResult,
    simulate_disaster_impact,
)

app = FastAPI(
    title="Infrastructure Risk Early Warning API",
    description="Academic prototype API inspired by MoSPI / PAIMANA monitoring framework",
    version="1.0.0",
)

# Enable CORS for Vite/React frontend on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prediction_service = RiskPredictionService()


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    """System health check and readiness."""
    return {
        "status": "healthy",
        "models_trained": prediction_service.is_trained(),
        "sectors_count": len(SECTORS),
        "states_count": len(STATES),
    }


@app.get("/api/meta")
def get_metadata() -> Dict[str, Any]:
    """Configuration metadata for UI filters and dropdowns."""
    return {
        "sectors": SECTORS,
        "states": STATES,
        "funding_risk_levels": FUNDING_RISK_LEVELS,
        "disaster_types": DISASTER_TYPES,
        "disaster_severities": DISASTER_SEVERITIES,
        "default_dataset_size": 2000,
        "default_cost_overrun_threshold": 10.0,
    }


# ==========================================
# Route 1: Portfolio Overview (/api/portfolio/overview)
# ==========================================
@app.get("/api/portfolio/overview")
def get_portfolio_overview() -> Dict[str, Any]:
    """Portfolio KPIs, sector cost exposure, progress vs delay scatter, and geographic distribution."""
    df = load_or_generate_dataset(n_samples=2000, seed=42)
    warnings_df = evaluate_batch_warnings(df)
    flagged_ids = set(warnings_df["project_id"].unique())

    total_projects = int(len(df))
    total_sanctioned_cost = float(df["original_cost"].sum())
    total_estimated_cost = float(
        df["actual_final_cost"].sum() if "actual_final_cost" in df.columns else total_sanctioned_cost
    )
    aggregate_cost_overrun = float(max(0.0, total_estimated_cost - total_sanctioned_cost))
    overrun_pct_portfolio = float(
        (aggregate_cost_overrun / total_sanctioned_cost * 100) if total_sanctioned_cost > 0 else 0
    )

    # Sector summary
    cost_col = "actual_final_cost" if "actual_final_cost" in df.columns else "original_cost"
    sector_summary = []
    for sector, grp in df.groupby("sector"):
        orig = float(grp["original_cost"].sum())
        est = float(grp[cost_col].sum())
        overrun = max(0.0, est - orig)
        sector_summary.append({
            "sector": str(sector),
            "original_cost": round(orig, 2),
            "estimated_final_cost": round(est, 2),
            "overrun_cost": round(overrun, 2),
            "project_count": int(len(grp)),
        })
    sector_summary.sort(key=lambda x: x["original_cost"], reverse=True)

    # State distribution
    state_distribution = []
    for state, grp in df.groupby("state"):
        state_distribution.append({
            "state": str(state),
            "project_count": int(len(grp)),
            "total_sanctioned_cost": round(float(grp["original_cost"].sum()), 2),
            "avg_progress": round(float(grp["physical_progress_pct"].mean()), 2),
        })
    state_distribution.sort(key=lambda x: x["project_count"], reverse=True)

    # Sample scatter data (Progress vs Delay)
    scatter_subset = df[[
        "project_id", "project_name", "sector", "state", "original_cost",
        "physical_progress_pct", "actual_delay_months", "cost_overrun_pct"
    ]].head(300).copy()
    scatter_subset["is_flagged"] = scatter_subset["project_id"].isin(flagged_ids)

    return {
        "kpis": {
            "total_projects": total_projects,
            "total_sanctioned_cost_cr": round(total_sanctioned_cost, 2),
            "total_estimated_cost_cr": round(total_estimated_cost, 2),
            "projected_cost_overrun_cr": round(aggregate_cost_overrun, 2),
            "cost_overrun_pct": round(overrun_pct_portfolio, 2),
            "flagged_projects_count": len(flagged_ids),
            "flagged_projects_pct": round(
                (len(flagged_ids) / total_projects * 100) if total_projects else 0, 2
            ),
        },
        "sector_summary": sector_summary,
        "state_distribution": state_distribution,
        "scatter_progress_vs_delay": scatter_subset.to_dict(orient="records"),
    }


# ==========================================
# Route 2: Project Explorer & Ingestion (/api/projects)
# ==========================================
class CreateProjectInput(BaseModel):
    """Payload to register a new monitored infrastructure project."""

    project_id: Optional[str] = None
    project_name: str = Field(..., description="Project Title / Corridor Name")
    sector: str = Field(..., description="Infrastructure Sector")
    state: str = Field(..., description="State / UT")
    original_cost: float = Field(..., gt=0.0, description="Sanctioned Baseline (₹ Cr)")
    planned_duration_months: int = Field(..., gt=0, description="Scheduled Duration (Mo)")
    elapsed_months: float = Field(0.0, ge=0.0, description="Elapsed Time (Mo)")
    physical_progress_pct: float = Field(0.0, ge=0.0, le=100.0, description="Physical Progress %")
    land_acquisition_pct: float = Field(0.0, ge=0.0, le=100.0, description="Land Acquisition %")
    approval_delay_months: float = Field(0.0, ge=0.0, description="Approval Delays (Mo)")
    funding_risk: str = Field("Low", description="Low, Medium, or High")
    contractor_changes: int = Field(0, ge=0, description="Contractor Replacements")
    material_inflation_pct: float = Field(5.0, description="Observed Material Inflation %")


@app.post("/api/projects")
def add_project(input_data: CreateProjectInput) -> Dict[str, Any]:
    """Appends a new project record into the monitored infrastructure database."""
    df = load_or_generate_dataset(n_samples=2000, seed=42)

    # Auto-generate ID if omitted
    proj_id = input_data.project_id
    if not proj_id or not proj_id.strip():
        next_num = len(df) + 1001
        proj_id = f"PRJ-IN-{next_num:05d}"
    else:
        proj_id = proj_id.strip()
        if proj_id in df["project_id"].values:
            raise HTTPException(status_code=400, detail=f"Project ID '{proj_id}' already exists.")

    row = {
        "project_id": proj_id,
        "project_name": input_data.project_name.strip(),
        "sector": input_data.sector,
        "state": input_data.state,
        "original_cost": float(input_data.original_cost),
        "planned_duration_months": int(input_data.planned_duration_months),
        "elapsed_months": float(input_data.elapsed_months),
        "physical_progress_pct": float(input_data.physical_progress_pct),
        "land_acquisition_pct": float(input_data.land_acquisition_pct),
        "approval_delay_months": float(input_data.approval_delay_months),
        "funding_risk": input_data.funding_risk,
        "contractor_changes": int(input_data.contractor_changes),
        "material_inflation_pct": float(input_data.material_inflation_pct),
    }

    # Automatically derive predicted outcome targets via inference models if available
    if prediction_service.is_trained():
        try:
            pred = prediction_service.predict(row)
            row["cost_overrun_pct"] = round(pred.predicted_cost_overrun_pct, 2)
            row["actual_final_cost"] = round(pred.estimated_final_cost, 2)
            row["actual_delay_months"] = round(pred.predicted_delay_months, 1)
            row["cost_overrun_flag"] = int(pred.overrun_flag)
        except Exception:
            pass

    new_df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
    from infrastructure_risk.data.loader import DEFAULT_DATA_FILE
    new_df.to_csv(DEFAULT_DATA_FILE, index=False)

    return {
        "status": "success",
        "message": f"Project {proj_id} registered and persisted successfully.",
        "project": row,
    }


@app.get("/api/projects")
def get_projects(
    sector: Optional[List[str]] = None,
    state: Optional[List[str]] = None,
    funding_risk: Optional[List[str]] = None,
    min_progress: float = 0.0,
    max_progress: float = 100.0,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> Dict[str, Any]:
    """Filtered list of projects with pagination and search."""
    df = load_or_generate_dataset(n_samples=2000, seed=42)

    filtered = df.copy()
    if sector:
        filtered = filtered[filtered["sector"].isin(sector)]
    if state:
        filtered = filtered[filtered["state"].isin(state)]
    if funding_risk:
        filtered = filtered[filtered["funding_risk"].isin(funding_risk)]

    filtered = filtered[
        (filtered["physical_progress_pct"] >= min_progress)
        & (filtered["physical_progress_pct"] <= max_progress)
    ]

    if search:
        q = search.strip().lower()
        filtered = filtered[
            filtered["project_id"].str.lower().str.contains(q)
            | filtered["project_name"].str.lower().str.contains(q)
        ]

    total_matched = int(len(filtered))
    paginated = filtered.iloc[offset : offset + limit].copy()

    # Fill NaN for JSON serialization
    paginated = paginated.fillna("")

    return {
        "total_matched": total_matched,
        "limit": limit,
        "offset": offset,
        "projects": paginated.to_dict(orient="records"),
    }


# ==========================================
# Route 3: Risk Prediction Calculator (/api/predict)
# ==========================================
@app.post("/api/predict")
def predict_project_risk(input_data: PredictionInput) -> Dict[str, Any]:
    """Calculate predicted cost overrun, schedule delay, overrun risk, and trigger early warning audit."""
    if not prediction_service.is_trained():
        raise HTTPException(status_code=500, detail="Model artifacts are not loaded or trained.")

    payload = input_data.model_dump()
    prediction: PredictionResult = prediction_service.predict(payload)

    # Evaluate early warnings
    project_series = pd.Series({"project_id": "SIMULATED-PRJ", **payload})
    alerts = evaluate_project_warnings(project_series)
    exec_summary = generate_executive_risk_summary(alerts)

    return {
        "prediction": prediction.model_dump(),
        "early_warnings": [a.model_dump() for a in alerts],
        "executive_summary": exec_summary,
    }


# ==========================================
# Route 4: Early Warnings Audit Feed (/api/warnings)
# ==========================================
@app.get("/api/warnings")
def get_early_warnings(
    severity: Optional[List[str]] = None,
    condition: Optional[List[str]] = None,
    limit: int = 150,
) -> Dict[str, Any]:
    """Audit feed of all triggered early warnings across the monitored portfolio."""
    df = load_or_generate_dataset(n_samples=2000, seed=42)
    warnings_df = evaluate_batch_warnings(df)

    if warnings_df.empty:
        return {
            "total_triggered": 0,
            "high_severity_count": 0,
            "medium_severity_count": 0,
            "flagged_projects_count": 0,
            "available_conditions": [],
            "warnings": [],
        }

    all_conditions = sorted(list(warnings_df["condition"].unique()))

    filtered = warnings_df.copy()
    if severity:
        filtered = filtered[filtered["severity"].isin(severity)]
    if condition:
        filtered = filtered[filtered["condition"].isin(condition)]

    total_triggered = int(len(warnings_df))
    high_count = int(len(warnings_df[warnings_df["severity"] == "High"]))
    med_count = int(len(warnings_df[warnings_df["severity"] == "Medium"]))
    flagged_projects = int(warnings_df["project_id"].nunique())

    records = filtered.head(limit).to_dict(orient="records")

    return {
        "total_triggered": total_triggered,
        "high_severity_count": high_count,
        "medium_severity_count": med_count,
        "flagged_projects_count": flagged_projects,
        "available_conditions": all_conditions,
        "filtered_count": int(len(filtered)),
        "warnings": records,
    }


# ==========================================
# Route 5: Model Evaluation & Benchmarks (/api/model-evaluation)
# ==========================================
@app.get("/api/model-evaluation")
def get_model_evaluation() -> Dict[str, Any]:
    """Held-out benchmarks, baselines, and actual-vs-predicted scatter points for Models A, B, and C."""
    metrics_path = METRICS_DIR / "training_metrics.json"
    if not metrics_path.exists():
        raise HTTPException(status_code=404, detail="Training metrics artifact not found.")

    with open(metrics_path, "r") as f:
        metrics_data = json.load(f)

    # Sample held-out evaluation points for charting
    scatter_samples: Dict[str, List[Dict[str, float]]] = {"model_a": [], "model_b": []}
    if prediction_service.is_trained():
        prediction_service.load_models()
        df = load_or_generate_dataset(n_samples=2000, seed=42)

        # Model A samples
        _, X_test_a, _, y_test_a = split_train_test(
            df, target_column=TARGET_COST_OVERRUN_PCT, seed=42
        )
        y_pred_a = prediction_service._model_a.predict(X_test_a)
        test_sample_a = pd.DataFrame({"actual": y_test_a, "predicted": y_pred_a}).head(120)
        scatter_samples["model_a"] = test_sample_a.to_dict(orient="records")

        # Model B samples
        _, X_test_b, _, y_test_b = split_train_test(
            df, target_column=TARGET_DELAY_MONTHS, seed=42
        )
        y_pred_b = prediction_service._model_b.predict(X_test_b)
        test_sample_b = pd.DataFrame({"actual": y_test_b, "predicted": y_pred_b}).head(120)
        scatter_samples["model_b"] = test_sample_b.to_dict(orient="records")

    return {
        "metrics": metrics_data,
        "evaluation_charts": scatter_samples,
    }


# ==========================================
# Route 6: Disaster Simulation & Resilience (/api/simulate-disaster)
# ==========================================
@app.post("/api/simulate-disaster")
def simulate_project_disaster(input_data: DisasterSimulationInput) -> Dict[str, Any]:
    """Simulates natural disaster impacts (floods, earthquakes, cyclones, landslides, heatwaves),

    estimating damage percentage, remediation outlays, schedule delays, and prescriptive precautions.
    """
    result: DisasterSimulationResult = simulate_disaster_impact(input_data)
    return result.model_dump()
