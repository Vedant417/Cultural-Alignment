from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.modules.translator import translate_text, batch_translate

router = APIRouter(prefix="/api", tags=["translate"])


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "en"
    source_language: str = "en"


class TranslateResponse(BaseModel):
    original: str
    translated: str
    target_language: str


@router.post("/translate")
async def translate(request: TranslateRequest):
    """Translate a single text using MyMemory API (free, no credentials)."""
    try:
        if not request.text or request.target_language == request.source_language:
            return TranslateResponse(
                original=request.text,
                translated=request.text,
                target_language=request.target_language
            )
        
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
