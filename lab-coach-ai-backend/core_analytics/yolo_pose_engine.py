import cv2
import numpy as np
import torch
from ultralytics import YOLO
from typing import Dict, List, Tuple
import colorsys

class YOLOPoseEngine:
    def __init__(self, model_size='n'):
        print(f'Loading YOLO11-{model_size}-pose...')
        self.model = YOLO(f'yolo11{model_size}-pose.pt')
        self.model.to('cuda' if torch.cuda.is_available() else 'cpu')
        
        self.KEYPOINTS = {
            0: 'nose', 1: 'left_eye', 2: 'right_eye',
            3: 'left_ear', 4: 'right_ear',
            5: 'left_shoulder', 6: 'right_shoulder',
            7: 'left_elbow', 8: 'right_elbow',
            9: 'left_wrist', 10: 'right_wrist',
            11: 'left_hip', 12: 'right_hip',
            13: 'left_knee', 14: 'right_knee',
            15: 'left_ankle', 16: 'right_ankle'
        }
        
        self.SKELETON = [
            (5,6), (5,7), (7,9), (6,8), (8,10),
            (5,11), (6,12), (11,12),
            (11,13), (13,15), (12,14), (14,16),
            (0,1), (0,2), (1,3), (2,4)
        ]
        
        self.ANGLES = {
            'left_elbow': ('left_shoulder', 'left_elbow', 'left_wrist'),
            'right_elbow': ('right_shoulder', 'right_elbow', 'right_wrist'),
            'left_knee': ('left_hip', 'left_knee', 'left_ankle'),
            'right_knee': ('right_hip', 'right_knee', 'right_ankle'),
            'left_hip': ('left_shoulder', 'left_hip', 'left_knee'),
            'right_hip': ('right_shoulder', 'right_hip', 'right_knee'),
            'left_shoulder': ('left_elbow', 'left_shoulder', 'left_hip'),
            'right_shoulder': ('right_elbow', 'right_shoulder', 'right_hip'),
            'neck_flexion': ('left_shoulder', 'nose', 'left_hip'),
            'neck_lateral': ('left_shoulder', 'nose', 'right_shoulder'),
            'forward_head': ('left_ear', 'left_shoulder', 'left_hip'),
        }

        self.previous_keypoints = None
        self.ghost_frame = None
        self.velocity_history = []

        # Glowing blue biomechanical palette (BGR)
        self.GLOW_OUTER = (255, 60, 0)
        self.GLOW_MID = (255, 150, 60)
        self.GLOW_CORE = (255, 255, 180)
        self.JOINT_OUTER = (255, 120, 20)
        self.JOINT_CORE = (255, 255, 255)
        self.NECK_LINE = (255, 255, 0)
        self.NECK_PLUMB = (255, 200, 80)

        print('Engine ready!')
    
    def process_frame(self, frame):
        results = self.model(frame, conf=0.5, verbose=False)
        if len(results) == 0 or results[0].keypoints is None:
            return None

        if results[0].keypoints.xy is None or len(results[0].keypoints.xy) == 0:
            return None

        kp = results[0].keypoints.xy[0].cpu().numpy()
        conf = results[0].keypoints.conf[0].cpu().numpy()
        
        keypoints_3d = {}
        for idx, name in self.KEYPOINTS.items():
            x, y = kp[idx]
            keypoints_3d[name] = np.array([x, y, 0.0])
        
        angles = self._calc_angles(keypoints_3d)
        neck_metrics = self._calc_neck(keypoints_3d, angles)
        ankle_metrics = self._calc_ankles(keypoints_3d, angles)
        com = self._calc_com(keypoints_3d)
        symmetry = self._calc_symmetry(angles)
        
        return {
            'keypoints_2d': kp,
            'keypoints_3d': keypoints_3d,
            'confidences': conf,
            'angles': angles,
            'neck_metrics': neck_metrics,
            'ankle_metrics': ankle_metrics,
            'center_of_mass': com,
            'symmetry': symmetry,
        }
    
    def _calc_angles(self, kp):
        angles = {}
        for name, (p1n, p2n, p3n) in self.ANGLES.items():
            if all(k in kp for k in [p1n, p2n, p3n]):
                v1 = kp[p1n] - kp[p2n]
                v2 = kp[p3n] - kp[p2n]
                cos = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
                angles[name] = float(np.degrees(np.arccos(np.clip(cos, -1, 1))))
        return angles
    
    def _calc_com(self, kp):
        if 'left_hip' in kp and 'right_hip' in kp:
            mid_hip = (kp['left_hip'] + kp['right_hip']) / 2
        else:
            mid_hip = np.zeros(3)
        if 'left_shoulder' in kp and 'right_shoulder' in kp:
            mid_shoulder = (kp['left_shoulder'] + kp['right_shoulder']) / 2
        else:
            mid_shoulder = np.zeros(3)
        com = (mid_hip + mid_shoulder) / 2
        return {'x': float(com[0]), 'y': float(com[1]), 'z': float(com[2])}
    
    def _calc_symmetry(self, angles):
        pairs = [('left_elbow','right_elbow'), ('left_knee','right_knee'), ('left_hip','right_hip')]
        scores = []
        for l, r in pairs:
            if l in angles and r in angles:
                diff = abs(angles[l] - angles[r])
                scores.append(max(0, 100 - diff * 2))
        return {'overall': float(np.mean(scores)) if scores else 100.0}

    def _calc_neck(self, kp, angles):
        """Calculate bilateral neck metrics"""
        metrics = {}

        # Forward head posture - BOTH sides
        for side, ear_key, shoulder_key in [
            ('left', 'left_ear', 'left_shoulder'),
            ('right', 'right_ear', 'right_shoulder'),
        ]:
            if ear_key in kp and shoulder_key in kp:
                ear_x = kp[ear_key][0]
                shoulder_x = kp[shoulder_key][0]
                metrics[f'{side}_forward_head_mm'] = float(abs(ear_x - shoulder_x))
                metrics[f'{side}_forward_head_score'] = max(
                    0, 100 - metrics[f'{side}_forward_head_mm'] * 2
                )

        # Average forward head score
        left_score = metrics.get('left_forward_head_score', 50)
        right_score = metrics.get('right_forward_head_score', 50)
        metrics['forward_head_score'] = (left_score + right_score) / 2
        metrics['forward_head_asymmetry'] = abs(left_score - right_score)

        # Neck flexion angle (uses nose relative to shoulders)
        if 'neck_flexion' in angles:
            metrics['neck_flexion_angle'] = angles['neck_flexion']
            metrics['neck_flexion_score'] = max(0, 100 - abs(angles['neck_flexion'] - 0) * 2)

        # Neck lateral flexion - BOTH sides
        for side, ear, shoulder in [
            ('left', 'left_ear', 'left_shoulder'),
            ('right', 'right_ear', 'right_shoulder'),
        ]:
            if ear in kp and shoulder in kp:
                ear_y = kp[ear][1]
                shoulder_y = kp[shoulder][1]
                # Vertical difference indicates lateral tilt
                tilt = float(ear_y - shoulder_y)
                metrics[f'{side}_lateral_tilt_mm'] = tilt
                # Score: 0 tilt = 100, more tilt = lower score
                metrics[f'{side}_lateral_score'] = max(0, 100 - abs(tilt) * 1.5)

        # Neck rotation symmetry (ear-to-nose ratio)
        if 'left_ear' in kp and 'right_ear' in kp and 'nose' in kp:
            left_dist = abs(kp['left_ear'][0] - kp['nose'][0])
            right_dist = abs(kp['right_ear'][0] - kp['nose'][0])
            if (left_dist + right_dist) > 0:
                metrics['neck_rotation_symmetry'] = max(0, 100 - abs(left_dist - right_dist) * 3)

        # Cervical spine alignment score
        alignment_scores = [
            metrics.get('forward_head_score', 50),
            metrics.get('neck_flexion_score', 50),
            metrics.get('neck_rotation_symmetry', 50),
        ]
        metrics['cervical_alignment_score'] = sum(alignment_scores) / len(alignment_scores)

        return metrics

    def _calc_ankles(self, kp, angles):
        """Calculate ankle and foot stability metrics"""
        metrics = {}

        # Ankle angles from the existing angle calculations
        for side in ['left', 'right']:
            ankle_key = f'{side}_ankle'
            knee_key = f'{side}_knee'
            hip_key = f'{side}_hip'

            # Ankle dorsiflexion (foot-to-shin angle)
            if ankle_key in kp and knee_key in kp:
                # Calculate ankle position relative to knee
                ankle_pos = kp[ankle_key]
                knee_pos = kp[knee_key]

                # Vertical alignment (ankle should be under knee for stability)
                horizontal_offset = float(abs(ankle_pos[0] - knee_pos[0]))
                metrics[f'{side}_ankle_offset_mm'] = horizontal_offset
                metrics[f'{side}_ankle_alignment_score'] = max(0, 100 - horizontal_offset * 1.5)

                # Ankle height ratio (foot flatness indicator)
                if hip_key in kp:
                    leg_length = float(np.linalg.norm(kp[hip_key][:2] - kp[ankle_key][:2]))
                    if leg_length > 0:
                        metrics[f'{side}_ankle_height_ratio'] = float(ankle_pos[1] / leg_length)

        # Bilateral ankle symmetry
        if 'left_ankle' in kp and 'right_ankle' in kp:
            left_y = kp['left_ankle'][1]
            right_y = kp['right_ankle'][1]
            metrics['ankle_height_symmetry'] = max(0, 100 - abs(left_y - right_y) * 2)

            # Weight distribution (based on ankle position symmetry)
            left_x = kp['left_ankle'][0]
            right_x = kp['right_ankle'][0]

            # Find body center
            if 'left_hip' in kp and 'right_hip' in kp:
                center_x = (kp['left_hip'][0] + kp['right_hip'][0]) / 2
                left_weight = abs(left_x - center_x)
                right_weight = abs(right_x - center_x)
                total = left_weight + right_weight
                if total > 0:
                    metrics['weight_distribution_left'] = float(left_weight / total * 100)
                    metrics['weight_distribution_right'] = float(right_weight / total * 100)
                    metrics['weight_symmetry_score'] = max(
                        0,
                        100 - abs(metrics['weight_distribution_left'] - 50) * 2,
                    )

        # Foot stability composite
        stability_scores = []
        for side in ['left', 'right']:
            score = metrics.get(f'{side}_ankle_alignment_score', 50)
            stability_scores.append(score)

        metrics['foot_stability_score'] = (
            sum(stability_scores) / len(stability_scores) if stability_scores else 50
        )

        # Pronation/Supination indicator (ankle roll)
        for side, ankle, knee in [
            ('left', 'left_ankle', 'left_knee'),
            ('right', 'right_ankle', 'right_knee'),
        ]:
            if ankle in kp and knee in kp:
                ankle_x = kp[ankle][0]
                knee_x = kp[knee][0]
                # If ankle is outside knee = pronation, inside = supination
                roll = float(ankle_x - knee_x)
                metrics[f'{side}_ankle_roll_mm'] = roll
                metrics[f'{side}_pronation_score'] = max(0, 100 - abs(roll) * 2)

        return metrics

    def _draw_neck_vectors(self, overlay, data):
        """Cervical plumb line + forward-head vector overlay."""
        kp = data.get('keypoints_3d', {})
        conf = data.get('confidences', [])
        h, w = overlay.shape[:2]

        left_sh = kp.get('left_shoulder')
        right_sh = kp.get('right_shoulder')
        nose = kp.get('nose')
        left_ear = kp.get('left_ear')
        right_ear = kp.get('right_ear')
        left_hip = kp.get('left_hip')

        if left_sh is not None and right_sh is not None:
            mid_sh = ((left_sh[:2] + right_sh[:2]) / 2).astype(int)
            plumb_top = (int(mid_sh[0]), max(20, int(mid_sh[1]) - 120))
            plumb_bot = (int(mid_sh[0]), min(h - 20, int(mid_sh[1]) + 160))
            cv2.line(overlay, plumb_top, plumb_bot, self.NECK_PLUMB, 1, cv2.LINE_AA)
            cv2.putText(
                overlay,
                'CERVICAL PLUMB',
                (plumb_top[0] + 8, plumb_top[1] + 14),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.4,
                self.NECK_PLUMB,
                1,
                cv2.LINE_AA,
            )

        # Forward-head displacement vector (profile ear → shoulder)
        if left_ear is not None and left_sh is not None and conf[3] > 0.45 and conf[5] > 0.45:
            ear_pt = tuple(left_ear[:2].astype(int))
            sh_pt = tuple(left_sh[:2].astype(int))
            cv2.arrowedLine(overlay, sh_pt, ear_pt, self.NECK_LINE, 2, tipLength=0.25)
            cv2.putText(
                overlay,
                'FHP',
                (ear_pt[0] + 6, ear_pt[1] - 6),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                self.NECK_LINE,
                1,
                cv2.LINE_AA,
            )

        # Neck flexion guide: nose → mid-shoulder → mid-hip
        if nose is not None and left_sh is not None and right_sh is not None:
            mid_sh = ((left_sh[:2] + right_sh[:2]) / 2).astype(int)
            nose_pt = tuple(nose[:2].astype(int))
            cv2.line(overlay, nose_pt, tuple(mid_sh), self.GLOW_CORE, 2, cv2.LINE_AA)
            if left_hip is not None and conf[0] > 0.45:
                hip_pt = tuple(left_hip[:2].astype(int))
                cv2.line(overlay, tuple(mid_sh), hip_pt, self.GLOW_MID, 2, cv2.LINE_AA)

        if 'neck_metrics' in data:
            nm = data['neck_metrics']
            hud_x = max(10, w - 240)
            y = 28
            cv2.putText(
                overlay,
                'NECK TELEMETRY',
                (hud_x, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                self.NECK_LINE,
                1,
                cv2.LINE_AA,
            )
            y += 18
            for key in (
                'forward_head_score',
                'forward_head_asymmetry',
                'left_forward_head_score',
                'right_forward_head_score',
                'neck_flexion_angle',
                'left_lateral_score',
                'right_lateral_score',
                'neck_rotation_symmetry',
                'cervical_alignment_score',
            ):
                if key not in nm:
                    continue
                val = nm[key]
                if 'score' in key:
                    color = (0, 255, 0) if val > 70 else (0, 255, 255) if val > 40 else (0, 0, 255)
                    text = f'{key}: {val:.0f}'
                else:
                    color = self.NECK_LINE
                    text = f'{key}: {val:.1f}'
                cv2.putText(
                    overlay, text, (hud_x, y), cv2.FONT_HERSHEY_SIMPLEX, 0.42, color, 1, cv2.LINE_AA
                )
                y += 16

    # ============================================
    # PROGRESS GHOST, STABILITY HALO, POWER METER
    # ============================================

    def _draw_progress_ghost(self, overlay, data, alpha=0.35):
        """Draw translucent ghost of previous session for comparison"""
        if self.ghost_frame is not None:
            ghost = self.ghost_frame.copy()
            # Tint ghost blue
            ghost[:, :, 0] = 200  # Blue tint
            ghost[:, :, 1] = 150
            return cv2.addWeighted(overlay, 1 - alpha, ghost, alpha, 0)
        return overlay

    def capture_ghost(self, data):
        """Store current keypoints as ghost for future comparison"""
        if data and 'keypoints_3d' in data:
            self.previous_keypoints = {
                k: v.copy() for k, v in data['keypoints_3d'].items()
            }
        else:
            self.previous_keypoints = None

    def save_ghost(self, filepath='ghost.npy'):
        """Save current keypoints as ghost file"""
        if self.previous_keypoints:
            np.save(filepath, self.previous_keypoints)
            print(f'Ghost saved to {filepath}')

    def load_ghost(self, filepath='ghost.npy'):
        """Load ghost from file for comparison overlay"""
        import os
        if os.path.exists(filepath):
            self.previous_keypoints = np.load(filepath, allow_pickle=True).item()
            print(f'Ghost loaded from {filepath}')

    def _draw_stability_halo(self, overlay, data):
        """Draw glowing ring around center of mass - size = stability"""
        com = data.get('center_of_mass', {})
        symmetry = data.get('symmetry', {}).get('overall', 50)

        if 'x' in com and 'y' in com:
            cx, cy = int(com['x']), int(com['y'])

            # Stability score: 0 = unstable (big ring), 100 = rock solid (small ring)
            stability = min(100, symmetry)
            radius = int(80 - stability * 0.6)  # 80px unstable → 20px stable

            # Color: green (stable) → yellow → red (unstable)
            if stability > 70:
                color = (0, 255, 0)  # Green
            elif stability > 40:
                color = (0, 255, 255)  # Yellow
            else:
                color = (0, 0, 255)  # Red

            # Glow effect (multiple rings)
            for r in [radius + 10, radius + 5, radius]:
                cv2.circle(overlay, (cx, cy), r, color, 2)

            # Crosshair at CoM
            cv2.line(overlay, (cx - 15, cy), (cx + 15, cy), color, 1)
            cv2.line(overlay, (cx, cy - 15), (cx, cy + 15), color, 1)

            # Stability label
            cv2.putText(
                overlay,
                f'STABILITY: {stability:.0f}%',
                (cx - 60, cy - radius - 15),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                color,
                2,
            )

    def _draw_power_meter(self, overlay, data):
        """Track velocity of key joints for power output"""
        kp = data.get('keypoints_3d', {})

        if self.previous_keypoints is None:
            self.previous_keypoints = kp
            return

        # Calculate velocity of wrists (for strikes) and ankles (for kicks)
        velocities = {}

        for joint in ['left_wrist', 'right_wrist', 'left_ankle', 'right_ankle']:
            if joint in kp and joint in self.previous_keypoints:
                curr = kp[joint][:2]
                prev = self.previous_keypoints[joint][:2]
                vel = np.linalg.norm(curr - prev)
                velocities[joint] = vel

        self.previous_keypoints = kp
        self.velocity_history.append(velocities)
        if len(self.velocity_history) > 30:
            self.velocity_history.pop(0)

        # Find max velocity in recent history
        if velocities:
            hist_maxes = [max(v.values()) for v in self.velocity_history if v]
            max_vel = max(hist_maxes) if hist_maxes else 1
            current_max = max(velocities.values()) if velocities else 1
            power_pct = min(100, (current_max / max_vel) * 100) if max_vel > 0 else 0

            # Draw power meter bar (right side of screen)
            h, w = overlay.shape[:2]
            bar_x = w - 60
            bar_height = 200
            bar_y = int(h / 2 - bar_height / 2)

            # Background
            cv2.rectangle(overlay, (bar_x, bar_y), (bar_x + 30, bar_y + bar_height), (40, 40, 40), -1)
            cv2.rectangle(overlay, (bar_x, bar_y), (bar_x + 30, bar_y + bar_height), (100, 100, 100), 1)

            # Fill based on power
            fill_height = int(bar_height * power_pct / 100)
            fill_color = (
                (0, 255, 255) if power_pct > 70 else (0, 200, 0) if power_pct > 30 else (0, 100, 255)
            )
            cv2.rectangle(
                overlay,
                (bar_x, bar_y + bar_height - fill_height),
                (bar_x + 30, bar_y + bar_height),
                fill_color,
                -1,
            )

            # Label
            cv2.putText(overlay, 'POWER', (bar_x - 10, bar_y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            cv2.putText(overlay, f'{power_pct:.0f}%', (bar_x - 5, bar_y + bar_height + 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, fill_color, 1)

    def draw_skeleton(self, frame, data):
        overlay = frame.copy()
        kp = data['keypoints_2d']
        conf = data['confidences']
        angles = data.get('angles', {})
        
        # Draw glowing skeleton (blue biomechanical mesh)
        for start, end in self.SKELETON:
            if conf[start] > 0.5 and conf[end] > 0.5:
                pt1 = tuple(kp[start].astype(int))
                pt2 = tuple(kp[end].astype(int))
                cv2.line(overlay, pt1, pt2, self.GLOW_OUTER, 7)
                cv2.line(overlay, pt1, pt2, self.GLOW_MID, 4)
                cv2.line(overlay, pt1, pt2, self.GLOW_CORE, 2)

        # Draw joints
        for i, (x, y) in enumerate(kp):
            if conf[i] > 0.5:
                cv2.circle(overlay, (int(x), int(y)), 9, self.JOINT_OUTER, -1)
                cv2.circle(overlay, (int(x), int(y)), 5, self.GLOW_CORE, -1)
                cv2.circle(overlay, (int(x), int(y)), 2, self.JOINT_CORE, -1)

        # Cervical plumb + forward-head vectors (+ neck telemetry HUD)
        self._draw_neck_vectors(overlay, data)

        h = overlay.shape[0]
        if 'ankle_metrics' in data:
            am = data['ankle_metrics']
            y = h - 100  # Bottom left of screen

            # Draw ankle stability score prominently
            stability = am.get('foot_stability_score', 50)
            color = (0, 255, 0) if stability > 70 else (0, 255, 255) if stability > 40 else (0, 0, 255)
            cv2.putText(
                overlay,
                f'FOOT STABILITY: {stability:.0f}%',
                (10, y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                color,
                2,
            )
            y += 20

            # Weight distribution
            if 'weight_distribution_left' in am:
                left_wt = am['weight_distribution_left']
                right_wt = am['weight_distribution_right']
                cv2.putText(
                    overlay,
                    f'Weight: L:{left_wt:.0f}% R:{right_wt:.0f}%',
                    (10, y),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.45,
                    (0, 255, 255),
                    1,
                )
                y += 18

            # Ankle alignment for each side
            for side in ['left', 'right']:
                score = am.get(f'{side}_ankle_alignment_score', 50)
                pronation = am.get(f'{side}_pronation_score', 50)
                color = (0, 255, 0) if score > 70 else (0, 255, 255) if score > 40 else (0, 0, 255)
                cv2.putText(
                    overlay,
                    f'{side}: align={score:.0f}% pron={pronation:.0f}%',
                    (10, y),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.4,
                    color,
                    1,
                )
                y += 16

        # Draw angles
        for name, (p1n, p2n, p3n) in self.ANGLES.items():
            if name in angles and p2n in data['keypoints_3d']:
                pos = data['keypoints_3d'][p2n]
                text = f"{angles[name]:.0f}°"
                cv2.putText(
                    overlay,
                    text,
                    (int(pos[0]) + 15, int(pos[1]) - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    self.GLOW_CORE,
                    2,
                    cv2.LINE_AA,
                )

        # Apply progress ghost
        overlay = self._draw_progress_ghost(overlay, data)

        # Draw stability halo
        self._draw_stability_halo(overlay, data)

        # Draw power meter
        self._draw_power_meter(overlay, data)

        return cv2.addWeighted(frame, 0.35, overlay, 0.65, 0)

print('YOLOPoseEngine class ready - import to use')
