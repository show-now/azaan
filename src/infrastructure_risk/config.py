"""Central configuration, constants, and paths for the infrastructure risk system."""

from pathlib import Path
from typing import Final, List

# Base Paths
BASE_DIR: Final[Path] = Path(__file__).resolve().parent.parent.parent
DATA_DIR: Final[Path] = BASE_DIR / "data"
GENERATED_DATA_DIR: Final[Path] = DATA_DIR / "generated"
ARTIFACTS_DIR: Final[Path] = BASE_DIR / "artifacts"
MODELS_DIR: Final[Path] = ARTIFACTS_DIR / "models"
METRICS_DIR: Final[Path] = ARTIFACTS_DIR / "metrics"
DOCS_DIR: Final[Path] = BASE_DIR / "docs"

# Default Seed & Data Parameters
DEFAULT_RANDOM_SEED: Final[int] = 42
DEFAULT_DATASET_SIZE: Final[int] = 1200
DEFAULT_TEST_SIZE: Final[float] = 0.20
DEFAULT_COST_OVERRUN_THRESHOLD_PCT: Final[float] = 20.0  # Definition of high cost overrun flag

# Supported Infrastructure Sectors (MoSPI categories)
SECTORS: Final[List[str]] = [
    "Roads & Highways",
    "Railways",
    "Petroleum & Natural Gas",
    "Power & Renewable Energy",
    "Urban Development & Metro",
    "Ports & Shipping",
    "Water & Sanitation",
    "Civil Aviation",
]

# Major Indian States/UTs for spatial indicator representation
STATES: Final[List[str]] = [
    "Maharashtra",
    "Uttar Pradesh",
    "Gujarat",
    "Tamil Nadu",
    "Karnataka",
    "Rajasthan",
    "West Bengal",
    "Madhya Pradesh",
    "Andhra Pradesh",
    "Bihar",
    "Odisha",
    "Assam",
    "Kerala",
    "Delhi NCR",
    "Jammu & Kashmir",
]

# Funding Risk Categories
FUNDING_RISK_LEVELS: Final[List[str]] = ["Low", "Medium", "High"]

# Column Definitions
ID_COLUMN: Final[str] = "project_id"
NAME_COLUMN: Final[str] = "project_name"

NUMERIC_FEATURES: Final[List[str]] = [
    "original_cost",               # Crores (INR)
    "planned_duration_months",     # Months
    "elapsed_months",              # Months since kick-off
    "physical_progress_pct",       # 0.0 to 100.0%
    "land_acquisition_pct",        # 0.0 to 100.0%
    "approval_delay_months",       # Regulatory/Clearance delays in months
    "contractor_changes",          # Count of contractor changes
    "material_inflation_pct",      # Annualized material escalation %
]

CATEGORICAL_FEATURES: Final[List[str]] = [
    "sector",
    "state",
    "funding_risk",
]

# Predictor Features (Available strictly during project monitoring)
PREDICTOR_FEATURES: Final[List[str]] = NUMERIC_FEATURES + CATEGORICAL_FEATURES

# Outcome Labels (Target fields known only post-completion / target definition)
TARGET_COST_OVERRUN_PCT: Final[str] = "cost_overrun_pct"
TARGET_DELAY_MONTHS: Final[str] = "actual_delay_months"
TARGET_OVERRUN_FLAG: Final[str] = "cost_overrun_flag"
TARGET_FINAL_COST: Final[str] = "actual_final_cost"

TARGET_COLUMNS: Final[List[str]] = [
    TARGET_FINAL_COST,
    TARGET_DELAY_MONTHS,
    TARGET_COST_OVERRUN_PCT,
    TARGET_OVERRUN_FLAG,
]

# Early Warning Threshold Defaults
EARLY_WARNING_THRESHOLDS: Final[dict] = {
    "progress_slippage_gap_pct": 15.0,  # Expected progress vs actual progress gap
    "land_acquisition_critical_pct": 60.0,  # Below this when elapsed ratio >= 0.50 triggers critical
    "approval_delay_critical_months": 6.0,  # Regulatory delay > 6 months
    "high_contractor_changes": 2,          # >= 2 contractor turnovers
    "elevated_material_inflation_pct": 12.0,  # Material inflation >= 12%
}
