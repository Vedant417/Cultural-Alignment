import httpx
import logging

logger = logging.getLogger(__name__)

# MyMemory API — free, no credentials needed, reliable
MYMEMORY_URL = "https://api.mymemory.translated.net/get"

logger.info("✅ MyMemory Translation API configured (free, no credentials needed)")


async def translate_text(text: str, target_language: str, source_language: str = "en") -> str:
    """
    Translate text using MyMemory API (free, no credentials).
    
    Args:
        text: Text to translate
        target_language: Target language code (e.g., "hi", "es", "ja")
        source_language: Source language code (default: "en")
    
    Returns:
        Translated text, or original text if translation fails
    """
    if not text or not text.strip():
        return text
    
    if target_language == "en" or target_language == source_language:
        return text
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            params = {
                "q": text[:500],  # MyMemory has text length limits
                "langpair": f"{source_language}|{target_language}"
            }
            logger.debug(f"Translating to {target_language}: {text[:50]}...")
            res = await client.get(MYMEMORY_URL, params=params)
            
            if res.status_code == 200:
                data = res.json()
                # MyMemory returns responseStatus 200 for success
                if data.get("responseStatus") == 200:
                    translated = data.get("responseData", {}).get("translatedText")
                    if translated:
                        logger.debug(f"Translation success: {translated[:50]}...")
                        return translated
                else:
                    logger.warning(f"MyMemory API error: {data.get('responseStatus')}")
            else:
                logger.warning(f"HTTP {res.status_code}: {res.text[:100]}")
    except Exception as e:
        logger.error(f"Translation error: {type(e).__name__}: {str(e)}")
    
    logger.debug(f"Translation failed, returning original text")
    return text  # fallback to original


async def batch_translate(texts: list, target_language: str, source_language: str = "en") -> list:
    """
    Translate multiple texts using MyMemory API.
    Uses parallel requests with asyncio.
    """
    if target_language == "en" or target_language == source_language:
        return texts
    
    if not texts:
        return texts
    
    # Translate in parallel
    import asyncio
    tasks = [translate_text(t, target_language, source_language) for t in texts]
    results = await asyncio.gather(*tasks)
    
    return results
