from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, history
from db.connection import connect_db, close_db

app = FastAPI(
    title="CultureAlign API",
    description="AI-powered cultural alignment analysis for movies.",
    version="1.0.0"
)

# Allow Next.js dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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

@app.get("/health")
async def health():
    """Quick health check — verify API is up."""
    return {"status": "ok", "service": "CultureAlign API"}