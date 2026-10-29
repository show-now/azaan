"""Page 3: Real-Time Project Risk Prediction & Early Warnings."""

import pandas as pd
import streamlit as st

from infrastructure_risk.config import FUNDING_RISK_LEVELS, SECTORS, STATES
from infrastructure_risk.models.prediction import RiskPredictionService
from infrastructure_risk.warnings.explanations import generate_executive_risk_summary
from infrastructure_risk.warnings.rules import evaluate_project_warnings

st.set_page_config(page_title="Risk Prediction | InfraRisk", page_icon="🔮", layout="wide")

st.title("🔮 Project Risk Prediction Calculator")
st.caption("Estimate cost overrun, delay duration, overrun probability, and triggered early warnings for an individual project.")

service = RiskPredictionService()
if not service.is_trained():
    st.error("Model artifacts not found. Please train models first using the terminal or documentation commands.")
    st.stop()

st.subheader("1. Enter Project Indicators")

with st.form("project_input_form"):
    c1, c2, c3 = st.columns(3)
    with c1:
        sector = st.selectbox("Infrastructure Sector", options=SECTORS)
        original_cost = st.number_input("Sanctioned Cost (₹ Crores)", min_value=1.0, value=750.0, step=25.0)
        elapsed_months = st.number_input("Elapsed Duration (Months)", min_value=0.0, value=20.0, step=1.0)
        approval_delay = st.number_input("Clearance / Approval Delay (Months)", min_value=0.0, value=3.0, step=0.5)

    with c2:
        state = st.selectbox("State / UT", options=STATES)
        planned_duration = st.number_input("Planned Duration (Months)", min_value=1, value=36, step=1)
        physical_progress = st.slider("Physical Progress (%)", min_value=0.0, max_value=100.0, value=40.0, step=0.5)
        contractor_changes = st.number_input("Contractor Replacements", min_value=0, max_value=10, value=0, step=1)

    with c3:
        funding_risk = st.selectbox("Funding Risk Rating", options=FUNDING_RISK_LEVELS, index=0)
        land_acq = st.slider("Land Acquisition Progress (%)", min_value=0.0, max_value=100.0, value=85.0, step=0.5)
        material_inflation = st.number_input("Material Inflation Escalation (%)", min_value=-5.0, max_value=50.0, value=6.5, step=0.5)

    submitted = st.form_submit_button("⚡ Run Risk Assessment & Early Warning Analysis")

if submitted:
    input_payload = {
        "sector": sector,
        "state": state,
        "original_cost": float(original_cost),
        "planned_duration_months": int(planned_duration),
        "elapsed_months": float(elapsed_months),
        "physical_progress_pct": float(physical_progress),
        "land_acquisition_pct": float(land_acq),
        "approval_delay_months": float(approval_delay),
        "funding_risk": funding_risk,
        "contractor_changes": int(contractor_changes),
        "material_inflation_pct": float(material_inflation),
    }

    # Run ML Predictions
    prediction = service.predict(input_payload)

    # Run Rule-Based Early Warnings
    project_series = pd.Series({"project_id": "SIMULATED-PRJ", **input_payload})
    alerts = evaluate_project_warnings(project_series)
    exec_summary = generate_executive_risk_summary(alerts)

    st.divider()
    st.subheader("2. Predictive Analytics Results")

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Predicted Cost Overrun", f"{prediction.predicted_cost_overrun_pct:.1f}%")
    m2.metric("Projected Final Cost", f"₹ {prediction.estimated_final_cost:,.2f} Cr", delta=f"+₹ {prediction.estimated_final_cost - original_cost:,.2f} Cr", delta_color="inverse")
    m3.metric("Predicted Schedule Delay", f"{prediction.predicted_delay_months:.1f} Months")
    m4.metric("High Overrun Probability", f"{prediction.overrun_risk_probability*100:.1f}%", delta=prediction.risk_level, delta_color="inverse")

    st.subheader("3. Early Warning Audit Findings")
    if exec_summary["status"].startswith("Red"):
        st.error(f"**Alert Level:** {exec_summary['status']}")
    elif exec_summary["status"].startswith("Amber"):
        st.warning(f"**Alert Level:** {exec_summary['status']}")
    else:
        st.success(f"**Alert Level:** {exec_summary['status']}")

    st.info(exec_summary["summary_text"])

    if alerts:
        st.markdown("#### Triggered Warning Rules & Corrective Interventions")
        for alert in alerts:
            with st.expander(f"⚠️ [{alert.severity}] {alert.condition} ({alert.warning_id})", expanded=True):
                st.markdown(f"- **Observed Value:** `{alert.observed_value}`")
                st.markdown(f"- **Trigger Threshold:** `{alert.threshold_rule}`")
                st.markdown(f"- **Root Cause Analysis:** {alert.explanation}")
                st.markdown(f"- **Recommended Action:** 📋 **{alert.suggested_action}**")
