"""Tests for project creation API."""

import uuid

from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_create_project_success():
    unique_id = f"PRJ-TEST-{uuid.uuid4().hex[:6].upper()}"
    payload = {
        "project_id": unique_id,
        "project_name": "Test Express Highway Corridor",
        "sector": "Roads & Highways",
        "state": "Maharashtra",
        "original_cost": 850.0,
        "planned_duration_months": 36,
        "elapsed_months": 12.0,
        "physical_progress_pct": 30.0,
        "land_acquisition_pct": 75.0,
        "approval_delay_months": 2.0,
        "funding_risk": "Low",
        "contractor_changes": 0,
        "material_inflation_pct": 5.0,
    }
    resp = client.post("/api/projects", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["project"]["project_id"] == unique_id

    # Query back to verify persistence
    get_resp = client.get(f"/api/projects?search={unique_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["total_matched"] >= 1
