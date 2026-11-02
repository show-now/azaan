"""Integration tests for FastAPI endpoints."""

from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_trained"] is True
    assert data["sectors_count"] > 0
    assert data["states_count"] > 0


def test_metadata_endpoint():
    response = client.get("/api/meta")
    assert response.status_code == 200
    data = response.json()
    assert "sectors" in data
    assert "states" in data
    assert data["default_dataset_size"] == 2000
    assert data["default_cost_overrun_threshold"] == 10.0


def test_portfolio_overview_endpoint():
    response = client.get("/api/portfolio/overview")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert data["kpis"]["total_projects"] == 2000
    assert "sector_summary" in data
    assert len(data["sector_summary"]) > 0
    assert "state_distribution" in data
    assert "scatter_progress_vs_delay" in data


def test_projects_endpoint_with_filters():
    response = client.get("/api/projects?limit=10&min_progress=10&max_progress=90")
    assert response.status_code == 200
    data = response.json()
    assert "projects" in data
    assert len(data["projects"]) <= 10
    assert data["total_matched"] > 0


def test_risk_prediction_endpoint():
    payload = {
        "sector": "Roads & Highways",
        "state": "Maharashtra",
        "original_cost": 750.0,
        "planned_duration_months": 36,
        "elapsed_months": 20.0,
        "physical_progress_pct": 38.0,
        "land_acquisition_pct": 65.0,
        "approval_delay_months": 4.5,
        "funding_risk": "Medium",
        "contractor_changes": 1,
        "material_inflation_pct": 7.2,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "predicted_cost_overrun_pct" in data["prediction"]
    assert "predicted_delay_months" in data["prediction"]
    assert "overrun_risk_probability" in data["prediction"]
    assert "early_warnings" in data
    assert "executive_summary" in data


def test_early_warnings_endpoint():
    response = client.get("/api/warnings?limit=50")
    assert response.status_code == 200
    data = response.json()
    assert data["total_triggered"] > 0
    assert "warnings" in data
    assert len(data["warnings"]) <= 50


def test_model_evaluation_endpoint():
    response = client.get("/api/model-evaluation")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "model_a_cost_overrun_pct" in data["metrics"]
    assert "model_b_delay_months" in data["metrics"]
    assert "model_c_overrun_flag" in data["metrics"]
    assert "evaluation_charts" in data


def test_disaster_simulation_endpoint():
    payload = {
        "sector": "Ports & Shipping",
        "state": "Odisha",
        "original_cost": 1500.0,
        "planned_duration_months": 48,
        "elapsed_months": 24.0,
        "physical_progress_pct": 50.0,
        "disaster_type": "Cyclone / Storm Surge",
        "severity": "Severe (Level 3)",
    }
    response = client.post("/api/simulate-disaster", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["disaster_type"] == "Cyclone / Storm Surge"
    assert data["estimated_damage_pct"] > 0
    assert data["estimated_repair_cost_cr"] > 0
    assert data["projected_additional_delay_months"] > 0
    assert "precautions" in data
    assert "planning" in data["precautions"]
    assert "structural" in data["precautions"]
    assert "operational" in data["precautions"]


