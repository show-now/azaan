# Troubleshooting Guide

## 1. Common Installation & Environment Issues

### Issue: `error in 'egg_base' option: 'src' does not exist`
- **Cause**: Editable installation (`pip install -e .`) attempted before the `src` directory exists.
- **Solution**: Ensure directory structure exists, or run `mkdir -p src` before running `pip install -e .`.

### Issue: Python Version Incompatibility
- **Cause**: Using Python < 3.11.
- **Solution**: Install Python >= 3.11 (Python 3.11, 3.12, 3.13, or 3.14 are supported).

---

## 2. Model & Prediction Errors

### Issue: `FileNotFoundError: Model artifacts not found in artifacts/models`
- **Cause**: The application was launched before running model training.
- **Solution**: Execute the model training pipeline:
  ```bash
  python -m infrastructure_risk.models.training
  ```

### Issue: Target Leakage Exception (`ValueError: TARGET LEAKAGE DETECTED`)
- **Cause**: A dataset or input dictionary containing completion targets (e.g. `actual_final_cost` or `actual_delay_months`) was provided to the feature extractor or prediction service.
- **Solution**: Ensure prediction input contains only predictor features defined in `PREDICTOR_FEATURES`.

---

## 3. Streamlit Runtime Issues

### Issue: Port 8501 is already in use
- **Solution**: Specify an alternative port:
  ```bash
  streamlit run app.py --server.port 8502
  ```

### Issue: Browser disconnects or WebSocket errors
- **Solution**: Ensure your network or proxy supports HTTP WebSockets upgrade headers (`Upgrade: websocket`, `Connection: Upgrade`).
