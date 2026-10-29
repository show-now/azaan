# Model Card: Infrastructure Risk Predictive Models

## 1. Model Details
- **Architecture**: Scikit-Learn `RandomForestRegressor` and `RandomForestClassifier` encapsulated in reproducible `ColumnTransformer` pipelines with `OneHotEncoder(handle_unknown='ignore')` and `StandardScaler`.
- **Version**: 0.1.0
- **Serialization**: Joblib pipelines stored in `artifacts/models/`.
- **Trained on**: 2026-10-29.

## 2. Models Specification

### Model A: Cost Overrun Regressor (`model_a_cost_regressor.joblib`)
- **Task**: Predict continuous expected cost overrun percentage (`cost_overrun_pct`).
- **Algorithm**: `RandomForestRegressor(n_estimators=100, max_depth=12, min_samples_split=4, random_state=42)`
- **Observed Metrics (Held-out Test Split, n=240)**:
  - MAE: **5.23%** (37.5% improvement over mean dummy baseline of 8.37%)
  - RMSE: **6.64%**
  - R² Score: **0.615**

### Model B: Schedule Delay Regressor (`model_b_delay_regressor.joblib`)
- **Task**: Predict delay duration in months (`actual_delay_months`).
- **Algorithm**: `RandomForestRegressor(n_estimators=100, max_depth=12, min_samples_split=4, random_state=42)`
- **Observed Metrics (Held-out Test Split, n=240)**:
  - MAE: **3.53 Months** (41.1% improvement over mean dummy baseline of 5.99 months)
  - RMSE: **4.31 Months**
  - R² Score: **0.661**

### Model C: Cost Overrun Classifier (`model_c_overrun_classifier.joblib`)
- **Task**: Estimate probability of severe cost overrun exceeding 20% (`cost_overrun_flag`).
- **Algorithm**: `RandomForestClassifier(n_estimators=100, max_depth=10, class_weight='balanced', random_state=42)`
- **Observed Metrics (Held-out Test Split, n=240)**:
  - Accuracy: **89.2%** (+7.5% above majority class baseline)
  - Precision: **94.3%**
  - Recall: **92.4%**
  - F1-Score: **0.933**
  - ROC-AUC: **0.932**

## 3. Intended Use & Boundaries
- **Academic Research**: Designed to demonstrate predictive modeling of infrastructure risk factors.
- **Prohibited / Unsupported Use**: Must not be used for binding statutory procurement, budgetary allocations, or contractor disqualification without independent forensic review.
- **Data Source**: Synthetic data strictly generated via controlled stochastic parameters.
