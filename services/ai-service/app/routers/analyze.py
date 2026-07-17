from fastapi import APIRouter, BackgroundTasks
from app.models import (
    AnalyzeFrameRequest,
    AnalyzeAudioRequest,
    AnalyzeScreenRequest,
    PipelineResult,
    AIEventSource,
)
from app.pipelines.face_pipeline import run_face_pipeline
from app.pipelines.object_pipeline import run_object_pipeline
from app.pipelines.audio_pipeline import run_audio_pipeline
from app.pipelines.ocr_pipeline import run_ocr_pipeline
from app.risk.event_emitter import emit_events
import time

router = APIRouter(prefix="/analyze", tags=["analysis"])


@router.post("/frame", response_model=PipelineResult)
async def analyze_frame(req: AnalyzeFrameRequest, background_tasks: BackgroundTasks):
    """
    Analyze a webcam or phone-camera frame.
    Runs face detection + object detection in parallel (both pipelines on same frame).
    """
    start = time.perf_counter()

    face_events = run_face_pipeline(
        session_id=req.session_id,
        frame_base64=req.frame_base64,
        source=req.source,
        enrollment_photo_url=req.enrollment_photo_url,
        timestamp=req.timestamp,
    )

    object_events = run_object_pipeline(
        session_id=req.session_id,
        frame_base64=req.frame_base64,
        source=req.source,
        timestamp=req.timestamp,
    )

    all_events = face_events + object_events

    # Emit to exam-service asynchronously (don't block the response)
    if all_events:
        background_tasks.add_task(emit_events, all_events)

    elapsed = (time.perf_counter() - start) * 1000
    return PipelineResult(events=all_events, processing_time_ms=round(elapsed, 2))


@router.post("/screen", response_model=PipelineResult)
async def analyze_screen(req: AnalyzeScreenRequest, background_tasks: BackgroundTasks):
    """Analyze a screen capture frame with OCR."""
    start = time.perf_counter()

    ocr_events = run_ocr_pipeline(
        session_id=req.session_id,
        frame_base64=req.frame_base64,
        timestamp=req.timestamp,
    )

    if ocr_events:
        background_tasks.add_task(emit_events, ocr_events)

    elapsed = (time.perf_counter() - start) * 1000
    return PipelineResult(events=ocr_events, processing_time_ms=round(elapsed, 2))


@router.post("/audio", response_model=PipelineResult)
async def analyze_audio(req: AnalyzeAudioRequest, background_tasks: BackgroundTasks):
    """Analyze audio chunk with Whisper transcription."""
    start = time.perf_counter()

    audio_events = run_audio_pipeline(
        session_id=req.session_id,
        audio_base64=req.audio_base64,
        timestamp=req.timestamp,
    )

    if audio_events:
        background_tasks.add_task(emit_events, audio_events)

    elapsed = (time.perf_counter() - start) * 1000
    return PipelineResult(events=audio_events, processing_time_ms=round(elapsed, 2))
