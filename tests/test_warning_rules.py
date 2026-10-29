import pandas as pd

from infrastructure_risk.warnings.rules import evaluate_batch_warnings, evaluate_project_warnings


def test_warning_triggered_on_progress_slippage():
    project = pd.Series({
        "project_id": "PRJ-TEST-001",
        "planned_duration_months": 24,
        "elapsed_months": 18,        # Expected progress ~ 75%
        "physical_progress_pct": 30.0, # Slippage ~ 45% (gap > 15%)
        "land_acquisition_pct": 95.0,
        "approval_delay_months": 1.0,
        "funding_risk": "Low",
        "contractor_changes": 0,
        "material_inflation_pct": 5.0,
    })
    alerts = evaluate_project_warnings(project)
    warning_ids = [a.warning_id for a in alerts]
    assert "WARN-SCHED-01" in warning_ids

def test_warning_triggered_on_land_bottleneck():
    project = pd.Series({
        "project_id": "PRJ-TEST-002",
        "planned_duration_months": 36,
        "elapsed_months": 20,          # elapsed ratio > 0.50
        "physical_progress_pct": 50.0,
        "land_acquisition_pct": 40.0,  # Land < 60%
        "approval_delay_months": 0.0,
        "funding_risk": "Low",
        "contractor_changes": 0,
        "material_inflation_pct": 4.0,
    })
    alerts = evaluate_project_warnings(project)
    warning_ids = [a.warning_id for a in alerts]
    assert "WARN-LAND-02" in warning_ids

def test_batch_warnings_empty_when_no_breach():
    clean_project = pd.DataFrame([{
        "project_id": "PRJ-CLEAN",
        "planned_duration_months": 36,
        "elapsed_months": 12,
        "physical_progress_pct": 40.0,
        "land_acquisition_pct": 95.0,
        "approval_delay_months": 1.0,
        "funding_risk": "Low",
        "contractor_changes": 0,
        "material_inflation_pct": 4.0,
    }])
    batch_df = evaluate_batch_warnings(clean_project)
    assert len(batch_df) == 0
