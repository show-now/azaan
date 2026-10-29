# System Architecture

## 1. High-Level Overview

The AI-Powered Infrastructure Risk Early Warning System is a modular Python and Streamlit-based predictive analytics platform designed for academic demonstration. The system models, predicts, and flags early warnings for infrastructure cost escalations and schedule slippage based on project health indicators (inspired by MoSPI/PAIMANA reporting metrics).

```mermaid
flowchart TD
    subgraph Data Layer
        DG[Synthetic Generator] -->|Raw Records| DV[Data Validation & Schema Engine]
        CSV[User Upload / Sample CSV] -->|Raw Records| DV
        DV -->|Validated DataFrame| FE[Feature Preprocessor]
    end

    subgraph Analytics & Modeling Layer
        FE -->|Features X| MA[Model A: Cost Overrun Regressor]
        FE -->|Features X| MB[Model B: Schedule Delay Regressor]
        FE -->|Features X| MC[Model C: Cost Overrun Classifier]
        DV -->|Project Indicators| WE[Rule-Based Early Warning Engine]
    end

    subgraph Presentation Layer (Streamlit)
        PO[1: Project Overview]
        PE[2: Project Explorer]
        RP[3: Risk Prediction]
        EW[4: Early Warnings]
        ME[5: Model Evaluation]
    end

    MA --> RP
    MB --> RP
    MC --> RP
    WE --> EW
    WE --> PO
    DV --> PO
    DV --> PE
    MA --> ME
    MB --> ME
    MC --> ME
```

## 2. Core Modules & Responsibilities

| Module | Location | Purpose |
| :--- | :--- | :--- |
| `config.py` | `src/infrastructure_risk/` | Central parameter defaults, paths, thresholds, and environment settings. |
| `data/generator.py` | `src/infrastructure_risk/data/` | Controlled synthetic infrastructure dataset generator using fixed seeds. |
| `data/validation.py` | `src/infrastructure_risk/data/` | Schema validation, type checks, missing values, range bounds, and anti-leakage checks. |
| `data/loader.py` | `src/infrastructure_risk/data/` | Persistence, local CSV reading, caching, and sample data provisioning. |
| `features.py` | `src/infrastructure_risk/` | Pipelines for numeric scaling, categorical encoding (`OneHotEncoder(handle_unknown='ignore')`), and train/test splits. |
| `models/training.py` | `src/infrastructure_risk/models/` | Model training workflows for Models A, B, and C with cross-validation and baseline comparison. |
| `models/prediction.py` | `src/infrastructure_risk/models/` | Inference service loading serialized models from `artifacts/models/`. |
| `models/evaluation.py` | `src/infrastructure_risk/models/` | Computation of MAE, RMSE, R², Accuracy, Precision, Recall, F1, ROC-AUC, and Confusion Matrix. |
| `warnings/rules.py` | `src/infrastructure_risk/warnings/` | Transparent, deterministic rule checks against critical infrastructure indicators. |
| `warnings/explanations.py`| `src/infrastructure_risk/warnings/` | Root-cause contextualization and audit guidance. |
| `visualization/charts.py`| `src/infrastructure_risk/visualization/` | Plotly figures for distribution, actual vs predicted, confusion matrix, and feature importances. |

## 3. Data Flow & Target Leakage Prevention

1. **Prediction Features (Available during project execution):**
   - Project metadata: `sector`, `state`
   - Plan benchmarks: `original_cost` (₹ Cr), `planned_duration_months`
   - Progress indicators: `elapsed_months`, `physical_progress_pct`, `land_acquisition_pct`
   - Operational risk variables: `approval_delay_months`, `funding_risk` (Low/Medium/High), `contractor_changes`, `material_inflation_pct`

2. **Outcome Labels (Known only post-completion / target labels):**
   - `actual_final_cost` (₹ Cr)
   - `actual_delay_months` (Months)
   - `cost_overrun_pct`: `((actual_final_cost - original_cost) / original_cost) * 100`
   - `cost_overrun_flag`: `1 if cost_overrun_pct >= threshold else 0`

**Anti-Leakage Safeguard:**
The feature transformation pipeline strictly rejects any target columns (`actual_final_cost`, `actual_delay_months`, `cost_overrun_pct`, `cost_overrun_flag`) from the input matrix $X$ before model fitting or inference.
