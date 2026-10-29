"""Page 1: Project Portfolio Overview."""

import streamlit as st

from infrastructure_risk.data.loader import load_or_generate_dataset
from infrastructure_risk.visualization.charts import (
    plot_progress_vs_delay,
    plot_sector_cost_summary,
    plot_state_distribution,
)
from infrastructure_risk.warnings.rules import evaluate_batch_warnings

st.set_page_config(page_title="Portfolio Overview | InfraRisk", page_icon="📊", layout="wide")

st.title("📊 Portfolio Overview & Risk Distribution")
st.caption("Macro analytics across monitored infrastructure investments.")

df = load_or_generate_dataset()
warnings_df = evaluate_batch_warnings(df)
flagged_projects_count = warnings_df["project_id"].nunique()

# Portfolio KPIs
col1, col2, col3, col4 = st.columns(4)

total_projects = len(df)
total_sanctioned_cost = df["original_cost"].sum()
total_estimated_cost = df["actual_final_cost"].sum() if "actual_final_cost" in df.columns else total_sanctioned_cost
aggregate_cost_overrun = max(0.0, total_estimated_cost - total_sanctioned_cost)

col1.metric("Monitored Projects", f"{total_projects:,}")
col2.metric("Total Sanctioned Cost", f"₹ {total_sanctioned_cost:,.1f} Cr")
col3.metric("Projected Cost Overrun", f"₹ {aggregate_cost_overrun:,.1f} Cr", delta=f"+{aggregate_cost_overrun/total_sanctioned_cost*100:.1f}%")
col4.metric("Projects with Early Warnings", f"{flagged_projects_count:,}", delta=f"{flagged_projects_count/total_projects*100:.1f}% of total", delta_color="inverse")

st.divider()

# Interactive Charts
c1, c2 = st.columns(2)

with c1:
    fig_sector = plot_sector_cost_summary(df)
    st.plotly_chart(fig_sector, use_container_width=True)

with c2:
    fig_delay = plot_progress_vs_delay(df)
    st.plotly_chart(fig_delay, use_container_width=True)

st.plotly_chart(plot_state_distribution(df), use_container_width=True)
