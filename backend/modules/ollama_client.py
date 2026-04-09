import re
import json
import httpx
from config import settings


async def get_ollama_model() -> str | None:
    """Auto-detect whichever Ollama model is available, preferring llama3."""
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


async def ollama_generate(prompt: str, timeout: int = 300) -> str | None:
    """
    Send a prompt to Ollama /api/generate.
    Returns the response string, or None on failure/timeout.
    timeout=300 (5 min) because CPU inference is slow.
    """
    model = await get_ollama_model()
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


def extract_json_robust(text: str) -> dict:
    """
    Try 3 strategies to pull JSON from Ollama output.
    1. Direct parse
    2. Strip ```json ... ``` code fences
    3. Find first { ... } block
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

