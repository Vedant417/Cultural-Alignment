"""
llm_client — dual-provider LLM interface
=========================================
Supports Ollama (local) and Groq (cloud) transparently.

Auto-detection order (when LLM_PROVIDER=auto):
  1. Try Ollama → if reachable, use it
  2. Fall back to Groq → if GROQ_API_KEY is set, use it
  3. If neither → return None (callers handle gracefully)

The public interface is unchanged:
  - ollama_generate(prompt, timeout) → str | None
  - extract_json_robust(text)        → dict
  - get_ollama_model()               → str | None  (now returns provider info)
"""

import re
import json
import httpx
from groq import AsyncGroq
from config import settings


# ─────────────────────────────────────────────────────────────────
# PROVIDER DETECTION
# ─────────────────────────────────────────────────────────────────

async def _is_ollama_running() -> bool:
    """Ping Ollama. Returns True if reachable within 4 seconds."""
    try:
        async with httpx.AsyncClient(timeout=4) as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


async def _get_active_provider() -> str:
    """
    Determine which LLM provider to use.
    Returns: "ollama" | "groq" | "none"
    """
    forced = settings.LLM_PROVIDER.lower().strip()

    if forced == "ollama":
        return "ollama" if await _is_ollama_running() else "none"

    if forced == "groq":
        return "groq" if settings.GROQ_API_KEY else "none"

    # "auto" mode — try Ollama first, fall back to Groq
    if await _is_ollama_running():
        return "ollama"

    if settings.GROQ_API_KEY:
        return "groq"

    return "none"


# ─────────────────────────────────────────────────────────────────
# OLLAMA HELPERS
# ─────────────────────────────────────────────────────────────────

async def _get_ollama_model_name() -> str | None:
    """Find the best available Ollama model."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            models = r.json().get("models", [])
            if models:
                names = [m["name"] for m in models]
                for preferred in [
                    "llama3:latest", "llama3", "llama3.2",
                    "mistral:latest", "mistral", "phi3", "phi"
                ]:
                    for n in names:
                        if n == preferred or n.startswith(preferred.split(":")[0]):
                            return n
                return names[0]
    except Exception:
        return None
    return None


async def _ollama_generate(prompt: str, timeout: int) -> str | None:
    """Call Ollama /api/generate. Returns response text or None."""
    model = await _get_ollama_model_name()
    if not model:
        return None
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False}
            )
            response.raise_for_status()
            return response.json().get("response", "")
    except httpx.TimeoutException:
        return None
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────
# GROQ HELPERS
# ─────────────────────────────────────────────────────────────────

async def _groq_generate(prompt: str) -> str | None:
    """
    Call Groq chat completions API.
    Groq is OpenAI-compatible and typically responds in 2–5 seconds.
    No timeout needed — Groq is a cloud API, not CPU-bound.
    """
    if not settings.GROQ_API_KEY:
        return None
    try:
        client   = AsyncGroq(api_key=settings.GROQ_API_KEY)
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a cultural media analyst and film database expert. "
                        "Always reply with raw JSON only — no markdown, no explanation, "
                        "no code fences. Your JSON must be valid and parseable."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.4,      # slight creativity but mostly consistent
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[Groq error] {e}")
        return None


# ─────────────────────────────────────────────────────────────────
# PUBLIC INTERFACE — unchanged signatures, used by scorer.py & region.py
# ─────────────────────────────────────────────────────────────────

async def get_ollama_model() -> str | None:
    """
    Returns a human-readable string indicating the active provider and model.
    Called by main.py to show provider status in the health endpoint.
    """
    provider = await _get_active_provider()
    if provider == "ollama":
        model = await _get_ollama_model_name()
        return f"ollama:{model}" if model else "ollama:unknown"
    if provider == "groq":
        return f"groq:{settings.GROQ_MODEL}"
    return None


async def ollama_generate(prompt: str, timeout: int = 300) -> str | None:
    """
    Main LLM entry point. Used by scorer.py and region.py.

    Automatically routes to:
      - Ollama  (if running locally)
      - Groq    (if hosted / Ollama not available)

    The `timeout` parameter applies only to Ollama (Groq doesn't need it).
    Returns the LLM response string, or None on failure.
    """
    provider = await _get_active_provider()

    if provider == "ollama":
        print(f"[LLM] Using Ollama — model: {await _get_ollama_model_name()}")
        return await _ollama_generate(prompt, timeout)

    if provider == "groq":
        print(f"[LLM] Using Groq — model: {settings.GROQ_MODEL}")
        return await _groq_generate(prompt)

    print("[LLM] ERROR: No LLM provider available. "
          "Start Ollama (ollama serve) or set GROQ_API_KEY in .env")
    return None


def extract_json_robust(text: str) -> dict:
    """
    Try 3 strategies to pull JSON from LLM output.
    Works for both Ollama and Groq responses.

    Strategy 1: Direct parse (works when LLM returns clean JSON)
    Strategy 2: Strip ```json ... ``` code fences (Ollama sometimes wraps)
    Strategy 3: Find first { ... } block (catches preamble/postamble)
    """
    if not text:
        return {}

    # Strategy 1: direct
    try:
        return json.loads(text.strip())
    except Exception:
        pass

    # Strategy 2: fenced code block
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except Exception:
            pass

    # Strategy 3: bare braces
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        try:
            return json.loads(brace.group())
        except Exception:
            pass

    return {}