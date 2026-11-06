"""FastAPI Backend Server for Infrastructure Project Risk Analytics.

Runs on port 8001 and interfaces with:
- ML Prediction Service (Models A, B, and C)
- Rule-based Early Warning System & Root Cause Explanations
- Synthetic / Monitored Infrastructure Dataset (2,000 projects)
- Model Evaluation Metrics and Baselines
"""

import hashlib
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
# Route 1B: Spatial GIS & Risk Heatmap (/api/spatial/heatmap)
# ==========================================
STATE_COORDINATES: Dict[str, Dict[str, Any]] = {
    "Maharashtra": {
        "lat": 19.7515,
        "lng": 75.7139,
        "terrain": "Western Ghats & Deccan Plateau",
        "geo_risk": "Moderate Coastal & Ghat Monsoon Inundation",
        "cluster": "Western Industrial & Port Corridor",
    },
    "Uttar Pradesh": {
        "lat": 26.8467,
        "lng": 80.9462,
        "terrain": "Gangetic Alluvial Plain",
        "geo_risk": "High Right-of-Way Density & Riverbed Siltation",
        "cluster": "Northern Plains & Freight Corridor",
    },
    "Gujarat": {
        "lat": 22.2587,
        "lng": 71.1924,
        "terrain": "Semi-Arid Coast & Extended Gulf Littoral",
        "geo_risk": "Arabian Sea Cyclones & Soil Saline Ingress",
        "cluster": "Western Maritime Logistics",
    },
    "Tamil Nadu": {
        "lat": 11.1271,
        "lng": 78.6569,
        "terrain": "Coromandel Coastal Plain",
        "geo_risk": "Northeast Monsoon Surge & Urban Density Bottlenecks",
        "cluster": "Southern Industrial & Highway Grid",
    },
    "Karnataka": {
        "lat": 15.3173,
        "lng": 75.7139,
        "terrain": "Western Ghats Escarpment & Southern Plateau",
        "geo_risk": "Forest Clearance Review & Slope Stability",
        "cluster": "Southern Technology & Transport Belt",
    },
    "Rajasthan": {
        "lat": 27.0238,
        "lng": 74.2179,
        "terrain": "Thar Desert & Aravalli Belt",
        "geo_risk": "Severe Thermal Fluctuations & Groundwater Scarcity",
        "cluster": "Western Inland & Renewable Solar Belt",
    },
    "West Bengal": {
        "lat": 22.9868,
        "lng": 87.8550,
        "terrain": "Deltaic Alluvium & Northern Terai",
        "geo_risk": "High Land Acquisition Density & Monsoon Inundation",
        "cluster": "Eastern Gateway & Sub-Himalayan Corridor",
    },
    "Madhya Pradesh": {
        "lat": 22.9734,
        "lng": 78.6569,
        "terrain": "Central Highlands & Wildlife Corridors",
        "geo_risk": "Extensive Environmental Clearances & River Crossings",
        "cluster": "Central Trans-India Transit Core",
    },
    "Andhra Pradesh": {
        "lat": 15.9129,
        "lng": 79.7400,
        "terrain": "Eastern Ghats & Coastal Delta Plains",
        "geo_risk": "Frequent Bay of Bengal Cyclonic Surges",
        "cluster": "Eastern Coastal Ports & Highway Links",
    },
    "Bihar": {
        "lat": 25.0961,
        "lng": 85.3131,
        "terrain": "Middle Gangetic Floodplain",
        "geo_risk": "Annual Riverine Inundation & Shifting Embankments",
        "cluster": "Eastern Riverine Plains",
    },
    "Odisha": {
        "lat": 20.9517,
        "lng": 85.0985,
        "terrain": "Coastal Strip & Mineral-Rich Highlands",
        "geo_risk": "High Cyclone Vulnerability & Forest Land Clearances",
        "cluster": "Eastern Mineral & Port Belt",
    },
    "Assam": {
        "lat": 26.2006,
        "lng": 92.9376,
        "terrain": "Brahmaputra Valley & Foothills",
        "geo_risk": "High Seismic Hazard Zone V & Severe Riverine Floods",
        "cluster": "Northeast Himalayan Gateway",
    },
    "Kerala": {
        "lat": 10.8505,
        "lng": 76.2711,
        "terrain": "Narrow Coastal Strip & High-Gradient Western Ghats",
        "geo_risk": "Steep Hillside Landslides & Severe Land Acquisition Cost",
        "cluster": "Southern Coastal Linear Infrastructure",
    },
    "Delhi NCR": {
        "lat": 28.7041,
        "lng": 77.1025,
        "terrain": "High-Density Metropolitan River Basin",
        "geo_risk": "Dense Urban Utility Shifting & RoW Stalemates",
        "cluster": "National Capital Urban Logistics Ring",
    },
    "Jammu & Kashmir": {
        "lat": 33.7782,
        "lng": 76.5762,
        "terrain": "Rugged Himalayan High-Altitude Corridors",
        "geo_risk": "Extreme Slope Collapses, Avalanches, High Seismicity & Snow Closures",
        "cluster": "Himalayan Strategic & Tunneling Corridor",
    },
}

REGIONAL_SPATIAL_CLUSTERS: List[Dict[str, Any]] = [
    {
        "cluster_name": "Himalayan & Fragile Ecology Corridor",
        "states": ["Jammu & Kashmir", "Assam"],
        "primary_hazard": "Seismic Zone V, Hill Slope Instability & River Inundation",
        "delay_multiplier": 1.45,
        "recommendation": "Require mandatory LiDAR slope audits, flexible rockfall barriers, and winterized concreting schedules.",
    },
    {
        "cluster_name": "Bay of Bengal Cyclone & Delta Belt",
        "states": ["Odisha", "Andhra Pradesh", "West Bengal", "Tamil Nadu"],
        "primary_hazard": "Cyclonic Storm Surges, Coastal Embankment Scour & Intense Monsoon Delays",
        "delay_multiplier": 1.30,
        "recommendation": "Enforce IRC/BIS marine-grade anti-corrosive concrete indexation and seasonal pre-monsoon pile completions.",
    },
    {
        "cluster_name": "Dense Urban & High RoW Friction Corridor",
        "states": ["Delhi NCR", "Maharashtra", "Uttar Pradesh", "Bihar"],
        "primary_hazard": "Severe Land Acquisition Density, Metro Utility Clashes & Multi-Agency Clearances",
        "delay_multiplier": 1.38,
        "recommendation": "Deploy PMG fast-track land dispute arbitration and single-window utility shifting escrow deposits.",
    },
    {
        "cluster_name": "Arid & Extended Mineral Transit Belt",
        "states": ["Rajasthan", "Gujarat", "Madhya Pradesh", "Karnataka"],
        "primary_hazard": "Extreme Thermal Expansion, Environmental Wildlife Passes & Mineral Corridor Heavy Haul",
        "delay_multiplier": 1.15,
        "recommendation": "Standardize polymer-modified bitumen (PMB) and pre-approved eco-sensitive zone (ESZ) viaduct designs.",
    },
]


def _derive_project_coords(project_id: str, state: str) -> tuple[float, float]:
    """Deterministically map project ID and state to plausible GPS coordinates within the state."""
    base = STATE_COORDINATES.get(state, {"lat": 20.5937, "lng": 78.9629})
    h = int(hashlib.md5(project_id.encode("utf-8")).hexdigest()[:8], 16)
    # Controlled jitter between -0.8 and +0.8 degrees
    lat_offset = (((h % 1000) / 1000.0) - 0.5) * 1.6
    lng_offset = ((((h // 1000) % 1000) / 1000.0) - 0.5) * 1.6
    return round(base["lat"] + lat_offset, 5), round(base["lng"] + lng_offset, 5)


@app.get("/api/spatial/heatmap")
def get_spatial_heatmap(
    state: Optional[str] = None,
    sector: Optional[str] = None,
    min_risk_level: Optional[str] = None,
) -> Dict[str, Any]:
    """Provides GIS spatial heatmap metrics, state-level risk aggregations, and geocoded project pins."""
    df = load_or_generate_dataset(n_samples=2000, seed=42)
    warnings_df = evaluate_batch_warnings(df)
    flagged_ids = set(warnings_df["project_id"].unique()) if not warnings_df.empty else set()
    warnings_by_proj = (
        warnings_df.groupby("project_id")["warning_id"].count().to_dict()
        if not warnings_df.empty
        else {}
    )

    # State Aggregations
    state_metrics = []
    for st_name, grp in df.groupby("state"):
        st_str = str(st_name)
        total_p = len(grp)
        flagged_count = sum(1 for pid in grp["project_id"] if pid in flagged_ids)
        total_cost = float(grp["original_cost"].sum())
        cost_col = "actual_final_cost" if "actual_final_cost" in grp.columns else "original_cost"
        est_cost = float(grp[cost_col].sum())
        overrun_cost = max(0.0, est_cost - total_cost)
        avg_delay = float(grp["actual_delay_months"].mean()) if "actual_delay_months" in grp.columns else 0.0
        avg_overrun_pct = (overrun_cost / total_cost * 100.0) if total_cost > 0 else 0.0
        avg_progress = float(grp["physical_progress_pct"].mean())
        avg_land = float(grp["land_acquisition_pct"].mean())
        avg_approval_delay = float(grp["approval_delay_months"].mean())

        flagged_rate = (flagged_count / total_p * 100.0) if total_p > 0 else 0.0

        # Composite Spatial Risk Score (0 - 100)
        risk_score = min(
            100.0,
            round(
                (flagged_rate * 0.40)
                + (min(avg_overrun_pct, 60.0) * 0.35)
                + (min(avg_delay, 30.0) / 30.0 * 25.0),
                1,
            ),
        )

        risk_tier = "Critical" if risk_score >= 60.0 else ("Medium" if risk_score >= 35.0 else "Low")
        geo_info = STATE_COORDINATES.get(
            st_str,
            {
                "lat": 20.5937,
                "lng": 78.9629,
                "terrain": "Mixed Terrain",
                "geo_risk": "Standard Operational Risks",
                "cluster": "General Regional Logistics",
            },
        )

        state_metrics.append({
            "state": st_str,
            "lat": geo_info["lat"],
            "lng": geo_info["lng"],
            "terrain": geo_info["terrain"],
            "geo_risk": geo_info["geo_risk"],
            "cluster": geo_info["cluster"],
            "project_count": total_p,
            "flagged_count": flagged_count,
            "flagged_pct": round(flagged_rate, 1),
            "total_sanctioned_cost_cr": round(total_cost, 2),
            "estimated_final_cost_cr": round(est_cost, 2),
            "overrun_cost_cr": round(overrun_cost, 2),
            "avg_overrun_pct": round(avg_overrun_pct, 2),
            "avg_delay_months": round(avg_delay, 1),
            "avg_progress_pct": round(avg_progress, 1),
            "avg_land_acquisition_pct": round(avg_land, 1),
            "avg_approval_delay_months": round(avg_approval_delay, 1),
            "risk_score": risk_score,
            "risk_tier": risk_tier,
        })

    state_metrics.sort(key=lambda x: x["risk_score"], reverse=True)

    # Filter projects for marker layer
    filtered_df = df.copy()
    if state and state.strip() and state != "All":
        filtered_df = filtered_df[filtered_df["state"] == state.strip()]
    if sector and sector.strip() and sector != "All":
        filtered_df = filtered_df[filtered_df["sector"] == sector.strip()]

    # Limit markers to top 400 for smooth browser rendering while providing rich coverage
    markers = []
    for _, row in filtered_df.head(400).iterrows():
        pid = str(row["project_id"])
        st_val = str(row["state"])
        lat, lng = _derive_project_coords(pid, st_val)
        c_overrun = float(row.get("cost_overrun_pct", 0.0))
        d_months = float(row.get("actual_delay_months", 0.0))
        is_flg = pid in flagged_ids
        warn_cnt = warnings_by_proj.get(pid, 0)

        # Risk tier calculation
        if c_overrun >= 25.0 or d_months >= 15.0 or warn_cnt >= 2:
            tier = "Critical"
        elif c_overrun >= 10.0 or d_months >= 6.0 or is_flg:
            tier = "Medium"
        else:
            tier = "Low"

        if min_risk_level and min_risk_level != "All":
            if min_risk_level == "Critical" and tier != "Critical":
                continue
            if min_risk_level == "Medium" and tier not in ["Critical", "Medium"]:
                continue

        markers.append({
            "project_id": pid,
            "project_name": str(row["project_name"]),
            "sector": str(row["sector"]),
            "state": st_val,
            "lat": lat,
            "lng": lng,
            "original_cost": float(row["original_cost"]),
            "physical_progress_pct": float(row["physical_progress_pct"]),
            "cost_overrun_pct": round(c_overrun, 1),
            "delay_months": round(d_months, 1),
            "land_acquisition_pct": float(row["land_acquisition_pct"]),
            "funding_risk": str(row["funding_risk"]),
            "is_flagged": is_flg,
            "warning_count": warn_cnt,
            "risk_tier": tier,
        })

    return {
        "total_states": len(state_metrics),
        "total_markers": len(markers),
        "state_metrics": state_metrics,
        "regional_clusters": REGIONAL_SPATIAL_CLUSTERS,
        "project_markers": markers,
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
