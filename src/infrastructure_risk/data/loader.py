"""Data ingestion and persistence utilities for projects."""

from pathlib import Path
from typing import Optional

import pandas as pd

from infrastructure_risk.config import GENERATED_DATA_DIR
from infrastructure_risk.data.generator import generate_synthetic_projects
from infrastructure_risk.data.validation import validate_dataframe

DEFAULT_DATA_FILE: Path = GENERATED_DATA_DIR / "infrastructure_projects.csv"


def load_or_generate_dataset(
    filepath: Optional[Path] = None,
    force_regenerate: bool = False,
    n_samples: int = 1200,
    seed: int = 42,
) -> pd.DataFrame:
    """Load projects from disk or generate a reproducible dataset if absent.

    Args:
        filepath: Optional path to CSV file. Defaults to data/generated/infrastructure_projects.csv.
        force_regenerate: If True, regenerates and saves even if file exists.
        n_samples: Sample count if regeneration is required.
        seed: Random seed for synthetic dataset.

    Returns:
        pd.DataFrame: Validated projects DataFrame.
    """
    target_path = filepath or DEFAULT_DATA_FILE
    target_path.parent.mkdir(parents=True, exist_ok=True)

    if target_path.exists() and not force_regenerate:
        df = pd.read_csv(target_path)
        is_valid, issues = validate_dataframe(df, require_targets=True)
        if is_valid:
            return df
        # If existing file is invalid or corrupt, regenerate clean dataset
        print(f"Warning: Existing file {target_path} failed validation ({issues}). Regenerating.")

    df = generate_synthetic_projects(n_samples=n_samples, seed=seed)
    df.to_csv(target_path, index=False)
    return df
