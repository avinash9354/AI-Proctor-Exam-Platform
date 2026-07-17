"""
Event Emitter — normalizes pipeline outputs and POSTs to exam-service.
"""

import httpx
import structlog
from typing import List

from app.models import AIEvent
from app.config import settings

logger = structlog.get_logger()

async def emit_events(events: List[AIEvent]) -> None:
    """Post AI events to exam-service risk engine."""
    if not events:
        return

    async with httpx.AsyncClient(timeout=5.0) as client:
        for event in events:
            try:
                response = await client.post(
                    f"{settings.EXAM_SERVICE_URL}/v1/ai/events",
                    json=event.model_dump(mode="json"),
                    headers={"x-internal-key": settings.INTERNAL_API_KEY},
                )
                if response.status_code != 202:
                    logger.warning(
                        "event_emit_failed",
                        status=response.status_code,
                        event_type=event.event_type,
                        session_id=event.session_id,
                    )
                else:
                    result = response.json().get("data", {})
                    logger.info(
                        "event_emitted",
                        event_type=event.event_type,
                        session_id=event.session_id,
                        risk_score=result.get("riskScore"),
                        risk_level=result.get("riskLevel"),
                    )
            except httpx.RequestError as e:
                logger.error("event_emit_error", error=str(e), session_id=event.session_id)
