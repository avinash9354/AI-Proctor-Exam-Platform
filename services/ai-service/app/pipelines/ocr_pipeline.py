"""
OCR Pipeline — EasyOCR screen analysis to flag unauthorized apps (search engines, AI chat, etc.)
"""

import time
import random
import re
from datetime import datetime
from typing import Optional
import structlog

from app.models import AIEvent, AIEventSource, AIEventType

logger = structlog.get_logger()

try:
    import easyocr
    _reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    OCR_AVAILABLE = True
    logger.info("EasyOCR reader initialized")
except (ImportError, Exception) as e:
    OCR_AVAILABLE = False
    _reader = None
    logger.warning("EasyOCR not available — OCR pipeline in stub mode", reason=str(e))

# Patterns that indicate unauthorized apps/content on screen
UNAUTHORIZED_PATTERNS = [
    r"chatgpt\.com", r"chat\.openai\.com",
    r"google\.com/search", r"stackoverflow\.com",
    r"chegg\.com", r"coursehero\.com",
    r"wolframalpha\.com",
    r"gmail\.com", r"whatsapp",
    r"pastebin\.com",
]


def run_ocr_pipeline(
    session_id: str,
    frame_base64: str,
    timestamp: Optional[datetime] = None,
) -> list[AIEvent]:
    start = time.perf_counter()
    ts = timestamp or datetime.utcnow()

    if OCR_AVAILABLE and _reader is not None:
        events = _real_ocr_pipeline(session_id, frame_base64, ts)
    else:
        events = _stub_ocr_pipeline(session_id, ts)

    elapsed = (time.perf_counter() - start) * 1000
    logger.info("ocr_pipeline_complete", session_id=session_id, events=len(events), ms=round(elapsed, 2))
    return events


def _real_ocr_pipeline(session_id: str, frame_base64: str, ts: datetime) -> list[AIEvent]:
    import base64
    import numpy as np

    data = base64.b64decode(frame_base64)
    nparr = np.frombuffer(data, np.uint8)

    results = _reader.readtext(nparr, detail=1)
    full_text = " ".join([r[1].lower() for r in results])

    events = []
    for pattern in UNAUTHORIZED_PATTERNS:
        if re.search(pattern, full_text, re.IGNORECASE):
            events.append(AIEvent(
                session_id=session_id,
                source=AIEventSource.SCREEN,
                event_type=AIEventType.UNAUTHORIZED_APP_TEXT,
                confidence=0.88,
                timestamp=ts,
                metadata={"matched_pattern": pattern, "text_snippet": full_text[:300]},
            ))
            break  # One event per frame is enough

    return events


def _stub_ocr_pipeline(session_id: str, ts: datetime) -> list[AIEvent]:
    events = []
    if random.random() < 0.005:  # 0.5% chance
        events.append(AIEvent(
            session_id=session_id,
            source=AIEventSource.SCREEN,
            event_type=AIEventType.UNAUTHORIZED_APP_TEXT,
            confidence=round(random.uniform(0.70, 0.92), 2),
            timestamp=ts,
            metadata={"stub": True, "matched_pattern": "google.com/search"},
        ))
    return events
