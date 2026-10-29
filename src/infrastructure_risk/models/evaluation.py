"""Evaluation metrics and baseline comparison services for regression and classification."""

from typing import Any, Dict

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)


def evaluate_regression(
    y_true: pd.Series | np.ndarray,
    y_pred: pd.Series | np.ndarray,
    y_train_mean: float | None = None,
) -> Dict[str, Any]:
    """Compute regression performance metrics: MAE, RMSE, R2, and baseline comparison.

    Args:
        y_true: Observed ground truth values.
        y_pred: Model predicted values.
        y_train_mean: Optional training target mean for computing dummy/mean baseline.

    Returns:
        Dictionary of computed metrics and optional baseline comparisons.
    """
    y_t = np.asarray(y_true)
    y_p = np.asarray(y_pred)

    mae = float(mean_absolute_error(y_t, y_p))
    rmse = float(np.sqrt(mean_squared_error(y_t, y_p)))
    r2 = float(r2_score(y_t, y_p))

    metrics = {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "r2": round(r2, 4),
        "sample_count": len(y_t),
    }

    if y_train_mean is not None:
        baseline_preds = np.full_like(y_t, fill_value=y_train_mean)
        b_mae = float(mean_absolute_error(y_t, baseline_preds))
        b_rmse = float(np.sqrt(mean_squared_error(y_t, baseline_preds)))
        metrics["baseline_mean_mae"] = round(b_mae, 3)
        metrics["baseline_mean_rmse"] = round(b_rmse, 3)
        metrics["mae_improvement_pct"] = round(((b_mae - mae) / b_mae) * 100.0, 2) if b_mae > 0 else 0.0

    return metrics


def evaluate_classification(
    y_true: pd.Series | np.ndarray,
    y_pred: pd.Series | np.ndarray,
    y_proba: pd.Series | np.ndarray | None = None,
    majority_class: int | None = None,
) -> Dict[str, Any]:
    """Compute classification performance metrics.

    Args:
        y_true: Ground truth binary labels.
        y_pred: Predicted class labels.
        y_proba: Predicted probabilities for positive class (1).
        majority_class: Optional training set majority class for baseline comparison.

    Returns:
        Dictionary of classification metrics and confusion matrix.
    """
    y_t = np.asarray(y_true)
    y_p = np.asarray(y_pred)

    acc = float(accuracy_score(y_t, y_p))
    prec = float(precision_score(y_t, y_p, zero_division=0))
    rec = float(recall_score(y_t, y_p, zero_division=0))
    f1 = float(f1_score(y_t, y_p, zero_division=0))

    cm = confusion_matrix(y_t, y_p).tolist()

    roc_auc = None
    if y_proba is not None:
        try:
            # Requires at least one instance of each class in y_t
            if len(np.unique(y_t)) > 1:
                roc_auc = float(roc_auc_score(y_t, y_proba))
        except Exception:
            roc_auc = None

    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "confusion_matrix": cm,
        "sample_count": len(y_t),
    }

    if majority_class is not None:
        majority_preds = np.full_like(y_t, fill_value=majority_class)
        b_acc = float(accuracy_score(y_t, majority_preds))
        metrics["baseline_majority_accuracy"] = round(b_acc, 4)
        metrics["accuracy_gain"] = round(acc - b_acc, 4)

    return metrics
