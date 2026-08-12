"""
Life Longevity - YOLO Live Stream Server
Powered by DeepSeek Master Data Coach
"""
import asyncio
import json
import base64
import cv2
import numpy as np
import sys
import tempfile
import os
import shutil
import time
from pathlib import Path
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, WebSocket, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from core_analytics.yolo_pose_engine import YOLOPoseEngine
from core_analytics.yolo_exporter import export_for_dashboard
from core_analytics.hand_pose_engine import HandPoseEngine
from core_analytics.ai_coach_gideon import GideonAICoach

app = FastAPI(title="Life Longevity YOLO Stream")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Initialize engines
body = YOLOPoseEngine('n')
hand_engine = HandPoseEngine()

gideon = GideonAICoach()

latest_results = {}

CAMERA_WAKE_ATTEMPTS = 5
CAMERA_WAKE_DELAY_SEC = 0.5
CAMERA_SLEEP_WARNING = (
    "S26 link asleep. Please unlock your phone screen or open the Windows Camera app to wake the device."
)


@dataclass
class CameraInitResult:
    cap: Optional[cv2.VideoCapture] = None
    ok: bool = False
    sleep_warning: bool = False
    message: str = ""


def _safe_release_capture(cap) -> None:
    if cap is None:
        return
    try:
        cap.release()
    except Exception:
        pass


def _wake_directshow_properties(cap: cv2.VideoCapture) -> None:
    """Force DirectShow to query frame properties and wake tethered virtual cameras."""
    try:
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        cap.set(cv2.CAP_PROP_FPS, 30)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        cap.set(cv2.CAP_PROP_AUTOFOCUS, 0)
        # Read properties back — forces Windows to handshake with the driver
        cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        cap.get(cv2.CAP_PROP_FPS)
        cap.get(cv2.CAP_PROP_BUFFERSIZE)
    except Exception:
        pass


def _try_open_capture_once(camera_index: int) -> Optional[cv2.VideoCapture]:
    """Single open attempt — DirectShow first on Windows."""
    cap = None
    try:
        if sys.platform == "win32":
            cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
            if not cap.isOpened():
                _safe_release_capture(cap)
                cap = cv2.VideoCapture(camera_index, cv2.CAP_ANY)
        else:
            cap = cv2.VideoCapture(camera_index)

        if cap is None or not cap.isOpened():
            _safe_release_capture(cap)
            return None

        _wake_directshow_properties(cap)
        return cap
    except Exception:
        _safe_release_capture(cap)
        return None


def _read_test_frame(cap: cv2.VideoCapture, attempts: int = 3) -> Tuple[bool, Optional[np.ndarray]]:
    for _ in range(attempts):
        try:
            ret, frame = cap.read()
            if ret and frame is not None and getattr(frame, "size", 0) > 0:
                return True, frame
        except Exception:
            pass
        time.sleep(0.1)
    return False, None


def _initialize_camera_capture(camera_index: int) -> CameraInitResult:
    """Robust hardware init — retry wake up to 5 times with 500ms delay between attempts."""
    for attempt in range(CAMERA_WAKE_ATTEMPTS):
        cap = _try_open_capture_once(camera_index)
        if cap is None:
            if attempt < CAMERA_WAKE_ATTEMPTS - 1:
                time.sleep(CAMERA_WAKE_DELAY_SEC)
            continue

        readable, _ = _read_test_frame(cap, attempts=4)
        if readable:
            return CameraInitResult(cap=cap, ok=True)

        _safe_release_capture(cap)
        if attempt < CAMERA_WAKE_ATTEMPTS - 1:
            time.sleep(CAMERA_WAKE_DELAY_SEC)

    if camera_index in (0, 1):
        return CameraInitResult(
            ok=False,
            sleep_warning=True,
            message=CAMERA_SLEEP_WARNING,
        )

    return CameraInitResult(
        ok=False,
        message=(
            f"Could not open camera index {camera_index}. "
            "Try Secondary Camera Feed (index 1) if your phone is tethered as a webcam, "
            "or Built-in Webcam (index 0) when the laptop camera is primary."
        ),
    )


def _open_camera_index(camera_index: int) -> cv2.VideoCapture:
    """Legacy synchronous open — prefer _initialize_camera_capture for live streams."""
    result = _initialize_camera_capture(camera_index)
    if result.ok and result.cap is not None:
        return result.cap
    return cv2.VideoCapture(camera_index)


def _aggregate_numeric_dict(rows, key: str) -> Dict:
    totals = {}
    counts = {}
    for row in rows:
        block = row.get(key) or {}
        for metric, value in block.items():
            if not isinstance(value, (int, float)):
                continue
            totals[metric] = totals.get(metric, 0.0) + float(value)
            counts[metric] = counts.get(metric, 0) + 1
    return {metric: totals[metric] / counts[metric] for metric in totals}


def annotate_biomechanical_frame(frame, pose_data):
    """Composite YOLO skeleton + HandPoseEngine mesh for live/upload paths."""
    annotated = frame.copy()
    hand_data = hand_engine.process_frame(frame)

    if pose_data:
        annotated = body.draw_skeleton(annotated, pose_data)

    if hand_data:
        annotated = hand_engine.draw_hands(annotated, hand_data)

    return annotated, hand_data

@app.get("/api/yolo/health")
async def health():
    return {"status": "streaming", "engine": "DeepSeek Master Data Coach"}

@app.get("/api/yolo/results/latest")
async def get_latest_results():
    return latest_results


def _trim_video_sync(input_path: str, output_path: str, start_time: float, end_time: float) -> float:
    """Crop video to [start_time, end_time] using MoviePy (blocking — run in thread)."""
    from moviepy import VideoFileClip

    clip = VideoFileClip(input_path)
    try:
        duration = float(clip.duration or 0)
        if duration <= 0:
            raise ValueError("Could not read video duration")

        start = max(0.0, min(float(start_time), duration - 0.1))
        end = max(start + 0.1, min(float(end_time), duration))

        trimmed = clip.subclipped(start, end)
        try:
            trimmed.write_videofile(
                output_path,
                codec="libx264",
                audio=False,
                preset="ultrafast",
                logger=None,
                ffmpeg_params=["-crf", "28"],
            )
        finally:
            trimmed.close()

        return end - start
    finally:
        clip.close()


@app.post("/api/yolo/trim-video")
async def trim_video_file(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    start_time: float = Form(0),
    end_time: float = Form(...),
):
    """Trim an uploaded clip before YOLO processing to keep payloads light."""
    temp_dir = tempfile.mkdtemp(prefix="yolo_trim_")
    input_path = os.path.join(temp_dir, video.filename or "upload.mp4")
    output_path = os.path.join(temp_dir, "trimmed.mp4")

    try:
        content = await video.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty video upload")

        with open(input_path, "wb") as f:
            f.write(content)

        await asyncio.to_thread(_trim_video_sync, input_path, output_path, start_time, end_time)

        if not os.path.isfile(output_path):
            raise HTTPException(status_code=500, detail="Trimmed video was not created")

        background_tasks.add_task(shutil.rmtree, temp_dir, True)

        safe_name = (video.filename or "clip.mp4").rsplit(".", 1)[0]
        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename=f"{safe_name}_trim.mp4",
        )
    except HTTPException:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Video trim failed: {exc}") from exc


@app.post("/api/yolo/process-video")
async def process_video_file(
    video: UploadFile = File(...),
    return_annotated_frames: str = Form("false"),
):
    """Process a pre-recorded video through YOLO and return biomechanics data"""
    global latest_results

    want_frames = str(return_annotated_frames).lower() in ("true", "1", "yes")

    # Save uploaded video to temp file
    temp_dir = tempfile.mkdtemp()
    video_path = os.path.join(temp_dir, video.filename or "upload.mp4")

    with open(video_path, "wb") as f:
        content = await video.read()
        f.write(content)

    # Process video
    cap = cv2.VideoCapture(video_path)
    all_data = []
    annotated_frames = []
    all_hand_sessions = []
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % 5 == 0:  # Process every 5th frame for speed
            data = body.process_frame(frame)
            if data:
                annotated, hand_data = annotate_biomechanical_frame(frame, data)
                if hand_data:
                    data['hand_metrics'] = HandPoseEngine.serialize_for_export(hand_data)
                    all_hand_sessions.append(hand_data)

                all_data.append(data)
                if want_frames and len(annotated_frames) < 12:
                    ok, buffer = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
                    if ok:
                        annotated_frames.append(base64.b64encode(buffer).decode())

        frame_count += 1

    cap.release()

    # Clean up temp file
    try:
        os.remove(video_path)
        os.rmdir(temp_dir)
    except:
        pass

    if not all_data:
        return {"error": "No pose detected in video"}

    # Aggregate results
    avg_angles = {}
    for d in all_data:
        for k, v in d.get('angles', {}).items():
            avg_angles[k] = avg_angles.get(k, 0) + v

    for k in avg_angles:
        avg_angles[k] /= len(all_data)

    # Use the last frame's structure but with averaged angles + neck metrics
    result = all_data[-1].copy()
    result['angles'] = avg_angles
    result['neck_metrics'] = _aggregate_numeric_dict(all_data, 'neck_metrics')
    result['ankle_metrics'] = _aggregate_numeric_dict(all_data, 'ankle_metrics')
    result['hand_metrics'] = HandPoseEngine.aggregate_sessions(all_hand_sessions)

    # Export to dashboard format
    dashboard_json = export_for_dashboard(result)
    dashboard_json['frames_analyzed'] = len(all_data)
    dashboard_json['total_frames'] = frame_count
    if want_frames:
        dashboard_json['annotated_frames'] = annotated_frames

    latest_results = dashboard_json
    return dashboard_json

@app.get("/api/camera/sources")
async def list_cameras():
    """Hardware camera slots — index 0 default; tethered phone often registers as index 1."""
    return {
        "sources": [
            {"id": 0, "name": "Built-in Webcam", "camera_index": 0},
            {"id": 1, "name": "Secondary Camera Feed", "camera_index": 1},
        ]
    }


@app.get("/api/camera/probe")
async def probe_camera(camera_index: int = 0):
    """Test whether an OpenCV camera index opens and returns a frame."""
    if camera_index < 0 or camera_index > 9:
        raise HTTPException(status_code=400, detail="camera_index must be 0–9")

    def _probe_sync():
        result = _initialize_camera_capture(camera_index)
        if result.ok:
            _safe_release_capture(result.cap)
            return {
                "camera_index": camera_index,
                "available": True,
                "opened": True,
            }

        payload = {
            "camera_index": camera_index,
            "available": False,
            "opened": False,
            "message": result.message,
        }
        if result.sleep_warning:
            payload["status"] = "camera_sleep_warning"
        return payload

    try:
        return await asyncio.wait_for(asyncio.to_thread(_probe_sync), timeout=12.0)
    except asyncio.TimeoutError:
        return {
            "camera_index": camera_index,
            "available": False,
            "opened": False,
            "message": "Camera probe timed out — device may be in use by another app.",
        }


async def _init_camera_async(camera_index: int) -> CameraInitResult:
    return await asyncio.to_thread(_initialize_camera_capture, camera_index)


async def _send_camera_failure(websocket: WebSocket, camera_index: int, result: CameraInitResult) -> None:
    if result.sleep_warning:
        await websocket.send_json({
            "status": "camera_sleep_warning",
            "camera_index": camera_index,
            "message": result.message or CAMERA_SLEEP_WARNING,
        })
        return

    await websocket.send_json({
        "error": "camera_unavailable",
        "camera_index": camera_index,
        "message": result.message or f"Could not open camera index {camera_index}.",
    })


# Live stream WebSocket — camera_index locks OpenCV to a specific hardware device
@app.websocket("/ws/yolo-stream")
async def yolo_stream(websocket: WebSocket):
    await websocket.accept()

    camera_index = _parse_camera_index(websocket.query_params.get("camera_index"))
    if websocket.query_params.get("camera_index") is None and websocket.query_params.get("source") is not None:
        raw = websocket.query_params.get("source")
        if raw.isdigit():
            camera_index = _parse_camera_index(raw)

    init_result = await _init_camera_async(camera_index)
    if not init_result.ok:
        await _send_camera_failure(websocket, camera_index, init_result)
        return

    cap = init_result.cap
    global latest_results
    consecutive_read_failures = 0
    MAX_READ_FAILURES = 60

    try:
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.001)
                payload = json.loads(msg)
                new_index = None
                if "camera_index" in payload:
                    new_index = _parse_camera_index(payload["camera_index"])
                elif "camera_source" in payload or "source" in payload:
                    raw = payload.get("camera_source", payload.get("source"))
                    new_index = _parse_camera_index(raw)

                if new_index is not None and new_index != camera_index:
                    _safe_release_capture(cap)
                    cap = None
                    camera_index = new_index
                    switch_result = await _init_camera_async(camera_index)
                    if not switch_result.ok:
                        await _send_camera_failure(websocket, camera_index, switch_result)
                        break
                    cap = switch_result.cap
                    consecutive_read_failures = 0
            except (asyncio.TimeoutError, json.JSONDecodeError):
                pass
            except Exception:
                break

            try:
                ret, frame = cap.read()
            except Exception:
                ret, frame = False, None

            if not ret or frame is None or getattr(frame, "size", 0) == 0:
                consecutive_read_failures += 1
                if consecutive_read_failures >= MAX_READ_FAILURES:
                    await websocket.send_json({
                        "status": "camera_sleep_warning",
                        "camera_index": camera_index,
                        "message": CAMERA_SLEEP_WARNING,
                    })
                    break
                await asyncio.sleep(0.05)
                continue

            consecutive_read_failures = 0

            try:
                data = body.process_frame(frame)
                if data:
                    frame, hand_data = annotate_biomechanical_frame(frame, data)
                    if hand_data:
                        data["hand_metrics"] = HandPoseEngine.serialize_for_export(hand_data)
                    latest_results = export_for_dashboard(data)

                _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_b64 = base64.b64encode(buffer).decode()

                await websocket.send_json({
                    "frame": frame_b64,
                    "metrics": {
                        "efficiency": latest_results.get("enhanced_metrics", {}).get("energy_analysis", {}).get("total_efficiency", 0),
                        "symmetry": latest_results.get("scores", {}).get("symmetry_score", 0),
                        "grade": latest_results.get("header", {}).get("grade", "N/A"),
                    },
                    "camera_index": camera_index,
                })
            except Exception:
                consecutive_read_failures += 1
                if consecutive_read_failures >= MAX_READ_FAILURES:
                    await websocket.send_json({
                        "status": "camera_sleep_warning",
                        "camera_index": camera_index,
                        "message": CAMERA_SLEEP_WARNING,
                    })
                    break
                await asyncio.sleep(0.05)
                continue

            await asyncio.sleep(0.03)

    except Exception:
        pass
    finally:
        _safe_release_capture(cap)


def _parse_camera_index(value) -> int:
    """Normalize camera index from query params or WebSocket payloads."""
    if value is None:
        return 0
    if isinstance(value, int):
        return max(0, min(value, 9))
    if isinstance(value, str) and value.isdigit():
        return max(0, min(int(value), 9))
    return 0


def _open_camera(source):
    """Legacy helper — numeric index only (URLs deprecated for live lab)."""
    if isinstance(source, str) and source.isdigit():
        source = int(source)
    if isinstance(source, int):
        return _open_camera_index(source)
    cap = cv2.VideoCapture(source)
    return cap


@app.get("/api/coach/list")
async def list_coaches():
    return {"coaches": gideon.list_coaches()}

@app.post("/api/coach/switch")
async def switch_coach(request: dict):
    coach_name = request.get("coach_name", "Coach Kai")
    greeting = gideon.set_coach(coach_name)
    return {"coach": coach_name, "greeting": greeting}

@app.post("/api/coach/analyze")
async def coach_analyze(request: dict):
    """Generate AI coach analysis from YOLO data"""
    yolo_data = request.get("yolo_data", latest_results)
    context = request.get("context", "general")
    analysis = gideon.analyze_biomechanics(yolo_data, context)
    return {"analysis": analysis, "coach": gideon.active_coach}

@app.post("/api/coach/ask")
async def coach_ask(request: dict):
    """Ask Gideon a question about the data"""
    question = request.get("question", "")
    yolo_data = request.get("yolo_data", latest_results)
    answer = gideon.answer_question(question, yolo_data)
    return {"answer": answer, "coach": gideon.active_coach}

@app.get("/api/assessments/list")
async def list_assessments():
    """Return available assessments from rubrics"""
    rubrics_path = Path(__file__).parent / 'core_analytics' / 'rubrics.json'
    if rubrics_path.exists():
        rubrics = json.loads(rubrics_path.read_text())
        return {"assessments": [{"id": a["test_id"], "name": a["name"]} for a in rubrics.get("assessments", [])]}
    return {"assessments": []}

@app.post("/api/assessments/score")
async def score_assessment(request: dict):
    """Score current YOLO data against a specific assessment rubric"""
    test_id = request.get("test_id", "LL001")
    yolo_data = request.get("yolo_data", latest_results)
    
    rubrics_path = Path(__file__).parent / 'core_analytics' / 'rubrics.json'
    if rubrics_path.exists():
        rubrics = json.loads(rubrics_path.read_text())
        test = next((a for a in rubrics.get("assessments", []) if a["test_id"] == test_id), None)
        if test:
            scores = {}
            for rule in test.get("scoring_rules", []):
                metric = rule["metric"]
                # Map rubric metrics to our angle data
                value = _extract_metric_from_yolo(metric, yolo_data)
                thresholds = rule["thresholds"]
                weight = rule["weight"]
                
                score = 0
                for cat in ["excellent", "good", "fair", "poor"]:
                    t = thresholds[cat]
                    if t["min"] <= value <= t["max"]:
                        score = rule["scoring"][cat]
                        break
                
                scores[metric] = {"value": value, "score": score, "weighted": score * weight}
            
            overall = sum(s["weighted"] for s in scores.values())
            return {"test_id": test_id, "test_name": test["name"], "overall_score": round(overall, 1), "rule_scores": scores}
    
    return {"error": "Assessment not found"}

def _extract_metric_from_yolo(metric: str, yolo_data: Dict) -> float:
    """Map rubric metric names to YOLO angle data"""
    angles = yolo_data.get("angles", {})
    neck = yolo_data.get("neck_metrics", {})
    symmetry = yolo_data.get("symmetry", {})
    
    mapping = {
        "cervical_flexion_rom": lambda: neck.get("neck_flexion_angle", 40),
        "cervical_extension_rom": lambda: 180 - neck.get("neck_flexion_angle", 40),
        "forward_head_displacement": lambda: (
            (neck.get("left_forward_head_mm", 0) + neck.get("right_forward_head_mm", 0)) / 2
            if "left_forward_head_mm" in neck or "right_forward_head_mm" in neck
            else neck.get("forward_head_mm", 5)
        ),
        "lateral_flexion_symmetry": lambda: (
            (neck.get("left_lateral_score", 50) + neck.get("right_lateral_score", 50)) / 2
            if "left_lateral_score" in neck or "right_lateral_score" in neck
            else neck.get("neck_lateral_score", 80)
        ),
        "lumbar_extension_rom": lambda: angles.get("left_hip", 170) if angles.get("left_hip", 0) > 0 else 25,
        "thoracic_rotation_rom": lambda: abs(angles.get("left_shoulder", 10) - angles.get("right_shoulder", 10)),
        "rotation_symmetry": lambda: symmetry.get("overall", 85),
        "knee_valgus_angle": lambda: abs(180 - (angles.get("left_knee", 175) + angles.get("right_knee", 175)) / 2),
    }
    
    if metric in mapping:
        return mapping[metric]()
    return 50  # Default

if __name__ == "__main__":
    import uvicorn
    print("🧬 Life Longevity YOLO Stream")
    print("🤖 DeepSeek Master Data Coach - Powered by RTX 4080")
    uvicorn.run(app, host="0.0.0.0", port=8001)
