import re
import json
import httpx
import os
from config import settings

# Optional Groq
try:
    from groq import Groq
    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
except Exception:
    groq_client = None


# ─────────────────────────────────────────────
# 1. Detect Ollama model (LOCAL)
# ─────────────────────────────────────────────
async def get_ollama_model() -> str | None:
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


# ─────────────────────────────────────────────
# 2. Ollama (LOCAL)
# ─────────────────────────────────────────────
async def ollama_local_generate(prompt: str, timeout: int = 120) -> str | None:
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
    except Exception:
        return None


# ─────────────────────────────────────────────
# 3. Groq (CLOUD fallback)
# ─────────────────────────────────────────────
def groq_generate(prompt: str) -> str | None:
    try:
        from groq import Groq
        import os

        api_key = os.getenv("GROQ_API_KEY")
        print("GROQ KEY:", api_key)

        if not api_key:
            print("❌ No API key found")
            return None

        client = Groq(api_key=api_key)

        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "user", "content": prompt}],
        )

        print("✅ Groq response received")

        return response.choices[0].message.content

    except Exception as e:
        print("❌ GROQ ERROR:", str(e))
        return None


# ─────────────────────────────────────────────
# 4. MAIN FUNCTION (AUTO SWITCH)
# ─────────────────────────────────────────────
async def ollama_generate(prompt: str, timeout: int = 120) -> str | None:
    """
    Priority:
    1. Try local Ollama
    2. Fallback to Groq API
    """

    # Try local first
    local_result = await ollama_local_generate(prompt, timeout)
    if local_result:
        print("✅ Using LOCAL Ollama")
        return local_result

    # Fallback to cloud
    cloud_result = groq_generate(prompt)
    if cloud_result:
        print("🌐 Using GROQ (fallback)")
        return cloud_result

    return None


# ─────────────────────────────────────────────
# 5. JSON Extractor (unchanged)
# ─────────────────────────────────────────────
def extract_json_robust(text: str) -> dict:
    if not text:
        return {}

    try:
        return json.loads(text.strip())
    except Exception:
        pass

    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except Exception:
            pass

    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        try:
            return json.loads(brace.group())
        except Exception:
            pass

    return {}