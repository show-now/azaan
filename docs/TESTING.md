# Testing & Quality Verification Guide

## 1. Automated Test Suite
All tests reside in `tests/` and use `pytest`.

To run the complete test suite:
```bash
source .venv/bin/activate
python -m pytest -v
```

### Covered Test Modules:
1. `tests/test_data_generation.py`:
   - Validates random seed reproducibility.
   - Asserts column presence and dimension conformance.
   - Confirms mathematical consistency of cost overrun formulas.
2. `tests/test_data_validation.py`:
   - Validates schema bounds and checks for missing entries.
   - Enforces the `assert_zero_target_leakage` rule.
   - Rejects non-binary targets or out-of-bounds percentage values.
3. `tests/test_features.py`:
   - Verifies target isolation from predictor feature matrices.
   - Tests `OneHotEncoder` resilience to unseen categorical values without runtime errors.
4. `tests/test_warning_rules.py`:
   - Validates progress slippage detection (`WARN-SCHED-01`).
   - Validates critical land acquisition thresholds (`WARN-LAND-02`).
   - Confirms clean datasets trigger zero spurious alerts.
5. `tests/test_prediction.py`:
   - Verifies inference service loads serialized Joblib models.
   - Confirms single prediction and batch prediction outputs conform to schema.

---

## 2. Code Quality & Linting
Run Ruff linter and formatter:
```bash
ruff check .
```

## 3. Bytecode Compilation Smoke Test
```bash
python -m compileall src pages app.py
```

## 4. Web Application Launch Smoke Check
```bash
streamlit run app.py --server.headless=true
```
