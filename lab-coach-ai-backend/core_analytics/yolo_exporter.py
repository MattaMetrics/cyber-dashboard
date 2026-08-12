"""
Converts YOLO pose data into the format your dashboard expects.
Paste this JSON into AssessmentPipeline.jsx "Paste Aikynetix Data" box.
"""
import json
import numpy as np
from datetime import datetime

def yolo_to_dashboard_format(yolo_data, test_id='LL001', client_id='YOLO_CLIENT'):
    """Convert YOLO pose engine output to dashboard-compatible JSON"""
    
    angles = yolo_data.get('angles', {})
    symmetry = yolo_data.get('symmetry', {})
    neck = yolo_data.get('neck_metrics', {})
    ankles = yolo_data.get('ankle_metrics', {})
    
    # Calculate scores from angles
    technique_score = _calc_technique_score(angles)
    symmetry_score = symmetry.get('overall', 85)
    balance_score = _calc_balance_score(yolo_data)
    flexibility_score = _calc_flexibility_score(angles)
    mobility_score = (flexibility_score + technique_score) / 2
    
    # Detect energy leaks
    energy_leaks = _detect_energy_leaks(angles, neck)
    total_efficiency = 100 - sum(leak['efficiency_loss'] for leak in energy_leaks)
    
    return {
        "assessment_id": f"LL_YOLO_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "test_id": test_id,
        "client_id": client_id,
        "header": {
            "test_name": "YOLO Local Biomechanics Scan",
            "overall_score": round((technique_score + symmetry_score + balance_score) / 3, 1),
            "grade": _calculate_grade(technique_score),
            "performance_level": _performance_level(technique_score),
        },
        "scores": {
            "technique_score": round(technique_score, 1),
            "balance_score": round(balance_score, 1),
            "symmetry_score": round(symmetry_score, 1),
            "flexibility_score": round(flexibility_score, 1),
            "mobility_score": round(mobility_score, 1),
        },
        "enhanced_metrics": {
            "energy_analysis": {
                "energy_leaks": energy_leaks,
                "total_efficiency": round(total_efficiency, 1),
                "risk_level": "HIGH" if total_efficiency < 60 else "MODERATE" if total_efficiency < 80 else "LOW",
            },
            "movement_age": {
                "overall_movement_age": _estimate_movement_age(technique_score, flexibility_score),
            },
        },
        "angles": {k: round(v, 1) for k, v in angles.items()},
        "neck_metrics": neck,
        "ankle_metrics": ankles,
        "hand_metrics": yolo_data.get("hand_metrics", {}),
        "metadata": {
            "source": "YOLO11-Pose + HandPoseEngine (21pt MediaPipe Hands)",
            "processed_at": datetime.now().isoformat(),
            "gpu": "NVIDIA RTX 4080",
        }
    }

def _calc_technique_score(angles):
    """Score based on joint angle optimality"""
    if not angles: return 50
    scores = []
    ideal_ranges = {
        'knee': (170, 180),  # Near straight for standing
        'elbow': (160, 180),
        'hip': (170, 180),
        'shoulder': (0, 20),  # Neutral
    }
    for joint, angle in angles.items():
        for key, (lo, hi) in ideal_ranges.items():
            if key in joint:
                if lo <= angle <= hi:
                    scores.append(100)
                else:
                    deviation = min(abs(angle - lo), abs(angle - hi))
                    scores.append(max(0, 100 - deviation * 2))
    return np.mean(scores) if scores else 50

def _calc_balance_score(data):
    com = data.get('center_of_mass', {})
    displacement = abs(com.get('x', 0) - 320)  # Assuming 640px frame center
    return max(0, 100 - displacement * 0.3)

def _calc_flexibility_score(angles):
    if not angles: return 50
    return min(100, np.mean(list(angles.values())) * 0.8)

def _detect_energy_leaks(angles, neck):
    leaks = []
    checks = [
        ('knee', 20, 12, 'Knee misalignment'),
        ('hip', 15, 10, 'Hip asymmetry'),
        ('shoulder', 15, 8, 'Shoulder imbalance'),
    ]
    for joint, threshold, loss, msg in checks:
        for side in ['left', 'right']:
            key = f'{side}_{joint}'
            if key in angles and angles[key] > threshold:
                leaks.append({
                    'message': f'{msg} detected ({side} side)',
                    'efficiency_loss': loss,
                    'location': key,
                })
    if neck.get('forward_head_score', 100) < 70:
        leaks.append({
            'message': 'Forward head posture',
            'efficiency_loss': 5,
            'location': 'cervical',
        })
    return leaks

def _calculate_grade(score):
    if score >= 90: return 'A'
    if score >= 80: return 'B'
    if score >= 70: return 'C'
    if score >= 60: return 'D'
    return 'F'

def _performance_level(score):
    if score >= 90: return 'Excellent'
    if score >= 80: return 'Good'
    if score >= 70: return 'Fair'
    return 'Needs Improvement'

def _estimate_movement_age(technique, flexibility):
    base_age = 35
    avg_score = (technique + flexibility) / 2
    adjustment = (90 - avg_score) * 0.3
    return round(base_age + adjustment, 1)

def export_for_dashboard(yolo_data, filepath=None):
    """Export YOLO data as dashboard-ready JSON"""
    dashboard_json = yolo_to_dashboard_format(yolo_data)
    if filepath:
        with open(filepath, 'w') as f:
            json.dump(dashboard_json, f, indent=2)
        print(f'Dashboard JSON saved to {filepath}')
    return dashboard_json
