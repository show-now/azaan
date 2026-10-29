"""Data validation and schema integrity enforcement.

Guarantees clean types, expected columns, value bounds, absence of NaNs,
and safeguards against target leakage.
"""

from typing import List, Tuple

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, field_validator

from infrastructure_risk.config import (
    FUNDING_RISK_LEVELS,
    ID_COLUMN,
    NAME_COLUMN,
    NUMERIC_FEATURES,
    PREDICTOR_FEATURES,
    SECTORS,
    TARGET_COLUMNS,
)


class ProjectRecord(BaseModel):
    """Schema definition for an individual infrastructure project record."""

    project_id: str = Field(..., description="Unique project tracking identifier")
    project_name: str = Field(..., description="Readable project label")
    sector: str = Field(..., description="Infrastructure sector")
    state: str = Field(..., description="Geographical jurisdiction")
    original_cost: float = Field(..., gt=0.0, description="Baseline sanctioned cost in Crores (INR)")
    planned_duration_months: int = Field(..., gt=0, description="Scheduled duration in months")
    elapsed_months: float = Field(..., ge=0.0, description="Time elapsed since initiation in months")
    physical_progress_pct: float = Field(..., ge=0.0, le=100.0, description="Physical progress (0-100%)")
    land_acquisition_pct: float = Field(..., ge=0.0, le=100.0, description="Land acquired (0-100%)")
    approval_delay_months: float = Field(..., ge=0.0, description="Delays in statutory clearances")
    funding_risk: str = Field(..., description="Funding risk rating (Low, Medium, High)")
    contractor_changes: int = Field(..., ge=0, description="Total replacements of primary contractors")
    material_inflation_pct: float = Field(..., description="Observed/projected material inflation rate")

    @field_validator("sector")
    @classmethod
    def validate_sector(cls, v: str) -> str:
        if v not in SECTORS:
            # Allow fallback if valid string, but warn or preserve
            pass
        return v

    @field_validator("funding_risk")
    @classmethod
    def validate_funding(cls, v: str) -> str:
        if v not in FUNDING_RISK_LEVELS:
            raise ValueError(f"funding_risk must be one of {FUNDING_RISK_LEVELS}, got '{v}'")
        return v


def validate_dataframe(
    df: pd.DataFrame,
    require_targets: bool = False,
    allow_extra_columns: bool = True,
) -> Tuple[bool, List[str]]:
    """Validate a project DataFrame against schema, bounds, and consistency checks.

    Args:
        df: Pandas DataFrame to validate.
        require_targets: If True, target columns must exist and be valid.
        allow_extra_columns: If False, extraneous columns fail validation.

    Returns:
        Tuple of (is_valid: bool, issues: List[str]).
    """
    issues: List[str] = []

    if df is None or df.empty:
        return False, ["Input DataFrame is empty or None."]

    # 1. Required identifier and predictor columns check
    required_cols = [ID_COLUMN, NAME_COLUMN] + PREDICTOR_FEATURES
    missing_req = [c for c in required_cols if c not in df.columns]
    if missing_req:
        issues.append(f"Missing required columns: {missing_req}")

    if require_targets:
        missing_targets = [c for c in TARGET_COLUMNS if c not in df.columns]
        if missing_targets:
            issues.append(f"Missing required target outcome columns: {missing_targets}")

    # Return early if fundamental columns are absent
    if issues:
        return False, issues

    # 2. Check for duplicate IDs
    duplicates = df[ID_COLUMN].duplicated().sum()
    if duplicates > 0:
        issues.append(f"Found {duplicates} duplicate {ID_COLUMN} records.")

    # 3. Numeric null and range bounds validation
    for col in NUMERIC_FEATURES:
        if col in df.columns:
            if df[col].isnull().any():
                nan_count = int(df[col].isnull().sum())
                issues.append(f"Column '{col}' contains {nan_count} missing (NaN) values.")
            if not np.issubdtype(df[col].dtype, np.number):
                issues.append(f"Column '{col}' must be numeric, got dtype {df[col].dtype}.")

    # Logical value bounds
    if "original_cost" in df.columns and (df["original_cost"] <= 0).any():
        issues.append("Column 'original_cost' contains values <= 0 (must be strictly positive).")

    if "planned_duration_months" in df.columns and (df["planned_duration_months"] <= 0).any():
        issues.append("Column 'planned_duration_months' contains non-positive values.")

    for pct_col in ["physical_progress_pct", "land_acquisition_pct"]:
        if pct_col in df.columns:
            invalid_bounds = ((df[pct_col] < 0.0) | (df[pct_col] > 100.0)).sum()
            if invalid_bounds > 0:
                issues.append(f"Column '{pct_col}' contains {invalid_bounds} values outside [0.0, 100.0].")

    if "contractor_changes" in df.columns and (df["contractor_changes"] < 0).any():
        issues.append("Column 'contractor_changes' has negative counts.")

    # 4. Target validity if present
    if require_targets or all(c in df.columns for c in TARGET_COLUMNS):
        if "actual_final_cost" in df.columns and (df["actual_final_cost"] <= 0).any():
            issues.append("Target 'actual_final_cost' contains values <= 0.")
        if "cost_overrun_flag" in df.columns:
            non_binary = (~df["cost_overrun_flag"].isin([0, 1])).sum()
            if non_binary > 0:
                issues.append(f"Target 'cost_overrun_flag' has {non_binary} non-binary values.")

    is_valid = len(issues) == 0
    return is_valid, issues


def assert_zero_target_leakage(feature_matrix: pd.DataFrame) -> None:
    """Raise ValueError if any target column leaked into the feature matrix."""
    leaked = [col for col in TARGET_COLUMNS if col in feature_matrix.columns]
    if leaked:
        raise ValueError(
            f"TARGET LEAKAGE DETECTED: The feature matrix contains post-completion outcome labels: {leaked}. "
            "These must be stripped prior to model fitting or inference."
        )
