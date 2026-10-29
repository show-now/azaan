"""Feature engineering and preprocessing pipelines.

Provides reproducible scikit-learn transformers handling numeric imputation/scaling,
one-hot encoding for categorical variables with unknown handling, and train/test splitting.
"""

from typing import Tuple

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from infrastructure_risk.config import (
    CATEGORICAL_FEATURES,
    DEFAULT_RANDOM_SEED,
    DEFAULT_TEST_SIZE,
    NUMERIC_FEATURES,
    PREDICTOR_FEATURES,
)
from infrastructure_risk.data.validation import assert_zero_target_leakage


def build_preprocessor() -> ColumnTransformer:
    """Construct a ColumnTransformer for numerical and categorical features.

    Numerical pipeline:
      - Median imputation (guards against missing entries)
      - Standard scaling

    Categorical pipeline:
      - Most frequent imputation
      - OneHotEncoder with handle_unknown='ignore' (robust to unseen categories)
    """
    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ],
        remainder="drop",  # Drop project_id, project_name, etc.
    )

    return preprocessor


def extract_features_and_targets(
    df: pd.DataFrame,
    target_column: str,
) -> Tuple[pd.DataFrame, pd.Series]:
    """Extract predictor features X and target vector y with leakage protection.

    Args:
        df: Input DataFrame containing project records.
        target_column: Target column to extract as y.

    Returns:
        Tuple of (X: pd.DataFrame, y: pd.Series)
    """
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in DataFrame.")

    # Select only legitimate predictor features that exist in df
    available_predictors = [col for col in PREDICTOR_FEATURES if col in df.columns]
    X = df[available_predictors].copy()

    # Safeguard: ensure target never leaks into X
    assert_zero_target_leakage(X)

    y = df[target_column].copy()
    return X, y


def split_train_test(
    df: pd.DataFrame,
    target_column: str,
    test_size: float = DEFAULT_TEST_SIZE,
    seed: int = DEFAULT_RANDOM_SEED,
    stratify: bool = False,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Split dataset into training and testing subsets."""
    X, y = extract_features_and_targets(df, target_column)
    stratify_target = y if stratify else None

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=seed,
        stratify=stratify_target,
    )
    return X_train, X_test, y_train, y_test
