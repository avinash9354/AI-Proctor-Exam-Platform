from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    return {"status": "ok", "service": "ai-service", "timestamp": datetime.utcnow().isoformat()}
