from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import analyze, history, translate, compare
from backend.db.connection import connect_db, close_db, get_db
from backend.modules.ollama_client import get_ollama_model   # unchanged import

app = FastAPI(
    title="CultureAlign API",
    description="AI-powered cultural alignment analysis for movies.",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow Netlify domain + localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await close_db()

app.include_router(analyze.router)
app.include_router(history.router)
app.include_router(translate.router)
app.include_router(compare.router)


@app.get("/")
async def root():
    """Quick test endpoint to verify app is responding."""
    return {"status": "ok", "message": "CultureAlign API is running"}


@app.get("/health")
async def health():
    """
    Health check — shows which LLM provider is active.
    Useful for debugging hosted vs local environments.
    """
    provider_info = await get_ollama_model()

    if provider_info and provider_info.startswith("groq:"):
        provider = "groq"
        model    = provider_info.replace("groq:", "")
    elif provider_info and provider_info.startswith("ollama:"):
        provider = "ollama"
        model    = provider_info.replace("ollama:", "")
    else:
        provider = "none"
        model    = None

    return {
        "status":   "ok",
        "service":  "CultureAlign API",
        "llm": {
            "provider": provider,        # "ollama" | "groq" | "none"
            "model":    model,           # model name being used
            "ready":    provider != "none",
        }
    }


@app.get("/debug/env")
async def debug_env():
    """Check environment variables (for debugging only - remove in production)."""
    import os
    return {
        "ENVIRONMENT": os.getenv("ENVIRONMENT", "development"),
        "MONGODB_URI": "SET" if os.getenv("MONGODB_URI") else "NOT SET",
        "MONGODB_DB": os.getenv("MONGODB_DB", "culture_align"),
        "TMDB_API_KEY": "SET" if os.getenv("TMDB_API_KEY") else "NOT SET",
        "GROQ_API_KEY": "SET" if os.getenv("GROQ_API_KEY") else "NOT SET",
        "OLLAMA_BASE_URL": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        "LLM_PROVIDER": os.getenv("LLM_PROVIDER", "auto"),
    }


@app.get("/debug/db")
async def debug_db():
    """Check database connection."""
    try:
        db = get_db()
        # Try a simple ping operation
        await db.command("ping")
        return {"status": "connected", "message": "MongoDB is responding"}
    except Exception as e:
        return {"status": "error", "message": str(e)}