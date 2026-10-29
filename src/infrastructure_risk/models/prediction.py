"""Inference service for loading serialized models and serving predictions."""

from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from infrastructure_risk.config import (
    MODELS_DIR,
    PREDICTOR_FEATURES,
)
from infrastructure_risk.data.validation import assert_zero_target_leakage


class PredictionInput(BaseModel):
    """Input payload for a single infrastructure project prediction."""

    sector: str = Field(..., description="Infrastructure sector")
    state: str = Field(..., description="Geographical jurisdiction")
    original_cost: float = Field(..., gt=0.0, description="Sanctioned cost in ₹ Crores")
    planned_duration_months: int = Field(..., gt=0, description="Scheduled duration in months")
    elapsed_months: float = Field(..., ge=0.0, description="Time elapsed in months")
    physical_progress_pct: float = Field(..., ge=0.0, le=100.0, description="Physical progress (0-100%)")
    land_acquisition_pct: float = Field(..., ge=0.0, le=100.0, description="Land acquired (0-100%)")
    approval_delay_months: float = Field(..., ge=0.0, description="Clearance delay in months")
    funding_risk: str = Field(..., description="Funding risk: Low, Medium, High")
    contractor_changes: int = Field(..., ge=0, description="Number of contractor changes")
    material_inflation_pct: float = Field(..., description="Observed material inflation %")


class PredictionResult(BaseModel):
    """Structured output from all models."""

    predicted_cost_overrun_pct: float
    estimated_final_cost: float
    predicted_delay_months: float
    overrun_risk_probability: float
    overrun_flag: int
    risk_level: str


class RiskPredictionService:
    """Service managing artifact loading and inference for Models A, B, and C."""

    def __init__(self, models_dir: Path = MODELS_DIR) -> None:
        self.models_dir = models_dir
        self.model_a_path = models_dir / "model_a_cost_regressor.joblib"
        self.model_b_path = models_dir / "model_b_delay_regressor.joblib"
        self.model_c_path = models_dir / "model_c_overrun_classifier.joblib"

        self._model_a = None
        self._model_b = None
        self._model_c = None

    def is_trained(self) -> bool:
        """Check if all three serialized model artifacts exist."""
        return (
            self.model_a_path.exists()
            and self.model_b_path.exists()
            and self.model_c_path.exists()
        )

    def load_models(self) -> None:
        """Load serialized models from disk."""
        if not self.is_trained():
            raise FileNotFoundError(
                f"Model artifacts not found in {self.models_dir}. Please run model training first."
            )
        self._model_a = joblib.load(self.model_a_path)
        self._model_b = joblib.load(self.model_b_path)
        self._model_c = joblib.load(self.model_c_path)

    def predict(self, input_data: PredictionInput | Dict[str, Any]) -> PredictionResult:
        """Generate predictions across all three models for a project."""
        if self._model_a is None or self._model_b is None or self._model_c is None:
            self.load_models()

        if isinstance(input_data, dict):
            # Validate via Pydantic
            validated = PredictionInput(**input_data)
            record = validated.model_dump()
        else:
            record = input_data.model_dump()

        df_input = pd.DataFrame([record])
        assert_zero_target_leakage(df_input)

        # 1. Model A: Cost Overrun %
        pred_cost_pct = float(self._model_a.predict(df_input)[0])
        pred_cost_pct = max(pred_cost_pct, -5.0)

        # Estimated final cost
        original_cost = float(record["original_cost"])
        estimated_final_cost = round(original_cost * (1.0 + pred_cost_pct / 100.0), 2)

        # 2. Model B: Schedule Delay in Months
        pred_delay = float(self._model_b.predict(df_input)[0])
        pred_delay = max(round(pred_delay, 1), 0.0)

        # 3. Model C: Overrun Probability & Flag
        pred_proba = float(self._model_c.predict_proba(df_input)[0][1])
        pred_flag = int(pred_proba >= 0.50)

        # Risk level determination
        if pred_proba >= 0.65 or pred_cost_pct >= 30.0:
            risk_level = "High"
        elif pred_proba >= 0.35 or pred_cost_pct >= 15.0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        return PredictionResult(
            predicted_cost_overrun_pct=round(pred_cost_pct, 2),
            estimated_final_cost=estimated_final_cost,
            predicted_delay_months=pred_delay,
            overrun_risk_probability=round(pred_proba, 4),
            overrun_flag=pred_flag,
            risk_level=risk_level,
        )

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate predictions for a DataFrame of projects."""
        if self._model_a is None or self._model_b is None or self._model_c is None:
            self.load_models()

        assert_zero_target_leakage(df)
        df_features = df[PREDICTOR_FEATURES].copy()

        pred_cost_pcts = np.clip(self._model_a.predict(df_features), -5.0, None)
        pred_delays = np.clip(self._model_b.predict(df_features), 0.0, None)
        pred_probas = self._model_c.predict_proba(df_features)[:, 1]

        results_df = df.copy()
        results_df["pred_cost_overrun_pct"] = np.round(pred_cost_pcts, 2)
        results_df["pred_estimated_final_cost"] = np.round(
            results_df["original_cost"] * (1.0 + pred_cost_pcts / 100.0), 2
        )
        results_df["pred_delay_months"] = np.round(pred_delays, 1)
        results_df["pred_overrun_probability"] = np.round(pred_probas, 4)
        results_df["pred_risk_level"] = np.where(
            (pred_probas >= 0.65) | (pred_cost_pcts >= 30.0),
            "High",
            np.where((pred_probas >= 0.35) | (pred_cost_pcts >= 15.0), "Medium", "Low"),
        )
        return results_df
