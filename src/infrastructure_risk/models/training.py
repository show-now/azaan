"""Model training workflow for Models A, B, and C with serialization."""

import json
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.pipeline import Pipeline

from infrastructure_risk.config import (
    DEFAULT_RANDOM_SEED,
    DEFAULT_TEST_SIZE,
    METRICS_DIR,
    MODELS_DIR,
    PREDICTOR_FEATURES,
    TARGET_COST_OVERRUN_PCT,
    TARGET_DELAY_MONTHS,
    TARGET_OVERRUN_FLAG,
)
from infrastructure_risk.data.loader import load_or_generate_dataset
from infrastructure_risk.features import build_preprocessor, split_train_test
from infrastructure_risk.models.evaluation import evaluate_classification, evaluate_regression


def train_model_a(
    df: pd.DataFrame,
    seed: int = DEFAULT_RANDOM_SEED,
) -> Tuple[Pipeline, Dict[str, Any]]:
    """Train Model A: Cost Overrun Percentage Regressor.

    Target: cost_overrun_pct
    """
    X_train, X_test, y_train, y_test = split_train_test(
        df,
        target_column=TARGET_COST_OVERRUN_PCT,
        test_size=DEFAULT_TEST_SIZE,
        seed=seed,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=100,
                    max_depth=12,
                    min_samples_split=4,
                    random_state=seed,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    metrics = evaluate_regression(y_test, y_pred, y_train_mean=float(y_train.mean()))
    return pipeline, metrics


def train_model_b(
    df: pd.DataFrame,
    seed: int = DEFAULT_RANDOM_SEED,
) -> Tuple[Pipeline, Dict[str, Any]]:
    """Train Model B: Schedule Delay Duration Regressor.

    Target: actual_delay_months
    """
    X_train, X_test, y_train, y_test = split_train_test(
        df,
        target_column=TARGET_DELAY_MONTHS,
        test_size=DEFAULT_TEST_SIZE,
        seed=seed,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            (
                "regressor",
                RandomForestRegressor(
                    n_estimators=100,
                    max_depth=12,
                    min_samples_split=4,
                    random_state=seed,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    metrics = evaluate_regression(y_test, y_pred, y_train_mean=float(y_train.mean()))
    return pipeline, metrics


def train_model_c(
    df: pd.DataFrame,
    seed: int = DEFAULT_RANDOM_SEED,
) -> Tuple[Pipeline, Dict[str, Any]]:
    """Train Model C: Cost Overrun Threshold Classifier.

    Target: cost_overrun_flag (binary)
    """
    X_train, X_test, y_train, y_test = split_train_test(
        df,
        target_column=TARGET_OVERRUN_FLAG,
        test_size=DEFAULT_TEST_SIZE,
        seed=seed,
        stratify=True,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=100,
                    max_depth=10,
                    class_weight="balanced",
                    random_state=seed,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    majority_class = int(y_train.mode()[0])
    metrics = evaluate_classification(
        y_test,
        y_pred,
        y_proba=y_proba,
        majority_class=majority_class,
    )
    return pipeline, metrics


def train_and_persist_all_models(
    dataset_path: Path | None = None,
    seed: int = DEFAULT_RANDOM_SEED,
) -> Dict[str, Any]:
    """Train Models A, B, and C and serialize them to artifacts/models/.

    Also saves evaluation metrics to artifacts/metrics/.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    METRICS_DIR.mkdir(parents=True, exist_ok=True)

    df = load_or_generate_dataset(filepath=dataset_path, seed=seed)

    print("Training Model A: Cost Overrun Regressor...")
    model_a, metrics_a = train_model_a(df, seed=seed)
    joblib.dump(model_a, MODELS_DIR / "model_a_cost_regressor.joblib")

    print("Training Model B: Schedule Delay Regressor...")
    model_b, metrics_b = train_model_b(df, seed=seed)
    joblib.dump(model_b, MODELS_DIR / "model_b_delay_regressor.joblib")

    print("Training Model C: Cost Overrun Classifier...")
    model_c, metrics_c = train_model_c(df, seed=seed)
    joblib.dump(model_c, MODELS_DIR / "model_c_overrun_classifier.joblib")

    combined_metrics = {
        "seed": seed,
        "n_samples": len(df),
        "predictor_features": PREDICTOR_FEATURES,
        "model_a_cost_overrun_pct": metrics_a,
        "model_b_delay_months": metrics_b,
        "model_c_overrun_flag": metrics_c,
    }

    metrics_file = METRICS_DIR / "training_metrics.json"
    with open(metrics_file, "w") as f:
        json.dump(combined_metrics, f, indent=2)

    print(f"All models trained and saved to {MODELS_DIR}")
    print(f"Metrics saved to {metrics_file}")
    return combined_metrics


if __name__ == "__main__":
    train_and_persist_all_models()
