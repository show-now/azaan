"""Reusable Plotly visualizations for the infrastructure risk system."""

from typing import List

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go


def plot_sector_cost_summary(df: pd.DataFrame) -> go.Figure:
    """Bar chart comparing total original cost vs estimated final cost by sector."""
    if "actual_final_cost" in df.columns:
        cost_col = "actual_final_cost"
        cost_name = "Final / Estimated Cost (₹ Cr)"
    elif "pred_estimated_final_cost" in df.columns:
        cost_col = "pred_estimated_final_cost"
        cost_name = "Predicted Final Cost (₹ Cr)"
    else:
        cost_col = "original_cost"
        cost_name = "Original Cost (₹ Cr)"

    grouped = (
        df.groupby("sector")[["original_cost", cost_col]]
        .sum()
        .reset_index()
        .sort_values(by="original_cost", ascending=False)
    )

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=grouped["sector"],
            y=grouped["original_cost"],
            name="Sanctioned Baseline (₹ Cr)",
            marker_color="#1f77b4",
        )
    )
    if cost_col != "original_cost":
        fig.add_trace(
            go.Bar(
                x=grouped["sector"],
                y=grouped[cost_col],
                name=cost_name,
                marker_color="#d62728",
            )
        )

    fig.update_layout(
        title="Aggregate Project Cost Exposure by Sector",
        barmode="group",
        xaxis_title="Sector",
        yaxis_title="Total Cost (₹ Crores)",
        template="plotly_white",
        margin=dict(l=40, r=40, t=50, b=40),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
    return fig


def plot_progress_vs_delay(df: pd.DataFrame) -> go.Figure:
    """Scatter plot displaying Physical Progress % vs Delay in Months."""
    delay_col = "actual_delay_months" if "actual_delay_months" in df.columns else "pred_delay_months"
    if delay_col not in df.columns:
        delay_col = "approval_delay_months"

    fig = px.scatter(
        df,
        x="physical_progress_pct",
        y=delay_col,
        color="funding_risk",
        size="original_cost",
        hover_data=["project_id", "project_name", "sector", "state"],
        labels={
            "physical_progress_pct": "Physical Progress (%)",
            delay_col: "Delay (Months)",
            "funding_risk": "Funding Risk",
            "original_cost": "Cost (₹ Cr)",
        },
        title="Physical Progress vs Schedule Slippage by Funding Risk",
        color_discrete_map={"Low": "#2ca02c", "Medium": "#ff7f0e", "High": "#d62728"},
        template="plotly_white",
    )
    fig.update_layout(margin=dict(l=40, r=40, t=50, b=40))
    return fig


def plot_state_distribution(df: pd.DataFrame) -> go.Figure:
    """Horizontal bar chart showing project count by state."""
    counts = df["state"].value_counts().reset_index()
    counts.columns = ["state", "count"]
    counts = counts.sort_values(by="count", ascending=True)

    fig = px.bar(
        counts,
        x="count",
        y="state",
        orientation="h",
        labels={"count": "Number of Projects", "state": "State / UT"},
        title="Spatial Distribution of Monitored Projects",
        color="count",
        color_continuous_scale="Blues",
        template="plotly_white",
    )
    fig.update_layout(margin=dict(l=40, r=40, t=50, b=40))
    return fig


def plot_actual_vs_predicted(
    y_true: pd.Series | np.ndarray,
    y_pred: pd.Series | np.ndarray,
    title: str = "Actual vs Predicted",
    label: str = "Value",
) -> go.Figure:
    """Scatter chart comparing actual vs predicted values with a diagonal line."""
    y_t = np.asarray(y_true)
    y_p = np.asarray(y_pred)

    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=y_t,
            y=y_p,
            mode="markers",
            marker=dict(color="#1f77b4", opacity=0.6, size=7),
            name="Predictions",
        )
    )

    # 45 degree perfect prediction line
    min_val = min(float(np.min(y_t)), float(np.min(y_p)))
    max_val = max(float(np.max(y_t)), float(np.max(y_p)))
    fig.add_trace(
        go.Scatter(
            x=[min_val, max_val],
            y=[min_val, max_val],
            mode="lines",
            line=dict(color="#d62728", dash="dash"),
            name="Ideal (y = x)",
        )
    )

    fig.update_layout(
        title=title,
        xaxis_title=f"Actual {label}",
        yaxis_title=f"Predicted {label}",
        template="plotly_white",
        margin=dict(l=40, r=40, t=50, b=40),
    )
    return fig


def plot_confusion_matrix(cm: List[List[int]]) -> go.Figure:
    """Heatmap rendering of a binary classification confusion matrix."""
    labels = ["No Overrun (<20%)", "High Overrun (>=20%)"]
    fig = px.imshow(
        cm,
        text_auto=True,
        x=labels,
        y=labels,
        labels=dict(x="Predicted Class", y="Actual Class", color="Count"),
        color_continuous_scale="Blues",
        title="Confusion Matrix: Overrun Threshold Classification",
    )
    fig.update_layout(template="plotly_white", margin=dict(l=40, r=40, t=50, b=40))
    return fig
