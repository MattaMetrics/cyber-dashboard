"""
Life Longevity Assessment API — FastAPI upload + Aikynetix pipeline.

Install:
  pip install fastapi uvicorn python-multipart aiohttp numpy

Run from project root:
  set PYTHONPATH=src
  uvicorn api.server:app --reload --host 0.0.0.0 --port 8000

Or:
  python src/api/server.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

import aiohttp
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# Ensure src/ is on path when launched directly
_SRC_ROOT = Path(__file__).resolve().parents[1]
if str(_SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(_SRC_ROOT))

from core_analytics.interpreter import AikynetixAIInterpreter  # noqa: E402
from core_analytics.interpreter_enhanced import EnhancedMetricsCalculator  # noqa: E402

_PROJECT_ROOT = _SRC_ROOT.parent
_TEMP_DIR = _PROJECT_ROOT / "temp"
_REPORTS_DIR = _PROJECT_ROOT / "reports"

app = FastAPI(title="Life Longevity Assessment API", version="1.0.0")

_cors_origins = os.getenv(
    "ASSESSMENT_API_CORS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

interpreter = AikynetixAIInterpreter()
results_store: dict[str, dict[str, Any]] = {}


class AssessmentRequest(BaseModel):
    test_id: str
    client_id: str
    coach_id: str | None = None
    notes: str | None = None


class AssessmentResponse(BaseModel):
    assessment_id: str
    status: str
    results: dict[str, Any] | None = None
    error: str | None = None


class InterceptPayload(BaseModel):
    test_id: str
    client_id: str
    client_age: int = 35
    aikynetix_response: dict[str, Any]
    source_url: str | None = None
    video_url: str | None = None
    coach_id: str | None = None
    notes: str | None = None


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "life-longevity-assessment-api"}


@app.post("/api/assess/upload")
async def upload_video_for_assessment(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    test_id: str = Form(...),
    client_id: str = Form(...),
    coach_id: str | None = Form(None),
    notes: str | None = Form(None),
    client_age: int = Form(35),
):
    """Upload video and kick off the assessment pipeline."""
    try:
        assessment_id = (
            f"LL_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        )
        _TEMP_DIR.mkdir(parents=True, exist_ok=True)
        video_path = _TEMP_DIR / f"{assessment_id}_{video.filename or 'upload.mp4'}"

        content = await video.read()
        video_path.write_bytes(content)

        results_store[assessment_id] = {
            "status": "processing",
            "test_id": test_id,
            "client_id": client_id,
            "coach_id": coach_id,
            "notes": notes,
            "client_age": client_age,
            "video_path": str(video_path),
            "created_at": datetime.now().isoformat(),
            "progress": 0,
        }

        background_tasks.add_task(
            process_assessment_pipeline,
            assessment_id,
            str(video_path),
            test_id,
            client_id,
            client_age,
        )

        return {
            "assessment_id": assessment_id,
            "status": "processing",
            "message": "Video uploaded. Assessment processing started.",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/assess/status/{assessment_id}")
async def get_assessment_status(assessment_id: str) -> dict[str, Any]:
    record = results_store.get(assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return {
        "assessment_id": assessment_id,
        "status": record["status"],
        "progress": record.get("progress", 0),
        "estimated_completion": record.get("estimated_completion"),
        "error": record.get("error"),
    }


@app.get("/api/assess/results/{assessment_id}")
async def get_assessment_results(assessment_id: str) -> dict[str, Any]:
    record = results_store.get(assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if record["status"] != "completed":
        return {
            "assessment_id": assessment_id,
            "status": record["status"],
            "message": "Assessment still processing",
        }

    return record["results"]


@app.get("/api/assess/download/{assessment_id}")
async def download_assessment_report(assessment_id: str, format: str = "pdf"):
    record = results_store.get(assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if record["status"] != "completed":
        raise HTTPException(status_code=400, detail="Assessment not completed")

    results = record["results"]
    if format == "json":
        return JSONResponse(
            content=results,
            headers={
                "Content-Disposition": f"attachment; filename={assessment_id}_report.json"
            },
        )

    pdf_path = await generate_pdf_report(results)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"{assessment_id}_report.pdf",
    )


@app.post("/api/assess/batch")
async def batch_assess_clients(
    background_tasks: BackgroundTasks,
    videos: list[UploadFile] = File(...),
    test_id: str = Form(...),
    client_ids: str = Form(...),
    client_age: int = Form(35),
):
    """Batch process multiple clients for the same test."""
    client_id_list = [item.strip() for item in client_ids.split(",") if item.strip()]

    if len(videos) != len(client_id_list):
        raise HTTPException(
            status_code=400,
            detail="Number of videos must match number of client IDs",
        )

    _TEMP_DIR.mkdir(parents=True, exist_ok=True)
    assessment_ids: list[str] = []

    for video, client_id in zip(videos, client_id_list):
        assessment_id = (
            f"LL_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        )
        video_path = _TEMP_DIR / f"{assessment_id}_{video.filename or 'upload.mp4'}"
        content = await video.read()
        video_path.write_bytes(content)

        results_store[assessment_id] = {
            "status": "processing",
            "test_id": test_id,
            "client_id": client_id,
            "client_age": client_age,
            "video_path": str(video_path),
            "created_at": datetime.now().isoformat(),
            "progress": 0,
        }

        background_tasks.add_task(
            process_assessment_pipeline,
            assessment_id,
            str(video_path),
            test_id,
            client_id,
            client_age,
        )
        assessment_ids.append(assessment_id)

    return {
        "assessment_ids": assessment_ids,
        "status": "processing",
        "message": f"Batch processing {len(assessment_ids)} assessments",
    }


@app.get("/api/clients/{client_id}/history")
async def get_client_history(client_id: str) -> list[dict[str, Any]]:
    client_assessments: list[dict[str, Any]] = []

    for assessment_id, record in results_store.items():
        if record.get("client_id") != client_id:
            continue
        results = record.get("results") or {}
        header = results.get("header") or {}
        client_assessments.append(
            {
                "assessment_id": assessment_id,
                "test_name": record.get("test_name") or header.get("test_name", "Unknown"),
                "date": record.get("created_at"),
                "status": record["status"],
                "score": results.get("overall_score") or header.get("overall_score"),
            }
        )

    return sorted(client_assessments, key=lambda item: item.get("date") or "", reverse=True)


def _looks_like_video_url(url: str) -> bool:
    if not url:
        return False
    lowered = url.lower()
    if "manual_paste" in lowered or "aikynetix.com/app" in lowered or "aikynetix.com/analysis" in lowered:
        return False
    if lowered.startswith(("blob:", "data:video")):
        return True
    if any(ext in lowered for ext in (".mp4", ".webm", ".mov", ".m4v", ".ogg")):
        return True
    return any(token in lowered for token in ("video", "media", "stream", "cloudfront", "amazonaws"))


def _extract_video_url_from_payload(data: Any, depth: int = 0) -> str:
    if depth > 5 or data is None:
        return ""
    if isinstance(data, str):
        return data.strip() if _looks_like_video_url(data) else ""
    if isinstance(data, dict):
        for key in ("video_url", "videoUrl", "media_url", "stream_url", "recording_url", "video"):
            value = data.get(key)
            if isinstance(value, str) and _looks_like_video_url(value):
                return value.strip()
        for key, value in data.items():
            if re.search(r"video|mp4|media|stream|reel|clip|recording", key, re.I):
                if isinstance(value, str) and _looks_like_video_url(value):
                    return value.strip()
        for value in data.values():
            found = _extract_video_url_from_payload(value, depth + 1)
            if found:
                return found
    if isinstance(data, list):
        for item in data:
            found = _extract_video_url_from_payload(item, depth + 1)
            if found:
                return found
    return ""


def _compile_final_results(
    *,
    assessment_id: str,
    test_id: str,
    client_id: str,
    client_age: int,
    aikynetix_response: dict[str, Any],
    source_url: str | None = None,
    video_url: str | None = None,
) -> dict[str, Any]:
    structured_data = interpreter.parse_aikynetix_response(aikynetix_response)
    result = interpreter.assess_movement(
        test_id,
        structured_data,
        chronological_age=client_age,
    )
    report = interpreter.generate_report(result)

    joint_angles = structured_data.get("joint_angles") or {}
    metric_pool = {
        str(k): float(v)
        for k, v in joint_angles.items()
        if isinstance(v, (int, float))
    }
    metric_pool.update(report.get("scores") or {})
    metric_pool["overall_score"] = float(
        report.get("header", {}).get("overall_score", 0) or 0
    )

    energy_analysis = report.get("energy_analysis") or (
        EnhancedMetricsCalculator.calculate_energy_leak_detection(metric_pool)
    )
    movement_age = (report.get("enhanced_analysis") or {}).get("movement_age") or (
        EnhancedMetricsCalculator.calculate_biological_movement_age(metric_pool, client_age)
    )
    longevity_recs = report.get("longevity_recommendations") or (
        EnhancedMetricsCalculator.generate_longevity_recommendations(
            report.get("scores") or {},
            energy_analysis,
            movement_age,
        )
    )

    resolved_video_url = (
        (video_url or "").strip()
        or _extract_video_url_from_payload(aikynetix_response)
        or ((source_url or "").strip() if _looks_like_video_url(source_url or "") else "")
    )

    return {
        **report,
        "assessment_id": assessment_id,
        "client_id": client_id,
        "test_id": test_id,
        "overall_score": report.get("header", {}).get("overall_score"),
        "video_url": resolved_video_url,
        "enhanced_metrics": {
            "energy_analysis": energy_analysis,
            "movement_age": movement_age,
            "longevity_recommendations": longevity_recs,
        },
        "metadata": {
            "processed_at": datetime.now().isoformat(),
            "aikynetix_api_version": os.getenv("AIKYNETIX_API_VERSION", "v2.1"),
            "model_version": "LL_AI_v1.0",
            "source": "chrome_extension_intercept",
            "source_url": source_url or "",
            "video_url": resolved_video_url,
        },
    }


@app.post("/api/assess/intercept")
async def intercept_aikynetix_response(payload: InterceptPayload) -> dict[str, Any]:
    """
    Accept a raw Aikynetix JSON payload captured by the Chrome extension
    (or manual paste) and run the AI interpreter immediately.
    """
    try:
        assessment_id = (
            f"LL_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        )
        final_results = _compile_final_results(
            assessment_id=assessment_id,
            test_id=payload.test_id,
            client_id=payload.client_id,
            client_age=payload.client_age,
            aikynetix_response=payload.aikynetix_response,
            source_url=payload.source_url,
            video_url=payload.video_url,
        )

        results_store[assessment_id] = {
            "status": "completed",
            "progress": 100,
            "test_id": payload.test_id,
            "client_id": payload.client_id,
            "coach_id": payload.coach_id,
            "notes": payload.notes,
            "created_at": datetime.now().isoformat(),
            "completed_at": datetime.now().isoformat(),
            "test_name": final_results.get("header", {}).get("test_name", ""),
            "results": final_results,
            "source_url": payload.source_url,
        }

        return {
            "assessment_id": assessment_id,
            "status": "completed",
            "results": final_results,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


async def process_assessment_pipeline(
    assessment_id: str,
    video_path: str,
    test_id: str,
    client_id: str,
    client_age: int = 35,
) -> None:
    """Video → Aikynetix API → AI interpreter → stored results."""
    record = results_store[assessment_id]
    try:
        record["progress"] = 10
        record["status"] = "uploading_to_aikynetix"

        aikynetix_response = await send_to_aikynetix_api(video_path)
        record["progress"] = 40

        final_results = _compile_final_results(
            assessment_id=assessment_id,
            test_id=test_id,
            client_id=client_id,
            client_age=client_age,
            aikynetix_response=aikynetix_response,
            source_url="server_video_upload",
        )
        final_results["metadata"]["source"] = "server_video_upload"

        record.update(
            {
                "status": "completed",
                "progress": 100,
                "results": final_results,
                "test_name": final_results.get("header", {}).get("test_name", ""),
                "completed_at": datetime.now().isoformat(),
            }
        )

        try:
            os.remove(video_path)
        except OSError:
            pass

    except Exception as exc:
        record.update({"status": "failed", "error": str(exc), "progress": 0})


async def send_to_aikynetix_api(video_path: str) -> dict[str, Any]:
    """Send video to Aikynetix Web API, or return a dev mock when unconfigured."""
    api_url = os.getenv("AIKYNETIX_API_URL", "https://api.aikynetix.com/v2/analyze")
    api_key = os.getenv("AIKYNETIX_API_KEY", "")

    if not api_key or api_key == "your_api_key_here":
        return _mock_aikynetix_response()

    async with aiohttp.ClientSession() as session:
        with open(video_path, "rb") as handle:
            form = aiohttp.FormData()
            form.add_field(
                "video",
                handle,
                filename=os.path.basename(video_path),
                content_type="video/mp4",
            )
            form.add_field("analysis_type", "full_biomechanical")
            form.add_field("include_angles", "true")
            form.add_field("include_keypoints", "true")
            form.add_field("include_com", "true")
            form.add_field("include_symmetry", "true")

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
            }

            async with session.post(api_url, data=form, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise RuntimeError(f"Aikynetix API error ({response.status}): {error_text}")
                payload = await response.json()
                if not isinstance(payload, dict):
                    raise RuntimeError("Aikynetix API returned non-object JSON")
                return payload


def _mock_aikynetix_response() -> dict[str, Any]:
    """Minimal biomechanical payload for local dev without Aikynetix credentials."""
    return {
        "keypoints": [
            {"label": "hip_left", "x": 0.1, "y": 0.5, "z": 0.0, "confidence": 0.95},
            {"label": "hip_right", "x": -0.1, "y": 0.5, "z": 0.0, "confidence": 0.94},
            {"label": "knee_left", "x": 0.12, "y": 0.3, "z": 0.0, "confidence": 0.93},
            {"label": "knee_right", "x": -0.11, "y": 0.31, "z": 0.0, "confidence": 0.92},
        ],
        "angles": {
            "hip_extension": 18.0,
            "knee_flexion": 95.0,
            "ankle_dorsiflexion": 22.0,
            "thoracic_rotation": 55.0,
            "shoulder_flexion": 160.0,
            "knee_valgus": 6.0,
            "lumbar_extension": 12.0,
            "forward_head": 3.0,
            "flexibility_score": 82.0,
            "mobility_score": 78.0,
            "balance_score": 85.0,
            "technique_score": 80.0,
            "power_score": 76.0,
            "endurance_score": 74.0,
        },
        "center_of_mass": {
            "x_displacement": 1.2,
            "y_displacement": 0.4,
            "z_displacement": 0.1,
            "sway_area": 2.5,
            "sway_velocity": 0.8,
            "stability_index": 88.0,
        },
        "symmetry": {"overall": 91.0},
        "temporal": {"duration": 8.5, "velocity": 1.1, "phases": {}},
    }


async def generate_pdf_report(results: dict[str, Any]) -> str:
    """
    Generate PDF report from results.
    Placeholder writes JSON alongside until a PDF renderer is wired in.
    """
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    assessment_id = str(results.get("assessment_id", "report"))
    json_path = _REPORTS_DIR / f"{assessment_id}_report.json"
    pdf_path = _REPORTS_DIR / f"{assessment_id}_report.pdf"

    json_path.write_text(json.dumps(results, indent=2), encoding="utf-8")

    # TODO: swap for reportlab / weasyprint HTML → PDF
    if not pdf_path.exists():
        pdf_path.write_bytes(b"%PDF-1.4\n% Life Longevity placeholder report\n")

    return str(pdf_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api.server:app",
        host="0.0.0.0",
        port=int(os.getenv("ASSESSMENT_API_PORT", "8000")),
        reload=True,
        app_dir=str(_SRC_ROOT),
    )
