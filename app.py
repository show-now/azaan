"""Streamlit main entry point for AI-Powered Infrastructure Risk Early Warning System."""

import streamlit as st

from infrastructure_risk.data.loader import load_or_generate_dataset
from infrastructure_risk.models.prediction import RiskPredictionService

st.set_page_config(
    page_title="Infrastructure Risk Early Warning System",
    page_icon="🏗️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Academic boundary notice
st.sidebar.markdown("### 🎓 Research Prototype")
st.sidebar.info(
    "**Academic Boundary Disclaimer:**\n"
    "This is an independent academic research and demonstration prototype inspired by the "
    "monitoring frameworks of MoSPI and PAIMANA in India. It does **not** interface with "
    "production government systems and utilizes reproducible synthetic data with verified boundaries."
)

st.title("🏗️ AI-Powered Infrastructure Risk Early Warning System")
st.subheader("Predictive Analytics for Project Cost Escalation & Schedule Slippage")

st.markdown(
    """
Welcome to the **Infrastructure Risk Early Warning System**. This decision-support system leverages
machine learning and rule-based diagnostic indicators to identify infrastructure projects at elevated risk of:
1. **Cost Overrun Percentage (Model A)**
2. **Schedule Slippage in Months (Model B)**
3. **Severe Overrun Threshold Breaches (Model C)**
4. **Early Warning Diagnostic Indicators** (Land acquisition bottlenecks, contractor turnover, approval delays, etc.)

---
### 🧭 System Navigation
Use the sidebar to explore the application:
- **📊 1_Project_Overview**: High-level portfolio risk dashboard, financial exposure, and spatial breakdown.
- **🔍 2_Project_Explorer**: Search, filter, inspect, and export infrastructure project records.
- **🔮 3_Risk_Prediction**: Real-time project risk calculator for single projects with validated inputs.
- **⚠️ 4_Early_Warnings**: Auditable, deterministic early warning rule triggers with mitigation recommendations.
- **📈 5_Model_Evaluation**: Statistical evaluation metrics (MAE, RMSE, ROC-AUC, Confusion Matrix) and baseline benchmarks.

---
### ⚙️ Quick Health Check
"""
)

col1, col2 = st.columns(2)

with col1:
    try:
        df = load_or_generate_dataset()
        st.success(f"✅ Data repository active: Loaded **{len(df):,}** infrastructure project records.")
    except Exception as e:
        st.error(f"❌ Data loading error: {e}")

with col2:
    try:
        service = RiskPredictionService()
        if service.is_trained():
            st.success("✅ Machine Learning pipelines active: Models A, B, and C ready for inference.")
        else:
            st.warning("⚠️ Model artifacts missing. Run `python -m infrastructure_risk.models.training`.")
    except Exception as e:
        st.error(f"❌ Model check error: {e}")
