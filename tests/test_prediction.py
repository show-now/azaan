from infrastructure_risk.models.prediction import RiskPredictionService


def test_prediction_service():
    service = RiskPredictionService()
    assert service.is_trained() is True

    payload = {
        "sector": "Roads & Highways",
        "state": "Maharashtra",
        "original_cost": 500.0,
        "planned_duration_months": 36,
        "elapsed_months": 18.0,
        "physical_progress_pct": 35.0,
        "land_acquisition_pct": 70.0,
        "approval_delay_months": 4.0,
        "funding_risk": "Medium",
        "contractor_changes": 1,
        "material_inflation_pct": 8.5,
    }

    result = service.predict(payload)
    assert result.predicted_cost_overrun_pct > -5.0
    assert result.estimated_final_cost > 0.0
    assert result.predicted_delay_months >= 0.0
    assert 0.0 <= result.overrun_risk_probability <= 1.0
    assert result.overrun_flag in [0, 1]
    assert result.risk_level in ["Low", "Medium", "High"]
