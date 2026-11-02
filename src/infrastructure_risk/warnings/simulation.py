"""Disaster resilience simulation, damage estimation, and proactive engineering precautions engine.

Models the impact of various natural hazards on infrastructure projects based on:
- Disaster Type (Flood, Earthquake, Cyclone, Landslide, Extreme Heatwave)
- Disaster Severity / Intensity (Minor, Moderate, Severe, Catastrophic)
- Project Sector vulnerability profile (e.g. Ports vulnerable to Cyclones, Roads to Landslides/Floods)
- State vulnerability geography (coastal cyclone belts, Himalayan seismic/landslide zones, flood plains)
- Construction stage (elapsed time vs planned duration, current physical progress %)
- Estimates physical damage % and financial damage (₹ Crores)
- Forecasts schedule slippage delay added (Months)
- Provides tailored, actionable engineering & construction precautions
"""

from typing import Dict, List

from pydantic import BaseModel, Field

DISASTER_TYPES: List[str] = [
    "Flood / Cloudburst",
    "Earthquake / Seismic Tremor",
    "Cyclone / Storm Surge",
    "Landslide / Debris Flow",
    "Extreme Heatwave & Drought",
]

DISASTER_SEVERITIES: List[str] = [
    "Minor (Level 1)",
    "Moderate (Level 2)",
    "Severe (Level 3)",
    "Catastrophic (Level 4)",
]

# Vulnerability weights by Sector for each disaster type [0.2 to 1.0]
SECTOR_VULNERABILITY: Dict[str, Dict[str, float]] = {
    "Roads & Highways": {
        "Flood / Cloudburst": 0.85,
        "Earthquake / Seismic Tremor": 0.65,
        "Cyclone / Storm Surge": 0.50,
        "Landslide / Debris Flow": 0.95,
        "Extreme Heatwave & Drought": 0.40,
    },
    "Railways": {
        "Flood / Cloudburst": 0.90,
        "Earthquake / Seismic Tremor": 0.70,
        "Cyclone / Storm Surge": 0.60,
        "Landslide / Debris Flow": 0.85,
        "Extreme Heatwave & Drought": 0.45,
    },
    "Ports & Shipping": {
        "Flood / Cloudburst": 0.70,
        "Earthquake / Seismic Tremor": 0.60,
        "Cyclone / Storm Surge": 1.00,
        "Landslide / Debris Flow": 0.20,
        "Extreme Heatwave & Drought": 0.30,
    },
    "Urban Development & Metro": {
        "Flood / Cloudburst": 0.80,
        "Earthquake / Seismic Tremor": 0.85,
        "Cyclone / Storm Surge": 0.60,
        "Landslide / Debris Flow": 0.40,
        "Extreme Heatwave & Drought": 0.35,
    },
    "Power & Renewable Energy": {
        "Flood / Cloudburst": 0.65,
        "Earthquake / Seismic Tremor": 0.70,
        "Cyclone / Storm Surge": 0.80,
        "Landslide / Debris Flow": 0.50,
        "Extreme Heatwave & Drought": 0.55,
    },
    "Petroleum & Natural Gas": {
        "Flood / Cloudburst": 0.60,
        "Earthquake / Seismic Tremor": 0.90,
        "Cyclone / Storm Surge": 0.75,
        "Landslide / Debris Flow": 0.65,
        "Extreme Heatwave & Drought": 0.50,
    },
    "Water & Sanitation": {
        "Flood / Cloudburst": 0.95,
        "Earthquake / Seismic Tremor": 0.60,
        "Cyclone / Storm Surge": 0.65,
        "Landslide / Debris Flow": 0.55,
        "Extreme Heatwave & Drought": 0.70,
    },
    "Civil Aviation": {
        "Flood / Cloudburst": 0.75,
        "Earthquake / Seismic Tremor": 0.65,
        "Cyclone / Storm Surge": 0.85,
        "Landslide / Debris Flow": 0.30,
        "Extreme Heatwave & Drought": 0.40,
    },
}

# Regional hazard exposure multipliers [0.6 to 1.3]
STATE_HAZARD_PROFILES: Dict[str, Dict[str, float]] = {
    "Odisha": {"Cyclone / Storm Surge": 1.30, "Flood / Cloudburst": 1.15, "Earthquake / Seismic Tremor": 0.70},
    "Andhra Pradesh": {"Cyclone / Storm Surge": 1.25, "Flood / Cloudburst": 1.10, "Earthquake / Seismic Tremor": 0.70},
    "Tamil Nadu": {"Cyclone / Storm Surge": 1.20, "Flood / Cloudburst": 1.10, "Extreme Heatwave & Drought": 1.15},
    "Gujarat": {"Cyclone / Storm Surge": 1.15, "Earthquake / Seismic Tremor": 1.20, "Extreme Heatwave & Drought": 1.15},
    "Maharashtra": {"Flood / Cloudburst": 1.15, "Landslide / Debris Flow": 1.10, "Cyclone / Storm Surge": 0.95},
    "Kerala": {"Flood / Cloudburst": 1.30, "Landslide / Debris Flow": 1.30, "Cyclone / Storm Surge": 0.85},
    "Assam": {"Flood / Cloudburst": 1.35, "Earthquake / Seismic Tremor": 1.25, "Landslide / Debris Flow": 1.20},
    "Bihar": {"Flood / Cloudburst": 1.35, "Earthquake / Seismic Tremor": 1.10, "Extreme Heatwave & Drought": 1.05},
    "West Bengal": {"Flood / Cloudburst": 1.20, "Cyclone / Storm Surge": 1.25, "Landslide / Debris Flow": 0.90},
    "Uttar Pradesh": {"Flood / Cloudburst": 1.10, "Extreme Heatwave & Drought": 1.20, "Earthquake / Seismic Tremor": 0.85},
    "Madhya Pradesh": {"Extreme Heatwave & Drought": 1.25, "Flood / Cloudburst": 0.85, "Earthquake / Seismic Tremor": 0.75},
    "Rajasthan": {"Extreme Heatwave & Drought": 1.35, "Flood / Cloudburst": 0.70, "Earthquake / Seismic Tremor": 0.80},
    "Karnataka": {"Flood / Cloudburst": 1.00, "Extreme Heatwave & Drought": 1.05, "Landslide / Debris Flow": 0.95},
    "Jammu & Kashmir": {"Earthquake / Seismic Tremor": 1.35, "Landslide / Debris Flow": 1.35, "Flood / Cloudburst": 1.05},
    "Delhi NCR": {"Earthquake / Seismic Tremor": 1.15, "Extreme Heatwave & Drought": 1.25, "Flood / Cloudburst": 0.90},
}

SEVERITY_SCALE = {
    "Minor (Level 1)": {"base_damage_pct": 0.04, "delay_factor": 1.5, "severity_mult": 0.5},
    "Moderate (Level 2)": {"base_damage_pct": 0.12, "delay_factor": 4.0, "severity_mult": 1.0},
    "Severe (Level 3)": {"base_damage_pct": 0.28, "delay_factor": 8.5, "severity_mult": 1.8},
    "Catastrophic (Level 4)": {"base_damage_pct": 0.48, "delay_factor": 16.0, "severity_mult": 2.6},
}

DISASTER_PRECAUTIONS: Dict[str, Dict[str, List[str]]] = {
    "Flood / Cloudburst": {
        "planning": [
            "Conduct 100-year return period hydrologic and hydraulic modeling (HEC-RAS) before setting formation levels.",
            "Mandate high-density polyethylene (HDPE) or geocellular subsurface stormwater retention basins.",
            "Establish minimum embankment clear heights of at least 1.5m above the Highest Flood Level (HFL).",
        ],
        "structural": [
            "Construct box culverts with double hydraulic capacity and anti-scour downstream apron cut-offs.",
            "Utilize water-resistant pozzolanic concrete mix designs (fly-ash or slag blended) with low permeability.",
            "Install automatic solar-powered dewatering sump pumps in subterranean metro stations, tunnels, and basements.",
        ],
        "operational": [
            "Integrate IMD Doppler radar cloudburst early warning telemetry with on-site sirens.",
            "Halt trench excavation and backfilling 24 hours prior to red-alert monsoonal downpours.",
            "Pre-position high-capacity submersible pumps, geotextile sandbags, and mobile diesel power units.",
        ],
    },
    "Earthquake / Seismic Tremor": {
        "planning": [
            "Enforce strict adherence to Bureau of Indian Standards (BIS) IS 1893:2016 for earthquake-resistant design.",
            "Perform site-specific geotechnical shear wave velocity tests (MASW) to evaluate soil liquefaction potential.",
            "Zone alignment away from active fault lines and uncompacted riverine alluvial silt beds.",
        ],
        "structural": [
            "Incorporate lead-rubber elastomeric bearings and seismic base isolators under bridge piers and viaduct caps.",
            "Specify high-ductility thermo-mechanically treated (TMT Fe 500D / 550D) reinforcement steel with seismic hooks.",
            "Deploy shear-wall stabilization and ductile moment-resisting frames (SMRF) in elevated buildings/terminals.",
        ],
        "operational": [
            "Install digital accelerographs and triaxial seismometers to trigger automated gas/power shutoff valves.",
            "Mandate quarterly seismic emergency response drills for all construction labor camps and crane operators.",
            "Regularly inspect tower crane guy ropes and foundation anchor bolts for micro-fissuring and loosening.",
        ],
    },
    "Cyclone / Storm Surge": {
        "planning": [
            "Design marine structures and coastal superstructures for basic wind speeds up to 55-60 m/s (IS 875 Part 3).",
            "Incorporate storm surge sea walls, tetrapod armor breakwaters, and natural mangrove buffer corridors.",
            "Avoid low-lying coastal reclamation without minimum 3.0m storm-surge tidal crest clearance.",
        ],
        "structural": [
            "Use corrosion-resistant rebar (CRS/Epoxy-coated) and zinc-flake coated fasteners rated for marine exposure class XS3.",
            "Secure sheet roofing and prefabricated canopies with interlocking hurricane clips and heavy-gauge anchor brackets.",
            "Design transmission towers and gantries with lattice aerodynamic dampeners to resist cyclic gale vortex shedding.",
        ],
        "operational": [
            "Mandate total lowering or boom-locking of all crawler and tower cranes at sustained wind alerts exceeding 45 km/h.",
            "Implement mandatory 48-hour pre-landfall evacuation protocols for offshore piling barges and coastal worker dorms.",
            "Protect electrical switchgear, transformers, and sub-stations with IP68 submersible modular enclosures.",
        ],
    },
    "Landslide / Debris Flow": {
        "planning": [
            "Execute kinematic rock slope stability assessments and LiDAR slope gradient contouring before cut-slope execution.",
            "Maintain natural vegetative root mats and mandate bio-engineering turfing on excavated slopes.",
            "Design terraced benching with minimum 3m step berms every 6m vertical elevation.",
        ],
        "structural": [
            "Install high-tensile flexible rockfall barrier netting systems and soil nail reinforced shotcrete facing.",
            "Drill horizontal perforated PVC subsoil drains to relieve hydrostatic pore-water pressure behind retaining walls.",
            "Construct reinforced earth (RE) retaining walls with geosynthetic geogrid reinforcement friction layers.",
        ],
        "operational": [
            "Deploy piezometers and wireless tiltmeter sensors on critical cut-slopes with real-time displacement alerts.",
            "Prohibit unsanctioned toe excavation during monsoons and immediately clear cascading drain siltation.",
            "Store emergency crawler excavators and rock-clearing hydraulic breakers at strategic pass checkpoints.",
        ],
    },
    "Extreme Heatwave & Drought": {
        "planning": [
            "Schedule heavy mass-concreting strictly during night shifts (20:00 - 05:00) when ambient temperatures drop.",
            "Optimize concrete water-cement ratios using polycarboxylate ether (PCE) superplasticizers and chilled water batching.",
            "Plan decentralized onsite water recycling and solar shading canopies for ongoing surface cures.",
        ],
        "structural": [
            "Incorporate continuous wet hessian curing mats and moisture-retentive curing compounds to prevent shrinkage cracks.",
            "Install thermal expansion joints with high-elastomeric polysulphide sealants in extensive concrete pavements.",
            "Use modified polymer bitumen (CRMB/PMB) for road wearing courses to resist asphalt rutting under 50°C pavement heat.",
        ],
        "operational": [
            "Implement mandatory worker heat-stress rotations, electrolyte hydration stations, and cool-off sheds (OSHA standards).",
            "Monitor core concrete hydration temperature differential (keep maximum core-to-surface gradient < 20°C).",
            "Cover aggregate stockpiles with reflective geotextile tarpaulins and continuous sprinkler mists.",
        ],
    },
}


class DisasterSimulationInput(BaseModel):
    """Payload to simulate a disaster scenario on a specific project."""

    sector: str = Field(..., description="Project sector")
    state: str = Field(..., description="State where project is being built")
    original_cost: float = Field(..., gt=0.0, description="Sanctioned project cost in ₹ Crores")
    planned_duration_months: int = Field(..., gt=0, description="Scheduled duration in months")
    elapsed_months: float = Field(..., ge=0.0, description="Months elapsed so far")
    physical_progress_pct: float = Field(..., ge=0.0, le=100.0, description="Current completion %")
    disaster_type: str = Field(..., description="Disaster event type")
    severity: str = Field(..., description="Severity level")


class DisasterSimulationResult(BaseModel):
    """Estimated damages, schedule delay impact, and engineering precautions."""

    disaster_type: str
    severity: str
    vulnerability_score: float
    hazard_multiplier: float
    estimated_damage_pct: float
    estimated_repair_cost_cr: float
    projected_additional_delay_months: float
    vulnerability_tier: str  # Critical, Elevated, Moderate, Low
    damage_description: str
    precautions: Dict[str, List[str]]


def simulate_disaster_impact(input_data: DisasterSimulationInput) -> DisasterSimulationResult:
    """Computes realistic damage estimation, schedule slippage, and proactive precautions."""
    sector = input_data.sector
    state = input_data.state
    disaster = input_data.disaster_type
    severity = input_data.severity

    # 1. Sector vulnerability
    sec_vuln = SECTOR_VULNERABILITY.get(sector, {}).get(disaster, 0.60)

    # 2. Regional hazard multiplier
    state_mult = STATE_HAZARD_PROFILES.get(state, {}).get(disaster, 1.0)

    # 3. Severity base
    sev_info = SEVERITY_SCALE.get(
        severity, {"base_damage_pct": 0.12, "delay_factor": 4.0, "severity_mult": 1.0}
    )

    # 4. Construction progress vulnerability factor
    # Projects midway (progress 20% to 75%) have raw structures, excavations, unshielded formwork,
    # and are significantly more vulnerable than 0% (unstarted) or 95% (enclosed/finished).
    prog = input_data.physical_progress_pct
    if prog < 15.0:
        stage_mult = 0.65
    elif prog <= 70.0:
        stage_mult = 1.15
    else:
        stage_mult = 0.85

    # 5. Composite damage percentage
    damage_pct = min(
        85.0,
        round(
            sev_info["base_damage_pct"]
            * sec_vuln
            * state_mult
            * stage_mult
            * sev_info["severity_mult"]
            * 100,
            2,
        ),
    )

    # 6. Repair cost estimation (Crores)
    # Applied primarily against active work-in-progress plus structural remediation
    active_capital_exposure = input_data.original_cost * max(0.20, (prog / 100.0))
    repair_cost_cr = round(active_capital_exposure * (damage_pct / 100.0) * 1.25, 2)

    # 7. Additional delay months
    added_delay_months = round(
        sev_info["delay_factor"] * sec_vuln * state_mult * (1.0 + (damage_pct / 100.0)),
        1,
    )

    # Vulnerability Tier
    composite_vuln_score = round(sec_vuln * state_mult * stage_mult, 2)
    if composite_vuln_score >= 1.15:
        vuln_tier = "Critical Vulnerability"
    elif composite_vuln_score >= 0.85:
        vuln_tier = "Elevated Vulnerability"
    elif composite_vuln_score >= 0.60:
        vuln_tier = "Moderate Vulnerability"
    else:
        vuln_tier = "Low Vulnerability"

    # Human-readable impact description
    damage_description = (
        f"A {severity.lower()} {disaster.lower()} in {state} poses an estimated {damage_pct}% "
        f"structural and work-in-progress damage to this {sector} project at {prog}% completion. "
        f"Reconstruction, stabilization, and clearance efforts are expected to incur ₹ {repair_cost_cr:,.2f} Cr "
        f"in remediation outlays and add approximately {added_delay_months} months to the delivery timeline."
    )

    # Precautions
    precautions = DISASTER_PRECAUTIONS.get(
        disaster,
        {
            "planning": ["Perform hazard risk assessment before commencement."],
            "structural": ["Use durable materials compliant with BIS standards."],
            "operational": ["Enact emergency evacuation protocols."],
        },
    )

    return DisasterSimulationResult(
        disaster_type=disaster,
        severity=severity,
        vulnerability_score=composite_vuln_score,
        hazard_multiplier=state_mult,
        estimated_damage_pct=damage_pct,
        estimated_repair_cost_cr=repair_cost_cr,
        projected_additional_delay_months=added_delay_months,
        vulnerability_tier=vuln_tier,
        damage_description=damage_description,
        precautions=precautions,
    )
