from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, history, translate
from db.connection import connect_db, close_db
from modules.ollama_client import get_ollama_model   # unchanged import

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