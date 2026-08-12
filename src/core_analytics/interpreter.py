"""
AikynetixAIInterpreter — advanced biomechanical assessment engine.

Loads rubrics.json (LL001–LL003) and evaluates Aikynetix API responses or
structured time-series payloads from the Vite assessment endpoint.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Mapping, MutableMapping, Sequence

import numpy as np

try:
    from .interpreter_enhanced import EnhancedMetricsCalculator
except ImportError:
    from interpreter_enhanced import EnhancedMetricsCalculator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_RUBRICS_PATH = Path(__file__).with_name("rubrics.json")
_LIBRARY_ID_TO_TEST = {1: "LL001", 2: "LL002", 3: "LL003"}


class PerformanceLevel(Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Needs Improvement"
    AT_RISK = "At Risk"


@dataclass
class KineticChainAnalysis:
    energy_leaks: list[dict[str, Any]] = field(default_factory=list)
    weak_links: list[str] = field(default_factory=list)
    compensation_hotspots: list[str] = field(default_factory=list)
    efficiency_score: float = 100.0
    chain_integrity: float = 100.0


@dataclass
class BiomechanicalAge:
    cervical_age: float
    thoracic_age: float
    lumbar_age: float
    overall_movement_age: float
    flexibility_age: float
    mobility_age: float


@dataclass
class AssessmentResult:
    test_id: str
    test_name: str
    timestamp: str
    scores: dict[str, float]
    overall_score: float
    grade: str
    performance_level: str
    kinetic_chain: KineticChainAnalysis
    biomechanical_age: BiomechanicalAge
    compensations: list[dict[str, Any]]
    energy_efficiency: float
    muscle_activation_symmetry: float
    recommendations: list[dict[str, Any]]
    rehabilitation_plan: dict[str, list[str]]
    progress_metrics: dict[str, Any]
    raw_metrics: dict[str, float]
    composite_scores: dict[str, float] = field(default_factory=dict)
    rule_results: list[dict[str, Any]] = field(default_factory=list)
    enhanced_analysis: dict[str, Any] = field(default_factory=dict)


def _parse_condition(
    condition: str,
    metric_values: Mapping[str, float],
    primary_value: float | None = None,
) -> bool:
    expr = str(condition or "").strip()
    if not expr:
        return False

    if expr.lower().startswith("value"):
        match = re.match(r"value\s*([><=]+)\s*([\d.]+)", expr, re.I)
        if not match or primary_value is None:
            return False
        op, raw_threshold = match.groups()
        threshold = float(raw_threshold)
        if op == ">":
            return primary_value > threshold
        if op == ">=":
            return primary_value >= threshold
        if op == "<":
            return primary_value < threshold
        if op == "<=":
            return primary_value <= threshold
        return False

    clauses = re.split(r"\s+AND\s+", expr, flags=re.I)
    for clause in clauses:
        match = re.match(r"^([\w_]+)\s*([><=]+)\s*([\d.]+)$", clause.strip())
        if not match:
            return False
        metric, op, raw_threshold = match.groups()
        value = metric_values.get(metric)
        if value is None:
            return False
        threshold = float(raw_threshold)
        if op == ">":
            if not value > threshold:
                return False
        elif op == ">=":
            if not value >= threshold:
                return False
        elif op == "<":
            if not value < threshold:
                return False
        elif op == "<=":
            if not value <= threshold:
                return False
        else:
            return False
    return True


class AikynetixAIInterpreter:
    """
    Advanced AI interpreter for Aikynetix movement data.
    Implements kinetic chain analysis, energy leak detection,
    and biological age calculation against Life Longevity rubrics.
    """

    def __init__(self, rubrics_path: str | Path | None = None):
        path = Path(rubrics_path) if rubrics_path else _RUBRICS_PATH
        self.rubrics = self._load_rubrics(path)
        self.global_config = self.rubrics.get("global_config", {})
        self.scoring_weights = self.global_config.get("scoring_system", {})
        count = len(self.rubrics.get("assessments", []))
        logger.info("Initialized AI Interpreter with %s assessments", count)

    def _load_rubrics(self, path: Path) -> dict[str, Any]:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)

    def parse_aikynetix_response(self, api_response: Mapping[str, Any]) -> dict[str, Any]:
        """Parse raw Aikynetix Web API response into structured biomechanical data."""
        return {
            "keypoints_3d": self._extract_keypoints_3d(api_response),
            "joint_angles": self._extract_joint_angles(api_response),
            "center_of_mass": self._extract_com_trajectory(api_response),
            "symmetry_metrics": self._calculate_symmetry_metrics(api_response),
            "temporal_data": self._extract_temporal_data(api_response),
            "kinetic_chain_data": self._calculate_kinetic_chain(api_response),
        }

    def _extract_keypoints_3d(self, response: Mapping[str, Any]) -> dict[str, Any]:
        keypoints: dict[str, Any] = {}
        for kp in response.get("keypoints") or []:
            if not isinstance(kp, Mapping):
                continue
            label = kp.get("label")
            if not label:
                continue
            keypoints[str(label)] = {
                "x": kp.get("x"),
                "y": kp.get("y"),
                "z": kp.get("z"),
                "confidence": kp.get("confidence", 1.0),
            }
        return keypoints

    def _extract_joint_angles(self, response: Mapping[str, Any]) -> dict[str, float]:
        angles = response.get("angles") or {}
        if not isinstance(angles, Mapping):
            return {}
        out: dict[str, float] = {}
        for key, value in angles.items():
            try:
                out[str(key)] = float(value)
            except (TypeError, ValueError):
                continue
        return out

    def _extract_com_trajectory(self, response: Mapping[str, Any]) -> dict[str, float]:
        com = response.get("center_of_mass") or {}
        if not isinstance(com, Mapping):
            com = {}
        return {
            "displacement_x": float(com.get("x_displacement", 0) or 0),
            "displacement_y": float(com.get("y_displacement", 0) or 0),
            "displacement_z": float(com.get("z_displacement", 0) or 0),
            "sway_area": float(com.get("sway_area", 0) or 0),
            "sway_velocity": float(com.get("sway_velocity", 0) or 0),
            "stability_index": float(com.get("stability_index", 100) or 100),
        }

    def _calculate_symmetry_metrics(self, response: Mapping[str, Any]) -> dict[str, float]:
        symmetry = response.get("symmetry") or {}
        if not isinstance(symmetry, Mapping):
            symmetry = {}

        bilateral_symmetry: dict[str, float] = {}
        for joint in ("shoulder", "hip", "knee", "ankle"):
            bilateral_symmetry[joint] = self._calculate_joint_symmetry(response, joint)

        values = list(bilateral_symmetry.values()) or [100.0]
        overall = float(np.mean(values))
        return {
            "bilateral_symmetry": bilateral_symmetry,
            "overall_symmetry": overall,
            "left_right_asymmetry": 100.0 - overall,
            **{
                str(k): float(v)
                for k, v in symmetry.items()
                if isinstance(v, (int, float))
            },
        }

    def _calculate_joint_symmetry(self, response: Mapping[str, Any], joint: str) -> float:
        angles = self._extract_joint_angles(response)
        left_angle = angles.get(f"{joint}_left", 0.0)
        right_angle = angles.get(f"{joint}_right", 0.0)
        if left_angle + right_angle == 0:
            return 100.0
        symmetry = 100.0 - abs(left_angle - right_angle) / (
            abs(left_angle) + abs(right_angle)
        ) * 100.0
        return float(max(0.0, min(100.0, symmetry)))

    def _extract_temporal_data(self, response: Mapping[str, Any]) -> dict[str, Any]:
        temporal = response.get("temporal") or {}
        if not isinstance(temporal, Mapping):
            temporal = {}
        return {
            "total_duration": temporal.get("duration", 0),
            "phase_durations": temporal.get("phases", {}),
            "movement_velocity": temporal.get("velocity", 0),
            "acceleration_profile": temporal.get("acceleration", []),
        }

    def _calculate_kinetic_chain(self, response: Mapping[str, Any]) -> dict[str, Any]:
        angles = self._extract_joint_angles(response)
        keypoints = response.get("keypoints") or []
        energy_transfer = self._calculate_energy_transfer(angles)
        weak_links = self._detect_weak_links(angles)
        compensations = self._detect_compensation_patterns(angles)
        return {
            "energy_transfer_efficiency": energy_transfer,
            "weak_links": weak_links,
            "compensation_patterns": compensations,
            "chain_integrity_score": max(
                0.0, 100.0 - (len(weak_links) * 10) - (len(compensations) * 5)
            ),
        }

    def _calculate_energy_transfer(self, angles: Mapping[str, float]) -> float:
        base_efficiency = 100.0
        if angles.get("knee_valgus", 0) > 10:
            base_efficiency -= 15
        if angles.get("lumbar_compensation", 0) > 15:
            base_efficiency -= 10
        if angles.get("shoulder_elevation", 0) > 10:
            base_efficiency -= 10
        return max(0.0, base_efficiency)

    def _detect_weak_links(self, angles: Mapping[str, float]) -> list[str]:
        weak_links: list[str] = []
        weakness_thresholds = {
            "hip_extension": 15,
            "knee_flexion": 90,
            "ankle_dorsiflexion": 20,
            "thoracic_rotation": 50,
            "shoulder_flexion": 150,
        }
        for joint, threshold in weakness_thresholds.items():
            if angles.get(joint, 0) < threshold:
                weak_links.append(f"{joint}_weakness")
        return weak_links

    def _detect_compensation_patterns(self, angles: Mapping[str, float]) -> list[str]:
        compensations: list[str] = []
        if angles.get("lumbar_extension", 0) > 30 and angles.get("hip_extension", 0) < 10:
            compensations.append("lumbar_compensating_for_hip")
        if angles.get("shoulder_elevation", 0) > 10 and angles.get(
            "thoracic_extension", 0
        ) < 20:
            compensations.append("shoulder_compensating_for_thoracic")
        if angles.get("knee_valgus", 0) > 10:
            compensations.append("frontal_plane_knee_instability")
        return compensations

    def assess_movement(
        self,
        test_id: str,
        structured_data: Mapping[str, Any],
        *,
        chronological_age: int = 30,
    ) -> AssessmentResult:
        """Comprehensive movement assessment against Life Longevity rubrics."""
        test_rubric = self._get_test_rubric(test_id)
        if not test_rubric:
            raise ValueError(f"No rubric found for test_id: {test_id}")

        rule_scores: list[dict[str, Any]] = []
        energy_leaks: list[dict[str, Any]] = []

        for rule in test_rubric.get("scoring_rules", []):
            score = self._evaluate_rule(rule, structured_data)
            rule_scores.append(score)
            leak = score.get("energy_leak")
            if leak:
                energy_leaks.append(leak)

        composite_scores = self._calculate_composite_scores(rule_scores, structured_data)
        kinetic_chain = self._analyze_kinetic_chain(structured_data, test_rubric, energy_leaks)
        bio_age = self._calculate_biomechanical_age(structured_data)
        compensations = self._detect_assessment_compensations(
            test_rubric.get("compensation_patterns", []),
            structured_data,
        )
        recommendations = self._generate_recommendations(
            composite_scores, kinetic_chain, compensations, test_rubric
        )
        rehab_plan = test_rubric.get("rehabilitation_plans", {})
        progress = self._calculate_progress_metrics(test_id, composite_scores)

        total_weight = sum(float(s.get("weight", 0)) for s in rule_scores) or 1.0
        overall_score = (
            sum(float(s.get("weighted_score", 0)) for s in rule_scores) / total_weight
        )
        grade, level = self._calculate_grade(overall_score)

        enhanced_analysis = EnhancedMetricsCalculator.build_enhanced_analysis(
            test_id,
            structured_data,
            composite_scores,
            overall_score,
            chronological_age=chronological_age,
        )

        symmetry = structured_data.get("symmetry_metrics") or {}
        return AssessmentResult(
            test_id=test_id,
            test_name=str(test_rubric.get("name", test_id)),
            timestamp=datetime.now().isoformat(),
            scores={str(s["metric"]): float(s["raw_score"]) for s in rule_scores},
            overall_score=round(overall_score, 1),
            grade=grade,
            performance_level=level,
            kinetic_chain=kinetic_chain,
            biomechanical_age=bio_age,
            compensations=compensations,
            energy_efficiency=kinetic_chain.efficiency_score,
            muscle_activation_symmetry=float(symmetry.get("overall_symmetry", 0) or 0),
            recommendations=recommendations,
            rehabilitation_plan=rehab_plan,
            progress_metrics=progress,
            raw_metrics=self._extract_raw_metrics(structured_data),
            composite_scores=composite_scores,
            rule_results=rule_scores,
            enhanced_analysis=enhanced_analysis,
        )

    def _evaluate_rule(self, rule: Mapping[str, Any], data: Mapping[str, Any]) -> dict[str, Any]:
        metric_name = str(rule["metric"])
        metric_value = self._extract_metric_value(metric_name, data)
        thresholds = rule.get("thresholds") or {}
        scoring = rule.get("scoring") or {}

        score = 0.0
        category = "poor"
        for cat in ("excellent", "good", "fair", "poor"):
            band = thresholds.get(cat)
            if not isinstance(band, Mapping):
                continue
            minimum = float(band.get("min", float("-inf")))
            maximum = float(band.get("max", float("inf")))
            if minimum <= metric_value <= maximum:
                score = float(scoring.get(cat, 0))
                category = cat
                break

        weight = float(rule.get("weight", 0))
        weighted_score = score * weight

        energy_leak = None
        leak_config = rule.get("energy_leak_detection")
        if isinstance(leak_config, Mapping) and _parse_condition(
            str(leak_config.get("condition", "")),
            self._all_metric_values(data),
            metric_value,
        ):
            energy_leak = dict(leak_config)

        return {
            "rule_id": rule.get("rule_id"),
            "metric": metric_name,
            "value": metric_value,
            "raw_score": score,
            "weight": weight,
            "weighted_score": weighted_score,
            "category": category,
            "energy_leak": energy_leak,
        }

    def _all_metric_values(self, data: Mapping[str, Any]) -> dict[str, float]:
        values: dict[str, float] = {}
        values.update(self._extract_joint_angles(data))
        values.update(
            {
                str(k): float(v)
                for k, v in (data.get("joint_angles") or {}).items()
                if isinstance(v, (int, float))
            }
        )
        for bucket in (
            data.get("symmetry_metrics") or {},
            data.get("center_of_mass") or {},
            data.get("kinetic_chain_data") or {},
        ):
            if isinstance(bucket, Mapping):
                for k, v in bucket.items():
                    if isinstance(v, (int, float)):
                        values[str(k)] = float(v)
        return values

    def _extract_metric_value(self, metric_name: str, data: Mapping[str, Any]) -> float:
        joint_angles = data.get("joint_angles") or {}
        if metric_name in joint_angles:
            return float(joint_angles[metric_name])

        symmetry = data.get("symmetry_metrics") or {}
        if metric_name in symmetry and isinstance(symmetry[metric_name], (int, float)):
            return float(symmetry[metric_name])

        com = data.get("center_of_mass") or {}
        if metric_name in com:
            return float(com[metric_name])

        chain = data.get("kinetic_chain_data") or {}
        if metric_name in chain and isinstance(chain[metric_name], (int, float)):
            return float(chain[metric_name])

        return 0.0

    def _calculate_composite_scores(
        self,
        rule_scores: Sequence[Mapping[str, Any]],
        data: Mapping[str, Any],
    ) -> dict[str, float]:
        scores = {
            "technique_score": 0.0,
            "balance_score": 0.0,
            "symmetry_score": 0.0,
            "flexibility_score": 0.0,
            "mobility_score": 0.0,
        }

        if rule_scores:
            scores["technique_score"] = float(
                np.mean([float(s["raw_score"]) for s in rule_scores])
            )

        com = data.get("center_of_mass") or {}
        scores["balance_score"] = float(com.get("stability_index", 100) or 100)

        symmetry_rules = [
            s for s in rule_scores if "symmetry" in str(s.get("metric", "")).lower()
        ]
        if symmetry_rules:
            scores["symmetry_score"] = float(
                np.mean([float(s["raw_score"]) for s in symmetry_rules])
            )
        else:
            symmetry = data.get("symmetry_metrics") or {}
            scores["symmetry_score"] = float(symmetry.get("overall_symmetry", 0) or 0)

        flex_rules = [
            s
            for s in rule_scores
            if "rom" in str(s.get("metric", "")).lower()
            or "flexion" in str(s.get("metric", "")).lower()
        ]
        if flex_rules:
            scores["flexibility_score"] = float(
                np.mean([float(s["raw_score"]) for s in flex_rules])
            )

        scores["mobility_score"] = float(
            np.mean([scores["flexibility_score"], scores["technique_score"]])
        )
        return scores

    def _analyze_kinetic_chain(
        self,
        data: Mapping[str, Any],
        rubric: Mapping[str, Any],
        energy_leaks: Sequence[Mapping[str, Any]],
    ) -> KineticChainAnalysis:
        chain_data = data.get("kinetic_chain_data") or {}
        return KineticChainAnalysis(
            energy_leaks=list(energy_leaks),
            weak_links=list(chain_data.get("weak_links") or []),
            compensation_hotspots=list(chain_data.get("compensation_patterns") or []),
            efficiency_score=float(chain_data.get("energy_transfer_efficiency", 100) or 100),
            chain_integrity=float(chain_data.get("chain_integrity_score", 100) or 100),
        )

    def _calculate_biomechanical_age(self, data: Mapping[str, Any]) -> BiomechanicalAge:
        age_norms = {
            "cervical": {20: 50, 30: 45, 40: 40, 50: 35, 60: 30},
            "thoracic": {20: 70, 30: 65, 40: 55, 50: 45, 60: 35},
            "lumbar": {20: 30, 30: 27, 40: 24, 50: 20, 60: 17},
        }
        angles = data.get("joint_angles") or {}
        cervical_age = self._calculate_age_from_metric(
            float(angles.get("cervical_flexion_rom", 0) or 0), age_norms["cervical"]
        )
        thoracic_age = self._calculate_age_from_metric(
            float(angles.get("thoracic_rotation_rom", 0) or 0), age_norms["thoracic"]
        )
        lumbar_age = self._calculate_age_from_metric(
            float(angles.get("lumbar_extension_rom", 0) or 0), age_norms["lumbar"]
        )
        overall_movement_age = float(np.mean([cervical_age, thoracic_age, lumbar_age]))
        return BiomechanicalAge(
            cervical_age=cervical_age,
            thoracic_age=thoracic_age,
            lumbar_age=lumbar_age,
            overall_movement_age=overall_movement_age,
            flexibility_age=overall_movement_age - 5,
            mobility_age=overall_movement_age,
        )

    def _calculate_age_from_metric(self, value: float, norms: Mapping[int, float]) -> float:
        ages = sorted(norms.keys())
        for i, age in enumerate(ages):
            if value >= norms[age]:
                if i == 0:
                    return float(age)
                prev_age = ages[i - 1]
                prev_norm = norms[prev_age]
                curr_norm = norms[age]
                if prev_norm == curr_norm:
                    return float(age)
                ratio = (value - curr_norm) / (prev_norm - curr_norm)
                return float(age - (ratio * (age - prev_age)))
        return float(ages[-1])

    def _detect_assessment_compensations(
        self,
        patterns: Sequence[Mapping[str, Any]],
        data: Mapping[str, Any],
    ) -> list[dict[str, Any]]:
        detected: list[dict[str, Any]] = []
        metric_values = self._all_metric_values(data)
        for pattern in patterns:
            if self._check_compensation_pattern(pattern, metric_values):
                detected.append(
                    {
                        "pattern": pattern.get("pattern"),
                        "root_cause": pattern.get("root_cause"),
                        "kinetic_chain_impact": pattern.get("kinetic_chain_impact"),
                        "recommendation": pattern.get("recommendation"),
                    }
                )
        return detected

    def _check_compensation_pattern(
        self, pattern: Mapping[str, Any], metric_values: Mapping[str, float]
    ) -> bool:
        return _parse_condition(str(pattern.get("detection", "")), metric_values)

    def _generate_recommendations(
        self,
        scores: Mapping[str, float],
        kinetic_chain: KineticChainAnalysis,
        compensations: Sequence[Mapping[str, Any]],
        rubric: Mapping[str, Any],
    ) -> list[dict[str, Any]]:
        recommendations: list[dict[str, Any]] = []
        for comp in compensations:
            recommendations.append(
                {
                    "priority": "HIGH",
                    "category": "Compensation Correction",
                    "recommendation": comp.get("recommendation"),
                    "impact": comp.get("kinetic_chain_impact"),
                    "timeline": "Immediate",
                }
            )
        for weak_link in kinetic_chain.weak_links:
            recommendations.append(
                {
                    "priority": "MEDIUM",
                    "category": "Strength Deficit",
                    "recommendation": f"Targeted strengthening for {weak_link}",
                    "impact": f"Improving {weak_link} will enhance kinetic chain efficiency",
                    "timeline": "2-4 weeks",
                }
            )
        if float(scores.get("technique_score", 0)) >= 75:
            recommendations.append(
                {
                    "priority": "INFO",
                    "category": "Positive Feedback",
                    "recommendation": "Continue maintaining current movement patterns in strong areas",
                    "impact": "Preserve existing movement quality",
                    "timeline": "Ongoing",
                }
            )
        return recommendations

    def _calculate_progress_metrics(
        self, test_id: str, current_scores: Mapping[str, float]
    ) -> dict[str, Any]:
        return {
            "test_id": test_id,
            "baseline_established": True,
            "retest_intervals": {
                "2_week": (datetime.now() + timedelta(weeks=2)).isoformat(),
                "4_week": (datetime.now() + timedelta(weeks=4)).isoformat(),
                "8_week": (datetime.now() + timedelta(weeks=8)).isoformat(),
            },
            "improvement_potential": self._calculate_improvement_potential(current_scores),
        }

    def _calculate_improvement_potential(self, scores: Mapping[str, float]) -> float:
        values = [float(v) for v in scores.values() if isinstance(v, (int, float))]
        if not values:
            return 0.0
        return float(max(0.0, 100.0 - np.mean(values)))

    def _extract_raw_metrics(self, data: Mapping[str, Any]) -> dict[str, float]:
        chain = data.get("kinetic_chain_data") or {}
        symmetry = data.get("symmetry_metrics") or {}
        com = data.get("center_of_mass") or {}
        return {
            **{
                str(k): float(v)
                for k, v in (data.get("joint_angles") or {}).items()
                if isinstance(v, (int, float))
            },
            "com_displacement": float(com.get("displacement_x", 0) or 0),
            "symmetry_score": float(symmetry.get("overall_symmetry", 0) or 0),
            "energy_efficiency": float(chain.get("energy_transfer_efficiency", 0) or 0),
        }

    def _get_test_rubric(self, test_id: str) -> dict[str, Any] | None:
        normalized = str(test_id).strip().upper()
        if normalized.isdigit():
            normalized = _LIBRARY_ID_TO_TEST.get(int(normalized), normalized)
        for assessment in self.rubrics.get("assessments", []):
            if str(assessment.get("test_id", "")).upper() == normalized:
                return assessment
            if str(assessment.get("name", "")).lower() == str(test_id).lower():
                return assessment
        return None

    def _calculate_grade(self, score: float) -> tuple[str, str]:
        if score >= 90:
            return "A", PerformanceLevel.EXCELLENT.value
        if score >= 80:
            return "B", PerformanceLevel.GOOD.value
        if score >= 70:
            return "C", PerformanceLevel.FAIR.value
        if score >= 60:
            return "D", PerformanceLevel.POOR.value
        return "F", PerformanceLevel.AT_RISK.value

    def generate_report(self, result: AssessmentResult) -> dict[str, Any]:
        """Generate comprehensive assessment report."""
        composite = result.composite_scores
        return {
            "header": {
                "test_name": result.test_name,
                "test_id": result.test_id,
                "date": result.timestamp,
                "overall_score": result.overall_score,
                "grade": result.grade,
                "performance_level": result.performance_level,
            },
            "scores": {
                "technique": round(composite.get("technique_score", 0), 1),
                "balance": round(composite.get("balance_score", 0), 1),
                "symmetry": round(composite.get("symmetry_score", 0), 1),
                "flexibility": round(composite.get("flexibility_score", 0), 1),
                "mobility": round(composite.get("mobility_score", 0), 1),
            },
            "biomechanical_age": {
                "overall_movement_age": round(result.biomechanical_age.overall_movement_age, 1),
                "cervical_age": round(result.biomechanical_age.cervical_age, 1),
                "flexibility_age": round(result.biomechanical_age.flexibility_age, 1),
                "mobility_age": round(result.biomechanical_age.mobility_age, 1),
            },
            "kinetic_chain": {
                "efficiency": round(result.kinetic_chain.efficiency_score, 1),
                "integrity": round(result.kinetic_chain.chain_integrity, 1),
                "weak_links": result.kinetic_chain.weak_links,
                "energy_leaks": result.kinetic_chain.energy_leaks,
            },
            "compensations": result.compensations,
            "recommendations": result.recommendations,
            "rehabilitation_plan": result.rehabilitation_plan,
            "progress": result.progress_metrics,
            "rule_results": result.rule_results,
            "raw_telemetry": result.raw_metrics,
            "enhanced_analysis": result.enhanced_analysis,
            "longevity_recommendations": (
                result.enhanced_analysis.get("longevity_recommendations")
                if result.enhanced_analysis
                else {}
            ),
            "energy_analysis": (
                result.enhanced_analysis.get("energy_analysis")
                if result.enhanced_analysis
                else {}
            ),
        }

    def structured_data_from_time_series(
        self, frames: Sequence[Mapping[str, Any]]
    ) -> dict[str, Any]:
        """Convert portal time_series frames into structured_data for assess_movement."""
        joint_angles: dict[str, float] = {}
        for frame in frames:
            metrics = frame.get("metrics") if isinstance(frame.get("metrics"), Mapping) else frame
            if not isinstance(metrics, Mapping):
                continue
            for key, value in metrics.items():
                try:
                    joint_angles[str(key)] = max(joint_angles.get(str(key), 0.0), float(value))
                except (TypeError, ValueError):
                    continue

        api_shape = {
            "angles": joint_angles,
            "center_of_mass": {"stability_index": 100},
            "symmetry": {},
        }
        return self.parse_aikynetix_response(api_shape)


class CyberCoachingAI:
    """
    Backward-compatible wrapper used by report_generator and legacy callers.
    Accepts the same payload shape as src/api/assessment_endpoint.js.
    """

    SUPPORTED_ASSESSMENTS: tuple[str, ...] = ()

    def __init__(self, rubrics: Mapping[str, Any] | None = None):
        self._interpreter = AikynetixAIInterpreter()
        if rubrics is not None:
            self._interpreter.rubrics = dict(rubrics)
        self.rubrics = self._interpreter.rubrics
        self.SUPPORTED_ASSESSMENTS = tuple(
            str(a.get("test_id", ""))
            for a in self.rubrics.get("assessments", [])
            if a.get("test_id")
        )

    def evaluate(
        self,
        payload: Mapping[str, Any] | str | bytes,
        assessment_name: str | None = None,
    ) -> dict[str, Any]:
        data = self._coerce_payload(payload)
        test_id = self._resolve_test_id(data, assessment_name)
        frames = self._extract_frames(data)

        if not self._interpreter._get_test_rubric(test_id):
            return self._error(
                "UNKNOWN_ASSESSMENT",
                f"Unknown assessment '{test_id}'.",
                test_id,
                supported=self.SUPPORTED_ASSESSMENTS,
            )

        if not frames and not data.get("angles"):
            return self._error(
                "EMPTY_TIME_SERIES",
                "No time-series frame data captured.",
                test_id,
            )

        if frames:
            structured = self._interpreter.structured_data_from_time_series(frames)
        else:
            structured = self._interpreter.parse_aikynetix_response(data)

        try:
            result = self._interpreter.assess_movement(test_id, structured)
        except ValueError as exc:
            return self._error("UNKNOWN_ASSESSMENT", str(exc), test_id)

        report = self._interpreter.generate_report(result)
        detected = [
            str(c.get("pattern", ""))
            for c in result.compensations
            if c.get("pattern")
        ] + [
            str(leak.get("message", ""))
            for leak in result.kinetic_chain.energy_leaks
            if isinstance(leak, Mapping) and leak.get("message")
        ]

        band = result.performance_level.lower().replace(" ", "_")
        if "excellent" in band:
            overall_band = "excellent"
        elif "good" in band:
            overall_band = "good"
        elif "fair" in band:
            overall_band = "fair"
        else:
            overall_band = "poor"

        rehab_window = (
            "2_week"
            if overall_band in ("excellent", "good")
            else "4_week"
            if overall_band == "fair"
            else "8_week"
        )

        return {
            "ok": True,
            "status": "evaluated",
            "assessment_executed": result.test_id,
            "assessment_name": result.test_name,
            "athlete_code": data.get("athlete_code") or data.get("access_code"),
            "source": data.get("source") or "tracking_stream",
            "frame_count": len(frames) if frames else 1,
            "global_config": self.rubrics.get("global_config"),
            "composite_score": result.overall_score,
            "overall_band": overall_band,
            "grade": result.grade,
            "performance_level": result.performance_level,
            "assessment_summary": result.raw_metrics,
            "rule_results": result.rule_results,
            "detected_flaws": detected,
            "compensation_patterns": result.compensations,
            "energy_leaks": result.kinetic_chain.energy_leaks,
            "rehabilitation_plan": result.rehabilitation_plan.get(rehab_window, []),
            "rehabilitation_window": rehab_window,
            "recommendations": result.recommendations,
            "biomechanical_age": asdict(result.biomechanical_age),
            "kinetic_chain": asdict(result.kinetic_chain),
            "enhanced_analysis": result.enhanced_analysis,
            "longevity_recommendations": result.enhanced_analysis.get(
                "longevity_recommendations", {}
            ),
            "prescribed_wellness_plan": report["header"]["performance_level"],
            "cyber_render_ready": True,
            "render_engine_trigger": {
                "theme": "amber_compensation_alert" if detected else "optimal_cyan_flow",
                "active_mesh_warp": len(detected) > 0,
            },
            "report": report,
        }

    def _coerce_payload(
        self, payload: Mapping[str, Any] | str | bytes
    ) -> MutableMapping[str, Any]:
        if isinstance(payload, (str, bytes)):
            raw = payload.decode("utf-8") if isinstance(payload, bytes) else payload
            parsed = json.loads(raw)
            if not isinstance(parsed, dict):
                raise ValueError("JSON payload must be an object.")
            return parsed
        if isinstance(payload, Mapping):
            return dict(payload)
        raise TypeError("Payload must be a dict or JSON string.")

    def _resolve_test_id(self, data: Mapping[str, Any], override: str | None) -> str:
        raw = (
            override
            or data.get("test_id")
            or data.get("assessment_name")
            or data.get("assessment")
            or data.get("track_key")
            or data.get("library_id")
            or data.get("track_id")
            or ""
        )
        key = str(raw).strip()
        if key.isdigit():
            return _LIBRARY_ID_TO_TEST.get(int(key), key)
        return key

    def _extract_frames(self, data: Mapping[str, Any]) -> list[Mapping[str, Any]]:
        nested = data.get("data")
        if isinstance(nested, Mapping):
            series = nested.get("time_series") or nested.get("frames")
            if isinstance(series, Sequence) and not isinstance(series, (str, bytes)):
                return [f for f in series if isinstance(f, Mapping)]

        series = data.get("time_series") or data.get("frames") or []
        if not isinstance(series, Sequence) or isinstance(series, (str, bytes)):
            return []
        return [f for f in series if isinstance(f, Mapping)]

    @staticmethod
    def _error(
        code: str,
        message: str,
        assessment_name: str | None,
        *,
        supported: Sequence[str] | None = None,
    ) -> dict[str, Any]:
        error: dict[str, Any] = {"code": code, "message": message}
        if supported is not None:
            error["supported"] = list(supported)
        return {
            "ok": False,
            "status": "error",
            "error": error,
            "assessment_executed": assessment_name,
            "detected_flaws": [],
            "prescribed_wellness_plan": None,
            "cyber_render_ready": False,
            "render_engine_trigger": {"theme": "idle_slate", "active_mesh_warp": False},
        }


def load_rubrics() -> dict[str, Any]:
    with _RUBRICS_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


if __name__ == "__main__":
    interpreter = AikynetixAIInterpreter()

    sample_response = {
        "keypoints": [],
        "angles": {
            "cervical_flexion_rom": 40,
            "cervical_extension_rom": 45,
            "lateral_flexion_symmetry": 85,
            "forward_head_displacement": 3.5,
            "shoulder_elevation_asymmetry": 8,
        },
        "center_of_mass": {
            "x_displacement": 1.2,
            "y_displacement": 0.8,
            "sway_area": 2.1,
            "stability_index": 92,
        },
        "symmetry": {"overall_symmetry": 88},
    }

    structured = interpreter.parse_aikynetix_response(sample_response)
    result = interpreter.assess_movement("LL001", structured)
    report = interpreter.generate_report(result)
    print(json.dumps(report, indent=2))
