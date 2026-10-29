"""Page 4: Early Warnings Audit & Diagnostics."""

import streamlit as st

from infrastructure_risk.data.loader import load_or_generate_dataset
from infrastructure_risk.warnings.rules import evaluate_batch_warnings

st.set_page_config(page_title="Early Warnings | InfraRisk", page_icon="⚠️", layout="wide")

st.title("⚠️ Rule-Based Early Warning Audit Feed")
st.caption("Transparent, deterministic detection of infrastructure execution distress conditions.")

df = load_or_generate_dataset()
warnings_df = evaluate_batch_warnings(df)

if warnings_df.empty:
    st.success("No active warning flags triggered across the dataset.")
    st.stop()

# Summary Metrics
total_warnings = len(warnings_df)
high_warnings = len(warnings_df[warnings_df["severity"] == "High"])
medium_warnings = len(warnings_df[warnings_df["severity"] == "Medium"])
affected_projects = warnings_df["project_id"].nunique()

c1, c2, c3, c4 = st.columns(4)
c1.metric("Total Triggered Flags", f"{total_warnings:,}")
c2.metric("High Severity Alerts", f"{high_warnings:,}", delta="Urgent Intervention", delta_color="inverse")
c3.metric("Medium Severity Alerts", f"{medium_warnings:,}")
c4.metric("Flagged Projects", f"{affected_projects:,}")

st.divider()

# Severity and Rule Filter
f1, f2 = st.columns(2)
with f1:
    severity_filter = st.multiselect(
        "Filter by Severity", options=["High", "Medium"], default=["High", "Medium"]
    )
with f2:
    condition_types = list(warnings_df["condition"].unique())
    condition_filter = st.multiselect(
        "Filter by Trigger Condition", options=condition_types, default=condition_types
    )

filtered_warnings = warnings_df[
    warnings_df["severity"].isin(severity_filter)
    & warnings_df["condition"].isin(condition_filter)
]

st.markdown(f"**Showing {len(filtered_warnings):,} active warning triggers**")

# Grouped display or table
st.dataframe(
    filtered_warnings[
        [
            "warning_id",
            "project_id",
            "severity",
            "condition",
            "observed_value",
            "threshold_rule",
            "suggested_action",
        ]
    ],
    use_container_width=True,
    height=450,
)

# Export Warnings CSV
csv_warnings = filtered_warnings.to_csv(index=False).encode("utf-8")
st.download_button(
    label="📥 Download Warning Audit Log (CSV)",
    data=csv_warnings,
    file_name="early_warning_audit_log.csv",
    mime="text/csv",
)
