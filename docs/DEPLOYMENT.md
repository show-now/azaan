# Deployment Guide

## 1. Overview
The **AI-Powered Infrastructure Risk Early Warning System** is packaged as a self-contained Streamlit application. It does not require external database servers or microservice orchestrators for standard academic and local demonstration deployments.

---

## 2. Deployment Architecture
- **Web Layer**: Streamlit web server running over HTTP (default port `8501`).
- **Application Engine**: Python 3.11+ running synchronous ML inference via Scikit-Learn pipelines.
- **Persistence**: File-based Joblib model binaries and local CSV data stores.

---

## 3. Local & Server Execution

### Step 1: Clone and Provision Environment
```bash
git clone <repository-url>
cd azaan
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -e .
```

### Step 2: Initialize Artifacts
If model artifacts (`artifacts/models/*.joblib`) have not yet been generated:
```bash
python -m infrastructure_risk.models.training
```

### Step 3: Run the Streamlit Application
```bash
streamlit run app.py --server.port=8501 --server.address=0.0.0.0
```

---

## 4. Production / Containerized Deployment Considerations
- **Process Management**: Use `systemd` or `supervisord` to manage the Streamlit process.
- **Reverse Proxy**: Place behind an Nginx reverse proxy to terminate SSL/TLS and forward WebSockets (`_stcore/stream`).
- **Memory Requirements**: Minimum 1 GB RAM (2 GB recommended).
- **CPU**: 1-2 vCPUs sufficient for concurrent interactive inference sessions.
