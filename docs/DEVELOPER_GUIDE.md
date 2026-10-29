# Developer Guide

## 1. Local Development Setup

### Prerequisites
- Python 3.11, 3.12, 3.13, or 3.14.
- `uv` (recommended) or standard `pip` / `venv`.
- Git.

### Environment Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd azaan

# 2. Create virtual environment
uv venv --python 3.13 .venv
source .venv/bin/activate

# 3. Install dependencies in editable mode
uv pip install -e . -r requirements.txt
```

---

## 2. Directory Structure & Module Ownership
- `src/infrastructure_risk/config.py`: Single source of truth for features, parameters, and paths.
- `src/infrastructure_risk/data/generator.py`: Generates synthetic data with documented stochastic distributions.
- `src/infrastructure_risk/data/validation.py`: Pydantic & pandas schema validation; asserts zero target leakage.
- `src/infrastructure_risk/features.py`: Transformers for numeric scaling and categorical encoding.
- `src/infrastructure_risk/models/`: Training pipelines (`training.py`), inference engine (`prediction.py`), and metrics (`evaluation.py`).
- `src/infrastructure_risk/warnings/`: Deterministic warning rules (`rules.py`) and executive root cause explanations (`explanations.py`).
- `src/infrastructure_risk/visualization/`: Reusable Plotly chart generators.
- `app.py` & `pages/`: Multi-page Streamlit web user interface.

---

## 3. Retraining Models
To regenerate synthetic training data and fit fresh models:
```bash
python -m infrastructure_risk.models.training
```
This updates:
- `artifacts/models/model_a_cost_regressor.joblib`
- `artifacts/models/model_b_delay_regressor.joblib`
- `artifacts/models/model_c_overrun_classifier.joblib`
- `artifacts/metrics/training_metrics.json`

---

## 4. Quality & Testing Commands
```bash
# Execute unit tests
python -m pytest -v

# Run linter
ruff check .

# Compile check
python -m compileall src pages app.py
```
