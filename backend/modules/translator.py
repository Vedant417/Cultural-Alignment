import os
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

# Translation cache: key -> Map<language -> translation>
_cache = {}
_client = None
_client_available = None  # Track if client was successfully initialized

def get_translator():
    """Get or initialize the Google Translate client."""
    global _client, _client_available
    
    if _client_available is not None:
        # Already tried to initialize
        return _client
    
    try:
        from google.cloud import translate_v2
        _client = translate_v2.Client()
        _client_available = True
        logger.info("✅ Google Cloud Translate client initialized")
    except ImportError:
        logger.warning("⚠️ google-cloud-translate not installed. Translations will be disabled.")
        _client_available = False
    except Exception as e:
        logger.warning(f"⚠️ Google Cloud Translate client initialization failed: {e}")
        logger.warning("Set GOOGLE_APPLICATION_CREDENTIALS or credentials to enable translations.")
        _client_available = False
    
    return _client


async def translate_text(text: str, target_language: str, source_language: str = "en") -> str:
    """
    Translate text to target language.
    
    Args:
        text: Text to translate
        target_language: Target language code (e.g., "hi", "es", "ja")
        source_language: Source language code (default: "en")
    
    Returns:
        Translated text, or original text if translation fails or is not available
    """
    
    if not text or not text.strip():
        return text
    
    # Return original for English
    if target_language == "en" or target_language == source_language:
        return text
    
    # Check cache
    cache_key = f"{source_language}-{target_language}:{text[:100]}"
    if cache_key in _cache:
        return _cache[cache_key]
    
    try:
        client = get_translator()
        
        if client is None or not _client_available:
            # Translations not available in this environment
            return text
        
        # Use Google Translate API
        result = client.translate_text(
            text=text,
            target_language=target_language,
            source_language=source_language
        )
        
        translated = result.get("translatedText", text)
        
        # Cache result
        _cache[cache_key] = translated
        
        return translated
    
    except Exception as e:
        logger.error(f"Translation error: {e}")
        # Return original text on error
        return text


async def batch_translate(texts: list, target_language: str, source_language: str = "en") -> list:
    """
    Translate multiple texts efficiently.
    
    Args:
        texts: List of texts to translate
        target_language: Target language code
        source_language: Source language code
    
    Returns:
        List of translated texts
    """
    
    if target_language == "en" or target_language == source_language:
        return texts
    
    results = []
    for text in texts:
        translated = await translate_text(text, target_language, source_language)
        results.append(translated)
    
    return results


def clear_translation_cache():
    """Clear the translation cache (useful for testing)."""
    global _cache
    _cache.clear()
    logger.info("Translation cache cleared")
