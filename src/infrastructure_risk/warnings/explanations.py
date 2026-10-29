"""Human-readable root cause explanations and actionable recommendations."""

from typing import Dict, List

from infrastructure_risk.warnings.rules import WarningAlert


def generate_executive_risk_summary(alerts: List[WarningAlert]) -> Dict[str, any]:
    """Compile executive summary of project risks from detected alerts.

    Args:
        alerts: List of WarningAlert objects for a project.

    Returns:
        Dictionary containing counts, severity breakdown, and prioritized recommendations.
    """
    if not alerts:
        return {
            "status": "Green / Low Operational Risk",
            "total_alerts": 0,
            "high_severity_count": 0,
            "medium_severity_count": 0,
            "summary_text": "No critical early warning thresholds breached. Project indicators align with planned baseline.",
            "recommendations": ["Maintain standard bi-weekly milestone and cash flow monitoring."],
        }

    high_count = sum(1 for a in alerts if a.severity == "High")
    med_count = sum(1 for a in alerts if a.severity == "Medium")

    overall_status = (
        "Red / Critical Intervention Required"
        if high_count > 0
        else "Amber / Elevated Watch"
    )

    # Compile prioritized recommendations
    recommendations = [f"[{a.severity}] {a.condition}: {a.suggested_action}" for a in alerts]

    summary_text = (
        f"Detected {len(alerts)} warning flag(s) ({high_count} High Severity, {med_count} Medium Severity). "
        "Immediate administrative review is recommended to forestall compounding schedule slippage and cost escalation."
    )

    return {
        "status": overall_status,
        "total_alerts": len(alerts),
        "high_severity_count": high_count,
        "medium_severity_count": med_count,
        "summary_text": summary_text,
        "recommendations": recommendations,
    }
