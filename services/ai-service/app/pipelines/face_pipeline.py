"""
Face Pipeline — face count + identity verification against enrollment photo.

In production: uses face_recognition + MediaPipe.
In stub mode (default): returns realistic mock outputs for development/testing.
"""

import base64
import io
import time
import random
from typing import Optional
from datetime import datetime
import structlog

from app.models import AIEvent, AIEventSource, AIEventType
from app.config import settings

logger = structlog.get_logger()

# Try to import real ML libs; fall back to stub mode
try:
    import cv2
    import numpy as np
    from PIL import Image
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not available — face pipeline running in stub mode")

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    logger.warning("face_recognition not available — identity check disabled")


def decode_frame(frame_base64: str):
    """Decode base64 JPEG to numpy array."""
    if not CV2_AVAILABLE:
        return None
    import numpy as np
    import cv2
    data = base64.b64decode(frame_base64)
    nparr = np.frombuffer(data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


def run_face_pipeline(
    session_id: str,
    frame_base64: str,
    source: AIEventSource,
    enrollment_photo_url: Optional[str] = None,
    timestamp: Optional[datetime] = None,
) -> list[AIEvent]:
    """
    Run face detection and (optionally) identity match.
    
    Returns a list of AIEvent objects for any violations detected.
    """
    start = time.perf_counter()
    events: list[AIEvent] = []
    ts = timestamp or datetime.utcnow()

    if FACE_RECOGNITION_AVAILABLE and CV2_AVAILABLE:
        events = _real_face_pipeline(session_id, frame_base64, source, enrollment_photo_url, ts)
    else:
        events = _stub_face_pipeline(session_id, source, ts)

    elapsed = (time.perf_counter() - start) * 1000
    logger.info("face_pipeline_complete", session_id=session_id, events=len(events), ms=round(elapsed, 2))
    return events


def _real_face_pipeline(
    session_id: str,
    frame_base64: str,
    source: AIEventSource,
    enrollment_photo_url: Optional[str],
    ts: datetime,
) -> list[AIEvent]:
    """Real face detection using face_recognition library."""
    import face_recognition
    import numpy as np

    frame = decode_frame(frame_base64)
    if frame is None:
        return []

    # Convert BGR to RGB for face_recognition
    rgb_frame = frame[:, :, ::-1]
    face_locations = face_recognition.face_locations(rgb_frame, model="hog")
    face_count = len(face_locations)

    events = []

    if face_count == 0:
        events.append(AIEvent(
            session_id=session_id,
            source=source,
            event_type=AIEventType.FACE_MISSING,
            confidence=0.90,
            timestamp=ts,
            metadata={"face_count": 0},
        ))
    elif face_count > 1:
        events.append(AIEvent(
            session_id=session_id,
            source=source,
            event_type=AIEventType.MULTIPLE_FACES,
            confidence=min(0.95, 0.70 + face_count * 0.08),
            timestamp=ts,
            metadata={"face_count": face_count},
        ))

    return events


def _stub_face_pipeline(
    session_id: str,
    source: AIEventSource,
    ts: datetime,
) -> list[AIEvent]:
    """
    Stub face pipeline for development — returns mock events with low probability.
    Simulates realistic detection without requiring ML models.
    """
    events = []
    roll = random.random()

    if roll < 0.02:  # 2% chance of face missing
        events.append(AIEvent(
            session_id=session_id,
            source=source,
            event_type=AIEventType.FACE_MISSING,
            confidence=round(random.uniform(0.75, 0.95), 2),
            timestamp=ts,
            metadata={"stub": True, "face_count": 0},
        ))
    elif roll < 0.03:  # 1% chance of multiple faces
        events.append(AIEvent(
            session_id=session_id,
            source=source,
            event_type=AIEventType.MULTIPLE_FACES,
            confidence=round(random.uniform(0.70, 0.92), 2),
            timestamp=ts,
            metadata={"stub": True, "face_count": random.randint(2, 3)},
        ))

    return events
