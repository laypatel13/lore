import multiprocessing
multiprocessing.set_start_method('fork', force=True)

import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import ingest, chat
from services import cognee_service
from core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    await cognee_service.setup()
    yield

app = FastAPI(
    title="Lore API",
    description="Codebase memory powered by Cognee",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"status": "ok", "service": "Lore API", "version": "0.2.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
