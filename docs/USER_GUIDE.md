# User Guide: Infrastructure Risk Early Warning System

## 1. Introduction
The **AI-Powered Infrastructure Risk Early Warning System** provides project directors, monitoring committees, and academic researchers with actionable insights into cost and time slippage risks on infrastructure investments.

---

## 2. Navigating the Dashboard

### 📊 Page 1: Project Overview
- Displays the **macro portfolio metrics**: total projects monitored, total baseline sanctioned expenditure, and aggregate projected cost escalation.
- Explore **Sector Expenditure Breakdowns** to identify which infrastructure sectors account for the greatest exposure.
- Review **Physical Progress vs Schedule Slippage** scatter plot to identify delayed projects.

### 🔍 Page 2: Project Explorer
- Filter the full database by **Sector**, **State**, **Funding Risk Level**, and **Progress Percentage**.
- Use the free-text search bar to search for specific project IDs (e.g. `PRJ-IN-01042`) or corridor titles.
- Click **Download Filtered Projects (CSV)** to export data for offline spreadsheets.

### 🔮 Page 3: Risk Prediction Calculator
1. Select project parameters:
   - Sector, State, Sanctioned Baseline Cost (₹ Cr), Planned Duration (months).
   - Real-time execution indicators: Elapsed Months, Physical Progress %, Land Acquired %, Statutory Clearance Delay, Funding Risk, and Material Inflation.
2. Click **Run Risk Assessment & Early Warning Analysis**.
3. View the multi-model prediction output:
   - **Predicted Cost Overrun %** (Model A)
   - **Estimated Final Outturn Cost** (₹ Cr)
   - **Predicted Schedule Delay** (Months) (Model B)
   - **Overrun Breach Probability & Risk Level** (Model C)
4. Inspect the **Triggered Early Warning Rules** and prioritized corrective interventions.

### ⚠️ Page 4: Early Warnings Audit Feed
- View an auditable feed of all threshold violations across the portfolio.
- Filter by **Severity** (High vs Medium) or specific trigger conditions (e.g., Land Acquisition Deficits, Contractor Disputes).
- Export the audit log directly to CSV.

### 📈 Page 5: Model Evaluation & Benchmarks
- Inspect quantitative metrics on held-out test data (MAE, RMSE, R², Precision, Recall, ROC-AUC).
- Compare model accuracy against dummy baselines (Mean baseline for regression, Majority-class baseline for classification).
- Inspect **Actual vs Predicted scatter charts** and **Confusion Matrix heatmaps**.
