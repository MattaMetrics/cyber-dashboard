"""Build printable / portal-ready report payloads from CyberCoachingAI output."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping


def build_biomechanical_report(
    evaluation: Mapping[str, Any],
    *,
    client_name: str = "UNREGISTERED ATHLETE",
    client_code: str = "000000",
    movement_title: str | None = None,
) -> dict[str, Any]:
    """
    Convert interpreter output into a BiomechanicalReportPDF-friendly structure.
    """
    summary = dict(evaluation.get("assessment_summary") or {})
    flaws = list(evaluation.get("detected_flaws") or [])
    assessment = evaluation.get("assessment_name") or evaluation.get("assessment_executed") or "UNKNOWN"
    composite = evaluation.get("composite_score")
    band = evaluation.get("overall_band") or "unknown"

    return {
        "header": {
            "lab_name": "LONGEVITY LABORATORY",
            "report_type": "CLINICAL BIOMECHANICAL RETICLE ANALYSIS REPORT",
            "client_name": client_name,
            "client_code": client_code,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "track_profile": {
            "movement_title": movement_title or str(assessment).upper(),
            "phase_text": (
                f"COMPOSITE SCORE: {composite} // BAND: {str(band).upper()} "
                f"// FRAMES: {evaluation.get('frame_count', 0)}"
            ),
            "assessment_key": evaluation.get("assessment_executed"),
            "test_id": evaluation.get("assessment_executed"),
        },
        "metrics": {
            "balance_register": _fmt(composite, default="—"),
            "power_vector": _fmt(summary.get("cervical_flexion_rom") or summary.get("lumbar_extension_rom")),
            "upper_torque": _fmt(summary.get("thoracic_rotation_rom") or summary.get("thoracic_extension_rom")),
            "lower_drive": _fmt(summary.get("hip_pelvic_stability") or summary.get("hip_flexor_tension_index")),
            "center_of_mass_drift": _fmt(summary.get("forward_head_displacement"), suffix=" cm"),
            "global_asymmetry_score": _fmt(
                summary.get("lateral_flexion_symmetry") or summary.get("rotation_symmetry"),
                suffix="%",
            ),
        },
        "diagnostic_summary": _build_summary_notes(evaluation, flaws),
        "rehabilitation_plan": evaluation.get("rehabilitation_plan") or [],
        "rehabilitation_window": evaluation.get("rehabilitation_window"),
        "rule_results": evaluation.get("rule_results") or [],
        "compensation_patterns": evaluation.get("compensation_patterns") or [],
        "energy_leaks": evaluation.get("energy_leaks") or [],
        "prescribed_wellness_plan": evaluation.get("prescribed_wellness_plan"),
        "render_engine_trigger": evaluation.get("render_engine_trigger"),
        "raw_evaluation": dict(evaluation),
    }


def _fmt(value: Any, *, default: str = "—", suffix: str = "") -> str:
    if value is None:
        return default
    try:
        return f"{float(value):.2f}{suffix}"
    except (TypeError, ValueError):
        return default


def _build_summary_notes(evaluation: Mapping[str, Any], flaws: list[str]) -> str:
    rehab = evaluation.get("rehabilitation_plan") or []
    rehab_hint = rehab[0] if rehab else None

    if not flaws:
        base = "Movement vectors within calibrated thresholds. Continue baseline longevity track."
        return f"{base} {rehab_hint}" if rehab_hint else base

    package = evaluation.get("prescribed_wellness_plan") or "Custom corrective protocol pending."
    flaw_text = ", ".join(flaws)
    note = (
        f"Detected flags: {flaw_text}. "
        f"Recommended intervention track: {package}."
    )
    if rehab_hint:
        note += f" Primary rehab cue: {rehab_hint}."
    return note
