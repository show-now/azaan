"""Page 2: Interactive Project Explorer."""

import streamlit as st

from infrastructure_risk.config import FUNDING_RISK_LEVELS, SECTORS, STATES
from infrastructure_risk.data.loader import load_or_generate_dataset
from infrastructure_risk.models.prediction import RiskPredictionService

st.set_page_config(page_title="Project Explorer | InfraRisk", page_icon="🔍", layout="wide")

st.title("🔍 Project Explorer & Data Inspector")
st.caption("Filter, search, inspect project health, and export monitored indicators.")

df = load_or_generate_dataset()

# Optional batch inference augmentation
service = RiskPredictionService()
if service.is_trained():
    df_display = service.predict_batch(df)
else:
    df_display = df.copy()

# Sidebar Filters
st.sidebar.header("Filter Criteria")

selected_sectors = st.sidebar.multiselect("Sectors", options=SECTORS, default=[])
selected_states = st.sidebar.multiselect("States / UTs", options=STATES, default=[])
selected_funding = st.sidebar.multiselect("Funding Risk Level", options=FUNDING_RISK_LEVELS, default=[])

min_progress, max_progress = st.sidebar.slider(
    "Physical Progress Range (%)", min_value=0.0, max_value=100.0, value=(0.0, 100.0)
)

search_query = st.text_input("Search by Project ID or Name", placeholder="e.g. PRJ-IN-01005 or Corridor")

# Filter execution
filtered_df = df_display.copy()

if selected_sectors:
    filtered_df = filtered_df[filtered_df["sector"].isin(selected_sectors)]
if selected_states:
    filtered_df = filtered_df[filtered_df["state"].isin(selected_states)]
if selected_funding:
    filtered_df = filtered_df[filtered_df["funding_risk"].isin(selected_funding)]

filtered_df = filtered_df[
    (filtered_df["physical_progress_pct"] >= min_progress)
    & (filtered_df["physical_progress_pct"] <= max_progress)
]

if search_query:
    q = search_query.strip().lower()
    filtered_df = filtered_df[
        filtered_df["project_id"].str.lower().str.contains(q)
        | filtered_df["project_name"].str.lower().str.contains(q)
    ]

st.markdown(f"**Showing {len(filtered_df):,} of {len(df_display):,} projects**")

st.dataframe(
    filtered_df,
    use_container_width=True,
    height=450,
)

# Export Data CSV button
csv_data = filtered_df.to_csv(index=False).encode("utf-8")
st.download_button(
    label="📥 Download Filtered Projects (CSV)",
    data=csv_data,
    file_name="infrastructure_projects_filtered.csv",
    mime="text/csv",
)
