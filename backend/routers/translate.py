from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.translator import translate_text, batch_translate

router = APIRouter(prefix="/api", tags=["translate"])


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "en"
    source_language: str = "en"


class BatchTranslateRequest(BaseModel):
    texts: list[str]
    target_language: str = "en"
    source_language: str = "en"


class TranslateResponse(BaseModel):
    original: str
    translated: str
    target_language: str


@router.post("/translate")
async def translate(request: TranslateRequest):
    """Translate a single text to target language."""
    try:
        translated = await translate_text(
            text=request.text,
            target_language=request.target_language,
            source_language=request.source_language
        )
        
        return TranslateResponse(
            original=request.text,
            translated=translated,
            target_language=request.target_language
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@router.post("/translate/batch")
async def translate_batch(request: BatchTranslateRequest):
    """Translate multiple texts efficiently."""
    try:
        translated_texts = await batch_translate(
            texts=request.texts,
            target_language=request.target_language,
            source_language=request.source_language
        )
        
        return {
            "original": request.texts,
            "translated": translated_texts,
            "target_language": request.target_language,
            "count": len(translated_texts)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch translation failed: {str(e)}")
