# Architecture & Technical Decision Records (ADRs)

## ADR-001: Technology Stack and Framework Selection
- **Date**: 2026-10-29
- **Context**: Need a rapid, highly interactive, reproducible web application capable of performing regression, classification, explainable early-warning analysis, and visualizing project metrics for an academic demonstration.
- **Decision**: Python 3.13, Streamlit, Scikit-learn (RandomForest as primary baseline), Plotly, Pydantic, and Joblib.
- **Alternatives Considered**: FastAPI + React (higher development overhead, less direct academic reproduction), Dash (less streamlined state management than Streamlit).
- **Consequences**: Fast feedback loop, self-contained single-command deployment, clean interactive charts via Plotly.

## ADR-002: Target Leakage Safeguard in Pipeline Design
- **Date**: 2026-10-29
- **Context**: In infrastructure project monitoring, outcome values like `actual_final_cost` and `actual_delay_months` or derived percentages are only known after project completion. If accidentally fed to predictive models, models exhibit 100% artificial accuracy.
- **Decision**: Explicit definition of `PREDICTOR_FEATURES` vs `TARGET_COLUMNS` in `config.py`. Enforce hard filters in `data/validation.py` and `features.py` that strip any target columns prior to vectorization.
- **Consequences**: Guarantees realistic model evaluations; models only train on information that is legitimately observable while a project is ongoing.

## ADR-003: Model Serialization and Independent Training Workflow
- **Date**: 2026-10-29
- **Context**: Streamlit re-executes code upon user interaction. Training models on each UI render causes massive lag, non-deterministic states, and potential memory leaks.
- **Decision**: Decouple training (`src/infrastructure_risk/models/training.py` CLI / callable service) from inference (`src/infrastructure_risk/models/prediction.py`). Serialized scikit-learn pipelines (preprocessor + model) are stored in `artifacts/models/` and loaded with caching in Streamlit.
- **Consequences**: Instant UI responsiveness, persistent model versions, traceable model cards, and clear error handling if artifacts are not yet generated.

## ADR-004: Decoupled Rule-Based Warning Engine vs ML Predictions
- **Date**: 2026-10-29
- **Context**: ML predictions provide statistical estimations, but stakeholders and project officers require deterministic, auditable rules tied to operational thresholds (e.g. land acquisition < 50% when elapsed duration > 60%).
- **Decision**: Create an independent `warnings` package with explicit rules (`rules.py`) and traceable explanations (`explanations.py`) that run side-by-side with ML predictions without conflating statistical correlation with policy-driven warning thresholds.
- **Consequences**: Clear separation of concerns, high explainability, and configurable audit thresholds.
