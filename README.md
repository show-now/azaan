# AI-Powered Predictive Analytics and Early Warning System for Infrastructure Project Cost and Time Overruns

[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/downloads/)
[![Code style: ruff](https://img.shields.io/badge/code%20style-ruff-000000.svg)](https://github.com/astral-sh/ruff)
[![Testing: pytest](https://img.shields.io/badge/testing-pytest-yellow.svg)](https://docs.pytest.org/)

An academic research prototype providing predictive analytics and rule-based early warnings for cost escalations and schedule delays across major infrastructure schemes.

> [!IMPORTANT]
> **Academic Boundary Disclaimer:**
> This repository is an independent academic research and demonstration prototype inspired by the infrastructure monitoring framework of the Ministry of Statistics and Programme Implementation (MoSPI) and the PAIMANA monitoring portal in India. It is **not** an official MoSPI product and does **not** interface with live government databases or PAIMANA production servers. All demonstration data is synthetically generated with reproducible seeds and documented parameters.

---

## 🌟 Key Features

1. **Portfolio Macro Analytics**:
   - Executive KPIs tracking total sanctioned outlay, aggregate cost exposure, and warning prevalence.
   - Interactive Plotly visualizations for sector-wise financial exposure and spatial distributions.
2. **Tri-Model Predictive Intelligence**:
   - **Model A (Cost Overrun Regressor)**: Forecasts expected cost escalation percentage (MAE: 5.23%, R²: 0.615).
   - **Model B (Schedule Slippage Regressor)**: Estimates delay duration in months (MAE: 3.53 Months, R²: 0.661).
   - **Model C (Overrun Threshold Classifier)**: Assesses probability of severe (>20%) budget overrun (Accuracy: 89.2%, ROC-AUC: 0.932).
3. **Transparent Early Warning Diagnostic Engine**:
   - Deterministic, auditable condition checks detecting physical milestone lags, right-of-way land deficits, statutory clearance delays, contractor turnover, and material price shocks.
   - Generates contextual root cause explanations and actionable administrative audit recommendations.
4. **Interactive Multi-Page Streamlit Dashboard**:
   - Project Explorer with multi-attribute filtering and CSV export.
   - Single-project real-time risk calculator with interactive input validation.
   - Portfolio-wide Early Warning audit feed.
   - Model evaluation dashboard featuring Actual vs. Predicted scatter plots and Confusion Matrix heatmaps.

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    subgraph Ingestion & Safeguards
        GEN[Synthetic Generator] --> VAL[Schema & Anti-Leakage Validation]
        USR[User Ingestion / CSV] --> VAL
        VAL --> FE[Feature Preprocessor]
    end

    subgraph Analytics Engines
        FE --> MA[Model A: Cost Overrun]
        FE --> MB[Model B: Schedule Delay]
        FE --> MC[Model C: Overrun Probability]
        VAL --> WE[Rule-Based Early Warning Engine]
    end

    subgraph Interactive UI (Streamlit)
        MA --> UI[Streamlit Multi-Page Portal]
        MB --> UI
        MC --> UI
        WE --> UI
    end
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python >= 3.11 (tested on Python 3.13 / 3.14)
- Git

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd azaan

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies in editable mode
pip install -e . -r requirements.txt
```

### 3. Generate Data and Train Models
Train Models A, B, and C and save artifacts to `artifacts/models/`:
```bash
python -m infrastructure_risk.models.training
```

### 4. Launch the Web Application
Launch the Streamlit dashboard:
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## 🧪 Verification & Testing

Execute the automated test suite:
```bash
python -m pytest -v
```

Execute code formatting and linting:
```bash
ruff check .
```

Verify compilation across all modules:
```bash
python -m compileall src pages app.py
```

---

## 📁 Repository Structure

```
├── AGENTS.md                   # Operational memory and session resumption protocol
├── README.md                   # System documentation and setup guide
├── pyproject.toml              # Build metadata and tool configurations
├── requirements.txt            # Pinned dependency specifications
├── .env.example                # Template environment settings
├── app.py                      # Streamlit application portal
├── pages/                      # Multi-page dashboard
│   ├── 1_Project_Overview.py
│   ├── 2_Project_Explorer.py
│   ├── 3_Risk_Prediction.py
│   ├── 4_Early_Warnings.py
│   └── 5_Model_Evaluation.py
├── src/infrastructure_risk/    # Core package
│   ├── config.py               # Constants, feature definitions, and paths
│   ├── data/                   # Generation, validation, and loading
│   ├── features.py             # Feature engineering and transformers
│   ├── models/                 # Model training, inference, and evaluation
│   ├── warnings/               # Early warning rules and explanations
│   └── visualization/          # Plotly visualization components
├── tests/                      # Pytest unit and integration test suite
└── docs/                       # Technical documentation specifications
    ├── PROJECT_STATE.md
    ├── ARCHITECTURE.md
    ├── DECISIONS.md
    ├── DATA_DICTIONARY.md
    ├── MODEL_CARD.md
    ├── TESTING.md
    ├── USER_GUIDE.md
    ├── DEVELOPER_GUIDE.md
    ├── DEPLOYMENT.md
    ├── TROUBLESHOOTING.md
    └── CHANGELOG.md
```

---

## 📜 Documentation Index
- [Architecture Details](docs/ARCHITECTURE.md)
- [Technical Decisions (ADRs)](docs/DECISIONS.md)
- [Data Dictionary](docs/DATA_DICTIONARY.md)
- [Model Card & Evaluation Metrics](docs/MODEL_CARD.md)
- [User Guide](docs/USER_GUIDE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Testing Guide](docs/TESTING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Project State & Memory](docs/PROJECT_STATE.md)
