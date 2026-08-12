"""
Life Longevity - Complete Hand Pose Engine
21 keypoints per hand + precision metrics for:
- Grip strength analysis (motocross, wrestling, BJJ)
- Desk ergonomics (typing posture, carpal tunnel risk)
- Combat sports (punch mechanics, grip fighting)
- Fine motor control (surgical precision, instrument playing)
- Rehabilitation tracking (range of motion recovery)
"""
from __future__ import annotations

import cv2
import numpy as np
import mediapipe as mp
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


@dataclass
class HandMetrics:
    """Complete hand analysis metrics"""

    grip_strength_pct: float = 0.0
    fist_closure_pct: float = 0.0
    thumb_opposition_pct: float = 0.0
    pinch_strength_index: float = 0.0

    finger_flexion: Dict[str, float] = field(default_factory=dict)
    finger_abduction: Dict[str, float] = field(default_factory=dict)
    finger_extension: Dict[str, float] = field(default_factory=dict)

    index_independence: float = 0.0
    finger_splay_symmetry: float = 0.0
    tremor_index: float = 0.0

    wrist_extension_angle: float = 0.0
    wrist_ulnar_deviation: float = 0.0
    carpal_tunnel_risk: float = 0.0
    typing_neutrality: float = 0.0

    hook_grip_integrity: float = 0.0
    punch_fist_alignment: float = 0.0
    trigger_finger_control: float = 0.0

    range_of_motion_total: float = 0.0
    edema_indicator: float = 0.0
    symmetry_recovery_pct: float = 0.0


SCALAR_METRIC_KEYS = (
    'grip_strength_pct',
    'fist_closure_pct',
    'thumb_opposition_pct',
    'pinch_strength_index',
    'index_independence',
    'finger_splay_symmetry',
    'tremor_index',
    'wrist_extension_angle',
    'wrist_ulnar_deviation',
    'carpal_tunnel_risk',
    'typing_neutrality',
    'hook_grip_integrity',
    'punch_fist_alignment',
    'trigger_finger_control',
    'range_of_motion_total',
    'edema_indicator',
    'symmetry_recovery_pct',
)


class HandPoseEngine:
    """Complete hand biomechanics engine with 21 keypoints + precision metrics"""

    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5,
        )
        self.mp_draw = mp.solutions.drawing_utils

        self.FINGERS = {
            'thumb': [1, 2, 3, 4],
            'index': [5, 6, 7, 8],
            'middle': [9, 10, 11, 12],
            'ring': [13, 14, 15, 16],
            'pinky': [17, 18, 19, 20],
        }

        self.FINGER_TIPS = {'thumb': 4, 'index': 8, 'middle': 12, 'ring': 16, 'pinky': 20}
        self.FINGER_MCP = {'thumb': 2, 'index': 5, 'middle': 9, 'ring': 13, 'pinky': 17}
        self.WRIST = 0

        self.prev_landmarks = None

        print('Hand Engine Ready - 21 keypoints + precision metrics')

    def process_frame(self, frame: np.ndarray) -> Optional[Dict]:
        """Process frame and return complete hand metrics"""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)

        if not results.multi_hand_landmarks:
            return None

        hands_data = []

        for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
            handedness = results.multi_handedness[idx].classification[0].label

            keypoints = {}
            for i, lm in enumerate(hand_landmarks.landmark):
                keypoints[i] = {'x': lm.x, 'y': lm.y, 'z': lm.z}

            metrics = HandMetrics()

            metrics.grip_strength_pct = self._calc_grip_strength(keypoints)
            metrics.fist_closure_pct = self._calc_fist_closure(keypoints)
            metrics.thumb_opposition_pct = self._calc_thumb_opposition(keypoints)
            metrics.pinch_strength_index = self._calc_pinch_strength(keypoints)

            metrics.finger_flexion = self._calc_finger_flexion(keypoints)
            metrics.finger_abduction = self._calc_finger_abduction(keypoints)
            metrics.finger_extension = self._calc_finger_extension(keypoints)

            metrics.index_independence = self._calc_index_independence(keypoints)
            metrics.finger_splay_symmetry = self._calc_splay_symmetry(keypoints)
            metrics.tremor_index = self._calc_tremor(keypoints)

            metrics.wrist_extension_angle = self._calc_wrist_extension(keypoints)
            metrics.wrist_ulnar_deviation = self._calc_ulnar_deviation(keypoints)
            metrics.carpal_tunnel_risk = self._calc_carpal_tunnel_risk(keypoints)
            metrics.typing_neutrality = self._calc_typing_neutrality(keypoints)

            metrics.hook_grip_integrity = self._calc_hook_grip(keypoints)
            metrics.punch_fist_alignment = self._calc_punch_alignment(keypoints)
            metrics.trigger_finger_control = self._calc_trigger_control(keypoints)

            metrics.range_of_motion_total = self._calc_rom_total(keypoints)

            hands_data.append({
                'hand': handedness,
                'keypoints': keypoints,
                'metrics': metrics,
            })

        self.prev_landmarks = hands_data

        return {
            'hands': hands_data,
            'bilateral': self._calc_bilateral_metrics(hands_data) if len(hands_data) == 2 else None,
        }

    def _calc_grip_strength(self, kp: Dict) -> float:
        flexion_values = []
        for finger, joints in self.FINGERS.items():
            if finger == 'thumb':
                continue
            mcp = joints[0]
            tip = joints[-1]
            if mcp in kp and tip in kp:
                dist = self._distance(kp[mcp], kp[tip])
                flexion = max(0, 100 - dist * 250)
                flexion_values.append(flexion)
        return float(np.mean(flexion_values)) if flexion_values else 0.0

    def _calc_fist_closure(self, kp: Dict) -> float:
        palm_center = np.array([kp[self.WRIST]['x'], kp[self.WRIST]['y']])
        distances = []
        for finger, tip_idx in self.FINGER_TIPS.items():
            if finger == 'thumb':
                continue
            if tip_idx in kp:
                tip = np.array([kp[tip_idx]['x'], kp[tip_idx]['y']])
                dist = np.linalg.norm(tip - palm_center)
                distances.append(max(0, 100 - dist * 200))
        return float(np.mean(distances)) if distances else 0.0

    def _calc_thumb_opposition(self, kp: Dict) -> float:
        if 4 not in kp:
            return 0.0
        thumb_tip = np.array([kp[4]['x'], kp[4]['y']])
        oppositions = []
        for finger, tip_idx in self.FINGER_TIPS.items():
            if finger == 'thumb':
                continue
            if tip_idx in kp:
                tip = np.array([kp[tip_idx]['x'], kp[tip_idx]['y']])
                dist = np.linalg.norm(thumb_tip - tip)
                oppositions.append(max(0, 100 - dist * 300))
        return float(np.mean(oppositions)) if oppositions else 0.0

    def _calc_pinch_strength(self, kp: Dict) -> float:
        if 4 in kp and 8 in kp:
            thumb = np.array([kp[4]['x'], kp[4]['y']])
            index = np.array([kp[8]['x'], kp[8]['y']])
            dist = np.linalg.norm(thumb - index)
            return max(0, 100 - dist * 350)
        return 0.0

    def _calc_finger_flexion(self, kp: Dict) -> Dict[str, float]:
        flexion = {}
        for finger, joints in self.FINGERS.items():
            if len(joints) >= 3 and all(j in kp for j in joints[:3]):
                v1 = np.array([
                    kp[joints[0]]['x'] - kp[joints[1]]['x'],
                    kp[joints[0]]['y'] - kp[joints[1]]['y'],
                ])
                v2 = np.array([
                    kp[joints[2]]['x'] - kp[joints[1]]['x'],
                    kp[joints[2]]['y'] - kp[joints[1]]['y'],
                ])
                flexion[finger] = float(self._angle_between(v1, v2))
        return flexion

    def _calc_finger_abduction(self, kp: Dict) -> Dict[str, float]:
        abduction = {}
        if 9 in kp:
            middle = np.array([kp[9]['x'], kp[9]['y']])
            for finger, mcp_idx in self.FINGER_MCP.items():
                if finger == 'middle':
                    continue
                if mcp_idx in kp:
                    finger_pos = np.array([kp[mcp_idx]['x'], kp[mcp_idx]['y']])
                    spread = np.linalg.norm(finger_pos - middle)
                    abduction[finger] = float(spread * 100)
        return abduction

    def _calc_finger_extension(self, kp: Dict) -> Dict[str, float]:
        extension = {}
        for finger, joints in self.FINGERS.items():
            if joints[0] in kp and joints[-1] in kp:
                pts = [np.array([kp[j]['x'], kp[j]['y']]) for j in joints if j in kp]
                if len(pts) >= 2:
                    total_dist = sum(np.linalg.norm(pts[i] - pts[i + 1]) for i in range(len(pts) - 1))
                    direct_dist = np.linalg.norm(pts[0] - pts[-1])
                    straightness = min(1.0, direct_dist / (total_dist + 0.001))
                    extension[finger] = float(straightness * 100)
        return extension

    def _calc_index_independence(self, kp: Dict) -> float:
        if 8 not in kp:
            return 0.0
        index_tip = np.array([kp[8]['x'], kp[8]['y']])
        other_tips = []
        for finger, tip_idx in self.FINGER_TIPS.items():
            if finger in ['thumb', 'index']:
                continue
            if tip_idx in kp:
                other_tips.append(np.array([kp[tip_idx]['x'], kp[tip_idx]['y']]))
        if not other_tips:
            return 0.0
        avg_dist = np.mean([np.linalg.norm(index_tip - t) for t in other_tips])
        return float(min(100, avg_dist * 300))

    def _calc_splay_symmetry(self, kp: Dict) -> float:
        abduction = self._calc_finger_abduction(kp)
        if not abduction:
            return 50.0
        values = list(abduction.values())
        if len(values) < 2:
            return 50.0
        variance = np.var(values)
        return float(max(0, 100 - variance * 10))

    def _calc_tremor(self, kp: Dict) -> float:
        if self.prev_landmarks is None:
            return 0.0
        total_movement = 0.0
        count = 0
        for finger, tip_idx in self.FINGER_TIPS.items():
            if tip_idx in kp:
                curr = np.array([kp[tip_idx]['x'], kp[tip_idx]['y']])
                for prev_hand in (self.prev_landmarks or []):
                    prev_kp = prev_hand.get('keypoints', {})
                    if tip_idx in prev_kp:
                        prev = np.array([prev_kp[tip_idx]['x'], prev_kp[tip_idx]['y']])
                        total_movement += np.linalg.norm(curr - prev)
                        count += 1
                        break
        if count == 0:
            return 0.0
        avg_movement = total_movement / count
        return float(min(100, avg_movement * 5000))

    def _calc_wrist_extension(self, kp: Dict) -> float:
        if 0 in kp and 9 in kp:
            wrist = np.array([kp[0]['x'], kp[0]['y']])
            middle_mcp = np.array([kp[9]['x'], kp[9]['y']])
            return float((middle_mcp[1] - wrist[1]) * 100)
        return 0.0

    def _calc_ulnar_deviation(self, kp: Dict) -> float:
        if 0 in kp and 5 in kp and 17 in kp:
            wrist = np.array([kp[0]['x'], kp[0]['y']])
            index = np.array([kp[5]['x'], kp[5]['y']])
            pinky = np.array([kp[17]['x'], kp[17]['y']])
            hand_center = (index + pinky) / 2
            return float((hand_center[0] - wrist[0]) * 100)
        return 0.0

    def _calc_carpal_tunnel_risk(self, kp: Dict) -> float:
        wrist_ext = abs(self._calc_wrist_extension(kp))
        ulnar = abs(self._calc_ulnar_deviation(kp))
        risk = 0.0
        if wrist_ext > 15:
            risk += (wrist_ext - 15) * 2
        if ulnar > 10:
            risk += (ulnar - 10) * 3
        flexion = self._calc_finger_flexion(kp)
        avg_flexion = np.mean(list(flexion.values())) if flexion else 0
        if avg_flexion > 30:
            risk += (avg_flexion - 30) * 0.5
        return float(min(100, risk))

    def _calc_typing_neutrality(self, kp: Dict) -> float:
        risk = self._calc_carpal_tunnel_risk(kp)
        wrist_ext = abs(self._calc_wrist_extension(kp))
        neutrality = 100 - risk * 0.7
        if wrist_ext < 10:
            neutrality += 10
        return float(max(0, min(100, neutrality)))

    def _calc_hook_grip(self, kp: Dict) -> float:
        flexion = self._calc_finger_flexion(kp)
        avg_flexion = np.mean(list(flexion.values())) if flexion else 0
        thumb_opp = self._calc_thumb_opposition(kp)
        return float(avg_flexion * 0.6 + thumb_opp * 0.4)

    def _calc_punch_alignment(self, kp: Dict) -> float:
        if 0 in kp and 5 in kp and 9 in kp:
            wrist = np.array([kp[0]['x'], kp[0]['y']])
            index_knuckle = np.array([kp[5]['x'], kp[5]['y']])
            middle_knuckle = np.array([kp[9]['x'], kp[9]['y']])
            v1 = index_knuckle - wrist
            v2 = middle_knuckle - wrist
            angle = self._angle_between(v1, v2)
            return float(max(0, 100 - angle * 2))
        return 0.0

    def _calc_trigger_control(self, kp: Dict) -> float:
        independence = self._calc_index_independence(kp)
        tremor = self._calc_tremor(kp)
        return float((independence * 0.7) + ((100 - tremor) * 0.3))

    def _calc_rom_total(self, kp: Dict) -> float:
        flexion = self._calc_finger_flexion(kp)
        extension = self._calc_finger_extension(kp)
        avg_flex = np.mean(list(flexion.values())) if flexion else 0
        avg_ext = np.mean(list(extension.values())) if extension else 0
        return float((avg_flex + avg_ext) / 2)

    def _calc_bilateral_metrics(self, hands_data: List[Dict]) -> Optional[Dict]:
        if len(hands_data) != 2:
            return None
        left = next((h for h in hands_data if h['hand'] == 'Left'), None)
        right = next((h for h in hands_data if h['hand'] == 'Right'), None)
        if not left or not right:
            return None
        lm = left['metrics']
        rm = right['metrics']
        return {
            'grip_asymmetry': abs(lm.grip_strength_pct - rm.grip_strength_pct),
            'rom_asymmetry': abs(lm.range_of_motion_total - rm.range_of_motion_total),
            'tremor_asymmetry': abs(lm.tremor_index - rm.tremor_index),
            'symmetry_score': 100 - abs(lm.grip_strength_pct - rm.grip_strength_pct) * 0.8,
        }

    def _distance(self, p1: Dict, p2: Dict) -> float:
        return float(np.sqrt((p1['x'] - p2['x']) ** 2 + (p1['y'] - p2['y']) ** 2))

    def _angle_between(self, v1: np.ndarray, v2: np.ndarray) -> float:
        dot = np.dot(v1, v2)
        norm = np.linalg.norm(v1) * np.linalg.norm(v2)
        if norm == 0:
            return 0.0
        return float(np.degrees(np.arccos(np.clip(dot / norm, -1, 1))))

    @staticmethod
    def metrics_to_dict(metrics: HandMetrics) -> Dict[str, Any]:
        payload = asdict(metrics)
        for key in ('finger_flexion', 'finger_abduction', 'finger_extension'):
            payload[key] = {k: round(float(v), 1) for k, v in payload[key].items()}
        for key in SCALAR_METRIC_KEYS:
            if key in payload:
                payload[key] = round(float(payload[key]), 1)
        return payload

    @staticmethod
    def serialize_for_export(hands_data: Optional[Dict]) -> Dict[str, Any]:
        if not hands_data:
            return {}
        export = {'hands': [], 'bilateral': hands_data.get('bilateral')}
        if export['bilateral']:
            export['bilateral'] = {
                k: round(float(v), 1) for k, v in export['bilateral'].items()
            }
        for hand in hands_data.get('hands', []):
            export['hands'].append({
                'hand': hand['hand'],
                'metrics': HandPoseEngine.metrics_to_dict(hand['metrics']),
            })
        return export

    @staticmethod
    def aggregate_sessions(all_sessions: List[Dict]) -> Dict[str, Any]:
        if not all_sessions:
            return {}

        buckets: Dict[str, List[Dict[str, Any]]] = {'Left': [], 'Right': []}
        bilateral_rows: List[Dict[str, float]] = []

        for session in all_sessions:
            if session.get('bilateral'):
                bilateral_rows.append(session['bilateral'])
            for hand in session.get('hands', []):
                label = hand.get('hand')
                if label in buckets:
                    buckets[label].append(HandPoseEngine.metrics_to_dict(hand['metrics']))

        def avg_scalar(rows: List[Dict[str, Any]], key: str) -> float:
            vals = [row[key] for row in rows if key in row and isinstance(row[key], (int, float))]
            return round(float(np.mean(vals)), 1) if vals else 0.0

        summary: Dict[str, Any] = {
            'frames_with_hands': len(all_sessions),
            'left_hand': {key: avg_scalar(buckets['Left'], key) for key in SCALAR_METRIC_KEYS},
            'right_hand': {key: avg_scalar(buckets['Right'], key) for key in SCALAR_METRIC_KEYS},
        }

        if bilateral_rows:
            summary['bilateral'] = {
                key: round(float(np.mean([row[key] for row in bilateral_rows if key in row])), 1)
                for key in bilateral_rows[0].keys()
            }

        return summary

    def draw_hands(self, frame: np.ndarray, hands_data: Dict, show_metrics: bool = True) -> np.ndarray:
        """Draw hand landmarks with metrics overlay"""
        if not hands_data:
            return frame

        overlay = frame.copy()
        h, w = frame.shape[:2]

        for hand in hands_data.get('hands', []):
            kp = hand['keypoints']
            metrics = hand['metrics']
            is_right = hand['hand'] == 'Right'
            glow = (255, 80, 0)
            color = (255, 255, 0) if is_right else (255, 100, 255)

            for connection in self.mp_hands.HAND_CONNECTIONS:
                start_idx, end_idx = connection
                if start_idx in kp and end_idx in kp:
                    pt1 = (int(kp[start_idx]['x'] * w), int(kp[start_idx]['y'] * h))
                    pt2 = (int(kp[end_idx]['x'] * w), int(kp[end_idx]['y'] * h))
                    cv2.line(overlay, pt1, pt2, glow, 5)
                    cv2.line(overlay, pt1, pt2, color, 3)
                    cv2.line(overlay, pt1, pt2, (255, 255, 255), 1)

            for idx, pos in kp.items():
                pt = (int(pos['x'] * w), int(pos['y'] * h))
                cv2.circle(overlay, pt, 6, glow, -1)
                cv2.circle(overlay, pt, 4, color, -1)
                cv2.circle(overlay, pt, 2, (255, 255, 255), -1)

            if show_metrics and metrics:
                y_pos = 30 if is_right else h - 120
                lines = [
                    f"{hand['hand']} | Grip: {metrics.grip_strength_pct:.0f}%",
                    f"Fist: {metrics.fist_closure_pct:.0f}% | Pinch: {metrics.pinch_strength_index:.0f}%",
                    f"Carpal Risk: {metrics.carpal_tunnel_risk:.0f}% | Neutral: {metrics.typing_neutrality:.0f}%",
                    f"Punch: {metrics.punch_fist_alignment:.0f}% | Tremor: {metrics.tremor_index:.0f}%",
                ]
                for line in lines:
                    cv2.putText(
                        overlay,
                        line,
                        (10, y_pos),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.4,
                        color,
                        1,
                        cv2.LINE_AA,
                    )
                    y_pos += 16

        return cv2.addWeighted(frame, 0.35, overlay, 0.65, 0)
