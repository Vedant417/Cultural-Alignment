"""
Unified LLM Module - Production & Development
==============================================

Priority handling:
- Production (ENVIRONMENT=production): Groq ONLY (model = llama-3.3-70b-versatile)
- Local dev: Groq if key exists, else Ollama fallback
- Always falls back to Ollama locally if Groq fails

This module provides:
  - call_llm(prompt, timeout): Main LLM entry point
  - safe_parse_json(raw_str): Safely parse JSON with markdown cleanup
"""

import os
import json
import re
from typing import Optional

# Optional imports
try:
    from groq import AsyncGroq
except:
    AsyncGroq = None

from backend.modules.ollama_client import ollama_generate
from backend.config import settings

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


def _get_groq_client() -> Optional[AsyncGroq]:
    """Initialize and return Groq client if API key is set."""
    if GROQ_API_KEY and AsyncGroq:
        return AsyncGroq(api_key=GROQ_API_KEY)
    return None


async def call_llm(prompt: str, timeout: int = 60) -> str:
    """
    Unified LLM entry point with production-aware fallback.
    
    Priority:
    - Production: Groq only (raise error if not available)
    - Development: Try Groq first, fallback to Ollama
    
    Args:
        prompt: The prompt to send to the LLM
        timeout: Timeout in seconds (applies to Ollama only)
        
    Returns:
        LLM response string
        
    Raises:
        RuntimeError: In production if Groq is not available
    """
    client = _get_groq_client()

    # --- Production: Groq only ---
    if ENVIRONMENT == "production":
        if not client:
            raise RuntimeError(
                "GROQ_API_KEY not set in production environment. "
                "Set GROQ_API_KEY in Railway environment variables."
            )
        try:
            resp = await client.chat.completions.create(
                model=settings.GROQ_MODEL,  # "llama-3.3-70b-versatile"
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a cultural media analyst and film database expert. "
                            "Always reply with raw JSON only — no markdown, no explanation, "
                            "no code fences. Your JSON must be valid and parseable."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
                max_tokens=1024,
            )
            return resp.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"Groq LLM failed in production: {str(e)}")

    # --- Development: prefer Groq, fallback to Ollama ---
    if client:
        try:
            resp = await client.chat.completions.create(
                model=settings.GROQ_MODEL,  # "llama-3.3-70b-versatile"
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a cultural media analyst and film database expert. "
                            "Always reply with raw JSON only — no markdown, no explanation, "
                            "no code fences. Your JSON must be valid and parseable."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
                max_tokens=1024,
            )
            print(f"[LLM] Using Groq — model: {settings.GROQ_MODEL}")
            return resp.choices[0].message.content
        except Exception as e:
            print(f"[LLM] Groq failed, falling back to Ollama: {e}")

    # Fallback to Ollama (always in dev, only if Groq unavailable)
    result = await ollama_generate(prompt, timeout=timeout)
    if result:
        print(f"[LLM] Using Ollama fallback")
        return result

    raise RuntimeError(
        "No LLM provider available. Start Ollama (ollama serve) or set GROQ_API_KEY."
    )


def safe_parse_json(raw: str) -> dict:
    """
    Safely parse JSON from LLM output with markdown cleanup.
    
    Strategies:
    1. Direct parse (clean JSON)
    2. Strip ```json ... ``` fences
    3. Find first {...} block (handles preamble/postamble)
    
    Args:
        raw: Raw LLM response string
        
    Returns:
        Parsed JSON dict, or empty dict on failure
    """
    if not raw or not isinstance(raw, str):
        return {}

    # Strategy 1: Direct parse
    try:
        clean = raw.strip()
        return json.loads(clean)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Strip code fences
    try:
        clean = raw.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except json.JSONDecodeError:
        pass

    # Strategy 3: Find first {...} block
    try:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except json.JSONDecodeError:
        pass

    return {}
