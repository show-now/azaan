# Data Dictionary: Infrastructure Risk Early Warning System

## 1. Overview
This dataset defines key operational, financial, and scheduling indicators for monitoring major public infrastructure investments. The design draws conceptual inspiration from infrastructure appraisal parameters tracked by MoSPI and PAIMANA.

---

## 2. Identifier & Metadata Attributes

| Attribute | Data Type | Units / Range | Missing Policy | Description |
| :--- | :--- | :--- | :--- | :--- |
| `project_id` | String | `PRJ-IN-[0-9]{5}` | Non-null, unique | Unique system identifier for the infrastructure scheme. |
| `project_name` | String | Categorical string | Non-null | Descriptive title (e.g. NH-Expwy Corridor MAH-42). |
| `sector` | String | 8 MoSPI Sectors | Non-null | Domain sector (e.g., Roads & Highways, Railways, Power). |
| `state` | String | 15 States / UTs | Non-null | Primary state or Union Territory jurisdiction. |

---

## 3. Predictor Features (Observed During Ongoing Project Execution)

| Attribute | Data Type | Units / Range | Description | Target Leakage Status |
| :--- | :--- | :--- | :--- | :--- |
| `original_cost` | Float | ₹ Crores (> 0) | Sanctioned baseline budget approved at financial close. | **Predictor** (Safe) |
| `planned_duration_months` | Integer | 12 to 84 months | Original scheduled timeframe to commissioning. | **Predictor** (Safe) |
| `elapsed_months` | Float | >= 0.0 months | Calendar months elapsed from formal commencement date. | **Predictor** (Safe) |
| `physical_progress_pct` | Float | 0.0% to 100.0% | Certified cumulative physical milestone completion percentage. | **Predictor** (Safe) |
| `land_acquisition_pct` | Float | 0.0% to 100.0% | Right-of-Way (RoW) acquisition and encumbrance-free handover %. | **Predictor** (Safe) |
| `approval_delay_months` | Float | 0.0 to 24.0 months | Statutory clearance slippage (forest, environmental, utility shifting). | **Predictor** (Safe) |
| `funding_risk` | Categorical | Low, Medium, High | Budgetary allocation status, co-financing liquidity rating. | **Predictor** (Safe) |
| `contractor_changes` | Integer | 0, 1, 2, 3+ | Number of contractor re-tenders, defaults, or contract transfers. | **Predictor** (Safe) |
| `material_inflation_pct` | Float | -5.0% to +35.0% | Annualized commodity inflation impact (cement, steel, fuel). | **Predictor** (Safe) |

---

## 4. Outcome Labels (Post-Completion / Ground Truth Targets)

> [!WARNING]
> The following attributes must NEVER be passed as features into predictive models during training or inference.

| Attribute | Data Type | Target For | Description / Formula |
| :--- | :--- | :--- | :--- |
| `actual_final_cost` | Float | Reference | Completed project outturn expenditure in ₹ Crores. |
| `actual_delay_months` | Float | Model B Target | Total project completion delay in months beyond initial schedule. |
| `cost_overrun_pct` | Float | Model A Target | Formula: `((actual_final_cost - original_cost) / original_cost) * 100` |
| `cost_overrun_flag` | Binary (0/1) | Model C Target | `1` if `cost_overrun_pct >= 20.0%`, else `0`. |
