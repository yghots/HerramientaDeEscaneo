from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.db.init_db import init_database
from backend.app.api import health, districts, categories, businesses, scans, export

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and seed default data
    init_database()
    yield

app = FastAPI(
    title="NEXO LEADS API",
    description="Motor de búsqueda local y prospección de negocios sin web para NEXO WEB en Lima, Perú.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for local React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router, prefix="/api")
app.include_router(districts.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(businesses.router, prefix="/api")
app.include_router(scans.router, prefix="/api")
app.include_router(export.router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": "NEXO LEADS",
        "tagline": "Buscador local de prospectos comerciales para Nexo Web",
        "docs": "/docs",
        "health": "/api/health"
    }
