# AGENTS.md: Operational Memory and Developer Instructions

## 1. Project Purpose and Boundaries
This repository implements an academic prototype: **AI-Powered Predictive Analytics and Early Warning System for Infrastructure Project Cost and Time Overruns**.
- Inspired conceptually by the monitoring framework of MoSPI and the PAIMANA portal in India.
- **Academic Boundary Disclaimer:** This is an independent academic research and demonstration prototype. It is NOT an official MoSPI product and does NOT directly interface with production government databases or PAIMANA servers.
- Uses strictly reproducible synthetic data with documented assumptions and safeguards against leakage.

## 2. Session Start & Resumption Protocol
At the beginning of each session:
1. Read `AGENTS.md`.
2. Read `docs/PROJECT_STATE.md`.
3. Check git status (`git status --short`) and commit log.
4. Inspect only relevant modules for the active milestone.
5. Execute tests prior to changes to verify baseline stability.
6. Resume from the specified task in `docs/PROJECT_STATE.md`.
7. At the end of each session, update `docs/PROJECT_STATE.md`.

## 3. Architecture & Module Responsibilities
- `src/infrastructure_risk/config.py`: Central configuration, paths, defaults, and threshold parameters.
- `src/infrastructure_risk/data/generator.py`: Reproducible synthetic data generation with realistic infrastructure indicators.
- `src/infrastructure_risk/data/validation.py`: Pydantic/Pandas schema, range, integrity, and anti-leakage validation.
- `src/infrastructure_risk/data/loader.py`: Ingestion utilities for synthetic and user-uploaded project data.
- `src/infrastructure_risk/features.py`: Feature engineering, preprocessor pipelines, unseen category handling.
- `src/infrastructure_risk/models/training.py`: Model training workflows for Models A, B, and C with cross-validation and baseline comparison.
- `src/infrastructure_risk/models/prediction.py`: Deterministic and calibrated inference service loading serialized Joblib pipelines.
- `src/infrastructure_risk/models/evaluation.py`: Performance evaluation (MAE, RMSE, R2, ROC-AUC, F1, Confusion Matrix, Baselines).
- `src/infrastructure_risk/warnings/rules.py`: Explainable, deterministic threshold and condition rule engine.
- `src/infrastructure_risk/warnings/explanations.py`: Human-readable root-cause explanations and actionable audit recommendations.
- `src/infrastructure_risk/visualization/charts.py`: Reusable Plotly visualizations.
- `app.py` & `pages/`: Streamlit interactive multi-page dashboard.

## 4. Coding Conventions & Standards
- Python >= 3.11 with strict type annotations (`typing`).
- Formatting and linting via Ruff (`ruff check .`).
- All critical business logic, calculations, and rules must be covered by pytest tests in `tests/`.
- No circular dependencies: UI pages import from `src/infrastructure_risk`, not vice versa.
- No training on Streamlit re-renders. Separation of training scripts/pipelines and online inference.

## 5. Machine Learning & Data Integrity Rules
- Zero target leakage: Target features (`actual_final_cost`, `actual_delay_months`, `cost_overrun_pct`, `cost_overrun_flag`) must NEVER be exposed as predictor features.
- Preprocessors fit strictly on training splits.
- Proper handling of unseen categories in one-hot encoders.
- All model artifacts serialized via `joblib` into `artifacts/models/` accompanied by training metadata.

## 6. Git Workflow
- Conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Verify tests and linters before committing.
- Keep large or reproducible data/artifacts untracked via `.gitignore`.
