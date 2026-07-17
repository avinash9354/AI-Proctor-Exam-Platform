from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class AIEventType(str, Enum):
    MULTIPLE_FACES = "MULTIPLE_FACES"
    FACE_MISSING = "FACE_MISSING"
    PHONE_DETECTED = "PHONE_DETECTED"
    BOOK_DETECTED = "BOOK_DETECTED"
    NOTES_DETECTED = "NOTES_DETECTED"
    EARBUDS_DETECTED = "EARBUDS_DETECTED"
    SECOND_PERSON_DETECTED = "SECOND_PERSON_DETECTED"
    LOOKING_AWAY = "LOOKING_AWAY"
    CAMERA_BLOCKED = "CAMERA_BLOCKED"
    UNAUTHORIZED_APP_TEXT = "UNAUTHORIZED_APP_TEXT"
    SECOND_VOICE = "SECOND_VOICE"
    CLIPBOARD_ATTEMPT = "CLIPBOARD_ATTEMPT"
    FOCUS_LOSS = "FOCUS_LOSS"
    LONG_INACTIVITY = "LONG_INACTIVITY"
    UNKNOWN_FACE = "UNKNOWN_FACE"

class AIEventSource(str, Enum):
    WEBCAM = "webcam"
    PHONE_CAM = "phone_cam"
    SCREEN = "screen"
    AUDIO = "audio"
    BROWSER = "browser"

class AIEvent(BaseModel):
    session_id: str
    source: AIEventSource
    event_type: AIEventType
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_ref: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None

class AnalyzeFrameRequest(BaseModel):
    session_id: str
    source: AIEventSource
    frame_base64: str  # base64-encoded JPEG
    enrollment_photo_url: Optional[str] = None
    timestamp: Optional[datetime] = None

class AnalyzeAudioRequest(BaseModel):
    session_id: str
    audio_base64: str  # base64-encoded WAV/MP3 chunk
    timestamp: Optional[datetime] = None

class AnalyzeScreenRequest(BaseModel):
    session_id: str
    frame_base64: str
    timestamp: Optional[datetime] = None

class PipelineResult(BaseModel):
    events: list[AIEvent]
    processing_time_ms: float
