import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from routes.hotspots import router as hotspots_router
from routes.analytics import router as analytics_router
from routes.enforcement import router as enforcement_router
from routes.evidence import router as evidence_router

app = FastAPI(
    title="ParkSense GridLock API",
    description="AI-driven parking violation intelligence for Bengaluru traffic enforcement",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Open CORS — hackathon demo (Vercel + HF Spaces + localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUTS_DIR = Path(__file__).parent / "outputs"
OUTPUTS_DIR.mkdir(exist_ok=True)

app.include_router(hotspots_router, prefix="/api/hotspots", tags=["Hotspots"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(enforcement_router, prefix="/api/enforcement", tags=["Enforcement"])
app.include_router(evidence_router, prefix="/api/evidence", tags=["Evidence"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "ParkSense GridLock",
        "status": "operational",
        "version": "1.0.0",
        "description": "AI parking intelligence — PS1 submission, BTP Hackathon 2026",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
