"""Page 5: Model Performance, Validation & Baselines."""

import json

import streamlit as st

from infrastructure_risk.config import METRICS_DIR, TARGET_COST_OVERRUN_PCT, TARGET_DELAY_MONTHS
from infrastructure_risk.data.loader import load_or_generate_dataset
from infrastructure_risk.features import split_train_test
from infrastructure_risk.models.prediction import RiskPredictionService
from infrastructure_risk.visualization.charts import plot_actual_vs_predicted, plot_confusion_matrix

st.set_page_config(page_title="Model Evaluation | InfraRisk", page_icon="📈", layout="wide")

st.title("📈 Machine Learning Performance & Validation")
st.caption("Held-out test set benchmarks, baseline comparisons, and statistical diagnostic charts.")

# Load persisted metrics
metrics_path = METRICS_DIR / "training_metrics.json"

if not metrics_path.exists():
    st.warning("Training metrics artifact not found. Please train models to generate evaluation logs.")
    st.stop()

with open(metrics_path, "r") as f:
    metrics_data = json.load(f)

tab_a, tab_b, tab_c = st.tabs([
    "Model A: Cost Overrun Regressor",
    "Model B: Delay Regressor",
    "Model C: Overrun Classifier",
])

with tab_a:
    st.subheader("Model A: Cost Overrun Percentage (Regression)")
    mA = metrics_data["model_a_cost_overrun_pct"]

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("MAE", f"{mA['mae']:.2f}%", delta=f"{mA.get('mae_improvement_pct', 0):.1f}% vs Mean Baseline")
    col2.metric("RMSE", f"{mA['rmse']:.2f}%")
    col3.metric("R² Score", f"{mA['r2']:.3f}")
    col4.metric("Dummy Baseline MAE", f"{mA.get('baseline_mean_mae', 0):.2f}%")

    st.markdown("#### Actual vs Predicted Overrun %")
    df = load_or_generate_dataset()
    _, X_test, _, y_test = split_train_test(df, target_column=TARGET_COST_OVERRUN_PCT)
    service = RiskPredictionService()
    if service.is_trained():
        service.load_models()
        y_pred_a = service._model_a.predict(X_test)
        fig_a = plot_actual_vs_predicted(y_test, y_pred_a, title="Model A: Actual vs Predicted Overrun %", label="Overrun %")
        st.plotly_chart(fig_a, use_container_width=True)

with tab_b:
    st.subheader("Model B: Schedule Delay in Months (Regression)")
    mB = metrics_data["model_b_delay_months"]

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("MAE", f"{mB['mae']:.2f} Months", delta=f"{mB.get('mae_improvement_pct', 0):.1f}% vs Mean Baseline")
    col2.metric("RMSE", f"{mB['rmse']:.2f} Months")
    col3.metric("R² Score", f"{mB['r2']:.3f}")
    col4.metric("Dummy Baseline MAE", f"{mB.get('baseline_mean_mae', 0):.2f} Months")

    st.markdown("#### Actual vs Predicted Delay (Months)")
    _, X_test_b, _, y_test_b = split_train_test(df, target_column=TARGET_DELAY_MONTHS)
    if service.is_trained():
        y_pred_b = service._model_b.predict(X_test_b)
        fig_b = plot_actual_vs_predicted(y_test_b, y_pred_b, title="Model B: Actual vs Predicted Delay (Months)", label="Months")
        st.plotly_chart(fig_b, use_container_width=True)

with tab_c:
    st.subheader("Model C: Cost Overrun Threshold (Classification)")
    mC = metrics_data["model_c_overrun_flag"]

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Accuracy", f"{mC['accuracy']*100:.1f}%", delta=f"+{mC.get('accuracy_gain', 0)*100:.1f}% vs Majority Baseline")
    col2.metric("Precision", f"{mC['precision']*100:.1f}%")
    col3.metric("Recall", f"{mC['recall']*100:.1f}%")
    col4.metric("ROC-AUC", f"{mC.get('roc_auc', 0)*100:.1f}%" if mC.get('roc_auc') else "N/A")

    st.markdown("#### Confusion Matrix")
    if "confusion_matrix" in mC:
        fig_cm = plot_confusion_matrix(mC["confusion_matrix"])
        st.plotly_chart(fig_cm, use_container_width=True)
