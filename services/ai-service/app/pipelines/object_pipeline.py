"""
Object Detection Pipeline — YOLOv11 for phone, book, notes, earbuds, second person.

Production: Uses ultralytics YOLOv11 ONNX model.
Stub mode: Returns realistic mock outputs.
"""

import time
import random
from datetime import datetime
from typing import Optional
import structlog

from app.models import AIEvent, AIEventSource, AIEventType
from app.config import settings

logger = structlog.get_logger()

try:
    from ultralytics import YOLO
    import os
    MODEL_PATH = os.path.join(settings.MODEL_DIR, "yolo11n.pt")
    _model = YOLO(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
    YOLO_AVAILABLE = _model is not None
    if not YOLO_AVAILABLE:
        logger.warning("YOLOv11 model not found — running in stub mode. Download yolo11n.pt to services/ai-service/models/")
except ImportError:
    YOLO_AVAILABLE = False
    _model = None
    logger.warning("ultralytics not installed — object pipeline in stub mode")

# COCO class mapping to AIEventType
DETECTION_MAP = {
    "cell phone": AIEventType.PHONE_DETECTED,
    "book": AIEventType.BOOK_DETECTED,
    "person": None,  # handled specially (second person)
    "earphones": AIEventType.EARBUDS_DETECTED,
}

YOLO_CONFIDENCE_THRESHOLD = 0.55


def run_object_pipeline(
    session_id: str,
    frame_base64: str,
    source: AIEventSource,
    timestamp: Optional[datetime] = None,
) -> list[AIEvent]:
    start = time.perf_counter()
    ts = timestamp or datetime.utcnow()

    if YOLO_AVAILABLE and _model is not None:
        events = _real_object_pipeline(session_id, frame_base64, source, ts)
    else:
        events = _stub_object_pipeline(session_id, source, ts)

    elapsed = (time.perf_counter() - start) * 1000
    logger.info("object_pipeline_complete", session_id=session_id, events=len(events), ms=round(elapsed, 2))
    return events


def _real_object_pipeline(
    session_id: str,
    frame_base64: str,
    source: AIEventSource,
    ts: datetime,
) -> list[AIEvent]:
    import base64
    import numpy as np
    import cv2

    data = base64.b64decode(frame_base64)
    nparr = np.frombuffer(data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = _model(frame, verbose=False, conf=YOLO_CONFIDENCE_THRESHOLD)
    events = []
    person_count = 0

    for result in results:
        for box in result.boxes:
            cls_name = result.names[int(box.cls)]
            conf = float(box.conf)

            if cls_name == "person":
                person_count += 1
                continue

            event_type = DETECTION_MAP.get(cls_name)
            if event_type:
                events.append(AIEvent(
                    session_id=session_id,
                    source=source,
                    event_type=event_type,
                    confidence=round(conf, 3),
                    timestamp=ts,
                    metadata={"class": cls_name, "bbox": box.xyxy[0].tolist()},
                ))

    # If more than 1 person detected, flag second person
    if person_count > 1:
        events.append(AIEvent(
            session_id=session_id,
            source=source,
            event_type=AIEventType.SECOND_PERSON_DETECTED,
            confidence=0.80,
            timestamp=ts,
            metadata={"person_count": person_count},
        ))

    return events


def _stub_object_pipeline(
    session_id: str,
    source: AIEventSource,
    ts: datetime,
) -> list[AIEvent]:
    """Low-probability stub detections for dev."""
    events = []
    roll = random.random()

    if roll < 0.015:
        events.append(AIEvent(
            session_id=session_id,
            source=source,
            event_type=AIEventType.PHONE_DETECTED,
            confidence=round(random.uniform(0.60, 0.95), 2),
            timestamp=ts,
            metadata={"stub": True},
        ))
    elif roll < 0.025:
        events.append(AIEvent(
            session_id=session_id,
            source=source,
            event_type=AIEventType.BOOK_DETECTED,
            confidence=round(random.uniform(0.55, 0.85), 2),
            timestamp=ts,
            metadata={"stub": True},
        ))

    return events
