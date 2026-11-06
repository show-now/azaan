from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)

def test_spatial_heatmap_endpoint():
    resp = client.get("/api/spatial/heatmap")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_states" in data
    assert "state_metrics" in data
    assert "regional_clusters" in data
    assert "project_markers" in data
    assert data["total_states"] == 15
    assert len(data["state_metrics"]) == 15
    assert len(data["regional_clusters"]) == 4
    assert len(data["project_markers"]) > 0

    first_state = data["state_metrics"][0]
    assert "state" in first_state
    assert "risk_score" in first_state
    assert "risk_tier" in first_state
    assert "terrain" in first_state
    assert "geo_risk" in first_state
    assert "lat" in first_state
    assert "lng" in first_state

def test_spatial_heatmap_filter():
    resp = client.get("/api/spatial/heatmap?state=Assam")
    assert resp.status_code == 200
    data = resp.json()
    for marker in data["project_markers"]:
        assert marker["state"] == "Assam"
        assert "lat" in marker
        assert "lng" in marker
        assert "risk_tier" in marker
