from infrastructure_risk.config import TARGET_COST_OVERRUN_PCT
from infrastructure_risk.data.generator import generate_synthetic_projects
from infrastructure_risk.features import build_preprocessor, extract_features_and_targets


def test_feature_extraction_removes_targets():
    df = generate_synthetic_projects(n_samples=40, seed=42)
    X, y = extract_features_and_targets(df, target_column=TARGET_COST_OVERRUN_PCT)
    assert TARGET_COST_OVERRUN_PCT not in X.columns
    assert "actual_final_cost" not in X.columns
    assert len(X) == len(y) == 40

def test_preprocessor_handles_unseen_categories():
    df = generate_synthetic_projects(n_samples=50, seed=42)
    X, _ = extract_features_and_targets(df, target_column=TARGET_COST_OVERRUN_PCT)
    preprocessor = build_preprocessor()
    preprocessor.fit(X)

    # Test with unseen sector and unseen state
    unseen_df = X.copy().iloc[:2]
    unseen_df.loc[0, "sector"] = "Hyperloop Transport"  # Unknown sector
    unseen_df.loc[0, "state"] = "Foreign Territory"     # Unknown state

    # Should transform without raising unknown category errors
    transformed = preprocessor.transform(unseen_df)
    assert transformed.shape[0] == 2
    assert transformed.shape[1] > 0
