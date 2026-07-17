from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from app.routers import analyze, health
from app.config import settings

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ai_service_startup", exam_service_url=settings.EXAM_SERVICE_URL)
    yield
    logger.info("ai_service_shutdown")

app = FastAPI(
    title="Exam Platform AI Service",
    description="Computer vision, audio analysis, and OCR for exam proctoring",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(analyze.router, prefix="/v1")
