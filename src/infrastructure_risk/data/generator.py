"""Reproducible synthetic dataset generator for infrastructure project monitoring.

Generates realistic project indicators reflecting MoSPI/PAIMANA patterns with
controllable noise, non-linear relationships, and zero leakage in predictors.
"""

import numpy as np
import pandas as pd

from infrastructure_risk.config import (
    DEFAULT_COST_OVERRUN_THRESHOLD_PCT,
    DEFAULT_DATASET_SIZE,
    DEFAULT_RANDOM_SEED,
    FUNDING_RISK_LEVELS,
    SECTORS,
    STATES,
    TARGET_COST_OVERRUN_PCT,
    TARGET_DELAY_MONTHS,
    TARGET_FINAL_COST,
    TARGET_OVERRUN_FLAG,
)


def generate_synthetic_projects(
    n_samples: int = DEFAULT_DATASET_SIZE,
    seed: int = DEFAULT_RANDOM_SEED,
    cost_overrun_threshold: float = DEFAULT_COST_OVERRUN_THRESHOLD_PCT,
    as_completed_dataset: bool = True,
) -> pd.DataFrame:
    """Generate synthetic infrastructure project records.

    Args:
        n_samples: Number of project rows to synthesize.
        seed: Random seed for exact numerical reproducibility.
        cost_overrun_threshold: Threshold percentage for binary overrun flag.
        as_completed_dataset: If True, derives target outcome labels.

    Returns:
        pd.DataFrame containing simulated infrastructure monitoring records.
    """
    rng = np.random.default_rng(seed)

    # 1. Project Identifiers and Metadata
    project_ids = [f"PRJ-IN-{i+1001:05d}" for i in range(n_samples)]
    sectors = rng.choice(SECTORS, size=n_samples)
    states = rng.choice(STATES, size=n_samples)

    # Generate plausible project names based on sector
    sector_prefix_map = {
        "Roads & Highways": "NH-Expwy Corridor",
        "Railways": "High-Speed Rail Link",
        "Petroleum & Natural Gas": "LNG Terminal Pipeline",
        "Power & Renewable Energy": "Ultra-Mega Solar Park",
        "Urban Development & Metro": "Metro Rail Phase",
        "Ports & Shipping": "Deep-Water Port Terminal",
        "Water & Sanitation": "Bulk Water Transmission",
        "Civil Aviation": "Greenfield Airport Exp",
    }
    project_names = [
        f"{sector_prefix_map.get(sec, 'Infra Link')} {state[:3].upper()}-{rng.integers(10, 99)}"
        for sec, state in zip(sectors, states, strict=False)
    ]

    # 2. Baseline Planned Metrics (Log-normal distributions for financial and time scope)
    # Original cost between ₹ 50 Cr and ₹ 15,000 Cr
    original_costs = np.round(rng.lognormal(mean=5.5, sigma=1.1, size=n_samples), 2)
    original_costs = np.clip(original_costs, 50.0, 15000.0)

    # Planned duration between 12 months and 84 months
    planned_duration = rng.integers(12, 85, size=n_samples)

    # 3. Execution Snapshot Indicators
    # Elapsed duration in months (sampled as fraction of planned duration with potential overruns)
    elapsed_fraction = rng.uniform(0.15, 1.30, size=n_samples)
    elapsed_months = np.round(planned_duration * elapsed_fraction, 1)

    # Physical progress percentage (0.0% to 100.0%)
    # Physical progress naturally lags elapsed duration when risks manifest
    expected_progress = np.clip((elapsed_months / planned_duration) * 100.0, 5.0, 100.0)
    slippage_factor = rng.uniform(0.60, 1.05, size=n_samples)
    physical_progress = np.round(np.clip(expected_progress * slippage_factor, 2.0, 100.0), 1)

    # Land acquisition percentage: critical bottleneck in linear projects (Roads/Railways)
    sector_land_difficulty = np.array([
        0.75 if sec in ["Roads & Highways", "Railways", "Urban Development & Metro"] else 0.90
        for sec in sectors
    ])
    land_acquisition_pct = np.round(
        np.clip(
            rng.beta(a=3.0, b=1.5, size=n_samples) * 100.0 * sector_land_difficulty,
            5.0,
            100.0,
        ),
        1,
    )

    # Regulatory and approval delays in months (positive skew)
    approval_delay_months = np.round(rng.exponential(scale=3.5, size=n_samples), 1)
    approval_delay_months = np.clip(approval_delay_months, 0.0, 24.0)

    # Funding risk levels (correlated with approval delays and project size)
    funding_risk_probs = [0.55, 0.30, 0.15]
    funding_risk = rng.choice(FUNDING_RISK_LEVELS, size=n_samples, p=funding_risk_probs)

    # Contractor changes (0, 1, 2, 3+)
    contractor_changes = rng.choice([0, 1, 2, 3], size=n_samples, p=[0.70, 0.20, 0.07, 0.03])

    # Material inflation (commodity price pressure, concrete, steel escalations)
    material_inflation_pct = np.round(rng.normal(loc=7.5, scale=4.0, size=n_samples), 1)
    material_inflation_pct = np.clip(material_inflation_pct, -2.0, 30.0)

    # Construct primary DataFrame
    df = pd.DataFrame(
        {
            "project_id": project_ids,
            "project_name": project_names,
            "sector": sectors,
            "state": states,
            "original_cost": original_costs,
            "planned_duration_months": planned_duration,
            "elapsed_months": elapsed_months,
            "physical_progress_pct": physical_progress,
            "land_acquisition_pct": land_acquisition_pct,
            "approval_delay_months": approval_delay_months,
            "funding_risk": funding_risk,
            "contractor_changes": contractor_changes,
            "material_inflation_pct": material_inflation_pct,
        }
    )

    # 4. Generate Realistic Target Outcome Labels
    if as_completed_dataset:
        # Cost Overrun Generator Formula (Multi-factor non-linear relationship)
        # Factors:
        # - Land delay impact: (100 - land_acquisition_pct) / 100
        # - Regulatory delay impact: approval_delay_months
        # - Contractor changes penalty: contractor_changes * 8%
        # - Inflation direct pass-through: material_inflation_pct * 0.8
        # - Funding risk impact: High (+10%), Medium (+4%)
        # - Progress gap penalty: (expected - actual progress)
        funding_penalty = np.where(df["funding_risk"] == "High", 12.0, np.where(df["funding_risk"] == "Medium", 4.5, 0.0))
        progress_lag = np.clip(expected_progress - physical_progress, 0.0, 50.0)

        cost_overrun_pct = (
            (100.0 - df["land_acquisition_pct"]) * 0.18
            + df["approval_delay_months"] * 1.4
            + df["contractor_changes"] * 7.5
            + df["material_inflation_pct"] * 0.75
            + funding_penalty
            + progress_lag * 0.45
            + rng.normal(loc=0.0, scale=4.0, size=n_samples)  # Unobserved real-world variance
        )
        # Cap overrun percentage to realistic bounds [-5% (rare savings) to 150%]
        cost_overrun_pct = np.round(np.clip(cost_overrun_pct, -5.0, 150.0), 2)

        # Actual final cost computed strictly from cost_overrun_pct
        actual_final_cost = np.round(df["original_cost"] * (1.0 + cost_overrun_pct / 100.0), 2)

        # Delay duration in months:
        # Driven by approval delays, land acquisition bottleneck, contractor turnovers
        schedule_delay_months = (
            df["approval_delay_months"] * 1.2
            + (100.0 - df["land_acquisition_pct"]) * 0.15
            + df["contractor_changes"] * 5.0
            + (progress_lag * 0.3)
            + rng.normal(loc=0.0, scale=3.0, size=n_samples)
        )
        schedule_delay_months = np.round(np.clip(schedule_delay_months, 0.0, 72.0), 1)

        # Binary threshold flag
        cost_overrun_flag = (cost_overrun_pct >= cost_overrun_threshold).astype(int)

        # Assign outcome targets to DataFrame
        df[TARGET_FINAL_COST] = actual_final_cost
        df[TARGET_DELAY_MONTHS] = schedule_delay_months
        df[TARGET_COST_OVERRUN_PCT] = cost_overrun_pct
        df[TARGET_OVERRUN_FLAG] = cost_overrun_flag

    return df
