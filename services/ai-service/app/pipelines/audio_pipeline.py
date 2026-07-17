"""
Audio Analysis Pipeline — Whisper transcription + voice activity + second speaker detection.
"""

import time
import random
from datetime import datetime
from typing import Optional
import structlog

from app.models import AIEvent, AIEventSource, AIEventType

logger = structlog.get_logger()

try:
    import whisper
    _whisper_model = whisper.load_model("base")
    WHISPER_AVAILABLE = True
    logger.info("Whisper model loaded")
except (ImportError, Exception) as e:
    WHISPER_AVAILABLE = False
    _whisper_model = None
    logger.warning("Whisper not available — audio pipeline in stub mode", reason=str(e))

# Keywords that suggest coaching/cheating when spoken
SUSPICIOUS_KEYWORDS = [
    "answer", "correct", "option", "choose", "select",
    "question", "problem", "solution", "result",
]


def run_audio_pipeline(
    session_id: str,
    audio_base64: str,
    timestamp: Optional[datetime] = None,
) -> list[AIEvent]:
    start = time.perf_counter()
    ts = timestamp or datetime.utcnow()

    if WHISPER_AVAILABLE and _whisper_model is not None:
        events = _real_audio_pipeline(session_id, audio_base64, ts)
    else:
        events = _stub_audio_pipeline(session_id, ts)

    elapsed = (time.perf_counter() - start) * 1000
    logger.info("audio_pipeline_complete", session_id=session_id, events=len(events), ms=round(elapsed, 2))
    return events


def _real_audio_pipeline(session_id: str, audio_base64: str, ts: datetime) -> list[AIEvent]:
    import base64
    import tempfile
    import os

    # Decode audio to temp file
    audio_data = base64.b64decode(audio_base64)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(audio_data)
        tmp_path = f.name

    try:
        result = _whisper_model.transcribe(tmp_path, fp16=False)
        transcript = result.get("text", "").lower()
        segments = result.get("segments", [])

        events = []

        # Check for suspicious keywords
        keyword_hits = [kw for kw in SUSPICIOUS_KEYWORDS if kw in transcript]
        if len(keyword_hits) >= 2:
            events.append(AIEvent(
                session_id=session_id,
                source=AIEventSource.AUDIO,
                event_type=AIEventType.SECOND_VOICE,
                confidence=min(0.90, 0.55 + len(keyword_hits) * 0.05),
                timestamp=ts,
                metadata={"transcript_snippet": transcript[:200], "keywords": keyword_hits},
            ))

        # Heuristic: if many speech segments with gaps, could be second speaker
        if len(segments) > 5:
            speaker_gaps = [
                segments[i]["start"] - segments[i - 1]["end"]
                for i in range(1, len(segments))
            ]
            large_gaps = [g for g in speaker_gaps if g > 1.5]
            if len(large_gaps) >= 2:
                events.append(AIEvent(
                    session_id=session_id,
                    source=AIEventSource.AUDIO,
                    event_type=AIEventType.SECOND_VOICE,
                    confidence=0.65,
                    timestamp=ts,
                    metadata={"reason": "multiple_speaker_gaps", "gap_count": len(large_gaps)},
                ))

        return events
    finally:
        os.unlink(tmp_path)


def _stub_audio_pipeline(session_id: str, ts: datetime) -> list[AIEvent]:
    events = []
    if random.random() < 0.01:  # 1% chance
        events.append(AIEvent(
            session_id=session_id,
            source=AIEventSource.AUDIO,
            event_type=AIEventType.SECOND_VOICE,
            confidence=round(random.uniform(0.55, 0.80), 2),
            timestamp=ts,
            metadata={"stub": True},
        ))
    return events
