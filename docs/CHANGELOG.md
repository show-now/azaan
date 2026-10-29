# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-29

### Added
- **Core Architecture & Configuration**:
  - Centralized settings in `src/infrastructure_risk/config.py`.
  - Pydantic schema validation and anti-leakage guards in `data/validation.py`.
  - Reproducible synthetic infrastructure dataset generator in `data/generator.py`.
- **Machine Learning Pipelines**:
  - Model A (Cost Overrun Regressor): MAE 5.23%, R² 0.615.
  - Model B (Schedule Delay Regressor): MAE 3.53 months, R² 0.661.
  - Model C (Cost Overrun Binary Classifier): Accuracy 89.2%, ROC-AUC 0.932.
  - Model training workflow with baseline evaluation in `models/training.py`.
  - Unified inference service `RiskPredictionService` in `models/prediction.py`.
- **Early Warning Diagnostic Engine**:
  - Deterministic multi-factor rule engine covering progress slippage, RoW land acquisition bottlenecks, statutory approval delays, contractor turnover, and material price escalation in `warnings/rules.py`.
  - Root cause executive explanation generator in `warnings/explanations.py`.
- **Interactive Multi-Page Streamlit Web App**:
  - `app.py`: Main portal entry and service status check.
  - `pages/1_Project_Overview.py`: Portfolio macros, sector distributions, and scatter trends.
  - `pages/2_Project_Explorer.py`: Multi-criteria search, filters, and CSV data export.
  - `pages/3_Risk_Prediction.py`: Interactive single-project risk calculator and warning audit.
  - `pages/4_Early_Warnings.py`: Full portfolio early warning feed and action tracker.
  - `pages/5_Model_Evaluation.py`: Held-out test performance charts and confusion matrices.
- **Verification & Testing**:
  - Pytest suite covering reproducibility, schema bounds, target leakage prevention, unseen categories, prediction service, and warning triggers (13 unit tests).
  - Ruff code linting configuration and verification.
- **Comprehensive Documentation Suite**:
  - `AGENTS.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `DATA_DICTIONARY.md`, `MODEL_CARD.md`, `TESTING.md`, `USER_GUIDE.md`, `DEVELOPER_GUIDE.md`, `DEPLOYMENT.md`, `TROUBLESHOOTING.md`, and `README.md`.
