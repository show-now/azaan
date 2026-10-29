import pandas as pd

from infrastructure_risk.config import PREDICTOR_FEATURES, TARGET_COLUMNS
from infrastructure_risk.data.generator import generate_synthetic_projects


def test_synthetic_data_reproducibility():
    df1 = generate_synthetic_projects(n_samples=50, seed=123)
    df2 = generate_synthetic_projects(n_samples=50, seed=123)
    pd.testing.assert_frame_equal(df1, df2)

def test_synthetic_data_dimensions_and_columns():
    df = generate_synthetic_projects(n_samples=100, seed=42)
    assert len(df) == 100
    for col in PREDICTOR_FEATURES:
        assert col in df.columns
    for target in TARGET_COLUMNS:
        assert target in df.columns

def test_cost_overrun_consistency():
    df = generate_synthetic_projects(n_samples=50, seed=42)
    # actual_final_cost must equal original_cost * (1 + cost_overrun_pct / 100)
    expected_final_cost = (df["original_cost"] * (1.0 + df["cost_overrun_pct"] / 100.0)).round(2)
    diff = (df["actual_final_cost"] - expected_final_cost).abs().max()
    assert diff <= 0.05
