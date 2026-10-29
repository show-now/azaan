import pytest

from infrastructure_risk.data.generator import generate_synthetic_projects
from infrastructure_risk.data.validation import assert_zero_target_leakage, validate_dataframe


def test_validate_valid_dataframe():
    df = generate_synthetic_projects(n_samples=50, seed=42)
    is_valid, issues = validate_dataframe(df, require_targets=True)
    assert is_valid is True
    assert len(issues) == 0

def test_validate_missing_columns():
    df = generate_synthetic_projects(n_samples=50, seed=42)
    df_dropped = df.drop(columns=["original_cost", "sector"])
    is_valid, issues = validate_dataframe(df_dropped)
    assert is_valid is False
    assert any("original_cost" in issue for issue in issues)

def test_validate_out_of_bounds_progress():
    df = generate_synthetic_projects(n_samples=20, seed=42)
    df.loc[0, "physical_progress_pct"] = 150.0  # Invalid bound
    is_valid, issues = validate_dataframe(df)
    assert is_valid is False
    assert any("physical_progress_pct" in issue for issue in issues)

def test_target_leakage_assertion():
    df = generate_synthetic_projects(n_samples=20, seed=42)
    # Target leakage should raise an error
    with pytest.raises(ValueError, match="TARGET LEAKAGE DETECTED"):
        assert_zero_target_leakage(df[["original_cost", "actual_final_cost"]])

    # Clean predictor matrix should pass without error
    assert_zero_target_leakage(df[["original_cost", "physical_progress_pct"]])
